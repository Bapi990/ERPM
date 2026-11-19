import os, sys, json
sys.path.insert(0, os.path.abspath('backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'erp_backend.settings')
import django
django.setup()

from hrms.models import Employee, Department
from organizations.models import Designation
from accounts.models import User

employees = []
for e in Employee.objects.all():
    employees.append({
        'id': str(e.id),
        'employee_id': e.employee_id,
        'first_name': e.first_name,
        'last_name': e.last_name,
        'full_name': e.full_name,
        'email': e.email,
        'phone': e.phone,
        'department': e.department.name if e.department else '',
        'designation': e.designation.title if e.designation else '',
        'role_code': e.role_code,
        'role_name': e.role_name,
        'reporting_manager_id': str(e.reporting_manager.id) if e.reporting_manager else None,
        'reporting_manager_name': e.reporting_manager.full_name if e.reporting_manager else None,
        'assigned_hr_id': str(e.assigned_hr.id) if e.assigned_hr else None,
        'assigned_hr_name': e.assigned_hr.full_name if e.assigned_hr else None,
        'status': e.employment_status,
    })

print(json.dumps(employees, indent=2))
