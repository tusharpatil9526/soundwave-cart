import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Star, ShoppingCart, Zap, Heart, Truck, Shield, RotateCcw, Minus, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useShop, type Product } from "@/stores/useShop";
import { inr, discountPct } from "@/lib/format";

export const Route = createFileRoute("/product/$id")({
  component: PD,
});

function PD() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const { addToCart, toggleWishlist, wishlist } = useShop();
  const [p, setP] = useState<Product | null>(null);
  const [img, setImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<"overview" | "specs" | "reviews">("overview");
  const [reviews, setReviews] = useState<any[]>([]);
  const [related, setRelated] = useState<Product[]>([]);

  useEffect(() => {
    supabase.from("products").select("*").eq("id", id).single().then(({ data }) => setP(data as Product));
    supabase.from("reviews").select("*").eq("product_id", id).order("created_at", { ascending: false }).then(({ data }) => setReviews(data ?? []));
  }, [id]);

  useEffect(() => {
    if (!p) return;
    supabase.from("products").select("*").eq("category", p.category).neq("id", p.id).limit(4).then(({ data }) => setRelated((data as Product[]) ?? []));
  }, [p]);

  if (!p) return <div className="mx-auto max-w-7xl px-4 py-20"><div className="h-96 animate-pulse rounded-2xl bg-card" /></div>;

  const off = discountPct(p.mrp, p.price);
  const wished = wishlist.includes(p.id);

  const add = async () => {
    try { await addToCart(user?.id ?? null, p, qty); toast.success("Added to cart"); }
    catch (e: any) { toast.error(e.message); }
  };
  const buy = async () => { await add(); nav({ to: "/cart" }); };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <motion.div key={img} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="aspect-square overflow-hidden rounded-2xl border border-border bg-card">
            <img src={p.images[img]} alt={p.name} className="h-full w-full object-cover" />
          </motion.div>
          <div className="mt-3 flex gap-2">
            {p.images.map((src, i) => (
              <button key={i} onClick={() => setImg(i)} className={`h-20 w-20 overflow-hidden rounded-lg border-2 ${i === img ? "border-primary" : "border-border"}`}>
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="rounded-md bg-surface px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{p.brand}</span>
          <h1 className="mt-3 font-display text-3xl font-bold md:text-4xl">{p.name}</h1>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex items-center gap-1 rounded bg-success/15 px-2 py-0.5 text-sm text-success">
              <span className="font-semibold">{p.rating.toFixed(1)}</span><Star className="h-3.5 w-3.5 fill-current" />
            </div>
            <span className="text-sm text-muted-foreground">{p.review_count.toLocaleString()} reviews</span>
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="font-display text-4xl font-bold">{inr(p.price)}</span>
            {off > 0 && <><span className="text-lg text-muted-foreground line-through">{inr(p.mrp)}</span><span className="text-sm font-bold text-success">{off}% off</span></>}
          </div>
          {off > 0 && <p className="mt-1 text-sm text-success">You save {inr(p.mrp - p.price)}</p>}

          <div className="mt-6 rounded-xl border border-border bg-card p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bank Offers</h4>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• 10% off on HDFC Credit Cards (max ₹1500)</li>
              <li>• No-cost EMI from ₹{Math.round(p.price / 12).toLocaleString()}/month</li>
              <li>• Exchange offer up to ₹5000</li>
            </ul>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <span className="text-sm font-semibold">Quantity</span>
            <div className="flex items-center rounded-lg border border-border">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2 hover:bg-accent"><Minus className="h-4 w-4" /></button>
              <span className="w-10 text-center font-semibold">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="p-2 hover:bg-accent"><Plus className="h-4 w-4" /></button>
            </div>
            <span className="text-xs text-muted-foreground">{p.stock > 10 ? "In stock" : `Only ${p.stock} left`}</span>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button onClick={add} disabled={p.stock <= 0} className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-50">
              <ShoppingCart className="h-4 w-4" /> Add to Cart
            </button>
            <button onClick={buy} disabled={p.stock <= 0} className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-gold py-3 font-bold text-gold-foreground shadow-gold-glow hover:opacity-90 disabled:opacity-50">
              <Zap className="h-4 w-4" /> Buy Now
            </button>
            <button onClick={async () => { try { await toggleWishlist(user?.id ?? null, p.id); toast.success(wished ? "Removed" : "Saved"); } catch(e:any) { toast.error(e.message); } }} className="rounded-full border border-border bg-card p-3 hover:border-primary">
              <Heart className={`h-5 w-5 ${wished ? "fill-destructive text-destructive" : ""}`} />
            </button>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 text-xs">
            {[{ i: Truck, t: "Free Delivery" }, { i: Shield, t: "1 Year Warranty" }, { i: RotateCcw, t: "7-Day Returns" }].map((b, i) => (
              <div key={i} className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-3 text-center">
                <b.i className="h-5 w-5 text-primary" /><span>{b.t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-12">
        <div className="flex gap-1 border-b border-border">
          {(["overview","specs","reviews"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-3 text-sm font-semibold capitalize ${tab === t ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>{t}</button>
          ))}
        </div>
        <div className="py-6">
          {tab === "overview" && <p className="max-w-3xl text-muted-foreground leading-relaxed">{p.description}</p>}
          {tab === "specs" && (
            <table className="w-full max-w-2xl text-sm">
              <tbody>
                {Object.entries(p.specs).map(([k, v]) => (
                  <tr key={k} className="border-b border-border">
                    <td className="py-2.5 capitalize text-muted-foreground">{k}</td>
                    <td className="py-2.5 font-semibold">{String(v)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {tab === "reviews" && (
            <div className="space-y-4">
              {reviews.length === 0 ? <p className="text-muted-foreground">No reviews yet. Be the first!</p> :
                reviews.map((r) => (
                  <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2"><div className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-gold text-gold" : "text-muted-foreground"}`} />)}</div><span className="text-sm font-semibold">{r.title}</span></div>
                    <p className="mt-2 text-sm text-muted-foreground">{r.body}</p>
                    <p className="mt-2 text-xs text-muted-foreground">— {r.user_name ?? "Customer"}</p>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-2xl font-bold">Related Products</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((r) => (
              <Link key={r.id} to="/product/$id" params={{ id: r.id }} className="group overflow-hidden rounded-2xl border border-border bg-card hover:border-primary">
                <img src={r.images[0]} alt={r.name} className="aspect-square w-full object-cover group-hover:scale-105 transition" />
                <div className="p-3"><div className="text-xs text-muted-foreground">{r.brand}</div><div className="line-clamp-1 text-sm font-semibold">{r.name}</div><div className="mt-1 font-bold text-primary">{inr(r.price)}</div></div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
