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
  }
  return fallback;
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
        throw new Error(detailFromPayload(errData, "Erro na hora da busca. Tente novamente."));
      }
      return await response.json();
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error;
      }
      if (error instanceof Error && error.name === "AbortError") {
        throw error;
      }
      logAppError("analise de carreira indisponivel");
      throw new Error(toUserErrorMessage(error, "Erro na hora da busca. Tente novamente."));
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
};
