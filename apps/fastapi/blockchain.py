"""
Mock Blockchain Settlement Service

This service simulates a blockchain settlement layer for transfers.
It generates realistic blockchain data and manages the settlement timeline.
"""
import secrets
import time
from decimal import Decimal
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import hashlib


class MockBlockchainService:
    """Simulates blockchain operations for the StormCash settlement layer."""

    NETWORK_NAME = "StormChain"
    BASE_GAS_FEE = Decimal("0.000001")  # Small gas fee in tokens
    CONFIRMATION_TIME_SECONDS = 3  # Fast confirmation for demo
    SETTLEMENT_STAGES = [
        "INITIATED",
        "CONVERTING_TO_TOKEN",
        "MINTING_TOKEN",
        "BROADCASTING",
        "WAITING_CONFIRMATION",
        "CONFIRMED",
        "CONVERTING_TO_FIAT",
        "DEPOSITED"
    ]

    @staticmethod
    def generate_transaction_hash() -> str:
        """Generate a realistic-looking blockchain transaction hash."""
        random_bytes = secrets.token_bytes(32)
        return "0x" + random_bytes.hex()

    @staticmethod
    def generate_block_number() -> int:
        """Generate a realistic block number."""
        # Start from a high block number to look realistic
        base_block = 18500000
        import random
        return base_block + random.randint(1, 1000000)

    @staticmethod
    def calculate_gas_fee(amount: Decimal) -> Decimal:
        """Calculate gas fee based on transaction amount."""
        # Simple fee calculation: 0.1% of amount + base fee
        fee = (amount * Decimal("0.001")) + MockBlockchainService.BASE_GAS_FEE
        return round(fee, 6)

    @staticmethod
    def convert_fiat_to_token(fiat_amount: Decimal) -> Decimal:
        """Convert fiat amount to blockchain tokens (1:1 for demo)."""
        return fiat_amount

    @staticmethod
    def convert_token_to_fiat(token_amount: Decimal, gas_fee: Decimal) -> Decimal:
        """Convert tokens back to fiat after subtracting gas fee."""
        return token_amount - gas_fee

    @staticmethod
    def simulate_settlement_delay():
        """Simulate blockchain confirmation delay."""
        time.sleep(MockBlockchainService.CONFIRMATION_TIME_SECONDS)

    @staticmethod
    def generate_settlement_timeline(amount: Decimal) -> Dict[str, Any]:
        """Generate a complete settlement timeline for a transfer."""
        now = datetime.utcnow()
        gas_fee = MockBlockchainService.calculate_gas_fee(amount)
        blockchain_amount = MockBlockchainService.convert_fiat_to_token(amount)
        final_amount = MockBlockchainService.convert_token_to_fiat(blockchain_amount, gas_fee)

        timeline = {
            "initiated_at": now,
            "converting_at": now + timedelta(seconds=1),
            "minting_at": now + timedelta(seconds=2),
            "broadcasting_at": now + timedelta(seconds=3),
            "confirmation_wait_start": now + timedelta(seconds=4),
            "confirmed_at": now + timedelta(seconds=7),
            "converting_back_at": now + timedelta(seconds=8),
            "deposited_at": now + timedelta(seconds=9),
            "settlement_complete_at": now + timedelta(seconds=10),
            "gas_fee": gas_fee,
            "blockchain_amount": blockchain_amount,
            "final_fiat_amount": final_amount,
            "network_name": MockBlockchainService.NETWORK_NAME
        }

        return timeline

    @staticmethod
    def get_current_stage(timeline: Dict[str, Any]) -> str:
        """Determine current settlement stage based on timeline."""
        now = datetime.utcnow()

        # Remove timezone info if present for consistent comparison
        def make_naive(dt):
            if hasattr(dt, 'tzinfo') and dt.tzinfo is not None:
                return dt.replace(tzinfo=None)
            return dt

        if now < make_naive(timeline["converting_at"]):
            return "INITIATED"
        elif now < make_naive(timeline["minting_at"]):
            return "CONVERTING_TO_TOKEN"
        elif now < make_naive(timeline["broadcasting_at"]):
            return "MINTING_TOKEN"
        elif now < make_naive(timeline["confirmation_wait_start"]):
            return "BROADCASTING"
        elif now < make_naive(timeline["confirmed_at"]):
            return "WAITING_CONFIRMATION"
        elif now < make_naive(timeline["converting_back_at"]):
            return "CONFIRMED"
        elif now < make_naive(timeline["deposited_at"]):
            return "CONVERTING_TO_FIAT"
        else:
            return "DEPOSITED"

    @staticmethod
    def generate_blockchain_explorer_url(tx_hash: str) -> str:
        """Generate a mock blockchain explorer URL."""
        return f"https://stormchain.explorer/tx/{tx_hash}"


