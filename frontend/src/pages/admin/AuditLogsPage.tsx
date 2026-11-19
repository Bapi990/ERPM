import React, { useState, useEffect, useMemo } from 'react';
import { History, Shield, Search, Filter, Lock, Terminal } from 'lucide-react';
import { api } from '../../api/client';
import { DataTable, ColumnDef } from '../../components/common/DataTable';
import type { AuditLog } from '../../types';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [moduleFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs(moduleFilter ? `module=${moduleFilter}` : '');
      setLogs(data.results || data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnDef<AuditLog>[] = [
    {
      key: 'created_at',
      header: 'Timestamp (UTC/IST)',
      accessor: (log) => log.created_at,
      render: (log) => (
        <span className="font-mono text-slate-500 whitespace-nowrap text-[11px]">
          {new Date(log.created_at).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'user_name',
      header: 'Operator / User',
      render: (log) => (
        <span className="font-bold text-slate-900 whitespace-nowrap">
          {log.user_name || log.user_email || 'System Daemon'}
        </span>
      ),
    },
    {
      key: 'module',
      header: 'Module',
      render: (log) => (
        <span className="uppercase font-bold text-slate-700 tracking-wider text-[10px] px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
          {log.module}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (log) => (
        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 text-[11px]">
          {log.action}
        </span>
      ),
    },
    {
      key: 'entity_name',
      header: 'Entity',
      render: (log) => <span className="font-semibold text-slate-800">{log.entity_name}</span>,
    },
    {
      key: 'description',
      header: 'Audit Description',
      render: (log) => <span className="text-slate-600 max-w-md block truncate">{log.description}</span>,
    },
    {
      key: 'ip_address',
      header: 'Client IP',
      align: 'right',
      render: (log) => (
        <span className="font-mono text-slate-400 whitespace-nowrap text-[11px]">
          {log.ip_address || '127.0.0.1'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
            <History className="w-7 h-7 text-emerald-600 mr-2.5" />
            Security & Compliance Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable, tamper-resistant access and transaction audit trail recorded for legal governance.
          </p>
        </div>
      </div>

      {/* Audit Log DataTable */}
      <DataTable<AuditLog>
        data={logs}
        columns={columns}
        searchPlaceholder="Search audit trails by operator, entity, description..."
        filterComponent={
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-semibold text-slate-700 cursor-pointer"
            >
              <option value="">All Audit Modules</option>
              <option value="auth">Authentication & Sessions</option>
              <option value="hrms">HRMS & Attendance</option>
              <option value="payroll">Payroll Runs</option>
              <option value="crm">CRM & Leads</option>
              <option value="billing">Invoices & Payments</option>
            </select>
          </div>
        }
      />
    </div>
  );
};
