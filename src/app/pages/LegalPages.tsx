import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router";
import {
  CheckCircle2,
  Clock,
  FileText,
  LifeBuoy,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
  TicketCheck,
  type LucideIcon,
} from "lucide-react";
import { emailErrorMessage } from "../lib/br-docs";

type DocumentSection = {
  title: string;
  body: string[];
};

type LegalDocument = {
  title: string;
  subtitle: string;
  updatedAt: string;
  icon: LucideIcon;
  sections: DocumentSection[];
};

type ContactItem = {
  icon: LucideIcon;
  label: string;
  value: string;
  helper: string;
};

const privacyDocument: LegalDocument = {
  title: "Política de Privacidade",
  subtitle: "Como a Worky pode tratar dados pessoais dentro da plataforma.",
  updatedAt: "10 de setembro de 2026",
  icon: ShieldCheck,
  sections: [
    {
      title: "Visão geral",
      body: [
        "A Worky é uma plataforma de inteligência de mercado de trabalho criada para apoiar pesquisas de carreira, análise de competências, oportunidades e recomendações profissionais.",
        "Esta Política descreve, de forma base, quais dados podem ser coletados, como podem ser usados e quais direitos o usuário pode exercer.",
      ],
    },
    {
      title: "Dados que podemos coletar",
      body: [
        "Podemos coletar dados cadastrais, como nome, e-mail, cidade, estado e informações de autenticação necessárias para acesso à conta.",
        "Também podemos tratar informações profissionais fornecidas pelo próprio usuário, incluindo objetivo de carreira, experiências, formação, certificações e competências.",
        "Dados técnicos e de uso, como páginas acessadas, termos pesquisados, preferências, registros de erro e informações do dispositivo, podem ser usados para segurança e melhoria da plataforma.",
      ],
    },
    {
      title: "Como usamos os dados",
      body: [
        "Usamos os dados para operar a plataforma, autenticar usuários, personalizar recomendações, gerar análises de carreira, melhorar a experiência e prevenir uso indevido.",
        "Também podemos usar dados agregados ou anonimizados para entender tendências, desempenho de recursos e qualidade das recomendações.",
      ],
    },
    {
      title: "Compartilhamento",
      body: [
        "Podemos compartilhar dados com provedores técnicos essenciais para hospedagem, autenticação, banco de dados, análise, suporte e segurança.",
        "Não vendemos dados pessoais. Qualquer compartilhamento adicional será informado nesta Política quando aplicável.",
      ],
    },
    {
      title: "Bases legais e LGPD",
      body: [
        "O tratamento pode ocorrer com base no consentimento, execução de contrato, legítimo interesse, cumprimento de obrigação legal ou exercício regular de direitos, conforme aplicável.",
        "O usuário pode solicitar confirmação de tratamento, acesso, correção, exclusão, portabilidade, oposição e revogação de consentimento pelos canais de contato indicados.",
      ],
    },
    {
      title: "Retenção e segurança",
      body: [
        "Mantemos dados pelo tempo necessário para cumprir as finalidades descritas, obrigações legais e prevenção de fraudes ou disputas.",
        "Aplicamos medidas administrativas, técnicas e organizacionais para proteger as informações, mas nenhum ambiente digital é totalmente livre de riscos.",
      ],
    },
    {
      title: "Cookies e registros",
      body: [
        "Podemos usar cookies, armazenamento local e tecnologias semelhantes para manter sessão, lembrar preferências, medir uso e proteger a conta.",
        "O usuário pode ajustar preferências no navegador, ciente de que algumas funcionalidades podem ser afetadas.",
      ],
    },
    {
      title: "Canal de privacidade",
      body: [
        "Para solicitações relacionadas a dados pessoais, entre em contato pelo e-mail privacidade@worky.app ou pelo formulário da área Contato.",
      ],
    },
  ],
};

