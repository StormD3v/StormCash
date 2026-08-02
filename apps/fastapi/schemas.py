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
    amount: Optional[Decimal] = None
    settlement_stage: Optional[str] = None
    blockchain_tx_hash: Optional[str] = None
    block_number: Optional[int] = None
    confirmation_count: Optional[int] = None
    gas_fee: Optional[Decimal] = None
    blockchain_amount: Optional[Decimal] = None
    network_name: Optional[str] = None
    settlement_time: Optional[datetime] = None
    direction: Optional[str] = None
    from_account_number: Optional[str] = None
    to_account_number: Optional[str] = None


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


class SettlementDetailsResponse(BaseModel):
    transaction_id: str
    reference_id: str
    blockchain_tx_hash: Optional[str]
    block_number: Optional[int]
    confirmation_count: int
    gas_fee: float
    blockchain_amount: float
    fiat_amount: float
    network_name: str
    settlement_stage: Optional[str]
    settlement_time: Optional[str]
    from_account: Optional[str]
    to_account: Optional[str]
    explorer_url: Optional[str]
