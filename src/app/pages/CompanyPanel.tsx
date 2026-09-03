import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";

const DEMO_USERNAME = "empresa";
const DEMO_PASSWORD = "empresa123";
const SESSION_KEY = "worky_company_session";
const COMPANY_NAME = "Tech Solutions Inc.";

const VAGAS = [
  { id: "v1", titulo: "Desenvolvedor(a) Front-end Pleno", local: "São Paulo, SP", modelo: "Híbrido", candidatos: 8 },
  { id: "v2", titulo: "Analista de Dados Jr", local: "Remoto", modelo: "Remoto", candidatos: 5 },
  { id: "v3", titulo: "UX/UI Designer Sênior", local: "Sorocaba, SP", modelo: "Presencial", candidatos: 3 },
];

const CANDIDATOS = [
  { id: "c1", cargo: "Dev Front-end", match: 94 },
  { id: "c2", cargo: "Dev Full-stack", match: 89 },
  { id: "c3", cargo: "Dev Front-end Jr", match: 85 },
  { id: "c4", cargo: "Engenheiro(a) de Software", match: 81 },
];

export function CompanyPanel() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [activeVaga, setActiveVaga] = useState(VAGAS[0].id);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    setIsLoggedIn(localStorage.getItem(SESSION_KEY) === "1");
  }, []);

  const handleLogin = (event: FormEvent) => {
    event.preventDefault();
    if (username.trim().toLowerCase() === DEMO_USERNAME && password === DEMO_PASSWORD) {
      localStorage.setItem(SESSION_KEY, "1");
      setIsLoggedIn(true);
      setLoginError("");
    } else {
      setLoginError("Usuário ou senha incorretos.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setIsLoggedIn(false);
  };

  const vaga = VAGAS.find((item) => item.id === activeVaga) ?? VAGAS[0];

  if (!isLoggedIn) {
    return (
      <div className="cp-root">
        <style>{style}</style>
        <SiteHeader badge="Empresa" showProfileAction={false} onExploreClick={() => navigate("/")} />
        <main className="cp-login-main">
          <section className="cp-login-card">
            <div className="cp-login-kicker">Painel da Empresa</div>
            <h1>Acesso RH</h1>
            <p>Entre para gerenciar suas vagas e ver os candidatos compatíveis.</p>

            <form onSubmit={handleLogin} className="cp-login-form">
              <div className="cp-field">
                <label htmlFor="company-username">Usuário</label>
                <input
                  id="company-username"
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="empresa"
                  autoComplete="username"
                />
              </div>
              <div className="cp-field">
                <label htmlFor="company-password">Senha</label>
                <input
                  id="company-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="********"
                  autoComplete="current-password"
                />
              </div>
              {loginError && <p className="cp-login-error">{loginError}</p>}
              <button type="submit" className="cp-login-btn">Entrar no painel</button>
            </form>

            <div className="cp-demo-hint">
              Demonstração: usuário <strong>{DEMO_USERNAME}</strong> · senha <strong>{DEMO_PASSWORD}</strong>
            </div>
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
          <button type="button" className="ws-btn-danger" onClick={handleLogout}>Sair</button>
        }
      />

      <main className="cp-main">
        <div className="cp-welcome">
          <div>
            <div className="cp-welcome-label">Bem-vindo(a)</div>
            <h1>{COMPANY_NAME}</h1>
          </div>
          <button type="button" className="cp-btn-primary" disabled title="Recurso em desenho">
            + Nova Vaga
          </button>
        </div>

        <section className="cp-section">
          <h2>Vagas Cadastradas</h2>
          <div className="cp-vagas-grid">
            {VAGAS.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`cp-vaga-card${item.id === activeVaga ? " active" : ""}`}
                onClick={() => { setActiveVaga(item.id); setUnlocked(false); }}
              >
                <div className="cp-vaga-title">{item.titulo}</div>
                <div className="cp-vaga-meta">{item.local} · {item.modelo}</div>
                <div className="cp-vaga-count">{item.candidatos} candidatos compatíveis</div>
              </button>
            ))}
          </div>
        </section>

        <section className="cp-section">
          <h2>Candidatos Compatíveis com "{vaga.titulo}"</h2>
          <p className="cp-section-sub">
            Encontramos <strong>{vaga.candidatos} candidatos</strong> com perfil compatível para essa vaga.
            {!unlocked && " Assine o Plano Pro para ver os perfis completos."}
          </p>

          <div className="cp-candidatos-grid">
            {CANDIDATOS.slice(0, vaga.candidatos > 4 ? 4 : vaga.candidatos).map((candidato) => (
              <div className={`cp-candidato-card${unlocked ? "" : " blurred"}`} key={candidato.id}>
                <div className="cp-candidato-avatar">{candidato.cargo.charAt(0)}</div>
                <div className="cp-candidato-name">{unlocked ? candidato.cargo : "Candidato bloqueado"}</div>
                <div className="cp-candidato-match">{candidato.match}% compatível</div>
                {!unlocked && (
                  <div className="cp-candidato-lock">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          {!unlocked ? (
            <div className="cp-unlock-row">
              <button type="button" className="cp-btn-primary" onClick={() => navigate("/planos?tipo=empresa")}>
                Desbloquear com o Plano Pro
              </button>
              <button type="button" className="cp-btn-ghost" onClick={() => setUnlocked(true)}>
                Simular desbloqueio (demo)
              </button>
            </div>
          ) : (
            <div className="cp-unlocked-note">Candidatos desbloqueados nesta demonstração.</div>
          )}
        </section>
      </main>

      <SiteFooter copy="2026 Worky. Inteligência de Mercado." />
    </div>
  );
}

const style = `
  .cp-root { font-family: 'Inter', sans-serif; color: #0f172a; background: #ffffff; min-height: 100vh; }

  .cp-login-main { display: flex; align-items: center; justify-content: center; min-height: calc(100vh - 130px); padding: 2rem 1.5rem; }
  .cp-login-card { width: 100%; max-width: 420px; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 2.25rem; text-align: center; }
  .cp-login-kicker { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #2563eb; margin-bottom: 0.6rem; }
  .cp-login-card h1 { font-family: 'Sora', sans-serif; font-size: 1.6rem; font-weight: 800; margin-bottom: 0.5rem; }
  .cp-login-card p { color: #64748b; font-size: 0.9rem; margin-bottom: 1.5rem; }
  .cp-login-form { display: flex; flex-direction: column; gap: 1.1rem; text-align: left; }
  .cp-field label { display: block; font-size: 0.82rem; font-weight: 600; margin-bottom: 0.4rem; }
  .cp-field input { width: 100%; border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.65rem 0.85rem; font-size: 0.9rem; box-sizing: border-box; }
  .cp-field input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
  .cp-login-error { color: #dc2626; font-size: 0.82rem; margin: 0; }
  .cp-login-btn { background: #2563eb; color: #fff; border: none; border-radius: 10px; padding: 0.75rem; font-size: 0.9rem; font-weight: 700; cursor: pointer; }
  .cp-login-btn:hover { background: #1d4ed8; }
  .cp-demo-hint { margin-top: 1.25rem; font-size: 0.78rem; color: #94a3b8; background: #f8fafc; border-radius: 8px; padding: 0.6rem 0.75rem; }

  .cp-main { max-width: 1080px; margin: 0 auto; padding: 2.5rem 1.5rem 4rem; }
  .cp-welcome { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; margin-bottom: 2.5rem; flex-wrap: wrap; }
  .cp-welcome-label { font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #94a3b8; margin-bottom: 0.3rem; }
  .cp-welcome h1 { font-family: 'Sora', sans-serif; font-size: 1.9rem; font-weight: 800; }

  .cp-section { margin-bottom: 3rem; }
  .cp-section h2 { font-family: 'Sora', sans-serif; font-size: 1.15rem; font-weight: 700; margin-bottom: 0.5rem; }
  .cp-section-sub { color: #64748b; font-size: 0.87rem; margin-bottom: 1.5rem; }

  .cp-vagas-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }
  .cp-vaga-card { text-align: left; background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1.25rem; cursor: pointer; font-family: inherit; }
  .cp-vaga-card:hover { border-color: #93c5fd; }
  .cp-vaga-card.active { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
  .cp-vaga-title { font-weight: 700; font-size: 0.92rem; margin-bottom: 0.4rem; }
  .cp-vaga-meta { color: #64748b; font-size: 0.8rem; margin-bottom: 0.6rem; }
  .cp-vaga-count { color: #2563eb; font-size: 0.8rem; font-weight: 700; }

  .cp-candidatos-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
  .cp-candidato-card { position: relative; background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1.25rem; text-align: center; overflow: hidden; }
  .cp-candidato-card.blurred .cp-candidato-name,
  .cp-candidato-card.blurred .cp-candidato-avatar { filter: blur(5px); user-select: none; }
  .cp-candidato-avatar { width: 44px; height: 44px; border-radius: 50%; background: #eff6ff; color: #2563eb; display: flex; align-items: center; justify-content: center; font-weight: 800; margin: 0 auto 0.75rem; }
  .cp-candidato-name { font-weight: 700; font-size: 0.88rem; margin-bottom: 0.3rem; }
  .cp-candidato-match { color: #059669; font-size: 0.78rem; font-weight: 700; }
  .cp-candidato-lock { position: absolute; top: 0.75rem; right: 0.75rem; width: 26px; height: 26px; border-radius: 50%; background: rgba(15,23,42,0.06); color: #64748b; display: flex; align-items: center; justify-content: center; }

  .cp-unlock-row { display: flex; gap: 0.75rem; flex-wrap: wrap; }
  .cp-btn-primary { background: #2563eb; color: #fff; border: none; border-radius: 10px; padding: 0.7rem 1.3rem; font-size: 0.88rem; font-weight: 700; cursor: pointer; }
  .cp-btn-primary:hover:not(:disabled) { background: #1d4ed8; }
  .cp-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .cp-btn-ghost { background: none; border: 1px solid #cbd5e1; color: #475569; border-radius: 10px; padding: 0.7rem 1.3rem; font-size: 0.88rem; font-weight: 700; cursor: pointer; }
  .cp-btn-ghost:hover { border-color: #2563eb; color: #2563eb; }
  .cp-unlocked-note { background: #ecfdf5; color: #047857; font-size: 0.85rem; font-weight: 600; border-radius: 10px; padding: 0.75rem 1rem; display: inline-block; }
`;
