from rest_framework import serializers
from decimal import Decimal
from .models import (
    Branch, User, Customer, Loan, RepaymentSchedule,
    CashSubmission, Collection, Discrepancy, BankDeposit, AuditLog
)

class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = '__all__'


class UserSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'branch', 'branch_name', 'employee_id', 'phone']


class CustomerSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    assigned_agent_name = serializers.CharField(source='assigned_agent.get_full_name', read_only=True)

    class Meta:
        model = Customer
        fields = '__all__'


class CreateCustomerInputSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=120)
    phone = serializers.CharField(max_length=20)
    address = serializers.CharField()
    branch_id = serializers.UUIDField(required=False)
    assigned_agent_id = serializers.UUIDField(required=False, allow_null=True)


class CreateLoanInputSerializer(serializers.Serializer):
    customer_id = serializers.UUIDField()
    principal_amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal('100.00'))
    interest_rate_pct = serializers.DecimalField(max_digits=5, decimal_places=2, min_value=Decimal('0.00'))
    tenure_months = serializers.IntegerField(min_value=1, max_value=60)
    disbursed_at = serializers.DateField(required=False)


class RepaymentScheduleSerializer(serializers.ModelSerializer):
    remaining_due = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = RepaymentSchedule
        fields = '__all__'


class LoanSerializer(serializers.ModelSerializer):
    customer = CustomerSerializer(read_only=True)
    schedules = RepaymentScheduleSerializer(many=True, read_only=True)

    class Meta:
        model = Loan
        fields = '__all__'


class CollectionSerializer(serializers.ModelSerializer):
    agent_name = serializers.CharField(source='agent.get_full_name', read_only=True)
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)
    loan_account_no = serializers.CharField(source='loan.loan_account_no', read_only=True)
    installment_no = serializers.IntegerField(source='schedule.installment_no', read_only=True)

    class Meta:
        model = Collection
        fields = '__all__'


class RecordCollectionInputSerializer(serializers.Serializer):
    schedule_id = serializers.UUIDField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal('0.01'))
    payment_mode = serializers.ChoiceField(choices=['CASH', 'UPI_SANDBOX'], default='CASH')
    idempotency_key = serializers.CharField(max_length=64, required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)


class DiscrepancySerializer(serializers.ModelSerializer):
    agent_name = serializers.CharField(source='agent.get_full_name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    submission_no = serializers.CharField(source='submission.submission_no', read_only=True)

    class Meta:
        model = Discrepancy
        fields = '__all__'


class CashSubmissionSerializer(serializers.ModelSerializer):
    agent_name = serializers.CharField(source='agent.get_full_name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by.get_full_name', read_only=True)
    collection_count = serializers.IntegerField(source='collections.count', read_only=True)
    discrepancy = DiscrepancySerializer(read_only=True)

    class Meta:
        model = CashSubmission
        fields = '__all__'


class CreateSubmissionInputSerializer(serializers.Serializer):
    collection_ids = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=False
    )
    denominations = serializers.DictField(required=False, default=dict)


class VerifySubmissionInputSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['APPROVE', 'REJECT'])
    counted_amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, default=Decimal('0.00'))
    rejection_reason = serializers.CharField(required=False, allow_blank=True)
    resolution_notes = serializers.CharField(required=False, allow_blank=True)


class BankDepositSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    settled_by_name = serializers.CharField(source='settled_by.get_full_name', read_only=True)
    submissions_count = serializers.IntegerField(source='submissions.count', read_only=True)

    class Meta:
        model = BankDeposit
        fields = '__all__'


class CreateBankDepositInputSerializer(serializers.Serializer):
    submission_ids = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=False
    )
    bank_name = serializers.CharField(max_length=120)
    account_no = serializers.CharField(max_length=40)
    bank_reference_no = serializers.CharField(max_length=80)
    deposit_date = serializers.DateField(required=False)


class SettleBankDepositInputSerializer(serializers.Serializer):
    credited_amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal('0.00'))
    mismatch_reason = serializers.CharField(required=False, allow_blank=True)


class AuditLogSerializer(serializers.ModelSerializer):
    performed_by_name = serializers.CharField(source='performed_by.username', read_only=True)

    class Meta:
        model = AuditLog
        fields = '__all__'
