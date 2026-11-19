import React, { useState, useEffect } from 'react';
import {
  UserCheck, Users, Target, CheckCircle2, ArrowRight,
  Search, Filter, Shield, AlertCircle, RefreshCw, Award,
  Shuffle, Building2, User, Eye, Lock, ShieldCheck,
  ChevronRight, Network, Sparkles, Sliders
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import { Modal } from '../../components/common/Modal';

export const LeadAssignmentPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { emitEvent } = useRealtime();
  const [leads, setLeads] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [hierarchyData, setHierarchyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [submittingBulk, setSubmittingBulk] = useState(false);
  const [submittingAuto, setSubmittingAuto] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'assignment' | 'hierarchy'>('assignment');
  const [filterUnassignedOnly, setFilterUnassignedOnly] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leadData, userData, hierData] = await Promise.all([
        api.getLeads().catch(() => ({ results: [] })),
        api.getUsers().catch(() => ({ results: [] })),
        api.getCompanyHierarchy().catch(() => null),
      ]);
      setLeads(leadData.results || leadData || []);
      setUsers(userData.results || userData || []);
      setHierarchyData(hierData);
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

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedLeadIds(displayLeads.map((l) => l.id));
    } else {
      setSelectedLeadIds([]);
    }
  };

  const handleToggleLead = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // 1. MANUAL BULK ASSIGNMENT
  const handleBulkAssign = async () => {
    if (!targetUserId) {
      alert('Please select a Sales Representative to assign the selected leads.');
      return;
    }
    if (selectedLeadIds.length === 0) {
      alert('Please select at least one lead from the table.');
      return;
    }

    setSubmittingBulk(true);
    try {
      const res = await api.bulkAssignLeads(selectedLeadIds, targetUserId);
      showToast(res.message);
      emitEvent('leads_assigned', 'Leads Assigned', `Assigned ${selectedLeadIds.length} leads in batch`, 'success');
      setSelectedLeadIds([]);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Bulk assignment failed');
    } finally {
      setSubmittingBulk(false);
    }
  };

  // 2. AUTO EQUAL DISTRIBUTION (ROUND-ROBIN BALANCER)
  const handleAutoDistribute = async () => {
    setSubmittingAuto(true);
    try {
      const res = await api.autoDistributeLeads(selectedLeadIds.length > 0 ? selectedLeadIds : undefined);
      showToast(res.message || 'Leads distributed equally!');
      emitEvent('leads_auto_distributed', 'Auto Equal Distribution', res.summary || 'Leads distributed equally across team', 'success');
      setSelectedLeadIds([]);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Auto distribution failed');
    } finally {
      setSubmittingAuto(false);
    }
  };

  const isSuperAdmin = currentUser?.is_superuser || currentUser?.role_code === 'super_admin';
  const roleName = currentUser?.role_name || (isSuperAdmin ? 'Super Admin' : 'Staff');

  // Assignable reps list from hierarchy
  const assignableReps = hierarchyData?.assignable_reps || [];

  const displayLeads = filterUnassignedOnly
    ? leads.filter((l) => !l.assigned_to)
    : leads;

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
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Lead Assignment & Capacity Balancer
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Hierarchical role-based delegation, equal round-robin lead distribution, and company team controls.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchData}
            className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold text-xs hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Privacy & Scope Notification Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase font-extrabold tracking-wider text-blue-200">
                Active Access Scope:
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-blue-500/30 text-white border border-blue-400/40">
                {roleName}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              {isSuperAdmin
                ? 'Super Admin Mode: Full company-wide visibility across all branches, HR supervisee units, managers, and sales reps.'
                : roleName.toLowerCase().includes('hr')
                ? 'HR Scope: Supervised managers and employees within your designated HR unit. Other HRs cannot see your supervisees.'
                : roleName.toLowerCase().includes('manager')
                ? 'Manager Scope: Subordinate sales executives directly reporting to you. Other managers cannot view your team.'
                : 'Employee Scope: You only see leads and opportunities directly assigned to you.'}
            </p>
          </div>
        </div>

        {/* Quick Tabs */}
        <div className="flex items-center bg-white/10 p-1 rounded-xl border border-white/10 shrink-0">
          <button
            onClick={() => setActiveTab('assignment')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'assignment' ? 'bg-white text-slate-900 shadow-sm' : 'text-white/80 hover:text-white'
            }`}
          >
            Lead Distribution Queue
          </button>
          <button
            onClick={() => setActiveTab('hierarchy')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'hierarchy' ? 'bg-white text-slate-900 shadow-sm' : 'text-white/80 hover:text-white'
            }`}
          >
            Master Company Hierarchy
          </button>
        </div>
      </div>

      {activeTab === 'assignment' ? (
        <>
          {/* Workload Capacity Cards in Scope */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {assignableReps.map((rep: any) => (
              <div
                key={rep.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-sm transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-tight">{rep.name}</h3>
                    <span className="text-[11px] text-slate-400 font-medium">{rep.role}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {rep.active_leads} Active
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Pipeline Value:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      ₹{rep.total_pipeline_val.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Deals Won:</span>
                    <span className="font-bold text-slate-800">{rep.won_deals}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Toolbar: Auto-Distribute Equal + Manual Bulk Reassign */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleAutoDistribute}
                disabled={submittingAuto || assignableReps.length === 0}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer flex items-center space-x-2"
                title="Automatically distributes leads in round-robin fashion equally across all active sales reps"
              >
                <Shuffle className={`w-4 h-4 ${submittingAuto ? 'animate-spin' : ''}`} />
                <span>
                  {submittingAuto
                    ? 'Distributing...'
                    : selectedLeadIds.length > 0
                    ? `Auto-Distribute ${selectedLeadIds.length} Selected Leads Equally`
                    : 'Auto-Distribute Unassigned Leads (Round-Robin)'}
                </span>
              </button>

              <button
                onClick={() => setFilterUnassignedOnly(!filterUnassignedOnly)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  filterUnassignedOnly
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {filterUnassignedOnly ? 'Show All Leads' : 'Filter Unassigned Only'}
              </button>
            </div>

            {/* Manual Bulk Reassign to Chosen Rep */}
            <div className="flex items-center space-x-2">
              <select
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-slate-50"
              >
                <option value="">-- Assign Selected Leads to Rep --</option>
                {assignableReps.map((r: any) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.role})
                  </option>
                ))}
              </select>

              <button
                onClick={handleBulkAssign}
                disabled={submittingBulk || selectedLeadIds.length === 0 || !targetUserId}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer flex items-center space-x-1.5 shrink-0"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{submittingBulk ? 'Assigning...' : `Assign (${selectedLeadIds.length})`}</span>
              </button>
            </div>
          </div>

          {/* Leads Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="selectAll"
                  checked={selectedLeadIds.length === displayLeads.length && displayLeads.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="selectAll" className="font-bold text-slate-800">
                  Select All ({selectedLeadIds.length} of {displayLeads.length} leads selected)
                </label>
              </div>
              <span className="text-slate-500 font-mono text-[11px]">{displayLeads.length} Total in Scope</span>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-white border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3 w-10">Select</th>
                  <th className="px-5 py-3">Lead Code</th>
                  <th className="px-5 py-3">Enterprise Client</th>
                  <th className="px-5 py-3">Inbound Source</th>
                  <th className="px-5 py-3">Deal Value</th>
                  <th className="px-5 py-3">Assigned Sales Owner</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {displayLeads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                      No leads match the active filter or scope.
                    </td>
                  </tr>
                ) : (
                  displayLeads.map((lead) => {
                    const isSelected = selectedLeadIds.includes(lead.id);

                    return (
                      <tr key={lead.id} className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}>
                        <td className="px-5 py-3.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleLead(lead.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-5 py-3.5 font-mono font-bold text-slate-800">
                          {lead.lead_id}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-slate-900 block">{lead.company_name}</span>
                          <span className="text-[11px] text-slate-500">{lead.contact_name}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="capitalize text-slate-600 text-[11px] font-semibold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {lead.source?.replace(/_/g, ' ') || 'Website'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-mono font-extrabold text-slate-900">
                          ₹{Number(lead.estimated_value).toLocaleString('en-IN')}
                        </td>
                        <td className="px-5 py-3.5">
                          {lead.assigned_name ? (
                            <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                              {lead.assigned_name}
                            </span>
                          ) : (
                            <span className="font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                              Unassigned (Queue)
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 uppercase font-bold text-[10px] text-slate-700">
                          {lead.status}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* HIERARCHY TAB: SUPER ADMIN MASTER COMPANY CONTROL */
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-2xs">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center">
                <Building2 className="w-5 h-5 text-blue-600 mr-2" />
                <span>Multi-Tier Company Hierarchy & Privacy Architecture</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Visual organization structure: HR supervisee groups, reporting manager branches, and sales executive privacy isolation.
              </p>
            </div>

            {/* HR Units Grid */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                1. HR Supervisee Units (Isolated Scopes)
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(hierarchyData?.hr_units || []).map((hr: any) => (
                  <div key={hr.hr_id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{hr.hr_name}</h4>
                        <span className="text-xs text-slate-400 font-mono">{hr.email}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {hr.supervisee_count} Supervisees
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-[11px] font-bold text-slate-500 block mb-1">Assigned Team Members:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {hr.supervisee_names && hr.supervisee_names.length > 0 ? (
                          hr.supervisee_names.map((name: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[11px] text-slate-700 font-semibold">
                              {name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No subordinates linked yet</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reporting Managers Grid */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                2. Reporting Team Managers (Subordinate Sales Reps)
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(hierarchyData?.manager_units || []).map((mgr: any) => (
                  <div key={mgr.manager_id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{mgr.manager_name}</h4>
                        <span className="text-xs text-slate-400 font-mono">{mgr.email}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {mgr.subordinate_count} Reps
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-[11px] font-bold text-slate-500 block mb-1">Direct Subordinates:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {mgr.subordinate_names && mgr.subordinate_names.length > 0 ? (
                          mgr.subordinate_names.map((name: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[11px] text-slate-700 font-semibold">
                              {name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No sales reps reporting directly</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
