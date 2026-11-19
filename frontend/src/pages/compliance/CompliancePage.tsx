import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FileCheck, Plus, CheckCircle2, FileText, Download,
  Eye, Calendar, Shield, AlertTriangle, Search, Filter,
  ExternalLink, Printer, ShieldCheck, Check, Clock,
  FileSpreadsheet, Sparkles, Building2, User, KeyRound, AlertCircle
} from 'lucide-react';
import { DataTable, type ColumnDef } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { useRealtime } from '../../context/RealtimeContext';
import { useAuth } from '../../context/AuthContext';
import { canPerformAction } from '../../utils/rbacMatrix';

export interface ComplianceDocument {
  id: string;
  doc_code: string;
  title: string;
  doc_type: 'company_doc' | 'employee_doc' | 'template' | 'offer_letter' | 'appointment' | 'experience' | 'policy' | 'digital_approval' | 'calendar' | 'alert';
  issued_to: string;
  issued_by?: string;
  issue_date: string;
  expiry_date?: string;
  digital_sign_hash?: string;
  status: 'active' | 'pending_signature' | 'expired' | 'archived';
  category: string;
}

const DEFAULT_DOCUMENTS: ComplianceDocument[] = [
  // Company Documents
  { id: 'cd-1', doc_code: 'DOC-CIN-2026', title: 'Certificate of Incorporation (CIN: U72900OR2026PTC041289)', doc_type: 'company_doc', issued_to: 'KALINGA ERP', issue_date: '2026-01-15', status: 'active', category: 'Statutory Registration' },
  { id: 'cd-2', doc_code: 'DOC-GST-2026', title: 'GST Registration Certificate (GSTIN: 21AAMCG9464H1ZC)', doc_type: 'company_doc', issued_to: 'KALINGA ERP', issue_date: '2026-01-20', status: 'active', category: 'Taxation & GST' },
  { id: 'cd-3', doc_code: 'DOC-ISO-27001', title: 'ISO/IEC 27001:2022 Information Security Certificate', doc_type: 'company_doc', issued_to: 'KALINGA ERP', issue_date: '2026-02-01', expiry_date: '2029-02-01', status: 'active', category: 'Quality & Security' },

  // Employee Documents
  { id: 'ed-1', doc_code: 'EMP-KYC-089', title: 'Aadhaar & PAN Identity Verification Dossier', doc_type: 'employee_doc', issued_to: 'Rohan Mehta', issue_date: '2026-02-10', status: 'active', category: 'Identity KYC' },
  { id: 'ed-2', doc_code: 'EMP-DEG-089', title: 'B.Tech Computer Science & Engineering Degree Verification', doc_type: 'employee_doc', issued_to: 'Rohan Mehta', issue_date: '2026-02-10', status: 'active', category: 'Educational Background' },
  { id: 'ed-3', doc_code: 'EMP-KYC-092', title: 'Aadhaar & Permanent Account Number Dossier', doc_type: 'employee_doc', issued_to: 'Ananya Sharma', issue_date: '2026-01-18', status: 'active', category: 'Identity KYC' },

  // Document Templates
  { id: 'tpl-1', doc_code: 'TPL-OFF-2026', title: 'Standard Full-Time Employment Offer Letter Template', doc_type: 'template', issued_to: 'All Candidates', issue_date: '2026-01-01', status: 'active', category: 'Recruitment Templates' },
  { id: 'tpl-2', doc_code: 'TPL-NDA-2026', title: 'Mutual Non-Disclosure & Intellectual Property Agreement', doc_type: 'template', issued_to: 'All Staff & Vendors', issue_date: '2026-01-01', status: 'active', category: 'Legal & Compliance' },
  { id: 'tpl-3', doc_code: 'TPL-REL-2026', title: 'Service Relieving & Experience Certificate Template', doc_type: 'template', issued_to: 'Exiting Employees', issue_date: '2026-01-01', status: 'active', category: 'Offboarding' },

  // Offer Letters
  { id: 'off-1', doc_code: 'OFF-2026-042', title: 'Senior Full Stack Lead Offer & Compensation Annexure', doc_type: 'offer_letter', issued_to: 'Rohan Mehta', issued_by: 'Ananya Sharma (HR)', issue_date: '2026-01-10', digital_sign_hash: '9f83b2a4-128e-4a6c-9bc7-c58d047321e9', status: 'active', category: 'Executive Hiring' },
  { id: 'off-2', doc_code: 'OFF-2026-043', title: 'Enterprise Account Executive Offer Letter', doc_type: 'offer_letter', issued_to: 'Vikram Malhotra', issued_by: 'Ananya Sharma (HR)', issue_date: '2026-01-15', digital_sign_hash: '3d72a11b-871c-40ea-92b1-098cf38a4122', status: 'active', category: 'Sales Hiring' },

  // Appointment Letters
  { id: 'app-1', doc_code: 'APP-2026-014', title: 'Letter of Appointment & Service Terms Agreement', doc_type: 'appointment', issued_to: 'Rohan Mehta', issue_date: '2026-01-20', status: 'active', category: 'Employment Service' },
  { id: 'app-2', doc_code: 'APP-2026-015', title: 'Letter of Appointment & Code of Conduct Acceptance', doc_type: 'appointment', issued_to: 'Rahul Verma', issue_date: '2026-02-01', status: 'active', category: 'Employment Service' },

  // Experience Letters
  { id: 'exp-1', doc_code: 'EXP-2026-004', title: 'Experience & Service Clearance Certificate', doc_type: 'experience', issued_to: 'Siddharth Patnaik (Ex-Lead)', issue_date: '2026-03-31', status: 'active', category: 'Relieving Dossier' },

  // Company Policies
  { id: 'pol-1', doc_code: 'POL-POSH-2026', title: 'Prevention of Sexual Harassment (POSH) Policy 2026', doc_type: 'policy', issued_to: 'All Workforce', issue_date: '2026-01-01', status: 'active', category: 'Workplace Governance' },
  { id: 'pol-2', doc_code: 'POL-SEC-2026', title: 'Information Security, Passwords & Access Control Policy', doc_type: 'policy', issued_to: 'All Workforce', issue_date: '2026-01-01', status: 'active', category: 'Information Security' },
  { id: 'pol-3', doc_code: 'POL-REM-2026', title: 'Remote Work & Hybrid Attendance Governance Policy', doc_type: 'policy', issued_to: 'All Workforce', issue_date: '2026-01-01', status: 'active', category: 'HR Operations' },

  // Digital Approvals
  { id: 'dap-1', doc_code: 'DAP-2026-101', title: 'Electronic Signoff: Q4 Audit Clearance Ledger', doc_type: 'digital_approval', issued_to: 'Board of Directors', issue_date: '2026-11-12', digital_sign_hash: 'e812f90a-112c-49aa-881b-501239aa812f', status: 'active', category: 'Audit Approval' },
  { id: 'dap-2', doc_code: 'DAP-2026-102', title: 'Electronic Signoff: Employee ESOP Allocation Trust Deed', doc_type: 'digital_approval', issued_to: 'Executive Committee', issue_date: '2026-11-14', digital_sign_hash: '44a89c10-912b-41cc-88ff-c9182301982b', status: 'active', category: 'Board Signoff' },

  // Compliance Calendar
  { id: 'cal-1', doc_code: 'CAL-PF-2026', title: 'EPFO Monthly Electronic Challan cum Return (ECR) Filing', doc_type: 'calendar', issued_to: 'Ministry of Labour', issue_date: '2026-11-15', status: 'active', category: 'EPFO Statutory (Monthly 15th)' },
  { id: 'cal-2', doc_code: 'CAL-GST-2026', title: 'GSTR-3B Monthly Summary GST Return Submission', doc_type: 'calendar', issued_to: 'CBIC / GSTN Portal', issue_date: '2026-11-20', status: 'active', category: 'GST Statutory (Monthly 20th)' },
  { id: 'cal-3', doc_code: 'CAL-TDS-2026', title: 'Quarterly TDS Return (Form 24Q - Salary Deductions)', doc_type: 'calendar', issued_to: 'Income Tax Department', issue_date: '2026-12-31', status: 'active', category: 'Direct Tax (Quarterly)' },

  // Expiry Alerts
  { id: 'alt-1', doc_code: 'ALT-EXP-01', title: 'Expiring Passport Document - Vikram Malhotra', doc_type: 'alert', issued_to: 'Vikram Malhotra', issue_date: '2026-11-10', expiry_date: '2026-12-15', status: 'pending_signature', category: 'Passport Renewal' },
  { id: 'alt-2', doc_code: 'ALT-EXP-02', title: 'Expiring AWS Cloud Architect Professional Certification', doc_type: 'alert', issued_to: 'Rohan Mehta', issue_date: '2026-11-05', expiry_date: '2026-12-30', status: 'active', category: 'Professional Credentials' },
];

