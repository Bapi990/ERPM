from rest_framework import permissions

class HasPermission(permissions.BasePermission):
    """
    Checks if user has required module/action permission.
    Example: permission_classes = [HasPermission('hrms.employees.view')]
    """
    def __init__(self, required_code=None):
        self.required_code = required_code

    def __call__(self):
        return self

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Super Admin has all permissions
        if request.user.is_superuser or (request.user.role and request.user.role.code == 'super_admin'):
            return True

        required_code = getattr(view, 'required_permission', self.required_code)
        if not required_code:
            return True

        if not request.user.role:
            return False

        return request.user.role.permissions.filter(permission__code=required_code).exists()

def check_user_permission(user, permission_code):
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser or (user.role and user.role.code == 'super_admin'):
        return True
    if not user.role:
        return False
    return user.role.permissions.filter(permission__code=permission_code).exists()
