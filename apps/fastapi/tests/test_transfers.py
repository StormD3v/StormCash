import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from database import Base, get_db
from models import Account, Transaction, LedgerEntry, TransactionStatus, TransactionType, EntryType, BaseUser
from main import app
from jose import jwt
import threading
import os
import secrets

# Test database URL
TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", "postgresql://stormcash:stormcash123@localhost:5433/stormcash_test")

# Create test engine
test_engine = create_engine(TEST_DATABASE_URL)
from sqlalchemy import text
with test_engine.connect() as conn:
    for col, col_type in [
        ("settlement_stage", "VARCHAR(50)"),
        ("blockchain_tx_hash", "VARCHAR(66)"),
        ("block_number", "INTEGER"),
        ("confirmation_count", "INTEGER DEFAULT 0"),
        ("gas_fee", "NUMERIC(19, 6)"),
        ("blockchain_amount", "NUMERIC(19, 6)"),
        ("network_name", "VARCHAR(50) DEFAULT 'StormChain'"),
        ("settlement_time", "TIMESTAMP"),
        ("from_account_number", "VARCHAR(12)"),
        ("to_account_number", "VARCHAR(12)")
    ]:
        try:
            conn.execute(text(f"ALTER TABLE transactions ADD COLUMN IF NOT EXISTS {col} {col_type}"))
        except Exception:
            pass
    conn.commit()
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

