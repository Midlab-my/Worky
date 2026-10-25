import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import { CepField, validateCepLocation } from "../components/CepField";
import { useAuth } from "../context/AuthContext";
import {
  canUnlockCandidates,
  createCompanyJob,
  deleteCompanyJob,
  ensureCompanyProfileFromMetadata,
  fetchCompanyProfile,
  listCandidatesForJob,
  listCompanyJobs,
  updateCompanyJob,
  type CompanyCandidate,
  type CompanyJob,
  type CompanyJobModelo,
  type CompanyProfile,
} from "../services/company";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { LgpdDataModal } from "../components/LgpdDataModal";
import {
  INPUT_LIMITS,
  rejectWeakText,
  sanitizeMultiline,
  sanitizePlainText,
} from "../lib/input-security";
import { logAppError, toUserErrorMessage } from "../lib/user-error";

type JobFormState = {
  titulo: string;
  cep: string;
  local: string;
  modelo: CompanyJobModelo;
  requisitos: string;
  descricao: string;
};

type JobFieldErrors = {
  titulo?: string;
  local?: string;
  modelo?: string;
  requisitos?: string;
  descricao?: string;
};

const EMPTY_FORM: JobFormState = {
  titulo: "",
  cep: "",
  local: "",
  modelo: "Remoto",
  requisitos: "",
  descricao: "",
};

