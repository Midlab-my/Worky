import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { AdSlot } from "../components/AdSlot";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import { useAuth } from "../context/AuthContext";

type Plan = {
  id: string;
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  ctaDisabled?: boolean;
  featured?: boolean;
  badge?: string;
};

type AudienceType = "candidato" | "empresa";

const PLANS_BY_AUDIENCE: Record<AudienceType, Plan[]> = {
  candidato: [
    {
      id: "free",
      name: "Free",
      price: "R$ 0",
      period: "/mês",
      description: "Para quem esta começando a analisar o mercado.",
      features: ["5 buscas/mês", "Análise básica de perfil"],
      cta: "Plano Atual",
      ctaDisabled: true,
    },
    {
      id: "pro",
      name: "Pro",
      price: "R$ 9",
      period: "/mês",
      description: "Buscas sem limite e match de perfil.",
      features: ["Buscas ilimitadas", "Simulador de Match de perfil", "Alertas em tempo real"],
      cta: "Assinar Pro",
      featured: true,
      badge: "Recomendado",
    },
  ],
  empresa: [
    {
      id: "starter",
      name: "Starter",
      price: "R$ 0",
      period: "/mês",
      description: "Publique vagas e alcance candidatos.",
      features: ["Cadastro de vaga ilimitado", "Vaga visível para os candidatos"],
      cta: "Plano Atual",
      ctaDisabled: true,
    },
    {
      id: "pro",
      name: "Pro",
      price: "R$ 199",
      period: "/mês",
      description: "Lista de candidatos e match para o time de RH.",
      features: ["Lista de candidatos compatíveis desbloqueada", "Simulador de Match de perfil", "Alertas em tempo real"],
      cta: "Assinar Pro",
      featured: true,
      badge: "Recomendado",
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "R$ 500",
      period: "/mês",
      description: "Para times de recrutamento em escala.",
      features: ["Candidatos compatíveis ilimitados", "Relatórios do time", "API de dados", "Suporte prioritário"],
      cta: "Ativar Enterprise",
    },
  ],
};

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export function PlansPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isCompanyAccount } = useAuth();
  const [audienceChoice, setAudienceChoice] = useState<AudienceType>(
    searchParams.get("tipo") === "empresa" ? "empresa" : "candidato",
  );
  // Logado: so os planos do tipo da conta. Visitante ainda pode alternar.
  const audience: AudienceType = isAuthenticated
    ? isCompanyAccount
      ? "empresa"
      : "candidato"
    : audienceChoice;
  const showAudienceToggle = !isAuthenticated;
  const plans = PLANS_BY_AUDIENCE[audience];

  const handlePlanClick = (plan: Plan) => {
    if (plan.ctaDisabled) {
      return;
    }

    // Planos pagos passam pelo checkout Asaas (prototipo: tela completa, cobranca bloqueada).
    if (plan.id === "pro" || plan.id === "enterprise") {
      const checkoutPath = `/checkout?plano=${encodeURIComponent(plan.id)}&tipo=${audience}`;
      if (!isAuthenticated) {
        const params = new URLSearchParams({
          tipo: audience,
          next: checkoutPath,
        });
        if (audience === "candidato") {
          params.set("mode", "register");
        }
        navigate(`/auth?${params.toString()}`);
        return;
      }
      navigate(checkoutPath);
    }
  };

  return (
    <div className="pp-root">
      <style>{style}</style>
      <SiteHeader activeItem="planos" onExploreClick={() => navigate("/")} />

      <section className="pp-hero">
        <h1>Eleve sua Inteligência de Mercado</h1>
        <p className="pp-lead">Escolha o nível de acesso ideal para suas análises. Sem contratos longos, cancele quando quiser.</p>

        {showAudienceToggle && (
          <div className="pp-type-toggle">
            <button
              type="button"
              className={`pp-type-btn${audience === "candidato" ? " active" : ""}`}
              onClick={() => setAudienceChoice("candidato")}
            >
              Sou Candidato
            </button>
            <button
              type="button"
              className={`pp-type-btn${audience === "empresa" ? " active" : ""}`}
              onClick={() => setAudienceChoice("empresa")}
            >
              Sou Empresa
            </button>
          </div>
        )}
        <p className="pp-message">Assinaturas pagas passam pelo checkout Asaas (prototipo).</p>
      </section>

      <section className={`pp-plans${plans.length === 2 ? " pp-plans-2" : ""}`}>
        {plans.map((plan) => (
          <div className={`pp-card${plan.featured ? " featured" : ""}`} key={`${audience}-${plan.id}`}>
            {plan.badge && <span className="pp-badge">{plan.badge}</span>}
            <div className="pp-name">{plan.name}</div>
            <div className="pp-price">
              {plan.price}
              {plan.period && <span>{plan.period}</span>}
            </div>
            <p className="pp-desc">{plan.description}</p>
            <ul className="pp-features">
              {plan.features.map((feature) => (
                <li key={feature}>
                  <span className="pp-check">
                    <CheckIcon />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className={plan.featured ? "pp-btn-primary" : "pp-btn-secondary"}
              disabled={plan.ctaDisabled}
              onClick={() => handlePlanClick(plan)}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </section>

      <div className="ws-ad-wrap ws-ad-wrap--footer" style={{ paddingBottom: "1.5rem" }}>
        <AdSlot
          placement="leaderboard"
          title="Propaganda aqui"
          hint="Faixa de patrocínio na página de planos"
        />
      </div>

      <SiteFooter />
    </div>
  );
}

const style = `
  .pp-root {
    font-family: 'Inter', sans-serif; color: #0f172a; background: #ffffff;
    min-height: 100vh; display: flex; flex-direction: column;
    max-width: 100%;
  }
  .pp-root *, .pp-root *::before, .pp-root *::after { box-sizing: border-box; }

  .pp-hero { text-align: center; padding: 3.5rem 1.5rem 0; }
  .pp-hero h1 {
    font-family: 'Sora', sans-serif; font-size: clamp(1.5rem, 5.5vw, 2.15rem);
    font-weight: 800; margin: 0 0 0.6rem; line-height: 1.25;
  }
  .pp-lead { color: #64748b; font-size: 0.875rem; max-width: 34rem; margin: 0 auto; line-height: 1.5; }
  .pp-message {
    margin: 0.85rem auto 0; max-width: 34rem;
    color: #94a3b8; font-size: 0.75rem; font-weight: 500; line-height: 1.45;
  }

  .pp-type-toggle { display: inline-flex; background: #f1f5f9; border-radius: var(--radius); padding: 4px; gap: 4px; margin-top: 1.1rem; }
  .pp-type-btn { padding: 0.5rem 1.15rem; border-radius: var(--radius); border: none; background: transparent; font-family: 'Inter', sans-serif; font-weight: 700; font-size: 0.8125rem; color: #64748b; cursor: pointer; transition: background 0.15s, color 0.15s; }
  .pp-type-btn.active { background: #fff; color: #2563eb; box-shadow: 0 2px 8px rgba(37,99,235,0.12); }

  .pp-plans {
    flex: 1; min-width: 0; width: 100%;
    display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
    gap: 1.25rem; max-width: 1080px; margin: 0 auto; padding: 1.5rem 1.5rem 3rem; align-items: start;
  }
  .pp-plans-2 { max-width: 680px; }

  .pp-card { position: relative; background: #fff; border: 1px solid #e2e8f0; border-radius: var(--radius); padding: 2rem 1.75rem; display: flex; flex-direction: column; }
  .pp-card.featured { border: 2px solid #2563eb; box-shadow: 0 16px 36px rgba(37, 99, 235, 0.16); }

  .pp-badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: #0f172a; color: #fff; border-radius: var(--radius); padding: 4px 14px; font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap; }

  .pp-name { font-weight: 700; font-size: 1.05rem; margin-bottom: 0.75rem; }
  .pp-price { font-family: 'Sora', sans-serif; font-size: 2.1rem; font-weight: 800; margin-bottom: 0.75rem; }
  .pp-price span { font-family: 'Inter', sans-serif; font-size: 0.9rem; font-weight: 500; color: #94a3b8; margin-left: 2px; }
  .pp-desc { color: #64748b; font-size: 0.85rem; line-height: 1.55; margin-bottom: 1.5rem; min-height: 3.1em; }

  .pp-features { list-style: none; display: flex; flex-direction: column; gap: 0.7rem; margin-bottom: 1.75rem; flex: 1; }
  .pp-features li { display: flex; align-items: flex-start; gap: 0.6rem; font-size: 0.87rem; color: #334155; }
  .pp-check { flex: 0 0 auto; width: 18px; height: 18px; border-radius: 50%; background: #eff6ff; color: #2563eb; display: inline-flex; align-items: center; justify-content: center; margin-top: 1px; }

  .pp-btn-primary, .pp-btn-secondary { width: 100%; border-radius: var(--radius); padding: 0.7rem 1rem; font-size: 0.9rem; font-weight: 700; cursor: pointer; }
  .pp-btn-primary { background: #2563eb; color: #fff; border: none; }
  .pp-btn-primary:hover { background: #1d4ed8; }
  .pp-btn-secondary { background: #fff; color: #0f172a; border: 1px solid #cbd5e1; }
  .pp-btn-secondary:hover:not(:disabled) { border-color: #2563eb; color: #2563eb; }
  .pp-btn-primary:disabled, .pp-btn-secondary:disabled { cursor: not-allowed; opacity: 0.65; }

  @media (max-width: 720px) {
    .pp-hero { padding: 2.25rem 1rem 0; }
    .pp-plans { grid-template-columns: 1fr; padding: 1.25rem 1rem 2.5rem; gap: 1rem; }
    .pp-card { padding: 1.5rem 1.15rem; }
    .pp-desc { min-height: 0; margin-bottom: 1.1rem; }
  }
`;
