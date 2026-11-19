import React, { useState, useEffect, useRef } from 'react';
import {
  Building2, Shield, CreditCard, Plus, CheckCircle2,
  AlertCircle, Save, FileText, QrCode, Layers, MapPin,
  Upload, Image as ImageIcon, Trash2, Stamp, Sparkles, Check
} from 'lucide-react';
import { api } from '../../api/client';
import { useRealtime } from '../../context/RealtimeContext';
import { Modal } from '../../components/common/Modal';
import type { CompanyProfile, Branch } from '../../types';

const ODIAS_OFFICIAL_PRESET: Partial<CompanyProfile> = {
  company_name: 'ODIAS ERP TECHNOLOGIES PVT. LTD.',
  trade_name: 'Odias ERP Cloud Suite',
  pan: 'AAACR1234F',
  gstin: '21AAACR1234F1Z5',
  business_type: 'Private Limited Enterprise',
  registration_type: 'Regular',
  address: 'LaxmiSager, Bhubaneswar, Odisha - 751024',
  state: 'Odisha',
  district: 'Khurda',
  pincode: '751024',
  state_code: '21',
  phone: '+91 1234567890',
  email: 'accounts@odiaserp.com',
  website: 'https://odiaserp.com',
  bank_name: 'HDFC Bank Ltd.',
  bank_account_no: '50200088991122',
  bank_ifsc: 'HDFC0001234',
  bank_branch: 'Bhubaneswar Main Branch',
  upi_id: 'odiaserp@hdfcbank',
  invoice_prefix: 'OERP/2026/',
  default_terms: '1. Subject to Bhubaneswar jurisdiction.\n2. Interest @ 18% p.a. charged after due date.\n3. Goods/Services once billed cannot be cancelled without prior authorization.',
};

const DEFAULT_PROFILE: CompanyProfile = {
  id: '00000000-0000-0000-0000-000000000001',
  company_name: 'ODIAS ERP TECHNOLOGIES PVT. LTD.',
  trade_name: 'Odias ERP Cloud Suite',
  logo_url: '',
  signature_url: '',
  stamp_url: '',
  pan: 'AAACR1234F',
  gstin: '21AAACR1234F1Z5',
  business_type: 'Private Limited Enterprise',
  registration_type: 'Regular',
  address: 'LaxmiSager, Bhubaneswar, Odisha - 751024',
  state: 'Odisha',
  district: 'Khurda',
  pincode: '751024',
  state_code: '21',
  phone: '+91 1234567890',
  email: 'accounts@odiaserp.com',
  website: 'https://odiaserp.com',
  bank_name: 'HDFC Bank Ltd.',
  bank_account_no: '50200088991122',
  bank_ifsc: 'HDFC0001234',
  bank_branch: 'Bhubaneswar Main Branch',
  upi_id: 'odiaserp@hdfcbank',
  invoice_prefix: 'OERP/2026/',
  default_terms: '1. Subject to Bhubaneswar jurisdiction.\n2. Interest @ 18% p.a. charged after due date.\n3. Goods/Services once billed cannot be cancelled without prior authorization.',
  is_rcm_applicable: false,
  e_invoice_enabled: true,
  e_way_bill_enabled: true,
};

