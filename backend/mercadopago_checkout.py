"""Checkout Pro: cria preferencia no Mercado Pago. Preco vem daqui, nao do cliente."""
import os

import httpx
from fastapi import HTTPException

MP_PREFERENCES_URL = "https://api.mercadopago.com/checkout/preferences"

PLANS = {
    ("candidato", "pro"): {"title": "Worky Pro (candidato)", "unit_price": 9.00},
    ("empresa", "pro"): {"title": "Worky Pro (empresa)", "unit_price": 199.00},
    ("empresa", "enterprise"): {"title": "Worky Enterprise (empresa)", "unit_price": 500.00},
}


def _frontend_url() -> str:
    return os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")


def _access_token() -> str:
    return os.getenv("MP_ACCESS_TOKEN", "").strip()


def create_preference(plan_id: str, audience: str) -> dict:
    plan = PLANS.get((audience, plan_id))
    if not plan:
        raise HTTPException(422, "Plano inválido.")

    token = _access_token()
    if not token:
        raise HTTPException(503, "Pagamento indisponível. Configure MP_ACCESS_TOKEN.")

    frontend = _frontend_url()
    return_qs = f"plano={plan_id}&tipo={audience}"
    payload = {
        "items": [
            {
                "title": plan["title"],
                "quantity": 1,
                "currency_id": "BRL",
                "unit_price": plan["unit_price"],
            }
        ],
        "statement_descriptor": "WORKY",
        "binary_mode": True,
        "back_urls": {
            "success": f"{frontend}/checkout?status=approved&{return_qs}",
            "failure": f"{frontend}/checkout?status=failure&{return_qs}",
            "pending": f"{frontend}/checkout?status=pending&{return_qs}",
        },
        "auto_return": "approved",
    }

    data = _post_preference(token, payload)
    if data is None:
        payload.pop("back_urls", None)
        payload.pop("auto_return", None)
        data = _post_preference(token, payload)
    if data is None:
        raise HTTPException(502, "Mercado Pago recusou a preferência. Tente de novo.")

    checkout_url = data.get("sandbox_init_point") or data.get("init_point")
    preference_id = data.get("id")
    if not checkout_url or not preference_id:
        raise HTTPException(502, "Mercado Pago não devolveu o link de pagamento.")

    return {"preferenceId": preference_id, "checkoutUrl": checkout_url}


def _post_preference(token: str, payload: dict) -> dict | None:
    try:
        response = httpx.post(
            MP_PREFERENCES_URL,
            json=payload,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            timeout=20.0,
        )
    except httpx.HTTPError:
        raise HTTPException(502, "Não foi possível falar com o Mercado Pago.") from None

    if response.status_code >= 400:
        return None
    body = response.json()
    return body if isinstance(body, dict) else None
