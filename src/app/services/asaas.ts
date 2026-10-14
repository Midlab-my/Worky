/**
 * Integracao Asaas (prototipo).
 * Monta o payload como se fosse a API de assinaturas, mas nao chama a rede.
 * Em producao: trocar por POST /v3/subscriptions com a API key do Asaas.
 */

import {
  INPUT_LIMITS,
  rejectWeakText,
  sanitizeEmail,
  sanitizePlainText,
} from "../lib/input-security";

export type AsaasAudience = "candidato" | "empresa";

export type AsaasCheckoutPlan = {
  id: string;
  name: string;
  priceLabel: string;
  amountCents: number;
  audience: AsaasAudience;
};

export type AsaasCheckoutPayload = {
  plan: AsaasCheckoutPlan;
  customer: {
    name: string;
    email: string;
    cpfCnpj: string;
  };
  card: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
  };
};

export type AsaasCheckoutResult = {
  subscriptionId: string;
  status: "ACTIVE" | "PENDING";
};

const PROTOTYPE_ERROR =
  "Prototipo Worky: a cobranca Asaas ainda nao esta vinculada. " +
  "O formulario e o fluxo de assinatura estao prontos; a API key / sandbox sera conectada depois.";

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function validateAsaasCheckout(payload: AsaasCheckoutPayload): string | null {
  const { customer, card, plan } = payload;

  const name = sanitizePlainText(customer.name, INPUT_LIMITS.name);
  const email = sanitizeEmail(customer.email);
  const holderName = sanitizePlainText(card.holderName, INPUT_LIMITS.name);

  const nameError = rejectWeakText(name, "Nome do pagador", 3);
  if (nameError) return nameError;
  if (!email || !email.includes("@")) return "Informe um e-mail valido.";
  const holderError = rejectWeakText(holderName, "Nome do cartao", 3);
  if (holderError) return holderError;

  const doc = digitsOnly(customer.cpfCnpj).slice(0, 14);
  if (doc.length !== 11 && doc.length !== 14) {
    return "Informe um CPF (11 digitos) ou CNPJ (14 digitos) valido.";
  }

  if (!holderName) return "Informe o nome impresso no cartao.";
  if (digitsOnly(card.number).length < 13) return "Numero do cartao incompleto.";
  if (!/^\d{2}$/.test(card.expiryMonth) || Number(card.expiryMonth) < 1 || Number(card.expiryMonth) > 12) {
    return "Mes de validade invalido (MM).";
  }
  if (!/^\d{2,4}$/.test(card.expiryYear)) return "Ano de validade invalido.";
  if (digitsOnly(card.cvv).length < 3) return "CVV invalido.";
  if (plan.amountCents <= 0) return "Plano gratuito nao precisa de cobranca Asaas.";

  return null;
}

/** Simula delay de rede e sempre falha: cobranca real desligada no prototipo. */
export async function createAsaasSubscription(
  payload: AsaasCheckoutPayload,
): Promise<AsaasCheckoutResult> {
  const validationError = validateAsaasCheckout(payload);
  if (validationError) {
    throw new Error(validationError);
  }

  await new Promise((resolve) => setTimeout(resolve, 900));

  // Payload montado so para documentar o contrato futuro com a Asaas.
  void {
    billingType: "CREDIT_CARD",
    cycle: "MONTHLY",
    value: payload.plan.amountCents / 100,
    description: `Worky ${payload.plan.name} (${payload.plan.audience})`,
    customer: {
      name: payload.customer.name.trim(),
      email: payload.customer.email.trim().toLowerCase(),
      cpfCnpj: digitsOnly(payload.customer.cpfCnpj),
    },
    creditCard: {
      holderName: payload.card.holderName.trim(),
      number: digitsOnly(payload.card.number),
      expiryMonth: payload.card.expiryMonth,
      expiryYear: payload.card.expiryYear,
      ccv: digitsOnly(payload.card.cvv),
    },
  };

  throw new Error(PROTOTYPE_ERROR);
}

export function planAmountCentsFromLabel(priceLabel: string): number {
  const match = priceLabel.replace(/\s/g, "").match(/R\$\s*([\d.,]+)/i) || priceLabel.match(/([\d.,]+)/);
  if (!match) return 0;
  const normalized = match[1].replace(/\./g, "").replace(",", ".");
  const value = Number(normalized);
  if (Number.isNaN(value)) return 0;
  return Math.round(value * 100);
}
