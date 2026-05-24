const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'app', 'pages', 'Career.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add JobReportModal types and logic after MatchAuthModal
const reportModalCode = [
  'const JOB_REPORT_REASONS = [',
  '  "Requisitos inconsistentes com a carreira",',
  '  "Salario inconsistente",',
  '  "Vaga duplicada",',
  '  "Link da vaga nao funciona",',
  '  "Localidade ou modalidade incorreta",',
  '  "Conteudo suspeito",',
  '  "Outro motivo",',
  '];',
  '',
  'type JobReportTarget = {',
  '  job: CareerOpportunity;',
  '  key: string;',
  '};',
  '',
  'const getJobReportKey = (job: CareerOpportunity, index: number) => (',
  '  [job.link, job.titulo, job.empresa, String(index)].filter(Boolean).join("|")',
  ');',
  '',
  'type JobReportModalProps = {',
  '  details: string;',
  '  job: CareerOpportunity;',
  '  onClose: () => void;',
  '  onDetailsChange: (value: string) => void;',
  '  onReasonChange: (value: string) => void;',
  '  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;',
  '  reason: string;',
  '  submitted: boolean;',
  '};',
  '',
  'function JobReportModal({',
  '  details,',
  '  job,',
  '  onClose,',
  '  onDetailsChange,',
  '  onReasonChange,',
  '  onSubmit,',
  '  reason,',
  '  submitted,',
  '}: JobReportModalProps) {',
  '  return (',
  '    <div className="wm-backdrop" onClick={onClose}>',
  '      <div',
  '        className="wm-card"',
  '        role="dialog"',
  '        aria-modal="true"',
  '        aria-labelledby="report-modal-title"',
  '        onClick={(event) => event.stopPropagation()}',
  '      >',
  '        <div className="wm-body">',
  '          <div className="wm-icon-wrap" style={{ color: "var(--danger)", background: "var(--danger-bg)" }}>',
  '            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">',
  '              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>',
  '              <line x1="4" y1="22" x2="4" y2="15"></line>',
  '            </svg>',
  '          </div>',
  '          <h2 id="report-modal-title" className="wm-title">Reportar Problema</h2>',
  '          <p className="wm-description">',
  '            Encontrou algo errado com a vaga <strong>{job.titulo}</strong> na empresa <strong>{job.empresa || "Confidencial"}</strong>? Ajude-nos a melhorar.',
  '          </p>',
  '        </div>',
  '',
  '        {submitted ? (',
  '          <div className="wm-body" style={{ marginTop: "-1rem", paddingBottom: "2rem", textAlign: "center" }}>',
  '            <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "48px", height: "48px", borderRadius: "50%", background: "#dcfce7", color: "#16a34a", marginBottom: "1rem" }}>',
  '              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
  '            </div>',
  '            <p style={{ color: "var(--on-surface)", fontWeight: 600 }}>Obrigado por reportar!</p>',
  '            <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "0.5rem" }}>Nossa equipe de IA irá analisar o problema relatado e ajustar nossos algoritmos.</p>',
  '            <button type="button" className="btn-continue" style={{ marginTop: "1.5rem" }} onClick={onClose}>',
  '              Fechar',
  '            </button>',
  '          </div>',
  '        ) : (',
  '          <form onSubmit={onSubmit}>',
  '            <div className="wm-body" style={{ marginTop: "-1rem", paddingTop: 0, paddingBottom: 0 }}>',
  '              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>',
  '                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>',
  '                  <label htmlFor="report-reason" style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--on-surface-muted)" }}>Motivo principal</label>',
  '                  <select',
  '                    id="report-reason"',
  '                    value={reason}',
  '                    onChange={(event) => onReasonChange(event.target.value)}',
  '                    style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--outline)", background: "white", fontSize: "0.9rem", color: "var(--on-surface)", outline: "none", fontFamily: "inherit" }}',
  '                  >',
  '                    {JOB_REPORT_REASONS.map((r) => (',
  '                      <option key={r} value={r}>{r}</option>',
  '                    ))}',
  '                  </select>',
  '                </div>',
  '                ',
  '                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>',
  '                  <label htmlFor="report-details" style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--on-surface-muted)" }}>Detalhes adicionais (opcional)</label>',
  '                  <textarea',
  '                    id="report-details"',
  '                    value={details}',
  '                    onChange={(event) => onDetailsChange(event.target.value)}',
  '                    placeholder="Conte-nos mais sobre o problema com esta vaga..."',
  '                    rows={3}',
  '                    style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--outline)", background: "white", fontSize: "0.9rem", color: "var(--on-surface)", outline: "none", resize: "none", fontFamily: "inherit" }}',
  '                  />',
  '                </div>',
  '              </div>',
  '            </div>',
  '            <div className="wm-footer" style={{ marginTop: "1.5rem" }}>',
  '              <button type="submit" className="btn-continue">',
  '                Enviar Reporte',
  '              </button>',
  '              <button type="button" className="btn-cancel" onClick={onClose}>',
  '                Cancelar',
  '              </button>',
  '            </div>',
  '          </form>',
  '        )}',
  '      </div>',
  '    </div>',
  '  );',
  '}',
  '',
  'const css = `'
].join('\\n');

content = content.replace('const css = `', reportModalCode);

