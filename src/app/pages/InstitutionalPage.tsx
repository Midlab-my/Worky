import { useNavigate } from "react-router";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";

const TOC = [
  { id: "visao-geral", label: "Visão Geral" },
  { id: "v2", label: "O que mudou na V2" },
  { id: "funcionamento", label: "Como Funciona" },
  { id: "negocio", label: "Modelo de Negócio" },
  { id: "personas", label: "Personas" },
  { id: "requisitos", label: "Requisitos Funcionais" },
  { id: "seguranca", label: "Segurança & LGPD" },
  { id: "arquitetura", label: "Arquitetura Técnica" },
  { id: "roadmap", label: "Roadmap" },
  { id: "referencias", label: "Referências" },
];

const RF_TABLE = [
  { id: "RF001", nome: "Cadastro de Usuário", prioridade: "Essencial" },
  { id: "RF002", nome: "Autenticação (Login)", prioridade: "Essencial" },
  { id: "RF003", nome: "Gerenciamento de Perfil", prioridade: "Essencial" },
  { id: "RF004", nome: "Visualizar Dashboard", prioridade: "Essencial" },
  { id: "RF005", nome: "Buscar Vagas", prioridade: "Essencial" },
  { id: "RF006", nome: "Filtrar Vagas (País/Região/Modelo)", prioridade: "Essencial" },
  { id: "RF007", nome: "Visualizar Resultados da Busca", prioridade: "Essencial" },
  { id: "RF008", nome: "Visualizar Detalhes da Vaga", prioridade: "Essencial" },
  { id: "RF009", nome: "Visualizar Habilidades do Mercado", prioridade: "Essencial" },
  { id: "RF010", nome: "Visualizar Tendências de Mercado", prioridade: "Essencial" },
  { id: "RF011", nome: "Consultar Estimativa Salarial", prioridade: "Importante" },
  { id: "RF012", nome: "Análise de Carreira com IA", prioridade: "Essencial" },
  { id: "RF013", nome: "Coleta de Dados (Web Scraping)", prioridade: "Essencial" },
  { id: "RF014", nome: "Processamento e Análise de Dados", prioridade: "Essencial" },
  { id: "RF015", nome: "Classificação Semântica", prioridade: "Essencial" },
  { id: "RF016", nome: "Normalização de Dados", prioridade: "Essencial" },
  { id: "RF017", nome: "Gerenciamento de Usuários (Admin)", prioridade: "Importante" },
  { id: "RF018", nome: "Reportar Vaga", prioridade: "Importante" },
];

const NF_TABLE = [
  { id: "NF003", nome: "Segurança", metrica: "JWT, bcrypt custo ≥10, HTTPS/TLS 1.2+, bloqueio após 5 tentativas de login" },
  { id: "NF002", nome: "Desempenho", metrica: "Busca <2s, dashboard <3s, Career Analytics timeout 30s, Lighthouse ≥80" },
  { id: "NF004", nome: "Escalabilidade", metrica: "500 usuários simultâneos, banco até 1M vagas" },
  { id: "NF005", nome: "Acessibilidade", metrica: "WCAG 2.1 AA, contraste 4,5:1, Lighthouse ≥85" },
  { id: "NF008", nome: "Disponibilidade", metrica: "99,9% uptime frontend, RTO de 1h" },
];

const SECURITY_CHECKLIST = [
  { item: "Hash de senha (nunca texto puro)", status: "done", detalhe: "Via Supabase Auth (bcrypt)." },
  { item: "JWT + HTTPS", status: "done", detalhe: "Supabase Auth emite JWT; Vercel serve tudo em HTTPS." },
  { item: "Validação de e-mail no cadastro", status: "done", detalhe: "Comportamento padrão do Supabase Auth." },
  { item: "Regra de senha (mín. 8, maiúscula, número, especial)", status: "done", detalhe: "Checklist visível em tempo real no cadastro." },
  { item: "Rate limit em login / cadastro / token de indicação", status: "pending", detalhe: "Ainda não implementado no código próprio." },
  { item: "MFA", status: "pending", detalhe: "Não existe nenhum vestígio no código." },
  { item: "Backup e redundância do banco", status: "unknown", detalhe: "Depende de configuração no painel do Supabase, fora do repositório." },
  { item: "Política de privacidade (LGPD)", status: "done", detalhe: "Páginas /privacidade e /termos publicadas." },
];

function ReferralIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function PlansIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    done: { label: "Feito", className: "in-pill-done" },
    pending: { label: "Pendente", className: "in-pill-pending" },
    unknown: { label: "Não verificável", className: "in-pill-unknown" },
  };
  const info = map[status] ?? map.pending;
  return <span className={`in-pill ${info.className}`}>{info.label}</span>;
}

