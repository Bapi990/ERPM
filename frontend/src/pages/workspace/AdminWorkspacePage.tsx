import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Building2,
  Image as ImageIcon,
  KeyRound,
  ShieldCheck,
  Clock,
  Save,
  Upload,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Lock,
  Globe,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  RefreshCw,
  LogOut,
  Monitor,
  Check,
  Shield,
  FileBadge,
  Stamp,
  PenTool,
  Sliders,
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import { useTimeFormat, formatTime, TimeFormat } from '../../utils/timeFormat';
import { TimeInputPicker } from '../../components/common/TimeInputPicker';

export const AdminWorkspacePage: React.FC = () => {
  const { user } = useAuth();
  const { emitEvent } = useRealtime();
  const location = useLocation();
  const navigate = useNavigate();

  // Time format hook (12h vs 24h)
  const { timeFormat, setTimeFormat } = useTimeFormat();
  const [testTimeValue, setTestTimeValue] = useState<string>('09:30');
  const [liveClockTicker, setLiveClockTicker] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setLiveClockTicker(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Tab state derived from URL or local state
  const getTabFromPath = () => {
    if (location.pathname.includes('branding') || location.pathname.includes('logo')) return 'branding';
    if (location.pathname.includes('security') || location.pathname.includes('password')) return 'security';
    if (location.pathname.includes('sessions') || location.pathname.includes('login')) return 'sessions';
    if (location.pathname.includes('settings') || location.pathname.includes('time')) return 'settings';
    return 'details';
  };

  const [activeTab, setActiveTab] = useState<'details' | 'branding' | 'security' | 'sessions' | 'settings'>(getTabFromPath());

  useEffect(() => {
    setActiveTab(getTabFromPath());
  }, [location.pathname]);

  const handleTabChange = (tab: 'details' | 'branding' | 'security' | 'sessions' | 'settings') => {
    setActiveTab(tab);
    if (tab === 'details') navigate('/app/workspace/company-details');
    else if (tab === 'branding') navigate('/app/workspace/branding');
    else if (tab === 'security') navigate('/app/workspace/security');
    else if (tab === 'sessions') navigate('/app/workspace/sessions');
    else if (tab === 'settings') navigate('/app/workspace/settings');
  };

  // Toast State
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // 1. Company Profile State
  const [profileLoading, setProfileLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profile, setProfile] = useState({
    company_name: 'Odias ERP Technologies Pvt. Ltd.',
    trade_name: 'Odias Enterprise ERP',
    tagline: 'Leading Cloud ERP for Manufacturing, Defence & Commerce',
    pan: 'AAACR1234F',
    gstin: '21AAACR1234F1Z5',
    business_type: 'Private Limited Company',
    registration_type: 'Regular',
    cin: 'U72200OR2026PTC049210',
    date_of_incorporation: '2026-01-15',
    address: 'Plot 42, Infocity Avenue, Chandaka Industrial Estate, Patia',
    city: 'Bhubaneswar',
    district: 'Khurda',
    state: 'Odisha',
    pincode: '751024',
    state_code: '21',
    phone: '+91 674 2748000',
    email: 'corporate@odiaserp.com',
    website: 'https://odiaserp.com',
    bank_name: 'HDFC Bank Ltd.',
    bank_account_no: '50200088991122',
    bank_ifsc: 'HDFC0001234',
    bank_branch: 'Infocity Corporate Branch, Bhubaneswar',
    upi_id: 'odiaserp@hdfcbank',
    logo_url: '',
    favicon_url: '',
    company_photo_url: '',
    signature_url: '',
    stamp_url: '',
  });

  // 2. Password Change State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  // 3. Security Overview & Last Login State
  const [securityData, setSecurityData] = useState<any>(null);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [terminatingSessions, setTerminatingSessions] = useState(false);

  useEffect(() => {
    fetchCompanyProfile();
    fetchSecurityOverview();
  }, []);

  const fetchCompanyProfile = async () => {
    setProfileLoading(true);
    try {
      const data = await api.getCompanyProfile();
      if (data) {
        setProfile((prev) => ({
          ...prev,
          ...data,
        }));
        if (data.favicon_url) {
          applyFavicon(data.favicon_url);
        }
      }
    } catch (err) {
      console.error('Failed to load company profile:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchSecurityOverview = async () => {
    setSecurityLoading(true);
    try {
      const data = await api.getSecurityOverview();
      setSecurityData(data);
    } catch (err) {
      console.error('Failed to load security overview:', err);
    } finally {
      setSecurityLoading(false);
    }
  };

  const applyFavicon = (url: string) => {
    try {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = url;
    } catch (e) {
      console.error('Failed to apply favicon', e);
    }
  };

  // Save Company Details
  const handleSaveCompanyDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.updateCompanyProfile(profile);
      showToast('Company profile details updated successfully in realtime!');
      emitEvent('company_profile_updated', 'Company Profile Updated', `${profile.company_name} details updated in realtime.`, 'success');
      emitEvent('branding_updated', 'Branding Updated', 'Company branding updated in realtime.', 'success');
      window.dispatchEvent(new CustomEvent('odias_branding_updated', { detail: profile }));
      fetchCompanyProfile();
    } catch (err: any) {
      showToast(err.message || 'Failed to update company details', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  // Upload or convert file to Base64 with INSTANT REALTIME PERSISTENCE
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'logo_url' | 'favicon_url' | 'company_photo_url' | 'signature_url' | 'stamp_url'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      showToast('File size exceeds 3MB limit. Please upload an image under 3MB.', 'error');
      return;
    }

    const fieldLabel = field === 'logo_url'
      ? 'Official Logo'
      : field === 'favicon_url'
      ? 'Browser Favicon'
      : field === 'company_photo_url'
      ? 'Company HQ Photo'
      : field === 'signature_url'
      ? 'Authorized Signature'
      : 'Company Seal';

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setProfile((prev) => ({
        ...prev,
        [field]: base64String,
      }));

      if (field === 'favicon_url') {
        applyFavicon(base64String);
        try {
          localStorage.setItem('odias_erp_favicon', base64String);
        } catch (e) {}
      }
      if (field === 'logo_url') {
        try {
          localStorage.setItem('odias_erp_logo', base64String);
        } catch (e) {}
      }

      // Automatically persist to backend immediately in realtime!
      try {
        await api.updateCompanyProfile({ [field]: base64String });
        showToast(`${fieldLabel} uploaded & updated live in real time!`, 'success');
        emitEvent('branding_updated', 'Branding Asset Live Update', `${fieldLabel} updated in real time.`, 'success');
        emitEvent('company_profile_updated', 'Company Profile Updated', `${fieldLabel} changed live.`, 'info');
        window.dispatchEvent(new CustomEvent('odias_branding_updated', { detail: { field, value: base64String } }));
      } catch (err: any) {
        console.error('Failed to auto-save branding asset:', err);
        showToast(`Image loaded locally. Click 'Save Brand Assets' to persist: ${err.message || ''}`, 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  // Remove/Reset Brand Image Asset
  const handleRemoveAsset = async (
    field: 'logo_url' | 'favicon_url' | 'company_photo_url' | 'signature_url' | 'stamp_url'
  ) => {
    const fieldLabel = field === 'logo_url'
      ? 'Official Logo'
      : field === 'favicon_url'
      ? 'Browser Favicon'
      : field === 'company_photo_url'
      ? 'Company HQ Photo'
      : field === 'signature_url'
      ? 'Authorized Signature'
      : 'Company Seal';

    setProfile((prev) => ({
      ...prev,
      [field]: '',
    }));

    if (field === 'favicon_url') {
      try {
        localStorage.removeItem('odias_erp_favicon');
      } catch (e) {}
    }
    if (field === 'logo_url') {
      try {
        localStorage.removeItem('odias_erp_logo');
      } catch (e) {}
    }

    try {
      await api.updateCompanyProfile({ [field]: '' });
      showToast(`${fieldLabel} removed in real time!`, 'success');
      emitEvent('branding_updated', 'Branding Asset Removed', `${fieldLabel} reset.`, 'info');
      emitEvent('company_profile_updated', 'Company Profile Updated', `${fieldLabel} removed.`, 'info');
      window.dispatchEvent(new CustomEvent('odias_branding_updated', { detail: { field, value: '' } }));
    } catch (err: any) {
      showToast(err.message || 'Failed to remove asset', 'error');
    }
  };

  // Save Branding Images
  const handleSaveBranding = async () => {
    setSavingProfile(true);
    try {
      await api.updateCompanyProfile({
        logo_url: profile.logo_url,
        favicon_url: profile.favicon_url,
        company_photo_url: profile.company_photo_url,
        signature_url: profile.signature_url,
        stamp_url: profile.stamp_url,
      });

      if (profile.favicon_url) {
        applyFavicon(profile.favicon_url);
        try {
          localStorage.setItem('odias_erp_favicon', profile.favicon_url);
        } catch (e) {}
      }
      if (profile.logo_url) {
        try {
          localStorage.setItem('odias_erp_logo', profile.logo_url);
        } catch (e) {}
      }

      showToast('Company Logo, Favicon & Branding assets saved in realtime!');
      emitEvent('branding_updated', 'Branding Updated', 'Official Company Logo and Favicon updated.', 'success');
      emitEvent('company_profile_updated', 'Company Profile Updated', 'Branding updated.', 'success');
      window.dispatchEvent(new CustomEvent('odias_branding_updated', { detail: profile }));
      fetchCompanyProfile();
    } catch (err: any) {
      showToast(err.message || 'Failed to update branding assets', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New password and confirmation do not match.', 'error');
      return;
    }

    setChangingPass(true);
    try {
      const res = await api.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      showToast(res.message || 'Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      emitEvent('password_changed', 'Password Updated', 'Super Admin password was changed securely.', 'info');
      fetchSecurityOverview();
    } catch (err: any) {
      showToast(err.message || 'Failed to change password. Please check current password.', 'error');
    } finally {
      setChangingPass(false);
    }
  };

  // Terminate Other Sessions
  const handleTerminateSessions = async () => {
    if (!confirm('Are you sure you want to terminate all other active login sessions on other devices?')) return;
    setTerminatingSessions(true);
    try {
      const currentSession = securityData?.active_sessions?.find((s: any) => s.is_current);
      await api.terminateOtherSessions(currentSession?.id);
      showToast('All other active sessions have been terminated.');
      fetchSecurityOverview();
    } catch (err: any) {
      showToast(err.message || 'Failed to terminate sessions', 'error');
    } finally {
      setTerminatingSessions(false);
    }
  };

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'None', color: 'bg-slate-200' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) return { score: 33, label: 'Weak', color: 'bg-rose-500', text: 'text-rose-600' };
    if (score <= 4) return { score: 66, label: 'Moderate', color: 'bg-amber-500', text: 'text-amber-600' };
    return { score: 100, label: 'Strong & Secure', color: 'bg-emerald-500', text: 'text-emerald-600' };
  };

  const passStrength = getPasswordStrength(newPassword);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 text-white border animate-in slide-in-from-bottom-2 ${
            toastMessage.type === 'success'
              ? 'bg-slate-900 border-emerald-500/50 shadow-emerald-950/20'
              : 'bg-rose-900 border-rose-500/50 shadow-rose-950/20'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-300 shrink-0" />
          )}
          <span className="text-xs font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* Clean ERP Page Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
            {activeTab === 'details' && <Building2 className="w-7 h-7 text-blue-600 mr-2.5" />}
            {activeTab === 'branding' && <ImageIcon className="w-7 h-7 text-indigo-600 mr-2.5" />}
            {activeTab === 'security' && <KeyRound className="w-7 h-7 text-purple-600 mr-2.5" />}
            {activeTab === 'sessions' && <ShieldCheck className="w-7 h-7 text-emerald-600 mr-2.5" />}
            {activeTab === 'settings' && <Clock className="w-7 h-7 text-amber-500 mr-2.5" />}
            <span>
              {activeTab === 'details' && 'Company Profile & Corporate Details'}
              {activeTab === 'branding' && 'Company Photo, Logo & Favicon Branding'}
              {activeTab === 'security' && 'Super Admin Password & Security'}
              {activeTab === 'sessions' && 'Last Login & Active Security Sessions'}
              {activeTab === 'settings' && 'Time Format & System Preferences'}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {activeTab === 'details' && 'Official business registration, GSTIN, legal address, contact info and corporate banking details.'}
            {activeTab === 'branding' && 'Upload official company logo, browser tab favicon, and corporate building image with realtime updates.'}
            {activeTab === 'security' && 'Change master administrator password credentials securely with audit verification.'}
            {activeTab === 'sessions' && 'Monitor verified last login timestamps, remote IP address, active devices and session activity logs.'}
            {activeTab === 'settings' && 'Configure 12-Hour (1 to 12 AM/PM) or 24-Hour (1 to 24) time display across the entire ERP workspace in real time.'}
          </p>
        </div>

        {/* Clean Light Tab Switcher */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto shrink-0">
          <button
            onClick={() => handleTabChange('details')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'details'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Company Details</span>
          </button>

          <button
            onClick={() => handleTabChange('branding')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'branding'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
            <span>Logo & Favicon</span>
            {profile.favicon_url && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-0.5" />
            )}
          </button>

          <button
            onClick={() => handleTabChange('security')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'security'
                ? 'bg-white text-purple-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-purple-600" />
            <span>Change Password</span>
          </button>

          <button
            onClick={() => handleTabChange('sessions')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'sessions'
                ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Last Login & Sessions</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-100 text-emerald-800 font-extrabold">
              Live
            </span>
          </button>

          <button
            onClick={() => handleTabChange('settings')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'settings'
                ? 'bg-white text-amber-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Time & Settings</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-100 text-amber-900 font-extrabold">
              12h/24h
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: COMPANY DETAILS */}
      {activeTab === 'details' && (
        <form onSubmit={handleSaveCompanyDetails} className="space-y-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between pb-6 border-b border-slate-100">
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <span>Official Corporate & Business Master</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Primary business details shown on invoices, tax filings, legal agreements and reports.
                </p>
              </div>
              <button
                type="submit"
                disabled={savingProfile}
                className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
              >
                {savingProfile ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Save Company Details</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Company Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={profile.company_name}
                  onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Trade / Brand Name
                </label>
                <input
                  type="text"
                  value={profile.trade_name}
                  onChange={(e) => setProfile({ ...profile, trade_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Business Entity Type
                </label>
                <select
                  value={profile.business_type}
                  onChange={(e) => setProfile({ ...profile, business_type: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="Private Limited Company">Private Limited Company</option>
                  <option value="Public Limited Company">Public Limited Company</option>
                  <option value="Limited Liability Partnership (LLP)">Limited Liability Partnership (LLP)</option>
                  <option value="Partnership Firm">Partnership Firm</option>
                  <option value="Sole Proprietorship">Sole Proprietorship</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Company Registration / CIN No.
                </label>
                <input
                  type="text"
                  value={profile.cin}
                  onChange={(e) => setProfile({ ...profile, cin: e.target.value })}
                  placeholder="e.g. U72200OR2026PTC049210"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 uppercase focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  PAN Number *
                </label>
                <input
                  type="text"
                  required
                  value={profile.pan}
                  onChange={(e) => setProfile({ ...profile, pan: e.target.value.toUpperCase() })}
                  maxLength={10}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 uppercase tracking-wider focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  GSTIN (Tax Identification) *
                </label>
                <input
                  type="text"
                  required
                  value={profile.gstin}
                  onChange={(e) => setProfile({ ...profile, gstin: e.target.value.toUpperCase() })}
                  maxLength={15}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 uppercase tracking-wider focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Registered Corporate Address *
                </label>
                <textarea
                  required
                  rows={2}
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">City</label>
                <input
                  type="text"
                  value={profile.city}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">State</label>
                <input
                  type="text"
                  value={profile.state}
                  onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">PIN Code</label>
                <input
                  type="text"
                  value={profile.pincode}
                  onChange={(e) => setProfile({ ...profile, pincode: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Official Phone</label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Official Corporate Email</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Corporate Website</label>
                <input
                  type="url"
                  value={profile.website}
                  onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Corporate Banking & Settlement Details */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center space-x-2 mb-6">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              <span>Corporate Settlement & UPI Bank Account</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Bank Name</label>
                <input
                  type="text"
                  value={profile.bank_name}
                  onChange={(e) => setProfile({ ...profile, bank_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Bank Account No.</label>
                <input
                  type="text"
                  value={profile.bank_account_no}
                  onChange={(e) => setProfile({ ...profile, bank_account_no: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">IFSC Code</label>
                <input
                  type="text"
                  value={profile.bank_ifsc}
                  onChange={(e) => setProfile({ ...profile, bank_ifsc: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Corporate UPI ID</label>
                <input
                  type="text"
                  value={profile.upi_id}
                  onChange={(e) => setProfile({ ...profile, upi_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                />
              </div>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: PHOTO, LOGO & FAVICON */}
      {activeTab === 'branding' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between pb-6 border-b border-slate-100">
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center space-x-2">
                  <ImageIcon className="w-5 h-5 text-indigo-600" />
                  <span>Corporate Brand Assets (Photo, Logo & Favicon)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Upload official logo, browser tab favicon, and corporate photo. Updates reflect instantly across the entire ERP.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSaveBranding}
                disabled={savingProfile}
                className="flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
              >
                {savingProfile ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Save Brand Assets</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
              {/* 1. Official Company Logo */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-900">Official Company Logo</span>
                    {profile.logo_url ? (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Live in Shell</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                        Default Monogram
                      </span>
                    )}
                  </div>
                  <div className="w-full h-44 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-4 overflow-hidden shadow-inner relative group">
                    {profile.logo_url ? (
                      <img src={profile.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <div className="text-center">
                        <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                        <span className="text-xs text-slate-400 font-medium">No Custom Logo Uploaded</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center space-x-2">
                    <label className="flex-1 flex items-center justify-center space-x-2 py-2.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 cursor-pointer shadow-sm transition-all">
                      <Upload className="w-4 h-4 text-indigo-600" />
                      <span>{profile.logo_url ? 'Change Logo' : 'Upload Logo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'logo_url')}
                        className="hidden"
                      />
                    </label>
                    {profile.logo_url && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAsset('logo_url')}
                        className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold border border-rose-200 transition-all cursor-pointer"
                        title="Remove Logo"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 text-center">
                    PNG, SVG, or WEBP (Transparent recommended)
                  </p>
                </div>
              </div>

              {/* 2. Browser Tab Favicon */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-900">Browser Favicon</span>
                    {profile.favicon_url ? (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Active Tab Icon</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                        Default Favicon
                      </span>
                    )}
                  </div>
                  <div className="w-full h-44 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center p-4 overflow-hidden shadow-inner">
                    {/* Mock Browser Tab Bar */}
                    <div className="w-full max-w-xs bg-slate-100 rounded-lg p-2 border border-slate-300 flex items-center space-x-2 mb-3 shadow-sm">
                      <div className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                        {profile.favicon_url ? (
                          <img src={profile.favicon_url} alt="Favicon" className="w-4 h-4 object-contain" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 truncate">
                        {profile.trade_name || 'Odias ERP Cloud'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Live Tab Preview (Updated instantly)
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center space-x-2">
                    <label className="flex-1 flex items-center justify-center space-x-2 py-2.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 cursor-pointer shadow-sm transition-all">
                      <Upload className="w-4 h-4 text-emerald-600" />
                      <span>{profile.favicon_url ? 'Change Favicon' : 'Upload Favicon'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'favicon_url')}
                        className="hidden"
                      />
                    </label>
                    {profile.favicon_url && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAsset('favicon_url')}
                        className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold border border-rose-200 transition-all cursor-pointer"
                        title="Remove Favicon"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 text-center">
                    ICO, PNG, or SVG (32x32 or 64x64 square image)
                  </p>
                </div>
              </div>

              {/* 3. Company Cover Photo / HQ Image */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-900">Company Building / HQ Photo</span>
                    {profile.company_photo_url ? (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                        <span>Corporate Avatar</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                        Corporate Identity
                      </span>
                    )}
                  </div>
                  <div className="w-full h-44 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-2 overflow-hidden shadow-inner">
                    {profile.company_photo_url ? (
                      <img
                        src={profile.company_photo_url}
                        alt="HQ Building"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                        <span className="text-xs text-slate-400 font-medium">No HQ Photo Uploaded</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center space-x-2">
                    <label className="flex-1 flex items-center justify-center space-x-2 py-2.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 cursor-pointer shadow-sm transition-all">
                      <Upload className="w-4 h-4 text-blue-600" />
                      <span>{profile.company_photo_url ? 'Change Photo' : 'Upload Corporate Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'company_photo_url')}
                        className="hidden"
                      />
                    </label>
                    {profile.company_photo_url && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAsset('company_photo_url')}
                        className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold border border-rose-200 transition-all cursor-pointer"
                        title="Remove Photo"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 text-center">
                    High-res JPG or PNG of Headquarters / Facility
                  </p>
                </div>
              </div>
            </div>

            {/* Official Stamp & Authorized Signature */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 mt-8 border-t border-slate-100">
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden p-2 shadow-inner">
                    {profile.stamp_url ? (
                      <img src={profile.stamp_url} alt="Stamp" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <Stamp className="w-8 h-8 text-slate-300" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Official Company Seal / Stamp</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Applied to digital invoices and quotations</p>
                    {profile.stamp_url && (
                      <span className="inline-block mt-1 text-[10px] font-bold text-emerald-600">● Live on Invoices</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 cursor-pointer shadow-sm">
                    <span>{profile.stamp_url ? 'Change Seal' : 'Upload Seal'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'stamp_url')}
                      className="hidden"
                    />
                  </label>
                  {profile.stamp_url && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAsset('stamp_url')}
                      className="px-2.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold border border-rose-200 transition-all cursor-pointer"
                      title="Remove Seal"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden p-2 shadow-inner">
                    {profile.signature_url ? (
                      <img src={profile.signature_url} alt="Signature" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <PenTool className="w-8 h-8 text-slate-300" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Authorized Signatory</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Primary digital signature on bills and contracts</p>
                    {profile.signature_url && (
                      <span className="inline-block mt-1 text-[10px] font-bold text-emerald-600">● Live on Invoices</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 cursor-pointer shadow-sm">
                    <span>{profile.signature_url ? 'Change Sign' : 'Upload Signature'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'signature_url')}
                      className="hidden"
                    />
                  </label>
                  {profile.signature_url && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAsset('signature_url')}
                      className="px-2.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold border border-rose-200 transition-all cursor-pointer"
                      title="Remove Signature"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PASSWORD CHANGE */}
      {activeTab === 'security' && (
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleChangePassword} className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 space-y-6">
            <div className="pb-6 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-indigo-600" />
                <span>Super Admin Password Management</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Update your administrative credential. Ensure your new password is at least 6 characters with mixed symbols.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Current Password *
                </label>
                <div className="relative">
                  <input
                    type={showOldPass ? 'text' : 'password'}
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter existing password"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPass(!showOldPass)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new strong password"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength meter */}
                {newPassword && (
                  <div className="mt-2 space-y-1">
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${passStrength.color}`}
                        style={{ width: `${passStrength.score}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400 font-medium">Strength:</span>
                      <span className={`font-bold ${passStrength.text}`}>{passStrength.label}</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end space-x-3">
              <button
                type="submit"
                disabled={changingPass}
                className="flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
              >
                {changingPass ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                <span>Update Password</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: LAST LOGIN & ACTIVE SESSIONS */}
      {activeTab === 'sessions' && (
        <div className="space-y-6">
          {/* Status summary banner */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Last Login Timestamp
              </span>
              <span className="text-sm font-black text-slate-900 mt-1 block">
                {securityData?.user?.last_login
                  ? new Date(securityData.user.last_login).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Active Now'}
              </span>
              <span className="text-[10px] text-emerald-600 font-bold mt-1 inline-flex items-center space-x-1">
                <Check className="w-3 h-3" />
                <span>Verified Auth Token</span>
              </span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Current Connected IP
              </span>
              <span className="text-sm font-black text-indigo-600 mt-1 block">
                {securityData?.current_session?.ip_address || '127.0.0.1'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium mt-1 block">
                Local Area Network / Secure Gateway
              </span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Active Role Scope
              </span>
              <span className="text-sm font-black text-purple-600 mt-1 block">
                {securityData?.user?.role_name || 'Super Admin'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium mt-1 block">
                Full Company & Cross-Module Clearance
              </span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Two-Factor Status
              </span>
              <span className="text-sm font-black text-emerald-600 mt-1 block">
                {securityData?.user?.is_two_factor_enabled ? 'Enforced' : 'Available (Standard)'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium mt-1 block">
                SHA-256 Encrypted Session Keys
              </span>
            </div>
          </div>

          {/* Active Sessions List */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between pb-6 border-b border-slate-100">
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center space-x-2">
                  <Monitor className="w-5 h-5 text-indigo-600" />
                  <span>Active Browser Sessions</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Devices and browser instances currently authenticated with your Super Admin account.
                </p>
              </div>

              <button
                type="button"
                onClick={handleTerminateSessions}
                disabled={terminatingSessions}
                className="flex items-center space-x-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-all disabled:opacity-50"
              >
                {terminatingSessions ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LogOut className="w-3.5 h-3.5" />
                )}
                <span>Terminate Other Sessions</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100 pt-2">
              {(securityData?.active_sessions || []).map((sess: any) => (
                <div key={sess.id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        sess.is_current ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Monitor className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900">
                          {sess.ip_address}
                        </span>
                        {sess.is_current && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 border border-emerald-200">
                            Current Session
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 block truncate max-w-md">
                        {sess.user_agent}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-700 block">
                      {new Date(sess.last_activity).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Started: {new Date(sess.created_at).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Security & Login Audit Activity */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center space-x-2 mb-4">
              <Clock className="w-5 h-5 text-indigo-600" />
              <span>Recent Security & Login Event Trail</span>
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Event / Action</th>
                    <th className="py-3 px-4">IP Address</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {(securityData?.recent_activity || []).map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {formatTime(item.timestamp, { includeSeconds: true })}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 capitalize">
                        {item.action.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{item.ip_address}</td>
                      <td className="py-3 px-4 text-slate-600">{item.description}</td>
                      <td className="py-3 px-4 text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Authorized
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TIME FORMAT & SYSTEM SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Main Setting Card */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  <span>Enterprise Time Format Preferences (1 to 12 vs 1 to 24)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-xl">
                  Configure whether all timestamps across attendance punches, biometric selfies, shifts, and reports display in <strong>12-Hour format (with AM/PM button & indicators)</strong> or <strong>24-Hour standard military format</strong>.
                </p>
              </div>

              <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-2xl">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Live System Clock:</span>
                <span className="font-mono text-sm font-black text-blue-700 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
                  {formatTime(liveClockTicker, { includeSeconds: true })}
                </span>
              </div>
            </div>

            {/* 12h vs 24h Interactive Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-6">
              {/* Card A: 12-Hour Format (1 to 12 with AM/PM) */}
              <div
                onClick={() => {
                  setTimeFormat('12h');
                  showToast('Time format set to 12-Hour (1 to 12 with AM/PM) in realtime!', 'success');
                  emitEvent('time_format_changed', 'Time Format Preference Updated', 'Switched system to 12-Hour clock with AM/PM indicators.', 'success');
                }}
                className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                  timeFormat === '12h'
                    ? 'border-blue-600 bg-blue-50/40 ring-4 ring-blue-500/10 shadow-md'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-200">
                      12-Hour Format (1 to 12)
                    </span>
                    {timeFormat === '12h' && (
                      <span className="flex items-center space-x-1 text-xs font-extrabold text-blue-700">
                        <Check className="w-4 h-4 text-blue-600" />
                        <span>Active</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    Standard 12-Hour Clock with AM / PM
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    Times display from <strong>1:00 to 12:59</strong> with clear <strong>AM</strong> and <strong>PM</strong> tags. Where time is configured or adjusted, dedicated <strong>AM / PM buttons</strong> allow one-click toggling.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Live Sample Display:
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-base font-black text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                      {formatTime(liveClockTicker, { forceFormat: '12h', includeSeconds: true })}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-extrabold border border-emerald-200">
                      AM / PM Visible
                    </span>
                  </div>
                </div>
              </div>

              {/* Card B: 24-Hour Format (00:00 to 23:59) */}
              <div
                onClick={() => {
                  setTimeFormat('24h');
                  showToast('Time format set to 24-Hour (1 to 24) in realtime!', 'success');
                  emitEvent('time_format_changed', 'Time Format Preference Updated', 'Switched system to 24-Hour military clock.', 'success');
                }}
                className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  timeFormat === '24h'
                    ? 'border-blue-600 bg-blue-50/40 ring-4 ring-blue-500/10 shadow-md'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-200 text-slate-800 border border-slate-300">
                      24-Hour Format (1 to 24)
                    </span>
                    {timeFormat === '24h' && (
                      <span className="flex items-center space-x-1 text-xs font-extrabold text-blue-700">
                        <Check className="w-4 h-4 text-blue-600" />
                        <span>Active</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    Military / Enterprise 24-Hour Clock
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    Times display continuously from <strong>00:00 to 23:59</strong> without AM or PM suffixes. Preferred for international operations and IT systems.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Live Sample Display:
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-base font-black text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                      {formatTime(liveClockTicker, { forceFormat: '24h', includeSeconds: true })}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-extrabold border border-slate-200">
                      24h Standard
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive AM / PM Button Tester & Input Sandbox */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <span>Interactive Time Input & AM / PM Button Sandbox</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Test and verify how time pickers and AM/PM buttons respond when setting shift start times or manual check-ins.
                </p>
              </div>

              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                Interactive Testing Mode
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div>
                <TimeInputPicker
                  label="Sample Work Shift Start Time"
                  value={testTimeValue}
                  onChange={(val) => setTestTimeValue(val)}
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Click the <strong>AM</strong> or <strong>PM</strong> button to toggle daytime vs evening shift.
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Evaluated Raw Stored Value (24h standard):
                </span>
                <span className="font-mono font-bold text-slate-800 text-sm">
                  {testTimeValue}
                </span>
              </div>

              <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200">
                <span className="text-[10px] font-bold text-blue-600 uppercase block mb-1">
                  Active Display across Workspace:
                </span>
                <span className="font-mono font-black text-blue-900 text-base">
                  {formatTime(testTimeValue)}
                </span>
              </div>
            </div>
          </div>

          {/* Realtime Impact Summary Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 md:p-8 shadow-lg space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight text-white">
                  Realtime Workspace Synchronization
                </h3>
                <p className="text-xs text-slate-300">
                  Changing this setting immediately re-renders all time components without page refresh:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 text-xs text-slate-200 font-medium">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <strong className="text-white block font-bold">1. Camera Attendance</strong>
                <span>Check-in and check-out photos carry verified {timeFormat === '12h' ? '12h (AM/PM)' : '24h'} timestamp watermark.</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <strong className="text-white block font-bold">2. Digital Clock Tickers</strong>
                <span>Header bar and dashboard live digital clocks automatically sync with the selected format.</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <strong className="text-white block font-bold">3. Audit & Security Trail</strong>
                <span>All login sessions and admin security logs reflect {timeFormat === '12h' ? '12h (AM/PM)' : '24h'} timestamps.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
