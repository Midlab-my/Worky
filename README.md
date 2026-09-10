# Worky

Plataforma da squad **MindLab** (Facens) para analise do mercado de trabalho e conexao entre candidatos e empresas.

Stack principal: React + TypeScript + Vite (frontend), FastAPI + Python (backend), Supabase (auth e dados), OpenAI (IA).

Repositorio: https://github.com/Midlab-my/Worky

## IA no Worky (AC1 - Tarefa 5)

### O que e (e o que nao e)

A Worky **nao** possui um chatbot de conversa livre (tipo balao de chat no canto da tela).

A IA esta no **fluxo principal do produto**: o usuario informa um cargo (comando), o backend coleta vagas reais e um modelo de linguagem analisa esse contexto com tecnicas de **PLN (Processamento de Linguagem Natural)**, devolvendo um resultado estruturado na pagina `/carreira`.

Essa abordagem foi alinhada com a orientacao da disciplina de IA: o requisito e demonstrar IA funcional parcial integrada ao projeto, nao obrigatoriamente um chatbot conversacional separado.

### Tecnologias e frameworks de IA

- **OpenAI Chat Completions API** (`https://api.openai.com/v1/chat/completions`)
- **Modelo padrao:** `gpt-4o-mini` (variavel `OPENAI_MODEL`)
- **Modulo:** `backend/career_ai.py` (classe `CareerAIAnalyzer`)
- **Orquestracao:** FastAPI em `backend/main.py`
- **Contexto de mercado (entrada da IA):**
  - Google Jobs via Serper (`google_jobs.py`)
  - Web scraping de portais (`scraper.py`)
  - Vagas internas Worky (`worky_jobs.py`)
- **Interface:** Home (`Dashboard.tsx`) e resultado (`Career.tsx`)

### Fluxo principal (demo)

1. Usuario busca um cargo na Home (ex.: Desenvolvedor Frontend) e aplica filtros.
2. Backend agrega vagas e monta o contexto textual.
3. A OpenAI recebe system/user prompts e responde em JSON (competencias, faixa salarial, certificacoes, cursos, insight de mercado).
4. A UI renderiza a analise em `/carreira`.
5. Opcional: match de perfil (`POST /carreira/match`) recalcula aderencia com o mesmo motor.

### Endpoints usados pela IA

- `GET /carreira` - analise de carreira
- `POST /carreira/match` - match perfil x carreira
- endpoints de cursos com sugestao assistida por IA

### Variaveis de ambiente (backend)

- `OPENAI_API_KEY` (obrigatoria)
- `OPENAI_MODEL` (opcional, padrao `gpt-4o-mini`)

## Como rodar

Requisitos: Node.js 18+ e Python 3.10+.

Configure `.env` na raiz e em `backend/` a partir dos `.env.example`.

### Frontend

```bash
npm install
npm run dev
```

Frontend: `http://localhost:5173`

### Backend

```bash
npm run backend
```

API: `http://localhost:8080`

## Estrutura

```
Worky/
├── backend/     # FastAPI, scraping, IA (career_ai.py)
├── src/         # React (pages, services, components)
├── package.json
└── README.md
```

## Equipe MindLab (Facens 2026)

- Andre Vitor (RA 237255) - PO / Fullstack / UX - 237255@facens.br
- Gabriela (RA 240636) - Scrum Master / QA e Docs - 240636@facens.br
- Guilherme Ferreira (RA 234843) - Scrum Master / PO / Dev - 234843@facens.br
- Kaick Gomes (RA 240328) - Backend / PLN e Scraping - 240328@facens.br

## Links da entrega (Tarefa 5)

- GitHub: https://github.com/Midlab-my/Worky
- Trello: https://trello.com/b/pXjsDFkb/worky
