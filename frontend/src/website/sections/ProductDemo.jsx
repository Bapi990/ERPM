import React, { useState } from 'react';
import {
  Users, TrendingUp, Receipt, Layers, Play,
  CheckCircle2, ArrowRight, Sparkles, Sliders, ShieldCheck
} from 'lucide-react';
import { SectionHeading } from '../components/SectionHeading';
import { LoginButton } from '../components/LoginButton';
import { DashboardMockup } from '../components/DashboardMockup';
import { ScrollReveal } from '../components/ScrollReveal';

export const ProductDemo = () => {
  const [activeModule, setActiveModule] = useState('overview');

  return (
    <section id="demo" className="py-20 lg:py-28 bg-slate-900 text-white relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <ScrollReveal direction="up">
          <SectionHeading
            badge="INTERACTIVE PRODUCT SANDBOX"
            title="Experience the Odias ERP Interface."
            highlight="No Credit Card Required."
            subtitle="Explore our production-grade UI design. Switch between HRMS, CRM, and GST Billing to test real software workflows before deployment."
            dark={true}
          />
        </ScrollReveal>

        {/* Tab Controls with ZOOM REVEAL */}
        <ScrollReveal direction="zoom" delay={150}>
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            <button
              onClick={() => setActiveModule('overview')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center space-x-2 transition-all cursor-pointer ${
                activeModule === 'overview'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700 hover:bg-slate-750'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Executive Overview</span>
            </button>

            <button
              onClick={() => setActiveModule('hrms')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center space-x-2 transition-all cursor-pointer ${
                activeModule === 'hrms'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700 hover:bg-slate-750'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>HRMS & Payroll Suite</span>
            </button>

            <button
              onClick={() => setActiveModule('crm')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center space-x-2 transition-all cursor-pointer ${
                activeModule === 'crm'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700 hover:bg-slate-750'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Omnichannel CRM</span>
            </button>

            <button
              onClick={() => setActiveModule('billing')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center space-x-2 transition-all cursor-pointer ${
                activeModule === 'billing'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700 hover:bg-slate-750'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Smart GST Billing</span>
            </button>
          </div>
        </ScrollReveal>

        {/* Live Mockup with ZOOM REVEAL */}
        <ScrollReveal direction="zoom" delay={220}>
          <div className="max-w-5xl mx-auto transition-transform hover:scale-[1.005] duration-300">
            <DashboardMockup activeModule={activeModule} interactive={true} />
          </div>
        </ScrollReveal>

        {/* Bottom CTA Bar */}
        <ScrollReveal direction="up" delay={280}>
          <div className="mt-12 text-center space-y-4">
            <p className="text-xs text-slate-400 font-mono">
              Notice: All data displayed in the sandbox is mock simulation data for demonstration purposes.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <LoginButton
                text="Launch Real Enterprise Instance →"
                variant="hero"
                size="md"
              />
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default ProductDemo;
