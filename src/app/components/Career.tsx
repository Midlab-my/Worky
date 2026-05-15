import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";
import { type CareerAnalysis, type CareerOpportunity, jobService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { getUserInitials } from "../services/auth";

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
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
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

.ha-app { font-family: 'Inter', sans-serif; background: var(--surface); color: var(--on-surface); min-height: 100vh; }

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

.ha-layout { display: flex; }

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
.ha-content-grid { display: grid; grid-template-columns: 1fr 280px; gap: 2rem; max-width: 1100px; width: 100%; margin: 0 auto; align-items: start; }
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

.ha-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 2rem; }
.ha-stat-card {
  background: white; border: 1px solid var(--outline);
  border-radius: var(--radius-md); padding: 1rem 1.1rem;
}
.ha-stat-label { font-size: 0.72rem; color: var(--on-surface-muted); font-weight: 500; margin-bottom: 4px; }
.ha-stat-value { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.35rem; font-weight: 800; color: var(--on-surface); display: flex; align-items: baseline; gap: 4px; }
.ha-stat-unit { font-size: 0.7rem; font-weight: 500; color: var(--on-surface-muted); }
.ha-stat-badge { display: inline-flex; align-items: center; gap: 3px; font-size: 0.68rem; font-weight: 600; background: #e8faf0; color: #16a34a; padding: 2px 7px; border-radius: 20px; margin-top: 4px; }
.ha-stat-dots { display: flex; gap: 4px; margin-top: 6px; }
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
.ha-cert-card { background: var(--surface-low); border: 1px solid var(--outline); border-radius: var(--radius-sm); padding: 10px 12px; display: flex; align-items: center; gap: 10px; }
.ha-cert-logo { width: 36px; height: 36px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.72rem; flex-shrink: 0; }
.ha-cert-name { font-size: 0.8rem; font-weight: 600; color: var(--on-surface); }
.ha-cert-sub { font-size: 0.7rem; color: var(--on-surface-muted); }

.ha-jobs-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.ha-ver-todas { background: none; border: none; font-family: 'Inter', sans-serif; font-size: 0.8rem; font-weight: 500; color: var(--primary); cursor: pointer; }
.ha-ver-todas:hover { text-decoration: underline; }
.ha-jobs-list { display: flex; flex-direction: column; gap: 1px; background: var(--outline); border-radius: var(--radius-lg); overflow: hidden; border: 1px solid var(--outline); }
.ha-job-card { background: white; padding: 1.1rem 1.25rem; display: flex; align-items: center; gap: 1rem; cursor: pointer; border: none; width: 100%; font-family: 'Inter', sans-serif; text-align: left; }
.ha-job-card:hover { background: var(--surface-low); }
.ha-job-logo { width: 44px; height: 44px; border-radius: var(--radius-sm); overflow: hidden; flex-shrink: 0; background: var(--surface-highest); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.7rem; color: var(--on-surface-muted); }
.ha-job-info { flex: 1; min-width: 0; }
.ha-job-title { font-size: 0.9rem; font-weight: 700; color: var(--on-surface); margin-bottom: 4px; }
.ha-job-meta { display: flex; flex-wrap: wrap; gap: 10px; }
.ha-job-tag { display: flex; align-items: center; gap: 3px; font-size: 0.75rem; color: var(--on-surface-muted); }
.btn-ver-vaga { background: var(--primary); color: white; border: none; padding: 0.5rem 1.1rem; border-radius: var(--radius-sm); font-size: 0.8rem; font-weight: 700; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
.btn-ver-vaga:hover { background: #002fa3; }
.ver-mais-btn { display: flex; align-items: center; gap: 6px; margin-top: 0.75rem; background: none; border: 1px solid var(--outline); border-radius: var(--radius-sm); padding: 0.5rem 1rem; font-size: 0.82rem; font-weight: 600; color: var(--primary); cursor: pointer; width: 100%; justify-content: center; }
.ver-mais-btn:hover { background: var(--surface-low); }

.ha-courses-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.ha-course-card { background: white; border: 1px solid var(--outline); border-radius: var(--radius-lg); overflow: hidden; cursor: pointer; }
.ha-course-card:hover .ha-course-title { color: var(--primary); }
.ha-course-thumb { height: 100px; display: flex; align-items: center; justify-content: center; }
.ha-course-body { padding: 12px 14px; }
.ha-course-platform { font-size: 0.65rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 4px; }
.ha-course-title { font-size: 0.82rem; font-weight: 700; color: var(--on-surface); line-height: 1.4; transition: color 0.15s; }
.ha-course-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; }
.ha-course-price { font-size: 0.82rem; font-weight: 700; }

.ha-right-sticky { position: sticky; top: 80px; }
.ha-salary-card { background: var(--surface-low); border-radius: var(--radius-xl); padding: 1.5rem; margin-bottom: 0; }
.ha-salary-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1rem; font-weight: 700; margin-bottom: 1.25rem; }
.ha-salary-list { display: flex; flex-direction: column; gap: 1.25rem; }
.ha-salary-item { position: relative; padding-left: 1.5rem; border-left: 2px solid var(--outline); }
.ha-salary-item.active { border-left-color: var(--primary); }
.ha-salary-dot { position: absolute; left: -5px; top: 3px; width: 8px; height: 8px; border-radius: 50%; background: var(--outline); }
.ha-salary-item.active .ha-salary-dot { background: var(--primary); }
.ha-salary-level { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--on-surface-muted); }
.ha-salary-item.active .ha-salary-level { color: var(--primary); }
.ha-salary-range { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 1rem; color: var(--on-surface); margin: 2px 0; }
.ha-salary-item.active .ha-salary-range { font-size: 1.2rem; color: var(--primary); }
.ha-salary-sub { font-size: 0.7rem; color: var(--on-surface-muted); font-style: italic; }

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

