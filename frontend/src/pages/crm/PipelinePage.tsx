import React, { useState, useEffect } from 'react';
import {
  Briefcase, DollarSign, Calendar, ArrowRight, CheckCircle2,
  ChevronRight, Building2, Plus, Eye, Edit3, Trash2,
  History, Clock, AlertCircle, XCircle, UserCheck, ShieldAlert
} from 'lucide-react';
import { api } from '../../api/client';
import { useRealtime } from '../../context/RealtimeContext';
import { Modal } from '../../components/common/Modal';
import type { Opportunity } from '../../types';

export const PipelinePage: React.FC = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const { emitEvent } = useRealtime();

  // Stage change with mandatory remark modal
  const [stageModalDeal, setStageModalDeal] = useState<any | null>(null);
  const [targetStage, setTargetStage] = useState('proposal');
  const [stageRemark, setStageRemark] = useState('');
  const [lossReason, setLossReason] = useState('');
  const [submittingStage, setSubmittingStage] = useState(false);

  // View Deal & Remark History Modal
  const [viewDealModal, setViewDealModal] = useState<any | null>(null);

  // Create Deal Modal
  const [addDealModalOpen, setAddDealModalOpen] = useState(false);
  const [newDealData, setNewDealData] = useState({
    title: '',
    customer: '',
    estimated_value: 450000,
    probability: 50,
    expected_close_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    stage: 'discovery',
  });
  const [submittingNewDeal, setSubmittingNewDeal] = useState(false);

  const stages = [
    { key: 'discovery', label: '1. Discovery & Need', color: 'border-blue-400', headerBg: 'bg-blue-50 text-blue-800' },
    { key: 'proposal', label: '2. Proposal / Quote', color: 'border-amber-400', headerBg: 'bg-amber-50 text-amber-800' },
    { key: 'negotiation', label: '3. Negotiation', color: 'border-purple-400', headerBg: 'bg-purple-50 text-purple-800' },
    { key: 'won', label: '4. Closed Won', color: 'border-emerald-500', headerBg: 'bg-emerald-50 text-emerald-800' },
    { key: 'lost', label: '5. Closed Lost', color: 'border-rose-400', headerBg: 'bg-rose-50 text-rose-800' },
  ];

  useEffect(() => {
    fetchOpportunities();
    fetchCustomers();
  }, []);

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const data = await api.getOpportunities();
      const list = data.results || data || [];
      setOpportunities(list);
      if (viewDealModal) {
        const refreshed = list.find((item: any) => item.id === viewDealModal.id);
        if (refreshed) setViewDealModal(refreshed);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const data = await api.getCustomers();
      setCustomers(data.results || data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  const handleOpenStageModal = (deal: any, suggestedNextStage?: string) => {
    setStageModalDeal(deal);
    setTargetStage(suggestedNextStage || deal.stage);
    setStageRemark('');
    setLossReason('');
  };

  const handleStageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stageModalDeal || !stageRemark.trim()) {
      alert('A stage transition remark is required for audit and sales review.');
      return;
    }
    setSubmittingStage(true);
    try {
      await api.updateDealStageWithRemark(stageModalDeal.id, targetStage, stageRemark.trim(), lossReason);
      showToast(`Deal moved to ${targetStage.toUpperCase()} with remark!`);
      emitEvent('deal_stage_changed', 'Deal Stage Advanced', `${stageModalDeal.title} advanced to ${targetStage}`, 'success');
      setStageModalDeal(null);
      fetchOpportunities();
    } catch (err: any) {
      alert(err.message || 'Stage update failed');
    } finally {
      setSubmittingStage(false);
    }
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDealData.customer) {
      alert('Please select a Customer for this deal.');
      return;
    }
    setSubmittingNewDeal(true);
    try {
      await api.createOpportunity(newDealData);
      showToast('New deal added to pipeline!');
      emitEvent('opportunity_created', 'Deal Added to Pipeline', `${newDealData.title} added to ${newDealData.stage}`, 'info');
      setAddDealModalOpen(false);
      fetchOpportunities();
    } catch (err: any) {
      alert(err.message || 'Failed to create opportunity');
    } finally {
      setSubmittingNewDeal(false);
    }
  };

  const totalPipelineValue = opportunities
    .filter((o) => !['won', 'lost'].includes(o.stage))
    .reduce((sum, d) => sum + Number(d.estimated_value || 0), 0);

  const totalWonValue = opportunities
    .filter((o) => o.stage === 'won')
    .reduce((sum, d) => sum + Number(d.estimated_value || 0), 0);

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
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-md">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Sales Pipeline & Deal Kanban
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Visual pipeline stages, mandatory transition remarks, deal dossiers, and win/loss audits.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="hidden lg:flex items-center space-x-4 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Active Pipeline</span>
              <span className="font-extrabold text-blue-700 font-mono text-sm">
                ₹{totalPipelineValue.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-slate-400 block font-medium">Closed Won</span>
              <span className="font-extrabold text-emerald-700 font-mono text-sm">
                ₹{totalWonValue.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <button
            onClick={() => setAddDealModalOpen(true)}
            className="inline-flex items-center px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>New Opportunity</span>
          </button>
        </div>
      </div>

      {/* Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {stages.map((st) => {
          const stageDeals = opportunities.filter((o) => o.stage === st.key);
          const totalValue = stageDeals.reduce((sum, d) => sum + Number(d.estimated_value || 0), 0);

          return (
            <div
              key={st.key}
              className="flex flex-col bg-slate-50/90 rounded-2xl p-3 border border-slate-200/90 min-h-[580px] shadow-2xs"
            >
              {/* Column Header */}
              <div className={`p-2.5 rounded-xl border ${st.color} ${st.headerBg} flex items-center justify-between shadow-2xs`}>
                <div>
                  <h3 className="text-xs font-black tracking-tight">{st.label}</h3>
                  <span className="text-[11px] font-mono font-extrabold block mt-0.5">
                    ₹{totalValue.toLocaleString('en-IN')}
                  </span>
                </div>
                <span className="w-6 h-6 rounded-full bg-white text-slate-800 font-extrabold text-[11px] flex items-center justify-center shadow-xs border border-slate-100">
                  {stageDeals.length}
                </span>
              </div>

              {/* Deal Cards Container */}
              <div className="flex-1 space-y-3 mt-3 overflow-y-auto">
                {stageDeals.length === 0 ? (
                  <div className="h-32 flex items-center justify-center text-[11px] text-slate-400 border border-dashed border-slate-200 rounded-xl bg-white/40">
                    No deals in {st.label.split('.')[1]}
                  </div>
                ) : (
                  stageDeals.map((deal) => {
                    const nextStageMap: Record<string, string> = {
                      discovery: 'proposal',
                      proposal: 'negotiation',
                      negotiation: 'won',
                    };
                    const nextStage = nextStageMap[deal.stage];

                    return (
                      <div
                        key={deal.id}
                        className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition-all space-y-2.5 group"
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate max-w-[150px]">
                            {deal.customer_name}
                          </span>
                          <button
                            onClick={() => setViewDealModal(deal)}
                            className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                            title="View Deal Details & Remarks History"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 leading-snug">{deal.title}</h4>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs font-black text-slate-900 font-mono">
                            ₹{Number(deal.estimated_value).toLocaleString('en-IN')}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              deal.stage === 'won'
                                ? 'bg-emerald-50 text-emerald-700'
                                : deal.stage === 'lost'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {deal.probability}% Prob
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-100 font-mono">
                          <span>Close: {deal.expected_close_date}</span>
                          {deal.remarks && deal.remarks.length > 0 && (
                            <span className="text-blue-600 font-bold" title="Recorded Remarks">
                              💬 {deal.remarks.length}
                            </span>
                          )}
                        </div>

                        {/* Stage Controls */}
                        <div className="pt-2 flex items-center justify-between gap-1 border-t border-slate-100">
                          <button
                            onClick={() => handleOpenStageModal(deal)}
                            className="px-2 py-1 text-[10px] font-bold text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                          >
                            Move / Note
                          </button>

                          {nextStage && (
                            <button
                              onClick={() => handleOpenStageModal(deal, nextStage)}
                              className="px-2.5 py-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors cursor-pointer flex items-center space-x-0.5"
                            >
                              <span>Advance</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: STAGE CHANGE & MANDATORY REMARK */}
      {stageModalDeal && (
        <Modal
          isOpen={!!stageModalDeal}
          onClose={() => setStageModalDeal(null)}
          title={`Move Stage: ${stageModalDeal.title}`}
          size="md"
        >
          <form onSubmit={handleStageSubmit} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500 font-medium block">Account:</span>
              <strong className="text-slate-900 text-sm">{stageModalDeal.customer_name}</strong>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-slate-500">Value:</span>
                <span className="font-mono font-bold text-emerald-700">
                  ₹{Number(stageModalDeal.estimated_value).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Target Stage *</label>
              <select
                value={targetStage}
                onChange={(e) => setTargetStage(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
              >
                <option value="discovery">1. Discovery & Need Analysis (25% Prob)</option>
                <option value="proposal">2. Proposal / Quotation (50% Prob)</option>
                <option value="negotiation">3. Negotiation / Review (75% Prob)</option>
                <option value="won">4. Closed Won (100% Won)</option>
                <option value="lost">5. Closed Lost (0% Lost)</option>
              </select>
            </div>

            {targetStage === 'lost' && (
              <div>
                <label className="text-xs font-bold text-rose-700 block mb-1">Loss Reason *</label>
                <input
                  type="text"
                  required
                  value={lossReason}
                  onChange={(e) => setLossReason(e.target.value)}
                  placeholder="e.g. Budget constraints, opted for competitor, project shelved"
                  className="w-full px-3 py-2 border border-rose-300 rounded-xl text-xs font-medium"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Stage Transition Remark / Discussion Note *
              </label>
              <textarea
                rows={3}
                required
                value={stageRemark}
                onChange={(e) => setStageRemark(e.target.value)}
                placeholder="Enter client feedback, negotiation outcome, or discount approval details..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                * Mandatory remark recorded in the deal audit timeline.
              </span>
            </div>

            <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStageModalDeal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingStage || !stageRemark.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white shadow-sm cursor-pointer"
              >
                {submittingStage ? 'Advancing...' : 'Save Stage & Remark'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: VIEW DEAL & REMARK HISTORY */}
      {viewDealModal && (
        <Modal
          isOpen={!!viewDealModal}
          onClose={() => setViewDealModal(null)}
          title={`Deal Dossier: ${viewDealModal.title}`}
          size="lg"
        >
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Customer Account</span>
                <strong className="text-slate-900 block mt-0.5">{viewDealModal.customer_name}</strong>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Deal Value</span>
                <strong className="text-emerald-700 font-mono block mt-0.5">
                  ₹{Number(viewDealModal.estimated_value).toLocaleString('en-IN')}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Probability</span>
                <strong className="text-blue-700 font-mono block mt-0.5">{viewDealModal.probability}%</strong>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Expected Close</span>
                <strong className="text-slate-900 font-mono block mt-0.5">{viewDealModal.expected_close_date}</strong>
              </div>
            </div>

            {/* Remark History Timeline */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
                <History className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Deal Progression & Remark Timeline ({(viewDealModal.remarks || []).length})
                </h3>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {(viewDealModal.remarks || []).length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    No transition remarks recorded yet. Move deal to log the first remark!
                  </div>
                ) : (
                  (viewDealModal.remarks || []).map((r: any, idx: number) => (
                    <div key={r.id || idx} className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900">{r.created_by_name || 'Sales Operator'}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold border border-slate-200">
                            {r.old_stage} ➔ {r.new_stage}
                          </span>
                        </div>
                        <span className="text-slate-400 font-mono text-[11px]">
                          {new Date(r.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-sans leading-relaxed">{r.remark}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setViewDealModal(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: ADD NEW OPPORTUNITY */}
      {addDealModalOpen && (
        <Modal
          isOpen={addDealModalOpen}
          onClose={() => setAddDealModalOpen(false)}
          title="Create New Sales Opportunity"
          size="md"
        >
          <form onSubmit={handleCreateDeal} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Deal Title *</label>
              <input
                type="text"
                required
                value={newDealData.title}
                onChange={(e) => setNewDealData({ ...newDealData, title: e.target.value })}
                placeholder="e.g. ERP Cloud Implementation 2026"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Commercial Customer *</label>
              <select
                required
                value={newDealData.customer}
                onChange={(e) => setNewDealData({ ...newDealData, customer: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
              >
                <option value="">-- Select Customer Account --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name} ({c.customer_code})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Estimated Value (₹) *</label>
                <input
                  type="number"
                  required
                  value={newDealData.estimated_value}
                  onChange={(e) => setNewDealData({ ...newDealData, estimated_value: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Probability (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={newDealData.probability}
                  onChange={(e) => setNewDealData({ ...newDealData, probability: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Expected Close Date *</label>
                <input
                  type="date"
                  required
                  value={newDealData.expected_close_date}
                  onChange={(e) => setNewDealData({ ...newDealData, expected_close_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Initial Stage</label>
                <select
                  value={newDealData.stage}
                  onChange={(e) => setNewDealData({ ...newDealData, stage: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                >
                  <option value="discovery">1. Discovery</option>
                  <option value="proposal">2. Proposal</option>
                  <option value="negotiation">3. Negotiation</option>
                  <option value="won">4. Closed Won</option>
                  <option value="lost">5. Closed Lost</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAddDealModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingNewDeal}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm cursor-pointer"
              >
                {submittingNewDeal ? 'Creating...' : 'Create Opportunity'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
