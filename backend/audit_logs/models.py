from django.db import models
from django.conf import settings
import uuid

class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_entries')
    action = models.CharField(max_length=50) # 'login', 'create', 'update', 'delete', 'approve', 'payroll_finalized'
    module = models.CharField(max_length=50) # 'accounts', 'hrms', 'payroll', 'crm', 'billing', 'admin'
    entity_name = models.CharField(max_length=100) # 'Employee', 'Invoice', 'Attendance', etc.
    entity_id = models.CharField(max_length=100, blank=True, default='')
    description = models.TextField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        user_str = self.user.get_full_name() if self.user else "System"
        return f"[{self.created_at.strftime('%Y-%m-%d %H:%M')}] {user_str}: {self.action} on {self.entity_name}"
