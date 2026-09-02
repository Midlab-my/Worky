import sqlite3
import os
import random
from datetime import datetime, timedelta, timezone

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "scraper_logs.db")

def init_db():
    """Initializes the SQLite database and seeds historical logs if empty."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS scraper_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fonte TEXT NOT NULL,
            status TEXT NOT NULL, -- 'success' | 'error'
            vagas_coletadas INTEGER NOT NULL DEFAULT 0,
            erro_tipo TEXT, -- 'timeout' | 'captcha' | 'bloqueio_http' | 'parsing' | 'campos_ausentes' | 'outros'
            erro_mensagem TEXT,
            duracao_segundos REAL,
            created_at TEXT NOT NULL
        )
    """)
    conn.commit()
    
    # Check if empty to seed historical records
    cursor.execute("SELECT COUNT(*) FROM scraper_logs")
    count = cursor.fetchone()[0]
    
    if count == 0:
        print("🌱 Seeding historical scraper logs in SQLite...")
        sources = ["LinkedIn", "Vagas.com.br", "InfoJobs", "Remotive"]
        error_types = ["timeout", "captcha", "bloqueio_http", "parsing", "campos_ausentes"]
        error_messages = {
            "timeout": "Connection timed out after 20 seconds",
            "captcha": "Cloudflare CAPTCHA challenge presented on page load",
            "bloqueio_http": "HTTP status 429 Too Many Requests (rate limited)",
            "parsing": "Failed to parse selector 'li.vaga a.link-detalhes-vaga' due to DOM structure changes",
            "campos_ausentes": "Scraped vacancy is missing required fields (link or title)"
        }
        
        now = datetime.now(timezone.utc)
        
        # Generate logs for the last 7 days
        for day_offset in range(7, -1, -1):
            date_base = now - timedelta(days=day_offset)
            
            # Each day has 4 to 8 collection runs
            num_runs = random.randint(4, 8)
            for _ in range(num_runs):
                fonte = random.choice(sources)
                # Random time during that day
                run_time = date_base.replace(
                    hour=random.randint(0, 23),
                    minute=random.randint(0, 59),
                    second=random.randint(0, 59)
                )
                
                # 85% success rate overall
                is_success = random.random() > 0.15
                
                if is_success:
                    status = "success"
                    vagas_coletadas = random.randint(5, 15)
                    erro_tipo = None
                    erro_mensagem = None
                    duracao_segundos = round(random.uniform(1.5, 4.8), 2)
                else:
                    status = "error"
                    vagas_coletadas = 0
                    erro_tipo = random.choice(error_types)
                    erro_mensagem = error_messages[erro_tipo]
                    # Errors sometimes happen fast (like blockages) or slow (timeouts)
                    if erro_tipo == "timeout":
                        duracao_segundos = 20.0
                    else:
                        duracao_segundos = round(random.uniform(0.3, 1.8), 2)
                
                cursor.execute("""
                    INSERT INTO scraper_logs (fonte, status, vagas_coletadas, erro_tipo, erro_mensagem, duracao_segundos, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (fonte, status, vagas_coletadas, erro_tipo, erro_mensagem, duracao_segundos, run_time.isoformat()))
                
        conn.commit()
        print("✅ Seeding completed!")
        
    conn.close()

def log_scraper_run(fonte: str, status: str, vagas_coletadas: int = 0, erro_tipo: str = None, erro_mensagem: str = None, duracao_segundos: float = 0.0):
    """Inserts a new scraper run log entry in the SQLite database."""
    init_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    now_utc = datetime.now(timezone.utc).isoformat()
    cursor.execute("""
        INSERT INTO scraper_logs (fonte, status, vagas_coletadas, erro_tipo, erro_mensagem, duracao_segundos, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (fonte, status, vagas_coletadas, erro_tipo, erro_mensagem, round(duracao_segundos, 2), now_utc))
    conn.commit()
    conn.close()

def get_scraper_logs_summary():
    """Retrieves scraper log stats and structured summaries for the Admin Dashboard."""
    init_db()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT fonte, COUNT(*) as total_errors
        FROM scraper_logs
        WHERE status = 'error'
        GROUP BY fonte
    """)
    errors_by_source = {row["fonte"]: row["total_errors"] for row in cursor.fetchall()}
    
    cursor.execute("""
        SELECT erro_tipo, COUNT(*) as count
        FROM scraper_logs
        WHERE status = 'error'
        GROUP BY erro_tipo
    """)
    error_types_count = {row["erro_tipo"]: row["count"] for row in cursor.fetchall()}
    
    cursor.execute("""
        SELECT fonte, 
               COUNT(*) as total_runs,
               SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_runs,
               SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error_runs,
               SUM(vagas_coletadas) as total_vagas,
               AVG(duracao_segundos) as avg_duration
        FROM scraper_logs
        GROUP BY fonte
    """)
    source_stats = []
    for row in cursor.fetchall():
        fonte = row["fonte"]
        
        # Get the very last run for this source
        cursor.execute("""
            SELECT status, created_at, vagas_coletadas, erro_tipo, erro_mensagem
            FROM scraper_logs
            WHERE fonte = ?
            ORDER BY created_at DESC
            LIMIT 1
        """, (fonte,))
        last_run = cursor.fetchone()
        
        status_atual = "Ativo"
        if last_run:
            if last_run["status"] == "error":
                status_atual = "Erro"
            elif last_run["status"] == "success" and last_run["vagas_coletadas"] == 0:
                status_atual = "Pausado"
                
        source_stats.append({
            "fonte": fonte,
            "status": status_atual,
            "totalRuns": row["total_runs"],
            "successRuns": row["success_runs"],
            "errorRuns": row["error_runs"],
            "totalVagas": row["total_vagas"],
            "avgDuration": round(row["avg_duration"] or 0, 2),
            "ultimaExecucao": last_run["created_at"] if last_run else None,
            "ultimoStatus": last_run["status"] if last_run else None,
            "ultimoErro": last_run["erro_tipo"] if last_run and last_run["status"] == "error" else None,
            "ultimoErroMsg": last_run["erro_mensagem"] if last_run and last_run["status"] == "error" else None,
        })
        
    cursor.execute("""
        SELECT id, fonte, status, vagas_coletadas, erro_tipo, erro_mensagem, duracao_segundos, created_at
        FROM scraper_logs
        ORDER BY created_at DESC
        LIMIT 30
    """)
    recent_logs = []
    for row in cursor.fetchall():
        recent_logs.append({
            "id": row["id"],
            "fonte": row["fonte"],
            "status": row["status"],
            "vagasColetadas": row["vagas_coletadas"],
            "erroTipo": row["erro_tipo"],
            "erroMensagem": row["erro_mensagem"],
            "duracaoSegundos": row["duracao_segundos"],
            "createdAt": row["created_at"]
        })
        
    conn.close()
    
    return {
        "errorsBySource": errors_by_source,
        "errorTypesCount": error_types_count,
        "sourceStats": source_stats,
        "recentLogs": recent_logs
    }

# Run database setup initially
init_db()
