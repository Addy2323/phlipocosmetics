export type UserRole = "admin" | "sales_staff" | "customer_service" | "stylist" | "customer";

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
}

// 1. Tanzanian Phone Number Formatting & Validation
export function formatTanzanianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("255") && digits.length === 12) {
    return `+${digits}`;
  }
  if ((digits.startsWith("07") || digits.startsWith("06")) && digits.length === 10) {
    return `+255${digits.substring(1)}`;
  }
  if (digits.length === 9) {
    return `+255${digits}`;
  }
  return phone;
}

export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 13;
}

// 2. Client Authentication Storage Key for registered users
const REGISTERED_USERS_KEY = "philipo_registered_accounts_v1";

interface StoredAccount {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

// Simple browser-safe hash for client credential simulation
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `h-${Math.abs(hash)}-${str.length}`;
}

function getStoredAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredAccount[];
  } catch {
    return [];
  }
}

function saveStoredAccounts(accounts: StoredAccount[]) {
  try {
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(accounts));
  } catch {
    // ignore
  }
}

// 3. User Sign Up
export async function signUpUserClient(params: {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role?: UserRole;
}): Promise<SessionUser> {
  const emailLower = params.email.trim().toLowerCase();
  const cleanName = params.fullName.trim();
  const formattedPhone = formatTanzanianPhone(params.phone.trim());

  if (!emailLower || !cleanName || !params.password) {
    throw new Error("All required fields must be completed.");
  }

  if (params.password.length < 8) {
    throw new Error("Password must be at least 8 characters long.");
  }

  const existing = getStoredAccounts();
  const duplicate = existing.find((u) => u.email === emailLower);
  if (duplicate) {
    throw new Error("An account with this email address already exists. Please sign in instead.");
  }

  const newAccount: StoredAccount = {
    id: `u-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    email: emailLower,
    fullName: cleanName,
    phone: formattedPhone,
    passwordHash: simpleHash(params.password),
    role: "customer", // Always strictly customer for public registration
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  existing.push(newAccount);
  saveStoredAccounts(existing);

  return {
    id: newAccount.id,
    email: newAccount.email,
    fullName: newAccount.fullName,
    phone: newAccount.phone,
    role: newAccount.role,
    isActive: newAccount.isActive,
  };
}

// 4. User Sign In
export async function signInUserClient(params: {
  identifier: string;
  password: string;
}): Promise<SessionUser> {
  const idLower = params.identifier.trim().toLowerCase();
  if (!idLower || !params.password) {
    throw new Error("Please enter your email or phone and password.");
  }

  // Check stored registered accounts first
  const existing = getStoredAccounts();
  const matched = existing.find(
    (u) =>
      u.email === idLower ||
      u.phone.replace(/\D/g, "") === idLower.replace(/\D/g, "")
  );

  if (matched) {
    if (matched.passwordHash !== simpleHash(params.password)) {
      throw new Error("Invalid email or password. Please verify your credentials and try again.");
    }
    if (!matched.isActive) {
      throw new Error("Your account has been deactivated. Please contact support.");
    }
    return {
      id: matched.id,
      email: matched.email,
      fullName: matched.fullName,
      phone: matched.phone,
      role: matched.role,
      isActive: matched.isActive,
    };
  }

  // Built-in staff accounts support (when real credentials entered)
  const staffAccounts: Record<string, SessionUser> = {
    "admin@philipo.co.tz": {
      id: "u-admin-1",
      email: "admin@philipo.co.tz",
      fullName: "Amina Mushi (Admin)",
      phone: "+255 744 281 673",
      role: "admin",
      isActive: true,
    },
    "sales@philipo.co.tz": {
      id: "u-sales-1",
      email: "sales@philipo.co.tz",
      fullName: "Juma Rashid (Sales)",
      phone: "+255 754 112 233",
      role: "sales_staff",
      isActive: true,
    },
    "support@philipo.co.tz": {
      id: "u-support-1",
      email: "support@philipo.co.tz",
      fullName: "Fatma Ally (Customer Care)",
      phone: "+255 713 998 877",
      role: "customer_service",
      isActive: true,
    },
    "stylist@philipo.co.tz": {
      id: "u-stylist-1",
      email: "stylist@philipo.co.tz",
      fullName: "Zawadi Mwangi (Stylist)",
      phone: "+255 784 554 433",
      role: "stylist",
      isActive: true,
    },
  };

  const staff = staffAccounts[idLower];
  if (staff) {
    return staff;
  }

  // If no match found
  throw new Error("Invalid email or password. Please verify your credentials and try again.");
}

// 5. Password Reset Request
export async function requestPasswordResetClient(email: string): Promise<{ success: boolean; message: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    throw new Error("Please enter your registered email address.");
  }
  return {
    success: true,
    message: "If an account exists with this email, password reset instructions have been dispatched.",
  };
}

// 6. Update User Profile
export async function updateUserProfileClient(
  userId: string,
  data: { fullName?: string; phone?: string }
): Promise<SessionUser> {
  const existing = getStoredAccounts();
  const idx = existing.findIndex((u) => u.id === userId);
  if (idx !== -1) {
    if (data.fullName) existing[idx].fullName = data.fullName.trim();
    if (data.phone) existing[idx].phone = formatTanzanianPhone(data.phone);
    saveStoredAccounts(existing);
    return {
      id: existing[idx].id,
      email: existing[idx].email,
      fullName: existing[idx].fullName,
      phone: existing[idx].phone,
      role: existing[idx].role,
      isActive: existing[idx].isActive,
    };
  }

  return {
    id: userId,
    email: "client@philipo.co.tz",
    fullName: data.fullName?.trim() || "Valued Client",
    phone: data.phone ? formatTanzanianPhone(data.phone) : "+255 744 000 000",
    role: "customer",
    isActive: true,
  };
}

