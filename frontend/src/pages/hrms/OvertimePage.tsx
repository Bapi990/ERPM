import React, { useState, useEffect } from 'react';
import {
  Clock, Plus, CheckCircle2, XCircle, DollarSign, Calendar, Eye,
  Check, X, User, Building2, Briefcase, Filter, Search, Zap, IndianRupee
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import { Modal } from '../../components/common/Modal';
import type { OvertimeRecord, Employee } from '../../types';

export const OvertimePage: React.FC = () => {
  const { user } = useAuth();
  const { emitEvent, subscribe } = useRealtime();

  const [records, setRecords] = useState<OvertimeRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [logModal, setLogModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<OvertimeRecord | null>(null);

  // Form
  const [formData, setFormData] = useState({
    employee_id: '',
    date: new Date().toISOString().split('T')[0],
    hours: 2.5,
    multiplier: 1.5,
    pay_amount: 1200,
    task_summary: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [otRes, empRes] = await Promise.all([
        api.getOvertimeRecords(),
        api.getEmployees(),
      ]);
      setRecords(otRes?.data?.results || otRes?.data || []);
      setEmployees(empRes?.data?.results || empRes?.data || []);
    } catch (err) {
      console.error('Failed to load overtime records', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = subscribe('overtime_*', () => {
      loadData();
    });
    return () => unsub();
  }, []);

  const handleCreateOt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employee_id) {
      showToast('Please select an employee');
      return;
    }
    try {
      await api.createOvertimeRecord({
        employee: formData.employee_id,
        date: formData.date,
        hours: Number(formData.hours),
        multiplier: Number(formData.multiplier),
        pay_amount: Number(formData.pay_amount),
        task_summary: formData.task_summary,
        status: 'pending',
      });
      emitEvent('overtime_created', 'Overtime Claim Logged', 'Extra hours claim submitted for authorization', 'info');
      showToast('Overtime claim submitted successfully!');
      setLogModal(false);
      setFormData({
        employee_id: '',
        date: new Date().toISOString().split('T')[0],
        hours: 2.5,
        multiplier: 1.5,
        pay_amount: 1200,
        task_summary: '',
      });
      loadData();
    } catch (err: any) {
      console.error(err);
      showToast(err?.response?.data?.detail || 'Failed to submit overtime claim');
    }
  };

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await api.updateOvertimeStatus(id, status);
      emitEvent('overtime_updated', 'Overtime Status Updated', `Overtime claim marked as ${status}`, status === 'approved' ? 'success' : 'warning');
      showToast(`Overtime claim marked as ${status.toUpperCase()}`);
      if (selectedRecord && selectedRecord.id === id) {
        setSelectedRecord({ ...selectedRecord, status });
      }
      loadData();
    } catch (err: any) {
      console.error(err);
      showToast('Failed to update overtime status');
    }
  };

  // KPIs
  const totalHours = records.reduce((sum, r) => sum + (Number(r.hours) || 0), 0).toFixed(1);
  const totalPayout = records
    .filter(r => r.status === 'approved')
    .reduce((sum, r) => sum + (Number(r.pay_amount) || 0), 0);
  const pendingCount = records.filter(r => r.status === 'pending').length;
  const doubleRateCount = records.filter(r => Number(r.multiplier) >= 2.0).length;

  // Filtered
  const filtered = records.filter(r => {
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchesSearch =
      (r.employee_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.employee_code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.department_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.task_summary || '').toLowerCase().includes(searchQuery.toLowerCase());
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
          <h1 className="text-2xl font-bold text-gray-900">Overtime Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track extra hours worked, verify task summaries, and authorize 1.5x / 2.0x overtime payouts.
          </p>
        </div>
        <button
          onClick={() => setLogModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 text-sm font-semibold transition-all shadow-md shadow-primary-500/20"
        >
          <Plus size={16} />
          Log Overtime Claim
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Extra Hours</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalHours} hrs</p>
            <p className="text-xs text-primary-600 mt-1">Logged across all units</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Clock size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Approved OT Payout</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">₹{totalPayout.toLocaleString('en-IN')}</p>
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
              <CheckCircle2 size={12} /> Scheduled in payroll
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <IndianRupee size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pending Approvals</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</p>
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <Clock size={12} /> Awaiting manager sign-off
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Double Rate (2.0x)</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{doubleRateCount} Claims</p>
            <p className="text-xs text-purple-600 mt-1 flex items-center gap-1">
              <Zap size={12} /> Holiday / Night assignments
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Zap size={24} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['all', 'pending', 'approved', 'rejected'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                filterStatus === status
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search employee, dept, work description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Overtime Records Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50/80 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Extra Hours</th>
                <th className="py-3 px-4">Multiplier</th>
                <th className="py-3 px-4">Estimated Pay</th>
                <th className="py-3 px-4">Task Summary</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-400 text-sm">
                    No overtime records found matching the criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((rec) => (
                  <tr key={rec.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-primary-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
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
                      {rec.date}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-gray-100 text-gray-800">
                        {rec.hours} hrs
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-md ${
                        rec.multiplier >= 2.0 ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {rec.multiplier}x
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      ₹{Number(rec.pay_amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 text-xs max-w-xs truncate" title={rec.task_summary}>
                      {rec.task_summary}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full capitalize ${
                        rec.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : rec.status === 'rejected'
                          ? 'bg-rose-50 text-rose-700 border border-rose-100'
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedRecord(rec)}
                          className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        {rec.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(rec.id, 'approved')}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                              title="Approve Overtime"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(rec.id, 'rejected')}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              title="Reject Overtime"
                            >
                              <X size={16} />
                            </button>
                          </>
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

      {/* Modal: Log Overtime Claim */}
      <Modal
        isOpen={logModal}
        onClose={() => setLogModal(false)}
        title="Log Overtime Claim"
      >
        <form onSubmit={handleCreateOt} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Select Employee *</label>
            <select
              required
              value={formData.employee_id}
              onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
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
              <label className="block text-xs font-semibold text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Extra Hours *</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="12"
                required
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">OT Multiplier *</label>
              <select
                value={formData.multiplier}
                onChange={(e) => setFormData({ ...formData, multiplier: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value={1.5}>1.5x (Standard Overtime)</option>
                <option value={2.0}>2.0x (Holiday / Night Work)</option>
                <option value={1.0}>1.0x (Normal Compensatory)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Estimated Pay (₹) *</label>
              <input
                type="number"
                min="0"
                required
                value={formData.pay_amount}
                onChange={(e) => setFormData({ ...formData, pay_amount: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Task Summary / Business Justification *</label>
            <textarea
              required
              rows={3}
              placeholder="Detail the deliverable, emergency deployment, or project requirement completed..."
              value={formData.task_summary}
              onChange={(e) => setFormData({ ...formData, task_summary: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setLogModal(false)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-primary-500/20"
            >
              Submit Claim
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Overtime Dossier */}
      {selectedRecord && (
        <Modal
          isOpen={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          title={`Overtime Claim: ${selectedRecord.employee_name}`}
        >
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase">Department</p>
                <p className="text-base font-bold text-gray-900">{selectedRecord.department_name}</p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{selectedRecord.employee_code}</p>
              </div>
              <span className={`px-3 py-1 text-xs font-bold rounded-full capitalize ${
                selectedRecord.status === 'approved'
                  ? 'bg-emerald-100 text-emerald-800'
                  : selectedRecord.status === 'rejected'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {selectedRecord.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="p-3 border border-gray-100 rounded-xl">
                <span className="text-xs text-gray-400 block">Date</span>
                <span className="font-bold text-gray-800">{selectedRecord.date}</span>
              </div>
              <div className="p-3 border border-gray-100 rounded-xl">
                <span className="text-xs text-gray-400 block">Extra Hours</span>
                <span className="font-bold text-primary-600">{selectedRecord.hours} hrs ({selectedRecord.multiplier}x)</span>
              </div>
              <div className="p-3 border border-gray-100 rounded-xl">
                <span className="text-xs text-gray-400 block">Calculated Pay</span>
                <span className="font-bold text-emerald-600">₹{Number(selectedRecord.pay_amount).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="p-3 border border-gray-100 rounded-xl text-sm">
              <span className="text-xs text-gray-400 block font-semibold mb-1">Work Description & Deliverables:</span>
              <p className="text-gray-700">{selectedRecord.task_summary}</p>
            </div>

            {selectedRecord.status === 'pending' && (
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  onClick={() => handleUpdateStatus(selectedRecord.id, 'rejected')}
                  className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-sm font-semibold"
                >
                  Reject Claim
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedRecord.id, 'approved')}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-500/20"
                >
                  Approve for Payroll
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
