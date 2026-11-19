import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag, Plus, ArrowRight, CheckCircle2, Eye, Calendar,
  Building2, Filter, Truck, DollarSign, Clock, ArrowLeft, Trash2, Printer, AlertCircle, Check
} from 'lucide-react';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable, ColumnDef } from '../../components/common/DataTable';
import { useRealtime } from '../../context/RealtimeContext';
import type { Customer, ProductService, HSNMaster, SACMaster } from '../../types';

interface OrderLineItem {
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
  { id: '1', text: 'Delivery timeline starts from the date of confirmed advance receipt / PO issuance.', checked: true },
  { id: '2', text: 'Prices are subject to applicable GST taxes at current statutory rates.', checked: true },
  { id: '3', text: 'Goods once manufactured/dispatched cannot be cancelled without written consent.', checked: true },
  { id: '4', text: 'Standard manufacturer warranty applies to all delivered hardware and perpetual licenses.', checked: true },
  { id: '5', text: 'Transit insurance is covered up to destination customer premises.', checked: true },
  { id: '6', text: 'Any commercial dispute is subject to local state judicial jurisdiction.', checked: true },
];

interface SalesOrderItem {
  id?: string;
  product?: string;
  item_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
}

interface SalesOrder {
  id: string;
  order_number: string;
  customer: string;
  customer_name?: string;
  customer_email?: string;
  customer_gstin?: string;
  order_date: string;
  delivery_date: string;
  expected_delivery_date?: string;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  total_tax: number;
  total_amount: number;
  status: 'draft' | 'confirmed' | 'partial' | 'fulfilled' | 'cancelled';
  notes?: string;
  items?: SalesOrderItem[];
}

