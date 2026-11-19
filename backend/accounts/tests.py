from django.test import TestCase
from rest_framework.test import APIClient
from accounts.models import User, Role, Permission, RolePermission
from organizations.models import Organization, Branch, Department, Designation
from hrms.models import Shift, Employee, Holiday, LeaveType, LeaveBalance
from payroll.models import SalaryStructure, PayrollPeriod, PayrollRun, Payslip
from crm.models import Lead, Customer, Opportunity
from billing.models import ProductService, Invoice
from decimal import Decimal
import datetime

class ERPWorkflowTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.role_admin = Role.objects.create(name='Super Admin', code='super_admin', is_system=True)
        self.role_emp = Role.objects.create(name='Employee', code='employee', is_system=True)

        self.user_admin = User.objects.create_user(
            username='admin_test',
            email='admin@test.corp',
            password='password123',
            role=self.role_admin
        )
        self.user_emp = User.objects.create_user(
            username='emp_test',
            email='emp@test.corp',
            password='password123',
            role=self.role_emp
        )

        self.org = Organization.objects.create(name='Test Org')
        self.branch = Branch.objects.create(organization=self.org, name='Mumbai', code='MUM', city='Mumbai', state='Maharashtra')
        self.dept = Department.objects.create(organization=self.org, branch=self.branch, name='Eng', code='ENG')
        self.desig = Designation.objects.create(department=self.dept, title='Developer')
        self.shift = Shift.objects.create(name='Day', code='DAY', start_time=datetime.time(9, 0), end_time=datetime.time(18, 0))

        self.emp = Employee.objects.create(
            user=self.user_emp,
            employee_id='TEST-001',
            first_name='Rohan',
            last_name='Mehta',
            email='emp@test.corp',
            phone='9820011223',
            branch=self.branch,
            department=self.dept,
            designation=self.desig,
            shift=self.shift,
            date_of_joining=datetime.date(2023, 1, 1)
        )

    def test_login_and_jwt(self):
        res = self.client.post('/api/v1/auth/login/', {'email': 'admin@test.corp', 'password': 'password123'})
        self.assertEqual(res.status_code, 200)
        self.assertIn('tokens', res.data)
        self.assertIn('access', res.data['tokens'])

    def test_attendance_checkin(self):
        self.client.force_authenticate(user=self.user_emp)
        res = self.client.post('/api/v1/hrms/attendance/check-in/', {'selfie_data': 'data:image/jpeg;base64,sample'})
        self.assertEqual(res.status_code, 200)
        self.assertIn('attendance', res.data)
        self.assertEqual(res.data['attendance']['employee_code'], 'TEST-001')

    def test_payroll_holiday_protection(self):
        # Salary structure: 100,000 gross
        SalaryStructure.objects.create(
            employee=self.emp,
            effective_from=datetime.date(2026, 1, 1),
            basic_salary=Decimal('50000'),
            hra=Decimal('25000'),
            conveyance_allowance=Decimal('5000'),
            medical_allowance=Decimal('5000'),
            special_allowance=Decimal('15000'),
            provident_fund=Decimal('1800'),
            professional_tax=Decimal('200'),
            is_active=True
        )

        # 2 Paid Holidays in month
        Holiday.objects.create(name='Diwali', date=datetime.date(2026, 11, 8), is_paid=True)
        Holiday.objects.create(name='Bhai Dooj', date=datetime.date(2026, 11, 10), is_paid=True)

        period = PayrollPeriod.objects.create(
            name='November 2026',
            start_date=datetime.date(2026, 11, 1),
            end_date=datetime.date(2026, 11, 30),
            total_days=30,
            working_days=21
        )

        self.client.force_authenticate(user=self.user_admin)
        res = self.client.post('/api/v1/payroll/process/', {'period_id': str(period.id)})
        self.assertEqual(res.status_code, 200)

        payslip = Payslip.objects.filter(employee=self.emp).first()
        self.assertIsNotNone(payslip)
        # Verify paid holidays are acknowledged and unpaid LOP is 0
        self.assertEqual(payslip.unpaid_leave_days, Decimal('0.0'))
        self.assertEqual(payslip.payable_days, Decimal('30.0'))
        self.assertEqual(payslip.net_salary, Decimal('98000.00')) # 100,000 gross - 2,000 deductions
