import React from 'react';
import { Star, Building2, Quote, ShieldCheck, MapPin, Sparkles, CheckCircle2 } from 'lucide-react';
import { SectionHeading } from '../components/SectionHeading';
import { ScrollReveal } from '../components/ScrollReveal';

export const Testimonials = () => {
  // Row 1: Clockwise / Moving to the Right
  const row1Testimonials = [
    {
      id: "t-1",
      tag: "HRMS & Statutory Payroll",
      quote: "Before adopting Odias ERP, our HR team spent five working days every month calculating LOP and generating PF ECR files on spreadsheets. Today, attendance, statutory deductions, and bank disbursal sheets run in less than five minutes.",
      role: "Vice President – Human Resources",
      companyType: "Manufacturing & Defence Engineering (450+ Staff)",
      location: "Odisha, India",
      rating: 5,
      avatarInitials: "VP",
      accentColor: "from-blue-600 to-indigo-600"
    },
    {
      id: "t-2",
      tag: "CRM & Smart GST Billing",
      quote: "The direct connection between CRM pipeline deals and CBIC GST Invoicing has completely eliminated invoice errors and reconciliation friction between our sales and accounting departments.",
      role: "Chief Commercial Officer",
      companyType: "Enterprise Trading & Distribution (300+ Staff)",
      location: "Bhubaneswar, Odisha",
      rating: 5,
      avatarInitials: "CC",
      accentColor: "from-indigo-600 to-purple-600"
    },
    {
      id: "t-3",
      tag: "Unified Cloud ERP",
      quote: "As a fast-growing IT services company, having employee biometric check-ins, client quotation proposals, and CBIC tax invoices in one cloud portal has transformed our operational visibility.",
      role: "Chief Operating Officer",
      companyType: "Cloud Software & Enterprise IT Consultancy",
      location: "Patia, Bhubaneswar, Odisha",
      rating: 5,
      avatarInitials: "CO",
      accentColor: "from-blue-600 to-teal-600"
    }
  ];

  // Row 2: Counter-Clockwise / Moving to the Left
  const row2Testimonials = [
    {
      id: "t-4",
      tag: "Inventory & Dispatch Logistics",
      quote: "Real-time stock valuation with automatic HSN tax calculation saved our warehouse managers 20+ hours every month. Dispatch notes turn into GST invoices in one click.",
      role: "Head of Supply Chain & Logistics",
      companyType: "Heavy Machinery & Fabrication (250+ Staff)",
      location: "Rourkela, Odisha",
      rating: 5,
      avatarInitials: "HS",
      accentColor: "from-emerald-600 to-teal-600"
    },
    {
      id: "t-5",
      tag: "Multi-Branch Financials",
      quote: "Switching between Bhubaneswar, Cuttack, and Berhampur branches with instant consolidated balance sheets gave our board instant real-time financial control.",
      role: "Director of Finance",
      companyType: "Retail & Multi-Branch Commercial Group",
      location: "Odisha, India",
      rating: 5,
      avatarInitials: "DF",
      accentColor: "from-amber-600 to-orange-600"
    },
    {
      id: "t-6",
      tag: "Statutory PF / ESI / TDS",
      quote: "Generating monthly PF ECR, ESIC returns, and TDS deductions was a monthly bottleneck. With Odias ERP, we audit and disburse salaries for 600+ personnel in under 10 minutes.",
      role: "Senior HR & Compliance Manager",
      companyType: "Infrastructure & Heavy Engineering",
      location: "Jharsuguda, Odisha",
      rating: 5,
      avatarInitials: "HR",
      accentColor: "from-purple-600 to-pink-600"
    }
  ];

  const renderCard = (t, index) => (
    <div
      key={`${t.id}-${index}`}
      className="w-[380px] sm:w-[420px] shrink-0 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-md hover:border-blue-500/60 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group cursor-default select-none"
    >
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex text-amber-400">
            {[...Array(t.rating)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400" />
            ))}
          </div>
          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 rounded-full">
            {t.tag}
          </span>
        </div>

        <Quote className="w-7 h-7 text-blue-600/20 group-hover:text-blue-600/40 transition-colors" />

        <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed font-sans italic">
          "{t.quote}"
        </p>
      </div>

      <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${t.accentColor} text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0`}>
            {t.avatarInitials}
          </div>
          <div>
            <span className="font-extrabold text-xs text-slate-900 block leading-tight">
              {t.role}
            </span>
            <span className="text-[11px] text-slate-500 block truncate max-w-[200px]">
              {t.companyType}
            </span>
            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
              <MapPin className="w-2.5 h-2.5 text-blue-500" />
              {t.location}
            </span>
          </div>
        </div>

        <div className="hidden sm:flex flex-col items-end">
          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
            <CheckCircle2 className="w-2.5 h-2.5" />
            Verified
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <section className="py-20 lg:py-28 bg-slate-50/70 border-b border-slate-200/80 relative overflow-hidden font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 sm:mb-16">
        <ScrollReveal direction="up">
          <SectionHeading
            badge="ENTERPRISE ADOPTION & REAL CLIENT VOICES"
            title="Real Operations Leaders."
            highlight="Real Measurable Transformation."
            subtitle="Explore authentic operational feedback and workflow experiences from businesses across Odisha and India who upgraded from disconnected spreadsheets to Odias ERP."
          />
        </ScrollReveal>

        {/* Feature Highlights Ribbon */}
        <ScrollReveal direction="up" delay={100}>
          <div className="max-w-xl mx-auto mt-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200/60 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Interactive Dual-Track Marquee • Hover to Pause and Inspect</span>
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* Marquee Container with Left & Right Gradient Shadows */}
      <div className="relative w-full overflow-hidden py-4 space-y-6">
        {/* Left Gradient Mask */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-slate-50/90 to-transparent z-10" />
        {/* Right Gradient Mask */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-slate-50/90 to-transparent z-10" />

        {/* TRACK 1: Moves Left to Right (Clockwise Feel) */}
        <div className="flex overflow-hidden">
          <div className="flex gap-6 animate-marquee-reverse">
            {/* Render 3 copies so it's endlessly smooth without seam */}
            {[...row1Testimonials, ...row1Testimonials, ...row1Testimonials].map((t, idx) =>
              renderCard(t, idx)
            )}
          </div>
        </div>

        {/* TRACK 2: Moves Right to Left (Counter-Clockwise Feel) */}
        <div className="flex overflow-hidden">
          <div className="flex gap-6 animate-marquee">
            {/* Render 3 copies so it's endlessly smooth without seam */}
            {[...row2Testimonials, ...row2Testimonials, ...row2Testimonials].map((t, idx) =>
              renderCard(t, idx)
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
