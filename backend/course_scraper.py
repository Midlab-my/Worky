import re
import requests
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import quote_plus

_HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


def _clean(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def scrape_alura(query: str, max_results: int = 3) -> list[dict]:
    try:
        url = f"https://www.alura.com.br/busca?query={quote_plus(query)}"
        resp = requests.get(url, headers=_HEADERS, timeout=15)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        seen: set[str] = set()
        results: list[dict] = []

        candidates = soup.select("a[href*='/curso-online-']") + soup.select("a[href*='/formacao-']")

        for card in candidates:
            href = card.get("href", "")
            if not href or href in seen:
                continue
            seen.add(href)

            full_url = href if href.startswith("https://") else f"https://www.alura.com.br{href}"

            name_el = card.select_one("h3, h4, [class*='name'], [class*='title'], [class*='Name'], [class*='Title']")
            name = _clean(name_el.get_text() if name_el else (card.get("title") or card.get_text()))

            if not name or len(name) < 6 or len(name) > 150:
                continue

            area = "Formação" if "/formacao-" in href else "Tecnologia"

            results.append({
                "plataforma": "Alura",
                "nome": name,
                "url": full_url,
                "area": area,
                "motivo": f"Curso da Alura diretamente relacionado a {query}.",
                "preco": "Assinatura Alura",
            })

            if len(results) >= max_results:
                break

        print(f"[course_scraper] Alura: {len(results)} curso(s) para '{query}'")
        return results

    except Exception as exc:
        print(f"[course_scraper] Alura falhou: {exc}")
        return []


def scrape_fgv(query: str, max_results: int = 2) -> list[dict]:
    sources = [
        ("https://educacao-executiva.fgv.br/busca?q={q}", "https://educacao-executiva.fgv.br", "/cursos/"),
        ("https://educacaocontinuada.fgv.br/cursos?q={q}", "https://educacaocontinuada.fgv.br", "/cursos/"),
    ]
    results: list[dict] = []
    seen: set[str] = set()

    for url_tpl, base, link_fragment in sources:
        if len(results) >= max_results:
            break
        try:
            resp = requests.get(url_tpl.format(q=quote_plus(query)), headers=_HEADERS, timeout=15)
            if resp.status_code >= 400:
                continue
            soup = BeautifulSoup(resp.text, "html.parser")

            cards = (
                soup.select(f"a[href*='{link_fragment}']")
                or soup.select(".views-field-title a")
                or soup.select("article a")
                or soup.select("h3 a, h4 a")
            )

            for card in cards:
                href = card.get("href", "")
                if not href or href in seen:
                    continue
                seen.add(href)

                full_url = href if href.startswith("https://") else f"{base}{href}"
                name = _clean(card.get_text())

                if not name or len(name) < 6 or len(name) > 150:
                    continue

                results.append({
                    "plataforma": "FGV",
                    "nome": name,
                    "url": full_url,
                    "area": "Educação Executiva",
                    "motivo": f"Curso da FGV relevante para {query}.",
                    "preco": "Consultar FGV",
                })

                if len(results) >= max_results:
                    break

        except Exception as exc:
            print(f"[course_scraper] FGV ({url_tpl[:45]}) falhou: {exc}")

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