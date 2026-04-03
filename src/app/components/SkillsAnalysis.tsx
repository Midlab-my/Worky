const mockSkills = [
  { name: "JavaScript", count: 1247, percentage: 85 },
  { name: "React", count: 1089, percentage: 74 },
  { name: "Python", count: 987, percentage: 67 },
  { name: "Node.js", count: 876, percentage: 60 },
  { name: "TypeScript", count: 765, percentage: 52 },
  { name: "AWS", count: 698, percentage: 48 },
  { name: "Docker", count: 654, percentage: 45 },
  { name: "SQL", count: 612, percentage: 42 },
  { name: "Git", count: 589, percentage: 40 },
  { name: "Design de API", count: 534, percentage: 36 },
];

export function SkillsAnalysis() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-mono border-b-4 border-neutral-900 inline-block pb-2 mb-4">
          ANÁLISE DE HABILIDADES
        </h1>
        <p className="text-neutral-600">HABILIDADES MAIS DEMANDADAS NO MERCADO DE TRABALHO</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border-4 border-neutral-900 p-6 text-center">
          <p className="text-sm font-mono text-neutral-600 mb-2">TOTAL DE HABILIDADES</p>
          <p className="text-3xl md:text-4xl font-mono">247</p>
        </div>
        <div className="bg-white border-4 border-neutral-400 p-6 text-center">
          <p className="text-sm font-mono text-neutral-600 mb-2">VAGAS ANALISADAS</p>
          <p className="text-3xl md:text-4xl font-mono">1.463</p>
        </div>
        <div className="bg-white border-4 border-neutral-400 p-6 text-center md:col-span-2 lg:col-span-1">
          <p className="text-sm font-mono text-neutral-600 mb-2">ÚLTIMA ATUALIZAÇÃO</p>
          <p className="text-2xl md:text-4xl font-mono">3 ABR, 2026</p>
        </div>
      </div>

      <div className="bg-white border-4 border-neutral-900 p-4 sm:p-8">
        <h2 className="font-mono text-xl mb-6 border-b-2 border-neutral-300 pb-2">
          TOP 10 HABILIDADES POR DEMANDA
        </h2>

        <div className="space-y-4">
          {mockSkills.map((skill, index) => (
            <div key={skill.name} className="border-2 border-neutral-400 p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-xl md:text-2xl font-mono text-neutral-400">
                    #{index + 1}
                  </span>
                  <span className="text-lg md:text-xl font-mono">{skill.name}</span>
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto">
                  <p className="font-mono text-lg">{skill.count} <span className="text-sm text-neutral-600 font-sans">vagas</span></p>
                </div>
              </div>
              <div className="relative">
                <div className="w-full bg-neutral-200 border-2 border-neutral-400 h-6 md:h-8">
                  <div
                    className="bg-neutral-900 h-full flex items-center justify-end pr-2 transition-all duration-500"
                    style={{ width: `${skill.percentage}%` }}
                  >
                    <span className="text-white text-xs md:text-sm font-mono">{skill.percentage}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border-4 border-neutral-400 p-6">
          <h2 className="font-mono text-lg mb-4 border-b-2 border-neutral-300 pb-2">
            EM ALTA
          </h2>
          <ul className="space-y-2">
            <li className="border-2 border-neutral-300 p-3 flex justify-between">
              <span>Rust</span>
              <span className="font-mono">↑ 23%</span>
            </li>
            <li className="border-2 border-neutral-300 p-3 flex justify-between">
              <span>Go</span>
              <span className="font-mono">↑ 19%</span>
            </li>
            <li className="border-2 border-neutral-300 p-3 flex justify-between">
              <span>Kubernetes</span>
              <span className="font-mono">↑ 15%</span>
            </li>
          </ul>
        </div>

        <div className="bg-white border-4 border-neutral-400 p-6">
          <h2 className="font-mono text-lg mb-4 border-b-2 border-neutral-300 pb-2">
            EM QUEDA
          </h2>
          <ul className="space-y-2">
            <li className="border-2 border-neutral-300 p-3 flex justify-between">
              <span>jQuery</span>
              <span className="font-mono">↓ 12%</span>
            </li>
            <li className="border-2 border-neutral-300 p-3 flex justify-between">
              <span>PHP</span>
              <span className="font-mono">↓ 8%</span>
            </li>
            <li className="border-2 border-neutral-300 p-3 flex justify-between">
              <span>AngularJS</span>
              <span className="font-mono">↓ 6%</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}