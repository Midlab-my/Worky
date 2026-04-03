import { useState } from "react";
import { useNavigate } from "react-router";

export function JobSearch() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    keyword: "",
    location: "",
    level: "",
    type: "",
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/results");
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

          <div className="mt-8 flex gap-4">
            <button
              type="submit"
              className="flex-1 bg-neutral-900 text-white py-3 border-2 border-neutral-900 hover:bg-neutral-700 font-mono"
            >
              [BUSCAR VAGAS]
            </button>
            <button
              type="button"
              onClick={() => setFilters({ keyword: "", location: "", level: "", type: "" })}
              className="px-8 py-3 border-2 border-neutral-400 hover:bg-neutral-200 font-mono"
            >
              [LIMPAR]
            </button>
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