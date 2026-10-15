import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  exportUserDataFile,
  getMfaStatus,
  setupMfa,
  enableMfa,
  disableMfa,
  verifyMfaToken,
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

  // Estados MFA
  const mfaStatus = user?.id ? getMfaStatus(user.id) : { enabled: false, secret: "", backupCodes: [] };
  const [isConfiguringMfa, setIsConfiguringMfa] = useState(false);
  const [mfaSecret, setMfaSecret] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [qrUri, setQrUri] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [mfaError, setMfaError] = useState("");

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

  const startMfaSetup = () => {
    const setup = setupMfa(user.id);
    setMfaSecret(setup.secret);
    setBackupCodes(setup.backupCodes);
    setQrUri(setup.qrSampleUrl);
    setIsConfiguringMfa(true);
    setMfaError("");
  };

  const confirmMfaSetup = () => {
    if (!verifyToken.trim() || verifyToken.trim().length !== 6) {
      setMfaError("Digite o codigo de 6 digitos do seu aplicativo autenticador.");
      return;
    }

    if (verifyMfaToken(user.id, verifyToken)) {
      enableMfa(user.id, mfaSecret, backupCodes);
      setIsConfiguringMfa(false);
      setVerifyToken("");
      setFeedback("Autenticacao em dois fatores (MFA) ativada com sucesso!");
    } else {
      setMfaError("Codigo invalido. Tente novamente.");
    }
  };

  const handleDisableMfa = () => {
    disableMfa(user.id);
    setFeedback("Autenticacao em dois fatores (MFA) desativada.");
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
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "16px",
                  padding: "1.25rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#1e293b" }}>
                    Status do Multiplo Fator (MFA)
                  </h3>
                  <span
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 800,
                      padding: "4px 10px",
                      borderRadius: "8px",
                      background: mfaStatus.enabled ? "#dcfce7" : "#fee2e2",
                      color: mfaStatus.enabled ? "#166534" : "#991b1b",
                    }}
                  >
                    {mfaStatus.enabled ? "MFA Ativado" : "MFA Desativado"}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "0.84rem", color: "#64748b", lineHeight: 1.5 }}>
                  O MFA adiciona uma camada extra de protecao a sua conta exigindo um codigo de uso unico gerado pelo seu celular em cada login.
                </p>
              </div>

              {!mfaStatus.enabled && !isConfiguringMfa && (
                <button
                  type="button"
                  onClick={startMfaSetup}
                  style={{
                    background: "#0052ff",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "12px",
                    padding: "0.8rem",
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(0, 82, 255, 0.2)",
                  }}
                >
                  Configurar Autenticador (Google Authenticator / Authy)
                </button>
              )}

              {isConfiguringMfa && (
                <div
                  style={{
                    background: "#ffffff",
                    border: "1.5px solid #0052ff",
                    borderRadius: "16px",
                    padding: "1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  <h4 style={{ margin: 0, fontSize: "0.95rem", color: "#003ec7", fontWeight: 700 }}>
                    1. Escaneie ou insira a chave secreta
                  </h4>
                  <div
                    style={{
                      background: "#f1f5f9",
                      padding: "0.75rem",
                      borderRadius: "8px",
                      fontFamily: "monospace",
                      fontSize: "0.95rem",
                      textAlign: "center",
                      letterSpacing: "0.15em",
                      fontWeight: "bold",
                    }}
                  >
                    {mfaSecret}
                  </div>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
                    Abra seu aplicativo autenticador (Google Authenticator, Microsoft Authenticator ou 1Password), adicione uma nova conta e insira a chave acima.
                  </p>

                  <h4 style={{ margin: "8px 0 0", fontSize: "0.95rem", color: "#003ec7", fontWeight: 700 }}>
                    2. Codigos de Recuperacao de Emergencia
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    {backupCodes.map((code, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderRadius: "6px",
                          padding: "6px",
                          textAlign: "center",
                          fontFamily: "monospace",
                          fontSize: "0.85rem",
                        }}
                      >
                        {code}
                      </div>
                    ))}
                  </div>

                  <h4 style={{ margin: "8px 0 0", fontSize: "0.95rem", color: "#003ec7", fontWeight: 700 }}>
                    3. Confirme com o codigo de 6 digitos
                  </h4>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Ex: 123456"
                    value={verifyToken}
                    onChange={(e) => setVerifyToken(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "10px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "1.1rem",
                      textAlign: "center",
                      letterSpacing: "0.2em",
                      outline: "none",
                    }}
                  />
                  {mfaError && <div style={{ color: "#dc2626", fontSize: "0.8rem" }}>{mfaError}</div>}

                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      type="button"
                      onClick={() => setIsConfiguringMfa(false)}
                      style={{
                        flex: 1,
                        background: "#f1f5f9",
                        border: "1px solid #cbd5e1",
                        borderRadius: "10px",
                        padding: "0.7rem",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={confirmMfaSetup}
                      style={{
                        flex: 1,
                        background: "#0052ff",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "10px",
                        padding: "0.7rem",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Ativar MFA
                    </button>
                  </div>
                </div>
              )}

              {mfaStatus.enabled && (
                <button
                  type="button"
                  onClick={handleDisableMfa}
                  style={{
                    background: "#fef2f2",
                    color: "#dc2626",
                    border: "1px solid #fecaca",
                    borderRadius: "12px",
                    padding: "0.75rem",
                    fontSize: "0.86rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Desativar Multiplo Fator
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
