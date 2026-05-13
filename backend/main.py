import asyncio
import json
import os
import sys
from datetime import datetime, timezone

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

sys.stdout.reconfigure(encoding='utf-8')

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from career_ai import CareerAIAnalyzer, CareerAnalysisError, ProfileCourseSuggestionError, build_fallback_analysis
from career_store import CareerStore
from scraper import JobScraper

load_dotenv()

app = FastAPI()
career_store = CareerStore()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8080, reload=True)
