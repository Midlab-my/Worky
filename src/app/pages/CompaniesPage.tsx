import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, MapPin, Search } from "lucide-react";
import { PARTNER_COMPANIES, type PartnerCompany } from "../data/partner-companies";
import { AdSlot, SponsorMarquee } from "../components/AdSlot";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";

const TONE_STYLE: Record<PartnerCompany["tone"], { bg: string; color: string }> = {
  slate: { bg: "#e2e8f0", color: "#0f172a" },
  blue: { bg: "#dbeafe", color: "#1d4ed8" },
  teal: { bg: "#ccfbf1", color: "#0f766e" },
  indigo: { bg: "#e0e7ff", color: "#4338ca" },
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function levenshtein(a: string, b: string) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const prev = Array.from({ length: b.length + 1 }, (_, index) => index);
  const curr = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost,
      );
    }
    for (let j = 0; j <= b.length; j += 1) {
      prev[j] = curr[j];
    }
  }

  return prev[b.length];
}

function isSubsequence(query: string, target: string) {
  let qi = 0;
  for (let ti = 0; ti < target.length && qi < query.length; ti += 1) {
    if (target[ti] === query[qi]) qi += 1;
  }
  return qi === query.length;
}

function fuzzyScore(query: string, target: string) {
  const q = normalizeText(query);
  const t = normalizeText(target);
  if (!q) return 1;
  if (!t) return 0;
  if (t === q) return 100;
  if (t.startsWith(q)) return 90;
  if (t.includes(q)) return 80;

  const words = t.split(/[^a-z0-9]+/).filter(Boolean);
  let best = 0;

  for (const word of words) {
    if (word.startsWith(q) || q.startsWith(word)) best = Math.max(best, 75);
    if (word.includes(q) || q.includes(word)) best = Math.max(best, 65);

    const distance = levenshtein(q, word);
    const maxLen = Math.max(q.length, word.length);
    const similarity = 1 - distance / maxLen;
    if (similarity >= 0.6) {
      best = Math.max(best, Math.round(similarity * 70));
    }
  }

  const fullDistance = levenshtein(q, t);
  const fullMax = Math.max(q.length, t.length);
  const fullSimilarity = 1 - fullDistance / fullMax;
  if (fullSimilarity >= 0.55) {
    best = Math.max(best, Math.round(fullSimilarity * 68));
  }

  if (isSubsequence(q, t) && q.length >= 3) {
    best = Math.max(best, 55);
  }

  return best;
}

function companyMatchesQuery(company: PartnerCompany, query: string) {
  const fields = [company.name, company.sector, company.location, company.highlight, company.initials];
  return fields.some((field) => fuzzyScore(query, field) >= 55);
}