export function InstitutionalPage() {
  const navigate = useNavigate();

  return (
    <div className="in-root">
      <style>{style}</style>
      <SiteHeader activeItem="institucional" onExploreClick={() => navigate("/")} />

      <section className="in-hero">
        <span className="in-badge">Documentação do Produto</span>
        <h1>Worky V2: Institucional</h1>
        <p>
          Documento de referência sobre a versão atual da Worky: o que mudou desde o Startup One,
          como o sistema funciona por dentro, o modelo de negócio validado com o professor orientador
          e o que ainda está no roadmap.
        </p>
      </section>

      <div className="in-layout">
        <aside className="in-toc">
          <div className="in-toc-title">Nesta página</div>
          <nav>
            {TOC.map((item) => (
              <a key={item.id} href={`#${item.id}`} className="in-toc-link">
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        <main className="in-content">
          <section id="visao-geral" className="in-section">
            <h2>1. Visão Geral</h2>
            <p>
              A Worky é uma plataforma de inteligência de mercado de trabalho tech. Ela combina web
              scraping de vagas reais, processamento de linguagem natural e análise de dados pra
              transformar anúncios de emprego dispersos em tendências, faixas salariais e mapas de
              competência acionáveis, tanto pra quem procura vaga quanto pra quem contrata.
            </p>
            <p>
              O projeto nasceu na disciplina <strong>Startup: Project One</strong> (grupo MindLab,
              Centro Universitário Facens) e está sendo reaproveitado e evoluído na disciplina{" "}
              <strong>Startup Challenge</strong>, com orientação do prof. Renato Júnior. Essa
              continuidade é o que chamamos aqui de <strong>V2</strong>.
            </p>
          </section>

          <section id="v2" className="in-section">
            <h2>2. O que mudou na V2</h2>
            <p>
              Na orientação de 28/ago/2026, ficou claro que o modelo original, só o candidato usando
              a plataforma, não sustenta assinatura sozinho: depois do primeiro match relevante, o
              candidato não tem motivo forte pra voltar toda semana. A mudança de fase trouxe uma
              segunda persona como fonte principal de receita: o <strong>RH / gestor de contratação</strong>,
              que paga pra ver a lista de candidatos compatíveis com a vaga que cadastrou de graça.
            </p>
            <div className="in-grid-3">
              <div className="in-card">
                <div className="in-card-icon"><ReferralIcon /></div>
                <h3>Programa de Indicação</h3>
                <p>Cada usuário ganha um link único. Amigos cadastrados via link contam pra desbloquear benefícios Premium.</p>
                <StatusPill status="done" />
              </div>
              <div className="in-card">
                <div className="in-card-icon"><PlansIcon /></div>
                <h3>Planos por Público</h3>
                <p>Free/Pro pro candidato, Starter/Pro/Enterprise pra empresa, com preços e benefícios diferentes por persona.</p>
                <StatusPill status="done" />
              </div>
              <div className="in-card">
                <div className="in-card-icon"><LockIcon /></div>
                <h3>Candidatos com Blur</h3>
                <p>RH cadastra vaga de graça e vê "Encontramos N candidatos compatíveis" com perfil bloqueado até assinar.</p>
                <StatusPill status="done" />
              </div>
            </div>
            <p className="in-note">
              As três telas acima existem hoje na interface (estáticas/demonstrativas, sem cobrança
              real integrada). O cadastro de vaga pelo RH e o enriquecimento de perfil (teste
              comportamental tipo MBTI) ainda estão no roadmap: ver seção 9.
            </p>
          </section>

          <section id="funcionamento" className="in-section">
            <h2>3. Como Funciona</h2>
            <p>O sistema funciona em pipeline, sem trabalho manual entre a coleta e o dashboard final:</p>
            <ol className="in-steps">
              <li>
                <strong>Coleta.</strong> O backend (FastAPI + httpx/BeautifulSoup4) faz scraping
                contínuo em portais de vagas de tecnologia, respeitando robots.txt e usando apenas
                dados públicos.
              </li>
              <li>
                <strong>Processamento e Normalização.</strong> O texto bruto das vagas é limpo e
                padronizado: títulos, localização, modelo de trabalho, faixa salarial quando
                disponível.
              </li>
              <li>
                <strong>Classificação Semântica.</strong> Um modelo de linguagem (GPT-4o-mini via
                OpenAI) extrai as competências reais exigidas, separando skill técnica de termo
                genérico.
              </li>
              <li>
                <strong>Análise de Carreira.</strong> Pra cada área pesquisada, o sistema gera
                insight de mercado, progressão salarial por senioridade, nível de demanda e
                recomendações de curso.
              </li>
              <li>
                <strong>Apresentação.</strong> Tudo isso vira dashboards no frontend (React + Vite):
                busca, resultados, análise de carreira, match de perfil, painel administrativo.
              </li>
            </ol>
          </section>

          <section id="negocio" className="in-section">
            <h2>4. Modelo de Negócio</h2>
            <p>
              Validado com o professor Renato Júnior (Startup Challenge, 28/ago/2026). A lógica
              central: o candidato é o "cliente em comum", usa a plataforma de graça e gera os dados
              qualificados que a empresa paga pra acessar.
            </p>

            <h3>Candidato</h3>
            <div className="in-table-wrap">
              <table className="in-table">
                <thead>
                  <tr><th>Plano</th><th>Preço</th><th>O que inclui</th></tr>
                </thead>
                <tbody>
                  <tr><td>Free</td><td>R$ 0/mês</td><td>5 buscas/mês, análise básica de perfil</td></tr>
                  <tr><td>Pro</td><td>R$ 9/mês (valor simbólico, sugerido)</td><td>Buscas ilimitadas, simulador de match com IA, alertas em tempo real</td></tr>
                </tbody>
              </table>
            </div>

            <h3>Empresa (RH)</h3>
            <div className="in-table-wrap">
              <table className="in-table">
                <thead>
                  <tr><th>Plano</th><th>Preço</th><th>O que inclui</th></tr>
                </thead>
                <tbody>
                  <tr><td>Starter</td><td>R$ 0/mês</td><td>Cadastro de vaga ilimitado, vaga visível pros candidatos</td></tr>
                  <tr><td>Pro</td><td>R$ 199/mês</td><td>Lista de candidatos compatíveis desbloqueada, simulador de match, alertas</td></tr>
                  <tr><td>Enterprise</td><td>R$ 500/mês (valor citado pelo professor)</td><td>Candidatos ilimitados, insights personalizados, API de dados, suporte premium</td></tr>
                </tbody>
              </table>
            </div>

            <h3>Fontes de receita secundárias</h3>
            <ul>
              <li><strong>Enriquecimento de perfil:</strong> testes comportamentais (tipo MBTI) viram informação vendável ao RH. Ainda não implementado.</li>
              <li><strong>Freemium com liberação por compartilhamento:</strong> em vez de anúncio, libera +1 match ao compartilhar o link. O professor foi enfático quanto a isso: anúncio isolado não sustenta o negócio.</li>
            </ul>

            <h3>Ponto de equilíbrio</h3>
            <p>
              Custo estimado de manter a Worky em produção real: <strong>~R$ 300 a R$ 360/mês</strong>{" "}
              (Vercel Pro ~R$110 + Supabase Pro ~R$137 + hosting do backend Python ~R$55-110). Com uma
              empresa Enterprise pagando R$500/mês, um único cliente B2B já cobre o custo mínimo de
              operação.
            </p>
          </section>

          <section id="personas" className="in-section">
            <h2>5. Personas</h2>
            <p className="in-note">
              Personas conforme o documento de requisitos oficial (seção 2.3). Uma versão anterior do
              site institucional usava outros nomes (Lucas/Fernando/Marco), vale confirmar com a
              equipe qual conjunto vai pra apresentação final.
            </p>
            <div className="in-grid-3">
              <div className="in-card">
                <h3>Lucas Andrade</h3>
                <p className="in-persona-role">22 anos · Estudante ADS Facens</p>
                <p>Início de carreira em dados. Quer alcançar nível pleno e direcionar estudos com dados reais de mercado.</p>
              </div>
              <div className="in-card">
                <h3>Fernanda Rocha</h3>
                <p className="in-persona-role">38 anos · Especialista em R&S (10+ anos)</p>
                <p>Persona de RH. Quer identificar candidatos qualificados com precisão e melhorar a definição de requisitos de vaga.</p>
              </div>
              <div className="in-card">
                <h3>Marcos Freire</h3>
                <p className="in-persona-role">32 anos · Analista de BI</p>
                <p>Quer extrair e analisar dados de vagas pra achar padrões que apoiem decisões em RH, produto e negócios.</p>
              </div>
            </div>
          </section>

          <section id="requisitos" className="in-section">
            <h2>6. Requisitos Funcionais</h2>
            <p>RF001-RF018, conforme o documento de requisitos oficial (AC1/AC2). Todos testados manualmente nesta versão, sem erro de execução.</p>
            <div className="in-table-wrap">
              <table className="in-table in-table-compact">
                <thead>
                  <tr><th>ID</th><th>Requisito</th><th>Prioridade</th></tr>
                </thead>
                <tbody>
                  {RF_TABLE.map((rf) => (
                    <tr key={rf.id}>
                      <td>{rf.id}</td>
                      <td>{rf.nome}</td>
                      <td><span className={`in-pill ${rf.prioridade === "Essencial" ? "in-pill-done" : "in-pill-unknown"}`}>{rf.prioridade}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3>Requisitos não funcionais em destaque</h3>
            <div className="in-table-wrap">
              <table className="in-table">
                <thead>
                  <tr><th>ID</th><th>Nome</th><th>Métrica-chave</th></tr>
                </thead>
                <tbody>
                  {NF_TABLE.map((nf) => (
                    <tr key={nf.id}>
                      <td>{nf.id}</td>
                      <td>{nf.nome}</td>
                      <td>{nf.metrica}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="seguranca" className="in-section">
            <h2>7. Segurança &amp; LGPD</h2>
            <p>
              Checklist pedido pelo professor na orientação de 28/ago: se o app referencia LGPD, tem
              que implementar proteção de verdade, não só declarar.
            </p>
            <ul className="in-checklist">
              {SECURITY_CHECKLIST.map((entry) => (
                <li key={entry.item}>
                  <div className="in-checklist-row">
                    <span>{entry.item}</span>
                    <StatusPill status={entry.status} />
                  </div>
                  <p>{entry.detalhe}</p>
                </li>
              ))}
            </ul>
          </section>

          <section id="arquitetura" className="in-section">
            <h2>8. Arquitetura Técnica</h2>
            <p>Fullstack: React 18 + Vite no frontend, Python FastAPI no backend, Supabase (Postgres + Auth) como banco.</p>
            <div className="in-arch-flow">
              <span>Interface</span>
              <span>→</span>
              <span>Aplicação / API</span>
              <span>→</span>
              <span>Banco de Dados</span>
              <span>→</span>
              <span>Web Scraping</span>
              <span>→</span>
              <span>Módulo de Análise (IA)</span>
            </div>
            <h3>Entidades do banco (oficial)</h3>
            <p>users · jobs · skills · job_skills · market_trends · salary_estimates · reports</p>
            <p className="in-note">
              Nenhuma entidade de empresa/RH ou vaga paga existe ainda no schema oficial: é o gap de
              banco de dados do pivô de negócio, ainda não modelado.
            </p>
          </section>

          <section id="roadmap" className="in-section">
            <h2>9. Roadmap</h2>
            <ul className="in-roadmap">
              <li className="done"><strong>Programa de indicação:</strong> feito na interface.</li>
              <li className="done"><strong>Planos Free/Pro/Enterprise:</strong> feito na interface, sem cobrança real integrada.</li>
              <li className="pending"><strong>Cadastro de vaga pelo RH:</strong> formulário ainda não existe, hoje é lista estática.</li>
              <li className="done"><strong>Candidatos compatíveis com blur:</strong> feito na interface, de forma demonstrativa.</li>
              <li className="pending"><strong>Enriquecimento de perfil (MBTI):</strong> não iniciado.</li>
              <li className="pending"><strong>Segurança:</strong> rate limit, MFA e confirmação de backup no Supabase.</li>
              <li className="pending"><strong>Cálculo de ponto de equilíbrio:</strong> definir quantos RH pagantes cobrem o custo mensal.</li>
            </ul>
          </section>

          <section id="referencias" className="in-section">
            <h2>10. Referências</h2>
            <p>
              Este documento resume o conteúdo já registrado no material de planejamento do projeto
              (orientação do professor, documento de requisitos oficial, decisões de arquitetura e
              backlog). Nenhuma informação aqui foi inventada; o que não está confirmado está
              sinalizado como pendente ou "não verificável".
            </p>
          </section>
        </main>
      </div>

      <SiteFooter copy="2026 Worky. Inteligência de Mercado." />
    </div>
  );
}

const style = `
  .in-root { font-family: 'Inter', sans-serif; color: #0f172a; background: #ffffff; min-height: 100vh; }
  html { scroll-behavior: smooth; }

  .in-hero { max-width: 780px; margin: 0 auto; padding: 4rem 1.5rem 1rem; text-align: center; }
  .in-badge { display: inline-flex; background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; border-radius: 20px; padding: 4px 14px; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 1.25rem; }
  .in-hero h1 { font-family: 'Sora', sans-serif; font-size: clamp(2rem, 4.5vw, 2.6rem); font-weight: 800; margin-bottom: 1rem; }
  .in-hero p { color: #64748b; line-height: 1.6; }

  .in-layout { max-width: 1180px; margin: 0 auto; padding: 3rem 1.5rem 5rem; display: grid; grid-template-columns: 220px 1fr; gap: 3rem; align-items: start; }

  .in-toc { position: sticky; top: 80px; display: flex; flex-direction: column; gap: 0.35rem; }
  .in-toc-title { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 0.5rem; }
  .in-toc nav { display: flex; flex-direction: column; }
  .in-toc-link { color: #475569; text-decoration: none; font-size: 0.85rem; padding: 0.4rem 0.6rem; border-radius: 8px; border-left: 2px solid transparent; }
  .in-toc-link:hover { background: #f1f5f9; color: #2563eb; border-left-color: #2563eb; }

  .in-content { min-width: 0; }
  .in-section { padding-bottom: 3rem; margin-bottom: 3rem; border-bottom: 1px solid #f1f5f9; scroll-margin-top: 90px; }
  .in-section:last-child { border-bottom: none; }
  .in-section h2 { font-family: 'Sora', sans-serif; font-size: 1.4rem; font-weight: 800; margin-bottom: 1rem; }
  .in-section h3 { font-family: 'Sora', sans-serif; font-size: 1.05rem; font-weight: 700; margin: 1.75rem 0 0.9rem; }
  .in-section p { color: #334155; line-height: 1.7; margin-bottom: 1rem; }
  .in-section ul, .in-section ol { color: #334155; line-height: 1.7; padding-left: 1.25rem; margin-bottom: 1rem; }
  .in-section li { margin-bottom: 0.5rem; }
  .in-note { background: #f8fafc; border-left: 3px solid #94a3b8; padding: 0.85rem 1rem; font-size: 0.87rem; color: #475569; border-radius: 0 8px 8px 0; }

  .in-grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin: 1.5rem 0; }
  .in-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1.5rem; }
  .in-card-icon { width: 40px; height: 40px; border-radius: 10px; background: #eff6ff; color: #2563eb; display: flex; align-items: center; justify-content: center; margin-bottom: 0.9rem; }
  .in-card h3 { margin: 0 0 0.5rem; font-size: 1rem; }
  .in-card p { font-size: 0.87rem; margin-bottom: 0.75rem; }
  .in-persona-role { color: #2563eb; font-weight: 600; font-size: 0.82rem; }

  .in-table-wrap { overflow-x: auto; margin-bottom: 1.5rem; }
  .in-table { width: 100%; border-collapse: collapse; font-size: 0.87rem; }
  .in-table th, .in-table td { text-align: left; padding: 0.65rem 0.9rem; border-bottom: 1px solid #f1f5f9; }
  .in-table th { color: #94a3b8; font-weight: 700; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.04em; }
  .in-table-compact td, .in-table-compact th { padding: 0.5rem 0.75rem; }

  .in-pill { display: inline-block; font-size: 0.7rem; font-weight: 700; padding: 3px 9px; border-radius: 999px; }
  .in-pill-done { background: #ecfdf5; color: #059669; }
  .in-pill-pending { background: #fef2f2; color: #dc2626; }
  .in-pill-unknown { background: #fffbeb; color: #b45309; }

  .in-checklist { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 1rem; }
  .in-checklist li { border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem 1.25rem; margin: 0; }
  .in-checklist-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; font-weight: 600; font-size: 0.9rem; margin-bottom: 0.35rem; }
  .in-checklist p { margin: 0; font-size: 0.83rem; color: #64748b; }

  .in-arch-flow { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; background: #f8fafc; border-radius: 12px; padding: 1.25rem; margin: 1.25rem 0; font-size: 0.85rem; font-weight: 600; color: #1e3a8a; }
  .in-arch-flow span:nth-child(even) { color: #94a3b8; font-weight: 400; }

  .in-roadmap { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0.6rem; }
  .in-roadmap li { border-radius: 10px; padding: 0.75rem 1rem; font-size: 0.88rem; border-left: 3px solid; }
  .in-roadmap li.done { background: #ecfdf5; border-color: #059669; color: #065f46; }
  .in-roadmap li.pending { background: #fef2f2; border-color: #dc2626; color: #7f1d1d; }

  @media (max-width: 900px) {
    .in-layout { grid-template-columns: 1fr; }
    .in-toc { position: static; flex-direction: row; flex-wrap: wrap; }
  }
`;
