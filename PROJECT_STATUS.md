# StormCash — Project Status

> **Purpose of this document:** A clear-eyed, honest accounting of what the StormCash prototype actually does today versus what is planned or conceptual. No exaggeration. No hedged language that obscures gaps.
>
> **Version:** v0.1.0  
> **Date:** 2026

---

## How to Read This Document

Every feature is assigned one of three states:

**✅ IMPLEMENTED** — Works in the current codebase. You can run it, test it, and verify it.

**⚠️ PARTIAL** — Infrastructure or scaffolding exists, but the feature is incomplete, simulated, or not exposed in the normal user flow.

**❌ NOT BUILT** — Does not exist. May exist in the vision documents but has no code.

---

## Authentication & Identity

| Feature | Status | Notes |
|---------|--------|-------|
| User registration via API | ✅ IMPLEMENTED | `POST /api/auth/register/` — fully functional |
| User registration via UI | ⚠️ PARTIAL | Endpoint works; UI form is disabled with "coming soon" label. Users must register via API directly. |
| User login | ✅ IMPLEMENTED | `POST /api/auth/login/` — returns JWT access + refresh tokens |
| JWT access token issuance | ✅ IMPLEMENTED | 60-minute lifetime |
| JWT refresh token issuance | ✅ IMPLEMENTED | 7-day lifetime |
| Token refresh endpoint | ✅ IMPLEMENTED | `POST /api/auth/token/refresh/` |
| Frontend token management | ✅ IMPLEMENTED | Stored in `localStorage`, auto-refresh on 401, redirect on expiry |
| Session expiry handling | ✅ IMPLEMENTED | `auth:expired` custom event, clears state and redirects to login |
| Password validation | ✅ IMPLEMENTED | Django validators: length, common passwords, user attribute similarity |
| User profile management | ❌ NOT BUILT | No endpoint to update email, username, or password after registration |
| Password reset / forgot password | ❌ NOT BUILT | No mechanism exists |
| Multi-factor authentication | ❌ NOT BUILT | — |
| Email verification | ❌ NOT BUILT | Registration succeeds without verifying email |

---

## Accounts

| Feature | Status | Notes |
|---------|--------|-------|
| Automatic account creation on registration | ✅ IMPLEMENTED | One USD account per user, 12-digit random account number |
| Account number uniqueness | ✅ IMPLEMENTED | Enforced by DB unique constraint + 10-retry generation loop |
| Multiple accounts per user | ❌ NOT BUILT | Schema supports it (no unique constraint on user→account), but no API to create additional accounts |
| Multi-currency accounts | ❌ NOT BUILT | `demo_currency_code` field exists but is always "USD". No FX logic. |
| Account deactivation | ❌ NOT BUILT | `is_active` field exists; no endpoint to deactivate |
| Account details / metadata editing | ❌ NOT BUILT | — |

---

## Balance

| Feature | Status | Notes |
|---------|--------|-------|
| Balance query | ✅ IMPLEMENTED | `GET /api/balance/:account_number` — computed from ledger entries |
| Double-entry ledger (no stored balance) | ✅ IMPLEMENTED | Balance = Σ(CREDIT entries) − Σ(DEBIT entries). No `balance` column exists. |
| Account ownership verification on balance query | ✅ IMPLEMENTED | 403 if account belongs to a different user |
| Balance display with count-up animation | ✅ IMPLEMENTED | Frontend animates from previous value to new value on data refresh |
| Balance hide/reveal toggle | ✅ IMPLEMENTED | Eye icon in BalanceHero |

---

## Deposits

| Feature | Status | Notes |
|---------|--------|-------|
| Deposit via API | ✅ IMPLEMENTED | `POST /api/accounts/:account_number/deposit` — immediate CREDIT ledger entry |
| Deposit via UI modal | ✅ IMPLEMENTED | DepositWithdrawModal handles deposit flow with success animation |
| Deposit validation (positive amount only) | ✅ IMPLEMENTED | Pydantic rejects negative and zero amounts (422) |
| Account ownership verification | ✅ IMPLEMENTED | 403 if account belongs to different user |
| Deposit status | ✅ IMPLEMENTED | Always `COMPLETED` immediately — no processing delay |
| Real money movement (bank rails) | ❌ NOT BUILT | Deposits are simulated. No real funds are moved. No payment processor integration. |

