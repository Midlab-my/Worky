/**
 * Limites e sanitizacao de entrada (XSS / injection / flood).
 * React ja escapa HTML na renderizacao; aqui cortamos tamanho e lixo antes de persistir/API.
 */

export const INPUT_LIMITS = {
  name: 120,
  email: 254,
  username: 40,
  password: 128,
  title: 160,
  short: 80,
  bio: 500,
  text: 1000,
  longText: 4000,
  search: 120,
  cardNumber: 19,
  cpfCnpj: 18,
  cvv: 4,
  cargo: 120,
} as const;

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const HTML_TAGS = /<\/?[a-zA-Z][^>]*>/g;
const SUSPICIOUS =
  /<\s*script|javascript\s*:|onerror\s*=|onload\s*=|on\w+\s*=|union\s+select|--\s|;\s*drop\s+|;\s*delete\s+|;\s*insert\s+|;\s*update\s+|xp_cmdshell|\$\{|`\s*\$\(/i;

export function stripControlChars(value: string): string {
  return value.replace(CONTROL_CHARS, "");
}

export function stripHtmlTags(value: string): string {
  return value.replace(HTML_TAGS, "");
}

export function clampLength(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value;
}

/** Texto plano seguro: remove controles/HTML, normaliza e corta tamanho. */
export function sanitizePlainText(value: string, max: number): string {
  return clampLength(stripHtmlTags(stripControlChars(value)).normalize("NFKC"), max);
}

export function sanitizeMultiline(value: string, max: number): string {
  return clampLength(
    stripHtmlTags(stripControlChars(value).replace(/\r\n/g, "\n")).normalize("NFKC"),
    max,
  );
}

export function looksLikeInjection(value: string): boolean {
  return SUSPICIOUS.test(value);
}

export function rejectUnsafeText(value: string, fieldLabel: string): string | undefined {
  if (looksLikeInjection(value)) {
    return `${fieldLabel}: remova scripts, HTML ou comandos nao permitidos.`;
  }
  return undefined;
}

/**
 * Texto util: tamanho minimo, tem letra e rejeita spam tipo "kkk" / "uu".
 * Use em nome, cargo, empresa, descricao curta, etc.
 */
export function isMeaningfulText(value: string, minLen: number): boolean {
  const text = value.trim();
  if (text.length < minLen) return false;
  if (!/[\p{L}]/u.test(text)) return false;
  const letters = text.replace(/[^\p{L}]/gu, "").toLocaleLowerCase("pt-BR");
  if (letters.length < Math.min(minLen, 2)) return false;
  const unique = new Set(letters);
  if (letters.length >= 2 && unique.size === 1) return false;
  if (letters.length >= 4 && unique.size / letters.length < 0.34) return false;
  return true;
}

/** Mensagem de erro se o texto for vazio, curto, spam ou inseguro. */
export function rejectWeakText(
  value: string,
  fieldLabel: string,
  minLen: number,
): string | undefined {
  const text = value.trim();
  if (!text) {
    return `Informe ${fieldLabel.toLowerCase()}.`;
  }
  if (!isMeaningfulText(text, minLen)) {
    return `${fieldLabel}: escreva um texto claro e com sentido (min. ${minLen} caracteres).`;
  }
  return rejectUnsafeText(text, fieldLabel);
}

export function isValidMonthValue(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function monthNotFuture(value: string): boolean {
  if (!isValidMonthValue(value)) return false;
  const now = new Date();
  const [year, month] = value.split("-").map(Number);
  return year * 12 + (month - 1) <= now.getFullYear() * 12 + now.getMonth();
}

export function monthRangeOk(start: string, end: string): boolean {
  return isValidMonthValue(start) && isValidMonthValue(end) && start <= end;
}

export function sanitizeEmail(value: string): string {
  return sanitizePlainText(value, INPUT_LIMITS.email).toLowerCase().replace(/\s+/g, "");
}
