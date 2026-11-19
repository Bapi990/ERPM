import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText, Plus, ArrowLeft, Printer, Eye, Trash2, Calendar,
  Building2, CheckCircle2, Filter, AlertCircle, ArrowUpRight, ArrowDownLeft, Check
} from 'lucide-react';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable, ColumnDef } from '../../components/common/DataTable';
import { useRealtime } from '../../context/RealtimeContext';
import type { Customer, Invoice } from '../../types';

interface CreditNote {
  id: string;
  credit_note_number: string;
  original_invoice: string;
  original_invoice_number?: string;
  customer: string;
  customer_name?: string;
  credit_note_date: string;
  reason: string;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  total_tax: number;
  total_amount: number;
  status: 'draft' | 'issued' | 'applied';
}

interface DebitNote {
  id: string;
  debit_note_number: string;
  original_invoice_reference?: string;
  supplier?: string;
  supplier_name?: string;
  customer?: string;
  customer_name?: string;
  debit_note_date: string;
  reason: string;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  total_tax: number;
  total_amount: number;
  status: 'draft' | 'issued' | 'settled';
}

interface TermItem {
  id: string;
  text: string;
  checked: boolean;
}

const DEFAULT_CREDIT_TERMS: TermItem[] = [
  { id: '1', text: 'Credit memo issued in accordance with GST Rule 53 / Section 34 of CGST Act.', checked: true },
  { id: '2', text: 'Output GST liability reversal to be claimed in Table 4 of GSTR-1 & Table 4(B) GSTR-3B.', checked: true },
  { id: '3', text: 'Returned goods inspected at receiving depository in sound resalable condition.', checked: true },
  { id: '4', text: 'Customer account ledger balance credited and adjusted against pending invoices.', checked: true },
];

const DEFAULT_DEBIT_TERMS: TermItem[] = [
  { id: '1', text: 'Debit memo raised under Section 34(3) of CGST Act for vendor tax invoice correction.', checked: true },
  { id: '2', text: 'Vendor required to report corresponding Credit Note in their GSTR-1 return.', checked: true },
  { id: '3', text: 'Applicable Input Tax Credit (ITC) adjustment accounted for in monthly compliance.', checked: true },
];

