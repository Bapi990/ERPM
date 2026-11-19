import React from 'react';
import * as Icons from 'lucide-react';
import { SectionHeading } from '../components/SectionHeading';
import { INDUSTRIES_DATA } from '../data/industries';
import { DemoButton } from '../components/DemoButton';

export const Industries = () => {
  return (
    <section id="industries" className="py-20 lg:py-28 bg-white border-b border-slate-200/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badge="VERSATILE DOMAIN WORKFLOWS"
          title="Built for Businesses"
          highlight="Across Industries."
          subtitle="Whether you run a fast-paced software development company, a multi-shift manufacturing plant, or a regional distribution warehouse, Odias ERP adapts to your unique operational model."
        />

        {/* 8 Industry Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {INDUSTRIES_DATA.map((ind) => {
            const IconComponent = Icons[ind.icon] || Icons.Building2;
            return (
              <div
                key={ind.id}
                className="group p-6 rounded-3xl bg-slate-50/70 border border-slate-200/90 hover:bg-white hover:border-blue-500/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-xs">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      {ind.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors mb-2">
                    {ind.name}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {ind.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200/70">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Tailored Highlights:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {ind.highlights.map((h, hIdx) => (
                      <span
                        key={hIdx}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700"
                      >
                        ✓ {h}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <DemoButton
            text="Schedule an Industry-Specific Walkthrough →"
            variant="hero"
            size="md"
          />
        </div>
      </div>
    </section>
  );
};

export default Industries;
