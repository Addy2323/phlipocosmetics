import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  UserX,
  Percent,
  CheckCircle,
  Clock,
  RefreshCw,
  Scissors,
  Filter,
  Calendar as CalendarIcon,
  Search,
  Phone,
  Mail,
  FileText,
  User,
  Sparkles,
} from "lucide-react";
import { ErpPage, StatusPill } from "@/components/Erp";
import { money } from "@/data/shop";
import {
  SALON_CATEGORIES,
  SALON_SERVICES,
  SALON_STYLISTS,
  SalonAppointmentRecord,
  getStoredAppointments,
  saveStoredAppointment,
} from "@/lib/salon-data";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/erp/salon")({
  head: () => ({
    meta: [
      { title: "Salon Operations & Management — Philipo ERP" },
      {
        name: "description",
        content: "Chairs, stylists, categories, services, and appointment bookings.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SalonOps,
});

function SalonOps() {
  const [appts, setAppts] = useState<SalonAppointmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [stylistFilter, setStylistFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");

  // Tabs
  const [activeTab, setActiveTab] = useState<"appointments" | "categories" | "stylists">(
    "appointments",
  );

  async function loadAppointments() {
    setLoading(true);
    try {
      // 1. Fetch from Supabase
      const { data } = await (supabase as any)
        .from("salon_appointments")
        .select("*")
        .order("created_at", { ascending: false });

      const local = getStoredAppointments();
      if (data && data.length > 0) {
        // Map Supabase snake_case to CamelCase
        const remoteAppts: SalonAppointmentRecord[] = data.map((d: any) => ({
          id: d.id,
          customerName: d.customer_name,
          customerPhone: d.customer_phone,
          customerEmail: d.customer_email || undefined,
          categoryId: d.category_id || "CAT-1",
          categoryName: d.category_name || "Hair Styling",
          serviceId: d.service_id,
          serviceName: d.service_name,
          stylistId: d.stylist_id,
          stylistName: d.stylist_name,
          appointmentDate: d.appointment_date,
          timeSlot: d.time_slot,
          endTime: d.end_time || "16:00",
          duration: d.duration || "2 hours",
          status: d.status || "CONFIRMED",
          paymentStatus: d.payment_status || "SUCCESSFUL",
          paymentMethod: d.payment_method || "momo",
          paymentReference: d.payment_reference || `MOMO-${d.id}`,
          amountPaid: d.price || 35000,
          notes: d.notes || undefined,
          price: d.price || 35000,
          createdAt: d.created_at || new Date().toISOString(),
        }));

        // Merge with local (avoiding duplicates)
        const combined = [...local];
        for (const rem of remoteAppts) {
          if (!combined.some((c) => c.id === rem.id)) {
            combined.push(rem);
          }
        }
        setAppts(combined);
      } else {
        setAppts(local);
      }
    } catch (err) {
      console.warn("Falling back to stored local appointments", err);
      setAppts(getStoredAppointments());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAppointments();
  }, []);

  function handleStatusChange(id: string, newStatus: SalonAppointmentRecord["status"]) {
    setUpdatingId(id);
    const existing = appts.find((a) => a.id === id);
    if (existing) {
      const updated: SalonAppointmentRecord = { ...existing, status: newStatus };
      saveStoredAppointment(updated);
      setAppts((prev) => prev.map((a) => (a.id === id ? updated : a)));

      // Sync to Supabase in background
      Promise.resolve(
        (supabase as any)
          .from("salon_appointments")
          .update({ status: newStatus })
          .eq("id", id),
      ).catch(() => {});
    }
    setUpdatingId(null);
  }

  // Filtered Appointments
  const filteredAppts = appts.filter((a) => {
    if (statusFilter !== "ALL" && a.status !== statusFilter) return false;
    if (stylistFilter !== "ALL" && a.stylistId !== stylistFilter) return false;
    if (dateFilter && a.appointmentDate !== dateFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = a.customerName.toLowerCase().includes(q);
      const matchPhone = a.customerPhone.includes(q);
      const matchRef = a.id.toLowerCase().includes(q);
      const matchService = a.serviceName.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchRef && !matchService) return false;
    }
    return true;
  });

  return (
    <ErpPage
      title="Hair Salon Operations & Appointments"
      subtitle="Manage chairs, customer bookings, stylists, service categories, and commissions."
      actions={
        <button onClick={loadAppointments} className="btn-base btn-outline h-10">
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> Refresh Book
        </button>
      }
    >
      {/* Top Navigation Tabs */}
      <div className="flex border-b border-border mb-6 space-x-4">
        <button
          onClick={() => setActiveTab("appointments")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "appointments"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Appointments ({appts.length})
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "categories"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Service Categories & Menu ({SALON_SERVICES.length})
        </button>
        <button
          onClick={() => setActiveTab("stylists")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "stylists"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Stylists & Commissions ({SALON_STYLISTS.length})
        </button>
      </div>

      {activeTab === "appointments" && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="card-surface p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative min-w-[200px]">
                <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search customer, phone, ref, service..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border bg-background pl-8 pr-3 py-1.5 text-xs focus:outline-hidden"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border bg-background px-3 py-1.5 text-xs"
              >
                <option value="ALL">All Statuses</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="IN_CHAIR">In Chair</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="NO_SHOW">No Show</option>
              </select>

              {/* Stylist Filter */}
              <select
                value={stylistFilter}
                onChange={(e) => setStylistFilter(e.target.value)}
                className="rounded-lg border bg-background px-3 py-1.5 text-xs"
              >
                <option value="ALL">All Stylists</option>
                {SALON_STYLISTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              {/* Date Filter */}
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="rounded-lg border bg-background px-3 py-1.5 text-xs"
              />

              {(searchQuery || statusFilter !== "ALL" || stylistFilter !== "ALL" || dateFilter) && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("ALL");
                    setStylistFilter("ALL");
                    setDateFilter("");
                  }}
                  className="text-xs text-rose-500 font-semibold hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>

            <span className="text-muted-foreground font-medium">
              Showing {filteredAppts.length} of {appts.length} bookings
            </span>
          </div>

          {/* Appointments List */}
          <div className="card-surface p-5">
            <div className="space-y-3">
              {filteredAppts.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4 text-sm hover:bg-secondary/20 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary font-bold text-xs shrink-0">
                      <span>{a.timeSlot}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{a.customerName}</span>
                        <span className="text-xs text-muted-foreground font-mono">#{a.id}</span>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="size-3" /> {a.customerPhone}
                        </span>
                        {a.customerEmail && (
                          <span className="flex items-center gap-1">
                            <Mail className="size-3" /> {a.customerEmail}
                          </span>
                        )}
                        <span>·</span>
                        <span className="font-semibold text-foreground">
                          {a.serviceName} ({a.categoryName})
                        </span>
                        <span>·</span>
                        <span className="text-foreground">Stylist: {a.stylistName}</span>
                        <span>·</span>
                        <span className="font-bold text-primary">{money(a.price)}</span>
                      </div>

                      {a.notes && (
                        <p className="mt-2 text-xs bg-secondary/40 p-2 rounded-lg text-muted-foreground border border-border">
                          <strong>Note:</strong> {a.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-2">
                    <StatusPill status={a.status} />

                    {a.status === "CONFIRMED" && (
                      <button
                        disabled={updatingId === a.id}
                        onClick={() => handleStatusChange(a.id, "IN_CHAIR")}
                        className="rounded-md bg-sky-500/10 text-sky-700 dark:text-sky-400 px-3 py-1.5 text-xs font-semibold hover:bg-sky-500/20"
                      >
                        Seat Client
                      </button>
                    )}

                    {a.status === "IN_CHAIR" && (
                      <button
                        disabled={updatingId === a.id}
                        onClick={() => handleStatusChange(a.id, "COMPLETED")}
                        className="rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 text-xs font-semibold hover:bg-emerald-500/20"
                      >
                        Complete
                      </button>
                    )}

                    {a.status !== "CANCELLED" && a.status !== "COMPLETED" && (
                      <button
                        disabled={updatingId === a.id}
                        onClick={() => handleStatusChange(a.id, "CANCELLED")}
                        className="rounded-md border border-destructive/20 text-destructive px-2.5 py-1.5 text-xs font-medium hover:bg-destructive/10"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {filteredAppts.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  {loading ? "Loading appointment schedule..." : "No matching appointments found."}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "categories" && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {SALON_CATEGORIES.map((cat) => (
              <div key={cat.id} className="card-surface p-4 flex items-start gap-3">
                <img src={cat.image} alt={cat.name} className="size-16 rounded-xl object-cover" />
                <div>
                  <h3 className="font-bold text-sm">{cat.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>
                  <p className="mt-2 text-xs font-semibold text-primary">
                    Starting from {money(cat.startingPrice)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="card-surface p-5">
            <h2 className="font-display text-xl mb-4">Complete Salon Service Catalog</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {SALON_SERVICES.map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl border p-3 flex justify-between items-center text-xs"
                >
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{s.name}</h4>
                    <p className="text-muted-foreground">{s.description}</p>
                    <span className="text-muted-foreground">Duration: {s.duration}</span>
                  </div>
                  <span className="font-bold text-sm text-primary shrink-0">{money(s.price)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "stylists" && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card-surface p-5">
            <h2 className="font-display text-xl mb-4">Stylist Stations & Rating</h2>
            <ul className="space-y-4">
              {SALON_STYLISTS.map((s) => (
                <li key={s.id} className="flex items-center gap-3 border-b pb-3 last:border-none">
                  <div className="grid size-10 place-items-center rounded-full bg-secondary text-xs font-bold text-foreground">
                    {s.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.skills}</p>
                    <p className="text-xs text-muted-foreground">Phone: {s.phone}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-amber-500">★ {s.rating}</span>
                    <p className="text-[10px] text-emerald-600 font-medium">
                      On Duty (08:00 – 19:00)
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="card-surface p-5">
            <h2 className="font-display text-xl mb-4 flex items-center gap-2">
              <Percent className="size-4 text-primary" /> Stylist Commission Accruals (10%)
            </h2>
            <ul className="space-y-3 text-sm">
              {SALON_STYLISTS.map((s, idx) => {
                const commission = [195000, 182000, 146000, 121000][idx] || 90000;
                return (
                  <li
                    key={s.id}
                    className="flex justify-between items-center py-2 border-b last:border-none"
                  >
                    <span className="text-muted-foreground">{s.name}</span>
                    <span className="font-bold">{money(commission)}</span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-xs text-muted-foreground border-t pt-3">
              Commission is computed upon appointment completion and reconciled weekly with staff
              accounts.
            </p>
          </div>
        </div>
      )}
    </ErpPage>
  );
}
