import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { ArrowLeft, Briefcase, MapPin } from "lucide-react";
import { PARTNER_COMPANIES } from "../data/partner-companies";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import { useAuth } from "../context/AuthContext";

type ApplyJobView = {
  id: string;
  title: string;
  companyName: string;
  companyId?: string;
  modelo: string;
  location: string;
  salary: string;
  skills: string[];
  description: string;
  source: "worky" | "demo";
};

function findDemoJob(jobId: string): ApplyJobView | null {
  for (const company of PARTNER_COMPANIES) {
    const job = company.jobs.find((item) => item.id === jobId);
    if (job) {
      return {
        id: job.id,
        title: job.title,
        companyName: company.name,
        companyId: company.id,
        modelo: job.modelo,
        location: job.location,
        salary: job.salary,
        skills: job.skills,
        description: job.description,
        source: "demo",
      };
    }
  }
  return null;
}

function jobFromLocationState(jobId: string, state: unknown): ApplyJobView | null {
  if (!state || typeof state !== "object") return null;
  const raw = state as Record<string, unknown>;
  const job = (raw.job && typeof raw.job === "object" ? raw.job : raw) as Record<string, unknown>;
  const title = String(job.titulo || job.title || "").trim();
  if (!title) return null;

  const skillsRaw = job.skills || job.requisitos;
  const skills =
    Array.isArray(skillsRaw)
      ? skillsRaw.map(String)
      : String(skillsRaw || "")
          .split(/[,;|]/)
          .map((item) => item.trim())
          .filter(Boolean);

  return {
    id: jobId,
    title,
    companyName: String(job.empresa || job.companyName || "Empresa Worky"),
    modelo: String(job.modalidade || job.modelo || "Qualquer"),
    location: String(job.localidade || job.local || job.location || "Brasil"),
    salary: String(job.salario || job.salary || "A combinar"),
    skills,
    description: String(job.descricao || job.description || "Vaga publicada na Worky."),
    source: job.destaqueWorky || job.fonte === "Worky" || job.tag === "Worky" ? "worky" : "demo",
  };
}

