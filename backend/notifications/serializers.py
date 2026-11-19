from rest_framework import serializers
from .models import Notification, Announcement

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'user', 'title', 'message', 'notification_type', 'link', 'is_read', 'created_at']
        extra_kwargs = {
            'user': {'required': False}
        }

class AnnouncementSerializer(serializers.ModelSerializer):
    creator_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = Announcement
        fields = ['id', 'title', 'content', 'priority', 'target_role', 'is_active', 'creator_name', 'created_at']
