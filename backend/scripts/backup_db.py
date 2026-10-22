"""
Rotina de backup do banco Worky.
Exporta tabelas reais via service role, compacta em gzip e grava SHA-256.
"""
import gzip
import hashlib
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env")

BACKUP_DIR = BACKEND_DIR / "backups"
RETENTION_DAYS = 30
PAGE_SIZE = 1000
TABLES = (
    "professional_profiles",
    "company_profiles",
    "company_jobs",
    "career_analyses",
    "course_catalog",
)


def ensure_backup_dir() -> Path:
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    if os.name != "nt":
        os.chmod(BACKUP_DIR, 0o700)
    return BACKUP_DIR


def calculate_sha256(filepath: Path) -> str:
    hasher = hashlib.sha256()
    with open(filepath, "rb") as handle:
        while chunk := handle.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


def fetch_table_rows(client, table: str) -> list:
    rows: list = []
    offset = 0
    while True:
        response = client.table(table).select("*").range(offset, offset + PAGE_SIZE - 1).execute()
        page = response.data or []
        rows.extend(page)
        if len(page) < PAGE_SIZE:
            return rows
        offset += PAGE_SIZE


def run_backup(environment: str = "production") -> dict:
    supabase_url = os.getenv("SUPABASE_URL", "").strip()
    supabase_key = (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
        or os.getenv("SUPABASE_KEY", "").strip()
    )
    if not supabase_url or not supabase_key:
        raise RuntimeError("Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para o backup.")

    ensure_backup_dir()
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    backup_filename = f"worky_db_backup_{environment}_{timestamp}.json.gz"
    backup_path = BACKUP_DIR / backup_filename
    manifest_path = BACKUP_DIR / f"worky_db_backup_{environment}_{timestamp}.manifest.json"
    client = create_client(supabase_url, supabase_key)

    dumped: dict[str, list] = {}
    for table in TABLES:
        dumped[table] = fetch_table_rows(client, table)

    payload = {
        "metadata": {
            "plataforma": "Worky",
            "tipo": "full_backup",
            "ambiente": environment,
            "gerado_em": datetime.now(timezone.utc).isoformat(),
            "algoritmo_compressao": "gzip",
            "integridade": "SHA-256",
        },
        "tabelas": dumped,
        "contagens": {table: len(rows) for table, rows in dumped.items()},
    }

    with gzip.open(backup_path, "wb") as gz_file:
        gz_file.write(json.dumps(payload, ensure_ascii=False, default=str).encode("utf-8"))

    checksum = calculate_sha256(backup_path)
    manifest = {
        "arquivo": backup_filename,
        "tamanho_kb": round(backup_path.stat().st_size / 1024, 2),
        "sha256": checksum,
        "data_utc": datetime.now(timezone.utc).isoformat(),
        "retencao_dias": RETENTION_DAYS,
        "contagens": payload["contagens"],
    }
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    prune_old_backups(RETENTION_DAYS)
    print(f"[+] Backup concluido: {backup_path}")
    print(f"[+] SHA-256: {checksum}")
    return manifest


def prune_old_backups(days: int = 30) -> None:
    cutoff = time.time() - (days * 86400)
    purged = 0
    for item in BACKUP_DIR.glob("worky_db_backup_*"):
        if item.stat().st_mtime < cutoff:
            item.unlink()
            purged += 1
    if purged:
        print(f"[*] Retencao: {purged} arquivo(s) antigos removidos.")


if __name__ == "__main__":
    env = sys.argv[1] if len(sys.argv) > 1 else "production"
    run_backup(env)
