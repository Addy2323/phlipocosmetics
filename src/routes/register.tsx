import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ShoppingBag,
  Calendar,
  Package,
  BarChart3,
  Store,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  signUpUserClient,
  formatTanzanianPhone,
  isValidPhone,
  checkAccountExists,
} from "@/lib/auth-client";
import { createInitialResellerApplication } from "@/lib/reseller-store";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create Your Account — Philipo Cosmetics" },
      {
        name: "description",
        content: "Join Philipo Cosmetics and start your beauty journey.",
      },
      { property: "og:title", content: "Create Your Account — Philipo Cosmetics" },
    ],
  }),
  component: RegisterPage,
});

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "size-4 shrink-0"} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export function RegisterPage() {
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();

  // Account Type Tab: "customer" or "partner"
  const [accountType, setAccountType] = useState<"customer" | "partner">("customer");

  // Inputs
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Agreement
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Status
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      if (user.role === "admin") {
        navigate({ to: "/admin/dashboard" });
      } else if (user.role === "sales" || user.role === "sales_staff") {
        navigate({ to: "/sales/dashboard" });
      } else {
        navigate({ to: "/account" });
      }
    }
  }, [loading, user, navigate]);

  function getPasswordStrength(pass: string): {
    label: "Weak" | "Fair" | "Strong";
    percent: number;
    color: string;
  } {
    if (!pass) return { label: "Weak", percent: 0, color: "bg-gray-200" };
    let score = 0;
    if (pass.length >= 8) score += 30;
    if (pass.length >= 12) score += 20;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 20;
    if (/\d/.test(pass)) score += 15;
    if (/[^a-zA-Z0-9]/.test(pass)) score += 15;

    if (score < 40) return { label: "Weak", percent: 30, color: "bg-rose-500" };
    if (score < 75) return { label: "Fair", percent: 65, color: "bg-amber-500" };
    return { label: "Strong", percent: 100, color: "bg-emerald-500" };
  }

  function validateFullName(val: string): string | null {
    const clean = val.trim();
    if (!clean) return "Please enter your full name.";
    if (clean.length < 3) return "Full name must be at least 3 characters long.";
    if (!/^[a-zA-Z\s'-]+$/.test(clean)) return "Full name should only contain letters and spaces.";
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length < 2) return "Please enter both your first and last name.";
    return null;
  }

  function validateEmail(val: string): string | null {
    const clean = val.trim();
    if (!clean) return "Please enter your email address.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clean))
      return "Please enter a valid email address (e.g. name@example.com).";
    if (checkAccountExists(clean))
      return "This email is already registered. Please sign in instead.";
    return null;
  }

  function validatePhone(val: string): string | null {
    const clean = val.trim();
    if (!clean) return "Please enter your mobile phone number.";
    const digits = clean.replace(/\D/g, "");
    if (digits.length < 9 || digits.length > 13) {
      return "Please enter a valid mobile number (e.g. 0712 345 678 or 0682 123 456).";
    }
    if (checkAccountExists(clean))
      return "This phone number is already registered. Please sign in instead.";
    return null;
  }

  function validatePassword(val: string): string | null {
    if (!val) return "Please enter a password.";
    if (val.length < 8) return "Password must be at least 8 characters long.";
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(val))
      return "Password must contain both letters and numbers.";
    return null;
  }

  function validateConfirmPassword(pass: string, confirm: string): string | null {
    if (!confirm) return "Please confirm your password.";
    if (pass !== confirm) return "Passwords do not match.";
    return null;
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};

    const nameErr = validateFullName(fullName);
    if (nameErr) errs.fullName = nameErr;

    const emailErr = validateEmail(email);
    if (emailErr) errs.email = emailErr;

    const phoneErr = validatePhone(phone);
    if (phoneErr) errs.phone = phoneErr;

    const passErr = validatePassword(password);
    if (passErr) errs.password = passErr;

    const confirmErr = validateConfirmPassword(password, confirmPassword);
    if (confirmErr) errs.confirmPassword = confirmErr;

    if (!agreeTerms) {
      errs.agreeTerms = "You must accept the terms and conditions to register.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setBusy(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const formattedPhone = formatTanzanianPhone(phone.trim());

    try {
      const newUser = await signUpUserClient({
        email: cleanEmail,
        password,
        fullName: fullName.trim(),
        phone: formattedPhone,
        role: "customer",
      });
      signIn(newUser);

      if (accountType === "partner") {
        createInitialResellerApplication(newUser.id, {
          applicantType: "individual",
          fullName: fullName.trim(),
          phone: formattedPhone,
          email: cleanEmail,
        });
        setSuccessMessage(
          "Partner Account Created! Redirecting to complete your Reseller Application...",
        );
        setTimeout(() => {
          navigate({ to: "/partner-apply" });
        }, 600);
      } else {
        setSuccessMessage("Account created successfully! Welcome to Philipo Cosmetics.");
        setTimeout(() => {
          navigate({ to: "/account" });
        }, 500);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Registration failed. Please try again.";
      setErrorMessage(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden font-sans select-none flex flex-col justify-between">
      {/* ─── FULL BACKGROUND PHOTOGRAPH (MOBILE & DESKTOP) ─── */}
      {/* Mobile portrait background */}
      <img
        src="/registration.png"
        alt="Philipo Cosmetics"
        className="lg:hidden fixed inset-0 size-full object-cover object-top pointer-events-none"
      />
      {/* Desktop landscape background */}
      <img
        src="/background.png"
        alt="Philipo Cosmetics"
        className="hidden lg:block fixed inset-0 size-full object-cover object-center pointer-events-none"
      />

      {/* ─── SOFT SCRIM OVERLAYS FOR HIGH CONTRAST & READABILITY ─── */}
      {/* Mobile top-left subtle veil for brand text readability */}
      <div className="lg:hidden fixed top-0 left-0 w-[72%] h-56 bg-gradient-to-br from-white/95 via-white/80 to-transparent pointer-events-none" />

      {/* Desktop soft curved arch overlay */}
      <div className="hidden lg:block absolute inset-y-0 left-0 w-[58%] max-w-[850px] bg-gradient-to-r from-[#FFFBF9]/95 via-[#FFF6F8]/90 to-transparent rounded-r-[140px] pointer-events-none backdrop-blur-[2px]" />

      {/* ─── TOP RETURN BUTTON (DESKTOP) ─── */}
      <div className="hidden lg:block relative z-30 pt-3 px-4 sm:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-full bg-white/90 border border-gray-200/80 px-3.5 py-1 text-xs font-medium text-gray-700 shadow-xs hover:bg-white transition-all backdrop-blur-sm"
        >
          <ArrowLeft className="size-3.5 text-[#243B90]" />
          <span>Back</span>
        </Link>
      </div>

      {/* ─── MAIN CONTENT CONTAINER ─── */}
      <main className="relative z-20 mx-auto max-w-7xl flex-1 w-full flex items-center px-4 sm:px-6 lg:px-8 py-2 sm:py-6">
        <div className="w-full grid lg:grid-cols-[1.05fr_1.1fr] items-center gap-3 lg:gap-14">
          {/* ════════════════════ MOBILE TOP HEADER ════════════════════ */}
          <section className="lg:hidden relative z-10 w-full max-w-[460px] mx-auto pt-1 pb-1">
            {/* Top Back Link */}
            <div className="pb-1.5">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 rounded-full bg-white/90 border border-gray-200/80 px-3 py-1 text-xs font-medium text-gray-800 hover:text-[#E6007A] transition-colors shadow-2xs backdrop-blur-sm"
              >
                <ArrowLeft className="size-3.5" />
                <span>Back</span>
              </Link>
            </div>

            {/* Header: Logo on left, letting model from background.png show on right */}
            <div className="max-w-[65%] space-y-0.5 pt-0.5">
              <Link to="/" className="inline-block">
                <img
                  src="/logo.png"
                  alt="Philipo Cosmetics"
                  className="h-10 sm:h-12 w-auto object-contain"
                />
              </Link>
              <p className="text-[8.5px] font-semibold tracking-[0.24em] text-[#77747C] uppercase">
                BEAUTY · CARE · CONFIDENCE
              </p>
            </div>
          </section>

          {/* ════════════════════ DESKTOP LEFT COLUMN ════════════════════ */}
          <section className="hidden lg:block relative z-10 space-y-4 max-w-lg lg:pl-4">
            {/* Logo */}
            <div className="space-y-1">
              <Link to="/" className="inline-block">
                <img
                  src="/logo.png"
                  alt="Philipo Cosmetics"
                  className="h-16 lg:h-20 w-auto object-contain"
                />
              </Link>
              <p className="text-[10px] font-semibold tracking-[0.25em] text-[#77747C] uppercase">
                BEAUTY · CARE · CONFIDENCE
              </p>
            </div>

            {/* Typography */}
            <div className="space-y-2">
              <h1 className="font-display text-4xl xl:text-5xl font-medium tracking-tight text-[#1A1A24] leading-tight">
                Join Philipo Cosmetics
              </h1>
              <p className="text-sm lg:text-base text-gray-600 leading-relaxed max-w-md">
                Create your customer account to explore genuine luxury cosmetics, enjoy priority
                salon styling, and track doorstep deliveries across Tanzania.
              </p>
            </div>

            {/* 4 Feature Circles */}
            <div className="grid grid-cols-4 gap-4 pt-3 max-w-md">
              <div className="flex flex-col items-center text-center group">
                <div className="size-12 rounded-full bg-[#FCEAF2] flex items-center justify-center text-[#E6007A] transition-transform duration-300 group-hover:scale-105 shadow-xs">
                  <ShoppingBag className="size-5" />
                </div>
                <span className="mt-2 text-[11px] font-medium text-gray-700 leading-tight">
                  Manage
                  <br />
                  Products
                </span>
              </div>

              <div className="flex flex-col items-center text-center group">
                <div className="size-12 rounded-full bg-[#FCEAF2] flex items-center justify-center text-[#E6007A] transition-transform duration-300 group-hover:scale-105 shadow-xs">
                  <Calendar className="size-5" />
                </div>
                <span className="mt-2 text-[11px] font-medium text-gray-700 leading-tight">
                  Handle
                  <br />
                  Appointments
                </span>
              </div>

              <div className="flex flex-col items-center text-center group">
                <div className="size-12 rounded-full bg-[#FCEAF2] flex items-center justify-center text-[#E6007A] transition-transform duration-300 group-hover:scale-105 shadow-xs">
                  <Package className="size-5" />
                </div>
                <span className="mt-2 text-[11px] font-medium text-gray-700 leading-tight">
                  Track
                  <br />
                  Orders
                </span>
              </div>

              <div className="flex flex-col items-center text-center group">
                <div className="size-12 rounded-full bg-[#FCEAF2] flex items-center justify-center text-[#E6007A] transition-transform duration-300 group-hover:scale-105 shadow-xs">
                  <Store className="size-5" />
                </div>
                <span className="mt-2 text-[11px] font-medium text-gray-700 leading-tight">
                  Salon
                  <br />
                  Privileges
                </span>
              </div>
            </div>
          </section>

          {/* ════════════════════ CREATE ACCOUNT CARD ════════════════════ */}
          <section className="relative z-10 flex flex-col items-center justify-center lg:justify-end pb-8 sm:pb-0 w-full">
            <div className="w-full max-w-[460px] rounded-[28px] sm:rounded-[32px] bg-white/95 sm:bg-white p-5 sm:p-7 shadow-2xl shadow-black/15 border border-white/90 sm:border-gray-100/90 backdrop-blur-md">
              {/* Card Title */}
              <div className="space-y-0.5 pb-2.5">
                <h2 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-[#1A1A24]">
                  Create Your Account
                </h2>
                <p className="text-xs text-gray-500">
                  Join Philipo Cosmetics and start your beauty journey.
                </p>
              </div>

              {/* Status Notifications */}
              {errorMessage && (
                <div className="mb-2.5 flex items-start gap-2 rounded-xl bg-destructive/10 p-2 text-xs text-destructive border border-destructive/20 animate-in fade-in">
                  <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
                  <span className="leading-tight">{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="mb-2.5 flex items-start gap-2 rounded-xl bg-emerald-50 p-2 text-xs text-emerald-800 border border-emerald-200 animate-in fade-in">
                  <CheckCircle2 className="size-3.5 shrink-0 mt-0.5 text-emerald-600" />
                  <span className="leading-tight font-medium">{successMessage}</span>
                </div>
              )}

              {/* 2 Account Type Tabs */}
              <div className="grid grid-cols-2 gap-2 pb-3">
                {/* Customer Tab */}
                <button
                  type="button"
                  onClick={() => setAccountType("customer")}
                  className={`flex items-center gap-2 p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    accountType === "customer"
                      ? "bg-[#FFF0F7] border-[#E6007A]/50 text-[#E6007A] shadow-2xs"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`size-8 rounded-xl grid place-items-center shrink-0 ${
                      accountType === "customer"
                        ? "bg-[#E6007A]/15 text-[#E6007A]"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <User className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold leading-tight">Customer</p>
                    <p className="text-[10px] text-gray-500 leading-tight">Shop & Book Services</p>
                  </div>
                </button>

                {/* Business Partner Tab */}
                <button
                  type="button"
                  onClick={() => setAccountType("partner")}
                  className={`flex items-center gap-2 p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    accountType === "partner"
                      ? "bg-[#FFF0F7] border-[#E6007A]/50 text-[#E6007A] shadow-2xs"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`size-8 rounded-xl grid place-items-center shrink-0 ${
                      accountType === "partner"
                        ? "bg-[#E6007A]/15 text-[#E6007A]"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <Store className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold leading-tight">Business Partner</p>
                    <p className="text-[10px] text-gray-500 leading-tight">
                      For resellers / partners
                    </p>
                  </div>
                </button>
              </div>

              {/* Registration Form */}
              <form onSubmit={handleSubmit} className="space-y-2.5">
                {/* 1. Full Name */}
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <input
                    id="reg-name"
                    type="text"
                    autoComplete="name"
                    required
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: "" }));
                    }}
                    onBlur={() => {
                      const err = validateFullName(fullName);
                      if (err) setErrors((prev) => ({ ...prev, fullName: err }));
                    }}
                    placeholder="Full Name (First and Last Name)"
                    className={`block w-full rounded-xl sm:rounded-2xl border bg-white py-2.5 pl-10 pr-3 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all ${
                      errors.fullName
                        ? "border-destructive focus:border-destructive ring-1 ring-destructive/20"
                        : "border-gray-200 focus:border-[#E6007A] focus:ring-1 focus:ring-[#E6007A]"
                    }`}
                  />
                  {errors.fullName && (
                    <p className="text-[10.5px] font-medium text-destructive mt-0.5 pl-2 flex items-center gap-1">
                      <AlertCircle className="size-3" />
                      <span>{errors.fullName}</span>
                    </p>
                  )}
                </div>

                {/* 2. Email Address */}
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <input
                    id="reg-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                    }}
                    onBlur={() => {
                      const err = validateEmail(email);
                      if (err) setErrors((prev) => ({ ...prev, email: err }));
                    }}
                    placeholder="Email Address"
                    className={`block w-full rounded-xl sm:rounded-2xl border bg-white py-2.5 pl-10 pr-3 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all ${
                      errors.email
                        ? "border-destructive focus:border-destructive ring-1 ring-destructive/20"
                        : "border-gray-200 focus:border-[#E6007A] focus:ring-1 focus:ring-[#E6007A]"
                    }`}
                  />
                  {errors.email && (
                    <p className="text-[10.5px] font-medium text-destructive mt-0.5 pl-2 flex items-center gap-1">
                      <AlertCircle className="size-3" />
                      <span>{errors.email}</span>
                    </p>
                  )}
                </div>

                {/* 3. Phone Number */}
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <input
                    id="reg-phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors((prev) => ({ ...prev, phone: "" }));
                    }}
                    onBlur={() => {
                      const err = validatePhone(phone);
                      if (err) setErrors((prev) => ({ ...prev, phone: err }));
                    }}
                    placeholder="Phone Number (e.g. 0712 345 678)"
                    className={`block w-full rounded-xl sm:rounded-2xl border bg-white py-2.5 pl-10 pr-3 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all ${
                      errors.phone
                        ? "border-destructive focus:border-destructive ring-1 ring-destructive/20"
                        : "border-gray-200 focus:border-[#E6007A] focus:ring-1 focus:ring-[#E6007A]"
                    }`}
                  />
                  {errors.phone && (
                    <p className="text-[10.5px] font-medium text-destructive mt-0.5 pl-2 flex items-center gap-1">
                      <AlertCircle className="size-3" />
                      <span>{errors.phone}</span>
                    </p>
                  )}
                </div>

                {/* 4. Password & Confirm Password (Side by side) */}
                <div className="space-y-1">
                  <div className="grid gap-2 grid-cols-2">
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
                      <input
                        id="reg-pwd"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
                        }}
                        onBlur={() => {
                          const err = validatePassword(password);
                          if (err) setErrors((prev) => ({ ...prev, password: err }));
                        }}
                        placeholder="Password (min 8 chars)"
                        className={`block w-full rounded-xl sm:rounded-2xl border bg-white py-2.5 pl-8 pr-7 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all ${
                          errors.password
                            ? "border-destructive focus:border-destructive ring-1 ring-destructive/20"
                            : "border-gray-200 focus:border-[#E6007A] focus:ring-1 focus:ring-[#E6007A]"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeOff className="size-3.5" />
                        ) : (
                          <Eye className="size-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
                      <input
                        id="reg-confirm"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (errors.confirmPassword)
                            setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                        }}
                        onBlur={() => {
                          const err = validateConfirmPassword(password, confirmPassword);
                          if (err) setErrors((prev) => ({ ...prev, confirmPassword: err }));
                        }}
                        placeholder="Confirm Password"
                        className={`block w-full rounded-xl sm:rounded-2xl border bg-white py-2.5 pl-8 pr-7 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all ${
                          errors.confirmPassword
                            ? "border-destructive focus:border-destructive ring-1 ring-destructive/20"
                            : "border-gray-200 focus:border-[#E6007A] focus:ring-1 focus:ring-[#E6007A]"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="size-3.5" />
                        ) : (
                          <Eye className="size-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Password Strength Indicator */}
                  {password && (
                    <div className="px-1 pt-1 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-gray-500 font-medium">Strength:</span>
                        <span
                          className={`font-bold ${
                            getPasswordStrength(password).label === "Strong"
                              ? "text-emerald-600"
                              : getPasswordStrength(password).label === "Fair"
                                ? "text-amber-600"
                                : "text-rose-600"
                          }`}
                        >
                          {getPasswordStrength(password).label}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${getPasswordStrength(password).color}`}
                          style={{ width: `${getPasswordStrength(password).percent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {(errors.password || errors.confirmPassword) && (
                    <p className="text-[10.5px] font-medium text-destructive mt-0.5 pl-2 flex items-center gap-1">
                      <AlertCircle className="size-3" />
                      <span>{errors.password || errors.confirmPassword}</span>
                    </p>
                  )}
                </div>

                {/* 7. Terms & Conditions */}
                <div className="pt-0.5">
                  <label className="flex items-center gap-2 text-[11px] text-gray-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="size-3.5 rounded border-gray-300 text-[#E6007A] focus:ring-[#E6007A] accent-[#E6007A] cursor-pointer"
                    />
                    <span className="leading-tight">
                      I agree to the{" "}
                      <span className="font-semibold text-[#E6007A] underline">
                        Terms and Conditions
                      </span>{" "}
                      and{" "}
                      <span className="font-semibold text-[#E6007A] underline">Privacy Policy</span>
                    </span>
                  </label>
                  {errors.agreeTerms && (
                    <p className="text-[10.5px] font-medium text-destructive mt-0.5 pl-2">
                      {errors.agreeTerms}
                    </p>
                  )}
                </div>

                {/* 8. Create Account Button */}
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full py-3.5 rounded-xl sm:rounded-2xl bg-[#E6007A] hover:bg-[#D4006F] active:scale-[0.99] text-white font-semibold text-sm shadow-md shadow-[#E6007A]/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                  >
                    {busy ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Account</span>
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* "or" Divider */}
              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-gray-200 w-full" />
                <span className="bg-white px-3 text-xs text-gray-400 uppercase tracking-wider absolute">
                  or
                </span>
              </div>

              {/* Continue with Google */}
              <button
                type="button"
                onClick={() => {
                  setErrorMessage("Google signup can be configured in account settings.");
                }}
                className="w-full py-2.5 rounded-xl sm:rounded-2xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium text-xs flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-2xs"
              >
                <GoogleIcon className="size-4" />
                <span>Continue with Google</span>
              </button>

              {/* Bottom Navigation */}
              <div className="mt-4 text-center text-xs text-gray-500">
                <p>
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="font-semibold text-[#E6007A] hover:underline transition-colors"
                  >
                    Sign In
                  </Link>
                </p>
              </div>
            </div>

            {/* Spacer so bottom cosmetics in background.png are visible beneath the card */}
            <div className="lg:hidden h-20 w-full" />
          </section>
        </div>
      </main>
    </div>
  );
}
