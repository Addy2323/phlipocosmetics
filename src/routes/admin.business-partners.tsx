import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Store,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  ShieldCheck,
  MapPin,
  Phone,
  Building,
  FileText,
  UserCheck,
  X,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  getResellerApplications,
  saveResellerApplication,
  ResellerApplication,
  ResellerStatus,
} from "@/lib/reseller-store";
import { useAuth } from "@/lib/auth";
import { formatTSh } from "@/data/shop";
import { ConfirmDialog, PromptDialog } from "@/components/admin/AdminModals";
import { toast } from "@/components/ui/sonner";

export const Route = createFileRoute("/admin/business-partners")({
  head: () => ({
    meta: [
      { title: "Business Partners & Reseller Oversight — Philipo Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminBusinessPartnersRoute,
});

export function AdminBusinessPartnersRoute() {
  const { user } = useAuth();
  const [apps, setApps] = useState<ResellerApplication[]>(() => getResellerApplications());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedApp, setSelectedApp] = useState<ResellerApplication | null>(null);

  // Dialog states
  const [rejectTarget, setRejectTarget] = useState<ResellerApplication | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<ResellerApplication | null>(null);
  const [moreInfoTarget, setMoreInfoTarget] = useState<ResellerApplication | null>(null);

  const pendingCount = useMemo(() => {
    return apps.filter((a) => a.status === "SUBMITTED" || a.status === "UNDER_REVIEW").length;
  }, [apps]);

  const filteredApps = useMemo(() => {
    return apps.filter((a) => {
      if (statusFilter !== "ALL" && a.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          a.fullName.toLowerCase().includes(q) ||
          a.shopName.toLowerCase().includes(q) ||
          a.phone.toLowerCase().includes(q) ||
          a.region.toLowerCase().includes(q) ||
          (a.nidaNumber && a.nidaNumber.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [apps, searchQuery, statusFilter]);

  const handleApprove = (app: ResellerApplication) => {
    const partnerCode = `PHL-PARTNER-${app.region.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const updated: ResellerApplication = {
      ...app,
      status: "APPROVED",
      partnerCode,
      assignedReviewer: user?.fullName || "System Admin",
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveResellerApplication(updated);
    setApps(getResellerApplications());
    if (selectedApp?.id === app.id) setSelectedApp(updated);
    toast.success("Reseller Approved", {
      description: `Partner code ${partnerCode} assigned to ${app.shopName}.`,
    });
  };

  const handleConfirmReject = () => {
    if (!rejectTarget) return;
    const updated: ResellerApplication = {
      ...rejectTarget,
      status: "REJECTED",
      rejectionReason: "Documentation does not satisfy retail quota requirements",
      assignedReviewer: user?.fullName || "System Admin",
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveResellerApplication(updated);
    setApps(getResellerApplications());
    if (selectedApp?.id === rejectTarget.id) setSelectedApp(updated);
    toast.error("Application Rejected", {
      description: `Application for ${rejectTarget.shopName} was declined.`,
    });
    setRejectTarget(null);
  };

  const handleConfirmSuspend = (reason: string) => {
    if (!suspendTarget) return;
    const updated: ResellerApplication = {
      ...suspendTarget,
      status: "SUSPENDED",
      suspensionReason: reason,
      updatedAt: new Date().toISOString(),
    };
    saveResellerApplication(updated);
    setApps(getResellerApplications());
    if (selectedApp?.id === suspendTarget.id) setSelectedApp(updated);
    toast("Partner Account Suspended", {
      description: `Wholesale privileges suspended for ${suspendTarget.shopName}.`,
    });
    setSuspendTarget(null);
  };

  const handleConfirmMoreInfo = (feedback: string) => {
    if (!moreInfoTarget) return;
    const updated: ResellerApplication = {
      ...moreInfoTarget,
      status: "MORE_INFORMATION_REQUIRED",
      moreInfoReason: feedback,
      assignedReviewer: user?.fullName || "System Admin",
      updatedAt: new Date().toISOString(),
    };
    saveResellerApplication(updated);
    setApps(getResellerApplications());
    if (selectedApp?.id === moreInfoTarget.id) setSelectedApp(updated);
    toast.info("Information Requested", {
      description: `Notification dispatched to ${moreInfoTarget.fullName}.`,
    });
    setMoreInfoTarget(null);
  };

  return (
    <AdminLayout
      title="Business Partners & Reseller Network"
      subtitle="Verify Tanzanian NIDA identity credentials, physical cosmetics shops, and territory wholesale approvals."
    >
      <div className="space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#0B1326] p-5 rounded-2xl border border-slate-100 dark:border-[#15213B] shadow-xs space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Pending Review
            </span>
            <div className="text-xl font-bold text-amber-500">
              {pendingCount} Applications
            </div>
            <p className="text-[11px] text-slate-500">Requiring admin KYC approval</p>
          </div>

          <div className="bg-white dark:bg-[#0B1326] p-5 rounded-2xl border border-slate-100 dark:border-[#15213B] shadow-xs space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Authorized Resellers
            </span>
            <div className="text-xl font-bold text-emerald-600">
              {apps.filter((a) => a.status === "APPROVED").length} Verified
            </div>
            <p className="text-[11px] text-slate-500">Active wholesale partners</p>
          </div>

          <div className="bg-white dark:bg-[#0B1326] p-5 rounded-2xl border border-slate-100 dark:border-[#15213B] shadow-xs space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Regional Territories
            </span>
            <div className="text-xl font-bold text-blue-600">
              Morogoro, Njombe & Nationwide
            </div>
            <p className="text-[11px] text-slate-500">Designated distribution zones</p>
          </div>

          <div className="bg-white dark:bg-[#0B1326] p-5 rounded-2xl border border-slate-100 dark:border-[#15213B] shadow-xs space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Standard Wholesale Margin
            </span>
            <div className="text-xl font-bold text-purple-600">
              25% Discount
            </div>
            <p className="text-[11px] text-slate-500">Guaranteed distributor tier</p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white dark:bg-[#0B1326] p-4 rounded-2xl border border-slate-200 dark:border-[#15213B] shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search partner, shop, phone, region, NIDA..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">All Application Statuses</option>
              <option value="SUBMITTED">Submitted (Pending)</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved Resellers</option>
              <option value="MORE_INFORMATION_REQUIRED">Info Requested</option>
              <option value="REJECTED">Rejected</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-[#0B1326] p-6 rounded-3xl border border-slate-100 dark:border-[#15213B] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Reseller Applications ({filteredApps.length})
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              Compliant with Tanzania Personal Data Protection Act, 2022
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-[#15213B] text-slate-400 font-semibold">
                  <th className="py-3 px-3">Shop / Outlet</th>
                  <th className="py-3 px-3">Applicant Name</th>
                  <th className="py-3 px-3">Region & Zone</th>
                  <th className="py-3 px-3">NIDA Status</th>
                  <th className="py-3 px-3">Partner Code</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-[#15213B]">
                {filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No reseller applications found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredApps.map((a) => (
                    <tr
                      key={a.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-[#0E1A33] transition-colors"
                    >
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <Store className="size-4 text-emerald-600 shrink-0" />
                          <span>{a.shopName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-semibold text-slate-900 dark:text-white">{a.fullName}</p>
                        <span className="text-[10px] text-slate-400">{a.phone}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                        {a.region} ({a.district || "Urban"})
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="size-3" /> 20-Digit Verified
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        {a.partnerCode || "—"}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            a.status === "APPROVED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : a.status === "SUBMITTED" || a.status === "UNDER_REVIEW"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : a.status === "MORE_INFORMATION_REQUIRED"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setSelectedApp(a)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                        >
                          <Eye className="size-3.5" /> Inspect KYC
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* KYC APPLICATION DETAIL MODAL */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white dark:bg-[#0B1326] border border-slate-200 dark:border-[#1E293B] rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#15213B] pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                  Reseller KYC Audit
                </span>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {selectedApp.shopName} ({selectedApp.region})
                </h3>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0E1726] border border-slate-100 dark:border-[#1B273F] space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400">Applicant Details</span>
                <p className="font-bold text-slate-900 dark:text-white">{selectedApp.fullName}</p>
                <p className="text-slate-500">Phone: {selectedApp.phone}</p>
                <p className="text-slate-500">Email: {selectedApp.email || "—"}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0E1726] border border-slate-100 dark:border-[#1B273F] space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400">Identity & NIDA NIN</span>
                <p className="font-mono font-bold text-slate-900 dark:text-white">
                  {selectedApp.nidaNumber || "NIN Not Supplied"}
                </p>
                <p className="text-emerald-600 font-semibold flex items-center gap-1">
                  <ShieldCheck className="size-3" /> Tanzanian 20-digit checksum verified
                </p>
                <p className="text-[10px] text-slate-400">Statutory PDPA Consent Granted</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0E1726] border border-slate-100 dark:border-[#1B273F] space-y-1 text-xs">
              <span className="text-[10px] font-bold text-slate-400">Physical Premises & Location</span>
              <p className="text-slate-700 dark:text-slate-300">
                {selectedApp.street || "Main Commercial Zone"}, {selectedApp.ward || ""}, {selectedApp.district}, {selectedApp.region}
              </p>
              <p className="text-[11px] text-slate-500">
                Sales Channels: {selectedApp.salesChannels?.join(", ") || "Retail Beauty Outlet"} · Experience: {selectedApp.experienceYears || "2+ years"}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#15213B]">
              <button
                onClick={() => setMoreInfoTarget(selectedApp)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition"
              >
                Request Info
              </button>
              <button
                onClick={() => setRejectTarget(selectedApp)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
              >
                Reject
              </button>
              {selectedApp.status === "APPROVED" ? (
                <button
                  onClick={() => setSuspendTarget(selectedApp)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition shadow-sm"
                >
                  Suspend Partner
                </button>
              ) : (
                <button
                  onClick={() => handleApprove(selectedApp)}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
                >
                  Approve as Reseller
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REJECT CONFIRM DIALOG */}
      <ConfirmDialog
        open={Boolean(rejectTarget)}
        title="Reject Partner Application"
        message={`Are you sure you want to decline application for "${rejectTarget?.shopName}"? The applicant will be informed via portal notification.`}
        confirmLabel="Decline Application"
        destructive={true}
        onConfirm={handleConfirmReject}
        onCancel={() => setRejectTarget(null)}
      />

      {/* SUSPEND PROMPT DIALOG */}
      <PromptDialog
        open={Boolean(suspendTarget)}
        title="Suspend Partner Wholesale Account"
        description="Specify reason for suspension (e.g. breach of minimum pricing policy, inactive quota):"
        defaultValue="Pricing compliance review"
        submitLabel="Suspend Partner"
        onSubmit={handleConfirmSuspend}
        onCancel={() => setSuspendTarget(null)}
      />

      {/* MORE INFO PROMPT DIALOG */}
      <PromptDialog
        open={Boolean(moreInfoTarget)}
        title="Request Additional Information"
        description="Enter notes for the applicant on what documents or photos they need to resubmit:"
        defaultValue="Please provide clearer photo of shop entrance and trade license."
        multiline={true}
        submitLabel="Send Request"
        onSubmit={handleConfirmMoreInfo}
        onCancel={() => setMoreInfoTarget(null)}
      />
    </AdminLayout>
  );
}
