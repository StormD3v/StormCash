from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from database import get_db
from models import Account, Transaction, LedgerEntry, TransactionStatus, TransactionType, EntryType, BaseUser
from schemas import TransferRequest, DepositRequest, WithdrawRequest, BalanceResponse, HistoryResponse, TransactionResponse, LedgerEntryResponse
from auth import get_current_user
from decimal import Decimal
import secrets
from datetime import datetime
import uuid

router = APIRouter()

@router.post("/transfer", response_model=TransactionResponse)
async def transfer(
    request: TransferRequest,
    current_user: BaseUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Generate unique reference ID
    reference_id = secrets.token_urlsafe(16)
    
    try:
        # Lock both accounts with SELECT FOR UPDATE
        from_account = db.execute(
            select(Account).where(Account.account_number == request.from_account_number).with_for_update()
        ).scalar_one_or_none()
        
        to_account = db.execute(
            select(Account).where(Account.account_number == request.to_account_number).with_for_update()
        ).scalar_one_or_none()
        
        if not from_account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Source account not found"
            )
        
        if not to_account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Destination account not found"
            )
        
        # Verify accounts belong to authenticated user
        if from_account.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Source account does not belong to authenticated user"
            )
        
        if to_account.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Destination account does not belong to authenticated user"
            )
        
        # Calculate current balance from ledger entries
        from_balance = db.execute(
            select(LedgerEntry).where(LedgerEntry.account_id == from_account.id)
        ).scalars().all()
        
        balance = Decimal('0.00')
        for entry in from_balance:
            if entry.entry_type == EntryType.CREDIT:
                balance += entry.amount
            else:
                balance -= entry.amount
        
        # Insufficient funds check
        if balance < request.amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insufficient funds"
            )
        
        # Create transaction
        transaction = Transaction(
            transaction_type=TransactionType.TRANSFER,
            status=TransactionStatus.COMPLETED,
            reference_id=reference_id,
            description=f"Transfer from {request.from_account_number} to {request.to_account_number}"
        )
        db.add(transaction)
        db.flush()
        
        # Create debit entry for source account
        debit_entry = LedgerEntry(
            transaction_id=transaction.id,
            account_id=from_account.id,
            amount=request.amount,
            entry_type=EntryType.DEBIT
        )
        db.add(debit_entry)
        
        # Create credit entry for destination account
        credit_entry = LedgerEntry(
            transaction_id=transaction.id,
            account_id=to_account.id,
            amount=request.amount,
            entry_type=EntryType.CREDIT
        )
        db.add(credit_entry)
        
        db.commit()
        db.refresh(transaction)
        
        return TransactionResponse(
            id=transaction.id,
            transaction_type=transaction.transaction_type.value,
            status=transaction.status.value,
            reference_id=transaction.reference_id,
            description=transaction.description,
            created_at=transaction.created_at
        )
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Transfer failed: {str(e)}"
        )

@router.get("/balance/{account_number}", response_model=BalanceResponse)
async def get_balance(
    account_number: str,
    current_user: BaseUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    account = db.execute(
        select(Account).where(Account.account_number == account_number)
    ).scalar_one_or_none()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )
    
    # Verify account belongs to authenticated user
    if account.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account does not belong to authenticated user"
        )
    
    # Calculate balance from ledger entries
    entries = db.execute(
        select(LedgerEntry).where(LedgerEntry.account_id == account.id)
    ).scalars().all()
    
    balance = Decimal('0.00')
    for entry in entries:
        if entry.entry_type == EntryType.CREDIT:
            balance += entry.amount
        else:
            balance -= entry.amount
    
    return BalanceResponse(
        account_number=account.account_number,
        balance=balance
    )

