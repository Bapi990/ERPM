from rest_framework import serializers
from .models import Organization, Branch, Department, Designation

class DesignationSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = Designation
        fields = ['id', 'title', 'grade', 'department', 'department_name', 'description', 'is_active']

class DepartmentSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    employee_count = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = ['id', 'name', 'code', 'organization', 'branch', 'branch_name', 'description', 'is_active', 'employee_count']

    def get_employee_count(self, obj):
        return obj.employees.count()

class BranchSerializer(serializers.ModelSerializer):
    employee_count = serializers.SerializerMethodField()

    class Meta:
        model = Branch
        fields = ['id', 'name', 'code', 'city', 'state', 'country', 'address', 'is_head_office', 'is_active', 'employee_count']

    def get_employee_count(self, obj):
        return obj.employees.count()

class OrganizationSerializer(serializers.ModelSerializer):
    branches = BranchSerializer(many=True, read_only=True)
    departments = DepartmentSerializer(many=True, read_only=True)

    class Meta:
        model = Organization
        fields = [
            'id', 'name', 'code', 'logo_url', 'email', 'phone', 'address',
            'city', 'state', 'country', 'postal_code', 'tax_identifier',
            'currency', 'currency_symbol', 'time_zone', 'financial_year_start',
            'branches', 'departments'
        ]
