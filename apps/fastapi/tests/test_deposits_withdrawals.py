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
def test_user_b(db_session):
    """Create a second test user for ownership tests"""
    import uuid
    unique_id = str(uuid.uuid4())[:8]
    user = BaseUser(
        username=f"testuser_b_{unique_id}",
        email=f"test_b_{unique_id}@example.com",
        password="hashed_password_here"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture(scope="function")
def test_account(db_session, test_user):
    """Create a test account with known balance"""
    import uuid
    unique_id = str(uuid.uuid4())[:12]
    
    account = Account(
        user_id=test_user.id,
        demo_currency_code="USD",
        account_number=f"1{unique_id[:11]}"
    )
    db_session.add(account)
    db_session.commit()
    db_session.refresh(account)
    
    # Create initial deposit transaction
    tx = Transaction(
        transaction_type=TransactionType.DEPOSIT,
        status=TransactionStatus.COMPLETED,
        reference_id=f"INITIAL_DEPOSIT_{unique_id}",
        description="Initial deposit"
    )
    db_session.add(tx)
    db_session.commit()
    db_session.refresh(tx)
    
    # Credit account with 1000.00
    credit_entry = LedgerEntry(
        transaction_id=tx.id,
        account_id=account.id,
        amount=1000.00,
        entry_type=EntryType.CREDIT
    )
    db_session.add(credit_entry)
    db_session.commit()
    
    return account

@pytest.fixture(scope="function")
def test_account_b(db_session, test_user_b):
    """Create a test account for user B"""
    import uuid
    unique_id = str(uuid.uuid4())[:12]
    
    account = Account(
        user_id=test_user_b.id,
        demo_currency_code="USD",
        account_number=f"2{unique_id[:11]}"
    )
    db_session.add(account)
    db_session.commit()
    db_session.refresh(account)
    
    return account

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
def auth_headers_b(test_user_b):
    """Create JWT token for user B"""
    token_data = {
        "user_id": str(test_user_b.id),
        "username": test_user_b.username
    }
    token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="function")
def client():
    """Create test client"""
    return TestClient(app)

