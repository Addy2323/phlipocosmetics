import catStyling from "@/assets/salon/cat-styling.jpg";
import catStraightening from "@/assets/salon/cat-straightening.jpg";
import catBraiding from "@/assets/salon/cat-braiding.jpg";
import catDesign from "@/assets/salon/cat-design.jpg";
import catTreatment from "@/assets/salon/cat-treatment.jpg";
import catWashBlow from "@/assets/salon/cat-washblow.jpg";
import catMakeup from "@/assets/salon/cat-makeup.jpg";
import srvKnotless from "@/assets/salon/srv-knotless.jpg";
import srvCornrows from "@/assets/salon/srv-cornrows.jpg";
import srvWig from "@/assets/salon/srv-wig.jpg";
import { supabase } from "@/integrations/supabase/client";

export interface SalonCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  startingPrice: number;
  image: string;
  order: number;
  isActive: boolean;
}

export interface SalonService {
  id: string;
  categoryId: string;
  name: string;
  duration: string;
  durationMinutes: number;
  price: number;
  description: string;
  image: string;
  requirements?: string;
  isActive: boolean;
}

export interface SalonStylist {
  id: string;
  name: string;
  phone: string;
  skills: string;
  specialty?: string;
  rating: number;
  isActive: boolean;
}

export interface SalonAppointmentRecord {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  categoryId: string;
  categoryName: string;
  serviceId: string;
  serviceName: string;
  stylistId: string;
  stylistName: string;
  appointmentDate: string; // YYYY-MM-DD
  timeSlot: string; // 14:00
  endTime: string; // 16:00
  duration: string; // 2 hours
  status: "PENDING_PAYMENT" | "CONFIRMED" | "IN_CHAIR" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  paymentStatus: "PENDING" | "PROCESSING" | "SUCCESSFUL" | "FAILED" | "REFUNDED";
  paymentMethod: string;
  paymentReference: string;
  amountPaid: number;
  notes?: string;
  price: number;
  createdAt: string;
}

// 7 Approved categories from Screenshot 1
export const SALON_CATEGORIES: SalonCategory[] = [
  {
    id: "CAT-1",
    name: "Hair Styling",
    slug: "hair-styling",
    description: "Braids, cornrows, wigs, and modern styles.",
    startingPrice: 30000,
    image: catStyling,
    order: 1,
    isActive: true,
  },
  {
    id: "CAT-2",
    name: "Hair Straightening",
    slug: "hair-straightening",
    description: "Smooth and sleek hair solutions.",
    startingPrice: 50000,
    image: catStraightening,
    order: 2,
    isActive: true,
  },
  {
    id: "CAT-3",
    name: "Hair Braiding",
    slug: "hair-braiding",
    description: "Traditional and modern braids.",
    startingPrice: 25000,
    image: catBraiding,
    order: 3,
    isActive: true,
  },
  {
    id: "CAT-4",
    name: "Hair Design",
    slug: "hair-design",
    description: "Custom styles for every occasion.",
    startingPrice: 40000,
    image: catDesign,
    order: 4,
    isActive: true,
  },
  {
    id: "CAT-5",
    name: "Hair Treatment",
    slug: "hair-treatment",
    description: "Nourish, repair and restore.",
    startingPrice: 35000,
    image: catTreatment,
    order: 5,
    isActive: true,
  },
  {
    id: "CAT-6",
    name: "Washing & Blow-Dry",
    slug: "washing-blow-dry",
    description: "Clean, fresh and styled.",
    startingPrice: 20000,
    image: catWashBlow,
    order: 6,
    isActive: true,
  },
  {
    id: "CAT-7",
    name: "Makeup",
    slug: "makeup",
    description: "Look your best for any event.",
    startingPrice: 30000,
    image: catMakeup,
    order: 7,
    isActive: true,
  },
];

