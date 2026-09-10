import { useState } from "react";
import { useNavigate } from "react-router";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import { PlantUmlDiagram } from "../components/PlantUmlDiagram";

import diagramCasosDeUso from "../../../uml_diagrams/1_casos_de_uso.wsd?raw";
import diagramAtividades from "../../../uml_diagrams/2_atividades.wsd?raw";
import diagramSequencia from "../../../uml_diagrams/3_sequencia.wsd?raw";
import diagramNavegacao from "../../../uml_diagrams/4_navegacao.wsd?raw";
import diagramArquitetura from "../../../uml_diagrams/5_arquitetura.wsd?raw";
import diagramComponentes from "../../../uml_diagrams/6_componentes.wsd?raw";

const GITHUB_URL = "https://github.com/Midlab-my";
const FIGMA_URL = "https://www.figma.com/design/c2KGQTgz0yD9NxfE2uZBf4/Startup-One?node-id=0-1";
const TRELLO_URL = "https://trello.com/b/pXjsDFkb/worky";
const VIMEO_URL = "https://vimeo.com/1195042702?fl=pl&fe=sh";

const diagrams = [
  { key: "arquitetura", title: "Diagrama de Arquitetura", source: diagramArquitetura },
  { key: "atividades", title: "Diagrama de Atividades", source: diagramAtividades },
  { key: "casos-de-uso", title: "Diagrama de Casos de Uso", source: diagramCasosDeUso },
  { key: "componentes", title: "Diagrama de Componentes", source: diagramComponentes },
  { key: "sequencia", title: "Diagrama de Sequência", source: diagramSequencia },
  { key: "navegacao", title: "Fluxo de Navegação", source: diagramNavegacao },
];

const problemas = [
  "Dificuldade em entender quais habilidades o mercado exige",
  "Falta de dados organizados sobre vagas e competências",
  "Pouca clareza sobre tendências profissionais",
  "Ausência de estimativas salariais estruturadas",
  "Busca baseada apenas em filtros tradicionais",
  "Recrutadores sem dados objetivos para decidir",
];

const solucaoPills = [
  "Coleta automatizada",
  "Habilidades demandadas",
  "Tendências profissionais",
  "Estimativa salarial",
  "Dashboards & filtros",
  "Apoio à decisão",
];

const funcionalidades = [
  { title: "Cadastro de Usuário", desc: "Crie sua conta e acesse recursos personalizados da Worky." },
  { title: "Login Seguro", desc: "Autenticação para proteger suas informações e preferências." },
  { title: "Dashboard Principal", desc: "Visão centralizada de buscas, habilidades e tendências." },
  { title: "Busca de Vagas", desc: "Pesquise por palavra-chave, área, localização e senioridade." },
  { title: "Filtros Avançados", desc: "Refine resultados com filtros precisos e contextuais." },
  { title: "Detalhes da Vaga", desc: "Descrição, requisitos, responsabilidades e salário estimado." },
  { title: "Análise de Habilidades", desc: "Rankings das competências mais exigidas pelo mercado." },
  { title: "Tendências de Mercado", desc: "Crescimento de setores, salários e tecnologias em alta." },
  { title: "Denúncia de Vagas", desc: "Reporte anúncios incorretos, duplicados ou suspeitos." },
  { title: "Coleta & Análise", desc: "Web scraping, normalização e análise semântica de dados." },
];

const stackGroups = [
  { title: "Front-end", items: ["HTML5", "CSS3", "JavaScript", "TypeScript", "React", "TailwindCSS", "Vite"] },
  { title: "Design", items: ["Figma", "Canva"] },
  { title: "Versionamento", items: ["VSCode", "Git", "GitHub"] },
  { title: "Organização", items: ["Trello"] },
  { title: "Solução", items: ["Web Scraping", "Processamento", "Classificação semântica", "Análise de dados", "Dashboards"] },
  { title: "Hospedagem", items: ["Vercel"] },
];

