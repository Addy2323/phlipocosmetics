import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { mode?: string } => ({
    mode: typeof search.mode === "string" ? search.mode : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Authentication — Philipo Cosmetics" },
    ],
  }),
  component: AuthRedirect,
});

function AuthRedirect() {
  const search = useSearch({ from: "/auth" });
  const navigate = useNavigate();

  useEffect(() => {
    if (search.mode === "up" || search.mode === "register") {
      navigate({ to: "/register", replace: true });
    } else {
      navigate({ to: "/login", replace: true });
    }
  }, [search.mode, navigate]);

  return (
    <div className="min-h-screen w-full grid place-items-center bg-[#FAF7F5]">
      <div className="flex flex-col items-center gap-3 text-center">
        <img
          src="/logo.png"
          alt="Philipo Cosmetics"
          className="h-12 w-auto object-contain animate-pulse"
        />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-[#243B90]" />
          <span>Connecting to Philipo Authentication...</span>
        </div>
      </div>
    </div>
  );
}
