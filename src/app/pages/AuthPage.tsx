import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { isAuthConfigured } from "../services/auth";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";

const css = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=DM+Sans:wght@300;400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --primary: #003ec7;
  --primary-btn: #0052ff;
  --primary-dim: #dde1ff;
  --surface: #ffffff;
  --surface-low: #f3f4f5;
  --surface-card: #ffffff;
  --outline: #c3c5d9;
  --outline-soft: rgba(195,197,217,0.35);
  --on-surface: #191c1d;
  --muted: #6b7080;
  --danger: #dc2626;
  --danger-bg: #fef2f2;
  --success: #0f766e;
  --success-bg: #ecfeff;
  --radius-input: 14px;
  --radius-card: 24px;
  --radius-btn: 14px;
}

body { margin: 0; }

.wa-root {
  font-family: 'DM Sans', sans-serif;
  background: var(--surface);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  color: var(--on-surface);
}

.wa-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: #ffffff;
}

.wa-nav {
  position: relative;
  z-index: 10;
  padding: 1.5rem 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wa-logo {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 1.75rem;
  font-weight: 900;
  color: var(--primary);
  letter-spacing: -0.04em;
  text-decoration: none;
  background: none;
  border: none;
  cursor: pointer;
}

.wa-main {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem 3rem;
}

.wa-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  max-width: 480px;
  width: 100%;
  min-width: 0;
}

.wa-stack-register { max-width: 520px; }

.wa-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.65rem;
}

.wa-hero-logo {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 3rem;
  font-weight: 900;
  color: var(--primary);
  letter-spacing: -0.05em;
  line-height: 1;
}

.wa-hero-tagline {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--muted);
  line-height: 1.5;
  max-width: 380px;
}

.wa-card {
  background: rgba(255,255,255,0.78);
  backdrop-filter: blur(24px);
  border: 1px solid var(--outline-soft);
  border-radius: var(--radius-card);
  padding: 1.75rem 2.5rem;
  box-shadow: 0 8px 48px rgba(0,62,199,0.06), 0 1px 3px rgba(0,0,0,0.04);
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
}

.wa-card-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 2rem;
  font-weight: 800;
  color: var(--on-surface);
  letter-spacing: -0.03em;
  margin-bottom: 6px;
}

.wa-card-sub { font-size: 0.9rem; color: var(--muted); margin-bottom: 1rem; }

.wa-banner {
  border-radius: 14px;
  padding: 0.9rem 1rem;
  font-size: 0.84rem;
  line-height: 1.55;
  margin-bottom: 1rem;
}

.wa-banner.error {
  background: var(--danger-bg);
  color: var(--danger);
  border: 1px solid rgba(220,38,38,0.15);
}

.wa-banner.success {
  background: var(--success-bg);
  color: var(--success);
  border: 1px solid rgba(15,118,110,0.14);
}

.wa-social-btns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 1rem;
}

.wa-social-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0.65rem 1rem;
  background: white;
  border: 1px solid var(--outline);
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--on-surface);
  transition: background 0.15s, box-shadow 0.15s;
}

.wa-social-btn:hover { background: var(--surface-low); box-shadow: 0 2px 8px rgba(0,0,0,0.06); }

.wa-social-btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  box-shadow: none;
  background: white;
}

.wa-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 1rem;
}

.wa-divider-line { flex: 1; height: 1px; background: var(--outline); opacity: 0.4; }

.wa-divider-text {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
}

.wa-form { display: flex; flex-direction: column; gap: 0.75rem; }
.wa-field { display: flex; flex-direction: column; gap: 4px; }
.wa-label { font-size: 0.82rem; font-weight: 600; color: var(--muted); }
.wa-label-row { display: flex; justify-content: space-between; align-items: center; }

.wa-forgot {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--primary);
  background: none;
  border: none;
  cursor: not-allowed;
  opacity: 0.65;
}

.wa-input-wrap { position: relative; }

