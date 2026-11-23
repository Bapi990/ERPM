import React, { useState, useEffect } from 'react';
import {
  FileCheck, Plus, CheckCircle2, XCircle, Clock, ShieldCheck,
  Eye, Download, FileText, Search, Filter, Check, X, AlertCircle,
  FileSpreadsheet, Image as ImageIcon
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import { Modal } from '../../components/common/Modal';
import type { Employee } from '../../types';

interface DocumentRecord {
  id: string;
  employee: string;
  employee_name?: string;
  employee_code?: string;
  department_name?: string;
  document_type: string;
  title: string;
  file?: string;
  status: 'pending' | 'verified' | 'rejected';
  verified_by?: string;
  verified_at?: string;
  notes?: string;
  created_at: string;
}

export const KycDocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const { emitEvent, subscribe } = useRealtime();

  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [uploadModal, setUploadModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);

  // Form State
  const [form, setForm] = useState({
    employee: '',
    document_type: 'aadhaar',
    title: 'Aadhaar Identification Document',
    notes: 'Government verified UIDAI proof',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [docRes, empRes] = await Promise.all([
        api.getDocuments().catch(() => ({ results: [] })),
        api.getEmployees().catch(() => ({ results: [] })),
      ]);
      const docs = docRes?.results || (Array.isArray(docRes) ? docRes : docRes?.data?.results || docRes?.data || []);
      const emps = empRes?.results || (Array.isArray(empRes) ? empRes : empRes?.data?.results || empRes?.data || []);
      setEmployees(emps);

      // Enhance docs with employee details if missing
      const enhanced = docs.map((d: any) => {
        const emp = emps.find((e: any) => e.id === d.employee);
        return {
          ...d,
          employee_name: d.employee_name || (emp ? `${emp.first_name} ${emp.last_name}` : 'Staff Member'),
          employee_code: d.employee_code || emp?.employee_id || 'EMP',
          department_name: d.department_name || emp?.department?.name || 'General',
        };
      });
      setDocuments(enhanced);
    } catch (err) {
      console.error('Failed to load documents data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub1 = subscribe('doc_*', () => loadData());
    const unsub2 = subscribe('employee_*', () => loadData());
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employee) {
      showToast('Please select an employee');
      return;
    }
    try {
      await api.createDocument({
        ...form,
        status: 'pending',
      });
      emitEvent('doc_uploaded', 'Document Vault Updated', 'KYC compliance document uploaded', 'info');
      showToast('Document uploaded to employee vault successfully!');
      setUploadModal(false);
      setForm({
        employee: '',
        document_type: 'aadhaar',
        title: 'Aadhaar Identification Document',
        notes: '',
      });
      loadData();
    } catch (err: any) {
      console.error(err);
      showToast('Failed to upload document');
    }
  };

  const handleUpdateStatus = async (id: string, status: 'verified' | 'rejected') => {
    try {
      await api.updateDocumentStatus(id, status);
      emitEvent('doc_verified', 'Document Status Updated', `Document verification status changed to ${status}`, status === 'verified' ? 'success' : 'warning');
      showToast(`Document status updated to ${status.toUpperCase()}`);
      if (selectedDoc && selectedDoc.id === id) {
        setSelectedDoc({ ...selectedDoc, status });
      }
      loadData();
    } catch (err: any) {
      console.error(err);
      showToast('Failed to update document verification');
    }
  };

  // KPIs
  const totalCount = documents.length;
  const verifiedCount = documents.filter(d => d.status === 'verified').length;
  const pendingCount = documents.filter(d => d.status === 'pending').length;
  const rejectedCount = documents.filter(d => d.status === 'rejected').length;

  const filtered = documents.filter(doc => {
    const matchesType = typeFilter === 'all' || doc.document_type.toLowerCase() === typeFilter.toLowerCase();
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    const matchesSearch =
      (doc.employee_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.employee_code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.document_type || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl transition-all">
          <CheckCircle2 size={18} />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Documents & KYC</h1>
          <p className="text-sm text-gray-500 mt-1">
            Centralized document vault for identity proofs, academic credentials, offer letters, and statutory compliance.
          </p>
        </div>
        <button
          onClick={() => setUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 text-sm font-semibold transition-all shadow-md shadow-primary-500/20"
        >
          <Plus size={16} />
          Upload KYC Document
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <div>
            <p className="text-[11px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Vault Records</p>
            <p className="text-base sm:text-2xl font-bold text-gray-900 mt-1 truncate">{totalCount}</p>
            <p className="text-[11px] sm:text-xs text-primary-600 mt-0.5 sm:mt-1 truncate">Encrypted on server</p>
          </div>
          <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <FileText className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <div>
            <p className="text-[11px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">Verified KYC</p>
            <p className="text-base sm:text-2xl font-bold text-emerald-600 mt-1 truncate">{verifiedCount}</p>
            <p className="text-[11px] sm:text-xs text-emerald-600 mt-0.5 sm:mt-1 flex items-center gap-1 truncate">
              <CheckCircle2 size={12} className="shrink-0" /> Compliance cleared
            </p>
          </div>
          <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <ShieldCheck className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <div>
            <p className="text-[11px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">Verification Pending</p>
            <p className="text-base sm:text-2xl font-bold text-amber-600 mt-1 truncate">{pendingCount}</p>
            <p className="text-[11px] sm:text-xs text-amber-600 mt-0.5 sm:mt-1 flex items-center gap-1 truncate">
              <Clock size={12} className="shrink-0" /> Requires HR review
            </p>
          </div>
          <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Clock className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <div>
            <p className="text-[11px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">Rejected / Resubmit</p>
            <p className="text-base sm:text-2xl font-bold text-rose-600 mt-1 truncate">{rejectedCount}</p>
            <p className="text-[11px] sm:text-xs text-rose-600 mt-0.5 sm:mt-1 flex items-center gap-1 truncate">
              <XCircle size={12} className="shrink-0" /> Flagged documents
            </p>
          </div>
          <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0">
            <XCircle className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {['all', 'aadhaar', 'pan', 'resume', 'offer_letter', 'degree', 'bank_proof'].map(type => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                typeFilter === type
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Verification Status</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>

          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search staff, code, title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50/80 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Document Type</th>
                <th className="py-3 px-4">Document Title</th>
                <th className="py-3 px-4">Uploaded Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400 text-sm">
                    No documents found matching the filter.
                  </td>
                </tr>
              ) : (
                filtered.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                          {doc.employee_name?.[0] || 'E'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{doc.employee_name}</p>
                          <p className="text-xs text-gray-400 font-mono">{doc.employee_code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-primary-50 text-primary-700 capitalize">
                        {doc.document_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-900">
                      {doc.title}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 text-xs">
                      {doc.created_at ? new Date(doc.created_at).toLocaleDateString('en-IN') : 'Recent'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full capitalize ${
                        doc.status === 'verified'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : doc.status === 'rejected'
                          ? 'bg-rose-50 text-rose-700 border border-rose-100'
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedDoc(doc)}
                          className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-all"
                          title="Preview Document"
                        >
                          <Eye size={16} />
                        </button>
                        {doc.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(doc.id, 'verified')}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                              title="Mark as Verified"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(doc.id, 'rejected')}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              title="Reject Document"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Upload Document */}
      <Modal
        isOpen={uploadModal}
        onClose={() => setUploadModal(false)}
        title="Upload KYC & Compliance Document"
      >
        <form onSubmit={handleUploadDoc} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Select Employee *</label>
            <select
              required
              value={form.employee}
              onChange={(e) => setForm({ ...form, employee: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">-- Choose Employee --</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} ({emp.employee_id || 'ID'}) - {emp.department_name || 'Dept'}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Document Category *</label>
              <select
                value={form.document_type}
                onChange={(e) => setForm({ ...form, document_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="aadhaar">Aadhaar Card</option>
                <option value="pan">PAN Card</option>
                <option value="resume">Resume / CV</option>
                <option value="offer_letter">Signed Offer Letter</option>
                <option value="degree">Degree / Diploma Certificate</option>
                <option value="bank_proof">Bank Passbook / Cheque</option>
                <option value="passport">Passport / Driving License</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Document Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Aadhaar Card Copy"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Upload File (PDF / JPG / PNG)</label>
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:bg-gray-50/50 cursor-pointer transition-colors">
              <FileText className="mx-auto text-primary-500 mb-2" size={32} />
              <p className="text-xs font-semibold text-gray-700">Click to browse or drop document here</p>
              <p className="text-[11px] text-gray-400 mt-1">Supports PDF, JPG, PNG up to 10MB</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Verification Notes</label>
            <textarea
              rows={2}
              placeholder="Any additional remarks..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setUploadModal(false)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-primary-500/20"
            >
              Upload to Vault
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Document */}
      {selectedDoc && (
        <Modal
          isOpen={!!selectedDoc}
          onClose={() => setSelectedDoc(null)}
          title={`Document Dossier: ${selectedDoc.title}`}
        >
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase">Holder</p>
                <p className="text-base font-bold text-gray-900">{selectedDoc.employee_name}</p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{selectedDoc.employee_code}</p>
              </div>
              <span className={`px-3 py-1 text-xs font-bold rounded-full capitalize ${
                selectedDoc.status === 'verified'
                  ? 'bg-emerald-100 text-emerald-800'
                  : selectedDoc.status === 'rejected'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {selectedDoc.status}
              </span>
            </div>

            {/* Document Preview Box */}
            <div className="border border-gray-200 rounded-2xl p-8 bg-gray-50/50 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center mb-3">
                <ShieldCheck size={36} />
              </div>
              <h4 className="font-bold text-gray-900 text-sm mb-1">{selectedDoc.title}</h4>
              <p className="text-xs text-gray-500 mb-4 uppercase tracking-wider font-mono">
                ODIAS-ERP-SECURE-VAULT-ENCRYPTED
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => showToast('Simulated Document Download Initiated')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 rounded-xl text-xs font-semibold shadow-sm"
                >
                  <Download size={14} /> Download Copy
                </button>
              </div>
            </div>

            {selectedDoc.notes && (
              <div className="p-3 border border-gray-100 rounded-xl text-sm bg-gray-50">
                <span className="text-xs text-gray-400 block font-semibold mb-1">Notes:</span>
                <p className="text-gray-700">{selectedDoc.notes}</p>
              </div>
            )}

            {selectedDoc.status === 'pending' && (
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  onClick={() => handleUpdateStatus(selectedDoc.id, 'rejected')}
                  className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-sm font-semibold"
                >
                  Reject Document
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedDoc.id, 'verified')}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-500/20"
                >
                  Verify Document
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
