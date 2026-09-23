import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, CreditCard, Smartphone, Banknote, Loader2, AlertCircle } from "lucide-react";
import { Site } from "@/components/Site";
import { money, BRAND } from "@/data/shop";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Philipo Cosmetics" },
      { name: "description", content: "Secure checkout with mobile money, card or cash on delivery." },
      { property: "og:title", content: "Checkout — Philipo Cosmetics" },
      { property: "og:description", content: "Pay by mobile money, card or cash on delivery." },
    ],
  }),
  component: Checkout,
});

const steps = ["Delivery", "Payment", "Confirm"] as const;

const payments = [
  { id: "momo", label: "Mobile money", hint: "M-Pesa, Tigo Pesa, Airtel Money", icon: Smartphone },
  { id: "card", label: "Card", hint: "Visa / Mastercard", icon: CreditCard },
  { id: "cod", label: "Cash on delivery", hint: "Dar es Salaam only", icon: Banknote },
];

function Checkout() {
  const { subtotal, detailed, clear } = useCart();
  const [step, setStep] = useState(0);
  const [pay, setPay] = useState("momo");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const delivery = subtotal > 150000 ? 0 : 5000;

  const placeOrder = () => {
    setState("loading");
    setTimeout(() => {
      // Demo behaviour: mobile money succeeds, card shows the failure state.
      if (pay === "card") setState("error");
      else {
        setState("done");
        clear();
      }
    }, 1400);
  };

  if (state === "done") {
    return (
      <Site>
        <div className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
          <div className="mx-auto grid size-20 place-items-center rounded-full bg-primary text-primary-foreground rise-in">
            <Check className="size-9" />
          </div>
          <h1 className="mt-6 font-display text-4xl">Order confirmed</h1>
          <p className="mt-3 text-muted-foreground">
            Order <strong>PC-24872</strong> is confirmed. We have sent an SMS to your number and you can follow
            every step of the delivery.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/track" className="btn-base btn-primary">
              Track my order
            </Link>
            <Link to="/shop" className="btn-base btn-outline">
              Keep shopping
            </Link>
          </div>
        </div>
      </Site>
    );
  }

  return (
    <Site>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-4xl">Checkout</h1>

        <ol className="mt-6 flex items-center gap-3 text-sm">
          {steps.map((s, i) => (
            <li key={s} className="flex items-center gap-3">
              <span
                className={`grid size-8 place-items-center rounded-full border text-xs ${
                  i <= step ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {i + 1}
              </span>
              <span className={i <= step ? "" : "text-muted-foreground"}>{s}</span>
              {i < steps.length - 1 && <span className="h-px w-8 bg-border" />}
            </li>
          ))}
        </ol>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
          <div className="card-surface p-6">
            {step === 0 && (
              <div className="space-y-4">
                <h2 className="font-display text-2xl">Delivery details</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full name" placeholder="Zawadi Mremi" />
                  <Field label="Phone number" placeholder={BRAND.phone} />
                  <Field label="City" placeholder={BRAND.city} />
                  <Field label="Area / street" placeholder="Masaki, Chole Road" />
                </div>
                <Field label="Delivery notes (optional)" placeholder="Gate colour, landmark…" />
                <button onClick={() => setStep(1)} className="btn-base btn-primary mt-2">
                  Continue to payment
                </button>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <h2 className="font-display text-2xl">Payment method</h2>
                {payments.map(({ id, label, hint, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setPay(id)}
                    className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-colors ${
                      pay === id ? "border-primary bg-secondary" : "hover:bg-secondary/60"
                    }`}
                  >
                    <Icon className="size-5 text-primary" />
                    <span>
                      <span className="block text-sm font-medium">{label}</span>
                      <span className="block text-xs text-muted-foreground">{hint}</span>
                    </span>
                  </button>
                ))}
                <div className="flex gap-3">
                  <button onClick={() => setStep(0)} className="btn-base btn-outline">
                    Back
                  </button>
                  <button onClick={() => setStep(2)} className="btn-base btn-primary">
                    Review order
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="font-display text-2xl">Confirm and pay</h2>
                <ul className="space-y-3">
                  {detailed.map(({ product, qty }) => (
                    <li key={product.id} className="flex justify-between text-sm">
                      <span>
                        {qty} × {product.name}
                      </span>
                      <span>{money(product.price * qty)}</span>
                    </li>
                  ))}
                </ul>
                {state === "error" && (
                  <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
                    <AlertCircle className="mt-0.5 size-4 text-destructive" />
                    <span>
                      We could not confirm your card payment. Your bag is saved — try again or pay with mobile
                      money.
                    </span>
                  </div>
                )}
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="btn-base btn-outline">
                    Back
                  </button>
                  <button
                    onClick={placeOrder}
                    disabled={state === "loading" || detailed.length === 0}
                    className="btn-base btn-primary disabled:opacity-60"
                  >
                    {state === "loading" && <Loader2 className="size-4 animate-spin" />}
                    {state === "loading" ? "Confirming payment…" : `Pay ${money(subtotal + delivery)}`}
                  </button>
                </div>
              </div>
            )}
          </div>

          <aside className="card-surface h-fit p-5">
            <h2 className="font-display text-xl">Order summary</h2>
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
          </aside>
        </div>
      </div>
    </Site>
  );
}

function Field({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        placeholder={placeholder}
        className="mt-1 h-12 w-full rounded-xl border bg-background px-4 text-sm outline-none focus-visible:border-primary"
      />
    </label>
  );
}
