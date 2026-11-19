from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import AuditLog
from .serializers import AuditLogSerializer

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all().select_related('user').order_by('-created_at')
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        module = self.request.query_params.get('module')
        action = self.request.query_params.get('action')
        if module:
            qs = qs.filter(module=module)
        if action:
            qs = qs.filter(action=action)
        return qs
