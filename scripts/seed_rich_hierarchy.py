import os, sys
sys.path.insert(0, os.path.abspath('backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'erp_backend.settings')
import django
django.setup()

from hrms.models import Employee, Shift
from organizations.models import Organization, Department, Designation
import datetime

# 1. Fetch departments & designations
dept_eng = Department.objects.filter(name__icontains='Engineering').first()
dept_hr = Department.objects.filter(name__icontains='Human Resources').first()
dept_sales = Department.objects.filter(name__icontains='Sales').first()
dept_fin = Department.objects.filter(name__icontains='Finance').first()
dept_ops = Department.objects.filter(name__icontains='Operations').first()

desig_ceo = Designation.objects.filter(title__icontains='Chief Executive').first()
desig_hr_dir = Designation.objects.filter(title__icontains='HR Director').first()
desig_eng_lead = Designation.objects.filter(title__icontains='Engineering Lead').first()
desig_sales_dir = Designation.objects.filter(title__icontains='Sales Director').first()
desig_fin_ctrl = Designation.objects.filter(title__icontains='Finance Controller').first()
desig_sr_eng = Designation.objects.filter(title__icontains='Senior').first()
shift = Shift.objects.first()

# Ensure Sarah Jenkins is CEO / Super Admin root
ceo = Employee.objects.filter(first_name='Sarah', last_name='Jenkins').first()
if ceo:
    ceo.designation = desig_ceo
    ceo.role_code = 'super_admin'
    ceo.role_name = 'Chief Executive Officer'
    ceo.reporting_manager = None
    ceo.save()

# Ensure Ananya Sharma is HR Director reporting to CEO
hr_dir = Employee.objects.filter(first_name='Ananya', last_name='Sharma').first()
if hr_dir and ceo:
    hr_dir.reporting_manager = ceo
    hr_dir.role_code = 'hr_manager'
    hr_dir.role_name = 'HR Director'
    hr_dir.department = dept_hr
    hr_dir.save()

# Create or update Sunita Das as HR Manager (Corporate Operations)
hr_ops, _ = Employee.objects.get_or_create(
    employee_id='GB-EMP-011',
    defaults={
        'first_name': 'Sunita',
        'last_name': 'Das',
        'email': 'sunita.das@greenbacks.corp',
        'phone': '+91 98200 00710',
        'department': dept_ops or dept_hr,
        'designation': desig_hr_dir,
        'role_code': 'hr_manager',
        'role_name': 'HR Operations Lead',
        'reporting_manager': ceo,
        'date_of_joining': datetime.date(2023, 4, 15),
        'employment_status': 'active',
        'shift': shift,
    }
)

# Managers:
# Rahul Verma -> Engineering Lead reporting to Ananya Sharma (or CEO)
mgr_rahul = Employee.objects.filter(first_name='Rahul', last_name='Verma').first()
if mgr_rahul:
    mgr_rahul.reporting_manager = hr_dir
    mgr_rahul.role_code = 'manager'
    mgr_rahul.role_name = 'Software Engineering Lead'
    mgr_rahul.department = dept_eng
    mgr_rahul.save()

# Vikram Malhotra -> Sales Director reporting to Ananya Sharma (or CEO)
mgr_vikram = Employee.objects.filter(first_name='Vikram', last_name='Malhotra').first()
if mgr_vikram:
    mgr_vikram.reporting_manager = hr_dir
    mgr_vikram.role_code = 'manager'
    mgr_vikram.role_name = 'Enterprise Sales Director'
    mgr_vikram.department = dept_sales
    mgr_vikram.save()

# Pooja Desai -> Finance Controller reporting to Ananya Sharma
mgr_pooja = Employee.objects.filter(first_name='Pooja', last_name='Desai').first()
if mgr_pooja:
    mgr_pooja.reporting_manager = hr_dir
    mgr_pooja.role_code = 'manager'
    mgr_pooja.role_name = 'Finance Controller & Accounts Lead'
    mgr_pooja.department = dept_fin
    mgr_pooja.save()

# Amitabh Sen -> IT Logistics Manager reporting to Sunita Das
mgr_amitabh = Employee.objects.filter(first_name='Amitabh', last_name='Sen').first()
if mgr_amitabh:
    mgr_amitabh.reporting_manager = hr_ops
    mgr_amitabh.role_code = 'manager'
    mgr_amitabh.role_name = 'IT Infrastructure & Logistics Manager'
    mgr_amitabh.department = dept_ops
    mgr_amitabh.save()

# Employees under Rahul Verma (Engineering):
emp_rohan = Employee.objects.filter(first_name='Rohan', last_name='Mehta').first()
if emp_rohan and mgr_rahul:
    emp_rohan.reporting_manager = mgr_rahul
    emp_rohan.role_code = 'employee'
    emp_rohan.role_name = 'Senior Fullstack Engineer'
    emp_rohan.department = dept_eng
    emp_rohan.save()

emp_rakesh = Employee.objects.filter(first_name='Rakesh', last_name='Mohanty').first()
if emp_rakesh and mgr_rahul:
    emp_rakesh.reporting_manager = mgr_rahul
    emp_rakesh.role_code = 'employee'
    emp_rakesh.role_name = 'Cloud Infrastructure Engineer'
    emp_rakesh.department = dept_eng
    emp_rakesh.save()

# Add a couple more real employees
Employee.objects.get_or_create(
    employee_id='GB-EMP-012',
    defaults={
        'first_name': 'Priya',
        'last_name': 'Nair',
        'email': 'priya.nair@greenbacks.corp',
        'phone': '+91 98200 00810',
        'department': dept_eng,
        'role_code': 'employee',
        'role_name': 'Lead UI/UX Product Designer',
        'reporting_manager': mgr_rahul,
        'date_of_joining': datetime.date(2023, 6, 1),
        'employment_status': 'active',
        'shift': shift,
    }
)

Employee.objects.get_or_create(
    employee_id='GB-EMP-013',
    defaults={
        'first_name': 'Amit',
        'last_name': 'Patel',
        'email': 'amit.patel@greenbacks.corp',
        'phone': '+91 98200 00910',
        'department': dept_eng,
        'role_code': 'employee',
        'role_name': 'DevOps & Kubernetes Engineer',
        'reporting_manager': mgr_rahul,
        'date_of_joining': datetime.date(2023, 8, 12),
        'employment_status': 'active',
        'shift': shift,
    }
)

# Employees under Vikram Malhotra (Sales):
Employee.objects.get_or_create(
    employee_id='GB-EMP-014',
    defaults={
        'first_name': 'Karan',
        'last_name': 'Singhania',
        'email': 'karan.s@greenbacks.corp',
        'phone': '+91 98200 01010',
        'department': dept_sales,
        'role_code': 'employee',
        'role_name': 'Senior Enterprise Account Executive',
        'reporting_manager': mgr_vikram,
        'date_of_joining': datetime.date(2023, 9, 1),
        'employment_status': 'active',
        'shift': shift,
    }
)

Employee.objects.get_or_create(
    employee_id='GB-EMP-015',
    defaults={
        'first_name': 'Swati',
        'last_name': 'Das',
        'email': 'swati.das@greenbacks.corp',
        'phone': '+91 98200 01110',
        'department': dept_sales,
        'role_code': 'employee',
        'role_name': 'Client Success & Retention Manager',
        'reporting_manager': mgr_vikram,
        'date_of_joining': datetime.date(2024, 1, 15),
        'employment_status': 'active',
        'shift': shift,
    }
)

# Employees under Pooja Desai (Finance):
Employee.objects.get_or_create(
    employee_id='GB-EMP-016',
    defaults={
        'first_name': 'Meera',
        'last_name': 'Iyer',
        'email': 'meera.iyer@greenbacks.corp',
        'phone': '+91 98200 01210',
        'department': dept_fin,
        'role_code': 'employee',
        'role_name': 'Financial Planning & Tax Analyst',
        'reporting_manager': mgr_pooja,
        'date_of_joining': datetime.date(2023, 5, 20),
        'employment_status': 'active',
        'shift': shift,
    }
)

# Employees under Amitabh Sen (Ops / IT):
Employee.objects.get_or_create(
    employee_id='GB-EMP-017',
    defaults={
        'first_name': 'Rajesh',
        'last_name': 'Jena',
        'email': 'rajesh.jena@greenbacks.corp',
        'phone': '+91 98200 01310',
        'department': dept_ops,
        'role_code': 'employee',
        'role_name': 'Network & Systems Specialist',
        'reporting_manager': mgr_amitabh,
        'date_of_joining': datetime.date(2023, 7, 10),
        'employment_status': 'active',
        'shift': shift,
    }
)

# Direct Employee under Sunita Das (HR Ops):
Employee.objects.get_or_create(
    employee_id='GB-EMP-018',
    defaults={
        'first_name': 'Neha',
        'last_name': 'Parida',
        'email': 'neha.parida@greenbacks.corp',
        'phone': '+91 98200 01410',
        'department': dept_ops,
        'role_code': 'employee',
        'role_name': 'Talent Acquisition & HR Partner',
        'reporting_manager': hr_ops,
        'date_of_joining': datetime.date(2023, 11, 1),
        'employment_status': 'active',
        'shift': shift,
    }
)

print('Rich hierarchy seeded successfully! Total employees:', Employee.objects.count())
