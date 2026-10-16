// Philipo Cosmetics — Business Partner & Reseller Store
// Complete data model, local persistence, NIDA validation, and lifecycle management

export type ResellerApplicantType = "individual" | "registered_business";

export type ResellerApplicationStatus =
  | "DRAFT"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "MORE_INFORMATION_REQUIRED"
  | "RESUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED";

export type ResellerStatus = ResellerApplicationStatus;

export type IdentityVerificationStatus =
  | "NOT_STARTED"
  | "PENDING"
  | "IN_PROGRESS"
  | "VERIFIED"
  | "FAILED"
  | "MANUAL_REVIEW_REQUIRED";

export interface ResellerDocument {
  id: string;
  type: "national_id_front" | "national_id_back" | "business_cert" | "business_license" | "tin_cert" | "premises_photo";
  name: string;
  url: string; // Base64 data URI or file reference
  uploadedAt: string;
  status: "uploaded" | "verified" | "rejected" | "action_required";
  notes?: string;
}

export interface ResellerApplication {
  id: string; // e.g. "PC-PARTNER-829104"
  userId: string;
  applicantType: ResellerApplicantType;

  // Step 1: Personal & Contact Details
  fullName: string;
  dob?: string;
  phone: string;
  altPhone?: string;
  email: string;
  region: string;
  district: string;
  ward: string;
  street: string;
  preferredContact: "phone" | "email" | "whatsapp";

  // Step 2: Business & Territory Operations
  shopName: string;
  businessRegNumber?: string;
  tin?: string;
  businessLicense?: string;
  authorizedRepPosition?: string;
  salesChannels: string[];
  estimatedMonthlySales: string;
  experienceYears?: string;
  productCategories: string[];
  territories: string[];
  deliveryPreference: string;

  // Step 3: NIDA & Supporting Documents
  nidaNumber: string;
  nidaNormalized: string; // 20 numeric digits
  nidaName: string;
  documents: ResellerDocument[];

  // Step 4: Selfie & Identity Verification
  selfieUrl?: string;
  biometricConsent: boolean;
  biometricConsentTimestamp?: string;
  verificationStatus: IdentityVerificationStatus;
  verificationMethod: "manual_review" | "nida_portal" | "assisted_biometric";
  verificationNotes?: string;

  // Step 5: Terms & Conditions
  termsAccepted: boolean;
  termsVersion: string;
  termsAcceptedAt?: string;

  // Lifecycle & Administration
  status: ResellerApplicationStatus;
  step: number; // 1 to 6
  assignedReviewer?: string;
  adminNotes?: string;
  moreInfoReason?: string;
  rejectionReason?: string;
  suspensionReason?: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  reviewedAt?: string;
  resellerDiscountRate?: number; // e.g. 25%
  partnerCode?: string; // e.g. "PHL-PARTNER-732"
}

export const TANZANIA_REGIONS = [
  "Dar es Salaam",
  "Morogoro",
  "Njombe",
  "Arusha",
  "Mwanza",
  "Dodoma",
  "Mbeya",
  "Tanga",
  "Kilimanjaro",
  "Iringa",
  "Ruvuma",
  "Tabora",
  "Kagera",
  "Kigoma",
  "Shinyanga",
  "Mtwara",
  "Manyara",
  "Geita",
  "Songwe",
  "Katavi",
  "Simiyu",
  "Mara",
  "Lindi",
  "Singida",
  "Pwani",
  "Zanzibar (Unguja)",
  "Zanzibar (Pemba)",
];

export const SALES_CHANNEL_OPTIONS = [
  "Physical Beauty / Cosmetics Store",
  "Beauty Salon / Spa Outlet",
  "Social Media (Instagram, TikTok, WhatsApp)",
  "Direct Client / Mobile Field Sales",
  "Online E-Commerce Website",
  "Pharmacy / Wellness Center",
];

