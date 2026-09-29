import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

type WishlistCtx = {
  items: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => Promise<void>;
};

const Ctx = createContext<WishlistCtx | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    if (!userId) {
      setItems([]);
      return;
    }
    let cancelled = false;
    supabase
      .from("wishlist_items")
      .select("product_id")
      .eq("user_id", userId)
      .then(({ data }) => {
        if (cancelled) return;
        setItems((data ?? []).map((r) => r.product_id));
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const toggle = async (id: string) => {
    if (!userId) return;
    if (items.includes(id)) {
      setItems((prev) => prev.filter((x) => x !== id));
      await supabase.from("wishlist_items").delete().eq("user_id", userId).eq("product_id", id);
    } else {
      setItems((prev) => [...prev, id]);
      await supabase
        .from("wishlist_items")
        .upsert({ user_id: userId, product_id: id }, { onConflict: "user_id,product_id" });
    }
  };

  return (
    <Ctx.Provider value={{ items, has: (id) => items.includes(id), toggle }}>
      {children}
    </Ctx.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}
