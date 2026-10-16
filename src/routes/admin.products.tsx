import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Archive,
  RotateCcw,
  AlertTriangle,
  Eye,
  EyeOff,
  CheckCircle,
  Tag,
  Camera,
  Image as ImageIcon,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { categories, Product, formatTSh } from "@/data/shop";
import { EditPriceModal, ConfirmDialog } from "@/components/admin/AdminModals";
import { toast } from "@/components/ui/sonner";
import {
  StoredProduct as ExtendedProduct,
  getStoredProducts,
  saveStoredProducts,
  updateProductImage,
  PRODUCTS_UPDATE_EVENT,
} from "@/lib/products-store";
import { ProductImageUploader } from "@/components/admin/ProductImageUploader";

export const Route = createFileRoute("/admin/products")({
  head: () => ({
    meta: [
      { title: "Products & Formulations Catalog — Philipo Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminProductsRoute,
});

export function AdminProductsRoute() {
  const [productsList, setProductsList] = useState<ExtendedProduct[]>(() => getStoredProducts());
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "LOW_STOCK" | "ARCHIVED">("ALL");
  const [showArchived, setShowArchived] = useState(false);

  // Price Edit Modal
  const [priceEditTarget, setPriceEditTarget] = useState<ExtendedProduct | null>(null);

  // Archive Confirm Dialog
  const [archiveTarget, setArchiveTarget] = useState<ExtendedProduct | null>(null);

  // Add / Edit Product Modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ExtendedProduct | null>(null);

  // Quick Photo Edit Modal
  const [imageEditTarget, setImageEditTarget] = useState<ExtendedProduct | null>(null);
  const [quickImageVal, setQuickImageVal] = useState("");

  // Form states
  const [formName, setFormName] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formCategory, setFormCategory] = useState("Skincare");
  const [formPrice, setFormPrice] = useState<number>(45000);
  const [formCost, setFormCost] = useState<number>(20000);
  const [formStock, setFormStock] = useState<number>(25);
  const [formTagline, setFormTagline] = useState("");
  const [formImage, setFormImage] = useState("");

  // Keep state synchronized with storage events
  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail) {
        setProductsList(e.detail);
      } else {
        setProductsList(getStoredProducts());
      }
    };
    window.addEventListener(PRODUCTS_UPDATE_EVENT, handleUpdate);
    return () => window.removeEventListener(PRODUCTS_UPDATE_EVENT, handleUpdate);
  }, []);

  const filteredProducts = useMemo(() => {
    return productsList.filter((p) => {
      // Archive filter
      if (!showArchived && p.isArchived) return false;
      if (statusFilter === "ARCHIVED" && !p.isArchived) return false;
      if (statusFilter === "ACTIVE" && p.isArchived) return false;
      if (statusFilter === "LOW_STOCK" && (p.stock > 10 || p.isArchived)) return false;

      // Category filter
      if (categoryFilter !== "ALL" && !p.category.toLowerCase().includes(categoryFilter.toLowerCase())) {
        return false;
      }

      // Search filter
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
  }, [productsList, searchQuery, categoryFilter, statusFilter, showArchived]);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormName("");
    setFormSku(`PC-${categoryFilter !== "ALL" ? categoryFilter.slice(0, 3).toUpperCase() : "BEA"}-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormCategory(categories[0]?.name || "Skincare");
    setFormPrice(45000);
    setFormCost(20000);
    setFormStock(25);
    setFormTagline("Pure formulation · Salon grade");
    setFormImage("");
    setShowProductModal(true);
  };

  const openEditModal = (p: ExtendedProduct) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormSku(p.sku);
    setFormCategory(p.category);
    setFormPrice(p.price);
    setFormCost(p.cost || Math.round(p.price * 0.45));
    setFormStock(p.stock);
    setFormTagline(p.tagline || "");
    setFormImage(p.image || "");
    setShowProductModal(true);
  };

  const openQuickImageModal = (p: ExtendedProduct) => {
    setImageEditTarget(p);
    setQuickImageVal(p.image || "");
  };

  const handleSaveQuickImage = () => {
    if (!imageEditTarget) return;
    const updated = updateProductImage(imageEditTarget.id, quickImageVal);
    if (updated) {
      setProductsList(getStoredProducts());
      toast.success("Photo Updated", {
        description: `Product photo for "${imageEditTarget.name}" has been updated.`,
      });
    }
    setImageEditTarget(null);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSku = formSku.trim().toUpperCase();

    // Validate SKU uniqueness
    if (editingProduct) {
      if (productsList.some((p) => p.id !== editingProduct.id && p.sku.toUpperCase() === cleanSku)) {
        toast.error(`SKU "${cleanSku}" is already in use by another product.`);
        return;
      }

      const updated = productsList.map((p) =>
        p.id === editingProduct.id
          ? {
              ...p,
              name: formName.trim(),
              sku: cleanSku,
              category: formCategory,
              price: Number(formPrice),
              cost: Number(formCost),
              stock: Number(formStock),
              tagline: formTagline.trim(),
              image: formImage || editingProduct.image || "",
            }
          : p,
      );
      setProductsList(updated);
      saveStoredProducts(updated);
      toast.success("Product Updated", {
        description: `Changes to "${formName}" have been saved.`,
      });
    } else {
      if (productsList.some((p) => p.sku.toUpperCase() === cleanSku)) {
        toast.error(`SKU "${cleanSku}" already exists. Please choose a unique SKU.`);
        return;
      }

      const newProd: ExtendedProduct = {
        id: `prod-${Date.now()}`,
        slug: cleanSku.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        name: formName.trim(),
        sku: cleanSku,
        tagline: formTagline.trim() || "Authentic salon grade formulation",
        category: formCategory,
        price: Number(formPrice),
        compareAt: Number(formPrice) * 1.2,
        cost: Number(formCost),
        stock: Number(formStock),
        reserved: 0,
        rating: 5.0,
        reviews: 0,
        image: formImage || "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&q=80",
        badge: "New",
        description: "Official Philipo Cosmetics luxury formulation.",
        details: ["TBS Certified", "Authentic formulation", "Dermatologist approved"],
        isArchived: false,
      };

      const updated = [newProd, ...productsList];
      setProductsList(updated);
      saveStoredProducts(updated);
      toast.success("Product Added", {
        description: `New formulation "${newProd.name}" is now listed in catalog.`,
      });
    }

    setShowProductModal(false);
  };

  const handleUpdatePrice = async (newPrice: number) => {
    if (!priceEditTarget) return;
    const updated = productsList.map((p) =>
      p.id === priceEditTarget.id ? { ...p, price: newPrice } : p,
    );
    setProductsList(updated);
    saveStoredProducts(updated);
    toast.success("Price Updated", {
      description: `${priceEditTarget.name} price changed to ${formatTSh(newPrice)}.`,
    });
  };

  const handleArchiveConfirm = () => {
    if (!archiveTarget) return;
    const targetId = archiveTarget.id;
    const targetName = archiveTarget.name;

    const updated = productsList.map((p) =>
      p.id === targetId ? { ...p, isArchived: true } : p,
    );
    setProductsList(updated);
    saveStoredProducts(updated);
    setArchiveTarget(null);

    // Toast with Undo action
    toast("Product Archived", {
      description: `"${targetName}" has been moved to archives.`,
      action: {
        label: "Undo",
        onClick: () => {
          const restored = productsList.map((p) =>
            p.id === targetId ? { ...p, isArchived: false } : p,
          );
          setProductsList(restored);
          saveStoredProducts(restored);
          toast.success("Archive Undone", {
            description: `"${targetName}" restored to active catalog.`,
          });
        },
      },
    });
  };

  const handleUnarchive = (p: ExtendedProduct) => {
    const updated = productsList.map((item) =>
      item.id === p.id ? { ...item, isArchived: false } : item,
    );
    setProductsList(updated);
    saveStoredProducts(updated);
    toast.success("Product Restored", {
      description: `"${p.name}" is active again.`,
    });
  };

  return (
    <AdminLayout
      title="Products Catalog & Pricing"
      subtitle="Maintain catalog retail pricing, formula specifications, stock levels, and active SKU statuses."
      headerAction={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-semibold transition ${
              showArchived
                ? "bg-slate-900 text-white dark:bg-blue-600 border-transparent"
                : "bg-white dark:bg-[#0B1326] border-slate-200 dark:border-[#1E293B] text-slate-700 dark:text-slate-300"
            }`}
          >
            {showArchived ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            <span>{showArchived ? "Hide Archived" : "Show Archived"}</span>
          </button>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0F172A] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition"
          >
            <Plus className="size-3.5" />
            <span>Add Product</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Search and Filters Bar */}
        <div className="bg-white dark:bg-[#0B1326] p-4 rounded-2xl border border-slate-200 dark:border-[#15213B] shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product, SKU, collection..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active SKUs</option>
              <option value="LOW_STOCK">Low Stock (&le; 10)</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white dark:bg-[#0B1326] p-6 rounded-3xl border border-slate-100 dark:border-[#15213B] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Catalog Items ({filteredProducts.length})
            </h3>
            <span className="text-xs text-slate-400">
              Prices displayed in official TZS format
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-[#15213B] text-slate-400 font-semibold">
                  <th className="py-3 px-3">Product</th>
                  <th className="py-3 px-3">SKU</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Retail Price</th>
                  <th className="py-3 px-3">Unit Cost</th>
                  <th className="py-3 px-3">Stock Level</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-[#15213B]">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No products match your current search or filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const isLowStock = p.stock <= 10;

                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-slate-50/60 dark:hover:bg-[#0E1A33] transition-colors ${
                          p.isArchived ? "opacity-60 bg-slate-50/30" : ""
                        }`}
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <div
                              onClick={() => openQuickImageModal(p)}
                              className="relative group size-10 rounded-xl overflow-hidden bg-slate-100 shrink-0 cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
                              title="Click to update photo"
                            >
                              <img
                                src={p.image}
                                alt={p.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <Camera className="size-3.5" />
                              </div>
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white line-clamp-1">
                                {p.name}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate max-w-xs">
                                {p.tagline || p.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                          {p.sku}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                          {p.category}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                          {formatTSh(p.price)}
                        </td>
                        <td className="py-3 px-3 text-slate-500">
                          {formatTSh(p.cost || Math.round(p.price * 0.45))}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-bold ${
                                isLowStock ? "text-rose-600" : "text-emerald-600"
                              }`}
                            >
                              {p.stock} units
                            </span>
                            {isLowStock && (
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                                Low
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          {p.isArchived ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              Archived
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            <button
                              onClick={() => openQuickImageModal(p)}
                              title="Update Photo"
                              className="p-1.5 rounded-lg hover:bg-[#FFF5F8] dark:hover:bg-slate-800 text-slate-500 hover:text-[#E6007A] transition"
                            >
                              <Camera className="size-3.5" />
                            </button>
                            <button
                              onClick={() => setPriceEditTarget(p)}
                              className="text-xs font-semibold text-slate-900 dark:text-white hover:underline cursor-pointer"
                            >
                              Price
                            </button>
                            <button
                              onClick={() => openEditModal(p)}
                              className="text-xs font-semibold text-[#173488] dark:text-blue-400 hover:underline cursor-pointer"
                            >
                              Edit
                            </button>
                            {p.isArchived ? (
                              <button
                                onClick={() => handleUnarchive(p)}
                                className="text-xs font-semibold text-emerald-600 hover:underline cursor-pointer"
                              >
                                Restore
                              </button>
                            ) : (
                              <button
                                onClick={() => setArchiveTarget(p)}
                                className="text-xs text-rose-500 hover:underline cursor-pointer"
                              >
                                Archive
                              </button>
                            )}
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

      {/* EDIT PRICE MODAL (Zero browser prompt) */}
      <EditPriceModal
        open={Boolean(priceEditTarget)}
        productName={priceEditTarget?.name || ""}
        currentPrice={priceEditTarget?.price || 0}
        onSave={handleUpdatePrice}
        onClose={() => setPriceEditTarget(null)}
      />

      {/* ARCHIVE CONFIRM DIALOG (Zero browser confirm) */}
      <ConfirmDialog
        open={Boolean(archiveTarget)}
        title="Archive Catalog Product"
        message={`Are you sure you want to archive "${archiveTarget?.name}"? It will be hidden from storefront listings, with an undo option available.`}
        confirmLabel="Archive Product"
        destructive={true}
        onConfirm={handleArchiveConfirm}
        onCancel={() => setArchiveTarget(null)}
      />

      {/* ADD / EDIT PRODUCT MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto bg-white dark:bg-[#0B1326] border border-slate-200 dark:border-[#1E293B] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#15213B] pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingProduct ? `Edit Product: ${editingProduct.name}` : "Add New Product to Catalog"}
              </h3>
              <span className="text-[11px] font-semibold text-[#E6007A] bg-[#FFF5F8] dark:bg-[#1A1028] px-2.5 py-1 rounded-full border border-[#FCEAF2]">
                Philipo Brand Atelier
              </span>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              {/* Product Image Uploader (Local File up to 10MB or Web URL) */}
              <div className="p-3.5 rounded-2xl bg-slate-50/60 dark:bg-[#0E1726]/60 border border-slate-100 dark:border-[#15213B]">
                <ProductImageUploader
                  value={formImage}
                  onChange={setFormImage}
                  label="Product Formulation Image"
                  maxSizeBytes={10 * 1024 * 1024}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pure Botanical Glow Serum"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] text-slate-900 dark:text-white font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Unique SKU Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PC-SKN-1002"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value.toUpperCase())}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
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
                    Retail Price (TZS)
                  </label>
                  <input
                    type="number"
                    min={500}
                    step={500}
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Unit Cost (TZS)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    required
                    value={formCost}
                    onChange={(e) => setFormCost(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tagline / Formulation Highlights
                </label>
                <input
                  type="text"
                  placeholder="e.g. Brightening · Pure botanical niacinamide"
                  value={formTagline}
                  onChange={(e) => setFormTagline(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#15213B]">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#173488] hover:bg-[#122A6E] text-white font-semibold shadow-sm transition"
                >
                  {editingProduct ? "Save Changes" : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK PHOTO EDIT MODAL */}
      {imageEditTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#0B1326] border border-slate-200 dark:border-[#1E293B] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#15213B] pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Update Product Photo
                </h3>
                <p className="text-xs text-slate-500 font-medium">{imageEditTarget.name} ({imageEditTarget.sku})</p>
              </div>
              <span className="text-[10px] text-slate-400">Max 10 MB</span>
            </div>

            <div className="space-y-4 text-xs">
              <ProductImageUploader
                value={quickImageVal}
                onChange={setQuickImageVal}
                label="New Product Photo"
                maxSizeBytes={10 * 1024 * 1024}
              />

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#15213B]">
                <button
                  type="button"
                  onClick={() => setImageEditTarget(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuickImage}
                  className="px-5 py-2 rounded-xl bg-[#173488] hover:bg-[#122A6E] text-white font-semibold shadow-sm transition"
                >
                  Save Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
