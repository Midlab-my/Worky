import { useState } from "react";
import { useNavigate } from "react-router";
import { Gift } from "lucide-react";

type ReferralCardProps = {
  variant: "invite" | "unlock";
  link: string;
  progress?: number;
  goal?: number;
  bonusAmount?: number;
  onCopied?: () => void;
};

export function ReferralCard({
  variant,
  link,
  progress = 0,
  goal = 3,
  bonusAmount = 2,
  onCopied,
}: ReferralCardProps) {
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = link;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      onCopied?.();
    } catch (err) {
      console.error("Nao foi possivel copiar o link de indicacao:", err);
    }
  };

  const clampedProgress = Math.min(progress, goal);
  const progressPct = Math.round((clampedProgress / goal) * 100);
  const goalReached = clampedProgress >= goal;

  return (
    <div className="rf-card">
      <style>{style}</style>
      <div className="rf-icon" aria-hidden="true">
        <Gift size={22} strokeWidth={2} />
      </div>

      {variant === "invite" ? (
        <>
          <div className="rf-title">Convide seus amigos</div>
          <p className="rf-text">
            Indique <strong>{goal} amigos</strong> para a plataforma e ganhe um <strong>selo premium</strong> exclusivo para destacar seu perfil.
          </p>
          <div className="rf-progress-label">
            <span>Progresso</span>
            <span>{clampedProgress}/{goal}</span>
          </div>
          <div className="rf-progress-bar">
            <div className="rf-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          {goalReached && <div className="rf-unlocked">Selo premium desbloqueado</div>}
          <button type="button" className="rf-details-link" onClick={() => navigate("/indicacoes")}>
            Ver programa completo →
          </button>
        </>
      ) : (
        <>
          <div className="rf-title">Seus matches acabaram</div>
          <p className="rf-text">
            Compartilhe seu link com amigos e libere mais <strong>{bonusAmount} matches</strong> na hora.
          </p>
        </>
      )}

      <div className="rf-link-row">
        <input
          className="rf-link-input"
          readOnly
          value={link}
          onFocus={(event) => event.target.select()}
        />
        <button type="button" className="rf-copy-btn" onClick={handleCopy}>
          {copied ? "Copiado!" : "Copiar"}
        </button>
      </div>
    </div>
  );
}

const style = `
  .rf-card { position: relative; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.5rem; }
  .rf-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: rgba(0, 62, 199, 0.08);
    color: #003ec7;
    margin-bottom: 0.75rem;
  }
  .rf-title { font-weight: 700; font-size: 0.95rem; color: #0f172a; margin-bottom: 0.5rem; }
  .rf-text { font-size: 0.85rem; color: #475569; line-height: 1.5; margin-bottom: 1rem; }
  .rf-progress-label { display: flex; justify-content: space-between; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #94a3b8; margin-bottom: 0.4rem; }
  .rf-progress-bar { background: #eef2ff; border-radius: 999px; height: 6px; overflow: hidden; margin-bottom: 0.75rem; }
  .rf-progress-fill { background: #2563eb; height: 100%; border-radius: 999px; transition: width 0.3s ease; }
  .rf-unlocked { background: #ecfdf5; color: #047857; font-size: 0.8rem; font-weight: 700; border-radius: 8px; padding: 0.5rem 0.75rem; margin-bottom: 0.75rem; }
  .rf-link-row { display: flex; gap: 0.5rem; }
  .rf-link-input { flex: 1; min-width: 0; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.5rem 0.6rem; font-size: 0.8rem; color: #475569; background: #f8fafc; }
  .rf-copy-btn { background: #2563eb; color: #fff; border: none; border-radius: 8px; padding: 0.5rem 0.9rem; font-size: 0.8rem; font-weight: 700; cursor: pointer; white-space: nowrap; }
  .rf-copy-btn:hover { background: #1d4ed8; }
  .rf-details-link { background: none; border: none; color: #2563eb; font-size: 0.8rem; font-weight: 700; cursor: pointer; padding: 0; margin-top: 0.9rem; }
  .rf-details-link:hover { text-decoration: underline; }
`;
