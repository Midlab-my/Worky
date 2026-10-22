import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  buildCareerSearchKey,
  readCachedAnalysis,
  readLastCareerSearch,
  writeCachedAnalysis,
  writeLastCareerSearch,
} from "../lib/career-search-cache";
import { type CareerAnalysis, type CareerOpportunity, jobService, profileService, type ProfileMatchResult } from "../services/api";
import { AdSlot } from "../components/AdSlot";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import { ReferralCard } from "../components/ReferralCard";
import { useAuth } from "../context/AuthContext";
import { logAppError, toUserErrorMessage } from "../lib/user-error";
import { fetchProfessionalProfile } from "./Profile";
import {
  brandInitials,
  brandLogoUrl,
  buildCertOpenUrl,
  resolvePlatformBrand,
} from "../lib/platform-brand";
import {
  getMatchQuota,
  getReferralLink,
  grantBonusMatches,
  registerMatchUsage,
  MATCH_FREE_LIMIT,
  REFERRAL_BONUS_MATCHES,
  type MatchQuota,
} from "../services/referral";

type ExitModalProps = {
  onCancel: () => void;
  onContinue: () => void;
};

const ExitIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="#003ec7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

function ExitModal({ onCancel, onContinue }: ExitModalProps) {
  return (
    <div className="wm-backdrop" onClick={onCancel}>
      <div
        className="wm-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="wm-body">
          <div className="wm-icon-wrap">
            <ExitIcon />
          </div>
          <h2 id="exit-modal-title" className="wm-title">Saindo da Worky</h2>
          <p className="wm-description">
            A vaga abre no site original. A Worky não responde pelo conteúdo de fora.
          </p>
        </div>

        <div className="wm-footer">
          <button type="button" className="btn-continue" onClick={onContinue}>
            Continuar
          </button>
          <button type="button" className="btn-cancel" onClick={onCancel}>
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}

const JOB_REPORT_REASONS = [
  "Requisitos não batem",
  "Salário errado",
  "Vaga duplicada",
  "Link quebrado",
  "Local ou formato errado",
  "Conteúdo suspeito",
  "Outro",
];

type JobReportTarget = {
  job: CareerOpportunity;
  key: string;
};

const getJobReportKey = (job: CareerOpportunity, index: number) =>
  [job.link, job.titulo, job.empresa, String(index)].filter(Boolean).join("|");

type JobReportModalProps = {
  details: string;
  job: CareerOpportunity;
  onClose: () => void;
  onDetailsChange: (value: string) => void;
  onReasonChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  reason: string;
  submitted: boolean;
};

function JobReportModal({
  details,
  job,
  onClose,
  onDetailsChange,
  onReasonChange,
  onSubmit,
  reason,
  submitted,
}: JobReportModalProps) {
  return (
    <div className="wm-backdrop" onClick={onClose}>
      <div
        className="wm-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        {submitted ? (
          <>
            <div className="wm-body">
              <div className="wm-icon-wrap" style={{ color: "#16a34a", background: "#dcfce7" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 id="report-modal-title" className="wm-title">Aviso enviado</h2>
              <p className="wm-description">Vamos conferir essa vaga.</p>
            </div>
            <div className="wm-footer">
              <button type="button" className="btn-continue" onClick={onClose}>Fechar</button>
            </div>
          </>
        ) : (
          <form onSubmit={onSubmit}>
            <div className="wm-body">
              <div className="wm-icon-wrap" style={{ color: "#dc2626", background: "#fef2f2" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
              </div>
              <h2 id="report-modal-title" className="wm-title">Reportar vaga</h2>
              <p className="wm-description">Diga o que está errado. A gente revisa.</p>
              <div className="wm-job">
                <div className="wm-job-title">{job.titulo}</div>
                <div className="wm-job-sub">{job.empresa || "Empresa confidencial"}</div>
              </div>
              <div className="wm-fields">
                <div className="wm-field">
                  <label htmlFor="report-reason" className="wm-label">Motivo</label>
                  <select
                    id="report-reason"
                    className="wm-select"
                    value={reason}
                    required
                    onChange={(event) => onReasonChange(event.target.value)}
                  >
                    {JOB_REPORT_REASONS.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>
                <div className="wm-field">
                  <label htmlFor="report-details" className="wm-label">Detalhes <span>opcional</span></label>
                  <textarea
                    id="report-details"
                    className="wm-textarea"
                    value={details}
                    maxLength={1000}
                    onChange={(event) => onDetailsChange(event.target.value)}
                    placeholder="O que você viu de errado?"
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <div className="wm-footer">
              <button type="submit" className="btn-continue">Enviar</button>
              <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function MatchAuthModal({ onCancel, onContinue }: { onCancel: () => void; onContinue: () => void }) {
  return (
    <div className="wm-backdrop" onClick={onCancel}>
      <div
        className="wm-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="match-auth-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="wm-body">
          <div className="wm-icon-wrap" style={{ color: "#003ec7", background: "#eff2ff" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h2 id="match-auth-title" className="wm-title">Login necessário</h2>
          <p className="wm-description">
            O match compara o seu perfil com o que o mercado pede nesta carreira.
            Entre na conta, complete as informações e volte aqui para calcular.
          </p>
        </div>
        <div className="wm-footer">
          <button type="button" className="btn-continue" onClick={onContinue}>
            Ir para o perfil
          </button>
          <button type="button" className="btn-cancel" onClick={onCancel}>
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');

.ha-app, .ha-app *, .ha-app *::before, .ha-app *::after { box-sizing: border-box; }
.ha-app h1, .ha-app h2, .ha-app h3, .ha-app p, .ha-app ul, .ha-app ol { margin: 0; padding: 0; }

.ha-app {
  --primary: #003ec7;
  --primary-container: #0052ff;
  --primary-light: #dde1ff;
  --primary-muted: #eff2ff;
  --surface: #f8f9fa;
  --surface-low: #f3f4f5;
  --surface-card: #ffffff;
  --surface-highest: #e1e3e4;
  --on-surface: #191c1d;
  --on-surface-muted: #434656;
  --outline: #e2e8f0;
  --tertiary: #005858;
  --tertiary-light: #e0f7f7;
  --secondary: #4459a8;
  --radius-sm: var(--radius);
  --radius-md: var(--radius);
  --radius-lg: var(--radius);
  --radius-xl: var(--radius);
  font-family: 'Inter', sans-serif;
  background: #ffffff;
  color: var(--on-surface);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.ha-app.is-loading { background: #ffffff; }

.ha-topnav {
  position: sticky; top: 0; z-index: 50;
  display: flex; justify-content: space-between; align-items: center;
  padding: 0 2rem; height: 60px;
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #e2e8f0;
}
.ha-logo { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 1.1rem; color: var(--primary); text-decoration: none; background: none; border: none; cursor: pointer; }
.ha-nav-links { display: flex; gap: 2rem; align-items: center; }
.ha-nav-link { background: none; border: none; font-family: 'Inter', sans-serif; font-size: 0.875rem; color: #64748b; text-decoration: none; cursor: pointer; }
.ha-nav-link:hover { color: var(--primary); }
.ha-nav-link.active { color: #2563eb; font-weight: 500; border-bottom: 2px solid #2563eb; padding-bottom: 2px; }
.ha-nav-actions { display: flex; gap: 0.75rem; align-items: center; }
.btn-ghost-nav { background: none; border: none; padding: 0.4rem 1rem; border-radius: var(--radius-md); color: var(--on-surface-muted); font-size: 0.875rem; font-weight: 500; cursor: pointer; }
.btn-ghost-nav:hover { background: var(--surface-highest); }
.btn-primary-nav { background: var(--primary-container); color: white; border: none; padding: 0.45rem 1.3rem; border-radius: var(--radius); font-size: 0.875rem; font-weight: 600; cursor: pointer; box-shadow: 0 2px 8px rgba(0,82,255,0.3); }
.btn-primary-nav:hover { opacity: 0.92; }
.btn-profile-avatar {
  width: 38px; height: 38px; padding: 0; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  font-weight: 800; letter-spacing: 0;
}

.ha-layout { display: flex; flex: 1; }

.ha-sidebar {
  width: 240px; flex-shrink: 0;
  background: var(--surface-low);
  min-height: calc(100vh - 64px);
  padding: 1.5rem 1rem;
  display: flex; flex-direction: column;
  position: sticky; top: 64px; height: calc(100vh - 64px); overflow-y: auto;
}
.ha-sidenav { display: flex; flex-direction: column; gap: 4px; }
.ha-sidelink {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: var(--radius-sm);
  color: var(--on-surface-muted); font-size: 0.875rem; font-weight: 500;
  cursor: pointer; text-decoration: none; transition: all 0.15s; background: none; border: none; font-family: 'Inter', sans-serif; text-align: left;
}
.ha-sidelink:hover { background: var(--surface-highest); color: var(--on-surface); }
.ha-sidelink.active { background: var(--primary-light); color: var(--primary); font-weight: 600; }
.ha-sidelink.active svg { color: var(--primary); }
.ha-premium-card {
  margin-top: auto; background: white; border-radius: var(--radius-md);
  border: 1px solid var(--outline); padding: 1rem;
}
.ha-premium-label { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--on-surface-muted); margin-bottom: 0.6rem; }
.btn-novo-alerta { width: 100%; background: var(--primary); color: white; border: none; padding: 0.5rem; border-radius: var(--radius-sm); font-size: 0.8rem; font-weight: 600; cursor: pointer; }
.btn-novo-alerta:hover { background: #002fa3; }

.ha-main { flex: 1; padding: 1.25rem 1.5rem 3rem; min-width: 0; }
.ha-content { max-width: 64rem; width: 100%; margin: 0 auto; }

.ha-breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--on-surface-muted); margin-bottom: 1rem; }
.ha-breadcrumb-link { cursor: pointer; background: none; border: none; color: inherit; font: inherit; }
.ha-breadcrumb-link:hover { color: var(--primary); }
.ha-breadcrumb-active { color: var(--primary); font-weight: 500; }

.ha-lead { margin-bottom: 1.5rem; }
.ha-page-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: clamp(2.15rem, 5vw, 3rem);
  font-weight: 800; line-height: 1.1;
  letter-spacing: -0.03em;
  color: var(--on-surface); margin: 0 0 0.55rem;
}
.ha-page-title .accent { color: var(--primary); }
.ha-desc-kicker {
  font-size: 0.68rem; font-weight: 600; letter-spacing: 0.06em;
  text-transform: uppercase; color: #64748b; margin-bottom: 0.2rem;
}
.ha-desc-text {
  font-size: 0.92rem; color: #475569; line-height: 1.65; max-width: none;
  text-align: justify; text-justify: inter-word; hyphens: auto;
}
.ha-filters { display: flex; flex-wrap: wrap; gap: 8px; margin: 0.55rem 0 0.85rem; }
.ha-filter-chip {
  display: inline-flex; align-items: center;
  padding: 4px 10px;
  background: #f1f5f9; color: #334155;
  border: 1px solid #e2e8f0;
  border-radius: var(--radius);
  font-size: 0.78rem; font-weight: 600;
}

.ha-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.85rem; margin-bottom: 1.35rem; }
.ha-stat-card {
  position: relative;
  overflow: hidden;
  background: white;
  border: 1px solid var(--outline);
  border-radius: var(--radius);
  padding: 1rem 1.15rem 1.05rem 1.25rem;
  display: flex; flex-direction: column;
  min-height: 8.25rem;
}
.ha-stat-card::before {
  content: "";
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 4px;
}
.ha-stat-card:nth-child(1) { background: #eff6ff; border-color: #bfdbfe; }
.ha-stat-card:nth-child(1)::before { background: #2563eb; }
.ha-stat-card:nth-child(2) { background: #f0fdfa; border-color: #99f6e4; }
.ha-stat-card:nth-child(2)::before { background: #14b8a6; }
.ha-stat-card:nth-child(3) { background: #fffbeb; border-color: #fde68a; }
.ha-stat-card:nth-child(3)::before { background: #f59e0b; }
.ha-stat-label { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; color: #64748b; }
.ha-stat-caption { font-size: 0.75rem; line-height: 1.4; margin-top: 0.45rem; color: #64748b; }
.ha-stat-value { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.28rem; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 6px; letter-spacing: -0.02em; line-height: 1.2; }
.ha-stat-unit { font-size: 0.75rem; font-weight: 600; color: #64748b; }
.ha-stat-dots { display: flex; gap: 4px; margin-top: auto; padding-top: 0.7rem; }
.ha-dot { width: 8px; height: 8px; border-radius: 50%; background: #bfdbfe; }
.ha-dot.is-on { background: #2563eb; }
.ha-stat-meter { display: flex; gap: 5px; margin-top: auto; padding-top: 0.7rem; align-items: flex-end; height: 28px; }
.ha-stat-meter span { width: 7px; border-radius: 2px; background: #ccfbf1; }
.ha-stat-meter span.is-on { background: #14b8a6; }
.ha-stat-spark { margin-top: auto; padding-top: 0.55rem; overflow: visible; }
.ha-stat-spark svg { display: block; overflow: visible; }

.ha-section { margin-bottom: 2.15rem; }
.ha-section-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.02rem; font-weight: 700; color: var(--on-surface); margin-bottom: 0.8rem; }

.ha-split { display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; }
.ha-panel {
  background: white;
  border: 1px solid var(--outline);
  border-radius: var(--radius);
  padding: 1rem 1.05rem 1.05rem;
}
.ha-panel-label { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #64748b; margin-bottom: 0.7rem; }
.ha-skill-tags { display: flex; flex-wrap: wrap; gap: 7px; }
.ha-skill-tag { font-size: 0.8rem; border: 1px solid var(--outline); border-radius: var(--radius); padding: 5px 10px; color: #334155; background: #fff; cursor: default; line-height: 1.3; }

.ha-certs-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.85rem; }
.ha-cert-card {
  background: white;
  border: 1px solid var(--outline);
  border-radius: var(--radius);
  padding: 0.85rem 0.95rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  text-align: left;
  font-family: inherit;
  cursor: pointer;
}
.ha-cert-card:hover { border-color: #93c5fd; }
.ha-cert-card:hover .ha-cert-name { color: #2563eb; }
.ha-cert-logo {
  width: 36px;
  height: 36px;
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  flex-shrink: 0;
  overflow: hidden;
}
.ha-cert-logo img { width: 28px; height: 28px; object-fit: contain; display: block; }
.ha-cert-text { min-width: 0; width: 100%; }
.ha-cert-name { font-size: 0.82rem; font-weight: 700; color: var(--on-surface); line-height: 1.35; }
.ha-cert-sub { display: none; }
.ha-cert-issuer { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 4px; }

.ha-jobs-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem; }
.ha-ver-todas { background: none; border: none; font-family: 'Inter', sans-serif; font-size: 0.8rem; font-weight: 500; color: var(--primary); cursor: pointer; }
.ha-ver-todas:hover { text-decoration: underline; }
.ha-jobs-list { display: flex; flex-direction: column; gap: 1px; background: var(--outline); border-radius: var(--radius); overflow: hidden; border: 1px solid var(--outline); }
.ha-job-card {
  background: white; padding: 1rem 1.15rem;
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-areas:
    "head actions"
    "meta actions";
  align-items: center;
  column-gap: 1rem;
  row-gap: 0.4rem;
  width: 100%; font-family: 'Inter', sans-serif; text-align: left;
}
.ha-job-card:hover { background: var(--surface-low); }
.ha-job-head {
  grid-area: head;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-width: 0;
}
.ha-job-logo { width: 40px; height: 40px; border-radius: var(--radius-sm); overflow: hidden; flex-shrink: 0; background: var(--surface-highest); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.7rem; color: var(--on-surface-muted); }
.ha-job-info { flex: 1; min-width: 0; }
.ha-job-title { font-size: 0.9rem; font-weight: 700; color: var(--on-surface); line-height: 1.3; }
.ha-job-source-badge {
  display: inline-flex; align-items: center; border-radius: var(--radius);
  padding: 2px 8px; font-size: 0.65rem; font-weight: 800; letter-spacing: 0.04em;
  text-transform: uppercase; background: #f1f5f9; color: #475569;
}
.ha-job-meta { grid-area: meta; display: flex; flex-wrap: wrap; gap: 4px 12px; }
.ha-job-tag { display: flex; align-items: center; gap: 3px; font-size: 0.75rem; color: var(--on-surface-muted); }
.ha-job-card-actions {
  grid-area: actions;
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
  min-width: 16.5rem;
}
.btn-ver-vaga,
.btn-reportar-vaga {
  display: inline-flex; align-items: center; justify-content: center; gap: 5px;
  width: 100%; height: 36px; padding: 0 0.7rem;
  border-radius: var(--radius); font-size: 0.78rem; font-weight: 600;
  cursor: pointer; white-space: nowrap; font-family: inherit;
}
.btn-ver-vaga { background: #2563eb; color: white; border: 1px solid #2563eb; }
.btn-ver-vaga:hover { background: #1d4ed8; border-color: #1d4ed8; }
.btn-reportar-vaga { background: white; color: #475569; border: 1px solid #cbd5e1; }
.btn-reportar-vaga:hover { background: #f8fafc; color: #0f172a; border-color: #94a3b8; }
.btn-reportar-vaga.reported { background: #f8fafc; color: #64748b; border-color: #e2e8f0; cursor: default; }
.ver-mais-btn { display: flex; align-items: center; gap: 6px; margin-top: 0.75rem; background: none; border: 1px solid var(--outline); border-radius: var(--radius-sm); padding: 0.5rem 1rem; font-size: 0.82rem; font-weight: 600; color: var(--primary); cursor: pointer; width: 100%; justify-content: center; }
.ver-mais-btn:hover { background: var(--surface-low); }

.ha-courses-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.85rem; }
.ha-course-card {
  background: white; border: 1px solid var(--outline); border-radius: var(--radius);
  cursor: pointer; text-align: left; padding: 0.85rem 0.95rem;
  font-family: 'Inter', sans-serif; width: 100%;
  display: flex; flex-direction: row; align-items: center; gap: 0.75rem;
}
.ha-course-card:hover { border-color: #93c5fd; }
.ha-course-card:hover .ha-course-title { color: #2563eb; }
.ha-course-card:disabled { cursor: not-allowed; opacity: 0.55; }
.ha-course-card:disabled:hover { border-color: var(--outline); }
.ha-course-card:disabled:hover .ha-course-title { color: inherit; }
.ha-course-logo {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.ha-course-logo img { width: 28px; height: 28px; object-fit: contain; display: block; }
.ha-course-thumb-fallback { font-size: 0.8rem; font-weight: 800; letter-spacing: -0.02em; }
.ha-course-body { display: flex; flex-direction: column; flex: 1; min-width: 0; width: 100%; padding: 0; }
.ha-course-platform { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 4px; }
.ha-course-title { font-size: 0.84rem; font-weight: 700; color: var(--on-surface); line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.ha-course-reason { display: none; }
.ha-course-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 0.45rem; padding-top: 0; width: 100%; }
.ha-course-area-badge { font-size: 0.66rem; font-weight: 600; padding: 2px 7px; border-radius: var(--radius); background: #f8fafc; color: #64748b; }
.ha-course-price { font-size: 0.82rem; font-weight: 700; }

.ha-salary-card {
  background: #0d9488; border: 1px solid #0d9488; color: white;
  border-radius: var(--radius); padding: 1.15rem 1.25rem 1.1rem;
  margin-bottom: 2.15rem;
}
.ha-salary-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.95rem; font-weight: 700; margin-bottom: 0.95rem; color: white; }
.ha-salary-list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
.ha-salary-item { min-width: 0; }
.ha-salary-level {
  display: flex; align-items: center; gap: 7px;
  font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.08em; color: rgba(255,255,255,0.75);
}
.ha-salary-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: rgba(255,255,255,0.4); flex-shrink: 0;
}
.ha-salary-item.active .ha-salary-dot { background: #fff; }
.ha-salary-item.active .ha-salary-level { color: white; }
.ha-salary-range { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 1.05rem; color: rgba(255,255,255,0.92); margin: 6px 0 0; }
.ha-salary-item.active .ha-salary-range { color: white; }
.ha-salary-note {
  margin-top: 0.9rem; font-size: 0.72rem; color: rgba(255,255,255,0.78);
  line-height: 1.45;
}

.ha-demanda-card {
  background: #0f172a; border: 1px solid #1e293b; color: white;
  border-radius: var(--radius); padding: 1.05rem 1.2rem 1.05rem;
  margin-bottom: 0.85rem;
}
.ha-demanda-list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem 1.25rem; }
.ha-demanda-meta { display: flex; justify-content: space-between; gap: 8px; font-size: 0.75rem; font-weight: 500; margin-bottom: 6px; color: #e2e8f0; }
.ha-demanda-meta span:first-child { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ha-demanda-track { height: 6px; background: #1e293b; border-radius: var(--radius); overflow: hidden; }
.ha-demanda-fill { height: 100%; background: #14b8a6; border-radius: var(--radius); }

.ha-career-loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 1rem;
  min-height: 100dvh;
  padding: 2rem;
  background: #ffffff;
}
.ha-career-loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--primary-light);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: ha-career-spin 1s linear infinite;
}
.ha-career-loading-text {
  color: var(--on-surface-muted);
  font-weight: 500;
  text-align: center;
  max-width: 28rem;
  line-height: 1.5;
}
@keyframes ha-career-spin { to { transform: rotate(360deg); } }
.ha-footer-logo { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 0.95rem; color: var(--primary); margin-bottom: 4px; }
.ha-footer-copy { font-size: 0.75rem; color: var(--on-surface-muted); max-width: 220px; line-height: 1.5; }
.ha-footer-links { display: flex; gap: 1.5rem; align-items: center; }
.ha-footer-link { background: none; border: none; font-family: 'Inter', sans-serif; font-size: 0.82rem; font-weight: 500; color: var(--on-surface-muted); cursor: pointer; text-decoration: none; }
.ha-footer-link:hover { color: var(--primary); }
.ha-footer-icons { display: flex; gap: 8px; }
.ha-footer-icon { width: 32px; height: 32px; border-radius: 50%; background: var(--surface-highest); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--on-surface-muted); }
.ha-footer-icon:hover { color: var(--primary); }

.wm-backdrop {
  position: fixed; inset: 0; z-index: 100;
  display: flex; align-items: center; justify-content: center; padding: 1rem;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(5px);
  animation: wm-fade-in 0.2s ease;
}

@keyframes wm-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.wm-card {
  background: #ffffff;
  width: 100%; max-width: 420px;
  max-height: min(90dvh, 640px);
  overflow: auto;
  border-radius: var(--radius);
  border: 1px solid rgba(195, 197, 217, 0.35);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.18);
  text-align: left;
  animation: wm-zoom-in 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes wm-zoom-in {
  from { opacity: 0; transform: scale(0.92) translateY(10px); }
  to   { opacity: 1; transform: scale(1)    translateY(0);    }
}

.wm-body { padding: 1.5rem 1.35rem 1.2rem; }

.wm-icon-wrap {
  width: 44px; height: 44px; border-radius: 50%;
  background: rgba(0, 62, 199, 0.09);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 0.9rem;
}

.wm-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 1.15rem; font-weight: 800;
  color: #191c1d; letter-spacing: -0.025em;
  margin-bottom: 0.4rem;
  line-height: 1.25;
}

.wm-description {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem; font-weight: 400;
  color: #52525b; line-height: 1.55;
  text-align: left;
}

.wm-job {
  margin: 0.9rem 0 0;
  padding: 0.7rem 0.8rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: var(--radius);
}
.wm-job-title {
  font-size: 0.84rem; font-weight: 700;
  color: #0f172a; line-height: 1.35;
}
.wm-job-sub {
  margin-top: 2px;
  font-size: 0.75rem; color: #64748b;
}

.wm-fields { display: flex; flex-direction: column; gap: 0.85rem; margin-top: 1rem; }
.wm-field { display: flex; flex-direction: column; gap: 0.4rem; }
.wm-label {
  font-size: 0.78rem; font-weight: 600; color: #334155;
}
.wm-label span { font-weight: 500; color: #94a3b8; }
.wm-select, .wm-textarea {
  width: 100%; box-sizing: border-box;
  padding: 0.7rem 0.8rem;
  border-radius: var(--radius);
  border: 1px solid #cbd5e1;
  background: #fff;
  font-size: 0.88rem; color: #0f172a;
  font-family: inherit; outline: none;
}
.wm-select {
  appearance: none;
  -webkit-appearance: none;
  padding-right: 2.2rem;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='none' stroke='%2364748b' stroke-width='1.6' stroke-linecap='round' d='M1 1.5L6 6.5 11 1.5'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.8rem center;
  background-size: 12px;
}
.wm-textarea { resize: none; min-height: 5.2rem; line-height: 1.45; }
.wm-select:focus, .wm-textarea:focus { border-color: #2563eb; }

.wm-footer {
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  padding: 0.85rem 1.35rem 1.05rem;
  display: flex; flex-direction: row-reverse;
  gap: 8px;
}

.btn-continue {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem; font-weight: 700;
  background: #003ec7; color: #ffffff;
  border: none; border-radius: var(--radius);
  padding: 0.7rem 1.1rem;
  cursor: pointer; flex: 1;
  transition: background 0.15s, transform 0.1s;
}
.btn-continue:hover  { background: #0052ff; }
.btn-continue:active { transform: scale(0.97); }

.btn-cancel {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem; font-weight: 700;
  background: #fff; color: #475569;
  border: 1px solid #cbd5e1; border-radius: var(--radius);
  padding: 0.7rem 1.1rem;
  cursor: pointer; flex: 1;
  transition: background 0.15s;
}
.btn-cancel:hover { background: #f1f5f9; color: #0f172a; }

@media (max-width: 640px) {
  .wm-backdrop { padding: 0.75rem; align-items: flex-end; }
  .wm-card { max-width: none; max-height: min(92dvh, 680px); border-radius: 12px 12px 8px 8px; }
  .wm-body { padding: 1.25rem 1.1rem 1rem; }
  .wm-footer {
    flex-direction: column;
    padding: 0.85rem 1.1rem 1.1rem;
  }
  .btn-continue, .btn-cancel { width: 100%; flex: none; }
}

@media (max-width: 900px) {
  .ha-courses-grid, .ha-certs-grid { grid-template-columns: 1fr 1fr; }
  .ha-split { grid-template-columns: 1fr; }
  .ha-salary-list, .ha-demanda-list { grid-template-columns: 1fr; }
}
@media (max-width: 700px) {
  .ha-courses-grid { grid-template-columns: 1fr; }
  .ha-stats { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .ha-topnav { height: auto; min-height: 60px; padding: 0.85rem 1rem; flex-wrap: wrap; gap: 0.75rem; }
  .ha-topnav > div:first-child { flex-wrap: wrap; gap: 1rem !important; }
  .ha-sidebar { display: none; }
  .ha-main { padding: 1.15rem 1rem 1.1rem; }
  .ha-desc-text { padding-right: 0; }
  .ha-split, .ha-certs-grid, .ha-courses-grid { grid-template-columns: 1fr; }
  .ha-job-card {
    grid-template-columns: 1fr;
    grid-template-areas:
      "head"
      "meta"
      "actions";
    align-items: stretch;
    padding: 0.9rem 1rem;
  }
  .ha-job-card-actions { width: 100%; min-width: 0; margin-top: 0.25rem; }
  .ha-section { margin-bottom: 1.4rem; }
  .ha-content > .ha-section:last-child { margin-bottom: 0.25rem; }
  .ha-salary-card { margin-bottom: 1.4rem; }
  .ha-job-meta { padding-left: 0; }
  .ha-course-card { padding: 0.8rem 0.9rem; }
  .ha-cert-card { padding: 0.8rem 0.9rem; }
  .ha-course-footer { margin-top: 0.3rem; padding-top: 0; }
  .ha-app .ws-ad-wrap--footer { padding: 0.75rem 1rem 0.85rem; }
}

.mp-card {
  width: 100%;
  background: #2563eb;
  border: 1px solid #2563eb;
  border-radius: var(--radius);
  padding: 1.15rem 1.3rem;
  color: #fff;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 2.15rem;
}

.mp-copy { min-width: 0; flex: 1; }
.mp-header {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 0.45rem;
}
.mp-badge-icon {
  width: 22px; height: 22px;
  display: flex; align-items: center; justify-content: center;
  color: #fff;
}
.mp-label {
  font-family: 'Inter', sans-serif;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: rgba(255,255,255,0.78);
}

.mp-idle-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 1.05rem; font-weight: 800;
  line-height: 1.3; color: #fff;
  margin-bottom: 0.3rem;
}
.mp-idle-sub {
  font-family: 'Inter', sans-serif;
  font-size: 0.8rem; color: rgba(255,255,255,0.8);
  line-height: 1.5;
}

.mp-loading-area {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.mp-spinner {
  width: 22px; height: 22px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.28);
  border-top-color: #fff;
  animation: mp-spin 0.85s linear infinite;
}
@keyframes mp-spin { to { transform: rotate(360deg); } }
.mp-loading-text {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 0.9rem; font-weight: 700;
  color: #fff;
}
.mp-loading-sub {
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem; color: rgba(255,255,255,0.7);
  line-height: 1.5;
}

.mp-ring-wrap {
  position: relative;
  margin-bottom: 1rem;
  flex-shrink: 0;
}
.mp-ring-bg   { stroke: rgba(255,255,255,0.15); }
.mp-ring-fill {
  stroke: #fff;
  stroke-linecap: round;
  transition: stroke-dasharray 1.6s cubic-bezier(0.34, 1.2, 0.64, 1);
}
.mp-ring-inner {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
}
.mp-pct {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 2.2rem; font-weight: 900;
  color: #fff; line-height: 1;
  letter-spacing: -0.04em;
}
.mp-pct-sym {
  font-size: 0.82rem; font-weight: 700;
  color: rgba(255,255,255,0.6); line-height: 1; margin-top: 2px;
}
.mp-result-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 0.92rem; font-weight: 800;
  line-height: 1.35; color: #fff;
  margin-bottom: 5px;
}
.mp-result-sub {
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem; color: rgba(255,255,255,0.72);
  line-height: 1.5;
  margin-bottom: 1rem;
}
.mp-tags {
  display: flex; flex-wrap: wrap;
  gap: 5px;
  margin-top: 0.7rem;
}
.mp-tag {
  font-family: 'Inter', sans-serif;
  font-size: 0.67rem; font-weight: 600;
  background: rgba(255,255,255,0.15);
  color: rgba(255,255,255,0.92);
  padding: 3px 10px; border-radius: var(--radius);
  border: 1px solid rgba(255,255,255,0.22);
}
.mp-tag.gap {
  background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.38);
  border-color: rgba(255,255,255,0.1);
}

.mp-btn {
  flex-shrink: 0;
  min-width: 11.5rem;
  background: #fff; color: #1d4ed8;
  border: none; border-radius: var(--radius);
  padding: 0.7rem 1.1rem;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 0.88rem; font-weight: 800;
  cursor: pointer;
}
.mp-btn:hover  { background: #eff6ff; }
.mp-actions { display: flex; flex-direction: column; align-items: stretch; gap: 0.35rem; flex-shrink: 0; }
.mp-btn-sm {
  background: transparent;
  color: rgba(255,255,255,0.55);
  border: none; font-family: 'Inter', sans-serif;
  font-size: 0.72rem; font-weight: 600;
  cursor: pointer; margin-top: 0.6rem;
  text-decoration: underline; text-underline-offset: 3px;
  position: relative; z-index: 2;
  transition: color 0.15s;
}
.mp-btn-sm:hover { color: rgba(255,255,255,0.85); }

@media (max-width: 700px) {
  .mp-card {
    flex-direction: column;
    align-items: stretch;
    gap: 0.85rem;
    padding: 1rem 1.05rem;
    margin-bottom: 1.5rem;
  }
  .mp-label { white-space: nowrap; }
  .mp-idle-title { font-size: 0.98rem; margin-bottom: 0.2rem; }
  .mp-idle-sub { font-size: 0.78rem; }
  .mp-btn, .mp-actions { width: 100%; min-width: 0; }
}
`;

type DisplayCourse = {
  plataforma: string;
  nome: string;
  preco?: string;
  url?: string;
  area?: string;
  motivo?: string;
  tag?: string;
  destaqueWorky?: boolean;
};

type DisplayCert = {
  empresa: string;
  nome: string;
  descricao: string;
  url?: string;
};

const JOBS_PREVIEW_LIMIT = 6;

function getInitials(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "AI";
  return words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join("");
}

function colorFromText(text: string) {
  const palette = ["#1e293b", "#374151", "#4f46e5", "#005858", "#003ec7", "#7c3aed"];
  const total = Array.from(text || "AI").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palette[total % palette.length];
}

function splitCareerName(name: string) {
  const words = name.replace(/;/g, " ").trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return { prefix: words.join(" "), accent: "" };
  return {
    prefix: words.slice(0, -1).join(" "),
    accent: words[words.length - 1],
  };
}

function formatSalaryRange(min: number, max: number) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return "Consultar";

  const formatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
  const roundSalary = (value: number) => Math.round(value / 100) * 100;
  const lower = Math.max(0, roundSalary(Math.min(min, max)));
  const upper = Math.max(lower, roundSalary(Math.max(min, max)));

  if (lower === upper) return formatter.format(lower);
  return `${formatter.format(lower)} a ${formatter.format(upper)}`;
}

function parseSalaryValues(text: string) {
  const isAnnual = /\b(ano|anual|a\.a\.?)\b/i.test(text);
  const matches = [...text.matchAll(/(\d+(?:[.,]\d+)?)(?:\s*(mil|k))?/gi)];

  return matches
    .map((match) => {
      const rawValue = match[1] || "";
      const unit = match[2];
      const normalized = rawValue.replace(/\./g, "").replace(/,/g, ".");
      let value = Number.parseFloat(normalized);

      if (!Number.isFinite(value)) {
        return null;
      }

      if (unit || (value > 0 && value < 100)) {
        value *= 1000;
      }

      if (isAnnual && value >= 12000) {
        value /= 12;
      }

      return value;
    })
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
}

function buildSalaryProgression(mediaSalarial: string) {
  const values = parseSalaryValues(mediaSalarial);

  if (!values.length) {
    return [
      { label: "Júnior", range: "Sob consulta" },
      { label: "Pleno", range: "Sob consulta", active: true },
      { label: "Sênior", range: "Sob consulta" },
    ];
  }

  if (values.length === 1) {
    const base = values[0];
    return [
      { label: "Júnior", range: formatSalaryRange(base * 0.6, base * 0.82) },
      { label: "Pleno", range: formatSalaryRange(base * 0.9, base * 1.2), active: true },
      { label: "Sênior", range: formatSalaryRange(base * 1.28, base * 1.75) },
    ];
  }

  const [rawMin, rawMax] = values;
  const min = Math.min(rawMin, rawMax);
  const max = Math.max(rawMin, rawMax);
  const width = Math.max(max - min, max * 0.25);

  return [
    { label: "Júnior", range: formatSalaryRange(min - width * 0.35, min + width * 0.2) },
    { label: "Pleno", range: formatSalaryRange(min + width * 0.3, max), active: true },
    { label: "Sênior", range: formatSalaryRange(max + width * 0.18, max + width * 0.9) },
  ];
}

function emptyAnalysis(cargo: string): CareerAnalysis {
  return {
    carreira: cargo,
    insightIA: "Analisando vagas reais e preparando o panorama desta carreira...",
    mediaSalarial: "",
    moeda: "BR",
    vagasAbertas: 0,
    crescimentoMensal: "",
    nivelDemanda: "Baixa",
    rankingMercado: "",
    crescimentoAnual: "",
    competenciasDesejadas: {
      habilidadesTecnicas: [],
      softSkills: [],
    },
    certificacoesRecomendadas: [],
    oportunidadesDestaque: [],
    cursosRecomendados: [],
  };
}

const PREVIEW_CAREER_ANALYSIS: CareerAnalysis = {
  carreira: "QA",
  insightIA:
    "O mercado de QA no Brasil segue aquecido, sobretudo para quem une testes manuais e automação. A maior parte das vagas ainda pede presença no escritório, mas remoto internacional aparece com frequência. O perfil mais pedido combina Selenium, JUnit e comunicação clara com o time.",
  mediaSalarial: "R$ 5.800 a R$ 10.000",
  moeda: "BRL",
  vagasAbertas: 35,
  crescimentoMensal: "cerca de 3% ao mês",
  nivelDemanda: "Alta",
  rankingMercado: "",
  crescimentoAnual: "30% ao ano",
  competenciasDesejadas: {
    habilidadesTecnicas: [
      "Automação de testes",
      "Testes manuais",
      "Selenium",
      "JUnit",
      "API testing",
    ],
    softSkills: [
      "Comunicação eficaz",
      "Trabalho em equipe",
      "Resolução de problemas",
      "Atenção a detalhes",
    ],
  },
  certificacoesRecomendadas: [
    {
      empresa: "Alura",
      nome: "Certificação em Testes de Software",
      descricao: "Técnicas de teste e automação para o dia a dia.",
      url: "https://www.alura.com.br",
    },
    {
      empresa: "Coursera",
      nome: "Google IT Automation with Python",
      descricao: "Automação de rotinas e testes com Python.",
      url: "https://www.coursera.org",
    },
    {
      empresa: "SENAI",
      nome: "Qualidade de Software",
      descricao: "Práticas de qualidade, processos e testes.",
      url: "https://www.sp.senai.br",
    },
    {
      empresa: "CompTIA",
      nome: "CompTIA Project+",
      descricao: "Gestão de projetos com recorte em qualidade.",
      url: "https://www.comptia.org",
    },
  ],
  oportunidadesDestaque: [
    {
      titulo: "Analista Garantia da Qualidade Junior",
      empresa: "UO",
      localidade: "São Paulo, SP",
      modalidade: "Presencial",
      salario: "Salário não informado",
      link: "https://www.linkedin.com/jobs",
      fonte: "Worky",
      destaqueWorky: true,
    },
    {
      titulo: "Analista Garantia da Qualidade Pleno",
      empresa: "UO",
      localidade: "São Paulo, SP",
      modalidade: "Presencial",
      salario: "Salário não informado",
      link: "https://www.linkedin.com/jobs",
      fonte: "Worky",
      destaqueWorky: true,
    },
    {
      titulo: "Analista da Qualidade Pleno",
      empresa: "LB",
      localidade: "Caxias do Sul, RS",
      modalidade: "Presencial",
      salario: "Salário não informado",
      link: "https://www.linkedin.com/jobs",
    },
    {
      titulo: "Analista da Qualidade Pleno",
      empresa: "C",
      localidade: "Remoto (Internacional)",
      modalidade: "Remoto",
      salario: "Salário não informado",
      link: "https://www.linkedin.com/jobs",
    },
    {
      titulo: "Analista da Qualidade Pleno (Validação de Processos)",
      empresa: "GS",
      localidade: "Rio de Janeiro, RJ",
      modalidade: "Presencial",
      salario: "Salário não informado",
      link: "https://www.linkedin.com/jobs",
    },
    {
      titulo: "Analista de Controle de Qualidade",
      empresa: "F",
      localidade: "Indaiatuba, SP",
      modalidade: "Presencial",
      salario: "Salário não informado",
      link: "https://www.linkedin.com/jobs",
    },
    {
      titulo: "QA Engineer",
      empresa: "Northstar",
      localidade: "Tysons Corner, Virginia, Estados Unidos",
      modalidade: "Remoto",
      salario: "Salário não informado",
      link: "https://www.linkedin.com/jobs",
    },
    {
      titulo: "QA Analyst",
      empresa: "Atlas",
      localidade: "Remoto (Internacional)",
      modalidade: "Remoto",
      salario: "Salário não informado",
      link: "https://www.linkedin.com/jobs",
    },
  ],
  cursosRecomendados: [
    {
      plataforma: "Coursera",
      nome: "Google Project Management",
      preco: "Carreira",
      url: "https://www.coursera.org",
      area: "Carreira",
      motivo: "Certificação reconhecida para quem lidera qualidade em projetos.",
      tag: "Carreira",
    },
    {
      plataforma: "Alura",
      nome: "Liderança Ágil: aprimoramento de soft skills",
      preco: "",
      url: "https://www.alura.com.br",
      area: "Soft Skills",
      motivo: "Desenvolve comunicação e alinhamento com o time.",
      tag: "Soft Skills",
    },
    {
      plataforma: "Alura",
      nome: "API com Django 3: testes, segurança e busca",
      preco: "",
      url: "https://www.alura.com.br",
      area: "Tecnologia",
      motivo: "Base de testes de API para quem quer ir além do funcional.",
      tag: "Tecnologia",
    },
    {
      plataforma: "Alura",
      nome: "API com Django 3: validação e documentação",
      preco: "",
      url: "https://www.alura.com.br",
      area: "Tecnologia",
      motivo: "Fecha o ciclo de qualidade em APIs com validação.",
      tag: "Tecnologia",
    },
  ],
};

function demandLocationLabel(job: CareerOpportunity) {
  const raw = (job.localidade || job.modalidade || "Não informado").trim();
  if (!raw) return "Não informado";
  return raw.split(/\s*\/\s*/)[0].trim() || raw;
}

function fonteLabel(fonte?: string) {
  if (fonte === "scrape") return "Busca Worky";
  if (fonte === "all") return "Ambos";
  if (fonte === "google") return "Google Jobs";
  return "";
}

const SIGLAS_BR: Record<string, string> = {
  "são paulo": "sp", "rio de janeiro": "rj", "minas gerais": "mg",
  "paraná": "pr", "santa catarina": "sc", "rio grande do sul": "rs",
  "bahia": "ba", "ceará": "ce", "pernambuco": "pe", "goiás": "go",
  "brasília": "df", "distrito federal": "df",
};

function filterJobsByParams(jobs: CareerOpportunity[], local: string, modelo: string): CareerOpportunity[] {
  const localLower = local.toLowerCase().trim();
  const modeloLower = modelo.toLowerCase().trim();
  if (!localLower && !modeloLower) return jobs;

  return jobs.filter(job => {
    const jobLocal = (job.localidade || "").toLowerCase();
    const jobModelo = (job.modalidade || "").toLowerCase();

    if (localLower && localLower !== "brasil") {
      if (localLower === "exterior") {
        const brTerms = ["brasil", "brazil", "são paulo", "rio de janeiro", "minas gerais", "paraná", "santa catarina", "rio grande do sul"];
        if (brTerms.some(t => jobLocal.includes(t))) return false;
      } else {
        const sigla = SIGLAS_BR[localLower];
        const matchesName = jobLocal.includes(localLower);
        const matchesSigla = sigla ? new RegExp(`\\b${sigla}\\b`, "i").test(jobLocal) : false;
        if (!matchesName && !matchesSigla) return false;
      }
    }

    if (modeloLower && modeloLower !== "qualquer") {
      if (modeloLower.includes("híbrid") || modeloLower.includes("hibrid")) {
        if (!jobModelo.includes("híbrid") && !jobModelo.includes("hibrid")) return false;
      } else if (modeloLower.includes("remoto")) {
        if (!jobModelo.includes("remoto")) return false;
      } else if (modeloLower.includes("presencial")) {
        if (!jobModelo.includes("presencial")) return false;
      }
    }

    return true;
  });
}

function hasUsableAiAnalysis(data: CareerAnalysis | null) {
  if (!data) return false;

  const hasAiFields =
    data.competenciasDesejadas.habilidadesTecnicas.length > 0 ||
    data.competenciasDesejadas.softSkills.length > 0 ||
    data.certificacoesRecomendadas.length > 0 ||
    data.cursosRecomendados.length > 0;

  return Boolean(
    data.metadata?.schemaVersion === 3 &&
    data.insightIA &&
    hasAiFields,
  );
}

function buildDemandRows(opportunities: CareerOpportunity[]) {
  const counts = new Map<string, number>();
  opportunities.forEach((job) => {
    const key = demandLocationLabel(job);
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  const total = opportunities.length || 1;
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label, count]) => ({
      label,
      pct: Math.round((count / total) * 100),
    }));
}

function StatCard({ label, value, unit, extra }: { label: string; value: ReactNode; unit?: string; extra?: ReactNode }) {
  return (
    <div className="ha-stat-card">
      <div className="ha-stat-label">{label}</div>
      <div className="ha-stat-value">{value}{unit && <span className="ha-stat-unit">{unit}</span>}</div>
      {extra}
    </div>
  );
}

function BrandMark({
  name,
  url,
  size = 30,
  className = "",
}: {
  name: string;
  url?: string;
  size?: number;
  className?: string;
}) {
  const brand = resolvePlatformBrand(name, url);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className={`ha-course-thumb-fallback ${className}`.trim()} style={{ color: brand.color }}>
        {brandInitials(brand)}
      </span>
    );
  }

  return (
    <img
      src={brandLogoUrl(brand, Math.max(64, size * 2))}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}

type MatchPerfilProps = {
  pct?: number;
  cargo?: string;
  matched?: string[];
  gaps?: string[];
  onComplete?: () => void;
  locked?: boolean;
  onCalculate?: () => void;
  loading?: boolean;
};

const HeartSm = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

export function MatchPerfil({
  pct = 85,
  cargo = "este cargo",
  matched = ["React.js", "TypeScript", "Next.js"],
  gaps = ["AWS", "Docker"],
  onComplete,
  locked = true,
  onCalculate,
  loading = false,
}: MatchPerfilProps) {
  const phase = loading ? "loading" : locked ? "idle" : "result";

  return (
    <div className="mp-card">
      <div className="mp-copy">
        <div className="mp-header">
          <span className="mp-badge-icon"><HeartSm /></span>
          <span className="mp-label">Match de perfil</span>
        </div>

        {phase === "idle" && (
          <>
            <div className="mp-idle-title">Calcule o match do seu perfil</div>
            <div className="mp-idle-sub">
              Compare suas competências com o que o mercado pede.
            </div>
          </>
        )}

        {phase === "loading" && (
          <div className="mp-loading-area">
            <div className="mp-spinner" />
            <div>
              <div className="mp-loading-text">Analisando perfil...</div>
              <div className="mp-loading-sub">Cruzando suas competências com as vagas disponíveis.</div>
            </div>
          </div>
        )}

        {phase === "result" && (
          <>
            <div className="mp-idle-title">Você tem {pct}% de compatibilidade para {cargo}.</div>
            <div className="mp-idle-sub">
              {gaps.length > 0
                ? `Adicione ${gaps.join(" e ")} para atingir 100%.`
                : "Perfil completo para esta vaga!"}
            </div>
            {(matched.length > 0 || gaps.length > 0) && (
              <div className="mp-tags">
                {matched.map(s => <span key={s} className="mp-tag">{s}</span>)}
                {gaps.map(s => <span key={s} className="mp-tag gap">{s}</span>)}
              </div>
            )}
          </>
        )}
      </div>

      {phase === "idle" && (
        <button className="mp-btn" onClick={onCalculate}>Calcular Match</button>
      )}
      {phase === "result" && (
        <div className="mp-actions">
          <button className="mp-btn" onClick={onComplete}>Completar Perfil</button>
          <button className="mp-btn-sm" onClick={onCalculate}>Recalcular</button>
        </div>
      )}
    </div>
  );
}

export function Career() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, session, isAuthenticated } = useAuth();

  const [analysis, setAnalysis] = useState<CareerAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [externalJob, setExternalJob] = useState<CareerOpportunity | null>(null);
  const [showAllJobs, setShowAllJobs] = useState(false);
  const [reportTarget, setReportTarget] = useState<JobReportTarget | null>(null);
  const [reportReason, setReportReason] = useState(JOB_REPORT_REASONS[0]);
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [reportedJobKeys, setReportedJobKeys] = useState<Set<string>>(() => new Set());

  const [matchResult, setMatchResult] = useState<ProfileMatchResult | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState("");
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchQuota, setMatchQuota] = useState<MatchQuota>(() =>
    user ? getMatchQuota(user.id) : { used: 0, limit: MATCH_FREE_LIMIT }
  );

  useEffect(() => {
    if (user) setMatchQuota(getMatchQuota(user.id));
  }, [user]);

  const previewResult = useMemo(
    () => new URLSearchParams(location.search).get("preview") === "resultado",
    [location.search],
  );
  const cargo = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("cargo") || (previewResult ? "QA" : "");
  }, [location.search, previewResult]);
  const searchFilters = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const fonteRaw = params.get("fonte");
    const fonte: "google" | "scrape" | "all" | undefined =
      fonteRaw === "scrape" || fonteRaw === "all" || fonteRaw === "google" ? fonteRaw : undefined;
    return {
      cargo: params.get("cargo") || "",
      skills: params.get("skills") || "",
      pais: params.get("pais") || "",
      local: params.get("local") || "",
      modelo: params.get("modelo") || "",
      fonte,
    };
  }, [location.search]);
  const displayFilters = useMemo(() => {
    if (!previewResult) return searchFilters;
    return {
      ...searchFilters,
      pais: searchFilters.pais || "Brasil",
      modelo: searchFilters.modelo || "Presencial",
      fonte: searchFilters.fonte || "scrape",
    };
  }, [previewResult, searchFilters]);
  const searchKey = useMemo(() => buildCareerSearchKey(location.search), [location.search]);
  const initialAnalysis = useMemo(() => {
    const state = location.state as { analysis?: CareerAnalysis } | null;
    return state?.analysis || null;
  }, [location.state]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    if (previewResult) {
      setAnalysis({ ...PREVIEW_CAREER_ANALYSIS, carreira: cargo || "QA" });
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    if (!cargo) {
      const last = readLastCareerSearch();
      if (last?.searchKey) {
        navigate(`/carreira?${last.searchKey}`, { replace: true });
        return () => {
          cancelled = true;
        };
      }
      setAnalysis(null);
      setLoading(false);
      setError("Informe uma carreira na busca para gerar a análise.");
      return () => {
        cancelled = true;
      };
    }

    const lastFonte: "google" | "scrape" | "all" = searchFilters.fonte ?? "google";
    writeLastCareerSearch({
      cargo,
      pais: searchFilters.pais || "",
      local: searchFilters.local || "",
      modelo: searchFilters.modelo || "",
      fonte: lastFonte,
      searchKey,
    });

    const cachedAnalysis = readCachedAnalysis(searchKey);
    const bootAnalysis = hasUsableAiAnalysis(initialAnalysis)
      ? initialAnalysis
      : hasUsableAiAnalysis(cachedAnalysis)
        ? cachedAnalysis
        : null;

    if (bootAnalysis) {
      setAnalysis(bootAnalysis);
      writeCachedAnalysis(searchKey, bootAnalysis);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const apiFilters: {
      skills?: string;
      local?: string;
      modelo?: string;
      fonte?: "google" | "scrape" | "all";
    } = {};
    if (searchFilters.skills) apiFilters.skills = searchFilters.skills;
    if (searchFilters.local) apiFilters.local = searchFilters.local;
    if (searchFilters.modelo) apiFilters.modelo = searchFilters.modelo;
    if (searchFilters.fonte) apiFilters.fonte = searchFilters.fonte;

    jobService.getCarreira(cargo, apiFilters).then((data) => {
      if (cancelled) return;
      if (data) {
        setAnalysis(data);
        writeCachedAnalysis(searchKey, data);
      } else {
        setAnalysis(null);
        setError("Não foi possível carregar a análise de carreira agora.");
      }
      setLoading(false);
    }).catch((err: unknown) => {
      if (cancelled) return;
      setAnalysis(null);
      logAppError("falha ao carregar analise de carreira");
      setError(toUserErrorMessage(err, "Erro na hora da busca. Tente novamente."));
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [cargo, initialAnalysis, navigate, previewResult, searchFilters, searchKey]);

  useEffect(() => {
    setShowAllJobs(false);
  }, [cargo]);

  const career = analysis || emptyAnalysis(cargo || "Carreira");
  const careerName = cargo.trim() || career.carreira;
  const title = splitCareerName(careerName);
  const techSkills = career.competenciasDesejadas.habilidadesTecnicas;
  const softSkills = career.competenciasDesejadas.softSkills;

  const matchedSkills = useMemo(() => {
    if (techSkills && techSkills.length > 0) {
      return techSkills.slice(0, Math.max(1, Math.floor(techSkills.length * 0.7)));
    }
    return ["React.js", "TypeScript", "Next.js"];
  }, [techSkills]);

  const gapSkills = useMemo(() => {
    if (techSkills && techSkills.length > 0) {
      const start = Math.max(1, Math.floor(techSkills.length * 0.7));
      return techSkills.slice(start, start + 2);
    }
    return ["AWS", "Docker"];
  }, [techSkills]);

  const compatibilityPct = useMemo(() => {
    if (techSkills && techSkills.length > 0) {
      const matchedCount = matchedSkills.length;
      const gapCount = gapSkills.length;
      const total = matchedCount + gapCount;
      if (total === 0) return 85;
      return Math.round((matchedCount / total) * 100);
    }
    return 85;
  }, [techSkills, matchedSkills, gapSkills]);

  const certs = career.certificacoesRecomendadas;
  const rawJobs = useMemo(() => {
    return career.todasVagas?.length ? career.todasVagas : career.oportunidadesDestaque;
  }, [career]);
  const jobs = useMemo(() => {
    const filtered = filterJobsByParams(rawJobs, searchFilters.local, searchFilters.modelo);
    // Prioridade: vagas reais cadastradas na Worky aparecem primeiro.
    return [...filtered].sort((a, b) => Number(Boolean(b.destaqueWorky)) - Number(Boolean(a.destaqueWorky)));
  }, [rawJobs, searchFilters.local, searchFilters.modelo]);
  const hasActiveFilters = Boolean(searchFilters.local || searchFilters.modelo);
  const hasFilterMismatch = hasActiveFilters && jobs.length === 0;
  const jobsMatchLocal = useMemo(() => filterJobsByParams(rawJobs, searchFilters.local, ""), [rawJobs, searchFilters.local]);
  const jobsMatchModelo = useMemo(() => filterJobsByParams(rawJobs, "", searchFilters.modelo), [rawJobs, searchFilters.modelo]);
  const filterProblemLabel = useMemo(() => {
    if (!hasFilterMismatch) return "";
    const localFails = searchFilters.local && jobsMatchLocal.length === 0;
    const modeloFails = searchFilters.modelo && jobsMatchModelo.length === 0;
    if (localFails && modeloFails) return `localidade "${searchFilters.local}" e modelo "${searchFilters.modelo}"`;
    if (localFails) return `localidade "${searchFilters.local}"`;
    if (modeloFails) return `modelo "${searchFilters.modelo}"`;
    return `combinação de "${searchFilters.local}" com "${searchFilters.modelo}"`;
  }, [hasFilterMismatch, searchFilters.local, searchFilters.modelo, jobsMatchLocal, jobsMatchModelo]);
  const visibleJobs = showAllJobs ? jobs : jobs.slice(0, JOBS_PREVIEW_LIMIT);
  const hiddenJobCount = Math.max(0, jobs.length - JOBS_PREVIEW_LIMIT);
  const hasExpandableJobs = jobs.length > JOBS_PREVIEW_LIMIT;
  const courses = career.cursosRecomendados;
  const demandRows = buildDemandRows(jobs);
  const salaryProgression = buildSalaryProgression(career.mediaSalarial);

  const handleCalculateMatch = async () => {
    if (!isAuthenticated || !user || !session) {
      setShowMatchModal(true);
      return;
    }

    if (matchQuota.used >= matchQuota.limit) {
      return;
    }

    setMatchLoading(true);
    setMatchError("");

    try {
      const profile = await fetchProfessionalProfile(user, session.accessToken);
      if (!profile) {
        setShowMatchModal(true);
        return;
      }

      const result = await profileService.calculateMatch(profile, careerName);
      setMatchResult(result);
      setMatchQuota(registerMatchUsage(user.id));
    } catch (err: unknown) {
      logAppError("falha ao calcular match");
      setMatchError(toUserErrorMessage(err, "Nao foi possivel calcular o match agora."));
    } finally {
      setMatchLoading(false);
    }
  };

  const goToJobs = () => navigate(`/results?cargo=${encodeURIComponent(careerName)}`);
  const requestOpenJob = (job: CareerOpportunity) => {
    if (!job.link) {
      goToJobs();
      return;
    }

    // Vagas Worky (cadastradas) abrem a candidatura interna com prioridade.
    const isInternal =
      job.destaqueWorky ||
      job.link.startsWith("/") ||
      job.fonte === "Worky" ||
      job.tag === "Worky";

    if (isInternal) {
      const jobId =
        job.id ||
        (job.link.startsWith("/vagas/") ? job.link.replace("/vagas/", "").split("?")[0] : "");
      if (jobId) {
        navigate(`/vagas/${encodeURIComponent(jobId)}`, { state: { job } });
        return;
      }
      navigate(job.link.startsWith("/") ? job.link : "/auth?mode=register&tipo=candidato");
      return;
    }

    setExternalJob(job);
  };
  const closeExitModal = () => setExternalJob(null);
  const continueToJob = () => {
    if (!externalJob?.link) return;
    window.open(externalJob.link, "_blank", "noopener,noreferrer");
    setExternalJob(null);
  };

  const openReportModal = (job: CareerOpportunity, key: string) => {
    setReportTarget({ job, key });
    setReportReason(JOB_REPORT_REASONS[0]);
    setReportDetails("");
    setReportSubmitted(false);
  };
  const closeReportModal = () => setReportTarget(null);
  const submitJobReport = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reportTarget) return;
    if (!reportReason.trim()) return;
    setReportedJobKeys((prev) => { const next = new Set(prev); next.add(reportTarget.key); return next; });
    setReportSubmitted(true);
    setTimeout(() => closeReportModal(), 2600);
  };
  const openCourse = (course: DisplayCourse) => {
    if (!course.url) return;
    window.open(course.url, "_blank", "noopener,noreferrer");
  };
  const openCert = (cert: DisplayCert) => {
    const target = buildCertOpenUrl(cert.nome, cert.empresa, cert.url);
    window.open(target, "_blank", "noopener,noreferrer");
  };
  return (
    <>
      <style>{css}</style>
      <div className={`ha-app${loading ? " is-loading" : ""}`}>
        {showMatchModal && (
          <MatchAuthModal
            onCancel={() => setShowMatchModal(false)}
            onContinue={() => { setShowMatchModal(false); navigate("/perfil"); }}
          />
        )}
        {externalJob && (
          <ExitModal
            onCancel={closeExitModal}
            onContinue={continueToJob}
          />
        )}
        {reportTarget && (
          <JobReportModal
            details={reportDetails}
            job={reportTarget.job}
            onClose={closeReportModal}
            onDetailsChange={setReportDetails}
            onReasonChange={setReportReason}
            onSubmit={submitJobReport}
            reason={reportReason}
            submitted={reportSubmitted}
          />
        )}
        {!loading && (
          <>
            <SiteHeader
              activeItem="explorar"
              onExploreClick={() => navigate("/")}
            />
          </>
        )}

        <div className="ha-layout">
          <main className="ha-main" style={loading ? { padding: 0, flex: 1 } : undefined}>
            {loading ? (
              <div className="ha-career-loading" role="status" aria-live="polite">
                <div className="ha-career-loading-spinner" aria-hidden="true" />
                <p className="ha-career-loading-text">
                  Buscando e analisando vagas reais para {cargo}...
                </p>
              </div>
            ) : error || !analysis ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4" />
                  <circle cx="12" cy="16" r="0.8" fill="#64748b" stroke="none" />
                </svg>
                <p style={{ color: 'var(--on-surface-muted)', fontWeight: 500, fontSize: '1.1rem' }}>{error || "Nenhum dado encontrado."}</p>
                <button type="button" className="btn-primary-nav" onClick={() => navigate("/")} style={{ marginTop: '1rem' }}>Voltar ao Início</button>
              </div>
            ) : (
              <div className="ha-content">
                  <div className="ha-lead">
                    <div className="ha-desc-kicker">Resumo</div>
                    <h1 className="ha-page-title">
                      {title.prefix} {title.accent && <span className="accent">{title.accent}</span>}
                    </h1>
                    {(displayFilters.pais || displayFilters.local || displayFilters.modelo || displayFilters.fonte) && (
                      <div className="ha-filters">
                        {(displayFilters.pais || displayFilters.local) && (
                          <span className="ha-filter-chip">
                            {[displayFilters.pais, displayFilters.local].filter((v, i, a) => v && a.indexOf(v) === i).join(" · ")}
                          </span>
                        )}
                        {displayFilters.modelo && (
                          <span className="ha-filter-chip">{displayFilters.modelo}</span>
                        )}
                        {displayFilters.fonte && (
                          <span className="ha-filter-chip">{fonteLabel(displayFilters.fonte)}</span>
                        )}
                      </div>
                    )}
                    <p className="ha-desc-text" lang="pt-BR">
                      {error || career.insightIA}
                    </p>
                  </div>

                  <div className="ha-stats">
                    <StatCard
                      label="Vagas abertas"
                      value={loading && !analysis ? "..." : career.vagasAbertas.toLocaleString("pt-BR")}
                      extra={
                        <>
                          {career.crescimentoMensal ? (
                            <p className="ha-stat-caption">{career.crescimentoMensal}</p>
                          ) : null}
                          <div className="ha-stat-dots" aria-hidden="true">
                            {[0, 1, 2, 3].map((i) => (
                              <span key={i} className={`ha-dot${i >= 2 ? " is-on" : ""}`} />
                            ))}
                          </div>
                        </>
                      }
                    />
                    <StatCard
                      label="Nível de demanda"
                      value={career.nivelDemanda}
                      extra={
                        <div className="ha-stat-meter" aria-hidden="true">
                          {[0, 1, 2, 3, 4].map((i) => {
                            const filled = career.nivelDemanda === "Alta" ? 5 : career.nivelDemanda === "Média" ? 3 : 2;
                            return (
                              <span
                                key={i}
                                className={i < filled ? "is-on" : undefined}
                                style={{ height: `${32 + i * 16}%` }}
                              />
                            );
                          })}
                        </div>
                      }
                    />
                    <StatCard
                      label="Crescimento anual"
                      value={career.crescimentoAnual || "Não informado"}
                      extra={
                        <div className="ha-stat-spark" aria-hidden="true">
                          <svg width="96" height="32" viewBox="0 0 96 32" fill="none">
                            <path d="M6 24 C 24 24 30 12 48 14 S 72 8 88 8" stroke="#f59e0b" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="88" cy="8" r="3.2" fill="#f59e0b" />
                          </svg>
                        </div>
                      }
                    />
                  </div>

                  <div className="ha-salary-card">
                    <div className="ha-salary-title">Progressão salarial</div>
                    <div className="ha-salary-list">
                      {salaryProgression.map((band) => (
                        <div key={band.label} className={`ha-salary-item${band.active ? " active" : ""}`}>
                          <div className="ha-salary-level">
                            <span className="ha-salary-dot" />
                            {band.label}
                          </div>
                          <div className="ha-salary-range">{band.range}</div>
                        </div>
                      ))}
                    </div>
                    <div className="ha-salary-note">
                      Estimativa geral para o Brasil. Valores variam por região, contrato, porte da empresa e maturidade técnica.
                    </div>
                  </div>

                  <section className="ha-section">
                    <div className="ha-section-title">Competências desejadas</div>
                    <div className="ha-split">
                      <div className="ha-panel">
                        <div className="ha-panel-label">Hard skills</div>
                        <div className="ha-skill-tags">
                          {techSkills.length ? (
                            techSkills.map((skill) => <span key={skill} className="ha-skill-tag">{skill}</span>)
                          ) : (
                            <span className="ha-skill-tag">Em análise</span>
                          )}
                        </div>
                      </div>
                      <div className="ha-panel">
                        <div className="ha-panel-label">Soft skills</div>
                        <div className="ha-skill-tags">
                          {softSkills.length ? (
                            softSkills.map((skill) => <span key={skill} className="ha-skill-tag">{skill}</span>)
                          ) : (
                            <span className="ha-skill-tag">Em análise</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="ha-section">
                    <div className="ha-section-title">Certificações recomendadas</div>
                    <div className="ha-certs-grid">
                      {certs.length ? certs.map((cert) => {
                        const brand = resolvePlatformBrand(cert.empresa, cert.url);
                        return (
                          <button
                            key={`${cert.empresa}-${cert.nome}`}
                            type="button"
                            className="ha-cert-card"
                            onClick={() => openCert(cert)}
                            title={`Abrir ${cert.nome}`}
                          >
                            <div className="ha-cert-logo">
                              <BrandMark name={cert.empresa} url={cert.url} size={28} />
                            </div>
                            <div className="ha-cert-text">
                              <div className="ha-cert-issuer" style={{ color: brand.color }}>{brand.label}</div>
                              <div className="ha-cert-name">{cert.nome}</div>
                            </div>
                          </button>
                        );
                      }) : (
                        <div className="ha-cert-card" style={{ cursor: "default" }}>
                          <div className="ha-cert-logo">WY</div>
                          <div className="ha-cert-text">
                            <div className="ha-cert-name">Em análise</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>

                  <MatchPerfil
                    pct={matchResult?.pct ?? compatibilityPct}
                    cargo={careerName}
                    matched={matchResult?.matched ?? matchedSkills}
                    gaps={matchResult?.gaps ?? gapSkills}
                    onComplete={() => navigate("/perfil")}
                    locked={!matchResult}
                    onCalculate={handleCalculateMatch}
                    loading={matchLoading}
                  />
                  {user && matchQuota.used >= matchQuota.limit && (
                    <div style={{ marginBottom: "1.85rem" }}>
                      <ReferralCard
                        variant="unlock"
                        link={getReferralLink(user.id)}
                        bonusAmount={REFERRAL_BONUS_MATCHES}
                        onCopied={() => setMatchQuota(grantBonusMatches(user.id))}
                      />
                    </div>
                  )}

                  <section className="ha-section">
                    <div className="ha-jobs-header">
                      <div className="ha-section-title" style={{ marginBottom: 0 }}>Oportunidades em destaque</div>
                    </div>
                    <div className="ha-demanda-card">
                      <div className="ha-salary-title">Onde estão as vagas?</div>
                      <div className="ha-demanda-list">
                        {(demandRows.length ? demandRows : [{ label: "Em análise", pct: 0 }]).map((item) => (
                          <div key={item.label} className="ha-demanda-row">
                            <div className="ha-demanda-meta"><span>{item.label}</span><span>{item.pct}%</span></div>
                            <div className="ha-demanda-track">
                              <div className="ha-demanda-fill" style={{ width: `${item.pct}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="ha-jobs-list">
                        {jobs.length ? visibleJobs.map((job, index) => {
                          const reportKey = getJobReportKey(job, index);
                          const isReported = reportedJobKeys.has(reportKey);
                          return (
                            <div key={`${job.titulo}-${index}`} className="ha-job-card">
                              <div className="ha-job-head">
                                <div className="ha-job-logo" style={{ background: colorFromText(job.empresa || job.titulo), color: "white", fontSize: "0.8rem", fontWeight: 700 }}>
                                  {getInitials(job.empresa || job.titulo)}
                                </div>
                                <div className="ha-job-title">{job.titulo}</div>
                              </div>
                              <div className="ha-job-meta">
                                {(job.destaqueWorky || job.tag || job.fonte) && (
                                  <span
                                    className="ha-job-source-badge"
                                    style={
                                      job.destaqueWorky
                                        ? { background: "#dbeafe", color: "#1d4ed8" }
                                        : undefined
                                    }
                                  >
                                    {job.destaqueWorky ? "Worky" : (job.tag || job.fonte)}
                                  </span>
                                )}
                                <span className="ha-job-tag">
                                  {(() => {
                                    const local = job.localidade || "";
                                    const pais = searchFilters.pais || "";
                                    if (pais && local && !local.toLowerCase().includes(pais.toLowerCase())) return `${pais} - ${local}`;
                                    return local || job.modalidade || "Consultar localidade";
                                  })()}
                                </span>
                                <span className="ha-job-tag">{job.salario || "Salário não informado"}</span>
                                <span className="ha-job-tag">{job.tipoContrato || job.modalidade || "Contrato não informado"}</span>
                              </div>
                              <div className="ha-job-card-actions">
                                <button
                                  type="button"
                                  className={`btn-reportar-vaga${isReported ? " reported" : ""}`}
                                  disabled={isReported}
                                  onClick={() => openReportModal(job, reportKey)}
                                  title={isReported ? "Vaga já reportada" : "Reportar problema com esta vaga"}
                                >
                                  {isReported ? (
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                  ) : (
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>
                                  )}
                                  {isReported ? "Reportado" : "Reportar"}
                                </button>
                                <button type="button" className="btn-ver-vaga" onClick={() => requestOpenJob(job)}>
                                  {job.destaqueWorky ? "Candidatar-se" : "Ver vaga"}
                                </button>
                              </div>
                            </div>
                          );
                        }) : hasFilterMismatch ? (
                          <div className="ha-job-card" style={{ cursor: "default", background: "#fef2f2", borderColor: "#fecaca" }}>
                            <div className="ha-job-head">
                              <div className="ha-job-logo" style={{ background: "#ef4444", color: "white", fontSize: "0.8rem", fontWeight: 700 }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" /></svg>
                              </div>
                              <div className="ha-job-title" style={{ color: "#991b1b" }}>Nenhuma vaga atende aos filtros</div>
                            </div>
                            <div className="ha-job-meta">
                              <span className="ha-job-tag" style={{ color: "#b91c1c" }}>O filtro de {filterProblemLabel} não retornou resultados para essa carreira.</span>
                            </div>
                          </div>
                        ) : (
                          <button type="button" className="ha-job-card" onClick={goToJobs}>
                            <div className="ha-job-head">
                              <div className="ha-job-logo" style={{ background: "#e8ecff", color: "#003ec7", fontSize: "0.75rem", fontWeight: 700 }}>
                                WY
                              </div>
                              <div className="ha-job-title">Buscando oportunidades</div>
                            </div>
                            <div className="ha-job-meta">
                              <span className="ha-job-tag">Atualize para ver novas vagas</span>
                            </div>
                            <span className="btn-ver-vaga">Atualizar</span>
                          </button>
                        )}
                      </div>
                      {hasExpandableJobs && (
                        <button
                          type="button"
                          className="ver-mais-btn"
                          onClick={() => setShowAllJobs((current) => !current)}
                        >
                          {showAllJobs ? "Ocultar vagas" : `Ver mais ${hiddenJobCount} ${hiddenJobCount === 1 ? "vaga" : "vagas"}`}
                        </button>
                      )}
                    </div>
                  </section>

                  <section className="ha-section">
                    <div className="ha-section-title">Acelere sua carreira</div>
                    <div className="ha-courses-grid">
                      {courses.length ? courses.map((course) => {
                        const brand = resolvePlatformBrand(course.plataforma, course.url);
                        return (
                          <button
                            key={`${course.plataforma}-${course.nome}`}
                            type="button"
                            className="ha-course-card"
                            onClick={() => openCourse(course)}
                            disabled={!course.url}
                            title={course.url ? "Abrir curso" : "Link do curso indisponível"}
                          >
                            <div className="ha-course-logo">
                              <BrandMark name={course.plataforma} url={course.url} size={28} />
                            </div>
                            <div className="ha-course-body">
                              <div className="ha-course-platform" style={{ color: brand.color }}>{brand.label}</div>
                              <div className="ha-course-title">{course.nome}</div>
                              <div className="ha-course-footer">
                                <span className="ha-course-area-badge">{course.area || "Curso"}</span>
                              </div>
                            </div>
                          </button>
                        )
                      }) : (
                        <button type="button" className="ha-course-card" disabled>
                          <div className="ha-course-logo">
                            <BrandMark name="Worky" size={28} />
                          </div>
                          <div className="ha-course-body">
                            <div className="ha-course-platform" style={{ color: "#003ec7" }}>Worky</div>
                            <div className="ha-course-title">Cursos aparecem após a análise</div>
                          </div>
                        </button>
                      )}
                    </div>
                  </section>
              </div>
            )}
          </main>
        </div>

        {!loading && analysis && (
          <div className="ws-ad-wrap ws-ad-wrap--footer">
            <AdSlot
              placement="leaderboard"
              title="Propaganda aqui"
              hint="Faixa inferior da página de resultados"
            />
          </div>
        )}

        {!loading && (
          <SiteFooter />
        )}
      </div>
    </>
  );
}
