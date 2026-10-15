import { Link, useNavigate } from "@tanstack/react-router";
import { Star, Heart, ShoppingBag } from "lucide-react";
import { money, type Product } from "@/data/shop";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useWishlist } from "@/lib/wishlist";

/**
 * Compact mobile product card for horizontal scrolling collections.
 * Designed to match the premium Philipo mobile reference:
 * - Rounded corners, subtle shadow
 * - Heart wishlist icon top-right
 * - Product image, name, stars, price
 * - Pink add-to-cart button
 */
export function MobileProductCard({ product }: { product: Product }) {
  const { add, setDrawerOpen } = useCart();
  const { user } = useAuth();
  const wishlist = useWishlist();
  const navigate = useNavigate();
  const wished = wishlist.has(product.id);

  return (
    <article className="rounded-2xl bg-white border border-border/60 shadow-xs overflow-hidden transition-all duration-300 active:scale-[0.98]">
      <Link to="/product/$slug" params={{ slug: product.slug }} className="block">
        <div className="relative aspect-square overflow-hidden bg-[#FCEAF2]/40">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            width={320}
            height={320}
            className="size-full object-cover"
          />
          {/* Badge */}
          {product.badge && (
            <span className="absolute left-2 top-2 rounded-full bg-[#EC008C] px-2 py-0.5 text-[8px] font-bold text-white shadow-sm uppercase tracking-wider">
              {product.badge}
            </span>
          )}
          {/* Wishlist */}
          <button
            aria-label={wished ? `Remove ${product.name} from wishlist` : `Save ${product.name}`}
            onClick={(e) => {
              e.preventDefault();
              if (!user) {
                navigate({ to: "/login" });
                return;
              }
              void wishlist.toggle(product.id);
            }}
            className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-white/90 shadow-xs backdrop-blur transition-all hover:bg-white hover:scale-110"
          >
            <Heart
              className={`size-3.5 transition-colors ${
                wished ? "fill-[#EC008C] text-[#EC008C]" : "text-[#77747C]"
              }`}
            />
          </button>
        </div>
      </Link>

      <div className="p-2.5">
        <Link to="/product/$slug" params={{ slug: product.slug }} className="block">
          <h3 className="text-[11px] font-semibold text-[#25232B] leading-tight line-clamp-2 min-h-[28px]">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1 mt-1">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`size-2.5 ${
                  i < Math.floor(product.rating)
                    ? "fill-[#C6A56B] text-[#C6A56B]"
                    : "text-border"
                }`}
              />
            ))}
          </div>
          <span className="text-[9px] text-[#77747C]">({product.reviews})</span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between mt-1.5">
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-bold text-[#243B90]">{money(product.price)}</span>
            {product.compareAt && (
              <span className="text-[9px] text-[#77747C] line-through">{money(product.compareAt)}</span>
            )}
          </div>
          {/* Add to cart icon button */}
          <button
            onClick={() => {
              add(product.id);
              setDrawerOpen(true);
            }}
            aria-label={`Add ${product.name} to bag`}
            className="grid size-7 place-items-center rounded-lg bg-[#EC008C] text-white shadow-sm hover:bg-[#D4006F] transition-colors active:scale-90"
          >
            <ShoppingBag className="size-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}
