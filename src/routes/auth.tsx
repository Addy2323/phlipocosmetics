import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, Lock, User as UserIcon, Phone, LogIn } from "lucide-react";
import { Site } from "@/components/Site";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Philipo Cosmetics" },
      { name: "description", content: "Sign in or create your Philipo Cosmetics account to sync your bag across devices." },
      { property: "og:title", content: "Sign in — Philipo Cosmetics" },
      { property: "og:description", content: "Your bag, bookings and wishlist follow you on every device." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const field =
  "flex h-12 w-full items-center gap-3 rounded-xl border bg-background px-4 text-sm outline-none focus:border-primary";

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/account" });
  }, [loading, user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "up") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, phone },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        if (!data.session) {
          setNotice("Account created — check your email to confirm it, then sign in.");
          setMode("in");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/account" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function signInWithGoogle() {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) setError("Google sign-in failed. Please try again.");
  }

  return (
    <Site>
      <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
        <div className="card-surface rise-in p-8">
          <p className="eyebrow text-rose">Your account</p>
          <h1 className="mt-1 font-display text-3xl">
            {mode === "in" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your bag, wishlist and bookings follow you on every device.
          </p>

          <div className="mt-6 grid grid-cols-2 rounded-full bg-secondary p-1 text-sm">
            {(
              [
                { id: "in", label: "Sign in" },
                { id: "up", label: "Create account" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setMode(t.id);
                  setError(null);
                  setNotice(null);
                }}
                className={`h-10 rounded-full transition-colors ${
                  mode === t.id ? "bg-card font-medium shadow-sm" : "text-muted-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-6 space-y-3">
            {mode === "up" && (
              <>
                <label className={field}>
                  <UserIcon className="size-4 shrink-0 text-muted-foreground" />
                  <input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full name"
                    className="w-full bg-transparent outline-none"
                  />
                </label>
                <label className={field}>
                  <Phone className="size-4 shrink-0 text-muted-foreground" />
                  <input
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone e.g. +255 744 000 000"
                    className="w-full bg-transparent outline-none"
                  />
                </label>
              </>
            )}
            <label className={field}>
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
            <label className={field}>
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

            {error && <p className="text-sm text-destructive">{error}</p>}
            {notice && <p className="text-sm text-primary">{notice}</p>}

            <button type="submit" disabled={busy} className="btn-base btn-primary h-12 w-full">
              <LogIn className="size-4" />
              {busy ? "One moment…" : mode === "in" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>

          <button onClick={signInWithGoogle} className="btn-base btn-outline h-12 w-full">
            Continue with Google
          </button>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Just browsing? <Link to="/shop" className="text-primary underline underline-offset-2">Continue shopping</Link>
          </p>
        </div>
      </div>
    </Site>
  );
}
