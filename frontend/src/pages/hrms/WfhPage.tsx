import React, { useState, useEffect } from 'react';
import {
  Laptop, Plus, CheckCircle2, XCircle, Clock, Calendar, Eye,
  Check, X, FileText, User, Building2, Briefcase, Filter, Search,
  AlertCircle
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import type { WfhRequest, Employee } from '../../types';

export const WfhPage: React.FC = () => {
  const { user } = useAuth();
  const { emitEvent, subscribe } = useRealtime();

  const [requests, setRequests] = useState<WfhRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [requestModal, setRequestModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<WfhRequest | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    employee_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    total_days: 1,
    reason: '',
    deliverables: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [wfhRes, empRes] = await Promise.all([
        api.getWfhRequests(),
        api.getEmployees(),
      ]);
      setRequests(wfhRes?.data?.results || wfhRes?.data || []);
      setEmployees(empRes?.data?.results || empRes?.data || []);
    } catch (err) {
      console.error('Failed to load WFH requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = subscribe('wfh_*', () => {
      loadData();
    });
    return () => unsub();
  }, []);

  const handleCreateWfh = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employee_id) {
      showToast('Please select an employee');
      return;
    }
    try {
      await api.createWfhRequest({
        employee: formData.employee_id,
        start_date: formData.start_date,
        end_date: formData.end_date,
        total_days: Number(formData.total_days),
        reason: formData.reason,
        deliverables: formData.deliverables,
        status: 'pending',
      });
      emitEvent('wfh_created', 'WFH Application Filed', 'Remote work request submitted for authorization', 'info');
      showToast('WFH application submitted successfully!');
      setRequestModal(false);
      setFormData({
        employee_id: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        total_days: 1,
        reason: '',
        deliverables: '',
      });
      loadData();
    } catch (err: any) {
      console.error(err);
      showToast(err?.response?.data?.detail || 'Failed to submit WFH request');
    }
  };

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await api.updateWfhStatus(id, status);
      emitEvent('wfh_updated', 'WFH Request Evaluated', `WFH application has been ${status}`, status === 'approved' ? 'success' : 'warning');
      showToast(`WFH request marked as ${status.toUpperCase()}`);
      if (selectedRequest && selectedRequest.id === id) {
        setSelectedRequest({ ...selectedRequest, status });
      }
      loadData();
    } catch (err: any) {
      console.error(err);
      showToast('Failed to update WFH request status');
    }
  };

  // KPIs
  const totalCount = requests.length;
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const totalDaysApproved = requests
    .filter(r => r.status === 'approved')
    .reduce((sum, r) => sum + (Number(r.total_days) || 0), 0);

  // Filtered requests
  const filtered = requests.filter(r => {
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchesSearch =
      (r.employee_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.employee_code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.department_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.reason || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl transition-all">
          <CheckCircle2 size={18} />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Work From Home Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track and authorize employee remote work applications, deliverable plans, and quotas.
          </p>
        </div>
        <button
          onClick={() => setRequestModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 text-sm font-semibold transition-all shadow-md shadow-primary-500/20"
        >
          <Plus size={16} />
          Submit WFH Request
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Requests</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalCount}</p>
            <p className="text-xs text-primary-600 mt-1">Logged across all units</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Laptop size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pending Authorizations</p>
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
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Approved Requests</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{approvedCount}</p>
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
              <CheckCircle2 size={12} /> Authorized remote days
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Remote Days</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{totalDaysApproved} Days</p>
            <p className="text-xs text-purple-600 mt-1">Approved remote tenure</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Calendar size={24} />
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
            placeholder="Search employee, dept, reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50/80 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Date Range</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Planned Deliverables</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400 text-sm">
                    No WFH requests found matching the current criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                          {req.employee_name?.[0] || 'E'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{req.employee_name}</p>
                          <p className="text-xs text-gray-400 font-mono">{req.employee_code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-700">
                      {req.department_name}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 text-xs font-medium">
                      {req.start_date} <span className="text-gray-400 font-normal">to</span> {req.end_date}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-gray-100 text-gray-800">
                        {req.total_days} {req.total_days === 1 ? 'Day' : 'Days'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 text-xs max-w-xs truncate" title={req.deliverables || req.reason}>
                      {req.deliverables || req.reason}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full capitalize ${
                        req.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : req.status === 'rejected'
                          ? 'bg-rose-50 text-rose-700 border border-rose-100'
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedRequest(req)}
                          className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        {req.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(req.id, 'approved')}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                              title="Approve WFH"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(req.id, 'rejected')}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              title="Reject WFH"
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

      {/* Modal: Submit WFH Request */}
      <Modal
        isOpen={requestModal}
        onClose={() => setRequestModal(false)}
        title="Submit Work From Home Application"
      >
        <form onSubmit={handleCreateWfh} className="space-y-4">
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
              <label className="block text-xs font-semibold text-gray-700 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">End Date *</label>
              <input
                type="date"
                required
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Total Days *</label>
            <input
              type="number"
              min="1"
              max="30"
              required
              value={formData.total_days}
              onChange={(e) => setFormData({ ...formData, total_days: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Business Reason *</label>
            <textarea
              required
              rows={2}
              placeholder="Provide reason for remote work..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Planned Deliverables / Daily Target</label>
            <textarea
              rows={2}
              placeholder="e.g. Complete GST reconciliation, deploy release v2.4, client calls..."
              value={formData.deliverables}
              onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setRequestModal(false)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-primary-500/20"
            >
              Submit Request
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Request Dossier */}
      {selectedRequest && (
        <Modal
          isOpen={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          title={`WFH Application: ${selectedRequest.employee_name}`}
        >
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase">Department</p>
                <p className="text-base font-bold text-gray-900">{selectedRequest.department_name}</p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{selectedRequest.employee_code}</p>
              </div>
              <span className={`px-3 py-1 text-xs font-bold rounded-full capitalize ${
                selectedRequest.status === 'approved'
                  ? 'bg-emerald-100 text-emerald-800'
                  : selectedRequest.status === 'rejected'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {selectedRequest.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 border border-gray-100 rounded-xl">
                <span className="text-xs text-gray-400 block">Dates Requested</span>
                <span className="font-bold text-gray-800">{selectedRequest.start_date} → {selectedRequest.end_date}</span>
              </div>
              <div className="p-3 border border-gray-100 rounded-xl">
                <span className="text-xs text-gray-400 block">Total Days</span>
                <span className="font-bold text-primary-600">{selectedRequest.total_days} Days</span>
              </div>
            </div>

            <div className="p-3 border border-gray-100 rounded-xl text-sm">
              <span className="text-xs text-gray-400 block font-semibold mb-1">Reason for Remote Work:</span>
              <p className="text-gray-700">{selectedRequest.reason}</p>
            </div>

            {selectedRequest.deliverables && (
              <div className="p-3 border border-gray-100 rounded-xl text-sm bg-blue-50/40">
                <span className="text-xs text-blue-600 block font-semibold mb-1">Planned Deliverables:</span>
                <p className="text-gray-700">{selectedRequest.deliverables}</p>
              </div>
            )}

            {selectedRequest.status === 'pending' && (
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  onClick={() => handleUpdateStatus(selectedRequest.id, 'rejected')}
                  className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-sm font-semibold"
                >
                  Reject Request
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedRequest.id, 'approved')}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-500/20"
                >
                  Approve Request
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