.wa-input {
  width: 100%;
  background: var(--surface-low);
  border: 1.5px solid transparent;
  border-radius: var(--radius-input);
  padding: 0.75rem 1.2rem;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.9rem;
  color: var(--on-surface);
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.wa-input::placeholder { color: #9ca3af; }

.wa-input:focus {
  border-color: rgba(0,82,255,0.4);
  box-shadow: 0 0 0 3px rgba(0,82,255,0.08);
  background: white;
}

.wa-input.invalid {
  border-color: rgba(220,38,38,0.35);
  background: #fff7f7;
}

.wa-eye-btn {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--muted);
  display: flex;
  align-items: center;
  padding: 4px;
}

.wa-eye-btn:hover { color: var(--primary); }

.wa-field-error {
  font-size: 0.78rem;
  color: var(--danger);
  min-height: 1rem;
}

.wa-pw-checklist {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
}

.wa-pw-check {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  color: var(--muted);
  transition: color 0.15s;
}

.wa-pw-check svg { flex-shrink: 0; }

.wa-pw-check.met { color: var(--success); }

.wa-check-row { display: flex; align-items: flex-start; gap: 10px; padding-top: 4px; }

.wa-check-row input[type="checkbox"] {
  width: 16px;
  height: 16px;
  margin-top: 2px;
  accent-color: var(--primary);
  flex-shrink: 0;
  cursor: pointer;
  border-radius: 4px;
}

.wa-check-label {
  font-size: 0.78rem;
  color: var(--muted);
  line-height: 1.55;
  cursor: pointer;
}

.wa-check-link {
  color: var(--primary);
  font-weight: 600;
  text-decoration: none;
}

.wa-check-link:hover { text-decoration: underline; }

.wa-btn {
  width: 100%;
  margin-top: 6px;
  background: var(--primary-btn);
  color: white;
  border: none;
  padding: 0.85rem;
  border-radius: var(--radius-btn);
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  letter-spacing: -0.01em;
  box-shadow: 0 4px 20px rgba(0,82,255,0.28);
  transition: opacity 0.15s, transform 0.12s, box-shadow 0.15s;
}

.wa-btn:hover { opacity: 0.93; box-shadow: 0 6px 28px rgba(0,82,255,0.35); }
.wa-btn:active { transform: scale(0.98); }
.wa-btn:disabled { cursor: wait; opacity: 0.7; }

.wa-type-toggle {
  display: flex;
  background: var(--surface-low);
  border-radius: 12px;
  padding: 4px;
  gap: 4px;
  margin-bottom: 1.25rem;
}

.wa-type-btn {
  flex: 1;
  text-align: center;
  padding: 0.55rem 0.75rem;
  border-radius: 9px;
  border: none;
  background: transparent;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--muted);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.wa-type-btn.active {
  background: white;
  color: var(--primary);
  box-shadow: 0 2px 8px rgba(0,62,199,0.12);
}

.wa-progress-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.wa-progress { display: flex; gap: 6px; flex: 1; }

.wa-progress-seg {
  flex: 1;
  height: 4px;
  border-radius: 999px;
  background: var(--outline-soft);
  transition: background 0.2s;
}

.wa-progress-seg.active { background: var(--primary-btn); }

.wa-progress-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--primary);
  white-space: nowrap;
}

.wa-input-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--muted);
  display: flex;
  pointer-events: none;
}

.wa-input.with-icon { padding-left: 2.75rem; }

select.wa-input {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7080' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  padding-right: 2.5rem;
  cursor: pointer;
}

