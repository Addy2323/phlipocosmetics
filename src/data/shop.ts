import serum from "@/assets/p-serum.jpg";
import lipstick from "@/assets/p-lipstick.jpg";
import hairoil from "@/assets/p-hairoil.jpg";
import cream from "@/assets/p-cream.jpg";
import beautyTools from "@/assets/beauty-tools.jpg";
import catSkincare from "@/assets/skincare/cat-skincare.jpg";
import catMakeup from "@/assets/makeup/cat-makeup.jpg";
import catHair from "@/assets/hair-care/cat-hair.jpg";
import catFragrance from "@/assets/fragrance/cat-fragrance.jpg";
import catBodyOil from "@/assets/body-oil/cat-body-oil.jpg";
import catSoap from "@/assets/soap/cat-soap.jpg";

export const BRAND = {
  name: "Philipo Cosmetics",
  full: "Philipo Cosmetics & Beauty Salon",
  city: "Dar es Salaam",
  country: "Tanzania",
  phone: "+255 744 281 673",
  currency: "TZS",
};

export const money = (v: number) => `TZS ${(v || 0).toLocaleString("en-US")}`;
export const formatTSh = (v: number) => {
  try {
    return new Intl.NumberFormat("en-TZ", {
      style: "currency",
      currency: "TZS",
      maximumFractionDigits: 0,
    }).format(v || 0);
  } catch {
    return `TZS ${(v || 0).toLocaleString("en-US")}`;
  }
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  category: string;
  price: number;
  compareAt?: number;
  rating: number;
  reviews: number;
  stock: number;
  reserved: number;
  sku: string;
  image: string;
  badge?: string;
  description: string;
  details: string[];
  isArchived?: boolean;
};

