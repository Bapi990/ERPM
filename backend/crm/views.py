import datetime
from decimal import Decimal
import uuid
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Sum, Count, Q, Avg

from .models import (
    Lead, LeadStatusRemark, Customer, ContactPerson,
    Opportunity, OpportunityRemark, CRMActivity,
    LeadChannelConfig, LeadIngestionLog, ClientCommunication,
    SalesTarget, CustomerComplaint, CustomerFeedback
)
from .serializers import (
    LeadSerializer, LeadStatusRemarkSerializer, CustomerSerializer,
    ContactPersonSerializer, OpportunitySerializer, OpportunityRemarkSerializer,
    CRMActivitySerializer, LeadChannelConfigSerializer, LeadIngestionLogSerializer,
    ClientCommunicationSerializer, SalesTargetSerializer, CustomerComplaintSerializer,
    CustomerFeedbackSerializer
)
from audit_logs.models import AuditLog
from accounts.models import User
from accounts.hierarchy import (
    get_scoped_user_ids, can_user_assign_leads, get_assignable_users_for_user
)

class LeadViewSet(viewsets.ModelViewSet):
    serializer_class = LeadSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Lead.objects.all().select_related('assigned_to').prefetch_related('remarks')
        
        # Enforce Hierarchical Access Control
        scoped_ids = get_scoped_user_ids(user)
        if scoped_ids is None:
            # Super Admin: Sees all leads across entire company
            return qs

        if can_user_assign_leads(user):
            # HR Manager / Team Manager: Sees leads assigned to themselves or subordinates, plus unassigned leads to allocate
            return qs.filter(Q(assigned_to_id__in=scoped_ids) | Q(assigned_to__isnull=True))
        
        # Standard Employee / Sales Rep: ONLY sees leads assigned to them!
        return qs.filter(assigned_to=user)

    def perform_create(self, serializer):
        lead_count = Lead.objects.count() + 1
        lead_id = f"LEAD-2026-{lead_count:03d}"
        assigned_user = serializer.validated_data.get('assigned_to') or self.request.user
        lead = serializer.save(lead_id=lead_id, assigned_to=assigned_user)
        
        # Initial remark
        LeadStatusRemark.objects.create(
            lead=lead,
            old_status='draft',
            new_status=lead.status,
            remark=f"Initial lead captured in CRM. Assigned to {assigned_user.get_full_name() or assigned_user.username}.",
            created_by=self.request.user
        )

        AuditLog.objects.create(
            user=self.request.user,
            action='lead_created',
            module='crm',
            entity_name='Lead',
            entity_id=str(lead.id),
            description=f"Created CRM Lead {lead.company_name} ({lead.lead_id}) with value ₹{lead.estimated_value}."
        )

    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        lead = self.get_object()
        new_status = request.data.get('status')
        remark_text = request.data.get('remark', '').strip()

        if not new_status:
            return Response({'error': 'New status is required.'}, status=status.HTTP_400_BAD_REQUEST)

        if not remark_text:
            return Response({'error': 'A transition remark is mandatory when changing status.'}, status=status.HTTP_400_BAD_REQUEST)

        old_status = lead.status
        lead.status = new_status
        lead.save()

        # Create audit remark record
        LeadStatusRemark.objects.create(
            lead=lead,
            old_status=old_status,
            new_status=new_status,
            remark=remark_text,
            created_by=request.user
        )

        AuditLog.objects.create(
            user=request.user,
            action='lead_status_changed',
            module='crm',
            entity_name='Lead',
            entity_id=str(lead.id),
            description=f"Lead {lead.lead_id} status changed from {old_status} to {new_status}. Remark: {remark_text}"
        )

        return Response(LeadSerializer(lead).data)

    @action(detail=True, methods=['post'])
    def schedule_followup(self, request, pk=None):
        lead = self.get_object()
        title = request.data.get('title', f"Follow-up with {lead.contact_name}")
        activity_type = request.data.get('activity_type', 'call')
        due_date_str = request.data.get('due_date')
        description = request.data.get('description', '')

        if not due_date_str:
            due_date = timezone.now() + datetime.timedelta(days=1)
        else:
            try:
                due_date = datetime.datetime.fromisoformat(due_date_str.replace('Z', '+00:00'))
            except Exception:
                due_date = timezone.now() + datetime.timedelta(days=1)

        activity = CRMActivity.objects.create(
            lead=lead,
            title=title,
            activity_type=activity_type,
            due_date=due_date,
            description=description,
            assigned_to=lead.assigned_to or request.user,
            status='pending'
        )

        # Log follow-up scheduled remark
        LeadStatusRemark.objects.create(
            lead=lead,
            old_status=lead.status,
            new_status=lead.status,
            remark=f"Follow-up scheduled: [{activity_type.upper()}] {title} for {due_date.strftime('%d-%b-%Y %I:%M %p')}. Note: {description}",
            created_by=request.user
        )

        return Response({
            'message': 'Follow-up scheduled successfully.',
            'activity': CRMActivitySerializer(activity).data,
            'lead': LeadSerializer(lead).data
        })

    @action(detail=False, methods=['post'])
    def bulk_assign(self, request):
        if not can_user_assign_leads(request.user):
            return Response({'error': 'You do not have permission to assign leads.'}, status=status.HTTP_403_FORBIDDEN)

        lead_ids = request.data.get('lead_ids', [])
        user_id = request.data.get('user_id')
        if not lead_ids or not user_id:
            return Response({'error': 'lead_ids and user_id are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'Target user not found'}, status=status.HTTP_404_NOT_FOUND)

        # Validate that target_user is within assignable scope
        assignable_users = get_assignable_users_for_user(request.user)
        if not assignable_users.filter(id=target_user.id).exists():
            return Response({'error': f"You can only assign leads to employees within your management scope."}, status=status.HTTP_403_FORBIDDEN)

        leads = Lead.objects.filter(id__in=lead_ids)
        count = leads.count()
        for lead in leads:
            old_assigned = lead.assigned_to.get_full_name() if lead.assigned_to else "Unassigned"
            lead.assigned_to = target_user
            lead.save()
            LeadStatusRemark.objects.create(
                lead=lead,
                old_status=lead.status,
                new_status=lead.status,
                remark=f"Lead assigned to {target_user.get_full_name()} by {request.user.get_full_name()}.",
                created_by=request.user
            )

        AuditLog.objects.create(
            user=request.user,
            action='lead_bulk_assigned',
            module='crm',
            entity_name='Lead',
            description=f"Assigned {count} leads to {target_user.get_full_name()}."
        )

        return Response({'message': f"Successfully assigned {count} leads to {target_user.get_full_name()}."})

    @action(detail=False, methods=['post'])
    def auto_distribute(self, request):
        """
        Equal Round-Robin Lead Distribution across active sales reps in the leader's scope.
        """
        if not can_user_assign_leads(request.user):
            return Response({'error': 'You do not have permission to distribute leads.'}, status=status.HTTP_403_FORBIDDEN)

        lead_ids = request.data.get('lead_ids', [])
        if lead_ids:
            leads = list(Lead.objects.filter(id__in=lead_ids))
        else:
            # Pick unassigned leads or new leads in this user's view
            scoped_ids = get_scoped_user_ids(request.user)
            base_qs = Lead.objects.filter(Q(assigned_to__isnull=True) | Q(status='new'))
            if scoped_ids is not None:
                base_qs = base_qs.filter(Q(assigned_to_id__in=scoped_ids) | Q(assigned_to__isnull=True))
            leads = list(base_qs[:50])

        if not leads:
            return Response({'message': 'No candidate unassigned or new leads found to distribute.'})

        # Get assignable reps in this user's scope
        assignable_qs = get_assignable_users_for_user(request.user).filter(status='active').exclude(role__code='accounts')
        target_reps = list(assignable_qs)

        if not target_reps:
            return Response({'error': 'No active sales executives available in your team/scope to receive leads.'}, status=status.HTTP_400_BAD_REQUEST)

        # Distribute equally in round-robin fashion
        distribution_log = []
        rep_count = len(target_reps)

        for idx, lead in enumerate(leads):
            assigned_rep = target_reps[idx % rep_count]
            lead.assigned_to = assigned_rep
            lead.save()

            LeadStatusRemark.objects.create(
                lead=lead,
                old_status=lead.status,
                new_status=lead.status,
                remark=f"Auto-distributed equally (Round-Robin Balancer) to {assigned_rep.get_full_name() or assigned_rep.username} by {request.user.get_full_name() or request.user.username}.",
                created_by=request.user
            )

            distribution_log.append({
                'lead_id': lead.lead_id,
                'company_name': lead.company_name,
                'assigned_to': assigned_rep.get_full_name() or assigned_rep.username,
                'email': assigned_rep.email
            })

        summary_counts = {}
        for item in distribution_log:
            summary_counts[item['assigned_to']] = summary_counts.get(item['assigned_to'], 0) + 1

        summary_text = ", ".join([f"{name}: {cnt} leads" for name, cnt in summary_counts.items()])

        AuditLog.objects.create(
            user=request.user,
            action='leads_auto_distributed',
            module='crm',
            entity_name='Lead',
            description=f"Auto-distributed {len(leads)} leads equally across {len(target_reps)} sales reps. Summary: {summary_text}."
        )

        return Response({
            'message': f"Successfully distributed {len(leads)} leads equally across {len(target_reps)} team members!",
            'total_distributed': len(leads),
            'summary': summary_text,
            'details': distribution_log
        })

    @action(detail=False, methods=['get'])
    def company_hierarchy(self, request):
        """
        Returns company hierarchy, active scope, and team distribution for Super Admin & Leaders.
        """
        user = request.user
        role_code = (user.role.code if user.role else 'user').lower()
        can_assign = can_user_assign_leads(user)
        scoped_ids = get_scoped_user_ids(user)
        assignable_reps = get_assignable_users_for_user(user)

        from hrms.models import Employee

        # Build hierarchy tree
        hr_units = []
        hrs = User.objects.filter(role__code__in=['hr_manager', 'hr'], status='active')
        for h in hrs:
            h_emp = getattr(h, 'employee_profile', None)
            supervisees = list(Employee.objects.filter(assigned_hr=h_emp)) if h_emp else []
            hr_units.append({
                'hr_id': str(h.id),
                'hr_name': h.get_full_name() or h.username,
                'email': h.email,
                'supervisee_count': len(supervisees),
                'supervisee_names': [f"{e.first_name} {e.last_name} ({getattr(e.designation, 'title', 'Staff')})" for e in supervisees[:6]]
            })

        # Managers tree
        manager_units = []
        mgrs = User.objects.filter(role__code__in=['manager', 'sales_manager'], status='active')
        for m in mgrs:
            m_emp = getattr(m, 'employee_profile', None)
            subs = list(Employee.objects.filter(reporting_manager=m_emp)) if m_emp else []
            manager_units.append({
                'manager_id': str(m.id),
                'manager_name': m.get_full_name() or m.username,
                'email': m.email,
                'subordinate_count': len(subs),
                'subordinate_names': [f"{e.first_name} {e.last_name} ({getattr(e.designation, 'title', 'Staff')})" for e in subs[:6]]
            })

        # Rep workloads in current user's scope
        reps_data = []
        for rep in assignable_reps:
            lead_cnt = Lead.objects.filter(assigned_to=rep).count()
            active_cnt = Lead.objects.filter(assigned_to=rep, status__in=['new', 'contacted', 'qualified', 'proposal', 'negotiation']).count()
            won_cnt = Lead.objects.filter(assigned_to=rep, status='won').count()
            val = sum(l.estimated_value for l in Lead.objects.filter(assigned_to=rep))

            reps_data.append({
                'id': str(rep.id),
                'name': rep.get_full_name() or rep.username,
                'email': rep.email,
                'role': rep.role.name if rep.role else 'Sales Executive',
                'active_leads': active_cnt,
                'total_leads': lead_cnt,
                'won_deals': won_cnt,
                'total_pipeline_val': float(val),
            })

        return Response({
            'current_user': {
                'id': str(user.id),
                'name': user.get_full_name() or user.username,
                'email': user.email,
                'role_code': role_code,
                'role_name': user.role.name if user.role else 'User',
                'can_assign': can_assign,
                'is_super_admin': user.is_superuser or role_code == 'super_admin',
            },
            'assignable_reps': reps_data,
            'hr_units': hr_units,
            'manager_units': manager_units,
        })

    @action(detail=True, methods=['post'])
    def convert(self, request, pk=None):
        lead = self.get_object()
        if lead.status == 'won':
            return Response({'error': 'Lead already converted'}, status=status.HTTP_400_BAD_REQUEST)

        cust_count = Customer.objects.count() + 1
        customer, created = Customer.objects.get_or_create(
            email=lead.email,
            defaults={
                'customer_code': f"CUST-{cust_count:04d}",
                'company_name': lead.company_name,
                'contact_person': lead.contact_name,
                'phone': lead.phone,
                'city': lead.city or 'Bhubaneswar',
                'state': lead.state or 'Odisha',
                'country': lead.country or 'India',
                'assigned_to': lead.assigned_to or request.user,
                'converted_from_lead': lead,
            }
        )

        ContactPerson.objects.get_or_create(
            customer=customer,
            email=lead.email,
            defaults={
                'name': lead.contact_name,
                'designation': 'Primary Contact',
                'phone': lead.phone,
                'is_primary': True
            }
        )

        opp = Opportunity.objects.create(
            title=f"ERP Contract - {lead.company_name}",
            customer=customer,
            lead=lead,
            estimated_value=lead.estimated_value,
            probability=75,
            expected_close_date=datetime.date.today() + datetime.timedelta(days=30),
            stage='proposal',
            assigned_to=lead.assigned_to or request.user
        )

        OpportunityRemark.objects.create(
            opportunity=opp,
            old_stage='discovery',
            new_stage='proposal',
            remark=f"Auto-created opportunity from converted lead {lead.lead_id}.",
            created_by=request.user
        )

        lead.status = 'won'
        lead.save()

        LeadStatusRemark.objects.create(
            lead=lead,
            old_status='negotiation',
            new_status='won',
            remark=f"Converted to Commercial Customer {customer.customer_code} and Deal {opp.title}.",
            created_by=request.user
        )

        return Response({
            'message': f"Lead successfully converted to Customer ({customer.customer_code}) and Opportunity!",
            'customer': CustomerSerializer(customer).data,
            'opportunity': OpportunitySerializer(opp).data
        })

class LeadStatusRemarkViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LeadStatusRemark.objects.all().select_related('created_by', 'lead')
    serializer_class = LeadStatusRemarkSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        lead_id = self.request.query_params.get('lead')
        if lead_id:
            qs = qs.filter(lead_id=lead_id)
        return qs

class CustomerViewSet(viewsets.ModelViewSet):
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Customer.objects.all().select_related('assigned_to').prefetch_related('contact_persons')
        scoped_ids = get_scoped_user_ids(user)
        if scoped_ids is None:
            return qs
        return qs.filter(Q(assigned_to_id__in=scoped_ids) | Q(assigned_to__isnull=True))

    def perform_create(self, serializer):
        cust_count = Customer.objects.count() + 1
        code = f"CUST-2026-{cust_count:03d}"
        cust = serializer.save(customer_code=code, assigned_to=self.request.user)
        if cust.contact_person:
            ContactPerson.objects.create(
                customer=cust,
                name=cust.contact_person,
                designation='Director / Authorized Rep',
                email=cust.email,
                phone=cust.phone,
                is_primary=True
            )

class ContactPersonViewSet(viewsets.ModelViewSet):
    queryset = ContactPerson.objects.all().select_related('customer')
    serializer_class = ContactPersonSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        customer_id = self.request.query_params.get('customer')
        if customer_id:
            qs = qs.filter(customer_id=customer_id)
        return qs

class OpportunityViewSet(viewsets.ModelViewSet):
    serializer_class = OpportunitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Opportunity.objects.all().select_related('customer', 'assigned_to').prefetch_related('remarks')
        scoped_ids = get_scoped_user_ids(user)
        if scoped_ids is None:
            return qs
        return qs.filter(assigned_to_id__in=scoped_ids)

    def perform_create(self, serializer):
        opp = serializer.save(assigned_to=self.request.user)
        OpportunityRemark.objects.create(
            opportunity=opp,
            old_stage='initial',
            new_stage=opp.stage,
            remark="Deal initiated in Pipeline.",
            created_by=self.request.user
        )

    @action(detail=True, methods=['post'])
    def update_stage_with_remark(self, request, pk=None):
        opp = self.get_object()
        new_stage = request.data.get('stage')
        remark_text = request.data.get('remark', '').strip()
        loss_reason = request.data.get('loss_reason', '')

        if not new_stage:
            return Response({'error': 'stage is required'}, status=status.HTTP_400_BAD_REQUEST)

        if not remark_text:
            return Response({'error': 'A stage transition remark is required.'}, status=status.HTTP_400_BAD_REQUEST)

        old_stage = opp.stage
        opp.stage = new_stage
        
        stage_probs = {
            'discovery': 25,
            'proposal': 50,
            'negotiation': 75,
            'won': 100,
            'lost': 0
        }
        if new_stage in stage_probs:
            opp.probability = stage_probs[new_stage]

        if new_stage == 'lost' and loss_reason:
            opp.loss_reason = loss_reason

        opp.save()

        OpportunityRemark.objects.create(
            opportunity=opp,
            old_stage=old_stage,
            new_stage=new_stage,
            remark=remark_text,
            created_by=request.user
        )

        AuditLog.objects.create(
            user=request.user,
            action='opportunity_stage_changed',
            module='crm',
            entity_name='Opportunity',
            entity_id=str(opp.id),
            description=f"Deal '{opp.title}' moved from {old_stage} to {new_stage}. Remark: {remark_text}"
        )

        return Response(OpportunitySerializer(opp).data)

class OpportunityRemarkViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = OpportunityRemark.objects.all().select_related('created_by', 'opportunity')
    serializer_class = OpportunityRemarkSerializer
    permission_classes = [IsAuthenticated]

class CRMActivityViewSet(viewsets.ModelViewSet):
    serializer_class = CRMActivitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = CRMActivity.objects.all().select_related('lead', 'customer', 'assigned_to')
        scoped_ids = get_scoped_user_ids(user)
        if scoped_ids is None:
            return qs
        return qs.filter(assigned_to_id__in=scoped_ids)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        act = self.get_object()
        act.status = 'completed'
        act.outcome = request.data.get('outcome', 'Completed as scheduled.')
        act.save()
        return Response(CRMActivitySerializer(act).data)

# --- Lead Channels, Integrations & Webhook Ingestion ---

class LeadChannelConfigViewSet(viewsets.ModelViewSet):
    queryset = LeadChannelConfig.objects.all().select_related('auto_assign_to')
    serializer_class = LeadChannelConfigSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        auto_user = serializer.validated_data.get('auto_assign_to') or self.request.user
        channel = serializer.save(auto_assign_to=auto_user)
        AuditLog.objects.create(
            user=self.request.user,
            action='crm_channel_created',
            module='crm',
            entity_name='LeadChannelConfig',
            entity_id=str(channel.id),
            description=f"Added new CRM Lead Integration channel: {channel.name} ({channel.channel_type})."
        )

    def perform_update(self, serializer):
        channel = serializer.save()
        AuditLog.objects.create(
            user=self.request.user,
            action='crm_channel_updated',
            module='crm',
            entity_name='LeadChannelConfig',
            entity_id=str(channel.id),
            description=f"Updated CRM Lead Integration: {channel.name}."
        )

    @action(detail=True, methods=['post'])
    def test_lead(self, request, pk=None):
        channel = self.get_object()
        ts = int(timezone.now().timestamp())
        
        # Simulated payload generator by channel type
        simulated_data = {
            'gmail': {
                'first_name': 'Dr. Vikram',
                'last_name': 'Mehta',
                'company_name': 'Mehta Healthcare & Diagnostic Labs',
                'email': f"dr.vikram.mehta.{ts}@mehtalabs.in",
                'phone': '+91 98201 54321',
                'city': 'Mumbai',
                'state': 'Maharashtra',
                'source': 'gmail',
                'interested_product': 'Odias ERP Cloud + Hospital Billing Suite',
                'estimated_value': 450000.0,
                'notes': 'Inbound inquiry received via Google Workspace email parser: "Interested in hospital billing and inventory demo next Tuesday."'
            },
            'meta': {
                'first_name': 'Sneha',
                'last_name': 'Patil',
                'company_name': 'Apex Logistics & Freight Solutions',
                'email': f"sneha.patil.{ts}@apexlogistics.in",
                'phone': '+91 98450 12890',
                'city': 'Pune',
                'state': 'Maharashtra',
                'source': 'meta',
                'interested_product': 'Odias Supply Chain & GST Billing',
                'estimated_value': 280000.0,
                'notes': 'Captured via Meta Lead Ad campaign "GST Compliant ERP 2026" - Instant Form.'
            },
            'linkedin': {
                'first_name': 'Rajesh',
                'last_name': 'Bansal',
                'company_name': 'Bansal Infotech Solutions LLP',
                'email': f"rajesh.bansal.{ts}@bansalinfo.com",
                'phone': '+91 99370 88219',
                'city': 'Bhubaneswar',
                'state': 'Odisha',
                'source': 'linkedin',
                'interested_product': 'Multi-Branch Accounting & E-Invoicing',
                'estimated_value': 350000.0,
                'notes': 'LinkedIn Lead Gen Form: Chief Financial Officer inquiring for 4 sister company branches.'
            },
            'indiamart': {
                'first_name': 'Sunil',
                'last_name': 'Panda',
                'company_name': 'Panda Steel & Tubes Manufacturing',
                'email': f"sunil.panda.{ts}@pandasteel.com",
                'phone': '+91 94370 11928',
                'city': 'Rourkela',
                'state': 'Odisha',
                'source': 'indiamart',
                'interested_product': 'Manufacturing ERP & Barcode Inventory',
                'estimated_value': 520000.0,
                'notes': 'IndiaMART Verified Buyer Inquiry: Requirement for raw material batch tracking and GST compliance.'
            },
            'tradeindia': {
                'first_name': 'Naveen',
                'last_name': 'Srivastava',
                'company_name': 'Srivastava Chemicals & Fertilizers',
                'email': f"naveen.s.{ts}@srivastavachem.in",
                'phone': '+91 98390 66412',
                'city': 'Kanpur',
                'state': 'Uttar Pradesh',
                'source': 'tradeindia',
                'interested_product': 'Multi-Branch Chemical Billing & Warehouse',
                'estimated_value': 480000.0,
                'notes': 'TradeIndia Inbound Portal inquiry for Chemical Billing ERP.'
            },
            'justdial': {
                'first_name': 'Kavita',
                'last_name': 'Sharma',
                'company_name': 'Sharma Consumer Electronics',
                'email': f"kavita.sharma.{ts}@sharmaelec.in",
                'phone': '+91 98110 33219',
                'city': 'New Delhi',
                'state': 'Delhi',
                'source': 'justdial',
                'interested_product': 'Retail POS & GST Invoicing Solution',
                'estimated_value': 220000.0,
                'notes': 'JustDial verified telephone inquiry.'
            },
            'website_webhook': {
                'first_name': 'Ananya',
                'last_name': 'Deshmukh',
                'company_name': 'Deshmukh Heavy Engineering Pvt Ltd',
                'email': f"ananya.d.{ts}@deshmukh-eng.co.in",
                'phone': '+91 97660 33412',
                'city': 'Nagpur',
                'state': 'Maharashtra',
                'source': 'website',
                'interested_product': 'Enterprise ERP Manufacturing & GST',
                'estimated_value': 620000.0,
                'notes': 'Inbound contact form submitted on odiaserp.com'
            },
            'custom_api': {
                'first_name': 'Karan',
                'last_name': 'Singhania',
                'company_name': 'Singhania Retail MegaStores',
                'email': f"karan.s.{ts}@singhaniagroup.in",
                'phone': '+91 91220 77114',
                'city': 'Ranchi',
                'state': 'Jharkhand',
                'source': 'api_webhook',
                'interested_product': 'Retail POS & Warehouse Barcode Scanner',
                'estimated_value': 540000.0,
                'notes': f"Ingested via API connector: {channel.name}"
            }
        }

        payload = simulated_data.get(channel.channel_type, simulated_data['custom_api'])
        
        lead_count = Lead.objects.count() + 1
        lead_id = f"LEAD-2026-{lead_count:03d}"
        
        lead = Lead.objects.create(
            lead_id=lead_id,
            first_name=payload['first_name'],
            last_name=payload['last_name'],
            company_name=payload['company_name'],
            email=payload['email'],
            phone=payload['phone'],
            city=payload['city'],
            state=payload['state'],
            source=payload['source'],
            interested_product=payload['interested_product'],
            estimated_value=payload['estimated_value'],
            status='new',
            priority='high',
            assigned_to=channel.auto_assign_to or request.user,
            notes=payload['notes']
        )

        LeadStatusRemark.objects.create(
            lead=lead,
            old_status='inbound_capture',
            new_status='new',
            remark=f"Lead automatically captured via channel: {channel.name}. Source payload verified.",
            created_by=request.user
        )

        log = LeadIngestionLog.objects.create(
            channel=channel,
            source=channel.channel_type,
            sender_email=lead.email,
            sender_name=lead.contact_name,
            payload=payload,
            status='success',
            lead=lead
        )

        channel.leads_captured += 1
        channel.last_sync_at = timezone.now()
        channel.save()

        return Response({
            'message': f"Test lead '{lead.contact_name}' successfully captured from {channel.name}!",
            'lead': LeadSerializer(lead).data,
            'log': LeadIngestionLogSerializer(log).data
        })

class InboundLeadWebhookView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        company_name = data.get('company_name') or data.get('company') or 'Web Inbound Company'
        first_name = data.get('first_name') or data.get('name', 'Web Lead')
        last_name = data.get('last_name', '')
        email = data.get('email')
        phone = data.get('phone', '')

        if not email:
            return Response({'error': 'email is required in lead payload.'}, status=status.HTTP_400_BAD_REQUEST)

        secret = request.headers.get('X-Webhook-Secret') or request.query_params.get('secret')
        channel = LeadChannelConfig.objects.filter(is_active=True).first()
        if secret:
            channel_match = LeadChannelConfig.objects.filter(webhook_secret=secret, is_active=True).first()
            if channel_match:
                channel = channel_match

        lead_count = Lead.objects.count() + 1
        lead_id = f"LEAD-2026-{lead_count:03d}"
        
        default_user = (channel.auto_assign_to if channel and channel.auto_assign_to else None) or User.objects.filter(is_superuser=True).first() or User.objects.first()

        lead = Lead.objects.create(
            lead_id=lead_id,
            first_name=first_name,
            last_name=last_name,
            company_name=company_name,
            email=email,
            phone=phone,
            city=data.get('city', ''),
            state=data.get('state', ''),
            source=data.get('source', 'website'),
            interested_product=data.get('interested_product', 'ERP System Inbound'),
            estimated_value=data.get('estimated_value', 100000.0),
            status='new',
            priority='medium',
            assigned_to=default_user,
            notes=data.get('notes', 'Received via Inbound Webhook API')
        )

        LeadStatusRemark.objects.create(
            lead=lead,
            old_status='webhook_ingestion',
            new_status='new',
            remark=f"Captured via Inbound Webhook API. Payload: {str(data)[:200]}",
            created_by=default_user
        )

        log = LeadIngestionLog.objects.create(
            channel=channel,
            source='website_webhook',
            sender_email=email,
            sender_name=f"{first_name} {last_name}".strip(),
            payload=data,
            status='success',
            lead=lead
        )

        if channel:
            channel.leads_captured += 1
            channel.last_sync_at = timezone.now()
            channel.save()

        return Response({
            'success': True,
            'lead_id': lead.lead_id,
            'message': 'Lead successfully captured and queued.'
        }, status=status.HTTP_201_CREATED)

class LeadIngestionLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LeadIngestionLog.objects.all().select_related('channel', 'lead')
    serializer_class = LeadIngestionLogSerializer
    permission_classes = [IsAuthenticated]

# --- Client Communication ViewSet ---

class ClientCommunicationViewSet(viewsets.ModelViewSet):
    queryset = ClientCommunication.objects.all().select_related('customer', 'lead', 'sent_by')
    serializer_class = ClientCommunicationSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(sent_by=self.request.user)

# --- Sales Targets & Team Performance ---

class SalesTargetViewSet(viewsets.ModelViewSet):
    serializer_class = SalesTargetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = SalesTarget.objects.all().select_related('user')
        scoped_ids = get_scoped_user_ids(user)
        if scoped_ids is None:
            return qs
        return qs.filter(user_id__in=scoped_ids)

class SalesPerformanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        scoped_ids = get_scoped_user_ids(user)

        users_qs = User.objects.filter(is_active=True).exclude(role__name='Accountant')
        if scoped_ids is not None:
            users_qs = users_qs.filter(id__in=scoped_ids)

        leaderboard = []

        for u in users_qs:
            leads_count = Lead.objects.filter(assigned_to=u).count()
            won_deals = Opportunity.objects.filter(assigned_to=u, stage='won')
            won_count = won_deals.count()
            won_val = sum(o.estimated_value for o in won_deals)
            pipe_deals = Opportunity.objects.filter(assigned_to=u).exclude(stage__in=['won', 'lost'])
            pipe_val = sum(o.estimated_value for o in pipe_deals)
            
            target = SalesTarget.objects.filter(user=u).order_by('-start_date').first()
            target_rev = target.target_revenue if target else Decimal('500000.0')
            attainment = round(float((Decimal(won_val) / max(Decimal('1.0'), target_rev)) * 100), 1)

            leaderboard.append({
                'user_id': str(u.id),
                'user_name': u.get_full_name() or u.username,
                'email': u.email,
                'role': u.role.name if u.role else 'Sales Executive',
                'leads_count': leads_count,
                'won_deals_count': won_count,
                'won_revenue': float(won_val),
                'pipeline_revenue': float(pipe_val),
                'target_revenue': float(target_rev),
                'attainment_percentage': attainment,
                'conversion_rate': round((won_count / max(1, leads_count)) * 100, 1)
            })

        leaderboard.sort(key=lambda x: x['won_revenue'], reverse=True)

        return Response({
            'leaderboard': leaderboard,
            'total_won_revenue': sum(x['won_revenue'] for x in leaderboard),
            'total_pipeline_revenue': sum(x['pipeline_revenue'] for x in leaderboard),
            'avg_deal_size': round(sum(x['won_revenue'] for x in leaderboard) / max(1, sum(x['won_deals_count'] for x in leaderboard)), 2)
        })

# --- Customer Complaints ViewSet ---

class CustomerComplaintViewSet(viewsets.ModelViewSet):
    queryset = CustomerComplaint.objects.all().select_related('customer', 'assigned_to')
    serializer_class = CustomerComplaintSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        c_count = CustomerComplaint.objects.count() + 1
        ticket = f"TKT-2026-{c_count:04d}"
        serializer.save(ticket_number=ticket, assigned_to=self.request.user)

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        comp = self.get_object()
        comp.status = 'resolved'
        comp.resolution_notes = request.data.get('resolution_notes', 'Issue addressed and resolved successfully.')
        comp.resolved_at = timezone.now()
        comp.save()
        return Response(CustomerComplaintSerializer(comp).data)

# --- Customer Feedback ViewSet ---

class CustomerFeedbackViewSet(viewsets.ModelViewSet):
    queryset = CustomerFeedback.objects.all().select_related('customer')
    serializer_class = CustomerFeedbackSerializer
    permission_classes = [IsAuthenticated]

# --- CRM Dashboard Stats ---

class CRMDashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        scoped_ids = get_scoped_user_ids(user)

        leads_qs = Lead.objects.all()
        opps_qs = Opportunity.objects.all()

        if scoped_ids is not None:
            leads_qs = leads_qs.filter(assigned_to_id__in=scoped_ids)
            opps_qs = opps_qs.filter(assigned_to_id__in=scoped_ids)

        total_leads = leads_qs.count()
        new_leads = leads_qs.filter(status='new').count()
        contacted_leads = leads_qs.filter(status='contacted').count()
        qualified_leads = leads_qs.filter(status='qualified').count()
        won_deals = leads_qs.filter(status='won').count()
        pipeline_val = sum(o.estimated_value for o in opps_qs.exclude(stage__in=['lost', 'closed_lost']))

        act_qs = CRMActivity.objects.filter(status='pending')
        if scoped_ids is not None:
            act_qs = act_qs.filter(assigned_to_id__in=scoped_ids)
        due_activities = act_qs.order_by('due_date')[:6]

        open_complaints = CustomerComplaint.objects.filter(status__in=['open', 'in_progress']).count()
        avg_rating = round(CustomerFeedback.objects.aggregate(Avg('rating'))['rating__avg'] or 4.8, 1)

        channels_active = LeadChannelConfig.objects.filter(is_active=True).count()
        total_captured = sum(c.leads_captured for c in LeadChannelConfig.objects.all())

        return Response({
            'total_leads': total_leads,
            'new_leads_this_month': new_leads,
            'contacted_leads': contacted_leads,
            'qualified_leads': qualified_leads,
            'pipeline_value': float(pipeline_val),
            'won_deals_count': won_deals,
            'conversion_rate': round((won_deals / max(1, total_leads)) * 100, 1),
            'open_complaints': open_complaints,
            'avg_customer_rating': avg_rating,
            'channels_active': channels_active,
            'total_leads_captured': total_captured,
            'upcoming_activities': CRMActivitySerializer(due_activities, many=True).data
        })
