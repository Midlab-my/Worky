import gzip
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import backup_db


class BackupDbTests(unittest.TestCase):
    def test_backup_writes_table_rows_not_placeholder_metadata(self):
        rows = [{"user_id": "user-a", "profile_json": {"form": {"nome": "Ana"}}}]

        class Query:
            def select(self, *_args, **_kwargs):
                return self

            def range(self, *_args, **_kwargs):
                return self

            def execute(self):
                return SimpleNamespace(data=rows)

        client = SimpleNamespace(table=lambda _name: Query())
        with tempfile.TemporaryDirectory() as tmp:
            with patch.dict(os.environ, {
                "SUPABASE_URL": "https://example.supabase.co",
                "SUPABASE_SERVICE_ROLE_KEY": "service-role",
            }), patch.object(backup_db, "create_client", return_value=client), \
                 patch.object(backup_db, "BACKUP_DIR", Path(tmp)):
                manifest = backup_db.run_backup("test")
            archive = Path(tmp) / manifest["arquivo"]
            payload = json.loads(gzip.open(archive, "rt", encoding="utf-8").read())
            self.assertEqual(payload["tabelas"]["professional_profiles"], rows)
            self.assertGreater(payload["contagens"]["professional_profiles"], 0)
            self.assertEqual(manifest["sha256"], backup_db.calculate_sha256(archive))

    def test_backup_fails_closed_without_credentials(self):
        with patch.dict(os.environ, {
            "SUPABASE_URL": "",
            "SUPABASE_SERVICE_ROLE_KEY": "",
            "SUPABASE_KEY": "",
        }):
            with self.assertRaises(RuntimeError):
                backup_db.run_backup("test")


if __name__ == "__main__":
    unittest.main()
