import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  DollarSign,
  Plus,
  Tag,
  CheckCircle,
  XCircle,
  Calendar,
  Trash2,
  Edit2,
  Percent,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  getStoredCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  Coupon,
} from "@/lib/coupons-store";
import { formatTSh } from "@/data/shop";
import { ConfirmDialog } from "@/components/admin/AdminModals";
import { toast } from "@/components/ui/sonner";

export const Route = createFileRoute("/admin/coupons")({
  head: () => ({
    meta: [
      { title: "Coupons & Promotional Vouchers — Philipo Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminCouponsRoute,
});

export function AdminCouponsRoute() {
  const [coupons, setCoupons] = useState<Coupon[]>(() => getStoredCoupons());
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Form states
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState<number>(10);
  const [minOrder, setMinOrder] = useState<number>(30000);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [usageLimit, setUsageLimit] = useState<number>(100);
  const [isActive, setIsActive] = useState(true);

  // Confirm delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);

  const openCreateModal = () => {
    setEditingCoupon(null);
    setCode("");
    setType("percent");
    setValue(15);
    setMinOrder(30000);
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate(new Date(Date.now() + 86400000 * 60).toISOString().slice(0, 10));
    setUsageLimit(100);
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (c: Coupon) => {
    setEditingCoupon(c);
    setCode(c.code);
    setType(c.type);
    setValue(c.value);
    setMinOrder(c.minOrderAmount || 0);
    setStartDate(c.startDate || "");
    setEndDate(c.endDate || "");
    setUsageLimit(c.usageLimit || 100);
    setIsActive(c.isActive);
    setShowModal(true);
  };

  const handleSaveCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error("Coupon code is required");
      return;
    }

    try {
      if (editingCoupon) {
        const updated = updateCoupon(editingCoupon.id, {
          code,
          type,
          value: Number(value),
          minOrderAmount: Number(minOrder),
          startDate,
          endDate,
          usageLimit: Number(usageLimit),
          isActive,
        });
        toast.success("Coupon Updated", {
          description: `Voucher code ${updated.code} has been modified.`,
        });
      } else {
        const created = createCoupon({
          code,
          type,
          value: Number(value),
          minOrderAmount: Number(minOrder),
          startDate,
          endDate,
          usageLimit: Number(usageLimit),
          isActive,
        });
        toast.success("Coupon Created", {
          description: `Active voucher ${created.code} is ready for client checkout.`,
        });
      }
      setCoupons(getStoredCoupons());
      setShowModal(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save coupon.");
    }
  };

  const handleToggleStatus = (c: Coupon) => {
    const updated = updateCoupon(c.id, { isActive: !c.isActive });
    setCoupons(getStoredCoupons());
    toast.info(`Coupon ${updated.code} ${updated.isActive ? "Activated" : "Disabled"}`);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteCoupon(deleteTarget.id);
    setCoupons(getStoredCoupons());
    toast.success("Coupon Deleted", {
      description: `Promo code ${deleteTarget.code} was removed.`,
    });
    setDeleteTarget(null);
  };

  return (
    <AdminLayout
      title="Coupons & Promotional Vouchers"
      subtitle="Create and manage checkout discount codes, fixed allowances, and seasonal promotional campaigns."
      headerAction={
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0F172A] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition"
        >
          <Plus className="size-3.5" />
          <span>Create Coupon</span>
        </button>
      }
    >
      <div className="space-y-6">
        {/* Metric summaries */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-[#0B1326] p-5 rounded-2xl border border-slate-100 dark:border-[#15213B] shadow-xs space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Campaigns
            </span>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {coupons.length} Active Vouchers
            </div>
            <p className="text-[11px] text-slate-500">
              {coupons.filter((c) => c.isActive).length} currently enabled for shoppers
            </p>
          </div>

          <div className="bg-white dark:bg-[#0B1326] p-5 rounded-2xl border border-slate-100 dark:border-[#15213B] shadow-xs space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Redemptions Tracked
            </span>
            <div className="text-xl font-bold text-emerald-600">
              {coupons.reduce((sum, c) => sum + c.usageCount, 0)} Uses
            </div>
            <p className="text-[11px] text-slate-500">
              Across online cosmetics orders & salon checkouts
            </p>
          </div>

          <div className="bg-white dark:bg-[#0B1326] p-5 rounded-2xl border border-slate-100 dark:border-[#15213B] shadow-xs space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Active Strategy
            </span>
            <div className="text-xl font-bold text-blue-600">
              Customer Retention
            </div>
            <p className="text-[11px] text-slate-500">
              Minimum order thresholds applied to protect margins
            </p>
          </div>
        </div>

        {/* Coupons List */}
        <div className="bg-white dark:bg-[#0B1326] p-6 rounded-3xl border border-slate-100 dark:border-[#15213B] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Voucher Codes Directory ({coupons.length})
            </h3>
            <span className="text-xs text-slate-400">
              Valid at checkout when order requirements match
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-[#15213B] text-slate-400 font-semibold">
                  <th className="py-3 px-3">Promo Code</th>
                  <th className="py-3 px-3">Discount Type</th>
                  <th className="py-3 px-3">Value</th>
                  <th className="py-3 px-3">Min Order</th>
                  <th className="py-3 px-3">Valid Dates</th>
                  <th className="py-3 px-3 text-center">Usage</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-[#15213B]">
                {coupons.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No active promo coupons configured yet. Click "Create Coupon" above to launch a discount voucher.
                    </td>
                  </tr>
                ) : (
                  coupons.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-[#0E1A33] transition-colors"
                    >
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#0E1726] border border-slate-200 dark:border-[#1B273F]">
                          {c.code}
                        </span>
                      </td>
                      <td className="py-3 px-3 capitalize text-slate-600 dark:text-slate-300">
                        {c.type === "percent" ? "Percentage Off" : "Fixed Discount"}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                        {c.type === "percent" ? `${c.value}%` : formatTSh(c.value)}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {c.minOrderAmount ? formatTSh(c.minOrderAmount) : "None"}
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-[11px]">
                        {c.startDate || "Any"} &rarr; {c.endDate || "No Expiry"}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {c.usageCount}
                        </span>{" "}
                        <span className="text-slate-400 text-[11px]">
                          / {c.usageLimit || "∞"}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => handleToggleStatus(c)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition ${
                            c.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}
                        >
                          {c.isActive ? "Active" : "Disabled"}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(c)}
                            title="Edit Coupon"
                            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white"
                          >
                            <Edit2 className="size-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(c)}
                            title="Delete Coupon"
                            className="p-1 rounded-md text-rose-400 hover:text-rose-600"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-[#0B1326] border border-slate-200 dark:border-[#1E293B] rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {editingCoupon ? `Edit Coupon "${editingCoupon.code}"` : "Create Promotional Coupon"}
            </h3>

            <form onSubmit={handleSaveCoupon} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Coupon Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SUMMER25"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Discount Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as "percent" | "fixed")}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="percent">Percentage Off (%)</option>
                    <option value="fixed">Fixed Amount (TZS)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Value {type === "percent" ? "(%)" : "(TZS)"}
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Min Order Threshold (TZS)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={minOrder}
                    onChange={(e) => setMinOrder(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Maximum Uses Limit
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="pt-4 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="couponActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="size-4 text-blue-600 rounded"
                  />
                  <label htmlFor="couponActive" className="font-semibold text-slate-700 dark:text-slate-300">
                    Active immediately
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#15213B]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 dark:bg-blue-600 text-white font-semibold shadow-sm"
                >
                  {editingCoupon ? "Save Changes" : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Promotional Coupon"
        message={`Are you sure you want to permanently delete coupon "${deleteTarget?.code}"? Shoppers will no longer be able to redeem this code.`}
        confirmLabel="Delete Coupon"
        destructive={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminLayout>
  );
}
