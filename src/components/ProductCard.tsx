import { Link, useNavigate } from "@tanstack/react-router";
import { Star, Heart, ShoppingBag } from "lucide-react";
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
    <article className="group card-surface hover-lift overflow-hidden border border-border/80 bg-card transition-all duration-300">
      <Link to="/product/$slug" params={{ slug: product.slug }} className="block">
        <div className="relative aspect-square overflow-hidden bg-secondary/40">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            width={816}
            height={816}
            className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {product.badge && (
            <span className="absolute left-3 top-3 rounded-full bg-rose px-3 py-1 text-[11px] font-semibold text-white shadow-sm">
              {product.badge}
            </span>
          )}
          <button
            aria-label={wished ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
            onClick={(e) => {
              e.preventDefault();
              if (!user) {
                navigate({ to: "/login" });
                return;
              }
              void wishlist.toggle(product.id);
            }}
            className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-all hover:bg-white hover:scale-110"
          >
            <Heart className={`size-4 transition-colors ${wished ? "fill-rose text-rose" : "text-muted-foreground"}`} />
          </button>
        </div>
      </Link>
      <div className="space-y-2 p-4 sm:p-5">
        <p className="eyebrow text-rose font-medium text-[10px] tracking-wider">{product.category}</p>
        <Link to="/product/$slug" params={{ slug: product.slug }} className="block">
          <h3 className="font-display text-lg font-medium leading-tight group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Star className="size-3.5 fill-gold text-gold" />
          <span className="font-medium text-foreground">{product.rating}</span>
          <span>({product.reviews})</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px]">
          {product.stock <= 10 ? (
            <span className="text-amber-600 font-medium flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
              Only {product.stock} left in stock
            </span>
          ) : (
            <span className="text-emerald-600 font-medium flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              In stock & ready to ship
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-2 pt-0.5">
          <span className="text-base font-semibold text-primary">{money(product.price)}</span>
          {product.compareAt && (
            <span className="text-xs text-muted-foreground line-through">{money(product.compareAt)}</span>
          )}
        </div>
        <button
          onClick={() => {
            add(product.id);
            setDrawerOpen(true);
          }}
          className="btn-base btn-outline mt-3 w-full text-xs font-semibold hover:border-primary hover:bg-primary hover:text-white transition-all duration-200"
        >
          <ShoppingBag className="size-3.5 mr-1" /> Add to bag
        </button>
      </div>
    </article>
  );
}
