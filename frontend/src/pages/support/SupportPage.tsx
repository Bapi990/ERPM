import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LifeBuoy, Plus, CheckCircle2, AlertCircle, Clock,
  MessageSquare, User, Filter, ArrowRight, BookOpen, ShieldAlert,
  Search, Download, Tag, ArrowUpRight, HelpCircle, Laptop,
  DollarSign, Users, Sliders, ChevronRight, Check, X, RefreshCw,
  ExternalLink, FileText, Send, Paperclip
} from 'lucide-react';
import { DataTable, type ColumnDef } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useRealtime } from '../../context/RealtimeContext';
import { useAuth } from '../../context/AuthContext';
import { canPerformAction } from '../../utils/rbacMatrix';

export interface SupportTicket {
  id: string;
  ticket_number: string;
  subject: string;
  department: 'it' | 'hr' | 'accounts' | 'facilities';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  raised_by: string;
  raised_by_email?: string;
  assigned_to?: string;
  category: string;
  created_at: string;
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  sla_deadline: string;
  description: string;
  resolution_notes?: string;
  responses?: {
    id: string;
    sender: string;
    role: string;
    timestamp: string;
    message: string;
  }[];
}

export interface TicketCategory {
  id: string;
  name: string;
  department: 'it' | 'hr' | 'accounts' | 'facilities';
  sla_response_hours: number;
  sla_resolution_hours: number;
  priority_default: 'low' | 'medium' | 'high' | 'urgent';
  active_tickets_count: number;
}

export interface KBArticle {
  id: string;
  title: string;
  category: string;
  department: string;
  summary: string;
  content: string;
  helpful_votes: number;
  last_updated: string;
}

