# <p align="center">🚀 MindLab - Worky.</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Em%20Produ%C3%A7%C3%A3o-success?style=for-the-badge&logo=github&color=3ECF8E" alt="Status: Em Produção">
  <img src="https://img.shields.io/badge/Vers%C3%A3o-1.0.0-blue?style=for-the-badge" alt="Versão 1.0.0">
  <img src="https://img.shields.io/badge/Licen%C3%A7a-Acad%C3%A9mica-orange?style=for-the-badge" alt="Licença Academica">
</p>

---

## 💻 Sobre o Projeto

O **Worky** é uma plataforma inteligente e dinâmica para análise analítica do mercado de trabalho de tecnologia. Desenvolvido pela equipe **MindLab**, o sistema transforma vagas de emprego brutas em insights estratégicos. Através de técnicas avançadas de **NLP (Processamento de Linguagem Natural)** e **Web Scraping**, o Worky extrai informações diretamente de portais de contratação, automatizando o mapeamento de habilidades em alta e estimando faixas salariais reais.

### 🌟 Diferenciais
* **Análise Semântica com NLP:** Vai muito além de simples correspondência de palavras-chave, diferenciando competências técnicas reais de termos genéricos.
* **Dashboards Dinâmicos:** Visualização analítica rica de tendências de mercado, médias salariais reais e linguagens de programação em ascensão.
* **Segurança e Moderação:** Mapeamento inteligente de vagas e canal dedicado para denúncia de vagas falsas ou suspeitas.
* **Experiência Premium (UX/UI):** Interface moderna com transições suaves, responsividade impecável e design sofisticado.

---

## 🛠️ Tecnologias & Ferramentas

O ecossistema do **Worky** foi planejado para alta performance, escalabilidade e desenvolvimento ágil, dividindo-se entre um frontend interativo de última geração e um backend analítico robusto.

### **Frontend**
<p align="left">
  <img src="https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" alt="React">
  <img src="https://img.shields.io/badge/typescript-%23007acc.svg?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="TailwindCSS">
  <img src="https://img.shields.io/badge/Framer-black?style=for-the-badge&logo=framer&logoColor=blue" alt="Framer Motion">
  <img src="https://img.shields.io/badge/Radix_UI-161618?style=for-the-badge&logo=radix-ui&logoColor=white" alt="Radix UI">
</p>

### **Backend & Dados**
<p align="left">
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=009688" alt="FastAPI">
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase">
  <img src="https://img.shields.io/badge/Beautiful_Soup-4B0082?style=for-the-badge&logo=python&logoColor=white" alt="Beautiful Soup 4">
</p>

### **IA (entrega AC1 Tarefa 5 - uso existente no produto)**

A Worky ja integra IA generativa no fluxo principal de carreira. Nao e um widget de chat separado: o "chatbot"/assistente da startup e o motor de analise que recebe o comando do usuario (cargo + filtros) e devolve insights estruturados via OpenAI.

| Camada | Tecnologia | Onde no codigo |
| :--- | :--- | :--- |
| LLM | OpenAI GPT-4o-mini (Chat Completions API) | `backend/career_ai.py` |
| Orquestracao HTTP | FastAPI | `backend/main.py` (`GET /carreira`, `POST /carreira/match`, cursos) |
| Prompt engineering | System/user prompts + resposta JSON | `CareerAIAnalyzer` |
| Contexto de mercado | Google Jobs (Serper) + Web Scraping + vagas Worky | `google_jobs.py`, `scraper.py`, `worky_jobs.py` |
| Interface | Home (busca) + pagina `/carreira` (resultado da IA) | `Dashboard.tsx`, `Career.tsx` |

**Fluxo principal demonstravel (parcial e funcional):**
1. Usuario escolhe um cargo e filtros na Home.
2. Backend coleta vagas reais e envia o contexto para a OpenAI.
3. A IA retorna competencias, faixa salarial, certificacoes, cursos e insight de mercado.
4. Match de perfil (`POST /carreira/match`) recalcula aderencia com o mesmo stack de IA.

