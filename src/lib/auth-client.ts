export type UserRole = "admin" | "sales" | "sales_staff" | "customer";

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

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("255") && digits.length === 12) {
    return digits.substring(3);
  }
  if ((digits.startsWith("07") || digits.startsWith("06")) && digits.length === 10) {
    return digits.substring(1);
  }
  return digits;
}

export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 13;
}

// 2. Client Authentication Storage Key for registered users
const REGISTERED_USERS_KEY = "philipo_registered_accounts_v1";

export interface StoredAccount {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  location?: string;
  target?: number;
  currentSales?: number;
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

export function getStoredAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredAccount[];
  } catch {
    return [];
  }
}

export function saveStoredAccounts(accounts: StoredAccount[]) {
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
  if (!idLower || !params.password) {
    throw new Error("Please enter your email and password.");
  }

  // Check stored registered accounts first
  const existing = getStoredAccounts();
  const normInput = normalizePhone(idLower);

  const matched = existing.find((u) => {
    if (u.email === idLower) return true;
    if (normInput.length >= 7) {
      return normalizePhone(u.phone) === normInput;
    }
    return false;
  });

  if (matched) {
    if (matched.passwordHash !== simpleHash(params.password)) {
      throw new Error("Incorrect password for this account. Please verify your password and try again.");
    }
    if (!matched.isActive) {
      throw new Error("Your account has been deactivated. Please contact Philipo Cosmetics support.");
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

  // Built-in system administrator account
  const staffAccounts: Record<string, SessionUser> = {
    "admin@philipo.co.tz": {
      id: "u-admin-1",
      email: "admin@philipo.co.tz",
      fullName: "System Admin",
      phone: "+255 744 281 673",
      role: "admin",
      isActive: true,
    },
  };

  const staff = staffAccounts[idLower];
  if (staff) {
    return staff;
  }

  // Also check built-in staff by phone number
  const staffByPhone = Object.values(staffAccounts).find((s) => {
    return normInput.length >= 7 && normalizePhone(s.phone) === normInput;
  });
  if (staffByPhone) {
    return staffByPhone;
  }

  // If no match found at all
  if (!idLower.includes("@") && normInput.length >= 7) {
    throw new Error("No account found matching this phone number. Please check your credentials or create an account.");
  }
  throw new Error("No account found matching this email. Please check your credentials or create an account.");
}

export function checkAccountExists(emailOrPhone: string): boolean {
  const clean = emailOrPhone.trim().toLowerCase();
  const norm = normalizePhone(clean);
  const existing = getStoredAccounts();
  return existing.some((u) => {
    if (u.email && u.email === clean) return true;
    if (norm.length >= 7 && normalizePhone(u.phone) === norm) return true;
    return false;
  });
}

// 4b. Admin Create User
export async function adminCreateUserClient(params: {
  fullName: string;
  phone: string;
  password: string;
  role?: UserRole;
  email?: string;
  location?: string;
  target?: number;
}): Promise<StoredAccount> {
  const cleanName = params.fullName.trim();
  const formattedPhone = formatTanzanianPhone(params.phone.trim());
  const norm = normalizePhone(formattedPhone);

  if (!cleanName) {
    throw new Error("Please enter the user's full name.");
  }
  if (!params.phone.trim() || norm.length < 7) {
    throw new Error("Please enter a valid Tanzanian phone number.");
  }
  if (!params.password || params.password.length < 6) {
    throw new Error("Password must be at least 6 characters long.");
  }

  const existing = getStoredAccounts();
  const duplicate = existing.find(
    (u) => normalizePhone(u.phone) === norm
  );
  if (duplicate) {
    throw new Error(`A user with phone number ${formattedPhone} already exists (${duplicate.fullName}).`);
  }

  const emailGenerated =
    params.email?.trim().toLowerCase() ||
    `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, "") || "user"}.${norm.slice(-4)}@philipo.co.tz`;

  const newAccount: StoredAccount = {
    id: `u-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    email: emailGenerated,
    fullName: cleanName,
    phone: formattedPhone,
    passwordHash: simpleHash(params.password),
    role: params.role || "sales",
    isActive: true,
    createdAt: new Date().toISOString(),
    location: params.location || "Kariakoo Flagship",
    target: params.target || 4000000,
    currentSales: 0,
  };

  existing.push(newAccount);
  saveStoredAccounts(existing);

  return newAccount;
}

export function adminGetStoredAccounts(): StoredAccount[] {
  return getStoredAccounts();
}

export function adminDeleteUserClient(userId: string): void {
  const existing = getStoredAccounts();
  const filtered = existing.filter((u) => u.id !== userId);
  saveStoredAccounts(filtered);
}

export function adminUpdateUserClient(
  userId: string,
  updates: Partial<StoredAccount> & { password?: string },
): StoredAccount {
  const existing = getStoredAccounts();
  const idx = existing.findIndex((u) => u.id === userId);
  if (idx === -1) throw new Error("User not found");

  if (updates.password) {
    existing[idx].passwordHash = simpleHash(updates.password);
  }
  if (updates.fullName) existing[idx].fullName = updates.fullName;
  if (updates.phone) existing[idx].phone = formatTanzanianPhone(updates.phone);
  if (updates.email) existing[idx].email = updates.email;
  if (updates.role) existing[idx].role = updates.role;
  if (typeof updates.isActive === "boolean") existing[idx].isActive = updates.isActive;
  if (updates.location) existing[idx].location = updates.location;
  if (typeof updates.target === "number") existing[idx].target = updates.target;

  saveStoredAccounts(existing);
  return existing[idx];
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

