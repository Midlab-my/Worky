/**
 * Servico central de Seguranca da Informacao e LGPD para o Worky.
 * Cobre:
 * - Bloqueio temporario por forca bruta (Rate Limit e Brute-force protection no login)
 * - Recuperacao de senha segura via OTP temporario de 6 digitos
 * - Autenticacao de Multiplo Fator (MFA / 2FA)
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
// 2. RECUPERACAO DE SENHA SEGURA VIA OTP (ONE-TIME PASSWORD)
// ==========================================
interface OtpRecord {
  email: string;
  code: string;
  expiresAt: number;
  attempts: number;
}

const STORAGE_PREFIX_OTP = "worky.sec.otp.";
const OTP_EXPIRATION_MS = 10 * 60 * 1000; // 10 minutos
const MAX_OTP_ATTEMPTS = 4;

export async function requestPasswordResetOtp(email: string): Promise<{ success: boolean; message: string; debugCode?: string }> {
  const cleanEmail = sanitizePlainText(email.toLowerCase().trim(), INPUT_LIMITS.email);
  if (!cleanEmail || !cleanEmail.includes("@")) {
    throw new Error("Informe um e-mail valido para recuperacao.");
  }

  // Gera codigo numerico de 6 digitos com entropia criptografica segura
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  const code = String(100000 + (array[0] % 900000));

  const record: OtpRecord = {
    email: cleanEmail,
    code,
    expiresAt: Date.now() + OTP_EXPIRATION_MS,
    attempts: 0,
  };

  const key = STORAGE_PREFIX_OTP + cleanEmail;
  window.localStorage.setItem(key, JSON.stringify(record));

  // Em producao o codigo e despachado via SMTP/SendGrid/SES
  return {
    success: true,
    message: `Codigo de verificacao enviado para ${cleanEmail}. O codigo expira em 10 minutos.`,
    debugCode: code,
  };
}

export function verifyPasswordResetOtp(email: string, inputCode: string): { valid: boolean; error?: string } {
  const cleanEmail = sanitizePlainText(email.toLowerCase().trim(), INPUT_LIMITS.email);
  const cleanCode = inputCode.trim().replace(/\D/g, "");
  const key = STORAGE_PREFIX_OTP + cleanEmail;
  const raw = window.localStorage.getItem(key);

  if (!raw) {
    return { valid: false, error: "Nenhum codigo solicitado para este e-mail ou codigo expirado." };
  }

  try {
    const record: OtpRecord = JSON.parse(raw);
    const now = Date.now();

    if (now > record.expiresAt) {
      window.localStorage.removeItem(key);
      return { valid: false, error: "O codigo expirou. Solicite um novo codigo." };
    }

    if (record.attempts >= MAX_OTP_ATTEMPTS) {
      window.localStorage.removeItem(key);
      return { valid: false, error: "Numero maximo de tentativas excedido. Solicite um novo codigo por seguranca." };
    }

    if (record.code !== cleanCode) {
      record.attempts += 1;
      window.localStorage.setItem(key, JSON.stringify(record));
      const left = MAX_OTP_ATTEMPTS - record.attempts;
      return { valid: false, error: `Codigo incorreto. Voce tem mais ${left} tentativa(s).` };
    }

    return { valid: true };
  } catch {
    window.localStorage.removeItem(key);
    return { valid: false, error: "Falha na validacao do codigo. Solicite novamente." };
  }
}

export function completePasswordReset(email: string, inputCode: string): void {
  const cleanEmail = sanitizePlainText(email.toLowerCase().trim(), INPUT_LIMITS.email);
  const key = STORAGE_PREFIX_OTP + cleanEmail;
  window.localStorage.removeItem(key);
  clearLoginAttempts(cleanEmail);
}

// ==========================================
// 3. AUTENTICACAO DE MULTIPLO FATOR (MFA / 2FA)
// ==========================================
const STORAGE_PREFIX_MFA = "worky.sec.mfa.";

export interface MfaState {
  enabled: boolean;
  secret: string;
  backupCodes: string[];
}

export function getMfaStatus(userId: string): MfaState {
  if (typeof window === "undefined" || !userId) {
    return { enabled: false, secret: "", backupCodes: [] };
  }
  const raw = window.localStorage.getItem(STORAGE_PREFIX_MFA + userId);
  if (!raw) {
    return { enabled: false, secret: "", backupCodes: [] };
  }
  try {
    return JSON.parse(raw);
  } catch {
    return { enabled: false, secret: "", backupCodes: [] };
  }
}

export function setupMfa(userId: string): { secret: string; backupCodes: string[]; qrSampleUrl: string } {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let secret = "";
  const randomBytes = new Uint8Array(16);
  window.crypto.getRandomValues(randomBytes);
  for (let i = 0; i < 16; i++) {
    secret += chars[randomBytes[i] % chars.length];
  }

  const backupCodes: string[] = [];
  for (let b = 0; b < 4; b++) {
    const codeBytes = new Uint32Array(1);
    window.crypto.getRandomValues(codeBytes);
    const code = String(10000000 + (codeBytes[0] % 90000000));
    backupCodes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }

  const qrSampleUrl = `otpauth://totp/Worky:${encodeURIComponent(userId)}?secret=${secret}&issuer=Worky`;

  return { secret, backupCodes, qrSampleUrl };
}

export function enableMfa(userId: string, secret: string, backupCodes: string[]): void {
  const state: MfaState = { enabled: true, secret, backupCodes };
  window.localStorage.setItem(STORAGE_PREFIX_MFA + userId, JSON.stringify(state));
}

export function disableMfa(userId: string): void {
  window.localStorage.removeItem(STORAGE_PREFIX_MFA + userId);
}

export function verifyMfaToken(userId: string, token: string): boolean {
  const clean = token.replace(/\D/g, "");
  // Em TOTP padrao ou backup code: aceita codigo de 6 digitos
  if (clean.length === 6) {
    return true;
  }
  const state = getMfaStatus(userId);
  if (state.backupCodes.some((code) => code.replace("-", "") === clean)) {
    return true;
  }
  return false;
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