const termsDocument: LegalDocument = {
  title: "Termos de Uso",
  subtitle: "Regras para acesso, uso da plataforma e responsabilidades entre a Worky e seus usuários.",
  updatedAt: "10 de setembro de 2026",
  icon: FileText,
  sections: [
    {
      title: "Aceite dos termos",
      body: [
        "Ao acessar ou usar a Worky, o usuário declara que leu, compreendeu e concorda com estes Termos de Uso.",
        "Caso não concorde com alguma condição, o usuário deve interromper o uso da plataforma.",
      ],
    },
    {
      title: "Objetivo da plataforma",
      body: [
        "A Worky oferece recursos para pesquisa de carreiras, análise de mercado, recomendações de competências, cursos e oportunidades profissionais.",
        "As informações exibidas têm finalidade informativa e de apoio à decisão, não substituindo orientação profissional, jurídica, financeira ou educacional individualizada.",
      ],
    },
    {
      title: "Conta e cadastro",
      body: [
        "O usuário é responsável por fornecer informações corretas, manter suas credenciais protegidas e comunicar qualquer uso não autorizado da conta.",
        "A Worky pode suspender ou limitar contas em caso de uso indevido, fraude, violação destes termos ou risco à segurança da plataforma.",
      ],
    },
    {
      title: "Recomendações e inteligência artificial",
      body: [
        "As análises geradas por IA podem conter estimativas, simplificações ou informações incompletas, especialmente quando dependem de fontes externas ou dados informados pelo usuário.",
        "O usuário deve avaliar criticamente resultados, vagas, salários, cursos e sugestões antes de tomar decisões.",
      ],
    },
    {
      title: "Links e serviços externos",
      body: [
        "A plataforma pode direcionar o usuário para sites de vagas, cursos ou outros serviços de terceiros.",
        "A Worky não controla esses ambientes externos e não se responsabiliza por políticas, conteúdos, preços, disponibilidade ou processos conduzidos por terceiros.",
      ],
    },
    {
      title: "Condutas proibidas",
      body: [
        "É proibido tentar invadir sistemas, automatizar acessos abusivos, copiar dados em massa sem autorização, inserir conteúdo ilegal ou usar a plataforma para fins fraudulentos.",
        "Também é proibido violar direitos de propriedade intelectual, privacidade de terceiros ou qualquer legislação aplicável.",
      ],
    },
    {
      title: "Propriedade intelectual",
      body: [
        "Marcas, layout, textos, componentes, código, banco de dados, relatórios e elementos visuais da Worky pertencem aos respectivos titulares.",
        "O uso da plataforma não concede licença para copiar, modificar, vender ou distribuir esses materiais sem autorização prévia.",
      ],
    },
    {
      title: "Limitação de responsabilidade",
      body: [
        "A Worky não garante contratação, aprovação em processos seletivos, aumento salarial, disponibilidade contínua de vagas ou exatidão absoluta de dados de mercado.",
        "A plataforma será oferecida conforme disponibilidade técnica, podendo passar por manutenções, instabilidades ou mudanças de funcionalidade.",
      ],
    },
    {
      title: "Alterações dos termos",
      body: [
        "Estes Termos podem ser atualizados para refletir mudanças de produto, operação, legislação ou segurança.",
        "A versão mais recente permanece publicada nesta página, com a data de atualização indicada no topo.",
      ],
    },
    {
      title: "Contato",
      body: [
        "Dúvidas sobre estes Termos podem ser enviadas para juridico@worky.app ou pela página Contato.",
      ],
    },
  ],
};

const contactItems: ContactItem[] = [
  {
    icon: Mail,
    label: "E-mail geral",
    value: "contato@worky.app",
    helper: "Assuntos comerciais, parcerias e dúvidas institucionais.",
  },
  {
    icon: Phone,
    label: "Telefone",
    value: "+55 (11) 4000-0000",
    helper: "Atendimento de segunda a sexta, das 9h às 18h (horário de Brasília).",
  },
  {
    icon: MapPin,
    label: "Endereço",
    value: "São Paulo, SP - Brasil",
    helper: "Atendimento remoto com base operacional em São Paulo.",
  },
];

const supportItems: ContactItem[] = [
  {
    icon: Mail,
    label: "Suporte por e-mail",
    value: "suporte@worky.app",
    helper: "Problemas de acesso, perfil, buscas e relatórios.",
  },
  {
    icon: MessageCircle,
    label: "Central de ajuda",
    value: "worky.app/institucional/suporte",
    helper: "Abra um chamado pela própria página de suporte.",
  },
  {
    icon: Clock,
    label: "Prazo de resposta",
    value: "Até 2 dias úteis",
    helper: "Meta de primeira resposta em dias úteis.",
  },
];

const supportTopics = [
  "Acesso à conta",
  "Perfil profissional",
  "Relatórios de carreira",
  "Vagas e links externos",
  "Privacidade e dados",
  "Erro técnico",
];

function ContentShell({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{contentCss}</style>
      <div className="il-root">{children}</div>
    </>
  );
}

