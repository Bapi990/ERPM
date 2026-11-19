import React, { useState, useEffect } from 'react';
import {
  Clock, Plus, Users, Calendar, ShieldCheck, Sun, Moon,
  CheckCircle2, AlertCircle, Edit, Trash2, Eye, Filter, RefreshCw
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { TimeInputPicker } from '../../components/common/TimeInputPicker';
import { formatTime } from '../../utils/timeFormat';
import type { Shift, Employee } from '../../types';

export const ShiftsPage: React.FC = () => {
  const { user } = useAuth();
  const { emitEvent, subscribe } = useRealtime();

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'shifts' | 'roster'>('shifts');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [createShiftModal, setCreateShiftModal] = useState(false);
  const [assignRosterModal, setAssignRosterModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  // Shift Form
  const [shiftForm, setShiftForm] = useState({
    name: '',
    code: '',
    start_time: '09:00',
    end_time: '18:00',
    grace_period_minutes: 15,
    break_duration_minutes: 60,
    full_day_hours: 8.0,
    half_day_hours: 4.5,
  });

  // Roster Form
  const [rosterForm, setRosterForm] = useState({
    employee_id: '',
    shift_id: '',
    weekly_off: 'Sunday',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [shiftsRes, empsRes] = await Promise.all([
        api.getShifts(),
        api.getEmployees(),
      ]);
      setShifts(shiftsRes?.data?.results || shiftsRes?.data || []);
      setEmployees(empsRes?.data?.results || empsRes?.data || []);
    } catch (err) {
      console.error('Failed to load shift and roster data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = subscribe('shift_*', () => {
      loadData();
    });
    return () => unsub();
  }, []);

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createShift({
        ...shiftForm,
        grace_period_minutes: Number(shiftForm.grace_period_minutes),
        break_duration_minutes: Number(shiftForm.break_duration_minutes),
        full_day_hours: Number(shiftForm.full_day_hours),
        half_day_hours: Number(shiftForm.half_day_hours),
        is_active: true,
      });
      emitEvent('shift_created', 'Shift Timing Created', `Shift "${shiftForm.name}" created successfully`, 'success');
      showToast(`Shift "${shiftForm.name}" created successfully!`);
      setCreateShiftModal(false);
      setShiftForm({
        name: '',
        code: '',
        start_time: '09:00',
        end_time: '18:00',
        grace_period_minutes: 15,
        break_duration_minutes: 60,
        full_day_hours: 8.0,
        half_day_hours: 4.5,
      });
      loadData();
    } catch (err: any) {
      console.error(err);
      showToast(err?.response?.data?.detail || 'Failed to create shift');
    }
  };

  const handleAssignRoster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rosterForm.employee_id || !rosterForm.shift_id) {
      showToast('Please select both employee and shift');
      return;
    }
    try {
      await api.updateEmployee(rosterForm.employee_id, {
        work_shift: rosterForm.shift_id,
        weekly_off: rosterForm.weekly_off,
      });
      emitEvent('shift_assigned', 'Shift Roster Updated', 'Employee shift and weekly off roster assigned', 'success');
      showToast('Shift & weekly off roster updated successfully!');
      setAssignRosterModal(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      showToast('Failed to update employee roster');
    }
  };

  // Stats calculation
  const totalShifts = shifts.length;
  const activeEmployees = employees.length;
  const nightShiftsCount = shifts.filter(s => s.name.toLowerCase().includes('night') || s.code.toLowerCase().includes('ngt')).length;
  const avgShiftHours = shifts.length > 0 
    ? (shifts.reduce((acc, s) => acc + Number(s.full_day_hours || 8), 0) / shifts.length).toFixed(1)
    : '8.0';

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
          <h1 className="text-2xl font-bold text-gray-900">Shift & Roster Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure work timings, rotational rosters, grace periods, and weekly off allocations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAssignRosterModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-semibold transition-all shadow-sm"
          >
            <Users size={16} className="text-primary-600" />
            Assign Roster
          </button>
          <button
            onClick={() => setCreateShiftModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 text-sm font-semibold transition-all shadow-md shadow-primary-500/20"
          >
            <Plus size={16} />
            Create Shift Timing
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Shifts</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalShifts}</p>
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
              <CheckCircle2 size={12} /> Standard & Rotational
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Clock size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Rostered Staff</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{activeEmployees}</p>
            <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
              <Users size={12} /> Live across all shifts
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Night Shift Coverage</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{nightShiftsCount} Active</p>
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <Moon size={12} /> 24x7 Operations
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Moon size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Avg Shift Length</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{avgShiftHours} hrs</p>
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
              <ShieldCheck size={12} /> Compliant with labor laws
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Sun size={24} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('shifts')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'shifts'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Shift Master Catalog ({shifts.length})
        </button>
        <button
          onClick={() => setActiveTab('roster')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'roster'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Employee Shift & Weekly Off Allocations ({employees.length})
        </button>
      </div>

      {/* Shift Catalog Tab */}
      {activeTab === 'shifts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shifts.map((shift) => {
            const isNight = shift.name.toLowerCase().includes('night') || shift.code.toLowerCase().includes('ngt');
            return (
              <div
                key={shift.id}
                className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-primary-50 text-primary-700 uppercase tracking-wide">
                      {shift.code}
                    </span>
                    <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold ${
                      shift.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {shift.is_active ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                      {shift.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    {isNight ? (
                      <Moon className="text-amber-500" size={20} />
                    ) : (
                      <Sun className="text-primary-500" size={20} />
                    )}
                    <h3 className="text-lg font-bold text-gray-900">{shift.name}</h3>
                  </div>

                  {/* Timing Box */}
                  <div className="bg-gray-50 rounded-xl p-3 mb-4 flex items-center justify-between text-sm">
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Work Window</p>
                      <p className="font-bold text-gray-800 text-base">{formatTime(shift.start_time)} - {formatTime(shift.end_time)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 font-medium">Full Day Req.</p>
                      <p className="font-bold text-primary-600 text-base">{shift.full_day_hours} hrs</p>
                    </div>
                  </div>

                  {/* Policy Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-4">
                    <div className="bg-gray-50/70 p-2 rounded-lg">
                      <span className="text-gray-400 block">Grace Period:</span>
                      <span className="font-bold text-gray-700">{shift.grace_period_minutes} mins</span>
                    </div>
                    <div className="bg-gray-50/70 p-2 rounded-lg">
                      <span className="text-gray-400 block">Break Duration:</span>
                      <span className="font-bold text-gray-700">{shift.break_duration_minutes} mins</span>
                    </div>
                    <div className="bg-gray-50/70 p-2 rounded-lg">
                      <span className="text-gray-400 block">Half-Day Threshold:</span>
                      <span className="font-bold text-gray-700">{shift.half_day_hours} hrs</span>
                    </div>
                    <div className="bg-gray-50/70 p-2 rounded-lg">
                      <span className="text-gray-400 block">Shift Type:</span>
                      <span className="font-bold text-gray-700">{isNight ? 'Rotational Night' : 'Standard Day'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    Assigned: {employees.filter(e => (e as any).work_shift === shift.id || (e as any).shift_details?.id === shift.id).length} Employees
                  </span>
                  <button
                    onClick={() => {
                      setSelectedShift(shift);
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 px-3 py-1.5 bg-primary-50 rounded-lg transition-all"
                  >
                    <Eye size={14} />
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Roster Tab */}
      {activeTab === 'roster' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm">Staff Shift & Weekly Off Registry</h3>
            <span className="text-xs text-gray-400">Total {employees.length} Active Records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50/80 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Assigned Shift</th>
                  <th className="py-3 px-4">Shift Timings</th>
                  <th className="py-3 px-4">Weekly Off</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employees.map((emp) => {
                  const assignedShift = shifts.find(s => s.id === (emp as any).work_shift) || shifts[0];
                  return (
                    <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                            {emp.first_name?.[0] || 'E'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{emp.first_name} {emp.last_name}</p>
                            <p className="text-xs text-gray-400 font-mono">{emp.employee_id || emp.id.substring(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-gray-700">
                        {emp.department_name || 'General'}
                      </td>
                      <td className="py-3.5 px-4 text-gray-700">
                        {emp.designation_title || 'Staff'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                          {assignedShift?.name || 'General Day Shift'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 text-xs font-mono">
                        {formatTime(assignedShift?.start_time || '09:00')} - {formatTime(assignedShift?.end_time || '18:00')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700">
                          {(emp as any).weekly_off || 'Sunday'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setRosterForm({
                              employee_id: emp.id,
                              shift_id: assignedShift?.id || (shifts[0]?.id || ''),
                              weekly_off: (emp as any).weekly_off || 'Sunday',
                            });
                            setAssignRosterModal(true);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-all"
                        >
                          Modify Roster
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Create Shift Timing */}
      <Modal
        isOpen={createShiftModal}
        onClose={() => setCreateShiftModal(false)}
        title="Create New Shift Timing"
      >
        <form onSubmit={handleCreateShift} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Shift Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Morning General Shift"
                value={shiftForm.name}
                onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Shift Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. MGS-01"
                value={shiftForm.code}
                onChange={(e) => setShiftForm({ ...shiftForm, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm uppercase focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TimeInputPicker
              label="Start Time *"
              value={shiftForm.start_time}
              onChange={(val) => setShiftForm({ ...shiftForm, start_time: val })}
            />
            <TimeInputPicker
              label="End Time *"
              value={shiftForm.end_time}
              onChange={(val) => setShiftForm({ ...shiftForm, end_time: val })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Grace Period (Minutes)</label>
              <input
                type="number"
                min="0"
                max="60"
                value={shiftForm.grace_period_minutes}
                onChange={(e) => setShiftForm({ ...shiftForm, grace_period_minutes: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Break Duration (Minutes)</label>
              <input
                type="number"
                min="0"
                max="120"
                value={shiftForm.break_duration_minutes}
                onChange={(e) => setShiftForm({ ...shiftForm, break_duration_minutes: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Full Day Required (Hours)</label>
              <input
                type="number"
                step="0.5"
                min="4"
                max="12"
                value={shiftForm.full_day_hours}
                onChange={(e) => setShiftForm({ ...shiftForm, full_day_hours: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Half Day Threshold (Hours)</label>
              <input
                type="number"
                step="0.5"
                min="2"
                max="8"
                value={shiftForm.half_day_hours}
                onChange={(e) => setShiftForm({ ...shiftForm, half_day_hours: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setCreateShiftModal(false)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-primary-500/20"
            >
              Save Shift
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Assign Roster */}
      <Modal
        isOpen={assignRosterModal}
        onClose={() => setAssignRosterModal(false)}
        title="Assign Shift & Weekly Off Roster"
      >
        <form onSubmit={handleAssignRoster} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Select Employee *</label>
            <select
              required
              value={rosterForm.employee_id}
              onChange={(e) => setRosterForm({ ...rosterForm, employee_id: e.target.value })}
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

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Select Shift *</label>
            <select
              required
              value={rosterForm.shift_id}
              onChange={(e) => setRosterForm({ ...rosterForm, shift_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">-- Choose Shift Timing --</option>
              {shifts.map(shift => (
                <option key={shift.id} value={shift.id}>
                  {shift.name} ({formatTime(shift.start_time)} - {formatTime(shift.end_time)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Designated Weekly Off *</label>
            <select
              required
              value={rosterForm.weekly_off}
              onChange={(e) => setRosterForm({ ...rosterForm, weekly_off: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="Sunday">Sunday</option>
              <option value="Saturday">Saturday</option>
              <option value="Saturday + Sunday">Saturday + Sunday (5-Day Week)</option>
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
            </select>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setAssignRosterModal(false)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-primary-500/20"
            >
              Apply Roster
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Shift Details */}
      {selectedShift && (
        <Modal
          isOpen={!!selectedShift}
          onClose={() => setSelectedShift(null)}
          title={`Shift Specification: ${selectedShift.name}`}
        >
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase">Shift Code</p>
                <p className="text-xl font-bold text-gray-900">{selectedShift.code}</p>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                {selectedShift.is_active ? 'Active Shift' : 'Inactive'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 border border-gray-100 rounded-xl">
                <span className="text-xs text-gray-400 block">Start Time</span>
                <span className="font-bold text-gray-800">{formatTime(selectedShift.start_time)}</span>
              </div>
              <div className="p-3 border border-gray-100 rounded-xl">
                <span className="text-xs text-gray-400 block">End Time</span>
                <span className="font-bold text-gray-800">{formatTime(selectedShift.end_time)}</span>
              </div>
              <div className="p-3 border border-gray-100 rounded-xl">
                <span className="text-xs text-gray-400 block">Grace Period</span>
                <span className="font-bold text-gray-800">{selectedShift.grace_period_minutes} minutes</span>
              </div>
              <div className="p-3 border border-gray-100 rounded-xl">
                <span className="text-xs text-gray-400 block">Break Duration</span>
                <span className="font-bold text-gray-800">{selectedShift.break_duration_minutes} minutes</span>
              </div>
              <div className="p-3 border border-gray-100 rounded-xl">
                <span className="text-xs text-gray-400 block">Full Day Requirement</span>
                <span className="font-bold text-primary-600">{selectedShift.full_day_hours} Hours</span>
              </div>
              <div className="p-3 border border-gray-100 rounded-xl">
                <span className="text-xs text-gray-400 block">Half Day Requirement</span>
                <span className="font-bold text-gray-800">{selectedShift.half_day_hours} Hours</span>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setSelectedShift(null)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
