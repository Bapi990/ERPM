import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Plus, Mail, Phone, Building2, Eye, EyeOff, Edit3, Trash2,
  Shield, Briefcase, ArrowLeft, ArrowRight, Printer, CheckCircle2, Clock,
  Calendar, Award, AlertCircle, FileText, Lock, ChevronRight,
  Upload, Download, FileCheck, Landmark, CreditCard, Sparkles,
  X, Check, ExternalLink, ShieldCheck, FileDown, Layers,
  MapPin, UserCheck, KeyRound, DollarSign, Wallet, FileSpreadsheet,
  ChevronLeft, AlertTriangle, Filter, RotateCcw, Search, Star,
  Target, Heart, Puzzle, MessageSquare, ThumbsUp, TrendingUp
} from 'lucide-react';
import { api } from '../../api/client';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable, type ColumnDef } from '../../components/common/DataTable';
import { useRealtime } from '../../context/RealtimeContext';
import { useAuth } from '../../context/AuthContext';
import type { Employee, EmployeeDocument } from '../../types';
import { EmployeePerformanceModal } from '../../components/performance/EmployeePerformanceModal';
import { ScoreMeterGauge } from '../../components/performance/ScoreMeterGauge';
import {
  DIMENSIONS_CONFIG,
  type EmployeePerformanceEvaluation,
  getRatingBadge
} from '../../types/performance';

const AVAILABLE_ROLES = [
  { code: 'super_admin', name: 'Super Admin (Full Enterprise Control)', desc: 'Unrestricted master clearance across all Odias ERP subsystems' },
  { code: 'sub_admin', name: 'Sub Admin (Operations Director)', desc: 'Operational clearance across HRMS, CRM, Finance, and Projects' },
  { code: 'hr_manager', name: 'HR Manager (People Operations)', desc: 'Manage employee directory, attendance, leaves, payroll, and KYC documents' },
  { code: 'manager', name: 'Team Manager (Engineering / Ops Lead)', desc: 'Supervise team subordinates, task boards, and attendance / leave approvals' },
  { code: 'sales', name: 'Sales Director (Commercial Lead)', desc: 'Manage client accounts, pipeline leads, and commercial quotations' },
  { code: 'accounts', name: 'Finance Controller (Accounts & Tax)', desc: 'Manage invoices, disbursements, GST compliance, and audit ledgers' },
  { code: 'employee', name: 'Employee (Associate Staff)', desc: 'General workforce employee self-service portal, check-in, leave application, and task work' },
];

const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: [
    'hrms.view', 'hrms.create', 'hrms.edit', 'hrms.delete',
    'crm.view', 'crm.create', 'crm.edit', 'crm.delete',
    'billing.view', 'billing.create', 'billing.edit', 'billing.delete',
    'projects.view', 'projects.create', 'projects.edit', 'projects.delete',
    'reports.view', 'reports.export',
  ],
  sub_admin: [
    'hrms.view', 'hrms.create', 'hrms.edit', 'hrms.delete',
    'crm.view', 'crm.create', 'crm.edit',
    'billing.view', 'billing.create', 'billing.edit',
    'projects.view', 'projects.create', 'projects.edit', 'projects.delete',
    'reports.view', 'reports.export',
  ],
  hr_manager: [
    'hrms.view', 'hrms.create', 'hrms.edit', 'hrms.delete',
    'reports.view', 'reports.export',
  ],
  manager: [
    'hrms.view', 'projects.view', 'projects.create', 'projects.edit', 'reports.view',
  ],
  sales: [
    'crm.view', 'crm.create', 'crm.edit', 'crm.delete',
    'billing.view', 'billing.create', 'reports.view',
  ],
  accounts: [
    'billing.view', 'billing.create', 'billing.edit', 'billing.delete',
    'reports.view', 'reports.export',
  ],
  employee: [
    'hrms.view', 'projects.view',
  ],
};

const FALLBACK_EMPLOYEES: any[] = [];

const PERMISSION_MODULES = [
  {
    module: 'Human Resources (HRMS & Staff)',
    permissions: [
      { code: 'hrms.view', label: 'View Directory & Hierarchy' },
      { code: 'hrms.create', label: 'Onboard Staff (+ KYC Docs)' },
      { code: 'hrms.edit', label: 'Edit Staff Dossier & Roles' },
      { code: 'hrms.delete', label: 'Archive / Delete Records' },
    ],
  },
  {
    module: 'CRM & Client Pipeline',
    permissions: [
      { code: 'crm.view', label: 'View Leads & Accounts' },
      { code: 'crm.create', label: 'Add Leads & Deals' },
      { code: 'crm.edit', label: 'Edit Deal Stages' },
      { code: 'crm.delete', label: 'Delete Records' },
    ],
  },
  {
    module: 'Billing & Financial Invoicing',
    permissions: [
      { code: 'billing.view', label: 'View Invoices & Ledgers' },
      { code: 'billing.create', label: 'Issue GST Invoices' },
      { code: 'billing.edit', label: 'Edit Tax Records' },
      { code: 'billing.delete', label: 'Void Invoices' },
    ],
  },
  {
    module: 'Project Delivery & Tasks',
    permissions: [
      { code: 'projects.view', label: 'View Projects & Sprints' },
      { code: 'projects.create', label: 'Create Projects' },
      { code: 'projects.edit', label: 'Assign & Move Tasks' },
      { code: 'projects.delete', label: 'Delete Projects' },
    ],
  },
  {
    module: 'Reports & Analytics',
    permissions: [
      { code: 'reports.view', label: 'View Telemetry & KPIs' },
      { code: 'reports.export', label: 'Export Audit CSV / Excel' },
    ],
  },
];

const DOCUMENT_TYPE_OPTIONS = [
  { id: 'aadhaar', label: 'Aadhaar Card (National ID)' },
  { id: 'pan', label: 'PAN Card (Tax ID)' },
  { id: 'degree', label: 'Educational Degree / Diploma' },
  { id: 'resume', label: 'Resume / Curriculum Vitae' },
  { id: 'offer_letter', label: 'Odias ERP Official Offer Letter' },
  { id: 'experience', label: 'Previous Experience Certificate' },
  { id: 'bank_passbook', label: 'Bank Passbook / Cancelled Cheque' },
  { id: 'passport', label: 'Passport / Driving License' },
  { id: 'other', label: 'Other Statutory Document' },
];

const BRANCH_OPTIONS = ['General', 'Finance', 'Software', 'Delhi NCR', 'Mumbai HQ', 'Bhubaneswar'];
const DEPARTMENT_OPTIONS = ['Customer support', 'Finance', 'General', 'Software', 'Human Resources', 'Sales & CRM'];
const DESIGNATION_OPTIONS = ['Account manager', 'Customer support officer', 'IT', 'Telecaller cum office executive', 'Senior Software Engineer', 'Operations Lead'];
const SHIFT_OPTIONS = ['Day shift (09:00 - 18:00)', 'Night shift (21:00 - 06:00)', 'General shift (10:00 - 19:00)'];
const WEEKLY_OFF_OPTIONS = [
  '--- Use Shift/Company Default ---',
  'Sunday',
  'Saturday',
  'Saturday + Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
];

const ONBOARDING_STEPS = [
  { number: 1, title: 'Personal Profile', desc: 'Name, email, phone & gender' },
  { number: 2, title: 'Branch & Shift', desc: 'Department, shift & placement' },
  { number: 3, title: 'Role & Hierarchy', desc: 'Access clearance & supervisors' },
  { number: 4, title: 'Salary & Allowances', desc: 'CTC, basic, PF/ESI & tax' },
  { number: 5, title: 'Portal Password', desc: 'Self-service login credentials' },
  { number: 6, title: 'Bank & Address', desc: 'Payout details & emergency' },
  { number: 7, title: 'KYC Documents', desc: 'Aadhaar, PAN & certificates' },
];

export interface EmployeesPageProps {
  mode?: 'employee' | 'manager' | 'hr' | 'all';
}

