from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Notification, Announcement
from .serializers import NotificationSerializer, AnnouncementSerializer

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        user = self.request.user
        target = self.request.data.get('target_user') or self.request.data.get('user') or self.request.data.get('target_email')
        target_name = self.request.data.get('target_name')
        if target:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                matched_user = User.objects.filter(id=target).first() or User.objects.filter(email=target).first()
                if matched_user:
                    user = matched_user
            except Exception:
                pass
        elif target_name:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                matched = User.objects.filter(first_name__icontains=target_name.split()[0]).first()
                if matched:
                    user = matched
            except Exception:
                pass
        serializer.save(user=user)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_read = request.data.get('is_read', True)
        instance.save()
        return Response(NotificationSerializer(instance).data)

class MarkAllNotificationsReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'message': 'All notifications marked as read'})

class AnnouncementViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Announcement.objects.filter(is_active=True).order_by('-created_at')
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticated]
