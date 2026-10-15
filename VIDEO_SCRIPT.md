# 5-Minute Video Presentation Script
## Cash Management & Reconciliation System (CMRS)

> **Target Duration:** Exactly 5:00 minutes  
> **Speaker Notes:** Speak with clarity and confidence. Keep your browser open at `http://localhost:5173/` and backend Swagger open at `http://127.0.0.1:8000/api/docs/`.

---

### [0:00 - 0:35] Part 1: Problem Understanding & Financial Workflow
*(Screen: Show README architecture diagram or CMRS Home Screen)*

> **Speaker:**  
> "Hello! Today, I’m presenting the Cash Management & Reconciliation System (CMRS) that I engineered for this screening assignment.
>
> In retail lending and microfinance, field agents collect loan repayments in cash directly from borrowers. However, cash is inherently vulnerable to leakages, miscounts, transit loss, counterfeit currency, and delayed reconciliation.
>
> The business challenge is to ensure absolute transparency across the entire lifecycle:
> **Customer $\rightarrow$ Field Collection Agent $\rightarrow$ Branch Vault Safe $\rightarrow$ Bank Deposit $\rightarrow$ Settled Company Account.**
>
> To solve this, I designed CMRS with a strict 5-stage finite state machine, zero floating-point error, and role-based permissions."

---

### [0:35 - 1:15] Part 2: System Architecture & Database Design
*(Screen: Show Database ERD / Schema in README or Models code)*

> **Speaker:**  
> "On the architecture side:
> - **Backend:** Python with Django 5 and Django REST Framework, utilizing JWT authentication with custom permissions (`IsCollectionAgent`, `IsBranchManager`, `IsFinanceAdmin`).
> - **Database:** A normalized relational schema in PostgreSQL. Crucially, **all monetary columns utilize `DECIMAL(12, 2)`** to eliminate floating-point arithmetic errors in financial calculations.
> - **Concurrency & Idempotency:** We enforce database row-level locking via `select_for_update()` during collection allocations, along with client-generated idempotency keys to completely prevent double-collection during network retries.
> - **State Machine & Immutability:** Once transactions are reconciled by the branch or settled by the bank, they are state-locked and immutable. Every action writes to an append-only `AuditLog` table."

---

### [1:15 - 3:15] Part 3: Live Application Demonstration
*(Screen: Switch to Browser at `http://localhost:5173/`)*

#### Step 1: Field Agent Portal (Ramesh Kumar)
> **Speaker:**  
> *"Here on screen is our React application with an embedded **1-Click Demo Role Switcher** at the top.*
>
> *We are currently logged in as **Ramesh Kumar**, our field collection agent. Ramesh sees his assigned borrowers, his active cash-in-hand balance (₹9,500), and pending loan schedules.*
>
> *Let's collect an EMI from borrower Aarav Patel. When I click **Collect Cash**, the modal allows partial payments, full due payments, advance payments, and even cash denomination breakdowns (₹500, ₹200, ₹100 notes).*
>
> *Upon submitting, the system atomically updates the loan balance, advances the schedule state, and instantly prints an official thermal receipt with counterfoil and security QR code.*
>
> *At the end of his field day, Ramesh bundles his unsubmitted collections and clicks **Submit Cash to Branch**, creating a handover batch with his declared total amount."*

#### Step 2: Branch Manager Portal (Priya Sharma)
*(Click: "Branch Mgr (Priya)" button in the top banner)*
> **Speaker:**  
> *"Now, with one click, we switch to **Priya Sharma**, the Branch Manager.*
>
> *Priya sees the branch vault safe balance (₹1,25,000) and inbound agent submissions. When she clicks **Count & Verify**, the system compares the Agent's Declared Cash with the physically counted cash.*
>
> *If there's an exact match, the vault is credited. If there is a cash shortage—for example, ₹1,500 missing—the system automatically logs a formal **Discrepancy** in the audit ledger and debits agent liability.*
>
> *Once cash is verified in the vault, Priya clicks **Create Bank Deposit Slip**, selects the reconciled batches, enters the bank name (e.g. HDFC Bank) and the teller's challan reference number. The cash is deducted from the vault and moved into Bank Clearing."*

