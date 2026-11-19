from django.db import models
from django.conf import settings
from hrms.models import Employee
import uuid

class SalaryStructure(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='salary_structures')
    effective_from = models.DateField()
    
    # Earnings
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    hra = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    conveyance_allowance = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    medical_allowance = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    special_allowance = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    
    # Deductions
    provident_fund = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    professional_tax = models.DecimalField(max_digits=12, decimal_places=2, default=200.0)
    esi = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    other_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def gross_salary(self):
        return (
            self.basic_salary + self.hra + 
            self.conveyance_allowance + self.medical_allowance + 
            self.special_allowance
        )

    @property
    def total_deductions(self):
        return (
            self.provident_fund + self.professional_tax + 
            self.esi + self.other_deductions
        )

    @property
    def net_salary(self):
        return max(0.0, self.gross_salary - self.total_deductions)

    def __str__(self):
        return f"{self.employee.full_name} - ₹{self.gross_salary}/mo"

class PayrollPeriod(models.Model):
    DIVISOR_CHOICES = [
        ('calendar_days', 'Calendar Days Basis (e.g. 30/31 days)'),
        ('working_days', 'Scheduled Working Days Basis'),
    ]
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('review', 'Under Review'),
        ('approved', 'Approved'),
        ('finalized', 'Finalized'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100) # e.g. "November 2026"
    start_date = models.DateField()
    end_date = models.DateField()
    total_days = models.PositiveIntegerField(default=30)
    working_days = models.PositiveIntegerField(default=22)
    divisor_policy = models.CharField(max_length=30, choices=DIVISOR_CHOICES, default='calendar_days')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.status})"

class PayrollRun(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('review', 'Under Review'),
        ('approved', 'Approved'),
        ('finalized', 'Finalized'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    period = models.ForeignKey(PayrollPeriod, on_delete=models.CASCADE, related_name='runs')
    total_gross = models.DecimalField(max_digits=15, decimal_places=2, default=0.0)
    total_deductions = models.DecimalField(max_digits=15, decimal_places=2, default=0.0)
    total_net = models.DecimalField(max_digits=15, decimal_places=2, default=0.0)
    total_employees = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_payrolls')
    finalized_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payroll Run - {self.period.name} ({self.status})"

class Payslip(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('approved', 'Approved'),
        ('released', 'Released to Employee'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payroll_run = models.ForeignKey(PayrollRun, on_delete=models.CASCADE, related_name='payslips')
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='payslips')
    payslip_number = models.CharField(max_length=50, unique=True)
    
    # Days Breakdown
    total_days = models.DecimalField(max_digits=4, decimal_places=1, default=30.0)
    working_days = models.DecimalField(max_digits=4, decimal_places=1, default=22.0)
    payable_days = models.DecimalField(max_digits=4, decimal_places=1, default=22.0)
    paid_leave_days = models.DecimalField(max_digits=4, decimal_places=1, default=0.0)
    unpaid_leave_days = models.DecimalField(max_digits=4, decimal_places=1, default=0.0) # LOP
    holidays_count = models.DecimalField(max_digits=4, decimal_places=1, default=0.0)
    weekly_offs_count = models.DecimalField(max_digits=4, decimal_places=1, default=0.0)

    # Earnings
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    hra = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    allowances = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    gross_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    
    # Deductions
    pf_deduction = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    tax_deduction = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    lop_deduction = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    total_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    
    # Final Pay
    net_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    payment_mode = models.CharField(max_length=50, default='Bank Transfer')
    payment_status = models.CharField(max_length=20, default='Processed')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.payslip_number} - {self.employee.full_name}"

class SalaryAdvance(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('disbursed', 'Disbursed'),
        ('rejected', 'Rejected'),
        ('recovered', 'Fully Recovered'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='salary_advances')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    reason = models.TextField()
    requested_date = models.DateField(auto_now_add=True)
    monthly_emi = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    tenure_months = models.PositiveIntegerField(default=3)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_advances')
    disbursed_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Advance: {self.employee.full_name} - ₹{self.amount} ({self.status})"

class BonusIncentive(models.Model):
    BONUS_TYPES = [
        ('performance', 'Performance Quarterly Incentive'),
        ('festival_diwali', 'Diwali / Annual Festival Ex-Gratia'),
        ('spot_award', 'Spot Appreciation Award'),
        ('referral', 'Talent Referral Bonus'),
        ('sales_commission', 'Sales Commission Payout'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('paid', 'Disbursed / Paid with Salary'),
        ('cancelled', 'Cancelled'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='bonuses')
    bonus_type = models.CharField(max_length=30, choices=BONUS_TYPES, default='performance')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    effective_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    remarks = models.TextField(blank=True, default='')
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_bonuses')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Bonus: {self.employee.full_name} - ₹{self.amount} ({self.bonus_type})"

class CustomDeduction(models.Model):
    DEDUCTION_TYPES = [
        ('tds', 'TDS / Voluntary Income Tax'),
        ('late_fine', 'Late Arrival Attendance Penalty'),
        ('asset_damage', 'Asset Replacement / Damage Recovery'),
        ('health_insurance', 'Group Medical Insurance Top-up'),
        ('loan_recovery', 'Staff Loan / Advance EMI Deduction'),
        ('other', 'Other Statutory / Internal Adjustment'),
    ]
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled for Next Payroll'),
        ('deducted', 'Deducted from Payslip'),
        ('waived', 'Waived / Cancelled'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='custom_deductions')
    deduction_type = models.CharField(max_length=30, choices=DEDUCTION_TYPES, default='other')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    effective_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Deduction: {self.employee.full_name} - ₹{self.amount} ({self.deduction_type})"

class SettlementRecord(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Calculation Draft'),
        ('approved', 'Finance & HR Approved'),
        ('disbursed', 'Settlement Disbursed'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='settlements')
    resignation_date = models.DateField()
    last_working_day = models.DateField()
    gratuity_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    leave_encashment_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    notice_pay_payable = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    asset_recovery_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    net_settlement_payable = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    remarks = models.TextField(blank=True, default='')
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_settlements')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Settlement: {self.employee.full_name} - Net ₹{self.net_settlement_payable}"
