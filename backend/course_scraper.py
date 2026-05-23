import re
import unicodedata
import requests
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import quote_plus

_HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

# Alura search page é CSR — usa páginas de categoria que têm SSR
# Cada tupla: (slug_categoria, [keywords_para_match])
_ALURA_CATEGORY_MAP: list[tuple[str, list[str]]] = [
    ("front-end", ["frontend", "front-end", "html", "css", "react", "vue", "angular", "javascript", "typescript", "web developer"]),
    ("programacao", ["programacao", "programação", "python", "java ", "php", "ruby", "golang", "rust", "c#", "dotnet", "backend", "back-end", "nodejs", "node.js"]),
    ("data-science", ["dados", "data science", "analytics", "machine learning", "inteligencia artificial", "sql", "excel", "power bi", "tableau", "ciencia de dados", "analise de dados"]),
    ("mobile", ["mobile", "android", "ios", "flutter", "react native", "kotlin", "swift"]),
    ("devops", ["devops", "docker", "kubernetes", "aws", "azure", "gcp", "cloud", "nuvem", "infraestrutura", "sre", "linux"]),
    ("design-ux", ["ux design", "ui design", "design", "figma", "produto", "product design", "designer"]),
    ("agile", ["gestao", "gestão", "agile", "scrum", "kanban", "product owner", "gerente de projetos", "coordenador", "lideranca", "projeto", "pmo"]),
    ("banco-de-dados", ["banco de dados", "database", "mysql", "postgresql", "mongodb", "dba", "redis", "oracle"]),
    ("seguranca", ["seguranca", "segurança", "cybersecurity", "pentest", "ciberseguranca"]),
    ("marketing-digital", ["marketing", "seo", "social media", "midias sociais", "publicidade", "growth", "midia digital", "social"]),
]

_ALURA_BASE = "https://www.alura.com.br"

