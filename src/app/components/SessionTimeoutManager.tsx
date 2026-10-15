import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";

// 15 minutos de inatividade maxima
const TIMEOUT_MS = 15 * 60 * 1000;
// Aviso aos 13 minutos (restam 2 minutos)
const WARNING_MS = 13 * 60 * 1000;

export function SessionTimeoutManager() {
  const { isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(120);
  const lastActivityRef = useRef<number>(Date.now());
  const timerRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (showWarning) {
      setShowWarning(false);
      setSecondsRemaining(120);
    }
  }, [showWarning]);

  // Monitora interacoes do usuario
  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    const handleEvent = () => resetActivity();

    events.forEach((evt) => window.addEventListener(evt, handleEvent, { passive: true }));

    // Checagem periodica
    timerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;

      if (elapsed >= TIMEOUT_MS) {
        // Encerra sessao por inatividade
        if (timerRef.current) clearInterval(timerRef.current);
        if (countdownRef.current) clearInterval(countdownRef.current);
        setShowWarning(false);
        void signOut().then(() => {
          navigate("/auth?aviso=sessao-expirada-inatividade", { replace: true });
        });
      } else if (elapsed >= WARNING_MS) {
        setShowWarning(true);
        const rem = Math.max(0, Math.ceil((TIMEOUT_MS - elapsed) / 1000));
        setSecondsRemaining(rem);
      } else {
        setShowWarning(false);
      }
    }, 1000);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleEvent));
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isAuthenticated, navigate, resetActivity, signOut]);

  if (!isAuthenticated || !showWarning) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="session-warning-title"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "1rem",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          padding: "2rem",
          maxWidth: "440px",
          width: "100%",
          boxShadow: "0 20px 48px rgba(0, 0, 0, 0.2)",
          border: "1px solid rgba(0, 62, 199, 0.12)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "50%",
            background: "#fef3c7",
            color: "#b45309",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1rem",
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>

        <h3
          id="session-warning-title"
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: "1.25rem",
            fontWeight: 800,
            color: "#191c1d",
            marginBottom: "0.5rem",
          }}
        >
          Sua sessao esta prestes a expirar
        </h3>

        <p style={{ fontSize: "0.88rem", color: "#64748b", lineHeight: 1.5, marginBottom: "1.25rem" }}>
          Por motivos de seguranca da informacao e protecao dos seus dados (LGPD), sessoes inativas sao encerradas automaticamente.
        </p>

        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "0.75rem",
            marginBottom: "1.5rem",
            fontSize: "0.95rem",
            fontWeight: 700,
            color: secondsRemaining <= 30 ? "#dc2626" : "#0052ff",
          }}
        >
          Encerramento em: {Math.floor(secondsRemaining / 60)}:{(secondsRemaining % 60).toString().padStart(2, "0")}
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            onClick={() => {
              void signOut().then(() => {
                navigate("/auth", { replace: true });
              });
            }}
            style={{
              flex: 1,
              background: "#f1f5f9",
              border: "1px solid #cbd5e1",
              borderRadius: "12px",
              padding: "0.75rem",
              fontWeight: 600,
              fontSize: "0.9rem",
              color: "#475569",
              cursor: "pointer",
            }}
          >
            Sair Agora
          </button>
          <button
            type="button"
            onClick={resetActivity}
            style={{
              flex: 1,
              background: "#0052ff",
              border: "none",
              borderRadius: "12px",
              padding: "0.75rem",
              fontWeight: 700,
              fontSize: "0.9rem",
              color: "#ffffff",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0, 82, 255, 0.25)",
            }}
          >
            Continuar Ativo
          </button>
        </div>
      </div>
    </div>
  );
}