const arquiteturaCamadas = [
  { n: "01", title: "Interface (Front-end)", desc: "Login, dashboard, busca, resultados, detalhes, análise, tendências, reportes." },
  { n: "02", title: "Aplicação (Back-end / API)", desc: "Recebe requisições, aplica regras, consulta dados e devolve respostas processadas." },
  { n: "03", title: "Banco de Dados", desc: "Usuários, vagas, habilidades, salários, filtros, denúncias e resultados." },
  { n: "04", title: "Web Scraping", desc: "Coleta automatizada de dados em portais e plataformas digitais externas." },
  { n: "05", title: "Módulo de Análise", desc: "Normaliza, interpreta e gera insights sobre habilidades, tendências e salários." },
  { n: "06", title: "Integrações Externas", desc: "APIs de classificação semântica e portais parceiros de vagas." },
];

const telasReais = [
  { title: "Login", route: "/auth", image: "/assets/images/login-hero.png" },
  { title: "Cadastro", route: "/auth", image: "/assets/images/register-hero.png" },
  { title: "Dashboard / Busca", route: "/", image: null },
  { title: "Análise de Carreira", route: "/carreira", image: null },
  { title: "Perfil & Competências", route: "/perfil", image: null },
  { title: "Painel Administrativo", route: "/admin", image: null },
];

const personas = [
  {
    name: "Lucas",
    role: "Estudante de TI · 21 anos",
    desc: "Está no início da carreira e busca entender quais habilidades realmente o mercado exige antes de investir tempo em cursos.",
    necessidade: "Mapear competências em alta para direcionar seus estudos.",
    dor: "Se sente perdido entre tantas tecnologias e não sabe por onde começar.",
  },
  {
    name: "Fernando",
    role: "Profissional em transição · 29 anos",
    desc: "Trabalha há alguns anos em outra área e quer migrar para tecnologia. Precisa de dados concretos sobre salários e demanda.",
    necessidade: "Identificar oportunidades realistas e estimativas salariais por região.",
    dor: "Aplica em diversas vagas, mas recebe pouco retorno por desconhecer o que diferencia os candidatos.",
  },
  {
    name: "Marco",
    role: "Recrutador de Tecnologia · 36 anos",
    desc: "Atua em RH e precisa de informação organizada sobre competências e tendências para qualificar processos seletivos.",
    necessidade: "Comparar perfis e mapear o mercado com base em dados objetivos.",
    dor: "Falta de fontes confiáveis e consolidadas sobre habilidades e faixas salariais.",
  },
];

const resultadosEsperados = [
  "Melhor compreensão das competências mais exigidas",
  "Redução da dificuldade na busca por vagas",
  "Apoio ao planejamento de carreira",
  "Visualização clara de tendências profissionais",
  "Aumento da assertividade em candidaturas",
  "Melhor organização dos dados de vagas",
  "Apoio à decisão baseada em dados",
  "Maior confiabilidade via normalização",
  "Interface intuitiva em desktop e mobile",
];

const equipe = [
  { name: "André Vitor", role: "Product Owner · Dev · UX/UI" },
  { name: "Gabriela Silva", role: "Scrum Master · Documentação" },
  { name: "Guilherme Ferreira", role: "Scrum Master · PO · UX · Apresentação" },
  { name: "Kaick Gomes", role: "Dev · Requisitos · Tecnologias" },
];

const projectLinks = [
  { label: "Repositório GitHub", href: GITHUB_URL },
  { label: "Protótipo Figma", href: FIGMA_URL },
  { label: "Trello", href: TRELLO_URL },
  { label: "Vídeo Demo (Vimeo)", href: VIMEO_URL },
];