// Available Services matching Screenshot 2 & catalog
export const SALON_SERVICES: SalonService[] = [
  // Hair Styling (CAT-1) — Exactly as in Screenshot 2
  {
    id: "SRV-KNOTLESS",
    categoryId: "CAT-1",
    name: "Knotless Braids",
    duration: "2 hours",
    durationMinutes: 120,
    price: 35000,
    description: "Lightweight, natural look.",
    image: srvKnotless,
    requirements: "Clean hair recommended; scalp detox provided.",
    isActive: true,
  },
  {
    id: "SRV-CORNROWS",
    categoryId: "CAT-1",
    name: "Cornrows",
    duration: "1 hour",
    durationMinutes: 60,
    price: 25000,
    description: "Classic and stylish.",
    image: srvCornrows,
    requirements: "Can be styled with natural hair or extensions.",
    isActive: true,
  },
  {
    id: "SRV-WIGINSTALL",
    categoryId: "CAT-1",
    name: "Wig Installation",
    duration: "2 hours",
    durationMinutes: 120,
    price: 50000,
    description: "Professional and secure.",
    image: srvWig,
    requirements: "Bring wig 24 hours prior for custom hairline plucking.",
    isActive: true,
  },

  // Hair Straightening (CAT-2)
  {
    id: "SRV-SILKPRESS",
    categoryId: "CAT-2",
    name: "Silk Press & Flat Iron",
    duration: "1 h 30 min",
    durationMinutes: 90,
    price: 50000,
    description: "Thermal straightening with botanical heat shield.",
    image: catStraightening,
    isActive: true,
  },
  {
    id: "SRV-KERATIN",
    categoryId: "CAT-2",
    name: "Keratin Gloss Therapy",
    duration: "2 h 30 min",
    durationMinutes: 150,
    price: 120000,
    description: "Frizz-free smoothness lasting up to 12 weeks.",
    image: catStraightening,
    isActive: true,
  },

  // Hair Braiding (CAT-3)
  {
    id: "SRV-BOXBRAIDS",
    categoryId: "CAT-3",
    name: "Classic Box Braids",
    duration: "2 h 30 min",
    durationMinutes: 150,
    price: 35000,
    description: "Precision parted traditional box braids with silky ends.",
    image: catBraiding,
    isActive: true,
  },
  {
    id: "SRV-TRIBALBRAIDS",
    categoryId: "CAT-3",
    name: "Tribal Fulani Braids",
    duration: "3 hours",
    durationMinutes: 180,
    price: 45000,
    description: "Artistic center-part braids with optional cowrie bead accents.",
    image: catBraiding,
    isActive: true,
  },

  // Hair Design (CAT-4)
  {
    id: "SRV-SCULPTEDUPDO",
    categoryId: "CAT-4",
    name: "Sculpted Updo",
    duration: "1 h 30 min",
    durationMinutes: 90,
    price: 40000,
    description: "Elegantly pinned gala or event architectural style.",
    image: catDesign,
    isActive: true,
  },
  {
    id: "SRV-BRIDALHAIR",
    categoryId: "CAT-4",
    name: "Bridal Hair Architecture",
    duration: "3 hours",
    durationMinutes: 180,
    price: 150000,
    description: "Exclusive bridal crown styling and veil placement.",
    image: catDesign,
    isActive: true,
  },

  // Hair Treatment (CAT-5)
  {
    id: "SRV-DEEPSTEAM",
    categoryId: "CAT-5",
    name: "Deep Conditioning & Steam",
    duration: "50 min",
    durationMinutes: 50,
    price: 35000,
    description: "Nourish, repair and restore moisture balance.",
    image: catTreatment,
    isActive: true,
  },
  {
    id: "SRV-PROTEINTHERAPY",
    categoryId: "CAT-5",
    name: "Protein Barrier Therapy",
    duration: "1 h 15 min",
    durationMinutes: 75,
    price: 45000,
    description: "Strengthening treatment for dry or colour-treated coils.",
    image: catTreatment,
    isActive: true,
  },

  // Washing & Blow-Dry (CAT-6)
  {
    id: "SRV-WASHBLOW",
    categoryId: "CAT-6",
    name: "Hydrating Wash & Blow-Dry",
    duration: "45 min",
    durationMinutes: 45,
    price: 20000,
    description: "Clean, fresh and styled blow-out.",
    image: catWashBlow,
    isActive: true,
  },
  {
    id: "SRV-WASHTRIM",
    categoryId: "CAT-6",
    name: "Wash, Trim & Deluxe Blowout",
    duration: "1 hour",
    durationMinutes: 60,
    price: 30000,
    description: "Purifying wash, precision split-end dusting, and bounce.",
    image: catWashBlow,
    isActive: true,
  },

  // Makeup (CAT-7)
  {
    id: "SRV-SOFTGLAM",
    categoryId: "CAT-7",
    name: "Full Soft Glam Makeup",
    duration: "1 h 15 min",
    durationMinutes: 75,
    price: 30000,
    description: "Look your best for any event with velvety skin finish.",
    image: catMakeup,
    isActive: true,
  },
  {
    id: "SRV-BRIDALGLAM",
    categoryId: "CAT-7",
    name: "Luxury Bridal Glam",
    duration: "2 hours",
    durationMinutes: 120,
    price: 95000,
    description: "High-definition longwear bridal makeup with lashes.",
    image: catMakeup,
    isActive: true,
  },
];

