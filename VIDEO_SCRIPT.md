# 5-Minute Explanation Video Script
## Cash Management & Reconciliation System (CMRS)

> **Target Duration:** Exactly 5:00 minutes (Max 5 minutes as required)  
> **Speaker Notes:** Keep your browser open at `http://localhost:5173/` and backend Swagger open at `http://127.0.0.1:8000/api/docs/`. Speak clearly and confidently.

---

### [0:00 - 0:40] 1. Problem Understanding & Core Financial Workflow
*(Screen: Show CMRS Architecture Diagram or CMRS Web Interface)*

> **Speaker:**  
> "Hello! Today, I’m presenting the Cash Management & Reconciliation System (CMRS) that I engineered for this screening assignment.
>
> In lending and microfinance, field collection agents collect loan repayments in cash directly from borrowers and deposit them at their respective branches. However, cash is inherently vulnerable to leakages, miscounts, transit loss, counterfeit currency, and reconciliation delays.
>
> The company needs total visibility across the full cash lifecycle:
> **Customer $\longrightarrow$ Collection Agent $\longrightarrow$ Branch Vault $\longrightarrow$ Bank Deposit $\longrightarrow$ Settled Company Account.**
>
> To solve this, I designed CMRS with a strict 5-stage finite state machine, zero floating-point arithmetic errors, and role-based access control."

---

### [0:40 - 1:20] 2. System Architecture & Database Design
*(Screen: Show Normalized ERD Diagram in README or Code in IDE)*

> **Speaker:**  
> "On the architecture side:
> - **Backend:** Built with Python 3.13, Django 5.1, and Django REST Framework, using JWT authentication with granular permissions for Collection Agents, Branch Managers, and Finance Admins.
> - **Database:** Normalized relational database in PostgreSQL. Crucially, **all monetary values use `DECIMAL(12, 2)`** to eliminate floating-point rounding errors in financial transactions.
> - **Concurrency & Idempotency:** We enforce database row-level locking via `select_for_update()` during collection allocations, along with client-generated idempotency keys to prevent double-collections during network retries.
> - **Immutability & Audit Trail:** Once a transaction is reconciled by a branch or settled by the bank, it is state-locked against unauthorized edits. Every state transition writes to an append-only `AuditLog` table."

---

### [1:20 - 3:20] 3. Key Workflows & Live Application Demo
*(Screen: Switch to Browser at `http://localhost:5173/`)*

#### Step A: Field Collection Agent (Ramesh Kumar)
> **Speaker:**  
> *"Here is our React application with a sticky **1-Click Demo Role Switcher** at the top.*
>
> *We start logged in as **Ramesh Kumar**, our field collection agent in Bangalore. Ramesh sees his active cash in hand (₹9,500), today's collections, and assigned borrowers.*
>
> *First, we can onboard a new borrower with KYC verification using **Onboard Borrower**, or disburse a new loan with automated EMI schedule generation using **New Loan**.*
>
> *Let's inspect Aarav Patel's loan. Clicking **Schedule** reveals the complete monthly installment schedule and past repayment receipts.*
>
> *Now, let's click **Collect**. The modal supports exact due, partial payments, advance payments, and cash denomination breakdowns (₹500, ₹200, ₹100 notes).*
>
> *If the borrower prefers digital payment, selecting **UPI Digital (Sandbox)** displays a simulated UPI QR Code and VPA. The system demonstrates how digital collections settle directly into the corporate account while keeping the loan ledger unified.*
>
> *Upon submitting, the system updates the loan balance, advances the schedule state, and instantly prints an official thermal receipt with counterfoil and security QR code.*
>
> *At the end of the day, Ramesh clicks **Submit Cash to Branch**, creating a handover batch with his declared cash total."*

#### Step B: Branch Manager Portal (Priya Sharma)
*(Click: "Branch Mgr (Priya)" button in the top banner)*
> **Speaker:**  
> *"Now, with one click, we switch to **Priya Sharma**, the Branch Manager.*
>
> *Priya sees the branch vault safe balance (₹1,25,000) and inbound agent submissions. In the **Agent Field Collections Log** tab, she can inspect individual collections and filter by date and status.*
>
> *When Priya clicks **Count & Verify** on an inbound batch, the system compares the Agent's Declared Cash with the physically counted cash.*
>
> *If there is a shortage—for example, ₹50,000 expected vs ₹48,500 received—the system automatically logs a formal **Discrepancy** of ₹1,500 in the audit ledger and debits agent liability.*
>
> *Once cash is verified into the vault, Priya clicks **Create Bank Deposit Slip**, selects the reconciled batches, enters the bank name (e.g. HDFC Bank) and the teller's challan reference number. The cash is deducted from the vault safe and moves into Bank Clearing."*

#### Step C: Finance HQ & Treasury (Vikram Seth)
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

### [3:20 - 4:10] 4. Critical Business Rules & Edge Cases Handled
*(Screen: Show the test suite running or README business cases table)*

> **Speaker:**  
> "We intentionally handled the real-world business cases specified in the assignment:
> 1. **Partial Repayment:** Allocates cash to the active installment first, updating `paid_amount` and marking `PARTIALLY_PAID`.
> 2. **Over-Collection:** Automatically clears the active EMI and cascades the surplus forward into upcoming scheduled installments.
> 3. **Rejected Cash Handover:** If an agent's cash envelope is tampered with, the manager rejects it with remarks; collections safely revert to the agent's queue.
> 4. **Bank Credit Mismatch:** Highlights variance between branch deposits and actual bank statement credit.
> 5. **Idempotency & Duplicate Prevention:** Unique database constraints on `(bank_name, bank_reference_no)` and collection idempotency keys.
> 6. **Automated Test Suite:** We have 8 comprehensive unit tests in Django verifying financial math, partial repayments, discrepancy calculations, and immutability."

---

### [4:10 - 4:40] 5. Technology Choices & Trade-offs
> **Speaker:**  
> "Key engineering trade-offs made:
> - **PostgreSQL & Decimal over Float:** In fintech, floating-point rounding is catastrophic. We used Python's `Decimal` and SQL `NUMERIC` throughout.
> - **Interactive Role Switcher vs Separate Logins:** While we support standard JWT login endpoints, I implemented a persistent Demo Role Switcher to enable seamless interview evaluation without needing constant logouts.
> - **Synchronous Atomic Locks vs Celery Worker:** For transaction consistency, database-level atomic transactions (`transaction.atomic`) guarantee data integrity without the operational overhead of a distributed queue for this scale."

---

### [4:40 - 5:00] 6. Challenges Encountered & Future Improvements
> **Speaker:**  
> "A key challenge was ensuring that over-collections cascade accurately across future schedules while maintaining database locks. We solved this with a recursive allocation service inside an atomic block.
>
> With additional time, I would:
> 1. Integrate optical receipt OCR for physical bank deposit challan verification.
> 2. Add offline SQLite caching for field agents in remote rural areas with background sync.
> 3. Connect real-time webhooks with bank statement APIs like RazorpayX or Cashfree.
>
> In conclusion, CMRS provides a bulletproof, mathematically precise, and intuitive system for cash management in lending.
>
> Thank you, and I look forward to your questions!"

---

### Quick Recording Checklist:
- [ ] Keep `http://localhost:5173/` open in your browser.
- [ ] Show 1-Click Role Switcher in action.
- [ ] Record one cash collection and show the thermal receipt.
- [ ] Show Branch Manager counting cash with shortage discrepancy.
- [ ] Show Finance HQ 5-Stage Liquidity Funnel and Bank Settlement.
- [ ] Mention Swagger docs at `/api/docs/`.
