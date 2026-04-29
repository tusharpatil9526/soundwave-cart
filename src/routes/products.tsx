import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductSkeleton } from "@/components/shop/Skeleton";
import { Filter, X } from "lucide-react";
import type { Product } from "@/stores/useShop";

export const Route = createFileRoute("/products")({
  head: () => ({ meta: [{ title: "Shop Headphones — SoundCart" }, { name: "description", content: "Browse all premium headphones with filters by brand, category, price and more." }] }),
  component: Products,
});

const BRANDS = ["Sony", "Bose", "JBL", "Sennheiser", "Apple", "Boat", "Skullcandy"];
const CATS = ["Over-Ear", "In-Ear", "TWS", "Gaming", "Sports", "Studio"];
const FEATURES = ["Noise Cancelling", "Waterproof", "Foldable", "Mic included"];

function Products() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [brands, setBrands] = useState<string[]>([]);
  const [cats, setCats] = useState<string[]>([]);
  const [feats, setFeats] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(50000);
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState("popularity");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.from("products").select("*").then(({ data }) => setProducts((data as Product[]) ?? []));
  }, []);

  const filtered = useMemo(() => {
    if (!products) return null;
    let r = products.filter((p) =>
      (brands.length === 0 || brands.includes(p.brand)) &&
      (cats.length === 0 || cats.includes(p.category)) &&
      (feats.length === 0 || feats.every((f) => p.features.includes(f))) &&
      p.price <= maxPrice &&
      p.rating >= minRating
    );
    switch (sort) {
      case "price-asc": r = [...r].sort((a, b) => a.price - b.price); break;
      case "price-desc": r = [...r].sort((a, b) => b.price - a.price); break;
      case "rating": r = [...r].sort((a, b) => b.rating - a.rating); break;
      case "newest": r = [...r].sort((a, b) => b.name.localeCompare(a.name)); break;
      default: r = [...r].sort((a, b) => b.review_count - a.review_count);
    }
    return r;
  }, [products, brands, cats, feats, maxPrice, minRating, sort]);

  const toggle = (arr: string[], set: (a: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const FilterPanel = (
    <aside className="space-y-6">
      <div>
        <h4 className="font-display text-sm font-semibold uppercase tracking-wider">Brand</h4>
        <div className="mt-3 space-y-2">
          {BRANDS.map((b) => (
            <label key={b} className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" checked={brands.includes(b)} onChange={() => toggle(brands, setBrands, b)} className="h-4 w-4 accent-primary" /> {b}
            </label>
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-display text-sm font-semibold uppercase tracking-wider">Category</h4>
        <div className="mt-3 space-y-2">
          {CATS.map((c) => (
            <label key={c} className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" checked={cats.includes(c)} onChange={() => toggle(cats, setCats, c)} className="h-4 w-4 accent-primary" /> {c}
            </label>
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-display text-sm font-semibold uppercase tracking-wider">Max Price</h4>
        <input type="range" min={500} max={50000} step={500} value={maxPrice} onChange={(e) => setMaxPrice(+e.target.value)} className="mt-3 w-full accent-primary" />
        <div className="mt-1 flex justify-between text-xs text-muted-foreground"><span>₹500</span><span className="font-semibold text-foreground">₹{maxPrice.toLocaleString()}</span></div>
      </div>
      <div>
        <h4 className="font-display text-sm font-semibold uppercase tracking-wider">Rating</h4>
        <div className="mt-3 space-y-2">
          {[4, 3, 0].map((r) => (
            <label key={r} className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="radio" name="rating" checked={minRating === r} onChange={() => setMinRating(r)} className="h-4 w-4 accent-primary" />
              {r === 0 ? "All" : `${r}★ & above`}
            </label>
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-display text-sm font-semibold uppercase tracking-wider">Features</h4>
        <div className="mt-3 space-y-2">
          {FEATURES.map((f) => (
            <label key={f} className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" checked={feats.includes(f)} onChange={() => toggle(feats, setFeats, f)} className="h-4 w-4 accent-primary" /> {f}
            </label>
          ))}
        </div>
      </div>
    </aside>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">All Headphones</h1>
          <p className="mt-1 text-sm text-muted-foreground">{filtered?.length ?? "..."} products</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setOpen(true)} className="lg:hidden inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
            <Filter className="h-4 w-4" /> Filters
          </button>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none">
            <option value="popularity">Popularity</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Best Rated</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <div className="hidden lg:block sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl border border-border bg-card p-5">
          {FilterPanel}
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered === null
            ? Array.from({ length: 6 }).map((_, i) => <ProductSkeleton key={i} />)
            : filtered.length === 0
            ? <div className="col-span-full rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">No products match your filters.</div>
            : filtered.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] overflow-y-auto bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">Filters</h3>
              <button onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-4">{FilterPanel}</div>
          </div>
        </div>
      )}
    </div>
  );
}
