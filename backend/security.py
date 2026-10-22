"""Supabase-validated identity, MFA, login lockout and account erasure."""
import base64
import hashlib
import json
import time
from fastapi import HTTPException, Request


def bearer(request: Request) -> str:
    value = request.headers.get('authorization', '')
    if not value.lower().startswith('bearer '):
        return ''
    return value[7:].strip()


def authenticated_user(request: Request, client) -> str:
    token = bearer(request)
    if not token:
        raise HTTPException(401, 'Entre novamente para continuar.')
    if client is None:
        raise HTTPException(503, 'Autenticacao indisponivel.')
    try:
        # Supabase verifies this exact token remotely (signature, issuer, expiry).
        # Never decode claims for authorization before get_user succeeds.
        response = client.auth.get_user(token)
        user = response.user
        if not user or not user.id:
            raise ValueError('Missing user')
        parts = token.split('.')
        if len(parts) != 3:
            raise ValueError('Malformed JWT')
        payload = parts[1]
        claims = json.loads(base64.urlsafe_b64decode(payload + '=' * (-len(payload) % 4)))
        if claims.get('sub') != str(user.id) or claims.get('exp', 0) <= time.time():
            raise ValueError('Invalid claims')
    except Exception:
        raise HTTPException(401, 'Sessao invalida ou expirada.') from None
    if claims.get('aal') != 'aal2':
        raise HTTPException(403, 'Valide o autenticador para continuar (AAL2 obrigatorio).')
    return str(user.id)


MAX_LOGIN_FAILURES = 5
LOGIN_LOCK_SECONDS = 300
LOGIN_WINDOW_SECONDS = 900
_LOGIN_STORE_CAP = 4096
_login_records: dict[str, dict] = {}


def normalize_login_email(email: object) -> str:
    value = email.strip().lower() if isinstance(email, str) else ''
    if not value or len(value) > 254 or '@' not in value or '.' not in value.split('@')[-1]:
        raise ValueError('invalid email')
    return value


def _login_subject(email: str) -> str:
    return hashlib.sha256(email.encode('utf-8')).hexdigest()


def _prune_login_records(now: float) -> None:
    stale = [
        key for key, record in _login_records.items()
        if record['locked_until'] < now and now - record['last_attempt'] > LOGIN_WINDOW_SECONDS
    ]
    for key in stale:
        _login_records.pop(key, None)
    if len(_login_records) > _LOGIN_STORE_CAP:
        _login_records.clear()


def reset_login_lockouts() -> None:
    _login_records.clear()


def login_lockout_status(email: str) -> dict:
    now = time.monotonic()
    _prune_login_records(now)
    record = _login_records.get(_login_subject(email))
    if not record:
        return {'isLocked': False, 'remainingSeconds': 0, 'attemptsLeft': MAX_LOGIN_FAILURES}
    if record['locked_until'] > now:
        return {
            'isLocked': True,
            'remainingSeconds': int(record['locked_until'] - now) + 1,
            'attemptsLeft': 0,
        }
    if now - record['last_attempt'] > LOGIN_WINDOW_SECONDS:
        _login_records.pop(_login_subject(email), None)
        return {'isLocked': False, 'remainingSeconds': 0, 'attemptsLeft': MAX_LOGIN_FAILURES}
    return {
        'isLocked': False,
        'remainingSeconds': 0,
        'attemptsLeft': max(0, MAX_LOGIN_FAILURES - record['failures']),
    }


def register_login_failure(email: str) -> dict:
    now = time.monotonic()
    _prune_login_records(now)
    key = _login_subject(email)
    record = _login_records.get(key)
    if not record or now - record['last_attempt'] > LOGIN_WINDOW_SECONDS:
        record = {'failures': 0, 'last_attempt': now, 'locked_until': 0.0}
    if record['locked_until'] > now:
        record['last_attempt'] = now
        _login_records[key] = record
        return login_lockout_status(email)
    record['failures'] += 1
    record['last_attempt'] = now
    if record['failures'] >= MAX_LOGIN_FAILURES:
        record['locked_until'] = now + LOGIN_LOCK_SECONDS
    _login_records[key] = record
    return login_lockout_status(email)


def clear_login_lockout(email: str) -> dict:
    _login_records.pop(_login_subject(email), None)
    return login_lockout_status(email)


def erase_account(client, user_id: str) -> None:
    if client is None:
        raise HTTPException(503, 'Autenticacao indisponivel.')
    for table, column in (
        ('company_jobs', 'company_user_id'),
        ('professional_profiles', 'user_id'),
        ('company_profiles', 'user_id'),
    ):
        try:
            client.table(table).delete().eq(column, user_id).execute()
        except Exception:
            pass
    try:
        client.schema('worky_private').table('match_usage').delete().eq('user_id', user_id).execute()
        client.schema('worky_private').table('referrals').delete().eq('referee', user_id).execute()
        client.schema('worky_private').table('plan_requests').delete().eq('company_id', user_id).execute()
    except Exception:
        pass
    try:
        client.storage.from_('profile-avatars').remove([f'{user_id}/avatar'])
    except Exception:
        pass
    try:
        client.auth.admin.delete_user(user_id)
    except Exception:
        raise HTTPException(
            500,
            'Ocorreu um erro interno ao processar a solicitacao. Tente novamente mais tarde.',
        ) from None
