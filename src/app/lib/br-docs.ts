/** Helpers BR: digitos, mascara e validacao de CNPJ/CEP/URL. */

export function onlyDigits(value: string, max?: number): string {
  const digits = value.replace(/\D/g, "");
  return typeof max === "number" ? digits.slice(0, max) : digits;
}

export function formatCnpj(value: string): string {
  const digits = onlyDigits(value, 14);
  const parts = [
    digits.slice(0, 2),
    digits.slice(2, 5),
    digits.slice(5, 8),
    digits.slice(8, 12),
    digits.slice(12, 14),
  ].filter(Boolean);

  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${parts[0]}.${parts[1]}`;
  if (digits.length <= 8) return `${parts[0]}.${parts[1]}.${parts[2]}`;
  if (digits.length <= 12) return `${parts[0]}.${parts[1]}.${parts[2]}/${parts[3]}`;
  return `${parts[0]}.${parts[1]}.${parts[2]}/${parts[3]}-${parts[4]}`;
}

export function isValidCnpj(value: string): boolean {
  const digits = onlyDigits(value, 14);
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const calcCheck = (base: string, factors: number[]) => {
    const sum = factors.reduce((acc, factor, index) => acc + Number(base[index]) * factor, 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const first = calcCheck(digits, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (first !== Number(digits[12])) return false;

  const second = calcCheck(digits, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return second === Number(digits[13]);
}

export function cnpjErrorMessage(value: string): string | undefined {
  const digits = onlyDigits(value);
  if (!digits) return "Informe o CNPJ.";
  if (digits.length < 14) return "CNPJ incompleto. Use 14 digitos.";
  if (!isValidCnpj(digits)) return "CNPJ invalido. Confira os digitos.";
  return undefined;
}

export function formatCep(value: string): string {
  const digits = onlyDigits(value, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function isValidCepFormat(value: string): boolean {
  return onlyDigits(value, 8).length === 8;
}

export function cepErrorMessage(value: string): string | undefined {
  const digits = onlyDigits(value);
  if (!digits) return "Informe o CEP.";
  if (digits.length < 8) return "CEP incompleto. Use 8 digitos.";
  return undefined;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function emailErrorMessage(email: string): string | undefined {
  const trimmed = email.trim();
  if (!trimmed) return "Informe seu e-mail.";
  if (!isValidEmail(trimmed)) return "Digite um e-mail valido.";
  return undefined;
}

export function isValidLinkedInUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    return host === "linkedin.com" || host.endsWith(".linkedin.com");
  } catch {
    return false;
  }
}

export function linkedInErrorMessage(value: string): string | undefined {
  if (!value.trim()) return undefined;
  if (!isValidLinkedInUrl(value)) {
    return "Informe uma URL valida do LinkedIn (ex: https://linkedin.com/company/...).";
  }
  return undefined;
}

export function requiredTrimmed(value: string, message: string): string | undefined {
  return value.trim() ? undefined : message;
}
