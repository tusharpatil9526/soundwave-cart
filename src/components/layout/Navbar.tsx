import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search, ShoppingCart, Heart, User, LogOut, Package, Menu, X, Headphones } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useShop } from "@/stores/useShop";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/format";
import type { Product } from "@/stores/useShop";

export function Navbar() {
  const { user, signOut } = useAuth();
  const cart = useShop((s) => s.cart);
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const cartCount = cart.reduce((a, c) => a + c.quantity, 0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (q.trim().length < 2) return setResults([]);
      const { data } = await supabase
        .from("products")
        .select("*")
        .or(`name.ilike.%${q}%,brand.ilike.%${q}%`)
        .limit(6);
      setResults((data as Product[]) ?? []);
      setOpen(true);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
            <Headphones className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">
            Sound<span className="text-gradient-primary">Cart</span>
          </span>
        </Link>

        <div ref={ref} className="relative hidden flex-1 max-w-xl md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => results.length && setOpen(true)}
            placeholder="Search headphones, brands, models..."
            className="w-full rounded-full border border-border bg-surface pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {open && results.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-xl border border-border bg-card shadow-card">
              {results.map((p) => (
                <Link
                  key={p.id}
                  to="/product/$id"
                  params={{ id: p.id }}
                  onClick={() => { setOpen(false); setQ(""); }}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors"
                >
                  <img src={p.images[0]} alt={p.name} className="h-10 w-10 rounded object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.brand}</div>
                  </div>
                  <div className="text-sm font-semibold text-primary">{inr(p.price)}</div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <nav className="ml-auto flex items-center gap-1 sm:gap-2">
          <Link to="/products" className="hidden rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground sm:block">Shop</Link>
          <Link to="/wishlist" className="relative rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition" aria-label="Wishlist">
            <Heart className="h-5 w-5" />
          </Link>
          <Link to="/cart" className="relative rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition" aria-label="Cart">
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-gold-foreground">
                {cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative">
              <button onClick={() => setUserOpen((o) => !o)} className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary text-sm font-semibold text-primary-foreground">
                {(user.user_metadata?.name ?? user.email ?? "U")[0].toUpperCase()}
              </button>
              {userOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-border bg-card shadow-card">
                  <Link to="/profile" onClick={() => setUserOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent">
                    <User className="h-4 w-4" /> Profile
                  </Link>
                  <Link to="/profile" onClick={() => setUserOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent">
                    <Package className="h-4 w-4" /> My Orders
                  </Link>
                  <button onClick={() => { setUserOpen(false); signOut(); navigate({ to: "/" }); }} className="flex w-full items-center gap-2 border-t border-border px-3 py-2.5 text-sm text-destructive hover:bg-accent">
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="rounded-full bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90">
              Sign in
            </Link>
          )}

          <button onClick={() => setMenuOpen((m) => !m)} className="ml-1 rounded-md p-2 md:hidden" aria-label="Menu">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>
      </div>

      {menuOpen && (
        <div className="border-t border-border bg-surface md:hidden">
          <div className="mx-auto max-w-7xl space-y-2 px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search..."
                className="w-full rounded-full border border-border bg-background pl-10 pr-4 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <Link onClick={() => setMenuOpen(false)} to="/products" className="block rounded-md px-3 py-2 text-sm hover:bg-accent">Shop All</Link>
            <Link onClick={() => setMenuOpen(false)} to="/wishlist" className="block rounded-md px-3 py-2 text-sm hover:bg-accent">Wishlist</Link>
            <Link onClick={() => setMenuOpen(false)} to="/cart" className="block rounded-md px-3 py-2 text-sm hover:bg-accent">Cart</Link>
          </div>
        </div>
      )}
    </header>
  );
}