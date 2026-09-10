import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { AdSlot, SponsorMarquee } from "../components/AdSlot";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import { useAuth } from "../context/AuthContext";
import { fetchCompanyProfile, updateCompanyPlan, type CompanyPlan } from "../services/company";

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
  const { user, session, isAuthenticated } = useAuth();
  const [audience, setAudience] = useState<AudienceType>(
    searchParams.get("tipo") === "empresa" ? "empresa" : "candidato",
  );
  const [busyPlanId, setBusyPlanId] = useState<string | null>(null);
  const [planMessage, setPlanMessage] = useState("");
  const plans = PLANS_BY_AUDIENCE[audience];

  const handlePlanClick = async (plan: Plan) => {
    if (plan.ctaDisabled) {
      return;
    }

    if (audience !== "empresa") {
      navigate(isAuthenticated ? "/" : "/auth?mode=register");
      return;
    }

    if (!isAuthenticated || !session?.accessToken || !user?.id) {
      navigate("/empresa");
      return;
    }

    if (plan.id !== "pro" && plan.id !== "enterprise") {
      return;
    }

    setBusyPlanId(plan.id);
    setPlanMessage("");
    try {
      const profile = await fetchCompanyProfile(session.accessToken, user.id);
      if (!profile) {
        throw new Error("Conta empresa nao encontrada. Cadastre-se como Empresa primeiro.");
      }
      await updateCompanyPlan(session.accessToken, user.id, plan.id as CompanyPlan);
      setPlanMessage(`Plano ${plan.name} ativado. Candidatos desbloqueados no painel.`);
      navigate("/empresa");
    } catch (error: unknown) {
      setPlanMessage(error instanceof Error ? error.message : "Nao foi possivel atualizar o plano.");
    } finally {
      setBusyPlanId(null);
    }
  };

  return (
    <div className="pp-root">
      <style>{style}</style>
      <SponsorMarquee />
      <SiteHeader activeItem="planos" onExploreClick={() => navigate("/")} />

      <section className="pp-hero">
        <h1>Eleve sua Inteligência de Mercado</h1>
        <p>Escolha o nível de acesso ideal para suas análises. Sem contratos longos, cancele quando quiser.</p>

        <div className="pp-type-toggle">
          <button
            type="button"
            className={`pp-type-btn${audience === "candidato" ? " active" : ""}`}
            onClick={() => setAudience("candidato")}
          >
            Sou Candidato
          </button>
          <button
            type="button"
            className={`pp-type-btn${audience === "empresa" ? " active" : ""}`}
            onClick={() => setAudience("empresa")}
          >
            Sou Empresa
          </button>
        </div>
        {planMessage && <p className="pp-message">{planMessage}</p>}
      </section>

      <section className={`pp-plans${plans.length === 2 ? " pp-plans-2" : ""}`}>
        {plans.map((plan) => (
          <div className={`pp-card${plan.featured ? " featured" : ""}`} key={plan.id}>
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
              disabled={plan.ctaDisabled || busyPlanId === plan.id}
              onClick={() => void handlePlanClick(plan)}
            >
              {busyPlanId === plan.id ? "Ativando..." : plan.cta}
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

      <SiteFooter copy="2026 Worky. Inteligência de Mercado." />
    </div>
  );
}

const style = `
  .pp-root { font-family: 'Inter', sans-serif; color: #0f172a; background: #ffffff; min-height: 100vh; display: flex; flex-direction: column; }

  .pp-hero { text-align: center; padding: 4rem 1.5rem 1rem; }
  .pp-hero h1 { font-family: 'Sora', sans-serif; font-size: clamp(2rem, 5vw, 2.75rem); font-weight: 800; margin-bottom: 0.9rem; line-height: 1.2; }
  .pp-hero p { color: #64748b; font-size: 1rem; max-width: 560px; margin: 0 auto; line-height: 1.6; }
  .pp-message { margin-top: 1rem; color: #1d4ed8; font-size: 0.9rem; font-weight: 600; }

  .pp-type-toggle { display: inline-flex; background: #f1f5f9; border-radius: 12px; padding: 4px; gap: 4px; margin-top: 2rem; }
  .pp-type-btn { padding: 0.55rem 1.5rem; border-radius: 9px; border: none; background: transparent; font-family: 'Inter', sans-serif; font-weight: 700; font-size: 0.85rem; color: #64748b; cursor: pointer; transition: background 0.15s, color 0.15s; }
  .pp-type-btn.active { background: #fff; color: #2563eb; box-shadow: 0 2px 8px rgba(37,99,235,0.12); }

  .pp-plans { flex: 1; min-width: 0; width: 100%; box-sizing: border-box; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.5rem; max-width: 1080px; margin: 0 auto; padding: 3rem 1.5rem 4rem; align-items: start; }
  .pp-plans-2 { max-width: 680px; }

  .pp-card { position: relative; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 2rem 1.75rem; display: flex; flex-direction: column; }
  .pp-card.featured { border: 2px solid #2563eb; box-shadow: 0 16px 36px rgba(37, 99, 235, 0.16); }

  .pp-badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: #0f172a; color: #fff; border-radius: 999px; padding: 4px 14px; font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap; }

  .pp-name { font-weight: 700; font-size: 1.05rem; margin-bottom: 0.75rem; }
  .pp-price { font-family: 'Sora', sans-serif; font-size: 2.1rem; font-weight: 800; margin-bottom: 0.75rem; }
  .pp-price span { font-family: 'Inter', sans-serif; font-size: 0.9rem; font-weight: 500; color: #94a3b8; margin-left: 2px; }
  .pp-desc { color: #64748b; font-size: 0.85rem; line-height: 1.55; margin-bottom: 1.5rem; min-height: 3.1em; }

  .pp-features { list-style: none; display: flex; flex-direction: column; gap: 0.7rem; margin-bottom: 1.75rem; flex: 1; }
  .pp-features li { display: flex; align-items: flex-start; gap: 0.6rem; font-size: 0.87rem; color: #334155; }
  .pp-check { flex: 0 0 auto; width: 18px; height: 18px; border-radius: 50%; background: #eff6ff; color: #2563eb; display: inline-flex; align-items: center; justify-content: center; margin-top: 1px; }

  .pp-btn-primary, .pp-btn-secondary { width: 100%; border-radius: 999px; padding: 0.7rem 1rem; font-size: 0.9rem; font-weight: 700; cursor: pointer; }
  .pp-btn-primary { background: #2563eb; color: #fff; border: none; }
  .pp-btn-primary:hover { background: #1d4ed8; }
  .pp-btn-secondary { background: #fff; color: #0f172a; border: 1px solid #cbd5e1; }
  .pp-btn-secondary:hover:not(:disabled) { border-color: #2563eb; color: #2563eb; }
  .pp-btn-primary:disabled, .pp-btn-secondary:disabled { cursor: not-allowed; opacity: 0.65; }
`;
