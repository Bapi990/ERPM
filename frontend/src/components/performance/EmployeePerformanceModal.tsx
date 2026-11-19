import React, { useState, useEffect } from 'react';
import {
  Star, Target, Briefcase, Shield, Clock, Lightbulb,
  Users, Heart, Puzzle, MessageSquare, CheckCircle2,
  X, AlertCircle, ThumbsUp, TrendingUp
} from 'lucide-react';
import { Modal } from '../common/Modal';
import {
  DIMENSIONS_CONFIG,
  type DimensionScores,
  type EmployeePerformanceEvaluation,
  calculateOverallScore,
  getRatingBadge
} from '../../types/performance';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import { api } from '../../api/client';

interface EmployeePerformanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: {
    id: string;
    first_name?: string;
    last_name?: string;
    name?: string;
    employee_id?: string;
    employee_code?: string;
    designation?: string;
    role_name?: string;
    role_code?: string;
    department_name?: string;
    branch_name?: string;
    shift_name?: string;
    assigned_hr?: string;
    joined_date?: string;
    avatar_url?: string;
  } | null;
  initialEvaluation?: EmployeePerformanceEvaluation | null;
  onSaveSuccess?: (savedEvaluation: EmployeePerformanceEvaluation) => void;
}

const DEFAULT_SCORES: DimensionScores = {
  focus_results: 0.0,
  work_discipline: 0.0,
  accountability: 0.0,
  punctuality: 0.0,
  innovation: 0.0,
  teamwork: 0.0,
  respect_openness: 0.0,
  problem_solving: 0.0,
  communication: 0.0,
};