export const SalesOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<ProductService[]>([]);
  const [loading, setLoading] = useState(true);

  // View & Create Full-Page States
  const [isCreating, setIsCreating] = useState(false);
  const [viewOrder, setViewOrder] = useState<SalesOrder | null>(null);

  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { emitEvent } = useRealtime();

  // Full-Page New Sales Order Form State
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('Standard delivery via logistics partner with insurance.');
  const [termsList, setTermsList] = useState<TermItem[]>(DEFAULT_TERMS);
  const [hsnList, setHsnList] = useState<HSNMaster[]>([]);
  const [sacList, setSacList] = useState<SACMaster[]>([]);

  const [items, setItems] = useState<OrderLineItem[]>([
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [orderRes, custRes, prodRes, hRes, sRes] = await Promise.all([
        api.getSalesOrders(),
        api.getCustomers(),
        api.getProducts(),
        api.getHSNMaster(),
        api.getSACMaster(),
      ]);
      const oList = orderRes.results || orderRes || [];
      setOrders(oList);
      const cList = custRes.results || custRes || [];
      setCustomers(cList);
      if (cList.length > 0 && !selectedCustomer) {
        setSelectedCustomer(cList[0].id);
      }
      setProducts(prodRes.results || prodRes || []);
      setHsnList(hRes?.results || hRes || []);
      setSacList(sRes?.results || sRes || []);

      // Auto-generate next Sales Order number
      const soNum = `SO/2026-27/${String(oList.length + 15).padStart(5, '0')}`;
      setOrderNumber(soNum);
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

  const handleTermTextChange = (id: string, text: string) => {
    setTermsList((prev) =>
      prev.map((t) => (t.id === id ? { ...t, text } : t))
    );
  };

  const handleAddCustomTerm = () => {
    const newId = String(Date.now());
    setTermsList([
      ...termsList,
      { id: newId, text: 'Custom order fulfillment term agreed with customer.', checked: true },
    ]);
  };

  // Realtime Tax and Financial Calculations
  const calculationSummary = useMemo(() => {
    let grossSubtotal = 0;
    let totalDiscount = 0;
    let taxableTotal = 0;
    let totalTax = 0;

    const cust = customers.find((c) => c.id === selectedCustomer);
    const isInterState = cust?.state && cust.state.toLowerCase() !== 'odisha';

    items.forEach((item) => {
      const qty = Number(item.quantity || 0);
      const rate = Number(item.unit_price || 0);
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
  }, [items, selectedCustomer, customers]);

  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      alert('Please select a customer.');
      return;
    }
    try {
      const activeTerms = termsList
        .filter((t) => t.checked)
        .map((t, idx) => `${idx + 1}. ${t.text}`)
        .join('\n');

      const payload = {
        customer: selectedCustomer,
        order_number: orderNumber,
        order_date: orderDate,
        expected_delivery_date: deliveryDate,
        delivery_date: deliveryDate,
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
            item_name: it.item_name || (products.find((p) => p.id === it.product)?.name) || 'Product Item',
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

      const created = await api.createSalesOrder(payload);
      setIsCreating(false);
      showToast('Sales Order booked successfully and queued for fulfillment.');
      emitEvent('billing.sales_order_created', 'Sales Order Booked', `Sales Order ${orderNumber} created.`, 'info');
      loadData();
      setViewOrder(created);
    } catch (err: any) {
      alert(err.message || 'Sales Order creation failed');
    }
  };

  const handleConvertToInvoice = async (order: SalesOrder) => {
    if (!confirm(`Convert Sales Order ${order.order_number} directly into an issued Tax Invoice?`)) return;
    try {
      const invoiceData = {
        customer: order.customer,
        sales_order: order.id,
        items: (order.items && order.items.length > 0)
          ? order.items.map(it => ({
              product: it.product,
              item_name: it.item_name,
              quantity: it.quantity,
              unit: it.unit || 'NOS',
              unit_price: it.unit_price,
              tax_rate: it.tax_rate || 18,
            }))
          : [{ item_name: `Order ${order.order_number} Fulfillment`, quantity: 1, unit_price: order.subtotal, tax_rate: 18 }],
        notes: `Converted from Sales Order ${order.order_number}.`,
        status: 'issued',
      };
      await api.createInvoice(invoiceData);
      showToast(`Tax Invoice successfully generated for ${order.order_number}!`);
      emitEvent('billing.invoice_created', 'Tax Invoice Issued', `Generated Tax Invoice from Order ${order.order_number}`, 'success');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Invoice generation from order failed');
    }
  };

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const totalVal = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    const pendingOrders = orders.filter(o => o.status === 'draft' || o.status === 'confirmed').length;
    const fulfilledOrders = orders.filter(o => o.status === 'fulfilled').length;
    return { totalOrders, totalVal, pendingOrders, fulfilledOrders };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') return orders;
    return orders.filter(o => o.status === statusFilter);
  }, [orders, statusFilter]);

  const columns: ColumnDef<SalesOrder>[] = [
    {
      key: 'order_number',
      header: 'Order #',
      render: (o) => <span className="font-mono font-bold text-slate-900">{o.order_number}</span>,
    },
    {
      key: 'customer_name',
      header: 'Customer',
      render: (o) => (
        <div>
          <span className="font-bold text-slate-900 block">{o.customer_name || 'Enterprise Client'}</span>
          <span className="text-[11px] text-slate-400 font-mono">{o.customer_gstin || 'GSTIN Registered'}</span>
        </div>
      ),
    },
    {
      key: 'order_date',
      header: 'Order Date',
      render: (o) => <span className="font-mono text-slate-600 text-xs">{o.order_date}</span>,
    },
    {
      key: 'delivery_date',
      header: 'Est. Delivery',
      render: (o) => (
        <span className="font-mono text-blue-600 font-semibold text-xs flex items-center">
          <Truck className="w-3.5 h-3.5 mr-1 text-blue-500" />
          {o.expected_delivery_date || o.delivery_date}
        </span>
      ),
    },
    {
      key: 'subtotal',
      header: 'Taxable Subtotal',
      accessor: (o) => Number(o.subtotal),
      render: (o) => <span className="font-mono text-slate-700">₹{Number(o.subtotal).toLocaleString('en-IN')}</span>,
    },
    {
      key: 'total_amount',
      header: 'Grand Total',
      accessor: (o) => Number(o.total_amount),
      render: (o) => (
        <span className="font-mono font-extrabold text-slate-900 text-sm">
          ₹{Number(o.total_amount).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (o) => <StatusBadge status={o.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      sortable: false,
      render: (o) => (
        <div className="flex items-center justify-end space-x-1.5">
          <button
            onClick={() => setViewOrder(o)}
            className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200/80 transition-colors cursor-pointer"
            title="View Order Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          {o.status !== 'fulfilled' && (
            <button
              onClick={() => handleConvertToInvoice(o)}
              className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              title="Convert to Tax Invoice"
            >
              <span>Invoice</span>
              <ArrowRight className="w-3 h-3 ml-1" />
            </button>
          )}
        </div>
      ),
    },
  ];

  // ----------------------------------------------------
  // FULL PAGE VIEW: NEW SALES ORDER (Matching media_1794806738467_07640226.png)
  // ----------------------------------------------------
  if (isCreating) {
    return (
      <div className="space-y-6 pb-20 animate-in fade-in duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">New Sales Order</h1>
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

        <form onSubmit={handleSaveOrder} className="space-y-6">
          {/* Card 1: Order Parameters */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Order Parameters
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
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Order Number *</label>
                <input
                  type="text"
                  required
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="w-full text-xs font-mono font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Order Date *</label>
                <input
                  type="date"
                  required
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="w-full text-xs font-mono font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Target Delivery Date *</label>
                <input
                  type="date"
                  required
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
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
                            list="so-hsn-sac-list"
                            placeholder="HSN/SAC"
                            value={item.hsn_sac}
                            onChange={(e) => handleItemChange(idx, 'hsn_sac', e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-300 bg-white text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <datalist id="so-hsn-sac-list">
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
                    placeholder="Enter dispatch notes / comments..."
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
                  Select the terms & conditions to include in this sales order. Unchecked terms will not be displayed on the order confirmation.
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
              Save Sales Order
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ----------------------------------------------------
  // FULL PAGE VIEW: VIEW SALES ORDER
  // ----------------------------------------------------
  if (viewOrder) {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setViewOrder(null)}
              className="inline-flex items-center px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5 text-slate-500" />
              <span>Back to Sales Orders</span>
            </button>
            <div className="h-5 w-px bg-slate-300 hidden sm:block" />
            <span className="text-xs text-slate-500 font-mono hidden sm:inline">
              Billing / Sales Orders / {viewOrder.order_number}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {viewOrder.status !== 'fulfilled' && (
              <button
                onClick={() => handleConvertToInvoice(viewOrder)}
                className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
              >
                <ArrowRight className="w-4 h-4 mr-1.5" />
                <span>Generate Official Tax Invoice</span>
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

        {/* Order Details Header Box */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
          <div className="flex flex-col md:flex-row justify-between gap-6 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {viewOrder.order_number}
                </span>
                <StatusBadge status={viewOrder.status} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-2">
                {viewOrder.customer_name || 'Enterprise Customer'}
              </h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                GSTIN: {viewOrder.customer_gstin || '27AAECG1234A1Z5'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 text-xs text-right">
              <div>
                <span className="text-slate-400 block font-semibold">Order Date</span>
                <span className="font-mono font-bold text-slate-900">{viewOrder.order_date}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Target Delivery</span>
                <span className="font-mono font-bold text-blue-600">{viewOrder.expected_delivery_date || viewOrder.delivery_date}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Taxable Subtotal</span>
                <span className="font-mono font-bold text-slate-900">₹{Number(viewOrder.subtotal).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Total Order Value</span>
                <span className="font-mono font-extrabold text-slate-900 text-sm">
                  ₹{Number(viewOrder.total_amount).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mt-6">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Order Line Items</h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Item / Service</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price (₹)</th>
                    <th className="py-2.5 px-3 text-center">Tax %</th>
                    <th className="py-2.5 px-3 text-right">Tax Amount (₹)</th>
                    <th className="py-2.5 px-3 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viewOrder.items && viewOrder.items.length > 0 ? (
                    viewOrder.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{item.item_name}</td>
                        <td className="py-2.5 px-3 text-center font-mono">{Number(item.quantity)} {item.unit || 'NOS'}</td>
                        <td className="py-2.5 px-3 text-right font-mono">₹{Number(item.unit_price).toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3 text-center font-mono">{item.tax_rate}%</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-500">₹{Number(item.tax_amount || 0).toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">₹{Number(item.total).toLocaleString('en-IN')}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-3 px-3 text-slate-400 italic text-center">
                        Consolidated Order Package (₹{Number(viewOrder.total_amount).toLocaleString('en-IN')})
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {viewOrder.notes && (
            <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <span className="font-bold text-slate-700 block mb-1">Fulfillment Notes & Commercial Terms</span>
              <p className="text-slate-600 whitespace-pre-line">{viewOrder.notes}</p>
            </div>
          )}
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
            <ShoppingBag className="w-7 h-7 text-blue-600 mr-2.5" />
            Sales Orders & Bookings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track confirmed customer orders, monitor dispatch commitments, and generate tax invoices upon delivery.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-sm shadow-blue-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create Sales Order
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Bookings</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">{stats.totalOrders}</p>
          <span className="text-[11px] text-slate-400 font-medium">Lifetime sales orders</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Booked Value</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">₹{stats.totalVal.toLocaleString('en-IN')}</p>
          <span className="text-[11px] text-emerald-600 font-medium">Total pipeline value</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Pending Fulfillment</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2 font-mono">{stats.pendingOrders}</p>
          <span className="text-[11px] text-slate-400 font-medium">Orders awaiting dispatch</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Fulfilled Orders</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-700 mt-2 font-mono">{stats.fulfilledOrders}</p>
          <span className="text-[11px] text-slate-400 font-medium">Invoiced and completed</span>
        </div>
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

      {/* Orders Table */}
      <DataTable<SalesOrder>
        data={filteredOrders}
        columns={columns}
        searchPlaceholder="Search by order #, customer, GSTIN..."
        filterComponent={
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Orders</option>
              <option value="draft">Draft</option>
              <option value="confirmed">Confirmed</option>
              <option value="partial">Partially Fulfilled</option>
              <option value="fulfilled">Fulfilled</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        }
      />
    </div>
  );
};
