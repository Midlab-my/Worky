import { useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Briefcase, MapPin } from "lucide-react";
import { getPartnerCompanyById, type PartnerCompany } from "../data/partner-companies";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";

const TONE_STYLE: Record<PartnerCompany["tone"], { bg: string; color: string }> = {
  slate: { bg: "#e2e8f0", color: "#0f172a" },
  blue: { bg: "#dbeafe", color: "#1d4ed8" },
  teal: { bg: "#ccfbf1", color: "#0f766e" },
  indigo: { bg: "#e0e7ff", color: "#4338ca" },
};

export function CompanyPublicPage() {
  const navigate = useNavigate();
  const { companyId = "" } = useParams();
  const company = useMemo(() => getPartnerCompanyById(companyId), [companyId]);

  if (!company) {
    return (
      <div className="cpb-root">
        <style>{style}</style>
        <SiteHeader activeItem="empresas" />
        <main className="cpb-main">
          <button type="button" className="cpb-back" onClick={() => navigate("/empresas")}>
            <ArrowLeft size={16} strokeWidth={2.2} aria-hidden="true" />
            Voltar para empresas
          </button>
          <div className="cpb-empty">
            Empresa nao encontrada. Volte ao catalogo e escolha outra organizacao.
          </div>
        </main>
        <SiteFooter copy="2026 Worky. Empresas e oportunidades reais." />
      </div>
    );
  }

  const tone = TONE_STYLE[company.tone];
  const jobs = company.jobs;

  return (
    <div className="cpb-root">
      <style>{style}</style>
      <SiteHeader activeItem="empresas" />

      <main className="cpb-main">
        <button type="button" className="cpb-back" onClick={() => navigate("/empresas")}>
          <ArrowLeft size={16} strokeWidth={2.2} aria-hidden="true" />
          Voltar para empresas
        </button>

        <section className="cpb-hero">
          <div className="cpb-logo" style={{ background: tone.bg, color: tone.color }}>
            {company.initials}
          </div>
          <div className="cpb-hero-text">
            <p className="cpb-sector">{company.sector}</p>
            <h1>{company.name}</h1>
            <p className="cpb-about">{company.about}</p>
            <div className="cpb-meta">
              <span>
                <MapPin size={14} strokeWidth={2.2} aria-hidden="true" />
                {company.location}
              </span>
              <span>{company.size} colaboradores</span>
              <span className="cpb-jobs-count">
                <Briefcase size={14} strokeWidth={2.2} aria-hidden="true" />
                {jobs.length} {jobs.length === 1 ? "vaga aberta" : "vagas abertas"}
              </span>
            </div>
          </div>
        </section>

        <section className="cpb-jobs" aria-label={`Vagas da ${company.name}`}>
          <div className="cpb-jobs-head">
            <h2>Vagas em aberto</h2>
            <p>Visao publica: qualquer visitante pode ver as oportunidades desta empresa.</p>
          </div>

          {jobs.length === 0 ? (
            <div className="cpb-empty">Nenhuma vaga aberta no momento.</div>
          ) : (
            <ul className="cpb-job-list">
              {jobs.map((job) => (
                <li className="cpb-job" key={job.id}>
                  <div className="cpb-job-top">
                    <h3>{job.title}</h3>
                    <span className="cpb-modelo">{job.modelo}</span>
                  </div>
                  <p className="cpb-job-desc">{job.description}</p>
                  <div className="cpb-job-meta">
                    <span>
                      <MapPin size={13} strokeWidth={2.2} aria-hidden="true" />
                      {job.location}
                    </span>
                    <span>{job.salary}</span>
                  </div>
                  <div className="cpb-skills">
                    {job.skills.map((skill) => (
                      <span key={skill}>{skill}</span>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="cpb-apply"
                    onClick={() => navigate(`/vagas/${job.id}`)}
                  >
                    Ver vaga e candidatar-se
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <SiteFooter copy="2026 Worky. Empresas e oportunidades reais." />
    </div>
  );
}

const style = `
  .cpb-root {
    font-family: 'Inter', sans-serif;
    color: #0f172a;
    background: #ffffff;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .cpb-main {
    width: 100%;
    max-width: 920px;
    margin: 0 auto;
    padding: 1.25rem 1.5rem 3rem;
    box-sizing: border-box;
    flex: 1;
  }

  .cpb-back {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    border: 0;
    background: transparent;
    color: #2563eb;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    padding: 0;
    margin-bottom: 1.25rem;
  }

  .cpb-hero {
    display: flex;
    gap: 1.1rem;
    align-items: flex-start;
    padding: 1.25rem 0 1.5rem;
    border-bottom: 1px solid #e2e8f0;
    margin-bottom: 1.5rem;
  }

  .cpb-logo {
    width: 64px;
    height: 64px;
    border-radius: 14px;
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: 'Sora', sans-serif;
    font-weight: 800;
    font-size: 1.05rem;
  }

  .cpb-sector {
    margin: 0 0 0.25rem;
    color: #64748b;
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .cpb-hero h1 {
    margin: 0 0 0.55rem;
    font-family: 'Sora', sans-serif;
    font-size: clamp(1.5rem, 3vw, 2rem);
    font-weight: 800;
    color: #003ec7;
  }

  .cpb-about {
    margin: 0 0 0.85rem;
    color: #475569;
    line-height: 1.55;
    font-size: 0.95rem;
    max-width: 62ch;
  }

  .cpb-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1rem;
    color: #64748b;
    font-size: 0.82rem;
    font-weight: 600;
  }

  .cpb-meta span {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
  }

  .cpb-jobs-count {
    color: #1d4ed8;
  }

  .cpb-jobs-head h2 {
    margin: 0 0 0.35rem;
    font-family: 'Sora', sans-serif;
    font-size: 1.2rem;
    font-weight: 700;
  }

  .cpb-jobs-head p {
    margin: 0 0 1rem;
    color: #64748b;
    font-size: 0.88rem;
  }

  .cpb-job-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.85rem;
  }

  .cpb-job {
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.1rem 1.15rem;
    background: #fff;
    display: flex;
    flex-direction: column;
  }

  .cpb-job-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 0.45rem;
  }

  .cpb-job h3 {
    margin: 0;
    font-size: 1.02rem;
    font-weight: 700;
  }

  .cpb-modelo {
    flex-shrink: 0;
    font-size: 0.72rem;
    font-weight: 700;
    color: #1d4ed8;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 999px;
    padding: 0.25rem 0.6rem;
  }

  .cpb-job-desc {
    margin: 0 0 0.7rem;
    color: #475569;
    font-size: 0.88rem;
    line-height: 1.5;
  }

  .cpb-job-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem 0.9rem;
    color: #64748b;
    font-size: 0.78rem;
    font-weight: 600;
    margin-bottom: 0.7rem;
  }

  .cpb-job-meta span {
    display: inline-flex;
    align-items: center;
    gap: 0.28rem;
  }

  .cpb-skills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .cpb-skills span {
    font-size: 0.74rem;
    font-weight: 600;
    color: #334155;
    background: #f1f5f9;
    border-radius: 999px;
    padding: 0.25rem 0.55rem;
  }

  .cpb-apply {
    margin-top: 0.85rem;
    align-self: flex-start;
    border: 0;
    border-radius: 999px;
    background: #2563eb;
    color: #fff;
    font-weight: 700;
    font-size: 0.82rem;
    padding: 0.55rem 0.95rem;
    cursor: pointer;
  }

  .cpb-apply:hover {
    background: #1d4ed8;
  }

  .cpb-empty {
    border: 1px dashed #cbd5e1;
    border-radius: 12px;
    padding: 1.5rem 1rem;
    text-align: center;
    color: #64748b;
  }

  @media (max-width: 640px) {
    .cpb-hero {
      flex-direction: column;
    }
    .cpb-job-top {
      flex-direction: column;
      align-items: flex-start;
    }
  }
`;