.wa-back-link {
  display: block;
  width: fit-content;
  margin: 0.9rem auto 0;
  background: none;
  border: none;
  color: var(--muted);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.wa-back-link:hover { color: var(--primary); }

.wa-switch {
  text-align: center;
  font-size: 0.875rem;
  color: var(--muted);
  margin-top: 1rem;
}

.wa-switch-btn {
  color: var(--primary);
  font-weight: 700;
  background: none;
  border: none;
  cursor: pointer;
  font: inherit;
}

.wa-switch-btn:hover { text-decoration: underline; }

.wa-footer {
  position: relative;
  z-index: 1;
  border-top: 1px solid rgba(195,197,217,0.3);
  background: white;
  padding: 1.5rem 2.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.wa-footer-copy { font-size: 0.8rem; color: var(--muted); }
.wa-footer-links { display: flex; gap: 1.5rem; }
.wa-footer-link { font-size: 0.8rem; color: var(--muted); text-decoration: none; cursor: default; }

@media (max-width: 900px) {
  .wa-main { padding: 2rem 1.25rem 2.5rem; }
  .wa-stack { gap: 1.25rem; }
  .wa-card { padding: 1.75rem 1.5rem; }
  .wa-hero-logo { font-size: 2.5rem; }
  .wa-hero-tagline { font-size: 0.95rem; }
}
`;

type AuthMode = "login" | "register";

type LoginErrors = {
  email?: string;
  password?: string;
};

type RegisterErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  agreed?: string;
};

type AccountType = "candidato" | "empresa";

type CompanyErrors = {
  companySize?: string;
  cnpj?: string;
  location?: string;
  sector?: string;
};

const COMPANY_SIZE_OPTIONS = ["1-10 funcionarios", "11-50 funcionarios", "51-200 funcionarios", "200+ funcionarios"];
const COMPANY_SECTOR_OPTIONS = ["Tecnologia", "Financeiro", "Varejo", "Saude", "Educacao", "Industria", "Outro"];

type SocialButtonProps = {
  icon: ReactNode;
  label: string;
};

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {open ? (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </>
      )}
    </svg>
  );
}

function iconProps() {
  return {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
}

function BuildingIcon() {
  return (
    <svg {...iconProps()}>
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <path d="M9 21v-4h6v4M9 7h.01M9 11h.01M9 15h.01M15 7h.01M15 11h.01M15 15h.01" />
    </svg>
  );
}

function AtIcon() {
  return (
    <svg {...iconProps()}>
      <circle cx="12" cy="12" r="4" />
      <path d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-5.5 8.28" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M9 13h6M9 17h6" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function SectorIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M3 21V8l9-5 9 5v13" />
      <path d="M9 21v-6h6v6M3 8l9 5 9-5" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11.5 4.5" />
      <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07L12.5 19.5" />
    </svg>
  );
}

function CheckDotIcon({ met }: { met: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {met ? (
        <>
          <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.15" />
          <path d="M8 12.5l2.5 2.5L16 9" />
        </>
      ) : (
        <circle cx="12" cy="12" r="9" />
      )}
    </svg>
  );
}

const PASSWORD_RULES: { key: string; label: string; test: (password: string) => boolean }[] = [
  { key: "length", label: "Minimo de 8 caracteres", test: (password) => password.length >= 8 },
  { key: "upper", label: "Uma letra maiuscula", test: (password) => /[A-Z]/.test(password) },
  { key: "number", label: "Um numero", test: (password) => /[0-9]/.test(password) },
  { key: "special", label: "Um caractere especial", test: (password) => /[^A-Za-z0-9]/.test(password) },
];

function PasswordChecklist({ password }: { password: string }) {
  return (
    <div className="wa-pw-checklist">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);
        return (
          <div key={rule.key} className={`wa-pw-check${met ? " met" : ""}`}>
            <CheckDotIcon met={met} />
            {rule.label}
          </div>
        );
      })}
    </div>
  );
}

function SocialButton({ icon, label }: SocialButtonProps) {
  return (
    <button className="wa-social-btn" type="button" disabled title="Disponivel em breve">
      {icon}
      {label}
    </button>
  );
}

function getMode(search: string): AuthMode {
  const params = new URLSearchParams(search);
  return params.get("mode") === "register" ? "register" : "login";
}

function getNextPath(search: string): string {
  const params = new URLSearchParams(search);
  const next = params.get("next");
  if (!next || !next.startsWith("/")) {
    return "/perfil";
  }
  return next;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateRegistrationPassword(password: string): string | undefined {
  if (!password) {
    return "Informe sua senha.";
  }
  if (password.length < 8) {
    return "Use pelo menos 8 caracteres.";
  }
  return undefined;
}

function buildAuthPath(mode: AuthMode, nextPath: string, extras?: Record<string, string>) {
  const params = new URLSearchParams({ mode, next: nextPath });
  Object.entries(extras || {}).forEach(([key, value]) => params.set(key, value));
  return `/auth?${params.toString()}`;
}

function AuthBrand({ tagline }: { tagline: string }) {
  return (
    <div className="wa-brand">
      <div className="wa-hero-logo">Worky</div>
      <p className="wa-hero-tagline">{tagline}</p>
    </div>
  );
}

function LoginScreen({
  nextPath,
  globalMessage,
  onSwitch,
}: {
  nextPath: string;
  globalMessage: string;
  onSwitch: () => void;
}) {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: LoginErrors = {};
    if (!email.trim()) {
      nextErrors.email = "Informe seu e-mail.";
    } else if (!isValidEmail(email.trim())) {
      nextErrors.email = "Digite um e-mail valido.";
    }

    if (!password) {
      nextErrors.password = "Informe sua senha.";
    }

    setErrors(nextErrors);
    setFormError("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await signIn({
        email: email.trim().toLowerCase(),
        password,
      });
      navigate(nextPath, { replace: true });
    } catch (error: any) {
      setFormError(error?.message || "Nao foi possivel entrar agora.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="wa-stack">
      <AuthBrand tagline="Entre para salvar análises e acompanhar o mercado." />
      <div className="wa-card">
        <h2 className="wa-card-title">Boas-vindas</h2>
        <p className="wa-card-sub">Acesse sua conta para continuar.</p>

        {!isAuthConfigured() && (
          <div className="wa-banner error">
            Falta configurar o frontend com <strong>VITE_SUPABASE_URL</strong> e <strong>VITE_SUPABASE_ANON_KEY</strong>.
          </div>
        )}
        {globalMessage && <div className="wa-banner success">{globalMessage}</div>}
        {formError && <div className="wa-banner error">{formError}</div>}

        <form className="wa-form" onSubmit={submit} noValidate>
          <div className="wa-field">
            <label className="wa-label" htmlFor="login-email">E-mail</label>
            <div className="wa-input-wrap">
              <input
                id="login-email"
                className={`wa-input${errors.email ? " invalid" : ""}`}
                type="email"
                placeholder="nome@empresa.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="wa-field-error">{errors.email || ""}</div>
          </div>

          <div className="wa-field">
            <div className="wa-label-row">
              <label className="wa-label" htmlFor="login-password">Senha</label>
              <button className="wa-forgot" type="button" disabled>
                Esqueci minha senha
              </button>
            </div>
            <div className="wa-input-wrap">
              <input
                id="login-password"
                className={`wa-input${errors.password ? " invalid" : ""}`}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                style={{ paddingRight: "2.75rem" }}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
              <button className="wa-eye-btn" onClick={() => setShowPassword((value) => !value)} type="button">
                <EyeIcon open={showPassword} />
              </button>
            </div>
            <div className="wa-field-error">{errors.password || ""}</div>
          </div>

          <button className="wa-btn" type="submit" disabled={isSubmitting || !isAuthConfigured()}>
            {isSubmitting ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="wa-divider" style={{ margin: "1rem 0" }}>
          <div className="wa-divider-line" />
          <span className="wa-divider-text">ou conecte-se com</span>
          <div className="wa-divider-line" />
        </div>

        <div className="wa-social-btns">
          <SocialButton icon={<GoogleIcon />} label="Google" />
          <SocialButton icon={<LinkedInIcon />} label="LinkedIn" />
        </div>

        <div className="wa-switch">
          Nao possui uma conta?{" "}
          <button type="button" className="wa-switch-btn" onClick={onSwitch}>
            Criar conta gratis
          </button>
        </div>
      </div>
    </div>
  );
}

function RegisterScreen({
  nextPath,
  globalMessage,
  onSwitch,
  initialAccountType = "candidato",
}: {
  nextPath: string;
  globalMessage: string;
  onSwitch: () => void;
  initialAccountType?: AccountType;
}) {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [accountType, setAccountType] = useState<AccountType>(initialAccountType);
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [companySize, setCompanySize] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [companyLocation, setCompanyLocation] = useState("");
  const [companySector, setCompanySector] = useState("");
  const [companyLinkedin, setCompanyLinkedin] = useState("");
  const [companyErrors, setCompanyErrors] = useState<CompanyErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const switchAccountType = (type: AccountType) => {
    setAccountType(type);
    setStep(1);
    setErrors({});
    setCompanyErrors({});
    setFormError("");
  };

  const validateBaseFields = (includeAgreed: boolean): RegisterErrors => {
    const nextErrors: RegisterErrors = {};
    if (!name.trim()) {
      nextErrors.name = "Informe seu nome completo.";
    } else if (name.trim().length < 3) {
      nextErrors.name = "Use pelo menos 3 caracteres.";
    }

    if (!email.trim()) {
      nextErrors.email = "Informe seu e-mail.";
    } else if (!isValidEmail(email.trim())) {
      nextErrors.email = "Digite um e-mail valido.";
    }

    const passwordError = validateRegistrationPassword(password);
    if (passwordError) {
      nextErrors.password = passwordError;
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Confirme sua senha.";
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = "As senhas nao coincidem.";
    }

    if (includeAgreed && !agreed) {
      nextErrors.agreed = "Voce precisa aceitar os termos para criar a conta.";
    }

    return nextErrors;
  };

  const validateCompanyFields = (): CompanyErrors => {
    const nextErrors: CompanyErrors = {};
    if (!companySize) {
      nextErrors.companySize = "Selecione o tamanho da empresa.";
    }
    if (!cnpj.trim()) {
      nextErrors.cnpj = "Informe o CNPJ.";
    }
    if (!companyLocation.trim()) {
      nextErrors.location = "Informe a localizacao principal.";
    }
    if (!companySector) {
      nextErrors.sector = "Selecione o setor de atuacao.";
    }
    return nextErrors;
  };

  const createAccount = async () => {
    setIsSubmitting(true);
    try {
      const result = await signUp({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        accountType,
        company:
          accountType === "empresa"
            ? {
                size: companySize,
                cnpj,
                location: companyLocation,
                sector: companySector,
                linkedin: companyLinkedin,
              }
            : undefined,
      });

      if (result.needsEmailConfirmation) {
        navigate(buildAuthPath("login", accountType === "empresa" ? "/empresa" : nextPath, { registered: "1" }), {
          replace: true,
        });
        return;
      }

      navigate(accountType === "empresa" ? "/empresa" : nextPath, { replace: true });
    } catch (error: any) {
      setFormError(error?.message || "Nao foi possivel criar a conta agora.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    if (accountType === "empresa" && step === 1) {
      const nextErrors = validateBaseFields(false);
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length === 0) {
        setStep(2);
      }
      return;
    }

    if (accountType === "empresa" && step === 2) {
      const nextCompanyErrors = validateCompanyFields();
      const agreedError: RegisterErrors = !agreed
        ? { agreed: "Voce precisa aceitar os termos para criar a conta." }
        : {};
      setCompanyErrors(nextCompanyErrors);
      setErrors(agreedError);
      if (Object.keys(nextCompanyErrors).length > 0 || Object.keys(agreedError).length > 0) {
        return;
      }
      await createAccount();
      return;
    }

    const nextErrors = validateBaseFields(true);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    await createAccount();
  };

  const isCompanyStep2 = accountType === "empresa" && step === 2;

  const cardTitle =
    accountType === "empresa" ? (step === 1 ? "Crie sua conta" : "Dados da Empresa") : "Criar Conta";
  const cardSub =
    accountType === "empresa"
      ? step === 1
        ? "Comece a publicar vagas e gerenciar candidatos."
        : "Complete o perfil da empresa para liberar o painel."
      : "Preencha os dados abaixo para acessar a plataforma.";

  return (
    <div className="wa-stack wa-stack-register">
      <AuthBrand tagline="Crie sua conta para salvar buscas e completar o perfil." />
      <div className="wa-card" style={{ padding: "2.25rem 2.25rem" }}>
        <h2 className="wa-card-title">{cardTitle}</h2>
        <p className="wa-card-sub">{cardSub}</p>

        {!isAuthConfigured() && (
          <div className="wa-banner error">
            Falta configurar o frontend com <strong>VITE_SUPABASE_URL</strong> e <strong>VITE_SUPABASE_ANON_KEY</strong>.
          </div>
        )}
        {globalMessage && <div className="wa-banner success">{globalMessage}</div>}
        {formError && <div className="wa-banner error">{formError}</div>}

        <div className="wa-type-toggle">
          <button
            type="button"
            className={`wa-type-btn${accountType === "candidato" ? " active" : ""}`}
            onClick={() => switchAccountType("candidato")}
          >
            Sou Candidato
          </button>
          <button
            type="button"
            className={`wa-type-btn${accountType === "empresa" ? " active" : ""}`}
            onClick={() => switchAccountType("empresa")}
          >
            Sou Empresa
          </button>
        </div>

        {accountType === "empresa" && (
          <div className="wa-progress-row">
            <div className="wa-progress">
              <div className="wa-progress-seg active" />
              <div className={`wa-progress-seg${step === 2 ? " active" : ""}`} />
            </div>
            <span className="wa-progress-label">Passo {step} de 2</span>
          </div>
        )}

        {!isCompanyStep2 && (
          <>
            <div className="wa-social-btns" style={{ marginBottom: "1.25rem" }}>
              <SocialButton icon={<GoogleIcon />} label="Google" />
              <SocialButton icon={<LinkedInIcon />} label="LinkedIn" />
            </div>

            <div className="wa-divider" style={{ marginBottom: "1.25rem" }}>
              <div className="wa-divider-line" />
              <span className="wa-divider-text">ou use seu e-mail</span>
              <div className="wa-divider-line" />
            </div>
          </>
        )}

        <form className="wa-form" onSubmit={submit} noValidate>
          {!isCompanyStep2 && (
            <>
              <div className="wa-field">
                <label className="wa-label" htmlFor="register-name">
                  {accountType === "empresa" ? "Nome da Empresa" : "Nome Completo"}
                </label>
                <div className="wa-input-wrap">
                  {accountType === "empresa" && (
                    <span className="wa-input-icon"><BuildingIcon /></span>
                  )}
                  <input
                    id="register-name"
                    className={`wa-input${accountType === "empresa" ? " with-icon" : ""}${errors.name ? " invalid" : ""}`}
                    type="text"
                    placeholder={accountType === "empresa" ? "Ex: Tech Solutions Inc." : "Ex: Joao Silva"}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                  />
                </div>
                <div className="wa-field-error">{errors.name || ""}</div>
              </div>

              {accountType === "empresa" && (
                <div className="wa-field">
                  <label className="wa-label" htmlFor="register-username">Nome de usuario</label>
                  <div className="wa-input-wrap">
                    <span className="wa-input-icon"><AtIcon /></span>
                    <input
                      id="register-username"
                      className="wa-input with-icon"
                      type="text"
                      placeholder="techsolutions"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      autoComplete="off"
                    />
                  </div>
                </div>
              )}

              <div className="wa-field">
                <label className="wa-label" htmlFor="register-email">E-mail</label>
                <input
                  id="register-email"
                  className={`wa-input${errors.email ? " invalid" : ""}`}
                  type="email"
                  placeholder="nome@empresa.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                />
                <div className="wa-field-error">{errors.email || ""}</div>
              </div>

              <div className="wa-field">
                <label className="wa-label" htmlFor="register-password">Senha</label>
                <div className="wa-input-wrap">
                  <input
                    id="register-password"
                    className={`wa-input${errors.password ? " invalid" : ""}`}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    style={{ paddingRight: "2.75rem" }}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                  />
                  <button className="wa-eye-btn" onClick={() => setShowPassword((value) => !value)} type="button">
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
                <PasswordChecklist password={password} />
                <div className="wa-field-error">{errors.password || ""}</div>
              </div>

              <div className="wa-field">
                <label className="wa-label" htmlFor="register-confirm-password">Confirmar Senha</label>
                <div className="wa-input-wrap">
                  <input
                    id="register-confirm-password"
                    className={`wa-input${errors.confirmPassword ? " invalid" : ""}`}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    style={{ paddingRight: "2.75rem" }}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    className="wa-eye-btn"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    type="button"
                  >
                    <EyeIcon open={showConfirmPassword} />
                  </button>
                </div>
                <div className="wa-field-error">{errors.confirmPassword || ""}</div>
              </div>

              {accountType === "candidato" && (
                <>
                  <div className="wa-check-row">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={agreed}
                      onChange={(event) => setAgreed(event.target.checked)}
                    />
                    <label className="wa-check-label" htmlFor="terms">
                      Ao criar uma conta, voce concorda com nossos{" "}
                      <a className="wa-check-link" href="/termos" target="_blank" rel="noopener noreferrer">
                        Termos de Uso
                      </a>{" "}
                      e{" "}
                      <a className="wa-check-link" href="/privacidade" target="_blank" rel="noopener noreferrer">
                        Politica de Privacidade
                      </a>.
                    </label>
                  </div>
                  <div className="wa-field-error">{errors.agreed || ""}</div>
                </>
              )}

              <button className="wa-btn" type="submit" disabled={isSubmitting || !isAuthConfigured()}>
                {accountType === "empresa"
                  ? "Criar conta corporativa"
                  : isSubmitting
                    ? "Criando conta..."
                    : "Criar Conta"}
              </button>
            </>
          )}

          {isCompanyStep2 && (
            <>
              <div className="wa-field">
                <label className="wa-label" htmlFor="company-size">Tamanho da Empresa</label>
                <div className="wa-input-wrap">
                  <span className="wa-input-icon"><BuildingIcon /></span>
                  <select
                    id="company-size"
                    className={`wa-input with-icon${companyErrors.companySize ? " invalid" : ""}`}
                    value={companySize}
                    onChange={(event) => setCompanySize(event.target.value)}
                  >
                    <option value="">Selecione o numero de funcionarios</option>
                    {COMPANY_SIZE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div className="wa-field-error">{companyErrors.companySize || ""}</div>
              </div>

              <div className="wa-field">
                <label className="wa-label" htmlFor="company-cnpj">CNPJ</label>
                <div className="wa-input-wrap">
                  <span className="wa-input-icon"><DocumentIcon /></span>
                  <input
                    id="company-cnpj"
                    className={`wa-input with-icon${companyErrors.cnpj ? " invalid" : ""}`}
                    type="text"
                    placeholder="00.000.000/0000-00"
                    value={cnpj}
                    onChange={(event) => setCnpj(event.target.value)}
                  />
                </div>
                <div className="wa-field-error">{companyErrors.cnpj || ""}</div>
              </div>

              <div className="wa-field">
                <label className="wa-label" htmlFor="company-location">Localizacao Principal</label>
                <div className="wa-input-wrap">
                  <span className="wa-input-icon"><PinIcon /></span>
                  <input
                    id="company-location"
                    className={`wa-input with-icon${companyErrors.location ? " invalid" : ""}`}
                    type="text"
                    placeholder="Cidade, Estado"
                    value={companyLocation}
                    onChange={(event) => setCompanyLocation(event.target.value)}
                  />
                </div>
                <div className="wa-field-error">{companyErrors.location || ""}</div>
              </div>

              <div className="wa-field">
                <label className="wa-label" htmlFor="company-sector">Setor de Atuacao</label>
                <div className="wa-input-wrap">
                  <span className="wa-input-icon"><SectorIcon /></span>
                  <select
                    id="company-sector"
                    className={`wa-input with-icon${companyErrors.sector ? " invalid" : ""}`}
                    value={companySector}
                    onChange={(event) => setCompanySector(event.target.value)}
                  >
                    <option value="">Selecione o setor principal</option>
                    {COMPANY_SECTOR_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div className="wa-field-error">{companyErrors.sector || ""}</div>
              </div>

              <div className="wa-field">
                <label className="wa-label" htmlFor="company-linkedin">LinkedIn da Empresa</label>
                <div className="wa-input-wrap">
                  <span className="wa-input-icon"><LinkIcon /></span>
                  <input
                    id="company-linkedin"
                    className="wa-input with-icon"
                    type="text"
                    placeholder="https://linkedin.com/company/..."
                    value={companyLinkedin}
                    onChange={(event) => setCompanyLinkedin(event.target.value)}
                  />
                </div>
              </div>

              <div className="wa-check-row">
                <input
                  type="checkbox"
                  id="terms-empresa"
                  checked={agreed}
                  onChange={(event) => setAgreed(event.target.checked)}
                />
                <label className="wa-check-label" htmlFor="terms-empresa">
                  Ao criar uma conta, voce concorda com nossos{" "}
                  <a className="wa-check-link" href="/termos" target="_blank" rel="noopener noreferrer">
                    Termos de Uso
                  </a>{" "}
                  e{" "}
                  <a className="wa-check-link" href="/privacidade" target="_blank" rel="noopener noreferrer">
                    Politica de Privacidade
                  </a>.
                </label>
              </div>
              <div className="wa-field-error">{errors.agreed || ""}</div>

              <button className="wa-btn" type="submit" disabled={isSubmitting || !isAuthConfigured()}>
                {isSubmitting ? "Criando conta..." : "Finalizar Cadastro →"}
              </button>
              <button className="wa-back-link" type="button" onClick={() => setStep(1)}>
                &larr; Voltar
              </button>
            </>
          )}
        </form>

        <div className="wa-switch">
          Ja tenho uma conta?{" "}
          <button type="button" className="wa-switch-btn" onClick={onSwitch}>
            Fazer Login
          </button>
        </div>
      </div>
    </div>
  );
}

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();

  const mode = useMemo(() => getMode(location.search), [location.search]);
  const nextPath = useMemo(() => getNextPath(location.search), [location.search]);
  const initialAccountType = useMemo<AccountType>(() => {
    const tipo = new URLSearchParams(location.search).get("tipo");
    return tipo === "empresa" ? "empresa" : "candidato";
  }, [location.search]);
  const [registeredMessage, setRegisteredMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("registered") === "1") {
      setRegisteredMessage("Conta criada com sucesso. Se o Supabase estiver com confirmacao de e-mail ativa, confirme seu e-mail antes de entrar.");
      return;
    }
    setRegisteredMessage("");
  }, [location.search]);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(nextPath, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, nextPath]);

  const switchMode = (nextMode: AuthMode) => {
    navigate(buildAuthPath(nextMode, nextPath), { replace: true });
  };

  if (!loading && isAuthenticated) {
    return null;
  }

  return (
    <>
      <style>{css}</style>
      <div className="wa-root">
        <div className="wa-bg" />
        <SiteHeader showProfileAction={false} onExploreClick={() => navigate("/")} onAboutClick={() => navigate("/")} />

        <main className="wa-main">
          {mode === "login" ? (
            <LoginScreen
              nextPath={nextPath}
              globalMessage={registeredMessage}
              onSwitch={() => switchMode("register")}
            />
          ) : (
            <RegisterScreen
              nextPath={nextPath}
              globalMessage=""
              onSwitch={() => switchMode("login")}
              initialAccountType={initialAccountType}
            />
          )}
        </main>

        <SiteFooter copy="2026 Worky. Todos os direitos reservados." links={["Privacidade", "Suporte"]} />
      </div>
    </>
  );
}