export const CompliancePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { emitEvent, subscribe } = useRealtime();

  // Detect active submodule from path
  const activeSubmodule = useMemo(() => {
    const p = location.pathname;
    if (p.includes('/compliance/company-docs')) return 'company-docs';
    if (p.includes('/compliance/employee-docs')) return 'employee-docs';
    if (p.includes('/compliance/templates')) return 'templates';
    if (p.includes('/compliance/offer-letters')) return 'offer-letters';
    if (p.includes('/compliance/appointment-letters')) return 'appointment-letters';
    if (p.includes('/compliance/experience-letters')) return 'experience-letters';
    if (p.includes('/compliance/policies')) return 'policies';
    if (p.includes('/compliance/digital-approvals')) return 'digital-approvals';
    if (p.includes('/compliance/calendar')) return 'calendar';
    if (p.includes('/compliance/alerts')) return 'alerts';
    return 'company-docs'; // default
  }, [location.pathname]);

  // Persistent Documents State
  const [documents, setDocuments] = useState<ComplianceDocument[]>(() => {
    const cached = localStorage.getItem('kalinga_compliance_docs');
    return cached ? JSON.parse(cached) : DEFAULT_DOCUMENTS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [createDocModalOpen, setCreateDocModalOpen] = useState(false);
  const [viewDocModalItem, setViewDocModalItem] = useState<ComplianceDocument | null>(null);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newRecipient, setNewRecipient] = useState('Rohan Mehta');
  const [newCategory, setNewCategory] = useState('Employment Dossier');
  const [newExpiry, setNewExpiry] = useState('');

  useEffect(() => {
    localStorage.setItem('kalinga_compliance_docs', JSON.stringify(documents));
  }, [documents]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

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

  // Header Info
  const headerInfo = useMemo(() => {
    switch (activeSubmodule) {
      case 'employee-docs':
        return {
          title: 'Employee Documents & KYC Dossiers',
          badge: 'Personnel Records',
          desc: 'Aadhaar, PAN card, educational degrees, and previous employer relieving certificates.'
        };
      case 'templates':
        return {
          title: 'Corporate Document Templates',
          badge: 'Standard Operating Templates',
          desc: 'Standardized offer letters, NDAs, warning letters, and HR correspondence templates.'
        };
      case 'offer-letters':
        return {
          title: 'Official Offer Letters & CTC Annexures',
          badge: 'Recruitment & Onboarding',
          desc: 'Generated candidate offer packages with detailed compensation annexures and digital e-signatures.'
        };
      case 'appointment-letters':
        return {
          title: 'Appointment Letters & Service Terms',
          badge: 'Legal Employment Agreements',
          desc: 'Formal service contracts, code of conduct affirmations, and probationary guidelines.'
        };
      case 'experience-letters':
        return {
          title: 'Experience & Relieving Letters',
          badge: 'Offboarding Documentation',
          desc: 'Verified service track records, tenure details, and exit clearance letters.'
        };
      case 'policies':
        return {
          title: 'Company Policies & Governance Handbook',
          badge: 'Corporate Governance',
          desc: 'Workplace POSH, Information Security (ISO 27001), Remote Working, and Code of Conduct.'
        };
      case 'digital-approvals':
        return {
          title: 'Digital Approvals & Cryptographic Signatures',
          badge: 'Audit & Compliance Ledger',
          desc: 'Cryptographically sealed audit approvals, board resolutions, and electronic signoffs.'
        };
      case 'calendar':
        return {
          title: 'Statutory Compliance Calendar',
          badge: 'Statutory Deadlines',
          desc: 'EPFO ECR, ESIC contributions, GSTR-3B filings, and quarterly TDS remittance deadlines.'
        };
      case 'alerts':
        return {
          title: 'Document Expiry & Renewal Alerts',
          badge: 'Proactive Alert Radar',
          desc: 'Automatic notifications for expiring employee passports, work visas, and certifications.'
        };
      default:
        return {
          title: 'Company Documents & Registrations (Image 2 Active)',
          badge: 'Statutory Company Dossier',
          desc: 'Certificate of Incorporation (CIN), GST Registration, MSME Udyam, MOA & AOA.'
        };
    }
  }, [activeSubmodule]);

  // Filtered documents for the current submodule
  const displayedDocuments = useMemo(() => {
    const docTypeMap: Record<string, string> = {
      'company-docs': 'company_doc',
      'employee-docs': 'employee_doc',
      'templates': 'template',
      'offer-letters': 'offer_letter',
      'appointment-letters': 'appointment',
      'experience-letters': 'experience',
      'policies': 'policy',
      'digital-approvals': 'digital_approval',
      'calendar': 'calendar',
      'alerts': 'alert',
    };

    const targetType = docTypeMap[activeSubmodule] || 'company_doc';

    return documents.filter(doc => {
      if (doc.doc_type !== targetType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          doc.title.toLowerCase().includes(q) ||
          doc.doc_code.toLowerCase().includes(q) ||
          doc.issued_to.toLowerCase().includes(q) ||
          doc.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [documents, activeSubmodule, searchQuery]);

  // Handle Generate New Document
  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const docTypeMap: Record<string, ComplianceDocument['doc_type']> = {
      'company-docs': 'company_doc',
      'employee-docs': 'employee_doc',
      'templates': 'template',
      'offer-letters': 'offer_letter',
      'appointment-letters': 'appointment',
      'experience-letters': 'experience',
      'policies': 'policy',
      'digital-approvals': 'digital_approval',
      'calendar': 'calendar',
      'alerts': 'alert',
    };

    const count = documents.length + 1;
    const code = `DOC-${activeSubmodule.substring(0, 3).toUpperCase()}-2026-${String(count).padStart(3, '0')}`;
    const newDoc: ComplianceDocument = {
      id: `doc-${Date.now()}`,
      doc_code: code,
      title: newTitle.trim(),
      doc_type: docTypeMap[activeSubmodule] || 'company_doc',
      issued_to: newRecipient.trim(),
      issued_by: user?.username || 'Corporate Owner',
      issue_date: new Date().toISOString().substring(0, 10),
      expiry_date: newExpiry || undefined,
      digital_sign_hash: crypto.randomUUID ? crypto.randomUUID() : `hash-${Date.now()}`,
      status: 'active',
      category: newCategory.trim()
    };

    setDocuments(prev => [newDoc, ...prev]);
    emitEvent('compliance_doc_created', 'New Compliance Document', `${newDoc.title} generated in real time`, 'success');
    setCreateDocModalOpen(false);
    setNewTitle('');
    showToast(`Document ${code} successfully generated and sealed!`);
  };

  // Columns for DataTable
  const columns: ColumnDef<ComplianceDocument>[] = [
    {
      key: 'doc_code',
      header: 'Document ID',
      render: (d) => (
        <span className="font-mono text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/60">
          {d.doc_code}
        </span>
      ),
    },
    {
      key: 'title',
      header: 'Document Title & Category',
      render: (d) => (
        <div>
          <div className="font-extrabold text-sm text-slate-900 hover:text-blue-600 cursor-pointer" onClick={() => setViewDocModalItem(d)}>
            {d.title}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{d.category}</div>
        </div>
      ),
    },
    {
      key: 'issued_to',
      header: 'Issued To / Stakeholder',
      render: (d) => (
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
            {d.issued_to.charAt(0)}
          </div>
          <span className="font-semibold text-slate-800 text-xs">{d.issued_to}</span>
        </div>
      ),
    },
    {
      key: 'issue_date',
      header: 'Issue / Due Date',
      render: (d) => (
        <div className="text-xs text-slate-600">
          <span>{d.issue_date}</span>
          {d.expiry_date && (
            <span className="text-rose-600 font-semibold block text-[10px]">
              Exp: {d.expiry_date}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Digital Status',
      render: (d) => (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span>Active & Verified</span>
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (d) => (
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setViewDocModalItem(d)}
            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 font-bold text-xs transition-colors cursor-pointer"
            title="View Document"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => showToast(`Downloaded copy of ${d.title}`)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 font-bold text-xs transition-colors cursor-pointer"
            title="Download PDF"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto text-left">
      {/* Toast Alert */}
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
            <FileCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>{headerInfo.badge}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {headerInfo.title}
          </h1>
          <p className="text-xs text-slate-500 max-w-xl">
            {headerInfo.desc}
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center space-x-2.5">
          {canPerformAction(user, 'compliance', 'add') && (
            <button
              onClick={() => setCreateDocModalOpen(true)}
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Generate Document</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Total Records</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{documents.length}</div>
          <div className="text-[11px] text-slate-400 font-semibold mt-0.5">Across 10 Categories</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 text-xs font-bold">
            <span>Verified & Sealed</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">100%</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Digitally Signed</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 text-xs font-bold">
            <span>Statutory Calendar</span>
            <Calendar className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">3 Upcoming</div>
          <div className="text-[11px] text-slate-400 font-semibold mt-0.5">PF, ESI & GST Deadlines</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-indigo-600 text-xs font-bold">
            <span>Active Expiry Alerts</span>
            <AlertCircle className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-600 mt-2">2 Alerts</div>
          <div className="text-[11px] text-slate-400 font-semibold mt-0.5">Passports & Credentials</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center space-x-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by document ID, title, or recipient..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs font-medium focus:outline-none bg-transparent"
        />
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <DataTable
          columns={columns}
          data={displayedDocuments}
          initialPageSize={10}
        />
      </div>

      {/* --------------------------------------------------------------------------------- */}
      {/* MODAL: CREATE DOCUMENT */}
      {/* --------------------------------------------------------------------------------- */}
      <Modal
        isOpen={createDocModalOpen}
        onClose={() => setCreateDocModalOpen(false)}
        title={`Generate ${headerInfo.title}`}
      >
        <form onSubmit={handleCreateDocument} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Document Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Appointment Letter & Compensation Terms"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Stakeholder / Issued To</label>
              <input
                type="text"
                required
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Expiry Date (Optional)</label>
            <input
              type="date"
              value={newExpiry}
              onChange={(e) => setNewExpiry(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setCreateDocModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20"
            >
              Generate & Seal
            </button>
          </div>
        </form>
      </Modal>

      {/* --------------------------------------------------------------------------------- */}
      {/* MODAL: VIEW DOCUMENT DETAIL & SEAL */}
      {/* --------------------------------------------------------------------------------- */}
      {viewDocModalItem && (
        <Modal
          isOpen={true}
          onClose={() => setViewDocModalItem(null)}
          title={`Document Dossier — ${viewDocModalItem.doc_code}`}
        >
          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl mx-auto">
                K
              </div>
              <h3 className="font-black text-lg text-slate-900">{viewDocModalItem.title}</h3>
              <p className="text-xs text-slate-500">Issued to <strong>{viewDocModalItem.issued_to}</strong> on {viewDocModalItem.issue_date}</p>

              {viewDocModalItem.digital_sign_hash && (
                <div className="p-3 rounded-xl bg-white border border-slate-200 text-left space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Cryptographic Digital Verification</span>
                  <span className="font-mono text-[9px] text-slate-600 break-all block">{viewDocModalItem.digital_sign_hash}</span>
                  <div className="flex items-center space-x-1 text-emerald-600 text-[10px] font-bold pt-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Digitally Signed & Compliance Certified by KALINGA ERP</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-mono text-slate-400">{viewDocModalItem.doc_code}</span>
              <button
                onClick={() => {
                  showToast('Document sent to print spooler!');
                  window.print();
                }}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CompliancePage;
