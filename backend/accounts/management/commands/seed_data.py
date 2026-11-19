import datetime
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.models import Role, Permission, RolePermission
from organizations.models import Organization, Branch, Department, Designation
from hrms.models import Shift, Employee, LeaveType, LeaveBalance, LeaveApplication, Holiday, AttendanceEvent
from payroll.models import SalaryStructure, PayrollPeriod, PayrollRun, Payslip
from crm.models import Lead, Customer, Opportunity, CRMActivity
from billing.models import ProductService, Quotation, QuotationItem, Invoice, InvoiceItem, Payment, Expense
from audit_logs.models import AuditLog
from notifications.models import Notification, Announcement

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds complete, realistic enterprise data for Greenbacks ERP'

    def handle(self, *args, **options):
        self.stdout.write("Starting database seeding...")

        # 1. Organization
        org, _ = Organization.objects.get_or_create(
            code='ODIAS-CORP',
            defaults={
                'name': 'Odias ERP Global Pvt Ltd',
                'logo_url': 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=120&auto=format&fit=crop&q=80',
                'email': 'bsb120@nist.edu',
                'phone': '+91 1234567890',
                'address': 'LaxmiSagar, Bhubaneswar, Odisha',
                'city': 'Bhubaneswar',
                'state': 'Odisha',
                'country': 'India',
                'postal_code': '751006',
                'tax_identifier': '21AAACG1234F1Z5',
                'currency': 'INR',
                'currency_symbol': '₹',
                'time_zone': 'Asia/Kolkata',
                'financial_year_start': 'April 1'
            }
        )

        # 2. Branches
        b_mum, _ = Branch.objects.get_or_create(code='BR-MUM', defaults={'organization': org, 'name': 'Mumbai Headquarters', 'city': 'Mumbai', 'state': 'Maharashtra', 'is_head_office': True, 'address': 'Tower C, BKC'})
        b_blr, _ = Branch.objects.get_or_create(code='BR-BLR', defaults={'organization': org, 'name': 'Bangalore Tech Center', 'city': 'Bengaluru', 'state': 'Karnataka', 'is_head_office': False, 'address': 'Outer Ring Road, Bellandur'})
        b_del, _ = Branch.objects.get_or_create(code='BR-DEL', defaults={'organization': org, 'name': 'Delhi NCR Regional Office', 'city': 'Gurugram', 'state': 'Haryana', 'is_head_office': False, 'address': 'Cyber City Phase 2'})

        # 3. Departments
        d_eng, _ = Department.objects.get_or_create(code='DEPT-ENG', defaults={'organization': org, 'branch': b_blr, 'name': 'Software Engineering & Cloud'})
        d_hr, _ = Department.objects.get_or_create(code='DEPT-HR', defaults={'organization': org, 'branch': b_mum, 'name': 'Human Resources & Talent'})
        d_sales, _ = Department.objects.get_or_create(code='DEPT-SLS', defaults={'organization': org, 'branch': b_del, 'name': 'Enterprise Sales & CRM'})
        d_fin, _ = Department.objects.get_or_create(code='DEPT-FIN', defaults={'organization': org, 'branch': b_mum, 'name': 'Finance & Billing Accounts'})
        d_ops, _ = Department.objects.get_or_create(code='DEPT-OPS', defaults={'organization': org, 'branch': b_mum, 'name': 'Operations & Management'})

        # 4. Designations
        des_ceo, _ = Designation.objects.get_or_create(title='Chief Executive Officer', department=d_ops, defaults={'grade': 'L6'})
        des_hr_mgr, _ = Designation.objects.get_or_create(title='HR Director', department=d_hr, defaults={'grade': 'L5'})
        des_mgr, _ = Designation.objects.get_or_create(title='Engineering Lead', department=d_eng, defaults={'grade': 'L4'})
        des_dev, _ = Designation.objects.get_or_create(title='Senior Fullstack Engineer', department=d_eng, defaults={'grade': 'L3'})
        des_sales_lead, _ = Designation.objects.get_or_create(title='Enterprise Sales Director', department=d_sales, defaults={'grade': 'L4'})
        des_fin_head, _ = Designation.objects.get_or_create(title='Finance Controller', department=d_fin, defaults={'grade': 'L4'})

        # 5. Roles
        roles_def = [
            ('super_admin', 'Super Admin', 'Unrestricted administrative access to all modules, settings, users and audit logs.'),
            ('sub_admin', 'Sub-Admin', 'Assigned branch/department level administrative access.'),
            ('hr_manager', 'HR Manager', 'Manage employees, attendance, leave, holidays, shifts, and payroll preparation.'),
            ('manager', 'Team Manager', 'Team approvals, team attendance monitoring, task assignment and performance.'),
            ('employee', 'Employee', 'Self-service attendance check-in/out, leave application, holiday calendar and payslips.'),
            ('accounts', 'Finance & Accounts', 'Invoicing, quotations, customer payments, expense logging and financial reports.'),
            ('sales', 'Sales Executive', 'CRM leads, pipeline opportunities, customer accounts and sales activities.'),
        ]
        roles = {}
        for code, name, desc in roles_def:
            r, _ = Role.objects.get_or_create(code=code, defaults={'name': name, 'description': desc, 'is_system': True})
            roles[code] = r

        # 6. Granular Permissions
        perms_def = [
            ('hrms', 'employees', 'view', 'hrms.employees.view', 'View employee directory and profiles'),
            ('hrms', 'employees', 'create', 'hrms.employees.create', 'Create new employees'),
            ('hrms', 'employees', 'edit', 'hrms.employees.edit', 'Edit employee profiles'),
            ('hrms', 'employees', 'delete', 'hrms.employees.delete', 'Archive or delete employee records'),
            ('hrms', 'attendance', 'view', 'hrms.attendance.view', 'View attendance logs'),
            ('hrms', 'attendance', 'checkin', 'hrms.attendance.checkin', 'Perform camera check-in / check-out'),
            ('hrms', 'attendance', 'approve', 'hrms.attendance.approve', 'Approve attendance corrections'),
            ('hrms', 'leave', 'apply', 'hrms.leave.apply', 'Apply for leave'),
            ('hrms', 'leave', 'approve', 'hrms.leave.approve', 'Approve employee leave applications'),
            ('hrms', 'holidays', 'view', 'hrms.holidays.view', 'View company holiday calendar'),
            ('hrms', 'holidays', 'manage', 'hrms.holidays.manage', 'Add, edit and archive holidays'),
            ('payroll', 'salary', 'view', 'payroll.salary.view', 'View salary structures'),
            ('payroll', 'salary', 'edit', 'payroll.salary.edit', 'Create and modify salary structures'),
            ('payroll', 'runs', 'process', 'payroll.runs.process', 'Run and calculate payroll'),
            ('payroll', 'runs', 'approve', 'payroll.runs.approve', 'Approve and finalize payroll runs'),
            ('payroll', 'payslips', 'view_own', 'payroll.payslips.view_own', 'View own released payslips'),
            ('crm', 'leads', 'view', 'crm.leads.view', 'View CRM leads and opportunities'),
            ('crm', 'leads', 'manage', 'crm.leads.manage', 'Create and convert leads'),
            ('crm', 'pipeline', 'edit', 'crm.pipeline.edit', 'Move opportunities across pipeline stages'),
            ('billing', 'invoices', 'view', 'billing.invoices.view', 'View invoices and receipts'),
            ('billing', 'invoices', 'create', 'billing.invoices.create', 'Create and send invoices'),
            ('billing', 'payments', 'record', 'billing.payments.record', 'Record customer payments'),
            ('billing', 'expenses', 'manage', 'billing.expenses.manage', 'Log and manage business expenses'),
            ('admin', 'users', 'manage', 'admin.users.manage', 'Manage users and assign roles'),
            ('admin', 'roles', 'manage', 'admin.roles.manage', 'Manage RBAC permissions matrix'),
            ('reports', 'all', 'view', 'reports.all.view', 'Access executive reports and export data'),
        ]
        all_perms = []
        for mod, sub, act, code, desc in perms_def:
            p, _ = Permission.objects.get_or_create(code=code, defaults={'module': mod, 'submodule': sub, 'action': act, 'description': desc})
            all_perms.append(p)

        # Assign permissions to roles
        for p in all_perms:
            # Super admin gets all permissions
            RolePermission.objects.get_or_create(role=roles['super_admin'], permission=p, defaults={'data_scope': 'all'})
            
            # HR gets HRMS + Payroll + Reports
            if p.module in ['hrms', 'payroll', 'reports']:
                RolePermission.objects.get_or_create(role=roles['hr_manager'], permission=p, defaults={'data_scope': 'all'})
            
            # Manager gets approvals, attendance view, CRM view
            if p.code in ['hrms.attendance.view', 'hrms.attendance.approve', 'hrms.leave.approve', 'hrms.attendance.checkin', 'crm.leads.view', 'payroll.payslips.view_own', 'hrms.holidays.view']:
                RolePermission.objects.get_or_create(role=roles['manager'], permission=p, defaults={'data_scope': 'team'})

            # Employee gets self service
            if p.code in ['hrms.attendance.checkin', 'hrms.leave.apply', 'hrms.holidays.view', 'payroll.payslips.view_own']:
                RolePermission.objects.get_or_create(role=roles['employee'], permission=p, defaults={'data_scope': 'own'})

            # Accounts gets Billing + Reports + Payroll view
            if p.module in ['billing', 'reports'] or p.code in ['payroll.payslips.view_own', 'hrms.holidays.view']:
                RolePermission.objects.get_or_create(role=roles['accounts'], permission=p, defaults={'data_scope': 'all'})

            # Sales gets CRM + Billing View
            if p.module == 'crm' or p.code in ['billing.invoices.view', 'payroll.payslips.view_own', 'hrms.attendance.checkin', 'hrms.holidays.view']:
                RolePermission.objects.get_or_create(role=roles['sales'], permission=p, defaults={'data_scope': 'assigned'})

        # 7. Shifts
        s_morning, _ = Shift.objects.get_or_create(code='SH-GEN', defaults={'name': 'Standard General Shift', 'start_time': datetime.time(9, 0), 'end_time': datetime.time(18, 0), 'grace_period_minutes': 15, 'break_duration_minutes': 60})
        s_flex, _ = Shift.objects.get_or_create(code='SH-FLEX', defaults={'name': 'Flexible Tech Shift', 'start_time': datetime.time(10, 0), 'end_time': datetime.time(19, 0), 'grace_period_minutes': 30, 'break_duration_minutes': 60})

        # 8. Super Admin User (Clean setup, 0 fake employees)
        admin_user, _ = User.objects.get_or_create(
            email='superadmin12@gmail.com',
            defaults={
                'username': 'superadmin12@gmail.com',
                'first_name': 'Super',
                'last_name': 'Admin',
                'role': roles['super_admin'],
                'is_staff': True,
                'is_superuser': True,
                'status': 'active'
            }
        )
        admin_user.set_password('123456789')
        admin_user.save()

        created_users = {'superadmin12@gmail.com': admin_user}
        created_employees = {}

        # 9. Leave Types & Balances
        lt_cl, _ = LeaveType.objects.get_or_create(code='CL', defaults={'name': 'Casual Leave', 'days_per_year': 12, 'is_paid': True, 'color': '#3B82F6'})
        lt_sl, _ = LeaveType.objects.get_or_create(code='SL', defaults={'name': 'Sick Leave', 'days_per_year': 10, 'is_paid': True, 'color': '#10B981'})
        lt_el, _ = LeaveType.objects.get_or_create(code='EL', defaults={'name': 'Earned / Annual Leave', 'days_per_year': 18, 'is_paid': True, 'color': '#8B5CF6'})
        lt_lop, _ = LeaveType.objects.get_or_create(code='LOP', defaults={'name': 'Loss of Pay (Unpaid)', 'days_per_year': 365, 'is_paid': False, 'color': '#EF4444'})

        for emp in created_employees.values():
            LeaveBalance.objects.get_or_create(employee=emp, leave_type=lt_cl, year=2026, defaults={'total_allocated': 12, 'used': 2, 'pending': 0})
            LeaveBalance.objects.get_or_create(employee=emp, leave_type=lt_sl, year=2026, defaults={'total_allocated': 10, 'used': 1, 'pending': 0})
            LeaveBalance.objects.get_or_create(employee=emp, leave_type=lt_el, year=2026, defaults={'total_allocated': 18, 'used': 4, 'pending': 0})

        # 10. Holidays (Interactive Calendar + Table)
        holidays_list = [
            ("New Year's Day", datetime.date(2026, 1, 1), 'public', 'Celebration of the New Gregorian Calendar Year'),
            ("Republic Day", datetime.date(2026, 1, 26), 'public', 'Constitution of India came into effect'),
            ("Holi Festival", datetime.date(2026, 3, 20), 'public', 'Festival of colors and spring'),
            ("Good Friday", datetime.date(2026, 4, 3), 'public', 'Christian holiday commemorating the crucifixion'),
            ("Maharashtra Day", datetime.date(2026, 5, 1), 'company', 'State formation holiday (Mumbai Head Office)'),
            ("Independence Day", datetime.date(2026, 8, 15), 'public', 'National commemoration of Indian Independence'),
            ("Mahatma Gandhi Jayanti", datetime.date(2026, 10, 2), 'public', 'Birth anniversary of Father of the Nation'),
            ("Diwali (Laxmi Puja)", datetime.date(2026, 11, 8), 'public', 'Festival of lights'),
            ("Bhai Dooj", datetime.date(2026, 11, 10), 'company', 'Post-Diwali celebration'),
            ("Christmas Day", datetime.date(2026, 12, 25), 'public', 'Celebration of the birth of Jesus Christ'),
        ]
        for name, h_date, h_type, desc in holidays_list:
            Holiday.objects.get_or_create(name=name, date=h_date, defaults={'holiday_type': h_type, 'description': desc, 'is_paid': True, 'is_active': True})

        # 11. Attendance Records (Recent days)
        today = datetime.date.today()
        for i in range(1, 10):
            d = today - datetime.timedelta(days=i)
            # Skip Sundays
            if d.weekday() == 6:
                continue
            for emp in created_employees.values():
                status = 'present'
                check_in = datetime.time(9, 2, 0)
                check_out = datetime.time(18, 15, 0)
                late_min = 0
                if i == 2 and emp.employee_id == 'GB-EMP-006':
                    status = 'late'
                    check_in = datetime.time(9, 45, 0)
                    late_min = 45
                elif i == 4 and emp.employee_id == 'GB-EMP-004':
                    status = 'work_from_home'

                AttendanceEvent.objects.get_or_create(
                    employee=emp,
                    date=d,
                    defaults={
                        'check_in_time': check_in,
                        'check_out_time': check_out,
                        'status': status,
                        'total_hours': Decimal('8.5'),
                        'break_hours': Decimal('1.0'),
                        'late_minutes': late_min,
                    }
                )

        # 12. Payroll Period & Completed Run
        period_oct, _ = PayrollPeriod.objects.get_or_create(
            name='October 2026',
            start_date=datetime.date(2026, 10, 1),
            end_date=datetime.date(2026, 10, 31),
            defaults={'total_days': 31, 'working_days': 22, 'divisor_policy': 'calendar_days', 'status': 'finalized'}
        )

        run_oct, _ = PayrollRun.objects.get_or_create(
            period=period_oct,
            defaults={
                'total_gross': Decimal('900000.00'),
                'total_deductions': Decimal('36000.00'),
                'total_net': Decimal('864000.00'),
                'total_employees': 6,
                'status': 'finalized',
                'finalized_at': datetime.datetime(2026, 10, 31, 18, 0),
            }
        )

        for emp in created_employees.values():
            ss = emp.salary_structures.filter(is_active=True).first()
            if ss:
                Payslip.objects.get_or_create(
                    payroll_run=run_oct,
                    employee=emp,
                    defaults={
                        'payslip_number': f"PAY-202610-{emp.employee_id[-3:]}",
                        'total_days': Decimal('31.0'),
                        'working_days': Decimal('22.0'),
                        'payable_days': Decimal('22.0'),
                        'paid_leave_days': Decimal('0.0'),
                        'unpaid_leave_days': Decimal('0.0'),
                        'holidays_count': Decimal('2.0'),
                        'weekly_offs_count': Decimal('8.0'),
                        'basic_salary': ss.basic_salary,
                        'hra': ss.hra,
                        'allowances': ss.conveyance_allowance + ss.medical_allowance + ss.special_allowance,
                        'gross_salary': ss.gross_salary,
                        'pf_deduction': ss.provident_fund,
                        'tax_deduction': ss.professional_tax,
                        'total_deductions': ss.total_deductions,
                        'net_salary': ss.net_salary,
                        'status': 'released',
                    }
                )

        # Period for Current Month in Review
        period_nov, _ = PayrollPeriod.objects.get_or_create(
            name='November 2026',
            start_date=datetime.date(2026, 11, 1),
            end_date=datetime.date(2026, 11, 30),
            defaults={'total_days': 30, 'working_days': 21, 'divisor_policy': 'calendar_days', 'status': 'review'}
        )
        PayrollRun.objects.get_or_create(
            period=period_nov,
            defaults={
                'total_gross': Decimal('900000.00'),
                'total_deductions': Decimal('36000.00'),
                'total_net': Decimal('864000.00'),
                'total_employees': 6,
                'status': 'review',
            }
        )

        # 13. Products & Services Master
        p1, _ = ProductService.objects.get_or_create(sku='SKU-ERP-CORE', defaults={'name': 'Greenbacks ERP Enterprise Cloud Suite (Annual)', 'item_type': 'subscription', 'unit_price': Decimal('350000.00'), 'tax_rate': Decimal('18.00'), 'unit': 'License/Yr', 'hsn_sac': '998313'})
        p2, _ = ProductService.objects.get_or_create(sku='SKU-IMP-CONS', defaults={'name': 'ERP Architecture & Implementation Consulting', 'item_type': 'service', 'unit_price': Decimal('85000.00'), 'tax_rate': Decimal('18.00'), 'unit': 'Man-Day', 'hsn_sac': '998314'})
        p3, _ = ProductService.objects.get_or_create(sku='SKU-AMC-SUPP', defaults={'name': 'Premium 24/7 SLA Support & Maintenance', 'item_type': 'service', 'unit_price': Decimal('120000.00'), 'tax_rate': Decimal('18.00'), 'unit': 'Year', 'hsn_sac': '998319'})
        p4, _ = ProductService.objects.get_or_create(sku='SKU-DEV-CUSTOM', defaults={'name': 'Custom Workflow & Integration Engineering', 'item_type': 'service', 'unit_price': Decimal('45000.00'), 'tax_rate': Decimal('18.00'), 'unit': 'Sprint', 'hsn_sac': '998314'})

        # 14. CRM Customers & Leads
        c_tata, _ = Customer.objects.get_or_create(
            customer_code='CUST-1001',
            defaults={
                'company_name': 'Tata Advanced Dynamics Ltd',
                'contact_person': 'Rajesh Chandran',
                'email': 'r.chandran@tatadynamics.com',
                'phone': '+91 22 2456 7890',
                'gstin': '27AABCT9988P1Z8',
                'city': 'Mumbai',
                'state': 'Maharashtra',
                'credit_limit': Decimal('500000.00'),
                'outstanding_balance': Decimal('82600.00'),
                'assigned_to': admin_user
            }
        )
        c_infosys, _ = Customer.objects.get_or_create(
            customer_code='CUST-1002',
            defaults={
                'company_name': 'Apex Global Logistics Solutions',
                'contact_person': 'Meera Sundaram',
                'email': 'meera@apexlogistics.in',
                'phone': '+91 80 4123 9900',
                'gstin': '29AABCA4567M1ZX',
                'city': 'Bengaluru',
                'state': 'Karnataka',
                'credit_limit': Decimal('1000000.00'),
                'outstanding_balance': Decimal('0.00'),
                'assigned_to': admin_user
            }
        )

        # CRM Leads
        Lead.objects.get_or_create(
            lead_id='LEAD-2026-001',
            defaults={
                'first_name': 'Kavita',
                'last_name': 'Krishnan',
                'company_name': 'Zenith Health Innovations',
                'email': 'kavita@zenithhealth.org',
                'phone': '+91 98200 45123',
                'source': 'website',
                'interested_product': 'Odias ERP Enterprise Suite',
                'estimated_value': Decimal('420000.00'),
                'status': 'proposal',
                'priority': 'high',
                'assigned_to': admin_user,
                'notes': 'Requested a customized quotation for HRMS + Payroll + Invoicing modules.'
            }
        )
        Lead.objects.get_or_create(
            lead_id='LEAD-2026-002',
            defaults={
                'first_name': 'Arun',
                'last_name': 'Chopra',
                'company_name': 'Metro Rail Infra Ventures',
                'email': 'achopra@metrorailinfra.in',
                'phone': '+91 11 4512 8877',
                'source': 'referral',
                'interested_product': 'ERP Architecture Consulting',
                'estimated_value': Decimal('750000.00'),
                'status': 'qualified',
                'priority': 'medium',
                'assigned_to': admin_user,
                'notes': 'Interested in multi-branch attendance with selfie camera and biometric integration.'
            }
        )

        # Opportunities
        Opportunity.objects.get_or_create(
            title='Enterprise ERP Deployment - FY 2026',
            customer=c_tata,
            defaults={
                'estimated_value': Decimal('520000.00'),
                'probability': 80,
                'expected_close_date': datetime.date(2026, 12, 15),
                'stage': 'negotiation',
                'assigned_to': admin_user
            }
        )

        # CRM Activity
        CRMActivity.objects.get_or_create(
            title='Executive Demo of Camera Attendance & Payroll',
            customer=c_tata,
            defaults={
                'activity_type': 'meeting',
                'description': 'Showcased selfie verification, holiday management calendar, and PDF payslip builder.',
                'due_date': datetime.datetime.now() + datetime.timedelta(days=2),
                'status': 'pending',
                'assigned_to': admin_user
            }
        )

        # 15. Quotation & Invoice
        q1, _ = Quotation.objects.get_or_create(
            quotation_number='QT-2026-0089',
            customer=c_tata,
            defaults={
                'quotation_date': datetime.date(2026, 10, 15),
                'valid_until': datetime.date(2026, 11, 15),
                'subtotal': Decimal('350000.00'),
                'tax_amount': Decimal('63000.00'),
                'total_amount': Decimal('413000.00'),
                'status': 'accepted',
                'created_by': admin_user
            }
        )
        QuotationItem.objects.get_or_create(
            quotation=q1,
            product=p1,
            item_name=p1.name,
            defaults={'quantity': Decimal('1.0'), 'unit_price': Decimal('350000.00'), 'tax_rate': Decimal('18.0'), 'tax_amount': Decimal('63000.00'), 'total': Decimal('413000.00')}
        )

        # Invoice with GST Breakdown
        inv1, _ = Invoice.objects.get_or_create(
            invoice_number='INV-2026-0042',
            customer=c_tata,
            defaults={
                'quotation': q1,
                'invoice_date': datetime.date(2026, 10, 20),
                'due_date': datetime.date(2026, 11, 4),
                'subtotal': Decimal('350000.00'),
                'cgst': Decimal('31500.00'),
                'sgst': Decimal('31500.00'),
                'igst': Decimal('0.00'),
                'total_tax': Decimal('63000.00'),
                'total_amount': Decimal('413000.00'),
                'paid_amount': Decimal('330400.00'),
                'balance_amount': Decimal('82600.00'),
                'status': 'partially_paid',
                'place_of_supply': 'Maharashtra (27)',
                'created_by': admin_user
            }
        )
        InvoiceItem.objects.get_or_create(
            invoice=inv1,
            product=p1,
            item_name=p1.name,
            defaults={'hsn_sac': '998313', 'quantity': Decimal('1.0'), 'unit_price': Decimal('350000.00'), 'tax_rate': Decimal('18.0'), 'tax_amount': Decimal('63000.00'), 'total': Decimal('413000.00')}
        )

        # Payment against Invoice
        Payment.objects.get_or_create(
            payment_number='PAY-REC-901',
            invoice=inv1,
            customer=c_tata,
            defaults={
                'payment_date': datetime.date(2026, 10, 25),
                'amount': Decimal('330400.00'),
                'payment_mode': 'bank_transfer',
                'transaction_reference': 'HDFC_CMS_NEFT_981240192',
                'notes': '80% advance milestone paid as agreed.',
                'recorded_by': admin_user
            }
        )

        # Expenses
        Expense.objects.get_or_create(
            title='AWS Cloud Hosting & PostgreSQL Cluster (October 2026)',
            expense_date=datetime.date(2026, 10, 28),
            defaults={
                'category': 'cloud_software',
                'amount': Decimal('48500.00'),
                'vendor': 'Amazon Web Services Inc.',
                'payment_mode': 'Corporate Card',
                'status': 'approved',
                'notes': 'Production ERP database and channels broker charges.',
                'recorded_by': admin_user
            }
        )
        Expense.objects.get_or_create(
            title='High-Speed Fiber Lease Line - Bandra Head Office',
            expense_date=datetime.date(2026, 11, 2),
            defaults={
                'category': 'utilities',
                'amount': Decimal('14200.00'),
                'vendor': 'Tata Communications Ltd',
                'payment_mode': 'Direct Debit',
                'status': 'approved',
                'notes': 'Monthly enterprise connectivity.',
                'recorded_by': admin_user
            }
        )

        # 16. Audit Log
        AuditLog.objects.get_or_create(
            action='payroll_finalized',
            module='payroll',
            entity_name='PayrollRun',
            defaults={
                'user': admin_user,
                'description': 'Finalized and released payslips for October 2026 across all branches.',
                'ip_address': '192.168.1.105'
            }
        )
        AuditLog.objects.get_or_create(
            action='invoice_issued',
            module='billing',
            entity_name='Invoice',
            defaults={
                'user': admin_user,
                'description': 'Issued Invoice INV-2026-0042 to Tata Advanced Dynamics Ltd.',
                'ip_address': '192.168.1.112'
            }
        )

        # 17. Notifications & Announcements
        Notification.objects.get_or_create(
            user=admin_user,
            title='Welcome to Odias ERP',
            defaults={
                'message': 'Super Admin enterprise master control panel is active and ready.',
                'notification_type': 'success',
                'link': '/app/dashboard'
            }
        )

        Announcement.objects.get_or_create(
            title='Odias ERP 2.0 Go-Live & Unified Workflow Rollout',
            defaults={
                'content': 'Welcome to the unified Odias ERP suite. Modules for HRMS, CRM, and Billing are live with camera-assisted attendance, holiday calendars, and instant payslips.',
                'priority': 'urgent',
                'created_by': admin_user
            }
        )

        self.stdout.write(self.style.SUCCESS("Database seeding completed successfully!"))
