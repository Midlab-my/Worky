const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'app', 'pages', 'Career.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add MatchAuthModal before JobReportModalProps
const matchModalCode = `
type MatchAuthModalProps = {
  onCancel: () => void;
  onContinue: () => void;
};

function MatchAuthModal({ onCancel, onContinue }: MatchAuthModalProps) {
  return (
    <div className="wm-backdrop" onClick={onCancel}>
      <div
        className="wm-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="match-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="wm-body">
          <div className="wm-icon-wrap" style={{ color: "var(--primary)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h2 id="match-modal-title" className="wm-title">Ação Necessária</h2>
          <p className="wm-description">
            Para realizar o match de perfil, você precisa estar logado e com os dados cadastrados no perfil.
          </p>
        </div>

        <div className="wm-footer">
          <button type="button" className="btn-continue" onClick={onContinue}>
            Fazer Login / Completar Perfil
          </button>
          <button type="button" className="btn-cancel" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

type JobReportModalProps`;

content = content.replace('type JobReportModalProps', matchModalCode);

// 2. Add showMatchModal state
content = content.replace(
  'const [showAllJobs, setShowAllJobs] = useState(false);',
  'const [showAllJobs, setShowAllJobs] = useState(false);\n  const [showMatchModal, setShowMatchModal] = useState(false);'
);

// 3. Replace alert and navigate with setShowMatchModal(true) in two places
content = content.replace(
  /alert\("Você precisa ter um perfil cadastrado e estar logado para calcular o match\."\);\s+navigate\("\/perfil"\); \/\/ Ou para página de login se preferir/g,
  'setShowMatchModal(true);'
);

content = content.replace(
  /alert\("Não encontramos um perfil salvo\. Por favor, conclua seu cadastro primeiro\."\);\s+navigate\("\/perfil"\);/g,
  'setShowMatchModal(true);'
);

// 4. Add MatchAuthModal to the render
const modalRenderCode = `<div className="ha-app">
        {showMatchModal && (
          <MatchAuthModal
            onCancel={() => setShowMatchModal(false)}
            onContinue={() => {
              setShowMatchModal(false);
              navigate("/perfil");
            }}
          />
        )}`;

content = content.replace('<div className="ha-app">', modalRenderCode);

// 5. Remove bookmark icon button
content = content.replace('<button type="button" className="btn-icon">{Icons.bookmark}</button>', '');

fs.writeFileSync(file, content);
console.log('Career.tsx patched successfully');