export const products: Product[] = [
  {
    id: "P-1001",
    slug: "radiance-serum",
    name: "Radiance Serum",
    tagline: "Brighten · Firm · Replenish",
    category: "Skincare",
    price: 54000,
    compareAt: 68000,
    rating: 4.9,
    reviews: 128,
    stock: 42,
    reserved: 6,
    sku: "PC-SKN-0031",
    image: serum,
    badge: "Best seller",
    description:
      "A featherlight vitamin-rich serum that lifts dullness and evens tone, formulated for humid coastal climates.",
    details: ["30 ml glass bottle", "Vitamin C + niacinamide", "Fragrance free", "Dermatologist tested"],
  },
  {
    id: "P-1004",
    slug: "hydra-moisturizer",
    name: "Hydra Moisturizer",
    tagline: "Deep Hydration · Barrier Protection",
    category: "Skincare",
    price: 48000,
    compareAt: 56000,
    rating: 4.8,
    reviews: 96,
    stock: 64,
    reserved: 2,
    sku: "PC-SKN-0058",
    image: cream,
    badge: "Top Rated",
    description:
      "A rich but breathable day cream with a soft-focus finish, layered beautifully under makeup.",
    details: ["50 ml jar", "Hyaluronic acid", "SPF free — layer with sunscreen", "Refillable"],
  },
  {
    id: "P-1002",
    slug: "matte-lipstick",
    name: "Matte Lipstick",
    tagline: "Long wear velvet finish",
    category: "Makeup",
    price: 32000,
    compareAt: 38000,
    rating: 4.9,
    reviews: 210,
    stock: 120,
    reserved: 14,
    sku: "PC-MKP-0112",
    image: lipstick,
    badge: "Trending",
    description:
      "Eight-hour velvet colour that never cakes. A deep berry that flatters every skin tone in our shade studies.",
    details: ["7 ml", "Transfer resistant", "Shea butter base", "Cruelty free"],
  },
  {
    id: "P-1006",
    slug: "glow-foundation",
    name: "Glow Foundation",
    tagline: "Luminous · Breathable · 16H Wear",
    category: "Makeup",
    price: 46000,
    compareAt: 55000,
    rating: 4.8,
    reviews: 154,
    stock: 35,
    reserved: 4,
    sku: "PC-MKP-0220",
    image: hairoil,
    badge: "New",
    description:
      "A lightweight, humidity-resistant liquid foundation that melts into the skin for a second-skin radiant glow.",
    details: ["35 ml bottle with pump", "Hyaluronic + Vitamin E", "Non-comedogenic", "Medium-to-full buildable"],
  },
  {
    id: "P-1003",
    slug: "luxe-hair-oil",
    name: "Luxe Hair Oil",
    tagline: "Nourish · Strengthen · Shine",
    category: "Hair",
    price: 39000,
    compareAt: 45000,
    rating: 4.9,
    reviews: 204,
    stock: 8,
    reserved: 3,
    sku: "PC-HAR-0007",
    image: hairoil,
    badge: "Low stock",
    description:
      "Argan, jojoba and vitamin E blend used in our salon finishing ritual. Weightless on braids and natural coils.",
    details: ["59 ml dropper", "Argan + jojoba", "Heat protective", "Salon favourite"],
  },
  {
    id: "P-1007",
    slug: "pro-beauty-tool-set",
    name: "Pro Beauty Tool Set",
    tagline: "Ultra-Soft Bristles · Seamless Blending",
    category: "Tools",
    price: 38000,
    compareAt: 48000,
    rating: 4.9,
    reviews: 76,
    stock: 22,
    reserved: 2,
    sku: "PC-TLS-0014",
    image: beautyTools,
    badge: "Essentials",
    description:
      "Set of luxury rose gold cosmetic brushes crafted for flawless powder, cream, and liquid makeup application.",
    details: ["10-piece brush kit", "Cruelty-free vegan bristles", "Ergonomic handles", "Travel pouch included"],
  },
  {
    id: "P-1005",
    slug: "zanzibar-amber-eau-de-parfum",
    name: "Zanzibar Amber Eau de Parfum",
    tagline: "Warm Amber · Vanilla · Spiced Clove",
    category: "Fragrance",
    price: 115000,
    compareAt: 135000,
    rating: 5.0,
    reviews: 47,
    stock: 19,
    reserved: 1,
    sku: "PC-FRG-0021",
    image: catFragrance,
    badge: "New arrival",
    description:
      "An evocative coastal fragrance marrying warm amber, sweet clove blossoms and creamy Madagascar vanilla with an enduring 12-hour silage.",
    details: ["50 ml glass flacon", "Eau de parfum concentration", "Artisanal small batch", "Cruelty free"],
  },
  {
    id: "P-1008",
    slug: "golden-shimmer-body-oil",
    name: "Golden Shimmer Body Oil",
    tagline: "Luminous Botanical Blend · 24H Glow",
    category: "Body Oils",
    price: 48000,
    compareAt: 58000,
    rating: 4.9,
    reviews: 84,
    stock: 28,
    reserved: 3,
    sku: "PC-OIL-0042",
    image: catBodyOil,
    badge: "Trending",
    description:
      "A rich, fast-absorbing botanical dry body oil infused with golden mineral micro-pearls, marula oil, and sweet almond elixir for sun-kissed radiant skin.",
    details: ["100 ml glass dropper bottle", "Pure cold-pressed marula + almond oil", "Non-greasy dry finish", "Subtle warm vanilla shimmer"],
  },
  {
    id: "P-1009",
    slug: "botanica-honey-shea-soap",
    name: "Botanica Honey & Shea Soap",
    tagline: "Raw Shea Butter · Wildflower Honey · Gentle Cleansing",
    category: "Soaps",
    price: 18000,
    compareAt: 24000,
    rating: 4.9,
    reviews: 112,
    stock: 75,
    reserved: 5,
    sku: "PC-SOP-0019",
    image: catSoap,
    badge: "Handcrafted",
    description:
      "Small-batch cold-process artisanal bath soap enriched with unrefined Tanzanian shea butter, organic honeycomb, and oat milk to deeply cleanse while restoring moisture.",
    details: ["150 g generous bar", "Cold-processed raw shea & honey", "Sulfate & paraben free", "Ultra-nourishing creamy lather"],
  },
];

