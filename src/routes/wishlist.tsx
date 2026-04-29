import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useShop, type Product } from "@/stores/useShop";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/wishlist")({
  head: () => ({ meta: [{ title: "Wishlist — SoundCart" }] }),
  component: Wishlist,
});

function Wishlist() {
  const { user } = useAuth();
  const { wishlist, toggleWishlist, addToCart } = useShop();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (wishlist.length === 0) return setProducts([]);
    supabase.from("products").select("*").in("id", wishlist).then(({ data }) => setProducts((data as Product[]) ?? []));
  }, [wishlist]);

  if (!user) return <div className="mx-auto max-w-md px-4 py-20 text-center"><Heart className="mx-auto h-12 w-12 text-muted-foreground" /><h1 className="mt-4 font-display text-2xl font-bold">Sign in to view wishlist</h1><Link to="/login" className="mt-6 inline-block rounded-full bg-gradient-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow">Sign in</Link></div>;

  if (products.length === 0) return <div className="mx-auto max-w-md px-4 py-20 text-center"><Heart className="mx-auto h-12 w-12 text-muted-foreground" /><h1 className="mt-4 font-display text-2xl font-bold">Your wishlist is empty</h1><Link to="/products" className="mt-6 inline-block rounded-full bg-gradient-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow">Browse Products</Link></div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-display text-3xl font-bold">Wishlist <span className="text-muted-foreground">({products.length})</span></h1>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <div key={p.id} className="overflow-hidden rounded-2xl border border-border bg-card">
            <Link to="/product/$id" params={{ id: p.id }}><img src={p.images[0]} alt={p.name} className="aspect-square w-full object-cover" /></Link>
            <div className="p-4">
              <div className="text-xs text-muted-foreground">{p.brand}</div>
              <Link to="/product/$id" params={{ id: p.id }} className="line-clamp-2 text-sm font-semibold">{p.name}</Link>
              <div className="mt-2 font-display text-lg font-bold">{inr(p.price)}</div>
              <div className="mt-3 flex gap-2">
                <button onClick={async () => { try { await addToCart(user.id, p); toast.success("Moved to cart"); await toggleWishlist(user.id, p.id); } catch (e:any) { toast.error(e.message); } }} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"><ShoppingCart className="h-3.5 w-3.5" /> Move to Cart</button>
                <button onClick={() => toggleWishlist(user.id, p.id)} className="rounded-lg border border-border p-2 hover:border-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