export function CompaniesPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("Todos");

  const sectors = useMemo(() => {
    const unique = Array.from(new Set(PARTNER_COMPANIES.map((company) => company.sector)));
    return ["Todos", ...unique];
  }, []);

  const companies = useMemo(() => {
    const trimmed = query.trim();
    return PARTNER_COMPANIES
      .filter((company) => {
        const matchesSector = sector === "Todos" || company.sector === sector;
        if (!matchesSector) return false;
        if (!trimmed) return true;
        return companyMatchesQuery(company, trimmed);
      })
      .sort((a, b) => {
        if (!trimmed) return a.name.localeCompare(b.name, "pt-BR");
        const scoreDiff = fuzzyScore(trimmed, b.name) - fuzzyScore(trimmed, a.name);
        if (scoreDiff !== 0) return scoreDiff;
        return a.name.localeCompare(b.name, "pt-BR");
      });
  }, [query, sector]);

  return (
    <div className="ce-root">
      <style>{style}</style>
      <SponsorMarquee />
      <SiteHeader activeItem="empresas" />

      <section className="ce-hero">
        <h1>Conheça as empresas que divulgam vagas por aqui</h1>
        <p>
          Catálogo das organizações cadastradas na plataforma: setores, localização e
          oportunidades abertas para quem está explorando o mercado.
        </p>
      </section>

      <section className="ce-toolbar">
        <label className="ce-search">
          <Search size={16} strokeWidth={2} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome, setor ou cidade..."
            aria-label="Buscar empresas"
          />
        </label>
        <div className="ce-filters" role="group" aria-label="Filtrar por setor">
          {sectors.map((item) => (
            <button
              key={item}
              type="button"
              className={`ce-filter${sector === item ? " active" : ""}`}
              onClick={() => setSector(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="ce-grid" aria-live="polite">
        {companies.length === 0 ? (
          <div className="ce-empty">
            Nenhuma empresa encontrada com esse filtro. Tente outro termo ou setor.
          </div>
        ) : (
          companies.map((company) => {
            const tone = TONE_STYLE[company.tone];
            return (
              <article className="ce-card" key={company.id}>
                <div className="ce-card-top">
                  <div className="ce-logo" style={{ background: tone.bg, color: tone.color }}>
                    {company.initials}
                  </div>
                  <div>
                    <h2>{company.name}</h2>
                    <p className="ce-sector">{company.sector}</p>
                  </div>
                </div>
                <p className="ce-highlight">{company.highlight}</p>
                <div className="ce-meta">
                  <span>
                    <MapPin size={13} strokeWidth={2.2} aria-hidden="true" />
                    {company.location}
                  </span>
                  <span>{company.size} colaboradores</span>
                  <span className="ce-jobs">{company.jobsOpen} vagas abertas</span>
                </div>
              </article>
            );
          })
        )}
      </section>

      <section className="ce-cta">
        <div>
          <h2>Sua empresa contrata por aqui?</h2>
          <p>Cadastre o perfil corporativo e publique vagas para candidatos da Worky.</p>
        </div>
        <button type="button" className="ce-cta-btn" onClick={() => navigate("/auth?tipo=empresa")}>
          Cadastrar empresa
          <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
        </button>
      </section>

      <div className="ws-ad-wrap ws-ad-wrap--footer" style={{ paddingBottom: "1.5rem" }}>
        <AdSlot
          placement="leaderboard"
          title="Propaganda aqui"
          hint="Espaço de patrocínio na página de empresas"
        />
      </div>

      <SiteFooter copy="2026 Worky. Empresas e oportunidades reais." />
    </div>
  );
}

const style = `
  .ce-root { font-family: 'Inter', sans-serif; color: #0f172a; background: #ffffff; min-height: 100vh; display: flex; flex-direction: column; }

  .ce-hero {
    max-width: 760px; margin: 0 auto; padding: 3.5rem 1.5rem 1.25rem; text-align: center;
  }
  .ce-hero h1 {
    font-family: 'Sora', sans-serif; font-weight: 800;
    font-size: clamp(1.8rem, 4vw, 2.6rem); line-height: 1.2; color: #003ec7; margin-bottom: 0.85rem;
  }
  .ce-hero p { color: #64748b; font-size: 1rem; line-height: 1.6; margin: 0; }

  .ce-toolbar {
    max-width: 1080px; margin: 0 auto; padding: 0.5rem 1.5rem 1.5rem;
    display: flex; flex-direction: column; gap: 0.7rem;
  }
  .ce-search {
    display: flex; align-items: center; gap: 0.65rem;
    border: 1px solid #e2e8f0; border-radius: 999px; padding: 0.7rem 1rem;
    background: #fff; color: #64748b;
  }
  .ce-search input {
    border: 0; outline: none; width: 100%; font: inherit; color: #0f172a; background: transparent;
  }
  .ce-filters { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .ce-filter {
    border: 1px solid #e2e8f0; background: #fff; color: #64748b;
    border-radius: 999px; padding: 0.4rem 0.85rem; font-size: 0.8rem; font-weight: 600; cursor: pointer;
  }
  .ce-filter.active { background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8; }

  .ce-grid {
    max-width: 1080px; margin: 0 auto; padding: 0 1.5rem 2.5rem;
    display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem;
  }
  .ce-empty {
    grid-column: 1 / -1; text-align: center; color: #64748b;
    border: 1px dashed #cbd5e1; border-radius: 14px; padding: 2rem 1rem;
  }
  .ce-card {
    border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.25rem 1.2rem;
    background: #fff; display: flex; flex-direction: column; gap: 0.85rem;
  }
  .ce-card-top { display: flex; align-items: center; gap: 0.85rem; }
  .ce-logo {
    width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
    display: inline-flex; align-items: center; justify-content: center;
    font-family: 'Sora', sans-serif; font-weight: 800; font-size: 0.85rem;
  }
  .ce-card h2 { margin: 0; font-size: 1rem; font-weight: 700; }
  .ce-sector { margin: 0.15rem 0 0; color: #64748b; font-size: 0.8rem; font-weight: 600; }
  .ce-highlight { margin: 0; color: #475569; font-size: 0.86rem; line-height: 1.5; flex: 1; }
  .ce-meta {
    display: flex; flex-wrap: wrap; gap: 0.45rem 0.75rem;
    color: #64748b; font-size: 0.75rem; font-weight: 600;
  }
  .ce-meta span { display: inline-flex; align-items: center; gap: 0.3rem; }
  .ce-jobs { color: #1d4ed8; }

  .ce-cta {
    max-width: 1080px; margin: 0 auto 2rem; padding: 1.5rem 1.5rem;
    width: calc(100% - 3rem); box-sizing: border-box;
    border-radius: 18px; background: #0f172a; color: #fff;
    display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;
  }
  .ce-cta h2 { margin: 0 0 0.35rem; font-family: 'Sora', sans-serif; font-size: 1.15rem; }
  .ce-cta p { margin: 0; color: #94a3b8; font-size: 0.88rem; }
  .ce-cta-btn {
    display: inline-flex; align-items: center; gap: 0.45rem;
    background: #2563eb; color: #fff; border: 0; border-radius: 999px;
    padding: 0.7rem 1.15rem; font-weight: 700; font-size: 0.88rem; cursor: pointer;
  }
  .ce-cta-btn:hover { background: #1d4ed8; }

  @media (max-width: 640px) {
    .ce-hero { padding-top: 2.5rem; }
    .ce-cta { width: calc(100% - 2rem); margin-bottom: 1.5rem; }
  }
`;
