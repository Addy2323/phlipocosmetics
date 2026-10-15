import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SlidersHorizontal, Search, ArrowUpDown, Sparkles } from "lucide-react";
import { Site } from "@/components/Site";
import { ProductCard } from "@/components/ProductCard";
import { products, categories } from "@/data/shop";

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>) => ({
    category: typeof search["category"] === "string" ? search["category"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop Luxury Cosmetics & Hair Care — Philipo Cosmetics" },
      {
        name: "description",
        content:
          "Browse Philipo Cosmetics luxury skincare, velvety lipsticks, nourishing hair oils and fragrances with nationwide delivery in Tanzania.",
      },
      { property: "og:title", content: "Shop Cosmetics & Hair Care — Philipo Cosmetics" },
      {
        property: "og:description",
        content: "Luxury skincare, makeup, hair and fragrance delivered nationwide across Tanzania.",
      },
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
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "rating">("featured");

  let list = products.filter(
    (p) =>
      (cat === "All" || p.category === cat) &&
      (p.name.toLowerCase().includes(q.trim().toLowerCase()) ||
        p.tagline.toLowerCase().includes(q.trim().toLowerCase()) ||
        p.category.toLowerCase().includes(q.trim().toLowerCase()))
  );

  if (sortBy === "price-asc") {
    list = [...list].sort((a, b) => a.price - b.price);
  } else if (sortBy === "price-desc") {
    list = [...list].sort((a, b) => b.price - a.price);
  } else if (sortBy === "rating") {
    list = [...list].sort((a, b) => b.rating - a.rating);
  }

  return (
    <Site>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* Header Breadcrumb & Title */}
        <div className="border-b border-border/80 pb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose uppercase tracking-wider">
            <Sparkles className="size-3.5" />
            <span>Beauty Catalogue</span>
          </div>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl">
            {cat === "All" ? "All Beauty Essentials" : cat}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl">
            Pure ingredients, coastal-climate tested formulas, and nationwide express dispatch.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <span className="sr-only">Search products</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search serum, lipstick, hair oil…"
              className="h-12 w-full rounded-full border border-border bg-card pl-11 pr-4 text-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            {/* Category Pill Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              <SlidersHorizontal className="size-4 shrink-0 text-muted-foreground mr-1" />
              {["All", ...categories.map((c) => c.name)].map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition-all ${
                    cat === c
                      ? "border-primary bg-primary text-white shadow-sm font-semibold"
                      : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Sorting Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <ArrowUpDown className="size-3.5 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort products"
                className="h-10 rounded-full border border-border bg-card px-3 text-xs font-medium text-foreground outline-none transition-colors hover:bg-secondary"
              >
                <option value="featured">Featured Collection</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Count Indicator */}
        <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing {list.length} luxury products</span>
          {cat !== "All" && (
            <button
              onClick={() => setCat("All")}
              className="text-rose font-medium hover:underline"
            >
              Reset to all categories
            </button>
          )}
        </div>

        {/* Product Grid */}
        {list.length === 0 ? (
          <div className="card-surface mt-8 p-12 text-center border border-border">
            <p className="font-display text-2xl font-medium">No Products Found</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try adjusting your search terms or category selection.
            </p>
            <button
              onClick={() => {
                setQ("");
                setCat("All");
              }}
              className="btn-base btn-primary mt-6 text-xs"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4 lg:gap-6">
            {list.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </Site>
  );
}
