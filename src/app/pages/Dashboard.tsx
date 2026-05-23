import { useState, useRef, useEffect, useMemo, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { jobService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";

const style = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@400;500&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; background: #f5f6fa; }

  .ha-root { font-family: 'Inter', sans-serif; color: #0f172a; background: #f5f6fa; min-height: 100vh; }

  .ha-nav {
    position: sticky; top: 0; z-index: 50;
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid #e2e8f0;
    padding: 0 2rem;
    display: flex; align-items: center; justify-content: space-between;
    height: 60px;
  }
  .ha-nav-logo { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 1.1rem; color: #003ec7; background: none; border: none; cursor: pointer; }
  .ha-nav-links { display: flex; gap: 2rem; align-items: center; }
  .ha-nav-link { background: none; border: none; font-family: 'Inter', sans-serif; font-size: 0.875rem; color: #64748b; text-decoration: none; cursor: pointer; }
  .ha-nav-link.active { color: #2563eb; font-weight: 500; border-bottom: 2px solid #2563eb; padding-bottom: 2px; }
  .ha-nav-actions { display: flex; gap: 0.75rem; align-items: center; }
  .btn-ghost { background: none; border: none; font-size: 0.875rem; color: #374151; cursor: pointer; padding: 0.4rem 0.75rem; border-radius: 6px; }
  .btn-ghost:hover { background: #f1f5f9; }
  .btn-primary { background: #2563eb; color: white; border: none; padding: 0.45rem 1.1rem; border-radius: 20px; font-size: 0.875rem; font-weight: 500; cursor: pointer; }
  .btn-primary:hover { background: #1d4ed8; }
  .btn-profile-avatar {
    width: 38px; height: 38px; padding: 0; border-radius: 50%;
    display: inline-flex; align-items: center; justify-content: center;
    font-weight: 700; letter-spacing: 0;
  }

  .ha-hero {
    text-align: center;
    padding: 5rem 1.5rem 3.5rem;
    background: linear-gradient(180deg, #ffffff 0%, #f5f6fa 100%);
  }
  .ha-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: #eff6ff; color: #2563eb;
    border: 1px solid #bfdbfe;
    border-radius: 20px; padding: 4px 14px;
    font-size: 0.72rem; font-weight: 600; letter-spacing: 0.08em;
    text-transform: uppercase; margin-bottom: 1.75rem;
  }
  .ha-hero-title {
    font-family: 'Sora', sans-serif;
    font-size: clamp(2.2rem, 5vw, 3.4rem);
    font-weight: 800; line-height: 1.15;
    color: #0f172a; margin-bottom: 1.1rem;
    max-width: 700px; margin-left: auto; margin-right: auto;
  }
  .ha-hero-title .accent { color: #2563eb; }
  .ha-hero-sub {
    font-size: 0.95rem; color: #64748b; line-height: 1.6;
    max-width: 480px; margin: 0 auto 2rem;
  }
  .ha-search-container { position: relative; max-width: 560px; margin: 0 auto 1.5rem; }
  .ha-search-wrap {
    display: flex;
    background: white; border-radius: 50px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 2px 16px rgba(0,0,0,0.07);
    overflow: hidden; padding: 5px 5px 5px 16px;
    align-items: center; gap: 8px;
  }
  .ha-category-dropdown {
    position: absolute; top: calc(100% + 8px); left: 0; right: 0;
    background: white; border: 1px solid #e2e8f0;
    border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.1);
    max-height: 360px; overflow-y: auto; overflow-x: hidden; z-index: 100;
    text-align: left;
  }
  .ha-recent-searches {
    padding: 12px 16px;
    border-bottom: 1px solid #eef2f7;
    background: #fbfdff;
  }
  .ha-recent-title {
    font-size: 0.68rem; font-weight: 800; color: #94a3b8;
    text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px;
  }
  .ha-recent-list { display: flex; flex-wrap: wrap; gap: 6px; }
  .ha-recent-item {
    border: 1px solid #dbe5f4; background: white; color: #2563eb;
    border-radius: 999px; padding: 5px 10px; font-size: 0.78rem;
    font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif;
  }
  .ha-recent-item:hover { border-color: #2563eb; background: #eff6ff; }
  .ha-career-category-button {
    width: 100%; border: 0; background: white; padding: 12px 16px;
    text-align: left; cursor: pointer; display: grid;
    grid-template-columns: 1fr auto; gap: 0.75rem; align-items: center;
    font-family: 'Inter', sans-serif; transition: background 0.1s;
  }
  .ha-career-category-button:hover { background: #f8fafc; }
  .ha-career-category-name {
    display: block; font-size: 0.88rem; font-weight: 750; color: #0f172a;
  }
  .ha-career-category-desc {
    display: block; margin-top: 2px; font-size: 0.75rem;
    color: #94a3b8; line-height: 1.45;
  }
  .ha-career-count {
    font-size: 0.68rem; font-weight: 800; color: #003ec7;
    background: #dde1ff; border-radius: 999px; padding: 3px 8px;
  }
  .ha-career-back {
    width: 100%; border: 0; background: #f8fafc; color: #003ec7;
    padding: 10px 16px; font-size: 0.82rem; font-weight: 750;
    text-align: left; cursor: pointer; font-family: 'Inter', sans-serif;
  }
  .ha-career-item {
    width: 100%; border: 0; background: white; padding: 10px 16px;
    font-size: 0.875rem; cursor: pointer; color: #0f172a;
    transition: background 0.1s; display: flex; align-items: center; gap: 8px;
    text-align: left; font-family: 'Inter', sans-serif;
  }
  .ha-career-item:hover { background: #f8fafc; }
  .ha-career-item-type {
    font-size: 0.68rem; font-weight: 700; padding: 2px 7px;
    border-radius: 20px; text-transform: uppercase; letter-spacing: 0.05em;
    background: rgba(0,82,255,0.1); color: #003ec7;
  }
  .ha-empty-state { padding: 12px 16px; font-size: 0.82rem; color: #94a3b8; }
  .ha-search-wrap svg { color: #94a3b8; flex-shrink: 0; }
  .ha-search-input {
    flex: 1; min-width: 0; border: none; outline: none;
    font-size: 0.875rem; color: #374151; background: none;
    font-family: 'Inter', sans-serif;
  }
  .ha-search-input::placeholder { color: #94a3b8; }
  .btn-search {
    background: #2563eb; color: white; border: none;
    padding: 0.55rem 1.3rem; border-radius: 50px;
    font-size: 0.875rem; font-weight: 500; cursor: pointer;
    white-space: nowrap; display: flex; align-items: center; gap: 6px;
  }
  .btn-search:hover { background: #1d4ed8; }
  .btn-search:disabled { opacity: 0.78; cursor: wait; }
  .ha-tags { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; }
  .ha-tag {
    color: #64748b; font-size: 0.82rem; cursor: pointer;
    padding: 4px 10px; border-radius: 20px; border: 1px solid #e2e8f0;
    background: white; font-family: 'Inter', sans-serif;
  }
  .ha-tag:hover { border-color: #2563eb; color: #2563eb; }
  .ha-tag:disabled { opacity: 0.58; cursor: not-allowed; }

  .ha-analysis-overlay {
    position: fixed; inset: 0; z-index: 200;
    display: flex; align-items: center; justify-content: center;
    padding: 1rem;
    background: rgba(15, 23, 42, 0.42);
    backdrop-filter: blur(8px);
  }
  .ha-analysis-modal {
    width: min(100%, 440px);
    background: white;
    border: 1px solid #dbe3ef;
    border-radius: 20px;
    box-shadow: 0 24px 70px rgba(15, 23, 42, 0.24);
    padding: 1.5rem;
    text-align: left;
  }
  .ha-analysis-top {
    display: flex; align-items: center; gap: 1rem;
    margin-bottom: 1.25rem;
  }
  .ha-analysis-spinner {
    width: 54px; height: 54px; flex-shrink: 0;
    border-radius: 50%;
    border: 4px solid #dbeafe;
    border-top-color: #2563eb;
    animation: ha-spin 0.9s linear infinite;
    position: relative;
  }
  .ha-analysis-spinner::after {
    content: "";
    position: absolute; inset: 12px;
    border-radius: 50%;
    background: #eff6ff;
    animation: ha-pulse 1.4s ease-in-out infinite;
  }
  .ha-analysis-eyebrow {
    color: #2563eb;
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 0.35rem;
  }
  .ha-analysis-title {
    font-family: 'Sora', sans-serif;
    color: #0f172a;
    font-size: 1.15rem;
    font-weight: 800;
    line-height: 1.25;
  }
  .ha-analysis-step {
    color: #475569;
    font-size: 0.88rem;
    font-weight: 600;
    line-height: 1.45;
    margin-bottom: 1rem;
  }
  .ha-analysis-progress {
    height: 8px;
    border-radius: 999px;
    overflow: hidden;
    background: #e2e8f0;
    margin-bottom: 1rem;
  }
  .ha-analysis-progress-bar {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #2563eb 0%, #0d9488 100%);
    transition: width 0.35s ease;
  }
  .ha-analysis-metrics {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  .ha-analysis-metric {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 0.75rem;
  }
  .ha-analysis-label {
    color: #64748b;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin-bottom: 0.25rem;
  }
  .ha-analysis-value {
    color: #0f172a;
    font-family: 'Sora', sans-serif;
    font-size: 1rem;
    font-weight: 800;
  }
  .ha-analysis-timeline {
    display: grid;
    gap: 0.55rem;
    margin-bottom: 1.25rem;
  }
  .ha-analysis-timeline-item {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    color: #94a3b8;
    font-size: 0.78rem;
    font-weight: 600;
  }
  .ha-analysis-timeline-dot {
    width: 9px; height: 9px; border-radius: 50%;
    background: #cbd5e1;
    flex-shrink: 0;
  }
  .ha-analysis-timeline-item.active { color: #2563eb; }
  .ha-analysis-timeline-item.active .ha-analysis-timeline-dot {
    background: #2563eb;
    box-shadow: 0 0 0 4px #dbeafe;
  }
  .ha-analysis-actions {
    display: flex;
    justify-content: flex-end;
  }
  .btn-cancel-analysis {
    background: white;
    color: #334155;
    border: 1px solid #cbd5e1;
    border-radius: 999px;
    padding: 0.62rem 1.1rem;
    font-family: 'Inter', sans-serif;
    font-size: 0.86rem;
    font-weight: 700;
    cursor: pointer;
  }
  .btn-cancel-analysis:hover {
    border-color: #ef4444;
    color: #dc2626;
    background: #fef2f2;
  }
  @keyframes ha-spin { to { transform: rotate(360deg); } }
  @keyframes ha-pulse {
    0%, 100% { transform: scale(0.86); opacity: 0.75; }
    50% { transform: scale(1); opacity: 1; }
  }

  .ha-section { max-width: 920px; margin: 0 auto; padding: 0 1.5rem 3rem; }
  .ha-termo-card {
    background: white; border-radius: 20px;
    border: 1px solid #e2e8f0;
    display: grid; grid-template-columns: 1fr 220px;
    overflow: hidden;
    box-shadow: 0 2px 20px rgba(0,0,0,0.05);
  }
  .ha-termo-left { padding: 1.5rem 1.75rem; }
  .ha-termo-header { display: flex; align-items: center; gap: 10px; margin-bottom: 1.25rem; flex-wrap: wrap; }
  .ha-termo-title { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 0.95rem; color: #0f172a; }
  .ha-termo-sub { font-size: 0.78rem; color: #94a3b8; }
  .ha-termo-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
  .ha-termo-item-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 6px; }
  .ha-termo-name { font-size: 0.8rem; color: #374151; font-weight: 500; line-height: 1.3; }
  .ha-termo-pct { font-size: 0.75rem; color: #16a34a; font-weight: 600; }
  .ha-termo-bars { display: flex; align-items: flex-end; gap: 2px; height: 36px; }
  .ha-termo-bar { width: 6px; border-radius: 2px; background: #dbeafe; }
  .ha-termo-bar.active { background: #2563eb; }
  .ha-insight {
    background: #0d9488; color: white;
    padding: 1.5rem; display: flex; flex-direction: column; justify-content: center;
  }
  .ha-insight-badge {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 0.65rem; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; margin-bottom: 0.75rem;
    opacity: 0.85;
  }
  .ha-insight-text { font-size: 0.88rem; line-height: 1.5; font-weight: 500; }
  .ha-insight-text span { text-decoration: underline; }
  .ha-insight-meta { font-size: 0.72rem; opacity: 0.65; margin-top: 0.75rem; }

  .ha-features-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  .ha-feat-card {
    border-radius: 18px; padding: 1.6rem;
    border: 1px solid #e2e8f0; background: white;
    overflow: hidden; position: relative;
  }
  .ha-feat-card.dark { background: #0f172a; border-color: #1e293b; }
  .ha-feat-card.teal { background: #0d9488; border-color: #0d9488; }
  .ha-feat-card.blue { background: #2563eb; border-color: #2563eb; overflow: hidden; }
  .ha-feat-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; }
  .ha-feat-title { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 1rem; margin-bottom: 0.5rem; }
  .ha-feat-text { font-size: 0.82rem; line-height: 1.6; color: #64748b; }
  .ha-feat-card.dark .ha-feat-title,
  .ha-feat-card.dark .ha-feat-text { color: #e2e8f0; }
  .ha-feat-card.teal .ha-feat-title,
  .ha-feat-card.teal .ha-feat-text { color: white; }
  .ha-feat-card.blue .ha-feat-title { color: white; }
  .ha-feat-card.blue .ha-feat-text { color: rgba(255,255,255,0.75); }

  .ha-salary-chart {
    margin-top: 1rem; height: 48px;
    background: #0f172a; border-radius: 8px;
    display: flex; align-items: flex-end; padding: 6px 8px; gap: 3px;
  }
  .ha-salary-bar { flex: 1; border-radius: 2px; background: #0d9488; opacity: 0.7; }
  .ha-salary-bar:nth-child(4n) { opacity: 1; background: #14b8a6; }

  .ha-skill-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 1rem; }
  .ha-skill-tag {
    background: rgba(255,255,255,0.2); color: white;
    font-size: 0.72rem; font-weight: 500;
    padding: 4px 10px; border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.3);
  }

  .ha-feat-card.blue {
    display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; align-items: center;
  }
  .ha-blue-label { font-size: 0.72rem; color: rgba(255,255,255,0.7); font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 0.5rem; }
  .ha-blue-title { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 1rem; color: white; margin-bottom: 0.6rem; }
  .ha-blue-text { font-size: 0.8rem; color: rgba(255,255,255,0.75); line-height: 1.5; margin-bottom: 1rem; }
  .btn-white { background: white; color: #2563eb; border: none; padding: 0.45rem 1rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600; cursor: pointer; }
  .btn-white:hover { background: #eff6ff; }
  .ha-blue-visual {
    background: rgba(0,0,0,0.2); border-radius: 12px; height: 120px;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
  }

  .ha-lightning-icon { width: 40px; height: 40px; background: #fef3c7; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; }

  .ha-cta-section {
    background: white; padding: 5rem 1.5rem;
    text-align: center; position: relative; overflow: hidden;
  }
  .ha-cta-bg {
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 60% 50% at 50% 120%, rgba(37,99,235,0.07) 0%, transparent 70%);
    pointer-events: none;
  }
  .ha-cta-title {
    font-family: 'Sora', sans-serif;
    font-size: clamp(2rem, 4vw, 3rem);
    font-weight: 800; color: #0f172a; line-height: 1.2;
    margin-bottom: 0.75rem;
  }
  .ha-cta-title em { font-style: italic; color: #2563eb; }
  .ha-cta-sub { font-size: 0.9rem; color: #64748b; margin-bottom: 2.5rem; max-width: 360px; margin-left: auto; margin-right: auto; }
  .ha-cta-btns { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
  .btn-cta-primary {
    background: #2563eb; color: white; border: none;
    padding: 0.75rem 1.75rem; border-radius: 50px;
    font-size: 0.9rem; font-weight: 600; cursor: pointer;
  }
  .btn-cta-primary:hover { background: #1d4ed8; }
  .btn-cta-ghost {
    background: white; color: #374151;
    border: 1px solid #e2e8f0;
    padding: 0.75rem 1.75rem; border-radius: 50px;
    font-size: 0.9rem; font-weight: 500; cursor: pointer;
  }
  .btn-cta-ghost:hover { border-color: #2563eb; color: #2563eb; }

  .ha-footer {
    background: white; border-top: 1px solid #e2e8f0;
    padding: 1.5rem 2rem;
    display: flex; justify-content: space-between; align-items: center;
    flex-wrap: wrap; gap: 1rem;
  }
  .ha-footer-logo { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 0.9rem; color: #003ec7; }
  .ha-footer-copy { font-size: 0.78rem; color: #94a3b8; margin-top: 2px; }
  .ha-footer-links { display: flex; gap: 1.5rem; flex-wrap: wrap; }
  .ha-footer-link { background: none; border: none; font-family: 'Inter', sans-serif; font-size: 0.8rem; color: #64748b; cursor: pointer; }
  .ha-footer-link:hover { color: #2563eb; }

  @media (max-width: 720px) {
    .ha-nav { height: auto; min-height: 60px; flex-wrap: wrap; gap: 0.75rem; padding: 0.75rem 1rem; }
    .ha-nav-links { order: 3; width: 100%; justify-content: center; gap: 1.25rem; }
    .ha-nav-actions { margin-left: auto; }
    .ha-hero { padding-top: 3rem; }
  }

  @media (max-width: 640px) {
    .ha-search-wrap { border-radius: 24px; align-items: stretch; }
    .btn-search { padding-left: 1rem; padding-right: 1rem; }
    .ha-analysis-modal { padding: 1.25rem; }
    .ha-analysis-metrics { grid-template-columns: 1fr; }
    .ha-termo-card { grid-template-columns: 1fr; }
    .ha-termo-grid { grid-template-columns: repeat(2, 1fr); }
    .ha-features-grid { grid-template-columns: 1fr; }
    .ha-feat-card.blue { grid-template-columns: 1fr; }
    .ha-footer { align-items: flex-start; }
  }
`;

const NetworkSVG = () => (
  <svg viewBox="0 0 120 100" width="100%" height="100%">
    {[[60, 50], [20, 20], [100, 20], [15, 70], [105, 70], [50, 85], [75, 15]].map(([cx, cy], i) => (
      <circle key={i} cx={cx} cy={cy} r={i === 0 ? 5 : 3} fill="rgba(255,255,255,0.6)" />
    ))}
    {[[60, 50, 20, 20], [60, 50, 100, 20], [60, 50, 15, 70], [60, 50, 105, 70], [20, 20, 75, 15], [100, 20, 75, 15], [15, 70, 50, 85]].map(([x1, y1, x2, y2], i) => (
      <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
    ))}
  </svg>
);

type CareerCategory = {
  id: string;
  label: string;
  description: string;
  items: string[];
};

const CATEGORIES: CareerCategory[] = [
  {
    id: "popular",
    label: "Populares",
    description: "Buscas frequentes no mercado brasileiro",
    items: ["Desenvolvedor", "Designer", "Analista de Dados", "Marketing", "Vendas", "Contador", "Advogado", "RH"],
  },
  {
    id: "technology",
    label: "Tecnologia",
    description: "Desenvolvimento, infraestrutura, segurança e qualidade",
    items: ["Desenvolvedor Frontend", "Desenvolvedor Backend", "Desenvolvedor Full Stack", "DevOps", "Engenheiro de Software", "Mobile", "QA", "Segurança da Informação"],
  },
  {
    id: "data-ai",
    label: "Dados e IA",
    description: "Análise, engenharia, ciência de dados e inteligência artificial",
    items: ["Analista de Dados", "Engenheiro de Dados", "Cientista de Dados", "Analista de BI", "Engenheiro de Machine Learning", "Especialista em IA", "Analytics Engineer"],
  },
  {
    id: "design-product",
    label: "Design e Produto",
    description: "Experiência do usuário, produto digital e pesquisa",
    items: ["UX Designer", "UI Designer", "Product Designer", "UX Researcher", "Product Manager", "Product Owner", "Scrum Master"],
  },
  {
    id: "marketing",
    label: "Marketing",
    description: "Crescimento, conteúdo, mídia paga e performance",
    items: ["Analista de Marketing", "Social Media", "Growth Hacker", "Gestor de Tráfego", "SEO", "Copywriter", "CRM Marketing"],
  },
  {
    id: "commercial",
    label: "Comercial",
    description: "Vendas, relacionamento com clientes e contas estratégicas",
    items: ["Vendedor", "Representante Comercial", "Executivo de Contas", "Consultor Comercial", "Account Manager", "SDR", "Gerente Comercial"],
  },
  {
    id: "finance",
    label: "Financeiro",
    description: "Controladoria, crédito, auditoria e planejamento",
    items: ["Contador", "Analista Financeiro", "Controller", "Auditor", "Analista de Crédito", "Gerente Financeiro", "FP&A"],
  },
  {
    id: "legal",
    label: "Jurídico",
    description: "Advocacia, contratos, compliance e suporte jurídico",
    items: ["Advogado", "Analista Jurídico", "Assessor Jurídico", "Gerente Jurídico", "Paralegal", "Compliance Officer"],
  },
  {
    id: "people",
    label: "Pessoas e RH",
    description: "Recrutamento, cultura, desenvolvimento e administração de pessoas",
    items: ["Analista de RH", "Recrutador", "HRBP", "Gerente de RH", "Psicólogo Organizacional", "People Analytics"],
  },
  {
    id: "operations",
    label: "Operações e Logística",
    description: "Suprimentos, processos, distribuição e operação",
    items: ["Analista de Logística", "Gerente de Logística", "Coordenador de Suprimentos", "Analista de Operações", "Operador Logístico", "Supply Chain"],
  },
  {
    id: "health-engineering",
    label: "Saúde e Engenharia",
    description: "Áreas técnicas, clínicas e projetos especializados",
    items: ["Enfermeiro", "Médico", "Farmacêutico", "Nutricionista", "Fisioterapeuta", "Engenheiro Civil", "Engenheiro Mecânico", "Arquiteto"],
  },
];

const ESTIMATED_ANALYSIS_SECONDS = 45;
const RECENT_SEARCHES_STORAGE_BASE = "worky.recentCareerSearches";
const RECENT_SEARCHES_LIMIT = 5;

const ANALYSIS_STEPS = [
  { label: "Iniciando web scraping...", startsAt: 0 },
  { label: "Coletando vagas em fontes públicas...", startsAt: 8 },
  { label: "Conferindo salários e demanda...", startsAt: 18 },
  { label: "Analisando com inteligência artificial...", startsAt: 28 },
  { label: "Gerando relatório final de carreira...", startsAt: 38 },
];

function formatDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  if (!minutes) return `${seconds}s`;
  return `${minutes}min ${String(seconds).padStart(2, "0")}s`;
}

function getCategoryItems(category: CareerCategory, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  return category.items.filter((item) => !normalizedQuery || item.toLowerCase().includes(normalizedQuery));
}

function getRecentSearchesStorageKey(userId?: string | null) {
  return `${RECENT_SEARCHES_STORAGE_BASE}:${userId || "guest"}`;
}

function readRecentSearches(storageKey: string) {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey);
    const parsed = rawValue ? JSON.parse(rawValue) : [];
    return Array.isArray(parsed)
      ? parsed.filter((item: unknown): item is string => typeof item === "string" && item.trim().length > 0).slice(0, RECENT_SEARCHES_LIMIT)
      : [];
  } catch {
    return [];
  }
}

function writeRecentSearches(storageKey: string, searches: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(searches));
  } catch {
    // Cache is optional.
  }
}

function saveRecentSearch(storageKey: string, query: string) {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return readRecentSearches(storageKey);
  }

  const previous = readRecentSearches(storageKey);
  const next = [
    normalizedQuery,
    ...previous.filter((item) => item.toLowerCase() !== normalizedQuery.toLowerCase()),
  ].slice(0, RECENT_SEARCHES_LIMIT);

  writeRecentSearches(storageKey, next);
  return next;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchVal, setSearchVal] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeCareerCategory, setActiveCareerCategory] = useState<string | null>(null);
  const recentSearchStorageKey = useMemo(() => getRecentSearchesStorageKey(user?.id), [user?.id]);
  const [recentSearches, setRecentSearches] = useState<string[]>(() =>
    readRecentSearches(getRecentSearchesStorageKey(null)),
  );
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const analysisStartedAtRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const selectedCareerCategory = useMemo(
    () => CATEGORIES.find((category) => category.id === activeCareerCategory) || null,
    [activeCareerCategory],
  );
  const categoryItems = useMemo(
    () => (selectedCareerCategory ? getCategoryItems(selectedCareerCategory, searchVal) : []),
    [searchVal, selectedCareerCategory],
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setRecentSearches(readRecentSearches(recentSearchStorageKey));
  }, [recentSearchStorageKey]);

  useEffect(() => {
    if (!isAnalyzing) return;

    const updateProgress = () => {
      const nextElapsed = Math.floor((Date.now() - analysisStartedAtRef.current) / 1000);

      if (nextElapsed >= ESTIMATED_ANALYSIS_SECONDS) {
        cancelAnalysis("O tempo limite da análise foi atingido. Tente novamente.");
        return;
      }

      const currentStep = [...ANALYSIS_STEPS]
        .reverse()
        .find((step) => nextElapsed >= step.startsAt) || ANALYSIS_STEPS[0];

      setElapsedSeconds(nextElapsed);
      setLoadingStep(currentStep.label);
    };

    updateProgress();
    const timer = window.setInterval(updateProgress, 1000);
    return () => window.clearInterval(timer);
  }, [isAnalyzing]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const submitSearch = async (value = searchVal) => {
    const query = value.trim();
    if (!query || isAnalyzing || abortControllerRef.current) return;
    setRecentSearches(saveRecentSearch(recentSearchStorageKey, query));
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    analysisStartedAtRef.current = Date.now();
    setIsAnalyzing(true);
    setErrorMsg("");
    setElapsedSeconds(0);
    setLoadingStep(ANALYSIS_STEPS[0].label);
    setShowDropdown(false);
    
    try {
      const analysis = await jobService.getCarreira(query, {}, { signal: controller.signal });
      if (controller.signal.aborted) return;
      if (!analysis) {
        throw new Error("A API não retornou a análise de carreira.");
      }
      navigate(`/carreira?cargo=${encodeURIComponent(query)}`, { state: { analysis } });
    } catch (e: any) {
      if (controller.signal.aborted || e?.name === "AbortError") {
        if (!abortControllerRef.current || abortControllerRef.current === controller) {
          setErrorMsg("Análise cancelada.");
        }
        return;
      }
      console.error(e);
      setErrorMsg(e.message || "Erro ao coletar dados ou comunicar com a IA. Tente novamente.");
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        setIsAnalyzing(false);
        setLoadingStep("");
      }
    }
  };

  const cancelAnalysis = (msg = "Análise cancelada.") => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsAnalyzing(false);
    setLoadingStep("");
    setElapsedSeconds(0);
    setErrorMsg(msg);
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAnalyzing) {
      submitSearch();
    }
  };

  const selectCareer = (career: string) => {
    const value = career.trim();
    if (!value || isAnalyzing) return;

    setSearchVal(value);
    setShowDropdown(false);
    setActiveCareerCategory(null);
    submitSearch(value);
  };

  const scrollToFeatures = () => {
    document.getElementById("ha-features")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToCareerSearch = () => {
    const input = document.getElementById("career-search-input") as HTMLInputElement | null;
    input?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => input?.focus(), 250);
  };

  const currentStepIndex = ANALYSIS_STEPS.findIndex((step) => step.label === loadingStep);
  const activeStepIndex = currentStepIndex >= 0 ? currentStepIndex : 0;
  const progressPercent = Math.min(96, Math.max(8, (elapsedSeconds / ESTIMATED_ANALYSIS_SECONDS) * 100));
  const remainingSeconds = Math.max(0, ESTIMATED_ANALYSIS_SECONDS - elapsedSeconds);

  return (
    <>
      <style>{style}</style>
      <div className="ha-root">
        {isAnalyzing && (
          <div className="ha-analysis-overlay" role="presentation">
            <div
              className="ha-analysis-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="analysis-modal-title"
            >
              <div className="ha-analysis-top">
                <div className="ha-analysis-spinner" aria-hidden="true" />
                <div>
                  <div className="ha-analysis-eyebrow">Análise em andamento</div>
                  <div id="analysis-modal-title" className="ha-analysis-title">
                    Preparando o mapa de carreira
                  </div>
                </div>
              </div>

              <div className="ha-analysis-step">{loadingStep}</div>
              <div className="ha-analysis-progress" aria-hidden="true">
                <div className="ha-analysis-progress-bar" style={{ width: `${progressPercent}%` }} />
              </div>

              <div className="ha-analysis-metrics">
                <div className="ha-analysis-metric">
                  <div className="ha-analysis-label">Tempo corrido</div>
                  <div className="ha-analysis-value">{formatDuration(elapsedSeconds)}</div>
                </div>
                <div className="ha-analysis-metric">
                  <div className="ha-analysis-label">Tempo estimado</div>
                  <div className="ha-analysis-value">{formatDuration(remainingSeconds)}</div>
                </div>
              </div>

              <div className="ha-analysis-timeline" aria-label="Etapas da análise">
                {ANALYSIS_STEPS.map((step, index) => (
                  <div
                    key={step.label}
                    className={`ha-analysis-timeline-item${index <= activeStepIndex ? " active" : ""}`}
                  >
                    <span className="ha-analysis-timeline-dot" />
                    <span>{step.label}</span>
                  </div>
                ))}
              </div>

              <div className="ha-analysis-actions">
                <button type="button" className="btn-cancel-analysis" onClick={() => cancelAnalysis()}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
        <SiteHeader activeItem="explorar" onExploreClick={() => navigate("/")} onAboutClick={scrollToFeatures} />

        <section className="ha-hero">
          <div className="ha-badge">
            <span>✦</span> Nova Inteligência Disponível
          </div>
          <h1 className="ha-hero-title">
            A nova fronteira da inteligência<br />
            de <span className="accent">mercado de trabalho</span>.
          </h1>
          <p className="ha-hero-sub">
            Descubra competências em alta, salários reais e as melhores vagas com IA e web scraping.
            Analisamos milhões de dados para você não precisar fazer isso.
          </p>
          <div className="ha-search-container" ref={searchContainerRef}>
            <form className="ha-search-wrap" onSubmit={handleSearch} autoComplete="off">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                id="career-search-input"
                className="ha-search-input"
                placeholder={selectedCareerCategory ? `Filtrar em ${selectedCareerCategory.label}...` : "Clique para escolher uma área de carreira..."}
                value={searchVal}
                name="worky-career-search"
                onChange={(e) => { setSearchVal(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                disabled={isAnalyzing}
                autoComplete="new-password"
              />
              <button type="submit" className="btn-search" disabled={isAnalyzing}>
                {isAnalyzing ? "Analisando" : "Analisar"}
                {!isAnalyzing && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </form>
            {showDropdown && !isAnalyzing && (
              <div className="ha-category-dropdown">
                {!selectedCareerCategory && recentSearches.length > 0 && (
                  <div className="ha-recent-searches">
                    <div className="ha-recent-title">Últimas pesquisas</div>
                    <div className="ha-recent-list">
                      {recentSearches.map((item) => (
                        <button
                          key={item}
                          type="button"
                          className="ha-recent-item"
                          onPointerDown={(event) => {
                            event.preventDefault();
                            selectCareer(item);
                          }}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {!selectedCareerCategory ? (
                  CATEGORIES.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      className="ha-career-category-button"
                      onPointerDown={(event) => {
                        event.preventDefault();
                        setActiveCareerCategory(category.id);
                        setSearchVal("");
                      }}
                    >
                      <span>
                        <span className="ha-career-category-name">{category.label}</span>
                        <span className="ha-career-category-desc">{category.description}</span>
                      </span>
                      <span className="ha-career-count">{category.items.length}</span>
                    </button>
                  ))
                ) : (
                  <>
                    <button
                      type="button"
                      className="ha-career-back"
                      onPointerDown={(event) => {
                        event.preventDefault();
                        setActiveCareerCategory(null);
                        setSearchVal("");
                      }}
                    >
                      Voltar para áreas
                    </button>
                    {categoryItems.length === 0 ? (
                      <div className="ha-empty-state">Nenhum cargo disponível nessa área.</div>
                    ) : (
                      categoryItems.map((item) => (
                        <button
                          key={item}
                          type="button"
                          className="ha-career-item"
                          onPointerDown={(event) => {
                            event.preventDefault();
                            selectCareer(item);
                          }}
                        >
                          <span className="ha-career-item-type">Cargo</span>
                          {item}
                        </button>
                      ))
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          {errorMsg && (
            <div style={{ color: "#ef4444", fontSize: "0.85rem", marginTop: "-1rem", marginBottom: "1.5rem", fontWeight: 500 }}>
              {errorMsg}
            </div>
          )}
          <div className="ha-tags">
            {["#Tech", "#Finance", "#Design", "#DataScience"].map((tag) => (
              <button
                type="button"
                key={tag}
                className="ha-tag"
                disabled={isAnalyzing}
                onClick={() => {
                  if (isAnalyzing) return;
                  const value = tag.replace("#", "");
                  setSearchVal(value);
                  submitSearch(value);
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </section>

        <div id="ha-features" className="ha-section" style={{ paddingTop: 0 }}>
          <div className="ha-features-grid">
            <div className="ha-feat-card dark">
              <div className="ha-feat-icon" style={{ background: "#1e293b" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-4 0v2M12 12v3M8 12v3" />
                </svg>
              </div>
              <div className="ha-feat-title" style={{ color: "white" }}>Insights de Salário</div>
              <div className="ha-feat-text" style={{ color: "#94a3b8" }}>
                Mapeamos a remuneração real por região e nível de senioridade, utilizando dados agregados de milhares de fontes públicas.
              </div>
              <div className="ha-salary-chart">
                {Array.from({ length: 22 }).map((_, i) => (
                  <div key={i} className="ha-salary-bar" style={{ height: `${16 + Math.abs(Math.sin(i * 0.9)) * 22}px` }} />
                ))}
              </div>
            </div>

            <div className="ha-feat-card teal">
              <div className="ha-feat-icon" style={{ background: "rgba(255,255,255,0.15)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              </div>
              <div className="ha-feat-title">Mapeamento de Competências</div>
              <div className="ha-feat-text">
                Identifique as habilidades mais requisitadas para o cargo que você deseja ocupar.
              </div>
              <div className="ha-skill-tags">
                {["React", "AWS", "Python", "UI/UX"].map((skill) => (
                  <span key={skill} className="ha-skill-tag">{skill}</span>
                ))}
              </div>
            </div>

            <div className="ha-feat-card">
              <div className="ha-lightning-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#f59e0b">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <div className="ha-feat-title">Vagas em Tempo Real</div>
              <div className="ha-feat-text">
                Nossos bots varrem o mercado 24/7 para trazer oportunidades antes de todo mundo.
              </div>
            </div>

            <div className="ha-feat-card blue">
              <div className="ha-blue-left">
                <div className="ha-blue-label">IA</div>
                <div className="ha-blue-title">Análise IA de Perfil</div>
                <div className="ha-blue-text">
                  Suba seu currículo e receba um feedback imediato sobre como você se posiciona em relação ao mercado atual.
                </div>
                <button type="button" className="btn-white" onClick={() => navigate("/perfil")}>Testar Grátis</button>
              </div>
              <div className="ha-blue-visual">
                <NetworkSVG />
              </div>
            </div>
          </div>
        </div>

        <section className="ha-cta-section">
          <div className="ha-cta-bg" />
          <div style={{ position: "relative" }}>
            <div className="ha-cta-title">
              Prepare-se para o seu <em>próximo nível</em>.
            </div>
            <div className="ha-cta-sub">
              Não tome decisões de carreira baseadas em suposições. Utilize a inteligência de dados a seu favor.
            </div>
            <div className="ha-cta-btns">
              <button type="button" className="btn-cta-primary" onClick={scrollToCareerSearch}>Começar Agora</button>
            </div>
          </div>
        </section>

        <SiteFooter />
      </div>
    </>
  );
}