export const BillingSettingsPage: React.FC = () => {
  const { emitEvent } = useRealtime();
  const [profile, setProfile] = useState<CompanyProfile>(DEFAULT_PROFILE);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'branding' | 'branches' | 'einvoice' | 'banking'>('profile');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Hidden File Inputs Refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  // Branch Modal
  const [branchModal, setBranchModal] = useState(false);
  const [branchForm, setBranchForm] = useState({
    name: '',
    code: '',
    gstin: '',
    address: '',
    state: 'Odisha',
    state_code: '21',
    pincode: '751024',
    phone: '',
    email: '',
    is_head_office: false,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadSettings = async () => {
    setLoading(true);
    try {
      const pRes = await api.getCompanyProfile().catch(() => null);
      if (pRes && pRes.company_name) {
        setProfile((prev) => ({ ...prev, ...pRes }));
      }
    } catch (err) {
      console.warn('Error loading profile:', err);
    }

    try {
      const bRes = await api.getBranches().catch(() => null);
      if (bRes) {
        setBranches(bRes?.results || bRes || []);
      }
    } catch (err) {
      console.warn('Error loading branches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!profile) return;
    try {
      await api.updateCompanyProfile(profile);
      emitEvent('billing_profile_updated', 'GST Settings Saved', 'Company profile, branding images and GST configurations saved', 'success');
      showToast('Business & GST configuration saved successfully!');
    } catch (err: any) {
      console.error(err);
      showToast('Failed to save settings');
    }
  };

  // Image Upload Handler (Base64)
  const handleImageUpload = (
    field: 'logo_url' | 'signature_url' | 'stamp_url',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      showToast('File too large! Please upload an image under 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setProfile((prev) => ({ ...prev, [field]: result }));
      showToast(`${field === 'logo_url' ? 'Company Logo' : field === 'stamp_url' ? 'Company Stamp' : 'Authorized Signature'} uploaded! Click "Save Settings" to persist.`);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (field: 'logo_url' | 'signature_url' | 'stamp_url') => {
    setProfile((prev) => ({ ...prev, [field]: '' }));
    showToast(`Removed image. Click "Save Settings" to apply.`);
  };

  const handleApplyPreset = (preset: Partial<CompanyProfile>, name: string) => {
    setProfile((prev) => ({
      ...prev,
      ...preset,
    }));
    showToast(`Loaded ${name} profile preset!`);
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createBranch(branchForm);
      emitEvent('billing_branch_created', 'Branch Added', `Branch "${branchForm.name}" registered with GSTIN`, 'success');
      showToast('Branch added successfully!');
      setBranchModal(false);
      setBranchForm({
        name: '',
        code: '',
        gstin: '',
        address: '',
        state: 'Odisha',
        state_code: '21',
        pincode: '751024',
        phone: '',
        email: '',
        is_head_office: false,
      });
      loadSettings();
    } catch (err: any) {
      console.error(err);
      showToast('Failed to add branch');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl transition-all">
          <CheckCircle2 size={18} />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={logoInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => handleImageUpload('logo_url', e)}
      />
      <input
        type="file"
        ref={stampInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => handleImageUpload('stamp_url', e)}
      />
      <input
        type="file"
        ref={signatureInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => handleImageUpload('signature_url', e)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business & GST Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure company registration, official logo, digital signature & stamp, GSTIN, bank details, and E-Invoice credentials.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSaveProfile()}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <Save size={16} />
            Save Settings
          </button>
        </div>
      </div>

      {/* Profile Presets Quick Loader */}
      {/* Header Presets Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200">
        <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-900">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>Quick Company Presets:</span>
        </div>
        <button
          type="button"
          onClick={() => handleApplyPreset(ODIAS_OFFICIAL_PRESET, 'Odias ERP Technologies (Official Enterprise Profile)')}
          className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center space-x-1.5"
        >
          <span>🚀 Load Odias ERP Technologies (Official Enterprise Data)</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'profile'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Company Profile & GSTIN
        </button>
        <button
          onClick={() => setActiveTab('branding')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'branding'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Logo, Stamp & Signatures
        </button>
        <button
          onClick={() => setActiveTab('banking')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'banking'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Banking & UPI QR Configuration
        </button>
        <button
          onClick={() => setActiveTab('branches')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'branches'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Branches & Multi-GSTIN ({branches.length})
        </button>
        <button
          onClick={() => setActiveTab('einvoice')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'einvoice'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          E-Invoice & E-Way Bill Integration
        </button>
      </div>

      {/* Tab 1: Profile & GSTIN */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Top Quick Branding Summary Banner */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Official Company Identifiers & Registration</h3>
                <p className="text-xs text-gray-500">Legal entity information automatically printed on CBIC Tax Invoices & Sales Quotations.</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('branding')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1 cursor-pointer"
              >
                <span>Upload Logo, Stamp & Signature</span>
                <Upload size={14} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Company Legal Name *</label>
                <input
                  type="text"
                  required
                  value={profile.company_name}
                  onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Trade / Brand Name</label>
                <input
                  type="text"
                  value={profile.trade_name || ''}
                  onChange={(e) => setProfile({ ...profile, trade_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Odias ERP Cloud Suite"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">GSTIN Number *</label>
                <input
                  type="text"
                  required
                  maxLength={15}
                  value={profile.gstin}
                  onChange={(e) => setProfile({ ...profile, gstin: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Company PAN *</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={profile.pan}
                  onChange={(e) => setProfile({ ...profile, pan: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Business Entity Type</label>
                <select
                  value={profile.business_type}
                  onChange={(e) => setProfile({ ...profile, business_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Private Limited Company">Private Limited Company</option>
                  <option value="Public Limited Company">Public Limited Company</option>
                  <option value="Partnership Firm">Partnership Firm</option>
                  <option value="LLP (Limited Liability Partnership)">LLP (Limited Liability Partnership)</option>
                  <option value="Sole Proprietorship">Sole Proprietorship</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">GST Registration Type</label>
                <select
                  value={profile.registration_type}
                  onChange={(e) => setProfile({ ...profile, registration_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Regular">Regular Taxpayer (Monthly / Quarterly GSTR-1 & 3B)</option>
                  <option value="Composition">Composition Scheme</option>
                  <option value="SEZ Unit">Special Economic Zone (SEZ) Unit</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Registered Address *</label>
                <textarea
                  rows={2}
                  required
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">State & GST Code *</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="State"
                    value={profile.state}
                    onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Code"
                    value={profile.state_code}
                    onChange={(e) => setProfile({ ...profile, state_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <span className="text-[11px] text-gray-400 mt-1 block">e.g. Odisha (Code: 21)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Official Email</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Official Phone / Contact</label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Website URL</label>
                <input
                  type="text"
                  value={profile.website || ''}
                  onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                  placeholder="https://odiaserp.com"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tax Invoice Prefix</label>
                <input
                  type="text"
                  value={profile.invoice_prefix}
                  onChange={(e) => setProfile({ ...profile, invoice_prefix: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">PIN Code & District</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={profile.pincode}
                    onChange={(e) => setProfile({ ...profile, pincode: e.target.value })}
                    placeholder="PIN Code"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={profile.district || ''}
                    onChange={(e) => setProfile({ ...profile, district: e.target.value })}
                    placeholder="District"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Default Statutory Terms & Conditions</label>
              <textarea
                rows={3}
                value={profile.default_terms || ''}
                onChange={(e) => setProfile({ ...profile, default_terms: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </form>
      )}

      {/* Tab 2: Logo, Stamp & Signatures */}
      {activeTab === 'branding' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-gray-900">Official Company Branding, Stamp & Authorized Signatures</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Upload your company logo, official stamp seal, and digital signature here. They will automatically be embedded on all printable/downloadable Tax Invoices, Quotations, and Sales Orders in real-time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* Card 1: Company Logo */}
            <div className="border border-slate-200 rounded-2xl p-5 flex flex-col justify-between bg-slate-50/50 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon size={15} className="text-blue-600" />
                    1. Company Logo
                  </span>
                  {profile.logo_url && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Uploaded
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Printed on the top-left of every Invoice & Quotation header. Best format: PNG / SVG with transparent background (approx. 250×80 px).
                </p>

                {/* Preview Box */}
                <div className="mt-4 h-32 rounded-xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center p-3 relative overflow-hidden">
                  {profile.logo_url ? (
                    <img
                      src={profile.logo_url}
                      alt="Company Logo Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-slate-400 space-y-1">
                      <ImageIcon className="w-8 h-8 mx-auto text-slate-300" />
                      <span className="text-xs font-medium block">No Logo Uploaded</span>
                      <span className="text-[10px] text-slate-400 block">Default brandmark will be used</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Upload size={14} />
                  <span>{profile.logo_url ? 'Change Logo' : 'Upload Logo'}</span>
                </button>
                {profile.logo_url && (
                  <button
                    type="button"
                    onClick={() => handleRemoveImage('logo_url')}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-rose-200"
                    title="Remove Logo"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Card 2: Official Stamp / Seal */}
            <div className="border border-slate-200 rounded-2xl p-5 flex flex-col justify-between bg-slate-50/50 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Stamp size={15} className="text-purple-600" />
                    2. Company Stamp / Seal
                  </span>
                  {profile.stamp_url && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Uploaded
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Printed in the bottom Authorized Signatory box alongside the signature. Circular or rectangular PNG stamp with transparent background.
                </p>

                {/* Preview Box */}
                <div className="mt-4 h-32 rounded-xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center p-3 relative overflow-hidden">
                  {profile.stamp_url ? (
                    <img
                      src={profile.stamp_url}
                      alt="Company Stamp Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-slate-400 space-y-1">
                      <div className="w-12 h-12 rounded-full border-2 border-slate-300 mx-auto flex items-center justify-center text-[10px] font-black text-slate-400">
                        SEAL
                      </div>
                      <span className="text-xs font-medium block">No Stamp Uploaded</span>
                      <span className="text-[10px] text-slate-400 block">Default verified seal will be used</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => stampInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Upload size={14} />
                  <span>{profile.stamp_url ? 'Change Stamp' : 'Upload Stamp'}</span>
                </button>
                {profile.stamp_url && (
                  <button
                    type="button"
                    onClick={() => handleRemoveImage('stamp_url')}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-rose-200"
                    title="Remove Stamp"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Card 3: Authorized Digital Signature */}
            <div className="border border-slate-200 rounded-2xl p-5 flex flex-col justify-between bg-slate-50/50 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText size={15} className="text-emerald-600" />
                    3. Digital Signature
                  </span>
                  {profile.signature_url && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Uploaded
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Printed above the "Authorised Signatory" rule. Recommended: dark blue/black ink signature on clean white or transparent PNG.
                </p>

                {/* Preview Box */}
                <div className="mt-4 h-32 rounded-xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center p-3 relative overflow-hidden">
                  {profile.signature_url ? (
                    <img
                      src={profile.signature_url}
                      alt="Signature Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-slate-400 space-y-1">
                      <span className="font-serif italic text-base text-slate-400 block">Authorised Signature</span>
                      <span className="text-xs font-medium block">No Signature Uploaded</span>
                      <span className="text-[10px] text-slate-400 block">Digital cursive stamp will be used</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => signatureInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Upload size={14} />
                  <span>{profile.signature_url ? 'Change Signature' : 'Upload Signature'}</span>
                </button>
                {profile.signature_url && (
                  <button
                    type="button"
                    onClick={() => handleRemoveImage('signature_url')}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-rose-200"
                    title="Remove Signature"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-emerald-800 font-medium">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>After uploading, remember to click <strong>"Save Settings"</strong> at the top right to store changes permanently in the database.</span>
            </div>
            <button
              type="button"
              onClick={() => handleSaveProfile()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer whitespace-nowrap"
            >
              Save Now
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Banking & UPI */}
      {activeTab === 'banking' && (
        <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Company Bank Details & Dynamic UPI QR Code</h3>
              <p className="text-xs text-gray-500">Printed on the bottom-left remittance coordinates of Invoices & Quotations.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Bank Name *</label>
              <input
                type="text"
                required
                value={profile.bank_name}
                onChange={(e) => setProfile({ ...profile, bank_name: e.target.value })}
                placeholder="Bank of India / HDFC Bank"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Bank Account Number *</label>
              <input
                type="text"
                required
                value={profile.bank_account_no}
                onChange={(e) => setProfile({ ...profile, bank_account_no: e.target.value })}
                placeholder="557720110000228"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Bank IFSC Code *</label>
              <input
                type="text"
                required
                value={profile.bank_ifsc}
                onChange={(e) => setProfile({ ...profile, bank_ifsc: e.target.value.toUpperCase() })}
                placeholder="BKID0005577"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Branch Name</label>
              <input
                type="text"
                value={profile.bank_branch}
                onChange={(e) => setProfile({ ...profile, bank_branch: e.target.value })}
                placeholder="Raghunathpur"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">UPI ID (Printed on Invoice QR)</label>
              <input
                type="text"
                value={profile.upi_id}
                onChange={(e) => setProfile({ ...profile, upi_id: e.target.value })}
                placeholder="odiaserp@hdfcbank"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </form>
      )}

      {/* Tab 4: Branches & Multi-GSTIN */}
      {activeTab === 'branches' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Company Branches & State GSTIN Registrations</h3>
              <p className="text-xs text-gray-500">Enable multi-branch billing with distinct state GSTIN series.</p>
            </div>
            <button
              onClick={() => setBranchModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
            >
              <Plus size={16} /> Add Branch
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {branches.map((b) => (
              <div key={b.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-gray-100 text-gray-700 font-mono">
                      {b.code}
                    </span>
                    {b.is_head_office && (
                      <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-50 text-blue-700">
                        Head Office
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-gray-900 text-base mb-1">{b.name}</h4>
                  <p className="text-xs text-gray-500 font-mono mb-2">GSTIN: {b.gstin || 'None'}</p>
                  <p className="text-xs text-gray-600 line-clamp-2">{b.address}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span>State: {b.state} ({b.state_code})</span>
                  <span>{(b as any).phone || ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: E-Invoice & E-Way Bill */}
      {activeTab === 'einvoice' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
          <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100">
            <h4 className="font-bold text-blue-900 text-sm mb-1">Government IRP & E-Way Bill Gateway Configuration</h4>
            <p className="text-xs text-blue-700">
              Direct API integration with NIC / ClearTax / Masters India IRP for 1-click IRN generation and signed QR code embedding on Tax Invoices above ₹5 Cr threshold.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 border border-gray-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-gray-900 text-sm">E-Invoice System (IRN)</h5>
                  <p className="text-xs text-gray-400">Generate 64-character IRN hash</p>
                </div>
                <input
                  type="checkbox"
                  checked={profile.e_invoice_enabled}
                  onChange={(e) => setProfile({ ...profile, e_invoice_enabled: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                />
              </div>
              <input
                type="text"
                placeholder="IRP API Username / GSP Client ID"
                value={profile.e_invoice_username || ''}
                onChange={(e) => setProfile({ ...profile, e_invoice_username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono"
              />
            </div>

            <div className="p-4 border border-gray-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-gray-900 text-sm">E-Way Bill System</h5>
                  <p className="text-xs text-gray-400">Consignment transport generation</p>
                </div>
                <input
                  type="checkbox"
                  checked={profile.e_way_bill_enabled}
                  onChange={(e) => setProfile({ ...profile, e_way_bill_enabled: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                />
              </div>
              <input
                type="text"
                placeholder="NIC E-Way Bill Username"
                value={profile.e_way_bill_username || ''}
                onChange={(e) => setProfile({ ...profile, e_way_bill_username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Branch */}
      <Modal
        isOpen={branchModal}
        onClose={() => setBranchModal(false)}
        title="Register New Branch & State GSTIN"
      >
        <form onSubmit={handleCreateBranch} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Branch Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Pune Regional Branch"
                value={branchForm.name}
                onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Branch Code *</label>
              <input
                type="text"
                required
                placeholder="PUN-01"
                value={branchForm.code}
                onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Branch GSTIN</label>
              <input
                type="text"
                maxLength={15}
                placeholder="27AAACR1234F1Z3"
                value={branchForm.gstin}
                onChange={(e) => setBranchForm({ ...branchForm, gstin: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm uppercase font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">State *</label>
              <input
                type="text"
                required
                value={branchForm.state}
                onChange={(e) => setBranchForm({ ...branchForm, state: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Address *</label>
            <textarea
              rows={2}
              required
              value={branchForm.address}
              onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setBranchModal(false)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 cursor-pointer"
            >
              Save Branch
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
