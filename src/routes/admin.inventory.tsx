import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  Boxes,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  Search,
  Filter,
  Camera,
  Image as ImageIcon,
  Layers,
  UploadCloud,
  Tag,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { categories, formatTSh } from "@/data/shop";
import {
  getStockMovements,
  recordStockMovement,
  StockMovement,
  StockMovementType,
} from "@/lib/inventory-store";
import {
  StoredProduct,
  getStoredProducts,
  saveStoredProducts,
  updateProductImage,
  PRODUCTS_UPDATE_EVENT,
} from "@/lib/products-store";
import { ProductImageUploader } from "@/components/admin/ProductImageUploader";
import { toast } from "@/components/ui/sonner";

export const Route = createFileRoute("/admin/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory Control & Valuation — Philipo Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminInventoryRoute,
});

export function AdminInventoryRoute() {
  const [movements, setMovements] = useState<StockMovement[]>(() => getStockMovements());
  const [productList, setProductList] = useState<StoredProduct[]>(() => getStoredProducts());
  const [activeTab, setActiveTab] = useState<"items" | "movements">("items");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Modals state
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [imageModalProduct, setImageModalProduct] = useState<StoredProduct | null>(null);
  const [inventoryImageVal, setInventoryImageVal] = useState("");

  // Form states for Restock & Adjustment
  const [selectedProductId, setSelectedProductId] = useState(productList[0]?.id || "");
  const [actionQuantity, setActionQuantity] = useState<number>(20);
  const [actionNote, setActionNote] = useState("");
  const [adjustType, setAdjustType] = useState<"adjustment" | "return">("adjustment");

  // Form states for Add New Stock Item
  const [newItemName, setNewItemName] = useState("");
  const [newItemSku, setNewItemSku] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Skincare");
  const [newItemCost, setNewItemCost] = useState<number>(20000);
  const [newItemPrice, setNewItemPrice] = useState<number>(45000);
  const [newItemStock, setNewItemStock] = useState<number>(30);
  const [newItemImage, setNewItemImage] = useState("");
  const [newItemNote, setNewItemNote] = useState("Initial warehouse intake batch");

  // Keep product list synchronized across routes
  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail) {
        setProductList(e.detail);
      } else {
        setProductList(getStoredProducts());
      }
    };
    window.addEventListener(PRODUCTS_UPDATE_EVENT, handleUpdate);
    return () => window.removeEventListener(PRODUCTS_UPDATE_EVENT, handleUpdate);
  }, []);

  // Calculate live valuation: stock * estimated cost
  const totalValuation = useMemo(() => {
    return productList.reduce((sum, p) => sum + p.stock * (p.cost || p.price * 0.45), 0);
  }, [productList]);

  const totalCatalogUnits = useMemo(() => {
    return productList.reduce((sum, p) => sum + p.stock, 0);
  }, [productList]);

  const lowStockProducts = useMemo(() => {
    return productList.filter((p) => p.stock <= 10);
  }, [productList]);

  // Filtered movements for movement ledger tab
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      if (filterType !== "ALL" && m.type !== filterType) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          m.productName.toLowerCase().includes(q) ||
          m.sku.toLowerCase().includes(q) ||
          m.user.toLowerCase().includes(q) ||
          m.note.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [movements, filterType, searchQuery]);

  // Filtered products for items & imagery tab
  const filteredProducts = useMemo(() => {
    return productList.filter((p) => {
      if (categoryFilter !== "ALL" && !p.category.toLowerCase().includes(categoryFilter.toLowerCase())) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [productList, categoryFilter, searchQuery]);

  const openImageModal = (p: StoredProduct) => {
    setImageModalProduct(p);
    setInventoryImageVal(p.image || "");
  };

  const handleSaveInventoryImage = () => {
    if (!imageModalProduct) return;
    const updated = updateProductImage(imageModalProduct.id, inventoryImageVal);
    if (updated) {
      setProductList(getStoredProducts());
      toast.success("Inventory Image Updated", {
        description: `New photo saved for ${imageModalProduct.name}.`,
      });
    }
    setImageModalProduct(null);
  };

  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = productList.find((p) => p.id === selectedProductId);
    if (!prod) return;

    const qty = Number(actionQuantity);
    if (qty <= 0) {
      toast.error("Restock quantity must be greater than 0");
      return;
    }

    const newBalance = prod.stock + qty;

    recordStockMovement({
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      type: "restock",
      quantityChange: qty,
      balanceAfter: newBalance,
      user: "System Admin",
      note: actionNote.trim() || "Warehouse goods replenishment",
    });

    const updated = productList.map((p) => (p.id === prod.id ? { ...p, stock: newBalance } : p));
    setProductList(updated);
    saveStoredProducts(updated);

    setMovements(getStockMovements());
    setShowRestockModal(false);
    setActionNote("");
    toast.success("Stock Replenished", {
      description: `Added ${qty} units to ${prod.name}. New balance: ${newBalance} units.`,
    });
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = productList.find((p) => p.id === selectedProductId);
    if (!prod) return;

    const qty = Number(actionQuantity);
    if (qty <= 0) {
      toast.error("Adjustment quantity must be greater than 0");
      return;
    }

    const isDecrease = adjustType === "adjustment";
    const qtyChange = isDecrease ? -qty : qty;
    const newBalance = Math.max(0, prod.stock + qtyChange);

    recordStockMovement({
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      type: adjustType,
      quantityChange: qtyChange,
      balanceAfter: newBalance,
      user: "System Admin",
      note: actionNote.trim() || `${adjustType} audit balance correction`,
    });

    const updated = productList.map((p) => (p.id === prod.id ? { ...p, stock: newBalance } : p));
    setProductList(updated);
    saveStoredProducts(updated);

    setMovements(getStockMovements());
    setShowAdjustModal(false);
    setActionNote("");
    toast.success("Stock Level Adjusted", {
      description: `Updated ${prod.name} by ${qtyChange > 0 ? "+" : ""}${qtyChange}. New balance: ${newBalance} units.`,
    });
  };

  const handleAddStockItem = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSku = (newItemSku.trim() || `PC-INV-${Math.floor(1000 + Math.random() * 9000)}`).toUpperCase();

    if (productList.some((p) => p.sku.toUpperCase() === cleanSku)) {
      toast.error(`SKU "${cleanSku}" already exists. Please provide a unique SKU.`);
      return;
    }

    const newProd: StoredProduct = {
      id: `prod-${Date.now()}`,
      slug: cleanSku.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      name: newItemName.trim(),
      sku: cleanSku,
      tagline: "Authentic warehouse stock intake",
      category: newItemCategory,
      price: Number(newItemPrice),
      compareAt: Number(newItemPrice) * 1.2,
      cost: Number(newItemCost),
      stock: Number(newItemStock),
      reserved: 0,
      rating: 5.0,
      reviews: 0,
      image: newItemImage || "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&q=80",
      description: "Official Philipo Cosmetics registered inventory item.",
      details: ["Warehouse Inspected", "TBS Certified", "Direct manufacturer supply"],
      isArchived: false,
    };

    const updated = [newProd, ...productList];
    setProductList(updated);
    saveStoredProducts(updated);

    // Record initial restock audit movement
    recordStockMovement({
      productId: newProd.id,
      productName: newProd.name,
      sku: newProd.sku,
      type: "restock",
      quantityChange: newProd.stock,
      balanceAfter: newProd.stock,
      user: "System Admin",
      note: newItemNote.trim() || "Initial inventory intake batch",
    });
    setMovements(getStockMovements());

    setShowAddItemModal(false);
    setNewItemName("");
    setNewItemSku("");
    setNewItemImage("");
    toast.success("Inventory Item Added", {
      description: `"${newProd.name}" (${newProd.sku}) intake completed with ${newProd.stock} units.`,
    });
  };

  const openAddItemModal = () => {
    setNewItemName("");
    setNewItemSku(`PC-INV-${Math.floor(1000 + Math.random() * 9000)}`);
    setNewItemCategory("Skincare");
    setNewItemCost(20000);
    setNewItemPrice(45000);
    setNewItemStock(30);
    setNewItemImage("");
    setNewItemNote("Initial warehouse intake batch");
    setShowAddItemModal(true);
  };

  return (
    <AdminLayout
      title="Inventory Control & Product Imagery"
      subtitle="Real-time stock valuation, product photos, warehouse replenishment, and physical audit ledger."
      headerAction={
        <div className="flex items-center gap-2">
          <button
            onClick={openAddItemModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#E6007A] hover:bg-[#C40068] text-white text-xs font-semibold shadow-xs transition"
          >
            <Plus className="size-3.5" />
            <span>Add Stock Item</span>
          </button>
          <button
            onClick={() => setShowAdjustModal(true)}
            className="px-3.5 py-2 rounded-full border border-slate-200 dark:border-[#1E293B] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition"
          >
            Adjust Stock
          </button>
          <button
            onClick={() => setShowRestockModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#173488] hover:bg-[#122A6E] text-white text-xs font-semibold shadow-sm transition"
          >
            <Plus className="size-3.5" />
            <span>Restock Batch</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-[#0B1326] p-5 rounded-2xl border border-slate-100 dark:border-[#15213B] shadow-xs space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Stock Valuation
            </span>
            <div className="text-xl font-bold text-emerald-600">
              {formatTSh(totalValuation)}
            </div>
            <p className="text-[11px] text-slate-500">
              Evaluated across {totalCatalogUnits} total catalog units
            </p>
          </div>

          <div className="bg-white dark:bg-[#0B1326] p-5 rounded-2xl border border-slate-100 dark:border-[#15213B] shadow-xs space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Stock In Circulation
            </span>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {totalCatalogUnits} Units
            </div>
            <p className="text-[11px] text-slate-500">
              Spread across {productList.length} active beauty lines
            </p>
          </div>

          <div className="bg-white dark:bg-[#0B1326] p-5 rounded-2xl border border-slate-100 dark:border-[#15213B] shadow-xs space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Low-Stock Alerts
            </span>
            <div
              className={`text-xl font-bold ${
                lowStockProducts.length > 0 ? "text-rose-600" : "text-emerald-600"
              }`}
            >
              {lowStockProducts.length} Items &le; 10 units
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              {lowStockProducts.map((p) => p.name).join(", ") || "All SKUs safely stocked"}
            </p>
          </div>
        </div>

        {/* Low Stock Warning Banner if applicable */}
        {lowStockProducts.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  Critical Reorder Level Triggered
                </h4>
                <p className="text-[11px] text-amber-700 dark:text-amber-300">
                  {lowStockProducts.map((p) => `${p.name} (${p.stock} units left)`).join(" · ")}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedProductId(lowStockProducts[0]?.id || "");
                setShowRestockModal(true);
              }}
              className="px-3.5 py-1.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition shrink-0"
            >
              Replenish Now
            </button>
          </div>
        )}

        {/* Navigation View Switcher (Stock Items & Imagery vs Movement Ledger) */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#15213B] pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("items")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === "items"
                ? "bg-[#173488] text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <ImageIcon className="size-3.5 text-[#E6007A]" />
            <span>Stock Items & Product Imagery ({productList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("movements")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === "movements"
                ? "bg-[#173488] text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Boxes className="size-3.5 text-[#C9A45C]" />
            <span>Movement Audit Ledger ({movements.length})</span>
          </button>
        </div>

        {/* TAB 1: STOCK ITEMS & PRODUCT IMAGERY */}
        {activeTab === "items" && (
          <div className="bg-white dark:bg-[#0B1326] p-6 rounded-3xl border border-slate-100 dark:border-[#15213B] shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Inventory Stock & Product Imagery
                </h3>
                <p className="text-xs text-slate-500">
                  Manage warehouse quantities, product photos, unit valuations, and direct image uploads.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search SKU or item..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-full border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-[#15213B] text-slate-400 font-semibold">
                    <th className="py-3 px-3">Product Photo</th>
                    <th className="py-3 px-3">Item Details</th>
                    <th className="py-3 px-3">SKU</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Stock Level</th>
                    <th className="py-3 px-3">Unit Valuation</th>
                    <th className="py-3 px-3">Total Value</th>
                    <th className="py-3 px-3 text-right">Imagery & Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-[#15213B]">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        No inventory products match criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const isLow = p.stock <= 10;
                      const cost = p.cost || Math.round(p.price * 0.45);
                      const totalVal = p.stock * cost;

                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-slate-50/60 dark:hover:bg-[#0E1A33] transition-colors"
                        >
                          <td className="py-3 px-3">
                            <div
                              onClick={() => openImageModal(p)}
                              className="relative group size-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
                              title="Click to change inventory photo"
                            >
                              <img
                                src={p.image}
                                alt={p.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                                <Camera className="size-3.5" />
                                <span className="text-[8px] font-bold">Edit</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <p className="font-bold text-slate-900 dark:text-white line-clamp-1">
                              {p.name}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate max-w-xs">
                              {p.tagline || p.description}
                            </p>
                          </td>

                          <td className="py-3 px-3 font-mono text-[11px] text-slate-500 font-bold">
                            {p.sku}
                          </td>

                          <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                            {p.category}
                          </td>

                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`font-bold ${
                                  isLow ? "text-rose-600" : "text-emerald-600"
                                }`}
                              >
                                {p.stock} units
                              </span>
                              {isLow && (
                                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-100 text-rose-700">
                                  Low
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-3 text-slate-500">
                            {formatTSh(cost)}
                          </td>

                          <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                            {formatTSh(totalVal)}
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openImageModal(p)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FFF5F8] dark:bg-[#1A1028] border border-[#FCEAF2] dark:border-[#2A1838] text-[#E6007A] hover:bg-[#E6007A] hover:text-white text-[11px] font-semibold transition"
                              >
                                <Camera className="size-3" />
                                <span>Update Image</span>
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedProductId(p.id);
                                  setShowRestockModal(true);
                                }}
                                className="px-2.5 py-1 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold transition"
                              >
                                Restock
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
        )}

        {/* TAB 2: LIVE STOCK MOVEMENT AUDIT LEDGER */}
        {activeTab === "movements" && (
          <div className="bg-white dark:bg-[#0B1326] p-6 rounded-3xl border border-slate-100 dark:border-[#15213B] shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Live Stock Movement Audit Ledger
                </h3>
                <p className="text-xs text-slate-500">
                  Audited stock additions, POS checkout deductions, and manual stock corrections.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter movement..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-full border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  <option value="ALL">All Types</option>
                  <option value="restock">Restock</option>
                  <option value="sale">Sale</option>
                  <option value="adjustment">Adjustment</option>
                  <option value="return">Return</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-[#15213B] text-slate-400 font-semibold">
                    <th className="py-3 px-2">Date</th>
                    <th className="py-3 px-2">Product</th>
                    <th className="py-3 px-2">SKU</th>
                    <th className="py-3 px-2">Type</th>
                    <th className="py-3 px-2 text-right">Qty Change</th>
                    <th className="py-3 px-2 text-right">Balance After</th>
                    <th className="py-3 px-2">Operator</th>
                    <th className="py-3 px-2">Audit Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-[#15213B]">
                  {filteredMovements.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No stock movement records found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredMovements.map((m) => (
                      <tr
                        key={m.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-[#0E1A33] transition-colors"
                      >
                        <td className="py-3 px-2 text-slate-500 whitespace-nowrap">
                          {new Date(m.createdAt).toLocaleDateString("en-TZ", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3 px-2 font-bold text-slate-900 dark:text-white">
                          {m.productName}
                        </td>
                        <td className="py-3 px-2 font-mono text-[11px] text-slate-500">
                          {m.sku}
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              m.type === "restock"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : m.type === "sale"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : m.type === "adjustment"
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-purple-50 text-purple-700 border border-purple-200"
                            }`}
                          >
                            {m.type}
                          </span>
                        </td>
                        <td
                          className={`py-3 px-2 text-right font-bold ${
                            m.quantityChange > 0 ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                        </td>
                        <td className="py-3 px-2 text-right font-bold text-slate-900 dark:text-white">
                          {m.balanceAfter} units
                        </td>
                        <td className="py-3 px-2 text-slate-600 dark:text-slate-400">
                          {m.user}
                        </td>
                        <td className="py-3 px-2 text-slate-500 max-w-xs truncate">
                          {m.note}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* UPDATE INVENTORY IMAGE MODAL */}
      {imageModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#0B1326] border border-slate-200 dark:border-[#1E293B] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#15213B] pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Update Inventory Image
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {imageModalProduct.name} ({imageModalProduct.sku})
                </p>
              </div>
              <span className="text-[10px] text-slate-400">Max 10 MB</span>
            </div>

            <div className="space-y-4 text-xs">
              <ProductImageUploader
                value={inventoryImageVal}
                onChange={setInventoryImageVal}
                label="Warehouse Product Photo"
                maxSizeBytes={10 * 1024 * 1024}
              />

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#15213B]">
                <button
                  type="button"
                  onClick={() => setImageModalProduct(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveInventoryImage}
                  className="px-5 py-2 rounded-xl bg-[#173488] hover:bg-[#122A6E] text-white font-semibold shadow-sm transition"
                >
                  Save Image
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD NEW INVENTORY ITEM MODAL */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto bg-white dark:bg-[#0B1326] border border-slate-200 dark:border-[#1E293B] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#15213B] pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Add New Inventory Stock Item
                </h3>
                <p className="text-xs text-slate-500">
                  Register warehouse intake with physical photo and initial batch quantity.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-[#E6007A] bg-[#FFF5F8] dark:bg-[#1A1028] px-2.5 py-1 rounded-full border border-[#FCEAF2]">
                Inventory Intake
              </span>
            </div>

            <form onSubmit={handleAddStockItem} className="space-y-4 text-xs">
              {/* Product Image Upload Section */}
              <div className="p-3.5 rounded-2xl bg-slate-50/60 dark:bg-[#0E1726]/60 border border-slate-100 dark:border-[#15213B]">
                <ProductImageUploader
                  value={newItemImage}
                  onChange={setNewItemImage}
                  label="Product Photo / Packaging Image"
                  maxSizeBytes={10 * 1024 * 1024}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Product / Formulation Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Argan Conditioning Mask"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] text-slate-900 dark:text-white font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PC-INV-8021"
                    value={newItemSku}
                    onChange={(e) => setNewItemSku(e.target.value.toUpperCase())}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] font-semibold text-slate-900 dark:text-white"
                  >
                    {categories.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Unit Cost (TZS)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    required
                    value={newItemCost}
                    onChange={(e) => setNewItemCost(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] text-slate-900 dark:text-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Retail Price (TZS)
                  </label>
                  <input
                    type="number"
                    min={500}
                    step={500}
                    required
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Intake Quantity
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newItemStock}
                    onChange={(e) => setNewItemStock(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Audit / Intake Note
                </label>
                <input
                  type="text"
                  value={newItemNote}
                  onChange={(e) => setNewItemNote(e.target.value)}
                  placeholder="e.g. Carrier airway bill #DAR-4890, batch inspected"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#15213B]">
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#173488] hover:bg-[#122A6E] text-white font-semibold shadow-sm transition"
                >
                  Record Item & Intake Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESTOCK MODAL */}
      {showRestockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#0B1326] border border-slate-200 dark:border-[#1E293B] rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Restock Product Batch
            </h3>
            <form onSubmit={handleRestockSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Product
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] text-slate-900 dark:text-white font-semibold"
                >
                  {productList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — Current: {p.stock} units
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Quantity Received
                </label>
                <input
                  type="number"
                  min={1}
                  value={actionQuantity}
                  onChange={(e) => setActionQuantity(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Audit / Delivery Note
                </label>
                <input
                  type="text"
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder="e.g. Shipment invoice #TZ-992 from supplier"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-[#15213B]">
                <button
                  type="button"
                  onClick={() => setShowRestockModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#173488] hover:bg-[#122A6E] text-white font-semibold shadow-sm transition"
                >
                  Confirm Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADJUST STOCK MODAL */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#0B1326] border border-slate-200 dark:border-[#1E293B] rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Stock Audit Adjustment
            </h3>
            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Product
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] text-slate-900 dark:text-white font-semibold"
                >
                  {productList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — Current: {p.stock} units
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Adjustment Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType("adjustment")}
                    className={`p-2.5 rounded-xl border text-center font-bold ${
                      adjustType === "adjustment"
                        ? "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"
                        : "border-slate-200 dark:border-[#1B273F] text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    Deduct (Damaged/Lost)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType("return")}
                    className={`p-2.5 rounded-xl border text-center font-bold ${
                      adjustType === "return"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                        : "border-slate-200 dark:border-[#1B273F] text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    Return (Add Back)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min={1}
                  value={actionQuantity}
                  onChange={(e) => setActionQuantity(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Adjustment
                </label>
                <input
                  type="text"
                  required
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder="e.g. Broken bottle during Kariakoo shelf transfer"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-[#15213B]">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-sm"
                >
                  Record Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
