import { Link, useNavigate } from "@tanstack/react-router";
import { Star, Heart } from "lucide-react";
import { money, type Product } from "@/data/shop";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useWishlist } from "@/lib/wishlist";

export function ProductCard({ product }: { product: Product }) {
  const { add, setDrawerOpen } = useCart();
  const { user } = useAuth();
  const wishlist = useWishlist();
  const navigate = useNavigate();
  const wished = wishlist.has(product.id);
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
          <button
            aria-label={wished ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
            onClick={(e) => {
              e.preventDefault();
              if (!user) {
                navigate({ to: "/auth" });
                return;
              }
              void wishlist.toggle(product.id);
            }}
            className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-card/90 shadow-sm backdrop-blur transition-colors hover:bg-card"
          >
            <Heart className={`size-4 ${wished ? "fill-primary text-primary" : "text-muted-foreground"}`} />
          </button>
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
