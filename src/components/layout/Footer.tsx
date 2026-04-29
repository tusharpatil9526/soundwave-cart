import { Link } from "@tanstack/react-router";
import { Headphones, Instagram, Twitter, Facebook, Youtube } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
                <Headphones className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold">Sound<span className="text-gradient-primary">Cart</span></span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">Premium headphones from the world's best brands. Studio-grade sound at your fingertips.</p>
            <div className="mt-4 flex gap-3 text-muted-foreground">
              <a href="#" className="hover:text-primary"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="hover:text-primary"><Twitter className="h-5 w-5" /></a>
              <a href="#" className="hover:text-primary"><Facebook className="h-5 w-5" /></a>
              <a href="#" className="hover:text-primary"><Youtube className="h-5 w-5" /></a>
            </div>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">Shop</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/products" className="hover:text-primary">All Headphones</Link></li>
              <li><Link to="/products" className="hover:text-primary">Over-Ear</Link></li>
              <li><Link to="/products" className="hover:text-primary">True Wireless</Link></li>
              <li><Link to="/products" className="hover:text-primary">Gaming</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">Help</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary">Shipping & Delivery</a></li>
              <li><a href="#" className="hover:text-primary">Returns</a></li>
              <li><a href="#" className="hover:text-primary">Warranty</a></li>
              <li><a href="#" className="hover:text-primary">Contact Us</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">We Accept</h4>
            <div className="mt-4 flex flex-wrap gap-2">
              {["VISA", "MC", "UPI", "AMEX", "RuPay"].map((p) => (
                <span key={p} className="rounded-md border border-border bg-card px-2.5 py-1 text-xs font-semibold text-muted-foreground">{p}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} SoundCart. All rights reserved. Premium audio, delivered.
        </div>
      </div>
    </footer>
  );
}