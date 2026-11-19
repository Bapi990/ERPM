import React, { useState } from 'react';
import {
  Activity, CheckCircle2, Clock, Check, X, AlertCircle,
  FileText, DollarSign, Calendar, TrendingUp, Bell, Filter
} from 'lucide-react';
import { DataTable, ColumnDef } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useRealtime } from '../../context/RealtimeContext';

interface PendingApproval {
  id: string;
  type: 'leave' | 'expense' | 'invoice' | 'promotion' | 'overtime';
  title: string;
  requester: string;
  department: string;
  amount_or_duration: string;
  submitted_at: string;
  status: 'pending' | 'approved' | 'rejected';
}

export const ActivityPage: React.FC = () => {
  const { emitEvent } = useRealtime();
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const [approvals, setApprovals] = useState<PendingApproval[]>([
    {
      id: 'appr-01',
      type: 'leave',
      title: 'Privilege Leave (Medical emergency)',
      requester: 'Rohan Mehta',
      department: 'Engineering',
      amount_or_duration: '3 Days (Nov 18 - Nov 20)',
      submitted_at: '2026-11-13 09:15',
      status: 'pending',
    },
    {
      id: 'appr-02',
      type: 'expense',
      title: 'Bandra Client Meeting & Lunch Hosting',
      requester: 'Vikram Malhotra',
      department: 'Sales & BD',
      amount_or_duration: '₹4,850',
      submitted_at: '2026-11-12 17:40',
      status: 'pending',
    },
    {
      id: 'appr-03',
      type: 'invoice',
      title: 'Tax Invoice INV-2026-004 Commercial Sign-off',
      requester: 'Pooja Desai',
      department: 'Finance',
      amount_or_duration: '₹4,13,000',
      submitted_at: '2026-11-13 10:20',
      status: 'pending',
    },
    {
      id: 'appr-04',
      type: 'promotion',
      title: 'Associate Promotion to Team Manager Recommendation',
      requester: 'Ananya Sharma',
      department: 'People Operations',
      amount_or_duration: 'Level Elevation',
      submitted_at: '2026-11-13 11:00',
      status: 'pending',
    },
  ]);

  const handleAction = (id: string, action: 'approved' | 'rejected') => {
    setApprovals((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          emitEvent(
            action === 'approved' ? 'approval.confirmed' : 'approval.rejected',
            `Item ${action === 'approved' ? 'Approved' : 'Rejected'}`,
            `"${a.title}" for ${a.requester} has been marked ${action}.`,
            action === 'approved' ? 'success' : 'alert'
          );
          setSuccessToast(`"${a.title}" for ${a.requester} ${action} successfully!`);
          setTimeout(() => setSuccessToast(null), 5000);
          return { ...a, status: action };
        }
        return a;
      })
    );
  };

  const columns: ColumnDef<PendingApproval>[] = [
    {
      key: 'type',
      header: 'Category',
      render: (a) => (
        <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 tracking-wider">
          {a.type}
        </span>
      ),
    },
    {
      key: 'title',
      header: 'Approval Request',
      render: (a) => (
        <div>
          <span className="font-bold text-slate-900 block">{a.title}</span>
          <span className="text-[10px] text-slate-400 font-mono">Submitted: {a.submitted_at}</span>
        </div>
      ),
    },
    {
      key: 'requester',
      header: 'Requester',
      render: (a) => (
        <div>
          <span className="font-bold text-slate-800 block">{a.requester}</span>
          <span className="text-[10px] text-slate-500">{a.department}</span>
        </div>
      ),
    },
    {
      key: 'amount_or_duration',
      header: 'Value / Scope',
      render: (a) => <span className="font-mono font-bold text-emerald-700">{a.amount_or_duration}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (a) => <StatusBadge status={a.status} />,
    },
    {
      key: 'actions',
      header: 'Decision',
      align: 'right',
      render: (a) => (
        <div className="flex items-center justify-end space-x-1.5">
          {a.status === 'pending' ? (
            <>
              <button
                onClick={() => handleAction(a.id, 'approved')}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 shadow-2xs flex items-center space-x-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Approve</span>
              </button>
              <button
                onClick={() => handleAction(a.id, 'rejected')}
                className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-bold text-xs hover:bg-rose-100 border border-rose-200 flex items-center space-x-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
            </>
          ) : (
            <span className="text-xs font-bold capitalize text-slate-500">
              {a.status}
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
          <Activity className="w-7 h-7 text-emerald-600 mr-2.5" />
          Executive Approvals Queue & Live Activity Center
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Unified managerial inbox for leave applications, expense reimbursements, invoice dispatch sign-offs, and promotions.
        </p>
      </div>

      {/* Success alert */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-xs text-emerald-700 underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Approvals DataTable */}
      <DataTable<PendingApproval>
        data={approvals}
        columns={columns}
        searchPlaceholder="Search approval queue by requester, title..."
      />
    </div>
  );
};
