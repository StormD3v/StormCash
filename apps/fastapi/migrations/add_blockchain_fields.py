"""
Idempotent migration: adds blockchain settlement columns to the transactions table.

Safe to run multiple times — uses ADD COLUMN IF NOT EXISTS.

Execution:
  Standalone:  python -m migrations.add_blockchain_fields
  On startup:  called automatically by startup.py before uvicorn starts
"""
from database import engine
from sqlalchemy import text
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))


# Every column the FastAPI models expect that Django's initial migration
# does not create.  Using IF NOT EXISTS makes this safe to run on every deploy.
COLUMNS = [
    ("settlement_stage",    "VARCHAR(50)"),
    ("blockchain_tx_hash",  "VARCHAR(66)"),
    ("block_number",        "INTEGER"),
    ("confirmation_count",  "INTEGER DEFAULT 0"),
    ("gas_fee",             "NUMERIC(19, 6)"),
    ("blockchain_amount",   "NUMERIC(19, 6)"),
    ("network_name",        "VARCHAR(50) DEFAULT 'StormChain'"),
    ("settlement_time",     "TIMESTAMP"),
    ("from_account_number", "VARCHAR(12)"),
    ("to_account_number",   "VARCHAR(12)"),
]


def upgrade():
    """Add blockchain settlement columns — idempotent."""
    with engine.connect() as conn:
        for col, col_type in COLUMNS:
            conn.execute(text(
                f"ALTER TABLE transactions ADD COLUMN IF NOT EXISTS {col} {col_type}"
            ))
        conn.commit()
    print("[migration] transactions table is up to date.")


def downgrade():
    """Remove blockchain settlement columns."""
    with engine.connect() as conn:
        for col, _ in COLUMNS:
            conn.execute(text(
                f"ALTER TABLE transactions DROP COLUMN IF EXISTS {col}"
            ))
        conn.commit()
    print("[migration] blockchain columns removed.")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--downgrade", action="store_true")
    args = parser.parse_args()
    downgrade() if args.downgrade else upgrade()