const DEFAULT_TICKETS: SupportTicket[] = [
  {
    id: 'tkt-001',
    ticket_number: 'HD-2026-101',
    subject: 'Request VPN credentials & staging database access',
    department: 'it',
    priority: 'high',
    raised_by: 'Rohan Mehta',
    raised_by_email: 'rohan.mehta@odias.internal',
    assigned_to: 'Amit Verma (IT Admin)',
    category: 'VPN & Network Access',
    created_at: '2026-11-17 09:30',
    status: 'in_progress',
    sla_deadline: '2026-11-17 13:30',
    description: 'Need staging database credentials and OpenVPN config file for testing real-time ERP sync.',
    responses: [
      {
        id: 'resp-1',
        sender: 'Rohan Mehta',
        role: 'Employee',
        timestamp: '2026-11-17 09:30',
        message: 'Raised request for VPN profile and DB access.'
      },
      {
        id: 'resp-2',
        sender: 'Amit Verma (IT Admin)',
        role: 'IT Engineer',
        timestamp: '2026-11-17 10:15',
        message: 'VPN credentials generated. Sent encrypted token via corporate Slack.'
      }
    ]
  },
  {
    id: 'tkt-002',
    ticket_number: 'HD-2026-102',
    subject: 'PF Account UAN transfer confirmation needed',
    department: 'hr',
    priority: 'medium',
    raised_by: 'Vikram Malhotra',
    raised_by_email: 'vikram.malhotra@odias.internal',
    assigned_to: 'Ananya Sharma (HR Lead)',
    category: 'PF / ESI Compliance',
    created_at: '2026-11-16 14:15',
    status: 'resolved',
    sla_deadline: '2026-11-18 14:15',
    description: 'Previous employer PF transfer pending at EPFO regional portal. Need member annexure K form.',
    resolution_notes: 'Annexure K digitally signed and uploaded to EPFO unified member portal. Transfer complete.',
    responses: [
      {
        id: 'resp-3',
        sender: 'Ananya Sharma (HR Lead)',
        role: 'HR Officer',
        timestamp: '2026-11-17 11:00',
        message: 'UAN linked and transfer verified on EPFO employer ledger.'
      }
    ]
  },
  {
    id: 'tkt-003',
    ticket_number: 'HD-2026-103',
    subject: 'Reimbursement payment voucher query for client travel',
    department: 'accounts',
    priority: 'urgent',
    raised_by: 'Rahul Verma',
    raised_by_email: 'rahul.verma@odias.internal',
    assigned_to: 'Pooja Desai (Accounts)',
    category: 'Expense Reimbursement',
    created_at: '2026-11-17 10:00',
    status: 'open',
    sla_deadline: '2026-11-17 14:00',
    description: 'Airfare invoice of ₹14,200 submitted on 12th Nov still pending payment clearance.',
    responses: []
  },
  {
    id: 'tkt-004',
    ticket_number: 'HD-2026-104',
    subject: 'Laptop Battery draining within 45 mins (MacBook Pro M2)',
    department: 'it',
    priority: 'high',
    raised_by: 'Ananya Sharma',
    raised_by_email: 'ananya.sharma@odias.internal',
    assigned_to: 'Amit Verma (IT Admin)',
    category: 'Hardware Replacement',
    created_at: '2026-11-17 08:45',
    status: 'in_progress',
    sla_deadline: '2026-11-17 16:45',
    description: 'Battery health shows 62%. Machine shuts down unexpectedly when compiling.',
    responses: []
  },
  {
    id: 'tkt-005',
    ticket_number: 'HD-2026-105',
    subject: 'TDS mismatch on Form 16 Part A vs TRACES portal',
    department: 'accounts',
    priority: 'medium',
    raised_by: 'Sneha Patel',
    raised_by_email: 'sneha.patel@odias.internal',
    assigned_to: 'Pooja Desai (Accounts)',
    category: 'Tax & TDS',
    created_at: '2026-11-15 16:20',
    status: 'waiting',
    sla_deadline: '2026-11-18 16:20',
    description: 'Q2 TDS credit not reflecting in 26AS. Please reconcile with 24Q quarterly return.',
    responses: []
  },
  {
    id: 'tkt-006',
    ticket_number: 'HD-2026-106',
    subject: 'Office air conditioning in 2nd Floor engineering wing not cooling',
    department: 'facilities',
    priority: 'low',
    raised_by: 'Rohan Mehta',
    raised_by_email: 'rohan.mehta@odias.internal',
    assigned_to: 'Facilities Desk',
    category: 'Workplace & Facilities',
    created_at: '2026-11-14 11:30',
    status: 'closed',
    sla_deadline: '2026-11-16 11:30',
    description: 'AC unit #4 blowing warm air.',
    resolution_notes: 'Technician serviced refrigerant lines. Verified cooling index at 22C.'
  }
];

const DEFAULT_CATEGORIES: TicketCategory[] = [
  { id: 'cat-1', name: 'VPN & Network Access', department: 'it', sla_response_hours: 2, sla_resolution_hours: 4, priority_default: 'high', active_tickets_count: 3 },
  { id: 'cat-2', name: 'Hardware & Workstation', department: 'it', sla_response_hours: 4, sla_resolution_hours: 12, priority_default: 'high', active_tickets_count: 2 },
  { id: 'cat-3', name: 'PF / ESI & Wage Code', department: 'hr', sla_response_hours: 6, sla_resolution_hours: 24, priority_default: 'medium', active_tickets_count: 4 },
  { id: 'cat-4', name: 'Leave & Attendance Regularization', department: 'hr', sla_response_hours: 2, sla_resolution_hours: 8, priority_default: 'medium', active_tickets_count: 1 },
  { id: 'cat-5', name: 'Expense & Travel Reimbursement', department: 'accounts', sla_response_hours: 4, sla_resolution_hours: 16, priority_default: 'urgent', active_tickets_count: 5 },
  { id: 'cat-6', name: 'Tax / TDS & Form 16', department: 'accounts', sla_response_hours: 8, sla_resolution_hours: 48, priority_default: 'medium', active_tickets_count: 2 },
  { id: 'cat-7', name: 'Workplace & Facilities', department: 'facilities', sla_response_hours: 12, sla_resolution_hours: 24, priority_default: 'low', active_tickets_count: 1 }
];

