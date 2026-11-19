import React, { useState, useEffect, useMemo } from 'react';
import {
  Receipt, Plus, DollarSign, Eye, Download, CheckCircle2,
  Calendar, Building2, CreditCard, ArrowRight, Printer, AlertCircle,
  Filter, ArrowLeft, Edit3, Trash2, Shield, Clock, FileText, QrCode,
  Truck, Check, Send, Copy
} from 'lucide-react';
import { api } from '../../api/client';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable, ColumnDef } from '../../components/common/DataTable';
import { useRealtime } from '../../context/RealtimeContext';
import type { Invoice, Customer, ProductService, HSNMaster, SACMaster, CompanyProfile } from '../../types';
import { numberToIndianWords } from '../../utils/currencyWords';

interface InvoiceLineItem {
  product: string;
  item_name: string;
  description?: string;
  hsn_sac: string;
  quantity: number | '';
  unit: string;
  unit_price: number | '';
  discount_type: 'pct' | 'amount';
  discount_value: number | '';
  tax_rate: number;
  is_custom?: boolean;
}

interface TermItem {
  id: string;
  text: string;
  checked: boolean;
}

const DEFAULT_INVOICE_TERMS: TermItem[] = [
  { id: '1', text: 'Payment must be made according to the agreed payment terms within 15 calendar days.', checked: true },
  { id: '2', text: 'Interest @ 18% per annum will be charged on all delayed remittances beyond due date.', checked: true },
  { id: '3', text: 'Goods once sold will only be accepted in accordance with warranty & return policy within 7 days.', checked: true },
  { id: '4', text: 'All disputes are subject to the exclusive jurisdiction of the courts of Bhubaneswar, Odisha.', checked: true },
  { id: '5', text: 'We declare that this invoice shows the actual price of the goods/services and that all particulars are true.', checked: true },
];

const DEFAULT_INVOICES: any[] = [
  {
    id: 'inv-001',
    invoice_number: 'INV/2026-27/00042',
    customer: 'cust-001',
    customer_name: 'Odisha Power Generation Corp Ltd',
    customer_gstin: '21AAAC01234F1Z5',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 86400000 * 15).toISOString().split('T')[0],
    subtotal: 150000,
    cgst_amount: 13500,
    sgst_amount: 13500,
    igst_amount: 0,
    total_tax: 27000,
    grand_total: 177000,
    amount_paid: 177000,
    balance_due: 0,
    status: 'paid',
    place_of_supply: 'Odisha',
    is_interstate: false,
    items: [
      {
        id: 'item-1',
        description: 'Enterprise ERP Implementation & Database Migration License',
        hsn_sac: '998314',
        quantity: 1,
        unit_price: 150000,
        tax_rate: 18,
        tax_amount: 27000,
        total_amount: 177000
      }
    ]
  },
  {
    id: 'inv-002',
    invoice_number: 'INV/2026-27/00043',
    customer: 'cust-002',
    customer_name: 'Paradip Port Trust Logistics',
    customer_gstin: '21AAAGP2233M1ZD',
    invoice_date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
    due_date: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0],
    subtotal: 85000,
    cgst_amount: 7650,
    sgst_amount: 7650,
    igst_amount: 0,
    total_tax: 15300,
    grand_total: 100300,
    amount_paid: 50000,
    balance_due: 50300,
    status: 'partially_paid',
    place_of_supply: 'Odisha',
    is_interstate: false,
    items: [
      {
        id: 'item-2',
        description: 'Custom Port Logistics & Weighbridge API Integration Modules',
        hsn_sac: '998313',
        quantity: 1,
        unit_price: 85000,
        tax_rate: 18,
        tax_amount: 15300,
        total_amount: 100300
      }
    ]
  }
];

