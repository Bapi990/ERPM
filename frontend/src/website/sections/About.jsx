import React, { useState } from 'react';
import {
  Layers, Users, TrendingUp, Receipt, ShieldCheck,
  CheckCircle2, ArrowRight, Zap, RefreshCw, Database,
  Activity, Cpu, Radio, Sparkles
} from 'lucide-react';
import { SectionHeading } from '../components/SectionHeading';
import { LoginButton } from '../components/LoginButton';
import { ScrollReveal } from '../components/ScrollReveal';

export const About = () => {
  const [activePillar, setActivePillar] = useState(0);

  const pillars = [
    {
      id: "hrms",
      title: "Human Resources (HRMS)",
      desc: "Biometric shifts, 50% wage code payroll, EPFO/ESIC filings, leave management & stamped payslips.",
      icon: Users,
      color: "bg-blue-50 text-blue-600 border-blue-200",
      activeGlow: "border-blue-500/80 shadow-blue-500/20 shadow-lg ring-1 ring-blue-500/50",
      tag: "Auto-Payroll Sync"
    },
    {
      id: "crm",
      title: "Customer Pipeline (CRM)",
      desc: "Inbound lead capture from Meta, WhatsApp & Gmail, round-robin distribution, and visual Kanban deals.",
      icon: TrendingUp,
      color: "bg-indigo-50 text-indigo-600 border-indigo-200",
      activeGlow: "border-indigo-500/80 shadow-indigo-500/20 shadow-lg ring-1 ring-indigo-500/50",
      tag: "Live Lead Engine"
    },
    {
      id: "billing",
      title: "Smart GST Billing & Finance",
      desc: "CBIC-compliant tax invoices, HSN/SAC master, automated CGST/SGST/IGST, and stock ledgers.",
      icon: Receipt,
      color: "bg-purple-50 text-purple-600 border-purple-200",
      activeGlow: "border-purple-500/80 shadow-purple-500/20 shadow-lg ring-1 ring-purple-500/50",
      tag: "E-Invoice Ready"
    },
    {
      id: "automation",
      title: "Cross-Module Automation",
      desc: "Deals won in CRM instantly create sales orders in Billing, updating inventory and sales commissions.",
      icon: Zap,
      color: "bg-emerald-50 text-emerald-600 border-emerald-200",
      activeGlow: "border-emerald-500/80 shadow-emerald-500/20 shadow-lg ring-1 ring-emerald-500/50",
      tag: "Instant Event Stream"
    }
  ];

  return (
    <section id="about" className="py-20 lg:py-28 bg-gradient-to-b from-white via-slate-50/50 to-white border-b border-slate-100 relative overflow-hidden">
      {/* Ambient background blur elements */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <ScrollReveal direction="up" delay={50}>
          <SectionHeading
            badge="ABOUT THE PLATFORM"
            title="One Intelligent Platform to Manage"
            highlight="Your Entire Business."
            subtitle="Most companies struggle with fragmented software—one app for attendance, another for leads, and spreadsheets for billing. Odias ERP unifies your entire business into one synchronized operational engine."
          />
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Interactive Unified Architecture Graphic with SLIDE FROM LEFT */}
          <div className="lg:col-span-6 relative">
            <ScrollReveal direction="left" delay={150}>
              <div className="relative p-6 sm:p-8 bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl text-white overflow-hidden group">
                
                {/* Background ambient ring & pulse effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />

                {/* Animated Rotating Tech Ring around Central Node */}
                <div className="absolute top-[82px] left-1/2 -translate-x-1/2 w-28 h-28 border border-dashed border-blue-500/30 rounded-full animate-orbit-slow pointer-events-none" />

                {/* Center Brain Node with dynamic pulse */}
                <div className="flex flex-col items-center text-center mb-8 relative z-10">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-blue-500/40 mb-3 border border-blue-400/40 animate-pulse-glow transition-transform hover:scale-105 cursor-pointer">
                      O
                    </div>
                    {/* Live radar wave badge */}
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-950"></span>
                    </span>
                  </div>

                  <h4 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                    <span>Odias ERP CENTRAL BRAIN</span>
                    <Cpu className="w-4 h-4 text-blue-400 animate-pulse" />
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 justify-center">
                    <Database className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Single PostgreSQL & Realtime Event Stream Backbone</span>
                  </p>
                </div>

                {/* Connected Orbit Nodes with Interactive Hover & Staggered Reveal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10 text-xs">
                  {pillars.map((item, idx) => {
                    const Icon = item.icon;
                    const isActive = activePillar === idx;
                    return (
                      <div
                        key={idx}
                        onMouseEnter={() => setActivePillar(idx)}
                        className={`p-3.5 rounded-2xl bg-slate-900/90 border transition-all duration-300 cursor-pointer ${
                          isActive
                            ? item.activeGlow
                            : 'border-slate-800 hover:border-slate-700 hover:-translate-y-0.5'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2.5">
                            <div className={`p-2 rounded-xl ${item.color} border shrink-0`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="font-extrabold text-slate-200 block text-xs">
                              {item.title}
                            </span>
                          </div>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400 font-bold border border-slate-700">
                            {item.tag}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug">
                          {item.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Synchronized Live Status Bar */}
                <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-mono font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Zero Data Fragmentation
                  </span>
                  <div className="flex items-center gap-3 text-slate-500 font-mono text-[10px]">
                    <span className="flex items-center gap-1 text-blue-400">
                      <Radio className="w-3 h-3 animate-pulse" />
                      12ms Stream Latency
                    </span>
                    <span>Active Enterprise Cloud</span>
                  </div>
                </div>

              </div>
            </ScrollReveal>
          </div>

          {/* Right Column: Key Value Explanations with SLIDE FROM RIGHT */}
          <div className="lg:col-span-6 space-y-6">
            <ScrollReveal direction="right" delay={200}>
              <div className="space-y-4">
                <span className="text-xs font-black text-blue-600 tracking-wider uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>WHY CONSOLIDATION MATTERS</span>
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                  Stop Paying for 5 Disconnected Subscriptions. Experience Real-Time Harmony.
                </h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  When your sales reps win a deal in CRM, the finance department shouldn't have to re-type the customer's GSTIN and address into billing software. And when an employee is marked absent in HRMS, their loss-of-pay shouldn't have to be calculated by hand in payroll.
                </p>
              </div>
            </ScrollReveal>

            {/* 3 Value Pillars with Staggered Fade Up */}
            <div className="space-y-3.5">
              <ScrollReveal direction="up" delay={250}>
                <div className="flex items-start space-x-3 p-3 rounded-2xl bg-slate-50/80 hover:bg-slate-50 border border-slate-200/60 hover:border-blue-200 transition-all">
                  <div className="p-1 rounded-full bg-emerald-50 text-emerald-600 mt-1 shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">Unified Corporate Identity</h4>
                    <p className="text-xs text-slate-600 mt-0.5">Your official company branding, GSTIN, PAN, and authorized signatures propagate consistently across all invoices, payslips, and quotation documents.</p>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={320}>
                <div className="flex items-start space-x-3 p-3 rounded-2xl bg-slate-50/80 hover:bg-slate-50 border border-slate-200/60 hover:border-indigo-200 transition-all">
                  <div className="p-1 rounded-full bg-emerald-50 text-emerald-600 mt-1 shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">Real-Time Event Synchronisation</h4>
                    <p className="text-xs text-slate-600 mt-0.5">Every action—lead status update, biometric punch, or invoice dispatch—broadcasts instantly to managers with live desktop notifications.</p>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={390}>
                <div className="flex items-start space-x-3 p-3 rounded-2xl bg-slate-50/80 hover:bg-slate-50 border border-slate-200/60 hover:border-purple-200 transition-all">
                  <div className="p-1 rounded-full bg-emerald-50 text-emerald-600 mt-1 shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">Granular Role Shielding</h4>
                    <p className="text-xs text-slate-600 mt-0.5">Sales reps see only their assigned deals; employees see only their own attendance and payslips; while the Super Admin retains complete company-wide control.</p>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            <ScrollReveal direction="up" delay={450}>
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <LoginButton
                  text="Access Your Enterprise Account →"
                  variant="primary"
                  size="md"
                />
                <span className="text-xs text-slate-500 font-medium text-center sm:text-left flex items-center justify-center sm:justify-start gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Single Sign-On (SSO) Active</span>
                </span>
              </div>
            </ScrollReveal>

          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
