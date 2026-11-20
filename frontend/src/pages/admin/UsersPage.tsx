import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Plus, Shield, ShieldCheck, Mail, Phone, Building2,
  Search, Filter, Edit, Trash2, ArrowRightLeft, CheckCircle2,
  UserCheck, KeyRound, AlertTriangle, Copy, Check, ExternalLink,
  RefreshCw, Sliders, Lock, CheckCircle, XCircle, Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import { Modal } from '../../components/common/Modal';
import {
  getSystemUsers,
  saveSystemUsers,
  addSystemUser,
  updateSystemUser,
  deleteSystemUser,
  getUserSpecificOverrides,
  ROLE_CATEGORIES,
  DEFAULT_RBAC_MATRIX,
  type SystemUserOption
} from '../../utils/rbacMatrix';
import type { RoleCode } from '../../types';

export const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser, demoSwitch } = useAuth();
  const { emitEvent, subscribe } = useRealtime();

  const [users, setUsers] = useState<SystemUserOption[]>(() => getSystemUsers());
  const [userOverrides, setUserOverrides] = useState(() => getUserSpecificOverrides());
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [mobileFilterSheetOpen, setMobileFilterSheetOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    id: '',
    role_code: 'employee',
    department: 'Engineering',
    phone: '',
    status: 'active' as 'active' | 'inactive',
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Real-time synchronization
  useEffect(() => {
    const handleUsersUpdate = () => {
      setUsers(getSystemUsers());
      setUserOverrides(getUserSpecificOverrides());
    };
    window.addEventListener('kalinga_users_updated', handleUsersUpdate);
    window.addEventListener('kalinga_rbac_updated', handleUsersUpdate);

    const unsub = subscribe('system_user_created', () => {
      setUsers(getSystemUsers());
    });

    return () => {
      window.removeEventListener('kalinga_users_updated', handleUsersUpdate);
      window.removeEventListener('kalinga_rbac_updated', handleUsersUpdate);
      unsub();
    };
  }, [subscribe]);

  // Unique Departments
  const departments = useMemo(() => {
    const set = new Set<string>();
    users.forEach(u => {
      if (u.department) set.add(u.department);
    });
    return Array.from(set);
  }, [users]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (roleFilter !== 'all' && u.role_code !== roleFilter) return false;
      if (departmentFilter !== 'all' && u.department !== departmentFilter) return false;
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = u.name.toLowerCase().includes(q);
        const matchesEmail = u.email.toLowerCase().includes(q);
        const matchesId = u.id.toLowerCase().includes(q);
        const matchesDept = u.department?.toLowerCase().includes(q);
        const matchesRole = u.role_name?.toLowerCase().includes(q);
        return matchesName || matchesEmail || matchesId || matchesDept || matchesRole;
      }
      return true;
    });
  }, [users, roleFilter, departmentFilter, statusFilter, searchQuery]);

  // Metrics
  const metrics = useMemo(() => {
    const total = users.length;
    const admins = users.filter(u => u.role_code === 'super_admin' || u.role_code === 'sub_admin').length;
    const hr = users.filter(u => u.role_code === 'hr' || u.role_code === 'hr_manager').length;
    const managers = users.filter(u => u.role_code === 'manager').length;
    const staff = users.filter(u => u.role_code === 'employee').length;
    return { total, admins, hr, managers, staff };
  }, [users]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setModalMode('add');
    setEditingUserId(null);
    setFormData({
      name: '',
      email: '',
      id: '',
      role_code: 'employee',
      department: 'Engineering',
      phone: '',
      status: 'active',
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (user: SystemUserOption) => {
    setModalMode('edit');
    setEditingUserId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      id: user.id,
      role_code: user.role_code,
      department: user.department || 'Engineering',
      phone: user.phone || '',
      status: user.status || 'active',
    });
    setIsModalOpen(true);
  };

  // Submit Form
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      showToast('Please enter both name and email.');
      return;
    }

    if (modalMode === 'add') {
      const added = addSystemUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        id: formData.id.trim() || undefined,
        role_code: formData.role_code,
        role_name: ROLE_CATEGORIES.find(r => r.code === formData.role_code)?.label.split(' (')[0] || 'Staff User',
        department: formData.department,
        phone: formData.phone.trim() || undefined,
        status: formData.status,
      });

      emitEvent('system_user_created', 'New User Added', `${added.name} (${added.id}) added as ${added.role_name}`, 'info');
      showToast(`User ${added.name} (${added.id}) added successfully!`);
    } else if (modalMode === 'edit' && editingUserId) {
      const updated = updateSystemUser(editingUserId, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role_code: formData.role_code,
        role_name: ROLE_CATEGORIES.find(r => r.code === formData.role_code)?.label.split(' (')[0] || 'Staff User',
        department: formData.department,
        phone: formData.phone.trim() || undefined,
        status: formData.status,
      });

      if (updated) {
        emitEvent('system_user_updated', 'User Updated', `${updated.name} profile updated`, 'info');
        showToast(`User ${updated.name} updated successfully!`);
      }
    }

    setUsers(getSystemUsers());
    setIsModalOpen(false);
  };

  // Delete User
  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove ${name} (${id}) from the system?`)) {
      deleteSystemUser(id);
      setUsers(getSystemUsers());
      showToast(`User ${name} removed from system.`);
    }
  };

  // Copy ID
  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast(`Copied ID: ${id}`);
  };

  // Test Role
  const handleTestRole = (roleCode: string) => {
    demoSwitch(roleCode as RoleCode);
    showToast(`Switched active view to: ${roleCode.toUpperCase()}`);
  };

  // Navigate to Role & Matrix for this specific user
  const handleConfigurePermissions = (user: SystemUserOption) => {
    navigate(`/app/admin/roles?mode=user&userId=${encodeURIComponent(user.id)}&role=${encodeURIComponent(user.role_code)}`);
  };

  // Role Badge Styling
  const getRoleBadge = (roleCode: string, roleName: string) => {
    switch (roleCode) {
      case 'super_admin':
        return <span className="px-2.5 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-700 border border-purple-200">👑 Super Admin</span>;
      case 'sub_admin':
        return <span className="px-2.5 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-700 border border-indigo-200">🛡️ Sub Admin</span>;
      case 'hr':
      case 'hr_manager':
        return <span className="px-2.5 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-700 border border-blue-200">👥 HR Manager</span>;
      case 'manager':
        return <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-700 border border-emerald-200">💼 Team Manager</span>;
      case 'sales':
        return <span className="px-2.5 py-1 rounded-full text-xs font-black bg-sky-100 text-sky-700 border border-sky-200">📈 Sales Director</span>;
      case 'accounts':
        return <span className="px-2.5 py-1 rounded-full text-xs font-black bg-teal-100 text-teal-700 border border-teal-200">💰 Finance Controller</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200">👤 Employee</span>;
    }
  };

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
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Corporate Access & User Directory</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            User Management
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl">
            Add and manage enterprise team members, assign organizational roles (Super Admin, Sub Admin, HR, Manager, Employee), and configure module access permissions.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setUsers(getSystemUsers());
              showToast('User directory refreshed!');
            }}
            className="inline-flex items-center px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => navigate('/app/admin/roles')}
            className="inline-flex items-center px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 mr-1.5 text-blue-600" />
            <span>Role & Matrix Page</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs shadow-md shadow-blue-500/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5 stroke-[3]" />
            <span>+ Add User</span>
          </button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Users</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-slate-900">{metrics.total}</span>
            <span className="text-[10px] text-emerald-600 font-bold">Active in ERP</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-purple-500 uppercase tracking-wider block">Admins & Subadmins</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-purple-700">{metrics.admins}</span>
            <span className="text-[10px] text-slate-400 font-bold">Executive</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-blue-500 uppercase tracking-wider block">HR Management</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-blue-700">{metrics.hr}</span>
            <span className="text-[10px] text-slate-400 font-bold">People Ops</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider block">Team Managers</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-emerald-700">{metrics.managers}</span>
            <span className="text-[10px] text-slate-400 font-bold">Approvers</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider block">Staff Employees</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-amber-700">{metrics.staff}</span>
            <span className="text-[10px] text-slate-400 font-bold">Self-Service</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by Name, Email, or ID (e.g. HR-1001)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-blue-600 bg-slate-50/50"
          />
        </div>

        {/* Desktop Filters (Inline on screens md: and up) */}
        <div className="hidden md:flex flex-wrap items-center gap-2.5">
          {/* Role Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-bold text-slate-500">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-700 focus:outline-blue-600 cursor-pointer"
            >
              <option value="all">All Roles</option>
              {ROLE_CATEGORIES.filter(r => r.code !== 'all').map(r => (
                <option key={r.code} value={r.code}>{r.label.split(' (')[0]}</option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-bold text-slate-500">Department:</span>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-700 focus:outline-blue-600 cursor-pointer"
            >
              <option value="all">All Departments</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-bold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-700 focus:outline-blue-600 cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {(roleFilter !== 'all' || departmentFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setRoleFilter('all');
                setDepartmentFilter('all');
                setStatusFilter('all');
                setSearchQuery('');
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-bold px-2 py-1 cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Mobile & Tablet Filter Button (Screens < 768px) */}
        <div className="flex md:hidden items-center justify-between gap-2 w-full pt-1">
          <button
            type="button"
            onClick={() => setMobileFilterSheetOpen(true)}
            className="flex-1 inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
          >
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Filter Users</span>
            {(roleFilter !== 'all' || departmentFilter !== 'all' || statusFilter !== 'all') && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-blue-600 text-white font-extrabold">Active</span>
            )}
          </button>

          {(roleFilter !== 'all' || departmentFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setRoleFilter('all');
                setDepartmentFilter('all');
                setStatusFilter('all');
                setSearchQuery('');
              }}
              className="px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Mobile Filter Bottom Sheet Modal */}
      {mobileFilterSheetOpen && (
        <div
          onClick={() => setMobileFilterSheetOpen(false)}
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto border border-slate-200 animate-in slide-in-from-bottom duration-200 text-left"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Filter className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Filter System Users</h3>
                  <p className="text-[11px] text-slate-500">Select parameters to refine user directory</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileFilterSheetOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 py-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Organizational Role</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold bg-slate-50 text-slate-800"
                >
                  <option value="all">All Roles</option>
                  {ROLE_CATEGORIES.filter(r => r.code !== 'all').map(r => (
                    <option key={r.code} value={r.code}>{r.label.split(' (')[0]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Assigned Department</label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold bg-slate-50 text-slate-800"
                >
                  <option value="all">All Departments</option>
                  {departments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Account Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold bg-slate-50 text-slate-800"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setRoleFilter('all');
                  setDepartmentFilter('all');
                  setStatusFilter('all');
                  setMobileFilterSheetOpen(false);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                Reset Filters
              </button>
              <button
                type="button"
                onClick={() => setMobileFilterSheetOpen(false)}
                className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-[#1877f2] hover:bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Submit & Apply Filters</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* 1. Desktop & Tablet Large Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                <th className="py-3.5 px-4">User Details</th>
                <th className="py-3.5 px-4">User ID</th>
                <th className="py-3.5 px-4">Assigned Role</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Custom Permissions</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    No system users match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const hasCustomOverride = userOverrides[u.id]?.enabled;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Name & Contact */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                            {u.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 block">{u.name}</span>
                            <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400 inline" />
                              {u.email}
                            </span>
                            {u.phone && (
                              <span className="text-[10px] text-slate-400 block mt-0.5">{u.phone}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* ID with Copy Button */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-mono text-[11px] font-bold">
                          <span>{u.id}</span>
                          <button
                            onClick={() => handleCopyId(u.id)}
                            className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                            title="Copy ID"
                          >
                            {copiedId === u.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getRoleBadge(u.role_code, u.role_name)}
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-700 block">{u.department || 'General'}</span>
                      </td>

                      {/* Overrides Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {hasCustomOverride ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            <span>Custom Active</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">
                            Role Default
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.status === 'active' || !u.status
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            u.status === 'active' || !u.status ? 'bg-emerald-500' : 'bg-rose-500'
                          }`} />
                          {u.status === 'active' || !u.status ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center space-x-1.5">
                          {/* Configure Permissions in Role Matrix */}
                          <button
                            onClick={() => handleConfigurePermissions(u)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] border border-blue-200 transition-colors cursor-pointer"
                            title="Configure Specific Permissions in Role Matrix"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                            <span>Permissions</span>
                          </button>

                          {/* Test As This User Role */}
                          <button
                            onClick={() => handleTestRole(u.role_code)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                            title={`Test System as ${u.name} (${u.role_name})`}
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit User Details */}
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                            title="Edit User Info"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete User */}
                          <button
                            onClick={() => handleDelete(u.id, u.name)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Remove User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 2. Mobile Responsive Cards View (Matching user photo reference for screens < 768px) */}
        <div className="md:hidden divide-y divide-slate-100 p-3 space-y-3 bg-slate-50/70">
          {filteredUsers.length === 0 ? (
            <div className="py-12 px-4 text-center bg-white rounded-2xl border border-slate-200">
              <p className="text-sm font-semibold text-slate-500">No system users match the selected filters.</p>
            </div>
          ) : (
            filteredUsers.map((u) => {
              const hasCustomOverride = userOverrides[u.id]?.enabled;
              return (
                <div
                  key={u.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm space-y-3 transition-all"
                >
                  {/* Top: Avatar, Name, Email & Role */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                        {u.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="min-w-0">
                        <span className="font-extrabold text-slate-900 text-sm block truncate">{u.name}</span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{u.email}</span>
                        </span>
                      </div>
                    </div>
                    <div>
                      {getRoleBadge(u.role_code, u.role_name)}
                    </div>
                  </div>

                  {/* Attributes Grid (2-3 Columns matching photo) */}
                  <div className="grid grid-cols-2 gap-2.5 pt-2.5 border-t border-slate-100 text-xs">
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">User ID</span>
                      <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[11px] font-bold mt-0.5">
                        <span>{u.id}</span>
                        <button
                          onClick={() => handleCopyId(u.id)}
                          className="text-slate-500 hover:text-slate-800"
                          title="Copy ID"
                        >
                          {copiedId === u.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Department</span>
                      <span className="font-bold text-slate-800 text-xs block mt-0.5">{u.department || 'General'}</span>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Custom Perms</span>
                      <div className="mt-0.5">
                        {hasCustomOverride ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">Role Default</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Account Status</span>
                      <div className="mt-0.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.status === 'active' || !u.status
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            u.status === 'active' || !u.status ? 'bg-emerald-500' : 'bg-rose-500'
                          }`} />
                          {u.status === 'active' || !u.status ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Row (Matching pastel pills in reference photo) */}
                  <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5 justify-end">
                    <button
                      onClick={() => handleConfigurePermissions(u)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] border border-blue-200 transition-colors cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Permissions</span>
                    </button>
                    <button
                      onClick={() => handleTestRole(u.role_code)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors cursor-pointer"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Test Role</span>
                    </button>
                    <button
                      onClick={() => handleOpenEdit(u)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-[11px] border border-amber-200 transition-colors cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    {u.role_code !== 'super_admin' && (
                      <button
                        onClick={() => handleDelete(u.id, u.name)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] border border-rose-200 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add / Edit User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'add' ? 'Add New System User' : 'Edit System User'}
        subtitle="Configure personal details, organizational role, and access scope."
        size="lg"
      >
        <form onSubmit={handleSubmitForm} className="space-y-4 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Priya Sharma"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-blue-600"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Corporate Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="e.g. priya@greenbacks.corp"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-blue-600"
              />
            </div>

            {/* User ID (Optional or Auto) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                User / Employee ID <span className="text-slate-400 font-normal">(Leave blank to auto-generate)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. HR-1005, EMP-1010, MGR-1004"
                value={formData.id}
                disabled={modalMode === 'edit'}
                onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                className={`w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-blue-600 ${
                  modalMode === 'edit' ? 'bg-slate-100 text-slate-500' : ''
                }`}
              />
            </div>

            {/* Role Code Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Assigned Role <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.role_code}
                onChange={(e) => setFormData(prev => ({ ...prev, role_code: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-800 focus:outline-blue-600 cursor-pointer"
              >
                {ROLE_CATEGORIES.filter(r => r.code !== 'all').map(r => (
                  <option key={r.code} value={r.code}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Department
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-800 focus:outline-blue-600 cursor-pointer"
              >
                <option value="Human Resources">Human Resources</option>
                <option value="Engineering">Engineering</option>
                <option value="Operations">Operations</option>
                <option value="Sales & BD">Sales & BD</option>
                <option value="Finance & Tax">Finance & Tax</option>
                <option value="Corporate Operations">Corporate Operations</option>
                <option value="Executive Board">Executive Board</option>
              </select>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                placeholder="e.g. +91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-blue-600"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Account Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-800 focus:outline-blue-600 cursor-pointer"
              >
                <option value="active">Active (Access Granted)</option>
                <option value="inactive">Inactive / Suspended</option>
              </select>
            </div>
          </div>

          {/* Role info alert */}
          <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200/80 text-xs text-blue-900 flex items-start space-x-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Automatic Role Matrix Binding:</span>
              <span className="text-[11px] text-blue-800">
                Assigning role <strong>{formData.role_code.toUpperCase()}</strong> applies the role permissions automatically. You can also customize individual button permissions (View, Add, Edit, Delete) anytime in the <strong>Role & Matrix Page</strong>.
              </span>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs shadow-md shadow-blue-500/25 transition-all cursor-pointer"
            >
              {modalMode === 'add' ? 'Add User & Assign Role' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UsersPage;
