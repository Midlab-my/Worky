import { logAppError, toUserErrorMessage } from "../lib/user-error";
import { getStoredSession, isSessionExpired, refreshSession, storeSession } from "./auth";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8080";

async function sessionHeaders(): Promise<Record<string, string>> {
  let session = getStoredSession();
  if (session && isSessionExpired(session)) {
    const refreshed = await refreshSession(session.refreshToken);
    session = refreshed.session;
    if (session) storeSession(session);
  }
  return session ? { Authorization: `Bearer ${session.accessToken}` } : {};
}

export interface Job {
  titulo: string;
  empresa: string;
  local: string;
  modalidade: string;
  link: string;
  fonte: string;
  destaqueWorky?: boolean;
  tag?: string;
}

export interface CareerOpportunity {
  id?: string;
  titulo: string;
  empresa: string;
  localidade?: string;
  modalidade: string;
  salario?: string;
  tipoContrato?: string;
  link: string;
  fonte?: string;
  tag?: string;
  destaqueWorky?: boolean;
  descricao?: string;
  requisitos?: string;
}

export interface CareerAnalysis {
  carreira: string;
  insightIA: string;
  mediaSalarial: string;
  moeda: string;
  vagasAbertas: number;
  crescimentoMensal: string;
  nivelDemanda: "Baixa" | "Média" | "Alta" | string;
  rankingMercado: string;
  crescimentoAnual: string;
  competenciasDesejadas: {
    habilidadesTecnicas: string[];
    softSkills: string[];
  };
  certificacoesRecomendadas: Array<{
    empresa: string;
    nome: string;
    descricao: string;
    url?: string;
  }>;
  oportunidadesDestaque: CareerOpportunity[];
  todasVagas?: CareerOpportunity[];
  cursosRecomendados: Array<{
    plataforma: string;
    nome: string;
    preco: string;
    url?: string;
    area?: string;
    motivo?: string;
    tag?: string;
    destaqueWorky?: boolean;
  }>;
  metadata?: {
    cache?: boolean;
    fonteAnalise?: string;
    fonteBusca?: string;
    vagasColetadas?: number;
    geradoEm?: string;
    schemaVersion?: number;
  };
}

export interface ProfileCourseSuggestion {
  titulo: string;
  plataforma: string;
  url: string;
  area: string;
  motivo: string;
}

function detailFromPayload(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object" && "detail" in payload) {
    const detail = (payload as { detail?: unknown }).detail;
    if (typeof detail === "string" && detail.trim()) {
      return toUserErrorMessage(detail, fallback);
    }
    if (detail && typeof detail === "object" && "message" in detail) {
      const message = (detail as { message?: unknown }).message;
      if (typeof message === "string" && message.trim()) {
        return toUserErrorMessage(message, fallback);
      }
    }
  }
  return fallback;
}

function quotaFromPayload(payload: unknown): SearchQuota | null {
  if (!payload || typeof payload !== "object") return null;
  const detail = "detail" in payload ? (payload as { detail?: unknown }).detail : payload;
  if (!detail || typeof detail !== "object") return null;
  const row = detail as Record<string, unknown>;
  const used = Number(row.used);
  const limit = Number(row.limit);
  if (!Number.isFinite(used) || !Number.isFinite(limit) || limit <= 0) return null;
  const remainingRaw = row.remaining;
  const remaining = Number.isFinite(Number(remainingRaw))
    ? Math.max(0, Number(remainingRaw))
    : Math.max(0, limit - used);
  const resetsAt = typeof row.resetsAt === "string"
    ? row.resetsAt
    : typeof row.resets_at === "string"
      ? row.resets_at
      : "";
  return { used, limit, remaining, resetsAt };
}

export type CareerSearchBlockReason = "login" | "rate" | "invalid" | "generic";

export type SearchQuota = {
  used: number;
  limit: number;
  remaining: number;
  resetsAt: string;
};

/** Bloqueio de busca com motivo tipado (modal na home). */
export class CareerSearchBlockedError extends Error {
  reason: CareerSearchBlockReason;
  quota: SearchQuota | null;

  constructor(reason: CareerSearchBlockReason, message: string, quota: SearchQuota | null = null) {
    super(message);
    this.name = "CareerSearchBlockedError";
    this.reason = reason;
    this.quota = quota;
  }
}

