import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  TrendingUp,
  BadgeDollarSign,
  Layers,
  ShieldCheck,
  Database,
  Brain,
  BarChart3,
  Sparkles,
  GraduationCap,
  Building2,
  Globe2,
  ScanSearch,
  ArrowRight,
  Github,
  Linkedin,
  Youtube,
  ZoomIn,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import diagCasosDeUso from "../../../uml_diagrams/1_casos_de_uso.wsd?raw";
import diagAtividades from "../../../uml_diagrams/2_atividades.wsd?raw";
import diagSequencia from "../../../uml_diagrams/3_sequencia.wsd?raw";
import diagNavegacao from "../../../uml_diagrams/4_navegacao.wsd?raw";
import diagArquitetura from "../../../uml_diagrams/5_arquitetura.wsd?raw";
import diagComponentes from "../../../uml_diagrams/6_componentes.wsd?raw";
import diagEntidadeRelacionamento from "../../../uml_diagrams/7_entidade_relacionamento.wsd?raw";
import diagClassesBackend from "../../../uml_diagrams/8_classes_backend.wsd?raw";
import diagEstadosCarreira from "../../../uml_diagrams/9_estados_analise_carreira.wsd?raw";
import diagMapaMental from "../../../uml_diagrams/10_mapa_mental_produto.wsd?raw";

function toPlantUmlUrl(source: string): string {
  const bytes = new TextEncoder().encode(source);
  let hex = "";
  for (const byte of bytes) hex += byte.toString(16).padStart(2, "0");
  return `https://www.plantuml.com/plantuml/svg/~h${hex}`;
}

