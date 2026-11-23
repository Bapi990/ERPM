import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FolderKanban, Plus, CheckCircle2, Clock, Calendar,
  Users, CheckSquare, Layers, DollarSign, ArrowRight, Filter,
  Eye, Edit3, Trash2, ArrowLeft, Printer, Building2, Shield,
  Activity, FileText, Check, X, RotateCcw, MessageSquare, Send,
  CalendarDays, Sliders, Sparkles, TrendingUp, AlertCircle,
  Award, Upload, Download, Search, FileCheck, Play, HelpCircle,
  CheckCircle, ThumbsUp, AlertTriangle, UserCheck, Briefcase, User,
  FolderPlus, UserPlus, Paperclip
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

export interface AttachedProjectDoc {
  id: string;
  name: string;
  file_name: string;
  file_size?: string;
  doc_type: string;
  uploaded_at: string;
  file_data?: string;
}

export interface DelegatedStaff {
  id: string;
  employee_id?: string;
  name: string;
  role: string;
  delegated_by: string;
  delegated_at: string;
  deliverable: string;
  deadline: string;
  status: 'assigned' | 'in_progress' | 'completed';
}

export interface Project {
  id: string;
  project_code: string;
  title: string;
  client_name: string;
  lead_manager: string;
  assigned_to: string; // Tier 1 Assignee: Manager or HR Leader
  assigned_to_role: string;
  assigned_by_hr: string; // Executive supervisor name who assigned the project
  assigned_at?: string; // Formatted date and time of assignment
  start_date: string;
  deadline: string; // Last date
  last_date?: string; // Explicit last date
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
  execution_plan?: string;
  category?: string;
  priority?: 'urgent' | 'high' | 'medium' | 'low';
  documents?: AttachedProjectDoc[];
  delegated_employees?: DelegatedStaff[];
}

