import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router";
import {
  BookOpen,
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
import { SiteFooter, SiteHeader } from "../components/SiteChrome";

type DocumentSection = {
  title: string;
  body: string[];
};

type LegalDocument = {
  badge: string;
  title: string;
  subtitle: string;
  updatedAt: string;
  note?: string;
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
  badge: "Documento base",
  title: "Política de Privacidade",
  subtitle: "Um modelo inicial para explicar como a Worky pode tratar dados pessoais dentro da plataforma.",
  updatedAt: "23 de maio de 2026",
  icon: ShieldCheck,
  sections: [
    {
      title: "1. Visão geral",
      body: [
        "A Worky é uma plataforma de inteligência de mercado de trabalho criada para apoiar pesquisas de carreira, análise de competências, oportunidades e recomendações profissionais.",
        "Esta Política descreve, de forma base, quais dados podem ser coletados, como podem ser usados e quais direitos o usuário pode exercer.",
      ],
    },
    {
      title: "2. Dados que podemos coletar",
      body: [
        "Podemos coletar dados cadastrais, como nome, e-mail, cidade, estado e informações de autenticação necessárias para acesso à conta.",
        "Também podemos tratar informações profissionais fornecidas pelo próprio usuário, incluindo objetivo de carreira, experiências, formação, certificações e competências.",
        "Dados técnicos e de uso, como páginas acessadas, termos pesquisados, preferências, registros de erro e informações do dispositivo, podem ser usados para segurança e melhoria da plataforma.",
      ],
    },
    {
      title: "3. Como usamos os dados",
      body: [
        "Usamos os dados para operar a plataforma, autenticar usuários, personalizar recomendações, gerar análises de carreira, melhorar a experiência e prevenir uso indevido.",
        "Também podemos usar dados agregados ou anonimizados para entender tendências, desempenho de recursos e qualidade das recomendações.",
      ],
    },
    {
      title: "4. Compartilhamento",
      body: [
        "Podemos compartilhar dados com provedores técnicos essenciais para hospedagem, autenticação, banco de dados, análise, suporte e segurança.",
        "Não vendemos dados pessoais neste modelo. Compartilhamentos adicionais deverão ser descritos aqui quando a operação real estiver definida.",
      ],
    },
    {
      title: "5. Bases legais e LGPD",
      body: [
        "O tratamento pode ocorrer com base no consentimento, execução de contrato, legítimo interesse, cumprimento de obrigação legal ou exercício regular de direitos, conforme aplicável.",
        "O usuário pode solicitar confirmação de tratamento, acesso, correção, exclusão, portabilidade, oposição e revogação de consentimento pelos canais de contato indicados.",
      ],
    },
    {
      title: "6. Retenção e segurança",
      body: [
        "Mantemos dados pelo tempo necessário para cumprir as finalidades descritas, obrigações legais e prevenção de fraudes ou disputas.",
        "Aplicamos medidas administrativas, técnicas e organizacionais para proteger as informações, mas nenhum ambiente digital é totalmente livre de riscos.",
      ],
    },
    {
      title: "7. Cookies e registros",
      body: [
        "Podemos usar cookies, armazenamento local e tecnologias semelhantes para manter sessão, lembrar preferências, medir uso e proteger a conta.",
        "O usuário pode ajustar preferências no navegador, ciente de que algumas funcionalidades podem ser afetadas.",
      ],
    },
    {
      title: "8. Canal de privacidade",
      body: [
        "Para solicitações relacionadas a dados pessoais, use o e-mail fictício privacidade@worky.example ou atualize este campo com o contato real da empresa.",
      ],
    },
  ],
};

const termsDocument: LegalDocument = {
  badge: "Documento base",
  title: "Termos de Uso",
  subtitle: "Regras iniciais para acesso, uso da plataforma e responsabilidades entre a Worky e seus usuários.",
  updatedAt: "23 de maio de 2026",
  icon: FileText,
  sections: [
    {
      title: "1. Aceite dos termos",
      body: [
        "Ao acessar ou usar a Worky, o usuário declara que leu, compreendeu e concorda com estes Termos de Uso.",
        "Caso não concorde com alguma condição, o usuário deve interromper o uso da plataforma.",
      ],
    },
    {
      title: "2. Objetivo da plataforma",
      body: [
        "A Worky oferece recursos para pesquisa de carreiras, análise de mercado, recomendações de competências, cursos e oportunidades profissionais.",
        "As informações exibidas têm finalidade informativa e de apoio à decisão, não substituindo orientação profissional, jurídica, financeira ou educacional individualizada.",
      ],
    },
    {
      title: "3. Conta e cadastro",
      body: [
        "O usuário é responsável por fornecer informações corretas, manter suas credenciais protegidas e comunicar qualquer uso não autorizado da conta.",
        "A Worky pode suspender ou limitar contas em caso de uso indevido, fraude, violação destes termos ou risco à segurança da plataforma.",
      ],
    },
    {
      title: "4. Recomendações e inteligência artificial",
      body: [
        "As análises geradas por IA podem conter estimativas, simplificações ou informações incompletas, especialmente quando dependem de fontes externas ou dados informados pelo usuário.",
        "O usuário deve avaliar criticamente resultados, vagas, salários, cursos e sugestões antes de tomar decisões.",
      ],
    },
    {
      title: "5. Links e serviços externos",
      body: [
        "A plataforma pode direcionar o usuário para sites de vagas, cursos ou outros serviços de terceiros.",
        "A Worky não controla esses ambientes externos e não se responsabiliza por políticas, conteúdos, preços, disponibilidade ou processos conduzidos por terceiros.",
      ],
    },
    {
      title: "6. Condutas proibidas",
      body: [
        "É proibido tentar invadir sistemas, automatizar acessos abusivos, copiar dados em massa sem autorização, inserir conteúdo ilegal ou usar a plataforma para fins fraudulentos.",
        "Também é proibido violar direitos de propriedade intelectual, privacidade de terceiros ou qualquer legislação aplicável.",
      ],
    },
    {
      title: "7. Propriedade intelectual",
      body: [
        "Marcas, layout, textos, componentes, código, banco de dados, relatórios e elementos visuais da Worky pertencem aos respectivos titulares.",
        "O uso da plataforma não concede licença para copiar, modificar, vender ou distribuir esses materiais sem autorização prévia.",
      ],
    },
    {
      title: "8. Limitação de responsabilidade",
      body: [
        "A Worky não garante contratação, aprovação em processos seletivos, aumento salarial, disponibilidade contínua de vagas ou exatidão absoluta de dados de mercado.",
        "A plataforma será oferecida conforme disponibilidade técnica, podendo passar por manutenções, instabilidades ou mudanças de funcionalidade.",
      ],
    },
    {
      title: "9. Alterações dos termos",
      body: [
        "Estes Termos podem ser atualizados para refletir mudanças de produto, operação, legislação ou segurança.",
        "A versão mais recente deve ser mantida nesta página, com indicação da data de atualização.",
      ],
    },
    {
      title: "10. Contato",
      body: [
        "Dúvidas sobre estes Termos podem ser encaminhadas para juridico@worky.example, contato fictício que deve ser substituído pelo canal oficial.",
      ],
    },
  ],
};

const contactItems: ContactItem[] = [
  {
    icon: Mail,
    label: "E-mail geral",
    value: "contato@worky.example",
    helper: "Canal fictício para assuntos comerciais e institucionais.",
  },
  {
    icon: Phone,
    label: "Telefone",
    value: "+55 (11) 3000-0000",
    helper: "Atendimento fictício de segunda a sexta, das 9h às 18h.",
  },
  {
    icon: MapPin,
    label: "Endereço",
    value: "Rua Exemplo Digital, 123 - São Paulo, SP",
    helper: "Endereço ilustrativo para substituir pelos dados reais depois.",
  },
];

const supportItems: ContactItem[] = [
  {
    icon: Mail,
    label: "Suporte por e-mail",
    value: "suporte@worky.example",
    helper: "Canal fictício para problemas de acesso, perfil e relatórios.",
  },
  {
    icon: MessageCircle,
    label: "Chat",
    value: "chat.worky.example",
    helper: "Link ilustrativo para um futuro atendimento em tempo real.",
  },
  {
    icon: Clock,
    label: "SLA inicial",
    value: "Até 2 dias úteis",
    helper: "Prazo base fictício para primeira resposta.",
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

const legalCss = `
.wl-root {
  min-height: 100vh;
  background:
    linear-gradient(180deg, #ffffff 0%, #f8fafc 38%, #f5f6fa 100%);
  color: #0f172a;
  display: flex;
  flex-direction: column;
  font-family: 'Inter', sans-serif;
}

.wl-main {
  flex: 1;
  width: 100%;
}

.wl-hero {
  border-bottom: 1px solid #e2e8f0;
  background:
    radial-gradient(ellipse 58% 42% at 18% 0%, rgba(37, 99, 235, 0.09), transparent 64%),
    radial-gradient(ellipse 42% 36% at 92% 12%, rgba(13, 148, 136, 0.08), transparent 60%),
    #ffffff;
}

.wl-hero-inner {
  width: min(1120px, calc(100% - 2rem));
  margin: 0 auto;
  padding: 4rem 0 3rem;
}

.wl-kicker {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  border: 1px solid #bfdbfe;
  background: #eff6ff;
  color: #2563eb;
  border-radius: 999px;
  padding: 0.35rem 0.85rem;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.wl-hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 2rem;
  align-items: end;
  margin-top: 1.3rem;
}

.wl-title {
  font-family: 'Sora', sans-serif;
  font-size: clamp(2.2rem, 5vw, 3.8rem);
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: 0;
  margin: 0 0 1rem;
}

.wl-subtitle {
  color: #64748b;
  font-size: 1rem;
  line-height: 1.7;
  max-width: 680px;
}

.wl-meta-panel {
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid #dbe3ef;
  border-radius: 16px;
  padding: 1.2rem;
  box-shadow: 0 14px 38px rgba(15, 23, 42, 0.07);
}

.wl-meta-row {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  color: #475569;
  font-size: 0.86rem;
  line-height: 1.5;
}

.wl-meta-row + .wl-meta-row {
  border-top: 1px solid #e2e8f0;
  margin-top: 0.9rem;
  padding-top: 0.9rem;
}

.wl-meta-icon {
  color: #2563eb;
  flex: 0 0 auto;
  margin-top: 0.1rem;
}

.wl-content {
  width: min(1120px, calc(100% - 2rem));
  margin: 0 auto;
  padding: 2.5rem 0 4rem;
}

.wl-doc-layout {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 2rem;
  align-items: start;
}

.wl-doc-nav {
  position: sticky;
  top: 86px;
  display: grid;
  gap: 0.45rem;
}

.wl-doc-nav-title {
  color: #94a3b8;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  margin-bottom: 0.3rem;
  text-transform: uppercase;
}

.wl-doc-nav a {
  color: #64748b;
  border-radius: 8px;
  font-size: 0.86rem;
  font-weight: 600;
  line-height: 1.4;
  padding: 0.55rem 0.7rem;
  text-decoration: none;
}

.wl-doc-nav a:hover {
  background: #eff6ff;
  color: #2563eb;
}

.wl-document {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  box-shadow: 0 16px 42px rgba(15, 23, 42, 0.06);
  overflow: hidden;
}

.wl-doc-section {
  padding: 1.6rem 1.8rem;
}

.wl-doc-section + .wl-doc-section {
  border-top: 1px solid #edf2f7;
}

.wl-section-title {
  color: #0f172a;
  font-family: 'Sora', sans-serif;
  font-size: 1.02rem;
  font-weight: 750;
  line-height: 1.4;
  margin-bottom: 0.8rem;
}

.wl-paragraph {
  color: #475569;
  font-size: 0.93rem;
  line-height: 1.75;
}

.wl-paragraph + .wl-paragraph {
  margin-top: 0.7rem;
}

.wl-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  margin-top: 1.75rem;
}

.wl-actions .ws-btn-primary,
.wl-actions .ws-btn-secondary,
.wl-form .ws-btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
}

.wl-contact-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.wl-info-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.2rem;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.04);
}

.wl-info-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: #eff6ff;
  color: #2563eb;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.9rem;
}

.wl-info-label {
  color: #64748b;
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.wl-info-value {
  color: #0f172a;
  font-family: 'Sora', sans-serif;
  font-size: 1rem;
  font-weight: 750;
  line-height: 1.4;
  margin-top: 0.35rem;
}

.wl-info-helper {
  color: #64748b;
  font-size: 0.84rem;
  line-height: 1.6;
  margin-top: 0.55rem;
}

.wl-form-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 1.4rem;
  align-items: start;
}

.wl-panel {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  box-shadow: 0 16px 42px rgba(15, 23, 42, 0.05);
  padding: 1.6rem;
}

.wl-panel-title {
  font-family: 'Sora', sans-serif;
  font-size: 1.15rem;
  font-weight: 800;
  margin-bottom: 0.45rem;
}

.wl-panel-text {
  color: #64748b;
  font-size: 0.9rem;
  line-height: 1.65;
  margin-bottom: 1.3rem;
}

.wl-form {
  display: grid;
  gap: 1rem;
}

.wl-field {
  display: grid;
  gap: 0.45rem;
}

.wl-field label {
  color: #475569;
  font-size: 0.8rem;
  font-weight: 800;
}

.wl-input,
.wl-select,
.wl-textarea {
  width: 100%;
  background: #f8fafc;
  border: 1px solid #dbe3ef;
  border-radius: 12px;
  color: #0f172a;
  font-family: 'Inter', sans-serif;
  font-size: 0.92rem;
  outline: none;
  padding: 0.8rem 0.95rem;
  transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
}

.wl-input:focus,
.wl-select:focus,
.wl-textarea:focus {
  background: #ffffff;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.wl-textarea {
  min-height: 140px;
  resize: vertical;
}

.wl-success {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  background: #f0fdfa;
  border: 1px solid #99f6e4;
  border-radius: 12px;
  color: #0f766e;
  font-size: 0.86rem;
  font-weight: 650;
  line-height: 1.5;
  padding: 0.85rem;
}

.wl-topic-list {
  display: grid;
  gap: 0.6rem;
}

.wl-topic {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  color: #334155;
  font-size: 0.86rem;
  font-weight: 700;
  padding: 0.75rem 0.85rem;
}

.wl-mini-note {
  background: #0f172a;
  border-radius: 16px;
  color: #e2e8f0;
  line-height: 1.65;
  margin-top: 1rem;
  padding: 1rem;
}

.wl-mini-note strong {
  color: #ffffff;
}

@media (max-width: 900px) {
  .wl-hero-grid,
  .wl-doc-layout,
  .wl-form-layout {
    grid-template-columns: 1fr;
  }

  .wl-doc-nav {
    position: static;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }

  .wl-doc-nav-title {
    grid-column: 1 / -1;
  }

  .wl-contact-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .wl-hero-inner {
    padding: 2.5rem 0 2rem;
  }

  .wl-title {
    font-size: 2.1rem;
  }

  .wl-doc-section,
  .wl-panel {
    padding: 1.2rem;
  }

  .wl-actions {
    flex-direction: column;
  }

  .wl-actions .ws-btn-primary,
  .wl-actions .ws-btn-secondary {
    width: 100%;
  }
}
`;

function LegalShell({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{legalCss}</style>
      <div className="wl-root">
        {children}
      </div>
    </>
  );
}

function LegalHero({
  badge,
  title,
  subtitle,
  updatedAt,
  note,
  icon: Icon,
}: LegalDocument) {
  return (
    <section className="wl-hero">
      <div className="wl-hero-inner">
        <div className="wl-kicker">
          <Icon size={15} />
          {badge}
        </div>
        <div className="wl-hero-grid">
          <div>
            <h1 className="wl-title">{title}</h1>
            <p className="wl-subtitle">{subtitle}</p>
          </div>
          <aside className="wl-meta-panel" aria-label="Informações do documento">
            <div className="wl-meta-row">
              <Clock className="wl-meta-icon" size={18} />
              <div>
                <strong>Última atualização</strong>
                <br />
                {updatedAt}
              </div>
            </div>
            {note && (
              <div className="wl-meta-row">
                <BookOpen className="wl-meta-icon" size={18} />
                <div>{note}</div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}

function LegalDocumentPage({ document }: { document: LegalDocument }) {
  const navigate = useNavigate();

  return (
    <LegalShell>
      <SiteHeader onExploreClick={() => navigate("/")} onAboutClick={() => navigate("/")} />
      <main className="wl-main">
        <LegalHero {...document} />
        <div className="wl-content">
          <div className="wl-doc-layout">
            <nav className="wl-doc-nav" aria-label={`Seções de ${document.title}`}>
              <div className="wl-doc-nav-title">Nesta página</div>
              {document.sections.map((section, index) => (
                <a key={section.title} href={`#section-${index + 1}`}>
                  {section.title}
                </a>
              ))}
            </nav>

            <article className="wl-document">
              {document.sections.map((section, index) => (
                <section className="wl-doc-section" id={`section-${index + 1}`} key={section.title}>
                  <h2 className="wl-section-title">{section.title}</h2>
                  {section.body.map((paragraph) => (
                    <p className="wl-paragraph" key={paragraph}>{paragraph}</p>
                  ))}
                </section>
              ))}
            </article>
          </div>

          <div className="wl-actions">
            <button type="button" className="ws-btn-primary" onClick={() => navigate("/contato")}>
              Falar com contato
            </button>
            <button type="button" className="ws-btn-secondary" onClick={() => navigate("/suporte")}>
              Abrir suporte
            </button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </LegalShell>
  );
}

function InfoCards({ items }: { items: ContactItem[] }) {
  return (
    <div className="wl-contact-grid">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <section className="wl-info-card" key={item.label}>
            <div className="wl-info-icon">
              <Icon size={20} />
            </div>
            <div className="wl-info-label">{item.label}</div>
            <div className="wl-info-value">{item.value}</div>
            <p className="wl-info-helper">{item.helper}</p>
          </section>
        );
      })}
    </div>
  );
}

export function PrivacyPage() {
  return <LegalDocumentPage document={privacyDocument} />;
}

export function TermsPage() {
  return <LegalDocumentPage document={termsDocument} />;
}

export function ContactPage() {
  const navigate = useNavigate();
  const [sent, setSent] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
  };

  return (
    <LegalShell>
      <SiteHeader onExploreClick={() => navigate("/")} onAboutClick={() => navigate("/")} />
      <main className="wl-main">
        <LegalHero
          badge="Contato"
          title="Fale com a Worky"
          subtitle="Canais fictícios para você trocar por e-mail, telefone e endereço reais quando a operação estiver pronta."
          updatedAt="Dados fictícios"
          icon={Mail}
          sections={[]}
        />
        <div className="wl-content">
          <InfoCards items={contactItems} />

          <div className="wl-form-layout">
            <section className="wl-panel" aria-labelledby="contact-form-title">
              <h2 id="contact-form-title" className="wl-panel-title">Enviar mensagem</h2>
              <p className="wl-panel-text">
                Formulário demonstrativo para manter o fluxo visual do site. Depois você pode conectar este envio a uma API ou ferramenta de atendimento.
              </p>
              <form className="wl-form" onSubmit={handleSubmit}>
                <div className="wl-field">
                  <label htmlFor="contact-name">Nome</label>
                  <input id="contact-name" className="wl-input" placeholder="Seu nome" required />
                </div>
                <div className="wl-field">
                  <label htmlFor="contact-email">E-mail</label>
                  <input id="contact-email" className="wl-input" type="email" placeholder="voce@email.com" required />
                </div>
                <div className="wl-field">
                  <label htmlFor="contact-subject">Assunto</label>
                  <input id="contact-subject" className="wl-input" placeholder="Como podemos ajudar?" required />
                </div>
                <div className="wl-field">
                  <label htmlFor="contact-message">Mensagem</label>
                  <textarea id="contact-message" className="wl-textarea" placeholder="Escreva sua mensagem..." required />
                </div>
                {sent && (
                  <div className="wl-success" role="status">
                    <CheckCircle2 size={18} />
                    Mensagem fictícia registrada na interface. Conecte este formulário ao backend quando quiser receber contatos reais.
                  </div>
                )}
                <button type="submit" className="ws-btn-primary">
                  <Send size={16} />
                  Enviar mensagem
                </button>
              </form>
            </section>

            <aside className="wl-panel">
              <h2 className="wl-panel-title">Dados empresariais</h2>
              <p className="wl-panel-text">
                Worky Tecnologia Fictícia Ltda.
                <br />
                CNPJ 00.000.000/0001-00
                <br />
                Atendimento: segunda a sexta, das 9h às 18h.
              </p>
              <div className="wl-mini-note">
                <strong>Observação:</strong> substitua estes dados pelos canais reais antes de publicar a versão final.
              </div>
            </aside>
          </div>
        </div>
      </main>
      <SiteFooter />
    </LegalShell>
  );
}

export function SupportPage() {
  const navigate = useNavigate();
  const [ticket, setTicket] = useState("");

  const ticketNumber = useMemo(() => `WKY-${new Date().getFullYear()}-0426`, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTicket(ticketNumber);
  };

  return (
    <LegalShell>
      <SiteHeader onExploreClick={() => navigate("/")} onAboutClick={() => navigate("/")} />
      <main className="wl-main">
        <LegalHero
          badge="Suporte"
          title="Central de Suporte"
          subtitle="Uma página de atendimento com canais e abertura de chamado fictícios, pronta para ser conectada ao fluxo real depois."
          updatedAt="Dados fictícios"
          icon={LifeBuoy}
          sections={[]}
        />
        <div className="wl-content">
          <InfoCards items={supportItems} />

          <div className="wl-form-layout">
            <section className="wl-panel" aria-labelledby="support-form-title">
              <h2 id="support-form-title" className="wl-panel-title">Abrir chamado</h2>
              <p className="wl-panel-text">
                Registre um problema ou dúvida usando dados demonstrativos. O protocolo abaixo é gerado apenas na interface.
              </p>
              <form className="wl-form" onSubmit={handleSubmit}>
                <div className="wl-field">
                  <label htmlFor="support-email">E-mail da conta</label>
                  <input id="support-email" className="wl-input" type="email" placeholder="voce@email.com" required />
                </div>
                <div className="wl-field">
                  <label htmlFor="support-topic">Tipo de solicitação</label>
                  <select id="support-topic" className="wl-select" required defaultValue="">
                    <option value="" disabled>Selecione um assunto</option>
                    {supportTopics.map((topic) => (
                      <option key={topic} value={topic}>{topic}</option>
                    ))}
                  </select>
                </div>
                <div className="wl-field">
                  <label htmlFor="support-description">Descrição</label>
                  <textarea id="support-description" className="wl-textarea" placeholder="Descreva o que aconteceu..." required />
                </div>
                {ticket && (
                  <div className="wl-success" role="status">
                    <TicketCheck size={18} />
                    Chamado fictício criado: {ticket}. Este número é demonstrativo.
                  </div>
                )}
                <button type="submit" className="ws-btn-primary">
                  <LifeBuoy size={16} />
                  Abrir chamado
                </button>
              </form>
            </section>

            <aside className="wl-panel">
              <h2 className="wl-panel-title">Assuntos comuns</h2>
              <p className="wl-panel-text">Use estes tópicos como base para uma futura central de ajuda.</p>
              <div className="wl-topic-list">
                {supportTopics.map((topic) => (
                  <div className="wl-topic" key={topic}>
                    {topic}
                    <CheckCircle2 size={16} color="#0d9488" />
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </main>
      <SiteFooter />
    </LegalShell>
  );
}
