# StormCash — Future Roadmap

> This document separates what exists today from what is planned and what remains vision. Every entry is labelled with its current status. Nothing is presented as built unless it is.

---

## How to Read This Document

Each item is tagged with one of three statuses:

- **BUILT** — This exists in the current codebase and works.
- **PLANNED** — This is a clear next step with a defined approach.
- **VISION** — This is a direction, not a plan. No implementation approach is defined.

The roadmap is divided into four phases based on scope and complexity, not timeline. No delivery dates are committed.

---

## Phase 0 — Current Prototype

*What exists today.*

### Authentication & Identity
- **BUILT** — User registration via API (Django `POST /api/auth/register/`)
- **BUILT** — User login with JWT access token + refresh token
- **BUILT** — Automatic account creation (one USD account per user) on registration
- **BUILT** — Token refresh endpoint
- **BUILT** — Session expiry handling in the frontend (auto-redirect to login)
- **BUILT** — Password validation (length, common passwords, similarity to username)

### Transaction Engine
- **BUILT** — Balance query (computed from ledger, never stored directly)
- **BUILT** — Transaction history with direction (credit/debit) per account
- **BUILT** — Deposit (immediate `CREDIT` ledger entry, `COMPLETED` status)
- **BUILT** — Withdrawal (balance check + `DEBIT` ledger entry, `COMPLETED` status)
- **BUILT** — Transfer between accounts (source `DEBIT` immediate, destination `CREDIT` on settlement completion)
- **BUILT** — Concurrent transfer safety via `SELECT FOR UPDATE` row locking
- **BUILT** — Insufficient funds rejection on transfer and withdrawal
- **BUILT** — Account ownership verification on every endpoint (403 on cross-user access)
- **BUILT** — JWT validation on every FastAPI endpoint

### Settlement Simulation
- **BUILT** — 8-stage settlement state machine (`INITIATED` → `DEPOSITED`)
- **BUILT** — Time-based stage advancement (elapsed seconds from `created_at`)
- **BUILT** — Simulated blockchain transaction hash (random 32-byte hex, `0x` prefixed)
- **BUILT** — Simulated block number (base 18,500,000 + random offset)
- **BUILT** — Gas fee calculation (0.1% of amount + base fee)
- **BUILT** — Confirmation count accumulation (max 12)
- **BUILT** — Settlement details endpoint (hash, block, confirmations, gas fee, stages)
- **BUILT** — Auto-advance of pending transactions on balance/history read
- **BUILT** — `processSettlement` endpoint for manual/polled advancement
- **NOTE** — All blockchain data is simulated. No real network connection exists.

### Data Model
- **BUILT** — Double-entry ledger (no stored balance fields)
- **BUILT** — `users` table (Django-managed, shared schema)
- **BUILT** — `accounts` table (12-digit random account number)
- **BUILT** — `transactions` table with blockchain settlement columns
- **BUILT** — `ledger_entries` table (CREDIT/DEBIT, amount, account, transaction)
- **BUILT** — UUID primary keys throughout
- **BUILT** — `reference_id` unique constraint on transactions

### Frontend
- **BUILT** — Dashboard layout (sidebar + top nav + main content)
- **BUILT** — Balance hero card with animated count-up and simulated chart
- **BUILT** — KPI grid (available balance, total deposits, total withdrawals)
- **BUILT** — Account summary strip
- **BUILT** — Quick actions (Transfer, Deposit, Withdraw, History)
- **BUILT** — Recent activity / transaction log with settlement stage badges
- **BUILT** — Ledger insights panel (settlement count, integrity, gas metrics)
- **BUILT** — Transfer modal with live settlement timeline and polling
- **BUILT** — Deposit / withdraw modal with success animation
- **BUILT** — Transaction explorer (blockchain hash, block, confirmations, fee breakdown)
- **BUILT** — Mobile layout with bottom navigation
- **BUILT** — Responsive sidebar (drawer on mobile, persistent on desktop)
- **BUILT** — Starfield sky background with trend-based gradient
- **BUILT** — Skeleton loading states
- **BUILT** — Marketing homepage (fictional — not representative of implemented features)

