/**
 * Philipo Cosmetics — Stock Movement & Inventory Ledger Store
 * Tracks all stock events: sale, restock, adjustment, return.
 */

export type StockMovementType = "restock" | "adjustment" | "sale" | "return";

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: StockMovementType;
  quantityChange: number; // positive for restock/return, negative for sale/adjustment
  balanceAfter: number;
  user: string;
  note: string;
  createdAt: string;
}

const INVENTORY_STORAGE_KEY = "philipo_inventory_movements_v1";

const DEFAULT_MOVEMENTS: StockMovement[] = [
  {
    id: "SM-1001",
    productId: "p-serum",
    productName: "Radiance Serum",
    sku: "PC-SKN-0012",
    type: "restock",
    quantityChange: 50,
    balanceAfter: 50,
    user: "System Admin",
    note: "Initial warehouse shipment Kariakoo Hub",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "SM-1002",
    productId: "p-serum",
    productName: "Radiance Serum",
    sku: "PC-SKN-0012",
    type: "sale",
    quantityChange: -8,
    balanceAfter: 42,
    user: "POS Counter",
    note: "Order #ORD-84920 checkout",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "SM-1003",
    productId: "p-hair-oil",
    productName: "Luxe Hair Oil",
    sku: "PC-HAR-0007",
    type: "restock",
    quantityChange: 20,
    balanceAfter: 20,
    user: "System Admin",
    note: "Direct import Argan batch",
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
  {
    id: "SM-1004",
    productId: "p-hair-oil",
    productName: "Luxe Hair Oil",
    sku: "PC-HAR-0007",
    type: "sale",
    quantityChange: -12,
    balanceAfter: 8,
    user: "Online Store",
    note: "High customer demand salon bundle",
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: "SM-1005",
    productId: "p-moisturizer",
    productName: "Hydra Moisturizer",
    sku: "PC-SKN-0058",
    type: "restock",
    quantityChange: 70,
    balanceAfter: 70,
    user: "System Admin",
    note: "Bulk restocking shipment",
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: "SM-1006",
    productId: "p-moisturizer",
    productName: "Hydra Moisturizer",
    sku: "PC-SKN-0058",
    type: "sale",
    quantityChange: -6,
    balanceAfter: 64,
    user: "POS Counter",
    note: "Walk-in purchase",
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

export function getStockMovements(): StockMovement[] {
  if (typeof window === "undefined") return DEFAULT_MOVEMENTS;
  try {
    const raw = localStorage.getItem(INVENTORY_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(DEFAULT_MOVEMENTS));
      return DEFAULT_MOVEMENTS;
    }
    return JSON.parse(raw) as StockMovement[];
  } catch {
    return DEFAULT_MOVEMENTS;
  }
}

export function recordStockMovement(movement: Omit<StockMovement, "id" | "createdAt">): StockMovement {
  const current = getStockMovements();
  const newRecord: StockMovement = {
    ...movement,
    id: `SM-${Date.now().toString().slice(-6)}`,
    createdAt: new Date().toISOString(),
  };

  const updated = [newRecord, ...current];
  try {
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to persist stock movement:", err);
  }
  return newRecord;
}
