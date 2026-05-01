from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from scraper import JobScraper
import json
import os
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    print(f"🔥 BUSCANDO VAGAS: {filtros}")
    
    scraper = JobScraper()
    dados_reais = await scraper.run_scrape(filtros)
    return dados_reais

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