@router.get("/history/{account_number}", response_model=HistoryResponse)
async def get_history(
    account_number: str,
    current_user: BaseUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    account = db.execute(
        select(Account).where(Account.account_number == account_number)
    ).scalar_one_or_none()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )
    
    # Verify account belongs to authenticated user
    if account.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account does not belong to authenticated user"
        )
    
    # Get all ledger entries for this account
    entries = db.execute(
        select(LedgerEntry).where(LedgerEntry.account_id == account.id)
    ).scalars().all()
    
    # Get unique transactions
    transaction_ids = set(entry.transaction_id for entry in entries)
    transactions = db.execute(
        select(Transaction).where(Transaction.id.in_(transaction_ids))
    ).scalars().all()
    
    return HistoryResponse(
        transactions=[
            TransactionResponse(
                id=t.id,
                transaction_type=t.transaction_type.value,
                status=t.status.value,
                reference_id=t.reference_id,
                description=t.description,
                created_at=t.created_at
            )
            for t in transactions
        ]
    )

@router.post("/accounts/{account_number}/deposit", response_model=TransactionResponse)
async def deposit(
    account_number: str,
    request: DepositRequest,
    current_user: BaseUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Generate unique reference ID
    reference_id = secrets.token_urlsafe(16)
    
    try:
        # Lock account with SELECT FOR UPDATE
        account = db.execute(
            select(Account).where(Account.account_number == account_number).with_for_update()
        ).scalar_one_or_none()
        
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found"
            )
        
        # Verify account belongs to authenticated user
        if account.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account does not belong to authenticated user"
            )
        
        # Create transaction
        transaction = Transaction(
            transaction_type=TransactionType.DEPOSIT,
            status=TransactionStatus.COMPLETED,
            reference_id=reference_id,
            description=f"Deposit to account {account_number}"
        )
        db.add(transaction)
        db.flush()
        
        # Create credit entry
        credit_entry = LedgerEntry(
            transaction_id=transaction.id,
            account_id=account.id,
            amount=request.amount,
            entry_type=EntryType.CREDIT
        )
        db.add(credit_entry)
        
        db.commit()
        db.refresh(transaction)
        
        return TransactionResponse(
            id=transaction.id,
            transaction_type=transaction.transaction_type.value,
            status=transaction.status.value,
            reference_id=transaction.reference_id,
            description=transaction.description,
            created_at=transaction.created_at
        )
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Deposit failed: {str(e)}"
        )

@router.post("/accounts/{account_number}/withdraw", response_model=TransactionResponse)
async def withdraw(
    account_number: str,
    request: WithdrawRequest,
    current_user: BaseUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Generate unique reference ID
    reference_id = secrets.token_urlsafe(16)
    
    try:
        # Lock account with SELECT FOR UPDATE
        account = db.execute(
            select(Account).where(Account.account_number == account_number).with_for_update()
        ).scalar_one_or_none()
        
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found"
            )
        
        # Verify account belongs to authenticated user
        if account.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account does not belong to authenticated user"
            )
        
        # Calculate current balance from ledger entries
        entries = db.execute(
            select(LedgerEntry).where(LedgerEntry.account_id == account.id)
        ).scalars().all()
        
        balance = Decimal('0.00')
        for entry in entries:
            if entry.entry_type == EntryType.CREDIT:
                balance += entry.amount
            else:
                balance -= entry.amount
        
        # Insufficient funds check
        if balance < request.amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insufficient funds"
            )
        
        # Create transaction
        transaction = Transaction(
            transaction_type=TransactionType.WITHDRAWAL,
            status=TransactionStatus.COMPLETED,
            reference_id=reference_id,
            description=f"Withdrawal from account {account_number}"
        )
        db.add(transaction)
        db.flush()
        
        # Create debit entry
        debit_entry = LedgerEntry(
            transaction_id=transaction.id,
            account_id=account.id,
            amount=request.amount,
            entry_type=EntryType.DEBIT
        )
        db.add(debit_entry)
        
        db.commit()
        db.refresh(transaction)
        
        return TransactionResponse(
            id=transaction.id,
            transaction_type=transaction.transaction_type.value,
            status=transaction.status.value,
            reference_id=transaction.reference_id,
            description=transaction.description,
            created_at=transaction.created_at
        )
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Withdrawal failed: {str(e)}"
        )
