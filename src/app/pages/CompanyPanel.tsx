import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import { useAuth } from "../context/AuthContext";
import { isAuthConfigured } from "../services/auth";
import { emailErrorMessage } from "../lib/br-docs";
import {
  canUnlockCandidates,
  createCompanyJob,
  deleteCompanyJob,
  fetchCompanyProfile,
  listCandidatesForJob,
  listCompanyJobs,
  updateCompanyJob,
  type CompanyCandidate,
  type CompanyJob,
  type CompanyJobModelo,
  type CompanyProfile,
} from "../services/company";

type JobFormState = {
  titulo: string;
  local: string;
  modelo: CompanyJobModelo;
  requisitos: string;
  descricao: string;
};

const EMPTY_FORM: JobFormState = {
  titulo: "",
  local: "",
  modelo: "Remoto",
  requisitos: "",
  descricao: "",
};

export function CompanyPanel() {
  const navigate = useNavigate();
  const { user, session, loading: authLoading, isAuthenticated, signIn, signOut } = useAuth();

  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [jobs, setJobs] = useState<CompanyJob[]>([]);
  const [activeJobId, setActiveJobId] = useState<string>("");
  const [candidates, setCandidates] = useState<CompanyCandidate[]>([]);
  const [panelLoading, setPanelLoading] = useState(false);
  const [panelError, setPanelError] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [jobForm, setJobForm] = useState<JobFormState>(EMPTY_FORM);
  const [jobFormError, setJobFormError] = useState("");
  const [jobSaving, setJobSaving] = useState(false);

  const unlocked = canUnlockCandidates(company?.plan || "starter");
  const activeJob = useMemo(
    () => jobs.find((job) => job.id === activeJobId) || jobs[0] || null,
    [activeJobId, jobs],
  );

  const loadPanel = useCallback(async () => {
    if (!session?.accessToken || !user?.id) {
      setCompany(null);
      setJobs([]);
      setCandidates([]);
      return;
    }

    setPanelLoading(true);
    setPanelError("");
    try {
      const profile = await fetchCompanyProfile(session.accessToken, user.id);
      if (!profile) {
        setCompany(null);
        setPanelError("Esta conta nao e de empresa. Cadastre-se como Empresa ou peca o SQL do painel RH.");
        setJobs([]);
        setCandidates([]);
        return;
      }

      const nextJobs = await listCompanyJobs(session.accessToken, user.id);
      setCompany(profile);
      setJobs(nextJobs);
      setActiveJobId((current) => {
        if (current && nextJobs.some((job) => job.id === current)) {
          return current;
        }
        return nextJobs[0]?.id || "";
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Falha ao carregar o painel RH.";
      setPanelError(message);
      setCompany(null);
    } finally {
      setPanelLoading(false);
    }
  }, [session?.accessToken, user?.id]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      void loadPanel();
    }
  }, [authLoading, isAuthenticated, loadPanel]);

  useEffect(() => {
    let cancelled = false;

    const loadCandidates = async () => {
      if (!session?.accessToken || !activeJob || !company) {
        setCandidates([]);
        return;
      }
      try {
        const next = await listCandidatesForJob(session.accessToken, activeJob, company.plan);
        if (!cancelled) {
          setCandidates(next);
        }
      } catch {
        if (!cancelled) {
          setCandidates([]);
        }
      }
    };

    void loadCandidates();
    return () => {
      cancelled = true;
    };
  }, [activeJob, company, session?.accessToken]);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    const emailError = emailErrorMessage(loginEmail);
    if (emailError) {
      setLoginError(emailError);
      return;
    }
    if (!loginPassword) {
      setLoginError("Informe sua senha.");
      return;
    }
    setLoginError("");
    setLoginSubmitting(true);
    try {
      await signIn({
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword,
      });
    } catch (error: unknown) {
      setLoginError(error instanceof Error ? error.message : "Nao foi possivel entrar.");
    } finally {
      setLoginSubmitting(false);
    }
  };

  const openCreateForm = () => {
    setEditingJobId(null);
    setJobForm(EMPTY_FORM);
    setJobFormError("");
    setShowJobForm(true);
  };

  const openEditForm = (job: CompanyJob) => {
    setEditingJobId(job.id);
    setJobForm({
      titulo: job.titulo,
      local: job.local,
      modelo: job.modelo,
      requisitos: job.requisitos,
      descricao: job.descricao,
    });
    setJobFormError("");
    setShowJobForm(true);
  };

  const handleSaveJob = async (event: FormEvent) => {
    event.preventDefault();
    if (!session?.accessToken || !user?.id) {
      return;
    }

    if (!jobForm.titulo.trim()) {
      setJobFormError("Informe o titulo da vaga.");
      return;
    }
    if (jobForm.titulo.trim().length < 3) {
      setJobFormError("Titulo muito curto. Use pelo menos 3 caracteres.");
      return;
    }
    if (!jobForm.local.trim()) {
      setJobFormError("Informe o local da vaga.");
      return;
    }
    if (!jobForm.requisitos.trim()) {
      setJobFormError("Informe os requisitos da vaga.");
      return;
    }
    if (!jobForm.descricao.trim()) {
      setJobFormError("Informe a descricao da vaga.");
      return;
    }

    setJobSaving(true);
    setJobFormError("");
    try {
      const payload = {
        titulo: jobForm.titulo.trim(),
        local: jobForm.local.trim(),
        modelo: jobForm.modelo,
        requisitos: jobForm.requisitos.trim(),
        descricao: jobForm.descricao.trim(),
      };
      if (editingJobId) {
        const updated = await updateCompanyJob(session.accessToken, user.id, editingJobId, payload);
        setJobs((current) => current.map((job) => (job.id === updated.id ? updated : job)));
        setActiveJobId(updated.id);
      } else {
        const created = await createCompanyJob(session.accessToken, user.id, payload);
        setJobs((current) => [created, ...current]);
        setActiveJobId(created.id);
      }
      setShowJobForm(false);
      setEditingJobId(null);
      setJobForm(EMPTY_FORM);
    } catch (error: unknown) {
      setJobFormError(error instanceof Error ? error.message : "Nao foi possivel salvar a vaga.");
    } finally {
      setJobSaving(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!session?.accessToken || !user?.id) {
      return;
    }
    const confirmed = window.confirm("Remover esta vaga?");
    if (!confirmed) {
      return;
    }
    try {
      await deleteCompanyJob(session.accessToken, user.id, jobId);
      setJobs((current) => {
        const next = current.filter((job) => job.id !== jobId);
        setActiveJobId((active) => (active === jobId ? next[0]?.id || "" : active));
        return next;
      });
    } catch (error: unknown) {
      setPanelError(error instanceof Error ? error.message : "Nao foi possivel remover a vaga.");
    }
  };

  if (authLoading || (isAuthenticated && panelLoading && !company && !panelError)) {
    return (
      <div className="cp-root">
        <style>{style}</style>
        <SiteHeader badge="Empresa" showProfileAction={false} onExploreClick={() => navigate("/")} />
        <main className="cp-login-main">
          <p className="cp-muted">Carregando painel...</p>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!isAuthenticated || !company) {
    return (
      <div className="cp-root">
        <style>{style}</style>
        <SiteHeader badge="Empresa" showProfileAction={false} onExploreClick={() => navigate("/")} />
        <main className="cp-login-main">
          <section className="cp-login-card">
            <div className="cp-login-kicker">Painel da Empresa</div>
            <h1>Acesso RH</h1>
            <p>Entre com a conta empresa (Supabase) para gerenciar vagas e candidatos.</p>

            {!isAuthConfigured() && (
              <div className="cp-banner">
                Falta configurar <strong>VITE_SUPABASE_*</strong>. Quem tem acesso deve rodar
                {" "}
                <code>backend/supabase_company_rh.sql</code> no SQL Editor.
              </div>
            )}

            {panelError && isAuthenticated && <div className="cp-banner">{panelError}</div>}

            <form onSubmit={handleLogin} className="cp-login-form">
              <div className="cp-field">
                <label htmlFor="company-email">E-mail</label>
                <input
                  id="company-email"
                  type="email"
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                  placeholder="rh@empresa.com"
                  autoComplete="username"
                  required
                />
              </div>
              <div className="cp-field">
                <label htmlFor="company-password">Senha</label>
                <input
                  id="company-password"
                  type="password"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  placeholder="********"
                  autoComplete="current-password"
                  required
                />
              </div>
              {loginError && <p className="cp-login-error">{loginError}</p>}
              <button type="submit" className="cp-login-btn" disabled={loginSubmitting || !isAuthConfigured()}>
                {loginSubmitting ? "Entrando..." : "Entrar no painel"}
              </button>
            </form>

            <button type="button" className="cp-link-btn" onClick={() => navigate("/auth?mode=register&tipo=empresa")}>
              Criar conta empresa
            </button>
          </section>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="cp-root">
      <style>{style}</style>
      <SiteHeader
        badge="Painel Empresa"
        showProfileAction={false}
        hideCompanyLink
        onExploreClick={() => navigate("/")}
        actions={
          <button type="button" className="ws-btn-danger" onClick={() => void signOut()}>
            Sair
          </button>
        }
      />

      <main className="cp-main">
        <div className="cp-welcome">
          <div>
            <div className="cp-welcome-label">
              Plano {company.plan.toUpperCase()}
              {unlocked ? " · candidatos liberados" : " · candidatos com blur"}
            </div>
            <h1>{company.companyName}</h1>
          </div>
          <button type="button" className="cp-btn-primary" onClick={openCreateForm}>
            + Nova Vaga
          </button>
        </div>

        {panelError && <div className="cp-banner">{panelError}</div>}

        {showJobForm && (
          <section className="cp-section cp-form-card">
            <h2>{editingJobId ? "Editar vaga" : "Cadastrar vaga"}</h2>
            <form className="cp-job-form" onSubmit={handleSaveJob} noValidate>
              <div className="cp-field">
                <label htmlFor="job-title">Titulo *</label>
                <input
                  id="job-title"
                  value={jobForm.titulo}
                  onChange={(event) => setJobForm((current) => ({ ...current, titulo: event.target.value }))}
                />
              </div>
              <div className="cp-job-grid">
                <div className="cp-field">
                  <label htmlFor="job-local">Local *</label>
                  <input
                    id="job-local"
                    value={jobForm.local}
                    onChange={(event) => setJobForm((current) => ({ ...current, local: event.target.value }))}
                    placeholder="Sao Paulo, SP"
                  />
                </div>
                <div className="cp-field">
                  <label htmlFor="job-modelo">Modelo *</label>
                  <select
                    id="job-modelo"
                    value={jobForm.modelo}
                    onChange={(event) =>
                      setJobForm((current) => ({
                        ...current,
                        modelo: event.target.value as CompanyJobModelo,
                      }))
                    }
                  >
                    <option value="Remoto">Remoto</option>
                    <option value="Híbrido">Hibrido</option>
                    <option value="Presencial">Presencial</option>
                  </select>
                </div>
              </div>
              <div className="cp-field">
                <label htmlFor="job-reqs">Requisitos *</label>
                <textarea
                  id="job-reqs"
                  rows={3}
                  value={jobForm.requisitos}
                  onChange={(event) => setJobForm((current) => ({ ...current, requisitos: event.target.value }))}
                  placeholder="React, TypeScript, SQL..."
                />
              </div>
              <div className="cp-field">
                <label htmlFor="job-desc">Descricao *</label>
                <textarea
                  id="job-desc"
                  rows={3}
                  value={jobForm.descricao}
                  onChange={(event) => setJobForm((current) => ({ ...current, descricao: event.target.value }))}
                />
              </div>
              {jobFormError && <p className="cp-login-error">{jobFormError}</p>}
              <div className="cp-form-actions">
                <button type="submit" className="cp-btn-primary" disabled={jobSaving}>
                  {jobSaving ? "Salvando..." : "Salvar vaga"}
                </button>
                <button
                  type="button"
                  className="cp-btn-ghost"
                  onClick={() => {
                    setShowJobForm(false);
                    setEditingJobId(null);
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="cp-section">
          <h2>Vagas cadastradas</h2>
          {jobs.length === 0 ? (
            <p className="cp-muted">Nenhuma vaga ainda. Cadastre a primeira com &quot;+ Nova Vaga&quot;.</p>
          ) : (
            <div className="cp-vagas-grid">
              {jobs.map((item) => (
                <div
                  key={item.id}
                  className={`cp-vaga-card${item.id === activeJob?.id ? " active" : ""}`}
                >
                  <button
                    type="button"
                    className="cp-vaga-select"
                    onClick={() => setActiveJobId(item.id)}
                  >
                    <div className="cp-vaga-title">{item.titulo}</div>
                    <div className="cp-vaga-meta">
                      {item.local || "Local nao informado"} · {item.modelo}
                    </div>
                  </button>
                  <div className="cp-vaga-actions">
                    <button type="button" className="cp-mini-btn" onClick={() => openEditForm(item)}>
                      Editar
                    </button>
                    <button type="button" className="cp-mini-btn danger" onClick={() => void handleDeleteJob(item.id)}>
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {activeJob && (
          <section className="cp-section">
            <h2>Candidatos compativeis com &quot;{activeJob.titulo}&quot;</h2>
            <p className="cp-section-sub">
              {unlocked
                ? "Perfis liberados pelo plano Pro/Enterprise."
                : "No Starter os perfis ficam com blur. Assine o Pro para desbloquear."}
            </p>

            <div className="cp-candidatos-grid">
              {candidates.map((candidato) => (
                <div className={`cp-candidato-card${candidato.locked ? " blurred" : ""}`} key={candidato.id}>
                  <div className="cp-candidato-avatar">{(candidato.locked ? "?" : candidato.name.charAt(0)).toUpperCase()}</div>
                  <div className="cp-candidato-name">{candidato.locked ? "Candidato bloqueado" : candidato.name}</div>
                  <div className="cp-candidato-match">{candidato.match}% compativel</div>
                  {!candidato.locked && candidato.skills.length > 0 && (
                    <div className="cp-candidato-skills">{candidato.skills.join(" · ")}</div>
                  )}
                  {candidato.locked && (
                    <div className="cp-candidato-lock" aria-hidden="true">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {!unlocked && (
              <div className="cp-unlock-row">
                <button type="button" className="cp-btn-primary" onClick={() => navigate("/planos?tipo=empresa")}>
                  Desbloquear com o Plano Pro
                </button>
              </div>
            )}
          </section>
        )}
      </main>

      <SiteFooter copy="2026 Worky. Dados de mercado de trabalho." />
    </div>
  );
}

const style = `
  .cp-root { font-family: 'Inter', sans-serif; color: #0f172a; background: #ffffff; min-height: 100vh; }
  .cp-muted { color: #64748b; text-align: center; }
  .cp-banner { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; border-radius: 12px; padding: 0.85rem 1rem; margin-bottom: 1rem; font-size: 0.88rem; line-height: 1.45; text-align: left; }
  .cp-banner code { font-size: 0.8rem; }

  .cp-login-main { display: flex; align-items: center; justify-content: center; min-height: calc(100vh - 130px); padding: 2rem 1.5rem; }
  .cp-login-card { width: 100%; max-width: 440px; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 2.25rem; text-align: center; }
  .cp-login-kicker { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #2563eb; margin-bottom: 0.6rem; }
  .cp-login-card h1 { font-family: 'Sora', sans-serif; font-size: 1.6rem; font-weight: 800; margin-bottom: 0.5rem; }
  .cp-login-card p { color: #64748b; font-size: 0.9rem; margin-bottom: 1.5rem; }
  .cp-login-form { display: flex; flex-direction: column; gap: 1.1rem; text-align: left; }
  .cp-field label { display: block; font-size: 0.82rem; font-weight: 600; margin-bottom: 0.4rem; }
  .cp-field input, .cp-field select, .cp-field textarea {
    width: 100%; border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.65rem 0.85rem; font-size: 0.9rem; box-sizing: border-box;
    font-family: inherit;
  }
  .cp-field input:focus, .cp-field select:focus, .cp-field textarea:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
  .cp-login-error { color: #dc2626; font-size: 0.85rem; margin: 0; }
  .cp-login-btn, .cp-btn-primary {
    border: none; background: #2563eb; color: #fff; font-weight: 700; border-radius: 10px; padding: 0.75rem 1rem; cursor: pointer;
  }
  .cp-login-btn:disabled, .cp-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
  .cp-link-btn { margin-top: 1rem; border: none; background: transparent; color: #2563eb; font-weight: 600; cursor: pointer; }
  .cp-btn-ghost { border: 1px solid #cbd5e1; background: #fff; color: #0f172a; font-weight: 600; border-radius: 10px; padding: 0.7rem 1rem; cursor: pointer; }

  .cp-main { max-width: 1080px; margin: 0 auto; padding: 2rem 1.5rem 3rem; }
  .cp-welcome { display: flex; justify-content: space-between; gap: 1rem; align-items: center; flex-wrap: wrap; margin-bottom: 1.75rem; }
  .cp-welcome-label { font-size: 0.78rem; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.35rem; }
  .cp-welcome h1 { font-family: 'Sora', sans-serif; font-size: clamp(1.5rem, 3vw, 2rem); margin: 0; }

  .cp-section { margin-bottom: 2.25rem; }
  .cp-section h2 { font-size: 1.15rem; margin-bottom: 0.75rem; }
  .cp-section-sub { color: #64748b; font-size: 0.92rem; margin-bottom: 1.25rem; }
  .cp-form-card { border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.25rem; }
  .cp-job-form { display: flex; flex-direction: column; gap: 1rem; }
  .cp-job-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; }
  .cp-form-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }

  .cp-vagas-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; }
  .cp-vaga-card { border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; background: #fff; }
  .cp-vaga-card.active { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
  .cp-vaga-select { width: 100%; text-align: left; border: none; background: transparent; padding: 1rem; cursor: pointer; }
  .cp-vaga-title { font-weight: 700; margin-bottom: 0.35rem; }
  .cp-vaga-meta { color: #64748b; font-size: 0.85rem; }
  .cp-vaga-actions { display: flex; gap: 0.5rem; padding: 0 1rem 1rem; }
  .cp-mini-btn { border: 1px solid #e2e8f0; background: #fff; border-radius: 8px; padding: 0.35rem 0.65rem; font-size: 0.78rem; font-weight: 600; cursor: pointer; }
  .cp-mini-btn.danger { color: #dc2626; border-color: #fecaca; }

  .cp-candidatos-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; }
  .cp-candidato-card { position: relative; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1.1rem; text-align: center; background: #fff; }
  .cp-candidato-card.blurred .cp-candidato-name,
  .cp-candidato-card.blurred .cp-candidato-avatar { filter: blur(5px); user-select: none; }
  .cp-candidato-avatar { width: 52px; height: 52px; border-radius: 999px; margin: 0 auto 0.75rem; background: #eff6ff; color: #2563eb; display: flex; align-items: center; justify-content: center; font-weight: 700; }
  .cp-candidato-name { font-weight: 700; margin-bottom: 0.25rem; }
  .cp-candidato-match { color: #2563eb; font-size: 0.85rem; font-weight: 600; }
  .cp-candidato-skills { margin-top: 0.55rem; color: #64748b; font-size: 0.75rem; line-height: 1.35; }
  .cp-candidato-lock { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #64748b; }
  .cp-unlock-row { margin-top: 1.25rem; display: flex; gap: 0.75rem; flex-wrap: wrap; }
`;
