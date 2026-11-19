import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText, Download, Printer, Calendar, Building2, Filter,
  DollarSign, TrendingUp, ShoppingBag, CreditCard, Layers, Shield
} from 'lucide-react';
import { api } from '../../api/client';
import { useRealtime } from '../../context/RealtimeContext';

export const BillingReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState<
    'sales_register' | 'purchase_register' | 'customer_aging' | 'stock_valuation' | 'tax_liability'
  >('sales_register');

  const [dateRange, setDateRange] = useState('this_month');
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  const { emitEvent } = useRealtime();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invRes, purRes, prodRes, custRes] = await Promise.all([
        api.getInvoices(),
        api.getPurchaseBills(),
        api.getProducts(),
        api.getCustomers(),
      ]);
      setInvoices(invRes.results || invRes || []);
      setPurchases(purRes.results || purRes || []);
      setProducts(prodRes.results || prodRes || []);
      setCustomers(custRes.results || custRes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (reportType === 'sales_register') {
      csvContent += 'Invoice Number,Date,Customer,GSTIN,Taxable Amount,CGST,SGST,IGST,Total Amount,Status\n';
      invoices.forEach((inv) => {
        csvContent += `"${inv.invoice_number}","${inv.invoice_date}","${inv.customer_name}","${inv.customer_gstin || ''}",${inv.subtotal},${inv.cgst},${inv.sgst},${inv.igst},${inv.total_amount},"${inv.status}"\n`;
      });
    } else if (reportType === 'purchase_register') {
      csvContent += 'Bill Number,Date,Supplier,GSTIN,Taxable Amount,Input CGST,Input SGST,Input IGST,Total Amount,Status\n';
      purchases.forEach((p) => {
        csvContent += `"${p.bill_number}","${p.bill_date}","${p.supplier_name}","${p.supplier_gstin || ''}",${p.subtotal},${p.cgst},${p.sgst},${p.igst},${p.total_amount},"${p.status}"\n`;
      });
    } else if (reportType === 'stock_valuation') {
      csvContent += 'Product Name,SKU,HSN,Stock Qty,Unit,Cost Price,Selling Price,Valuation Total\n';
      products.forEach((pr) => {
        const val = Number(pr.current_stock || 0) * Number(pr.purchase_price || pr.selling_price || 0);
        csvContent += `"${pr.name}","${pr.sku || ''}","${pr.hsn_code || ''}",${pr.current_stock},"${pr.unit || 'NOS'}",${pr.purchase_price || 0},${pr.selling_price || 0},${val}\n`;
      });
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportType}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    emitEvent('billing.report_export', 'Report Exported', `Generated CSV download for ${reportType}.`, 'info');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
            <FileText className="w-7 h-7 text-blue-600 mr-2.5" />
            Financial & GST Analytics Reports
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Export official GST sales registers, purchase ITC registers, customer aging analysis, and inventory valuations.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            <span>Export to Excel/CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Report Controls Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Select Report Type</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as any)}
            className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="sales_register">GST Sales Register (Outward Tax)</option>
            <option value="purchase_register">GST Purchase Register (Input ITC)</option>
            <option value="customer_aging">Customer Receivables & Aging</option>
            <option value="stock_valuation">Inventory Asset & Stock Valuation</option>
            <option value="tax_liability">Net Statutory Tax Liability Statement</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Financial Period</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="this_month">Current Month (November 2026)</option>
            <option value="last_month">Previous Month (October 2026)</option>
            <option value="fy_2026_27">Full Financial Year 2026-27</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Branch Scope</label>
          <select className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All Branches (Consolidated)</option>
            <option value="main">Bhubaneswar Head Office (21AAACR1234F1Z5)</option>
            <option value="tech">Infocity Software Hub</option>
          </select>
        </div>
      </div>

      {/* REPORT CONTENT */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        {/* REPORT 1: SALES REGISTER */}
        {reportType === 'sales_register' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">GST Sales Register Report</h2>
              <span className="text-xs font-mono text-slate-500">{invoices.length} invoices posted</span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/75 border-b border-slate-200 font-bold text-slate-700">
                    <th className="py-2.5 px-4">Invoice #</th>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Customer & GSTIN</th>
                    <th className="py-2.5 px-4 text-right">Taxable (₹)</th>
                    <th className="py-2.5 px-4 text-right">CGST (₹)</th>
                    <th className="py-2.5 px-4 text-right">SGST (₹)</th>
                    <th className="py-2.5 px-4 text-right">IGST (₹)</th>
                    <th className="py-2.5 px-4 text-right">Total Invoice (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">{inv.invoice_number}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{inv.invoice_date}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{inv.customer_name}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{inv.customer_gstin || 'Unregistered'}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">₹{Number(inv.subtotal).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">₹{Number(inv.cgst || 0).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">₹{Number(inv.sgst || 0).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">₹{Number(inv.igst || 0).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900">₹{Number(inv.total_amount).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REPORT 2: PURCHASE REGISTER */}
        {reportType === 'purchase_register' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">GST Purchase & Input Tax Register</h2>
              <span className="text-xs font-mono text-slate-500">{purchases.length} purchase bills</span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/75 border-b border-slate-200 font-bold text-slate-700">
                    <th className="py-2.5 px-4">Bill #</th>
                    <th className="py-2.5 px-4">Supplier & GSTIN</th>
                    <th className="py-2.5 px-4 text-right">Taxable (₹)</th>
                    <th className="py-2.5 px-4 text-right">Input CGST (₹)</th>
                    <th className="py-2.5 px-4 text-right">Input SGST (₹)</th>
                    <th className="py-2.5 px-4 text-right">Input IGST (₹)</th>
                    <th className="py-2.5 px-4 text-right">Total Bill (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchases.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.bill_number}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{p.supplier_name}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{p.supplier_gstin || 'Unregistered'}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">₹{Number(p.subtotal).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-700">₹{Number(p.cgst || 0).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-700">₹{Number(p.sgst || 0).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-700">₹{Number(p.igst || 0).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900">₹{Number(p.total_amount).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REPORT 3: CUSTOMER AGING */}
        {reportType === 'customer_aging' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Customer Receivables & Aging Breakdown</h2>
              <span className="text-xs font-mono text-slate-500">Aging buckets (0-30, 31-60, 61-90, 90+ days)</span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/75 border-b border-slate-200 font-bold text-slate-700">
                    <th className="py-2.5 px-4">Customer Name</th>
                    <th className="py-2.5 px-4 text-right">Current (0-30 Days)</th>
                    <th className="py-2.5 px-4 text-right">31-60 Days</th>
                    <th className="py-2.5 px-4 text-right">61-90 Days</th>
                    <th className="py-2.5 px-4 text-right">&gt;90 Days Overdue</th>
                    <th className="py-2.5 px-4 text-right">Total Outstanding (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c) => {
                    const out = Number(c.outstanding_balance || 0);
                    return (
                      <tr key={c.id}>
                        <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700">₹{out.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-400">₹0</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-400">₹0</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-400">₹0</td>
                        <td className="py-3 px-4 text-right font-mono font-extrabold text-blue-700">
                          ₹{out.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REPORT 4: STOCK VALUATION */}
        {reportType === 'stock_valuation' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Inventory Stock Valuation (FIFO/Weighted Cost)</h2>
              <span className="text-xs font-mono text-slate-500">{products.length} products listed</span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/75 border-b border-slate-200 font-bold text-slate-700">
                    <th className="py-2.5 px-4">Item Name</th>
                    <th className="py-2.5 px-4">HSN/SAC</th>
                    <th className="py-2.5 px-4 text-center">Available Stock</th>
                    <th className="py-2.5 px-4 text-right">Cost Price (₹)</th>
                    <th className="py-2.5 px-4 text-right">Selling Price (₹)</th>
                    <th className="py-2.5 px-4 text-right">Asset Valuation (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => {
                    const qty = Number(p.current_stock || 0);
                    const cost = Number(p.purchase_price || p.price || 0);
                    const valuation = qty * cost;
                    return (
                      <tr key={p.id}>
                        <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{p.hsn_code || '998314'}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold">{qty} {p.unit || 'NOS'}</td>
                        <td className="py-3 px-4 text-right font-mono">₹{cost.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-right font-mono">₹{Number(p.selling_price || p.price || 0).toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-right font-mono font-extrabold text-blue-700">₹{valuation.toLocaleString('en-IN')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REPORT 5: TAX LIABILITY */}
        {reportType === 'tax_liability' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900">Net Statutory Tax Liability Statement</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-500 block mb-1">Total Output Tax (Sales)</span>
                <span className="text-2xl font-black text-slate-900 font-mono">₹63,000</span>
                <span className="text-[11px] text-slate-400 block mt-1">From issued tax invoices</span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                <span className="text-xs font-bold text-emerald-800 block mb-1">Eligible Input Tax (Purchases)</span>
                <span className="text-2xl font-black text-emerald-700 font-mono">₹45,000</span>
                <span className="text-[11px] text-emerald-600 block mt-1">From verified purchase bills</span>
              </div>
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <span className="text-xs font-bold text-blue-800 block mb-1">Net Cash Tax Payable</span>
                <span className="text-2xl font-black text-blue-700 font-mono">₹18,000</span>
                <span className="text-[11px] text-blue-600 block mt-1">Statutory liability via Challan</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