class SettlementEngine:
    """Manages the blockchain settlement process for transfers."""

    def __init__(self, db_session):
        self.db = db_session
        self.blockchain = MockBlockchainService()

    def initiate_settlement(self, transaction, from_account: str, to_account: str, amount: Decimal):
        """Initiate blockchain settlement for a transfer."""
        # Generate blockchain data
        tx_hash = self.blockchain.generate_transaction_hash()
        block_number = self.blockchain.generate_block_number()
        timeline = self.blockchain.generate_settlement_timeline(amount)

        # Update transaction with blockchain data (using string values to avoid import issues)
        transaction.settlement_stage = "INITIATED"
        transaction.blockchain_tx_hash = tx_hash
        transaction.block_number = block_number
        transaction.gas_fee = timeline["gas_fee"]
        transaction.blockchain_amount = timeline["blockchain_amount"]
        transaction.network_name = timeline["network_name"]
        transaction.from_account_number = from_account
        transaction.to_account_number = to_account
        transaction.confirmation_count = 0

        return timeline

    def advance_settlement_stage(self, transaction):
        """Advance the settlement stage based on elapsed time."""
        # Helper to ensure datetime is naive
        def make_naive(dt):
            if hasattr(dt, 'tzinfo') and dt.tzinfo is not None:
                return dt.replace(tzinfo=None)
            return dt

        # Create timeline on-the-fly from transaction data
        created_at = make_naive(transaction.created_at)
        timeline = {
            "initiated_at": created_at,
            "converting_at": created_at + timedelta(seconds=1),
            "minting_at": created_at + timedelta(seconds=2),
            "broadcasting_at": created_at + timedelta(seconds=3),
            "confirmation_wait_start": created_at + timedelta(seconds=4),
            "confirmed_at": created_at + timedelta(seconds=7),
            "converting_back_at": created_at + timedelta(seconds=8),
            "deposited_at": created_at + timedelta(seconds=9),
        }

        current_stage = self.blockchain.get_current_stage(timeline)

        # Update confirmation count if confirmed
        if current_stage in ["CONFIRMED", "CONVERTING_TO_FIAT", "DEPOSITED"]:
            elapsed = (datetime.utcnow() - make_naive(timeline["confirmed_at"])).total_seconds()
            transaction.confirmation_count = min(int(elapsed) + 1, 12)  # Max 12 confirmations

        # Update settlement stage (using string value)
        transaction.settlement_stage = current_stage

        # Set settlement time when complete
        if current_stage == "DEPOSITED":
            transaction.settlement_time = datetime.utcnow()
            transaction.status = "COMPLETED"

        return current_stage

    def get_settlement_details(self, transaction) -> Dict[str, Any]:
        """Get detailed settlement information for a transaction."""
        from decimal import Decimal
        
        blockchain_amount = transaction.blockchain_amount
        if blockchain_amount is None and transaction.ledger_entries:
            blockchain_amount = transaction.ledger_entries[0].amount

        final_amount = self.blockchain.convert_token_to_fiat(
            blockchain_amount or Decimal("0"),
            transaction.gas_fee or Decimal("0")
        )

        tx_type = transaction.transaction_type.value if hasattr(transaction.transaction_type, 'value') else str(transaction.transaction_type)

        return {
            "transaction_id": str(transaction.id),
            "reference_id": transaction.reference_id,
            "transaction_type": tx_type,
            "blockchain_tx_hash": transaction.blockchain_tx_hash,
            "block_number": transaction.block_number,
            "confirmation_count": transaction.confirmation_count,
            "gas_fee": float(transaction.gas_fee) if transaction.gas_fee else 0,
            "blockchain_amount": float(blockchain_amount) if blockchain_amount else 0,
            "fiat_amount": float(blockchain_amount) if tx_type in ["DEPOSIT", "WITHDRAWAL"] else float(final_amount),
            "network_name": transaction.network_name,
            "settlement_stage": transaction.settlement_stage.value if transaction.settlement_stage else None,
            "settlement_time": transaction.settlement_time.isoformat() if transaction.settlement_time else None,
            "from_account": transaction.from_account_number,
            "to_account": transaction.to_account_number,
            "explorer_url": self.blockchain.generate_blockchain_explorer_url(transaction.blockchain_tx_hash) if transaction.blockchain_tx_hash else None
        }