# Override the database dependency
def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# JWT settings for testing
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test"""
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture(scope="function", autouse=True)
def cleanup_database(db_session):
    """Clean up database after each test"""
    yield
    # Delete all test data
    db_session.query(LedgerEntry).delete()
    db_session.query(Transaction).delete()
    db_session.query(Account).delete()
    db_session.query(BaseUser).delete()
    db_session.commit()

@pytest.fixture(scope="function")
def test_user(db_session):
    """Create a test user with unique username"""
    import uuid
    unique_id = str(uuid.uuid4())[:8]
    user = BaseUser(
        username=f"testuser_{unique_id}",
        email=f"test_{unique_id}@example.com",
        password="hashed_password_here"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture(scope="function")
def test_accounts(db_session, test_user):
    """Create two test accounts with known balances"""
    import uuid
    unique_id = str(uuid.uuid4())[:12]
    
    # Create accounts with unique account numbers
    acc1 = Account(
        user_id=test_user.id,
        demo_currency_code="USD",
        account_number=f"1{unique_id[:11]}"
    )
    acc2 = Account(
        user_id=test_user.id,
        demo_currency_code="USD",
        account_number=f"2{unique_id[:11]}"
    )
    db_session.add(acc1)
    db_session.add(acc2)
    db_session.commit()
    db_session.refresh(acc1)
    db_session.refresh(acc2)
    
    # Create initial deposit transaction for acc1
    tx = Transaction(
        transaction_type=TransactionType.DEPOSIT,
        status=TransactionStatus.COMPLETED,
        reference_id=f"INITIAL_DEPOSIT_{unique_id}",
        description="Initial deposit"
    )
    db_session.add(tx)
    db_session.commit()
    db_session.refresh(tx)
    
    # Credit acc1 with 1000.00
    credit_entry = LedgerEntry(
        transaction_id=tx.id,
        account_id=acc1.id,
        amount=1000.00,
        entry_type=EntryType.CREDIT
    )
    db_session.add(credit_entry)
    db_session.commit()
    
    return acc1, acc2

@pytest.fixture(scope="function")
def auth_headers(test_user):
    """Create JWT token for authentication"""
    token_data = {
        "user_id": str(test_user.id),
        "username": test_user.username
    }
    token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="function")
def client():
    """Create test client"""
    return TestClient(app)

class TestTransferEndpoints:
    
    def test_balance_endpoint_returns_correct_balance(self, client, test_accounts, auth_headers):
        """Test that balance endpoint returns correct balance"""
        acc1, _ = test_accounts
        response = client.get(f"/api/balance/{acc1.account_number}", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["account_number"] == acc1.account_number
        assert float(data["balance"]) == 1000.00
    
    def test_history_endpoint_returns_transactions(self, client, test_accounts, auth_headers):
        """Test that history endpoint returns transactions"""
        acc1, _ = test_accounts
        response = client.get(f"/api/history/{acc1.account_number}", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "transactions" in data
        assert len(data["transactions"]) == 1  # Initial deposit
    
    def test_transfer_success(self, client, test_accounts, auth_headers, db_session):
        """Test that successful transfer creates correct ledger entries"""
        acc1, acc2 = test_accounts
        transfer_data = {
            "from_account_number": acc1.account_number,
            "to_account_number": acc2.account_number,
            "amount": 500.00
        }
        
        response = client.post("/api/transfer", json=transfer_data, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["transaction_type"] == "TRANSFER"
        assert data["status"] == "PENDING"
        
        # Check balances
        acc1_entries = db_session.execute(
            select(LedgerEntry).where(LedgerEntry.account_id == acc1.id)
        ).scalars().all()
        acc1_balance = sum(
            entry.amount if entry.entry_type == EntryType.CREDIT else -entry.amount
            for entry in acc1_entries
        )
        assert acc1_balance == 500.00  # 1000 - 500
        
        acc2_entries_before = db_session.execute(
            select(LedgerEntry).where(LedgerEntry.account_id == acc2.id)
        ).scalars().all()
        acc2_balance_before = sum(
            entry.amount if entry.entry_type == EntryType.CREDIT else -entry.amount
            for entry in acc2_entries_before
        )
        assert acc2_balance_before == 0.00
        
        # Fast forward time to simulate settlement delay completion
        from datetime import datetime, timedelta
        from uuid import UUID
        from models import Transaction
        
        tx_id = data["id"]
        db_tx = db_session.query(Transaction).filter(Transaction.id == UUID(tx_id)).first()
        db_tx.created_at = datetime.utcnow() - timedelta(seconds=10)
        db_session.commit()
        
        # Process settlement
        process_response = client.post(f"/api/settlement/process/{tx_id}", headers=auth_headers)
        assert process_response.status_code == 200
        process_data = process_response.json()
        assert process_data["status"] == "COMPLETED"
        assert process_data["settlement_stage"] == "DEPOSITED"
        
        # Check destination balance after gas fees (500 - 0.50 = 499.50)
        db_session.expire_all()
        acc2_entries_after = db_session.execute(
            select(LedgerEntry).where(LedgerEntry.account_id == acc2.id)
        ).scalars().all()
        acc2_balance_after = sum(
            entry.amount if entry.entry_type == EntryType.CREDIT else -entry.amount
            for entry in acc2_entries_after
        )
        assert float(acc2_balance_after) == 499.50
    
    def test_transfer_insufficient_funds(self, client, test_accounts, auth_headers):
        """Test that transfer with insufficient funds returns 400"""
        acc1, acc2 = test_accounts
        transfer_data = {
            "from_account_number": acc1.account_number,
            "to_account_number": acc2.account_number,
            "amount": 1500.00  # More than balance
        }
        
        response = client.post("/api/transfer", json=transfer_data, headers=auth_headers)
        
        assert response.status_code == 400
        assert "Insufficient funds" in response.json()["detail"]
    
    def test_transfer_invalid_account(self, client, test_accounts, auth_headers):
        """Test that transfer to invalid account returns 404"""
        acc1, _ = test_accounts
        transfer_data = {
            "from_account_number": acc1.account_number,
            "to_account_number": "999999999999",
            "amount": 100.00
        }
        
        response = client.post("/api/transfer", json=transfer_data, headers=auth_headers)
        
        assert response.status_code == 404
    
    def test_transfer_rejects_missing_or_invalid_jwt(self, client, test_accounts):
        """Test that transfer rejects requests without valid JWT"""
        acc1, acc2 = test_accounts
        transfer_data = {
            "from_account_number": acc1.account_number,
            "to_account_number": acc2.account_number,
            "amount": 100.00
        }
        
        # No JWT
        response = client.post("/api/transfer", json=transfer_data)
        assert response.status_code == 401
        
        # Invalid JWT
        response = client.post("/api/transfer", json=transfer_data, headers={"Authorization": "Bearer invalid.token"})
        assert response.status_code == 401
    
    def test_concurrent_transfers_race_condition(self, client, test_accounts, auth_headers, db_session):
        """
        Test concurrent transfers that together exceed balance.
        Run the race condition test 10 times to catch flakiness.
        """
        acc1, acc2 = test_accounts
        
        for run in range(10):
            # Reset account balance to 1000.00
            db_session.execute(
                select(LedgerEntry).where(LedgerEntry.account_id == acc1.id)
            ).scalars().all()
            for entry in db_session.query(LedgerEntry).filter(LedgerEntry.account_id == acc1.id).all():
                db_session.delete(entry)
            db_session.commit()
            
            # Recreate initial deposit
            tx = Transaction(
                transaction_type=TransactionType.DEPOSIT,
                status=TransactionStatus.COMPLETED,
                reference_id=f"INITIAL_DEPOSIT_{run}",
                description="Initial deposit"
            )
            db_session.add(tx)
            db_session.commit()
            db_session.refresh(tx)
            
            credit_entry = LedgerEntry(
                transaction_id=tx.id,
                account_id=acc1.id,
                amount=1000.00,
                entry_type=EntryType.CREDIT
            )
            db_session.add(credit_entry)
            db_session.commit()
            
            # Results storage
            results = []
            errors = []
            
            def make_transfer(transfer_id):
                try:
                    transfer_data = {
                        "from_account_number": acc1.account_number,
                        "to_account_number": acc2.account_number,
                        "amount": 600.00  # Two transfers of 600 = 1200 > 1000
                    }
                    response = client.post("/api/transfer", json=transfer_data, headers=auth_headers)
                    results.append((transfer_id, response.status_code, response.json() if response.status_code != 200 else None))
                except Exception as e:
                    errors.append((transfer_id, str(e)))
            
            # Create two threads for concurrent transfers
            thread1 = threading.Thread(target=make_transfer, args=(1,))
            thread2 = threading.Thread(target=make_transfer, args=(2,))
            
            # Start both threads simultaneously
            thread1.start()
            thread2.start()
            
            # Wait for both to complete
            thread1.join()
            thread2.join()
            
            # Verify results
            assert len(errors) == 0, f"Run {run}: Errors occurred: {errors}"
            assert len(results) == 2, f"Run {run}: Expected 2 results, got {len(results)}"
            
            # Count successes and failures
            successes = sum(1 for _, status, _ in results if status == 200)
            failures = sum(1 for _, status, _ in results if status == 400)
            
            # Exactly one should succeed, one should fail
            assert successes == 1, f"Run {run}: Expected 1 success, got {successes}"
            assert failures == 1, f"Run {run}: Expected 1 failure, got {failures}"
            
            # Verify final balance is correct (1000 - 600 = 400)
            entries = db_session.execute(
                select(LedgerEntry).where(LedgerEntry.account_id == acc1.id)
            ).scalars().all()
            final_balance = sum(
                entry.amount if entry.entry_type == EntryType.CREDIT else -entry.amount
                for entry in entries
            )
            assert final_balance == 400.00, f"Run {run}: Expected final balance 400.00, got {final_balance}"
