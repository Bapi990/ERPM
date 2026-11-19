import React, { useState, useEffect } from 'react';
import {
  Layers, Package, AlertTriangle, ArrowUpDown, Plus, Search,
  Filter, CheckCircle2, Building2, RefreshCw, Eye
} from 'lucide-react';
import { api } from '../../api/client';
import { useRealtime } from '../../context/RealtimeContext';
import { Modal } from '../../components/common/Modal';
import type { ProductService, StockLedgerItem, Warehouse } from '../../types';

export const InventoryStockPage: React.FC = () => {
  const { emitEvent } = useRealtime();
  const [products, setProducts] = useState<ProductService[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'ledger'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal
  const [adjustModal, setAdjustModal] = useState(false);
  const [adjForm, setAdjForm] = useState({
    product_id: '',
    warehouse_id: '',
    adjustment_type: 'add',
    quantity: 5,
    reason: 'Physical count audit',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [pRes, lRes, wRes] = await Promise.all([
        api.getProducts(),
        api.getStockLedger(),
        api.getWarehouses(),
      ]);
      const prods = pRes?.results || pRes || [];
      setProducts(prods);
      setLedger(lRes?.results || lRes || []);
      const wh = wRes?.results || wRes || [];
      setWarehouses(wh);
      if (prods.length > 0 && !adjForm.product_id) {
        setAdjForm(prev => ({ ...prev, product_id: prods[0].id, warehouse_id: wh[0]?.id || '' }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.adjustProductStock(adjForm.product_id, {
        warehouse: adjForm.warehouse_id,
        adjustment_type: adjForm.adjustment_type,
        quantity: Number(adjForm.quantity),
        reason: adjForm.reason,
      });
      emitEvent('stock_adjusted', 'Stock Adjusted', `Inventory quantity modified manually`, 'info');
      showToast('Stock adjustment recorded successfully!');
      setAdjustModal(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      showToast(err?.response?.data?.detail || 'Failed to adjust stock');
    }
  };

  const physicalProducts = products.filter(p => p.item_type === 'product');
  const totalStockValuation = physicalProducts.reduce((sum, p) => sum + (Number(p.unit_price || 0) * Number((p as any).current_stock ?? 20)), 0);
  const lowStockCount = physicalProducts.filter(p => Number((p as any).current_stock ?? 20) <= Number((p as any).min_stock_alert ?? 5)).length;

  const filteredProducts = physicalProducts.filter(p =>
    (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.hsn_sac || '').toLowerCase().includes(searchQuery.toLowerCase())
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
          <h1 className="text-2xl font-bold text-gray-900">Inventory & Stock Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time stock valuation, warehouse depository tracking, reorder levels, and automated inward/outward ledger.
          </p>
        </div>
        <button
          onClick={() => setAdjustModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-primary-500/20"
        >
          <Plus size={16} />
          Stock Adjustment
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Inventory Stock Valuation</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">₹{totalStockValuation.toLocaleString('en-IN')}</p>
            <p className="text-xs text-primary-600 mt-1">{physicalProducts.length} Product lines</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Package size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Low Stock Warnings</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{lowStockCount} Items</p>
            <p className="text-xs text-amber-600 mt-1">Below minimum threshold</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Warehouses</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{warehouses.length} Hubs</p>
            <p className="text-xs text-purple-600 mt-1">Bhubaneswar, Mumbai, BLR</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Building2 size={24} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Stock Overview & Valuation ({physicalProducts.length})
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'ledger'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Automated Stock Movement Ledger ({ledger.length})
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50/80 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3 px-4">Item & SKU</th>
                  <th className="py-3 px-4">HSN Code</th>
                  <th className="py-3 px-4">Depository Warehouse</th>
                  <th className="py-3 px-4">Selling Price</th>
                  <th className="py-3 px-4">Stock on Hand</th>
                  <th className="py-3 px-4">Asset Valuation</th>
                  <th className="py-3 px-4 text-right">Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((p) => {
                  const stock = Number((p as any).current_stock || 0);
                  const minAlert = Number((p as any).min_stock_alert || 5);
                  const isLow = stock <= minAlert;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-400 font-mono">SKU: {p.sku}</p>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs font-bold text-gray-700">
                        {p.hsn_sac}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-600">
                        {(p as any).warehouse_name || 'Central Depository'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-gray-900 text-xs">
                        ₹{Number(p.unit_price).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                          isLow ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {stock} {p.unit}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-primary-600 text-xs">
                        ₹{(stock * Number(p.unit_price)).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                          isLow ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isLow ? 'Low Stock' : 'Optimal'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Ledger */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50/80 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Product Item</th>
                  <th className="py-3 px-4">Transaction Type</th>
                  <th className="py-3 px-4">Reference Document</th>
                  <th className="py-3 px-4">Movement Qty</th>
                  <th className="py-3 px-4 text-right">Balance After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ledger.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 text-xs text-gray-500">
                      {new Date(l.created_at).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-gray-900 text-xs">{l.product_name}</p>
                      <p className="text-[11px] text-gray-400 font-mono">{l.product_sku}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 text-xs font-bold rounded bg-gray-100 text-gray-700 capitalize">
                        {l.transaction_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs font-bold text-primary-600">
                      {l.reference_number}
                    </td>
                    <td className={`py-3 px-4 font-bold text-xs ${
                      Number(l.quantity) > 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {Number(l.quantity) > 0 ? `+${l.quantity}` : l.quantity}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900 text-xs">
                      {l.balance_stock_after}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Stock Adjustment */}
      <Modal
        isOpen={adjustModal}
        onClose={() => setAdjustModal(false)}
        title="Physical Inventory Adjustment"
      >
        <form onSubmit={handleAdjustStock} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Select Product *</label>
            <select
              required
              value={adjForm.product_id}
              onChange={(e) => setAdjForm({ ...adjForm, product_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
            >
              {physicalProducts.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} (Current: {(p as any).current_stock ?? 0} {p.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Warehouse *</label>
              <select
                required
                value={adjForm.warehouse_id}
                onChange={(e) => setAdjForm({ ...adjForm, warehouse_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              >
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Adjustment Action *</label>
              <select
                value={adjForm.adjustment_type}
                onChange={(e) => setAdjForm({ ...adjForm, adjustment_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              >
                <option value="add">Add Stock (Found / Audit excess)</option>
                <option value="subtract">Deduct Stock (Shortage / Adjustment)</option>
                <option value="damaged">Damaged / Scrap Write-off</option>
                <option value="expired">Expired Goods</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Quantity to Adjust *</label>
            <input
              type="number"
              min="1"
              required
              value={adjForm.quantity}
              onChange={(e) => setAdjForm({ ...adjForm, quantity: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Reason & Audit Justification *</label>
            <textarea
              rows={2}
              required
              placeholder="e.g. Annual physical inventory reconciliation count..."
              value={adjForm.reason}
              onChange={(e) => setAdjForm({ ...adjForm, reason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setAdjustModal(false)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-primary-500/20"
            >
              Confirm Stock Adjustment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
