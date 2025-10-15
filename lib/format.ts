export function formatAUD(amount?: number | null): string {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return "N/A";
  }

  return amount.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  });
}

export function fmtBedsBaths(b?: number | null, ba?: number | null, g?: number | null): string {
  const parts: string[] = [];

  if (typeof b === "number" && Number.isFinite(b) && b >= 0) {
    parts.push(`${b} bd`);
  }
  if (typeof ba === "number" && Number.isFinite(ba) && ba >= 0) {
    parts.push(`${ba} ba`);
  }
  if (typeof g === "number" && Number.isFinite(g) && g >= 0) {
    parts.push(`${g} car`);
  }

  return parts.length > 0 ? parts.join(" · ") : "Details unavailable";
}
