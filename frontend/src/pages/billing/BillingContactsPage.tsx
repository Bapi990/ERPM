import React, { useState, useEffect } from 'react';
import {
  Users, Building2, Plus, Search, Filter, CheckCircle2,
  Phone, Mail, MapPin, CreditCard, Eye, DollarSign, Shield
} from 'lucide-react';
import { api } from '../../api/client';
import { useRealtime } from '../../context/RealtimeContext';
import { Modal } from '../../components/common/Modal';
import type { Customer, Supplier } from '../../types';

export const BillingContactsPage: React.FC = () => {
  const { emitEvent } = useRealtime();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers'>('customers');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [addCustomerModal, setAddCustomerModal] = useState(false);
  const [addSupplierModal, setAddSupplierModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);

  // Customer Form
  const [customerForm, setCustomerForm] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    gstin: '',
    state: 'Odisha',
    city: 'Bhubaneswar',
    billing_address: '',
    credit_limit: 500000,
  });

  // Supplier Form
  const [supplierForm, setSupplierForm] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    mobile: '',
    gstin: '',
    state: 'Maharashtra',
    billing_address: '',
    bank_name: 'HDFC Bank',
    bank_account_no: '',
    bank_ifsc: '',
    payment_terms_days: 30,
    opening_balance: 0,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadContacts = async () => {
    setLoading(true);
    try {
      const [cRes, sRes] = await Promise.all([
        api.getCustomers(),
        api.getSuppliers(),
      ]);
      setCustomers(cRes?.results || cRes || []);
      setSuppliers(sRes?.results || sRes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCustomer(customerForm);
      emitEvent('customer_created', 'Customer Registered', `Customer "${customerForm.company_name}" added`, 'success');
      showToast('Customer registered successfully!');
      setAddCustomerModal(false);
      loadContacts();
    } catch (err: any) {
      console.error(err);
      showToast('Failed to register customer');
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSupplier(supplierForm);
      emitEvent('supplier_created', 'Supplier Registered', `Vendor "${supplierForm.company_name}" added with GSTIN`, 'success');
      showToast('Supplier registered successfully!');
      setAddSupplierModal(false);
      loadContacts();
    } catch (err: any) {
      console.error(err);
      showToast('Failed to register supplier');
    }
  };

  // Filtered Lists
  const filteredCustomers = customers.filter(c =>
    c.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.gstin || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSuppliers = suppliers.filter(s =>
    s.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.gstin || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold text-gray-900">Contacts Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Maintain verified customer and vendor GSTIN directories, ledgers, credit limits, and outstandings.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'customers' ? (
            <button
              onClick={() => setAddCustomerModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-primary-500/20"
            >
              <Plus size={16} />
              Add Customer
            </button>
          ) : (
            <button
              onClick={() => setAddSupplierModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-primary-500/20"
            >
              <Plus size={16} />
              Add Supplier / Vendor
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 gap-4">
        <div className="flex">
          <button
            onClick={() => setActiveTab('customers')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'customers'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Customer Debtors ({customers.length})
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'suppliers'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Vendor Creditors ({suppliers.length})
          </button>
        </div>

        <div className="relative pb-2 sm:pb-0 w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search contact, GSTIN, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Customers Tab */}
      {activeTab === 'customers' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50/80 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3 px-4">Customer Entity</th>
                  <th className="py-3 px-4">GSTIN & PAN</th>
                  <th className="py-3 px-4">State & Location</th>
                  <th className="py-3 px-4">Credit Limit</th>
                  <th className="py-3 px-4">Current Outstanding</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                          {cust.company_name[0] || 'C'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{cust.company_name}</p>
                          <p className="text-xs text-gray-400">{cust.contact_person} • {cust.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-gray-700">
                      {cust.gstin ? (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded">
                          {cust.gstin}
                        </span>
                      ) : (
                        <span className="text-gray-400">Unregistered</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-gray-700 text-xs">
                      {cust.city}, {cust.state}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-900 text-xs">
                      ₹{Number(cust.credit_limit || 500000).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-bold text-rose-600">
                      ₹{Number(cust.outstanding_balance || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedContact({ ...cust, type: 'Customer' })}
                        className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-all"
                        title="View Contact Dossier"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Suppliers Tab */}
      {activeTab === 'suppliers' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50/80 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3 px-4">Supplier Firm</th>
                  <th className="py-3 px-4">GSTIN & PAN</th>
                  <th className="py-3 px-4">State & Bank</th>
                  <th className="py-3 px-4">Payment Terms</th>
                  <th className="py-3 px-4">Payable Outstanding</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSuppliers.map((sup) => (
                  <tr key={sup.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                          {sup.company_name[0] || 'S'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{sup.company_name}</p>
                          <p className="text-xs text-gray-400">{sup.contact_person || sup.name} • {sup.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">
                      {sup.gstin ? (
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 font-bold rounded">
                          {sup.gstin}
                        </span>
                      ) : (
                        <span className="text-gray-400">Unregistered</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-gray-700 text-xs">
                      <p>{sup.state}</p>
                      <p className="text-[11px] text-gray-400">{sup.bank_name || 'Bank Not Added'}</p>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-800 text-xs">
                      {sup.payment_terms_days} Days
                    </td>
                    <td className="py-3.5 px-4 text-xs font-bold text-amber-600">
                      ₹{Number(sup.current_outstanding || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedContact({ ...sup, type: 'Supplier' })}
                        className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-all"
                        title="View Vendor Dossier"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add Customer */}
      <Modal
        isOpen={addCustomerModal}
        onClose={() => setAddCustomerModal(false)}
        title="Add Customer Debtor"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Company / Entity Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Jindal Steel & Power Ltd"
                value={customerForm.company_name}
                onChange={(e) => setCustomerForm({ ...customerForm, company_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Person *</label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Nayak"
                value={customerForm.contact_person}
                onChange={(e) => setCustomerForm({ ...customerForm, contact_person: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Customer GSTIN</label>
              <input
                type="text"
                maxLength={15}
                placeholder="21AAACJ1234F1Z9"
                value={customerForm.gstin}
                onChange={(e) => setCustomerForm({ ...customerForm, gstin: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm uppercase font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Place of Supply / State *</label>
              <input
                type="text"
                required
                value={customerForm.state}
                onChange={(e) => setCustomerForm({ ...customerForm, state: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
              <input
                type="email"
                placeholder="billing@customer.com"
                value={customerForm.email}
                onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={customerForm.phone}
                onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Billing & Shipping Address</label>
            <textarea
              rows={2}
              value={customerForm.billing_address}
              onChange={(e) => setCustomerForm({ ...customerForm, billing_address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setAddCustomerModal(false)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-primary-500/20"
            >
              Register Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Supplier */}
      <Modal
        isOpen={addSupplierModal}
        onClose={() => setAddSupplierModal(false)}
        title="Add Vendor / Supplier Creditor"
      >
        <form onSubmit={handleCreateSupplier} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Supplier Company Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Hewlett Packard Enterprise"
                value={supplierForm.company_name}
                onChange={(e) => setSupplierForm({ ...supplierForm, company_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Supplier GSTIN *</label>
              <input
                type="text"
                required
                maxLength={15}
                placeholder="29AAACH1234F1Z8"
                value={supplierForm.gstin}
                onChange={(e) => setSupplierForm({ ...supplierForm, gstin: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm uppercase font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Bank Name</label>
              <input
                type="text"
                value={supplierForm.bank_name}
                onChange={(e) => setSupplierForm({ ...supplierForm, bank_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Bank Account</label>
              <input
                type="text"
                value={supplierForm.bank_account_no}
                onChange={(e) => setSupplierForm({ ...supplierForm, bank_account_no: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">IFSC Code</label>
              <input
                type="text"
                value={supplierForm.bank_ifsc}
                onChange={(e) => setSupplierForm({ ...supplierForm, bank_ifsc: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm uppercase font-mono"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setAddSupplierModal(false)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-primary-500/20"
            >
              Register Supplier
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
