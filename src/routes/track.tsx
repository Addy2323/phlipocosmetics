import { createFileRoute } from "@tanstack/react-router";
import { Check, Truck, Phone, MapPin } from "lucide-react";
import { Site } from "@/components/Site";
import { deliverySteps, money, BRAND } from "@/data/shop";

export const Route = createFileRoute("/track")({
  head: () => ({
    meta: [
      { title: "Track your order — Philipo Cosmetics" },
      { name: "description", content: "Follow your Philipo Cosmetics delivery from packing to your door." },
      { property: "og:title", content: "Track your order — Philipo Cosmetics" },
      { property: "og:description", content: "Live delivery status, courier details and estimated arrival." },
    ],
  }),
  component: Track,
});

function Track() {
  const currentIndex = 4;

  return (
    <Site>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="eyebrow text-rose">Delivery</p>
        <h1 className="mt-2 font-display text-4xl">Order PC-24871</h1>
        <p className="mt-2 text-muted-foreground">
          3 items · {money(142500)} · Paid by mobile money
        </p>

        <div className="card-surface mt-8 p-6">
          <div className="flex items-center gap-3 rounded-xl bg-secondary p-4">
            <Truck className="size-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Out for delivery</p>
              <p className="text-xs text-muted-foreground">Expected today between 15:30 and 16:30</p>
            </div>
          </div>

          <ol className="mt-8 space-y-6">
            {deliverySteps.map((s, i) => {
              const done = i <= currentIndex;
              return (
                <li key={s.label} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      className={`grid size-8 shrink-0 place-items-center rounded-full border ${
                        done ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {done ? <Check className="size-4" /> : i + 1}
                    </span>
                    {i < deliverySteps.length - 1 && (
                      <span className={`mt-1 w-px flex-1 ${done ? "bg-primary" : "bg-border"}`} />
                    )}
                  </div>
                  <div className="pb-2">
                    <p className={done ? "font-medium" : "text-muted-foreground"}>{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.at}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="card-surface mt-6 p-6">
          <h2 className="font-display text-xl">Your courier</h2>
          <div className="mt-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Baraka Mwinyi</p>
              <p className="text-xs text-muted-foreground">Philipo Logistics · Bike T 421 DFA</p>
            </div>
            <a href={`tel:${BRAND.phone.replace(/\s/g, "")}`} className="btn-base btn-outline h-10">
              <Phone className="size-4" /> Call
            </a>
          </div>
          <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4 text-primary" /> Delivering to Masaki, Chole Road, {BRAND.city}
          </p>
        </div>
      </div>
    </Site>
  );
}