const countFor = (name: string) =>
  products.filter((p) => {
    const c = p.category.toLowerCase();
    const target = name.toLowerCase();
    return c === target || c.includes(target) || target.includes(c);
  }).length;

export type CategoryItem = {
  name: string;
  title: string;
  count: number;
  image: string;
  description: string;
  tint: string;
};

export const categories: CategoryItem[] = [
  {
    name: "Skincare",
    title: "Skincare",
    count: countFor("Skincare"),
    image: catSkincare,
    description: "Hydrating serums, replenishing creams & barrier protection",
    tint: "from-[#172459]/90 via-[#243B90]/70 to-transparent",
  },
  {
    name: "Makeup",
    title: "Makeup",
    count: countFor("Makeup"),
    image: catMakeup,
    description: "Velvety matte pigments, lipsticks & flawless finishes",
    tint: "from-[#243B90]/90 via-[#EC008C]/60 to-transparent",
  },
  {
    name: "Hair",
    title: "Hair Care",
    count: countFor("Hair"),
    image: catHair,
    description: "Nourishing argan oils, edge control & salon treatments",
    tint: "from-[#172459]/90 via-[#C6A56B]/60 to-transparent",
  },
  {
    name: "Fragrance",
    title: "Fragrances",
    count: countFor("Fragrance"),
    image: catFragrance,
    description: "Artisanal coastal perfumes & sensual amber elixirs",
    tint: "from-[#EC008C]/90 via-[#C6A56B]/60 to-transparent",
  },
  {
    name: "Body Oils",
    title: "Body Oils",
    count: countFor("Body Oils"),
    image: catBodyOil,
    description: "Luminous botanical oils, golden shimmer & restorative body elixirs",
    tint: "from-[#172459]/90 via-[#C6A56B]/70 to-transparent",
  },
  {
    name: "Soaps",
    title: "Soaps",
    count: countFor("Soaps"),
    image: catSoap,
    description: "Handcrafted moisturizing bars, African black soap & rich herbal lathers",
    tint: "from-[#243B90]/90 via-[#EC008C]/50 to-transparent",
  },
];

export const salonServices = [
  { id: "S-1", name: "Signature Braiding", duration: "3 h 30 min", price: 85000 },
  { id: "S-2", name: "Silk Press & Style", duration: "1 h 30 min", price: 45000 },
  { id: "S-3", name: "Deep Conditioning Ritual", duration: "50 min", price: 30000 },
  { id: "S-4", name: "Bridal Hair & Makeup", duration: "4 h", price: 250000 },
  { id: "S-5", name: "Colour & Gloss", duration: "2 h", price: 120000 },
];

export const stylists = [
  { id: "ST-1", name: "Amina Mushi", skills: "Braiding · Colour", rating: 4.9 },
  { id: "ST-2", name: "Grace Kilonzo", skills: "Silk press · Bridal", rating: 4.8 },
  { id: "ST-3", name: "Neema Joseph", skills: "Natural hair · Treatments", rating: 4.9 },
];

export const timeSlots = ["09:00", "10:30", "12:00", "13:30", "15:00", "16:30", "18:00"];

export const deliverySteps = [
  { label: "Order confirmed", at: "Tue 09:12" },
  { label: "Payment confirmed", at: "Tue 09:14" },
  { label: "Preparing order", at: "Tue 10:02" },
  { label: "Ready for dispatch", at: "Tue 11:40" },
  { label: "Out for delivery", at: "Tue 13:05" },
  { label: "Delivered", at: "Expected today 16:30" },
];

export const erpKpis = [
  { label: "Revenue today", value: "TSh 4.82 M", delta: "+12.4%", up: true },
  { label: "Orders today", value: "86", delta: "+8 vs yesterday", up: true },
  { label: "Gross profit", value: "TSh 1.94 M", delta: "40.2% margin", up: true },
  { label: "Average order value", value: "TSh 56,000", delta: "-2.1%", up: false },
  { label: "Salon bookings", value: "23", delta: "4 walk-ins", up: true },
  { label: "Low-stock items", value: "11", delta: "3 critical", up: false },
];

