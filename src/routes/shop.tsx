import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SlidersHorizontal, Search } from "lucide-react";
import { Site } from "@/components/Site";
import { ProductCard } from "@/components/ProductCard";
import { products, categories } from "@/data/shop";

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>) => ({
    category: typeof search.category === "string" ? search.category : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop cosmetics, skincare & hair — Philipo Cosmetics" },
      {
        name: "description",
        content: "Browse Philipo Cosmetics skincare, makeup, hair and fragrance with delivery across Tanzania.",
      },
      { property: "og:title", content: "Shop — Philipo Cosmetics" },
      { property: "og:description", content: "Skincare, makeup, hair and fragrance, delivered nationwide." },
    ],
  }),
  component: Shop,
});

function Shop() {
  const navigate = useNavigate({ from: "/shop" });
  const { category } = Route.useSearch();
  const cat = category && categories.some((c) => c.name === category) ? category : "All";
  const setCat = (c: string) =>
    navigate({ search: { category: c === "All" ? undefined : c }, replace: true });
  const [q, setQ] = useState("");
  const list = products.filter(
    (p) =>
      (cat === "All" || p.category === cat) && p.name.toLowerCase().includes(q.trim().toLowerCase()),
  );

  return (
    <Site>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <p className="eyebrow text-rose">Catalogue</p>
        <h1 className="mt-2 font-display text-4xl">{cat === "All" ? "All products" : cat}</h1>

        <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center">
          <label className="relative flex-1">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <span className="sr-only">Search products</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search serum, lipstick, hair oil…"
              className="h-12 w-full rounded-full border bg-card pl-11 pr-4 text-sm outline-none focus-visible:border-primary"
            />
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <SlidersHorizontal className="size-4 shrink-0 text-muted-foreground" />
            {["All", ...categories.map((c) => c.name)].map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors ${
                  cat === c ? "border-primary bg-primary text-primary-foreground" : "hover:bg-secondary"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">{list.length} products</p>

        {list.length === 0 ? (
          <div className="card-surface mt-6 p-12 text-center">
            <p className="font-display text-2xl">Nothing matched that search</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try a different word, or clear the filters to see everything.
            </p>
            <button
              onClick={() => {
                setQ("");
                setCat("All");
              }}
              className="btn-base btn-primary mt-6"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {list.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </Site>
  );
}
