import serum from "@/assets/p-serum.jpg";
import lipstick from "@/assets/p-lipstick.jpg";
import hairoil from "@/assets/p-hairoil.jpg";
import cream from "@/assets/p-cream.jpg";

export const BRAND = {
  name: "Philipo Cosmetics",
  full: "Philipo Cosmetics & Beauty Salon",
  city: "Dar es Salaam",
  country: "Tanzania",
  phone: "+255 744 281 673",
  currency: "TSh",
};

export const money = (v: number) => `TSh ${v.toLocaleString("en-US")}`;

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
};

export const products: Product[] = [
  {
    id: "P-1001",
    slug: "radiant-renewal-serum",
    name: "Radiant Renewal Serum",
    tagline: "Brighten · Firm · Replenish",
    category: "Skincare",
    price: 68000,
    compareAt: 82000,
    rating: 4.8,
    reviews: 126,
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
    id: "P-1002",
    slug: "matte-liquid-lipstick-berry",
    name: "Matte Liquid Lipstick — Berry",
    tagline: "Long wear velvet finish",
    category: "Makeup",
    price: 24500,
    rating: 4.6,
    reviews: 318,
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
    id: "P-1004",
    slug: "radiant-skin-cream",
    name: "Radiant Skin Cream",
    tagline: "Hydrate · Replenish · Glow",
    category: "Skincare",
    price: 52000,
    rating: 4.7,
    reviews: 89,
    stock: 64,
    reserved: 2,
    sku: "PC-SKN-0058",
    image: cream,
    description:
      "A rich but breathable day cream with a soft-focus finish, layered beautifully under makeup.",
    details: ["50 ml jar", "Hyaluronic acid", "SPF free — layer with sunscreen", "Refillable"],
  },
];

export const categories = [
  { name: "Skincare", count: 48, tint: "from-[#8B123F] to-[#B51658]" },
  { name: "Makeup", count: 72, tint: "from-[#C2185B] to-[#8B123F]" },
  { name: "Hair", count: 36, tint: "from-[#260713] to-[#8B123F]" },
  { name: "Fragrance", count: 19, tint: "from-[#6D0D31] to-[#C2185B]" },
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
