import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, CheckCircle, ShieldCheck } from "lucide-react";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set New Password — Philipo Cosmetics" },
      { name: "description", content: "Set your new Philipo Cosmetics account password." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError("Please enter a new password.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setSuccess(true);
      setTimeout(() => {
        navigate({ to: "/login" });
      }, 2000);
    }, 600);
  }

  return (
    <div className="min-h-screen bg-[#FFFCFA] text-[#25232B] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-block">
          <img src={logo} alt="Philipo Cosmetics" className="h-14 mx-auto object-contain" />
        </Link>
        <h1 className="mt-6 font-serif text-3xl font-bold tracking-tight text-[#0F372E]">
          Set New Password
        </h1>
        <p className="mt-2 text-xs text-muted-foreground">
          Choose a secure password for your Philipo account.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm border border-[#EAE6DF] rounded-2xl sm:px-10">
          {success ? (
            <div className="text-center space-y-4">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle className="size-6" />
              </div>
              <h2 className="font-bold text-sm text-[#0F372E]">Password Updated!</h2>
              <p className="text-xs text-muted-foreground">
                Your new password has been saved. Redirecting you to sign in...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#0F372E] mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-[#EAE6DF] bg-[#FFFCFA] pl-10 pr-3.5 py-2.5 text-xs text-foreground focus:border-[#EC008C] focus:ring-1 focus:ring-[#EC008C]/30 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F372E] mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-[#EAE6DF] bg-[#FFFCFA] pl-10 pr-3.5 py-2.5 text-xs text-foreground focus:border-[#EC008C] focus:ring-1 focus:ring-[#EC008C]/30 focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-[#EC008C] py-3 text-xs font-bold text-white shadow-md shadow-[#EC008C]/25 hover:bg-[#d0007b] active:scale-[0.99] transition-all disabled:opacity-50 mt-2"
              >
                {busy ? "Updating Password..." : "Save Password & Sign In"}
              </button>
            </form>
          )}
        </div>

        <div className="mt-8 text-center flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-4 text-emerald-600" />
          <span>Secured with Philipo Identity Guardian</span>
        </div>
      </div>
    </div>
  );
}
