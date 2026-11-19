import React from 'react';
import {
  BarChart3, PieChart, TrendingUp, DollarSign,
  Users, Receipt, ArrowUpRight, Download, Calendar
} from 'lucide-react';
import { SectionHeading } from '../components/SectionHeading';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { LoginButton } from '../components/LoginButton';

export const Analytics = () => {
  return (
    <section id="analytics" className="py-20 lg:py-28 bg-slate-50/70 border-b border-slate-200/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badge="BUSINESS INTELLIGENCE & AUDIT"
          title="Your Business Data."
          highlight="One Clear Picture."
          subtitle="Transform operational chaos into clear executive clarity. Access 10+ real-time audit reports across workforce attendance, sales conversions, GST returns, and outstanding receivables."
        />

        {/* 3 Large Analytics Report Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Card 1: HR & Workforce Analytics */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Workforce & Payroll Intelligence</h3>
                    <span className="text-[10px] text-slate-400 font-mono">HRMS Ledger Audit</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">Live</span>
              </div>

              {/* Progress metrics */}
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span className="text-slate-600">On-Time Attendance Index</span>
                    <span className="font-mono text-emerald-600">98.6%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '98.6%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span className="text-slate-600">50% Wage Code Compliance</span>
                    <span className="font-mono text-blue-600">100% Passed</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span className="text-slate-600">EPFO ECR Statutory Remittance</span>
                    <span className="font-mono text-slate-900">₹53,100 / mo</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-mono text-[11px] text-slate-500">Sample Dataset: 148 Staff</span>
              <span className="text-blue-600 font-bold flex items-center">
                Export CSV <Download className="w-3.5 h-3.5 ml-1" />
              </span>
            </div>
          </div>

          {/* Card 2: Sales Pipeline & Deal Velocity */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Sales Velocity & Conversion</h3>
                    <span className="text-[10px] text-slate-400 font-mono">CRM Pipeline Velocity</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold">+38% YoY</span>
              </div>

              {/* Conversion Metrics */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Active Pipeline</span>
                  <span className="text-xl font-black text-slate-900 font-mono mt-1 block">₹68.4L</span>
                  <span className="text-[10px] text-indigo-600 font-semibold">83 Inquiries</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Avg Deal Cycle</span>
                  <span className="text-xl font-black text-slate-900 font-mono mt-1 block">14 Days</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">-4 Days Faster</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600 font-sans">Lead to Qualified Ratio:</span>
                  <span className="font-bold text-slate-900">42.5%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600 font-sans">Proposal to Win Ratio:</span>
                  <span className="font-bold text-emerald-600">57.1%</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-mono text-[11px] text-slate-500">Rep Quota Attainment</span>
              <span className="text-indigo-600 font-bold flex items-center">
                View Reps <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
              </span>
            </div>
          </div>

          {/* Card 3: GST & Financial Reconciliation */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">GST Returns & Input Credit (ITC)</h3>
                    <span className="text-[10px] text-slate-400 font-mono">CBIC Tax Ledger</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px] font-bold">GSTR-1</span>
              </div>

              {/* GST Numbers */}
              <div className="p-3 bg-slate-950 text-white rounded-2xl font-mono text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Total Taxable Sales:</span>
                  <span className="font-bold text-white">₹34,80,000</span>
                </div>
                <div className="flex justify-between text-purple-300">
                  <span className="font-sans">Output GST Collected:</span>
                  <span className="font-bold">₹6,26,400</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span className="font-sans">Eligible Input Credit (ITC):</span>
                  <span className="font-bold">-₹1,84,200</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between font-black text-sm text-blue-400">
                  <span className="font-sans">Net Cash Tax Payable:</span>
                  <span>₹4,42,200</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-mono text-[11px] text-slate-500">Period: Nov 2026</span>
              <span className="text-purple-600 font-bold flex items-center">
                Download GSTR-3B <Download className="w-3.5 h-3.5 ml-1" />
              </span>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <LoginButton
            text="Open Comprehensive Reports in ERP →"
            variant="primary"
            size="md"
          />
        </div>
      </div>
    </section>
  );
};

export default Analytics;
