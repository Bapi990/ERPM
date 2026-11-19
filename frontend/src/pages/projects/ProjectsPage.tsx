import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FolderKanban, Plus, CheckCircle2, Clock, Calendar,
  Users, CheckSquare, Layers, DollarSign, ArrowRight, Filter,
  Eye, Edit3, Trash2, ArrowLeft, Printer, Building2, Shield,
  Activity, FileText, Check, X, RotateCcw, MessageSquare, Send,
  CalendarDays, Sliders, Sparkles, TrendingUp, AlertCircle,
  Award, Upload, Download, Search, FileCheck, Play, HelpCircle,
  CheckCircle, ThumbsUp, AlertTriangle, UserCheck, Briefcase
} from 'lucide-react';
import { DataTable, type ColumnDef } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useRealtime } from '../../context/RealtimeContext';
import { useAuth } from '../../context/AuthContext';
import { canPerformAction } from '../../utils/rbacMatrix';
import { api } from '../../api/client';

// ----------------------------------------------------
// TYPES & INTERFACES
// ----------------------------------------------------
export interface ProjectRemark {
  id: string;
  author_name: string;
  author_role: string;
  timestamp: string;
  progress_at_moment: number;
  text: string;
}

export interface ProjectChecklistItem {
  id: string;
  text: string;
  done: boolean;
  assigned_to?: string;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  target_date: string;
  completion_date?: string;
  status: 'pending' | 'in_progress' | 'achieved';
  payment_trigger_amount: number;
}

export interface Project {
  id: string;
  project_code: string;
  title: string;
  client_name: string;
  lead_manager: string;
  assigned_to: string; // Assignee: Manager or Employee
  assigned_to_role: string;
  assigned_by_hr: string; // HR supervisor name who assigned the project
  start_date: string;
  deadline: string;
  budget: number;
  spent: number;
  progress: number; // 0 to 100%
  // Lifecycle: assigned (pending acceptance) -> accepted -> in_progress -> review -> completed (success)
  assignment_status: 'pending_acceptance' | 'accepted' | 'declined';
  status: 'assigned' | 'in_progress' | 'review' | 'completed' | 'on_hold';
  accepted_at?: string;
  started_at?: string;
  completed_at?: string;
  remarks: ProjectRemark[];
  checklists: ProjectChecklistItem[];
  milestones?: ProjectMilestone[];
  description?: string;
}

export interface TaskItem {
  id: string;
  task_code: string;
  project_id: string;
  project_title: string;
  title: string;
  assignee: string;
  assignee_role: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progress: number;
  status: 'todo' | 'assigned' | 'in_progress' | 'review' | 'done';
  completed_at?: string;
  remarks: ProjectRemark[];
}

export interface DailyWorkReport {
  id: string;
  employee_name: string;
  employee_role: string;
  date: string;
  project_title: string;
  tasks_completed: string;
  hours_spent: number;
  progress_increment: number;
  blockers: string;
  status: 'submitted' | 'reviewed' | 'approved';
}

export interface ProjectDocument {
  id: string;
  project_title: string;
  name: string;
  file_name: string;
  file_size: string;
  upload_date: string;
  doc_type: 'contract' | 'srs' | 'brief' | 'architecture' | 'deliverable';
}

// ----------------------------------------------------
// INITIAL PRE-LOADED ENTERPRISE DATASET
// ----------------------------------------------------
const INITIAL_PROJECTS: Project[] = [
  {
    id: 'prj-1',
    project_code: 'PRJ-2026-001',
    title: 'Odias Cloud ERP Enterprise 2.0',
    client_name: 'Apex Global Enterprises',
    lead_manager: 'Rahul Verma',
    assigned_to: 'Rohan Mehta',
    assigned_to_role: 'Associate Staff (Frontend)',
    assigned_by_hr: 'Ananya Sharma (HR Director)',
    start_date: '2026-10-01',
    deadline: '2026-12-31',
    budget: 1500000,
    spent: 850000,
    progress: 75,
    assignment_status: 'accepted',
    status: 'in_progress',
    accepted_at: '2026-10-02 09:30 AM',
    started_at: '2026-10-02 10:00 AM',
    description: 'Autonomous ERP core system consolidation covering HRMS biometric shifts, CRM Kanban velocity, and GST e-invoicing.',
    checklists: [
      { id: 'chk-1', text: 'Biometric WebRTC camera check-in selfie module', done: true },
      { id: 'chk-2', text: 'HRMS separate HR, Manager, and Employee directory segregation', done: true },
      { id: 'chk-3', text: 'Live Search & Dropdown Filter toolbar for instant data loading', done: true },
      { id: 'chk-4', text: 'Move Role & Permission clearance matrix to dossier bottom', done: true },
      { id: 'chk-5', text: 'Project assignment lifecycle: HR assign -> Accept -> Start -> % Update -> Success', done: true },
    ],
    milestones: [
      { id: 'm-1', title: 'Phase 1: Architecture Sign-Off', target_date: '2026-10-15', completion_date: '2026-10-14', status: 'achieved', payment_trigger_amount: 300000 },
      { id: 'm-2', title: 'Phase 2: Alpha Release with Core Ledgers', target_date: '2026-11-15', completion_date: '2026-11-12', status: 'achieved', payment_trigger_amount: 500000 },
      { id: 'm-3', title: 'Phase 3: Security & RBAC Audit', target_date: '2026-12-10', status: 'in_progress', payment_trigger_amount: 400000 },
      { id: 'm-4', title: 'Phase 4: Final Production Go-Live', target_date: '2026-12-31', status: 'pending', payment_trigger_amount: 300000 },
    ],
    remarks: [
      {
        id: 'rem-1',
        author_name: 'Ananya Sharma',
        author_role: 'HR Director',
        timestamp: '2026-10-01 10:00 AM',
        progress_at_moment: 0,
        text: 'Project initialized and officially assigned to Rahul Verma (Lead Manager) and Rohan Mehta (Associate Staff).',
      },
      {
        id: 'rem-2',
        author_name: 'Rohan Mehta',
        author_role: 'Associate Staff',
        timestamp: '2026-10-02 09:30 AM',
        progress_at_moment: 0,
        text: 'Assignment accepted. Commenced Phase 1 component wiring.',
      },
      {
        id: 'rem-3',
        author_name: 'Rahul Verma',
        author_role: 'Team Manager',
        timestamp: '2026-11-12 04:15 PM',
        progress_at_moment: 75,
        text: 'Progress advanced to 75%. All CRM pipeline stages and Indian GST Tax Invoicing verified.',
      },
    ],
  },
  {
    id: 'prj-2',
    project_code: 'PRJ-2026-002',
    title: 'Automated GST E-Invoicing Engine',
    client_name: 'Nexus Techworks Pvt Ltd',
    lead_manager: 'Rahul Verma',
    assigned_to: 'Vikram Malhotra',
    assigned_to_role: 'Finance Controller',
    assigned_by_hr: 'Ananya Sharma (HR Director)',
    start_date: '2026-11-01',
    deadline: '2026-11-30',
    budget: 650000,
    spent: 210000,
    progress: 40,
    assignment_status: 'accepted',
    status: 'in_progress',
    accepted_at: '2026-11-02 11:00 AM',
    started_at: '2026-11-03 09:00 AM',
    description: 'CBIC compliant tax invoice generator, QR code digital signature stamp, and GSTR-1/3B reconciliation.',
    checklists: [
      { id: 'chk-21', text: 'HSN/SAC 6-digit classification schema', done: true },
      { id: 'chk-22', text: 'Intra-state (CGST+SGST) vs Inter-state (IGST) split computation', done: true },
      { id: 'chk-23', text: 'NIC E-Invoice JSON payload generation & QR code embed', done: false },
    ],
    milestones: [
      { id: 'm-21', title: 'Tax Engine Validation', target_date: '2026-11-10', completion_date: '2026-11-09', status: 'achieved', payment_trigger_amount: 250000 },
      { id: 'm-22', title: 'Portal Integration & GSTR Filing', target_date: '2026-11-30', status: 'in_progress', payment_trigger_amount: 400000 },
    ],
    remarks: [
      {
        id: 'rem-21',
        author_name: 'Ananya Sharma',
        author_role: 'HR Director',
        timestamp: '2026-11-01 09:00 AM',
        progress_at_moment: 0,
        text: 'Assigned GST e-invoicing architecture to Vikram Malhotra.',
      },
      {
        id: 'rem-22',
        author_name: 'Vikram Malhotra',
        author_role: 'Finance Controller',
        timestamp: '2026-11-02 11:00 AM',
        progress_at_moment: 10,
        text: 'Accepted assignment. Began tax calculation rules implementation.',
      },
      {
        id: 'rem-23',
        author_name: 'Vikram Malhotra',
        author_role: 'Finance Controller',
        timestamp: '2026-11-14 02:30 PM',
        progress_at_moment: 40,
        text: 'Updated progress to 40%. CGST, SGST, and IGST rate calculators running in production.',
      },
    ],
  },
  {
    id: 'prj-3',
    project_code: 'PRJ-2026-003',
    title: 'Mobile WebRTC Attendance App',
    client_name: 'Quantum Retail Brands',
    lead_manager: 'Rahul Verma',
    assigned_to: 'Rohan Mehta',
    assigned_to_role: 'Associate Staff',
    assigned_by_hr: 'Ananya Sharma (HR Director)',
    start_date: '2026-09-15',
    deadline: '2026-11-10',
    budget: 450000,
    spent: 450000,
    progress: 100,
    assignment_status: 'accepted',
    status: 'completed',
    accepted_at: '2026-09-16 10:00 AM',
    started_at: '2026-09-16 02:00 PM',
    completed_at: '2026-11-08 05:45 PM',
    description: 'High-security biometric selfie face capture and shift late-coming/overtime penalty calculator.',
    checklists: [
      { id: 'chk-31', text: 'HTML5 MediaDevices WebRTC camera stream', done: true },
      { id: 'chk-32', text: 'Realtime GPS geofencing & late calculation', done: true },
      { id: 'chk-33', text: 'Client sign-off and production release', done: true },
    ],
    milestones: [
      { id: 'm-31', title: 'Camera Stream PoC', target_date: '2026-09-30', completion_date: '2026-09-28', status: 'achieved', payment_trigger_amount: 150000 },
      { id: 'm-32', title: 'Shift Calculation Engine', target_date: '2026-10-25', completion_date: '2026-10-22', status: 'achieved', payment_trigger_amount: 150000 },
      { id: 'm-33', title: 'Production Go-Live (Success)', target_date: '2026-11-10', completion_date: '2026-11-08', status: 'achieved', payment_trigger_amount: 150000 },
    ],
    remarks: [
      {
        id: 'rem-31',
        author_name: 'Ananya Sharma',
        author_role: 'HR Director',
        timestamp: '2026-09-15 09:30 AM',
        progress_at_moment: 0,
        text: 'Assigned mobile attendance app sprint to Rohan Mehta.',
      },
      {
        id: 'rem-32',
        author_name: 'Rohan Mehta',
        author_role: 'Associate Staff',
        timestamp: '2026-09-16 10:00 AM',
        progress_at_moment: 0,
        text: 'Accepted assignment and initiated camera stream integration.',
      },
      {
        id: 'rem-33',
        author_name: 'Rohan Mehta',
        author_role: 'Associate Staff',
        timestamp: '2026-11-08 05:45 PM',
        progress_at_moment: 100,
        text: '100% Work Completed! Client sign-off obtained and all checks passed successfully.',
      },
    ],
  },
  {
    id: 'prj-4',
    project_code: 'PRJ-2026-004',
    title: 'AI Lead Recommendation & WhatsApp Webhook',
    client_name: 'Kalinga Infotech Solutions',
    lead_manager: 'Rahul Verma',
    assigned_to: 'Rohan Mehta',
    assigned_to_role: 'Associate Staff',
    assigned_by_hr: 'Ananya Sharma (HR Director)',
    start_date: '2026-11-16',
    deadline: '2026-12-15',
    budget: 380000,
    spent: 0,
    progress: 0,
    assignment_status: 'pending_acceptance',
    status: 'assigned',
    description: 'Inbound WhatsApp webhook integration and automated lead routing with round-robin lead allocation.',
    checklists: [
      { id: 'chk-41', text: 'Meta Cloud API WhatsApp webhook handshake', done: false },
      { id: 'chk-42', text: 'Auto-lead distributor and team notification broadcast', done: false },
    ],
    milestones: [
      { id: 'm-41', title: 'Webhook Ingestion Pipeline', target_date: '2026-11-30', status: 'pending', payment_trigger_amount: 190000 },
      { id: 'm-42', title: 'Lead Scoring Integration', target_date: '2026-12-15', status: 'pending', payment_trigger_amount: 190000 },
    ],
    remarks: [
      {
        id: 'rem-41',
        author_name: 'Ananya Sharma',
        author_role: 'HR Director',
        timestamp: '2026-11-16 11:30 AM',
        progress_at_moment: 0,
        text: 'New project assigned by HR to Rohan Mehta. Awaiting assignee acceptance.',
      },
    ],
  },
];

