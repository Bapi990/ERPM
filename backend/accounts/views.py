from rest_framework import status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate
from .models import User, Role, Permission, RolePermission
from .serializers import UserSerializer, RoleSerializer, PermissionSerializer
from .authentication import generate_tokens
from audit_logs.models import AuditLog

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        identifier = (request.data.get('email') or request.data.get('username') or '').strip().lower()
        password = request.data.get('password', '')

        if not identifier or not password:
            return Response({'error': 'Email / Username and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Lookup by email, username, or alias domain
        user = User.objects.filter(email__iexact=identifier).first()
        if not user:
            user = User.objects.filter(username__iexact=identifier).first()
        if not user and '@odias.corp' in identifier:
            alt_email = identifier.replace('@odias.corp', '@greenbacks.corp')
            user = User.objects.filter(email__iexact=alt_email).first()
        if not user and '@greenbacks.corp' in identifier:
            alt_email = identifier.replace('@greenbacks.corp', '@odias.corp')
            user = User.objects.filter(email__iexact=alt_email).first()

        if not user:
            return Response({'error': 'Invalid credentials. Please check your username/email and password.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.check_password(password):
            return Response({'error': 'Invalid credentials. Please check your username/email and password.'}, status=status.HTTP_401_UNAUTHORIZED)

        if user.status != 'active':
            return Response({'error': 'Your account is suspended or archived. Contact your administrator.'}, status=status.HTTP_403_FORBIDDEN)

        tokens = generate_tokens(user)
        user_data = UserSerializer(user).data

        # Log audit entry
        AuditLog.objects.create(
            user=user,
            action='login',
            module='auth',
            entity_name='User',
            entity_id=str(user.id),
            description=f"User {user.email} logged in successfully.",
            ip_address=request.META.get('REMOTE_ADDR')
        )

        return Response({
            'message': 'Login successful',
            'tokens': tokens,
            'user': user_data
        })

class DemoSwitchUserView(APIView):
    """
    Allows instant role/demo user switching in development/evaluation mode!
    """
    permission_classes = [AllowAny]

    def post(self, request):
        role_code = request.data.get('role_code')
        email = request.data.get('email')

        user = None
        if email:
            user = User.objects.filter(email=email).first()
            if not user and '@odias.corp' in email:
                user = User.objects.filter(email=email.replace('@odias.corp', '@greenbacks.corp')).first()
        elif role_code:
            user = User.objects.filter(role__code=role_code).first()

        if not user:
            return Response({'error': 'Demo user not found for specified role'}, status=status.HTTP_404_NOT_FOUND)

        tokens = generate_tokens(user)
        user_data = UserSerializer(user).data

        return Response({
            'message': f"Switched to {user.get_full_name()} ({user.role.name if user.role else 'No Role'})",
            'tokens': tokens,
            'user': user_data
        })

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_data = UserSerializer(request.user).data
        return Response(user_data)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().select_related('role')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        user = serializer.save()
        password = self.request.data.get('password', 'password123')
        user.set_password(password)
        user.save()
        AuditLog.objects.create(
            user=self.request.user,
            action='create',
            module='accounts',
            entity_name='User',
            entity_id=str(user.id),
            description=f"Created user account {user.email} with role {user.role.name if user.role else 'None'}"
        )

class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all().prefetch_related('permissions__permission')
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated]

    def perform_update(self, serializer):
        role = serializer.save()
        perms = self.request.data.get('permissions', None)
        if perms is not None:
            RolePermission.objects.filter(role=role).delete()
            for code in perms:
                try:
                    p = Permission.objects.get(code=code)
                    RolePermission.objects.create(role=role, permission=p, data_scope='all')
                except Permission.DoesNotExist:
                    pass

class PermissionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        perms = Permission.objects.all()
        serializer = PermissionSerializer(perms, many=True)
        return Response(serializer.data)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password', '')
        new_password = request.data.get('new_password', '')
        confirm_password = request.data.get('confirm_password', '')

        if not old_password or not new_password:
            return Response({'error': 'Current password and new password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if not user.check_password(old_password):
            return Response({'error': 'Incorrect current password. Please re-enter your existing password.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 6:
            return Response({'error': 'New password must be at least 6 characters long.'}, status=status.HTTP_400_BAD_REQUEST)

        if confirm_password and new_password != confirm_password:
            return Response({'error': 'New password and confirmation do not match.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()

        AuditLog.objects.create(
            user=user,
            action='password_changed',
            module='accounts',
            entity_name='User',
            entity_id=str(user.id),
            description=f"User {user.email} changed their password successfully.",
            ip_address=request.META.get('REMOTE_ADDR')
        )

        return Response({'message': 'Password has been updated successfully.'})


class SecurityOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        from .models import UserSession
        ip_addr = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', '127.0.0.1'))
        if ip_addr and ',' in ip_addr:
            ip_addr = ip_addr.split(',')[0].strip()
        user_agent = request.META.get('HTTP_USER_AGENT', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0')

        # Record or update session
        session, _ = UserSession.objects.get_or_create(
            user=user,
            is_active=True,
            defaults={'ip_address': ip_addr if ip_addr != '127.0.0.1' else '192.168.1.100', 'user_agent': user_agent[:250]}
        )

        recent_logs = AuditLog.objects.filter(user=user).order_by('-created_at')[:10]
        logs_data = [{
            'id': str(l.id),
            'action': l.action,
            'description': l.description,
            'ip_address': l.ip_address or ip_addr,
            'timestamp': l.created_at.isoformat(),
        } for l in recent_logs]

        active_sessions = UserSession.objects.filter(user=user, is_active=True).order_by('-last_activity')
        sessions_data = [{
            'id': str(s.id),
            'ip_address': s.ip_address or ip_addr,
            'user_agent': s.user_agent or user_agent,
            'created_at': s.created_at.isoformat(),
            'last_activity': s.last_activity.isoformat(),
            'is_current': s.id == session.id,
        } for s in active_sessions]

        return Response({
            'user': {
                'id': str(user.id),
                'email': user.email,
                'username': user.username,
                'full_name': user.get_full_name() or user.username,
                'role_code': user.role.code if user.role else 'super_admin',
                'role_name': user.role.name if user.role else 'Super Admin',
                'is_two_factor_enabled': user.is_two_factor_enabled,
                'last_login': user.last_login.isoformat() if user.last_login else None,
            },
            'current_session': {
                'ip_address': ip_addr,
                'user_agent': user_agent,
                'login_time': user.last_login.isoformat() if user.last_login else None,
            },
            'active_sessions': sessions_data,
            'recent_activity': logs_data,
        })


class TerminateOtherSessionsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        from .models import UserSession
        curr_id = request.data.get('current_session_id', '')
        qs = UserSession.objects.filter(user=user)
        if curr_id:
            qs = qs.exclude(id=curr_id)
        qs.update(is_active=False)

        AuditLog.objects.create(
            user=user,
            action='sessions_terminated',
            module='accounts',
            entity_name='UserSession',
            entity_id=str(user.id),
            description="Terminated other active login sessions.",
            ip_address=request.META.get('REMOTE_ADDR')
        )
        return Response({'message': 'All other active sessions have been terminated successfully.'})

