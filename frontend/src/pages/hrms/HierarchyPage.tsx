import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Users, Award, ArrowUpCircle, CheckCircle2, ChevronRight,
  Shield, Building2, Briefcase, Mail, Phone, Sparkles, Filter,
  Search, TrendingUp, Layers, Check, ArrowRight, UserCheck, Clock,
  RefreshCw, ZoomIn, ZoomOut, Maximize2, RotateCcw, User, Info,
  ChevronDown, ExternalLink, PlusCircle, LayoutGrid, Network, Eye,
  Trash2, Undo2, AlertTriangle, X, ShieldAlert, Calendar, DollarSign, Star,
  MessageSquare, ThumbsUp, Target, Heart, Puzzle, UserPlus
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { Modal } from '../../components/common/Modal';
import { useRealtime } from '../../context/RealtimeContext';
import { useAuth } from '../../context/AuthContext';
import type { Employee } from '../../types';
import { EmployeePerformanceModal } from '../../components/performance/EmployeePerformanceModal';
import { DIMENSIONS_CONFIG, type EmployeePerformanceEvaluation } from '../../types/performance';

interface DeletedRecord {
  id: string;
  name: string;
  deleted_at: number; // timestamp in ms
}

type ViewMode = 'tree' | 'cards';

export const HierarchyPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { emitEvent, subscribe } = useRealtime();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [activeHrFilter, setActiveHrFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('tree');

  // Deleted records tracked for 24-hour grace period display in RED
  const [deletedRecords, setDeletedRecords] = useState<Record<string, DeletedRecord>>(() => {
    try {
      const saved = localStorage.getItem('gb_deleted_employees_hierarchy');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Modals
  const [detailModalEmp, setDetailModalEmp] = useState<any | null>(null);
  const [performanceModalEmp, setPerformanceModalEmp] = useState<any | null>(null);
  const [promoteModalOpen, setPromoteModalOpen] = useState(false);
  const [selectedEmpForPromote, setSelectedEmpForPromote] = useState<any | null>(null);
  const [confirmDeleteEmp, setConfirmDeleteEmp] = useState<any | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedManagerForAssign, setSelectedManagerForAssign] = useState<any | null>(null);
  const [newAssociateName, setNewAssociateName] = useState('');
  const [newAssociatePosition, setNewAssociatePosition] = useState('Frontend React Engineer');
  const [newAssociateRoleCode, setNewAssociateRoleCode] = useState<string>('employee');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Promotion Form
  const [newDesignation, setNewDesignation] = useState('Lead Engineering Manager');
  const [newDepartment, setNewDepartment] = useState('Software Engineering & Cloud');
  const [salaryHikePercent, setSalaryHikePercent] = useState(25);
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);

  // Realtime Evaluation Version Tracker
  const [evalVersion, setEvalVersion] = useState(0);

  useEffect(() => {
    const handleEvalChange = () => setEvalVersion((v) => v + 1);
    window.addEventListener('odias_performance_evaluated', handleEvalChange);
    window.addEventListener('storage', handleEvalChange);
    const unsub = subscribe('employee_performance_evaluated', handleEvalChange);
    return () => {
      window.removeEventListener('odias_performance_evaluated', handleEvalChange);
      window.removeEventListener('storage', handleEvalChange);
      if (unsub) unsub();
    };
  }, []);

  const treeContainerRef = useRef<HTMLDivElement>(null);

  // Sync deleted records to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('gb_deleted_employees_hierarchy', JSON.stringify(deletedRecords));
    } catch (e) {
      console.error('Failed to sync deleted employees cache:', e);
    }
  }, [deletedRecords]);

  // Initial fetch and WebSocket subscriptions
  useEffect(() => {
    loadRealEmployees();
    const unsub1 = subscribe('employee_*', () => loadRealEmployees());
    const unsub2 = subscribe('employee.*', () => loadRealEmployees());
    const unsub3 = subscribe('department:*', () => loadRealEmployees());
    const unsub4 = subscribe('designation:*', () => loadRealEmployees());
    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
    };
  }, []);

  const loadRealEmployees = async () => {
    setLoading(true);
    try {
      const data = await api.getEmployees().catch(() => ({ results: [] }));
      const rawList: Employee[] = data.results || data || [];
      const cleanList = rawList.filter((e: any) => !e.email?.includes('greenbacks.corp') && !e.email?.includes('binayak@example.com'));
      setEmployees(cleanList);
    } catch (err) {
      console.warn('Failed to load employees for hierarchy tree:', err);
      const cached = localStorage.getItem('kalinga_hrms_employees');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            setEmployees(parsed.filter((e: any) => !e.email?.includes('greenbacks.corp') && !e.email?.includes('binayak@example.com')));
          }
        } catch (e) {
          setEmployees([]);
        }
      } else {
        setEmployees([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Check if an employee is deleted within 24 hours vs purged after 24h
  const getDeletionStatus = (empId: string) => {
    const rec = deletedRecords[empId];
    if (!rec) return null;
    const now = Date.now();
    const elapsedMs = now - rec.deleted_at;
    const hoursElapsed = elapsedMs / (1000 * 60 * 60);

    // After 1 day (24 hours), it is permanently removed!
    if (hoursElapsed >= 24) {
      return { isPurged: true, hoursRemaining: 0 };
    }
    const hoursRemaining = Math.max(1, Math.round(24 - hoursElapsed));
    return { isPurged: false, hoursRemaining, deleted_at: rec.deleted_at };
  };

  // =========================================================
  // DYNAMICALLY BUILD REAL HIERARCHY TREE FROM DATABASE
  // Level 1: Super Admin Root
  // Level 2: HR Leaders
  // Level 3: Department Managers
  // Level 4: Assigned Employees
  // =========================================================

  const hierarchyData = useMemo(() => {
    // Exclude employees that have been deleted for more than 24 hours
    const activeAndGraceList = employees.filter((emp) => {
      const del = getDeletionStatus(emp.id);
      if (del && del.isPurged) return false;
      return true;
    });

    // 1. Root CEO / Super Admin
    const ceo = activeAndGraceList.find(
      (e) => e.role_code === 'super_admin' || e.designation_title?.toLowerCase().includes('chief executive')
    ) || {
      id: 'root-superadmin',
      first_name: 'Super',
      last_name: 'Admin',
      full_name: 'Super Admin',
      designation_title: 'Super Admin & Organization Head',
      department_name: 'Executive Leadership & Governance',
      email: 'superadmin12@gmail.com',
      phone: '+91 1234567890',
      role_code: 'super_admin',
    };

    // 2. HR Leaders
    const hrLeaders = activeAndGraceList.filter(
      (e) =>
        e.id !== (ceo as any).id &&
        (e.role_code === 'hr_manager' ||
          e.department_name?.toLowerCase().includes('human resources') ||
          e.designation_title?.toLowerCase().includes('hr director') ||
          e.designation_title?.toLowerCase().includes('hr operations'))
    );

    // Live HR Leaders from real database (zero fake data)
    const finalHrLeaders = hrLeaders;

    // 3. Department Managers
    const managers = activeAndGraceList.filter(
      (e) =>
        e.id !== (ceo as any).id &&
        !finalHrLeaders.some((hr) => hr.id === e.id) &&
        (e.role_code === 'manager' ||
          e.designation_title?.toLowerCase().includes('lead') ||
          e.designation_title?.toLowerCase().includes('manager') ||
          e.designation_title?.toLowerCase().includes('director') ||
          e.designation_title?.toLowerCase().includes('controller'))
    );

    // 4. Employees / Associates
    const staff = activeAndGraceList.filter(
      (e) =>
        e.id !== (ceo as any).id &&
        !finalHrLeaders.some((hr) => hr.id === e.id) &&
        !managers.some((m) => m.id === e.id)
    );

    // Map managers under HR leaders based on reporting_manager or department
    const hrBranches = finalHrLeaders.map((hr, hrIdx) => {
      const hrId = hr.id;
      const isOps = hr.department_name?.toLowerCase().includes('operations');

      // Managers reporting to this HR
      const assignedManagers = managers.filter((m) => {
        if (m.reporting_manager === hrId) return true;
        if (isOps) {
          return m.department_name?.toLowerCase().includes('operations') || m.first_name === 'Amitabh';
        } else {
          return !m.department_name?.toLowerCase().includes('operations') && m.first_name !== 'Amitabh';
        }
      });

      // Staff directly reporting to this HR
      const directStaff = staff.filter((s) => s.reporting_manager === hrId);

      // Color scheme for managers
      const managerColors = ['bg-[#10b981]', 'bg-[#8b5cf6]', 'bg-[#f97316]', 'bg-[#0d9488]', 'bg-[#7c3aed]'];

      const managersWithStaff = assignedManagers.map((mgr, mIdx) => {
        const mgrStaff = staff.filter((s) => s.reporting_manager === mgr.id);
        return {
          ...mgr,
          color: managerColors[mIdx % managerColors.length],
          employees: mgrStaff,
        };
      });

      return {
        ...hr,
        branchKey: `hr-${hrIdx + 1}`,
        managers: managersWithStaff,
        directEmployees: directStaff,
      };
    });

    return {
      ceo,
      hrBranches,
    };
  }, [employees, deletedRecords]);

  // Filter branches if user selected a specific HR panel
  const displayedHrBranches = useMemo(() => {
    if (activeHrFilter === 'all') return hierarchyData.hrBranches;
    return hierarchyData.hrBranches.filter((hr) => hr.id === activeHrFilter || hr.branchKey === activeHrFilter);
  }, [activeHrFilter, hierarchyData]);

  // Search filter
  const isMatchSearch = (text?: string) => {
    if (!text || !searchQuery.trim()) return false;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  // Handle Marking Employee as Deleted (Turns RED, auto-purges after 24 hours)
  const handleMarkDeleted = (emp: any) => {
    setConfirmDeleteEmp(emp);
  };

  const confirmDeleteAction = async () => {
    if (!confirmDeleteEmp) return;
    const empId = confirmDeleteEmp.id;
    const empName = confirmDeleteEmp.full_name || `${confirmDeleteEmp.first_name} ${confirmDeleteEmp.last_name}`;

    const newRecords = {
      ...deletedRecords,
      [empId]: {
        id: empId,
        name: empName,
        deleted_at: Date.now(),
      },
    };
    setDeletedRecords(newRecords);

    // Call backend soft-delete / update status to terminated
    try {
      await api.updateEmployee(empId, { employment_status: 'terminated' });
    } catch {
      // Fallback local update
    }

    emitEvent(
      'employee.deleted',
      'Employee Marked For Deletion',
      `⚠️ ${empName} has been marked for deletion. Displayed in RED with 24-hour grace period before permanent purge.`,
      'warning'
    );

    setSuccessToast(`⚠️ ${empName} marked for deletion! Node is highlighted in RED and will auto-purge after 24 hours.`);
    setConfirmDeleteEmp(null);
    if (detailModalEmp?.id === empId) setDetailModalEmp(null);
    setTimeout(() => setSuccessToast(null), 6000);
  };

  // Handle Restoring Employee from Deletion
  const handleRestoreEmployee = async (empId: string, empName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = { ...deletedRecords };
    delete updated[empId];
    setDeletedRecords(updated);

    try {
      await api.updateEmployee(empId, { employment_status: 'active' });
    } catch {
      // Fallback
    }

    emitEvent(
      'employee.restored',
      'Employee Restored to Active Hierarchy',
      `✅ ${empName} has been restored to Active status in the organizational tree.`,
      'success'
    );

    setSuccessToast(`✅ ${empName} restored to active status!`);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  // Open Promotion Modal
  const handleOpenPromote = (emp: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedEmpForPromote(emp);
    setNewDesignation(`Lead Manager - ${emp.department_name || 'Engineering'}`);
    setPromoteModalOpen(true);
  };

  // Submit Promotion
  const handleConfirmPromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpForPromote) return;

    try {
      if (selectedEmpForPromote.id) {
        await api.updateEmployee(selectedEmpForPromote.id, {
          designation_title: newDesignation,
          role_code: 'manager',
        });
      }

      const empName = selectedEmpForPromote.full_name || `${selectedEmpForPromote.first_name} ${selectedEmpForPromote.last_name}`;
      emitEvent(
        'employee.promoted',
        'Promotion Approved & Promoted to Manager',
        `🎉 ${empName} promoted to ${newDesignation}!`,
        'success'
      );

      setSuccessToast(`🎉 ${empName} successfully promoted to ${newDesignation}!`);
      setPromoteModalOpen(false);
      loadRealEmployees();
      setTimeout(() => setSuccessToast(null), 6000);
    } catch (err: any) {
      alert(err.message || 'Promotion failed');
    }
  };

  // Open Assign New Associate
  const handleOpenAssign = (mgr: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedManagerForAssign(mgr);
    setNewAssociateName('');
    setAssignModalOpen(true);
  };

  const handleConfirmAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssociateName.trim() || !selectedManagerForAssign) return;

    try {
      const names = newAssociateName.trim().split(' ');
      const fName = names[0];
      const lName = names.slice(1).join(' ') || 'Kumar';

      await api.createEmployee({
        first_name: fName,
        last_name: lName,
        email: `${fName.toLowerCase()}.${Date.now().toString().slice(-4)}@odiaserp.com`,
        phone: '+91 98200 99999',
        role_code: newAssociateRoleCode,
        role_name:
          newAssociateRoleCode === 'manager'
            ? 'Team Manager'
            : newAssociateRoleCode === 'hr_manager'
            ? 'HR Operations Manager'
            : 'Employee (Associate Staff)',
        designation_title: newAssociatePosition || 'Software Associate',
        reporting_manager: selectedManagerForAssign.id,
        employment_status: 'active',
        date_of_joining: new Date().toISOString().split('T')[0],
      });

      emitEvent(
        'employee.created',
        'New Associate Joined Manager Team',
        `👤 ${newAssociateName} assigned under ${selectedManagerForAssign.full_name}`,
        'info'
      );

      setSuccessToast(`👤 ${newAssociateName} successfully added under ${selectedManagerForAssign.full_name}!`);
      setAssignModalOpen(false);
      loadRealEmployees();
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to assign associate');
    }
  };

  // Zoom controls
  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(1.4, Math.max(0.65, +(prev + delta).toFixed(2))));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-200">
      {/* 1. Top Header Banner with Live Realtime Status */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
              <Building2 className="w-6 h-6 text-blue-600 mr-2.5" />
              Real Organizational Hierarchy & Governance Tree
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Realtime Database Connected</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Live database hierarchy displaying <strong>Real Staff Names, Designations, and Reporting Lines</strong> with 1-click View Details and 24h grace-period delete tracking.
          </p>
        </div>

        {/* Action Controls & Zoom */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Search box */}
          <div className="relative w-48 sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by real name or position..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200">
            <button
              onClick={() => setViewMode('tree')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
                viewMode === 'tree' ? 'bg-white text-blue-700 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Tree Graph</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
                viewMode === 'cards' ? 'bg-white text-blue-700 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Panel Cards</span>
            </button>
          </div>

          {/* Zoom controls */}
          {viewMode === 'tree' && (
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200">
              <button
                onClick={() => handleZoom(-0.1)}
                title="Zoom Out"
                className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-1.5 text-[11px] font-mono text-slate-600 font-bold min-w-[42px] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => handleZoom(0.1)}
                title="Zoom In"
                className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetZoom}
                title="Reset 100%"
                className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors cursor-pointer ml-0.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={() => handleOpenAssign(hierarchyData.ceo)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
            title="Assign New Associate or Manager"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Assign Associate</span>
          </button>

          <button
            onClick={() => loadRealEmployees()}
            title="Refresh database records"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. REAL HR PANEL FILTER TABS */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2">
            HR Unit Panels:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveHrFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeHrFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>All Panels (Company Overview)</span>
            </button>

            {hierarchyData.hrBranches.map((hr) => {
              const isSelected = activeHrFilter === hr.id || activeHrFilter === hr.branchKey;
              return (
                <button
                  key={hr.id}
                  onClick={() => setActiveHrFilter(hr.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                    isSelected
                      ? 'bg-[#0066cc] text-white shadow-sm ring-2 ring-blue-400/50'
                      : 'bg-blue-50 text-[#0066cc] hover:bg-blue-100'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>
                    {hr.full_name || `${hr.first_name} ${hr.last_name}`} ({hr.designation_title || 'HR Director'})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Role Indicator */}
        <div className="flex items-center space-x-2 text-xs font-mono px-2 py-1 bg-slate-50 border border-slate-200 rounded-xl text-slate-600">
          <Shield className="w-3.5 h-3.5 text-blue-600" />
          <span>Active Role: <strong className="text-slate-900">{user?.role_name || user?.role_code?.toUpperCase() || 'SUPER ADMIN'}</strong></span>
        </div>
      </div>

      {/* 3. Success Alert Toast */}
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

      {/* ========================================================= */}
      {/* 4. VIEW MODE A: VISUAL HIERARCHY TREE GRAPH (REAL DATA) */}
      {/* ========================================================= */}
      {viewMode === 'tree' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 overflow-x-auto select-none">
          <div
            ref={treeContainerRef}
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
            className="min-w-[1100px] flex flex-col items-center transition-transform duration-200 py-6"
          >
            {/* LEVEL 1: ROOT CEO (Real Name & Position) */}
            {activeHrFilter === 'all' && (
              <div className="flex flex-col items-center relative z-20">
                <div
                  className={`w-[420px] rounded-2xl p-4 bg-linear-to-r from-[#0a2559] via-[#0d347c] to-[#0a2559] text-white shadow-xl border-2 transition-all hover:scale-105 ${
                    isMatchSearch(hierarchyData.ceo.full_name) || isMatchSearch('chief executive')
                      ? 'border-yellow-400 ring-4 ring-yellow-400/30'
                      : 'border-blue-400/30 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/30 border border-blue-400/40 flex items-center justify-center text-white shrink-0 shadow-inner">
                        <Building2 className="w-7 h-7 text-blue-200" />
                      </div>
                      <div className="text-left min-w-0">
                        <h2 className="text-xl font-black text-white tracking-tight leading-none truncate">
                          {hierarchyData.ceo.full_name || `${hierarchyData.ceo.first_name} ${hierarchyData.ceo.last_name}`}
                        </h2>
                        <span className="text-xs font-extrabold text-yellow-400 tracking-wide block mt-1 truncate">
                          {hierarchyData.ceo.designation_title || 'Chief Executive Officer (Super Admin)'}
                        </span>
                        <span className="text-[10px] text-blue-200 block truncate">
                          {hierarchyData.ceo.department_name || 'Corporate Governance'}
                        </span>
                      </div>
                    </div>

                    {/* View & Assign Buttons */}
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleOpenAssign(hierarchyData.ceo, e)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs flex items-center space-x-1 transition-colors cursor-pointer shadow-xs"
                        title="Assign new Associate or Manager under Super Admin"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Assign</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDetailModalEmp(hierarchyData.ceo)}
                        className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white text-white hover:text-slate-900 font-bold text-xs flex items-center space-x-1 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Vertical stem line dropping from CEO */}
                <div className="w-0.5 h-10 bg-[#0066cc]" />
              </div>
            )}

            {/* HORIZONTAL CROSSBAR ACROSS HR BRANCHES (Only if All Panels and multiple branches) */}
            {activeHrFilter === 'all' && displayedHrBranches.length > 1 && (
              <div className="w-[84%] relative">
                <div className="h-0.5 w-full bg-[#0066cc]" />
              </div>
            )}

            {/* LEVEL 2 & 3 & 4: HR BRANCHES (Real Names & Positions) */}
            {displayedHrBranches.length === 0 ? (
              <div className="w-full max-w-xl mx-auto my-8 p-8 rounded-2xl bg-white border border-dashed border-slate-300 text-center shadow-sm">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-800">No HR Personnel or Managers Found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Add employees with roles like <strong>HR Manager</strong>, <strong>Team Manager</strong>, and staff in the Employee Directory to dynamically generate the organizational tree.
                </p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleOpenAssign(hierarchyData.ceo)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>+ Quick Assign Associate / Manager</span>
                  </button>
                  <Link
                    to="/app/hrms/employees"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Onboard HR / Employees</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div
                className={`w-full grid pt-0 ${
                  activeHrFilter === 'all'
                    ? `grid-cols-${displayedHrBranches.length || 2} gap-8`
                    : 'grid-cols-1 max-w-4xl mx-auto'
                }`}
              >
                {displayedHrBranches.map((hr) => {
                const hrDel = getDeletionStatus(hr.id);
                const isHrDeleted = Boolean(hrDel && !hrDel.isPurged);
                const isHrMatched = isMatchSearch(hr.full_name) || isMatchSearch(hr.designation_title);

                return (
                  <div key={hr.id} className="flex flex-col items-center">
                    {/* Vertical drop line into HR box */}
                    {activeHrFilter === 'all' && <div className="w-0.5 h-6 bg-[#0066cc]" />}

                    {/* HR Node Card (Real Name & Position) */}
                    <div
                      className={`w-80 rounded-2xl p-4 shadow-lg border-2 transition-all flex flex-col justify-between space-y-2.5 ${
                        isHrDeleted
                          ? 'bg-rose-50 border-rose-500 text-rose-950 ring-2 ring-rose-400'
                          : 'bg-[#0066cc] text-white border-blue-400 hover:border-white'
                      } ${isHrMatched ? 'ring-4 ring-yellow-400' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                            isHrDeleted ? 'bg-rose-200 text-rose-700' : 'bg-white/20 border border-white/40 text-white'
                          }`}>
                            <User className="w-6 h-6" />
                          </div>
                          <div className="text-left min-w-0">
                            <h3 className={`text-base font-black tracking-tight leading-tight truncate ${isHrDeleted ? 'line-through text-rose-900' : 'text-white'}`}>
                              {hr.full_name || `${hr.first_name} ${hr.last_name}`}
                            </h3>
                            <span className={`text-xs font-bold block truncate ${isHrDeleted ? 'text-rose-700' : 'text-blue-100'}`}>
                              {hr.designation_title || 'HR Director'}
                            </span>
                            <span className={`text-[10px] block truncate ${isHrDeleted ? 'text-rose-600' : 'text-blue-200'}`}>
                              {hr.department_name || 'Human Resources'}
                            </span>
                          </div>
                        </div>

                        {/* View Button */}
                        <button
                          type="button"
                          onClick={() => setDetailModalEmp(hr)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1 transition-colors cursor-pointer shrink-0 ${
                            isHrDeleted
                              ? 'bg-rose-200 hover:bg-rose-300 text-rose-900'
                              : 'bg-white/20 hover:bg-white text-white hover:text-slate-900'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </div>

                      {/* Deletion Warning Banner if Marked Deleted */}
                      {isHrDeleted && (
                        <div className="flex items-center justify-between p-2 rounded-xl bg-rose-100/90 text-rose-800 text-[10px] font-bold">
                          <span>● Marked Deleted · Purges in {hrDel?.hoursRemaining}h</span>
                          <button
                            type="button"
                            onClick={(e) => handleRestoreEmployee(hr.id, hr.full_name, e)}
                            className="underline text-emerald-800 hover:text-emerald-950 font-black cursor-pointer"
                          >
                            Restore
                          </button>
                        </div>
                      )}
                    </div>

                    {/* BRANCH SPECIFIC MANAGERS */}
                    {hr.managers && hr.managers.length > 0 && (
                      <div className="w-full flex flex-col items-center">
                        {/* Line dropping from HR */}
                        <div className="w-0.5 h-6 bg-[#0066cc]" />

                        {/* Horizontal connector across managers */}
                        <div className="w-[85%] relative">
                          <div className="h-0.5 w-full bg-[#0066cc]" />
                        </div>

                        {/* Managers Grid */}
                        <div
                          className={`w-full grid gap-4 pt-0 ${
                            hr.managers.length >= 3 ? 'grid-cols-3' : 'grid-cols-2'
                          }`}
                        >
                          {hr.managers.map((mgr: any) => {
                            const mgrDel = getDeletionStatus(mgr.id);
                            const isMgrDeleted = Boolean(mgrDel && !mgrDel.isPurged);
                            const isMgrMatched = isMatchSearch(mgr.full_name) || isMatchSearch(mgr.designation_title);

                            return (
                              <div key={mgr.id} className="flex flex-col items-center">
                                {/* Drop line into Manager box */}
                                <div className="w-0.5 h-6 bg-[#0066cc]" />

                                {/* Manager Card (Real Name & Position) */}
                                <div
                                  className={`w-full max-w-[210px] rounded-2xl p-3 shadow-md text-left transition-all border-2 ${
                                    isMgrDeleted
                                      ? 'bg-rose-50 border-rose-500 text-rose-950 ring-2 ring-rose-400'
                                      : `${mgr.color || 'bg-[#10b981]'} text-white border-white/30 hover:border-white`
                                  } ${isMgrMatched ? 'ring-4 ring-yellow-400' : ''}`}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="min-w-0 pr-1">
                                      <h4 className={`text-xs font-black tracking-tight leading-tight truncate ${isMgrDeleted ? 'line-through text-rose-900' : 'text-white'}`}>
                                        {mgr.full_name || `${mgr.first_name} ${mgr.last_name}`}
                                      </h4>
                                      <span className={`text-[10px] font-bold block truncate mt-0.5 ${isMgrDeleted ? 'text-rose-700' : 'text-white/95'}`}>
                                        {mgr.designation_title || 'Department Manager'}
                                      </span>
                                      <span className={`text-[9px] block truncate ${isMgrDeleted ? 'text-rose-600' : 'text-white/80'}`}>
                                        {mgr.department_name || 'Engineering'}
                                      </span>
                                    </div>

                                    {/* Action Buttons: Assign Associate & View */}
                                    <div className="flex items-center space-x-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={(e) => handleOpenAssign(mgr, e)}
                                        title="Assign Employee / Associate under this manager"
                                        className="p-1 rounded-lg bg-black/20 hover:bg-white text-white hover:text-emerald-700 transition-colors cursor-pointer"
                                      >
                                        <PlusCircle className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setDetailModalEmp(mgr)}
                                        title="View details & actions"
                                        className="p-1 rounded-lg bg-black/20 hover:bg-white text-white hover:text-slate-900 transition-colors cursor-pointer"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Deletion Warning Banner */}
                                  {isMgrDeleted && (
                                    <div className="mt-2 pt-1 border-t border-rose-200 flex items-center justify-between text-[9px] font-bold text-rose-800">
                                      <span>Purges in {mgrDel?.hoursRemaining}h</span>
                                      <button
                                        type="button"
                                        onClick={(e) => handleRestoreEmployee(mgr.id, mgr.full_name, e)}
                                        className="underline text-emerald-700 hover:text-emerald-950"
                                      >
                                        Restore
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* Vertical stem connecting into employee stack */}
                                <div className="w-0.5 h-5 bg-[#0066cc]" />

                                {/* Employee Stack (Real Names & Positions) */}
                                <div className="w-full space-y-2">
                                  {mgr.employees.map((emp: any) => {
                                    const empDel = getDeletionStatus(emp.id);
                                    const isEmpDeleted = Boolean(empDel && !empDel.isPurged);
                                    const isEmpMatched = isMatchSearch(emp.full_name) || isMatchSearch(emp.designation_title);

                                    return (
                                      <div
                                        key={emp.id}
                                        className={`w-full rounded-xl py-2 px-2.5 border-2 transition-all flex items-center justify-between group shadow-2xs ${
                                          isEmpDeleted
                                            ? 'bg-rose-50 border-rose-500 text-rose-950'
                                            : 'bg-[#f0f6ff] border-[#bfdbfe] hover:border-[#0066cc] hover:bg-white hover:shadow-xs'
                                        } ${isEmpMatched ? 'border-yellow-400 bg-yellow-50 ring-2 ring-yellow-400/30' : ''}`}
                                      >
                                        <div className="flex items-center space-x-2 min-w-0">
                                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-[10px] ${
                                            isEmpDeleted ? 'bg-rose-200 text-rose-700' : 'bg-blue-100 text-[#0066cc]'
                                          }`}>
                                            {emp.first_name?.[0] || 'E'}
                                          </div>
                                          <div className="text-left min-w-0">
                                            <span className={`text-[11px] font-black tracking-tight block truncate ${isEmpDeleted ? 'line-through text-rose-900' : 'text-slate-800'}`}>
                                              {emp.full_name || `${emp.first_name} ${emp.last_name}`}
                                            </span>
                                            <span className={`text-[9px] font-medium block truncate ${isEmpDeleted ? 'text-rose-700' : 'text-slate-500'}`}>
                                              {emp.designation_title || emp.role_name || 'Staff Associate'}
                                            </span>
                                          </div>
                                        </div>

                                        {/* Actions: View & Promote / Restore */}
                                        <div className="flex items-center space-x-1 shrink-0 ml-1">
                                          {isEmpDeleted ? (
                                            <button
                                              type="button"
                                              onClick={(e) => handleRestoreEmployee(emp.id, emp.full_name, e)}
                                              title="Restore employee"
                                              className="p-1 rounded-md bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-[10px] font-bold"
                                            >
                                              <Undo2 className="w-3 h-3" />
                                            </button>
                                          ) : (
                                            <>
                                              <button
                                                type="button"
                                                onClick={() => setDetailModalEmp(emp)}
                                                title="View full details & actions"
                                                className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                              >
                                                <Eye className="w-3.5 h-3.5" />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={(e) => handleOpenPromote(emp, e)}
                                                title="Promote to Manager"
                                                className="p-1 rounded-md text-slate-400 group-hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                                              >
                                                <ArrowUpCircle className="w-3.5 h-3.5" />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => handleMarkDeleted(emp)}
                                                title="Delete employee (turns red, auto-purges in 24h)"
                                                className="p-1 rounded-md text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* DIRECT EMPLOYEES UNDER HR */}
                    {hr.directEmployees && hr.directEmployees.length > 0 && (
                      <div className="w-full flex flex-col items-center">
                        <div className="w-0.5 h-8 bg-[#0066cc]" />

                        <div className="w-full max-w-[240px] space-y-2">
                          {hr.directEmployees.map((emp: any) => {
                            const empDel = getDeletionStatus(emp.id);
                            const isEmpDeleted = Boolean(empDel && !empDel.isPurged);
                            const isEmpMatched = isMatchSearch(emp.full_name) || isMatchSearch(emp.designation_title);

                            return (
                              <div
                                key={emp.id}
                                className={`w-full rounded-xl py-2 px-3 border-2 transition-all flex items-center justify-between group shadow-2xs ${
                                  isEmpDeleted
                                    ? 'bg-rose-50 border-rose-500 text-rose-950'
                                    : 'bg-[#f0f6ff] border-[#bfdbfe] hover:border-[#0066cc] hover:bg-white hover:shadow-xs'
                                } ${isEmpMatched ? 'border-yellow-400 bg-yellow-50 ring-2 ring-yellow-400/30' : ''}`}
                              >
                                <div className="flex items-center space-x-2.5 min-w-0">
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${
                                    isEmpDeleted ? 'bg-rose-200 text-rose-700' : 'bg-blue-100 text-[#0066cc]'
                                  }`}>
                                    {emp.first_name?.[0] || 'E'}
                                  </div>
                                  <div className="text-left min-w-0">
                                    <span className={`text-xs font-black tracking-tight block truncate ${isEmpDeleted ? 'line-through text-rose-900' : 'text-slate-800'}`}>
                                      {emp.full_name || `${emp.first_name} ${emp.last_name}`}
                                    </span>
                                    <span className={`text-[10px] font-medium block truncate ${isEmpDeleted ? 'text-rose-700' : 'text-slate-500'}`}>
                                      {emp.designation_title || emp.role_name || 'Staff Associate'}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-1 shrink-0 ml-1">
                                  {isEmpDeleted ? (
                                    <button
                                      type="button"
                                      onClick={(e) => handleRestoreEmployee(emp.id, emp.full_name, e)}
                                      title="Restore employee"
                                      className="p-1 rounded-md bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-[10px] font-bold"
                                    >
                                      <Undo2 className="w-3 h-3" />
                                    </button>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => setDetailModalEmp(emp)}
                                        title="View full details"
                                        className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => handleOpenPromote(emp, e)}
                                        title="Promote associate"
                                        className="p-1 rounded-md text-slate-400 group-hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                                      >
                                        <ArrowUpCircle className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleMarkDeleted(emp)}
                                        title="Delete employee (turns red, auto-purges in 24h)"
                                        className="p-1 rounded-md text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. VIEW MODE B: PANEL-WISE CARDS VIEW (REAL DATA) */}
      {/* ========================================================= */}
      {viewMode === 'cards' && (
        <div className="space-y-6">
          {displayedHrBranches.length === 0 ? (
            <div className="w-full max-w-xl mx-auto my-8 p-8 rounded-2xl bg-white border border-dashed border-slate-300 text-center shadow-sm">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No HR Personnel or Managers Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Add employees with roles like <strong>HR Manager</strong>, <strong>Team Manager</strong>, and staff in the Employee Directory to dynamically generate the organizational tree.
              </p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <Link
                  to="/app/hrms/employees"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Onboard HR / Employees</span>
                </Link>
              </div>
            </div>
          ) : (
            displayedHrBranches.map((hr) => {
            const hrDel = getDeletionStatus(hr.id);
            const isHrDeleted = Boolean(hrDel && !hrDel.isPurged);

            return (
              <div
                key={hr.id}
                className="bg-white rounded-3xl border-2 border-slate-200/90 shadow-sm overflow-hidden"
              >
                {/* 1. HR Header Panel Card */}
                <div className={`p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isHrDeleted ? 'bg-rose-900' : 'bg-[#0066cc]'
                }`}>
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/40 flex items-center justify-center text-white shrink-0 shadow-inner">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/25 text-white uppercase tracking-wider">
                          HR Governance Unit
                        </span>
                        {isHrDeleted ? (
                          <span className="text-xs text-rose-300 font-bold">● Marked Deleted (Purges in {hrDel?.hoursRemaining}h)</span>
                        ) : (
                          <span className="text-xs text-blue-200">● Active</span>
                        )}
                      </div>
                      <h2 className="text-2xl font-black text-white tracking-tight mt-0.5">
                        {hr.full_name || `${hr.first_name} ${hr.last_name}`}
                      </h2>
                      <p className="text-xs text-blue-100 font-bold">
                        {hr.designation_title || 'HR Director'} · {hr.department_name || 'Human Resources'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setDetailModalEmp(hr)}
                      className="px-4 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs flex items-center space-x-1.5 shadow-sm hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-blue-600" />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>

                {/* 2. Managers & Staff inside this HR Panel */}
                <div className="p-6 bg-slate-50/60">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center">
                      <Briefcase className="w-4 h-4 text-blue-600 mr-2" />
                      Department Managers & Assigned Staff Under {hr.full_name || hr.first_name}
                    </h3>
                  </div>

                  {hr.managers && hr.managers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {hr.managers.map((mgr: any) => {
                        const mgrDel = getDeletionStatus(mgr.id);
                        const isMgrDeleted = Boolean(mgrDel && !mgrDel.isPurged);

                        return (
                          <div
                            key={mgr.id}
                            className={`bg-white rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-md ${
                              isMgrDeleted ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200/90'
                            }`}
                          >
                            {/* Manager Card Header */}
                            <div className={`${isMgrDeleted ? 'bg-rose-800' : mgr.color || 'bg-[#10b981]'} p-4 text-white flex items-center justify-between`}>
                              <div className="min-w-0 pr-2">
                                <span className="text-[10px] font-black uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded-md">
                                  {mgr.department_name || 'Department'} Manager
                                </span>
                                <h4 className="text-base font-black text-white mt-1 leading-tight truncate">
                                  {mgr.full_name || `${mgr.first_name} ${mgr.last_name}`}
                                </h4>
                                <p className="text-[11px] text-white/90 truncate">{mgr.designation_title || 'Lead'}</p>
                              </div>

                              <div className="flex items-center space-x-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setDetailModalEmp(mgr)}
                                  title="View manager details"
                                  className="p-1.5 rounded-lg bg-white/20 hover:bg-white text-white hover:text-slate-900 transition-colors cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleOpenAssign(mgr, e)}
                                  title="Assign new employee under this manager"
                                  className="p-1.5 rounded-lg bg-white/20 hover:bg-white text-white hover:text-slate-900 transition-colors cursor-pointer"
                                >
                                  <PlusCircle className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Employees List Under This Manager */}
                            <div className="p-4 space-y-2.5 flex-1">
                              <div className="flex items-center justify-between text-xs text-slate-500 pb-1 border-b border-slate-100">
                                <span className="font-bold">Reporting Team ({mgr.employees?.length || 0})</span>
                                <span className="text-[10px]">Actions</span>
                              </div>

                              {mgr.employees && mgr.employees.map((emp: any) => {
                                const empDel = getDeletionStatus(emp.id);
                                const isEmpDeleted = Boolean(empDel && !empDel.isPurged);

                                return (
                                  <div
                                    key={emp.id}
                                    className={`p-2.5 rounded-xl border transition-all flex items-center justify-between group shadow-2xs ${
                                      isEmpDeleted
                                        ? 'bg-rose-50 border-rose-500 text-rose-950'
                                        : 'bg-[#f0f6ff] border-[#bfdbfe] hover:border-[#0066cc] hover:bg-white'
                                    }`}
                                  >
                                    <div className="flex items-center space-x-2.5 min-w-0">
                                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${
                                        isEmpDeleted ? 'bg-rose-200 text-rose-700' : 'bg-blue-100 text-[#0066cc]'
                                      }`}>
                                        {emp.first_name?.[0] || 'E'}
                                      </div>
                                      <div className="text-left min-w-0">
                                        <span className={`text-xs font-black block truncate ${isEmpDeleted ? 'line-through text-rose-900' : 'text-slate-800'}`}>
                                          {emp.full_name || `${emp.first_name} ${emp.last_name}`}
                                        </span>
                                        <span className={`text-[10px] block truncate ${isEmpDeleted ? 'text-rose-700' : 'text-slate-500'}`}>
                                          {emp.designation_title || emp.role_name || 'Associate'}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center space-x-1 shrink-0">
                                      {isEmpDeleted ? (
                                        <button
                                          type="button"
                                          onClick={(e) => handleRestoreEmployee(emp.id, emp.full_name, e)}
                                          title="Restore employee"
                                          className="p-1 rounded-md bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-[10px] font-bold"
                                        >
                                          <Undo2 className="w-3 h-3" />
                                        </button>
                                      ) : (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => setDetailModalEmp(emp)}
                                            title="View details"
                                            className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                          >
                                            <Eye className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={(e) => handleOpenPromote(emp, e)}
                                            title="Promote to Manager"
                                            className="p-1 rounded-md text-slate-400 group-hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                                          >
                                            <ArrowUpCircle className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleMarkDeleted(emp)}
                                            title="Delete employee (turns red, auto-purges in 24h)"
                                            className="p-1 rounded-md text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Direct Team */
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {hr.directEmployees?.map((emp: any) => {
                          const empDel = getDeletionStatus(emp.id);
                          const isEmpDeleted = Boolean(empDel && !empDel.isPurged);

                          return (
                            <div
                              key={emp.id}
                              className={`p-3 rounded-xl border transition-all flex items-center justify-between group shadow-2xs ${
                                isEmpDeleted
                                  ? 'bg-rose-50 border-rose-500 text-rose-950'
                                  : 'bg-[#f0f6ff] border-[#bfdbfe] hover:border-[#0066cc] hover:bg-white'
                              }`}
                            >
                              <div className="flex items-center space-x-2.5 min-w-0">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${
                                  isEmpDeleted ? 'bg-rose-200 text-rose-700' : 'bg-blue-100 text-[#0066cc]'
                                }`}>
                                  {emp.first_name?.[0] || 'E'}
                                </div>
                                <div className="text-left min-w-0">
                                  <span className={`text-xs font-black block truncate ${isEmpDeleted ? 'line-through text-rose-900' : 'text-slate-800'}`}>
                                    {emp.full_name || `${emp.first_name} ${emp.last_name}`}
                                  </span>
                                  <span className={`text-[10px] block truncate ${isEmpDeleted ? 'text-rose-700' : 'text-slate-500'}`}>
                                    {emp.designation_title || emp.role_name || 'Staff Associate'}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center space-x-1 shrink-0 ml-1">
                                <button
                                  type="button"
                                  onClick={() => setDetailModalEmp(emp)}
                                  title="View details"
                                  className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleOpenPromote(emp, e)}
                                  title="Promote"
                                  className="p-1 rounded-md text-slate-400 group-hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                                >
                                  <ArrowUpCircle className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMarkDeleted(emp)}
                                  title="Delete employee (turns red, auto-purges in 24h)"
                                  className="p-1 rounded-md text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          }))}
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. FULL PROFILE & ACTIONS VIEW MODAL (VIEW BUTTON CLICK) */}
      {/* ========================================================= */}
      {detailModalEmp && (
        <Modal
          isOpen={Boolean(detailModalEmp)}
          onClose={() => setDetailModalEmp(null)}
          title={`Employee Profile & Actions: ${detailModalEmp.full_name || detailModalEmp.first_name}`}
          maxWidth="lg"
        >
          {(() => {
            const empDel = getDeletionStatus(detailModalEmp.id);
            const isEmpDeleted = Boolean(empDel && !empDel.isPurged);

            return (
              <div className="space-y-5 text-xs">
                {/* Header Profile Badge */}
                <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isEmpDeleted
                    ? 'bg-rose-50 border-rose-300 text-rose-900'
                    : 'bg-linear-to-r from-blue-50 via-indigo-50 to-white border-blue-200'
                }`}>
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className="w-14 h-14 rounded-2xl bg-[#0066cc] text-white flex items-center justify-center font-black text-lg shrink-0 shadow-md">
                      {detailModalEmp.first_name?.[0] || 'U'}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 text-white font-bold">
                          {detailModalEmp.employee_id || 'GB-EMP-OFFICIAL'}
                        </span>
                        {isEmpDeleted ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-200 text-rose-800">
                            ● Marked Deleted (Purges in {empDel?.hoursRemaining}h)
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            ● Active Verified
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">
                        {detailModalEmp.full_name || `${detailModalEmp.first_name} ${detailModalEmp.last_name}`}
                      </h2>
                      <p className="text-xs font-bold text-blue-700">
                        {detailModalEmp.designation_title || detailModalEmp.role_name || 'Corporate Professional'}
                      </p>
                    </div>
                  </div>

                  {/* Quick Action in Header */}
                  {isEmpDeleted ? (
                    <button
                      type="button"
                      onClick={() => handleRestoreEmployee(detailModalEmp.id, detailModalEmp.full_name)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 shadow-sm flex items-center space-x-1.5 cursor-pointer shrink-0"
                    >
                      <Undo2 className="w-4 h-4" />
                      <span>Restore to Active</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setDetailModalEmp(null);
                        handleOpenPromote(detailModalEmp);
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 shadow-sm flex items-center space-x-1.5 cursor-pointer shrink-0"
                    >
                      <Award className="w-4 h-4" />
                      <span>Promote Role</span>
                    </button>
                  )}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Department</span>
                    <span className="font-bold text-slate-900 text-sm">{detailModalEmp.department_name || 'Corporate'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Position / Title</span>
                    <span className="font-bold text-slate-900 text-sm">{detailModalEmp.designation_title || detailModalEmp.role_name}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Official Email</span>
                    <span className="font-mono text-slate-800">{detailModalEmp.email || 'N/A'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Phone Contact</span>
                    <span className="font-mono text-slate-800">{detailModalEmp.phone || '+91 98200 00110'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Role Code / Access</span>
                    <span className="font-bold text-blue-700 uppercase">{detailModalEmp.role_code || 'EMPLOYEE'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Date of Joining</span>
                    <span className="font-mono text-slate-800">{detailModalEmp.date_of_joining || '2023-04-15'}</span>
                  </div>
                </div>

                {/* 9-DIMENSION PERFORMANCE SCORECARD & EVALUATOR DOSSIER ("KUN DIAA, KIA HAI KYA DIAA HAI") */}
                {(() => {
                  try {
                    const storedEvals = JSON.parse(localStorage.getItem('gb_employee_performance_evaluations') || '[]');
                    const empEv: EmployeePerformanceEvaluation | undefined = storedEvals.find(
                      (e: any) =>
                        e.employeeId === detailModalEmp.id ||
                        e.employeeId === detailModalEmp.employee_id ||
                        e.employeeName?.toLowerCase() === (detailModalEmp.full_name || detailModalEmp.first_name)?.toLowerCase()
                    );

                    if (empEv && empEv.overallScore > 0) {
                      return (
                        <div className="p-4 bg-gradient-to-br from-amber-50/90 via-slate-50 to-blue-50/50 rounded-2xl border border-amber-200/90 space-y-3.5 shadow-sm">
                          {/* Score Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 rounded-xl bg-amber-400 flex items-center justify-center text-slate-950 font-black shadow-sm">
                                <Star className="w-4 h-4 fill-slate-950 text-slate-950" />
                              </div>
                              <div>
                                <span className="font-black text-slate-900 text-sm block">
                                  9-Dimension Performance Score: <span className="text-amber-600">{empEv.overallScore.toFixed(1)} / 5.0 ★</span>
                                </span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                  Behaviours & Values Analysis
                                </span>
                              </div>
                            </div>
                            <span className="self-start sm:self-auto text-xs px-2.5 py-1 rounded-xl font-black bg-amber-200/90 text-amber-950 border border-amber-300">
                              {empEv.ratingBadge}
                            </span>
                          </div>

                          {/* Evaluator Identity ("Kun Diaa") */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-white/80 p-2.5 rounded-xl border border-slate-200/80">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">Evaluated By (Kun Diaa)</span>
                              <span className="font-extrabold text-slate-900 flex items-center gap-1">
                                <span>{empEv.evaluatorName}</span>
                                <span className="text-[10px] font-medium text-slate-500">({empEv.evaluatorRole || 'HR / Manager'})</span>
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">Evaluation Date & Time</span>
                              <span className="font-bold text-slate-700">
                                {new Date(empEv.evaluatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                          </div>

                          {/* 9 Dimensions Breakdown ("Kia Hai Kya Diaa Hai") */}
                          <div>
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-2">
                              9 Core Competency Dimensions Breakdown
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {DIMENSIONS_CONFIG.map((dim) => {
                                const val = empEv.scores[dim.key] || 0.0;
                                return (
                                  <div
                                    key={dim.key}
                                    className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex flex-col justify-between space-y-1.5 shadow-2xs"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-[11px] text-slate-800 line-clamp-1">
                                        {dim.num}. {dim.title}
                                      </span>
                                      <span className="text-[10px] font-mono font-black text-amber-700">
                                        {val.toFixed(1)} ★
                                      </span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-amber-500 rounded-full transition-all"
                                        style={{ width: `${(val / 5) * 100}%` }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Evaluator Notes & Feedback Quote Box */}
                          <div className="p-3 rounded-xl bg-amber-100/40 border border-amber-200 text-xs space-y-1.5">
                            <span className="font-black text-amber-950 block text-[11px] flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
                              <span>Evaluator Feedback & Leadership Remarks:</span>
                            </span>
                            <p className="text-slate-700 italic pl-5 leading-relaxed text-[11px]">
                              "{empEv.feedbackNotes || 'No specific feedback notes recorded.'}"
                            </p>
                            {(empEv.keyStrengths || empEv.areasForImprovement) && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-amber-200/60 pl-5 text-[11px]">
                                {empEv.keyStrengths && (
                                  <div>
                                    <strong className="text-emerald-700 font-bold block">Key Strengths:</strong>
                                    <span className="text-slate-600">{empEv.keyStrengths}</span>
                                  </div>
                                )}
                                {empEv.areasForImprovement && (
                                  <div>
                                    <strong className="text-amber-800 font-bold block">Areas for Growth:</strong>
                                    <span className="text-slate-600">{empEv.areasForImprovement}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-dashed border-slate-300 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center space-x-2 text-slate-500">
                            <Star className="w-4 h-4 text-slate-400" />
                            <span>No 9-Dimension performance evaluation recorded yet for this employee.</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setPerformanceModalEmp({
                                id: detailModalEmp.id,
                                name: detailModalEmp.full_name || `${detailModalEmp.first_name || ''} ${detailModalEmp.last_name || ''}`.trim(),
                                employee_id: detailModalEmp.employee_id,
                                designation: detailModalEmp.designation_title || detailModalEmp.role_name,
                                department_name: detailModalEmp.department_name || 'General',
                                branch_name: 'Main Campus',
                                shift_name: 'General Shift',
                                assigned_hr: detailModalEmp.assigned_hr || 'Super Admin',
                                joined_date: detailModalEmp.date_of_joining || '2023-04-15'
                              });
                            }}
                            className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs shrink-0 cursor-pointer transition-all"
                          >
                            Rate Now
                          </button>
                        </div>
                      );
                    }
                  } catch (e) {
                    return null;
                  }
                })()}

                {/* Direct Page Navigation Buttons */}
                <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-2">
                  <span className="font-bold text-blue-900 block text-xs">Direct Governance Actions:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/app/hrms/employees`)}
                      className="p-2.5 rounded-xl bg-white border border-blue-200 hover:bg-blue-50 text-blue-800 font-bold flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="flex items-center space-x-1.5">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span>Open Employee Directory</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate(`/app/hrms/attendance`)}
                      className="p-2.5 rounded-xl bg-white border border-blue-200 hover:bg-blue-50 text-blue-800 font-bold flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="flex items-center space-x-1.5">
                        <Calendar className="w-4 h-4 text-emerald-600" />
                        <span>View Attendance History</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPerformanceModalEmp({
                          id: detailModalEmp.id,
                          name: detailModalEmp.full_name || `${detailModalEmp.first_name || ''} ${detailModalEmp.last_name || ''}`.trim(),
                          employee_id: detailModalEmp.employee_id,
                          designation: detailModalEmp.designation_title || detailModalEmp.role_name,
                          department_name: detailModalEmp.department_name || 'General',
                          branch_name: 'Main Campus',
                          shift_name: 'General Shift',
                          assigned_hr: detailModalEmp.assigned_hr || 'Super Admin',
                          joined_date: detailModalEmp.date_of_joining || '2023-04-15'
                        });
                      }}
                      className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-900 font-bold flex items-center justify-between transition-colors cursor-pointer sm:col-span-2"
                    >
                      <span className="flex items-center space-x-1.5">
                        <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                        <span>Rate Performance (9-Dimension Behaviours & Values)</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-amber-600" />
                    </button>
                  </div>
                </div>

                {/* Delete / Terminate Action */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  {!isEmpDeleted ? (
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmDeleteEmp(detailModalEmp);
                      }}
                      className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 text-rose-600" />
                      <span>Delete / Terminate Employee</span>
                    </button>
                  ) : (
                    <span className="text-rose-600 font-bold flex items-center space-x-1">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Node is red & will auto-remove after 24 hours</span>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setDetailModalEmp(null)}
                    className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Close Profile
                  </button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* 7. CONFIRM DELETE MODAL (TURNS RED, 24H AUTO PURGE) */}
      <Modal
        isOpen={Boolean(confirmDeleteEmp)}
        onClose={() => setConfirmDeleteEmp(null)}
        title="Confirm Employee Deletion (24-Hour Grace Period)"
        maxWidth="md"
      >
        {confirmDeleteEmp && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-black text-rose-950">
                  Mark {confirmDeleteEmp.full_name || confirmDeleteEmp.first_name} for Deletion?
                </h4>
                <p className="text-rose-700 mt-0.5">
                  Designation: <strong>{confirmDeleteEmp.designation_title || confirmDeleteEmp.role_name}</strong>
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-slate-600">
              <p className="font-bold text-slate-800 flex items-center space-x-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Organizational Hierarchy Impact:</span>
              </p>
              <ul className="list-disc list-inside space-y-1 pl-1 text-[11px]">
                <li>Node immediately turns <strong>RED</strong> in the hierarchy tree with a deletion timestamp.</li>
                <li>System maintains a <strong>24-hour (1 day) grace period</strong> for auditing or accidental restore.</li>
                <li>After 24 hours, the node will be <strong>automatically purged completely</strong> from the hierarchy graph.</li>
                <li>You can click <strong>"Restore"</strong> at any time during the 24 hours to undo.</li>
              </ul>
            </div>

            <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmDeleteEmp(null)}
                className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteAction}
                className="px-5 py-2 rounded-xl font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-600/30 flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirm & Mark Red</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* 8. Promotion Modal */}
      <Modal
        isOpen={promoteModalOpen}
        onClose={() => setPromoteModalOpen(false)}
        title="Promote Employee to Manager Role"
        maxWidth="md"
      >
        {selectedEmpForPromote && (
          <form onSubmit={handleConfirmPromotion} className="space-y-4 text-xs">
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center space-x-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-sm shrink-0">
                {selectedEmpForPromote.first_name?.[0] || 'E'}
              </div>
              <div>
                <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">Candidate for Managerial Promotion</span>
                <h3 className="text-sm font-black text-slate-900">{selectedEmpForPromote.full_name || selectedEmpForPromote.first_name}</h3>
                <p className="text-slate-600">Current: {selectedEmpForPromote.designation_title || selectedEmpForPromote.role_name}</p>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">New Managerial Designation</label>
              <input
                type="text"
                required
                value={newDesignation}
                onChange={(e) => setNewDesignation(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Target Department</label>
                <select
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                >
                  <option value="Software Engineering & Cloud">Software Engineering & Cloud</option>
                  <option value="Enterprise Sales & CRM">Enterprise Sales & CRM</option>
                  <option value="Operations & IT Logistics">Operations & IT Logistics</option>
                  <option value="Finance & Commercial Billing">Finance & Commercial Billing</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Promotion CTC Hike (%)</label>
                <input
                  type="number"
                  min={5}
                  max={100}
                  value={salaryHikePercent}
                  onChange={(e) => setSalaryHikePercent(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Effective Date</label>
              <input
                type="date"
                required
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
              />
            </div>

            <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPromoteModalOpen(false)}
                className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm shadow-emerald-600/30 flex items-center space-x-1.5 cursor-pointer"
              >
                <Award className="w-4 h-4" />
                <span>Confirm & Promote</span>
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* 9. Assign New Associate Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title={`Assign New Associate under ${selectedManagerForAssign?.full_name || 'Manager'}`}
        maxWidth="md"
      >
        <form onSubmit={handleConfirmAssign} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Associate Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Manas Ranjan Sahoo"
              value={newAssociateName}
              onChange={(e) => setNewAssociateName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Assign System Role & Clearance Level</label>
            <select
              value={newAssociateRoleCode}
              onChange={(e) => {
                const code = e.target.value;
                setNewAssociateRoleCode(code);
                if (code === 'employee' && !newAssociatePosition) setNewAssociatePosition('Associate Software Engineer');
                if (code === 'manager' && !newAssociatePosition) setNewAssociatePosition('Engineering Team Lead');
                if (code === 'hr_manager' && !newAssociatePosition) setNewAssociatePosition('HR Operations Lead');
              }}
              className="w-full px-3 py-2 text-xs border border-purple-300 bg-purple-50/40 rounded-xl font-bold text-slate-800"
            >
              <option value="employee">👤 Employee (Associate Staff)</option>
              <option value="manager">💼 Team Manager</option>
              <option value="hr_manager">👥 HR Manager</option>
              <option value="sales">📈 Sales Executive</option>
              <option value="accounts">💰 Finance Controller</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Designation & Position Title</label>
            <input
              type="text"
              required
              value={newAssociatePosition}
              onChange={(e) => setNewAssociatePosition(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium"
            />
          </div>

          <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAssignModalOpen(false)}
              className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-500 shadow-sm shadow-blue-600/30 flex items-center space-x-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Assign Associate</span>
            </button>
          </div>
        </form>
      </Modal>
      {/* 9-Dimension Performance Evaluation Modal */}
      <EmployeePerformanceModal
        isOpen={Boolean(performanceModalEmp)}
        onClose={() => setPerformanceModalEmp(null)}
        employee={performanceModalEmp}
      />
    </div>
  );
};
