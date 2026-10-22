export type CatalogTone = "slate" | "blue" | "teal" | "indigo";

export const CATALOG_TONE_STYLE: Record<CatalogTone, { bg: string; color: string }> = {
  slate: { bg: "#e2e8f0", color: "#0f172a" },
  blue: { bg: "#dbeafe", color: "#1d4ed8" },
  teal: { bg: "#ccfbf1", color: "#0f766e" },
  indigo: { bg: "#e0e7ff", color: "#4338ca" },
};

const TONES: CatalogTone[] = ["slate", "blue", "teal", "indigo"];

export function catalogInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "W";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

export function catalogTone(id: string): CatalogTone {
  let hash = 0;
  for (const char of id) hash = (hash + char.charCodeAt(0)) % TONES.length;
  return TONES[hash] || "slate";
}

export function catalogSkillChips(requisitos: string): string[] {
  return requisitos
    .split(/[,;|\n]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 1 && item.length <= 40)
    .slice(0, 8);
}
