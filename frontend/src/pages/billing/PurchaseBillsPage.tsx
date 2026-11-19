import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingCart, Plus, Search, Filter, CheckCircle2,
  DollarSign, FileText, Building2, Calendar, Eye, Download,
  Check, X, Shield, ArrowDownRight, IndianRupee, ArrowLeft, Trash2, Printer
} from 'lucide-react';
import { api } from '../../api/client';
import { useRealtime } from '../../context/RealtimeContext';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import type { PurchaseBill, Supplier, ProductService, HSNMaster, SACMaster } from '../../types';

interface BillLineItem {
  product: string;
  item_name: string;
  description?: string;
  hsn_sac: string;
  quantity: number | '';
  unit: string;
  purchase_rate: number | '';
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

const DEFAULT_INWARD_TERMS: TermItem[] = [
  { id: '1', text: 'Physical materials verified against Goods Receipt Note (GRN) & Vendor Delivery Challan.', checked: true },
  { id: '2', text: 'Quality inspection verified: 100% sound condition without transit breakage.', checked: true },
  { id: '3', text: 'Vendor GSTIN verified active on GST Portal for valid Input Tax Credit (ITC) claim.', checked: true },
  { id: '4', text: 'Tagged for automated 2B reconciliation before monthly GSTR-3B filing.', checked: true },
  { id: '5', text: 'Payout scheduled within statutory 45-day MSME compliance window.', checked: true },
];

export const PurchaseBillsPage: React.FC = () => {
  const { emitEvent } = useRealtime();
  const [bills, setBills] = useState<PurchaseBill[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<ProductService[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // View & Create Full-Page States
  const [isCreating, setIsCreating] = useState(false);
  const [viewBill, setViewBill] = useState<PurchaseBill | null>(null);

  // Payment Modal
  const [payModal, setPayModal] = useState(false);
  const [selectedBillForPay, setSelectedBillForPay] = useState<PurchaseBill | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMode, setPayMode] = useState('bank_transfer');
  const [refNo, setRefNo] = useState('');

  // Create Purchase Bill Form State
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [vendorInvoiceNumber, setVendorInvoiceNumber] = useState('');
  const [vendorInvoiceDate, setVendorInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
  const [itcEligibility, setItcEligibility] = useState('eligible_inputs');
  const [notes, setNotes] = useState('Inward supplies accepted and verified against physical delivery challan.');
  const [termsList, setTermsList] = useState<TermItem[]>(DEFAULT_INWARD_TERMS);
  const [hsnList, setHsnList] = useState<HSNMaster[]>([]);
  const [sacList, setSacList] = useState<SACMaster[]>([]);

  const [items, setItems] = useState<BillLineItem[]>([
    {
      product: '',
      item_name: '',
      description: '',
      hsn_sac: '',
      quantity: 1,
      unit: 'NOS',
      purchase_rate: '',
      discount_type: 'pct',
      discount_value: '',
      tax_rate: 18,
      is_custom: false,
    },
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [bRes, sRes, pRes, hRes, sMasterRes] = await Promise.all([
        api.getPurchaseBills(),
        api.getSuppliers(),
        api.getProducts(),
        api.getHSNMaster(),
        api.getSACMaster(),
      ]);
      const bList = bRes?.results || bRes || [];
      setBills(bList);
      const sList = sRes?.results || sRes || [];
      setSuppliers(sList);
      if (sList.length > 0 && !selectedSupplier) {
        setSelectedSupplier(sList[0].id);
      }
      setProducts(pRes?.results || pRes || []);
      setHsnList(hRes?.results || hRes || []);
      setSacList(sMasterRes?.results || sMasterRes || []);

      // Auto-populate vendor invoice sample
      setVendorInvoiceNumber(`VINV-2026-${String(bList.length + 842).padStart(5, '0')}`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        product: '',
        item_name: '',
        description: '',
        hsn_sac: '',
        quantity: 1,
        unit: 'NOS',
        purchase_rate: '',
        discount_type: 'pct',
        discount_value: '',
        tax_rate: 18,
        is_custom: false,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    if (field === 'product') {
      const p = products.find((prod) => prod.id === value);
      if (p) {
        updated[index] = {
          ...updated[index],
          product: p.id,
          item_name: p.name,
          hsn_sac: (p as any).hsn_code || p.hsn_sac || '',
          unit: p.unit || 'NOS',
          purchase_rate: Number((p as any).purchase_price || (p as any).cost_price || p.unit_price || 0) || '',
          tax_rate: Number(p.tax_rate || 18),
          is_custom: false,
        };
      } else {
        updated[index] = {
          ...updated[index],
          product: '',
          item_name: '',
          hsn_sac: '',
          purchase_rate: '',
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
    setItems(updated);
  };

  const handleToggleTerm = (id: string) => {
    setTermsList((prev) =>
      prev.map((t) => (t.id === id ? { ...t, checked: !t.checked } : t))
    );
  };

  const handleTermTextChange = (id: string, text: string) => {
    setTermsList((prev) =>
      prev.map((t) => (t.id === id ? { ...t, text } : t))
    );
  };

  const handleAddCustomTerm = () => {
    const newId = String(Date.now());
    setTermsList([
      ...termsList,
      { id: newId, text: 'Custom inward goods receiving inspection protocol verified.', checked: true },
    ]);
  };

  // Realtime Tax and Financial Calculations
  const calculationSummary = useMemo(() => {
    let grossSubtotal = 0;
    let totalDiscount = 0;
    let taxableTotal = 0;
    let totalTax = 0;

    const supp = suppliers.find((s) => s.id === selectedSupplier);
    const isInterState = supp?.state && supp.state.toLowerCase() !== 'odisha';

    items.forEach((item) => {
      const qty = Number(item.quantity || 0);
      const rate = Number(item.purchase_rate || 0);
      const gross = qty * rate;
      const discVal = Number(item.discount_value || 0);
      const disc = item.discount_type === 'amount'
        ? Math.min(gross, discVal)
        : gross * (discVal / 100);
      const taxable = Math.max(0, gross - disc);
      const tax = taxable * (Number(item.tax_rate || 0) / 100);

      grossSubtotal += gross;
      totalDiscount += disc;
      taxableTotal += taxable;
      totalTax += tax;
    });

    const cgst = isInterState ? 0 : totalTax / 2;
    const sgst = isInterState ? 0 : totalTax / 2;
    const igst = isInterState ? totalTax : 0;
    const cess = 0;
    const exactGrand = taxableTotal + totalTax;
    const grandTotal = Math.round(exactGrand);
    const roundOff = grandTotal - exactGrand;

    return {
      grossSubtotal,
      discount: totalDiscount,
      taxable: taxableTotal,
      cgst,
      sgst,
      igst,
      cess,
      roundOff,
      grandTotal,
    };
  }, [items, selectedSupplier, suppliers]);

  const handleSavePurchaseBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) {
      alert('Please select a supplier.');
      return;
    }
    try {
      const activeTerms = termsList
        .filter((t) => t.checked)
        .map((t, idx) => `${idx + 1}. ${t.text}`)
        .join('\n');

      const payload = {
        supplier: selectedSupplier,
        supplier_invoice_number: vendorInvoiceNumber,
        supplier_invoice_date: vendorInvoiceDate,
        bill_date: billDate,
        due_date: dueDate,
        itc_eligibility: itcEligibility,
        notes: notes ? `${notes}\n\nStatutory Verification Notes:\n${activeTerms}` : `Statutory Verification Notes:\n${activeTerms}`,
        items: items.map((it) => {
          const qty = Number(it.quantity || 1);
          const rate = Number(it.purchase_rate || 0);
          const gross = qty * rate;
          const discVal = Number(it.discount_value || 0);
          const discAmt = it.discount_type === 'amount'
            ? Math.min(gross, discVal)
            : gross * (discVal / 100);

          return {
            product: it.product || undefined,
            item_name: it.item_name || (products.find((p) => p.id === it.product)?.name) || 'Raw Material / Goods',
            description: it.description || '',
            hsn_sac: it.hsn_sac || '847130',
            quantity: qty,
            purchase_rate: rate,
            discount_amount: discAmt,
            tax_rate: Number(it.tax_rate || 18),
          };
        }),
      };

      const created = await api.createPurchaseBill(payload);
      setIsCreating(false);
      showToast('Purchase Bill posted successfully! Input Tax Credit (ITC) booked.');
      emitEvent('billing.purchase_bill_created', 'Purchase Bill Posted', `Bill ${vendorInvoiceNumber} inward recorded.`, 'success');
      loadData();
      setViewBill(created);
    } catch (err: any) {
      alert(err?.response?.data?.detail || err.message || 'Purchase bill creation failed');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBillForPay) return;
    try {
      await api.recordSupplierPayment({
        supplier: selectedBillForPay.supplier,
        purchase_bill: selectedBillForPay.id,
        amount: Number(payAmount),
        payment_mode: payMode,
        bank_reference: refNo,
        payment_date: new Date().toISOString().split('T')[0],
      });
      emitEvent('supplier_paid', 'Supplier Paid', `Payment recorded for ${selectedBillForPay.bill_number}`, 'success');
      showToast('Supplier payment logged successfully!');
      setPayModal(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      showToast('Failed to record supplier payment');
    }
  };

  // KPIs
  const totalBillsSum = bills.reduce((acc, b) => acc + Number(b.total_amount), 0);
  const totalItcClaimed = bills.filter(b => b.itc_eligibility.startsWith('eligible')).reduce((acc, b) => acc + Number(b.total_tax), 0);
  const pendingPayables = bills.reduce((acc, b) => acc + Number(b.balance_amount), 0);

  const filteredBills = bills.filter(b =>
    b.bill_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.supplier_invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.supplier_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ----------------------------------------------------
  // FULL PAGE VIEW: NEW PURCHASE BILL (Matching media_1794806738467_07640226.png)
  // ----------------------------------------------------
  if (isCreating) {
    return (
      <div className="space-y-6 pb-20 animate-in fade-in duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">New Purchase Bill</h1>
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

        <form onSubmit={handleSavePurchaseBill} className="space-y-6">
          {/* Card 1: Bill Parameters */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Bill Parameters
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div className="xl:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Supplier *</label>
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  required
                  className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Find supplier name to search...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.company_name} {s.gstin ? `(${s.gstin})` : ''} - {s.state}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Vendor Bill / Inv # *</label>
                <input
                  type="text"
                  required
                  value={vendorInvoiceNumber}
                  onChange={(e) => setVendorInvoiceNumber(e.target.value)}
                  placeholder="e.g. DELL/2026/0991"
                  className="w-full text-xs font-mono font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Vendor Invoice Date *</label>
                <input
                  type="date"
                  required
                  value={vendorInvoiceDate}
                  onChange={(e) => setVendorInvoiceDate(e.target.value)}
                  className="w-full text-xs font-mono font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Inward Receipt Date *</label>
                <input
                  type="date"
                  required
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                  className="w-full text-xs font-mono font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">ITC Eligibility *</label>
                <select
                  value={itcEligibility}
                  onChange={(e) => setItcEligibility(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="eligible_inputs">Eligible (Inputs / Goods)</option>
                  <option value="eligible_capital_goods">Eligible (Capital Assets)</option>
                  <option value="eligible_services">Eligible (Input Services)</option>
                  <option value="ineligible">Ineligible (Blocked Sec 17(5))</option>
                </select>
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
                    <th className="py-2.5 px-3 text-right">Purchase Rate *</th>
                    <th className="py-2.5 px-3 text-right">Disc</th>
                    <th className="py-2.5 px-3 text-center">GST %</th>
                    <th className="py-2.5 px-3 text-right">Total Amount (₹)</th>
                    <th className="py-2.5 px-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {items.map((item, idx) => {
                    const qty = Number(item.quantity || 0);
                    const rate = Number(item.purchase_rate || 0);
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
                                placeholder="Type item / component description *"
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
                              <option value="">-- Select Product / Inventory Item --</option>
                              <option value="__custom__">+ Custom Item / Manual Entry...</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} {p.hsn_sac ? `(${p.hsn_sac})` : ''} - ₹{Number((p as any).purchase_price || (p as any).cost_price || p.unit_price || 0).toLocaleString('en-IN')}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="py-2.5 px-3 align-top w-28">
                          <input
                            type="text"
                            list="pb-hsn-sac-list"
                            placeholder="HSN/SAC"
                            value={item.hsn_sac}
                            onChange={(e) => handleItemChange(idx, 'hsn_sac', e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-300 bg-white text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <datalist id="pb-hsn-sac-list">
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
                            value={item.purchase_rate === '' ? '' : item.purchase_rate}
                            onChange={(e) => handleItemChange(idx, 'purchase_rate', e.target.value === '' ? '' : Number(e.target.value))}
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
                            disabled={items.length <= 1}
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
                    placeholder="Enter inward receiving notes / inspection remarks..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
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
                  <span>Input CGST:</span>
                  <span className="font-mono">₹{calculationSummary.cgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Input SGST:</span>
                  <span className="font-mono">₹{calculationSummary.sgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Input IGST:</span>
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
                  <span>Grand Total (Payable):</span>
                  <span className="font-mono text-base text-blue-600">
                    ₹{calculationSummary.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Inward Verification & Statutory Compliance */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-1">
              <div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Inward Verification & Statutory Checklist
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Confirm physical goods receipt, GRN audit, and Input Tax Credit (ITC) compliance before ledger posting.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddCustomTerm}
                className="inline-flex items-center px-3 py-1 rounded-lg border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1 text-slate-500" />
                Add Checklist Point
              </button>
            </div>

            <div className="space-y-2 pt-2">
              {termsList.map((term) => (
                <div key={term.id} className="flex items-center space-x-2.5">
                  <input
                    type="checkbox"
                    checked={term.checked}
                    onChange={() => handleToggleTerm(term.id)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={term.text}
                    onChange={(e) => handleTermTextChange(term.id, e.target.value)}
                    className={`flex-1 text-xs px-2.5 py-1.5 rounded border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      !term.checked ? 'text-slate-400 line-through bg-slate-50/50' : ''
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-600/30 transition-all cursor-pointer"
            >
              Save & Post Purchase Bill
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ----------------------------------------------------
  // FULL PAGE VIEW: VIEW PURCHASE BILL
  // ----------------------------------------------------
  if (viewBill) {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setViewBill(null)}
              className="inline-flex items-center px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5 text-slate-500" />
              <span>Back to Purchase Bills</span>
            </button>
            <div className="h-5 w-px bg-slate-300 hidden sm:block" />
            <span className="text-xs text-slate-500 font-mono hidden sm:inline">
              Billing / Purchase Bills / {viewBill.bill_number}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {viewBill.status !== 'paid' && (
              <button
                onClick={() => {
                  setSelectedBillForPay(viewBill);
                  setPayAmount(Number(viewBill.balance_amount));
                  setPayModal(true);
                }}
                className="inline-flex items-center px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
              >
                <DollarSign className="w-4 h-4 mr-1.5" />
                <span>Disburse Vendor Payment</span>
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="inline-flex items-center px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 mr-1.5 text-slate-500" />
              <span>Print Dossier</span>
            </button>
          </div>
        </div>

        {/* Bill Details Box */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
          <div className="flex flex-col md:flex-row justify-between gap-6 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {viewBill.bill_number}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 capitalize">
                  {viewBill.itc_eligibility.replace('_', ' ')}
                </span>
                <StatusBadge status={viewBill.status} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-2">
                {viewBill.supplier_name || 'Vendor Supplier'}
              </h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Vendor Ref: {viewBill.supplier_invoice_number} | GSTIN: {viewBill.supplier_gstin || 'Unregistered'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 text-xs text-right">
              <div>
                <span className="text-slate-400 block font-semibold">Bill Date</span>
                <span className="font-mono font-bold text-slate-900">{viewBill.bill_date}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Due Date</span>
                <span className="font-mono font-bold text-rose-600">{viewBill.due_date}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Taxable Subtotal</span>
                <span className="font-mono font-bold text-slate-900">₹{Number(viewBill.subtotal).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Total Bill Amount</span>
                <span className="font-mono font-extrabold text-slate-900 text-sm">
                  ₹{Number(viewBill.total_amount).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mt-6">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Inward Items & Components</h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Item / Service</th>
                    <th className="py-2.5 px-3">HSN/SAC</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Rate (₹)</th>
                    <th className="py-2.5 px-3 text-center">GST %</th>
                    <th className="py-2.5 px-3 text-right">Tax (₹)</th>
                    <th className="py-2.5 px-3 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viewBill.items && viewBill.items.length > 0 ? (
                    viewBill.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{item.item_name}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{item.hsn_sac || '847130'}</td>
                        <td className="py-2.5 px-3 text-center font-mono">{Number(item.quantity)} {item.unit || 'NOS'}</td>
                        <td className="py-2.5 px-3 text-right font-mono">₹{Number(item.purchase_rate).toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3 text-center font-mono">{item.tax_rate}%</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-500">₹{Number(item.tax_amount || 0).toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">₹{Number(item.total_amount).toLocaleString('en-IN')}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-3 px-3 text-slate-400 italic text-center">
                        Consolidated Inward Supply Package (₹{Number(viewBill.total_amount).toLocaleString('en-IN')})
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {viewBill.notes && (
            <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <span className="font-bold text-slate-700 block mb-1">Inward Remarks & Statutory Notes</span>
              <p className="text-slate-600 whitespace-pre-line">{viewBill.notes}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
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
          <h1 className="text-2xl font-bold text-gray-900">Purchase Management & Inward ITC</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track inward vendor bills, statutory Input Tax Credit (ITC) eligibility, GRN stock receipts, and disbursements.
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
        >
          <Plus size={16} />
          Create Purchase Bill
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Purchases Inward</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">₹{totalBillsSum.toLocaleString('en-IN')}</p>
            <p className="text-xs text-blue-600 mt-1">{bills.length} Verified bills</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <ShoppingCart size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Eligible Inward ITC</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">₹{totalItcClaimed.toLocaleString('en-IN')}</p>
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
              <CheckCircle2 size={12} /> Eligible for GSTR-3B offset
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Shield size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Payables Outstanding</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">₹{pendingPayables.toLocaleString('en-IN')}</p>
            <p className="text-xs text-gray-400 mt-1">Trade creditors balance</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <IndianRupee size={24} />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search bill no, vendor invoice, supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <span className="text-xs text-gray-400 font-mono">Total {bills.length} Inward Bills</span>
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50/80 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                <th className="py-3 px-4">Bill & Vendor Invoice</th>
                <th className="py-3 px-4">Supplier Firm</th>
                <th className="py-3 px-4">Bill Date</th>
                <th className="py-3 px-4">Taxable Value</th>
                <th className="py-3 px-4">GST Tax</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">ITC Status</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBills.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <p className="font-mono font-bold text-xs text-blue-600">{b.bill_number}</p>
                    <p className="text-[11px] text-gray-400 font-mono">Ref: {b.supplier_invoice_number}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-gray-900 text-xs">{b.supplier_name}</p>
                    <p className="text-[11px] text-gray-400 font-mono">{b.supplier_gstin || 'Unregistered'}</p>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-gray-600">
                    {b.bill_date}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-gray-800">
                    ₹{Number(b.subtotal).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-purple-700">
                    ₹{Number(b.total_tax).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-gray-900 text-xs">
                    ₹{Number(b.total_amount).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 text-xs font-bold rounded bg-emerald-50 text-emerald-700">
                      Eligible ITC
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full capitalize ${
                      b.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => setViewBill(b)}
                        className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200/80 transition-colors cursor-pointer"
                        title="View Bill Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {b.status !== 'paid' && (
                        <button
                          onClick={() => {
                            setSelectedBillForPay(b);
                            setPayAmount(Number(b.balance_amount));
                            setPayModal(true);
                          }}
                          className="px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                        >
                          Record Pay
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Record Supplier Payment */}
      {selectedBillForPay && (
        <Modal
          isOpen={payModal}
          onClose={() => setPayModal(false)}
          title={`Disburse Payment: ${selectedBillForPay.bill_number}`}
        >
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-xl text-sm flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{selectedBillForPay.supplier_name}</p>
                <p className="text-xs text-gray-400">Total Bill: ₹{Number(selectedBillForPay.total_amount).toLocaleString('en-IN')}</p>
              </div>
              <span className="font-bold text-rose-600 text-sm">Due: ₹{Number(selectedBillForPay.balance_amount).toLocaleString('en-IN')}</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Disbursement Amount (₹) *</label>
              <input
                type="number"
                required
                min="1"
                max={Number(selectedBillForPay.balance_amount)}
                value={payAmount}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Mode</label>
                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                >
                  <option value="bank_transfer">NEFT / RTGS / IMPS</option>
                  <option value="upi">UPI Transfer</option>
                  <option value="cheque">Bank Cheque</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Bank Reference / UTR</label>
                <input
                  type="text"
                  placeholder="UTR-9918237"
                  value={refNo}
                  onChange={(e) => setRefNo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setPayModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 cursor-pointer hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 cursor-pointer hover:bg-blue-700"
              >
                Confirm Disbursement
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
