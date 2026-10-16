import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { products, type Product } from "@/data/shop";
import { getStoredProducts } from "@/lib/products-store";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type CartLine = { id: string; qty: number };

type CartCtx = {
  lines: CartLine[];
  detailed: { product: Product; qty: number }[];
  count: number;
  subtotal: number;
  add: (id: string, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  drawerOpen: boolean;
  setDrawerOpen: (v: boolean) => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "philipo-cart-v1";

async function fetchRemote(userId: string): Promise<CartLine[]> {
  const { data } = await supabase
    .from("cart_items")
    .select("product_id, qty")
    .eq("user_id", userId);
  return (data ?? []).map((r) => ({ id: r.product_id, qty: r.qty }));
}

async function persistRemote(userId: string, lines: CartLine[]) {
  if (lines.length > 0) {
    await supabase.from("cart_items").upsert(
      lines.map((l) => ({
        user_id: userId,
        product_id: l.id,
        qty: l.qty,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "user_id,product_id" },
    );
    const ids = lines.map((l) => l.id).join(",");
    await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", userId)
      .not("product_id", "in", `(${ids})`);
  } else {
    await supabase.from("cart_items").delete().eq("user_id", userId);
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [lines, setLines] = useState<CartLine[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Which identity the current lines were hydrated for: "guest" or a user id.
  const hydratedFor = useRef<string | null>(null);

  // Guest bag: restore from this device.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      setLines([]);
    }
    hydratedFor.current = "guest";
  }, []);

  // On sign-in: merge the on-device bag into the account bag (union, larger qty wins)
  // so nothing the shopper picked before signing in is lost, on any device.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const remote = await fetchRemote(userId);
      if (cancelled) return;
      setLines((local) => {
        const merged = new Map<string, number>();
        for (const l of remote) merged.set(l.id, l.qty);
        for (const l of local) merged.set(l.id, Math.max(merged.get(l.id) ?? 0, l.qty));
        const out = [...merged.entries()].map(([id, qty]) => ({ id, qty }));
        hydratedFor.current = userId;
        void persistRemote(userId, out);
        return out;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Persist every change: localStorage always, account bag when signed in (debounced).
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      /* offline-safe: ignore storage failures */
    }
    if (!userId || hydratedFor.current !== userId) return;
    const t = setTimeout(() => void persistRemote(userId, lines), 400);
    return () => clearTimeout(t);
  }, [lines, userId]);

  const value = useMemo<CartCtx>(() => {
    const catalog = getStoredProducts();
    const detailed = lines
      .map((l) => ({
        product: (catalog.find((p) => p.id === l.id) || products.find((p) => p.id === l.id))!,
        qty: l.qty,
      }))
      .filter((l) => Boolean(l.product));
    return {
      lines,
      detailed,
      count: detailed.reduce((n, l) => n + l.qty, 0),
      subtotal: detailed.reduce((n, l) => n + l.qty * l.product.price, 0),
      add: (id, qty = 1) =>
        setLines((prev) =>
          prev.some((l) => l.id === id)
            ? prev.map((l) => (l.id === id ? { ...l, qty: l.qty + qty } : l))
            : [...prev, { id, qty }],
        ),
      setQty: (id, qty) =>
        setLines((prev) =>
          qty <= 0 ? prev.filter((l) => l.id !== id) : prev.map((l) => (l.id === id ? { ...l, qty } : l)),
        ),
      remove: (id) => setLines((prev) => prev.filter((l) => l.id !== id)),
      clear: () => setLines([]),
      drawerOpen,
      setDrawerOpen,
    };
  }, [lines, drawerOpen]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