# Cursos curados de plataformas externas — URLs validadas, estáveis
# Chave = categoria (mesmos slugs do _ALURA_CATEGORY_MAP + extras)
_CURATED_EXTERNAL: dict[str, dict] = {
    "front-end": {
        "plataforma": "Coursera",
        "nome": "Meta Front-End Developer Professional Certificate",
        "url": "https://www.coursera.org/professional-certificates/meta-front-end-developer",
        "area": "Front-End",
        "motivo": "Certificação profissional Meta — reconhecida pelo mercado global.",
        "preco": "Plano Coursera",
    },
    "programacao": {
        "plataforma": "Udemy",
        "nome": "Python Bootcamp: do Zero ao Avançado em Python 3",
        "url": "https://www.udemy.com/course/complete-python-bootcamp/",
        "area": "Programação",
        "motivo": "Bestseller com mais de 1 milhão de alunos no mundo todo.",
        "preco": "Curso Udemy",
    },
    "data-science": {
        "plataforma": "Coursera",
        "nome": "Google Data Analytics Professional Certificate",
        "url": "https://www.coursera.org/professional-certificates/google-data-analytics",
        "area": "Dados",
        "motivo": "Certificação Google amplamente valorizada por recrutadores.",
        "preco": "Plano Coursera",
    },
    "mobile": {
        "plataforma": "Coursera",
        "nome": "Meta Android Developer Professional Certificate",
        "url": "https://www.coursera.org/professional-certificates/meta-android-developer",
        "area": "Mobile",
        "motivo": "Certificação oficial Meta para desenvolvimento Android.",
        "preco": "Plano Coursera",
    },
    "devops": {
        "plataforma": "Coursera",
        "nome": "Google IT Automation with Python Professional Certificate",
        "url": "https://www.coursera.org/professional-certificates/google-it-automation",
        "area": "DevOps",
        "motivo": "Automação e DevOps com Python — certificação Google.",
        "preco": "Plano Coursera",
    },
    "design-ux": {
        "plataforma": "Coursera",
        "nome": "Google UX Design Professional Certificate",
        "url": "https://www.coursera.org/professional-certificates/google-ux-design",
        "area": "UX Design",
        "motivo": "Certificação Google em UX — referência mundial na área.",
        "preco": "Plano Coursera",
    },
    "agile": {
        "plataforma": "Coursera",
        "nome": "Google Project Management Professional Certificate",
        "url": "https://www.coursera.org/professional-certificates/google-project-management",
        "area": "Gestão",
        "motivo": "Certificação Google em gerenciamento de projetos — Agile e Scrum.",
        "preco": "Plano Coursera",
    },
    "banco-de-dados": {
        "plataforma": "Coursera",
        "nome": "IBM Data Science Professional Certificate",
        "url": "https://www.coursera.org/professional-certificates/ibm-data-science",
        "area": "Banco de Dados",
        "motivo": "Certificação IBM em ciência de dados e SQL.",
        "preco": "Plano Coursera",
    },
    "seguranca": {
        "plataforma": "Coursera",
        "nome": "Google Cybersecurity Professional Certificate",
        "url": "https://www.coursera.org/professional-certificates/google-cybersecurity",
        "area": "Segurança",
        "motivo": "Certificação Google em cibersegurança para o mercado atual.",
        "preco": "Plano Coursera",
    },
    "marketing": {
        "plataforma": "Coursera",
        "nome": "Meta Social Media Marketing Professional Certificate",
        "url": "https://www.coursera.org/professional-certificates/facebook-social-media-marketing",
        "area": "Marketing Digital",
        "motivo": "Certificação Meta para marketing em redes sociais.",
        "preco": "Plano Coursera",
    },
    "financas": {
        "plataforma": "Coursera",
        "nome": "Financial Markets — Yale University",
        "url": "https://www.coursera.org/learn/financial-markets-global",
        "area": "Finanças",
        "motivo": "Curso de mercados financeiros de Yale com reputação global.",
        "preco": "Plano Coursera",
    },
    "default": {
        "plataforma": "Coursera",
        "nome": "Google Project Management Professional Certificate",
        "url": "https://www.coursera.org/professional-certificates/google-project-management",
        "area": "Carreira",
        "motivo": "Certificação profissional Google valorizada globalmente.",
        "preco": "Plano Coursera",
    },
}

# Mapeamento de keywords para a chave do catálogo externo
_EXTERNAL_KEYWORD_MAP: list[tuple[str, list[str]]] = [
    ("front-end", ["frontend", "front-end", "html", "css", "react", "vue", "angular", "javascript", "typescript", "web developer"]),
    ("data-science", ["dados", "data science", "analytics", "machine learning", "sql", "power bi", "ciencia de dados", "analise de dados", "business intelligence"]),
    ("mobile", ["mobile", "android", "ios", "flutter", "kotlin", "swift", "react native"]),
    ("devops", ["devops", "docker", "kubernetes", "aws", "azure", "gcp", "cloud", "sre", "linux"]),
    ("design-ux", ["ux design", "ui design", "design", "figma", "produto", "product design", "designer"]),
    ("agile", ["gestao", "gestão", "agile", "scrum", "kanban", "gerente de projetos", "lideranca", "projeto", "pmo"]),
    ("banco-de-dados", ["banco de dados", "database", "mysql", "postgresql", "mongodb", "dba"]),
    ("seguranca", ["seguranca", "segurança", "cybersecurity", "pentest", "ciberseguranca"]),
    ("marketing", ["marketing digital", "seo", "social media", "midias sociais", "publicidade", "growth hacking", "midia digital"]),
    ("financas", ["financeiro", "financas", "finanças", "contabilidade", "economia", "investimento", "bolsa", "bancario", "finance", "analyst"]),
    ("programacao", ["programacao", "programação", "python", "java ", "php", "backend", "back-end", "nodejs", "golang", "desenvolvedor"]),
]


