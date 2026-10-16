import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Check,
  CreditCard,
  Smartphone,
  Banknote,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Truck,
  Lock,
} from "lucide-react";
import { Site } from "@/components/Site";
import { money, BRAND } from "@/data/shop";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { createOrderFromCart } from "@/lib/order-server";
import { saveStoredOrder } from "@/lib/orders-store";
import { createInvoiceFromOrder, Invoice } from "@/lib/invoices-store";
import { downloadInvoicePDF } from "@/lib/invoice-pdf";
import { InvoiceModal } from "@/components/admin/InvoiceModal";
import { FileText, Download } from "lucide-react";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Secure Checkout — Philipo Cosmetics" },
      {
        name: "description",
        content: "Complete your luxury beauty order with mobile money, card, or cash on delivery.",
      },
      { property: "og:title", content: "Checkout — Philipo Cosmetics" },
      {
        property: "og:description",
        content: "Pay by M-Pesa, Tigo Pesa, Airtel Money, card, or cash on delivery.",
      },
    ],
  }),
  component: Checkout,
});

const steps = ["Delivery Details", "Payment Method", "Review & Confirm"] as const;

const cityDeliveryRates: Record<string, number> = {
  "Dar es Salaam": 5000,
  Arusha: 10000,
  Mwanza: 10000,
  Dodoma: 10000,
  Zanzibar: 15000,
  Mbeya: 12000,
  Morogoro: 8000,
  Tanga: 8000,
};

const payments = [
  {
    id: "momo",
    label: "Mobile Money (Tanzania)",
    hint: "M-Pesa, Mixx by Yas (Tigo Pesa), Airtel Money",
    icon: Smartphone,
    popular: true,
  },
  {
    id: "card",
    label: "Debit / Credit Card",
    hint: "Visa, Mastercard (3D Secure)",
    icon: CreditCard,
    popular: false,
  },
  {
    id: "cod",
    label: "Cash on Delivery",
    hint: "Available in Dar es Salaam & Arusha metro areas",
    icon: Banknote,
    popular: false,
  },
];

