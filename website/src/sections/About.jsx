import React from 'react';
import {
  Layers, Users, TrendingUp, Receipt, ShieldCheck,
  CheckCircle2, ArrowRight, Zap, RefreshCw, Database
} from 'lucide-react';
import { SectionHeading } from '../components/SectionHeading';
import { LoginButton } from '../components/LoginButton';

export const About = () => {
  const pillars = [
    {
      title: "Human Resources (HRMS)",
      desc: "Biometric shifts, 50% wage code payroll, EPFO/ESIC filings, leave management & stamped payslips.",
      icon: Users,
      color: "bg-blue-50 text-blue-600 border-blue-200"
    },
    {
      title: "Customer Pipeline (CRM)",
      desc: "Inbound lead capture from Meta, WhatsApp & Gmail, round-robin distribution, and visual Kanban deals.",
      icon: TrendingUp,
      color: "bg-indigo-50 text-indigo-600 border-indigo-200"
    },
    {
      title: "Smart GST Billing & Finance",
      desc: "CBIC-compliant tax invoices, HSN/SAC master, automated CGST/SGST/IGST, and stock ledgers.",
      icon: Receipt,
      color: "bg-purple-50 text-purple-600 border-purple-200"
    },
    {
      title: "Cross-Module Automation",
      desc: "Deals won in CRM instantly create sales orders in Billing, updating inventory and sales commissions.",
      icon: Zap,
      color: "bg-emerald-50 text-emerald-600 border-emerald-200"
    }
  ];

  return (
    <section id="about" className="py-20 lg:py-28 bg-white border-b border-slate-100 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badge="ABOUT THE PLATFORM"
          title="One Intelligent Platform to Manage"
          highlight="Your Entire Business."
          subtitle="Most companies struggle with fragmented software—one app for attendance, another for leads, and spreadsheets for billing. Odias ERP unifies your entire business into one synchronized operational engine."
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Interactive Unified Architecture Graphic */}
          <div className="lg:col-span-6 relative">
            <div className="relative p-6 sm:p-8 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl text-white overflow-hidden">
              {/* Background ambient ring */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-600/15 rounded-full blur-2xl pointer-events-none" />

              {/* Center Brain Node */}
              <div className="flex flex-col items-center text-center mb-8 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-blue-500/30 mb-3 border border-blue-400/30">
                  K
                </div>
                <h4 className="text-lg font-black tracking-tight text-white">
                  Odias ERP CENTRAL BRAIN
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Single PostgreSQL & Realtime Event Stream Backbone
                </p>
              </div>

              {/* Connected Orbit Nodes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10 text-xs">
                {pillars.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-blue-500/50 transition-all hover:-translate-y-0.5"
                    >
                      <div className="flex items-center space-x-2.5 mb-2">
                        <div className={`p-2 rounded-xl ${item.color} border shrink-0`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-extrabold text-slate-200 block text-xs">
                          {item.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">
                        {item.desc}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Synchronized status bar */}
              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5 text-emerald-400 font-mono font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Zero Data Fragmentation
                </span>
                <span>Active Enterprise Cloud</span>
              </div>
            </div>
          </div>

          {/* Right Column: Key Value Explanations */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-4">
              <span className="text-xs font-black text-blue-600 tracking-wider uppercase">
                WHY CONSOLIDATION MATTERS
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                Stop Paying for 5 Disconnected Subscriptions. Experience Real-Time Harmony.
              </h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                When your sales reps win a deal in CRM, the finance department shouldn't have to re-type the customer's GSTIN and address into billing software. And when an employee is marked absent in HRMS, their loss-of-pay shouldn't have to be calculated by hand in payroll.
              </p>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-start space-x-3">
                <div className="p-1 rounded-full bg-emerald-50 text-emerald-600 mt-1">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">Unified Corporate Identity</h4>
                  <p className="text-xs text-slate-600 mt-0.5">Your official company branding, GSTIN, PAN, and authorized signatures propagate consistently across all invoices, payslips, and quotation documents.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="p-1 rounded-full bg-emerald-50 text-emerald-600 mt-1">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">Real-Time Event Synchronisation</h4>
                  <p className="text-xs text-slate-600 mt-0.5">Every action—lead status update, biometric punch, or invoice dispatch—broadcasts instantly to managers with live desktop notifications.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="p-1 rounded-full bg-emerald-50 text-emerald-600 mt-1">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">Granular Role Shielding</h4>
                  <p className="text-xs text-slate-600 mt-0.5">Sales reps see only their assigned deals; employees see only their own attendance and payslips; while the Super Admin retains complete company-wide control.</p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <LoginButton
                text="Access Your Enterprise Account →"
                variant="primary"
                size="md"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
