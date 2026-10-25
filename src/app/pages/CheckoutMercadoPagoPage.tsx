import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import { useAuth } from "../context/AuthContext";
import { createMercadoPagoPreference, type MercadoPagoAudience } from "../services/mercadopago";
import { logAppError, toUserErrorMessage } from "../lib/user-error";

type CheckoutPlanOption = {
  id: string;
  name: string;
  price: string;
  period: string;
  audience: MercadoPagoAudience;
};

const CHECKOUT_PLANS: CheckoutPlanOption[] = [
  { id: "pro", name: "Pro", price: "R$ 9", period: "/mês", audience: "candidato" },
  { id: "pro", name: "Pro", price: "R$ 199", period: "/mês", audience: "empresa" },
  { id: "enterprise", name: "Enterprise", price: "R$ 500", period: "/mês", audience: "empresa" },
];

export function CheckoutMercadoPagoPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  const audience: MercadoPagoAudience = searchParams.get("tipo") === "empresa" ? "empresa" : "candidato";
  const planId = (searchParams.get("plano") || "pro").toLowerCase();
  const status = (searchParams.get("status") || "").toLowerCase();

  const plan = useMemo(() => {
    return (
      CHECKOUT_PLANS.find((item) => item.id === planId && item.audience === audience) ||
      CHECKOUT_PLANS.find((item) => item.audience === audience) ||
      CHECKOUT_PLANS[0]
    );
  }, [audience, planId]);

  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pay = async () => {
    setFormError("");
    if (!isAuthenticated) {
      const next = `/checkout?plano=${encodeURIComponent(plan.id)}&tipo=${audience}`;
      navigate(`/auth?tipo=${audience}&next=${encodeURIComponent(next)}`);
      return;
    }
    setIsSubmitting(true);
    try {
      const preference = await createMercadoPagoPreference(plan.id, audience);
      window.location.assign(preference.checkoutUrl);
    } catch (error: unknown) {
      logAppError("falha no checkout Mercado Pago");
      setFormError(toUserErrorMessage(error, "Não foi possível abrir o Mercado Pago agora."));
      setIsSubmitting(false);
    }
  };

  const statusMessage =
    status === "approved"
      ? "Pagamento aprovado pelo Mercado Pago."
      : status === "failure"
        ? "O Mercado Pago não concluiu o pagamento."
        : status === "pending"
          ? "Pagamento pendente no Mercado Pago."
          : "";

  return (
    <div className="as-root">
      <style>{style}</style>
      <SiteHeader activeItem="planos" onExploreClick={() => navigate("/")} />

      <main className="as-main">
        <button type="button" className="as-back" onClick={() => navigate(`/planos?tipo=${audience}`)}>
          <ArrowLeft size={16} strokeWidth={2.2} aria-hidden="true" />
          Voltar aos planos
        </button>

        <div className="as-grid">
          <section className="as-summary">
            <p className="as-eyebrow">Checkout Mercado Pago</p>
            <h1>Assinar Worky {plan.name}</h1>
            <p className="as-sub">
              O pagamento abre no Checkout Pro do Mercado Pago. Cartão e Pix ficam lá, não no Worky.
            </p>

            <div className="as-plan-box">
              <div>
                <strong>{plan.name}</strong>
                <span>{audience === "empresa" ? "Empresa" : "Candidato"}</span>
              </div>
              <div className="as-plan-price">
                {plan.price}
                <small>{plan.period}</small>
              </div>
            </div>

            <ul className="as-notes">
              <li>Gateway: Mercado Pago Checkout Pro.</li>
              <li>Nenhum dado de cartão passa pelo código do Worky.</li>
            </ul>
          </section>

          <section className="as-card">
            <div className="as-card-head">
              <h2>Pagar no Mercado Pago</h2>
              <span className="as-mp-badge">Powered by Mercado Pago</span>
            </div>

            <div className="as-banner warn" role="status">
              Worky está em beta. Não efetue pagamento real. Esta cobrança é só demonstração em ambiente de teste
              do Mercado Pago: nenhum valor é debitado da sua conta.
            </div>

            {statusMessage && (
              <div className={`as-banner${status === "approved" ? " ok" : " error"}`}>{statusMessage}</div>
            )}
            {formError && <div className="as-banner error">{formError}</div>}

            {status !== "approved" && (
              <>
                <button className="as-submit" type="button" disabled={isSubmitting} onClick={() => void pay()}>
                  {isSubmitting ? "Abrindo Mercado Pago..." : `Pagar ${plan.price}${plan.period} no Mercado Pago`}
                </button>
                <p className="as-fineprint">
                  Você vai para o checkout oficial de teste. Não use cartão pessoal. Depois, o Mercado Pago pode devolver para esta página.
                </p>
              </>
            )}
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

const style = `
  .as-root {
    font-family: 'Inter', sans-serif;
    color: #0f172a;
    background: #f8fafc;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .as-main {
    width: 100%;
    max-width: 980px;
    margin: 0 auto;
    padding: 1.5rem 1.25rem 3rem;
    box-sizing: border-box;
    flex: 1;
  }

  .as-back {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    border: 0;
    background: transparent;
    color: #2563eb;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    padding: 0;
    margin-bottom: 1.25rem;
  }

  .as-grid {
    display: grid;
    grid-template-columns: 1fr 1.15fr;
    gap: 1.5rem;
    align-items: start;
  }

  .as-summary h1 {
    font-family: 'Sora', sans-serif;
    font-size: clamp(1.6rem, 3vw, 2rem);
    font-weight: 800;
    margin: 0.35rem 0 0.6rem;
  }

  .as-eyebrow {
    margin: 0;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #2563eb;
  }

  .as-sub {
    margin: 0 0 1.25rem;
    color: #64748b;
    line-height: 1.55;
    font-size: 0.95rem;
  }

  .as-plan-box {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: var(--radius);
    padding: 1rem 1.1rem;
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: center;
    margin-bottom: 1rem;
  }

  .as-plan-box strong {
    display: block;
    font-size: 1.05rem;
  }

  .as-plan-box span {
    color: #64748b;
    font-size: 0.82rem;
  }

  .as-plan-price {
    font-family: 'Sora', sans-serif;
    font-weight: 800;
    font-size: 1.35rem;
    white-space: nowrap;
  }

  .as-plan-price small {
    font-family: 'Inter', sans-serif;
    font-size: 0.8rem;
    font-weight: 500;
    color: #94a3b8;
    margin-left: 2px;
  }

  .as-notes {
    margin: 0;
    padding-left: 1.1rem;
    color: #475569;
    font-size: 0.85rem;
    line-height: 1.55;
    display: grid;
    gap: 0.35rem;
  }

  .as-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: var(--radius);
    padding: 1.35rem 1.35rem 1.5rem;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);
  }

  .as-card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .as-card-head h2 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
  }

  .as-mp-badge {
    font-size: 0.68rem;
    font-weight: 700;
    color: #0f766e;
    background: #ccfbf1;
    border: 1px solid #99f6e4;
    border-radius: var(--radius);
    padding: 0.28rem 0.65rem;
    white-space: nowrap;
  }

  .as-banner.warn {
    background: #fffbeb;
    border: 1px solid #fcd34d;
    color: #92400e;
    border-radius: var(--radius);
    padding: 0.85rem 0.95rem;
    font-size: 0.86rem;
    line-height: 1.45;
    margin-bottom: 1rem;
  }

  .as-banner.error {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #991b1b;
    border-radius: var(--radius);
    padding: 0.85rem 0.95rem;
    font-size: 0.86rem;
    line-height: 1.45;
    margin-bottom: 1rem;
  }

  .as-banner.ok {
    background: #ecfdf5;
    border: 1px solid #a7f3d0;
    color: #065f46;
    border-radius: var(--radius);
    padding: 0.85rem 0.95rem;
    font-size: 0.86rem;
    line-height: 1.45;
    margin-bottom: 1rem;
  }

  .as-submit {
    width: 100%;
    border: 0;
    border-radius: var(--radius);
    background: #2563eb;
    color: #fff;
    font-weight: 700;
    font-size: 0.95rem;
    padding: 0.85rem 1rem;
    cursor: pointer;
  }

  .as-submit:hover:not(:disabled) {
    background: #1d4ed8;
  }

  .as-submit:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .as-fineprint {
    margin: 0.85rem 0 0;
    color: #94a3b8;
    font-size: 0.78rem;
    line-height: 1.45;
    text-align: center;
  }

  @media (max-width: 840px) {
    .as-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 480px) {
    .as-card-head {
      flex-direction: column;
      align-items: flex-start;
    }
  }
`;
