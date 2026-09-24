import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeftRight, PackagePlus } from "lucide-react";
import { ErpPage } from "@/components/Erp";
import { products, inventoryLedger } from "@/data/shop";

export const Route = createFileRoute("/erp/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory — Philipo ERP" },
      { name: "description", content: "Stock levels, movement ledger and transfers." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Inventory,
});

function Inventory() {
  const low = products.filter((p) => p.stock - p.reserved <= 10);

  return (
    <ErpPage
      title="Inventory"
      subtitle="Every movement is written to the ledger — stock cannot be edited silently."
      actions={
        <div className="flex gap-2">
          <button className="btn-base btn-outline h-10">
            <ArrowLeftRight className="size-4" /> Transfer
          </button>
          <button className="btn-base btn-primary h-10">
            <PackagePlus className="size-4" /> Goods receipt
          </button>
        </div>
      }
    >
      {low.length > 0 && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
          <p>
            <span className="font-medium">{low.length} item(s) at or below reorder level:</span>{" "}
            {low.map((p) => p.name).join(", ")}. Raise a purchase request to restock.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="card-surface overflow-x-auto p-2 sm:p-4">
          <h2 className="p-2 font-display text-xl">Stock on hand</h2>
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="p-2 font-medium">Product</th>
                <th className="p-2 font-medium">SKU</th>
                <th className="p-2 font-medium">On hand</th>
                <th className="p-2 font-medium">Reserved</th>
                <th className="p-2 font-medium">Available</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const available = p.stock - p.reserved;
                return (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="p-2 font-medium">{p.name}</td>
                    <td className="p-2 text-muted-foreground">{p.sku}</td>
                    <td className="p-2">{p.stock}</td>
                    <td className="p-2">{p.reserved}</td>
                    <td className="p-2">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          available <= 10 ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"
                        }`}
                      >
                        {available}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="card-surface p-5">
          <h2 className="font-display text-xl">Movement ledger</h2>
          <p className="mt-1 text-xs text-muted-foreground">Immutable — corrections are new entries, never edits.</p>
          <ul className="mt-4 space-y-4">
            {inventoryLedger.map((m, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-medium ${
                    m.qty > 0 ? "bg-success/10 text-success" : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {m.qty > 0 ? `+${m.qty}` : m.qty}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{m.type}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {m.item} · {m.sku}
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>{m.at}</p>
                  <p>bal {m.balance}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </ErpPage>
  );
}
