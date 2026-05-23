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
  --surface: #f8f9fa;
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
  background:
    radial-gradient(ellipse 60% 50% at 0% 0%, rgba(0,82,255,0.06) 0%, transparent 60%),
    radial-gradient(ellipse 50% 40% at 100% 100%, rgba(0,88,88,0.06) 0%, transparent 60%),
    #f8f9fa;
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
  padding: 1rem 2rem 3rem;
}

.wa-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  max-width: 1100px;
  width: 100%;
  align-items: center;
}

.wa-grid-register { gap: 3rem; }

.wa-left { display: flex; flex-direction: column; gap: 2rem; }

.wa-hero-logo {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 4rem;
  font-weight: 900;
  color: var(--primary);
  letter-spacing: -0.05em;
  line-height: 1;
}

.wa-hero-tagline {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 1.35rem;
  font-weight: 600;
  color: var(--muted);
  line-height: 1.5;
  max-width: 420px;
}

.wa-img-wrap {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(0,62,199,0.12);
}

.wa-img-wrap img {
  width: 100%;
  aspect-ratio: 4/3;
  object-fit: cover;
  display: block;
}

.wa-img-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(0,82,255,0.04), transparent 60%);
  pointer-events: none;
}

.wa-social-proof { display: flex; align-items: center; gap: 12px; }
.wa-avatars { display: flex; }
.wa-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 2.5px solid var(--surface-card);
  margin-left: -10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
}

.wa-avatar:first-child { margin-left: 0; }
.wa-proof-text { font-size: 0.875rem; color: var(--muted); }
.wa-proof-text strong { color: var(--on-surface); font-weight: 700; }

.wa-register-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1.75rem;
  background: rgba(255,255,255,0.75);
  backdrop-filter: blur(18px);
  border-top: 1px solid rgba(255,255,255,0.6);
}

.wa-register-overlay h3 {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--on-surface);
  margin-bottom: 6px;
}

.wa-register-overlay p {
  font-size: 0.85rem;
  color: var(--muted);
  line-height: 1.5;
}

.wa-card {
  background: rgba(255,255,255,0.78);
  backdrop-filter: blur(24px);
  border: 1px solid var(--outline-soft);
  border-radius: var(--radius-card);
  padding: 2.75rem 2.5rem;
  box-shadow: 0 8px 48px rgba(0,62,199,0.06), 0 1px 3px rgba(0,0,0,0.04);
}

.wa-card-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 2rem;
  font-weight: 800;
  color: var(--on-surface);
  letter-spacing: -0.03em;
  margin-bottom: 6px;
}

.wa-card-sub { font-size: 0.9rem; color: var(--muted); margin-bottom: 2rem; }

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
  margin-bottom: 1.5rem;
}

.wa-social-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0.75rem 1rem;
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
  margin-bottom: 1.5rem;
}

.wa-divider-line { flex: 1; height: 1px; background: var(--outline); opacity: 0.4; }

.wa-divider-text {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
}

.wa-form { display: flex; flex-direction: column; gap: 1.1rem; }
.wa-field { display: flex; flex-direction: column; gap: 6px; }
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
  padding: 0.9rem 1.2rem;
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
  padding: 1rem;
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

