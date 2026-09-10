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
import { AdSlot, SponsorMarquee } from "../components/AdSlot";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import { ReferralCard } from "../components/ReferralCard";
import { useAuth } from "../context/AuthContext";
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

type IconProps = {
  d: string;
  size?: number;
  color?: string;
  fill?: string;
  strokeWidth?: number;
};

const Icon = ({ d, size = 18, color = "currentColor", fill = "none", strokeWidth = 1.8 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const Icons = {
  dashboard: <Icon d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z" />,
  work: <Icon d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zm-9-3h2v3H11zM8 7V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3" />,
  bell: <Icon d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />,
  settings: <Icon d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm0-11a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />,
  help: <Icon d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />,
  share: <Icon d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />,
  bookmark: <Icon d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />,
};

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
          <h2 id="exit-modal-title" className="wm-title">Você está saindo da Worky</h2>
          <p className="wm-description">
            Você será redirecionado para a página da vaga para visualizar os detalhes.
            A Worky não se responsabiliza pelo conteúdo ou pelos processos de sites externos.
          </p>
        </div>

        <div className="wm-footer">
          <button type="button" className="btn-continue" onClick={onContinue}>
            Continuar para a vaga
          </button>
          <button type="button" className="btn-cancel" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

const JOB_REPORT_REASONS = [
  "Requisitos inconsistentes com a carreira",
  "Salario inconsistente",
  "Vaga duplicada",
  "Link da vaga nao funciona",
  "Localidade ou modalidade incorreta",
  "Conteudo suspeito",
  "Outro motivo",
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
        <div className="wm-body">
          <div className="wm-icon-wrap" style={{ color: "#dc2626", background: "#fef2f2" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" y1="22" x2="4" y2="15" />
            </svg>
          </div>
          <h2 id="report-modal-title" className="wm-title">Reportar Problema</h2>
          <p className="wm-description">
            Encontrou algo errado com a vaga <strong>{job.titulo}</strong> na empresa{" "}
            <strong>{job.empresa || "Confidencial"}</strong>? Ajude-nos a melhorar.
          </p>
        </div>

        {submitted ? (
          <div className="wm-body" style={{ marginTop: "-1rem", paddingBottom: "2rem", textAlign: "center" }}>
            <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "48px", height: "48px", borderRadius: "50%", background: "#dcfce7", color: "#16a34a", marginBottom: "1rem" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p style={{ color: "#191c1d", fontWeight: 600 }}>Obrigado por reportar!</p>
            <p style={{ color: "#434656", fontSize: "0.85rem", marginTop: "0.5rem" }}>
              Nossa equipe vai revisar o reporte e melhorar a qualidade das vagas.
            </p>
            <button type="button" className="btn-continue" style={{ marginTop: "1.5rem" }} onClick={onClose}>
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <div className="wm-body" style={{ marginTop: "-1rem", paddingTop: 0, paddingBottom: 0 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label htmlFor="report-reason" style={{ fontSize: "0.85rem", fontWeight: 600, color: "#434656" }}>Motivo principal *</label>
                  <select
                    id="report-reason"
                    value={reason}
                    required
                    onChange={(event) => onReasonChange(event.target.value)}
                    style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #c3c5d9", background: "white", fontSize: "0.9rem", color: "#191c1d", outline: "none", fontFamily: "inherit" }}
                  >
                    {JOB_REPORT_REASONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label htmlFor="report-details" style={{ fontSize: "0.85rem", fontWeight: 600, color: "#434656" }}>Detalhes adicionais (opcional)</label>
                  <textarea
                    id="report-details"
                    value={details}
                    onChange={(event) => onDetailsChange(event.target.value)}
                    placeholder="Conte-nos mais sobre o problema com esta vaga..."
                    rows={3}
                    style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #c3c5d9", background: "white", fontSize: "0.9rem", color: "#191c1d", outline: "none", resize: "none", fontFamily: "inherit" }}
                  />
                </div>
              </div>
            </div>
            <div className="wm-footer" style={{ marginTop: "1.5rem" }}>
              <button type="submit" className="btn-continue">Enviar Reporte</button>
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
          <h2 id="match-auth-title" className="wm-title">Login Necessário</h2>
          <p className="wm-description">
            Para calcular o <strong>Match de Perfil</strong> você precisa estar{" "}
            <strong>logado</strong> e ter os <strong>dados do perfil preenchidos</strong>.
          </p>
          <ul style={{ margin: "0.75rem 0 0", paddingLeft: "1.25rem", color: "#434656", fontSize: "0.85rem", lineHeight: 1.7 }}>
            <li>Crie uma conta ou entre com suas credenciais</li>
            <li>Complete as informações do seu perfil profissional</li>
            <li>Volte aqui e clique em Calcular Match</li>
          </ul>
        </div>
        <div className="wm-footer">
          <button type="button" className="btn-continue" onClick={onContinue}>
            Ir para o Perfil
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

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
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
  --outline: #c3c5d9;
  --tertiary: #005858;
  --tertiary-light: #e0f7f7;
  --secondary: #4459a8;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
}

.ha-app { font-family: 'Inter', sans-serif; background: var(--surface); color: var(--on-surface); min-height: 100vh; display: flex; flex-direction: column; }
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
.btn-primary-nav { background: var(--primary-container); color: white; border: none; padding: 0.45rem 1.3rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 600; cursor: pointer; box-shadow: 0 2px 8px rgba(0,82,255,0.3); }
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

.ha-main { flex: 1; padding: 2rem 2rem 4rem; min-width: 0; }
.ha-content-grid { display: grid; grid-template-columns: 1fr 280px; gap: 2rem; max-width: 1100px; width: 100%; margin: 0 auto; align-items: stretch; }
.ha-left-col { min-width: 0; }
.ha-right-col { min-width: 0; }

.ha-breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--on-surface-muted); margin-bottom: 1rem; }
.ha-breadcrumb-link { cursor: pointer; background: none; border: none; color: inherit; font: inherit; }
.ha-breadcrumb-link:hover { color: var(--primary); }
.ha-breadcrumb-active { color: var(--primary); font-weight: 500; }

.ha-page-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: clamp(2rem, 4vw, 2.8rem);
  font-weight: 800; line-height: 1.15;
  color: var(--on-surface); margin-bottom: 1.25rem;
}
.ha-page-title .accent { color: var(--primary); }

.ha-desc-card {
  background: rgba(255,255,255,0.75);
  backdrop-filter: blur(8px);
  border: 1px solid var(--outline);
  border-radius: var(--radius-lg);
  padding: 1.25rem 1.5rem;
  position: relative; overflow: hidden;
  margin-bottom: 1.5rem;
}
.ha-desc-badge {
  position: absolute; top: 0; right: 0;
  background: rgba(0,88,88,0.08); color: var(--tertiary);
  font-size: 0.63rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
  padding: 6px 12px; border-radius: 0 var(--radius-lg) 0 var(--radius-md);
  display: flex; align-items: center; gap: 4px;
}
.ha-desc-text { font-size: 0.875rem; color: var(--on-surface-muted); line-height: 1.7; padding-right: 80px; }
.ha-desc-actions { display: flex; gap: 8px; margin-top: 1rem; }
.btn-icon { width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--outline); background: white; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--on-surface-muted); }
.btn-icon:hover { background: var(--surface-low); color: var(--on-surface); }

.ha-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem; }
.ha-stat-card {
  background: white; border: 1px solid var(--outline);
  border-radius: var(--radius-lg); padding: 1.25rem 1.5rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.03);
  position: relative; overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex; flex-direction: column; justify-content: space-between;
}
.ha-stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.06); }
.ha-stat-card::after {
  content: ""; position: absolute; top: 0; left: 0; width: 4px; height: 100%;
}
.ha-stat-card:nth-child(1) { background: #eff6ff; border-color: #bfdbfe; }
.ha-stat-card:nth-child(1)::after { background: var(--primary); }
.ha-stat-card:nth-child(2) { background: #f0fdfa; border-color: #ccfbf1; }
.ha-stat-card:nth-child(2)::after { background: #14b8a6; }
.ha-stat-card:nth-child(3) { background: #fffbeb; border-color: #fef3c7; }
.ha-stat-card:nth-child(3)::after { background: #f59e0b; }
.ha-stat-label { font-size: 0.72rem; color: var(--on-surface-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
.ha-stat-value { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.4rem; font-weight: 800; color: var(--on-surface); display: flex; align-items: center; gap: 6px; letter-spacing: -0.02em; line-height: 1.2; }
.ha-stat-unit { font-size: 0.75rem; font-weight: 600; color: var(--on-surface-muted); }
.ha-stat-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 0.72rem; font-weight: 700; background: #dbeafe; color: #1e40af; padding: 4px 10px; border-radius: 20px; margin-top: 10px; }
.ha-stat-dots { display: flex; gap: 4px; margin-top: 10px; }
.ha-dot { width: 10px; height: 10px; border-radius: 50%; }

.ha-section { margin-bottom: 2.5rem; }
.ha-section-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.2rem; font-weight: 700; display: flex; align-items: center; gap: 8px; color: var(--on-surface); margin-bottom: 1.25rem; }
.ha-section-title svg { color: var(--primary); }

.ha-skills-panel { background: white; border: 1px solid var(--outline); border-radius: var(--radius-lg); padding: 1.25rem; }
.ha-skills-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
.ha-skills-col-label { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--on-surface-muted); margin-bottom: 0.75rem; }
.ha-skill-tags { display: flex; flex-wrap: wrap; gap: 7px; }
.ha-skill-tag { font-size: 0.8rem; border: 1px solid var(--outline); border-radius: 20px; padding: 4px 12px; color: var(--on-surface-muted); background: var(--surface-low); cursor: default; }
.ha-cert-divider { border: none; border-top: 1px solid var(--outline); margin-bottom: 1.25rem; }
.ha-cert-label { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--on-surface-muted); margin-bottom: 0.75rem; }
.ha-certs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.ha-cert-card {
  background: var(--surface-low);
  border: 1px solid var(--outline);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  text-align: left;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
}
.ha-cert-card:hover {
  background: white;
  border-color: rgba(0,82,255,0.28);
  box-shadow: 0 4px 14px rgba(0,62,199,0.08);
}
.ha-cert-card:hover .ha-cert-name { color: var(--primary); }
.ha-cert-logo {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.72rem;
  flex-shrink: 0;
  overflow: hidden;
  border: 1px solid rgba(0,0,0,0.06);
}
.ha-cert-logo img {
  width: 28px;
  height: 28px;
  object-fit: contain;
  display: block;
}
.ha-cert-text { min-width: 0; flex: 1; }
.ha-cert-name { font-size: 0.8rem; font-weight: 600; color: var(--on-surface); transition: color 0.15s; }
.ha-cert-sub { font-size: 0.7rem; color: var(--on-surface-muted); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.ha-cert-issuer { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 3px; }

.ha-jobs-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.ha-ver-todas { background: none; border: none; font-family: 'Inter', sans-serif; font-size: 0.8rem; font-weight: 500; color: var(--primary); cursor: pointer; }
.ha-ver-todas:hover { text-decoration: underline; }
.ha-jobs-list { display: flex; flex-direction: column; gap: 1px; background: var(--outline); border-radius: var(--radius-lg); overflow: hidden; border: 1px solid var(--outline); }
.ha-job-card { background: white; padding: 1.1rem 1.25rem; display: flex; align-items: center; gap: 1rem; cursor: pointer; border: none; width: 100%; font-family: 'Inter', sans-serif; text-align: left; }
.ha-job-card:hover { background: var(--surface-low); }
.ha-job-logo { width: 44px; height: 44px; border-radius: var(--radius-sm); overflow: hidden; flex-shrink: 0; background: var(--surface-highest); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.7rem; color: var(--on-surface-muted); }
.ha-job-info { flex: 1; min-width: 0; }
.ha-job-title { font-size: 0.9rem; font-weight: 700; color: var(--on-surface); margin-bottom: 4px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.ha-job-source-badge {
  display: inline-flex; align-items: center; border-radius: 999px;
  padding: 2px 8px; font-size: 0.65rem; font-weight: 800; letter-spacing: 0.04em;
  text-transform: uppercase; background: #f1f5f9; color: #475569;
}
.ha-job-meta { display: flex; flex-wrap: wrap; gap: 10px; }
.ha-job-tag { display: flex; align-items: center; gap: 3px; font-size: 0.75rem; color: var(--on-surface-muted); }
.btn-ver-vaga { background: var(--primary); color: white; border: none; padding: 0.5rem 1.1rem; border-radius: var(--radius-sm); font-size: 0.8rem; font-weight: 700; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
.btn-ver-vaga:hover { background: #002fa3; }
.btn-reportar-vaga { display: inline-flex; align-items: center; gap: 5px; background: white; color: #64748b; border: 1px solid #c3c5d9; padding: 0.5rem 0.9rem; border-radius: var(--radius-sm); font-size: 0.78rem; font-weight: 600; cursor: pointer; white-space: nowrap; flex-shrink: 0; transition: all 0.15s; font-family: inherit; }
.btn-reportar-vaga:hover { background: #fef2f2; color: #dc2626; border-color: #fca5a5; }
.btn-reportar-vaga.reported { background: #f0fdf4; color: #16a34a; border-color: #86efac; cursor: default; }
.ha-job-card-actions { display: flex; gap: 8px; align-items: center; margin-left: auto; flex-shrink: 0; }
.ver-mais-btn { display: flex; align-items: center; gap: 6px; margin-top: 0.75rem; background: none; border: 1px solid var(--outline); border-radius: var(--radius-sm); padding: 0.5rem 1rem; font-size: 0.82rem; font-weight: 600; color: var(--primary); cursor: pointer; width: 100%; justify-content: center; }
.ver-mais-btn:hover { background: var(--surface-low); }

.ha-courses-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.ha-course-card { background: white; border: 1px solid var(--outline); border-radius: var(--radius-lg); overflow: hidden; cursor: pointer; text-align: left; padding: 0; font-family: 'Inter', sans-serif; width: 100%; transition: box-shadow 0.18s, transform 0.18s; }
.ha-course-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.10); transform: translateY(-2px); }
.ha-course-card:hover .ha-course-title { color: var(--primary); }
.ha-course-card:disabled { cursor: not-allowed; opacity: 0.55; filter: grayscale(40%); }
.ha-course-card:disabled:hover { box-shadow: none; transform: none; }
.ha-course-card:disabled:hover .ha-course-title { color: inherit; }
.ha-course-thumb {
  height: 92px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
}
.ha-course-thumb-logo {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  overflow: hidden;
}
.ha-course-thumb-logo img {
  width: 30px;
  height: 30px;
  object-fit: contain;
  display: block;
}
.ha-course-thumb-fallback {
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}
.ha-course-thumb-label {
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.ha-course-body { padding: 11px 13px 13px; display: flex; flex-direction: column; flex: 1; }
.ha-course-platform { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 5px; }
.ha-course-title { font-size: 0.80rem; font-weight: 700; color: var(--on-surface); line-height: 1.4; transition: color 0.15s; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.ha-course-reason { font-size: 0.70rem; color: var(--on-surface-muted); line-height: 1.45; margin-top: 6px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.ha-course-footer { display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 10px; }
.ha-course-area-badge { font-size: 0.66rem; font-weight: 600; padding: 2px 7px; border-radius: 20px; background: var(--surface-low); color: var(--on-surface-muted); }
.ha-course-price { font-size: 0.82rem; font-weight: 700; }

.ha-right-sticky { position: sticky; top: 80px; }
.ha-salary-card { background: #0d9488; border-radius: var(--radius-xl); padding: 1.5rem; margin-bottom: 0; color: white; border: 1px solid #0d9488; }
.ha-salary-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1rem; font-weight: 700; margin-bottom: 1.25rem; color: white; }
.ha-salary-list { display: flex; flex-direction: column; gap: 1.25rem; }
.ha-salary-item { position: relative; padding-left: 1.5rem; border-left: 2px solid rgba(255,255,255,0.25); }
.ha-salary-item.active { border-left-color: white; }
.ha-salary-dot { position: absolute; left: -5px; top: 3px; width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.4); }
.ha-salary-item.active .ha-salary-dot { background: white; }
.ha-salary-level { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.75); }
.ha-salary-item.active .ha-salary-level { color: white; }
.ha-salary-range { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 1rem; color: rgba(255,255,255,0.85); margin: 2px 0; }
.ha-salary-item.active .ha-salary-range { font-size: 1.2rem; color: white; }
.ha-salary-note {
  margin-top: 1rem; font-size: 0.72rem; color: rgba(255,255,255,0.7);
  font-style: italic; line-height: 1.45;
}

.ha-match-card { background: linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%); border-radius: var(--radius-lg); padding: 1.25rem; color: white; margin-top: 1.5rem; }
.ha-match-header { display: flex; align-items: center; gap: 6px; font-size: 0.65rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 0.75rem; opacity: 0.9; }
.ha-match-text { font-weight: 700; font-size: 1rem; line-height: 1.4; margin-bottom: 1rem; }
.btn-completar { width: 100%; background: white; color: var(--primary); border: none; padding: 0.6rem; border-radius: var(--radius-sm); font-size: 0.82rem; font-weight: 700; cursor: pointer; }
.btn-completar:hover { background: var(--surface-low); }

.ha-demanda-card { margin-top: 1.5rem; }
.ha-demanda-title { font-size: 0.82rem; font-weight: 700; color: var(--on-surface); margin-bottom: 1rem; }
.ha-demanda-list { display: flex; flex-direction: column; gap: 10px; }
.ha-demanda-meta { display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: 500; margin-bottom: 4px; color: var(--on-surface); }
.ha-demanda-track { height: 6px; background: var(--outline); border-radius: 9999px; overflow: hidden; }
.ha-demanda-fill { height: 100%; background: var(--primary); border-radius: 9999px; }

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
  width: 100%; max-width: 440px;
  border-radius: 20px;
  border: 1px solid rgba(195, 197, 217, 0.35);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.18);
  overflow: hidden;
  animation: wm-zoom-in 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes wm-zoom-in {
  from { opacity: 0; transform: scale(0.92) translateY(10px); }
  to   { opacity: 1; transform: scale(1)    translateY(0);    }
}

.wm-body { padding: 2rem 2rem 1.5rem; }

.wm-icon-wrap {
  width: 52px; height: 52px; border-radius: 50%;
  background: rgba(0, 62, 199, 0.09);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 1.4rem;
}

.wm-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 1.35rem; font-weight: 800;
  color: #191c1d; letter-spacing: -0.025em;
  margin-bottom: 0.6rem;
}

.wm-description {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem; font-weight: 400;
  color: #52525b; line-height: 1.65;
}

.wm-footer {
  background: #f3f4f5;
  border-top: 1px solid rgba(195, 197, 217, 0.3);
  padding: 1rem 2rem;
  display: flex; flex-direction: row-reverse;
  gap: 10px; flex-wrap: wrap;
}

.btn-continue {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem; font-weight: 700;
  background: #003ec7; color: #ffffff;
  border: none; border-radius: 10px;
  padding: 0.625rem 1.4rem;
  cursor: pointer; flex: 1;
  transition: background 0.15s, transform 0.1s;
  white-space: nowrap;
}
.btn-continue:hover  { background: #0052ff; }
.btn-continue:active { transform: scale(0.97); }

.btn-cancel {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem; font-weight: 700;
  background: transparent; color: #52525b;
  border: none; border-radius: 10px;
  padding: 0.625rem 1.4rem;
  cursor: pointer; flex: 1;
  transition: background 0.15s;
  white-space: nowrap;
}
.btn-cancel:hover { background: #e7e8e9; color: #191c1d; }

@media (max-width: 900px) {
  .ha-content-grid { display: flex; flex-direction: column; gap: 0; }
  .ha-left-col { display: contents; }
  .ha-right-col { order: 4; width: 100%; margin-bottom: 2.5rem; }
  .mobile-order-5 { order: 5; }
  .mobile-order-6 { order: 6; }
  .ha-stats { grid-template-columns: 2fr; }
  .ha-courses-grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 700px) {
  .ha-courses-grid { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .ha-topnav { height: auto; min-height: 60px; padding: 0.85rem 1rem; flex-wrap: wrap; gap: 0.75rem; }
  .ha-topnav > div:first-child { flex-wrap: wrap; gap: 1rem !important; }
  .ha-sidebar { display: none; }
  .ha-main { padding: 1.5rem 1rem 3rem; }
  .ha-desc-text { padding-right: 0; padding-top: 1.5rem; }
  .ha-skills-grid, .ha-certs-grid, .ha-courses-grid { grid-template-columns: 1fr; }
  .ha-job-card { align-items: flex-start; flex-wrap: wrap; padding: 1rem; }
  .ha-job-card-actions { width: 100%; margin-left: 0; margin-top: 0.5rem; justify-content: stretch; }
  .btn-ver-vaga { flex: 1; text-align: center; justify-content: center; }
  .btn-reportar-vaga { flex: 1; justify-content: center; }
}

/* Match profile card */
.mp-card {
  width: 100%;
  background: linear-gradient(155deg, #1e5aff 0%, #1040d8 50%, #0a35b0 100%);
  border-radius: 24px;
  padding: 1.4rem;
  color: #fff;
  box-shadow:
    0 20px 50px rgba(16, 64, 216, 0.42),
    0 4px 10px rgba(0, 0, 0, 0.16);
  position: relative;
  overflow: hidden;
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  min-height: 330px;
}

/* decorative blobs */
.mp-card::before {
  content: "";
  position: absolute;
  top: -55px; right: -55px;
  width: 170px; height: 170px;
  border-radius: 50%;
  background: rgba(255,255,255,0.09);
  pointer-events: none;
}
.mp-card::after {
  content: "";
  position: absolute;
  bottom: -35px; left: -35px;
  width: 110px; height: 110px;
  border-radius: 50%;
  background: rgba(255,255,255,0.05);
  pointer-events: none;
}

/* Header badge */
.mp-header {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 1.5rem;
  position: relative; z-index: 2;
}
.mp-badge-icon {
  width: 25px; height: 25px;
  background: rgba(255,255,255,0.18);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
}
.mp-label {
  font-family: 'Inter', sans-serif;
  font-size: 0.6rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: rgba(255,255,255,0.78);
}

/* Shared phase wrapper */
.mp-phase {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative; z-index: 2;
  animation: mp-in 0.38s cubic-bezier(0.22, 1, 0.36, 1);
}
@keyframes mp-in {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Phase 1: idle */
.mp-idle-circle {
  width: 92px; height: 92px;
  border-radius: 50%;
  background: rgba(255,255,255,0.96);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 1.35rem;
  box-shadow:
    0 8px 28px rgba(0,0,0,0.2),
    0 0 0 8px rgba(255,255,255,0.1);
}
.mp-idle-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 1.12rem; font-weight: 900;
  line-height: 1.3; color: #fff;
  text-align: center;
  margin-bottom: 0.65rem;
}
.mp-idle-sub {
  font-family: 'Inter', sans-serif;
  font-size: 0.775rem; color: rgba(255,255,255,0.62);
  line-height: 1.6; text-align: center;
  max-width: 210px;
  flex: 1;
}

/* Phase 2: loading */
.mp-loading-area {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 1.25rem; flex: 1;
}
.mp-spinner {
  width: 52px; height: 52px;
  border-radius: 50%;
  border: 4px solid rgba(255,255,255,0.18);
  border-top-color: #fff;
  animation: mp-spin 0.85s linear infinite;
}
@keyframes mp-spin { to { transform: rotate(360deg); } }
.mp-loading-text {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 0.9rem; font-weight: 700;
  color: #fff; text-align: center;
}
.mp-loading-sub {
  font-family: 'Inter', sans-serif;
  font-size: 0.72rem; color: rgba(255,255,255,0.55);
  line-height: 1.5; text-align: center;
  max-width: 190px; margin-top: -0.5rem;
}

/* Phase 3: result */
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
  text-align: center; margin-bottom: 5px;
}
.mp-result-sub {
  font-family: 'Inter', sans-serif;
  font-size: 0.7rem; color: rgba(255,255,255,0.58);
  line-height: 1.5; text-align: center;
  margin-bottom: 1rem;
}
.mp-tags {
  display: flex; flex-wrap: wrap;
  gap: 5px; justify-content: center;
  margin-bottom: 1.2rem; flex: 1; align-content: flex-start;
}
.mp-tag {
  font-family: 'Inter', sans-serif;
  font-size: 0.67rem; font-weight: 600;
  background: rgba(255,255,255,0.15);
  color: rgba(255,255,255,0.92);
  padding: 3px 10px; border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.22);
}
.mp-tag.gap {
  background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.38);
  border-color: rgba(255,255,255,0.1);
}

/* Buttons */
.mp-btn {
  width: 100%; margin-top: auto;
  background: #fff; color: #1040d8;
  border: none; border-radius: 14px;
  padding: 0.8rem;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 0.92rem; font-weight: 800;
  cursor: pointer;
  box-shadow: 0 5px 18px rgba(0,0,0,0.18);
  transition: background 0.15s, transform 0.12s;
  position: relative; z-index: 2;
}
.mp-btn:hover  { background: #eef1ff; }
.mp-btn:active { transform: scale(0.97); }
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
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return { prefix: name, accent: "" };
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
    const key = job.localidade || job.modalidade || "Não informado";
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

function CourseThumb({ plataforma, url }: { plataforma: string; url?: string }) {
  const brand = resolvePlatformBrand(plataforma, url);
  return (
    <div className="ha-course-thumb" style={{ background: brand.bg }}>
      <div className="ha-course-thumb-logo">
        <BrandMark name={plataforma} url={url} size={30} />
      </div>
      <span className="ha-course-thumb-label" style={{ color: brand.color }}>
        {brand.label}
      </span>
    </div>
  );
}


/* Ring arc helper */
const R = 34;
const CIRC = 2 * Math.PI * R;
const CX = 44;
const GAP = 55;                           // degrees clipped at bottom
const ARC = (360 - GAP) / 360;            // usable arc fraction

type RingProgressProps = {
  pct: number;
  size?: number;
};

function RingProgress({ pct, size = 120 }: RingProgressProps) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setVal(pct), 100);
    return () => clearTimeout(t);
  }, [pct]);

  const full   = CIRC * ARC;
  const filled = full * (val / 100);
  const rot    = 90 + GAP / 2;

  return (
    <div className="mp-ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 88 88">
        <circle
          className="mp-ring-bg"
          cx={CX} cy={CX} r={R}
          fill="none" strokeWidth="7"
          strokeDasharray={`${full} ${CIRC}`}
          transform={`rotate(${rot} ${CX} ${CX})`}
        />
        <circle
          className="mp-ring-fill"
          cx={CX} cy={CX} r={R}
          fill="none" strokeWidth="7"
          strokeDasharray={`${filled} ${CIRC}`}
          transform={`rotate(${rot} ${CX} ${CX})`}
        />
      </svg>
      <div className="mp-ring-inner">
        <span className="mp-pct">{val}</span>
        <span className="mp-pct-sym">%</span>
      </div>
    </div>
  );
}

/* Match card component */
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

/* SVG icons */
const HeartLg = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="#1040d8" stroke="none">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);
const HeartSm = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="white" stroke="none">
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
  // Derive phase from external props so backend logic stays intact
  const phase = loading ? "loading" : locked ? "idle" : "result";

  return (
    <div className="mp-card">
      {/* Badge header, always visible */}
      <div className="mp-header">
        <div className="mp-badge-icon"><HeartSm /></div>
        <span className="mp-label">Match de Perfil</span>
      </div>

      {/* Phase 1: idle */}
      {phase === "idle" && (
        <div className="mp-phase">
          <div className="mp-idle-circle">
            <HeartLg />
          </div>
          <div className="mp-idle-title">Calcule a aderência<br />do seu perfil</div>
          <div className="mp-idle-sub">
            Veja o quanto seu perfil se aproxima do que o mercado pede em {cargo}.
          </div>
          <button className="mp-btn" style={{ marginTop: "1.35rem" }} onClick={onCalculate}>
            Calcular Match
          </button>
        </div>
      )}

      {/* Phase 2: loading */}
      {phase === "loading" && (
        <div className="mp-phase">
          <div className="mp-loading-area">
            <div className="mp-spinner" />
            <div>
              <div className="mp-loading-text">Analisando perfil…</div>
              <div className="mp-loading-sub" style={{ marginTop: "0.6rem" }}>
                Cruzando suas competências com as vagas disponíveis.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phase 3: result */}
      {phase === "result" && (
        <div className="mp-phase">
          <RingProgress pct={pct} size={120} />
          <div className="mp-result-title">
            Você tem {pct}% de compatibilidade<br />para {cargo}.
          </div>
          <div className="mp-result-sub">
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

          <button className="mp-btn" onClick={onComplete}>
            Completar Perfil
          </button>
          <button className="mp-btn-sm" onClick={onCalculate}>
            Recalcular
          </button>
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
  const [shareCopied, setShareCopied] = useState(false);
  const [externalJob, setExternalJob] = useState<CareerOpportunity | null>(null);
  const [showAllJobs, setShowAllJobs] = useState(false);
  const [reportTarget, setReportTarget] = useState<JobReportTarget | null>(null);
  const [reportReason, setReportReason] = useState(JOB_REPORT_REASONS[0]);
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [reportedJobKeys, setReportedJobKeys] = useState<Set<string>>(() => new Set());

  // Match state
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

  const cargo = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("cargo") || "";
  }, [location.search]);
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
  const searchKey = useMemo(() => buildCareerSearchKey(location.search), [location.search]);
  const initialAnalysis = useMemo(() => {
    const state = location.state as { analysis?: CareerAnalysis } | null;
    return state?.analysis || null;
  }, [location.state]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

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
    }).catch(err => {
      if (cancelled) return;
      setAnalysis(null);
      setError(err.message || "Não foi possível carregar a análise de carreira agora.");
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [cargo, initialAnalysis, navigate, searchFilters, searchKey]);

  useEffect(() => {
    setShowAllJobs(false);
  }, [cargo]);

  const career = analysis || emptyAnalysis(cargo || "Carreira");
  const title = splitCareerName(career.carreira);
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
    return filterJobsByParams(rawJobs, searchFilters.local, searchFilters.modelo);
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

      const result = await profileService.calculateMatch(profile, career.carreira);
      setMatchResult(result);
      setMatchQuota(registerMatchUsage(user.id));
    } catch (err: any) {
      console.error(err);
      setMatchError(err.message || "Erro ao calcular o match. Tente novamente mais tarde.");
    } finally {
      setMatchLoading(false);
    }
  };

  const goToJobs = () => navigate(`/results?cargo=${encodeURIComponent(career.carreira)}`);
  const requestOpenJob = (job: CareerOpportunity) => {
    if (!job.link) {
      goToJobs();
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
  const shareCurrentPage = async () => {
    const pageUrl = window.location.href;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(pageUrl);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = pageUrl;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2000);
    } catch (copyError) {
      console.error("Nao foi possivel copiar o link da pagina:", copyError);
    }
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
            <SponsorMarquee />
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
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--on-surface-muted)" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
                </svg>
                <p style={{ color: 'var(--on-surface-muted)', fontWeight: 500, fontSize: '1.1rem' }}>{error || "Nenhum dado encontrado."}</p>
                <button type="button" className="btn-primary-nav" onClick={() => navigate("/")} style={{ marginTop: '1rem' }}>Voltar ao Início</button>
              </div>
            ) : (
              <div className="ha-content-grid">
                <div className="ha-left-col">
                  <div style={{ marginBottom: "1.25rem" }}>
                    <AdSlot
                      placement="banner"
                      title="Propaganda aqui"
                      hint="Anúncio no topo dos resultados de carreira"
                    />
                  </div>

                  <h1 className="ha-page-title" style={{ marginBottom: (searchFilters.pais || searchFilters.local || searchFilters.modelo) ? "12px" : undefined }}>
                    {title.prefix} {title.accent && <span className="accent">{title.accent}</span>}
                  </h1>

                  {(searchFilters.pais || searchFilters.local || searchFilters.modelo) && (
                    <div className="ha-active-filters" style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "28px" }}>
                      {(searchFilters.pais || searchFilters.local) && (
                        <span className="ha-filter-badge" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", background: "#e0f2fe", color: "#0369a1", borderRadius: "100px", fontSize: "0.85rem", fontWeight: 600 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                          {[searchFilters.pais, searchFilters.local].filter((v, i, a) => v && a.indexOf(v) === i).join(" - ")}
                        </span>
                      )}
                      {searchFilters.modelo && (
                        <span className="ha-filter-badge" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", background: "#e0f2fe", color: "#0369a1", borderRadius: "100px", fontSize: "0.85rem", fontWeight: 600 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
                          {searchFilters.modelo}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="ha-desc-card">
                    <div className="ha-desc-badge">
                      Resumo do mercado
                    </div>
                    <p className="ha-desc-text">
                      {error || career.insightIA}
                    </p>
                    <div className="ha-desc-actions">
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={shareCurrentPage}
                        title={shareCopied ? "Link copiado" : "Copiar link da pagina"}
                        aria-label={shareCopied ? "Link copiado" : "Copiar link da pagina"}
                        style={shareCopied ? { color: "var(--primary)", borderColor: "var(--primary)" } : undefined}
                      >
                        {Icons.share}
                      </button>
                      <button type="button" className="btn-icon">{Icons.bookmark}</button>
                    </div>
                  </div>

                  <div className="ha-stats">
                    <StatCard
                      label="Vagas Abertas"
                      value={loading && !analysis ? "..." : career.vagasAbertas.toLocaleString("pt-BR")}
                      extra={
                        <>
                          {career.crescimentoMensal && <div className="ha-stat-badge">↑ {career.crescimentoMensal}</div>}
                          <div className="ha-stat-dots" style={{ marginTop: 12 }}>
                            {["#bfdbfe", "#bfdbfe", "#60a5fa", "#2563eb"].map((color, index) => (
                              <div key={index} className="ha-dot" style={{ background: color }} />
                            ))}
                          </div>
                        </>
                      }
                    />
                    <StatCard
                      label="Nível de Demanda"
                      value={<>{career.nivelDemanda} <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><path d="M23 6l-9.5 9.5-5-5L1 18M17 6h6v6" /></svg></>}
                      extra={
                        <div style={{ display: 'flex', gap: '6px', marginTop: '16px', alignItems: 'flex-end', height: '28px' }}>
                          {[...Array(5)].map((_, i) => (
                            <div key={i} style={{ width: '8px', backgroundColor: i < (career.nivelDemanda === 'Alta' ? 5 : career.nivelDemanda === 'Média' ? 3 : 2) ? '#14b8a6' : '#ccfbf1', height: `${(i + 1) * 20}%`, borderRadius: '4px' }} />
                          ))}
                        </div>
                      }
                    />
                    <StatCard
                      label="Crescimento Anual"
                      value={career.crescimentoAnual || "Não informado"}
                      extra={
                        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center' }}>
                          <svg width="80" height="28" viewBox="0 0 80 28" fill="none">
                            <path d="M0 26 C 15 26 20 12 40 18 C 55 24 60 6 75 6" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="75" cy="6" r="3.5" fill="#f59e0b" />
                          </svg>
                        </div>
                      }
                    />
                  </div>

                  <section className="ha-section">
                    <div className="ha-section-title">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
                      Competências Desejadas
                    </div>
                    <div className="ha-skills-panel">
                      <div className="ha-skills-grid">
                        <div>
                          <div className="ha-skills-col-label">Habilidades Técnicas</div>
                          <div className="ha-skill-tags">
                            {techSkills.length ? (
                              techSkills.map((skill) => <span key={skill} className="ha-skill-tag">{skill}</span>)
                            ) : (
                              <span className="ha-skill-tag">Em análise</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="ha-skills-col-label">Soft Skills</div>
                          <div className="ha-skill-tags">
                            {softSkills.length ? (
                              softSkills.map((skill) => <span key={skill} className="ha-skill-tag">{skill}</span>)
                            ) : (
                              <span className="ha-skill-tag">Em análise</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <hr className="ha-cert-divider" />
                      <div className="ha-cert-label">Certificações Recomendadas</div>
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
                              <div className="ha-cert-logo" style={{ background: brand.bg, color: brand.color }}>
                                <BrandMark name={cert.empresa} url={cert.url} size={28} />
                              </div>
                              <div className="ha-cert-text">
                                <div className="ha-cert-issuer" style={{ color: brand.color }}>{brand.label}</div>
                                <div className="ha-cert-name">{cert.nome}</div>
                                <div className="ha-cert-sub">{cert.descricao}</div>
                              </div>
                            </button>
                          );
                        }) : (
                          <div className="ha-cert-card" style={{ cursor: "default" }}>
                            <div className="ha-cert-logo" style={{ background: "#e8ecff", color: "#003ec7" }}>WY</div>
                            <div className="ha-cert-text">
                              <div className="ha-cert-name">Em análise</div>
                              <div className="ha-cert-sub">Aguardando recomendações de certificações</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>

                  <section className="ha-section mobile-order-5">
                    <div className="ha-jobs-header">
                      <div className="ha-section-title" style={{ marginBottom: 0 }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-4 0v2M8 7V5a2 2 0 0 0 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                        Oportunidades em Destaque
                      </div>
                    </div>
                    <div style={{ marginTop: "1rem" }}>
                      <div className="ha-jobs-list">
                        {jobs.length ? visibleJobs.map((job, index) => {
                          const reportKey = getJobReportKey(job, index);
                          const isReported = reportedJobKeys.has(reportKey);
                          return (
                            <div key={`${job.titulo}-${index}`} className="ha-job-card" style={{ flexWrap: "wrap" }}>
                              <div className="ha-job-logo" style={{ background: colorFromText(job.empresa || job.titulo), color: "white", fontSize: "0.8rem", fontWeight: 700 }}>
                                {getInitials(job.empresa || job.titulo)}
                              </div>
                              <div className="ha-job-info">
                                <div className="ha-job-title">
                                  {job.titulo}
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
                                </div>
                                <div className="ha-job-meta">
                                  <span className="ha-job-tag">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                    {(() => {
                                      const local = job.localidade || "";
                                      const pais = searchFilters.pais || "";
                                      if (pais && local && !local.toLowerCase().includes(pais.toLowerCase())) return `${pais} - ${local}`;
                                      return local || job.modalidade || "Consultar localidade";
                                    })()}
                                  </span>
                                  <span className="ha-job-tag">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                                    {job.salario || "Salário não informado"}
                                  </span>
                                  <span className="ha-job-tag">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                                    {job.tipoContrato || job.modalidade || "Contrato não informado"}
                                  </span>
                                </div>
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
                                <button type="button" className="btn-ver-vaga" onClick={() => requestOpenJob(job)}>Ver vaga</button>
                              </div>
                            </div>
                          );
                        }) : hasFilterMismatch ? (
                          <div className="ha-job-card" style={{ cursor: "default", flexDirection: "column", alignItems: "flex-start", gap: "12px", background: "#fef2f2", borderColor: "#fecaca" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%" }}>
                              <div className="ha-job-logo" style={{ background: "#ef4444", color: "white", fontSize: "0.8rem", fontWeight: 700 }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" /></svg>
                              </div>
                              <div className="ha-job-info">
                                <div className="ha-job-title" style={{ color: "#991b1b" }}>Nenhuma vaga atende aos filtros</div>
                                <div className="ha-job-meta">
                                  <span className="ha-job-tag" style={{ color: "#b91c1c" }}>O filtro de {filterProblemLabel} não retornou resultados para essa carreira.</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <button type="button" className="ha-job-card" onClick={goToJobs}>
                            <div className="ha-job-logo" style={{ background: "#e8ecff", color: "#003ec7", fontSize: "0.75rem", fontWeight: 700 }}>
                              WY
                            </div>
                            <div className="ha-job-info">
                              <div className="ha-job-title">Buscando oportunidades</div>
                              <div className="ha-job-meta">
                                <span className="ha-job-tag">Atualize para ver novas vagas</span>
                              </div>
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

                  <div style={{ margin: "0.25rem 0 1.5rem" }}>
                    <AdSlot
                      placement="inline"
                      title="Propaganda aqui"
                      hint="Espaço entre vagas e cursos para parceiros educacionais"
                    />
                  </div>

                  <section className="ha-section mobile-order-6">
                    <div className="ha-section-title">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 10v6M2 10l10-5 10 5-10 5zM6 12v5c3 3 9 3 12 0v-5" /></svg>
                      Acelere sua Carreira
                    </div>
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
                            <CourseThumb plataforma={course.plataforma} url={course.url} />
                            <div className="ha-course-body">
                              <div className="ha-course-platform" style={{ color: brand.color }}>
                                {brand.label}
                                {course.destaqueWorky || course.tag === "Worky" ? (
                                  <span className="ha-job-source-badge" style={{ marginLeft: 6, background: "#dbeafe", color: "#1d4ed8" }}>Worky</span>
                                ) : null}
                              </div>
                              <div className="ha-course-title">{course.nome}</div>
                              {course.motivo && <div className="ha-course-reason">{course.motivo}</div>}
                              <div className="ha-course-footer">
                                <span className="ha-course-area-badge" style={course.area === "Soft Skills" ? { background: "#fff7ed", color: "#b45309" } : undefined}>{course.area || "Curso"}</span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M7 7h10v10" /></svg>
                              </div>
                            </div>
                          </button>
                        )
                      }) : (
                        <button type="button" className="ha-course-card" disabled>
                          <CourseThumb plataforma="Worky" />
                          <div className="ha-course-body">
                            <div className="ha-course-platform" style={{ color: "#003ec7" }}>Worky</div>
                            <div className="ha-course-title">Cursos aparecem após a análise</div>
                            <div className="ha-course-reason">Rode uma nova busca para ver cursos com link.</div>
                            <div className="ha-course-footer">
                              <span className="ha-course-price">Aguardando</span>
                            </div>
                          </div>
                        </button>
                      )}
                    </div>
                  </section>
                </div>

                <aside className="ha-right-col">
                  <div className="ha-right-sticky">
                    <div className="ha-salary-card">
                      <div className="ha-salary-title">Progressão Salarial</div>
                      <div className="ha-salary-list">
                        {salaryProgression.map((band) => (
                          <div key={band.label} className={`ha-salary-item${band.active ? " active" : ""}`}>
                            <div className="ha-salary-dot" />
                            <div className="ha-salary-level">{band.label}</div>
                            <div className="ha-salary-range">{band.range}</div>
                          </div>
                        ))}
                      </div>
                      <div className="ha-salary-note">
                        Estimativa geral para o Brasil. Valores variam por região, contrato, porte da empresa e maturidade técnica.
                      </div>
                    </div>
                    <MatchPerfil
                      pct={matchResult?.pct ?? compatibilityPct}
                      cargo={career.carreira}
                      matched={matchResult?.matched ?? matchedSkills}
                      gaps={matchResult?.gaps ?? gapSkills}
                      onComplete={() => navigate("/perfil")}
                      locked={!matchResult}
                      onCalculate={handleCalculateMatch}
                      loading={matchLoading}
                    />
                    {user && matchQuota.used >= matchQuota.limit && (
                      <div style={{ marginTop: "1.5rem" }}>
                        <ReferralCard
                          variant="unlock"
                          link={getReferralLink(user.id)}
                          bonusAmount={REFERRAL_BONUS_MATCHES}
                          onCopied={() => setMatchQuota(grantBonusMatches(user.id))}
                        />
                      </div>
                    )}
                    <div style={{ marginTop: "1.5rem" }}>
                      <AdSlot
                        placement="aside"
                        title="Propaganda aqui"
                        hint="Aside lateral da página de resultados"
                      />
                    </div>
                    <div className="ha-salary-card ha-demanda-card" style={{ marginTop: "1.5rem", background: "#0f172a", border: "1px solid #1e293b" }}>
                      <div className="ha-salary-title" style={{ color: "white" }}>Onde estão as vagas?</div>
                      <div className="ha-demanda-list">
                        {(demandRows.length ? demandRows : [{ label: "Em análise", pct: 0 }]).map((item) => (
                          <div key={item.label} className="ha-demanda-row">
                            <div className="ha-demanda-meta" style={{ color: "#e2e8f0" }}><span>{item.label}</span><span>{item.pct}%</span></div>
                            <div className="ha-demanda-track" style={{ background: "#1e293b" }}>
                              <div className="ha-demanda-fill" style={{ width: `${item.pct}%`, background: "#14b8a6" }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </aside>
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
          <SiteFooter copy="2026 Worky. Dados de mercado para a sua carreira." />
        )}
      </div>
    </>
  );
}
