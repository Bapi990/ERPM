import React, { useState, useEffect } from 'react';
import {
  User, Plus, Search, Filter, Phone, Mail, Building2,
  CheckCircle2, Edit3, Trash2, ExternalLink, ShieldCheck,
  Star, Briefcase, RefreshCw
} from 'lucide-react';
import { api } from '../../api/client';
import { useRealtime } from '../../context/RealtimeContext';
import { Modal } from '../../components/common/Modal';

export const ContactPersonsPage: React.FC = () => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const { emitEvent } = useRealtime();

  // Create / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    customer: '',
    name: '',
    designation: '',
    department: '',
    email: '',
    phone: '',
    alternate_phone: '',
    is_primary: false,
    linkedin_url: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [contData, custData] = await Promise.all([
        api.getContactPersons(),
        api.getCustomers(),
      ]);
      setContacts(contData.results || contData || []);
      setCustomers(custData.results || custData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  const handleOpenCreate = () => {
    setEditingContact(null);
    setFormData({
      customer: customers[0]?.id || '',
      name: '',
      designation: '',
      department: '',
      email: '',
      phone: '',
      alternate_phone: '',
      is_primary: false,
      linkedin_url: '',
      notes: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (contact: any) => {
    setEditingContact(contact);
    setFormData({
      customer: contact.customer || '',
      name: contact.name || '',
      designation: contact.designation || '',
      department: contact.department || '',
      email: contact.email || '',
      phone: contact.phone || '',
      alternate_phone: contact.alternate_phone || '',
      is_primary: contact.is_primary || false,
      linkedin_url: contact.linkedin_url || '',
      notes: contact.notes || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingContact) {
        await api.updateContactPerson(editingContact.id, formData);
        showToast(`Contact person ${formData.name} updated.`);
      } else {
        await api.createContactPerson(formData);
        showToast(`Added ${formData.name} to client contacts directory!`);
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (contact: any) => {
    if (!confirm(`Delete contact person ${contact.name}?`)) return;
    try {
      await api.deleteContactPerson(contact.id);
      showToast(`Removed ${contact.name}`);
      setContacts((prev) => prev.filter((c) => c.id !== contact.id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const filtered = contacts.filter((c) => {
    if (customerFilter && c.customer !== customerFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = (c.name || '').toLowerCase().includes(q);
      const matchCompany = (c.customer_name || '').toLowerCase().includes(q);
      const matchEmail = (c.email || '').toLowerCase().includes(q);
      if (!matchName && !matchCompany && !matchEmail) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Toast Alert */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-3 border border-slate-700 animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold">{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Customer Contact Persons Directory
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Key stakeholders, directors, procurement heads, and decision makers across commercial customer accounts.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Add Contact Person</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, account..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white transition-colors"
            />
          </div>

          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold bg-white"
          >
            <option value="">All Customer Accounts</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company_name}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs font-semibold text-slate-500">{filtered.length} contact records</span>
      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-5 py-3">Contact Name</th>
              <th className="px-5 py-3">Organization</th>
              <th className="px-5 py-3">Designation & Dept</th>
              <th className="px-5 py-3">Corporate Email</th>
              <th className="px-5 py-3">Phone</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                  No contact persons found. Click "Add Contact Person" to register client stakeholders.
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="font-bold text-slate-900 block leading-tight">{c.name}</span>
                    {c.linkedin_url && (
                      <a
                        href={c.linkedin_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-blue-600 hover:underline inline-flex items-center mt-0.5"
                      >
                        <span>LinkedIn</span>
                        <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                      </a>
                    )}
                  </td>
                  <td className="px-5 py-3.5 font-bold text-slate-800">
                    {c.customer_name}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-semibold text-slate-800 block">{c.designation}</span>
                    <span className="text-[11px] text-slate-400">{c.department || 'Management'}</span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-slate-700">
                    {c.email}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-slate-700">
                    {c.phone}
                  </td>
                  <td className="px-5 py-3.5">
                    {c.is_primary ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <Star className="w-3 h-3 mr-1 fill-amber-500 text-amber-500" />
                        Primary Signoff
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500">Secondary</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="p-1.5 rounded-lg text-amber-600 hover:text-amber-800 hover:bg-amber-50 border border-amber-200 transition-colors cursor-pointer"
                        title="Edit Contact"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                        title="Delete Contact"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: ADD / EDIT CONTACT */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingContact ? `Edit Contact: ${editingContact.name}` : 'Add Contact Person'}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Company Account *</label>
              <select
                required
                value={formData.customer}
                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
              >
                <option value="">-- Select Customer Account --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name} ({c.customer_code})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ramesh Chandra Tripathy"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Designation *</label>
                <input
                  type="text"
                  required
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  placeholder="e.g. Chief Procurement Officer"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Corporate Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Finance / Supply Chain / IT"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">LinkedIn Profile URL</label>
                <input
                  type="url"
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="isPrimaryContact"
                checked={formData.is_primary}
                onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isPrimaryContact" className="text-xs font-bold text-slate-700">
                Mark as Primary Point of Contact (Authorised Signatory)
              </label>
            </div>

            <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm cursor-pointer"
              >
                {submitting ? 'Saving...' : 'Save Contact'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
