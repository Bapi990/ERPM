import React, { useState, useEffect } from 'react';
import {
  HelpCircle, Plus, CheckCircle2, Clock, AlertTriangle, ShieldAlert,
  ShieldCheck, Eye, Search, Filter, MessageSquare, UserCheck, Lock,
  ChevronRight
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import { Modal } from '../../components/common/Modal';
import type { EmployeeGrievance, Employee } from '../../types';

export const GrievancesPage: React.FC = () => {
  const { user } = useAuth();
  const { emitEvent, subscribe } = useRealtime();

  const [grievances, setGrievances] = useState<EmployeeGrievance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [fileModal, setFileModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState<EmployeeGrievance | null>(null);
  const [resolutionModal, setResolutionModal] = useState(false);

  // Form State
  const [form, setForm] = useState({
    employee: '',
    subject: '',
    category: 'workplace',
    priority: 'medium' as 'high' | 'medium' | 'low',
    description: '',
    is_anonymous: false,
  });

  // Resolution Form
  const [resolutionData, setResolutionData] = useState({
    status: 'in_review' as 'open' | 'in_review' | 'hearing' | 'resolved',
    assigned_hr_name: 'Priyanka Sen (HR Lead)',
    resolution_notes: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [gRes, empRes] = await Promise.all([
        api.getGrievances().catch(() => ({ results: [] })),
        api.getEmployees().catch(() => ({ results: [] })),
      ]);
      setGrievances(gRes?.results || (Array.isArray(gRes) ? gRes : gRes?.data?.results || gRes?.data || []));
      setEmployees(empRes?.results || (Array.isArray(empRes) ? empRes : empRes?.data?.results || empRes?.data || []));
    } catch (err) {
      console.error('Failed to load grievances', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub1 = subscribe('grievance_*', () => loadData());
    const unsub2 = subscribe('employee_*', () => loadData());
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  const handleFileGrievance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.is_anonymous && !form.employee) {
      showToast('Please select an employee or enable Anonymous mode');
      return;
    }
    try {
      await api.createGrievance({
        ...form,
        employee: form.is_anonymous ? (employees[0]?.id || '') : form.employee,
        status: 'open',
      });
      emitEvent('grievance_filed', 'Grievance Ticket Registered', 'Confidential ticket logged with ethics committee', 'warning');
      showToast('Grievance ticket registered confidentially!');
      setFileModal(false);
      setForm({
        employee: '',
        subject: '',
        category: 'workplace',
        priority: 'medium',
        description: '',
        is_anonymous: false,
      });
      loadData();
    } catch (err: any) {
      console.error(err);
      showToast(err?.response?.data?.detail || 'Failed to file grievance');
    }
  };

  const handleSaveResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;
    try {
      await api.updateGrievance(selectedCase.id, {
        status: resolutionData.status,
        assigned_hr_name: resolutionData.assigned_hr_name,
        resolution_notes: resolutionData.resolution_notes,
        resolved_at: resolutionData.status === 'resolved' ? new Date().toISOString() : null,
      });
      emitEvent('grievance_status_updated', 'Grievance Case Progressed', `Case moved to stage: ${resolutionData.status.toUpperCase()}`, 'info');
      showToast(`Grievance case updated to ${resolutionData.status.toUpperCase()}`);
      setResolutionModal(false);
      setSelectedCase(null);
      loadData();
    } catch (err: any) {
      console.error(err);
      showToast('Failed to update grievance case');
    }
  };

  // KPIs
  const totalCount = grievances.length;
  const openCount = grievances.filter(g => g.status === 'open').length;
  const inReviewCount = grievances.filter(g => g.status === 'in_review' || g.status === 'hearing').length;
  const resolvedCount = grievances.filter(g => g.status === 'resolved').length;

  const filtered = grievances.filter(g => {
    const matchesStatus = statusFilter === 'all' || g.status === statusFilter;
    const matchesSearch =
      g.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.department_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

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
          <h1 className="text-2xl font-bold text-gray-900">Employee Grievances</h1>
          <p className="text-sm text-gray-500 mt-1">
            Confidential redressal portal for workplace ethics, POSH inquiries, compensation questions, and dispute hearings.
          </p>
        </div>
        <button
          onClick={() => setFileModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 text-sm font-semibold transition-all shadow-md shadow-primary-500/20"
        >
          <Plus size={16} />
          File Grievance Ticket
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <div>
            <p className="text-[11px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Filed Cases</p>
            <p className="text-base sm:text-2xl font-bold text-gray-900 mt-1 truncate">{totalCount}</p>
            <p className="text-[11px] sm:text-xs text-primary-600 mt-0.5 sm:mt-1 truncate">Confidential records</p>
          </div>
          <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <HelpCircle className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <div>
            <p className="text-[11px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">New & Open</p>
            <p className="text-base sm:text-2xl font-bold text-rose-600 mt-1 truncate">{openCount}</p>
            <p className="text-[11px] sm:text-xs text-rose-600 mt-0.5 sm:mt-1 flex items-center gap-1 truncate">
              <AlertTriangle size={12} className="shrink-0" /> Pending intake triage
            </p>
          </div>
          <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0">
            <AlertTriangle className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <div>
            <p className="text-[11px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">In Review / Hearing</p>
            <p className="text-base sm:text-2xl font-bold text-amber-600 mt-1 truncate">{inReviewCount}</p>
            <p className="text-[11px] sm:text-xs text-amber-600 mt-0.5 sm:mt-1 flex items-center gap-1 truncate">
              <Clock size={12} className="shrink-0" /> Under formal probe
            </p>
          </div>
          <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Clock className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <div>
            <p className="text-[11px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">Resolved & Closed</p>
            <p className="text-base sm:text-2xl font-bold text-emerald-600 mt-1 truncate">{resolvedCount}</p>
            <p className="text-[11px] sm:text-xs text-emerald-600 mt-0.5 sm:mt-1 flex items-center gap-1 truncate">
              <ShieldCheck size={12} className="shrink-0" /> Redressed successfully
            </p>
          </div>
          <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <ShieldCheck className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['all', 'open', 'in_review', 'hearing', 'resolved'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                statusFilter === status
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search subject, filer, department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Grievances Master Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50/80 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Submitter</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Assigned Officer</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400 text-sm">
                    No grievance cases found matching the criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((caseItem) => (
                  <tr key={caseItem.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-gray-900">{caseItem.subject}</p>
                      <p className="text-xs text-gray-400 max-w-xs truncate">{caseItem.description}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      {caseItem.is_anonymous ? (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                          <Lock size={13} className="text-amber-500" /> Anonymous Submitter
                        </div>
                      ) : (
                        <div>
                          <p className="font-semibold text-gray-900 text-xs">{caseItem.employee_name}</p>
                          <p className="text-[11px] text-gray-400">{caseItem.department_name}</p>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-gray-100 text-gray-700 capitalize">
                        {caseItem.category_display || caseItem.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-md uppercase ${
                        caseItem.priority === 'high'
                          ? 'bg-rose-100 text-rose-800'
                          : caseItem.priority === 'medium'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {caseItem.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-gray-700">
                      {caseItem.assigned_hr_name || 'HR Grievance Committee'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full capitalize ${
                        caseItem.status === 'resolved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : caseItem.status === 'hearing'
                          ? 'bg-purple-50 text-purple-700 border border-purple-100'
                          : caseItem.status === 'in_review'
                          ? 'bg-blue-50 text-blue-700 border border-blue-100'
                          : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        {caseItem.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedCase(caseItem)}
                          className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-all"
                          title="View Case Dossier"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCase(caseItem);
                            setResolutionData({
                              status: caseItem.status,
                              assigned_hr_name: caseItem.assigned_hr_name || 'HR Lead',
                              resolution_notes: caseItem.resolution_notes || '',
                            });
                            setResolutionModal(true);
                          }}
                          className="px-2.5 py-1 bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-lg text-xs font-semibold transition-all"
                        >
                          Update Status
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

      {/* Modal: File Grievance Ticket */}
      <Modal
        isOpen={fileModal}
        onClose={() => setFileModal(false)}
        title="File Confidential Grievance Ticket"
      >
        <form onSubmit={handleFileGrievance} className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
            <div className="flex items-center gap-2">
              <Lock size={16} className="text-amber-600" />
              <span className="text-xs font-bold text-amber-900">File Anonymously (Whistleblower Protection)</span>
            </div>
            <input
              type="checkbox"
              checked={form.is_anonymous}
              onChange={(e) => setForm({ ...form, is_anonymous: e.target.checked })}
              className="w-4 h-4 text-primary-600 rounded cursor-pointer"
            />
          </div>

          {!form.is_anonymous && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Select Employee *</label>
              <select
                required={!form.is_anonymous}
                value={form.employee}
                onChange={(e) => setForm({ ...form, employee: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">-- Choose Submitting Employee --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} ({emp.employee_id || 'ID'}) - {emp.department_name || 'Dept'}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Grievance Subject *</label>
            <input
              type="text"
              required
              placeholder="e.g. Unfair shift rotation / statutory allowance discrepancy"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="workplace">Workplace Environment & Safety</option>
                <option value="compensation">Compensation & Benefit Policy</option>
                <option value="posh">POSH & Anti-Harassment (Strictly Confidential)</option>
                <option value="shift">Shift & Roster Allocation</option>
                <option value="managerial">Managerial Conduct & Ethics</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Priority Level *</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="high">High (Urgent Attention)</option>
                <option value="medium">Medium (Standard Triage)</option>
                <option value="low">Low (General Feedback)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Detailed Description *</label>
            <textarea
              required
              rows={4}
              placeholder="Describe the incident, dates, witnesses, and desired resolution..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setFileModal(false)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-primary-500/20"
            >
              Register Case
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Grievance Dossier */}
      {selectedCase && !resolutionModal && (
        <Modal
          isOpen={!!selectedCase}
          onClose={() => setSelectedCase(null)}
          title={`Grievance Case Dossier`}
        >
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase">Category</p>
                <p className="text-base font-bold text-gray-900">{selectedCase.category_display || selectedCase.category}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Filer: {selectedCase.is_anonymous ? 'Anonymous Submitter' : selectedCase.employee_name}
                </p>
              </div>
              <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase ${
                selectedCase.priority === 'high' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {selectedCase.priority} Priority
              </span>
            </div>

            <div className="p-3 border border-gray-100 rounded-xl text-sm">
              <span className="text-xs text-gray-400 block font-semibold mb-1">Subject:</span>
              <p className="font-bold text-gray-900">{selectedCase.subject}</p>
            </div>

            <div className="p-3 border border-gray-100 rounded-xl text-sm">
              <span className="text-xs text-gray-400 block font-semibold mb-1">Detailed Incident Narrative:</span>
              <p className="text-gray-700 whitespace-pre-wrap">{selectedCase.description}</p>
            </div>

            {selectedCase.resolution_notes && (
              <div className="p-3 border border-emerald-100 rounded-xl text-sm bg-emerald-50/50">
                <span className="text-xs text-emerald-800 block font-semibold mb-1">HR Redressal & Resolution Notes:</span>
                <p className="text-emerald-950">{selectedCase.resolution_notes}</p>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedCase(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setResolutionData({
                    status: selectedCase.status,
                    assigned_hr_name: selectedCase.assigned_hr_name || 'HR Lead',
                    resolution_notes: selectedCase.resolution_notes || '',
                  });
                  setResolutionModal(true);
                }}
                className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-primary-500/20"
              >
                Progress Case Status
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Progress Case Status */}
      {selectedCase && resolutionModal && (
        <Modal
          isOpen={resolutionModal}
          onClose={() => setResolutionModal(false)}
          title={`Progress Case: ${selectedCase.subject}`}
        >
          <form onSubmit={handleSaveResolution} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Investigation Stage / Status *</label>
              <select
                value={resolutionData.status}
                onChange={(e) => setResolutionData({ ...resolutionData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="open">Open (Received)</option>
                <option value="in_review">In Review (Internal HR Review)</option>
                <option value="hearing">Hearing / Investigation Convened</option>
                <option value="resolved">Resolved & Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned HR Investigator</label>
              <input
                type="text"
                value={resolutionData.assigned_hr_name}
                onChange={(e) => setResolutionData({ ...resolutionData, assigned_hr_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Resolution Findings & Committee Actions</label>
              <textarea
                rows={4}
                required
                placeholder="Record committee decisions, policy adjustments, mediation outcomes, or punitive measures..."
                value={resolutionData.resolution_notes}
                onChange={(e) => setResolutionData({ ...resolutionData, resolution_notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setResolutionModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-primary-500/20"
              >
                Save Resolution
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
