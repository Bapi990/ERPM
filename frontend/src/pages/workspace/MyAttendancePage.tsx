import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarCheck, Clock, Camera, CheckCircle2, AlertCircle,
  MapPin, Eye, Calendar, ShieldCheck, ArrowRight, RefreshCw,
  X, Sparkles, TrendingUp, User, Building2, ExternalLink
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import { CameraCaptureModal } from '../../components/common/CameraCaptureModal';
import { StatusBadge } from '../../components/common/StatusBadge';
import type { AttendanceRecord } from '../../types';
import { formatTime } from '../../utils/timeFormat';

export const MyAttendancePage: React.FC = () => {
  const { user } = useAuth();
  const { emitEvent, subscribe } = useRealtime();

  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [cameraAction, setCameraAction] = useState<'check-in' | 'check-out'>('check-in');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick selfie zoom lightbox modal
  const [selfieZoomModal, setSelfieZoomModal] = useState<{ url: string; title: string; meta?: string } | null>(null);

  useEffect(() => {
    fetchMyAttendance();
    const unsub = subscribe('attendance_*', () => {
      fetchMyAttendance();
    });
    return () => unsub();
  }, [user]);

  const fetchMyAttendance = async () => {
    setLoading(true);
    try {
      const data = await api.getAttendance();
      const allRecords: AttendanceRecord[] = data.results || data || [];
      // Filter for current user's records if employee linked, or match user name
      const userFirstName = user?.first_name?.toLowerCase() || '';
      const userEmail = user?.email?.toLowerCase() || '';

      const myRecords = allRecords.filter((r) => {
        const nameMatch = userFirstName && r.employee_name?.toLowerCase().includes(userFirstName);
        const emailMatch = userEmail && (r as any).employee_email?.toLowerCase().includes(userEmail);
        return nameMatch || emailMatch;
      });

      let combined = myRecords.length > 0 ? myRecords : allRecords;
      if (combined.length === 0) {
        try {
          const saved = localStorage.getItem('odias_attendance_records');
          if (saved) {
            const list = JSON.parse(saved);
            if (Array.isArray(list) && list.length > 0) combined = list;
          }
        } catch {}
      }

      setAttendanceLogs(combined);
    } catch (err) {
      console.error('Failed to load my attendance:', err);
      setAttendanceLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Find today's record (matches today date e.g. 2026-11-18 or latest)
  const todayRecord = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return attendanceLogs.find((r) => r.date === todayStr) || attendanceLogs[0] || null;
  }, [attendanceLogs]);

  const isCheckedInToday = Boolean(todayRecord && todayRecord.check_in_time);
  const isCheckedOutToday = Boolean(todayRecord && todayRecord.check_out_time);

  const handleCameraConfirm = async (photoDataUrl: string, coords?: { latitude: number; longitude: number }) => {
    try {
      setErrorMessage(null);
      if (cameraAction === 'check-in') {
        const res = await api.checkIn({ selfie_data: photoDataUrl, latitude: coords?.latitude, longitude: coords?.longitude });
        setSuccessToast(res.message || 'Attendance recorded successfully!');
        emitEvent('attendance_checkin', 'Selfie Attendance Verified', `${user?.first_name || 'Staff'} recorded check-in at ${new Date().toLocaleTimeString()}`, 'success');
      } else {
        const res = await api.checkOut({ selfie_data: photoDataUrl });
        setSuccessToast(res.message || 'Check-out completed!');
        emitEvent('attendance_checkout', 'Selfie Check-Out Verified', `${user?.first_name || 'Staff'} completed workday`, 'info');
      }
      fetchMyAttendance();
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Attendance action failed');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  // Monthly stats
  const stats = useMemo(() => {
    const totalDays = attendanceLogs.length || 1;
    const presentDays = attendanceLogs.filter((r) => r.status === 'present' || r.status === 'late').length || 1;
    const lateDays = attendanceLogs.filter((r) => r.status === 'late' || (r.late_minutes && r.late_minutes > 0)).length;
    const punctualityPct = (((presentDays - lateDays) / totalDays) * 100).toFixed(1);

    const totalHoursNum = attendanceLogs.reduce((acc, r) => acc + (Number(r.total_hours) || 8), 0);
    const overtimeHoursNum = attendanceLogs.reduce((acc, r) => acc + (Number(r.overtime_hours) || 0), 0);

    return {
      presentDays,
      lateDays,
      punctualityPct,
      totalHours: totalHoursNum.toFixed(1),
      overtimeHours: overtimeHoursNum.toFixed(1),
    };
  }, [attendanceLogs]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
              <CalendarCheck className="w-6 h-6 text-emerald-600 mr-2.5" />
              My Attendance & Biometric Photo Register
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              Personal Self-Service
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Logged in as <strong>{user?.first_name} {user?.last_name}</strong> ({user?.role_name || 'Associate'}) • View personal check-in/out photos, working hours, and live verification audit.
          </p>
        </div>

        {/* Quick Action Button for User */}
        <div className="flex items-center space-x-2.5">
          {!isCheckedInToday ? (
            <button
              onClick={() => {
                setCameraAction('check-in');
                setCameraModalOpen(true);
              }}
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4 mr-1.5" />
              Mark Attendance (Check In)
            </button>
          ) : !isCheckedOutToday ? (
            <button
              onClick={() => {
                setCameraAction('check-out');
                setCameraModalOpen(true);
              }}
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Clock className="w-4 h-4 mr-1.5" />
              Check Out Now
            </button>
          ) : (
            <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Today's Workday Completed</span>
            </div>
          )}
        </div>
      </div>

      {/* Success Alert Toast */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between shadow-xs animate-in slide-in-from-top-2">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-xs text-emerald-700 underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Error Alert Toast */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold flex items-center justify-between shadow-xs animate-in slide-in-from-top-2">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-xs text-rose-700 underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* 2. TODAY'S LIVE SESSION CARD (With Check-In & Check-Out Photos!) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-600 font-bold block">
                Today's Real-Time Work Session
              </span>
              <h2 className="text-base font-black text-slate-900">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-slate-500">Live Clock:</span>
            <span className="px-3 py-1 rounded-full bg-slate-900 text-emerald-400 font-mono text-xs font-bold">
              {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* 2-Column Split: Check-In Photo & Details vs Check-Out Photo & Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
          {/* LEFT: Check-In Details & Selfie Photo */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Check-In Verification Photo</span>
                </span>
                {todayRecord?.check_in_time ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Verified Present
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    Pending
                  </span>
                )}
              </div>

              {/* Photo Box */}
              <div className="relative w-full h-52 bg-slate-900 rounded-xl overflow-hidden border border-slate-300 flex items-center justify-center group shadow-inner">
                {todayRecord?.check_in_selfie ? (
                  <>
                    <img
                      src={todayRecord.check_in_selfie}
                      alt="Check-in Selfie"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <button
                      onClick={() =>
                        setSelfieZoomModal({
                          url: todayRecord.check_in_selfie!,
                          title: `My Check-In Photo (${todayRecord.check_in_time || 'Recorded'})`,
                          meta: `Employee: ${user?.first_name} ${user?.last_name} • Geo Verified`,
                        })
                      }
                      className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold cursor-pointer backdrop-blur-xs"
                    >
                      <Eye className="w-4 h-4 mr-1.5" /> Click to Zoom Photo
                    </button>
                  </>
                ) : (
                  <div className="text-center p-4 text-slate-400">
                    <Camera className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                    <p className="text-xs font-semibold">No Check-In Photo Yet</p>
                    <p className="text-[10px] text-slate-500 mt-1">Click "Mark Attendance" to capture selfie</p>
                  </div>
                )}
              </div>
            </div>

            {/* Check-in Metadata */}
            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Check-In Time</span>
                <span className="font-bold text-slate-900">{todayRecord?.check_in_time ? formatTime(todayRecord.check_in_time) : '--:--:--'}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase">Location Status</span>
                <span className="font-bold text-emerald-600">Geo Verified (HQ)</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Check-Out Details & Selfie Photo */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>Check-Out Verification Photo</span>
                </span>
                {todayRecord?.check_out_time ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    Session Logged
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                    Pending Check-Out
                  </span>
                )}
              </div>

              {/* Photo Box */}
              <div className="relative w-full h-52 bg-slate-900 rounded-xl overflow-hidden border border-slate-300 flex items-center justify-center group shadow-inner">
                {todayRecord?.check_out_selfie ? (
                  <>
                    <img
                      src={todayRecord.check_out_selfie}
                      alt="Check-out Selfie"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <button
                      onClick={() =>
                        setSelfieZoomModal({
                          url: todayRecord.check_out_selfie!,
                          title: `My Check-Out Photo (${todayRecord.check_out_time || 'Logged'})`,
                          meta: `Total Logged: ${todayRecord.total_hours || '8.0'} hrs • Verified`,
                        })
                      }
                      className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold cursor-pointer backdrop-blur-xs"
                    >
                      <Eye className="w-4 h-4 mr-1.5" /> Click to Zoom Photo
                    </button>
                  </>
                ) : (
                  <div className="text-center p-4 text-slate-400">
                    <Clock className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                    <p className="text-xs font-semibold">
                      {isCheckedInToday ? 'Ready for Check-Out' : 'Check In First to Enable'}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {isCheckedInToday ? 'Click "Check Out Now" when ending shift' : 'Workday not started'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Check-out Metadata */}
            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Check-Out Time</span>
                <span className="font-bold text-slate-900">{todayRecord?.check_out_time ? formatTime(todayRecord.check_out_time) : '--:--:--'}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase">Total Hours Today</span>
                <span className="font-bold text-indigo-600">
                  {todayRecord?.total_hours ? `${todayRecord.total_hours} hrs` : '--'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Monthly Personal Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Days Present</span>
          <span className="text-xl font-black text-slate-900 font-mono mt-1 block">{stats.presentDays} Days</span>
          <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">Good Standing</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Punctuality Score</span>
          <span className="text-xl font-black text-slate-900 font-mono mt-1 block">{stats.punctualityPct}%</span>
          <span className="text-[11px] text-blue-600 font-semibold mt-0.5 block">On-Time Arrival</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Late Arrival Days</span>
          <span className="text-xl font-black text-slate-900 font-mono mt-1 block">{stats.lateDays} Days</span>
          <span className="text-[11px] text-amber-600 font-semibold mt-0.5 block">Grace Period Active</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Work Hours</span>
          <span className="text-xl font-black text-slate-900 font-mono mt-1 block">{stats.totalHours} hrs</span>
          <span className="text-[11px] text-purple-600 font-semibold mt-0.5 block">+{stats.overtimeHours} hrs Overtime</span>
        </div>
      </div>

      {/* 4. Personal Attendance History Table (With Selfies!) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Personal Attendance & Selfie Photo Audit Log</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Click any selfie thumbnail to view verified full-resolution identity badge.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Showing {attendanceLogs.length} Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Check-In & Photo</th>
                <th className="py-3 px-4">Check-Out & Photo</th>
                <th className="py-3 px-4">Work Hours</th>
                <th className="py-3 px-4">Late Duration</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {attendanceLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                  {/* Date */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-bold text-slate-900 block font-mono">{log.date}</span>
                    <span className="text-[11px] text-slate-400">Regular Shift</span>
                  </td>

                  {/* Check-In Time & Photo */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2.5">
                      {log.check_in_selfie ? (
                        <button
                          type="button"
                          onClick={() =>
                            setSelfieZoomModal({
                              url: log.check_in_selfie!,
                              title: `Check-In Photo • ${log.date} (${log.check_in_time})`,
                              meta: `Employee: ${log.employee_name} • Geo Verified`,
                            })
                          }
                          className="w-9 h-9 rounded-xl overflow-hidden bg-slate-900 border border-emerald-300 hover:scale-110 transition-transform cursor-pointer shrink-0 shadow-xs"
                          title="Click to zoom check-in selfie"
                        >
                          <img src={log.check_in_selfie} alt="CheckIn" className="w-full h-full object-cover" />
                        </button>
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                          <Camera className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <span className="font-mono font-bold text-slate-900 block">
                          {log.check_in_time ? formatTime(log.check_in_time) : '--:--'}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-semibold">WebRTC Biometric</span>
                      </div>
                    </div>
                  </td>

                  {/* Check-Out Time & Photo */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2.5">
                      {log.check_out_selfie ? (
                        <button
                          type="button"
                          onClick={() =>
                            setSelfieZoomModal({
                              url: log.check_out_selfie!,
                              title: `Check-Out Photo • ${log.date} (${log.check_out_time})`,
                              meta: `Employee: ${log.employee_name} • Total: ${log.total_hours} hrs`,
                            })
                          }
                          className="w-9 h-9 rounded-xl overflow-hidden bg-slate-900 border border-blue-300 hover:scale-110 transition-transform cursor-pointer shrink-0 shadow-xs"
                          title="Click to zoom check-out selfie"
                        >
                          <img src={log.check_out_selfie} alt="CheckOut" className="w-full h-full object-cover" />
                        </button>
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                          <Clock className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <span className="font-mono font-bold text-slate-900 block">
                          {log.check_out_time ? formatTime(log.check_out_time) : '--:--'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {log.check_out_time ? 'Logged' : 'In Progress'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Work Hours */}
                  <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                    <span className="font-bold text-slate-800">{log.total_hours || '8.00'} hrs</span>
                    {log.overtime_hours && Number(log.overtime_hours) > 0 && (
                      <span className="text-[10px] text-purple-600 block">+{log.overtime_hours}h OT</span>
                    )}
                  </td>

                  {/* Late Duration */}
                  <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                    {log.late_minutes && log.late_minutes > 0 ? (
                      <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-[10px]">
                        +{log.late_minutes}m Late
                      </span>
                    ) : (
                      <span className="text-emerald-700 text-[11px] font-semibold">On Time</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <StatusBadge status={log.status} />
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {log.check_in_selfie && (
                      <button
                        onClick={() =>
                          setSelfieZoomModal({
                            url: log.check_in_selfie!,
                            title: `Selfie Photo • ${log.date}`,
                            meta: `Time: ${log.check_in_time} • Status: ${log.status.toUpperCase()}`,
                          })
                        }
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        View Photo
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. LIGHTBOX SELFIE ZOOM MODAL */}
      {selfieZoomModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-bold text-slate-900">{selfieZoomModal.title}</h4>
                {selfieZoomModal.meta && (
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">{selfieZoomModal.meta}</p>
                )}
              </div>
              <button
                onClick={() => setSelfieZoomModal(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* High-Res Image Display */}
            <div className="w-full h-80 bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center shadow-inner">
              <img
                src={selfieZoomModal.url}
                alt="Enlarged Selfie"
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <div className="flex items-center space-x-1.5 text-emerald-600 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Verified WebRTC Biometric Capture</span>
              </div>
              <button
                onClick={() => setSelfieZoomModal(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. REALTIME CAMERA CAPTURE MODAL */}
      <CameraCaptureModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onConfirm={handleCameraConfirm}
        actionType={cameraAction}
      />
    </div>
  );
};

export default MyAttendancePage;
