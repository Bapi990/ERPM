import React, { useState, useEffect } from 'react';
import {
  Calendar, Plus, Video, MapPin, Star, CheckCircle2, Clock,
  ExternalLink, User, MessageSquare, Award, AlertCircle, Search, Filter
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import { Modal } from '../../components/common/Modal';
import type { InterviewSchedule, JobApplication } from '../../types';

export const InterviewsPage: React.FC = () => {
  const { user } = useAuth();
  const { emitEvent, subscribe } = useRealtime();

  const [interviews, setInterviews] = useState<InterviewSchedule[]>([]);
  const [candidates, setCandidates] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [scheduleModal, setScheduleModal] = useState(false);
  const [scorecardModal, setScorecardModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<InterviewSchedule | null>(null);

  // Schedule Form
  const [scheduleForm, setScheduleForm] = useState({
    application: '',
    round_name: 'technical_1',
    interviewer_name: 'Dr. Debabrata Roy (VP Tech)',
    scheduled_at: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    mode: 'Google Meet',
    meeting_link: 'https://meet.google.com/erp-interview-odias',
  });

  // Scorecard Form
  const [scorecardForm, setScorecardForm] = useState({
    rating: 4,
    recommendation: 'Strong Hire',
    feedback_notes: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [intRes, candRes] = await Promise.all([
        api.getInterviews(),
        api.getJobApplications(),
      ]);
      setInterviews(intRes?.data?.results || intRes?.data || []);
      setCandidates(candRes?.data?.results || candRes?.data || []);
    } catch (err) {
      console.error('Failed to load interview schedules', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = subscribe('interview_*', () => {
      loadData();
    });
    return () => unsub();
  }, []);

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.application) {
      showToast('Please select a candidate');
      return;
    }
    try {
      await api.createInterview({
        ...scheduleForm,
        status: 'scheduled',
      });
      emitEvent('interview_scheduled', 'Interview Scheduled', 'Candidate interview round scheduled', 'info');
      showToast('Interview session scheduled successfully!');
      setScheduleModal(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      showToast('Failed to schedule interview');
    }
  };

  const handleSubmitScorecard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInterview) return;
    try {
      await api.updateInterview(selectedInterview.id, {
        rating: Number(scorecardForm.rating),
        recommendation: scorecardForm.recommendation,
        feedback_notes: scorecardForm.feedback_notes,
        status: 'completed',
      });
      emitEvent('interview_evaluated', 'Interview Evaluated', 'Evaluation scorecard submitted successfully', 'success');
      showToast('Interview evaluation scorecard submitted!');
      setScorecardModal(false);
      setSelectedInterview(null);
      loadData();
    } catch (err: any) {
      console.error(err);
      showToast('Failed to submit scorecard');
    }
  };

  // KPIs
  const scheduledCount = interviews.filter(i => i.status === 'scheduled').length;
  const completedCount = interviews.filter(i => i.status === 'completed').length;
  const avgRating = interviews.filter(i => i.rating > 0).length > 0
    ? (interviews.filter(i => i.rating > 0).reduce((sum, i) => sum + i.rating, 0) / interviews.filter(i => i.rating > 0).length).toFixed(1)
    : '4.5';
  const virtualMeetsCount = interviews.filter(i => i.mode.toLowerCase().includes('meet') || i.mode.toLowerCase().includes('zoom')).length;

  const filtered = interviews.filter(item => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesSearch =
      item.candidate_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.interviewer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.round_display.toLowerCase().includes(searchQuery.toLowerCase());
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
          <h1 className="text-2xl font-bold text-gray-900">Interview Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Coordinate evaluation rounds, virtual video links, interviewer scorecards, and hiring decisions.
          </p>
        </div>
        <button
          onClick={() => setScheduleModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 text-sm font-semibold transition-all shadow-md shadow-primary-500/20"
        >
          <Plus size={16} />
          Schedule Interview
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Scheduled Sessions</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{scheduledCount} Upcoming</p>
            <p className="text-xs text-primary-600 mt-1">Calendar confirmed</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Calendar size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Completed Rounds</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{completedCount}</p>
            <p className="text-xs text-emerald-600 mt-1">Scorecards filed</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Average Candidate Score</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{avgRating} / 5.0</p>
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <Star size={12} className="fill-amber-500" /> High caliber threshold
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Star size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Virtual Video Meets</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{virtualMeetsCount}</p>
            <p className="text-xs text-purple-600 mt-1">Remote screening</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Video size={24} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['all', 'scheduled', 'completed', 'cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                statusFilter === status
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
            placeholder="Search candidate, round, interviewer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Interviews Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-3 bg-white p-12 text-center rounded-2xl border border-gray-100 text-gray-400">
            No interview sessions found matching the filter.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-700">
                    {item.round_display}
                  </span>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full capitalize ${
                    item.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700'
                      : item.status === 'scheduled'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {item.status}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-0.5">{item.candidate_name}</h3>
                <p className="text-xs text-primary-600 font-medium mb-4">{item.job_title}</p>

                <div className="space-y-2.5 text-xs text-gray-600 mb-4">
                  <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-xl">
                    <span className="text-gray-400">Panel Evaluator:</span>
                    <span className="font-semibold text-gray-800">{item.interviewer_name}</span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-xl">
                    <span className="text-gray-400">Schedule Time:</span>
                    <span className="font-semibold text-gray-800">{new Date(item.scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-xl">
                    <span className="text-gray-400">Session Mode:</span>
                    <span className="font-semibold text-purple-700 flex items-center gap-1">
                      <Video size={13} /> {item.mode}
                    </span>
                  </div>
                </div>

                {item.status === 'completed' && (
                  <div className="p-3 bg-emerald-50/60 rounded-xl mb-4 border border-emerald-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-emerald-800">Scorecard:</span>
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={i < item.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs font-bold text-gray-800">{item.recommendation || 'Recommended'}</p>
                    {item.feedback_notes && (
                      <p className="text-xs text-gray-600 mt-1 italic">"{item.feedback_notes}"</p>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                {item.meeting_link ? (
                  <a
                    href={item.meeting_link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 px-3 py-1.5 bg-primary-50 rounded-lg transition-all"
                  >
                    <ExternalLink size={14} /> Join Meeting
                  </a>
                ) : (
                  <span className="text-xs text-gray-400">No Link</span>
                )}

                {item.status === 'scheduled' && (
                  <button
                    onClick={() => {
                      setSelectedInterview(item);
                      setScorecardModal(true);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-all shadow-sm"
                  >
                    Submit Scorecard
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Schedule Interview */}
      <Modal
        isOpen={scheduleModal}
        onClose={() => setScheduleModal(false)}
        title="Schedule Interview Round"
      >
        <form onSubmit={handleScheduleInterview} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Select Candidate *</label>
            <select
              required
              value={scheduleForm.application}
              onChange={(e) => setScheduleForm({ ...scheduleForm, application: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">-- Choose Candidate --</option>
              {candidates.map(cand => (
                <option key={cand.id} value={cand.id}>
                  {cand.candidate_name} ({cand.job_title})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Interview Round *</label>
              <select
                value={scheduleForm.round_name}
                onChange={(e) => setScheduleForm({ ...scheduleForm, round_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="screening">Round 0: HR Screening</option>
                <option value="technical_1">Round 1: Technical Coding & DS</option>
                <option value="technical_2">Round 2: Architecture & System Design</option>
                <option value="managerial">Round 3: Leadership & Culture Fit</option>
                <option value="bar_raiser">Round 4: Final Executive Bar Raiser</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Panel Evaluator Name *</label>
              <input
                type="text"
                required
                value={scheduleForm.interviewer_name}
                onChange={(e) => setScheduleForm({ ...scheduleForm, interviewer_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Date & Time *</label>
              <input
                type="datetime-local"
                required
                value={scheduleForm.scheduled_at}
                onChange={(e) => setScheduleForm({ ...scheduleForm, scheduled_at: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Meeting Mode</label>
              <select
                value={scheduleForm.mode}
                onChange={(e) => setScheduleForm({ ...scheduleForm, mode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="Google Meet">Google Meet</option>
                <option value="Microsoft Teams">Microsoft Teams</option>
                <option value="Zoom">Zoom</option>
                <option value="In-Person Office">In-Person Office</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Meeting Link / Room Location</label>
            <input
              type="text"
              placeholder="https://meet.google.com/xyz..."
              value={scheduleForm.meeting_link}
              onChange={(e) => setScheduleForm({ ...scheduleForm, meeting_link: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setScheduleModal(false)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-primary-500/20"
            >
              Confirm Schedule
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Submit Scorecard */}
      {selectedInterview && (
        <Modal
          isOpen={scorecardModal}
          onClose={() => setScorecardModal(false)}
          title={`Scorecard: ${selectedInterview.candidate_name}`}
        >
          <form onSubmit={handleSubmitScorecard} className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-xl text-sm">
              <p className="font-semibold text-gray-900">{selectedInterview.round_display}</p>
              <p className="text-xs text-gray-500">Evaluator: {selectedInterview.interviewer_name}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Rating (1 to 5 Stars)</label>
              <div className="flex items-center gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setScorecardForm({ ...scorecardForm, rating: star })}
                    className="p-1 text-amber-400 hover:scale-110 transition-transform"
                  >
                    <Star
                      size={28}
                      className={star <= scorecardForm.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                    />
                  </button>
                ))}
                <span className="text-sm font-bold text-gray-700 ml-2">
                  {scorecardForm.rating} / 5 Stars
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Hiring Recommendation *</label>
              <select
                value={scorecardForm.recommendation}
                onChange={(e) => setScorecardForm({ ...scorecardForm, recommendation: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="Strong Hire">Strong Hire (Exceeds expectations)</option>
                <option value="Hire">Hire (Meets bar)</option>
                <option value="Hold / Discuss">Hold / Needs Panel Discussion</option>
                <option value="Reject">Reject (Below technical bar)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Evaluation & Feedback Notes *</label>
              <textarea
                required
                rows={4}
                placeholder="Highlight candidate problem solving, architectural depth, code quality, culture alignment..."
                value={scorecardForm.feedback_notes}
                onChange={(e) => setScorecardForm({ ...scorecardForm, feedback_notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setScorecardModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-500/20"
              >
                Submit Scorecard
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
