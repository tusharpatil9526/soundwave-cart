import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, Circle, Package, User as UserIcon, MapPin, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "My Account — SoundCart" }] }),
  component: Profile,
});

function Profile() {
  const { user, loading, signOut } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState<"profile" | "orders" | "addresses">("orders");
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);

  useEffect(() => { if (!loading && !user) nav({ to: "/login" }); }, [user, loading, nav]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => setProfile(data));
    supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => setOrders(data ?? []));
    supabase.from("addresses").select("*").eq("user_id", user.id).then(({ data }) => setAddresses(data ?? []));
  }, [user]);

  if (!user) return null;

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("profiles").upsert({ id: user.id, name: profile.name, phone: profile.phone });
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-3xl font-bold">My Account</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="h-fit space-y-1 rounded-2xl border border-border bg-card p-3">
          {[
            { k: "orders" as const, l: "My Orders", i: Package },
            { k: "profile" as const, l: "Profile", i: UserIcon },
            { k: "addresses" as const, l: "Addresses", i: MapPin },
          ].map((t) => (
            <button key={t.k} onClick={() => setTab(t.k)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${tab === t.k ? "bg-gradient-primary text-primary-foreground" : "hover:bg-accent"}`}>
              <t.i className="h-4 w-4" /> {t.l}
            </button>
          ))}
          <Link to="/wishlist" className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-accent">❤ Wishlist</Link>
          <button onClick={() => { signOut(); nav({ to: "/" }); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-destructive hover:bg-accent"><LogOut className="h-4 w-4" /> Logout</button>
        </aside>

        <div>
          {tab === "profile" && profile && (
            <form onSubmit={updateProfile} className="space-y-4 rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-xl font-bold">Profile Info</h2>
              <div><label className="text-xs uppercase text-muted-foreground">Email</label><input disabled value={user.email ?? ""} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm opacity-60" /></div>
              <div><label className="text-xs uppercase text-muted-foreground">Name</label><input value={profile.name ?? ""} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none" /></div>
              <div><label className="text-xs uppercase text-muted-foreground">Phone</label><input value={profile.phone ?? ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none" /></div>
              <button className="rounded-full bg-gradient-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-glow">Save Changes</button>
            </form>
          )}

          {tab === "orders" && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">No orders yet. <Link to="/products" className="text-primary underline">Start shopping</Link></div>
              ) : orders.map((o) => (
                <div key={o.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground">Order #{o.id.slice(0, 8).toUpperCase()}</div>
                      <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                    </div>
                    <div className="text-right">
                      <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">{o.status}</span>
                      <div className="mt-1 font-display text-lg font-bold">{inr(Number(o.total))}</div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2 overflow-x-auto scrollbar-hide">
                    {(o.items as any[]).map((it, i) => (
                      <div key={i} className="flex shrink-0 items-center gap-2 rounded-lg bg-surface p-2">
                        <img src={it.image} alt="" className="h-10 w-10 rounded object-cover" />
                        <div className="text-xs"><div className="line-clamp-1 max-w-[140px] font-semibold">{it.name}</div><div className="text-muted-foreground">Qty {it.quantity}</div></div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 flex items-center justify-between gap-1">
                    {(o.tracking_steps as any[]).map((s, i, arr) => (
                      <div key={s.step} className="flex flex-1 items-center">
                        <div className="flex flex-col items-center gap-1">
                          {s.done ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                          <span className={`text-[10px] font-semibold ${s.done ? "text-foreground" : "text-muted-foreground"}`}>{s.step}</span>
                        </div>
                        {i < arr.length - 1 && <div className={`mx-1 h-0.5 flex-1 ${arr[i + 1].done ? "bg-success" : "bg-border"}`} />}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "addresses" && (
            <div className="space-y-3">
              {addresses.length === 0 && <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">No saved addresses. Add one at checkout.</div>}
              {addresses.map((a) => (
                <div key={a.id} className="flex items-start justify-between rounded-2xl border border-border bg-card p-5">
                  <div>
                    <div className="flex items-center gap-2"><span className="font-semibold">{a.name}</span><span className="rounded bg-surface px-2 py-0.5 text-xs uppercase">{a.type}</span></div>
                    <p className="mt-1 text-sm text-muted-foreground">{a.street}, {a.city}, {a.state} - {a.pincode}</p>
                    <p className="text-sm text-muted-foreground">📞 {a.phone}</p>
                  </div>
                  <button onClick={async () => { await supabase.from("addresses").delete().eq("id", a.id); setAddresses((x) => x.filter((y) => y.id !== a.id)); toast.success("Removed"); }} className="text-xs text-destructive hover:underline">Delete</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
