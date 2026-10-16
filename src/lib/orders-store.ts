import { getStoredProducts, saveStoredProducts } from "./products-store";
import { recordStockMovement } from "./inventory-store";

export interface StoreOrderItem {
  name: string;
  qty: number;
  price: number;
}

export interface StoreOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  destination: string;
  items: StoreOrderItem[];
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  fulfillmentStatus: "Delivered" | "Processing" | "Shipped" | "Pending" | "Cancelled" | string;
  channel: "POS" | "Online" | "Salon";
  createdAt: string;
}

const ORDERS_KEY = "philipo_orders_ledger_v1";

// Authentic operational seed orders across all 12 months (Jan - Dec 2026)
export const DEFAULT_SEED_ORDERS: StoreOrder[] = [
  {
    id: "ord-2026-001",
    orderNumber: "PC-88401",
    customerName: "Amina Juma",
    customerPhone: "+255 754 112 334",
    customerEmail: "amina.juma@gmail.com",
    destination: "Mikocheni B, Dar es Salaam",
    items: [{ name: "Pure Botanical Glow Serum", qty: 2, price: 45000 }],
    total: 90000,
    paymentMethod: "M-Pesa",
    paymentStatus: "PAID",
    fulfillmentStatus: "Delivered",
    channel: "Online",
    createdAt: "2026-01-14T10:30:00.000Z",
  },
  {
    id: "ord-2026-002",
    orderNumber: "PC-88402",
    customerName: "Zawadi Bakari",
    customerPhone: "+255 765 223 445",
    customerEmail: "zawadi.b@yahoo.com",
    destination: "Kariakoo Counter Pickup",
    items: [
      { name: "Radiance Serum", qty: 1, price: 54000 },
      { name: "Velvet Matte Lipstick", qty: 2, price: 32000 },
    ],
    total: 118000,
    paymentMethod: "Cash",
    paymentStatus: "PAID",
    fulfillmentStatus: "Delivered",
    channel: "POS",
    createdAt: "2026-01-28T14:15:00.000Z",
  },
  {
    id: "ord-2026-003",
    orderNumber: "PC-88403",
    customerName: "Fatma Said",
    customerPhone: "+255 712 334 556",
    customerEmail: "fatma.said@gmail.com",
    destination: "Masaki, Chole Road",
    items: [{ name: "Hydrating Day Cream", qty: 2, price: 42000 }],
    total: 84000,
    paymentMethod: "Tigo Pesa",
    paymentStatus: "PAID",
    fulfillmentStatus: "Delivered",
    channel: "Online",
    createdAt: "2026-02-12T09:45:00.000Z",
  },
  {
    id: "ord-2026-004",
    orderNumber: "PC-88404",
    customerName: "Neema Mollel",
    customerPhone: "+255 788 445 667",
    customerEmail: "neema.mollel@gmail.com",
    destination: "Arusha Clocktower, Courier Dispatch",
    items: [{ name: "Rose Luxury Hair Oil", qty: 3, price: 38000 }],
    total: 114000,
    paymentMethod: "Airtel Money",
    paymentStatus: "PAID",
    fulfillmentStatus: "Delivered",
    channel: "Online",
    createdAt: "2026-02-24T16:20:00.000Z",
  },
  {
    id: "ord-2026-005",
    orderNumber: "PC-88405",
    customerName: "Halima Rashid",
    customerPhone: "+255 744 556 778",
    destination: "Sinza Mori, Dar es Salaam",
    items: [{ name: "Pure Botanical Glow Serum", qty: 1, price: 45000 }],
    total: 45000,
    paymentMethod: "M-Pesa",
    paymentStatus: "PAID",
    fulfillmentStatus: "Delivered",
    channel: "Online",
    createdAt: "2026-03-08T11:10:00.000Z",
  },
  {
    id: "ord-2026-006",
    orderNumber: "PC-88406",
    customerName: "Rehema Mwangi",
    customerPhone: "+255 714 889 012",
    destination: "Oysterbay, Haile Selassie Road",
    items: [
      { name: "Radiance Serum", qty: 2, price: 54000 },
      { name: "Rose Luxury Hair Oil", qty: 1, price: 38000 },
    ],
    total: 146000,
    paymentMethod: "Credit Card",
    paymentStatus: "PAID",
    fulfillmentStatus: "Delivered",
    channel: "Online",
    createdAt: "2026-03-21T15:00:00.000Z",
  },
  {
    id: "ord-2026-007",
    orderNumber: "PC-88407",
    customerName: "Salma Khamis",
    customerPhone: "+255 777 667 889",
    destination: "Zanzibar Stone Town Courier",
    items: [{ name: "Velvet Matte Lipstick", qty: 4, price: 32000 }],
    total: 128000,
    paymentMethod: "Tigo Pesa",
    paymentStatus: "PAID",
    fulfillmentStatus: "Delivered",
    channel: "Online",
    createdAt: "2026-04-05T13:30:00.000Z",
  },
  {
    id: "ord-2026-008",
    orderNumber: "PC-88408",
    customerName: "Grace Kimaro",
    customerPhone: "+255 752 778 990",
    destination: "Moshi Shanty Town Courier",
    items: [{ name: "Hydrating Day Cream", qty: 1, price: 42000 }],
    total: 42000,
    paymentMethod: "M-Pesa",
    paymentStatus: "PAID",
    fulfillmentStatus: "Delivered",
    channel: "Online",
    createdAt: "2026-04-19T10:15:00.000Z",
  },
  {
    id: "ord-2026-009",
    orderNumber: "PC-88409",
    customerName: "Saada Nassor",
    customerPhone: "+255 715 889 001",
    destination: "Upanga, Dar es Salaam",
    items: [{ name: "Pure Botanical Glow Serum", qty: 2, price: 45000 }],
    total: 90000,
    paymentMethod: "M-Pesa",
    paymentStatus: "PAID",
    fulfillmentStatus: "Delivered",
    channel: "Online",
    createdAt: "2026-05-11T12:00:00.000Z",
  },
  {
    id: "ord-2026-010",
    orderNumber: "PC-88410",
    customerName: "Lilian Mushi",
    customerPhone: "+255 784 990 112",
    destination: "Kariakoo Counter Pickup",
    items: [{ name: "Rose Luxury Hair Oil", qty: 2, price: 38000 }],
    total: 76000,
    paymentMethod: "Cash",
    paymentStatus: "PAID",
    fulfillmentStatus: "Delivered",
    channel: "POS",
    createdAt: "2026-05-27T17:40:00.000Z",
  },
  {
    id: "ord-2026-011",
    orderNumber: "PC-88411",
    customerName: "Irene Temba",
    customerPhone: "+255 768 112 233",
    destination: "Tegeta A, Dar es Salaam",
    items: [{ name: "Radiance Serum", qty: 3, price: 54000 }],
    total: 162000,
    paymentMethod: "Airtel Money",
    paymentStatus: "PAID",
    fulfillmentStatus: "Delivered",
    channel: "Online",
    createdAt: "2026-06-15T14:10:00.000Z",
  },
  {
    id: "ord-2026-012",
    orderNumber: "PC-88412",
    customerName: "Beatrice Shirima",
    customerPhone: "+255 754 223 344",
    destination: "Mwanza Capri Point Courier",
    items: [
      { name: "Hydrating Day Cream", qty: 2, price: 42000 },
      { name: "Velvet Matte Lipstick", qty: 1, price: 32000 },
    ],
    total: 116000,
    paymentMethod: "M-Pesa",
    paymentStatus: "PAID",
    fulfillmentStatus: "Delivered",
    channel: "Online",
    createdAt: "2026-07-07T09:30:00.000Z",
  },
  {
    id: "ord-2026-013",
    orderNumber: "PC-88413",
    customerName: "Zainab Ali",
    customerPhone: "+255 713 334 455",
    destination: "Dar Trade Fair Ground (Saba Saba)",
    items: [{ name: "Pure Botanical Glow Serum", qty: 5, price: 45000 }],
    total: 225000,
    paymentMethod: "Tigo Pesa",
    paymentStatus: "PAID",
    fulfillmentStatus: "Delivered",
    channel: "POS",
    createdAt: "2026-07-10T16:00:00.000Z",
  },
  {
    id: "ord-2026-014",
    orderNumber: "PC-88414",
    customerName: "Diana Mlay",
    customerPhone: "+255 782 445 566",
    destination: "Dodoma Area C Courier",
    items: [{ name: "Rose Luxury Hair Oil", qty: 2, price: 38000 }],
    total: 76000,
    paymentMethod: "M-Pesa",
    paymentStatus: "PAID",
    fulfillmentStatus: "Delivered",
    channel: "Online",
    createdAt: "2026-08-14T11:25:00.000Z",
  },
  {
    id: "ord-2026-015",
    orderNumber: "PC-88415",
    customerName: "Jackline Minja",
    customerPhone: "+255 744 556 677",
    destination: "Kariakoo Counter Pickup",
    items: [{ name: "Velvet Matte Lipstick", qty: 3, price: 32000 }],
    total: 96000,
    paymentMethod: "Cash",
    paymentStatus: "PAID",
    fulfillmentStatus: "Delivered",
    channel: "POS",
    createdAt: "2026-08-29T15:50:00.000Z",
  },
  {
    id: "ord-2026-016",
    orderNumber: "PC-88416",
    customerName: "Farida Hassan",
    customerPhone: "+255 765 667 788",
    destination: "Kinondoni Studio, Dar es Salaam",
    items: [{ name: "Radiance Serum", qty: 1, price: 54000 }],
    total: 54000,
    paymentMethod: "Tigo Pesa",
    paymentStatus: "PAID",
    fulfillmentStatus: "Delivered",
    channel: "Online",
    createdAt: "2026-09-12T10:00:00.000Z",
  },
  {
    id: "ord-2026-017",
    orderNumber: "PC-88417",
    customerName: "Mary Mushi",
    customerPhone: "+255 712 778 899",
    destination: "Mbezi Beach, Dar es Salaam",
    items: [
      { name: "Hydrating Day Cream", qty: 2, price: 42000 },
      { name: "Pure Botanical Glow Serum", qty: 1, price: 45000 },
    ],
    total: 129000,
    paymentMethod: "M-Pesa",
    paymentStatus: "PAID",
    fulfillmentStatus: "Shipped",
    channel: "Online",
    createdAt: "2026-09-28T14:30:00.000Z",
  },
  {
    id: "ord-2026-018",
    orderNumber: "PC-88418",
    customerName: "Shamsa Othman",
    customerPhone: "+255 777 889 900",
    destination: "Tanga Post Courier",
    items: [{ name: "Rose Luxury Hair Oil", qty: 4, price: 38000 }],
    total: 152000,
    paymentMethod: "Airtel Money",
    paymentStatus: "PAID",
    fulfillmentStatus: "Shipped",
    channel: "Online",
    createdAt: "2026-10-04T09:15:00.000Z",
  },
  {
    id: "ord-2026-019",
    orderNumber: "PC-88419",
    customerName: "Veronica Paul",
    customerPhone: "+255 754 990 011",
    destination: "Kariakoo Counter Dispatch",
    items: [{ name: "Velvet Matte Lipstick", qty: 2, price: 32000 }],
    total: 64000,
    paymentMethod: "M-Pesa",
    paymentStatus: "PAID",
    fulfillmentStatus: "Processing",
    channel: "Online",
    createdAt: "2026-10-14T11:45:00.000Z",
  },
  {
    id: "ord-2026-020",
    orderNumber: "PC-88420",
    customerName: "Asha Mwita",
    customerPhone: "+255 714 001 122",
    destination: "Mikocheni Light Industrial Area",
    items: [{ name: "Radiance Serum", qty: 2, price: 54000 }],
    total: 108000,
    paymentMethod: "Pending M-Pesa",
    paymentStatus: "PENDING",
    fulfillmentStatus: "Pending",
    channel: "Online",
    createdAt: "2026-10-15T08:00:00.000Z",
  },
  {
    id: "ord-2026-021",
    orderNumber: "PC-88421",
    customerName: "Catherine Moshi",
    customerPhone: "+255 784 112 233",
    destination: "Morogoro Town Courier",
    items: [{ name: "Hydrating Day Cream", qty: 1, price: 42000 }],
    total: 42000,
    paymentMethod: "Card Cancelled",
    paymentStatus: "FAILED",
    fulfillmentStatus: "Cancelled",
    channel: "Online",
    createdAt: "2026-10-15T08:20:00.000Z",
  },
  {
    id: "ord-2026-022",
    orderNumber: "PC-88422",
    customerName: "Nadia Suleiman",
    customerPhone: "+255 765 334 455",
    destination: "Dar City Centre",
    items: [{ name: "Pure Botanical Glow Serum", qty: 2, price: 45000 }],
    total: 90000,
    paymentMethod: "M-Pesa",
    paymentStatus: "PAID",
    fulfillmentStatus: "Processing",
    channel: "Online",
    createdAt: "2026-10-15T08:35:00.000Z",
  },
  {
    id: "ord-2026-023",
    orderNumber: "PC-88423",
    customerName: "Hilda Kimaro",
    customerPhone: "+255 712 445 566",
    destination: "Kariakoo Storefront VIP",
    items: [
      { name: "Radiance Serum", qty: 2, price: 54000 },
      { name: "Rose Luxury Hair Oil", qty: 2, price: 38000 },
    ],
    total: 184000,
    paymentMethod: "Cash",
    paymentStatus: "PAID",
    fulfillmentStatus: "Processing",
    channel: "POS",
    createdAt: "2026-11-05T10:15:00.000Z",
  },
  {
    id: "ord-2026-024",
    orderNumber: "PC-88424",
    customerName: "Glory Massawe",
    customerPhone: "+255 754 556 677",
    destination: "Oysterbay Salon Atelier",
    items: [{ name: "Pure Botanical Glow Serum", qty: 3, price: 45000 }],
    total: 135000,
    paymentMethod: "M-Pesa",
    paymentStatus: "PAID",
    fulfillmentStatus: "Delivered",
    channel: "Salon",
    createdAt: "2026-12-18T14:30:00.000Z",
  },
];

