from rest_framework import serializers
from .models import (
    Lead, LeadStatusRemark, Customer, ContactPerson,
    Opportunity, OpportunityRemark, CRMActivity,
    LeadChannelConfig, LeadIngestionLog, ClientCommunication,
    SalesTarget, CustomerComplaint, CustomerFeedback,
    CustomWebhook, WebhookDeliveryLog
)
from accounts.models import User

class LeadStatusRemarkSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = LeadStatusRemark
        fields = ['id', 'lead', 'old_status', 'new_status', 'remark', 'created_by', 'created_by_name', 'created_at']

class LeadSerializer(serializers.ModelSerializer):
    assigned_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    remarks = LeadStatusRemarkSerializer(many=True, read_only=True)
    remarks_count = serializers.SerializerMethodField()

    class Meta:
        model = Lead
        fields = [
            'id', 'lead_id', 'first_name', 'last_name', 'contact_name',
            'company_name', 'email', 'phone', 'website', 'city', 'state',
            'country', 'source', 'interested_product', 'estimated_value',
            'status', 'priority', 'assigned_to', 'assigned_name', 'notes',
            'remarks', 'remarks_count', 'created_at', 'updated_at'
        ]

    def get_remarks_count(self, obj):
        return obj.remarks.count()

class ContactPersonSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.company_name', read_only=True)

    class Meta:
        model = ContactPerson
        fields = [
            'id', 'customer', 'customer_name', 'name', 'designation',
            'department', 'email', 'phone', 'alternate_phone',
            'is_primary', 'linkedin_url', 'notes', 'created_at'
        ]

class CustomerSerializer(serializers.ModelSerializer):
    assigned_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    invoices_count = serializers.SerializerMethodField()
    contact_persons = ContactPersonSerializer(many=True, read_only=True)

    class Meta:
        model = Customer
        fields = [
            'id', 'customer_code', 'company_name', 'contact_person', 'email',
            'phone', 'gstin', 'pan', 'billing_address', 'shipping_address', 'city',
            'state', 'country', 'credit_limit', 'outstanding_balance',
            'assigned_to', 'assigned_name', 'is_active', 'invoices_count',
            'contact_persons', 'created_at'
        ]

    def get_invoices_count(self, obj):
        return getattr(obj, 'invoices', []).count() if hasattr(obj, 'invoices') else 0

class OpportunityRemarkSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = OpportunityRemark
        fields = ['id', 'opportunity', 'old_stage', 'new_stage', 'remark', 'created_by', 'created_by_name', 'created_at']

class OpportunitySerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.company_name', read_only=True)
    assigned_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    remarks = OpportunityRemarkSerializer(many=True, read_only=True)

    class Meta:
        model = Opportunity
        fields = [
            'id', 'title', 'customer', 'customer_name', 'lead', 'estimated_value',
            'probability', 'expected_close_date', 'stage', 'assigned_to',
            'assigned_name', 'loss_reason', 'remarks', 'created_at', 'updated_at'
        ]

class CRMActivitySerializer(serializers.ModelSerializer):
    lead_name = serializers.CharField(source='lead.company_name', read_only=True)
    customer_name = serializers.CharField(source='customer.company_name', read_only=True)
    assigned_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)

    class Meta:
        model = CRMActivity
        fields = [
            'id', 'activity_type', 'title', 'description', 'lead', 'lead_name',
            'customer', 'customer_name', 'due_date', 'status', 'assigned_to',
            'assigned_name', 'outcome', 'duration_minutes', 'created_at'
        ]

class LeadChannelConfigSerializer(serializers.ModelSerializer):
    assigned_name = serializers.CharField(source='auto_assign_to.get_full_name', read_only=True)

    class Meta:
        model = LeadChannelConfig
        fields = [
            'id', 'channel_type', 'name', 'is_active', 'endpoint_url',
            'api_key', 'webhook_secret', 'account_id', 'sync_frequency',
            'auto_assign_to', 'assigned_name', 'leads_captured', 'description',
            'last_sync_at', 'created_at', 'updated_at'
        ]

class LeadIngestionLogSerializer(serializers.ModelSerializer):
    channel_name = serializers.CharField(source='channel.name', read_only=True)
    lead_code = serializers.CharField(source='lead.lead_id', read_only=True)

    class Meta:
        model = LeadIngestionLog
        fields = [
            'id', 'channel', 'channel_name', 'source', 'sender_email',
            'sender_name', 'payload', 'status', 'lead', 'lead_code',
            'error_message', 'created_at'
        ]

class ClientCommunicationSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.company_name', read_only=True)
    lead_name = serializers.CharField(source='lead.company_name', read_only=True)
    sent_by_name = serializers.CharField(source='sent_by.get_full_name', read_only=True)

    class Meta:
        model = ClientCommunication
        fields = [
            'id', 'customer', 'customer_name', 'lead', 'lead_name',
            'channel', 'direction', 'subject', 'message', 'recipient',
            'status', 'sent_by', 'sent_by_name', 'created_at'
        ]

class SalesTargetSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    achievement_percentage = serializers.SerializerMethodField()

    class Meta:
        model = SalesTarget
        fields = [
            'id', 'user', 'user_name', 'user_email', 'period_type', 'period_label',
            'target_revenue', 'achieved_revenue', 'target_deals', 'achieved_deals',
            'target_leads', 'achieved_leads', 'start_date', 'end_date', 'notes',
            'achievement_percentage', 'created_at'
        ]

    def get_achievement_percentage(self, obj):
        if obj.target_revenue > 0:
            return round(float((obj.achieved_revenue / obj.target_revenue) * 100), 1)
        return 0.0

class CustomerComplaintSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.company_name', read_only=True)
    assigned_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)

    class Meta:
        model = CustomerComplaint
        fields = [
            'id', 'ticket_number', 'customer', 'customer_name', 'subject',
            'description', 'category', 'priority', 'status', 'assigned_to',
            'assigned_name', 'resolution_notes', 'resolved_at', 'created_at', 'updated_at'
        ]

class CustomerFeedbackSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.company_name', read_only=True)

    class Meta:
        model = CustomerFeedback
        fields = [
            'id', 'customer', 'customer_name', 'rating', 'nps_score',
            'category', 'sentiment', 'comments', 'follow_up_required',
            'follow_up_completed', 'created_at'
        ]

class WebhookDeliveryLogSerializer(serializers.ModelSerializer):
    webhook_name = serializers.CharField(source='webhook.name', read_only=True)

    class Meta:
        model = WebhookDeliveryLog
        fields = [
            'id', 'webhook', 'webhook_name', 'event', 'target_url',
            'http_method', 'request_headers', 'request_payload',
            'response_status', 'response_body', 'response_headers',
            'latency_ms', 'status', 'error_message', 'created_at'
        ]

class CustomWebhookSerializer(serializers.ModelSerializer):
    success_rate = serializers.SerializerMethodField()
    recent_logs = WebhookDeliveryLogSerializer(source='delivery_logs', many=True, read_only=True)

    class Meta:
        model = CustomWebhook
        fields = [
            'id', 'name', 'url', 'method', 'trigger_event', 'entity_type',
            'headers', 'parameters', 'body_template', 'description',
            'is_active', 'secret_token', 'dispatches_count', 'success_count',
            'success_rate', 'last_triggered_at', 'recent_logs',
            'created_at', 'updated_at'
        ]

    def get_success_rate(self, obj):
        if obj.dispatches_count > 0:
            return round(float((obj.success_count / obj.dispatches_count) * 100), 1)
        return 100.0

