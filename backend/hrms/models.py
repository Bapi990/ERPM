from django.db import models
from django.conf import settings
from organizations.models import Organization, Branch, Department, Designation
import uuid

class Shift(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, unique=True)
    start_time = models.TimeField()
    end_time = models.TimeField()
    grace_period_minutes = models.PositiveIntegerField(default=15)
    break_duration_minutes = models.PositiveIntegerField(default=60)
    full_day_hours = models.DecimalField(max_digits=4, decimal_places=2, default=8.0)
    half_day_hours = models.DecimalField(max_digits=4, decimal_places=2, default=4.0)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.start_time.strftime('%H:%M')} - {self.end_time.strftime('%H:%M')})"

class Employee(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('probation', 'Probation'),
        ('notice', 'Notice Period'),
        ('resigned', 'Resigned'),
        ('terminated', 'Terminated'),
    ]
    EMPLOYMENT_TYPE_CHOICES = [
        ('full_time', 'Full Time'),
        ('part_time', 'Part Time'),
        ('contract', 'Contractor'),
        ('intern', 'Intern'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='employee_profile')
    employee_id = models.CharField(max_length=50, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    alternate_phone = models.CharField(max_length=20, blank=True, default='')
    avatar_url = models.TextField(blank=True, default='')
    
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')
    designation = models.ForeignKey(Designation, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')
    reporting_manager = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subordinates')
    assigned_hr = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='hr_supervisees')
    shift = models.ForeignKey(Shift, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')
    weekly_off = models.CharField(max_length=50, default='Shift Default', blank=True)

    date_of_joining = models.DateField()
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, default='other')
    employment_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_TYPE_CHOICES, default='full_time')
    work_location = models.CharField(max_length=100, default='Office')

    # Residential Address
    street_address = models.CharField(max_length=255, blank=True, default='')
    city = models.CharField(max_length=100, blank=True, default='')
    state = models.CharField(max_length=100, blank=True, default='')
    postal_code = models.CharField(max_length=20, blank=True, default='')

    emergency_contact_name = models.CharField(max_length=100, blank=True, default='')
    emergency_contact_phone = models.CharField(max_length=20, blank=True, default='')

    # Sensitive Financial / Identity fields
    bank_name = models.CharField(max_length=100, blank=True, default='')
    bank_account_number = models.CharField(max_length=50, blank=True, default='')
    bank_ifsc = models.CharField(max_length=20, blank=True, default='')
    pan_number = models.CharField(max_length=20, blank=True, default='')
    aadhaar_number = models.CharField(max_length=20, blank=True, default='')

    # Compensation & Statutory Allowances
    monthly_ctc = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    hra = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    da = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    other_allowances = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    tax_regime = models.CharField(max_length=50, default='New Regime', blank=True)
    payment_mode = models.CharField(max_length=50, default='Bank Transfer', blank=True)
    uan_number = models.CharField(max_length=50, blank=True, default='')
    esi_number = models.CharField(max_length=50, blank=True, default='')
    pf_applicable = models.BooleanField(default=True)
    esi_applicable = models.BooleanField(default=True)

    # Role & Permissions
    role_code = models.CharField(max_length=50, default='employee', blank=True)
    role_name = models.CharField(max_length=100, default='Associate Staff', blank=True)
    permissions_data = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def __str__(self):
        return f"{self.full_name} ({self.employee_id})"

class EmployeeDocument(models.Model):
    DOCUMENT_TYPES = [
        ('aadhaar', 'Aadhaar Card (National ID)'),
        ('pan', 'PAN Card (Tax ID)'),
        ('degree', 'Educational Degree / Diploma'),
        ('resume', 'Resume / CV'),
        ('offer_letter', 'Offer / Appointment Letter'),
        ('experience', 'Experience Certificate'),
        ('bank_passbook', 'Bank Passbook / Cheque'),
        ('passport', 'Passport / Driving License'),
        ('other', 'Other Document'),
    ]
    STATUS_CHOICES = [
        ('verified', 'Verified'),
        ('pending', 'Pending Verification'),
        ('rejected', 'Rejected'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='documents')
    name = models.CharField(max_length=200)
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPES, default='other')
    file_name = models.CharField(max_length=255)
    file_size = models.CharField(max_length=50, blank=True, default='1.2 MB')
    file_data = models.TextField(blank=True, default='') # Base64 encoded or URL
    upload_date = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='verified')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.employee.full_name}"

