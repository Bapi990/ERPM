import React, { useState } from 'react';
import {
  Layers, Users, TrendingUp, Receipt, ArrowRight,
  Database, RefreshCw, Zap, ShieldCheck, CheckCircle2
} from 'lucide-react';
import { SectionHeading } from '../components/SectionHeading';
import { LoginButton } from '../components/LoginButton';

export const Integration = () => {
  const [activeModule, setActiveModule] = useState('crm_to_billing');

  const scenarios = [
    {
      id: 'crm_to_billing',
      label: 'CRM ➜ Billing',
      title: 'Automated Invoice Generation on Won Deals',
      flow: 'Opportunity marked WON in CRM ➔ Customer account auto-created with GSTIN ➔ Tax Invoice generated with HSN/SAC breakdown ➔ Payment milestone tracked in Accounts Receivable.'
    },
    {
      id: 'attendance_to_payroll',
      label: 'Attendance ➜ Payroll',
      title: 'Realtime Loss-of-Pay & Overtime Sync',
      flow: 'Biometric fingerprint or mobile punch in HRMS ➔ Unpaid leaves & absent days detected ➔ Payroll auto-adjusts LOP deductions ➔ 1-click stamped payslips released to staff.'
    },
    {
      id: 'billing_to_crm',
      label: 'Billing ➜ CRM',
      title: 'Payment Status Visible to Sales Reps',
      flow: 'Client pays invoice via NEFT/RTGS ➔ Accounts team logs receipt ➔ Sales pipeline updates deal to Paid ➔ Sales commission automatically queued for rep in Payroll.'
    },
    {
      id: 'hrms_to_billing',
      label: 'HRMS ➜ Finance',
      title: 'Department Cost & Payroll Allocation',
      flow: 'Monthly payroll finalized in HRMS ➔ Department salary expense ledger auto-posted into Chart of Accounts ➔ Corporate Profit & Loss report reflects real employee costs.'
    }
  ];

  const currentScenario = scenarios.find(s => s.id === activeModule) || scenarios[0];

  return (
    <section id="integration" className="py-20 lg:py-28 bg-white border-b border-slate-200/80 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeading
          badge="NATIVE CROSS-MODULE INTEGRATION"
          title="Everything Connected."
          highlight="Nothing Disconnected."
          subtitle="Unlike disparate SaaS tools tied together with brittle 3rd-party webhooks, Odias ERP shares a single relational database. When data changes in one module, the entire business updates instantaneously."
        />

        {/* Interactive Integration Diagram Canvas */}
        <div className="bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl text-white relative">
          {/* Subtle animated background grid */}
          <div className="absolute inset-0 bg-[radial-gradient(#3b82f615_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none rounded-3xl" />

          {/* Scenario Selector Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10 relative z-10">
            {scenarios.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveModule(s.id)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeModule === s.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Interactive Node Graph */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center relative z-10">
            {/* Node 1: HRMS */}
            <div className={`p-5 rounded-2xl border transition-all duration-300 ${
              activeModule.includes('attendance') || activeModule.includes('hrms')
                ? 'bg-blue-950/80 border-blue-500 shadow-xl shadow-blue-500/20'
                : 'bg-slate-950/70 border-slate-800 opacity-80'
            }`}>
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white">HRMS & Payroll</h4>
                  <span className="text-[10px] text-blue-400 font-mono">Workforce Hub</span>
                </div>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300 font-mono">
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  148 Staff Biometric Logs
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  LOP Absence Deductions
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  12% PF & 8.33% EPS Calculation
                </li>
              </ul>
            </div>

            {/* Center Node: Central ERP Brain */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-blue-600 to-indigo-700 border-2 border-blue-400 shadow-2xl text-center relative flex flex-col items-center justify-center transform md:scale-105">
              <div className="w-14 h-14 rounded-2xl bg-white text-blue-700 font-black flex items-center justify-center text-xl shadow-lg mb-3">
                K
              </div>
              <h3 className="font-black text-base text-white tracking-tight">
                Odias ERP ENGINE
              </h3>
              <p className="text-[11px] text-blue-100 font-medium mt-1">
                Unified PostgreSQL & WebSocket Pipeline
              </p>
              <div className="mt-3 px-3 py-1 rounded-full bg-white/20 text-white text-[10px] font-mono font-bold">
                100% ACID Transactional Guarantee
              </div>
            </div>

            {/* Node 3: CRM & Billing */}
            <div className={`p-5 rounded-2xl border transition-all duration-300 ${
              activeModule.includes('crm') || activeModule.includes('billing')
                ? 'bg-indigo-950/80 border-indigo-500 shadow-xl shadow-indigo-500/20'
                : 'bg-slate-950/70 border-slate-800 opacity-80'
            }`}>
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center font-bold">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white">CRM & GST Billing</h4>
                  <span className="text-[10px] text-indigo-400 font-mono">Revenue Hub</span>
                </div>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300 font-mono">
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  Won Leads ➔ Live Invoices
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  HSN/SAC Tariff Autofill
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  Realtime Bank Disbursals
                </li>
              </ul>
            </div>
          </div>

          {/* Active Flow Explanation Card */}
          <div className="mt-8 p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-slate-800 relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 block">
                ACTIVE DATA ROUTE: {currentScenario.title}
              </span>
              <p className="text-xs text-slate-300 mt-1 font-mono leading-relaxed">
                {currentScenario.flow}
              </p>
            </div>
            <LoginButton
              text="Experience Unified ERP →"
              variant="primary"
              size="sm"
              className="shrink-0"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Integration;
