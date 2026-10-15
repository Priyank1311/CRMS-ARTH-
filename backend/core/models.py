import uuid
from decimal import Decimal
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class Branch(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=120)
    code = models.CharField(max_length=30, unique=True)
    address = models.TextField()
    city = models.CharField(max_length=60)
    vault_cash_balance = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.code})"

    class Meta:
        verbose_name_plural = "Branches"


class User(AbstractUser):
    ROLE_CHOICES = [
        ('COLLECTION_AGENT', 'Collection Agent'),
        ('BRANCH_MANAGER', 'Branch Manager'),
        ('FINANCE_ADMIN', 'Finance Admin / Head Office'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=25, choices=ROLE_CHOICES, default='COLLECTION_AGENT')
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True, related_name='staff')
    employee_id = models.CharField(max_length=40, unique=True, null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return f"{self.get_full_name() or self.username} [{self.get_role_display()}]"


class Customer(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer_code = models.CharField(max_length=40, unique=True)
    full_name = models.CharField(max_length=120)
    phone = models.CharField(max_length=20)
    address = models.TextField()
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='customers')
    assigned_agent = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_customers')
    kyc_verified = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.full_name} ({self.customer_code})"


class Loan(models.Model):
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('CLOSED', 'Closed'),
        ('DEFAULTED', 'Defaulted'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    loan_account_no = models.CharField(max_length=50, unique=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='loans')
    principal_amount = models.DecimalField(max_digits=12, decimal_places=2)
    interest_rate_pct = models.DecimalField(max_digits=5, decimal_places=2)
    tenure_months = models.IntegerField()
    total_payable = models.DecimalField(max_digits=12, decimal_places=2)
    total_paid = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    outstanding_amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    disbursed_at = models.DateField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.loan_account_no} - {self.customer.full_name} (₹{self.outstanding_amount} Due)"


class RepaymentSchedule(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PARTIALLY_PAID', 'Partially Paid'),
        ('PAID', 'Paid'),
        ('OVERDUE', 'Overdue'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    loan = models.ForeignKey(Loan, on_delete=models.CASCADE, related_name='schedules')
    installment_no = models.IntegerField()
    due_date = models.DateField()
    due_amount = models.DecimalField(max_digits=12, decimal_places=2)
    principal_component = models.DecimalField(max_digits=12, decimal_places=2)
    interest_component = models.DecimalField(max_digits=12, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')

    class Meta:
        unique_together = ('loan', 'installment_no')
        ordering = ['loan', 'installment_no']

    @property
    def remaining_due(self):
        return max(Decimal('0.00'), self.due_amount - self.paid_amount)

    def __str__(self):
        return f"{self.loan.loan_account_no} - EMI #{self.installment_no} (₹{self.remaining_due} rem)"


class BankDeposit(models.Model):
    STATUS_CHOICES = [
        ('DEPOSITED', 'Deposited (In Clearing)'),
        ('SETTLED', 'Settled in Account'),
        ('SETTLEMENT_MISMATCH', 'Settlement Mismatch'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    deposit_slip_no = models.CharField(max_length=60, unique=True)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='bank_deposits')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_deposits')
    bank_name = models.CharField(max_length=120)
    account_no = models.CharField(max_length=40)
    deposited_amount = models.DecimalField(max_digits=12, decimal_places=2)
    bank_reference_no = models.CharField(max_length=80, unique=True)
    deposit_date = models.DateField(default=timezone.now)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='DEPOSITED')
    settled_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    settled_at = models.DateTimeField(null=True, blank=True)
    settled_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='settled_deposits')
    mismatch_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Deposit {self.deposit_slip_no} - ₹{self.deposited_amount} ({self.status})"


class CashSubmission(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending Verification'),
        ('APPROVED', 'Approved & Reconciled'),
        ('REJECTED', 'Rejected'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    submission_no = models.CharField(max_length=50, unique=True)
    agent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cash_submissions')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='cash_submissions')
    declared_amount = models.DecimalField(max_digits=12, decimal_places=2)
    verified_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    denominations = models.JSONField(default=dict, blank=True)
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_submissions')
    verified_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    bank_deposit = models.ForeignKey(BankDeposit, on_delete=models.SET_NULL, null=True, blank=True, related_name='submissions')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.submission_no} - {self.agent.get_full_name()} (Declared: ₹{self.declared_amount})"


class Collection(models.Model):
    STATUS_CHOICES = [
        ('COLLECTED', 'Collected by Agent'),
        ('SUBMITTED', 'Submitted to Branch'),
        ('BRANCH_RECONCILED', 'Reconciled at Branch'),
        ('BANK_DEPOSITED', 'Deposited in Bank'),
        ('SETTLED', 'Settled in Account'),
    ]

    PAYMENT_MODES = [
        ('CASH', 'Cash'),
        ('UPI_SANDBOX', 'UPI Digital (Sandbox)'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    receipt_no = models.CharField(max_length=60, unique=True)
    schedule = models.ForeignKey(RepaymentSchedule, on_delete=models.CASCADE, related_name='collections')
    loan = models.ForeignKey(Loan, on_delete=models.CASCADE, related_name='collections')
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='collections')
    agent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='collections')
    amount_collected = models.DecimalField(max_digits=12, decimal_places=2)
    payment_mode = models.CharField(max_length=20, choices=PAYMENT_MODES, default='CASH')
    status = models.CharField(max_length=25, choices=STATUS_CHOICES, default='COLLECTED')
    idempotency_key = models.CharField(max_length=64, unique=True)
    submission = models.ForeignKey(CashSubmission, on_delete=models.SET_NULL, null=True, blank=True, related_name='collections')
    collected_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.receipt_no} - ₹{self.amount_collected} by {self.agent.username}"


class Discrepancy(models.Model):
    DISCREPANCY_TYPES = [
        ('SHORTAGE', 'Cash Shortage'),
        ('EXCESS', 'Cash Excess'),
    ]

    STATUS_CHOICES = [
        ('OPEN', 'Open Discrepancy'),
        ('RESOLVED', 'Resolved / Recovered'),
        ('WRITTEN_OFF', 'Written Off'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    submission = models.OneToOneField(CashSubmission, on_delete=models.CASCADE, related_name='discrepancy')
    agent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='discrepancies')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='discrepancies')
    discrepancy_type = models.CharField(max_length=15, choices=DISCREPANCY_TYPES)
    expected_amount = models.DecimalField(max_digits=12, decimal_places=2)
    actual_amount = models.DecimalField(max_digits=12, decimal_places=2)
    difference_amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    resolution_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.discrepancy_type} ₹{self.difference_amount} - {self.agent.username} ({self.submission.submission_no})"


class AuditLog(models.Model):
    id = models.BigAutoField(primary_key=True)
    entity_type = models.CharField(max_length=50)
    entity_id = models.CharField(max_length=100)
    action = models.CharField(max_length=60)
    performed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    payload_before = models.JSONField(default=dict)
    payload_after = models.JSONField(default=dict)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        actor = self.performed_by.username if self.performed_by else 'System'
        return f"[{self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}] {actor} - {self.action} on {self.entity_type} {self.entity_id}"
