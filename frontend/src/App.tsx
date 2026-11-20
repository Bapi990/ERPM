import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RealtimeProvider } from './context/RealtimeContext';
import { AppShell } from './components/layout/AppShell';
import { Login } from './pages/Login';
// @ts-ignore
import { Home as WebsiteHome } from './website/pages/Home';
import { Dashboard } from './pages/Dashboard';
import { EmployeesPage } from './pages/hrms/EmployeesPage';
import { DepartmentsPage } from './pages/hrms/DepartmentsPage';
import { DesignationsPage } from './pages/hrms/DesignationsPage';
import { AttendancePage } from './pages/hrms/AttendancePage';
import { LeavesPage } from './pages/hrms/LeavesPage';
import { HolidaysPage } from './pages/hrms/HolidaysPage';
import { HierarchyPage } from './pages/hrms/HierarchyPage';
import { LifecyclePage } from './pages/hrms/LifecyclePage';
import { ShiftsPage } from './pages/hrms/ShiftsPage';
import { WfhPage } from './pages/hrms/WfhPage';
import { OvertimePage } from './pages/hrms/OvertimePage';
import { RecruitmentPage } from './pages/hrms/RecruitmentPage';
import { InterviewsPage } from './pages/hrms/InterviewsPage';
import { OnboardingPage } from './pages/hrms/OnboardingPage';
import { OffboardingPage } from './pages/hrms/OffboardingPage';
import { KycDocumentsPage } from './pages/hrms/KycDocumentsPage';
import { GrievancesPage } from './pages/hrms/GrievancesPage';
import { PayrollPage } from './pages/payroll/PayrollPage';
import { LeadsPage } from './pages/crm/LeadsPage';
import { CRMConfigPage } from './pages/crm/CRMConfigPage';
import { LeadAssignmentPage } from './pages/crm/LeadAssignmentPage';
import { PipelinePage } from './pages/crm/PipelinePage';
import { CustomersPage } from './pages/crm/CustomersPage';
import { ContactPersonsPage } from './pages/crm/ContactPersonsPage';
import { FollowupsPage } from './pages/crm/FollowupsPage';
import { ActivitiesPage } from './pages/crm/ActivitiesPage';
import { ClientCommunicationPage } from './pages/crm/ClientCommunicationPage';
import { SalesTargetsPage } from './pages/crm/SalesTargetsPage';
import { SalesTeamPerformancePage } from './pages/crm/SalesTeamPerformancePage';
import { CustomerComplaintsPage } from './pages/crm/CustomerComplaintsPage';
import { CustomerFeedbackPage } from './pages/crm/CustomerFeedbackPage';
import { CustomWebhooksPage } from './pages/crm/CustomWebhooksPage';
import { CRMDocumentationPage } from './pages/crm/CRMDocumentationPage';
import { InvoicesPage } from './pages/billing/InvoicesPage';
import { QuotationsPage } from './pages/billing/QuotationsPage';
import { SalesOrdersPage } from './pages/billing/SalesOrdersPage';
import { CreditDebitNotesPage } from './pages/billing/CreditDebitNotesPage';
import { PurchaseBillsPage } from './pages/billing/PurchaseBillsPage';
import { InventoryStockPage } from './pages/billing/InventoryStockPage';
import { GSTCompliancePage } from './pages/billing/GSTCompliancePage';
import { AccountingPage } from './pages/billing/AccountingPage';
import { BillingReportsPage } from './pages/billing/BillingReportsPage';
import { BillingDashboardPage } from './pages/billing/BillingDashboardPage';
import { AdminWorkspacePage } from './pages/workspace/AdminWorkspacePage';
import { MyAttendancePage } from './pages/workspace/MyAttendancePage';
import { BillingSettingsPage } from './pages/billing/BillingSettingsPage';
import { BillingContactsPage } from './pages/billing/BillingContactsPage';
import { ProductsServicesPage } from './pages/billing/ProductsServicesPage';
import { HsnSacMasterPage } from './pages/billing/HsnSacMasterPage';
import { ExpensesPage } from './pages/billing/ExpensesPage';
import { RolesPage } from './pages/admin/RolesPage';
import { UsersPage } from './pages/admin/UsersPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';
import { WebsiteInquiriesPage } from './pages/admin/WebsiteInquiriesPage';
import { ProjectsPage } from './pages/projects/ProjectsPage';
import { AssetsPage } from './pages/assets/AssetsPage';
import { SupportPage } from './pages/support/SupportPage';
import { PerformancePage } from './pages/performance/PerformancePage';
import { CompliancePage } from './pages/compliance/CompliancePage';
import { ActivityPage } from './pages/overview/ActivityPage';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Odias ERP Caught Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Workspace Refresh Required</h2>
          <p className="text-sm text-slate-400 max-w-md mb-6">
            A hot-reload or component state update occurred. Click below to reload the workspace.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 hover:opacity-90 transition-all cursor-pointer"
          >
            Refresh Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-400">Loading Odias ERP Workspace...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <Routes>
            {/* 1. PUBLIC MARKETING WEBSITE FIRST (Per User Requirement) */}
            <Route path="/" element={<WebsiteHome />} />

            {/* 2. ERP SOFTWARE LOGIN (Login button on website routes here) */}
            <Route path="/login" element={<Login />} />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              {/* Overview */}
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="overview/activity" element={<ActivityPage />} />
              <Route path="overview/notifications" element={<ActivityPage />} />
              <Route path="overview/approvals" element={<ActivityPage />} />
              <Route path="overview/analytics" element={<Dashboard />} />

              {/* Workspace Self-Service & Admin Workspace */}
              <Route path="workspace/company" element={<AdminWorkspacePage />} />
              <Route path="workspace/company-details" element={<AdminWorkspacePage />} />
              <Route path="workspace/branding" element={<AdminWorkspacePage />} />
              <Route path="workspace/security" element={<AdminWorkspacePage />} />
              <Route path="workspace/sessions" element={<AdminWorkspacePage />} />
              <Route path="workspace/settings" element={<AdminWorkspacePage />} />
              <Route path="workspace/time-settings" element={<AdminWorkspacePage />} />
              <Route path="workspace/profile" element={<EmployeesPage mode="employee" />} />
              <Route path="workspace/attendance" element={<MyAttendancePage />} />
              <Route path="workspace/my-attendance" element={<MyAttendancePage />} />
              <Route path="workspace/attendance-history" element={<MyAttendancePage />} />
              <Route path="workspace/leave" element={<LeavesPage />} />
              <Route path="workspace/holidays" element={<HolidaysPage />} />
              <Route path="workspace/payslips" element={<PayrollPage />} />
              <Route path="workspace/tasks" element={<ProjectsPage />} />
              <Route path="workspace/documents" element={<CompliancePage />} />
              <Route path="workspace/expenses" element={<ExpensesPage />} />
              <Route path="workspace/performance" element={<PerformancePage />} />

              {/* Human Resources: Dedicated Distinct Sections for HR, Manager, and Employee */}
              <Route path="hrms/hr" element={<EmployeesPage mode="hr" />} />
              <Route path="hrms/managers" element={<EmployeesPage mode="manager" />} />
              <Route path="hrms/employees" element={<EmployeesPage mode="employee" />} />
              <Route path="hrms/lifecycle" element={<Navigate to="/app/hrms/hierarchy" replace />} />
              <Route path="hrms/departments" element={<DepartmentsPage />} />
              <Route path="hrms/designations" element={<DesignationsPage />} />
              <Route path="hrms/hierarchy" element={<HierarchyPage />} />
              <Route path="hrms/attendance" element={<AttendancePage />} />
              <Route path="hrms/attendance-corrections" element={<Navigate to="/app/hrms/attendance" replace />} />
              <Route path="hrms/leave" element={<LeavesPage />} />
              <Route path="hrms/holidays" element={<HolidaysPage />} />
              <Route path="hrms/shifts" element={<ShiftsPage />} />
              <Route path="hrms/wfh" element={<WfhPage />} />
              <Route path="hrms/overtime" element={<OvertimePage />} />
              <Route path="hrms/recruitment" element={<RecruitmentPage />} />
              <Route path="hrms/interviews" element={<InterviewsPage />} />
              <Route path="hrms/onboarding" element={<OnboardingPage />} />
              <Route path="hrms/offboarding" element={<OffboardingPage />} />
              <Route path="hrms/kyc" element={<KycDocumentsPage />} />
              <Route path="hrms/grievances" element={<GrievancesPage />} />

              {/* Payroll & Compensation (All 14 Modules) */}
              <Route path="payroll" element={<PayrollPage />} />
              <Route path="payroll/dashboard" element={<PayrollPage />} />
              <Route path="payroll/ctc-master" element={<PayrollPage />} />
              <Route path="payroll/structures" element={<PayrollPage />} />
              <Route path="payroll/processing" element={<PayrollPage />} />
              <Route path="payroll/advances" element={<PayrollPage />} />
              <Route path="payroll/bonuses" element={<PayrollPage />} />
              <Route path="payroll/deductions" element={<PayrollPage />} />
              <Route path="payroll/pf-management" element={<PayrollPage />} />
              <Route path="payroll/esi-management" element={<PayrollPage />} />
              <Route path="payroll/pf-esi" element={<PayrollPage />} />
              <Route path="payroll/pt-tax" element={<PayrollPage />} />
              <Route path="payroll/tds-form16" element={<PayrollPage />} />
              <Route path="payroll/taxes" element={<PayrollPage />} />
              <Route path="payroll/payslips" element={<PayrollPage />} />
              <Route path="payroll/settlement" element={<PayrollPage />} />
              <Route path="payroll/reports" element={<PayrollPage />} />

              {/* CRM */}
              <Route path="crm/leads" element={<LeadsPage />} />
              <Route path="crm/config" element={<CRMConfigPage />} />
              <Route path="crm/assignments" element={<LeadAssignmentPage />} />
              <Route path="crm/pipeline" element={<PipelinePage />} />
              <Route path="crm/customers" element={<CustomersPage />} />
              <Route path="crm/contacts" element={<ContactPersonsPage />} />
              <Route path="crm/followups" element={<FollowupsPage />} />
              <Route path="crm/activities" element={<ActivitiesPage />} />
              <Route path="crm/communication" element={<ClientCommunicationPage />} />
              <Route path="crm/targets" element={<SalesTargetsPage />} />
              <Route path="crm/performance" element={<SalesTeamPerformancePage />} />
              <Route path="crm/complaints" element={<CustomerComplaintsPage />} />
              <Route path="crm/feedback" element={<CustomerFeedbackPage />} />
              <Route path="crm/webhooks" element={<CustomWebhooksPage />} />
              <Route path="crm/docs" element={<CRMDocumentationPage />} />
              <Route path="crm/documentation" element={<CRMDocumentationPage />} />

              {/* Billing & GST Accounting */}
              <Route path="billing" element={<BillingDashboardPage />} />
              <Route path="billing/dashboard" element={<BillingDashboardPage />} />
              <Route path="billing/settings" element={<BillingSettingsPage />} />
              <Route path="billing/contacts" element={<BillingContactsPage />} />
              <Route path="billing/customers" element={<BillingContactsPage />} />
              <Route path="billing/suppliers" element={<BillingContactsPage />} />
              <Route path="billing/products" element={<ProductsServicesPage />} />
              <Route path="billing/hsn-sac" element={<HsnSacMasterPage />} />
              <Route path="billing/hsn" element={<HsnSacMasterPage />} />
              <Route path="billing/quotations" element={<QuotationsPage />} />
              <Route path="billing/orders" element={<SalesOrdersPage />} />
              <Route path="billing/invoices" element={<InvoicesPage />} />
              <Route path="billing/credit-notes" element={<CreditDebitNotesPage />} />
              <Route path="billing/purchase-bills" element={<PurchaseBillsPage />} />
              <Route path="billing/inventory" element={<InventoryStockPage />} />
              <Route path="billing/gst" element={<GSTCompliancePage />} />
              <Route path="billing/gst-reports" element={<GSTCompliancePage />} />
              <Route path="billing/reconciliation" element={<GSTCompliancePage />} />
              <Route path="billing/accounting" element={<AccountingPage />} />
              <Route path="billing/coa" element={<AccountingPage />} />
              <Route path="billing/journal" element={<AccountingPage />} />
              <Route path="billing/trial-balance" element={<AccountingPage />} />
              <Route path="billing/pnl" element={<AccountingPage />} />
              <Route path="billing/balance-sheet" element={<AccountingPage />} />
              <Route path="billing/cash-flow" element={<AccountingPage />} />
              <Route path="billing/banking" element={<AccountingPage />} />
              <Route path="billing/vouchers" element={<AccountingPage />} />
              <Route path="billing/reports" element={<BillingReportsPage />} />
              <Route path="billing/outstanding" element={<BillingReportsPage />} />
              <Route path="billing/vendor-outstanding" element={<BillingReportsPage />} />
              <Route path="billing/expenses" element={<ExpensesPage />} />
              <Route path="billing/recurring" element={<InvoicesPage />} />

              {/* Projects & Tasks (All 14 Modules) */}
              <Route path="projects" element={<Navigate to="all" replace />} />
              <Route path="projects/dashboard" element={<ProjectsPage />} />
              <Route path="projects/all" element={<ProjectsPage />} />
              <Route path="projects/my" element={<ProjectsPage />} />
              <Route path="projects/assignments" element={<ProjectsPage />} />
              <Route path="projects/tasks" element={<ProjectsPage />} />
              <Route path="projects/checklists" element={<ProjectsPage />} />
              <Route path="projects/kanban" element={<ProjectsPage />} />
              <Route path="projects/timeline" element={<ProjectsPage />} />
              <Route path="projects/dwr" element={<ProjectsPage />} />
              <Route path="projects/timesheets" element={<ProjectsPage />} />
              <Route path="projects/milestones" element={<ProjectsPage />} />
              <Route path="projects/documents" element={<ProjectsPage />} />
              <Route path="projects/budget" element={<ProjectsPage />} />
              <Route path="projects/reports" element={<ProjectsPage />} />

              {/* Inventory & Assets (All 12 Submodules) */}
              <Route path="assets" element={<Navigate to="register" replace />} />
              <Route path="assets/register" element={<AssetsPage />} />
              <Route path="assets/equipment" element={<AssetsPage />} />
              <Route path="assets/laptops" element={<AssetsPage />} />
              <Route path="assets/history" element={<AssetsPage />} />
              <Route path="assets/maintenance" element={<AssetsPage />} />
              <Route path="inventory" element={<Navigate to="stock" replace />} />
              <Route path="inventory/stock" element={<AssetsPage />} />
              <Route path="inventory/items" element={<AssetsPage />} />
              <Route path="inventory/requests" element={<AssetsPage />} />
              <Route path="inventory/vendors" element={<AssetsPage />} />
              <Route path="inventory/grn" element={<AssetsPage />} />
              <Route path="inventory/transfers" element={<AssetsPage />} />
              <Route path="inventory/reports" element={<AssetsPage />} />

              {/* Support & Helpdesk */}
              <Route path="support" element={<Navigate to="tickets" replace />} />
              <Route path="support/tickets" element={<SupportPage />} />
              <Route path="support/my-tickets" element={<SupportPage />} />
              <Route path="support/assigned" element={<SupportPage />} />
              <Route path="support/it" element={<SupportPage />} />
              <Route path="support/hr" element={<SupportPage />} />
              <Route path="support/accounts" element={<SupportPage />} />
              <Route path="support/categories" element={<SupportPage />} />
              <Route path="support/sla" element={<SupportPage />} />
              <Route path="support/kb" element={<SupportPage />} />

              {/* Learning & Performance */}
              <Route path="performance" element={<Navigate to="okrs" replace />} />
              <Route path="learning" element={<Navigate to="training" replace />} />
              <Route path="performance/analysis" element={<PerformancePage />} />
              <Route path="performance/okrs" element={<PerformancePage />} />
              <Route path="performance/kpis" element={<PerformancePage />} />
              <Route path="performance/reviews" element={<PerformancePage />} />
              <Route path="performance/appraisals" element={<PerformancePage />} />
              <Route path="performance/self-appraisal" element={<PerformancePage />} />
              <Route path="learning/training" element={<PerformancePage />} />
              <Route path="learning/courses" element={<PerformancePage />} />
              <Route path="learning/skills" element={<PerformancePage />} />
              <Route path="learning/certificates" element={<PerformancePage />} />

              {/* Document & Compliance */}
              <Route path="compliance/company-docs" element={<CompliancePage />} />
              <Route path="compliance/employee-docs" element={<CompliancePage />} />
              <Route path="compliance/templates" element={<CompliancePage />} />
              <Route path="compliance/offer-letters" element={<CompliancePage />} />
              <Route path="compliance/appointment-letters" element={<CompliancePage />} />
              <Route path="compliance/experience-letters" element={<CompliancePage />} />
              <Route path="compliance/policies" element={<CompliancePage />} />
              <Route path="compliance/digital-approvals" element={<CompliancePage />} />
              <Route path="compliance/calendar" element={<HolidaysPage />} />
              <Route path="compliance/alerts" element={<CompliancePage />} />

              {/* Admin & Security */}
              <Route path="admin/website-inquiries" element={<WebsiteInquiriesPage />} />
              <Route path="admin/users" element={<UsersPage />} />
              <Route path="admin/roles" element={<RolesPage />} />
              <Route path="admin/department-perms" element={<RolesPage />} />
              <Route path="admin/approval-workflows" element={<ActivityPage />} />
              <Route path="admin/branches" element={<DepartmentsPage />} />
              <Route path="admin/config" element={<RolesPage />} />
              <Route path="admin/notifications" element={<ActivityPage />} />
              <Route path="admin/email-sms" element={<RolesPage />} />
              <Route path="admin/integrations" element={<RolesPage />} />
              <Route path="admin/audit-logs" element={<AuditLogsPage />} />
              <Route path="admin/sessions" element={<AuditLogsPage />} />

              <Route index element={<Navigate to="dashboard" replace />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
      </RealtimeProvider>
    </AuthProvider>
  );
};

export default App;
