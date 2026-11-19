import React, { useState, useEffect } from 'react';
import {
  UserMinus, CheckCircle2, Clock, ShieldCheck, Laptop, IndianRupee,
  FileCheck, Users, Plus, Eye, AlertCircle, Search, Filter, Check, X
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import { Modal } from '../../components/common/Modal';
import type { OffboardingRecord, Employee } from '../../types';

export const OffboardingPage: React.FC = () => {
  const { user } = useAuth();
  const { emitEvent, subscribe } = useRealtime();

  const [records, setRecords] = useState<OffboardingRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [initiateModal, setInitiateModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<OffboardingRecord | null>(null);

  // Form State
  const [form, setForm] = useState({
    employee: '',
    resignation_date: new Date().toISOString().split('T')[0],
    last_working_day: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
    notice_period_days: 60,
    reason: 'Career Advancement & Higher Education',
    exit_interview_notes: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [offRes, empRes] = await Promise.all([
        api.getOffboardings(),
        api.getEmployees(),
      ]);
      setRecords(offRes?.data?.results || offRes?.data || []);
      setEmployees(empRes?.data?.results || empRes?.data || []);
    } catch (err) {
      console.error('Failed to load offboarding records', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = subscribe('offboarding_*', () => {
      loadData();
    });
    return () => unsub();
  }, []);

  const handleInitiateExit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employee) {
      showToast('Please select an employee');
      return;
    }
    try {
      await api.createOffboarding({
        ...form,
        notice_period_days: Number(form.notice_period_days),
        status: 'notice_period',
        it_clearance: false,
        finance_clearance: false,
        hr_clearance: false,
      });
      emitEvent('offboarding_initiated', 'Separation Initiated', 'Resignation notice period initiated', 'warning');
      showToast('Separation process initiated successfully!');
      setInitiateModal(false);
      setForm({
        employee: '',
        resignation_date: new Date().toISOString().split('T')[0],
        last_working_day: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
        notice_period_days: 60,
        reason: '',
        exit_interview_notes: '',
      });
      loadData();
    } catch (err: any) {
      console.error(err);
      showToast(err?.response?.data?.detail || 'Failed to initiate offboarding');
    }
  };

  const handleToggleClearance = async (id: string, field: 'it_clearance' | 'finance_clearance' | 'hr_clearance', current: boolean) => {
    try {
      await api.updateOffboarding(id, {
        [field]: !current,
      });
      emitEvent('offboarding_clearance_updated', 'Clearance Checkpoint', `${field} updated`, 'info');
      showToast(`Clearance checkpoint updated!`);
      loadData();
    } catch (err: any) {
      console.error(err);
      showToast('Failed to toggle clearance');
    }
  };

  const handleRelieveEmployee = async (id: string) => {
    try {
      await api.updateOffboarding(id, {
        status: 'relieved',
        it_clearance: true,
        finance_clearance: true,
        hr_clearance: true,
      });
      emitEvent('offboarding_relieved', 'Employee Relieved', 'Employee relieved and sent for final settlement', 'success');
      showToast('Employee marked as formally RELIEVED. Final settlement ready in Payroll.');
      if (selectedRecord && selectedRecord.id === id) {
        setSelectedRecord({ ...selectedRecord, status: 'relieved', it_clearance: true, finance_clearance: true, hr_clearance: true });
      }
      loadData();
    } catch (err: any) {
      console.error(err);
      showToast('Failed to relieve employee');
    }
  };

  // KPIs
  const totalResigned = records.length;
  const activeNotice = records.filter(r => r.status === 'notice_period' || r.status === 'clearance_in_progress').length;
  const pendingITClearance = records.filter(r => !r.it_clearance && r.status !== 'relieved').length;
  const relievedCount = records.filter(r => r.status === 'relieved').length;

  const filtered = records.filter(rec => {
    const matchesStatus = statusFilter === 'all' || rec.status === statusFilter;
    const matchesSearch =
      rec.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.employee_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.department_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.reason.toLowerCase().includes(searchQuery.toLowerCase());
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
          <h1 className="text-2xl font-bold text-gray-900">Employee Offboarding</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage resignations, notice periods, multi-department clearances (IT, Finance, HR), and relieving letters.
          </p>
        </div>
        <button
          onClick={() => setInitiateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 text-sm font-semibold transition-all shadow-md shadow-primary-500/20"
        >
          <Plus size={16} />
          Initiate Exit / Resignation
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Serving Notice</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{activeNotice} Employees</p>
            <p className="text-xs text-amber-600 mt-1">Active exit pipeline</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">IT Returns Pending</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">{pendingITClearance} Hardware</p>
            <p className="text-xs text-rose-600 mt-1">Laptops & access cards</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <Laptop size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Relieved & Settled</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{relievedCount}</p>
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
              <CheckCircle2 size={12} /> Full & final complete
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Avg Notice Period</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">60 Days</p>
            <p className="text-xs text-purple-600 mt-1">Standard corporate policy</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <UserMinus size={24} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['all', 'notice_period', 'clearance_in_progress', 'relieved'].map(status => (
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
            placeholder="Search employee, dept, reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Offboarding Records Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50/80 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Resignation Date</th>
                <th className="py-3 px-4">Last Working Day</th>
                <th className="py-3 px-4 text-center">IT Assets</th>
                <th className="py-3 px-4 text-center">Finance No-Dues</th>
                <th className="py-3 px-4 text-center">HR Exit Review</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-400 text-sm">
                    No offboarding records found matching the filter.
                  </td>
                </tr>
              ) : (
                filtered.map((rec) => (
                  <tr key={rec.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-500 to-orange-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                          {rec.employee_name?.[0] || 'E'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{rec.employee_name}</p>
                          <p className="text-xs text-gray-400 font-mono">{rec.employee_code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-700">
                      {rec.department_name}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 text-xs font-medium">
                      {rec.resignation_date}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-900 text-xs">
                      {rec.last_working_day}
                    </td>

                    {/* IT Clearance Toggle */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleClearance(rec.id, 'it_clearance', rec.it_clearance)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          rec.it_clearance
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                        }`}
                        title="Click to toggle IT Clearance"
                      >
                        {rec.it_clearance ? 'Returned' : 'Pending'}
                      </button>
                    </td>

                    {/* Finance Clearance Toggle */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleClearance(rec.id, 'finance_clearance', rec.finance_clearance)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          rec.finance_clearance
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        }`}
                        title="Click to toggle Finance Clearance"
                      >
                        {rec.finance_clearance ? 'No Dues' : 'Pending'}
                      </button>
                    </td>

                    {/* HR Clearance Toggle */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleClearance(rec.id, 'hr_clearance', rec.hr_clearance)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          rec.hr_clearance
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                        }`}
                        title="Click to toggle HR Exit Interview"
                      >
                        {rec.hr_clearance ? 'Completed' : 'Pending'}
                      </button>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full capitalize ${
                        rec.status === 'relieved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : rec.status === 'notice_period'
                          ? 'bg-amber-50 text-amber-700 border border-amber-100'
                          : 'bg-blue-50 text-blue-700 border border-blue-100'
                      }`}>
                        {rec.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedRecord(rec)}
                          className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-all"
                          title="View Exit Dossier"
                        >
                          <Eye size={16} />
                        </button>
                        {rec.status !== 'relieved' && (
                          <button
                            onClick={() => handleRelieveEmployee(rec.id)}
                            className="px-2.5 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                            title="Mark as Relieved"
                          >
                            Relieve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Initiate Resignation */}
      <Modal
        isOpen={initiateModal}
        onClose={() => setInitiateModal(false)}
        title="Initiate Employee Separation / Exit"
      >
        <form onSubmit={handleInitiateExit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Select Employee *</label>
            <select
              required
              value={form.employee}
              onChange={(e) => setForm({ ...form, employee: e.target.value })}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Resignation Date *</label>
              <input
                type="date"
                required
                value={form.resignation_date}
                onChange={(e) => setForm({ ...form, resignation_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Last Working Day (LWD) *</label>
              <input
                type="date"
                required
                value={form.last_working_day}
                onChange={(e) => setForm({ ...form, last_working_day: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Notice Period (Days) *</label>
            <input
              type="number"
              min="0"
              required
              value={form.notice_period_days}
              onChange={(e) => setForm({ ...form, notice_period_days: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Reason for Resignation *</label>
            <textarea
              required
              rows={2}
              placeholder="e.g. Higher education, relocation, compensation alignment..."
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Exit Interview & Handover Notes</label>
            <textarea
              rows={2}
              placeholder="Project handover owner, replacement status..."
              value={form.exit_interview_notes}
              onChange={(e) => setForm({ ...form, exit_interview_notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setInitiateModal(false)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-primary-500/20"
            >
              Initiate Separation
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Exit Dossier */}
      {selectedRecord && (
        <Modal
          isOpen={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          title={`Separation Dossier: ${selectedRecord.employee_name}`}
        >
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase">Department</p>
                <p className="text-base font-bold text-gray-900">{selectedRecord.department_name}</p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{selectedRecord.employee_code}</p>
              </div>
              <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full uppercase">
                {selectedRecord.status.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 border border-gray-100 rounded-xl">
                <span className="text-xs text-gray-400 block">Resignation Date</span>
                <span className="font-bold text-gray-800">{selectedRecord.resignation_date}</span>
              </div>
              <div className="p-3 border border-gray-100 rounded-xl">
                <span className="text-xs text-gray-400 block">Last Working Day</span>
                <span className="font-bold text-primary-600">{selectedRecord.last_working_day} ({selectedRecord.notice_period_days} Days)</span>
              </div>
            </div>

            <div className="p-3 border border-gray-100 rounded-xl text-sm">
              <span className="text-xs text-gray-400 block font-semibold mb-1">Reason for Leaving:</span>
              <p className="text-gray-700">{selectedRecord.reason}</p>
            </div>

            <div className="p-4 border border-gray-100 rounded-xl text-sm bg-gray-50/50 space-y-2">
              <span className="text-xs font-bold text-gray-700 block">Departmental Clearance Status:</span>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className={`p-2 rounded-lg font-bold ${selectedRecord.it_clearance ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  IT Assets: {selectedRecord.it_clearance ? 'Cleared' : 'Pending'}
                </div>
                <div className={`p-2 rounded-lg font-bold ${selectedRecord.finance_clearance ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                  Finance: {selectedRecord.finance_clearance ? 'Cleared' : 'Pending'}
                </div>
                <div className={`p-2 rounded-lg font-bold ${selectedRecord.hr_clearance ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                  HR Exit: {selectedRecord.hr_clearance ? 'Cleared' : 'Pending'}
                </div>
              </div>
            </div>

            {selectedRecord.exit_interview_notes && (
              <div className="p-3 border border-gray-100 rounded-xl text-sm bg-blue-50/40">
                <span className="text-xs text-blue-600 block font-semibold mb-1">Exit Interview & Notes:</span>
                <p className="text-gray-700">{selectedRecord.exit_interview_notes}</p>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold"
              >
                Close
              </button>
              {selectedRecord.status !== 'relieved' && (
                <button
                  onClick={() => handleRelieveEmployee(selectedRecord.id)}
                  className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-primary-500/20"
                >
                  Confirm Relieving
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
