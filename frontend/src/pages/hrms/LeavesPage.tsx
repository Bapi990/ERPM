import React, { useState, useEffect } from 'react';
import {
  FileText, Plus, CheckCircle2, XCircle, Clock, Calendar, Check, X,
  Eye, ArrowLeft, User, Building2, Briefcase, Mail, Phone, MessageSquare,
  ShieldCheck, AlertCircle, Info, Send
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable, type ColumnDef } from '../../components/common/DataTable';
import type { LeaveApplication, LeaveBalance } from '../../types';

export const LeavesPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const { emitEvent, subscribe } = useRealtime();
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);

  // View Mode: 'list' or full-page 'view'
  const [viewMode, setViewMode] = useState<'list' | 'view'>('list');
  const [selectedLeave, setSelectedLeave] = useState<LeaveApplication | null>(null);
  const [approverNotes, setApproverNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Apply Modal
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    leave_type: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    total_days: 1,
    reason: '',
  });

  useEffect(() => {
    loadData();
    const unsub = subscribe('leave_*', () => {
      loadData();
    });
    return () => unsub();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [lRes, bRes] = await Promise.all([
        api.getLeaves(),
        api.getLeaveBalances(),
      ]);
      const lList = lRes.results || lRes || [];
      setLeaves(lList);
      const bList = bRes.results || bRes || [];
      setBalances(bList);
      if (bList.length > 0 && !formData.leave_type) {
        setFormData((prev) => ({ ...prev, leave_type: bList[0].leave_type }));
      }
      // If currently viewing a leave, refresh its state from fresh list
      if (selectedLeave) {
        const refreshed = lList.find((item: LeaveApplication) => item.id === selectedLeave.id);
        if (refreshed) {
          setSelectedLeave(refreshed);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.applyLeave(formData);
      setApplyModalOpen(false);
      setToastMessage('🎉 Leave application submitted successfully!');
      emitEvent('leave_applied', 'Leave Application Submitted', `Applied for ${formData.total_days} day(s) leave`, 'info');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit leave application');
    }
  };

  const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected', commentText?: string) => {
    setActionLoading(true);
    const comment = commentText !== undefined ? commentText : prompt(`Enter approver note for marking leave as ${status}:`);
    if (comment === null && commentText === undefined) {
      setActionLoading(false);
      return;
    }
    try {
      await api.updateLeaveStatus(id, status, comment || '');
      setToastMessage(`✓ Leave application marked as ${status.toUpperCase()} successfully.`);
      emitEvent('leave_decision', `Leave Application ${status.toUpperCase()}`, `Manager updated leave status to ${status}`, status === 'approved' ? 'success' : 'warning');
      await loadData();
      if (selectedLeave && selectedLeave.id === id) {
        setSelectedLeave((prev) => prev ? {
          ...prev,
          status,
          approver_comments: comment || '',
          approved_by_name: user ? `${user.first_name} ${user.last_name}`.trim() : 'Approving Manager'
        } : null);
      }
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Table Columns - REASON COLUMN REMOVED AS REQUESTED BY USER!
  const columns: ColumnDef<LeaveApplication>[] = [
    {
      key: 'employee_name',
      header: 'Employee Name & Code',
      accessor: (row) => row.employee_name,
      render: (row) => (
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
            {row.employee_name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <span className="font-bold text-slate-900 block leading-tight">{row.employee_name}</span>
            <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
              <span>{row.employee_code || 'EMP-ID'}</span>
              <span>•</span>
              <span className="text-slate-500">{row.department_name}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'leave_type_name',
      header: 'Leave Classification',
      accessor: (row) => row.leave_type_name,
      render: (row) => (
        <span
          className="font-bold text-xs px-2.5 py-1 rounded-lg inline-flex items-center"
          style={{
            backgroundColor: `${row.leave_type_color || '#10b981'}15`,
            color: row.leave_type_color || '#10b981',
          }}
        >
          <span
            className="w-2 h-2 rounded-full mr-1.5"
            style={{ backgroundColor: row.leave_type_color || '#10b981' }}
          />
          {row.leave_type_name}
        </span>
      ),
    },
    {
      key: 'dates',
      header: 'Applied Dates',
      accessor: (row) => `${row.start_date} to ${row.end_date}`,
      render: (row) => (
        <div>
          <span className="font-mono text-slate-800 font-semibold block text-xs">
            {row.start_date} to {row.end_date}
          </span>
          <span className="text-[10px] text-slate-400">
            Requested on {new Date(row.created_at).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      key: 'total_days',
      header: 'Duration',
      accessor: (row) => row.total_days,
      render: (row) => (
        <span className="font-black text-slate-900 font-mono bg-slate-100 px-2 py-0.5 rounded text-xs">
          {row.total_days} day(s)
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Approval Status',
      accessor: (row) => row.status,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'approved_by_name',
      header: 'Reviewed By',
      accessor: (row) => row.approved_by_name || '--',
      render: (row) => (
        <span className="text-slate-600 font-medium text-xs">
          {row.approved_by_name || 'Pending Review'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end space-x-1.5">
          {/* Dedicated View Button to Read Full Reason & Details */}
          <button
            onClick={() => {
              setSelectedLeave(row);
              setApproverNotes('');
              setViewMode('view');
            }}
            className="inline-flex items-center px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
            title="Open Full Leave Application Dossier & Read Reason"
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            View
          </button>

          {/* Quick Approve/Reject if Pending */}
          {row.status === 'pending' && (
            <>
              <button
                onClick={() => handleStatusUpdate(row.id, 'approved')}
                className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg cursor-pointer transition-colors shadow-2xs"
                title="Quick Approve"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleStatusUpdate(row.id, 'rejected')}
                className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg cursor-pointer transition-colors shadow-2xs"
                title="Quick Reject"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  // ==========================================
  // FULL-PAGE LEAVE DOSSIER VIEW
  // ==========================================
  if (viewMode === 'view' && selectedLeave) {
    const leaveBalance = balances.find((b) => b.leave_type === selectedLeave.leave_type);

    return (
      <div className="space-y-6">
        {/* Top Header & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setViewMode('list')}
              className="inline-flex items-center px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to Leave Queue
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Leave Application Dossier
                </h1>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-xs font-bold">
                  #{selectedLeave.id.slice(0, 8).toUpperCase()}
                </span>
                <StatusBadge status={selectedLeave.status} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Full-page detailed leave review, statutory justification, applicant profile, and approval authorization.
              </p>
            </div>
          </div>

          {/* Quick Header Decision Actions if Pending */}
          {selectedLeave.status === 'pending' && (
            <div className="flex items-center space-x-2">
              <button
                disabled={actionLoading}
                onClick={() => handleStatusUpdate(selectedLeave.id, 'approved', approverNotes)}
                className="inline-flex items-center px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4 mr-1.5" />
                Approve Leave
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleStatusUpdate(selectedLeave.id, 'rejected', approverNotes)}
                className="inline-flex items-center px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm shadow-rose-600/30 transition-all cursor-pointer"
              >
                <X className="w-4 h-4 mr-1.5" />
                Reject Leave
              </button>
            </div>
          )}
        </div>

        {/* Success Toast */}
        {toastMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between shadow-xs">
            <div className="flex items-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mr-2" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-xs underline text-emerald-700 cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Applicant Profile & Leave Schedule */}
          <div className="space-y-6">
            {/* Applicant Profile Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                  <User className="w-4 h-4 mr-1.5 text-emerald-600" />
                  Applicant Employee
                </span>
                <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  {selectedLeave.employee_code || 'ODS-EMP'}
                </span>
              </div>

              <div className="flex items-center space-x-3.5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-black text-xl flex items-center justify-center shadow-md shadow-emerald-500/20">
                  {selectedLeave.employee_name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                    {selectedLeave.employee_name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedLeave.designation_title || 'Enterprise Specialist'}
                  </p>
                  <span className="inline-block mt-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {selectedLeave.department_name || 'General Operations'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center text-slate-400">
                    <Mail className="w-3.5 h-3.5 mr-1.5" />
                    Email
                  </span>
                  <span className="font-medium text-slate-800">{selectedLeave.employee_email || `${selectedLeave.employee_name.toLowerCase().replace(' ', '.')}@odiaserp.com`}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center text-slate-400">
                    <Phone className="w-3.5 h-3.5 mr-1.5" />
                    Contact
                  </span>
                  <span className="font-medium text-slate-800">{selectedLeave.employee_phone || '+91 94371 88990'}</span>
                </div>
              </div>
            </div>

            {/* Leave Details & Schedule Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center border-b border-slate-100 pb-3">
                <Calendar className="w-4 h-4 mr-1.5 text-blue-600" />
                Schedule & Classification
              </span>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Category</span>
                    <span className="font-bold text-slate-900 text-sm">{selectedLeave.leave_type_name}</span>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-lg text-white font-bold text-xs"
                    style={{ backgroundColor: selectedLeave.leave_type_color || '#10b981' }}
                  >
                    {selectedLeave.leave_type_code || 'STATUTORY'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Start Date</span>
                    <span className="font-bold text-slate-800 font-mono">{selectedLeave.start_date}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">End Date</span>
                    <span className="font-bold text-slate-800 font-mono">{selectedLeave.end_date}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-emerald-600 uppercase font-bold">Total Duration</span>
                    <span className="text-lg font-black text-emerald-900 font-mono block">
                      {selectedLeave.total_days} Day(s)
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-white px-2 py-1 rounded-lg border border-emerald-200">
                    {selectedLeave.is_half_day ? 'Half Day Shift' : 'Full Day Absence'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-500 pt-1 text-[11px]">
                  <span>Statutory Wage Policy:</span>
                  <span className="font-bold text-slate-700">
                    {selectedLeave.leave_type_is_paid !== false ? 'Paid Leave (Protected)' : 'Unpaid Leave (LOP)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Leave Accrual & Balance Snapshot */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center border-b border-slate-100 pb-3">
                <ShieldCheck className="w-4 h-4 mr-1.5 text-indigo-600" />
                Employee Entitlement Balance
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-center">
                  <span className="text-[10px] text-slate-400 block font-bold">Yearly Quota</span>
                  <span className="text-base font-black text-slate-800 font-mono">
                    {leaveBalance ? leaveBalance.total_allocated : 12} d
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-center">
                  <span className="text-[10px] text-slate-400 block font-bold">Availed So Far</span>
                  <span className="text-base font-black text-slate-800 font-mono">
                    {leaveBalance ? leaveBalance.used : 2} d
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/70 text-center">
                  <span className="text-[10px] text-amber-700 block font-bold">Pending Review</span>
                  <span className="text-base font-black text-amber-900 font-mono">
                    {selectedLeave.status === 'pending' ? selectedLeave.total_days : 0} d
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/70 text-center">
                  <span className="text-[10px] text-emerald-700 block font-bold">Net Remaining</span>
                  <span className="text-base font-black text-emerald-900 font-mono">
                    {leaveBalance ? leaveBalance.remaining_days : 10} d
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right/Main Column: Detailed Reason & Decision Console */}
          <div className="lg:col-span-2 space-y-6">
            {/* MAIN USER REQUIREMENT: READ FULL REASON FOR ABSENCE HERE */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">
                      Detailed Reason for Absence & Justification
                    </h2>
                    <p className="text-xs text-slate-500">
                      As submitted by the employee for managerial authorization and statutory HR records.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold">
                  Official Statement
                </span>
              </div>

              {/* The Styled Full-Length Reason Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50/40 via-slate-50/50 to-blue-50/30 border border-indigo-100/90 relative">
                <span className="text-4xl font-serif text-indigo-200 absolute top-2 left-4 select-none">“</span>
                <p className="text-sm font-medium text-slate-800 leading-relaxed pl-6 whitespace-pre-wrap">
                  {selectedLeave.reason || 'No specific reason provided by the applicant.'}
                </p>
                <div className="mt-4 pt-4 border-t border-indigo-100/60 flex items-center justify-between text-xs text-slate-400 pl-6">
                  <span>Application Timestamp: {new Date(selectedLeave.created_at).toLocaleString()}</span>
                  <span className="font-medium text-slate-600">Self-Certified by Employee</span>
                </div>
              </div>

              {/* Supporting Note */}
              <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200/80 text-blue-900 text-xs flex items-start space-x-2.5">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  In accordance with Odias ERP statutory leave policy, this absence request has undergone automated balance verification. Upon approval, attendance rosters and monthly payroll deductions will be adjusted in real-time.
                </p>
              </div>
            </div>

            {/* Approver Authorization & Audit Log */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center border-b border-slate-100 pb-3">
                <ShieldCheck className="w-4 h-4 mr-2 text-emerald-600" />
                Managerial Authorization & Decision Console
              </h3>

              {selectedLeave.status === 'pending' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Approver Remarks / Instructions / Conditional Notes (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={approverNotes}
                      onChange={(e) => setApproverNotes(e.target.value)}
                      placeholder="e.g. Approved. Please ensure hand-over of active sprint deliverables to team lead before leave starts."
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div className="flex items-center space-x-3 pt-2">
                    <button
                      disabled={actionLoading}
                      onClick={() => handleStatusUpdate(selectedLeave.id, 'approved', approverNotes)}
                      className="flex-1 inline-flex items-center justify-center py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Authorize & Approve Application
                    </button>
                    <button
                      disabled={actionLoading}
                      onClick={() => handleStatusUpdate(selectedLeave.id, 'rejected', approverNotes)}
                      className="inline-flex items-center justify-center py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-all cursor-pointer"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject Application
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold">Decision Status</span>
                    <StatusBadge status={selectedLeave.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold">Authorized / Reviewed By</span>
                    <span className="font-bold text-slate-800">
                      {selectedLeave.approved_by_name || 'Approving Authority'}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-400 font-bold block mb-1">Approver Comments:</span>
                    <p className="text-slate-700 italic bg-white p-2.5 rounded-lg border border-slate-200/80">
                      {selectedLeave.approver_comments || 'No remarks provided during authorization.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // DEFAULT MASTER LIST VIEW
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
            <FileText className="w-7 h-7 text-emerald-600 mr-2.5" />
            Leave Management & Multi-Level Approvals
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Apply for statutory leaves, track accrual balances, and review team approval queues. Click 'View' to read full reasons and details.
          </p>
        </div>

        <button
          onClick={() => setApplyModalOpen(true)}
          className="inline-flex items-center px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 shadow-sm shadow-emerald-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Apply for Leave
        </button>
      </div>

      {/* Success Notification Alert */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mr-2" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-xs underline text-emerald-700 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Leave Balances Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(balances.length > 0 ? balances : [
          { id: '1', leave_type_name: 'Casual Leave', leave_type_code: 'CL', color: '#3B82F6', remaining_days: 10, total_allocated: 12 },
          { id: '2', leave_type_name: 'Sick Leave', leave_type_code: 'SL', color: '#10B981', remaining_days: 9, total_allocated: 10 },
          { id: '3', leave_type_name: 'Earned Leave', leave_type_code: 'EL', color: '#8B5CF6', remaining_days: 14, total_allocated: 18 },
          { id: '4', leave_type_name: 'Unpaid Leave (LOP)', leave_type_code: 'LOP', color: '#EF4444', remaining_days: 0, total_allocated: 0 },
        ]).map((b: any) => (
          <div key={b.id} className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 truncate">{b.leave_type_name}</span>
              <span
                className="w-6 h-6 rounded-lg text-white font-bold text-[10px] flex items-center justify-center shrink-0"
                style={{ backgroundColor: b.color || '#10b981' }}
              >
                {b.leave_type_code}
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 font-mono">{b.remaining_days} days</div>
              <span className="text-[11px] text-slate-400">Available of {b.total_allocated} allocated</span>
            </div>
          </div>
        ))}
      </div>

      {/* Universal DataTable without Reason column, but with dedicated View action */}
      <DataTable
        data={leaves}
        columns={columns}
        searchPlaceholder="Search leave applications by employee or classification..."
        initialPageSize={10}
        pageSizeOptions={[10, 25, 50, 100]}
      />

      {/* Apply Leave Modal */}
      <Modal isOpen={applyModalOpen} onClose={() => setApplyModalOpen(false)} title="Apply for Statutory Leave">
        <form onSubmit={handleApply} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Leave Classification</label>
            <select
              value={formData.leave_type}
              onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
            >
              {balances.map((b) => (
                <option key={b.leave_type} value={b.leave_type}>
                  {b.leave_type_name} ({b.remaining_days} days remaining)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                required
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Absence</label>
            <textarea
              rows={3}
              required
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Provide complete reason and justification..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setApplyModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm cursor-pointer"
            >
              Submit Application
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
