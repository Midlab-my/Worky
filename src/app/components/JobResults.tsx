import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { jobService, Job } from "../services/api";

export function JobResults() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const location = useLocation();

  const getFiltersFromSearch = () => {
    const searchParams = new URLSearchParams(location.search);
    return {
      cargo: searchParams.get("cargo") || "",
      local: searchParams.get("local") || "",
      skills: searchParams.get("skills") || "",
      modelo: searchParams.get("modelo") || "",
    };
  };

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      const filters = getFiltersFromSearch();

      let results: Job[] = [];
      if (Object.values(filters).some(v => v !== "")) {
        results = await jobService.buscarVagas(filters);
      } else {
        results = await jobService.getVagas();
      }
      
      setJobs(results);
      setLoading(false);
    };

    fetchJobs();
  }, [location.search]);

  const gerarAnalise = async () => {
    const filters = getFiltersFromSearch();
    const cargo = filters.cargo.trim();

    if (!cargo || analysisLoading) {
      if (!cargo) setAnalysisError("Informe um cargo para gerar a análise com IA.");
      return;
    }

    setAnalysisLoading(true);
    setAnalysisError("");

    try {
      const analysis = await jobService.getCarreira(cargo, {
        local: filters.local,
        skills: filters.skills,
        modelo: filters.modelo,
      });

      if (!analysis) {
        throw new Error("A API não retornou a análise de carreira.");
      }

      navigate(`/carreira${location.search}`, { state: { analysis } });
    } catch (error: any) {
      setAnalysisError(error.message || "Erro ao comunicar com a OpenAI.");
    } finally {
      setAnalysisLoading(false);
    }
  };

  const currentCargo = getFiltersFromSearch().cargo;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-mono border-b-4 border-neutral-900 inline-block pb-2 mb-4">
          RESULTADOS DA BUSCA
        </h1>
        <p className="text-neutral-600 font-mono">
          {loading ? "BUSCANDO VAGAS..." : `${jobs.length} VAGAS ENCONTRADAS`}
        </p>
        {currentCargo && (
          <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center">
            <button
              type="button"
              onClick={gerarAnalise}
              disabled={analysisLoading}
              className="border-2 border-neutral-900 bg-neutral-900 text-white px-5 py-2 font-mono hover:bg-neutral-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {analysisLoading ? "[ENVIANDO PARA OPENAI...]" : "[GERAR ANÁLISE COM IA]"}
            </button>
            {analysisError && <span className="text-sm font-mono text-red-700">{analysisError}</span>}
          </div>
        )}
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-white border-4 border-neutral-400 p-6 lg:sticky lg:top-6 mb-6 lg:mb-0">
            <h2 className="font-mono text-lg mb-4 border-b-2 border-neutral-300 pb-2">
              FILTROS
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-mono mb-2">LOCALIZAÇÃO</p>
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-1">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="border-2 border-neutral-400" />
                    <span>São Paulo</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="border-2 border-neutral-400" />
                    <span>Rio de Janeiro</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="border-2 border-neutral-400" />
                    <span>Remoto</span>
                  </label>
                </div>
              </div>

              <div className="border-t-2 border-neutral-300 pt-4">
                <p className="text-sm font-mono mb-2">TIPO DE VAGA</p>
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-1">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="border-2 border-neutral-400" />
                    <span>Tempo Integral</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="border-2 border-neutral-400" />
                    <span>Contrato</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="border-2 border-neutral-400" />
                    <span>Meio Período</span>
                  </label>
                </div>
              </div>

              <div className="border-t-2 border-neutral-300 pt-4">
                <p className="text-sm font-mono mb-2">NÍVEL</p>
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-1">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="border-2 border-neutral-400" />
                    <span>Júnior</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="border-2 border-neutral-400" />
                    <span>Pleno</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="border-2 border-neutral-400" />
                    <span>Sênior</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-9">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white border-4 border-dashed border-neutral-400">
              <div className="animate-spin h-12 w-12 border-4 border-neutral-900 border-t-transparent rounded-full mb-4"></div>
              <p className="font-mono text-xl animate-pulse">ESCAVANDO A WEB EM BUSCA DE VAGAS...</p>
              <p className="text-neutral-500 mt-2 text-sm">Isso pode levar até 30 segundos</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.length > 0 ? (
                jobs.map((job, index) => (
                  <a
                    key={index}
                    href={job.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-white border-4 border-neutral-400 p-6 hover:border-neutral-900 transition-all hover:translate-x-1 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-2">
                      <div>
                        <h3 className="text-xl font-mono mb-2 uppercase">{job.titulo}</h3>
                        <p className="text-neutral-600 font-bold">{job.empresa}</p>
                      </div>
                      <div className="border-2 border-neutral-900 px-4 py-1 text-xs font-mono bg-neutral-900 text-white">
                        {job.fonte.toUpperCase()}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <span className="border-2 border-neutral-300 px-3 py-1 bg-neutral-50">
                        📍 {job.local}
                      </span>
                      <span className="border-2 border-neutral-300 px-3 py-1 bg-neutral-50 font-mono">
                        ⚙️ {job.modalidade}
                      </span>
                    </div>
                  </a>
                ))
              ) : (
                <div className="bg-white border-4 border-neutral-400 p-12 text-center">
                  <p className="font-mono text-xl mb-4">NENHUMA VAGA ENCONTRADA</p>
                  <p className="text-neutral-600">Tente ajustar seus critérios de busca.</p>
                  <Link to="/search" className="mt-6 inline-block border-2 border-neutral-900 px-6 py-2 hover:bg-neutral-900 hover:text-white transition-colors">
                    VOLTAR PARA BUSCA
                  </Link>
                </div>
              )}
            </div>
          )}

          {!loading && jobs.length > 0 && (
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              <button className="border-2 border-neutral-400 px-4 py-2 hover:bg-neutral-200 font-mono">
                [ANTERIOR]
              </button>
              <button className="border-2 border-neutral-900 bg-neutral-900 text-white px-4 py-2 font-mono">
                [PÁGINA 1]
              </button>
              <button className="border-2 border-neutral-400 px-4 py-2 hover:bg-neutral-200 font-mono">
                [PRÓXIMA]
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
