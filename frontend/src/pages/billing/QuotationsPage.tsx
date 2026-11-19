import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag, Plus, ArrowRight, CheckCircle2, Eye, Calendar,
  Building2, Filter, Printer, Trash2, ArrowLeft, DollarSign, FileText, Check
} from 'lucide-react';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable, ColumnDef } from '../../components/common/DataTable';
import { useRealtime } from '../../context/RealtimeContext';
import type { Quotation, Customer, ProductService, HSNMaster, SACMaster, CompanyProfile } from '../../types';
import { numberToIndianWords } from '../../utils/currencyWords';

interface QuotationLineItem {
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

const DEFAULT_TERMS: TermItem[] = [
  { id: '1', text: 'Payment must be made according to the agreed payment terms.', checked: true },
  { id: '2', text: 'Quotation is valid only for the specified validity period.', checked: true },
  { id: '3', text: 'Prices are subject to applicable GST taxes.', checked: true },
  { id: '4', text: 'Delivery will be made according to the agreed schedule.', checked: true },
  { id: '5', text: 'Any additional work or requirements may be charged separately.', checked: true },
  { id: '6', text: 'Goods/services once confirmed cannot be cancelled without mutual agreement.', checked: true },
  { id: '7', text: 'Any dispute will be subject to the particular jurisdiction.', checked: true },
];

export const QuotationsPage: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<ProductService[]>([]);
  const [loading, setLoading] = useState(true);

  // View & Create Full-Page States
  const [isCreating, setIsCreating] = useState(false);
  const [viewQuotation, setViewQuotation] = useState<Quotation | null>(null);

  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { emitEvent } = useRealtime();

  // Full-Page New Quotation Form State
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [quotationNumber, setQuotationNumber] = useState('');
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [termsList, setTermsList] = useState<TermItem[]>(DEFAULT_TERMS);
  const [hsnList, setHsnList] = useState<HSNMaster[]>([]);
  const [sacList, setSacList] = useState<SACMaster[]>([]);