const style = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@400;500&display=swap');

  .so-root { font-family: 'Inter', sans-serif; color: #0f172a; background: #f5f6fa; min-height: 100vh; }

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

  .so-pipeline {
    display: grid; gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    counter-reset: so-step;
  }
  .so-step { position: relative; padding: 1.25rem 1rem 1rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; }
  .so-step-icon {
    width: 36px; height: 36px; border-radius: 999px;
    display: flex; align-items: center; justify-content: center;
    background: #003ec7; color: #fff; margin-bottom: 0.75rem;
  }
  .so-step-title { font-weight: 600; font-size: 0.92rem; margin-bottom: 0.3rem; }
  .so-step-text { font-size: 0.85rem; color: #64748b; line-height: 1.45; }

  .so-diff-list { display: flex; flex-direction: column; gap: 0.9rem; margin-top: 1.5rem; }
  .so-diff-item { display: flex; gap: 0.75rem; align-items: flex-start; }
  .so-diff-item svg { flex-shrink: 0; color: #2563eb; margin-top: 0.15rem; }
  .so-diff-text { font-size: 0.95rem; color: #334155; line-height: 1.5; }

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

  .so-diagram-tabs { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; margin-bottom: 1.5rem; }
  .so-diagram-tab {
    padding: 0.5rem 1rem; border-radius: 999px; border: 1px solid #e2e8f0;
    background: #fff; color: #475569; font-size: 0.85rem; font-weight: 500;
    cursor: pointer; transition: all 0.15s;
  }
  .so-diagram-tab.active { background: #003ec7; border-color: #003ec7; color: #fff; }
  .so-diagram-tab:not(.active):hover { border-color: rgba(37, 99, 235, 0.4); }
  .so-diagram-frame {
    background: #fff; border: 1px solid #e2e8f0; border-radius: 14px;
    padding: 1.5rem; min-height: 360px; display: flex; align-items: center; justify-content: center;
    overflow: auto;
  }
  .so-diagram-frame img { max-width: 100%; height: auto; cursor: zoom-in; }
  .so-diagram-fallback { font-size: 0.85rem; color: #94a3b8; text-align: center; }
  .so-diagram-hint {
    display: flex; align-items: center; justify-content: center; gap: 0.35rem;
    text-align: center; font-size: 0.8rem; color: #94a3b8; margin-top: 0.75rem;
  }

  .so-lightbox {
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(15, 23, 42, 0.88);
  }
  .so-lightbox-close {
    position: absolute; top: 1rem; right: 1rem; z-index: 2;
    width: 40px; height: 40px; border-radius: 999px; border: none;
    background: rgba(255, 255, 255, 0.15); color: #fff;
    display: flex; align-items: center; justify-content: center; cursor: pointer;
  }
  .so-lightbox-close:hover { background: rgba(255, 255, 255, 0.28); }
  /* Scroll + wrap max-content: cabe = centro; estoura = pan real nos 4 eixos. */
  .so-lightbox-scroll {
    position: absolute; inset: 0;
    overflow: auto;
    box-sizing: border-box;
  }
  .so-lightbox-center {
    box-sizing: content-box;
    width: max-content;
    height: max-content;
    min-width: 100%;
    min-height: 100%;
    padding: 2.5rem 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .so-lightbox-scroll img {
    display: block;
    flex-shrink: 0;
    max-width: none;
    width: min(1100px, calc(100vw - 2rem));
    height: auto;
    background: #fff; border-radius: 8px;
    cursor: zoom-in;
  }
  .so-lightbox-scroll img.so-lightbox-zoomed {
    width: min(2000px, 184vw); cursor: zoom-out;
  }
  .so-lightbox-hint {
    position: absolute; bottom: 1rem; left: 50%; transform: translateX(-50%);
    z-index: 2; pointer-events: none;
    color: rgba(255, 255, 255, 0.7); font-size: 0.78rem; text-align: center;
    width: max-content; max-width: calc(100% - 2rem);
  }

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

  .so-credits {
    max-width: 1080px; margin: 0 auto; padding: 0 1.5rem 2.5rem;
    text-align: center; font-size: 0.8rem; color: #94a3b8; line-height: 1.6;
  }
`;

const WHAT_WE_DO = [
  {
    icon: TrendingUp,
    title: "Tendências de mercado",
    text: "Acompanhamento contínuo de quais tecnologias, senioridades e áreas estão em alta demanda no mercado tech.",
  },
  {
    icon: BadgeDollarSign,
    title: "Radar de salários",
    text: "Faixas salariais estimadas a partir de vagas reais, não de pesquisas espontâneas ou dados autodeclarados.",
  },
  {
    icon: Layers,
    title: "Mapeamento de skills em alta",
    text: "Identificação automática das competências técnicas mais pedidas, separando o que é essencial do que é ruído.",
  },
  {
    icon: ShieldCheck,
    title: "Moderação de vagas falsas",
    text: "Curadoria ativa para reduzir vagas fantasmas, golpes e anúncios enganosos no fluxo de oportunidades.",
  },
];

const HOW_IT_WORKS = [
  { icon: Database, title: "Coleta", text: "Web scraping contínuo em portais de vagas de tecnologia." },
  { icon: Brain, title: "Processamento com NLP", text: "Normalização de texto e extração semântica de requisitos e benefícios." },
  { icon: ScanSearch, title: "Classificação", text: "Reconhecimento de competências reais, separando skill técnica de termo genérico." },
  { icon: BarChart3, title: "Inteligência", text: "Consolidação em dashboards de tendências, salários e demanda por skill." },
];

const AUDIENCE = [
  {
    icon: GraduationCap,
    title: "Para devs e estudantes de tech",
    text: "Decida qual tecnologia estudar e para qual vaga se candidatar com base em dados reais de demanda e salário, não em achismo.",
  },
  {
    icon: Building2,
    title: "Para recrutadores e empresas",
    text: "Benchmarking salarial e leitura de mercado para embasar contratações, com curadoria contra vagas e concorrência desleal.",
  },
];

const DIFFERENTIALS = [
  { icon: Globe2, text: "Dados coletados diretamente de fontes públicas de vagas, não de formulários ou pesquisas." },
  { icon: Brain, text: "Classificação semântica por NLP, não simples correspondência de palavra-chave." },
  { icon: ShieldCheck, text: "Moderação ativa contra vagas falsas e anúncios enganosos." },
];

const DIAGRAMS = [
  { title: "Casos de uso", source: diagCasosDeUso },
  { title: "Atividades", source: diagAtividades },
  { title: "Sequência", source: diagSequencia },
  { title: "Navegação", source: diagNavegacao },
  { title: "Arquitetura", source: diagArquitetura },
  { title: "Componentes", source: diagComponentes },
  { title: "Entidade-relacionamento", source: diagEntidadeRelacionamento },
  { title: "Classes do backend", source: diagClassesBackend },
  { title: "Pipeline de carreira (IA)", source: diagEstadosCarreira },
  { title: "Mapa mental do produto", source: diagMapaMental },
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
  const [activeDiagram, setActiveDiagram] = useState(0);
  const [diagramFailed, setDiagramFailed] = useState(false);
  const [diagramZoomed, setDiagramZoomed] = useState(false);
  const [lightboxZoomedIn, setLightboxZoomedIn] = useState(false);
  const lightboxScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = lightboxScrollRef.current;
    if (!el || !diagramZoomed) return;

    const centerScroll = () => {
      el.scrollLeft = Math.max(0, (el.scrollWidth - el.clientWidth) / 2);
      el.scrollTop = Math.max(0, (el.scrollHeight - el.clientHeight) / 2);
    };

    // Dois frames: 1 aplica width (fit/zoom), 2 mede scroll e centra a imagem na tela
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(centerScroll);
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [diagramZoomed, lightboxZoomedIn]);

  return (
    <div className="so-root">
      <style>{style}</style>

      <SiteHeader activeItem="sobre" onExploreClick={() => navigate("/")} />

      <section className="so-hero">
        <div className="so-badge">
          <Sparkles size={14} /> Sobre a Worky
        </div>
        <h1 className="so-hero-title">
          Dados reais de mercado, para quem decide carreira ou contratação.
        </h1>
        <p className="so-hero-sub">
          A Worky cruza web scraping e processamento de linguagem natural para transformar
          vagas de tecnologia em inteligência: tendências, salários e competências em alta,
          sem achismo.
        </p>
      </section>

      <section className="so-section">
        <div className="so-section-head">
          <h2 className="so-section-title">O que a Worky faz</h2>
          <p className="so-section-sub">
            Uma plataforma de inteligência de mercado de trabalho tech, construída em cima de
            dados coletados continuamente.
          </p>
        </div>
        <div className="so-grid so-grid-4">
          {WHAT_WE_DO.map(({ icon: Icon, title, text }) => (
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
          <h2 className="so-section-title">Como funciona</h2>
          <p className="so-section-sub">
            Do anúncio da vaga ao dashboard, sem trabalho manual.
          </p>
        </div>
        <div className="so-pipeline">
          {HOW_IT_WORKS.map(({ icon: Icon, title, text }) => (
            <div className="so-step" key={title}>
              <div className="so-step-icon">
                <Icon size={16} />
              </div>
              <div className="so-step-title">{title}</div>
              <div className="so-step-text">{text}</div>
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
          <h2 className="so-section-title">Por que confiar nos dados</h2>
        </div>
        <div className="so-diff-list" style={{ maxWidth: 620, margin: "0 auto" }}>
          {DIFFERENTIALS.map(({ icon: Icon, text }, index) => (
            <div className="so-diff-item" key={index}>
              <Icon size={18} />
              <div className="so-diff-text">{text}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="so-section">
        <div className="so-section-head">
          <h2 className="so-section-title">Diagramas do projeto</h2>
          <p className="so-section-sub">
            Renderizados ao vivo a partir do PlantUML versionado em <code>uml_diagrams/</code> —
            atualiza sozinho quando o diagrama-fonte muda.
          </p>
        </div>
        <div className="so-diagram-tabs">
          {DIAGRAMS.map((d, index) => (
            <button
              key={d.title}
              type="button"
              className={`so-diagram-tab${index === activeDiagram ? " active" : ""}`}
              onClick={() => {
                setActiveDiagram(index);
                setDiagramFailed(false);
              }}
            >
              {d.title}
            </button>
          ))}
        </div>
        <div className="so-diagram-frame">
          {diagramFailed ? (
            <p className="so-diagram-fallback">
              Não foi possível carregar o diagrama agora. Tente novamente em instantes.
            </p>
          ) : (
            <img
              key={activeDiagram}
              src={toPlantUmlUrl(DIAGRAMS[activeDiagram].source)}
              alt={`Diagrama de ${DIAGRAMS[activeDiagram].title}`}
              onError={() => setDiagramFailed(true)}
              onClick={() => setDiagramZoomed(true)}
            />
          )}
        </div>
        <p className="so-diagram-hint">
          <ZoomIn size={14} /> Toque na imagem para ampliar.
        </p>
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
          <p className="so-section-sub">Demonstração do sistema funcionando de ponta a ponta.</p>
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

      <p className="so-credits">
        Centro Universitário Facens · CST em Análise e Desenvolvimento de Sistemas · Disciplina
        Startup: Project One / Startup Challenge (Projeto Final)
        <br />
        Equipe MindLab ·{" "}
        <a href="https://github.com/Midlab-my/Worky" target="_blank" rel="noreferrer">
          github.com/Midlab-my/Worky
        </a>
      </p>

      {diagramZoomed && !diagramFailed && (
        <div
          className="so-lightbox"
          onClick={() => {
            setDiagramZoomed(false);
            setLightboxZoomedIn(false);
          }}
        >
          <button
            type="button"
            className="so-lightbox-close"
            onClick={() => {
              setDiagramZoomed(false);
              setLightboxZoomedIn(false);
            }}
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
          <div className="so-lightbox-scroll" ref={lightboxScrollRef}>
            <div className="so-lightbox-center">
              <img
                className={lightboxZoomedIn ? "so-lightbox-zoomed" : ""}
                src={toPlantUmlUrl(DIAGRAMS[activeDiagram].source)}
                alt={`Diagrama de ${DIAGRAMS[activeDiagram].title} ampliado`}
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxZoomedIn((zoomed) => !zoomed);
                }}
              />
            </div>
          </div>
          <p className="so-lightbox-hint">
            {lightboxZoomedIn ? "Toque para ver o diagrama inteiro" : "Toque na imagem para dar mais zoom"}
          </p>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}
