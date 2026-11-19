from rest_framework import serializers
from .models import SalaryStructure, PayrollPeriod, PayrollRun, Payslip, SalaryAdvance, BonusIncentive, CustomDeduction, SettlementRecord
from hrms.models import Employee

class SalaryStructureSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_code = serializers.CharField(source='employee.employee_id', read_only=True)
    gross = serializers.DecimalField(source='gross_salary', max_digits=12, decimal_places=2, read_only=True)
    deductions = serializers.DecimalField(source='total_deductions', max_digits=12, decimal_places=2, read_only=True)
    net = serializers.DecimalField(source='net_salary', max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = SalaryStructure
        fields = [
            'id', 'employee', 'employee_name', 'employee_code', 'effective_from',
            'basic_salary', 'hra', 'conveyance_allowance', 'medical_allowance',
            'special_allowance', 'provident_fund', 'professional_tax', 'esi',
            'other_deductions', 'gross', 'deductions', 'net', 'is_active', 'created_at'
        ]

class PayrollPeriodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayrollPeriod
        fields = '__all__'

class PayslipSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_code = serializers.CharField(source='employee.employee_id', read_only=True)
    department_name = serializers.CharField(source='employee.department.name', read_only=True)
    designation_title = serializers.CharField(source='employee.designation.title', read_only=True)
    bank_account = serializers.CharField(source='employee.bank_account_number', read_only=True)
    bank_name = serializers.CharField(source='employee.bank_name', read_only=True)
    pan_number = serializers.CharField(source='employee.pan_number', read_only=True)
    period_name = serializers.CharField(source='payroll_run.period.name', read_only=True)

    class Meta:
        model = Payslip
        fields = '__all__'

class PayrollRunSerializer(serializers.ModelSerializer):
    period_name = serializers.CharField(source='period.name', read_only=True)
    payslips_count = serializers.SerializerMethodField()

    class Meta:
        model = PayrollRun
        fields = [
            'id', 'period', 'period_name', 'total_gross', 'total_deductions',
            'total_net', 'total_employees', 'status', 'approved_by',
            'finalized_at', 'created_at', 'payslips_count'
        ]

    def get_payslips_count(self, obj):
        return obj.payslips.count()

class SalaryAdvanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_code = serializers.CharField(source='employee.employee_id', read_only=True)
    department_name = serializers.CharField(source='employee.department.name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)

    class Meta:
        model = SalaryAdvance
        fields = '__all__'

class BonusIncentiveSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_code = serializers.CharField(source='employee.employee_id', read_only=True)
    department_name = serializers.CharField(source='employee.department.name', read_only=True)
    bonus_type_display = serializers.CharField(source='get_bonus_type_display', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)

    class Meta:
        model = BonusIncentive
        fields = '__all__'

class CustomDeductionSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_code = serializers.CharField(source='employee.employee_id', read_only=True)
    department_name = serializers.CharField(source='employee.department.name', read_only=True)
    deduction_type_display = serializers.CharField(source='get_deduction_type_display', read_only=True)

    class Meta:
        model = CustomDeduction
        fields = '__all__'

class SettlementRecordSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_code = serializers.CharField(source='employee.employee_id', read_only=True)
    department_name = serializers.CharField(source='employee.department.name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)

    class Meta:
        model = SettlementRecord
        fields = '__all__'
