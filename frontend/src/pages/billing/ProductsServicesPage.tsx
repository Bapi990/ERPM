import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, Plus, Search, Filter, CheckCircle2, Download,
  Upload, Layers, AlertTriangle, ShieldCheck, Edit, Trash2, Eye,
  Building2, ArrowUpDown, Hash
} from 'lucide-react';
import { api } from '../../api/client';
import { useRealtime } from '../../context/RealtimeContext';
import { Modal } from '../../components/common/Modal';
import type { ProductService, HSNMaster, SACMaster, Warehouse } from '../../types';

export const ProductsServicesPage: React.FC = () => {
  const navigate = useNavigate();
  const { emitEvent } = useRealtime();
  const [products, setProducts] = useState<ProductService[]>([]);
  const [hsnList, setHsnList] = useState<HSNMaster[]>([]);
  const [sacList, setSacList] = useState<SACMaster[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'services' | 'hsn' | 'sac'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [autofillNotice, setAutofillNotice] = useState<string | null>(null);

  // Modals
  const [addProductModal, setAddProductModal] = useState(false);
  const [addHsnModal, setAddHsnModal] = useState(false);
  const [importHsnModal, setImportHsnModal] = useState(false);

  // Product Form
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    item_type: 'product',
    category: 'Hardware',
    brand: 'In-House',
    hsn_sac: '847130',
    unit: 'NOS',
    purchase_price: 10000,
    unit_price: 15000,
    mrp: 18000,
    tax_rate: 18,
    cess_rate: 0,
    opening_stock: 20,
    min_stock_alert: 5,
    reorder_level: 10,
    warehouse: '',
  });

  const handleHsnSacChange = (codeVal: string) => {
    const clean = codeVal.trim().toLowerCase();
    const matchedHsn = hsnList.find((h) => h.hsn_code.toLowerCase() === clean);
    const matchedSac = sacList.find((s) => s.sac_code.toLowerCase() === clean);
    const matched = matchedHsn || matchedSac;

    if (matched) {
      const rate = Number(matched.applicable_gst_rate);
      const cess = Number(matched.cess_rate || 0);
      setProductForm((prev) => ({
        ...prev,
        hsn_sac: codeVal.trim(),
        tax_rate: rate,
        cess_rate: cess,
      }));
      setAutofillNotice(`✓ GST Rate autofilled to ${rate}% based on ${codeVal.trim()} (${(matched as any).description?.slice(0, 32)}...)`);
    } else {
      setProductForm((prev) => ({ ...prev, hsn_sac: codeVal }));
      setAutofillNotice(null);
    }
  };

  // HSN Form
  const [hsnForm, setHsnForm] = useState({
    hsn_code: '',
    description: '',
    goods_category: 'Electronics',
    applicable_gst_rate: 18,
    cess_rate: 0,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [pRes, hRes, sRes, wRes] = await Promise.all([
        api.getProducts(),
        api.getHSNMaster(),
        api.getSACMaster(),
        api.getWarehouses(),
      ]);
      setProducts(pRes?.results || pRes || []);
      setHsnList(hRes?.results || hRes || []);
      setSacList(sRes?.results || sRes || []);
      const wh = wRes?.results || wRes || [];
      setWarehouses(wh);
      if (wh.length > 0 && !productForm.warehouse) {
        setProductForm(prev => ({ ...prev, warehouse: wh[0].id }));
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

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createProduct({
        ...productForm,
        purchase_price: Number(productForm.purchase_price),
        unit_price: Number(productForm.unit_price),
        mrp: Number(productForm.mrp),
        tax_rate: Number(productForm.tax_rate),
        cess_rate: Number(productForm.cess_rate),
        opening_stock: Number(productForm.opening_stock),
        current_stock: Number(productForm.opening_stock),
        min_stock_alert: Number(productForm.min_stock_alert),
        reorder_level: Number(productForm.reorder_level),
      });
      emitEvent('product_created', 'Product Catalog Updated', `Item "${productForm.name}" created with HSN ${productForm.hsn_sac}`, 'success');
      showToast('Product registered successfully!');
      setAddProductModal(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      showToast(err?.response?.data?.detail || 'Failed to create product');
    }
  };

  const handleCreateHsn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.importHSN([hsnForm]);
      emitEvent('hsn_added', 'HSN Master Updated', `Official code ${hsnForm.hsn_code} registered`, 'success');
      showToast('HSN code registered successfully!');
      setAddHsnModal(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      showToast('Failed to add HSN code');
    }
  };

  const physicalProducts = products.filter(p => p.item_type === 'product');
  const serviceItems = products.filter(p => p.item_type === 'service' || p.item_type === 'subscription');

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl transition-all">
          <CheckCircle2 size={18} />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products, Services & HSN/SAC Master</h1>
          <p className="text-sm text-gray-500 mt-1">
            Maintain verified HSN goods, SAC service codes, stock levels, GST tax slabs, and price catalogs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app/billing/hsn-sac')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <Hash size={15} className="text-primary-600" />
            HSN / SAC Code Master
          </button>
          <button
            onClick={() => setAddProductModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-primary-500/20"
          >
            <Plus size={16} /> Create Product / Service
          </button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 gap-4">
        <div className="flex overflow-x-auto">
          <button
            onClick={() => setActiveTab('products')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'products'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Physical Products ({physicalProducts.length})
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'services'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Services & SaaS ({serviceItems.length})
          </button>
          <button
            onClick={() => setActiveTab('hsn')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'hsn'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Official HSN Master ({hsnList.length})
          </button>
          <button
            onClick={() => setActiveTab('sac')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'sac'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Official SAC Master ({sacList.length})
          </button>
        </div>

        <div className="relative pb-2 sm:pb-0 w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search items, SKU, HSN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Tab 1: Physical Products */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50/80 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3 px-4">Product Name & SKU</th>
                  <th className="py-3 px-4">HSN Code</th>
                  <th className="py-3 px-4">Purchase Price</th>
                  <th className="py-3 px-4">Selling Price (Excl)</th>
                  <th className="py-3 px-4">GST Rate</th>
                  <th className="py-3 px-4">Stock on Hand</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {physicalProducts.map((p) => {
                  const isLow = (p as any).current_stock <= (p as any).min_stock_alert;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shadow-sm">
                            <Package size={18} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{p.name}</p>
                            <p className="text-xs text-gray-400 font-mono">SKU: {p.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs font-bold text-gray-700">
                        {p.hsn_sac}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-gray-600">
                        ₹{Number((p as any).purchase_price || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-gray-900 text-xs">
                        ₹{Number(p.unit_price).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 text-xs font-bold rounded bg-primary-50 text-primary-700">
                          {p.tax_rate}% GST
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                          isLow ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {(p as any).current_stock ?? 20} {p.unit}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700">
                          Active
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

      {/* Tab 2: Services & SaaS */}
      {activeTab === 'services' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50/80 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3 px-4">Service Name & SKU</th>
                  <th className="py-3 px-4">SAC Code</th>
                  <th className="py-3 px-4">Billing Rate</th>
                  <th className="py-3 px-4">Applicable GST</th>
                  <th className="py-3 px-4">Billing Unit</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {serviceItems.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-400 font-mono">SKU: {s.sku}</p>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-purple-700">
                      {s.hsn_sac}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-900 text-xs">
                      ₹{Number(s.unit_price).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 text-xs font-bold rounded bg-purple-50 text-purple-700">
                        {s.tax_rate}% GST
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-600">
                      {s.unit}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: HSN Master */}
      {activeTab === 'hsn' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50/80 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3 px-4">HSN Code</th>
                  <th className="py-3 px-4">Goods Category</th>
                  <th className="py-3 px-4">Official Description</th>
                  <th className="py-3 px-4">Standard GST Rate</th>
                  <th className="py-3 px-4 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {hsnList.map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-primary-600">
                      {h.hsn_code}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-gray-800">
                      {h.goods_category}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-600 max-w-md">
                      {h.description}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-blue-50 text-blue-700">
                        {h.applicable_gst_rate}% GST
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-end gap-1">
                        <CheckCircle2 size={12} /> CBIC Verified
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: SAC Master */}
      {activeTab === 'sac' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50/80 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3 px-4">SAC Code</th>
                  <th className="py-3 px-4">Service Category</th>
                  <th className="py-3 px-4">Official Description</th>
                  <th className="py-3 px-4">Applicable Rate</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sacList.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-purple-700">
                      {s.sac_code}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-gray-800">
                      {s.service_category}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-600 max-w-md">
                      {s.description}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-purple-50 text-purple-700">
                        {s.applicable_gst_rate}% GST
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-end gap-1">
                        <CheckCircle2 size={12} /> Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add Product */}
      <Modal
        isOpen={addProductModal}
        onClose={() => setAddProductModal(false)}
        title="Create Product or Service Master"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Item Type *</label>
              <select
                value={productForm.item_type}
                onChange={(e) => setProductForm({ ...productForm, item_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              >
                <option value="product">Physical Product (Stock Tracked)</option>
                <option value="service">Professional Service</option>
                <option value="subscription">Software / SaaS Subscription</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">SKU / Item Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. DELL-LAT-5550"
                value={productForm.sku}
                onChange={(e) => setProductForm({ ...productForm, sku: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Product / Service Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Dell Latitude 5540 Core i7 Laptop"
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-700">
                  {productForm.item_type === 'product' ? 'HSN Code *' : 'SAC Code *'}
                </label>
                <span className="text-[10px] text-primary-600 font-semibold">Autofills GST</span>
              </div>
              <input
                type="text"
                list="product-hsn-sac-list"
                required
                placeholder={productForm.item_type === 'product' ? 'e.g. 847130' : 'e.g. 998314'}
                value={productForm.hsn_sac}
                onChange={(e) => handleHsnSacChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <datalist id="product-hsn-sac-list">
                {(productForm.item_type === 'product' ? hsnList : sacList).map((item: any) => (
                  <option
                    key={item.id}
                    value={productForm.item_type === 'product' ? item.hsn_code : item.sac_code}
                  >
                    {item.description} ({item.applicable_gst_rate}% GST)
                  </option>
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">GST Rate (%) *</label>
              <select
                value={productForm.tax_rate}
                onChange={(e) => {
                  setProductForm({ ...productForm, tax_rate: Number(e.target.value) });
                  setAutofillNotice(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value={18}>18% (Standard GST)</option>
                <option value={12}>12% (Concessional)</option>
                <option value={5}>5% (Essential)</option>
                <option value={28}>28% (Luxury)</option>
                <option value={0}>0% (Exempt)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Unit of Measure</label>
              <select
                value={productForm.unit}
                onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
              >
                <option value="NOS">NOS (Numbers)</option>
                <option value="PCS">PCS (Pieces)</option>
                <option value="SET">SET</option>
                <option value="BOX">BOX</option>
                <option value="KGS">KGS</option>
                <option value="MTR">MTR (Meters)</option>
                <option value="HRS">HRS (Hours)</option>
              </select>
            </div>
            {autofillNotice && (
              <div className="col-span-3 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-2 font-medium animate-fadeIn">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span>{autofillNotice}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Purchase Price (₹)</label>
              <input
                type="number"
                min="0"
                value={productForm.purchase_price}
                onChange={(e) => setProductForm({ ...productForm, purchase_price: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Selling Price (₹) *</label>
              <input
                type="number"
                min="0"
                required
                value={productForm.unit_price}
                onChange={(e) => setProductForm({ ...productForm, unit_price: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">MRP (₹)</label>
              <input
                type="number"
                min="0"
                value={productForm.mrp}
                onChange={(e) => setProductForm({ ...productForm, mrp: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
          </div>

          {productForm.item_type === 'product' && (
            <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-xl">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Opening Stock</label>
                <input
                  type="number"
                  min="0"
                  value={productForm.opening_stock}
                  onChange={(e) => setProductForm({ ...productForm, opening_stock: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Min Stock Alert</label>
                <input
                  type="number"
                  min="0"
                  value={productForm.min_stock_alert}
                  onChange={(e) => setProductForm({ ...productForm, min_stock_alert: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Reorder Level</label>
                <input
                  type="number"
                  min="0"
                  value={productForm.reorder_level}
                  onChange={(e) => setProductForm({ ...productForm, reorder_level: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                />
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setAddProductModal(false)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-primary-500/20"
            >
              Save Product
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add HSN Code */}
      <Modal
        isOpen={addHsnModal}
        onClose={() => setAddHsnModal(false)}
        title="Add Official HSN / SAC Master Record"
      >
        <form onSubmit={handleCreateHsn} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">HSN / SAC Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. 847130 or 998314"
                value={hsnForm.hsn_code}
                onChange={(e) => setHsnForm({ ...hsnForm, hsn_code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Goods/Service Category *</label>
              <input
                type="text"
                required
                placeholder="e.g. Computer Equipment"
                value={hsnForm.goods_category}
                onChange={(e) => setHsnForm({ ...hsnForm, goods_category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Official Tariff Description *</label>
            <textarea
              rows={3}
              required
              placeholder="Full description as specified in CBIC GST Tariff Schedule..."
              value={hsnForm.description}
              onChange={(e) => setHsnForm({ ...hsnForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Applicable GST Rate (%)</label>
            <select
              value={hsnForm.applicable_gst_rate}
              onChange={(e) => setHsnForm({ ...hsnForm, applicable_gst_rate: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
            >
              <option value={18}>18%</option>
              <option value={12}>12%</option>
              <option value={5}>5%</option>
              <option value={28}>28%</option>
              <option value={0}>0%</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setAddHsnModal(false)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-primary-500/20"
            >
              Register HSN Code
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
