import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Minus, Plus, ScanBarcode, Trash2, ReceiptText } from "lucide-react";
import { toast } from "sonner";
import { ErpPage } from "@/components/Erp";
import { products, money } from "@/data/shop";

export const Route = createFileRoute("/erp/pos")({
  head: () => ({
    meta: [
      { title: "Point of sale — Philipo ERP" },
      { name: "description", content: "Scan, basket, payment and receipt for walk-in sales." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Pos,
});

type Line = { id: string; qty: number };

function Pos() {
  const [lines, setLines] = useState<Line[]>([]);
  const [tendered, setTendered] = useState("");

  const detailed = lines
    .map((l) => ({ product: products.find((p) => p.id === l.id)!, qty: l.qty }))
    .filter((d) => d.product);
  const subtotal = detailed.reduce((s, d) => s + d.product.price * d.qty, 0);
  const vat = Math.round(subtotal * 0.18);
  const total = subtotal;

  const add = (id: string) =>
    setLines((ls) => {
      const found = ls.find((l) => l.id === id);
      return found
        ? ls.map((l) => (l.id === id ? { ...l, qty: l.qty + 1 } : l))
        : [...ls, { id, qty: 1 }];
    });
  const setQty = (id: string, qty: number) =>
    setLines((ls) => (qty <= 0 ? ls.filter((l) => l.id !== id) : ls.map((l) => (l.id === id ? { ...l, qty } : l))));

  const charge = () => {
    toast.success(`Sale complete — ${money(total)}. Receipt printed, stock updated.`);
    setLines([]);
    setTendered("");
  };

  return (
    <ErpPage
      title="Point of sale"
      subtitle="Shift 2 · Drawer opened 08:00 · Cashier Amina"
      actions={
        <button className="btn-base btn-outline h-10">
          <ScanBarcode className="size-4" /> Scan barcode
        </button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {products.map((p) => (
            <button
              key={p.id}
              onClick={() => add(p.id)}
              className="card-surface hover-lift overflow-hidden text-left"
            >
              <img src={p.image} alt={p.name} loading="lazy" className="aspect-square w-full object-cover" />
              <div className="p-3">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{p.sku}</p>
                <p className="mt-1 text-sm text-primary">{money(p.price)}</p>
              </div>
            </button>
          ))}
        </div>

        <aside className="card-surface h-fit p-5 lg:sticky lg:top-20">
          <h2 className="font-display text-xl">Basket</h2>
          <div className="mt-4 space-y-3">
            {detailed.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Tap a product or scan a barcode to start.
              </p>
            )}
            {detailed.map(({ product, qty }) => (
              <div key={product.id} className="flex items-center gap-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{money(product.price)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    aria-label="Decrease"
                    onClick={() => setQty(product.id, qty - 1)}
                    className="grid size-8 place-items-center rounded-full border"
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <span className="w-5 text-center">{qty}</span>
                  <button
                    aria-label="Increase"
                    onClick={() => setQty(product.id, qty + 1)}
                    className="grid size-8 place-items-center rounded-full border"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <dl className="mt-5 space-y-1.5 border-t pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{money(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">VAT included (18%)</dt>
              <dd>{money(vat)}</dd>
            </div>
            <div className="flex justify-between text-base font-medium">
              <dt>Total</dt>
              <dd className="text-primary">{money(total)}</dd>
            </div>
          </dl>

          <label className="mt-4 block text-xs text-muted-foreground">
            Cash tendered
            <input
              value={tendered}
              onChange={(e) => setTendered(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              placeholder="0"
              className="mt-1 h-11 w-full rounded-lg border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          {Number(tendered) > total && total > 0 && (
            <p className="mt-2 text-xs text-success">Change due: {money(Number(tendered) - total)}</p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              disabled={detailed.length === 0}
              onClick={charge}
              className="btn-base btn-primary disabled:opacity-50"
            >
              <ReceiptText className="size-4" /> Charge
            </button>
            <button
              onClick={() => setLines([])}
              disabled={detailed.length === 0}
              className="btn-base btn-outline disabled:opacity-50"
            >
              <Trash2 className="size-4" /> Clear
            </button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Completing a sale updates stock, finance and the audit log automatically.
          </p>
        </aside>
      </div>
    </ErpPage>
  );
}
