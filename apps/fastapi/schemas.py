from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID
from decimal import Decimal

class TransferRequest(BaseModel):
    from_account_number: str = Field(..., min_length=12, max_length=12)
    to_account_number: str = Field(..., min_length=12, max_length=12)
    amount: Decimal = Field(..., gt=0, decimal_places=2)

class DepositRequest(BaseModel):
    amount: Decimal = Field(..., gt=0, decimal_places=2)

class WithdrawRequest(BaseModel):
    amount: Decimal = Field(..., gt=0, decimal_places=2)

class TransactionResponse(BaseModel):
    id: UUID
    transaction_type: str
    status: str
    reference_id: str
    description: Optional[str]
    created_at: datetime

class LedgerEntryResponse(BaseModel):
    id: UUID
    account_id: UUID
    amount: Decimal
    entry_type: str
    created_at: datetime

class BalanceResponse(BaseModel):
    account_number: str
    balance: Decimal

class HistoryResponse(BaseModel):
    transactions: list[TransactionResponse]
