/**
 * Philipo Cosmetics — Promotional Coupons Store
 */

export interface Coupon {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number; // e.g. 15 for 15% or 10000 for 10,000 TZS
  minOrderAmount?: number;
  startDate?: string;
  endDate?: string;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
}

const COUPONS_STORAGE_KEY = "philipo_coupons_v1";

const DEFAULT_COUPONS: Coupon[] = [
  {
    id: "CPN-01",
    code: "PHILIPO15",
    type: "percent",
    value: 15,
    minOrderAmount: 30000,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    usageLimit: 200,
    usageCount: 42,
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "CPN-02",
    code: "KARIBU10",
    type: "fixed",
    value: 10000,
    minOrderAmount: 50000,
    startDate: "2026-02-01",
    endDate: "2026-11-30",
    usageLimit: 100,
    usageCount: 18,
    isActive: true,
    createdAt: "2026-02-01T00:00:00.000Z",
  },
];

export function getStoredCoupons(): Coupon[] {
  if (typeof window === "undefined") return DEFAULT_COUPONS;
  try {
    const raw = localStorage.getItem(COUPONS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(COUPONS_STORAGE_KEY, JSON.stringify(DEFAULT_COUPONS));
      return DEFAULT_COUPONS;
    }
    return JSON.parse(raw) as Coupon[];
  } catch {
    return DEFAULT_COUPONS;
  }
}

export function saveStoredCoupons(coupons: Coupon[]): void {
  try {
    localStorage.setItem(COUPONS_STORAGE_KEY, JSON.stringify(coupons));
  } catch (err) {
    console.error("Failed to save coupons:", err);
  }
}

export function createCoupon(data: Omit<Coupon, "id" | "usageCount" | "createdAt">): Coupon {
  const current = getStoredCoupons();
  const cleanCode = data.code.trim().toUpperCase();

  if (current.some((c) => c.code === cleanCode)) {
    throw new Error(`Coupon code "${cleanCode}" already exists.`);
  }

  const newCoupon: Coupon = {
    ...data,
    code: cleanCode,
    id: `CPN-${Date.now().toString().slice(-6)}`,
    usageCount: 0,
    createdAt: new Date().toISOString(),
  };

  const updated = [newCoupon, ...current];
  saveStoredCoupons(updated);
  return newCoupon;
}

export function updateCoupon(id: string, updates: Partial<Coupon>): Coupon {
  const current = getStoredCoupons();
  const index = current.findIndex((c) => c.id === id);
  if (index === -1) throw new Error("Coupon not found.");

  if (updates.code) {
    const cleanCode = updates.code.trim().toUpperCase();
    if (current.some((c) => c.id !== id && c.code === cleanCode)) {
      throw new Error(`Coupon code "${cleanCode}" already exists.`);
    }
    updates.code = cleanCode;
  }

  const updatedCoupon: Coupon = { ...current[index], ...updates };
  current[index] = updatedCoupon;
  saveStoredCoupons(current);
  return updatedCoupon;
}

export function deleteCoupon(id: string): void {
  const current = getStoredCoupons();
  const updated = current.filter((c) => c.id !== id);
  saveStoredCoupons(updated);
}
