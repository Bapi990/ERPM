import datetime
from rest_framework import serializers
from .models import (
    Shift, Employee, EmployeeDocument, AttendanceEvent, AttendanceCorrection,
    LeaveType, LeaveBalance, LeaveApplication, Holiday,
    WfhRequest, OvertimeRecord, JobPosting, JobApplication,
    InterviewSchedule, OnboardingMilestone, OffboardingRecord, EmployeeGrievance
)
from organizations.models import Branch, Department, Designation

class ShiftSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shift
        fields = '__all__'

class EmployeeDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeDocument
        fields = ['id', 'employee', 'name', 'document_type', 'file_name', 'file_size', 'file_data', 'upload_date', 'status', 'created_at']
        read_only_fields = ['id', 'created_at', 'upload_date']

class EmployeeSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    designation_title = serializers.CharField(source='designation.title', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    manager_name = serializers.CharField(source='reporting_manager.full_name', read_only=True)
    assigned_hr_name = serializers.CharField(source='assigned_hr.full_name', read_only=True)
    shift_name = serializers.CharField(source='shift.name', read_only=True)
    permissions = serializers.JSONField(source='permissions_data', required=False)
    documents = EmployeeDocumentSerializer(many=True, read_only=True)
    uploaded_documents = serializers.ListField(child=serializers.DictField(), write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Employee
        fields = [
            'id', 'employee_id', 'first_name', 'last_name', 'full_name',
            'email', 'phone', 'alternate_phone', 'avatar_url', 'branch', 'branch_name',
            'department', 'department_name', 'designation', 'designation_title',
            'reporting_manager', 'manager_name', 'assigned_hr', 'assigned_hr_name',
            'shift', 'shift_name', 'weekly_off',
            'date_of_joining', 'date_of_birth', 'gender', 'employment_status',
            'employment_type', 'work_location', 'street_address', 'city', 'state', 'postal_code',
            'emergency_contact_name', 'emergency_contact_phone',
            'bank_name', 'bank_account_number', 'bank_ifsc', 'pan_number', 'aadhaar_number',
            'monthly_ctc', 'basic_salary', 'hra', 'da', 'other_allowances',
            'tax_regime', 'payment_mode', 'uan_number', 'esi_number', 'pf_applicable', 'esi_applicable',
            'role_code', 'role_name', 'permissions', 'documents', 'uploaded_documents', 'password',
            'created_at'
        ]

    def validate_email(self, value):
        if not value:
            raise serializers.ValidationError("Corporate/Personal Email address is required.")
        val_clean = str(value).strip().lower()
        query = Employee.objects.filter(email__iexact=val_clean)
        if self.instance:
            query = query.exclude(id=self.instance.id)
        existing = query.first()
        if existing:
            role_desc = existing.role_name or existing.role_code or 'Staff Member'
            raise serializers.ValidationError(
                f"Email '{val_clean}' is already registered in Odias ERP to {existing.first_name} {existing.last_name} ({existing.employee_id} - {role_desc}). Please enter a unique email."
            )
        return val_clean

    @staticmethod
    def _ensure_default_department():
        dept = Department.objects.first()
        if not dept:
            from organizations.models import Organization
            org = Organization.objects.first()
            if not org:
                org = Organization.objects.create(
                    name='Odias ERP Global Enterprise',
                    email='admin@odiaserp.com',
                )
            dept = Department.objects.create(
                organization=org,
                name='General Operations',
                code='GEN',
            )
        return dept

    def to_internal_value(self, data):
        import django.utils.timezone
        cleaned_data = data.copy() if hasattr(data, 'copy') else dict(data)

        # 0. Null-safe & MySQL STRICT_TRANS_TABLES length-safe sanitization for string fields
        string_limits = {
            'first_name': 100,
            'last_name': 100,
            'phone': 20,
            'alternate_phone': 20,
            'weekly_off': 50,
            'gender': 20,
            'employment_status': 20,
            'employment_type': 20,
            'work_location': 100,
            'street_address': 255,
            'city': 100,
            'state': 100,
            'postal_code': 20,
            'emergency_contact_name': 100,
            'emergency_contact_phone': 20,
            'bank_name': 100,
            'bank_account_number': 50,
            'bank_ifsc': 20,
            'pan_number': 20,
            'aadhaar_number': 20,
            'tax_regime': 50,
            'payment_mode': 50,
            'uan_number': 50,
            'esi_number': 50,
            'role_code': 50,
            'role_name': 100,
        }
        nullable_defaults = {
            'gender': 'other',
            'employment_status': 'active',
            'employment_type': 'full_time',
            'work_location': 'Office',
            'weekly_off': 'Shift Default',
            'tax_regime': 'New Regime',
            'payment_mode': 'Bank Transfer',
            'role_code': 'employee',
            'role_name': 'Associate Staff',
        }
        for field_name, max_len in string_limits.items():
            if field_name in cleaned_data:
                raw_val = cleaned_data.get(field_name)
                if raw_val in (None, 'null', 'undefined'):
                    cleaned_data[field_name] = nullable_defaults.get(field_name, '')
                else:
                    s_val = str(raw_val).strip()
                    if not s_val and field_name in nullable_defaults:
                        s_val = nullable_defaults[field_name]
                    cleaned_data[field_name] = s_val[:max_len]

        if 'avatar_url' in cleaned_data and cleaned_data.get('avatar_url') in (None, 'null', 'undefined'):
            cleaned_data['avatar_url'] = ''

        # 1. Guaranteed unique employee_id generation
        role = str(cleaned_data.get('role_code', 'employee')).lower()
        prefix = 'ODS-HR' if role in ['hr', 'hr_manager'] else ('ODS-MGR' if role == 'manager' else 'ODS-EMP')
        emp_id = str(cleaned_data.get('employee_id', '')).strip()

        # If adding a new employee and employee_id is blank or already taken, auto-increment unique ID
        if self.instance is None:
            if not emp_id or Employee.objects.filter(employee_id=emp_id).exists():
                count = Employee.objects.count() + 1
                candidate = f"{prefix}-{str(count).zfill(3)}"
                while Employee.objects.filter(employee_id=candidate).exists():
                    count += 1
                    candidate = f"{prefix}-{str(count).zfill(3)}"
                cleaned_data['employee_id'] = candidate
            else:
                cleaned_data['employee_id'] = emp_id
        else:
            if emp_id:
                cleaned_data['employee_id'] = emp_id

        # 2. Date sanitization
        dob = cleaned_data.get('date_of_birth')
        if dob in ['', 'null', 'undefined', None]:
            cleaned_data['date_of_birth'] = None

        doj = cleaned_data.get('date_of_joining')
        if doj in ['', 'null', 'undefined', None]:
            cleaned_data['date_of_joining'] = django.utils.timezone.now().date().isoformat()

        # 3. Numeric salary sanitization
        for num_field in ['monthly_ctc', 'basic_salary', 'hra', 'da', 'other_allowances']:
            num_val = cleaned_data.get(num_field)
            if num_val in ['', 'null', 'undefined', None]:
                cleaned_data[num_field] = 0.0
            else:
                try:
                    cleaned_data[num_field] = float(num_val)
                except (ValueError, TypeError):
                    cleaned_data[num_field] = 0.0

        # 4. Foreign Key sanitization (resolve department & branch before designation)
        for fk in ['assigned_hr', 'reporting_manager', 'branch', 'department', 'designation', 'shift']:
            val = cleaned_data.get(fk)
            if val == '' or val == '---------' or val == 'default_hr' or val is None:
                cleaned_data[fk] = None
            elif fk == 'branch' and val:
                br = None
                if isinstance(val, str) and len(str(val)) == 36:
                    br = Branch.objects.filter(id=val).first()
                if not br:
                    br = Branch.objects.filter(name__icontains=str(val)).first()
                if not br:
                    br = Branch.objects.first()
                cleaned_data[fk] = str(br.id) if br else None
            elif fk == 'department' and val:
                dept = None
                if isinstance(val, str) and len(str(val)) == 36:
                    dept = Department.objects.filter(id=val).first()
                if not dept:
                    dept = Department.objects.filter(name__icontains=str(val)).first()
                if not dept:
                    dept = self._ensure_default_department()
                cleaned_data[fk] = str(dept.id) if dept else None
            elif fk == 'designation' and val:
                des = None
                if isinstance(val, str) and len(str(val)) == 36:
                    des = Designation.objects.filter(id=val).first()
                if not des:
                    des = Designation.objects.filter(title__iexact=str(val)).first()
                if not des:
                    resolved_dept_id = cleaned_data.get('department')
                    dept = Department.objects.filter(id=resolved_dept_id).first() if resolved_dept_id else None
                    if not dept:
                        dept = self._ensure_default_department()
                    des = Designation.objects.create(title=str(val)[:150], department=dept)
                cleaned_data[fk] = str(des.id) if des else None
            elif fk in ['reporting_manager', 'assigned_hr'] and val:
                if str(val).startswith('root') or not Employee.objects.filter(id=val).exists():
                    cleaned_data[fk] = None

        emp_type = cleaned_data.get('employment_type', '')
        if emp_type:
            emp_type_lower = str(emp_type).lower().replace(' ', '_')
            if emp_type_lower in ['full_time', 'part_time', 'contract', 'intern']:
                cleaned_data['employment_type'] = emp_type_lower
            else:
                cleaned_data['employment_type'] = 'full_time'

        if not cleaned_data.get('shift'):
            first_shift = Shift.objects.first()
            if first_shift:
                cleaned_data['shift'] = str(first_shift.id)

        return super().to_internal_value(cleaned_data)

    def _sync_user_account(self, emp, password=None):
        """Ensure linked authentication User + Role exist on primary and failover DB."""
        if not emp.email:
            return
        from django.conf import settings
        from django.contrib.auth import get_user_model
        from accounts.models import Role

        User = get_user_model()
        email_norm = emp.email.strip().lower()
        role_code = (emp.role_code or 'employee').strip()
        role_obj = Role.objects.filter(code=role_code).first()
        if not role_obj and role_code == 'hr':
            role_obj = Role.objects.filter(code='hr_manager').first()
        if not role_obj:
            target_code = 'hr_manager' if role_code == 'hr' else role_code
            role_obj, _ = Role.objects.get_or_create(
                code=target_code,
                defaults={
                    'name': emp.role_name or target_code.replace('_', ' ').title(),
                    'description': f'Auto-created role for {target_code}',
                },
            )

        user = emp.user or User.objects.filter(email__iexact=email_norm).first()
        raw_pw = password if (password and str(password).strip()) else 'Password@123'

        if not user:
            candidate_username = email_norm[:150]
            if User.objects.filter(username__iexact=candidate_username).exists():
                candidate_username = f"{email_norm.split('@')[0][:120]}_{str(emp.id)[:8]}"
            user = User(
                username=candidate_username,
                email=email_norm,
                first_name=emp.first_name[:150],
                last_name=emp.last_name[:150],
                phone=(emp.phone or '')[:20],
                avatar_url=emp.avatar_url or '',
                role=role_obj,
                status='active',
                is_active=True,
            )
            user.set_password(raw_pw)
            user.save()
        else:
            user.first_name = emp.first_name[:150]
            user.last_name = emp.last_name[:150]
            user.phone = (emp.phone or '')[:20]
            if emp.avatar_url:
                user.avatar_url = emp.avatar_url
            if role_obj:
                user.role = role_obj
            if password and str(password).strip():
                user.set_password(password)
            user.save()

        if emp.user_id != user.id:
            emp.user = user
            emp.save(update_fields=['user'])

        # Mirror login User & Role to failover SQLite when running on MySQL primary
        active_db = getattr(emp._state, 'db', None) or 'default'
        if active_db == 'default' and 'sqlite' in settings.DATABASES:
            try:
                sq_role = None
                if role_obj:
                    sq_role, _ = Role.objects.using('sqlite').get_or_create(
                        code=role_obj.code,
                        defaults={'name': role_obj.name, 'description': role_obj.description},
                    )
                sq_user = User.objects.using('sqlite').filter(email__iexact=email_norm).first()
                if not sq_user:
                    sq_uname = user.username
                    if User.objects.using('sqlite').filter(username__iexact=sq_uname).exists():
                        sq_uname = f"{sq_uname[:130]}_{str(emp.id)[:6]}"
                    sq_user = User(
                        id=user.id,
                        username=sq_uname,
                        email=email_norm,
                        first_name=user.first_name,
                        last_name=user.last_name,
                        phone=user.phone,
                        role=sq_role,
                        status='active',
                        is_active=True,
                        password=user.password,
                    )
                    sq_user.save(using='sqlite')
                else:
                    sq_user.first_name = user.first_name
                    sq_user.last_name = user.last_name
                    sq_user.role = sq_role
                    sq_user.password = user.password
                    sq_user.save(using='sqlite')
            except Exception as mirror_exc:
                print(f'Notice: SQLite mirror skipped during employee sync: {mirror_exc}')

    def create(self, validated_data):
        from django.db import transaction
        docs_data = validated_data.pop('uploaded_documents', [])
        password = validated_data.pop('password', None)
        try:
            with transaction.atomic():
                emp = super().create(validated_data)
                self._sync_user_account(emp, password=password)
        except serializers.ValidationError:
            raise
        except Exception as exc:
            raise serializers.ValidationError({'detail': f'Could not create employee profile: {exc}'})

        # Only create documents if genuinely provided with actual name and file
        for doc in docs_data:
            if doc.get('name') and (doc.get('file_name') or doc.get('file_data')):
                EmployeeDocument.objects.create(
                    employee=emp,
                    name=str(doc.get('name', 'Document'))[:200],
                    document_type=str(doc.get('document_type', 'other'))[:50],
                    file_name=str(doc.get('file_name', ''))[:255],
                    file_size=str(doc.get('file_size', ''))[:50],
                    file_data=doc.get('file_data', ''),
                    status=str(doc.get('status', 'verified'))[:20]
                )
        self._sync_salary_structure(emp)
        return emp

    def update(self, instance, validated_data):
        docs_data = validated_data.pop('uploaded_documents', None)
        password = validated_data.pop('password', None)
        emp = super().update(instance, validated_data)

        if emp.email:
            try:
                self._sync_user_account(emp, password=password)
            except Exception as e:
                print('Error syncing user on update:', e)

        if docs_data is not None:
            instance.documents.all().delete()
            for doc in docs_data:
                if doc.get('name') and (doc.get('file_name') or doc.get('file_data')):
                    EmployeeDocument.objects.create(
                        employee=emp,
                        name=str(doc.get('name', 'Document'))[:200],
                        document_type=str(doc.get('document_type', 'other'))[:50],
                        file_name=str(doc.get('file_name', ''))[:255],
                        file_size=str(doc.get('file_size', ''))[:50],
                        file_data=doc.get('file_data', ''),
                        status=str(doc.get('status', 'verified'))[:20]
                    )
        self._sync_salary_structure(emp)
        return emp

    def _sync_salary_structure(self, emp):
        try:
            import datetime
            from decimal import Decimal
            from payroll.models import SalaryStructure
            ctc = Decimal(str(emp.monthly_ctc or 0))
            basic = Decimal(str(emp.basic_salary or 0)) if emp.basic_salary else round(ctc * Decimal('0.50'), 2)
            hra = Decimal(str(emp.hra or 0)) if emp.hra else round(ctc * Decimal('0.25'), 2)
            da = Decimal(str(emp.da or 0))
            other = Decimal(str(emp.other_allowances or 0))
            special = da + other
            pf = round(basic * Decimal('0.12'), 2) if emp.pf_applicable else Decimal('0.00')
            pt = Decimal('200.00')
            esi = round(ctc * Decimal('0.0075'), 2) if emp.esi_applicable else Decimal('0.00')
            
            ss, created = SalaryStructure.objects.get_or_create(
                employee=emp,
                is_active=True,
                defaults={
                    'effective_from': emp.date_of_joining or datetime.date.today().replace(day=1),
                    'basic_salary': basic,
                    'hra': hra,
                    'special_allowance': special,
                    'provident_fund': pf,
                    'professional_tax': pt,
                    'esi': esi,
                    'conveyance_allowance': Decimal('1600.00'),
                    'medical_allowance': Decimal('1250.00'),
                }
            )
            if not created:
                ss.basic_salary = basic
                ss.hra = hra
                ss.special_allowance = special
                ss.provident_fund = pf
                ss.professional_tax = pt
                ss.esi = esi
                ss.save()
        except Exception as e:
            print('Error syncing salary structure:', e)

class AttendanceEventSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_code = serializers.CharField(source='employee.employee_id', read_only=True)
    department_name = serializers.CharField(source='employee.department.name', read_only=True)
    avatar_url = serializers.CharField(source='employee.avatar_url', read_only=True)
    designation_title = serializers.SerializerMethodField()
    shift_name = serializers.SerializerMethodField()
    shift_start_time = serializers.SerializerMethodField()
    shift_end_time = serializers.SerializerMethodField()
    late_display = serializers.SerializerMethodField()
    overtime_display = serializers.SerializerMethodField()
    overtime_minutes = serializers.SerializerMethodField()

    class Meta:
        model = AttendanceEvent
        fields = [
            'id', 'employee', 'employee_name', 'employee_code', 'department_name',
            'designation_title', 'avatar_url', 'shift_name', 'shift_start_time', 'shift_end_time',
            'late_display', 'overtime_display', 'overtime_minutes',
            'date', 'check_in_time', 'check_out_time', 'check_in_selfie',
            'check_out_selfie', 'latitude', 'longitude', 'status',
            'total_hours', 'break_hours', 'late_minutes', 'overtime_hours',
            'is_corrected', 'notes', 'created_at'
        ]

    def get_designation_title(self, obj):
        if obj.employee and obj.employee.designation:
            return getattr(obj.employee.designation, 'title', getattr(obj.employee.designation, 'name', 'Staff'))
        return 'Staff'

    def get_shift_name(self, obj):
        if obj.employee and obj.employee.shift:
            return obj.employee.shift.name
        return 'Enterprise General Shift'

    def get_shift_start_time(self, obj):
        if obj.employee and obj.employee.shift and obj.employee.shift.start_time:
            return obj.employee.shift.start_time.strftime('%I:%M %p')
        return '10:00 AM'

    def get_shift_end_time(self, obj):
        if obj.employee and obj.employee.shift and obj.employee.shift.end_time:
            return obj.employee.shift.end_time.strftime('%I:%M %p')
        return '06:00 PM'

    def get_late_display(self, obj):
        if not obj.check_in_time:
            return 'Not Checked In'
        shift_start = obj.employee.shift.start_time if (obj.employee and obj.employee.shift and obj.employee.shift.start_time) else datetime.time(10, 0)
        shift_dt = datetime.datetime.combine(obj.date, shift_start)
        actual_dt = datetime.datetime.combine(obj.date, obj.check_in_time)
        diff_min = int((actual_dt - shift_dt).total_seconds() // 60)
        if diff_min > 0:
            return f"{diff_min} min Late"
        elif diff_min == 0:
            return "Exact On Time"
        else:
            return f"{abs(diff_min)} min Early"

    def get_overtime_minutes(self, obj):
        if not obj.check_out_time:
            return 0
        shift_end = obj.employee.shift.end_time if (obj.employee and obj.employee.shift and obj.employee.shift.end_time) else datetime.time(18, 0)
        shift_end_dt = datetime.datetime.combine(obj.date, shift_end)
        check_out_dt = datetime.datetime.combine(obj.date, obj.check_out_time)
        diff_min = int((check_out_dt - shift_end_dt).total_seconds() // 60)
        return max(0, diff_min)

    def get_overtime_display(self, obj):
        if not obj.check_out_time:
            return 'Pending Check-Out'
        shift_end = obj.employee.shift.end_time if (obj.employee and obj.employee.shift and obj.employee.shift.end_time) else datetime.time(18, 0)
        shift_end_dt = datetime.datetime.combine(obj.date, shift_end)
        check_out_dt = datetime.datetime.combine(obj.date, obj.check_out_time)
        diff_min = int((check_out_dt - shift_end_dt).total_seconds() // 60)
        if diff_min > 0:
            return f"{diff_min} min Extra"
        elif diff_min < -5:
            return f"{abs(diff_min)} min Early Departure"
        else:
            return "On Time Shift End"

class AttendanceCorrectionSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.get_full_name', read_only=True)

    class Meta:
        model = AttendanceCorrection
        fields = '__all__'

class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = '__all__'

class LeaveBalanceSerializer(serializers.ModelSerializer):
    leave_type_name = serializers.CharField(source='leave_type.name', read_only=True)
    leave_type_code = serializers.CharField(source='leave_type.code', read_only=True)
    color = serializers.CharField(source='leave_type.color', read_only=True)
    remaining_days = serializers.FloatField(source='remaining', read_only=True)

    class Meta:
        model = LeaveBalance
        fields = ['id', 'employee', 'leave_type', 'leave_type_name', 'leave_type_code', 'color', 'year', 'total_allocated', 'used', 'pending', 'remaining_days']

class LeaveApplicationSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_code = serializers.CharField(source='employee.employee_id', read_only=True)
    department_name = serializers.CharField(source='employee.department.name', read_only=True)
    designation_title = serializers.CharField(source='employee.designation.title', read_only=True)
    employee_email = serializers.CharField(source='employee.email', read_only=True)
    employee_phone = serializers.CharField(source='employee.phone', read_only=True)
    employee_avatar = serializers.CharField(source='employee.avatar_url', read_only=True)
    leave_type_name = serializers.CharField(source='leave_type.name', read_only=True)
    leave_type_code = serializers.CharField(source='leave_type.code', read_only=True)
    leave_type_color = serializers.CharField(source='leave_type.color', read_only=True)
    leave_type_is_paid = serializers.BooleanField(source='leave_type.is_paid', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)

    class Meta:
        model = LeaveApplication
        fields = [
            'id', 'employee', 'employee_name', 'employee_code', 'department_name',
            'designation_title', 'employee_email', 'employee_phone', 'employee_avatar',
            'leave_type', 'leave_type_name', 'leave_type_code', 'leave_type_color', 'leave_type_is_paid',
            'start_date', 'end_date', 'total_days', 'is_half_day', 'reason', 'status',
            'approved_by', 'approved_by_name', 'approver_comments', 'created_at'
        ]

class HolidaySerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = Holiday
        fields = ['id', 'name', 'date', 'holiday_type', 'branch', 'branch_name', 'description', 'is_paid', 'is_active', 'created_at']

class WfhRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_code = serializers.CharField(source='employee.employee_id', read_only=True)
    department_name = serializers.CharField(source='employee.department.name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)

    class Meta:
        model = WfhRequest
        fields = '__all__'

class OvertimeRecordSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_code = serializers.CharField(source='employee.employee_id', read_only=True)
    department_name = serializers.CharField(source='employee.department.name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)

    class Meta:
        model = OvertimeRecord
        fields = '__all__'

class JobPostingSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    applications_count = serializers.SerializerMethodField()

    class Meta:
        model = JobPosting
        fields = '__all__'

    def get_applications_count(self, obj):
        return obj.applications.count()

class JobApplicationSerializer(serializers.ModelSerializer):
    job_title = serializers.CharField(source='job_posting.title', read_only=True)
    department_name = serializers.CharField(source='job_posting.department.name', read_only=True)

    class Meta:
        model = JobApplication
        fields = '__all__'

class InterviewScheduleSerializer(serializers.ModelSerializer):
    candidate_name = serializers.CharField(source='application.candidate_name', read_only=True)
    job_title = serializers.CharField(source='application.job_posting.title', read_only=True)
    round_display = serializers.CharField(source='get_round_name_display', read_only=True)

    class Meta:
        model = InterviewSchedule
        fields = '__all__'

class OnboardingMilestoneSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_code = serializers.CharField(source='employee.employee_id', read_only=True)

    class Meta:
        model = OnboardingMilestone
        fields = '__all__'

class OffboardingRecordSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_code = serializers.CharField(source='employee.employee_id', read_only=True)
    department_name = serializers.CharField(source='employee.department.name', read_only=True)

    class Meta:
        model = OffboardingRecord
        fields = '__all__'

class EmployeeGrievanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_code = serializers.CharField(source='employee.employee_id', read_only=True)
    department_name = serializers.CharField(source='employee.department.name', read_only=True)
    assigned_hr_name = serializers.CharField(source='assigned_hr.get_full_name', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = EmployeeGrievance
        fields = '__all__'