def _pick_external_course(cargo: str) -> dict:
    norm = _normalize(cargo)
    best_key = "default"
    best_score = 0
    for key, keywords in _EXTERNAL_KEYWORD_MAP:
        score = sum(1 for kw in keywords if kw in norm)
        if score > best_score:
            best_score = score
            best_key = key
    return _CURATED_EXTERNAL.get(best_key, _CURATED_EXTERNAL["default"])


def _normalize(text: str) -> str:
    n = unicodedata.normalize("NFKD", text.lower())
    return "".join(c for c in n if not unicodedata.combining(c))


def _pick_alura_category(cargo: str) -> str:
    norm = _normalize(cargo)
    best_slug = "tecnologia"
    best_score = 0
    for slug, keywords in _ALURA_CATEGORY_MAP:
        score = sum(1 for kw in keywords if kw in norm)
        if score > best_score:
            best_score = score
            best_slug = slug
    return best_slug


def _clean(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def scrape_alura(query: str, max_results: int = 3) -> list[dict]:
    try:
        category = _pick_alura_category(query)
        url = f"{_ALURA_BASE}/cursos-online-{category}"
        resp = requests.get(url, headers=_HEADERS, timeout=15)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        query_words = [w for w in _normalize(query).split() if len(w) > 2]
        results: list[dict] = []
        seen: set[str] = set()

        for a in soup.select("a[href*='/curso-online-']"):
            href = a.get("href", "")
            if not href or href in seen:
                continue

            name_el = a.select_one("span.card-curso__nome")
            if not name_el:
                name_el = a.select_one("h3, h4, [class*='nome'], [class*='title']")
            name = _clean(name_el.get_text() if name_el else a.get_text())

            if not name or len(name) < 6 or len(name) > 150:
                continue

            # Prioriza cursos cujo slug ou nome contenha palavras da query
            href_norm = _normalize(href)
            name_norm = _normalize(name)
            relevance = sum(1 for w in query_words if w in href_norm or w in name_norm)

            seen.add(href)
            full_url = href if href.startswith("https://") else f"{_ALURA_BASE}{href}"
            results.append((relevance, name, full_url))

        # Ordena por relevância desc, pega os top N
        results.sort(key=lambda x: x[0], reverse=True)
        top = [
            {
                "plataforma": "Alura",
                "nome": name,
                "url": full_url,
                "area": "Tecnologia",
                "motivo": f"Curso da Alura relacionado a {query}.",
                "preco": "Assinatura Alura",
            }
            for _, name, full_url in results[:max_results]
        ]

        # Inclui formações também
        formacoes: list[dict] = []
        for a in soup.select("a[href*='/formacao-']"):
            href = a.get("href", "")
            if not href or href in seen:
                continue
            name_el = a.select_one("span.card-curso__nome, h3, h4, [class*='nome']")
            name = _clean(name_el.get_text() if name_el else a.get_text())
            if not name or len(name) < 6 or len(name) > 150:
                continue
            seen.add(href)
            full_url = href if href.startswith("https://") else f"{_ALURA_BASE}{href}"
            formacoes.append({
                "plataforma": "Alura",
                "nome": name,
                "url": full_url,
                "area": "Formação",
                "motivo": f"Formação da Alura relacionada a {query}.",
                "preco": "Assinatura Alura",
            })

        combined = top + formacoes
        print(f"[course_scraper] Alura: {len(combined[:max_results])} curso(s) para '{query}' (categoria: {category})")
        return combined[:max_results]

    except Exception as exc:
        print(f"[course_scraper] Alura falhou: {exc}")
        return []


def scrape_fgv(query: str, max_results: int = 2) -> list[dict]:
    base = "https://educacao-executiva.fgv.br"
    search_url = f"{base}/busca?busca={quote_plus(query)}"
    results: list[dict] = []
    seen: set[str] = set()

    try:
        resp = requests.get(search_url, headers=_HEADERS, timeout=15)
        if resp.status_code >= 400:
            print(f"[course_scraper] FGV retornou HTTP {resp.status_code}")
            return []
        soup = BeautifulSoup(resp.text, "html.parser")

        for row in soup.select(".views-row"):
            if len(results) >= max_results:
                break
            a = row.find("a", href=True)
            if not a:
                continue
            href = a.get("href", "")
            if not href or href in seen:
                continue
            # Ignora links de navegação genéricos
            if href.endswith("/cursos") or "?ref=" in href or "#" in href:
                continue
            seen.add(href)

            full_url = href if href.startswith("https://") else f"{base}{href}"
            name = _clean(a.get_text())
            if not name or len(name) < 6 or len(name) > 200:
                continue

            results.append({
                "plataforma": "FGV",
                "nome": name,
                "url": full_url,
                "area": "Educação Executiva",
                "motivo": f"Curso da FGV relevante para {query}.",
                "preco": "Consultar FGV",
            })

    except Exception as exc:
        print(f"[course_scraper] FGV falhou: {exc}")

    print(f"[course_scraper] FGV: {len(results)} curso(s) para '{query}'")
    return results


_SOFTSKILL_KEYWORDS = [
    "comunicacao", "lideranca", "produtividade", "feedback", "carreira",
    "negociacao", "equipe", "colaboracao", "emocional", "interpessoal",
    "apresentacao", "relacionamento", "soft", "gestao de conflito",
]

# Fallback garantido — URL validada manualmente, sempre retorna algo
_SOFTSKILL_FALLBACK: dict = {
    "plataforma": "Alura",
    "nome": "Curso Liderança Ágil: aprimoramento de soft skills",
    "url": "https://www.alura.com.br/curso-online-lideranca-agil-aprimoramento-soft-skills",
    "area": "Soft Skills",
    "motivo": "Desenvolva competências interpessoais essenciais para crescer na carreira.",
    "preco": "Assinatura Alura",
}


def scrape_softskill() -> dict:
    """Retorna 1 curso de soft skills. Usa fallback hardcoded se scraping falhar."""
    try:
        resp = requests.get(f"{_ALURA_BASE}/cursos-online-agile", headers=_HEADERS, timeout=10)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        candidates: list[tuple[int, str, str]] = []
        seen: set[str] = set()

        for a in soup.select("a[href*='/curso-online-']"):
            href = a.get("href", "")
            if not href or href in seen:
                continue
            name_el = a.select_one("span.card-curso__nome")
            if not name_el:
                continue
            name = _clean(name_el.get_text())
            if not name or len(name) < 6 or len(name) > 150:
                continue
            seen.add(href)
            href_n = _normalize(href)
            name_n = _normalize(name)
            score = sum(1 for kw in _SOFTSKILL_KEYWORDS if kw in href_n or kw in name_n)
            candidates.append((score, name, href))

        candidates.sort(key=lambda x: x[0], reverse=True)
        if candidates:
            _, name, href = candidates[0]
            full_url = href if href.startswith("https://") else f"{_ALURA_BASE}{href}"
            print(f"[course_scraper] softskill scraped: '{name[:50]}'")
            return {
                "plataforma": "Alura",
                "nome": name,
                "url": full_url,
                "area": "Soft Skills",
                "motivo": "Desenvolva competências interpessoais essenciais para crescer na carreira.",
                "preco": "Assinatura Alura",
            }
    except Exception as exc:
        print(f"[course_scraper] softskill scraping falhou ({exc}), usando fallback")

    return _SOFTSKILL_FALLBACK


def scrape_courses(cargo: str, max_results: int = 4) -> list[dict]:
    """2 Alura técnicos + 1 Coursera/Udemy curado + 1 soft skill."""
    alura_limit = max_results - 2  # 2 técnicos
    with ThreadPoolExecutor(max_workers=2) as pool:
        alura_f = pool.submit(scrape_alura, cargo, alura_limit)
        soft_f = pool.submit(scrape_softskill)
        alura_results = alura_f.result()
        soft_course = soft_f.result()

    external = _pick_external_course(cargo)
    technical = alura_results[:alura_limit]
    return (technical + [external, soft_course])[:max_results]
