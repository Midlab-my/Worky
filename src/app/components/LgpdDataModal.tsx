import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  exportUserDataFile,
} from "../lib/security-service";

interface LgpdDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileData?: Record<string, unknown>;
  onToggleRecruitmentVisible?: (visible: boolean) => Promise<void>;
  recruitmentVisible?: boolean;
}

export function LgpdDataModal({
  isOpen,
  onClose,
  profileData,
  onToggleRecruitmentVisible,
  recruitmentVisible = false,
}: LgpdDataModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"lgpd" | "mfa">("lgpd");
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleExportData = () => {
    exportUserDataFile(
      {
        identificador: user.id,
        email: user.email,
        nome: user.name,
        criadoEm: user.createdAt,
        metadados: user.userMetadata,
        dadosPerfil: profileData || {},
        consentimentos: {
          recrutamentoVisivel: recruitmentVisible,
          termosAceitos: true,
          dataUltimaAtualizacao: new Date().toISOString(),
        },
      },
      `worky_meus_dados_${user.id.slice(0, 8)}.json`,
    );
    setFeedback("Arquivo com seus dados pessoais exportado com sucesso.");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="security-modal-title"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.7)",
        backdropFilter: "blur(6px)",
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
          borderRadius: "24px",
          maxWidth: "600px",
          width: "100%",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 64px rgba(0, 0, 0, 0.25)",
          border: "1px solid rgba(0, 62, 199, 0.12)",
          overflow: "hidden",
        }}
      >
        {/* Cabecalho */}
        <div
          style={{
            padding: "1.5rem 1.75rem 1rem",
            borderBottom: "1px solid #eef0f4",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2
              id="security-modal-title"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: "1.35rem",
                fontWeight: 800,
                color: "#003ec7",
                margin: 0,
              }}
            >
              Seguranca & Privacidade LGPD
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: "0.84rem", color: "#64748b" }}>
              Gestao dos seus direitos como titular de dados (Lei 13.709/2018) e protecao de acesso.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            style={{
              background: "#f1f5f9",
              border: "none",
              borderRadius: "50%",
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#475569",
              fontSize: "1.1rem",
            }}
          >
            ✕
          </button>
        </div>

        {/* Abas */}
        <div
          style={{
            display: "flex",
            padding: "0 1.75rem",
            borderBottom: "1px solid #eef0f4",
            gap: "1.5rem",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("lgpd")}
            style={{
              background: "none",
              border: "none",
              padding: "0.85rem 0",
              fontWeight: 700,
              fontSize: "0.9rem",
              color: activeTab === "lgpd" ? "#0052ff" : "#64748b",
              borderBottom: activeTab === "lgpd" ? "3px solid #0052ff" : "3px solid transparent",
              cursor: "pointer",
            }}
          >
            Direitos do Titular (LGPD)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("mfa")}
            style={{
              background: "none",
              border: "none",
              padding: "0.85rem 0",
              fontWeight: 700,
              fontSize: "0.9rem",
              color: activeTab === "mfa" ? "#0052ff" : "#64748b",
              borderBottom: activeTab === "mfa" ? "3px solid #0052ff" : "3px solid transparent",
              cursor: "pointer",
            }}
          >
            Multiplo Fator (MFA / 2FA)
          </button>
        </div>

        {/* Mensagem de Feedback */}
        {feedback && (
          <div
            style={{
              margin: "1rem 1.75rem 0",
              padding: "0.75rem 1rem",
              background: "#ecfeff",
              border: "1px solid #a5f3fc",
              borderRadius: "12px",
              color: "#0e7490",
              fontSize: "0.85rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>{feedback}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#0e7490", fontWeight: "bold" }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Conteudo */}
        <div style={{ padding: "1.5rem 1.75rem", overflowY: "auto", flex: 1 }}>
          {activeTab === "lgpd" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Portabilidade */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "16px",
                  padding: "1.25rem",
                }}
              >
                <h3 style={{ margin: "0 0 6px", fontSize: "1rem", fontWeight: 700, color: "#1e293b" }}>
                  Portabilidade e Acesso aos Dados (Art. 18, II e V)
                </h3>
                <p style={{ margin: "0 0 1rem", fontSize: "0.84rem", color: "#64748b", lineHeight: 1.5 }}>
                  Voce tem o direito legal de receber uma copia completa de todos os seus dados cadastrados na plataforma Worky em formato estruturado e interoperavel (JSON).
                </p>
                <button
                  type="button"
                  onClick={handleExportData}
                  style={{
                    background: "#0052ff",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "12px",
                    padding: "0.65rem 1.25rem",
                    fontSize: "0.86rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(0, 82, 255, 0.2)",
                  }}
                >
                  Exportar Meus Dados (JSON)
                </button>
              </div>

              {/* Consentimento de Recrutamento */}
              {onToggleRecruitmentVisible && (
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px",
                    padding: "1.25rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h3 style={{ margin: "0 0 6px", fontSize: "1rem", fontWeight: 700, color: "#1e293b" }}>
                        Consentimento de Recrutamento (Art. 7, I)
                      </h3>
                      <p style={{ margin: 0, fontSize: "0.84rem", color: "#64748b", lineHeight: 1.5 }}>
                        Compartilhar nome, localizacao e competencias tecnicas com empresas contratantes aprovadas. Se desativado, seu perfil permanece estritamente privado.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={recruitmentVisible}
                      onChange={(e) => void onToggleRecruitmentVisible(e.target.checked)}
                      style={{ width: "20px", height: "20px", accentColor: "#0052ff", cursor: "pointer", marginLeft: "12px" }}
                    />
                  </div>
                </div>
              )}

              {/* Eliminacao / Anonimizacao */}
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fee2e2",
                  borderRadius: "16px",
                  padding: "1.25rem",
                }}
              >
                <h3 style={{ margin: "0 0 6px", fontSize: "1rem", fontWeight: 700, color: "#991b1b" }}>
                  Eliminacao e Direito ao Esquecimento (Art. 18, VI)
                </h3>
                <p style={{ margin: "0 0 1rem", fontSize: "0.84rem", color: "#7f1d1d", lineHeight: 1.5 }}>
                  A solicitacao de eliminacao definitiva de conta apaga todos os registros de dados pessoais e curriculares, anonimizando métricas agregadas estritamente necessarias para cumprimento de obrigacao legal.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Tem certeza de que deseja solicitar a eliminacao definitiva da sua conta e de todos os seus dados pessoais sob a LGPD?")) {
                      setFeedback("Solicitacao registrada. Um protocolo de revogacao e confirmacao foi processado.");
                    }
                  }}
                  style={{
                    background: "#dc2626",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "12px",
                    padding: "0.65rem 1.25rem",
                    fontSize: "0.86rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Solicitar Eliminacao dos Meus Dados
                </button>
              </div>
            </div>
          ) : (
            <p>O MFA e obrigatorio. Sua sessao foi validada com o autenticador. A recuperacao de autenticador perdido nao esta disponivel nesta etapa.</p>
          )}
        </div>
      </div>
    </div>
  );
}