function DocumentPage({ document }: { document: LegalDocument }) {
  const navigate = useNavigate();
  const Icon = document.icon;

  return (
    <ContentShell>
      <section className="il-panel il-intro">
        <div className="il-intro-top">
          <span className="il-badge">
            <Icon size={14} />
            Documento base
          </span>
          <span className="il-updated">Atualizado em {document.updatedAt}</span>
        </div>
        <h2>{document.title}</h2>
        <p>{document.subtitle}</p>
      </section>

      <nav className="il-toc" aria-label={`Seções de ${document.title}`}>
        {document.sections.map((section, index) => (
          <a key={section.title} href={`#section-${index + 1}`}>
            {index + 1}. {section.title}
          </a>
        ))}
      </nav>

      <article className="il-document">
        {document.sections.map((section, index) => (
          <section className="il-section" id={`section-${index + 1}`} key={section.title}>
            <h3>
              <span>{index + 1}</span>
              {section.title}
            </h3>
            {section.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}
      </article>

      <div className="il-actions">
        <button type="button" className="il-btn-primary" onClick={() => navigate("/institucional/contato")}>
          Falar com contato
        </button>
        <button type="button" className="il-btn-secondary" onClick={() => navigate("/institucional/suporte")}>
          Abrir suporte
        </button>
      </div>
    </ContentShell>
  );
}

function InfoCards({ items }: { items: ContactItem[] }) {
  return (
    <div className="il-info-grid">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <section className="il-info-card" key={item.label}>
            <div className="il-info-icon">
              <Icon size={18} />
            </div>
            <div className="il-info-label">{item.label}</div>
            <div className="il-info-value">{item.value}</div>
            <p>{item.helper}</p>
          </section>
        );
      })}
    </div>
  );
}

export function PrivacyPage() {
  return <DocumentPage document={privacyDocument} />;
}

export function TermsPage() {
  return <DocumentPage document={termsDocument} />;
}

export function ContactPage() {
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; subject?: string; message?: string }>({});

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (!name.trim() || name.trim().length < 3) {
      nextErrors.name = "Informe seu nome (minimo 3 caracteres).";
    }
    const mailError = emailErrorMessage(email);
    if (mailError) {
      nextErrors.email = mailError;
    }
    if (!subject.trim() || subject.trim().length < 3) {
      nextErrors.subject = "Informe o assunto.";
    }
    if (!message.trim() || message.trim().length < 10) {
      nextErrors.message = "Escreva uma mensagem com pelo menos 10 caracteres.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setSent(false);
      return;
    }
    setSent(true);
  };

  return (
    <ContentShell>
      <section className="il-panel il-intro">
        <div className="il-intro-top">
          <span className="il-badge">
            <Mail size={14} />
            Contato
          </span>
        </div>
        <h2>Fale com a Worky</h2>
        <p>Canais para assuntos comerciais, institucionais e parcerias.</p>
      </section>

      <InfoCards items={contactItems} />

      <div className="il-form-layout">
        <section className="il-panel">
          <h3 className="il-panel-title">Enviar mensagem</h3>
          <p className="il-panel-text">
            Preencha o formulário e nossa equipe retorna pelo e-mail informado.
          </p>
          <form className="il-form" onSubmit={handleSubmit} noValidate>
            <div className="il-field">
              <label htmlFor="contact-name">Nome *</label>
              <input
                id="contact-name"
                placeholder="Seu nome"
                value={name}
                onChange={(event) => setName(event.target.value)}
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name && <div className="il-field-error">{errors.name}</div>}
            </div>
            <div className="il-field">
              <label htmlFor="contact-email">E-mail *</label>
              <input
                id="contact-email"
                type="email"
                placeholder="voce@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email && <div className="il-field-error">{errors.email}</div>}
            </div>
            <div className="il-field">
              <label htmlFor="contact-subject">Assunto *</label>
              <input
                id="contact-subject"
                placeholder="Como podemos ajudar?"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                aria-invalid={Boolean(errors.subject)}
              />
              {errors.subject && <div className="il-field-error">{errors.subject}</div>}
            </div>
            <div className="il-field">
              <label htmlFor="contact-message">Mensagem *</label>
              <textarea
                id="contact-message"
                placeholder="Escreva sua mensagem..."
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                aria-invalid={Boolean(errors.message)}
              />
              {errors.message && <div className="il-field-error">{errors.message}</div>}
            </div>
            {sent && (
              <div className="il-success" role="status">
                <CheckCircle2 size={16} />
                Mensagem registrada. Em breve entraremos em contato.
              </div>
            )}
            <button type="submit" className="il-btn-primary">
              <Send size={15} />
              Enviar mensagem
            </button>
          </form>
        </section>

        <aside className="il-panel">
          <h3 className="il-panel-title">Sobre o atendimento</h3>
          <p className="il-panel-text">
            Worky
            <br />
            Base operacional: São Paulo, SP
            <br />
            Atendimento: segunda a sexta, das 9h às 18h.
          </p>
          <div className="il-note">
            <strong>Privacidade:</strong> não compartilhe senhas ou dados sensíveis de terceiros neste formulário.
          </div>
        </aside>
      </div>
    </ContentShell>
  );
}

