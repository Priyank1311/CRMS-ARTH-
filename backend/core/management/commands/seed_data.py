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
    help = 'Seeds database with realistic branches, users, loans, collections, and discrepancies for CMRS demo'

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

        self.stdout.write(self.style.SUCCESS("Creating Users & Roles..."))
        # 1. Collection Agent: Ramesh Kumar
        agent = User.objects.create_user(
            username="ramesh_agent",
            email="agent@cmrs.fintech",
            password="pass123",
            first_name="Ramesh",
            last_name="Kumar",
            role="COLLECTION_AGENT",
            branch=b1,
            employee_id="EMP-AG-101",
            phone="+91 98450 12345"
        )

        # 2. Collection Agent 2: Suresh Patel (Mumbai)
        agent2 = User.objects.create_user(
            username="suresh_agent",
            email="agent2@cmrs.fintech",
            password="pass123",
            first_name="Suresh",
            last_name="Patel",
            role="COLLECTION_AGENT",
            branch=b2,
            employee_id="EMP-AG-102",
            phone="+91 98200 54321"
        )

        # 3. Branch Manager: Priya Sharma (Bangalore)
        manager = User.objects.create_user(
            username="priya_manager",
            email="manager@cmrs.fintech",
            password="pass123",
            first_name="Priya",
            last_name="Sharma",
            role="BRANCH_MANAGER",
            branch=b1,
            employee_id="EMP-BM-201",
            phone="+91 98800 67890"
        )

        # 4. Finance Admin: Vikram Seth (Head Office)
        admin = User.objects.create_superuser(
            username="vikram_admin",
            email="admin@cmrs.fintech",
            password="pass123",
            first_name="Vikram",
            last_name="Seth",
            role="FINANCE_ADMIN",
            employee_id="EMP-HQ-001",
            phone="+91 99000 11223"
        )

        self.stdout.write(self.style.SUCCESS("Creating Customers & Loans..."))
        customer_data = [
            ("Aarav Patel", "CUST-BLR-001", "+91 91234 56789", "Indiranagar, Bangalore", b1, agent),
            ("Sunita Verma", "CUST-BLR-002", "+91 92345 67890", "HSR Layout, Bangalore", b1, agent),
            ("Deepak Rao", "CUST-BLR-003", "+91 93456 78901", "BTM Layout, Bangalore", b1, agent),
            ("Lakshmi Devi", "CUST-BLR-004", "+91 94567 89012", "Jayanagar, Bangalore", b1, agent),
            ("Rajesh Gupta", "CUST-BLR-005", "+91 95678 90123", "Electronic City, Bangalore", b1, agent),
            ("Anita Singh", "CUST-BOM-001", "+91 96789 01234", "Andheri West, Mumbai", b2, agent2),
            ("Mohammed Irfan", "CUST-BOM-002", "+91 97890 12345", "Bandra East, Mumbai", b2, agent2),
            ("Kavita Nair", "CUST-BOM-003", "+91 98901 23456", "Thane West, Mumbai", b2, agent2),
        ]

        created_customers = []
        for name, code, phone, addr, branch, ag in customer_data:
            cust = Customer.objects.create(
                customer_code=code,
                full_name=name,
                phone=phone,
                address=addr,
                branch=branch,
                assigned_agent=ag,
                kyc_verified=True
            )
            created_customers.append(cust)

        # Create loans and 6 EMIs for each
        today = timezone.now().date()
        loan_configs = [
            (Decimal("60000.00"), Decimal("15.00"), 6),
            (Decimal("45000.00"), Decimal("14.00"), 6),
            (Decimal("80000.00"), Decimal("16.00"), 8),
            (Decimal("30000.00"), Decimal("12.00"), 6),
            (Decimal("50000.00"), Decimal("15.00"), 6),
            (Decimal("75000.00"), Decimal("15.50"), 6),
            (Decimal("40000.00"), Decimal("13.00"), 6),
            (Decimal("90000.00"), Decimal("17.00"), 6),
        ]

        created_loans = []
        for i, cust in enumerate(created_customers):
            principal, rate, tenure = loan_configs[i]
            # Simple interest calculation for demo
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
                disbursed_at=today - timedelta(days=60)
            )
            created_loans.append(loan)

            # Generate monthly schedules
            principal_per_emi = (principal / tenure).quantize(Decimal("0.01"))
            interest_per_emi = (total_interest / tenure).quantize(Decimal("0.01"))

            for m in range(1, tenure + 1):
                due_d = (today - timedelta(days=60)) + timedelta(days=30 * m)
                sch_status = "OVERDUE" if due_d < today else "PENDING"
                RepaymentSchedule.objects.create(
                    loan=loan,
                    installment_no=m,
                    due_date=due_d,
                    due_amount=monthly_emi,
                    principal_component=principal_per_emi,
                    interest_component=interest_per_emi,
                    paid_amount=Decimal("0.00"),
                    status=sch_status
                )

        self.stdout.write(self.style.SUCCESS("Creating Pre-seeded Collections & Submissions..."))
        # Scenario A: Ramesh collects ₹5,000 and ₹4,500 today (Status = COLLECTED, cash in hand!)
        l1_sch1 = created_loans[0].schedules.first()
        l1_sch1.paid_amount = Decimal("5000.00")
        l1_sch1.status = "PARTIALLY_PAID" if l1_sch1.due_amount > Decimal("5000.00") else "PAID"
        l1_sch1.save()
        created_loans[0].total_paid += Decimal("5000.00")
        created_loans[0].outstanding_amount -= Decimal("5000.00")
        created_loans[0].save()

        col1 = Collection.objects.create(
            receipt_no="RCP-20261015-8801",
            schedule=l1_sch1,
            loan=created_loans[0],
            customer=created_customers[0],
            agent=agent,
            amount_collected=Decimal("5000.00"),
            payment_mode="CASH",
            status="COLLECTED",
            idempotency_key=str(uuid.uuid4()),
            notes="Collected on field in cash (Indiranagar)."
        )

        l2_sch1 = created_loans[1].schedules.first()
        l2_sch1.paid_amount = Decimal("4500.00")
        l2_sch1.status = "PARTIALLY_PAID"
        l2_sch1.save()
        created_loans[1].total_paid += Decimal("4500.00")
        created_loans[1].outstanding_amount -= Decimal("4500.00")
        created_loans[1].save()

        col2 = Collection.objects.create(
            receipt_no="RCP-20261015-8802",
            schedule=l2_sch1,
            loan=created_loans[1],
            customer=created_customers[1],
            agent=agent,
            amount_collected=Decimal("4500.00"),
            payment_mode="CASH",
            status="COLLECTED",
            idempotency_key=str(uuid.uuid4()),
            notes="Cash partial repayment."
        )

        # Scenario B: Ramesh submitted a batch yesterday of ₹15,000 that is PENDING Branch Manager approval
        l3_sch1 = created_loans[2].schedules.first()
        l3_sch1.paid_amount = Decimal("10000.00")
        l3_sch1.status = "PAID"
        l3_sch1.save()
        created_loans[2].total_paid += Decimal("10000.00")
        created_loans[2].outstanding_amount -= Decimal("10000.00")
        created_loans[2].save()

        col3 = Collection.objects.create(
            receipt_no="RCP-20261014-7701",
            schedule=l3_sch1,
            loan=created_loans[2],
            customer=created_customers[2],
            agent=agent,
            amount_collected=Decimal("10000.00"),
            payment_mode="CASH",
            status="SUBMITTED",
            idempotency_key=str(uuid.uuid4()),
            notes="Cash collected yesterday."
        )

        l4_sch1 = created_loans[3].schedules.first()
        l4_sch1.paid_amount = Decimal("5000.00")
        l4_sch1.status = "PAID"
        l4_sch1.save()
        created_loans[3].total_paid += Decimal("5000.00")
        created_loans[3].outstanding_amount -= Decimal("5000.00")
        created_loans[3].save()

        col4 = Collection.objects.create(
            receipt_no="RCP-20261014-7702",
            schedule=l4_sch1,
            loan=created_loans[3],
            customer=created_customers[3],
            agent=agent,
            amount_collected=Decimal("5000.00"),
            payment_mode="CASH",
            status="SUBMITTED",
            idempotency_key=str(uuid.uuid4()),
            notes="Cash collected yesterday."
        )

        pending_sub = CashSubmission.objects.create(
            submission_no="SUB-20261014-001",
            agent=agent,
            branch=b1,
            declared_amount=Decimal("15000.00"),
            status="PENDING",
            denominations={"500": 26, "200": 5, "100": 10}
        )
        col3.submission = pending_sub
        col3.save()
        col4.submission = pending_sub
        col4.save()

        # Scenario C: Past Discrepancy Example from Problem Statement
        # Expected: ₹50,000, Received: ₹48,500, Difference: ₹1,500
        disc_sub = CashSubmission.objects.create(
            submission_no="SUB-20261010-099",
            agent=agent,
            branch=b1,
            declared_amount=Decimal("50000.00"),
            verified_amount=Decimal("48500.00"),
            status="APPROVED",
            denominations={"500": 97},
            verified_by=manager,
            verified_at=timezone.now() - timedelta(days=5)
        )
        Discrepancy.objects.create(
            submission=disc_sub,
            agent=agent,
            branch=b1,
            discrepancy_type="SHORTAGE",
            expected_amount=Decimal("50000.00"),
            actual_amount=Decimal("48500.00"),
            difference_amount=Decimal("1500.00"),
            status="OPEN",
            resolution_notes="Agent Ramesh reported ₹1,500 cash packet dropped during transit. Under active recovery."
        )

        # Scenario D: Bank Deposit in Clearing (Pending Finance Settlement)
        dep1 = BankDeposit.objects.create(
            deposit_slip_no="DEP-20261014-001",
            branch=b1,
            created_by=manager,
            bank_name="HDFC Bank",
            account_no="50200088991122",
            deposited_amount=Decimal("48500.00"),
            bank_reference_no="HDFC-CHQ-9912048",
            deposit_date=today - timedelta(days=1),
            status="DEPOSITED"
        )
        disc_sub.bank_deposit = dep1
        disc_sub.save()

        # Scenario E: Settled Bank Deposit in Corporate Account
        settled_dep = BankDeposit.objects.create(
            deposit_slip_no="DEP-20261005-001",
            branch=b1,
            created_by=manager,
            bank_name="State Bank of India",
            account_no="301122334455",
            deposited_amount=Decimal("80000.00"),
            settled_amount=Decimal("80000.00"),
            bank_reference_no="SBI-NEFT-4411990",
            deposit_date=today - timedelta(days=10),
            status="SETTLED",
            settled_at=timezone.now() - timedelta(days=9),
            settled_by=admin
        )

        self.stdout.write(self.style.SUCCESS("Audit logs created."))
        AuditLog.objects.create(
            entity_type="System",
            entity_id="SETUP",
            action="INITIAL_SEED_LOADED",
            performed_by=admin,
            payload_before={},
            payload_after={"branches": 3, "customers": 8, "loans": 8}
        )

        self.stdout.write(self.style.SUCCESS("""
=============================================================
  CMRS SEED DATA LOADED SUCCESSFULLY!
=============================================================
  Demo Accounts (Password for all: pass123):
  1. Collection Agent:   agent@cmrs.fintech  (Ramesh Kumar)
  2. Branch Manager:     manager@cmrs.fintech (Priya Sharma)
  3. Finance Admin / HQ: admin@cmrs.fintech   (Vikram Seth)

  Pre-loaded Workflows:
  - Agent Ramesh has INR 9,500 in active unsubmitted cash collections
  - Pending Handover Batch SUB-20261014-001 (INR 15,000) waiting for Priya
  - Active Discrepancy: Shortage INR 1,500 (Expected INR 50,000, Received INR 48,500)
  - Bank Deposit DEP-20261014-001 (INR 48,500) in clearing waiting for Vikram
=============================================================
        """))