class AttendanceEvent(models.Model):
    STATUS_CHOICES = [
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('half_day', 'Half Day'),
        ('late', 'Late'),
        ('work_from_home', 'Work From Home'),
        ('on_leave', 'On Leave'),
        ('holiday', 'Holiday'),
        ('weekly_off', 'Weekly Off'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField()
    check_in_time = models.TimeField(null=True, blank=True)
    check_out_time = models.TimeField(null=True, blank=True)
    
    # Camera selfie capture stored as base64 or secure media URL
    check_in_selfie = models.TextField(blank=True, default='')
    check_out_selfie = models.TextField(blank=True, default='')
    
    # Geolocation if captured
    latitude = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='present')
    total_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    break_hours = models.DecimalField(max_digits=4, decimal_places=2, default=1.0)
    late_minutes = models.PositiveIntegerField(default=0)
    overtime_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    
    is_corrected = models.BooleanField(default=False)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('employee', 'date')
        ordering = ['-date']

    def __str__(self):
        return f"{self.employee.full_name} - {self.date} ({self.status})"

class AttendanceCorrection(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    attendance = models.ForeignKey(AttendanceEvent, on_delete=models.CASCADE, related_name='corrections')
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendance_corrections')
    requested_check_in = models.TimeField()
    requested_check_out = models.TimeField()
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    review_notes = models.TextField(blank=True, default='')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class LeaveType(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100) # Casual Leave, Sick Leave, Earned Leave
    code = models.CharField(max_length=20, unique=True) # CL, SL, EL, LOP
    days_per_year = models.PositiveIntegerField(default=12)
    is_paid = models.BooleanField(default=True)
    color = models.CharField(max_length=20, default='#3B82F6')
    description = models.TextField(blank=True, default='')

    def __str__(self):
        return f"{self.name} ({self.code})"

class LeaveBalance(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leave_balances')
    leave_type = models.ForeignKey(LeaveType, on_delete=models.CASCADE)
    year = models.PositiveIntegerField(default=2026)
    total_allocated = models.DecimalField(max_digits=4, decimal_places=1, default=12.0)
    used = models.DecimalField(max_digits=4, decimal_places=1, default=0.0)
    pending = models.DecimalField(max_digits=4, decimal_places=1, default=0.0)

    @property
    def remaining(self):
        return max(0.0, float(self.total_allocated) - float(self.used) - float(self.pending))

    class Meta:
        unique_together = ('employee', 'leave_type', 'year')

    def __str__(self):
        return f"{self.employee.full_name} - {self.leave_type.code}: {self.remaining} left"

class LeaveApplication(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('manager_approved', 'Manager Approved'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leave_applications')
    leave_type = models.ForeignKey(LeaveType, on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField()
    total_days = models.DecimalField(max_digits=4, decimal_places=1, default=1.0)
    is_half_day = models.BooleanField(default=False)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    approver_comments = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.employee.full_name} - {self.leave_type.code} ({self.start_date} to {self.end_date})"

class Holiday(models.Model):
    TYPE_CHOICES = [
        ('public', 'Public Holiday'),
        ('company', 'Company Holiday'),
        ('optional', 'Optional / Restricted'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150)
    date = models.DateField()
    holiday_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='public')
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True, related_name='holidays')
    description = models.TextField(blank=True, default='')
    is_paid = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['date']

    def __str__(self):
        return f"{self.name} on {self.date}"

class WfhRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='wfh_requests')
    start_date = models.DateField()
    end_date = models.DateField()
    total_days = models.PositiveIntegerField(default=1)
    reason = models.TextField()
    deliverables = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"WFH: {self.employee.full_name} ({self.start_date})"

class OvertimeRecord(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('approved', 'Approved for Payroll'),
        ('rejected', 'Rejected'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='overtime_records')
    date = models.DateField()
    hours = models.DecimalField(max_digits=4, decimal_places=1, default=2.0)
    multiplier = models.DecimalField(max_digits=3, decimal_places=1, default=1.5)
    pay_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    task_summary = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"OT: {self.employee.full_name} - {self.hours}h on {self.date}"

class JobPosting(models.Model):
    STATUS_CHOICES = [
        ('open', 'Active / Sourcing'),
        ('draft', 'Draft'),
        ('closed', 'Filled / Closed'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=150)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='job_postings')
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True, related_name='job_postings')
    positions_count = models.PositiveIntegerField(default=1)
    experience_required = models.CharField(max_length=50, default='2-4 Years')
    salary_range = models.CharField(max_length=100, default='₹8,00,000 - ₹14,00,000 PA')
    employment_type = models.CharField(max_length=50, default='Full Time')
    description = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.status})"

class JobApplication(models.Model):
    STAGE_CHOICES = [
        ('sourced', 'Sourced / Applied'),
        ('screening', 'HR Screening'),
        ('interviewing', 'Technical Rounds'),
        ('offered', 'Offer Rolled Out'),
        ('hired', 'Hired / Ready to Onboard'),
        ('rejected', 'Rejected'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job_posting = models.ForeignKey(JobPosting, on_delete=models.CASCADE, related_name='applications')
    candidate_name = models.CharField(max_length=150)
    email = models.EmailField()
    phone = models.CharField(max_length=30)
    experience_years = models.DecimalField(max_digits=4, decimal_places=1, default=3.0)
    current_company = models.CharField(max_length=150, blank=True, default='')
    current_ctc = models.CharField(max_length=50, blank=True, default='')
    expected_ctc = models.CharField(max_length=50, blank=True, default='')
    notice_period_days = models.PositiveIntegerField(default=30)
    resume_url = models.CharField(max_length=255, blank=True, default='')
    stage = models.CharField(max_length=20, choices=STAGE_CHOICES, default='sourced')
    rating = models.PositiveIntegerField(default=4)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.candidate_name} - {self.job_posting.title}"

class InterviewSchedule(models.Model):
    ROUND_CHOICES = [
        ('tech_1', 'Technical Coding & Architecture'),
        ('system_design', 'System Design & Scalability'),
        ('managerial', 'Engineering Manager & Fit'),
        ('hr_culture', 'HR & Cultural Alignment'),
        ('executive', 'Executive Founder Final'),
    ]
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('completed', 'Completed & Evaluated'),
        ('rescheduled', 'Rescheduled'),
        ('cancelled', 'Cancelled'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.ForeignKey(JobApplication, on_delete=models.CASCADE, related_name='interviews')
    round_name = models.CharField(max_length=30, choices=ROUND_CHOICES, default='tech_1')
    interviewer_name = models.CharField(max_length=150)
    scheduled_at = models.DateTimeField()
    mode = models.CharField(max_length=50, default='Google Meet Online')
    meeting_link = models.CharField(max_length=255, default='https://meet.google.com/ods-tech-round')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    rating = models.PositiveIntegerField(default=0) # 1 to 5
    recommendation = models.CharField(max_length=50, blank=True, default='Pending Evaluation')
    feedback_notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['scheduled_at']

    def __str__(self):
        return f"Interview: {self.application.candidate_name} ({self.round_name})"

class OnboardingMilestone(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='onboarding_milestones')
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=50, default='Statutory KYC')
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.employee.full_name} - {self.title} ({self.is_completed})"

class OffboardingRecord(models.Model):
    STATUS_CHOICES = [
        ('notice_period', 'Notice Period Active'),
        ('clearance_in_progress', 'Clearances In Progress'),
        ('relieved', 'Relieved & Exit Complete'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='offboardings')
    resignation_date = models.DateField()
    last_working_day = models.DateField()
    reason = models.TextField()
    notice_period_days = models.PositiveIntegerField(default=30)
    it_clearance = models.BooleanField(default=False)
    finance_clearance = models.BooleanField(default=False)
    hr_clearance = models.BooleanField(default=False)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='notice_period')
    exit_interview_notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Offboarding: {self.employee.full_name} (LWD: {self.last_working_day})"

class EmployeeGrievance(models.Model):
    CATEGORY_CHOICES = [
        ('workplace', 'Workplace Environment & Infrastructure'),
        ('compensation', 'Salary, Deductions & Compensation Dispute'),
        ('team_conflict', 'Team Conflict / Escalation'),
        ('posh', 'Harassment / Code of Conduct (POSH)'),
        ('shift_leave', 'Leave & Shift Scheduling Grievance'),
    ]
    PRIORITY_CHOICES = [
        ('high', 'High / Urgent'),
        ('medium', 'Medium Priority'),
        ('low', 'Low / Standard'),
    ]
    STATUS_CHOICES = [
        ('open', 'Open / Received'),
        ('in_review', 'Under HR Investigation'),
        ('hearing', 'Hearing Scheduled'),
        ('resolved', 'Resolved & Closed'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='grievances')
    subject = models.CharField(max_length=200)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='workplace')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    description = models.TextField()
    is_anonymous = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    assigned_hr = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    resolution_notes = models.TextField(blank=True, default='')
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Grievance: {self.subject} ({self.status})"