export const CreditDebitNotesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'credit' | 'debit'>('credit');
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [debitNotes, setDebitNotes] = useState<DebitNote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Modals & Full-Page Views
  const [isCreatingCredit, setIsCreatingCredit] = useState(false);
  const [isCreatingDebit, setIsCreatingDebit] = useState(false);
  const [viewNote, setViewNote] = useState<any | null>(null);
  const [viewType, setViewType] = useState<'credit' | 'debit'>('credit');

  const { emitEvent } = useRealtime();

  // Credit Note Form
  const [creditForm, setCreditForm] = useState({
    customer: '',
    original_invoice: '',
    credit_note_date: new Date().toISOString().split('T')[0],
    reason: '01-Sales Return',
    taxable_amount: 10000,
    tax_rate: 18,
    is_inter_state: false,
    item_description: 'Sales return of defective / excess hardware units',
    hsn_sac: '847130',
    notes: 'Credit memo issued for returned goods in undamaged condition.',
  });
  const [creditTerms, setCreditTerms] = useState<TermItem[]>(DEFAULT_CREDIT_TERMS);

  // Debit Note Form
  const [debitForm, setDebitForm] = useState({
    party_name: 'Tata Consultancy Services',
    reference_number: 'BILL-2026-089',
    debit_note_date: new Date().toISOString().split('T')[0],
    reason: '02-Deficiency in Services',
    taxable_amount: 15000,
    tax_rate: 18,
    is_inter_state: false,
    item_description: 'Price correction / shortfall in service SLA',
    hsn_sac: '998314',
    notes: 'Debit memo raised for price escalation correction.',
  });
  const [debitTerms, setDebitTerms] = useState<TermItem[]>(DEFAULT_DEBIT_TERMS);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cnRes, dnRes, custRes, invRes] = await Promise.all([
        api.getCreditNotes(),
        api.getDebitNotes(),
        api.getCustomers(),
        api.getInvoices(),
      ]);
      setCreditNotes(cnRes.results || cnRes || []);
      setDebitNotes(dnRes.results || dnRes || []);
      const cList = custRes.results || custRes || [];
      setCustomers(cList);
      if (cList.length > 0 && !creditForm.customer) {
        setCreditForm((prev) => ({ ...prev, customer: cList[0].id }));
      }
      const iList = invRes.results || invRes || [];
      setInvoices(iList);
      if (iList.length > 0 && !creditForm.original_invoice) {
        setCreditForm((prev) => ({ ...prev, original_invoice: iList[0].id }));
      }
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

  const handleCreateCreditNote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const taxAmt = creditForm.taxable_amount * (creditForm.tax_rate / 100);
      const total = Number(creditForm.taxable_amount) + taxAmt;
      const payload = {
        customer: creditForm.customer,
        original_invoice: creditForm.original_invoice,
        credit_note_date: creditForm.credit_note_date,
        reason: creditForm.reason,
        subtotal: creditForm.taxable_amount,
        cgst: creditForm.is_inter_state ? 0 : taxAmt / 2,
        sgst: creditForm.is_inter_state ? 0 : taxAmt / 2,
        igst: creditForm.is_inter_state ? taxAmt : 0,
        total_tax: taxAmt,
        total_amount: total,
        status: 'issued',
      };
      await api.createCreditNote(payload);
      setIsCreatingCredit(false);
      showToast('GST Credit Note generated and posted to ledger.');
      emitEvent('billing.credit_note_created', 'Credit Note Issued', 'Customer ledger credited with GST reversal.', 'info');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Credit note creation failed');
    }
  };

  const handleCreateDebitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const taxAmt = debitForm.taxable_amount * (debitForm.tax_rate / 100);
      const total = Number(debitForm.taxable_amount) + taxAmt;
      const payload = {
        supplier_name: debitForm.party_name,
        original_invoice_reference: debitForm.reference_number,
        debit_note_date: debitForm.debit_note_date,
        reason: debitForm.reason,
        subtotal: debitForm.taxable_amount,
        cgst: debitForm.is_inter_state ? 0 : taxAmt / 2,
        sgst: debitForm.is_inter_state ? 0 : taxAmt / 2,
        igst: debitForm.is_inter_state ? taxAmt : 0,
        total_tax: taxAmt,
        total_amount: total,
        status: 'issued',
      };
      await api.createDebitNote(payload);
      setIsCreatingDebit(false);
      showToast('GST Debit Note issued and posted to accounts.');
      emitEvent('billing.debit_note_created', 'Debit Note Issued', 'Debit note registered in compliance ledger.', 'info');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Debit note creation failed');
    }
  };

  const creditColumns: ColumnDef<CreditNote>[] = [
    {
      key: 'credit_note_number',
      header: 'Credit Note #',
      render: (cn) => <span className="font-mono font-bold text-slate-900">{cn.credit_note_number}</span>,
    },
    {
      key: 'customer_name',
      header: 'Customer',
      render: (cn) => <span className="font-bold text-slate-900">{cn.customer_name || 'Valued Client'}</span>,
    },
    {
      key: 'original_invoice_number',
      header: 'Linked Invoice',
      render: (cn) => (
        <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md font-semibold">
          {cn.original_invoice_number || 'INV-ORIG'}
        </span>
      ),
    },
    {
      key: 'credit_note_date',
      header: 'Note Date',
      render: (cn) => <span className="font-mono text-slate-600 text-xs">{cn.credit_note_date}</span>,
    },
    {
      key: 'reason',
      header: 'GST Reason',
      render: (cn) => <span className="text-xs text-slate-700">{cn.reason}</span>,
    },
    {
      key: 'total_tax',
      header: 'GST Reversal',
      accessor: (cn) => Number(cn.total_tax),
      render: (cn) => <span className="font-mono text-slate-600">₹{Number(cn.total_tax).toLocaleString('en-IN')}</span>,
    },
    {
      key: 'total_amount',
      header: 'Credited Amount',
      accessor: (cn) => Number(cn.total_amount),
      render: (cn) => (
        <span className="font-mono font-extrabold text-rose-600 text-sm">
          - ₹{Number(cn.total_amount).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (cn) => <StatusBadge status={cn.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      sortable: false,
      render: (cn) => (
        <button
          onClick={() => { setViewNote(cn); setViewType('credit'); }}
          className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200/80 transition-colors cursor-pointer"
          title="View Credit Note Dossier"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  const debitColumns: ColumnDef<DebitNote>[] = [
    {
      key: 'debit_note_number',
      header: 'Debit Note #',
      render: (dn) => <span className="font-mono font-bold text-slate-900">{dn.debit_note_number}</span>,
    },
    {
      key: 'supplier_name',
      header: 'Vendor / Party',
      render: (dn) => <span className="font-bold text-slate-900">{dn.supplier_name || 'Vendor Partner'}</span>,
    },
    {
      key: 'original_invoice_reference',
      header: 'Ref Bill #',
      render: (dn) => (
        <span className="font-mono text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md font-semibold">
          {dn.original_invoice_reference || 'REF-BILL'}
        </span>
      ),
    },
    {
      key: 'debit_note_date',
      header: 'Date',
      render: (dn) => <span className="font-mono text-slate-600 text-xs">{dn.debit_note_date}</span>,
    },
    {
      key: 'reason',
      header: 'Adjustment Reason',
      render: (dn) => <span className="text-xs text-slate-700">{dn.reason}</span>,
    },
    {
      key: 'total_tax',
      header: 'Tax Adjustment',
      accessor: (dn) => Number(dn.total_tax),
      render: (dn) => <span className="font-mono text-slate-600">₹{Number(dn.total_tax).toLocaleString('en-IN')}</span>,
    },
    {
      key: 'total_amount',
      header: 'Debit Amount',
      accessor: (dn) => Number(dn.total_amount),
      render: (dn) => (
        <span className="font-mono font-extrabold text-blue-700 text-sm">
          + ₹{Number(dn.total_amount).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (dn) => <StatusBadge status={dn.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      sortable: false,
      render: (dn) => (
        <button
          onClick={() => { setViewNote(dn); setViewType('debit'); }}
          className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200/80 transition-colors cursor-pointer"
          title="View Debit Note Dossier"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  // ----------------------------------------------------
  // FULL PAGE VIEW: NEW CREDIT NOTE (Matching media_1794806738467_07640226.png)
  // ----------------------------------------------------
  if (isCreatingCredit) {
    const taxAmt = creditForm.taxable_amount * (creditForm.tax_rate / 100);
    const totalCredit = Number(creditForm.taxable_amount) + taxAmt;

    return (
      <div className="space-y-6 pb-20 animate-in fade-in duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">New GST Credit Note</h1>
          </div>
          <button
            type="button"
            onClick={() => setIsCreatingCredit(false)}
            className="inline-flex items-center px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            <span>Back</span>
          </button>
        </div>

        <form onSubmit={handleCreateCreditNote} className="space-y-6">
          {/* Card 1: Parameters */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Credit Note Parameters
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Customer *</label>
                <select
                  value={creditForm.customer}
                  onChange={(e) => setCreditForm({ ...creditForm, customer: e.target.value })}
                  required
                  className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                >
                  <option value="">Find customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name || c.name} {c.gstin ? `(${c.gstin})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Original Invoice Reference *</label>
                <select
                  value={creditForm.original_invoice}
                  onChange={(e) => setCreditForm({ ...creditForm, original_invoice: e.target.value })}
                  required
                  className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                >
                  <option value="">Select linked invoice...</option>
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoice_number} (₹{Number(inv.total_amount).toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Credit Note Date *</label>
                <input
                  type="date"
                  required
                  value={creditForm.credit_note_date}
                  onChange={(e) => setCreditForm({ ...creditForm, credit_note_date: e.target.value })}
                  className="w-full text-xs font-mono font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Reason for Credit Memo *</label>
                <select
                  value={creditForm.reason}
                  onChange={(e) => setCreditForm({ ...creditForm, reason: e.target.value })}
                  className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                >
                  <option value="01-Sales Return">01-Sales Return</option>
                  <option value="02-Post Sale Discount">02-Post Sale Discount</option>
                  <option value="03-Deficiency in Services">03-Deficiency in Services</option>
                  <option value="04-Correction in Invoice">04-Correction in Invoice</option>
                  <option value="05-Change in POS">05-Change in POS</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card 2: Items Grid */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Adjustment Items Grid
            </span>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Description / Reason *</th>
                    <th className="py-2.5 px-3">HSN / SAC</th>
                    <th className="py-2.5 px-3 text-right">Taxable Value (₹) *</th>
                    <th className="py-2.5 px-3 text-center">GST Rate %</th>
                    <th className="py-2.5 px-3 text-right">GST Reversal (₹)</th>
                    <th className="py-2.5 px-3 text-right">Total Credit (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  <tr>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        required
                        value={creditForm.item_description}
                        onChange={(e) => setCreditForm({ ...creditForm, item_description: e.target.value })}
                        className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-300 bg-white text-slate-800"
                      />
                    </td>
                    <td className="py-2.5 px-3 w-32">
                      <input
                        type="text"
                        value={creditForm.hsn_sac}
                        onChange={(e) => setCreditForm({ ...creditForm, hsn_sac: e.target.value })}
                        className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-300 bg-white text-slate-800 font-mono"
                      />
                    </td>
                    <td className="py-2.5 px-3 w-36 text-right">
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        required
                        value={creditForm.taxable_amount}
                        onChange={(e) => setCreditForm({ ...creditForm, taxable_amount: Number(e.target.value) })}
                        className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-300 bg-white text-slate-800 font-mono text-right"
                      />
                    </td>
                    <td className="py-2.5 px-3 w-28 text-center">
                      <select
                        value={creditForm.tax_rate}
                        onChange={(e) => setCreditForm({ ...creditForm, tax_rate: Number(e.target.value) })}
                        className="w-full text-xs px-2 py-1.5 rounded border border-slate-300 bg-white text-slate-800 font-mono text-center"
                      >
                        <option value={0}>0%</option>
                        <option value={5}>5%</option>
                        <option value={12}>12%</option>
                        <option value={18}>18%</option>
                        <option value={28}>28%</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-700">
                      ₹{taxAmt.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-extrabold text-rose-600 text-sm">
                      ₹{totalCredit.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bottom summary and notes */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
              <div className="md:col-span-7">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Adjustment Remarks</label>
                <textarea
                  rows={3}
                  value={creditForm.notes}
                  onChange={(e) => setCreditForm({ ...creditForm, notes: e.target.value })}
                  className="w-full text-xs p-3 rounded-lg border border-slate-300 bg-white text-slate-800"
                />
              </div>
              <div className="md:col-span-5 bg-rose-50/60 p-4 rounded-xl border border-rose-200 text-xs space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Taxable Reversal:</span>
                  <span className="font-mono font-bold text-slate-900">₹{creditForm.taxable_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST Reversal ({creditForm.tax_rate}%):</span>
                  <span className="font-mono font-bold text-rose-700">₹{taxAmt.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t-2 border-rose-200 flex justify-between items-center text-sm font-black text-rose-900">
                  <span>Total Credit Value:</span>
                  <span className="font-mono text-base text-rose-600">
                    ₹{totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Terms & Statutory Checklist */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Statutory GST Compliance Checklist
            </span>
            <div className="space-y-2 pt-2">
              {creditTerms.map((term) => (
                <div key={term.id} className="flex items-center space-x-2.5">
                  <input
                    type="checkbox"
                    checked={term.checked}
                    onChange={() => setCreditTerms(prev => prev.map(t => t.id === term.id ? { ...t, checked: !t.checked } : t))}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 cursor-pointer"
                  />
                  <span className={`text-xs ${term.checked ? 'text-slate-700' : 'text-slate-400 line-through'}`}>{term.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreatingCredit(false)}
              className="px-5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm shadow-rose-600/30 cursor-pointer"
            >
              Save & Issue Credit Note
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ----------------------------------------------------
  // FULL PAGE VIEW: NEW DEBIT NOTE (Matching media_1794806738467_07640226.png)
  // ----------------------------------------------------
  if (isCreatingDebit) {
    const taxAmt = debitForm.taxable_amount * (debitForm.tax_rate / 100);
    const totalDebit = Number(debitForm.taxable_amount) + taxAmt;

    return (
      <div className="space-y-6 pb-20 animate-in fade-in duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">New GST Debit Note</h1>
          </div>
          <button
            type="button"
            onClick={() => setIsCreatingDebit(false)}
            className="inline-flex items-center px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            <span>Back</span>
          </button>
        </div>

        <form onSubmit={handleCreateDebitNote} className="space-y-6">
          {/* Card 1: Parameters */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Debit Note Parameters
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Supplier / Party Name *</label>
                <input
                  type="text"
                  required
                  value={debitForm.party_name}
                  onChange={(e) => setDebitForm({ ...debitForm, party_name: e.target.value })}
                  className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Original Reference Bill # *</label>
                <input
                  type="text"
                  required
                  value={debitForm.reference_number}
                  onChange={(e) => setDebitForm({ ...debitForm, reference_number: e.target.value })}
                  className="w-full text-xs font-mono font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Debit Note Date *</label>
                <input
                  type="date"
                  required
                  value={debitForm.debit_note_date}
                  onChange={(e) => setDebitForm({ ...debitForm, debit_note_date: e.target.value })}
                  className="w-full text-xs font-mono font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Adjustment Reason *</label>
                <select
                  value={debitForm.reason}
                  onChange={(e) => setDebitForm({ ...debitForm, reason: e.target.value })}
                  className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="01-Purchase Return">01-Purchase Return</option>
                  <option value="02-Deficiency in Services">02-Deficiency in Services</option>
                  <option value="03-Price Escalation">03-Price Escalation</option>
                  <option value="04-Others">04-Others</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card 2: Items Grid */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Adjustment Items Grid
            </span>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Description / Reason *</th>
                    <th className="py-2.5 px-3">HSN / SAC</th>
                    <th className="py-2.5 px-3 text-right">Taxable Value (₹) *</th>
                    <th className="py-2.5 px-3 text-center">GST Rate %</th>
                    <th className="py-2.5 px-3 text-right">Tax Adjustment (₹)</th>
                    <th className="py-2.5 px-3 text-right">Total Debit (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  <tr>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        required
                        value={debitForm.item_description}
                        onChange={(e) => setDebitForm({ ...debitForm, item_description: e.target.value })}
                        className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-300 bg-white text-slate-800"
                      />
                    </td>
                    <td className="py-2.5 px-3 w-32">
                      <input
                        type="text"
                        value={debitForm.hsn_sac}
                        onChange={(e) => setDebitForm({ ...debitForm, hsn_sac: e.target.value })}
                        className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-300 bg-white text-slate-800 font-mono"
                      />
                    </td>
                    <td className="py-2.5 px-3 w-36 text-right">
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        required
                        value={debitForm.taxable_amount}
                        onChange={(e) => setDebitForm({ ...debitForm, taxable_amount: Number(e.target.value) })}
                        className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-300 bg-white text-slate-800 font-mono text-right"
                      />
                    </td>
                    <td className="py-2.5 px-3 w-28 text-center">
                      <select
                        value={debitForm.tax_rate}
                        onChange={(e) => setDebitForm({ ...debitForm, tax_rate: Number(e.target.value) })}
                        className="w-full text-xs px-2 py-1.5 rounded border border-slate-300 bg-white text-slate-800 font-mono text-center"
                      >
                        <option value={0}>0%</option>
                        <option value={5}>5%</option>
                        <option value={12}>12%</option>
                        <option value={18}>18%</option>
                        <option value={28}>28%</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-700">
                      ₹{taxAmt.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-extrabold text-blue-700 text-sm">
                      ₹{totalDebit.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bottom summary and notes */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
              <div className="md:col-span-7">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Adjustment Remarks</label>
                <textarea
                  rows={3}
                  value={debitForm.notes}
                  onChange={(e) => setDebitForm({ ...debitForm, notes: e.target.value })}
                  className="w-full text-xs p-3 rounded-lg border border-slate-300 bg-white text-slate-800"
                />
              </div>
              <div className="md:col-span-5 bg-blue-50/60 p-4 rounded-xl border border-blue-200 text-xs space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Taxable Value:</span>
                  <span className="font-mono font-bold text-slate-900">₹{debitForm.taxable_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST Adjustment ({debitForm.tax_rate}%):</span>
                  <span className="font-mono font-bold text-blue-700">₹{taxAmt.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t-2 border-blue-200 flex justify-between items-center text-sm font-black text-slate-900">
                  <span>Total Debit Value:</span>
                  <span className="font-mono text-base text-blue-600">
                    ₹{totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Terms & Statutory Checklist */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Vendor Compliance Checklist
            </span>
            <div className="space-y-2 pt-2">
              {debitTerms.map((term) => (
                <div key={term.id} className="flex items-center space-x-2.5">
                  <input
                    type="checkbox"
                    checked={term.checked}
                    onChange={() => setDebitTerms(prev => prev.map(t => t.id === term.id ? { ...t, checked: !t.checked } : t))}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                  />
                  <span className={`text-xs ${term.checked ? 'text-slate-700' : 'text-slate-400 line-through'}`}>{term.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreatingDebit(false)}
              className="px-5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-600/30 cursor-pointer"
            >
              Save & Issue Debit Note
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ----------------------------------------------------
  // FULL PAGE VIEW: VIEW NOTE
  // ----------------------------------------------------
  if (viewNote) {
    const isCredit = viewType === 'credit';
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setViewNote(null)}
              className="inline-flex items-center px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5 text-slate-500" />
              <span>Back to Note Register</span>
            </button>
            <div className="h-5 w-px bg-slate-300 hidden sm:block" />
            <span className="text-xs text-slate-500 font-mono hidden sm:inline">
              Billing / {isCredit ? 'Credit Notes' : 'Debit Notes'} / {isCredit ? viewNote.credit_note_number : viewNote.debit_note_number}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              <span>Print {isCredit ? 'Credit Note' : 'Debit Note'}</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
          <div className="flex flex-col md:flex-row justify-between gap-6 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center space-x-2">
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                  isCredit ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {isCredit ? viewNote.credit_note_number : viewNote.debit_note_number}
                </span>
                <StatusBadge status={viewNote.status} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-2">
                {isCredit ? (viewNote.customer_name || 'Client') : (viewNote.supplier_name || 'Vendor')}
              </h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Linked Ref: {isCredit ? viewNote.original_invoice_number : viewNote.original_invoice_reference}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 text-xs text-right">
              <div>
                <span className="text-slate-400 block font-semibold">Note Date</span>
                <span className="font-mono font-bold text-slate-900">{isCredit ? viewNote.credit_note_date : viewNote.debit_note_date}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Reason</span>
                <span className="font-semibold text-slate-700">{viewNote.reason}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Tax Reversal</span>
                <span className="font-mono font-bold text-slate-900">₹{Number(viewNote.total_tax).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Total Adjustment</span>
                <span className={`font-mono font-extrabold text-sm ${isCredit ? 'text-rose-600' : 'text-blue-700'}`}>
                  ₹{Number(viewNote.total_amount).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
            <FileText className="w-7 h-7 text-blue-600 mr-2.5" />
            Credit Notes & Debit Notes
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage official GST Credit Notes (sales returns, price revisions) and Debit Notes (vendor price corrections).
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {activeTab === 'credit' ? (
            <button
              onClick={() => setIsCreatingCredit(true)}
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 shadow-sm shadow-rose-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Issue Credit Note
            </button>
          ) : (
            <button
              onClick={() => setIsCreatingDebit(true)}
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-sm shadow-blue-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Issue Debit Note
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('credit')}
          className={`pb-3 px-4 text-xs font-bold flex items-center transition-all border-b-2 cursor-pointer ${
            activeTab === 'credit'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4 mr-1.5 text-rose-500" />
          <span>Credit Notes (Sales Returns)</span>
          <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] bg-rose-50 text-rose-700 font-mono font-bold">
            {creditNotes.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('debit')}
          className={`pb-3 px-4 text-xs font-bold flex items-center transition-all border-b-2 cursor-pointer ${
            activeTab === 'debit'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 mr-1.5 text-blue-500" />
          <span>Debit Notes (Purchases / Expenses)</span>
          <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] bg-blue-50 text-blue-700 font-mono font-bold">
            {debitNotes.length}
          </span>
        </button>
      </div>

      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mr-2" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-xs underline text-emerald-700">Dismiss</button>
        </div>
      )}

      {/* Tables */}
      {activeTab === 'credit' ? (
        <DataTable<CreditNote>
          data={creditNotes}
          columns={creditColumns}
          searchPlaceholder="Search credit notes by number, customer, invoice ref..."
        />
      ) : (
        <DataTable<DebitNote>
          data={debitNotes}
          columns={debitColumns}
          searchPlaceholder="Search debit notes by number, supplier, bill ref..."
        />
      )}
    </div>
  );
};
