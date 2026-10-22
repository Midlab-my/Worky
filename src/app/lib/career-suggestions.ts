const CAREER_SUGGESTIONS = [
  "Administrador",
  "Advogado",
  "Analista",
  "Analista de Dados",
  "Assistente",
  "Auxiliar",
  "Backend",
  "Bug Bounty",
  "Contador",
  "Coordenador",
  "Desenvolvedor",
  "Desenvolvedor Backend",
  "Desenvolvedor Frontend",
  "Desenvolvedor Fullstack",
  "Designer",
  "Direito",
  "Enfermeiro",
  "Engenharia Civil",
  "Engenheiro",
  "Engenheiro de Software",
  "Estágio",
  "Finanças",
  "Frontend",
  "Fullstack",
  "Gerente",
  "Help Desk",
  "Juridico",
  "Logística",
  "Marketing",
  "Medico",
  "Mobile",
  "Pedagogia",
  "Product Management",
  "Product Owner",
  "QA",
  "RH",
  "Recursos Humanos",
  "Segurança da Informação",
  "Service Desk",
  "Solutions Architect",
  "SRE",
  "Suporte",
  "Técnico",
  "Tecnologia da Informação",
  "UI Design",
  "UX",
  "UX Research",
  "Vendas",
] as const;

const SUGGESTION_LIMIT = 5;
const TYPING_MIN = 2;
const CORRECT_MIN = 4;

type RankedCareer = {
  label: string;
  score: number;
  distance: number;
  kind: "exact" | "prefix" | "includes" | "fuzzy";
};

export function foldCareerText(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function careerWords(value: string): string[] {
  return foldCareerText(value).split(/[^a-z0-9]+/).filter((word) => word.length > 1);
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const current = row[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + cost);
      previous = current;
    }
  }
  return row[b.length];
}

function fuzzyDistance(query: string, cargo: string): number | null {
  if (query.length < 4) return null;
  const maxDistance = query.length >= 5 ? 2 : 1;
  const candidates = [foldCareerText(cargo)];
  for (const word of careerWords(cargo)) {
    if (word.length >= 5) candidates.push(word);
  }

  let best: number | null = null;
  for (const candidate of candidates) {
    const distance = levenshtein(query, candidate);
    const longest = Math.max(query.length, candidate.length);
    if (distance > maxDistance || distance / longest > 0.45) continue;
    if (best === null || distance < best) best = distance;
  }
  return best;
}

function queryLooksLikeCargo(query: string): boolean {
  const folded = foldCareerText(query);
  if (!folded) return false;
  return CAREER_SUGGESTIONS.some((cargo) => {
    const foldedCargo = foldCareerText(cargo);
    if (folded === foldedCargo) return true;
    if (foldedCargo.length < 3) return false;
    const escaped = foldedCargo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`).test(folded);
  });
}

function rankCareers(query: string): RankedCareer[] {
  const folded = foldCareerText(query);
  if (folded.length < TYPING_MIN) return [];

  const ranked: RankedCareer[] = [];
  for (const label of CAREER_SUGGESTIONS) {
    const foldedCargo = foldCareerText(label);
    const words = careerWords(label);

    if (folded === foldedCargo || (folded.length >= 3 && words.includes(folded))) {
      ranked.push({ label, score: 100, distance: 0, kind: "exact" });
      continue;
    }
    if (foldedCargo.startsWith(folded) || words.some((word) => word.startsWith(folded))) {
      ranked.push({
        label,
        score: 88 - Math.min(20, foldedCargo.length - folded.length),
        distance: 0,
        kind: "prefix",
      });
      continue;
    }
    if (foldedCargo.includes(folded)) {
      ranked.push({ label, score: 70, distance: 0, kind: "includes" });
      continue;
    }
    const distance = fuzzyDistance(folded, label);
    if (distance === null) continue;
    ranked.push({
      label,
      score: 58 - distance * 10,
      distance,
      kind: "fuzzy",
    });
  }

  ranked.sort((left, right) => right.score - left.score || left.label.localeCompare(right.label, "pt-BR"));
  const seen = new Set<string>();
  return ranked.filter((item) => {
    if (seen.has(item.label)) return false;
    seen.add(item.label);
    return true;
  });
}

export function suggestCareers(query: string, limit = SUGGESTION_LIMIT): string[] {
  return rankCareers(query).slice(0, limit).map((item) => item.label);
}

export function resolveCareerQuery(query: string): { cargo: string; didCorrect: boolean } {
  const cargo = query.trim();
  if (!cargo) return { cargo, didCorrect: false };
  if (queryLooksLikeCargo(cargo)) return { cargo, didCorrect: false };

  const ranked = rankCareers(cargo);
  const best = ranked[0];
  if (!best) return { cargo, didCorrect: false };

  const uniquePrefix = best.kind === "prefix"
    && ranked.filter((item) => item.kind === "prefix" && item.score >= best.score - 4).length === 1;
  const strongPrefix = best.kind === "prefix" && foldCareerText(cargo).length >= CORRECT_MIN;
  const strongFuzzy = best.kind === "fuzzy" && best.distance <= 2 && foldCareerText(cargo).length >= CORRECT_MIN;

  if (strongFuzzy || strongPrefix || (uniquePrefix && foldCareerText(cargo).length >= 3)) {
    return { cargo: best.label, didCorrect: foldCareerText(best.label) !== foldCareerText(cargo) };
  }

  return { cargo, didCorrect: false };
}
