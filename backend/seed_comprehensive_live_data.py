import os, sys, datetime
from decimal import Decimal
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'erp_backend.settings')
import django
django.setup()

from django.contrib.auth import get_user_model
from accounts.models import Role, Permission, RolePermission
from organizations.models import Organization, Branch, Department, Designation
from hrms.models import Shift, Employee, LeaveType, LeaveBalance, LeaveApplication, Holiday, AttendanceEvent
from payroll.models import SalaryStructure, PayrollPeriod, PayrollRun, Payslip, SalaryAdvance, BonusIncentive
from crm.models import Lead, Customer, Opportunity, CRMActivity
from billing.models import ProductService, Quotation, Invoice, Payment, Expense

User = get_user_model()

def run_seed():
    print(">>> [SEEDING] Beginning full enterprise seeding...")

    # 1. Organization
    org, _ = Organization.objects.get_or_create(
        code='ODIAS-CORP',
        defaults={
            'name': 'Odias ERP Global Pvt Ltd',
            'logo_url': 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=120&auto=format&fit=crop&q=80',
            'email': 'contact@odiaserp.com',
            'phone': '+91 674 259 8800',
            'address': 'Plot 42, Infocity, Patia, Bhubaneswar, Odisha',
            'city': 'Bhubaneswar',
            'state': 'Odisha',
            'country': 'India',
            'postal_code': '751024',
            'tax_identifier': '21AAACG1234F1Z5',
            'currency': 'INR',
            'currency_symbol': '₹',
            'time_zone': 'Asia/Kolkata',
            'financial_year_start': 'April 1'
        }
    )

    # 2. Branches
    b_bbsr, _ = Branch.objects.get_or_create(code='BR-BBSR', defaults={'organization': org, 'name': 'Bhubaneswar Corporate Headquarters', 'city': 'Bhubaneswar', 'state': 'Odisha', 'is_head_office': True, 'address': 'Infocity IT Park, Patia'})
    b_blr, _ = Branch.objects.get_or_create(code='BR-BLR', defaults={'organization': org, 'name': 'Bengaluru Innovation Center', 'city': 'Bengaluru', 'state': 'Karnataka', 'is_head_office': False, 'address': 'Outer Ring Road, Bellandur'})
    b_mum, _ = Branch.objects.get_or_create(code='BR-MUM', defaults={'organization': org, 'name': 'Mumbai Commercial Office', 'city': 'Mumbai', 'state': 'Maharashtra', 'is_head_office': False, 'address': 'Bandra Kurla Complex (BKC)'})

    # 3. Departments
    d_eng, _ = Department.objects.get_or_create(code='DEPT-ENG', defaults={'organization': org, 'branch': b_bbsr, 'name': 'Software Engineering & Cloud'})
    d_hr, _ = Department.objects.get_or_create(code='DEPT-HR', defaults={'organization': org, 'branch': b_bbsr, 'name': 'Human Resources & Talent'})
    d_sales, _ = Department.objects.get_or_create(code='DEPT-SLS', defaults={'organization': org, 'branch': b_mum, 'name': 'Enterprise Sales & CRM'})
    d_fin, _ = Department.objects.get_or_create(code='DEPT-FIN', defaults={'organization': org, 'branch': b_bbsr, 'name': 'Finance & Billing Accounts'})
    d_ops, _ = Department.objects.get_or_create(code='DEPT-OPS', defaults={'organization': org, 'branch': b_bbsr, 'name': 'Executive Board & Operations'})

    # 4. Designations
    des_ceo, _ = Designation.objects.get_or_create(title='Chief Executive Officer', department=d_ops, defaults={'grade': 'L6'})
    des_hr_dir, _ = Designation.objects.get_or_create(title='HR Director', department=d_hr, defaults={'grade': 'L5'})
    des_eng_lead, _ = Designation.objects.get_or_create(title='Engineering Lead', department=d_eng, defaults={'grade': 'L4'})
    des_sr_dev, _ = Designation.objects.get_or_create(title='Senior Fullstack Engineer', department=d_eng, defaults={'grade': 'L3'})
    des_sales_dir, _ = Designation.objects.get_or_create(title='Enterprise Sales Director', department=d_sales, defaults={'grade': 'L4'})
    des_fin_ctrl, _ = Designation.objects.get_or_create(title='Finance Controller', department=d_fin, defaults={'grade': 'L4'})

    # 5. Shifts
    s_gen, _ = Shift.objects.get_or_create(code='SH-GEN', defaults={'name': 'Standard Corporate Shift', 'start_time': datetime.time(9, 30), 'end_time': datetime.time(18, 30), 'grace_period_minutes': 15, 'break_duration_minutes': 60})
    s_flex, _ = Shift.objects.get_or_create(code='SH-FLEX', defaults={'name': 'Flexible Tech Shift', 'start_time': datetime.time(10, 0), 'end_time': datetime.time(19, 0), 'grace_period_minutes': 30, 'break_duration_minutes': 60})

    # 6. Roles
    roles_data = [
        ('super_admin', 'Super Admin', 'Unrestricted administrative authority across all 12 modules, users, security and audit logs.'),
        ('sub_admin', 'Sub-Admin', 'Assigned branch/department level administrative access.'),
        ('hr_manager', 'HR Manager', 'Manage employees, attendance, leave, holidays, shifts, and payroll preparation.'),
        ('manager', 'Team Manager', 'Team approvals, team attendance monitoring, task assignment and performance.'),
        ('employee', 'Employee', 'Self-service attendance check-in/out, leave application, holiday calendar and payslips.'),
        ('accounts', 'Finance & Accounts', 'Invoicing, quotations, customer payments, expense logging and financial reports.'),
        ('sales', 'Sales Executive', 'CRM leads, pipeline opportunities, customer accounts and sales activities.'),
    ]
    roles = {}
    for code, name, desc in roles_data:
        r, _ = Role.objects.get_or_create(code=code, defaults={'name': name, 'description': desc, 'is_system': True})
        roles[code] = r

    # 7. Users Roster (Pass: admin123 for all)
    users_spec = [
        ('superadmin12@gmail.com', 'Super', 'Admin', 'super_admin', True, '+91 9900000001'),
        ('hr@odiaserp.com', 'Priya', 'Sharma', 'hr_manager', False, '+91 9900000002'),
        ('manager@odiaserp.com', 'Rajesh', 'Verma', 'manager', False, '+91 9900000003'),
        ('employee@odiaserp.com', 'Amit', 'Patel', 'employee', False, '+91 9900000004'),
        ('sales@odiaserp.com', 'Sneha', 'Mohanty', 'sales', False, '+91 9900000005'),
        ('accounts@odiaserp.com', 'Sunil', 'Sahoo', 'accounts', False, '+91 9900000006'),
    ]

    users_map = {}
    for email, fn, ln, r_code, is_super, phone in users_spec:
        u, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': email,
                'first_name': fn,
                'last_name': ln,
                'role': roles[r_code],
                'is_staff': is_super or r_code in ['hr_manager', 'sub_admin'],
                'is_superuser': is_super,
                'status': 'active',
                'phone': phone
            }
        )
        u.set_password('admin123')
        u.role = roles[r_code]
        u.status = 'active'
        u.save()
        users_map[email] = u
        print(f"  [USER] {email} (role: {r_code}) configured with admin123")

    # 8. Employees Roster
    employees_spec = [
        {
            'emp_id': 'ODS-HR-001',
            'user': users_map['hr@odiaserp.com'],
            'fn': 'Priya',
            'ln': 'Sharma',
            'email': 'hr@odiaserp.com',
            'phone': '+91 9900000002',
            'dept': d_hr,
            'desig': des_hr_dir,
            'role_code': 'hr_manager',
            'role_name': 'HR Director',
            'doj': datetime.date(2025, 4, 1),
            'ctc': Decimal('900000.00'),
            'basic': Decimal('45000.00'),
            'hra': Decimal('22500.00'),
            'da': Decimal('9000.00'),
            'allowances': Decimal('11000.00'),
            'pf': Decimal('5400.00'),
            'pt': Decimal('200.00'),
            'tds': Decimal('3500.00'),
        },
        {
            'emp_id': 'ODS-MGR-001',
            'user': users_map['manager@odiaserp.com'],
            'fn': 'Rajesh',
            'ln': 'Verma',
            'email': 'manager@odiaserp.com',
            'phone': '+91 9900000003',
            'dept': d_eng,
            'desig': des_eng_lead,
            'role_code': 'manager',
            'role_name': 'Engineering Lead',
            'doj': datetime.date(2025, 3, 15),
            'ctc': Decimal('1440000.00'),
            'basic': Decimal('60000.00'),
            'hra': Decimal('30000.00'),
            'da': Decimal('12000.00'),
            'allowances': Decimal('18000.00'),
            'pf': Decimal('7200.00'),
            'pt': Decimal('200.00'),
            'tds': Decimal('6500.00'),
        },
        {
            'emp_id': 'ODS-EMP-001',
            'user': users_map['employee@odiaserp.com'],
            'fn': 'Amit',
            'ln': 'Patel',
            'email': 'employee@odiaserp.com',
            'phone': '+91 9900000004',
            'dept': d_eng,
            'desig': des_sr_dev,
            'role_code': 'employee',
            'role_name': 'Senior Fullstack Engineer',
            'doj': datetime.date(2025, 6, 1),
            'ctc': Decimal('840000.00'),
            'basic': Decimal('35000.00'),
            'hra': Decimal('17500.00'),
            'da': Decimal('7000.00'),
            'allowances': Decimal('10500.00'),
            'pf': Decimal('4200.00'),
            'pt': Decimal('200.00'),
            'tds': Decimal('2500.00'),
        },
        {
            'emp_id': 'ODS-SLS-001',
            'user': users_map['sales@odiaserp.com'],
            'fn': 'Sneha',
            'ln': 'Mohanty',
            'email': 'sales@odiaserp.com',
            'phone': '+91 9900000005',
            'dept': d_sales,
            'desig': des_sales_dir,
            'role_code': 'sales',
            'role_name': 'Enterprise Sales Director',
            'doj': datetime.date(2025, 5, 10),
            'ctc': Decimal('1200000.00'),
            'basic': Decimal('50000.00'),
            'hra': Decimal('25000.00'),
            'da': Decimal('10000.00'),
            'allowances': Decimal('15000.00'),
            'pf': Decimal('6000.00'),
            'pt': Decimal('200.00'),
            'tds': Decimal('5000.00'),
        },
        {
            'emp_id': 'ODS-FIN-001',
            'user': users_map['accounts@odiaserp.com'],
            'fn': 'Sunil',
            'ln': 'Sahoo',
            'email': 'accounts@odiaserp.com',
            'phone': '+91 9900000006',
            'dept': d_fin,
            'desig': des_fin_ctrl,
            'role_code': 'accounts',
            'role_name': 'Finance Controller',
            'doj': datetime.date(2025, 2, 1),
            'ctc': Decimal('1080000.00'),
            'basic': Decimal('45000.00'),
            'hra': Decimal('22500.00'),
            'da': Decimal('9000.00'),
            'allowances': Decimal('13500.00'),
            'pf': Decimal('5400.00'),
            'pt': Decimal('200.00'),
            'tds': Decimal('4500.00'),
        },
    ]

    employees_created = []
    for ed in employees_spec:
        emp, _ = Employee.objects.get_or_create(
            employee_id=ed['emp_id'],
            defaults={
                'user': ed['user'],
                'first_name': ed['fn'],
                'last_name': ed['ln'],
                'email': ed['email'],
                'phone': ed['phone'],
                'branch': b_bbsr,
                'department': ed['dept'],
                'designation': ed['desig'],
                'shift': s_gen,
                'role_code': ed['role_code'],
                'role_name': ed['role_name'],
                'date_of_joining': ed['doj'],
                'employment_status': 'active',
                'employment_type': 'full_time',
                'basic_salary': ed['basic'],
                'hra': ed['hra'],
                'da': ed['da'],
                'other_allowances': ed['allowances'],
                'bank_name': 'HDFC Bank Ltd',
                'bank_account_number': f"501004{ed['emp_id'][-3:]}8921",
                'bank_ifsc': 'HDFC0001248',
                'pan_number': f"ABCD{ed['emp_id'][-3:]}K",
                'aadhaar_number': f"9988 7766 5{ed['emp_id'][-3:]}"
            }
        )
        emp.user = ed['user']
        emp.department = ed['dept']
        emp.designation = ed['desig']
        emp.basic_salary = ed['basic']
        emp.hra = ed['hra']
        emp.da = ed['da']
        emp.other_allowances = ed['allowances']
        emp.employment_status = 'active'
        emp.save()
        employees_created.append((emp, ed))
        print(f"  [EMPLOYEE] {emp.full_name} ({emp.employee_id}) ready")

    # Set reporting manager for Amit Patel to Rajesh Verma
    emp_amit = next(e for e, _ in employees_created if e.employee_id == 'ODS-EMP-001')
    emp_rajesh = next(e for e, _ in employees_created if e.employee_id == 'ODS-MGR-001')
    emp_amit.reporting_manager = emp_rajesh
    emp_amit.save()

    # 9. Salary Structures
    for emp, ed in employees_created:
        SalaryStructure.objects.get_or_create(
            employee=emp,
            defaults={
                'effective_from': datetime.date(2026, 1, 1),
                'basic_salary': ed['basic'],
                'hra': ed['hra'],
                'conveyance_allowance': Decimal('3000.00'),
                'medical_allowance': Decimal('2000.00'),
                'special_allowance': ed['allowances'] - Decimal('5000.00') if ed['allowances'] > 5000 else ed['allowances'],
                'provident_fund': ed['pf'],
                'professional_tax': ed['pt'],
                'other_deductions': ed['tds'],
                'is_active': True
            }
        )
    print("  [PAYROLL] Salary structures configured for all staff")

    # 10. Payroll Periods & Runs
    # Period 1: October 2026 (Finalized)
    p_oct, _ = PayrollPeriod.objects.get_or_create(
        name='October 2026',
        defaults={
            'start_date': datetime.date(2026, 10, 1),
            'end_date': datetime.date(2026, 10, 31),
            'total_days': 31,
            'working_days': 22,
            'status': 'finalized'
        }
    )

    pr_oct, _ = PayrollRun.objects.get_or_create(
        period=p_oct,
        defaults={
            'total_gross': sum((ed['basic'] + ed['hra'] + ed['da'] + ed['allowances']) for _, ed in employees_created),
            'total_deductions': sum((ed['pf'] + ed['pt'] + ed['tds']) for _, ed in employees_created),
            'total_net': sum(((ed['basic'] + ed['hra'] + ed['da'] + ed['allowances']) - (ed['pf'] + ed['pt'] + ed['tds'])) for _, ed in employees_created),
            'total_employees': len(employees_created),
            'status': 'finalized',
            'approved_by': users_map['superadmin12@gmail.com'],
            'finalized_at': datetime.datetime(2026, 10, 31, 18, 0)
        }
    )

    # Oct Payslips
    for idx, (emp, ed) in enumerate(employees_created, start=1):
        gross = ed['basic'] + ed['hra'] + ed['da'] + ed['allowances']
        deductions = ed['pf'] + ed['pt'] + ed['tds']
        net = gross - deductions
        Payslip.objects.get_or_create(
            payslip_number=f"PAY-2026-10-{idx:03d}",
            defaults={
                'payroll_run': pr_oct,
                'employee': emp,
                'total_days': Decimal('31.0'),
                'working_days': Decimal('22.0'),
                'payable_days': Decimal('22.0'),
                'paid_leave_days': Decimal('1.0'),
                'unpaid_leave_days': Decimal('0.0'),
                'holidays_count': Decimal('2.0'),
                'weekly_offs_count': Decimal('4.0'),
                'basic_salary': ed['basic'],
                'hra': ed['hra'],
                'allowances': ed['da'] + ed['allowances'],
                'gross_salary': gross,
                'pf_deduction': ed['pf'],
                'tax_deduction': ed['tds'] + ed['pt'],
                'lop_deduction': Decimal('0.00'),
                'total_deductions': deductions,
                'net_salary': net,
                'status': 'released',
                'payment_mode': 'Bank Transfer',
                'payment_status': 'Paid'
            }
        )

    # Period 2: November 2026 (Active under review/approved)
    p_nov, _ = PayrollPeriod.objects.get_or_create(
        name='November 2026',
        defaults={
            'start_date': datetime.date(2026, 11, 1),
            'end_date': datetime.date(2026, 11, 30),
            'total_days': 30,
            'working_days': 21,
            'status': 'approved'
        }
    )

    pr_nov, _ = PayrollRun.objects.get_or_create(
        period=p_nov,
        defaults={
            'total_gross': sum((ed['basic'] + ed['hra'] + ed['da'] + ed['allowances']) for _, ed in employees_created),
            'total_deductions': sum((ed['pf'] + ed['pt'] + ed['tds']) for _, ed in employees_created),
            'total_net': sum(((ed['basic'] + ed['hra'] + ed['da'] + ed['allowances']) - (ed['pf'] + ed['pt'] + ed['tds'])) for _, ed in employees_created),
            'total_employees': len(employees_created),
            'status': 'approved',
            'approved_by': users_map['superadmin12@gmail.com']
        }
    )

    for idx, (emp, ed) in enumerate(employees_created, start=1):
        gross = ed['basic'] + ed['hra'] + ed['da'] + ed['allowances']
        deductions = ed['pf'] + ed['pt'] + ed['tds']
        net = gross - deductions
        Payslip.objects.get_or_create(
            payslip_number=f"PAY-2026-11-{idx:03d}",
            defaults={
                'payroll_run': pr_nov,
                'employee': emp,
                'total_days': Decimal('30.0'),
                'working_days': Decimal('21.0'),
                'payable_days': Decimal('21.0'),
                'paid_leave_days': Decimal('0.0'),
                'unpaid_leave_days': Decimal('0.0'),
                'holidays_count': Decimal('1.0'),
                'weekly_offs_count': Decimal('4.0'),
                'basic_salary': ed['basic'],
                'hra': ed['hra'],
                'allowances': ed['da'] + ed['allowances'],
                'gross_salary': gross,
                'pf_deduction': ed['pf'],
                'tax_deduction': ed['tds'] + ed['pt'],
                'lop_deduction': Decimal('0.00'),
                'total_deductions': deductions,
                'net_salary': net,
                'status': 'approved',
                'payment_mode': 'Bank Transfer',
                'payment_status': 'Scheduled'
            }
        )
    print("  [PAYROLL] Payroll runs & payslips generated for Oct and Nov 2026")

    # 11. Leave Balances & Leaves
    lt_cl, _ = LeaveType.objects.get_or_create(code='CL', defaults={'name': 'Casual Leave', 'days_per_year': 12, 'is_paid': True, 'color': '#3B82F6'})
    lt_sl, _ = LeaveType.objects.get_or_create(code='SL', defaults={'name': 'Sick Leave', 'days_per_year': 10, 'is_paid': True, 'color': '#10B981'})
    lt_el, _ = LeaveType.objects.get_or_create(code='EL', defaults={'name': 'Earned / Annual Leave', 'days_per_year': 18, 'is_paid': True, 'color': '#8B5CF6'})

    for emp, _ in employees_created:
        LeaveBalance.objects.get_or_create(employee=emp, leave_type=lt_cl, year=2026, defaults={'total_allocated': 12, 'used': 2})
        LeaveBalance.objects.get_or_create(employee=emp, leave_type=lt_sl, year=2026, defaults={'total_allocated': 10, 'used': 1})
        LeaveBalance.objects.get_or_create(employee=emp, leave_type=lt_el, year=2026, defaults={'total_allocated': 18, 'used': 3})

    # Leave application for Amit Patel
    LeaveApplication.objects.get_or_create(
        employee=emp_amit,
        start_date=datetime.date(2026, 11, 24),
        end_date=datetime.date(2026, 11, 25),
        defaults={
            'leave_type': lt_cl,
            'total_days': Decimal('2.0'),
            'reason': 'Family function in hometown',
            'status': 'pending'
        }
    )

    # 12. Attendance Events for Today
    today = datetime.date.today()
    for emp, _ in employees_created:
        AttendanceEvent.objects.get_or_create(
            employee=emp,
            date=today,
            defaults={
                'check_in_time': datetime.time(9, 28),
                'status': 'present',
                'notes': 'Verified RFID & Biometric Scan'
            }
        )

    print(">>> [SEEDING COMPLETED] Full enterprise dataset is ready!")

if __name__ == '__main__':
    run_seed()
