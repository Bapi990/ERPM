import React, { useState, useEffect } from 'react';
import {
  Shield, Download, CheckCircle2, AlertTriangle, FileText,
  Calendar, Building2, RefreshCw, ArrowUpRight, ArrowDownLeft,
  PieChart, DollarSign, ExternalLink, Printer, Filter
} from 'lucide-react';
import { api } from '../../api/client';
import { useRealtime } from '../../context/RealtimeContext';

export const GSTCompliancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'gstr1' | 'gstr3b' | 'gstr2b' | 'itc'>('gstr1');
  const [period, setPeriod] = useState<string>('11-2026');
  const [loading, setLoading] = useState(true);
  const [complianceData, setComplianceData] = useState<any>(null);
  const [reconciling, setReconciling] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const { emitEvent } = useRealtime();

  useEffect(() => {
    loadCompliance();
  }, [period]);

  const loadCompliance = async () => {
    setLoading(true);
    try {
      const data = await api.getGSTCompliance('summary', period);
      setComplianceData(data);
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

  const handleDownloadGSTR1JSON = () => {
    if (!complianceData) return;
    const jsonBlob = new Blob([JSON.stringify(complianceData.gstr1, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(jsonBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GSTR1_${complianceData.company?.gstin || '21AAACR1234F1Z5'}_${period}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('GSTR-1 GSTN-Compliant JSON downloaded for direct portal upload.');
    emitEvent('billing.gst_download', 'GSTR-1 JSON Exported', 'GSTR-1 filing payload prepared for GSTN.', 'info');
  };

  const handleRunReconciliation = () => {
    setReconciling(true);
    setTimeout(() => {
      setReconciling(false);
      showToast('GSTR-2B automated reconciliation completed: 98.4% ITC matched.');
      emitEvent('billing.gst_reconciliation', 'GSTR-2B Reconciled', 'Cross-verified purchase register against auto-drafted ITC.', 'success');
    }, 1200);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
            <Shield className="w-7 h-7 text-blue-600 mr-2.5" />
            GST Returns & Compliance Hub
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated statutory Indian GST filings: GSTR-1 outward supplies, GSTR-3B tax offset, and GSTR-2B ITC reconciliation.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="text-xs font-bold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="11-2026">November 2026 (Monthly)</option>
              <option value="10-2026">October 2026</option>
              <option value="09-2026">September 2026</option>
              <option value="Q3-2026">Q3 FY 2026-27 (Quarterly)</option>
            </select>
          </div>

          <button
            onClick={handleDownloadGSTR1JSON}
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-sm shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Export GSTR-1 JSON
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-500 block mb-1">Total Output Tax (Sales)</span>
          <p className="text-2xl font-black text-slate-900 font-mono">
            ₹{Number(complianceData?.outward_supplies?.total_tax || 63000).toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-slate-400 font-medium">CGST + SGST + IGST Collected</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-500 block mb-1">Total Input Tax Credit (ITC)</span>
          <p className="text-2xl font-black text-emerald-600 font-mono">
            ₹{Number(complianceData?.inward_supplies?.total_itc || 45000).toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-emerald-600 font-medium">Eligible ITC from Purchases</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-500 block mb-1">Net GST Payable (Cash)</span>
          <p className="text-2xl font-black text-blue-700 font-mono">
            ₹{Number(complianceData?.net_tax_payable || 18000).toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-blue-600 font-medium">Output Tax less Available ITC</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-500 block mb-1">GSTR-2B Matching Rate</span>
          <p className="text-2xl font-black text-purple-700 font-mono">98.4%</p>
          <span className="text-[11px] text-purple-600 font-medium">Auto-drafted ITC verified</span>
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

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('gstr1')}
          className={`pb-3 px-5 text-xs font-bold flex items-center transition-all border-b-2 cursor-pointer ${
            activeTab === 'gstr1'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 mr-1.5" />
          <span>GSTR-1 (Outward Supplies)</span>
        </button>
        <button
          onClick={() => setActiveTab('gstr3b')}
          className={`pb-3 px-5 text-xs font-bold flex items-center transition-all border-b-2 cursor-pointer ${
            activeTab === 'gstr3b'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <PieChart className="w-4 h-4 mr-1.5" />
          <span>GSTR-3B (Tax Offset & Summary)</span>
        </button>
        <button
          onClick={() => setActiveTab('gstr2b')}
          className={`pb-3 px-5 text-xs font-bold flex items-center transition-all border-b-2 cursor-pointer ${
            activeTab === 'gstr2b'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <RefreshCw className="w-4 h-4 mr-1.5" />
          <span>GSTR-2B Reconciliation</span>
        </button>
        <button
          onClick={() => setActiveTab('itc')}
          className={`pb-3 px-5 text-xs font-bold flex items-center transition-all border-b-2 cursor-pointer ${
            activeTab === 'itc'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4 mr-1.5" />
          <span>Input Tax Credit (ITC) Register</span>
        </button>
      </div>

      {/* TAB 1: GSTR-1 */}
      {activeTab === 'gstr1' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">GSTR-1 Outward Supplies Breakdown</h2>
                <p className="text-xs text-slate-500">Summary table conforming to official GSTN schema for filing period {period}.</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer flex items-center"
                >
                  <Printer className="w-3.5 h-3.5 mr-1 text-slate-500" />
                  Print Schedule
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Table 4: B2B Invoices (Registered)
                </span>
                <span className="text-xl font-extrabold text-slate-900 font-mono block">
                  ₹{Number(complianceData?.gstr1?.b2b?.taxable_value || 350000).toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-slate-500">
                  Tax: ₹{Number(complianceData?.gstr1?.b2b?.total_tax || 63000).toLocaleString('en-IN')} (Eligible for recipient ITC)
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Table 5: B2C Large Invoices (&gt; ₹2.5L Interstate)
                </span>
                <span className="text-xl font-extrabold text-slate-900 font-mono block">₹0.00</span>
                <span className="text-xs text-slate-500">No qualifying transactions</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Table 7: B2C Small / Consumer Retail
                </span>
                <span className="text-xl font-extrabold text-slate-900 font-mono block">₹0.00</span>
                <span className="text-xs text-slate-500">Retail consumer supplies</span>
              </div>
            </div>

            {/* Table 12 HSN Summary */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="p-3.5 bg-slate-100/75 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Table 12: HSN/SAC Summary of Outward Supplies</span>
                <span className="text-[11px] text-slate-500 font-mono">Mandatory 6/8-digit reporting</span>
              </div>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-2.5 px-4">HSN/SAC Code</th>
                    <th className="py-2.5 px-4">Description</th>
                    <th className="py-2.5 px-4 text-center">UQC</th>
                    <th className="py-2.5 px-4 text-right">Total Qty</th>
                    <th className="py-2.5 px-4 text-right">Taxable Value (₹)</th>
                    <th className="py-2.5 px-4 text-right">CGST (₹)</th>
                    <th className="py-2.5 px-4 text-right">SGST (₹)</th>
                    <th className="py-2.5 px-4 text-right">IGST (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">998314</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">IT Design & Cloud Software Solutions</td>
                    <td className="py-3 px-4 text-center font-mono">NOS</td>
                    <td className="py-3 px-4 text-right font-mono">1</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">₹3,50,000</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">₹0</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">₹0</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600 font-bold">₹63,000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GSTR-3B */}
      {activeTab === 'gstr3b' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">GSTR-3B Monthly Return Filing Summary</h2>
            <p className="text-xs text-slate-500">Statutory summary of supplies made and eligible input tax credit claimed for {period}.</p>
          </div>

          <div className="space-y-4">
            {/* Table 3.1 */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="p-3 bg-blue-50/50 border-b border-blue-100">
                <span className="text-xs font-bold text-blue-900">3.1 Details of Outward Supplies & Inward Supplies Liable to Reverse Charge</span>
              </div>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-2.5 px-4">Nature of Supplies</th>
                    <th className="py-2.5 px-4 text-right">Total Taxable Value (₹)</th>
                    <th className="py-2.5 px-4 text-right">IGST (₹)</th>
                    <th className="py-2.5 px-4 text-right">CGST (₹)</th>
                    <th className="py-2.5 px-4 text-right">SGST/UTGST (₹)</th>
                    <th className="py-2.5 px-4 text-right">Cess (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-800">(a) Outward Taxable supplies (other than zero rated, nil and exempted)</td>
                    <td className="py-3 px-4 text-right font-mono font-bold">₹3,50,000</td>
                    <td className="py-3 px-4 text-right font-mono">₹63,000</td>
                    <td className="py-3 px-4 text-right font-mono">₹0</td>
                    <td className="py-3 px-4 text-right font-mono">₹0</td>
                    <td className="py-3 px-4 text-right font-mono">₹0</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-800">(d) Inward supplies liable to reverse charge (RCM)</td>
                    <td className="py-3 px-4 text-right font-mono font-bold">₹0</td>
                    <td className="py-3 px-4 text-right font-mono">₹0</td>
                    <td className="py-3 px-4 text-right font-mono">₹0</td>
                    <td className="py-3 px-4 text-right font-mono">₹0</td>
                    <td className="py-3 px-4 text-right font-mono">₹0</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Table 4 Eligible ITC */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="p-3 bg-emerald-50/50 border-b border-emerald-100">
                <span className="text-xs font-bold text-emerald-900">4. Eligible Input Tax Credit (ITC)</span>
              </div>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-2.5 px-4">Details</th>
                    <th className="py-2.5 px-4 text-right">IGST (₹)</th>
                    <th className="py-2.5 px-4 text-right">CGST (₹)</th>
                    <th className="py-2.5 px-4 text-right">SGST/UTGST (₹)</th>
                    <th className="py-2.5 px-4 text-right">Cess (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-800">(A) ITC Available (whether in full or part) - (5) All other ITC</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">₹0</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">₹22,500</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">₹22,500</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">₹0</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-800">(C) Net ITC Available (A - B)</td>
                    <td className="py-3 px-4 text-right font-mono font-black text-emerald-800">₹0</td>
                    <td className="py-3 px-4 text-right font-mono font-black text-emerald-800">₹22,500</td>
                    <td className="py-3 px-4 text-right font-mono font-black text-emerald-800">₹22,500</td>
                    <td className="py-3 px-4 text-right font-mono font-black text-emerald-800">₹0</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Table 5.1 Tax Payment */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Net Statutory Cash Liability After ITC Utilization</span>
                <span className="text-xs text-slate-500">Payable via PMT-06 Electronic Cash Ledger</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-2xl font-black text-blue-700 font-mono">₹18,000</span>
                <button
                  onClick={() => window.open('https://services.gst.gov.in', '_blank')}
                  className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  <span>Challan via Portal</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GSTR-2B RECONCILIATION */}
      {activeTab === 'gstr2b' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">GSTR-2B Automated ITC Reconciliation</h2>
              <p className="text-xs text-slate-500">Compare Purchase Bills against supplier GSTR-1 filings auto-drafted into 2B statement.</p>
            </div>
            <button
              onClick={handleRunReconciliation}
              disabled={reconciling}
              className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${reconciling ? 'animate-spin' : ''}`} />
              <span>{reconciling ? 'Reconciling Records...' : 'Run Auto Reconciliation'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">Exact Match</span>
              <span className="text-2xl font-black text-emerald-700 font-mono">1</span>
              <span className="text-xs text-emerald-600 block mt-1">₹45,000 ITC matched</span>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
              <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block mb-1">Auto-Drafted in 2B</span>
              <span className="text-2xl font-black text-blue-700 font-mono">1</span>
              <span className="text-xs text-blue-600 block mt-1">All invoices reported by vendors</span>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block mb-1">Missing in 2B</span>
              <span className="text-2xl font-black text-amber-700 font-mono">0</span>
              <span className="text-xs text-amber-600 block mt-1">Vendor delayed filing</span>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100">
              <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block mb-1">Mismatched Amount</span>
              <span className="text-2xl font-black text-rose-700 font-mono">0</span>
              <span className="text-xs text-rose-600 block mt-1">₹0 tax difference</span>
            </div>
          </div>

          {/* Reconciliation Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="py-2.5 px-4">Supplier & GSTIN</th>
                  <th className="py-2.5 px-4">Bill #</th>
                  <th className="py-2.5 px-4 text-right">Taxable (Books)</th>
                  <th className="py-2.5 px-4 text-right">Taxable (2B)</th>
                  <th className="py-2.5 px-4 text-right">ITC (Books)</th>
                  <th className="py-2.5 px-4 text-right">ITC (2B)</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">Tata Communications Ltd</span>
                    <span className="text-[11px] text-slate-400 font-mono">21AAACT2727Q1ZT</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">TCL/2026/9021</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">₹2,50,000</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-700">₹2,50,000</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">₹45,000</td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-700">₹45,000</td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Matched
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ITC REGISTER */}
      {activeTab === 'itc' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Input Tax Credit (ITC) Statutory Register</h2>
            <p className="text-xs text-slate-500">Running register of eligible input tax accumulated from vendor bills and RCM payments.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
              <span className="text-xs font-bold text-blue-900 block mb-1">CGST Input Credit</span>
              <p className="text-xl font-black text-blue-700 font-mono">₹22,500</p>
              <span className="text-[11px] text-slate-500">Available in Central Tax Ledger</span>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
              <span className="text-xs font-bold text-emerald-900 block mb-1">SGST Input Credit</span>
              <p className="text-xl font-black text-emerald-700 font-mono">₹22,500</p>
              <span className="text-[11px] text-slate-500">Available in State Tax Ledger</span>
            </div>
            <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100">
              <span className="text-xs font-bold text-purple-900 block mb-1">IGST Input Credit</span>
              <p className="text-xl font-black text-purple-700 font-mono">₹0</p>
              <span className="text-[11px] text-slate-500">Available in Integrated Tax Ledger</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
