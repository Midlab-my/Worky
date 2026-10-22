import { useEffect, useRef, useState, type FormEvent } from 'react';
import { enrollTotp, listTotpFactors, verifyTotp, type AuthSession, type TotpFactor } from '../services/auth';

export function MfaChallenge({ session, onVerified, onCancel, allowEnroll = true }: {
  session: AuthSession; onVerified: (session: AuthSession) => Promise<void> | void;
  onCancel: () => void; allowEnroll?: boolean;
}) {
  const [factors, setFactors] = useState<TotpFactor[]>([]);
  const [factorId, setFactorId] = useState('');
  const [setup, setSetup] = useState<{ qr_code: string; secret: string } | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const [ready, setReady] = useState(false);
  const inFlight = useRef(false);
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
  async function enroll() {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError('');
    try { const result = await enrollTotp(session); setSetup(result.totp); setFactorId(result.id); }
    catch { setError('Não foi possível gerar o QR Code. Tente novamente.'); }
    finally { inFlight.current = false; setBusy(false); }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError('');
    try { await onVerified(await verifyTotp(session, factorId, code)); }
    catch { setError('Não foi possível validar. Confira o código, o relógio do celular e tente novamente.'); setCode(''); }
    finally { inFlight.current = false; setBusy(false); }
  }
  return <div className="wa-card" style={{ maxWidth: 460, margin: '24px auto', padding: 28, background: 'white', borderRadius: 24 }}>
    <h2 className="wa-card-title">Verificação em duas etapas</h2>
    <p className="wa-card-sub">Use o Google Authenticator ou Microsoft Authenticator para continuar.</p>
    {error && <p role="alert" className="wa-banner error">{error}</p>}
    {busy && <p role="status">Aguarde...</p>}
    {ready && !factorId && allowEnroll && <button className="wa-btn" disabled={busy} onClick={enroll}>Configurar autenticador</button>}
    {ready && !factorId && !allowEnroll && <p>Não foi encontrado um autenticador ativo. Reinicie a recuperação.</p>}
    {setup && <div>
      <p>Escaneie o QR Code e confirme com o código do aplicativo.</p>
      <img alt="QR Code para configurar o autenticador Worky" width={240} height={240}
        src={setup.qr_code.startsWith('data:image/') ? setup.qr_code : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(setup.qr_code)}`} />
      <p>Chave para configuração manual:</p><code style={{ overflowWrap: 'anywhere' }}>{setup.secret}</code>
    </div>}
    {factorId && <form className="wa-form" onSubmit={submit}>
      {factors.length > 1 && <label>Autenticador<select value={factorId} onChange={e => setFactorId(e.target.value)}>
        {factors.map(f => <option key={f.id} value={f.id}>{f.friendly_name || f.id}</option>)}
      </select></label>}
      <label className="wa-label" htmlFor="totp-code">Código do autenticador</label>
      <input id="totp-code" className="wa-input" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6}
        value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} required />
      <button className="wa-btn" disabled={busy || code.length !== 6}>Validar código</button>
    </form>}
    <button className="wa-forgot" disabled={busy} onClick={onCancel}>Cancelar e sair</button>
  </div>;
}