  const [items, setItems] = useState<QuotationLineItem[]>([
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

  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [qRes, cRes, pRes, hRes, sRes, profRes] = await Promise.all([
        api.getQuotations(),
        api.getCustomers(),
        api.getProducts(),
        api.getHSNMaster(),
        api.getSACMaster(),
        api.getCompanyProfile().catch(() => null),
      ]);
      const qList = qRes.results || qRes || [];
      setQuotations(qList);
      if (profRes && profRes.company_name) {
        setCompanyProfile(profRes);
      }
      const cList = cRes.results || cRes || [];
      setCustomers(cList);
      if (cList.length > 0 && !selectedCustomer) {
        setSelectedCustomer(cList[0].id);
      }
      setProducts(pRes.results || pRes || []);
      setHsnList(hRes?.results || hRes || []);
      setSacList(sRes?.results || sRes || []);

      // Auto-generate next quotation number
      const qNum = `QTN/2026-27/${String(qList.length + 26).padStart(5, '0')}`;
      setQuotationNumber(qNum);
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
    setItems([
      ...items,
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
          unit_price: Number((p as any).selling_price || p.unit_price || 0) || '',
          tax_rate: Number(p.tax_rate || 18),
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
    setItems(updated);
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
  const calculationSummary = useMemo(() => {
    let grossSubtotal = 0;
    let totalDiscount = 0;
    let taxable = 0;
    let totalTax = 0;

    items.forEach((it) => {
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

    const isIntraState = true;
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
  }, [items]);

  // Submit Quotation
  const handleSaveQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      alert('Please select a customer.');
      return;
    }

    try {
      const activeTerms = termsList.filter((t) => t.checked).map((t) => t.text).join('\n');
      const payload = {
        customer: selectedCustomer,
        quotation_number: quotationNumber,
        quotation_date: quotationDate,
        valid_until: validUntil,
        notes: notes ? `${notes}\n\nTerms & Conditions:\n${activeTerms}` : `Terms & Conditions:\n${activeTerms}`,
        items: items.map((it) => {
          const qty = Number(it.quantity || 1);
          const rate = Number(it.unit_price || 0);
          const gross = qty * rate;
          const discVal = Number(it.discount_value || 0);
          const discPct = it.discount_type === 'amount'
            ? (gross > 0 ? (discVal / gross) * 100 : 0)
            : discVal;

          return {
            product: it.product || undefined,
            item_name: it.item_name || (products.find((p) => p.id === it.product)?.name) || 'Custom Item',
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

      const created = await api.createQuotation(payload);
      setIsCreating(false);
      showToast('Sales Quotation created and queued for approval.');
      emitEvent('billing.quotation_created', 'Quotation Generated', `Quotation ${quotationNumber} issued.`, 'info');
      loadData();
      setViewQuotation(created);
    } catch (err: any) {
      alert(err.message || 'Quotation creation failed');
    }
  };

  const handleConvert = async (id: string) => {
    if (!confirm('Convert this accepted quotation into an official Tax Invoice?')) return;
    try {
      const res = await api.convertQuotationToInvoice(id);
      showToast(res.message || 'Invoice created from quotation');
      emitEvent('billing.quotation_converted', 'Quotation Converted', 'Official Tax Invoice generated from estimate.', 'success');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Conversion failed');
    }
  };

  const filteredQuotations = useMemo(() => {
    if (statusFilter === 'all') return quotations;
    return quotations.filter((q) => q.status === statusFilter);
  }, [quotations, statusFilter]);

  const columns: ColumnDef<Quotation>[] = [
    {
      key: 'quotation_number',
      header: 'Quotation #',
      render: (q) => <span className="font-mono font-bold text-slate-900">{q.quotation_number}</span>,
    },
    {
      key: 'customer_name',
      header: 'Customer',
      render: (q) => (
        <div>
          <span className="font-bold text-slate-900 block">{q.customer_name}</span>
          <span className="text-[11px] text-slate-400 font-mono">{q.customer_email || 'Commercial client'}</span>
        </div>
      ),
    },
    {
      key: 'quotation_date',
      header: 'Date',
      render: (q) => <span className="font-mono text-slate-600 text-xs">{q.quotation_date}</span>,
    },
    {
      key: 'valid_until',
      header: 'Valid Until',
      render: (q) => <span className="font-mono text-slate-600 text-xs">{q.valid_until || '--'}</span>,
    },
    {
      key: 'subtotal',
      header: 'Taxable (₹)',
      accessor: (q) => Number(q.subtotal),
      render: (q) => <span className="font-mono text-slate-700">₹{Number(q.subtotal).toLocaleString('en-IN')}</span>,
    },
    {
      key: 'tax_amount',
      header: 'GST Tax',
      accessor: (q) => Number(q.tax_amount),
      render: (q) => <span className="font-mono text-slate-500">₹{Number(q.tax_amount).toLocaleString('en-IN')}</span>,
    },
    {
      key: 'total_amount',
      header: 'Total Proposal',
      accessor: (q) => Number(q.total_amount),
      render: (q) => (
        <span className="font-mono font-extrabold text-slate-900 text-sm">
          ₹{Number(q.total_amount).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (q) => <StatusBadge status={q.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      sortable: false,
      render: (q) => (
        <div className="flex items-center justify-end space-x-1.5">
          <button
            onClick={() => setViewQuotation(q)}
            className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200/80 transition-colors cursor-pointer"
            title="View Proposal Dossier"
          >
            <Eye className="w-4 h-4" />
          </button>
          {q.status !== 'converted' ? (
            <button
              onClick={() => handleConvert(q.id)}
              className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 transition-colors text-xs cursor-pointer"
              title="Convert to Tax Invoice"
            >
              <span>To Invoice</span>
              <ArrowRight className="w-3 h-3 ml-1" />
            </button>
          ) : (
            <span className="text-[11px] text-emerald-700 font-semibold flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Converted
            </span>
          )}
        </div>
      ),
    },
  ];

  // ----------------------------------------------------
  // FULL PAGE VIEW: NEW SALES QUOTATION (Matching media_1794806738467_07640226.png)
  // ----------------------------------------------------
  if (isCreating) {
    return (
      <div className="space-y-6 pb-20 animate-in fade-in duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">New Sales Quotation</h1>
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

        <form onSubmit={handleSaveQuotation} className="space-y-6">
          {/* Card 1: Quotation Parameters */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Quotation Parameters
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Customer *</label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
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
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Quotation Number *</label>
                <input
                  type="text"
                  required
                  value={quotationNumber}
                  onChange={(e) => setQuotationNumber(e.target.value)}
                  className="w-full text-xs font-mono font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Quotation Date *</label>
                <input
                  type="date"
                  required
                  value={quotationDate}
                  onChange={(e) => setQuotationDate(e.target.value)}
                  className="w-full text-xs font-mono font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Valid Until *</label>
                <input
                  type="date"
                  required
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full text-xs font-mono font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
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
                  {items.map((item, idx) => {
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
                            list="qtn-hsn-sac-list"
                            placeholder="HSN/SAC"
                            value={item.hsn_sac}
                            onChange={(e) => handleItemChange(idx, 'hsn_sac', e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-300 bg-white text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <datalist id="qtn-hsn-sac-list">
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
                    placeholder="Enter comments / notes..."
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
                  Select the terms & conditions to include in this quotation. Unchecked terms will not be displayed on the quotation document.
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
                    id={`term-${term.id}`}
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
              Save Quotation
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ----------------------------------------------------
  // FULL PAGE VIEW: QUOTATION DOSSIER (Matching Reference Photo)
  // ----------------------------------------------------
  if (viewQuotation) {
    const quoteItems = viewQuotation.items && viewQuotation.items.length > 0 ? viewQuotation.items : [
      {
        item_name: 'Odias Enterprise ERP Cloud Implementation',
        hsn_sac: '998314',
        quantity: 1,
        unit: 'NOS',
        unit_price: Number(viewQuotation.subtotal),
        discount_amount: 0,
        taxable_value: Number(viewQuotation.subtotal),
        tax_rate: 18,
        tax_amount: Number(viewQuotation.tax_amount),
        total: Number(viewQuotation.total_amount),
      }
    ];

    const isIntra = true;
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

    quoteItems.forEach((it: any) => {
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

    const quotationHsnBreakdown = Array.from(hsnMap.values());
    const grossSubtotal = quoteItems.reduce((acc: number, it: any) => acc + (Number(it.quantity || 1) * Number(it.unit_price || 0)), 0);
    const totalDiscount = quoteItems.reduce((acc: number, it: any) => acc + Number(it.discount_amount || 0), 0);
    const totalTax = Number(viewQuotation.tax_amount || 0);
    const cgstTotal = isIntra ? totalTax / 2 : 0;
    const sgstTotal = isIntra ? totalTax / 2 : 0;
    const igstTotal = !isIntra ? totalTax : 0;

    return (
      <div className="space-y-6 pb-16 animate-in fade-in duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setViewQuotation(null)}
              className="inline-flex items-center px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5 text-slate-500" />
              <span>Back to Quotations</span>
            </button>
            <div className="h-5 w-px bg-slate-300 hidden sm:block" />
            <span className="text-xs text-slate-500 font-mono hidden sm:inline">
              Billing / Quotations / {viewQuotation.quotation_number}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {viewQuotation.status !== 'converted' && (
              <button
                onClick={() => handleConvert(viewQuotation.id)}
                className="inline-flex items-center px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5 mr-1.5" />
                <span>Convert to Tax Invoice</span>
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="inline-flex items-center px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>

        {/* Quotation Document View (CBIC Formal Layout matching photo) */}
        <div className="bg-white border-2 border-slate-900 text-slate-900 font-sans text-xs shadow-xl max-w-4xl mx-auto print:border-black print:m-0 print:p-0 print:shadow-none print:max-w-none">
          {/* Header Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 border-b-2 border-slate-900">
            {/* Left Header Col (8 cols) */}
            <div className="md:col-span-8 p-4 border-b md:border-b-0 md:border-r-2 border-slate-900 space-y-1">
              <div className="flex items-start space-x-3 mb-2">
                {companyProfile?.logo_url ? (
                  <img
                    src={companyProfile.logo_url}
                    alt="Company Logo"
                    className="h-14 max-w-[150px] object-contain shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded bg-blue-900 text-white font-black flex items-center justify-center text-lg shrink-0">
                    {companyProfile?.company_name ? companyProfile.company_name.charAt(0) : 'O'}
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-base font-black uppercase text-blue-950 tracking-tight leading-snug">
                    {companyProfile?.company_name || 'ODIAS ERP TECHNOLOGIES PVT. LTD.'}
                  </h2>
                  <p className="text-xs font-bold text-blue-700">
                    Trade Name: {companyProfile?.trade_name || 'Odias ERP Cloud Suite'}
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-slate-800 leading-tight uppercase font-medium">
                {companyProfile?.address || 'LaxmiSager, Bhubaneswar, Odisha - 751024'}
              </p>
              <p className="text-[11px] text-slate-800">
                Contact: {companyProfile?.phone || '+91 1234567890'} | Email: {companyProfile?.email || 'accounts@odiaserp.com'}
              </p>
              <p className="text-[11px] text-slate-900">
                GSTIN: <strong className="font-mono">{companyProfile?.gstin || '21AAACR1234F1Z5'}</strong> | State Code: <strong className="font-mono">{companyProfile?.state_code || '21'}</strong>
              </p>
              {companyProfile?.website && (
                <p className="text-[11px] text-slate-700">
                  My Website: <a href={companyProfile.website} target="_blank" rel="noreferrer" className="text-blue-700 underline">{companyProfile.website}</a>
                </p>
              )}
            </div>

            {/* Right Header Col (4 cols) */}
            <div className="md:col-span-4 p-4 flex flex-col justify-between text-right space-y-2">
              <div>
                <span className="bg-blue-800 text-white font-black text-xs px-3 py-1.5 rounded tracking-wider uppercase inline-block">
                  SALES QUOTATION
                </span>
              </div>
              <div className="text-xs space-y-1 font-sans">
                <p className="text-slate-800">
                  Quotation No: <strong className="font-mono text-slate-950">{viewQuotation.quotation_number}</strong>
                </p>
                <p className="text-slate-800">
                  Date: <strong className="font-mono text-slate-950">{viewQuotation.quotation_date}</strong>
                </p>
                <p className="text-slate-800">
                  Valid Until: <strong className="font-mono text-slate-950">{viewQuotation.valid_until || '01-Dec-2026'}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Customer Details & Quotation Info (2 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-12 border-b-2 border-slate-900">
            {/* Left Box: Customer Details */}
            <div className="md:col-span-7 p-3 border-b md:border-b-0 md:border-r-2 border-slate-900 space-y-1">
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">
                CUSTOMER DETAILS (QUOTATION FOR)
              </span>
              <h4 className="text-sm font-bold text-slate-950">{viewQuotation.customer_name}</h4>
              <p className="text-xs text-slate-700 leading-snug">
                {(viewQuotation as any).customer_address || 'Registered Commercial Premises, Corporate Park'}
              </p>
              <p className="text-xs text-slate-800">
                State Name: <strong>{companyProfile?.state || 'Odisha'}</strong> | Code: <strong>{companyProfile?.state_code || '21'}</strong>
              </p>
              <p className="text-xs text-slate-900">
                GSTIN/UIN: <strong className="font-mono">{viewQuotation.customer_gstin || '21TGTTI1MTYUGY1G'}</strong>
              </p>
              <p className="text-xs text-slate-700">
                Phone: {(viewQuotation as any).customer_phone || '1234567894'} | Email: {viewQuotation.customer_email || 'client@enterprise.com'}
              </p>
            </div>

            {/* Right Box: Quotation Information */}
            <div className="md:col-span-5 p-3 space-y-1 text-xs">
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">
                QUOTATION INFORMATION
              </span>
              <div className="flex justify-between border-b border-slate-100 pb-0.5">
                <span className="text-slate-600">Quotation Number:</span>
                <strong className="font-mono">{viewQuotation.quotation_number}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-0.5">
                <span className="text-slate-600">Quotation Date:</span>
                <strong className="font-mono">{viewQuotation.quotation_date}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-0.5">
                <span className="text-slate-600">Validity Period:</span>
                <strong>Until {viewQuotation.valid_until || '01-Dec-2026'}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-0.5">
                <span className="text-slate-600">Payment Terms:</span>
                <strong>As specified in proposal</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">GST Supply Type:</span>
                <strong className="text-blue-700">Intra-State (CGST + SGST)</strong>
              </div>
            </div>
          </div>

          {/* Line Items Table with Navy Header */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 bg-blue-900 text-white font-bold text-center">
                  <th className="py-2.5 px-2 border-r border-slate-700 w-10 text-center">SL</th>
                  <th className="py-2.5 px-2 border-r border-slate-700 w-16 text-center">PHOTO</th>
                  <th className="py-2.5 px-3 border-r border-slate-700 text-left">PRODUCT DESCRIPTION & SPECIFICATIONS</th>
                  <th className="py-2.5 px-2 border-r border-slate-700 w-24 text-center font-mono">HSN/SAC</th>
                  <th className="py-2.5 px-2 border-r border-slate-700 w-20 text-center">QTY</th>
                  <th className="py-2.5 px-2 border-r border-slate-700 w-24 text-right">RATE</th>
                  <th className="py-2.5 px-2 border-r border-slate-700 w-20 text-right">DISC.</th>
                  <th className="py-2.5 px-2 border-r border-slate-700 w-16 text-center">GST %</th>
                  <th className="py-2.5 px-3 text-right w-28">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {quoteItems.map((item: any, idx: number) => {
                  const qty = Number(item.quantity || 1);
                  const rate = Number(item.unit_price || 0);
                  const gross = qty * rate;
                  const disc = Number(item.discount_amount || 0);
                  const lineAmt = gross - disc;

                  return (
                    <tr key={idx} className="border-b border-slate-300">
                      <td className="py-2.5 px-2 border-r border-slate-900 text-center font-mono text-slate-700">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-2 border-r border-slate-900 text-center">
                        <div className="w-10 h-8 rounded border border-slate-300 bg-slate-50 flex items-center justify-center mx-auto text-[8px] text-slate-400 font-bold">
                          No Image
                        </div>
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-900 font-bold text-slate-900">
                        {item.item_name}
                      </td>
                      <td className="py-2.5 px-2 border-r border-slate-900 text-center font-mono text-slate-800">
                        {item.hsn_sac || '998314'}
                      </td>
                      <td className="py-2.5 px-2 border-r border-slate-900 text-center font-mono">
                        {qty}.00 {item.unit || 'NOS'}
                      </td>
                      <td className="py-2.5 px-2 border-r border-slate-900 text-right font-mono">
                        ₹{rate.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-2 border-r border-slate-900 text-right font-mono">
                        ₹{disc.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-2 border-r border-slate-900 text-center font-mono text-blue-700 font-bold">
                        {item.tax_rate || 18}.00%
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-950">
                        ₹{lineAmt.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Special Notes on Left | Totals on Right */}
          <div className="grid grid-cols-1 md:grid-cols-12 border-b-2 border-slate-900">
            <div className="md:col-span-7 p-3 border-b md:border-b-0 md:border-r-2 border-slate-900 space-y-1">
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">
                SPECIAL NOTES:
              </span>
              <p className="text-xs text-slate-700 leading-snug">
                Prices are inclusive of standard packing and handling. Delivery schedules will be confirmed upon formal order placement.
              </p>
            </div>

            <div className="md:col-span-5 p-3 space-y-1 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-0.5">
                <span className="text-slate-600">Gross Subtotal:</span>
                <span className="font-mono font-bold">₹{grossSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-0.5">
                <span className="text-slate-600">Discount:</span>
                <span className="font-mono">₹{totalDiscount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-0.5">
                <span className="text-slate-600">CGST:</span>
                <span className="font-mono">₹{cgstTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-0.5">
                <span className="text-slate-600">SGST:</span>
                <span className="font-mono">₹{sgstTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-0.5">
                <span className="text-slate-600">IGST:</span>
                <span className="font-mono">₹{igstTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-0.5">
                <span className="text-slate-600">Cess:</span>
                <span className="font-mono">₹0.00</span>
              </div>
              <div className="flex justify-between bg-blue-900 text-white p-2 rounded font-black text-sm mt-1">
                <span>Grand Total:</span>
                <span className="font-mono">₹{Number(viewQuotation.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Amount in words */}
          <div className="border-b-2 border-slate-900 p-2.5 text-xs">
            Amount Chargeable (in words): <strong className="capitalize">{numberToIndianWords(Number(viewQuotation.total_amount))}</strong>
          </div>

          {/* Statutory HSN / SAC Tax Breakdown Table */}
          <div className="overflow-x-auto border-b-2 border-slate-900">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-50 font-bold text-center">
                  <th rowSpan={2} className="py-1.5 px-2 border-r border-slate-900 w-24">HSN/SAC</th>
                  <th rowSpan={2} className="py-1.5 px-3 border-r border-slate-900 text-right">Taxable Value</th>
                  <th colSpan={2} className="py-1 px-2 border-r border-slate-900">Central Tax (CGST)</th>
                  <th colSpan={2} className="py-1 px-2 border-r border-slate-900">State Tax (SGST)</th>
                  <th colSpan={2} className="py-1 px-2 border-r border-slate-900">Integrated Tax (IGST)</th>
                  <th rowSpan={2} className="py-1.5 px-3 text-right w-28">Total Tax</th>
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
                {quotationHsnBreakdown.map((row) => (
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

                <tr className="border-b border-slate-900 font-bold bg-slate-50">
                  <td className="py-1.5 px-2 border-r border-slate-900 text-center uppercase">Total</td>
                  <td className="py-1.5 px-3 border-r border-slate-900 text-right font-mono">
                    ₹{quotationHsnBreakdown.reduce((acc, r) => acc + r.taxable, 0).toFixed(2)}
                  </td>
                  <td className="py-1.5 px-2 border-r border-slate-900"></td>
                  <td className="py-1.5 px-2 border-r border-slate-900 text-right font-mono">
                    ₹{cgstTotal.toFixed(2)}
                  </td>
                  <td className="py-1.5 px-2 border-r border-slate-900"></td>
                  <td className="py-1.5 px-2 border-r border-slate-900 text-right font-mono">
                    ₹{sgstTotal.toFixed(2)}
                  </td>
                  <td className="py-1.5 px-2 border-r border-slate-900"></td>
                  <td className="py-1.5 px-2 border-r border-slate-900 text-right font-mono">
                    ₹{igstTotal.toFixed(2)}
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono font-black">
                    ₹{totalTax.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Company Bank Details (Left) & Terms & Conditions (Right) */}
          <div className="grid grid-cols-1 md:grid-cols-12 border-b-2 border-slate-900">
            {/* Bank Details */}
            <div className="md:col-span-6 p-3 border-b md:border-b-0 md:border-r-2 border-slate-900 space-y-1 text-xs">
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block mb-1">
                COMPANY BANK DETAILS
              </span>
              <p className="text-slate-800">
                Bank Name: <strong>{companyProfile?.bank_name || 'HDFC Bank Ltd.'}</strong>
              </p>
              <p className="text-slate-800">
                Account Name: <strong>{companyProfile?.company_name || 'Odias ERP Technologies Pvt. Ltd.'}</strong>
              </p>
              <p className="text-slate-800">
                Account No: <strong className="font-mono">{companyProfile?.bank_account_no || '50200088991122'}</strong>
              </p>
              <p className="text-slate-800">
                IFSC Code: <strong className="font-mono">{companyProfile?.bank_ifsc || 'HDFC0001234'}</strong>
              </p>
              <p className="text-slate-800">
                Branch: <strong>{companyProfile?.bank_branch || 'Bhubaneswar Main Branch'}</strong>
              </p>
            </div>

            {/* Terms & Conditions */}
            <div className="md:col-span-6 p-3 space-y-1 text-xs">
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block mb-1">
                TERMS & CONDITIONS
              </span>
              <ol className="list-decimal list-inside space-y-0.5 text-slate-700 leading-snug text-[11px]">
                <li>Payment must be made according to the agreed payment terms.</li>
                <li>Quotation is valid only for the specified validity period.</li>
                <li>Prices are subject to applicable GST taxes.</li>
                <li>Delivery will be made according to the agreed schedule.</li>
                <li>Any additional work or requirements may be charged separately.</li>
                <li>Goods/services once confirmed cannot be cancelled without mutual agreement.</li>
                <li>Any dispute will be subject to the applicable jurisdiction.</li>
              </ol>
            </div>
          </div>

          {/* Signatory Box */}
          <div className="p-4 grid grid-cols-1 md:grid-cols-12 items-end">
            <div className="md:col-span-6 space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider block">
                Subject to Local Jurisdiction
              </span>
              <p className="text-[10px] text-slate-500">
                This is an official sales proposal/quotation issued by {companyProfile?.company_name || 'Odias ERP Technologies Pvt. Ltd.'}
              </p>
            </div>

            <div className="md:col-span-6 text-right space-y-2">
              <p className="text-xs font-bold text-slate-950 uppercase">
                For {companyProfile?.company_name || 'ODIAS ERP TECHNOLOGIES PVT. LTD.'}
              </p>
              <span className="text-[10px] text-slate-500 block">Authorized Signatory</span>

              {/* Stamp & Signature Images */}
              <div className="h-20 flex items-center justify-end space-x-4 pr-2">
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
                  Signature & Company Seal
                </span>
              </div>
            </div>
          </div>

          {/* Navy Footer Bar */}
          <div className="bg-blue-950 text-white p-2.5 text-center text-[11px] font-medium border-t-2 border-slate-900">
            Thank You For Your Business! | {companyProfile?.company_name || 'Odias ERP Technologies Pvt. Ltd.'} | Contact: {companyProfile?.phone || '+91 1234567890'} | Email: {companyProfile?.email || 'accounts@odiaserp.com'}
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
            <ShoppingBag className="w-7 h-7 text-blue-600 mr-2.5" />
            Quotations & Commercial Estimates
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Build proposals, apply discounts, and convert accepted estimates to tax invoices with zero data loss.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-sm shadow-blue-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create Quotation
        </button>
      </div>

      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mr-2" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-xs underline text-emerald-700 cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Quotations DataTable */}
      <DataTable<Quotation>
        data={filteredQuotations}
        columns={columns}
        searchPlaceholder="Search quotations by number, customer..."
        filterComponent={
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Quotations</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent to Client</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="converted">Converted to Invoice</option>
            </select>
          </div>
        }
      />
    </div>
  );
};