function Checkout() {
  const { user } = useAuth();
  const { subtotal, detailed, clear } = useCart();
  const [step, setStep] = useState(0);
  const [pay, setPay] = useState<"momo" | "card" | "cod">("momo");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string | null>(null);

  // Form input state
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [city, setCity] = useState("Dar es Salaam");
  const [area, setArea] = useState("");
  const [notes, setNotes] = useState("");
  const [validationError, setValidationError] = useState("");

  // Auto-sync with authenticated user if present
  useEffect(() => {
    if (user?.fullName && !fullName) setFullName(user.fullName);
    if (user?.phone && !phone) setPhone(user.phone);
  }, [user]);

  const baseDelivery = cityDeliveryRates[city] ?? 5000;
  const isFreeDelivery = subtotal >= 150000;
  const delivery = isFreeDelivery ? 0 : baseDelivery;
  const grandTotal = subtotal + delivery;

  function handleContinueToPayment() {
    setValidationError("");
    if (!fullName.trim()) {
      setValidationError("Please enter your Full Name.");
      return;
    }
    if (!phone.trim() || phone.trim().length < 9) {
      setValidationError("Please provide a valid Tanzanian mobile phone number.");
      return;
    }
    if (!area.trim()) {
      setValidationError("Please specify your Delivery Area or Street address.");
      return;
    }
    setStep(1);
  }

  async function handlePlaceOrder() {
    if (detailed.length === 0) return;
    setState("loading");
    setErrorMessage("");

    try {
      const items = detailed.map((d) => ({ productId: d.product.id, qty: d.qty }));
      const result = await createOrderFromCart({
        customerName: fullName.trim() || "Guest Client",
        customerPhone: phone.trim() || "0744000111",
        deliveryCity: city,
        deliveryArea: area.trim() || "City Center",
        deliveryNotes: notes.trim(),
        paymentMethod: pay,
        items,
        userId: user?.id,
      });

      setCreatedOrderNumber(result.orderNumber);

      const createdOrderRecord = {
        id: result.order?.id || result.orderNumber || `ORD-${Date.now()}`,
        orderNumber: result.orderNumber,
        customerName: fullName.trim() || "Guest Client",
        customerPhone: phone.trim() || "0744000111",
        destination: `${area}, ${city}`,
        items: detailed.map((d) => ({ name: d.product.name, qty: d.qty, price: d.product.price, sku: d.product.sku })),
        total: grandTotal,
        paymentMethod:
          pay === "momo"
            ? "Mobile Money"
            : pay === "card"
              ? "Credit/Debit Card"
              : "Cash on Delivery",
        paymentStatus: pay === "cod" ? "Pending COD" : "Paid",
        fulfillmentStatus: "Processing",
        channel: "Online" as const,
        createdAt: new Date().toISOString(),
      };

      // Persist to unified store orders ledger
      saveStoredOrder(createdOrderRecord);

      // Automatic Tax Invoice Generation
      const inv = createInvoiceFromOrder({
        ...createdOrderRecord,
        customerEmail: user?.email,
        userId: user?.id,
      });
      setCurrentInvoice(inv);

      setState("done");
      clear();
    } catch (err: any) {
      console.error("Order creation error:", err);
      setErrorMessage(err.message || "Could not complete order. Please review stock and retry.");
      setState("error");
    }
  }

  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);

  if (state === "done") {
    return (
      <Site>
        <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
          <div className="mx-auto grid size-20 place-items-center rounded-full bg-emerald-600 text-white rise-in shadow-lift">
            <Check className="size-10" />
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-emerald-600">
            Order Confirmed #{createdOrderNumber}
          </p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl">Thank You for Your Order!</h1>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            Your beauty order <strong className="text-foreground">{createdOrderNumber}</strong> is
            confirmed. An automated SMS order receipt and dispatch notification has been sent to{" "}
            <strong className="text-foreground">{phone}</strong>.
          </p>

          <div className="mt-6 rounded-2xl bg-secondary/40 p-5 text-left border border-border text-xs text-muted-foreground space-y-1.5">
            <p className="font-semibold text-foreground">Delivery Destination:</p>
            <p>
              {fullName} · {phone}
            </p>
            <p>
              {area}, {city}, Tanzania
            </p>
            <p className="pt-1 text-primary font-medium">
              Payment Mode:{" "}
              {pay === "momo" ? "Mobile Money" : pay === "card" ? "Card" : "Cash on Delivery"}
            </p>
            {currentInvoice && (
              <p className="pt-1 text-[#174A35] font-semibold flex items-center gap-1.5">
                <FileText className="size-3.5" />
                <span>Invoice Issued: #{currentInvoice.invoiceNumber}</span>
              </p>
            )}
          </div>

          {/* Invoice Actions */}
          {currentInvoice && (
            <div className="mt-6 p-4 rounded-2xl bg-[#F7F3EA] border border-[#E8E2D8] flex flex-wrap items-center justify-between gap-3 text-left">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9A45C]">
                  Official Receipt
                </span>
                <p className="font-serif font-bold text-sm text-[#0F3326]">
                  Tax Invoice #{currentInvoice.invoiceNumber}
                </p>
                <p className="text-xs text-slate-500">
                  Total Paid: TZS {currentInvoice.total.toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInvoiceModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-[#E8E2D8] text-[#174A35] hover:bg-slate-50 shadow-xs transition"
                >
                  <FileText className="size-3.5" />
                  <span>View Invoice</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadInvoicePDF(currentInvoice)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#174A35] text-white hover:bg-[#0F3326] shadow-sm transition"
                >
                  <Download className="size-3.5" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/track" className="btn-base btn-primary px-8">
              <Truck className="size-4" /> Track Order Status
            </Link>
            <Link to="/shop" search={{ category: "All" }} className="btn-base btn-outline px-8">
              Explore More Products
            </Link>
          </div>

          {/* Tax Invoice Modal */}
          <InvoiceModal
            invoice={currentInvoice}
            isOpen={invoiceModalOpen}
            onClose={() => setInvoiceModalOpen(false)}
          />
        </div>
      </Site>
    );
  }

  return (
    <Site>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="flex items-center justify-between border-b border-border/80 pb-6">
          <div>
            <span className="eyebrow text-rose font-semibold tracking-wider">Fast & Secure</span>
            <h1 className="mt-1 font-display text-3xl sm:text-4xl">Checkout</h1>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3.5 text-primary" />
            <span>256-bit SSL Encrypted</span>
          </div>
        </div>

        {/* Checkout Steps Indicator */}
        <ol className="mt-6 flex flex-wrap items-center gap-3 text-xs font-medium sm:text-sm">
          {steps.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <span
                className={`grid size-7 place-items-center rounded-full text-xs transition-colors ${
                  i <= step
                    ? "bg-primary text-white font-semibold shadow-sm"
                    : "border border-border text-muted-foreground"
                }`}
              >
                {i + 1}
              </span>
              <span className={i <= step ? "text-foreground font-medium" : "text-muted-foreground"}>
                {s}
              </span>
              {i < steps.length - 1 && <span className="h-px w-6 sm:w-10 bg-border" />}
            </li>
          ))}
        </ol>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
          <div className="card-surface p-6 sm:p-8 border border-border">
            {/* STEP 0: DELIVERY DETAILS */}
            {step === 0 && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-display text-2xl font-medium">1. Delivery Destination</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Where would you like us to dispatch your luxury beauty package?
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-foreground">
                      Recipient Full Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      required
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        setValidationError("");
                      }}
                      placeholder="e.g. Zawadi Mremi"
                      className="mt-1.5 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-foreground">
                      Phone Number (for SMS & Courier) <span className="text-destructive">*</span>
                    </label>
                    <input
                      required
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setValidationError("");
                      }}
                      placeholder="e.g. 0744 281 673"
                      className="mt-1.5 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-foreground">
                      City / Region <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="mt-1.5 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
                    >
                      {Object.entries(cityDeliveryRates).map(([cityName, rate]) => (
                        <option key={cityName} value={cityName}>
                          {cityName} {isFreeDelivery ? "(Free Promotion)" : `(${money(rate)})`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-foreground">
                      Specific Area / Street Address <span className="text-destructive">*</span>
                    </label>
                    <input
                      required
                      value={area}
                      onChange={(e) => {
                        setArea(e.target.value);
                        setValidationError("");
                      }}
                      placeholder="e.g. Masaki, Chole Road, Villa 4B"
                      className="mt-1.5 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground">
                    Courier Notes / Gate Directions (Optional)
                  </label>
                  <input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Near Shoppers Plaza, white gate, call on arrival"
                    className="mt-1.5 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
                  />
                </div>

                {validationError && (
                  <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3.5 text-xs text-destructive flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleContinueToPayment}
                  className="btn-base btn-primary mt-2 w-full sm:w-auto px-8"
                >
                  Continue to Payment Method
                </button>
              </div>
            )}

            {/* STEP 1: PAYMENT METHOD */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-display text-2xl font-medium">2. Select Payment Method</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Choose your preferred secure payment channel.
                  </p>
                </div>

                <div className="space-y-3">
                  {payments.map(({ id, label, hint, icon: Icon, popular }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setPay(id as any)}
                      className={`flex w-full items-center justify-between rounded-xl border p-4.5 text-left transition-all ${
                        pay === id
                          ? "border-primary bg-secondary/80 ring-2 ring-primary/20 shadow-sm"
                          : "border-border bg-card hover:bg-secondary/40"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`grid size-10 place-items-center rounded-xl ${
                            pay === id ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <Icon className="size-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-foreground">{label}</span>
                            {popular && (
                              <span className="rounded-full bg-rose/10 px-2 py-0.5 text-[10px] font-semibold text-rose">
                                Most Popular
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground block mt-0.5">{hint}</span>
                        </div>
                      </div>
                      <div
                        className={`size-4 rounded-full border flex items-center justify-center ${
                          pay === id ? "border-primary bg-primary" : "border-border"
                        }`}
                      >
                        {pay === id && <span className="size-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setStep(0)} className="btn-base btn-outline px-6">
                    Back to Delivery
                  </button>
                  <button onClick={() => setStep(2)} className="btn-base btn-primary px-8">
                    Review Order
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: REVIEW & CONFIRM */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-2xl font-medium">3. Review and Confirm Order</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Please verify your delivery address and order items before confirming.
                  </p>
                </div>

                {/* Delivery Snapshot */}
                <div className="rounded-xl bg-secondary/40 p-4 border border-border text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground mb-1">Delivering To:</p>
                  <p className="text-foreground">
                    {fullName} ({phone})
                  </p>
                  <p>
                    {area}, {city}, Tanzania
                  </p>
                  {notes && <p className="italic mt-1">Notes: "{notes}"</p>}
                  <p className="mt-2 text-primary font-medium">
                    Payment via: {payments.find((p) => p.id === pay)?.label}
                  </p>
                </div>

                {/* Item List */}
                <div className="space-y-3 divide-y divide-border/60">
                  {detailed.map(({ product, qty }) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between pt-3 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="size-12 rounded-lg object-cover border border-border"
                        />
                        <div>
                          <p className="font-medium text-foreground">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {qty} × {money(product.price)}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-primary">
                        {money(product.price * qty)}
                      </span>
                    </div>
                  ))}
                </div>

                {errorMessage && (
                  <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive">
                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 pt-2">
                  <button onClick={() => setStep(1)} className="btn-base btn-outline px-6">
                    Change Payment
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={state === "loading" || detailed.length === 0}
                    className="btn-base bg-rose text-white hover:bg-rose/90 px-8 font-semibold shadow-soft disabled:opacity-60"
                  >
                    {state === "loading" && <Loader2 className="size-4 animate-spin mr-2" />}
                    {state === "loading"
                      ? "Confirming Order…"
                      : `Place Order · ${money(grandTotal)}`}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Summary */}
          <aside className="card-surface h-fit p-6 border border-border">
            <h2 className="font-display text-xl font-medium">Order Summary</h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal ({detailed.length} items)</dt>
                <dd className="font-medium">{money(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Delivery ({city})</dt>
                <dd className={isFreeDelivery ? "font-semibold text-emerald-600" : "font-medium"}>
                  {isFreeDelivery ? "FREE (Promotional)" : money(delivery)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3 font-semibold text-base">
                <dt>Total Payable</dt>
                <dd className="text-primary font-bold">{money(grandTotal)}</dd>
              </div>
            </dl>

            <div className="mt-6 rounded-xl bg-secondary/60 p-3.5 text-xs text-muted-foreground space-y-2">
              <p className="flex items-center gap-1.5 font-medium text-foreground">
                <ShieldCheck className="size-4 text-primary shrink-0" />
                <span>Baraka SMS Notification</span>
              </p>
              <p>
                You will receive an automated confirmation SMS with dispatch details upon
                submission.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </Site>
  );
}