export function CompanyPanel() {
  const navigate = useNavigate();
  const { user, session, loading: authLoading, isAuthenticated, isCompanyAccount, signOut } = useAuth();

  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [jobs, setJobs] = useState<CompanyJob[]>([]);
  const [activeJobId, setActiveJobId] = useState<string>("");
  const [candidates, setCandidates] = useState<CompanyCandidate[]>([]);
  const [panelLoading, setPanelLoading] = useState(false);
  const [panelError, setPanelError] = useState("");
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [jobForm, setJobForm] = useState<JobFormState>(EMPTY_FORM);
  const [jobFieldErrors, setJobFieldErrors] = useState<JobFieldErrors>({});
  const [jobFormError, setJobFormError] = useState("");
  const [jobSaving, setJobSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | "signOut" | "deleteJob">(null);
  const [pendingDeleteJobId, setPendingDeleteJobId] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [showLgpdModal, setShowLgpdModal] = useState(false);

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
      let profile = await fetchCompanyProfile(session.accessToken, user.id);
      if (!profile) {
        profile = await ensureCompanyProfileFromMetadata(session.accessToken, user);
      }
      if (!profile) {
        setCompany(null);
        setPanelError("Esta conta não é de empresa. Cadastre-se como Empresa ou confirme o e-mail e entre de novo.");
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
      logAppError("falha ao carregar painel RH");
      setPanelError(toUserErrorMessage(error, "Não foi possível abrir o painel RH agora."));
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

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate("/auth?mode=login&tipo=empresa&next=%2Fempresa", { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const openCreateForm = () => {
    setEditingJobId(null);
    setJobForm(EMPTY_FORM);
    setJobFieldErrors({});
    setJobFormError("");
    setShowJobForm(true);
  };

  const openEditForm = (job: CompanyJob) => {
    setEditingJobId(job.id);
    setJobForm({
      titulo: job.titulo,
      cep: "",
      local: job.local,
      modelo: job.modelo,
      requisitos: job.requisitos,
      descricao: job.descricao,
    });
    setJobFieldErrors({});
    setJobFormError("");
    setShowJobForm(true);
  };

  const validateJobForm = (): JobFieldErrors => {
    const next: JobFieldErrors = {};
    next.titulo = rejectWeakText(jobForm.titulo, "Titulo", 5);

    // Em edicao, se ja tem cidade/UF salva e CEP vazio, mantem o local atual.
    if (!(editingJobId && jobForm.local.trim() && !jobForm.cep.trim())) {
      const localError = validateCepLocation(jobForm.cep, jobForm.local);
      if (localError) {
        next.local = localError;
      }
    }

    if (!jobForm.modelo) {
      next.modelo = "Selecione o modelo de trabalho.";
    }

    next.requisitos = rejectWeakText(jobForm.requisitos, "Requisitos", 8);
    next.descricao = rejectWeakText(jobForm.descricao, "Descricao", 20);

    // Remove chaves undefined pra Object.keys funcionar no submit.
    (Object.keys(next) as (keyof JobFieldErrors)[]).forEach((key) => {
      if (!next[key]) delete next[key];
    });

    return next;
  };

  const handleSaveJob = async (event: FormEvent) => {
    event.preventDefault();
    if (!session?.accessToken || !user?.id) {
      return;
    }

    const nextErrors = validateJobForm();
    setJobFieldErrors(nextErrors);
    setJobFormError("");
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setJobSaving(true);
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
      setJobFieldErrors({});
    } catch (error: unknown) {
      logAppError("falha ao salvar vaga");
      setJobFormError(toUserErrorMessage(error, "Nao foi possivel salvar a vaga."));
    } finally {
      setJobSaving(false);
    }
  };

  const requestDeleteJob = (jobId: string) => {
    setPendingDeleteJobId(jobId);
    setConfirmAction("deleteJob");
  };

  const handleDeleteJob = async () => {
    if (!session?.accessToken || !user?.id || !pendingDeleteJobId) {
      return;
    }
    const jobId = pendingDeleteJobId;
    setActionBusy(true);
    try {
      await deleteCompanyJob(session.accessToken, user.id, jobId);
      setJobs((current) => {
        const next = current.filter((job) => job.id !== jobId);
        setActiveJobId((active) => (active === jobId ? next[0]?.id || "" : active));
        return next;
      });
      setConfirmAction(null);
      setPendingDeleteJobId(null);
    } catch (error: unknown) {
      logAppError("falha ao remover vaga");
      setPanelError(toUserErrorMessage(error, "Nao foi possivel remover a vaga."));
      setConfirmAction(null);
    } finally {
      setActionBusy(false);
    }
  };

  const handleSignOut = async () => {
    setActionBusy(true);
    try {
      await signOut();
      setConfirmAction(null);
      navigate("/", { replace: true });
    } finally {
      setActionBusy(false);
    }
  };

  const confirmDialogs = (
    <>
      <ConfirmDialog
        open={confirmAction === "signOut"}
        title="Sair da conta?"
        description="Voce vai encerrar a sessao da empresa nesta conta Worky."
        confirmLabel="Sair"
        cancelLabel="Continuar logado"
        danger
        busy={actionBusy}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => void handleSignOut()}
      />
      <ConfirmDialog
        open={confirmAction === "deleteJob"}
        title="Excluir esta vaga?"
        description="A vaga sera removida do painel e deixa de aparecer para os candidatos."
        confirmLabel="Excluir vaga"
        cancelLabel="Manter vaga"
        danger
        busy={actionBusy}
        onCancel={() => {
          setConfirmAction(null);
          setPendingDeleteJobId(null);
        }}
        onConfirm={() => void handleDeleteJob()}
      />
    </>
  );

  if (authLoading || !isAuthenticated || (isAuthenticated && panelLoading && !company && !panelError)) {
    return (
      <div className="cp-root">
        <style>{style}</style>
        <SiteHeader badge="Empresa" showProfileAction={false} companyNav hideCompanyLink />
        <main className="cp-login-main">
          <p className="cp-muted">{!isAuthenticated ? "Redirecionando para o login..." : "Carregando painel..."}</p>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!company) {
    return (
      <>
        {confirmDialogs}
        <div className="cp-root">
          <style>{style}</style>
          <SiteHeader badge="Empresa" showProfileAction={false} companyNav hideCompanyLink />
          <main className="cp-login-main">
            <section className="cp-login-card">
              <div className="cp-login-kicker">Painel da Empresa</div>
              {isCompanyAccount ? (
                <>
                  <h1>Não foi possível abrir o painel</h1>
                  <p>
                    {panelError ||
                      "Sua conta empresa está ok, mas o perfil RH não abriu. Tente de novo."}
                  </p>
                </>
              ) : (
                <>
                  <h1>Esta conta não é de empresa</h1>
                  <p>
                    {panelError ||
                      "Entre com Sou Empresa no login ou crie uma conta empresa."}
                  </p>
                </>
              )}
              <div className="cp-login-actions">
                {isCompanyAccount ? (
                  <button type="button" className="cp-login-btn" onClick={() => void loadPanel()}>
                    Tentar de novo
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="cp-login-btn"
                      onClick={() => navigate("/auth?mode=login&tipo=empresa&next=%2Fempresa")}
                    >
                      Ir para o login
                    </button>
                    <button type="button" className="cp-link-btn" onClick={() => navigate("/auth?mode=register&tipo=empresa")}>
                      Criar conta empresa
                    </button>
                  </>
                )}
                <button type="button" className="cp-link-btn" onClick={() => setConfirmAction("signOut")}>
                  Sair desta conta
                </button>
              </div>
            </section>
          </main>
          <SiteFooter />
        </div>
      </>
    );
  }

  return (
    <>
      {confirmDialogs}
      <div className="cp-root">
      <style>{style}</style>
      <SiteHeader
        badge="Painel Empresa"
        showProfileAction={false}
        companyNav
        hideCompanyLink
        actions={
          <>
            <button
              type="button"
              className="ws-btn-ghost ws-lgpd-btn"
              onClick={() => setShowLgpdModal(true)}
              aria-label="Privacidade e LGPD"
            >
              <span className="ws-lgpd-text">Privacidade & LGPD</span>
            </button>
            <button type="button" className="ws-btn-danger" onClick={() => setConfirmAction("signOut")}>
              Sair
            </button>
          </>
        }
      />
      <LgpdDataModal isOpen={showLgpdModal} onClose={() => setShowLgpdModal(false)} />

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
                  maxLength={INPUT_LIMITS.title}
                  aria-invalid={Boolean(jobFieldErrors.titulo)}
                  onChange={(event) => {
                    const titulo = sanitizePlainText(event.target.value, INPUT_LIMITS.title);
                    setJobForm((current) => ({ ...current, titulo }));
                    setJobFieldErrors((current) => ({ ...current, titulo: undefined }));
                  }}
                  placeholder="Ex: Desenvolvedor React Pleno"
                />
                {jobFieldErrors.titulo && <p className="cp-login-error">{jobFieldErrors.titulo}</p>}
              </div>
              <div className="cp-job-grid">
                <CepField
                  id="job-cep"
                  className="cp-field"
                  label="CEP do local *"
                  value={jobForm.cep}
                  locationLabel={jobForm.local}
                  error={jobFieldErrors.local}
                  onCepChange={(cep) => {
                    setJobForm((current) => ({ ...current, cep }));
                    setJobFieldErrors((current) => ({ ...current, local: undefined }));
                  }}
                  onResolved={(locationLabel) => {
                    setJobForm((current) => ({ ...current, local: locationLabel }));
                    setJobFieldErrors((current) => ({ ...current, local: undefined }));
                  }}
                  onClearLocation={() => setJobForm((current) => ({ ...current, local: "" }))}
                />
                <div className="cp-field">
                  <label htmlFor="job-modelo">Modelo *</label>
                  <select
                    id="job-modelo"
                    value={jobForm.modelo}
                    aria-invalid={Boolean(jobFieldErrors.modelo)}
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
                  {jobFieldErrors.modelo && <p className="cp-login-error">{jobFieldErrors.modelo}</p>}
                </div>
              </div>
              <div className="cp-field">
                <label htmlFor="job-reqs">Requisitos *</label>
                <textarea
                  id="job-reqs"
                  rows={3}
                  value={jobForm.requisitos}
                  maxLength={INPUT_LIMITS.text}
                  aria-invalid={Boolean(jobFieldErrors.requisitos)}
                  onChange={(event) => {
                    const requisitos = sanitizeMultiline(event.target.value, INPUT_LIMITS.text);
                    setJobForm((current) => ({ ...current, requisitos }));
                    setJobFieldErrors((current) => ({ ...current, requisitos: undefined }));
                  }}
                  placeholder="Ex: React, TypeScript, SQL e 2 anos de experiencia"
                />
                {jobFieldErrors.requisitos && <p className="cp-login-error">{jobFieldErrors.requisitos}</p>}
              </div>
              <div className="cp-field">
                <label htmlFor="job-desc">Descricao *</label>
                <textarea
                  id="job-desc"
                  rows={4}
                  value={jobForm.descricao}
                  maxLength={INPUT_LIMITS.longText}
                  aria-invalid={Boolean(jobFieldErrors.descricao)}
                  onChange={(event) => {
                    const descricao = sanitizeMultiline(event.target.value, INPUT_LIMITS.longText);
                    setJobForm((current) => ({ ...current, descricao }));
                    setJobFieldErrors((current) => ({ ...current, descricao: undefined }));
                  }}
                  placeholder="Descreva o dia a dia da vaga, time e responsabilidades (min. 20 caracteres)"
                />
                {jobFieldErrors.descricao && <p className="cp-login-error">{jobFieldErrors.descricao}</p>}
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
                    setJobFieldErrors({});
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
                    <button type="button" className="cp-mini-btn danger" onClick={() => requestDeleteJob(item.id)}>
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

      <SiteFooter />
    </div>
    </>
  );
}

const style = `
  .cp-root {
    font-family: 'Inter', sans-serif;
    color: #0f172a;
    background: #ffffff;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  .cp-muted { color: #64748b; text-align: center; }
  .cp-banner { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; border-radius: var(--radius); padding: 0.85rem 1rem; margin-bottom: 1rem; font-size: 0.88rem; line-height: 1.45; text-align: left; }
  .cp-banner code { font-size: 0.8rem; }

  .cp-login-main {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem 1.5rem;
  }
  .cp-login-card { width: 100%; max-width: 440px; background: #fff; border: 1px solid #e2e8f0; border-radius: var(--radius); padding: 2.25rem; text-align: center; }
  .cp-login-kicker { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #2563eb; margin-bottom: 0.6rem; }
  .cp-login-card h1 { font-family: 'Sora', sans-serif; font-size: 1.6rem; font-weight: 800; margin-bottom: 0.5rem; }
  .cp-login-card p { color: #64748b; font-size: 0.9rem; margin-bottom: 1.5rem; }
  .cp-login-form { display: flex; flex-direction: column; gap: 1.1rem; text-align: left; }
  .cp-field label { display: block; font-size: 0.82rem; font-weight: 600; margin-bottom: 0.4rem; }
  .cp-field input, .cp-field select, .cp-field textarea {
    width: 100%; border: 1px solid #e2e8f0; border-radius: var(--radius); padding: 0.65rem 0.85rem; font-size: 0.9rem; box-sizing: border-box;
    font-family: inherit;
  }
  .cp-field input:focus, .cp-field select:focus, .cp-field textarea:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
  .cp-login-error { color: #dc2626; font-size: 0.85rem; margin: 0; }
  .cp-login-btn, .cp-btn-primary {
    border: none; background: #2563eb; color: #fff; font-weight: 700; border-radius: var(--radius); padding: 0.75rem 1rem; cursor: pointer;
  }
  .cp-login-btn:disabled, .cp-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
  .cp-login-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem 1.1rem;
    justify-content: center;
    align-items: center;
  }
  .cp-link-btn { border: none; background: transparent; color: #2563eb; font-weight: 600; cursor: pointer; padding: 0.75rem 0.4rem; }
  .cp-btn-ghost { border: 1px solid #cbd5e1; background: #fff; color: #0f172a; font-weight: 600; border-radius: var(--radius); padding: 0.7rem 1rem; cursor: pointer; }

  .cp-main { flex: 1; width: 100%; max-width: 1080px; margin: 0 auto; padding: 2rem 1.5rem 3rem; box-sizing: border-box; }
  .cp-welcome { display: flex; justify-content: space-between; gap: 1rem; align-items: center; flex-wrap: wrap; margin-bottom: 1.75rem; }
  .cp-welcome-label { font-size: 0.78rem; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.35rem; }
  .cp-welcome h1 { font-family: 'Sora', sans-serif; font-size: clamp(1.5rem, 3vw, 2rem); margin: 0; }

  .cp-section { margin-bottom: 2.25rem; }
  .cp-section h2 { font-size: 1.15rem; margin-bottom: 0.75rem; }
  .cp-section-sub { color: #64748b; font-size: 0.92rem; margin-bottom: 1.25rem; }
  .cp-form-card { border: 1px solid #e2e8f0; border-radius: var(--radius); padding: 1.25rem; }
  .cp-job-form { display: flex; flex-direction: column; gap: 1rem; }
  .cp-job-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; }
  .cp-form-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }

  .cp-vagas-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; }
  .cp-vaga-card { border: 1px solid #e2e8f0; border-radius: var(--radius); overflow: hidden; background: #fff; }
  .cp-vaga-card.active { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
  .cp-vaga-select { width: 100%; text-align: left; border: none; background: transparent; padding: 1rem; cursor: pointer; }
  .cp-vaga-title { font-weight: 700; margin-bottom: 0.35rem; }
  .cp-vaga-meta { color: #64748b; font-size: 0.85rem; }
  .cp-vaga-actions { display: flex; gap: 0.5rem; padding: 0 1rem 1rem; }
  .cp-mini-btn { border: 1px solid #e2e8f0; background: #fff; border-radius: var(--radius); padding: 0.35rem 0.65rem; font-size: 0.78rem; font-weight: 600; cursor: pointer; }
  .cp-mini-btn.danger { color: #dc2626; border-color: #fecaca; }

  .cp-candidatos-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; }
  .cp-candidato-card { position: relative; border: 1px solid #e2e8f0; border-radius: var(--radius); padding: 1.1rem; text-align: center; background: #fff; }
  .cp-candidato-card.blurred .cp-candidato-name,
  .cp-candidato-card.blurred .cp-candidato-avatar { filter: blur(5px); user-select: none; }
  .cp-candidato-avatar { width: 52px; height: 52px; border-radius: 50%; margin: 0 auto 0.75rem; background: #eff6ff; color: #2563eb; display: flex; align-items: center; justify-content: center; font-weight: 700; }
  .cp-candidato-name { font-weight: 700; margin-bottom: 0.25rem; }
  .cp-candidato-match { color: #2563eb; font-size: 0.85rem; font-weight: 600; }
  .cp-candidato-skills { margin-top: 0.55rem; color: #64748b; font-size: 0.75rem; line-height: 1.35; }
  .cp-candidato-lock { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #64748b; }
  .cp-unlock-row { margin-top: 1.25rem; display: flex; gap: 0.75rem; flex-wrap: wrap; }
`;
