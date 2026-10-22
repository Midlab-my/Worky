import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Check, Copy, ShieldCheck, ArrowRight, LockKeyhole } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import CodeSlots, { type CodeSlotsStatus } from './CodeSlots';
import { enrollTotp, listTotpFactors, verifyTotp, type AuthSession, type TotpFactor } from '../services/auth';
import './MfaChallenge.css';

export function MfaChallenge({ session, onVerified, onCancel, allowEnroll = true }: {
  session: AuthSession; onVerified: (session: AuthSession) => Promise<void> | void;
  onCancel: () => void; allowEnroll?: boolean;
}) {
  const [factors, setFactors] = useState<TotpFactor[]>([]);
  const [factorId, setFactorId] = useState('');
  const [setup, setSetup] = useState<{ qr_code: string; secret: string } | null>(null);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<CodeSlotsStatus>('idle');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const [copying, setCopying] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const [ready, setReady] = useState(false);
  const reduceMotion = useReducedMotion();
  const mounted = useRef(false);
  const inFlight = useRef(false);
  const successTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; clearTimeout(successTimer.current); };
  }, []);
  useEffect(() => {
    let cancelled = false;
    listTotpFactors(session).then(items => {
      if (cancelled) return;
      const verified = items.filter(f => f.status === 'verified');
      setFactors(verified); setFactorId(verified[0]?.id || ''); setReady(true);
    }).catch(() => { if (!cancelled) setError('Não foi possível consultar o MFA. Recarregue para tentar novamente.'); })
      .finally(() => { if (!cancelled) setBusy(false); });
    return () => { cancelled = true; };
  }, [session.accessToken]);
  async function copySecret() {
    if (!setup || copying) return;
    setCopying(true); setCopyState('idle');
    try {
      let copied = false;
      if (navigator.clipboard?.writeText) {
        try { await navigator.clipboard.writeText(setup.secret); copied = true; } catch { /* Try the local fallback. */ }
      }
      if (!copied) {
        const field = document.createElement('textarea');
        field.value = setup.secret; field.setAttribute('readonly', '');
        field.style.cssText = 'position:fixed;left:-9999px;top:0;';
        const previousFocus = document.activeElement;
        document.body.appendChild(field);
        try { field.select(); copied = document.execCommand('copy'); }
        finally { field.remove(); if (previousFocus instanceof HTMLElement) previousFocus.focus(); }
      }
      if (!copied) throw new Error('Clipboard unavailable');
      if (mounted.current) setCopyState('copied');
    } catch { if (mounted.current) setCopyState('error'); }
    finally { if (mounted.current) setCopying(false); }
  }
  async function enroll() {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError('');
    try {
      const result = await enrollTotp(session);
      if (mounted.current) { setSetup(result.totp); setFactorId(result.id); }
    } catch { if (mounted.current) setError('Não foi possível gerar o QR Code. Tente novamente.'); }
    finally { inFlight.current = false; if (mounted.current) setBusy(false); }
  }
  async function finishVerification(upgraded: AuthSession) {
    try { await onVerified(upgraded); }
    catch {
      if (mounted.current) { setError('Não foi possível concluir o acesso. Tente novamente.'); setStatus('error'); }
    } finally { inFlight.current = false; if (mounted.current) setBusy(false); }
  }
  async function verifyCode(nextCode: string) {
    if (inFlight.current || !factorId || !/^\d{6}$/.test(nextCode) || status !== 'idle') return;
    inFlight.current = true; setBusy(true); setError('');
    try {
      const upgraded = await verifyTotp(session, factorId, nextCode);
      if (!mounted.current) return;
      setStatus('success');
      // Show the success wash before AuthContext releases protected routes.
      successTimer.current = setTimeout(() => {
        if (mounted.current) void finishVerification(upgraded);
      }, reduceMotion ? 0 : 700);
    } catch {
      inFlight.current = false;
      if (mounted.current) {
        setError('Não foi possível validar. Confira o código, o relógio do celular e tente novamente.');
        setStatus('error'); setBusy(false);
      }
    }
  }
  function submit(event: FormEvent) { event.preventDefault(); void verifyCode(code); }
  return <section className="mfa-card" aria-label="Verificação em duas etapas">
    <header className="mfa-header">
      <div className="mfa-header-icon" aria-hidden="true"><ShieldCheck size={26} strokeWidth={1.8} /></div>
      <p className="mfa-eyebrow">Segurança da conta</p>
      <h2>Verificação em duas etapas</h2>
      <p className="mfa-subtitle">{setup || (ready && !factorId && allowEnroll)
        ? 'Configure o Google Authenticator ou Microsoft Authenticator para proteger sua conta.'
        : 'Abra seu aplicativo autenticador e digite o código de 6 dígitos para continuar.'}</p>
    </header>
    {error && <p role="alert" className="mfa-alert">{error}</p>}
    {busy && <p role="status" className="mfa-status">{status === 'success' ? 'Código validado. Continuando...' : factorId ? 'Validando seu código...' : 'Aguarde...'}</p>}
    {ready && !factorId && allowEnroll && <button type="button" className="mfa-primary" disabled={busy} onClick={enroll}>Configurar autenticador<ArrowRight size={17} aria-hidden="true" /></button>}
    {ready && !factorId && !allowEnroll && <p className="mfa-alert">Não foi encontrado um autenticador ativo. Reinicie a recuperação.</p>}
    {setup && <div className="mfa-setup">
      <p className="mfa-step"><span>1</span>Escaneie o QR Code no aplicativo</p>
      <div className="mfa-qr-frame">
        <img alt="QR Code para configurar o autenticador Worky" width={208} height={208}
          src={setup.qr_code.startsWith('data:image/') ? setup.qr_code : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(setup.qr_code)}`} />
      </div>
      <div className="mfa-manual">
        <p>Prefere configurar manualmente?</p>
        <code aria-label="Chave para configuração manual">{setup.secret}</code>
        <button className="mfa-copy" type="button" onClick={() => { void copySecret(); }} disabled={copying}>
          {copyState === 'copied' ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
          {copyState === 'copied' ? 'Chave copiada' : copying ? 'Copiando...' : 'Copiar chave'}
        </button>
        <span className={copyState === 'error' ? 'mfa-copy-error' : 'code-slots__sr'} role="status">
          {copyState === 'error' ? 'Não foi possível copiar. Selecione a chave acima e copie manualmente.' : copyState === 'copied' ? 'Chave copiada para a área de transferência.' : ''}
        </span>
      </div>
    </div>}
    {factorId && <form className="mfa-form" onSubmit={submit}>
      {factors.length > 1 && <label className="mfa-factor-label">Autenticador<select value={factorId} disabled={busy || status !== 'idle'} onChange={e => { setFactorId(e.target.value); setCode(''); setStatus('idle'); setError(''); }}>
        {factors.map(f => <option key={f.id} value={f.id}>{f.friendly_name || f.id}</option>)}
      </select></label>}
      <p className="mfa-step">{setup && <span>2</span>}{setup ? 'Confirme com o código do aplicativo' : 'Código do autenticador'}</p>
      <div className="mfa-code-container">
        <CodeSlots key={factorId} length={6} value={code} status={status} autoFocus={!setup}
          disabled={busy && status !== 'success'} ariaLabel="Código do autenticador, 6 dígitos"
          accentColor="#2563eb" inkColor="#2563eb" slotColor="#eff2ff" digitColor="#ffffff" dangerColor="#dc2626"
          slotSize={44} gap={8} radius={12} bounce={0.2} settle={0.3} rise={8} cascade={20} className="mfa-code-slots"
          onChange={nextCode => { setCode(nextCode); setStatus('idle'); if (nextCode) setError(''); }}
          onComplete={nextCode => { void verifyCode(nextCode); }} />
      </div>
      <p className="mfa-hint">O código será validado ao preencher os 6 dígitos.</p>
      <button className="mfa-primary" disabled={busy || status !== 'idle' || code.length !== 6}>
        {status === 'success' ? 'Código validado' : busy ? 'Validando...' : setup ? 'Confirmar ativação' : 'Validar código'}
        {status === 'success' ? <Check size={17} aria-hidden="true" /> : <ArrowRight size={17} aria-hidden="true" />}
      </button>
    </form>}
    <footer className="mfa-footer">
      <button className="mfa-cancel" type="button" disabled={busy} onClick={onCancel}>Cancelar e sair</button>
      <p><LockKeyhole size={12} aria-hidden="true" />Uma camada extra de proteção para sua conta.</p>
    </footer>
  </section>;
}
