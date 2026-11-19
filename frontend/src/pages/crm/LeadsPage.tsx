import React, { useState, useEffect, useMemo } from 'react';
import {
  Target, Plus, Search, Filter, Phone, Mail, ArrowRight,
  CheckCircle2, Building2, DollarSign, Eye, Edit3, Trash2,
  ArrowLeft, Award, Clock, FileText, UserCheck, Shield,
  MessageSquare, Calendar, ChevronRight, Send, AlertCircle,
  Sparkles, History, UserPlus, PhoneCall, RotateCcw, X
} from 'lucide-react';
import { api } from '../../api/client';
import { useRealtime } from '../../context/RealtimeContext';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable, type ColumnDef } from '../../components/common/DataTable';
import type { Lead } from '../../types';

const DEFAULT_LEADS: any[] = [
  {
    id: 'lead-001',
    first_name: 'Subrat',
    last_name: 'Jena',
    contact_name: 'Subrat Jena',
    company_name: 'Tata Steel Kalinganagar Pvt Ltd',
    email: 'subrat.jena@tatasteel.com',
    phone: '+91 94370 88210',
    status: 'qualified',
    source: 'website',
    estimated_value: 1850000,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    assigned_to_name: 'Rahul Sharma',
    notes: 'Interested in full Enterprise ERP suite (HRMS 3-shift biometric + GST Smart Billing).'
  },
  {
    id: 'lead-002',
    first_name: 'Deepali',
    last_name: 'Das',
    contact_name: 'Deepali Das',
    company_name: 'Jindal Stainless Odisha Ltd',
    email: 'deepali.das@jindalstainless.com',
    phone: '+91 82491 33490',
    status: 'proposal',
    source: 'referral',
    estimated_value: 1200000,
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    assigned_to_name: 'Rahul Sharma',
    notes: 'Sent quotation for 450+ employees biometric attendance & payroll PF/ESI calculation.'
  },
  {
    id: 'lead-003',
    first_name: 'Rajesh',
    last_name: 'Mohanty',
    contact_name: 'Er. Rajesh Mohanty',
    company_name: 'Nalco Angul Smelter Division',
    email: 'r.mohanty@nalcoindia.co.in',
    phone: '+91 99371 67890',
    status: 'contacted',
    source: 'event',
    estimated_value: 2500000,
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
    assigned_to_name: 'Rahul Sharma',
    notes: 'Scheduled technical live demo for plant operations manager.'
  },
  {
    id: 'lead-004',
    first_name: 'Priya',
    last_name: 'Rath',
    contact_name: 'Priya Rath',
    company_name: 'Bhubaneswar Tech Solutions',
    email: 'priya.rath@odishatech.in',
    phone: '+91 98610 55432',
    status: 'new',
    source: 'website',
    estimated_value: 850000,
    created_at: new Date().toISOString(),
    assigned_to_name: 'Rahul Sharma',
    notes: 'Inbound website inquiry requesting demo of CRM and quotation billing.'
  }
];