export const jobService = {
  async getVagas(): Promise<Job[]> {
    try {
      const response = await fetch(`${API_URL}/vagas`);
      if (!response.ok) throw new Error("Nao foi possivel carregar as vagas agora.");
      return await response.json();
    } catch {
      logAppError("busca de vagas indisponivel");
      return [];
    }
  },

  async buscarVagas(filters: {
    cargo?: string;
    skills?: string;
    local?: string;
    modelo?: string;
    fonte?: "google" | "scrape" | "all";
  }): Promise<Job[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filters.cargo) queryParams.append("cargo", filters.cargo);
      if (filters.skills) queryParams.append("skills", filters.skills);
      if (filters.local) queryParams.append("local", filters.local);
      if (filters.modelo) queryParams.append("modelo", filters.modelo);
      if (filters.fonte) queryParams.append("fonte", filters.fonte);

      const response = await fetch(`${API_URL}/buscar?${queryParams.toString()}`);
      if (!response.ok) throw new Error("Erro na hora da busca. Tente novamente.");
      return await response.json();
    } catch {
      logAppError("busca filtrada indisponivel");
      return [];
    }
  },

  async getCarreira(
    cargo: string,
    filters: {
      skills?: string;
      local?: string;
      modelo?: string;
      forceRefresh?: boolean;
      fonte?: "google" | "scrape" | "all";
    } = {},
    options: { signal?: AbortSignal } = {},
  ): Promise<CareerAnalysis | null> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append("cargo", cargo);
      if (filters.skills) queryParams.append("skills", filters.skills);
      if (filters.local) queryParams.append("local", filters.local);
      if (filters.modelo) queryParams.append("modelo", filters.modelo);
      if (filters.forceRefresh) queryParams.append("force_refresh", "true");
      if (filters.fonte) queryParams.append("fonte", filters.fonte);

      const response = await fetch(`${API_URL}/carreira?${queryParams.toString()}`, {
        headers: await sessionHeaders(),
        signal: options.signal,
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        if (response.status === 401) {
          throw new CareerSearchBlockedError(
            "login",
            "Para analisar um cargo novo, entre na sua conta Worky. Assim a gente libera a busca com IA e salva seu histórico.",
          );
        }
        if (response.status === 429) {
          const quota = quotaFromPayload(errData);
          const isMonthly = Boolean(
            errData
            && typeof errData === "object"
            && "detail" in errData
            && errData.detail
            && typeof errData.detail === "object"
            && (errData.detail as { code?: unknown }).code === "search_quota",
          );
          throw new CareerSearchBlockedError(
            "rate",
            isMonthly
              ? detailFromPayload(
                errData,
                "Você usou as 5 buscas novas deste mês. O limite renova no próximo mês.",
              )
              : "Você atingiu o limite de buscas por enquanto. Aguarde alguns minutos (ou até o próximo ciclo do dia) e tente de novo.",
            quota,
          );
        }
        if (response.status === 422) {
          throw new CareerSearchBlockedError(
            "invalid",
            detailFromPayload(
              errData,
              "Use um cargo ou área profissional, sem dados pessoais.",
            ),
          );
        }
        throw new CareerSearchBlockedError(
          "generic",
          detailFromPayload(errData, "Tente de novo daqui a pouco."),
        );
      }
      return await response.json();
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error;
      }
      if (error instanceof Error && error.name === "AbortError") {
        throw error;
      }
      if (error instanceof CareerSearchBlockedError) {
        throw error;
      }
      logAppError("analise de carreira indisponivel");
      throw new CareerSearchBlockedError(
        "generic",
        toUserErrorMessage(error, "Tente de novo daqui a pouco."),
      );
    }
  },

  async getSearchQuota(options: { signal?: AbortSignal } = {}): Promise<SearchQuota | null> {
    try {
      const response = await fetch(`${API_URL}/carreira/quota`, {
        headers: await sessionHeaders(),
        signal: options.signal,
      });
      if (!response.ok) return null;
      const data = await response.json();
      return quotaFromPayload(data);
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") throw error;
      if (error instanceof Error && error.name === "AbortError") throw error;
      logAppError("cota de busca indisponivel");
      return null;
    }
  },
};

export interface ProfileMatchResult {
  pct: number;
  matched: string[];
  gaps: string[];
  explanation: string;
}

export const profileService = {
  async getCourseSuggestions(profile: unknown): Promise<ProfileCourseSuggestion[]> {
    try {
      const response = await fetch(`${API_URL}/perfil/cursos`, {
        method: "POST",
        headers: {
          ...await sessionHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ profile }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(detailFromPayload(payload, "Nao foi possivel sugerir cursos agora."));
      }

      return Array.isArray(payload?.cursos) ? payload.cursos : [];
    } catch (error: unknown) {
      logAppError("sugestao de cursos indisponivel");
      throw new Error(toUserErrorMessage(error, "Nao foi possivel sugerir cursos agora."));
    }
  },

  async calculateMatch(profile: unknown, careerName: string): Promise<ProfileMatchResult> {
    try {
      const response = await fetch(`${API_URL}/carreira/match`, {
        method: "POST",
        headers: {
          ...await sessionHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ profile, carreira: careerName }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(detailFromPayload(payload, "Nao foi possivel calcular o match agora."));
      }

      return payload?.match;
    } catch (error: unknown) {
      logAppError("calculo de match indisponivel");
      throw new Error(toUserErrorMessage(error, "Nao foi possivel calcular o match agora."));
    }
  },

  async deleteOwnAccount(): Promise<void> {
    const response = await fetch(`${API_URL}/conta`, {
      method: "DELETE",
      headers: await sessionHeaders(),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(detailFromPayload(payload, "Nao foi possivel excluir a conta agora. Tente novamente."));
    }
  },
};