.ha-footer { border-top: 1px solid var(--outline); background: white; padding: 2.5rem 2rem; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1.5rem; }
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
  .ha-content-grid { grid-template-columns: 1fr; }
  .ha-right-col { display: none; }
  .ha-stats { grid-template-columns: repeat(2, 1fr); }
  .ha-courses-grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 640px) {
  .ha-topnav { height: auto; min-height: 60px; padding: 0.85rem 1rem; flex-wrap: wrap; gap: 0.75rem; }
  .ha-topnav > div:first-child { flex-wrap: wrap; gap: 1rem !important; }
  .ha-sidebar { display: none; }
  .ha-main { padding: 1.5rem 1rem 3rem; }
  .ha-stats { grid-template-columns: 1fr 1fr; }
  .ha-desc-text { padding-right: 0; padding-top: 1.5rem; }
  .ha-skills-grid, .ha-certs-grid, .ha-courses-grid { grid-template-columns: 1fr; }
  .ha-job-card { align-items: flex-start; flex-wrap: wrap; }
  .btn-ver-vaga { width: 100%; }
}
`;

const COURSE_VISUALS = [
  { platformColor: "#a435f0", thumbBg: "#ede9fe", thumbColor: "#7c3aed", icon: "code" as const },
  { platformColor: "#005858", thumbBg: "#e0f7f7", thumbColor: "#005858", icon: "palette" as const },
  { platformColor: "#4459a8", thumbBg: "#e8ecff", thumbColor: "#3b4faa", icon: "terminal" as const },
];

type CourseIcon = "code" | "palette" | "terminal";

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
  const lower = Math.max(0, Math.round(Math.min(min, max)));
  const upper = Math.max(lower, Math.round(Math.max(min, max)));

  if (lower === upper) return formatter.format(lower);
  return `${formatter.format(lower)} a ${formatter.format(upper)}`;
}

function parseSalaryValues(text: string) {
  const normalized = text.replace(/\./g, "").replace(/,/g, ".");
  const matches = normalized.match(/\d+(?:\.\d+)?/g) || [];
  return matches.map((value) => Number.parseFloat(value)).filter((value) => Number.isFinite(value));
}

function buildSalaryProgression(mediaSalarial: string) {
  const values = parseSalaryValues(mediaSalarial);

  if (!values.length) {
    return [
      { label: "Júnior", range: "Consultar" },
      { label: "Pleno", range: "Consultar", active: true },
      { label: "Sênior", range: "Consultar" },
    ];
  }

  if (values.length === 1) {
    const base = values[0];
    return [
      { label: "Júnior", range: formatSalaryRange(base * 0.7, base * 0.9) },
      { label: "Pleno", range: formatSalaryRange(base * 0.9, base * 1.1), active: true },
      { label: "Sênior", range: formatSalaryRange(base * 1.1, base * 1.35) },
    ];
  }

  const [rawMin, rawMax] = values;
  const min = Math.min(rawMin, rawMax);
  const max = Math.max(rawMin, rawMax);
  const width = Math.max(max - min, max * 0.2);

  return [
    { label: "Júnior", range: formatSalaryRange(min - width * 0.25, min + width * 0.2) },
    { label: "Pleno", range: formatSalaryRange(min, max), active: true },
    { label: "Sênior", range: formatSalaryRange(max + width * 0.15, max + width * 0.5) },
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

function hasUsableAiAnalysis(data: CareerAnalysis | null) {
  if (!data) return false;

  const hasAiFields =
    data.competenciasDesejadas.habilidadesTecnicas.length > 0 ||
    data.competenciasDesejadas.softSkills.length > 0 ||
    data.certificacoesRecomendadas.length > 0 ||
    data.cursosRecomendados.length > 0;

  return Boolean(
    data.metadata?.schemaVersion === 2 &&
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

function CourseThumb({ icon, bg, color }: { icon: CourseIcon; bg: string; color: string }) {
  const paths: Record<CourseIcon, string> = {
    code: "M16 18l6-6-6-6M8 6l-6 6 6 6",
    palette: "M12 2a10 10 0 1 0 0 20 4 4 0 0 0 0-8 4 4 0 0 1 0-8 2 2 0 1 1 0 4",
    terminal: "M4 17l6-6-6-6M12 19h8",
  };
  return (
    <div className="ha-course-thumb" style={{ background: bg }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={paths[icon]} />
      </svg>
    </div>
  );
}

export function Career() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<CareerAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shareCopied, setShareCopied] = useState(false);
  const [externalJob, setExternalJob] = useState<CareerOpportunity | null>(null);
  const profilePath = user ? "/perfil" : "/auth";
  const profileLabel = user ? getUserInitials(user) : "Login";
  const profileAriaLabel = user ? `Abrir perfil de ${user.name}` : "Entrar";

  const cargo = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("cargo") || "";
  }, [location.search]);
  const searchFilters = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return {
      skills: params.get("skills") || "",
      local: params.get("local") || "",
      modelo: params.get("modelo") || "",
    };
  }, [location.search]);
  const initialAnalysis = useMemo(() => {
    const state = location.state as { analysis?: CareerAnalysis } | null;
    return state?.analysis || null;
  }, [location.state]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    if (!cargo) {
      setAnalysis(null);
      setLoading(false);
      setError("Informe uma carreira na busca para gerar a análise.");
      return () => {
        cancelled = true;
      };
    }

    if (hasUsableAiAnalysis(initialAnalysis)) {
      setAnalysis(initialAnalysis);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    jobService.getCarreira(cargo, searchFilters).then((data) => {
      if (cancelled) return;
      if (data) {
        setAnalysis(data);
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
  }, [cargo, initialAnalysis, searchFilters]);

  const career = analysis || emptyAnalysis(cargo || "Carreira");
  const title = splitCareerName(career.carreira);
  const techSkills = career.competenciasDesejadas.habilidadesTecnicas;
  const softSkills = career.competenciasDesejadas.softSkills;
  const certs = career.certificacoesRecomendadas;
  const jobs = career.todasVagas?.length ? career.todasVagas : career.oportunidadesDestaque;
  const courses = career.cursosRecomendados;
  const demandRows = buildDemandRows(jobs);
  const salaryProgression = buildSalaryProgression(career.mediaSalarial);

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
      <div className="ha-app">
        {externalJob && (
          <ExitModal
            onCancel={closeExitModal}
            onContinue={continueToJob}
          />
        )}
        <nav className="ha-topnav">
          <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
            <button type="button" className="ha-logo" onClick={() => navigate("/")}>Worky</button>
            <div className="ha-nav-links">
              <button type="button" className="ha-nav-link active" onClick={() => navigate("/")}>Explorar</button>
              <button type="button" className="ha-nav-link" onClick={() => document.querySelector(".ha-desc-card")?.scrollIntoView({ behavior: "smooth" })}>Sobre</button>
            </div>
          </div>
          <div className="ha-nav-actions">
            <button
              type="button"
              className={`btn-primary-nav${user ? " btn-profile-avatar" : ""}`}
              onClick={() => navigate(profilePath)}
              aria-label={profileAriaLabel}
              title={profileAriaLabel}
            >
              {profileLabel}
            </button>
          </div>
        </nav>

        <div className="ha-layout">
          <main className="ha-main">
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ width: 40, height: 40, border: '3px solid var(--primary-light)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <p style={{ color: 'var(--on-surface-muted)', fontWeight: 500 }}>Buscando e analisando vagas reais para {cargo}...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : error || !analysis ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--on-surface-muted)" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
                </svg>
                <p style={{ color: 'var(--on-surface-muted)', fontWeight: 500, fontSize: '1.1rem' }}>{error || "Nenhum dado encontrado."}</p>
                <button type="button" className="btn-primary-nav" onClick={() => navigate("/")} style={{ marginTop: '1rem' }}>Voltar ao Início</button>
              </div>
            ) : (
            <div className="ha-content-grid">
              <div className="ha-left-col">
                <h1 className="ha-page-title">
                  {title.prefix} {title.accent && <span className="accent">{title.accent}</span>}
                </h1>

                <div className="ha-desc-card">
                  <div className="ha-desc-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#005858" stroke="none"><path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z" /></svg>
                    Insight IA
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
                        {career.crescimentoMensal && <div className="ha-stat-badge">↑ {career.crescimentoMensal} mês</div>}
                        <div className="ha-stat-dots" style={{ marginTop: 6 }}>
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
                  />
                  <StatCard
                    label="Crescimento Anual"
                    value={career.crescimentoAnual || "Não informado"}
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
                      {certs.length ? certs.map((cert) => (
                        <div key={`${cert.empresa}-${cert.nome}`} className="ha-cert-card">
                          <div className="ha-cert-logo" style={{ background: colorFromText(cert.empresa), color: "white" }}>{getInitials(cert.empresa)}</div>
                          <div>
                            <div className="ha-cert-name">{cert.nome}</div>
                            <div className="ha-cert-sub">{cert.descricao}</div>
                          </div>
                        </div>
                      )) : (
                        <div className="ha-cert-card">
                          <div className="ha-cert-logo" style={{ background: "#c3c5d9", color: "#434656" }}>AI</div>
                          <div>
                            <div className="ha-cert-name">Em análise</div>
                            <div className="ha-cert-sub">Aguardando recomendações da IA</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                <section className="ha-section">
                  <div className="ha-jobs-header">
                    <div className="ha-section-title" style={{ marginBottom: 0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-4 0v2M8 7V5a2 2 0 0 0 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                      Oportunidades em Destaque
                    </div>
                  </div>
                  <div style={{ marginTop: "1rem" }}>
                    <div className="ha-jobs-list">
                      {jobs.length ? jobs.map((job, index) => (
                        <button type="button" key={`${job.titulo}-${index}`} className="ha-job-card" onClick={() => requestOpenJob(job)}>
                          <div className="ha-job-logo" style={{ background: colorFromText(job.empresa || job.titulo), color: "white", fontSize: "0.8rem", fontWeight: 700 }}>
                            {getInitials(job.empresa || job.titulo)}
                          </div>
                          <div className="ha-job-info">
                            <div className="ha-job-title">{job.titulo}</div>
                            <div className="ha-job-meta">
                              <span className="ha-job-tag">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                {job.localidade || job.modalidade || "Consultar localidade"}
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
                          <span className="btn-ver-vaga">Ver vaga</span>
                        </button>
                      )) : (
                        <button type="button" className="ha-job-card" onClick={goToJobs}>
                          <div className="ha-job-logo" style={{ background: "#c3c5d9", color: "#434656", fontSize: "0.8rem", fontWeight: 700 }}>
                            AI
                          </div>
                          <div className="ha-job-info">
                            <div className="ha-job-title">Coletando oportunidades reais</div>
                            <div className="ha-job-meta">
                              <span className="ha-job-tag">Aguarde a análise do scraper</span>
                            </div>
                          </div>
                          <span className="btn-ver-vaga">Atualizar</span>
                        </button>
                      )}
                    </div>
                  </div>
                </section>

                <section className="ha-section">
                  <div className="ha-section-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 10v6M2 10l10-5 10 5-10 5zM6 12v5c3 3 9 3 12 0v-5" /></svg>
                    Acelere sua Carreira
                  </div>
                  <div className="ha-courses-grid">
                    {courses.length ? courses.map((course, index) => {
                      const visual = COURSE_VISUALS[index % COURSE_VISUALS.length];
                      return (
                      <div key={`${course.plataforma}-${course.nome}`} className="ha-course-card">
                        <CourseThumb icon={visual.icon} bg={visual.thumbBg} color={visual.thumbColor} />
                        <div className="ha-course-body">
                          <div className="ha-course-platform" style={{ color: visual.platformColor }}>{course.plataforma}</div>
                          <div className="ha-course-title">{course.nome}</div>
                          <div className="ha-course-footer">
                            <span className="ha-course-price">{course.preco || "Consultar"}</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M7 7h10v10" /></svg>
                          </div>
                        </div>
                      </div>
                    )}) : (
                      <div className="ha-course-card">
                        <CourseThumb icon="code" bg="#e8ecff" color="#4459a8" />
                        <div className="ha-course-body">
                          <div className="ha-course-platform" style={{ color: "#4459a8" }}>IA</div>
                          <div className="ha-course-title">Recomendações em análise</div>
                          <div className="ha-course-footer">
                            <span className="ha-course-price">Consultar</span>
                          </div>
                        </div>
                      </div>
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
                          <div className="ha-salary-sub">Faixa depende da senioridade e região</div>
                        </div>
                      ))}
                    </div>

                    <div className="ha-demanda-card">
                      <div className="ha-demanda-title">Onde estão as vagas?</div>
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
                  </div>
                </div>
              </aside>
            </div>
            )}
          </main>
        </div>

        <footer className="ha-footer">
          <div>
            <div className="ha-footer-logo">Worky</div>
            <div className="ha-footer-copy">© 2026 Worky. Inteligência de Mercado aplicada ao seu futuro profissional.</div>
          </div>
          <div className="ha-footer-links">
            {["Privacidade", "Termos", "Contato", "Suporte"].map((link) => (
              <button type="button" key={link} className="ha-footer-link">{link}</button>
            ))}
          </div>
          <div className="ha-footer-icons">
            <div className="ha-footer-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
            </div>
            <div className="ha-footer-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
