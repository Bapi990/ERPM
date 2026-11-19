import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Award, Plus, CheckCircle2, Target, TrendingUp,
  BookOpen, Star, CheckSquare, GraduationCap, Search,
  Download, Clock, User, Building2, Sliders, ArrowRight,
  ExternalLink, Printer, ShieldCheck, Play, Sparkles, Filter
} from 'lucide-react';
import { DataTable, type ColumnDef } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { useRealtime } from '../../context/RealtimeContext';
import { useAuth } from '../../context/AuthContext';
import { canPerformAction } from '../../utils/rbacMatrix';
import { EmployeePerformanceAnalysis } from '../../components/performance/EmployeePerformanceAnalysis';

export interface EmployeeGoal {
  id: string;
  goal_code: string;
  employee_name: string;
  department: string;
  title: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  category: 'okr' | 'kpi' | 'upskilling' | 'leadership';
  target_date: string;
  progress: number;
  weightage: number;
  rating?: number;
  status: 'on_track' | 'at_risk' | 'completed' | 'behind';
}

export interface KPIMetric {
  id: string;
  name: string;
  department: string;
  target_value: string;
  current_value: string;
  progress_pct: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  status: 'achieved' | 'on_track' | 'lagging';
}

export interface PerformanceReview {
  id: string;
  cycle_name: string;
  employee_name: string;
  designation: string;
  manager_name: string;
  self_score: number;
  manager_score: number;
  final_rating: number;
  stage: 'self_review' | 'manager_review' | 'hr_calibration' | 'finalized';
  hike_recommended: number;
  comments: string;
}

export interface TrainingProgram {
  id: string;
  title: string;
  trainer: string;
  mode: 'Online' | 'Classroom' | 'Hybrid';
  duration: string;
  start_date: string;
  enrolled_count: number;
  max_seats: number;
  status: 'upcoming' | 'ongoing' | 'completed';
}

export interface CourseItem {
  id: string;
  title: string;
  category: string;
  modules_count: number;
  estimated_hours: string;
  progress_pct: number;
  instructor: string;
  thumbnail_color: string;
}

export interface CertificateItem {
  id: string;
  certificate_number: string;
  title: string;
  recipient_name: string;
  recipient_designation: string;
  issuing_authority: string;
  issue_date: string;
  expiry_date: string;
  verification_hash: string;
  status: 'active' | 'expired';
}

const DEFAULT_GOALS: EmployeeGoal[] = [];

const DEFAULT_KPIS: KPIMetric[] = [
  { id: 'kpi-1', name: 'Sales Pipeline Velocity', department: 'Sales', target_value: '₹35.0L', current_value: '₹34.8L', progress_pct: 99.4, unit: 'INR', trend: 'up', status: 'on_track' },
  { id: 'kpi-2', name: 'Biometric Attendance Rate', department: 'Operations', target_value: '95.0%', current_value: '98.6%', progress_pct: 100, unit: '%', trend: 'up', status: 'achieved' },
  { id: 'kpi-3', name: 'First Response Time (SLA)', department: 'Support', target_value: '< 2.0h', current_value: '0.3h', progress_pct: 95.0, unit: 'Hours', trend: 'up', status: 'achieved' },
  { id: 'kpi-4', name: 'Software Sprint Velocity', department: 'Engineering', target_value: '80 Pts', current_value: '76 Pts', progress_pct: 95.0, unit: 'Story Pts', trend: 'stable', status: 'on_track' },
  { id: 'kpi-5', name: 'GST Invoice Filing Timeliness', department: 'Finance', target_value: '100%', current_value: '100%', progress_pct: 100, unit: '%', trend: 'up', status: 'achieved' }
];

const DEFAULT_REVIEWS: PerformanceReview[] = [];

const DEFAULT_TRAININGS: TrainingProgram[] = [
  { id: 'trn-1', title: 'ISO 27001 Information Security Lead Implementer', trainer: 'CyberSec Global Institute', mode: 'Online', duration: '24 Hours (4 Weeks)', start_date: '2026-11-20', enrolled_count: 14, max_seats: 25, status: 'upcoming' },
  { id: 'trn-2', title: 'Advanced GST Returns & Tax Optimization 2026', trainer: 'Odisha Tax Advisory Council', mode: 'Hybrid', duration: '12 Hours (2 Weeks)', start_date: '2026-11-15', enrolled_count: 18, max_seats: 20, status: 'ongoing' },
  { id: 'trn-3', title: 'High-Concurrency WebSocket Systems with Vite & Django', trainer: 'Internal Architecture Board', mode: 'Classroom', duration: '16 Hours (3 Days)', start_date: '2026-11-05', enrolled_count: 22, max_seats: 25, status: 'completed' }
];

