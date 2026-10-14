"""Auth de usuario e sessoes administrativas com expiracao."""
import hashlib
import secrets
import threading
import time

from fastapi import HTTPException, Request

_sessions: dict[str, float] = {}
_lock = threading.Lock()
ADMIN_SESSION_SECONDS = 1800


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
        # get_user no token; nao usar set_session no client compartilhado.
        response = client.auth.get_user(token)
        user = response.user
        if not user or not user.id:
            raise ValueError('Missing user')
        return str(user.id)
    except Exception:
        raise HTTPException(401, 'Sessao invalida ou expirada.') from None


def new_admin_session() -> str:
    token = secrets.token_urlsafe(48)
    now = time.monotonic()
    with _lock:
        for key in list(_sessions):
            if _sessions[key] <= now:
                del _sessions[key]
        if len(_sessions) >= 100:
            raise HTTPException(429, 'Limite de sessoes administrativas.')
        _sessions[hashlib.sha256(token.encode()).hexdigest()] = now + ADMIN_SESSION_SECONDS
    return token


def require_admin_session(token: str) -> None:
    with _lock:
        expiry = _sessions.get(hashlib.sha256(token.encode()).hexdigest(), 0)
    if not token or expiry <= time.monotonic():
        raise HTTPException(401, 'Sessao administrativa invalida ou expirada.')


def revoke_admin_session(token: str) -> None:
    with _lock:
        _sessions.pop(hashlib.sha256(token.encode()).hexdigest(), None)