export const PRODUCT_CATEGORY_OPTIONS = [
  "Luxury Skincare & Serums",
  "Hair Care & Professional Styling",
  "Color Cosmetics & Makeup",
  "Fragrances & Body Care",
  "Salon Backbar & Professional Treatments",
];

export const ESTIMATED_SALES_RANGES = [
  "TSh 1,000,000 – 3,000,000 / month",
  "TSh 3,000,000 – 7,000,000 / month",
  "TSh 7,000,000 – 15,000,000 / month",
  "TSh 15,000,000+ / month (Wholesale Hub)",
];

/**
 * Validates a Tanzanian NIDA National Identification Number (NIN).
 * Format displayed on portal: e.g. "19760517-37227-00002-17"
 * Must contain exactly 20 numeric digits when hyphens/spaces are stripped.
 */
export function validateTanzaniaNIN(nin: string): {
  isValid: boolean;
  normalized: string;
  errorMessage?: string;
} {
  if (!nin || typeof nin !== "string") {
    return { isValid: false, normalized: "", errorMessage: "NIDA NIN is required." };
  }

  // Strip hyphens, spaces, and formatting characters
  const normalized = nin.replace(/[^0-9]/g, "");

  if (/[a-zA-Z]/.test(nin)) {
    return {
      isValid: false,
      normalized,
      errorMessage: "NIDA NIN must contain numbers and hyphens only; letters are not permitted.",
    };
  }

  if (normalized.length !== 20) {
    return {
      isValid: false,
      normalized,
      errorMessage: `NIDA NIN must be exactly 20 digits (currently ${normalized.length} digits). Example: 19760517-37227-00002-17`,
    };
  }

  return { isValid: true, normalized };
}

/**
 * Formats a 20-digit raw NIN string into the standard NIDA format: YYYYMMDD-XXXXX-XXXXX-XX
 */
export function formatNINDisplay(nin: string): string {
  const digits = nin.replace(/[^0-9]/g, "");
  if (digits.length !== 20) return nin;
  return `${digits.slice(0, 8)}-${digits.slice(8, 13)}-${digits.slice(13, 18)}-${digits.slice(18, 20)}`;
}

const STORAGE_KEY = "philipo_reseller_applications_v1";

