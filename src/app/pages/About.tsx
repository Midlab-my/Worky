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
import { useAuth } from "../context/AuthContext";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";

const style = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@400;500&display=swap');

  .so-root { font-family: 'Inter', sans-serif; color: #0f172a; background: #ffffff; min-height: 100vh; }

  .so-hero {
    max-width: 860px;
    margin: 0 auto;
    padding: 5rem 1.5rem 3rem;
    text-align: center;
  }
  .so-badge {
    display: inline-flex; align-items: center; gap: 0.4rem;
    padding: 0.35rem 0.85rem; border-radius: 999px;
    background: rgba(37, 99, 235, 0.08); color: #2563eb;
    font-size: 0.8rem; font-weight: 600; margin-bottom: 1.5rem;
  }
  .so-hero-title {
    font-family: 'Sora', sans-serif; font-weight: 800;
    font-size: clamp(1.9rem, 4vw, 2.75rem); line-height: 1.2;
    color: #003ec7; margin-bottom: 1rem;
  }
  .so-hero-sub { font-size: 1.05rem; color: #475569; line-height: 1.6; }

  .so-section { max-width: 1080px; margin: 0 auto; padding: 3rem 1.5rem; }
  .so-section-head { max-width: 640px; margin: 0 auto 2.5rem; text-align: center; }
  .so-section-title {
    font-family: 'Sora', sans-serif; font-weight: 700;
    font-size: clamp(1.4rem, 2.4vw, 1.9rem); color: #0f172a; margin-bottom: 0.6rem;
  }
  .so-section-sub { color: #64748b; font-size: 0.98rem; line-height: 1.55; }

  .so-grid { display: grid; gap: 1.25rem; }
  .so-grid-4 { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
  .so-grid-2 { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }

  .so-card {
    background: #fff; border: 1px solid #e2e8f0; border-radius: 14px;
    padding: 1.5rem; transition: border-color 0.15s, box-shadow 0.15s;
  }
  .so-card:hover { border-color: rgba(37, 99, 235, 0.35); box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06); }
  .so-card-icon {
    width: 40px; height: 40px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(37, 99, 235, 0.1); color: #2563eb; margin-bottom: 1rem;
  }
  .so-card-title { font-weight: 600; font-size: 1rem; margin-bottom: 0.4rem; color: #0f172a; }
  .so-card-text { font-size: 0.9rem; color: #64748b; line-height: 1.5; }
  .so-card.dark {
    background: #0f172a; border-color: #1e293b;
  }
  .so-card.dark .so-card-icon {
    background: rgba(255,255,255,0.1); color: #e2e8f0;
  }
  .so-card.dark .so-card-title { color: #fff; }
  .so-card.dark .so-card-text { color: #94a3b8; }
  .so-card.dark:hover { border-color: #334155; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.2); }

  .so-cta {
    max-width: 720px; width: calc(100% - 3rem); margin: 1rem auto; padding: 2.5rem 2rem;
    background: #003ec7; border-radius: 20px; text-align: center; color: #fff;
  }
  .so-cta-title { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 1.5rem; margin-bottom: 0.5rem; }
  .so-cta-sub { color: rgba(255,255,255,0.8); font-size: 0.95rem; margin-bottom: 1.5rem; }
  .so-cta-btn {
    display: inline-flex; align-items: center; gap: 0.5rem;
    background: #fff; color: #003ec7; font-weight: 600; font-size: 0.95rem;
    padding: 0.75rem 1.5rem; border-radius: 10px; border: none; cursor: pointer;
    transition: transform 0.15s;
  }
  .so-cta-btn:hover { transform: translateY(-1px); }

  .so-team-card { text-align: center; }
  .so-team-avatar {
    width: 84px; height: 84px; border-radius: 999px; margin: 0 auto 0.9rem;
    object-fit: cover; border: 2px solid rgba(37, 99, 235, 0.25);
  }
  .so-team-name { font-weight: 600; font-size: 0.98rem; color: #0f172a; }
  .so-team-role { font-size: 0.82rem; color: #64748b; margin-top: 0.25rem; line-height: 1.4; min-height: 2.2em; }
  .so-team-links { display: flex; justify-content: center; gap: 0.5rem; margin-top: 0.85rem; }
  .so-team-link {
    display: inline-flex; align-items: center; justify-content: center;
    width: 32px; height: 32px; border-radius: 8px; border: 1px solid #e2e8f0;
    color: #475569; transition: all 0.15s;
  }
  .so-team-link:hover { border-color: rgba(37, 99, 235, 0.4); color: #2563eb; }

  .so-video-frame {
    max-width: 780px; margin: 0 auto; border-radius: 14px; overflow: hidden;
    border: 1px solid #e2e8f0; aspect-ratio: 16 / 9; background: #000;
  }
  .so-video-frame iframe { width: 100%; height: 100%; border: 0; }
  .so-video-links { display: flex; justify-content: center; margin-top: 1rem; }
  .so-video-link {
    display: inline-flex; align-items: center; gap: 0.4rem;
    font-size: 0.85rem; font-weight: 500; color: #2563eb; text-decoration: none;
  }
  .so-video-link:hover { text-decoration: underline; }
`;

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

export function About() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="so-root">
      <style>{style}</style>

      <SiteHeader activeItem="sobre" onExploreClick={() => navigate("/")} />

      <section className="so-hero">
        <h1 className="so-hero-title">
          Dados reais de mercado, para quem decide carreira ou contratação.
        </h1>
        <p className="so-hero-sub">
          A Worky reúne tendências, salários e habilidades a partir de vagas reais em tecnologia.
          Ajudamos candidatos e empresas a decidir com mais clareza e menos achismo.
        </p>
      </section>

      <section className="so-section">
        <div className="so-section-head">
          <h2 className="so-section-title">O que a Worky oferece</h2>
          <p className="so-section-sub">
            Benefícios da plataforma para quem busca orientação de carreira ou apoio em contratação.
          </p>
        </div>
        <div className="so-grid so-grid-4">
          {WHAT_WE_DO.map(({ icon: Icon, title, text, tone }) => (
            <div className={`so-card${tone === "dark" ? " dark" : ""}`} key={title}>
              <div className="so-card-icon">
                <Icon size={20} />
              </div>
              <div className="so-card-title">{title}</div>
              <div className="so-card-text">{text}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="so-section">
        <div className="so-section-head">
          <h2 className="so-section-title">Para quem é</h2>
        </div>
        <div className="so-grid so-grid-2">
          {AUDIENCE.map(({ icon: Icon, title, text }) => (
            <div className="so-card" key={title}>
              <div className="so-card-icon">
                <Icon size={20} />
              </div>
              <div className="so-card-title">{title}</div>
              <div className="so-card-text">{text}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="so-section">
        <div className="so-section-head">
          <h2 className="so-section-title">Equipe MindLab</h2>
          <p className="so-section-sub">As pessoas por trás da Worky.</p>
        </div>
        <div className="so-grid so-grid-4">
          {TEAM.map((member) => (
            <div className="so-card so-team-card" key={member.name}>
              <img
                className="so-team-avatar"
                src={`https://github.com/${member.github}.png?size=200`}
                alt={member.name}
              />
              <div className="so-team-name">{member.name}</div>
              <div className="so-team-role">{member.role}</div>
              <div className="so-team-links">
                <a
                  className="so-team-link"
                  href={member.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`LinkedIn de ${member.name}`}
                >
                  <Linkedin size={15} />
                </a>
                <a
                  className="so-team-link"
                  href={`https://github.com/${member.github}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`GitHub de ${member.name}`}
                >
                  <Github size={15} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="so-section">
        <div className="so-section-head">
          <h2 className="so-section-title">Veja a Worky em ação</h2>
          <p className="so-section-sub">Demonstração do produto em funcionamento.</p>
        </div>
        <div className="so-video-frame">
          <iframe
            src="https://player.vimeo.com/video/1195042702?title=0&byline=0&portrait=0&controls=0&autoplay=1&muted=1&loop=1"
            title="Demonstração da Worky"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className="so-video-links">
          <a
            className="so-video-link"
            href="https://youtu.be/_ZXBbs77-hE"
            target="_blank"
            rel="noreferrer"
          >
            <Youtube size={16} /> Assistir ao vídeo pitch no YouTube
          </a>
        </div>
      </section>

      <div className="so-cta">
        <div className="so-cta-title">
          {isAuthenticated ? "Continue explorando o mercado" : "Comece a decidir com dados"}
        </div>
        <div className="so-cta-sub">
          {isAuthenticated
            ? "Volte para o painel e acompanhe as tendências mais recentes."
            : "Crie sua conta gratuita e veja o que o mercado tech está pedindo agora."}
        </div>
        <button
          type="button"
          className="so-cta-btn"
          onClick={() => navigate(isAuthenticated ? "/" : "/auth")}
        >
          {isAuthenticated ? "Explorar" : "Criar conta"}
          <ArrowRight size={16} />
        </button>
      </div>

      <SiteFooter />
    </div>
  );
}
