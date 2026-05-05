import { useState } from "react";
import { useNavigate } from "react-router";
import { jobService } from "../services/api";

const levelLabels: Record<string, string> = {
  entry: "júnior",
  mid: "pleno",
  senior: "sênior",
  lead: "liderança gerente",
};

const typeLabels: Record<string, string> = {
  fulltime: "Tempo Integral",
  parttime: "Meio Período",
  contract: "Contrato",
  remote: "Remoto",
};

export function JobSearch() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    keyword: "",
    location: "",
    level: "",
    type: "",
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const buildQueryParams = () => {
    const queryParams = new URLSearchParams();
    if (filters.keyword.trim()) queryParams.append("cargo", filters.keyword.trim());
    if (filters.location.trim()) queryParams.append("local", filters.location.trim());
    if (filters.level) queryParams.append("skills", levelLabels[filters.level] || filters.level);
    if (filters.type) queryParams.append("modelo", typeLabels[filters.type] || filters.type);
    return queryParams;
  };

  const analyzeCareer = async () => {
    const cargo = filters.keyword.trim();
    if (!cargo || isAnalyzing) {
      if (!cargo) setErrorMsg("Informe uma palavra-chave para gerar a análise com IA.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg("");
    setLoadingStep("Iniciando web scraping...");

    const interval = window.setInterval(() => {
      setLoadingStep((prev) => {
        if (prev === "Iniciando web scraping...") return "Coletando vagas reais...";
        if (prev === "Coletando vagas reais...") return "Enviando dados para a OpenAI...";
        if (prev === "Enviando dados para a OpenAI...") return "Montando página de carreira...";
        return prev;
      });
    }, 10000);

    try {
      const analysis = await jobService.getCarreira(cargo, {
        local: filters.location.trim(),
        skills: levelLabels[filters.level] || filters.level,
        modelo: typeLabels[filters.type] || filters.type,
      });

      if (!analysis) {
        throw new Error("A API não retornou a análise de carreira.");
      }

      const queryParams = buildQueryParams();
      navigate(`/carreira?${queryParams.toString()}`, { state: { analysis } });
    } catch (error: any) {
      setErrorMsg(error.message || "Erro ao coletar vagas ou comunicar com a OpenAI.");
    } finally {
      window.clearInterval(interval);
      setIsAnalyzing(false);
      setLoadingStep("");
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await analyzeCareer();
  };

  const goToResultsOnly = () => {
    const queryParams = buildQueryParams();
    navigate(`/results?${queryParams.toString()}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-mono border-b-4 border-neutral-900 inline-block pb-2 mb-8">
        BUSCA DE VAGAS
      </h1>

      <form onSubmit={handleSearch} className="space-y-6">
        <div className="bg-white border-4 border-neutral-900 p-8">
          <h2 className="font-mono text-xl mb-6 border-b-2 border-neutral-300 pb-2">
            CRITÉRIOS DE BUSCA
          </h2>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-mono mb-2 text-neutral-700">
                  PALAVRA-CHAVE
                </label>
                <input
                  type="text"
                  value={filters.keyword}
                  onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                  className="w-full border-2 border-neutral-400 px-4 py-3 focus:outline-none focus:border-neutral-900"
                  placeholder="ex: Engenheiro de Software"
                />
              </div>

              <div>
                <label className="block text-sm font-mono mb-2 text-neutral-700">
                  LOCALIZAÇÃO
                </label>
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  className="w-full border-2 border-neutral-400 px-4 py-3 focus:outline-none focus:border-neutral-900"
                  placeholder="ex: São Paulo, SP"
                />
              </div>

              <div>
                <label className="block text-sm font-mono mb-2 text-neutral-700">
                  NÍVEL
                </label>
                <select
                  value={filters.level}
                  onChange={(e) => setFilters({ ...filters, level: e.target.value })}
                  className="w-full border-2 border-neutral-400 px-4 py-3 focus:outline-none focus:border-neutral-900 bg-white"
                >
                  <option value="">Selecionar nível...</option>
                  <option value="entry">Nível Júnior</option>
                  <option value="mid">Nível Pleno</option>
                  <option value="senior">Nível Sênior</option>
                  <option value="lead">Líder / Gerente</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-mono mb-2 text-neutral-700">
                  TIPO
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="w-full border-2 border-neutral-400 px-4 py-3 focus:outline-none focus:border-neutral-900 bg-white"
                >
                  <option value="">Selecionar tipo...</option>
                  <option value="fulltime">Tempo Integral</option>
                  <option value="parttime">Meio Período</option>
                  <option value="contract">Contrato</option>
                  <option value="remote">Remoto</option>
                </select>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                disabled={isAnalyzing}
                className="flex-1 bg-neutral-900 text-white py-3 border-2 border-neutral-900 hover:bg-neutral-700 disabled:opacity-60 disabled:cursor-not-allowed font-mono w-full sm:w-auto"
              >
                {isAnalyzing ? "[ANALISANDO COM IA...]" : "[ANALISAR CARREIRA]"}
              </button>
              <button
                type="button"
                onClick={goToResultsOnly}
                disabled={isAnalyzing}
                className="px-8 py-3 border-2 border-neutral-400 hover:bg-neutral-200 disabled:opacity-60 disabled:cursor-not-allowed font-mono w-full sm:w-auto"
              >
                [BUSCAR SÓ VAGAS]
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilters({ keyword: "", location: "", level: "", type: "" });
                  setErrorMsg("");
                }}
                disabled={isAnalyzing}
                className="px-8 py-3 border-2 border-neutral-400 hover:bg-neutral-200 disabled:opacity-60 disabled:cursor-not-allowed font-mono w-full sm:w-auto"
              >
                [LIMPAR]
              </button>
            </div>
            {(loadingStep || errorMsg) && (
              <div className={`mt-4 border-2 p-3 font-mono text-sm ${errorMsg ? "border-red-500 text-red-700 bg-red-50" : "border-neutral-400 text-neutral-700 bg-neutral-50"}`}>
                {errorMsg || loadingStep}
              </div>
            )}
          </div>
        </div>
      </form>

      <div className="mt-8 bg-white border-4 border-neutral-400 p-6">
        <h2 className="font-mono text-lg mb-4 border-b-2 border-neutral-300 pb-2">
          FILTROS SALVOS
        </h2>
        <div className="space-y-2">
          <div className="border-2 border-neutral-300 p-3 text-neutral-700">[Filtro salvo 1]</div>
          <div className="border-2 border-neutral-300 p-3 text-neutral-700">[Filtro salvo 2]</div>
        </div>
      </div>
    </div>
  );
}
