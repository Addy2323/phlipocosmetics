import { createFileRoute } from "@tanstack/react-router";
import { UserX, Percent } from "lucide-react";
import { ErpPage, StatusPill } from "@/components/Erp";
import { erpAppointments, stylists, salonServices, money } from "@/data/shop";

export const Route = createFileRoute("/erp/salon")({
  head: () => ({
    meta: [
      { title: "Salon operations — Philipo ERP" },
      { name: "description", content: "Chairs, stylists, no-shows and commissions." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SalonOps,
});

function SalonOps() {
  return (
    <ErpPage
      title="Salon operations"
      subtitle="Today's chairs, stylist performance and commissions."
      actions={
        <button className="btn-base btn-outline h-10">
          <UserX className="size-4" /> Mark no-show
        </button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="card-surface p-5">
          <h2 className="font-display text-xl">Today's book</h2>
          <ul className="mt-4 space-y-3">
            {erpAppointments.map((a) => (
              <li
                key={`${a.time}-${a.client}`}
                className="flex flex-wrap items-center gap-3 rounded-xl border p-3 text-sm"
              >
                <span className="w-12 font-medium">{a.time}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{a.client}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.service} · {a.stylist}
                  </p>
                </div>
                <StatusPill status={a.status} />
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6">
          <div className="card-surface p-5">
            <h2 className="font-display text-xl">Stylists</h2>
            <ul className="mt-4 space-y-3">
              {stylists.map((s) => (
                <li key={s.id} className="flex items-center gap-3 text-sm">
                  <div className="grid size-9 place-items-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground">
                    {s.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.skills}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">★ {s.rating}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card-surface p-5">
            <h2 className="flex items-center gap-2 font-display text-xl">
              <Percent className="size-4 text-gold" /> Commissions this week
            </h2>
            <ul className="mt-4 space-y-2 text-sm">
              {stylists.map((s, i) => {
                const commission = [182000, 146000, 121000][i] ?? 0;
                return (
                  <li key={s.id} className="flex justify-between">
                    <span className="text-muted-foreground">{s.name}</span>
                    <span className="font-medium">{money(commission)}</span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
              10% of completed service value, paid monthly.
            </p>
          </div>

          <div className="card-surface p-5">
            <h2 className="font-display text-xl">Service menu</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {salonServices.map((s) => (
                <li key={s.id} className="flex justify-between gap-3">
                  <span>
                    {s.name} <span className="text-xs text-muted-foreground">· {s.duration}</span>
                  </span>
                  <span className="shrink-0 font-medium">{money(s.price)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </ErpPage>
  );
}
