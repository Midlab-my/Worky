import asyncio
import json
import os
import sys
import time
from collections import defaultdict
from datetime import datetime, timezone

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

sys.stdout.reconfigure(encoding='utf-8')

# pyrefly: ignore [missing-import]
import uvicorn 
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv
# pyrefly: ignore [missing-import]
from fastapi import FastAPI, HTTPException, Request
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from ai_privacy import PrivacyError, professional_text
from security import authenticated_user
from recruitment import candidate_card

from career_ai import CareerAIAnalyzer, CareerAnalysisError, ProfileCourseSuggestionError, ProfileMatchError, build_fallback_analysis
from career_store import CareerStore
from course_catalog import CourseCatalog
from google_jobs import search_google_jobs
from scraper import JobScraper
from worky_jobs import (
    fetch_public_company,
    fetch_public_company_catalog,
    fetch_public_job,
    fetch_worky_company_jobs,
    fetch_worky_course_hints,
)

load_dotenv()

app = FastAPI()
career_store = CareerStore()
course_catalog = CourseCatalog(career_store.client if career_store.is_configured() else None)

_rate_buckets: dict[str, list[float]] = defaultdict(list)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://workymindlab.netlify.app",
        "https://workyy.vercel.app",
        "http://localhost:5173",
        "http://localhost:4173",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:4173",
    ],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


def _client_ip(request: Request) -> str:
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def _rate_limit(request: Request, bucket: str, max_calls: int, window_sec: float) -> None:
    now = time.monotonic()
    for stale in list(_rate_buckets):
        if not _rate_buckets[stale] or now - _rate_buckets[stale][-1] > 3600:
            del _rate_buckets[stale]
    if len(_rate_buckets) > 4096:
        raise HTTPException(429, 'Servidor ocupado. Tente novamente mais tarde.')
    key = f"{bucket}:{_client_ip(request)}"
    recent = [stamp for stamp in _rate_buckets[key] if now - stamp < window_sec]
    if len(recent) >= max_calls:
        raise HTTPException(
            status_code=429,
            detail="Muitas requisicoes. Aguarde um momento e tente de novo.",
        )
    recent.append(now)
    _rate_buckets[key] = recent


import uuid
import logging

# Configuracao de log seguro de auditoria
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
security_logger = logging.getLogger("worky.security")

@app.middleware("http")
async def security_hardening_middleware(request: Request, call_next):
    # Processa a requisicao e injeta headers de protecao
    start_time = time.monotonic()
    response = await call_next(request)
    duration_ms = round((time.monotonic() - start_time) * 1000, 2)

    # Hardening de HTTP Headers (OWASP)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"
    response.headers["X-XSS-Protection"] = "1; mode=block"

    # Log de auditoria seguro sem senhas ou tokens
    client_ip = _client_ip(request)
    masked_ip = client_ip.rsplit(".", 1)[0] + ".***" if "." in client_ip else "internal"
    security_logger.info(
        f"[AUDIT] {request.method} {request.url.path} - IP: {masked_ip} - Status: {response.status_code} - {duration_ms}ms"
    )

    return response


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    error_id = str(uuid.uuid4())
    # Log detalhado protegido somente para a equipe de infraestrutura
    security_logger.error(f"[ERROR-REF {error_id}] Falha interna nao tratada: {exc}", exc_info=True)
    # Resposta limpa e generica para o cliente, sem vazar nomes de tabelas, SQL ou stack trace
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Ocorreu um erro interno ao processar a solicitacao. Tente novamente mais tarde.",
            "error_id": error_id,
        },
    )


@app.exception_handler(PrivacyError)
async def privacy_error_handler(request: Request, exc: PrivacyError):
    return JSONResponse(status_code=422, content={"detail": str(exc)})


@app.middleware("http")
async def limit_request_body(request: Request, call_next):
    if request.method == 'POST':
        chunks = []
        size = 0
        async for chunk in request.stream():
            size += len(chunk)
            if size > 128_000:
                return JSONResponse(status_code=413, content={'detail': 'Requisicao muito extensa.'})
            chunks.append(chunk)
        request._body = b''.join(chunks)
    return await call_next(request)