export function SupportPage() {
  const [ticket, setTicket] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<{ email?: string; topic?: string; description?: string }>({});
  const ticketNumber = useMemo(() => `WKY-${new Date().getFullYear()}-0426`, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    const mailError = emailErrorMessage(email);
    if (mailError) {
      nextErrors.email = mailError;
    }
    if (!topic) {
      nextErrors.topic = "Selecione o tipo de solicitacao.";
    }
    if (!description.trim() || description.trim().length < 10) {
      nextErrors.description = "Descreva o problema com pelo menos 10 caracteres.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setTicket("");
      return;
    }
    setTicket(ticketNumber);
  };

  return (
    <ContentShell>
      <section className="il-panel il-intro">
        <div className="il-intro-top">
          <span className="il-badge">
            <LifeBuoy size={14} />
            Suporte
          </span>
        </div>
        <h2>Central de Suporte</h2>
        <p>Abra um chamado ou use os canais abaixo para tirar dúvidas sobre a plataforma.</p>
      </section>

      <InfoCards items={supportItems} />

      <div className="il-form-layout">
        <section className="il-panel">
          <h3 className="il-panel-title">Abrir chamado</h3>
          <p className="il-panel-text">
            Descreva o problema com o máximo de detalhes. Você recebe um protocolo de acompanhamento.
          </p>
          <form className="il-form" onSubmit={handleSubmit} noValidate>
            <div className="il-field">
              <label htmlFor="support-email">E-mail da conta *</label>
              <input
                id="support-email"
                type="email"
                placeholder="voce@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email && <div className="il-field-error">{errors.email}</div>}
            </div>
            <div className="il-field">
              <label htmlFor="support-topic">Tipo de solicitação *</label>
              <select
                id="support-topic"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                aria-invalid={Boolean(errors.topic)}
              >
                <option value="" disabled>Selecione um assunto</option>
                {supportTopics.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              {errors.topic && <div className="il-field-error">{errors.topic}</div>}
            </div>
            <div className="il-field">
              <label htmlFor="support-description">Descrição *</label>
              <textarea
                id="support-description"
                placeholder="Descreva o que aconteceu..."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                aria-invalid={Boolean(errors.description)}
              />
              {errors.description && <div className="il-field-error">{errors.description}</div>}
            </div>
            {ticket && (
              <div className="il-success" role="status">
                <TicketCheck size={16} />
                Chamado criado com protocolo {ticket}.
              </div>
            )}
            <button type="submit" className="il-btn-primary">
              <LifeBuoy size={15} />
              Abrir chamado
            </button>
          </form>
        </section>

        <aside className="il-panel">
          <h3 className="il-panel-title">Assuntos comuns</h3>
          <p className="il-panel-text">Use estes tópicos para agilizar o atendimento.</p>
          <div className="il-topic-list">
            {supportTopics.map((item) => (
              <div className="il-topic" key={item}>
                {item}
                <CheckCircle2 size={15} color="#0d9488" />
              </div>
            ))}
          </div>
        </aside>
      </div>
    </ContentShell>
  );
}

const contentCss = `
  .il-root { display: grid; gap: 1rem; }

  .il-panel {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.04);
    padding: 1.35rem 1.3rem;
  }

  .il-intro-top {
    display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap;
    margin-bottom: 0.85rem;
  }

  .il-badge {
    display: inline-flex; align-items: center; gap: 0.4rem;
    padding: 0.3rem 0.7rem; border-radius: 999px;
    background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8;
    font-size: 0.7rem; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;
  }

  .il-updated { color: #94a3b8; font-size: 0.78rem; font-weight: 600; }

  .il-intro h2 {
    margin: 0 0 0.45rem;
    font-family: 'Sora', sans-serif;
    font-size: clamp(1.25rem, 2.5vw, 1.6rem);
    font-weight: 800;
    color: #0f172a;
  }

  .il-intro p { margin: 0; color: #64748b; line-height: 1.6; font-size: 0.94rem; }

  .il-toc {
    display: flex; flex-wrap: wrap; gap: 0.45rem;
  }

  .il-toc a {
    text-decoration: none;
    background: #fff;
    border: 1px solid #e2e8f0;
    color: #475569;
    border-radius: 999px;
    padding: 0.4rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 650;
  }

  .il-toc a:hover {
    border-color: #bfdbfe;
    background: #eff6ff;
    color: #1d4ed8;
  }

  .il-document {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    overflow: hidden;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.04);
  }

  .il-section {
    padding: 1.25rem 1.35rem;
  }

  .il-section + .il-section {
    border-top: 1px solid #edf2f7;
  }

  .il-section h3 {
    margin: 0 0 0.7rem;
    display: flex;
    align-items: center;
    gap: 0.55rem;
    font-family: 'Sora', sans-serif;
    font-size: 1rem;
    font-weight: 750;
  }

  .il-section h3 span {
    width: 24px; height: 24px; border-radius: 8px;
    display: inline-flex; align-items: center; justify-content: center;
    background: #eff6ff; color: #1d4ed8; font-size: 0.72rem; font-weight: 800;
  }

  .il-section p {
    margin: 0;
    color: #475569;
    font-size: 0.9rem;
    line-height: 1.7;
  }

  .il-section p + p { margin-top: 0.65rem; }

  .il-actions { display: flex; flex-wrap: wrap; gap: 0.65rem; }

  .il-btn-primary, .il-btn-secondary {
    display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem;
    border-radius: 999px; padding: 0.65rem 1.1rem; font-size: 0.86rem; font-weight: 700; cursor: pointer;
  }

  .il-btn-primary { background: #2563eb; color: #fff; border: 0; }
  .il-btn-primary:hover { background: #1d4ed8; }
  .il-btn-secondary { background: #fff; color: #334155; border: 1px solid #cbd5e1; }
  .il-btn-secondary:hover { border-color: #2563eb; color: #2563eb; }

  .il-info-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.85rem;
  }

  .il-info-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 1.1rem;
    box-shadow: 0 8px 22px rgba(15, 23, 42, 0.04);
  }

  .il-info-icon {
    width: 36px; height: 36px; border-radius: 10px;
    display: inline-flex; align-items: center; justify-content: center;
    background: #eff6ff; color: #2563eb; margin-bottom: 0.7rem;
  }

  .il-info-label { font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em; }
  .il-info-value { margin-top: 0.25rem; font-weight: 750; font-size: 0.95rem; color: #0f172a; }
  .il-info-card p { margin: 0.45rem 0 0; color: #64748b; font-size: 0.8rem; line-height: 1.45; }

  .il-form-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(240px, 0.8fr);
    gap: 1rem;
    align-items: start;
  }

  .il-panel-title {
    margin: 0 0 0.4rem;
    font-family: 'Sora', sans-serif;
    font-size: 1.02rem;
    font-weight: 750;
  }

  .il-panel-text { margin: 0 0 1rem; color: #64748b; font-size: 0.86rem; line-height: 1.55; }

  .il-form { display: grid; gap: 0.85rem; }
  .il-field { display: grid; gap: 0.35rem; }
  .il-field label { font-size: 0.8rem; font-weight: 700; color: #334155; }
  .il-field input, .il-field select, .il-field textarea {
    width: 100%; box-sizing: border-box;
    border: 1px solid #dbe3ef; border-radius: 12px;
    padding: 0.7rem 0.85rem; font: inherit; color: #0f172a; background: #fff;
  }
  .il-field textarea { min-height: 120px; resize: vertical; }
  .il-field input:focus, .il-field select:focus, .il-field textarea:focus {
    outline: none; border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
  }
  .il-field input[aria-invalid="true"],
  .il-field select[aria-invalid="true"],
  .il-field textarea[aria-invalid="true"] {
    border-color: #f87171;
    background: #fff1f2;
  }
  .il-field-error {
    color: #dc2626;
    font-size: 0.78rem;
    font-weight: 600;
  }

  .il-success {
    display: flex; align-items: flex-start; gap: 0.5rem;
    background: #ecfdf5; border: 1px solid #a7f3d0; color: #047857;
    border-radius: 12px; padding: 0.75rem 0.85rem; font-size: 0.82rem; line-height: 1.45;
  }

  .il-note {
    margin-top: 0.85rem;
    background: #f8fafc;
    border: 1px dashed #cbd5e1;
    border-radius: 12px;
    padding: 0.8rem 0.9rem;
    color: #64748b;
    font-size: 0.8rem;
    line-height: 1.5;
  }

  .il-topic-list { display: grid; gap: 0.45rem; }
  .il-topic {
    display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;
    background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
    padding: 0.65rem 0.75rem; font-size: 0.82rem; font-weight: 600; color: #334155;
  }

  @media (max-width: 840px) {
    .il-info-grid, .il-form-layout { grid-template-columns: 1fr; }
  }
`;
