from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Numeric, Text, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base
import uuid
import enum
from datetime import datetime

class BaseUser(Base):
    __tablename__ = 'users'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    password = Column(String(128), nullable=False)
    last_login = Column(DateTime, nullable=True)
    is_superuser = Column(Boolean, default=False)
    username = Column(String(150), unique=True, nullable=False)
    first_name = Column(String(150), nullable=True, default='')
    last_name = Column(String(150), nullable=True, default='')
    email = Column(String(254), unique=True, nullable=False)
    is_staff = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    date_joined = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    accounts = relationship("Account", back_populates="user")

class Account(Base):
    __tablename__ = 'accounts'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    demo_currency_code = Column(String(3), nullable=False)
    account_number = Column(String(12), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    user = relationship("BaseUser", back_populates="accounts")
    ledger_entries = relationship("LedgerEntry", back_populates="account")

class TransactionStatus(str, enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    REVERSED = "REVERSED"

class TransactionType(str, enum.Enum):
    TRANSFER = "TRANSFER"
    DEPOSIT = "DEPOSIT"
    WITHDRAWAL = "WITHDRAWAL"
    FEE = "FEE"

class Transaction(Base):
    __tablename__ = 'transactions'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(SQLEnum(TransactionStatus), default=TransactionStatus.PENDING)
    description = Column(Text, nullable=True)
    transaction_type = Column(SQLEnum(TransactionType), nullable=False)
    reference_id = Column(String(100), unique=True, nullable=False)
    
    ledger_entries = relationship("LedgerEntry", back_populates="transaction")

class EntryType(str, enum.Enum):
    DEBIT = "DEBIT"
    CREDIT = "CREDIT"

class LedgerEntry(Base):
    __tablename__ = 'ledger_entries'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    transaction_id = Column(UUID(as_uuid=True), ForeignKey('transactions.id'), nullable=False)
    account_id = Column(UUID(as_uuid=True), ForeignKey('accounts.id'), nullable=False)
    amount = Column(Numeric(precision=19, scale=2), nullable=False)
    entry_type = Column(SQLEnum(EntryType), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    transaction = relationship("Transaction", back_populates="ledger_entries")
    account = relationship("Account", back_populates="ledger_entries")
