import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import { getReferralLink, getReferralProgress, registerReferralShare, REFERRAL_GOAL } from "../services/referral";

const STEPS = [
  {
    title: "Compartilhe seu link",
    text: "Envie seu link exclusivo por WhatsApp, LinkedIn ou e-mail.",
  },
  {
    title: "Amigos se cadastram",
    text: "Seus amigos criam uma conta gratuita na Worky usando o seu link.",
  },
  {
    title: "Desbloqueie o Premium",
    text: `Atingindo ${REFERRAL_GOAL} amigos, você recebe automaticamente os benefícios na sua conta.`,
  },
];

const BENEFITS = [
  "Destaque no perfil para recrutadores",
  "Acesso antecipado a novas vagas",
  "Análise de currículo com IA detalhada",
  "Badge exclusivo na comunidade",
];

function StepIcon({ index }: { index: number }) {
  const icons = [
    <path key="share" d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13" />,
    <path key="people" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />,
    <path key="lock" d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2ZM7 11V7a5 5 0 0 1 10 0v4" />,
  ];
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icons[index]}
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export function ReferralProgramPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [progress, setProgress] = useState(() => (user ? getReferralProgress(user.id) : 0));
  const [copied, setCopied] = useState(false);

  const link = user ? getReferralLink(user.id) : "";
  const remaining = Math.max(0, REFERRAL_GOAL - progress);
  const progressPct = Math.round((Math.min(progress, REFERRAL_GOAL) / REFERRAL_GOAL) * 100);

  const handleCopy = async () => {
    if (!user) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = link;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      setProgress(registerReferralShare(user.id));
    } catch (err) {
      console.error("Nao foi possivel copiar o link de indicacao:", err);
    }
  };

  return (
    <div className="rp-root">
      <style>{style}</style>
      <SiteHeader onExploreClick={() => navigate("/")} />

      {!user ? (
        <section className="rp-locked">
          <h1>Indique amigos e ganhe benefícios Premium</h1>
          <p>Entre na sua conta para pegar seu link de indicação exclusivo.</p>
          <button type="button" className="rp-btn-primary" onClick={() => navigate("/auth")}>
            Entrar na conta
          </button>
        </section>
      ) : (
        <>
          <section className="rp-hero">
            <h1>
              Indique amigos e ganhe <span className="accent">benefícios Premium</span>
            </h1>
            <p>
              Construa sua rede na Worky. A cada amigo que se cadastrar com seu link, você se aproxima de
              vantagens exclusivas no mercado de trabalho.
            </p>
          </section>

          <section className="rp-layout">
            <div className="rp-main">
              <div className="rp-link-card">
                <h2>Seu Link de Convite</h2>
                <p>Compartilhe este link com sua rede. Quando eles criarem uma conta, a indicação será contabilizada.</p>
                <div className="rp-link-row">
                  <input
                    className="rp-link-input"
                    readOnly
                    value={link}
                    onFocus={(event) => event.target.select()}
                  />
                  <button type="button" className="rp-btn-primary" onClick={handleCopy}>
                    {copied ? "Copiado!" : "Copiar Link"}
                  </button>
                </div>
              </div>

              <div className="rp-steps-card">
                <h2>Como Funciona</h2>
                <div className="rp-steps">
                  {STEPS.map((step, index) => (
                    <div className="rp-step" key={step.title}>
                      <div className="rp-step-icon">
                        <StepIcon index={index} />
                      </div>
                      <div>
                        <div className="rp-step-title">{index + 1}. {step.title}</div>
                        <div className="rp-step-text">{step.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className="rp-aside">
              <div className="rp-progress-card">
                <div className="rp-progress-label">Seu progresso</div>
                <div className="rp-progress-count">{progress}/{REFERRAL_GOAL}</div>
                <div className="rp-progress-bar">
                  <div className="rp-progress-fill" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="rp-progress-note">
                  {remaining > 0
                    ? `Faltam ${remaining} ${remaining === 1 ? "amigo" : "amigos"} para desbloquear o Badge Premium.`
                    : "Badge Premium desbloqueado!"}
                </div>
              </div>

              <div className="rp-benefits-card">
                <div className="rp-benefits-title">Benefícios Premium</div>
                <ul className="rp-benefits-list">
                  {BENEFITS.map((benefit) => (
                    <li key={benefit}>
                      <span className="rp-check"><CheckIcon /></span>
                      {benefit}
                    </li>
                  ))}
                </ul>
                <div className="rp-benefits-note">Benefícios válidos por 3 meses após o desbloqueio.</div>
              </div>
            </aside>
          </section>
        </>
      )}

      <SiteFooter copy="2026 Worky. Inteligência de Mercado." />
    </div>
  );
}

const style = `
  .rp-root { font-family: 'Inter', sans-serif; color: #0f172a; background: #ffffff; min-height: 100vh; }

  .rp-locked { max-width: 480px; margin: 0 auto; padding: 6rem 1.5rem; text-align: center; }
  .rp-locked h1 { font-family: 'Sora', sans-serif; font-size: 1.75rem; font-weight: 800; margin-bottom: 0.75rem; }
  .rp-locked p { color: #64748b; margin-bottom: 1.5rem; }

  .rp-hero { max-width: 720px; margin: 0 auto; padding: 4rem 1.5rem 1rem; text-align: center; }
  .rp-hero h1 { font-family: 'Sora', sans-serif; font-size: clamp(1.9rem, 4vw, 2.5rem); font-weight: 800; line-height: 1.25; margin-bottom: 0.9rem; }
  .rp-hero h1 .accent { color: #2563eb; }
  .rp-hero p { color: #64748b; font-size: 1rem; line-height: 1.6; }

  .rp-layout { max-width: 1080px; margin: 0 auto; padding: 2.5rem 1.5rem 4rem; display: grid; grid-template-columns: 1.6fr 1fr; gap: 1.5rem; align-items: start; }
  .rp-main { display: flex; flex-direction: column; gap: 1.5rem; }

  .rp-link-card, .rp-steps-card, .rp-progress-card, .rp-benefits-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.75rem; }
  .rp-link-card h2, .rp-steps-card h2 { font-family: 'Sora', sans-serif; font-size: 1.1rem; font-weight: 700; margin-bottom: 0.5rem; }
  .rp-link-card p { color: #64748b; font-size: 0.87rem; margin-bottom: 1.25rem; line-height: 1.5; }
  .rp-link-row { display: flex; gap: 0.6rem; }
  .rp-link-input { flex: 1; min-width: 0; border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.7rem 0.9rem; font-size: 0.88rem; color: #475569; background: #f8fafc; }

  .rp-btn-primary { background: #2563eb; color: #fff; border: none; border-radius: 10px; padding: 0.7rem 1.2rem; font-size: 0.88rem; font-weight: 700; cursor: pointer; white-space: nowrap; }
  .rp-btn-primary:hover { background: #1d4ed8; }

  .rp-steps { display: flex; flex-direction: column; gap: 1.25rem; margin-top: 1rem; }
  .rp-step { display: flex; gap: 0.9rem; align-items: flex-start; }
  .rp-step-icon { flex: 0 0 auto; width: 34px; height: 34px; border-radius: 10px; background: #eff6ff; color: #2563eb; display: flex; align-items: center; justify-content: center; }
  .rp-step-title { font-weight: 700; font-size: 0.92rem; margin-bottom: 0.25rem; }
  .rp-step-text { color: #64748b; font-size: 0.85rem; line-height: 1.5; }

  .rp-aside { display: flex; flex-direction: column; gap: 1.5rem; }
  .rp-progress-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #94a3b8; margin-bottom: 0.5rem; }
  .rp-progress-count { font-family: 'Sora', sans-serif; font-size: 1.8rem; font-weight: 800; margin-bottom: 0.75rem; }
  .rp-progress-bar { background: #eef2ff; border-radius: 999px; height: 8px; overflow: hidden; margin-bottom: 0.75rem; }
  .rp-progress-fill { background: #2563eb; height: 100%; border-radius: 999px; transition: width 0.3s ease; }
  .rp-progress-note { font-size: 0.82rem; color: #475569; line-height: 1.5; }

  .rp-benefits-title { font-weight: 700; font-size: 1rem; margin-bottom: 1rem; }
  .rp-benefits-list { list-style: none; display: flex; flex-direction: column; gap: 0.7rem; margin-bottom: 1.25rem; }
  .rp-benefits-list li { display: flex; align-items: flex-start; gap: 0.6rem; font-size: 0.87rem; color: #334155; }
  .rp-check { flex: 0 0 auto; width: 18px; height: 18px; border-radius: 50%; background: #ecfdf5; color: #059669; display: inline-flex; align-items: center; justify-content: center; margin-top: 1px; }
  .rp-benefits-note { font-size: 0.78rem; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 0.9rem; }

  @media (max-width: 840px) {
    .rp-layout { grid-template-columns: 1fr; }
  }
`;
