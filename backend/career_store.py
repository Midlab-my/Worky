import hashlib
import json
import os
import re
import unicodedata
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any

from supabase import Client, create_client


BASE_PATH = os.path.dirname(os.path.abspath(__file__))
CURRENT_SCHEMA_VERSION = 2
DEFAULT_SUPABASE_TABLE = "career_analyses"
DEFAULT_SCRAPE_CACHE_DIR = "scrape_cache"


def normalize_filters(filtros: dict[str, Any] | None) -> dict[str, str]:
    normalized: dict[str, str] = {}
    for key, value in sorted((filtros or {}).items()):
        if value is None:
            continue
        text = str(value).strip()
        if text:
            normalized[key] = text
    return normalized


def normalize_text(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value.strip().lower())
    ascii_text = "".join(ch for ch in normalized if not unicodedata.combining(ch))
    return " ".join(ascii_text.split())


def normalize_career_key(cargo: str, filtros: dict[str, Any] | None = None) -> str:
    base_key = normalize_text(cargo)
    normalized_filters = normalize_filters(filtros)
    if not normalized_filters:
        return base_key

    serialized_filters = json.dumps(
        normalized_filters,
        ensure_ascii=True,
        separators=(",", ":"),
        sort_keys=True,
    )
    filters_hash = hashlib.sha256(serialized_filters.encode("utf-8")).hexdigest()[:12]
    return f"{base_key}::{filters_hash}"


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def parse_iso_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


def is_record_fresh(updated_at: str | None, ttl_hours: int) -> bool:
    parsed = parse_iso_datetime(updated_at)
    if not parsed:
        return False
    if ttl_hours <= 0:
        return True
    min_updated_at = datetime.now(timezone.utc) - timedelta(hours=ttl_hours)
    return parsed >= min_updated_at


def is_analysis_cache_valid(analysis: dict[str, Any]) -> bool:
    metadata = analysis.get("metadata", {})
    if metadata.get("fonteAnalise") == "fallback":
        return False
    if metadata.get("schemaVersion") != CURRENT_SCHEMA_VERSION:
        return False

    competencias = analysis.get("competenciasDesejadas", {})
    tech = competencias.get("habilidadesTecnicas") or []
    soft = competencias.get("softSkills") or []
    certs = analysis.get("certificacoesRecomendadas") or []
    courses = analysis.get("cursosRecomendados") or []
    return any([tech, soft, certs, courses])


def coerce_json_value(value: Any, fallback: Any) -> Any:
    if value in (None, ""):
        return fallback
    if isinstance(value, str):
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return fallback
    return value


@dataclass
class CareerRecord:
    cargo: str
    filtros: dict[str, Any]
    vagas: list[dict[str, Any]]
    analysis: dict[str, Any]
    created_at: str | None
    updated_at: str | None
    scrape_file_path: str | None


