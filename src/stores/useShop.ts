import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  description: string | null;
  price: number;
  mrp: number;
  images: string[];
  specs: Record<string, string>;
  rating: number;
  review_count: number;
  stock: number;
  connectivity: string | null;
  features: string[];
  is_featured: boolean;
}

interface ShopState {
  cart: { product_id: string; quantity: number; product?: Product }[];
  wishlist: string[];
  loaded: boolean;
  loadAll: (userId: string | null) => Promise<void>;
  addToCart: (userId: string | null, product: Product, qty?: number) => Promise<void>;
  updateQty: (userId: string | null, product_id: string, qty: number) => Promise<void>;
  removeFromCart: (userId: string | null, product_id: string) => Promise<void>;
  clearCart: (userId: string | null) => Promise<void>;
  toggleWishlist: (userId: string | null, product_id: string) => Promise<void>;
}

export const useShop = create<ShopState>((set, get) => ({
  cart: [],
  wishlist: [],
  loaded: false,

  async loadAll(userId) {
    if (!userId) {
      set({ cart: [], wishlist: [], loaded: true });
      return;
    }
    const [{ data: cart }, { data: wl }] = await Promise.all([
      supabase.from("cart_items").select("product_id, quantity, products(*)").eq("user_id", userId),
      supabase.from("wishlist").select("product_id").eq("user_id", userId),
    ]);
    set({
      cart: (cart ?? []).map((r: any) => ({
        product_id: r.product_id,
        quantity: r.quantity,
        product: r.products as Product,
      })),
      wishlist: (wl ?? []).map((r: any) => r.product_id),
      loaded: true,
    });
  },

  async addToCart(userId, product, qty = 1) {
    if (!userId) throw new Error("Please sign in to add items");
    const existing = get().cart.find((c) => c.product_id === product.id);
    const newQty = (existing?.quantity ?? 0) + qty;
    await supabase.from("cart_items").upsert({ user_id: userId, product_id: product.id, quantity: newQty }, { onConflict: "user_id,product_id" });
    set((s) => {
      const idx = s.cart.findIndex((c) => c.product_id === product.id);
      const next = [...s.cart];
      if (idx >= 0) next[idx] = { ...next[idx], quantity: newQty };
      else next.push({ product_id: product.id, quantity: newQty, product });
      return { cart: next };
    });
  },

  async updateQty(userId, product_id, qty) {
    if (!userId) return;
    if (qty <= 0) return get().removeFromCart(userId, product_id);
    await supabase.from("cart_items").update({ quantity: qty }).match({ user_id: userId, product_id });
    set((s) => ({ cart: s.cart.map((c) => (c.product_id === product_id ? { ...c, quantity: qty } : c)) }));
  },

  async removeFromCart(userId, product_id) {
    if (!userId) return;
    await supabase.from("cart_items").delete().match({ user_id: userId, product_id });
    set((s) => ({ cart: s.cart.filter((c) => c.product_id !== product_id) }));
  },

  async clearCart(userId) {
    if (!userId) return;
    await supabase.from("cart_items").delete().eq("user_id", userId);
    set({ cart: [] });
  },

  async toggleWishlist(userId, product_id) {
    if (!userId) throw new Error("Please sign in to use wishlist");
    const has = get().wishlist.includes(product_id);
    if (has) {
      await supabase.from("wishlist").delete().match({ user_id: userId, product_id });
      set((s) => ({ wishlist: s.wishlist.filter((id) => id !== product_id) }));
    } else {
      await supabase.from("wishlist").insert({ user_id: userId, product_id });
      set((s) => ({ wishlist: [...s.wishlist, product_id] }));
    }
  },
}));