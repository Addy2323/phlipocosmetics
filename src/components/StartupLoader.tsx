import { useEffect, useState } from "react";

/**
 * StartupLoader – a swift luxury splash that displays once per session
 * on initial visit, with zero lag on subsequent navigations or refreshes.
 */

const MIN_DISPLAY_MS = 600;

export function StartupLoader() {
  const [phase, setPhase] = useState<"visible" | "fading" | "gone">(() => {
    if (typeof window !== "undefined") {
      try {
        if (sessionStorage.getItem("philipo_loaded")) {
          return "gone";
        }
      } catch {}
    }
    return "visible";
  });

  useEffect(() => {
    if (phase === "gone") return;

    try {
      sessionStorage.setItem("philipo_loaded", "1");
    } catch {}

    const timer = setTimeout(() => setPhase("fading"), MIN_DISPLAY_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase === "fading") {
      const timer = setTimeout(() => setPhase("gone"), 300);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  if (phase === "gone") return null;

  return (
    <div
      id="startup-loader"
      onClick={() => setPhase("gone")}
      aria-live="polite"
      aria-label="Loading Philipo Cosmetics"
      className={`startup-loader cursor-pointer ${phase === "fading" ? "startup-loader--fade" : ""}`}
    >
      {/* Animated background orbs */}
      <div className="startup-loader__orb startup-loader__orb--1" />
      <div className="startup-loader__orb startup-loader__orb--2" />
      <div className="startup-loader__orb startup-loader__orb--3" />

      <div className="startup-loader__content">
        {/* Logo */}
        <div className="startup-loader__logo-wrap">
          <img
            src="/logo.png"
            alt="Philipo Cosmetics"
            width={120}
            height={120}
            className="startup-loader__logo"
          />
        </div>

        {/* Tagline */}
        <p className="startup-loader__tagline">Cosmetics &amp; Beauty Salon</p>

        {/* Shimmer bar */}
        <div className="startup-loader__track">
          <div className="startup-loader__bar" />
        </div>
      </div>
    </div>
  );
}
