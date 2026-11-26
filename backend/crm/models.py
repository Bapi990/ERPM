from django.db import models
from django.conf import settings
from organizations.models import Branch
import uuid

class Lead(models.Model):
    SOURCE_CHOICES = [
        ('website', 'Website Inbound'),
        ('website_webhook', 'Website Webhook / Form'),
        ('custom_api', 'External Software API'),
        ('api_webhook', 'Inbound Webhook API'),
        ('indiamart', 'IndiaMART / B2B Trade'),
        ('tradeindia', 'TradeIndia Portal'),
        ('justdial', 'JustDial Inquiry'),
        ('zapier', 'Zapier / Make / Pabbly'),
        ('hubspot', 'HubSpot / External CRM'),
        ('meta', 'Meta (Facebook / Instagram)'),
        ('google_ads', 'Google / Search Ads'),
        ('linkedin', 'LinkedIn / Social'),
        ('gmail', 'Gmail / Inbound Email'),
        ('whatsapp', 'WhatsApp Business'),
        ('campaign', 'Marketing Campaign'),
        ('referral', 'Customer Referral'),
        ('direct_call', 'Direct Outreach / Call'),
        ('walk_in', 'Walk-in / Event'),
        ('event', 'Event / Trade Show'),
        ('inbound', 'Inbound Inquiry'),
        ('direct', 'Direct Entry'),
    ]
    STATUS_CHOICES = [
        ('new', 'New Lead'),
        ('contacted', 'Contacted'),
        ('qualified', 'Qualified'),
        ('proposal', 'Proposal Sent'),
        ('negotiation', 'In Negotiation'),
        ('won', 'Closed Won'),
        ('lost', 'Closed Lost'),
    ]
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High / Urgent'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lead_id = models.CharField(max_length=50, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True, default='')
    company_name = models.CharField(max_length=150, blank=True, default='Direct Inquiry')
    email = models.EmailField(blank=True, default='')
    phone = models.CharField(max_length=30, blank=True, default='')
    website = models.URLField(blank=True, default='')
    city = models.CharField(max_length=100, blank=True, default='')
    state = models.CharField(max_length=100, blank=True, default='')
    country = models.CharField(max_length=100, default='India')
    
    source = models.CharField(max_length=50, choices=SOURCE_CHOICES, default='website', blank=True)
    interested_product = models.CharField(max_length=200, blank=True, default='')
    estimated_value = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='new')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_leads')
    notes = models.TextField(blank=True, default='')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def contact_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.contact_name} - {self.company_name} ({self.status})"

class LeadStatusRemark(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='remarks')
    old_status = models.CharField(max_length=30)
    new_status = models.CharField(max_length=30)
    remark = models.TextField()
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.lead.lead_id}: {self.old_status} -> {self.new_status}"

class Customer(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer_code = models.CharField(max_length=50, unique=True)
    company_name = models.CharField(max_length=150)
    contact_person = models.CharField(max_length=150)
    email = models.EmailField()
    phone = models.CharField(max_length=30)
    gstin = models.CharField(max_length=50, blank=True, default='')
    pan = models.CharField(max_length=30, blank=True, default='')
    billing_address = models.TextField(blank=True, default='')
    shipping_address = models.TextField(blank=True, default='')
    city = models.CharField(max_length=100, default='Mumbai')
    state = models.CharField(max_length=100, default='Maharashtra')
    country = models.CharField(max_length=100, default='India')
    
    credit_limit = models.DecimalField(max_digits=12, decimal_places=2, default=100000.0)
    outstanding_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_customers')
    converted_from_lead = models.ForeignKey(Lead, on_delete=models.SET_NULL, null=True, blank=True, related_name='converted_customers')
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.company_name} ({self.customer_code})"

class ContactPerson(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='contact_persons')
    name = models.CharField(max_length=150)
    designation = models.CharField(max_length=100)
    department = models.CharField(max_length=100, blank=True, default='')
    email = models.EmailField()
    phone = models.CharField(max_length=30)
    alternate_phone = models.CharField(max_length=30, blank=True, default='')
    is_primary = models.BooleanField(default=False)
    linkedin_url = models.URLField(blank=True, default='')
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-is_primary', 'name']

    def __str__(self):
        return f"{self.name} ({self.designation}) - {self.customer.company_name}"

class Opportunity(models.Model):
    STAGE_CHOICES = [
        ('discovery', 'Discovery & Need Analysis'),
        ('proposal', 'Proposal / Quotation'),
        ('negotiation', 'Negotiation / Review'),
        ('won', 'Closed Won'),
        ('lost', 'Closed Lost'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='opportunities')
    lead = models.ForeignKey(Lead, on_delete=models.SET_NULL, null=True, blank=True, related_name='opportunities')
    estimated_value = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    probability = models.PositiveIntegerField(default=50) # 0 to 100%
    expected_close_date = models.DateField()
    stage = models.CharField(max_length=30, choices=STAGE_CHOICES, default='discovery')
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='opportunities')
    loss_reason = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.customer.company_name} (₹{self.estimated_value})"

