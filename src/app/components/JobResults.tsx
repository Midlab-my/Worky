import { Link } from "react-router";

const mockJobs = [
  {
    id: "1",
    title: "Engenheiro de Software Sênior",
    company: "Tech Corp Inc",
    location: "São Paulo, SP",
    type: "Tempo Integral",
  },
  {
    id: "2",
    title: "Desenvolvedor Frontend",
    company: "Design Studio LLC",
    location: "Rio de Janeiro, RJ",
    type: "Remoto",
  },
  {
    id: "3",
    title: "Engenheiro Backend",
    company: "Data Systems Co",
    location: "Belo Horizonte, MG",
    type: "Tempo Integral",
  },
  {
    id: "4",
    title: "Desenvolvedor Full Stack",
    company: "Innovation Labs",
    location: "Curitiba, PR",
    type: "Contrato",
  },
  {
    id: "5",
    title: "Engenheiro DevOps",
    company: "Cloud Solutions Inc",
    location: "Porto Alegre, RS",
    type: "Tempo Integral",
  },
  {
    id: "6",
    title: "Gerente de Produto",
    company: "Startup Ventures",
    location: "Florianópolis, SC",
    type: "Tempo Integral",
  },
];

export function JobResults() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-mono border-b-4 border-neutral-900 inline-block pb-2 mb-4">
          RESULTADOS DA BUSCA
        </h1>
        <p className="text-neutral-600 font-mono">{mockJobs.length} VAGAS ENCONTRADAS</p>
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
          <div className="space-y-4">
            {mockJobs.map((job) => (
              <Link
                key={job.id}
                to={`/job/${job.id}`}
                className="block bg-white border-4 border-neutral-400 p-6 hover:border-neutral-900"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-2">
                  <div>
                    <h3 className="text-xl font-mono mb-2">{job.title}</h3>
                    <p className="text-neutral-600">{job.company}</p>
                  </div>
                  <div className="border-2 border-neutral-400 px-4 py-1 text-sm bg-neutral-50">
                    {job.type}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-neutral-600">
                  <span className="border-2 border-neutral-300 px-3 py-1">
                    📍 {job.location}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <button className="border-2 border-neutral-400 px-4 py-2 hover:bg-neutral-200">
              [1]
            </button>
            <button className="border-2 border-neutral-900 bg-neutral-900 text-white px-4 py-2">
              [2]
            </button>
            <button className="border-2 border-neutral-400 px-4 py-2 hover:bg-neutral-200">
              [3]
            </button>
            <button className="border-2 border-neutral-400 px-4 py-2 hover:bg-neutral-200">
              [Próxima]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}