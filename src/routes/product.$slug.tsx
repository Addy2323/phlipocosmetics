import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Star, Truck, RotateCcw, Minus, Plus, Check } from "lucide-react";
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
  const [qty, setQty] = useState(1);
  const available = product.stock - product.reserved;

  return (
    <Site>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <nav className="text-xs text-muted-foreground">
          <Link to="/">Home</Link> / <Link to="/shop" search={{ category: "All" }}>Shop</Link> / {product.category}
        </nav>

        <div className="mt-6 grid gap-10 md:grid-cols-2">
          <div className="card-surface overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              width={816}
              height={816}
              className="aspect-square w-full object-cover"
            />
          </div>

          <div>
            <p className="eyebrow text-rose">{product.category}</p>
            <h1 className="mt-2 font-display text-4xl">{product.name}</h1>
            <p className="mt-1 text-muted-foreground">{product.tagline}</p>

            <div className="mt-4 flex items-center gap-2 text-sm">
              <Star className="size-4 fill-gold text-gold" />
              {product.rating} · {product.reviews} reviews
              <span className="text-muted-foreground">· SKU {product.sku}</span>
            </div>

            <div className="mt-6 flex items-baseline gap-3">
              <span className="font-display text-3xl text-primary">{money(product.price)}</span>
              {product.compareAt && (
                <span className="text-muted-foreground line-through">{money(product.compareAt)}</span>
              )}
            </div>

            <p className="mt-2 text-sm">
              {available > 10 ? (
                <span className="text-success">In stock — {available} available</span>
              ) : (
                <span className="text-warning">Only {available} left</span>
              )}
            </p>

            <p className="mt-6 text-muted-foreground">{product.description}</p>

            <ul className="mt-6 space-y-2 text-sm">
              {product.details.map((d) => (
                <li key={d} className="flex items-center gap-2">
                  <Check className="size-4 text-primary" /> {d}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3 rounded-full border px-3 py-2">
                <button
                  aria-label="Decrease quantity"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="grid size-8 place-items-center rounded-full hover:bg-secondary"
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-6 text-center">{qty}</span>
                <button
                  aria-label="Increase quantity"
                  onClick={() => setQty(qty + 1)}
                  className="grid size-8 place-items-center rounded-full hover:bg-secondary"
                >
                  <Plus className="size-4" />
                </button>
              </div>
              <button
                onClick={() => {
                  add(product.id, qty);
                  setDrawerOpen(true);
                }}
                className="btn-base btn-primary flex-1 sm:flex-none"
              >
                Add to bag
              </button>
            </div>

            <div className="mt-8 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
              <p className="flex items-center gap-2">
                <Truck className="size-4 text-primary" /> Dar es Salaam same-day, upcountry 2–4 days
              </p>
              <p className="flex items-center gap-2">
                <RotateCcw className="size-4 text-primary" /> 7-day returns on sealed items
              </p>
            </div>
          </div>
        </div>

        <h2 className="mt-16 font-display text-3xl">You may also like</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {products
            .filter((p) => p.id !== product.id)
            .map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
        </div>
      </div>
    </Site>
  );
}