const DEFAULT_KB: KBArticle[] = [
  {
    id: 'kb-1',
    title: 'How to Connect to Corporate WireGuard VPN (macOS & Windows)',
    category: 'VPN & Network Access',
    department: 'it',
    summary: 'Step-by-step setup guide for remote engineers using the corporate WireGuard VPN tunnel.',
    content: '1. Download WireGuard client.\n2. Request peer profile from IT Support via Ticket.\n3. Import the .conf file.\n4. Connect to server 127.0.0.1:51820.\n5. Verify staging endpoint connection.',
    helpful_votes: 42,
    last_updated: '2026-11-10'
  },
  {
    id: 'kb-2',
    title: 'EPFO UAN Linking & Automatic PF Transfer Process',
    category: 'PF / ESI Compliance',
    department: 'hr',
    summary: 'Guidelines on transferring your accumulated PF balance when joining KALINGA ERP.',
    content: 'All transfers are now facilitated via the unified member portal. Ensure your Aadhaar is linked and verified with OTP. Fill Annexure K if prompted.',
    helpful_votes: 68,
    last_updated: '2026-11-12'
  },
  {
    id: 'kb-3',
    title: 'Travel Reimbursement Policy & GST Invoice Requirements',
    category: 'Expense Reimbursement',
    department: 'accounts',
    summary: 'Mandatory documentation for claim settlement within 48 hours.',
    content: 'Bills exceeding ₹500 must bear company GSTIN (21AAMCG9464H1ZC). Boarding passes must accompany flight tickets. Submit via My Workplace within 7 days of trip conclusion.',
    helpful_votes: 55,
    last_updated: '2026-11-08'
  },
  {
    id: 'kb-4',
    title: 'Password Reset & Two-Factor Authentication (2FA) Recovery',
    category: 'Workstation & Security',
    department: 'it',
    summary: 'Instructions for resetting your ERP credentials and restoring 2FA tokens.',
    content: 'Go to My Workplace -> Change Password. In case of lost authenticator app, contact IT Admin for temporary one-time backup OTP bypass.',
    helpful_votes: 39,
    last_updated: '2026-11-14'
  }
];

