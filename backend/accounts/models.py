from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid

class Role(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, default='')
    is_system = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Permission(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    module = models.CharField(max_length=50) # 'hrms', 'crm', 'billing', 'admin', 'reports'
    submodule = models.CharField(max_length=50, blank=True, default='')
    action = models.CharField(max_length=50) # 'view', 'create', 'edit', 'delete', 'approve', 'export'
    code = models.CharField(max_length=100, unique=True) # e.g. 'hrms.employees.view'
    description = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.code} - {self.description}"

class RolePermission(models.Model):
    SCOPE_CHOICES = [
        ('own', 'Own Records Only'),
        ('assigned', 'Assigned Records Only'),
        ('team', 'Team / Reporting Hierarchy'),
        ('department', 'Selected Department(s)'),
        ('branch', 'Selected Branch(es)'),
        ('all', 'Organization Wide'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='permissions')
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE)
    data_scope = models.CharField(max_length=20, choices=SCOPE_CHOICES, default='all')

    class Meta:
        unique_together = ('role', 'permission')

    def __str__(self):
        return f"{self.role.name} -> {self.permission.code} ({self.data_scope})"

class User(AbstractUser):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('suspended', 'Suspended'),
        ('archived', 'Archived'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, default='')
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    avatar_url = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    is_two_factor_enabled = models.BooleanField(default=False)
    must_change_password = models.BooleanField(default=False)
    
    # Store effective data scope override if any
    data_scope_override = models.CharField(max_length=20, blank=True, default='')

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.email})"

class UserSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=255, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