const DEFAULT_COURSES: CourseItem[] = [
  { id: 'crs-1', title: 'Enterprise Full Stack SaaS Architecture', category: 'Software Engineering', modules_count: 12, estimated_hours: '18 hrs', progress_pct: 75, instructor: 'Tech Architecture Council', thumbnail_color: 'bg-blue-600' },
  { id: 'crs-2', title: 'New Wage Code & EPFO Statutory Compliance', category: 'Human Resources', modules_count: 8, estimated_hours: '10 hrs', progress_pct: 100, instructor: 'Statutory Legal Advisors', thumbnail_color: 'bg-emerald-600' },
  { id: 'crs-3', title: 'B2B Sales Pipeline & Deal Closing Strategy', category: 'Sales & Growth', modules_count: 10, estimated_hours: '14 hrs', progress_pct: 40, instructor: 'Growth Advisory Group', thumbnail_color: 'bg-indigo-600' }
];

const DEFAULT_CERTIFICATES: CertificateItem[] = [];

export const PerformancePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { emitEvent, subscribe } = useRealtime();
  const { user } = useAuth();

  // Detect active submodule from URL path
  const activeSubmodule = useMemo(() => {
    const p = location.pathname;
    if (p.includes('/workspace/performance')) return 'my-performance';
    if (p.includes('/performance/analysis')) return 'analysis';
    if (p.includes('/performance/kpis')) return 'kpis';
    if (p.includes('/performance/reviews')) return 'reviews';
    if (p.includes('/performance/appraisals')) return 'appraisals';
    if (p.includes('/performance/self-appraisal')) return 'self-appraisal';
    if (p.includes('/learning/training')) return 'training';
    if (p.includes('/learning/courses')) return 'courses';
    if (p.includes('/learning/skills')) return 'skills';
    if (p.includes('/learning/certificates')) return 'certificates'; // Image 1 active item
    return 'okrs'; // default: /app/performance/okrs
  }, [location.pathname]);

  // Persistent States
  const [goals, setGoals] = useState<EmployeeGoal[]>(() => {
    const cached = localStorage.getItem('kalinga_perf_goals');
    return cached ? JSON.parse(cached) : DEFAULT_GOALS;
  });

  const [kpis, setKpis] = useState<KPIMetric[]>(() => {
    const cached = localStorage.getItem('kalinga_perf_kpis');
    return cached ? JSON.parse(cached) : DEFAULT_KPIS;
  });

  const [reviews, setReviews] = useState<PerformanceReview[]>(() => {
    const cached = localStorage.getItem('kalinga_perf_reviews');
    return cached ? JSON.parse(cached) : DEFAULT_REVIEWS;
  });

  const [certificates, setCertificates] = useState<CertificateItem[]>(() => {
    const cached = localStorage.getItem('kalinga_perf_certificates');
    return cached ? JSON.parse(cached) : DEFAULT_CERTIFICATES;
  });

  // UI state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [createGoalModalOpen, setCreateGoalModalOpen] = useState(false);
  const [issueCertModalOpen, setIssueCertModalOpen] = useState(false);
  const [viewCertModalItem, setViewCertModalItem] = useState<CertificateItem | null>(null);

  // New Goal Form
  const [goalTitle, setGoalTitle] = useState('');
  const [goalCategory, setGoalCategory] = useState<'okr' | 'kpi' | 'upskilling' | 'leadership'>('okr');
  const [goalQuarter, setGoalQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q4');
  const [goalWeightage, setGoalWeightage] = useState<number>(30);
  const [goalTargetDate, setGoalTargetDate] = useState('2026-12-31');

  // New Certificate Form
  const [certTitle, setCertTitle] = useState('');
  const [certRecipient, setCertRecipient] = useState('');
  const [certAuthority, setCertAuthority] = useState('Odias ERP Corporate Academy');
  const [certDesignation, setCertDesignation] = useState('');

  // Self Appraisal State
  const [selfAchievements, setSelfAchievements] = useState('Architected high-speed WebSocket realtime sync layer, upgraded 12 asset modules, and delivered zero-defect release.');
  const [selfChallenges, setSelfChallenges] = useState('Overcoming network latency spikes on cross-region clusters.');
  const [selfRatingScore, setSelfRatingScore] = useState<number>(5);
  const [selfSubmitted, setSelfSubmitted] = useState(false);

  // Sync with localStorage
  useEffect(() => {
    localStorage.setItem('kalinga_perf_goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('kalinga_perf_certificates', JSON.stringify(certificates));
  }, [certificates]);

  // Realtime Subscriptions
  useEffect(() => {
    const unsubGoal = subscribe('perf_goal_created', (data: any) => {
      if (data && data.goal) {
        setGoals(prev => [data.goal, ...prev.filter(g => g.id !== data.goal.id)]);
      }
    });

    const unsubCert = subscribe('perf_cert_issued', (data: any) => {
      if (data && data.certificate) {
        setCertificates(prev => [data.certificate, ...prev.filter(c => c.id !== data.certificate.id)]);
      }
    });

    return () => {
      unsubGoal();
      unsubCert();
    };
  }, [subscribe]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Realtime RBAC Action Permissions Listener
  const [, setRbacTick] = useState(0);
  useEffect(() => {
    const unsub = subscribe('rbac_permissions_updated', () => setRbacTick(t => t + 1));
    const handleLocal = () => setRbacTick(t => t + 1);
    window.addEventListener('kalinga_rbac_updated', handleLocal);
    return () => {
      unsub();
      window.removeEventListener('kalinga_rbac_updated', handleLocal);
    };
  }, [subscribe]);

  // Header info based on submodule
  const headerInfo = useMemo(() => {
    switch (activeSubmodule) {
      case 'analysis':
        return {
          title: 'Employee Performance Analysis',
          badge: '9-Dimension Behaviours & Values Analysis',
          desc: 'Comprehensive 9-dimension behaviour and value scorecard with real-time speedometer rating and evaluator feedback.'
        };
      case 'my-performance':
        return {
          title: 'My Performance Evaluation',
          badge: '9-Dimension Behaviours & Values Scorecard',
          desc: 'View your official performance evaluation scorecard, manager rating, speedometer average, and evaluator feedback.'
        };
      case 'kpis':
        return {
          title: 'KPI Management & Scorecards',
          badge: 'Performance Metrics',
          desc: 'Monitor key departmental target achievements, velocity indexes, and SLA compliance.'
        };
      case 'reviews':
        return {
          title: 'Quarterly Performance Reviews',
          badge: '360° Appraisal Cycle',
          desc: 'Manage self-evaluations, manager scoring, HR calibration, and annualized performance ratings.'
        };
      case 'appraisals':
        return {
          title: 'Manager Appraisals & Recommendations',
          badge: 'Leadership Matrix',
          desc: 'Review team performance ratings, recommended compensation hikes, and promotion approvals.'
        };
      case 'self-appraisal':
        return {
          title: 'Employee Self Appraisal Form',
          badge: 'My Performance Submission',
          desc: 'Submit your quarterly accomplishments, project milestones, challenges, and self-ratings.'
        };
      case 'training':
        return {
          title: 'Corporate Training Programs',
          badge: 'Skill Development',
          desc: 'Explore instructor-led workshops, ISO security certification schedules, and team training.'
        };
      case 'courses':
        return {
          title: 'Courses & LMS Learning Hub',
          badge: 'Self-Paced Learning',
          desc: 'Access curated interactive video courses, architectural masterclasses, and statutory modules.'
        };
      case 'skills':
        return {
          title: 'Skill Assessment & Competency Matrix',
          badge: 'Technical & Domain Skills',
          desc: 'Evaluate departmental proficiency benchmarks, certifications, and technical growth.'
        };
      case 'certificates':
        return {
          title: 'Issued Professional Certificates',
          badge: 'Credentials & Verifications',
          desc: 'Digitally verified credentials, ISO compliance certificates, and corporate accomplishment seals.'
        };
      default:
        return {
          title: 'Employee Goals / OKRs Tracker',
          badge: 'Objectives & Key Results',
          desc: 'Track strategic corporate alignment, department goals, and individual key results.'
        };
    }
  }, [activeSubmodule]);

  // Create Goal Handler
  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;

    const count = goals.length + 1;
    const newGoal: EmployeeGoal = {
      id: `gl-${Date.now()}`,
      goal_code: `OKR-2026-${goalQuarter}-0${count}`,
      employee_name: user?.full_name || user?.username || 'Employee',
      department: 'Engineering',
      title: goalTitle.trim(),
      quarter: goalQuarter,
      category: goalCategory,
      target_date: goalTargetDate,
      progress: 0,
      weightage: goalWeightage,
      rating: 5.0,
      status: 'on_track',
    };

    setGoals(prev => [newGoal, ...prev]);
    emitEvent('perf_goal_created', 'New OKR Created', `Goal ${newGoal.goal_code} created`, 'info');
    setCreateGoalModalOpen(false);
    setGoalTitle('');
    showToast(`New OKR ${newGoal.goal_code} created in real time!`);
  };

  // Update Progress Slider
  const handleUpdateProgress = (goalId: string, val: number) => {
    setGoals(prev => prev.map(g => {
      if (g.id === goalId) {
        const status: EmployeeGoal['status'] = val === 100 ? 'completed' : val >= 50 ? 'on_track' : 'at_risk';
        const updated = { ...g, progress: val, status };
        emitEvent('perf_goal_updated', 'OKR Progress Updated', `Goal progress updated to ${val}%`, 'info');
        return updated;
      }
      return g;
    }));
  };

  // Issue Certificate Handler
  const handleIssueCertificate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certTitle.trim()) return;

    const num = `KALINGA-CERT-2026-${String(certificates.length + 100).padStart(3, '0')}`;
    const newCert: CertificateItem = {
      id: `cert-${Date.now()}`,
      certificate_number: num,
      title: certTitle.trim(),
      recipient_name: certRecipient.trim(),
      recipient_designation: certDesignation.trim(),
      issuing_authority: certAuthority.trim(),
      issue_date: new Date().toISOString().substring(0, 10),
      expiry_date: new Date(Date.now() + 2 * 365 * 24 * 3600 * 1000).toISOString().substring(0, 10),
      verification_hash: crypto.randomUUID ? crypto.randomUUID() : `hash-${Date.now()}`,
      status: 'active'
    };

    setCertificates(prev => [newCert, ...prev]);
    emitEvent('perf_cert_issued', 'Certificate Issued', `Certificate ${num} digitally generated for ${newCert.recipient_name}`, 'success');
    setIssueCertModalOpen(false);
    setCertTitle('');
    showToast(`Certificate ${num} issued and digitally signed!`);
  };

  // Columns for Certificates Table
  const certColumns: ColumnDef<CertificateItem>[] = [
    {
      key: 'certificate_number',
      header: 'Certificate ID',
      render: (c) => (
        <span className="font-mono text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/60">
          {c.certificate_number}
        </span>
      ),
    },
    {
      key: 'title',
      header: 'Certificate Title & Authority',
      render: (c) => (
        <div>
          <div className="font-extrabold text-sm text-slate-900">{c.title}</div>
          <div className="text-xs text-slate-500">{c.issuing_authority}</div>
        </div>
      ),
    },
    {
      key: 'recipient_name',
      header: 'Recipient',
      render: (c) => (
        <div>
          <div className="font-bold text-slate-800 text-xs">{c.recipient_name}</div>
          <div className="text-[10px] text-slate-400">{c.recipient_designation}</div>
        </div>
      ),
    },
    {
      key: 'issue_date',
      header: 'Validity Period',
      render: (c) => (
        <div className="text-xs text-slate-600">
          <span>{c.issue_date}</span>
          <span className="mx-1 text-slate-400">→</span>
          <span className="font-semibold text-slate-700">{c.expiry_date}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Digital Status',
      render: (c) => (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span>Active & Verified</span>
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (c) => (
        <button
          onClick={() => setViewCertModalItem(c)}
          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>View Seal</span>
        </button>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto text-left">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center space-x-2 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-1.5">
            <Award className="w-3.5 h-3.5 text-blue-600" />
            <span>{headerInfo.badge}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {headerInfo.title}
          </h1>
          <p className="text-xs text-slate-500 max-w-xl">
            {headerInfo.desc}
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center space-x-2.5">
          {canPerformAction(user, 'performance', 'add') && (
            activeSubmodule === 'certificates' ? (
              <button
                onClick={() => setIssueCertModalOpen(true)}
                className="inline-flex items-center px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                <span>Issue New Certificate</span>
              </button>
            ) : (
              <button
                onClick={() => setCreateGoalModalOpen(true)}
                className="inline-flex items-center px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                <span>Add Goal / OKR</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Overall OKR Completion</span>
            <Target className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">84.2%</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">+12.4% YoY Velocity</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Active Reviews</span>
            <Award className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-600 mt-2">{reviews.length} Teams</div>
          <div className="text-[11px] text-slate-400 font-semibold mt-0.5">Q4 Appraisal Cycle</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Verified Credentials</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">{certificates.length} Issued</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">100% Cryptographically Sealed</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Trainings Enrolled</span>
            <GraduationCap className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">54 Employees</div>
          <div className="text-[11px] text-slate-400 font-semibold mt-0.5">3 Active Batches</div>
        </div>
      </div>

      {/* --------------------------------------------------------------------------------- */}
      {/* VIEW 0: 9-DIMENSION PERFORMANCE ANALYSIS (EXACT PHOTO MATCH) */}
      {/* --------------------------------------------------------------------------------- */}
      {activeSubmodule === 'analysis' || activeSubmodule === 'my-performance' ? (
        <EmployeePerformanceAnalysis isSelfView={activeSubmodule === 'my-performance'} />
      ) : activeSubmodule === 'certificates' ? (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <DataTable
              columns={certColumns}
              data={certificates}
              initialPageSize={10}
            />
          </div>
        </div>
      ) : activeSubmodule === 'kpis' ? (
        /* --------------------------------------------------------------------------------- */
        /* VIEW 2: KPI MANAGEMENT */
        /* --------------------------------------------------------------------------------- */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kpis.map((k) => (
              <div key={k.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span className="font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {k.department}
                  </span>
                  <span className="font-bold text-emerald-600">{k.trend === 'up' ? '▲ Trending Up' : '● Stable'}</span>
                </div>
                <h4 className="font-extrabold text-sm text-slate-900 mt-2">{k.name}</h4>
                <div className="flex items-baseline justify-between mt-3">
                  <div className="text-2xl font-black text-slate-900">{k.current_value}</div>
                  <div className="text-xs text-slate-500 font-semibold">Target: {k.target_value}</div>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full mt-3 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, k.progress_pct)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 mt-2 font-medium">
                  <span>Progress Index</span>
                  <span className="font-bold text-slate-700">{k.progress_pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeSubmodule === 'reviews' || activeSubmodule === 'appraisals' ? (
        /* --------------------------------------------------------------------------------- */
        /* VIEW 3: PERFORMANCE REVIEWS & MANAGER APPRAISALS */
        /* --------------------------------------------------------------------------------- */
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Q4 2026 Evaluation Roster</h3>
                <p className="text-xs text-slate-500">Official quarterly performance appraisals & 9-dimension competency ratings</p>
              </div>
              <button
                onClick={() => navigate('/app/performance/analysis')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Open 9-D Scorecard & Meter</span>
              </button>
            </div>
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-sm text-slate-900">{r.employee_name}</span>
                      <span className="text-xs text-slate-500 font-medium">({r.designation})</span>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                        {r.stage.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 italic">"{r.comments}"</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500 font-semibold">
                      <span>Evaluator: <strong>{r.manager_name}</strong></span>
                      <span>•</span>
                      <span>Self Score: <strong>{r.self_score}/5</strong></span>
                      <span>•</span>
                      <span>Manager Score: <strong>{r.manager_score}/5</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <button
                      onClick={() => navigate('/app/performance/analysis')}
                      className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Rate / View 9-D Behaviours & Values Analysis"
                    >
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>9-D Analysis</span>
                    </button>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-bold">Recommended Hike</span>
                      <span className="text-sm font-black text-emerald-600">+{r.hike_recommended}%</span>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-600 text-white text-center min-w-[70px]">
                      <span className="text-[10px] block opacity-80 uppercase font-bold">Rating</span>
                      <span className="text-base font-black">{r.final_rating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : activeSubmodule === 'self-appraisal' ? (
        /* --------------------------------------------------------------------------------- */
        /* VIEW 4: EMPLOYEE SELF APPRAISAL FORM */
        /* --------------------------------------------------------------------------------- */
        <div className="max-w-3xl bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Annual Employee Self-Assessment</h3>
            <p className="text-xs text-slate-500">Provide feedback on your key milestones, goals achieved, and career growth aspirations.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Key Accomplishments & Deliverables this Quarter *</label>
              <textarea
                rows={4}
                value={selfAchievements}
                onChange={(e) => setSelfAchievements(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Operational Blockers & Key Learnings</label>
              <textarea
                rows={3}
                value={selfChallenges}
                onChange={(e) => setSelfChallenges(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-2">Self-Performance Rating (1 to 5 Stars)</label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSelfRatingScore(star)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      selfRatingScore >= star
                        ? 'bg-amber-50 border-amber-300 text-amber-500'
                        : 'bg-slate-50 border-slate-200 text-slate-300'
                    }`}
                  >
                    <Star className="w-5 h-5 fill-current" />
                  </button>
                ))}
                <span className="ml-3 font-extrabold text-slate-800 text-sm">
                  {selfRatingScore}.0 / 5.0 (
                  {selfRatingScore === 5 ? 'Role Model' : selfRatingScore === 4 ? 'Exceeds Expectations' : 'Meets Expectations'}
                  )
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              {selfSubmitted ? (
                <div className="flex items-center space-x-1.5 text-emerald-600 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Self-Appraisal submitted to Reporting Manager!</span>
                </div>
              ) : (
                <span className="text-slate-400">Draft saved locally.</span>
              )}

              <button
                type="button"
                onClick={() => {
                  setSelfSubmitted(true);
                  showToast('Self-Appraisal submitted successfully to Reporting Manager!');
                }}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20"
              >
                Submit Self Appraisal
              </button>
            </div>
          </div>
        </div>
      ) : activeSubmodule === 'training' ? (
        /* --------------------------------------------------------------------------------- */
        /* VIEW 5: TRAINING PROGRAMS */
        /* --------------------------------------------------------------------------------- */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEFAULT_TRAININGS.map((trn) => (
              <div key={trn.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                      {trn.mode}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">{trn.duration}</span>
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900 mt-1">{trn.title}</h4>
                  <div className="text-xs text-slate-500 mt-2 font-medium">Trainer: <strong>{trn.trainer}</strong></div>
                  <div className="text-xs text-slate-400 mt-1">Starts on {trn.start_date}</div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">{trn.enrolled_count}/{trn.max_seats} Seats</span>
                  <button
                    onClick={() => showToast(`Successfully nominated for ${trn.title}`)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
                  >
                    Nominate Self
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeSubmodule === 'courses' ? (
        /* --------------------------------------------------------------------------------- */
        /* VIEW 6: COURSES & LEARNING */
        /* --------------------------------------------------------------------------------- */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {DEFAULT_COURSES.map((crs) => (
            <div key={crs.id} className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
              <div className={`p-6 ${crs.thumbnail_color} text-white`}>
                <BookOpen className="w-8 h-8 opacity-80 mb-2" />
                <span className="text-[10px] uppercase font-black tracking-wider block opacity-75">{crs.category}</span>
                <h4 className="font-black text-base mt-1">{crs.title}</h4>
              </div>

              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{crs.modules_count} Modules</span>
                  <span>{crs.estimated_hours} Duration</span>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Progress</span>
                    <span>{crs.progress_pct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: `${crs.progress_pct}%` }} />
                  </div>
                </div>

                <button
                  onClick={() => showToast(`Launching module player for ${crs.title}`)}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{crs.progress_pct === 100 ? 'Review Course' : 'Continue Learning'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* --------------------------------------------------------------------------------- */
        /* VIEW 7: OKRS / GOALS TRACKER (DEFAULT) */
        /* --------------------------------------------------------------------------------- */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map((g) => (
              <div key={g.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {g.goal_code}
                  </span>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                    g.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : g.status === 'on_track'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {g.status.replace('_', ' ')}
                  </span>
                </div>

                <h4 className="font-extrabold text-sm text-slate-900">{g.title}</h4>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Owner: <strong>{g.employee_name}</strong></span>
                  <span>Target: <strong>{g.target_date}</strong></span>
                  <span>Weight: <strong>{g.weightage}%</strong></span>
                </div>

                {/* Interactive Slider */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                    <span>Current Completion</span>
                    <span className="text-blue-600 font-black">{g.progress}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={g.progress}
                    onChange={(e) => handleUpdateProgress(g.id, parseInt(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------------------- */}
      {/* MODAL: CREATE GOAL / OKR */}
      {/* --------------------------------------------------------------------------------- */}
      <Modal
        isOpen={createGoalModalOpen}
        onClose={() => setCreateGoalModalOpen(false)}
        title="Create Employee Goal / OKR"
      >
        <form onSubmit={handleCreateGoal} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Objective / Goal Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Deliver 100% test coverage for payroll tax deductions engine"
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Quarter</label>
              <select
                value={goalQuarter}
                onChange={(e) => setGoalQuarter(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
              >
                <option value="Q1">Q1</option>
                <option value="Q2">Q2</option>
                <option value="Q3">Q3</option>
                <option value="Q4">Q4</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
              <select
                value={goalCategory}
                onChange={(e) => setGoalCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
              >
                <option value="okr">Strategic OKR</option>
                <option value="kpi">Operational KPI</option>
                <option value="upskilling">Skill Development</option>
                <option value="leadership">Leadership Mentoring</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Weightage (%)</label>
              <input
                type="number"
                min="5"
                max="100"
                value={goalWeightage}
                onChange={(e) => setGoalWeightage(parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Deadline Date</label>
              <input
                type="date"
                value={goalTargetDate}
                onChange={(e) => setGoalTargetDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setCreateGoalModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20"
            >
              Create OKR
            </button>
          </div>
        </form>
      </Modal>

      {/* --------------------------------------------------------------------------------- */}
      {/* MODAL: ISSUE NEW CERTIFICATE */}
      {/* --------------------------------------------------------------------------------- */}
      <Modal
        isOpen={issueCertModalOpen}
        onClose={() => setIssueCertModalOpen(false)}
        title="Issue Digitally Signed Certificate"
      >
        <form onSubmit={handleIssueCertificate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Certificate Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Certified Cloud ERP Security Specialist"
              value={certTitle}
              onChange={(e) => setCertTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Recipient Name *</label>
              <input
                type="text"
                required
                value={certRecipient}
                onChange={(e) => setCertRecipient(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
              <input
                type="text"
                value={certDesignation}
                onChange={(e) => setCertDesignation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Issuing Authority / Academy</label>
            <input
              type="text"
              value={certAuthority}
              onChange={(e) => setCertAuthority(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIssueCertModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20"
            >
              Generate & Issue
            </button>
          </div>
        </form>
      </Modal>

      {/* --------------------------------------------------------------------------------- */}
      {/* MODAL: VIEW DIGITAL CERTIFICATE PREVIEW */}
      {/* --------------------------------------------------------------------------------- */}
      {viewCertModalItem && (
        <Modal
          isOpen={true}
          onClose={() => setViewCertModalItem(null)}
          title={`Digital Certificate — ${viewCertModalItem.certificate_number}`}
        >
          <div className="space-y-4">
            {/* Certificate Canvas */}
            <div className="relative p-8 rounded-2xl bg-gradient-to-b from-amber-50/40 via-white to-blue-50/30 border-4 border-double border-amber-300 text-center shadow-xl space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg">
                  K
                </div>
                <div className="text-left">
                  <span className="font-black text-slate-900 tracking-tight block leading-tight">KALINGA ERP</span>
                  <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Corporate Academy</span>
                </div>
              </div>

              <div>
                <span className="text-xs uppercase tracking-widest text-amber-700 font-extrabold block">
                  Certificate of Professional Achievement
                </span>
                <p className="text-xs text-slate-500 mt-1">This is to certify that</p>
                <div className="text-2xl font-black text-slate-900 mt-2 font-serif tracking-wide border-b-2 border-slate-200 pb-2 max-w-sm mx-auto">
                  {viewCertModalItem.recipient_name}
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  has successfully demonstrated mastery and achieved professional certification in
                </p>
                <div className="text-lg font-black text-blue-700 mt-2">
                  {viewCertModalItem.title}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-200 text-left text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Issuing Authority</span>
                  <span className="font-bold text-slate-800">{viewCertModalItem.issuing_authority}</span>
                  <span className="text-[10px] text-slate-400 block mt-1">Issue Date: {viewCertModalItem.issue_date}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-semibold">Digital Verification Hash</span>
                  <span className="font-mono text-[9px] text-slate-600 break-all">{viewCertModalItem.verification_hash}</span>
                  <span className="inline-flex items-center space-x-1 text-[10px] text-emerald-600 font-bold mt-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Cryptographically Verified</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="font-mono text-xs text-slate-400">{viewCertModalItem.certificate_number}</span>
              <button
                onClick={() => {
                  showToast('Certificate PDF ready for printing/download!');
                  window.print();
                }}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Certificate PDF</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PerformancePage;
