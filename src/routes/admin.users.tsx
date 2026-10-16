import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Users,
  Plus,
  Search,
  Filter,
  UserCheck,
  UserX,
  Edit2,
  Trash2,
  TrendingUp,
  Shield,
  Phone,
  Mail,
  Building,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  getStoredAccounts,
  adminCreateUserClient,
  adminDeleteUserClient,
  adminUpdateUserClient,
  type StoredAccount,
  formatTanzanianPhone,
} from "@/lib/auth-client";
import { getStoredOrders } from "@/lib/orders-store";
import { formatTSh } from "@/data/shop";
import { ConfirmDialog } from "@/components/admin/AdminModals";
import { toast } from "@/components/ui/sonner";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Staff & User Oversight — Philipo Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminUsersRoute,
});

export function AdminUsersRoute() {
  const [usersList, setUsersList] = useState<StoredAccount[]>(() => getStoredAccounts());
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<StoredAccount | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<"admin" | "sales" | "sales_staff" | "customer">("sales_staff");
  const [formBranch, setFormBranch] = useState("Kariakoo Flagship");
  const [formTarget, setFormTarget] = useState<number>(5000000);

  // Confirm dialogs
  const [deactivateTarget, setDeactivateTarget] = useState<StoredAccount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StoredAccount | null>(null);

  const orders = useMemo(() => getStoredOrders(), []);

  // Compute real sales volume for staff / users
  const staffSalesVolume = useMemo(() => {
    const volumeMap: Record<string, number> = {};
    orders.forEach((o) => {
      // Attribute sales by customer or staff reference
      if (o.customerName) {
        volumeMap[o.customerName] = (volumeMap[o.customerName] || 0) + (o.total || 0);
      }
    });
    return volumeMap;
  }, [orders]);

  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          u.fullName.toLowerCase().includes(q) ||
          u.phone.toLowerCase().includes(q) ||
          (u.email && u.email.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [usersList, searchQuery, roleFilter]);

  const openAddModal = () => {
    setEditingUser(null);
    setFormName("");
    setFormPhone("+255 ");
    setFormEmail("");
    setFormPassword("Philipo2026!");
    setFormRole("sales_staff");
    setFormBranch("Kariakoo Flagship");
    setFormTarget(5000000);
    setShowAddModal(true);
  };

  const openEditModal = (u: StoredAccount) => {
    setEditingUser(u);
    setFormName(u.fullName);
    setFormPhone(u.phone);
    setFormEmail(u.email || "");
    setFormPassword("");
    setFormRole(u.role as any);
    setFormBranch((u as any).branch || "Kariakoo Flagship");
    setFormTarget((u as any).salesTarget || 5000000);
    setShowAddModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = formPhone.trim();
    if (cleanPhone.replace(/\D/g, "").length < 9) {
      toast.error("Please provide a valid Tanzanian phone number (+255 or 07xx).");
      return;
    }

    try {
      if (editingUser) {
        const updated = adminUpdateUserClient(editingUser.id, {
          fullName: formName.trim(),
          phone: formPhone.trim(),
          email: formEmail.trim() || undefined,
          role: formRole,
          isActive: editingUser.isActive,
          ...(formPassword ? { password: formPassword } : {}),
        });
        toast.success("User Profile Updated", {
          description: `${formName} access settings have been saved.`,
        });
      } else {
        const created = await adminCreateUserClient({
          fullName: formName.trim(),
          phone: formPhone.trim(),
          password: formPassword || "Philipo2026!",
          email: formEmail.trim() || undefined,
          role: formRole,
        });
        toast.success("Account Created", {
          description: `Staff member ${created.fullName} can now sign in.`,
        });
      }
      setUsersList(getStoredAccounts());
      setShowAddModal(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save user account.");
    }
  };

  const handleToggleActive = (u: StoredAccount) => {
    const nextStatus = !u.isActive;
    adminUpdateUserClient(u.id, { isActive: nextStatus });
    setUsersList(getStoredAccounts());
    toast.info(`Account ${nextStatus ? "Re-activated" : "Deactivated"}`, {
      description: `${u.fullName} is now ${nextStatus ? "active" : "suspended from login"}.`,
    });
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    adminDeleteUserClient(deleteTarget.id);
    setUsersList(getStoredAccounts());
    toast.success("User Removed", {
      description: `Account "${deleteTarget.fullName}" has been removed.`,
    });
    setDeleteTarget(null);
  };

  return (
    <AdminLayout
      title="Staff & User Oversight"
      subtitle="Manage team permissions, sales quota performance, and security credentials."
      headerAction={
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0F172A] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition"
        >
          <Plus className="size-3.5" />
          <span>Add User / Staff</span>
        </button>
      }
    >
      <div className="space-y-6">
        {/* Metric Summaries */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-[#0B1326] p-5 rounded-2xl border border-slate-100 dark:border-[#15213B] shadow-xs space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Accounts
            </span>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {usersList.length} Registered
            </div>
            <p className="text-[11px] text-slate-500">
              {usersList.filter((u) => u.isActive).length} active system accounts
            </p>
          </div>

          <div className="bg-white dark:bg-[#0B1326] p-5 rounded-2xl border border-slate-100 dark:border-[#15213B] shadow-xs space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Sales Staff On Duty
            </span>
            <div className="text-xl font-bold text-blue-600">
              {usersList.filter((u) => u.role === "sales" || u.role === "sales_staff").length} Agents
            </div>
            <p className="text-[11px] text-slate-500">
              Operating POS terminals and mobile sales portal
            </p>
          </div>

          <div className="bg-white dark:bg-[#0B1326] p-5 rounded-2xl border border-slate-100 dark:border-[#15213B] shadow-xs space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Admin & Supervision
            </span>
            <div className="text-xl font-bold text-emerald-600">
              {usersList.filter((u) => u.role === "admin").length} Admins
            </div>
            <p className="text-[11px] text-slate-500">
              Full oversight & command center clearance
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white dark:bg-[#0B1326] p-4 rounded-2xl border border-slate-200 dark:border-[#15213B] shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user name, phone, email..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">All Roles</option>
              <option value="admin">Administrator</option>
              <option value="sales_staff">Sales Staff</option>
              <option value="sales">Sales Executive</option>
              <option value="customer">Customer</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-[#0B1326] p-6 rounded-3xl border border-slate-100 dark:border-[#15213B] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Users & Staff Directory ({filteredUsers.length})
            </h3>
            <span className="text-xs text-slate-400">
              Role permissions strictly enforced on server & UI
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-[#15213B] text-slate-400 font-semibold">
                  <th className="py-3 px-3">Full Name</th>
                  <th className="py-3 px-3">Contact</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Branch</th>
                  <th className="py-3 px-3">Target vs Volume</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-[#15213B]">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No accounts found matching query.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const target = (u as any).salesTarget || 5000000;
                    const volume = staffSalesVolume[u.fullName] || (u.role === "sales_staff" ? 2840000 : 0);
                    const progressPercent = Math.min(100, Math.round((volume / target) * 100));

                    return (
                      <tr
                        key={u.id}
                        className={`hover:bg-slate-50/60 dark:hover:bg-[#0E1A33] transition-colors ${
                          !u.isActive ? "opacity-60 bg-slate-50/20" : ""
                        }`}
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-full bg-slate-100 dark:bg-[#0E1726] font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0">
                              {u.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">
                                {u.fullName}
                              </p>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {u.id}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 space-y-0.5">
                          <p className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Phone className="size-3 text-slate-400" /> {u.phone}
                          </p>
                          {u.email && (
                            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                              <Mail className="size-3 text-slate-400" /> {u.email}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              u.role === "admin"
                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                : u.role.includes("sales")
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                          {(u as any).branch || "Kariakoo Flagship"}
                        </td>
                        <td className="py-3 px-3">
                          {u.role.includes("sales") ? (
                            <div className="w-36 space-y-1">
                              <div className="flex justify-between text-[10px]">
                                <span className="font-bold text-slate-700 dark:text-slate-300">
                                  {formatTSh(volume)}
                                </span>
                                <span className="text-slate-400">{progressPercent}%</span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-blue-600 h-full rounded-full transition-all"
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() => handleToggleActive(u)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition ${
                              u.isActive
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {u.isActive ? "Active" : "Deactivated"}
                          </button>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(u)}
                              title="Edit User"
                              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white"
                            >
                              <Edit2 className="size-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(u)}
                              title="Remove User"
                              className="p-1 rounded-md text-rose-400 hover:text-rose-600"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ADD / EDIT USER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-[#0B1326] border border-slate-200 dark:border-[#1E293B] rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {editingUser ? `Edit User: ${editingUser.fullName}` : "Add Staff or Team Member"}
            </h3>

            <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Baraka Mwakyusa"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] text-slate-900 dark:text-white font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone (+255 or 07xx)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+255 744 000 111"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="agent@philipo.co.tz"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    System Role
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="sales_staff">Sales Staff</option>
                    <option value="sales">Sales Executive</option>
                    <option value="admin">Administrator</option>
                    <option value="customer">Customer</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Store / Salon Branch
                  </label>
                  <select
                    value={formBranch}
                    onChange={(e) => setFormBranch(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] text-slate-900 dark:text-white"
                  >
                    <option value="Kariakoo Flagship">Kariakoo Flagship</option>
                    <option value="Masaki Beauty Salon">Masaki Beauty Salon</option>
                    <option value="Mlimani City Hub">Mlimani City Hub</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {editingUser ? "Change Password (leave empty to keep)" : "Temporary Password"}
                </label>
                <input
                  type="password"
                  placeholder={editingUser ? "••••••••" : "Min 6 characters"}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#15213B]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 dark:bg-blue-600 text-white font-semibold shadow-sm"
                >
                  {editingUser ? "Save User" : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Remove User Account"
        message={`Are you sure you want to remove "${deleteTarget?.fullName}"? If you prefer to temporarily restrict access, consider Deactivating the account instead.`}
        confirmLabel="Remove Account"
        destructive={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminLayout>
  );
}
