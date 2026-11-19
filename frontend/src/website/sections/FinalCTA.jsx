import React from 'react';
import { ArrowRight, Sparkles, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { LoginButton } from '../components/LoginButton';
import { ScrollReveal } from '../components/ScrollReveal';
import { APP_CONFIG } from '../config/appConfig';

export const FinalCTA = () => {
  return (
    <section className="relative py-24 lg:py-32 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white overflow-hidden">
      {/* Decorative ambient glowing orbs */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-8">
        <ScrollReveal direction="up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs font-black tracking-widest uppercase">
            <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
            START RUNNING YOUR BUSINESS ON INTELLIGENT RAILS
          </div>

          {/* Heading */}
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12] mt-4">
            Your Business. Your ERP.{" "}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-white bg-clip-text text-transparent block sm:inline">
              Your Control.
            </span>
          </h2>
        </ScrollReveal>

        {/* Description */}
        <ScrollReveal direction="up" delay={120}>
          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            Bring your teams, customers and business operations together with Odias ERP.
          </p>
        </ScrollReveal>

        {/* Action Buttons with ZOOM REVEAL */}
        <ScrollReveal direction="zoom" delay={200}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <LoginButton
              text="LOGIN TO ODIAS ERP →"
              variant="cta"
              size="lg"
              className="w-full sm:w-auto hover:scale-105 transition-transform"
              showIcon={false}
            />

            <a
              href="#contact"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-black text-sm border border-white/20 transition-all flex items-center justify-center gap-2"
            >
              Contact Solutions Desk
            </a>
          </div>
        </ScrollReveal>

        {/* Guarantees */}
        <ScrollReveal direction="up" delay={280}>
          <div className="pt-8 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Zero Setup Fee
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              3-Day Guided Cloud Onboarding
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              100% Indian Statutory Compliant
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Single Central Login
            </span>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default FinalCTA;
