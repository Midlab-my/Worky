"""Busca de vagas via Google Jobs (Serper) com fallbacks."""

from __future__ import annotations

import os
import re
import urllib.parse
from typing import Any

import httpx


def _clean(value: Any) -> str:
    return str(value or "").strip()


def _infer_modalidade(titulo: str, local: str, fallback: str = "") -> str:
    combined = f"{titulo} {local}".lower()
    if any(token in combined for token in ("remoto", "remote", "home office", "homeoffice")):
        return "Remoto"
    if any(token in combined for token in ("híbrido", "hibrido", "hybrid")):
        return "Híbrido"
    if "presencial" in combined:
        return "Presencial"
    return fallback or "Qualquer"


_JOB_HOST_HINTS = (
    "linkedin.com",
    "indeed.com",
    "gupy.io",
    "glassdoor.",
    "vagas.com",
    "infojobs.",
    "catho.com",
    "trampos.co",
    "remotar.com",
    "programathor.",
    "geekhunter.",
    "kenoby.com",
    "greenhouse.io",
    "lever.co",
    "workable.com",
    "jobs.",
    "careers.",
    "recrutei.",
)


def _looks_like_job(title: str, link: str, snippet: str) -> bool:
    blob = f"{title} {snippet} {link}".lower()
    if any(host in link.lower() for host in _JOB_HOST_HINTS):
        return True
    return any(
        token in blob
        for token in ("vaga", "emprego", "job", "career", "hiring", "contrat", "oportunidade")
    )


def _company_from_title(title: str) -> str:
    # Padroes comuns: "Cargo - Empresa" | "Cargo at Empresa" | "Cargo | Empresa"
    for sep in (" - ", " | ", " at ", " em ", " @ "):
        if sep in title:
            left, right = title.split(sep, 1)
            if len(right.strip()) >= 2:
                company = re.sub(r"\s*[|·•].*$", "", right).strip()
                if company and len(company) < 80:
                    return company
            if len(left.strip()) >= 2 and sep in (" at ", " em ", " @ "):
                return right.strip()[:80]
    return ""


async def _search_serper(query: str, local: str, modelo: str) -> list[dict[str, Any]]:
    """Serper nao tem /jobs. Usa /search e filtra resultados que parecem vaga."""
    api_key = os.getenv("SERPER_API_KEY", "").strip()
    if not api_key:
        return []

    parts = [query, "vaga"]
    if local:
        parts.append(local)
    if modelo and modelo.lower() not in {"", "qualquer"}:
        parts.append(modelo)
    q = " ".join(parts)

    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.post(
            "https://google.serper.dev/search",
            headers={"X-API-KEY": api_key, "Content-Type": "application/json"},
            json={"q": q, "gl": "br", "hl": "pt-br", "num": 12},
        )
        response.raise_for_status()
        payload = response.json()

    jobs: list[dict[str, Any]] = []
    seen_links: set[str] = set()
    for item in payload.get("organic") or []:
        title = _clean(item.get("title"))
        link = _clean(item.get("link"))
        snippet = _clean(item.get("snippet"))
        if not title or not link or link in seen_links:
            continue
        if not _looks_like_job(title, link, snippet):
            continue
        seen_links.add(link)
        company = _company_from_title(title) or _clean(item.get("source")) or "Confidencial"
        jobs.append(
            {
                "titulo": title,
                "empresa": company,
                "local": local or "Brasil",
                "modalidade": _infer_modalidade(title, f"{local} {snippet}", modelo or "Qualquer"),
                "link": link,
                "fonte": "Google Jobs",
                "destaqueWorky": False,
                "tag": "Google",
            }
        )
        if len(jobs) >= 12:
            break
    return jobs


async def _search_google_html(query: str, local: str, modelo: str) -> list[dict[str, Any]]:
    """Tentativa leve de indexar resultados publicos; pode falhar por bloqueio."""
    terms = [query, "vaga"]
    if local:
        terms.append(local)
    if modelo and modelo.lower() not in {"", "qualquer"}:
        terms.append(modelo)
    q = " ".join(terms)
    url = (
        "https://www.google.com/search?"
        + urllib.parse.urlencode({"q": q, "udm": "8", "hl": "pt-BR", "gl": "br"})
    )
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
        ),
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
    }

    async with httpx.AsyncClient(follow_redirects=True, timeout=20) as client:
        response = await client.get(url, headers=headers)
        if response.status_code != 200:
            return []
        html = response.text

    jobs: list[dict[str, Any]] = []
    # Padroes frouxos: capturar blocos com data-ved/job titles quando existirem
    for match in re.finditer(
        r'aria-label="([^"]{8,120})"[^>]*>.*?(?:via|em)\s+([^<]{2,80})',
        html,
        flags=re.IGNORECASE | re.DOTALL,
    ):
        title = _clean(match.group(1))
        company = _clean(re.sub(r"\s+", " ", match.group(2)))
        if not title or title.lower().startswith("result"):
            continue
        jobs.append(
            {
                "titulo": title,
                "empresa": company or "Confidencial",
                "local": local or "Brasil",
                "modalidade": _infer_modalidade(title, local, modelo or "Qualquer"),
                "link": url,
                "fonte": "Google Jobs",
                "destaqueWorky": False,
                "tag": "Google",
            }
        )
        if len(jobs) >= 12:
            break
    return jobs


def _google_deep_link(query: str, local: str, modelo: str) -> list[dict[str, Any]]:
    terms = [query, "vaga"]
    if local:
        terms.append(local)
    if modelo and modelo.lower() not in {"", "qualquer"}:
        terms.append(modelo)
    q = " ".join(terms)
    link = (
        "https://www.google.com/search?"
        + urllib.parse.urlencode({"q": q, "udm": "8", "hl": "pt-BR", "gl": "br"})
    )
    return [
        {
            "titulo": f"Abrir busca de '{query}' no Google Jobs",
            "empresa": "Google",
            "local": local or "Brasil",
            "modalidade": modelo or "Qualquer",
            "link": link,
            "fonte": "Google Jobs",
            "destaqueWorky": False,
            "tag": "Google",
            "salario": "",
            "tipoContrato": "",
        }
    ]


async def search_google_jobs(
    query: str,
    local: str = "",
    modelo: str = "",
) -> list[dict[str, Any]]:
    query = _clean(query)
    if not query:
        return []

    try:
        serper_jobs = await _search_serper(query, local, modelo)
        if serper_jobs:
            print(f"[google_jobs] Serper retornou {len(serper_jobs)} vagas")
            return serper_jobs
    except Exception as exc:
        print(f"[google_jobs] Serper falhou: {exc}")

    try:
        html_jobs = await _search_google_html(query, local, modelo)
        if html_jobs:
            print(f"[google_jobs] HTML retornou {len(html_jobs)} vagas")
            return html_jobs
    except Exception as exc:
        print(f"[google_jobs] HTML falhou: {exc}")

    print("[google_jobs] Usando deep link do Google Jobs como fallback")
    return _google_deep_link(query, local, modelo)
