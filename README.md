# StormCash

> **Prototype** — This is a concept demonstrator and portfolio project. It does not move real money and is not a regulated financial service.

A financial technology prototype exploring what payment infrastructure would look like if **settlement finality** were the primary design constraint — not speed, not features, but the guarantee that a transfer either completes fully or never starts.

---

## The Problem

Modern bank transfers were built around 1970s batch processing infrastructure. The result is a gap that affects every person who has ever sent money internationally:

- Money leaves the sender's account before it arrives at the destination
- Users have no visibility into where their money is during transit
- International transfers take 3–5 business days through chains of correspondent banks
- A failed transfer can leave funds in an indeterminate state for days

StormCash prototypes an architecture that treats this as a solvable problem: atomic transfers, observable settlement stages, and an experience that approaches the simplicity of sending a message.

---

## Screenshots

> *Screenshots pending deployment. Dashboard includes balance overview, transaction history with live settlement timeline, and a transaction explorer showing blockchain settlement details.*

---

## What Is Actually Built

| Feature | Status |
|---------|--------|
| User authentication (JWT) | ✅ Working |
| Account creation (auto on register) | ✅ Working |
| Deposit funds | ✅ Working |
| Withdraw funds (with balance check) | ✅ Working |
| Account-to-account transfer | ✅ Working (cross-user) |
| Concurrent transfer safety (`SELECT FOR UPDATE`) | ✅ Working |
| Double-entry ledger (no stored balance field) | ✅ Working |
| Blockchain settlement simulation — 8 stages | ✅ Working (simulated, not a real chain) |
| Real-time settlement UI (1s polling) | ✅ Working |
| Transaction explorer (hash, block, confirmations) | ✅ Working (simulated data) |
| Responsive dashboard — desktop and mobile | ✅ Working |
| JWT token refresh and session expiry | ✅ Working |
| User registration via UI | ✅ Working |
| Cross-user peer-to-peer transfers | ✅ Working |
| Real blockchain connectivity | ❌ Not implemented |
| Real fiat on/off ramps | ❌ Not implemented |
| Multi-currency | ❌ Not implemented |

> **Transfer note:** Transfers work between any two StormCash accounts. The sender's account must belong to the authenticated user. The destination can be any valid account number. Share your account number from the dashboard to receive transfers.

---

## Architecture

```
┌─────────────────────────────────────────┐
│         React Frontend (Vite)           │
│  Dashboard · Modals · Settlement UI     │
└──────────────┬──────────────────────────┘
               │  JWT (Bearer)
    ┌──────────┴──────────────┐
    │                         │
┌───▼──────────┐   ┌──────────▼──────────┐
│  Django API  │   │      FastAPI         │
│  (port 8000) │   │   (port 8001)        │
│              │   │                      │
│  Auth only   │   │  Transactions        │
│  register    │   │  balance · history   │
│  login       │   │  deposit · withdraw  │
│  refresh     │   │  transfer            │
│              │   │  settlement engine   │
└───┬──────────┘   └──────────┬──────────┘
    └──────────────┬───────────┘
                   │
          ┌────────▼────────┐
          │   PostgreSQL     │
          │                 │
          │  users          │
          │  accounts       │
          │  transactions   │
          │  ledger_entries │
          └─────────────────┘
```

Django handles identity. FastAPI handles money. Both services share one PostgreSQL database and the same JWT secret — tokens issued by Django are validated by FastAPI on every request.

Balances are never stored. They are always computed from the sum of ledger entries. This mirrors how real bank ledgers work.

---

## Tech Stack

**Backend**
- Django 5.2 + Django REST Framework + SimpleJWT
- FastAPI + SQLAlchemy + Pydantic
- PostgreSQL

**Frontend**
- React 18 + Vite
- Tailwind CSS + Framer Motion
- Lucide React

**Infrastructure**
- Railway (backend deployment)
- Vercel (frontend deployment)
- Docker Compose (local PostgreSQL)

---

## Local Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+ (or Docker)

### 1. Database

Using Docker (recommended):

```bash
docker-compose up -d
```

Or manually:

```sql
CREATE USER stormcash WITH PASSWORD 'your_password';
CREATE DATABASE stormcash OWNER stormcash;
CREATE DATABASE stormcash_test OWNER stormcash;
```

### 2. Environment files

```bash
cp .env.example .env
# edit .env with your values

cp apps/web/.env.example apps/web/.env
# set VITE_DJANGO_API_URL and VITE_FASTAPI_URL
```

