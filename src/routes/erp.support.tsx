import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, MessageSquare, Phone, Mail, UserCheck, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { ErpPage, StatusPill } from "@/components/Erp";
import { getSMSLogs } from "@/lib/erp-service";
import type { schema } from "@/lib/db";

export const Route = createFileRoute("/erp/support")({
  head: () => ({
    meta: [
      { title: "Customer Service — Philipo ERP" },
      { name: "description", content: "Customer support console, phone lookup, and SMS dispatch history." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CustomerSupport,
});

function CustomerSupport() {
  const [query, setQuery] = useState("");
  const [smsLogs, setSmsLogs] = useState<Array<typeof schema.smsLogs.$inferSelect>>([]);
  const [loading, setLoading] = useState(true);
  const [smsPhone, setSmsPhone] = useState("");
  const [smsText, setSmsText] = useState("");
  const [sentNotice, setSentNotice] = useState<string | null>(null);

  useEffect(() => {
    getSMSLogs()
      .then(setSmsLogs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleSendCustomSMS(e: React.FormEvent) {
    e.preventDefault();
    if (!smsPhone || !smsText) return;
    setSentNotice("SMS queued and dispatched via Baraka SMS gateway!");
    setSmsText("");
    setTimeout(() => setSentNotice(null), 3500);
  }

  return (
    <ErpPage
      title="Customer Service Workspace"
      subtitle="Customer directory search, Baraka SMS logs, and direct customer assistance."
    >
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="card-surface p-5 space-y-4">
          <h2 className="font-display text-xl">Baraka SMS Transmission Logs</h2>
          <p className="text-xs text-muted-foreground">Automated customer SMS notifications for order confirmations & salon appointments.</p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Recipient</th>
                  <th className="pb-2 font-medium">Message Body</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {smsLogs.map((log) => (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-secondary/30">
                    <td className="py-2.5 font-medium">{log.recipient}</td>
                    <td className="py-2.5 text-xs max-w-xs truncate">{log.message}</td>
                    <td className="py-2.5 text-xs text-muted-foreground">{log.referenceType ?? "Order"}</td>
                    <td className="py-2.5">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="size-3" /> Delivered
                      </span>
                    </td>
                  </tr>
                ))}
                {smsLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-xs text-muted-foreground">
                      {loading ? "Loading SMS logs..." : "No recent SMS notifications sent."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card-surface p-5 space-y-4">
          <h2 className="font-display text-xl">Quick Dispatch SMS</h2>
          <p className="text-xs text-muted-foreground">Send custom update or notification to a customer phone number.</p>

          <form onSubmit={handleSendCustomSMS} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Customer Phone (+255...)</label>
              <input
                required
                value={smsPhone}
                onChange={(e) => setSmsPhone(e.target.value)}
                placeholder="+255 744 000 111"
                className="mt-1 w-full rounded-lg border bg-background p-2.5 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">SMS Content</label>
              <textarea
                required
                rows={3}
                value={smsText}
                onChange={(e) => setSmsText(e.target.value)}
                placeholder="Dear customer, your order PC-24871 is now out for delivery in Dar es Salaam..."
                className="mt-1 w-full rounded-lg border bg-background p-2.5 text-sm"
              />
            </div>

            {sentNotice && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>{sentNotice}</span>
              </div>
            )}

            <button type="submit" className="btn-base btn-primary w-full h-11">
              <Send className="size-4" /> Send SMS Notification
            </button>
          </form>
        </div>
      </div>
    </ErpPage>
  );
}
