from django.conf import settings
from django.db import connections
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .db_router import FailoverRouter


class HealthCheckView(APIView):
    """
    Public health & database status endpoint for verifying local/deployment
    database connectivity, active engine (MySQL vs SQLite failover), and schema readiness.
    """
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        active_alias = FailoverRouter.active_db_alias()
        db_cfg = settings.DATABASES.get(active_alias, settings.DATABASES.get('default', {}))
        engine = db_cfg.get('ENGINE', '')
        active_engine = 'mysql' if 'mysql' in engine else 'sqlite'

        db_connected = False
        user_count = 0
        employee_count = 0
        lead_count = 0
        error_detail = None

        try:
            conn = connections[active_alias]
            with conn.cursor() as cursor:
                cursor.execute('SELECT 1')
                cursor.fetchone()
            from accounts.models import User
            from hrms.models import Employee
            from crm.models import Lead

            user_count = User.objects.using(active_alias).count()
            employee_count = Employee.objects.using(active_alias).count()
            lead_count = Lead.objects.using(active_alias).count()
            db_connected = True
        except Exception as exc:
            error_detail = str(exc)

        payload = {
            'status': 'ok' if db_connected else 'degraded',
            'active_db_alias': active_alias,
            'active_engine': active_engine,
            'mysql_boot_available': bool(getattr(settings, 'MYSQL_AVAILABLE', False)),
            'mysql_router_available': FailoverRouter.is_mysql_available(),
            'db_connected': db_connected,
            'counts': {
                'users': user_count,
                'employees': employee_count,
                'leads': lead_count,
            },
        }
        if error_detail:
            payload['error'] = error_detail

        return Response(
            payload,
            status=status.HTTP_200_OK if db_connected else status.HTTP_503_SERVICE_UNAVAILABLE,
        )
