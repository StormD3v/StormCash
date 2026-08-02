# StormCash — Case Study

> A portfolio case study covering the design, architecture, and engineering decisions behind the StormCash prototype.

---

## Overview

**Project type:** Personal prototype / concept demonstrator  
**Duration:** Early-stage development  
**Stack:** Django · FastAPI · PostgreSQL · React · Tailwind CSS  
**Status:** Working prototype (v0.1.0)

---

## 1. Why This Project Was Built

The initial question was simple: when I send money to someone and it disappears for three days, where exactly is it?

That question turns out not to have a satisfying answer in the current banking system. The money is "in transit" — a phrase that functions as a black box, telling the user nothing about what is actually happening, what the expected completion time is, or what to do if it doesn't arrive.

I wanted to build a system where that question had a precise, observable, machine-readable answer at every moment. Not as a finished product — but as a working prototype demonstrating that the architecture is viable and the user experience is achievable.

The secondary goal was to explore whether a blockchain settlement layer adds genuine value to this problem, or whether it is just technological complexity grafted onto a problem that could be solved with a well-designed relational database and a robust state machine.

Spoiler: the database and state machine do most of the work. The blockchain layer is the interesting part only when you need settlement finality *across institutions that don't share a database*. Within a single database, a properly designed ledger already provides the guarantees you want.

---

## 2. Design Decisions

### 2.1 Two Backend Services Instead of One

The architecture separates authentication (Django) from transaction processing (FastAPI). This was a deliberate choice with specific reasoning:

**Django** is the right tool for authentication. It has a mature, well-tested user model, a robust password validation system, Django REST Framework for the API layer, and SimpleJWT for token management. Building authentication from scratch would have been slower and less secure.

**FastAPI** is the right tool for the transaction engine. Its async-capable design, Pydantic data validation, and SQLAlchemy integration make it well-suited for the high-throughput, latency-sensitive operations of a financial transaction API. Its automatic OpenAPI documentation is useful for prototyping.

The cost is complexity: two services to run, two deployments to manage, shared database schema. The benefit is clean separation of concerns — the identity system and the money system can evolve independently.

**What I would do differently:** For a prototype, a single Django service would have been faster to build and easier to run locally. The two-service split makes more sense at production scale or when the transaction service needs different scaling characteristics than the auth service.

### 2.2 Double-Entry Ledger

The financial data model uses a double-entry ledger: balances are computed by summing credit and debit entries, never stored as a raw number.

```
Account balance = Σ(CREDIT entries) − Σ(DEBIT entries)
```

This decision has significant consequences:

- A deposit creates a `CREDIT` ledger entry. It cannot corrupt a balance field.
- A withdrawal creates a `DEBIT` ledger entry, only after a balance check.
- A transfer creates a `DEBIT` on the source immediately and a `CREDIT` on the destination when settlement completes.
- The entire financial history of an account is recoverable from the ledger at any point in time.
- Rollback means adding a reversal entry — not deleting data.

This is how real banks work. It adds complexity at read time (balance requires a sum query rather than a field read) but provides correctness guarantees that a single balance field cannot.

### 2.3 Row-Level Locking for Concurrent Safety

The transfer endpoint uses PostgreSQL's `SELECT FOR UPDATE` to lock both accounts before checking balances or writing entries:

```python
from_account = db.execute(
    select(Account).where(...).with_for_update()
).scalar_one_or_none()
```

This prevents a classic race condition: two concurrent requests both see a sufficient balance, both debit the account, and the account ends with a negative balance. With the lock, the second transaction blocks until the first completes, then re-reads the (now reduced) balance and correctly rejects the overdraft.

The test suite validates this with 10 concurrent runs of two simultaneous 600-unit transfers against a 1000-unit balance. In every run, exactly one transfer succeeds and one fails with "Insufficient funds."

This was not an afterthought. It was designed in from the beginning because financial correctness under concurrency is not optional.

### 2.4 The Settlement State Machine

The blockchain settlement simulation was the most architecturally interesting part of the project. The design goal was to model exactly what *would* happen on a real blockchain settlement layer, so that the data model and API are production-ready even though the underlying network is simulated.

The eight stages map to real blockchain concepts:

| Stage | Real meaning |
|-------|-------------|
| `INITIATED` | Transfer accepted, fiat value locked |
| `CONVERTING_TO_TOKEN` | Fiat converted to settlement token representation |
| `MINTING_TOKEN` | Token minted / escrow contract invoked |
| `BROADCASTING` | Transaction submitted to network mempool |
| `WAITING_CONFIRMATION` | Included in a block, awaiting sufficient confirmations |
| `CONFIRMED` | Confirmation threshold reached, transfer is final |
| `CONVERTING_TO_FIAT` | Settlement token converted back to destination fiat |
| `DEPOSITED` | Destination account credited — settlement complete |

Each transition is stored as a string in the `settlement_stage` column of the `transactions` table. The current stage is computed by comparing `datetime.utcnow()` against timestamps derived from `transaction.created_at`. In a real implementation, each transition would be triggered by an actual blockchain event (new block, confirmation threshold crossed).

The `TransferModal` in the frontend polls the `processSettlement` endpoint every second while a transfer is pending, updating a visual timeline in real time. This gives the user a live view of settlement progress — exactly the "zero ambiguity state" that was the design goal.

### 2.5 Gas Fee Model

The prototype charges a gas fee of 0.1% of the transfer amount plus a small base fee (`0.000001` tokens). This is deducted when the settlement token is converted back to fiat at the `CONVERTING_TO_FIAT` stage. The recipient receives `amount - gas_fee`.

