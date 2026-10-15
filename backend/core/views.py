from decimal import Decimal
from django.db.models import Sum, Q, Count
from django.utils import timezone
from rest_framework import viewsets, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema, OpenApiParameter

from .models import (
    Branch, User, Customer, Loan, RepaymentSchedule,
    CashSubmission, Collection, Discrepancy, BankDeposit, AuditLog
)
from .serializers import (
    BranchSerializer, UserSerializer, CustomerSerializer,
    CreateCustomerInputSerializer, CreateLoanInputSerializer,
    LoanSerializer, RepaymentScheduleSerializer, CollectionSerializer,
    RecordCollectionInputSerializer, CashSubmissionSerializer,
    CreateSubmissionInputSerializer, VerifySubmissionInputSerializer,
    DiscrepancySerializer, BankDepositSerializer,
    CreateBankDepositInputSerializer, SettleBankDepositInputSerializer,
    AuditLogSerializer
)
from .services import FinancialService, CMRSServiceException
from .permissions import IsCollectionAgent, IsBranchManager, IsFinanceAdmin


class QuickAuthView(APIView):
    """
    Convenient 1-Click demo authentication endpoint.
    Allows instant login as Agent, Branch Manager, or Finance Admin.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        role = request.data.get('role', 'COLLECTION_AGENT')
        user = User.objects.filter(role=role).first()
        if not user:
            # Fallback to any user or create
            user = User.objects.filter(is_superuser=True).first()
            if not user:
                return Response({'error': f'No user found with role {role}'}, status=status.HTTP_404_NOT_FOUND)

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        })


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        serializer = UserSerializer(user)
        data = serializer.data

        # Add role-specific contextual summary
        if user.role == 'COLLECTION_AGENT':
            unsubmitted_cash = Collection.objects.filter(
                agent=user,
                status='COLLECTED'
            ).aggregate(total=Sum('amount_collected'))['total'] or Decimal('0.00')
            data['cash_in_hand'] = unsubmitted_cash
        elif user.role == 'BRANCH_MANAGER' and user.branch:
            data['vault_cash_balance'] = user.branch.vault_cash_balance

        return Response(data)


class DashboardMetricsView(APIView):
    """
    Fintech Liquidity & Collections Analytics Pipeline:
    Expected -> Collected -> Branch Received -> Bank Deposited -> Settled
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        branch_id = request.query_params.get('branch_id')

        # Base querysets
        loans_qs = Loan.objects.all()
        schedules_qs = RepaymentSchedule.objects.all()
        collections_qs = Collection.objects.all()
        submissions_qs = CashSubmission.objects.all()
        deposits_qs = BankDeposit.objects.all()
        discrepancies_qs = Discrepancy.objects.all()

        # Scoping based on role and branch filter
        if user.role == 'COLLECTION_AGENT':
            collections_qs = collections_qs.filter(agent=user)
            schedules_qs = schedules_qs.filter(loan__customer__assigned_agent=user)
            loans_qs = loans_qs.filter(customer__assigned_agent=user)
            submissions_qs = submissions_qs.filter(agent=user)
            discrepancies_qs = discrepancies_qs.filter(agent=user)
        elif user.role == 'BRANCH_MANAGER':
            target_branch = user.branch
            if target_branch:
                collections_qs = collections_qs.filter(agent__branch=target_branch)
                schedules_qs = schedules_qs.filter(loan__customer__branch=target_branch)
                loans_qs = loans_qs.filter(customer__branch=target_branch)
                submissions_qs = submissions_qs.filter(branch=target_branch)
                deposits_qs = deposits_qs.filter(branch=target_branch)
                discrepancies_qs = discrepancies_qs.filter(branch=target_branch)
        elif branch_id:
            collections_qs = collections_qs.filter(agent__branch_id=branch_id)
            schedules_qs = schedules_qs.filter(loan__customer__branch_id=branch_id)
            loans_qs = loans_qs.filter(customer__branch_id=branch_id)
            submissions_qs = submissions_qs.filter(branch_id=branch_id)
            deposits_qs = deposits_qs.filter(branch_id=branch_id)
            discrepancies_qs = discrepancies_qs.filter(branch_id=branch_id)

        agent_id = request.query_params.get('agent_id')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')

        if agent_id:
            collections_qs = collections_qs.filter(agent_id=agent_id)
            schedules_qs = schedules_qs.filter(loan__customer__assigned_agent_id=agent_id)
            loans_qs = loans_qs.filter(customer__assigned_agent_id=agent_id)
            submissions_qs = submissions_qs.filter(agent_id=agent_id)
            discrepancies_qs = discrepancies_qs.filter(agent_id=agent_id)

        if date_from:
            collections_qs = collections_qs.filter(collected_at__date__gte=date_from)
            schedules_qs = schedules_qs.filter(due_date__gte=date_from)
            deposits_qs = deposits_qs.filter(deposit_date__gte=date_from)

        if date_to:
            collections_qs = collections_qs.filter(collected_at__date__lte=date_to)
            schedules_qs = schedules_qs.filter(due_date__lte=date_to)
            deposits_qs = deposits_qs.filter(deposit_date__lte=date_to)

        # 1. Expected Collections (Outstanding EMI amounts)
        expected_collections = schedules_qs.filter(
            status__in=['PENDING', 'PARTIALLY_PAID', 'OVERDUE']
        ).aggregate(total=Sum('due_amount') - Sum('paid_amount'))['total'] or Decimal('0.00')

        # 2. Total Collected
        total_collected = collections_qs.aggregate(total=Sum('amount_collected'))['total'] or Decimal('0.00')

        # 3. Cash Held by Agents (In Transit: COLLECTED or SUBMITTED)
        cash_held_by_agents = collections_qs.filter(
            status__in=['COLLECTED', 'SUBMITTED']
        ).aggregate(total=Sum('amount_collected'))['total'] or Decimal('0.00')

        # 4. Cash Received at Branches (Reconciled & In Vault)
        cash_in_branch_vaults = Branch.objects.aggregate(total=Sum('vault_cash_balance'))['total'] or Decimal('0.00')
        if user.role == 'BRANCH_MANAGER' and user.branch:
            cash_in_branch_vaults = user.branch.vault_cash_balance

        # 5. Bank Deposits in Clearing
        bank_deposits_in_clearing = deposits_qs.filter(
            status='DEPOSITED'
        ).aggregate(total=Sum('deposited_amount'))['total'] or Decimal('0.00')

        # 6. Settled Amount (Credited to Corporate Account)
        settled_amount = deposits_qs.filter(
            status='SETTLED'
        ).aggregate(total=Sum('settled_amount'))['total'] or Decimal('0.00')

        # 7. Total Outstanding Loan Principal
        total_outstanding_loans = loans_qs.aggregate(total=Sum('outstanding_amount'))['total'] or Decimal('0.00')

        # 8. Discrepancies
        open_discrepancies_count = discrepancies_qs.filter(status='OPEN').count()
        total_discrepancy_amount = discrepancies_qs.filter(status='OPEN').aggregate(total=Sum('difference_amount'))['total'] or Decimal('0.00')

        return Response({
            'expected_collections': expected_collections,
            'total_collected': total_collected,
            'cash_held_by_agents': cash_held_by_agents,
            'cash_in_branch_vaults': cash_in_branch_vaults,
            'bank_deposits_in_clearing': bank_deposits_in_clearing,
            'settled_amount': settled_amount,
            'total_outstanding_loans': total_outstanding_loans,
            'open_discrepancies_count': open_discrepancies_count,
            'total_discrepancy_amount': total_discrepancy_amount,
        })


class BranchViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [permissions.IsAuthenticated]


class CustomerViewSet(viewsets.ModelViewSet):
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Customer.objects.select_related('branch', 'assigned_agent')
        if user.role == 'COLLECTION_AGENT':
            return qs.filter(assigned_agent=user)
        elif user.role == 'BRANCH_MANAGER' and user.branch:
            return qs.filter(branch=user.branch)
        branch_id = self.request.query_params.get('branch_id')
        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        return qs

    def create(self, request, *args, **kwargs):
        serializer = CreateCustomerInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        branch_id = data.get('branch_id') or (request.user.branch.id if request.user.branch else None)
        if not branch_id:
            first_branch = Branch.objects.first()
            branch_id = first_branch.id if first_branch else None
        if not branch_id:
            return Response({'error': 'Branch ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
        customer = FinancialService.create_customer(
            full_name=data['full_name'],
            phone=data['phone'],
            address=data['address'],
            branch_id=branch_id,
            assigned_agent_id=data.get('assigned_agent_id')
        )
        return Response(CustomerSerializer(customer).data, status=status.HTTP_201_CREATED)


class LoanViewSet(viewsets.ModelViewSet):
    serializer_class = LoanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Loan.objects.select_related('customer').prefetch_related('schedules')
        if user.role == 'COLLECTION_AGENT':
            return qs.filter(customer__assigned_agent=user)
        elif user.role == 'BRANCH_MANAGER' and user.branch:
            return qs.filter(customer__branch=user.branch)
        branch_id = self.request.query_params.get('branch_id')
        if branch_id:
            qs = qs.filter(customer__branch_id=branch_id)
        return qs

    def create(self, request, *args, **kwargs):
        serializer = CreateLoanInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            loan = FinancialService.create_loan(
                customer_id=data['customer_id'],
                principal_amount=data['principal_amount'],
                interest_rate_pct=data['interest_rate_pct'],
                tenure_months=data['tenure_months'],
                disbursed_at=data.get('disbursed_at'),
                created_by=request.user
            )
            return Response(LoanSerializer(loan).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def repayment_history(self, request, pk=None):
        loan = self.get_object()
        collections = Collection.objects.filter(loan=loan).order_by('-collected_at')
        return Response({
            'loan': LoanSerializer(loan).data,
            'collections': CollectionSerializer(collections, many=True).data
        })


class CollectionViewSet(viewsets.ModelViewSet):
    serializer_class = CollectionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Collection.objects.select_related('schedule', 'loan', 'customer', 'agent').order_by('-collected_at')
        if user.role == 'COLLECTION_AGENT':
            qs = qs.filter(agent=user)
        elif user.role == 'BRANCH_MANAGER' and user.branch:
            qs = qs.filter(agent__branch=user.branch)

        # Filters
        branch_id = self.request.query_params.get('branch_id')
        if branch_id:
            qs = qs.filter(agent__branch_id=branch_id)
        agent_id = self.request.query_params.get('agent_id')
        if agent_id:
            qs = qs.filter(agent_id=agent_id)
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)
        date_from = self.request.query_params.get('date_from')
        if date_from:
            qs = qs.filter(collected_at__date__gte=date_from)
        date_to = self.request.query_params.get('date_to')
        if date_to:
            qs = qs.filter(collected_at__date__lte=date_to)

        return qs

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.status in ['BRANCH_RECONCILED', 'BANK_DEPOSITED', 'SETTLED']:
            return Response(
                {'error': 'Unauthorized modification: Reconciled or settled collections are legally immutable.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.status in ['BRANCH_RECONCILED', 'BANK_DEPOSITED', 'SETTLED']:
            return Response(
                {'error': 'Unauthorized modification: Reconciled or settled collections are legally immutable.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.status in ['BRANCH_RECONCILED', 'BANK_DEPOSITED', 'SETTLED']:
            return Response(
                {'error': 'Unauthorized modification: Reconciled or settled collections are legally immutable.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().partial_update(request, *args, **kwargs)

    @action(detail=False, methods=['post'], permission_classes=[IsCollectionAgent])
    def record(self, request):
        """
        Record repayment collection from customer in the field.
        Generates unique receipt number and supports partial/advance allocation.
        """
        serializer = RecordCollectionInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            collection = FinancialService.record_collection(
                agent=request.user,
                schedule_id=data['schedule_id'],
                amount=data['amount'],
                payment_mode=data.get('payment_mode', 'CASH'),
                idempotency_key=data.get('idempotency_key'),
                notes=data.get('notes', '')
            )
            return Response(CollectionSerializer(collection).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def daily_summary(self, request):
        user = request.user
        today = timezone.now().date()
        qs = Collection.objects.filter(agent=user, collected_at__date=today)

        unsubmitted = Collection.objects.filter(agent=user, status='COLLECTED')

        return Response({
            'today_total': qs.aggregate(total=Sum('amount_collected'))['total'] or Decimal('0.00'),
            'today_count': qs.count(),
            'unsubmitted_total': unsubmitted.aggregate(total=Sum('amount_collected'))['total'] or Decimal('0.00'),
            'unsubmitted_count': unsubmitted.count(),
        })


class CashSubmissionViewSet(viewsets.ModelViewSet):
    serializer_class = CashSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = CashSubmission.objects.select_related('agent', 'branch', 'verified_by', 'discrepancy').prefetch_related('collections').order_by('-created_at')
        if user.role == 'COLLECTION_AGENT':
            qs = qs.filter(agent=user)
        elif user.role == 'BRANCH_MANAGER' and user.branch:
            qs = qs.filter(branch=user.branch)

        branch_id = self.request.query_params.get('branch_id')
        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        agent_id = self.request.query_params.get('agent_id')
        if agent_id:
            qs = qs.filter(agent_id=agent_id)
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)
        date_from = self.request.query_params.get('date_from')
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        date_to = self.request.query_params.get('date_to')
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)

        return qs

    def create(self, request, *args, **kwargs):
        """
        Agent submits collected cash batch to branch manager.
        """
        serializer = CreateSubmissionInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            submission = FinancialService.create_cash_submission(
                agent=request.user,
                collection_ids=data['collection_ids'],
                denominations=data.get('denominations')
            )
            return Response(CashSubmissionSerializer(submission).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsBranchManager])
    def verify(self, request, pk=None):
        """
        Branch manager verifies physical cash count.
        Approves (vault credit + discrepancy tracking) or Rejects.
        """
        serializer = VerifySubmissionInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            submission = FinancialService.verify_cash_submission(
                manager=request.user,
                submission_id=pk,
                counted_amount=data.get('counted_amount', Decimal('0.00')),
                action=data['action'],
                rejection_reason=data.get('rejection_reason', ''),
                resolution_notes=data.get('resolution_notes', '')
            )
            return Response(CashSubmissionSerializer(submission).data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class DiscrepancyViewSet(viewsets.ModelViewSet):
    serializer_class = DiscrepancySerializer
    permission_classes = [IsBranchManager]

    def get_queryset(self):
        user = self.request.user
        qs = Discrepancy.objects.select_related('submission', 'agent', 'branch').order_by('-created_at')
        if user.role == 'BRANCH_MANAGER' and user.branch:
            qs = qs.filter(branch=user.branch)

        branch_id = self.request.query_params.get('branch_id')
        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        agent_id = self.request.query_params.get('agent_id')
        if agent_id:
            qs = qs.filter(agent_id=agent_id)
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)

        return qs

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        discrepancy = self.get_object()
        notes = request.data.get('resolution_notes', 'Resolved by manager.')
        new_status = request.data.get('status', 'RESOLVED')
        discrepancy.status = new_status
        discrepancy.resolution_notes = notes
        discrepancy.save()
        return Response(DiscrepancySerializer(discrepancy).data)


class BankDepositViewSet(viewsets.ModelViewSet):
    serializer_class = BankDepositSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = BankDeposit.objects.select_related('branch', 'created_by', 'settled_by').prefetch_related('submissions').order_by('-created_at')
        if user.role == 'BRANCH_MANAGER' and user.branch:
            qs = qs.filter(branch=user.branch)

        branch_id = self.request.query_params.get('branch_id')
        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)
        date_from = self.request.query_params.get('date_from')
        if date_from:
            qs = qs.filter(deposit_date__gte=date_from)
        date_to = self.request.query_params.get('date_to')
        if date_to:
            qs = qs.filter(deposit_date__lte=date_to)

        return qs

    def create(self, request, *args, **kwargs):
        """
        Branch Manager creates a bank deposit challan from reconciled vault cash.
        """
        serializer = CreateBankDepositInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        branch_id = request.user.branch.id if request.user.branch else request.data.get('branch_id')
        if not branch_id:
            return Response({'error': 'Branch ID is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            deposit = FinancialService.create_bank_deposit(
                manager=request.user,
                branch_id=branch_id,
                submission_ids=data['submission_ids'],
                bank_name=data['bank_name'],
                account_no=data['account_no'],
                bank_reference_no=data['bank_reference_no'],
                deposit_date=data.get('deposit_date')
            )
            return Response(BankDepositSerializer(deposit).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsFinanceAdmin])
    def settle(self, request, pk=None):
        """
        Finance / Head Office confirms bank credit statement against deposit slip.
        """
        serializer = SettleBankDepositInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            deposit = FinancialService.settle_bank_deposit(
                finance_admin=request.user,
                deposit_id=pk,
                credited_amount=data['credited_amount'],
                mismatch_reason=data.get('mismatch_reason', '')
            )
            return Response(BankDepositSerializer(deposit).data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related('performed_by').all()
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]
