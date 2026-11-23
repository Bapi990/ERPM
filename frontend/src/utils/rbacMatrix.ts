/**
 * KALINGA ERP - Dynamic Role-Based Access Control (RBAC) System
 * Supports:
 * 1. Role-Level Permissions (Super Admin, Sub Admin, HR, Manager, Employee)
 * 2. Individual User-Specific Custom Overrides (Rohan Mehta, Ananya Sharma, etc.)
 * 3. Granular Action Permissions (View, Add, Edit, Delete) per module and submodule
 * 4. Real-time WebSocket broadcasting and instant UI reactivity
 */

export interface ActionPermissions {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
}

export interface SubmoduleItem {
  path: string;
  label: string;
  moduleGroup: string;
  moduleKey: string;
  defaultActions: ActionPermissions;
}

export interface RolePermissionConfig {
  role_code: string;
  role_name: string;
  description: string;
  badge_color: string;
  allowed_paths: string[];
  action_permissions: Record<string, ActionPermissions>; // key: moduleKey (or path) -> { view, add, edit, delete }
}

export interface SystemUserOption {
  id: string;
  name: string;
  email: string;
  role_code: string;
  role_name: string;
  department: string;
  phone?: string;
  status?: 'active' | 'inactive';
  created_at?: string;
}

export interface UserSpecificOverride {
  userId: string;
  userName: string;
  userEmail?: string;
  roleCode: string;
  enabled?: boolean;
  customPaths?: string[];
  actionOverrides: Record<string, Partial<ActionPermissions>>;
}

export const ROLE_CATEGORIES = [
  { code: 'all', label: 'All Roles (All Staff)' },
  { code: 'hr', label: 'HR Manager (Human Resources & Payroll)' },
  { code: 'manager', label: 'Team Manager (Projects & Approvals)' },
  { code: 'employee', label: 'Employee (General Staff)' },
  { code: 'sub_admin', label: 'Sub Admin (Branch Head / Operations)' },
  { code: 'super_admin', label: 'Super Admin (Full Enterprise Control)' },
  { code: 'sales', label: 'Sales Director (Commercial Lead)' },
  { code: 'accounts', label: 'Finance Controller (Accounts & Tax)' },
];

export const SYSTEM_USERS_ROSTER: SystemUserOption[] = [
  { id: 'ADM-1001', name: 'Super Admin', email: 'superadmin12@gmail.com', role_code: 'super_admin', role_name: 'Super Admin', department: 'Executive Board', phone: '+91 1234567890', status: 'active', created_at: '2026-01-10' },
  { id: 'HR-1001', name: 'Priya Sharma', email: 'hr@odiaserp.com', role_code: 'hr', role_name: 'HR Director', department: 'Human Resources & Talent', phone: '+91 98765 43211', status: 'active', created_at: '2026-02-01' },
  { id: 'MGR-1001', name: 'Rajesh Verma', email: 'manager@odiaserp.com', role_code: 'manager', role_name: 'Team Manager', department: 'Software Engineering & Cloud', phone: '+91 98765 43212', status: 'active', created_at: '2026-02-05' },
  { id: 'EMP-1001', name: 'Amit Patel', email: 'employee@odiaserp.com', role_code: 'employee', role_name: 'Associate Staff', department: 'Software Engineering & Cloud', phone: '+91 98765 43213', status: 'active', created_at: '2026-03-01' },
  { id: 'SLS-1001', name: 'Sneha Mohanty', email: 'sales@odiaserp.com', role_code: 'sales', role_name: 'Sales Director', department: 'Enterprise Sales & CRM', phone: '+91 98765 43214', status: 'active', created_at: '2026-03-10' },
  { id: 'FIN-1001', name: 'Sunil Sahoo', email: 'accounts@odiaserp.com', role_code: 'accounts', role_name: 'Finance Controller', department: 'Finance & Billing Accounts', phone: '+91 98765 43215', status: 'active', created_at: '2026-03-15' },
];

