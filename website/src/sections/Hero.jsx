import React from 'react';
import {
  Sparkles, ArrowRight, ShieldCheck, CheckCircle2,
  Users, TrendingUp, Receipt, Layers, Play
} from 'lucide-react';
import { LoginButton } from '../components/LoginButton';
import { DemoButton } from '../components/DemoButton';
import { DashboardMockup } from '../components/DashboardMockup';

export const Hero = () => {
  return (
    <section className="relative pt-32 sm:pt-36 lg:pt-40 pb-20 lg:pb-32 overflow-hidden bg-gradient-to-b from-blue-50/40 via-white to-white">
      {/* Decorative background grid and gradients */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f015_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f015_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-blue-500/10 via-indigo-500/10 to-transparent blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Hero Content (7 Cols on desktop) */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            {/* Small Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/80 border border-blue-200/80 text-blue-700 text-xs font-black tracking-wider uppercase shadow-xs">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
              THE NEXT GENERATION BUSINESS MANAGEMENT PLATFORM
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
              Everything Your Business Needs.{" "}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 bg-clip-text text-transparent block sm:inline">
                One Powerful ERP.
              </span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Bring HRMS, CRM, GST Billing and business operations together with Odias ERP. Simplify workflows, connect teams and make smarter business decisions.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              <a
                href="#about"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Explore Platform</span>
                <ArrowRight className="w-4 h-4 text-blue-400" />
              </a>

              {/* MANDATORY ENTRY POINT 2: Hero Login to ERP */}
              <LoginButton
                text="Login to ERP"
                variant="hero"
                size="md"
                className="w-full sm:w-auto"
              />

              <DemoButton
                text="Book a Demo"
                variant="hero"
                size="md"
                className="w-full sm:w-auto hidden sm:inline-flex"
              />
            </div>

            {/* Secondary Highlights Badges */}
            <div className="pt-6 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                <span className="text-xs font-bold text-slate-700">HRMS & Payroll</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                <span className="text-xs font-bold text-slate-700">Omnichannel CRM</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                <span className="text-xs font-bold text-slate-700">Smart GST Billing</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
                <span className="text-xs font-bold text-slate-700">Unified Central Hub</span>
              </div>
            </div>
          </div>

          {/* Right Hero: Realistic Enterprise ERP Dashboard Mockup (6 Cols) */}
          <div className="lg:col-span-6 relative">
            {/* Ambient Back Glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-3xl blur-2xl -z-10 transform -rotate-1" />

            {/* Floating Live Badges */}
            <div className="hidden sm:flex absolute -top-4 -left-4 z-20 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200 shadow-xl items-center space-x-2.5 animate-bounce [animation-duration:4s]">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                ₹
              </div>
              <div className="text-xs">
                <span className="font-extrabold text-slate-900 block leading-tight">₹34.8 Lakhs</span>
                <span className="text-[10px] text-emerald-600 font-semibold">Monthly Sales Synced</span>
              </div>
            </div>

            <div className="hidden sm:flex absolute -bottom-4 -right-4 z-20 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200 shadow-xl items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-extrabold text-slate-900 block leading-tight">148 Employees</span>
                <span className="text-[10px] text-blue-600 font-semibold">EPFO & ECR Compliant</span>
              </div>
            </div>

            {/* High-Fidelity Mockup Container */}
            <DashboardMockup activeModule="overview" interactive={true} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