const INITIAL_TASKS: TaskItem[] = [
  {
    id: 'tsk-101',
    task_code: 'TSK-101',
    project_id: 'prj-1',
    project_title: 'Odias Cloud ERP Enterprise 2.0',
    title: 'Integrate WebRTC Camera Selfie Capture',
    assignee: 'Rohan Mehta',
    assignee_role: 'Associate Staff',
    due_date: '2026-11-15',
    priority: 'high',
    progress: 100,
    status: 'done',
    completed_at: '2026-11-15 04:30 PM',
    remarks: [
      { id: 'tr-1', author_name: 'Rohan Mehta', author_role: 'Associate Staff', timestamp: '2026-11-15 04:30 PM', progress_at_moment: 100, text: 'Completed and verified across Chrome and Firefox.' }
    ]
  },
  {
    id: 'tsk-102',
    task_code: 'TSK-102',
    project_id: 'prj-1',
    project_title: 'Odias Cloud ERP Enterprise 2.0',
    title: 'Dynamic RBAC matrix with Add/View/Edit/Delete',
    assignee: 'Ananya Sharma',
    assignee_role: 'HR Director',
    due_date: '2026-11-18',
    priority: 'urgent',
    progress: 80,
    status: 'in_progress',
    remarks: [
      { id: 'tr-2', author_name: 'Ananya Sharma', author_role: 'HR Director', timestamp: '2026-11-16 02:00 PM', progress_at_moment: 80, text: 'Clearance matrix moved to dossier bottom per prompt requirement.' }
    ]
  },
  {
    id: 'tsk-103',
    task_code: 'TSK-103',
    project_id: 'prj-2',
    project_title: 'Automated GST E-Invoicing Engine',
    title: 'Tax invoice PDF generation & QR code stamp',
    assignee: 'Vikram Malhotra',
    assignee_role: 'Finance Controller',
    due_date: '2026-11-20',
    priority: 'medium',
    progress: 50,
    status: 'in_progress',
    remarks: [
      { id: 'tr-3', author_name: 'Vikram Malhotra', author_role: 'Finance Controller', timestamp: '2026-11-16 11:30 AM', progress_at_moment: 50, text: 'PDF canvas configured with Bank details and Authorized Signatory.' }
    ]
  },
  {
    id: 'tsk-104',
    task_code: 'TSK-104',
    project_id: 'prj-4',
    project_title: 'AI Lead Recommendation & WhatsApp Webhook',
    title: 'Configure Inbound Webhook Listener for Meta WhatsApp API',
    assignee: 'Rohan Mehta',
    assignee_role: 'Associate Staff',
    due_date: '2026-11-25',
    priority: 'high',
    progress: 0,
    status: 'assigned',
    remarks: [
      { id: 'tr-4', author_name: 'Ananya Sharma', author_role: 'HR Director', timestamp: '2026-11-16 11:30 AM', progress_at_moment: 0, text: 'Assigned to Rohan Mehta. Ready for acceptance.' }
    ]
  },
];

const INITIAL_DWR: DailyWorkReport[] = [
  {
    id: 'dwr-1',
    employee_name: 'Rohan Mehta',
    employee_role: 'Associate Staff',
    date: '2026-11-16',
    project_title: 'Odias Cloud ERP Enterprise 2.0',
    tasks_completed: 'Configured realtime filter toolbar across Employee, Manager, and HR directories with ID and Name search.',
    hours_spent: 7.5,
    progress_increment: 15,
    blockers: 'None. All automated tests passing.',
    status: 'approved',
  },
  {
    id: 'dwr-2',
    employee_name: 'Vikram Malhotra',
    employee_role: 'Finance Controller',
    date: '2026-11-16',
    project_title: 'Automated GST E-Invoicing Engine',
    tasks_completed: 'Added HSN/SAC code validation table and bank account transfer verification.',
    hours_spent: 6.0,
    progress_increment: 10,
    blockers: 'Awaiting client UAT server credentials.',
    status: 'reviewed',
  },
];

const INITIAL_DOCS: ProjectDocument[] = [
  {
    id: 'doc-1',
    project_title: 'Odias Cloud ERP Enterprise 2.0',
    name: 'Enterprise Architecture & Schema Specification',
    file_name: 'Architecture_SRS_v2.0.pdf',
    file_size: '4.8 MB',
    upload_date: '2026-10-02',
    doc_type: 'srs',
  },
  {
    id: 'doc-2',
    project_title: 'Automated GST E-Invoicing Engine',
    name: 'NIC E-Invoice API Integration Master Agreement',
    file_name: 'CBIC_GST_Contract.pdf',
    file_size: '1.9 MB',
    upload_date: '2026-11-01',
    doc_type: 'contract',
  },
  {
    id: 'doc-3',
    project_title: 'Mobile WebRTC Attendance App',
    name: 'Final UAT Sign-Off & Delivery Acceptance',
    file_name: 'Client_Success_SignOff.pdf',
    file_size: '1.2 MB',
    upload_date: '2026-11-08',
    doc_type: 'deliverable',
  },
];

