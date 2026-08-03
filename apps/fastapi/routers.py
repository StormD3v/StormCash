from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from database import get_db
from models import Account, Transaction, LedgerEntry, TransactionStatus, TransactionType, EntryType, BaseUser
from schemas import TransferRequest, DepositRequest, WithdrawRequest, BalanceResponse, HistoryResponse, TransactionResponse, LedgerEntryResponse, SettlementDetailsResponse
from auth import get_current_user
from blockchain import SettlementEngine
from decimal import Decimal
import secrets
from datetime import datetime
import uuid
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
            select(Account).where(Account.account_number ==
                                  request.from_account_number).with_for_update()
        ).scalar_one_or_none()

        to_account = db.execute(
            select(Account).where(Account.account_number ==
                                  request.to_account_number).with_for_update()
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

        # Verify the source account belongs to the authenticated user.
        # The destination account can belong to any user — that is the
        # point of a transfer.
        if from_account.user_id != current_user.id:
            logger.error(f"[AUTH] Transfer source account authorization failed - account {request.from_account_number} belongs to user {from_account.user_id}, but authenticated user is {current_user.id} - raising 403")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Source account does not belong to authenticated user"
            )

        # Prevent self-transfer (same account)
        if from_account.id == to_account.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot transfer to the same account"
            )

        # Calculate current balance from ledger entries
        from_balance = db.execute(
            select(LedgerEntry).where(
                LedgerEntry.account_id == from_account.id)
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

        # Initialize blockchain settlement engine
        settlement_engine = SettlementEngine(db)

        # Create transaction as PENDING for blockchain settlement
        transaction = Transaction(
            transaction_type=TransactionType.TRANSFER,
            status="PENDING",
            reference_id=reference_id,
            description=f"Blockchain transfer from {request.from_account_number} to {request.to_account_number}"
        )
        db.add(transaction)
        db.flush()

        # Initiate blockchain settlement
        timeline = settlement_engine.initiate_settlement(
            transaction,
            request.from_account_number,
            request.to_account_number,
            request.amount
        )

        # Create debit entry for source account (immediate)
        debit_entry = LedgerEntry(
            transaction_id=transaction.id,
            account_id=from_account.id,
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
            created_at=transaction.created_at,
            amount=request.amount,
            settlement_stage=transaction.settlement_stage.value if transaction.settlement_stage else None,
            blockchain_tx_hash=transaction.blockchain_tx_hash,
            block_number=transaction.block_number,
            confirmation_count=transaction.confirmation_count,
            gas_fee=transaction.gas_fee,
            blockchain_amount=transaction.blockchain_amount,
            network_name=transaction.network_name,
            settlement_time=transaction.settlement_time
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


def auto_advance_pending_transactions(account: Account, db: Session):
    """
    Advance any PENDING transfers involving this account.
    Called as a side-effect of balance/history reads.
    Errors here must not propagate to the HTTP response — catch and log only.
    """
    try:
        pending_txs = db.execute(
            select(Transaction).where(
                Transaction.status == TransactionStatus.PENDING,
                Transaction.transaction_type == TransactionType.TRANSFER,
                (Transaction.from_account_number == account.account_number) |
                (Transaction.to_account_number == account.account_number)
            )
        ).scalars().all()

        if not pending_txs:
            return

        settlement_engine = SettlementEngine(db)
        changed = False

        for tx in pending_txs:
            current_stage = settlement_engine.advance_settlement_stage(tx)
            changed = True

            if current_stage == "DEPOSITED":
                # Check status as string since it may have been written
                # as a raw string ("COMPLETED") rather than the enum value
                tx_status = tx.status.value if hasattr(
                    tx.status, 'value') else str(tx.status)
                if tx_status == "COMPLETED":
                    to_acc = db.execute(
                        select(Account).where(
                            Account.account_number == tx.to_account_number)
                    ).scalar_one_or_none()
                    
                    if to_acc:
                        existing_credit = db.execute(
                            select(LedgerEntry).where(
                                LedgerEntry.transaction_id == tx.id,
                                LedgerEntry.account_id == to_acc.id,
                                LedgerEntry.entry_type == EntryType.CREDIT
                            )
                        ).scalar_one_or_none()
                        if not existing_credit:
                            final_amount = settlement_engine.blockchain.convert_token_to_fiat(
                                tx.blockchain_amount or Decimal("0"),
                                tx.gas_fee or Decimal("0")
                            )
                            
                            credit_entry = LedgerEntry(
                                transaction_id=tx.id,
                                account_id=to_acc.id,
                                amount=final_amount,
                                entry_type=EntryType.CREDIT
                            )
                            db.add(credit_entry)

        if changed:
            db.commit()

    except Exception as e:
        # Never let settlement advancement break a read endpoint
        db.rollback()
        import logging
        logging.getLogger(__name__).warning(
            f"auto_advance_pending_transactions failed for {account.account_number}: {e}"
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
        logger.error(f"[AUTH] Account authorization failed - account {account_number} belongs to user {account.user_id}, but authenticated user is {current_user.id} - raising 403")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account does not belong to authenticated user"
        )

    auto_advance_pending_transactions(account, db)

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
        logger.error(f"[AUTH] Account authorization failed - account {account_number} belongs to user {account.user_id}, but authenticated user is {current_user.id} - raising 403")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account does not belong to authenticated user"
        )

    auto_advance_pending_transactions(account, db)

    # Get all ledger entries for this account
    entries = db.execute(
        select(LedgerEntry).where(LedgerEntry.account_id == account.id)
    ).scalars().all()

    # Get unique transactions and their amounts
    transaction_ids = set(entry.transaction_id for entry in entries)
    transactions = db.execute(
        select(Transaction).where(Transaction.id.in_(transaction_ids)
                                  ).order_by(Transaction.created_at.desc())
    ).scalars().all()

    # Build a map of transaction_id to amount and direction for this account
    transaction_amounts = {}
    transaction_directions = {}
    for entry in entries:
        if entry.transaction_id not in transaction_amounts:
            transaction_amounts[entry.transaction_id] = entry.amount
            transaction_directions[entry.transaction_id] = "credit" if entry.entry_type == EntryType.CREDIT else "debit"

    return HistoryResponse(
        transactions=[
            TransactionResponse(
                id=t.id,
                transaction_type=t.transaction_type.value,
                status=t.status.value,
                reference_id=t.reference_id,
                description=t.description,
                created_at=t.created_at,
                amount=transaction_amounts.get(t.id),
                settlement_stage=t.settlement_stage.value if t.settlement_stage else None,
                blockchain_tx_hash=t.blockchain_tx_hash,
                block_number=t.block_number,
                confirmation_count=t.confirmation_count,
                gas_fee=t.gas_fee,
                blockchain_amount=t.blockchain_amount,
                network_name=t.network_name,
                settlement_time=t.settlement_time,
                direction=transaction_directions.get(t.id),
                from_account_number=t.from_account_number,
                to_account_number=t.to_account_number,
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
            select(Account).where(Account.account_number ==
                                  account_number).with_for_update()
        ).scalar_one_or_none()

        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found"
            )

        # Verify account belongs to authenticated user
        if account.user_id != current_user.id:
            logger.error(f"[AUTH] Deposit account authorization failed - account {account_number} belongs to user {account.user_id}, but authenticated user is {current_user.id} - raising 403")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account does not belong to authenticated user"
            )

        # Create transaction
        transaction = Transaction(
            transaction_type=TransactionType.DEPOSIT,
            status="COMPLETED",
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
            created_at=transaction.created_at,
            amount=request.amount
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
            select(Account).where(Account.account_number ==
                                  account_number).with_for_update()
        ).scalar_one_or_none()

        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found"
            )

        # Verify account belongs to authenticated user
        if account.user_id != current_user.id:
            logger.error(f"[AUTH] Withdraw account authorization failed - account {account_number} belongs to user {account.user_id}, but authenticated user is {current_user.id} - raising 403")
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
            status="COMPLETED",
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
            created_at=transaction.created_at,
            amount=request.amount
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


