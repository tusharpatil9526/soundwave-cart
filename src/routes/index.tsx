import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Zap, Music, Headphones, Gamepad2, Activity, Mic } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductSkeleton } from "@/components/shop/Skeleton";
import type { Product } from "@/stores/useShop";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SoundCart — Premium Headphones Store" },
      { name: "description", content: "Shop premium headphones from Sony, Bose, JBL, Sennheiser, Apple, Boat. Studio-grade sound." },
    ],
  }),
  component: Home,
});

const slides = [
  { tag: "Premium Sound", title: "Hear Every Detail", sub: "Studio-grade audio engineered for audiophiles", cta: "Shop Premium", icon: Sparkles, accent: "primary" },
  { tag: "Wireless Freedom", title: "Cut The Cord", sub: "True wireless earbuds with 40+ hour playback", cta: "Shop Wireless", icon: Zap, accent: "gold" },
  { tag: "Studio Grade", title: "Built For Pros", sub: "Reference monitors trusted by Grammy winners", cta: "Shop Studio", icon: Music, accent: "primary" },
];

const categories = [
  { name: "Over-Ear", icon: Headphones },
  { name: "TWS", icon: Sparkles },
  { name: "Gaming", icon: Gamepad2 },
  { name: "Sports", icon: Activity },
  { name: "Studio", icon: Mic },
  { name: "In-Ear", icon: Music },
];

const brands = ["Sony", "Bose", "JBL", "Sennheiser", "Apple", "Boat", "Skullcandy"];

function Home() {
  const [slide, setSlide] = useState(0);
  const [featured, setFeatured] = useState<Product[] | null>(null);
  const [dealEnd] = useState(() => Date.now() + 1000 * 60 * 60 * 8);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    supabase.from("products").select("*").eq("is_featured", true).limit(8).then(({ data }) => setFeatured((data as Product[]) ?? []));
  }, []);

  useEffect(() => {
    const i = setInterval(() => setSlide((s) => (s + 1) % slides.length), 5000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  const remaining = Math.max(0, dealEnd - now);
  const hh = String(Math.floor(remaining / 3600000)).padStart(2, "0");
  const mm = String(Math.floor((remaining % 3600000) / 60000)).padStart(2, "0");
  const ss = String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0");

  const Slide = slides[slide];

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 -z-10 opacity-40" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, oklch(0.58 0.24 264 / 0.4), transparent 50%), radial-gradient(circle at 80% 70%, oklch(0.78 0.15 80 / 0.2), transparent 50%)" }} />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-2 md:py-24 lg:py-32 items-center">
          <div className="relative h-[280px] md:h-[360px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 flex flex-col justify-center"
              >
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                  <Slide.icon className={`h-3.5 w-3.5 ${Slide.accent === "gold" ? "text-gold" : "text-primary"}`} />
                  {Slide.tag}
                </div>
                <h1 className="mt-4 font-display text-4xl font-bold leading-tight md:text-6xl lg:text-7xl">
                  {Slide.title.split(" ").slice(0, -1).join(" ")} <span className={Slide.accent === "gold" ? "text-gradient-gold" : "text-gradient-primary"}>{Slide.title.split(" ").slice(-1)}</span>
                </h1>
                <p className="mt-4 max-w-md text-lg text-muted-foreground">{Slide.sub}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link to="/products" className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90">
                    {Slide.cta} <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link to="/products" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold hover:border-primary">
                    Browse All
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="absolute bottom-0 left-0 flex gap-2">
              {slides.map((_, i) => (
                <button key={i} onClick={() => setSlide(i)} className={`h-1.5 rounded-full transition-all ${i === slide ? "w-8 bg-primary" : "w-1.5 bg-muted-foreground/40"}`} />
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-8 rounded-full bg-primary/20 blur-3xl" />
            <motion.img
              key={slide}
              initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.7 }}
              src="https://images.unsplash.com/photo-1583394838336-acd977736f90?w=900"
              alt="Premium headphones"
              className="relative mx-auto w-full max-w-md rounded-3xl shadow-glow"
            />
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Shop by Category</h2>
          <Link to="/products" className="text-sm font-medium text-primary hover:underline">View all</Link>
        </div>
        <div className="mt-8 grid grid-cols-3 gap-3 md:grid-cols-6">
          {categories.map((c) => (
            <Link key={c.name} to="/products" search={{ category: c.name } as any} className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 hover:border-primary hover:shadow-glow transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
                <c.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-sm font-semibold">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* DEAL OF THE DAY */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="overflow-hidden rounded-3xl border border-gold/40 bg-gradient-to-br from-card via-card to-surface p-8 md:p-12 shadow-gold-glow">
          <div className="grid gap-6 md:grid-cols-2 items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-gold px-3 py-1 text-xs font-bold uppercase tracking-wider text-gold-foreground">
                <Sparkles className="h-3.5 w-3.5" /> Deal of the Day
              </span>
              <h3 className="mt-4 font-display text-3xl font-bold md:text-4xl">Up to <span className="text-gradient-gold">50% OFF</span> on Premium Audio</h3>
              <p className="mt-3 text-muted-foreground">Limited time offer — flagship headphones at unbeatable prices.</p>
              <Link to="/products" className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-bold text-gold-foreground hover:opacity-90">
                Shop the Deal <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="flex justify-center gap-3 md:justify-end">
              {[{ l: "HRS", v: hh }, { l: "MIN", v: mm }, { l: "SEC", v: ss }].map((t) => (
                <div key={t.l} className="rounded-2xl border border-border bg-background px-5 py-4 text-center min-w-[80px]">
                  <div className="font-display text-3xl font-bold tabular-nums">{t.v}</div>
                  <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{t.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Featured Products</h2>
          <Link to="/products" className="text-sm font-medium text-primary hover:underline">View all</Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured === null
            ? Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
            : featured.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* BRANDS */}
      <section className="border-y border-border bg-surface py-12">
        <div className="mx-auto max-w-7xl px-4">
          <p className="text-center text-xs uppercase tracking-widest text-muted-foreground">Trusted by audiophiles • Top brands</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {brands.map((b) => (
              <span key={b} className="font-display text-2xl font-bold text-muted-foreground/60 hover:text-foreground transition">{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h3 className="font-display text-3xl font-bold md:text-4xl">Stay in the <span className="text-gradient-primary">Loop</span></h3>
        <p className="mt-3 text-muted-foreground">Get exclusive deals, new launches, and audio reviews.</p>
        <form onSubmit={(e) => e.preventDefault()} className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <input type="email" required placeholder="your@email.com" className="rounded-full border border-border bg-card px-5 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 sm:w-80" />
          <button className="rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90">Subscribe</button>
        </form>
      </section>
    </div>
  );
}
