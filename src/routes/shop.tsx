import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SlidersHorizontal, Search, ArrowUpDown, Sparkles } from "lucide-react";
import { Site } from "@/components/Site";
import { ProductCard } from "@/components/ProductCard";
import { products, categories } from "@/data/shop";
import { getStoredProducts, PRODUCTS_UPDATE_EVENT, StoredProduct } from "@/lib/products-store";

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
        content:
          "Luxury skincare, makeup, hair and fragrance delivered nationwide across Tanzania.",
      },
    ],
  }),
  component: Shop,
});

function Shop() {
  const navigate = useNavigate({ from: "/shop" });
  const { category } = Route.useSearch();
  const matchedCategory = category
    ? categories.find(
        (c) =>
          c.name.toLowerCase() === category.toLowerCase() ||
          c.title.toLowerCase() === category.toLowerCase() ||
          (category.length >= 4 && c.name.toLowerCase().startsWith(category.toLowerCase().slice(0, 4))),
      )?.name || category
    : "All";
  const cat = category ? matchedCategory : "All";
  const setCat = (c: string) =>
    navigate({ search: { category: c === "All" ? undefined : c }, replace: true });

  const [allProducts, setAllProducts] = useState<StoredProduct[]>(() => getStoredProducts());

  useEffect(() => {
    const handleUpdate = () => {
      setAllProducts(getStoredProducts());
    };
    window.addEventListener(PRODUCTS_UPDATE_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener(PRODUCTS_UPDATE_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "rating">(
    "featured",
  );
  const [priceRange, setPriceRange] = useState<"all" | "under-40k" | "40k-60k" | "over-60k">("all");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  let list = allProducts
    .filter((p) => !p.isArchived)
    .filter((p) => {
    // Category match
    const catMatch =
      cat === "All" ||
      p.category.toLowerCase() === cat.toLowerCase() ||
      p.category.toLowerCase().includes(cat.toLowerCase()) ||
      cat.toLowerCase().includes(p.category.toLowerCase());
    // Query match
    const qMatch =
      p.name.toLowerCase().includes(q.trim().toLowerCase()) ||
      p.tagline.toLowerCase().includes(q.trim().toLowerCase()) ||
      p.category.toLowerCase().includes(q.trim().toLowerCase());
    // Price match
    let priceMatch = true;
    if (priceRange === "under-40k") priceMatch = p.price < 40000;
    else if (priceRange === "40k-60k") priceMatch = p.price >= 40000 && p.price <= 60000;
    else if (priceRange === "over-60k") priceMatch = p.price > 60000;
    // Stock match
    const stockMatch = inStockOnly ? p.stock > 0 : true;

    return catMatch && qMatch && priceMatch && stockMatch;
  });

  if (sortBy === "price-asc") {
    list = [...list].sort((a, b) => a.price - b.price);
  } else if (sortBy === "price-desc") {
    list = [...list].sort((a, b) => b.price - a.price);
  } else if (sortBy === "rating") {
    list = [...list].sort((a, b) => b.rating - a.rating);
  }

  const activeFiltersCount =
    (cat !== "All" ? 1 : 0) + (priceRange !== "all" ? 1 : 0) + (inStockOnly ? 1 : 0);

  return (
    <Site>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-10 sm:px-6">
        {/* Header Breadcrumb & Title */}
        <div className="border-b border-border/80 pb-4 sm:pb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose uppercase tracking-wider">
            <Sparkles className="size-3.5" />
            <span>Beauty Catalogue</span>
          </div>
          <h1 className="mt-1 sm:mt-2 font-display text-3xl sm:text-5xl">
            {cat === "All" ? "All Beauty Essentials" : cat}
          </h1>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground max-w-xl">
            Pure ingredients, coastal-climate tested formulas, and nationwide express dispatch.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-6 sm:mt-8 flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <label className="relative flex-1">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <span className="sr-only">Search products</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search serum, lipstick, hair oil…"
                className="h-11 sm:h-12 w-full rounded-full border border-border bg-card pl-11 pr-4 text-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
              />
            </label>
            {/* Mobile Filter Button */}
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden relative grid size-11 shrink-0 place-items-center rounded-2xl bg-[#FCEAF2] border border-[#EC008C]/20 text-[#EC008C] active:scale-95 transition-all"
              aria-label="Open filter options"
            >
              <SlidersHorizontal className="size-4.5" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 grid size-4.5 place-items-center rounded-full bg-[#EC008C] text-[9px] font-bold text-white shadow-xs">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Category Pill Filters (Desktop & horizontal scroll) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-hide">
              {["All", ...categories.map((c) => c.name)].map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`shrink-0 rounded-full border px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-medium transition-all ${
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
            <div className="hidden sm:flex items-center gap-2 shrink-0">
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
        <div className="mt-4 sm:mt-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing {list.length} luxury products</span>
          {(cat !== "All" || priceRange !== "all" || inStockOnly) && (
            <button
              onClick={() => {
                setCat("All");
                setPriceRange("all");
                setInStockOnly(false);
                setQ("");
              }}
              className="text-rose font-medium hover:underline"
            >
              Reset all filters
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
                setPriceRange("all");
                setInStockOnly(false);
              }}
              className="btn-base btn-primary mt-6 text-xs"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 lg:gap-6">
            {list.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>

      {/* ── Mobile Filter Bottom Sheet ── */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-end lg:hidden">
          <button
            aria-label="Close filter drawer"
            onClick={() => setMobileFilterOpen(false)}
            className="absolute inset-0 bg-deep/60 backdrop-blur-sm"
          />
          <div className="relative w-full rounded-t-3xl bg-card p-6 shadow-lift border-t border-border space-y-5 animate-in slide-in-from-bottom max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="size-4 text-[#EC008C]" />
                <h3 className="font-display text-lg font-semibold text-foreground">
                  Filter & Sort
                </h3>
              </div>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground font-semibold px-2 py-1"
              >
                Close
              </button>
            </div>

            {/* 1. Sort by */}
            <div>
              <p className="text-xs font-semibold text-[#77747C] uppercase tracking-wider mb-2">
                Sort by
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "featured", label: "Featured" },
                  { value: "price-asc", label: "Price: Low to High" },
                  { value: "price-desc", label: "Price: High to Low" },
                  { value: "rating", label: "Highest Rated" },
                ].map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSortBy(s.value as any)}
                    className={`p-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                      sortBy === s.value
                        ? "border-[#EC008C] bg-[#FCEAF2] text-[#EC008C] font-semibold"
                        : "border-border text-foreground hover:bg-secondary"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Price Range */}
            <div>
              <p className="text-xs font-semibold text-[#77747C] uppercase tracking-wider mb-2">
                Price Range
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "all", label: "All Prices" },
                  { value: "under-40k", label: "Under TZS 40,000" },
                  { value: "40k-60k", label: "TZS 40,000 – 60,000" },
                  { value: "over-60k", label: "Over TZS 60,000" },
                ].map((pr) => (
                  <button
                    key={pr.value}
                    onClick={() => setPriceRange(pr.value as any)}
                    className={`p-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                      priceRange === pr.value
                        ? "border-[#EC008C] bg-[#FCEAF2] text-[#EC008C] font-semibold"
                        : "border-border text-foreground hover:bg-secondary"
                    }`}
                  >
                    {pr.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Availability */}
            <div className="flex items-center justify-between border-y border-border py-3">
              <span className="text-xs font-semibold text-foreground">In Stock Only</span>
              <button
                type="button"
                onClick={() => setInStockOnly(!inStockOnly)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  inStockOnly ? "bg-[#EC008C]" : "bg-gray-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    inStockOnly ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* 4. Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setCat("All");
                  setPriceRange("all");
                  setInStockOnly(false);
                  setSortBy("featured");
                }}
                className="flex-1 py-3 rounded-2xl border border-border text-xs font-semibold text-foreground hover:bg-secondary"
              >
                Reset All
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 py-3 rounded-2xl bg-[#EC008C] text-xs font-semibold text-white shadow-md hover:bg-[#D4006F]"
              >
                Apply Filters ({list.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </Site>
  );
}
