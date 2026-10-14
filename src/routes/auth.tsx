import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, Lock, User as UserIcon, Phone, LogIn, KeyRound, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Site } from "@/components/Site";
import { useAuth } from "@/lib/auth";
import { signInUser, signUpUser, requestPasswordReset, type SessionUser, type UserRole } from "@/lib/auth-server";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in & Account — Philipo Cosmetics" },
      { name: "description", content: "Sign in or create your Philipo Cosmetics account to sync your bag, orders, and salon bookings." },
      { property: "og:title", content: "Sign in — Philipo Cosmetics" },
    ],
  }),
  component: AuthPage,
});

const fieldClass =
  "flex h-12 w-full items-center gap-3 rounded-xl border bg-background px-4 text-sm outline-none focus:border-primary transition-colors";

export function AuthPage() {
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"in" | "up" | "forgot">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      if (user.role === "admin" || user.role === "sales_staff" || user.role === "customer_service" || user.role === "stylist") {
        navigate({ to: "/erp" });
      } else {
        navigate({ to: "/account" });
      }
    }
  }, [loading, user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      if (mode === "up") {
        const newUser = await signUpUser({
          email,
          password,
          fullName,
          phone,
          role: "customer",
        });
        signIn(newUser);
        setNotice("Account created successfully!");
        navigate({ to: "/account" });
      } else if (mode === "in") {
        const sessionUser = await signInUser({ email, password });
        signIn(sessionUser);
        if (sessionUser.role === "customer") {
          navigate({ to: "/account" });
        } else {
          navigate({ to: "/erp" });
        }
      } else if (mode === "forgot") {
        const res = await requestPasswordReset(email);
        setNotice(res.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  // Quick switch role accounts for staff testing & audit
  async function quickSwitch(roleEmail: string) {
    setBusy(true);
    setError(null);
    try {
      const demoUsers: Record<string, SessionUser> = {
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
          fullName: "Zawadi Mremi (Sales)",
          phone: "+255 744 281 674",
          role: "sales_staff",
          isActive: true,
        },
        "support@philipo.co.tz": {
          id: "u-support-1",
          email: "support@philipo.co.tz",
          fullName: "Fatma Suleiman (Customer Service)",
          phone: "+255 744 281 675",
          role: "customer_service",
          isActive: true,
        },
        "stylist@philipo.co.tz": {
          id: "u-stylist-1",
          email: "stylist@philipo.co.tz",
          fullName: "Grace Kilonzo (Stylist)",
          phone: "+255 744 281 676",
          role: "stylist",
          isActive: true,
        },
        "customer@philipo.co.tz": {
          id: "u-customer-1",
          email: "customer@philipo.co.tz",
          fullName: "Hellen Nyerere",
          phone: "+255 744 000 111",
          role: "customer",
          isActive: true,
        },
      };

      const selected = demoUsers[roleEmail];
      if (selected) {
        signIn(selected);
        if (selected.role === "customer") navigate({ to: "/account" });
        else navigate({ to: "/erp" });
      }
    } catch {
      setError("Failed to switch account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Site>
      <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
        <div className="card-surface rise-in p-8">
          <p className="eyebrow text-rose">Philipo Security</p>
          <h1 className="mt-1 font-display text-3xl">
            {mode === "in"
              ? "Welcome back"
              : mode === "up"
                ? "Create your account"
                : "Reset your password"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "forgot"
              ? "Enter your email address and we will generate password reset instructions."
              : "Your shopping bag, orders, and salon bookings sync across devices."}
          </p>

          <div className="mt-6 grid grid-cols-2 rounded-full bg-secondary p-1 text-sm">
            <button
              type="button"
              onClick={() => {
                setMode("in");
                setError(null);
                setNotice(null);
              }}
              className={`h-10 rounded-full transition-colors ${
                mode === "in" ? "bg-card font-medium shadow-sm" : "text-muted-foreground"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("up");
                setError(null);
                setNotice(null);
              }}
              className={`h-10 rounded-full transition-colors ${
                mode === "up" ? "bg-card font-medium shadow-sm" : "text-muted-foreground"
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-3">
            {mode === "up" && (
              <>
                <label className={fieldClass}>
                  <UserIcon className="size-4 shrink-0 text-muted-foreground" />
                  <input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full name"
                    className="w-full bg-transparent outline-none"
                  />
                </label>
                <label className={fieldClass}>
                  <Phone className="size-4 shrink-0 text-muted-foreground" />
                  <input
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone number (+255...)"
                    className="w-full bg-transparent outline-none"
                  />
                </label>
              </>
            )}

            <label className={fieldClass}>
              <Mail className="size-4 shrink-0 text-muted-foreground" />
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full bg-transparent outline-none"
              />
            </label>

            {mode !== "forgot" && (
              <label className={fieldClass}>
                <Lock className="size-4 shrink-0 text-muted-foreground" />
                <input
                  required
                  type="password"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (min. 6 characters)"
                  className="w-full bg-transparent outline-none"
                />
              </label>
            )}

            {mode === "in" && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {error && <p className="text-xs font-medium text-destructive">{error}</p>}
            {notice && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>{notice}</span>
              </div>
            )}

            <button type="submit" disabled={busy} className="btn-base btn-primary h-12 w-full">
              {mode === "in" ? (
                <>
                  <LogIn className="size-4" /> Sign in
                </>
              ) : mode === "up" ? (
                <>
                  <UserIcon className="size-4" /> Create account
                </>
              ) : (
                <>
                  <KeyRound className="size-4" /> Send reset instructions
                </>
              )}
            </button>
          </form>

          {/* Role quick switcher for auditing and demonstration */}
          <div className="mt-8 border-t pt-5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 text-primary" />
              <span className="font-semibold uppercase tracking-wider">Demo Role Accounts</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => quickSwitch("admin@philipo.co.tz")}
                className="rounded-lg border bg-secondary/50 p-2 text-left hover:bg-secondary"
              >
                <span className="block font-medium">Administrator</span>
                <span className="text-[10px] text-muted-foreground">admin@philipo.co.tz</span>
              </button>
              <button
                type="button"
                onClick={() => quickSwitch("sales@philipo.co.tz")}
                className="rounded-lg border bg-secondary/50 p-2 text-left hover:bg-secondary"
              >
                <span className="block font-medium">Sales Staff</span>
                <span className="text-[10px] text-muted-foreground">sales@philipo.co.tz</span>
              </button>
              <button
                type="button"
                onClick={() => quickSwitch("support@philipo.co.tz")}
                className="rounded-lg border bg-secondary/50 p-2 text-left hover:bg-secondary"
              >
                <span className="block font-medium">Customer Support</span>
                <span className="text-[10px] text-muted-foreground">support@philipo.co.tz</span>
              </button>
              <button
                type="button"
                onClick={() => quickSwitch("stylist@philipo.co.tz")}
                className="rounded-lg border bg-secondary/50 p-2 text-left hover:bg-secondary"
              >
                <span className="block font-medium">Salon Stylist</span>
                <span className="text-[10px] text-muted-foreground">stylist@philipo.co.tz</span>
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Just browsing?{" "}
            <Link to="/shop" search={{ category: "All" }} className="text-primary underline underline-offset-2">
              Continue shopping
            </Link>
          </p>
        </div>
      </div>
    </Site>
  );
}
