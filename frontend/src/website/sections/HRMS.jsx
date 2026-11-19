import React, { useState } from 'react';
import {
  Users, CalendarCheck, DollarSign, Award, Shield,
  CheckCircle2, Clock, FileText, ChevronRight, Laptop,
  UserPlus, ShieldAlert, Sparkles, ArrowRight, Download
} from 'lucide-react';
import { SectionHeading } from '../components/SectionHeading';
import { LoginButton } from '../components/LoginButton';
import { ScrollReveal } from '../components/ScrollReveal';
import { MODULES_DATA } from '../data/modules';

export const HRMS = () => {
  const data = MODULES_DATA.hrms;
  const [activeTab, setActiveTab] = useState('payroll'); // 'payroll' | 'attendance' | 'employee' | 'recruitment' | 'admin'

  const showcaseTabs = [
    { id: 'payroll', label: 'Payroll & Statutory Compliance', icon: DollarSign },
    { id: 'attendance', label: 'Live Attendance & Shifts', icon: CalendarCheck },
    { id: 'employee', label: 'Employee Self-Service (ESS)', icon: Laptop },
    { id: 'recruitment', label: 'Recruitment & Onboarding', icon: UserPlus },
    { id: 'admin', label: 'HR Admin & Analytics', icon: Users },
  ];

  return (
    <section id="hrms" className="py-20 lg:py-28 bg-slate-50/70 border-b border-slate-200/80 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal direction="up">
          <SectionHeading
            badge={data.badge}
            title={data.tagline}
            highlight="End-to-End."
            subtitle={data.description}
          />
        </ScrollReveal>

        {/* 4 Quick Stat Pills with Staggered Reveal */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-12">
          {data.stats.map((stat, idx) => (
            <ScrollReveal key={idx} direction="up" delay={idx * 100}>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all text-center hover:-translate-y-1">
                <span className="text-2xl sm:text-3xl font-black text-blue-600 font-mono block">
                  {stat.value}
                </span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mt-1">
                  {stat.label}
                </span>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Interactive Tab Switcher */}
        <ScrollReveal direction="up" delay={200}>
          <div className="flex border-b border-slate-200 overflow-x-auto space-x-2 pb-2 mb-8 no-scrollbar">
            {showcaseTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center space-x-2 whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </ScrollReveal>

        {/* Showcase Grid: Left Info & Roles, Right Mockup with SLIDE LEFT & RIGHT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 lg:p-10">
          {/* Left Column: Feature Breakdown SLIDE LEFT */}
          <div className="lg:col-span-5 space-y-6">
            <ScrollReveal direction="left" delay={250}>
            <div>
              <span className="text-xs font-black text-blue-600 uppercase tracking-wider block mb-1">
                FEATURE SPOTLIGHT
              </span>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {activeTab === 'payroll' && "Indian Code on Wages & EPFO / ESIC Engine"}
                {activeTab === 'attendance' && "Biometric Shifts & Automated LOP Calculation"}
                {activeTab === 'employee' && "Self-Service Portal (My Workspace)"}
                {activeTab === 'recruitment' && "Applicant Tracking & Digital Onboarding"}
                {activeTab === 'admin' && "Multi-Branch Headcount & Attrition Control"}
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                {activeTab === 'payroll' && "Automates 50% basic salary allocation, 12% employee/employer PF, 8.33% EPS pension capping, 0.75% ESI, State PT slabs, and outputs 1-click printable stamped payslips and EPFO ECR text returns."}
                {activeTab === 'attendance' && "Live check-in and check-out with biometric sync, shift roster scheduling, automatic late-arrival alerts (e.g., '10m late'), and protected national holidays."}
                {activeTab === 'employee' && "Gives employees secure self-service access to view their attendance punch records, leave balances, request advance loans, and download verified salary payslips."}
                {activeTab === 'recruitment' && "Manage open vacancies, track candidate resumes through screening and technical interview stages, generate branded offer letters, and run KYC verification."}
                {activeTab === 'admin' && "Centralized organizational management for departments, designations, salary bands, promotion histories, and confidential grievance redressal tickets."}
              </p>
            </div>

            {/* Checklist of highlights */}
            <div className="space-y-2.5 text-xs font-semibold text-slate-700">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>EPFO ECR Text format (#~# delimited) ready for Unified Portal</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Automated LOP deduction linked to verified attendance punches</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Form 16 Part A & B generation with authorized digital stamp</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Corporate bank NEFT / RTGS salary disbursement batch CSV</span>
              </div>
            </div>

            {/* Role Permissions Box */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
              <span className="font-extrabold text-slate-900 block text-[11px] uppercase tracking-wider">
                Role Separation
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div><strong className="text-slate-800">HR Manager:</strong> Full payroll & leaves</div>
                <div><strong className="text-slate-800">Dept Manager:</strong> Team shifts & approvals</div>
                <div><strong className="text-slate-800">Employee:</strong> Personal self-service</div>
                <div><strong className="text-slate-800">Super Admin:</strong> Corporate policy control</div>
              </div>
            </div>

            {/* MANDATORY ENTRY POINT 3: HRMS Explore / Login */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <LoginButton
                text="Login to HRMS Portal →"
                variant="primary"
                size="md"
              />
              <a
                href="#demo"
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:border-blue-600 text-slate-700 hover:text-blue-600 text-xs font-bold transition-colors"
              >
                Explore Live Demo
              </a>
            </div>
            </ScrollReveal>
          </div>

          {/* Right Column: High-Fidelity HRMS Software View SLIDE RIGHT */}
          <div className="lg:col-span-7">
            <ScrollReveal direction="right" delay={300}>
              <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-2xl text-white font-mono text-xs space-y-4">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-[11px]">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span className="font-bold text-white font-sans">
                  {activeTab === 'payroll' && "Payroll & Statutory Compliance (Nov 2026)"}
                  {activeTab === 'attendance' && "Daily Attendance Register & Shift Roster"}
                  {activeTab === 'employee' && "Employee Self-Service • Personal Ledger"}
                  {activeTab === 'recruitment' && "Applicant Tracking System (ATS)"}
                  {activeTab === 'admin' && "Organizational Headcount Matrix"}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold">
                PROD v2.6
              </span>
            </div>

            {/* Content Mockup for Active Tab */}
            {activeTab === 'payroll' && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block">Gross Outflow</span>
                    <span className="text-sm font-black text-white mt-0.5 block">₹7,07,850</span>
                    <span className="text-emerald-400">100% Policy Protected</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block">EPFO Liability</span>
                    <span className="text-sm font-black text-rose-400 mt-0.5 block">₹53,100</span>
                    <span className="text-blue-400">ECR Generated</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block">Net Disbursal</span>
                    <span className="text-sm font-black text-emerald-400 mt-0.5 block">₹6,65,050</span>
                    <span className="text-slate-400">NEFT Batch Ready</span>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-lg border border-slate-800 p-3 space-y-2">
                  <div className="flex justify-between items-center text-[11px] pb-1 border-b border-slate-800">
                    <span className="font-bold text-slate-300">Staff Contribution Register (Sample)</span>
                    <span className="text-emerald-400 font-bold">Wage Code Compliant</span>
                  </div>
                  <div className="space-y-1.5 text-[10px]">
                    <div className="flex justify-between text-slate-300">
                      <span>Priya Sharma (EMP001) • Basic ₹35,000</span>
                      <span className="text-rose-400">PF: ₹1,800 • PT: ₹200</span>
                      <span className="font-bold text-emerald-400">Net: ₹68,000</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Aman Verma (EMP002) • Basic ₹28,000</span>
                      <span className="text-rose-400">PF: ₹1,800 • PT: ₹200</span>
                      <span className="font-bold text-emerald-400">Net: ₹54,000</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Debashis Panda (EMP003) • Basic ₹45,000</span>
                      <span className="text-rose-400">PF: ₹1,800 • PT: ₹200</span>
                      <span className="font-bold text-emerald-400">Net: ₹88,000</span>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-between text-[11px]">
                  <span className="text-emerald-400">✓ Electronic Challan TRRN 1012611004829 verified & paid.</span>
                  <span className="text-[10px] text-slate-400">Bank: SBI</span>
                </div>
              </div>
            )}

            {activeTab === 'attendance' && (
              <div className="space-y-3">
                <div className="grid grid-cols-4 gap-2 text-[10px]">
                  <div className="p-2 bg-slate-900 rounded border border-slate-800 text-center">
                    <span className="text-slate-400 block">Total Staff</span>
                    <span className="text-sm font-bold text-white">148</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800 text-center">
                    <span className="text-slate-400 block">Present</span>
                    <span className="text-sm font-bold text-emerald-400">146</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800 text-center">
                    <span className="text-slate-400 block">Late (&gt;10m)</span>
                    <span className="text-sm font-bold text-amber-400">2</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800 text-center">
                    <span className="text-slate-400 block">On Leave</span>
                    <span className="text-sm font-bold text-blue-400">2</span>
                  </div>
                </div>

                <div className="bg-slate-900 rounded border border-slate-800 p-2.5 text-[10px] space-y-1.5">
                  <span className="font-bold text-slate-300 block border-b border-slate-800 pb-1">Realtime Check-in Log</span>
                  <div className="flex justify-between">
                    <span className="text-white">Sunita Mohanty</span>
                    <span className="text-slate-400">In: 09:28 AM • Out: --</span>
                    <span className="text-emerald-400 font-bold">On Time</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white">Rajesh Tripathy</span>
                    <span className="text-slate-400">In: 09:42 AM • Out: --</span>
                    <span className="text-amber-400 font-bold">12m Late (Tracked)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white">Kavita Sahoo</span>
                    <span className="text-slate-400">In: 09:25 AM • Out: --</span>
                    <span className="text-emerald-400 font-bold">On Time</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab !== 'payroll' && activeTab !== 'attendance' && (
              <div className="p-6 text-center text-slate-400 space-y-3">
                <Laptop className="w-8 h-8 text-blue-400 mx-auto" />
                <p className="text-xs text-slate-300">
                  Full interactive interactive interface active in live ERP portal.
                </p>
                <LoginButton
                  text="Open Dedicated Portal Screen →"
                  variant="primary"
                  size="sm"
                />
              </div>
            )}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HRMS;
