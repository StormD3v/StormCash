"""
Migration script to add blockchain settlement fields to the transactions table.

Run this script to update the database schema:
python -m migrations.add_blockchain_fields
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy import text
from database import engine

def upgrade():
    """Add blockchain settlement columns to transactions table."""
    with engine.connect() as conn:
        # Add new columns for blockchain settlement (PostgreSQL syntax)
        try:
            conn.execute(text("ALTER TABLE transactions ADD COLUMN settlement_stage VARCHAR(50)"))
        except Exception:
            pass  # Column might already exist

        try:
            conn.execute(text("ALTER TABLE transactions ADD COLUMN blockchain_tx_hash VARCHAR(66)"))
        except Exception:
            pass

        try:
            conn.execute(text("ALTER TABLE transactions ADD COLUMN block_number INTEGER"))
        except Exception:
            pass

        try:
            conn.execute(text("ALTER TABLE transactions ADD COLUMN confirmation_count INTEGER DEFAULT 0"))
        except Exception:
            pass

        try:
            conn.execute(text("ALTER TABLE transactions ADD COLUMN gas_fee NUMERIC(19, 6)"))
        except Exception:
            pass

        try:
            conn.execute(text("ALTER TABLE transactions ADD COLUMN blockchain_amount NUMERIC(19, 6)"))
        except Exception:
            pass

        try:
            conn.execute(text("ALTER TABLE transactions ADD COLUMN network_name VARCHAR(50) DEFAULT 'StormChain'"))
        except Exception:
            pass

        try:
            conn.execute(text("ALTER TABLE transactions ADD COLUMN settlement_time TIMESTAMP"))
        except Exception:
            pass

        try:
            conn.execute(text("ALTER TABLE transactions ADD COLUMN from_account_number VARCHAR(12)"))
        except Exception:
            pass

        try:
            conn.execute(text("ALTER TABLE transactions ADD COLUMN to_account_number VARCHAR(12)"))
        except Exception:
            pass

        conn.commit()
        print("Migration completed successfully: Added blockchain settlement fields")

def downgrade():
    """Remove blockchain settlement columns from transactions table."""
    with engine.connect() as conn:
        # Drop columns one by one (PostgreSQL syntax)
        columns = [
            "settlement_stage",
            "blockchain_tx_hash",
            "block_number",
            "confirmation_count",
            "gas_fee",
            "blockchain_amount",
            "network_name",
            "settlement_time",
            "from_account_number",
            "to_account_number"
        ]

        for column in columns:
            try:
                conn.execute(text(f"ALTER TABLE transactions DROP COLUMN {column}"))
            except Exception:
                pass  # Column might not exist

        conn.commit()
        print("Rollback completed: Removed blockchain settlement fields")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--downgrade", action="store_true", help="Rollback the migration")
    args = parser.parse_args()

    if args.downgrade:
        downgrade()
    else:
        upgrade()