class OpportunityRemark(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    opportunity = models.ForeignKey(Opportunity, on_delete=models.CASCADE, related_name='remarks')
    old_stage = models.CharField(max_length=30)
    new_stage = models.CharField(max_length=30)
    remark = models.TextField()
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.opportunity.title}: {self.old_stage} -> {self.new_stage}"

class CRMActivity(models.Model):
    TYPE_CHOICES = [
        ('call', 'Phone Call'),
        ('meeting', 'Meeting / Demo'),
        ('email', 'Email Outreach'),
        ('task', 'Task / Follow-up'),
        ('whatsapp', 'WhatsApp Note'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    activity_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='call')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    lead = models.ForeignKey(Lead, on_delete=models.SET_NULL, null=True, blank=True, related_name='activities')
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name='activities')
    due_date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='crm_activities')
    outcome = models.CharField(max_length=200, blank=True, default='')
    duration_minutes = models.PositiveIntegerField(default=15)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['due_date']

    def __str__(self):
        return f"{self.activity_type.upper()}: {self.title}"

# --- Lead Channels & API Integrations ---

class LeadChannelConfig(models.Model):
    CHANNEL_CHOICES = [
        ('gmail', 'Gmail / Google Workspace (IMAP/OAuth)'),
        ('meta', 'Meta (Facebook & Instagram Lead Ads)'),
        ('linkedin', 'LinkedIn Lead Gen Forms'),
        ('website_webhook', 'Website Inbound Webhook'),
        ('custom_api', 'Custom REST API Connector'),
        ('indiamart', 'IndiaMART Buyer Inbound API'),
        ('tradeindia', 'TradeIndia Inbound Leads'),
        ('justdial', 'JustDial Inbound Leads'),
        ('zapier', 'Zapier Webhook Bridge'),
        ('hubspot', 'HubSpot Inbound Webhook'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    channel_type = models.CharField(max_length=50, default='custom_api')
    name = models.CharField(max_length=150)
    is_active = models.BooleanField(default=True)
    endpoint_url = models.CharField(max_length=500, blank=True, default='')
    api_key = models.CharField(max_length=255, blank=True, default='')
    webhook_secret = models.CharField(max_length=255, blank=True, default='')
    account_id = models.CharField(max_length=150, blank=True, default='')
    sync_frequency = models.CharField(max_length=50, default='Realtime Webhook')
    auto_assign_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='channel_assigned_leads')
    leads_captured = models.PositiveIntegerField(default=0)
    description = models.TextField(blank=True, default='')
    last_sync_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({'Active' if self.is_active else 'Inactive'})"

class LeadIngestionLog(models.Model):
    STATUS_CHOICES = [
        ('success', 'Successfully Ingested'),
        ('duplicate', 'Duplicate Ignored'),
        ('failed', 'Processing Failed'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    channel = models.ForeignKey(LeadChannelConfig, on_delete=models.SET_NULL, null=True, blank=True, related_name='logs')
    source = models.CharField(max_length=50) # gmail, meta, linkedin, website_webhook
    sender_email = models.CharField(max_length=150, blank=True, default='')
    sender_name = models.CharField(max_length=150, blank=True, default='')
    payload = models.JSONField(default=dict)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='success')
    lead = models.ForeignKey(Lead, on_delete=models.SET_NULL, null=True, blank=True, related_name='ingestion_logs')
    error_message = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.source.upper()}] {self.sender_name or self.sender_email} - {self.status}"

# --- Multichannel Client Communication ---

class ClientCommunication(models.Model):
    CHANNEL_CHOICES = [
        ('email', 'Email (SMTP/Gmail)'),
        ('whatsapp', 'WhatsApp Official Business'),
        ('sms', 'SMS Gateway'),
        ('call_note', 'Phone Call Log'),
    ]
    DIRECTION_CHOICES = [
        ('outbound', 'Outbound (Sent)'),
        ('inbound', 'Inbound (Received)'),
    ]
    STATUS_CHOICES = [
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('read', 'Read / Opened'),
        ('failed', 'Failed'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name='communications')
    lead = models.ForeignKey(Lead, on_delete=models.SET_NULL, null=True, blank=True, related_name='communications')
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES, default='email')
    direction = models.CharField(max_length=20, choices=DIRECTION_CHOICES, default='outbound')
    subject = models.CharField(max_length=200)
    message = models.TextField()
    recipient = models.CharField(max_length=150)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='sent')
    sent_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.channel.upper()}] {self.subject} to {self.recipient}"

# --- Sales Targets & Team Performance ---

