from django.db.models import Q

def get_scoped_user_ids(user):
    """
    Returns the list of User IDs that `user` is permitted to see according to strict privacy hierarchy:
    - Super Admin: None (unrestricted, sees all employees, managers, and HR across the company)
    - HR: Self + all employees & managers supervised by this HR (`assigned_hr == user.employee_profile`)
      *Another HR CANNOT see this HR's supervised managers or employees!*
    - Manager: Self + all subordinates directly reporting to this manager (`reporting_manager == user.employee_profile`)
      *Another Manager CANNOT see this Manager's subordinates!*
    - Employee / Sales Rep: Only themselves [user.id] (employee only sees leads assigned to them!)
    """
    if not user or not user.is_authenticated:
        return []

    # Super Admin has unrestricted company-wide visibility
    if user.is_superuser or (user.role and user.role.code == 'super_admin') or (user.role and 'super admin' in user.role.name.lower()):
        return None

    emp = getattr(user, 'employee_profile', None)
    if not emp:
        return [user.id]

    role_code = (user.role.code if user.role else '').lower()
    role_name = (user.role.name if user.role else '').lower()

    # HR Level: Sees self + all managers and employees assigned to this HR
    if 'hr' in role_code or 'hr' in role_name:
        from hrms.models import Employee
        supervisee_user_ids = list(
            Employee.objects.filter(assigned_hr=emp, user__isnull=False)
            .values_list('user_id', flat=True)
        )
        return list(set([user.id] + supervisee_user_ids))

    # Manager Level: Sees self + all subordinates reporting to this manager
    if 'manager' in role_code or 'manager' in role_name or 'lead' in role_code or 'lead' in role_name:
        from hrms.models import Employee
        subordinate_user_ids = list(
            Employee.objects.filter(reporting_manager=emp, user__isnull=False)
            .values_list('user_id', flat=True)
        )
        return list(set([user.id] + subordinate_user_ids))

    # Standard Employee / Sales Representative: Only sees own records
    return [user.id]


def can_user_assign_leads(user):
    """
    Determines if a user has lead assignment authority.
    Super Admins, HRs, and Managers have assignment rights for their subordinates.
    """
    if not user or not user.is_authenticated:
        return False

    if user.is_superuser or (user.role and user.role.code == 'super_admin'):
        return True

    if not user.role:
        return False

    role_code = user.role.code.lower()
    role_name = user.role.name.lower()

    if any(k in role_code or k in role_name for k in ['admin', 'hr', 'manager', 'lead']):
        return True

    # Check permission table
    from accounts.models import Permission, RolePermission
    return RolePermission.objects.filter(
        role=user.role,
        permission__code__in=['crm.leads.assign', 'crm.leads.manage']
    ).exists()


def get_assignable_users_for_user(user):
    """
    Returns the queryset of Users that this user is allowed to assign leads to:
    - Super Admin: All active users across the company.
    - HR: Active users assigned under this HR's supervision.
    - Manager: Active users reporting to this manager.
    - Employee: Only self (or empty if no permission).
    """
    from accounts.models import User
    from hrms.models import Employee

    if user.is_superuser or (user.role and user.role.code == 'super_admin'):
        return User.objects.filter(status='active').exclude(role__code='accounts')

    emp = getattr(user, 'employee_profile', None)
    if not emp:
        return User.objects.filter(id=user.id)

    role_code = (user.role.code if user.role else '').lower()
    role_name = (user.role.name if user.role else '').lower()

    if 'hr' in role_code or 'hr' in role_name:
        sub_user_ids = list(
            Employee.objects.filter(assigned_hr=emp, user__isnull=False, employment_status='active')
            .values_list('user_id', flat=True)
        )
        return User.objects.filter(id__in=list(set([user.id] + sub_user_ids)))

    if 'manager' in role_code or 'manager' in role_name or 'lead' in role_code:
        sub_user_ids = list(
            Employee.objects.filter(reporting_manager=emp, user__isnull=False, employment_status='active')
            .values_list('user_id', flat=True)
        )
        return User.objects.filter(id__in=list(set([user.id] + sub_user_ids)))

    return User.objects.filter(id=user.id)
