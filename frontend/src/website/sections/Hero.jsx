import React, { useState } from 'react';
import {
  Sparkles, ArrowRight, ShieldCheck, CheckCircle2,
  Users, TrendingUp, Receipt, Layers, Calendar, Handshake,
  Rocket, Play, X, Cloud, Laptop, RefreshCw, Headphones, Check
} from 'lucide-react';
import { LoginButton } from '../components/LoginButton';
import { HeroProductStage } from '../components/HeroProductStage';
import { Modal } from '../../components/common/Modal';
import heroBgImage from '../../assets/new_hero_section_photo.png';

export const Hero = () => {
  const [overviewModalOpen, setOverviewModalOpen] = useState(false);
  const [activeTourTab, setActiveTourTab] = useState('hrms');

  const tourFeatures = [
    {
      id: 'hrms',
      name: 'HRMS & Biometric Payroll',
      tag: 'Workforce',
      desc: 'Seamless biometric attendance clocking, shift allocation rosters, 50% wage code compliance, and automated EPFO ECR generator.',
      metrics: ['148 Staff Managed', '99.8% Shift Accuracy', '1-Click Payroll Generation'],
      color: 'text-purple-600 bg-purple-50 border-purple-200'
    },
    {
      id: 'crm',
      name: 'Omnichannel CRM & Pipeline',
      tag: 'Revenue',
      desc: 'Meta Ads automated webhook capture, round-robin lead allocation, visual Kanban pipeline stages, and WhatsApp follow-up triggers.',
      metrics: ['₹34.8L Active Pipeline', '4.2x Faster Conversion', 'Round-Robin Lead Balancer'],
      color: 'text-blue-600 bg-blue-50 border-blue-200'
    },
    {
      id: 'billing',
      name: 'GST Billing & NIC E-Invoices',
      tag: 'Finance',
      desc: 'Tax invoice generation with QR code, HSN/SAC master lookup, CGST/SGST/IGST breakdown, and automated GSTR-1 & 3B audit trail.',
      metrics: ['100% Tax Compliant', 'NIC Portal Auto-Sync', 'E-Way Bill Generation'],
      color: 'text-amber-600 bg-amber-50 border-amber-200'
    },
    {
      id: 'operations',
      name: 'Projects, Assets & Operations',
      tag: 'Operations',
      desc: 'Sprint assignment lifecycle, daily work reports (DWR), laptop allocations, asset custody, and multi-tier approval chains.',
      metrics: ['28 Active Sprints', '12 Warehouses Connected', '100% Immutable Audit Trail'],
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200'
    }
  ];

  return (
    <>
      <section
        className="relative pt-24 sm:pt-28 lg:pt-32 pb-12 sm:pb-16 lg:pb-20 overflow-hidden bg-gradient-to-r from-[#efeafd] via-[#f4f7fe] to-[#edf4ff]"
      >
        {/* Full-bleed Hero Background Art (new hero section photo.png) */}
        <div 
          aria-hidden="true" 
          className="absolute inset-x-0 bottom-0 top-16 sm:top-20 lg:top-20 z-0 pointer-events-none select-none overflow-hidden"
        >
          <img
            src={heroBgImage}
            alt=""
            className="w-full h-full object-cover select-none"
            style={{ objectPosition: '68% bottom' }}
            loading="eager"
            fetchPriority="high"
          />
        </div>

        <div className="w-full max-w-[1600px] xl:max-w-[1680px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[440px] lg:min-h-[480px]">
            
            {/* Left Hero Content */}
            <div className="lg:col-span-6 xl:col-span-6 2xl:col-span-7 space-y-6 text-center lg:text-left z-20">
              
              {/* Top Crown Pill Badge matching user reference photo */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50/90 border border-amber-200/90 text-slate-800 text-xs font-black shadow-xs tracking-wide">
                <span className="text-amber-500 text-sm">👑</span>
                <span>All-in-One Business Management Platform</span>
              </div>

              {/* Main Heading with dynamic violet curve underline matching reference photo */}
              <h1 className="text-3xl sm:text-4xl lg:text-[2.85rem] xl:text-[3.35rem] 2xl:text-[3.65rem] font-black text-slate-900 tracking-tight leading-[1.14] max-w-2xl">
                Manage, Automate <br className="hidden sm:inline" />
                & Grow Your Business <br className="hidden sm:inline" />
                with{" "}
                <span className="relative inline-block whitespace-nowrap bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Odias ERP
                  
                  {/* Violet curved swoosh / smile underline beneath Odias ERP */}
                  <svg
                    className="absolute -bottom-2 sm:-bottom-2.5 left-0 w-full h-3 sm:h-4 text-purple-600 pointer-events-none select-none"
                    viewBox="0 0 320 16"
                    fill="none"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M3 11C80 3 240 3 317 10"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>

              {/* Subtitle Description */}
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                A powerful, integrated ERP to streamline your People, Sales, Finance, Inventory and Compliance — all in one place.
              </p>

              {/* 3 Feature Badges in a Horizontal Row matching exact photo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 max-w-2xl mx-auto lg:mx-0 text-left">
                {/* Badge 1: Higher Productivity */}
                <div className="flex items-center space-x-2.5 px-3.5 py-2.5 rounded-2xl bg-white/95 backdrop-blur-xs border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 shadow-2xs">
                    <Rocket className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 block leading-tight">Higher Productivity</span>
                  </div>
                </div>

                {/* Badge 2: Better Compliance */}
                <div className="flex items-center space-x-2.5 px-3.5 py-2.5 rounded-2xl bg-white/95 backdrop-blur-xs border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 block leading-tight">Better Compliance</span>
                  </div>
                </div>

                {/* Badge 3: Scalable for Growth */}
                <div className="flex items-center space-x-2.5 px-3.5 py-2.5 rounded-2xl bg-white/95 backdrop-blur-xs border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 block leading-tight">Scalable for Growth</span>
                  </div>
                </div>
              </div>

              {/* 3 Call to Action Buttons matching exact photo */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2 max-w-2xl">
                {/* Button 1: Explore Platform */}
                <a
                  href="#about"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 hover:from-slate-900 hover:to-indigo-900 text-white font-black text-sm shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer hover:shadow-lg active:scale-98"
                >
                  <span>Explore Platform</span>
                  <ArrowRight className="w-4 h-4 text-purple-300" />
                </a>

                {/* Button 2: Login to Portal */}
                <LoginButton
                  text="Login to Portal"
                  variant="primary"
                  size="md"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-black text-sm shadow-lg shadow-blue-500/25"
                />

                {/* Button 3: Watch Overview (Plays interactive walkthrough) */}
                <button
                  onClick={() => setOverviewModalOpen(true)}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-black text-sm border border-slate-200/90 shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer hover:shadow-md"
                >
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Play className="w-2.5 h-2.5 fill-blue-600 ml-0.5" />
                  </div>
                  <span>Watch Overview</span>
                </button>
              </div>

            </div>

            {/* Right Hero: Dedicated clearance area for the background photo artwork */}
            <div className="lg:col-span-6 xl:col-span-6 2xl:col-span-5 relative flex items-center justify-center lg:justify-end">
              <HeroProductStage />
            </div>

          </div>

        </div>

      </section>

      {/* ------------------------------------------------------------- */}
      {/* WATCH OVERVIEW INTERACTIVE WALKTHROUGH MODAL */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={overviewModalOpen}
        onClose={() => setOverviewModalOpen(false)}
        title="Odias ERP Platform Architecture Walkthrough"
      >
        <div className="space-y-5 text-left">
          {/* Feature Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-slate-100 pb-3">
            {tourFeatures.map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveTourTab(f.id)}
                className={`p-2.5 rounded-xl text-xs font-black transition-all cursor-pointer text-left ${
                  activeTourTab === f.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="text-[10px] opacity-75 uppercase block">{f.tag}</span>
                <span className="truncate block">{f.name.split(' ')[0]} Suite</span>
              </button>
            ))}
          </div>

          {/* Active Feature Detail Card */}
          {(() => {
            const cur = tourFeatures.find((f) => f.id === activeTourTab) || tourFeatures[0];
            return (
              <div className="space-y-4 p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-slate-900">{cur.name}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${cur.color}`}>
                    {cur.tag}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {cur.desc}
                </p>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                  {cur.metrics.map((m, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-white border border-slate-200/80 flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-xs font-bold text-slate-800">{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2">
            <LoginButton
              text="Launch Actual ERP Software"
              variant="primary"
              size="sm"
            />
            <button
              onClick={() => setOverviewModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
            >
              Close Preview
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Hero;
