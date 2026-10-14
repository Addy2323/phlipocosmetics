import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { UserX, Percent, CheckCircle, Clock, RefreshCw, Scissors } from "lucide-react";
import { ErpPage, StatusPill } from "@/components/Erp";
import { money, stylists, salonServices } from "@/data/shop";
import { getSalonAppointments, updateAppointmentStatus } from "@/lib/erp-service";
import type { schema } from "@/lib/db";

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
  const [appts, setAppts] = useState<Array<typeof schema.salonAppointments.$inferSelect>>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function loadAppointments() {
    setLoading(true);
    try {
      const list = await getSalonAppointments();
      setAppts(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAppointments();
  }, []);

  async function handleStatusChange(id: string, newStatus: string) {
    setUpdatingId(id);
    try {
      await updateAppointmentStatus(id, newStatus);
      await loadAppointments();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <ErpPage
      title="Hair Salon Operations & Appointments"
      subtitle="Stylist station management, client queue, and commission calculations."
      actions={
        <button onClick={loadAppointments} className="btn-base btn-outline h-10">
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> Refresh Book
        </button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="card-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl">Today's Appointment Schedule</h2>
            <span className="text-xs text-muted-foreground">{appts.length} client(s) booked</span>
          </div>
          <ul className="space-y-3">
            {appts.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5 text-sm hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-14 font-semibold text-primary">{a.timeSlot}</span>
                  <div>
                    <p className="font-medium">{a.customerName} ({a.customerPhone})</p>
                    <p className="text-xs text-muted-foreground">
                      {a.serviceName} · <span className="font-medium text-foreground">{a.stylistName}</span> · {money(a.price)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <StatusPill status={a.status} />
                  {a.status === "Confirmed" && (
                    <button
                      disabled={updatingId === a.id}
                      onClick={() => handleStatusChange(a.id, "In chair")}
                      className="rounded-md bg-sky-500/10 text-sky-700 dark:text-sky-400 px-2.5 py-1 text-xs font-medium hover:bg-sky-500/20"
                    >
                      Seat Client
                    </button>
                  )}
                  {a.status === "In chair" && (
                    <button
                      disabled={updatingId === a.id}
                      onClick={() => handleStatusChange(a.id, "Completed")}
                      className="rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 text-xs font-medium hover:bg-emerald-500/20"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </li>
            ))}
            {appts.length === 0 && (
              <li className="p-6 text-center text-sm text-muted-foreground">
                {loading ? "Loading appointment schedule..." : "No appointments scheduled."}
              </li>
            )}
          </ul>
        </div>

        <div className="space-y-6">
          <div className="card-surface p-5">
            <h2 className="font-display text-xl">Active Stylists</h2>
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
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">★ {s.rating}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card-surface p-5">
            <h2 className="flex items-center gap-2 font-display text-xl">
              <Percent className="size-4 text-gold" /> Commissions
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
              10% of completed service value, calculated automatically upon completion.
            </p>
          </div>

          <div className="card-surface p-5">
            <h2 className="font-display text-xl">Service Menu</h2>
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
