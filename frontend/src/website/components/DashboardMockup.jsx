import React, { useState } from 'react';
import {
  Users, DollarSign, TrendingUp, Receipt, ShieldCheck,
  CheckCircle2, Clock, Search, Bell, Sparkles, Building2,
  ChevronRight, Calendar, ArrowUpRight, BarChart3, Filter
} from 'lucide-react';
import { LoginButton } from './LoginButton';

/**
 * High-Fidelity Enterprise ERP Dashboard Mockup
 * Reusable for Hero, Interactive Demo, and Module Showcases.
 */
export const DashboardMockup = ({
  activeModule = "overview", // 'overview' | 'hrms' | 'crm' | 'billing'
  interactive = true,
  className = ""
}) => {
  const [selectedTab, setSelectedTab] = useState(activeModule);

  return (
    <div className={`relative bg-slate-900/95 rounded-2xl md:rounded-3xl p-2 sm:p-3 border border-slate-700/80 shadow-2xl blue-glow-lg text-left overflow-hidden ${className}`}>
      {/* Top OS Window Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-800/90 rounded-t-xl border-b border-slate-700/70 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
          <span className="ml-2 font-mono text-[11px] text-slate-400 font-semibold hidden sm:inline">
            odias-erp.internal/app/dashboard
          </span>
        </div>

        {/* Demo Watermark Badge */}
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
            LIVE DEMO PREVIEW
          </span>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
        </div>
      </div>

      {/* Main Software Mockup Body */}
      <div className="bg-slate-950 rounded-b-xl p-3 sm:p-5 text-slate-100 font-sans">
        {/* Software Navigation Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-md shadow-blue-500/30">
              K
            </div>
            <div>
              <span className="font-extrabold text-sm text-white tracking-tight block leading-tight">
                ODIAS ENTERPRISE
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Corporate Workspace • HQ (Odisha)
              </span>
            </div>
          </div>

          {/* Module Switcher Tabs if interactive */}
          {interactive && (
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                onClick={() => setSelectedTab('overview')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  selectedTab === 'overview'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setSelectedTab('hrms')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  selectedTab === 'hrms'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                HRMS
              </button>
              <button
                onClick={() => setSelectedTab('crm')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  selectedTab === 'crm'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                CRM
              </button>
              <button
                onClick={() => setSelectedTab('billing')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  selectedTab === 'billing'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                GST Billing
              </button>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-slate-900 text-slate-400 border border-slate-800">
              <Bell className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-800 text-xs">
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px]">
                SA
              </div>
              <span className="font-semibold text-slate-300 hidden md:inline text-[11px]">Super Admin</span>
            </div>
          </div>
        </div>

        {/* Dynamic View based on Selected Tab */}
        {selectedTab === 'overview' && (
          <div className="space-y-4">
            {/* 4 Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[10px] font-bold">TOTAL STAFF</span>
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <span className="text-xl sm:text-2xl font-black text-white font-mono">148</span>
                <span className="text-[10px] text-emerald-400 font-semibold mt-0.5">✓ 98.6% On Time</span>
              </div>

              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[10px] font-bold">ACTIVE LEADS</span>
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <span className="text-xl sm:text-2xl font-black text-white font-mono">86</span>
                <span className="text-[10px] text-blue-400 font-semibold mt-0.5">+18 Inbound today</span>
              </div>

              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[10px] font-bold">MONTHLY SALES</span>
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">₹34.8L</span>
                <span className="text-[10px] text-slate-400 font-semibold mt-0.5">Target: ₹40.0L</span>
              </div>

              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[10px] font-bold">GST INVOICES</span>
                  <Receipt className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <span className="text-xl sm:text-2xl font-black text-purple-300 font-mono">₹4.2L</span>
                <span className="text-[10px] text-amber-400 font-semibold mt-0.5">4 Pending Collection</span>
              </div>
            </div>

            {/* Split Section: Attendance Chart + Live Feed */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Mini Chart Mockup */}
              <div className="md:col-span-2 p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-200 block">Weekly Revenue & Attendance Index</span>
                    <span className="text-[10px] text-slate-400">Automated synchronization across branches</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                    Realtime Synced
                  </span>
                </div>

                {/* Simulated CSS/SVG Bar Chart */}
                <div className="flex items-end justify-between h-28 pt-4 px-2 gap-2 border-b border-slate-800">
                  {[
                    { day: "Mon", h1: "65%", h2: "85%" },
                    { day: "Tue", h1: "78%", h2: "92%" },
                    { day: "Wed", h1: "90%", h2: "96%" },
                    { day: "Thu", h1: "82%", h2: "94%" },
                    { day: "Fri", h1: "95%", h2: "98%" },
                    { day: "Sat", h1: "45%", h2: "70%" },
                  ].map((item, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <div className="w-full max-w-[20px] flex items-end justify-center gap-1 h-full">
                        <div
                          className="w-2 bg-blue-500 rounded-t-sm transition-all duration-500"
                          style={{ height: item.h1 }}
                        />
                        <div
                          className="w-2 bg-indigo-400/80 rounded-t-sm transition-all duration-500"
                          style={{ height: item.h2 }}
                        />
                      </div>
                      <span className="text-[9px] font-mono text-slate-400">{item.day}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 text-[10px] text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span> Billing Revenue
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-indigo-400"></span> Staff Attendance
                    </span>
                  </div>
                  <span className="font-mono text-emerald-400 font-bold">+14.2% vs last week</span>
                </div>
              </div>

              {/* Live Activity Feed */}
              <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2.5 text-xs">
                <span className="font-bold text-slate-200 block text-xs border-b border-slate-800 pb-1.5">
                  Live Operations Stream
                </span>
                <div className="space-y-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                    <div className="flex justify-between items-center text-slate-400 text-[10px]">
                      <span className="font-bold text-blue-400">HRMS • Payroll</span>
                      <span>1m ago</span>
                    </div>
                    <p className="text-slate-200 mt-0.5">November payslips released to 148 staff with EPFO ECR.</p>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                    <div className="flex justify-between items-center text-slate-400 text-[10px]">
                      <span className="font-bold text-indigo-400">CRM • Pipeline</span>
                      <span>4m ago</span>
                    </div>
                    <p className="text-slate-200 mt-0.5">Enterprise deal won: ₹4.8L (Tata Metaliks) by Rahul S.</p>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                    <div className="flex justify-between items-center text-slate-400 text-[10px]">
                      <span className="font-bold text-purple-400">Billing • GST</span>
                      <span>9m ago</span>
                    </div>
                    <p className="text-slate-200 mt-0.5">Tax Invoice #INV-2026-089 disbursed with QR & stamp.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HRMS Dedicated Mockup */}
        {selectedTab === 'hrms' && (
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Today's Attendance</span>
                <span className="text-lg font-black text-white font-mono">146 / 148</span>
                <span className="text-[10px] text-emerald-400 block">98.6% Present</span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Pending Leaves</span>
                <span className="text-lg font-black text-amber-400 font-mono">3 Requests</span>
                <span className="text-[10px] text-slate-400 block">Review queue</span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">EPFO Compliance</span>
                <span className="text-lg font-black text-blue-400 font-mono">ECR Ready</span>
                <span className="text-[10px] text-emerald-400 block">TRRN Verified</span>
              </div>
            </div>

            {/* Attendance Table Mockup */}
            <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden text-[11px]">
              <div className="p-2 bg-slate-800/60 font-bold text-slate-300 border-b border-slate-800 flex justify-between">
                <span>Employee Directory & Today's Punch</span>
                <span className="text-blue-400 text-[10px]">Auto Biometric Sync</span>
              </div>
              <div className="divide-y divide-slate-800/60 font-mono">
                {[
                  { name: "Priya Sharma", role: "Sr. Architect", inTime: "09:28 AM", status: "On Time", badge: "bg-emerald-500/20 text-emerald-400" },
                  { name: "Aman Verma", role: "DevOps Engineer", inTime: "09:35 AM", status: "5m Late", badge: "bg-amber-500/20 text-amber-400" },
                  { name: "Debashis Panda", role: "Account Head", inTime: "09:15 AM", status: "On Time", badge: "bg-emerald-500/20 text-emerald-400" },
                  { name: "Sunita Mohanty", role: "HR Executive", inTime: "09:30 AM", status: "On Time", badge: "bg-emerald-500/20 text-emerald-400" },
                ].map((row, idx) => (
                  <div key={idx} className="p-2 flex items-center justify-between">
                    <div>
                      <span className="font-sans font-bold text-white block">{row.name}</span>
                      <span className="text-[10px] text-slate-400 font-sans">{row.role}</span>
                    </div>
                    <span className="text-slate-300 font-bold">{row.inTime}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold ${row.badge}`}>
                      {row.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CRM Dedicated Mockup */}
        {selectedTab === 'crm' && (
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-200">Active Sales Pipeline (Kanban)</span>
              <span className="text-indigo-400 font-mono text-[11px]">Total Pipeline: ₹68.4L</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
                <div className="flex justify-between items-center font-bold text-blue-400 border-b border-slate-800 pb-1">
                  <span>Qualified (15)</span>
                  <span className="text-[10px]">₹14.2L</span>
                </div>
                <div className="p-2 bg-slate-950 rounded border border-slate-800 text-[10px]">
                  <span className="font-bold text-white block">Adani Green Tech</span>
                  <span className="text-slate-400">Deal: ₹4.5L • Sales: Rahul</span>
                </div>
                <div className="p-2 bg-slate-950 rounded border border-slate-800 text-[10px]">
                  <span className="font-bold text-white block">Odisha Mining Corp</span>
                  <span className="text-slate-400">Deal: ₹9.7L • Sales: Sneha</span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
                <div className="flex justify-between items-center font-bold text-purple-400 border-b border-slate-800 pb-1">
                  <span>Proposal (9)</span>
                  <span className="text-[10px]">₹22.5L</span>
                </div>
                <div className="p-2 bg-slate-950 rounded border border-slate-800 text-[10px]">
                  <span className="font-bold text-white block">Jindal Steel Ltd</span>
                  <span className="text-slate-400">Deal: ₹12.0L • Demo Given</span>
                </div>
                <div className="p-2 bg-slate-950 rounded border border-slate-800 text-[10px]">
                  <span className="font-bold text-white block">Odias Infotech</span>
                  <span className="text-slate-400">Deal: ₹3.8L • In Review</span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
                <div className="flex justify-between items-center font-bold text-emerald-400 border-b border-slate-800 pb-1">
                  <span>Won / Closed (12)</span>
                  <span className="text-[10px]">₹31.7L</span>
                </div>
                <div className="p-2 bg-slate-950 rounded border border-emerald-900/40 text-[10px]">
                  <span className="font-bold text-white block">Tata Metaliks</span>
                  <span className="text-emerald-400 font-bold">Won: ₹4.8L • Contracted</span>
                </div>
                <div className="p-2 bg-slate-950 rounded border border-emerald-900/40 text-[10px]">
                  <span className="font-bold text-white block">Paradip Port Auth</span>
                  <span className="text-emerald-400 font-bold">Won: ₹16.4L • Invoicing</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GST Billing Dedicated Mockup */}
        {selectedTab === 'billing' && (
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-400 block font-mono">ACTIVE INVOICE PREVIEW</span>
                <span className="text-sm font-bold text-white">INV-2026-00389 • Greenbacks Lexverse Pvt Ltd</span>
              </div>
              <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                CBIC GST Validated
              </span>
            </div>

            <div className="border border-slate-800 rounded-lg p-3 bg-slate-950 font-mono text-[11px] space-y-2">
              <div className="flex justify-between pb-1.5 border-b border-slate-800 text-[10px] text-slate-400">
                <span>HSN/SAC & DESCRIPTION</span>
                <span>QTY x RATE</span>
                <span>TAXABLE</span>
                <span>CGST+SGST</span>
                <span>TOTAL</span>
              </div>
              <div className="flex justify-between text-slate-200">
                <span className="font-sans font-medium text-white">#998314 Cloud ERP Annual License</span>
                <span>1 x ₹2,40,000</span>
                <span>₹2,40,000</span>
                <span className="text-emerald-400">18% (₹43,200)</span>
                <span className="font-bold text-white">₹2,83,200</span>
              </div>
              <div className="flex justify-between text-slate-200">
                <span className="font-sans font-medium text-white">#998315 Biometric Device Integration</span>
                <span>2 x ₹15,000</span>
                <span>₹30,000</span>
                <span className="text-emerald-400">18% (₹5,400)</span>
                <span className="font-bold text-white">₹35,400</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between font-black text-sm text-emerald-400">
                <span className="font-sans">Grand Total (Inclusive of GST):</span>
                <span>₹3,18,600.00</span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Bar with Actual Login Button Link */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-400 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Ready for live production data. Secure cloud authentication.</span>
          </div>
          <LoginButton
            text="Launch Live ERP System →"
            variant="primary"
            size="sm"
            showIcon={false}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardMockup;
