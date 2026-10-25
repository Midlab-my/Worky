import { logAppError, toUserErrorMessage } from "../lib/user-error";
import { getStoredSession, isSessionExpired, refreshSession, storeSession } from "./auth";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8080";

export type MercadoPagoAudience = "candidato" | "empresa";

export type MercadoPagoPreference = {
  preferenceId: string;
  checkoutUrl: string;
};

async function sessionHeaders(): Promise<Record<string, string>> {
  let session = getStoredSession();
  if (session && isSessionExpired(session)) {
    const refreshed = await refreshSession(session.refreshToken);
    session = refreshed.session;
    if (session) storeSession(session);
  }
  return session ? { Authorization: `Bearer ${session.accessToken}` } : {};
}

function detailFromPayload(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object" && "detail" in payload) {
    const detail = (payload as { detail?: unknown }).detail;
    if (typeof detail === "string" && detail.trim()) {
      return toUserErrorMessage(detail, fallback);
    }
  }
  return fallback;
}

/** Cria a preferencia no backend e devolve a URL oficial do Checkout Pro. */
export async function createMercadoPagoPreference(
  planId: string,
  audience: MercadoPagoAudience,
): Promise<MercadoPagoPreference> {
  const response = await fetch(`${API_URL}/pagamentos/preferencia`, {
    method: "POST",
    headers: {
      ...(await sessionHeaders()),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ planId, audience }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    logAppError("falha ao criar preferencia Mercado Pago");
    throw new Error(detailFromPayload(payload, "Não foi possível abrir o Mercado Pago agora."));
  }
  const preferenceId = payload?.preferenceId;
  const checkoutUrl = payload?.checkoutUrl;
  if (typeof preferenceId !== "string" || typeof checkoutUrl !== "string") {
    throw new Error("Resposta de pagamento incompleta.");
  }
  return { preferenceId, checkoutUrl };
}
