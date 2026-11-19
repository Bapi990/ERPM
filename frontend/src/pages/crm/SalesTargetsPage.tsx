import React, { useState, useEffect } from 'react';
import {
  Award, Plus, TrendingUp, CheckCircle2, Calendar, DollarSign,
  User, Search, Filter, Edit3, Target, ShieldCheck, RefreshCw
} from 'lucide-react';
import { api } from '../../api/client';
import { useRealtime } from '../../context/RealtimeContext';
import { Modal } from '../../components/common/Modal';

export const SalesTargetsPage: React.FC = () => {
  const [targets, setTargets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const { emitEvent } = useRealtime();

  // Create / Edit Target Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    user: '',
    period_type: 'monthly',
    period_label: 'November 2026',
    target_revenue: 500000,
    achieved_revenue: 0,
    target_deals: 5,
    achieved_deals: 0,
    target_leads: 25,
    achieved_leads: 0,
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [targetData, userData] = await Promise.all([
        api.getSalesTargets(),
        api.getUsers(),
      ]);
      setTargets(targetData.results || targetData || []);
      setUsers(userData.results || userData || []);
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

  const handleOpenCreate = () => {
    setEditingTarget(null);
    setFormData({
      user: users[0]?.id || '',
      period_type: 'monthly',
      period_label: 'November 2026',
      target_revenue: 750000,
      achieved_revenue: 0,
      target_deals: 6,
      achieved_deals: 0,
      target_leads: 30,
      achieved_leads: 0,
      start_date: '2026-11-01',
      end_date: '2026-11-30',
      notes: 'Monthly enterprise cloud billing target.',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (t: any) => {
    setEditingTarget(t);
    setFormData({
      user: t.user || '',
      period_type: t.period_type || 'monthly',
      period_label: t.period_label || '',
      target_revenue: Number(t.target_revenue) || 0,
      achieved_revenue: Number(t.achieved_revenue) || 0,
      target_deals: t.target_deals || 0,
      achieved_deals: t.achieved_deals || 0,
      target_leads: t.target_leads || 0,
      achieved_leads: t.achieved_leads || 0,
      start_date: t.start_date || '',
      end_date: t.end_date || '',
      notes: t.notes || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingTarget) {
        await api.updateSalesTarget(editingTarget.id, formData);
        showToast('Sales quota target updated.');
      } else {
        await api.createSalesTarget(formData);
        showToast('New sales target created!');
        emitEvent('sales_target_set', 'Target Assigned', `Assigned ₹${formData.target_revenue} quota`, 'info');
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const totalTargetRevenue = targets.reduce((sum, t) => sum + Number(t.target_revenue || 0), 0);
  const totalAchievedRevenue = targets.reduce((sum, t) => sum + Number(t.achieved_revenue || 0), 0);
  const overallAttainment = totalTargetRevenue > 0 ? roundNumber((totalAchievedRevenue / totalTargetRevenue) * 100) : 0;

  function roundNumber(n: number) {
    return Math.round(n * 10) / 10;
  }

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
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Sales Quota & Target Management
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Set monthly/quarterly revenue quotas, track individual attainment %, and reward high performers.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Set Sales Target</span>
        </button>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Team Quota</span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900 font-mono">
              ₹{totalTargetRevenue.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-slate-500 font-semibold">Allocated</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Achieved Revenue</span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-emerald-600 font-mono">
              ₹{totalAchievedRevenue.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-emerald-700 font-bold font-mono">({overallAttainment}% Achieved)</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Quota Performance</span>
          <div className="mt-3">
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-600 to-emerald-500 h-3 rounded-full transition-all"
                style={{ width: `${Math.min(100, overallAttainment)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 font-bold mt-1.5">
              <span>0%</span>
              <span>{overallAttainment}% Overall</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Target Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {targets.map((t) => {
          const attainment = t.achievement_percentage || 0;

          return (
            <div
              key={t.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs hover:shadow-md transition-all space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{t.user_name || 'Sales Representative'}</h3>
                  <span className="text-xs text-slate-500 font-mono">{t.period_label}</span>
                </div>
                <button
                  onClick={() => handleOpenEdit(t)}
                  className="p-1.5 rounded-lg text-amber-600 hover:text-amber-800 hover:bg-amber-50 border border-amber-200 transition-colors cursor-pointer"
                  title="Update Progress"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-700">Revenue Attainment:</span>
                  <span className="font-black text-blue-700 font-mono">{attainment}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all ${
                      attainment >= 100 ? 'bg-emerald-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${Math.min(100, attainment)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Revenue</span>
                  <strong className="text-slate-900 block font-mono mt-0.5">
                    ₹{Number(t.achieved_revenue).toLocaleString('en-IN')}
                  </strong>
                  <span className="text-[10px] text-slate-400 font-mono">
                    of ₹{Number(t.target_revenue).toLocaleString('en-IN')}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block font-medium">Deals Closed</span>
                  <strong className="text-slate-900 block font-mono mt-0.5">
                    {t.achieved_deals} of {t.target_deals}
                  </strong>
                  <span className="text-[10px] text-emerald-600 font-bold">Won Deals</span>
                </div>

                <div>
                  <span className="text-slate-400 block font-medium">Leads Worked</span>
                  <strong className="text-slate-900 block font-mono mt-0.5">
                    {t.achieved_leads} of {t.target_leads}
                  </strong>
                  <span className="text-[10px] text-blue-600 font-bold">Inbound</span>
                </div>
              </div>

              {t.notes && (
                <p className="text-xs text-slate-500 italic bg-white p-2 rounded-lg border border-slate-100">
                  "{t.notes}"
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL: CREATE / EDIT TARGET */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingTarget ? `Update Target: ${editingTarget.user_name}` : 'Set Sales Target Quota'}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Sales Representative *</label>
              <select
                required
                value={formData.user}
                onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
              >
                <option value="">-- Choose Sales Rep --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.first_name ? `${u.first_name} ${u.last_name || ''}` : u.username} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Period Label *</label>
                <input
                  type="text"
                  required
                  value={formData.period_label}
                  onChange={(e) => setFormData({ ...formData, period_label: e.target.value })}
                  placeholder="e.g. November 2026 or Q3 FY26"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Period Type</label>
                <select
                  value={formData.period_type}
                  onChange={(e) => setFormData({ ...formData, period_type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Target Revenue (₹) *</label>
                <input
                  type="number"
                  required
                  value={formData.target_revenue}
                  onChange={(e) => setFormData({ ...formData, target_revenue: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Achieved Revenue (₹)</label>
                <input
                  type="number"
                  value={formData.achieved_revenue}
                  onChange={(e) => setFormData({ ...formData, achieved_revenue: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Target Deals Count</label>
                <input
                  type="number"
                  value={formData.target_deals}
                  onChange={(e) => setFormData({ ...formData, target_deals: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Achieved Deals</label>
                <input
                  type="number"
                  value={formData.achieved_deals}
                  onChange={(e) => setFormData({ ...formData, achieved_deals: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Start Date *</label>
                <input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">End Date *</label>
                <input
                  type="date"
                  required
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Quota Strategy Notes</label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm cursor-pointer"
              >
                {submitting ? 'Saving...' : 'Save Sales Quota'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