export function AboutPage() {
  const navigate = useNavigate();
  const [activeDiagram, setActiveDiagram] = useState(0);
  const diagram = diagrams[activeDiagram];

  return (
    <div className="sb-root">
      <style>{style}</style>
      <SiteHeader activeItem="institucional" onExploreClick={() => navigate("/")} />

      <section className="sb-hero">
        <span className="sb-badge">MindLab · Worky</span>
        <h1 className="sb-hero-title">Worky</h1>
        <p className="sb-hero-sub">
          Plataforma inteligente de análise de vagas com web scraping, análise de dados e mapeamento de
          competências do mercado. Encontre oportunidades, descubra habilidades em alta e tome decisões
          profissionais baseadas em dados reais do mercado.
        </p>
        <div className="sb-hero-actions">
          <button type="button" className="sb-btn-primary" onClick={() => navigate("/")}>
            Acessar Sistema
          </button>
          <a className="sb-btn-secondary" href={VIMEO_URL} target="_blank" rel="noreferrer">
            Ver Demonstração
          </a>
          <a className="sb-btn-secondary" href={GITHUB_URL} target="_blank" rel="noreferrer">
            Repositório
          </a>
        </div>
        <div className="sb-hero-stats">
          <div>
            <strong>+10k</strong>
            <span>vagas analisadas</span>
          </div>
          <div>
            <strong>+500</strong>
            <span>habilidades mapeadas</span>
          </div>
          <div>
            <strong>30+</strong>
            <span>setores</span>
          </div>
        </div>
      </section>

      <section className="sb-section">
        <span className="sb-eyebrow">Problema</span>
        <h2>A busca por emprego ainda é guiada por palpites</h2>
        <p className="sb-section-lead">
          Dados de vagas são dispersos e inconsistentes. Candidatos não enxergam o que o mercado realmente
          exige, e recrutadores carecem de métricas objetivas.
        </p>
        <div className="sb-grid-3">
          {problemas.map((item) => (
            <div className="sb-card" key={item}>
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="sb-section sb-section-muted">
        <span className="sb-eyebrow">Solução</span>
        <h2>Dados brutos viram inteligência de carreira</h2>
        <p className="sb-section-lead">
          Via web scraping coletamos dados de portais de emprego. O sistema normaliza, classifica e
          transforma tudo em dashboards, rankings e estimativas salariais.
        </p>
        <div className="sb-solution-grid">
          <div className="sb-solution-value">
            <strong>Proposta de valor</strong>
            <p>Ajudar pessoas e empresas a tomarem decisões profissionais com base em dados reais do mercado de trabalho.</p>
          </div>
          {solucaoPills.map((pill) => (
            <div className="sb-pill-card" key={pill}>
              {pill}
            </div>
          ))}
        </div>
      </section>

      <section className="sb-section">
        <span className="sb-eyebrow">Funcionalidades</span>
        <h2>Tudo que você precisa para entender o mercado</h2>
        <div className="sb-grid-3">
          {funcionalidades.map((f) => (
            <div className="sb-card" key={f.title}>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="sb-section sb-section-muted">
        <span className="sb-eyebrow">Stack</span>
        <h2>Tecnologias utilizadas</h2>
        <div className="sb-grid-3">
          {stackGroups.map((group) => (
            <div className="sb-card" key={group.title}>
              <h3>{group.title}</h3>
              <div className="sb-tags">
                {group.items.map((item) => (
                  <span className="sb-tag" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="sb-section">
        <span className="sb-eyebrow">Arquitetura</span>
        <h2>Arquitetura em camadas</h2>
        <p className="sb-section-lead">
          Interface, aplicação, dados, coleta e análise - orquestrados em um fluxo claro de ponta a ponta.
        </p>
        <div className="sb-grid-3">
          {arquiteturaCamadas.map((camada) => (
            <div className="sb-card" key={camada.n}>
              <span className="sb-camada-n">{camada.n}</span>
              <h3>{camada.title}</h3>
              <p>{camada.desc}</p>
            </div>
          ))}
        </div>
        <div className="sb-fluxo-line">
          <strong>Fluxo:</strong> Usuário → Interface → Back-end → Banco &amp; Análise → Dashboards
        </div>
      </section>

      <section className="sb-section sb-section-muted">
        <span className="sb-eyebrow">Diagramas do projeto</span>
        <h2>Navegue pelos diagramas UML e fluxos da Worky</h2>
        <p className="sb-section-lead">
          Renderizados diretamente a partir do PlantUML fonte em <code>uml_diagrams/</code> - qualquer
          atualização nesses arquivos aparece aqui automaticamente, sem precisar exportar imagem.
        </p>
        <div className="sb-diagram-viewer">
          <PlantUmlDiagram source={diagram.source} title={diagram.title} />
          <div className="sb-diagram-caption">
            {diagram.title} · {activeDiagram + 1}/{diagrams.length}
          </div>
        </div>
        <div className="sb-diagram-tabs">
          {diagrams.map((d, index) => (
            <button
              type="button"
              key={d.key}
              className={`sb-diagram-tab${index === activeDiagram ? " active" : ""}`}
              onClick={() => setActiveDiagram(index)}
            >
              {d.title}
            </button>
          ))}
        </div>
      </section>

      <section className="sb-section">
        <span className="sb-eyebrow">UX/UI</span>
        <h2>Telas reais da plataforma</h2>
        <p className="sb-section-lead">
          Interface pensada pra ser intuitiva, limpa e responsiva em desktop, tablet e mobile. Clique em
          qualquer tela pra abrir ela de verdade dentro do sistema.
        </p>
        <div className="sb-grid-3">
          {telasReais.map((tela) => (
            <button
              type="button"
              className="sb-tela-card"
              key={tela.title}
              onClick={() => navigate(tela.route)}
            >
              {tela.image ? (
                <img src={tela.image} alt={tela.title} />
              ) : (
                <div className="sb-tela-placeholder">Abrir tela</div>
              )}
              <span>{tela.title}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="sb-section sb-section-muted">
        <span className="sb-eyebrow">Público-alvo</span>
        <h2>Personas: para quem a Worky foi feita</h2>
        <p className="sb-section-lead">
          Mapeamos três perfis representativos do público-alvo da Worky, cada um com sua jornada,
          necessidades e dores específicas.
        </p>
        <div className="sb-grid-3">
          {personas.map((persona) => (
            <div className="sb-card" key={persona.name}>
              <h3>{persona.name}</h3>
              <span className="sb-persona-role">{persona.role}</span>
              <p>{persona.desc}</p>
              <p>
                <strong>Necessidade:</strong> {persona.necessidade}
              </p>
              <p>
                <strong>Dor:</strong> {persona.dor}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="sb-section">
        <span className="sb-eyebrow">Resultados esperados</span>
        <h2>O impacto que a Worky entrega</h2>
        <div className="sb-grid-2">
          {resultadosEsperados.map((item) => (
            <div className="sb-check-card" key={item}>
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="sb-section sb-section-muted">
        <span className="sb-eyebrow">Sustentabilidade</span>
        <h2>Alinhada aos Objetivos de Desenvolvimento Sustentável</h2>
        <div className="sb-grid-2">
          <div className="sb-ods-card sb-ods-8">
            <span className="sb-ods-tag">ODS Principal</span>
            <h3>8 · Trabalho Decente e Crescimento Econômico</h3>
            <p>Facilita acesso à informação do mercado, apoia desenvolvimento profissional e reduz a distância entre formação e exigências reais.</p>
            <a href="https://brasil.un.org/pt-br/sdgs/8" target="_blank" rel="noreferrer">
              Saiba mais sobre o ODS 8
            </a>
          </div>
          <div className="sb-ods-card sb-ods-4">
            <span className="sb-ods-tag">ODS Complementar</span>
            <h3>4 · Educação de Qualidade</h3>
            <p>Ajuda usuários a identificar quais habilidades desenvolver, incentivando aprendizado contínuo e qualificação.</p>
            <a href="https://brasil.un.org/pt-br/sdgs/4" target="_blank" rel="noreferrer">
              Saiba mais sobre o ODS 4
            </a>
          </div>
        </div>
      </section>

      <section className="sb-section">
        <span className="sb-eyebrow">Equipe MindLab</span>
        <h2>As pessoas por trás da Worky</h2>
        <div className="sb-grid-4">
          {equipe.map((membro) => (
            <div className="sb-card sb-equipe-card" key={membro.name}>
              <h3>{membro.name}</h3>
              <p>{membro.role}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="sb-section sb-section-muted">
        <span className="sb-eyebrow">Demonstração</span>
        <h2>Conheça a Worky em ação</h2>
        <p className="sb-section-lead">
          Assista à demonstração completa do sistema, acesse a plataforma hospedada ou abra o repositório do projeto.
        </p>
        <div className="sb-hero-actions">
          <a className="sb-btn-primary" href={VIMEO_URL} target="_blank" rel="noreferrer">
            Assistir Demo
          </a>
          <button type="button" className="sb-btn-secondary" onClick={() => navigate("/")}>
            Acessar Sistema
          </button>
          <a className="sb-btn-secondary" href={GITHUB_URL} target="_blank" rel="noreferrer">
            Ver Documentação
          </a>
        </div>
      </section>

      <section className="sb-section">
        <span className="sb-eyebrow">Documentação</span>
        <h2>Links do projeto</h2>
        <div className="sb-grid-3">
          {projectLinks.map((link) => (
            <a className="sb-card sb-link-card" key={link.label} href={link.href} target="_blank" rel="noreferrer">
              {link.label}
            </a>
          ))}
        </div>
      </section>

      <div className="sb-institutional">
        <div>
          <strong>Centro Universitário Facens</strong>
          <p>CST em Análise e Desenvolvimento de Sistemas</p>
          <p>Disciplina: Startup Challenge</p>
          <p>Prof. Renato Júnior</p>
          <p>4º Semestre · 2026</p>
        </div>
        <div>
          <strong>Equipe MindLab</strong>
          <p>André Vitor · Gabriela Silva</p>
          <p>Guilherme Ferreira · Kaick Gomes</p>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer">
            github.com/Midlab-my
          </a>
        </div>
      </div>

      <SiteFooter copy="2026 Worky. Inteligência de Mercado." />
    </div>
  );
}

const style = `
  .sb-root { font-family: 'Inter', sans-serif; color: #0f172a; background: #ffffff; min-height: 100vh; }

  .sb-hero { text-align: center; padding: 4rem 1.5rem 3rem; background: linear-gradient(180deg, #ffffff 0%, #f5f6fa 100%); }
  .sb-badge { display: inline-flex; align-items: center; background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; border-radius: 20px; padding: 4px 14px; font-size: 0.72rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 1.25rem; }
  .sb-hero-title { font-size: clamp(2.4rem, 6vw, 3.6rem); font-weight: 800; margin-bottom: 1rem; }
  .sb-hero-sub { font-size: 1rem; color: #475569; line-height: 1.6; max-width: 640px; margin: 0 auto 2rem; }
  .sb-hero-actions { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; margin-bottom: 2.5rem; }
  .sb-btn-primary { background: #2563eb; color: #fff; border: none; padding: 0.7rem 1.4rem; border-radius: 10px; font-weight: 600; font-size: 0.9rem; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; }
  .sb-btn-primary:hover { background: #1d4ed8; }
  .sb-btn-secondary { background: #fff; color: #0f172a; border: 1px solid #e2e8f0; padding: 0.7rem 1.4rem; border-radius: 10px; font-weight: 600; font-size: 0.9rem; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; }
  .sb-btn-secondary:hover { background: #f8fafc; }
  .sb-hero-stats { display: flex; gap: 3rem; justify-content: center; flex-wrap: wrap; }
  .sb-hero-stats div { display: flex; flex-direction: column; }
  .sb-hero-stats strong { font-size: 1.6rem; font-weight: 800; }
  .sb-hero-stats span { font-size: 0.8rem; color: #64748b; }

  .sb-section { padding: 3.5rem 1.5rem; max-width: 1080px; margin: 0 auto; }
  .sb-section-muted { background: #f8fafc; max-width: none; }
  .sb-section-muted > * { max-width: 1080px; margin-left: auto; margin-right: auto; }
  .sb-eyebrow { display: inline-block; background: #eff6ff; color: #2563eb; border-radius: 20px; padding: 4px 14px; font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 1rem; }
  .sb-section h2 { font-size: clamp(1.6rem, 3.5vw, 2.2rem); font-weight: 800; margin-bottom: 0.75rem; }
  .sb-section-lead { color: #475569; max-width: 640px; margin-bottom: 2rem; line-height: 1.6; }

  .sb-grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; }
  .sb-grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem; }
  .sb-grid-4 { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; }

  .sb-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1.5rem; font-size: 0.9rem; color: #334155; }
  .sb-card h3 { font-size: 1rem; font-weight: 700; margin-bottom: 0.5rem; color: #0f172a; }
  .sb-card p { margin-bottom: 0.4rem; }

  .sb-solution-grid { display: grid; grid-template-columns: 1.3fr repeat(2, 1fr); gap: 1rem; }
  .sb-solution-value { grid-row: span 2; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #fff; border-radius: 16px; padding: 1.75rem; }
  .sb-solution-value strong { display: block; margin-bottom: 0.5rem; font-size: 1.05rem; }
  .sb-pill-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; font-weight: 600; font-size: 0.85rem; display: flex; align-items: center; }

  .sb-camada-n { font-size: 0.75rem; font-weight: 700; color: #94a3b8; }
  .sb-fluxo-line { margin-top: 1.5rem; background: #eff6ff; border-radius: 12px; padding: 1rem 1.25rem; font-size: 0.9rem; color: #1e3a8a; text-align: center; }

  .sb-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.75rem; }
  .sb-tag { background: #f1f5f9; border-radius: 8px; padding: 0.25rem 0.6rem; font-size: 0.78rem; color: #334155; }

  .sb-diagram-viewer { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.5rem; text-align: center; }
  .sb-diagram-img { max-width: 100%; height: auto; }
  .sb-diagram-caption { margin-top: 1rem; font-size: 0.85rem; color: #64748b; }
  .sb-diagram-tabs { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; margin-top: 1.25rem; }
  .sb-diagram-tab { background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 0.45rem 1rem; font-size: 0.8rem; font-weight: 600; color: #475569; cursor: pointer; }
  .sb-diagram-tab.active { background: #2563eb; border-color: #2563eb; color: #fff; }

  .sb-tela-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 0; overflow: hidden; cursor: pointer; display: flex; flex-direction: column; font-family: inherit; text-align: left; }
  .sb-tela-card img { width: 100%; display: block; }
  .sb-tela-placeholder { background: #f1f5f9; color: #94a3b8; height: 140px; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; }
  .sb-tela-card span { padding: 0.75rem 1rem; font-weight: 600; font-size: 0.9rem; }

  .sb-persona-role { display: block; color: #2563eb; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.6rem; }

  .sb-check-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 0.9rem 1.1rem; font-size: 0.88rem; }

  .sb-ods-card { border-radius: 16px; padding: 1.5rem; border: 1px solid #e2e8f0; background: #fff; }
  .sb-ods-tag { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: #94a3b8; }
  .sb-ods-card h3 { margin: 0.4rem 0 0.6rem; font-size: 1.05rem; }
  .sb-ods-card a { color: #2563eb; font-size: 0.85rem; font-weight: 600; text-decoration: none; }

  .sb-equipe-card { text-align: center; }

  .sb-link-card { display: flex; align-items: center; justify-content: center; text-align: center; font-weight: 700; color: #2563eb; text-decoration: none; }

  .sb-institutional { max-width: 1080px; margin: 0 auto; padding: 2.5rem 1.5rem; display: flex; flex-wrap: wrap; gap: 3rem; justify-content: space-between; border-top: 1px solid #e2e8f0; font-size: 0.85rem; color: #475569; }
  .sb-institutional strong { display: block; margin-bottom: 0.5rem; color: #0f172a; }
  .sb-institutional p { margin-bottom: 0.2rem; }
  .sb-institutional a { color: #2563eb; text-decoration: none; }
`;
