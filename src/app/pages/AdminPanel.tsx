import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";

interface KPIModel {
  vagasHoje: number;
  fontesAtivas: number;
  scrapersComErro: number;
  vagasDuplicadas: number;
  insightsGerados: number;
  ultimaColeta: string;
  usuariosAtivos: number;
  perfisConcluidos: number;
  perfisIncompletos: number;
}

interface ScraperStat {
  fonte: string;
  status: "Ativo" | "Pausado" | "Erro";
  totalRuns: number;
  successRuns: number;
  errorRuns: number;
  totalVagas: number;
  avgDuration: number;
  ultimaExecucao: string | null;
  ultimoStatus: string | null;
  ultimoErro: string | null;
  ultimoErroMsg: string | null;
}

interface LogEntry {
  id: number;
  fonte: string;
  status: "success" | "error";
  vagasColetadas: number;
  erroTipo: string | null;
  erroMensagem: string | null;
  duracaoSegundos: number;
  createdAt: string;
}

interface SkillStat {
  name: string;
  count: number;
}

interface RoleStat {
  name: string;
  count: number;
}

interface UserStat {
  nome: string;
  cidade: string;
  bio: string;
  completed: boolean;
  skills_count: number;
}

interface AdminData {
  kpis: KPIModel;
  topSkills: SkillStat[];
  topRoles: RoleStat[];
  recentUsers: UserStat[];
  scraperLogs: {
    errorsBySource: Record<string, number>;
    errorTypesCount: Record<string, number>;
    sourceStats: ScraperStat[];
    recentLogs: LogEntry[];
  };
}

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8080";

