import React, { useState, useEffect } from 'react';
import {
  HelpCircle, Plus, Search, Filter, AlertCircle, CheckCircle2,
  Clock, ShieldAlert, Check, X, Building2, User, RefreshCw
} from 'lucide-react';
import { api } from '../../api/client';
import { useRealtime } from '../../context/RealtimeContext';
import { Modal } from '../../components/common/Modal';

export const CustomerComplaintsPage: React.FC = () => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const { emitEvent } = useRealtime();

  // Resolve Ticket Modal
  const [resolveModalTicket, setResolveModalTicket] = useState<any | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submittingResolve, setSubmittingResolve] = useState(false);

  // Create Ticket Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    customer: '',
    subject: '',
    category: 'service',
    priority: 'medium',
    description: '',
  });
  const [submittingCreate, setSubmittingCreate] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [compData, custData] = await Promise.all([
        api.getComplaints(),
        api.getCustomers(),
      ]);
      setComplaints(compData.results || compData || []);
      setCustomers(custData.results || custData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveModalTicket || !resolutionNotes.trim()) return;
    setSubmittingResolve(true);
    try {
      await api.resolveComplaint(resolveModalTicket.id, resolutionNotes.trim());
      showToast(`Ticket ${resolveModalTicket.ticket_number} marked as Resolved!`);
      emitEvent('complaint_resolved', 'Ticket Resolved', `Resolved grievance ${resolveModalTicket.ticket_number}`, 'success');
      setResolveModalTicket(null);
      setResolutionNotes('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve ticket');
    } finally {
      setSubmittingResolve(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketForm.customer) {
      alert('Please select a Customer.');
      return;
    }
    setSubmittingCreate(true);
    try {
      await api.createComplaint(ticketForm);
      showToast('Support grievance ticket logged!');
      emitEvent('complaint_logged', 'Support Ticket Raised', `Ticket raised for ${ticketForm.subject}`, 'warning');
      setCreateModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create ticket');
    } finally {
      setSubmittingCreate(false);
    }
  };

  const openCount = complaints.filter((c) => c.status === 'open' || c.status === 'in_progress').length;
  const criticalCount = complaints.filter((c) => c.priority === 'critical' && c.status !== 'resolved').length;
  const resolvedCount = complaints.filter((c) => c.status === 'resolved' || c.status === 'closed').length;

  const filtered = complaints.filter((c) => {
    if (statusFilter && c.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchSubject = (c.subject || '').toLowerCase().includes(q);
      const matchCust = (c.customer_name || '').toLowerCase().includes(q);
      const matchTicket = (c.ticket_number || '').toLowerCase().includes(q);
      if (!matchSubject && !matchCust && !matchTicket) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Toast Alert */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-3 border border-slate-700 animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold">{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-md">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Customer Complaints & Grievance Tickets
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Log customer issues, enforce SLA deadlines, assign technical escalations, and record resolution notes.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setTicketForm({
              customer: customers[0]?.id || '',
              subject: '',
              category: 'service',
              priority: 'medium',
              description: '',
            });
            setCreateModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Raise Grievance Ticket</span>
        </button>
      </div>

      {/* SLA Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Open Tickets</span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-amber-600">{openCount}</span>
            <span className="text-xs text-slate-500 font-semibold">Active Escalations</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Critical (SLA 4h)</span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-rose-600">{criticalCount}</span>
            <span className="text-xs text-rose-700 font-bold">Requires Immediate Attention</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Resolved Grievances</span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-emerald-600">{resolvedCount}</span>
            <span className="text-xs text-emerald-700 font-bold">100% Resolved SLA</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ticket #, customer, subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white transition-colors"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold bg-white"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <span className="text-xs font-semibold text-slate-500">{filtered.length} tickets</span>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-5 py-3">Ticket ID</th>
              <th className="px-5 py-3">Customer Account</th>
              <th className="px-5 py-3">Subject & Category</th>
              <th className="px-5 py-3">Priority / SLA</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Assigned Rep</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filtered.map((t) => {
              const isResolved = t.status === 'resolved' || t.status === 'closed';

              return (
                <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                    {t.ticket_number}
                  </td>
                  <td className="px-5 py-3.5 font-bold text-slate-800">
                    {t.customer_name}
                  </td>
                  <td className="px-5 py-3.5 max-w-sm">
                    <strong className="text-slate-900 block leading-tight">{t.subject}</strong>
                    <span className="text-[11px] text-slate-400 capitalize block mt-0.5">
                      Category: {t.category}
                    </span>
                    {t.resolution_notes && (
                      <p className="text-[11px] text-emerald-700 bg-emerald-50 p-1.5 rounded mt-1">
                        <strong>Resolution:</strong> {t.resolution_notes}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      t.priority === 'critical'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : t.priority === 'high'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      isResolved
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-slate-700">
                    {t.assigned_name || 'Support Staff'}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {!isResolved && (
                      <button
                        onClick={() => {
                          setResolveModalTicket(t);
                          setResolutionNotes('');
                        }}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors cursor-pointer shadow-2xs"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        <span>Resolve</span>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL: RESOLVE TICKET */}
      {resolveModalTicket && (
        <Modal
          isOpen={!!resolveModalTicket}
          onClose={() => setResolveModalTicket(null)}
          title={`Resolve Grievance: ${resolveModalTicket.ticket_number}`}
          size="md"
        >
          <form onSubmit={handleResolveSubmit} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-400 block font-medium">Issue:</span>
              <strong className="text-slate-900 text-sm">{resolveModalTicket.subject}</strong>
              <p className="text-slate-600 mt-1">{resolveModalTicket.description}</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Resolution Notes & Corrective Action Taken *
              </label>
              <textarea
                rows={3}
                required
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Explain the root cause fix, customer confirmation, or invoice correction made..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setResolveModalTicket(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingResolve || !resolutionNotes.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer"
              >
                {submittingResolve ? 'Resolving...' : 'Confirm Ticket Resolution'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: CREATE COMPLAINT */}
      {createModalOpen && (
        <Modal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Raise Customer Support Ticket"
          size="md"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Customer Account *</label>
              <select
                required
                value={ticketForm.customer}
                onChange={(e) => setTicketForm({ ...ticketForm, customer: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
              >
                <option value="">-- Select Customer Account --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name} ({c.customer_code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Issue Subject *</label>
              <input
                type="text"
                required
                value={ticketForm.subject}
                onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                placeholder="e.g. Delayed Tax Invoice Dispatch / GST Mismatch"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                <select
                  value={ticketForm.category}
                  onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                >
                  <option value="billing">Billing & Invoicing Issue</option>
                  <option value="service">Service & SLA Delay</option>
                  <option value="product">Product Defect / Feature</option>
                  <option value="delivery">Delivery / Dispatch Delay</option>
                  <option value="technical">Technical Support / Cloud</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Priority / SLA</label>
                <select
                  value={ticketForm.priority}
                  onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                >
                  <option value="low">Low (48h)</option>
                  <option value="medium">Medium (24h)</option>
                  <option value="high">High (8h)</option>
                  <option value="critical">Critical (4h Emergency)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Issue Details & Description *</label>
              <textarea
                rows={3}
                required
                value={ticketForm.description}
                onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingCreate}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-sm cursor-pointer"
              >
                {submittingCreate ? 'Logging...' : 'Raise Ticket'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
