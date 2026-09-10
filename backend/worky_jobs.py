"""Vagas e cursos internos da Worky (empresas cadastradas + catalogo)."""

from __future__ import annotations

import os
import re
from typing import Any

from supabase import Client, create_client


def _clean(value: Any) -> str:
    return str(value or "").strip()


def _client() -> Client | None:
    url = os.getenv("SUPABASE_URL", "").strip()
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    if not url or not key:
        return None
    try:
        return create_client(url, key)
    except Exception as exc:
        print(f"[worky_jobs] Falha ao criar client Supabase: {exc}")
        return None


def _matches_query(text: str, query: str) -> bool:
    hay = text.lower()
    tokens = [token for token in re.split(r"[^a-z0-9+#.\u00c0-\u024f]+", query.lower()) if len(token) > 1]
    if not tokens:
        return True
    return any(token in hay for token in tokens)


def fetch_worky_company_jobs(query: str, local: str = "", modelo: str = "") -> list[dict[str, Any]]:
    client = _client()
    if client is None:
        return []

    try:
        response = (
            client.table("company_jobs")
            .select("id,titulo,local,modelo,requisitos,descricao,company_user_id,updated_at")
            .order("updated_at", desc=True)
            .limit(40)
            .execute()
        )
        rows = response.data or []
    except Exception as exc:
        print(f"[worky_jobs] Falha ao ler company_jobs: {exc}")
        return []

    company_names: dict[str, str] = {}
    try:
        profiles = (
            client.table("company_profiles")
            .select("user_id,company_name")
            .limit(200)
            .execute()
        )
        for profile in profiles.data or []:
            company_names[str(profile.get("user_id"))] = _clean(profile.get("company_name")) or "Empresa Worky"
    except Exception as exc:
        print(f"[worky_jobs] Falha ao ler company_profiles: {exc}")

    jobs: list[dict[str, Any]] = []
    for row in rows:
        titulo = _clean(row.get("titulo"))
        job_local = _clean(row.get("local"))
        job_modelo = _clean(row.get("modelo"))
        requisitos = _clean(row.get("requisitos"))
        descricao = _clean(row.get("descricao"))
        blob = f"{titulo} {requisitos} {descricao} {job_local} {job_modelo}"
        if query and not _matches_query(blob, query):
            continue
        if local and local.lower() not in {"", "brasil"} and local.lower() not in job_local.lower():
            if job_modelo.lower() != "remoto":
                continue
        if modelo and modelo.lower() not in {"", "qualquer"} and modelo.lower() not in job_modelo.lower():
            continue

        company_id = str(row.get("company_user_id") or "")
        jobs.append(
            {
                "titulo": titulo,
                "empresa": company_names.get(company_id, "Empresa Worky"),
                "local": job_local or "Brasil",
                "modalidade": job_modelo or "Qualquer",
                "link": f"/empresa?vaga={row.get('id')}",
                "fonte": "Worky",
                "destaqueWorky": True,
                "tag": "Worky",
                "salario": "",
                "tipoContrato": "",
            }
        )
    return jobs


def fetch_worky_course_hints(query: str, limit: int = 4) -> list[dict[str, Any]]:
    """Marca cursos do catalogo interno para destaque na UI."""
    client = _client()
    if client is None:
        return []

    try:
        response = (
            client.table("course_catalog")
            .select("plataforma,nome,url,area,motivo,preco")
            .limit(80)
            .execute()
        )
        rows = response.data or []
    except Exception as exc:
        print(f"[worky_jobs] Falha ao ler course_catalog: {exc}")
        return []

    courses: list[dict[str, Any]] = []
    for row in rows:
        nome = _clean(row.get("nome"))
        plataforma = _clean(row.get("plataforma"))
        area = _clean(row.get("area"))
        if query and not _matches_query(f"{nome} {plataforma} {area}", query):
            continue
        courses.append(
            {
                "plataforma": plataforma or "Worky",
                "nome": nome,
                "url": _clean(row.get("url")),
                "preco": _clean(row.get("preco")) or "Consultar",
                "area": area or "Carreira",
                "motivo": _clean(row.get("motivo")) or "Recomendado pelo catalogo Worky.",
                "tag": "Worky",
                "destaqueWorky": True,
            }
        )
        if len(courses) >= limit:
            break
    return courses
