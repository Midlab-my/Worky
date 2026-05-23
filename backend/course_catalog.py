import unicodedata
from datetime import datetime, timedelta, timezone
from typing import Any

CATALOG_TABLE = "course_catalog"
CATALOG_TTL_DAYS = 30


def _normalize_key(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text.strip().lower())
    ascii_text = "".join(ch for ch in normalized if not unicodedata.combining(ch))
    return " ".join(ascii_text.split())


class CourseCatalog:
    def __init__(self, client: Any | None) -> None:
        self.client = client

    def _is_ready(self) -> bool:
        return self.client is not None

    def get(self, query_key: str, limit: int = 3) -> list[dict] | None:
        """Retorna cursos do catálogo se existirem e estiverem dentro do TTL. None = miss."""
        if not self._is_ready():
            return None
        try:
            cutoff = (datetime.now(timezone.utc) - timedelta(days=CATALOG_TTL_DAYS)).isoformat()
            result = (
                self.client.table(CATALOG_TABLE)
                .select("plataforma, nome, url, area, motivo, preco")
                .eq("query_key", query_key)
                .gte("scraped_at", cutoff)
                .limit(limit)
                .execute()
            )
            rows = result.data or []
            return rows if rows else None
        except Exception as exc:
            print(f"[course_catalog] get falhou: {exc}")
            return None

    def save(self, query_key: str, courses: list[dict]) -> None:
        """Salva cursos raspados no catálogo (upsert por query_key + plataforma + nome)."""
        if not self._is_ready() or not courses:
            return
        try:
            now = datetime.now(timezone.utc).isoformat()
            rows = [
                {
                    "query_key": query_key,
                    "plataforma": c.get("plataforma", ""),
                    "nome": c.get("nome", ""),
                    "url": c.get("url", ""),
                    "area": c.get("area", ""),
                    "motivo": c.get("motivo", ""),
                    "preco": c.get("preco", ""),
                    "scraped_at": now,
                }
                for c in courses
                if c.get("plataforma") and c.get("nome")
            ]
            if rows:
                self.client.table(CATALOG_TABLE).upsert(
                    rows, on_conflict="query_key,plataforma,nome"
                ).execute()
                print(f"[course_catalog] {len(rows)} curso(s) salvos para '{query_key}'")
        except Exception as exc:
            print(f"[course_catalog] save falhou: {exc}")

    def get_or_fetch(self, cargo: str, limit: int = 4) -> list[dict]:
        """
        Retorna cursos do catálogo (cache hit) ou executa o scraper,
        salva no banco e devolve o resultado (cache miss).
        Cache parcial (menos que limit) é tratado como miss para re-scrape.
        """
        from course_scraper import scrape_courses

        query_key = _normalize_key(cargo)

        cached = self.get(query_key, limit)
        if cached and len(cached) >= limit:
            print(f"[course_catalog] HIT '{query_key}' → {len(cached)} curso(s)")
            return cached

        print(f"[course_catalog] MISS '{query_key}' → iniciando scraping...")
        scraped = scrape_courses(cargo, limit)

        if scraped:
            self.save(query_key, scraped)

        return scraped if scraped else (cached or [])