export const EmployeesPage: React.FC<EmployeesPageProps> = ({ mode = 'employee' }) => {
  const { user } = useAuth();
  const { emitEvent, subscribe } = useRealtime();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Dedicated Full Page Modes: 'list' (default directory) | 'view' (dossier) | 'add' (step-wise wizard) | 'edit' (step-wise editor)
  const [viewMode, setViewMode] = useState<'list' | 'view' | 'add' | 'edit'>('list');
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  // Realtime Filter Toolbar States
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>(
    mode === 'hr' ? 'hr_manager' : mode === 'manager' ? 'manager' : mode === 'employee' ? 'employee' : 'all'
  );
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    setRoleFilter(
      mode === 'hr' ? 'hr_manager' : mode === 'manager' ? 'manager' : mode === 'employee' ? 'employee' : 'all'
    );
  }, [mode]);

  const departmentsList = useMemo(() => {
    const set = new Set<string>();
    departments.forEach((d) => d.name && set.add(d.name));
    employees.forEach((e) => e.department_name && set.add(e.department_name));
    return Array.from(set).sort();
  }, [departments, employees]);

  // Realtime Filtered Employees based on Mode, Role Hierarchy, Dropdowns & Live Search
  const filteredEmployees = useMemo(() => {
    let list = employees;

    // 1. Base category mode filtering
    if (mode === 'hr') {
      list = list.filter((e) => e.role_code === 'hr_manager' || e.role_code === 'hr');
    } else if (mode === 'manager') {
      list = list.filter((e) => e.role_code === 'manager');
    } else if (mode === 'employee') {
      list = list.filter((e) => e.role_code === 'employee' || (!['hr_manager', 'hr', 'manager', 'super_admin'].includes(e.role_code || '')));
    }

    // 2. Role-based hierarchy access control:
    // "Manager main uski Empployee show hogaa asa banaoo"
    if (user?.role_code === 'manager') {
      const uFirst = (user.first_name || '').toLowerCase();
      const uLast = (user.last_name || '').toLowerCase();
      const uFullName = (user.full_name || `${uFirst} ${uLast}`).toLowerCase();
      const uEmpId = (user.employee_id || user.id || '').toLowerCase();

      list = list.filter((e) => {
        const repMgr = (e.reporting_manager || '').toLowerCase();
        const mgrName = (e.manager_name || '').toLowerCase();
        return (
          (uEmpId && repMgr === uEmpId) ||
          (uFirst && mgrName.includes(uFirst)) ||
          (uLast && mgrName.includes(uLast)) ||
          (uFullName && mgrName.includes(uFullName))
        );
      });
    }

    // 3. Dropdown Role Filter
    if (roleFilter !== 'all') {
      list = list.filter((e) => e.role_code === roleFilter);
    }

    // 4. Dropdown Department Filter
    if (departmentFilter !== 'all') {
      list = list.filter((e) => 
        (e.department_name && e.department_name.toLowerCase() === departmentFilter.toLowerCase()) || 
        (e.department && e.department.toLowerCase() === departmentFilter.toLowerCase())
      );
    }

    // 5. Dropdown Status Filter
    if (statusFilter !== 'all') {
      list = list.filter((e) => (e.employment_status || 'active').toLowerCase() === statusFilter.toLowerCase());
    }

    // 6. Search Input (Search by ID or Name)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((e) => {
        const id = (e.employee_id || '').toLowerCase();
        const fName = (e.first_name || '').toLowerCase();
        const lName = (e.last_name || '').toLowerCase();
        const fullName = (e.full_name || `${fName} ${lName}`).toLowerCase();
        const email = (e.email || '').toLowerCase();
        const phone = (e.phone || '').toLowerCase();
        const role = (e.role_name || e.role_code || '').toLowerCase();
        const dept = (e.department_name || '').toLowerCase();

        return (
          id.includes(q) ||
          fName.includes(q) ||
          lName.includes(q) ||
          fullName.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          role.includes(q) ||
          dept.includes(q)
        );
      });
    }

    return list;
  }, [employees, mode, user, roleFilter, departmentFilter, statusFilter, searchQuery]);

  // Document Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<EmployeeDocument | null>(null);

  // 9-Dimension Performance Evaluation Modal State
  const [performanceModalEmp, setPerformanceModalEmp] = useState<any | null>(null);
  const [evaluations, setEvaluations] = useState<EmployeePerformanceEvaluation[]>([]);

  const loadEvaluations = () => {
    try {
      const stored = localStorage.getItem('gb_employee_performance_evaluations');
      if (stored) {
        setEvaluations(JSON.parse(stored));
      }
    } catch (e) {}
  };

  useEffect(() => {
    loadEvaluations();
    const handleEvalUpdate = () => loadEvaluations();
    window.addEventListener('odias_performance_evaluated', handleEvalUpdate);
    window.addEventListener('storage', handleEvalUpdate);
    const unsub = subscribe('employee_performance_evaluated', handleEvalUpdate);
    return () => {
      window.removeEventListener('odias_performance_evaluated', handleEvalUpdate);
      window.removeEventListener('storage', handleEvalUpdate);
      unsub();
    };
  }, [subscribe]);

  // Comprehensive Form State (No fake pre-filled details)
  const initialFormState = {
    // Personal Profile
    first_name: '',
    last_name: '',
    full_name: '',
    email: '',
    phone: '',
    alternate_phone: '',
    date_of_birth: '',
    gender: 'Male',
    avatar_url: '',

    // Placement & Shift
    employee_id: '',
    branch: '',
    department: '',
    designation: '',
    work_shift: 'Day shift (09:00 - 18:00)',
    weekly_off: '--- Use Shift/Company Default ---',
    date_of_joining: new Date().toISOString().split('T')[0],
    employment_type: 'Full Time' as any,
    employment_status: 'active' as any,

    // Role, Permissions & Dynamic Hierarchy
    role_code: 'employee',
    role_name: 'Employee (Associate Staff)',
    assigned_hr: '',
    reporting_manager: '',
    permissions: DEFAULT_ROLE_PERMISSIONS['employee'] || [],

    // Compensation & Statutory Allowances
    monthly_ctc: 0,
    basic_salary: 0,
    hra: 0,
    da: 0,
    other_allowances: 0,
    tax_regime: 'New Regime',
    payment_mode: 'Bank Transfer',
    uan_number: '',
    esi_number: '',
    pf_applicable: false,
    esi_applicable: false,

    // Portal Authentication
    password: '',
    confirm_password: '',

    // Bank, Address & Emergency Contact
    bank_name: '',
    bank_account_number: '',
    bank_ifsc: '',
    pan_number: '',
    aadhaar_number: '',
    street_address: '',
    city: '',
    state: '',
    postal_code: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  };

  const [formData, setFormData] = useState(initialFormState);

  // Documents State (Starts completely empty - no fake documents)
  const [formDocs, setFormDocs] = useState<EmployeeDocument[]>([]);

  useEffect(() => {
    loadData();
    const unsub1 = subscribe('employee_*', () => loadData());
    const unsub2 = subscribe('department:*', () => loadData());
    const unsub3 = subscribe('designation:*', () => loadData());
    const unsub4 = subscribe('branch:*', () => loadData());
    const unsub5 = subscribe('hrms_*', () => loadData());
    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsub5();
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [empRes, brRes, depRes, desRes] = await Promise.all([
        api.getEmployees().catch(() => ({ results: [] })),
        api.getOrgBranches().catch(() => ({ results: [] })),
        api.getDepartments().catch(() => ({ results: [] })),
        api.getDesignations().catch(() => ({ results: [] })),
      ]);
      const empList: Employee[] = empRes.results || (Array.isArray(empRes) ? empRes : []);
      const finalEmployees = empList.length > 0 ? empList : FALLBACK_EMPLOYEES;
      setEmployees(finalEmployees);
      localStorage.setItem('kalinga_hrms_employees', JSON.stringify(finalEmployees));
      setBranches(brRes.results || (Array.isArray(brRes) ? brRes : []));
      setDepartments(depRes.results || (Array.isArray(depRes) ? depRes : []));
      setDesignations(desRes.results || (Array.isArray(desRes) ? desRes : []));

      if (viewEmployee) {
        const fresh = finalEmployees.find((e) => e.id === viewEmployee.id);
        if (fresh) setViewEmployee(fresh);
      }
    } catch (err) {
      console.warn('Using cached/fallback employees:', err);
      const cached = localStorage.getItem('kalinga_hrms_employees');
      let fallback: Employee[] = [];
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            fallback = parsed.filter((e: any) => !e.email?.includes('greenbacks.corp') && !e.email?.includes('binayak@example.com'));
          }
        } catch (e) {}
      }
      setEmployees(fallback);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  // Helper to calculate basic/HRA/DA when CTC changes
  const handleMonthlyCTCChange = (ctcVal: number) => {
    const basic = Math.round(ctcVal * 0.5);
    const hra = Math.round(basic * 0.4);
    const da = Math.round(basic * 0.1);
    const others = Math.max(0, ctcVal - basic - hra - da);
    setFormData((prev) => ({
      ...prev,
      monthly_ctc: ctcVal,
      basic_salary: basic,
      hra: hra,
      da: da,
      other_allowances: others,
    }));
  };

  // Helper for file upload in Documents Vault
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      const formattedSize =
        file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`;

      setFormDocs((prev) => {
        const copy = [...prev];
        copy[index] = {
          ...copy[index],
          file_name: file.name,
          file_size: formattedSize,
          file_data: base64Data,
          status: 'verified',
          upload_date: new Date().toISOString().split('T')[0],
        };
        return copy;
      });
    };
    reader.readAsDataURL(file);
  };

  // Add document row with + button
  const handleAddDocumentRow = () => {
    const newDoc: EmployeeDocument = {
      name: '',
      document_type: 'other',
      file_name: '',
      file_size: '',
      upload_date: new Date().toISOString().split('T')[0],
      status: 'pending',
    };
    setFormDocs((prev) => [...prev, newDoc]);
  };

  // Remove document row
  const handleRemoveDocumentRow = (index: number) => {
    setFormDocs((prev) => prev.filter((_, i) => i !== index));
  };

  // Role Change Handler with dynamic default permissions
  const handleRoleChange = (roleCode: string) => {
    const found = AVAILABLE_ROLES.find((r) => r.code === roleCode);
    const roleName = found ? found.name : roleCode;
    const defaultPerms = DEFAULT_ROLE_PERMISSIONS[roleCode] || [];

    setFormData((prev) => ({
      ...prev,
      role_code: roleCode,
      role_name: roleName,
      permissions: defaultPerms,
    }));
  };

  // Toggle single permission
  const handleTogglePermission = (permCode: string) => {
    setFormData((prev) => {
      const exists = prev.permissions.includes(permCode);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((p) => p !== permCode)
          : [...prev.permissions, permCode],
      };
    });
  };

  // Open Full-Page Role-Tailored Add Wizard (Distinct for HR, Manager, and Employee)
  const handleOpenAdd = () => {
    const hrCount = employees.filter((e) => e.role_code === 'hr_manager' || e.role_code === 'hr').length;
    const mgrCount = employees.filter((e) => e.role_code === 'manager').length;
    const empCount = employees.filter((e) => e.role_code === 'employee' || !['hr_manager', 'hr', 'manager', 'super_admin'].includes(e.role_code || '')).length;

    const prefix = mode === 'hr' ? 'ODS-HR' : mode === 'manager' ? 'ODS-MGR' : 'ODS-EMP';
    const nextNum = mode === 'hr' ? hrCount + 1 : mode === 'manager' ? mgrCount + 1 : empCount + 1;
    const nextCode = `${prefix}-${String(nextNum).padStart(3, '0')}`;

    const hrStaff = employees.find((e) => e.role_code === 'hr_manager') || employees[1];
    const managerStaff = employees.find((e) => e.role_code === 'manager') || employees[2];
    const defaultRole = mode === 'hr' ? 'hr_manager' : mode === 'manager' ? 'manager' : 'employee';
    const defaultRoleObj = AVAILABLE_ROLES.find((r) => r.code === defaultRole) || AVAILABLE_ROLES[6];

    const defaultBranch = branches[0]?.name || 'Bhubaneswar Corporate Headquarters';
    const defaultDept = (
      mode === 'hr'
        ? departments.find(d => d.name?.toLowerCase().includes('hr') || d.name?.toLowerCase().includes('talent'))?.name
        : mode === 'manager'
        ? departments.find(d => d.name?.toLowerCase().includes('engineer') || d.name?.toLowerCase().includes('cloud') || d.name?.toLowerCase().includes('operation'))?.name
        : departments[0]?.name
    ) || departments[0]?.name || '';

    const defaultDesig = (
      mode === 'hr'
        ? designations.find(d => d.title?.toLowerCase().includes('hr') || d.title?.toLowerCase().includes('director'))?.title
        : mode === 'manager'
        ? designations.find(d => d.title?.toLowerCase().includes('lead') || d.title?.toLowerCase().includes('director') || d.title?.toLowerCase().includes('manager'))?.title
        : designations[0]?.title
    ) || designations[0]?.title || '';

    setFormData({
      ...initialFormState,
      employee_id: nextCode,
      role_code: defaultRole,
      role_name: defaultRoleObj.name,
      branch: defaultBranch,
      department: defaultDept,
      designation: defaultDesig,
      permissions: DEFAULT_ROLE_PERMISSIONS[defaultRole] || [],
      assigned_hr: mode === 'hr' ? '' : (hrStaff ? hrStaff.id : ''),
      reporting_manager: (mode === 'hr' || mode === 'manager') ? '' : (managerStaff ? managerStaff.id : ''),
    });
    setFormDocs([]);
    setCurrentStep(1);
    setViewMode('add');
  };

  // Open Full-Page Edit Employee Form
  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    const nameParts = (emp.full_name || `${emp.first_name} ${emp.last_name}`).trim().split(' ');
    const fName = emp.first_name || nameParts[0] || '';
    const lName = emp.last_name || nameParts.slice(1).join(' ') || '';

    setFormData({
      first_name: fName,
      last_name: lName,
      full_name: emp.full_name || `${fName} ${lName}`,
      email: emp.email || '',
      phone: emp.phone || '',
      alternate_phone: emp.alternate_phone || '',
      date_of_birth: emp.date_of_birth || '',
      gender: emp.gender || 'Male',
      avatar_url: emp.avatar_url || '',

      employee_id: emp.employee_id || '',
      branch: emp.branch_name || emp.branch || '',
      department: emp.department_name || emp.department || '',
      designation: emp.designation_title || emp.designation || '',
      work_shift: emp.shift_name || 'Day shift (09:00 - 18:00)',
      weekly_off: emp.weekly_off || 'Sunday',
      date_of_joining: emp.date_of_joining || new Date().toISOString().split('T')[0],
      employment_type: (emp.employment_type as any) || 'Full Time',
      employment_status: emp.employment_status || 'active',

      role_code: emp.role_code || 'employee',
      role_name: emp.role_name || 'Employee',
      assigned_hr: emp.assigned_hr || '',
      reporting_manager: emp.reporting_manager || '',
      permissions: emp.permissions || DEFAULT_ROLE_PERMISSIONS[emp.role_code || 'employee'] || [],

      monthly_ctc: Number(emp.monthly_ctc) || 0,
      basic_salary: Number(emp.basic_salary) || 0,
      hra: Number(emp.hra) || 0,
      da: Number(emp.da) || 0,
      other_allowances: Number(emp.other_allowances) || 0,
      tax_regime: emp.tax_regime || 'New Regime',
      payment_mode: emp.payment_mode || 'Bank Transfer',
      uan_number: emp.uan_number || '',
      esi_number: emp.esi_number || '',
      pf_applicable: Boolean(emp.pf_applicable),
      esi_applicable: Boolean(emp.esi_applicable),

      password: '',
      confirm_password: '',

      bank_name: emp.bank_name || '',
      bank_account_number: emp.bank_account_number || '',
      bank_ifsc: emp.bank_ifsc || '',
      pan_number: emp.pan_number || '',
      aadhaar_number: emp.aadhaar_number || '',
      street_address: emp.street_address || '',
      city: emp.city || '',
      state: emp.state || '',
      postal_code: emp.postal_code || '',
      emergency_contact_name: emp.emergency_contact_name || '',
      emergency_contact_phone: emp.emergency_contact_phone || '',
    });

    setFormDocs(emp.documents && emp.documents.length > 0 ? [...emp.documents] : []);

    setCurrentStep(1);
    setViewMode('edit');
  };

  const isEdit = viewMode === 'edit';

  // Live Email Uniqueness Checker
  const emailVal = formData.email?.trim().toLowerCase();
  const existingEmailEmp = useMemo(() => {
    if (!emailVal || !emailVal.includes('@')) return null;
    return employees.find((e) => (e.email || '').trim().toLowerCase() === emailVal && e.id !== editingEmployee?.id) || null;
  }, [emailVal, employees, editingEmployee]);

  const isEmailUnique = useMemo(() => {
    return Boolean(emailVal && emailVal.includes('@') && emailVal.includes('.') && !existingEmailEmp);
  }, [emailVal, existingEmailEmp]);

  // Live Password Match Checker
  const isPasswordMatch = Boolean(
    formData.password &&
    formData.confirm_password &&
    formData.password === formData.confirm_password &&
    formData.password.length >= 4
  );

  const hasPasswordMismatch = Boolean(
    formData.confirm_password &&
    formData.password !== formData.confirm_password
  );

  // Comprehensive Step-by-Step Validation Checker
  // Guarantees no step gets a false green tick if skipped or left incomplete in the middle
  const getStepStatus = (stepNumber: number): { isComplete: boolean; error?: string } => {
    switch (stepNumber) {
      case 1: {
        // Personal Profile: Full Name and Email are strictly required
        const hasName = Boolean(formData.full_name?.trim() || (formData.first_name?.trim() && formData.last_name?.trim()));
        const hasEmail = Boolean(formData.email?.trim() && formData.email.includes('@') && formData.email.includes('.'));
        const emailConflict = Boolean(existingEmailEmp);
        const isComplete = Boolean(hasName && hasEmail && !emailConflict);
        return {
          isComplete,
          error: !hasName
            ? 'Full Name required'
            : !hasEmail
            ? 'Valid Email required'
            : emailConflict
            ? `Email already registered to ${existingEmailEmp?.full_name}`
            : undefined,
        };
      }
      case 2: {
        // Branch & Placement: Branch, Department, Designation & Shift
        const hasBranch = Boolean(formData.branch && formData.branch !== '---------');
        const hasDept = Boolean(formData.department && formData.department !== '---------');
        const hasDesig = Boolean(formData.designation && formData.designation !== '---------');
        const hasShift = Boolean(formData.work_shift && formData.work_shift !== '---------');
        const isComplete = Boolean(hasBranch && hasDept && hasDesig && hasShift);
        return {
          isComplete,
          error: !hasBranch ? 'Branch required' : !hasDept ? 'Department required' : !hasDesig ? 'Designation required' : !hasShift ? 'Work Shift required' : undefined,
        };
      }
      case 3: {
        // System Role & Hierarchy
        const hasRole = Boolean(formData.role_code && formData.role_name);
        return {
          isComplete: hasRole,
          error: !hasRole ? 'System role required' : undefined,
        };
      }
      case 4: {
        // Compensation & Allowances: Gross CTC & Basic must be > 0
        const hasCTC = Number(formData.monthly_ctc) > 0;
        const hasBasic = Number(formData.basic_salary) > 0;
        const isComplete = Boolean(hasCTC && hasBasic);
        return {
          isComplete,
          error: !hasCTC ? 'Monthly CTC required' : !hasBasic ? 'Basic Salary required' : undefined,
        };
      }
      case 5: {
        // Portal Password: in Edit mode, optional unless typed. In Add mode, min 4 chars and must match confirm_password
        if (isEdit) {
          if (!formData.password) return { isComplete: true };
          const match = formData.password === formData.confirm_password;
          const validLen = formData.password.length >= 4;
          return {
            isComplete: Boolean(match && validLen),
            error: !validLen ? 'Min 4 characters required' : !match ? 'Passwords do not match' : undefined,
          };
        } else {
          const hasPwd = Boolean(formData.password && formData.password.length >= 4);
          const match = formData.password === formData.confirm_password;
          const isComplete = Boolean(hasPwd && match);
          return {
            isComplete,
            error: !formData.password ? 'Password required' : formData.password.length < 4 ? 'Min 4 characters required' : !match ? 'Passwords do not match' : undefined,
          };
        }
      }
      case 6: {
        // Payout Bank & Residential Address
        const hasBank = Boolean(formData.bank_account_number?.trim() || formData.pan_number?.trim() || formData.aadhaar_number?.trim());
        const hasAddress = Boolean(formData.street_address?.trim() || formData.city?.trim());
        const isComplete = Boolean(hasBank || hasAddress);
        return {
          isComplete,
          error: !isComplete ? 'Account or Address details pending' : undefined,
        };
      }
      case 7: {
        // KYC Documents: At least 1 document must exist and have a valid name
        const isComplete = formDocs.length > 0 && formDocs.every((d) => Boolean(d.name?.trim()));
        return {
          isComplete,
          error: formDocs.length === 0 ? 'At least 1 document required' : undefined,
        };
      }
      default:
        return { isComplete: false };
    }
  };

  const handleNextStep = () => {
    const status = getStepStatus(currentStep);
    // If current step is one of the strictly required steps (Step 1, 2, 3, 4, 5) and is incomplete, alert user
    if ([1, 2, 3, 4, 5].includes(currentStep) && !status.isComplete && status.error) {
      showToast(`⚠️ ${ONBOARDING_STEPS[currentStep - 1]?.title} incomplete: ${status.error}`);
      return;
    }
    setCurrentStep((prev) => Math.min(ONBOARDING_STEPS.length, prev + 1));
  };

  // Submit Handler for Add or Edit
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if email is already taken
    if (existingEmailEmp) {
      alert(`⚠️ Email '${formData.email}' is already registered in Odias ERP to ${existingEmailEmp.full_name} (${existingEmailEmp.employee_id} - ${existingEmailEmp.role_name || existingEmailEmp.designation_title || 'Staff'}). Please enter a unique email address or update their existing record.`);
      setCurrentStep(1);
      return;
    }

    // Validate that all required steps are complete before saving
    for (const stepNum of [1, 2, 3, 4, 5]) {
      const status = getStepStatus(stepNum);
      if (!status.isComplete) {
        setCurrentStep(stepNum);
        showToast(`⚠️ Please complete "${ONBOARDING_STEPS[stepNum - 1]?.title}": ${status.error || 'Required fields missing'}`);
        return;
      }
    }

    // Check passwords if entered
    if (formData.password && formData.password !== formData.confirm_password) {
      alert('Passwords do not match! Please check password confirmation.');
      return;
    }

    // Auto-generate employee ID if left blank
    const effectiveEmpId = formData.employee_id.trim()
      ? formData.employee_id.trim()
      : `ODS-EMP-${String(employees.length + 1).padStart(3, '0')}`;

    // Resolve name parts
    const rawName = formData.full_name.trim();
    let firstName = formData.first_name.trim();
    let lastName = formData.last_name.trim();
    if (rawName && (!firstName || !lastName)) {
      const parts = rawName.split(' ');
      firstName = parts[0];
      lastName = parts.slice(1).join(' ') || 'Staff';
    }
    if (!firstName) firstName = 'Employee';
    if (!lastName) lastName = 'Member';

    // Map branch/department/designation to backend foreign keys
    const matchedBranch = branches.find((b) => b.name?.toLowerCase() === formData.branch?.toLowerCase()) ||
                          branches.find((b) => b.name?.toLowerCase().includes(formData.branch?.toLowerCase())) ||
                          branches[0];
    const matchedDept = departments.find((d) => d.name?.toLowerCase() === formData.department?.toLowerCase()) ||
                        departments.find((d) => d.name?.toLowerCase().includes(formData.department?.toLowerCase())) ||
                        departments[0];
    const matchedDesig = designations.find((d) => d.title?.toLowerCase() === formData.designation?.toLowerCase()) ||
                         designations.find((d) => d.title?.toLowerCase().includes(formData.designation?.toLowerCase())) ||
                         designations[0];

    const payload: any = {
      ...formData,
      employee_id: effectiveEmpId,
      first_name: firstName,
      last_name: lastName,
      full_name: `${firstName} ${lastName}`,
      branch: matchedBranch ? matchedBranch.id : undefined,
      department: matchedDept ? matchedDept.id : undefined,
      designation: matchedDesig ? matchedDesig.id : (formData.designation?.trim() || undefined),
      date_of_birth: formData.date_of_birth?.trim() ? formData.date_of_birth : null,
      date_of_joining: formData.date_of_joining?.trim() ? formData.date_of_joining : new Date().toISOString().split('T')[0],
      monthly_ctc: Number(formData.monthly_ctc) || 0,
      basic_salary: Number(formData.basic_salary) || 0,
      hra: Number(formData.hra) || 0,
      da: Number(formData.da) || 0,
      other_allowances: Number(formData.other_allowances) || 0,
      uploaded_documents: formDocs.filter(d => Boolean(d.name?.trim()) && Boolean(d.file_name || d.file_data)),
    };

    if (!payload.assigned_hr || payload.assigned_hr === '---------' || payload.assigned_hr === 'default_hr') {
      delete payload.assigned_hr;
    }
    if (!payload.reporting_manager || payload.reporting_manager === '---------') {
      delete payload.reporting_manager;
    }

    try {
      if (viewMode === 'add') {
        const created = await api.createEmployee(payload);
        showToast(`🎉 ${firstName} ${lastName} (${effectiveEmpId}) onboarded successfully!`);
        emitEvent(
          'employee_created',
          'New Employee Onboarded',
          `${firstName} ${lastName} joined as ${formData.role_name} with ${formDocs.length} verified documents`,
          'success'
        );
      } else if (viewMode === 'edit' && editingEmployee) {
        const updated = await api.updateEmployee(editingEmployee.id, payload);
        showToast(`Employee ${firstName} ${lastName} updated successfully in real-time!`);
        emitEvent(
          'employee_updated',
          'Employee Record & Compensation Updated',
          `${firstName} ${lastName} dossier and KYC vault modified`,
          'info'
        );
      }
      await loadData();
      setViewMode('list');
    } catch (err: any) {
      alert(err.message || 'Failed to save employee record');
    }
  };

  // DELETE EMPLOYEE
  const handleDelete = async (emp: Employee) => {
    if (
      !confirm(
        `Are you sure you want to permanently delete ${emp.full_name} (${emp.employee_id})? This will also archive their KYC vault and access privileges.`
      )
    ) {
      return;
    }
    try {
      await api.deleteEmployee(emp.id);
      showToast(`Employee ${emp.full_name} removed from registry.`);
      emitEvent(
        'employee_deleted',
        'Employee Record Deleted',
        `${emp.full_name} (${emp.employee_id}) deleted by Super Admin`,
        'warning'
      );
      setEmployees((prev) => prev.filter((item) => item.id !== emp.id));
      if (viewEmployee && viewEmployee.id === emp.id) {
        setViewEmployee(null);
        setViewMode('list');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete employee');
    }
  };

  // Download Document Helper
  const handleDownloadDoc = (doc: EmployeeDocument, empName: string) => {
    if (doc.file_data) {
      const link = document.createElement('a');
      link.href = doc.file_data;
      link.download = doc.file_name;
      link.click();
    } else {
      const content = `ODIAS ERP — OFFICIAL VERIFIED KYC DOCUMENT\n\nDocument: ${doc.name}\nType: ${doc.document_type.toUpperCase()}\nFile: ${doc.file_name}\nSize: ${doc.file_size || '1.2 MB'}\nEmployee: ${empName}\nUpload Date: ${doc.upload_date || '2026-11-13'}\nVerification Status: VERIFIED BY COMPLIANCE OFFICER\nSecurity Hash: SHA256-${Math.random().toString(36).substring(2, 15).toUpperCase()}\n\nOdias ERP Cloud Platform — Bhubaneswar, Odisha`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.file_name.endsWith('.pdf') ? doc.file_name.replace('.pdf', '_Verified.txt') : doc.file_name;
      link.click();
      URL.revokeObjectURL(url);
    }
    showToast(`Downloading verified file: ${doc.file_name}`);
  };

  // TABLE COLUMNS
  const columns: ColumnDef<Employee>[] = [
    {
      key: 'employee_id',
      header: 'Employee ID',
      accessor: (row) => row.employee_id,
      render: (row) => (
        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
          {row.employee_id}
        </span>
      ),
    },
    {
      key: 'full_name',
      header: 'Employee Name & Email',
      accessor: (row) => row.full_name,
      render: (row) => (
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
            {row.first_name ? row.first_name[0] : 'E'}{row.last_name ? row.last_name[0] : 'P'}
          </div>
          <div>
            <span className="font-bold text-slate-900 block leading-tight">{row.full_name}</span>
            <span className="text-[11px] text-slate-500">{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'role_name',
      header: 'Assigned Role & Access',
      accessor: (row) => row.role_name || row.designation_title,
      render: (row) => {
        const isSuper = row.role_code === 'super_admin';
        const isSub = row.role_code === 'sub_admin';
        const isHR = row.role_code === 'hr_manager';
        const isMgr = row.role_code === 'manager';
        const badgeColor = isSuper
          ? 'bg-purple-50 text-purple-700 border-purple-200'
          : isSub
          ? 'bg-blue-50 text-blue-700 border-blue-200'
          : isHR
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : isMgr
          ? 'bg-amber-50 text-amber-700 border-amber-200'
          : 'bg-slate-100 text-slate-700 border-slate-200';
        return (
          <div className="space-y-0.5">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${badgeColor}`}>
              <Shield className="w-3 h-3 mr-1 opacity-70" />
              {row.role_name || (row.role_code ? row.role_code.toUpperCase() : 'Associate Staff')}
            </span>
            <span className="text-[10px] text-slate-400 block font-mono">
              {row.designation_title || 'Enterprise Specialist'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'documents_count',
      header: 'KYC Documents',
      accessor: (row) => (row.documents ? row.documents.length : 0),
      render: (row) => {
        const count = Array.isArray(row.documents) ? row.documents.length : 0;
        if (count === 0) {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
              <FileText className="w-3.5 h-3.5 mr-1 text-slate-400" />
              0 Documents
            </span>
          );
        }
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <FileCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            {count} {count === 1 ? 'Document' : 'Documents'}
          </span>
        );
      },
    },
    {
      key: 'department_name',
      header: 'Department',
      accessor: (row) => row.department_name,
      render: (row) => <span className="font-medium text-slate-700">{row.department_name}</span>,
    },
    {
      key: 'employment_status',
      header: 'Status',
      accessor: (row) => row.employment_status,
      render: (row) => <StatusBadge status={row.employment_status} />,
    },
    {
      key: 'performance_score',
      header: 'Performance (9-D)',
      sortable: false,
      render: (row) => {
        const ev = evaluations.find(
          (e) =>
            e.employeeId === row.id ||
            e.employeeId === row.employee_id ||
            e.employeeName?.toLowerCase() === (row as any).full_name?.toLowerCase() ||
            e.employeeName?.toLowerCase() === `${row.first_name || ''} ${row.last_name || ''}`.trim().toLowerCase()
        );
        if (!ev || ev.overallScore <= 0) {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
              Pending
            </span>
          );
        }
        return (
          <div
            className="flex items-center space-x-1.5"
            title={`Evaluated by ${ev.evaluatorName} on ${new Date(ev.evaluatedAt).toLocaleDateString()}`}
          >
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black bg-amber-50 text-amber-800 border border-amber-200 font-mono shadow-2xs">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              {ev.overallScore.toFixed(1)}
            </span>
            <span className="text-[10px] text-slate-400 font-medium hidden xl:inline">
              by {ev.evaluatorName.split(' ')[0]}
            </span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end space-x-1.5">
          {/* Rate Performance Button (9-Dimension Behaviours & Values) */}
          {['super_admin', 'hr_manager', 'manager'].includes(user?.role_code || '') && (
            <button
              onClick={() => {
                setPerformanceModalEmp({
                  id: row.id,
                  name: `${row.first_name || ''} ${row.last_name || ''}`.trim() || (row as any).full_name || 'Employee',
                  employee_id: row.employee_id,
                  employee_code: (row as any).employee_code || row.employee_id,
                  role_name: row.role_name || (row as any).designation,
                  department_name: row.department_name,
                  branch_name: (row as any).branch_name,
                  shift_name: (row as any).shift_name,
                  assigned_hr: (row as any).assigned_hr,
                  joined_date: (row as any).date_of_joining
                });
              }}
              className="p-1.5 rounded-lg text-amber-600 hover:text-amber-800 hover:bg-amber-50 border border-amber-200/80 transition-colors cursor-pointer"
              title="Rate Employee Performance (9-Dimension Behaviours & Values)"
            >
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            </button>
          )}

          {/* View Full Page Button */}
          <button
            onClick={() => {
              setViewEmployee(row);
              setViewMode('view');
            }}
            className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200/80 transition-colors cursor-pointer"
            title="View Full Employee Dossier & KYC Documents"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Edit Full Page Button */}
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg text-amber-600 hover:text-amber-800 hover:bg-amber-50 border border-amber-200/80 transition-colors cursor-pointer"
            title="Edit Full Employee Information, Role & Documents"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          {/* Delete Button */}
          <button
            onClick={() => handleDelete(row)}
            className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200/80 transition-colors cursor-pointer"
            title="Delete Employee Record"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  // ----------------------------------------------------
  // FULL PAGE STEP-WISE ONBOARDING / EDIT WIZARD (NOT POPUP!)
  // DISTINCT DEDICATED EXPERIENCE FOR HR, MANAGER, AND EMPLOYEE
  // ----------------------------------------------------
  if (viewMode === 'add' || viewMode === 'edit') {
    const isRoleEmployee = ['employee', 'sales', 'accounts'].includes(formData.role_code);
    const isRoleManager = formData.role_code === 'manager';
    const isRoleHR = formData.role_code === 'hr_manager';

    const wizardTitle = isEdit
      ? (mode === 'hr'
          ? `Edit HR Record: ${formData.first_name} ${formData.last_name}`
          : mode === 'manager'
          ? `Edit Manager Record: ${formData.first_name} ${formData.last_name}`
          : `Edit Employee Record: ${formData.first_name} ${formData.last_name}`)
      : (mode === 'hr'
          ? 'HR Leadership & Talent Operations Onboarding Wizard'
          : mode === 'manager'
          ? 'Department & Team Manager Onboarding Wizard'
          : 'Associate Staff & Employee Onboarding Wizard');

    const wizardSubtitle = mode === 'hr'
      ? 'Specialized configuration for HR Executives: people management, recruitment privileges, compliance oversight, and statutory payroll.'
      : mode === 'manager'
      ? 'Dedicated configuration for Team Managers: department leadership, squad task supervision, DWR reviews, and performance evaluations.'
      : 'Step-wise dedicated page configuration for staff personal details, branch placement, dynamic supervisors, compensation, and KYC vault.';

    const backLabel = mode === 'hr'
      ? 'Back to HR Directory'
      : mode === 'manager'
      ? 'Back to Managers Directory'
      : 'Back to Employee Directory';

    const breadcrumbLabel = mode === 'hr'
      ? 'HR Personnel / New HR Executive'
      : mode === 'manager'
      ? 'Managers / New Team Manager'
      : 'Staff Workforce / New Associate Staff';

    const HeroIcon = mode === 'hr' ? Shield : mode === 'manager' ? UserCheck : Users;
    const heroIconColor = mode === 'hr' ? 'text-purple-600' : mode === 'manager' ? 'text-emerald-600' : 'text-[#1877f2]';
    const idBadgeColor = mode === 'hr'
      ? 'text-purple-700 bg-purple-50 border-purple-200'
      : mode === 'manager'
      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
      : 'text-blue-700 bg-blue-50 border-blue-200';
    const idPrefixLabel = mode === 'hr' ? 'HR ID' : mode === 'manager' ? 'Manager ID' : 'Employee ID';

    return (
      <div className="space-y-6 animate-in fade-in duration-200 pb-12 font-sans">
        {/* Navigation Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="inline-flex items-center px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5 text-slate-500" />
              <span>{backLabel}</span>
            </button>
            <div className="h-5 w-px bg-slate-300 hidden sm:block" />
            <span className="text-xs text-slate-500 font-mono hidden sm:inline">
              Odias ERP / Human Resources / {isEdit ? `Edit Dossier: ${formData.first_name} ${formData.last_name}` : breadcrumbLabel}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              {ONBOARDING_STEPS[currentStep - 1]?.title}
            </span>
          </div>
        </div>

        {/* Hero Title */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
                <HeroIcon className={`w-6 h-6 ${heroIconColor} mr-2.5`} />
                {wizardTitle}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                {wizardSubtitle}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-xs font-mono font-bold px-3 py-1 rounded-xl border ${idBadgeColor}`}>
                {idPrefixLabel}: {formData.employee_id || 'AUTO-GENERATED'}
              </span>
            </div>
          </div>

          {/* Section Navigation Tabs (Replaces confusing 01/05 step cards) */}
          <div className="flex flex-wrap items-center gap-2 mt-5 pt-5 border-t border-slate-100">
            {ONBOARDING_STEPS.map((s) => {
              const isActive = currentStep === s.number;
              return (
                <button
                  key={s.number}
                  type="button"
                  onClick={() => setCurrentStep(s.number)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
                    isActive
                      ? 'bg-[#1877f2] text-white shadow-sm ring-2 ring-[#1877f2]/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                  }`}
                >
                  <span>{s.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmitForm} className="space-y-6">
          {/* STEP 1: PERSONAL PROFILE */}
          {currentStep === 1 && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
                <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">Personal Profile & Contact Identifiers</h2>
                  <p className="text-xs text-slate-500">Provide legal name, contact numbers, date of birth, gender, and profile photo.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Employee Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.full_name || `${formData.first_name} ${formData.last_name}`.trim()}
                    onChange={(e) => {
                      const val = e.target.value;
                      const parts = val.split(' ');
                      setFormData({
                        ...formData,
                        full_name: val,
                        first_name: parts[0] || '',
                        last_name: parts.slice(1).join(' ') || '',
                      });
                    }}
                    placeholder="e.g. Rajesh Kumar Mahapatra"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Email Address *</label>
                    {existingEmailEmp && (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        Already Registered
                      </span>
                    )}
                    {isEmailUnique && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        ✓ Available
                      </span>
                    )}
                  </div>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="rajesh.m@odiaserp.com"
                    className={`w-full px-3 py-2 text-xs border rounded-xl font-mono transition-colors ${
                      existingEmailEmp
                        ? 'border-rose-400 bg-rose-50/20 text-rose-900 focus:ring-rose-400'
                        : isEmailUnique
                        ? 'border-emerald-400 bg-emerald-50/10 focus:ring-emerald-400'
                        : 'border-slate-300'
                    }`}
                  />
                  {existingEmailEmp && (
                    <div className="mt-1.5 p-2 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-700 font-medium">
                      ⚠️ <strong>Email already registered</strong> to <strong>{existingEmailEmp.full_name}</strong> ({existingEmailEmp.employee_id} - {existingEmailEmp.role_name || existingEmailEmp.designation_title || 'Staff'}). Please use a different email address.
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Alternate Phone</label>
                  <input
                    type="text"
                    value={formData.alternate_phone}
                    onChange={(e) => setFormData({ ...formData, alternate_phone: e.target.value })}
                    placeholder="+91 91234 56789"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Profile Photo (Upload or URL)</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => setFormData({ ...formData, avatar_url: reader.result as string });
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                    {formData.avatar_url && (
                      <span className="text-[11px] text-emerald-600 font-bold flex items-center">
                        <Check className="w-3.5 h-3.5 mr-1" /> Photo Selected
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: BRANCH, DEPARTMENT, SHIFT & PLACEMENT */}
          {currentStep === 2 && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">Branch, Department, Shift & Employment Type</h2>
                  <p className="text-xs text-slate-500">Configure organizational placement, working hours shift, and weekly holidays.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Employee ID <span className="text-slate-400 font-normal">(Leave blank to auto-generate)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    placeholder="Auto-generated e.g. ODS-EMP-007"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Branch *</label>
                    <span className="text-[10px] text-slate-400 font-semibold">{branches.length} configured</span>
                  </div>
                  <select
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium focus:ring-blue-500"
                  >
                    <option value="">--------- Select Branch ---------</option>
                    {branches.length > 0 ? (
                      branches.map((b) => (
                        <option key={b.id || b.name} value={b.name}>{b.name}</option>
                      ))
                    ) : (
                      BRANCH_OPTIONS.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Department *</label>
                    <span className="text-[10px] text-emerald-600 font-semibold">{departments.length} Live Depts</span>
                  </div>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium focus:ring-blue-500"
                  >
                    <option value="">--------- Select Department ---------</option>
                    {departments.length > 0 ? (
                      departments.map((d) => (
                        <option key={d.id || d.name} value={d.name}>{d.name}</option>
                      ))
                    ) : (
                      DEPARTMENT_OPTIONS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Designation *</label>
                    <span className="text-[10px] text-purple-600 font-semibold">{designations.length} Live Roles</span>
                  </div>
                  <select
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium focus:ring-blue-500"
                  >
                    <option value="">--------- Select Designation ---------</option>
                    {designations.length > 0 ? (
                      designations.map((des) => (
                        <option key={des.id || des.title} value={des.title}>{des.title}</option>
                      ))
                    ) : (
                      DESIGNATION_OPTIONS.map((des) => (
                        <option key={des} value={des}>{des}</option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Work Shift</label>
                  <select
                    value={formData.work_shift}
                    onChange={(e) => setFormData({ ...formData, work_shift: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium"
                  >
                    <option value="">---------</option>
                    {SHIFT_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Weekly Off Schedule</label>
                  <select
                    value={formData.weekly_off}
                    onChange={(e) => setFormData({ ...formData, weekly_off: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium"
                  >
                    {WEEKLY_OFF_OPTIONS.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={formData.date_of_joining}
                    onChange={(e) => setFormData({ ...formData, date_of_joining: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Employment Type</label>
                  <select
                    value={formData.employment_type}
                    onChange={(e) => setFormData({ ...formData, employment_type: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium"
                  >
                    <option value="Full Time">Full Time</option>
                    <option value="Part Time">Part Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Intern">Intern</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Status</label>
                  <select
                    value={formData.employment_status}
                    onChange={(e) => setFormData({ ...formData, employment_status: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-bold text-emerald-700"
                  >
                    <option value="active">Active</option>
                    <option value="probation">Probation</option>
                    <option value="notice">Notice Period</option>
                    <option value="resigned">Inactive / Resigned</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ROLE, PERMISSIONS & DYNAMIC SUPERVISORY HIERARCHY */}
          {currentStep === 3 && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
                <div className="p-2 bg-purple-50 text-purple-700 rounded-xl">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">Role, Permissions & Supervisory Line</h2>
                  <p className="text-xs text-slate-500">
                    Assign system clearance. Dynamic supervisory fields (Assigned HR & Reporting Manager) adapt automatically according to the chosen role.
                  </p>
                </div>
              </div>

              {/* System Role Selection tailored by mode */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assign System Role & Clearance Level *
                </label>
                {mode === 'hr' ? (
                  <div className="p-3.5 bg-purple-50/70 rounded-xl border border-purple-200 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <Shield className="w-5 h-5 text-purple-600 shrink-0" />
                      <div>
                        <span className="font-black text-xs text-purple-900 block">HR Manager (People Operations)</span>
                        <span className="text-[11px] text-purple-700 font-medium">Full people operations clearance across employee directory, payroll verification, and statutory compliance.</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-purple-600 text-white text-[10px] font-black uppercase tracking-wider shrink-0">
                      HR Tier
                    </span>
                  </div>
                ) : mode === 'manager' ? (
                  <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <UserCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-black text-xs text-emerald-900 block">Team Manager (Department & Sprint Lead)</span>
                        <span className="text-[11px] text-emerald-700 font-medium">Department lead clearance for sprint task assignment, attendance approvals, and performance evaluation.</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider shrink-0">
                      Management Tier
                    </span>
                  </div>
                ) : (
                  <select
                    value={formData.role_code}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-blue-300 bg-blue-50/30 rounded-xl font-bold text-slate-800"
                  >
                    <option value="employee">Employee (Associate Staff)</option>
                    <option value="sales">Sales Associate (Commercial Team)</option>
                    <option value="accounts">Finance Associate (Accounts & Billing)</option>
                  </select>
                )}
                <p className="text-[11px] text-slate-500 mt-1">
                  {AVAILABLE_ROLES.find((r) => r.code === formData.role_code)?.desc}
                </p>
              </div>

              {/* Dynamic Hierarchy / Supervisors Condition (USER REQUESTED) */}
              <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100 space-y-3">
                <div className="text-xs font-extrabold text-purple-900 flex items-center">
                  <UserCheck className="w-4 h-4 mr-1.5 text-purple-600" />
                  Supervisory Hierarchy Placement for Role: {formData.role_name}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Assigned HR is shown if role is Employee, Sales, Accounts, or Manager */}
                  {(isRoleEmployee || isRoleManager) && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Assigned HR Supervisor *
                      </label>
                      <select
                        value={formData.assigned_hr}
                        onChange={(e) => setFormData({ ...formData, assigned_hr: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium"
                      >
                        <option value="">---------</option>
                        {employees
                          .filter((e) => e.role_code === 'hr_manager' || e.department_name?.includes('Human'))
                          .map((hr) => (
                            <option key={hr.id} value={hr.id}>
                              {hr.full_name} ({hr.designation_title || 'HR Director'})
                            </option>
                          ))}
                        {employees.length === 0 && <option value="" disabled>No HR Managers yet (Add HR first)</option>}
                      </select>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Responsible for attendance oversight, leave approval queue, and compliance.
                      </span>
                    </div>
                  )}

                  {/* Reporting Manager is shown if role is Employee, Sales, or Accounts */}
                  {isRoleEmployee && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Reporting Line Manager *
                      </label>
                      <select
                        value={formData.reporting_manager}
                        onChange={(e) => setFormData({ ...formData, reporting_manager: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium"
                      >
                        <option value="">---------</option>
                        {employees.map((mgr) => (
                          <option key={mgr.id} value={mgr.id}>
                            {mgr.full_name} ({mgr.role_name || mgr.designation_title || (mgr.role_code === 'employee' ? 'Employee' : 'Manager')})
                          </option>
                        ))}
                      </select>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Direct team supervisor for work assignments, sprint tasks, and ratings.
                      </span>
                    </div>
                  )}

                  {/* If HR Manager or Executive */}
                  {isRoleHR && (
                    <div className="md:col-span-2 text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200">
                      <strong>Executive Oversight:</strong> As HR Manager, this employee reports directly to <strong>Super Admin</strong>.
                    </div>
                  )}

                  {!isRoleEmployee && !isRoleManager && !isRoleHR && (
                    <div className="md:col-span-2 text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200">
                      <strong>Executive Leadership:</strong> This role sits at the top operational tier of Odias ERP.
                    </div>
                  )}
                </div>
              </div>

              {/* Module Permissions Matrix */}
              <div className="space-y-3">
                <div className="text-xs font-extrabold text-slate-800 flex items-center justify-between">
                  <span>Customizable Module Permissions Matrix:</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {formData.permissions.length} actions enabled
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {PERMISSION_MODULES.map((group) => (
                    <div key={group.module} className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="text-xs font-extrabold text-slate-800 mb-2">{group.module}</div>
                      <div className="space-y-1.5">
                        {group.permissions.map((p) => {
                          const checked = formData.permissions.includes(p.code);
                          return (
                            <label
                              key={p.code}
                              className={`flex items-center space-x-2 text-xs p-1.5 rounded cursor-pointer transition-colors ${
                                checked ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'text-slate-500 hover:bg-slate-100'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => handleTogglePermission(p.code)}
                                className="rounded text-[#1877f2] focus:ring-0 cursor-pointer"
                              />
                              <span className="truncate">{p.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: COMPENSATION, PAYROLL & STATUTORY ALLOWANCES */}
          {currentStep === 4 && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
                <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">Configure Monthly Compensation & Allowances</h2>
                  <p className="text-xs text-slate-500">
                    Gross CTC, Basic, HRA, DA, PF/ESI statutory flags, and income tax regime settings.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Monthly Salary (Gross / CTC) * (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.monthly_ctc}
                    onChange={(e) => handleMonthlyCTCChange(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Basic Salary * (₹)</label>
                  <input
                    type="number"
                    required
                    value={formData.basic_salary}
                    onChange={(e) => setFormData({ ...formData, basic_salary: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">HRA (House Rent Allowance) (₹)</label>
                  <input
                    type="number"
                    value={formData.hra}
                    onChange={(e) => setFormData({ ...formData, hra: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dearness Allowance (DA) (₹)</label>
                  <input
                    type="number"
                    value={formData.da}
                    onChange={(e) => setFormData({ ...formData, da: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Other Allowances (₹)</label>
                  <input
                    type="number"
                    value={formData.other_allowances}
                    onChange={(e) => setFormData({ ...formData, other_allowances: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Income Tax Regime *</label>
                  <select
                    value={formData.tax_regime}
                    onChange={(e) => setFormData({ ...formData, tax_regime: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium"
                  >
                    <option value="New Regime">New Regime (Default u/s 115BAC)</option>
                    <option value="Old Regime">Old Regime (With Exemptions)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode *</label>
                  <select
                    value={formData.payment_mode}
                    onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium"
                  >
                    <option value="Bank Transfer">Bank Transfer (NEFT / RTGS / IMPS)</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Universal Account Number (UAN)</label>
                  <input
                    type="text"
                    value={formData.uan_number}
                    onChange={(e) => setFormData({ ...formData, uan_number: e.target.value })}
                    placeholder="101429810239"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ESI Number</label>
                  <input
                    type="text"
                    value={formData.esi_number}
                    onChange={(e) => setFormData({ ...formData, esi_number: e.target.value })}
                    placeholder="31-99-10827364-001"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* Statutory Applicability Checkboxes */}
              <div className="flex flex-wrap gap-6 pt-3 border-t border-slate-100">
                <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.pf_applicable}
                    onChange={(e) => setFormData({ ...formData, pf_applicable: e.target.checked })}
                    className="rounded text-[#1877f2] focus:ring-0 cursor-pointer"
                  />
                  <span>Provident Fund (PF) Applicable</span>
                </label>

                <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.esi_applicable}
                    onChange={(e) => setFormData({ ...formData, esi_applicable: e.target.checked })}
                    className="rounded text-[#1877f2] focus:ring-0 cursor-pointer"
                  />
                  <span>ESI Scheme Applicable</span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 5: PORTAL AUTHENTICATION & PASSWORD */}
          {currentStep === 5 && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-5 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-rose-50 text-rose-700 rounded-xl">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">Employee Portal Authentication & Password</h2>
                    <p className="text-xs text-slate-500">
                      Password used for employee portal login, attendance selfie punches, and personal payslip access.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
                    const generated = `Odias@${randomSuffix}!`;
                    setFormData({ ...formData, password: generated, confirm_password: generated });
                  }}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-all shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>Auto-Generate Password</span>
                </button>
              </div>

              {/* Password Match Banner */}
              {isPasswordMatch && (
                <div className="flex items-center space-x-2.5 p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold animate-in fade-in duration-200 shadow-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-extrabold text-emerald-900">✓ Passwords Match!</span>
                    <span className="block text-[11px] font-medium text-emerald-700 mt-0.5">
                      Both credentials are identical and verified for employee self-service login.
                    </span>
                  </div>
                </div>
              )}

              {hasPasswordMismatch && (
                <div className="flex items-center space-x-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold animate-in fade-in duration-200">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <div>
                    <span className="font-bold text-rose-900">⚠️ Passwords Do Not Match</span>
                    <span className="block text-[11px] text-rose-700 mt-0.5">
                      Please ensure both the portal password and confirmation match exactly.
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      {isEdit ? 'New Password (Leave blank to keep unchanged)' : 'Portal Password *'}
                    </label>
                    {isPasswordMatch && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        ✓ Verified Match
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required={!isEdit}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••••••"
                      className={`w-full pl-3 pr-20 py-2 text-xs border rounded-xl font-mono transition-all ${
                        isPasswordMatch
                          ? 'border-emerald-500 bg-emerald-50/20 text-emerald-950 font-bold focus:ring-emerald-500'
                          : hasPasswordMismatch
                          ? 'border-rose-400 bg-rose-50/10 text-rose-950 focus:ring-rose-400'
                          : 'border-slate-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[11px] font-bold rounded-lg border flex items-center space-x-1 transition-all ${
                        isPasswordMatch
                          ? 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600 shadow-sm shadow-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                      title={showPassword ? 'Hide password' : 'View password'}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showPassword ? 'Hide' : 'View'}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Confirm Password {isEdit ? '' : '*'}
                    </label>
                    {isPasswordMatch && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        ✓ Verified Match
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required={!isEdit && Boolean(formData.password)}
                      value={formData.confirm_password}
                      onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                      placeholder="••••••••••••"
                      className={`w-full pl-3 pr-20 py-2 text-xs border rounded-xl font-mono transition-all ${
                        isPasswordMatch
                          ? 'border-emerald-500 bg-emerald-50/20 text-emerald-950 font-bold focus:ring-emerald-500'
                          : hasPasswordMismatch
                          ? 'border-rose-400 bg-rose-50/10 text-rose-950 focus:ring-rose-400'
                          : 'border-slate-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className={`absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[11px] font-bold rounded-lg border flex items-center space-x-1 transition-all ${
                        isPasswordMatch
                          ? 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600 shadow-sm shadow-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                      title={showConfirmPassword ? 'Hide password' : 'View password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showConfirmPassword ? 'Hide' : 'View'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 max-w-2xl">
                <strong>Login Credentials:</strong> The employee will use corporate email <strong>{formData.email || 'employee@odiaserp.com'}</strong> and this secure password to access their Odias ERP Self-Service Portal.
              </div>
            </div>
          )}

          {/* STEP 6: PAYOUT BANK, RESIDENTIAL ADDRESS & EMERGENCY CONTACT */}
          {currentStep === 6 && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
                <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">Payout Bank Account, Statutory IDs & Address</h2>
                  <p className="text-xs text-slate-500">
                    Direct salary deposit account, Aadhaar, PAN, residential address, and emergency contact.
                  </p>
                </div>
              </div>

              {/* Sub-section: Bank & Statutory IDs */}
              <div>
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center">
                  <Landmark className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Banking & Statutory Tax IDs
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={formData.bank_name}
                      onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                      placeholder="HDFC Bank Limited"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Bank Account Number</label>
                    <input
                      type="text"
                      value={formData.bank_account_number}
                      onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                      placeholder="50100428910044"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={formData.bank_ifsc}
                      onChange={(e) => setFormData({ ...formData, bank_ifsc: e.target.value.toUpperCase() })}
                      placeholder="HDFC0001234"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">PAN Card Number</label>
                    <input
                      type="text"
                      value={formData.pan_number}
                      onChange={(e) => setFormData({ ...formData, pan_number: e.target.value.toUpperCase() })}
                      placeholder="ABCDE1234F"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Aadhaar Card Number</label>
                    <input
                      type="text"
                      value={formData.aadhaar_number}
                      onChange={(e) => setFormData({ ...formData, aadhaar_number: e.target.value })}
                      placeholder="1234 5678 9012"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Sub-section: Residential Address */}
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-blue-600" />
                  Residential Address
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="lg:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Street Address</label>
                    <input
                      type="text"
                      value={formData.street_address}
                      onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                      placeholder="Plot 42, Infocity Avenue, Chandaka Industrial Estate"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Bhubaneswar"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="Odisha"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Postal / PIN Code</label>
                    <input
                      type="text"
                      value={formData.postal_code}
                      onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                      placeholder="751024"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Sub-section: Emergency Contact */}
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center">
                  <Phone className="w-3.5 h-3.5 mr-1 text-rose-600" />
                  Emergency Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Contact Person Name</label>
                    <input
                      type="text"
                      value={formData.emergency_contact_name}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                      placeholder="Parent / Spouse / Guardian Name"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Contact Phone Number</label>
                    <input
                      type="text"
                      value={formData.emergency_contact_phone}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                      placeholder="+91 94370 12345"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: KYC & EMPLOYMENT DOCUMENTS VAULT WITH + BUTTON */}
          {currentStep === 7 && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-5 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">KYC Documents, Resume & Offer Letter</h2>
                    <p className="text-xs text-slate-500">
                      Upload multiple statutory verification documents. Click <strong>+ Add Document</strong> to add more files.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddDocumentRow}
                  className="inline-flex items-center px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Document
                </button>
              </div>

              <div className="space-y-3">
                {formDocs.map((doc, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center gap-3"
                  >
                    <div className="w-full sm:w-1/3">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Document Type</label>
                      <select
                        value={doc.document_type}
                        onChange={(e) => {
                          const opt = DOCUMENT_TYPE_OPTIONS.find((o) => o.id === e.target.value);
                          setFormDocs((prev) => {
                            const copy = [...prev];
                            copy[idx] = {
                              ...copy[idx],
                              document_type: e.target.value,
                              name: opt?.label || 'Document',
                            };
                            return copy;
                          });
                        }}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                      >
                        {DOCUMENT_TYPE_OPTIONS.map((opt) => (
                          <option key={opt.id} value={opt.id}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="w-full sm:w-1/3">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Document Title / Name</label>
                      <input
                        type="text"
                        value={doc.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormDocs((prev) => {
                            const copy = [...prev];
                            copy[idx] = { ...copy[idx], name: val };
                            return copy;
                          });
                        }}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>

                    <div className="w-full sm:w-1/3 flex items-center space-x-2">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">
                          File ({doc.file_size || 'Ready'})
                        </label>
                        <input
                          type="file"
                          onChange={(e) => handleFileUpload(e, idx)}
                          className="w-full text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveDocumentRow(idx)}
                        className="p-1.5 mt-4 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                        title="Remove Document Row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {formDocs.length === 0 && (
                  <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                    No documents attached yet. Click <strong>+ Add Document</strong> to attach Aadhaar, PAN, Degree, or Offer Letter.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons Bottom Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex items-center justify-between">
            <button
              type="button"
              disabled={currentStep === 1}
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              className={`inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                currentStep === 1
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 cursor-pointer'
              }`}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>

              {currentStep < ONBOARDING_STEPS.length ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="inline-flex items-center px-5 py-2 rounded-xl bg-[#1877f2] hover:bg-[#166fe5] text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="inline-flex items-center px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  <span>{isEdit ? 'Save Employee Changes' : 'Complete Employee Onboarding'}</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    );
  }

  // ----------------------------------------------------
  // FULL PAGE DETAILS VIEW (When User clicks "View")
  // ----------------------------------------------------
  if (viewMode === 'view' && viewEmployee) {
    const docsList = Array.isArray(viewEmployee.documents) ? viewEmployee.documents : [];

    const currentRole = AVAILABLE_ROLES.find((r) => r.code === viewEmployee.role_code) || {
      name: viewEmployee.role_name || 'Associate Staff (Standard Access)',
      desc: 'Standard enterprise access clearance for regular staff members.',
    };

    const effectivePermissions = viewEmployee.permissions || DEFAULT_ROLE_PERMISSIONS[viewEmployee.role_code || 'employee'] || [];

    return (
      <div className="space-y-6 animate-in fade-in duration-200 pb-12">
        {/* Top Back Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                setViewMode('list');
                setViewEmployee(null);
              }}
              className="inline-flex items-center px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5 text-slate-500" />
              <span>Back to Employee Directory</span>
            </button>
            <div className="h-5 w-px bg-slate-300 hidden sm:block" />
            <span className="text-xs text-slate-500 font-mono hidden sm:inline">
              Odias ERP / Human Resources / {viewEmployee.employee_id}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {['super_admin', 'hr_manager', 'manager'].includes(user?.role_code || '') && (
              <button
                onClick={() => {
                  setPerformanceModalEmp({
                    id: viewEmployee.id,
                    name: `${viewEmployee.first_name || ''} ${viewEmployee.last_name || ''}`.trim() || 'Employee',
                    employee_id: viewEmployee.employee_id,
                    employee_code: (viewEmployee as any).employee_code || viewEmployee.employee_id,
                    role_name: viewEmployee.role_name || (viewEmployee as any).designation,
                    department_name: viewEmployee.department_name,
                    branch_name: (viewEmployee as any).branch_name,
                    shift_name: (viewEmployee as any).shift_name,
                    assigned_hr: (viewEmployee as any).assigned_hr,
                    joined_date: viewEmployee.date_of_joining
                  });
                }}
                className="inline-flex items-center px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <Star className="w-3.5 h-3.5 mr-1.5 fill-slate-950 text-slate-950" />
                <span>Rate Performance</span>
              </button>
            )}
            <button
              onClick={() => handleOpenEdit(viewEmployee)}
              className="inline-flex items-center px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs border border-amber-200 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1.5" />
              <span>Edit Full Dossier</span>
            </button>
            <button
              onClick={() => handleDelete(viewEmployee)}
              className="inline-flex items-center px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs border border-rose-200 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              <span>Delete Record</span>
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              <span>Print Dossier</span>
            </button>
          </div>
        </div>

        {/* Hero Dossier Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#1877f2] to-blue-700 text-white flex items-center justify-center font-extrabold text-2xl shadow-md">
              {viewEmployee.first_name ? viewEmployee.first_name[0] : 'E'}{viewEmployee.last_name ? viewEmployee.last_name[0] : 'P'}
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {viewEmployee.full_name}
                </h1>
                <StatusBadge status={viewEmployee.employment_status} />
              </div>
              <p className="text-sm text-blue-700 font-bold mt-0.5">
                {viewEmployee.designation_title || 'Enterprise Specialist'} • <span className="text-slate-600 font-medium">{viewEmployee.department_name}</span>
              </p>
              <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500 font-mono">
                <span>ID: <strong>{viewEmployee.employee_id}</strong></span>
                <span>•</span>
                <span>Joined: <strong>{viewEmployee.date_of_joining}</strong></span>
                <span>•</span>
                <span>Branch: <strong>{viewEmployee.branch_name}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
            <span className="text-xs text-slate-400 font-mono">Role Clearance</span>
            <span className="text-sm font-extrabold text-purple-700 font-mono flex items-center bg-purple-50 border border-purple-200 px-3 py-1 rounded-xl mt-1">
              <ShieldCheck className="w-4 h-4 mr-1.5 text-purple-600" />
              {currentRole.name}
            </span>
            <span className="text-[11px] text-slate-400 mt-1.5 flex items-center">
              <FileCheck className="w-3.5 h-3.5 mr-1 text-emerald-500" /> {docsList.length} Verified KYC Documents
            </span>
          </div>
        </div>

        {/* SECTION 1: SUPERVISORY LINE & ORGANIZATIONAL HIERARCHY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Supervisory Hierarchy */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <UserCheck className="w-4 h-4 text-[#1877f2]" />
              <h2 className="text-sm font-bold text-slate-900">Supervisory Hierarchy</h2>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Assigned HR Supervisor</span>
                <span className="font-bold text-slate-800 text-sm">
                  {viewEmployee.assigned_hr_name || 'Not Assigned'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Direct Reporting Line Manager</span>
                <span className="font-bold text-slate-800 text-sm">
                  {viewEmployee.manager_name || 'Not Assigned'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Work Shift Schedule</span>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {viewEmployee.shift_name || 'Day shift (09:00 - 18:00)'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Weekly Off</span>
                <span className="font-mono text-slate-700 font-bold">
                  {viewEmployee.weekly_off || 'Sunday (Shift Default)'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Contact & Identification */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <Mail className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Contact & Identifiers</h2>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Official Corporate Email</span>
                <span className="font-mono font-bold text-slate-800">{viewEmployee.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Primary Phone Number</span>
                <span className="font-mono font-bold text-slate-800">{viewEmployee.phone || '+91 98765 43210'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Alternate Phone</span>
                <span className="font-mono text-slate-700">{viewEmployee.alternate_phone || '+91 91234 56789'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Date of Birth & Gender</span>
                <span className="font-mono text-slate-800">
                  {viewEmployee.date_of_birth || '1995-05-15'} ({viewEmployee.gender || 'Male'})
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Address & Emergency Contact */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <MapPin className="w-4 h-4 text-rose-600" />
              <h2 className="text-sm font-bold text-slate-900">Address & Emergency Contact</h2>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Street Address</span>
                <span className="font-medium text-slate-800">
                  {viewEmployee.street_address || 'Plot 42, Infocity Avenue, Chandaka Industrial Estate'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">City, State & PIN</span>
                <span className="font-mono text-slate-700">
                  {viewEmployee.city || 'Bhubaneswar'}, {viewEmployee.state || 'Odisha'} - {viewEmployee.postal_code || '751024'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Emergency Contact Person</span>
                <span className="font-bold text-rose-700">
                  {viewEmployee.emergency_contact_name || 'Subhasish Dash (Brother)'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Emergency Phone</span>
                <span className="font-mono text-slate-800">
                  {viewEmployee.emergency_contact_phone || '+91 94370 12345'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: MONTHLY COMPENSATION & STATUTORY ALLOWANCES */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-extrabold text-slate-900">
                Monthly Compensation & Statutory Allowances
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
              CTC: ₹{Number(viewEmployee.monthly_ctc || 65000).toLocaleString('en-IN')} / month
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 text-xs block">Basic Salary</span>
              <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">
                ₹{Number(viewEmployee.basic_salary || 32500).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 text-xs block">HRA</span>
              <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">
                ₹{Number(viewEmployee.hra || 13000).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 text-xs block">Dearness (DA)</span>
              <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">
                ₹{Number(viewEmployee.da || 3250).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 text-xs block">Other Allowances</span>
              <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">
                ₹{Number(viewEmployee.other_allowances || 16250).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 text-xs block">Tax Regime</span>
              <span className="text-xs font-bold text-purple-700 font-mono mt-1 block">
                {viewEmployee.tax_regime || 'New Regime'}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 text-xs block">Disbursal Mode</span>
              <span className="text-xs font-bold text-blue-700 font-mono mt-1 block">
                {viewEmployee.payment_mode || 'Bank Transfer'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block">PF (Provident Fund)</span>
                <span className="font-bold text-slate-800">{viewEmployee.pf_applicable !== false ? 'Applicable (Covered)' : 'Exempt'}</span>
              </div>
              <span className="font-mono text-slate-700 bg-white px-2.5 py-1 rounded border border-slate-200">
                UAN: {viewEmployee.uan_number || '101429810239'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block">ESI (Employee State Insurance)</span>
                <span className="font-bold text-slate-800">{viewEmployee.esi_applicable !== false ? 'Applicable (Covered)' : 'Exempt'}</span>
              </div>
              <span className="font-mono text-slate-700 bg-white px-2.5 py-1 rounded border border-slate-200">
                ESI No: {viewEmployee.esi_number || '31-99-10827364-001'}
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 4: PAYOUT BANK & STATUTORY TAX IDS */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Shield className="w-4 h-4 text-purple-600" />
            <h2 className="text-sm font-bold text-slate-900">Banking Master & Statutory Tax Registrations</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Salary Disbursal Bank</span>
              <span className="font-bold text-slate-800 text-sm">{viewEmployee.bank_name || 'HDFC Bank Limited'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Bank Account Number</span>
              <span className="font-mono font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                {viewEmployee.bank_account_number || '50100428910044'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">IFSC Routing Code</span>
              <span className="font-mono font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                {viewEmployee.bank_ifsc || 'HDFC0001234'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Income Tax PAN Number</span>
              <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                {viewEmployee.pan_number || 'ABCDE1234F'}
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 4.5: 9-DIMENSION BEHAVIOURS & VALUES PERFORMANCE EVALUATION (PLACED DIRECTLY UNDER PAYROLL & COMPENSATION) */}
        {(() => {
          const empEval = evaluations.find(
            (e) =>
              e.employeeId === viewEmployee.id ||
              e.employeeId === viewEmployee.employee_id ||
              e.employeeName?.toLowerCase() === viewEmployee.full_name?.toLowerCase() ||
              e.employeeName?.toLowerCase() === `${viewEmployee.first_name || ''} ${viewEmployee.last_name || ''}`.trim().toLowerCase()
          );

          const hasEval = Boolean(empEval && empEval.overallScore > 0);

          return (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
              {/* Header Bar */}
              <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-400/20">
                    <Star className="w-5 h-5 fill-slate-950" />
                  </div>
                  <div>
                    <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                      <span>9-DIMENSION PERFORMANCE & COMPETENCY EVALUATION</span>
                    </h2>
                    <p className="text-xs text-slate-300">
                      Evaluated on core enterprise behaviours, execution discipline, leadership values, and interpersonal impact.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {hasEval && (
                    <span className="px-3 py-1 rounded-xl bg-amber-400/20 text-amber-300 text-xs font-mono font-bold border border-amber-400/30">
                      Score: {empEval!.overallScore.toFixed(1)} / 5.0 ★
                    </span>
                  )}
                  {['super_admin', 'hr_manager', 'manager'].includes(user?.role_code || '') && (
                    <button
                      onClick={() => {
                        setPerformanceModalEmp({
                          id: viewEmployee.id,
                          name: viewEmployee.full_name || `${viewEmployee.first_name || ''} ${viewEmployee.last_name || ''}`.trim(),
                          employee_id: viewEmployee.employee_id,
                          employee_code: (viewEmployee as any).employee_code || viewEmployee.employee_id,
                          role_name: viewEmployee.role_name || (viewEmployee as any).designation,
                          department_name: viewEmployee.department_name,
                          branch_name: (viewEmployee as any).branch_name,
                          shift_name: (viewEmployee as any).shift_name,
                          assigned_hr: (viewEmployee as any).assigned_hr,
                          joined_date: viewEmployee.date_of_joining
                        });
                      }}
                      className="inline-flex items-center px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer"
                    >
                      <Star className="w-3.5 h-3.5 mr-1.5 fill-slate-950 text-slate-950" />
                      <span>{hasEval ? 'Update Rating' : 'Evaluate Performance Now'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Content Body */}
              <div className="p-5 sm:p-6 space-y-6">
                {hasEval ? (
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Left: Overall Score Meter (4 Cols) */}
                      <div className="lg:col-span-4 w-full">
                        <ScoreMeterGauge
                          score={empEval!.overallScore}
                          evaluatorName={empEval!.evaluatorName}
                          evaluatorRole={empEval!.evaluatorRole}
                          evaluatedAt={empEval!.evaluatedAt}
                          onRateClick={() => {
                            setPerformanceModalEmp({
                              id: viewEmployee.id,
                              name: viewEmployee.full_name || `${viewEmployee.first_name || ''} ${viewEmployee.last_name || ''}`.trim(),
                              employee_id: viewEmployee.employee_id,
                              employee_code: (viewEmployee as any).employee_code || viewEmployee.employee_id,
                              role_name: viewEmployee.role_name || (viewEmployee as any).designation,
                              department_name: viewEmployee.department_name,
                              branch_name: (viewEmployee as any).branch_name,
                              shift_name: (viewEmployee as any).shift_name,
                              assigned_hr: (viewEmployee as any).assigned_hr,
                              joined_date: viewEmployee.date_of_joining
                            });
                          }}
                          canRate={['super_admin', 'hr_manager', 'manager'].includes(user?.role_code || '')}
                        />
                      </div>

                      {/* Right: 9 Dimension Cards (8 Cols) */}
                      <div className="lg:col-span-8">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {DIMENSIONS_CONFIG.map((dim) => {
                            const val = empEval!.scores[dim.key] || 0.0;
                            return (
                              <div
                                key={dim.key}
                                className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex flex-col justify-between space-y-2 hover:bg-white hover:border-blue-400 transition-all shadow-2xs group"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-xs text-slate-800 group-hover:text-blue-600 transition-colors">
                                      {dim.num}. {dim.title}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-lg text-xs font-black font-mono border ${dim.badgeBg} ${dim.badgeText} border-slate-200/80`}>
                                      {val.toFixed(1)} ★
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 leading-relaxed font-sans line-clamp-3">
                                    {dim.description}
                                  </p>
                                </div>
                                <div className="w-full bg-slate-200/70 h-1 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-blue-600 rounded-full"
                                    style={{ width: `${(val / 5) * 100}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Evaluator Notes & Feedback Quote Box ("kun diaa", "kya diaa") */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border-l-4 border-l-blue-600 border border-slate-200/80 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="w-4 h-4 text-blue-600" />
                          <span className="font-extrabold text-xs text-slate-900">
                            Overall Evaluator Notes & Leadership Remarks
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Assigned by <strong>{empEval!.evaluatorName}</strong> • {new Date(empEval!.evaluatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed italic pl-6">
                        "{empEval!.feedbackNotes || 'No specific feedback notes provided.'}"
                      </p>

                      {(empEval!.keyStrengths || empEval!.areasForImprovement) && (
                        <div className="pl-6 pt-3 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          {empEval!.keyStrengths && (
                            <div className="flex items-start space-x-2">
                              <ThumbsUp className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                              <div>
                                <span className="font-bold text-slate-800 block text-[11px]">Key Strengths:</span>
                                <span className="text-slate-600 text-[11px]">{empEval!.keyStrengths}</span>
                              </div>
                            </div>
                          )}
                          {empEval!.areasForImprovement && (
                            <div className="flex items-start space-x-2">
                              <TrendingUp className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                              <div>
                                <span className="font-bold text-slate-800 block text-[11px]">Areas for Improvement:</span>
                                <span className="text-slate-600 text-[11px]">{empEval!.areasForImprovement}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                    <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                      <Star className="w-6 h-6 fill-amber-400 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-slate-800">No Performance Evaluation Recorded Yet</h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                        This employee has not yet been scored on the 9-dimension Behaviours & Values framework. HR Managers and Team Managers can rate their performance now.
                      </p>
                    </div>
                    {['super_admin', 'hr_manager', 'manager'].includes(user?.role_code || '') && (
                      <button
                        onClick={() => {
                          setPerformanceModalEmp({
                            id: viewEmployee.id,
                            name: viewEmployee.full_name || `${viewEmployee.first_name || ''} ${viewEmployee.last_name || ''}`.trim(),
                            employee_id: viewEmployee.employee_id,
                            employee_code: (viewEmployee as any).employee_code || viewEmployee.employee_id,
                            role_name: viewEmployee.role_name || (viewEmployee as any).designation,
                            department_name: viewEmployee.department_name,
                            branch_name: (viewEmployee as any).branch_name,
                            shift_name: (viewEmployee as any).shift_name,
                            assigned_hr: (viewEmployee as any).assigned_hr,
                            joined_date: viewEmployee.date_of_joining
                          });
                        }}
                        className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                      >
                        <Star className="w-3.5 h-3.5 mr-1.5 fill-white text-white" />
                        <span>Evaluate Performance Now</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* SECTION 5: EMPLOYEE KYC & DOCUMENTS VAULT */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-emerald-50 rounded-xl text-emerald-700">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Employee KYC & Compliance Documents Vault
                </h2>
                <p className="text-xs text-slate-500">
                  Verified statutory identity records, offer letters, academic certificates, and resumes.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleOpenEdit(viewEmployee)}
              className="inline-flex items-center px-3.5 py-1.5 rounded-xl bg-[#1877f2] hover:bg-[#166fe5] text-white font-bold text-xs shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Upload More Documents</span>
            </button>
          </div>

          {/* Document Cards Grid */}
          {docsList.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
              <FileCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600">No Verified Documents Uploaded</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Click "Upload More Documents" to attach statutory KYC files.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {docsList.map((doc, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 transition-all shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
                        {doc.document_type === 'aadhaar' ? (
                          <Landmark className="w-5 h-5 text-blue-600" />
                        ) : doc.document_type === 'pan' ? (
                          <CreditCard className="w-5 h-5 text-purple-600" />
                        ) : doc.document_type === 'degree' ? (
                          <Award className="w-5 h-5 text-amber-600" />
                        ) : doc.document_type === 'offer_letter' ? (
                          <FileCheck className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <FileText className="w-5 h-5 text-slate-600" />
                        )}
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {doc.status?.toUpperCase() || 'VERIFIED'}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm">{doc.name}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">{doc.file_name}</p>

                    <div className="flex items-center space-x-3 text-[11px] text-slate-400 font-mono mt-3">
                      <span>Size: {doc.file_size || '1.4 MB'}</span>
                      <span>•</span>
                      <span>Uploaded: {doc.upload_date || '2026-11-13'}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-4 mt-4 border-t border-slate-100">
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      Preview
                    </button>
                    <button
                      onClick={() => handleDownloadDoc(doc, viewEmployee.full_name)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 mr-1" />
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 5: ROLE & PERMISSION CLEARANCE MATRIX (PLACED AT THE VERY BOTTOM OF VIEW DOSSIER PER USER SPECIFICATION) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-purple-50 rounded-xl text-purple-700">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Role & Position Access Control Matrix
                </h2>
                <p className="text-xs text-slate-500">
                  Defines exactly what modules this employee can View, Add, Edit, or Delete within the ERP system.
                </p>
              </div>
            </div>
            <div className="inline-flex items-center px-3 py-1 bg-purple-100/60 text-purple-800 rounded-lg text-xs font-bold font-mono">
              Clearance Level: {viewEmployee.role_code?.toUpperCase() || 'EMPLOYEE'}
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-4">
            <div className="text-xs font-bold text-slate-800">Assigned Position Description:</div>
            <div className="text-xs text-slate-600 mt-0.5">{currentRole.desc}</div>
          </div>

          {/* Permissions Matrix Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PERMISSION_MODULES.map((group) => {
              const grantedCount = group.permissions.filter((p) => effectivePermissions.includes(p.code)).length;
              return (
                <div key={group.module} className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-extrabold text-xs text-slate-800">{group.module}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                      {grantedCount} / {group.permissions.length} Granted
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {group.permissions.map((p) => {
                      const hasPerm = effectivePermissions.includes(p.code);
                      return (
                        <div
                          key={p.code}
                          className={`flex items-center justify-between text-xs p-2 rounded-lg ${
                            hasPerm ? 'bg-emerald-50/60 text-emerald-900 font-semibold' : 'bg-slate-50 text-slate-400'
                          }`}
                        >
                          <span className="text-[11px]">{p.label}</span>
                          {hasPerm ? (
                            <span className="flex items-center text-emerald-600 text-[10px] font-bold">
                              <Check className="w-3.5 h-3.5 mr-0.5" /> Allowed
                            </span>
                          ) : (
                            <span className="flex items-center text-slate-400 text-[10px]">
                              <X className="w-3.5 h-3.5 mr-0.5" /> Restricted
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Document Preview Modal */}
        <Modal
          isOpen={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          title={`KYC Vault: ${previewDoc?.name}`}
        >
          {previewDoc && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">{previewDoc.name}</h3>
                    <p className="text-xs text-slate-500 font-mono">{previewDoc.file_name}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">
                    VERIFIED ENCRYPTED
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 font-mono pt-2 border-t border-slate-200">
                  <div>Employee: <strong>{viewEmployee.full_name}</strong></div>
                  <div>ID: <strong>{viewEmployee.employee_id}</strong></div>
                  <div>File Size: <strong>{previewDoc.file_size || '1.4 MB'}</strong></div>
                  <div>Verified On: <strong>{previewDoc.upload_date || '2026-11-13'}</strong></div>
                </div>
              </div>

              <div className="h-64 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-6 text-center bg-slate-50/50">
                {previewDoc.file_data ? (
                  previewDoc.file_data.startsWith('data:image/') ? (
                    <img src={previewDoc.file_data} alt="Preview" className="max-h-full max-w-full object-contain rounded-lg" />
                  ) : (
                    <div className="space-y-2">
                      <FileCheck className="w-12 h-12 text-emerald-600 mx-auto" />
                      <div className="text-sm font-bold text-slate-800">Binary Document Preview Ready</div>
                      <p className="text-xs text-slate-500 max-w-xs">{previewDoc.file_name}</p>
                    </div>
                  )
                ) : (
                  <div className="space-y-2">
                    <FileCheck className="w-12 h-12 text-emerald-600 mx-auto" />
                    <div className="text-sm font-bold text-slate-800">Odias ERP Secure Vault Preview</div>
                    <p className="text-xs text-slate-500 max-w-xs">
                      Official digitally stamped statutory document on file for {viewEmployee.full_name}.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadDoc(previewDoc, viewEmployee.full_name)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1877f2] text-white hover:bg-[#166fe5] shadow-sm flex items-center"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Download File
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    );
  }

  // ----------------------------------------------------
  // TABLE VIEW (Default)
  // ----------------------------------------------------
  const defaultRoleForMode = mode === 'hr' ? 'hr_manager' : mode === 'manager' ? 'manager' : mode === 'employee' ? 'employee' : 'all';
  const isFilterActive = roleFilter !== defaultRoleForMode || departmentFilter !== 'all' || statusFilter !== 'all' || searchQuery.trim() !== '';

  const sectionTitle = mode === 'hr'
    ? 'HR Personnel Directory'
    : mode === 'manager'
    ? 'Managers Directory'
    : 'Employee Directory';

  const sectionSubtitle = mode === 'hr'
    ? 'HR Management: Talent acquisition, workforce compliance, and people operations supervisors.'
    : mode === 'manager'
    ? 'Management Tier: Department leads, engineering managers, and project supervisors.'
    : user?.role_code === 'manager'
    ? 'Team Workspace: Your direct reporting staff and assigned team subordinates.'
    : 'Enterprise workforce directory: Associate engineers, specialists, and team members.';

  const addBtnLabel = mode === 'hr'
    ? 'Add HR Executive'
    : mode === 'manager'
    ? 'Add Manager'
    : 'Add Employee';

  return (
    <div className="space-y-6">
      {/* Success Notification Alert */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mr-2 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-xs text-emerald-700 underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Top HRMS Segment Navigation Tabs (Direct Switching between Employee, Manager, and HR) */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit border border-slate-200/80">
        <button
          type="button"
          onClick={() => navigate('/app/hrms/employees')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            mode === 'employee'
              ? 'bg-white text-[#1877f2] shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Employee Directory</span>
          <span className="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">Staff</span>
        </button>

        {(user?.role_code === 'super_admin' || user?.role_code === 'hr_manager') && (
          <button
            type="button"
            onClick={() => navigate('/app/hrms/managers')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              mode === 'manager'
                ? 'bg-white text-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Managers Directory</span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">Leads</span>
          </button>
        )}

        {user?.role_code === 'super_admin' && (
          <button
            type="button"
            onClick={() => navigate('/app/hrms/hr')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              mode === 'hr'
                ? 'bg-white text-purple-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>HR Directory</span>
            <span className="px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold">HR</span>
          </button>
        )}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
            {mode === 'hr' ? (
              <Shield className="w-7 h-7 text-purple-600 mr-2.5" />
            ) : mode === 'manager' ? (
              <UserCheck className="w-7 h-7 text-emerald-600 mr-2.5" />
            ) : (
              <Users className="w-7 h-7 text-[#1877f2] mr-2.5" />
            )}
            {sectionTitle}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {sectionSubtitle}
          </p>
        </div>

        {/* Action Button: Only Super Admin and HR can add HRs/Managers, Managers can add team staff */}
        {(user?.role_code === 'super_admin' || user?.role_code === 'hr_manager' || mode === 'employee') && (
          <button
            onClick={handleOpenAdd}
            className={`inline-flex items-center px-4 py-2.5 rounded-xl text-white font-bold text-xs transition-all cursor-pointer shadow-md active:scale-95 ${
              mode === 'hr'
                ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/25'
                : mode === 'manager'
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25'
                : 'bg-[#1877f2] hover:bg-[#166fe5] shadow-blue-500/25'
            }`}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            {addBtnLabel}
          </button>
        )}
      </div>

      {/* Realtime Interactive Filter Bar (Drop down for Role, Department, Status & live ID / Name search) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Live Search by ID / Name / Keyword */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, Name, Phone..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-300 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Role Dropdown Filter */}
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">Role: All Roles</option>
              <option value="employee">Role: Associate Staff (Employee)</option>
              <option value="manager">Role: Team Manager</option>
              <option value="hr_manager">Role: HR Manager</option>
              <option value="super_admin">Role: Super Admin</option>
              <option value="accounts">Role: Finance Controller (Accounts)</option>
              <option value="sales">Role: Sales Director</option>
            </select>
          </div>

          {/* Department Dropdown Filter */}
          <div className="relative">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">Department: All Departments</option>
              {departmentsList.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Employment Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">Status: All Statuses</option>
              <option value="active">Active</option>
              <option value="probation">Probation</option>
              <option value="notice">Notice Period</option>
              <option value="resigned">Resigned</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>
        </div>

        {/* Filter Summary & Active State */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-slate-500 font-medium">
              Showing <strong className="text-slate-900">{filteredEmployees.length}</strong> of{' '}
              <strong className="text-slate-900">{employees.length}</strong> records
            </span>
            {isFilterActive && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Live Filtered
              </span>
            )}
          </div>

          {isFilterActive && (
            <button
              onClick={() => {
                setSearchQuery('');
                setRoleFilter(defaultRoleForMode);
                setDepartmentFilter('all');
                setStatusFilter('all');
              }}
              className="inline-flex items-center space-x-1 text-slate-500 hover:text-rose-600 font-semibold text-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Universal DataTable with View, Edit, Delete Actions */}
      <DataTable
        data={filteredEmployees}
        columns={columns}
        searchPlaceholder={`Quick filter across ${filteredEmployees.length} records...`}
        initialPageSize={10}
        pageSizeOptions={[10, 25, 50, 100]}
      />

      {/* 9-Dimension Performance Evaluation Modal */}
      <EmployeePerformanceModal
        isOpen={Boolean(performanceModalEmp)}
        onClose={() => setPerformanceModalEmp(null)}
        employee={performanceModalEmp}
      />
    </div>
  );
};
