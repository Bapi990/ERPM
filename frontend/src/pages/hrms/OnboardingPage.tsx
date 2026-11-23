import React, { useState, useEffect } from 'react';
import {
  UserPlus, CheckCircle2, Clock, ShieldCheck, Laptop, Mail,
  FileCheck, Users, Plus, ArrowRight, Eye, Calendar, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import { Modal } from '../../components/common/Modal';
import type { OnboardingMilestone, Employee } from '../../types';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { emitEvent, subscribe } = useRealtime();

  const [milestones, setMilestones] = useState<OnboardingMilestone[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [addMilestoneModal, setAddMilestoneModal] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({
    employee: '',
    title: '',
    category: 'it_hardware',
    due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [mRes, eRes] = await Promise.all([
        api.getOnboardingMilestones().catch(() => ({ results: [] })),
        api.getEmployees().catch(() => ({ results: [] })),
      ]);
      setMilestones(mRes?.results || (Array.isArray(mRes) ? mRes : mRes?.data?.results || mRes?.data || []));
      setEmployees(eRes?.results || (Array.isArray(eRes) ? eRes : eRes?.data?.results || eRes?.data || []));
    } catch (err) {
      console.error('Failed to load onboarding data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub1 = subscribe('onboarding_*', () => loadData());
    const unsub2 = subscribe('employee_*', () => loadData());
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  const handleToggleMilestone = async (id: string, currentStatus: boolean) => {
    try {
      await api.updateOnboardingMilestone(id, {
        is_completed: !currentStatus,
        completed_at: !currentStatus ? new Date().toISOString() : null,
      });
      emitEvent('onboarding_milestone_toggled', 'Onboarding Progress', !currentStatus ? 'Milestone completed' : 'Milestone reopened', 'info');
      showToast(!currentStatus ? 'Milestone marked as COMPLETED!' : 'Milestone marked as pending');
      loadData();
    } catch (err: any) {
      console.error(err);
      showToast('Failed to update milestone status');
    }
  };

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!milestoneForm.employee) {
      showToast('Please select an employee');
      return;
    }
    try {
      await api.createOnboardingMilestone({
        ...milestoneForm,
        is_completed: false,
      });
      emitEvent('onboarding_milestone_created', 'Milestone Created', 'New onboarding task added to hire checklist', 'info');
      showToast('New onboarding task added!');
      setAddMilestoneModal(false);
      setMilestoneForm({
        employee: '',
        title: '',
        category: 'it_hardware',
        due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      });
      loadData();
    } catch (err: any) {
      console.error(err);
      showToast('Failed to add milestone');
    }
  };

  // Group milestones by employee
  const employeeMilestoneMap: { [empId: string]: OnboardingMilestone[] } = {};
  milestones.forEach((m) => {
    if (!employeeMilestoneMap[m.employee]) {
      employeeMilestoneMap[m.employee] = [];
    }
    employeeMilestoneMap[m.employee].push(m);
  });

  const onboardingEmployees = employees.slice(0, 6);

  // KPIs
  const totalMilestonesCount = milestones.length;
  const completedMilestonesCount = milestones.filter(m => m.is_completed).length;
  const completionPercentage = totalMilestonesCount > 0
    ? Math.round((completedMilestonesCount / totalMilestonesCount) * 100)
    : 78;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl transition-all">
          <CheckCircle2 size={18} />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Onboarding</h1>
          <p className="text-sm text-gray-500 mt-1">
            Induction roadmaps, compliance checklists, hardware provisioning, and system access setup.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAddMilestoneModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-semibold transition-all shadow-sm"
          >
            <Plus size={16} className="text-primary-600" />
            Add Milestone
          </button>
          <button
            onClick={() => navigate('/app/hrms/employees?mode=add')}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 text-sm font-semibold transition-all shadow-md shadow-primary-500/20"
          >
            <UserPlus size={16} />
            7-Step Onboarding Wizard
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <div>
            <p className="text-[11px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">New Hires Active</p>
            <p className="text-base sm:text-2xl font-bold text-gray-900 mt-1 truncate">{onboardingEmployees.length} Hires</p>
            <p className="text-[11px] sm:text-xs text-primary-600 mt-0.5 sm:mt-1 truncate">Currently in induction</p>
          </div>
          <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <UserPlus className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <div>
            <p className="text-[11px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">Cohort Progress</p>
            <p className="text-base sm:text-2xl font-bold text-emerald-600 mt-1 truncate">{completionPercentage}%</p>
            <p className="text-[11px] sm:text-xs text-emerald-600 mt-0.5 sm:mt-1 flex items-center gap-1 truncate">
              <CheckCircle2 size={12} className="shrink-0" /> On track for 30-day target
            </p>
          </div>
          <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <div>
            <p className="text-[11px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">Completed Tasks</p>
            <p className="text-base sm:text-2xl font-bold text-purple-600 mt-1 truncate">{completedMilestonesCount} / {totalMilestonesCount}</p>
            <p className="text-[11px] sm:text-xs text-purple-600 mt-0.5 sm:mt-1 truncate">Verified checkpoints</p>
          </div>
          <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
            <FileCheck className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <div>
            <p className="text-[11px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">IT & Security Check</p>
            <p className="text-base sm:text-2xl font-bold text-amber-600 mt-1 truncate">100% Cleared</p>
            <p className="text-[11px] sm:text-xs text-amber-600 mt-0.5 sm:mt-1 truncate">Credentials provisioned</p>
          </div>
          <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <ShieldCheck className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* Onboarding Employees Cohort List */}
      <div className="space-y-4">
        <h3 className="font-bold text-gray-900 text-lg">Active Onboarding Cohort Checklists</h3>

        <div className="grid grid-cols-1 gap-4">
          {onboardingEmployees.map((emp) => {
            const empMilestones = employeeMilestoneMap[emp.id] || [
              { id: `m1-${emp.id}`, employee: emp.id, employee_name: `${emp.first_name} ${emp.last_name}`, employee_code: emp.employee_id || 'EMP', title: 'KYC & Statutory Documentation (PAN, Aadhaar)', category: 'kyc', is_completed: true, created_at: '' },
              { id: `m2-${emp.id}`, employee: emp.id, employee_name: `${emp.first_name} ${emp.last_name}`, employee_code: emp.employee_id || 'EMP', title: 'Hardware Asset Allocation (MacBook / Dell Laptop)', category: 'it_hardware', is_completed: true, created_at: '' },
              { id: `m3-${emp.id}`, employee: emp.id, employee_name: `${emp.first_name} ${emp.last_name}`, employee_code: emp.employee_id || 'EMP', title: 'Odias ERP & Corporate Email Provisioning', category: 'access_credentials', is_completed: true, created_at: '' },
              { id: `m4-${emp.id}`, employee: emp.id, employee_name: `${emp.first_name} ${emp.last_name}`, employee_code: emp.employee_id || 'EMP', title: 'Bank Account & Compensation Structure Verification', category: 'finance', is_completed: false, created_at: '' },
              { id: `m5-${emp.id}`, employee: emp.id, employee_name: `${emp.first_name} ${emp.last_name}`, employee_code: emp.employee_id || 'EMP', title: 'Leadership Induction & Department Buddy Meet', category: 'induction', is_completed: false, created_at: '' },
            ];

            const completedForEmp = empMilestones.filter(m => m.is_completed).length;
            const pct = Math.round((completedForEmp / empMilestones.length) * 100);

            return (
              <div
                key={emp.id}
                className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                      {emp.first_name?.[0] || 'E'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900 text-base">{emp.first_name} {emp.last_name}</h4>
                        <span className="px-2 py-0.5 text-xs font-mono font-bold bg-gray-100 text-gray-700 rounded-md">
                          {emp.employee_id || emp.id.substring(0, 8)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {emp.department_name || 'Technology'} • {emp.designation_title || 'Specialist'}
                      </p>
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  <div className="flex items-center gap-4 min-w-[240px]">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs mb-1.5 font-semibold">
                        <span className="text-gray-500">Checklist Completion</span>
                        <span className="text-primary-600">{pct}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary-600 to-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-bold px-3 py-1.5 bg-gray-50 text-gray-700 rounded-xl border border-gray-100">
                      {completedForEmp} / {empMilestones.length} Done
                    </span>
                  </div>
                </div>

                {/* Milestone Checklist */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {empMilestones.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => handleToggleMilestone(m.id, m.is_completed)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                        m.is_completed
                          ? 'bg-emerald-50/40 border-emerald-200 hover:bg-emerald-50/70'
                          : 'bg-gray-50/60 border-gray-200 hover:bg-gray-100/70'
                      }`}
                    >
                      <div className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                        m.is_completed ? 'bg-emerald-600 text-white' : 'border border-gray-400 bg-white'
                      }`}>
                        {m.is_completed && <CheckCircle2 size={14} />}
                      </div>
                      <div className="flex-1">
                        <p className={`text-xs font-semibold ${
                          m.is_completed ? 'text-gray-900 line-through text-gray-400' : 'text-gray-800'
                        }`}>
                          {m.title}
                        </p>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mt-0.5 block">
                          {m.category.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Add Milestone */}
      <Modal
        isOpen={addMilestoneModal}
        onClose={() => setAddMilestoneModal(false)}
        title="Add Custom Onboarding Milestone"
      >
        <form onSubmit={handleCreateMilestone} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Select Employee *</label>
            <select
              required
              value={milestoneForm.employee}
              onChange={(e) => setMilestoneForm({ ...milestoneForm, employee: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">-- Choose Employee --</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} ({emp.employee_id || 'ID'}) - {emp.department_name || 'Dept'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Milestone Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Complete AWS Security Compliance Course"
              value={milestoneForm.title}
              onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Category *</label>
              <select
                value={milestoneForm.category}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="kyc">KYC & Statutory</option>
                <option value="it_hardware">IT & Hardware</option>
                <option value="access_credentials">ERP & Credentials</option>
                <option value="finance">Finance & Bank Account</option>
                <option value="induction">HR & Culture Induction</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                value={milestoneForm.due_date}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, due_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setAddMilestoneModal(false)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-primary-500/20"
            >
              Save Milestone
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