export const EmployeePerformanceModal: React.FC<EmployeePerformanceModalProps> = ({
  isOpen,
  onClose,
  employee,
  initialEvaluation,
  onSaveSuccess,
}) => {
  const { user } = useAuth();
  const { emitEvent } = useRealtime();

  const [scores, setScores] = useState<DimensionScores>(DEFAULT_SCORES);
  const [keyStrengths, setKeyStrengths] = useState('');
  const [areasForImprovement, setAreasForImprovement] = useState('');
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when modal opens or initialEvaluation changes
  useEffect(() => {
    if (initialEvaluation) {
      setScores(initialEvaluation.scores || DEFAULT_SCORES);
      setKeyStrengths(initialEvaluation.keyStrengths || '');
      setAreasForImprovement(initialEvaluation.areasForImprovement || '');
      setFeedbackNotes(initialEvaluation.feedbackNotes || '');
    } else {
      setScores(DEFAULT_SCORES);
      setKeyStrengths('');
      setAreasForImprovement('');
      setFeedbackNotes('');
    }
    setError(null);
  }, [isOpen, initialEvaluation, employee]);

  if (!employee) return null;

  const employeeName =
    employee.name ||
    `${employee.first_name || ''} ${employee.last_name || ''}`.trim() ||
    'Employee';

  const calculatedScore = calculateOverallScore(scores);
  const ratingBadge = getRatingBadge(calculatedScore);

  const handleSliderChange = (key: keyof DimensionScores, val: number) => {
    setScores((prev) => ({
      ...prev,
      [key]: Math.round(val * 10) / 10,
    }));
  };

  const getDimensionIcon = (iconName: string) => {
    switch (iconName) {
      case 'Target': return <Target className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'Briefcase': return <Briefcase className="w-4 h-4 text-blue-600 shrink-0" />;
      case 'Shield': return <Shield className="w-4 h-4 text-purple-600 shrink-0" />;
      case 'Clock': return <Clock className="w-4 h-4 text-amber-600 shrink-0" />;
      case 'Lightbulb': return <Lightbulb className="w-4 h-4 text-pink-600 shrink-0" />;
      case 'Users': return <Users className="w-4 h-4 text-sky-600 shrink-0" />;
      case 'Heart': return <Heart className="w-4 h-4 text-rose-600 shrink-0" />;
      case 'Puzzle': return <Puzzle className="w-4 h-4 text-teal-600 shrink-0" />;
      case 'MessageSquare': return <MessageSquare className="w-4 h-4 text-indigo-600 shrink-0" />;
      default: return <Star className="w-4 h-4 text-blue-600 shrink-0" />;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation: feedbackNotes is mandatory
    if (!feedbackNotes.trim()) {
      setError('Overall Evaluation Notes / Feedback is mandatory to complete the evaluation.');
      return;
    }

    if (calculatedScore <= 0) {
      setError('Please assign at least one dimension score before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      const evaluatorRoleCode = user?.role_code || 'manager';
      const evaluatorTitle =
        evaluatorRoleCode === 'super_admin'
          ? 'Corporate Super Admin'
          : evaluatorRoleCode === 'hr_manager'
          ? 'HR Manager'
          : 'Team Manager';

      const evaluatorDisplayName =
        user?.first_name && user?.last_name
          ? `${user.first_name} ${user.last_name} (${evaluatorTitle})`
          : user?.username || evaluatorTitle;

      const newEvaluation: EmployeePerformanceEvaluation = {
        id: initialEvaluation?.id || `EVAL-${Date.now().toString().slice(-6)}`,
        employeeId: employee.id,
        employeeName,
        employeeCode: employee.employee_code || employee.employee_id || 'ODS-EMP-001',
        employeeRole: employee.role_name || employee.designation || 'Staff',
        employeeDepartment: employee.department_name || 'General',
        employeeBranch: employee.branch_name || 'Main Branch',
        employeeShift: employee.shift_name || 'Day shift',
        assignedHr: employee.assigned_hr || 'Direct / Admin',
        joinedDate: employee.joined_date || '12 Nov 2026',
        avatarUrl: employee.avatar_url,

        scores,
        overallScore: calculatedScore,
        ratingBadge: ratingBadge.label,

        keyStrengths: keyStrengths.trim(),
        areasForImprovement: areasForImprovement.trim(),
        feedbackNotes: feedbackNotes.trim(),

        evaluatorId: user?.id || 'admin-01',
        evaluatorName: evaluatorDisplayName,
        evaluatorRole: evaluatorRoleCode,
        evaluatedAt: new Date().toISOString(),
      };

      // 1. Persist to localStorage
      const cached = localStorage.getItem('gb_employee_performance_evaluations');
      const list: EmployeePerformanceEvaluation[] = cached ? JSON.parse(cached) : [];
      // Replace existing evaluation for this employee or prepend
      const updatedList = [
        newEvaluation,
        ...list.filter((item) => item.employeeId !== employee.id),
      ];
      localStorage.setItem('gb_employee_performance_evaluations', JSON.stringify(updatedList));

      // 2. Broadcast realtime events
      window.dispatchEvent(
        new CustomEvent('odias_performance_evaluated', { detail: newEvaluation })
      );
      try {
        emitEvent(
          'employee_performance_evaluated',
          '⭐ Performance Rating Received',
          `You have received a new 9-Dimension Performance Evaluation: ${calculatedScore.toFixed(1)}/5.0 Stars (${ratingBadge.label}) by ${evaluatorDisplayName}`,
          'success',
          employeeName,
          undefined,
          '/app/hrms/performance'
        );
        api.createNotification({
          title: '⭐ Performance Rating Received',
          message: `You have received a new 9-Dimension Performance Evaluation: ${calculatedScore.toFixed(1)}/5.0 Stars (${ratingBadge.label}) by ${evaluatorDisplayName}`,
          notification_type: 'success',
          link: '/app/hrms/performance',
          target_name: employeeName
        }).catch(() => {});
      } catch (err) {
        // Safe fallback
      }

      if (onSaveSuccess) {
        onSaveSuccess(newEvaluation);
      }

      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit evaluation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="⭐ Employee Performance Evaluation"
      subtitle={`9-Dimension Behaviours & Values Analysis for ${employeeName}`}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-xs font-sans max-h-[80vh] overflow-y-auto pr-1">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Top Header Card: Calculated Overall Rating */}
        <div className="bg-slate-50/90 rounded-2xl border border-slate-200/90 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
              CALCULATED OVERALL RATING:
            </span>
            <div className="flex items-center gap-3">
              <span className="text-3xl sm:text-4xl font-black text-blue-600 tracking-tight font-mono">
                {calculatedScore.toFixed(1)}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${ratingBadge.colorClass}`}>
                {ratingBadge.label}
              </span>
            </div>
          </div>

          <div className="sm:text-right">
            <span className="inline-block px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-[11px] shadow-2xs">
              Scale: 0.0 to 5.0 Stars
            </span>
          </div>
        </div>

        {/* 9 Dimensions Slider Grid (2 Columns matching Image 1) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {DIMENSIONS_CONFIG.map((dim) => {
            const currentVal = scores[dim.key] || 0.0;
            return (
              <div
                key={dim.key}
                className={`bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-400/80 transition-all space-y-2.5 ${
                  dim.num === 9 ? 'md:col-span-2' : ''
                }`}
              >
                {/* Header: Icon + Title + Score Pill */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getDimensionIcon(dim.iconName)}
                    <span className="font-extrabold text-xs text-slate-900">
                      {dim.num}. {dim.title}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-lg text-xs font-black font-mono border ${dim.badgeBg} ${dim.badgeText} border-slate-200/80`}
                  >
                    {currentVal.toFixed(1)} ★
                  </span>
                </div>

                {/* Interactive Slider */}
                <div className="pt-1">
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={currentVal}
                    onChange={(e) => handleSliderChange(dim.key, parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-1 px-0.5">
                    <span>0.0</span>
                    <span>1.0</span>
                    <span>2.0</span>
                    <span>3.0</span>
                    <span>4.0</span>
                    <span>5.0</span>
                  </div>
                </div>

                {/* Helper description */}
                <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                  {dim.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Key Strengths & Areas for Improvement (Optional) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5 text-xs">
              <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Key Strengths (Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Great problem solver, dedicated..."
              value={keyStrengths}
              onChange={(e) => setKeyStrengths(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5 text-xs">
              <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
              <span>Areas for Improvement (Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Communication in cross-team syncs..."
              value={areasForImprovement}
              onChange={(e) => setAreasForImprovement(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
            />
          </div>
        </div>

        {/* Overall Evaluation Notes / Feedback * */}
        <div>
          <label className="block font-bold text-slate-800 mb-1 text-xs">
            Overall Evaluation Notes / Feedback <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={3}
            placeholder="Provide constructive feedback, key highlights, or growth recommendations (Required)..."
            value={feedbackNotes}
            onChange={(e) => setFeedbackNotes(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
          />
          <p className="text-[11px] text-rose-600 mt-1 font-medium">
            * This feedback is mandatory to complete the evaluation and will be shared with the employee and panel.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Submitting...' : 'Save & Submit Rating'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EmployeePerformanceModal;