export const SupportPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { emitEvent, subscribe } = useRealtime();
  const { user } = useAuth();

  // Detect active submodule from path
  const activeSubmodule = useMemo(() => {
    const p = location.pathname;
    if (p.includes('/support/my-tickets')) return 'my-tickets';
    if (p.includes('/support/assigned')) return 'assigned';
    if (p.includes('/support/it')) return 'it';
    if (p.includes('/support/hr')) return 'hr';
    if (p.includes('/support/accounts')) return 'accounts';
    if (p.includes('/support/categories')) return 'categories';
    if (p.includes('/support/sla')) return 'sla';
    if (p.includes('/support/kb')) return 'kb';
    return 'tickets'; // default: /app/support/tickets
  }, [location.pathname]);

  // Persistent State
  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    const cached = localStorage.getItem('kalinga_support_tickets');
    return cached ? JSON.parse(cached) : DEFAULT_TICKETS;
  });

  const [categories, setCategories] = useState<TicketCategory[]>(() => {
    const cached = localStorage.getItem('kalinga_support_categories');
    return cached ? JSON.parse(cached) : DEFAULT_CATEGORIES;
  });

  const [kbArticles, setKbArticles] = useState<KBArticle[]>(() => {
    const cached = localStorage.getItem('kalinga_support_kb');
    return cached ? JSON.parse(cached) : DEFAULT_KB;
  });

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalTicket, setDetailModalTicket] = useState<SupportTicket | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [selectedKbArticle, setSelectedKbArticle] = useState<KBArticle | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  // New Ticket Form State
  const [newSubject, setNewSubject] = useState('');
  const [newDepartment, setNewDepartment] = useState<'it' | 'hr' | 'accounts' | 'facilities'>('it');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [newCategory, setNewCategory] = useState('VPN & Network Access');
  const [newDescription, setNewDescription] = useState('');

  // Ticket Reply Form
  const [replyMessage, setReplyMessage] = useState('');

  // Save to localStorage & sync Realtime
  useEffect(() => {
    localStorage.setItem('kalinga_support_tickets', JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem('kalinga_support_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('kalinga_support_kb', JSON.stringify(kbArticles));
  }, [kbArticles]);

  // Realtime Listeners
  useEffect(() => {
    const unsubTicket = subscribe('support_ticket_created', (data: any) => {
      if (data && data.ticket) {
        setTickets(prev => [data.ticket, ...prev.filter(t => t.id !== data.ticket.id)]);
      }
    });

    const unsubUpdate = subscribe('support_ticket_updated', (data: any) => {
      if (data && data.ticket) {
        setTickets(prev => prev.map(t => t.id === data.ticket.id ? data.ticket : t));
      }
    });

    return () => {
      unsubTicket();
      unsubUpdate();
    };
  }, [subscribe]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered tickets according to current submodule
  const displayedTickets = useMemo(() => {
    return tickets.filter((t) => {
      // Submodule partition
      if (activeSubmodule === 'my-tickets') {
        const currentName = user?.username || 'Rohan Mehta';
        // Show tickets raised by current user or matching Rohan Mehta
        if (t.raised_by.toLowerCase() !== currentName.toLowerCase() && !t.raised_by.toLowerCase().includes('rohan')) {
          return false;
        }
      } else if (activeSubmodule === 'assigned') {
        const currentName = user?.username || 'Amit Verma';
        if (!t.assigned_to?.toLowerCase().includes(currentName.toLowerCase()) && !t.assigned_to?.toLowerCase().includes('it')) {
          return false;
        }
      } else if (activeSubmodule === 'it') {
        if (t.department !== 'it') return false;
      } else if (activeSubmodule === 'hr') {
        if (t.department !== 'hr') return false;
      } else if (activeSubmodule === 'accounts') {
        if (t.department !== 'accounts') return false;
      }

      // Department filter
      if (departmentFilter !== 'all' && t.department !== departmentFilter) return false;
      // Priority filter
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      // Status filter
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;

      // Text query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNum = t.ticket_number.toLowerCase().includes(q);
        const matchSubj = t.subject.toLowerCase().includes(q);
        const matchUser = t.raised_by.toLowerCase().includes(q);
        const matchCat = t.category.toLowerCase().includes(q);
        if (!matchNum && !matchSubj && !matchUser && !matchCat) return false;
      }

      return true;
    });
  }, [tickets, activeSubmodule, departmentFilter, priorityFilter, statusFilter, searchQuery, user]);

  // Handle Create Ticket
  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newDescription.trim()) return;

    const count = tickets.length + 1;
    const ticketNum = `HD-2026-${100 + count}`;
    const newTkt: SupportTicket = {
      id: `tkt-${Date.now()}`,
      ticket_number: ticketNum,
      subject: newSubject.trim(),
      department: newDepartment,
      priority: newPriority,
      raised_by: user?.username || 'Rohan Mehta',
      raised_by_email: user?.email || 'rohan.mehta@odias.internal',
      assigned_to: newDepartment === 'it' ? 'Amit Verma (IT Admin)' : newDepartment === 'hr' ? 'Ananya Sharma (HR Lead)' : 'Pooja Desai (Accounts)',
      category: newCategory,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'open',
      sla_deadline: new Date(Date.now() + 4 * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 16),
      description: newDescription.trim(),
      responses: [
        {
          id: `resp-${Date.now()}`,
          sender: user?.username || 'Rohan Mehta',
          role: 'Employee',
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          message: newDescription.trim()
        }
      ]
    };

    setTickets(prev => [newTkt, ...prev]);
    emitEvent('support_ticket_created', 'Support Ticket Created', `Ticket ${ticketNum} created and assigned`, 'info');
    setCreateModalOpen(false);
    setNewSubject('');
    setNewDescription('');
    showToast(`Support Ticket ${ticketNum} created and assigned in real time!`);
  };

  // Handle Reply to Ticket
  const handleSendReply = (ticketId: string) => {
    if (!replyMessage.trim()) return;

    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        const newResp = {
          id: `resp-${Date.now()}`,
          sender: user?.username || 'Corporate Support Agent',
          role: 'Support Specialist',
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          message: replyMessage.trim()
        };
        const updated = {
          ...t,
          status: t.status === 'open' ? 'in_progress' : t.status,
          responses: [...(t.responses || []), newResp]
        };
        emitEvent('support_ticket_updated', 'Ticket Updated', `Ticket thread updated`, 'info');
        setDetailModalTicket(updated);
        return updated;
      }
      return t;
    }));

    setReplyMessage('');
    showToast('Reply added to ticket thread in real time!');
  };

  // Quick Status Update
  const handleUpdateStatus = (ticketId: string, newStatus: SupportTicket['status']) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        const updated = {
          ...t,
          status: newStatus,
          resolution_notes: newStatus === 'resolved' ? (t.resolution_notes || 'Resolved and verified by support agent.') : t.resolution_notes
        };
        emitEvent('support_ticket_updated', 'Ticket Status Changed', `Ticket status updated to ${newStatus}`, 'success');
        if (detailModalTicket?.id === ticketId) {
          setDetailModalTicket(updated);
        }
        return updated;
      }
      return t;
    }));
    showToast(`Ticket status updated to ${newStatus.toUpperCase()}`);
  };

  // Submodule Title & Badge Info
  const headerInfo = useMemo(() => {
    switch (activeSubmodule) {
      case 'my-tickets':
        return {
          title: 'My Support Tickets',
          badge: 'Self Service Helpdesk',
          desc: 'Track and manage your submitted support inquiries, IT service requests, and HR tickets.'
        };
      case 'assigned':
        return {
          title: 'Assigned Tickets Queue',
          badge: 'Agent Workspace',
          desc: 'Support requests assigned to you or your department requiring active resolution.'
        };
      case 'it':
        return {
          title: 'IT & Infrastructure Support',
          badge: 'Technical Helpdesk',
          desc: 'Hardware allocation issues, WireGuard VPN, network security, and database credentials.'
        };
      case 'hr':
        return {
          title: 'HR & People Support',
          badge: 'Confidential HR Desk',
          desc: 'PF / ESI queries, payroll discrepancies, leave adjustments, and policy guidance.'
        };
      case 'accounts':
        return {
          title: 'Accounts & Finance Support',
          badge: 'Billing & Reimbursement',
          desc: 'Travel claim clearance, expense payment vouchers, vendor GST invoices, and TDS reconciliations.'
        };
      case 'categories':
        return {
          title: 'Ticket Categories & Priority Matrix',
          badge: 'SLA Configuration',
          desc: 'Define corporate ticketing categories, default priority tiers, and response/resolution SLAs.'
        };
      case 'sla':
        return {
          title: 'Ticket SLA Management & Monitoring',
          badge: 'Live SLA Radar',
          desc: 'Real-time SLA adherence, average first-response velocity, and resolution compliance.'
        };
      case 'kb':
        return {
          title: 'Knowledge Base / FAQs',
          badge: 'Self-Service Docs',
          desc: 'Searchable directory of standard operating procedures, policies, and troubleshooting guides.'
        };
      default:
        return {
          title: 'Internal Support Tickets',
          badge: 'Central Helpdesk',
          desc: 'Unified company-wide ticketing portal across IT, HR, Accounts, and Facilities.'
        };
    }
  }, [activeSubmodule]);

  // Columns for Ticket Table
  const ticketColumns: ColumnDef<SupportTicket>[] = [
    {
      key: 'ticket_number',
      header: 'Ticket ID',
      render: (t) => (
        <span className="font-mono text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/60">
          {t.ticket_number}
        </span>
      ),
    },
    {
      key: 'subject',
      header: 'Subject & Category',
      render: (t) => (
        <div>
          <div className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer text-sm" onClick={() => setDetailModalTicket(t)}>
            {t.subject}
          </div>
          <div className="flex items-center space-x-2 mt-0.5 text-xs text-slate-500">
            <span className="capitalize font-semibold text-slate-600">{t.department.toUpperCase()}</span>
            <span>•</span>
            <span>{t.category}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'raised_by',
      header: 'Raised By',
      render: (t) => (
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
            {t.raised_by.charAt(0)}
          </div>
          <div>
            <span className="font-semibold text-slate-800 text-xs block">{t.raised_by}</span>
            <span className="text-[10px] text-slate-400">{t.created_at}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'assigned_to',
      header: 'Assigned Specialist',
      render: (t) => (
        <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
          {t.assigned_to || 'Unassigned'}
        </span>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (t) => {
        const colorMap = {
          urgent: 'bg-rose-100 text-rose-700 border-rose-200',
          high: 'bg-amber-100 text-amber-700 border-amber-200',
          medium: 'bg-blue-100 text-blue-700 border-blue-200',
          low: 'bg-slate-100 text-slate-700 border-slate-200',
        };
        return (
          <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full border ${colorMap[t.priority]}`}>
            {t.priority}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (t) => {
        const statusMap = {
          open: { label: 'Open', color: 'bg-blue-50 text-blue-700 border-blue-200' },
          in_progress: { label: 'In Progress', color: 'bg-amber-50 text-amber-700 border-amber-200' },
          waiting: { label: 'Waiting User', color: 'bg-purple-50 text-purple-700 border-purple-200' },
          resolved: { label: 'Resolved', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
          closed: { label: 'Closed', color: 'bg-slate-50 text-slate-600 border-slate-200' },
        }[t.status];

        return (
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusMap.color}`}>
            {statusMap.label}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (t) => (
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setDetailModalTicket(t)}
            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 font-bold text-xs transition-colors cursor-pointer"
            title="View Details"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {t.status !== 'resolved' && t.status !== 'closed' && (
            <button
              onClick={() => handleUpdateStatus(t.id, 'resolved')}
              className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 font-bold text-xs transition-colors cursor-pointer"
              title="Mark Resolved"
            >
              <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto text-left">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center space-x-2 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-1.5">
            <LifeBuoy className="w-3.5 h-3.5 text-blue-600" />
            <span>{headerInfo.badge}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {headerInfo.title}
          </h1>
          <p className="text-xs text-slate-500 max-w-xl">
            {headerInfo.desc}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2.5">
          {canPerformAction(user, 'support', 'add') && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Raise New Ticket</span>
            </button>
          )}

          {activeSubmodule === 'categories' && (
            <button
              onClick={() => setCategoryModalOpen(true)}
              className="inline-flex items-center px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Add Category</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Total Tickets</span>
            <LifeBuoy className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{tickets.length}</div>
          <div className="text-[11px] text-slate-400 font-semibold mt-0.5">Across All Departments</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 text-xs font-bold">
            <span>Open & Active</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">
            {tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length}
          </div>
          <div className="text-[11px] text-slate-400 font-semibold mt-0.5">Under Active Resolution</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 text-xs font-bold">
            <span>Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">
            {tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">100% SLA Maintained</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-indigo-600 text-xs font-bold">
            <span>Avg First Response</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-600 mt-2">18 Mins</div>
          <div className="text-[11px] text-slate-400 font-semibold mt-0.5">SLA Target: &lt; 2 Hours</div>
        </div>
      </div>

      {/* --------------------------------------------------------------------------------- */}
      {/* VIEW: TICKET CATEGORIES & PRIORITY MATRIX */}
      {/* --------------------------------------------------------------------------------- */}
      {activeSubmodule === 'categories' ? (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="font-extrabold text-sm text-slate-900 mb-3">Enterprise Category & SLA Rules</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <div key={cat.id} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-xs text-slate-900">{cat.name}</span>
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                      {cat.department}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-200/60">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Response SLA</span>
                      <span className="font-bold text-slate-800">{cat.sla_response_hours} Hours</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Resolution SLA</span>
                      <span className="font-bold text-slate-800">{cat.sla_resolution_hours} Hours</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Active Inquiries:</span>
                    <span className="font-black text-blue-600">{cat.active_tickets_count} Tickets</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : activeSubmodule === 'sla' ? (
        /* --------------------------------------------------------------------------------- */
        /* VIEW: TICKET SLA MANAGEMENT */
        /* --------------------------------------------------------------------------------- */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500">Overall SLA Compliance</span>
              <div className="text-3xl font-black text-emerald-600 mt-2">98.4%</div>
              <p className="text-xs text-slate-500 mt-1">Target is 95.0% across all department inquiries.</p>
              <div className="w-full bg-slate-100 h-2.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full w-[98.4%]"></div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500">First-Contact Resolution</span>
              <div className="text-3xl font-black text-blue-600 mt-2">74.2%</div>
              <p className="text-xs text-slate-500 mt-1">Inquiries resolved without secondary escalation.</p>
              <div className="w-full bg-slate-100 h-2.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full w-[74.2%]"></div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500">Escalated / Breached</span>
              <div className="text-3xl font-black text-slate-900 mt-2">0</div>
              <p className="text-xs text-slate-500 mt-1">Zero tickets currently breaching service level agreement.</p>
              <div className="w-full bg-slate-100 h-2.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full w-[100%]"></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="font-extrabold text-sm text-slate-900 mb-3">Active Tickets Near SLA Deadline</h3>
            <DataTable
              columns={ticketColumns}
              data={tickets.filter(t => t.status === 'open' || t.status === 'in_progress')}
              initialPageSize={5}
            />
          </div>
        </div>
      ) : activeSubmodule === 'kb' ? (
        /* --------------------------------------------------------------------------------- */
        /* VIEW: KNOWLEDGE BASE / FAQS */
        /* --------------------------------------------------------------------------------- */
        <div className="space-y-6">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search troubleshooting guides, VPN tutorials, PF transfer rules, reimbursement FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white border border-slate-200 text-sm font-medium focus:outline-none focus:border-blue-600 shadow-xs"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {kbArticles
              .filter(a => !searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.summary.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((art) => (
                <div
                  key={art.id}
                  onClick={() => setSelectedKbArticle(art)}
                  className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                      {art.department}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500">{art.category}</span>
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                    {art.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    {art.summary}
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-400 mt-4 pt-3 border-t border-slate-100">
                    <span>Updated {art.last_updated}</span>
                    <span className="text-emerald-600 font-bold">👍 {art.helpful_votes} Found Helpful</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ) : (
        /* --------------------------------------------------------------------------------- */
        /* DEFAULT VIEW: TICKETS LIST (Internal, My Tickets, Assigned, IT, HR, Accounts) */
        /* --------------------------------------------------------------------------------- */
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by ticket #, subject, or requester..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs font-medium focus:outline-none bg-transparent"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting">Waiting User</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Ticket DataTable */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <DataTable
              columns={ticketColumns}
              data={displayedTickets}
              initialPageSize={10}
            />
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------------------- */}
      {/* MODAL: CREATE / RAISE TICKET */}
      {/* --------------------------------------------------------------------------------- */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Raise New Support Ticket"
      >
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Subject / Issue Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Request WireGuard VPN credentials for staging cluster"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
              <select
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
              >
                <option value="it">IT Support</option>
                <option value="hr">HR & People</option>
                <option value="accounts">Accounts & Finance</option>
                <option value="facilities">Facilities Desk</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
              >
                <option value="low">Low (48h SLA)</option>
                <option value="medium">Medium (24h SLA)</option>
                <option value="high">High (4h SLA)</option>
                <option value="urgent">Urgent (2h SLA)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description & Reproduction Steps *</label>
            <textarea
              required
              rows={4}
              placeholder="Detail your request, include IP address, asset code, or transaction voucher number if applicable..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20"
            >
              Submit Ticket
            </button>
          </div>
        </form>
      </Modal>

      {/* --------------------------------------------------------------------------------- */}
      {/* MODAL: TICKET DETAIL & THREAD RESPONSES */}
      {/* --------------------------------------------------------------------------------- */}
      {detailModalTicket && (
        <Modal
          isOpen={true}
          onClose={() => setDetailModalTicket(null)}
          title={`Ticket Details — ${detailModalTicket.ticket_number}`}
        >
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between mb-2">
                <span className="font-extrabold text-sm text-slate-900">{detailModalTicket.subject}</span>
                <span className="text-xs font-bold text-slate-500">{detailModalTicket.created_at}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{detailModalTicket.description}</p>
              <div className="flex items-center space-x-3 mt-3 pt-2 border-t border-slate-200/60 text-xs text-slate-500">
                <span>Raised By: <strong>{detailModalTicket.raised_by}</strong></span>
                <span>•</span>
                <span>Assigned: <strong>{detailModalTicket.assigned_to || 'Unassigned'}</strong></span>
                <span>•</span>
                <span>SLA: <strong>{detailModalTicket.sla_deadline}</strong></span>
              </div>
            </div>

            {/* Quick Status Updater */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200">
              <span className="text-xs font-bold text-slate-700">Update Status:</span>
              <div className="flex items-center space-x-1.5">
                {(['open', 'in_progress', 'waiting', 'resolved', 'closed'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(detailModalTicket.id, st)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-colors ${
                      detailModalTicket.status === st
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Response Thread */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-black uppercase text-slate-400">Communication Thread</h4>
              {detailModalTicket.responses && detailModalTicket.responses.length > 0 ? (
                detailModalTicket.responses.map(r => (
                  <div key={r.id} className="p-3 rounded-xl bg-white border border-slate-200 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900">{r.sender} <span className="text-slate-400 font-normal">({r.role})</span></span>
                      <span className="text-[10px] text-slate-400">{r.timestamp}</span>
                    </div>
                    <p className="text-slate-600">{r.message}</p>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl">
                  No responses yet. Add a message below.
                </div>
              )}
            </div>

            {/* Reply Box */}
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="text"
                placeholder="Type your response or status update note..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendReply(detailModalTicket.id)}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-blue-600"
              />
              <button
                onClick={() => handleSendReply(detailModalTicket.id)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center space-x-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Reply</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* --------------------------------------------------------------------------------- */}
      {/* MODAL: KB ARTICLE VIEWER */}
      {/* --------------------------------------------------------------------------------- */}
      {selectedKbArticle && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedKbArticle(null)}
          title={selectedKbArticle.title}
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <span className="font-bold text-blue-600">{selectedKbArticle.category}</span>
              <span>•</span>
              <span>Updated {selectedKbArticle.last_updated}</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 whitespace-pre-line leading-relaxed font-mono">
              {selectedKbArticle.content}
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">Was this article helpful?</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    showToast('Thank you for your feedback!');
                    setSelectedKbArticle(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs hover:bg-emerald-100"
                >
                  Yes, Helpful 👍
                </button>
                <button
                  onClick={() => {
                    setCreateModalOpen(true);
                    setSelectedKbArticle(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs hover:bg-blue-100"
                >
                  Still Need Help? Open Ticket
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SupportPage;
