import type { CareerAnalysis } from "../services/api";

const ANALYSIS_PREFIX = "worky:career-analysis:v1:";
const LAST_SEARCH_KEY = "worky:last-career-search:v1";

export type LastCareerSearch = {
  cargo: string;
  pais: string;
  local: string;
  modelo: string;
  fonte: "google" | "scrape" | "all";
  searchKey: string;
};

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Chave estavel da query /carreira. */
export function buildCareerSearchKey(search: string): string {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(raw);
  const cargo = (params.get("cargo") || "").trim();
  if (!cargo) return "";

  const normalized = new URLSearchParams();
  for (const key of ["cargo", "pais", "local", "modelo", "fonte", "skills"] as const) {
    const value = params.get(key)?.trim();
    if (value) normalized.set(key, value);
  }
  return normalized.toString();
}

export function readCachedAnalysis(searchKey: string): CareerAnalysis | null {
  if (typeof window === "undefined" || !searchKey) return null;
  try {
    return safeParse<CareerAnalysis>(window.sessionStorage.getItem(ANALYSIS_PREFIX + searchKey));
  } catch {
    return null;
  }
}

export function writeCachedAnalysis(searchKey: string, analysis: CareerAnalysis): void {
  if (typeof window === "undefined" || !searchKey || !analysis) return;
  try {
    window.sessionStorage.setItem(ANALYSIS_PREFIX + searchKey, JSON.stringify(analysis));
  } catch {
    // sessionStorage cheio ou bloqueado
  }
}

export function readLastCareerSearch(): LastCareerSearch | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = safeParse<LastCareerSearch>(window.sessionStorage.getItem(LAST_SEARCH_KEY));
    if (!parsed?.cargo?.trim()) return null;
    return {
      cargo: parsed.cargo.trim(),
      pais: parsed.pais || "",
      local: parsed.local || "",
      modelo: parsed.modelo || "",
      fonte: parsed.fonte === "scrape" || parsed.fonte === "all" ? parsed.fonte : "google",
      searchKey: parsed.searchKey || "",
    };
  } catch {
    return null;
  }
}

export function writeLastCareerSearch(search: LastCareerSearch): void {
  if (typeof window === "undefined" || !search.cargo.trim()) return;
  try {
    window.sessionStorage.setItem(LAST_SEARCH_KEY, JSON.stringify(search));
  } catch {
    // sessionStorage cheio ou bloqueado
  }
}
