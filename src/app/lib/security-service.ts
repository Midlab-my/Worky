/**
 * Servico central de Seguranca da Informacao e LGPD para o Worky.
 * Cobre:
 * - Bloqueio temporario por forca bruta (Rate Limit e Brute-force protection no login)
 * OTP e MFA reais sao implementados em services/auth.ts (Supabase Auth).
 * - Gestao de consentimento de cookies e portabilidade de dados (LGPD)
 */

import { sanitizePlainText, INPUT_LIMITS } from "./input-security";

// ==========================================
// 1. PROTECAO CONTRA FORCA BRUTA & TENTATIVAS DE LOGIN
// ==========================================
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutos de bloqueio
const ATTEMPTS_WINDOW_MS = 15 * 60 * 1000; // janela de 15 minutos

interface LoginAttemptRecord {
  count: number;
  lastAttempt: number;
  lockedUntil: number | null;
}

const STORAGE_PREFIX_LOGIN = "worky.sec.login_attempts.";

export interface LoginLockoutStatus {
  isLocked: boolean;
  remainingSeconds: number;
  attemptsLeft: number;
}

export function getLoginLockoutStatus(identifier: string): LoginLockoutStatus {
  if (typeof window === "undefined" || !identifier) {
    return { isLocked: false, remainingSeconds: 0, attemptsLeft: MAX_LOGIN_ATTEMPTS };
  }

  const key = STORAGE_PREFIX_LOGIN + sanitizePlainText(identifier.toLowerCase().trim(), INPUT_LIMITS.email);
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return { isLocked: false, remainingSeconds: 0, attemptsLeft: MAX_LOGIN_ATTEMPTS };
  }

  try {
    const record: LoginAttemptRecord = JSON.parse(raw);
    const now = Date.now();

    if (record.lockedUntil && record.lockedUntil > now) {
      const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
      return { isLocked: true, remainingSeconds, attemptsLeft: 0 };
    }

    if (now - record.lastAttempt > ATTEMPTS_WINDOW_MS) {
      window.localStorage.removeItem(key);
      return { isLocked: false, remainingSeconds: 0, attemptsLeft: MAX_LOGIN_ATTEMPTS };
    }

    const attemptsLeft = Math.max(0, MAX_LOGIN_ATTEMPTS - record.count);
    return { isLocked: false, remainingSeconds: 0, attemptsLeft };
  } catch {
    window.localStorage.removeItem(key);
    return { isLocked: false, remainingSeconds: 0, attemptsLeft: MAX_LOGIN_ATTEMPTS };
  }
}

export function registerFailedLoginAttempt(identifier: string): LoginLockoutStatus {
  if (typeof window === "undefined" || !identifier) {
    return { isLocked: false, remainingSeconds: 0, attemptsLeft: MAX_LOGIN_ATTEMPTS - 1 };
  }

  const key = STORAGE_PREFIX_LOGIN + sanitizePlainText(identifier.toLowerCase().trim(), INPUT_LIMITS.email);
  const now = Date.now();
  let record: LoginAttemptRecord = { count: 0, lastAttempt: now, lockedUntil: null };

  const raw = window.localStorage.getItem(key);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (now - parsed.lastAttempt <= ATTEMPTS_WINDOW_MS) {
        record = parsed;
      }
    } catch {
      // reseta se corrompido
    }
  }

  record.count += 1;
  record.lastAttempt = now;

  if (record.count >= MAX_LOGIN_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    window.localStorage.setItem(key, JSON.stringify(record));
    const remainingSeconds = Math.ceil(LOCKOUT_DURATION_MS / 1000);
    return { isLocked: true, remainingSeconds, attemptsLeft: 0 };
  }

  window.localStorage.setItem(key, JSON.stringify(record));
  const attemptsLeft = Math.max(0, MAX_LOGIN_ATTEMPTS - record.count);
  return { isLocked: false, remainingSeconds: 0, attemptsLeft };
}

export function clearLoginAttempts(identifier: string): void {
  if (typeof window === "undefined" || !identifier) return;
  const key = STORAGE_PREFIX_LOGIN + sanitizePlainText(identifier.toLowerCase().trim(), INPUT_LIMITS.email);
  window.localStorage.removeItem(key);
}

// ==========================================
// 4. CONFORMIDADE LGPD: COOKIES E PORTABILIDADE DE DADOS
// ==========================================
const STORAGE_COOKIE_CONSENT = "worky.lgpd.cookie_consent";

export interface CookiePreferences {
  essential: boolean; // sempre true
  analytics: boolean;
  preferences: boolean;
  answeredAt: string;
}

export function getStoredCookieConsent(): CookiePreferences | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_COOKIE_CONSENT);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveCookieConsent(prefs: Omit<CookiePreferences, "essential" | "answeredAt">): void {
  if (typeof window === "undefined") return;
  const full: CookiePreferences = {
    essential: true,
    analytics: Boolean(prefs.analytics),
    preferences: Boolean(prefs.preferences),
    answeredAt: new Date().toISOString(),
  };
  window.localStorage.setItem(STORAGE_COOKIE_CONSENT, JSON.stringify(full));
}

export function exportUserDataFile(userData: Record<string, unknown>, filename = "worky_meus_dados_lgpd.json"): void {
  const payload = {
    exportInfo: {
      plataforma: "Worky",
      finalidade: "Portabilidade e Acesso do Titular (Art. 18, incisos II e V da LGPD - Lei 13.709/2018)",
      dataSolicitacao: new Date().toISOString(),
      responsavelTratamento: "Worky Plataforma de Carreiras LTDA",
    },
    titular: userData,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
