import { useNavigate } from "react-router";
import {
  ArrowRight,
  BadgeDollarSign,
  Building2,
  Github,
  GraduationCap,
  Layers,
  Linkedin,
  ShieldCheck,
  TrendingUp,
  Youtube,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const WHAT_WE_DO = [
  {
    icon: TrendingUp,
    title: "Tendências de mercado",
    text: "Acompanhamento do que está em alta em tecnologias, senioridades e áreas de demanda no mercado tech.",
  },
  {
    icon: BadgeDollarSign,
    title: "Radar de salários",
    text: "Faixas salariais estimadas a partir de vagas reais publicadas no mercado.",
  },
  {
    icon: Layers,
    title: "Habilidades em alta",
    text: "Visão das competências mais pedidas, para estudar e se candidatar com mais direção.",
  },
  {
    icon: ShieldCheck,
    title: "Curadoria de oportunidades",
    text: "Foco em reduzir ruído e ajudar o usuário a encontrar vagas mais confiáveis.",
    tone: "dark" as const,
  },
];

const AUDIENCE = [
  {
    icon: GraduationCap,
    title: "Para candidatos e estudantes",
    text: "Entenda o que o mercado pede, onde há mais oportunidade e como alinhar seus estudos à demanda real.",
  },
  {
    icon: Building2,
    title: "Para recrutadores e empresas",
    text: "Leitura de mercado e conexão com candidatos mais alinhados ao perfil da vaga.",
  },
];

const TEAM = [
  {
    name: "André Vitor",
    role: "Product Owner · Dev · UX/UI",
    github: "andrecodedev",
    linkedin: "https://www.linkedin.com/in/andrecodedev/",
  },
  {
    name: "Gabriela Silva",
    role: "Scrum Master · Documentação",
    github: "codigabriela",
    linkedin: "https://www.linkedin.com/in/gabriela-silva-488a9a2aa/",
  },
  {
    name: "Guilherme Ferreira",
    role: "Scrum Master · PO · UX · Apresentação",
    github: "guilhermeH4sh",
    linkedin: "https://www.linkedin.com/in/guilhermeff45/",
  },
  {
    name: "Kaick Gomes",
    role: "Dev · Requisitos · Tecnologias",
    github: "kaickgomesoliveira",
    linkedin: "https://www.linkedin.com/in/kaick-gomes-de-oliveira",
  },
];

export function InstitutionalAbout() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="ia-root">
      <style>{style}</style>

      <section className="ia-panel">
        <h2>Dados reais de mercado, para quem decide carreira ou contratação.</h2>
        <p>
          A Worky reúne tendências, salários e habilidades a partir de vagas reais em tecnologia.
          Ajudamos candidatos e empresas a decidir com mais clareza e menos achismo.
        </p>
      </section>

      <section className="ia-block">
        <div className="ia-block-head">
          <h3>O que a Worky oferece</h3>
          <p>Benefícios da plataforma para quem busca orientação de carreira ou apoio em contratação.</p>
        </div>
        <div className="ia-grid ia-grid-4">
          {WHAT_WE_DO.map(({ icon: Icon, title, text, tone }) => (
            <article className={`ia-card${tone === "dark" ? " dark" : ""}`} key={title}>
              <div className="ia-card-icon">
                <Icon size={18} />
              </div>
              <h4>{title}</h4>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="ia-block">
        <div className="ia-block-head">
          <h3>Para quem é</h3>
        </div>
        <div className="ia-grid ia-grid-2">
          {AUDIENCE.map(({ icon: Icon, title, text }) => (
            <article className="ia-card" key={title}>
              <div className="ia-card-icon">
                <Icon size={18} />
              </div>
              <h4>{title}</h4>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="ia-block">
        <div className="ia-block-head">
          <h3>Equipe MindLab</h3>
          <p>As pessoas por trás da Worky.</p>
        </div>
        <div className="ia-grid ia-grid-4">
          {TEAM.map((member) => (
            <article className="ia-card ia-team" key={member.name}>
              <img
                src={`https://github.com/${member.github}.png?size=200`}
                alt={member.name}
              />
              <h4>{member.name}</h4>
              <p>{member.role}</p>
              <div className="ia-team-links">
                <a href={member.linkedin} target="_blank" rel="noreferrer" aria-label={`LinkedIn de ${member.name}`}>
                  <Linkedin size={14} />
                </a>
                <a href={`https://github.com/${member.github}`} target="_blank" rel="noreferrer" aria-label={`GitHub de ${member.name}`}>
                  <Github size={14} />
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="ia-block">
        <div className="ia-block-head">
          <h3>Veja a Worky em ação</h3>
          <p>Demonstração do produto em funcionamento.</p>
        </div>
        <div className="ia-video">
          <iframe
            src="https://player.vimeo.com/video/1195042702?title=0&byline=0&portrait=0&controls=0&autoplay=1&muted=1&loop=1"
            title="Demonstração da Worky"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
        <a
          className="ia-video-link"
          href="https://youtu.be/_ZXBbs77-hE"
          target="_blank"
          rel="noreferrer"
        >
          <Youtube size={15} /> Assistir ao vídeo pitch no YouTube
        </a>
      </section>

      <section className="ia-cta">
        <div>
          <h3>{isAuthenticated ? "Continue explorando o mercado" : "Comece a decidir com dados"}</h3>
          <p>
            {isAuthenticated
              ? "Volte para o painel e acompanhe as tendências mais recentes."
              : "Crie sua conta gratuita e veja o que o mercado tech está pedindo agora."}
          </p>
        </div>
        <button type="button" onClick={() => navigate(isAuthenticated ? "/" : "/auth")}>
          {isAuthenticated ? "Explorar" : "Criar conta"}
          <ArrowRight size={15} />
        </button>
      </section>
    </div>
  );
}

const style = `
  .ia-root { display: grid; gap: 1rem; }

  .ia-panel, .ia-block, .ia-cta {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.04);
  }

  .ia-panel { padding: 1.5rem 1.4rem; }
  .ia-panel h2 {
    margin: 0 0 0.65rem;
    font-family: 'Sora', sans-serif;
    font-size: clamp(1.2rem, 2.4vw, 1.55rem);
    font-weight: 800;
    color: #003ec7;
    line-height: 1.3;
  }
  .ia-panel p { margin: 0; color: #64748b; line-height: 1.65; font-size: 0.95rem; }

  .ia-block { padding: 1.35rem 1.3rem 1.45rem; }
  .ia-block-head { margin-bottom: 1rem; }
  .ia-block-head h3 {
    margin: 0 0 0.3rem;
    font-family: 'Sora', sans-serif;
    font-size: 1.05rem;
    font-weight: 750;
  }
  .ia-block-head p { margin: 0; color: #64748b; font-size: 0.88rem; line-height: 1.5; }

  .ia-grid { display: grid; gap: 0.85rem; }
  .ia-grid-4 { grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); }
  .ia-grid-2 { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }

  .ia-card {
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 1rem;
    background: #fff;
  }
  .ia-card.dark { background: #0f172a; border-color: #1e293b; }
  .ia-card-icon {
    width: 34px; height: 34px; border-radius: 10px;
    display: inline-flex; align-items: center; justify-content: center;
    background: #eff6ff; color: #2563eb; margin-bottom: 0.7rem;
  }
  .ia-card.dark .ia-card-icon { background: rgba(255,255,255,0.1); color: #e2e8f0; }
  .ia-card h4 { margin: 0 0 0.35rem; font-size: 0.92rem; font-weight: 700; }
  .ia-card.dark h4 { color: #fff; }
  .ia-card p { margin: 0; color: #64748b; font-size: 0.82rem; line-height: 1.5; }
  .ia-card.dark p { color: #94a3b8; }

  .ia-team { text-align: center; }
  .ia-team img {
    width: 72px; height: 72px; border-radius: 999px; object-fit: cover;
    margin: 0 auto 0.7rem; border: 2px solid #dbeafe; display: block;
  }
  .ia-team-links { display: flex; justify-content: center; gap: 0.4rem; margin-top: 0.7rem; }
  .ia-team-links a {
    width: 30px; height: 30px; border-radius: 8px; border: 1px solid #e2e8f0;
    display: inline-flex; align-items: center; justify-content: center; color: #64748b;
  }

  .ia-video {
    position: relative; width: 100%; padding-bottom: 56.25%;
    border-radius: 14px; overflow: hidden; background: #0f172a;
  }
  .ia-video iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
  .ia-video-link {
    display: inline-flex; align-items: center; gap: 0.4rem;
    margin-top: 0.85rem; color: #2563eb; font-size: 0.86rem; font-weight: 600; text-decoration: none;
  }

  .ia-cta {
    padding: 1.25rem 1.3rem;
    display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;
    background: linear-gradient(120deg, #003ec7, #2563eb);
    border-color: transparent; color: #fff;
  }
  .ia-cta h3 { margin: 0 0 0.3rem; font-family: 'Sora', sans-serif; font-size: 1.05rem; }
  .ia-cta p { margin: 0; color: rgba(255,255,255,0.82); font-size: 0.86rem; }
  .ia-cta button {
    display: inline-flex; align-items: center; gap: 0.4rem;
    background: #fff; color: #1d4ed8; border: 0; border-radius: 999px;
    padding: 0.65rem 1.1rem; font-weight: 700; font-size: 0.86rem; cursor: pointer;
  }
`;
