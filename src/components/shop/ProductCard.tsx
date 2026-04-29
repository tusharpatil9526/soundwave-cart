import { Link } from "@tanstack/react-router";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { useShop, type Product } from "@/stores/useShop";
import { inr, discountPct } from "@/lib/format";

export function ProductCard({ product }: { product: Product }) {
  const { user } = useAuth();
  const { addToCart, toggleWishlist, wishlist } = useShop();
  const wished = wishlist.includes(product.id);
  const off = discountPct(product.mrp, product.price);
  const oos = product.stock <= 0;

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await addToCart(user?.id ?? null, product);
      toast.success("Added to cart");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleWish = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await toggleWishlist(user?.id ?? null, product.id);
      toast.success(wished ? "Removed from wishlist" : "Added to wishlist");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-card hover:border-primary/40 hover:shadow-glow"
    >
      <Link to="/product/$id" params={{ id: product.id }} className="block">
        <div className="relative aspect-square overflow-hidden bg-surface">
          {off > 0 && (
            <span className="absolute left-3 top-3 z-10 rounded-md bg-gold px-2 py-0.5 text-xs font-bold text-gold-foreground">
              {off}% OFF
            </span>
          )}
          <button
            onClick={handleWish}
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/70 backdrop-blur transition hover:bg-background"
            aria-label="Wishlist"
          >
            <Heart className={`h-4 w-4 ${wished ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
          </button>
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          {oos && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
              <span className="rounded-md bg-destructive px-3 py-1 text-xs font-bold uppercase tracking-wider text-destructive-foreground">Out of Stock</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{product.brand}</div>
          <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug">{product.name}</h3>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <div className="flex items-center gap-0.5 rounded bg-success/15 px-1.5 py-0.5 text-success">
              <span className="font-semibold">{product.rating.toFixed(1)}</span>
              <Star className="h-3 w-3 fill-current" />
            </div>
            <span className="text-muted-foreground">({product.review_count.toLocaleString()})</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-lg font-bold">{inr(product.price)}</span>
            {off > 0 && <span className="text-xs text-muted-foreground line-through">{inr(product.mrp)}</span>}
          </div>
        </div>
      </Link>
      <button
        onClick={handleAdd}
        disabled={oos}
        className="flex w-full items-center justify-center gap-2 border-t border-border bg-surface py-2.5 text-sm font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ShoppingCart className="h-4 w-4" /> Add to Cart
      </button>
    </motion.div>
  );
}