// ----------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------
export const ProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const { emitEvent, subscribe } = useRealtime();
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab from URL path (Supporting all 14 submenus)
  const tabFromPath = useMemo(() => {
    const p = location.pathname.toLowerCase();
    if (p.includes('/projects/dashboard')) return 'dashboard';
    if (p.includes('/projects/all')) return 'all';
    if (p.includes('/projects/my')) return 'my';
    if (p.includes('/projects/assignments')) return 'assignments';
    if (p.includes('/projects/tasks')) return 'tasks';
    if (p.includes('/projects/checklists')) return 'checklists';
    if (p.includes('/projects/kanban')) return 'kanban';
    if (p.includes('/projects/timeline')) return 'timeline';
    if (p.includes('/projects/dwr')) return 'dwr';
    if (p.includes('/projects/timesheets')) return 'timesheets';
    if (p.includes('/projects/milestones')) return 'milestones';
    if (p.includes('/projects/documents')) return 'documents';
    if (p.includes('/projects/budget')) return 'budget';
    if (p.includes('/projects/reports')) return 'reports';
    return 'all';
  }, [location.pathname]);

  const [activeTab, setActiveTab] = useState<string>(tabFromPath);

  useEffect(() => {
    setActiveTab(tabFromPath);
  }, [tabFromPath]);

  // Persistent State (Backed by LocalStorage with fallback)
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem('odias_projects_master_v3');
      return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
    } catch {
      return INITIAL_PROJECTS;
    }
  });

  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    try {
      const saved = localStorage.getItem('odias_tasks_master_v3');
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
    } catch {
      return INITIAL_TASKS;
    }
  });

  const [dwrs, setDwrs] = useState<DailyWorkReport[]>(() => {
    try {
      const saved = localStorage.getItem('odias_dwr_master_v3');
      return saved ? JSON.parse(saved) : INITIAL_DWR;
    } catch {
      return INITIAL_DWR;
    }
  });

  const [documents, setDocuments] = useState<ProjectDocument[]>(INITIAL_DOCS);

  // Sync to LocalStorage on updates
  useEffect(() => {
    localStorage.setItem('odias_projects_master_v3', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('odias_tasks_master_v3', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('odias_dwr_master_v3', JSON.stringify(dwrs));
  }, [dwrs]);

  // Notifications Toast
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  // Full-page Dossier View
  const [viewProject, setViewProject] = useState<Project | null>(null);

  // Modals
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [dwrModalOpen, setDwrModalOpen] = useState(false);
  const [progressModalProject, setProgressModalProject] = useState<Project | null>(null);
  const [progressValue, setProgressValue] = useState<number>(0);
  const [progressRemark, setProgressRemark] = useState<string>('');
  const [remarkModalProject, setRemarkModalProject] = useState<Project | null>(null);
  const [newRemarkText, setNewRemarkText] = useState<string>('');

  // Project Creation Form State
  const [newTitle, setNewTitle] = useState('');
  const [newClient, setNewClient] = useState('');
  const [newBudget, setNewBudget] = useState(500000);
  const [newLeadManager, setNewLeadManager] = useState('Rahul Verma');
  const [newAssignee, setNewAssignee] = useState('Rohan Mehta');
  const [newAssigneeRole, setNewAssigneeRole] = useState('Associate Staff');
  const [newDeadline, setNewDeadline] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [newDescription, setNewDescription] = useState('');

  // Task Creation Form State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskProject, setNewTaskProject] = useState(projects[0]?.title || '');
  const [newTaskAssignee, setNewTaskAssignee] = useState('Rohan Mehta');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('high');
  const [newTaskDeadline, setNewTaskDeadline] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );

  // DWR Creation Form State
  const [dwrProject, setDwrProject] = useState(projects[0]?.title || '');
  const [dwrTasks, setDwrTasks] = useState('');
  const [dwrHours, setDwrHours] = useState(8);
  const [dwrProgress, setDwrProgress] = useState(10);
  const [dwrBlockers, setDwrBlockers] = useState('');

  // Filters for Table
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assignmentFilter, setAssignmentFilter] = useState('all');

  // Active Employees for Dynamic Assignment
  const [activeEmployees, setActiveEmployees] = useState<{ id: string; name: string; role_name: string }[]>([]);

  useEffect(() => {
    const fetchEmps = async () => {
      try {
        const res = await api.getEmployees().catch(() => ({ results: [] }));
        const list = res.results || res || [];
        const cleanList = list.filter((e: any) => !e.email?.includes('greenbacks.corp') && !e.email?.includes('binayak@example.com'));
        if (cleanList.length > 0) {
          const mapped = cleanList.map((e: any) => ({
            id: e.id,
            name: e.full_name || `${e.first_name || ''} ${e.last_name || ''}`.trim(),
            role_name: e.role_name || e.designation_title || 'Associate Staff',
          }));
          setActiveEmployees(mapped);
          if (mapped[0]?.name) {
            setNewAssignee((prev) => prev || mapped[0].name);
            setNewTaskAssignee((prev) => prev || mapped[0].name);
          }
        }
      } catch (e) {}
    };
    fetchEmps();
  }, []);

  // Realtime RBAC Action Permissions Listener
  const [, setRbacTick] = useState(0);
  useEffect(() => {
    const unsub = subscribe('rbac_permissions_updated', () => setRbacTick(t => t + 1));
    const handleLocal = () => setRbacTick(t => t + 1);
    window.addEventListener('kalinga_rbac_updated', handleLocal);
    return () => {
      unsub();
      window.removeEventListener('kalinga_rbac_updated', handleLocal);
    };
  }, [subscribe]);

  // Change tab and sync URL
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    navigate(`/app/projects/${tabId}`);
  };

  // ----------------------------------------------------
  // WORKFLOW ACTIONS: ASSIGN -> ACCEPT -> START -> PROGRESS -> REMARK -> SUCCESS
  // ----------------------------------------------------

  // 1. HR / Admin Creates & Assigns Project
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    const hrAuthor = user?.role_code === 'hr_manager' ? user.full_name : 'Ananya Sharma (HR Director)';
    const nextCode = `PRJ-2026-${String(projects.length + 1).padStart(3, '0')}`;
    const p: Project = {
      id: `prj-${Date.now()}`,
      project_code: nextCode,
      title: newTitle,
      client_name: newClient,
      lead_manager: newLeadManager,
      assigned_to: newAssignee,
      assigned_to_role: newAssigneeRole,
      assigned_by_hr: hrAuthor || 'HR Directorate',
      start_date: new Date().toISOString().split('T')[0],
      deadline: newDeadline,
      budget: Number(newBudget),
      spent: 0,
      progress: 0,
      assignment_status: 'pending_acceptance',
      status: 'assigned',
      description: newDescription || 'Enterprise project assignment initiated by HR.',
      checklists: [
        { id: `c-${Date.now()}-1`, text: 'Review scope and project requirements', done: false },
        { id: `c-${Date.now()}-2`, text: 'Core sprint implementation', done: false },
        { id: `c-${Date.now()}-3`, text: 'Quality Assurance & acceptance verification', done: false },
      ],
      remarks: [
        {
          id: `r-${Date.now()}`,
          author_name: hrAuthor || 'HR Directorate',
          author_role: 'HR Director',
          timestamp: new Date().toLocaleString(),
          progress_at_moment: 0,
          text: `Project officially assigned by HR to ${newAssignee} (${newAssigneeRole}). Awaiting acceptance.`,
        },
      ],
      milestones: [
        { id: `m-${Date.now()}-1`, title: 'Sprint Kickoff & Setup', target_date: newDeadline, status: 'in_progress', payment_trigger_amount: Number(newBudget) * 0.5 },
        { id: `m-${Date.now()}-2`, title: 'Final Delivery & Acceptance', target_date: newDeadline, status: 'pending', payment_trigger_amount: Number(newBudget) * 0.5 },
      ]
    };

    setProjects([p, ...projects]);
    setProjectModalOpen(false);

    emitEvent(
      'project.created',
      '🚀 New Project Assigned',
      `Project "${p.title}" assigned to ${p.assigned_to}. Deadline: ${p.deadline}`,
      'success',
      p.assigned_to,
      undefined,
      '/app/projects/all'
    );
    api.createNotification({
      title: '🚀 New Project Assigned',
      message: `Project "${p.title}" assigned to you. Deadline: ${p.deadline}`,
      notification_type: 'info',
      link: '/app/projects/all',
      target_name: p.assigned_to
    }).catch(() => {});

    showToast(`Project "${p.title}" assigned by HR to ${p.assigned_to}!`);

    // Reset Form
    setNewTitle('');
    setNewClient('');
    setNewDescription('');
  };

  // 2. Assignee Accepts Assignment
  const handleAcceptAssignment = (projectId: string) => {
    const author = user?.full_name || 'Rohan Mehta';
    const role = user?.role_name || 'Associate Staff';
    const ts = new Date().toLocaleString();

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          const updatedRemarks = [
            ...p.remarks,
            {
              id: `r-${Date.now()}`,
              author_name: author,
              author_role: role,
              timestamp: ts,
              progress_at_moment: p.progress,
              text: `Assignment accepted by ${author}. Ready to start sprint execution.`,
            },
          ];
          return {
            ...p,
            assignment_status: 'accepted',
            accepted_at: ts,
            remarks: updatedRemarks,
          };
        }
        return p;
      })
    );

    if (viewProject && viewProject.id === projectId) {
      setViewProject((prev) => prev ? { ...prev, assignment_status: 'accepted', accepted_at: ts } : null);
    }

    emitEvent(
      'project.accepted',
      '✅ Assignment Accepted',
      `${author} accepted project "${viewProject?.title || 'Project'}". Ready for sprint execution.`,
      'info',
      viewProject?.lead_manager || 'super_admin',
      undefined,
      '/app/projects/all'
    );
    api.createNotification({
      title: '✅ Assignment Accepted',
      message: `${author} accepted assignment for project "${viewProject?.title || 'Project'}".`,
      notification_type: 'info',
      link: '/app/projects/all',
      target_name: viewProject?.lead_manager || 'super_admin'
    }).catch(() => {});
    showToast(`Assignment successfully accepted by ${author}! You can now start work.`);
  };

  // 3. Start Work
  const handleStartWork = (projectId: string) => {
    const author = user?.full_name || 'Rohan Mehta';
    const role = user?.role_name || 'Associate Staff';
    const ts = new Date().toLocaleString();

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          const updatedRemarks = [
            ...p.remarks,
            {
              id: `r-${Date.now()}`,
              author_name: author,
              author_role: role,
              timestamp: ts,
              progress_at_moment: p.progress || 10,
              text: `Work commenced by ${author}. Project is now ACTIVE IN PROGRESS.`,
            },
          ];
          return {
            ...p,
            status: 'in_progress',
            started_at: ts,
            progress: p.progress === 0 ? 10 : p.progress,
            remarks: updatedRemarks,
          };
        }
        return p;
      })
    );

    if (viewProject && viewProject.id === projectId) {
      setViewProject((prev) => prev ? { ...prev, status: 'in_progress', started_at: ts, progress: prev.progress === 0 ? 10 : prev.progress } : null);
    }

    emitEvent(
      'project.started',
      '⚡ Sprint Work Commenced',
      `${author} commenced sprint work on project "${viewProject?.title || 'Project'}".`,
      'info',
      viewProject?.assigned_to,
      undefined,
      '/app/projects/all'
    );
    showToast(`Work started! Project is now Active In-Progress.`);
  };

  // 4. Update Progress Percentage (%) with Optional Direct Remark
  const handleOpenProgressModal = (p: Project) => {
    setProgressModalProject(p);
    setProgressValue(p.progress);
    setProgressRemark('');
  };

  const handleSaveProgress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!progressModalProject) return;

    const author = user?.full_name || 'Rahul Verma';
    const role = user?.role_name || 'Team Lead';
    const ts = new Date().toLocaleString();
    const isCompleted = progressValue >= 100;

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === progressModalProject.id) {
          const updatedRemarks = [...p.remarks];
          if (progressRemark.trim()) {
            updatedRemarks.push({
              id: `r-${Date.now()}`,
              author_name: author,
              author_role: role,
              timestamp: ts,
              progress_at_moment: progressValue,
              text: progressRemark.trim(),
            });
          }
          if (isCompleted) {
            updatedRemarks.push({
              id: `r-${Date.now()}-done`,
              author_name: author,
              author_role: role,
              timestamp: ts,
              progress_at_moment: 100,
              text: `🎉 Milestone Achieved! Project reached 100% completion. Certified SUCCESSFUL!`,
            });
          }

          return {
            ...p,
            progress: progressValue,
            status: isCompleted ? 'completed' : 'in_progress',
            completed_at: isCompleted ? ts : p.completed_at,
            remarks: updatedRemarks,
          };
        }
        return p;
      })
    );

    if (viewProject && viewProject.id === progressModalProject.id) {
      setViewProject((prev) =>
        prev
          ? {
              ...prev,
              progress: progressValue,
              status: isCompleted ? 'completed' : 'in_progress',
              completed_at: isCompleted ? ts : prev.completed_at,
            }
          : null
      );
    }

    const targetAssignee = progressModalProject.assigned_to;
    setProgressModalProject(null);

    emitEvent(
      'project.progress',
      isCompleted ? '🎉 Project Completed (100%)' : '📊 Project Progress Updated',
      `Project "${progressModalProject.title}" progress updated to ${progressValue}% by ${author}.`,
      isCompleted ? 'success' : 'info',
      targetAssignee,
      undefined,
      '/app/projects/all'
    );
    api.createNotification({
      title: isCompleted ? '🎉 Project Completed (100%)' : '📊 Project Progress Updated',
      message: `Project "${progressModalProject.title}" progress updated to ${progressValue}%.`,
      notification_type: isCompleted ? 'success' : 'info',
      link: '/app/projects/all',
      target_name: targetAssignee
    }).catch(() => {});

    showToast(isCompleted ? `🎉 Congratulations! Project completed with 100% SUCCESS!` : `Progress updated to ${progressValue}%!`);
  };

  // 5. Direct Remark Addition
  const handleOpenRemarkModal = (p: Project) => {
    setRemarkModalProject(p);
    setNewRemarkText('');
  };

  const handlePostDirectRemark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarkModalProject || !newRemarkText.trim()) return;

    const author = user?.full_name || 'Rahul Verma';
    const role = user?.role_name || 'Team Manager';
    const ts = new Date().toLocaleString();

    const remarkObj: ProjectRemark = {
      id: `r-${Date.now()}`,
      author_name: author,
      author_role: role,
      timestamp: ts,
      progress_at_moment: remarkModalProject.progress,
      text: newRemarkText.trim(),
    };

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === remarkModalProject.id) {
          return {
            ...p,
            remarks: [...p.remarks, remarkObj],
          };
        }
        return p;
      })
    );

    if (viewProject && viewProject.id === remarkModalProject.id) {
      setViewProject((prev) => (prev ? { ...prev, remarks: [...prev.remarks, remarkObj] } : null));
    }

    const targetAssignee = remarkModalProject.assigned_to;
    setRemarkModalProject(null);
    setNewRemarkText('');

    emitEvent(
      'project.remark',
      '💬 New Project Remark',
      `${author} posted remark on "${remarkModalProject.title}": "${remarkObj.text}"`,
      'info',
      targetAssignee,
      undefined,
      '/app/projects/all'
    );
    api.createNotification({
      title: '💬 New Project Remark',
      message: `New remark posted on "${remarkModalProject.title}" by ${author}: "${remarkObj.text}"`,
      notification_type: 'info',
      link: '/app/projects/all',
      target_name: targetAssignee
    }).catch(() => {});

    showToast(`Remark successfully recorded for ${remarkModalProject.project_code}!`);
  };

  // 6. Interactive Checklist Item Toggle
  const handleToggleChecklist = (projectId: string, checklistId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          const updatedChecklists = p.checklists.map((c) =>
            c.id === checklistId ? { ...c, done: !c.done } : c
          );
          const doneCount = updatedChecklists.filter((c) => c.done).length;
          const calculatedProgress = Math.round((doneCount / updatedChecklists.length) * 100);
          const isCompleted = calculatedProgress >= 100;

          return {
            ...p,
            checklists: updatedChecklists,
            progress: calculatedProgress,
            status: isCompleted ? 'completed' : p.status,
            completed_at: isCompleted ? new Date().toLocaleString() : p.completed_at,
          };
        }
        return p;
      })
    );

    if (viewProject && viewProject.id === projectId) {
      setViewProject((prev) => {
        if (!prev) return null;
        const updatedChecklists = prev.checklists.map((c) =>
          c.id === checklistId ? { ...c, done: !c.done } : c
        );
        const doneCount = updatedChecklists.filter((c) => c.done).length;
        const calculatedProgress = Math.round((doneCount / updatedChecklists.length) * 100);
        return {
          ...prev,
          checklists: updatedChecklists,
          progress: calculatedProgress,
          status: calculatedProgress >= 100 ? 'completed' : prev.status,
        };
      });
    }

    emitEvent('checklist.updated', 'Checklist Updated', `Checklist progress recomputed in real time.`, 'info');
  };

  // Task Creation Handler
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    const t: TaskItem = {
      id: `tsk-${Date.now()}`,
      task_code: `TSK-${tasks.length + 101}`,
      project_id: projects[0]?.id || 'prj-1',
      project_title: newTaskProject,
      title: newTaskTitle,
      assignee: newTaskAssignee,
      assignee_role: 'Associate Staff',
      due_date: newTaskDeadline,
      priority: newTaskPriority,
      progress: 0,
      status: 'assigned',
      remarks: [
        {
          id: `tr-${Date.now()}`,
          author_name: user?.full_name || 'Rahul Verma',
          author_role: user?.role_name || 'Team Lead',
          timestamp: new Date().toLocaleString(),
          progress_at_moment: 0,
          text: `Task created and assigned to ${newTaskAssignee}.`,
        },
      ],
    };
    setTasks([t, ...tasks]);
    setTaskModalOpen(false);
    setNewTaskTitle('');

    emitEvent(
      'task.created',
      '📋 New Sprint Task Assigned',
      `You have been assigned task "${t.title}" in ${t.project_title}. Priority: ${t.priority.toUpperCase()}`,
      t.priority === 'urgent' ? 'alert' : 'info',
      t.assignee,
      undefined,
      '/app/workspace/tasks'
    );
    api.createNotification({
      title: '📋 New Sprint Task Assigned',
      message: `You have been assigned task "${t.title}" in ${t.project_title}. Priority: ${t.priority.toUpperCase()}`,
      notification_type: t.priority === 'urgent' ? 'action_required' : 'info',
      link: '/app/workspace/tasks',
      target_name: t.assignee
    }).catch(() => {});

    showToast(`Task "${t.title}" assigned to ${t.assignee}!`);
  };

  // Advance Task
  const handleAdvanceTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const nextStatus = t.status === 'assigned' || t.status === 'todo' ? 'in_progress' : t.status === 'in_progress' ? 'review' : 'done';
          const newProgress = nextStatus === 'done' ? 100 : nextStatus === 'review' ? 80 : 40;

          emitEvent(
            'task.updated',
            '🔄 Task Status Updated',
            `Task "${t.title}" advanced to ${nextStatus.toUpperCase()} (Progress: ${newProgress}%) by ${user?.first_name || 'Lead'}`,
            nextStatus === 'done' ? 'success' : 'info',
            t.assignee,
            undefined,
            '/app/workspace/tasks'
          );
          api.createNotification({
            title: '🔄 Task Status Updated',
            message: `Task "${t.title}" advanced to ${nextStatus.toUpperCase()} (Progress: ${newProgress}%)`,
            notification_type: nextStatus === 'done' ? 'success' : 'info',
            link: '/app/workspace/tasks',
            target_name: t.assignee
          }).catch(() => {});

          if (nextStatus === 'done') {
            showToast(`Task "${t.title}" marked as COMPLETED SUCCESS! 🎉`);
          }
          return {
            ...t,
            status: nextStatus,
            progress: newProgress,
            completed_at: nextStatus === 'done' ? new Date().toLocaleString() : t.completed_at,
          };
        }
        return t;
      })
    );
  };

  // DWR Submit Handler
  const handleCreateDWR = (e: React.FormEvent) => {
    e.preventDefault();
    const d: DailyWorkReport = {
      id: `dwr-${Date.now()}`,
      employee_name: user?.full_name || 'Rohan Mehta',
      employee_role: user?.role_name || 'Associate Staff',
      date: new Date().toISOString().split('T')[0],
      project_title: dwrProject,
      tasks_completed: dwrTasks,
      hours_spent: Number(dwrHours),
      progress_increment: Number(dwrProgress),
      blockers: dwrBlockers || 'None reported.',
      status: 'submitted',
    };
    setDwrs([d, ...dwrs]);
    setDwrModalOpen(false);
    setDwrTasks('');
    setDwrBlockers('');
    emitEvent('dwr.submitted', 'Daily Work Report Submitted', `DWR logged for ${dwrProject} by ${d.employee_name}`, 'info');
    showToast(`Daily Work Report successfully submitted!`);
  };

  // ----------------------------------------------------
  // FILTERED DATASETS
  // ----------------------------------------------------
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Tab specific filter for "My Projects"
      if (activeTab === 'my') {
        const uName = (user?.full_name || '').toLowerCase();
        const uFirst = (user?.first_name || '').toLowerCase();
        const lead = (p.lead_manager || '').toLowerCase();
        const assigned = (p.assigned_to || '').toLowerCase();
        const isMine = (uName && (lead.includes(uName) || assigned.includes(uName))) ||
                       (uFirst && (lead.includes(uFirst) || assigned.includes(uFirst)));
        if (!isMine && user?.role_code !== 'super_admin') return false;
      }

      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (assignmentFilter !== 'all' && p.assignment_status !== assignmentFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const code = (p.project_code || '').toLowerCase();
        const title = (p.title || '').toLowerCase();
        const client = (p.client_name || '').toLowerCase();
        const lead = (p.lead_manager || '').toLowerCase();
        const assigned = (p.assigned_to || '').toLowerCase();
        return (
          code.includes(q) ||
          title.includes(q) ||
          client.includes(q) ||
          lead.includes(q) ||
          assigned.includes(q)
        );
      }
      return true;
    });
  }, [projects, activeTab, user, statusFilter, assignmentFilter, searchQuery]);

  // ----------------------------------------------------
  // COLUMNS DEFINITIONS
  // ----------------------------------------------------
  const projectColumns: ColumnDef<Project>[] = [
    {
      key: 'project_code',
      header: 'Code',
      render: (p) => <span className="font-mono font-bold text-slate-500">{p.project_code}</span>,
    },
    {
      key: 'title',
      header: 'Project & Client',
      render: (p) => (
        <div>
          <span className="font-bold text-slate-900 block">{p.title}</span>
          <span className="text-[11px] text-slate-500">Client: {p.client_name}</span>
        </div>
      ),
    },
    {
      key: 'assigned_info',
      header: 'Assigned By / To',
      render: (p) => (
        <div className="space-y-0.5 text-xs">
          <div className="text-[11px] text-purple-700 font-semibold flex items-center">
            <Shield className="w-3 h-3 mr-1" /> HR: {p.assigned_by_hr || 'Ananya Sharma'}
          </div>
          <div className="font-bold text-slate-800 flex items-center">
            <UserCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" /> {p.assigned_to}
          </div>
        </div>
      ),
    },
    {
      key: 'assignment_status',
      header: 'Acceptance Flow',
      align: 'center',
      render: (p) => {
        if (p.assignment_status === 'pending_acceptance') {
          return (
            <div className="space-y-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <Clock className="w-3 h-3 mr-1" /> Pending Acceptance
              </span>
              <button
                onClick={() => handleAcceptAssignment(p.id)}
                className="w-full px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] shadow-xs flex items-center justify-center space-x-1 cursor-pointer transition-all"
              >
                <Check className="w-3 h-3" />
                <span>Accept Project</span>
              </button>
            </div>
          );
        }
        if (p.assignment_status === 'accepted' && p.status === 'assigned') {
          return (
            <div className="space-y-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Accepted
              </span>
              <button
                onClick={() => handleStartWork(p.id)}
                className="w-full px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] shadow-xs flex items-center justify-center space-x-1 cursor-pointer transition-all"
              >
                <Play className="w-3 h-3" />
                <span>Start Work</span>
              </button>
            </div>
          );
        }
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Check className="w-3 h-3 mr-1" /> Accepted & Active
          </span>
        );
      },
    },
    {
      key: 'progress',
      header: 'Progress %',
      align: 'center',
      render: (p) => (
        <div className="w-28 space-y-1">
          <div className="flex justify-between text-[11px] font-mono font-bold text-slate-700">
            <span>{p.progress}%</span>
            {p.progress === 100 && <span className="text-emerald-600 font-black">SUCCESS</span>}
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                p.progress === 100
                  ? 'bg-emerald-500'
                  : p.progress > 50
                  ? 'bg-blue-600'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${p.progress}%` }}
            />
          </div>
          <button
            onClick={() => handleOpenProgressModal(p)}
            className="text-[10px] text-blue-600 hover:underline font-bold flex items-center justify-center w-full mt-0.5 cursor-pointer"
          >
            <Sliders className="w-2.5 h-2.5 mr-0.5" /> Update %
          </button>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Lifecycle Status',
      render: (p) => {
        if (p.status === 'completed' || p.progress === 100) {
          return (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              COMPLETED SUCCESS
            </span>
          );
        }
        return <StatusBadge status={p.status} />;
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (p) => (
        <div className="flex items-center justify-end space-x-1.5">
          <button
            onClick={() => handleOpenRemarkModal(p)}
            className="p-1.5 rounded-lg text-purple-600 hover:text-purple-800 hover:bg-purple-50 border border-purple-200 transition-colors cursor-pointer"
            title="Add Direct Remark / Progress Note"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewProject(p)}
            className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
            title="View Full Project Dossier"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  // ----------------------------------------------------
  // FULL PAGE PROJECT VIEW (When User clicks "View")
  // ----------------------------------------------------
  if (viewProject) {
    const isSuccess = viewProject.status === 'completed' || viewProject.progress >= 100;
    return (
      <div className="space-y-6 animate-in fade-in duration-200 pb-12">
        {/* Top Back Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setViewProject(null)}
              className="inline-flex items-center px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5 text-slate-500" />
              <span>Back to Projects Matrix</span>
            </button>
            <div className="h-5 w-px bg-slate-300 hidden sm:block" />
            <span className="text-xs text-slate-500 font-mono hidden sm:inline">
              Projects & Tasks / {viewProject.project_code}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleOpenProgressModal(viewProject)}
              className="inline-flex items-center px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition-colors cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 mr-1.5" />
              <span>Update Progress ({viewProject.progress}%)</span>
            </button>
            <button
              onClick={() => handleOpenRemarkModal(viewProject)}
              className="inline-flex items-center px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs border border-purple-200 transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
              <span>Add Remark</span>
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

        {/* SUCCESS CELEBRATION BANNER (When task/project is completed) */}
        {isSuccess && (
          <div className="p-5 rounded-2xl bg-linear-to-r from-emerald-600 via-teal-600 to-green-600 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
                <Sparkles className="w-7 h-7 animate-pulse text-amber-200" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight flex items-center">
                  <span>PROJECT SUCCESSFULLY DELIVERED! (100% SUCCESS)</span>
                </h3>
                <p className="text-xs text-emerald-100 mt-0.5">
                  All sprint work items and acceptance criteria verified by HR Directorate & Client on {viewProject.completed_at || 'Recent'}.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <span className="px-3 py-1.5 rounded-xl bg-white/20 border border-white/30 text-xs font-mono font-bold tracking-wider uppercase">
                Official Delivery Seal: CERTIFIED
              </span>
            </div>
          </div>
        )}

        {/* Hero Project Dossier Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-md">
              <FolderKanban className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {viewProject.title}
                </h1>
                <StatusBadge status={viewProject.status} />
              </div>
              <p className="text-sm text-slate-600 font-medium mt-0.5">
                Client: <strong className="text-slate-900">{viewProject.client_name}</strong> • Lead Manager: <strong>{viewProject.lead_manager}</strong>
              </p>
              <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500 font-mono">
                <span>Code: <strong>{viewProject.project_code}</strong></span>
                <span>•</span>
                <span>Timeline: <strong>{viewProject.start_date} to {viewProject.deadline}</strong></span>
                <span>•</span>
                <span>Assigned HR: <strong>{viewProject.assigned_by_hr}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
            <span className="text-xs text-slate-400 font-mono">Sprint Completion</span>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-3xl font-black text-slate-900 font-mono">
                {viewProject.progress}%
              </span>
              {isSuccess && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  SUCCESS
                </span>
              )}
            </div>
            <span className="text-[11px] text-emerald-600 font-mono mt-1">
              Budget: ₹{viewProject.budget.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* 3-Column Execution Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Assignment & Acceptance Lifecycle */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Assignment Lifecycle</h2>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Assigned by HR</span>
                <span className="font-bold text-slate-800 text-sm">{viewProject.assigned_by_hr}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Designated Assignee</span>
                <span className="font-bold text-slate-800 text-sm">{viewProject.assigned_to} ({viewProject.assigned_to_role})</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Acceptance Status</span>
                <div className="mt-1 flex items-center space-x-2">
                  {viewProject.assignment_status === 'pending_acceptance' ? (
                    <button
                      onClick={() => handleAcceptAssignment(viewProject.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs flex items-center space-x-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept Assignment Now</span>
                    </button>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold font-mono">
                      Accepted on {viewProject.accepted_at || 'Verified'}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Execution Status</span>
                <div className="mt-1">
                  {viewProject.status === 'assigned' && viewProject.assignment_status === 'accepted' ? (
                    <button
                      onClick={() => handleStartWork(viewProject.id)}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs flex items-center space-x-1 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Commence Work (Start)</span>
                    </button>
                  ) : (
                    <StatusBadge status={viewProject.status} />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Interactive Checklists */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Sprint Deliverable Checklists</h2>
            </div>
            <div className="space-y-2.5 text-xs">
              {viewProject.checklists.map((chk) => (
                <label
                  key={chk.id}
                  className="flex items-start space-x-2.5 p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={chk.done}
                    onChange={() => handleToggleChecklist(viewProject.id, chk.id)}
                    className="w-4 h-4 mt-0.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                  />
                  <span className={`text-slate-700 leading-snug ${chk.done ? 'line-through text-slate-400 font-medium' : 'font-semibold'}`}>
                    {chk.text}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Card 3: Milestones & Financials */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <Award className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-bold text-slate-900">Delivery Milestones</h2>
            </div>
            <div className="space-y-2 text-xs">
              {viewProject.milestones?.map((m) => (
                <div key={m.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">{m.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono">Target: {m.target_date} • ₹{m.payment_trigger_amount.toLocaleString('en-IN')}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    m.status === 'achieved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {m.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* DIRECT WORK REMARKS & PROGRESS LOG STREAM */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-purple-50 rounded-xl text-purple-700">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Direct Remarks & Realtime Work Log
                </h2>
                <p className="text-xs text-slate-500">
                  Realtime updates posted by HR, Managers, and Employees with progress percentage snapshots.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleOpenRemarkModal(viewProject)}
              className="inline-flex items-center px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Post New Remark</span>
            </button>
          </div>

          {/* Remarks Feed */}
          <div className="space-y-3">
            {viewProject.remarks.map((rem) => (
              <div
                key={rem.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all space-y-1.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-slate-900">{rem.author_name}</span>
                    <span className="px-2 py-0.5 rounded-md bg-purple-100/70 text-purple-800 text-[10px] font-bold font-mono">
                      {rem.author_role}
                    </span>
                    <span className="text-slate-400 text-[11px] font-mono">• {rem.timestamp}</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                    Progress @ {rem.progress_at_moment}%
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {rem.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // MAIN VIEW WITH 14 SUBMENUS
  // ----------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Success Notification Alert */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-xs text-emerald-700 underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
            <FolderKanban className="w-7 h-7 text-blue-600 mr-2.5" />
            Project & Task Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise orchestration: HR assignment, assignee acceptance, live % progress updates, work remarks, and certified completion.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* HR / Super Admin action to assign project */}
          {canPerformAction(user, 'projects', 'add') && (
            <button
              onClick={() => setProjectModalOpen(true)}
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 shadow-sm shadow-blue-500/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>HR Assign Project</span>
            </button>
          )}

          {canPerformAction(user, 'projects', 'add') && (
            <button
              onClick={() => setTaskModalOpen(true)}
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Assign Task</span>
            </button>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* TAB 1: PROJECT DASHBOARD */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Top KPI Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-slate-500 text-xs font-semibold block">Total Projects</span>
              <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
                {projects.length}
              </span>
              <span className="text-[11px] text-blue-600 font-medium">Enterprise Pipeline</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-slate-500 text-xs font-semibold block">Active In-Progress</span>
              <span className="text-2xl font-black text-blue-600 font-mono mt-1 block">
                {projects.filter((p) => p.status === 'in_progress').length}
              </span>
              <span className="text-[11px] text-blue-700 font-medium">Sprint Active</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-slate-500 text-xs font-semibold block">Completed (Success)</span>
              <span className="text-2xl font-black text-emerald-600 font-mono mt-1 block">
                {projects.filter((p) => p.status === 'completed' || p.progress === 100).length}
              </span>
              <span className="text-[11px] text-emerald-700 font-medium font-bold">100% Certified</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-slate-500 text-xs font-semibold block">Total Tasks Active</span>
              <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
                {tasks.length}
              </span>
              <span className="text-[11px] text-purple-600 font-medium">Across all squads</span>
            </div>
          </div>

          {/* Projects Live Snapshot Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((p) => (
              <div key={p.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-slate-400">{p.project_code}</span>
                    <h3 className="font-extrabold text-slate-900 text-sm">{p.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Assigned to: <strong>{p.assigned_to}</strong> ({p.assigned_to_role})</p>
                  </div>
                  {p.status === 'completed' || p.progress === 100 ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                      SUCCESS
                    </span>
                  ) : (
                    <StatusBadge status={p.status} />
                  )}
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono font-bold">
                    <span className="text-slate-600">Progress</span>
                    <span className="text-blue-600">{p.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        p.progress === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="font-mono text-slate-500">Deadline: {p.deadline}</span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleOpenProgressModal(p)}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 cursor-pointer"
                    >
                      Update %
                    </button>
                    <button
                      onClick={() => setViewProject(p)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                    >
                      View Dossier
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 2 & 3 & 4: ALL PROJECTS / MY PROJECTS / ASSIGNMENTS */}
      {/* ---------------------------------------------------- */}
      {(activeTab === 'all' || activeTab === 'my' || activeTab === 'assignments') && (
        <div className="space-y-4">
          {/* Active Flow Explainer Banner */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 text-xs text-blue-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <Sparkles className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <span className="font-extrabold block">
                  {activeTab === 'assignments'
                    ? 'HR Project Assignments & Acceptance Workflow'
                    : activeTab === 'my'
                    ? 'My Assigned Projects & Sprints'
                    : 'Enterprise Project Master Register'}
                </span>
                <span className="text-slate-600 text-[11px]">
                  Lifecycle: HR Assigns ➔ Assignee Accepts ➔ Start Work ➔ Update % Progress ➔ Add Remarks ➔ Success Completion Stamp.
                </span>
              </div>
            </div>

            <button
              onClick={() => setProjectModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 shadow-xs shrink-0 cursor-pointer"
            >
              + Assign New Project
            </button>
          </div>

          {/* Realtime Filter Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Live Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by code, title, client, assignee..."
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

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="all">Status: All Lifecycle Stages</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="completed">Completed (Success)</option>
                  <option value="on_hold">On Hold</option>
                </select>
              </div>

              {/* Acceptance Filter */}
              <div className="relative">
                <select
                  value={assignmentFilter}
                  onChange={(e) => setAssignmentFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="all">Acceptance: All</option>
                  <option value="pending_acceptance">Pending Acceptance</option>
                  <option value="accepted">Accepted & Active</option>
                </select>
              </div>
            </div>

            {/* Filter Summary */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-medium">
                Showing <strong className="text-slate-900">{filteredProjects.length}</strong> of{' '}
                <strong className="text-slate-900">{projects.length}</strong> registered projects
              </span>

              {(statusFilter !== 'all' || assignmentFilter !== 'all' || searchQuery.trim() !== '') && (
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setAssignmentFilter('all');
                    setSearchQuery('');
                  }}
                  className="inline-flex items-center space-x-1 text-slate-500 hover:text-rose-600 font-semibold text-xs cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>
          </div>

          {/* Universal DataTable */}
          <DataTable
            data={filteredProjects}
            columns={projectColumns}
            searchPlaceholder="Filter across projects..."
            initialPageSize={10}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 5: TASK MANAGEMENT */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Assigned sprint tasks with priorities, assignees, and real-time status advancement.
            </p>
            <button
              onClick={() => setTaskModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 cursor-pointer"
            >
              + Create Task
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Task #</th>
                  <th className="py-3 px-4">Task Title & Project</th>
                  <th className="py-3 px-4">Assignee</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Progress %</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {tasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-500">{t.task_code}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{t.title}</span>
                      <span className="text-[11px] text-slate-400">{t.project_title}</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{t.assignee}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{t.due_date}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        t.priority === 'urgent' ? 'bg-rose-100 text-rose-800' :
                        t.priority === 'high' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{t.progress}%</td>
                    <td className="py-3.5 px-4">
                      {t.status === 'done' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          SUCCESS
                        </span>
                      ) : (
                        <StatusBadge status={t.status} />
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {t.status !== 'done' ? (
                        <button
                          onClick={() => handleAdvanceTask(t.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] cursor-pointer inline-flex items-center space-x-1"
                        >
                          <span>Advance</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="text-emerald-700 font-bold text-[11px] inline-flex items-center">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Complete
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 6: SUBTASKS & CHECKLISTS */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'checklists' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Interactive deliverable checklists. Marking checklist items dynamically rolls up into the project completion percentage in real time.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((p) => (
              <div key={p.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">{p.title}</h3>
                    <span className="text-xs text-slate-400 font-mono">{p.project_code} • {p.assigned_to}</span>
                  </div>
                  <span className="font-mono font-bold text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg">
                    {p.progress}% Complete
                  </span>
                </div>

                <div className="space-y-2">
                  {p.checklists.map((chk) => (
                    <label
                      key={chk.id}
                      className="flex items-center space-x-2.5 p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={chk.done}
                        onChange={() => handleToggleChecklist(p.id, chk.id)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                      />
                      <span className={`text-xs ${chk.done ? 'line-through text-slate-400 font-medium' : 'text-slate-800 font-semibold'}`}>
                        {chk.text}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 7: KANBAN BOARD */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'kanban' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Visual agile Kanban board. Advance work items across stages to reach final 100% completion success.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { id: 'assigned', title: 'Assigned / To Do', color: 'border-slate-300 bg-slate-50/50' },
              { id: 'in_progress', title: 'In Progress (Active)', color: 'border-blue-300 bg-blue-50/30' },
              { id: 'review', title: 'Review / QA', color: 'border-purple-300 bg-purple-50/30' },
              { id: 'completed', title: 'Completed (Success 🎉)', color: 'border-emerald-300 bg-emerald-50/40' },
            ].map((col) => {
              const colProjects = projects.filter((p) => {
                if (col.id === 'assigned') return p.status === 'assigned';
                if (col.id === 'in_progress') return p.status === 'in_progress';
                if (col.id === 'review') return p.status === 'review';
                if (col.id === 'completed') return p.status === 'completed' || p.progress === 100;
                return false;
              });

              return (
                <div key={col.id} className={`p-4 rounded-2xl border ${col.color} space-y-3 min-h-[350px]`}>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <h3 className="font-extrabold text-xs text-slate-800">{col.title}</h3>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-white text-slate-700 shadow-2xs">
                      {colProjects.length}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {colProjects.map((p) => (
                      <div
                        key={p.id}
                        className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2 hover:border-blue-400 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-[10px] font-mono font-bold text-slate-400">{p.project_code}</span>
                          <span className="text-[10px] font-mono font-bold text-blue-600">{p.progress}%</span>
                        </div>
                        <h4 className="font-bold text-xs text-slate-900 leading-snug">{p.title}</h4>
                        <div className="text-[11px] text-slate-500">Assignee: <strong className="text-slate-800">{p.assigned_to}</strong></div>

                        <div className="flex items-center justify-between pt-1 text-[11px]">
                          <button
                            onClick={() => handleOpenRemarkModal(p)}
                            className="text-purple-600 hover:underline font-bold"
                          >
                            + Remark
                          </button>
                          <button
                            onClick={() => setViewProject(p)}
                            className="text-blue-600 hover:underline font-bold"
                          >
                            Details →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 8: PROJECT TIMELINE */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Sprint timelines, go-live commitments, and chronological delivery milestones.
          </p>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            {projects.map((p, idx) => (
              <div key={p.id} className="relative pl-6 pb-6 last:pb-0 border-l-2 border-blue-200 last:border-l-0">
                <div className={`absolute -left-2 top-0 w-4 h-4 rounded-full border-2 border-white ${
                  p.progress === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                }`} />
                <div className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-xs text-slate-400">{p.project_code}</span>
                    <h3 className="font-extrabold text-sm text-slate-900">{p.title}</h3>
                    {p.progress === 100 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                        SUCCESS DELIVERED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600">
                    Execution Window: <strong className="font-mono">{p.start_date}</strong> to <strong className="font-mono text-rose-700">{p.deadline}</strong> • Lead: <strong>{p.lead_manager}</strong> • Assignee: <strong>{p.assigned_to}</strong>
                  </p>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden max-w-md mt-2">
                    <div
                      className={`h-full rounded-full ${p.progress === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 9: DAILY WORK REPORTS (DWR) */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'dwr' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Staff Daily Work Reports (DWR): Logged hours, tasks completed, and blocker audits.
            </p>
            <button
              onClick={() => setDwrModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 cursor-pointer"
            >
              + Submit Daily Work Report
            </button>
          </div>

          <div className="space-y-3">
            {dwrs.map((d) => (
              <div key={d.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-slate-900">{d.employee_name}</span>
                    <span className="text-slate-400 font-mono">• {d.date}</span>
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-bold">
                      {d.project_title}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-700">{d.hours_spent} Hours Logged</span>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed">{d.tasks_completed}</p>
                {d.blockers && d.blockers !== 'None reported.' && (
                  <p className="text-xs text-amber-700 font-medium">Blockers: {d.blockers}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 10: TIMESHEET MANAGEMENT */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'timesheets' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Weekly project timesheet allocation and billable employee work hour logs.
          </p>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Project Assigned</th>
                  <th className="py-3 px-4 text-center">Mon</th>
                  <th className="py-3 px-4 text-center">Tue</th>
                  <th className="py-3 px-4 text-center">Wed</th>
                  <th className="py-3 px-4 text-center">Thu</th>
                  <th className="py-3 px-4 text-center">Fri</th>
                  <th className="py-3 px-4 text-center">Total Hrs</th>
                  <th className="py-3 px-4">HR Approval</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium font-mono text-center">
                <tr className="hover:bg-slate-50">
                  <td className="py-3.5 px-4 font-sans font-bold text-slate-900 text-left">Rohan Mehta</td>
                  <td className="py-3.5 px-4 font-sans text-slate-700 text-left">Odias Cloud ERP Enterprise 2.0</td>
                  <td className="py-3.5 px-4 text-slate-600">8.0</td>
                  <td className="py-3.5 px-4 text-slate-600">8.0</td>
                  <td className="py-3.5 px-4 text-slate-600">7.5</td>
                  <td className="py-3.5 px-4 text-slate-600">8.0</td>
                  <td className="py-3.5 px-4 text-slate-600">8.5</td>
                  <td className="py-3.5 px-4 font-black text-blue-700">40.0</td>
                  <td className="py-3.5 px-4 font-sans text-left">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      APPROVED
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-3.5 px-4 font-sans font-bold text-slate-900 text-left">Vikram Malhotra</td>
                  <td className="py-3.5 px-4 font-sans text-slate-700 text-left">Automated GST E-Invoicing Engine</td>
                  <td className="py-3.5 px-4 text-slate-600">7.0</td>
                  <td className="py-3.5 px-4 text-slate-600">7.5</td>
                  <td className="py-3.5 px-4 text-slate-600">6.0</td>
                  <td className="py-3.5 px-4 text-slate-600">8.0</td>
                  <td className="py-3.5 px-4 text-slate-600">7.0</td>
                  <td className="py-3.5 px-4 font-black text-blue-700">35.5</td>
                  <td className="py-3.5 px-4 font-sans text-left">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                      UNDER REVIEW
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 11: PROJECT MILESTONES */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'milestones' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Sprint milestones, client delivery gates, and automated payment release triggers.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((p) => (
              <div key={p.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-extrabold text-sm text-slate-900">{p.title}</h3>
                  <span className="text-xs font-mono font-bold text-slate-500">{p.project_code}</span>
                </div>
                <div className="space-y-2">
                  {p.milestones?.map((m) => (
                    <div key={m.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block">{m.title}</span>
                        <span className="text-[11px] text-slate-500 font-mono">Target Date: {m.target_date}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-800 block">₹{m.payment_trigger_amount.toLocaleString('en-IN')}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.status === 'achieved' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {m.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 12: PROJECT DOCUMENTS */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Verified project blueprints, contracts, architecture specifications, and sign-offs.
            </p>
            <button
              onClick={() => showToast('File upload completed. Document stored in project encrypted vault.')}
              className="px-3.5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 cursor-pointer"
            >
              + Upload Project Document
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <div key={doc.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {doc.file_size}
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs leading-snug">{doc.name}</h4>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">{doc.file_name}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-[10px] font-mono text-slate-400">{doc.upload_date}</span>
                  <button
                    onClick={() => showToast(`Downloading ${doc.file_name}...`)}
                    className="text-blue-600 hover:underline font-bold text-xs cursor-pointer inline-flex items-center"
                  >
                    <Download className="w-3.5 h-3.5 mr-1" /> Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 13: PROJECT BUDGET & COST */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'budget' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Financial capital allocation, actual sprint burn rate, and gross cost variance.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projects.map((p) => {
              const remaining = p.budget - p.spent;
              const burnPct = Math.round((p.spent / p.budget) * 100);
              return (
                <div key={p.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm text-slate-900 truncate">{p.title}</h3>
                    <span className="font-mono text-xs font-bold text-slate-400">{p.project_code}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                    <div className="p-2.5 bg-slate-50 rounded-xl">
                      <span className="text-slate-400 text-[10px] block">Allocated Budget</span>
                      <span className="font-black font-mono text-slate-900 text-sm block">
                        ₹{p.budget.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl">
                      <span className="text-slate-400 text-[10px] block">Actual Spent</span>
                      <span className="font-black font-mono text-rose-600 text-sm block">
                        ₹{p.spent.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-500">Budget Burn: {burnPct}%</span>
                      <span className="text-emerald-600 font-bold">Remaining: ₹{remaining.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full"
                        style={{ width: `${burnPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 14: PROJECT PROGRESS REPORTS */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Executive milestone progress audits, on-time velocity indices, and deliverable compliance.
            </p>
            <button
              onClick={() => showToast('Exporting executive project progress audit CSV...')}
              className="px-3.5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 cursor-pointer"
            >
              Export Progress Audit (.CSV)
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200">
                <span className="text-slate-500 text-xs font-semibold block">Average Sprint Velocity</span>
                <span className="text-3xl font-black text-blue-700 font-mono mt-1 block">94.2%</span>
                <span className="text-[11px] text-blue-600">On-Time Sprint Completion</span>
              </div>
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200">
                <span className="text-slate-500 text-xs font-semibold block">Delivered On-Schedule</span>
                <span className="text-3xl font-black text-emerald-700 font-mono mt-1 block">100%</span>
                <span className="text-[11px] text-emerald-600">Zero Critical Path Delays</span>
              </div>
              <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-200">
                <span className="text-slate-500 text-xs font-semibold block">Total DWR Hours</span>
                <span className="text-3xl font-black text-purple-700 font-mono mt-1 block">75.5 hrs</span>
                <span className="text-[11px] text-purple-600">Logged This Period</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 1: HR ASSIGN NEW PROJECT */}
      {/* ---------------------------------------------------- */}
      <Modal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        title="HR Directorate: Assign New Project"
        size="lg"
      >
        <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
          <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-900">
            <span className="font-bold block">HR Project Assignment Rule:</span>
            <span className="text-[11px] text-purple-700">
              When HR assigns a project, it starts in <strong>Pending Acceptance</strong> state. The assigned manager/employee accepts the project and begins execution.
            </span>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Project Title *</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. NextGen Microservices Migration"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Client Name *</label>
              <input
                type="text"
                required
                value={newClient}
                onChange={(e) => setNewClient(e.target.value)}
                placeholder="e.g. Tata Advanced Systems"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Budget Allocation (INR) *</label>
              <input
                type="number"
                required
                value={newBudget}
                onChange={(e) => setNewBudget(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Supervising Lead Manager *</label>
              <select
                value={newLeadManager}
                onChange={(e) => setNewLeadManager(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold"
              >
                <option value="Rahul Verma">Rahul Verma (Team Manager)</option>
                <option value="Sarah Jenkins">Sarah Jenkins (Super Admin)</option>
                <option value="Vikas Roy">Vikas Roy (Operations Lead)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Designated Assignee (Employee) *</label>
              <select
                value={newAssignee}
                onChange={(e) => {
                  setNewAssignee(e.target.value);
                  const matched = activeEmployees.find(emp => emp.name === e.target.value);
                  if (matched) setNewAssigneeRole(matched.role_name);
                  else setNewAssigneeRole(e.target.value === 'Vikram Malhotra' ? 'Finance Controller' : 'Associate Staff');
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold"
              >
                {activeEmployees.length > 0 ? (
                  activeEmployees.map((emp) => (
                    <option key={emp.id} value={emp.name}>
                      {emp.name} ({emp.role_name})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Rohan Mehta">Rohan Mehta (Associate Staff)</option>
                    <option value="Rakesh Mohanty">Rakesh Mohanty (Associate Staff)</option>
                    <option value="Vikram Malhotra">Vikram Malhotra (Finance Controller)</option>
                    <option value="Rahul Verma">Rahul Verma (Manager / Lead)</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Committed Delivery Deadline *</label>
            <input
              type="date"
              required
              value={newDeadline}
              onChange={(e) => setNewDeadline(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Sprint Scope & Objective</label>
            <textarea
              rows={3}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Outline specific objectives and key deliverables for the assignee..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setProjectModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 shadow-sm shadow-blue-500/25 cursor-pointer"
            >
              Dispatch Assignment
            </button>
          </div>
        </form>
      </Modal>

      {/* ---------------------------------------------------- */}
      {/* MODAL 2: UPDATE PROGRESS PERCENTAGE (%) */}
      {/* ---------------------------------------------------- */}
      {progressModalProject && (
        <Modal
          isOpen={!!progressModalProject}
          onClose={() => setProgressModalProject(null)}
          title={`Update Progress: ${progressModalProject.project_code}`}
          size="md"
        >
          <form onSubmit={handleSaveProgress} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="font-extrabold text-slate-900 block">{progressModalProject.title}</span>
              <span className="text-[11px] text-slate-500 font-mono">Assignee: {progressModalProject.assigned_to}</span>
            </div>

            {/* Progress Slider */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-700">Completion Percentage (%) *</label>
                <span className="text-xl font-black font-mono text-blue-700">{progressValue}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={progressValue}
                onChange={(e) => setProgressValue(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />

              {/* Quick Presets */}
              <div className="grid grid-cols-5 gap-1.5 mt-2.5">
                {[25, 50, 75, 90, 100].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setProgressValue(val)}
                    className={`py-1 text-[11px] font-mono font-bold rounded-lg border transition-colors cursor-pointer ${
                      progressValue === val
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>

            {/* Success notice when 100% selected */}
            {progressValue === 100 && (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-300 text-emerald-900 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold text-[11px]">
                  Setting 100% will transition this project to COMPLETED SUCCESS state!
                </span>
              </div>
            )}

            <div>
              <label className="block text-slate-700 font-bold mb-1">Work Update / Remark (Optional)</label>
              <textarea
                rows={2}
                value={progressRemark}
                onChange={(e) => setProgressRemark(e.target.value)}
                placeholder="What was completed in this iteration?"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setProgressModalProject(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 shadow-sm cursor-pointer"
              >
                Save Progress
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 3: DIRECT REMARK ENTRY */}
      {/* ---------------------------------------------------- */}
      {remarkModalProject && (
        <Modal
          isOpen={!!remarkModalProject}
          onClose={() => setRemarkModalProject(null)}
          title={`Add Work Remark: ${remarkModalProject.project_code}`}
          size="md"
        >
          <form onSubmit={handlePostDirectRemark} className="space-y-4 text-xs">
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-900">
              <span className="font-extrabold text-slate-900 block">{remarkModalProject.title}</span>
              <span className="text-[11px] text-purple-700">Current Sprint Progress: {remarkModalProject.progress}%</span>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Your Work Remark / Note *</label>
              <textarea
                rows={4}
                required
                value={newRemarkText}
                onChange={(e) => setNewRemarkText(e.target.value)}
                placeholder="Enter direct work update, blocker detail, or technical note..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setRemarkModalProject(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-500 shadow-sm cursor-pointer"
              >
                Post Remark
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 4: CREATE TASK */}
      {/* ---------------------------------------------------- */}
      <Modal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        title="Assign New Sprint Task"
        size="md"
      >
        <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Task Title *</label>
            <input
              type="text"
              required
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="e.g. Implement WebRTC Face Verification API"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Parent Project *</label>
            <select
              value={newTaskProject}
              onChange={(e) => setNewTaskProject(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.title}>
                  {p.title} ({p.project_code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Assignee *</label>
              <select
                value={newTaskAssignee}
                onChange={(e) => setNewTaskAssignee(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold"
              >
                {activeEmployees.length > 0 ? (
                  activeEmployees.map((emp) => (
                    <option key={emp.id} value={emp.name}>
                      {emp.name} ({emp.role_name})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Rohan Mehta">Rohan Mehta (Associate Staff)</option>
                    <option value="Ananya Sharma">Ananya Sharma (HR Director)</option>
                    <option value="Vikram Malhotra">Vikram Malhotra (Finance)</option>
                    <option value="Rahul Verma">Rahul Verma (Team Lead)</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Priority Level *</label>
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Due Date *</label>
            <input
              type="date"
              required
              value={newTaskDeadline}
              onChange={(e) => setNewTaskDeadline(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setTaskModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-sm cursor-pointer"
            >
              Create Task
            </button>
          </div>
        </form>
      </Modal>

      {/* ---------------------------------------------------- */}
      {/* MODAL 5: SUBMIT DAILY WORK REPORT (DWR) */}
      {/* ---------------------------------------------------- */}
      <Modal
        isOpen={dwrModalOpen}
        onClose={() => setDwrModalOpen(false)}
        title="Submit Daily Work Report (DWR)"
        size="md"
      >
        <form onSubmit={handleCreateDWR} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Project *</label>
            <select
              value={dwrProject}
              onChange={(e) => setDwrProject(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.title}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Tasks Completed Today *</label>
            <textarea
              rows={3}
              required
              value={dwrTasks}
              onChange={(e) => setDwrTasks(e.target.value)}
              placeholder="Detail specific tasks delivered and commits pushed..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Hours Spent *</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="16"
                required
                value={dwrHours}
                onChange={(e) => setDwrHours(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Estimated % Progress Added</label>
              <input
                type="number"
                min="0"
                max="100"
                value={dwrProgress}
                onChange={(e) => setDwrProgress(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Blockers / Dependencies</label>
            <input
              type="text"
              value={dwrBlockers}
              onChange={(e) => setDwrBlockers(e.target.value)}
              placeholder="Leave empty if none"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setDwrModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 shadow-sm cursor-pointer"
            >
              Submit Report
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectsPage;