class CareerStore:
    def __init__(self) -> None:
        self.supabase_url = os.getenv("SUPABASE_URL", "").strip()
        self.supabase_key = (
            os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
            or os.getenv("SUPABASE_KEY", "").strip()
        )
        self.table_name = os.getenv("SUPABASE_CAREER_TABLE", DEFAULT_SUPABASE_TABLE).strip() or DEFAULT_SUPABASE_TABLE
        self.scrape_cache_dir_name = (
            os.getenv("CAREER_SCRAPE_CACHE_DIR", DEFAULT_SCRAPE_CACHE_DIR).strip().strip("\\/")
            or DEFAULT_SCRAPE_CACHE_DIR
        )
        self.scrape_cache_dir = os.path.join(BASE_PATH, self.scrape_cache_dir_name)
        os.makedirs(self.scrape_cache_dir, exist_ok=True)
        self.client: Client | None = None

        if self.is_configured():
            self.client = create_client(self.supabase_url, self.supabase_key)

    def is_configured(self) -> bool:
        return bool(self.supabase_url and self.supabase_key)

    def require_configured(self) -> None:
        if self.client is not None:
            return
        raise RuntimeError(
            "Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no backend para usar o cache no Supabase."
        )

    def _build_scrape_file_parts(self, cargo: str, filtros: dict[str, Any]) -> tuple[str, str]:
        cache_key = normalize_career_key(cargo, filtros)
        safe_key = re.sub(r"[^a-zA-Z0-9._-]+", "-", cache_key).strip("-") or "career"
        file_name = f"{safe_key}.json"
        relative_path = f"{self.scrape_cache_dir_name}/{file_name}".replace("\\", "/")
        absolute_path = os.path.join(self.scrape_cache_dir, file_name)
        return absolute_path, relative_path

    def resolve_scrape_file_path(self, scrape_file_path: str | None) -> str | None:
        if not scrape_file_path:
            return None
        if os.path.isabs(scrape_file_path):
            return scrape_file_path
        return os.path.join(BASE_PATH, scrape_file_path.replace("/", os.sep))

    def save_scrape_snapshot(
        self,
        cargo: str,
        filtros: dict[str, Any],
        vagas: list[dict[str, Any]],
    ) -> str:
        absolute_path, relative_path = self._build_scrape_file_parts(cargo, filtros)
        payload = {
            "cargo": cargo,
            "cacheKey": normalize_career_key(cargo, filtros),
            "filtros": normalize_filters(filtros),
            "totalVagas": len(vagas),
            "geradoEm": utc_now_iso(),
            "vagas": vagas,
        }
        with open(absolute_path, "w", encoding="utf-8") as file:
            json.dump(payload, file, ensure_ascii=False, indent=2)
        return relative_path

    def ensure_scrape_snapshot(
        self,
        cargo: str,
        filtros: dict[str, Any],
        vagas: list[dict[str, Any]],
        scrape_file_path: str | None = None,
    ) -> str:
        resolved_path = self.resolve_scrape_file_path(scrape_file_path)
        if resolved_path and os.path.exists(resolved_path):
            return scrape_file_path or ""
        return self.save_scrape_snapshot(cargo, filtros, vagas)

    def load_scrape_snapshot(self, scrape_file_path: str) -> list[dict[str, Any]]:
        resolved_path = self.resolve_scrape_file_path(scrape_file_path)
        if not resolved_path or not os.path.exists(resolved_path):
            return []

        with open(resolved_path, "r", encoding="utf-8") as file:
            payload = json.load(file)

        if isinstance(payload, dict):
            vagas = payload.get("vagas")
            return vagas if isinstance(vagas, list) else []
        return payload if isinstance(payload, list) else []

    def _coerce_record(self, row: dict[str, Any]) -> CareerRecord:
        return CareerRecord(
            cargo=str(row.get("cargo") or ""),
            filtros=coerce_json_value(row.get("filtros_json"), {}),
            vagas=coerce_json_value(row.get("vagas_json"), []),
            analysis=coerce_json_value(row.get("analysis_json"), {}),
            created_at=row.get("created_at"),
            updated_at=row.get("updated_at"),
            scrape_file_path=row.get("scrape_file_path"),
        )

    def get_recent_record(
        self,
        cargo: str,
        filtros: dict[str, Any],
        ttl_hours: int,
    ) -> CareerRecord | None:
        self.require_configured()
        assert self.client is not None

        cache_key = normalize_career_key(cargo, filtros)
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("cache_key", cache_key)
            .limit(1)
            .execute()
        )
        rows = response.data or []
        if not rows:
            return None

        record = self._coerce_record(rows[0])
        if not is_record_fresh(record.updated_at, ttl_hours):
            return None
        return record

    def get_recent(
        self,
        cargo: str,
        filtros: dict[str, Any],
        ttl_hours: int,
    ) -> dict[str, Any] | None:
        record = self.get_recent_record(cargo, filtros, ttl_hours)
        if not record or not is_analysis_cache_valid(record.analysis):
            return None

        analysis = json.loads(json.dumps(record.analysis, ensure_ascii=False))
        analysis.setdefault("metadata", {})
        analysis["metadata"]["cache"] = True
        analysis["metadata"]["cacheAtualizadoEm"] = record.updated_at

        if record.vagas:
            todas = [
                {
                    "titulo": v.get("titulo", ""),
                    "empresa": v.get("empresa", "") or "Confidencial",
                    "localidade": v.get("local", ""),
                    "modalidade": v.get("modalidade", ""),
                    "salario": str(v.get("salario") or v.get("remuneracao") or ""),
                    "tipoContrato": str(v.get("tipoContrato") or v.get("tipo") or ""),
                    "link": v.get("link", ""),
                }
                for v in record.vagas
            ]
            analysis["oportunidadesDestaque"] = todas
            analysis["todasVagas"] = todas

        return analysis

    def save(
        self,
        cargo: str,
        filtros: dict[str, Any],
        vagas: list[dict[str, Any]],
        analysis: dict[str, Any],
        scrape_file_path: str | None = None,
    ) -> None:
        self.require_configured()
        assert self.client is not None

        normalized_filters = normalize_filters(filtros)
        cache_key = normalize_career_key(cargo, normalized_filters)
        persisted_path = self.ensure_scrape_snapshot(
            cargo=cargo,
            filtros=normalized_filters,
            vagas=vagas,
            scrape_file_path=scrape_file_path,
        )

        payload = {
            "cache_key": cache_key,
            "cargo": cargo,
            "filtros_json": normalized_filters,
            "vagas_json": vagas,
            "analysis_json": analysis,
            "scrape_file_path": persisted_path,
            "schema_version": CURRENT_SCHEMA_VERSION,
        }

        (
            self.client.table(self.table_name)
            .upsert(payload, on_conflict="cache_key")
            .execute()
        )