export interface TaskItem {
  id: string;
  task_code: string;
  project_id: string;
  project_title: string;
  title: string;
  assignee: string;
  assignee_role: string;
  assigned_by?: string;
  assigned_at?: string;
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
    lead_manager: 'Rajesh Verma',
    assigned_to: 'Amit Patel',
    assigned_to_role: 'Associate Software Engineer',
    assigned_by_hr: 'Priya Sharma (HR Director)',
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
    lead_manager: 'Rajesh Verma',
    assigned_to: 'Sunil Sahoo',
    assigned_to_role: 'Accounts & Finance Lead',
    assigned_by_hr: 'Priya Sharma (HR Director)',
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
    lead_manager: 'Rajesh Verma',
    assigned_to: 'Sneha Mohanty',
    assigned_to_role: 'Sales Director',
    assigned_by_hr: 'Priya Sharma (HR Director)',
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
    lead_manager: 'Rajesh Verma',
    assigned_to: 'Sneha Mohanty',
    assigned_to_role: 'Sales Director',
    assigned_by_hr: 'Priya Sharma (HR Director)',
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
    assignee: 'Amit Patel',
    assignee_role: 'Associate Software Engineer',
    due_date: '2026-11-15',
    priority: 'high',
    progress: 100,
    status: 'done',
    completed_at: '2026-11-15 04:30 PM',
    remarks: [
      { id: 'tr-1', author_name: 'Amit Patel', author_role: 'Associate Software Engineer', timestamp: '2026-11-15 04:30 PM', progress_at_moment: 100, text: 'Completed and verified across Chrome and Firefox.' }
    ]
  },
  {
    id: 'tsk-102',
    task_code: 'TSK-102',
    project_id: 'prj-1',
    project_title: 'Odias Cloud ERP Enterprise 2.0',
    title: 'Dynamic RBAC matrix with Add/View/Edit/Delete',
    assignee: 'Priya Sharma',
    assignee_role: 'HR Manager',
    due_date: '2026-11-18',
    priority: 'urgent',
    progress: 80,
    status: 'in_progress',
    remarks: [
      { id: 'tr-2', author_name: 'Priya Sharma', author_role: 'HR Manager', timestamp: '2026-11-16 02:00 PM', progress_at_moment: 80, text: 'Clearance matrix moved to dossier bottom per prompt requirement.' }
    ]
  },
  {
    id: 'tsk-103',
    task_code: 'TSK-103',
    project_id: 'prj-2',
    project_title: 'Automated GST E-Invoicing Engine',
    title: 'Tax invoice PDF generation & QR code stamp',
    assignee: 'Sunil Sahoo',
    assignee_role: 'Accounts & Finance Lead',
    due_date: '2026-11-20',
    priority: 'medium',
    progress: 50,
    status: 'in_progress',
    remarks: [
      { id: 'tr-3', author_name: 'Sunil Sahoo', author_role: 'Accounts & Finance Lead', timestamp: '2026-11-16 11:30 AM', progress_at_moment: 50, text: 'PDF canvas configured with Bank details and Authorized Signatory.' }
    ]
  },
  {
    id: 'tsk-104',
    task_code: 'TSK-104',
    project_id: 'prj-4',
    project_title: 'AI Lead Recommendation & WhatsApp Webhook',
    title: 'Configure Inbound Webhook Listener for Meta WhatsApp API',
    assignee: 'Sneha Mohanty',
    assignee_role: 'Sales Director',
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
      const saved = localStorage.getItem('odias_projects_master_v4');
      return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
    } catch {
      return INITIAL_PROJECTS;
    }
  });

  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    try {
      const saved = localStorage.getItem('odias_tasks_master_v4');
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
    } catch {
      return INITIAL_TASKS;
    }
  });

  const [dwrs, setDwrs] = useState<DailyWorkReport[]>(() => {
    try {
      const saved = localStorage.getItem('odias_dwr_master_v4');
      return saved ? JSON.parse(saved) : INITIAL_DWR;
    } catch {
      return INITIAL_DWR;
    }
  });

  const [documents, setDocuments] = useState<ProjectDocument[]>(INITIAL_DOCS);

  // Sync to LocalStorage on updates
  useEffect(() => {
    localStorage.setItem('odias_projects_master_v4', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('odias_tasks_master_v4', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('odias_dwr_master_v4', JSON.stringify(dwrs));
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

  // Comprehensive Project Creation Form State
  const [newTitle, setNewTitle] = useState('');
  const [newProjectCode, setNewProjectCode] = useState('');
  const [newClient, setNewClient] = useState('');
  const [newCategory, setNewCategory] = useState('Software Engineering & Cloud');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('high');
  const [newBudget, setNewBudget] = useState(500000);
  const [newLeadManager, setNewLeadManager] = useState('Rajesh Verma');
  const [newAssignee, setNewAssignee] = useState('Rajesh Verma');
  const [newAssigneeRole, setNewAssigneeRole] = useState('Team Manager');
  const [newStartDate, setNewStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [newDeadline, setNewDeadline] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [newDescription, setNewDescription] = useState('');
  const [newExecutionPlan, setNewExecutionPlan] = useState('');
  const [newDocuments, setNewDocuments] = useState<AttachedProjectDoc[]>([]);

  // Multi-tier Delegation Modal State (Manager / HR assigns to Employee)
  const [delegateModalProject, setDelegateModalProject] = useState<Project | null>(null);
  const [delegateEmployee, setDelegateEmployee] = useState('');
  const [delegateRole, setDelegateRole] = useState('Associate Staff');
  const [delegateDeliverable, setDelegateDeliverable] = useState('');
  const [delegateInstructions, setDelegateInstructions] = useState('');
  const [delegateDeadline, setDelegateDeadline] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [delegatePriority, setDelegatePriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('high');

  // Helpers for Project Multi-Document Attachments
  const handleAddDocumentItem = () => {
    const newDoc: AttachedProjectDoc = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: '',
      file_name: '',
      doc_type: 'Technical Specification',
      uploaded_at: new Date().toLocaleDateString('en-IN'),
    };
    setNewDocuments((prev) => [...prev, newDoc]);
  };

  const handleUpdateDocumentItem = (id: string, field: keyof AttachedProjectDoc, value: string) => {
    setNewDocuments((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, [field]: value } : doc))
    );
  };

  const handleRemoveDocumentItem = (id: string) => {
    setNewDocuments((prev) => prev.filter((doc) => doc.id !== id));
  };

  // Task Creation Form State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskProject, setNewTaskProject] = useState(projects[0]?.title || '');
  const [newTaskAssignee, setNewTaskAssignee] = useState('Amit Patel');
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
            setNewAssignee(mapped[0].name);
            setNewAssigneeRole(mapped[0].role_name);
            setNewTaskAssignee(mapped[0].name);
            const mgr = mapped.find((m: { id: number; name: string; role_name: string }) => m.role_name.toLowerCase().includes('manager')) || mapped[0];
            setNewLeadManager(mgr.name);
          }
        }
      } catch (e) {}
    };
    fetchEmps();
  }, []);

  useEffect(() => {
    if (projects.length > 0 && (!newTaskProject || !projects.some(p => p.title === newTaskProject))) {
      setNewTaskProject(projects[0].title);
    }
  }, [projects, newTaskProject]);

  const currentFullName = (user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`).trim().toLowerCase();
  const currentEmail = (user?.email || '').toLowerCase();

  const isMyProject = (p: Project) => {
    const lead = (p.lead_manager || '').toLowerCase();
    const assigned = (p.assigned_to || '').toLowerCase();
    return (
      (currentFullName && (lead.includes(currentFullName) || assigned.includes(currentFullName))) ||
      (currentEmail && (lead.includes(currentEmail) || assigned.includes(currentEmail))) ||
      user?.role_code === 'super_admin'
    );
  };

  const myProjects = useMemo(() => {
    return projects.filter(isMyProject);
  }, [projects, currentFullName, currentEmail, user?.role_code]);

  const myTasks = useMemo(() => {
    return tasks.filter((t) => {
      const a = (t.assignee || '').toLowerCase();
      return (
        (currentFullName && (a.includes(currentFullName) || currentFullName.includes(a))) ||
        (currentEmail && (a.includes(currentEmail) || currentEmail.includes(a))) ||
        user?.role_code === 'super_admin'
      );
    });
  }, [tasks, currentFullName, currentEmail, user?.role_code]);

  const pendingCount = useMemo(() => {
    return projects.filter((p) => p.assignment_status === 'pending_acceptance').length;
  }, [projects]);

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
    if (!newTitle.trim()) {
      showToast('⚠️ Project Title is required');
      return;
    }
    const hrAuthor = user?.full_name || (user?.role_code === 'hr_manager' ? 'HR Directorate' : 'Executive Management');
    const autoCode = `PRJ-2026-${String(projects.length + 1).padStart(3, '0')}`;
    const effectiveCode = newProjectCode.trim() || autoCode;
    const effectiveAssignee = newAssignee || (activeEmployees[0]?.name || 'Amit Patel');
    const matchedEmp = activeEmployees.find(emp => emp.name === effectiveAssignee);
    const effectiveRole = matchedEmp?.role_name || newAssigneeRole || 'Associate Staff';
    const nowFormatted = new Date().toLocaleString('en-IN');
    const effectiveDeadline = newDeadline || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    const p: Project = {
      id: `prj-${Date.now()}`,
      project_code: effectiveCode,
      title: newTitle.trim(),
      client_name: newClient.trim() || 'Internal Enterprise Operations',
      lead_manager: newLeadManager || 'Rajesh Verma',
      assigned_to: effectiveAssignee,
      assigned_to_role: effectiveRole,
      assigned_by_hr: hrAuthor,
      assigned_at: nowFormatted,
      start_date: newStartDate || new Date().toISOString().split('T')[0],
      deadline: effectiveDeadline,
      last_date: effectiveDeadline,
      budget: Number(newBudget) || 500000,
      spent: 0,
      progress: 0,
      assignment_status: 'pending_acceptance',
      status: 'assigned',
      category: newCategory,
      priority: newPriority,
      description: newDescription.trim() || 'Enterprise project assignment initiated by Executive Directorate.',
      execution_plan: newExecutionPlan.trim() || '1. Sprint Kickoff and Requirement Analysis\n2. Architecture & Data Schema Setup\n3. Front-end Component Integration\n4. API & Real-time WebSockets Sync\n5. UAT & Client Delivery Sign-Off',
      documents: newDocuments.length > 0 ? [...newDocuments] : [
        {
          id: `doc-${Date.now()}-spec`,
          name: `${newTitle.trim()} - Technical Specification`,
          file_name: `${effectiveCode}_Specification.pdf`,
          file_size: '2.4 MB',
          doc_type: 'Technical Specification',
          uploaded_at: new Date().toLocaleDateString('en-IN'),
        }
      ],
      delegated_employees: [],
      checklists: [
        { id: `c-${Date.now()}-1`, text: 'Review scope and project requirements', done: false },
        { id: `c-${Date.now()}-2`, text: 'Core sprint implementation', done: false },
        { id: `c-${Date.now()}-3`, text: 'Quality Assurance & acceptance verification', done: false },
      ],
      remarks: [
        {
          id: `r-${Date.now()}`,
          author_name: hrAuthor,
          author_role: user?.role_name || 'HR Director',
          timestamp: nowFormatted,
          progress_at_moment: 0,
          text: `Project officially assigned by HR to ${effectiveAssignee} (${effectiveRole}) with last date ${effectiveDeadline}. Awaiting acceptance.`,
        },
      ],
      milestones: [
        { id: `m-${Date.now()}-1`, title: 'Sprint Kickoff & Setup', target_date: effectiveDeadline, status: 'in_progress', payment_trigger_amount: (Number(newBudget) || 500000) * 0.5 },
        { id: `m-${Date.now()}-2`, title: 'Final Delivery & Acceptance', target_date: effectiveDeadline, status: 'pending', payment_trigger_amount: (Number(newBudget) || 500000) * 0.5 },
      ]
    };

    setProjects((prev) => {
      const updated = [p, ...prev];
      try {
        localStorage.setItem('odias_projects_master_v4', JSON.stringify(updated));
      } catch (err) {}
      return updated;
    });

    setProjectModalOpen(false);

    emitEvent(
      'project.created',
      '🚀 New Project Created & Assigned',
      `Project "${p.title}" assigned to ${p.assigned_to}. Last Date: ${p.deadline}`,
      'success',
      p.assigned_to,
      undefined,
      '/app/projects/all'
    );
    api.createNotification({
      title: '🚀 New Project Assigned',
      message: `Project "${p.title}" assigned to you. Last Date: ${p.deadline}`,
      notification_type: 'info',
      link: '/app/projects/all',
      target_name: p.assigned_to
    }).catch(() => {});

    showToast(`🎉 Project "${p.title}" successfully created and assigned to ${p.assigned_to}!`);

    // Reset Form
    setNewTitle('');
    setNewProjectCode('');
    setNewClient('');
    setNewDescription('');
    setNewExecutionPlan('');
    setNewDocuments([]);
  };

  // 1B. Multi-Tier Delegation: Manager / HR assigns Deliverables to Employees
  const handleDelegateToEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!delegateModalProject) return;
    if (!delegateEmployee) {
      showToast('⚠️ Please select an employee to delegate');
      return;
    }
    if (!delegateDeliverable.trim()) {
      showToast('⚠️ Deliverable / Sprint Task title is required');
      return;
    }

    const delegatorName = user?.full_name || delegateModalProject.assigned_to || delegateModalProject.lead_manager || 'Team Lead';
    const nowFormatted = new Date().toLocaleString('en-IN');
    const newStaff: DelegatedStaff = {
      id: `del-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: delegateEmployee,
      role: delegateRole,
      delegated_by: delegatorName,
      delegated_at: nowFormatted,
      deliverable: delegateDeliverable.trim(),
      deadline: delegateDeadline,
      status: 'assigned',
    };

    // Create corresponding task item in tasks list
    const newTaskObj: TaskItem = {
      id: `tsk-${Date.now()}`,
      task_code: `TSK-${String(tasks.length + 101)}`,
      project_id: delegateModalProject.id,
      project_title: delegateModalProject.title,
      title: delegateDeliverable.trim(),
      assignee: delegateEmployee,
      assignee_role: delegateRole,
      assigned_by: delegatorName,
      assigned_at: nowFormatted,
      due_date: delegateDeadline,
      priority: delegatePriority,
      progress: 0,
      status: 'assigned',
      remarks: [
        {
          id: `tr-${Date.now()}`,
          author_name: delegatorName,
          author_role: user?.role_name || 'Manager',
          timestamp: nowFormatted,
          progress_at_moment: 0,
          text: `Sprint deliverable delegated to ${delegateEmployee}. Instructions: ${delegateInstructions || 'Execute as per project scope specifications.'}`,
        },
      ],
    };

    // Update projects list
    setProjects((prev) => {
      const updated = prev.map((p) => {
        if (p.id === delegateModalProject.id) {
          const existingDelegated = p.delegated_employees || [];
          const existingChecklists = p.checklists || [];
          const updatedDelegated = [...existingDelegated, newStaff];
          const updatedChecklists = [
            ...existingChecklists,
            {
              id: `c-${Date.now()}`,
              text: `${delegateDeliverable.trim()} (${delegateEmployee})`,
              done: false,
              assigned_to: delegateEmployee,
            },
          ];
          const updatedRemarks = [
            ...p.remarks,
            {
              id: `r-${Date.now()}`,
              author_name: delegatorName,
              author_role: user?.role_name || 'Manager',
              timestamp: nowFormatted,
              progress_at_moment: p.progress,
              text: `Delegated deliverable "${delegateDeliverable.trim()}" to ${delegateEmployee} (${delegateRole}) with deadline ${delegateDeadline}.`,
            },
          ];
          return {
            ...p,
            delegated_employees: updatedDelegated,
            checklists: updatedChecklists,
            remarks: updatedRemarks,
          };
        }
        return p;
      });
      try {
        localStorage.setItem('odias_projects_master_v4', JSON.stringify(updated));
      } catch (err) {}
      return updated;
    });

    // Update tasks list
    setTasks((prev) => {
      const updatedTasks = [newTaskObj, ...prev];
      try {
        localStorage.setItem('odias_tasks_master_v4', JSON.stringify(updatedTasks));
      } catch (err) {}
      return updatedTasks;
    });

    // Sync viewProject if currently opened
    if (viewProject && viewProject.id === delegateModalProject.id) {
      setViewProject((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          delegated_employees: [...(prev.delegated_employees || []), newStaff],
          checklists: [
            ...prev.checklists,
            {
              id: `c-${Date.now()}`,
              text: `${delegateDeliverable.trim()} (${delegateEmployee})`,
              done: false,
              assigned_to: delegateEmployee,
            },
          ],
          remarks: [
            ...prev.remarks,
            {
              id: `r-${Date.now()}`,
              author_name: delegatorName,
              author_role: user?.role_name || 'Manager',
              timestamp: nowFormatted,
              progress_at_moment: prev.progress,
              text: `Delegated deliverable "${delegateDeliverable.trim()}" to ${delegateEmployee} (${delegateRole}) with deadline ${delegateDeadline}.`,
            },
          ],
        };
      });
    }

    emitEvent(
      'task.assigned',
      '🎯 Task Delegated to Staff',
      `Deliverable "${delegateDeliverable.trim()}" delegated to ${delegateEmployee} on project "${delegateModalProject.title}"`,
      'info',
      delegateEmployee,
      undefined,
      '/app/projects/tasks'
    );

    showToast(`✅ Successfully delegated "${delegateDeliverable.trim()}" to ${delegateEmployee}!`);
    setDelegateModalProject(null);
    setDelegateDeliverable('');
    setDelegateInstructions('');
  };

  // 2. Assignee Accepts Assignment
  const handleAcceptAssignment = (projectId: string) => {
    const author = user?.full_name || 'Staff Member';
    const role = user?.role_name || 'Associate Staff';
    const ts = new Date().toLocaleString();

    setProjects((prev) => {
      const updated = prev.map((p) => {
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
            assignment_status: 'accepted' as const,
            accepted_at: ts,
            remarks: updatedRemarks,
          };
        }
        return p;
      });
      try {
        localStorage.setItem('odias_projects_master_v4', JSON.stringify(updated));
      } catch (err) {}
      return updated;
    });

    if (viewProject && viewProject.id === projectId) {
      setViewProject((prev) => prev ? { ...prev, assignment_status: 'accepted', accepted_at: ts } : null);
    }

    const matched = projects.find(p => p.id === projectId);

    emitEvent(
      'project.accepted',
      '✅ Assignment Accepted',
      `${author} accepted project "${matched?.title || 'Project'}". Ready for sprint execution.`,
      'info',
      matched?.lead_manager || 'super_admin',
      undefined,
      '/app/projects/all'
    );
    api.createNotification({
      title: '✅ Assignment Accepted',
      message: `${author} accepted assignment for project "${matched?.title || 'Project'}".`,
      notification_type: 'info',
      link: '/app/projects/all',
      target_name: matched?.lead_manager || 'super_admin'
    }).catch(() => {});
    showToast(`🎉 Assignment successfully accepted! You can now start sprint execution.`);
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
    if (!newTaskTitle.trim()) {
      showToast('⚠️ Task title is required');
      return;
    }
    const matchedProject = projects.find(p => p.title === newTaskProject) || projects[0];
    const effectiveAssignee = newTaskAssignee || (activeEmployees[0]?.name || 'Amit Patel');
    const matchedEmp = activeEmployees.find(emp => emp.name === effectiveAssignee);
    const effectiveRole = matchedEmp?.role_name || 'Associate Staff';

    const t: TaskItem = {
      id: `tsk-${Date.now()}`,
      task_code: `TSK-${tasks.length + 101}`,
      project_id: matchedProject?.id || 'prj-1',
      project_title: newTaskProject || matchedProject?.title || 'Odias Cloud ERP Enterprise 2.0',
      title: newTaskTitle.trim(),
      assignee: effectiveAssignee,
      assignee_role: effectiveRole,
      due_date: newTaskDeadline || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      priority: newTaskPriority,
      progress: 0,
      status: 'assigned',
      remarks: [
        {
          id: `tr-${Date.now()}`,
          author_name: user?.full_name || 'Team Lead',
          author_role: user?.role_name || 'Lead Manager',
          timestamp: new Date().toLocaleString(),
          progress_at_moment: 0,
          text: `Task created and assigned to ${effectiveAssignee}.`,
        },
      ],
    };

    setTasks((prev) => {
      const updated = [t, ...prev];
      try {
        localStorage.setItem('odias_tasks_master_v4', JSON.stringify(updated));
      } catch (err) {}
      return updated;
    });

    if (matchedProject) {
      setProjects((prev) => {
        const updated = prev.map((p) =>
          p.id === matchedProject.id
            ? {
                ...p,
                checklists: [
                  ...p.checklists,
                  { id: `chk-${Date.now()}`, text: `[${t.task_code}] ${t.title} (${t.assignee})`, done: false }
                ]
              }
            : p
        );
        try {
          localStorage.setItem('odias_projects_master_v4', JSON.stringify(updated));
        } catch (err) {}
        return updated;
      });
    }

    setTaskModalOpen(false);
    setNewTaskTitle('');

    emitEvent(
      'task.created',
      '📋 New Sprint Task Assigned',
      `You have been assigned task "${t.title}" in ${t.project_title}. Priority: ${t.priority.toUpperCase()}`,
      t.priority === 'urgent' ? 'alert' : 'info',
      t.assignee,
      undefined,
      '/app/projects/tasks'
    );
    api.createNotification({
      title: '📋 New Sprint Task Assigned',
      message: `You have been assigned task "${t.title}" in ${t.project_title}. Priority: ${t.priority.toUpperCase()}`,
      notification_type: t.priority === 'urgent' ? 'action_required' : 'info',
      link: '/app/projects/tasks',
      target_name: t.assignee
    }).catch(() => {});

    showToast(`🎉 Task "${t.title}" successfully assigned to ${t.assignee}!`);
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
      header: 'Assigned By / To (Tier 1 & 2)',
      render: (p) => (
        <div className="space-y-1 text-xs">
          <div className="text-[11px] text-purple-700 font-semibold flex items-center">
            <Shield className="w-3 h-3 mr-1" /> HR: {p.assigned_by_hr || 'Ananya Sharma'}
          </div>
          <div className="font-bold text-slate-800 flex items-center">
            <UserCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" /> {p.assigned_to}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Last Date: <strong className="text-slate-700">{p.last_date || p.deadline}</strong>
          </div>
          {p.delegated_employees && p.delegated_employees.length > 0 && (
            <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-bold text-[10px]">
              👥 {p.delegated_employees.length} Staff Delegated
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'assignment_status',
      header: 'Acceptance Flow',
      align: 'center',
      render: (p) => {
        const uFull = (user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`).trim().toLowerCase();
        const uEmail = (user?.email || '').toLowerCase();
        const pAssignee = (p.assigned_to || '').trim().toLowerCase();

        // Exact assignee match
        const isAssignedToCurrent = Boolean(
          (uFull && (pAssignee.includes(uFull) || uFull.includes(pAssignee))) ||
          (uEmail && (pAssignee.includes(uEmail) || uEmail.includes(pAssignee)))
        );

        if (p.assignment_status === 'pending_acceptance') {
          if (isAssignedToCurrent) {
            return (
              <div className="space-y-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <Clock className="w-3 h-3 mr-1" /> Action Required
                </span>
                <button
                  onClick={() => handleAcceptAssignment(p.id)}
                  className="w-full px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] shadow-xs flex items-center justify-center space-x-1 cursor-pointer transition-all active:scale-95"
                >
                  <Check className="w-3 h-3" />
                  <span>Accept Project</span>
                </button>
              </div>
            );
          }
          return (
            <div className="space-y-0.5 text-center">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <Clock className="w-3 h-3 mr-1" /> Pending Acceptance
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">
                Assigned: {p.assigned_to}
              </span>
            </div>
          );
        }
        if (p.assignment_status === 'accepted' && p.status === 'assigned') {
          if (isAssignedToCurrent) {
            return (
              <div className="space-y-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Accepted
                </span>
                <button
                  onClick={() => handleStartWork(p.id)}
                  className="w-full px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] shadow-xs flex items-center justify-center space-x-1 cursor-pointer transition-all active:scale-95"
                >
                  <Play className="w-3 h-3" />
                  <span>Start Work</span>
                </button>
              </div>
            );
          }
          return (
            <div className="space-y-0.5 text-center">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Accepted
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">
                Assigned: {p.assigned_to}
              </span>
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
          {canPerformAction(user, 'projects', 'edit') && (
            <button
              onClick={() => {
                setDelegateModalProject(p);
                if (activeEmployees.length > 0) {
                  setDelegateEmployee(activeEmployees[0].name);
                  setDelegateRole(activeEmployees[0].role_name);
                }
              }}
              className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 border border-emerald-200 transition-colors cursor-pointer"
              title="Delegate Staff / Assign Deliverable to Employee"
            >
              <UserPlus className="w-3.5 h-3.5" />
            </button>
          )}
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
                    (() => {
                      const uFull = (user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`).trim().toLowerCase();
                      const uEmail = (user?.email || '').toLowerCase();
                      const pAssignee = (viewProject.assigned_to || '').trim().toLowerCase();
                      const isAssigned = Boolean(
                        (uFull && (pAssignee.includes(uFull) || uFull.includes(pAssignee))) ||
                        (uEmail && (pAssignee.includes(uEmail) || uEmail.includes(pAssignee)))
                      );
                      if (isAssigned) {
                        return (
                          <button
                            onClick={() => handleAcceptAssignment(viewProject.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs flex items-center space-x-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept Assignment Now</span>
                          </button>
                        );
                      }
                      return (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-bold text-xs font-mono">
                          Pending Assignee Acceptance ({viewProject.assigned_to})
                        </span>
                      );
                    })()
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

        {/* 4. DETAILED EXECUTION ROADMAP & SPECIFICATIONS VAULT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Detailed Execution Roadmap */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Execution Roadmap ("Kya kya hoga kaise karna hai")</h2>
                  <p className="text-[11px] text-slate-500">Structured phased execution blueprint for the sprint</p>
                </div>
              </div>
            </div>
            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 text-xs font-mono leading-relaxed whitespace-pre-line text-slate-700">
              {viewProject.execution_plan || (
                `1. Sprint Kickoff and Requirement Analysis\n2. Architecture & Data Schema Setup\n3. Front-end Component Integration\n4. API & Real-time WebSockets Sync\n5. UAT & Client Delivery Sign-Off`
              )}
            </div>
          </div>

          {/* Attached Specifications & Multi-Document Vault */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Paperclip className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Attached Documents Vault</h2>
                  <p className="text-[11px] text-slate-500">Official technical contracts, SRS, and architecture briefs</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {(viewProject.documents?.length || 0) > 0 ? `${viewProject.documents?.length} Files` : '1 Document'}
              </span>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {viewProject.documents && viewProject.documents.length > 0 ? (
                viewProject.documents.map((doc) => (
                  <div key={doc.id} className="p-3 bg-slate-50 hover:bg-slate-100/70 rounded-xl border border-slate-200 flex items-center justify-between transition-colors">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-bold text-slate-800 block text-xs truncate">{doc.name || doc.file_name}</span>
                        <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-mono">
                          <span className="text-blue-600 font-bold">{doc.doc_type}</span>
                          <span>•</span>
                          <span>Uploaded {doc.uploaded_at}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => showToast(`📥 Downloading document: ${doc.name || doc.file_name}`)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-blue-50 hover:border-blue-300 text-blue-600 text-[10px] font-bold shadow-2xs cursor-pointer flex items-center space-x-1 shrink-0"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">{viewProject.title} - Technical Architecture.pdf</span>
                      <span className="text-[10px] text-slate-500 font-mono">Technical Specification • Uploaded {viewProject.start_date}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => showToast(`📥 Downloading: ${viewProject.title} Technical Architecture.pdf`)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-blue-600 text-[10px] font-bold shadow-2xs cursor-pointer flex items-center space-x-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 5. TIER 2 DELEGATED STAFF REGISTER (Manager / HR -> Employees) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Tier 2 Delegated Staff Register (Staff Allocation)</h2>
                <p className="text-[11px] text-slate-500">
                  Sprint deliverables delegated by Lead Manager ({viewProject.lead_manager}) & HR ({viewProject.assigned_to}) to team members
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setDelegateModalProject(viewProject);
                if (activeEmployees.length > 0) {
                  setDelegateEmployee(activeEmployees[0].name);
                  setDelegateRole(activeEmployees[0].role_name);
                }
              }}
              className="inline-flex items-center px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-xs cursor-pointer transition-all self-start sm:self-auto"
            >
              <UserPlus className="w-3.5 h-3.5 mr-1.5" />
              <span>+ Delegate Staff Member</span>
            </button>
          </div>

          {viewProject.delegated_employees && viewProject.delegated_employees.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {viewProject.delegated_employees.map((staff) => (
                <div key={staff.id} className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2 hover:bg-white hover:shadow-xs transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 font-black text-xs flex items-center justify-center">
                        {staff.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-900 text-xs block leading-tight">{staff.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{staff.role}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                      {staff.status}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Deliverable</span>
                    <span className="font-semibold text-slate-800 text-xs block mt-0.5 leading-snug">{staff.deliverable}</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
                    <span>Deadline: <strong className="text-slate-800">{staff.deadline}</strong></span>
                    <span>By: {staff.delegated_by}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center bg-slate-50/50 rounded-xl border border-slate-100 space-y-2">
              <Users className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-600">No team members delegated to this project yet.</p>
              <p className="text-[11px] text-slate-400">The assigned Manager or HR can click "+ Delegate Staff Member" to assign specific sprint deliverables.</p>
            </div>
          )}
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
            {activeTab === 'all'
              ? 'Enterprise Projects Master Register'
              : activeTab === 'my'
              ? 'My Projects & Personal Sprints Workspace'
              : activeTab === 'assignments'
              ? 'HR Project Assignments & Allocation Directorate'
              : activeTab === 'tasks'
              ? 'Sprint Task Board & Work Items'
              : 'Project & Task Management'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {activeTab === 'all'
              ? 'Comprehensive directory of all organizational projects, milestones, budgets, and real-time lifecycle telemetry.'
              : activeTab === 'my'
              ? `Personalized workspace for ${user?.full_name || 'Staff'}: track your assigned projects, accept assignments, and advance tasks.`
              : activeTab === 'assignments'
              ? 'HR and Management workspace for allocating projects, monitoring team workloads, and tracking staff acceptance SLAs.'
              : 'Enterprise orchestration: HR assignment, assignee acceptance, live % progress updates, work remarks, and certified completion.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Add Project */}
          {canPerformAction(user, 'projects', 'add') && (
            <button
              onClick={() => {
                setNewProjectCode(`PRJ-2026-${String(projects.length + 1).padStart(3, '0')}`);
                setProjectModalOpen(true);
              }}
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 shadow-sm shadow-blue-500/25 transition-all cursor-pointer"
            >
              <FolderPlus className="w-4 h-4 mr-1.5" />
              <span>+ Add Project</span>
            </button>
          )}

          {/* Add Task */}
          {canPerformAction(user, 'projects', 'add') && (
            <button
              onClick={() => setTaskModalOpen(true)}
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>+ Add Task</span>
            </button>
          )}

          {/* Delegate Staff Deliverable (Tier 2) */}
          {canPerformAction(user, 'projects', 'edit') && projects.length > 0 && (
            <button
              onClick={() => {
                setDelegateModalProject(projects[0]);
                if (activeEmployees.length > 0) {
                  setDelegateEmployee(activeEmployees[0].name);
                  setDelegateRole(activeEmployees[0].role_name);
                }
              }}
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-500 shadow-sm shadow-purple-500/25 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4 mr-1.5" />
              <span>Delegate Staff</span>
            </button>
          )}
        </div>
      </div>

      {/* Executive Submodule Navigation Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-slate-200">
        <button
          onClick={() => handleTabChange('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 shrink-0 ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
          }`}
        >
          <FolderKanban className="w-3.5 h-3.5" />
          <span>All Projects</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
            activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {projects.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('my')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 shrink-0 ${
            activeTab === 'my'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>My Projects</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
            activeTab === 'my' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {myProjects.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('assignments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 shrink-0 ${
            activeTab === 'assignments'
              ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/25'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Project Assignments</span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-400 text-slate-950 font-bold">
              {pendingCount} Pending
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange('tasks')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 shrink-0 ${
            activeTab === 'tasks'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Task Management</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
            activeTab === 'tasks' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {tasks.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('kanban')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 shrink-0 ${
            activeTab === 'kanban'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Kanban Board</span>
        </button>

        <button
          onClick={() => handleTabChange('dwr')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 shrink-0 ${
            activeTab === 'dwr'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Daily Work Reports</span>
        </button>
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
      {/* TAB: ALL PROJECTS (Master Register) */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'all' && (
        <div className="space-y-5">
          {/* Top Quick Telemetry */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-slate-500 text-[11px] sm:text-xs font-semibold block">Total Projects</span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-0.5 block">{projects.length}</span>
              <span className="text-[10px] sm:text-[11px] text-blue-600 font-semibold">Enterprise Directory</span>
            </div>
            <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-slate-500 text-[11px] sm:text-xs font-semibold block">Active In-Progress</span>
              <span className="text-xl sm:text-2xl font-black text-blue-600 font-mono mt-0.5 block">
                {projects.filter((p) => p.status === 'in_progress').length}
              </span>
              <span className="text-[10px] sm:text-[11px] text-blue-700 font-semibold">Active Execution</span>
            </div>
            <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-slate-500 text-[11px] sm:text-xs font-semibold block">Pending Acceptance</span>
              <span className="text-xl sm:text-2xl font-black text-amber-600 font-mono mt-0.5 block">
                {projects.filter((p) => p.assignment_status === 'pending_acceptance').length}
              </span>
              <span className="text-[10px] sm:text-[11px] text-amber-700 font-semibold">Awaiting Staff Sign-off</span>
            </div>
            <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-slate-500 text-[11px] sm:text-xs font-semibold block">Completed (Success)</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-600 font-mono mt-0.5 block">
                {projects.filter((p) => p.status === 'completed' || p.progress >= 100).length}
              </span>
              <span className="text-[10px] sm:text-[11px] text-emerald-700 font-semibold">Milestones Delivered</span>
            </div>
          </div>

          {/* Realtime Filter Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

          {/* Master DataTable */}
          <DataTable
            data={filteredProjects}
            columns={projectColumns}
            searchPlaceholder="Filter across projects..."
            initialPageSize={10}
            pageSizeOptions={[10, 25, 50, 100]}
          />

          {/* Embedded Live Sprint Tasks Registry Tray */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Live Sprint Tasks Overview ({tasks.length} Active Tasks)</h3>
                  <p className="text-[11px] text-slate-500">Instant visibility of tasks allocated to team members across all parent projects.</p>
                </div>
              </div>
              <button
                onClick={() => setTaskModalOpen(true)}
                className="inline-flex items-center px-3.5 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 shadow-xs cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>Assign New Task</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Task #</th>
                    <th className="py-2.5 px-3">Task Title & Project</th>
                    <th className="py-2.5 px-3">Assignee</th>
                    <th className="py-2.5 px-3">Priority</th>
                    <th className="py-2.5 px-3">Deadline</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tasks.slice(0, 8).map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-600">{t.task_code}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 block">{t.title}</span>
                        <span className="text-[11px] text-slate-400">{t.project_title}</span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{t.assignee}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          t.priority === 'urgent' ? 'bg-rose-100 text-rose-800' :
                          t.priority === 'high' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{t.due_date}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.status === 'done' ? 'bg-emerald-100 text-emerald-800' :
                          t.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          t.status === 'review' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {t.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleAdvanceTask(t.id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[10px] cursor-pointer"
                        >
                          {t.status === 'assigned' || t.status === 'todo' ? 'Start ➔' : t.status === 'in_progress' ? 'Review ➔' : t.status === 'review' ? 'Complete ➔' : 'Done ✓'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB: MY PROJECTS (Personal Workspace) */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'my' && (
        <div className="space-y-5">
          {/* Action Required Banner for Pending Projects */}
          {myProjects.some(p => p.assignment_status === 'pending_acceptance') && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <span className="font-extrabold text-sm block">Action Required: Project Assignment Awaiting Your Acceptance</span>
                  <p className="text-xs text-amber-700">
                    HR has dispatched a new project to your workspace. Review the scope details below and click <strong>"Accept Project"</strong> to initiate your sprint clock.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Personal Telemetry KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-slate-500 text-[11px] sm:text-xs font-semibold block">My Assigned Projects</span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-0.5 block">{myProjects.length}</span>
              <span className="text-[10px] sm:text-[11px] text-blue-600 font-semibold">Active Portfolios</span>
            </div>
            <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-slate-500 text-[11px] sm:text-xs font-semibold block">Awaiting My Acceptance</span>
              <span className="text-xl sm:text-2xl font-black text-amber-600 font-mono mt-0.5 block">
                {myProjects.filter(p => p.assignment_status === 'pending_acceptance').length}
              </span>
              <span className="text-[10px] sm:text-[11px] text-amber-700 font-semibold">Action Pending</span>
            </div>
            <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-slate-500 text-[11px] sm:text-xs font-semibold block">My Active Sprint Tasks</span>
              <span className="text-xl sm:text-2xl font-black text-indigo-600 font-mono mt-0.5 block">
                {myTasks.filter(t => t.status !== 'done').length}
              </span>
              <span className="text-[10px] sm:text-[11px] text-indigo-700 font-semibold">In Pipeline</span>
            </div>
            <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-slate-500 text-[11px] sm:text-xs font-semibold block">My Completed Work</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-600 font-mono mt-0.5 block">
                {myProjects.filter(p => p.status === 'completed' || p.progress >= 100).length}
              </span>
              <span className="text-[10px] sm:text-[11px] text-emerald-700 font-semibold">Successfully Shipped</span>
            </div>
          </div>

          {/* User's Projects Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Projects Assigned to Me</h3>
                <p className="text-[11px] text-slate-500">Accept assignments, advance milestones, and submit daily work reports.</p>
              </div>
              <button
                onClick={() => setDwrModalOpen(true)}
                className="inline-flex items-center px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>Submit DWR Report</span>
              </button>
            </div>

            {myProjects.length > 0 ? (
              <DataTable
                data={myProjects}
                columns={projectColumns}
                searchPlaceholder="Search within my projects..."
                initialPageSize={10}
              />
            ) : (
              <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-3">
                <FolderKanban className="w-10 h-10 text-slate-400 mx-auto" />
                <div>
                  <h4 className="font-extrabold text-slate-700 text-sm">No Projects Assigned To You Yet</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    When HR or management assigns a project or sprint to your profile, it will immediately appear here.
                  </p>
                </div>
                <button
                  onClick={() => handleTabChange('all')}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 cursor-pointer shadow-xs"
                >
                  Browse Enterprise Projects Master
                </button>
              </div>
            )}
          </div>

          {/* User's Assigned Tasks Board */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">My Individual Sprint Tasks ({myTasks.length})</h3>
                <p className="text-[11px] text-slate-500">Execute your sprint items and update your progress status in real-time.</p>
              </div>
              <button
                onClick={() => setTaskModalOpen(true)}
                className="inline-flex items-center px-3.5 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>New Subtask</span>
              </button>
            </div>

            {myTasks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {myTasks.map((t) => (
                  <div key={t.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 hover:border-blue-300 transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {t.task_code}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.status === 'done' ? 'bg-emerald-100 text-emerald-800' :
                        t.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        t.status === 'review' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {t.status.toUpperCase()}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-slate-900 text-xs line-clamp-2">{t.title}</h4>
                      <span className="text-[11px] text-slate-400 block mt-0.5 font-medium">{t.project_title}</span>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-500 font-mono">Due: {t.due_date}</span>
                      <button
                        onClick={() => handleAdvanceTask(t.id)}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] cursor-pointer shadow-xs"
                      >
                        {t.status === 'assigned' || t.status === 'todo' ? 'Start Task ➔' : t.status === 'in_progress' ? 'Submit Review ➔' : t.status === 'review' ? 'Mark Done ✓' : 'Done ✓'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No individual tasks assigned yet.</p>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB: PROJECT ASSIGNMENTS (Directorate Allocation Matrix) */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'assignments' && (
        <div className="space-y-5">
          {/* Directorate Telemetry KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-slate-500 text-[11px] sm:text-xs font-semibold block">Total Allocations</span>
              <span className="text-xl sm:text-2xl font-black text-purple-600 font-mono mt-0.5 block">{projects.length}</span>
              <span className="text-[10px] sm:text-[11px] text-purple-700 font-semibold">Enterprise Scope</span>
            </div>
            <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-slate-500 text-[11px] sm:text-xs font-semibold block">Pending Staff Acceptance</span>
              <span className="text-xl sm:text-2xl font-black text-amber-600 font-mono mt-0.5 block">
                {projects.filter(p => p.assignment_status === 'pending_acceptance').length}
              </span>
              <span className="text-[10px] sm:text-[11px] text-amber-700 font-semibold">Awaiting Acceptance</span>
            </div>
            <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-slate-500 text-[11px] sm:text-xs font-semibold block">Accepted & Executing</span>
              <span className="text-xl sm:text-2xl font-black text-blue-600 font-mono mt-0.5 block">
                {projects.filter(p => p.assignment_status === 'accepted').length}
              </span>
              <span className="text-[10px] sm:text-[11px] text-blue-700 font-semibold">Active In Sprints</span>
            </div>
            <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-slate-500 text-[11px] sm:text-xs font-semibold block">Active Assignees</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-600 font-mono mt-0.5 block">
                {activeEmployees.length || 5}
              </span>
              <span className="text-[10px] sm:text-[11px] text-emerald-700 font-semibold">Qualified Staff</span>
            </div>
          </div>

          {/* Squad & Team Member Allocation Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Squad Allocation Matrix & Capacity</h3>
                <p className="text-[11px] text-slate-500">Monitor workload distribution and dispatch projects directly to team members.</p>
              </div>
              <button
                onClick={() => setProjectModalOpen(true)}
                className="inline-flex items-center px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                <span>+ Assign New Project</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              {(activeEmployees.length > 0 ? activeEmployees : [
                { id: '1', name: 'Priya Sharma', role_name: 'HR Manager' },
                { id: '2', name: 'Rajesh Verma', role_name: 'Engineering Manager' },
                { id: '3', name: 'Amit Patel', role_name: 'Associate Software Engineer' },
                { id: '4', name: 'Sneha Mohanty', role_name: 'Sales Director' },
                { id: '5', name: 'Sunil Sahoo', role_name: 'Accounts Executive' }
              ]).map((emp) => {
                const assignedProjCount = projects.filter(p => (p.assigned_to || '').toLowerCase().includes(emp.name.toLowerCase())).length;
                const pendingCount = projects.filter(p => (p.assigned_to || '').toLowerCase().includes(emp.name.toLowerCase()) && p.assignment_status === 'pending_acceptance').length;
                return (
                  <div key={emp.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3 hover:border-purple-300 transition-all">
                    <div>
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-full bg-purple-700 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                          {emp.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-slate-900 text-xs block truncate">{emp.name}</span>
                          <span className="text-[10px] text-slate-500 block truncate">{emp.role_name}</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Allocated:</span>
                        <span className="font-bold font-mono text-purple-700">{assignedProjCount} Projects</span>
                      </div>
                      {pendingCount > 0 && (
                        <div className="flex items-center justify-between text-[10px] text-amber-700 font-semibold mt-1">
                          <span>Pending Sign-off:</span>
                          <span className="font-mono bg-amber-100 px-1 rounded">{pendingCount}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setNewAssignee(emp.name);
                        setNewAssigneeRole(emp.role_name);
                        setProjectModalOpen(true);
                      }}
                      className="w-full py-1.5 rounded-lg bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 font-bold text-[10px] cursor-pointer transition-colors text-center"
                    >
                      + Assign Project
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Assignments & Acceptance Audit Register Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Project Assignments & Acceptance Tracking</h3>
                <p className="text-[11px] text-slate-500">Audit trail of who assigned each project, designated assignee, and acceptance verification timestamp.</p>
              </div>
            </div>

            <DataTable
              data={projects}
              columns={projectColumns}
              searchPlaceholder="Filter project assignments..."
              initialPageSize={10}
            />
          </div>
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
      {/* MODAL 1: CREATE & ASSIGN NEW PROJECT (TIER 1) */}
      {/* ---------------------------------------------------- */}
      <Modal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        title="+ Create & Assign Project (Tier 1 Executive Allocation)"
        size="lg"
      >
        <form onSubmit={handleCreateProject} className="space-y-4 text-xs max-h-[80vh] overflow-y-auto pr-1">
          <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 text-blue-900">
            <span className="font-bold block flex items-center">
              <Shield className="w-3.5 h-3.5 mr-1 text-blue-600" /> Executive Project Lifecycle:
            </span>
            <span className="text-[11px] text-blue-700">
              Create an enterprise project with execution roadmap & attached documents, then assign to an HR Leader or Team Manager (Tier 1), who can delegate specific tasks to team members (Tier 2).
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold mb-1">Project Full Name / Title *</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. NextGen Autonomous ERP Core 2.0"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Project Code *</label>
              <input
                type="text"
                value={newProjectCode}
                onChange={(e) => setNewProjectCode(e.target.value)}
                placeholder={`PRJ-2026-${String(projects.length + 1).padStart(3, '0')}`}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Client / Sponsor *</label>
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
              <label className="block text-slate-700 font-bold mb-1">Project Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold"
              >
                <option value="Software Engineering & Cloud">Software Engineering & Cloud</option>
                <option value="Enterprise ERP & Infrastructure">Enterprise ERP & Infrastructure</option>
                <option value="Finance & GST Compliance">Finance & GST Compliance</option>
                <option value="HRMS & Workforce Automations">HRMS & Workforce Automations</option>
                <option value="Sales & CRM Growth">Sales & CRM Growth</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Priority</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold"
              >
                <option value="urgent">🔴 Urgent</option>
                <option value="high">🟠 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Start Date</label>
              <input
                type="date"
                value={newStartDate}
                onChange={(e) => setNewStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Last Date / Deadline *</label>
              <input
                type="date"
                required
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono font-bold text-blue-700"
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

          {/* Tier 1 Executive Assignee (Manager or HR Lead) */}
          <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200/80 space-y-3">
            <span className="font-bold text-purple-900 flex items-center text-xs">
              <UserCheck className="w-3.5 h-3.5 mr-1 text-purple-600" /> Tier 1 Executive Assignment (Manager / HR Directorate):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-purple-900 font-bold mb-1">Supervising Lead Manager *</label>
                <select
                  value={newLeadManager}
                  onChange={(e) => setNewLeadManager(e.target.value)}
                  className="w-full px-3 py-2 border border-purple-300 rounded-xl bg-white font-semibold"
                >
                  <option value="Rajesh Verma">Rajesh Verma (Team Manager)</option>
                  <option value="Priya Sharma">Priya Sharma (HR Director)</option>
                  <option value="Sarah Jenkins">Sarah Jenkins (Super Admin)</option>
                  <option value="Vikas Roy">Vikas Roy (Operations Lead)</option>
                </select>
              </div>

              <div>
                <label className="block text-purple-900 font-bold mb-1">Executive Assignee (Manager / HR) *</label>
                <select
                  value={newAssignee}
                  onChange={(e) => {
                    setNewAssignee(e.target.value);
                    const matched = activeEmployees.find(emp => emp.name === e.target.value);
                    if (matched) setNewAssigneeRole(matched.role_name);
                    else setNewAssigneeRole(e.target.value.toLowerCase().includes('manager') ? 'Team Manager' : 'Associate Staff');
                  }}
                  className="w-full px-3 py-2 border border-purple-300 rounded-xl bg-white font-semibold"
                >
                  {activeEmployees.length > 0 ? (
                    activeEmployees.map((emp) => (
                      <option key={emp.id} value={emp.name}>
                        {emp.name} ({emp.role_name})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Rajesh Verma">Rajesh Verma (Team Manager)</option>
                      <option value="Priya Sharma">Priya Sharma (HR Director)</option>
                      <option value="Amit Patel">Amit Patel (Associate Software Engineer)</option>
                      <option value="Sunil Sahoo">Sunil Sahoo (Accounts & Finance Lead)</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Project Scope & Objectives</label>
            <textarea
              rows={2}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Outline high-level objectives, deliverable milestones, and success criteria..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Detailed Execution Roadmap ("Kya kya hoga kaise karna hai")</label>
            <textarea
              rows={3}
              value={newExecutionPlan}
              onChange={(e) => setNewExecutionPlan(e.target.value)}
              placeholder="1. Sprint Kickoff and Requirement Analysis&#10;2. Architecture & Data Schema Setup&#10;3. Front-end Component Integration&#10;4. API & Real-time WebSockets Sync&#10;5. UAT & Client Delivery Sign-Off"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium"
            />
          </div>

          {/* MULTI-DOCUMENT ATTACHMENTS WITH + ICON */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <Paperclip className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-slate-900 text-xs">Project Documents & Specifications Vault</span>
                <span className="text-[10px] text-slate-500 font-mono">({newDocuments.length} Attached)</span>
              </div>
              <button
                type="button"
                onClick={handleAddDocumentItem}
                className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] shadow-xs cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>+ Add Document</span>
              </button>
            </div>

            {newDocuments.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic py-1">
                No custom documents attached yet. Click "+ Add Document" above to attach SRS blueprints, contracts, or architectural designs.
              </p>
            ) : (
              <div className="space-y-2">
                {newDocuments.map((doc, idx) => (
                  <div key={doc.id} className="p-2.5 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-2xs">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                      <input
                        type="text"
                        placeholder="Document Name / Title (e.g. Architecture SRS)"
                        value={doc.name}
                        onChange={(e) => handleUpdateDocumentItem(doc.id, 'name', e.target.value)}
                        className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium w-full"
                      />
                      <select
                        value={doc.doc_type}
                        onChange={(e) => handleUpdateDocumentItem(doc.id, 'doc_type', e.target.value)}
                        className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold w-full bg-slate-50"
                      >
                        <option value="Technical Specification">Technical Specification</option>
                        <option value="Contract / Agreement">Contract / Agreement</option>
                        <option value="Architecture Design">Architecture Design</option>
                        <option value="SRS / Requirements">SRS / Requirements</option>
                        <option value="UAT Deliverable">UAT Deliverable</option>
                        <option value="Compliance Certificate">Compliance Certificate</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                      <span className="text-[10px] text-emerald-600 font-mono font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ✓ Attached ({doc.uploaded_at})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDocumentItem(doc.id)}
                        className="p-1 rounded-md text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                        title="Remove Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
              + Create & Assign Project
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

      {/* ---------------------------------------------------- */}
      {/* MODAL 6: MULTI-TIER DELEGATION (MANAGER / HR -> EMPLOYEES) */}
      {/* ---------------------------------------------------- */}
      {delegateModalProject && (
        <Modal
          isOpen={!!delegateModalProject}
          onClose={() => setDelegateModalProject(null)}
          title={`Delegate Sprint Deliverable to Staff (${delegateModalProject.project_code})`}
          size="lg"
        >
          <form onSubmit={handleDelegateToEmployee} className="space-y-4 text-xs max-h-[80vh] overflow-y-auto pr-1">
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-900 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900">{delegateModalProject.title}</span>
                <span className="font-mono text-xs font-bold text-purple-700 bg-white px-2 py-0.5 rounded border border-purple-200">
                  {delegateModalProject.project_code}
                </span>
              </div>
              <div className="text-[11px] text-purple-700 flex flex-wrap gap-2">
                <span>Manager Lead: <strong>{delegateModalProject.lead_manager}</strong></span>
                <span>•</span>
                <span>Assigned HR: <strong>{delegateModalProject.assigned_to}</strong></span>
                <span>•</span>
                <span>Project Last Date: <strong>{delegateModalProject.last_date || delegateModalProject.deadline}</strong></span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Target Project</label>
                <select
                  value={delegateModalProject.id}
                  onChange={(e) => {
                    const found = projects.find(p => p.id === e.target.value);
                    if (found) setDelegateModalProject(found);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.project_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Designated Staff Member (Employee) *</label>
                <select
                  value={delegateEmployee}
                  onChange={(e) => {
                    setDelegateEmployee(e.target.value);
                    const matched = activeEmployees.find(emp => emp.name === e.target.value);
                    if (matched) setDelegateRole(matched.role_name);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold text-purple-900"
                >
                  {activeEmployees.length > 0 ? (
                    activeEmployees.map((emp) => (
                      <option key={emp.id} value={emp.name}>
                        {emp.name} ({emp.role_name})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Amit Patel">Amit Patel (Associate Software Engineer)</option>
                      <option value="Pooja Das">Pooja Das (Senior Frontend Developer)</option>
                      <option value="Sunil Sahoo">Sunil Sahoo (Accounts & Finance Lead)</option>
                      <option value="Manas Kumar Rout">Manas Kumar Rout (Operations Associate)</option>
                      <option value="Sneha Mohanty">Sneha Mohanty (Sales Director)</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Deliverable / Sprint Task Title *</label>
              <input
                type="text"
                required
                value={delegateDeliverable}
                onChange={(e) => setDelegateDeliverable(e.target.value)}
                placeholder="e.g. Implement WebRTC Face Verification & Liveness API Integration"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Detailed Work Instructions ("Kaise karna hai - Step-by-Step Instructions")</label>
              <textarea
                rows={3}
                value={delegateInstructions}
                onChange={(e) => setDelegateInstructions(e.target.value)}
                placeholder="Detail technical expectations, required components, API contracts, branch guidelines, and verification criteria for the employee..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Employee Deliverable Deadline / Last Date *</label>
                <input
                  type="date"
                  required
                  value={delegateDeadline}
                  onChange={(e) => setDelegateDeadline(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono font-bold text-purple-700"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Sprint Priority</label>
                <select
                  value={delegatePriority}
                  onChange={(e) => setDelegatePriority(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold"
                >
                  <option value="urgent">🔴 Urgent</option>
                  <option value="high">🟠 High</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="low">🟢 Low</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setDelegateModalProject(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-500 shadow-sm shadow-purple-500/25 cursor-pointer flex items-center space-x-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>Delegate to Employee</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ProjectsPage;