---

## Withdrawals

| Feature | Status | Notes |
|---------|--------|-------|
| Withdrawal via API | ✅ IMPLEMENTED | `POST /api/accounts/:account_number/withdraw` — balance check + DEBIT ledger entry |
| Withdrawal via UI modal | ✅ IMPLEMENTED | DepositWithdrawModal handles withdrawal flow |
| Insufficient funds check | ✅ IMPLEMENTED | 400 error if requested amount exceeds current balance |
| Withdrawal validation (positive amount only) | ✅ IMPLEMENTED | Pydantic rejects negative and zero amounts (422) |
| Account ownership verification | ✅ IMPLEMENTED | 403 if account belongs to different user |
| Concurrent withdrawal race condition protection | ✅ IMPLEMENTED | `SELECT FOR UPDATE` prevents two simultaneous withdrawals from overdrafting |
| Withdrawal status | ✅ IMPLEMENTED | Always `COMPLETED` immediately |
| Real money movement (bank payout) | ❌ NOT BUILT | Withdrawals are simulated. No real bank payout. |

---

## Transfers

| Feature | Status | Notes |
|---------|--------|-------|
| Transfer initiation via API | ✅ IMPLEMENTED | `POST /api/transfer` — debits source immediately, credits destination on settlement |
| Transfer via UI modal | ✅ IMPLEMENTED | TransferModal with amount input, validation, error display |
| Concurrent transfer race condition protection | ✅ IMPLEMENTED | `SELECT FOR UPDATE` on both accounts; tested with 10 concurrent runs |
| Insufficient funds check | ✅ IMPLEMENTED | 400 if source balance < transfer amount |
| Source account ownership verification | ✅ IMPLEMENTED | 403 if source account belongs to different user |
| Destination account ownership verification | ✅ IMPLEMENTED | **Both accounts must belong to the same authenticated user.** See note below. |
| Cross-user transfers (peer-to-peer) | ❌ NOT BUILT | The `to_account.user_id != current_user.id` check raises a 403. Peer-to-peer transfers do not work. |
| Transfer to self (between own accounts) | ✅ IMPLEMENTED | Works if the user has two accounts (requires API account creation) |
| Transaction reference ID | ✅ IMPLEMENTED | `secrets.token_urlsafe(16)` — unique per transfer |

> **Critical note on transfers:** The current implementation verifies that the destination account belongs to the authenticated user. This was a conservative default during prototyping. It means StormCash cannot currently perform genuine person-to-person transfers. This is the most significant functional gap between the prototype and the stated vision.

---

## Blockchain Settlement (Simulation)

| Feature | Status | Notes |
|---------|--------|-------|
| Settlement state machine (8 stages) | ✅ IMPLEMENTED | INITIATED → DEPOSITED progression is fully implemented |
| Settlement stage stored in database | ✅ IMPLEMENTED | `settlement_stage` column on `transactions` table |
| Simulated transaction hash | ✅ IMPLEMENTED | `"0x" + 32 random bytes as hex` — looks real, is not real |
| Simulated block number | ✅ IMPLEMENTED | Base 18,500,000 + random offset — looks real, is not real |
| Simulated gas fee | ✅ IMPLEMENTED | 0.1% of transfer amount + 0.000001 base fee |
| Simulated confirmation count | ✅ IMPLEMENTED | Accumulates to max 12 based on elapsed time |
| Confirmation count display | ✅ IMPLEMENTED | ConfirmationProgress component in TransactionExplorer |
| Time-based stage progression | ✅ IMPLEMENTED | Stages advance based on `datetime.utcnow()` vs `transaction.created_at` offsets |
| Auto-advancement on balance/history reads | ✅ IMPLEMENTED | `auto_advance_pending_transactions` called on every balance/history fetch |
| Manual settlement process endpoint | ✅ IMPLEMENTED | `POST /api/settlement/process/:id` — advances one stage and returns updated state |
| Settlement details endpoint | ✅ IMPLEMENTED | `GET /api/settlement/:id` — returns full blockchain detail dict |
| Frontend settlement polling (1s interval) | ✅ IMPLEMENTED | TransferModal polls until `DEPOSITED` or `FAILED` |
| Live settlement timeline UI | ✅ IMPLEMENTED | SettlementTimeline component shows each stage with current status |
| Settlement completion: destination credit | ✅ IMPLEMENTED | On `DEPOSITED`, a CREDIT ledger entry is created for the destination account |
| Real blockchain network connection | ❌ NOT BUILT | No network calls. MockBlockchainService is a pure simulation. |
| Real transaction hash (verifiable on explorer) | ❌ NOT BUILT | Hashes are random bytes, not real transactions |
| Real gas fees | ❌ NOT BUILT | Fee is a fixed formula, not actual network gas |
| Settlement failure handling | ⚠️ PARTIAL | `FAILED` stage exists in the enum and is checked in the frontend. No code path currently causes failure in the simulation. |

