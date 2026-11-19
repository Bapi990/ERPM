import React, { useState, useEffect } from 'react';
import {
  Mail, Phone, Building2, Users, Calendar, Eye, Trash2,
  CheckCircle2, AlertCircle, Search, Filter, Download,
  Clock, ShieldCheck, Sparkles, MessageSquare, Layers,
  ExternalLink, Check, X, RefreshCw, ChevronRight, Inbox
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/common/Modal';

export interface WebsiteInquiry {
  id: string;
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  industry: string;
  employeeCount: string;
  requiredModules: string[];
  message: string;
  status: 'new' | 'contacted' | 'in_discussion' | 'converted';
  createdAt: string;
}

const DEFAULT_INITIAL_INQUIRIES: WebsiteInquiry[] = [
  {
    id: "DEMO-892401",
    fullName: "Soumya Ranjan Patnaik",
    companyName: "Kalinga Steel & Alloys Pvt Ltd",
    email: "soumya.patnaik@kalingasteel.co.in",
    phone: "+91 94370 12890",
    industry: "manufacturing",
    employeeCount: "200-500",
    requiredModules: ["hrms", "crm", "billing", "inventory"],
    message: "Need automated LOP calculations for 3-shift steel plant workers in Rourkela, with CBIC e-invoicing and weighbridge integration.",
    status: "new",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: "DEMO-874192",
    fullName: "Priyadarshini Mohanty",
    companyName: "Bhubaneswar Cloud Innovations",
    email: "priya@bhubaneswarcloud.tech",
    phone: "+91 82491 55678",
    industry: "it-software",
    employeeCount: "50-200",
    requiredModules: ["hrms", "crm", "billing"],
    message: "Looking for integrated biometric check-in with facial verification and USD/INR multi-currency tax invoices for US client billing.",
    status: "contacted",
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString()
  },
  {
    id: "DEMO-861054",
    fullName: "Bibhuti Bhusan Sahoo",
    companyName: "Odisha Agro & Cold Chain Logistics",
    email: "bibhuti.agro@odishalogistics.in",
    phone: "+91 99371 44321",
    industry: "trading",
    employeeCount: "10-50",
    requiredModules: ["billing", "inventory", "crm"],
    message: "Fast barcode inventory dispatch, batch tracking for perishables, and automated GST GSTR-1 JSON reconciliation.",
    status: "in_discussion",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

const INDUSTRY_LABELS: Record<string, string> = {
  'it-software': 'IT & Software',
  'manufacturing': 'Manufacturing & Defence',
  'retail': 'Retail & E-Commerce',
  'trading': 'Trading & Distribution',
  'consultancy': 'Consultancy & Legal',
  'service': 'Field Service & Maintenance',
  'startups': 'High-Growth Startup',
  'corporate': 'Large Corporate'
};

const MODULE_LABELS: Record<string, string> = {
  'hrms': 'HRMS & Payroll',
  'crm': 'Omnichannel CRM',
  'billing': 'Smart GST Billing',
  'inventory': 'Inventory & Stock'
};

export const WebsiteInquiriesPage: React.FC = () => {
  const { user } = useAuth();
  const [inquiries, setInquiries] = useState<WebsiteInquiry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<WebsiteInquiry | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Load inquiries from localStorage or seed
  const loadInquiries = () => {
    try {
      const stored = localStorage.getItem('gb_website_inquiries');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setInquiries(parsed);
          return;
        }
      }
      // Seed default demo inquiries if empty
      localStorage.setItem('gb_website_inquiries', JSON.stringify(DEFAULT_INITIAL_INQUIRIES));
      setInquiries(DEFAULT_INITIAL_INQUIRIES);
    } catch (e) {
      console.error('Error loading website inquiries:', e);
      setInquiries(DEFAULT_INITIAL_INQUIRIES);
    }
  };

  useEffect(() => {
    loadInquiries();

    // Listen to real-time events from the website Contact form
    const handleInquiryReceived = (e: any) => {
      if (e?.detail) {
        setInquiries(prev => [e.detail, ...prev.filter(item => item.id !== e.detail.id)]);
        setSuccessToast(`New inquiry received from ${e.detail.companyName}!`);
        setTimeout(() => setSuccessToast(null), 5000);
      } else {
        loadInquiries();
      }
    };

    window.addEventListener('website_inquiry_received', handleInquiryReceived);
    window.addEventListener('storage', loadInquiries);

    return () => {
      window.removeEventListener('website_inquiry_received', handleInquiryReceived);
      window.removeEventListener('storage', loadInquiries);
    };
  }, []);

  const saveInquiries = (updated: WebsiteInquiry[]) => {
    setInquiries(updated);
    try {
      localStorage.setItem('gb_website_inquiries', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save inquiries to localStorage', e);
    }
  };

  const handleDelete = (id: string) => {
    const updated = inquiries.filter(item => item.id !== id);
    saveInquiries(updated);
    if (selectedInquiry?.id === id) {
      setSelectedInquiry(null);
    }
    setDeleteConfirmId(null);
    setSuccessToast('Inquiry removed successfully.');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleStatusChange = (id: string, newStatus: WebsiteInquiry['status']) => {
    const updated = inquiries.map(item =>
      item.id === id ? { ...item, status: newStatus } : item
    );
    saveInquiries(updated);
    if (selectedInquiry?.id === id) {
      setSelectedInquiry(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  // Filtered inquiries
  const filtered = inquiries.filter(item => {
    const matchesSearch =
      item.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (INDUSTRY_LABELS[item.industry] || item.industry).toLowerCase().includes(searchQuery.toLowerCase());

    const matchesIndustry = selectedIndustry === 'all' || item.industry === selectedIndustry;
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;

    return matchesSearch && matchesIndustry && matchesStatus;
  });

  const exportCSV = () => {
    const headers = ['Reference ID', 'Company Name', 'Contact Person', 'Email', 'Phone', 'Industry', 'Employee Count', 'Modules', 'Notes', 'Status', 'Date'];
    const rows = filtered.map(i => [
      `"${i.id}"`,
      `"${i.companyName}"`,
      `"${i.fullName}"`,
      `"${i.email}"`,
      `"${i.phone}"`,
      `"${INDUSTRY_LABELS[i.industry] || i.industry}"`,
      `"${i.employeeCount}"`,
      `"${i.requiredModules.map(m => MODULE_LABELS[m] || m).join(', ')}"`,
      `"${(i.message || '').replace(/"/g, '""')}"`,
      `"${i.status}"`,
      `"${new Date(i.createdAt).toLocaleString('en-IN')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `odias_website_inquiries_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Stats calculation
  const totalCount = inquiries.length;
  const newCount = inquiries.filter(i => i.status === 'new').length;
  const inDiscussionCount = inquiries.filter(i => i.status === 'in_discussion' || i.status === 'contacted').length;
  const convertedCount = inquiries.filter(i => i.status === 'converted').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Alert */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-xl animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-semibold">{successToast}</span>
          <button onClick={() => setSuccessToast(null)} className="ml-2 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-mono font-bold border border-blue-400/30">
              <Inbox className="w-3.5 h-3.5" />
              <span>PUBLIC WEBSITE CONTACT LEADS INGESTION</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Website Inquiries & Leads
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Real-time stream of demo requests and operational inquiries submitted through the Odias ERP public website. Review corporate requirements, contact decision-makers, and track deal conversions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={loadInquiries}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Total Submissions</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{totalCount}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Inbox className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">New Inquiries</span>
            <span className="text-2xl font-black text-amber-600 mt-1 block flex items-center gap-2">
              {newCount}
              {newCount > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              )}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">In Pipeline</span>
            <span className="text-2xl font-black text-indigo-600 mt-1 block">{inDiscussionCount}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Converted Clients</span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">{convertedCount}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search company, name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Industry filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="all">All Sectors</option>
              <option value="it-software">IT & Software</option>
              <option value="manufacturing">Manufacturing & Defence</option>
              <option value="retail">Retail & E-Commerce</option>
              <option value="trading">Trading & Distribution</option>
              <option value="consultancy">Consultancy & Legal</option>
              <option value="service">Field Service & Maintenance</option>
              <option value="startups">High-Growth Startup</option>
              <option value="corporate">Large Corporate</option>
            </select>
          </div>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="new">New Ingestion</option>
            <option value="contacted">Contacted</option>
            <option value="in_discussion">In Discussion</option>
            <option value="converted">Converted</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Ref / Date</th>
                <th className="py-3.5 px-4">Company Name</th>
                <th className="py-3.5 px-4">Contact Person</th>
                <th className="py-3.5 px-4">Business Contact</th>
                <th className="py-3.5 px-4">Industry & Scale</th>
                <th className="py-3.5 px-4">Requested Modules</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Inbox className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-600">No website inquiries found</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your search filters or submit a new form on the website.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Ref / Date */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-blue-600 block">{item.id}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(item.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </td>

                    {/* Company */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-bold text-slate-900">{item.companyName}</span>
                      </div>
                    </td>

                    {/* Person */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-800">{item.fullName}</span>
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <a
                          href={`mailto:${item.email}`}
                          className="flex items-center gap-1.5 text-blue-600 hover:underline"
                        >
                          <Mail className="w-3.5 h-3.5 shrink-0" />
                          <span>{item.email}</span>
                        </a>
                        <a
                          href={`tel:${item.phone}`}
                          className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900"
                        >
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          <span>{item.phone}</span>
                        </a>
                      </div>
                    </td>

                    {/* Industry & Scale */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {INDUSTRY_LABELS[item.industry] || item.industry}
                        </span>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-400" />
                          <span>{item.employeeCount} Staff</span>
                        </div>
                      </div>
                    </td>

                    {/* Modules */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {item.requiredModules.map((m) => (
                          <span
                            key={m}
                            className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold"
                          >
                            {MODULE_LABELS[m] || m}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value as any)}
                        className={`text-[11px] font-bold px-2 py-1 rounded-lg border outline-none cursor-pointer ${
                          item.status === 'new'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : item.status === 'contacted'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : item.status === 'in_discussion'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        <option value="new">● New Ingestion</option>
                        <option value="contacted">● Contacted</option>
                        <option value="in_discussion">● In Discussion</option>
                        <option value="converted">● Converted</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedInquiry(item)}
                          title="View Full Details"
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(item.id)}
                          title="Delete Lead"
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW DETAILS MODAL */}
      <Modal
        isOpen={!!selectedInquiry}
        onClose={() => setSelectedInquiry(null)}
        title="Website Lead Details"
        subtitle={`Reference ID: ${selectedInquiry?.id}`}
        size="lg"
      >
        {selectedInquiry && (
          <div className="space-y-6 text-xs">
            {/* Top Identity Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Enterprise Account</span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">{selectedInquiry.companyName}</h3>
                <span className="text-xs text-slate-600 font-medium">Contact Person: <strong>{selectedInquiry.fullName}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`mailto:${selectedInquiry.email}`}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Send Email</span>
                </a>
                <a
                  href={`tel:${selectedInquiry.phone}`}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs border border-slate-300 flex items-center gap-1.5 shadow-xs"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Call Lead</span>
                </a>
              </div>
            </div>

            {/* Grid of Key Properties */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Industry Sector</span>
                <span className="font-bold text-slate-900 text-sm block">
                  {INDUSTRY_LABELS[selectedInquiry.industry] || selectedInquiry.industry}
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Workforce Scale</span>
                <span className="font-bold text-slate-900 text-sm block">
                  {selectedInquiry.employeeCount} Employees
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Business Email</span>
                <span className="font-bold text-blue-600 text-sm block font-mono">
                  {selectedInquiry.email}
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Phone Number</span>
                <span className="font-bold text-slate-900 text-sm block font-mono">
                  {selectedInquiry.phone}
                </span>
              </div>
            </div>

            {/* Required Modules */}
            <div>
              <span className="text-[11px] font-bold text-slate-700 block mb-2 uppercase tracking-wider">
                Requested Odias ERP Modules
              </span>
              <div className="flex flex-wrap gap-2">
                {selectedInquiry.requiredModules.map((m) => (
                  <span
                    key={m}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 font-bold border border-blue-200 text-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>{MODULE_LABELS[m] || m}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Operational Notes */}
            <div>
              <span className="text-[11px] font-bold text-slate-700 block mb-2 uppercase tracking-wider">
                Operational Requirements / Notes
              </span>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs leading-relaxed font-sans whitespace-pre-wrap">
                {selectedInquiry.message || 'No additional notes provided.'}
              </div>
            </div>

            {/* Status & Timestamp */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600">Pipeline Status:</span>
                <select
                  value={selectedInquiry.status}
                  onChange={(e) => handleStatusChange(selectedInquiry.id, e.target.value as any)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-800 outline-none focus:border-blue-500"
                >
                  <option value="new">New Ingestion</option>
                  <option value="contacted">Contacted</option>
                  <option value="in_discussion">In Discussion</option>
                  <option value="converted">Converted Client</option>
                </select>
              </div>

              <div className="text-[11px] text-slate-500 font-mono">
                Received: {new Date(selectedInquiry.createdAt).toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Confirm Deletion"
        size="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Are you sure you want to permanently delete this website inquiry lead? This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              Yes, Delete Lead
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WebsiteInquiriesPage;
