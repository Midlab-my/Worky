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
    ("front-end", ["frontend", "front-end", "html", "css", "react", "vue", "angular", "javascript", "typescript", "web"]),
    ("programacao", ["programacao", "programação", "python", "java", "php", "ruby", "golang", "go", "rust", "c#", "dotnet", "backend", "back-end", "nodejs", "node"]),
    ("data-science", ["dados", "data", "analytics", "bi", "machine learning", "ml", "ia", "inteligencia artificial", "sql", "excel", "power bi", "tableau", "ciencia de dados"]),
    ("mobile", ["mobile", "android", "ios", "flutter", "react native", "kotlin", "swift"]),
    ("devops", ["devops", "docker", "kubernetes", "aws", "azure", "gcp", "cloud", "nuvem", "infraestrutura", "sre", "linux"]),
    ("design-ux", ["ux", "ui", "design", "figma", "produto", "product", "pesquisa", "prototipo", "designer"]),
    ("agile", ["gestao", "gestão", "agil", "agile", "scrum", "kanban", "product owner", "po", "gerente", "coordenador", "liderança", "lideranca", "projeto", "projetos", "pmo"]),
    ("banco-de-dados", ["banco de dados", "database", "mysql", "postgresql", "mongodb", "dba", "redis", "oracle"]),
    ("seguranca", ["seguranca", "segurança", "security", "pentest", "ciberseguranca"]),
    ("marketing", ["marketing", "seo", "midia", "social media", "publicidade", "growth"]),
    ("programacao", ["inovacao", "inovação", "empreendedorismo", "startup", "negocio", "business"]),
]

_ALURA_BASE = "https://www.alura.com.br"


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


def scrape_courses(cargo: str, max_results: int = 3) -> list[dict]:
    """Roda Alura e FGV em paralelo e retorna até max_results cursos."""
    with ThreadPoolExecutor(max_workers=2) as pool:
        alura_f = pool.submit(scrape_alura, cargo, max_results)
        fgv_f = pool.submit(scrape_fgv, cargo, max(1, max_results - 2))
        alura_results = alura_f.result()
        fgv_results = fgv_f.result()

    return (alura_results + fgv_results)[:max_results]
