import React, { useState, useEffect, useMemo } from 'react';
import { DollarSign, Plus, Search, Filter, Calendar, CreditCard } from 'lucide-react';
import { api } from '../../api/client';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable, ColumnDef } from '../../components/common/DataTable';
import { useRealtime } from '../../context/RealtimeContext';
import type { Expense } from '../../types';

export const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const { emitEvent } = useRealtime();

  const [formData, setFormData] = useState({
    title: '',
    category: 'cloud_software',
    amount: 25000,
    expense_date: new Date().toISOString().split('T')[0],
    vendor: 'AWS Cloud Services',
    payment_mode: 'Corporate Card',
    notes: '',
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const data = await api.getExpenses();
      setExpenses(data.results || data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createExpense(formData);
      setAddModalOpen(false);
      emitEvent('billing.expense_logged', 'Expense Logged', `Logged expense: ${formData.title} (₹${formData.amount})`, 'info');
      fetchExpenses();
    } catch (err: any) {
      alert(err.message || 'Failed to record expense');
    }
  };

  const filteredExpenses = useMemo(() => {
    if (categoryFilter === 'all') return expenses;
    return expenses.filter((e) => e.category === categoryFilter);
  }, [expenses, categoryFilter]);

  const columns: ColumnDef<Expense>[] = [
    {
      key: 'title',
      header: 'Expense Title',
      render: (exp) => <span className="font-bold text-slate-900">{exp.title}</span>,
    },
    {
      key: 'category',
      header: 'Category',
      render: (exp) => (
        <span className="capitalize text-slate-600 font-medium">
          {exp.category?.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'vendor',
      header: 'Vendor',
      render: (exp) => <span className="text-slate-700">{exp.vendor || '--'}</span>,
    },
    {
      key: 'expense_date',
      header: 'Date',
      render: (exp) => <span className="font-mono text-slate-600">{exp.expense_date}</span>,
    },
    {
      key: 'payment_mode',
      header: 'Payment Mode',
      render: (exp) => <span className="text-slate-600">{exp.payment_mode}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      accessor: (exp) => Number(exp.amount),
      render: (exp) => (
        <span className="font-mono font-extrabold text-slate-900">
          ₹{Number(exp.amount).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (exp) => <StatusBadge status={exp.status} />,
    },
  ];

  const totalExpense = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
            <DollarSign className="w-7 h-7 text-emerald-600 mr-2.5" />
            Company Expense Tracking & OPEX
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Categorized operational expenses, cloud infrastructure, facility rent, and team reimbursements.
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="inline-flex items-center px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 shadow-sm shadow-emerald-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Log Expense
        </button>
      </div>

      {/* KPI banner */}
      <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-xs">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Recorded Expenses</span>
          <span className="text-xl font-black font-mono text-emerald-400">
            ₹{totalExpense.toLocaleString('en-IN')}
          </span>
        </div>
        <span className="text-xs text-slate-400">{expenses.length} Approved Entries</span>
      </div>

      {/* Expenses DataTable */}
      <DataTable<Expense>
        data={filteredExpenses}
        columns={columns}
        searchPlaceholder="Search expenses by title, vendor, category..."
        filterComponent={
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="cloud_software">Cloud & SaaS</option>
              <option value="office_rent">Office Lease</option>
              <option value="utilities">Utilities</option>
              <option value="travel">Travel</option>
              <option value="marketing">Marketing</option>
              <option value="supplies">Supplies</option>
            </select>
          </div>
        }
      />

      {/* Add Expense Modal */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Log Business Expense">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Expense Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Bandra Office Lease & Maintenance"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              >
                <option value="cloud_software">Cloud & Software SaaS</option>
                <option value="office_rent">Office Rent & Facilities</option>
                <option value="utilities">Internet & Electricity</option>
                <option value="travel">Employee Travel</option>
                <option value="marketing">Marketing & Sales</option>
                <option value="supplies">Office Supplies</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Amount (₹)</label>
              <input
                type="number"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Vendor / Payee</label>
              <input
                type="text"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                placeholder="e.g. Tata Teleservices"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Expense Date</label>
              <input
                type="date"
                required
                value={formData.expense_date}
                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm"
            >
              Record Expense
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
