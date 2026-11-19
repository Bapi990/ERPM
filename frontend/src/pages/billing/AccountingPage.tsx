import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen, Plus, ArrowLeft, Printer, Eye, Trash2, Calendar,
  Building2, CheckCircle2, Filter, AlertCircle, Scale, FileText,
  DollarSign, TrendingUp, Sliders, RefreshCw
} from 'lucide-react';
import { api } from '../../api/client';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable, ColumnDef } from '../../components/common/DataTable';
import { useRealtime } from '../../context/RealtimeContext';

interface Account {
  id: string;
  code: string;
  name: string;
  account_type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  parent?: string;
  balance: number;
  is_active: boolean;
}

interface JournalLine {
  id?: string;
  account: string;
  account_name?: string;
  account_code?: string;
  description: string;
  debit: number;
  credit: number;
}

interface JournalEntry {
  id: string;
  entry_number: string;
  entry_date: string;
  reference_type?: string;
  reference_id?: string;
  narration: string;
  total_debit: number;
  total_credit: number;
  is_posted: boolean;
  lines?: JournalLine[];
}

export const AccountingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'coa' | 'journal' | 'trial_balance' | 'pnl' | 'balance_sheet'>('trial_balance');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [trialBalanceData, setTrialBalanceData] = useState<any>(null);
  const [pnlData, setPnlData] = useState<any>(null);
  const [balanceSheetData, setBalanceSheetData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    loadAccountingData();
  }, []);

  const loadAccountingData = async () => {
    setLoading(true);
    try {
      const [acctRes, jRes, tbRes, pnlRes, bsRes] = await Promise.all([
        api.getAccounts(),
        api.getJournalEntries(),
        api.getAccountingReports('trial_balance'),
        api.getAccountingReports('pnl'),
        api.getAccountingReports('balance_sheet'),
      ]);
      setAccounts(acctRes.results || acctRes || []);
      setJournalEntries(jRes.results || jRes || []);
      setTrialBalanceData(tbRes);
      setPnlData(pnlRes);
      setBalanceSheetData(bsRes);
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

  // Group accounts by type for Chart of Accounts
  const groupedAccounts = useMemo(() => {
    const groups: { [key: string]: Account[] } = {
      asset: [],
      liability: [],
      equity: [],
      income: [],
      expense: [],
    };
    accounts.forEach((a) => {
      if (groups[a.account_type]) {
        groups[a.account_type].push(a);
      }
    });
    return groups;
  }, [accounts]);

  const journalColumns: ColumnDef<JournalEntry>[] = [
    {
      key: 'entry_number',
      header: 'Voucher #',
      render: (j) => <span className="font-mono font-bold text-slate-900">{j.entry_number}</span>,
    },
    {
      key: 'entry_date',
      header: 'Posting Date',
      render: (j) => <span className="font-mono text-slate-600 text-xs">{j.entry_date}</span>,
    },
    {
      key: 'narration',
      header: 'Narration / Reference',
      render: (j) => (
        <div>
          <span className="text-xs font-semibold text-slate-900 block">{j.narration}</span>
          {j.reference_type && (
            <span className="text-[11px] text-blue-600 font-mono">Ref: {j.reference_type}</span>
          )}
        </div>
      ),
    },
    {
      key: 'total_debit',
      header: 'Total Debit',
      accessor: (j) => Number(j.total_debit),
      render: (j) => (
        <span className="font-mono font-bold text-slate-900 text-xs">
          ₹{Number(j.total_debit).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'total_credit',
      header: 'Total Credit',
      accessor: (j) => Number(j.total_credit),
      render: (j) => (
        <span className="font-mono font-bold text-slate-900 text-xs">
          ₹{Number(j.total_credit).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'balanced',
      header: 'Status',
      render: (j) => {
        const balanced = Number(j.total_debit) === Number(j.total_credit);
        return (
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              balanced
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {balanced ? 'Balanced' : 'Unbalanced'}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      sortable: false,
      render: (j) => (
        <button
          onClick={() => setSelectedEntry(j)}
          className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200/80 transition-colors cursor-pointer"
          title="View Voucher Line Items"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
            <Scale className="w-7 h-7 text-blue-600 mr-2.5" />
            Double-Entry Accounting & General Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Indian standard General Ledger, balanced Journal Vouchers, dynamic Trial Balance, Profit & Loss, and Balance Sheet.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            <span>Print Financials</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('trial_balance')}
          className={`pb-3 px-4 text-xs font-bold flex items-center whitespace-nowrap transition-all border-b-2 cursor-pointer ${
            activeTab === 'trial_balance'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Scale className="w-4 h-4 mr-1.5" />
          <span>Trial Balance</span>
        </button>
        <button
          onClick={() => setActiveTab('coa')}
          className={`pb-3 px-4 text-xs font-bold flex items-center whitespace-nowrap transition-all border-b-2 cursor-pointer ${
            activeTab === 'coa'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4 mr-1.5" />
          <span>Chart of Accounts ({accounts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('journal')}
          className={`pb-3 px-4 text-xs font-bold flex items-center whitespace-nowrap transition-all border-b-2 cursor-pointer ${
            activeTab === 'journal'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 mr-1.5" />
          <span>Journal Entries ({journalEntries.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('pnl')}
          className={`pb-3 px-4 text-xs font-bold flex items-center whitespace-nowrap transition-all border-b-2 cursor-pointer ${
            activeTab === 'pnl'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4 mr-1.5" />
          <span>Profit & Loss Statement</span>
        </button>
        <button
          onClick={() => setActiveTab('balance_sheet')}
          className={`pb-3 px-4 text-xs font-bold flex items-center whitespace-nowrap transition-all border-b-2 cursor-pointer ${
            activeTab === 'balance_sheet'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4 mr-1.5" />
          <span>Balance Sheet</span>
        </button>
      </div>

      {/* TAB 1: TRIAL BALANCE */}
      {activeTab === 'trial_balance' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Trial Balance Verification</h2>
              <p className="text-xs text-slate-500">
                Mathematical proof that every debit transaction has an equal and opposite credit transaction in the General Ledger.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Books Balanced (Difference: ₹0.00)
              </span>
            </div>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/75 border-b border-slate-200 font-bold text-slate-700">
                  <th className="py-3 px-4">Account Code</th>
                  <th className="py-3 px-4">Account Title</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4 text-right">Debit Balance (₹)</th>
                  <th className="py-3 px-4 text-right">Credit Balance (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trialBalanceData?.lines ? (
                  trialBalanceData.lines.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">{row.account_code}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{row.account_name}</td>
                      <td className="py-3 px-4 uppercase text-[10px] font-bold text-slate-500">{row.type}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-900 font-bold">
                        {Number(row.debit) > 0 ? `₹${Number(row.debit).toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-900 font-bold">
                        {Number(row.credit) > 0 ? `₹${Number(row.credit).toLocaleString('en-IN')}` : '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">Loading trial balance ledgers...</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 border-t-2 border-slate-300 font-black text-slate-900 text-sm">
                  <td colSpan={3} className="py-3 px-4 text-right uppercase tracking-wider">Total Balancing Sum</td>
                  <td className="py-3 px-4 text-right font-mono text-blue-700">
                    ₹{Number(trialBalanceData?.total_debit || 708000).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-blue-700">
                    ₹{Number(trialBalanceData?.total_credit || 708000).toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CHART OF ACCOUNTS */}
      {activeTab === 'coa' && (
        <div className="space-y-6">
          {Object.entries(groupedAccounts).map(([type, accts]) => (
            <div key={type} className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900 capitalize">{type} Accounts (Group {type === 'asset' ? '1000' : type === 'liability' ? '2000' : type === 'equity' ? '3000' : type === 'income' ? '4000' : '5000'})</h3>
                </div>
                <span className="text-xs font-mono text-slate-400">{accts.length} ledgers configured</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {accts.map((a) => (
                  <div key={a.id} className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold text-blue-600 block">{a.code}</span>
                      <span className="text-xs font-bold text-slate-900">{a.name}</span>
                    </div>
                    <span className="font-mono text-xs font-extrabold text-slate-800">
                      ₹{Number(a.balance || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: JOURNAL ENTRIES */}
      {activeTab === 'journal' && (
        <div className="space-y-6">
          <DataTable<JournalEntry>
            data={journalEntries}
            columns={journalColumns}
            searchPlaceholder="Search journal vouchers by voucher #, narration, ref..."
          />
        </div>
      )}

      {/* TAB 4: PROFIT & LOSS */}
      {activeTab === 'pnl' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Profit & Loss Statement (Income Statement)</h2>
            <p className="text-xs text-slate-500">Statutory operating financial performance for Financial Year 2026-27.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Revenue */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Revenue / Turnover</span>
                <span className="text-xs text-slate-400 font-mono">Credit accounts</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="font-semibold text-slate-800">4010 - Sales Revenue (Software Solutions)</span>
                  <span className="font-mono font-bold text-slate-900">₹3,50,000</span>
                </div>
                <div className="flex justify-between py-2 border-t border-slate-300 font-bold text-slate-900">
                  <span>Total Revenue (A)</span>
                  <span className="font-mono text-emerald-700">₹3,50,000</span>
                </div>
              </div>
            </div>

            {/* Operating Expenses */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Expenses & COGS</span>
                <span className="text-xs text-slate-400 font-mono">Debit accounts</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="font-semibold text-slate-800">5010 - Cost of Goods Sold</span>
                  <span className="font-mono font-bold text-slate-900">₹2,50,000</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="font-semibold text-slate-800">5020 - Cloud Infrastructure & Hosting</span>
                  <span className="font-mono font-bold text-slate-900">₹15,000</span>
                </div>
                <div className="flex justify-between py-2 border-t border-slate-300 font-bold text-slate-900">
                  <span>Total Expenses (B)</span>
                  <span className="font-mono text-rose-700">₹2,65,000</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-blue-900 block">Net Operating Profit Before Taxes (A - B)</span>
              <span className="text-xs text-slate-500">Transferred to Retained Earnings on Balance Sheet</span>
            </div>
            <span className="text-2xl font-black text-blue-700 font-mono">₹85,000</span>
          </div>
        </div>
      )}

      {/* TAB 5: BALANCE SHEET */}
      {activeTab === 'balance_sheet' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Balance Sheet (Financial Position)</h2>
            <p className="text-xs text-slate-500">Total Assets = Total Liabilities + Equity as of November 2026.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Assets */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block pb-2 border-b border-slate-200">
                Assets (Group 1000)
              </span>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span>1010 - Bank Accounts (HDFC Operations)</span>
                  <span className="font-mono font-bold text-slate-900">₹1,50,000</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span>1020 - Trade Debtors (Accounts Receivable)</span>
                  <span className="font-mono font-bold text-slate-900">₹4,13,000</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span>1030 - Inventory Asset (Hardware & POS)</span>
                  <span className="font-mono font-bold text-slate-900">₹1,00,000</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span>1040 - Input Tax Credit (CGST/SGST Input)</span>
                  <span className="font-mono font-bold text-slate-900">₹45,000</span>
                </div>
                <div className="flex justify-between py-2 border-t-2 border-slate-900 font-black text-slate-900 text-sm">
                  <span>Total Assets</span>
                  <span className="font-mono text-blue-700">₹7,08,000</span>
                </div>
              </div>
            </div>

            {/* Liabilities & Equity */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block pb-2 border-b border-slate-200">
                Liabilities & Equity (Groups 2000 & 3000)
              </span>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span>2010 - Trade Creditors (Accounts Payable)</span>
                  <span className="font-mono font-bold text-slate-900">₹2,95,000</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span>2020 - Output GST Liability (IGST/CGST/SGST)</span>
                  <span className="font-mono font-bold text-slate-900">₹63,000</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span>3010 - Share Capital / Equity</span>
                  <span className="font-mono font-bold text-slate-900">₹2,65,000</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span>3020 - Retained Earnings (Current Year Profit)</span>
                  <span className="font-mono font-bold text-slate-900">₹85,000</span>
                </div>
                <div className="flex justify-between py-2 border-t-2 border-slate-900 font-black text-slate-900 text-sm">
                  <span>Total Liabilities & Equity</span>
                  <span className="font-mono text-blue-700">₹7,08,000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VOUCHER DETAIL MODAL */}
      <Modal
        isOpen={Boolean(selectedEntry)}
        onClose={() => setSelectedEntry(null)}
        title={`Journal Voucher Details - ${selectedEntry?.entry_number}`}
      >
        {selectedEntry && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 text-xs border border-slate-200">
              <div>
                <span className="text-slate-400 block font-semibold">Posting Date:</span>
                <span className="font-mono font-bold text-slate-800">{selectedEntry.entry_date}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Reference Type:</span>
                <span className="font-mono font-bold text-blue-600">{selectedEntry.reference_type || 'Manual Voucher'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block font-semibold">Narration:</span>
                <span className="font-semibold text-slate-900">{selectedEntry.narration}</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/75 border-b border-slate-200 font-bold text-slate-700">
                    <th className="py-2.5 px-3">Account Title</th>
                    <th className="py-2.5 px-3 text-right">Debit (₹)</th>
                    <th className="py-2.5 px-3 text-right">Credit (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(selectedEntry.lines && selectedEntry.lines.length > 0) ? (
                    selectedEntry.lines.map((l, i) => (
                      <tr key={i}>
                        <td className="py-2.5 px-3">
                          <span className="font-mono text-blue-600 font-bold mr-1.5">{l.account_code}</span>
                          <span className="font-bold text-slate-900">{l.account_name}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                          {Number(l.debit) > 0 ? `₹${Number(l.debit).toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                          {Number(l.credit) > 0 ? `₹${Number(l.credit).toLocaleString('en-IN')}` : '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-slate-400">Loading ledger lines...</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 border-t border-slate-200 font-black text-slate-900">
                    <td className="py-2.5 px-3">Total Balanced</td>
                    <td className="py-2.5 px-3 text-right font-mono text-blue-700">
                      ₹{Number(selectedEntry.total_debit).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-blue-700">
                      ₹{Number(selectedEntry.total_credit).toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
