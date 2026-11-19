from rest_framework import serializers
from .models import User, Role, Permission, RolePermission, UserSession
from organizations.models import Branch, Department

class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ['id', 'module', 'submodule', 'action', 'code', 'description']

class RolePermissionSerializer(serializers.ModelSerializer):
    permission = PermissionSerializer(read_only=True)
    permission_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = RolePermission
        fields = ['id', 'permission', 'permission_id', 'data_scope']

class RoleSerializer(serializers.ModelSerializer):
    permissions_list = serializers.SerializerMethodField()
    users_count = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = ['id', 'name', 'code', 'description', 'is_system', 'permissions_list', 'users_count', 'created_at']

    def get_permissions_list(self, obj):
        return [rp.permission.code for rp in obj.permissions.select_related('permission').all()]

    def get_users_count(self, obj):
        return obj.users.count()

class UserSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source='role.name', read_only=True)
    role_code = serializers.CharField(source='role.code', read_only=True)
    permissions = serializers.SerializerMethodField()
    employee_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'phone', 'role', 'role_name', 'role_code', 'avatar_url',
            'status', 'is_two_factor_enabled', 'permissions', 'employee_id'
        ]
        extra_kwargs = {'password': {'write_only': True, 'required': False}}

    def get_permissions(self, obj):
        if obj.is_superuser or (obj.role and obj.role.code == 'super_admin'):
            return [p.code for p in Permission.objects.all()]
        if not obj.role:
            return []
        return [rp.permission.code for rp in obj.role.permissions.select_related('permission').all()]

    def get_employee_id(self, obj):
        if hasattr(obj, 'employee_profile'):
            return obj.employee_profile.employee_id
        return None