// Active Stylists (Featuring Jane M. from Screenshot 4)
export const SALON_STYLISTS: SalonStylist[] = [
  {
    id: "ST-1",
    name: "Jane M.",
    phone: "+255 712 345 678",
    skills: "Braiding · Wigs · Modern Styling",
    rating: 4.95,
    isActive: true,
  },
  {
    id: "ST-2",
    name: "Amina Mushi",
    phone: "+255 744 281 673",
    skills: "Knotless Braids · Colour Specialist",
    rating: 4.9,
    isActive: true,
  },
  {
    id: "ST-3",
    name: "Grace Kilonzo",
    phone: "+255 744 281 676",
    skills: "Silk Press · Bridal Glam",
    rating: 4.85,
    isActive: true,
  },
  {
    id: "ST-4",
    name: "Neema Joseph",
    phone: "+255 744 281 677",
    skills: "Natural Hair Care · Scalp Steam",
    rating: 4.9,
    isActive: true,
  },
];

// Standard slots matching Screenshot 3
export const SALON_TIME_SLOTS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
];

// Pre-seeded occupied slots for realistic simulation matching Screenshot 3 (17:00 & 18:00 booked)
const DEFAULT_OCCUPIED_SLOTS: Record<string, string[]> = {
  // Key format: YYYY-MM-DD-stylistId
  default: ["17:00", "18:00"],
};

const STORAGE_KEY_APPOINTMENTS = "philipo_salon_appointments_v2";

export function getStoredAppointments(): SalonAppointmentRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_APPOINTMENTS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredAppointment(appt: SalonAppointmentRecord) {
  if (typeof window === "undefined") return;
  try {
    const existing = getStoredAppointments();
    const updated = [appt, ...existing.filter((a) => a.id !== appt.id)];
    localStorage.setItem(STORAGE_KEY_APPOINTMENTS, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to persist appointment locally", err);
  }
}

export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hStr, mStr] = startTime.split(":");
  const h = parseInt(hStr || "14", 10);
  const m = parseInt(mStr || "00", 10);
  const totalM = h * 60 + m + durationMinutes;
  const endH = Math.floor(totalM / 60) % 24;
  const endM = totalM % 60;
  return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
}