export const ALL_SYSTEM_SUBMODULES: SubmoduleItem[] = [
  // Workspace
  { path: '/app/workspace/profile', label: 'My Profile', moduleGroup: 'Workspace', moduleKey: 'workspace', defaultActions: { view: true, add: false, edit: true, delete: false } },
  { path: '/app/workspace/attendance', label: 'My Attendance', moduleGroup: 'Workspace', moduleKey: 'workspace', defaultActions: { view: true, add: true, edit: false, delete: false } },
  { path: '/app/workspace/leave', label: 'My Leave Requests', moduleGroup: 'Workspace', moduleKey: 'workspace', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/workspace/holidays', label: 'My Holiday Calendar', moduleGroup: 'Workspace', moduleKey: 'workspace', defaultActions: { view: true, add: false, edit: false, delete: false } },
  { path: '/app/workspace/payslips', label: 'My Payslips & Salary', moduleGroup: 'Workspace', moduleKey: 'workspace', defaultActions: { view: true, add: false, edit: false, delete: false } },
  { path: '/app/workspace/tasks', label: 'My Tasks & Assignments', moduleGroup: 'Workspace', moduleKey: 'workspace', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/workspace/documents', label: 'My Documents', moduleGroup: 'Workspace', moduleKey: 'workspace', defaultActions: { view: true, add: true, edit: false, delete: false } },
  { path: '/app/workspace/expenses', label: 'My Expenses & Claims', moduleGroup: 'Workspace', moduleKey: 'workspace', defaultActions: { view: true, add: true, edit: true, delete: false } },
  // HRMS
  { path: '/app/hrms/hr', label: 'HR Directory', moduleGroup: 'HRMS', moduleKey: 'hrms', defaultActions: { view: true, add: true, edit: true, delete: true } },
  { path: '/app/hrms/managers', label: 'Managers Directory', moduleGroup: 'HRMS', moduleKey: 'hrms', defaultActions: { view: true, add: true, edit: true, delete: true } },
  { path: '/app/hrms/employees', label: 'Employee Directory', moduleGroup: 'HRMS', moduleKey: 'hrms', defaultActions: { view: true, add: true, edit: true, delete: true } },
  { path: '/app/hrms/departments', label: 'Departments & Hierarchy', moduleGroup: 'HRMS', moduleKey: 'hrms', defaultActions: { view: true, add: true, edit: true, delete: true } },
  { path: '/app/hrms/designations', label: 'Designations & Roles', moduleGroup: 'HRMS', moduleKey: 'hrms', defaultActions: { view: true, add: true, edit: true, delete: true } },
  { path: '/app/hrms/hierarchy', label: 'Organization Hierarchy', moduleGroup: 'HRMS', moduleKey: 'hrms', defaultActions: { view: true, add: false, edit: true, delete: false } },
  { path: '/app/hrms/attendance', label: 'Live Attendance Register', moduleGroup: 'HRMS', moduleKey: 'hrms', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/hrms/leave', label: 'Leave Approval Queue', moduleGroup: 'HRMS', moduleKey: 'hrms', defaultActions: { view: true, add: false, edit: true, delete: false } },
  { path: '/app/hrms/holidays', label: 'Holiday & Off Rules', moduleGroup: 'HRMS', moduleKey: 'hrms', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/hrms/shifts', label: 'Shift & Roster Management', moduleGroup: 'HRMS', moduleKey: 'hrms', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/hrms/wfh', label: 'Work From Home Management', moduleGroup: 'HRMS', moduleKey: 'hrms', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/hrms/overtime', label: 'Overtime Management', moduleGroup: 'HRMS', moduleKey: 'hrms', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/hrms/recruitment', label: 'Recruitment & Hiring', moduleGroup: 'HRMS', moduleKey: 'hrms', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/hrms/interviews', label: 'Interview Management', moduleGroup: 'HRMS', moduleKey: 'hrms', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/hrms/onboarding', label: 'Employee Onboarding', moduleGroup: 'HRMS', moduleKey: 'hrms', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/hrms/offboarding', label: 'Employee Offboarding', moduleGroup: 'HRMS', moduleKey: 'hrms', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/hrms/kyc', label: 'Employee Documents & KYC', moduleGroup: 'HRMS', moduleKey: 'hrms', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/hrms/grievances', label: 'Employee Grievances', moduleGroup: 'HRMS', moduleKey: 'hrms', defaultActions: { view: true, add: true, edit: true, delete: false } },
  // Payroll
  { path: '/app/payroll/dashboard', label: 'Payroll Dashboard', moduleGroup: 'Payroll', moduleKey: 'payroll', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/payroll/ctc-master', label: 'Payroll & CTC Master', moduleGroup: 'Payroll', moduleKey: 'payroll', defaultActions: { view: true, add: true, edit: true, delete: true } },
  { path: '/app/payroll/structures', label: 'Salary Structures', moduleGroup: 'Payroll', moduleKey: 'payroll', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/payroll/processing', label: 'Monthly Payroll Processing', moduleGroup: 'Payroll', moduleKey: 'payroll', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/payroll/advances', label: 'Salary Advances & Loans', moduleGroup: 'Payroll', moduleKey: 'payroll', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/payroll/bonuses', label: 'Bonuses & Incentives', moduleGroup: 'Payroll', moduleKey: 'payroll', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/payroll/deductions', label: 'Deductions & Penalties', moduleGroup: 'Payroll', moduleKey: 'payroll', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/payroll/pf-management', label: 'PF / EPF Management', moduleGroup: 'Payroll', moduleKey: 'payroll', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/payroll/esi-management', label: 'ESI Management', moduleGroup: 'Payroll', moduleKey: 'payroll', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/payroll/pt-tax', label: 'Professional Tax', moduleGroup: 'Payroll', moduleKey: 'payroll', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/payroll/tds-form16', label: 'TDS & Form 16', moduleGroup: 'Payroll', moduleKey: 'payroll', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/payroll/payslips', label: 'Payslip Generation', moduleGroup: 'Payroll', moduleKey: 'payroll', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/payroll/settlement', label: 'Full & Final Settlement', moduleGroup: 'Payroll', moduleKey: 'payroll', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/payroll/reports', label: 'Payroll Reports', moduleGroup: 'Payroll', moduleKey: 'payroll', defaultActions: { view: true, add: false, edit: false, delete: false } },
  // CRM
  { path: '/app/crm/leads', label: 'Sales Leads', moduleGroup: 'CRM', moduleKey: 'crm', defaultActions: { view: true, add: true, edit: true, delete: true } },
  { path: '/app/crm/assignments', label: 'Lead Assignment', moduleGroup: 'CRM', moduleKey: 'crm', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/crm/pipeline', label: 'Pipeline Deals (Kanban)', moduleGroup: 'CRM', moduleKey: 'crm', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/crm/followups', label: 'Follow-up Management', moduleGroup: 'CRM', moduleKey: 'crm', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/crm/customers', label: 'Commercial Customers', moduleGroup: 'CRM', moduleKey: 'crm', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/crm/webhooks', label: 'Custom Webhooks', moduleGroup: 'CRM', moduleKey: 'crm', defaultActions: { view: true, add: true, edit: true, delete: true } },
  { path: '/app/crm/docs', label: 'CRM Documentation & Guide', moduleGroup: 'CRM', moduleKey: 'crm', defaultActions: { view: true, add: false, edit: false, delete: false } },
  // Billing
  { path: '/app/billing', label: 'Billing Dashboard', moduleGroup: 'Billing', moduleKey: 'billing', defaultActions: { view: true, add: false, edit: false, delete: false } },
  { path: '/app/billing/invoices', label: 'Tax Invoices & Receipts', moduleGroup: 'Billing', moduleKey: 'billing', defaultActions: { view: true, add: true, edit: true, delete: true } },
  { path: '/app/billing/quotations', label: 'Quotations & Estimates', moduleGroup: 'Billing', moduleKey: 'billing', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/billing/gst', label: 'GST Returns & Compliance', moduleGroup: 'Billing', moduleKey: 'billing', defaultActions: { view: true, add: true, edit: true, delete: false } },
  // Projects
  { path: '/app/projects/dashboard', label: 'Project Dashboard', moduleGroup: 'Projects', moduleKey: 'projects', defaultActions: { view: true, add: false, edit: false, delete: false } },
  { path: '/app/projects/all', label: 'All Projects', moduleGroup: 'Projects', moduleKey: 'projects', defaultActions: { view: true, add: true, edit: true, delete: true } },
  { path: '/app/projects/my', label: 'My Projects', moduleGroup: 'Projects', moduleKey: 'projects', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/projects/assignments', label: 'Project Assignments', moduleGroup: 'Projects', moduleKey: 'projects', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/projects/tasks', label: 'Task Management', moduleGroup: 'Projects', moduleKey: 'projects', defaultActions: { view: true, add: true, edit: true, delete: true } },
  { path: '/app/projects/kanban', label: 'Kanban Board', moduleGroup: 'Projects', moduleKey: 'projects', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/projects/dwr', label: 'Daily Work Reports', moduleGroup: 'Projects', moduleKey: 'projects', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/projects/timesheets', label: 'Timesheet Management', moduleGroup: 'Projects', moduleKey: 'projects', defaultActions: { view: true, add: true, edit: true, delete: false } },
  // Assets
  { path: '/app/assets/register', label: 'Asset Register', moduleGroup: 'Assets', moduleKey: 'assets', defaultActions: { view: true, add: true, edit: true, delete: true } },
  { path: '/app/assets/equipment', label: 'Company Equipment', moduleGroup: 'Assets', moduleKey: 'assets', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/assets/laptops', label: 'Laptop / Desktop Allocation', moduleGroup: 'Assets', moduleKey: 'assets', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/assets/history', label: 'Asset Assignment History', moduleGroup: 'Assets', moduleKey: 'assets', defaultActions: { view: true, add: false, edit: false, delete: false } },
  { path: '/app/inventory/stock', label: 'Stock Management', moduleGroup: 'Assets', moduleKey: 'assets', defaultActions: { view: true, add: true, edit: true, delete: false } },
  // Support
  { path: '/app/support/tickets', label: 'Internal Support Tickets', moduleGroup: 'Support', moduleKey: 'support', defaultActions: { view: true, add: true, edit: true, delete: true } },
  { path: '/app/support/my-tickets', label: 'My Support Tickets', moduleGroup: 'Support', moduleKey: 'support', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/support/assigned', label: 'Assigned Tickets', moduleGroup: 'Support', moduleKey: 'support', defaultActions: { view: true, add: false, edit: true, delete: false } },
  { path: '/app/support/it', label: 'IT Support', moduleGroup: 'Support', moduleKey: 'support', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/support/hr', label: 'HR Support', moduleGroup: 'Support', moduleKey: 'support', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/support/accounts', label: 'Accounts Support', moduleGroup: 'Support', moduleKey: 'support', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/support/categories', label: 'Ticket Categories & Priority', moduleGroup: 'Support', moduleKey: 'support', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/support/sla', label: 'Ticket SLA Management', moduleGroup: 'Support', moduleKey: 'support', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/support/kb', label: 'Knowledge Base / FAQs', moduleGroup: 'Support', moduleKey: 'support', defaultActions: { view: true, add: false, edit: false, delete: false } },
  // Performance
  { path: '/app/performance/analysis', label: 'Performance Analysis (9-D)', moduleGroup: 'Performance', moduleKey: 'performance', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/performance/okrs', label: 'Employee Goals / OKRs', moduleGroup: 'Performance', moduleKey: 'performance', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/performance/kpis', label: 'KPI Management', moduleGroup: 'Performance', moduleKey: 'performance', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/performance/reviews', label: 'Performance Reviews', moduleGroup: 'Performance', moduleKey: 'performance', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/performance/appraisals', label: 'Manager Appraisals', moduleGroup: 'Performance', moduleKey: 'performance', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/performance/self-appraisal', label: 'Employee Self Appraisal', moduleGroup: 'Performance', moduleKey: 'performance', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/learning/training', label: 'Training Programs', moduleGroup: 'Performance', moduleKey: 'performance', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/learning/courses', label: 'Courses & Learning', moduleGroup: 'Performance', moduleKey: 'performance', defaultActions: { view: true, add: false, edit: true, delete: false } },
  { path: '/app/learning/skills', label: 'Skill Assessment', moduleGroup: 'Performance', moduleKey: 'performance', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/learning/certificates', label: 'Certificates', moduleGroup: 'Performance', moduleKey: 'performance', defaultActions: { view: true, add: true, edit: true, delete: false } },
  // Compliance
  { path: '/app/compliance/company-docs', label: 'Company Documents', moduleGroup: 'Compliance', moduleKey: 'compliance', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/compliance/employee-docs', label: 'Employee Documents', moduleGroup: 'Compliance', moduleKey: 'compliance', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/compliance/templates', label: 'Document Templates', moduleGroup: 'Compliance', moduleKey: 'compliance', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/compliance/offer-letters', label: 'Offer Letters', moduleGroup: 'Compliance', moduleKey: 'compliance', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/compliance/appointment-letters', label: 'Appointment Letters', moduleGroup: 'Compliance', moduleKey: 'compliance', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/compliance/experience-letters', label: 'Experience Letters', moduleGroup: 'Compliance', moduleKey: 'compliance', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/compliance/policies', label: 'Company Policies', moduleGroup: 'Compliance', moduleKey: 'compliance', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/compliance/digital-approvals', label: 'Digital Approvals', moduleGroup: 'Compliance', moduleKey: 'compliance', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/compliance/calendar', label: 'Compliance Calendar', moduleGroup: 'Compliance', moduleKey: 'compliance', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/compliance/alerts', label: 'Document Expiry Alerts', moduleGroup: 'Compliance', moduleKey: 'compliance', defaultActions: { view: true, add: true, edit: true, delete: false } },
  // Admin
  { path: '/app/admin/website-inquiries', label: 'Website Inquiries / Leads', moduleGroup: 'Admin', moduleKey: 'admin', defaultActions: { view: true, add: true, edit: true, delete: true } },
  { path: '/app/admin/users', label: 'User Management', moduleGroup: 'Admin', moduleKey: 'admin', defaultActions: { view: true, add: true, edit: true, delete: true } },
  { path: '/app/admin/roles', label: 'Roles & RBAC Matrix', moduleGroup: 'Admin', moduleKey: 'admin', defaultActions: { view: true, add: true, edit: true, delete: true } },
  { path: '/app/admin/department-perms', label: 'Department Permissions', moduleGroup: 'Admin', moduleKey: 'admin', defaultActions: { view: true, add: true, edit: true, delete: true } },
  { path: '/app/admin/approval-workflows', label: 'Approval Workflow Settings', moduleGroup: 'Admin', moduleKey: 'admin', defaultActions: { view: true, add: true, edit: true, delete: true } },
  { path: '/app/admin/branches', label: 'Branch / Office Management', moduleGroup: 'Admin', moduleKey: 'admin', defaultActions: { view: true, add: true, edit: true, delete: true } },
  { path: '/app/admin/config', label: 'System Configuration', moduleGroup: 'Admin', moduleKey: 'admin', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/admin/notifications', label: 'Notification Settings', moduleGroup: 'Admin', moduleKey: 'admin', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/admin/email-sms', label: 'Email / SMS Configuration', moduleGroup: 'Admin', moduleKey: 'admin', defaultActions: { view: true, add: true, edit: true, delete: false } },
  { path: '/app/admin/integrations', label: 'Integrations & API Keys', moduleGroup: 'Admin', moduleKey: 'admin', defaultActions: { view: true, add: true, edit: true, delete: true } },
  { path: '/app/admin/audit-logs', label: 'Compliance Audit Logs', moduleGroup: 'Admin', moduleKey: 'admin', defaultActions: { view: true, add: false, edit: false, delete: false } },
  { path: '/app/admin/sessions', label: 'Login & Session History', moduleGroup: 'Admin', moduleKey: 'admin', defaultActions: { view: true, add: false, edit: false, delete: true } },
];

export const DEFAULT_RBAC_MATRIX: Record<string, RolePermissionConfig> = {
  super_admin: {
    role_code: 'super_admin',
    role_name: 'Super Admin / Corporate Owner',
    description: 'Full unconstrained system authority across all 12 modules, actions, and security configurations.',
    badge_color: 'bg-purple-100 text-purple-700 border-purple-200',
    allowed_paths: ['*'],
    action_permissions: {
      '*': { view: true, add: true, edit: true, delete: true }
    }
  },
  sub_admin: {
    role_code: 'sub_admin',
    role_name: 'Sub Admin / Branch Head',
    description: 'Elevated administrative management across operations, department users, and workflows.',
    badge_color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    allowed_paths: [
      '/app/workspace/company-details',
      '/app/workspace/branding',
      '/app/workspace/sessions',
      '/app/workspace/attendance',
      '/app/hrms/hr',
      '/app/hrms/managers',
      '/app/hrms/employees',
      '/app/hrms/lifecycle',
      '/app/hrms/departments',
      '/app/hrms/designations',
      '/app/hrms/hierarchy',
      '/app/hrms/attendance',
      '/app/hrms/attendance-corrections',
      '/app/hrms/leave',
      '/app/hrms/holidays',
      '/app/hrms/shifts',
      '/app/hrms/wfh',
      '/app/hrms/overtime',
      '/app/crm/leads',
      '/app/crm/pipeline',
      '/app/crm/customers',
      '/app/billing',
      '/app/billing/invoices',
      '/app/billing/quotations',
      '/app/projects/dashboard',
      '/app/projects/all',
      '/app/projects/assignments',
      '/app/projects/tasks',
      '/app/assets/register',
      '/app/assets/equipment',
      '/app/assets/laptops',
      '/app/assets/history',
      '/app/inventory/stock',
      '/app/support/tickets',
      '/app/support/assigned',
      '/app/support/it',
      '/app/support/hr',
      '/app/support/categories',
      '/app/support/sla',
      '/app/support/kb',
      '/app/performance/analysis',
      '/app/performance/okrs',
      '/app/performance/kpis',
      '/app/performance/reviews',
      '/app/compliance/company-docs',
      '/app/compliance/policies',
      '/app/admin/website-inquiries',
      '/app/admin/users',
      '/app/admin/audit-logs',
      '/app/admin/sessions',
    ],
    action_permissions: {
      assets: { view: true, add: true, edit: true, delete: false },
      support: { view: true, add: true, edit: true, delete: true },
      projects: { view: true, add: true, edit: true, delete: true },
      hrms: { view: true, add: true, edit: true, delete: false },
      compliance: { view: true, add: true, edit: true, delete: false },
      performance: { view: true, add: true, edit: true, delete: false },
    }
  },
  hr: {
    role_code: 'hr',
    role_name: 'HR Executive / Manager',
    description: 'Human resources management, employee lifecycle, onboarding, attendance, and payroll processing.',
    badge_color: 'bg-blue-100 text-blue-700 border-blue-200',
    allowed_paths: [
      '/app/workspace/profile',
      '/app/workspace/attendance',
      '/app/workspace/leave',
      '/app/workspace/holidays',
      '/app/workspace/payslips',
      '/app/workspace/documents',
      '/app/hrms/hr',
      '/app/hrms/managers',
      '/app/hrms/employees',
      '/app/hrms/lifecycle',
      '/app/hrms/departments',
      '/app/hrms/designations',
      '/app/hrms/hierarchy',
      '/app/hrms/attendance',
      '/app/hrms/attendance-corrections',
      '/app/hrms/leave',
      '/app/hrms/holidays',
      '/app/hrms/shifts',
      '/app/hrms/wfh',
      '/app/hrms/overtime',
      '/app/hrms/recruitment',
      '/app/hrms/interviews',
      '/app/hrms/onboarding',
      '/app/hrms/offboarding',
      '/app/hrms/kyc',
      '/app/hrms/grievances',
      '/app/payroll/dashboard',
      '/app/payroll/ctc-master',
      '/app/payroll/structures',
      '/app/payroll/processing',
      '/app/payroll/advances',
      '/app/payroll/bonuses',
      '/app/payroll/deductions',
      '/app/payroll/pf-management',
      '/app/payroll/esi-management',
      '/app/payroll/pt-tax',
      '/app/payroll/tds-form16',
      '/app/payroll/payslips',
      '/app/payroll/settlement',
      '/app/payroll/reports',
      '/app/support/tickets',
      '/app/support/my-tickets',
      '/app/support/hr',
      '/app/support/kb',
      '/app/performance/analysis',
      '/app/performance/okrs',
      '/app/performance/reviews',
      '/app/performance/appraisals',
      '/app/learning/training',
      '/app/learning/courses',
      '/app/learning/skills',
      '/app/learning/certificates',
      '/app/compliance/company-docs',
      '/app/compliance/employee-docs',
      '/app/compliance/templates',
      '/app/compliance/offer-letters',
      '/app/compliance/appointment-letters',
      '/app/compliance/experience-letters',
      '/app/compliance/policies',
      '/app/compliance/digital-approvals',
      '/app/compliance/calendar',
      '/app/compliance/alerts',
    ],
    action_permissions: {
      hrms: { view: true, add: true, edit: true, delete: true },
      payroll: { view: true, add: true, edit: true, delete: false },
      support: { view: true, add: true, edit: true, delete: false },
      compliance: { view: true, add: true, edit: true, delete: true },
      performance: { view: true, add: true, edit: true, delete: false },
    }
  },
  manager: {
    role_code: 'manager',
    role_name: 'Team Manager / Project Lead',
    description: 'Sprint planning, project assignment, subordinate attendance approval, and performance appraisals.',
    badge_color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    allowed_paths: [
      '/app/workspace/profile',
      '/app/workspace/attendance',
      '/app/workspace/leave',
      '/app/workspace/holidays',
      '/app/workspace/payslips',
      '/app/workspace/tasks',
      '/app/workspace/documents',
      '/app/hrms/managers',
      '/app/hrms/employees',
      '/app/hrms/attendance',
      '/app/hrms/attendance-corrections',
      '/app/hrms/leave',
      '/app/hrms/holidays',
      '/app/hrms/shifts',
      '/app/hrms/wfh',
      '/app/hrms/overtime',
      '/app/projects/dashboard',
      '/app/projects/all',
      '/app/projects/my',
      '/app/projects/assignments',
      '/app/projects/tasks',
      '/app/projects/checklists',
      '/app/projects/kanban',
      '/app/projects/timeline',
      '/app/projects/dwr',
      '/app/projects/timesheets',
      '/app/projects/milestones',
      '/app/projects/documents',
      '/app/projects/budget',
      '/app/projects/reports',
      '/app/support/tickets',
      '/app/support/my-tickets',
      '/app/support/assigned',
      '/app/support/kb',
      '/app/performance/analysis',
      '/app/performance/okrs',
      '/app/performance/kpis',
      '/app/performance/reviews',
      '/app/performance/appraisals',
      '/app/learning/skills',
      '/app/learning/certificates',
      '/app/compliance/policies',
      '/app/compliance/digital-approvals',
      '/app/compliance/calendar',
    ],
    action_permissions: {
      projects: { view: true, add: true, edit: true, delete: true },
      hrms: { view: true, add: false, edit: true, delete: false },
      support: { view: true, add: true, edit: true, delete: false },
      performance: { view: true, add: true, edit: true, delete: false },
      compliance: { view: true, add: false, edit: true, delete: false },
    }
  },
  employee: {
    role_code: 'employee',
    role_name: 'Employee (General Staff)',
    description: 'Personal self-service workspace, task timesheets, training courses, and verified certificates.',
    badge_color: 'bg-amber-100 text-amber-700 border-amber-200',
    allowed_paths: [
      '/app/workspace/profile',
      '/app/workspace/attendance',
      '/app/workspace/leave',
      '/app/workspace/holidays',
      '/app/workspace/payslips',
      '/app/workspace/tasks',
      '/app/workspace/documents',
      '/app/workspace/expenses',
      '/app/workspace/performance',
      '/app/hrms/employees',
      '/app/hrms/attendance',
      '/app/hrms/holidays',
      '/app/projects/my',
      '/app/projects/assignments',
      '/app/projects/tasks',
      '/app/projects/checklists',
      '/app/projects/kanban',
      '/app/projects/dwr',
      '/app/projects/timesheets',
      '/app/support/my-tickets',
      '/app/support/kb',
      '/app/performance/analysis',
      '/app/performance/okrs',
      '/app/performance/self-appraisal',
      '/app/learning/courses',
      '/app/learning/certificates',
      '/app/compliance/employee-docs',
      '/app/compliance/policies',
    ],
    action_permissions: {
      workspace: { view: true, add: true, edit: true, delete: false },
      hrms: { view: true, add: false, edit: false, delete: false },
      projects: { view: true, add: false, edit: true, delete: false },
      support: { view: true, add: true, edit: true, delete: false },
      performance: { view: true, add: false, edit: true, delete: false },
      compliance: { view: true, add: true, edit: false, delete: false },
      assets: { view: false, add: false, edit: false, delete: false },
      billing: { view: false, add: false, edit: false, delete: false },
      payroll: { view: false, add: false, edit: false, delete: false },
      admin: { view: false, add: false, edit: false, delete: false },
    }
  },
};

/**
 * Get active RBAC matrix for roles from localStorage
 */
export function getActiveRBACMatrix(): Record<string, RolePermissionConfig> {
  try {
    const raw = localStorage.getItem('kalinga_role_sidebar_permissions');
    if (raw) {
      const parsed = JSON.parse(raw);
      // Merge defaults with parsed overrides so new standard routes like /app/workspace/attendance are always included
      const merged: Record<string, RolePermissionConfig> = { ...DEFAULT_RBAC_MATRIX };
      for (const role of Object.keys(DEFAULT_RBAC_MATRIX)) {
        if (parsed[role]) {
          merged[role] = {
            ...DEFAULT_RBAC_MATRIX[role],
            ...parsed[role],
            allowed_paths: Array.from(new Set([
              ...(DEFAULT_RBAC_MATRIX[role]?.allowed_paths || []),
              ...(parsed[role]?.allowed_paths || [])
            ]))
          };
        }
      }
      return merged;
    }
  } catch (e) {
    console.warn('Could not read cached RBAC matrix', e);
  }
  return DEFAULT_RBAC_MATRIX;
}

/**
 * Save updated RBAC matrix for roles to localStorage
 */
export function saveActiveRBACMatrix(matrix: Record<string, RolePermissionConfig>) {
  localStorage.setItem('kalinga_role_sidebar_permissions', JSON.stringify(matrix));
  window.dispatchEvent(new CustomEvent('kalinga_rbac_updated', { detail: matrix }));
}

/**
 * Get system users list from localStorage (synced across User Management and Roles Page)
 */
export function getSystemUsers(): SystemUserOption[] {
  try {
    const raw = localStorage.getItem('kalinga_system_users');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const cleaned = parsed.filter((u: SystemUserOption) => !u.email?.includes('greenbacks.corp'));
        const existingEmails = new Set(cleaned.map((u: SystemUserOption) => u.email?.toLowerCase()));
        let changed = false;
        SYSTEM_USERS_ROSTER.forEach((defUser) => {
          if (!existingEmails.has(defUser.email?.toLowerCase())) {
            cleaned.push(defUser);
            changed = true;
          }
        });
        if (changed) {
          saveSystemUsers(cleaned);
        }
        return cleaned;
      }
    }
  } catch (e) {
    console.warn('Could not read cached system users', e);
  }
  // Initialize default roster into localStorage
  saveSystemUsers(SYSTEM_USERS_ROSTER);
  return SYSTEM_USERS_ROSTER;
}

/**
 * Save system users list to localStorage and broadcast real-time event
 */
export function saveSystemUsers(users: SystemUserOption[]) {
  try {
    localStorage.setItem('kalinga_system_users', JSON.stringify(users));
    window.dispatchEvent(new CustomEvent('kalinga_users_updated', { detail: users }));
  } catch (e) {
    console.warn('Could not save system users', e);
  }
}

/**
 * Add a new system user with auto-generated ID (e.g. HR-1004, EMP-1005, MGR-1004)
 */
export function addSystemUser(userData: Omit<SystemUserOption, 'id' | 'created_at'> & { id?: string; created_at?: string }): SystemUserOption {
  const current = getSystemUsers();
  
  const rolePrefixMap: Record<string, string> = {
    super_admin: 'ADM',
    sub_admin: 'SUB',
    hr: 'HR',
    manager: 'MGR',
    employee: 'EMP',
    sales: 'SLS',
    accounts: 'FIN',
  };
  const prefix = rolePrefixMap[userData.role_code] || 'USR';
  const count = current.filter(u => u.id.startsWith(prefix)).length + 1;
  const generatedId = userData.id && userData.id.trim() ? userData.id.trim() : `${prefix}-${(1000 + count)}`;

  const roleNameMap: Record<string, string> = {
    super_admin: 'Super Admin',
    sub_admin: 'Sub Admin / Branch Head',
    hr: 'HR Manager',
    manager: 'Team Manager',
    employee: 'Employee (Staff)',
    sales: 'Sales Director',
    accounts: 'Finance Controller',
  };

  const newUser: SystemUserOption = {
    ...userData,
    id: generatedId,
    role_name: userData.role_name || roleNameMap[userData.role_code] || 'Staff User',
    status: userData.status || 'active',
    created_at: userData.created_at || new Date().toISOString().split('T')[0],
  };

  const updated = [newUser, ...current];
  saveSystemUsers(updated);
  return newUser;
}

/**
 * Update an existing system user
 */
export function updateSystemUser(id: string, updates: Partial<SystemUserOption>): SystemUserOption | null {
  const current = getSystemUsers();
  const idx = current.findIndex(u => u.id === id);
  if (idx === -1) return null;

  const updatedUser = { ...current[idx], ...updates };
  current[idx] = updatedUser;
  saveSystemUsers([...current]);
  return updatedUser;
}

/**
 * Delete / remove a system user and cleanup overrides
 */
export function deleteSystemUser(id: string): boolean {
  const current = getSystemUsers();
  const filtered = current.filter(u => u.id !== id);
  saveSystemUsers(filtered);

  const overrides = getUserSpecificOverrides();
  if (overrides[id]) {
    delete overrides[id];
    saveUserSpecificOverrides(overrides);
  }
  return true;
}

/**
 * Get user-specific overrides from localStorage
 */
export function getUserSpecificOverrides(): Record<string, UserSpecificOverride> {
  try {
    const raw = localStorage.getItem('kalinga_user_specific_permissions');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Could not read user overrides', e);
  }
  return {};
}

/**
 * Save user-specific overrides to localStorage
 */
export function saveUserSpecificOverrides(overrides: Record<string, UserSpecificOverride>) {
  localStorage.setItem('kalinga_user_specific_permissions', JSON.stringify(overrides));
  window.dispatchEvent(new CustomEvent('kalinga_rbac_updated', { detail: overrides }));
}

/**
 * Check if a path is allowed for a specific user / role
 */
export function isPathAllowedForUser(user: any, path: string): boolean {
  if (!user) return false;
  const roleCode = user.role_code === 'hr_manager' ? 'hr' : (user.role_code || 'employee');
  if (roleCode === 'super_admin' || user.is_superuser) return true;

  // Personal self-service workspace attendance is always accessible for non-super-admin employees/HR/managers
  if (path === '/app/workspace/attendance' || path === '/app/workspace/my-attendance') {
    return true;
  }

  // 1. Check user-specific path overrides first
  const userOverrides = getUserSpecificOverrides();
  const userIdentifier = user.id || user.username || user.email;
  const userFullName = `${user.first_name || ''} ${user.last_name || ''}`.trim().toLowerCase();

  const userOverride = Object.values(userOverrides).find(
    o => o.enabled !== false && (
      (o.userId && o.userId === userIdentifier) ||
      (o.userEmail && (o.userEmail === user.email || o.userEmail === user.username)) ||
      (o.userName && userFullName && (o.userName.toLowerCase() === userFullName || userFullName.includes(o.userName.toLowerCase()) || o.userName.toLowerCase().includes(userFullName)))
    )
  );

  if (userOverride?.customPaths) {
    if (userOverride.customPaths.includes('*')) return true;
    return userOverride.customPaths.includes(path);
  }

  // 2. Fall back to role-level matrix
  const matrix = getActiveRBACMatrix();
  const roleCfg = matrix[roleCode];
  if (!roleCfg) return false;
  if (roleCfg.allowed_paths.includes('*')) return true;
  return roleCfg.allowed_paths.includes(path);
}

/**
 * Backwards compatible helper
 */
export function isPathAllowedForRole(roleCode: string, path: string): boolean {
  if (roleCode === 'super_admin') return true;
  const matrix = getActiveRBACMatrix();
  const roleCfg = matrix[roleCode];
  if (!roleCfg) return false;
  if (roleCfg.allowed_paths.includes('*')) return true;
  return roleCfg.allowed_paths.includes(path);
}

/**
 * Core Action Permission Checker (Add, Edit, Delete, View)
 * Evaluates individual user overrides first, then falls back to role config.
 */
export function canPerformAction(
  user: any,
  moduleKey: string, // e.g. 'assets', 'support', 'projects', 'compliance', 'performance', 'hrms', 'payroll', 'billing', 'crm', 'admin'
  action: 'view' | 'add' | 'edit' | 'delete',
  submodulePath?: string
): boolean {
  if (!user) return false;
  const roleCode = user.role_code === 'hr_manager' ? 'hr' : (user.role_code || 'employee');
  if (roleCode === 'super_admin' || user.is_superuser) return true;

  // 1. Check User-Specific Override
  const userOverrides = getUserSpecificOverrides();
  const userIdentifier = user.id || user.username || user.email;
  const userFullName = `${user.first_name || ''} ${user.last_name || ''}`.trim().toLowerCase();

  const userOverride = Object.values(userOverrides).find(
    o => o.enabled !== false && (
      (o.userId && o.userId === userIdentifier) ||
      (o.userEmail && (o.userEmail === user.email || o.userEmail === user.username)) ||
      (o.userName && userFullName && (o.userName.toLowerCase() === userFullName || userFullName.includes(o.userName.toLowerCase()) || o.userName.toLowerCase().includes(userFullName)))
    )
  );

  if (userOverride) {
    // Check path-specific override if path supplied
    if (submodulePath && userOverride.actionOverrides[submodulePath]?.[action] !== undefined) {
      return Boolean(userOverride.actionOverrides[submodulePath]?.[action]);
    }
    // Check moduleKey override
    if (userOverride.actionOverrides[moduleKey]?.[action] !== undefined) {
      return Boolean(userOverride.actionOverrides[moduleKey]?.[action]);
    }
  }

  // 2. Check Role-Level Action Permissions
  const matrix = getActiveRBACMatrix();
  const roleCfg = matrix[roleCode];
  if (!roleCfg) return false;

  // Wildcard permissions
  if (roleCfg.action_permissions?.['*']?.[action] !== undefined) {
    return Boolean(roleCfg.action_permissions['*'][action]);
  }

  // Path-specific role permission
  if (submodulePath && roleCfg.action_permissions?.[submodulePath]?.[action] !== undefined) {
    return Boolean(roleCfg.action_permissions[submodulePath][action]);
  }

  // Module-specific role permission
  if (roleCfg.action_permissions?.[moduleKey]?.[action] !== undefined) {
    return Boolean(roleCfg.action_permissions[moduleKey][action]);
  }

  // Default fallback based on role
  if (action === 'view') {
    return roleCfg.allowed_paths.includes('*') || (submodulePath ? roleCfg.allowed_paths.includes(submodulePath) : true);
  }
  if (action === 'delete') {
    return roleCode === 'super_admin' || roleCode === 'sub_admin';
  }
  if (action === 'add' || action === 'edit') {
    return roleCode !== 'employee';
  }

  return false;
}
