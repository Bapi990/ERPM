import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Lock, Check, CheckSquare, Square, RefreshCw,
  Sparkles, Eye, Plus, Edit, Trash2, EyeOff, CheckCircle2,
  Sliders, Settings, Bell, Mail, KeyRound, Building2,
  Layers, History, Clock, Search, Shield, Save, ArrowRightLeft,
  Users, AlertTriangle, FileText, Smartphone, Laptop, UserCheck,
  User, CheckCircle, XCircle, Info, ChevronRight, ToggleLeft, ToggleRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { RoleCode } from '../../types';
import { useRealtime } from '../../context/RealtimeContext';
import {
  getActiveRBACMatrix,
  saveActiveRBACMatrix,
  getUserSpecificOverrides,
  saveUserSpecificOverrides,
  DEFAULT_RBAC_MATRIX,
  ALL_SYSTEM_SUBMODULES,
  SYSTEM_USERS_ROSTER,
  ROLE_CATEGORIES,
  getSystemUsers,
  saveSystemUsers,
  type RolePermissionConfig,
  type SystemUserOption,
  type UserSpecificOverride,
  type SubmoduleItem,
  type ActionPermissions
} from '../../utils/rbacMatrix';

export const RolesPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, demoSwitch } = useAuth();
  const { emitEvent, subscribe } = useRealtime();

  // Detect active submodule from path
  const activeSubmodule = useMemo(() => {
    const p = location.pathname;
    if (p.includes('/admin/department-perms')) return 'department-perms';
    if (p.includes('/admin/approval-workflows')) return 'approval-workflows';
    if (p.includes('/admin/branches')) return 'branches';
    if (p.includes('/admin/config')) return 'config';
    if (p.includes('/admin/notifications')) return 'notifications';
    if (p.includes('/admin/email-sms')) return 'email-sms';
    if (p.includes('/admin/integrations')) return 'integrations';
    if (p.includes('/admin/audit-logs')) return 'audit-logs';
    if (p.includes('/admin/sessions')) return 'sessions';
    return 'roles'; // default: /app/admin/roles
  }, [location.pathname]);

  // Mode: Configure by Role OR Configure by Individual User
  const [configMode, setConfigMode] = useState<'role' | 'user'>('role');

  // RBAC Matrix State (Role Level)
  const [rbacMatrix, setRbacMatrix] = useState<Record<string, RolePermissionConfig>>(() => getActiveRBACMatrix());
  const [selectedRoleCode, setSelectedRoleCode] = useState<string>('employee');

  // User-Specific Overrides State (Person Level)
  const [userOverrides, setUserOverrides] = useState<Record<string, UserSpecificOverride>>(() => getUserSpecificOverrides());
  const [allUsers, setAllUsers] = useState<SystemUserOption[]>(() => getSystemUsers());
  const [selectedUser, setSelectedUser] = useState<SystemUserOption>(() => {
    const list = getSystemUsers();
    return list.find(u => u.id === 'EMP-1001') || list[0] || SYSTEM_USERS_ROSTER[0];
  });

  // Step 1: Role Category Filter & Step 3: Search inputs
  const [selectedRoleCategory, setSelectedRoleCategory] = useState<string>('all');
  const [searchQueryInput, setSearchQueryInput] = useState<string>('');
  const [activeSearchFilter, setActiveSearchFilter] = useState<string>('');

  const [searchModule, setSearchModule] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // System Configuration State
  const [sessionTimeoutMins, setSessionTimeoutMins] = useState(60);
  const [require2FA, setRequire2FA] = useState(true);
  const [ipWhitelist, setIpWhitelist] = useState('127.0.0.1, 192.168.1.*');

  // Integrations State
  const [apiKey, setApiKey] = useState('kalinga_live_sec_89f02c4b8192a7e');
  const [webhookUrl, setWebhookUrl] = useState('https://kalinga-erp.internal/api/v1/webhooks/hrms');

  useEffect(() => {
    const unsub = subscribe('rbac_permissions_updated', () => {
      setRbacMatrix(getActiveRBACMatrix());
      setUserOverrides(getUserSpecificOverrides());
      setAllUsers(getSystemUsers());
    });
    const handleLocalUpdate = () => {
      setRbacMatrix(getActiveRBACMatrix());
      setUserOverrides(getUserSpecificOverrides());
      setAllUsers(getSystemUsers());
    };
    window.addEventListener('kalinga_rbac_updated', handleLocalUpdate);
    window.addEventListener('kalinga_users_updated', handleLocalUpdate);
    return () => {
      unsub();
      window.removeEventListener('kalinga_rbac_updated', handleLocalUpdate);
      window.removeEventListener('kalinga_users_updated', handleLocalUpdate);
    };
  }, [subscribe]);

  // Handle URL navigation query params (e.g. /app/admin/roles?mode=user&userId=HR-1001&role=hr)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const modeParam = params.get('mode');
    const roleParam = params.get('role');
    const userIdParam = params.get('userId');

    if (modeParam === 'user') {
      setConfigMode('user');
    }
    if (roleParam) {
      setSelectedRoleCategory(roleParam);
    }
    if (userIdParam) {
      const found = allUsers.find(u => u.id === userIdParam);
      if (found) {
        setSelectedUser(found);
        if (found.role_code) setSelectedRoleCategory(found.role_code);
      }
    }
  }, [location.search, allUsers]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const selectedRoleConfig = rbacMatrix[selectedRoleCode] || DEFAULT_RBAC_MATRIX.employee;

  // Selected User's Override config
  const selectedUserOverrideKey = selectedUser.id;
  const currentPersonOverride = userOverrides[selectedUserOverrideKey] || {
    userId: selectedUser.id,
    userName: selectedUser.name,
    userEmail: selectedUser.email,
    roleCode: selectedUser.role_code,
    enabled: false,
    actionOverrides: {}
  };

  // ----------------------------------------------------
  // ROLE LEVEL HANDLERS
  // ----------------------------------------------------
  const handleToggleRolePath = (path: string) => {
    if (selectedRoleCode === 'super_admin') {
      showToast('Super Admin has permanent full system access.');
      return;
    }

    setRbacMatrix(prev => {
      const curCfg = prev[selectedRoleCode] || DEFAULT_RBAC_MATRIX[selectedRoleCode];
      let newPaths = [...curCfg.allowed_paths];

      if (newPaths.includes(path)) {
        newPaths = newPaths.filter(p => p !== path);
      } else {
        newPaths.push(path);
      }

      const updated = {
        ...prev,
        [selectedRoleCode]: {
          ...curCfg,
          allowed_paths: newPaths,
        },
      };

      saveActiveRBACMatrix(updated);
      emitEvent('rbac_permissions_updated', 'RBAC Matrix Updated', `Updated sidebar path ${path} for ${curCfg.role_name}`, 'info');
      return updated;
    });
  };

  const handleToggleRoleAction = (
    moduleKey: string,
    action: 'view' | 'add' | 'edit' | 'delete',
    path?: string
  ) => {
    if (selectedRoleCode === 'super_admin') {
      showToast('Super Admin has permanent full permissions.');
      return;
    }

    setRbacMatrix(prev => {
      const curCfg = prev[selectedRoleCode] || DEFAULT_RBAC_MATRIX[selectedRoleCode];
      const curActions = { ...(curCfg.action_permissions || {}) };
      const targetKey = path || moduleKey;

      const currentPerms: ActionPermissions = curActions[targetKey] || {
        view: curCfg.allowed_paths.includes(path || '') || curCfg.allowed_paths.includes('*'),
        add: selectedRoleCode !== 'employee',
        edit: selectedRoleCode !== 'employee',
        delete: selectedRoleCode === 'sub_admin'
      };

      const newPerms: ActionPermissions = {
        ...currentPerms,
        [action]: !currentPerms[action]
      };

      // Also sync path visibility if 'view' was toggled
      let newAllowedPaths = [...curCfg.allowed_paths];
      if (path && action === 'view') {
        if (!newPerms.view) {
          newAllowedPaths = newAllowedPaths.filter(p => p !== path);
        } else if (!newAllowedPaths.includes(path)) {
          newAllowedPaths.push(path);
        }
      }

      const updated = {
        ...prev,
        [selectedRoleCode]: {
          ...curCfg,
          allowed_paths: newAllowedPaths,
          action_permissions: {
            ...curActions,
            [targetKey]: newPerms,
            [moduleKey]: {
              ...(curActions[moduleKey] || {}),
              [action]: newPerms[action]
            }
          }
        }
      };

      saveActiveRBACMatrix(updated);
      emitEvent('rbac_permissions_updated', 'Role Permission Updated', `${curCfg.role_name}: ${action.toUpperCase()} set to ${newPerms[action] ? 'ALLOWED' : 'DENIED'} for ${targetKey}`, 'info');
      return updated;
    });
  };

  const handleSetRoleModuleBulk = (groupName: string, grantAll: boolean, readOnlyOnly: boolean = false) => {
    if (selectedRoleCode === 'super_admin') return;

    setRbacMatrix(prev => {
      const curCfg = prev[selectedRoleCode] || DEFAULT_RBAC_MATRIX[selectedRoleCode];
      const submodules = ALL_SYSTEM_SUBMODULES.filter(s => s.moduleGroup === groupName);
      let newAllowedPaths = [...curCfg.allowed_paths];
      const newActionPerms = { ...(curCfg.action_permissions || {}) };

      submodules.forEach(sub => {
        if (grantAll) {
          if (!newAllowedPaths.includes(sub.path)) newAllowedPaths.push(sub.path);
          newActionPerms[sub.path] = { view: true, add: !readOnlyOnly, edit: !readOnlyOnly, delete: !readOnlyOnly };
          newActionPerms[sub.moduleKey] = { view: true, add: !readOnlyOnly, edit: !readOnlyOnly, delete: !readOnlyOnly };
        } else {
          newAllowedPaths = newAllowedPaths.filter(p => p !== sub.path);
          newActionPerms[sub.path] = { view: false, add: false, edit: false, delete: false };
          newActionPerms[sub.moduleKey] = { view: false, add: false, edit: false, delete: false };
        }
      });

      const updated = {
        ...prev,
        [selectedRoleCode]: {
          ...curCfg,
          allowed_paths: newAllowedPaths,
          action_permissions: newActionPerms
        }
      };

      saveActiveRBACMatrix(updated);
      emitEvent('rbac_permissions_updated', 'Bulk RBAC Update', `${curCfg.role_name}: Bulk updated ${groupName}`, 'info');
      return updated;
    });

    showToast(`${grantAll ? (readOnlyOnly ? 'Set Read-Only' : 'Granted All Actions') : 'Revoked All'} for ${groupName}`);
  };

  // ----------------------------------------------------
  // PERSON-SPECIFIC OVERRIDE HANDLERS
  // ----------------------------------------------------
  const handleTogglePersonOverrideStatus = (enable: boolean) => {
    setUserOverrides(prev => {
      const existing = prev[selectedUser.id] || {
        userId: selectedUser.id,
        userName: selectedUser.name,
        userEmail: selectedUser.email,
        roleCode: selectedUser.role_code,
        customPaths: [...(rbacMatrix[selectedUser.role_code]?.allowed_paths || [])],
        actionOverrides: {}
      };

      const updated = {
        ...prev,
        [selectedUser.id]: {
          ...existing,
          enabled: enable
        }
      };

      saveUserSpecificOverrides(updated);
      emitEvent('rbac_permissions_updated', 'Person Override Toggled', `${selectedUser.name} custom override is now ${enable ? 'ACTIVE' : 'DISABLED'}`, 'info');
      return updated;
    });

    showToast(`Custom override for ${selectedUser.name} is now ${enable ? 'ACTIVE' : 'INHERITING ROLE DEFAULTS'}`);
  };

  const handleTogglePersonAction = (
    moduleKey: string,
    action: 'view' | 'add' | 'edit' | 'delete',
    path?: string
  ) => {
    setUserOverrides(prev => {
      const existing = prev[selectedUser.id] || {
        userId: selectedUser.id,
        userName: selectedUser.name,
        userEmail: selectedUser.email,
        roleCode: selectedUser.role_code,
        enabled: true,
        customPaths: [...(rbacMatrix[selectedUser.role_code]?.allowed_paths || [])],
        actionOverrides: {}
      };

      const targetKey = path || moduleKey;
      const curTargetOverrides = existing.actionOverrides[targetKey] || {};
      const baseRolePerm = rbacMatrix[selectedUser.role_code]?.action_permissions?.[targetKey]?.[action];
      const effectiveCurrentVal = curTargetOverrides[action] !== undefined
        ? curTargetOverrides[action]
        : (baseRolePerm !== undefined ? baseRolePerm : (action === 'view'));

      const newVal = !effectiveCurrentVal;

      let newPaths = existing.customPaths ? [...existing.customPaths] : [...(rbacMatrix[selectedUser.role_code]?.allowed_paths || [])];
      if (path && action === 'view') {
        if (!newVal) {
          newPaths = newPaths.filter(p => p !== path);
        } else if (!newPaths.includes(path)) {
          newPaths.push(path);
        }
      }

      const updated = {
        ...prev,
        [selectedUser.id]: {
          ...existing,
          enabled: true, // Auto-enable overrides when customized
          customPaths: newPaths,
          actionOverrides: {
            ...existing.actionOverrides,
            [targetKey]: {
              ...curTargetOverrides,
              [action]: newVal
            },
            [moduleKey]: {
              ...(existing.actionOverrides[moduleKey] || {}),
              [action]: newVal
            }
          }
        }
      };

      saveUserSpecificOverrides(updated);
      emitEvent('rbac_permissions_updated', 'User Permissions Updated', `${selectedUser.name}: ${action.toUpperCase()} button set to ${newVal ? 'ENABLED' : 'DISABLED'} on ${targetKey}`, 'info');
      return updated;
    });
  };

  const handleSetPersonModuleBulk = (groupName: string, grantAll: boolean, readOnlyOnly: boolean = false) => {
    setUserOverrides(prev => {
      const existing = prev[selectedUser.id] || {
        userId: selectedUser.id,
        userName: selectedUser.name,
        userEmail: selectedUser.email,
        roleCode: selectedUser.role_code,
        enabled: true,
        customPaths: [...(rbacMatrix[selectedUser.role_code]?.allowed_paths || [])],
        actionOverrides: {}
      };

      const submodules = ALL_SYSTEM_SUBMODULES.filter(s => s.moduleGroup === groupName);
      let newPaths = existing.customPaths ? [...existing.customPaths] : [...(rbacMatrix[selectedUser.role_code]?.allowed_paths || [])];
      const newActionOverrides = { ...existing.actionOverrides };

      submodules.forEach(sub => {
        if (grantAll) {
          if (!newPaths.includes(sub.path)) newPaths.push(sub.path);
          newActionOverrides[sub.path] = { view: true, add: !readOnlyOnly, edit: !readOnlyOnly, delete: !readOnlyOnly };
          newActionOverrides[sub.moduleKey] = { view: true, add: !readOnlyOnly, edit: !readOnlyOnly, delete: !readOnlyOnly };
        } else {
          newPaths = newPaths.filter(p => p !== sub.path);
          newActionOverrides[sub.path] = { view: false, add: false, edit: false, delete: false };
          newActionOverrides[sub.moduleKey] = { view: false, add: false, edit: false, delete: false };
        }
      });

      const updated = {
        ...prev,
        [selectedUser.id]: {
          ...existing,
          enabled: true,
          customPaths: newPaths,
          actionOverrides: newActionOverrides
        }
      };

      saveUserSpecificOverrides(updated);
      emitEvent('rbac_permissions_updated', 'User Override Updated', `${selectedUser.name}: Bulk updated ${groupName}`, 'info');
      return updated;
    });

    showToast(`${grantAll ? (readOnlyOnly ? 'Set Read-Only' : 'Granted Full Actions') : 'Revoked'} for ${selectedUser.name} on ${groupName}`);
  };

  // Instant Test Switcher (Role or Specific Person)
  const handleTestAsRole = async (roleCode: string) => {
    await demoSwitch(roleCode as RoleCode);
    showToast(`Switched active view to ${roleCode.toUpperCase()}. UI and action buttons are recomputed in real time!`);
  };

  const handleTestAsSpecificUser = async (u: SystemUserOption) => {
    await demoSwitch(u.role_code as RoleCode, u.email);
    showToast(`Switched session to ${u.name} (${u.role_name}). All personal overrides and permissions are live!`);
  };

  // Reset to Factory Defaults
  const handleResetDefaults = () => {
    saveActiveRBACMatrix(DEFAULT_RBAC_MATRIX);
    setRbacMatrix(DEFAULT_RBAC_MATRIX);
    saveUserSpecificOverrides({});
    setUserOverrides({});
    emitEvent('rbac_permissions_updated', 'RBAC Reset', 'Reset all permissions and overrides to factory defaults', 'warning');
    showToast('RBAC Matrix and all personal overrides reset to factory defaults.');
  };

  // Filter Submodules
  const groupedSubmodules = useMemo(() => {
    const groups: Record<string, SubmoduleItem[]> = {};
    ALL_SYSTEM_SUBMODULES.forEach(sub => {
      if (searchModule && !sub.label.toLowerCase().includes(searchModule.toLowerCase()) && !sub.moduleGroup.toLowerCase().includes(searchModule.toLowerCase())) {
        return;
      }
      if (!groups[sub.moduleGroup]) {
        groups[sub.moduleGroup] = [];
      }
      groups[sub.moduleGroup].push(sub);
    });
    return groups;
  }, [searchModule]);

  // Filter Users by Role Category and Active Search
  const filteredPeople = useMemo(() => {
    return allUsers.filter(u => {
      // 1. Role category filter
      if (selectedRoleCategory !== 'all') {
        if (selectedRoleCategory === 'hr') {
          if (u.role_code !== 'hr' && u.role_code !== 'hr_manager') return false;
        } else if (u.role_code !== selectedRoleCategory) {
          return false;
        }
      }

      // 2. Active search filter
      if (activeSearchFilter.trim()) {
        const q = activeSearchFilter.toLowerCase();
        const matchesName = u.name.toLowerCase().includes(q);
        const matchesEmail = u.email.toLowerCase().includes(q);
        const matchesId = u.id.toLowerCase().includes(q);
        const matchesDept = u.department?.toLowerCase().includes(q);
        const matchesRole = u.role_name?.toLowerCase().includes(q);
        return matchesName || matchesEmail || matchesId || matchesDept || matchesRole;
      }

      return true;
    });
  }, [allUsers, selectedRoleCategory, activeSearchFilter]);

  // Handle changing Role Category dropdown
  const handleRoleCategoryChange = (cat: string) => {
    setSelectedRoleCategory(cat);
    setActiveSearchFilter('');
    setSearchQueryInput('');

    // Filter people in this category
    const matching = allUsers.filter(u => {
      if (cat === 'all') return true;
      if (cat === 'hr') return u.role_code === 'hr' || u.role_code === 'hr_manager';
      return u.role_code === cat;
    });

    if (matching.length > 0) {
      const alreadyInCat = matching.some(u => u.id === selectedUser?.id);
      if (!alreadyInCat) {
        setSelectedUser(matching[0]);
        showToast(`Role: ${cat.toUpperCase()} — Selected ${matching[0].name} (${matching[0].id})`);
      }
    }
  };

  // Handle Search Button Click or Form Submit
  const handleExecuteSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQueryInput.trim();
    setActiveSearchFilter(query);

    if (query) {
      const q = query.toLowerCase();
      const match = allUsers.find(u =>
        u.id.toLowerCase() === q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );

      if (match) {
        setSelectedUser(match);
        if (selectedRoleCategory !== 'all' && selectedRoleCategory !== match.role_code) {
          setSelectedRoleCategory(match.role_code);
        }
        showToast(`Found & Selected: ${match.name} (${match.id})`);
      } else {
        showToast(`Filtered staff list matching "${query}".`);
      }
    }
  };

  const handleClearSearch = () => {
    setSearchQueryInput('');
    setActiveSearchFilter('');
  };

  // Submodule Header Info
  const headerInfo = useMemo(() => {
    switch (activeSubmodule) {
      case 'department-perms':
        return {
          title: 'Department Permissions & Scope',
          badge: 'Access Scopes',
          desc: 'Fine-tune functional permissions by business department (IT, HR, Sales, Accounts, Operations).'
        };
      case 'approval-workflows':
        return {
          title: 'Approval Workflow Settings',
          badge: 'Multi-Level Routing',
          desc: 'Configure multi-tier approval chains for leave requests, expense claims, and purchase requisitions.'
        };
      case 'branches':
        return {
          title: 'Branch / Office Locations',
          badge: 'Physical Node Master',
          desc: 'Manage geographical offices, biometric hardware associations, and regional shift policies.'
        };
      case 'config':
        return {
          title: 'System Security Configuration',
          badge: 'Core Settings',
          desc: 'Session timeout rules, password complexity enforcement, two-factor authentication, and IP whitelisting.'
        };
      case 'notifications':
        return {
          title: 'Notification Routing & Preferences',
          badge: 'Alert Channels',
          desc: 'Configure WebSocket live pushes, email digests, and urgent in-app alert broadcasts.'
        };
      case 'email-sms':
        return {
          title: 'Email / SMS Gateway Configuration',
          badge: 'Outbound Relays',
          desc: 'Configure corporate SMTP relay credentials and transactional SMS API gateways.'
        };
      case 'integrations':
        return {
          title: 'Integrations & API Keys',
          badge: 'Developer Endpoints',
          desc: 'Manage secret API keys, webhook triggers, EPFO sync connectors, and GST E-Invoice gateways.'
        };
      case 'audit-logs':
        return {
          title: 'Compliance Audit Logs',
          badge: 'Security Trail',
          desc: 'Immutable ledger of permission changes, elevation events, and data export timestamps.'
        };
      case 'sessions':
        return {
          title: 'Login & Session History',
          badge: 'Active Connections',
          desc: 'Real-time monitoring of connected client IPs, browser user-agents, and authenticated tokens.'
        };
      default:
        return {
          title: 'Roles & RBAC Matrix',
          badge: 'Live Action Permissions & Person Overrides',
          desc: 'Control real-time View, Add, Edit, and Delete action buttons by Role or for specific individual Employees, HR, and Managers.'
        };
    }
  }, [activeSubmodule]);

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
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>{headerInfo.badge}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {headerInfo.title}
          </h1>
          <p className="text-xs text-slate-500 max-w-xl">
            {headerInfo.desc}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleResetDefaults}
            className="inline-flex items-center px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={() => {
              saveActiveRBACMatrix(rbacMatrix);
              saveUserSpecificOverrides(userOverrides);
              emitEvent('rbac_permissions_updated', 'RBAC Matrix Saved', 'All permissions and individual overrides broadcast in real time', 'success');
              showToast('All RBAC action permissions & individual overrides saved and active in real time!');
            }}
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4 mr-1.5" />
            <span>Save & Apply Live</span>
          </button>
        </div>
      </div>

      {/* --------------------------------------------------------------------------------- */}
      {/* VIEW: INTEGRATIONS & API KEYS */}
      {/* --------------------------------------------------------------------------------- */}
      {activeSubmodule === 'integrations' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-slate-900">Live API Key</span>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active Key
                </span>
              </div>
              <p className="text-xs text-slate-500">Bearer token used for automated payroll sync, biometric devices, and ERP integrations.</p>
              <div className="flex items-center space-x-2">
                <input
                  type="password"
                  readOnly
                  value={apiKey}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(apiKey);
                    showToast('API Key copied to clipboard!');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold shrink-0 cursor-pointer"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-slate-900">Realtime Event Webhook</span>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  Webhook URL
                </span>
              </div>
              <p className="text-xs text-slate-500">Destination URL notified on ticket creation, biometric punches, and invoice generation.</p>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800"
                />
                <button
                  onClick={() => showToast('Webhook destination updated!')}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shrink-0 cursor-pointer"
                >
                  Update
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="font-extrabold text-sm text-slate-900 mb-4">Enterprise Connectors</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <span className="font-black text-xs text-slate-900 block">EPFO Unified Member Portal</span>
                  <span className="text-[10px] text-emerald-600 font-bold">Connected • Synced</span>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <span className="font-black text-xs text-slate-900 block">GST E-Invoice & E-Way (NIC)</span>
                  <span className="text-[10px] text-emerald-600 font-bold">Connected • Production GSP</span>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <span className="font-black text-xs text-slate-900 block">Biometric Hardware Engine</span>
                  <span className="text-[10px] text-emerald-600 font-bold">12 Terminal Nodes Online</span>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      ) : activeSubmodule === 'config' ? (
        /* --------------------------------------------------------------------------------- */
        /* VIEW: SYSTEM CONFIGURATION */
        /* --------------------------------------------------------------------------------- */
        <div className="max-w-2xl bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900">Security & Operational Policies</h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Session Inactivity Timeout (Minutes)</label>
              <input
                type="number"
                value={sessionTimeoutMins}
                onChange={(e) => setSessionTimeoutMins(parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Corporate IP Whitelist CIDR</label>
              <input
                type="text"
                value={ipWhitelist}
                onChange={(e) => setIpWhitelist(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="font-bold text-slate-800 block">Enforce Two-Factor Authentication (2FA)</span>
                <span className="text-slate-500 text-[11px]">Require TOTP authenticator code for all staff logins</span>
              </div>
              <input
                type="checkbox"
                checked={require2FA}
                onChange={(e) => setRequire2FA(e.target.checked)}
                className="w-4 h-4 accent-blue-600 cursor-pointer"
              />
            </div>

            <button
              onClick={() => showToast('System security configuration saved!')}
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
            >
              Save Configuration
            </button>
          </div>
        </div>
      ) : (
        /* --------------------------------------------------------------------------------- */
        /* DEFAULT VIEW: ROLES & RBAC MATRIX (FULL REAL-TIME DUAL-MODE) */
        /* --------------------------------------------------------------------------------- */
        <div className="space-y-6">
          {/* Dual Mode Switcher: Role Configuration vs Individual Person Overrides */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80 gap-2">
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setConfigMode('role')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  configMode === 'role'
                    ? 'bg-white text-blue-700 shadow-sm border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>1. Configure by Role (Role Matrix)</span>
              </button>

              <button
                onClick={() => setConfigMode('user')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  configMode === 'user'
                    ? 'bg-white text-blue-700 shadow-sm border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>2. Configure by Individual Person (By Name)</span>
                {Object.keys(userOverrides).filter(k => userOverrides[k]?.enabled).length > 0 && (
                  <span className="ml-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                    {Object.keys(userOverrides).filter(k => userOverrides[k]?.enabled).length} Custom Active
                  </span>
                )}
              </button>
            </div>

            <span className="text-[11px] text-slate-500 font-medium px-3">
              {configMode === 'role'
                ? 'Applies default action permissions across all users in the selected role'
                : 'Sets custom overrides for a specific individual employee, HR, or manager'}
            </span>
          </div>

          {/* ------------------------------------------------------------------------- */}
          {/* CONFIG MODE 1: ROLE-LEVEL SELECTION & CONTROLS */}
          {/* ------------------------------------------------------------------------- */}
          {configMode === 'role' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Select Role to Configure Action Permissions
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {Object.values(rbacMatrix).map((r) => {
                      const isSelected = selectedRoleCode === r.role_code;
                      return (
                        <button
                          key={r.role_code}
                          onClick={() => setSelectedRoleCode(r.role_code)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-102'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {r.role_name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Instant Test Active Role Button */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-3 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Live Testing</span>
                    <span className="text-xs font-black text-slate-800">Preview as {selectedRoleConfig.role_name}</span>
                  </div>
                  <button
                    onClick={() => handleTestAsRole(selectedRoleCode)}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" />
                    <span>Switch Role Now</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <span className="text-slate-500">
                  Editing: <strong className="text-slate-900">{selectedRoleConfig.role_name}</strong> — {selectedRoleConfig.description}
                </span>
                <div className="flex items-center space-x-3 text-[11px] font-bold">
                  <span className="flex items-center space-x-1 text-emerald-600">
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>View (Menu & Page)</span>
                  </span>
                  <span className="flex items-center space-x-1 text-blue-600">
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Button</span>
                  </span>
                  <span className="flex items-center space-x-1 text-amber-600">
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Button</span>
                  </span>
                  <span className="flex items-center space-x-1 text-rose-600">
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Button</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------------- */}
          {/* CONFIG MODE 2: INDIVIDUAL PERSON SELECTION & CUSTOM OVERRIDES */}
          {/* ------------------------------------------------------------------------- */}
          {configMode === 'user' && (
            <div className="space-y-4">
              {/* User Selection & Dropdown Filter Strip */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <span>Configure Individual Person Permissions (Step-by-Step)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      1. Select Role category from the first dropdown, 2. Choose the team member from the second dropdown (with Name & ID), or use Search.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => navigate('/app/admin/users')}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition-colors cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      <span>User Management Table</span>
                    </button>
                  </div>
                </div>

                {/* The Two Dropdowns + Search Bar */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 p-4 rounded-xl bg-slate-50/90 border border-slate-200/90">
                  {/* Dropdown 1: Role Category Filter */}
                  <div className="md:col-span-4">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5">
                      1. Select Role Category:
                    </label>
                    <select
                      value={selectedRoleCategory}
                      onChange={(e) => handleRoleCategoryChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-800 shadow-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-blue-600 cursor-pointer"
                    >
                      <option value="all">All Roles (Show All Staff)</option>
                      <option value="hr">👥 HR Manager (Human Resources)</option>
                      <option value="manager">💼 Team Manager (Projects & Approvals)</option>
                      <option value="employee">👤 Employee (General Staff)</option>
                      <option value="sub_admin">🛡️ Sub Admin (Branch Head)</option>
                      <option value="super_admin">👑 Super Admin (Full Control)</option>
                      <option value="sales">📈 Sales Director (Commercial)</option>
                      <option value="accounts">💰 Finance Controller (Accounts)</option>
                    </select>
                  </div>

                  {/* Dropdown 2: Person Selector with Name + ID */}
                  <div className="md:col-span-4">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5">
                      2. Select Person (Name with ID):
                    </label>
                    <select
                      value={selectedUser?.id || ''}
                      onChange={(e) => {
                        const found = allUsers.find(u => u.id === e.target.value);
                        if (found) {
                          setSelectedUser(found);
                          showToast(`Selected: ${found.name} (${found.id})`);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-800 shadow-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-blue-600 cursor-pointer"
                    >
                      {filteredPeople.length === 0 ? (
                        <option value="" disabled>No users found in this role</option>
                      ) : (
                        filteredPeople.map((u) => {
                          const hasOverride = userOverrides[u.id]?.enabled;
                          return (
                            <option key={u.id} value={u.id}>
                              {u.name} (ID: {u.id}) — {u.department || u.role_name} {hasOverride ? '★ [Custom Active]' : ''}
                            </option>
                          );
                        })
                      )}
                    </select>
                  </div>

                  {/* Search Input + Search Button */}
                  <div className="md:col-span-4">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5">
                      3. Search by Name or ID:
                    </label>
                    <form onSubmit={handleExecuteSearch} className="flex items-center space-x-2">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          placeholder="e.g. Rahul, HR-1001..."
                          value={searchQueryInput}
                          onChange={(e) => setSearchQueryInput(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:outline-blue-600 shadow-xs"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center space-x-1 cursor-pointer shrink-0"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>Search</span>
                      </button>
                      {activeSearchFilter && (
                        <button
                          type="button"
                          onClick={handleClearSearch}
                          className="px-2.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors cursor-pointer shrink-0"
                          title="Reset Search"
                        >
                          Clear
                        </button>
                      )}
                    </form>
                  </div>
                </div>

                {/* Quick Selection Cards Grid (Filtered by Role & Search) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Staff Matching Filter ({filteredPeople.length} people)
                    </span>
                    <span className="text-[10px] text-slate-400">Click any card to select</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-1">
                    {filteredPeople.map((u) => {
                      const isSelected = selectedUser?.id === u.id;
                      const hasActiveOverride = userOverrides[u.id]?.enabled;

                      return (
                        <div
                          key={u.id}
                          onClick={() => {
                            setSelectedUser(u);
                            showToast(`Selected: ${u.name} (${u.id})`);
                          }}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-500/25 shadow-xs'
                              : 'bg-white hover:bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                              isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {u.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="min-w-0">
                              <span className="font-extrabold text-xs text-slate-900 block truncate">{u.name}</span>
                              <div className="flex items-center space-x-1.5 mt-0.5">
                                <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                                  {u.id}
                                </span>
                                <span className="text-[10px] text-slate-500 truncate">{u.role_name.split(' ')[0]}</span>
                              </div>
                            </div>
                          </div>

                          {hasActiveOverride && (
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 ml-1.5 ring-2 ring-emerald-200" title="Custom override active" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Selected User Hero Dossier */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4 min-w-0">
                  <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-base shadow-inner shrink-0">
                    {selectedUser?.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                      <h2 className="font-black text-lg text-white tracking-tight">{selectedUser?.name}</h2>
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-white/20 text-blue-200 border border-white/20">
                        ID: {selectedUser?.id}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-400/30">
                        Base: {selectedUser?.role_name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 flex items-center gap-2 flex-wrap">
                      <span>{selectedUser?.email}</span>
                      <span>•</span>
                      <span>Department: <strong>{selectedUser?.department || 'General'}</strong></span>
                      {selectedUser?.phone && (
                        <>
                          <span>•</span>
                          <span>{selectedUser.phone}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  {/* Override Toggle */}
                  <div className="flex items-center space-x-2.5 bg-white/10 px-3.5 py-2 rounded-xl border border-white/10">
                    <span className="text-xs font-bold text-slate-200">Person Overrides:</span>
                    <button
                      onClick={() => handleTogglePersonOverrideStatus(!currentPersonOverride.enabled)}
                      className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        currentPersonOverride.enabled
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'bg-white/20 text-slate-300 hover:bg-white/30'
                      }`}
                    >
                      {currentPersonOverride.enabled ? 'ACTIVE (Customized)' : 'INHERIT ROLE'}
                    </button>
                  </div>

                  {/* Switch and Test User Button */}
                  <button
                    onClick={() => handleTestAsSpecificUser(selectedUser)}
                    className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>Test As {selectedUser?.name.split(' ')[0]} Now</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Module Filter Search */}
          <div className="flex items-center space-x-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search module or submodule (e.g., Asset Register, Support Tickets, Goals, Daily Reports)..."
              value={searchModule}
              onChange={(e) => setSearchModule(e.target.value)}
              className="w-full text-xs font-semibold focus:outline-none bg-transparent"
            />
          </div>

          {/* ------------------------------------------------------------------------- */}
          {/* PERMISSIONS MATRIX: ALL MODULE SUITES WITH 4 INTERACTIVE CHECKBOXES */}
          {/* ------------------------------------------------------------------------- */}
          <div className="space-y-5">
            {Object.entries(groupedSubmodules).map(([groupName, items]) => {
              const isRoleSuperAdmin = selectedRoleCode === 'super_admin';

              return (
                <div key={groupName} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  {/* Suite Group Header */}
                  <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <span className="font-black text-sm text-slate-900">{groupName} Suite</span>
                      <span className="text-[10px] font-bold text-slate-500 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                        {items.length} Submodules
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          if (configMode === 'role') {
                            handleSetRoleModuleBulk(groupName, true, false);
                          } else {
                            handleSetPersonModuleBulk(groupName, true, false);
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-50 cursor-pointer"
                      >
                        Grant Full Actions
                      </button>
                      <button
                        onClick={() => {
                          if (configMode === 'role') {
                            handleSetRoleModuleBulk(groupName, true, true);
                          } else {
                            handleSetPersonModuleBulk(groupName, true, true);
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                      >
                        Read-Only (View)
                      </button>
                      <button
                        onClick={() => {
                          if (configMode === 'role') {
                            handleSetRoleModuleBulk(groupName, false, false);
                          } else {
                            handleSetPersonModuleBulk(groupName, false, false);
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer"
                      >
                        Deny Suite
                      </button>
                    </div>
                  </div>

                  {/* Submodule Table / Grid with 4 Checkboxes */}
                  <div className="divide-y divide-slate-100">
                    {items.map((sub) => {
                      // Compute current permissions based on Mode
                      let viewAllowed = false;
                      let addAllowed = false;
                      let editAllowed = false;
                      let deleteAllowed = false;
                      let isOverriddenForPerson = false;

                      if (configMode === 'role') {
                        if (isRoleSuperAdmin) {
                          viewAllowed = true;
                          addAllowed = true;
                          editAllowed = true;
                          deleteAllowed = true;
                        } else {
                          const roleActions = selectedRoleConfig.action_permissions?.[sub.path] ||
                            selectedRoleConfig.action_permissions?.[sub.moduleKey];

                          viewAllowed = selectedRoleConfig.allowed_paths.includes(sub.path) || selectedRoleConfig.allowed_paths.includes('*');
                          addAllowed = roleActions?.add !== undefined ? roleActions.add : (selectedRoleCode !== 'employee');
                          editAllowed = roleActions?.edit !== undefined ? roleActions.edit : (selectedRoleCode !== 'employee');
                          deleteAllowed = roleActions?.delete !== undefined ? roleActions.delete : (selectedRoleCode === 'sub_admin');
                        }
                      } else {
                        // User-specific computation
                        const baseRoleCfg = rbacMatrix[selectedUser.role_code] || DEFAULT_RBAC_MATRIX.employee;
                        const baseActions = baseRoleCfg.action_permissions?.[sub.path] || baseRoleCfg.action_permissions?.[sub.moduleKey];

                        // Base defaults
                        const baseView = baseRoleCfg.allowed_paths.includes(sub.path) || baseRoleCfg.allowed_paths.includes('*');
                        const baseAdd = baseActions?.add !== undefined ? baseActions.add : (selectedUser.role_code !== 'employee');
                        const baseEdit = baseActions?.edit !== undefined ? baseActions.edit : (selectedUser.role_code !== 'employee');
                        const baseDelete = baseActions?.delete !== undefined ? baseActions.delete : (selectedUser.role_code === 'sub_admin' || selectedUser.role_code === 'super_admin');

                        if (currentPersonOverride.enabled) {
                          const personCustomPaths = currentPersonOverride.customPaths;
                          const personActionOverrides = currentPersonOverride.actionOverrides[sub.path] || currentPersonOverride.actionOverrides[sub.moduleKey];

                          if (personCustomPaths) {
                            viewAllowed = personCustomPaths.includes('*') || personCustomPaths.includes(sub.path);
                          } else {
                            viewAllowed = baseView;
                          }

                          addAllowed = personActionOverrides?.add !== undefined ? personActionOverrides.add : baseAdd;
                          editAllowed = personActionOverrides?.edit !== undefined ? personActionOverrides.edit : baseEdit;
                          deleteAllowed = personActionOverrides?.delete !== undefined ? personActionOverrides.delete : baseDelete;

                          isOverriddenForPerson = !!(personActionOverrides || (personCustomPaths && personCustomPaths.includes(sub.path) !== baseView));
                        } else {
                          viewAllowed = baseView;
                          addAllowed = baseAdd;
                          editAllowed = baseEdit;
                          deleteAllowed = baseDelete;
                        }
                      }

                      return (
                        <div
                          key={sub.path}
                          className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-left"
                        >
                          {/* Left: Label & Path */}
                          <div className="min-w-0 pr-4">
                            <div className="flex items-center space-x-2">
                              <span className="font-extrabold text-xs text-slate-900 block truncate">
                                {sub.label}
                              </span>
                              {configMode === 'user' && isOverriddenForPerson && (
                                <span className="px-2 py-0.5 rounded text-[9px] font-black bg-blue-100 text-blue-700">
                                  Custom
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-[10px] text-slate-400 block truncate">
                              {sub.path}
                            </span>
                          </div>

                          {/* Right: 4 Granular Checkboxes (View, Add, Edit, Delete) */}
                          <div className="flex items-center space-x-3 sm:space-x-5 shrink-0">
                            {/* 1. VIEW TICK */}
                            <label className="flex items-center space-x-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={viewAllowed}
                                disabled={isRoleSuperAdmin}
                                onChange={() => {
                                  if (configMode === 'role') {
                                    handleToggleRolePath(sub.path);
                                  } else {
                                    handleTogglePersonAction(sub.moduleKey, 'view', sub.path);
                                  }
                                }}
                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                              />
                              <span className={`text-xs font-bold ${viewAllowed ? 'text-emerald-700' : 'text-slate-400'}`}>
                                View
                              </span>
                            </label>

                            {/* 2. ADD BUTTON TICK */}
                            <label className="flex items-center space-x-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={addAllowed}
                                disabled={isRoleSuperAdmin}
                                onChange={() => {
                                  if (configMode === 'role') {
                                    handleToggleRoleAction(sub.moduleKey, 'add', sub.path);
                                  } else {
                                    handleTogglePersonAction(sub.moduleKey, 'add', sub.path);
                                  }
                                }}
                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                              />
                              <span className={`text-xs font-bold ${addAllowed ? 'text-blue-700' : 'text-slate-400'}`}>
                                + Add
                              </span>
                            </label>

                            {/* 3. EDIT BUTTON TICK */}
                            <label className="flex items-center space-x-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editAllowed}
                                disabled={isRoleSuperAdmin}
                                onChange={() => {
                                  if (configMode === 'role') {
                                    handleToggleRoleAction(sub.moduleKey, 'edit', sub.path);
                                  } else {
                                    handleTogglePersonAction(sub.moduleKey, 'edit', sub.path);
                                  }
                                }}
                                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
                              />
                              <span className={`text-xs font-bold ${editAllowed ? 'text-amber-700' : 'text-slate-400'}`}>
                                Edit
                              </span>
                            </label>

                            {/* 4. DELETE BUTTON TICK */}
                            <label className="flex items-center space-x-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={deleteAllowed}
                                disabled={isRoleSuperAdmin}
                                onChange={() => {
                                  if (configMode === 'role') {
                                    handleToggleRoleAction(sub.moduleKey, 'delete', sub.path);
                                  } else {
                                    handleTogglePersonAction(sub.moduleKey, 'delete', sub.path);
                                  }
                                }}
                                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 cursor-pointer"
                              />
                              <span className={`text-xs font-bold ${deleteAllowed ? 'text-rose-700' : 'text-slate-400'}`}>
                                Delete
                              </span>
                            </label>
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
    </div>
  );
};

export default RolesPage;
