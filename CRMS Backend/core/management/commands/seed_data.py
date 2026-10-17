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
    help = 'Seeds database with nationwide multi-city demo data: 7 branches, 16 agents, 7 managers, 3 HQ treasury admins, and live pipeline transactions'

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
        # 1. NATIONWIDE BRANCHES (7 Key Commercial Hubs)
        # ═══════════════════════════════════════════════════════════
        self.stdout.write(self.style.SUCCESS("Creating Nationwide Branches..."))
        b_blr = Branch.objects.create(
            name="Bangalore South Branch",
            code="BR-BLR-01",
            address="42/1, 100 Feet Rd, Koramangala 4th Block",
            city="Bangalore",
            vault_cash_balance=Decimal("125000.00")
        )
        b_bom = Branch.objects.create(
            name="Mumbai Central Branch",
            code="BR-BOM-01",
            address="8th Floor, Express Towers, Nariman Point",
            city="Mumbai",
            vault_cash_balance=Decimal("95000.00")
        )
        b_del = Branch.objects.create(
            name="Delhi NCR Branch",
            code="BR-DEL-01",
            address="Tower B, Cyber City, DLF Phase 2",
            city="Gurugram",
            vault_cash_balance=Decimal("70000.00")
        )
        b_hyd = Branch.objects.create(
            name="Hyderabad Cyberabad Branch",
            code="BR-HYD-01",
            address="Plot 12, HITEC City Main Rd, Madhapur",
            city="Hyderabad",
            vault_cash_balance=Decimal("110000.00")
        )
        b_maa = Branch.objects.create(
            name="Chennai Marina Branch",
            code="BR-MAA-01",
            address="150, Anna Salai, T. Nagar",
            city="Chennai",
            vault_cash_balance=Decimal("85000.00")
        )
        b_pnq = Branch.objects.create(
            name="Pune Hinjewadi Branch",
            code="BR-PNQ-01",
            address="Phase 1, Rajiv Gandhi Infotech Park, Hinjewadi",
            city="Pune",
            vault_cash_balance=Decimal("60000.00")
        )
        b_ccu = Branch.objects.create(
            name="Kolkata Salt Lake Branch",
            code="BR-CCU-01",
            address="Block EP & GP, Sector V, Salt Lake City",
            city="Kolkata",
            vault_cash_balance=Decimal("55000.00")
        )

        # ═══════════════════════════════════════════════════════════
        # 2. USERS — Agents, Branch Managers, HQ Treasury
        # ═══════════════════════════════════════════════════════════
        self.stdout.write(self.style.SUCCESS("Creating Agents, Managers & HQ Team..."))

        # --- Bangalore Agents ---
        agent_ramesh = User.objects.create_user(
            username="ramesh_agent", email="ramesh@cmrs.fintech", password="pass123",
            first_name="Ramesh", last_name="Kumar",
            role="COLLECTION_AGENT", branch=b_blr,
            employee_id="EMP-AG-101", phone="+91 98450 12345"
        )
        agent_meera = User.objects.create_user(
            username="meera_agent", email="meera@cmrs.fintech", password="pass123",
            first_name="Meera", last_name="Iyer",
            role="COLLECTION_AGENT", branch=b_blr,
            employee_id="EMP-AG-102", phone="+91 98450 99887"
        )
        agent_arun = User.objects.create_user(
            username="arun_agent", email="arun@cmrs.fintech", password="pass123",
            first_name="Arun", last_name="Prasad",
            role="COLLECTION_AGENT", branch=b_blr,
            employee_id="EMP-AG-103", phone="+91 98450 44556"
        )

        # --- Mumbai Agents ---
        agent_sunil = User.objects.create_user(
            username="sunil_agent", email="sunil@cmrs.fintech", password="pass123",
            first_name="Sunil", last_name="Shinde",
            role="COLLECTION_AGENT", branch=b_bom,
            employee_id="EMP-AG-201", phone="+91 98200 54321"
        )
        agent_pooja = User.objects.create_user(
            username="pooja_agent", email="pooja@cmrs.fintech", password="pass123",
            first_name="Pooja", last_name="Sawant",
            role="COLLECTION_AGENT", branch=b_bom,
            employee_id="EMP-AG-202", phone="+91 98200 11223"
        )
        agent_rahul = User.objects.create_user(
            username="rahul_agent", email="rahul@cmrs.fintech", password="pass123",
            first_name="Rahul", last_name="Deshmukh",
            role="COLLECTION_AGENT", branch=b_bom,
            employee_id="EMP-AG-203", phone="+91 98200 33445"
        )

        # --- Delhi Agents ---
        agent_arjun = User.objects.create_user(
            username="arjun_agent", email="arjun@cmrs.fintech", password="pass123",
            first_name="Arjun", last_name="Reddy",
            role="COLLECTION_AGENT", branch=b_del,
            employee_id="EMP-AG-301", phone="+91 99100 44556"
        )
        agent_neha_ag = User.objects.create_user(
            username="neha_agent", email="neha.ag@cmrs.fintech", password="pass123",
            first_name="Neha", last_name="Verma",
            role="COLLECTION_AGENT", branch=b_del,
            employee_id="EMP-AG-302", phone="+91 99100 88776"
        )

        # --- Hyderabad Agents ---
        agent_suresh = User.objects.create_user(
            username="suresh_agent", email="suresh@cmrs.fintech", password="pass123",
            first_name="Suresh", last_name="Reddy",
            role="COLLECTION_AGENT", branch=b_hyd,
            employee_id="EMP-AG-401", phone="+91 98490 22334"
        )
        agent_ananya = User.objects.create_user(
            username="ananya_agent", email="ananya@cmrs.fintech", password="pass123",
            first_name="Ananya", last_name="Rao",
            role="COLLECTION_AGENT", branch=b_hyd,
            employee_id="EMP-AG-402", phone="+91 98490 55667"
        )

        # --- Chennai Agents ---
        agent_karthik = User.objects.create_user(
            username="karthik_agent", email="karthik@cmrs.fintech", password="pass123",
            first_name="Karthik", last_name="Subramanian",
            role="COLLECTION_AGENT", branch=b_maa,
            employee_id="EMP-AG-501", phone="+91 98400 33445"
        )
        agent_deepa = User.objects.create_user(
            username="deepa_agent", email="deepa@cmrs.fintech", password="pass123",
            first_name="Deepa", last_name="Sundaram",
            role="COLLECTION_AGENT", branch=b_maa,
            employee_id="EMP-AG-502", phone="+91 98400 77889"
        )

        # --- Pune Agents ---
        agent_rohit = User.objects.create_user(
            username="rohit_agent", email="rohit@cmrs.fintech", password="pass123",
            first_name="Rohit", last_name="Kulkarni",
            role="COLLECTION_AGENT", branch=b_pnq,
            employee_id="EMP-AG-601", phone="+91 98220 77889"
        )
        agent_sneha = User.objects.create_user(
            username="sneha_agent", email="sneha@cmrs.fintech", password="pass123",
            first_name="Sneha", last_name="Patil",
            role="COLLECTION_AGENT", branch=b_pnq,
            employee_id="EMP-AG-602", phone="+91 98220 44556"
        )

        # --- Kolkata Agents ---
        agent_subhash = User.objects.create_user(
            username="subhash_agent", email="subhash@cmrs.fintech", password="pass123",
            first_name="Subhash", last_name="Banerjee",
            role="COLLECTION_AGENT", branch=b_ccu,
            employee_id="EMP-AG-701", phone="+91 98300 99001"
        )
        agent_amitava = User.objects.create_user(
            username="amitava_agent", email="amitava@cmrs.fintech", password="pass123",
            first_name="Amitava", last_name="Roy",
            role="COLLECTION_AGENT", branch=b_ccu,
            employee_id="EMP-AG-702", phone="+91 98300 11223"
        )

        # --- Branch Managers (One for every branch) ---
        mgr_priya = User.objects.create_user(
            username="priya_manager", email="priya@cmrs.fintech", password="pass123",
            first_name="Priya", last_name="Sharma",
            role="BRANCH_MANAGER", branch=b_blr,
            employee_id="EMP-BM-101", phone="+91 98800 67890"
        )
        mgr_karan = User.objects.create_user(
            username="karan_manager", email="karan@cmrs.fintech", password="pass123",
            first_name="Karan", last_name="Malhotra",
            role="BRANCH_MANAGER", branch=b_bom,
            employee_id="EMP-BM-201", phone="+91 98200 77880"
        )
        mgr_neha = User.objects.create_user(
            username="neha_manager", email="neha@cmrs.fintech", password="pass123",
            first_name="Neha", last_name="Kapoor",
            role="BRANCH_MANAGER", branch=b_del,
            employee_id="EMP-BM-301", phone="+91 99100 33221"
        )
        mgr_venkat = User.objects.create_user(
            username="venkat_manager", email="venkat@cmrs.fintech", password="pass123",
            first_name="Venkat", last_name="Narayana",
            role="BRANCH_MANAGER", branch=b_hyd,
            employee_id="EMP-BM-401", phone="+91 98490 66778"
        )
        mgr_lakshmi = User.objects.create_user(
            username="lakshmi_manager", email="lakshmi@cmrs.fintech", password="pass123",
            first_name="Lakshmi", last_name="Raman",
            role="BRANCH_MANAGER", branch=b_maa,
            employee_id="EMP-BM-501", phone="+91 98400 88990"
        )
        mgr_anand = User.objects.create_user(
            username="anand_manager", email="anand@cmrs.fintech", password="pass123",
            first_name="Anand", last_name="Joshi",
            role="BRANCH_MANAGER", branch=b_pnq,
            employee_id="EMP-BM-601", phone="+91 98220 11224"
        )
        mgr_sourav = User.objects.create_user(
            username="sourav_manager", email="sourav@cmrs.fintech", password="pass123",
            first_name="Sourav", last_name="Mukherjee",
            role="BRANCH_MANAGER", branch=b_ccu,
            employee_id="EMP-BM-701", phone="+91 98300 44557"
        )

        # --- Finance & Treasury Head Office Team ---
        admin_vikram = User.objects.create_superuser(
            username="vikram_admin", email="admin@cmrs.fintech", password="pass123",
            first_name="Vikram", last_name="Seth",
            role="FINANCE_ADMIN",
            employee_id="EMP-HQ-001", phone="+91 99000 11223"
        )
        admin_aditi = User.objects.create_user(
            username="aditi_finance", email="aditi@cmrs.fintech", password="pass123",
            first_name="Aditi", last_name="Singhania",
            role="FINANCE_ADMIN",
            employee_id="EMP-HQ-002", phone="+91 99000 44556"
        )
        admin_rohan = User.objects.create_user(
            username="rohan_treasury", email="rohan@cmrs.fintech", password="pass123",
            first_name="Rohan", last_name="Mehra",
            role="FINANCE_ADMIN",
            employee_id="EMP-HQ-003", phone="+91 99000 77889"
        )

        # ═══════════════════════════════════════════════════════════
        # 3. DIVERSE BORROWERS & LOAN PORTFOLIOS (Across all 7 cities)
        # ═══════════════════════════════════════════════════════════
        self.stdout.write(self.style.SUCCESS("Creating Borrowers & Amortization Schedules..."))

        customer_roster = [
            # Bangalore (Ramesh, Meera, Arun)
            ("Aarav Patel",       "CUST-BLR-001", "+91 91234 56789", "Indiranagar, Bangalore",      b_blr, agent_ramesh),
            ("Sunita Verma",      "CUST-BLR-002", "+91 92345 67890", "HSR Layout, Bangalore",       b_blr, agent_ramesh),
            ("Deepak Rao",        "CUST-BLR-003", "+91 93456 78901", "BTM Layout, Bangalore",       b_blr, agent_ramesh),
            ("Lakshmi Devi",      "CUST-BLR-004", "+91 94567 89012", "Jayanagar, Bangalore",        b_blr, agent_ramesh),
            ("Rajesh Gupta",      "CUST-BLR-005", "+91 95678 90123", "Electronic City, Bangalore",  b_blr, agent_ramesh),
            ("Nitin Joshi",       "CUST-BLR-006", "+91 91111 22233", "Whitefield, Bangalore",       b_blr, agent_meera),
            ("Kavitha Murthy",    "CUST-BLR-007", "+91 91111 33344", "JP Nagar, Bangalore",         b_blr, agent_meera),
            ("Tanvi Hegde",       "CUST-BLR-008", "+91 91111 44455", "Marathahalli, Bangalore",     b_blr, agent_arun),
            ("Manoj Gowda",       "CUST-BLR-009", "+91 91111 55566", "Malleshwaram, Bangalore",     b_blr, agent_arun),

            # Mumbai (Sunil, Pooja, Rahul)
            ("Mohammed Khan",     "CUST-BOM-001", "+91 98201 11111", "Andheri West, Mumbai",         b_bom, agent_sunil),
            ("Sneha Kadam",       "CUST-BOM-002", "+91 98201 22222", "Bandra Kurla Complex, Mumbai", b_bom, agent_sunil),
            ("Prashant Shinde",   "CUST-BOM-003", "+91 98201 33333", "Dadar Central, Mumbai",        b_bom, agent_sunil),
            ("Aarti Sawant",      "CUST-BOM-004", "+91 98201 44444", "Borivali West, Mumbai",        b_bom, agent_pooja),
            ("Vikas Patil",       "CUST-BOM-005", "+91 98201 55555", "Navi Mumbai Vashi",            b_bom, agent_pooja),
            ("Farhan Qureshi",    "CUST-BOM-006", "+91 98201 66666", "Kurla West, Mumbai",           b_bom, agent_rahul),

            # Delhi NCR (Arjun, Neha)
            ("Amitabh Choudhury", "CUST-DEL-001", "+91 99101 11111", "DLF Cyber City, Gurugram",    b_del, agent_arjun),
            ("Pooja Sharma",      "CUST-DEL-002", "+91 99101 22222", "Sector 18, Noida",            b_del, agent_arjun),
            ("Rajeev Aggarwal",   "CUST-DEL-003", "+91 99101 33333", "Connaught Place, New Delhi",   b_del, agent_arjun),
            ("Simran Kaur",       "CUST-DEL-004", "+91 99101 44444", "Lajpat Nagar, New Delhi",      b_del, agent_neha_ag),
            ("Gaurav Bansal",     "CUST-DEL-005", "+91 99101 55555", "Rohini Sector 7, Delhi",       b_del, agent_neha_ag),

            # Hyderabad (Suresh, Ananya)
            ("Venkat Swamy",      "CUST-HYD-001", "+91 98491 11111", "Madhapur, HITEC City",         b_hyd, agent_suresh),
            ("Padma Reddy",       "CUST-HYD-002", "+91 98491 22222", "Kukatpally Housing Board",     b_hyd, agent_suresh),
            ("Kalyan Chakravarthy","CUST-HYD-003","+91 98491 33333", "Gachibowli Financial Dist",    b_hyd, agent_ananya),
            ("Divya Teja",        "CUST-HYD-004", "+91 98491 44444", "Banjara Hills Rd 12",         b_hyd, agent_ananya),

            # Chennai (Karthik, Deepa)
            ("Senthil Nathan",    "CUST-MAA-001", "+91 98401 11111", "T. Nagar Ranganathan St",     b_maa, agent_karthik),
            ("Geetha Krishnan",   "CUST-MAA-002", "+91 98401 22222", "Velachery Main Rd, Chennai",   b_maa, agent_karthik),
            ("Balamurugan P.",    "CUST-MAA-003", "+91 98401 33333", "Mylapore Tank, Chennai",       b_maa, agent_deepa),

            # Pune (Rohit, Sneha)
            ("Sandeep Deshpande", "CUST-PNQ-001", "+91 98221 11111", "Kothrud, Pune",                b_pnq, agent_rohit),
            ("Shweta Jadhav",     "CUST-PNQ-002", "+91 98221 22222", "Viman Nagar, Pune",            b_pnq, agent_rohit),
            ("Sachin More",       "CUST-PNQ-003", "+91 98221 33333", "Hinjewadi Phase 2, Pune",      b_pnq, agent_sneha),

            # Kolkata (Subhash, Amitava)
            ("Debabrata Das",     "CUST-CCU-001", "+91 98301 11111", "Salt Lake Sector II, Kolkata",  b_ccu, agent_subhash),
            ("Ruma Chatterjee",   "CUST-CCU-002", "+91 98301 22222", "New Town Action Area I",       b_ccu, agent_subhash),
            ("Tapas Sen",         "CUST-CCU-003", "+91 98301 33333", "Gariahat Rd, South Kolkata",   b_ccu, agent_amitava),
        ]

        cust_objs = []
        for name, code, phone, addr, branch, agent in customer_roster:
            c = Customer.objects.create(
                full_name=name,
                customer_code=code,
                phone=phone,
                address=addr,
                assigned_agent=agent,
                branch=branch,
                kyc_verified=True
            )
            cust_objs.append((c, branch, agent))

        # Generate Amortized Loans and 6-Month Schedules
        loans = []
        for idx, (customer, branch, agent) in enumerate(cust_objs, start=1):
            principal = Decimal(str(30000 + (idx % 6) * 15000))
            interest_rate = Decimal("14.50")
            tenure_months = 6
            monthly_interest = (principal * (interest_rate / Decimal("100"))) / Decimal("12")
            total_interest = monthly_interest * Decimal(str(tenure_months))
            total_repayable = (principal + total_interest).quantize(Decimal("0.01"))

            loan = Loan.objects.create(
                loan_account_no=f"LN-2026-{branch.code[3:6]}-{idx:03d}",
                customer=customer,
                principal_amount=principal,
                interest_rate_pct=interest_rate,
                tenure_months=tenure_months,
                total_payable=total_repayable,
                total_paid=Decimal("0.00"),
                outstanding_amount=total_repayable,
                status="ACTIVE",
                disbursed_at=today - timedelta(days=120)
            )
            loans.append(loan)

            emi_base = (total_repayable / Decimal(str(tenure_months))).quantize(Decimal("0.01"))
            for m in range(1, tenure_months + 1):
                due_d = (today - timedelta(days=30 * (3 - m)))
                p_portion = (principal / Decimal(str(tenure_months))).quantize(Decimal("0.01"))
                i_portion = (emi_base - p_portion).quantize(Decimal("0.01"))

                RepaymentSchedule.objects.create(
                    loan=loan,
                    installment_no=m,
                    due_date=due_d,
                    due_amount=emi_base,
                    principal_component=p_portion,
                    interest_component=i_portion,
                    status="PENDING",
                    paid_amount=Decimal("0.00")
                )

        # ═══════════════════════════════════════════════════════════
        # 4. RICH HISTORICAL & LIVE TRANSACTIONS ACROSS THE FUNNEL
        # ═══════════════════════════════════════════════════════════
        self.stdout.write(self.style.SUCCESS("Generating Collections, Vault Submissions & Bank Deposits..."))

        def record_payment(loan, inst_no, amount, mode="CASH", days_ago=0, agent=None):
            sch = loan.schedules.get(installment_no=inst_no)
            ag = agent or loan.customer.assigned_agent
            dt = timezone.now() - timedelta(days=days_ago)
            pm = "CASH" if mode == "CASH" else "UPI_SANDBOX"
            col = Collection.objects.create(
                receipt_no=f"RCP-{dt.strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}",
                schedule=sch,
                loan=loan,
                customer=loan.customer,
                agent=ag,
                amount_collected=amount,
                payment_mode=pm,
                status="COLLECTED",
                idempotency_key=str(uuid.uuid4()),
                notes=f"Field repayment collected for EMI #{inst_no}"
            )
            sch.paid_amount += amount
            if sch.paid_amount >= sch.due_amount:
                sch.status = "PAID"
            elif sch.paid_amount > Decimal("0.00"):
                sch.status = "PARTIALLY_PAID"
            sch.save()
            loan.total_paid += amount
            loan.outstanding_amount = max(Decimal("0.00"), loan.outstanding_amount - amount)
            loan.save()
            return col

        # 1. Bangalore South:
        # Ramesh Kumar: 3 unsubmitted cash collections in hand (wallet)
        c_blr_1 = record_payment(loans[0], 1, loans[0].schedules.get(installment_no=1).due_amount, "CASH", days_ago=0, agent=agent_ramesh)
        c_blr_2 = record_payment(loans[1], 1, loans[1].schedules.get(installment_no=1).due_amount, "CASH", days_ago=0, agent=agent_ramesh)
        c_blr_3 = record_payment(loans[2], 1, Decimal("2500.00"), "CASH", days_ago=0, agent=agent_ramesh)

        # Meera Iyer: Submitted batch awaiting Priya's physical count
        c_blr_m1 = record_payment(loans[5], 1, loans[5].schedules.get(installment_no=1).due_amount, "CASH", days_ago=1, agent=agent_meera)
        c_blr_m2 = record_payment(loans[6], 1, loans[6].schedules.get(installment_no=1).due_amount, "CASH", days_ago=1, agent=agent_meera)
        sub_blr_1 = CashSubmission.objects.create(
            submission_no=f"SUB-BLR-{today.strftime('%Y%m%d')}-001",
            agent=agent_meera, branch=b_blr,
            declared_amount=c_blr_m1.amount_collected + c_blr_m2.amount_collected,
            status="PENDING"
        )
        c_blr_m1.status = "SUBMITTED"
        c_blr_m1.submission = sub_blr_1
        c_blr_m1.save()
        c_blr_m2.status = "SUBMITTED"
        c_blr_m2.submission = sub_blr_1
        c_blr_m2.save()

        # Arun Prasad: Batch with Shortage Discrepancy (₹1,500 short)
        c_blr_a1 = record_payment(loans[7], 1, loans[7].schedules.get(installment_no=1).due_amount, "CASH", days_ago=2, agent=agent_arun)
        sub_blr_short = CashSubmission.objects.create(
            submission_no=f"SUB-BLR-{today.strftime('%Y%m%d')}-002",
            agent=agent_arun, branch=b_blr,
            declared_amount=c_blr_a1.amount_collected,
            verified_amount=c_blr_a1.amount_collected - Decimal("1500.00"),
            status="APPROVED",
            verified_by=mgr_priya,
            verified_at=timezone.now() - timedelta(hours=5),
            rejection_reason="Counted cash short by ₹1,500"
        )
        c_blr_a1.status = "BRANCH_RECONCILED"
        c_blr_a1.submission = sub_blr_short
        c_blr_a1.save()

        Discrepancy.objects.create(
            submission=sub_blr_short,
            branch=b_blr,
            agent=agent_arun,
            discrepancy_type="SHORTAGE",
            expected_amount=c_blr_a1.amount_collected,
            actual_amount=c_blr_a1.amount_collected - Decimal("1500.00"),
            difference_amount=Decimal("1500.00"),
            status="OPEN",
            resolution_notes="Cash envelope short ₹1,500. Agent liability pending debit recovery."
        )

        # 2. Mumbai Central:
        # Sunil Shinde: Submitted batch awaiting Karan Malhotra's physical count
        c_bom_1 = record_payment(loans[9], 1, loans[9].schedules.get(installment_no=1).due_amount, "CASH", days_ago=1, agent=agent_sunil)
        c_bom_2 = record_payment(loans[10], 1, loans[10].schedules.get(installment_no=1).due_amount, "CASH", days_ago=1, agent=agent_sunil)
        sub_bom = CashSubmission.objects.create(
            submission_no=f"SUB-BOM-{today.strftime('%Y%m%d')}-001",
            agent=agent_sunil, branch=b_bom,
            declared_amount=c_bom_1.amount_collected + c_bom_2.amount_collected,
            status="PENDING"
        )
        c_bom_1.status = "SUBMITTED"
        c_bom_1.submission = sub_bom
        c_bom_1.save()
        c_bom_2.status = "SUBMITTED"
        c_bom_2.submission = sub_bom
        c_bom_2.save()

        # Pooja Sawant: Unsubmitted cash in wallet
        c_bom_p1 = record_payment(loans[12], 1, Decimal("4200.00"), "CASH", days_ago=0, agent=agent_pooja)

        # 3. Delhi NCR:
        # Arjun Reddy: Submitted batch awaiting Neha Kapoor's physical count
        c_del_1 = record_payment(loans[15], 1, loans[15].schedules.get(installment_no=1).due_amount, "CASH", days_ago=1, agent=agent_arjun)
        c_del_2 = record_payment(loans[16], 1, Decimal("3500.00"), "CASH", days_ago=1, agent=agent_arjun)
        sub_del = CashSubmission.objects.create(
            submission_no=f"SUB-DEL-{today.strftime('%Y%m%d')}-001",
            agent=agent_arjun, branch=b_del,
            declared_amount=c_del_1.amount_collected + c_del_2.amount_collected,
            status="PENDING"
        )
        c_del_1.status = "SUBMITTED"
        c_del_1.submission = sub_del
        c_del_1.save()
        c_del_2.status = "SUBMITTED"
        c_del_2.submission = sub_del
        c_del_2.save()

        # 4. Hyderabad Cyberabad:
        # Suresh Reddy: Unsubmitted wallet cash
        c_hyd_1 = record_payment(loans[20], 1, Decimal("6500.00"), "CASH", days_ago=0, agent=agent_suresh)

        # 5. Chennai Marina:
        # Karthik Subramanian: Submitted batch awaiting Lakshmi Raman's physical count
        c_maa_1 = record_payment(loans[24], 1, loans[24].schedules.get(installment_no=1).due_amount, "CASH", days_ago=1, agent=agent_karthik)
        sub_maa = CashSubmission.objects.create(
            submission_no=f"SUB-MAA-{today.strftime('%Y%m%d')}-001",
            agent=agent_karthik, branch=b_maa,
            declared_amount=c_maa_1.amount_collected,
            status="PENDING"
        )
        c_maa_1.status = "SUBMITTED"
        c_maa_1.submission = sub_maa
        c_maa_1.save()

        # ═══════════════════════════════════════════════════════════
        # 5. BANK DEPOSITS (Clearing, Settled & Discrepancies)
        # ═══════════════════════════════════════════════════════════
        self.stdout.write(self.style.SUCCESS("Creating Bank Deposits in Clearing, Settled & Mismatches..."))

        # Deposit 1 (Bangalore - HDFC Bank - In Clearing)
        dep_hdfc = BankDeposit.objects.create(
            deposit_slip_no=f"SLIP-HDFC-{today.strftime('%Y%m%d')}-01",
            branch=b_blr,
            created_by=mgr_priya,
            bank_name="HDFC Bank",
            account_no="50200012345678",
            deposited_amount=Decimal("85000.00"),
            bank_reference_no=f"REF-HDFC-{today.strftime('%Y%m%d')}-881",
            deposit_date=today - timedelta(days=1),
            status="DEPOSITED"
        )

        # Deposit 2 (Mumbai - State Bank of India - In Clearing)
        dep_sbi = BankDeposit.objects.create(
            deposit_slip_no=f"SLIP-SBI-{today.strftime('%Y%m%d')}-02",
            branch=b_bom,
            created_by=mgr_karan,
            bank_name="State Bank of India",
            account_no="30012345678901",
            deposited_amount=Decimal("65000.00"),
            bank_reference_no=f"REF-SBI-{today.strftime('%Y%m%d')}-223",
            deposit_date=today - timedelta(days=1),
            status="DEPOSITED"
        )

        # Deposit 3 (Hyderabad - ICICI Bank - Settled in Bank)
        dep_icici = BankDeposit.objects.create(
            deposit_slip_no=f"SLIP-ICICI-{today.strftime('%Y%m%d')}-03",
            branch=b_hyd,
            created_by=mgr_venkat,
            bank_name="ICICI Bank",
            account_no="000405001234",
            deposited_amount=Decimal("90000.00"),
            bank_reference_no=f"REF-ICICI-{today.strftime('%Y%m%d')}-667",
            deposit_date=today - timedelta(days=3),
            status="SETTLED",
            settled_amount=Decimal("90000.00"),
            settled_at=timezone.now() - timedelta(days=2),
            settled_by=admin_vikram
        )

        # Deposit 4 (Delhi - Axis Bank - Settlement Mismatch: ₹500 counterfeit diff)
        dep_axis = BankDeposit.objects.create(
            deposit_slip_no=f"SLIP-AXIS-{today.strftime('%Y%m%d')}-04",
            branch=b_del,
            created_by=mgr_neha,
            bank_name="Axis Bank",
            account_no="916020011223344",
            deposited_amount=Decimal("45000.00"),
            bank_reference_no=f"REF-AXIS-{today.strftime('%Y%m%d')}-445",
            deposit_date=today - timedelta(days=2),
            status="SETTLEMENT_MISMATCH",
            settled_amount=Decimal("44500.00"),
            settled_at=timezone.now() - timedelta(days=1),
            settled_by=admin_vikram,
            mismatch_reason="Bank credited ₹44,500 vs Challan ₹45,000. Teller rejected 1x ₹500 counterfeit note."
        )

        # Deposit 5 (Chennai - Indian Overseas Bank - In Clearing)
        dep_iob = BankDeposit.objects.create(
            deposit_slip_no=f"SLIP-IOB-{today.strftime('%Y%m%d')}-05",
            branch=b_maa,
            created_by=mgr_lakshmi,
            bank_name="Indian Overseas Bank",
            account_no="01230009876543",
            deposited_amount=Decimal("72000.00"),
            bank_reference_no=f"REF-IOB-{today.strftime('%Y%m%d')}-991",
            deposit_date=today - timedelta(days=1),
            status="DEPOSITED"
        )

        # Initial Audit Log
        AuditLog.objects.create(
            performed_by=admin_vikram,
            action="SYSTEM_INIT",
            entity_type="Branch",
            entity_id="ALL",
            payload_after={"message": "Nationwide CMRS enterprise liquidity system initialized with 7 regional branches and multi-city team."}
        )

        self.stdout.write(self.style.SUCCESS("""
===============================================================
  CMRS EXPANDED SEED DATA LOADED -- NATIONWIDE OPERATIONS!
===============================================================

  BRANCHES (7 Commercial Hubs):
    - Bangalore South Branch (BR-BLR-01) - Vault: Rs 1,25,000
    - Mumbai Central Branch (BR-BOM-01)   - Vault: Rs 95,000
    - Delhi NCR Branch (BR-DEL-01)        - Vault: Rs 70,000
    - Hyderabad Cyberabad (BR-HYD-01)     - Vault: Rs 1,10,000
    - Chennai Marina (BR-MAA-01)          - Vault: Rs 85,000
    - Pune Hinjewadi (BR-PNQ-01)          - Vault: Rs 60,000
    - Kolkata Salt Lake (BR-CCU-01)       - Vault: Rs 55,000

  DEMO USER ACCOUNTS (Password: pass123):
    1. Field Agents (16 location-wise agents):
       - ramesh_agent, meera_agent, arun_agent (Bangalore)
       - sunil_agent, pooja_agent, rahul_agent (Mumbai)
       - arjun_agent, neha_agent (Delhi NCR)
       - suresh_agent, ananya_agent (Hyderabad)
       - karthik_agent, deepa_agent (Chennai)
       - rohit_agent, sneha_agent (Pune)
       - subhash_agent, amitava_agent (Kolkata)

    2. Branch Managers (7 City Managers):
       - priya_manager   (Bangalore South)
       - karan_manager   (Mumbai Central)
       - neha_manager    (Delhi NCR)
       - venkat_manager  (Hyderabad Cyberabad)
       - lakshmi_manager (Chennai Marina)
       - anand_manager   (Pune Hinjewadi)
       - sourav_manager  (Kolkata Salt Lake)

    3. Finance HQ & Central Treasury:
       - vikram_admin   (Chief Treasury Officer)
       - aditi_finance  (Head of Liquidity & Reconciliation)
       - rohan_treasury (Senior Treasury Ops Manager)

  TRANSACTIONS & PIPELINE READY FOR RECORDING:
    - 34 Borrowers & Amortized Loans across all 7 cities
    - Active unsubmitted wallet collections across multiple agents
    - 4 Inbound handover batches awaiting physical counting
    - Active shortage discrepancy (Rs 1,500)
    - 3 Bank Deposits in clearing (HDFC Rs 85k, SBI Rs 65k, IOB Rs 72k)
    - 1 Settled Bank Deposit (ICICI Rs 90k)
    - 1 Bank Settlement Mismatch (Axis Bank Rs 500 counterfeit diff)
===============================================================
"""))