This was a deliberate design choice: the fee is computed deterministically, shown to the user before they confirm, and deducted consistently. There are no hidden charges.

### 2.6 Frontend Architecture

The React dashboard was built to match the quality level of premium financial products (Linear, Stripe, Vercel). Specific decisions:

**Fraunces for display typography.** The serif display font creates a sense of gravitas appropriate for financial data. Combined with Inter for body copy and JetBrains Mono for numerical data and hashes, the type hierarchy communicates information weight clearly.

**Double-entry visual metaphor in the activity log.** Credits and debits use distinct semantic colours (`#7dc9a0` for credit, `#c08090` for debit) tied to named design tokens. These colours communicate meaning — they are not aesthetic choices.

**Sky component as ambient background.** The animated starfield changes gradient based on account trend state (rising/falling/stable). This is subtle contextual feedback that doesn't interrupt the user but provides a sense that the interface is alive and connected to real data.

**Settlement timeline as primary UI.** Rather than hiding the blockchain settlement behind a generic loading spinner, the `SettlementTimeline` component shows each stage with its current state in real time. Users who want to understand what "processing" means can read the timeline. Users who just want confirmation can wait for the completion screen.

---

## 3. Challenges

### 3.1 Shared Schema Between Two Services

Django's ORM generates migrations. FastAPI uses SQLAlchemy models. Both interact with the same PostgreSQL database. Keeping the schema synchronised between them was a friction point — a schema change in FastAPI's models required a corresponding manual migration script, while Django generated its own migrations automatically.

The pragmatic solution was to let Django own schema migrations and run a separate manual migration script (`add_blockchain_fields.py`) to add the FastAPI-specific blockchain columns that Django's models don't know about.

This works but it's fragile. A production system would need a single migration source of truth.

### 3.2 The Transfer Ownership Problem

The transfer endpoint currently verifies that both the source and destination accounts belong to the authenticated user. This was a safe default during prototyping — it prevents any cross-user fund movement without a more complete user directory and confirmation flow.

But it means the system cannot perform genuine peer-to-peer transfers. This is the single largest functional gap between the prototype and the vision. Fixing it requires building a user resolution system (find a user by username/email) and removing the destination account ownership check, along with appropriate confirmation UI.

### 3.3 Polling vs. Events

The settlement advancement mechanism has two parts. The `TransferModal` polls the `processSettlement` endpoint every second. Separately, `auto_advance_pending_transactions` is called on every balance and history read, which advances any pending transfers automatically.

This polling approach works at prototype scale. It would not work at production scale: polling every second per active transfer creates unnecessary database load, and triggering settlement advancement on balance reads means settlement doesn't advance if nobody reads their balance.

A real implementation would replace this with a dedicated settlement worker that listens for real blockchain events and advances settlement state atomically when each event occurs.

### 3.4 Registration UX

The registration endpoint exists in Django and is fully functional via the API. But the production UI has registration disabled with a "coming soon" label. This was a deliberate choice to control who could create accounts on any deployed instance during the prototype phase.

It creates an awkward user experience: the login page implies accounts exist, but there's no way to create one from the UI. New users must be created via the API directly.

---

## 4. Lessons Learned

**The ledger is the hard part.** Building a correct double-entry ledger with concurrency protection is more challenging than building the UI, more challenging than building the API layer, and more foundational than anything in the blockchain simulation. If I were starting over, I would design the ledger first and build everything else around it.

**Simulate the hard parts honestly.** The `MockBlockchainService` is explicitly named "Mock." It generates fake transaction hashes and fake block numbers, and the code comments state clearly that it is a simulation. This honesty is more valuable than pretending real blockchain connectivity exists. The data model is production-ready; the underlying service is clearly not.

**Two services add complexity faster than they add value at prototype scale.** The Django + FastAPI split made sense architecturally but created tangible friction: two local processes to run, two deployments, a shared schema with two migration systems, and two sets of dependencies to maintain. For a prototype, a single well-structured Django service would have shipped faster.

**Test concurrency explicitly.** The race condition tests that run 10 concurrent transfer attempts were written before the locking code was finalised. They caught real bugs. Financial systems have concurrency requirements that unit tests don't reveal — you need tests that actually send concurrent requests.

**The UI communicates the product's ambition.** A prototype with a polished, premium-feeling UI communicates the project's intent more effectively than one that looks like a coding exercise. The investment in the visual design, typography, and interaction quality of the dashboard shapes how the project is perceived and discussed.

---

## 5. Future Possibilities

The architectural foundations built in this prototype — the double-entry ledger, the settlement state machine, the row-level concurrency protection, the JWT auth layer — would carry into a production system with limited redesign.

What would need to be rebuilt or extended:

1. **The blockchain service**: replace `MockBlockchainService` with a real network client.
2. **The transfer ownership model**: extend to support cross-user transfers with a user directory.
3. **The deposit and withdrawal layer**: replace simulated operations with real payment processor integrations.
4. **The settlement advancement mechanism**: replace polling with an event-driven worker.
5. **The registration flow**: expose user registration in the UI with appropriate onboarding.

The most interesting future direction is cross-currency settlement. The conversion model in the prototype is 1:1. Extending it to apply real exchange rates — locking a rate at transfer initiation and guaranteeing the recipient amount — would make the system genuinely useful for international payments, which is the corridor where existing solutions have the most friction.

---

*This case study reflects the state of the project as of v0.1.0. The code behind every claim in this document can be read in the repository.*
