# StormCash — Architecture Overview

> This document describes the current technical architecture as it exists in the codebase. It also describes conceptual future architecture that does not yet exist, clearly labelled.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Django API — Identity Service](#2-django-api--identity-service)
3. [FastAPI — Transaction Engine](#3-fastapi--transaction-engine)
4. [Shared Database Schema](#4-shared-database-schema)
5. [Settlement Engine](#5-settlement-engine)
6. [Frontend](#6-frontend)
7. [Authentication Flow](#7-authentication-flow)
8. [Transfer Flow](#8-transfer-flow)
9. [Deployment](#9-deployment)
10. [Conceptual Future Architecture](#10-conceptual-future-architecture)

---

## 1. System Overview

StormCash is composed of three running services sharing one PostgreSQL database:

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend                            │
│                    Vite · Tailwind · Framer Motion           │
│                    Port 3000 (dev) / static (prod)           │
└────────────────┬──────────────────────────┬─────────────────┘
                 │ HTTP + Bearer JWT         │ HTTP + Bearer JWT
    ┌────────────▼───────────┐  ┌───────────▼────────────────┐
    │   Django REST API      │  │        FastAPI              │
    │   Port 8000            │  │        Port 8001            │
    │                        │  │                             │
    │   /api/auth/           │  │   /api/balance/:acct        │
    │     register/          │  │   /api/history/:acct        │
    │     login/             │  │   /api/transfer             │
    │     token/refresh/     │  │   /api/accounts/:acct/      │
    │                        │  │     deposit                 │
    │   Django ORM           │  │     withdraw                │
    │   SimpleJWT            │  │   /api/settlement/:id       │
    │   DRF                  │  │   /api/settlement/          │
    └────────────┬───────────┘  │     process/:id             │
                 │               │                             │
                 │               │   SQLAlchemy                │
                 │               │   python-jose (JWT verify)  │
                 │               └───────────┬─────────────────┘
                 │                           │
                 └─────────────┬─────────────┘
                               │
                    ┌──────────▼──────────┐
                    │     PostgreSQL       │
                    │                     │
                    │  users              │
                    │  accounts           │
                    │  transactions       │
                    │  ledger_entries     │
                    └─────────────────────┘
```

### Key Architectural Properties

- **Shared schema, two ORMs.** Django and FastAPI write to the same PostgreSQL database. Django uses its built-in ORM for the `users` and `accounts` tables (which Django migrations manage). FastAPI uses SQLAlchemy for all tables, including the same `users` and `accounts` tables.

- **JWT issued by Django, validated by FastAPI.** Django issues JWT tokens on login. FastAPI decodes and validates these tokens on every request using the same `JWT_SECRET_KEY` and `JWT_ALGORITHM` environment variables.

- **Balances are never stored.** Account balances are always computed by summing `ledger_entries` for an account. There is no `balance` column anywhere in the schema.

- **Transfers are non-blocking to the sender, eventual for the recipient.** The source account is debited immediately (blocking on a row lock). The destination account is credited only when the settlement state machine reaches `DEPOSITED`.

---

## 2. Django API — Identity Service

**Purpose:** User identity, authentication, and account initialisation.

**Framework:** Django 5.2 + Django REST Framework + SimpleJWT

**Deployed with:** Gunicorn (4 workers, 2 threads)

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/register/` | Create user + account, return JWT pair |
| `POST` | `/api/auth/login/` | Authenticate, return JWT pair + user data |
| `POST` | `/api/auth/token/refresh/` | Exchange refresh token for new access token |

### Registration behaviour

When a user registers, Django creates:
1. A `User` record (UUID primary key, username, email, hashed password)
2. An `Account` record (UUID, 12-digit random account number, `demo_currency_code: "USD"`)

Account number generation uses `secrets.choice` over the digit range, with a collision check and 10 retry attempts before raising an exception.

### JWT configuration

```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ALGORITHM': os.getenv('JWT_ALGORITHM', 'HS256'),
    'SIGNING_KEY': os.getenv('JWT_SECRET_KEY', ...),
    'USER_ID_FIELD': 'id',   # UUID in token payload as 'user_id'
}
```

The JWT payload contains `user_id` (UUID string). FastAPI extracts this to look up the user record.

### Data model (Django ORM)

```python
class User(AbstractUser):
    id = UUIDField(primary_key=True)
    created_at = DateTimeField(auto_now_add=True)
    # inherits: username, email, password, is_active, etc.
    # db_table: 'users'

class Account(Model):
    id = UUIDField(primary_key=True)
    user = ForeignKey(User, related_name='accounts')
    demo_currency_code = CharField(max_length=3)
    account_number = CharField(max_length=12, unique=True)
    is_active = BooleanField(default=True)
    # db_table: 'accounts'
```

---

## 3. FastAPI — Transaction Engine

**Purpose:** All financial operations and the settlement state machine.

**Framework:** FastAPI + SQLAlchemy (sync) + Pydantic

**Deployed with:** Uvicorn

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/balance/:account_number` | JWT | Compute and return current balance |
| `GET` | `/api/history/:account_number` | JWT | Return transaction history with amounts and directions |
| `POST` | `/api/transfer` | JWT | Initiate transfer with blockchain settlement |
| `POST` | `/api/accounts/:account_number/deposit` | JWT | Deposit funds (immediate) |
| `POST` | `/api/accounts/:account_number/withdraw` | JWT | Withdraw funds (with balance check) |
| `GET` | `/api/settlement/:transaction_id` | JWT | Get settlement details for a transaction |
| `POST` | `/api/settlement/process/:transaction_id` | JWT | Advance settlement stage, credit destination if complete |

### Authentication

Every endpoint depends on `get_current_user`:

```python
async def get_current_user(credentials: HTTPAuthorizationCredentials, db: Session):
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    user_id = payload.get("user_id")
    user = db.execute(select(BaseUser).where(BaseUser.id == user_id)).scalar_one_or_none()
    return user
```

The same `JWT_SECRET_KEY` and `JWT_ALGORITHM` from the environment are used by both services.

### Account ownership verification

Every endpoint that touches an account verifies ownership:

```python
if account.user_id != current_user.id:
    raise HTTPException(status_code=403, detail="Account does not belong to authenticated user")
```

This check runs before any balance read or write.

### Concurrency protection (transfers)

```python
from_account = db.execute(
    select(Account).where(...).with_for_update()
).scalar_one_or_none()

to_account = db.execute(
    select(Account).where(...).with_for_update()
).scalar_one_or_none()
```

`SELECT FOR UPDATE` acquires a row-level exclusive lock on both account rows. A concurrent transaction attempting to lock the same rows will block until the first transaction commits or rolls back. This prevents two simultaneous transfers from both seeing a sufficient balance and both debiting the account.

### Balance calculation

```python
balance = Decimal('0.00')
for entry in ledger_entries:
    if entry.entry_type == EntryType.CREDIT:
        balance += entry.amount
    else:
        balance -= entry.amount
```

No stored balance field exists. Balance is always freshly computed from ledger entries.

---

## 4. Shared Database Schema

```sql
-- Users (managed by Django migrations)
users
  id              UUID PRIMARY KEY
  username        VARCHAR(150) UNIQUE
  email           VARCHAR(254) UNIQUE
  password        VARCHAR(128)
  is_active       BOOLEAN DEFAULT TRUE
  is_staff        BOOLEAN DEFAULT FALSE
  is_superuser    BOOLEAN DEFAULT FALSE
  last_login      TIMESTAMP
  date_joined     TIMESTAMP
  created_at      TIMESTAMP

-- Accounts (managed by Django migrations)
accounts
  id                  UUID PRIMARY KEY
  user_id             UUID REFERENCES users(id)
  account_number      VARCHAR(12) UNIQUE
  demo_currency_code  VARCHAR(3)
  is_active           BOOLEAN DEFAULT TRUE
  created_at          TIMESTAMP

-- Transactions (initial schema by Django, blockchain columns added by FastAPI migration)
transactions
  id                  UUID PRIMARY KEY
  transaction_type    VARCHAR(20)   -- TRANSFER | DEPOSIT | WITHDRAWAL | FEE
  status              VARCHAR(20)   -- PENDING | COMPLETED | FAILED | REVERSED
  reference_id        VARCHAR(100) UNIQUE
  description         TEXT
  created_at          TIMESTAMP
  -- Blockchain settlement columns (added by add_blockchain_fields.py):
  settlement_stage    VARCHAR(50)   -- INITIATED | ... | DEPOSITED | FAILED
  blockchain_tx_hash  VARCHAR(66)   -- 0x + 64 hex chars (simulated)
  block_number        INTEGER       -- (simulated)
  confirmation_count  INTEGER DEFAULT 0
  gas_fee             NUMERIC(19,6)
  blockchain_amount   NUMERIC(19,6)
  network_name        VARCHAR(50) DEFAULT 'StormChain'
  settlement_time     TIMESTAMP
  from_account_number VARCHAR(12)
  to_account_number   VARCHAR(12)

-- Ledger entries (managed by Django migrations)
ledger_entries
  id              UUID PRIMARY KEY
  transaction_id  UUID REFERENCES transactions(id)
  account_id      UUID REFERENCES accounts(id)
  amount          NUMERIC(19,2)
  entry_type      VARCHAR(10)   -- DEBIT | CREDIT
  created_at      TIMESTAMP
```

### Schema management split

This is a current architectural limitation:

- Django owns and migrates: `users`, `accounts`, `ledger_entries`, base `transactions` columns
- FastAPI adds blockchain columns via a manual migration script (`migrations/add_blockchain_fields.py`)
- When deploying fresh: run Django migrations first, then run the FastAPI migration script

---

## 5. Settlement Engine

The settlement engine (`blockchain.py`) consists of two classes:

### MockBlockchainService

A pure simulation. No network calls. Generates deterministic-looking blockchain data from random values.

```
generate_transaction_hash() → "0x" + 32 random bytes as hex
generate_block_number()     → 18,500,000 + random(1, 1,000,000)
calculate_gas_fee(amount)   → (amount × 0.001) + 0.000001
convert_fiat_to_token()     → 1:1 (no conversion)
convert_token_to_fiat()     → token_amount - gas_fee
generate_settlement_timeline() → dict of datetime offsets from now
get_current_stage(timeline) → stage based on datetime.utcnow() vs timeline
```

### Stage Progression Timeline

All timings are relative to `transaction.created_at`:

```
t+0s   INITIATED
t+1s   CONVERTING_TO_TOKEN
t+2s   MINTING_TOKEN
t+3s   BROADCASTING
t+4s   WAITING_CONFIRMATION
t+7s   CONFIRMED
t+8s   CONVERTING_TO_FIAT
t+9s   DEPOSITED  ← status set to COMPLETED, destination credited
```

### SettlementEngine

Wraps `MockBlockchainService` with database operations:

- `initiate_settlement(transaction, from, to, amount)` — sets initial blockchain fields on the transaction
- `advance_settlement_stage(transaction)` — computes current stage from elapsed time, updates DB, credits destination on `DEPOSITED`
- `get_settlement_details(transaction)` — returns full detail dict for the explorer API

### Auto-advancement

`auto_advance_pending_transactions(account, db)` is called at the start of every balance and history request. It finds all `PENDING` transfer transactions involving the account and calls `advance_settlement_stage` on each. This ensures settlement progresses even if the frontend polling loop is not running.

---

## 6. Frontend

**Framework:** React 18 + Vite + Tailwind CSS + Framer Motion

**Key pages:**

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `HomePage` | Marketing page (fictional content) |
| `/login` | `ObservatoryLogin` | Login form (registration disabled in UI) |
| `/dashboard` | `Dashboard` | Protected — full financial dashboard |

**Dashboard component tree:**

```
Dashboard (page)
├── DashboardLayout
│   ├── Sidebar
│   └── TopNavbar
├── OverviewHeader
├── KPIGrid
│   └── BalanceHero (spans 2 of 5 grid columns)
├── AccountSummary
├── QuickActions
├── RecentActivity
│   └── StormLog
├── SecondaryContent (Ledger Insights)
├── TransferModal
│   └── SettlementTimeline
├── DepositWithdrawModal
└── TransactionExplorer
    └── ConfirmationProgress
```

**API service layer** (`src/services/api.js`):

- `authAPI` — Django: register, login, logout, token refresh
- `fastAPI` — FastAPI: balance, history, transfer, deposit, withdraw, settlement details, process settlement
- JWT stored in `localStorage` (access + refresh tokens)
- Auto-refresh: on 401, attempt one token refresh; on failure, dispatch `auth:expired` event and redirect to login
- `AuthContext` listens for `auth:expired` and clears state

---

## 7. Authentication Flow

```
User enters credentials
        │
        ▼
POST /api/auth/login/ (Django)
        │
        ▼
Django authenticates + issues JWT pair
  { access: "eyJ...", refresh: "eyJ...", user: {...} }
        │
        ▼
Frontend stores tokens in localStorage
  localStorage.setItem('access_token', ...)
  localStorage.setItem('refresh_token', ...)
  localStorage.setItem('user_details', JSON.stringify(user))
        │
        ▼
All FastAPI requests include:
  Authorization: Bearer <access_token>
        │
        ▼
FastAPI decodes JWT, extracts user_id
        │
        ▼
FastAPI queries users table by user_id
        │
        ├── User found → proceed
        └── User not found / token invalid → 401
                │
                ▼
        Frontend catches 401
                │
                ▼
        Attempt POST /api/auth/token/refresh/
                │
                ├── Success → retry original request
                └── Failure → auth:expired event → redirect to /login
```

---

## 8. Transfer Flow

```
User enters amount in TransferModal
        │
        ▼
POST /api/transfer { from_account, to_account, amount }
        │
        ▼
FastAPI: SELECT FOR UPDATE on both accounts
        │
        ├── Account not found → 404
        ├── Account not owned by user → 403
        └── Balance sufficient → continue
                │
                ▼
        Create Transaction (status=PENDING)
                │
                ▼
        SettlementEngine.initiate_settlement()
          - Generate tx hash, block number
          - Calculate gas fee
          - Set settlement_stage = INITIATED
                │
                ▼
        Create LedgerEntry (DEBIT, from_account)
                │
                ▼
        COMMIT
                │
                ▼
        Return TransactionResponse
          { id, settlement_stage: "INITIATED", blockchain_tx_hash, ... }

--- Frontend polling loop (every 1 second) ---

POST /api/settlement/process/:transaction_id
        │
        ▼
FastAPI: advance_settlement_stage(transaction)
  - Compute current stage from datetime.utcnow() vs created_at
  - Update settlement_stage in DB
  - If stage == DEPOSITED:
      - status = COMPLETED
      - settlement_time = now
      - Create LedgerEntry (CREDIT, to_account, amount - gas_fee)
      - COMMIT
        │
        ▼
Return updated TransactionResponse
        │
        ├── settlement_stage != DEPOSITED → frontend polls again in 1s
        └── settlement_stage == DEPOSITED → frontend shows completion screen
```

---

## 9. Deployment

Both backend services are deployed on Railway. Configuration is in `railway.json` per service.

### Django API
```json
{
  "build": { "builder": "NIXPACKS", "buildCommand": "python manage.py collectstatic --noinput" },
  "deploy": {
    "startCommand": "gunicorn config.wsgi --bind 0.0.0.0:$PORT --workers 4 --threads 2",
    "healthcheckPath": "/admin/"
  }
}
```

### FastAPI
```json
{
  "build": { "builder": "NIXPACKS" },
  "deploy": {
    "startCommand": "uvicorn main:app --host 0.0.0.0 --port $PORT",
    "healthcheckPath": "/"
  }
}
```

### Environment variables required

| Variable | Used by | Description |
|----------|---------|-------------|
| `DATABASE_URL` | Django, FastAPI | PostgreSQL connection string |
| `JWT_SECRET_KEY` | Django, FastAPI | Shared JWT signing secret |
| `JWT_ALGORITHM` | Django, FastAPI | JWT algorithm (default: HS256) |
| `DJANGO_SECRET_KEY` | Django | Django's own secret key |
| `CORS_ORIGINS` | Django, FastAPI | Comma-separated allowed origins |
| `ALLOWED_HOSTS` | Django | Django allowed hosts |
| `VITE_DJANGO_API_URL` | Frontend | Django API base URL |
| `VITE_FASTAPI_URL` | Frontend | FastAPI base URL |

---

## 10. Conceptual Future Architecture

*This section describes architecture that does not exist today. It is included to preserve design intent.*

### Real Settlement Layer

```
                    ┌────────────────────────────────┐
                    │   Settlement Worker Service     │
                    │                                 │
                    │  Listens for blockchain events  │
                    │  Advances settlement stages     │
                    │  Credits destinations           │
                    │  Handles reorgs / failures      │
                    └──────────────┬─────────────────┘
                                   │
                    ┌──────────────▼─────────────────┐
                    │   Blockchain Settlement Network  │
                    │                                 │
                    │  Could be:                      │
                    │  - Ethereum L2 (Arbitrum)       │
                    │  - Stellar (payment-optimised)  │
                    │  - Permissioned consortium chain │
                    │                                 │
                    │  Real events:                   │
                    │  - tx broadcast                 │
                    │  - block inclusion              │
                    │  - confirmation threshold       │
                    └─────────────────────────────────┘
```

### Fiat On/Off Ramp Layer

```
User deposits         →  Open Banking pull / Card charge  →  Credit ledger
User withdraws        →  Bank payout via processor        →  Debit ledger
Transfer settles      →  Blockchain finality event        →  Credit destination ledger
```

### Event-Driven Settlement

Replace the current polling + `auto_advance` pattern:

```
Blockchain event (new block, confirmation)
        │
        ▼
Webhook → Settlement Worker
        │
        ▼
Worker queries pending transactions
        │
        ▼
Idempotent stage transition
        │
        ▼
Publish settlement event (Kafka / RabbitMQ)
        │
        ▼
API websocket pushes update to connected frontend
(no polling required)
```

---

*Architecture document reflects codebase state at v0.1.0. Update when architecture changes.*
