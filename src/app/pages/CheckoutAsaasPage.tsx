import { FormEvent, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import { useAuth } from "../context/AuthContext";
import {
  createAsaasSubscription,
  planAmountCentsFromLabel,
  type AsaasAudience,
} from "../services/asaas";
import { INPUT_LIMITS, sanitizePlainText } from "../lib/input-security";
import { logAppError, toUserErrorMessage } from "../lib/user-error";

type CheckoutPlanOption = {
  id: string;
  name: string;
  price: string;
  period: string;
  audience: AsaasAudience;
};

const CHECKOUT_PLANS: CheckoutPlanOption[] = [
  { id: "pro", name: "Pro", price: "R$ 9", period: "/mês", audience: "candidato" },
  { id: "pro", name: "Pro", price: "R$ 199", period: "/mês", audience: "empresa" },
  { id: "enterprise", name: "Enterprise", price: "R$ 500", period: "/mês", audience: "empresa" },
];

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatCpfCnpj(value: string) {
  const digits = onlyDigits(value).slice(0, 14);
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return digits
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

function formatCardNumber(value: string) {
  return onlyDigits(value)
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ")
    .trim();
}

export function CheckoutAsaasPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const audience: AsaasAudience = searchParams.get("tipo") === "empresa" ? "empresa" : "candidato";
  const planId = (searchParams.get("plano") || "pro").toLowerCase();

  const plan = useMemo(() => {
    return (
      CHECKOUT_PLANS.find((item) => item.id === planId && item.audience === audience) ||
      CHECKOUT_PLANS.find((item) => item.audience === audience) ||
      CHECKOUT_PLANS[0]
    );
  }, [audience, planId]);

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [holderName, setHolderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    try {
      await createAsaasSubscription({
        plan: {
          id: plan.id,
          name: plan.name,
          priceLabel: plan.price,
          amountCents: planAmountCentsFromLabel(plan.price),
          audience: plan.audience,
        },
        customer: { name, email, cpfCnpj },
        card: {
          holderName,
          number: cardNumber,
          expiryMonth,
          expiryYear,
          cvv,
        },
      });
    } catch (error: unknown) {
      logAppError("falha no checkout Asaas");
      setFormError(toUserErrorMessage(error, "Nao foi possivel processar o pagamento agora."));
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <p className="as-eyebrow">Checkout Asaas</p>
            <h1>Assinar Worky {plan.name}</h1>
            <p className="as-sub">
              {audience === "empresa"
                ? "Pagamento mensal da assinatura empresa via Asaas."
                : "Pagamento mensal da assinatura candidato via Asaas."}
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
              <li>Gateway: Asaas (cartao de credito, cobranca recorrente).</li>
              <li>Ambiente atual: prototipo. A cobranca real ainda nao esta ligada.</li>
              <li>Ao confirmar, o sistema valida os campos e simula a chamada da API.</li>
            </ul>
          </section>

          <section className="as-card">
            <div className="as-card-head">
              <h2>Dados de pagamento</h2>
              <span className="as-asaas-badge">Powered by Asaas</span>
            </div>

            {formError && <div className="as-banner error">{formError}</div>}

            <form className="as-form" onSubmit={(event) => void submit(event)} noValidate>
              <fieldset>
                <legend>Pagador</legend>
                <label className="as-field">
                  <span>Nome completo *</span>
                  <input
                    value={name}
                    maxLength={INPUT_LIMITS.name}
                    onChange={(event) => setName(sanitizePlainText(event.target.value, INPUT_LIMITS.name))}
                    autoComplete="name"
                    placeholder="Nome do titular da cobranca"
                  />
                </label>
                <label className="as-field">
                  <span>E-mail *</span>
                  <input
                    type="email"
                    value={email}
                    maxLength={INPUT_LIMITS.email}
                    onChange={(event) => setEmail(event.target.value.trim().toLowerCase())}
                    autoComplete="email"
                    placeholder="voce@email.com"
                  />
                </label>
                <label className="as-field">
                  <span>CPF ou CNPJ *</span>
                  <input
                    value={cpfCnpj}
                    maxLength={INPUT_LIMITS.cpfCnpj}
                    onChange={(event) => setCpfCnpj(formatCpfCnpj(event.target.value))}
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                  />
                </label>
              </fieldset>

              <fieldset>
                <legend>Cartao de credito</legend>
                <label className="as-field">
                  <span>Nome impresso no cartao *</span>
                  <input
                    value={holderName}
                    maxLength={INPUT_LIMITS.name}
                    onChange={(event) => setHolderName(sanitizePlainText(event.target.value, INPUT_LIMITS.name))}
                    autoComplete="cc-name"
                    placeholder="Como esta no cartao"
                  />
                </label>
                <label className="as-field">
                  <span>Numero do cartao *</span>
                  <input
                    value={cardNumber}
                    maxLength={INPUT_LIMITS.cardNumber}
                    onChange={(event) => setCardNumber(formatCardNumber(event.target.value))}
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="0000 0000 0000 0000"
                  />
                </label>
                <div className="as-row">
                  <label className="as-field">
                    <span>Mes *</span>
                    <input
                      value={expiryMonth}
                      maxLength={2}
                      onChange={(event) => setExpiryMonth(onlyDigits(event.target.value).slice(0, 2))}
                      inputMode="numeric"
                      autoComplete="cc-exp-month"
                      placeholder="MM"
                    />
                  </label>
                  <label className="as-field">
                    <span>Ano *</span>
                    <input
                      value={expiryYear}
                      maxLength={4}
                      onChange={(event) => setExpiryYear(onlyDigits(event.target.value).slice(0, 4))}
                      inputMode="numeric"
                      autoComplete="cc-exp-year"
                      placeholder="AA"
                    />
                  </label>
                  <label className="as-field">
                    <span>CVV *</span>
                    <input
                      value={cvv}
                      maxLength={INPUT_LIMITS.cvv}
                      onChange={(event) => setCvv(onlyDigits(event.target.value).slice(0, 4))}
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      placeholder="123"
                    />
                  </label>
                </div>
              </fieldset>

              <button className="as-submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Processando no Asaas..." : `Confirmar assinatura ${plan.price}${plan.period}`}
              </button>
              <p className="as-fineprint">
                Nenhum valor sera cobrado neste prototipo. A integracao Asaas esta aplicada no fluxo;
                a chave de API / sandbox sera conectada em etapa posterior.
              </p>
            </form>
          </section>
        </div>
      </main>

      <SiteFooter copy="2026 Worky. Pagamentos via Asaas (prototipo)." />
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
    border-radius: 12px;
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
    border-radius: 14px;
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

  .as-asaas-badge {
    font-size: 0.68rem;
    font-weight: 700;
    color: #0f766e;
    background: #ccfbf1;
    border: 1px solid #99f6e4;
    border-radius: 999px;
    padding: 0.28rem 0.65rem;
    white-space: nowrap;
  }

  .as-banner.error {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #991b1b;
    border-radius: 10px;
    padding: 0.85rem 0.95rem;
    font-size: 0.86rem;
    line-height: 1.45;
    margin-bottom: 1rem;
  }

  .as-form {
    display: grid;
    gap: 1.1rem;
  }

  .as-form fieldset {
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    margin: 0;
    padding: 0.9rem 0.95rem 1rem;
    display: grid;
    gap: 0.75rem;
  }

  .as-form legend {
    padding: 0 0.35rem;
    font-size: 0.78rem;
    font-weight: 700;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .as-field {
    display: grid;
    gap: 0.35rem;
  }

  .as-field span {
    font-size: 0.8rem;
    font-weight: 600;
    color: #334155;
  }

  .as-field input {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 0.7rem 0.8rem;
    font: inherit;
    font-size: 0.92rem;
    background: #fff;
  }

  .as-field input:focus {
    outline: 2px solid rgba(37, 99, 235, 0.25);
    border-color: #2563eb;
  }

  .as-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 0.75rem;
  }

  .as-submit {
    width: 100%;
    border: 0;
    border-radius: 999px;
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
    margin: 0;
    color: #94a3b8;
    font-size: 0.78rem;
    line-height: 1.45;
    text-align: center;
  }

  @media (max-width: 840px) {
    .as-grid {
      grid-template-columns: 1fr;
    }
    .as-row {
      grid-template-columns: 1fr 1fr 1fr;
    }
  }

  @media (max-width: 480px) {
    .as-row {
      grid-template-columns: 1fr;
    }
    .as-card-head {
      flex-direction: column;
      align-items: flex-start;
    }
  }
`;
