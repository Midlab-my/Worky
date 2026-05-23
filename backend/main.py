import asyncio
import json
import os
import sys
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
from scraper import JobScraper
from scraper_logger import get_scraper_logs_summary

load_dotenv()

app = FastAPI()
career_store = CareerStore()
course_catalog = CourseCatalog(career_store.client if career_store.is_configured() else None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://workymindlab.netlify.app",
        "https://workyy.vercel.app",
        "http://localhost:5173",
        "http://localhost:4173",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
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
    filtros = dict(request.query_params)
    print(f"Buscando vagas: {filtros}")

    scraper = JobScraper()
    dados_reais = await scraper.run_scrape(filtros)
    return dados_reais


@app.get("/carreira")
async def get_carreira(request: Request):
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
    ttl_hours = int(os.getenv("CAREER_CACHE_TTL_HOURS", "0"))
    normalized_filtros = dict(filtros)
    cached_record = None

    if not force_refresh:
        cached = career_store.get_recent(cargo, normalized_filtros, ttl_hours=ttl_hours)
        if cached:
            try:
                scraped = course_catalog.get_or_fetch(cargo, limit=4)
                if scraped:
                    cached["cursosRecomendados"] = scraped
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
        print(f"Gerando análise de carreira com novo scraping: {cargo}")
        scraper = JobScraper()
        scraped_vagas = await scraper.run_scrape({**normalized_filtros, "cargo": cargo})
        scrape_file_path = await asyncio.to_thread(
            career_store.save_scrape_snapshot,
            cargo,
            normalized_filtros,
            scraped_vagas,
        )
        vagas = await asyncio.to_thread(career_store.load_scrape_snapshot, scrape_file_path)

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
    return analysis


@app.post("/perfil/cursos")
async def sugerir_cursos_perfil(request: Request):
    if not os.getenv("OPENAI_API_KEY", "").strip():
        raise HTTPException(status_code=500, detail="A chave OPENAI_API_KEY nao foi configurada no backend.")

    payload = await request.json()
    profile = payload.get("profile") if isinstance(payload, dict) else None

    if not isinstance(profile, dict):
        raise HTTPException(status_code=400, detail="Envie o perfil profissional no campo 'profile'.")

    analyzer = CareerAIAnalyzer()
    try:
        courses = await asyncio.to_thread(analyzer.suggest_profile_courses, profile)
    except ProfileCourseSuggestionError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return {
        "cursos": courses,
        "metadata": {
            "fonteAnalise": "openai",
            "geradoEm": datetime.now(timezone.utc).isoformat(),
        },
    }


@app.post("/carreira/cursos")
async def sugerir_cursos_carreira(request: Request):
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
    payload = await request.json()
    username = payload.get("username")
    password = payload.get("password")
    if username == "admin" and password == "admin":
        return {"token": "worky-admin-session-token", "message": "Autenticado com sucesso!"}
    raise HTTPException(status_code=401, detail="Credenciais inválidas.")

@app.get("/admin/stats")
async def admin_stats(request: Request):
    # Verify simple token in headers
    token = request.headers.get("Authorization") or request.headers.get("X-Admin-Token")
    if token != "worky-admin-session-token":
        if token not in ("worky-admin-session-token", "Bearer worky-admin-session-token"):
            raise HTTPException(status_code=401, detail="Não autorizado. Token de admin ausente ou inválido.")

    # 1. Fetch Supabase Data
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
                # Normalize timezone format for Python
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

    # Format last collection time
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

    # Aggregate top skills (Top 10)
    skill_counts = {}
    for s in user_skills:
        skill_counts[s] = skill_counts.get(s, 0) + 1
    top_skills = [{"name": k, "count": v} for k, v in sorted(skill_counts.items(), key=lambda item: item[1], reverse=True)[:10]]

    # Aggregate top roles
    role_counts = {}
    for r in user_roles:
        role_counts[r] = role_counts.get(r, 0) + 1
    top_roles = [{"name": k, "count": v} for k, v in sorted(role_counts.items(), key=lambda item: item[1], reverse=True)[:5]]

    # 2. Fetch SQLite logs
    sqlite_summary = get_scraper_logs_summary()
    
    # Calculate scrapers with error (number of sources with error in their last run)
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