export function JobApplyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { jobId = "" } = useParams();
  const { isAuthenticated, isCompanyAccount } = useAuth();

  const job = useMemo(() => {
    return findDemoJob(jobId) || jobFromLocationState(jobId, location.state);
  }, [jobId, location.state]);

  const applyPath = useMemo(() => {
    const next = `/vagas/${encodeURIComponent(jobId)}`;
    if (!isAuthenticated) {
      return `/auth?mode=register&tipo=candidato&next=${encodeURIComponent(next)}`;
    }
    if (isCompanyAccount) {
      return "/auth?tipo=candidato";
    }
    return `/perfil?candidatura=${encodeURIComponent(jobId)}`;
  }, [isAuthenticated, isCompanyAccount, jobId]);

  if (!job) {
    return (
      <div className="ja-root">
        <style>{style}</style>
        <SiteHeader activeItem="empresas" />
        <main className="ja-main">
          <button type="button" className="ja-back" onClick={() => navigate("/empresas")}>
            <ArrowLeft size={16} strokeWidth={2.2} aria-hidden="true" />
            Voltar
          </button>
          <div className="ja-empty">
            Vaga nao encontrada. Volte ao catalogo de empresas ou faca uma nova busca.
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="ja-root">
      <style>{style}</style>
      <SiteHeader activeItem="empresas" />

      <main className="ja-main">
        <button
          type="button"
          className="ja-back"
          onClick={() =>
            navigate(job.companyId ? `/empresas/${job.companyId}` : "/empresas")
          }
        >
          <ArrowLeft size={16} strokeWidth={2.2} aria-hidden="true" />
          Voltar
        </button>

        <article className="ja-card">
          <div className="ja-badges">
            <span className={job.source === "worky" ? "ja-badge worky" : "ja-badge demo"}>
              {job.source === "worky" ? "Prioridade Worky" : "Vaga demonstracao"}
            </span>
            <span className="ja-modelo">{job.modelo}</span>
          </div>

          <p className="ja-company">{job.companyName}</p>
          <h1>{job.title}</h1>
          <p className="ja-desc">{job.description}</p>

          <div className="ja-meta">
            <span>
              <MapPin size={14} strokeWidth={2.2} aria-hidden="true" />
              {job.location}
            </span>
            <span>
              <Briefcase size={14} strokeWidth={2.2} aria-hidden="true" />
              {job.salary}
            </span>
          </div>

          {job.skills.length > 0 && (
            <div className="ja-skills">
              {job.skills.map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>
          )}

          <div className="ja-cta">
            <button type="button" className="ja-btn" onClick={() => navigate(applyPath)}>
              {isAuthenticated && !isCompanyAccount
                ? "Continuar candidatura no perfil"
                : "Cadastrar e candidatar-se"}
            </button>
            <p className="ja-note">
              {job.source === "worky"
                ? "Vaga real publicada por empresa cadastrada na Worky. Tem prioridade nas buscas."
                : "Empresa demonstrativa do catalogo. O botao leva ao cadastro de candidato (sem link externo)."}
            </p>
          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}

const style = `
  .ja-root {
    font-family: 'Inter', sans-serif;
    color: #0f172a;
    background: #f8fafc;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .ja-main {
    width: 100%;
    max-width: 720px;
    margin: 0 auto;
    padding: 1.25rem 1.5rem 3rem;
    box-sizing: border-box;
    flex: 1;
  }

  .ja-back {
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

  .ja-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: var(--radius);
    padding: 1.4rem 1.35rem 1.5rem;
  }

  .ja-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    margin-bottom: 0.75rem;
  }

  .ja-badge {
    font-size: 0.7rem;
    font-weight: 700;
    border-radius: var(--radius);
    padding: 0.28rem 0.65rem;
  }

  .ja-badge.worky {
    background: #dbeafe;
    color: #1d4ed8;
  }

  .ja-badge.demo {
    background: #f1f5f9;
    color: #475569;
  }

  .ja-modelo {
    font-size: 0.7rem;
    font-weight: 700;
    color: #0f766e;
    background: #ccfbf1;
    border-radius: var(--radius);
    padding: 0.28rem 0.65rem;
  }

  .ja-company {
    margin: 0 0 0.25rem;
    color: #64748b;
    font-size: 0.85rem;
    font-weight: 700;
  }

  .ja-card h1 {
    margin: 0 0 0.7rem;
    font-family: 'Sora', sans-serif;
    font-size: clamp(1.4rem, 3vw, 1.85rem);
    font-weight: 800;
    color: #003ec7;
  }

  .ja-desc {
    margin: 0 0 1rem;
    color: #475569;
    line-height: 1.55;
    font-size: 0.95rem;
  }

  .ja-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem 1rem;
    color: #64748b;
    font-size: 0.84rem;
    font-weight: 600;
    margin-bottom: 0.9rem;
  }

  .ja-meta span {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
  }

  .ja-skills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-bottom: 1.25rem;
  }

  .ja-skills span {
    font-size: 0.74rem;
    font-weight: 600;
    color: #334155;
    background: #f1f5f9;
    border-radius: var(--radius);
    padding: 0.25rem 0.55rem;
  }

  .ja-cta {
    border-top: 1px solid #e2e8f0;
    padding-top: 1.1rem;
  }

  .ja-btn {
    width: 100%;
    border: 0;
    border-radius: var(--radius);
    background: #2563eb;
    color: #fff;
    font-weight: 700;
    font-size: 0.95rem;
    padding: 0.85rem 1rem;
    cursor: pointer;
  }

  .ja-btn:hover {
    background: #1d4ed8;
  }

  .ja-note {
    margin: 0.75rem 0 0;
    color: #94a3b8;
    font-size: 0.8rem;
    line-height: 1.45;
    text-align: center;
  }

  .ja-empty {
    border: 1px dashed #cbd5e1;
    border-radius: var(--radius);
    padding: 1.5rem 1rem;
    text-align: center;
    color: #64748b;
    background: #fff;
  }
`;