@router.get("/settlement/{transaction_id}", response_model=SettlementDetailsResponse)
async def get_settlement_details(
    transaction_id: str,
    current_user: BaseUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed blockchain settlement information for a transaction."""
    import uuid as uuid_module

    try:
        transaction_uuid = uuid_module.UUID(transaction_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid transaction ID format"
        )

    transaction = db.execute(
        select(Transaction).where(Transaction.id == transaction_uuid)
    ).scalar_one_or_none()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )

    # Verify user owns at least one account involved in the transaction
    # For transfers: check from_account_number or to_account_number
    # For deposits/withdrawals: check the associated account via ledger entries
    is_authorized = False
    
    if transaction.from_account_number:
        from_account = db.execute(
            select(Account).where(Account.account_number ==
                                  transaction.from_account_number)
        ).scalar_one_or_none()
        if from_account and from_account.user_id == current_user.id:
            is_authorized = True
    
    if not is_authorized and transaction.to_account_number:
        to_account = db.execute(
            select(Account).where(Account.account_number ==
                                  transaction.to_account_number)
        ).scalar_one_or_none()
        if to_account and to_account.user_id == current_user.id:
            is_authorized = True
    
    # For deposits/withdrawals, check ledger entries to find the associated account
    if not is_authorized:
        ledger_entries = db.execute(
            select(LedgerEntry).where(LedgerEntry.transaction_id == transaction.id)
        ).scalars().all()
        
        for entry in ledger_entries:
            account = db.execute(
                select(Account).where(Account.id == entry.account_id)
            ).scalar_one_or_none()
            if account and account.user_id == current_user.id:
                is_authorized = True
                break
    
    if not is_authorized:
        logger.error(f"[AUTH] Settlement endpoint authorization failed for transaction {transaction_id} - user {current_user.id} not authorized - raising 403")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this transaction"
        )
    
    # Initialize settlement engine and get details
    settlement_engine = SettlementEngine(db)
    details = settlement_engine.get_settlement_details(transaction)

    return SettlementDetailsResponse(**details)


@router.post("/settlement/process/{transaction_id}", response_model=TransactionResponse)
async def process_settlement(
    transaction_id: str,
    current_user: BaseUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Process the next stage of blockchain settlement for a pending transaction."""
    import uuid as uuid_module

    try:
        transaction_uuid = uuid_module.UUID(transaction_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid transaction ID format"
        )

    transaction = db.execute(
        select(Transaction).where(Transaction.id == transaction_uuid)
    ).scalar_one_or_none()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )

    if transaction.transaction_type != TransactionType.TRANSFER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only transfer transactions have blockchain settlement"
        )

    # Verify user owns the source account
    if transaction.from_account_number:
        from_account = db.execute(
            select(Account).where(Account.account_number ==
                                  transaction.from_account_number)
        ).scalar_one_or_none()
        if not from_account or from_account.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to process this transaction"
            )

    # Initialize settlement engine and advance stage
    settlement_engine = SettlementEngine(db)
    current_stage = settlement_engine.advance_settlement_stage(transaction)

    # If settlement is complete, credit the destination account
    if current_stage == "DEPOSITED" and transaction.status == "COMPLETED":
        to_account = db.execute(
            select(Account).where(Account.account_number ==
                                  transaction.to_account_number)
        ).scalar_one_or_none()

        if to_account:
            # Calculate final amount after gas fees
            final_amount = settlement_engine.blockchain.convert_token_to_fiat(
                transaction.blockchain_amount or Decimal("0"),
                transaction.gas_fee or Decimal("0")
            )

            # Create credit entry for destination account
            credit_entry = LedgerEntry(
                transaction_id=transaction.id,
                account_id=to_account.id,
                amount=final_amount,
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
        created_at=transaction.created_at,
        amount=transaction.blockchain_amount,  # Return blockchain amount
        settlement_stage=transaction.settlement_stage.value if transaction.settlement_stage else None,
        blockchain_tx_hash=transaction.blockchain_tx_hash,
        block_number=transaction.block_number,
        confirmation_count=transaction.confirmation_count,
        gas_fee=transaction.gas_fee,
        blockchain_amount=transaction.blockchain_amount,
        network_name=transaction.network_name,
        settlement_time=transaction.settlement_time
    )