---

## Transaction History

| Feature | Status | Notes |
|---------|--------|-------|
| Transaction history via API | ✅ IMPLEMENTED | `GET /api/history/:account_number` — returns all transactions with amounts and directions |
| Transaction direction (credit/debit) | ✅ IMPLEMENTED | Computed from ledger entry type for the queried account |
| History ordered by date | ✅ IMPLEMENTED | `ORDER BY created_at DESC` |
| History display in dashboard | ✅ IMPLEMENTED | StormLog component with timeline layout |
| Settlement stage badge on pending transactions | ✅ IMPLEMENTED | Animated badge shown for non-DEPOSITED stages |
| Transaction explorer (drill-down) | ✅ IMPLEMENTED | Click any transaction to see full blockchain detail, fees, confirmation progress |
| Pagination / infinite scroll | ❌ NOT BUILT | All transactions returned in a single query. Could be slow with large history. |
| Transaction search / filter | ❌ NOT BUILT | — |
| Transaction export (CSV, PDF) | ❌ NOT BUILT | — |

---

## Dashboard UI

| Feature | Status | Notes |
|---------|--------|-------|
| Desktop dashboard layout | ✅ IMPLEMENTED | Sidebar + top nav + main content area |
| Mobile layout with bottom navigation | ✅ IMPLEMENTED | Responsive, with 5-item bottom nav |
| Balance hero card | ✅ IMPLEMENTED | Animated count-up, trend badge, hide/reveal, simulated chart |
| KPI grid (3 metric cards) | ✅ IMPLEMENTED | Available balance, total deposits, total withdrawals |
| Account summary strip | ✅ IMPLEMENTED | Masked account number, balance, view details button |
| Quick actions (Transfer, Deposit, Withdraw, History) | ✅ IMPLEMENTED | All four functional |
| Recent activity / transaction log | ✅ IMPLEMENTED | StormLog with timeline layout |
| Ledger insights panel | ✅ IMPLEMENTED | Settlement count, integrity status, gas metrics |
| Skeleton loading states | ✅ IMPLEMENTED | TransactionSkeleton shown during initial data fetch |
| Silent background refresh (Sync button) | ✅ IMPLEMENTED | Refreshes data without showing skeleton |
| Starfield sky background | ✅ IMPLEMENTED | Animated, trend-reactive gradient |
| Marketing homepage | ⚠️ PARTIAL | Visually complete but contains entirely fictional statistics, pricing, and products. Not representative of implemented features. |
| Analytics page | ❌ NOT BUILT | Navigation item exists in sidebar; no page implemented |
| Settings page | ❌ NOT BUILT | Navigation item exists; clicking shows `alert("coming soon")` |

---

## Testing

