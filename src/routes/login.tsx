import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShoppingBag,
  Calendar,
  Package,
  BarChart3,
  ArrowRight,
  ArrowLeft,
  Loader2,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { signInUserClient, requestPasswordResetClient } from "@/lib/auth-client";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In — Philipo Cosmetics" },
      {
        name: "description",
        content: "Sign in to access your Philipo Cosmetics account.",
      },
      { property: "og:title", content: "Sign In — Philipo Cosmetics" },
    ],
  }),
  component: LoginPage,
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

export function LoginPage() {
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();

  // Inputs
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Status
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Field validation
  const [identifierError, setIdentifierError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Forgot Password modal
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

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

  function validateIdentifier(val: string): string | null {
    const clean = val.trim();
    if (!clean) return "Please enter your email address.";
    if (clean.includes("@")) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(clean)) {
        return "Please enter a valid email address (e.g. name@example.com).";
      }
    } else if (/^\+?\d[\d\s-]{5,}$/.test(clean)) {
      const digits = clean.replace(/\D/g, "");
      if (digits.length < 9 || digits.length > 13) {
        return "Please enter a valid phone number (e.g. 0712 345 678 or +255 744 281 673).";
      }
    } else {
      return "Please enter a valid email address (e.g. name@example.com).";
    }
    return null;
  }

  function validatePassword(val: string): string | null {
    if (!val) return "Please enter your password.";
    if (val.length < 6) return "Password must be at least 6 characters long.";
    return null;
  }

  function validate(): boolean {
    const idErr = validateIdentifier(identifier);
    const passErr = validatePassword(password);
    setIdentifierError(idErr);
    setPasswordError(passErr);
    setErrorMessage(null);
    return !idErr && !passErr;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setBusy(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const cleanId = identifier.trim().toLowerCase();
      try {
        const sessionUser = await signInUserClient({
          identifier: cleanId,
          password,
        });
        signIn(sessionUser);
        setSuccessMessage("Welcome back! Redirecting...");
        setTimeout(() => {
          if (sessionUser.role === "admin") {
            navigate({ to: "/admin/dashboard" });
          } else if (sessionUser.role === "sales" || sessionUser.role === "sales_staff") {
            navigate({ to: "/sales/dashboard" });
          } else {
            navigate({ to: "/account" });
          }
        }, 400);
      } catch (authErr) {
        const msg = authErr instanceof Error ? authErr.message : "Invalid email or password.";
        setErrorMessage(msg);
      }
    } catch {
      setErrorMessage("Unable to connect to the authentication service. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setResetBusy(true);
    try {
      const res = await requestPasswordResetClient(resetEmail.trim());
      setResetMessage(res.message);
      setTimeout(() => {
        setForgotOpen(false);
        setResetEmail("");
        setResetMessage(null);
      }, 3000);
    } finally {
      setResetBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden font-sans select-none flex flex-col justify-between">
      {/* ─── FULL BACKGROUND PHOTOGRAPH (MOBILE & DESKTOP) ─── */}
      {/* Mobile portrait background */}
      <img
        src="/login-background.png"
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
      {/* Mobile top-left subtle veil for brand text readability while keeping the model on right completely clear */}
      <div className="lg:hidden fixed top-0 left-0 w-[72%] h-64 bg-gradient-to-br from-white/95 via-white/80 to-transparent pointer-events-none" />

      {/* Desktop soft curved arch overlay */}
      <div className="hidden lg:block absolute inset-y-0 left-0 w-[58%] max-w-[850px] bg-gradient-to-r from-[#FFFBF9]/95 via-[#FFF6F8]/90 to-transparent rounded-r-[140px] pointer-events-none backdrop-blur-[2px]" />

      {/* ─── TOP RETURN BUTTON ─── */}
      <div className="relative z-30 pt-3 px-4 sm:px-8">
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
        <div className="w-full grid lg:grid-cols-[1.1fr_1fr] items-center gap-3 lg:gap-16">
          {/* ════════════════════ MOBILE TOP HEADER ════════════════════ */}
          {/* Left-aligned text allowing the model in background.png to show clearly on the right */}
          <section className="lg:hidden relative z-10 w-full max-w-[430px] mx-auto pt-1 pb-1">
            <div className="max-w-[65%] space-y-1.5">
              <div className="space-y-0.5">
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

              <div className="pt-1 space-y-1">
                <h1 className="font-display text-[26px] xs:text-[28px] font-medium tracking-tight text-[#1A1A24] leading-tight">
                  Welcome Back
                </h1>
                <p className="text-[11.5px] text-gray-700 leading-snug">
                  Sign in to your Philipo Cosmetics account and continue your beauty journey.
                </p>
              </div>
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
              <h1 className="font-display text-4xl lg:text-5xl font-medium tracking-tight text-[#1A1A24] leading-tight">
                Welcome Back
              </h1>
              <p className="text-sm lg:text-base text-gray-600 leading-relaxed max-w-md">
                Sign in to your Philipo Cosmetics account and continue your beauty journey.
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
                  <BarChart3 className="size-5" />
                </div>
                <span className="mt-2 text-[11px] font-medium text-gray-700 leading-tight">
                  View
                  <br />
                  Reports
                </span>
              </div>
            </div>
          </section>

          {/* ════════════════════ SIGN IN CARD ════════════════════ */}
          <section className="relative z-10 flex flex-col items-center justify-center lg:justify-end pb-8 sm:pb-0 w-full">
            <div className="w-full max-w-[430px] rounded-[26px] sm:rounded-[32px] bg-white/95 sm:bg-white p-5 sm:p-8 shadow-2xl shadow-black/15 border border-white/90 sm:border-gray-100/90 backdrop-blur-md">
              {/* Desktop Only Card Header */}
              <div className="hidden lg:block text-center space-y-1 pb-3">
                <h2 className="font-display text-3xl font-medium tracking-tight text-[#1A1A24]">
                  Sign In
                </h2>
                <p className="text-xs text-gray-500">Access your Philipo Cosmetics account</p>
              </div>

              {/* Status Notifications */}
              {errorMessage && (
                <div className="mb-3 flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20 animate-in fade-in">
                  <AlertCircle className="size-4 shrink-0 mt-0.5 text-destructive" />
                  <div className="leading-tight">
                    <span>{errorMessage}</span>
                    {errorMessage.includes("create an account") && (
                      <div className="mt-1.5">
                        <Link
                          to="/register"
                          className="inline-flex items-center gap-1 font-bold text-[#E6007A] underline hover:text-[#C70068]"
                        >
                          Click here to create your account now →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {successMessage && (
                <div className="mb-3 flex items-start gap-2 rounded-xl bg-emerald-50 p-2.5 text-xs text-emerald-800 border border-emerald-200 animate-in fade-in">
                  <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-600" />
                  <span className="leading-tight font-medium">{successMessage}</span>
                </div>
              )}

              {/* Sign In Form */}
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                {/* 1. Email Address */}
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <input
                    id="signin-id"
                    type="text"
                    autoComplete="email"
                    required
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (identifierError) setIdentifierError(null);
                    }}
                    onBlur={() => {
                      if (identifier.trim()) {
                        setIdentifierError(validateIdentifier(identifier));
                      }
                    }}
                    placeholder="Email address"
                    className={`block w-full rounded-2xl border bg-white py-3 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-[#E6007A]/25 ${
                      identifierError
                        ? "border-destructive focus:border-destructive"
                        : "border-gray-200 focus:border-[#E6007A]"
                    }`}
                  />
                  {identifierError && (
                    <p className="text-[11px] font-medium text-destructive mt-0.5 pl-2 flex items-center gap-1">
                      <AlertCircle className="size-3" />
                      <span>{identifierError}</span>
                    </p>
                  )}
                </div>

                {/* 2. Password */}
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <input
                    id="signin-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    onBlur={() => {
                      if (password) {
                        setPasswordError(validatePassword(password));
                      }
                    }}
                    placeholder="Password"
                    className={`block w-full rounded-2xl border bg-white py-3 pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-[#E6007A]/25 ${
                      passwordError
                        ? "border-destructive focus:border-destructive"
                        : "border-gray-200 focus:border-[#E6007A]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                  {passwordError && (
                    <p className="text-[11px] font-medium text-destructive mt-0.5 pl-2 flex items-center gap-1">
                      <AlertCircle className="size-3" />
                      <span>{passwordError}</span>
                    </p>
                  )}
                </div>

                {/* Remember Me & Forgot Password Row */}
                <div className="flex items-center justify-between text-xs pt-0.5 px-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="size-4 rounded border-gray-300 text-[#E6007A] focus:ring-[#E6007A] accent-[#E6007A] cursor-pointer"
                    />
                    <span className="text-gray-600 font-medium">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotOpen(true)}
                    className="font-medium text-[#E6007A] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Primary Magenta Button */}
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full py-3.5 rounded-2xl bg-[#E6007A] hover:bg-[#D4006F] active:scale-[0.99] text-white font-semibold text-sm shadow-md shadow-[#E6007A]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                  >
                    {busy ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Signing In...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* "or" Divider */}
              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-gray-200 w-full" />
                <span className="bg-white px-3 text-xs text-gray-400 uppercase tracking-wider absolute">
                  or
                </span>
              </div>

              {/* Continue with Google */}
              <button
                type="button"
                onClick={() => {
                  setErrorMessage("Google authentication can be connected in settings.");
                }}
                className="w-full py-3 rounded-2xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium text-xs flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-2xs"
              >
                <GoogleIcon className="size-4" />
                <span>Continue with Google</span>
              </button>

              {/* Bottom Navigation */}
              <div className="mt-5 text-center text-xs text-gray-500">
                <p>
                  Don't have an account?{" "}
                  <Link
                    to="/register"
                    className="font-semibold text-[#E6007A] hover:underline transition-colors"
                  >
                    Create one
                  </Link>
                </p>
              </div>
            </div>

            {/* Spacer so bottom cosmetics in background.png are visible beneath the card */}
            <div className="lg:hidden h-20 w-full" />
          </section>
        </div>
      </main>

      {/* ─── FORGOT PASSWORD MODAL ─── */}
      {forgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-display text-xl font-medium text-[#1A1A24]">
                Reset Your Password
              </h3>
              <button
                type="button"
                onClick={() => setForgotOpen(false)}
                className="grid size-8 place-items-center rounded-full text-gray-400 hover:bg-gray-100"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Enter your registered email address below to receive password recovery instructions.
            </p>

            {resetMessage && (
              <div className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200 font-medium">
                {resetMessage}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4 pt-1">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">Email Address</label>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="amina@example.com"
                  className="block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#E6007A]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setForgotOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetBusy}
                  className="rounded-xl bg-[#E6007A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#D4006F] disabled:opacity-50"
                >
                  {resetBusy ? "Sending..." : "Send Reset Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
