export function formatUsd(n: number | null | undefined, empty = ""): string {
  if (n == null || !Number.isFinite(n)) return empty;
  if (!n) return empty;
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

export function parseUsd(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const n = Number(String(value ?? "").replace(/[$,\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
}