| Test area | Status | Coverage |
|-----------|--------|---------|
| FastAPI: balance endpoint | ✅ IMPLEMENTED | Correct balance returned |
| FastAPI: history endpoint | ✅ IMPLEMENTED | Transactions returned |
| FastAPI: transfer success | ✅ IMPLEMENTED | Correct ledger entries, correct balances |
| FastAPI: transfer insufficient funds | ✅ IMPLEMENTED | 400 response |
| FastAPI: transfer invalid destination account | ✅ IMPLEMENTED | 404 response |
| FastAPI: transfer missing JWT | ✅ IMPLEMENTED | 401 response |
| FastAPI: transfer invalid JWT | ✅ IMPLEMENTED | 401 response |
| FastAPI: concurrent transfer race condition | ✅ IMPLEMENTED | 10 runs × 2 threads — exactly 1 success, 1 failure per run |
| FastAPI: deposit success | ✅ IMPLEMENTED | Balance and ledger entry count correct |
| FastAPI: deposit negative amount | ✅ IMPLEMENTED | 422 validation error |
| FastAPI: deposit zero amount | ✅ IMPLEMENTED | 422 validation error |
| FastAPI: withdrawal success | ✅ IMPLEMENTED | Balance correct |
| FastAPI: withdrawal insufficient funds | ✅ IMPLEMENTED | 400 response, balance unchanged |
| FastAPI: withdrawal negative amount | ✅ IMPLEMENTED | 422 validation error |
| FastAPI: cross-user account access | ✅ IMPLEMENTED | 403 response |
| FastAPI: concurrent withdrawal race condition | ✅ IMPLEMENTED | 3 runs × 2 threads — exactly 1 success, 1 failure per run |
| Django: user registration | ✅ IMPLEMENTED | 201, tokens returned, user exists in DB |
| Django: duplicate username | ✅ IMPLEMENTED | 400 with username error |
| Django: password mismatch | ✅ IMPLEMENTED | 400 |
| Django: login | ✅ IMPLEMENTED | 200, tokens returned |
| Django: wrong password | ✅ IMPLEMENTED | 401 |
| Django: token refresh | ✅ IMPLEMENTED | 200, new access token returned |
| Django: invalid refresh token | ✅ IMPLEMENTED | 401 |
| Frontend integration tests | ❌ NOT BUILT | No frontend test suite exists |
| End-to-end tests | ❌ NOT BUILT | — |
| Settlement engine unit tests | ❌ NOT BUILT | MockBlockchainService has no dedicated unit tests |
| Load / performance tests | ❌ NOT BUILT | — |

---

## Infrastructure & Operations

| Feature | Status | Notes |
|---------|--------|-------|
| Railway deployment (Django) | ✅ IMPLEMENTED | Gunicorn, Nixpacks, healthcheck at /admin/ |
| Railway deployment (FastAPI) | ✅ IMPLEMENTED | Uvicorn, Nixpacks, healthcheck at / |
| PostgreSQL on Railway | ✅ IMPLEMENTED | `dj-database-url` for Django, `DATABASE_URL` env var for FastAPI |
| CORS configuration from environment | ✅ IMPLEMENTED | `CORS_ORIGINS` env var, comma-separated |
| Static file serving (Django) | ✅ IMPLEMENTED | Whitenoise |
| Environment variable configuration | ✅ IMPLEMENTED | `.env.example` documents all required variables |
| Monitoring / alerting | ❌ NOT BUILT | No observability tooling beyond Railway's built-in logs |
| Database backups | ❌ NOT BUILT | Depends entirely on Railway's managed PostgreSQL backup policy |
| Rate limiting | ❌ NOT BUILT | No request rate limiting on any endpoint |
| Logging | ⚠️ PARTIAL | Railway captures stdout; no structured application logging |
| Horizontal scaling | ⚠️ PARTIAL | Gunicorn runs 4 workers. FastAPI is single-process. No load balancer configuration. |
| CI/CD pipeline | ❌ NOT BUILT | No automated test runner or deployment pipeline |

---

## Summary Table

| Category | Implemented | Partial | Not Built |
|----------|-------------|---------|-----------|
| Authentication | 7 | 1 | 4 |
| Accounts | 3 | 0 | 4 |
| Balance | 4 | 0 | 0 |
| Deposits | 5 | 0 | 1 |
| Withdrawals | 6 | 0 | 1 |
| Transfers | 6 | 0 | 2 |
| Settlement simulation | 14 | 1 | 4 |
| Transaction history | 5 | 0 | 3 |
| Dashboard UI | 13 | 1 | 3 |
| Testing | 17 | 0 | 5 |
| Infrastructure | 7 | 2 | 4 |

---

## The Three Things That Matter Most to Fix Next

1. **Enable cross-user transfers.** The `to_account.user_id == current_user.id` check prevents peer-to-peer transfers entirely. This is the most critical gap between the prototype and the stated vision.

2. **Enable user registration in the UI.** The backend is complete. This is a frontend change only. Without it, the prototype cannot be demonstrated to a new user without manual API setup.

3. **Replace polling-based settlement advancement with a background worker.** The current pattern (advance on balance read, poll every second) works at prototype scale but would cause problems under any real load.

---

*Document reflects codebase state at v0.1.0. Update each entry as the status changes.*
