# Worky

Plataforma da equipe MindLab (Facens) para analise do mercado de trabalho em tecnologia.

O sistema coleta vagas (scraping + Google Jobs), envia o contexto para um modelo de IA e devolve insights estruturados: competencias, faixa salarial, certificacoes, cursos e match de perfil.

## Stack

- Frontend: React, TypeScript, Vite
- Backend: Python, FastAPI
- Dados: Supabase
- IA: OpenAI (GPT-4o-mini) via `backend/career_ai.py`

## IA no produto (AC1 - Tarefa 5)

A IA nao e um chatbot separado. Ela entra no fluxo principal de carreira:

| Camada | Tecnologia | Onde |
| --- | --- | --- |
| LLM | OpenAI Chat Completions | `backend/career_ai.py` |
| HTTP | FastAPI | `backend/main.py` (`GET /carreira`, `POST /carreira/match`) |
| Contexto | Serper/Google Jobs + scraping + vagas Worky | `google_jobs.py`, `scraper.py`, `worky_jobs.py` |
| UI | Home + `/carreira` | `Dashboard.tsx`, `Career.tsx` |

Fluxo:
1. Usuario escolhe cargo e filtros na Home.
2. Backend coleta vagas e manda o contexto para a OpenAI.
3. A IA devolve competencias, salario, certificacoes, cursos e insight.
4. Match de perfil recalcula aderencia com o mesmo stack.

Variavel obrigatoria no backend: `OPENAI_API_KEY` (opcional: `OPENAI_MODEL`, padrao `gpt-4o-mini`).

## Estrutura

```
Worky
├── backend/          # FastAPI, scraping, IA
├── src/              # React (pages, services, components)
├── package.json
└── README.md
```

## Como rodar

Requisitos: Node.js 18+ e Python 3.10+.

Configure `.env` na raiz e em `backend/` a partir dos `.env.example`.

### Frontend

```bash
npm install
npm run dev
```

Frontend em `http://localhost:5173`.

### Backend

```bash
npm run backend
```

Ou:

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8080 --reload
```

API em `http://localhost:8080`.

## Equipe MindLab (Facens 2026)

| Integrante | RA | Contato | Funcao |
| --- | --- | --- | --- |
| Andre Vitor | 237255 | 237255@facens.br | PO / Fullstack / UX |
| Gabriela | 240636 | 240636@facens.br | Scrum Master / QA e Docs |
| Guilherme Ferreira | 234843 | 234843@facens.br | Scrum Master / PO / Dev |
| Kaick Gomes | 240328 | 240328@facens.br | Backend / NLP e Scraping |
