import React, { useState, useEffect, useMemo, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Home, LayoutDashboard, Users, CalendarCheck, CalendarDays,
  FileText, DollarSign, Target, Briefcase, ShoppingBag,
  Receipt, ShieldCheck, History, Bell, LogOut, ChevronDown,
  Menu, X, Sparkles, Building2, Search, ArrowRightLeft, Check, ArrowRight,
  Clock, User, Shield, CreditCard, ChevronRight, ChevronsLeft,
  FolderKanban, Laptop, LifeBuoy, Award, FileCheck, Layers,
  HelpCircle, Activity, CheckCircle2, ArrowUpCircle, Settings, Sliders, Hash, UserCheck, KeyRound,
  Play, AlertTriangle, FileSpreadsheet, Calculator, ExternalLink, Camera, Inbox, TrendingUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import { api } from '../../api/client';
import type { NotificationItem, RoleCode } from '../../types';
import { isPathAllowedForRole, isPathAllowedForUser } from '../../utils/rbacMatrix';
import { formatTime } from '../../utils/timeFormat';

interface NavItem {
  label: string;
  path: string;
  icon: any;
  perm?: string;
  badge?: string;
  hideForSuperAdmin?: boolean;
  onlyForSuperAdmin?: boolean;
  hideForManager?: boolean;
  hideForEmployee?: boolean;
  rolesAllowed?: string[];
}

interface NavGroup {
  id: string;
  title: string;
  icon: any;
  perm?: string;
  badge?: string;
  items: NavItem[];
}

export const AppShell: React.FC = () => {
  const { user, logout, demoSwitch, hasPermission } = useAuth();
  const { isConnected, latencyMs, emitEvent, subscribe } = useRealtime();
  const navigate = useNavigate();
  const location = useLocation();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [navSearch, setNavSearch] = useState('');
  const [rbacRevision, setRbacRevision] = useState(0);

  // Realtime Company Branding & Profile State
  const [companyProfile, setCompanyProfile] = useState<{
    company_name?: string;
    trade_name?: string;
    logo_url?: string;
    favicon_url?: string;
    company_photo_url?: string;
  } | null>(null);

  // Single active accordion group (opening one automatically collapses all others)
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);

  const toggleGroup = (groupId: string) => {
    setOpenGroupId((prev) => (prev === groupId ? null : groupId));
  };

  const applyFavicon = (url: string) => {
    if (!url) return;
    try {
      const links: NodeListOf<HTMLLinkElement> = document.querySelectorAll("link[rel*='icon']");
      if (links.length > 0) {
        links.forEach((l) => {
          l.href = url;
        });
      } else {
        const link = document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        link.href = url;
        document.getElementsByTagName('head')[0].appendChild(link);
      }
    } catch (e) {
      console.error('Failed to apply favicon', e);
    }
  };

  // Keyboard shortcut Ctrl+K / Cmd+K to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch company branding on mount & listen for realtime updates
  useEffect(() => {
    const loadCompanyProfile = async () => {
      try {
        const data = await api.getCompanyProfile();
        if (data) {
          setCompanyProfile(data);
          if (data.favicon_url) {
            applyFavicon(data.favicon_url);
          }
        }
      } catch (err) {
        console.warn('Could not load company branding:', err);
      }
    };

    loadCompanyProfile();

    // Subscribe to realtime branding and company profile updates
    const unsubBranding = subscribe('branding_updated', () => {
      loadCompanyProfile();
    });
    const unsubProfile = subscribe('company_profile_updated', () => {
      loadCompanyProfile();
    });

    const handleCustomBranding = () => {
      loadCompanyProfile();
    };
    window.addEventListener('odias_branding_updated', handleCustomBranding);

    return () => {
      unsubBranding();
      unsubProfile();
      window.removeEventListener('odias_branding_updated', handleCustomBranding);
    };
  }, [subscribe]);

  // Realtime RBAC Matrix Updates
  useEffect(() => {
    const unsub = subscribe('rbac_permissions_updated', () => {
      setRbacRevision((prev) => prev + 1);
    });
    const handleCustomRbac = () => {
      setRbacRevision((prev) => prev + 1);
    };
    window.addEventListener('kalinga_rbac_updated', handleCustomRbac);
    return () => {
      unsub();
      window.removeEventListener('kalinga_rbac_updated', handleCustomRbac);
    };
  }, [subscribe]);

  useEffect(() => {
    fetchNotifications();

    const handleRealtimeNotif = (e: any) => {
      const ev = e.detail;
      if (!ev) return;
      const newNotif: NotificationItem = {
        id: ev.id || `notif-${Date.now()}`,
        title: ev.title,
        message: ev.message,
        notification_type: ev.severity === 'alert' ? 'warning' : (ev.severity || 'info'),
        link: ev.link || '',
        is_read: false,
        created_at: new Date().toISOString(),
      };
      setNotifications((prev) => [newNotif, ...prev.filter(n => n.id !== newNotif.id)]);
      setUnreadCount((prev) => prev + 1);
    };

    window.addEventListener('odias_realtime_notification', handleRealtimeNotif);
    return () => {
      window.removeEventListener('odias_realtime_notification', handleRealtimeNotif);
    };
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications().catch(() => ({ results: [] }));
      const backendList = data.results || data || [];

      // Also get locally stored realtime notifications for this user
      let localList: NotificationItem[] = [];
      try {
        const userKey = `odias_user_notifications_${user?.email || 'default'}`;
        localList = JSON.parse(localStorage.getItem(userKey) || '[]');
      } catch (e) {}

      // Merge and deduplicate
      const combinedMap = new Map<string, NotificationItem>();
      [...localList, ...backendList].forEach((n) => {
        const key = n.id || `${n.title}_${n.created_at}`;
        if (!combinedMap.has(key)) {
          combinedMap.set(key, n);
        }
      });
      const list = Array.from(combinedMap.values());
      setNotifications(list);
      setUnreadCount(list.filter((n: NotificationItem) => !n.is_read).length);
    } catch (err) {
      console.warn('Could not load notifications');
    }
  };

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead().catch(() => {});
      try {
        const userKey = `odias_user_notifications_${user?.email || 'default'}`;
        const localList: NotificationItem[] = JSON.parse(localStorage.getItem(userKey) || '[]');
        localStorage.setItem(userKey, JSON.stringify(localList.map((n: any) => ({ ...n, is_read: true }))));
      } catch (e) {}
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn(err);
    }
  };

  const handleRoleSwitch = async (code: RoleCode) => {
    setRoleSwitcherOpen(false);
    await demoSwitch(code);
    emitEvent('role_switch', 'Workspace Role Switched', `Switched active role context to ${code.replace(/_/g, ' ')}`, 'info');
    navigate('/app/dashboard');
  };

  const demoRoles: { code: RoleCode; label: string; desc: string }[] = [
    { code: 'super_admin', label: 'Super Admin', desc: 'Full Enterprise Control' },
    { code: 'sub_admin', label: 'Sub Admin', desc: 'Operations Sub-Admin' },
    { code: 'hr_manager', label: 'HR Manager', desc: 'People Operations & HRMS' },
    { code: 'manager', label: 'Team Manager', desc: 'Department & Team Supervisor' },
    { code: 'sales', label: 'Sales Director', desc: 'CRM & Accounts' },
    { code: 'accounts', label: 'Finance Controller', desc: 'Invoicing & Ledgers' },
    { code: 'employee', label: 'Employee (Associate Staff)', desc: 'General Staff Self-Service' },
  ];

  // All 11 Navigation Groups in Title Case matching reference design
  const navigationGroups: NavGroup[] = [
    {
      id: 'workspace',
      title: 'My Workspace (Self Service)',
      icon: User,
      perm: 'workspace.view',
      items: [
        // Super Admin (Company Owner) Workspace Items
        { label: 'Company Details', path: '/app/workspace/company-details', icon: Building2, onlyForSuperAdmin: true },
        { label: 'Photo, Logo & Favicon', path: '/app/workspace/branding', icon: Sparkles, onlyForSuperAdmin: true, badge: 'Brand' },
        { label: 'Change Password', path: '/app/workspace/security', icon: KeyRound, onlyForSuperAdmin: true },
        { label: 'Last Login & Sessions', path: '/app/workspace/sessions', icon: ShieldCheck, onlyForSuperAdmin: true, badge: 'Live' },
        { label: 'Time & System Settings', path: '/app/workspace/settings', icon: Clock, onlyForSuperAdmin: true, badge: '12h/24h' },

        // HR, Managers & Employees (Self Service) Items (Matching reference photo exactly)
        { label: 'My Profile', path: '/app/workspace/profile', icon: User, hideForSuperAdmin: true },
        { label: 'My Attendance', path: '/app/workspace/attendance', icon: CalendarCheck, hideForSuperAdmin: true, badge: 'Selfie' },
        { label: 'My Leave Requests', path: '/app/workspace/leave', icon: FileText, hideForSuperAdmin: true },
        { label: 'My Holiday Calendar', path: '/app/workspace/holidays', icon: CalendarDays, hideForSuperAdmin: true },
        { label: 'My Payslips & Salary', path: '/app/workspace/payslips', icon: DollarSign, hideForSuperAdmin: true },
        { label: 'My Tasks & Assignments', path: '/app/workspace/tasks', icon: FolderKanban, hideForSuperAdmin: true },
        { label: 'My Documents', path: '/app/workspace/documents', icon: FileCheck, hideForSuperAdmin: true },
        { label: 'My Expenses & Reimbursements', path: '/app/workspace/expenses', icon: CreditCard, hideForSuperAdmin: true },
        { label: 'My Performance', path: '/app/workspace/performance', icon: Award, hideForSuperAdmin: true },
      ],
    },
    {
      id: 'hrms',
      title: 'Human Resources (HRMS)',
      icon: Users,
      perm: 'hrms.employees.view',
      items: [
        { label: 'HR Directory', path: '/app/hrms/hr', icon: Shield, onlyForSuperAdmin: true, badge: 'HR' },
        { label: 'Managers Directory', path: '/app/hrms/managers', icon: UserCheck, hideForManager: true, hideForEmployee: true, badge: 'Manager' },
        { label: 'Employee Directory', path: '/app/hrms/employees', icon: Users, badge: 'Staff' },
        { label: 'Department & Designation', path: '/app/hrms/departments', icon: Building2 },
        { label: 'Organization Hierarchy & Lifecycle Tree', path: '/app/hrms/hierarchy', icon: ArrowUpCircle, badge: 'Org Chart' },
        { label: 'Live Attendance Register', path: '/app/hrms/attendance', icon: Clock },
        { label: 'Leave Approval Queue', path: '/app/hrms/leave', icon: Check },
        { label: 'Holiday & Off Rules', path: '/app/hrms/holidays', icon: CalendarDays },
        { label: 'Shift & Roster Management', path: '/app/hrms/shifts', icon: Clock },
        { label: 'Work From Home Management', path: '/app/hrms/wfh', icon: Laptop },
        { label: 'Overtime Management', path: '/app/hrms/overtime', icon: Clock },
        { label: 'Recruitment & Hiring', path: '/app/hrms/recruitment', icon: Users },
        { label: 'Interview Management', path: '/app/hrms/interviews', icon: Users },
        { label: 'Employee Onboarding', path: '/app/hrms/onboarding', icon: Users },
        { label: 'Employee Offboarding', path: '/app/hrms/offboarding', icon: Users },
        { label: 'Employee Documents & KYC', path: '/app/hrms/kyc', icon: FileCheck },
        { label: 'Employee Grievances', path: '/app/hrms/grievances', icon: HelpCircle },
      ],
    },
    {
      id: 'payroll',
      title: 'Payroll & Compensation',
      icon: DollarSign,
      perm: 'payroll.salary.view',
      items: [
        { label: 'Payroll Dashboard', path: '/app/payroll/dashboard', icon: DollarSign },
        { label: 'Payroll & CTC Master', path: '/app/payroll/ctc-master', icon: DollarSign },
        { label: 'Salary Structures', path: '/app/payroll/structures', icon: Sliders },
        { label: 'Monthly Payroll Processing', path: '/app/payroll/processing', icon: Play },
        { label: 'Salary Advances & Loans', path: '/app/payroll/advances', icon: DollarSign },
        { label: 'Bonuses & Incentives', path: '/app/payroll/bonuses', icon: Award },
        { label: 'Deductions & Penalties', path: '/app/payroll/deductions', icon: AlertTriangle },
        { label: 'PF / EPF Management', path: '/app/payroll/pf-management', icon: Shield, badge: 'Statutory' },
        { label: 'ESI Management', path: '/app/payroll/esi-management', icon: Shield },
        { label: 'Professional Tax', path: '/app/payroll/pt-tax', icon: DollarSign },
        { label: 'TDS & Form 16', path: '/app/payroll/tds-form16', icon: FileText, badge: 'Tax' },
        { label: 'Payslip Generation', path: '/app/payroll/payslips', icon: FileText },
        { label: 'Full & Final Settlement', path: '/app/payroll/settlement', icon: DollarSign },
        { label: 'Payroll Reports', path: '/app/payroll/reports', icon: FileSpreadsheet },
      ],
    },
    {
      id: 'crm',
      title: 'CRM & Client Accounts',
      icon: Target,
      perm: 'crm.leads.view',
      items: [
        { label: 'Sales Leads', path: '/app/crm/leads', icon: Target },
        { label: 'Lead Assignment', path: '/app/crm/assignments', icon: UserCheck },
        { label: 'Pipeline Deals (Kanban)', path: '/app/crm/pipeline', icon: Briefcase },
        { label: 'Follow-up Management', path: '/app/crm/followups', icon: Clock },
        { label: 'Calls & Meeting History', path: '/app/crm/activities', icon: Activity },
        { label: 'Commercial Customers', path: '/app/crm/customers', icon: Building2 },
        { label: 'Contact Persons', path: '/app/crm/contacts', icon: User },
        { label: 'Client Communication', path: '/app/crm/communication', icon: Bell },
        { label: 'Sales Targets', path: '/app/crm/targets', icon: Award },
        { label: 'Sales Team Performance', path: '/app/crm/performance', icon: Activity },
        { label: 'Customer Complaints', path: '/app/crm/complaints', icon: HelpCircle },
        { label: 'Customer Feedback', path: '/app/crm/feedback', icon: Sparkles },
        { label: 'Config (API & Channels)', path: '/app/crm/config', icon: Sliders, badge: 'API' },
      ],
    },
    {
      id: 'billing',
      title: 'Billing & Finance',
      icon: Receipt,
      perm: 'billing.invoices.view',
      items: [
        { label: 'Billing Dashboard', path: '/app/billing', icon: LayoutDashboard },
        { label: 'Business & GST Settings', path: '/app/billing/settings', icon: Settings },
        { label: 'Contacts Management', path: '/app/billing/contacts', icon: Users },
        { label: 'Products & Services Master', path: '/app/billing/products', icon: Layers },
        { label: 'HSN / SAC Master', path: '/app/billing/hsn-sac', icon: Hash },
        { label: 'Quotations & Estimates', path: '/app/billing/quotations', icon: ShoppingBag },
        { label: 'Sales Orders', path: '/app/billing/orders', icon: ShoppingBag },
        { label: 'Tax Invoices & Receipts', path: '/app/billing/invoices', icon: Receipt },
        { label: 'Credit Notes / Debit Notes', path: '/app/billing/credit-notes', icon: FileText },
        { label: 'Purchase Management', path: '/app/billing/purchase-bills', icon: CreditCard },
        { label: 'Inventory & Stock', path: '/app/billing/inventory', icon: Layers },
        { label: 'GST Returns & Compliance', path: '/app/billing/gst', icon: Shield },
        { label: 'Double-Entry Accounting', path: '/app/billing/accounting', icon: Sliders },
        { label: 'Financial Reports & Analytics', path: '/app/billing/reports', icon: FileText },
        { label: 'Business Expenses', path: '/app/billing/expenses', icon: DollarSign },
      ],
    },
    {
      id: 'projects',
      title: 'Project & Task Management',
      icon: FolderKanban,
      perm: 'projects.view',
      items: [
        { label: 'Project Dashboard', path: '/app/projects/dashboard', icon: FolderKanban },
        { label: 'All Projects', path: '/app/projects/all', icon: FolderKanban },
        { label: 'My Projects', path: '/app/projects/my', icon: FolderKanban },
        { label: 'Project Assignments', path: '/app/projects/assignments', icon: Users },
        { label: 'Task Management', path: '/app/projects/tasks', icon: FolderKanban },
        { label: 'Subtasks & Checklists', path: '/app/projects/checklists', icon: CheckCircle2 },
        { label: 'Kanban Board', path: '/app/projects/kanban', icon: Briefcase },
        { label: 'Project Timeline', path: '/app/projects/timeline', icon: Clock },
        { label: 'Daily Work Reports', path: '/app/projects/dwr', icon: FileText },
        { label: 'Timesheet Management', path: '/app/projects/timesheets', icon: Clock },
        { label: 'Project Milestones', path: '/app/projects/milestones', icon: Award },
        { label: 'Project Documents', path: '/app/projects/documents', icon: FileCheck },
        { label: 'Project Budget & Cost', path: '/app/projects/budget', icon: DollarSign },
        { label: 'Project Progress Reports', path: '/app/projects/reports', icon: Sliders },
      ],
    },
    {
      id: 'assets',
      title: 'Inventory & Asset Management',
      icon: Laptop,
      perm: 'assets.view',
      items: [
        { label: 'Asset Register', path: '/app/assets/register', icon: Laptop },
        { label: 'Company Equipment', path: '/app/assets/equipment', icon: Laptop },
        { label: 'Laptop / Desktop Allocation', path: '/app/assets/laptops', icon: Laptop },
        { label: 'Asset Assignment History', path: '/app/assets/history', icon: History },
        { label: 'Asset Maintenance', path: '/app/assets/maintenance', icon: Settings },
        { label: 'Stock Management', path: '/app/inventory/stock', icon: Layers },
        { label: 'Product / Item Master', path: '/app/inventory/items', icon: Layers },
        { label: 'Purchase Requests', path: '/app/inventory/requests', icon: FileText },
        { label: 'Vendor Management', path: '/app/inventory/vendors', icon: Building2 },
        { label: 'Goods Received Notes (GRN)', path: '/app/inventory/grn', icon: FileCheck },
        { label: 'Stock Transfers', path: '/app/inventory/transfers', icon: ArrowRightLeft },
        { label: 'Stock Reports', path: '/app/inventory/reports', icon: Sliders },
      ],
    },
    {
      id: 'support',
      title: 'Support & Helpdesk',
      icon: LifeBuoy,
      items: [
        { label: 'Internal Support Tickets', path: '/app/support/tickets', icon: LifeBuoy },
        { label: 'My Support Tickets', path: '/app/support/my-tickets', icon: LifeBuoy },
        { label: 'Assigned Tickets', path: '/app/support/assigned', icon: LifeBuoy },
        { label: 'IT Support', path: '/app/support/it', icon: Laptop },
        { label: 'HR Support', path: '/app/support/hr', icon: Users },
        { label: 'Accounts Support', path: '/app/support/accounts', icon: DollarSign },
        { label: 'Ticket Categories & Priority', path: '/app/support/categories', icon: Sliders },
        { label: 'Ticket SLA Management', path: '/app/support/sla', icon: Clock },
        { label: 'Knowledge Base / FAQs', path: '/app/support/kb', icon: HelpCircle },
      ],
    },
    {
      id: 'performance',
      title: 'Learning & Performance',
      icon: Award,
      items: [
        { label: 'Performance Analysis (9-D)', path: '/app/performance/analysis', icon: TrendingUp },
        { label: 'Employee Goals / OKRs', path: '/app/performance/okrs', icon: Award },
        { label: 'KPI Management', path: '/app/performance/kpis', icon: Activity },
        { label: 'Performance Reviews', path: '/app/performance/reviews', icon: Award },
        { label: 'Manager Appraisals', path: '/app/performance/appraisals', icon: Award },
        { label: 'Employee Self Appraisal', path: '/app/performance/self-appraisal', icon: User },
        { label: 'Training Programs', path: '/app/learning/training', icon: Award },
        { label: 'Courses & Learning', path: '/app/learning/courses', icon: Award },
        { label: 'Skill Assessment', path: '/app/learning/skills', icon: Sliders },
        { label: 'Certificates', path: '/app/learning/certificates', icon: Award },
      ],
    },
    {
      id: 'compliance',
      title: 'Document & Compliance',
      icon: FileCheck,
      perm: 'compliance.view',
      items: [
        { label: 'Company Documents', path: '/app/compliance/company-docs', icon: FileCheck },
        { label: 'Employee Documents', path: '/app/compliance/employee-docs', icon: FileCheck },
        { label: 'Document Templates', path: '/app/compliance/templates', icon: FileText },
        { label: 'Offer Letters', path: '/app/compliance/offer-letters', icon: FileText },
        { label: 'Appointment Letters', path: '/app/compliance/appointment-letters', icon: FileText },
        { label: 'Experience Letters', path: '/app/compliance/experience-letters', icon: FileText },
        { label: 'Company Policies', path: '/app/compliance/policies', icon: Shield },
        { label: 'Digital Approvals', path: '/app/compliance/digital-approvals', icon: CheckCircle2 },
        { label: 'Compliance Calendar', path: '/app/compliance/calendar', icon: CalendarDays },
        { label: 'Document Expiry Alerts', path: '/app/compliance/alerts', icon: Bell },
      ],
    },
    {
      id: 'admin',
      title: 'Admin & Security',
      icon: ShieldCheck,
      perm: 'admin.users.manage',
      items: [
        { label: 'Website Inquiries', path: '/app/admin/website-inquiries', icon: Inbox, onlyForSuperAdmin: true },
        { label: 'User Management', path: '/app/admin/users', icon: Users },
        { label: 'Roles & RBAC Matrix', path: '/app/admin/roles', icon: ShieldCheck },
        { label: 'Department Permissions', path: '/app/admin/department-perms', icon: Sliders },
        { label: 'Approval Workflow Settings', path: '/app/admin/approval-workflows', icon: CheckCircle2 },
        { label: 'Branch / Office Management', path: '/app/admin/branches', icon: Building2 },
        { label: 'System Configuration', path: '/app/admin/config', icon: Settings },
        { label: 'Notification Settings', path: '/app/admin/notifications', icon: Bell },
        { label: 'Email / SMS Configuration', path: '/app/admin/email-sms', icon: Settings },
        { label: 'Integrations & API Keys', path: '/app/admin/integrations', icon: Layers },
        { label: 'Compliance Audit Logs', path: '/app/admin/audit-logs', icon: History },
        { label: 'Login & Session History', path: '/app/admin/sessions', icon: Clock },
      ],
    },
  ];

  // Prefix-to-group map for unambiguous group expansion
  const prefixToGroupId: Record<string, string> = {
    '/app/hrms': 'hrms',
    '/app/workspace': 'workspace',
    '/app/billing': 'billing',
    '/app/crm': 'crm',
    '/app/payroll': 'payroll',
    '/app/projects': 'projects',
    '/app/assets': 'assets',
    '/app/inventory': 'assets',
    '/app/support': 'support',
    '/app/performance': 'performance',
    '/app/compliance': 'compliance',
    '/app/admin': 'admin',
  };

  // Auto-expand group containing active route on route change
  useEffect(() => {
    const currentPath = location.pathname;
    if (currentPath === '/app/dashboard') {
      // Don't force open any sub-group on dashboard home
      return;
    }

    const matchedPrefix = Object.keys(prefixToGroupId).find((prefix) => currentPath.startsWith(prefix));
    if (matchedPrefix) {
      setOpenGroupId(prefixToGroupId[matchedPrefix]);
      return;
    }

    const matchGroup = navigationGroups.find((g) =>
      g.items.some(
        (item) => item.path === currentPath || (item.path !== '/app/dashboard' && currentPath.startsWith(item.path))
      )
    );
    if (matchGroup) {
      setOpenGroupId(matchGroup.id);
    }
  }, [location.pathname]);

  const isSuperAdmin = user?.role_code === 'super_admin' || (user as any)?.is_superuser;

  // Filter items if search is active or role doesn't have permission
  const filteredGroups = useMemo(() => {
    const roleKey = user?.role_code === 'hr_manager' ? 'hr' : (user?.role_code || 'employee');

    return navigationGroups.map((group) => {
      const matchingItems = group.items.filter((item) => {
        if (item.hideForSuperAdmin && isSuperAdmin) {
          return false;
        }
        if (item.onlyForSuperAdmin && !isSuperAdmin) {
          return false;
        }
        if (item.hideForManager && user?.role_code === 'manager') {
          return false;
        }
        if (item.hideForEmployee && user?.role_code === 'employee') {
          return false;
        }
        if (item.rolesAllowed && user?.role_code && !isSuperAdmin) {
          if (!item.rolesAllowed.includes(user.role_code)) {
            return false;
          }
        }
        // Dynamic RBAC Matrix Check (evaluates individual user overrides first, then role matrix)
        if (!isSuperAdmin && !isPathAllowedForUser(user, item.path)) {
          return false;
        }
        if (!navSearch.trim()) return true;
        return (
          item.label.toLowerCase().includes(navSearch.toLowerCase()) ||
          group.title.toLowerCase().includes(navSearch.toLowerCase())
        );
      });

      if (matchingItems.length === 0) return null;

      let groupTitle = group.title;
      if (group.id === 'workspace' && isSuperAdmin) {
        groupTitle = 'My Workspace (Company & Admin)';
      }

      return {
        ...group,
        title: groupTitle,
        items: matchingItems,
      };
    }).filter(Boolean) as NavGroup[];
  }, [navigationGroups, navSearch, user, isSuperAdmin, rbacRevision]);

  const isDashboardActive = location.pathname === '/app/dashboard';

  // Compute initials for user avatar
  const userInitials = useMemo(() => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user?.first_name) {
      return user.first_name.slice(0, 2).toUpperCase();
    }
    return 'SA';
  }, [user]);

  const userDisplayName = useMemo(() => {
    if (user?.first_name || user?.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    if (user?.username) return user.username;
    return 'Super Admin';
  }, [user]);

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#f8fafc] font-sans antialiased text-slate-900 select-none">
      {/* 1. LEFT SIDEBAR: Full Height (h-screen) with Gorgeous Deep Executive Slate Palette */}
      <aside
        className={`${
          sidebarOpen ? 'w-72 xl:w-80' : 'w-20'
        } hidden lg:flex flex-col h-screen overflow-hidden bg-[#0f172a] border-r border-slate-800/80 shrink-0 overscroll-contain transition-all duration-300 ease-in-out z-30 shadow-xl`}
      >
        {/* Brand Header at top (y: 0) */}
        {sidebarOpen ? (
          <div className="flex items-center justify-between px-5 h-16 border-b border-slate-800/80 shrink-0 bg-[#0f172a]">
            <div className="flex items-center space-x-3 min-w-0">
              {companyProfile?.logo_url ? (
                <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 p-1 shadow-sm shrink-0 flex items-center justify-center overflow-hidden">
                  <img
                    src={companyProfile.logo_url}
                    alt={companyProfile.trade_name || companyProfile.company_name || 'Brand Logo'}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-700 via-[#1877f2] to-blue-500 p-0.5 shadow-md shadow-blue-500/20 shrink-0 flex items-center justify-center">
                  <div className="w-full h-full rounded-[14px] bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-xl shadow-inner">
                    <svg className="w-6 h-6 fill-white drop-shadow-xs" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.93V18h-2v-1.07c-2.83-.48-5-2.94-5-5.93h2c0 2.21 1.79 4 4 4s4-1.79 4-4-1.79-4-4-4c-3.31 0-6 2.69-6 6H4c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z" />
                    </svg>
                  </div>
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-[17px] font-black text-white tracking-tight leading-none truncate">
                  {companyProfile?.trade_name || companyProfile?.company_name || 'Odias ERP'}
                </h2>
              </div>
            </div>

            {/* Collapse Button « */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-colors cursor-pointer shrink-0"
              title="Collapse Sidebar"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-16 border-b border-slate-800/80 shrink-0 bg-[#0f172a]">
            {companyProfile?.logo_url ? (
              <button
                onClick={() => setSidebarOpen(true)}
                className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 p-1 flex items-center justify-center shadow-sm hover:scale-105 transition-transform cursor-pointer overflow-hidden"
                title="Expand Sidebar"
              >
                <img src={companyProfile.logo_url} alt="Logo" className="w-full h-full object-contain" />
              </button>
            ) : (
              <button
                onClick={() => setSidebarOpen(true)}
                className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-700 via-[#1877f2] to-blue-500 text-white flex items-center justify-center font-bold text-sm shadow-md hover:scale-105 transition-transform cursor-pointer"
                title="Expand Sidebar"
              >
                O
              </button>
            )}
          </div>
        )}

        {/* Scrollable Nav List */}
        <div className="flex-1 h-full overflow-y-auto overscroll-contain py-3 px-3 space-y-1.5 sidebar-dark-scroll">
          {/* Top Dedicated Item: Executive Dashboard */}
          <NavLink
            to="/app/dashboard"
            className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-2xl font-bold text-[13.5px] transition-all duration-150 cursor-pointer ${
              isDashboardActive
                ? 'bg-[#1877f2] text-white shadow-lg shadow-blue-500/30'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
            title={!sidebarOpen ? 'Executive Dashboard' : undefined}
          >
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                isDashboardActive ? 'bg-white/20 text-white' : 'text-[#38bdf8] bg-slate-800'
              }`}
            >
              <Home className="w-4 h-4" />
            </div>
            {sidebarOpen && <span className="tracking-wide">Executive Dashboard</span>}
          </NavLink>

          {/* 11 Navigation Category Groups */}
          {filteredGroups.map((group) => {
            const isExpanded = !!navSearch.trim() || openGroupId === group.id;
            const GroupIcon = group.icon;

            return (
              <div key={group.id} className="space-y-1 pt-0.5">
                {sidebarOpen ? (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer ${
                      isExpanded
                        ? 'bg-slate-800/90 text-white font-bold border border-slate-700/60 shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <GroupIcon
                        className={`w-4.5 h-4.5 shrink-0 transition-colors ${
                          isExpanded ? 'text-[#38bdf8]' : 'text-slate-400 group-hover:text-slate-200'
                        }`}
                      />
                      <span className="truncate" title={group.title}>{group.title}</span>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0 ml-1">
                      <ChevronRight
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                          isExpanded ? 'rotate-90 text-[#38bdf8]' : ''
                        }`}
                      />
                    </div>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSidebarOpen(true);
                      setOpenGroupId(group.id);
                    }}
                    className="w-full flex items-center justify-center p-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                    title={group.title}
                  >
                    <GroupIcon className="w-5 h-5" />
                  </button>
                )}

                {/* Group Sub-Items List */}
                {isExpanded && sidebarOpen && (
                  <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-slate-800 ml-4.5 my-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;

                      return (
                        <NavLink
                          key={item.label}
                          to={item.path}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 group cursor-pointer ${
                            isActive
                              ? 'bg-[#1877f2] text-white shadow-md shadow-blue-500/25 font-bold'
                              : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center min-w-0">
                            <Icon
                              className={`w-3.5 h-3.5 shrink-0 mr-2.5 ${
                                isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                              }`}
                            />
                            <span className="truncate" title={item.label}>{item.label}</span>
                          </div>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* 2. RIGHT COLUMN: TOP HEADER (OVER CONTENT AREA ONLY) + SCROLLABLE MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Top Header Bar: ONLY over the main content area (Sidebar has NO header above it!) */}
        <header className="h-16 shrink-0 z-20 bg-white border-b border-slate-200/80 px-4 lg:px-6 flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-3 sm:space-x-4">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="hidden lg:flex p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Expand Sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Search Input Bar (Over main content) */}
            <div className="relative hidden md:block w-72 lg:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                placeholder="Search modules, pages... (Ctrl + K)"
                className="w-full pl-9 pr-8 py-2 rounded-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200/90 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1877f2]/20 focus:border-[#1877f2] transition-all"
              />
              {navSearch && (
                <button
                  onClick={() => setNavSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Right Header Status & Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Realtime Live Sync Status Pill */}
            <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-mono">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="text-slate-500 font-medium">Sync:</span>
              <span className="font-bold text-emerald-600">{latencyMs}ms</span>
            </div>

            {/* Quick Mark Attendance Action (Hidden for Super Admin / Company Owner) */}
            {user?.role_code !== 'super_admin' && (
              <NavLink
                to="/app/workspace/attendance"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/90 text-emerald-800 text-xs font-bold border border-emerald-200/90 transition-all shadow-2xs hover:shadow-xs cursor-pointer"
                title="Mark Attendance & View My Check-In Photo"
              >
                <Camera className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mark Attendance</span>
              </NavLink>
            )}

            {/* View Public Showcase Website */}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
              title="Open Odias ERP Showcase Website"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
              <span>Showcase Site</span>
            </a>

            {/* Instant Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setRoleSwitcherOpen(!roleSwitcherOpen);
                  setNotificationsOpen(false);
                }}
                className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-50/70 hover:bg-blue-100/80 border border-blue-200/80 text-[#1877f2] text-xs font-semibold transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#1877f2]" />
                <span>Role: <strong className="font-extrabold">{user?.role_name || 'Super Admin'}</strong></span>
                <ArrowRightLeft className="w-3 h-3 text-[#1877f2] ml-1" />
              </button>

              {roleSwitcherOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">Instant Demo Role Switcher</p>
                    <p className="text-[11px] text-slate-500">Evaluate dynamic RBAC & permission reshaping in real-time</p>
                  </div>
                  <div className="p-2 space-y-1">
                    {demoRoles.map((r) => (
                      <button
                        key={r.code}
                        onClick={() => handleRoleSwitch(r.code)}
                        className={`w-full flex items-start text-left px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                          user?.role_code === r.code
                            ? 'bg-blue-50 text-[#1877f2] border border-blue-200 font-bold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{r.label}</span>
                            {user?.role_code === r.code && <Check className="w-3.5 h-3.5 text-[#1877f2]" />}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{r.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notifications Button with Red Notification Count Badge */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setRoleSwitcherOpen(false);
                }}
                className="relative w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 ? (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-pulse shadow-xs">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                ) : (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-slate-300 rounded-full" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-88 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black text-slate-900 tracking-tight uppercase">Live Activity Center</span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[10px] font-bold border border-rose-200">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[11px] text-[#1877f2] hover:underline font-bold cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-5 text-center text-xs text-slate-400">
                        <Bell className="w-6 h-6 mx-auto mb-1 text-slate-300 stroke-1" />
                        No active notifications
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (n.link) {
                              navigate(n.link);
                              setNotificationsOpen(false);
                            }
                            setNotifications((prev) =>
                              prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item))
                            );
                            setUnreadCount((prev) => Math.max(0, prev - (n.is_read ? 0 : 1)));
                            try {
                              const userKey = `odias_user_notifications_${user?.email || 'default'}`;
                              const localList: NotificationItem[] = JSON.parse(localStorage.getItem(userKey) || '[]');
                              localStorage.setItem(userKey, JSON.stringify(localList.map((item) => item.id === n.id ? { ...item, is_read: true } : item)));
                            } catch (e) {}
                          }}
                          className={`p-3 text-xs transition-colors cursor-pointer hover:bg-blue-50/60 ${
                            n.is_read ? 'bg-white text-slate-600' : 'bg-blue-50/40 text-slate-900 border-l-3 border-[#1877f2]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-bold text-slate-900 leading-tight">{n.title}</p>
                            {!n.is_read && (
                              <span className="w-2 h-2 rounded-full bg-[#1877f2] shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-slate-500 text-[11px] mt-1 leading-snug">{n.message}</p>
                          <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100/60">
                            <span className="text-[10px] text-slate-400 font-mono">
                              {formatTime(n.created_at, { includeSeconds: true })}
                            </span>
                            {n.link && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-[#1877f2] font-black hover:underline">
                                <span>Open</span>
                                <ArrowRight className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Help Button */}
            <button
              onClick={() => navigate('/app/support/tickets')}
              className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
              title="Help & Support"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* User Profile Avatar & Name */}
            <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-200">
              <div className="w-9 h-9 rounded-full overflow-hidden bg-[#1877f2] text-white flex items-center justify-center text-xs font-extrabold shadow-sm shadow-blue-500/20 shrink-0">
                {isSuperAdmin && companyProfile?.company_photo_url ? (
                  <img
                    src={companyProfile.company_photo_url}
                    alt={userDisplayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  userInitials
                )}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 leading-tight">
                  {userDisplayName}
                </span>
                <span className="text-[11px] text-slate-400 leading-tight">
                  {user?.role_name || 'Super Admin'}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Slide-Out Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex">
            <div className="w-80 bg-[#0f172a] text-white h-full p-4 flex flex-col shadow-2xl overscroll-contain border-r border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-[#1877f2] text-white flex items-center justify-center font-bold">
                    O
                  </div>
                  <span className="font-bold text-sm text-white">Odias ERP</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-3 space-y-2 sidebar-dark-scroll">
                <NavLink
                  to="/app/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold text-xs ${
                    isDashboardActive ? 'bg-[#1877f2] text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  <span>Executive Dashboard</span>
                </NavLink>

                {filteredGroups.map((group) => {
                  const isExpanded = !!navSearch.trim() || openGroupId === group.id;
                  const GroupIcon = group.icon;

                  return (
                    <div key={group.id} className="space-y-1">
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                          isExpanded ? 'bg-slate-800 text-[#38bdf8]' : 'text-slate-300 hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <GroupIcon className="w-4 h-4" />
                          <span className="truncate" title={group.title}>{group.title}</span>
                        </div>
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-90 text-[#38bdf8]' : 'text-slate-500'}`} />
                      </button>

                      {isExpanded && (
                        <div className="pl-4 space-y-1 pt-0.5 border-l-2 border-slate-800 ml-3">
                          {group.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                              <NavLink
                                key={item.label}
                                to={item.path}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold ${
                                  isActive ? 'bg-[#1877f2] text-white font-bold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                                }`}
                              >
                                <div className="flex items-center">
                                  <Icon className="w-3.5 h-3.5 mr-2" />
                                  <span>{item.label}</span>
                                </div>
                              </NavLink>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area with INDEPENDENT SCROLLING (Light Soft Background) */}
        <main className="flex-1 h-full overflow-y-auto overscroll-contain bg-[#f8fafc] text-slate-900 p-4 md:p-6 lg:p-7 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};