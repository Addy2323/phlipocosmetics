import { db, schema } from "./db";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

export type UserRole = "admin" | "sales" | "sales_staff" | "customer";

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
}

// 1. Password Hashing & Verification
const SALT = "philipo_cosmetics_secure_salt_2026";

export function hashPassword(password: string): string {
  return crypto.pbkdf2Sync(password, SALT, 10000, 64, "sha512").toString("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  const inputHash = hashPassword(password);
  return crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(hash));
}

// 2. Tanzanian Phone Number Formatting & Validation
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
  return phone; // Return original if custom format
}

export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 13;
}

// 3. User Sign-up
export async function signUpUser(params: {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role?: UserRole;
}) {
  const emailLower = params.email.trim().toLowerCase();
  if (!emailLower || !params.password || params.password.length < 6) {
    throw new Error("Password must be at least 6 characters long.");
  }
  if (!isValidPhone(params.phone)) {
    throw new Error("Please enter a valid phone number.");
  }

  // Check if user exists
  const existing = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, emailLower));

  if (existing.length > 0) {
    throw new Error("An account with this email address already exists.");
  }

  const userId = `u-${crypto.randomUUID()}`;
  const formattedPhone = formatTanzanianPhone(params.phone);
  const passwordHash = hashPassword(params.password);
  const role: UserRole = params.role ?? "customer";

  const [newUser] = await db
    .insert(schema.users)
    .values({
      id: userId,
      email: emailLower,
      passwordHash,
      fullName: params.fullName.trim(),
      phone: formattedPhone,
      role,
      isActive: true,
    })
    .returning();

  // Audit log
  await db.insert(schema.auditLogs).values({
    id: `log-${crypto.randomUUID()}`,
    actor: emailLower,
    action: "auth.signup",
    entity: "users",
    detail: `Created new user account with role: ${role}`,
  });

  if (!newUser) throw new Error("User creation failed.");
  return sanitizeUser(newUser);
}

// 4. User Sign-in
export async function signInUser(params: { email: string; password: string }) {
  const emailLower = params.email.trim().toLowerCase();
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, emailLower));

  if (!user) {
    throw new Error("Invalid email address or password.");
  }
  if (!user.isActive) {
    throw new Error("Your account has been suspended. Please contact customer support.");
  }

  const matches = verifyPassword(params.password, user.passwordHash);
  if (!matches) {
    throw new Error("Invalid email address or password.");
  }

  // Audit log
  await db.insert(schema.auditLogs).values({
    id: `log-${crypto.randomUUID()}`,
    actor: user.email,
    action: "auth.signin",
    entity: "users",
    detail: "User signed in successfully",
  });

  return sanitizeUser(user);
}

// 5. Password Reset Request & Execution
export async function requestPasswordReset(email: string) {
  const emailLower = email.trim().toLowerCase();
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, emailLower));

  if (!user) {
    // Return subtle success to prevent user enumeration
    return { success: true, message: "If an account exists, reset instructions have been created." };
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration

  await db.insert(schema.passwordResetTokens).values({
    id: `prt-${crypto.randomUUID()}`,
    userId: user.id,
    tokenHash,
    expiresAt,
    used: false,
  });

  await db.insert(schema.auditLogs).values({
    id: `log-${crypto.randomUUID()}`,
    actor: user.email,
    action: "auth.password_reset_request",
    entity: "users",
    detail: "Password reset token generated",
  });

  return {
    success: true,
    resetToken, // Returned for verification/email link creation
    message: "Password reset token generated successfully.",
  };
}

export async function resetPasswordWithToken(resetToken: string, newPassword: string) {
  if (!newPassword || newPassword.length < 6) {
    throw new Error("New password must be at least 6 characters long.");
  }

  const tokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
  const [tokenRecord] = await db
    .select()
    .from(schema.passwordResetTokens)
    .where(eq(schema.passwordResetTokens.tokenHash, tokenHash));

  if (!tokenRecord || tokenRecord.used || new Date() > tokenRecord.expiresAt) {
    throw new Error("Invalid or expired password reset token.");
  }

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, tokenRecord.userId));

  if (!user) {
    throw new Error("Associated user account not found.");
  }

  const newHash = hashPassword(newPassword);

  // Update user password and mark token used
  await db
    .update(schema.users)
    .set({ passwordHash: newHash, updatedAt: new Date() })
    .where(eq(schema.users.id, user.id));

  await db
    .update(schema.passwordResetTokens)
    .set({ used: true })
    .where(eq(schema.passwordResetTokens.id, tokenRecord.id));

  await db.insert(schema.auditLogs).values({
    id: `log-${crypto.randomUUID()}`,
    actor: user.email,
    action: "auth.password_reset_complete",
    entity: "users",
    detail: "Password reset completed successfully",
  });

  return { success: true };
}

// 6. Profile & Role Management
export async function updateUserProfile(userId: string, data: { fullName?: string; phone?: string }) {
  const updatePayload: Partial<typeof schema.users.$inferInsert> = { updatedAt: new Date() };
  if (data.fullName) updatePayload.fullName = data.fullName.trim();
  if (data.phone) updatePayload.phone = formatTanzanianPhone(data.phone);

  const [updated] = await db
    .update(schema.users)
    .set(updatePayload)
    .where(eq(schema.users.id, userId))
    .returning();

  if (!updated) throw new Error("User update failed.");
  return sanitizeUser(updated);
}

export async function updateUserRole(actorUser: SessionUser, targetUserId: string, newRole: UserRole) {
  // Only Admin can assign roles!
  assertRole(actorUser, ["admin"]);

  const [targetUser] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, targetUserId));

  if (!targetUser) throw new Error("Target user account not found.");

  const [updated] = await db
    .update(schema.users)
    .set({ role: newRole, updatedAt: new Date() })
    .where(eq(schema.users.id, targetUserId))
    .returning();

  if (!updated) throw new Error("Role update failed.");

  await db.insert(schema.auditLogs).values({
    id: `log-${crypto.randomUUID()}`,
    actor: actorUser.email,
    action: "rbac.role_update",
    entity: "users",
    detail: `Changed user ${targetUser.email} role from ${targetUser.role} to ${newRole}`,
  });

  return sanitizeUser(updated);
}


// 7. Role-Based Access Control Assertions
export function hasRole(user: SessionUser | null | undefined, allowedRoles: UserRole[]): boolean {
  if (!user || !user.isActive) return false;
  return allowedRoles.includes(user.role);
}

export function assertRole(user: SessionUser | null | undefined, allowedRoles: UserRole[]): void {
  if (!user) {
    throw new Error("Authentication required. Please sign in to access this section.");
  }
  if (!user.isActive) {
    throw new Error("Your account is currently suspended.");
  }
  if (!allowedRoles.includes(user.role)) {
    throw new Error(`Access denied. Your role '${user.role}' is not authorized for this action.`);
  }
}

// Helper to remove password hash before sending user to client
function sanitizeUser(user: typeof schema.users.$inferSelect): SessionUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    role: user.role as UserRole,
    isActive: user.isActive,
  };
}
