import asyncio
import hmac
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

from career_ai import CareerAIAnalyzer, CareerAnalysisError, ProfileCourseSuggestionError, ProfileMatchError, build_fallback_analysis
from career_store import CareerStore
from course_catalog import CourseCatalog
from google_jobs import search_google_jobs
from scraper import JobScraper
from scraper_logger import get_scraper_logs_summary
from worky_jobs import fetch_worky_company_jobs, fetch_worky_course_hints

load_dotenv()

app = FastAPI()
career_store = CareerStore()
course_catalog = CourseCatalog(career_store.client if career_store.is_configured() else None)

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "").strip()
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "").strip()
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "").strip()

_rate_buckets: dict[str, list[float]] = defaultdict(list)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://workymindlab.netlify.app",
        "https://workyy.vercel.app",
        "http://localhost:5173",
        "http://localhost:4173",
    ],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Admin-Token"],
)


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def _rate_limit(request: Request, bucket: str, max_calls: int, window_sec: float) -> None:
    now = time.monotonic()
    key = f"{bucket}:{_client_ip(request)}"
    recent = [stamp for stamp in _rate_buckets[key] if now - stamp < window_sec]
    if len(recent) >= max_calls:
        raise HTTPException(
            status_code=429,
            detail="Muitas requisicoes. Aguarde um momento e tente de novo.",
        )
    recent.append(now)
    _rate_buckets[key] = recent


def _admin_configured() -> bool:
    return bool(ADMIN_USERNAME and ADMIN_PASSWORD and ADMIN_TOKEN)


def _extract_bearer_token(request: Request) -> str:
    raw = request.headers.get("Authorization") or request.headers.get("X-Admin-Token") or ""
    if raw.lower().startswith("bearer "):
        return raw[7:].strip()
    return raw.strip()


def _require_admin(request: Request) -> None:
    if not _admin_configured():
        raise HTTPException(
            status_code=503,
            detail="Painel admin nao configurado no servidor.",
        )
    token = _extract_bearer_token(request)
    if not token or not hmac.compare_digest(token, ADMIN_TOKEN):
        raise HTTPException(status_code=401, detail="Nao autorizado. Token de admin ausente ou invalido.")


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


@app.get("/buscar")
async def buscar(request: Request):
    _rate_limit(request, "buscar", max_calls=30, window_sec=60)
    filtros = dict(request.query_params)
    print(f"Buscando vagas: {filtros}")
    dados_reais = await _collect_jobs(filtros)
    return dados_reais


@app.get("/carreira")
async def get_carreira(request: Request):
    _rate_limit(request, "carreira", max_calls=12, window_sec=60)
    filtros = dict(request.query_params)
    cargo = (
        filtros.get("cargo")
        or filtros.get("carreira")
        or filtros.get("q")
        or filtros.get("query")
        or ""
    ).strip()

    if not cargo:
        raise HTTPException(status_code=400, detail="Informe o parâmetro 'cargo'.")

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
    return analysis


@app.post("/perfil/cursos")
async def sugerir_cursos_perfil(request: Request):
    payload = await request.json()
    profile = payload.get("profile") if isinstance(payload, dict) else None

    if not isinstance(profile, dict):
        raise HTTPException(status_code=400, detail="Envie o perfil profissional no campo 'profile'.")

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
    _rate_limit(request, "carreira-cursos", max_calls=10, window_sec=60)
    if not os.getenv("OPENAI_API_KEY", "").strip():
        raise HTTPException(status_code=500, detail="A chave OPENAI_API_KEY nao foi configurada no backend.")

    payload = await request.json()
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
    _rate_limit(request, "carreira-match", max_calls=10, window_sec=60)
    if not os.getenv("OPENAI_API_KEY", "").strip():
        raise HTTPException(status_code=500, detail="A chave OPENAI_API_KEY nao foi configurada no backend.")

    payload = await request.json()
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Envie o corpo da requisicao em formato JSON.")

    profile = payload.get("profile")
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


@app.post("/admin/login")
async def admin_login(request: Request):
    _rate_limit(request, "admin-login", max_calls=8, window_sec=60)
    if not _admin_configured():
        raise HTTPException(
            status_code=503,
            detail="Painel admin nao configurado. Defina ADMIN_USERNAME, ADMIN_PASSWORD e ADMIN_TOKEN.",
        )
    payload = await request.json()
    username = str(payload.get("username") or "")
    password = str(payload.get("password") or "")
    user_ok = hmac.compare_digest(username, ADMIN_USERNAME)
    pass_ok = hmac.compare_digest(password, ADMIN_PASSWORD)
    if not (user_ok and pass_ok):
        raise HTTPException(status_code=401, detail="Credenciais invalidas.")
    return {"token": ADMIN_TOKEN, "message": "Autenticado com sucesso!"}