export const revenueSeries = [
  { day: "Mon", value: 3.2 },
  { day: "Tue", value: 4.1 },
  { day: "Wed", value: 3.7 },
  { day: "Thu", value: 5.2 },
  { day: "Fri", value: 6.4 },
  { day: "Sat", value: 7.1 },
  { day: "Sun", value: 4.8 },
];

export type OrderStatus = "Paid" | "Preparing" | "Dispatched" | "Delivered" | "Refunded";

export const erpOrders: {
  id: string;
  customer: string;
  channel: "Online" | "POS" | "WhatsApp";
  items: number;
  total: number;
  status: OrderStatus;
  placed: string;
}[] = [
  { id: "PC-24871", customer: "Zawadi Mremi", channel: "Online", items: 3, total: 142500, status: "Preparing", placed: "Today 09:12" },
  { id: "PC-24870", customer: "Walk-in customer", channel: "POS", items: 1, total: 24500, status: "Paid", placed: "Today 08:54" },
  { id: "PC-24869", customer: "Fatma Suleiman", channel: "Online", items: 5, total: 318000, status: "Dispatched", placed: "Today 08:20" },
  { id: "PC-24868", customer: "Joyce Mwakalindile", channel: "WhatsApp", items: 2, total: 91000, status: "Delivered", placed: "Yesterday" },
  { id: "PC-24867", customer: "Hellen Nyerere", channel: "Online", items: 1, total: 68000, status: "Refunded", placed: "Yesterday" },
  { id: "PC-24866", customer: "Sara Kimaro", channel: "POS", items: 4, total: 176500, status: "Delivered", placed: "Yesterday" },
];

export const inventoryLedger = [
  { at: "Today 10:02", sku: "PC-HAR-0007", item: "Luxe Hair Oil", type: "Sale (Online)", qty: -2, balance: 8 },
  { at: "Today 09:30", sku: "PC-MKP-0112", item: "Matte Liquid Lipstick", type: "Goods receipt", qty: +60, balance: 120 },
  { at: "Today 08:54", sku: "PC-SKN-0031", item: "Radiant Renewal Serum", type: "Sale (POS)", qty: -1, balance: 42 },
  { at: "Yesterday", sku: "PC-SKN-0058", item: "Radiant Skin Cream", type: "Transfer → Salon", qty: -6, balance: 64 },
  { at: "Yesterday", sku: "PC-HAR-0007", item: "Luxe Hair Oil", type: "Stock count adjustment", qty: -1, balance: 10 },
];

export const erpAppointments = [
  { time: "09:00", client: "Neema Paul", service: "Silk Press & Style", stylist: "Grace Kilonzo", status: "Completed" },
  { time: "10:30", client: "Asha Mohammed", service: "Signature Braiding", stylist: "Amina Mushi", status: "In chair" },
  { time: "13:30", client: "Walk-in", service: "Deep Conditioning", stylist: "Neema Joseph", status: "Waiting" },
  { time: "15:00", client: "Lucy Mbwana", service: "Colour & Gloss", stylist: "Amina Mushi", status: "Confirmed" },
  { time: "16:30", client: "Rehema Said", service: "Bridal Hair & Makeup", stylist: "Grace Kilonzo", status: "Deposit due" },
];

export const auditLog = [
  { actor: "amina@philipo.co.tz", action: "orders.edit", entity: "PC-24869", detail: "Status Preparing → Dispatched", at: "09:41" },
  { actor: "philipo@philipo.co.tz", action: "finance.refund", entity: "PC-24867", detail: "Refund TSh 68,000 — damaged on arrival", at: "08:58" },
  { actor: "grace@philipo.co.tz", action: "products.edit", entity: "PC-HAR-0007", detail: "Price 45,000 → 39,000", at: "Yesterday" },
];