Variavel obrigatoria no backend: `OPENAI_API_KEY` (opcional: `OPENAI_MODEL`, padrao `gpt-4o-mini`).


---

## 📁 Estrutura de Pastas

O repositório é organizado de forma modular para separar as responsabilidades de interface e processamento analítico:

```yaml
📂 Worky-principal
 ├── 📂 backend                  # Engine analítica & APIs (FastAPI)
 │    ├── 📄 main.py             # Endpoint principal FastAPI
 │    ├── 📄 scraper.py          # Script de Web Scraping para vagas
 │    ├── 📄 career_ai.py        # Processamento inteligente de NLP e IA
 │    ├── 📄 career_store.py     # Integração direta com banco Supabase
 │    └── 📄 requirements.txt    # Dependências do Python
 ├── 📂 src                      # Interface do Usuário (React)
 │    ├── 📂 app
 │    │    ├── 📂 components     # Componentes reutilizáveis & design tokens
 │    │    ├── 📂 pages          # Páginas (Dashboard, Perfil, Carreiras, Admin, Auth)
 │    │    ├── 📂 services       # Comunicação com APIs externas e Supabase
 │    │    └── 📄 routes.tsx     # Definição e proteção das rotas
 │    ├── 📂 styles              # Estilização global, temas e fontes
 │    └── 📄 main.tsx            # Inicialização do React
 ├── 📄 package.json             # Scripts e dependências do Node.js
 ├── 📄 index.html               # Ponto de entrada HTML5
 └── 📄 README.md                # Documentação do projeto (Você está aqui!)
```

---

## 🚀 Como Executar o Projeto

> [!IMPORTANT]
> Certifique-se de ter instalado em sua máquina o **Node.js** (v18 ou superior) e o **Python 3.10+**.

### 1. Configurar variáveis de ambiente
Crie arquivos `.env` tanto no diretório raiz do frontend quanto no diretório `/backend` utilizando os arquivos `.env.example` como base.

---

### 💻 Rodando o Frontend (Vite + React)
No diretório raiz do projeto:

```bash
# 1. Instalar as dependências do projeto
npm install

# 2. Iniciar o servidor de desenvolvimento
npm run dev
```
O frontend estará acessível em `http://localhost:5173`.

---

### ⚙️ Rodando o Backend (FastAPI + Python)
Para iniciar o servidor FastAPI integrado:

```bash
# Executar a task de setup e inicialização automatizada
npm run backend
```
Isso instalará os requisitos listados no `backend/requirements.txt` e iniciará o servidor Uvicorn em `http://localhost:8080`.

*Alternativamente, você pode rodar manualmente de dentro da pasta `/backend`:*
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8080 --reload
```

---

## 👥 Equipe MindLab (Facens 2026)

Conheça as mentes brilhantes por trás da criação e execução da plataforma Worky:

<div align="center">

| Integrante | RA | Contato | Função Principal |
| :--- | :---: | :--- | :--- |
| **André Vitor** | `237255` | ✉️ [237255@facens.br](mailto:237255@facens.br) | PO / Fullstack Dev / UX UI Designer |
| **Gabriela** | `240636` | ✉️ [240636@facens.br](mailto:240636@facens.br) | Scrum Master / QA & Docs |
| **Guilherme Ferreira** | `234843` | ✉️ [234843@facens.br](mailto:234843@facens.br) | Scrum Master / Product Owner / Dev |
| **Kaick Gomes** | `240328` | ✉️ [240328@facens.br](mailto:240328@facens.br) | Backend Engineer / NLP & Scraping |

</div>

> [!TIP]
> Para dúvidas acadêmicas ou colaboração com o projeto, sinta-se à vontade para entrar em contato com qualquer um dos membros via e-mail corporativo Facens.

---
<p align="center">
  <sub>Desenvolvido com 💙 por <b>MindLab Team</b> - Facens 2026.</sub>
</p>
