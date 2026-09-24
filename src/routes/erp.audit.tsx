import { createFileRoute } from "@tanstack/react-router";
import { ErpPage } from "@/components/Erp";
import { auditLog } from "@/data/shop";

export const Route = createFileRoute("/erp/audit")({
  head: () => ({
    meta: [
      { title: "Audit log — Philipo ERP" },
      { name: "description", content: "Who changed what, when, and why." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Audit,
});

function Audit() {
  return (
    <ErpPage title="Audit log" subtitle="Every sensitive action is recorded with actor, before/after and reason.">
      <div className="card-surface overflow-x-auto p-2 sm:p-4">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="p-2 font-medium">Time</th>
              <th className="p-2 font-medium">Actor</th>
              <th className="p-2 font-medium">Action</th>
              <th className="p-2 font-medium">Entity</th>
              <th className="p-2 font-medium">Detail</th>
            </tr>
          </thead>
          <tbody>
            {auditLog.map((a, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="p-2 text-muted-foreground">{a.at}</td>
                <td className="p-2 font-medium">{a.actor}</td>
                <td className="p-2">
                  <code className="rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground">
                    {a.action}
                  </code>
                </td>
                <td className="p-2">{a.entity}</td>
                <td className="p-2 text-muted-foreground">{a.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ErpPage>
  );
}