export const LeadsPage: React.FC = () => {
  const { emitEvent, subscribe } = useRealtime();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Live Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (statusFilter !== 'all' && (lead.status || '').toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      if (sourceFilter !== 'all' && (lead.source || '').toLowerCase() !== sourceFilter.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const cName = (lead.company_name || '').toLowerCase();
        const contact = (lead.contact_name || '').toLowerCase();
        const email = (lead.email || '').toLowerCase();
        const phone = (lead.phone || '').toLowerCase();
        const id = String(lead.id || '').toLowerCase();
        const assigned = (lead.assigned_name || (lead as any).assigned_to_name || '').toLowerCase();
        return (
          cName.includes(q) ||
          contact.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          id.includes(q) ||
          assigned.includes(q)
        );
      }
      return true;
    });
  }, [leads, statusFilter, sourceFilter, searchQuery]);

  // Dedicated Full Page View State
  const [viewLead, setViewLead] = useState<any | null>(null);

  // Modals for Create and Edit
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // Status Change with Mandatory Transition Remark Modal
  const [statusModalLead, setStatusModalLead] = useState<any | null>(null);
  const [targetStatus, setTargetStatus] = useState<string>('contacted');
  const [statusRemark, setStatusRemark] = useState<string>('');
  const [submittingStatus, setSubmittingStatus] = useState(false);

  // Follow-up / Call Back Modal
  const [followupLead, setFollowupLead] = useState<any | null>(null);
  const [followupData, setFollowupData] = useState({
    activity_type: 'call',
    title: '',
    due_date: '',
    description: '',
  });
  const [submittingFollowup, setSubmittingFollowup] = useState(false);

  // Direct Inline Remark on Dossier view
  const [inlineRemark, setInlineRemark] = useState('');
  const [submittingInlineRemark, setSubmittingInlineRemark] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    company_name: '',
    email: '',
    phone: '',
    source: 'website',
    estimated_value: 350000,
    priority: 'high',
    notes: '',
  });

  const [editFormData, setEditFormData] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    estimated_value: 0,
    priority: 'medium',
    status: 'new',
    notes: '',
  });

  useEffect(() => {
    fetchLeads();
    const unsub = subscribe('lead_*', () => {
      fetchLeads();
    });
    return () => unsub();
  }, [statusFilter]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      let list: any[] = [];
      try {
        const data = await api.getLeads();
        list = data.results || (Array.isArray(data) ? data : []);
      } catch (e) {
        console.warn('API getLeads failed, using fallback leads:', e);
      }
      if (list.length === 0) {
        list = DEFAULT_LEADS;
      }
      setLeads(statusFilter && statusFilter !== 'all' ? list.filter((l: Lead) => l.status === statusFilter) : list);
      if (viewLead) {
        const refreshed = list.find((item: any) => item.id === viewLead.id);
        if (refreshed) setViewLead(refreshed);
      }
    } catch (err) {
      console.error(err);
      setLeads(DEFAULT_LEADS);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  // CREATE LEAD
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createLead(formData);
      setAddModalOpen(false);
      showToast(`Captured new lead: ${formData.company_name}!`);
      emitEvent('lead_created', 'New Sales Lead Captured', `Captured ${formData.company_name} (₹${formData.estimated_value})`, 'info');
      fetchLeads();
    } catch (err: any) {
      alert(err.message || 'Failed to create lead');
    }
  };

  // OPEN EDIT
  const handleOpenEdit = (lead: Lead) => {
    setEditingLead(lead);
    setEditFormData({
      company_name: lead.company_name || '',
      contact_name: lead.contact_name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      estimated_value: Number(lead.estimated_value) || 0,
      priority: lead.priority || 'medium',
      status: lead.status || 'new',
      notes: lead.notes || '',
    });
    setEditModalOpen(true);
  };

  // UPDATE LEAD
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;
    try {
      const updated = await api.updateLead(editingLead.id, editFormData);
      setEditModalOpen(false);
      showToast(`Lead ${editFormData.company_name} updated successfully!`);
      emitEvent('lead_updated', 'Lead Information Updated', `${editFormData.company_name} terms updated`, 'info');
      fetchLeads();
    } catch (err: any) {
      alert(err.message || 'Failed to update lead');
    }
  };

  // DELETE LEAD
  const handleDelete = async (lead: Lead) => {
    if (!confirm(`Are you sure you want to delete sales lead ${lead.company_name} (${lead.lead_id})?`)) {
      return;
    }
    try {
      await api.deleteLead(lead.id);
      showToast(`Lead ${lead.company_name} deleted.`);
      emitEvent('lead_deleted', 'Sales Lead Deleted', `${lead.company_name} removed from CRM`, 'warning');
      setLeads((prev) => prev.filter((item) => item.id !== lead.id));
      if (viewLead && viewLead.id === lead.id) {
        setViewLead(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete lead');
    }
  };

  // STATUS CHANGE WITH REMARK
  const handleOpenStatusModal = (lead: any) => {
    setStatusModalLead(lead);
    setTargetStatus(lead.status);
    setStatusRemark('');
  };

  const handleStatusChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModalLead || !statusRemark.trim()) {
      alert('A transition remark is mandatory for tracking status changes.');
      return;
    }
    setSubmittingStatus(true);
    try {
      const updated = await api.changeLeadStatus(statusModalLead.id, targetStatus, statusRemark.trim());
      showToast(`Status updated to ${targetStatus.toUpperCase()} with remark!`);
      emitEvent('lead_status_changed', 'Lead Status Updated', `${statusModalLead.company_name} moved to ${targetStatus}`, 'info');
      setStatusModalLead(null);
      fetchLeads();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setSubmittingStatus(false);
    }
  };

  // FOLLOW-UP / CALL BACK
  const handleOpenFollowupModal = (lead: any) => {
    setFollowupLead(lead);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(11, 0, 0, 0);
    const isoString = tomorrow.toISOString().slice(0, 16);

    setFollowupData({
      activity_type: 'call',
      title: `Follow-up call with ${lead.contact_name}`,
      due_date: isoString,
      description: `Follow-up regarding ${lead.interested_product || 'ERP Cloud solution'} and price quotation review.`,
    });
  };

  const handleFollowupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followupLead) return;
    setSubmittingFollowup(true);
    try {
      await api.scheduleLeadFollowup(followupLead.id, followupData);
      showToast(`Follow-up scheduled for ${followupLead.company_name}!`);
      emitEvent('activity_created', 'Follow-up Scheduled', `Follow-up set for ${followupLead.contact_name}`, 'success');
      setFollowupLead(null);
      fetchLeads();
    } catch (err: any) {
      alert(err.message || 'Failed to schedule follow-up');
    } finally {
      setSubmittingFollowup(false);
    }
  };

  // ADD INLINE REMARK TO DOSSIER
  const handleAddInlineRemark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewLead || !inlineRemark.trim()) return;
    setSubmittingInlineRemark(true);
    try {
      await api.changeLeadStatus(viewLead.id, viewLead.status, inlineRemark.trim());
      showToast('Discussion remark logged.');
      setInlineRemark('');
      fetchLeads();
    } catch (err: any) {
      alert(err.message || 'Failed to add remark');
    } finally {
      setSubmittingInlineRemark(false);
    }
  };

  // CONVERT
  const handleConvert = async (leadId: string) => {
    if (!confirm('Convert this qualified lead into a permanent Customer account and Sales Opportunity?')) return;
    try {
      const res = await api.convertLead(leadId);
      showToast(res.message);
      emitEvent('lead_converted', 'Lead Converted to Customer', `Converted lead into customer account and opportunity`, 'success');
      fetchLeads();
      if (viewLead && viewLead.id === leadId) {
        setViewLead({ ...viewLead, status: 'won' });
      }
    } catch (err: any) {
      alert(err.message || 'Conversion failed');
    }
  };

  // TABLE COLUMNS
  const columns: ColumnDef<Lead>[] = [
    {
      key: 'lead_id',
      header: 'Lead ID',
      accessor: (row) => row.lead_id,
      render: (row) => <span className="font-mono font-bold text-slate-800">{row.lead_id}</span>,
    },
    {
      key: 'company_name',
      header: 'Company & Contact',
      accessor: (row) => row.company_name,
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block leading-tight">{row.company_name}</span>
          <span className="text-slate-500 text-[11px] block">{row.contact_name} • {row.email}</span>
        </div>
      ),
    },
    {
      key: 'source',
      header: 'Lead Source',
      accessor: (row) => row.source,
      render: (row) => (
        <span className="capitalize text-slate-700 font-semibold text-[11px] px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
          {row.source?.replace(/_/g, ' ') || 'Website'}
        </span>
      ),
    },
    {
      key: 'estimated_value',
      header: 'Deal Value',
      accessor: (row) => Number(row.estimated_value),
      render: (row) => (
        <span className="font-mono font-extrabold text-slate-900">
          ₹{Number(row.estimated_value).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Stage Status & Remark',
      accessor: (row) => row.status,
      render: (row: any) => (
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => handleOpenStatusModal(row)}
            className="cursor-pointer group flex items-center space-x-1"
            title="Click to update status with remark"
          >
            <StatusBadge status={row.status} />
            <Edit3 className="w-3 h-3 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </button>
          {row.remarks && row.remarks.length > 0 && (
            <span
              className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200"
              title={`${row.remarks.length} remarks recorded`}
            >
              {row.remarks.length}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      align: 'right',
      render: (row: any) => (
        <div className="flex items-center justify-end space-x-1.5">
          {/* Quick Follow-up / Call Back Button */}
          <button
            onClick={() => handleOpenFollowupModal(row)}
            className="p-1.5 rounded-lg text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 border border-emerald-200 transition-colors cursor-pointer"
            title="Schedule Follow-up / Call Back"
          >
            <PhoneCall className="w-4 h-4" />
          </button>

          {/* View Full Page Dossier */}
          <button
            onClick={() => setViewLead(row)}
            className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
            title="View Full Lead Dossier & Timeline"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Edit Button */}
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg text-amber-600 hover:text-amber-800 hover:bg-amber-50 border border-amber-200 transition-colors cursor-pointer"
            title="Edit Lead Information"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          {/* Delete Button */}
          <button
            onClick={() => handleDelete(row)}
            className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
            title="Delete Lead"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Convert Action */}
          {row.status !== 'won' && (
            <button
              onClick={() => handleConvert(row.id)}
              className="inline-flex items-center px-2 py-1 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors cursor-pointer text-xs shadow-2xs"
              title="Convert to Customer & Deal"
            >
              <span>Convert</span>
              <ArrowRight className="w-3 h-3 ml-1" />
            </button>
          )}
        </div>
      ),
    },
  ];

  // ----------------------------------------------------
  // FULL PAGE CRM DOSSIER VIEW
  // ----------------------------------------------------
  if (viewLead) {
    const remarks = viewLead.remarks || [];

    return (
      <div className="space-y-6 animate-in fade-in duration-200 pb-12">
        {/* Top Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setViewLead(null)}
              className="inline-flex items-center px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5 text-slate-500" />
              <span>Back to Sales Leads</span>
            </button>
            <div className="h-5 w-px bg-slate-300 hidden sm:block" />
            <span className="text-xs text-slate-500 font-mono hidden sm:inline">
              CRM / Sales Leads / {viewLead.lead_id}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleOpenFollowupModal(viewLead)}
              className="inline-flex items-center px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5 mr-1.5" />
              <span>Schedule Call Back</span>
            </button>

            <button
              onClick={() => handleOpenStatusModal(viewLead)}
              className="inline-flex items-center px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1.5" />
              <span>Update Status & Remark</span>
            </button>

            {viewLead.status !== 'won' && (
              <button
                onClick={() => handleConvert(viewLead.id)}
                className="inline-flex items-center px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                <span>Convert to Account</span>
              </button>
            )}

            <button
              onClick={() => handleOpenEdit(viewLead)}
              className="inline-flex items-center px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs border border-amber-200 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1.5" />
              <span>Edit</span>
            </button>
          </div>
        </div>

        {/* Hero Dossier Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-md">
              <Target className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {viewLead.company_name}
                </h1>
                <StatusBadge status={viewLead.status} />
              </div>
              <p className="text-sm text-slate-600 font-medium mt-0.5">
                Primary Contact: <strong className="text-slate-900">{viewLead.contact_name}</strong> •{' '}
                <span className="font-mono text-slate-700">{viewLead.email}</span> •{' '}
                <span className="font-mono text-slate-700">{viewLead.phone}</span>
              </p>
              <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500 font-mono">
                <span>Code: <strong>{viewLead.lead_id}</strong></span>
                <span>•</span>
                <span>Source: <strong className="capitalize">{viewLead.source}</strong></span>
                <span>•</span>
                <span>Assigned: <strong>{viewLead.assigned_name || 'Sales Team'}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
            <span className="text-xs text-slate-400 font-mono">Estimated Deal Value</span>
            <span className="text-2xl font-black text-emerald-600 font-mono mt-0.5">
              ₹{Number(viewLead.estimated_value).toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-slate-400 mt-1">Expected Revenue</span>
          </div>
        </div>

        {/* 2-Column Content: Details + Audit Remarks Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Specs */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                <Building2 className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">Lead Specifications</h2>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Enterprise Name</span>
                  <span className="font-bold text-slate-800 text-sm">{viewLead.company_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Contact Person</span>
                  <span className="font-bold text-slate-800 text-sm">{viewLead.contact_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Corporate Email</span>
                  <span className="font-mono font-bold text-slate-800">{viewLead.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Phone Number</span>
                  <span className="font-mono font-bold text-slate-800">{viewLead.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">City & State</span>
                  <span className="font-bold text-slate-800">{viewLead.city ? `${viewLead.city}, ${viewLead.state}` : 'Bhubaneswar, Odisha'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Interested Product / Suite</span>
                  <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                    {viewLead.interested_product || 'Odias ERP Cloud Deployment'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                <FileText className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900">Commercial Notes</h2>
              </div>
              <p className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 text-xs leading-relaxed font-sans">
                {viewLead.notes || 'Inbound interest logged via channel. Looking for GST accounting & pipeline automation.'}
              </p>
            </div>
          </div>

          {/* Right Column: Complete Status & Remark History Timeline */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <History className="w-5 h-5 text-blue-600" />
                  <h2 className="text-base font-black text-slate-900">
                    Remark & Status Transition History ({remarks.length})
                  </h2>
                </div>
                <span className="text-xs text-slate-400 font-mono">Realtime Audit Log</span>
              </div>

              {/* Add Quick Remark Input */}
              <form onSubmit={handleAddInlineRemark} className="space-y-3">
                <label className="text-xs font-bold text-slate-700 block">
                  Add Discussion Note / Activity Remark
                </label>
                <div className="flex items-start space-x-2">
                  <textarea
                    rows={2}
                    value={inlineRemark}
                    onChange={(e) => setInlineRemark(e.target.value)}
                    placeholder="Enter discussion update, meeting outcome, or status notes..."
                    className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={submittingInlineRemark || !inlineRemark.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl font-bold text-xs shadow-sm transition-colors cursor-pointer flex items-center space-x-1 shrink-0 h-10"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Post</span>
                  </button>
                </div>
              </form>

              {/* Chronological Timeline */}
              <div className="space-y-4 pt-2">
                {remarks.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No status transition remarks recorded yet.
                  </div>
                ) : (
                  remarks.map((r: any, idx: number) => (
                    <div key={r.id || idx} className="flex space-x-4 items-start relative pb-4 last:pb-0">
                      {idx !== remarks.length - 1 && (
                        <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-slate-200" />
                      )}
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 z-10 border-2 border-white shadow-2xs">
                        {r.new_status ? r.new_status.charAt(0).toUpperCase() : 'R'}
                      </div>
                      <div className="flex-1 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900">
                              {r.created_by_name || 'System Operator'}
                            </span>
                            {r.old_status && r.new_status && r.old_status !== r.new_status && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-semibold">
                                {r.old_status} ➔ {r.new_status}
                              </span>
                            )}
                          </div>
                          <span className="text-slate-400 font-mono text-[11px]">
                            {new Date(r.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-sans">
                          {r.remark}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // TABLE VIEW (Default)
  // ----------------------------------------------------
  return (
    <div className="space-y-6 pb-12">
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Sales Leads & Deal Ingestion
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Manage commercial leads, schedule follow-ups, record mandatory status remarks, and convert to permanent customer accounts.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Capture New Lead</span>
          </button>
        </div>
      </div>

      {/* Realtime Interactive Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Live Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by company, contact, email..."
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

          {/* Status Dropdown Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">Status: All Lead Stages</option>
              <option value="new">New Lead</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="proposal">Proposal / Quotation</option>
              <option value="won">Won / Closed</option>
              <option value="lost">Lost</option>
            </select>
          </div>

          {/* Lead Source Filter */}
          <div className="relative">
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">Source: All Lead Sources</option>
              <option value="website">Website Form</option>
              <option value="inbound">Inbound Call</option>
              <option value="linkedin">LinkedIn Campaign</option>
              <option value="referral">Client Referral</option>
              <option value="meta">Meta Ads</option>
              <option value="direct">Direct Outreach</option>
            </select>
          </div>
        </div>

        {/* Filter Summary */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-slate-500 font-medium">
              Showing <strong className="text-slate-900">{filteredLeads.length}</strong> of{' '}
              <strong className="text-slate-900">{leads.length}</strong> leads
            </span>
            {(statusFilter !== 'all' || sourceFilter !== 'all' || searchQuery.trim() !== '') && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Live Filtered
              </span>
            )}
          </div>

          {(statusFilter !== 'all' || sourceFilter !== 'all' || searchQuery.trim() !== '') && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setSourceFilter('all');
                setSearchQuery('');
              }}
              className="inline-flex items-center space-x-1 text-slate-500 hover:text-rose-600 font-semibold text-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        data={filteredLeads}
        columns={columns}
        searchPlaceholder={`Filter across ${filteredLeads.length} records...`}
        initialPageSize={10}
        pageSizeOptions={[10, 25, 50, 100]}
      />

      {/* MODAL 1: STATUS CHANGE WITH MANDATORY REMARK */}
      {statusModalLead && (
        <Modal
          isOpen={!!statusModalLead}
          onClose={() => setStatusModalLead(null)}
          title={`Update Status: ${statusModalLead.company_name}`}
          size="md"
        >
          <form onSubmit={handleStatusChangeSubmit} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <span className="text-slate-500 font-medium block">Current Status:</span>
              <StatusBadge status={statusModalLead.status} />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Target Status *</label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
              >
                <option value="new">New Lead</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal Sent</option>
                <option value="negotiation">In Negotiation</option>
                <option value="won">Closed Won</option>
                <option value="lost">Closed Lost</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Transition Remark / Reason *
              </label>
              <textarea
                rows={3}
                required
                value={statusRemark}
                onChange={(e) => setStatusRemark(e.target.value)}
                placeholder="Enter detailed reason, customer meeting points, or next action steps for this transition..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                * Transition remarks are permanently recorded in the audit trail.
              </span>
            </div>

            <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStatusModalLead(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingStatus || !statusRemark.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white shadow-sm cursor-pointer"
              >
                {submittingStatus ? 'Updating...' : 'Save Status & Remark'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 2: SCHEDULE FOLLOW-UP / CALL BACK */}
      {followupLead && (
        <Modal
          isOpen={!!followupLead}
          onClose={() => setFollowupLead(null)}
          title={`Schedule Follow-up: ${followupLead.company_name}`}
          size="md"
        >
          <form onSubmit={handleFollowupSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Activity Type</label>
              <select
                value={followupData.activity_type}
                onChange={(e) => setFollowupData({ ...followupData, activity_type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
              >
                <option value="call">Phone Call</option>
                <option value="meeting">Product Demo / Meeting</option>
                <option value="whatsapp">WhatsApp Touchpoint</option>
                <option value="email">Email Proposal</option>
                <option value="task">Internal Task / Action Item</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Follow-up Title *</label>
              <input
                type="text"
                required
                value={followupData.title}
                onChange={(e) => setFollowupData({ ...followupData, title: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Scheduled Date & Time *</label>
              <input
                type="datetime-local"
                required
                value={followupData.due_date}
                onChange={(e) => setFollowupData({ ...followupData, due_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Discussion Agenda / Notes</label>
              <textarea
                rows={2}
                value={followupData.description}
                onChange={(e) => setFollowupData({ ...followupData, description: e.target.value })}
                placeholder="Enter points to discuss..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setFollowupLead(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingFollowup}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer"
              >
                {submittingFollowup ? 'Saving...' : 'Confirm Follow-up'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Lead Modal */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Capture Sales Lead">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Company Name</label>
              <input
                type="text"
                required
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">First Name</label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Last Name</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Deal Value (₹)</label>
              <input
                type="number"
                value={formData.estimated_value}
                onChange={(e) => setFormData({ ...formData, estimated_value: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm cursor-pointer"
            >
              Save Lead
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Lead Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title={`Edit Lead: ${editingLead?.company_name}`}>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Company Name</label>
              <input
                type="text"
                required
                value={editFormData.company_name}
                onChange={(e) => setEditFormData({ ...editFormData, company_name: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contact Person</label>
              <input
                type="text"
                required
                value={editFormData.contact_name}
                onChange={(e) => setEditFormData({ ...editFormData, contact_name: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Corporate Email</label>
              <input
                type="email"
                required
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Value (₹)</label>
              <input
                type="number"
                value={editFormData.estimated_value}
                onChange={(e) => setEditFormData({ ...editFormData, estimated_value: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Stage Status</label>
              <select
                value={editFormData.status}
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold"
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
                <option value="won">Won (Converted)</option>
                <option value="lost">Lost</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Commercial Notes</label>
              <textarea
                value={editFormData.notes}
                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
