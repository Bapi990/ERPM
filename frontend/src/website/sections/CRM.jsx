import React, { useState } from 'react';
import {
  TrendingUp, Users, PhoneCall, Calendar, Target,
  CheckCircle2, ArrowRight, Share2, Kanban, DollarSign,
  Clock, Award, Building, FileCheck, Layers
} from 'lucide-react';
import { SectionHeading } from '../components/SectionHeading';
import { LoginButton } from '../components/LoginButton';
import { ScrollReveal } from '../components/ScrollReveal';
import { MODULES_DATA } from '../data/modules';

export const CRM = () => {
  const data = MODULES_DATA.crm;
  const [activePipelineStage, setActivePipelineStage] = useState('Qualified');

  return (
    <section id="crm" className="py-20 lg:py-28 bg-white border-b border-slate-200/80 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal direction="up">
          <SectionHeading
            badge={data.badge}
            title={data.tagline}
            highlight="Zero Leaks."
            subtitle={data.description}
          />
        </ScrollReveal>

        {/* 4 Metrics with Staggered Fade Up */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-12">
          {data.stats.map((stat, idx) => (
            <ScrollReveal key={idx} direction="up" delay={idx * 100}>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/90 text-center hover:shadow-md transition-all hover:-translate-y-1">
                <span className="text-2xl sm:text-3xl font-black text-indigo-600 font-mono block">
                  {stat.value}
                </span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mt-1">
                  {stat.label}
                </span>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Visual Pipeline Stage Flow Banner with ZOOM REVEAL */}
        <ScrollReveal direction="zoom" delay={200}>
          <div className="mb-12 bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-black tracking-widest uppercase text-indigo-400 block">
                  INTERACTIVE KANBAN PIPELINE
                </span>
                <h3 className="text-lg font-black text-white">
                  6 Standard Enterprise Sales Stages
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Total Active Deals: <strong className="text-white">83 Deals (₹68.4 Lakhs)</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
              {data.pipelineStages.map((stage, idx) => {
                const isSelected = activePipelineStage === stage.name;
                return (
                  <div
                    key={idx}
                    onClick={() => setActivePipelineStage(stage.name)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-indigo-950/90 border-indigo-500 text-white shadow-md shadow-indigo-500/20'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:scale-[1.02]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-extrabold text-[11px] truncate">{stage.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-200 font-bold">
                        {stage.count}
                      </span>
                    </div>
                    <div className={`h-1 rounded-full ${stage.color} mb-1.5`} />
                    <p className="text-[9px] text-slate-400 line-clamp-2 leading-tight">
                      {stage.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollReveal>

        {/* 2-Column Split: Detailed Features on Left, Interactive CRM Board on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Feature List SLIDE LEFT */}
          <div className="lg:col-span-5 space-y-6">
            <ScrollReveal direction="left" delay={250}>
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-black text-indigo-600 uppercase tracking-wider block mb-1">
                    OMNICHANNEL REVENUE OPERATIONS
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    Capture Inbound Leads. Route Intelligently. Close Faster.
                  </h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    Connect your Meta Lead Ads, Google Ads Webhooks, WhatsApp Business API, and Website Contact Forms directly into Odias ERP. Automatically distribute leads to sales reps based on quota and track deal cycle velocity.
                  </p>
                </div>

                <div className="space-y-3 text-xs font-semibold text-slate-700">
                  <div className="flex items-start space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Round-Robin & Workload-Balanced Lead Assignment across reps</span>
                  </div>
                  <div className="flex items-start space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Call, Meeting & Follow-up History with client sentiment remarks</span>
                  </div>
                  <div className="flex items-start space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Won Deal auto-converts to Sales Order & pushes to GST Billing</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <LoginButton
                    text="Open CRM Pipeline →"
                    variant="primary"
                    size="md"
                  />
                  <a
                    href="#demo"
                    className="px-4 py-2.5 rounded-xl border border-slate-300 hover:border-indigo-600 text-slate-700 hover:text-indigo-600 text-xs font-bold transition-colors"
                  >
                    View Live Pipeline
                  </a>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Kanban Preview SLIDE RIGHT */}
          <div className="lg:col-span-7">
            <ScrollReveal direction="right" delay={300}>
              <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 shadow-2xl text-white font-mono text-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-[11px]">
                  <span className="font-bold text-white font-sans flex items-center gap-2">
                    <Kanban className="w-4 h-4 text-indigo-400" />
                    Live Opportunity Kanban Board • Realtime CRM
                  </span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold text-[10px]">
                    Stage: {activePipelineStage}
                  </span>
                </div>

                {/* Deal Cards Container */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 hover:border-indigo-500 transition-all space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold text-indigo-400 font-sans">#LEAD-2026-081</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-bold">High Priority</span>
                    </div>
                    <h4 className="font-sans font-extrabold text-white text-xs">Tata Advanced Systems</h4>
                    <p className="text-[10px] text-slate-400 font-sans">Custom defence manufacturing ERP implementation with 80 user licenses.</p>
                    <div className="pt-2 border-t border-slate-800 flex justify-between text-[10px] text-slate-300">
                      <span className="text-emerald-400 font-bold">Value: ₹18.5L</span>
                      <span>Owner: Rahul S.</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 hover:border-indigo-500 transition-all space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold text-indigo-400 font-sans">#LEAD-2026-082</span>
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[9px] font-bold">Meta Inbound</span>
                    </div>
                    <h4 className="font-sans font-extrabold text-white text-xs">Odias Agro Commodities</h4>
                    <p className="text-[10px] text-slate-400 font-sans">Wholesale multi-warehouse distribution billing with HSN tariff auto-fill.</p>
                    <div className="pt-2 border-t border-slate-800 flex justify-between text-[10px] text-slate-300">
                      <span className="text-emerald-400 font-bold">Value: ₹6.4L</span>
                      <span>Owner: Sneha P.</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 hover:border-indigo-500 transition-all space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold text-indigo-400 font-sans">#LEAD-2026-083</span>
                      <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[9px] font-bold">Demo Scheduled</span>
                    </div>
                    <h4 className="font-sans font-extrabold text-white text-xs">Bhubaneswar Medical Devices</h4>
                    <p className="text-[10px] text-slate-400 font-sans">Integrated GST Billing and employee shift attendance tracking.</p>
                    <div className="pt-2 border-t border-slate-800 flex justify-between text-[10px] text-slate-300">
                      <span className="text-emerald-400 font-bold">Value: ₹4.8L</span>
                      <span>Owner: Debashis</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 hover:border-indigo-500 transition-all space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold text-indigo-400 font-sans">#LEAD-2026-084</span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[9px] font-bold">Proposal Sent</span>
                    </div>
                    <h4 className="font-sans font-extrabold text-white text-xs">Jindal Port Logistics</h4>
                    <p className="text-[10px] text-slate-400 font-sans">Annual multi-branch ERP deployment with GST compliance reporting.</p>
                    <div className="pt-2 border-t border-slate-800 flex justify-between text-[10px] text-slate-300">
                      <span className="text-emerald-400 font-bold">Value: ₹12.0L</span>
                      <span>Owner: Rahul S.</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Automatic Round-Robin Lead Assignment: ACTIVE</span>
                  <span className="text-emerald-400 font-bold">99.8% Lead Capture Rate</span>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CRM;
