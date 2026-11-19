import React, { useState, useEffect } from 'react';
import {
  CalendarDays, Table, Plus, Edit2, Trash2, Eye,
  Calendar as CalendarIcon, Filter, Check, X, AlertTriangle, ChevronLeft, ChevronRight
} from 'lucide-react';
import { api } from '../../api/client';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable, type ColumnDef } from '../../components/common/DataTable';
import type { Holiday } from '../../types';

export const HolidaysPage: React.FC = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('table');
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(2026, 10, 1)); // Nov 2026

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    holiday_type: 'public' as 'public' | 'company' | 'optional',
    description: '',
    is_paid: true,
  });

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const data = await api.getHolidays();
      setHolidays(data.results || data || []);
    } catch (err) {
      console.error('Failed to fetch holidays:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      date: new Date().toISOString().split('T')[0],
      holiday_type: 'public',
      description: '',
      is_paid: true,
    });
    setAddModalOpen(true);
  };

  const handleOpenEdit = (h: Holiday) => {
    setSelectedHoliday(h);
    setFormData({
      name: h.name,
      date: h.date,
      holiday_type: h.holiday_type,
      description: h.description,
      is_paid: h.is_paid,
    });
    setEditModalOpen(true);
  };

  const handleOpenDelete = (h: Holiday) => {
    setSelectedHoliday(h);
    setDeleteConfirmOpen(true);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createHoliday(formData);
      setAddModalOpen(false);
      fetchHolidays();
    } catch (err: any) {
      alert(err.message || 'Failed to add holiday');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHoliday) return;
    try {
      await api.updateHoliday(selectedHoliday.id, formData);
      setEditModalOpen(false);
      fetchHolidays();
    } catch (err: any) {
      alert(err.message || 'Failed to update holiday');
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedHoliday) return;
    try {
      await api.deleteHoliday(selectedHoliday.id);
      setDeleteConfirmOpen(false);
      fetchHolidays();
    } catch (err: any) {
      alert(err.message || 'Failed to archive holiday');
    }
  };

  // Calendar generation helpers
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`pad-${i}`} className="h-28 bg-slate-50/50 border border-slate-100 rounded-xl" />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const holidayOnDay = holidays.find((h) => h.date === dateStr);
      const isSunday = new Date(year, month, d).getDay() === 0;

      days.push(
        <div
          key={dateStr}
          className={`h-28 p-2 border rounded-xl flex flex-col justify-between transition-all ${
            holidayOnDay
              ? 'bg-emerald-50/60 border-emerald-300 shadow-2xs'
              : isSunday
              ? 'bg-slate-50 border-slate-200'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-bold ${
                holidayOnDay ? 'text-emerald-700 font-extrabold' : isSunday ? 'text-rose-500' : 'text-slate-700'
              }`}
            >
              {d}
            </span>
            {isSunday && <span className="text-[10px] text-slate-400 font-medium">Weekly Off</span>}
          </div>

          {holidayOnDay && (
            <div
              onClick={() => {
                setSelectedHoliday(holidayOnDay);
                setViewModalOpen(true);
              }}
              className="mt-1 p-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-semibold truncate cursor-pointer hover:bg-emerald-700 shadow-2xs"
            >
              {holidayOnDay.name}
            </div>
          )}

          <div className="text-[10px] text-slate-400">
            {holidayOnDay?.holiday_type ? `${holidayOnDay.holiday_type} holiday` : ''}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Month selector */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-base font-extrabold text-slate-900">
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center space-x-4 text-xs font-medium">
            <span className="flex items-center">
              <span className="w-3 h-3 rounded-md bg-emerald-500 mr-1.5" /> Company / Public Holiday
            </span>
            <span className="flex items-center">
              <span className="w-3 h-3 rounded-md bg-slate-200 mr-1.5" /> Weekly Off (Sunday)
            </span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center font-bold text-xs text-slate-400 uppercase py-1">
              {day}
            </div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  const columns: ColumnDef<Holiday>[] = [
    {
      key: 'name',
      header: 'Holiday Name',
      accessor: (row) => row.name,
      render: (row) => <span className="font-bold text-slate-900">{row.name}</span>,
    },
    {
      key: 'date',
      header: 'Date',
      accessor: (row) => row.date,
      render: (row) => <span className="font-mono font-semibold text-slate-700">{row.date}</span>,
    },
    {
      key: 'day',
      header: 'Day',
      accessor: (row) => new Date(row.date).toLocaleDateString('en-IN', { weekday: 'long' }),
      render: (row) => (
        <span className="text-slate-600">
          {new Date(row.date).toLocaleDateString('en-IN', { weekday: 'long' })}
        </span>
      ),
    },
    {
      key: 'holiday_type',
      header: 'Holiday Classification',
      accessor: (row) => row.holiday_type,
      render: (row) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            row.holiday_type === 'public'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'bg-purple-50 text-purple-700 border border-purple-200'
          }`}
        >
          {row.holiday_type}
        </span>
      ),
    },
    {
      key: 'branch_name',
      header: 'Applicable Branch',
      accessor: (row) => row.branch_name || 'All Branches',
      render: (row) => (
        <span className="text-slate-600 font-medium">
          {row.branch_name || 'All Branches (Organization-wide)'}
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      accessor: (row) => row.description,
      render: (row) => <span className="text-slate-500 max-w-xs truncate block">{row.description}</span>,
    },
    {
      key: 'is_paid',
      header: 'Pay Treatment',
      accessor: (row) => row.is_paid,
      render: () => (
        <span className="inline-flex items-center text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md text-xs">
          Paid Holiday
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end space-x-1">
          <button
            onClick={() => {
              setSelectedHoliday(row);
              setViewModalOpen(true);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 cursor-pointer"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenDelete(row)}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
            title="Archive / Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
            <CalendarDays className="w-7 h-7 text-emerald-600 mr-2.5" />
            Holiday & Weekly-Off Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure organization-wide paid holidays, branch schedules, and observe weekly offs.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Dual View Toggle */}
          <div className="flex items-center bg-slate-200/80 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5 mr-1.5" />
              Table View
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center ${
                viewMode === 'calendar' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
              Calendar View
            </button>
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 shadow-sm shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Holiday
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'calendar' ? (
        renderCalendar()
      ) : (
        <DataTable
          data={holidays}
          columns={columns}
          searchPlaceholder="Search holidays by name, description..."
          initialPageSize={10}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      )}

      {/* Add Holiday Modal */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Add Company Holiday">
        <form onSubmit={handleSaveAdd} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Holiday Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Independence Day"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Type</label>
              <select
                value={formData.holiday_type}
                onChange={(e) => setFormData({ ...formData, holiday_type: e.target.value as any })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="public">Public Holiday</option>
                <option value="company">Company Holiday</option>
                <option value="optional">Optional / Restricted</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description / Notes</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Commemoration details, applicable guidelines..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="is_paid"
              checked={formData.is_paid}
              onChange={(e) => setFormData({ ...formData, is_paid: e.target.checked })}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="is_paid" className="text-xs font-semibold text-slate-700">
              Paid Holiday (Never deducted from payable salary in payroll)
            </label>
          </div>

          <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm cursor-pointer"
            >
              Save Holiday
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Holiday Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Holiday">
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Holiday Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Type</label>
              <select
                value={formData.holiday_type}
                onChange={(e) => setFormData({ ...formData, holiday_type: e.target.value as any })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="public">Public Holiday</option>
                <option value="company">Company Holiday</option>
                <option value="optional">Optional / Restricted</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete / Archive Confirmation Dialog */}
      <Modal isOpen={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} title="Archive Holiday">
        <div className="space-y-4">
          <div className="flex items-center text-amber-600 space-x-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-xs font-bold">Are you sure you want to archive this holiday?</p>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Holiday: <strong>{selectedHoliday?.name}</strong> on <strong>{selectedHoliday?.date}</strong>.
            This action will soft-archive the record and preserve historical payroll calculations.
          </p>
          <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
            <button
              onClick={() => setDeleteConfirmOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-500 shadow-sm cursor-pointer"
            >
              Confirm Archive
            </button>
          </div>
        </div>
      </Modal>

      {/* View Holiday Details Modal */}
      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} title={selectedHoliday?.name || 'Holiday'}>
        {selectedHoliday && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-slate-400 font-semibold block">Date</span>
                <span className="font-bold text-slate-900">{selectedHoliday.date}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Classification</span>
                <span className="font-bold text-slate-900 capitalize">{selectedHoliday.holiday_type}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Scope</span>
                <span className="font-bold text-slate-900">{selectedHoliday.branch_name || 'All Branches'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Pay Policy</span>
                <span className="font-bold text-emerald-700">Paid Public Holiday</span>
              </div>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block mb-1">Details & Historical Significance</span>
              <p className="text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
                {selectedHoliday.description || 'No additional notes provided.'}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
