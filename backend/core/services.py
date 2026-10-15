import uuid
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError
from .models import (
    Branch, User, Customer, Loan, RepaymentSchedule,
    CashSubmission, Collection, Discrepancy, BankDeposit, AuditLog
)

class CMRSServiceException(Exception):
    pass

class FinancialService:

    @staticmethod
    def record_collection(agent, schedule_id, amount, payment_mode='CASH', idempotency_key=None, notes=''):
        """
        Records repayment collection with concurrency locking and support for
        exact, partial, and advance payments.
        """
        amount = Decimal(str(amount))
        if amount <= Decimal('0.00'):
            raise ValidationError("Collection amount must be strictly greater than 0.")

        # Idempotency check: prevent duplicate collection on network retries
        if idempotency_key:
            existing = Collection.objects.filter(idempotency_key=idempotency_key).first()
            if existing:
                return existing
        else:
            idempotency_key = str(uuid.uuid4())

        with transaction.atomic():
            schedule = RepaymentSchedule.objects.select_for_update().get(id=schedule_id)
            loan = Loan.objects.select_for_update().get(id=schedule.loan.id)

            remaining_due = schedule.remaining_due
            remaining_to_allocate = amount

            if remaining_to_allocate <= remaining_due:
                # Partial or exact payment on current schedule
                schedule.paid_amount += remaining_to_allocate
                if schedule.paid_amount >= schedule.due_amount:
                    schedule.status = 'PAID'
                else:
                    schedule.status = 'PARTIALLY_PAID'
                schedule.save()
                remaining_to_allocate = Decimal('0.00')
            else:
                # Over-payment / Advance payment: clear current schedule and cascade surplus to upcoming schedules
                schedule.paid_amount = schedule.due_amount
                schedule.status = 'PAID'
                schedule.save()
                remaining_to_allocate -= remaining_due

                upcoming_schedules = RepaymentSchedule.objects.filter(
                    loan=loan,
                    installment_no__gt=schedule.installment_no,
                    status__in=['PENDING', 'PARTIALLY_PAID', 'OVERDUE']
                ).order_by('installment_no').select_for_update()

                for next_sch in upcoming_schedules:
                    if remaining_to_allocate <= Decimal('0.00'):
                        break
                    sch_rem = next_sch.remaining_due
                    if remaining_to_allocate >= sch_rem:
                        next_sch.paid_amount = next_sch.due_amount
                        next_sch.status = 'PAID'
                        remaining_to_allocate -= sch_rem
                    else:
                        next_sch.paid_amount += remaining_to_allocate
                        next_sch.status = 'PARTIALLY_PAID'
                        remaining_to_allocate = Decimal('0.00')
                    next_sch.save()

            # Update loan balance
            loan.total_paid += amount
            loan.outstanding_amount = max(Decimal('0.00'), loan.total_payable - loan.total_paid)
            if loan.outstanding_amount == Decimal('0.00'):
                loan.status = 'CLOSED'
            loan.save()

            # Unique receipt code
            receipt_no = f"RCP-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

            collection = Collection.objects.create(
                receipt_no=receipt_no,
                schedule=schedule,
                loan=loan,
                customer=loan.customer,
                agent=agent,
                amount_collected=amount,
                payment_mode=payment_mode,
                status='COLLECTED',
                idempotency_key=idempotency_key,
                notes=notes
            )

            AuditLog.objects.create(
                entity_type='Collection',
                entity_id=str(collection.id),
                action='COLLECTION_RECORDED',
                performed_by=agent,
                payload_before={},
                payload_after={
                    'receipt_no': receipt_no,
                    'amount': str(amount),
                    'payment_mode': payment_mode,
                    'customer': loan.customer.full_name,
                    'loan_account': loan.loan_account_no,
                }
            )

            return collection

    @staticmethod
    def create_cash_submission(agent, collection_ids, denominations=None):
        """
        Batches collected cash for daily handover from agent to branch manager.
        """
        with transaction.atomic():
            collections = Collection.objects.filter(
                id__in=collection_ids,
                agent=agent,
                status='COLLECTED'
            ).select_for_update()

            if not collections.exists():
                raise ValidationError("No valid unsubmitted collections found for this agent.")

            declared_amount = sum(c.amount_collected for c in collections)
            submission_no = f"SUB-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

            submission = CashSubmission.objects.create(
                submission_no=submission_no,
                agent=agent,
                branch=agent.branch,
                declared_amount=declared_amount,
                status='PENDING',
                denominations=denominations or {}
            )

            collections.update(status='SUBMITTED', submission=submission)

            AuditLog.objects.create(
                entity_type='CashSubmission',
                entity_id=str(submission.id),
                action='CASH_SUBMISSION_CREATED',
                performed_by=agent,
                payload_before={},
                payload_after={
                    'submission_no': submission_no,
                    'declared_amount': str(declared_amount),
                    'collection_count': collections.count()
                }
            )

            return submission

    @staticmethod
    def verify_cash_submission(manager, submission_id, counted_amount, action, rejection_reason='', resolution_notes=''):
        """
        Branch manager verifies physical cash count.
        Approves (vault deposit + discrepancy tracking) or Rejects (resets collections).
        """
        with transaction.atomic():
            submission = CashSubmission.objects.select_for_update().get(id=submission_id)
            if submission.status != 'PENDING':
                raise ValidationError(f"Submission {submission.submission_no} is already {submission.status}.")

            if action == 'REJECT':
                submission.status = 'REJECTED'
                submission.rejection_reason = rejection_reason or "Verification rejected by Branch Manager."
                submission.verified_by = manager
                submission.verified_at = timezone.now()
                submission.save()

                # Revert collections to COLLECTED so agent can audit and re-submit
                Collection.objects.filter(submission=submission).update(
                    status='COLLECTED',
                    submission=None
                )

                AuditLog.objects.create(
                    entity_type='CashSubmission',
                    entity_id=str(submission.id),
                    action='CASH_SUBMISSION_REJECTED',
                    performed_by=manager,
                    payload_before={'status': 'PENDING'},
                    payload_after={'status': 'REJECTED', 'reason': submission.rejection_reason}
                )

                return submission

            elif action == 'APPROVE':
                counted = Decimal(str(counted_amount))
                submission.verified_amount = counted
                submission.status = 'APPROVED'
                submission.verified_by = manager
                submission.verified_at = timezone.now()
                submission.save()

                # Mark collections as BRANCH_RECONCILED
                Collection.objects.filter(submission=submission).update(status='BRANCH_RECONCILED')

                # Calculate discrepancy
                diff = counted - submission.declared_amount
                if diff != Decimal('0.00'):
                    disc_type = 'EXCESS' if diff > Decimal('0.00') else 'SHORTAGE'
                    abs_diff = abs(diff)

                    Discrepancy.objects.create(
                        submission=submission,
                        agent=submission.agent,
                        branch=submission.branch,
                        discrepancy_type=disc_type,
                        expected_amount=submission.declared_amount,
                        actual_amount=counted,
                        difference_amount=abs_diff,
                        status='OPEN',
                        resolution_notes=resolution_notes or f"Discrepancy detected during branch cash count by {manager.username}."
                    )

                # Credit branch vault with verified physical cash count
                branch = Branch.objects.select_for_update().get(id=submission.branch.id)
                branch.vault_cash_balance += counted
                branch.save()

                AuditLog.objects.create(
                    entity_type='CashSubmission',
                    entity_id=str(submission.id),
                    action='CASH_SUBMISSION_APPROVED',
                    performed_by=manager,
                    payload_before={'status': 'PENDING'},
                    payload_after={
                        'status': 'APPROVED',
                        'declared': str(submission.declared_amount),
                        'verified': str(counted),
                        'discrepancy': str(diff)
                    }
                )

                return submission

            else:
                raise ValidationError(f"Invalid verification action: {action}")

    @staticmethod
    def create_bank_deposit(manager, branch_id, submission_ids, bank_name, account_no, bank_reference_no, deposit_date=None):
        """
        Creates a bank deposit challan from branch vault cash.
        """
        with transaction.atomic():
            branch = Branch.objects.select_for_update().get(id=branch_id)
            submissions = CashSubmission.objects.filter(
                id__in=submission_ids,
                branch=branch,
                status='APPROVED',
                bank_deposit__isnull=True
            ).select_for_update()

            if not submissions.exists():
                raise ValidationError("No approved and un-deposited submissions selected.")

            total_amount = sum(s.verified_amount for s in submissions)

            if branch.vault_cash_balance < total_amount:
                raise ValidationError(f"Insufficient branch vault balance (Vault: ₹{branch.vault_cash_balance}, Required: ₹{total_amount}).")

            # Duplicate bank reference check
            if BankDeposit.objects.filter(bank_reference_no=bank_reference_no).exists():
                raise ValidationError(f"Bank reference number {bank_reference_no} has already been registered.")

            # Deduct from branch vault
            branch.vault_cash_balance -= total_amount
            branch.save()

            deposit_slip_no = f"DEP-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

            deposit = BankDeposit.objects.create(
                deposit_slip_no=deposit_slip_no,
                branch=branch,
                created_by=manager,
                bank_name=bank_name,
                account_no=account_no,
                deposited_amount=total_amount,
                bank_reference_no=bank_reference_no,
                deposit_date=deposit_date or timezone.now().date(),
                status='DEPOSITED'
            )

            valid_submission_ids = list(submissions.values_list('id', flat=True))

            # Link submissions to bank deposit
            submissions.update(bank_deposit=deposit)

            # Mark all bundled collections as BANK_DEPOSITED
            Collection.objects.filter(submission_id__in=valid_submission_ids).update(status='BANK_DEPOSITED')

            AuditLog.objects.create(
                entity_type='BankDeposit',
                entity_id=str(deposit.id),
                action='BANK_DEPOSIT_CREATED',
                performed_by=manager,
                payload_before={},
                payload_after={
                    'deposit_slip_no': deposit_slip_no,
                    'amount': str(total_amount),
                    'bank': bank_name,
                    'reference_no': bank_reference_no
                }
            )

            return deposit

    @staticmethod
    def settle_bank_deposit(finance_admin, deposit_id, credited_amount, mismatch_reason=''):
        """
        Finance / Head Office verifies bank credit against bank statement.
        """
        with transaction.atomic():
            deposit = BankDeposit.objects.select_for_update().get(id=deposit_id)
            if deposit.status == 'SETTLED':
                raise ValidationError(f"Deposit {deposit.deposit_slip_no} is already settled.")

            credited = Decimal(str(credited_amount))
            deposit.settled_amount = credited
            deposit.settled_by = finance_admin
            deposit.settled_at = timezone.now()

            if credited == deposit.deposited_amount:
                deposit.status = 'SETTLED'
                deposit.mismatch_reason = ''
                # Transition all collections to SETTLED
                Collection.objects.filter(submission__bank_deposit=deposit).update(status='SETTLED')
            else:
                deposit.status = 'SETTLEMENT_MISMATCH'
                diff = deposit.deposited_amount - credited
                deposit.mismatch_reason = mismatch_reason or f"Bank statement credited ₹{credited} vs deposited ₹{deposit.deposited_amount} (Diff: ₹{diff})."

            deposit.save()

            AuditLog.objects.create(
                entity_type='BankDeposit',
                entity_id=str(deposit.id),
                action=f'BANK_DEPOSIT_{deposit.status}',
                performed_by=finance_admin,
                payload_before={'deposited_amount': str(deposit.deposited_amount)},
                payload_after={
                    'status': deposit.status,
                    'settled_amount': str(credited),
                    'mismatch_reason': deposit.mismatch_reason
                }
            )

            return deposit
