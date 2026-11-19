import React, { useState, useEffect, useMemo } from 'react';
import {
  Hash, Plus, Search, Filter, CheckCircle2, Download,
  Upload, Layers, AlertTriangle, ShieldCheck, Edit, Trash2, Eye,
  Building2, ArrowUpDown, FileSpreadsheet, RefreshCw, X, FileText, Check, AlertCircle
} from 'lucide-react';
import { api } from '../../api/client';
import { useRealtime } from '../../context/RealtimeContext';
import { Modal } from '../../components/common/Modal';
import type { HSNMaster, SACMaster } from '../../types';

export const HsnSacMasterPage: React.FC = () => {
  const { emitEvent } = useRealtime();
  const [activeTab, setActiveTab] = useState<'hsn' | 'sac'>('hsn');
  const [hsnList, setHsnList] = useState<HSNMaster[]>([]);
  const [sacList, setSacList] = useState<SACMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [rateFilter, setRateFilter] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Active item for view/edit/delete
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Add / Edit Form State
  const [formState, setFormState] = useState({
    type: 'hsn' as 'hsn' | 'sac',
    code: '',
    description: '',
    category: '',
    applicable_gst_rate: 18,
    cess_rate: 0,
    is_active: true,
  });

  // Bulk Upload State
  const [bulkMode, setBulkMode] = useState<'file' | 'paste' | 'preset'>('file');
  const [pastedData, setPastedData] = useState('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [hRes, sRes] = await Promise.all([
        api.getHSNMaster(),
        api.getSACMaster(),
      ]);
      setHsnList(hRes?.results || hRes || []);
      setSacList(sRes?.results || sRes || []);
    } catch (err) {
      console.error('Failed to load HSN/SAC master:', err);
      showToast('Error loading HSN/SAC records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered lists based on search and rate filter
  const currentList = activeTab === 'hsn' ? hsnList : sacList;
  const filteredList = useMemo(() => {
    return currentList.filter((item: any) => {
      const code = activeTab === 'hsn' ? item.hsn_code : item.sac_code;
      const category = activeTab === 'hsn' ? item.goods_category : item.service_category;
      const matchesSearch =
        !searchQuery ||
        (code && code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (category && category.toLowerCase().includes(searchQuery.toLowerCase()));

      const rate = Number(item.applicable_gst_rate);
      const matchesRate =
        rateFilter === 'all' ||
        (rateFilter === '0' && rate === 0) ||
        (rateFilter === '5' && rate === 5) ||
        (rateFilter === '12' && rate === 12) ||
        (rateFilter === '18' && rate === 18) ||
        (rateFilter === '28' && rate === 28);

      return matchesSearch && matchesRate;
    });
  }, [currentList, activeTab, searchQuery, rateFilter]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setFormState({
      type: activeTab,
      code: '',
      description: '',
      category: activeTab === 'hsn' ? 'Electronics & Hardware' : 'Information Technology',
      applicable_gst_rate: 18,
      cess_rate: 0,
      is_active: true,
    });
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: any) => {
    setSelectedItem(item);
    setFormState({
      type: activeTab,
      code: activeTab === 'hsn' ? item.hsn_code : item.sac_code,
      description: item.description,
      category: activeTab === 'hsn' ? item.goods_category : item.service_category,
      applicable_gst_rate: Number(item.applicable_gst_rate),
      cess_rate: Number(item.cess_rate || 0),
      is_active: item.is_active,
    });
    setIsEditModalOpen(true);
  };

  // Open View Modal
  const handleOpenView = (item: any) => {
    setSelectedItem(item);
    setIsViewModalOpen(true);
  };

  // Open Delete Modal
  const handleOpenDelete = (item: any) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  // Submit Add
  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.code.trim()) {
      showToast('Please enter a valid code');
      return;
    }
    setSubmitting(true);
    try {
      if (formState.type === 'hsn') {
        await api.createHSN({
          hsn_code: formState.code.trim(),
          description: formState.description.trim(),
          goods_category: formState.category.trim() || 'General Goods',
          applicable_gst_rate: Number(formState.applicable_gst_rate),
          cess_rate: Number(formState.cess_rate || 0),
          is_active: formState.is_active,
        });
        emitEvent('hsn_created', 'HSN Code Registered', `HSN ${formState.code} added (${formState.applicable_gst_rate}% GST)`, 'success');
        showToast(`HSN Code ${formState.code} saved successfully!`);
      } else {
        await api.createSAC({
          sac_code: formState.code.trim(),
          description: formState.description.trim(),
          service_category: formState.category.trim() || 'General Services',
          applicable_gst_rate: Number(formState.applicable_gst_rate),
          cess_rate: Number(formState.cess_rate || 0),
          is_active: formState.is_active,
        });
        emitEvent('sac_created', 'SAC Code Registered', `SAC ${formState.code} added (${formState.applicable_gst_rate}% GST)`, 'success');
        showToast(`SAC Code ${formState.code} saved successfully!`);
      }
      setIsAddModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      showToast(err?.response?.data?.hsn_code?.[0] || err?.response?.data?.sac_code?.[0] || 'Failed to save code. Code might already exist.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      if (activeTab === 'hsn') {
        await api.updateHSN(selectedItem.id, {
          hsn_code: formState.code.trim(),
          description: formState.description.trim(),
          goods_category: formState.category.trim(),
          applicable_gst_rate: Number(formState.applicable_gst_rate),
          cess_rate: Number(formState.cess_rate || 0),
          is_active: formState.is_active,
        });
        emitEvent('hsn_updated', 'HSN Code Updated', `HSN ${formState.code} updated`, 'info');
        showToast(`HSN Code ${formState.code} updated!`);
      } else {
        await api.updateSAC(selectedItem.id, {
          sac_code: formState.code.trim(),
          description: formState.description.trim(),
          service_category: formState.category.trim(),
          applicable_gst_rate: Number(formState.applicable_gst_rate),
          cess_rate: Number(formState.cess_rate || 0),
          is_active: formState.is_active,
        });
        emitEvent('sac_updated', 'SAC Code Updated', `SAC ${formState.code} updated`, 'info');
        showToast(`SAC Code ${formState.code} updated!`);
      }
      setIsEditModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      showToast('Failed to update code.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Delete
  const handleConfirmDelete = async () => {
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      if (activeTab === 'hsn') {
        await api.deleteHSN(selectedItem.id);
        showToast(`HSN Code ${selectedItem.hsn_code} removed`);
      } else {
        await api.deleteSAC(selectedItem.id);
        showToast(`SAC Code ${selectedItem.sac_code} removed`);
      }
      setIsDeleteModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      showToast('Failed to delete code.');
    } finally {
      setSubmitting(false);
    }
  };

  // Parse CSV string into objects
  const parseCSVData = (csvText: string) => {
    setBulkError(null);
    const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length < 2) {
      setParsedRows([]);
      return;
    }

    const header = lines[0].toLowerCase().split(',').map((h) => h.trim());
    const codeIdx = header.findIndex((h) => h.includes('code'));
    const descIdx = header.findIndex((h) => h.includes('desc'));
    const typeIdx = header.findIndex((h) => h.includes('type'));
    const catIdx = header.findIndex((h) => h.includes('cat'));
    const rateIdx = header.findIndex((h) => h.includes('rate') || h.includes('gst'));
    const cessIdx = header.findIndex((h) => h.includes('cess'));

    const rows: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      if (parts.length < 2) continue;

      const code = codeIdx >= 0 ? parts[codeIdx] : parts[0];
      const desc = descIdx >= 0 ? parts[descIdx] : parts[1] || '';
      const type = (typeIdx >= 0 ? parts[typeIdx]?.toLowerCase() : '') || (code.startsWith('99') ? 'sac' : 'hsn');
      const cat = catIdx >= 0 ? parts[catIdx] : (type === 'sac' ? 'General Services' : 'General Goods');
      const rate = rateIdx >= 0 ? Number(parts[rateIdx]) || 18 : 18;
      const cess = cessIdx >= 0 ? Number(parts[cessIdx]) || 0 : 0;

      if (code) {
        rows.push({ code, description: desc, type: type === 'sac' ? 'sac' : 'hsn', category: cat, rate, cess });
      }
    }
    setParsedRows(rows);
  };

  // Handle File Upload for Bulk Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        parseCSVData(content);
      }
    };
    reader.readAsText(file);
  };

  // Submit Bulk Upload
  const handleExecuteBulkImport = async () => {
    if (parsedRows.length === 0) {
      setBulkError('No valid rows found to import.');
      return;
    }
    setSubmitting(true);
    setBulkError(null);
    try {
      const hsnRecords = parsedRows
        .filter((r) => r.type === 'hsn')
        .map((r) => ({
          hsn_code: r.code,
          description: r.description,
          goods_category: r.category,
          applicable_gst_rate: r.rate,
          cess_rate: r.cess,
          is_active: true,
        }));

      const sacRecords = parsedRows
        .filter((r) => r.type === 'sac')
        .map((r) => ({
          sac_code: r.code,
          description: r.description,
          service_category: r.category,
          applicable_gst_rate: r.rate,
          cess_rate: r.cess,
          is_active: true,
        }));

      let totalSuccess = 0;
      if (hsnRecords.length > 0) {
        const hRes = await api.importHSN(hsnRecords);
        totalSuccess += (hRes?.created || 0) + (hRes?.updated || 0);
      }
      if (sacRecords.length > 0) {
        const sRes = await api.importSAC(sacRecords);
        totalSuccess += (sRes?.created || 0) + (sRes?.updated || 0);
      }

      emitEvent('bulk_hsn_sac', 'Bulk HSN/SAC Imported', `Imported ${totalSuccess} verified tariff codes`, 'success');
      showToast(`Successfully processed ${parsedRows.length} tariff codes!`);
      setIsBulkModalOpen(false);
      setParsedRows([]);
      setPastedData('');
      loadData();
    } catch (err: any) {
      console.error(err);
      setBulkError('Failed to import records. Please check CSV format.');
    } finally {
      setSubmitting(false);
    }
  };

  // Seed Standard Indian GST CBIC Library
  const handlePreloadStandardCodes = async () => {
    setSubmitting(true);
    try {
      const [hRes, sRes] = await Promise.all([
        api.seedDefaultHSN(),
        api.seedDefaultSAC(),
      ]);
      const total = (hRes?.total || 18) + (sRes?.total || 15);
      emitEvent('hsn_seeded', 'Official GST Master Loaded', `Loaded ${total} standard CBIC HSN & SAC codes`, 'success');
      showToast(`Loaded official Indian GST tariff library (${total} codes)!`);
      setIsBulkModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      showToast('Error seeding standard GST codes.');
    } finally {
      setSubmitting(false);
    }
  };

  // Download Sample CSV
  const handleDownloadSampleCSV = () => {
    const csvContent =
      'code,type,description,category,gst_rate,cess_rate\n' +
      '847130,hsn,Portable digital computers Laptops,Computers & Electronics,18,0\n' +
      '851713,hsn,Smartphones Mobile phones,Telecommunication,18,0\n' +
      '998314,sac,IT design and development services,Information Technology,18,0\n' +
      '998315,sac,Hosting and cloud infrastructure services,Cloud & Hosting,18,0\n' +
      '100630,hsn,Semi-milled or wholly milled Rice,Food & Agri,5,0\n' +
      '999311,sac,Hospital and healthcare services,Healthcare,0,0\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'hsn_sac_sample_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper badge color for tax rate
  const getRateBadge = (rate: number) => {
    switch (rate) {
      case 0:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 5:
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 12:
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 18:
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 28:
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl transition-all">
          <CheckCircle2 size={18} />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25">
              <Hash size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">HSN / SAC Code Master</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Indian GST Tariff Classification • Goods (HSN) & Services (SAC) • Realtime GST Autofill
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setParsedRows([]);
              setPastedData('');
              setBulkError(null);
              setIsBulkModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Upload size={16} className="text-blue-600" />
            <span>Bulk Upload CSV</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-500/25 transition-all cursor-pointer border border-blue-600"
          >
            <Plus size={16} className="text-white" />
            <span>+ Add {activeTab === 'hsn' ? 'HSN Code' : 'SAC Code'}</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500">HSN Codes (Goods)</span>
            <div className="text-2xl font-bold text-gray-900 mt-1">{hsnList.length}</div>
            <span className="text-[11px] text-emerald-600 font-medium">Physical commodities</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Layers size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500">SAC Codes (Services)</span>
            <div className="text-2xl font-bold text-gray-900 mt-1">{sacList.length}</div>
            <span className="text-[11px] text-purple-600 font-medium">Services & SaaS</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Building2 size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500">Standard GST Slabs</span>
            <div className="text-xl font-bold text-gray-900 mt-1">0%, 5%, 12%, 18%, 28%</div>
            <span className="text-[11px] text-gray-500 font-medium">CBIC Compliant</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500">Active Mappings</span>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {hsnList.filter((x) => x.is_active).length + sacList.filter((x) => x.is_active).length}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">Auto-fill enabled</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* Main Card with Toggle Buttons and Unified Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Toggle & Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gray-50/50">
          {/* Primary Two Toggle Buttons (HSN vs SAC) */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-200 rounded-2xl w-fit border border-slate-300">
            <button
              onClick={() => setActiveTab('hsn')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black tracking-wide transition-all cursor-pointer ${
                activeTab === 'hsn'
                  ? 'bg-blue-600 text-white shadow-md border-2 border-blue-700'
                  : 'bg-white text-slate-900 font-extrabold hover:bg-slate-100 border-2 border-slate-300 shadow-xs'
              }`}
            >
              <Layers size={16} className={activeTab === 'hsn' ? 'text-white' : 'text-slate-900'} />
              <span>HSN (Goods Tariff)</span>
              <span
                className={`ml-1 text-[11px] px-2.5 py-0.5 rounded-full font-black ${
                  activeTab === 'hsn' ? 'bg-blue-900 text-white' : 'bg-slate-200 text-slate-900'
                }`}
              >
                {hsnList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('sac')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black tracking-wide transition-all cursor-pointer ${
                activeTab === 'sac'
                  ? 'bg-blue-600 text-white shadow-md border-2 border-blue-700'
                  : 'bg-white text-slate-900 font-extrabold hover:bg-slate-100 border-2 border-slate-300 shadow-xs'
              }`}
            >
              <Building2 size={16} className={activeTab === 'sac' ? 'text-white' : 'text-slate-900'} />
              <span>SAC (Services Tariff)</span>
              <span
                className={`ml-1 text-[11px] px-2.5 py-0.5 rounded-full font-black ${
                  activeTab === 'sac' ? 'bg-blue-900 text-white' : 'bg-slate-200 text-slate-900'
                }`}
              >
                {sacList.length}
              </span>
            </button>
          </div>

          {/* Search and Slab Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${activeTab === 'hsn' ? 'HSN' : 'SAC'} code, description...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter size={15} className="text-gray-400" />
              <select
                value={rateFilter}
                onChange={(e) => setRateFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All GST Slabs</option>
                <option value="0">0% (Nil / Exempt)</option>
                <option value="5">5% (Essential)</option>
                <option value="12">12% (Standard I)</option>
                <option value="18">18% (Standard II)</option>
                <option value="28">28% (Luxury / De-merit)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Unified Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wider font-semibold border-b border-slate-800">
                <th className="py-3 px-4">{activeTab === 'hsn' ? 'HSN Code' : 'SAC Code'}</th>
                <th className="py-3 px-4">Official Description</th>
                <th className="py-3 px-4">{activeTab === 'hsn' ? 'Goods Category' : 'Service Category'}</th>
                <th className="py-3 px-4 text-center">GST Rate (%)</th>
                <th className="py-3 px-4 text-center">CGST (%)</th>
                <th className="py-3 px-4 text-center">SGST (%)</th>
                <th className="py-3 px-4 text-center">IGST (%)</th>
                <th className="py-3 px-4 text-center">Cess (%)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-xs text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-400">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw className="animate-spin text-blue-600" size={18} />
                      Loading official {activeTab.toUpperCase()} codes...
                    </div>
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 mx-auto flex items-center justify-center">
                        <FileSpreadsheet size={24} />
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm">No {activeTab.toUpperCase()} codes found</h3>
                      <p className="text-xs text-gray-500">
                        {searchQuery || rateFilter !== 'all'
                          ? 'Try adjusting your search query or GST slab filter.'
                          : `No ${activeTab.toUpperCase()} codes registered yet. Add manually or preload the official Indian GST library.`}
                      </p>
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <button
                          onClick={handleOpenAdd}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
                        >
                          + Add Code
                        </button>
                        <button
                          onClick={handlePreloadStandardCodes}
                          className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50"
                        >
                          Preload Official Library
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((item: any) => {
                  const code = activeTab === 'hsn' ? item.hsn_code : item.sac_code;
                  const category = activeTab === 'hsn' ? item.goods_category : item.service_category;
                  const gstRate = Number(item.applicable_gst_rate);
                  const halfRate = (gstRate / 2).toFixed(2);
                  const cessRate = Number(item.cess_rate || 0);

                  return (
                    <tr key={item.id} className="hover:bg-blue-50/40 transition-colors">
                      {/* Code */}
                      <td className="py-3 px-4 font-mono font-bold text-gray-900 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md border border-slate-200">
                          <Hash size={12} className="text-blue-600" />
                          {code}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-medium text-gray-900 line-clamp-2" title={item.description}>
                          {item.description}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[11px] font-medium">
                          {category || 'General'}
                        </span>
                      </td>

                      {/* GST Rate */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getRateBadge(
                            gstRate
                          )}`}
                        >
                          {gstRate}%
                        </span>
                      </td>

                      {/* CGST */}
                      <td className="py-3 px-4 text-center text-slate-800 font-mono font-bold text-xs">
                        {halfRate}%
                      </td>

                      {/* SGST */}
                      <td className="py-3 px-4 text-center text-slate-800 font-mono font-bold text-xs">
                        {halfRate}%
                      </td>

                      {/* IGST */}
                      <td className="py-3 px-4 text-center font-mono font-black text-blue-700 text-xs">
                        {gstRate.toFixed(2)}%
                      </td>

                      {/* Cess */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-700 text-xs">
                        {cessRate > 0 ? `${cessRate}%` : '—'}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black border ${
                            item.is_active ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-gray-100 text-gray-700 border-gray-300'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.is_active ? 'bg-emerald-500' : 'bg-gray-400'
                            }`}
                          />
                          {item.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenView(item)}
                            title="View Tariff Details"
                            className="p-1.5 text-blue-700 hover:text-blue-950 hover:bg-blue-100 rounded-lg bg-blue-50 border border-blue-200 transition-all cursor-pointer"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Code"
                            className="p-1.5 text-amber-800 hover:text-amber-950 hover:bg-amber-100 rounded-lg bg-amber-50 border border-amber-200 transition-all cursor-pointer"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(item)}
                            title="Delete Code"
                            className="p-1.5 text-rose-700 hover:text-rose-950 hover:bg-rose-100 rounded-lg bg-rose-50 border border-rose-200 transition-all cursor-pointer"
                          >
                            <Trash2 size={15} />
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

        {/* Footer info bar */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-2">
          <div>
            Showing <strong className="text-gray-800">{filteredList.length}</strong> of{' '}
            <strong className="text-gray-800">{currentList.length}</strong> {activeTab.toUpperCase()} codes
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span>Codes are live and autofill GST rates instantly when adding products or generating invoices.</span>
          </div>
        </div>
      </div>

      {/* MODAL 1: ADD HSN / SAC CODE */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={`Add Official ${formState.type === 'hsn' ? 'HSN Code (Goods)' : 'SAC Code (Services)'}`}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveAdd} className="space-y-4">
          {/* Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Tariff Classification Type *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormState({ ...formState, type: 'hsn', category: 'General Goods' })}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  formState.type === 'hsn'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Layers size={15} />
                HSN Code (Goods / Commodities)
              </button>
              <button
                type="button"
                onClick={() => setFormState({ ...formState, type: 'sac', category: 'General Services' })}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  formState.type === 'sac'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Building2 size={15} />
                SAC Code (Services / SaaS)
              </button>
            </div>
          </div>

          {/* Code & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {formState.type === 'hsn' ? 'HSN Code (4, 6 or 8 Digits) *' : 'SAC Code (6 Digits) *'}
              </label>
              <input
                type="text"
                required
                placeholder={formState.type === 'hsn' ? 'e.g. 847130' : 'e.g. 998314'}
                value={formState.code}
                onChange={(e) => setFormState({ ...formState, code: e.target.value.replace(/\s+/g, '') })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {formState.type === 'hsn' ? 'Goods Category / Industry *' : 'Service Category / Domain *'}
              </label>
              <input
                type="text"
                required
                placeholder={formState.type === 'hsn' ? 'e.g. Computers & Electronics' : 'e.g. IT & Software'}
                value={formState.category}
                onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Official Tariff Description *</label>
            <textarea
              required
              rows={3}
              placeholder="Full description as per CBIC GST Tariff Schedule..."
              value={formState.description}
              onChange={(e) => setFormState({ ...formState, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Tax Slabs & Cess */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Applicable GST Rate (%) *</label>
              <select
                value={formState.applicable_gst_rate}
                onChange={(e) => setFormState({ ...formState, applicable_gst_rate: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={18}>18% (Standard GST Rate)</option>
                <option value={12}>12% (Standard I)</option>
                <option value={5}>5% (Essential Goods/Services)</option>
                <option value={28}>28% (Luxury / De-merit)</option>
                <option value={0}>0% (Nil Rated / Exempt)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Compensation Cess (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="0.00"
                value={formState.cess_rate}
                onChange={(e) => setFormState({ ...formState, cess_rate: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Tax Split Preview Card */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Automated Tax Breakdown Preview
            </span>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-gray-400 block text-[10px]">CGST</span>
                <span className="font-bold text-gray-800">{(formState.applicable_gst_rate / 2).toFixed(2)}%</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-gray-400 block text-[10px]">SGST</span>
                <span className="font-bold text-gray-800">{(formState.applicable_gst_rate / 2).toFixed(2)}%</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-gray-400 block text-[10px]">IGST</span>
                <span className="font-bold text-blue-600">{formState.applicable_gst_rate.toFixed(2)}%</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-gray-400 block text-[10px]">CESS</span>
                <span className="font-bold text-gray-700">{(formState.cess_rate || 0).toFixed(2)}%</span>
              </div>
            </div>
          </div>

          {/* Status Toggle */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is_active_toggle"
              checked={formState.is_active}
              onChange={(e) => setFormState({ ...formState, is_active: e.target.checked })}
              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <label htmlFor="is_active_toggle" className="text-xs font-medium text-gray-700 cursor-pointer">
              Active for Product Catalog & Invoice Generation
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save & Register Code'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: EDIT CODE */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit ${activeTab.toUpperCase()} Code: ${formState.code}`}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Tariff Code *</label>
              <input
                type="text"
                required
                value={formState.code}
                onChange={(e) => setFormState({ ...formState, code: e.target.value.replace(/\s+/g, '') })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Category / Domain *</label>
              <input
                type="text"
                required
                value={formState.category}
                onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Official Tariff Description *</label>
            <textarea
              required
              rows={3}
              value={formState.description}
              onChange={(e) => setFormState({ ...formState, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Applicable GST Rate (%) *</label>
              <select
                value={formState.applicable_gst_rate}
                onChange={(e) => setFormState({ ...formState, applicable_gst_rate: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={18}>18% (Standard GST Rate)</option>
                <option value={12}>12% (Standard I)</option>
                <option value={5}>5% (Essential Goods/Services)</option>
                <option value={28}>28% (Luxury / De-merit)</option>
                <option value={0}>0% (Nil Rated / Exempt)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Compensation Cess (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formState.cess_rate}
                onChange={(e) => setFormState({ ...formState, cess_rate: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is_active_edit"
              checked={formState.is_active}
              onChange={(e) => setFormState({ ...formState, is_active: e.target.checked })}
              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <label htmlFor="is_active_edit" className="text-xs font-medium text-gray-700 cursor-pointer">
              Active in Product Catalog & Invoicing
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Update Tariff Code'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: VIEW CODE DETAILS */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Tariff Classification Details"
        maxWidth="md"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                  {activeTab === 'hsn' ? 'Harmonized System Code (Goods)' : 'Services Accounting Code (Services)'}
                </span>
                <span className="text-2xl font-mono font-bold text-gray-900 mt-0.5 block">
                  {activeTab === 'hsn' ? selectedItem.hsn_code : selectedItem.sac_code}
                </span>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${getRateBadge(
                  Number(selectedItem.applicable_gst_rate)
                )}`}
              >
                {selectedItem.applicable_gst_rate}% GST
              </span>
            </div>

            <div>
              <span className="text-xs font-semibold text-gray-500 block mb-1">Official Description</span>
              <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-200">
                {selectedItem.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-gray-500 block text-[11px]">Classification / Category</span>
                <span className="font-semibold text-gray-900 mt-0.5 block">
                  {activeTab === 'hsn' ? selectedItem.goods_category : selectedItem.service_category}
                </span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-gray-500 block text-[11px]">Compensation Cess</span>
                <span className="font-semibold text-gray-900 mt-0.5 block">
                  {Number(selectedItem.cess_rate || 0) > 0 ? `${selectedItem.cess_rate}%` : '0.00% (None)'}
                </span>
              </div>
            </div>

            {/* Tax Split breakdown */}
            <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200/80">
              <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block mb-2">
                Statutory GST Split
              </span>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-white p-2 rounded-lg border border-blue-200">
                  <span className="text-gray-400 block text-[10px]">CGST</span>
                  <span className="font-bold text-gray-800">
                    {(Number(selectedItem.applicable_gst_rate) / 2).toFixed(2)}%
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-blue-200">
                  <span className="text-gray-400 block text-[10px]">SGST</span>
                  <span className="font-bold text-gray-800">
                    {(Number(selectedItem.applicable_gst_rate) / 2).toFixed(2)}%
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-blue-200">
                  <span className="text-gray-400 block text-[10px]">IGST</span>
                  <span className="font-bold text-blue-600">
                    {Number(selectedItem.applicable_gst_rate).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 4: DELETE CONFIRMATION */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Removal"
        maxWidth="sm"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
              <AlertTriangle className="text-rose-600 shrink-0 mt-0.5" size={16} />
              <div>
                Are you sure you want to remove tariff code{' '}
                <strong>{activeTab === 'hsn' ? selectedItem.hsn_code : selectedItem.sac_code}</strong>? Products or
                invoices currently referencing this code might be affected.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={submitting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
              >
                {submitting ? 'Deleting...' : 'Yes, Delete Code'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 5: BULK UPLOAD MODAL */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Bulk Import HSN & SAC Tariff Codes"
        maxWidth="xl"
      >
        <div className="space-y-4">
          {/* Top description & Sample Download */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl gap-3">
            <div>
              <span className="text-xs font-bold text-blue-900 block">Official Indian CBIC Tariff Data</span>
              <p className="text-[11px] text-blue-700 mt-0.5">
                Bulk upload goods (HSN) and services (SAC) tariff codes with rates via CSV or 1-click official preloader.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadSampleCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 rounded-lg text-xs font-semibold shadow-sm transition-all whitespace-nowrap"
              >
                <Download size={13} />
                Sample CSV Template
              </button>
              <button
                onClick={handlePreloadStandardCodes}
                disabled={submitting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all whitespace-nowrap disabled:opacity-50"
              >
                <ShieldCheck size={13} />
                1-Click Official Library
              </button>
            </div>
          </div>

          {/* Mode Tabs: Upload vs Paste */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setBulkMode('file')}
              className={`pb-2 px-4 text-xs font-bold border-b-2 transition-colors ${
                bulkMode === 'file'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Upload CSV File
            </button>
            <button
              onClick={() => setBulkMode('paste')}
              className={`pb-2 px-4 text-xs font-bold border-b-2 transition-colors ${
                bulkMode === 'paste'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Paste CSV / Text
            </button>
          </div>

          {bulkError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle size={15} />
              {bulkError}
            </div>
          )}

          {bulkMode === 'file' ? (
            <div className="p-6 border-2 border-dashed border-gray-300 rounded-2xl text-center bg-gray-50/50 hover:bg-gray-50 transition-colors">
              <FileSpreadsheet className="mx-auto text-gray-400 mb-2" size={36} />
              <div className="text-xs font-semibold text-gray-800">
                Choose a CSV file containing HSN/SAC records
              </div>
              <p className="text-[11px] text-gray-500 mt-1 mb-3">
                Expected columns: <code>code, type, description, category, gst_rate, cess_rate</code>
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-700">Paste CSV data below:</label>
              <textarea
                rows={5}
                value={pastedData}
                onChange={(e) => {
                  setPastedData(e.target.value);
                  parseCSVData(e.target.value);
                }}
                placeholder="code,type,description,category,gst_rate,cess_rate&#10;847130,hsn,Laptops,Electronics,18,0&#10;998314,sac,IT Development,IT Services,18,0"
                className="w-full p-3 font-mono text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Parsed Rows Preview */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-800">
                  Ready to Import: {parsedRows.length} Codes (
                  {parsedRows.filter((r) => r.type === 'hsn').length} HSN,{' '}
                  {parsedRows.filter((r) => r.type === 'sac').length} SAC)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setParsedRows([]);
                    setPastedData('');
                  }}
                  className="text-rose-600 hover:text-rose-800 font-semibold"
                >
                  Clear
                </button>
              </div>

              <div className="max-h-52 overflow-y-auto border border-gray-200 rounded-xl">
                <table className="w-full text-left text-xs divide-y divide-gray-200">
                  <thead className="bg-gray-100 font-semibold text-gray-600 text-[10px] uppercase sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Code</th>
                      <th className="py-2 px-3">Description</th>
                      <th className="py-2 px-3">Category</th>
                      <th className="py-2 px-3 text-center">GST Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-[11px]">
                    {parsedRows.slice(0, 50).map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="py-1.5 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              row.type === 'hsn' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {row.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-1.5 px-3 font-mono font-bold text-gray-900">{row.code}</td>
                        <td className="py-1.5 px-3 truncate max-w-xs">{row.description}</td>
                        <td className="py-1.5 px-3 text-gray-500">{row.category}</td>
                        <td className="py-1.5 px-3 text-center font-bold text-blue-600">{row.rate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedRows.length > 50 && (
                <p className="text-[10px] text-gray-400 italic">Showing first 50 of {parsedRows.length} rows</p>
              )}
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsBulkModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExecuteBulkImport}
              disabled={submitting || parsedRows.length === 0}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              {submitting ? 'Importing...' : `Import ${parsedRows.length} Codes`}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