export const InvoicesPage: React.FC = () => {
  const { emitEvent } = useRealtime();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<ProductService[]>([]);
  const [loading, setLoading] = useState(true);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Navigation & View States
  const [isCreating, setIsCreating] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

  // Modals for Actions
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // E-Way Bill Modal
  const [ewayModalOpen, setEwayModalOpen] = useState(false);
  const [ewayData, setEwayData] = useState({
    transporter_name: 'VRL Express Logistics',
    transporter_id: '29AAACV2026P1Z3',
    vehicle_number: 'OD-02-AK-9042',
    distance_km: 240,
    transport_mode: 'road',
  });

  // Payment Form
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<string>('bank_transfer');
  const [referenceNumber, setReferenceNumber] = useState<string>('');

  // Full-Page New Invoice Form State (matching screenshot)
  const [newInvCustomer, setNewInvCustomer] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [newInvDueDate, setNewInvDueDate] = useState(
    new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
  );
  const [newInvPlaceOfSupply, setNewInvPlaceOfSupply] = useState('Odisha');
  const [newInvIsRCM, setNewInvIsRCM] = useState(false);
  const [newInvNotes, setNewInvNotes] = useState('');
  const [termsList, setTermsList] = useState<TermItem[]>(DEFAULT_INVOICE_TERMS);
  const [hsnList, setHsnList] = useState<HSNMaster[]>([]);
  const [sacList, setSacList] = useState<SACMaster[]>([]);

  const [newInvItems, setNewInvItems] = useState<InvoiceLineItem[]>([
    {
      product: '',
      item_name: '',
      description: '',
      hsn_sac: '',
      quantity: 1,
      unit: 'NOS',
      unit_price: '',
      discount_type: 'pct',
      discount_value: '',
      tax_rate: 18,
      is_custom: false,
    },
  ]);

  // Edit Invoice Form
  const [editFormData, setEditFormData] = useState({
    due_date: '',
    status: 'issued',
    place_of_supply: '',
    notes: '',
  });

  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    setLoading(true);
    try {
      const [invRes, custRes, prodRes, hRes, sRes, profRes] = await Promise.all([
        api.getInvoices(),
        api.getCustomers(),
        api.getProducts(),
        api.getHSNMaster(),
        api.getSACMaster(),
        api.getCompanyProfile().catch(() => null),
      ]);
      const invList = (invRes.results || (Array.isArray(invRes) ? invRes : []));
      setInvoices(invList.length > 0 ? invList : DEFAULT_INVOICES);
      if (profRes && profRes.company_name) {
        setCompanyProfile(profRes);
      }
      const cList = custRes.results || custRes || [];
      setCustomers(cList);
      if (cList.length > 0 && !newInvCustomer) {
        setNewInvCustomer(cList[0].id);
        setNewInvPlaceOfSupply(cList[0].state || 'Odisha');
      }
      setProducts(prodRes.results || prodRes || []);
      setHsnList(hRes?.results || hRes || []);
      setSacList(sRes?.results || sRes || []);

      // Auto-generate next invoice series
      const nextInvNum = `INV/2026-27/${String(invList.length + 42).padStart(5, '0')}`;
      setInvoiceNumber(nextInvNum);
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

  // Add Item Line
  const handleAddItem = () => {
    setNewInvItems([
      ...newInvItems,
      {
        product: '',
        item_name: '',
        description: '',
        hsn_sac: '',
        quantity: 1,
        unit: 'NOS',
        unit_price: '',
        discount_type: 'pct',
        discount_value: '',
        tax_rate: 18,
        is_custom: false,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (newInvItems.length <= 1) return;
    setNewInvItems(newInvItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...newInvItems];
    if (field === 'product') {
      const sel = products.find((p) => p.id === value);
      if (sel) {
        updated[index] = {
          ...updated[index],
          product: sel.id,
          item_name: sel.name,
          hsn_sac: (sel as any).hsn_code || sel.hsn_sac || '',
          unit: sel.unit || 'NOS',
          unit_price: Number((sel as any).selling_price || sel.unit_price || 0) || '',
          tax_rate: Number(sel.tax_rate || 18),
          is_custom: false,
        };
      } else {
        updated[index] = {
          ...updated[index],
          product: '',
          item_name: '',
          hsn_sac: '',
          unit_price: '',
        };
      }
    } else if (field === 'hsn_sac') {
      const cleanHsn = String(value).trim().toLowerCase();
      const matchedHsn = hsnList.find((h) => h.hsn_code.toLowerCase() === cleanHsn);
      const matchedSac = sacList.find((s) => s.sac_code.toLowerCase() === cleanHsn);
      const matched = matchedHsn || matchedSac;
      if (matched) {
        updated[index] = {
          ...updated[index],
          hsn_sac: value,
          tax_rate: Number(matched.applicable_gst_rate),
        };
      } else {
        updated[index] = { ...updated[index], hsn_sac: value };
      }
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setNewInvItems(updated);
  };

  // Customer selection change auto sets Place of Supply
  const handleCustomerChange = (custId: string) => {
    setNewInvCustomer(custId);
    const c = customers.find((item) => item.id === custId);
    if (c && c.state) {
      setNewInvPlaceOfSupply(c.state);
    }
  };

  // Terms Checklist Handlers
  const handleToggleTerm = (id: string) => {
    setTermsList((prev) =>
      prev.map((t) => (t.id === id ? { ...t, checked: !t.checked } : t))
    );
  };

  const handleAddCustomTerm = () => {
    const newId = String(Date.now());
    setTermsList((prev) => [
      ...prev,
      { id: newId, text: 'Custom commercial warranty & service terms.', checked: true },
    ]);
  };

  const handleTermTextChange = (id: string, text: string) => {
    setTermsList((prev) =>
      prev.map((t) => (t.id === id ? { ...t, text } : t))
    );
  };

  // Real-time calculation engine
  const isIntraState = useMemo(() => {
    return newInvPlaceOfSupply.toLowerCase().includes('odisha') || newInvPlaceOfSupply.includes('21');
  }, [newInvPlaceOfSupply]);

  const calculationSummary = useMemo(() => {
    let grossSubtotal = 0;
    let totalDiscount = 0;
    let taxable = 0;
    let totalTax = 0;

    newInvItems.forEach((it) => {
      const qty = Number(it.quantity || 0);
      const rate = Number(it.unit_price || 0);
      const gross = qty * rate;
      const discVal = Number(it.discount_value || 0);
      const disc = it.discount_type === 'amount'
        ? Math.min(gross, discVal)
        : gross * (discVal / 100);
      const lineTaxable = Math.max(0, gross - disc);
      const lineTax = lineTaxable * (Number(it.tax_rate || 0) / 100);

      grossSubtotal += gross;
      totalDiscount += disc;
      taxable += lineTaxable;
      totalTax += lineTax;
    });

    const cgst = isIntraState ? totalTax / 2 : 0;
    const sgst = isIntraState ? totalTax / 2 : 0;
    const igst = !isIntraState ? totalTax : 0;
    const cess = 0;
    const exactGrand = taxable + totalTax;
    const roundedGrand = Math.round(exactGrand);
    const roundOff = roundedGrand - exactGrand;

    return {
      grossSubtotal,
      discount: totalDiscount,
      taxable,
      cgst,
      sgst,
      igst,
      cess,
      roundOff,
      grandTotal: roundedGrand,
    };
  }, [newInvItems, isIntraState]);

  // CREATE INVOICE (SUBMIT)
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvCustomer) {
      alert('Please select a customer.');
      return;
    }

    try {
      const activeTerms = termsList.filter((t) => t.checked).map((t) => t.text).join('\n');
      const payload = {
        customer: newInvCustomer,
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate,
        due_date: newInvDueDate,
        place_of_supply: newInvPlaceOfSupply,
        is_rcm: newInvIsRCM,
        notes: newInvNotes ? `${newInvNotes}\n\nTerms & Conditions:\n${activeTerms}` : `Terms & Conditions:\n${activeTerms}`,
        status: 'issued',
        items: newInvItems.map((it) => {
          const qty = Number(it.quantity || 1);
          const rate = Number(it.unit_price || 0);
          const gross = qty * rate;
          const discVal = Number(it.discount_value || 0);
          const discPct = it.discount_type === 'amount'
            ? (gross > 0 ? (discVal / gross) * 100 : 0)
            : discVal;

          return {
            product: it.product || undefined,
            item_name: it.item_name || (products.find((p) => p.id === it.product)?.name) || 'Service Item',
            description: it.description || '',
            hsn_sac: it.hsn_sac || '998314',
            quantity: qty,
            unit: it.unit || 'NOS',
            unit_price: rate,
            discount_pct: Number(discPct.toFixed(2)),
            tax_rate: Number(it.tax_rate || 18),
          };
        }),
      };

      const created = await api.createInvoice(payload);
      setIsCreating(false);
      showToast('Tax Invoice generated and automatically posted to General Ledger & Stock Ledger.');
      emitEvent('billing.invoice_created', 'New Tax Invoice Issued', `Tax Invoice ${invoiceNumber} posted with GST breakdown.`, 'success');
      loadBillingData();
      setViewInvoice(created);
    } catch (err: any) {
      alert(err.message || 'Invoice creation failed');
    }
  };

  // OPEN EDIT MODAL
  const handleOpenEdit = (inv: Invoice) => {
    setEditingInvoice(inv);
    setEditFormData({
      due_date: inv.due_date || '',
      status: inv.status || 'issued',
      place_of_supply: inv.place_of_supply || 'Odisha',
      notes: inv.notes || '',
    });
    setEditModalOpen(true);
  };

  // UPDATE INVOICE
  const handleUpdateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;
    try {
      const updated = await api.updateInvoice(editingInvoice.id, editFormData);
      setEditModalOpen(false);
      showToast(`Invoice ${editingInvoice.invoice_number} updated successfully!`);
      emitEvent('billing.invoice_updated', 'Invoice Modified', `Updated terms on ${editingInvoice.invoice_number}`, 'info');

      setInvoices((prev) =>
        prev.map((item) => (item.id === editingInvoice.id ? { ...item, ...updated, ...editFormData } : item))
      );
      if (viewInvoice && viewInvoice.id === editingInvoice.id) {
        setViewInvoice({ ...viewInvoice, ...updated, ...editFormData });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update invoice');
    }
  };

  // DELETE INVOICE
  const handleDeleteInvoice = async (inv: Invoice) => {
    if (!confirm(`Are you sure you want to permanently delete invoice ${inv.invoice_number} (₹${Number(inv.total_amount).toLocaleString('en-IN')})?`)) {
      return;
    }
    try {
      await api.deleteInvoice(inv.id);
      showToast(`Invoice ${inv.invoice_number} deleted from accounts register.`);
      emitEvent('billing.invoice_deleted', 'Invoice Deleted', `Deleted ${inv.invoice_number} by Super Admin`, 'warning');

      setInvoices((prev) => prev.filter((item) => item.id !== inv.id));
      if (viewInvoice && viewInvoice.id === inv.id) {
        setViewInvoice(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete invoice');
    }
  };

  // RECORD PAYMENT
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    try {
      await api.recordPayment({
        invoice: selectedInvoice.id,
        amount: paymentAmount,
        payment_mode: paymentMode,
        transaction_reference: referenceNumber,
      });
      setPaymentModalOpen(false);
      showToast(`Payment of ₹${paymentAmount.toLocaleString('en-IN')} recorded successfully.`);
      emitEvent('billing.payment_received', 'Payment Collected', `₹${paymentAmount.toLocaleString('en-IN')} received for ${selectedInvoice.invoice_number}`, 'success');
      loadBillingData();
      if (viewInvoice && viewInvoice.id === selectedInvoice.id) {
        const newPaid = Number(viewInvoice.paid_amount || 0) + Number(paymentAmount);
        const newBal = Math.max(0, Number(viewInvoice.total_amount) - newPaid);
        setViewInvoice({
          ...viewInvoice,
          paid_amount: newPaid,
          balance_amount: newBal,
          status: newBal === 0 ? 'paid' : 'partially_paid',
        });
      }
    } catch (err: any) {
      alert(err.message || 'Payment recording failed');
    }
  };

  // GENERATE E-INVOICE
  const handleGenerateEInvoice = async (inv: Invoice) => {
    try {
      const res = await api.generateEInvoice(inv.id);
      showToast('E-Invoice IRN and Signed QR Code successfully generated from IRP Portal!');
      emitEvent('billing.e_invoice_generated', 'E-Invoice IRN Generated', `IRN: ${res.irn.substring(0, 16)}...`, 'success');
      loadBillingData();
      if (viewInvoice && viewInvoice.id === inv.id) {
        setViewInvoice({
          ...viewInvoice,
          is_e_invoiced: true,
          irn: res.irn,
          ack_no: res.ack_no,
          ack_date: res.ack_date,
        });
      }
    } catch (err: any) {
      alert(err.message || 'E-Invoice generation failed');
    }
  };

  // GENERATE E-WAY BILL
  const handleGenerateEWayBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewInvoice) return;
    try {
      const res = await api.generateEWayBill(viewInvoice.id, ewayData);
      setEwayModalOpen(false);
      showToast(`E-Way Bill ${res.eway_bill_number} generated successfully!`);
      emitEvent('billing.eway_bill_generated', 'E-Way Bill Issued', `EWB: ${res.eway_bill_number}`, 'success');
      loadBillingData();
      setViewInvoice({
        ...viewInvoice,
        eway_bill_number: res.eway_bill_number,
        eway_bill_date: res.eway_bill_date,
        eway_bill_valid_until: res.valid_until,
      });
    } catch (err: any) {
      alert(err.message || 'E-Way Bill generation failed');
    }
  };

  const filteredInvoices = useMemo(() => {
    if (statusFilter === 'all') return invoices;
    return invoices.filter((inv) => inv.status === statusFilter);
  }, [invoices, statusFilter]);

  // TABLE COLUMNS
  const columns: ColumnDef<Invoice>[] = [
    {
      key: 'invoice_number',
      header: 'Invoice #',
      render: (inv) => <span className="font-mono font-bold text-slate-900">{inv.invoice_number}</span>,
    },
    {
      key: 'customer_name',
      header: 'Customer',
      render: (inv) => (
        <div>
          <span className="font-bold text-slate-900 block">{inv.customer_name}</span>
          <span className="text-[11px] text-slate-400 font-mono">{inv.customer_gstin || 'Unregistered'}</span>
        </div>
      ),
    },
    {
      key: 'invoice_date',
      header: 'Invoice Date',
      render: (inv) => <span className="font-mono text-slate-600 text-xs">{inv.invoice_date}</span>,
    },
    {
      key: 'due_date',
      header: 'Due Date',
      render: (inv) => <span className="font-mono text-slate-600 text-xs">{inv.due_date}</span>,
    },
    {
      key: 'subtotal',
      header: 'Taxable (₹)',
      accessor: (inv) => Number(inv.subtotal),
      render: (inv) => <span className="font-mono text-slate-700">₹{Number(inv.subtotal).toLocaleString('en-IN')}</span>,
    },
    {
      key: 'total_amount',
      header: 'Total Amount',
      accessor: (inv) => Number(inv.total_amount),
      render: (inv) => (
        <span className="font-mono font-extrabold text-slate-900 text-sm">
          ₹{Number(inv.total_amount).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'balance_amount',
      header: 'Balance Due',
      accessor: (inv) => Number(inv.balance_amount),
      render: (inv) => (
        <span className="font-mono font-extrabold text-rose-600">
          ₹{Number(inv.balance_amount).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (inv) => <StatusBadge status={inv.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      sortable: false,
      render: (inv) => (
        <div className="flex items-center justify-end space-x-1.5">
          <button
            onClick={() => setViewInvoice(inv)}
            className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200/80 transition-colors cursor-pointer"
            title="View Full Tax Invoice"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenEdit(inv)}
            className="p-1.5 rounded-lg text-amber-600 hover:text-amber-800 hover:bg-amber-50 border border-amber-200/80 transition-colors cursor-pointer"
            title="Edit Details"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteInvoice(inv)}
            className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200/80 transition-colors cursor-pointer"
            title="Delete Invoice"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {Number(inv.balance_amount) > 0 && (
            <button
              onClick={() => {
                setSelectedInvoice(inv);
                setPaymentAmount(Number(inv.balance_amount));
                setPaymentModalOpen(true);
              }}
              className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 transition-colors cursor-pointer text-xs"
            >
              Pay
            </button>
          )}
        </div>
      ),
    },
  ];

  // ----------------------------------------------------
  // FULL PAGE VIEW: NEW TAX INVOICE (Matching media_1794806738467_07640226.png)
  // ----------------------------------------------------
  if (isCreating) {
    return (
      <div className="space-y-6 pb-20 animate-in fade-in duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">New Tax Invoice</h1>
          </div>
          <button
            type="button"
            onClick={() => setIsCreating(false)}
            className="inline-flex items-center px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            <span>Back</span>
          </button>
        </div>

        <form onSubmit={handleCreateInvoice} className="space-y-6">
          {/* Card 1: Invoice Parameters */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Invoice Parameters
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Customer *</label>
                <select
                  value={newInvCustomer}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  required
                  className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Find customer name to search...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name || c.name} {c.gstin ? `(${c.gstin})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Invoice Number *</label>
                <input
                  type="text"
                  required
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full text-xs font-mono font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Invoice Date *</label>
                <input
                  type="date"
                  required
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full text-xs font-mono font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Due Date *</label>
                <input
                  type="date"
                  required
                  value={newInvDueDate}
                  onChange={(e) => setNewInvDueDate(e.target.value)}
                  className="w-full text-xs font-mono font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Place of Supply (State) *</label>
                <select
                  value={newInvPlaceOfSupply}
                  onChange={(e) => setNewInvPlaceOfSupply(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Odisha">Odisha (21) - Intra-State CGST+SGST</option>
                  <option value="Maharashtra">Maharashtra (27) - Inter-State IGST</option>
                  <option value="Karnataka">Karnataka (29) - Inter-State IGST</option>
                  <option value="Delhi">Delhi (07) - Inter-State IGST</option>
                  <option value="West Bengal">West Bengal (19) - Inter-State IGST</option>
                  <option value="Telangana">Telangana (36) - Inter-State IGST</option>
                </select>
              </div>

              <div className="flex items-center pt-5 space-x-2">
                <input
                  type="checkbox"
                  id="inv_rcm"
                  checked={newInvIsRCM}
                  onChange={(e) => setNewInvIsRCM(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="inv_rcm" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Subject to Reverse Charge Mechanism (RCM)
                </label>
              </div>
            </div>
          </div>

          {/* Card 2: Items Grid */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Items Grid
            </span>

            {/* Table with Solid Dark Header */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Product / Description *</th>
                    <th className="py-2.5 px-3">HSN / SAC</th>
                    <th className="py-2.5 px-3 text-center">Qty *</th>
                    <th className="py-2.5 px-3 text-right">Rate *</th>
                    <th className="py-2.5 px-3 text-right">Disc</th>
                    <th className="py-2.5 px-3 text-center">Tax %</th>
                    <th className="py-2.5 px-3 text-right">Total Amount (₹)</th>
                    <th className="py-2.5 px-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {newInvItems.map((item, idx) => {
                    const qty = Number(item.quantity || 0);
                    const rate = Number(item.unit_price || 0);
                    const gross = qty * rate;
                    const discVal = Number(item.discount_value || 0);
                    const disc = item.discount_type === 'amount'
                      ? Math.min(gross, discVal)
                      : gross * (discVal / 100);
                    const taxable = Math.max(0, gross - disc);
                    const tax = taxable * (Number(item.tax_rate || 0) / 100);
                    const lineTotal = taxable + tax;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-3 align-top min-w-[240px]">
                          {item.is_custom ? (
                            <div className="flex items-center space-x-1.5">
                              <input
                                type="text"
                                required
                                placeholder="Type product or service description *"
                                value={item.item_name}
                                onChange={(e) => handleItemChange(idx, 'item_name', e.target.value)}
                                className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  handleItemChange(idx, 'is_custom', false);
                                  handleItemChange(idx, 'product', '');
                                  handleItemChange(idx, 'item_name', '');
                                }}
                                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline px-1 cursor-pointer whitespace-nowrap"
                              >
                                Select List
                              </button>
                            </div>
                          ) : (
                            <select
                              value={item.product}
                              onChange={(e) => {
                                if (e.target.value === '__custom__') {
                                  handleItemChange(idx, 'is_custom', true);
                                  handleItemChange(idx, 'product', '');
                                  handleItemChange(idx, 'item_name', '');
                                } else {
                                  handleItemChange(idx, 'product', e.target.value);
                                }
                              }}
                              className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                            >
                              <option value="">-- Select Product --</option>
                              <option value="__custom__">+ Custom Item / Manual Entry...</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} {p.hsn_sac ? `(${p.hsn_sac})` : ''} - ₹{Number((p as any).selling_price || p.unit_price || 0).toLocaleString('en-IN')}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="py-2.5 px-3 align-top w-28">
                          <input
                            type="text"
                            list="inv-hsn-sac-list"
                            placeholder="HSN/SAC"
                            value={item.hsn_sac}
                            onChange={(e) => handleItemChange(idx, 'hsn_sac', e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-300 bg-white text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <datalist id="inv-hsn-sac-list">
                            {hsnList.map((h) => (
                              <option key={h.id} value={h.hsn_code}>
                                {h.description} ({h.applicable_gst_rate}% GST)
                              </option>
                            ))}
                            {sacList.map((s) => (
                              <option key={s.id} value={s.sac_code}>
                                {s.description} ({s.applicable_gst_rate}% GST)
                              </option>
                            ))}
                          </datalist>
                        </td>
                        <td className="py-2.5 px-3 align-top w-20 text-center">
                          <input
                            type="number"
                            min="1"
                            required
                            placeholder="1"
                            value={item.quantity === '' ? '' : item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
                            className="w-full text-xs px-2 py-1.5 rounded border border-slate-300 bg-white text-slate-800 font-mono text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-2.5 px-3 align-top w-28 text-right">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            placeholder="0.00"
                            value={item.unit_price === '' ? '' : item.unit_price}
                            onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-300 bg-white text-slate-800 font-mono text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-2.5 px-3 align-top w-32 text-right">
                          <div className="flex items-center rounded border border-slate-300 bg-white overflow-hidden focus-within:ring-1 focus-within:ring-blue-500">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              value={item.discount_value === '' ? '' : item.discount_value}
                              onChange={(e) => {
                                const val = e.target.value === '' ? '' : Math.max(0, Number(e.target.value));
                                handleItemChange(idx, 'discount_value', val);
                              }}
                              className="w-full text-xs px-2 py-1.5 bg-transparent text-slate-800 font-mono text-right outline-none min-w-0"
                            />
                            <select
                              value={item.discount_type || 'pct'}
                              onChange={(e) => handleItemChange(idx, 'discount_type', e.target.value)}
                              className="text-xs font-bold px-1.5 py-1.5 bg-slate-100 border-l border-slate-300 text-slate-700 outline-none cursor-pointer hover:bg-slate-200 shrink-0"
                              title="Discount Mode: Percentage (%) or Fixed Amount (₹)"
                            >
                              <option value="pct">%</option>
                              <option value="amount">₹</option>
                            </select>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 align-top w-24 text-center">
                          <select
                            value={item.tax_rate}
                            onChange={(e) => handleItemChange(idx, 'tax_rate', Number(e.target.value))}
                            className="w-full text-xs px-2 py-1.5 rounded border border-slate-300 bg-white text-slate-800 font-mono text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value={0}>0%</option>
                            <option value={5}>5%</option>
                            <option value={12}>12%</option>
                            <option value={18}>18%</option>
                            <option value={28}>28%</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-3 align-top text-right font-mono font-bold text-slate-900 whitespace-nowrap pt-3">
                          ₹{lineTotal.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-2 align-top text-center pt-2">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            disabled={newInvItems.length <= 1}
                            className="p-1 rounded bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Delete Line"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Left: Add Item + Notes / Right: Calculation Box */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
              <div className="md:col-span-7 space-y-4">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1 text-slate-500" />
                  Add Item
                </button>

                <div>
                  <textarea
                    rows={3}
                    placeholder="Enter invoice notes or customer remarks..."
                    value={newInvNotes}
                    onChange={(e) => setNewInvNotes(e.target.value)}
                    className="w-full text-xs p-3 rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Right Summary Table */}
              <div className="md:col-span-5 bg-slate-50/80 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Subtotal:</span>
                  <span className="font-mono font-bold text-slate-900">₹{calculationSummary.grossSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Discount:</span>
                  <span className="font-mono font-bold">₹{calculationSummary.discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>CGST:</span>
                  <span className="font-mono">₹{calculationSummary.cgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>SGST:</span>
                  <span className="font-mono">₹{calculationSummary.sgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>IGST:</span>
                  <span className="font-mono">₹{calculationSummary.igst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Cess:</span>
                  <span className="font-mono">₹{calculationSummary.cess.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Round Off:</span>
                  <span className="font-mono">₹{calculationSummary.roundOff.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t-2 border-slate-300 flex justify-between items-center text-sm font-black text-slate-900">
                  <span>Grand Total:</span>
                  <span className="font-mono text-base text-blue-600">
                    ₹{calculationSummary.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Terms & Conditions */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-1">
              <div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Terms & Conditions
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Select the terms & conditions to include in this invoice. Unchecked terms will not be displayed on the printable tax invoice.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddCustomTerm}
                className="inline-flex items-center px-3 py-1 rounded-lg border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1 text-slate-500" />
                Add Term
              </button>
            </div>

            <div className="space-y-2 pt-2">
              {termsList.map((term) => (
                <div key={term.id} className="flex items-center space-x-3 p-2 bg-slate-50/70 rounded-lg border border-slate-200">
                  <input
                    type="checkbox"
                    id={`inv-term-${term.id}`}
                    checked={term.checked}
                    onChange={() => handleToggleTerm(term.id)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={term.text}
                    onChange={(e) => handleTermTextChange(term.id, e.target.value)}
                    className="flex-1 text-xs px-2 py-1 bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:ring-0 text-slate-800"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              Save & Post Tax Invoice
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ----------------------------------------------------
  // FULL PAGE TAX INVOICE DOSSIER
  // ----------------------------------------------------
  if (viewInvoice) {
    const isInterState = !viewInvoice.is_intra_state;
    const upiUri = `upi://pay?pa=${encodeURIComponent(companyProfile?.upi_id || 'odiaserp@hdfcbank')}&pn=${encodeURIComponent(companyProfile?.company_name || 'Odias+ERP+Technologies')}&am=${viewInvoice.balance_amount}&cu=INR`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(upiUri)}`;

    // Group items by HSN/SAC for statutory tax table
    const invoiceItems = viewInvoice.items && viewInvoice.items.length > 0 ? viewInvoice.items : [
      {
        item_name: 'Odias Enterprise ERP Cloud Implementation',
        hsn_sac: '998314',
        quantity: 1,
        unit: 'NOS',
        unit_price: Number(viewInvoice.subtotal),
        discount_amount: 0,
        taxable_value: Number(viewInvoice.subtotal),
        tax_rate: 18,
        tax_amount: Number(viewInvoice.total_tax),
        total: Number(viewInvoice.total_amount),
      }
    ];

    const hsnMap = new Map<string, {
      hsn_sac: string;
      taxable: number;
      rate: number;
      cgstRate: number;
      cgstAmt: number;
      sgstRate: number;
      sgstAmt: number;
      igstRate: number;
      igstAmt: number;
      totalTax: number;
    }>();

    const isIntra = viewInvoice.is_intra_state;

    invoiceItems.forEach((it: any) => {
      const code = String(it.hsn_sac || '998314').trim();
      const taxable = Number(it.taxable_value ?? (Number(it.unit_price || 0) * Number(it.quantity || 1)));
      const rate = Number(it.tax_rate ?? 18);
      const taxAmt = Number(it.tax_amount ?? (taxable * rate / 100));

      const cgstRate = isIntra ? rate / 2 : 0;
      const cgstAmt = isIntra ? taxAmt / 2 : 0;
      const sgstRate = isIntra ? rate / 2 : 0;
      const sgstAmt = isIntra ? taxAmt / 2 : 0;
      const igstRate = !isIntra ? rate : 0;
      const igstAmt = !isIntra ? taxAmt : 0;

      if (!hsnMap.has(code)) {
        hsnMap.set(code, {
          hsn_sac: code,
          taxable,
          rate,
          cgstRate,
          cgstAmt,
          sgstRate,
          sgstAmt,
          igstRate,
          igstAmt,
          totalTax: taxAmt,
        });
      } else {
        const cur = hsnMap.get(code)!;
        cur.taxable += taxable;
        cur.cgstAmt += cgstAmt;
        cur.sgstAmt += sgstAmt;
        cur.igstAmt += igstAmt;
        cur.totalTax += taxAmt;
      }
    });

    const invoiceHsnBreakdown = Array.from(hsnMap.values());

    return (
      <div className="space-y-6 animate-in fade-in duration-200 pb-16">
        {/* Navigation & Actions Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setViewInvoice(null)}
              className="inline-flex items-center px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5 text-slate-500" />
              <span>Back to Invoices Register</span>
            </button>
            <div className="h-5 w-px bg-slate-300 hidden sm:block" />
            <span className="text-xs text-slate-500 font-mono hidden sm:inline">
              Billing / Tax Invoices / {viewInvoice.invoice_number}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!viewInvoice.is_e_invoiced && (
              <button
                onClick={() => handleGenerateEInvoice(viewInvoice)}
                className="inline-flex items-center px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 mr-1.5" />
                <span>Generate E-Invoice</span>
              </button>
            )}

            {!viewInvoice.eway_bill_number && (
              <button
                onClick={() => setEwayModalOpen(true)}
                className="inline-flex items-center px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5 mr-1.5" />
                <span>Generate E-Way Bill</span>
              </button>
            )}

            {Number(viewInvoice.balance_amount) > 0 && (
              <button
                onClick={() => {
                  setSelectedInvoice(viewInvoice);
                  setPaymentAmount(Number(viewInvoice.balance_amount));
                  setPaymentModalOpen(true);
                }}
                className="inline-flex items-center px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <DollarSign className="w-3.5 h-3.5 mr-1.5" />
                <span>Record Payment</span>
              </button>
            )}

            <button
              onClick={() => handleOpenEdit(viewInvoice)}
              className="inline-flex items-center px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs border border-amber-200 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1.5" />
              <span>Edit</span>
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              <span>Print Tax Invoice</span>
            </button>
          </div>
        </div>

        {/* E-Invoice & E-Way Bill Banner */}
        {(viewInvoice.is_e_invoiced || viewInvoice.eway_bill_number) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {viewInvoice.is_e_invoiced && (
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 flex items-start space-x-3 text-xs">
                <Shield className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
                <div className="overflow-hidden space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-900">E-Invoice Authenticated (IRP Registered)</span>
                    <span className="font-mono text-[10px] text-purple-700 font-semibold">Ack #{viewInvoice.ack_no}</span>
                  </div>
                  <p className="font-mono text-[11px] text-purple-800 truncate" title={viewInvoice.irn}>
                    IRN: {viewInvoice.irn}
                  </p>
                  <span className="text-[10px] text-purple-600">Ack Date: {viewInvoice.ack_date}</span>
                </div>
              </div>
            )}

            {viewInvoice.eway_bill_number && (
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-start space-x-3 text-xs">
                <Truck className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <span className="font-bold text-blue-900 block">E-Way Bill Active for Transport</span>
                  <p className="font-mono text-xs font-black text-blue-800">
                    EWB #{viewInvoice.eway_bill_number}
                  </p>
                  <span className="text-[10px] text-blue-600">
                    Issued: {viewInvoice.eway_bill_date} • Valid Until: {viewInvoice.eway_bill_valid_until}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Formal CBIC Standard GST Tax Invoice Layout (Matching Template Image) */}
        <div className="bg-white border-2 border-slate-900 text-slate-900 font-sans text-xs shadow-xl max-w-4xl mx-auto print:border-black print:m-0 print:p-0 print:shadow-none print:max-w-none">
          {/* Top Split Header: Company Details on Left | Tax Invoice Metadata on Right */}
          <div className="grid grid-cols-1 md:grid-cols-12 border-b-2 border-slate-900">
            {/* Left Col (8 cols): Company Branding & Contact */}
            <div className="md:col-span-8 p-4 border-b md:border-b-0 md:border-r-2 border-slate-900 space-y-1">
              <div className="flex items-start space-x-3 mb-2">
                {companyProfile?.logo_url ? (
                  <img
                    src={companyProfile.logo_url}
                    alt="Company Logo"
                    className="h-14 max-w-[150px] object-contain shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded bg-blue-700 text-white font-black flex items-center justify-center text-lg shrink-0">
                    {companyProfile?.company_name ? companyProfile.company_name.charAt(0) : 'O'}
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-base font-black uppercase text-slate-950 tracking-tight leading-snug">
                    {companyProfile?.company_name || 'ODIAS ERP TECHNOLOGIES PVT. LTD.'}
                  </h2>
                  {companyProfile?.trade_name && (
                    <p className="text-[11px] italic text-slate-600 font-semibold">
                      T/A: {companyProfile.trade_name}
                    </p>
                  )}
                </div>
              </div>

              <p className="text-[11px] text-slate-800 leading-tight uppercase font-medium">
                {companyProfile?.address || 'LaxmiSager, Bhubaneswar, Odisha - 751024'}
              </p>
              <p className="text-[11px] text-slate-800">
                State Name: <strong>{companyProfile?.state || 'Odisha'}</strong>, Code: <strong>{companyProfile?.state_code || '21'}</strong>
              </p>
              <p className="text-[11px] text-slate-800">
                Contact: {companyProfile?.phone || '+91 1234567890'} | Email: {companyProfile?.email || 'accounts@odiaserp.com'}
              </p>
              <p className="text-[11px] text-slate-900">
                GSTIN/UIN: <strong className="font-mono">{companyProfile?.gstin || '21AAACR1234F1Z5'}</strong> | PAN: <strong className="font-mono">{companyProfile?.pan || 'AAACR1234F'}</strong>
              </p>
              {companyProfile?.website && (
                <p className="text-[11px] text-slate-700">
                  My Website: <a href={companyProfile.website} target="_blank" rel="noreferrer" className="text-blue-700 underline">{companyProfile.website}</a>
                </p>
              )}
            </div>

            {/* Right Col (4 cols): TAX INVOICE Header & Numbers */}
            <div className="md:col-span-4 p-4 flex flex-col justify-between text-right space-y-2">
              <h1 className="text-xl font-black text-blue-700 tracking-wider uppercase">
                TAX INVOICE
              </h1>
              <div className="text-xs space-y-1.5 font-sans">
                <p className="text-slate-800">
                  Invoice No: <strong className="font-mono text-slate-950">{viewInvoice.invoice_number}</strong>
                </p>
                <p className="text-slate-800">
                  Date: <strong className="font-mono text-slate-950">{viewInvoice.invoice_date}</strong>
                </p>
                <p className="text-slate-800">
                  Place of Supply: <strong>{viewInvoice.place_of_supply || 'Maharashtra (27)'}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Centered Bold Banner Bar */}
          <div className="border-b-2 border-slate-900 py-1 text-center bg-slate-50">
            <h3 className="text-xs font-black tracking-widest uppercase text-slate-900">
              TAX INVOICE
            </h3>
          </div>

          {/* Buyer (Bill To) & Invoice Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 border-b-2 border-slate-900">
            {/* Buyer Left Col (7 cols) */}
            <div className="md:col-span-7 p-3 border-b md:border-b-0 md:border-r-2 border-slate-900 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                BUYER (BILL TO)
              </span>
              <h4 className="text-sm font-bold text-slate-950">{viewInvoice.customer_name}</h4>
              <p className="text-xs text-slate-700 leading-snug">
                {(viewInvoice as any).customer_address || 'Commercial Client Premises, Corporate Towers, Mumbai, Maharashtra 400701'}
              </p>
              <p className="text-xs text-slate-800">
                State Name: <strong>{viewInvoice.place_of_supply || 'Maharashtra'}</strong>, Code: <strong>{(viewInvoice as any).place_of_supply_code || '27'}</strong>
              </p>
              <p className="text-xs text-slate-900">
                GSTIN/UIN: <strong className="font-mono">{viewInvoice.customer_gstin || 'Unregistered'}</strong>
              </p>
            </div>

            {/* Metadata Right Col (5 cols) */}
            <div className="md:col-span-5 p-3 space-y-1 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-0.5">
                <span className="text-slate-600">Invoice No:</span>
                <strong className="font-mono">{viewInvoice.invoice_number}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-0.5">
                <span className="text-slate-600">Dated:</span>
                <strong className="font-mono">{viewInvoice.invoice_date}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-0.5">
                <span className="text-slate-600">Due Date:</span>
                <strong className="font-mono">{viewInvoice.due_date}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-0.5">
                <span className="text-slate-600">Place of Supply:</span>
                <strong>{viewInvoice.place_of_supply || 'Maharashtra (27)'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Reverse Charge:</span>
                <strong>{viewInvoice.is_rcm ? 'Yes' : 'No'}</strong>
              </div>
            </div>
          </div>

          {/* Main Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 bg-slate-50 font-bold text-slate-900 text-center">
                  <th className="py-2 px-2 border-r border-slate-900 w-12 text-center">Sl No.</th>
                  <th className="py-2 px-3 border-r border-slate-900 text-left">Description of Goods</th>
                  <th className="py-2 px-2 border-r border-slate-900 w-24 text-center font-mono">HSN/SAC</th>
                  <th className="py-2 px-2 border-r border-slate-900 w-20 text-center">Quantity</th>
                  <th className="py-2 px-2 border-r border-slate-900 w-24 text-right">Rate</th>
                  <th className="py-2 px-2 border-r border-slate-900 w-16 text-center">GST %</th>
                  <th className="py-2 px-2 border-r border-slate-900 w-20 text-right">Disc.</th>
                  <th className="py-2 px-3 text-right w-28">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(viewInvoice.items && viewInvoice.items.length > 0 ? viewInvoice.items : [
                  {
                    item_name: 'Odias Enterprise ERP Cloud Implementation',
                    hsn_sac: '998314',
                    quantity: 1,
                    unit: 'NOS',
                    unit_price: Number(viewInvoice.subtotal),
                    discount_amount: 0,
                    taxable_value: Number(viewInvoice.subtotal),
                    tax_rate: 18,
                    tax_amount: Number(viewInvoice.total_tax),
                    total: Number(viewInvoice.total_amount),
                  }
                ]).map((item: any, idx: number) => {
                  const qty = Number(item.quantity || 1);
                  const rate = Number(item.unit_price || 0);
                  const gross = qty * rate;
                  const disc = Number(item.discount_amount || (gross * (Number(item.discount_pct || 0) / 100)));
                  const lineAmt = gross - disc;

                  return (
                    <tr key={item.id || idx} className="border-b border-slate-300">
                      <td className="py-2 px-2 border-r border-slate-900 text-center font-mono text-slate-600">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-900 font-bold text-slate-900">
                        {item.item_name}
                      </td>
                      <td className="py-2 px-2 border-r border-slate-900 text-center font-mono text-slate-800">
                        {item.hsn_sac || '998314'}
                      </td>
                      <td className="py-2 px-2 border-r border-slate-900 text-center font-mono">
                        {qty} {item.unit || 'NOS'}
                      </td>
                      <td className="py-2 px-2 border-r border-slate-900 text-right font-mono">
                        ₹{rate.toFixed(2)}
                      </td>
                      <td className="py-2 px-2 border-r border-slate-900 text-center font-mono text-blue-700 font-bold">
                        {item.tax_rate || 18}%
                      </td>
                      <td className="py-2 px-2 border-r border-slate-900 text-right font-mono">
                        ₹{disc.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-950">
                        ₹{lineAmt.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}

                {/* Total Row */}
                <tr className="border-b-2 border-slate-900 font-bold bg-slate-50">
                  <td colSpan={3} className="py-2 px-3 border-r border-slate-900 text-right uppercase">
                    Total
                  </td>
                  <td className="py-2 px-2 border-r border-slate-900 text-center font-mono">
                    {(viewInvoice.items || []).reduce((acc: number, it: any) => acc + Number(it.quantity || 0), 0) || 1}
                  </td>
                  <td className="py-2 px-2 border-r border-slate-900"></td>
                  <td className="py-2 px-2 border-r border-slate-900"></td>
                  <td className="py-2 px-2 border-r border-slate-900 text-right font-mono">
                    ₹{((viewInvoice.items || []).reduce((acc: number, it: any) => acc + Number(it.discount_amount || 0), 0) || 0).toFixed(2)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-black text-slate-950">
                    ₹{Number(viewInvoice.subtotal).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Amount in Words + E. & O.E */}
          <div className="border-b-2 border-slate-900 p-2.5 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
            <div>
              Amount Chargeable (in words): <strong className="capitalize">{numberToIndianWords(Number(viewInvoice.total_amount))}</strong>
            </div>
            <div className="font-serif italic font-bold text-slate-700">
              E. & O.E
            </div>
          </div>

          {/* Statutory HSN / SAC Tax Split Table */}
          <div className="overflow-x-auto border-b-2 border-slate-900">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-50 font-bold text-center">
                  <th rowSpan={2} className="py-1.5 px-2 border-r border-slate-900 w-24">HSN/SAC</th>
                  <th rowSpan={2} className="py-1.5 px-3 border-r border-slate-900 text-right">Taxable Value</th>
                  <th colSpan={2} className="py-1 px-2 border-r border-slate-900">Central Tax (CGST)</th>
                  <th colSpan={2} className="py-1 px-2 border-r border-slate-900">State Tax (SGST)</th>
                  <th colSpan={2} className="py-1 px-2 border-r border-slate-900">Integrated Tax (IGST)</th>
                  <th rowSpan={2} className="py-1.5 px-3 text-right w-28">Total Tax Amount</th>
                </tr>
                <tr className="border-b-2 border-slate-900 bg-slate-50 font-bold text-center">
                  <th className="py-1 px-2 border-r border-slate-900 w-14">Rate</th>
                  <th className="py-1 px-2 border-r border-slate-900 text-right w-20">Amount</th>
                  <th className="py-1 px-2 border-r border-slate-900 w-14">Rate</th>
                  <th className="py-1 px-2 border-r border-slate-900 text-right w-20">Amount</th>
                  <th className="py-1 px-2 border-r border-slate-900 w-14">Rate</th>
                  <th className="py-1 px-2 border-r border-slate-900 text-right w-20">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoiceHsnBreakdown.map((row) => (
                  <tr key={row.hsn_sac} className="border-b border-slate-300">
                    <td className="py-1.5 px-2 border-r border-slate-900 text-center font-mono font-bold">
                      {row.hsn_sac}
                    </td>
                    <td className="py-1.5 px-3 border-r border-slate-900 text-right font-mono">
                      ₹{row.taxable.toFixed(2)}
                    </td>
                    <td className="py-1.5 px-2 border-r border-slate-900 text-center font-mono">
                      {row.cgstRate > 0 ? `${row.cgstRate}%` : '-'}
                    </td>
                    <td className="py-1.5 px-2 border-r border-slate-900 text-right font-mono">
                      {row.cgstAmt > 0 ? `₹${row.cgstAmt.toFixed(2)}` : '₹0.00'}
                    </td>
                    <td className="py-1.5 px-2 border-r border-slate-900 text-center font-mono">
                      {row.sgstRate > 0 ? `${row.sgstRate}%` : '-'}
                    </td>
                    <td className="py-1.5 px-2 border-r border-slate-900 text-right font-mono">
                      {row.sgstAmt > 0 ? `₹${row.sgstAmt.toFixed(2)}` : '₹0.00'}
                    </td>
                    <td className="py-1.5 px-2 border-r border-slate-900 text-center font-mono">
                      {row.igstRate > 0 ? `${row.igstRate}%` : '-'}
                    </td>
                    <td className="py-1.5 px-2 border-r border-slate-900 text-right font-mono">
                      {row.igstAmt > 0 ? `₹${row.igstAmt.toFixed(2)}` : '₹0.00'}
                    </td>
                    <td className="py-1.5 px-3 text-right font-mono font-bold">
                      ₹{row.totalTax.toFixed(2)}
                    </td>
                  </tr>
                ))}

                {/* HSN Table Total */}
                <tr className="border-b border-slate-900 font-bold bg-slate-50">
                  <td className="py-1.5 px-2 border-r border-slate-900 text-center uppercase">Total</td>
                  <td className="py-1.5 px-3 border-r border-slate-900 text-right font-mono">
                    ₹{invoiceHsnBreakdown.reduce((acc, r) => acc + r.taxable, 0).toFixed(2)}
                  </td>
                  <td className="py-1.5 px-2 border-r border-slate-900"></td>
                  <td className="py-1.5 px-2 border-r border-slate-900 text-right font-mono">
                    ₹{Number(viewInvoice.cgst || 0).toFixed(2)}
                  </td>
                  <td className="py-1.5 px-2 border-r border-slate-900"></td>
                  <td className="py-1.5 px-2 border-r border-slate-900 text-right font-mono">
                    ₹{Number(viewInvoice.sgst || 0).toFixed(2)}
                  </td>
                  <td className="py-1.5 px-2 border-r border-slate-900"></td>
                  <td className="py-1.5 px-2 border-r border-slate-900 text-right font-mono">
                    ₹{Number(viewInvoice.igst || 0).toFixed(2)}
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono font-black">
                    ₹{Number(viewInvoice.total_tax).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tax Amount in Words */}
          <div className="border-b-2 border-slate-900 p-2.5 text-xs">
            Tax Amount (in words): <strong className="capitalize">{numberToIndianWords(Number(viewInvoice.total_tax))}</strong>
          </div>

          {/* PAYMENT DETAILS Box */}
          <div className="border-b-2 border-slate-900 p-3 bg-slate-50">
            <span className="text-[11px] font-black uppercase tracking-wider block text-slate-900 mb-1.5">
              PAYMENT DETAILS
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1 font-mono">
                <p>Advance / Previous Payment: <strong>₹0.00</strong></p>
                <p>Amount Paid Now: <strong className="text-emerald-700">₹{Number(viewInvoice.paid_amount || 0).toFixed(2)}</strong></p>
              </div>
              <div className="space-y-1 font-mono">
                <p>Total Payment Received: <strong>₹{Number(viewInvoice.paid_amount || 0).toFixed(2)}</strong></p>
                <p>Balance Due: <strong className="text-rose-600">₹{Number(viewInvoice.balance_amount || 0).toFixed(2)}</strong> | Payment Status: <strong className="uppercase">{viewInvoice.status}</strong></p>
              </div>
            </div>
          </div>

          {/* Declaration, Terms & Bank Details (2 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-12 border-b-2 border-slate-900">
            {/* Left Col (7 cols): Declaration & Terms */}
            <div className="md:col-span-7 p-3 border-b md:border-b-0 md:border-r-2 border-slate-900 space-y-2 text-xs">
              <div>
                <strong className="block text-[11px] uppercase tracking-wider text-slate-900 mb-0.5">Declaration:</strong>
                <p className="text-slate-700 leading-snug">
                  We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
                </p>
              </div>
              <div>
                <strong className="block text-[11px] uppercase tracking-wider text-slate-900 mb-0.5">Terms / Notes:</strong>
                <ol className="list-decimal list-inside space-y-0.5 text-slate-700 leading-snug text-[11px]">
                  <li>Goods once sold will not be taken back or exchanged.</li>
                  <li>All disputes are subject to local jurisdiction only.</li>
                  <li>Please check all items at the time of delivery; no claims will be entertained thereafter.</li>
                  <li>Payment subject to realization of cheque or digital transfer.</li>
                </ol>
              </div>
            </div>

            {/* Right Col (5 cols): Company Bank Remittance Coordinates */}
            <div className="md:col-span-5 p-3 space-y-1 text-xs">
              <strong className="block text-[11px] uppercase tracking-wider text-slate-900 mb-1">
                Company's Bank Details:
              </strong>
              <p className="text-slate-800">
                Bank Name: <strong>{companyProfile?.bank_name || 'HDFC Bank Ltd.'}</strong>
              </p>
              <p className="text-slate-800">
                A/c No.: <strong className="font-mono">{companyProfile?.bank_account_no || '50200088991122'}</strong>
              </p>
              <p className="text-slate-800">
                Branch & IFS Code: <strong>{companyProfile?.bank_branch || 'Bhubaneswar Main Branch'} & {companyProfile?.bank_ifsc || 'HDFC0001234'}</strong>
              </p>
            </div>
          </div>

          {/* Bottom Row: Jurisdiction Disclaimer on Left | Authorised Signatory with Stamp & Signature on Right */}
          <div className="grid grid-cols-1 md:grid-cols-12 p-4 items-end">
            <div className="md:col-span-6 space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider block">
                SUBJECT TO {companyProfile?.state ? companyProfile.state.toUpperCase() : 'ODISHA'} JURISDICTION
              </span>
              <p className="text-[10px] text-slate-500">
                This is a computer-generated tax invoice and requires no physical signature under GST regulations.
              </p>
            </div>

            <div className="md:col-span-6 text-right space-y-2">
              <p className="text-xs font-bold text-slate-950 uppercase">
                For {companyProfile?.company_name || 'ODIAS ERP TECHNOLOGIES PVT. LTD.'}
              </p>

              {/* Stamp & Signature Images Box */}
              <div className="h-20 flex items-center justify-end space-x-4 pr-2">
                {/* Stamp */}
                {companyProfile?.stamp_url ? (
                  <img
                    src={companyProfile.stamp_url}
                    alt="Company Stamp"
                    className="h-16 w-16 object-contain"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full border-2 border-blue-600 p-1 flex items-center justify-center text-[8px] font-black text-blue-700 uppercase tracking-tighter text-center leading-tight">
                    OFFICIAL<br />SEAL
                  </div>
                )}

                {/* Signature */}
                {companyProfile?.signature_url ? (
                  <img
                    src={companyProfile.signature_url}
                    alt="Authorized Signature"
                    className="h-14 max-w-[140px] object-contain"
                  />
                ) : (
                  <span className="font-serif italic text-blue-900 font-bold text-base">
                    Authorized Signatory
                  </span>
                )}
              </div>

              <div className="border-t border-slate-900 w-52 ml-auto pt-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-900 block">
                  Authorised Signatory
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // LIST TABLE VIEW (Default)
  // ----------------------------------------------------
  return (
    <div className="space-y-6 pb-12">
      {/* Toast */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mr-2 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-xs text-emerald-700 underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
            <Receipt className="w-7 h-7 text-blue-600 mr-2.5" />
            Commercial Invoicing & GST Register
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise Indian GST invoicing with automated intra/inter-state tax calculation, E-Invoice IRN, E-Way bills, and double-entry ledger posting.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-sm shadow-blue-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create Tax Invoice
        </button>
      </div>

      {/* DataTable */}
      <DataTable
        data={filteredInvoices}
        columns={columns}
        searchPlaceholder="Search invoices by number, customer, GSTIN..."
        initialPageSize={10}
        pageSizeOptions={[10, 25, 50, 100]}
        filterComponent={
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Invoices</option>
              <option value="issued">Issued</option>
              <option value="paid">Paid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="draft">Draft</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        }
      />

      {/* EDIT MODAL */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title={`Edit Invoice: ${editingInvoice?.invoice_number}`}>
        <form onSubmit={handleUpdateInvoice} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                required
                value={editFormData.due_date}
                onChange={(e) => setEditFormData({ ...editFormData, due_date: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Invoice Status</label>
              <select
                value={editFormData.status}
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold"
              >
                <option value="draft">Draft</option>
                <option value="issued">Issued</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Place of Supply</label>
              <input
                type="text"
                value={editFormData.place_of_supply}
                onChange={(e) => setEditFormData({ ...editFormData, place_of_supply: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Terms & Notes</label>
              <textarea
                value={editFormData.notes}
                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end space-x-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* RECORD PAYMENT MODAL */}
      <Modal isOpen={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} title={`Record Payment for ${selectedInvoice?.invoice_number}`}>
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Amount to Collect (₹)</label>
            <input
              type="number"
              required
              min={1}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono text-base font-bold text-slate-900"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Payment Channel</label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-semibold"
            >
              <option value="bank_transfer">NEFT / RTGS / Bank Transfer</option>
              <option value="upi">UPI Gateway</option>
              <option value="cheque">Cheque</option>
              <option value="cash">Cash Voucher</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Transaction Reference</label>
            <input
              type="text"
              placeholder="UTR or Cheque Number"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono"
            />
          </div>

          <div className="pt-3 flex justify-end space-x-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setPaymentModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm cursor-pointer"
            >
              Confirm Collection
            </button>
          </div>
        </form>
      </Modal>

      {/* GENERATE E-WAY BILL MODAL */}
      <Modal isOpen={ewayModalOpen} onClose={() => setEwayModalOpen(false)} title="Generate GST E-Way Bill">
        <form onSubmit={handleGenerateEWayBill} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Transporter Name *</label>
              <input
                type="text"
                required
                value={ewayData.transporter_name}
                onChange={(e) => setEwayData({ ...ewayData, transporter_name: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Transporter GSTIN / ID *</label>
              <input
                type="text"
                required
                value={ewayData.transporter_id}
                onChange={(e) => setEwayData({ ...ewayData, transporter_id: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Registration # *</label>
              <input
                type="text"
                required
                value={ewayData.vehicle_number}
                onChange={(e) => setEwayData({ ...ewayData, vehicle_number: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Distance (approx. KM) *</label>
              <input
                type="number"
                min="1"
                required
                value={ewayData.distance_km}
                onChange={(e) => setEwayData({ ...ewayData, distance_km: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Transport Mode</label>
              <select
                value={ewayData.transport_mode}
                onChange={(e) => setEwayData({ ...ewayData, transport_mode: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              >
                <option value="road">1 - Road Express</option>
                <option value="rail">2 - Rail Cargo</option>
                <option value="air">3 - Air Freight</option>
                <option value="ship">4 - Ship / Coastal</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex justify-end space-x-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setEwayModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm cursor-pointer"
            >
              Generate Official E-Way Bill
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