.wa-switch {
  text-align: center;
  font-size: 0.875rem;
  color: var(--muted);
  margin-top: 1.5rem;
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
  .wa-grid { grid-template-columns: 1fr; gap: 2rem; }
  .wa-left { display: none; }
  .wa-card { padding: 2rem 1.5rem; }
  .wa-hero-logo { font-size: 2.5rem; }
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

function LeftLoginPanel() {
  return (
    <div className="wa-left">
      <div>
        <div className="wa-hero-logo">Worky</div>
        <p className="wa-hero-tagline" style={{ marginTop: "1rem" }}>
          A inteligencia que conecta voce ao futuro do mercado de trabalho.
        </p>
      </div>

      <div className="wa-img-wrap">
        <img
          src="https://images.unsplash.com/photo-1639762681057-408e52192e55?w=700&q=80"
          alt="Visual de tecnologia"
          onError={(event) => {
            event.currentTarget.src = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=700&q=80";
          }}
        />
        <div className="wa-img-glow" />
      </div>

    </div>
  );
}

function LeftRegisterPanel() {
  return (
    <div className="wa-left">
      <div className="wa-img-wrap" style={{ borderRadius: 20 }}>
        <img
          src="https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=700&q=80"
          alt="Espaco de trabalho profissional"
          style={{ aspectRatio: "4/5" }}
          onError={(event) => {
            event.currentTarget.src = "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=700&q=80";
          }}
        />
        <div className="wa-img-glow" />
        <div className="wa-register-overlay">
          <h3>Sua proxima etapa profissional comeca aqui.</h3>
          <p>Crie sua conta para acompanhar analises, salvar preferencias e evoluir seu perfil aos poucos.</p>
        </div>
      </div>
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
    <div className="wa-grid">
      <LeftLoginPanel />
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

        <div className="wa-divider" style={{ margin: "1.75rem 0" }}>
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
}: {
  nextPath: string;
  globalMessage: string;
  onSwitch: () => void;
}) {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

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

    if (!agreed) {
      nextErrors.agreed = "Voce precisa aceitar os termos para criar a conta.";
    }

    setErrors(nextErrors);
    setFormError("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signUp({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      if (result.needsEmailConfirmation) {
        navigate(buildAuthPath("login", nextPath, { registered: "1" }), { replace: true });
        return;
      }

      navigate(nextPath, { replace: true });
    } catch (error: any) {
      setFormError(error?.message || "Nao foi possivel criar a conta agora.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="wa-grid wa-grid-register">
      <LeftRegisterPanel />
      <div className="wa-card" style={{ padding: "2.25rem 2.25rem" }}>
        <h2 className="wa-card-title">Criar Conta</h2>
        <p className="wa-card-sub">Preencha os dados abaixo para acessar a plataforma.</p>

        {!isAuthConfigured() && (
          <div className="wa-banner error">
            Falta configurar o frontend com <strong>VITE_SUPABASE_URL</strong> e <strong>VITE_SUPABASE_ANON_KEY</strong>.
          </div>
        )}
        {globalMessage && <div className="wa-banner success">{globalMessage}</div>}
        {formError && <div className="wa-banner error">{formError}</div>}

        <div className="wa-social-btns" style={{ marginBottom: "1.25rem" }}>
          <SocialButton icon={<GoogleIcon />} label="Google" />
          <SocialButton icon={<LinkedInIcon />} label="LinkedIn" />
        </div>

        <div className="wa-divider" style={{ marginBottom: "1.25rem" }}>
          <div className="wa-divider-line" />
          <span className="wa-divider-text">ou use seu e-mail</span>
          <div className="wa-divider-line" />
        </div>

        <form className="wa-form" onSubmit={submit} noValidate>
          <div className="wa-field">
            <label className="wa-label" htmlFor="register-name">Nome Completo</label>
            <input
              id="register-name"
              className={`wa-input${errors.name ? " invalid" : ""}`}
              type="text"
              placeholder="Ex: Joao Silva"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
            />
            <div className="wa-field-error">{errors.name || ""}</div>
          </div>

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
              <button className="wa-eye-btn" onClick={() => setShowConfirmPassword((value) => !value)} type="button">
                <EyeIcon open={showConfirmPassword} />
              </button>
            </div>
            <div className="wa-field-error">{errors.confirmPassword || ""}</div>
          </div>

          <div className="wa-check-row">
            <input
              type="checkbox"
              id="terms"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
            />
            <label className="wa-check-label" htmlFor="terms">
              Ao criar uma conta, voce concorda com nossos{" "}
              <a className="wa-check-link" href="#" onClick={(event) => event.preventDefault()}>
                Termos de Uso
              </a>{" "}
              e{" "}
              <a className="wa-check-link" href="#" onClick={(event) => event.preventDefault()}>
                Politica de Privacidade
              </a>.
            </label>
          </div>
          <div className="wa-field-error">{errors.agreed || ""}</div>

          <button className="wa-btn" type="submit" disabled={isSubmitting || !isAuthConfigured()}>
            {isSubmitting ? "Criando conta..." : "Criar Conta"}
          </button>
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
            />
          )}
        </main>

        <SiteFooter copy="2026 Worky. Todos os direitos reservados." links={["Privacidade", "Suporte"]} />
      </div>
    </>
  );
}