// Initial seed applications representing active regional applicants in Morogoro, Njombe, etc.
const SEED_APPLICATIONS: ResellerApplication[] = [
  {
    id: "PC-PARTNER-109482",
    userId: "usr-seed-partner-1",
    applicantType: "registered_business",
    fullName: "Rehema Mwambalaswa",
    dob: "1988-06-14",
    phone: "+255 765 890 123",
    altPhone: "+255 714 890 124",
    email: "rehema.morogoro@gmail.com",
    region: "Morogoro",
    district: "Morogoro Urban",
    ward: "Boma",
    street: "Old Dar es Salaam Road, Suite 4",
    preferredContact: "phone",
    shopName: "Rehema Glamour House",
    businessRegNumber: "BRELA-589210-MG",
    tin: "134-892-019",
    businessLicense: "MOR/BL/2025/0912",
    authorizedRepPosition: "Managing Director",
    salesChannels: ["Physical Beauty / Cosmetics Store", "Beauty Salon / Spa Outlet"],
    estimatedMonthlySales: "TSh 7,000,000 – 15,000,000 / month",
    experienceYears: "5+ Years",
    productCategories: ["Luxury Skincare & Serums", "Hair Care & Professional Styling"],
    territories: ["Morogoro Urban", "Kilosa", "Mvomero"],
    deliveryPreference: "Intercity Bus Parcel (Kariakoo to Morogoro Terminal)",
    nidaNumber: "19880614-23910-00014-29",
    nidaNormalized: "19880614239100001429",
    nidaName: "REHEMA JUMA MWAMBALASWA",
    documents: [
      {
        id: "doc-1",
        type: "national_id_front",
        name: "National_ID_Rehema_Front.jpg",
        url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
        uploadedAt: "2026-10-10T09:30:00Z",
        status: "verified",
      },
      {
        id: "doc-2",
        type: "business_cert",
        name: "BRELA_Certificate_RehemaGlamour.pdf",
        url: "#",
        uploadedAt: "2026-10-10T09:32:00Z",
        status: "verified",
      },
    ],
    selfieUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
    biometricConsent: true,
    biometricConsentTimestamp: "2026-10-10T09:35:00Z",
    verificationStatus: "VERIFIED",
    verificationMethod: "manual_review",
    verificationNotes: "NIN format and credentials match BRELA certificate.",
    termsAccepted: true,
    termsVersion: "2026.1-TZ",
    termsAcceptedAt: "2026-10-10T09:36:00Z",
    status: "APPROVED",
    step: 6,
    assignedReviewer: "Admin Compliance Office",
    adminNotes: "Approved for Morogoro zone distribution. 25% discount activated.",
    resellerDiscountRate: 25,
    partnerCode: "PHL-PARTNER-MOR-01",
    createdAt: "2026-10-10T09:20:00Z",
    updatedAt: "2026-10-11T14:15:00Z",
    submittedAt: "2026-10-10T09:36:00Z",
    reviewedAt: "2026-10-11T14:15:00Z",
  },
  {
    id: "PC-PARTNER-109483",
    userId: "usr-seed-partner-2",
    applicantType: "individual",
    fullName: "Baraka Mhagama",
    dob: "1994-11-28",
    phone: "+255 784 555 678",
    email: "baraka.njombe@yahoo.com",
    region: "Njombe",
    district: "Njombe Urban",
    ward: "Mjimwema",
    street: "Posta Road, Near Stanbic",
    preferredContact: "whatsapp",
    shopName: "Baraka Elite Cosmetics",
    salesChannels: ["Physical Beauty / Cosmetics Store", "Social Media (Instagram, TikTok, WhatsApp)"],
    estimatedMonthlySales: "TSh 3,000,000 – 7,000,000 / month",
    experienceYears: "3 Years",
    productCategories: ["Luxury Skincare & Serums", "Fragrances & Body Care"],
    territories: ["Njombe Urban", "Makambako", "Wanging'ombe"],
    deliveryPreference: "Courier to Njombe Central Depot",
    nidaNumber: "19941128-44120-00008-11",
    nidaNormalized: "19941128441200000811",
    nidaName: "BARAKA EMMANUEL MHAGAMA",
    documents: [
      {
        id: "doc-3",
        type: "national_id_front",
        name: "Baraka_NIDA_Front.jpg",
        url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80",
        uploadedAt: "2026-10-13T11:00:00Z",
        status: "uploaded",
      },
    ],
    selfieUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80",
    biometricConsent: true,
    biometricConsentTimestamp: "2026-10-13T11:05:00Z",
    verificationStatus: "PENDING",
    verificationMethod: "manual_review",
    verificationNotes: "Awaiting physical premises photo verification.",
    termsAccepted: true,
    termsVersion: "2026.1-TZ",
    termsAcceptedAt: "2026-10-13T11:08:00Z",
    status: "UNDER_REVIEW",
    step: 6,
    assignedReviewer: "Sales Director",
    createdAt: "2026-10-13T10:45:00Z",
    updatedAt: "2026-10-13T11:08:00Z",
    submittedAt: "2026-10-13T11:08:00Z",
  },
  {
    id: "PC-PARTNER-109484",
    userId: "usr-seed-partner-3",
    applicantType: "individual",
    fullName: "Amina Salum Kessy",
    dob: "1997-03-05",
    phone: "+255 754 112 233",
    email: "amina.kessy.arusha@gmail.com",
    region: "Arusha",
    district: "Arusha City",
    ward: "Sekei",
    street: "Sokoine Road",
    preferredContact: "phone",
    shopName: "Amina Beauty Lounge",
    salesChannels: ["Beauty Salon / Spa Outlet", "Social Media (Instagram, TikTok, WhatsApp)"],
    estimatedMonthlySales: "TSh 3,000,000 – 7,000,000 / month",
    experienceYears: "2 Years",
    productCategories: ["Hair Care & Professional Styling", "Color Cosmetics & Makeup"],
    territories: ["Arusha City", "Meru"],
    deliveryPreference: "Regional Express Bus",
    nidaNumber: "19970305-18230-00045-88",
    nidaNormalized: "19970305182300004588",
    nidaName: "AMINA SALUM KESSY",
    documents: [],
    biometricConsent: true,
    verificationStatus: "PENDING",
    verificationMethod: "manual_review",
    termsAccepted: true,
    termsVersion: "2026.1-TZ",
    termsAcceptedAt: "2026-10-14T15:20:00Z",
    status: "MORE_INFORMATION_REQUIRED",
    step: 6,
    moreInfoReason: "Please upload a clear photograph of your current salon premises or storefront in Arusha.",
    createdAt: "2026-10-14T15:00:00Z",
    updatedAt: "2026-10-14T16:00:00Z",
    submittedAt: "2026-10-14T15:20:00Z",
  },
];

