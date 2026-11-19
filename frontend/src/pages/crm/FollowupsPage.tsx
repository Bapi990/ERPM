import React, { useState, useEffect } from 'react';
import {
  Clock, Phone, Calendar, CheckCircle2, AlertCircle, Plus,
  Search, Filter, ChevronRight, PhoneCall, Video, Mail,
  MessageSquare, Check, X, RefreshCw
} from 'lucide-react';
import { api } from '../../api/client';
import { useRealtime } from '../../context/RealtimeContext';
import { Modal } from '../../components/common/Modal';

export const FollowupsPage: React.FC = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'today' | 'overdue' | 'upcoming' | 'completed'>('today');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const { emitEvent } = useRealtime();

  // Complete Activity Modal
  const [completeModalItem, setCompleteModalItem] = useState<any | null>(null);
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [submittingComplete, setSubmittingComplete] = useState(false);

  // Add Follow-up Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newFollowup, setNewFollowup] = useState({
    activity_type: 'call',
    title: '',
    lead: '',
    customer: '',
    due_date: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    description: '',
  });
  const [submittingAdd, setSubmittingAdd] = useState(false);

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

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeModalItem) return;
    setSubmittingComplete(true);
    try {
      await api.completeActivity(completeModalItem.id, outcomeNotes || 'Completed as scheduled.');
      showToast(`Follow-up marked as completed!`);
      emitEvent('activity_completed', 'Follow-up Finished', `Completed ${completeModalItem.title}`, 'success');
      setCompleteModalItem(null);
      setOutcomeNotes('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to complete activity');
    } finally {
      setSubmittingComplete(false);
    }
  };

  const handleCreateFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingAdd(true);
    try {
      const payload: any = {
        activity_type: newFollowup.activity_type,
        title: newFollowup.title,
        due_date: new Date(newFollowup.due_date).toISOString(),
        description: newFollowup.description,
        status: 'pending',
      };
      if (newFollowup.lead) payload.lead = newFollowup.lead;
      if (newFollowup.customer) payload.customer = newFollowup.customer;

      await api.createActivity(payload);
      showToast('New follow-up task scheduled!');
      emitEvent('activity_created', 'Follow-up Scheduled', `Scheduled ${newFollowup.title}`, 'info');
      setAddModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create follow-up');
    } finally {
      setSubmittingAdd(false);
    }
  };

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const pendingActivities = activities.filter((a) => a.status === 'pending');
  const completedActivities = activities.filter((a) => a.status === 'completed');

  const todayActivities = pendingActivities.filter((a) => {
    const d = new Date(a.due_date);
    return d >= startOfToday && d <= endOfToday;
  });

  const overdueActivities = pendingActivities.filter((a) => {
    const d = new Date(a.due_date);
    return d < startOfToday;
  });

  const upcomingActivities = pendingActivities.filter((a) => {
    const d = new Date(a.due_date);
    return d > endOfToday;
  });

  const displayList =
    activeTab === 'today'
      ? todayActivities
      : activeTab === 'overdue'
      ? overdueActivities
      : activeTab === 'upcoming'
      ? upcomingActivities
      : completedActivities;

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
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Follow-up & Activity Queue
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Manage upcoming customer calls, demos, follow-backs, and record activity completion outcomes.
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
            <span>Schedule Follow-up</span>
          </button>
        </div>
      </div>

      {/* Metric Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => setActiveTab('today')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'today'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md'
              : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${activeTab === 'today' ? 'text-blue-100' : 'text-slate-400'}`}>
            Due Today
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black">{todayActivities.length}</span>
            <span className={`text-xs ${activeTab === 'today' ? 'text-blue-200' : 'text-slate-500'}`}>Pending</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('overdue')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'overdue'
              ? 'bg-rose-600 text-white border-rose-600 shadow-md'
              : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${activeTab === 'overdue' ? 'text-rose-100' : 'text-slate-400'}`}>
            Overdue Follow-ups
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-rose-500 group-hover:text-rose-600">{overdueActivities.length}</span>
            <span className={`text-xs ${activeTab === 'overdue' ? 'text-rose-200' : 'text-slate-500'}`}>Needs Call</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('upcoming')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'upcoming'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
              : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${activeTab === 'upcoming' ? 'text-indigo-100' : 'text-slate-400'}`}>
            Upcoming Days
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black">{upcomingActivities.length}</span>
            <span className={`text-xs ${activeTab === 'upcoming' ? 'text-indigo-200' : 'text-slate-500'}`}>Scheduled</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'completed'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
              : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${activeTab === 'completed' ? 'text-emerald-100' : 'text-slate-400'}`}>
            Completed Activities
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black">{completedActivities.length}</span>
            <span className={`text-xs ${activeTab === 'completed' ? 'text-emerald-200' : 'text-slate-500'}`}>Executed</span>
          </div>
        </button>
      </div>

      {/* Follow-up Cards List */}
      <div className="space-y-3">
        {displayList.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
            No follow-up tasks currently in this queue. Click "Schedule Follow-up" to add one!
          </div>
        ) : (
          displayList.map((act) => {
            const Icon = activityIcons[act.activity_type] || PhoneCall;
            const isCompleted = act.status === 'completed';

            return (
              <div
                key={act.id}
                className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-xl border ${
                    isCompleted
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-slate-900 text-sm">{act.title}</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold bg-slate-100 text-slate-700">
                        {act.activity_type}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                      <span>Account: <strong className="text-slate-800">{act.lead_name || act.customer_name || 'Direct Lead'}</strong></span>
                      <span>•</span>
                      <span>Assigned: <strong className="text-slate-800">{act.assigned_name || 'Sales Rep'}</strong></span>
                      <span>•</span>
                      <span className="font-mono text-slate-700 font-bold">
                        🕒 {new Date(act.due_date).toLocaleString()}
                      </span>
                    </div>

                    {act.description && (
                      <p className="mt-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 max-w-2xl">
                        {act.description}
                      </p>
                    )}

                    {act.outcome && (
                      <div className="mt-2 text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 flex items-center space-x-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span><strong>Outcome:</strong> {act.outcome}</span>
                      </div>
                    )}
                  </div>
                </div>

                {!isCompleted && (
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => {
                        setCompleteModalItem(act);
                        setOutcomeNotes('');
                      }}
                      className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 mr-1.5" />
                      <span>Mark Complete</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: MARK COMPLETE */}
      {completeModalItem && (
        <Modal
          isOpen={!!completeModalItem}
          onClose={() => setCompleteModalItem(null)}
          title={`Complete Follow-up: ${completeModalItem.title}`}
          size="md"
        >
          <form onSubmit={handleCompleteSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Call / Meeting Outcome & Discussion Notes *
              </label>
              <textarea
                rows={3}
                required
                value={outcomeNotes}
                onChange={(e) => setOutcomeNotes(e.target.value)}
                placeholder="Enter client response, agreed quotation terms, demo feedback, or next schedule date..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCompleteModalItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingComplete || !outcomeNotes.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white shadow-sm cursor-pointer"
              >
                {submittingComplete ? 'Completing...' : 'Save Outcome & Close'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: SCHEDULE NEW FOLLOW-UP */}
      {addModalOpen && (
        <Modal
          isOpen={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          title="Schedule Customer Follow-up"
          size="md"
        >
          <form onSubmit={handleCreateFollowup} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Follow-up Title *</label>
              <input
                type="text"
                required
                value={newFollowup.title}
                onChange={(e) => setNewFollowup({ ...newFollowup, title: e.target.value })}
                placeholder="e.g. Discuss GST Billing quotation with CFO"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Activity Type</label>
                <select
                  value={newFollowup.activity_type}
                  onChange={(e) => setNewFollowup({ ...newFollowup, activity_type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                >
                  <option value="call">Phone Call</option>
                  <option value="meeting">Meeting / Demo</option>
                  <option value="whatsapp">WhatsApp Note</option>
                  <option value="email">Email Outreach</option>
                  <option value="task">Internal Task</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={newFollowup.due_date}
                  onChange={(e) => setNewFollowup({ ...newFollowup, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Link to Lead</label>
              <select
                value={newFollowup.lead}
                onChange={(e) => setNewFollowup({ ...newFollowup, lead: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
              >
                <option value="">-- None / Select Sales Lead --</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.company_name} ({l.contact_name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Link to Commercial Customer</label>
              <select
                value={newFollowup.customer}
                onChange={(e) => setNewFollowup({ ...newFollowup, customer: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
              >
                <option value="">-- None / Select Customer Account --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name} ({c.customer_code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Discussion Agenda / Context</label>
              <textarea
                rows={2}
                value={newFollowup.description}
                onChange={(e) => setNewFollowup({ ...newFollowup, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
              />
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
                disabled={submittingAdd}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm cursor-pointer"
              >
                {submittingAdd ? 'Scheduling...' : 'Save Follow-up'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
