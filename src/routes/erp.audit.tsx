import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, Lock, Activity, Search, RefreshCw } from "lucide-react";
import { ErpPage } from "@/components/Erp";
import { getAuditLogs } from "@/lib/erp-service";
import type { schema } from "@/lib/db";

export const Route = createFileRoute("/erp/audit")({
  head: () => ({
    meta: [
      { title: "Security & Audit Logs — Philipo ERP" },
      {
        name: "description",
        content: "Immutable audit trail of staff actions, sign-ins, and inventory modifications.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuditLogs,
});

function AuditLogs() {
  const [logs, setLogs] = useState<Array<typeof schema.auditLogs.$inferSelect>>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  async function loadLogs() {
    setLoading(true);
    try {
      const list = await getAuditLogs();
      setLogs(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  const rows = logs.filter(
    (l) =>
      l.actor.toLowerCase().includes(query.toLowerCase()) ||
      l.action.toLowerCase().includes(query.toLowerCase()) ||
      l.detail.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <ErpPage
      title="System Audit & Security Log"
      subtitle="Immutable event ledger recording every user action, role change, and status update."
      actions={
        <button onClick={loadLogs} className="btn-base btn-outline h-10">
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> Refresh Trail
        </button>
      }
    >
      <div className="mb-4 flex items-center gap-3">
        <label className="flex h-10 flex-1 items-center gap-2 rounded-full border bg-card px-4 sm:max-w-xs">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by actor, action or detail"
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>
      </div>

      <div className="card-surface overflow-x-auto p-4">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="pb-2.5 font-medium">Timestamp</th>
              <th className="pb-2.5 font-medium">Actor</th>
              <th className="pb-2.5 font-medium">Action Event</th>
              <th className="pb-2.5 font-medium">Entity Target</th>
              <th className="pb-2.5 font-medium">Audit Description</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((log) => (
              <tr
                key={log.id}
                className="border-b last:border-0 hover:bg-secondary/30 transition-colors"
              >
                <td className="py-2.5 text-xs text-muted-foreground font-mono">
                  {new Date(log.at).toLocaleString()}
                </td>
                <td className="py-2.5 font-medium">{log.actor}</td>
                <td className="py-2.5 font-mono text-xs">
                  <span className="rounded bg-secondary px-2 py-0.5">{log.action}</span>
                </td>
                <td className="py-2.5 text-xs text-muted-foreground">{log.entity}</td>
                <td className="py-2.5 text-xs">{log.detail}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-xs text-muted-foreground">
                  {loading ? "Loading system audit log..." : "No audit entries match this query."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </ErpPage>
  );
}
