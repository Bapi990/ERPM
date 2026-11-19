import React from 'react';
import { Star, Building2, Quote, ShieldCheck } from 'lucide-react';
import { SectionHeading } from '../components/SectionHeading';

export const Testimonials = () => {
  // Explicitly labeled editable demo placeholders per master prompt instruction
  const placeholderTestimonials = [
    {
      id: "demo-1",
      quote: "Before adopting Odias ERP, our HR team spent five working days every month calculating LOP and generating PF ECR files on spreadsheets. Today, attendance, statutory deductions, and bank disbursal sheets run in less than five minutes.",
      role: "Vice President – Human Resources",
      companyType: "Manufacturing & Defence Engineering (450+ Staff)",
      location: "Odisha, India",
      rating: 5,
      tag: "HRMS & Statutory Payroll"
    },
    {
      id: "demo-2",
      quote: "The direct connection between CRM pipeline deals and GST tax invoicing eliminated our duplicate billing data entry entirely. Our sales cycle is 40% faster and our financial books reconcile in real-time.",
      role: "Managing Director",
      companyType: "Industrial Wholesale & Logistics Distribution",
      location: "Maharashtra, India",
      rating: 5,
      tag: "CRM & Smart GST Billing"
    },
    {
      id: "demo-3",
      quote: "As a fast-growing IT services company, having employee biometric check-ins, client quotation proposals, and CBIC tax invoices in one cloud portal has transformed our operational visibility.",
      role: "Chief Operating Officer",
      companyType: "Cloud Software & Enterprise IT Consultancy",
      location: "Karnataka, India",
      rating: 5,
      tag: "Unified ERP Deployment"
    }
  ];

  return (
    <section className="py-20 lg:py-28 bg-slate-50/70 border-b border-slate-200/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badge="ENTERPRISE ADOPTION"
          title="Designed for Operations Leaders"
          highlight="Who Demand Efficiency."
          subtitle="Explore feedback and workflow experiences from operations leaders who upgraded from fragmented software to our unified platform."
        />

        {/* Demo Notice Disclaimer Pill */}
        <div className="max-w-md mx-auto mb-10 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200/70 text-slate-700 text-[10px] font-mono font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
            Demo Showcase Placeholders • Customer References Available on Request
          </span>
        </div>

        {/* 3 Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {placeholderTestimonials.map((t) => (
            <div
              key={t.id}
              className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-md flex flex-col justify-between hover:border-blue-500/50 hover:shadow-xl transition-all duration-300"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex text-amber-400">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
                    {t.tag}
                  </span>
                </div>

                <Quote className="w-8 h-8 text-blue-600/20" />

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                  "{t.quote}"
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 space-y-1">
                <span className="font-extrabold text-sm text-slate-900 block">
                  {t.role}
                </span>
                <span className="text-xs text-slate-500 block">
                  {t.companyType}
                </span>
                <span className="text-[10px] text-slate-400 font-mono block">
                  Region: {t.location}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