@app.get("/admin/stats")
async def admin_stats(request: Request):
    _rate_limit(request, "admin-stats", max_calls=40, window_sec=60)
    _require_admin(request)

    total_profiles = 0
    completed_profiles = 0
    user_skills = []
    user_roles = []
    
    total_vacancies_all_time = 0
    vacancies_today = 0
    active_sources = set()
    total_career_analyses = 0
    last_collection_time = None
    all_job_links = set()
    duplicate_jobs_count = 0
    career_searches = []
    
    if career_store.is_configured():
        try:
            profiles_res = career_store.client.table("professional_profiles").select("user_id, completed_at, profile_json").execute()
            profiles = profiles_res.data or []
            total_profiles = len(profiles)
            for p in profiles:
                if p.get("completed_at"):
                    completed_profiles += 1
                profile_json = p.get("profile_json") or {}
                skills = profile_json.get("skills") or []
                for s in skills:
                    if isinstance(s, dict) and s.get("label"):
                        user_skills.append(s.get("label"))
                    elif isinstance(s, str):
                        user_skills.append(s)
                form = profile_json.get("form") or {}
                bio = form.get("bio") or ""
                nome = form.get("nome") or ""
                cidade = form.get("cidade") or ""
                if bio:
                    user_roles.append(bio)
                
                career_searches.append({
                    "nome": nome or "Usuário Sem Nome",
                    "cidade": cidade or "Não informada",
                    "bio": bio or "Não informada",
                    "completed": bool(p.get("completed_at")),
                    "skills_count": len(skills)
                })
        except Exception as e:
            print(f"Erro ao buscar perfis no Supabase: {e}")

        try:
            analyses_res = career_store.client.table("career_analyses").select("cargo, updated_at, vagas_json, analysis_json").execute()
            analyses = analyses_res.data or []
            total_career_analyses = len(analyses)
            
            now = datetime.now(timezone.utc)
            
            for a in analyses:
                vagas = a.get("vagas_json") or []
                updated_at_str = a.get("updated_at")
                # timezone para o parser do Python
                if updated_at_str:
                    try:
                        normalized_dt = updated_at_str
                        if normalized_dt.endswith("Z"):
                            normalized_dt = normalized_dt.replace("Z", "+00:00")
                        updated_at = datetime.fromisoformat(normalized_dt)
                    except ValueError:
                        updated_at = None
                else:
                    updated_at = None
                
                if updated_at:
                    if not last_collection_time or updated_at > last_collection_time:
                        last_collection_time = updated_at
                    
                    time_diff = now - updated_at
                    if time_diff.days == 0:
                        vacancies_today += len(vagas)
                        
                for v in vagas:
                    total_vacancies_all_time += 1
                    fonte = v.get("fonte") or v.get("platform") or "Outro"
                    active_sources.add(fonte)
                    
                    link = v.get("link")
                    title_company = f"{v.get('titulo')}-{v.get('empresa')}".lower()
                    if link:
                        if link in all_job_links:
                            duplicate_jobs_count += 1
                        else:
                            all_job_links.add(link)
                    elif title_company:
                        if title_company in all_job_links:
                            duplicate_jobs_count += 1
                        else:
                            all_job_links.add(title_company)
        except Exception as e:
            print(f"Erro ao buscar análises de carreira no Supabase: {e}")

    else:
        print("Supabase não configurado no backend. Usando cache local para painel admin.")
        cache_dir = career_store.scrape_cache_dir
        if os.path.exists(cache_dir):
            try:
                for file_name in os.listdir(cache_dir):
                    if file_name.endswith(".json"):
                        file_path = os.path.join(cache_dir, file_name)
                        with open(file_path, "r", encoding="utf-8") as f:
                            data = json.load(f)
                            vagas = data.get("vagas") or []
                            total_career_analyses += 1
                            vacancies_today += len(vagas)
                            for v in vagas:
                                total_vacancies_all_time += 1
                                active_sources.add(v.get("fonte", "Outro"))
                                link = v.get("link")
                                if link:
                                    if link in all_job_links:
                                        duplicate_jobs_count += 1
                                    else:
                                        all_job_links.add(link)
            except Exception as e:
                print(f"Erro ao carregar cache local no fallback do admin: {e}")

    # ultima coleta formatada
    last_collection_formatted = "Não coletado"
    if last_collection_time:
        diff = datetime.now(timezone.utc) - last_collection_time
        seconds = diff.total_seconds()
        if seconds < 60:
            last_collection_formatted = "há alguns segundos"
        elif seconds < 3600:
            minutes = int(seconds / 60)
            last_collection_formatted = f"há {minutes} minutos" if minutes > 1 else "há 1 minuto"
        elif seconds < 86400:
            hours = int(seconds / 3600)
            last_collection_formatted = f"há {hours} horas" if hours > 1 else "há 1 hora"
        else:
            last_collection_formatted = last_collection_time.strftime("%d/%m %H:%M")

    # top 10 skills
    skill_counts = {}
    for s in user_skills:
        skill_counts[s] = skill_counts.get(s, 0) + 1
    top_skills = [{"name": k, "count": v} for k, v in sorted(skill_counts.items(), key=lambda item: item[1], reverse=True)[:10]]

    # top cargos
    role_counts = {}
    for r in user_roles:
        role_counts[r] = role_counts.get(r, 0) + 1
    top_roles = [{"name": k, "count": v} for k, v in sorted(role_counts.items(), key=lambda item: item[1], reverse=True)[:5]]

    sqlite_summary = get_scraper_logs_summary()
    
    # fontes com erro na ultima execucao
    scrapers_with_error = sum(1 for source in sqlite_summary["sourceStats"] if source["status"] == "Erro")

    return {
        "kpis": {
            "vagasHoje": vacancies_today or total_vacancies_all_time,
            "fontesAtivas": len(active_sources) or 4,
            "scrapersComErro": scrapers_with_error,
            "vagasDuplicadas": duplicate_jobs_count,
            "insightsGerados": total_career_analyses,
            "ultimaColeta": last_collection_formatted,
            "usuariosAtivos": total_profiles,
            "perfisConcluidos": completed_profiles,
            "perfisIncompletos": (total_profiles - completed_profiles)
        },
        "topSkills": top_skills,
        "topRoles": top_roles,
        "recentUsers": career_searches[:10],
        "scraperLogs": sqlite_summary
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8080, reload=True)

