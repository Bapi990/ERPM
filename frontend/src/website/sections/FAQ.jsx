import React, { useState } from 'react';
import { ChevronDown, HelpCircle, MessageSquare } from 'lucide-react';
import { SectionHeading } from '../components/SectionHeading';
import { FAQS_DATA } from '../data/faqs';
import { LoginButton } from '../components/LoginButton';
import { ScrollReveal } from '../components/ScrollReveal';

export const FAQ = () => {
  const [openId, setOpenId] = useState(FAQS_DATA[0]?.id || null);

  const toggle = (id) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section id="faq" className="py-20 lg:py-28 bg-white border-b border-slate-200/80 relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal direction="up">
          <SectionHeading
            badge="KNOWLEDGE BASE & FAQ"
            title="Frequently Asked"
            highlight="Questions."
            subtitle="Everything you need to know about Odias ERP architecture, module capabilities, statutory compliance rules, and enterprise onboarding."
          />
        </ScrollReveal>

        {/* Accordion List with Alternating Left/Right Smooth Reveal */}
        <div className="space-y-3.5">
          {FAQS_DATA.map((faq, idx) => {
            const isOpen = openId === faq.id;
            const direction = idx % 2 === 0 ? 'left' : 'right';
            return (
              <ScrollReveal
                key={faq.id}
                direction={direction}
                delay={(idx % 5) * 60}
              >
                <div
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isOpen
                      ? 'bg-slate-50/80 border-blue-500/60 shadow-md shadow-blue-500/5'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <button
                    onClick={() => toggle(faq.id)}
                    className="w-full p-5 text-left font-extrabold text-sm sm:text-base text-slate-900 flex items-center justify-between gap-4 cursor-pointer select-none"
                    aria-expanded={isOpen}
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-blue-600 font-mono text-xs">Q.</span>
                      {faq.question}
                    </span>
                    <div className={`p-1.5 rounded-lg transition-transform duration-200 shrink-0 ${
                      isOpen ? 'bg-blue-600 text-white rotate-180' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-200/60 animate-in fade-in duration-150">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        {/* Still have questions banner with ZOOM REVEAL */}
        <ScrollReveal direction="zoom" delay={200}>
          <div className="mt-12 p-6 rounded-3xl bg-blue-50 border border-blue-200/80 text-center space-y-3 shadow-xs">
            <h4 className="font-black text-slate-900 text-base">
              Have a custom workflow question or require an on-premise installation?
            </h4>
            <p className="text-xs text-slate-600 max-w-xl mx-auto">
              Our enterprise architects are ready to evaluate your organizational processes and demonstrate tailored solutions.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <a
                href="#contact"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                Contact Solutions Specialist
              </a>
              <LoginButton
                text="Existing User Login →"
                variant="outline"
                size="sm"
              />
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default FAQ;
