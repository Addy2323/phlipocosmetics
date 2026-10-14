import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Settings as SettingsIcon, Shield, Key, Building, CheckCircle2, UserCog } from "lucide-react";
import { ErpPage } from "@/components/Erp";
import { useAuth } from "@/lib/auth";
import { updateUserRole, type UserRole } from "@/lib/auth-server";
import { db, schema } from "@/lib/db";

export const Route = createFileRoute("/erp/settings")({
  head: () => ({
    meta: [
      { title: "System Settings — Philipo ERP" },
      { name: "description", content: "Business profile, tax settings, SMS gateway credentials, and staff access control." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Settings,
});

function Settings() {
  const { user } = useAuth();
  const [users, setUsers] = useState<Array<typeof schema.users.$inferSelect>>([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  async function loadUsers() {
    setLoading(true);
    try {
      const list = await db.select().from(schema.users);
      setUsers(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleRoleChange(targetUserId: string, newRole: UserRole) {
    if (!user) return;
    try {
      await updateUserRole(user, targetUserId, newRole);
      setStatusMsg("Role updated successfully!");
      await loadUsers();
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to update user role");
    }
  }

  return (
    <ErpPage
      title="System Settings & Staff RBAC Access"
      subtitle="Store configuration, TRA Tax ID, Baraka SMS engine credentials, and Staff Role Management."
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div className="card-surface p-5 space-y-4">
          <div className="flex items-center gap-2 font-display text-lg">
            <Building className="size-5 text-primary" /> Store Information & Tax Settings
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Business Name</label>
              <input disabled value="Philipo Cosmetics Tanzania Limited" className="mt-1 w-full rounded-lg border bg-muted p-2.5 text-sm" />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">TIN (Taxpayer Identification Number)</label>
              <input disabled value="109-842-771" className="mt-1 w-full rounded-lg border bg-muted p-2.5 font-mono text-sm" />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Headquarters Address</label>
              <input disabled value="Samora Avenue, Posta Mpya, Dar es Salaam, Tanzania" className="mt-1 w-full rounded-lg border bg-muted p-2.5 text-sm" />
            </div>
          </div>
        </div>

        <div className="card-surface p-5 space-y-4">
          <div className="flex items-center gap-2 font-display text-lg">
            <Key className="size-5 text-amber-500" /> Baraka SMS & Payment Gateway Integration
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-lg border p-3 bg-secondary/30">
              <div>
                <p className="font-medium">Baraka SMS Gateway API</p>
                <p className="text-xs text-muted-foreground">Sender ID: PHILIPO</p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-4" /> Connected
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3 bg-secondary/30">
              <div>
                <p className="font-medium">Snippe / Mobile Money Push API</p>
                <p className="text-xs text-muted-foreground">M-Pesa / Tigo Pawa / Airtel Money</p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-4" /> Connected
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="card-surface mt-6 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-display text-xl">
            <UserCog className="size-5 text-primary" /> Staff Accounts & RBAC Authorization Manager
          </div>
          {statusMsg && (
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{statusMsg}</span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="pb-2 font-medium">User Name</th>
                <th className="pb-2 font-medium">Email Address</th>
                <th className="pb-2 font-medium">Phone Number</th>
                <th className="pb-2 font-medium">Assigned Role</th>
                <th className="pb-2 font-medium text-right">Update Access Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-secondary/30">
                  <td className="py-2.5 font-medium">{u.fullName}</td>
                  <td className="py-2.5 text-xs text-muted-foreground">{u.email}</td>
                  <td className="py-2.5 text-xs text-muted-foreground">{u.phone}</td>
                  <td className="py-2.5">
                    <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    {user?.role === "admin" ? (
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                        className="rounded-lg border bg-background px-2.5 py-1 text-xs font-medium outline-none focus:border-primary"
                      >
                        <option value="admin">admin</option>
                        <option value="sales_staff">sales_staff</option>
                        <option value="customer_service">customer_service</option>
                        <option value="stylist">stylist</option>
                        <option value="customer">customer</option>
                      </select>
                    ) : (
                      <span className="text-xs text-muted-foreground">Admin permission required</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ErpPage>
  );
}
