const API_URL = "http://127.0.0.1:8080";

export interface Job {
  titulo: string;
  empresa: string;
  local: string;
  modalidade: string;
  link: string;
  fonte: string;
}

export interface CareerOpportunity {
  titulo: string;
  empresa: string;
  localidade?: string;
  modalidade: string;
  salario?: string;
  tipoContrato?: string;
  link: string;
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
  }>;
  oportunidadesDestaque: CareerOpportunity[];
  cursosRecomendados: Array<{
    plataforma: string;
    nome: string;
    preco: string;
  }>;
  metadata?: {
    cache?: boolean;
    fonteAnalise?: string;
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

export const jobService = {
  async getVagas(): Promise<Job[]> {
    try {
      const response = await fetch(`${API_URL}/vagas`);
      if (!response.ok) throw new Error("Falha ao buscar vagas");
      return await response.json();
    } catch (error) {
      console.error("Erro ao buscar vagas:", error);
      return [];
    }
  },

  async buscarVagas(filters: { cargo?: string; skills?: string; local?: string; modelo?: string }): Promise<Job[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filters.cargo) queryParams.append("cargo", filters.cargo);
      if (filters.skills) queryParams.append("skills", filters.skills);
      if (filters.local) queryParams.append("local", filters.local);
      if (filters.modelo) queryParams.append("modelo", filters.modelo);

      const response = await fetch(`${API_URL}/buscar?${queryParams.toString()}`);
      if (!response.ok) throw new Error("Falha na busca de vagas");
      return await response.json();
    } catch (error) {
      console.error("Erro na busca de vagas:", error);
      return [];
    }
  },

  async getCarreira(
    cargo: string,
    filters: { skills?: string; local?: string; modelo?: string; forceRefresh?: boolean } = {},
  ): Promise<CareerAnalysis | null> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append("cargo", cargo);
      if (filters.skills) queryParams.append("skills", filters.skills);
      if (filters.local) queryParams.append("local", filters.local);
      if (filters.modelo) queryParams.append("modelo", filters.modelo);
      if (filters.forceRefresh) queryParams.append("force_refresh", "true");

      const response = await fetch(`${API_URL}/carreira?${queryParams.toString()}`);
      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.detail || "Falha ao buscar análise de carreira");
      }
      return await response.json();
    } catch (error: any) {
      console.error("Erro ao buscar análise de carreira:", error);
      throw error;
    }
  }
};

export const profileService = {
  async getCourseSuggestions(profile: unknown): Promise<ProfileCourseSuggestion[]> {
    const response = await fetch(`${API_URL}/perfil/cursos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ profile }),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(payload?.detail || "Nao foi possivel gerar cursos com IA agora.");
    }

    return Array.isArray(payload?.cursos) ? payload.cursos : [];
  },
};
