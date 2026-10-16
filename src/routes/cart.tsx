import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2, Minus, Plus } from "lucide-react";
import { Site } from "@/components/Site";
import { money } from "@/data/shop";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your bag — Philipo Cosmetics" },
      {
        name: "description",
        content: "Review the items in your Philipo Cosmetics bag before checkout.",
      },
      { property: "og:title", content: "Your bag — Philipo Cosmetics" },
      { property: "og:description", content: "Review your items and continue to checkout." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { detailed, subtotal, setQty, remove } = useCart();
  const delivery = subtotal > 150000 || subtotal === 0 ? 0 : 5000;

  return (
    <Site>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-4xl">Your bag</h1>

        {detailed.length === 0 ? (
          <div className="card-surface mt-8 p-12 text-center">
            <p className="font-display text-2xl">Your bag is empty</p>
            <p className="mt-2 text-sm text-muted-foreground">Start with our best sellers.</p>
            <Link to="/shop" search={{ category: "All" }} className="btn-base btn-primary mt-6">
              Shop now
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
            <div className="space-y-4">
              {detailed.map(({ product, qty }) => (
                <div key={product.id} className="card-surface flex gap-4 p-4">
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    width={112}
                    height={112}
                    className="size-24 rounded-lg object-cover sm:size-28"
                  />
                  <div className="flex-1">
                    <p className="font-display text-lg">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{money(product.price)}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex items-center gap-2 rounded-full border px-2 py-1">
                        <button
                          aria-label="Decrease quantity"
                          onClick={() => setQty(product.id, qty - 1)}
                          className="grid size-8 place-items-center rounded-full hover:bg-secondary"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm">{qty}</span>
                        <button
                          aria-label="Increase quantity"
                          onClick={() => setQty(product.id, qty + 1)}
                          className="grid size-8 place-items-center rounded-full hover:bg-secondary"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => remove(product.id)}
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-4" /> Remove
                      </button>
                    </div>
                  </div>
                  <p className="font-medium">{money(product.price * qty)}</p>
                </div>
              ))}
            </div>

            <aside className="card-surface h-fit p-5">
              <h2 className="font-display text-xl">Summary</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd>{money(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Delivery</dt>
                  <dd>{delivery === 0 ? "Free" : money(delivery)}</dd>
                </div>
                <div className="flex justify-between border-t pt-3 font-medium">
                  <dt>Total</dt>
                  <dd className="text-primary">{money(subtotal + delivery)}</dd>
                </div>
              </dl>
              <Link to="/checkout" className="btn-base btn-primary mt-5 w-full">
                Continue to checkout
              </Link>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Free delivery on orders above {money(150000)}
              </p>
            </aside>
          </div>
        )}
      </div>
    </Site>
  );
}
