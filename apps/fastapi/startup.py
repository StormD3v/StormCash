"""
Railway startup script.

Runs the idempotent schema migration before starting uvicorn so the
production database is always in sync with the SQLAlchemy models.

railway.json startCommand: python startup.py
"""
import os
import sys
import subprocess

print("[startup] Running schema migration...")
from migrations.add_blockchain_fields import upgrade
upgrade()

print("[startup] Starting uvicorn...")
port = os.getenv("PORT", "8001")
subprocess.run(
    [sys.executable, "-m", "uvicorn", "main:app",
     "--host", "0.0.0.0", "--port", port],
    check=True,
)
