from decimal import Decimal
import uuid
from django.test import TestCase
from django.utils import timezone
from django.core.exceptions import ValidationError
from core.models import (
    Branch, User, Customer, Loan, RepaymentSchedule,
    Collection, CashSubmission, Discrepancy, BankDeposit
)
from core.services import FinancialService

class CMRSFinancialLifecycleTestCase(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(
            name="Bangalore Test Branch",
            code="BR-TEST-01",
            address="123 Test Rd",
            city="Bangalore",
            vault_cash_balance=Decimal("50000.00")
        )

        self.agent = User.objects.create_user(
            username="test_agent",
            email="agent@test.com",
            password="pass",
            role="COLLECTION_AGENT",
            branch=self.branch
        )

        self.manager = User.objects.create_user(
            username="test_manager",
            email="manager@test.com",
            password="pass",
            role="BRANCH_MANAGER",
            branch=self.branch
        )

        self.admin = User.objects.create_user(
            username="test_admin",
            email="admin@test.com",
            password="pass",
            role="FINANCE_ADMIN"
        )

        self.customer = Customer.objects.create(
            customer_code="CUST-TEST-001",
            full_name="Karan Verma",
            phone="+91 99999 88888",
            address="Test Lane",
            branch=self.branch,
            assigned_agent=self.agent
        )

        # Loan of 30,000 with 3 EMIs of 10,000 each
        self.loan = Loan.objects.create(
            loan_account_no="LN-TEST-001",
            customer=self.customer,
            principal_amount=Decimal("30000.00"),
            interest_rate_pct=Decimal("0.00"),
            tenure_months=3,
            total_payable=Decimal("30000.00"),
            total_paid=Decimal("0.00"),
            outstanding_amount=Decimal("30000.00"),
            status="ACTIVE"
        )

        self.sch1 = RepaymentSchedule.objects.create(
            loan=self.loan,
            installment_no=1,
            due_date=timezone.now().date(),
            due_amount=Decimal("10000.00"),
            principal_component=Decimal("10000.00"),
            interest_component=Decimal("0.00"),
            paid_amount=Decimal("0.00"),
            status="PENDING"
        )

        self.sch2 = RepaymentSchedule.objects.create(
            loan=self.loan,
            installment_no=2,
            due_date=timezone.now().date(),
            due_amount=Decimal("10000.00"),
            principal_component=Decimal("10000.00"),
            interest_component=Decimal("0.00"),
            paid_amount=Decimal("0.00"),
            status="PENDING"
        )

    def test_partial_repayment(self):
        """Test partial payment: schedule status becomes PARTIALLY_PAID and loan balance reduces."""
        col = FinancialService.record_collection(
            agent=self.agent,
            schedule_id=self.sch1.id,
            amount=Decimal("4000.00"),
            payment_mode="CASH"
        )

        self.sch1.refresh_from_db()
        self.loan.refresh_from_db()

        self.assertEqual(self.sch1.paid_amount, Decimal("4000.00"))
        self.assertEqual(self.sch1.status, "PARTIALLY_PAID")
        self.assertEqual(self.sch1.remaining_due, Decimal("6000.00"))
        self.assertEqual(self.loan.outstanding_amount, Decimal("26000.00"))
        self.assertEqual(col.status, "COLLECTED")
        self.assertTrue(col.receipt_no.startswith("RCP-"))

    def test_over_collection_cascades_to_next_schedule(self):
        """Test excess payment: current schedule marks PAID and surplus clears into upcoming schedule."""
        col = FinancialService.record_collection(
            agent=self.agent,
            schedule_id=self.sch1.id,
            amount=Decimal("14000.00"),
            payment_mode="CASH"
        )

        self.sch1.refresh_from_db()
        self.sch2.refresh_from_db()
        self.loan.refresh_from_db()

        # Sch1 is completely paid (10,000)
        self.assertEqual(self.sch1.paid_amount, Decimal("10000.00"))
        self.assertEqual(self.sch1.status, "PAID")

        # Sch2 absorbed the remaining 4,000
        self.assertEqual(self.sch2.paid_amount, Decimal("4000.00"))
        self.assertEqual(self.sch2.status, "PARTIALLY_PAID")

        self.assertEqual(self.loan.total_paid, Decimal("14000.00"))
        self.assertEqual(self.loan.outstanding_amount, Decimal("16000.00"))

    def test_idempotency_duplicate_protection(self):
        """Test idempotency: identical idempotency_key does not double-charge loan."""
        key = "unique-client-uuid-123"
        col1 = FinancialService.record_collection(
            agent=self.agent,
            schedule_id=self.sch1.id,
            amount=Decimal("5000.00"),
            idempotency_key=key
        )
        col2 = FinancialService.record_collection(
            agent=self.agent,
            schedule_id=self.sch1.id,
            amount=Decimal("5000.00"),
            idempotency_key=key
        )

        self.assertEqual(col1.id, col2.id)
        self.loan.refresh_from_db()
        self.assertEqual(self.loan.total_paid, Decimal("5000.00"))

    def test_branch_reconciliation_exact(self):
        """Test submission creation and exact manager approval crediting branch vault."""
        col = FinancialService.record_collection(
            agent=self.agent,
            schedule_id=self.sch1.id,
            amount=Decimal("10000.00")
        )

        sub = FinancialService.create_cash_submission(
            agent=self.agent,
            collection_ids=[col.id]
        )
        self.assertEqual(sub.status, "PENDING")
        self.assertEqual(sub.declared_amount, Decimal("10000.00"))

        col.refresh_from_db()
        self.assertEqual(col.status, "SUBMITTED")

        initial_vault = self.branch.vault_cash_balance

        verified_sub = FinancialService.verify_cash_submission(
            manager=self.manager,
            submission_id=sub.id,
            counted_amount=Decimal("10000.00"),
            action="APPROVE"
        )

        self.assertEqual(verified_sub.status, "APPROVED")
        col.refresh_from_db()
        self.assertEqual(col.status, "BRANCH_RECONCILED")

        self.branch.refresh_from_db()
        self.assertEqual(self.branch.vault_cash_balance, initial_vault + Decimal("10000.00"))
        self.assertFalse(Discrepancy.objects.filter(submission=sub).exists())

    def test_branch_reconciliation_shortage_discrepancy(self):
        """Test cash discrepancy: Expected 50,000, Received 48,500, creates Discrepancy model."""
        col = FinancialService.record_collection(
            agent=self.agent,
            schedule_id=self.sch1.id,
            amount=Decimal("10000.00")
        )
        sub = FinancialService.create_cash_submission(agent=self.agent, collection_ids=[col.id])

        # Manager counts only 8,500 (Shortage of 1,500)
        verified_sub = FinancialService.verify_cash_submission(
            manager=self.manager,
            submission_id=sub.id,
            counted_amount=Decimal("8500.00"),
            action="APPROVE"
        )

        disc = Discrepancy.objects.get(submission=verified_sub)
        self.assertEqual(disc.discrepancy_type, "SHORTAGE")
        self.assertEqual(disc.difference_amount, Decimal("1500.00"))
        self.assertEqual(disc.status, "OPEN")

    def test_submission_rejection_resets_collections(self):
        """Test rejection: submission marked REJECTED, collections reset to COLLECTED."""
        col = FinancialService.record_collection(
            agent=self.agent,
            schedule_id=self.sch1.id,
            amount=Decimal("5000.00")
        )
        sub = FinancialService.create_cash_submission(agent=self.agent, collection_ids=[col.id])

        verified_sub = FinancialService.verify_cash_submission(
            manager=self.manager,
            submission_id=sub.id,
            counted_amount=Decimal("0.00"),
            action="REJECT",
            rejection_reason="Envelope seal broken"
        )

        self.assertEqual(verified_sub.status, "REJECTED")
        col.refresh_from_db()
        self.assertEqual(col.status, "COLLECTED")
        self.assertIsNone(col.submission)

    def test_bank_deposit_and_settlement_workflow(self):
        """Test full bank deposit creation from vault and settlement in company account."""
        col = FinancialService.record_collection(
            agent=self.agent,
            schedule_id=self.sch1.id,
            amount=Decimal("10000.00")
        )
        sub = FinancialService.create_cash_submission(agent=self.agent, collection_ids=[col.id])
        FinancialService.verify_cash_submission(
            manager=self.manager,
            submission_id=sub.id,
            counted_amount=Decimal("10000.00"),
            action="APPROVE"
        )

        # Deposit into bank
        self.branch.refresh_from_db()
        vault_before = self.branch.vault_cash_balance

        deposit = FinancialService.create_bank_deposit(
            manager=self.manager,
            branch_id=self.branch.id,
            submission_ids=[sub.id],
            bank_name="Axis Bank",
            account_no="9190100223344",
            bank_reference_no="AXIS-REF-9090",
            deposit_date=timezone.now().date()
        )

        self.assertEqual(deposit.status, "DEPOSITED")
        self.branch.refresh_from_db()
        self.assertEqual(self.branch.vault_cash_balance, vault_before - Decimal("10000.00"))

        col.refresh_from_db()
        self.assertEqual(col.status, "BANK_DEPOSITED")

        # Finance settles deposit
        settled_dep = FinancialService.settle_bank_deposit(
            finance_admin=self.admin,
            deposit_id=deposit.id,
            credited_amount=Decimal("10000.00")
        )

        self.assertEqual(settled_dep.status, "SETTLED")
        col.refresh_from_db()
        self.assertEqual(col.status, "SETTLED")

    def test_settlement_mismatch_flagged(self):
        """Test bank credit mismatch flags SETTLEMENT_MISMATCH."""
        col = FinancialService.record_collection(
            agent=self.agent,
            schedule_id=self.sch1.id,
            amount=Decimal("10000.00")
        )
        sub = FinancialService.create_cash_submission(agent=self.agent, collection_ids=[col.id])
        FinancialService.verify_cash_submission(
            manager=self.manager,
            submission_id=sub.id,
            counted_amount=Decimal("10000.00"),
            action="APPROVE"
        )
        deposit = FinancialService.create_bank_deposit(
            manager=self.manager,
            branch_id=self.branch.id,
            submission_ids=[sub.id],
            bank_name="ICICI Bank",
            account_no="1122334455",
            bank_reference_no="ICICI-REF-1122"
        )

        # Bank statement only credited 9,500 (500 counterfeit note rejected)
        settled_dep = FinancialService.settle_bank_deposit(
            finance_admin=self.admin,
            deposit_id=deposit.id,
            credited_amount=Decimal("9500.00"),
            mismatch_reason="INR 500 fake note detected by bank teller"
        )

        self.assertEqual(settled_dep.status, "SETTLEMENT_MISMATCH")
        self.assertIn("INR 500 fake note", settled_dep.mismatch_reason)