### Testing
- **BUILT** — FastAPI: balance endpoint test
- **BUILT** — FastAPI: history endpoint test
- **BUILT** — FastAPI: transfer success (correct ledger entries)
- **BUILT** — FastAPI: transfer insufficient funds (400)
- **BUILT** — FastAPI: transfer invalid account (404)
- **BUILT** — FastAPI: transfer no JWT / invalid JWT (401)
- **BUILT** — FastAPI: concurrent transfer race condition (10 runs, 2 threads each)
- **BUILT** — FastAPI: deposit success (correct balance, correct ledger entry count)
- **BUILT** — FastAPI: deposit negative amount (422)
- **BUILT** — FastAPI: deposit zero amount (422)
- **BUILT** — FastAPI: withdrawal success (correct balance)
- **BUILT** — FastAPI: withdrawal insufficient funds (400)
- **BUILT** — FastAPI: withdrawal negative amount (422)
- **BUILT** — FastAPI: cross-user account access rejection (403)
- **BUILT** — FastAPI: concurrent withdrawal race condition (3 runs)
- **BUILT** — Django: registration creates user and tokens
- **BUILT** — Django: duplicate username rejection
- **BUILT** — Django: password mismatch rejection
- **BUILT** — Django: login returns tokens
- **BUILT** — Django: wrong password rejection (401)
- **BUILT** — Django: token refresh
- **BUILT** — Django: invalid token rejection

### Deployment
- **BUILT** — Railway deployment config for Django API (Gunicorn, 4 workers)
- **BUILT** — Railway deployment config for FastAPI (Uvicorn)
- **BUILT** — CORS configured from environment variable
- **BUILT** — `dj-database-url` for Railway PostgreSQL integration
- **BUILT** — Whitenoise for static file serving in production

---

## Phase 1 — Near-Term

*The next logical steps to make the prototype genuinely useful. These are well-defined engineering tasks, not research problems.*

### User Registration in the UI
- **PLANNED** — Enable the registration form in `ObservatoryLogin.jsx` (currently shows "coming soon")
- **PLANNED** — Add a registration page/modal with username, email, password, confirm password fields
- **PLANNED** — Handle registration errors gracefully (duplicate username, weak password)
- **PLANNED** — Redirect to dashboard after successful registration
- *Note: The backend endpoint already exists and works. This is a frontend task only.*

### Cross-User Transfers
- **PLANNED** — Remove the `to_account.user_id == current_user.id` restriction in the transfer endpoint
- **PLANNED** — Add a user/account lookup mechanism (search by username or account number)
- **PLANNED** — Add a transfer confirmation step in the modal showing recipient name and exact receive amount before funds move
- **PLANNED** — Add destination account validation that does not leak account ownership information to unauthorised requesters
- *This is the most critical functional gap in the current prototype.*

### Event-Driven Settlement Advancement
- **PLANNED** — Replace `auto_advance_pending_transactions` (triggered on balance reads) with a background worker
- **PLANNED** — Worker polls pending transactions on a configurable interval
- **PLANNED** — Settlement state transitions emit events (log, webhook, or queue message)
- **PLANNED** — Idempotent settlement processing (safe to call multiple times for the same stage)

### Transfer Limits and Basic Validation
- **PLANNED** — Maximum single transfer amount
- **PLANNED** — Minimum transfer amount
- **PLANNED** — Daily transfer limit per account
- **PLANNED** — These limits configurable per environment

### Improved Error Handling
- **PLANNED** — Structured error responses across both APIs (consistent error schema)
- **PLANNED** — Frontend error boundary components
- **PLANNED** — Network failure handling in the settlement polling loop

---

## Phase 2 — Mid-Term

*Significant features that require real integrations or substantial new engineering. These are viable engineering efforts but represent meaningful investment.*

