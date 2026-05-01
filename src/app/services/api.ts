const API_URL = "http://localhost:8000";

export interface Job {
  titulo: string;
  empresa: string;
  local: string;
  modalidade: string;
  link: string;
  fonte: string;
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
  }
};
