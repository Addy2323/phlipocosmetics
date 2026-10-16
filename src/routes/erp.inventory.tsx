import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeftRight, PackagePlus, Plus, RefreshCw } from "lucide-react";
import { ErpPage } from "@/components/Erp";
import { getProductsList, adjustProductStock, createProduct } from "@/lib/erp-service";
import type { schema } from "@/lib/db";
import { money } from "@/data/shop";

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
  const [prods, setProds] = useState<Array<typeof schema.products.$inferSelect>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProd, setSelectedProd] = useState<string | null>(null);
  const [adjustQty, setAdjustQty] = useState(10);
  const [adjustReason, setAdjustReason] = useState("Goods receipt");
  const [busy, setBusy] = useState(false);

  async function loadInventory() {
    setLoading(true);
    try {
      const list = await getProductsList();
      setProds(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInventory();
  }, []);

  async function handleAdjustStock(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProd) return;
    setBusy(true);
    try {
      await adjustProductStock(selectedProd, adjustQty, adjustReason, "ERP Manual Adjustment");
      await loadInventory();
      setSelectedProd(null);
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  const low = prods.filter((p) => p.stock - p.reserved <= 10);

  return (
    <ErpPage
      title="Stock & Inventory Ledger"
      subtitle="Every stock movement is recorded with audit reference IDs — stock cannot be edited silently."
      actions={
        <div className="flex gap-2">
          <button onClick={loadInventory} className="btn-base btn-outline h-10">
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      }
    >
      {low.length > 0 && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
          <p>
            <span className="font-medium">
              {low.length} item(s) at or below reorder level (≤10):
            </span>{" "}
            {low.map((p) => p.name).join(", ")}. Restock suggested.
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
                <th className="p-2 font-medium">Cost Price</th>
                <th className="p-2 font-medium">Selling Price</th>
                <th className="p-2 font-medium">Stock</th>
                <th className="p-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {prods.map((p) => {
                const available = p.stock - p.reserved;
                return (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-secondary/40">
                    <td className="p-2 font-medium">{p.name}</td>
                    <td className="p-2 text-muted-foreground">{p.sku}</td>
                    <td className="p-2 text-muted-foreground">{money(p.costPrice)}</td>
                    <td className="p-2 font-medium">{money(p.price)}</td>
                    <td className="p-2">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          available <= 10
                            ? "bg-destructive/10 text-destructive"
                            : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        }`}
                      >
                        {p.stock} units
                      </span>
                    </td>
                    <td className="p-2">
                      <button
                        onClick={() => setSelectedProd(p.id)}
                        className="rounded-md border bg-secondary/80 px-2 py-1 text-xs font-medium hover:bg-secondary"
                      >
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="card-surface p-5">
          <h2 className="font-display text-xl">Stock Adjustment Modal</h2>
          {selectedProd ? (
            <form onSubmit={handleAdjustStock} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Target Product ID
                </label>
                <input
                  disabled
                  value={selectedProd}
                  className="mt-1 w-full rounded-lg border bg-muted p-2 text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Adjustment Quantity (+ to add, - to reduce)
                </label>
                <input
                  type="number"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)}
                  className="mt-1 w-full rounded-lg border bg-background p-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Reason / Movement Type
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="mt-1 w-full rounded-lg border bg-background p-2 text-sm"
                >
                  <option value="Goods receipt">Goods receipt (Supplier delivery)</option>
                  <option value="Stock count adjustment">Stock count adjustment</option>
                  <option value="Damaged / expired">Damaged / expired</option>
                  <option value="Salon internal use">Salon internal use</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={busy} className="btn-base btn-primary flex-1 h-10">
                  Confirm Adjustment
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedProd(null)}
                  className="btn-base btn-outline h-10"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <p className="mt-4 text-xs text-muted-foreground">
              Select a product from the table on the left to add stock, record goods receipt, or
              adjust inventory balances.
            </p>
          )}
        </div>
      </div>
    </ErpPage>
  );
}
