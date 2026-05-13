import { useState, useRef, useEffect, useMemo, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { jobService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { getUserFirstName } from "../services/auth";

const style = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@400;500&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; background: #f5f6fa; }

  .ha-root { font-family: 'Inter', sans-serif; color: #0f172a; background: #f5f6fa; min-height: 100vh; }

  .ha-nav {
    position: sticky; top: 0; z-index: 50;
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid #e2e8f0;
    padding: 0 2rem;
    display: flex; align-items: center; justify-content: space-between;
    height: 60px;
  }
  .ha-nav-logo { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 1.1rem; color: #003ec7; background: none; border: none; cursor: pointer; }
  .ha-nav-links { display: flex; gap: 2rem; align-items: center; }
  .ha-nav-link { background: none; border: none; font-family: 'Inter', sans-serif; font-size: 0.875rem; color: #64748b; text-decoration: none; cursor: pointer; }
  .ha-nav-link.active { color: #2563eb; font-weight: 500; border-bottom: 2px solid #2563eb; padding-bottom: 2px; }
  .ha-nav-actions { display: flex; gap: 0.75rem; align-items: center; }
  .btn-ghost { background: none; border: none; font-size: 0.875rem; color: #374151; cursor: pointer; padding: 0.4rem 0.75rem; border-radius: 6px; }
  .btn-ghost:hover { background: #f1f5f9; }
  .btn-primary { background: #2563eb; color: white; border: none; padding: 0.45rem 1.1rem; border-radius: 20px; font-size: 0.875rem; font-weight: 500; cursor: pointer; }
  .btn-primary:hover { background: #1d4ed8; }

  .ha-hero {
    text-align: center;
    padding: 5rem 1.5rem 3.5rem;
    background: linear-gradient(180deg, #ffffff 0%, #f5f6fa 100%);
  }
  .ha-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: #eff6ff; color: #2563eb;
    border: 1px solid #bfdbfe;
    border-radius: 20px; padding: 4px 14px;
    font-size: 0.72rem; font-weight: 600; letter-spacing: 0.08em;
    text-transform: uppercase; margin-bottom: 1.75rem;
  }
  .ha-hero-title {
    font-family: 'Sora', sans-serif;
    font-size: clamp(2.2rem, 5vw, 3.4rem);
    font-weight: 800; line-height: 1.15;
    color: #0f172a; margin-bottom: 1.1rem;
    max-width: 700px; margin-left: auto; margin-right: auto;
  }
  .ha-hero-title .accent { color: #2563eb; }
  .ha-hero-sub {
    font-size: 0.95rem; color: #64748b; line-height: 1.6;
    max-width: 480px; margin: 0 auto 2rem;
  }
  .ha-search-container { position: relative; max-width: 560px; margin: 0 auto 1.5rem; }
  .ha-search-wrap {
    display: flex;
    background: white; border-radius: 50px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 2px 16px rgba(0,0,0,0.07);
    overflow: hidden; padding: 5px 5px 5px 16px;
    align-items: center; gap: 8px;
  }
  .ha-category-dropdown {
    position: absolute; top: calc(100% + 8px); left: 0; right: 0;
    background: white; border: 1px solid #e2e8f0;
    border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.12);
    max-height: 380px; overflow-y: auto; z-index: 100; padding: 8px 0;
  }
  .ha-cat-area {
    padding: 8px 16px 2px; font-size: 0.7rem; font-weight: 700;
    color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em;
  }
  .ha-cat-item {
    display: block; width: 100%; text-align: left;
    padding: 9px 16px; background: none; border: none;
    font-size: 0.875rem; color: #374151; cursor: pointer;
    font-family: 'Inter', sans-serif; transition: background 0.1s;
  }
  .ha-cat-item:hover { background: #f1f5f9; color: #2563eb; }
  .ha-cat-divider { height: 1px; background: #f1f5f9; margin: 6px 0; }
  .ha-search-wrap svg { color: #94a3b8; flex-shrink: 0; }
  .ha-search-input {
    flex: 1; min-width: 0; border: none; outline: none;
    font-size: 0.875rem; color: #374151; background: none;
    font-family: 'Inter', sans-serif;
  }
  .ha-search-input::placeholder { color: #94a3b8; }
  .btn-search {
    background: #2563eb; color: white; border: none;
    padding: 0.55rem 1.3rem; border-radius: 50px;
    font-size: 0.875rem; font-weight: 500; cursor: pointer;
    white-space: nowrap; display: flex; align-items: center; gap: 6px;
  }
  .btn-search:hover { background: #1d4ed8; }
  .ha-tags { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; }
  .ha-tag {
    color: #64748b; font-size: 0.82rem; cursor: pointer;
    padding: 4px 10px; border-radius: 20px; border: 1px solid #e2e8f0;
    background: white; font-family: 'Inter', sans-serif;
  }
  .ha-tag:hover { border-color: #2563eb; color: #2563eb; }

  .ha-section { max-width: 920px; margin: 0 auto; padding: 0 1.5rem 3rem; }
  .ha-termo-card {
    background: white; border-radius: 20px;
    border: 1px solid #e2e8f0;
    display: grid; grid-template-columns: 1fr 220px;
    overflow: hidden;
    box-shadow: 0 2px 20px rgba(0,0,0,0.05);
  }
  .ha-termo-left { padding: 1.5rem 1.75rem; }
  .ha-termo-header { display: flex; align-items: center; gap: 10px; margin-bottom: 1.25rem; flex-wrap: wrap; }
  .ha-termo-title { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 0.95rem; color: #0f172a; }
  .ha-termo-sub { font-size: 0.78rem; color: #94a3b8; }
  .ha-termo-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
  .ha-termo-item-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 6px; }
  .ha-termo-name { font-size: 0.8rem; color: #374151; font-weight: 500; line-height: 1.3; }
  .ha-termo-pct { font-size: 0.75rem; color: #16a34a; font-weight: 600; }
  .ha-termo-bars { display: flex; align-items: flex-end; gap: 2px; height: 36px; }
  .ha-termo-bar { width: 6px; border-radius: 2px; background: #dbeafe; }
  .ha-termo-bar.active { background: #2563eb; }
  .ha-insight {
    background: #0d9488; color: white;
    padding: 1.5rem; display: flex; flex-direction: column; justify-content: center;
  }
  .ha-insight-badge {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 0.65rem; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; margin-bottom: 0.75rem;
    opacity: 0.85;
  }
  .ha-insight-text { font-size: 0.88rem; line-height: 1.5; font-weight: 500; }
  .ha-insight-text span { text-decoration: underline; }
  .ha-insight-meta { font-size: 0.72rem; opacity: 0.65; margin-top: 0.75rem; }

  .ha-features-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  .ha-feat-card {
    border-radius: 18px; padding: 1.6rem;
    border: 1px solid #e2e8f0; background: white;
    overflow: hidden; position: relative;
  }
  .ha-feat-card.dark { background: #0f172a; border-color: #1e293b; }
  .ha-feat-card.teal { background: #0d9488; border-color: #0d9488; }
  .ha-feat-card.blue { background: #2563eb; border-color: #2563eb; overflow: hidden; }
  .ha-feat-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; }
  .ha-feat-title { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 1rem; margin-bottom: 0.5rem; }
  .ha-feat-text { font-size: 0.82rem; line-height: 1.6; color: #64748b; }
  .ha-feat-card.dark .ha-feat-title,
  .ha-feat-card.dark .ha-feat-text { color: #e2e8f0; }
  .ha-feat-card.teal .ha-feat-title,
  .ha-feat-card.teal .ha-feat-text { color: white; }
  .ha-feat-card.blue .ha-feat-title { color: white; }
  .ha-feat-card.blue .ha-feat-text { color: rgba(255,255,255,0.75); }

  .ha-salary-chart {
    margin-top: 1rem; height: 48px;
    background: #0f172a; border-radius: 8px;
    display: flex; align-items: flex-end; padding: 6px 8px; gap: 3px;
  }
  .ha-salary-bar { flex: 1; border-radius: 2px; background: #0d9488; opacity: 0.7; }
  .ha-salary-bar:nth-child(4n) { opacity: 1; background: #14b8a6; }

  .ha-skill-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 1rem; }
  .ha-skill-tag {
    background: rgba(255,255,255,0.2); color: white;
    font-size: 0.72rem; font-weight: 500;
    padding: 4px 10px; border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.3);
  }

  .ha-feat-card.blue {
    display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; align-items: center;
  }
  .ha-blue-label { font-size: 0.72rem; color: rgba(255,255,255,0.7); font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 0.5rem; }
  .ha-blue-title { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 1rem; color: white; margin-bottom: 0.6rem; }
  .ha-blue-text { font-size: 0.8rem; color: rgba(255,255,255,0.75); line-height: 1.5; margin-bottom: 1rem; }
  .btn-white { background: white; color: #2563eb; border: none; padding: 0.45rem 1rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600; cursor: pointer; }
  .btn-white:hover { background: #eff6ff; }
  .ha-blue-visual {
    background: rgba(0,0,0,0.2); border-radius: 12px; height: 120px;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
  }

  .ha-lightning-icon { width: 40px; height: 40px; background: #fef3c7; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; }

  .ha-cta-section {
    background: white; padding: 5rem 1.5rem;
    text-align: center; position: relative; overflow: hidden;
  }
  .ha-cta-bg {
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 60% 50% at 50% 120%, rgba(37,99,235,0.07) 0%, transparent 70%);
    pointer-events: none;
  }
  .ha-cta-title {
    font-family: 'Sora', sans-serif;
    font-size: clamp(2rem, 4vw, 3rem);
    font-weight: 800; color: #0f172a; line-height: 1.2;
    margin-bottom: 0.75rem;
  }
  .ha-cta-title em { font-style: italic; color: #2563eb; }
  .ha-cta-sub { font-size: 0.9rem; color: #64748b; margin-bottom: 2.5rem; max-width: 360px; margin-left: auto; margin-right: auto; }
  .ha-cta-btns { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
  .btn-cta-primary {
    background: #2563eb; color: white; border: none;
    padding: 0.75rem 1.75rem; border-radius: 50px;
    font-size: 0.9rem; font-weight: 600; cursor: pointer;
  }
  .btn-cta-primary:hover { background: #1d4ed8; }
  .btn-cta-ghost {
    background: white; color: #374151;
    border: 1px solid #e2e8f0;
    padding: 0.75rem 1.75rem; border-radius: 50px;
    font-size: 0.9rem; font-weight: 500; cursor: pointer;
  }
  .btn-cta-ghost:hover { border-color: #2563eb; color: #2563eb; }

  .ha-footer {
    background: white; border-top: 1px solid #e2e8f0;
    padding: 1.5rem 2rem;
    display: flex; justify-content: space-between; align-items: center;
    flex-wrap: wrap; gap: 1rem;
  }
  .ha-footer-logo { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 0.9rem; color: #003ec7; }
  .ha-footer-copy { font-size: 0.78rem; color: #94a3b8; margin-top: 2px; }
  .ha-footer-links { display: flex; gap: 1.5rem; flex-wrap: wrap; }
  .ha-footer-link { background: none; border: none; font-family: 'Inter', sans-serif; font-size: 0.8rem; color: #64748b; cursor: pointer; }
  .ha-footer-link:hover { color: #2563eb; }

  @media (max-width: 720px) {
    .ha-nav { height: auto; min-height: 60px; flex-wrap: wrap; gap: 0.75rem; padding: 0.75rem 1rem; }
    .ha-nav-links { order: 3; width: 100%; justify-content: center; gap: 1.25rem; }
    .ha-nav-actions { margin-left: auto; }
    .ha-hero { padding-top: 3rem; }
  }

  @media (max-width: 640px) {
    .ha-search-wrap { border-radius: 24px; align-items: stretch; }
    .btn-search { padding-left: 1rem; padding-right: 1rem; }
    .ha-termo-card { grid-template-columns: 1fr; }
    .ha-termo-grid { grid-template-columns: repeat(2, 1fr); }
    .ha-features-grid { grid-template-columns: 1fr; }
    .ha-feat-card.blue { grid-template-columns: 1fr; }
    .ha-footer { align-items: flex-start; }
  }
`;

const NetworkSVG = () => (
  <svg viewBox="0 0 120 100" width="100%" height="100%">
    {[[60, 50], [20, 20], [100, 20], [15, 70], [105, 70], [50, 85], [75, 15]].map(([cx, cy], i) => (
      <circle key={i} cx={cx} cy={cy} r={i === 0 ? 5 : 3} fill="rgba(255,255,255,0.6)" />
    ))}
    {[[60, 50, 20, 20], [60, 50, 100, 20], [60, 50, 15, 70], [60, 50, 105, 70], [20, 20, 75, 15], [100, 20, 75, 15], [15, 70, 50, 85]].map(([x1, y1, x2, y2], i) => (
      <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
    ))}
  </svg>
);

const CATEGORIES = [
  { area: "🔥 Populares", items: ["Desenvolvedor", "Designer", "Analista de Dados", "Marketing", "Vendas", "Contador", "Advogado", "RH"] },
  { area: "💻 Tecnologia", items: ["Desenvolvedor Frontend", "Desenvolvedor Backend", "DevOps", "Data Science", "Mobile", "QA", "Segurança da Informação", "FullStack"] },
  { area: "⚖️ Jurídico", items: ["Advogado", "Analista Jurídico", "Assessor Jurídico", "Gerente Jurídico", "Paralegal"] },
  { area: "💰 Financeiro", items: ["Contador", "Analista Financeiro", "Controller", "Auditor", "Analista de Crédito", "Gerente Financeiro"] },
  { area: "📊 Marketing", items: ["Analista de Marketing", "Social Media", "Growth Hacker", "Gestor de Tráfego", "SEO", "Copywriter"] },
  { area: "🛒 Comercial", items: ["Vendedor", "Representante Comercial", "Gerente Comercial", "Consultor Comercial", "Account Manager"] },
  { area: "👥 RH", items: ["Analista de RH", "Recrutador", "HRBP", "Gerente de RH", "Psicólogo Organizacional"] },
  { area: "📦 Logística", items: ["Analista de Logística", "Gerente de Logística", "Coordenador de Suprimentos", "Operador Logístico"] },
  { area: "🏥 Saúde", items: ["Enfermeiro", "Médico", "Farmacêutico", "Nutricionista", "Fisioterapeuta", "Psicólogo"] },
  { area: "🏗️ Engenharia", items: ["Engenheiro Civil", "Engenheiro Mecânico", "Engenheiro Elétrico", "Arquiteto"] },
];

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchVal, setSearchVal] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const filteredCategories = useMemo(() => {
    const q = searchVal.toLowerCase();
    return CATEGORIES
      .map(cat => ({ ...cat, items: cat.items.filter(item => !q || item.toLowerCase().includes(q)) }))
      .filter(cat => cat.items.length > 0);
  }, [searchVal]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const profilePath = user ? "/perfil" : "/auth";
  const profileLabel = user ? getUserFirstName(user) : "Perfil";

  const termoItems = [
    { name: "IA\nGenerativa", pct: "+40%", bars: [3, 4, 4, 5, 5, 6, 8] },
    { name: "LLMs", pct: "+24%", bars: [4, 4, 5, 5, 6, 6, 7] },
    { name: "Rust", pct: "+15%", bars: [3, 3, 4, 4, 5, 5, 6] },
    { name: "FinOps", pct: "+18%", bars: [4, 4, 4, 5, 5, 6, 7] },
  ];

  const submitSearch = async (value = searchVal) => {
    const query = value.trim();
    if (!query) return;
    
    setIsAnalyzing(true);
    setErrorMsg("");
    setLoadingStep("Iniciando web scraping...");
    
    const interval = setInterval(() => {
      setLoadingStep(prev => {
        if (prev === "Iniciando web scraping...") return "Coletando vagas (LinkedIn, Gupy, etc)...";
        if (prev === "Coletando vagas (LinkedIn, Gupy, etc)...") return "Analisando com Inteligência Artificial...";
        if (prev === "Analisando com Inteligência Artificial...") return "Gerando relatório final de carreira...";
        return prev;
      });
    }, 10000);

    try {
      const analysis = await jobService.getCarreira(query);
      if (!analysis) {
        throw new Error("A API não retornou a análise de carreira.");
      }
      navigate(`/carreira?cargo=${encodeURIComponent(query)}`, { state: { analysis } });
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "Erro ao coletar dados ou comunicar com a IA. Tente novamente.");
    } finally {
      clearInterval(interval);
      setIsAnalyzing(false);
      setLoadingStep("");
    }
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAnalyzing) {
      submitSearch();
    }
  };

  const scrollToFeatures = () => {
    document.getElementById("ha-features")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToCareerSearch = () => {
    const input = document.getElementById("career-search-input") as HTMLInputElement | null;
    input?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => input?.focus(), 250);
  };

  return (
    <>
      <style>{style}</style>
      <div className="ha-root">
        <nav className="ha-nav">
          <button type="button" className="ha-nav-logo" onClick={() => navigate("/")}>Worky</button>
          <div className="ha-nav-links">
            <button type="button" className="ha-nav-link active" onClick={() => navigate("/")}>Explorar</button>
            <button type="button" className="ha-nav-link" onClick={scrollToFeatures}>Sobre</button>
          </div>
          <div className="ha-nav-actions">
            <button type="button" className="btn-primary" onClick={() => navigate(profilePath)}>
              {profileLabel}
            </button>
          </div>
        </nav>

        <section className="ha-hero">
          <div className="ha-badge">
            <span>✦</span> Nova Inteligência Disponível
          </div>
          <h1 className="ha-hero-title">
            A nova fronteira da inteligência<br />
            de <span className="accent">mercado de trabalho</span>.
          </h1>
          <p className="ha-hero-sub">
            Descubra competências em alta, salários reais e as melhores vagas com IA e web scraping.
            Analisamos milhões de dados para você não precisar fazer isso.
          </p>
          <div className="ha-search-container" ref={searchContainerRef}>
            <form className="ha-search-wrap" onSubmit={handleSearch} autoComplete="off">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                id="career-search-input"
                className="ha-search-input"
                placeholder="Ex: Desenvolvedor Front-End, UX Designer..."
                value={searchVal}
                name="worky-career-search"
                onChange={(e) => { setSearchVal(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                disabled={isAnalyzing}
                autoComplete="new-password"
              />
              <button type="submit" className="btn-search" disabled={isAnalyzing}>
                {isAnalyzing ? loadingStep : "Analisar"}
                {!isAnalyzing && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </form>
            {showDropdown && !isAnalyzing && filteredCategories.length > 0 && (
              <div className="ha-category-dropdown">
                {filteredCategories.map((cat, ci) => (
                  <div key={cat.area}>
                    {ci > 0 && <div className="ha-cat-divider" />}
                    <div className="ha-cat-area">{cat.area}</div>
                    {cat.items.map(item => (
                      <button
                        key={item}
                        type="button"
                        className="ha-cat-item"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSearchVal(item);
                          setShowDropdown(false);
                          submitSearch(item);
                        }}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
          {errorMsg && (
            <div style={{ color: "#ef4444", fontSize: "0.85rem", marginTop: "-1rem", marginBottom: "1.5rem", fontWeight: 500 }}>
              {errorMsg}
            </div>
          )}
          <div className="ha-tags">
            {["#Tech", "#Finance", "#Design", "#DataScience"].map((tag) => (
              <button
                type="button"
                key={tag}
                className="ha-tag"
                onClick={() => {
                  const value = tag.replace("#", "");
                  setSearchVal(value);
                  submitSearch(value);
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </section>

        <div className="ha-section">
          <div className="ha-termo-card">
            <div className="ha-termo-left">
              <div className="ha-termo-header">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#2563eb">
                  <rect x="2" y="3" width="4" height="18" rx="1" /><rect x="8" y="7" width="4" height="14" rx="1" />
                  <rect x="14" y="10" width="4" height="11" rx="1" /><rect x="20" y="5" width="4" height="16" rx="1" />
                </svg>
                <span className="ha-termo-title">Termômetro do Mercado</span>
                <span className="ha-termo-sub">(Esta semana)</span>
              </div>
              <div className="ha-termo-grid">
                {termoItems.map((item, idx) => (
                  <div key={idx} className="ha-termo-item">
                    <div className="ha-termo-item-header">
                      <span className="ha-termo-name" style={{ whiteSpace: "pre-line" }}>{item.name}</span>
                      <span className="ha-termo-pct">{item.pct}</span>
                    </div>
                    <div className="ha-termo-bars">
                      {item.bars.map((height, i) => (
                        <div key={i} className={`ha-termo-bar${i === item.bars.length - 1 ? " active" : ""}`} style={{ height: `${height * 4}px` }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="ha-insight">
              <div className="ha-insight-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                  <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" stroke="#0d9488" strokeWidth="2" fill="none" />
                </svg>
                Insight do Dia
              </div>
              <div className="ha-insight-text">
                Empresas estão buscando <span>30% mais profissionais</span> com certificações Cloud este mês.
              </div>
              <div className="ha-insight-meta">● Atualizado há 2h</div>
            </div>
          </div>
        </div>

        <div id="ha-features" className="ha-section" style={{ paddingTop: 0 }}>
          <div className="ha-features-grid">
            <div className="ha-feat-card dark">
              <div className="ha-feat-icon" style={{ background: "#1e293b" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-4 0v2M12 12v3M8 12v3" />
                </svg>
              </div>
              <div className="ha-feat-title" style={{ color: "white" }}>Insights de Salário</div>
              <div className="ha-feat-text" style={{ color: "#94a3b8" }}>
                Mapeamos a remuneração real por região e nível de senioridade, utilizando dados agregados de milhares de fontes públicas.
              </div>
              <div className="ha-salary-chart">
                {Array.from({ length: 22 }).map((_, i) => (
                  <div key={i} className="ha-salary-bar" style={{ height: `${16 + Math.abs(Math.sin(i * 0.9)) * 22}px` }} />
                ))}
              </div>
            </div>

            <div className="ha-feat-card teal">
              <div className="ha-feat-icon" style={{ background: "rgba(255,255,255,0.15)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              </div>
              <div className="ha-feat-title">Mapeamento de Competências</div>
              <div className="ha-feat-text">
                Identifique as habilidades mais requisitadas para o cargo que você deseja ocupar.
              </div>
              <div className="ha-skill-tags">
                {["React", "AWS", "Python", "UI/UX"].map((skill) => (
                  <span key={skill} className="ha-skill-tag">{skill}</span>
                ))}
              </div>
            </div>

            <div className="ha-feat-card">
              <div className="ha-lightning-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#f59e0b">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <div className="ha-feat-title">Vagas em Tempo Real</div>
              <div className="ha-feat-text">
                Nossos bots varrem o mercado 24/7 para trazer oportunidades antes de todo mundo.
              </div>
            </div>

            <div className="ha-feat-card blue">
              <div className="ha-blue-left">
                <div className="ha-blue-label">IA</div>
                <div className="ha-blue-title">Análise IA de Perfil</div>
                <div className="ha-blue-text">
                  Suba seu currículo e receba um feedback imediato sobre como você se posiciona em relação ao mercado atual.
                </div>
                <button type="button" className="btn-white" onClick={() => navigate("/skills")}>Testar Grátis</button>
              </div>
              <div className="ha-blue-visual">
                <NetworkSVG />
              </div>
            </div>
          </div>
        </div>

        <section className="ha-cta-section">
          <div className="ha-cta-bg" />
          <div style={{ position: "relative" }}>
            <div className="ha-cta-title">
              Prepare-se para o seu <em>próximo nível</em>.
            </div>
            <div className="ha-cta-sub">
              Não tome decisões de carreira baseadas em suposições. Utilize a inteligência de dados a seu favor.
            </div>
            <div className="ha-cta-btns">
              <button type="button" className="btn-cta-primary" onClick={scrollToCareerSearch}>Começar Agora</button>
            </div>
          </div>
        </section>

        <footer className="ha-footer">
          <div>
            <div className="ha-footer-logo">Worky</div>
            <div className="ha-footer-copy">© 2026 Worky. Inteligência de Mercado.</div>
          </div>
          <div className="ha-footer-links">
            {["Privacidade", "Termos", "Contato", "Suporte"].map((link) => (
              <button type="button" key={link} className="ha-footer-link">{link}</button>
            ))}
          </div>
        </footer>
      </div>
    </>
  );
}
