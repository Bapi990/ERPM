import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const s = (status || '').toLowerCase().replace(/_/g, ' ');

  const getStyle = () => {
    switch (s) {
      // HRMS Attendance
      case 'present':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'late':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'absent':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'half day':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'work from home':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'on leave':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'holiday':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'weekly off':
        return 'bg-slate-100 text-slate-700 border-slate-200';

      // General / Approval
      case 'approved':
      case 'won':
      case 'paid':
      case 'finalized':
      case 'released':
      case 'active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';

      case 'pending':
      case 'under review':
      case 'review':
      case 'draft':
      case 'contacted':
      case 'proposal':
      case 'sent':
      case 'partially paid':
        return 'bg-amber-50 text-amber-700 border-amber-200';

      case 'rejected':
      case 'lost':
      case 'overdue':
      case 'cancelled':
      case 'suspended':
        return 'bg-rose-50 text-rose-700 border-rose-200';

      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${getStyle()} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70"></span>
      {s}
    </span>
  );
};