export function AdminPanel() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<AdminData | null>(null);
  const [statsError, setStatsError] = useState("");
  const [activeTab, setActiveTab] = useState<"dashboard" | "scrapers" | "errors" | "users">("dashboard");

  // Check login state
  useEffect(() => {
    const adminToken = localStorage.getItem("worky_admin_token");
    if (adminToken === "worky-admin-session-token") {
      setIsLoggedIn(true);
      fetchStats();
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const response = await fetch(`${API_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (response.ok && data.token) {
        localStorage.setItem("worky_admin_token", data.token);
        setIsLoggedIn(true);
        fetchStats();
      } else {
        setLoginError(data.detail || "Usuário ou senha incorretos.");
      }
    } catch (err) {
      if (username === "admin" && password === "admin") {
        // Local offline fallback if backend server isn't running yet
        localStorage.setItem("worky_admin_token", "worky-admin-session-token");
        setIsLoggedIn(true);
        fetchStats();
      } else {
        setLoginError("Erro ao conectar com o servidor.");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("worky_admin_token");
    setIsLoggedIn(false);
    setDashboardData(null);
  };

  const fetchStats = async () => {
    setIsLoading(true);
    setStatsError("");
    try {
      const token = localStorage.getItem("worky_admin_token") || "worky-admin-session-token";
      const response = await fetch(`${API_URL}/admin/stats`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setDashboardData(data);
      } else {
        setStatsError(data.detail || "Não foi possível carregar as estatísticas.");
      }
    } catch (err) {
      setStatsError("Falha ao comunicar com a API do backend.");
    } finally {
      setIsLoading(false);
    }
  };

  // Automated diagnosis recommendations
  const diagnostics = useMemo(() => {
    if (!dashboardData) return [];
    const list: string[] = [];
    const counts = dashboardData.scraperLogs.errorTypesCount;
    const stats = dashboardData.scraperLogs.sourceStats;

    if ((counts["bloqueio_http"] || 0) > 3) {
      list.push("⚠️ Bloqueio HTTP detectado: Algum scraper está recebendo respostas status 429 ou 403 (Rate-limiting). Recomenda-se implementar rotação de proxies residenciais ou headers adicionais.");
    }
    if ((counts["captcha"] || 0) > 2) {
      list.push("🤖 CAPTCHA Encontrado: Ocorreram desafios do Cloudflare/Akamai. Sugere-se integrar um resolvedor de CAPTCHA automático ou utilizar scrapers baseados em sessões autenticadas ou navegadores headless.");
    }
    if ((counts["timeout"] || 0) > 4) {
      list.push("⏱️ Erro de Timeout frequente: Lentidão na resposta das páginas de destino. Sugere-se aumentar o tempo limite (timeout) para 30 segundos ou otimizar a conexão da máquina hospedeira.");
    }
    if ((counts["parsing"] || 0) > 2) {
      list.push("💻 Falha de Parsing HTML: Um ou mais sites provavelmente mudaram a estrutura do código HTML de suas vagas. Revise os seletores BeautifulSoup da classe JobScraper em scraper.py.");
    }

    // Check individual scrapers
    stats.forEach(s => {
      if (s.status === "Erro") {
        list.push(`🚨 Alerta de Fonte Caída: O scraper ${s.fonte} falhou na última tentativa com erro do tipo: "${s.ultimoErro}". Mensagem original: "${s.ultimoErroMsg}".`);
      }
    });

    if (list.length === 0) {
      list.push("✅ Excelente! Todos os scrapers estão operando de forma saudável. Nenhum alerta pendente.");
    }

    return list;
  }, [dashboardData]);

  if (!isLoggedIn) {
    return (
      <>
        <style>{loginCss}</style>
        <div className="admin-login-container">
          <div className="admin-login-card">
            <h1 className="admin-login-title">Worky Admin</h1>
            <p className="admin-login-subtitle">Acesso Restrito ao Painel Administrativo</p>
            
            <form onSubmit={handleLogin} className="admin-login-form">
              <div className="admin-form-group">
                <label>Usuário</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                />
              </div>
              <div className="admin-form-group">
                <label>Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              {loginError && <p className="admin-login-error">{loginError}</p>}
              
              <button type="submit" className="admin-login-btn">Entrar no Painel</button>
            </form>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{adminPanelCss}</style>
      <div className="admin-root">
        <header className="admin-header">
          <div className="admin-brand">
            <button className="admin-logo" onClick={() => navigate("/")}>Worky</button>
            <span className="admin-badge">Painel Admin</span>
          </div>
          <nav className="admin-nav">
            <button 
              className={`admin-nav-item ${activeTab === "dashboard" ? "active" : ""}`}
              onClick={() => setActiveTab("dashboard")}
            >
              Dashboard Geral
            </button>
            <button 
              className={`admin-nav-item ${activeTab === "scrapers" ? "active" : ""}`}
              onClick={() => setActiveTab("scrapers")}
            >
              Scrapers / Fontes
            </button>
            <button 
              className={`admin-nav-item ${activeTab === "errors" ? "active" : ""}`}
              onClick={() => setActiveTab("errors")}
            >
              Erros & Alertas
            </button>
            <button 
              className={`admin-nav-item ${activeTab === "users" ? "active" : ""}`}
              onClick={() => setActiveTab("users")}
            >
              Usuários & IA
            </button>
          </nav>
          <div className="admin-user-menu">
            <button className="btn-refresh" onClick={fetchStats} disabled={isLoading}>
              {isLoading ? "Buscando..." : "Atualizar"}
            </button>
            <button className="btn-logout" onClick={handleLogout}>Sair</button>
          </div>
        </header>

        <main className="admin-main">
          {isLoading && !dashboardData ? (
            <div className="admin-loading-state">
              <div className="spinner"></div>
              <p>Carregando dados reais do Supabase e SQLite...</p>
            </div>
          ) : statsError ? (
            <div className="admin-error-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <h3>Erro de Comunicação</h3>
              <p>{statsError}</p>
              <button onClick={fetchStats} className="btn-retry">Tentar Novamente</button>
            </div>
          ) : (
            dashboardData && (
              <div className="admin-content-grid">
                
                {/* 1. TAB DASHBOARD */}
                {activeTab === "dashboard" && (
                  <>
                    <section className="admin-section">
                      <h2 className="admin-section-title">Visão Geral do Sistema</h2>
                      <div className="admin-kpis-grid">
                        <div className="admin-kpi-card">
                          <div className="kpi-label">Vagas Coletadas Hoje</div>
                          <div className="kpi-value">{dashboardData.kpis.vagasHoje.toLocaleString("pt-BR")}</div>
                          <div className="kpi-meta success">↑ Atualizadas hoje no cache</div>
                        </div>
                        <div className="admin-kpi-card">
                          <div className="kpi-label">Fontes Ativas</div>
                          <div className="kpi-value">{dashboardData.kpis.fontesAtivas}</div>
                          <div className="kpi-meta success">LinkedIn, Vagas, InfoJobs...</div>
                        </div>
                        <div className="admin-kpi-card">
                          <div className="kpi-label">Scrapers com Erro</div>
                          <div className="kpi-value warning">{dashboardData.kpis.scrapersComErro}</div>
                          <div className="kpi-meta danger">Requer atenção diagnóstica</div>
                        </div>
                        <div className="admin-kpi-card">
                          <div className="kpi-label">Duplicadas Detectadas</div>
                          <div className="kpi-value">{dashboardData.kpis.vagasDuplicadas.toLocaleString("pt-BR")}</div>
                          <div className="kpi-meta muted">Filtradas pelo banco de dados</div>
                        </div>
                        <div className="admin-kpi-card">
                          <div className="kpi-label">Filtros & Insights Gerados</div>
                          <div className="kpi-value primary">{dashboardData.kpis.insightsGerados}</div>
                          <div className="kpi-meta success">Pelo motor OpenAI GPT</div>
                        </div>
                        <div className="admin-kpi-card">
                          <div className="kpi-label">Última Coleta Executada</div>
                          <div className="kpi-value text-small">{dashboardData.kpis.ultimaColeta}</div>
                          <div className="kpi-meta success">Em tempo real via scraper</div>
                        </div>
                      </div>
                    </section>

                    <div className="admin-two-cols">
                      {/* Left: Scraper Status Table */}
                      <div className="admin-card">
                        <div className="card-header">
                          <h3>Status Atual dos Scrapers</h3>
                          <button className="card-action-btn" onClick={() => setActiveTab("scrapers")}>Ver detalhado →</button>
                        </div>
                        <div className="card-body scrollable">
                          <table className="admin-table">
                            <thead>
                              <tr>
                                <th>Fonte</th>
                                <th>Status</th>
                                <th>Última Execução</th>
                                <th>Vagas</th>
                                <th>Erros</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dashboardData.scraperLogs.sourceStats.map(stat => (
                                <tr key={stat.fonte}>
                                  <td className="bold">{stat.fonte}</td>
                                  <td>
                                    <span className={`status-badge ${stat.status.toLowerCase()}`}>
                                      {stat.status}
                                    </span>
                                  </td>
                                  <td>{stat.ultimaExecucao ? new Date(stat.ultimaExecucao).toLocaleTimeString("pt-BR", {hour: '2-digit', minute:'2-digit'}) : "Não registrada"}</td>
                                  <td>{stat.totalVagas}</td>
                                  <td className={stat.errorRuns > 0 ? "danger bold" : ""}>{stat.errorRuns}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Right: Active Users KPIs */}
                      <div className="admin-card">
                        <div className="card-header">
                          <h3>KPIs de Usuários Ativos (Supabase)</h3>
                          <button className="card-action-btn" onClick={() => setActiveTab("users")}>Ver usuários →</button>
                        </div>
                        <div className="card-body">
                          <div className="users-stats-box">
                            <div className="user-stat-item">
                              <span className="user-stat-num">{dashboardData.kpis.usuariosAtivos}</span>
                              <span className="user-stat-lbl">Perfis Criados</span>
                            </div>
                            <div className="user-stat-item">
                              <span className="user-stat-num success">{dashboardData.kpis.perfisConcluidos}</span>
                              <span className="user-stat-lbl">Finalizados com IA</span>
                            </div>
                            <div className="user-stat-item">
                              <span className="user-stat-num danger">{dashboardData.kpis.perfisIncompletos}</span>
                              <span className="user-stat-lbl">Cadastros Incompletos</span>
                            </div>
                          </div>

                          <h4 style={{ marginTop: "1.5rem", marginBottom: "0.5rem", fontSize: "0.85rem", textTransform: "uppercase", color: "var(--on-surface-muted)" }}>Habilidades Mais Buscadas</h4>
                          <div className="skills-wrap">
                            {dashboardData.topSkills.map((s, idx) => (
                              <span key={s.name} className="admin-skill-tag">
                                <strong>{idx + 1}.</strong> {s.name} ({s.count})
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* 2. TAB SCRAPERS */}
                {activeTab === "scrapers" && (
                  <section className="admin-section">
                    <h2 className="admin-section-title">Gerenciamento de Scrapers & Fontes de Coleta</h2>
                    <div className="admin-card">
                      <div className="card-body">
                        <table className="admin-table hoverable">
                          <thead>
                            <tr>
                              <th>Fonte de Vagas</th>
                              <th>Status Operacional</th>
                              <th>Execuções</th>
                              <th>Sucessos</th>
                              <th>Falhas</th>
                              <th>Vagas Obtidas</th>
                              <th>Duração Média</th>
                              <th>Última Execução (UTC)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dashboardData.scraperLogs.sourceStats.map(stat => (
                              <tr key={stat.fonte}>
                                <td className="bold" style={{ fontSize: "1.05rem" }}>{stat.fonte}</td>
                                <td>
                                  <span className={`status-badge ${stat.status.toLowerCase()}`}>
                                    {stat.status === "Ativo" ? "Ativo (Online)" : stat.status === "Erro" ? "Erro Operacional" : "Pausado / Sem Dados"}
                                  </span>
                                </td>
                                <td>{stat.totalRuns}</td>
                                <td className="success bold">{stat.successRuns}</td>
                                <td className={stat.errorRuns > 0 ? "danger bold" : ""}>{stat.errorRuns}</td>
                                <td>{stat.totalVagas}</td>
                                <td>{stat.avgDuration}s</td>
                                <td style={{ fontSize: "0.8rem", color: "var(--on-surface-muted)" }}>
                                  {stat.ultimaExecucao ? new Date(stat.ultimaExecucao).toLocaleString("pt-BR") : "Nunca executado"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="admin-card" style={{ marginTop: "1.5rem" }}>
                      <div className="card-header">
                        <h3>Diagnóstico Automático das Fontes</h3>
                      </div>
                      <div className="card-body">
                        <div className="diagnostics-list">
                          {diagnostics.map((diag, idx) => (
                            <div key={idx} className="diagnostic-item">
                              {diag}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* 3. TAB ERRORS */}
                {activeTab === "errors" && (
                  <section className="admin-section">
                    <h2 className="admin-section-title">Monitoramento de Erros e Alertas em Tempo Real</h2>
                    
                    <div className="admin-two-cols">
                      {/* Left: Error types distribution */}
                      <div className="admin-card">
                        <div className="card-header">
                          <h3>Distribuição de Erros por Categoria</h3>
                        </div>
                        <div className="card-body">
                          <div className="error-categories-list">
                            <div className="error-category-item">
                              <span className="err-cat-name">⏱️ Erros de Timeout (Site indisponível ou lerdo)</span>
                              <span className="err-cat-badge">{dashboardData.scraperLogs.errorTypesCount["timeout"] || 0}</span>
                            </div>
                            <div className="error-category-item">
                              <span className="err-cat-name">🤖 CAPTCHAs Detectados (Páginas bloqueadas)</span>
                              <span className="err-cat-badge warning">{dashboardData.scraperLogs.errorTypesCount["captcha"] || 0}</span>
                            </div>
                            <div className="error-category-item">
                              <span className="err-cat-name">🔒 Bloqueios HTTP (Rate limited / Status 429 ou 403)</span>
                              <span className="err-cat-badge danger">{dashboardData.scraperLogs.errorTypesCount["bloqueio_http"] || 0}</span>
                            </div>
                            <div className="error-category-item">
                              <span className="err-cat-name">⚙️ Falhas de Parsing (Mudança no HTML/DOM)</span>
                              <span className="err-cat-badge">{dashboardData.scraperLogs.errorTypesCount["parsing"] || 0}</span>
                            </div>
                            <div className="error-category-item">
                              <span className="err-cat-name">📂 Campos Ausentes (Vagas inválidas ou vazias)</span>
                              <span className="err-cat-badge">{dashboardData.scraperLogs.errorTypesCount["campos_ausentes"] || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Automated Diagnostic suggestions */}
                      <div className="admin-card">
                        <div className="card-header">
                          <h3>Sugestões de Resolução de Erros</h3>
                        </div>
                        <div className="card-body">
                          <div className="resolution-panel">
                            {dashboardData.scraperLogs.errorTypesCount["bloqueio_http"] > 0 && (
                              <div className="resolution-tip">
                                <strong>Para Bloqueios HTTP (429/403):</strong>
                                <p>Rotacionar o cabeçalho "User-Agent" ou usar bibliotecas que contornam impressões digitais de navegadores, como `curl-cffi` ou configurar proxies residenciais no `httpx.AsyncClient` em `scraper.py`.</p>
                              </div>
                            )}
                            {dashboardData.scraperLogs.errorTypesCount["timeout"] > 0 && (
                              <div className="resolution-tip">
                                <strong>Para Erros de Timeout:</strong>
                                <p>Aumentar o valor de `timeout=20` para `timeout=40` nas conexões HTTP em `scraper.py` ou adicionar timeouts adaptativos com mecanismos de retentativa (Retries).</p>
                              </div>
                            )}
                            {dashboardData.scraperLogs.errorTypesCount["parsing"] > 0 && (
                              <div className="resolution-tip">
                                <strong>Para Falhas de Parsing DOM:</strong>
                                <p>Verificar se os seletores BeautifulSoup (`select("li.vaga")`, etc.) foram alterados pelos portais de origem. Realizar inspeção manual do HTML dos scrapers afetados.</p>
                              </div>
                            )}
                            {!dashboardData.scraperLogs.errorTypesCount["bloqueio_http"] && !dashboardData.scraperLogs.errorTypesCount["timeout"] && !dashboardData.scraperLogs.errorTypesCount["parsing"] && (
                              <p className="success bold">Nenhum erro sério registrado recentemente. Tudo operacional!</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="admin-card" style={{ marginTop: "1.5rem" }}>
                      <div className="card-header">
                        <h3>Feed de Logs de Coleta Recentes (SQLite)</h3>
                      </div>
                      <div className="card-body scrollable max-height-medium">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Data/Hora (UTC)</th>
                              <th>Fonte</th>
                              <th>Status</th>
                              <th>Duração</th>
                              <th>Coleta</th>
                              <th>Erros / Detalhes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dashboardData.scraperLogs.recentLogs.map(log => (
                              <tr key={log.id}>
                                <td style={{ fontSize: "0.8rem", color: "var(--on-surface-muted)" }}>
                                  {new Date(log.createdAt).toLocaleString("pt-BR")}
                                </td>
                                <td className="bold">{log.fonte}</td>
                                <td>
                                  <span className={`status-badge ${log.status}`}>
                                    {log.status === "success" ? "Sucesso" : "Falha"}
                                  </span>
                                </td>
                                <td>{log.duracaoSegundos}s</td>
                                <td>{log.vagasColetadas} vagas</td>
                                <td className={log.erroTipo ? "danger" : ""} style={{ fontSize: "0.8rem" }}>
                                  {log.erroTipo ? `[${log.erroTipo}] ${log.erroMensagem}` : "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </section>
                )}

                {/* 4. TAB USERS */}
                {activeTab === "users" && (
                  <section className="admin-section">
                    <h2 className="admin-section-title">Usuários Cadastrados & Insights de IA (Supabase)</h2>
                    
                    <div className="admin-two-cols">
                      {/* Left: Top Skills & Careers */}
                      <div className="admin-card">
                        <div className="card-header">
                          <h3>Distribuição de Competências dos Usuários</h3>
                        </div>
                        <div className="card-body">
                          <table className="admin-table">
                            <thead>
                              <tr>
                                <th>#</th>
                                <th>Competência</th>
                                <th>Usuários que a Possuem</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dashboardData.topSkills.map((skill, idx) => (
                                <tr key={skill.name}>
                                  <td>{idx + 1}</td>
                                  <td className="bold">{skill.name}</td>
                                  <td>{skill.count}</td>
                                </tr>
                              ))}
                              {dashboardData.topSkills.length === 0 && (
                                <tr>
                                  <td colSpan={3} className="text-center">Nenhum perfil profissional cadastrado na base.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Right: Top Careers / Bios */}
                      <div className="admin-card">
                        <div className="card-header">
                          <h3>Principais Perfis Profissionais (Bios)</h3>
                        </div>
                        <div className="card-body">
                          <table className="admin-table">
                            <thead>
                              <tr>
                                <th>#</th>
                                <th>Perfil / Bio / Objetivo</th>
                                <th>Ocorrências</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dashboardData.topRoles.map((role, idx) => (
                                <tr key={role.name}>
                                  <td>{idx + 1}</td>
                                  <td className="bold">{role.name}</td>
                                  <td>{role.count}</td>
                                </tr>
                              ))}
                              {dashboardData.topRoles.length === 0 && (
                                <tr>
                                  <td colSpan={3} className="text-center">Nenhum dado cadastrado na base.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    <div className="admin-card" style={{ marginTop: "1.5rem" }}>
                      <div className="card-header">
                        <h3>Lista de Perfis Profissionais Cadastrados (Supabase)</h3>
                      </div>
                      <div className="card-body scrollable max-height-medium">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Nome</th>
                              <th>Localização</th>
                              <th>Perfil / Bio</th>
                              <th>Cadastro Concluído?</th>
                              <th>Qtd Competências</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dashboardData.recentUsers.map((u, idx) => (
                              <tr key={idx}>
                                <td className="bold">{u.nome}</td>
                                <td>{u.cidade}</td>
                                <td>{u.bio}</td>
                                <td>
                                  <span className={`status-badge ${u.completed ? "success" : "warning"}`}>
                                    {u.completed ? "Concluído" : "Incompleto"}
                                  </span>
                                </td>
                                <td>{u.skills_count} competências</td>
                              </tr>
                            ))}
                            {dashboardData.recentUsers.length === 0 && (
                              <tr>
                                <td colSpan={5} className="text-center">Nenhum usuário cadastrado até o momento.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </section>
                )}

              </div>
            )
          )}
        </main>
      </div>
    </>
  );
}

// PREMIUM Glassmorphism login stylesheets
const loginCss = `
.admin-login-container {
  display: flex; align-items: center; justify-content: center;
  min-height: 100vh; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
  font-family: 'Inter', sans-serif; color: #f8fafc; padding: 1rem;
}
.admin-login-card {
  width: 100%; max-width: 420px; background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px; padding: 2.5rem;
  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
  animation: admin-fade-in 0.3s ease;
}
@keyframes admin-fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.admin-login-title {
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 2rem; font-weight: 800;
  text-align: center; color: #ffffff; letter-spacing: -0.03em; margin-bottom: 0.25rem;
}
.admin-login-subtitle {
  font-size: 0.85rem; color: #94a3b8; text-align: center; margin-bottom: 2rem;
}
.admin-login-form { display: flex; flex-direction: column; gap: 1.25rem; }
.admin-form-group { display: flex; flex-direction: column; gap: 6px; }
.admin-form-group label { font-size: 0.8rem; font-weight: 600; color: #cbd5e1; }
.admin-form-group input {
  background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px; padding: 0.75rem 1rem; color: white; font-size: 0.95rem;
  outline: none; transition: all 0.2s;
}
.admin-form-group input:focus {
  border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
}
.admin-login-error { color: #f87171; font-size: 0.82rem; font-weight: 500; text-align: center; }
.admin-login-btn {
  background: #2563eb; color: white; font-size: 0.95rem; font-weight: 700;
  padding: 0.8rem; border-radius: 12px; border: none; cursor: pointer;
  transition: all 0.15s; margin-top: 0.5rem;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}
.admin-login-btn:hover { background: #3b82f6; transform: translateY(-1px); }
.admin-login-btn:active { transform: translateY(0); }
`;

// PREMIUM Dashboard stylesheet following existing Worky theme
const adminPanelCss = `
:root {
  --admin-bg: #f8fafc;
  --admin-card: #ffffff;
  --admin-border: #e2e8f0;
  --admin-text: #0f172a;
  --admin-text-muted: #64748b;
  --admin-primary: #2563eb;
  --admin-success: #10b981;
  --admin-danger: #ef4444;
  --admin-warning: #f59e0b;
}

.admin-root {
  min-height: 100vh; background: var(--admin-bg);
  color: var(--admin-text); font-family: 'Inter', sans-serif;
  display: flex; flex-direction: column;
}

.admin-header {
  position: sticky; top: 0; z-index: 50;
  display: flex; justify-content: space-between; align-items: center;
  padding: 0 2rem; height: 65px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px); border-bottom: 1px solid var(--admin-border);
}

.admin-brand { display: flex; align-items: center; gap: 8px; }
.admin-logo {
  font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 1.25rem;
  color: var(--admin-primary); background: none; border: none; cursor: pointer;
  outline: none; padding: 0;
}
.admin-badge {
  background: #eff6ff; color: var(--admin-primary); font-size: 0.72rem;
  font-weight: 700; padding: 3px 8px; border-radius: 6px;
  text-transform: uppercase; letter-spacing: 0.05em;
}

.admin-nav { display: flex; gap: 1.5rem; height: 100%; align-items: center; }
.admin-nav-item {
  background: none; border: none; font-family: 'Inter', sans-serif;
  font-size: 0.875rem; font-weight: 500; color: var(--admin-text-muted);
  cursor: pointer; padding: 0.4rem 0.8rem; border-radius: 8px;
  transition: all 0.2s;
}
.admin-nav-item:hover { color: var(--admin-text); background: #f1f5f9; }
.admin-nav-item.active {
  color: var(--admin-primary); background: #eff6ff; font-weight: 600;
}

.admin-user-menu { display: flex; align-items: center; gap: 10px; }
.btn-refresh {
  background: white; border: 1px solid var(--admin-border);
  color: var(--admin-text); font-size: 0.8rem; font-weight: 600;
  padding: 0.45rem 1rem; border-radius: 8px; cursor: pointer;
  transition: all 0.15s;
}
.btn-refresh:hover { background: #f8fafc; }
.btn-refresh:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-logout {
  background: var(--admin-danger); color: white; border: none;
  font-size: 0.8rem; font-weight: 600; padding: 0.45rem 1rem;
  border-radius: 8px; cursor: pointer; transition: all 0.15s;
}
.btn-logout:hover { opacity: 0.9; }

.admin-main { flex: 1; padding: 2rem; max-width: 1300px; width: 100%; margin: 0 auto; }

.admin-loading-state, .admin-error-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 50vh; gap: 1rem; text-align: center;
}
.spinner {
  width: 40px; height: 40px; border: 3px solid #dbeafe;
  border-top-color: var(--admin-primary); border-radius: 50%;
  animation: admin-spin 1s linear infinite;
}
@keyframes admin-spin { to { transform: rotate(360deg); } }

.btn-retry {
  background: var(--admin-primary); color: white; border: none;
  padding: 0.5rem 1.25rem; border-radius: 8px; font-weight: 600; cursor: pointer;
}

.admin-section { margin-bottom: 2rem; animation: admin-fade-in 0.25s ease; }
.admin-section-title {
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.35rem; font-weight: 700;
  color: var(--admin-text); margin-bottom: 1.25rem;
}

.admin-kpis-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 1.25rem; margin-bottom: 1.5rem;
}
.admin-kpi-card {
  background: var(--admin-card); border: 1px solid var(--admin-border);
  border-radius: 16px; padding: 1.25rem; box-shadow: 0 2px 8px rgba(0,0,0,0.02);
}
.kpi-label { font-size: 0.72rem; color: var(--admin-text-muted); font-weight: 600; text-transform: uppercase; margin-bottom: 6px; }
.kpi-value { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.75rem; font-weight: 800; color: var(--admin-text); margin-bottom: 4px; }
.kpi-value.warning { color: var(--admin-warning); }
.kpi-value.danger { color: var(--admin-danger); }
.kpi-value.primary { color: var(--admin-primary); }
.kpi-value.text-small { font-size: 1.15rem; font-weight: 700; padding: 6px 0; }
.kpi-meta { font-size: 0.7rem; font-weight: 500; }
.kpi-meta.success { color: var(--admin-success); }
.kpi-meta.danger { color: var(--admin-danger); }
.kpi-meta.muted { color: var(--admin-text-muted); }

.admin-two-cols {
  display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;
}
@media (max-width: 900px) {
  .admin-two-cols { grid-template-columns: 1fr; }
}

.admin-card {
  background: var(--admin-card); border: 1px solid var(--admin-border);
  border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);
  display: flex; flex-direction: column; overflow: hidden;
}
.card-header {
  padding: 1rem 1.25rem; border-bottom: 1px solid var(--admin-border);
  display: flex; justify-content: space-between; align-items: center;
}
.card-header h3 { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.95rem; font-weight: 700; }
.card-action-btn {
  background: none; border: none; color: var(--admin-primary); font-size: 0.78rem;
  font-weight: 600; cursor: pointer;
}
.card-action-btn:hover { text-decoration: underline; }

.card-body { padding: 1.25rem; }
.card-body.scrollable { overflow-x: auto; }
.scrollable { overflow: auto; }
.max-height-medium { max-height: 400px; }

.admin-table {
  width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem;
}
.admin-table th {
  padding: 10px 12px; border-bottom: 1px solid var(--admin-border);
  color: var(--admin-text-muted); font-weight: 600; font-size: 0.75rem; text-transform: uppercase;
}
.admin-table td {
  padding: 12px; border-bottom: 1px solid var(--admin-border);
  color: var(--admin-text); vertical-align: middle;
}
.admin-table.hoverable tbody tr:hover { background: #f8fafc; }
.admin-table .bold { font-weight: 600; }
.admin-table .success { color: var(--admin-success); }
.admin-table .danger { color: var(--admin-danger); }

.status-badge {
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 0.68rem; font-weight: 700; padding: 2px 8px; border-radius: 20px;
  text-transform: uppercase;
}
.status-badge.ativo, .status-badge.success {
  background: #e8faf0; color: var(--admin-success);
}
.status-badge.pausado, .status-badge.warning {
  background: #fffbeb; color: var(--admin-warning);
}
.status-badge.erro, .status-badge.error, .status-badge.falha {
  background: #fef2f2; color: var(--admin-danger);
}

.users-stats-box { display: flex; gap: 12px; }
.user-stat-item {
  flex: 1; background: #f8fafc; border: 1px solid var(--admin-border);
  border-radius: 12px; padding: 10px; display: flex; flex-direction: column;
  align-items: center; text-align: center;
}
.user-stat-num { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.35rem; font-weight: 800; }
.user-stat-num.success { color: var(--admin-success); }
.user-stat-num.danger { color: var(--admin-danger); }
.user-stat-lbl { font-size: 0.65rem; color: var(--admin-text-muted); font-weight: 600; text-transform: uppercase; margin-top: 2px; }

.skills-wrap { display: flex; flex-wrap: wrap; gap: 6px; }
.admin-skill-tag {
  background: #f1f5f9; border: 1px solid #e2e8f0; color: #475569;
  font-size: 0.72rem; font-weight: 500; padding: 3px 8px; border-radius: 6px;
}

.diagnostics-list { display: flex; flex-direction: column; gap: 10px; }
.diagnostic-item {
  background: #f8fafc; border-left: 3px solid var(--admin-primary);
  padding: 12px; border-radius: 0 12px 12px 0; font-size: 0.85rem; line-height: 1.5;
}

.error-categories-list { display: flex; flex-direction: column; gap: 8px; }
.error-category-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 12px; background: #f8fafc; border: 1px solid var(--admin-border);
  border-radius: 8px; font-size: 0.8rem; font-weight: 500;
}
.err-cat-badge {
  background: #e2e8f0; color: #475569; font-weight: 700; font-size: 0.75rem;
  width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
}
.err-cat-badge.warning { background: #fffbeb; color: var(--admin-warning); }
.err-cat-badge.danger { background: #fef2f2; color: var(--admin-danger); }

.resolution-panel { display: flex; flex-direction: column; gap: 12px; }
.resolution-tip {
  border: 1px dashed var(--admin-border); padding: 10px 12px; border-radius: 10px;
  font-size: 0.8rem;
}
.resolution-tip strong { display: block; color: var(--admin-primary); margin-bottom: 4px; }
.resolution-tip p { margin: 0; color: var(--admin-text-muted); line-height: 1.4; }
`;
