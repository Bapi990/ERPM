"""
URL configuration for Greenbacks ERP.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter

from accounts.views import (
    LoginView, DemoSwitchUserView, CurrentUserView, UserViewSet, RoleViewSet, PermissionListView,
    ChangePasswordView, SecurityOverviewView, TerminateOtherSessionsView
)
from organizations.views import OrganizationDetailView, BranchViewSet, DepartmentViewSet, DesignationViewSet
from hrms.views import (
    EmployeeViewSet, EmployeeDocumentViewSet, AttendanceEventViewSet, AttendanceCheckInView,
    AttendanceCheckOutView, ShiftViewSet, LeaveTypeViewSet,
    LeaveBalanceView, LeaveApplicationViewSet, HolidayViewSet,
    HRMSDashboardStatsView, WfhRequestViewSet, OvertimeRecordViewSet,
    JobPostingViewSet, JobApplicationViewSet, InterviewScheduleViewSet,
    OnboardingMilestoneViewSet, OffboardingRecordViewSet, EmployeeGrievanceViewSet
)
from payroll.views import (
    SalaryStructureViewSet, PayrollPeriodViewSet, PayrollRunViewSet,
    ProcessPayrollView, FinalizePayrollView, PayslipViewSet,
    PayrollDashboardStatsView, SalaryAdvanceViewSet, BonusIncentiveViewSet,
    CustomDeductionViewSet, SettlementRecordViewSet
)
from crm.views import (
    LeadViewSet, LeadStatusRemarkViewSet, CustomerViewSet, ContactPersonViewSet,
    OpportunityViewSet, OpportunityRemarkViewSet, CRMActivityViewSet,
    LeadChannelConfigViewSet, LeadIngestionLogViewSet, InboundLeadWebhookView,
    ClientCommunicationViewSet, SalesTargetViewSet, SalesPerformanceView,
    CustomerComplaintViewSet, CustomerFeedbackViewSet, CRMDashboardStatsView
)
from billing.views import (
    ProductServiceViewSet, QuotationViewSet, InvoiceViewSet,
    PaymentViewSet, ExpenseViewSet, BillingDashboardStatsView,
    CompanyProfileView, BranchViewSet as BillingBranchViewSet, FinancialYearSettingViewSet, TaxRateMasterViewSet,
    HSNMasterViewSet, SACMasterViewSet, SupplierViewSet,
    WarehouseViewSet, StockLedgerViewSet, StockAdjustmentViewSet,
    StockTransferViewSet, SalesOrderViewSet, CreditNoteViewSet,
    DebitNoteViewSet, RecurringInvoiceViewSet, PurchaseOrderViewSet,
    PurchaseBillViewSet, SupplierPaymentViewSet, AccountViewSet,
    JournalEntryViewSet, AccountingReportsView, GSTComplianceView
)
from audit_logs.views import AuditLogViewSet
from notifications.views import NotificationViewSet, MarkAllNotificationsReadView, AnnouncementViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='users')
router.register(r'roles', RoleViewSet, basename='roles')
router.register(r'branches', BranchViewSet, basename='branches')
router.register(r'departments', DepartmentViewSet, basename='departments')
router.register(r'designations', DesignationViewSet, basename='designations')
router.register(r'hrms/employees', EmployeeViewSet, basename='hrms-employees')
router.register(r'hrms/documents', EmployeeDocumentViewSet, basename='hrms-documents')
router.register(r'hrms/attendance', AttendanceEventViewSet, basename='hrms-attendance')
router.register(r'hrms/shifts', ShiftViewSet, basename='hrms-shifts')
router.register(r'hrms/leave-types', LeaveTypeViewSet, basename='hrms-leave-types')
router.register(r'hrms/leave-applications', LeaveApplicationViewSet, basename='hrms-leave-applications')
router.register(r'hrms/holidays', HolidayViewSet, basename='hrms-holidays')
router.register(r'hrms/wfh', WfhRequestViewSet, basename='hrms-wfh')
router.register(r'hrms/overtime', OvertimeRecordViewSet, basename='hrms-overtime')
router.register(r'hrms/job-postings', JobPostingViewSet, basename='hrms-job-postings')
router.register(r'hrms/job-applications', JobApplicationViewSet, basename='hrms-job-applications')
router.register(r'hrms/interviews', InterviewScheduleViewSet, basename='hrms-interviews')
router.register(r'hrms/onboarding-milestones', OnboardingMilestoneViewSet, basename='hrms-onboarding-milestones')
router.register(r'hrms/offboarding', OffboardingRecordViewSet, basename='hrms-offboarding')
router.register(r'hrms/grievances', EmployeeGrievanceViewSet, basename='hrms-grievances')
router.register(r'payroll/salary-structures', SalaryStructureViewSet, basename='payroll-salary')
router.register(r'payroll/periods', PayrollPeriodViewSet, basename='payroll-periods')
router.register(r'payroll/runs', PayrollRunViewSet, basename='payroll-runs')
router.register(r'payroll/payslips', PayslipViewSet, basename='payroll-payslips')
router.register(r'payroll/advances', SalaryAdvanceViewSet, basename='payroll-advances')
router.register(r'payroll/bonuses', BonusIncentiveViewSet, basename='payroll-bonuses')
router.register(r'payroll/deductions', CustomDeductionViewSet, basename='payroll-deductions')
router.register(r'payroll/settlements', SettlementRecordViewSet, basename='payroll-settlements')
router.register(r'crm/leads', LeadViewSet, basename='crm-leads')
router.register(r'crm/remarks', LeadStatusRemarkViewSet, basename='crm-remarks')
router.register(r'crm/customers', CustomerViewSet, basename='crm-customers')
router.register(r'crm/contacts', ContactPersonViewSet, basename='crm-contacts')
router.register(r'crm/opportunities', OpportunityViewSet, basename='crm-opportunities')
router.register(r'crm/opportunity-remarks', OpportunityRemarkViewSet, basename='crm-opportunity-remarks')
router.register(r'crm/activities', CRMActivityViewSet, basename='crm-activities')
router.register(r'crm/lead-channels', LeadChannelConfigViewSet, basename='crm-lead-channels')
router.register(r'crm/ingestion-logs', LeadIngestionLogViewSet, basename='crm-ingestion-logs')
router.register(r'crm/communications', ClientCommunicationViewSet, basename='crm-communications')
router.register(r'crm/targets', SalesTargetViewSet, basename='crm-targets')
router.register(r'crm/complaints', CustomerComplaintViewSet, basename='crm-complaints')
router.register(r'crm/feedback', CustomerFeedbackViewSet, basename='crm-feedback')
router.register(r'billing/products', ProductServiceViewSet, basename='billing-products')
router.register(r'billing/quotations', QuotationViewSet, basename='billing-quotations')
router.register(r'billing/invoices', InvoiceViewSet, basename='billing-invoices')
router.register(r'billing/payments', PaymentViewSet, basename='billing-payments')
router.register(r'billing/expenses', ExpenseViewSet, basename='billing-expenses')
router.register(r'billing/financial-years', FinancialYearSettingViewSet, basename='billing-financial-years')
router.register(r'billing/branches', BillingBranchViewSet, basename='billing-branches')
router.register(r'billing/tax-rates', TaxRateMasterViewSet, basename='billing-tax-rates')
router.register(r'billing/hsn', HSNMasterViewSet, basename='billing-hsn')
router.register(r'billing/sac', SACMasterViewSet, basename='billing-sac')
router.register(r'billing/suppliers', SupplierViewSet, basename='billing-suppliers')
router.register(r'billing/warehouses', WarehouseViewSet, basename='billing-warehouses')
router.register(r'billing/stock-ledger', StockLedgerViewSet, basename='billing-stock-ledger')
router.register(r'billing/stock-adjustments', StockAdjustmentViewSet, basename='billing-stock-adjustments')
router.register(r'billing/stock-transfers', StockTransferViewSet, basename='billing-stock-transfers')
router.register(r'billing/sales-orders', SalesOrderViewSet, basename='billing-sales-orders')
router.register(r'billing/credit-notes', CreditNoteViewSet, basename='billing-credit-notes')
router.register(r'billing/debit-notes', DebitNoteViewSet, basename='billing-debit-notes')
router.register(r'billing/recurring', RecurringInvoiceViewSet, basename='billing-recurring')
router.register(r'billing/purchase-orders', PurchaseOrderViewSet, basename='billing-purchase-orders')
router.register(r'billing/purchase-bills', PurchaseBillViewSet, basename='billing-purchase-bills')
router.register(r'billing/supplier-payments', SupplierPaymentViewSet, basename='billing-supplier-payments')
router.register(r'billing/accounts', AccountViewSet, basename='billing-accounts')
router.register(r'billing/journal-entries', JournalEntryViewSet, basename='billing-journal-entries')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-logs')
router.register(r'notifications', NotificationViewSet, basename='notifications')
router.register(r'announcements', AnnouncementViewSet, basename='announcements')

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Auth APIs
    path('api/v1/auth/login/', LoginView.as_view(), name='auth-login'),
    path('api/v1/auth/demo-switch/', DemoSwitchUserView.as_view(), name='auth-demo-switch'),
    path('api/v1/auth/me/', CurrentUserView.as_view(), name='auth-me'),
    path('api/v1/auth/permissions/', PermissionListView.as_view(), name='auth-permissions'),
    path('api/v1/auth/change-password/', ChangePasswordView.as_view(), name='auth-change-password'),
    path('api/v1/auth/security-overview/', SecurityOverviewView.as_view(), name='auth-security-overview'),
    path('api/v1/auth/terminate-sessions/', TerminateOtherSessionsView.as_view(), name='auth-terminate-sessions'),

    # Organization API
    path('api/v1/organization/', OrganizationDetailView.as_view(), name='organization-detail'),

    # Attendance & Check-In/Out APIs
    path('api/v1/hrms/attendance/check-in/', AttendanceCheckInView.as_view(), name='hrms-check-in'),
    path('api/v1/hrms/attendance/check-out/', AttendanceCheckOutView.as_view(), name='hrms-check-out'),
    path('api/v1/hrms/leave-balances/', LeaveBalanceView.as_view(), name='hrms-leave-balances'),
    path('api/v1/hrms/dashboard/', HRMSDashboardStatsView.as_view(), name='hrms-dashboard-stats'),

    # Payroll Process & Finalize
    path('api/v1/payroll/process/', ProcessPayrollView.as_view(), name='payroll-process'),
    path('api/v1/payroll/runs/<uuid:pk>/finalize/', FinalizePayrollView.as_view(), name='payroll-finalize'),
    path('api/v1/payroll/dashboard/', PayrollDashboardStatsView.as_view(), name='payroll-dashboard-stats'),

    # CRM Dashboard, Integrations & Performance
    path('api/v1/crm/dashboard/', CRMDashboardStatsView.as_view(), name='crm-dashboard-stats'),
    path('api/v1/crm/performance/', SalesPerformanceView.as_view(), name='crm-performance'),
    path('api/v1/crm/lead-channels/webhook/', InboundLeadWebhookView.as_view(), name='crm-inbound-webhook'),

    # Billing Dashboard & Advanced GST Views
    path('api/v1/billing/dashboard/', BillingDashboardStatsView.as_view(), name='billing-dashboard-stats'),
    path('api/v1/billing/company-profile/', CompanyProfileView.as_view(), name='billing-company-profile'),
    path('api/v1/billing/reports/', AccountingReportsView.as_view(), name='billing-reports'),
    path('api/v1/billing/gst-compliance/', GSTComplianceView.as_view(), name='billing-gst-compliance'),

    # Notifications Mark All Read
    path('api/v1/notifications/mark-all-read/', MarkAllNotificationsReadView.as_view(), name='notifications-mark-all-read'),

    # ViewSet Routers
    path('api/v1/', include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
