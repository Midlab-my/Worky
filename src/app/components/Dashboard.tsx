import { useState } from "react";
import { useNavigate } from "react-router";

export function Dashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/results");
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-mono border-b-4 border-neutral-900 inline-block pb-2 mb-4">
          PAINEL
        </h1>
        <p className="text-neutral-600">BARRA DE BUSCA PRINCIPAL</p>
      </div>

      <form onSubmit={handleSearch} className="max-w-3xl mx-auto mb-12">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 border-4 border-neutral-900 px-6 py-4 text-lg focus:outline-none focus:border-neutral-700 w-full"
            placeholder="Buscar vagas de emprego..."
          />
          <button
            type="submit"
            className="bg-neutral-900 text-white px-8 py-4 border-4 border-neutral-900 hover:bg-neutral-700 font-mono w-full sm:w-auto"
          >
            [BUSCAR]
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
        <button
          onClick={() => navigate("/search")}
          className="bg-white border-4 border-neutral-400 p-8 hover:border-neutral-900 w-full"
        >
          <div className="w-16 h-16 border-4 border-neutral-400 mx-auto mb-4"></div>
          <h3 className="font-mono text-lg mb-2">BUSCA AVANÇADA</h3>
          <p className="text-sm text-neutral-600">Filtrar por localização, nível, tipo</p>
        </button>

        <button
          onClick={() => navigate("/skills")}
          className="bg-white border-4 border-neutral-400 p-8 hover:border-neutral-900 w-full"
        >
          <div className="w-16 h-16 border-4 border-neutral-400 mx-auto mb-4"></div>
          <h3 className="font-mono text-lg mb-2">ANÁLISE DE HABILIDADES</h3>
          <p className="text-sm text-neutral-600">Ver habilidades mais demandadas</p>
        </button>

        <button
          onClick={() => navigate("/trends")}
          className="bg-white border-4 border-neutral-400 p-8 hover:border-neutral-900 w-full md:col-span-2 lg:col-span-1"
        >
          <div className="w-16 h-16 border-4 border-neutral-400 mx-auto mb-4"></div>
          <h3 className="font-mono text-lg mb-2">TENDÊNCIAS DE MERCADO</h3>
          <p className="text-sm text-neutral-600">Ver análise de mercado</p>
        </button>
      </div>

      <div className="mt-12 bg-white border-4 border-neutral-400 p-6">
        <h2 className="font-mono text-xl mb-4 border-b-2 border-neutral-300 pb-2">
          BUSCAS RECENTES
        </h2>
        <ul className="space-y-2">
          <li className="border-2 border-neutral-300 p-3 text-neutral-700">[Busca 1]</li>
          <li className="border-2 border-neutral-300 p-3 text-neutral-700">[Busca 2]</li>
          <li className="border-2 border-neutral-300 p-3 text-neutral-700">[Busca 3]</li>
        </ul>
      </div>
    </div>
  );
}