### Real Blockchain Settlement Layer
- **VISION** — Replace `MockBlockchainService` with a client connecting to a real network
- **VISION** — Candidates: Ethereum L2 (Arbitrum/Optimism), Stellar (designed for payments), a permissioned chain
- **VISION** — Settlement stage transitions triggered by real blockchain events (block inclusion, confirmation count)
- **VISION** — Real transaction hashes verifiable on a public block explorer
- **VISION** — Gas fee based on actual network conditions, shown to user at transfer initiation
- *This requires selecting a specific network, implementing a node connection or using a provider (Infura, Alchemy), and handling network failures and reorgs.*

### Foreign Exchange Integration
- **VISION** — FX rate feed integration (ECB, OpenExchangeRates, or market-making partner)
- **VISION** — Rate lock at transfer initiation: sender sees exact recipient amount in destination currency
- **VISION** — Rate expiry: locked rate valid for a defined window (e.g., 30 seconds to confirm)
- **VISION** — FX conversion executed at `CONVERTING_TO_FIAT` stage
- **VISION** — Multi-currency account support (user holds multiple currency balances)

### Fiat On-Ramps (Deposits)
- **VISION** — Real deposit mechanism to replace simulated `POST /deposit`
- **VISION** — Open Banking (UK/EU) for bank-to-bank deposit pull
- **VISION** — Card top-up via payment processor (Stripe, Adyen)
- **VISION** — Deposit webhooks to credit account when payment processor confirms receipt
- *This is a regulatory boundary. Processing real deposits requires a payment institution licence or a regulated partner.*

### Fiat Off-Ramps (Withdrawals)
- **VISION** — Real withdrawal mechanism to replace simulated `POST /withdraw`
- **VISION** — Bank account payout via payment processor
- **VISION** — Withdrawal processing time transparency (same-day vs. next-day depending on rail)

### Multiple Accounts Per User
- **VISION** — Create additional accounts (spending, savings, FX)
- **VISION** — Account-level currency (USD, EUR, GBP accounts distinct)
- **VISION** — Transfer between own accounts (already partially works — the ownership check is the same user)

---

## Phase 3 — Long-Term

*The full vision. This requires regulatory licensing, institutional partnerships, and significant capital. These are directional goals, not plans.*

### Regulated Payment Institution
- **VISION** — Obtain appropriate payment institution licence (PI/EMI in UK/EU, MTL in US states)
- **VISION** — AML/KYC integration (identity verification at onboarding)
- **VISION** — Transaction monitoring and fraud detection
- **VISION** — Regulatory reporting infrastructure
- *This is the dominant constraint on productisation. It is not an engineering problem.*

### Settlement Network Effects
- **VISION** — Agreements with partner institutions to accept StormChain settlement as final
- **VISION** — Liquidity provision on the settlement network
- **VISION** — Settlement finality guarantees backed by legal agreements, not just technical design

### Cross-Border Payments
- **VISION** — International transfers with real FX conversion and transparent fees
- **VISION** — Competitive with or better than Wise/SWIFT for the corridors targeted
- **VISION** — Sub-minute settlement for cross-border transfers

### Business Accounts
- **VISION** — Multi-user accounts with permissions (view-only, approve, admin)
- **VISION** — Batch payments (pay multiple recipients from a single authorisation)
- **VISION** — API access for business customers (programmatic transfers)

### Developer Platform
- **VISION** — Public API for building on top of StormCash infrastructure
- **VISION** — Webhooks for settlement events
- **VISION** — SDK libraries

---

## What Will Not Be Built (Scope Boundaries)

The following are explicitly out of scope regardless of phase, to maintain focus on the core settlement-finality problem:

- Cryptocurrency trading or speculation products
- Investment products (stocks, funds, robo-advisors)
- Credit or lending products
- Rewards/cashback programs
- Cryptocurrency wallets or custody

These are adjacent financial products that dilute the core value proposition. StormCash is about moving money reliably. It is not a financial super-app.

---

*Roadmap last updated: 2026 (v0.1.0 prototype). Update this document when any item status changes.*