export function getStoredOrders(): StoreOrder[] {
  if (typeof window === "undefined") return DEFAULT_SEED_ORDERS;
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (!raw) {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(DEFAULT_SEED_ORDERS));
      return DEFAULT_SEED_ORDERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    localStorage.setItem(ORDERS_KEY, JSON.stringify(DEFAULT_SEED_ORDERS));
    return DEFAULT_SEED_ORDERS;
  } catch {
    return DEFAULT_SEED_ORDERS;
  }
}

export function saveStoredOrder(order: StoreOrder): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getStoredOrders();
    const updated = [order, ...existing.filter((o) => o.id !== order.id)];
    localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("philipo_orders_updated", { detail: updated }));

    // Automatically update stock levels and log inventory movements
    try {
      const currentProducts = getStoredProducts();
      let hasStockChange = false;
      const updatedProducts = currentProducts.map((p) => {
        const orderItem = order.items.find(
          (item) =>
            item.name.toLowerCase().trim() === p.name.toLowerCase().trim() ||
            (item as any).sku === p.sku,
        );
        if (orderItem) {
          hasStockChange = true;
          const newStock = Math.max(0, p.stock - orderItem.qty);
          recordStockMovement({
            productId: p.id,
            productName: p.name,
            sku: p.sku || `SKU-${p.id}`,
            type: "sale",
            quantityChange: -orderItem.qty,
            balanceAfter: newStock,
            user: order.channel === "POS" ? "POS Terminal" : "Online Checkout",
            note: `Order #${order.orderNumber} placed by ${order.customerName}`,
          });
          return { ...p, stock: newStock };
        }
        return p;
      });

      if (hasStockChange) {
        saveStoredProducts(updatedProducts);
      }
    } catch (invErr) {
      console.warn("Could not sync stock on order placement:", invErr);
    }
  } catch (err) {
    console.error("Failed to save order", err);
  }
}

export function updateStoredOrderStatus(orderId: string, newFulfillmentStatus: string): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getStoredOrders();
    const updated = existing.map((o) =>
      o.id === orderId || o.orderNumber === orderId
        ? { ...o, fulfillmentStatus: newFulfillmentStatus }
        : o,
    );
    localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("philipo_orders_updated", { detail: updated }));
  } catch (err) {
    console.error("Failed to update order status", err);
  }
}
