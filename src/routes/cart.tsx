import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import toast from "react-hot-toast";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useShop } from "@/stores/useShop";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Your Cart — SoundCart" }] }),
  component: Cart,
});

function Cart() {
  const { user } = useAuth();
  const nav = useNavigate();
  const { cart, updateQty, removeFromCart } = useShop();
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState(0);

  const subtotal = cart.reduce((s, c) => s + (c.product?.price ?? 0) * c.quantity, 0);
  const delivery = subtotal > 0 && subtotal < 1000 ? 49 : 0;
  const gst = Math.round(subtotal * 0.18);
  const total = subtotal - discount + delivery + gst;

  const apply = async () => {
    const { data } = await supabase.from("coupons").select("*").eq("code", code.toUpperCase()).maybeSingle();
    if (!data) return toast.error("Invalid coupon");
    if (subtotal < Number(data.min_order)) return toast.error(`Min order ${inr(Number(data.min_order))}`);
    const d = data.discount_type === "percent" ? Math.round(subtotal * Number(data.discount_value) / 100) : Number(data.discount_value);
    setDiscount(d);
    toast.success(`Coupon applied: -${inr(d)}`);
  };

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-card border border-border"><ShoppingBag className="h-10 w-10 text-muted-foreground" /></div>
        <h1 className="mt-6 font-display text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">Discover premium audio gear waiting for you.</p>
        <Link to="/products" className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow">Shop Now <ArrowRight className="h-4 w-4" /></Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-display text-3xl font-bold">Shopping Cart</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {cart.map((c) => c.product && (
            <div key={c.product_id} className="flex gap-4 rounded-2xl border border-border bg-card p-4">
              <Link to="/product/$id" params={{ id: c.product_id }} className="shrink-0">
                <img src={c.product.images[0]} alt={c.product.name} className="h-24 w-24 rounded-lg object-cover" />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">{c.product.brand}</div>
                <Link to="/product/$id" params={{ id: c.product_id }} className="line-clamp-2 font-semibold hover:text-primary">{c.product.name}</Link>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center rounded-lg border border-border">
                    <button onClick={() => updateQty(user?.id ?? null, c.product_id, c.quantity - 1)} className="p-1.5 hover:bg-accent"><Minus className="h-3.5 w-3.5" /></button>
                    <span className="w-8 text-center text-sm font-semibold">{c.quantity}</span>
                    <button onClick={() => updateQty(user?.id ?? null, c.product_id, c.quantity + 1)} className="p-1.5 hover:bg-accent"><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-lg font-bold">{inr(c.product.price * c.quantity)}</div>
                  </div>
                </div>
              </div>
              <button onClick={() => removeFromCart(user?.id ?? null, c.product_id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>

        <aside className="h-fit space-y-4 rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-20">
          <h3 className="font-display text-lg font-bold">Price Details</h3>
          <div className="flex gap-2">
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Coupon code" className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none" />
            <button onClick={apply} className="rounded-lg bg-gold px-4 py-2 text-sm font-bold text-gold-foreground">Apply</button>
          </div>
          <p className="text-xs text-muted-foreground">Try: SOUND10, FIRST20, BASS50</p>
          <div className="space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{inr(subtotal)}</span></div>
            {discount > 0 && <div className="flex justify-between text-success"><span>Discount</span><span>−{inr(discount)}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{delivery === 0 ? <span className="text-success">FREE</span> : inr(delivery)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">GST (18%)</span><span>{inr(gst)}</span></div>
            <div className="flex justify-between border-t border-border pt-3 font-display text-lg font-bold"><span>Total</span><span className="text-primary">{inr(total)}</span></div>
          </div>
          <button onClick={() => nav({ to: "/checkout", search: { discount } as any })} className="w-full rounded-full bg-gradient-primary py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">Place Order</button>
        </aside>
      </div>
    </div>
  );
}