class SalesTarget(models.Model):
    PERIOD_CHOICES = [
        ('monthly', 'Monthly Target'),
        ('quarterly', 'Quarterly Target'),
        ('yearly', 'Yearly Target'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sales_targets')
    period_type = models.CharField(max_length=20, choices=PERIOD_CHOICES, default='monthly')
    period_label = models.CharField(max_length=100) # e.g. "November 2026", "Q3 FY 2026-27"
    target_revenue = models.DecimalField(max_digits=14, decimal_places=2, default=500000.0)
    achieved_revenue = models.DecimalField(max_digits=14, decimal_places=2, default=0.0)
    target_deals = models.PositiveIntegerField(default=5)
    achieved_deals = models.PositiveIntegerField(default=0)
    target_leads = models.PositiveIntegerField(default=25)
    achieved_leads = models.PositiveIntegerField(default=0)
    start_date = models.DateField()
    end_date = models.DateField()
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.period_label} (Target: ₹{self.target_revenue})"

# --- Customer Complaints & Grievance Tickets ---

class CustomerComplaint(models.Model):
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical (SLA 4h)'),
    ]
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]
    CATEGORY_CHOICES = [
        ('billing', 'Billing & Invoicing Issue'),
        ('service', 'Service & SLA Delay'),
        ('product', 'Product Defect / Feature'),
        ('delivery', 'Delivery / Dispatch Delay'),
        ('technical', 'Technical Support / Cloud'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket_number = models.CharField(max_length=50, unique=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='complaints')
    subject = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='service')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_complaints')
    resolution_notes = models.TextField(blank=True, default='')
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.ticket_number}] {self.subject} - {self.customer.company_name}"

# --- Customer Feedback & NPS ---

class CustomerFeedback(models.Model):
    RATING_CHOICES = [(i, f"{i} Stars") for i in range(1, 6)]
    CATEGORY_CHOICES = [
        ('product', 'Product Quality & Capabilities'),
        ('customer_service', 'Customer Support & Response'),
        ('pricing', 'Pricing & Contract Terms'),
        ('implementation', 'Implementation & Training'),
        ('general', 'General Overall Experience'),
    ]
    SENTIMENT_CHOICES = [
        ('positive', 'Positive'),
        ('neutral', 'Neutral'),
        ('negative', 'Negative'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='feedbacks')
    rating = models.PositiveSmallIntegerField(choices=RATING_CHOICES, default=5)
    nps_score = models.PositiveSmallIntegerField(default=9) # 0 to 10
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='general')
    sentiment = models.CharField(max_length=20, choices=SENTIMENT_CHOICES, default='positive')
    comments = models.TextField()
    follow_up_required = models.BooleanField(default=False)
    follow_up_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.customer.company_name}: {self.rating}★ (NPS: {self.nps_score})"

# --- Outbound Custom Webhooks & Real-time Integrations ---

class CustomWebhook(models.Model):
    TRIGGER_EVENT_CHOICES = [
        ('lead.created', 'On Created (New Lead Capture)'),
        ('lead.status_changed', 'On Status Change (Stage Updated)'),
        ('lead.assigned', 'On Lead Assigned'),
        ('deal.won', 'On Deal Won / Converted'),
        ('customer.created', 'On Customer Account Created'),
        ('complaint.created', 'On Grievance / Complaint Raised'),
    ]
    METHOD_CHOICES = [
        ('POST', 'POST'),
        ('GET', 'GET'),
        ('PUT', 'PUT'),
    ]
    ENTITY_CHOICES = [
        ('lead', 'Leads'),
        ('deal', 'Deals / Pipeline'),
        ('customer', 'Customers'),
        ('contact', 'Contact Persons'),
        ('complaint', 'Customer Complaints'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150)
    url = models.CharField(max_length=500)
    method = models.CharField(max_length=10, choices=METHOD_CHOICES, default='POST')
    trigger_event = models.CharField(max_length=50, choices=TRIGGER_EVENT_CHOICES, default='lead.created')
    entity_type = models.CharField(max_length=50, choices=ENTITY_CHOICES, default='lead')
    headers = models.JSONField(default=dict, blank=True)
    parameters = models.JSONField(default=dict, blank=True)
    body_template = models.TextField(blank=True, default='')
    description = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    secret_token = models.CharField(max_length=255, blank=True, default='')
    dispatches_count = models.PositiveIntegerField(default=0)
    success_count = models.PositiveIntegerField(default=0)
    last_triggered_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.method}] {self.name} ({self.trigger_event}) -> {self.url}"


class WebhookDeliveryLog(models.Model):
    STATUS_CHOICES = [
        ('success', 'Success (2xx)'),
        ('failed', 'Failed (4xx/5xx/Network)'),
        ('pending', 'Pending / In-Flight'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    webhook = models.ForeignKey(CustomWebhook, on_delete=models.CASCADE, related_name='delivery_logs', null=True, blank=True)
    event = models.CharField(max_length=50, default='lead.created')
    target_url = models.CharField(max_length=500)
    http_method = models.CharField(max_length=10, default='POST')
    request_headers = models.JSONField(default=dict, blank=True)
    request_payload = models.JSONField(default=dict, blank=True)
    response_status = models.IntegerField(null=True, blank=True)
    response_body = models.TextField(blank=True, default='')
    response_headers = models.JSONField(default=dict, blank=True)
    latency_ms = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='success')
    error_message = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.status.upper()}] {self.event} -> {self.target_url} ({self.response_status or 'N/A'})"