def _require_user(request: Request) -> str:
    return authenticated_user(request, career_store.client)


def _shared_limit(subject: str, operation: str = 'ai') -> None:
    if career_store.client is None:
        raise HTTPException(503, 'Controle de acesso indisponivel.')
    try:
        allowed = career_store.client.rpc('worky_rate_limit', {
            'p_subject': subject, 'p_operation': operation,
        }).execute().data
    except Exception:
        raise HTTPException(503, 'Controle de acesso indisponivel. Verifique a migracao de seguranca.') from None
    if allowed is not True:
        raise HTTPException(429, 'Limite de requisicoes atingido. Tente novamente mais tarde.')


SEARCH_MONTHLY_LIMIT = 5


def _month_reset_iso() -> str:
    now = datetime.now(timezone.utc)
    if now.month == 12:
        resets = datetime(now.year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        resets = datetime(now.year, now.month + 1, 1, tzinfo=timezone.utc)
    return resets.isoformat()


def _default_search_quota(*, allowed: bool | None = None) -> dict:
    payload = {
        "used": 0,
        "limit": SEARCH_MONTHLY_LIMIT,
        "remaining": SEARCH_MONTHLY_LIMIT,
        "resetsAt": _month_reset_iso(),
    }
    if allowed is not None:
        payload["allowed"] = allowed
    return payload


def _normalize_search_quota(data) -> dict:
    if isinstance(data, str):
        try:
            data = json.loads(data)
        except (TypeError, ValueError, json.JSONDecodeError):
            return _default_search_quota()
    if not isinstance(data, dict):
        return _default_search_quota()
    used = int(data.get("used") or 0)
    limit = int(data.get("limit") or SEARCH_MONTHLY_LIMIT)
    remaining_raw = data.get("remaining")
    remaining = int(remaining_raw) if remaining_raw is not None else max(limit - used, 0)
    resets_at = data.get("resetsAt") or data.get("resets_at") or _month_reset_iso()
    payload = {
        "used": used,
        "limit": limit,
        "remaining": max(remaining, 0),
        "resetsAt": str(resets_at),
    }
    if "allowed" in data:
        payload["allowed"] = bool(data.get("allowed"))
    return payload


def _search_subject(request: Request) -> str:
    auth_header = (request.headers.get("Authorization") or "").strip()
    if auth_header:
        try:
            return _require_user(request)
        except HTTPException as exc:
            if exc.status_code != 401:
                raise
    return f"ip:{_client_ip(request)}"


def _get_search_quota(subject: str) -> dict:
    if career_store.client is None:
        return _default_search_quota()
    try:
        data = career_store.client.rpc("worky_search_quota", {"p_subject": subject}).execute().data
        return _normalize_search_quota(data)
    except Exception as exc:
        print(f"[quota] peek falhou: {exc}")
        return _default_search_quota()


def _consume_search_quota(subject: str) -> dict:
    """Gasta 1 busca nova do mes. Se a RPC ainda nao existir, segue (fail-open)."""
    if career_store.client is None:
        return _default_search_quota(allowed=True)
    try:
        data = career_store.client.rpc("worky_consume_search", {"p_subject": subject}).execute().data
    except Exception as exc:
        print(f"[quota] consume falhou (migracao?): {exc}")
        return _default_search_quota(allowed=True)
    result = _normalize_search_quota(data)
    if result.get("allowed") is False:
        raise HTTPException(
            status_code=429,
            detail={
                "code": "search_quota",
                "message": (
                    f"Voce usou as {result.get('limit', SEARCH_MONTHLY_LIMIT)} buscas novas "
                    "deste mes. O limite renova no proximo mes."
                ),
                "used": result.get("used"),
                "limit": result.get("limit"),
                "remaining": result.get("remaining"),
                "resetsAt": result.get("resetsAt"),
            },
        )
    return result


def _own_profile(user_id: str) -> dict:
    rows = career_store.client.table('professional_profiles').select('profile_json').eq('user_id', user_id).limit(1).execute().data
    if not rows:
        raise HTTPException(404, 'Perfil profissional nao encontrado.')
    return rows[0]['profile_json']


async def _json_object(request: Request) -> dict:
    try:
        payload = await request.json()
    except (ValueError, RecursionError):
        raise HTTPException(400, 'JSON invalido.') from None
    if not isinstance(payload, dict):
        raise HTTPException(400, 'Envie um objeto JSON.')
    return payload


def _normalize_fonte(raw: str | None) -> str:
    value = (raw or "google").strip().lower()
    if value in {"scrape", "scraping", "webscraping", "web-scraping"}:
        return "scrape"
    if value in {"google", "google_jobs", "google-jobs"}:
        return "google"
    if value in {"all", "ambos", "mix"}:
        return "all"
    return "google"


def _sort_jobs_worky_first(jobs: list) -> list:
    return sorted(jobs, key=lambda item: (0 if item.get("destaqueWorky") else 1, item.get("titulo") or ""))


async def _collect_jobs(filtros: dict) -> list:
    cargo = (
        filtros.get("cargo")
        or filtros.get("carreira")
        or filtros.get("q")
        or filtros.get("query")
        or ""
    ).strip()
    local = (filtros.get("local") or "").strip()
    modelo = (filtros.get("modelo") or "").strip()
    fonte = _normalize_fonte(filtros.get("fonte"))

    worky_jobs = await asyncio.to_thread(fetch_worky_company_jobs, cargo or "vaga", local, modelo)
    external: list = []

    if fonte in {"google", "all"}:
        google_jobs = await search_google_jobs(cargo or "vaga tecnologia", local, modelo)
        external.extend(google_jobs)

    if fonte in {"scrape", "all"}:
        scraper = JobScraper()
        scraped = await scraper.run_scrape(filtros if cargo else {**filtros, "cargo": "desenvolvedor"})
        for item in scraped:
            item.setdefault("destaqueWorky", False)
            item.setdefault("tag", item.get("fonte") or "Scraping")
        external.extend(scraped)

    return _sort_jobs_worky_first([*worky_jobs, *external])


@app.api_route("/", methods=["GET", "HEAD"])
def read_root():
    return {"message": "API do Worky está rodando e pronta para uso!"}


@app.get("/vagas")
def get_vagas():
    base_path = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(base_path, "vagas.json")
    if os.path.exists(json_path):
        with open(json_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def _sanitize_query_text(value: str, max_len: int = 120) -> str:
    """Corta tamanho e remove controles; evita flood / lixo em query params."""
    cleaned = "".join(ch for ch in (value or "") if ord(ch) >= 32 or ch in "\n\t")
    cleaned = cleaned.strip()
    if len(cleaned) > max_len:
        cleaned = cleaned[:max_len]
    return cleaned


@app.get("/buscar")
async def buscar(request: Request):
    _rate_limit(request, "buscar", max_calls=30, window_sec=60)
    _shared_limit(_client_ip(request), 'api')
    filtros = {key: _sanitize_query_text(str(value), 120) for key, value in request.query_params.items()}
    for key in ('cargo', 'carreira', 'q', 'query', 'skills'):
        if filtros.get(key):
            filtros[key] = professional_text(filtros[key], required=True)
    print(f"Buscando vagas: {filtros}")
    dados_reais = await _collect_jobs(filtros)
    return dados_reais


@app.get("/carreira")
async def get_carreira(request: Request):
    _rate_limit(request, "carreira", max_calls=12, window_sec=60)
    filtros = {key: _sanitize_query_text(str(value), 120) for key, value in request.query_params.items()}
    cargo = (
        filtros.get("cargo")
        or filtros.get("carreira")
        or filtros.get("q")
        or filtros.get("query")
        or ""
    ).strip()

    if not cargo:
        raise HTTPException(status_code=400, detail="Informe o parâmetro 'cargo'.")
    if len(cargo) < 2:
        raise HTTPException(status_code=400, detail="Cargo muito curto.")
    cargo = professional_text(cargo, required=True)
    filtros = {key: value for key, value in filtros.items() if key in {
        'cargo', 'skills', 'local', 'modelo', 'force_refresh', 'allow_fallback', 'fonte'}}
    filtros['cargo'] = cargo
    if filtros.get('skills'):
        filtros['skills'] = professional_text(filtros['skills'])

    if not os.getenv("OPENAI_API_KEY", "").strip():
        raise HTTPException(status_code=500, detail="A chave OPENAI_API_KEY não foi configurada no backend.")
    try:
        career_store.require_configured()
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    force_refresh = str(filtros.pop("force_refresh", "false")).lower() in {"1", "true", "sim", "yes"}
    allow_fallback = str(filtros.pop("allow_fallback", "false")).lower() in {"1", "true", "sim", "yes"}
    fonte = _normalize_fonte(filtros.pop("fonte", None))
    ttl_hours = int(os.getenv("CAREER_CACHE_TTL_HOURS", "0"))
    normalized_filtros = dict(filtros)
    normalized_filtros["fonte"] = fonte
    cached_record = None

    if not force_refresh:
        cached = career_store.get_recent(cargo, normalized_filtros, ttl_hours=ttl_hours)
        if cached:
            try:
                scraped = course_catalog.get_or_fetch(cargo, limit=4)
                if scraped:
                    cached["cursosRecomendados"] = scraped
                worky_courses = await asyncio.to_thread(fetch_worky_course_hints, cargo, 4)
                if worky_courses:
                    merged = [*worky_courses, *(cached.get("cursosRecomendados") or [])]
                    cached["cursosRecomendados"] = merged[:6]
            except Exception as _exc:
                print(f"[carreira] course_catalog no cache hit falhou: {_exc}")
            return cached
        cached_record = career_store.get_recent_record(cargo, normalized_filtros, ttl_hours=ttl_hours)

    # Cache publico ok. Analise nova: usuario logado (cota pessoal) ou visitante (cota por IP).
    user_id = None
    auth_header = (request.headers.get("Authorization") or "").strip()
    if auth_header:
        try:
            user_id = _require_user(request)
        except HTTPException as exc:
            if exc.status_code != 401:
                raise
    subject = user_id if user_id else f"ip:{_client_ip(request)}"
    if user_id:
        _shared_limit(user_id)
        _shared_limit(user_id, 'ai-day')
    else:
        _shared_limit(subject)
        _shared_limit(subject, 'ai-day')
    _shared_limit('all', 'global-day')
    search_quota = _consume_search_quota(subject)
    scrape_file_path = None
    if cached_record and cached_record.vagas:
        print(f"Reutilizando vagas do cache no Supabase para: {cargo}")
        scrape_file_path = await asyncio.to_thread(
            career_store.ensure_scrape_snapshot,
            cargo,
            normalized_filtros,
            cached_record.vagas,
            cached_record.scrape_file_path,
        )
        vagas = await asyncio.to_thread(career_store.load_scrape_snapshot, scrape_file_path)
        if not vagas:
            vagas = cached_record.vagas
    else:
        print(f"Gerando análise de carreira com fonte={fonte}: {cargo}")
        collected = await _collect_jobs({**normalized_filtros, "cargo": cargo})
        scrape_file_path = await asyncio.to_thread(
            career_store.save_scrape_snapshot,
            cargo,
            normalized_filtros,
            collected,
        )
        vagas = await asyncio.to_thread(career_store.load_scrape_snapshot, scrape_file_path)
        if not vagas:
            vagas = collected

    analyzer = CareerAIAnalyzer()
    analyzer.set_course_catalog(course_catalog)
    try:
        analysis = await asyncio.to_thread(analyzer.analyze, cargo, normalized_filtros, vagas)
    except CareerAnalysisError as exc:
        print(f"IA indisponível ou JSON inválido: {exc}")
        if not allow_fallback:
            raise HTTPException(
                status_code=502,
                detail=f"Nao foi possivel gerar a analise com a OpenAI: {exc}",
            ) from exc
        analysis = build_fallback_analysis(
            cargo,
            vagas,
            reason="erro_ia",
            ai_error=str(exc),
        )

    await asyncio.to_thread(
        career_store.save,
        cargo,
        normalized_filtros,
        vagas,
        analysis,
        scrape_file_path,
    )

    # tags Worky/Google mesmo se o modelo omitir campos extras
    by_link = {
        str(job.get("link") or "").strip(): job
        for job in vagas
        if str(job.get("link") or "").strip()
    }
    for bucket_key in ("oportunidadesDestaque", "todasVagas"):
        items = analysis.get(bucket_key) or []
        enriched = []
        for item in items:
            link = str(item.get("link") or "").strip()
            source = by_link.get(link) or {}
            enriched.append(
                {
                    **item,
                    "fonte": item.get("fonte") or source.get("fonte") or "",
                    "tag": item.get("tag") or source.get("tag") or source.get("fonte") or "",
                    "destaqueWorky": bool(item.get("destaqueWorky") or source.get("destaqueWorky")),
                }
            )
        # Worky primeiro
        enriched.sort(key=lambda row: (0 if row.get("destaqueWorky") else 1))
        analysis[bucket_key] = enriched

    try:
        worky_courses = await asyncio.to_thread(fetch_worky_course_hints, cargo, 4)
        if worky_courses:
            analysis["cursosRecomendados"] = [
                *worky_courses,
                *(analysis.get("cursosRecomendados") or []),
            ][:6]
    except Exception as exc:
        print(f"[carreira] worky courses falhou: {exc}")

    analysis.setdefault("metadata", {})
    analysis["metadata"]["fonteBusca"] = fonte
    analysis["metadata"]["searchQuota"] = {
        "used": search_quota.get("used"),
        "limit": search_quota.get("limit"),
        "remaining": search_quota.get("remaining"),
        "resetsAt": search_quota.get("resetsAt"),
    }
    return analysis


@app.get("/carreira/quota")
async def get_carreira_quota(request: Request):
    _rate_limit(request, "carreira-quota", max_calls=30, window_sec=60)
    subject = _search_subject(request)
    return _get_search_quota(subject)


@app.post("/perfil/cursos")
async def sugerir_cursos_perfil(request: Request):
    user_id = _require_user(request)
    _shared_limit(user_id)
    payload = await _json_object(request)
    profile = payload.get("profile") if isinstance(payload, dict) else None

    if not isinstance(profile, dict):
        raise HTTPException(status_code=400, detail="Envie o perfil profissional no campo 'profile'.")
    profile = _own_profile(user_id)

    analyzer = CareerAIAnalyzer()
    analyzer.set_course_catalog(course_catalog)
    try:
        raw_courses = await asyncio.to_thread(analyzer.suggest_profile_courses, profile)
    except ProfileCourseSuggestionError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    # catalogo usa 'nome'; front espera 'titulo'
    courses = []
    for c in raw_courses:
        courses.append({
            "titulo": c.get("titulo") or c.get("nome") or "",
            "plataforma": c.get("plataforma") or "",
            "url": c.get("url") or "",
            "area": c.get("area") or "Tecnologia",
            "motivo": c.get("motivo") or "Curso recomendado com base no seu perfil.",
        })

    return {
        "cursos": courses,
        "metadata": {
            "fonteAnalise": "catalog_scraping",
            "geradoEm": datetime.now(timezone.utc).isoformat(),
        },
    }


@app.post("/carreira/cursos")
async def sugerir_cursos_carreira(request: Request):
    user_id = _require_user(request)
    _shared_limit(user_id)
    _rate_limit(request, "carreira-cursos", max_calls=10, window_sec=60)
    if not os.getenv("OPENAI_API_KEY", "").strip():
        raise HTTPException(status_code=500, detail="A chave OPENAI_API_KEY nao foi configurada no backend.")

    payload = await _json_object(request)
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Envie o contexto da carreira no corpo da requisicao.")

    carreira = str(payload.get("carreira") or "").strip()
    competencias = payload.get("competenciasDesejadas")

    if not carreira:
        raise HTTPException(status_code=400, detail="Envie a carreira no campo 'carreira'.")
    if not isinstance(competencias, dict):
        raise HTTPException(status_code=400, detail="Envie as competencias desejadas no campo 'competenciasDesejadas'.")

    career_context = {
        "carreira": carreira,
        "competenciasDesejadas": competencias,
        "certificacoesRecomendadas": payload.get("certificacoesRecomendadas") or [],
    }

    analyzer = CareerAIAnalyzer()
    try:
        courses = await asyncio.to_thread(analyzer.suggest_career_courses, career_context)
    except ProfileCourseSuggestionError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return {
        "cursos": courses,
        "metadata": {
            "fonteAnalise": "openai",
            "geradoEm": datetime.now(timezone.utc).isoformat(),
        },
    }


@app.post("/carreira/match")
async def calcular_match_perfil(request: Request):
    user_id = _require_user(request)
    _shared_limit(user_id)
    _rate_limit(request, "carreira-match", max_calls=10, window_sec=60)
    if not os.getenv("OPENAI_API_KEY", "").strip():
        raise HTTPException(status_code=500, detail="A chave OPENAI_API_KEY nao foi configurada no backend.")

    payload = await _json_object(request)
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Envie o corpo da requisicao em formato JSON.")

    profile = _own_profile(user_id)
    carreira = str(payload.get("carreira") or "").strip()

    if not isinstance(profile, dict):
        raise HTTPException(status_code=400, detail="Envie o perfil profissional no campo 'profile'.")
    if not carreira:
        raise HTTPException(status_code=400, detail="Envie a carreira desejada no campo 'carreira'.")

    analyzer = CareerAIAnalyzer()
    try:
        match_result = await asyncio.to_thread(analyzer.calculate_profile_match, profile, carreira)
    except ProfileMatchError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return {
        "match": match_result,
        "metadata": {
            "fonteAnalise": "openai",
            "geradoEm": datetime.now(timezone.utc).isoformat(),
        },
    }


def _public_id(value: str) -> str:
    from uuid import UUID
    try:
        return str(UUID(value))
    except ValueError:
        raise HTTPException(422, 'Identificador invalido.') from None


@app.get('/catalogo/empresas')
async def public_company_catalog(request: Request):
    _rate_limit(request, 'catalogo', 40, 60)
    companies = await asyncio.to_thread(fetch_public_company_catalog)
    return {'empresas': companies}


@app.get('/catalogo/empresas/{company_id}')
async def public_company_detail(company_id: str, request: Request):
    _rate_limit(request, 'catalogo', 40, 60)
    company = await asyncio.to_thread(fetch_public_company, _public_id(company_id))
    if not company:
        raise HTTPException(404, 'Empresa nao encontrada.')
    return company


@app.get('/catalogo/vagas/{job_id}')
async def public_job_detail(job_id: str, request: Request):
    _rate_limit(request, 'catalogo', 40, 60)
    job = await asyncio.to_thread(fetch_public_job, _public_id(job_id))
    if not job:
        raise HTTPException(404, 'Vaga nao encontrada.')
    return job


@app.post('/empresa/plano')
async def request_company_plan(request: Request):
    user_id = _require_user(request)
    _shared_limit(user_id, 'api')
    payload = await _json_object(request)
    plan = payload.get('plan') if isinstance(payload, dict) else None
    if plan not in ('pro', 'enterprise'):
        raise HTTPException(422, 'Plano invalido.')
    career_store.client.rpc('worky_request_plan', {'p_user': user_id, 'p_plan': plan}).execute()
    return {'status': 'requested'}


@app.get('/empresa/candidatos/{job_id}')
async def company_candidates(job_id: str, request: Request):
    from uuid import UUID
    user_id = _require_user(request)
    _shared_limit(user_id, 'api')
    try:
        UUID(job_id)
    except ValueError:
        raise HTTPException(422, 'Vaga invalida.') from None
    client = career_store.client
    companies = client.table('company_profiles').select('plan').eq('user_id', user_id).limit(1).execute().data
    jobs = client.table('company_jobs').select('id,titulo,requisitos,descricao,local').eq('id', job_id).eq('company_user_id', user_id).limit(1).execute().data
    if not companies or companies[0]['plan'] not in ('pro', 'enterprise') or not jobs:
        raise HTTPException(403, 'Consulta de candidatos nao autorizada.')
    rows = client.table('professional_profiles').select('user_id,profile_json,completed_at').eq('recruitment_visible', True).order('updated_at', desc=True).limit(40).execute().data or []
    cards = [candidate_card(row, jobs[0]) for row in rows if row.get('completed_at')]
    return sorted(cards, key=lambda card: card['match'], reverse=True)[:8]


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8080, reload=True)