// 2. Add styles for btn-reportar-vaga
const additionalCss = [
  '.btn-reportar-vaga {',
  '  display: flex; align-items: center; justify-content: center; gap: 6px;',
  '  background: white; color: var(--muted); border: 1px solid var(--outline);',
  '  padding: 0.5rem 1rem; border-radius: var(--radius-sm); font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.15s;',
  '}',
  '.btn-reportar-vaga:hover { background: var(--surface-low); color: var(--on-surface); }',
  '.btn-reportar-vaga.reported { background: #f0fdf4; color: #16a34a; border-color: #bbf7d0; cursor: default; }',
  '',
  '.ha-job-actions { display: flex; gap: 0.5rem; align-items: center; width: 100%; margin-top: 12px; }',
  '.ha-job-actions .btn-ver-vaga { flex: 1; margin-top: 0; }',
  '.ha-job-actions .btn-reportar-vaga { flex: 1; margin-top: 0; }',
  '.btn-ver-vaga {'
].join('\\n');

content = content.replace('.btn-ver-vaga {', additionalCss);

// 3. Add states for JobReportModal
const statesCode = [
  '  const [externalJob, setExternalJob] = useState<CareerOpportunity | null>(null);',
  '',
  '  // Job Report State',
  '  const [reportTarget, setReportTarget] = useState<JobReportTarget | null>(null);',
  '  const [reportReason, setReportReason] = useState(JOB_REPORT_REASONS[0]);',
  '  const [reportDetails, setReportDetails] = useState("");',
  '  const [reportSubmitted, setReportSubmitted] = useState(false);',
  '  const [reportedJobKeys, setReportedJobKeys] = useState<Set<string>>(() => new Set());'
].join('\\n');

content = content.replace('  const [externalJob, setExternalJob] = useState<CareerOpportunity | null>(null);', statesCode);

// 4. Add handlers for JobReportModal
const handlersCode = [
  '  const closeExitModal = () => setExternalJob(null);',
  '  const continueToJob = () => {',
  '    if (!externalJob?.link) return;',
  '    window.open(externalJob.link, "_blank", "noopener,noreferrer");',
  '    setExternalJob(null);',
  '  };',
  '',
  '  const openReportModal = (job: CareerOpportunity, key: string) => {',
  '    setReportTarget({ job, key });',
  '    setReportReason(JOB_REPORT_REASONS[0]);',
  '    setReportDetails("");',
  '    setReportSubmitted(false);',
  '  };',
  '',
  '  const closeReportModal = () => setReportTarget(null);',
  '',
  '  const submitJobReport = (event: React.FormEvent<HTMLFormElement>) => {',
  '    event.preventDefault();',
  '    if (!reportTarget) return;',
  '',
  '    setReportedJobKeys((current) => {',
  '      const next = new Set(current);',
  '      next.add(reportTarget.key);',
  '      return next;',
  '    });',
  '',
  '    setReportSubmitted(true);',
  '    ',
  '    setTimeout(() => {',
  '      closeReportModal();',
  '    }, 2500);',
  '  };'
].join('\\n');

content = content.replace(
  /  const closeExitModal = \(\) => setExternalJob\(null\);\n  const continueToJob = \(\) => \{\n    if \(!externalJob\?\.link\) return;\n    window\.open\(externalJob\.link, "_blank", "noopener,noreferrer"\);\n    setExternalJob\(null\);\n  \};/,
  handlersCode
);

// 5. Add JobReportModal to render
const renderModalsCode = [
  '        {externalJob && (',
  '          <ExitModal',
  '            onCancel={closeExitModal}',
  '            onContinue={continueToJob}',
  '          />',
  '        )}',
  '        {reportTarget && (',
  '          <JobReportModal',
  '            details={reportDetails}',
  '            job={reportTarget.job}',
  '            onClose={closeReportModal}',
  '            onDetailsChange={setReportDetails}',
  '            onReasonChange={setReportReason}',
  '            onSubmit={submitJobReport}',
  '            reason={reportReason}',
  '            submitted={reportSubmitted}',
  '          />',
  '        )}'
].join('\\n');

content = content.replace(
  /        \{externalJob && \(\n          <ExitModal\n            onCancel=\{closeExitModal\}\n            onContinue=\{continueToJob\}\n          \/>\n        \)\}/,
  renderModalsCode
);

// 6. Update the job card to include the report button
const jobCardRegex = /<button type="button" key=\{\`\$\{job\.titulo\}-\$\{index\}\`\} className="ha-job-card" onClick=\{\(\) => requestOpenJob\(job\)\}>([\\s\\S]*?)<span className="btn-ver-vaga">Ver vaga<\/span>\n\s*<\/button>/g;

const newJobCard = [
  '<div key={`${job.titulo}-${index}`} className="ha-job-card">',
  '$1',
  '                          <div className="ha-job-actions">',
  '                            <button',
  '                              type="button"',
  '                              className={`btn-reportar-vaga ${reportedJobKeys.has(getJobReportKey(job, index)) ? "reported" : ""}`}',
  '                              onClick={(e) => {',
  '                                e.stopPropagation();',
  '                                if (!reportedJobKeys.has(getJobReportKey(job, index))) {',
  '                                  openReportModal(job, getJobReportKey(job, index));',
  '                                }',
  '                              }}',
  '                            >',
  '                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">',
  '                                {reportedJobKeys.has(getJobReportKey(job, index)) ? (',
  '                                  <>',
  '                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />',
  '                                    <polyline points="22 4 12 14.01 9 11.01" />',
  '                                  </>',
  '                                ) : (',
  '                                  <>',
  '                                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />',
  '                                    <line x1="4" y1="22" x2="4" y2="15" />',
  '                                  </>',
  '                                )}',
  '                              </svg>',
  '                              {reportedJobKeys.has(getJobReportKey(job, index)) ? "Reportado" : "Reportar"}',
  '                            </button>',
  '                            <button type="button" className="btn-ver-vaga" onClick={() => requestOpenJob(job)}>Ver vaga</button>',
  '                          </div>',
  '                        </div>'
].join('\\n');

content = content.replace(jobCardRegex, newJobCard);

fs.writeFileSync(file, content);
console.log('Patch report applied successfully');
