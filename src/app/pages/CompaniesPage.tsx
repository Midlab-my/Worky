import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, MapPin, Search } from "lucide-react";
import { CATALOG_TONE_STYLE, catalogInitials, catalogTone } from "../lib/company-catalog";
import { fetchPublicCompanyCatalog, type PublicCatalogCompany } from "../services/company";
import { AdSlot } from "../components/AdSlot";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";

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

function companyMatchesQuery(company: PublicCatalogCompany, query: string) {
  const fields = [
    company.name,
    company.sector,
    company.location,
    company.size,
    catalogInitials(company.name),
    ...company.jobs.map((job) => job.titulo),
  ];
  return fields.some((field) => fuzzyScore(query, field) >= 55);
}

export function CompaniesPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("Todos");
  const [catalog, setCatalog] = useState<PublicCatalogCompany[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPublicCompanyCatalog()
      .then((companies) => {
        if (!cancelled) setCatalog(companies);
      })
      .catch(() => {
        if (!cancelled) setCatalog([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sectors = useMemo(() => {
    const unique = Array.from(
      new Set(catalog.map((company) => company.sector.trim()).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));
    return ["Todos", ...unique];
  }, [catalog]);

  const companies = useMemo(() => {
    const trimmed = query.trim();
    return catalog
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
  }, [catalog, query, sector]);

  return (
    <div className="ce-root">
      <style>{style}</style>
      <SiteHeader activeItem="empresas" />

      <section className="ce-hero">
        <h1>Conheça as empresas que divulgam vagas por aqui</h1>
        <p>
          Empresas cadastradas na Worky e as vagas que elas publicaram. Sem parceiros fictícios.
        </p>
      </section>

      <div className="ce-shell">
      <section className="ce-toolbar">
        <label className="ce-search">
          <Search size={16} strokeWidth={2} aria-hidden="true" />
          <input
            type="search"
            value={query}
            maxLength={120}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar empresa, vaga, setor ou cidade..."
            aria-label="Buscar empresas e vagas"
          />
        </label>
        {sectors.length > 1 ? (
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
        ) : null}
      </section>

      <section className="ce-grid" aria-live="polite">
        {loading ? (
          <div className="ce-empty">Carregando empresas cadastradas...</div>
        ) : companies.length === 0 ? (
          <div className="ce-empty">
            {catalog.length === 0
              ? "Ainda nenhuma empresa publicou vaga. Cadastre a sua e ela aparece aqui."
              : "Nenhuma empresa ou vaga encontrada com esse filtro."}
          </div>
        ) : (
          companies.map((company) => {
            const tone = CATALOG_TONE_STYLE[catalogTone(company.id)];
            const jobsCount = company.jobs.length;
            const highlight = company.jobs[0]?.titulo || company.sector;
            return (
              <article
                className="ce-card"
                key={company.id}
                role="link"
                tabIndex={0}
                onClick={() => navigate(`/empresas/${company.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    navigate(`/empresas/${company.id}`);
                  }
                }}
              >
                <div className="ce-card-top">
                  <div className="ce-logo" style={{ background: tone.bg, color: tone.color }}>
                    {catalogInitials(company.name)}
                  </div>
                  <div>
                    <h2>{company.name}</h2>
                    {company.sector ? <p className="ce-sector">{company.sector}</p> : null}
                  </div>
                </div>
                {highlight ? <p className="ce-highlight">{highlight}</p> : null}
                <div className="ce-meta">
                  <span>
                    <MapPin size={13} strokeWidth={2.2} aria-hidden="true" />
                    {company.location || "Brasil"}
                  </span>
                  {company.size ? <span>{company.size}</span> : null}
                  <span className="ce-jobs">
                    {jobsCount} {jobsCount === 1 ? "vaga aberta" : "vagas abertas"}
                  </span>
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

      <div className="ce-ad">
        <AdSlot placement="leaderboard" />
      </div>
      </div>

      <SiteFooter />
    </div>
  );
}

const style = `
  .ce-root {
    font-family: 'Inter', sans-serif; color: #0f172a; background: #ffffff;
    min-height: 100vh; display: flex; flex-direction: column;
    max-width: 100%;
  }
  .ce-root *, .ce-root *::before, .ce-root *::after { box-sizing: border-box; }

  .ce-hero {
    width: 100%; max-width: 760px; margin: 0 auto; padding: 3.5rem 1.5rem 1.25rem; text-align: center;
  }
  .ce-hero h1 {
    font-family: 'Sora', sans-serif; font-weight: 800;
    font-size: clamp(1.45rem, 5.5vw, 2.15rem); line-height: 1.25; color: #003ec7; margin: 0 0 0.6rem;
    overflow-wrap: break-word;
  }
  .ce-hero p { color: #64748b; font-size: 0.875rem; line-height: 1.5; margin: 0 auto; max-width: 36rem; }

  .ce-shell {
    width: 100%;
    max-width: 1080px;
    margin: 0 auto;
    padding: 0 1.5rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    min-width: 0;
  }

  .ce-toolbar {
    width: 100%; margin: 0; padding: 0;
    display: flex; flex-direction: column; gap: 0.7rem; min-width: 0;
  }
  .ce-search {
    display: flex; align-items: center; gap: 0.55rem;
    border: 1px solid #e2e8f0; border-radius: var(--radius); padding: 0.55rem 0.85rem;
    background: #fff; color: #64748b; width: 100%; min-width: 0;
  }
  .ce-search input {
    border: 0; outline: none; width: 100%; min-width: 0; font-family: inherit; color: #0f172a; background: transparent;
    font-size: 0.875rem;
  }
  .ce-search input::placeholder { color: #94a3b8; font-size: 0.875rem; }
  .ce-filters { display: flex; flex-wrap: wrap; gap: 0.5rem; min-width: 0; }
  .ce-filter {
    border: 1px solid #e2e8f0; background: #fff; color: #64748b;
    border-radius: var(--radius); padding: 0.4rem 0.85rem; font-size: 0.8rem; font-weight: 600; cursor: pointer;
  }
  .ce-filter.active { background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8; }

  .ce-grid {
    width: 100%; margin: 0; padding: 0;
    display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem;
    min-width: 0;
  }
  .ce-empty {
    grid-column: 1 / -1; text-align: center; color: #64748b;
    border: 1px dashed #cbd5e1; border-radius: var(--radius); padding: 2rem 1rem;
  }
  .ce-card {
    border: 1px solid #e2e8f0; border-radius: var(--radius); padding: 1.25rem 1.2rem;
    background: #fff; display: flex; flex-direction: column; gap: 0.85rem;
    cursor: pointer; transition: border-color 0.15s, box-shadow 0.15s;
    min-width: 0;
  }
  .ce-card:hover, .ce-card:focus-visible {
    border-color: #93c5fd; box-shadow: 0 8px 24px rgba(37, 99, 235, 0.1); outline: none;
  }
  .ce-card-top { display: flex; align-items: center; gap: 0.85rem; min-width: 0; }
  .ce-logo {
    width: 44px; height: 44px; border-radius: var(--radius); flex-shrink: 0;
    display: inline-flex; align-items: center; justify-content: center;
    font-family: 'Sora', sans-serif; font-weight: 800; font-size: 0.85rem;
  }
  .ce-card h2 { margin: 0; font-size: 1rem; font-weight: 700; overflow-wrap: break-word; }
  .ce-sector { margin: 0.15rem 0 0; color: #64748b; font-size: 0.8rem; font-weight: 600; }
  .ce-highlight { margin: 0; color: #475569; font-size: 0.86rem; line-height: 1.5; flex: 1; }
  .ce-meta {
    display: flex; flex-wrap: wrap; gap: 0.45rem 0.75rem;
    color: #64748b; font-size: 0.75rem; font-weight: 600;
  }
  .ce-meta span { display: inline-flex; align-items: center; gap: 0.3rem; }
  .ce-jobs { color: #1d4ed8; }

  .ce-cta {
    width: 100%;
    margin: 0; padding: 1.5rem;
    border-radius: var(--radius); background: #0f172a; color: #fff;
    display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;
  }
  .ce-ad { width: 100%; }
  .ce-cta h2 { margin: 0 0 0.35rem; font-family: 'Sora', sans-serif; font-size: 1.15rem; }
  .ce-cta p { margin: 0; color: #94a3b8; font-size: 0.88rem; }
  .ce-cta-btn {
    display: inline-flex; align-items: center; gap: 0.45rem;
    background: #2563eb; color: #fff; border: 0; border-radius: var(--radius);
    padding: 0.7rem 1.15rem; font-weight: 700; font-size: 0.88rem; cursor: pointer;
  }
  .ce-cta-btn:hover { background: #1d4ed8; }

  @media (max-width: 900px) {
    .ce-grid { grid-template-columns: 1fr 1fr; }
  }

  @media (max-width: 720px) {
    .ce-hero { padding: 2.25rem 1rem 1rem; }
    .ce-shell { padding: 0 1rem 1.5rem; gap: 1rem; }
    .ce-grid { grid-template-columns: 1fr; }
    .ce-cta {
      padding: 1.25rem 1.15rem;
      flex-direction: column;
      align-items: stretch;
    }
    .ce-cta-btn { width: 100%; justify-content: center; }
  }
`;
