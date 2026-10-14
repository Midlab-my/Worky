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

## Segurança e implantação

O backend minimiza as entradas de IA em `ai_privacy.py`, usando apenas o vocabulário
profissional revisado de `professional_vocabulary.json`. O arquivo inclui as
competências existentes do formulário. Textos livres não reconhecidos não são
repassados: cargos sem conceitos reconhecidos recebem 422. Revise a cobertura
antes de ampliar o vocabulário; nunca acrescente nomes pessoais, empregadores ou
instituições específicas. A minimização também cobre o slug do scraper e as
chamadas auxiliares. Não usa outra IA para anonimizar dados.

Os pesos e o tratamento do percentual do Match, a fórmula do resumo e as fórmulas
salariais permanecem. Resultados novos do modelo podem variar por receberem menos
contexto, especialmente localização e biografia. Não há garantia de equivalência
numérica ou de qualidade sem uma avaliação de homologação. Links sugeridos pela
IA são validados por domínio localmente; o servidor não verifica sua disponibilidade
por HTTP. Um link rejeitado fica vazio, preservando a recomendação.

Antes de publicar backend e frontend juntos:

1. Em homologação, confira a aplicação de `backend/20261013_security.sql` após o
   schema-base. A migração já existente não foi executada automaticamente. Ela
   remove leitura ampla de perfis, protege planos, cria `recruitment_visible` e
   fornece as RPCs privadas de limitação e solicitação de planos. Se já estiver
   aplicada, verifique permissões efetivas; não precisa executá-la novamente.
2. Confirme que a chave privilegiada existe apenas no servidor. A ausência das
   RPCs de segurança faz operações protegidas falharem com 503, sem liberar acesso.
3. Valide RLS com duas contas fictícias e duas empresas em banco isolado: acesso
   próprio permitido; perfil alheio e alteração direta de plano negados. Teste
   empresas Starter/Pro e revogação de consentimento. Não use dados de produção.
4. Candidatos precisam consentir explicitamente no perfil para aparecer no RH.
   O cálculo de compatibilidade empresarial ocorre no backend com a fórmula
   anterior; a resposta não contém perfil bruto, e-mail ou UUID do candidato.
5. Solicitações de plano não concedem privilégios. A concessão é uma operação
   administrativa do servidor, através da RPC já existente `worky_set_company_plan`.
6. Configure confiança em proxies no servidor ASGI somente para proxies conhecidos.
   O aplicativo não interpreta `X-Forwarded-For` por conta própria.

A geração de análise nova e as operações pessoais exigem sessão Supabase válida;
consultas públicas ao cache continuam disponíveis. Tokens não são encaminhados à
OpenAI. O cache anterior não é tratado como validado pela política atual.
Limites de operações protegidas são compartilhados via PostgreSQL.

Testes locais, sem OpenAI ou Supabase reais:

```bash
python -m unittest discover -s backend/tests -v
npm run build
```

Os testes verificam os seis corpos HTTP enviados à IA, dados pessoais em campos
livres, autorização de rotas, identidade do perfil, destinos de URLs e cache.
RLS em execução e qualidade real do modelo exigem homologação separada.

## Estrutura do projeto

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
