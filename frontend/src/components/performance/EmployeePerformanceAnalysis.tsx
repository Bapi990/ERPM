import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, Star, User, Shield, Calendar, Clock,
  Target, Briefcase, Lightbulb, Users, Heart, Puzzle,
  MessageSquare, Sparkles, Building2, ChevronDown,
  CheckCircle2, AlertCircle, ThumbsUp, ArrowRight, UserPlus
} from 'lucide-react';
import { ScoreMeterGauge } from './ScoreMeterGauge';
import { EmployeePerformanceModal } from './EmployeePerformanceModal';
import {
  DIMENSIONS_CONFIG,
  type EmployeePerformanceEvaluation,
  type DimensionScores
} from '../../types/performance';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import { api } from '../../api/client';
import { Link } from 'react-router-dom';

interface EmployeePerformanceAnalysisProps {
  initialEmployeeId?: string;
  isSelfView?: boolean;
}

// Initial realistic default evaluations (empty for zero fake data)
const INITIAL_DEMO_EVALUATIONS: EmployeePerformanceEvaluation[] = [];

export const EmployeePerformanceAnalysis: React.FC<EmployeePerformanceAnalysisProps> = ({
  initialEmployeeId,
  isSelfView = false,
}) => {
  const { user } = useAuth();
  const { subscribe } = useRealtime();

  const [evaluations, setEvaluations] = useState<EmployeePerformanceEvaluation[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>(initialEmployeeId || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableEmployees, setAvailableEmployees] = useState<any[]>([]);

  // Load evaluations from localStorage
  const loadEvaluations = () => {
    try {
      const stored = localStorage.getItem('gb_employee_performance_evaluations');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const realEvals = parsed.filter(ev => ev.evaluatorId !== 'hr-sarah' && ev.evaluatorId !== 'mgr-rahul' && ev.employeeName !== 'Binayak Prasad Sethy');
          setEvaluations(realEvals);
          return;
        }
      }
      setEvaluations([]);
    } catch (e) {
      setEvaluations([]);
    }
  };

  // Load employees from system/API
  const loadEmployees = async () => {
    try {
      const res = await api.getEmployees().catch(() => ({ results: [] }));
      const list = res.results || res || [];
      const cleanList = list.filter((e: any) => !e.email?.includes('greenbacks.corp') && !e.email?.includes('binayak@example.com'));
      if (cleanList.length > 0) {
        const mapped = cleanList.map((e: any) => ({
          id: e.id,
          name: e.full_name || `${e.first_name || ''} ${e.last_name || ''}`.trim(),
          employee_code: e.employee_id || `EMP-${e.id}`,
          role_name: e.role_name || e.designation_title || 'Staff',
          department_name: e.department_name || 'General',
          branch_name: e.branch_name || 'Main Office',
          shift_name: e.shift_name || 'Day Shift',
          assigned_hr: e.assigned_hr_name || 'Super Admin',
          joined_date: e.date_of_joining || ''
        }));
        setAvailableEmployees(mapped);
        setSelectedEmpId((prev) => prev || mapped[0]?.id || '');
        return;
      }
    } catch (e) {}

    setAvailableEmployees([]);
  };

  useEffect(() => {
    loadEvaluations();
    loadEmployees();

    const handleEvaluationUpdated = (e: any) => {
      loadEvaluations();
    };

    window.addEventListener('odias_performance_evaluated', handleEvaluationUpdated);
    window.addEventListener('storage', loadEvaluations);

    const unsub = subscribe('employee_performance_evaluated', () => {
      loadEvaluations();
    });

    return () => {
      window.removeEventListener('odias_performance_evaluated', handleEvaluationUpdated);
      window.removeEventListener('storage', loadEvaluations);
      unsub();
    };
  }, []);

  // Determine current employee
  const currentEmployee = useMemo(() => {
    if (isSelfView && user) {
      const selfName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username;
      const found = availableEmployees.find(e =>
        e.id === user.id ||
        e.name?.toLowerCase() === selfName.toLowerCase() ||
        e.employee_code === user.employee_id
      );
      if (found) return found;
      return {
        id: user.id || 'emp-self',
        name: selfName,
        employee_code: user.employee_id || 'ODS-EMP-001',
        role_name: (user as any)?.role_name || user.role_code || 'Staff',
        department_name: (user as any)?.department_name || 'General Operations',
        branch_name: 'Main Branch',
        shift_name: 'Day shift',
        assigned_hr: 'Super Admin',
        joined_date: new Date().toISOString().split('T')[0]
      };
    }

    if (!availableEmployees || availableEmployees.length === 0) {
      return {
        id: '',
        name: 'No Employees Added',
        employee_code: '---',
        role_name: 'None',
        department_name: 'None',
        branch_name: 'None',
        shift_name: 'None',
        assigned_hr: 'None',
        joined_date: '---'
      };
    }

    return (
      availableEmployees.find(e => e.id === selectedEmpId) ||
      availableEmployees[0]
    );
  }, [availableEmployees, selectedEmpId, isSelfView, user]);

  // Current employee's latest evaluation
  const activeEvaluation = useMemo(() => {
    return evaluations.find(
      ev =>
        ev.employeeId === currentEmployee.id ||
        ev.employeeName?.toLowerCase() === currentEmployee.name?.toLowerCase()
    ) || null;
  }, [evaluations, currentEmployee]);

  const scores: DimensionScores = activeEvaluation?.scores || {
    focus_results: 0.0,
    work_discipline: 0.0,
    accountability: 0.0,
    punctuality: 0.0,
    innovation: 0.0,
    teamwork: 0.0,
    respect_openness: 0.0,
    problem_solving: 0.0,
    communication: 0.0
  };

  const overallScore = activeEvaluation ? activeEvaluation.overallScore : 0.0;

  const canEvaluate = useMemo(() => {
    if (!user) return false;
    // HR, Managers, and Super Admin can evaluate
    return ['super_admin', 'hr_manager', 'manager'].includes(user.role_code);
  }, [user]);

  const getDimensionIcon = (iconName: string) => {
    switch (iconName) {
      case 'Target':
        return (
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200/60">
            <Target className="w-4 h-4" />
          </div>
        );
      case 'Briefcase':
        return (
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200/60">
            <Briefcase className="w-4 h-4" />
          </div>
        );
      case 'Shield':
        return (
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-200/60">
            <Shield className="w-4 h-4" />
          </div>
        );
      case 'Clock':
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/60">
            <Clock className="w-4 h-4" />
          </div>
        );
      case 'Lightbulb':
        return (
          <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0 border border-pink-200/60">
            <Lightbulb className="w-4 h-4" />
          </div>
        );
      case 'Users':
        return (
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-200/60">
            <Users className="w-4 h-4" />
          </div>
        );
      case 'Heart':
        return (
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200/60">
            <Heart className="w-4 h-4" />
          </div>
        );
      case 'Puzzle':
        return (
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-200/60">
            <Puzzle className="w-4 h-4" />
          </div>
        );
      case 'MessageSquare':
        return (
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-200/60">
            <MessageSquare className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Star className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* 1. TOP HEADER: EMPLOYEE PERFORMANCE ANALYSIS (Matching Image 2) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
              EMPLOYEE PERFORMANCE ANALYSIS
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Comprehensive 9-dimension Behaviours & Values Evaluation Dashboard
          </p>
        </div>

        {canEvaluate && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md shadow-amber-400/25 transition-all cursor-pointer hover:shadow-lg active:scale-98"
          >
            <Star className="w-4 h-4 fill-slate-950 text-slate-950" />
            <span>Rate Your Employee</span>
          </button>
        )}
      </div>

      {/* 2. EMPLOYEE PROFILE BANNER (Matching Image 2) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Avatar & Meta */}
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            {currentEmployee.name
              ? currentEmployee.name
                  .split(' ')
                  .map((n: string) => n[0])
                  .slice(0, 2)
                  .join('')
              : 'EMP'}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                {currentEmployee.name}
              </h2>
              {availableEmployees.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                  Active
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
              <span>{currentEmployee.role_name || 'Staff'}</span>
              <span>•</span>
              <span>{currentEmployee.department_name || 'General'}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                {currentEmployee.branch_name || 'Main Branch'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {currentEmployee.shift_name || 'Day shift'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Assigned HR, Joined Date & Employee Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-xs border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
          {!isSelfView && availableEmployees.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs font-bold">Select Staff:</span>
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-800 outline-none focus:border-blue-500 shadow-2xs"
              >
                {availableEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.role_name || emp.designation || 'Staff'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1 text-slate-500 font-medium text-right sm:text-left">
            <div className="flex items-center sm:justify-end gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Assigned HR: <strong>{currentEmployee.assigned_hr || 'Direct / Admin'}</strong></span>
            </div>
            <div className="flex items-center sm:justify-end gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Joined: <strong>{currentEmployee.joined_date || '---'}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BLUE SECTION CONTAINER (Matching Image 2) */}
      <div className="rounded-2xl border border-blue-600/30 overflow-hidden shadow-md">
        {/* Blue Header Bar */}
        <div className="bg-blue-600 text-white p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-xs sm:text-sm tracking-wide uppercase">
              EMPLOYEE PERFORMANCE: BEHAVIOURS & VALUES ANALYSIS
            </span>
          </div>

          {canEvaluate && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-xs transition-all cursor-pointer active:scale-98"
            >
              <Star className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
              <span>Rate Employee Now</span>
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="bg-white p-5 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Col: Gauge Meter (4 Cols) */}
            <div className="lg:col-span-4 w-full">
              <ScoreMeterGauge
                score={overallScore}
                evaluatorName={activeEvaluation?.evaluatorName}
                evaluatorRole={activeEvaluation?.evaluatorRole}
                evaluatedAt={activeEvaluation?.evaluatedAt}
                onRateClick={() => setIsModalOpen(true)}
                canRate={canEvaluate}
              />
            </div>

            {/* Right Col: 3x3 Grid of 9 Dimensions (8 Cols) */}
            <div className="lg:col-span-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {DIMENSIONS_CONFIG.map((dim) => {
                  const scoreVal = scores[dim.key] || 0.0;
                  return (
                    <div
                      key={dim.key}
                      className="bg-slate-50/60 p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-blue-400 hover:bg-white transition-all flex flex-col justify-between space-y-3 group"
                    >
                      <div>
                        {/* Header: Icon + Title + Score */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            {getDimensionIcon(dim.iconName)}
                            <span className="font-extrabold text-xs text-slate-900 group-hover:text-blue-600 transition-colors">
                              {dim.title}
                            </span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-lg text-xs font-black font-mono border ${dim.badgeBg} ${dim.badgeText} border-slate-200/80 shrink-0`}
                          >
                            {scoreVal.toFixed(1)} ★
                          </span>
                        </div>

                        {/* Description matching exact text */}
                        <p className="text-[11px] text-slate-500 leading-relaxed font-sans pt-2">
                          {dim.description}
                        </p>
                      </div>

                      {/* Mini progress bar under card */}
                      <div className="w-full bg-slate-200/70 h-1 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-500"
                          style={{ width: `${(scoreVal / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 4. BOTTOM CALLOUT: Overall Evaluation Notes / Feedback * (Matching Image 2) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border-l-4 border-l-blue-600 border border-slate-200/80 space-y-3">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span className="font-extrabold text-xs text-slate-900">
                Overall Evaluation Notes / Feedback <span className="text-rose-500">*</span>
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed italic pl-6">
              {activeEvaluation?.feedbackNotes ||
                'Pending evaluator remarks. Feedback will appear here once the evaluation is submitted.'}
            </p>

            {(activeEvaluation?.keyStrengths || activeEvaluation?.areasForImprovement) && (
              <div className="pl-6 pt-2 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {activeEvaluation.keyStrengths && (
                  <div className="flex items-start space-x-2">
                    <ThumbsUp className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px]">Key Strengths:</span>
                      <span className="text-slate-600 text-[11px]">{activeEvaluation.keyStrengths}</span>
                    </div>
                  </div>
                )}
                {activeEvaluation.areasForImprovement && (
                  <div className="flex items-start space-x-2">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px]">Areas for Improvement:</span>
                      <span className="text-slate-600 text-[11px]">{activeEvaluation.areasForImprovement}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RATING MODAL */}
      <EmployeePerformanceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        employee={currentEmployee}
        initialEvaluation={activeEvaluation}
        onSaveSuccess={(newEval) => {
          setEvaluations((prev) => [
            newEval,
            ...prev.filter((e) => e.employeeId !== newEval.employeeId),
          ]);
        }}
      />
    </div>
  );
};

export default EmployeePerformanceAnalysis;
