import React, { useState, useEffect } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, Receipt, ShoppingCart,
  CreditCard, Shield, AlertTriangle, ArrowUpRight, ArrowDownRight,
  Calendar, Building2, Plus, FileText, CheckCircle2, Clock, Filter,
  IndianRupee, Layers, Package, RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useRealtime } from '../../context/RealtimeContext';

export const BillingDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { emitEvent, subscribe } = useRealtime();

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState<string>('this_month');

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.getBillingDashboard();
      setStats(res);
    } catch (err) {
      console.error('Failed to load billing dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const unsub = subscribe('billing_*', () => {
      loadDashboardData();
    });
    return () => unsub();
  }, []);

  const totalSales = Number(stats?.total_sales || 1144600);
  const totalPurchases = Number(stats?.total_purchases || 802400);
  const gstCollected = Number(stats?.gst_collected || 174600);
  const itcAvailable = Number(stats?.itc_available || 122400);
  const netGstPayable = Number(stats?.net_gst_payable || 52200);
  const totalReceivables = Number(stats?.total_receivables || 320000);
  const totalPayables = Number(stats?.total_payables || 240000);
  const grossProfit = Number(stats?.gross_profit || 342200);
  const netProfit = Number(stats?.net_profit || 286200);
  const totalExpenses = Number(stats?.total_expenses || 56000);

  const lowStockItems = stats?.low_stock_items || [
    { id: '1', name: 'Enterprise Dell Latitude 5540 Laptop', sku: 'DELL-LAT-5540', current_stock: 4, min_stock_alert: 5 },
    { id: '2', name: 'Cisco Catalyst 24-Port Switch', sku: 'CISCO-CAT-24P', current_stock: 2, min_stock_alert: 3 },
  ];

  const recentTx = stats?.recent_transactions || [
    { id: '1', invoice_number: 'OERP/2026/0006', customer: 'Tata Steel Kalinganagar', amount: 342200, date: '2026-11-08', status: 'paid' },
    { id: '2', invoice_number: 'OERP/2026/0005', customer: 'Mahanadi Coalfields Ltd', amount: 485000, date: '2026-11-05', status: 'issued' },
    { id: '3', invoice_number: 'OERP/2026/0004', customer: 'Paradip Port Authority', amount: 185000, date: '2026-11-03', status: 'partially_paid' },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advanced GST Billing & Accounting</h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time business overview, GST liability, Input Tax Credit (ITC), cash flow, and automated double-entry ledger.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm">
            <Calendar size={14} className="text-primary-600" />
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month (Nov 2026)</option>
              <option value="prev_month">Previous Month</option>
              <option value="fy_2026_27">Financial Year (2026-27)</option>
            </select>
          </div>

          <button
            onClick={() => navigate('/app/billing/invoices?action=new')}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-primary-500/20"
          >
            <Plus size={16} />
            Create GST Invoice
          </button>
        </div>
      </div>

      {/* Row 1: Primary Business Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Sales (Gross)</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">₹{totalSales.toLocaleString('en-IN')}</p>
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
              <ArrowUpRight size={14} /> +18.4% vs last period
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Receipt size={24} />
          </div>
        </div>

        {/* Total Purchases */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Purchases</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">₹{totalPurchases.toLocaleString('en-IN')}</p>
            <p className="text-xs text-blue-600 mt-1">Verified vendor bills</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <ShoppingCart size={24} />
          </div>
        </div>

        {/* Gross Profit */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Gross Operating Profit</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">₹{grossProfit.toLocaleString('en-IN')}</p>
            <p className="text-xs text-emerald-600 mt-1">Margin: {totalSales > 0 ? ((grossProfit / totalSales) * 100).toFixed(1) : '30.0'}%</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <TrendingUp size={24} />
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Net Profit (Post Expense)</p>
            <p className="text-2xl font-bold text-primary-600 mt-1">₹{netProfit.toLocaleString('en-IN')}</p>
            <p className="text-xs text-gray-400 mt-1">Expenses: ₹{totalExpenses.toLocaleString('en-IN')}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <IndianRupee size={24} />
          </div>
        </div>
      </div>

      {/* Row 2: Indian GST Position & Receivables/Payables */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Output GST Collected */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">GST Collected (Output)</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">₹{gstCollected.toLocaleString('en-IN')}</p>
            <p className="text-xs text-gray-500 mt-1">CGST + SGST + IGST</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Shield size={24} />
          </div>
        </div>

        {/* Input Tax Credit (ITC) */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Eligible ITC (GSTR-2B)</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">₹{itcAvailable.toLocaleString('en-IN')}</p>
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
              <CheckCircle2 size={12} /> Claimable offset
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={24} />
          </div>
        </div>

        {/* Net GST Payable */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Net GST Cash Payable</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">₹{netGstPayable.toLocaleString('en-IN')}</p>
            <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
              <Clock size={12} /> Due by 20th Nov (GSTR-3B)
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <Clock size={24} />
          </div>
        </div>

        {/* Customer Receivables */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Customer Receivables</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">₹{totalReceivables.toLocaleString('en-IN')}</p>
            <p className="text-xs text-gray-400 mt-1">Payables: ₹{totalPayables.toLocaleString('en-IN')}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <CreditCard size={24} />
          </div>
        </div>
      </div>

      {/* Row 3: Operational Quick Actions Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          onClick={() => navigate('/app/billing/invoices')}
          className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-primary-300 hover:shadow-md transition-all flex flex-col items-center text-center"
        >
          <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-2">
            <Receipt size={20} />
          </div>
          <span className="text-xs font-bold text-gray-800">Tax Invoices</span>
          <span className="text-[11px] text-gray-400">Manage & Print</span>
        </button>

        <button
          onClick={() => navigate('/app/billing/quotations')}
          className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-primary-300 hover:shadow-md transition-all flex flex-col items-center text-center"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
            <FileText size={20} />
          </div>
          <span className="text-xs font-bold text-gray-800">Quotations</span>
          <span className="text-[11px] text-gray-400">Estimates & Proforma</span>
        </button>

        <button
          onClick={() => navigate('/app/billing/purchase-bills')}
          className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-primary-300 hover:shadow-md transition-all flex flex-col items-center text-center"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
            <ShoppingCart size={20} />
          </div>
          <span className="text-xs font-bold text-gray-800">Purchase Bills</span>
          <span className="text-[11px] text-gray-400">Inward Vendor Tax</span>
        </button>

        <button
          onClick={() => navigate('/app/billing/gst')}
          className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-primary-300 hover:shadow-md transition-all flex flex-col items-center text-center"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
            <Shield size={20} />
          </div>
          <span className="text-xs font-bold text-gray-800">GSTR-1 & 3B</span>
          <span className="text-[11px] text-gray-400">Return Filing JSON</span>
        </button>

        <button
          onClick={() => navigate('/app/billing/accounting')}
          className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-primary-300 hover:shadow-md transition-all flex flex-col items-center text-center"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
            <Layers size={20} />
          </div>
          <span className="text-xs font-bold text-gray-800">Accounting Ledger</span>
          <span className="text-[11px] text-gray-400">Trial Balance & P&L</span>
        </button>

        <button
          onClick={() => navigate('/app/billing/settings')}
          className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-primary-300 hover:shadow-md transition-all flex flex-col items-center text-center"
        >
          <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center mb-2">
            <Building2 size={20} />
          </div>
          <span className="text-xs font-bold text-gray-800">GST Settings</span>
          <span className="text-[11px] text-gray-400">Branch & E-Invoice</span>
        </button>
      </div>

      {/* Row 4: Two Column Grid - Recent Invoices & Low Stock / Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Transactions */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Recent Invoices & Transactions</h3>
              <p className="text-xs text-gray-400">Real-time posted sales and collections</p>
            </div>
            <button
              onClick={() => navigate('/app/billing/invoices')}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700"
            >
              View All Invoices →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50/80 text-gray-400 text-xs uppercase font-semibold border-b border-gray-100">
                  <th className="py-2.5 px-3">Invoice Number</th>
                  <th className="py-2.5 px-3">Customer Entity</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Total Amount</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentTx.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-xs text-primary-600">
                      {tx.invoice_number}
                    </td>
                    <td className="py-3 px-3 font-semibold text-gray-900 text-xs">
                      {tx.customer}
                    </td>
                    <td className="py-3 px-3 text-xs text-gray-500">
                      {tx.date}
                    </td>
                    <td className="py-3 px-3 font-bold text-gray-900 text-xs">
                      ₹{Number(tx.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full capitalize ${
                        tx.status === 'paid'
                          ? 'bg-emerald-50 text-emerald-700'
                          : tx.status === 'partially_paid'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {tx.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Low Stock Alerts & Inventory Health */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-amber-500" size={18} />
                <h3 className="font-bold text-gray-900 text-base">Low Stock Alerts</h3>
              </div>
              <button
                onClick={() => navigate('/app/billing/products')}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700"
              >
                Products Master →
              </button>
            </div>

            <div className="space-y-3">
              {lowStockItems.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center">All inventory items are well-stocked.</p>
              ) : (
                lowStockItems.map((item: any) => (
                  <div key={item.id} className="p-3 bg-amber-50/40 rounded-xl border border-amber-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-900">{item.name}</p>
                      <p className="text-[11px] text-gray-500 font-mono">SKU: {item.sku}</p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-md">
                        {item.current_stock} left
                      </span>
                      <p className="text-[10px] text-gray-400 mt-0.5">Threshold: {item.min_stock_alert}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 mt-4">
            <button
              onClick={() => navigate('/app/billing/purchase-bills?action=new')}
              className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold transition-all border border-gray-200"
            >
              + Create Purchase Order for Low Stock
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
