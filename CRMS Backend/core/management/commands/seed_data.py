import uuid
from decimal import Decimal
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from core.models import (
    Branch, User, Customer, Loan, RepaymentSchedule,
    Collection, CashSubmission, Discrepancy, BankDeposit, AuditLog
)


class Command(BaseCommand):
    help = 'Seeds database with rich demo data across all branches for CMRS video recording'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("Clearing existing CMRS data..."))
        AuditLog.objects.all().delete()
        Discrepancy.objects.all().delete()
        Collection.objects.all().delete()
        CashSubmission.objects.all().delete()
        BankDeposit.objects.all().delete()
        RepaymentSchedule.objects.all().delete()
        Loan.objects.all().delete()
        Customer.objects.all().delete()
        User.objects.all().delete()
        Branch.objects.all().delete()

        today = timezone.now().date()

        # ═══════════════════════════════════════════════════════════
        # 1. BRANCHES
        # ═══════════════════════════════════════════════════════════
        self.stdout.write(self.style.SUCCESS("Creating Branches..."))
        b1 = Branch.objects.create(
            name="Bangalore South Branch",
            code="BR-BLR-01",
            address="42/1, 100 Feet Rd, Koramangala 4th Block",
            city="Bangalore",
            vault_cash_balance=Decimal("125000.00")
        )
        b2 = Branch.objects.create(
            name="Mumbai Central Branch",
            code="BR-BOM-01",
            address="8th Floor, Express Towers, Nariman Point",
            city="Mumbai",
            vault_cash_balance=Decimal("95000.00")
        )
        b3 = Branch.objects.create(
            name="Delhi NCR Branch",
            code="BR-DEL-01",
            address="Tower B, Cyber City, DLF Phase 2",
            city="Gurugram",
            vault_cash_balance=Decimal("70000.00")
        )

        # ═══════════════════════════════════════════════════════════
        # 2. USERS — Agents, Managers, Admin
        # ═══════════════════════════════════════════════════════════
        self.stdout.write(self.style.SUCCESS("Creating Users & Roles..."))

        # --- Bangalore agents ---
        agent_ramesh = User.objects.create_user(
            username="ramesh_agent", email="agent@cmrs.fintech", password="pass123",
            first_name="Ramesh", last_name="Kumar",
            role="COLLECTION_AGENT", branch=b1,
            employee_id="EMP-AG-101", phone="+91 98450 12345"
        )
        agent_meera = User.objects.create_user(
            username="meera_agent", email="meera@cmrs.fintech", password="pass123",
            first_name="Meera", last_name="Iyer",
            role="COLLECTION_AGENT", branch=b1,
            employee_id="EMP-AG-103", phone="+91 98450 99887"
        )

        # --- Mumbai agents ---
        agent_suresh = User.objects.create_user(
            username="suresh_agent", email="agent2@cmrs.fintech", password="pass123",
            first_name="Suresh", last_name="Patel",
            role="COLLECTION_AGENT", branch=b2,
            employee_id="EMP-AG-102", phone="+91 98200 54321"
        )
        agent_fatima = User.objects.create_user(
            username="fatima_agent", email="fatima@cmrs.fintech", password="pass123",
            first_name="Fatima", last_name="Sheikh",
            role="COLLECTION_AGENT", branch=b2,
            employee_id="EMP-AG-104", phone="+91 98200 11223"
        )

        # --- Delhi agents ---
        agent_arjun = User.objects.create_user(
            username="arjun_agent", email="arjun@cmrs.fintech", password="pass123",
            first_name="Arjun", last_name="Reddy",
            role="COLLECTION_AGENT", branch=b3,
            employee_id="EMP-AG-105", phone="+91 99100 44556"
        )

        # --- Branch Managers (one per branch) ---
        mgr_priya = User.objects.create_user(
            username="priya_manager", email="manager@cmrs.fintech", password="pass123",
            first_name="Priya", last_name="Sharma",
            role="BRANCH_MANAGER", branch=b1,
            employee_id="EMP-BM-201", phone="+91 98800 67890"
        )
        mgr_karan = User.objects.create_user(
            username="karan_manager", email="karan@cmrs.fintech", password="pass123",
            first_name="Karan", last_name="Malhotra",
            role="BRANCH_MANAGER", branch=b2,
            employee_id="EMP-BM-202", phone="+91 98200 77880"
        )
        mgr_neha = User.objects.create_user(
            username="neha_manager", email="neha@cmrs.fintech", password="pass123",
            first_name="Neha", last_name="Kapoor",
            role="BRANCH_MANAGER", branch=b3,
            employee_id="EMP-BM-203", phone="+91 99100 33221"
        )

        # --- Finance Admin (Head Office, no branch) ---
        admin_vikram = User.objects.create_superuser(
            username="vikram_admin", email="admin@cmrs.fintech", password="pass123",
            first_name="Vikram", last_name="Seth",
            role="FINANCE_ADMIN",
            employee_id="EMP-HQ-001", phone="+91 99000 11223"
        )

        # ═══════════════════════════════════════════════════════════
        # 3. CUSTOMERS (spread across all branches)
        # ═══════════════════════════════════════════════════════════
        self.stdout.write(self.style.SUCCESS("Creating Customers & Loans..."))

        customer_data = [
            # Bangalore — Ramesh's portfolio
            ("Aarav Patel",       "CUST-BLR-001", "+91 91234 56789", "Indiranagar, Bangalore",      b1, agent_ramesh),
            ("Sunita Verma",      "CUST-BLR-002", "+91 92345 67890", "HSR Layout, Bangalore",       b1, agent_ramesh),
            ("Deepak Rao",        "CUST-BLR-003", "+91 93456 78901", "BTM Layout, Bangalore",       b1, agent_ramesh),
            ("Lakshmi Devi",      "CUST-BLR-004", "+91 94567 89012", "Jayanagar, Bangalore",        b1, agent_ramesh),
            ("Rajesh Gupta",      "CUST-BLR-005", "+91 95678 90123", "Electronic City, Bangalore",  b1, agent_ramesh),
            # Bangalore — Meera's portfolio
            ("Nitin Joshi",       "CUST-BLR-006", "+91 91111 22233", "Whitefield, Bangalore",       b1, agent_meera),
            ("Kavitha Murthy",    "CUST-BLR-007", "+91 91111 33344", "JP Nagar, Bangalore",         b1, agent_meera),
            ("Tanvi Hegde",       "CUST-BLR-008", "+91 91111 44455", "Marathahalli, Bangalore",     b1, agent_meera),
            # Mumbai — Suresh's portfolio
            ("Anita Singh",       "CUST-BOM-001", "+91 96789 01234", "Andheri West, Mumbai",        b2, agent_suresh),
            ("Mohammed Irfan",    "CUST-BOM-002", "+91 97890 12345", "Bandra East, Mumbai",         b2, agent_suresh),
            ("Kavita Nair",       "CUST-BOM-003", "+91 98901 23456", "Thane West, Mumbai",          b2, agent_suresh),
            ("Rohit Deshmukh",    "CUST-BOM-004", "+91 98901 44567", "Powai, Mumbai",               b2, agent_suresh),
            # Mumbai — Fatima's portfolio
            ("Priti Chavan",      "CUST-BOM-005", "+91 98901 55678", "Dadar, Mumbai",               b2, agent_fatima),
            ("Sanjay Mhatre",     "CUST-BOM-006", "+91 98901 66789", "Malad, Mumbai",               b2, agent_fatima),
            ("Zainab Ansari",     "CUST-BOM-007", "+91 98901 77890", "Goregaon, Mumbai",            b2, agent_fatima),
            # Delhi — Arjun's portfolio
            ("Vikas Tiwari",      "CUST-DEL-001", "+91 99100 12345", "Sector 18, Noida",            b3, agent_arjun),
            ("Pooja Chauhan",     "CUST-DEL-002", "+91 99100 23456", "Sector 62, Noida",            b3, agent_arjun),
            ("Amit Saxena",       "CUST-DEL-003", "+91 99100 34567", "Dwarka Sec 21, Delhi",        b3, agent_arjun),
            ("Ritu Yadav",        "CUST-DEL-004", "+91 99100 45678", "Rajouri Garden, Delhi",       b3, agent_arjun),
            ("Harish Bhatt",      "CUST-DEL-005", "+91 99100 56789", "Vaishali, Ghaziabad",         b3, agent_arjun),
        ]

        customers = []
        for name, code, phone, addr, branch, ag in customer_data:
            cust = Customer.objects.create(
                customer_code=code, full_name=name, phone=phone,
                address=addr, branch=branch, assigned_agent=ag, kyc_verified=True
            )
            customers.append(cust)

        # ═══════════════════════════════════════════════════════════
        # 4. LOANS — one per customer, varying terms
        # ═══════════════════════════════════════════════════════════
        loan_configs = [
            # Bangalore — Ramesh (5)
            (Decimal("60000"), Decimal("15.00"), 6),
            (Decimal("45000"), Decimal("14.00"), 6),
            (Decimal("80000"), Decimal("16.00"), 8),
            (Decimal("30000"), Decimal("12.00"), 6),
            (Decimal("50000"), Decimal("15.00"), 6),
            # Bangalore — Meera (3)
            (Decimal("35000"), Decimal("13.50"), 6),
            (Decimal("55000"), Decimal("14.50"), 6),
            (Decimal("42000"), Decimal("13.00"), 6),
            # Mumbai — Suresh (4)
            (Decimal("75000"), Decimal("15.50"), 6),
            (Decimal("40000"), Decimal("13.00"), 6),
            (Decimal("90000"), Decimal("17.00"), 6),
            (Decimal("65000"), Decimal("14.00"), 6),
            # Mumbai — Fatima (3)
            (Decimal("48000"), Decimal("14.00"), 6),
            (Decimal("38000"), Decimal("12.50"), 6),
            (Decimal("72000"), Decimal("16.00"), 6),
            # Delhi — Arjun (5)
            (Decimal("55000"), Decimal("15.00"), 6),
            (Decimal("60000"), Decimal("14.50"), 6),
            (Decimal("35000"), Decimal("13.00"), 6),
            (Decimal("45000"), Decimal("15.50"), 6),
            (Decimal("70000"), Decimal("16.00"), 8),
        ]

        loans = []
        for i, cust in enumerate(customers):
            principal, rate, tenure = loan_configs[i]
            total_interest = (principal * rate * tenure) / Decimal("1200.00")
            total_payable = principal + total_interest
            monthly_emi = (total_payable / tenure).quantize(Decimal("0.01"))

            loan = Loan.objects.create(
                loan_account_no=f"LN-{today.year}-{cust.customer_code.replace('CUST-', '')}",
                customer=cust,
                principal_amount=principal,
                interest_rate_pct=rate,
                tenure_months=tenure,
                total_payable=total_payable,
                total_paid=Decimal("0.00"),
                outstanding_amount=total_payable,
                status="ACTIVE",
                disbursed_at=today - timedelta(days=90)
            )
            loans.append(loan)

            # Generate EMI schedules
            principal_per_emi = (principal / tenure).quantize(Decimal("0.01"))
            interest_per_emi = (total_interest / tenure).quantize(Decimal("0.01"))
            for m in range(1, tenure + 1):
                due_d = (today - timedelta(days=90)) + timedelta(days=30 * m)
                sch_status = "OVERDUE" if due_d < today else "PENDING"
                RepaymentSchedule.objects.create(
                    loan=loan, installment_no=m, due_date=due_d,
                    due_amount=monthly_emi,
                    principal_component=principal_per_emi,
                    interest_component=interest_per_emi,
                    paid_amount=Decimal("0.00"),
                    status=sch_status
                )

        # Helper to pay a schedule and update loan
        def _pay_schedule(loan_obj, schedule, amount):
            schedule.paid_amount = amount
            schedule.status = "PAID" if amount >= schedule.due_amount else "PARTIALLY_PAID"
            schedule.save()
            loan_obj.total_paid += amount
            loan_obj.outstanding_amount -= amount
            loan_obj.save()

        # ═══════════════════════════════════════════════════════════
        # 5. WORKFLOWS — carefully staged for each role
        # ═══════════════════════════════════════════════════════════
        self.stdout.write(self.style.SUCCESS("Creating Workflows & Scenarios..."))

        #  ┌─────────────────────────────────────────────────────────┐
        #  │  BANGALORE BRANCH (b1) — Ramesh & Meera                │
        #  └─────────────────────────────────────────────────────────┘

        # === AGENT RAMESH: 3 fresh COLLECTED collections (unsubmitted cash in hand) ===
        for idx in [0, 1, 2]:
            sch = loans[idx].schedules.first()
            amounts = [Decimal("5000"), Decimal("4500"), Decimal("8000")]
            _pay_schedule(loans[idx], sch, amounts[idx])
            Collection.objects.create(
                receipt_no=f"RCP-{today.strftime('%Y%m%d')}-R{idx+1:03d}",
                schedule=sch, loan=loans[idx], customer=customers[idx],
                agent=agent_ramesh, amount_collected=amounts[idx],
                payment_mode="CASH", status="COLLECTED",
                idempotency_key=str(uuid.uuid4()),
                notes=f"Cash collected today from {customers[idx].full_name}."
            )

        # === AGENT RAMESH: 1 pending submission batch from yesterday (for Branch Mgr to verify) ===
        sub1_collections = []
        for idx in [3, 4]:
            sch = loans[idx].schedules.first()
            amounts = [Decimal("5000"), Decimal("7500")]
            _pay_schedule(loans[idx], sch, amounts[idx - 3])
            col = Collection.objects.create(
                receipt_no=f"RCP-{(today - timedelta(days=1)).strftime('%Y%m%d')}-R{idx+1:03d}",
                schedule=sch, loan=loans[idx], customer=customers[idx],
                agent=agent_ramesh, amount_collected=amounts[idx - 3],
                payment_mode="CASH", status="SUBMITTED",
                idempotency_key=str(uuid.uuid4()),
                notes="Cash collected yesterday, submitted for handover."
            )
            sub1_collections.append(col)

        pending_sub_blr1 = CashSubmission.objects.create(
            submission_no="SUB-20261016-BLR01",
            agent=agent_ramesh, branch=b1,
            declared_amount=Decimal("12500.00"),
            status="PENDING",
            denominations={"500": 23, "200": 5, "100": 10}
        )
        for c in sub1_collections:
            c.submission = pending_sub_blr1
            c.save()

        # === AGENT MEERA: 2 fresh COLLECTED (unsubmitted) + 1 pending submission ===
        for idx in [5, 6]:
            sch = loans[idx].schedules.first()
            amounts = [Decimal("6000"), Decimal("3500")]
            _pay_schedule(loans[idx], sch, amounts[idx - 5])
            Collection.objects.create(
                receipt_no=f"RCP-{today.strftime('%Y%m%d')}-M{idx-4:03d}",
                schedule=sch, loan=loans[idx], customer=customers[idx],
                agent=agent_meera, amount_collected=amounts[idx - 5],
                payment_mode="CASH", status="COLLECTED",
                idempotency_key=str(uuid.uuid4()),
                notes=f"Collected today by Meera from {customers[idx].full_name}."
            )

        sch7 = loans[7].schedules.first()
        _pay_schedule(loans[7], sch7, Decimal("7200"))
        col_meera_sub = Collection.objects.create(
            receipt_no=f"RCP-{(today - timedelta(days=1)).strftime('%Y%m%d')}-M003",
            schedule=sch7, loan=loans[7], customer=customers[7],
            agent=agent_meera, amount_collected=Decimal("7200"),
            payment_mode="CASH", status="SUBMITTED",
            idempotency_key=str(uuid.uuid4()),
            notes="Collected yesterday by Meera, submitted."
        )
        pending_sub_blr2 = CashSubmission.objects.create(
            submission_no="SUB-20261016-BLR02",
            agent=agent_meera, branch=b1,
            declared_amount=Decimal("7200.00"),
            status="PENDING",
            denominations={"500": 12, "200": 5, "100": 12}
        )
        col_meera_sub.submission = pending_sub_blr2
        col_meera_sub.save()

        # === BANGALORE: Past approved submission with SHORTAGE discrepancy ===
        past_sub_blr = CashSubmission.objects.create(
            submission_no="SUB-20261010-BLR99",
            agent=agent_ramesh, branch=b1,
            declared_amount=Decimal("50000.00"),
            verified_amount=Decimal("48500.00"),
            status="APPROVED",
            denominations={"500": 97},
            verified_by=mgr_priya,
            verified_at=timezone.now() - timedelta(days=7)
        )
        Discrepancy.objects.create(
            submission=past_sub_blr, agent=agent_ramesh, branch=b1,
            discrepancy_type="SHORTAGE",
            expected_amount=Decimal("50000.00"),
            actual_amount=Decimal("48500.00"),
            difference_amount=Decimal("1500.00"),
            status="OPEN",
            resolution_notes="Agent Ramesh reported ₹1,500 cash packet dropped during transit. Under active recovery."
        )

        # === BANGALORE: Bank deposit in clearing (for Finance Admin to settle) ===
        dep_blr_clearing = BankDeposit.objects.create(
            deposit_slip_no="DEP-20261014-BLR01",
            branch=b1, created_by=mgr_priya,
            bank_name="HDFC Bank", account_no="50200088991122",
            deposited_amount=Decimal("48500.00"),
            bank_reference_no="HDFC-CHQ-9912048",
            deposit_date=today - timedelta(days=3),
            status="DEPOSITED"
        )
        past_sub_blr.bank_deposit = dep_blr_clearing
        past_sub_blr.save()

        # === BANGALORE: Past settled deposit ===
        BankDeposit.objects.create(
            deposit_slip_no="DEP-20261005-BLR02",
            branch=b1, created_by=mgr_priya,
            bank_name="State Bank of India", account_no="301122334455",
            deposited_amount=Decimal("80000.00"),
            settled_amount=Decimal("80000.00"),
            bank_reference_no="SBI-NEFT-4411990",
            deposit_date=today - timedelta(days=12),
            status="SETTLED",
            settled_at=timezone.now() - timedelta(days=11),
            settled_by=admin_vikram
        )

        #  ┌─────────────────────────────────────────────────────────┐
        #  │  MUMBAI BRANCH (b2) — Suresh & Fatima                  │
        #  └─────────────────────────────────────────────────────────┘

        # === AGENT SURESH: 2 fresh COLLECTED (unsubmitted) ===
        for idx in [8, 9]:
            sch = loans[idx].schedules.first()
            amounts = [Decimal("12500"), Decimal("6700")]
            _pay_schedule(loans[idx], sch, amounts[idx - 8])
            Collection.objects.create(
                receipt_no=f"RCP-{today.strftime('%Y%m%d')}-S{idx-7:03d}",
                schedule=sch, loan=loans[idx], customer=customers[idx],
                agent=agent_suresh, amount_collected=amounts[idx - 8],
                payment_mode="CASH", status="COLLECTED",
                idempotency_key=str(uuid.uuid4()),
                notes=f"Collected today by Suresh from {customers[idx].full_name}."
            )

        # === AGENT SURESH: 1 pending submission batch (for Karan to verify) ===
        sch10 = loans[10].schedules.first()
        _pay_schedule(loans[10], sch10, Decimal("15000"))
        col_sur_sub1 = Collection.objects.create(
            receipt_no=f"RCP-{(today - timedelta(days=1)).strftime('%Y%m%d')}-S003",
            schedule=sch10, loan=loans[10], customer=customers[10],
            agent=agent_suresh, amount_collected=Decimal("15000"),
            payment_mode="CASH", status="SUBMITTED",
            idempotency_key=str(uuid.uuid4()),
            notes="Collected yesterday, submitted for verification."
        )
        sch11 = loans[11].schedules.first()
        _pay_schedule(loans[11], sch11, Decimal("10833"))
        col_sur_sub2 = Collection.objects.create(
            receipt_no=f"RCP-{(today - timedelta(days=1)).strftime('%Y%m%d')}-S004",
            schedule=sch11, loan=loans[11], customer=customers[11],
            agent=agent_suresh, amount_collected=Decimal("10833"),
            payment_mode="CASH", status="SUBMITTED",
            idempotency_key=str(uuid.uuid4()),
            notes="Collected yesterday, submitted for verification."
        )
        pending_sub_bom1 = CashSubmission.objects.create(
            submission_no="SUB-20261016-BOM01",
            agent=agent_suresh, branch=b2,
            declared_amount=Decimal("25833.00"),
            status="PENDING",
            denominations={"2000": 8, "500": 17, "200": 8, "100": 3}
        )
        col_sur_sub1.submission = pending_sub_bom1
        col_sur_sub1.save()
        col_sur_sub2.submission = pending_sub_bom1
        col_sur_sub2.save()

        # === AGENT FATIMA: 3 fresh COLLECTED (unsubmitted) + 1 pending submission ===
        for idx in [12, 13]:
            sch = loans[idx].schedules.first()
            amounts = [Decimal("8000"), Decimal("6500")]
            _pay_schedule(loans[idx], sch, amounts[idx - 12])
            Collection.objects.create(
                receipt_no=f"RCP-{today.strftime('%Y%m%d')}-F{idx-11:03d}",
                schedule=sch, loan=loans[idx], customer=customers[idx],
                agent=agent_fatima, amount_collected=amounts[idx - 12],
                payment_mode="CASH", status="COLLECTED",
                idempotency_key=str(uuid.uuid4()),
                notes=f"Collected today by Fatima from {customers[idx].full_name}."
            )

        sch14 = loans[14].schedules.first()
        _pay_schedule(loans[14], sch14, Decimal("12960"))
        col_fat_sub = Collection.objects.create(
            receipt_no=f"RCP-{(today - timedelta(days=2)).strftime('%Y%m%d')}-F003",
            schedule=sch14, loan=loans[14], customer=customers[14],
            agent=agent_fatima, amount_collected=Decimal("12960"),
            payment_mode="CASH", status="SUBMITTED",
            idempotency_key=str(uuid.uuid4()),
            notes="Collected 2 days ago by Fatima, submitted for verification."
        )
        pending_sub_bom2 = CashSubmission.objects.create(
            submission_no="SUB-20261015-BOM02",
            agent=agent_fatima, branch=b2,
            declared_amount=Decimal("12960.00"),
            status="PENDING",
            denominations={"500": 21, "200": 10, "100": 4, "50": 12}
        )
        col_fat_sub.submission = pending_sub_bom2
        col_fat_sub.save()

        # === MUMBAI: Past approved submission with EXCESS discrepancy ===
        past_sub_bom = CashSubmission.objects.create(
            submission_no="SUB-20261008-BOM99",
            agent=agent_suresh, branch=b2,
            declared_amount=Decimal("35000.00"),
            verified_amount=Decimal("35500.00"),
            status="APPROVED",
            denominations={"500": 71},
            verified_by=mgr_karan,
            verified_at=timezone.now() - timedelta(days=9)
        )
        Discrepancy.objects.create(
            submission=past_sub_bom, agent=agent_suresh, branch=b2,
            discrepancy_type="EXCESS",
            expected_amount=Decimal("35000.00"),
            actual_amount=Decimal("35500.00"),
            difference_amount=Decimal("500.00"),
            status="RESOLVED",
            resolution_notes="Extra ₹500 traced to customer Anita's advance payment. Adjusted in next EMI cycle."
        )

        # === MUMBAI: 2 bank deposits in clearing (for Finance Admin) ===
        dep_bom_clearing1 = BankDeposit.objects.create(
            deposit_slip_no="DEP-20261013-BOM01",
            branch=b2, created_by=mgr_karan,
            bank_name="ICICI Bank", account_no="66100998877",
            deposited_amount=Decimal("35500.00"),
            bank_reference_no="ICICI-RTGS-20261013-001",
            deposit_date=today - timedelta(days=4),
            status="DEPOSITED"
        )
        past_sub_bom.bank_deposit = dep_bom_clearing1
        past_sub_bom.save()

        dep_bom_clearing2 = BankDeposit.objects.create(
            deposit_slip_no="DEP-20261015-BOM02",
            branch=b2, created_by=mgr_karan,
            bank_name="Axis Bank", account_no="9200112233",
            deposited_amount=Decimal("22000.00"),
            bank_reference_no="AXIS-NEFT-20261015-002",
            deposit_date=today - timedelta(days=2),
            status="DEPOSITED"
        )

        # === MUMBAI: Past settled deposit ===
        BankDeposit.objects.create(
            deposit_slip_no="DEP-20261001-BOM03",
            branch=b2, created_by=mgr_karan,
            bank_name="ICICI Bank", account_no="66100998877",
            deposited_amount=Decimal("62000.00"),
            settled_amount=Decimal("62000.00"),
            bank_reference_no="ICICI-NEFT-2026100199",
            deposit_date=today - timedelta(days=16),
            status="SETTLED",
            settled_at=timezone.now() - timedelta(days=15),
            settled_by=admin_vikram
        )

        #  ┌─────────────────────────────────────────────────────────┐
        #  │  DELHI NCR BRANCH (b3) — Arjun                         │
        #  └─────────────────────────────────────────────────────────┘

        # === AGENT ARJUN: 3 fresh COLLECTED (unsubmitted) ===
        for idx in [15, 16, 17]:
            sch = loans[idx].schedules.first()
            amounts = [Decimal("9200"), Decimal("10250"), Decimal("5900")]
            _pay_schedule(loans[idx], sch, amounts[idx - 15])
            Collection.objects.create(
                receipt_no=f"RCP-{today.strftime('%Y%m%d')}-A{idx-14:03d}",
                schedule=sch, loan=loans[idx], customer=customers[idx],
                agent=agent_arjun, amount_collected=amounts[idx - 15],
                payment_mode="CASH", status="COLLECTED",
                idempotency_key=str(uuid.uuid4()),
                notes=f"Collected today by Arjun from {customers[idx].full_name}."
            )

        # === AGENT ARJUN: 1 pending submission (for Neha to verify) ===
        sch18 = loans[18].schedules.first()
        _pay_schedule(loans[18], sch18, Decimal("7712"))
        col_arj_sub1 = Collection.objects.create(
            receipt_no=f"RCP-{(today - timedelta(days=1)).strftime('%Y%m%d')}-A004",
            schedule=sch18, loan=loans[18], customer=customers[18],
            agent=agent_arjun, amount_collected=Decimal("7712"),
            payment_mode="CASH", status="SUBMITTED",
            idempotency_key=str(uuid.uuid4()),
            notes="Collected yesterday, submitted."
        )
        sch19 = loans[19].schedules.first()
        _pay_schedule(loans[19], sch19, Decimal("9333"))
        col_arj_sub2 = Collection.objects.create(
            receipt_no=f"RCP-{(today - timedelta(days=1)).strftime('%Y%m%d')}-A005",
            schedule=sch19, loan=loans[19], customer=customers[19],
            agent=agent_arjun, amount_collected=Decimal("9333"),
            payment_mode="CASH", status="SUBMITTED",
            idempotency_key=str(uuid.uuid4()),
            notes="Collected yesterday, submitted."
        )
        pending_sub_del1 = CashSubmission.objects.create(
            submission_no="SUB-20261016-DEL01",
            agent=agent_arjun, branch=b3,
            declared_amount=Decimal("17045.00"),
            status="PENDING",
            denominations={"500": 30, "200": 10, "100": 20, "50": 9}
        )
        col_arj_sub1.submission = pending_sub_del1
        col_arj_sub1.save()
        col_arj_sub2.submission = pending_sub_del1
        col_arj_sub2.save()

        # === DELHI: Past approved submission with SHORTAGE ===
        past_sub_del = CashSubmission.objects.create(
            submission_no="SUB-20261009-DEL99",
            agent=agent_arjun, branch=b3,
            declared_amount=Decimal("28000.00"),
            verified_amount=Decimal("27200.00"),
            status="APPROVED",
            denominations={"500": 54, "200": 1},
            verified_by=mgr_neha,
            verified_at=timezone.now() - timedelta(days=8)
        )
        Discrepancy.objects.create(
            submission=past_sub_del, agent=agent_arjun, branch=b3,
            discrepancy_type="SHORTAGE",
            expected_amount=Decimal("28000.00"),
            actual_amount=Decimal("27200.00"),
            difference_amount=Decimal("800.00"),
            status="OPEN",
            resolution_notes="Arjun reports two ₹200 notes and two ₹200 notes were counterfeit. Under investigation."
        )

        # === DELHI: Bank deposit in clearing ===
        dep_del_clearing = BankDeposit.objects.create(
            deposit_slip_no="DEP-20261012-DEL01",
            branch=b3, created_by=mgr_neha,
            bank_name="Punjab National Bank", account_no="4455667788",
            deposited_amount=Decimal("27200.00"),
            bank_reference_no="PNB-NEFT-20261012-001",
            deposit_date=today - timedelta(days=5),
            status="DEPOSITED"
        )
        past_sub_del.bank_deposit = dep_del_clearing
        past_sub_del.save()

        # === DELHI: Past settled deposit ===
        BankDeposit.objects.create(
            deposit_slip_no="DEP-20261002-DEL02",
            branch=b3, created_by=mgr_neha,
            bank_name="Punjab National Bank", account_no="4455667788",
            deposited_amount=Decimal("45000.00"),
            settled_amount=Decimal("45000.00"),
            bank_reference_no="PNB-NEFT-2026100299",
            deposit_date=today - timedelta(days=15),
            status="SETTLED",
            settled_at=timezone.now() - timedelta(days=14),
            settled_by=admin_vikram
        )

        # ═══════════════════════════════════════════════════════════
        # 6. AUDIT LOG
        # ═══════════════════════════════════════════════════════════
        self.stdout.write(self.style.SUCCESS("Creating Audit Logs..."))
        AuditLog.objects.create(
            entity_type="System", entity_id="SETUP",
            action="INITIAL_SEED_LOADED", performed_by=admin_vikram,
            payload_before={},
            payload_after={
                "branches": 3, "agents": 5, "managers": 3,
                "customers": 20, "loans": 20,
                "pending_submissions": 5, "deposits_in_clearing": 4,
            }
        )

        self.stdout.write(self.style.SUCCESS("""
===============================================================
  CMRS SEED DATA LOADED -- RICH DEMO READY!
===============================================================

  DEMO ACCOUNTS (Password for all: pass123)
  -------------------------------------------
  Collection Agents:
    1. ramesh_agent  (Ramesh Kumar)    -- Bangalore South
    2. meera_agent   (Meera Iyer)      -- Bangalore South
    3. suresh_agent  (Suresh Patel)    -- Mumbai Central
    4. fatima_agent  (Fatima Sheikh)   -- Mumbai Central
    5. arjun_agent   (Arjun Reddy)    -- Delhi NCR

  Branch Managers:
    6. priya_manager (Priya Sharma)    -- Bangalore South
    7. karan_manager (Karan Malhotra)  -- Mumbai Central
    8. neha_manager  (Neha Kapoor)     -- Delhi NCR

  Finance Admin / HQ:
    9. vikram_admin  (Vikram Seth)     -- Head Office

  QUICK AUTH (Role Switcher uses):
    * agent@cmrs.fintech   -> Ramesh Kumar  (Collection Agent)
    * manager@cmrs.fintech -> Priya Sharma  (Branch Manager)
    * admin@cmrs.fintech   -> Vikram Seth   (Finance Admin)

  PENDING ACTIONS BY ROLE
  -------------------------------------------
  [AGENT] COLLECTION AGENT:
    * Ramesh:  3 unsubmitted collections (INR 17,500 cash in hand)
    * Meera:   2 unsubmitted collections (INR 9,500 cash in hand)
    * Suresh:  2 unsubmitted collections (INR 19,200 cash in hand)
    * Fatima:  2 unsubmitted collections (INR 14,500 cash in hand)
    * Arjun:   3 unsubmitted collections (INR 25,350 cash in hand)

  [MANAGER] BRANCH MANAGER:
    * Bangalore: 2 pending submissions (SUB-BLR01 INR 12,500 + SUB-BLR02 INR 7,200)
    * Mumbai:    2 pending submissions (SUB-BOM01 INR 25,833 + SUB-BOM02 INR 12,960)
    * Delhi:     1 pending submission  (SUB-DEL01 INR 17,045)

  [ADMIN] FINANCE ADMIN:
    * 4 bank deposits in clearing awaiting settlement:
      - DEP-BLR01 INR 48,500 (HDFC Bank)
      - DEP-BOM01 INR 35,500 (ICICI Bank)
      - DEP-BOM02 INR 22,000 (Axis Bank)
      - DEP-DEL01 INR 27,200 (PNB)

  DISCREPANCIES:
    * BLR: INR 1,500 SHORTAGE (OPEN)
    * BOM: INR 500 EXCESS (RESOLVED)
    * DEL: INR 800 SHORTAGE (OPEN)
===============================================================
        """))
