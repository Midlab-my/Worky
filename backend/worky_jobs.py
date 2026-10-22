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


def _clip(value: Any, limit: int) -> str:
    return _clean(value)[:limit]


def ensure_company_profile(user_id: str, fields: dict[str, Any]) -> dict[str, Any] | None:
    """Cria o perfil RH com service role. Contorna RLS experimental no insert do browser."""
    client = _client()
    if client is None or not user_id:
        return None
    try:
        existing = (
            client.table("company_profiles")
            .select("user_id,company_name,size,cnpj,location,sector,linkedin,plan,created_at,updated_at")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
            .data
            or []
        )
        if existing:
            return existing[0]
        payload = {
            "user_id": user_id,
            "company_name": _clip(fields.get("company_name") or "Empresa Worky", 120) or "Empresa Worky",
            "size": _clip(fields.get("size"), 80),
            "cnpj": _clip(fields.get("cnpj"), 18),
            "location": _clip(fields.get("location"), 120),
            "sector": _clip(fields.get("sector"), 80),
            "linkedin": _clip(fields.get("linkedin"), 200),
        }
        inserted = client.table("company_profiles").insert(payload).execute().data or []
        return inserted[0] if inserted else None
    except Exception as exc:
        print(f"[worky_jobs] Falha ao garantir company_profiles: {exc}")
        return None


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
        job_id = _clean(row.get("id"))
        jobs.append(
            {
                "id": job_id,
                "titulo": titulo,
                "empresa": company_names.get(company_id, "Empresa Worky"),
                "local": job_local or "Brasil",
                "localidade": job_local or "Brasil",
                "modalidade": job_modelo or "Qualquer",
                # Link interno de candidatura (candidato), nao o painel RH.
                "link": f"/vagas/{job_id}" if job_id else "/auth?mode=register&tipo=candidato",
                "fonte": "Worky",
                "destaqueWorky": True,
                "tag": "Worky",
                "salario": "",
                "tipoContrato": job_modelo or "",
                "requisitos": requisitos,
                "descricao": descricao,
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


def _public_job(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": _clean(row.get("id")),
        "titulo": _clean(row.get("titulo")),
        "local": _clean(row.get("local")),
        "modelo": _clean(row.get("modelo")) or "Remoto",
        "requisitos": _clean(row.get("requisitos")),
        "descricao": _clean(row.get("descricao")),
    }


def _public_company(profile: dict[str, Any], jobs: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "id": str(profile.get("user_id") or ""),
        "name": _clean(profile.get("company_name")) or "Empresa Worky",
        "sector": _clean(profile.get("sector")),
        "location": _clean(profile.get("location")),
        "size": _clean(profile.get("size")),
        "jobs": jobs,
    }


def fetch_public_company_catalog() -> list[dict[str, Any]]:
    """Empresas reais com vaga publicada. Sem vitrine demo."""
    client = _client()
    if client is None:
        return []

    try:
        jobs_response = (
            client.table("company_jobs")
            .select("id,company_user_id,titulo,local,modelo,requisitos,descricao,updated_at")
            .order("updated_at", desc=True)
            .limit(500)
            .execute()
        )
        job_rows = jobs_response.data or []
    except Exception as exc:
        print(f"[worky_jobs] Falha ao ler catalogo de vagas: {exc}")
        return []

    jobs_by_company: dict[str, list[dict[str, Any]]] = {}
    for row in job_rows:
        company_id = str(row.get("company_user_id") or "")
        job = _public_job(row)
        if not company_id or not job["id"] or not job["titulo"]:
            continue
        jobs_by_company.setdefault(company_id, []).append(job)

    company_ids = list(jobs_by_company.keys())
    if not company_ids:
        return []

    try:
        profiles_response = (
            client.table("company_profiles")
            .select("user_id,company_name,size,location,sector")
            .in_("user_id", company_ids)
            .limit(200)
            .execute()
        )
        profiles = profiles_response.data or []
    except Exception as exc:
        print(f"[worky_jobs] Falha ao ler catalogo de empresas: {exc}")
        return []

    companies: list[dict[str, Any]] = []
    for profile in profiles:
        company_id = str(profile.get("user_id") or "")
        jobs = jobs_by_company.get(company_id) or []
        if not company_id or not jobs:
            continue
        companies.append(_public_company(profile, jobs))
    companies.sort(key=lambda item: str(item.get("name") or "").lower())
    return companies


def fetch_public_company(company_id: str) -> dict[str, Any] | None:
    client = _client()
    if client is None:
        return None

    try:
        profile_response = (
            client.table("company_profiles")
            .select("user_id,company_name,size,location,sector")
            .eq("user_id", company_id)
            .limit(1)
            .execute()
        )
        profiles = profile_response.data or []
        if not profiles:
            return None
        jobs_response = (
            client.table("company_jobs")
            .select("id,company_user_id,titulo,local,modelo,requisitos,descricao,updated_at")
            .eq("company_user_id", company_id)
            .order("updated_at", desc=True)
            .limit(100)
            .execute()
        )
        jobs = [_public_job(row) for row in (jobs_response.data or []) if _clean(row.get("titulo"))]
        return _public_company(profiles[0], jobs)
    except Exception as exc:
        print(f"[worky_jobs] Falha ao ler empresa publica: {exc}")
        return None


def fetch_public_job(job_id: str) -> dict[str, Any] | None:
    client = _client()
    if client is None:
        return None

    try:
        job_response = (
            client.table("company_jobs")
            .select("id,company_user_id,titulo,local,modelo,requisitos,descricao")
            .eq("id", job_id)
            .limit(1)
            .execute()
        )
        rows = job_response.data or []
        if not rows:
            return None
        row = rows[0]
        job = _public_job(row)
        company_id = str(row.get("company_user_id") or "")
        company_name = "Empresa Worky"
        if company_id:
            profile_response = (
                client.table("company_profiles")
                .select("user_id,company_name")
                .eq("user_id", company_id)
                .limit(1)
                .execute()
            )
            profiles = profile_response.data or []
            if profiles:
                company_name = _clean(profiles[0].get("company_name")) or company_name
        return {
            **job,
            "companyId": company_id,
            "companyName": company_name,
        }
    except Exception as exc:
        print(f"[worky_jobs] Falha ao ler vaga publica: {exc}")
        return None
