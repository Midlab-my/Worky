import { useState, useRef, useEffect, useMemo, type FocusEvent, type FormEvent, type MouseEvent } from "react";
import { useNavigate } from "react-router";
import { Banknote, Building2, ChevronDown, CircleUser, ListChecks, Newspaper, Search } from "lucide-react";
import {
  CareerSearchBlockedError,
  jobService,
  type CareerSearchBlockReason,
  type SearchQuota,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import { AdSlot } from "../components/AdSlot";
import { BounceCards } from "../components/BounceCards";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import {
  buildCareerSearchKey,
  readLastCareerSearch,
  writeCachedAnalysis,
  writeLastCareerSearch,
} from "../lib/career-search-cache";
import { resolveCareerQuery, suggestCareers } from "../lib/career-suggestions";
import { logAppError } from "../lib/user-error";

type SearchGate = {
  reason: CareerSearchBlockReason;
  title: string;
  message: string;
  cargo: string;
};

function formatResetCountdown(resetsAt: string, nowMs = Date.now()): string {
  const end = Date.parse(resetsAt);
  if (!Number.isFinite(end)) return "-";
  const totalSec = Math.max(0, Math.floor((end - nowMs) / 1000));
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  if (days > 0) return `${days}d ${String(hours).padStart(2, "0")}h`;
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

const style = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800;900&family=Sora:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; background: #ffffff; }

  .ha-root {
    font-family: 'Inter', sans-serif; color: #0f172a; background: #ffffff;
    min-height: 100vh; display: flex; flex-direction: column;
    --ha-fs-2xs: 0.6875rem;
    --ha-fs-xs: 0.75rem;
    --ha-fs-sm: 0.8125rem;
    --ha-fs-md: 0.9375rem;
    --ha-fs-lg: 1rem;
    --ha-pad-xs: clamp(0.45rem, 0.8vw, 0.7rem);
    --ha-pad-sm: clamp(0.65rem, 1vw, 0.95rem);
  }

  .ha-top {
    background: #ffffff;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .ha-hero {
    position: relative;
    z-index: 20;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: clamp(4rem, 11vh, 7.5rem) 1.5rem 0.5rem;
    background: #ffffff;
  }
  .ha-hero-content {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: min(64rem, 100%);
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .ha-brand {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1.15rem;
    margin-bottom: 1.35rem;
  }
  .ha-brand-logo {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: clamp(5.25rem, 10vw, 7.5rem);
    font-weight: 900;
    color: #003ec7;
    letter-spacing: -0.05em;
    line-height: 1;
  }
  .ha-brand-tagline {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: var(--ha-fs-md);
    font-weight: 500;
    color: #6b7080;
    line-height: 1.45;
    max-width: 28rem;
  }
  .ha-search-container {
    position: relative;
    z-index: 30;
    width: min(100%, 64rem);
    margin: 0 auto 0.4rem;
  }
  .ha-search-field {
    position: relative;
    z-index: 2;
  }
  .ha-search-wrap {
    display: flex;
    background: white; border-radius: var(--radius);
    border: 1px solid #e2e8f0;
    box-shadow: 0 2px 16px rgba(0,0,0,0.07);
    overflow: hidden; padding: 6px 6px 6px 18px;
    align-items: center; gap: 8px;
  }
  .ha-category-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    right: 0;
    background: white; border: 1px solid #e2e8f0;
    border-radius: var(--radius); box-shadow: 0 16px 40px rgba(15, 23, 42, 0.18);
    max-height: min(28rem, calc(100dvh - 12rem)); overflow-y: auto; overflow-x: hidden;
    overscroll-behavior: contain; -webkit-overflow-scrolling: touch;
    z-index: 40;
    text-align: left;
  }
  .ha-accordion {
    border-bottom: 1px solid #eef2f7;
    background: #fff;
  }
  .ha-accordion-summary {
    display: flex; align-items: center; gap: 8px;
    width: 100%; padding: var(--ha-pad-xs) var(--ha-pad-sm); cursor: pointer;
    border: 0; background: transparent; color: inherit;
    font-family: 'Inter', sans-serif;
  }
  .ha-accordion-summary:hover { background: #f8fafc; }
  .ha-accordion-label {
    font-size: var(--ha-fs-2xs); font-weight: 800; color: #64748b;
    text-transform: uppercase; letter-spacing: 0.07em; flex-shrink: 0;
  }
  .ha-accordion-value {
    flex: 1; min-width: 0; font-size: var(--ha-fs-sm); font-weight: 600; color: #334155;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: left;
  }
  .ha-accordion-chevron {
    color: #94a3b8; flex-shrink: 0; transition: transform 0.22s ease;
  }
  .ha-accordion.is-open .ha-accordion-chevron { transform: rotate(180deg); }
  .ha-accordion-panel {
    display: grid;
    grid-template-rows: 0fr;
    pointer-events: none;
    transition: grid-template-rows 0.22s ease;
  }
  .ha-accordion.is-open .ha-accordion-panel {
    grid-template-rows: 1fr;
    pointer-events: auto;
  }
  .ha-accordion-panel-inner { overflow: hidden; min-height: 0; }
  .ha-accordion-body {
    padding: 0 var(--ha-pad-sm) var(--ha-pad-xs);
    opacity: 0;
    transform: translateY(-4px);
    transition: opacity 0.18s ease, transform 0.22s ease;
  }
  .ha-accordion.is-open .ha-accordion-body {
    opacity: 1;
    transform: translateY(0);
  }
  @media (prefers-reduced-motion: reduce) {
    .ha-accordion-panel, .ha-accordion-body, .ha-accordion-chevron { transition: none; }
  }
  .ha-search-filters {
    display: flex; flex-direction: row; flex-wrap: wrap; gap: 6px;
  }
  .ha-search-filter-group { flex: 1; min-width: 110px; display: flex; flex-direction: column; gap: 4px; }
  .ha-search-filter-group label { font-size: var(--ha-fs-2xs); font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
  .ha-search-filter-select {
    width: 100%; padding: 0.45rem 0.7rem; padding-right: 28px; border-radius: var(--radius); border: 1px solid #e2e8f0;
    font-size: var(--ha-fs-sm); color: #0f172a; font-family: 'Inter', sans-serif; background-color: #fff; outline: none; cursor: pointer;
    appearance: none; background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 8px center; background-size: 12px;
    transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
    text-overflow: ellipsis; white-space: nowrap; overflow: hidden;
  }
  .ha-search-filter-select:hover { background-color: #f1f5f9; border-color: #cbd5e1; }
  .ha-search-filter-select:focus { background-color: #ffffff; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.15); }
  .ha-search-filter-select:disabled { opacity: 0.5; cursor: not-allowed; }
  .ha-recent-searches {
    padding: var(--ha-pad-xs) var(--ha-pad-sm);
    border-bottom: 1px solid #eef2f7;
    background: #fff;
  }
  .ha-recent-title {
    font-size: var(--ha-fs-2xs); font-weight: 800; color: #94a3b8;
    text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px;
  }
  .ha-recent-list { display: flex; flex-wrap: wrap; gap: 5px; }
  .ha-recent-item {
    border: 1px solid #dbe5f4; background: white; color: #2563eb;
    border-radius: var(--radius); padding: 0.35rem 0.7rem; font-size: var(--ha-fs-sm);
    font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif;
  }
  .ha-recent-item:hover { border-color: #2563eb; background: #eff6ff; }
  .ha-search-quota {
    position: relative;
    z-index: 1;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 0.35rem 0.85rem;
    margin: 0.65rem auto 0;
    width: min(100%, 64rem);
    font-size: var(--ha-fs-sm);
    color: #64748b;
    font-weight: 600;
  }
  .ha-search-quota-count {
    color: #334155;
    font-variant-numeric: tabular-nums;
  }
  .ha-search-quota-count.low { color: #b45309; }
  .ha-search-quota-count.empty { color: #b91c1c; }
  .ha-search-quota-timer {
    font-variant-numeric: tabular-nums;
    color: #94a3b8;
  }
  .ha-home-recents {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.45rem;
    margin: 0.95rem 0 0.45rem;
    width: 100%;
    max-width: 64rem;
  }
  .ha-home-recents-label {
    font-size: var(--ha-fs-2xs);
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .ha-home-recents-list {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
  }
  .ha-home-recent-chip {
    border: 1px solid #dbe5f4;
    background: white;
    color: #2563eb;
    border-radius: var(--radius);
    padding: 0.45rem 0.95rem;
    font-size: var(--ha-fs-sm);
    font-weight: 600;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    transition: border-color 0.15s, background 0.15s;
  }
  .ha-home-recent-chip:hover {
    border-color: #2563eb;
    background: #eff6ff;
  }
  .ha-home-recent-chip:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
  .ha-source-tags { display: flex; flex-wrap: wrap; gap: 5px; }
  .ha-source-tag {
    border: 1px solid #dbe5f4; background: white; color: #475569;
    border-radius: var(--radius); padding: 0.35rem 0.7rem; font-size: var(--ha-fs-sm);
    font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif;
  }
  .ha-source-tag.active {
    border-color: #2563eb; background: #eff6ff; color: #1d4ed8;
  }
  .ha-source-tag:disabled { opacity: 0.55; cursor: not-allowed; }
  .ha-source-hint {
    margin: 6px 0 0; font-size: var(--ha-fs-2xs); color: #94a3b8; line-height: 1.4;
  }
  .ha-popular-block {
    padding: var(--ha-pad-xs) var(--ha-pad-sm) var(--ha-pad-sm);
  }
  .ha-recent-item.preferred {
    border-color: #2563eb; background: #eff6ff;
  }
  .ha-suggest-empty {
    margin: 0; font-size: var(--ha-fs-sm); color: #94a3b8; line-height: 1.4;
  }
  .ha-search-wrap svg { color: #94a3b8; flex-shrink: 0; }
  .ha-search-input {
    flex: 1 1 auto; min-width: 0; border: none; outline: none;
    font-size: clamp(0.72rem, 2.4vw, 0.9375rem); color: #0f172a; background: none;
    font-family: 'Inter', sans-serif;
    padding: 0.5rem 0.4rem; overflow-x: hidden;
    text-overflow: ellipsis;
  }
  .ha-search-input::placeholder { color: #94a3b8; font-size: inherit; }
  .btn-search {
    background: #2563eb; color: white; border: none;
    padding: 0.6rem 1.2rem; border-radius: var(--radius);
    font-size: var(--ha-fs-sm); font-weight: 500; cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .btn-search:hover { background: #1d4ed8; }
  .btn-search:disabled { opacity: 0.4; cursor: not-allowed; }

  .ha-analysis-overlay {
    position: fixed; inset: 0; z-index: 10050;
    display: flex; align-items: center; justify-content: center;
    padding: 1rem;
    background: rgba(15, 23, 42, 0.38);
    overscroll-behavior: none;
    touch-action: none;
  }
  .ha-analysis-modal {
    width: min(100%, 400px);
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: var(--radius);
    box-shadow: 0 12px 40px rgba(15, 23, 42, 0.16);
    padding: 1.35rem 1.35rem 1.15rem;
    text-align: left;
  }
  .ha-gate-modal {
    width: min(100%, 420px);
    background: white;
    border: 1px solid #dbe3ef;
    border-radius: var(--radius);
    box-shadow: 0 24px 70px rgba(15, 23, 42, 0.24);
    padding: 1.5rem 1.5rem 1.25rem;
    text-align: left;
  }
  .ha-gate-kicker {
    color: #2563eb;
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 0.4rem;
  }
  .ha-gate-title {
    font-family: 'Sora', sans-serif;
    font-size: 1.15rem;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 0.55rem;
    line-height: 1.3;
  }
  .ha-gate-text {
    font-size: 0.9rem;
    color: #475569;
    line-height: 1.55;
    margin-bottom: 1.15rem;
  }
  .ha-gate-hint {
    font-size: 0.8rem;
    color: #64748b;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: var(--radius);
    padding: 0.7rem 0.85rem;
    margin-bottom: 1.15rem;
    line-height: 1.45;
  }
  .ha-gate-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem;
    justify-content: flex-end;
  }
  .ha-gate-btn {
    border: 0;
    border-radius: var(--radius);
    padding: 0.55rem 0.95rem;
    font-size: 0.84rem;
    font-weight: 700;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
  }
  .ha-gate-btn.primary { background: #2563eb; color: #fff; }
  .ha-gate-btn.primary:hover { background: #1d4ed8; }
  .ha-gate-btn.secondary { background: #eff6ff; color: #1d4ed8; }
  .ha-gate-btn.ghost { background: transparent; color: #64748b; border: 1px solid #e2e8f0; }
  .ha-analysis-top {
    margin-bottom: 1.1rem;
  }
  .ha-analysis-eyebrow {
    color: #64748b;
    font-size: 0.75rem;
    font-weight: 500;
    margin-bottom: 0.2rem;
  }
  .ha-analysis-title {
    font-family: 'Sora', sans-serif;
    color: #0f172a;
    font-size: 1.2rem;
    font-weight: 800;
    line-height: 1.25;
  }
  .ha-analysis-chips {
    display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap;
  }
  .ha-analysis-chip {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 0.72rem; background: #f8fafc; color: #475569;
    padding: 3px 8px; border-radius: var(--radius);
    font-weight: 600; border: 1px solid #e2e8f0;
  }
  .ha-analysis-progress {
    height: 4px;
    border-radius: 2px;
    overflow: hidden;
    background: #e2e8f0;
    margin-bottom: 0.7rem;
  }
  .ha-analysis-progress-bar {
    height: 100%;
    background: #003ec7;
    transition: width 0.35s ease;
  }
  .ha-analysis-metrics {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 1.15rem;
  }
  .ha-analysis-metric {
    min-width: 0;
  }
  .ha-analysis-label {
    color: #94a3b8;
    font-size: 0.72rem;
    font-weight: 500;
    margin-bottom: 0.15rem;
  }
  .ha-analysis-value {
    color: #0f172a;
    font-family: 'Sora', sans-serif;
    font-size: 1.05rem;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
  }
  .ha-analysis-actions {
    display: flex;
    justify-content: flex-start;
  }
  .btn-cancel-analysis {
    background: white;
    color: #334155;
    border: 1px solid #cbd5e1;
    border-radius: var(--radius);
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

  .ha-section { max-width: min(86rem, calc(100% - 3rem)); margin: 0 auto; padding: 0 1.5rem 2rem; }
  #ha-features {
    position: relative;
    z-index: 0;
    background: transparent;
    max-width: none;
    width: 100%;
    margin: 0 auto;
    padding: 1.25rem 1.5rem 2rem;
    overflow: visible;
    box-sizing: border-box;
  }
  .ha-termo-card {
    background: white; border-radius: var(--radius);
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

  .ha-features-fan {
    display: flex;
    justify-content: center;
    width: min(100%, 64rem);
    max-width: 64rem;
    margin: 0 auto;
    overflow: visible;
  }
  .ha-features-grid {
    display: none;
    width: min(100%, 64rem);
    max-width: 64rem;
    margin: 0 auto;
    gap: 0.75rem;
  }
  .ha-feat-card {
    display: flex; flex-direction: row; align-items: center; gap: 0.75rem;
    width: 100%; height: 100%; min-width: 0; margin: 0;
    padding: 0.75rem 1rem;
    border-radius: var(--radius);
    border: 1px solid #e2e8f0; background: white;
    text-align: left; font-family: 'Inter', sans-serif;
    color: inherit; overflow: hidden; box-sizing: border-box;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.12);
  }
  button.ha-feat-card {
    cursor: pointer; appearance: none;
    line-height: 1.2;
    transition: border-color 0.15s, background 0.15s;
  }
  .ha-feat-icon {
    width: 1.25rem; height: 1.25rem;
    display: grid; place-items: center;
    flex-shrink: 0; line-height: 0;
    background: none;
  }
  .ha-feat-icon svg {
    display: block; width: 1.25rem; height: 1.25rem; margin: 0;
  }
  .ha-feat-copy {
    min-width: 0; display: flex; flex-direction: column; gap: 0.15rem;
  }
  .ha-feat-title {
    font-family: 'Sora', sans-serif; font-weight: 700;
    font-size: 0.9rem;
    line-height: 1.25; display: block;
  }
  .ha-feat-text {
    font-size: 0.8rem;
    line-height: 1.4; display: block;
  }

  .ha-feat-card.salary {
    background: #0f172a; border-color: #1e293b;
  }
  .ha-feat-card.salary .ha-feat-icon { color: #14b8a6; }
  .ha-feat-card.salary .ha-feat-title { color: #fff; }
  .ha-feat-card.salary .ha-feat-text { color: #94a3b8; }

  .ha-feat-card.skills {
    background: #0d9488; border-color: #0d9488;
  }
  .ha-feat-card.skills .ha-feat-icon { color: #fff; }
  .ha-feat-card.skills .ha-feat-title { color: #fff; }
  .ha-feat-card.skills .ha-feat-text { color: rgba(255,255,255,0.82); }

  .ha-feat-card.jobs {
    background: #FEF3C6; border-color: #FDE68A;
  }
  .ha-feat-card.jobs .ha-feat-icon { color: #0f172a; }
  .ha-feat-card.jobs .ha-feat-title { color: #0f172a; }
  .ha-feat-card.jobs .ha-feat-text { color: #78716c; }

  .ha-feat-card.profile {
    background: #2563eb; border-color: #2563eb;
  }
  .ha-feat-card.profile .ha-feat-icon { color: #fff; }
  .ha-feat-card.profile .ha-feat-title { color: #fff; }
  .ha-feat-card.profile .ha-feat-text { color: rgba(255,255,255,0.8); }
  button.ha-feat-card.profile:hover { background: #1d4ed8; border-color: #1d4ed8; }

  .ha-feat-card.companies {
    background: #f1f5f9; border-color: #e2e8f0;
  }
  .ha-feat-card.companies .ha-feat-icon { color: #334155; }
  .ha-feat-card.companies .ha-feat-title { color: #0f172a; }
  .ha-feat-card.companies .ha-feat-text { color: #64748b; }
  button.ha-feat-card.companies:hover { background: #e8eef5; border-color: #cbd5e1; }

  .ha-cta-section {
    background: #ffffff; padding: 5rem 1.5rem;
    text-align: center; position: relative; overflow: hidden;
  }
  .ha-cta-bg {
    display: none;
  }
  .ha-cta-title {
    font-family: 'Sora', sans-serif;
    font-size: clamp(1.45rem, 2.6vw, 2rem);
    font-weight: 800; color: #0f172a; line-height: 1.2;
    margin-bottom: 0.75rem;
  }
  .ha-cta-title em { font-style: italic; color: #2563eb; }
  .ha-cta-sub { font-size: var(--ha-fs-md); color: #64748b; margin-bottom: 2.5rem; max-width: 28rem; margin-left: auto; margin-right: auto; }
  .ha-cta-btns { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
  .btn-cta-primary {
    background: #2563eb; color: white; border: none;
    padding: 0.75rem 1.75rem; border-radius: var(--radius);
    font-size: var(--ha-fs-md); font-weight: 600; cursor: pointer;
  }
  .btn-cta-primary:hover { background: #1d4ed8; }
  .btn-cta-ghost {
    background: white; color: #374151;
    border: 1px solid #e2e8f0;
    padding: 0.75rem 1.75rem; border-radius: var(--radius);
    font-size: var(--ha-fs-md); font-weight: 500; cursor: pointer;
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

  @media (max-width: 1024px) {
    .ha-features-fan { display: none; }
    .ha-features-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
    .ha-feat-card {
      flex-direction: column;
      align-items: flex-start;
      justify-content: flex-start;
      gap: 0.45rem;
      min-height: 0;
      height: auto;
    }
    .ha-feat-copy { width: 100%; }
    .ha-feat-card:last-child { grid-column: 1 / -1; }
  }

  @media (max-width: 720px) {
    .ha-nav { height: auto; min-height: 56px; padding: 0.75rem 1rem; }
    .ha-nav-links { gap: 1.25rem; }
    .ha-hero { padding: 3.5rem 1rem 0.4rem; }
    .ha-features-grid { gap: 0.5rem; }
    #ha-features { padding: 0.7rem 1rem 2rem; }
  }

  @media (max-width: 600px) {
    .ha-nav { flex-wrap: wrap; gap: 0.5rem; }
    .ha-nav-links { order: 3; width: 100%; justify-content: center; gap: 1rem; border-top: 1px solid #f1f5f9; padding-top: 0.5rem; }
    .ha-nav-actions { margin-left: auto; }

    .ha-hero { padding: 2.75rem 1rem 0.35rem; }
    #ha-features { padding: 0.55rem 1rem 2rem; }
    .ha-search-wrap { border-radius: var(--radius); padding: 4px 4px 4px 10px; gap: 6px; }
    .ha-search-input { font-size: clamp(0.68rem, 3.2vw, 0.82rem); padding: 0.45rem 0.2rem; }
    .btn-search { padding: 0.5rem 0.65rem; font-size: 0.75rem; }

    .ha-search-filters { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .ha-search-filter-group { flex: none; width: 100%; display: flex; flex-direction: column; gap: 3px; }
    .ha-search-filter-group:nth-child(3) { grid-column: span 2; }
    .ha-search-filter-select {
      padding: 7px 10px; padding-right: 28px; border-radius: var(--radius);
      background-position: right 8px center; background-size: 12px;
    }
    .ha-category-dropdown {
      max-height: min(58dvh, calc(100dvh - 140px));
      border-radius: var(--radius);
      box-shadow: 0 12px 40px rgba(0,0,0,0.15);
    }
    .ha-accordion-summary { padding: 8px 12px; }
    .ha-accordion-body { padding: 0 12px 10px; }
    .ha-recent-searches, .ha-popular-block { padding-left: 12px; padding-right: 12px; }

    .ha-analysis-modal { padding: 1.1rem; }
    .ha-analysis-title { font-size: 1.05rem; }
    .ha-analysis-overlay { padding: 0.75rem; align-items: center; }
    .ha-gate-modal { width: 100%; padding: 1.2rem 1.1rem 1.05rem; }
    .ha-gate-actions { flex-direction: column-reverse; }
    .ha-gate-btn { width: 100%; }

    .ha-section { padding-left: 0.875rem; padding-right: 0.875rem; padding-bottom: 2rem; }
    .ha-termo-card { grid-template-columns: 1fr; }
    .ha-termo-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
    .ha-features-grid { gap: 0.5rem; }
    .ha-feat-card { padding: 0.7rem 0.85rem; }

    .ha-cta-section { padding: 3rem 1rem; }
    .ha-cta-btns { flex-direction: column; align-items: center; }
    .btn-cta-primary, .btn-cta-ghost { width: 100%; max-width: 280px; }

    .ha-footer { padding: 1.25rem 1rem; flex-direction: column; gap: 1rem; }
    .ha-footer-links { gap: 1rem; flex-wrap: wrap; }
  }

  @media (max-width: 380px) {
    .ha-brand-tagline { font-size: 0.875rem; }
    .ha-nav-links { gap: 0.75rem; font-size: 0.8rem; }
    .ha-search-wrap { padding: 3px 3px 3px 8px; }
    .ha-search-input { font-size: 0.68rem; }
    .btn-search { padding: 0.42rem 0.55rem; font-size: 0.7rem; }
  }
`;

const LOCATION_DATA: Record<string, string[]> = {
  "Brasil": [
    "Acre", "Alagoas", "Amapá", "Amazonas", "Bahia", "Ceará", "Distrito Federal",
    "Espírito Santo", "Goiás", "Maranhão", "Mato Grosso", "Mato Grosso do Sul",
    "Minas Gerais", "Pará", "Paraíba", "Paraná", "Pernambuco", "Piauí",
    "Rio de Janeiro", "Rio Grande do Norte", "Rio Grande do Sul", "Rondônia",
    "Roraima", "Santa Catarina", "São Paulo", "Sergipe", "Tocantins",
  ],
  "Estados Unidos": [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
    "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
    "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine",
    "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri",
    "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
    "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
    "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee",
    "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
    "Wisconsin", "Wyoming",
  ],
  "Portugal": [
    "Aveiro", "Beja", "Braga", "Bragança", "Castelo Branco", "Coimbra",
    "Évora", "Faro", "Guarda", "Leiria", "Lisboa", "Portalegre", "Porto",
    "Santarém", "Setúbal", "Viana do Castelo", "Vila Real", "Viseu",
  ],
  "Espanha": [
    "Andaluzia", "Aragão", "Astúrias", "Cantábria", "Castela e Leão",
    "Castela-La Mancha", "Catalunha", "Extremadura", "Galiza", "Ilhas Baleares",
    "Ilhas Canárias", "La Rioja", "Madrid", "Múrcia", "Navarra", "País Basco", "Valência",
  ],
  "Itália": [
    "Abruzzo", "Basilicata", "Calábria", "Campânia", "Emília-Romanha",
    "Friul-Veneza Júlia", "Lácio", "Ligúria", "Lombardia", "Marcas",
    "Molise", "Piemonte", "Apúlia", "Sardenha", "Sicília", "Toscana",
    "Trentino-Alto Ádige", "Úmbria", "Vale de Aosta", "Vêneto",
  ],
  "Alemanha": [
    "Baden-Württemberg", "Baviera", "Berlim", "Brandeburgo", "Bremen",
    "Hamburgo", "Hesse", "Mecklemburgo-Pomerânia", "Baixa Saxônia",
    "Renânia do Norte-Vestfália", "Renânia-Palatinado", "Sarre",
    "Saxônia", "Saxônia-Anhalt", "Schleswig-Holstein", "Turíngia",
  ],
  "Reino Unido": [
    "Birmingham", "Bristol", "Edinburgh", "Glasgow", "Leeds", "Liverpool",
    "Londres", "Manchester", "Newcastle", "Nottingham", "Sheffield", "Wales",
  ],
  "Canadá": [
    "Alberta", "British Columbia", "Manitoba", "New Brunswick",
    "Newfoundland", "Nova Scotia", "Ontario", "Quebec", "Saskatchewan",
  ],
};

const COUNTRIES = Object.keys(LOCATION_DATA);

const POPULAR_SEARCHES = ["Desenvolvedor", "Designer", "Analista de Dados", "Marketing", "Vendas"];

const ESTIMATED_ANALYSIS_SECONDS = 60;
const RECENT_SEARCHES_STORAGE_BASE = "worky.recentCareerSearches.v2";
const RECENT_SEARCHES_LEGACY_BASE = "worky.recentCareerSearches";
const RECENT_SEARCHES_LIMIT = 6;

type RecentCareerSearch = {
  cargo: string;
  searchKey: string;
};

type SearchFonte = "google" | "scrape" | "all";

function fonteSearchLabel(fonte: SearchFonte): string {
  if (fonte === "scrape") return "Busca Worky";
  if (fonte === "all") return "Worky e Google Jobs";
  return "Google Jobs";
}

function fonteSearchEyebrow(fonte: SearchFonte): string {
  if (fonte === "scrape") return "Buscando na Worky";
  if (fonte === "all") return "Buscando na Worky e no Google";
  return "Buscando no Google Jobs";
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function formatDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  if (!minutes) return `${seconds}s`;
  return `${minutes}min ${String(seconds).padStart(2, "0")}s`;
}

function getRecentSearchesStorageKey(userId?: string | null) {
  return `${RECENT_SEARCHES_STORAGE_BASE}:${userId || "guest"}`;
}

function getLegacyRecentSearchesStorageKey(userId?: string | null) {
  return `${RECENT_SEARCHES_LEGACY_BASE}:${userId || "guest"}`;
}

function normalizeRecentSearch(item: unknown): RecentCareerSearch | null {
  if (typeof item === "string" && item.trim()) {
    const cargo = item.trim();
    return { cargo, searchKey: `cargo=${encodeURIComponent(cargo)}&fonte=google` };
  }
  if (!item || typeof item !== "object") return null;
  const cargo = typeof (item as RecentCareerSearch).cargo === "string"
    ? (item as RecentCareerSearch).cargo.trim()
    : "";
  if (!cargo) return null;
  const searchKey = typeof (item as RecentCareerSearch).searchKey === "string"
    ? (item as RecentCareerSearch).searchKey.trim()
    : "";
  return {
    cargo,
    searchKey: searchKey || `cargo=${encodeURIComponent(cargo)}&fonte=google`,
  };
}

function parseRecentSearchesRaw(rawValue: string | null): RecentCareerSearch[] {
  if (!rawValue) return [];
  try {
    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    const result: RecentCareerSearch[] = [];
    for (const item of parsed) {
      const normalized = normalizeRecentSearch(item);
      if (!normalized) continue;
      const key = normalized.cargo.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(normalized);
      if (result.length >= RECENT_SEARCHES_LIMIT) break;
    }
    return result;
  } catch {
    return [];
  }
}

function readRecentSearches(storageKey: string, legacyKey?: string): RecentCareerSearch[] {
  if (typeof window === "undefined") {
    return [];
  }

  const current = parseRecentSearchesRaw(window.localStorage.getItem(storageKey));
  if (current.length > 0) return current;
  if (!legacyKey) return [];
  return parseRecentSearchesRaw(window.localStorage.getItem(legacyKey));
}

function writeRecentSearches(storageKey: string, searches: RecentCareerSearch[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(searches.slice(0, RECENT_SEARCHES_LIMIT)));
  } catch {
    // ignore
  }
}

function saveRecentSearch(storageKey: string, entry: RecentCareerSearch) {
  const cargo = entry.cargo.trim();
  if (!cargo) {
    return readRecentSearches(storageKey);
  }

  const nextEntry: RecentCareerSearch = {
    cargo,
    searchKey: entry.searchKey.trim() || `cargo=${encodeURIComponent(cargo)}&fonte=google`,
  };
  const previous = readRecentSearches(storageKey);
  const next = [
    nextEntry,
    ...previous.filter((item) => item.cargo.toLowerCase() !== cargo.toLowerCase()),
  ].slice(0, RECENT_SEARCHES_LIMIT);

  writeRecentSearches(storageKey, next);
  return next;
}

type FeatureItem = {
  key: string;
  title: string;
  text: string;
  icon: typeof Banknote;
  to?: string;
};

const FEATURE_ITEMS: FeatureItem[] = [
  { key: "salary", title: "Salários", text: "Faixas por região e senioridade", icon: Banknote },
  { key: "skills", title: "Competências", text: "Habilidades mais citadas nas vagas", icon: ListChecks },
  { key: "jobs", title: "Vagas", text: "Fontes públicas atualizadas no dia", icon: Newspaper },
  { key: "profile", title: "Perfil", text: "Compare seu currículo com a área", icon: CircleUser, to: "/perfil" },
  { key: "companies", title: "Empresas", text: "Quem está contratando agora", icon: Building2, to: "/empresas" },
];

function FeatureCard({ item, onNavigate }: { item: FeatureItem; onNavigate: (to: string) => void }) {
  const Icon = item.icon;
  const inner = (
    <>
      <span className="ha-feat-icon">
        <Icon size={20} strokeWidth={2.2} aria-hidden="true" />
      </span>
      <span className="ha-feat-copy">
        <span className="ha-feat-title">{item.title}</span>
        <span className="ha-feat-text">{item.text}</span>
      </span>
    </>
  );
  if (item.to) {
    const path = item.to;
    return (
      <button type="button" className={`ha-feat-card ${item.key}`} onClick={() => onNavigate(path)}>
        {inner}
      </button>
    );
  }
  return <div className={`ha-feat-card ${item.key}`}>{inner}</div>;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const lastSearch = useMemo(() => readLastCareerSearch(), []);
  const [searchVal, setSearchVal] = useState(() => lastSearch?.cargo || "");
  const [localCountry, setLocalCountry] = useState(() => lastSearch?.pais || "");
  const [localRegion, setLocalRegion] = useState(() => {
    if (!lastSearch?.local) return "";
    // Se local == pais, era só país (sem região).
    if (lastSearch.pais && lastSearch.local === lastSearch.pais) return "";
    return lastSearch.local;
  });
  const localVal = localRegion || localCountry;
  const [modeloVal, setModeloVal] = useState(() => lastSearch?.modelo || "");
  const [searchFonte, setSearchFonte] = useState<SearchFonte>(
    () => lastSearch?.fonte || "scrape",
  );
  const [analysisPreview, setAnalysisPreview] = useState({
    cargo: lastSearch?.cargo || "",
    pais: lastSearch?.pais || "",
    local: lastSearch?.pais && lastSearch.local === lastSearch.pais ? "" : lastSearch?.local || "",
    modelo: lastSearch?.modelo || "",
    fonte: (lastSearch?.fonte || "scrape") as SearchFonte,
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchGate, setSearchGate] = useState<SearchGate | null>(null);
  const [searchQuota, setSearchQuota] = useState<SearchQuota | null>(null);
  const [quotaNowMs, setQuotaNowMs] = useState(() => Date.now());
  const [showDropdown, setShowDropdown] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [fonteOpen, setFonteOpen] = useState(false);
  const recentSearchStorageKey = useMemo(() => getRecentSearchesStorageKey(user?.id), [user?.id]);
  const recentSearchLegacyKey = useMemo(() => getLegacyRecentSearchesStorageKey(user?.id), [user?.id]);
  const [recentSearches, setRecentSearches] = useState<RecentCareerSearch[]>(() =>
    readRecentSearches(getRecentSearchesStorageKey(null), getLegacyRecentSearchesStorageKey(null)),
  );
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const analysisStartedAtRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const finishingRef = useRef(false);

  const refreshSearchQuota = async (signal?: AbortSignal) => {
    const quota = await jobService.getSearchQuota({ signal });
    if (signal?.aborted) return;
    if (quota) setSearchQuota(quota);
  };

  const filterSummary = [localCountry || "Qualquer país", localRegion || null, modeloVal || "Qualquer modelo"]
    .filter(Boolean)
    .join(" · ");
  const fonteSummary = fonteSearchLabel(searchFonte);
  const typedCareerQuery = searchVal.trim();
  const careerSuggestions = suggestCareers(typedCareerQuery);

  useEffect(() => {
    const handleClickOutside = (e: globalThis.MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (showDropdown) return;
    setFiltersOpen(false);
    setFonteOpen(false);
  }, [showDropdown]);

  useEffect(() => {
    setRecentSearches(readRecentSearches(recentSearchStorageKey, recentSearchLegacyKey));
  }, [recentSearchLegacyKey, recentSearchStorageKey]);

  useEffect(() => {
    const controller = new AbortController();
    void refreshSearchQuota(controller.signal);
    return () => controller.abort();
  }, [user?.id]);

  useEffect(() => {
    if (!searchQuota?.resetsAt) return;
    const tick = window.setInterval(() => setQuotaNowMs(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, [searchQuota?.resetsAt]);

  useEffect(() => {
    if (!isAnalyzing) return;

    const updateProgress = () => {
      if (finishingRef.current) return;
      setElapsedSeconds(Math.floor((Date.now() - analysisStartedAtRef.current) / 1000));
    };

    updateProgress();
    const timer = window.setInterval(updateProgress, 400);
    return () => window.clearInterval(timer);
  }, [isAnalyzing]);

  useEffect(() => {
    const locked = isAnalyzing || Boolean(searchGate);
    if (!locked) return;

    const html = document.documentElement;
    const body = document.body;
    const previous = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPadding: body.style.paddingRight,
    };
    const scrollbar = window.innerWidth - html.clientWidth;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    const blockScroll = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest(".ha-analysis-modal, .ha-gate-modal")) return;
      event.preventDefault();
    };
    document.addEventListener("wheel", blockScroll, { passive: false });
    document.addEventListener("touchmove", blockScroll, { passive: false });

    return () => {
      html.style.overflow = previous.htmlOverflow;
      body.style.overflow = previous.bodyOverflow;
      body.style.paddingRight = previous.bodyPadding;
      document.removeEventListener("wheel", blockScroll);
      document.removeEventListener("touchmove", blockScroll);
    };
  }, [isAnalyzing, searchGate]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const submitSearch = async (value = searchVal) => {
    const resolved = resolveCareerQuery(value);
    const query = resolved.cargo;
    if (isAnalyzing || abortControllerRef.current) return;
    if (!query) {
      setErrorMsg("Informe um cargo ou área para analisar.");
      return;
    }
    if (resolved.didCorrect) setSearchVal(query);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    analysisStartedAtRef.current = Date.now();
    finishingRef.current = false;
    setIsAnalyzing(true);
    setErrorMsg("");
    setSearchGate(null);
    setElapsedSeconds(0);
    setIsFinishing(false);
    setAnalysisPreview({
      cargo: query,
      pais: localCountry,
      local: localRegion,
      modelo: modeloVal,
      fonte: searchFonte,
    });
    setShowDropdown(false);
    setFiltersOpen(false);
    setFonteOpen(false);
    
    try {
      const filters: { local?: string; modelo?: string; fonte?: SearchFonte } = {
        fonte: searchFonte,
      };
      if (localVal) filters.local = localVal;
      if (modeloVal) filters.modelo = modeloVal;

      const analysis = await jobService.getCarreira(query, filters, { signal: controller.signal });
      if (controller.signal.aborted) return;
      if (!analysis) {
        throw new Error("A API não retornou a análise de carreira.");
      }

      const queryParams = new URLSearchParams();
      queryParams.append("cargo", query);
      if (localCountry) queryParams.append("pais", localCountry);
      if (localRegion) queryParams.append("local", localRegion);
      else if (localCountry && !localRegion) queryParams.append("local", localCountry);
      if (modeloVal) queryParams.append("modelo", modeloVal);
      queryParams.append("fonte", searchFonte);

      const searchKey = buildCareerSearchKey(queryParams.toString());
      writeCachedAnalysis(searchKey, analysis);
      writeLastCareerSearch({
        cargo: query,
        pais: localCountry || "",
        local: localRegion || localCountry || "",
        modelo: modeloVal || "",
        fonte: searchFonte,
        searchKey,
      });
      setRecentSearches(saveRecentSearch(recentSearchStorageKey, { cargo: query, searchKey }));
      const metaQuota = (analysis as { metadata?: { searchQuota?: SearchQuota } })?.metadata?.searchQuota;
      if (metaQuota && Number.isFinite(metaQuota.used) && Number.isFinite(metaQuota.limit)) {
        setSearchQuota(metaQuota);
      } else {
        void refreshSearchQuota();
      }

      finishingRef.current = true;
      setIsFinishing(true);
      setElapsedSeconds(Math.floor((Date.now() - analysisStartedAtRef.current) / 1000));
      await wait(200);
      if (controller.signal.aborted) return;

      navigate(`/carreira?${queryParams.toString()}`, { state: { analysis } });
    } catch (e: unknown) {
      const err = e as { name?: string };
      if (controller.signal.aborted || err?.name === "AbortError") {
        return;
      }
      logAppError("falha na analise da home");
      if (e instanceof CareerSearchBlockedError) {
        const titles: Record<CareerSearchBlockReason, string> = {
          login: "Entre para continuar a análise",
          rate: "Limite de buscas atingido",
          invalid: "Cargo não reconhecido",
          generic: "Não foi possível analisar",
        };
        if (e.quota) setSearchQuota(e.quota);
        else if (e.reason === "rate") void refreshSearchQuota();
        setSearchGate({
          reason: e.reason,
          title: titles[e.reason],
          message: e.message,
          cargo: query,
        });
        setErrorMsg("");
        return;
      }
      setErrorMsg("Tente de novo daqui a pouco.");
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        finishingRef.current = false;
        setIsAnalyzing(false);
        setIsFinishing(false);
      }
    }
  };

  const cancelAnalysis = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    finishingRef.current = false;
    setIsAnalyzing(false);
    setElapsedSeconds(0);
    setIsFinishing(false);
    setShowDropdown(false);
    setErrorMsg("");
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAnalyzing) {
      submitSearch();
    }
  };

  const pickPopularSearch = (career: string) => {
    const value = career.trim();
    if (!value || isAnalyzing) return;
    setSearchVal(value);
  };

  const openRecentSearch = (item: RecentCareerSearch) => {
    if (isAnalyzing) return;
    const cargo = item.cargo.trim();
    if (!cargo) return;
    setSearchVal(cargo);
    setShowDropdown(false);
    setErrorMsg("");
    if (item.searchKey) {
      navigate(`/carreira?${item.searchKey}`);
      return;
    }
    void submitSearch(cargo);
  };

  const scrollToCareerSearch = () => {
    const input = document.getElementById("career-search-input") as HTMLInputElement | null;
    input?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => input?.focus(), 250);
  };

  const openSearchField = (input: HTMLInputElement) => {
    setShowDropdown(true);
    input.select();
  };

  const handleSearchInputFocus = (event: FocusEvent<HTMLInputElement>) => {
    openSearchField(event.currentTarget);
  };

  const handleSearchInputClick = (event: MouseEvent<HTMLInputElement>) => {
    openSearchField(event.currentTarget);
  };

  const keepDropdownWithoutKeyboard = () => {
    searchInputRef.current?.blur();
  };
  const progressPercent = isFinishing
    ? 100
    : Math.min(96, Math.max(8, (elapsedSeconds / ESTIMATED_ANALYSIS_SECONDS) * 100));
  const remainingSeconds = Math.max(0, ESTIMATED_ANALYSIS_SECONDS - elapsedSeconds);
  const remainingDisplay = isFinishing || elapsedSeconds >= ESTIMATED_ANALYSIS_SECONDS
    ? "Finalizando..."
    : formatDuration(remainingSeconds);

  return (
    <>
      <style>{style}</style>
      <div className="ha-root">
        {searchGate && (
          <div className="ha-analysis-overlay" role="presentation" onClick={() => setSearchGate(null)}>
            <div
              className="ha-gate-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="search-gate-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="ha-gate-kicker">
                {searchGate.reason === "login"
                  ? "Conta Worky"
                  : searchGate.reason === "rate"
                    ? "Limite de uso"
                    : searchGate.reason === "invalid"
                      ? "Busca"
                      : "Aviso"}
              </div>
              <h2 id="search-gate-title" className="ha-gate-title">
                {searchGate.title}
              </h2>
              <p className="ha-gate-text">{searchGate.message}</p>
              {searchGate.reason === "login" && (
                <div className="ha-gate-hint">
                  Cargo solicitado: <strong>{searchGate.cargo}</strong>. Depois do login, é só clicar em Analisar de novo.
                </div>
              )}
              {searchGate.reason === "rate" && (
                <div className="ha-gate-hint">
                  {searchQuota && searchQuota.remaining <= 0 && searchQuota.resetsAt
                    ? `Plano gratuito: ${searchQuota.used}/${searchQuota.limit} buscas novas neste mês. Renova em ${formatResetCountdown(searchQuota.resetsAt, quotaNowMs)}. Limpar o navegador não zera: a cota fica na conta (ou no IP se estiver sem login). Buscas já em cache continuam liberadas.`
                    : "Proteção anti-abuso de curto prazo (por minuto/dia). Aguarde um pouco e tente de novo. Não é um cronômetro de várias horas."}
                </div>
              )}
              {searchGate.reason === "invalid" && (
                <div className="ha-gate-hint">
                  Use um cargo ou área profissional, sem e-mail, telefone ou dados pessoais.
                </div>
              )}
              <div className="ha-gate-actions">
                <button type="button" className="ha-gate-btn ghost" onClick={() => setSearchGate(null)}>
                  Fechar
                </button>
                {searchGate.reason === "login" && (
                  <>
                    <button
                      type="button"
                      className="ha-gate-btn secondary"
                      onClick={() => navigate("/auth?mode=register&next=/")}
                    >
                      Criar conta
                    </button>
                    <button
                      type="button"
                      className="ha-gate-btn primary"
                      onClick={() => navigate(`/auth?mode=login&next=/?cargo=${encodeURIComponent(searchGate.cargo)}`)}
                    >
                      Fazer login
                    </button>
                  </>
                )}
                {searchGate.reason === "rate" && (
                  <button type="button" className="ha-gate-btn primary" onClick={() => setSearchGate(null)}>
                    Entendi
                  </button>
                )}
                {searchGate.reason === "invalid" && (
                  <button type="button" className="ha-gate-btn primary" onClick={() => setSearchGate(null)}>
                    Entendi
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        {isAnalyzing && (
          <div className="ha-analysis-overlay" role="presentation">
            <div
              className="ha-analysis-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="analysis-modal-title"
            >
              <div className="ha-analysis-top">
                <div className="ha-analysis-eyebrow">{fonteSearchEyebrow(analysisPreview.fonte)}</div>
                <div id="analysis-modal-title" className="ha-analysis-title">
                  {analysisPreview.cargo || searchVal || "Carreira"}
                </div>
                <div className="ha-analysis-chips">
                  {[
                    fonteSearchLabel(analysisPreview.fonte),
                    analysisPreview.pais,
                    analysisPreview.local,
                    analysisPreview.modelo,
                  ]
                    .filter((tag): tag is string => typeof tag === "string" && Boolean(tag.trim()))
                    .map((tag) => (
                      <span className="ha-analysis-chip" key={tag}>
                        {tag}
                      </span>
                    ))}
                </div>
              </div>

              <div className="ha-analysis-progress" aria-hidden="true">
                <div className="ha-analysis-progress-bar" style={{ width: `${progressPercent}%` }} />
              </div>

              <div className="ha-analysis-metrics">
                <div className="ha-analysis-metric">
                  <div className="ha-analysis-label">Corrido</div>
                  <div className="ha-analysis-value">{formatDuration(elapsedSeconds)}</div>
                </div>
                <div className="ha-analysis-metric">
                  <div className="ha-analysis-label">Estimado</div>
                  <div className="ha-analysis-value">{remainingDisplay}</div>
                </div>
              </div>

              <div className="ha-analysis-actions">
                <button type="button" className="btn-cancel-analysis" onClick={() => cancelAnalysis()}>
                  Cancelar busca
                </button>
              </div>
            </div>
          </div>
        )}
        <SiteHeader activeItem="explorar" onExploreClick={() => navigate("/")} />

        <div className="ha-top">
        <section className="ha-hero">
          <div className="ha-hero-content">
          <div className="ha-brand">
            <div className="ha-brand-logo">Worky</div>
            <p className="ha-brand-tagline">
              Salários, competências e vagas reais do mercado de trabalho.
            </p>
          </div>
          <div className="ha-search-container" ref={searchContainerRef}>
            <div className="ha-search-field">
            <form className="ha-search-wrap" onSubmit={handleSearch} autoComplete="off">
              <Search size={16} strokeWidth={2} aria-hidden="true" />
              <input
                id="career-search-input"
                ref={searchInputRef}
                className="ha-search-input"
                placeholder="Digite o cargo ou a área..."
                value={searchVal}
                name="worky-career-search"
                maxLength={120}
                onChange={(e) => { setSearchVal(e.target.value); setShowDropdown(true); }}
                onFocus={handleSearchInputFocus}
                onClick={handleSearchInputClick}
                disabled={isAnalyzing}
                autoComplete="off"
              />
              <button type="submit" className="btn-search" disabled={isAnalyzing || !searchVal.trim()}>
                {isAnalyzing ? "Analisando" : "Analisar"}
              </button>
            </form>
            {showDropdown && !isAnalyzing && (
              <div className="ha-category-dropdown">
                <div className={`ha-accordion${filtersOpen ? " is-open" : ""}`}>
                  <button
                    type="button"
                    className="ha-accordion-summary"
                    aria-expanded={filtersOpen}
                    onMouseDown={keepDropdownWithoutKeyboard}
                    onClick={() => {
                      setFiltersOpen((open) => !open);
                      setFonteOpen(false);
                    }}
                  >
                    <span className="ha-accordion-label">Filtros</span>
                    <span className="ha-accordion-value">{filterSummary}</span>
                    <ChevronDown size={14} strokeWidth={2.2} className="ha-accordion-chevron" aria-hidden="true" />
                  </button>
                  <div className="ha-accordion-panel" aria-hidden={!filtersOpen}>
                    <div className="ha-accordion-panel-inner">
                      <div className="ha-accordion-body">
                        <div className="ha-search-filters">
                      <div className="ha-search-filter-group">
                        <label>País</label>
                        <select
                          className="ha-search-filter-select"
                          value={localCountry}
                          onChange={(e) => { setLocalCountry(e.target.value); setLocalRegion(""); }}
                          disabled={isAnalyzing}
                        >
                          <option value="">Qualquer país</option>
                          {COUNTRIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div className="ha-search-filter-group">
                        <label>Estado / Região</label>
                        <select
                          className="ha-search-filter-select"
                          value={localRegion}
                          onChange={(e) => setLocalRegion(e.target.value)}
                          disabled={isAnalyzing || !localCountry}
                        >
                          <option value="">{localCountry ? "Qualquer estado" : "Selecione..."}</option>
                          {(LOCATION_DATA[localCountry] || []).map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>
                      <div className="ha-search-filter-group">
                        <label>Modelo</label>
                        <select
                          className="ha-search-filter-select"
                          value={modeloVal}
                          onChange={(e) => setModeloVal(e.target.value)}
                          disabled={isAnalyzing}
                        >
                          <option value="">Qualquer</option>
                          <option value="Remoto">Remoto</option>
                          <option value="Híbrido">Híbrido</option>
                          <option value="Presencial">Presencial</option>
                        </select>
                      </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={`ha-accordion${fonteOpen ? " is-open" : ""}`}>
                  <button
                    type="button"
                    className="ha-accordion-summary"
                    aria-expanded={fonteOpen}
                    onMouseDown={keepDropdownWithoutKeyboard}
                    onClick={() => {
                      setFonteOpen((open) => !open);
                      setFiltersOpen(false);
                    }}
                  >
                    <span className="ha-accordion-label">Fonte</span>
                    <span className="ha-accordion-value">{fonteSummary}</span>
                    <ChevronDown size={14} strokeWidth={2.2} className="ha-accordion-chevron" aria-hidden="true" />
                  </button>
                  <div className="ha-accordion-panel" aria-hidden={!fonteOpen}>
                    <div className="ha-accordion-panel-inner">
                      <div className="ha-accordion-body">
                        <div className="ha-source-tags">
                      <button
                        type="button"
                        className={`ha-source-tag${searchFonte === "scrape" ? " active" : ""}`}
                        onMouseDown={keepDropdownWithoutKeyboard}
                        onClick={() => setSearchFonte("scrape")}
                        disabled={isAnalyzing}
                      >
                        Busca Worky
                      </button>
                      <button
                        type="button"
                        className={`ha-source-tag${searchFonte === "google" ? " active" : ""}`}
                        onMouseDown={keepDropdownWithoutKeyboard}
                        onClick={() => setSearchFonte("google")}
                        disabled={isAnalyzing}
                      >
                        Google Jobs
                      </button>
                      <button
                        type="button"
                        className={`ha-source-tag${searchFonte === "all" ? " active" : ""}`}
                        onMouseDown={keepDropdownWithoutKeyboard}
                        onClick={() => setSearchFonte("all")}
                        disabled={isAnalyzing}
                      >
                        Ambos
                      </button>
                    </div>
                        <p className="ha-source-hint">
                          Busca avançada da Worky em vagas reais da web. Vagas da plataforma entram em destaque.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {recentSearches.length > 0 && (
                  <div className="ha-recent-searches">
                    <div className="ha-recent-title">Últimas pesquisas</div>
                    <div className="ha-recent-list">
                      {recentSearches.map((item) => (
                        <button
                          key={item.searchKey || item.cargo}
                          type="button"
                          className="ha-recent-item"
                          onMouseDown={keepDropdownWithoutKeyboard}
                          onClick={() => openRecentSearch(item)}
                        >
                          {item.cargo}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="ha-popular-block">
                  <div className="ha-recent-title">{typedCareerQuery.length >= 2 ? "Sugestões" : "Populares"}</div>
                  {typedCareerQuery.length >= 2 && careerSuggestions.length === 0 ? (
                    <p className="ha-suggest-empty">Nada parecido. Tente um cargo como Desenvolvedor.</p>
                  ) : (
                    <div className="ha-recent-list">
                      {(typedCareerQuery.length >= 2 ? careerSuggestions : POPULAR_SEARCHES).map((item, index) => (
                        <button
                          key={item}
                          type="button"
                          className={`ha-recent-item${typedCareerQuery.length >= 2 && index === 0 ? " preferred" : ""}`}
                          onMouseDown={keepDropdownWithoutKeyboard}
                          onClick={() => pickPopularSearch(item)}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            </div>
            {searchQuota && (
              <div className="ha-search-quota" aria-live="polite">
                <span
                  className={`ha-search-quota-count${
                    searchQuota.remaining <= 0 ? " empty" : searchQuota.remaining <= 1 ? " low" : ""
                  }`}
                >
                  {searchQuota.used}/{searchQuota.limit} buscas neste mês
                </span>
                <span className="ha-search-quota-timer">
                  Renova em {formatResetCountdown(searchQuota.resetsAt, quotaNowMs)}
                </span>
              </div>
            )}
          </div>
          {errorMsg && (
            <div style={{ color: "#ef4444", fontSize: "0.85rem", marginTop: "-1rem", marginBottom: "1.5rem", fontWeight: 500 }}>
              {errorMsg}
            </div>
          )}
          {recentSearches.length > 0 && (
            <div className="ha-home-recents">
              <div className="ha-home-recents-label">Buscas recentes</div>
              <div className="ha-home-recents-list">
                {recentSearches.map((item) => (
                  <button
                    key={`home-${item.searchKey || item.cargo}`}
                    type="button"
                    className="ha-home-recent-chip"
                    disabled={isAnalyzing}
                    onClick={() => openRecentSearch(item)}
                  >
                    {item.cargo}
                  </button>
                ))}
              </div>
            </div>
          )}
          </div>
        </section>

        <div id="ha-features" className="ha-section">
          <div className="ha-features-fan">
            <BounceCards
              containerWidth={1120}
              containerHeight={180}
              cardWidth={340}
              cardHeight={112}
              spread={162}
              rotation={6}
              pushDistance={130}
            >
              {FEATURE_ITEMS.map((item) => (
                <FeatureCard key={item.key} item={item} onNavigate={navigate} />
              ))}
            </BounceCards>
          </div>
          <div className="ha-features-grid">
            {FEATURE_ITEMS.map((item) => (
              <FeatureCard key={item.key} item={item} onNavigate={navigate} />
            ))}
          </div>
        </div>
        </div>

        <section className="ha-cta-section">
          <div className="ha-cta-bg" />
          <div style={{ position: "relative" }}>
            <div className="ha-cta-title">
              Decida com <em>dados</em>, não com achismo.
            </div>
            <div className="ha-cta-sub">
              Use demanda, salários e competências reais antes de mudar de carreira.
            </div>
            <div className="ha-cta-btns">
              <button type="button" className="btn-cta-primary" onClick={scrollToCareerSearch}>Começar agora</button>
            </div>
          </div>
        </section>

        <div className="ws-ad-wrap ws-ad-wrap--footer">
          <AdSlot
            placement="leaderboard"
            title="Propaganda aqui"
            hint="Faixa inferior da home para parceiros e patrocínios"
          />
        </div>

        <SiteFooter />
      </div>
    </>
  );
}
