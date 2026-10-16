import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Package,
  AlertCircle,
  X,
  Check,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { categories as initialCategories, products, CategoryItem } from "@/data/shop";
import { ConfirmDialog } from "@/components/admin/AdminModals";
import { toast } from "@/components/ui/sonner";

export const Route = createFileRoute("/admin/categories")({
  head: () => ({
    meta: [
      { title: "Categories & Beauty Collections — Philipo Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminCategoriesRoute,
});

const CATEGORIES_STORAGE_KEY = "philipo_categories_v1";

function getStoredCategories(): CategoryItem[] {
  if (typeof window === "undefined") return initialCategories;
  try {
    const raw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(initialCategories));
      return initialCategories;
    }
    const parsed = JSON.parse(raw) as CategoryItem[];
    const existingNames = new Set(parsed.map((c) => c.name.toLowerCase()));
    let hasNew = false;
    const merged = [...parsed];
    for (const initCat of initialCategories) {
      if (!existingNames.has(initCat.name.toLowerCase())) {
        merged.push(initCat);
        hasNew = true;
      }
    }
    if (hasNew) {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(merged));
    }
    return merged;
  } catch {
    return initialCategories;
  }
}

function saveStoredCategories(cats: CategoryItem[]) {
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(cats));
  } catch (err) {
    console.error("Failed to save categories:", err);
  }
}

export function AdminCategoriesRoute() {
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>(() => getStoredCategories());
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);

  // Form states
  const [catName, setCatName] = useState("");
  const [catTitle, setCatTitle] = useState("");
  const [catDesc, setCatDesc] = useState("");

  // Delete target
  const [deleteTarget, setDeleteTarget] = useState<CategoryItem | null>(null);

  // Dynamic active SKU count per category
  const skuCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    categoriesList.forEach((c) => {
      const match = products.filter(
        (p) => p.category.toLowerCase().includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(p.category.toLowerCase()),
      );
      counts[c.name] = match.length;
    });
    return counts;
  }, [categoriesList]);

  const openCreateModal = () => {
    setEditingCategory(null);
    setCatName("");
    setCatTitle("");
    setCatDesc("");
    setShowModal(true);
  };

  const openEditModal = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatTitle(cat.title);
    setCatDesc(cat.description);
    setShowModal(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = catName.trim();
    if (!cleanName) {
      toast.error("Category name is required");
      return;
    }

    if (editingCategory) {
      const updated = categoriesList.map((c) =>
        c.name === editingCategory.name
          ? {
              ...c,
              name: cleanName,
              title: catTitle.trim() || `${cleanName} Collection`,
              description: catDesc.trim(),
            }
          : c,
      );
      setCategoriesList(updated);
      saveStoredCategories(updated);
      toast.success("Category Updated", {
        description: `Beauty collection "${cleanName}" has been updated.`,
      });
    } else {
      if (categoriesList.some((c) => c.name.toLowerCase() === cleanName.toLowerCase())) {
        toast.error(`Category "${cleanName}" already exists.`);
        return;
      }

      const newCat: CategoryItem = {
        name: cleanName,
        title: catTitle.trim() || `${cleanName} Line`,
        count: 0,
        image: initialCategories[0]?.image || "",
        description: catDesc.trim() || "Premium formulations and salon grade beauty collections.",
        tint: "bg-emerald-50 text-emerald-700",
      };

      const updated = [...categoriesList, newCat];
      setCategoriesList(updated);
      saveStoredCategories(updated);
      toast.success("Category Created", {
        description: `Collection "${cleanName}" is now active in product management.`,
      });
    }

    setShowModal(false);
  };

  const handleDeleteRequest = (cat: CategoryItem) => {
    const skusUsingCategory = skuCounts[cat.name] || 0;
    if (skusUsingCategory > 0) {
      toast.error("Cannot Delete Category", {
        description: `Category "${cat.name}" has ${skusUsingCategory} active product(s) assigned. Reassign or remove products before deleting this category.`,
      });
      return;
    }

    setDeleteTarget(cat);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const updated = categoriesList.filter((c) => c.name !== deleteTarget.name);
    setCategoriesList(updated);
    saveStoredCategories(updated);
    toast.success("Category Deleted", {
      description: `Category "${deleteTarget.name}" has been removed.`,
    });
    setDeleteTarget(null);
  };

  return (
    <AdminLayout
      title="Categories & Beauty Collections"
      subtitle="Organize shop departments, salon treatments, and fragrance collections with active product guardrails."
      headerAction={
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0F172A] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition"
        >
          <Plus className="size-3.5" />
          <span>Add Category</span>
        </button>
      }
    >
      <div className="space-y-6">
        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categoriesList.map((cat) => {
            const activeSKUs = skuCounts[cat.name] || 0;

            return (
              <div
                key={cat.name}
                className="bg-white dark:bg-[#0B1326] p-5 rounded-2xl border border-slate-100 dark:border-[#15213B] shadow-xs flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-[#0E1726] text-slate-700 dark:text-slate-300">
                      {activeSKUs} Active SKUs
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(cat)}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white"
                        title="Edit category"
                      >
                        <Edit2 className="size-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteRequest(cat)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600"
                        title="Delete category"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 dark:text-white">{cat.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {cat.description || "Premium formulations and salon grade beauty collections."}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-[#15213B] text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Display: {cat.title}</span>
                  {activeSKUs > 0 ? (
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <Check className="size-3" /> In Use
                    </span>
                  ) : (
                    <span className="text-slate-400 font-semibold">Unassigned</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CREATE / EDIT CATEGORY MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#0B1326] border border-slate-200 dark:border-[#1E293B] rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {editingCategory ? `Edit Category "${editingCategory.name}"` : "Add Beauty Category"}
            </h3>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category Name (e.g. Skincare, Fragrance)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Category Name"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] text-slate-900 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Display Header / Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pure Skincare & Hydration"
                  value={catTitle}
                  onChange={(e) => setCatTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief summary of formulations in this category..."
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-[#15213B]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 dark:bg-blue-600 text-white font-semibold shadow-sm"
                >
                  {editingCategory ? "Save Changes" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Category"
        message={`Are you sure you want to delete category "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        destructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminLayout>
  );
}
