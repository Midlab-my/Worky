"""Supabase-validated identity and mandatory MFA for private API access."""
import base64
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