export function getStoredResellerApplications(): ResellerApplication[] {
  if (typeof window === "undefined") return SEED_APPLICATIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_APPLICATIONS));
      return SEED_APPLICATIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_APPLICATIONS;
  } catch {
    return SEED_APPLICATIONS;
  }
}

export const getResellerApplications = getStoredResellerApplications;

export function saveResellerApplication(app: ResellerApplication): void {
  if (typeof window === "undefined") return;
  try {
    const all = getStoredResellerApplications();
    const existingIndex = all.findIndex((a) => a.id === app.id || a.userId === app.userId);
    let updated: ResellerApplication[];
    if (existingIndex >= 0) {
      updated = [...all];
      updated[existingIndex] = { ...app, updatedAt: new Date().toISOString() };
    } else {
      updated = [{ ...app, updatedAt: new Date().toISOString() }, ...all];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to save reseller application", err);
  }
}

export function getResellerApplicationByUserId(userId: string): ResellerApplication | null {
  const all = getStoredResellerApplications();
  return all.find((a) => a.userId === userId) || null;
}

export function getResellerApplicationById(id: string): ResellerApplication | null {
  const all = getStoredResellerApplications();
  return all.find((a) => a.id === id) || null;
}

export function createInitialResellerApplication(userId: string, partial: Partial<ResellerApplication>): ResellerApplication {
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const newApp: ResellerApplication = {
    id: `PC-PARTNER-${randomSuffix}`,
    userId,
    applicantType: partial.applicantType || "individual",
    fullName: partial.fullName || "",
    dob: partial.dob || "",
    phone: partial.phone || "",
    altPhone: partial.altPhone || "",
    email: partial.email || "",
    region: partial.region || "Dar es Salaam",
    district: partial.district || "",
    ward: partial.ward || "",
    street: partial.street || "",
    preferredContact: partial.preferredContact || "phone",
    shopName: partial.shopName || "",
    salesChannels: partial.salesChannels || [],
    estimatedMonthlySales: partial.estimatedMonthlySales || ESTIMATED_SALES_RANGES[0],
    experienceYears: partial.experienceYears || "",
    productCategories: partial.productCategories || [],
    territories: partial.territories || [partial.region || "Dar es Salaam"],
    deliveryPreference: partial.deliveryPreference || "Courier to Store / Home Address",
    nidaNumber: partial.nidaNumber || "",
    nidaNormalized: partial.nidaNormalized || "",
    nidaName: partial.nidaName || "",
    documents: partial.documents || [],
    biometricConsent: false,
    verificationStatus: "NOT_STARTED",
    verificationMethod: "manual_review",
    termsAccepted: false,
    termsVersion: "2026.1-TZ",
    status: "DRAFT",
    step: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...partial,
  };
  saveResellerApplication(newApp);
  return newApp;
}
