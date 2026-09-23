import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { money, type Product } from "@/data/shop";
import { useCart } from "@/lib/cart";

export function ProductCard({ product }: { product: Product }) {
  const { add, setDrawerOpen } = useCart();
  return (
    <article className="group card-surface hover-lift overflow-hidden">
      <Link to="/product/$slug" params={{ slug: product.slug }} className="block">
        <div className="relative aspect-square overflow-hidden bg-secondary">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            width={816}
            height={816}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {product.badge && (
            <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-[11px] font-medium text-primary-foreground">
              {product.badge}
            </span>
          )}
        </div>
      </Link>
      <div className="space-y-2 p-4">
        <p className="eyebrow text-muted-foreground">{product.category}</p>
        <Link to="/product/$slug" params={{ slug: product.slug }} className="block">
          <h3 className="font-display text-lg leading-tight">{product.name}</h3>
        </Link>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="size-3.5 fill-gold text-gold" />
          {product.rating} · {product.reviews} reviews
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-medium text-primary">{money(product.price)}</span>
          {product.compareAt && (
            <span className="text-sm text-muted-foreground line-through">{money(product.compareAt)}</span>
          )}
        </div>
        <button
          onClick={() => {
            add(product.id);
            setDrawerOpen(true);
          }}
          className="btn-base btn-outline mt-2 w-full"
        >
          Add to bag
        </button>
      </div>
    </article>
  );
}
