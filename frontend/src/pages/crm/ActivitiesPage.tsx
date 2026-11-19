import React, { useState, useEffect } from 'react';
import {
  Activity, PhoneCall, Video, Mail, MessageSquare, Plus,
  Search, Filter, CheckCircle2, Clock, Calendar, Building2,
  User, Check, AlertCircle, RefreshCw
} from 'lucide-react';
import { api } from '../../api/client';
import { useRealtime } from '../../context/RealtimeContext';
import { Modal } from '../../components/common/Modal';

export const ActivitiesPage: React.FC = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const { emitEvent } = useRealtime();

  // Log Activity Modal
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logForm, setLogForm] = useState({
    activity_type: 'call',
    title: '',
    duration_minutes: 15,
    due_date: new Date().toISOString().slice(0, 16),
    status: 'completed',
    outcome: '',
    description: '',
    lead: '',
    customer: '',
  });
  const [submittingLog, setSubmittingLog] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [actData, leadData, custData] = await Promise.all([
        api.getActivities(),
        api.getLeads(),
        api.getCustomers(),
      ]);
      setActivities(actData.results || actData || []);
      setLeads(leadData.results || leadData || []);
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

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingLog(true);
    try {
      const payload: any = {
        activity_type: logForm.activity_type,
        title: logForm.title,
        duration_minutes: Number(logForm.duration_minutes),
        due_date: new Date(logForm.due_date).toISOString(),
        status: logForm.status,
        outcome: logForm.outcome || 'Call logged successfully.',
        description: logForm.description,
      };
      if (logForm.lead) payload.lead = logForm.lead;
      if (logForm.customer) payload.customer = logForm.customer;

      await api.createActivity(payload);
      showToast('Activity logged successfully!');
      emitEvent('activity_logged', 'Call/Meeting Logged', `Logged ${logForm.activity_type} with client`, 'info');
      setLogModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to log activity');
    } finally {
      setSubmittingLog(false);
    }
  };

  const totalCalls = activities.filter((a) => a.activity_type === 'call').length;
  const totalMeetings = activities.filter((a) => a.activity_type === 'meeting').length;
  const totalCompleted = activities.filter((a) => a.status === 'completed').length;

  const filtered = activities.filter((a) => {
    if (typeFilter && a.activity_type !== typeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (a.title || '').toLowerCase().includes(q);
      const matchLead = (a.lead_name || '').toLowerCase().includes(q);
      const matchCust = (a.customer_name || '').toLowerCase().includes(q);
      if (!matchTitle && !matchLead && !matchCust) return false;
    }
    return true;
  });

  const activityIcons: Record<string, any> = {
    call: PhoneCall,
    meeting: Video,
    whatsapp: MessageSquare,
    email: Mail,
    task: Clock,
  };

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
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Calls & Meeting Activity History
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Audit trail of all client phone calls, Google Meet demos, WhatsApp chats, and customer touchpoints.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setLogModalOpen(true)}
            className="inline-flex items-center px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Log Call or Demo</span>
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Phone Calls</span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900">{totalCalls}</span>
            <span className="text-xs text-emerald-600 font-bold">Inbound & Outbound</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Meetings & Demos</span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-blue-600">{totalMeetings}</span>
            <span className="text-xs text-slate-500 font-semibold">Conducted</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Completed Activities</span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-emerald-600">{totalCompleted}</span>
            <span className="text-xs text-slate-500 font-semibold">Logged with Outcome</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Touchpoints</span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-indigo-600">{activities.length}</span>
            <span className="text-xs text-indigo-600 font-bold">100% Tracked</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by account, subject, rep..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white transition-colors"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold bg-white"
          >
            <option value="">All Activity Types</option>
            <option value="call">Phone Calls</option>
            <option value="meeting">Meetings & Demos</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="email">Emails</option>
          </select>
        </div>

        <span className="text-xs font-semibold text-slate-500">{filtered.length} entries found</span>
      </div>

      {/* Activities Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-5 py-3">Date & Time</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Subject / Discussion</th>
              <th className="px-5 py-3">Linked Account</th>
              <th className="px-5 py-3">Duration</th>
              <th className="px-5 py-3">Status & Outcome</th>
              <th className="px-5 py-3">Sales Owner</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                  No activity history matching your filters.
                </td>
              </tr>
            ) : (
              filtered.map((act) => {
                const Icon = activityIcons[act.activity_type] || PhoneCall;
                return (
                  <tr key={act.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-slate-600 whitespace-nowrap">
                      {new Date(act.due_date).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-800 border border-slate-200">
                        <Icon className="w-3 h-3 mr-1" />
                        {act.activity_type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 max-w-xs">
                      <strong className="text-slate-900 block leading-tight">{act.title}</strong>
                      {act.description && (
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{act.description}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-slate-800 block">
                        {act.lead_name || act.customer_name || 'General Inquiry'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-600">
                      {act.duration_minutes || 15} mins
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="space-y-0.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          act.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {act.status}
                        </span>
                        {act.outcome && (
                          <span className="text-[11px] text-slate-500 block truncate max-w-[200px]" title={act.outcome}>
                            {act.outcome}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-700">
                      {act.assigned_name || 'Sales Rep'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: LOG NEW ACTIVITY */}
      {logModalOpen && (
        <Modal
          isOpen={logModalOpen}
          onClose={() => setLogModalOpen(false)}
          title="Log Client Call or Meeting"
          size="md"
        >
          <form onSubmit={handleLogSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Activity Subject *</label>
              <input
                type="text"
                required
                value={logForm.title}
                onChange={(e) => setLogForm({ ...logForm, title: e.target.value })}
                placeholder="e.g. Discussed Enterprise ERP GST & POS integration"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Activity Type</label>
                <select
                  value={logForm.activity_type}
                  onChange={(e) => setLogForm({ ...logForm, activity_type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                >
                  <option value="call">Phone Call</option>
                  <option value="meeting">Video Meeting / Demo</option>
                  <option value="whatsapp">WhatsApp Note</option>
                  <option value="email">Email Outreach</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Duration (Minutes)</label>
                <input
                  type="number"
                  value={logForm.duration_minutes}
                  onChange={(e) => setLogForm({ ...logForm, duration_minutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={logForm.due_date}
                  onChange={(e) => setLogForm({ ...logForm, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Status</label>
                <select
                  value={logForm.status}
                  onChange={(e) => setLogForm({ ...logForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                >
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Customer / Lead</label>
              <select
                value={logForm.lead || logForm.customer}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.startsWith('lead:')) {
                    setLogForm({ ...logForm, lead: val.replace('lead:', ''), customer: '' });
                  } else if (val.startsWith('cust:')) {
                    setLogForm({ ...logForm, customer: val.replace('cust:', ''), lead: '' });
                  } else {
                    setLogForm({ ...logForm, lead: '', customer: '' });
                  }
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
              >
                <option value="">-- General Account / Lead --</option>
                <optgroup label="Sales Leads">
                  {leads.map((l) => (
                    <option key={l.id} value={`lead:${l.id}`}>
                      {l.company_name} ({l.contact_name})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Commercial Customers">
                  {customers.map((c) => (
                    <option key={c.id} value={`cust:${c.id}`}>
                      {c.company_name} ({c.customer_code})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Discussion Outcome *</label>
              <input
                type="text"
                required
                value={logForm.outcome}
                onChange={(e) => setLogForm({ ...logForm, outcome: e.target.value })}
                placeholder="e.g. Client agreed on proposal terms, awaiting formal PO"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Detailed Notes</label>
              <textarea
                rows={2}
                value={logForm.description}
                onChange={(e) => setLogForm({ ...logForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setLogModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingLog}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm cursor-pointer"
              >
                {submittingLog ? 'Saving...' : 'Save Activity'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
