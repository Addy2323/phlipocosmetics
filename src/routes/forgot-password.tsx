import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Mail, CheckCircle, ShieldCheck } from "lucide-react";
import logo from "@/assets/logo.png";
import { requestPasswordResetClient } from "@/lib/auth-client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot Password — Philipo Cosmetics" },
      { name: "description", content: "Reset your Philipo Cosmetics account password." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email.trim()) {
      setError("Please enter your registered email address.");
      return;
    }

    setBusy(true);
    try {
      const res = await requestPasswordResetClient(email);
      setMessage(res.message);
    } catch (err: any) {
      setError(err.message || "Failed to submit reset request. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFCFA] text-[#25232B] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-block">
          <img src={logo} alt="Philipo Cosmetics" className="h-14 mx-auto object-contain" />
        </Link>
        <h1 className="mt-6 font-serif text-3xl font-bold tracking-tight text-[#0F372E]">
          Reset Your Password
        </h1>
        <p className="mt-2 text-xs text-muted-foreground">
          Enter your registered email address and we'll send you recovery instructions.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm border border-[#EAE6DF] rounded-2xl sm:px-10">
          {message ? (
            <div className="text-center space-y-4">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle className="size-6" />
              </div>
              <h2 className="font-bold text-sm text-[#0F372E]">Check Your Inbox</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>
              <div className="pt-4">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-[#EC008C] hover:underline"
                >
                  <ArrowLeft className="size-3.5" /> Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#0F372E] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-xl border border-[#EAE6DF] bg-[#FFFCFA] pl-10 pr-3.5 py-2.5 text-xs text-foreground focus:border-[#EC008C] focus:ring-1 focus:ring-[#EC008C]/30 focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-[#EC008C] py-3 text-xs font-bold text-white shadow-md shadow-[#EC008C]/25 hover:bg-[#d0007b] active:scale-[0.99] transition-all disabled:opacity-50"
              >
                {busy ? "Sending Instructions..." : "Send Password Reset Link"}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#0F372E] transition-colors"
                >
                  <ArrowLeft className="size-3.5" /> Back to Sign In
                </Link>
              </div>
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