### 3. Django API

```bash
cd apps/django-api
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS / Linux
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000
```

### 4. FastAPI

```bash
cd apps/fastapi
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m migrations.add_blockchain_fields   # run once to add blockchain columns
uvicorn main:app --port 8001 --reload
```

### 5. Frontend

```bash
cd apps/web
npm install
npm run dev
# → http://localhost:3000
```

### 6. Create a user

Registration is not exposed in the UI. Create one via the API:

```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "email": "alice@example.com",
    "password": "SecurePass123",
    "password_confirm": "SecurePass123"
  }'
```

Then log in at `http://localhost:3000/login`.

---

## Running Tests

**FastAPI**

```bash
cd apps/fastapi
pytest tests/ -v
```

Covers: balance, history, transfer success, insufficient funds, invalid account, JWT rejection, concurrent race conditions (10 runs × 2 threads), deposits, withdrawals, cross-user 403 rejection.

**Django**

```bash
cd apps/django-api
pytest ledger/tests/ -v
```

Covers: registration, duplicate username, password mismatch, login, wrong password, token refresh, invalid token.

---

## Roadmap

| Phase | Focus | Status |
|-------|-------|--------|
| Prototype (now) | Architecture, settlement simulation, polished UI, cross-user transfers | ✅ Complete |
| Near-term | Cross-user transfers, UI registration, background settlement worker | Not started |
| Mid-term | Real blockchain settlement, FX integration, fiat on/off ramps | Not started |
| Long-term | Regulated payment institution, multi-currency, cross-border network | Vision only |

See `FUTURE_ROADMAP.md` for the full breakdown with BUILT / PLANNED / VISION labels on every item.

---

## Documentation

| Document | Purpose |
|----------|---------|
| `MASTER_VISION.md` | Full project vision — problem, principles, architecture intent |
| `ARCHITECTURE_OVERVIEW.md` | Technical architecture with diagrams and data flow |
| `PROJECT_STATUS.md` | Honest feature-by-feature status: implemented, partial, not built |
| `FUTURE_ROADMAP.md` | Phased roadmap with clear status labels |
| `CASE_STUDY.md` | Design and engineering decisions, trade-offs, lessons |
| `INVESTOR_OVERVIEW.md` | Market context, problem framing, what productisation requires |

---

## Current Status

StormCash is an **early-stage prototype** built for architectural exploration and portfolio demonstration.

- **Stage:** Prototype — v0.1.0
- **Purpose:** Educational and architectural — demonstrates settlement-finality-first payment design
- **Not a production financial service** — does not hold, transmit, or manage real money
- **Not connected to real banking rails** — deposits, withdrawals, and transfers are simulated
- **Blockchain settlement is simulated** — StormChain is a mock network with no real-world connectivity
- **Registration is API-only** — the UI login page exists; account creation requires a direct API call
- **Transfers are same-user only** — cross-user peer-to-peer transfers are not yet implemented

The engineering decisions are real: the double-entry ledger, the row-level concurrency locks, the JWT architecture, the settlement state machine. The money movement is not.

---

## Vision

The long-term direction StormCash is exploring:

**Instant settlement finality.** A transfer either completes fully or it does not begin. No intermediate state where money has left one account without arriving at another. Enforced at the data layer, not the interface layer.

**Transparent settlement states.** Every stage of a transfer is observable by the user in real time — not a spinner, not "processing", but a named, timestamped state that corresponds to something real happening on a settlement network.

**StormChain.** A conceptual settlement layer where fiat value is converted to a settlement token, transmitted across a network with finality guarantees, and converted back to the destination currency. Users see fiat at both ends. The settlement layer is infrastructure, not user experience.

**Cross-currency transfers.** A sender in one currency pays a recipient in another. The exchange rate is locked at transfer initiation. The recipient knows exactly what they will receive before the sender confirms. No hidden conversion fees discovered after the fact.

**Sending money should feel like sending a message.** No sort codes, no IBAN lookups, no 3-day wait with no feedback. The friction of international money movement should approach zero.

None of this requires the user to understand blockchain. The complexity is in the infrastructure. The experience is in the simplicity.

---

## Disclaimer

StormCash is a prototype and portfolio project. It is not a bank, a payment institution, or a regulated financial service. It does not hold, transmit, or manage real money. The blockchain settlement layer is a simulation — no real blockchain network is involved. All transaction data is fictional.

---

## License

Private. All rights reserved.
