import { useParams, Link } from "react-router";

export function JobDetail() {
  const { id } = useParams();

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <Link
        to="/results"
        className="inline-block mb-6 text-neutral-600 hover:text-neutral-900 font-mono"
      >
        ← [VOLTAR PARA RESULTADOS]
      </Link>

      <div className="bg-white border-4 border-neutral-900 p-8 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-mono mb-2 border-b-2 border-neutral-300 pb-2">
              Engenheiro de Software Sênior
            </h1>
            <p className="text-xl text-neutral-600 mb-4">Tech Corp Inc</p>
            <div className="flex gap-4 text-sm">
              <span className="border-2 border-neutral-400 px-3 py-1">
                📍 São Paulo, SP
              </span>
              <span className="border-2 border-neutral-400 px-3 py-1">Tempo Integral</span>
              <span className="border-2 border-neutral-400 px-3 py-1">Publicado há 3 dias</span>
            </div>
          </div>
          <Link
            to={`/report/${id}`}
            className="border-2 border-neutral-900 px-6 py-2 hover:bg-neutral-200 font-mono"
          >
            [REPORTAR VAGA]
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border-4 border-neutral-400 p-6">
            <h2 className="font-mono text-xl mb-4 border-b-2 border-neutral-300 pb-2">
              DESCRIÇÃO DA VAGA
            </h2>
            <div className="space-y-4 text-neutral-700">
              <p className="border-l-4 border-neutral-300 pl-4 text-sm md:text-base">
                [Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
                tempor incididunt ut labore et dolore magna aliqua.]
              </p>
              <p className="border-l-4 border-neutral-300 pl-4 text-sm md:text-base">
                [Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                aliquip ex ea commodo consequat.]
              </p>
              <p className="border-l-4 border-neutral-300 pl-4 text-sm md:text-base">
                [Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore
                eu fugiat nulla pariatur.]
              </p>
            </div>
          </div>

          <div className="bg-white border-4 border-neutral-400 p-6">
            <h2 className="font-mono text-xl mb-4 border-b-2 border-neutral-300 pb-2">
              RESPONSABILIDADES
            </h2>
            <ul className="space-y-2 text-neutral-700">
              <li className="border-2 border-neutral-300 p-3 text-sm md:text-base">
                □ [Item de responsabilidade 1]
              </li>
              <li className="border-2 border-neutral-300 p-3 text-sm md:text-base">
                □ [Item de responsabilidade 2]
              </li>
              <li className="border-2 border-neutral-300 p-3 text-sm md:text-base">
                □ [Item de responsabilidade 3]
              </li>
              <li className="border-2 border-neutral-300 p-3 text-sm md:text-base">
                □ [Item de responsabilidade 4]
              </li>
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border-4 border-neutral-400 p-6">
            <h2 className="font-mono text-lg mb-4 border-b-2 border-neutral-300 pb-2">
              HABILIDADES REQUERIDAS
            </h2>
            <div className="flex flex-wrap lg:flex-col gap-2">
              <div className="border-2 border-neutral-900 bg-neutral-900 text-white px-3 py-2 text-xs md:text-sm">
                JavaScript
              </div>
              <div className="border-2 border-neutral-900 bg-neutral-900 text-white px-3 py-2 text-xs md:text-sm">
                React
              </div>
              <div className="border-2 border-neutral-900 bg-neutral-900 text-white px-3 py-2 text-xs md:text-sm">
                Node.js
              </div>
              <div className="border-2 border-neutral-400 px-3 py-2 text-xs md:text-sm">TypeScript</div>
              <div className="border-2 border-neutral-400 px-3 py-2 text-xs md:text-sm">Python</div>
              <div className="border-2 border-neutral-400 px-3 py-2 text-xs md:text-sm">Docker</div>
              <div className="border-2 border-neutral-400 px-3 py-2 text-xs md:text-sm">AWS</div>
            </div>
          </div>

          <div className="bg-white border-4 border-neutral-900 p-6">
            <h2 className="font-mono text-lg mb-4 border-b-2 border-neutral-300 pb-2">
              ESTIMATIVA SALARIAL
            </h2>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-mono mb-2 border-4 border-neutral-900 py-4">
                R$ 10K - R$ 18K
              </div>
              <p className="text-sm text-neutral-600 mt-2">por mês</p>
            </div>
            <div className="mt-4 border-t-2 border-neutral-300 pt-4">
              <p className="text-xs text-neutral-600">
                [Baseado em dados de mercado e posições similares]
              </p>
            </div>
          </div>

          <button className="w-full bg-neutral-900 text-white py-4 border-2 border-neutral-900 hover:bg-neutral-700 font-mono">
            [CANDIDATAR-SE]
          </button>

          <button className="w-full border-2 border-neutral-400 py-4 hover:bg-neutral-200 font-mono">
            [SALVAR VAGA]
          </button>
        </div>
      </div>
    </div>
  );
}