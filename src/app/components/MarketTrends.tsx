import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

const jobGrowthData = [
  { month: "Jan", jobs: 1200 },
  { month: "Fev", jobs: 1350 },
  { month: "Mar", jobs: 1280 },
  { month: "Abr", jobs: 1480 },
  { month: "Mai", jobs: 1520 },
  { month: "Jun", jobs: 1680 },
];

const salaryData = [
  { role: "Júnior", salary: 5 },
  { role: "Pleno", salary: 9 },
  { role: "Sênior", salary: 15 },
  { role: "Líder", salary: 20 },
];

const industryData = [
  { sector: "Tecnologia", count: 456 },
  { sector: "Finanças", count: 312 },
  { sector: "Saúde", count: 267 },
  { sector: "Varejo", count: 198 },
  { sector: "Educação", count: 156 },
];

export function MarketTrends() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-mono border-b-4 border-neutral-900 inline-block pb-2 mb-4">
          TENDÊNCIAS DE MERCADO
        </h1>
        <p className="text-neutral-600">ANÁLISE E ESTATÍSTICAS DO MERCADO DE TRABALHO</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border-4 border-neutral-900 p-6">
          <p className="text-sm font-mono text-neutral-600 mb-2">SALÁRIO MÉDIO</p>
          <p className="text-2xl md:text-3xl font-mono">R$ 12K</p>
          <p className="text-xs text-neutral-600 mt-2">↑ 8% vs ano anterior</p>
        </div>
        <div className="bg-white border-4 border-neutral-400 p-6">
          <p className="text-sm font-mono text-neutral-600 mb-2">VAGAS ABERTAS</p>
          <p className="text-2xl md:text-3xl font-mono">8.234</p>
          <p className="text-xs text-neutral-600 mt-2">↑ 12% vs mês anterior</p>
        </div>
        <div className="bg-white border-4 border-neutral-400 p-6">
          <p className="text-sm font-mono text-neutral-600 mb-2">TEMPO MÉDIO</p>
          <p className="text-2xl md:text-3xl font-mono">28 dias</p>
          <p className="text-xs text-neutral-600 mt-2">↓ 5% vs mês anterior</p>
        </div>
        <div className="bg-white border-4 border-neutral-400 p-6">
          <p className="text-sm font-mono text-neutral-600 mb-2">VAGAS REMOTAS</p>
          <p className="text-2xl md:text-3xl font-mono">43%</p>
          <p className="text-xs text-neutral-600 mt-2">↑ 15% vs ano anterior</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border-4 border-neutral-900 p-6">
          <h2 className="font-mono text-xl mb-6 border-b-2 border-neutral-300 pb-2">
            TENDÊNCIA DE VAGAS (6 MESES)
          </h2>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={jobGrowthData}>
                <CartesianGrid stroke="#d4d4d4" strokeDasharray="5 5" />
                <XAxis dataKey="month" stroke="#737373" />
                <YAxis stroke="#737373" />
                <Line type="monotone" dataKey="jobs" stroke="#171717" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-neutral-600">
            <div className="w-8 h-1 bg-neutral-900"></div>
            <span>[Vagas publicadas ao longo do tempo]</span>
          </div>
        </div>

        <div className="bg-white border-4 border-neutral-900 p-6">
          <h2 className="font-mono text-xl mb-6 border-b-2 border-neutral-300 pb-2">
            SALÁRIO MÉDIO POR NÍVEL (K)
          </h2>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salaryData}>
                <CartesianGrid stroke="#d4d4d4" strokeDasharray="5 5" />
                <XAxis dataKey="role" stroke="#737373" />
                <YAxis stroke="#737373" />
                <Bar dataKey="salary" fill="#171717" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-neutral-600">
            <div className="w-8 h-8 md:w-8 md:h-8 bg-neutral-900"></div>
            <span>[Salário em milhares de reais]</span>
          </div>
        </div>
      </div>

      <div className="bg-white border-4 border-neutral-400 p-6 overflow-x-auto">
        <h2 className="font-mono text-xl mb-6 border-b-2 border-neutral-300 pb-2">
          VAGAS POR SETOR
        </h2>
        <div className="space-y-4 min-w-[500px]">
          {industryData.map((item) => (
            <div key={item.sector} className="flex items-center gap-4">
              <div className="w-32 text-sm font-mono">{item.sector}</div>
              <div className="flex-1 bg-neutral-200 border-2 border-neutral-400 h-10 md:h-12 relative">
                <div
                  className="bg-neutral-900 h-full flex items-center px-4 transition-all duration-500"
                  style={{ width: `${(item.count / 500) * 100}%` }}
                >
                  <span className="text-white font-mono text-sm">{item.count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border-4 border-neutral-400 p-6">
          <h3 className="font-mono text-lg mb-4 border-b-2 border-neutral-300 pb-2">
            EMPRESAS CONTRATANDO
          </h3>
          <ol className="space-y-2">
            <li className="border-2 border-neutral-300 p-2 text-sm">1. [Empresa A]</li>
            <li className="border-2 border-neutral-300 p-2 text-sm">2. [Empresa B]</li>
            <li className="border-2 border-neutral-300 p-2 text-sm">3. [Empresa C]</li>
          </ol>
        </div>

        <div className="bg-white border-4 border-neutral-400 p-6">
          <h3 className="font-mono text-lg mb-4 border-b-2 border-neutral-300 pb-2">
            LOCAIS EM ALTA
          </h3>
          <ol className="space-y-2">
            <li className="border-2 border-neutral-300 p-2 text-sm">1. São Paulo</li>
            <li className="border-2 border-neutral-300 p-2 text-sm">2. Rio de Janeiro</li>
            <li className="border-2 border-neutral-300 p-2 text-sm">3. Belo Horizonte</li>
          </ol>
        </div>

        <div className="bg-white border-4 border-neutral-400 p-6">
          <h3 className="font-mono text-lg mb-4 border-b-2 border-neutral-300 pb-2">
            SETORES EM CRESCIMENTO
          </h3>
          <ol className="space-y-2">
            <li className="border-2 border-neutral-300 p-2 text-sm">1. IA/ML</li>
            <li className="border-2 border-neutral-300 p-2 text-sm">2. Computação em Nuvem</li>
            <li className="border-2 border-neutral-300 p-2 text-sm">3. Cibersegurança</li>
          </ol>
        </div>
      </div>
    </div>
  );
}