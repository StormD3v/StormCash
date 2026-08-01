"""
Quick script to create a second account for testing transfers.
"""
import sys
import os
import uuid
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy import create_engine, text
from database import DATABASE_URL

def create_second_account():
    """Create a second account for the existing user."""
    engine = create_engine(DATABASE_URL)

    with engine.connect() as conn:
        # Get the user ID
        result = conn.execute(text("SELECT id FROM users WHERE username = 'StormD3v'"))
        user = result.fetchone()

        if not user:
            print("User not found")
            return

        user_id = user[0]

        # Generate account number
        account_number = '987654321098'

        # Check if account already exists
        result = conn.execute(text("SELECT id FROM accounts WHERE account_number = :acc"), {"acc": account_number})
        existing = result.fetchone()

        if existing:
            print(f"Account {account_number} already exists")
            return

        # Create the account with Python-generated UUID
        account_id = str(uuid.uuid4())
        conn.execute(text("""
            INSERT INTO accounts (id, user_id, demo_currency_code, account_number, created_at, is_active)
            VALUES (:account_id, :user_id, '', :account_number, NOW(), true)
        """), {"account_id": account_id, "user_id": user_id, "account_number": account_number})

        conn.commit()
        print(f"Created account {account_number} for user StormD3v")

if __name__ == "__main__":
    create_second_account()
