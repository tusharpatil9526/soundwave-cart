import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { CheckCircle2, CreditCard, Wallet, Banknote, Smartphone } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useShop } from "@/stores/useShop";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — SoundCart" }] }),
  component: Checkout,
});

function Checkout() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const { cart, clearCart } = useShop();
  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selAddr, setSelAddr] = useState<string>("");
  const [pay, setPay] = useState("upi");
  const [placing, setPlacing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", street: "", city: "", state: "", pincode: "", type: "Home" });

  useEffect(() => { if (!loading && !user) nav({ to: "/login" }); }, [user, loading, nav]);

  useEffect(() => {
    if (!user) return;
    supabase.from("addresses").select("*").eq("user_id", user.id).then(({ data }) => {
      setAddresses(data ?? []);
      if (data?.[0]) setSelAddr(data[0].id);
    });
  }, [user]);

  const subtotal = cart.reduce((s, c) => s + (c.product?.price ?? 0) * c.quantity, 0);
  const delivery = subtotal > 0 && subtotal < 1000 ? 49 : 0;
  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + delivery + gst;

  const addAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { data, error } = await supabase.from("addresses").insert({ ...form, user_id: user.id }).select().single();
    if (error) return toast.error(error.message);
    setAddresses((a) => [...a, data]);
    setSelAddr(data.id);
    setForm({ name: "", phone: "", street: "", city: "", state: "", pincode: "", type: "Home" });
    toast.success("Address saved");
  };

  const placeOrder = async () => {
    if (!user || !selAddr) return;
    setPlacing(true);
    const addr = addresses.find((a) => a.id === selAddr);
    const items = cart.map((c) => ({ product_id: c.product_id, name: c.product?.name, price: c.product?.price, image: c.product?.images?.[0], quantity: c.quantity }));
    const { data, error } = await supabase.from("orders").insert({
      user_id: user.id, items, address: addr, payment_method: pay,
      subtotal, discount: 0, delivery_charge: delivery, gst, total,
      status: "Placed",
      tracking_steps: [
        { step: "Placed", at: new Date().toISOString(), done: true },
        { step: "Processing", done: false }, { step: "Shipped", done: false },
        { step: "Out for Delivery", done: false }, { step: "Delivered", done: false },
      ],
    }).select().single();
    setPlacing(false);
    if (error) return toast.error(error.message);
    await clearCart(user.id);
    setOrderId(data.id);
  };

  if (orderId) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }} className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-success/20">
          <CheckCircle2 className="h-12 w-12 text-success" />
        </motion.div>
        <h1 className="mt-6 font-display text-3xl font-bold">Order Placed! 🎉</h1>
        <p className="mt-2 text-muted-foreground">Order ID</p>
        <p className="font-mono text-sm font-semibold text-primary">{orderId.slice(0, 8).toUpperCase()}</p>
        <div className="mt-6 flex flex-col gap-3">
          <Link to="/profile" className="rounded-full bg-gradient-primary py-3 font-semibold text-primary-foreground shadow-glow">Track Order</Link>
          <Link to="/products" className="rounded-full border border-border bg-card py-3 font-semibold">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0) return <div className="mx-auto max-w-md py-20 text-center"><p className="text-muted-foreground">Your cart is empty.</p><Link to="/products" className="mt-4 inline-block text-primary underline">Shop now</Link></div>;

  const Steps = (
    <div className="mb-8 flex items-center justify-center gap-2">
      {["Address", "Summary", "Payment"].map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${step > i ? "bg-success text-background" : step === i + 1 ? "bg-gradient-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"}`}>{i + 1}</div>
          <span className={`hidden text-sm font-semibold sm:inline ${step >= i + 1 ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
          {i < 2 && <div className={`h-px w-12 ${step > i + 1 ? "bg-success" : "bg-border"}`} />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-center">Checkout</h1>
      <div className="mt-6">{Steps}</div>

      {step === 1 && (
        <div className="space-y-4">
          {addresses.map((a) => (
            <label key={a.id} className={`block cursor-pointer rounded-2xl border p-4 ${selAddr === a.id ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
              <input type="radio" checked={selAddr === a.id} onChange={() => setSelAddr(a.id)} className="mr-2 accent-primary" />
              <span className="font-semibold">{a.name}</span> <span className="text-xs uppercase rounded bg-surface px-2 py-0.5 ml-2">{a.type}</span>
              <p className="mt-1 text-sm text-muted-foreground">{a.street}, {a.city}, {a.state} - {a.pincode} • {a.phone}</p>
            </label>
          ))}
          <details className="rounded-2xl border border-border bg-card p-4">
            <summary className="cursor-pointer font-semibold">+ Add new address</summary>
            <form onSubmit={addAddress} className="mt-4 grid gap-3 sm:grid-cols-2">
              {(["name","phone","pincode","city","state","street"] as const).map((k) => (
                <input key={k} required placeholder={k[0].toUpperCase()+k.slice(1)} value={(form as any)[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className={`rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none ${k === "street" ? "sm:col-span-2" : ""}`} />
              ))}
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm sm:col-span-2"><option>Home</option><option>Work</option><option>Other</option></select>
              <button className="rounded-lg bg-primary py-2 font-semibold text-primary-foreground sm:col-span-2">Save Address</button>
            </form>
          </details>
          <button disabled={!selAddr} onClick={() => setStep(2)} className="w-full rounded-full bg-gradient-primary py-3 font-semibold text-primary-foreground shadow-glow disabled:opacity-50">Continue</button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          {cart.map((c) => c.product && (
            <div key={c.product_id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <img src={c.product.images[0]} alt="" className="h-14 w-14 rounded-lg object-cover" />
              <div className="flex-1 min-w-0"><div className="line-clamp-1 text-sm font-semibold">{c.product.name}</div><div className="text-xs text-muted-foreground">Qty: {c.quantity}</div></div>
              <div className="font-semibold">{inr(c.product.price * c.quantity)}</div>
            </div>
          ))}
          <div className="rounded-xl border border-border bg-card p-4 text-sm space-y-1.5">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{inr(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{delivery === 0 ? <span className="text-success">FREE</span> : inr(delivery)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">GST</span><span>{inr(gst)}</span></div>
            <div className="flex justify-between border-t border-border pt-2 font-bold text-lg"><span>Total</span><span className="text-primary">{inr(total)}</span></div>
          </div>
          <div className="flex gap-3"><button onClick={() => setStep(1)} className="flex-1 rounded-full border border-border py-3 font-semibold">Back</button><button onClick={() => setStep(3)} className="flex-1 rounded-full bg-gradient-primary py-3 font-semibold text-primary-foreground shadow-glow">Continue to Payment</button></div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {[{ k: "upi", l: "UPI", i: Smartphone }, { k: "card", l: "Card", i: CreditCard }, { k: "netbank", l: "Net Banking", i: Wallet }, { k: "emi", l: "EMI", i: Wallet }, { k: "cod", l: "COD", i: Banknote }].map((m) => (
              <button key={m.k} onClick={() => setPay(m.k)} className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-xs font-semibold ${pay === m.k ? "border-primary bg-primary/10" : "border-border bg-card"}`}>
                <m.i className="h-5 w-5" /> {m.l}
              </button>
            ))}
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            {pay === "upi" && <p>Enter UPI ID or scan QR code at next step.</p>}
            {pay === "card" && <p>Secure card payment processed via encrypted gateway.</p>}
            {pay === "netbank" && <p>Select your bank to be redirected for secure login.</p>}
            {pay === "emi" && <p>Choose tenure: 3, 6, 9, or 12 months on supported cards.</p>}
            {pay === "cod" && <p>Pay in cash when your order is delivered. ₹49 COD fee may apply.</p>}
          </div>
          <button disabled={placing} onClick={placeOrder} className="w-full rounded-full bg-gradient-gold py-4 text-lg font-bold text-gold-foreground shadow-gold-glow disabled:opacity-50">
            {placing ? "Processing..." : `Pay ${inr(total)}`}
          </button>
          <button onClick={() => setStep(2)} className="w-full rounded-full border border-border py-3 font-semibold">Back</button>
        </div>
      )}
    </div>
  );
}