#### Step 3: Finance HQ & Treasury (Vikram Seth)
*(Click: "Finance HQ (Vikram)" button in the top banner)*
> **Speaker:**  
> *"Finally, we switch to **Vikram Seth** in Finance HQ.*
>
> *Vikram has nationwide visibility across all branches via the **5-Stage Liquidity Funnel**: Expected Due $\rightarrow$ Cash in Field $\rightarrow$ Cash in Vaults $\rightarrow$ In Bank Clearing $\rightarrow$ Settled Liquidity.*
>
> *Vikram opens the Bank Statement Reconciliation queue. He compares the physical deposit slip against the actual bank credit statement. If the statement matches, he confirms settlement, and the funds are officially locked as `SETTLED`.*
>
> *If the bank credited less—for instance, due to a counterfeit ₹500 note rejected by the teller—Vikram flags a **Settlement Mismatch**, creating a visible audit flag."*

---

### [3:15 - 4:10] Part 4: Critical Business Rules & Edge Cases Handled
*(Screen: Show the test suite running or README business cases table)*

> **Speaker:**  
> "We intentionally handled the real-world edge cases specified in the assignment:
> 1. **Partial Repayments:** Allocates cash to the oldest overdue EMI first, updating `paid_amount` and marking `PARTIALLY_PAID`.
> 2. **Over-collection:** Automatically clears the active EMI and rolls the surplus forward into upcoming installments.
> 3. **Rejected Cash Handover:** If an agent's cash envelope is tampered with, the manager can reject it with a reason; the collections safely revert to the agent's queue.
> 4. **Bank Credit Mismatch:** Highlights variance between branch deposits and actual bank credit.
> 5. **Idempotency & Double Prevention:** Unique database constraints on `(bank_name, bank_reference_no)` and collection idempotency keys.
> 6. **Automated Test Suite:** We have 8 comprehensive unit tests in Django verifying financial math, partial repayments, discrepancy calculations, and immutability."

---

### [4:10 - 4:40] Part 5: Technology Choices & Trade-offs
> **Speaker:**  
> "A few key engineering trade-offs:
> - **PostgreSQL & Decimal over Float:** In fintech, floating-point rounding is catastrophic. We used Python's `Decimal` and SQL `NUMERIC` throughout.
> - **Interactive Role Switcher vs Separate Logins:** While we support standard JWT logins, I implemented a persistent Demo Role Switcher to enable seamless interview evaluation without needing constant logouts.
> - **Synchronous Atomic Locks vs Celery Worker:** For transaction consistency, database-level atomic transactions (`transaction.atomic`) guarantee data integrity without the operational overhead of a distributed queue for this scale."

---

### [4:40 - 5:00] Part 6: What I Would Improve With More Time & Conclusion
> **Speaker:**  
> "With additional time, I would:
> 1. Integrate optical receipt OCR for physical bank deposit challan verification.
> 2. Add offline SQLite caching for field agents in remote areas with background sync via service workers.
> 3. Connect real-time webhooks with bank statement APIs like RazorpayX or Cashfree.
>
> In conclusion, CMRS provides a bulletproof, mathematically precise, and intuitive system for cash management in lending.
>
> Thank you, and I look forward to your questions!"

---

### Video Checklist:
- [ ] Show 1-Click Role Switcher in action.
- [ ] Record one cash collection and show the thermal receipt.
- [ ] Show Branch Manager counting cash with shortage discrepancy.
- [ ] Show Finance HQ 5-Stage Liquidity Funnel and Bank Settlement.
- [ ] Mention Swagger docs at `/api/docs/`.