class TestDepositWithdrawEndpoints:
    
    def test_deposit_success(self, client, test_account, auth_headers, db_session):
        """Test that deposit increases balance correctly and creates ledger entry"""
        deposit_data = {"amount": 500.00}
        
        response = client.post(f"/api/accounts/{test_account.account_number}/deposit", 
                             json=deposit_data, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["transaction_type"] == "DEPOSIT"
        assert data["status"] == "COMPLETED"
        
        # Check balance (1000 + 500 = 1500)
        entries = db_session.execute(
            select(LedgerEntry).where(LedgerEntry.account_id == test_account.id)
        ).scalars().all()
        balance = sum(
            entry.amount if entry.entry_type == EntryType.CREDIT else -entry.amount
            for entry in entries
        )
        assert balance == 1500.00
        
        # Verify ledger entry created
        assert len(entries) == 2  # Initial deposit + new deposit
    
    def test_deposit_rejects_negative_amount(self, client, test_account, auth_headers):
        """Test that deposit rejects negative amounts"""
        deposit_data = {"amount": -100.00}
        
        response = client.post(f"/api/accounts/{test_account.account_number}/deposit", 
                             json=deposit_data, headers=auth_headers)
        
        assert response.status_code == 422  # Pydantic validation error
    
    def test_deposit_rejects_zero_amount(self, client, test_account, auth_headers):
        """Test that deposit rejects zero amounts"""
        deposit_data = {"amount": 0.00}
        
        response = client.post(f"/api/accounts/{test_account.account_number}/deposit", 
                             json=deposit_data, headers=auth_headers)
        
        assert response.status_code == 422  # Pydantic validation error
    
    def test_withdraw_success(self, client, test_account, auth_headers, db_session):
        """Test that withdrawal decreases balance correctly and creates ledger entry"""
        withdraw_data = {"amount": 300.00}
        
        response = client.post(f"/api/accounts/{test_account.account_number}/withdraw", 
                              json=withdraw_data, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["transaction_type"] == "WITHDRAWAL"
        assert data["status"] == "COMPLETED"
        
        # Check balance (1000 - 300 = 700)
        entries = db_session.execute(
            select(LedgerEntry).where(LedgerEntry.account_id == test_account.id)
        ).scalars().all()
        balance = sum(
            entry.amount if entry.entry_type == EntryType.CREDIT else -entry.amount
            for entry in entries
        )
        assert balance == 700.00
        
        # Verify ledger entry created
        assert len(entries) == 2  # Initial deposit + new withdrawal
    
    def test_withdraw_insufficient_funds(self, client, test_account, auth_headers, db_session):
        """Test that withdrawal with insufficient funds returns 400 and no balance change"""
        # Get initial balance
        entries = db_session.execute(
            select(LedgerEntry).where(LedgerEntry.account_id == test_account.id)
        ).scalars().all()
        initial_balance = sum(
            entry.amount if entry.entry_type == EntryType.CREDIT else -entry.amount
            for entry in entries
        )
        
        withdraw_data = {"amount": 1500.00}  # More than balance
        
        response = client.post(f"/api/accounts/{test_account.account_number}/withdraw", 
                              json=withdraw_data, headers=auth_headers)
        
        assert response.status_code == 400
        assert "Insufficient funds" in response.json()["detail"]
        
        # Verify balance didn't change
        entries_after = db_session.execute(
            select(LedgerEntry).where(LedgerEntry.account_id == test_account.id)
        ).scalars().all()
        final_balance = sum(
            entry.amount if entry.entry_type == EntryType.CREDIT else -entry.amount
            for entry in entries_after
        )
        assert final_balance == initial_balance
    
    def test_withdraw_rejects_negative_amount(self, client, test_account, auth_headers):
        """Test that withdrawal rejects negative amounts"""
        withdraw_data = {"amount": -100.00}
        
        response = client.post(f"/api/accounts/{test_account.account_number}/withdraw", 
                              json=withdraw_data, headers=auth_headers)
        
        assert response.status_code == 422  # Pydantic validation error
    
    def test_deposit_withdraw_rejects_wrong_user_account(self, client, test_account_b, auth_headers):
        """Test that user A cannot deposit/withdraw into user B's account"""
        deposit_data = {"amount": 100.00}
        
        # Try to deposit into user B's account with user A's token
        response = client.post(f"/api/accounts/{test_account_b.account_number}/deposit", 
                             json=deposit_data, headers=auth_headers)
        
        assert response.status_code == 403
        assert "does not belong to authenticated user" in response.json()["detail"]
        
        # Try to withdraw from user B's account with user A's token
        withdraw_data = {"amount": 100.00}
        response = client.post(f"/api/accounts/{test_account_b.account_number}/withdraw", 
                              json=withdraw_data, headers=auth_headers)
        
        assert response.status_code == 403
        assert "does not belong to authenticated user" in response.json()["detail"]
    
    def test_concurrent_withdrawals_race_condition(self, client, test_account, auth_headers, db_session):
        """
        Test concurrent withdrawals that together exceed balance.
        Run the race condition test 3 times to catch flakiness.
        """
        for run in range(3):
            # Reset account balance to 1000.00
            db_session.execute(
                select(LedgerEntry).where(LedgerEntry.account_id == test_account.id)
            ).scalars().all()
            for entry in db_session.query(LedgerEntry).filter(LedgerEntry.account_id == test_account.id).all():
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
                account_id=test_account.id,
                amount=1000.00,
                entry_type=EntryType.CREDIT
            )
            db_session.add(credit_entry)
            db_session.commit()
            
            # Results storage
            results = []
            errors = []
            
            def make_withdrawal(withdrawal_id):
                try:
                    withdraw_data = {"amount": 600.00}  # Two withdrawals of 600 = 1200 > 1000
                    response = client.post(f"/api/accounts/{test_account.account_number}/withdraw", 
                                         json=withdraw_data, headers=auth_headers)
                    results.append((withdrawal_id, response.status_code, response.json() if response.status_code != 200 else None))
                except Exception as e:
                    errors.append((withdrawal_id, str(e)))
            
            # Create two threads for concurrent withdrawals
            thread1 = threading.Thread(target=make_withdrawal, args=(1,))
            thread2 = threading.Thread(target=make_withdrawal, args=(2,))
            
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
                select(LedgerEntry).where(LedgerEntry.account_id == test_account.id)
            ).scalars().all()
            final_balance = sum(
                entry.amount if entry.entry_type == EntryType.CREDIT else -entry.amount
                for entry in entries
            )
            assert final_balance == 400.00, f"Run {run}: Expected final balance 400.00, got {final_balance}"
