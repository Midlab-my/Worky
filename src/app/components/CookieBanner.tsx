import { useState, useEffect } from "react";
import { Link } from "react-router";
import { getStoredCookieConsent, saveCookieConsent, type CookiePreferences } from "../lib/security-service";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [preferences, setPreferences] = useState(true);

  useEffect(() => {
    const consent = getStoredCookieConsent();
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  if (!isVisible) return null;

  const handleAcceptAll = () => {
    saveCookieConsent({ analytics: true, preferences: true });
    setIsVisible(false);
  };

  const handleRejectNonEssential = () => {
    saveCookieConsent({ analytics: false, preferences: false });
    setIsVisible(false);
  };

  const handleSaveCustom = () => {
    saveCookieConsent({ analytics, preferences });
    setIsVisible(false);
  };

  return (
    <div
      role="region"
      aria-label="Consentimento de cookies e privacidade LGPD"
      style={{
        position: "fixed",
        bottom: "1.25rem",
        left: "1.25rem",
        right: "1.25rem",
        maxWidth: "680px",
        margin: "0 auto",
        background: "rgba(255, 255, 255, 0.96)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(0, 62, 199, 0.14)",
        borderRadius: "20px",
        padding: "1.4rem 1.6rem",
        boxShadow: "0 12px 40px rgba(0, 40, 150, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04)",
        zIndex: 70,
        fontFamily: "'DM Sans', sans-serif",
        color: "#191c1d",
        animation: "fadeInUp 0.3s ease-out",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "0.85rem" }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "#dde1ff",
            color: "#003ec7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: "1.1rem",
            fontWeight: "bold",
          }}
          aria-hidden="true"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "1.05rem", fontWeight: 700, margin: "0 0 4px", color: "#003ec7" }}>
            Sua Privacidade e Conformidade LGPD
          </h2>
          <p style={{ fontSize: "0.86rem", color: "#555b6e", margin: 0, lineHeight: 1.5 }}>
            O Worky utiliza cookies essenciais para autenticacao e seguranca da sua sessao, alem de dados analiticos para aprimorar sua experiencia profissional. Tudo em conformidade com a <strong>Lei Geral de Protecao de Dados (LGPD - Lei 13.709/2018)</strong>. Saiba mais em nossa{" "}
            <Link to="/institucional/politicas" style={{ color: "#0052ff", fontWeight: 600, textDecoration: "underline" }}>
              Politica de Privacidade
            </Link>.
          </p>
        </div>
      </div>

      {showPreferences && (
        <div
          style={{
            background: "#f8f9fa",
            border: "1px solid #e2e4e9",
            borderRadius: "14px",
            padding: "1rem",
            marginBottom: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            fontSize: "0.84rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong style={{ color: "#191c1d" }}>Cookies Essenciais</strong>
              <div style={{ color: "#6b7080", fontSize: "0.78rem" }}>Necessarios para login seguro, tokens de sessao e prevencao de fraudes.</div>
            </div>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0f766e", background: "#ecfeff", padding: "2px 8px", borderRadius: "6px" }}>
              Sempre Ativos
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong style={{ color: "#191c1d" }}>Cookies Analiticos</strong>
              <div style={{ color: "#6b7080", fontSize: "0.78rem" }}>Métricas anonimizadas de uso de vagas e recomendacoes de carreira.</div>
            </div>
            <input
              type="checkbox"
              checked={analytics}
              onChange={(e) => setAnalytics(e.target.checked)}
              style={{ width: "18px", height: "18px", accentColor: "#0052ff", cursor: "pointer" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong style={{ color: "#191c1d" }}>Cookies de Preferencias</strong>
              <div style={{ color: "#6b7080", fontSize: "0.78rem" }}>Lembrar filtros de busca de vagas e personalizacoes visuais.</div>
            </div>
            <input
              type="checkbox"
              checked={preferences}
              onChange={(e) => setPreferences(e.target.checked)}
              style={{ width: "18px", height: "18px", accentColor: "#0052ff", cursor: "pointer" }}
            />
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "flex-end", alignItems: "center" }}>
        <button
          type="button"
          onClick={() => setShowPreferences((v) => !v)}
          style={{
            background: "transparent",
            border: "none",
            color: "#4b5563",
            fontSize: "0.82rem",
            fontWeight: 600,
            cursor: "pointer",
            padding: "8px 12px",
            marginRight: "auto",
            textDecoration: "underline",
          }}
        >
          {showPreferences ? "Ocultar opcoes" : "Personalizar preferencias"}
        </button>

        {showPreferences ? (
          <button
            type="button"
            onClick={handleSaveCustom}
            style={{
              background: "#0052ff",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              padding: "0.6rem 1.1rem",
              fontSize: "0.84rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Salvar Preferencias
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleRejectNonEssential}
              style={{
                background: "#f3f4f5",
                color: "#374151",
                border: "1px solid #d1d5db",
                borderRadius: "10px",
                padding: "0.6rem 1.1rem",
                fontSize: "0.84rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Apenas Essenciais
            </button>
            <button
              type="button"
              onClick={handleAcceptAll}
              style={{
                background: "#0052ff",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                padding: "0.6rem 1.25rem",
                fontSize: "0.84rem",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0, 82, 255, 0.25)",
              }}
            >
              Aceitar Todos
            </button>
          </>
        )}
      </div>
    </div>
  );
}
