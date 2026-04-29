import { type ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useShop } from "@/stores/useShop";

export function Layout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const loadAll = useShop((s) => s.loadAll);

  useEffect(() => {
    if (!loading) loadAll(user?.id ?? null);
  }, [user?.id, loading, loadAll]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "var(--color-card)",
            color: "var(--color-foreground)",
            border: "1px solid var(--color-border)",
            borderRadius: "12px",
          },
        }}
      />
    </div>
  );
}