import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Star, Truck, RotateCcw, Minus, Plus, Check, ShieldCheck, ShoppingBag, Zap } from "lucide-react";
import { Site } from "@/components/Site";
import { ProductCard } from "@/components/ProductCard";
import { products, money } from "@/data/shop";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/product/$slug")({
  loader: ({ params }) => {
    const product = products.find((p) => p.slug === params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Product not found — Philipo Cosmetics" }, { name: "robots", content: "noindex" }] };
    }
    const { product } = loaderData;
    return {
      meta: [
        { title: `${product.name} — Philipo Cosmetics` },
        { name: "description", content: product.description },
        { property: "og:title", content: `${product.name} — Philipo Cosmetics` },
        { property: "og:description", content: product.description },
      ],
    };
  },
  component: ProductDetail,
});

function ProductDetail() {
  const { product } = Route.useLoaderData();
  const { add, setDrawerOpen } = useCart();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const available = product.stock - product.reserved;

  function handleBuyNow() {
    add(product.id, qty);
    navigate({ to: "/checkout" });
  }

  return (
    <Site>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Breadcrumb */}
        <nav className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link to="/shop" search={{ category: "All" }} className="hover:text-primary">Shop</Link>
          <span>/</span>
          <Link to="/shop" search={{ category: product.category }} className="hover:text-primary">{product.category}</Link>
          <span>/</span>
          <span className="text-foreground font-medium truncate max-w-xs">{product.name}</span>
        </nav>

        {/* Main Product Layout */}
        <div className="mt-8 grid gap-10 md:grid-cols-2 lg:gap-14">
          {/* Gallery View */}
          <div className="card-surface overflow-hidden border border-border/80 bg-white shadow-soft">
            <div className="relative aspect-square overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                width={816}
                height={816}
                className="size-full object-cover transition-transform duration-700 hover:scale-105"
              />
              {product.badge && (
                <span className="absolute left-4 top-4 rounded-full bg-rose px-3.5 py-1 text-xs font-semibold text-white shadow-sm">
                  {product.badge}
                </span>
              )}
            </div>
          </div>

          {/* Product Meta & Actions */}
          <div className="flex flex-col justify-center">
            <p className="eyebrow text-rose font-semibold tracking-wider">{product.category}</p>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl lg:text-5xl font-medium leading-tight text-foreground">
              {product.name}
            </h1>
            <p className="mt-2 text-base text-muted-foreground font-light">{product.tagline}</p>

            <div className="mt-4 flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1 text-gold">
                <Star className="size-4 fill-gold text-gold" />
                <span className="font-semibold text-foreground">{product.rating}</span>
              </div>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">{product.reviews} verified reviews</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground font-mono">SKU: {product.sku}</span>
            </div>

            <div className="mt-6 flex items-baseline gap-4 border-y border-border/80 py-4">
              <span className="font-display text-3xl sm:text-4xl font-semibold text-primary">
                {money(product.price)}
              </span>
              {product.compareAt && (
                <span className="text-sm text-muted-foreground line-through">
                  {money(product.compareAt)}
                </span>
              )}
              {product.compareAt && (
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-primary">
                  Save {money(product.compareAt - product.price)}
                </span>
              )}
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs">
              {available > 10 ? (
                <span className="flex items-center gap-1.5 font-medium text-emerald-600">
                  <span className="size-2 rounded-full bg-emerald-600 animate-pulse" /> In Stock ({available} units available for express dispatch)
                </span>
              ) : (
                <span className="flex items-center gap-1.5 font-medium text-amber-600">
                  <span className="size-2 rounded-full bg-amber-600" /> Only {available} left in stock
                </span>
              )}
            </div>

            <p className="mt-6 text-sm text-muted-foreground leading-relaxed">
              {product.description}
            </p>

            {/* Specifications / Highlights */}
            <div className="mt-6 space-y-2.5 rounded-2xl bg-secondary/40 p-4 border border-secondary">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Formula Highlights</p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                {product.details.map((d) => (
                  <li key={d} className="flex items-center gap-2">
                    <Check className="size-3.5 text-primary shrink-0" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Purchase Controls */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {/* Quantity stepper */}
              <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 shadow-sm">
                <button
                  aria-label="Decrease quantity"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="grid size-8 place-items-center rounded-full hover:bg-secondary transition-colors"
                >
                  <Minus className="size-3.5" />
                </button>
                <span className="w-8 text-center text-sm font-semibold">{qty}</span>
                <button
                  aria-label="Increase quantity"
                  onClick={() => setQty(qty + 1)}
                  className="grid size-8 place-items-center rounded-full hover:bg-secondary transition-colors"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>

              {/* Add to Bag */}
              <button
                onClick={() => {
                  add(product.id, qty);
                  setDrawerOpen(true);
                }}
                className="btn-base btn-primary flex-1 sm:flex-none px-6 shadow-soft"
              >
                <ShoppingBag className="size-4" /> Add to Bag
              </button>

              {/* Buy Now instant checkout */}
              <button
                onClick={handleBuyNow}
                className="btn-base bg-rose text-white hover:bg-rose/90 shadow-soft px-6 font-semibold"
              >
                <Zap className="size-4" /> Buy Now
              </button>
            </div>

            {/* Trust Assurances */}
            <div className="mt-8 grid gap-3 text-xs text-muted-foreground sm:grid-cols-2 border-t border-border pt-4">
              <p className="flex items-center gap-2">
                <Truck className="size-4 text-primary shrink-0" />
                <span>Dar es Salaam same-day, upcountry 2–4 days</span>
              </p>
              <p className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary shrink-0" />
                <span>100% Genuine batch guaranteed</span>
              </p>
              <p className="flex items-center gap-2">
                <RotateCcw className="size-4 text-primary shrink-0" />
                <span>7-day return on sealed items</span>
              </p>
            </div>
          </div>
        </div>

        {/* Related Products */}
        <div className="mt-20 border-t border-border pt-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="eyebrow text-rose">Curated Pairs</p>
              <h2 className="font-display text-3xl font-medium mt-1">You May Also Admire</h2>
            </div>
            <Link to="/shop" search={{ category: "All" }} className="btn-base btn-outline text-xs">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:gap-6">
            {products
              .filter((p) => p.id !== product.id)
              .slice(0, 4)
              .map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
          </div>
        </div>
      </div>
    </Site>
  );
}
