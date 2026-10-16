import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  MessageSquare,
  Search,
  Star,
  CheckCircle,
  EyeOff,
  Eye,
  Trash2,
  Sparkles,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { toast } from "@/components/ui/sonner";

export const Route = createFileRoute("/admin/reviews")({
  head: () => ({
    meta: [
      { title: "Customer Reviews & Moderation — Philipo Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminReviewsRoute,
});

interface ReviewItem {
  id: string;
  customerName: string;
  itemReviewed: string;
  rating: number;
  comment: string;
  isPublished: boolean;
  date: string;
}

const DEFAULT_REVIEWS: ReviewItem[] = [
  {
    id: "REV-101",
    customerName: "Amina Juma",
    itemReviewed: "Radiance Serum (Niacinamide)",
    rating: 5,
    comment: "My skin glowed after just 5 days of use. Smells like pure luxury and light on skin in Dar humidity!",
    isPublished: true,
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "REV-102",
    customerName: "Zawadi Mremi",
    itemReviewed: "Hydra Moisturizer",
    rating: 5,
    comment: "Leaves no oily residue. Best moisturizer I have purchased in Tanzania. Very fast dispatch to Arusha.",
    isPublished: true,
    date: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: "REV-103",
    customerName: "Fatma Kassim",
    itemReviewed: "Salon: Knotless Braids with Stylist Grace",
    rating: 5,
    comment: "Gentle on my scalp and perfectly styled. Philipo salon has unmatched hospitality and cleanliness.",
    isPublished: true,
    date: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
  {
    id: "REV-104",
    customerName: "Neema Lyimo",
    itemReviewed: "Luxe Hair Oil",
    rating: 4,
    comment: "Quality bottle and argan oil formulation. Keeps my hair nourished throughout the dry season.",
    isPublished: true,
    date: new Date(Date.now() - 86400000 * 9).toISOString(),
  },
];

export function AdminReviewsRoute() {
  const [reviews, setReviews] = useState<ReviewItem[]>(() => {
    if (typeof window === "undefined") return DEFAULT_REVIEWS;
    try {
      const raw = localStorage.getItem("philipo_admin_reviews_v1");
      return raw ? JSON.parse(raw) : DEFAULT_REVIEWS;
    } catch {
      return DEFAULT_REVIEWS;
    }
  });

  const [searchQuery, setSearchQuery] = useState("");

  const saveReviews = (list: ReviewItem[]) => {
    setReviews(list);
    try {
      localStorage.setItem("philipo_admin_reviews_v1", JSON.stringify(list));
    } catch {}
  };

  const filteredReviews = useMemo(() => {
    if (!searchQuery) return reviews;
    const q = searchQuery.toLowerCase();
    return reviews.filter(
      (r) =>
        r.customerName.toLowerCase().includes(q) ||
        r.itemReviewed.toLowerCase().includes(q) ||
        r.comment.toLowerCase().includes(q),
    );
  }, [reviews, searchQuery]);

  const togglePublished = (r: ReviewItem) => {
    const updated = reviews.map((item) =>
      item.id === r.id ? { ...item, isPublished: !item.isPublished } : item,
    );
    saveReviews(updated);
    toast.info(`Review ${r.isPublished ? "Hidden" : "Published"}`, {
      description: `Review for ${r.itemReviewed} status updated.`,
    });
  };

  const handleDelete = (id: string) => {
    const updated = reviews.filter((r) => r.id !== id);
    saveReviews(updated);
    toast.success("Review Deleted");
  };

  return (
    <AdminLayout
      title="Customer Reviews & Testimonials"
      subtitle="Moderation of guest ratings, verified beauty salon feedback, and store testimonial visibility."
    >
      <div className="space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-[#0B1326] p-5 rounded-2xl border border-slate-100 dark:border-[#15213B] shadow-xs space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Average Rating
            </span>
            <div className="text-xl font-bold text-amber-500 flex items-center gap-1.5">
              <Star className="size-5 fill-amber-400 text-amber-400" /> 4.9 / 5.0
            </div>
            <p className="text-[11px] text-slate-500">Based on verified purchaser feedback</p>
          </div>

          <div className="bg-white dark:bg-[#0B1326] p-5 rounded-2xl border border-slate-100 dark:border-[#15213B] shadow-xs space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Published Testimonials
            </span>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {reviews.filter((r) => r.isPublished).length} Reviews
            </div>
            <p className="text-[11px] text-slate-500">Displayed on storefront product pages</p>
          </div>

          <div className="bg-white dark:bg-[#0B1326] p-5 rounded-2xl border border-slate-100 dark:border-[#15213B] shadow-xs space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Guest Satisfaction
            </span>
            <div className="text-xl font-bold text-emerald-600">
              98.4% Positive
            </div>
            <p className="text-[11px] text-slate-500">Exceptional brand loyalty</p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white dark:bg-[#0B1326] p-4 rounded-2xl border border-slate-200 dark:border-[#15213B] shadow-xs flex items-center justify-between">
          <div className="relative w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reviewer, product, commentary..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Reviews Cards List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReviews.map((r) => (
            <div
              key={r.id}
              className="bg-white dark:bg-[#0B1326] p-5 rounded-3xl border border-slate-100 dark:border-[#15213B] shadow-xs space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`size-3.5 ${
                          i < r.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"
                        }`}
                      />
                    ))}
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      r.isPublished
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {r.isPublished ? "Published" : "Hidden"}
                  </span>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-200 italic leading-relaxed">
                  "{r.comment}"
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-[#15213B] flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{r.customerName}</p>
                  <p className="text-[10px] text-slate-400">{r.itemReviewed}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => togglePublished(r)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white"
                    title={r.isPublished ? "Hide from Storefront" : "Publish to Storefront"}
                  >
                    {r.isPublished ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-600"
                    title="Delete Review"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
