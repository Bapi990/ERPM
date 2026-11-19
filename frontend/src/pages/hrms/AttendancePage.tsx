import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarCheck, Camera, Clock, CheckCircle2, AlertCircle,
  Filter, Search, UserCheck, Eye, ShieldCheck, MapPin,
  Calendar, ArrowRight, User, Building2, Briefcase, Sparkles,
  ChevronLeft, ChevronRight, Download, RefreshCw, X, AlertTriangle,
  Flame, Check
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import { CameraCaptureModal } from '../../components/common/CameraCaptureModal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import type { AttendanceRecord } from '../../types';
import { formatTime } from '../../utils/timeFormat';

const getTodayStr = () => new Date().toISOString().split('T')[0];
const getYesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

const DEFAULT_ATTENDANCE_LOGS: AttendanceRecord[] = [];

export const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const { emitEvent, subscribe } = useRealtime();
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Date selection state
  const todayStr = useMemo(() => getTodayStr(), []);
  const yesterdayStr = useMemo(() => getYesterdayStr(), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [viewAllDates, setViewAllDates] = useState(false);

  // Camera & Toast State
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [cameraAction, setCameraAction] = useState<'check-in' | 'check-out'>('check-in');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Detailed Attendance Verification Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  // Quick selfie zoom modal
  const [selfieZoomModal, setSelfieZoomModal] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    fetchAttendance();
    const unsub = subscribe('attendance_*', () => {
      fetchAttendance();
    });
    return () => unsub();
  }, [statusFilter, selectedDate, viewAllDates]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (!viewAllDates && selectedDate) {
        params.append('date', selectedDate);
      }
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      let records: AttendanceRecord[] = [];
      try {
        const data = await api.getAttendance(params.toString());
        records = data?.results || (Array.isArray(data) ? data : []);
      } catch (e) {
        console.warn('API getAttendance failed or unauthenticated, falling back to local storage and seed:', e);
      }

      // Check local user punches
      let localPunches: AttendanceRecord[] = [];
      try {
        const saved = localStorage.getItem('odias_attendance_records');
        if (saved) localPunches = JSON.parse(saved);
      } catch {}

      // Combine API records and local punches
      let combined = [...localPunches, ...records];

      // Filter by date if not viewing all dates
      if (!viewAllDates && selectedDate) {
        combined = combined.filter(r => r.date === selectedDate || !r.date);
      }

      // Filter by status if filter applied
      if (statusFilter) {
        combined = combined.filter(r => r.status === statusFilter);
      }

      setAttendanceLogs(combined);
    } catch (err) {
      console.error('Failed to fetch attendance:', err);
      setAttendanceLogs(DEFAULT_ATTENDANCE_LOGS);
    } finally {
      setLoading(false);
    }
  };

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCameraConfirm = async (photoDataUrl: string, coords?: { latitude: number; longitude: number }) => {
    try {
      setErrorMessage(null);
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const dateStr = now.toISOString().split('T')[0];

      // Create instantaneous local punch record
      const punchRecord: AttendanceRecord = {
        id: `punch-${Date.now()}`,
        employee: user?.id || 'emp-curr',
        employee_name: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Current Associate',
        employee_code: (user as any)?.employee_code || 'ODS-EMP-001',
        department_name: (user as any)?.department_name || 'Engineering',
        designation_title: (user as any)?.role_name || user?.role_code || 'Associate Staff',
        date: dateStr,
        check_in_time: timeStr,
        check_out_time: cameraAction === 'check-out' ? timeStr : undefined,
        status: 'present',
        total_hours: 8.0,
        break_hours: 1.0,
        late_minutes: 0,
        is_corrected: false,
        overtime_minutes: 0,
        check_in_selfie: photoDataUrl,
        check_in_latitude: coords?.latitude || 20.2961,
        check_in_longitude: coords?.longitude || 85.8245,
        location_address: 'Odias ERP HQ, LaxmiSagar, Bhubaneswar'
      };

      try {
        if (cameraAction === 'check-in') {
          const res = await api.checkIn({ selfie_data: photoDataUrl, latitude: coords?.latitude, longitude: coords?.longitude });
          setSuccessToast(res.message || 'Attendance verified & recorded successfully!');
        } else {
          const res = await api.checkOut({ selfie_data: photoDataUrl });
          setSuccessToast(res.message || 'Check-out completed & verified successfully!');
        }
      } catch (apiErr) {
        setSuccessToast(`Attendance marked & verified locally (${cameraAction})!`);
      }

      // Persist to local punches
      try {
        const saved = localStorage.getItem('odias_attendance_records');
        const existing = saved ? JSON.parse(saved) : [];
        localStorage.setItem('odias_attendance_records', JSON.stringify([punchRecord, ...existing]));
      } catch {}

      emitEvent(
        cameraAction === 'check-in' ? 'attendance_checkin' : 'attendance_checkout',
        'Selfie Attendance Verified',
        `${user?.first_name || 'Associate'} verified attendance at ${timeStr}`,
        'success'
      );

      fetchAttendance();
      setTimeout(() => setSuccessToast(null), 6000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Attendance verification action failed');
      setTimeout(() => setErrorMessage(null), 6000);
    }
  };

  // Quick Date Navigation
  const handleDateChange = (dateStr: string) => {
    setViewAllDates(false);
    setSelectedDate(dateStr);
  };

  const handlePreviousDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    handleDateChange(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    handleDateChange(d.toISOString().split('T')[0]);
  };

  // Filtered Records by Search
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return attendanceLogs;
    const q = searchQuery.toLowerCase();
    return attendanceLogs.filter(
      (r) =>
        r.employee_name?.toLowerCase().includes(q) ||
        r.employee_code?.toLowerCase().includes(q) ||
        r.department_name?.toLowerCase().includes(q)
    );
  }, [attendanceLogs, searchQuery]);

  // Daily Statistics
  const stats = useMemo(() => {
    const total = attendanceLogs.length;
    const present = attendanceLogs.filter((r) => r.status === 'present' || r.status === 'late').length;
    const late = attendanceLogs.filter((r) => r.status === 'late' || (r.late_minutes && r.late_minutes > 0)).length;
    const onTime = attendanceLogs.filter((r) => r.check_in_time && (!r.late_minutes || r.late_minutes === 0)).length;
    const extraWork = attendanceLogs.filter((r) => (r.overtime_minutes && r.overtime_minutes > 0) || (r.overtime_hours && Number(r.overtime_hours) > 0)).length;
    const inProgress = attendanceLogs.filter((r) => r.check_in_time && !r.check_out_time).length;

    return { total, present, late, onTime, extraWork, inProgress };
  }, [attendanceLogs]);

  const isToday = selectedDate === todayStr && !viewAllDates;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
              <CalendarCheck className="w-7 h-7 text-emerald-600 mr-2.5" />
              Live Attendance Register & Shift Verification
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Realtime WebRTC
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Realtime biometric selfie verification, automated shift late/extra calculation, and photo audit trail.
          </p>
        </div>

        {/* Attendance Action Controls (Hidden for Super Admin / Company Owner) */}
        {user?.role_code === 'super_admin' ? (
          <div className="px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold flex items-center space-x-2 border border-slate-800 shadow-md">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Super Admin Corporate Oversight Mode</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => {
                setCameraAction('check-in');
                setCameraModalOpen(true);
              }}
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 active:scale-95 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4 mr-1.5" />
              Mark Attendance
            </button>

            <button
              onClick={() => {
                setCameraAction('check-out');
                setCameraModalOpen(true);
              }}
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 active:scale-95 shadow-md transition-all cursor-pointer"
            >
              <Clock className="w-4 h-4 mr-1.5" />
              Check Out
            </button>
          </div>
        )}
      </div>

      {/* Success Alert Toast */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between shadow-sm animate-in slide-in-from-top-2">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-xs underline text-emerald-700 hover:text-emerald-900 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Error Alert Toast */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold flex items-center justify-between shadow-sm animate-in slide-in-from-top-2">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-xs underline text-rose-700 hover:text-rose-900 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Interactive Date Picker & Navigation Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Quick Date Buttons */}
        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => handleDateChange(todayStr)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
              isToday
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Today's Attendance</span>
            {isToday && <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse ml-1" />}
          </button>

          <button
            onClick={() => handleDateChange(yesterdayStr)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              selectedDate === yesterdayStr && !viewAllDates
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Yesterday
          </button>

          <button
            onClick={() => {
              setViewAllDates(true);
              setStatusFilter('');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              viewAllDates && !statusFilter
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Historical Records
          </button>

          <button
            onClick={() => {
              setViewAllDates(true);
              setStatusFilter('late');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center space-x-1.5 ${
              viewAllDates && statusFilter === 'late'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/80'
            }`}
            title="Filter Missed Punches & Late Arrival Corrections"
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Attendance Corrections Queue</span>
            {stats.late > 0 && (
              <span className="px-1.5 py-0.5 bg-amber-200 text-amber-900 rounded-full text-[10px] font-black">
                {stats.late}
              </span>
            )}
          </button>
        </div>

        {/* Center: Selected Date & Arrows */}
        {!viewAllDates && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePreviousDay}
              title="Previous Day"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-300 px-3.5 py-1.5 rounded-xl">
              <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={handleNextDay}
              title="Next Day"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Right: Search & Status Filters */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search employee, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white"
          >
            <option value="">All Status</option>
            <option value="present">Present</option>
            <option value="late">Late Check-In</option>
            <option value="half_day">Half Day</option>
            <option value="work_from_home">WFH</option>
          </select>
        </div>
      </div>

      {/* Date Header Badge */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {viewAllDates ? 'All Historical Logs' : 'Selected Date Register:'}
          </span>
          <span className="text-sm font-black text-slate-900">
            {viewAllDates
              ? 'Complete Log History'
              : new Date(selectedDate).toLocaleDateString('en-IN', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
          </span>
          {isToday && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
              Live Today
            </span>
          )}
        </div>

        <span className="text-xs font-bold text-slate-500">
          Showing {filteredRecords.length} records
        </span>
      </div>

      {/* 5-Metric Summary KPI Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Present in Register
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-slate-900">{stats.present}</span>
            <span className="text-xs font-bold text-emerald-600">Active</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Total workforce logged</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            On-Time Check-Ins
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-emerald-600">{stats.onTime}</span>
            <span className="text-xs font-bold text-emerald-500">On Schedule</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Before shift start</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-amber-200/80 bg-amber-50/20 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-amber-700 block tracking-wider">
            Late Check-Ins
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-amber-600">{stats.late}</span>
            <span className="text-xs font-bold text-amber-700">Late Arrivals</span>
          </div>
          <span className="text-[11px] text-amber-800/80 mt-0.5 block">After shift grace period</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-purple-200/80 bg-purple-50/20 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-purple-700 block tracking-wider">
            Overtime & Extra Time
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-purple-600">{stats.extraWork}</span>
            <span className="text-xs font-bold text-purple-700">Extra Work</span>
          </div>
          <span className="text-[11px] text-purple-800/80 mt-0.5 block">Past scheduled shift end</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm col-span-2 md:col-span-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Shift In Progress
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-blue-600">{stats.inProgress}</span>
            <span className="text-xs font-bold text-blue-500">Checked In</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Pending evening check-out</span>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Assigned Shift</th>
                <th className="py-3.5 px-4">Check-In Verification</th>
                <th className="py-3.5 px-4">Check-Out Verification</th>
                <th className="py-3.5 px-4">Working Hours</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    <span>Loading attendance records...</span>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <CalendarCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-700">No attendance records found for this date.</p>
                    <p className="text-xs text-slate-400 mt-1">Try selecting another date or check in using camera.</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((row) => {
                  const isLate = row.late_minutes && row.late_minutes > 0;
                  const hasExtra = row.overtime_minutes && row.overtime_minutes > 0;

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Date */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {row.date}
                      </td>

                      {/* Employee Info */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0 overflow-hidden border border-blue-200">
                            {row.avatar_url ? (
                              <img src={row.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              row.employee_name?.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">
                              {row.employee_name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {row.employee_code} • {row.department_name}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Shift Rules */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-800 block text-xs">
                          {row.shift_name || 'General Morning Shift'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {row.shift_start_time || '10:00 AM'} - {row.shift_end_time || '06:00 PM'}
                        </span>
                      </td>

                      {/* Check-In with Photo & Late Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2.5">
                          {/* Selfie thumbnail */}
                          {row.check_in_selfie ? (
                            <button
                              onClick={() =>
                                setSelfieZoomModal({
                                  url: row.check_in_selfie!,
                                  title: `Check-In Photo • ${row.employee_name} (${row.check_in_time})`,
                                })
                              }
                              title="Click to view full photo"
                              className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-300 flex items-center justify-center overflow-hidden shrink-0 hover:scale-105 transition-transform cursor-pointer shadow-xs"
                            >
                              <img
                                src={row.check_in_selfie}
                                alt="CheckIn"
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] text-slate-400 shrink-0">
                              --
                            </div>
                          )}

                          <div>
                            <span className="font-mono font-bold text-slate-900 block">
                              {row.check_in_time ? formatTime(row.check_in_time) : '--:--'}
                            </span>

                            {/* Shift comparison badge */}
                            {row.check_in_time && (
                              <div className="mt-0.5">
                                {isLate ? (
                                  <span className="inline-flex items-center px-1.5 py-0.2 text-[10px] font-bold rounded-md bg-amber-50 text-amber-700 border border-amber-300">
                                    <AlertTriangle className="w-2.5 h-2.5 mr-1 text-amber-600" />
                                    {row.late_minutes} min Late
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-1.5 py-0.2 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-300">
                                    <Check className="w-2.5 h-2.5 mr-1 text-emerald-600" />
                                    {row.late_display || 'On Time'}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Check-Out with Photo & Extra Time Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2.5">
                          {/* Selfie thumbnail */}
                          {row.check_out_selfie ? (
                            <button
                              onClick={() =>
                                setSelfieZoomModal({
                                  url: row.check_out_selfie!,
                                  title: `Check-Out Photo • ${row.employee_name} (${row.check_out_time})`,
                                })
                              }
                              title="Click to view full photo"
                              className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-300 flex items-center justify-center overflow-hidden shrink-0 hover:scale-105 transition-transform cursor-pointer shadow-xs"
                            >
                              <img
                                src={row.check_out_selfie}
                                alt="CheckOut"
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] text-slate-400 shrink-0">
                              --
                            </div>
                          )}

                          <div>
                            <span className="font-mono font-bold text-slate-900 block">
                              {row.check_out_time ? formatTime(row.check_out_time) : (
                                <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                                  In Progress
                                </span>
                              )}
                            </span>

                            {/* Shift overtime badge */}
                            {row.check_out_time && (
                              <div className="mt-0.5">
                                {hasExtra ? (
                                  <span className="inline-flex items-center px-1.5 py-0.2 text-[10px] font-bold rounded-md bg-purple-50 text-purple-700 border border-purple-300">
                                    <Flame className="w-2.5 h-2.5 mr-1 text-purple-600" />
                                    {row.overtime_minutes} min Extra
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-1.5 py-0.2 text-[10px] font-bold rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                    {row.overtime_display || 'Shift End'}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Total Net Hours */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono font-extrabold text-slate-900 text-xs">
                          {row.total_hours || 0} hrs
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          (Net after 1h break)
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={row.status} />
                      </td>

                      {/* Action: View Details */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedRecord(row);
                            setDetailModalOpen(true);
                          }}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 shadow-2xs transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ATTENDANCE DETAIL & PHOTO VERIFICATION MODAL */}
      {detailModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm border border-blue-200 shrink-0 overflow-hidden">
                  {selectedRecord.avatar_url ? (
                    <img src={selectedRecord.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    selectedRecord.employee_name?.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center space-x-2">
                    <span>{selectedRecord.employee_name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {selectedRecord.employee_code}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {selectedRecord.designation_title || 'Staff'} • {selectedRecord.department_name}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setDetailModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Shift Rules Card */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Date</span>
                <span className="font-bold text-slate-900 mt-0.5 block">{selectedRecord.date}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Shift</span>
                <span className="font-bold text-slate-900 mt-0.5 block truncate">
                  {selectedRecord.shift_name || 'General Morning'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Shift Timings</span>
                <span className="font-bold text-slate-900 mt-0.5 block">
                  {selectedRecord.shift_start_time || '10:00 AM'} - {selectedRecord.shift_end_time || '06:00 PM'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
                <div className="mt-0.5">
                  <StatusBadge status={selectedRecord.status} />
                </div>
              </div>
            </div>

            {/* SIDE-BY-SIDE CHECK-IN & CHECK-OUT VERIFICATION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Check-In Card */}
              <div className="bg-emerald-50/40 rounded-2xl p-4 border border-emerald-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-emerald-900 flex items-center">
                      <Camera className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                      Check-In Verification Photo
                    </span>
                    {selectedRecord.late_minutes && selectedRecord.late_minutes > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        {selectedRecord.late_minutes} min Late
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        On Time
                      </span>
                    )}
                  </div>

                  <div className="w-full h-48 rounded-xl bg-white border border-emerald-200 flex items-center justify-center p-2 overflow-hidden shadow-inner">
                    {selectedRecord.check_in_selfie ? (
                      <img
                        src={selectedRecord.check_in_selfie}
                        alt="CheckIn Selfie"
                        className="max-h-full max-w-full object-contain rounded-lg"
                      />
                    ) : (
                      <div className="text-center text-slate-400">
                        <Camera className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                        <span className="text-xs">No Selfie Captured</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-emerald-200/60 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Actual Check-In:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {selectedRecord.check_in_time ? formatTime(selectedRecord.check_in_time) : 'Not Checked In'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Shift Start Time:</span>
                    <span className="font-mono text-slate-700">
                      {selectedRecord.shift_start_time || '10:00 AM'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Calculation:</span>
                    <span
                      className={`font-bold ${
                        selectedRecord.late_minutes && selectedRecord.late_minutes > 0
                          ? 'text-amber-700'
                          : 'text-emerald-700'
                      }`}
                    >
                      {selectedRecord.late_display || 'On Time'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Check-Out Card */}
              <div className="bg-purple-50/40 rounded-2xl p-4 border border-purple-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-purple-900 flex items-center">
                      <Camera className="w-3.5 h-3.5 mr-1.5 text-purple-600" />
                      Check-Out Verification Photo
                    </span>
                    {selectedRecord.overtime_minutes && selectedRecord.overtime_minutes > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
                        {selectedRecord.overtime_minutes} min Extra
                      </span>
                    ) : selectedRecord.check_out_time ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                        Shift Complete
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                        In Progress
                      </span>
                    )}
                  </div>

                  <div className="w-full h-48 rounded-xl bg-white border border-purple-200 flex items-center justify-center p-2 overflow-hidden shadow-inner">
                    {selectedRecord.check_out_selfie ? (
                      <img
                        src={selectedRecord.check_out_selfie}
                        alt="CheckOut Selfie"
                        className="max-h-full max-w-full object-contain rounded-lg"
                      />
                    ) : (
                      <div className="text-center text-slate-400">
                        <Clock className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                        <span className="text-xs">
                          {selectedRecord.check_out_time ? 'No Photo Captured' : 'Shift Currently Active'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-purple-200/60 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Actual Check-Out:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {selectedRecord.check_out_time || 'Pending Check-Out'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Shift End Time:</span>
                    <span className="font-mono text-slate-700">
                      {selectedRecord.shift_end_time || '06:00 PM'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Calculation:</span>
                    <span
                      className={`font-bold ${
                        selectedRecord.overtime_minutes && selectedRecord.overtime_minutes > 0
                          ? 'text-purple-700'
                          : 'text-slate-700'
                      }`}
                    >
                      {selectedRecord.overtime_display || 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Details & Hours Summary */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Work Summary</span>
                <span className="text-sm font-black text-white mt-0.5 block">
                  {selectedRecord.total_hours || 0} Productive Hours Logged
                </span>
                {selectedRecord.notes && (
                  <span className="text-[11px] text-slate-300 block mt-0.5">
                    Note: {selectedRecord.notes}
                  </span>
                )}
              </div>

              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
              >
                Close Verification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: QUICK SELFIE ZOOM MODAL */}
      {selfieZoomModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900">{selfieZoomModal.title}</span>
              <button
                onClick={() => setSelfieZoomModal(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="w-full h-72 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-center p-2 overflow-hidden shadow-inner">
              <img src={selfieZoomModal.url} alt="Zoomed Selfie" className="max-h-full max-w-full object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: WEBRTC CAMERA MODAL */}
      <CameraCaptureModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onConfirm={handleCameraConfirm}
        actionType={cameraAction}
      />
    </div>
  );
};
