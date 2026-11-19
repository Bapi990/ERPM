import React from 'react';
import { Cloud, ShieldCheck, Laptop, RefreshCw, Headphones } from 'lucide-react';
import { ScrollReveal } from '../components/ScrollReveal';

export const TrustRibbon = () => {
  const trustItems = [
    { label: 'Cloud Based', icon: Cloud },
    { label: 'Secure & Reliable', icon: ShieldCheck },
    { label: 'Access Anywhere', icon: Laptop },
    { label: 'Regular Updates', icon: RefreshCw },
    { label: 'Dedicated Support', icon: Headphones },
  ];

  return (
    <section className="relative z-20 py-4 sm:py-6 bg-gradient-to-b from-[#edf4ff]/70 via-white to-white border-y border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal direction="zoom" delay={50} duration={750}>
          <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 py-3.5 px-6 sm:px-10 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-md shadow-blue-500/5 text-xs sm:text-sm font-extrabold text-slate-800">
            {trustItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <React.Fragment key={item.label}>
                  <div className="flex items-center space-x-2.5 py-1 transition-transform hover:scale-105">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
                      <Icon className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="tracking-tight text-slate-800">{item.label}</span>
                  </div>
                  {index < trustItems.length - 1 && (
                    <div className="h-5 w-px bg-slate-200 hidden lg:block" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default TrustRibbon;