export function getOccupiedSlots(dateStr: string, stylistId: string): string[] {
  const key = `${dateStr}-${stylistId}`;
  const localAppts = getStoredAppointments();
  
  // Slots from local storage bookings for this date and stylist
  const localBookedSlots = localAppts
    .filter(
      (a) =>
        a.appointmentDate === dateStr &&
        a.stylistId === stylistId &&
        a.status !== "CANCELLED"
    )
    .map((a) => a.timeSlot);

  // Add default demo occupied slots (like 17:00 and 18:00 in screenshot 3)
  const baseOccupied = DEFAULT_OCCUPIED_SLOTS[key] || DEFAULT_OCCUPIED_SLOTS.default || [];
  return Array.from(new Set([...baseOccupied, ...localBookedSlots]));
}

export interface BookingSubmissionInput {
  category: SalonCategory;
  service: SalonService;
  stylist: SalonStylist;
  dateStr: string;
  timeSlot: string;
  notes?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  paymentMethod: string;
}

export async function submitSalonBooking(
  input: BookingSubmissionInput
): Promise<SalonAppointmentRecord> {
  const appointmentRef = `PC-SLN-${Math.floor(100000 + Math.random() * 900000)}`;
  const paymentRef = `MOMO-${Math.floor(100000 + Math.random() * 900000)}`;
  const endTime = calculateEndTime(input.timeSlot, input.service.durationMinutes);

  const newAppointment: SalonAppointmentRecord = {
    id: appointmentRef,
    customerName: input.customerName.trim(),
    customerPhone: input.customerPhone.trim(),
    customerEmail: input.customerEmail?.trim() || undefined,
    categoryId: input.category.id,
    categoryName: input.category.name,
    serviceId: input.service.id,
    serviceName: input.service.name,
    stylistId: input.stylist.id,
    stylistName: input.stylist.name,
    appointmentDate: input.dateStr,
    timeSlot: input.timeSlot,
    endTime,
    duration: input.service.duration,
    status: "CONFIRMED",
    paymentStatus: "SUCCESSFUL",
    paymentMethod: input.paymentMethod || "momo",
    paymentReference: paymentRef,
    amountPaid: input.service.price,
    notes: input.notes?.trim() || undefined,
    price: input.service.price,
    createdAt: new Date().toISOString(),
  };

  // 1. Persist locally for immediate availability lock & reactivity
  saveStoredAppointment(newAppointment);

  // 2. Generate official Tax Invoice
  try {
    const { createInvoiceFromSalonAppointment } = await import("./invoices-store");
    createInvoiceFromSalonAppointment(newAppointment);
  } catch (err) {
    console.warn("Could not generate salon invoice automatically:", err);
  }

  // 3. Log automated Baraka SMS confirmation
  const smsBody = `Habari ${input.customerName}, miadi yako ya ${input.service.name} na ${input.stylist.name} tarehe ${input.dateStr} saa ${input.timeSlot} imethibitishwa! Ref: #${appointmentRef}. Karibu Philipo Cosmetics Salon, Dar es Salaam.`;
  console.log(`[Baraka SMS Dispatched] To: ${input.customerPhone} | Body: ${smsBody}`);

  // 3. Sync to Supabase if available
  try {
    await (supabase as any).from("salon_appointments").insert({
      id: appointmentRef,
      customer_name: newAppointment.customerName,
      customer_phone: newAppointment.customerPhone,
      customer_email: newAppointment.customerEmail,
      category_id: newAppointment.categoryId,
      category_name: newAppointment.categoryName,
      service_id: newAppointment.serviceId,
      service_name: newAppointment.serviceName,
      stylist_id: newAppointment.stylistId,
      stylist_name: newAppointment.stylistName,
      appointment_date: newAppointment.appointmentDate,
      time_slot: newAppointment.timeSlot,
      status: "CONFIRMED",
      notes: newAppointment.notes,
      price: newAppointment.price,
    });
  } catch (err) {
    // Graceful fallback to local persistence
    console.warn("Supabase background sync fallback:", err);
  }

  return newAppointment;
}
