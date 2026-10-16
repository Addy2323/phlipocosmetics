// Philipo Brand Design Tokens
// Defined once and reused across Web UI, Vector PDF generation, and Excel exports.

export const PHILIPO_PALETTE = {
  // Brand Core
  magenta: "#E6007A",
  magentaHover: "#C40068",
  magentaRgb: [230, 0, 122] as [number, number, number],

  navy: "#173488",
  deepNavy: "#0B1A42",
  navyHover: "#122A6E",
  navyRgb: [23, 52, 136] as [number, number, number],
  deepNavyRgb: [11, 26, 66] as [number, number, number],

  // Backgrounds & Surfaces
  blush: "#FFF5F8",
  blushRgb: [255, 245, 248] as [number, number, number],
  blushBorder: "#FCEAF2",
  creamPink: "#FDF7F9",
  creamPinkRgb: [253, 247, 249] as [number, number, number],
  white: "#FFFFFF",
  whiteRgb: [255, 255, 255] as [number, number, number],

  // Sparing Accent (Never overused)
  champagneGold: "#C9A45C",
  champagneGoldRgb: [201, 164, 92] as [number, number, number],

  // Neutral Typography
  slateText: "#1E293B",
  slateTextRgb: [30, 41, 59] as [number, number, number],
  mutedSlate: "#64748B",
  mutedSlateRgb: [100, 116, 139] as [number, number, number],
  borderLight: "#E2E8F0",
  borderLightRgb: [226, 232, 240] as [number, number, number],

  // System & Transaction Statuses (Strictly separate from Magenta)
  status: {
    paid: "#10B981",
    paidBg: "#E4EEE6",
    paidRgb: [16, 185, 129] as [number, number, number],

    pending: "#F59E0B",
    pendingBg: "#FFF1D6",
    pendingRgb: [245, 158, 11] as [number, number, number],

    failed: "#EF4444",
    failedBg: "#FCE8E6",
    failedRgb: [239, 68, 68] as [number, number, number],

    void: "#94A3B8",
    voidBg: "#F1F5F9",
    voidRgb: [148, 163, 184] as [number, number, number],
  },
};
