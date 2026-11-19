import React from 'react';
import {
  Layers, Users, Sparkles, TrendingUp, ShieldCheck,
  CheckCircle2, ArrowRight, Database, Clock, Scale
} from 'lucide-react';
import { SectionHeading } from '../components/SectionHeading';
import { LoginButton } from '../components/LoginButton';
import { DemoButton } from '../components/DemoButton';

export const WhyChooseUs = () => {
  const points = [
    {
      title: "Unified Business Management",
      desc: "One login, one navigation, and one consolidated dashboard replaces 5 disparate single-purpose subscriptions.",
      icon: Layers
    },
    {
      title: "Connected Departments",
      desc: "HR, Sales, Operations, and Accounts collaborate without manual email attachments or lost spreadsheet copies.",
      icon: Users
    },
    {
      title: "Less Manual Work & Duplicate Data",
      desc: "Data entered once flows across all modules. Deals won in CRM automatically seed customer billing records.",
      icon: Sparkles
    },
    {
      title: "Centralized Data Truth",
      desc: "Single relational PostgreSQL database ensures there are never conflicting customer balances or salary figures.",
      icon: Database
    },
    {
      title: "Organized Workflows & Approvals",
      desc: "Automated routing of leave applications, salary advance requests, and quotation discount authorizations.",
      icon: Clock
    },
    {
      title: "Better Statutory Reporting",
      desc: "Full compliance with Indian labor laws and CBIC tax standards—from EPFO ECR text returns to Form 16.",
      icon: Scale
    },
    {
      title: "Executive Management Visibility",
      desc: "Real-time visibility into weekly revenue run-rate, department payroll burdens, and sales rep quota velocity.",
      icon: TrendingUp
    },
    {
      title: "Scalable Enterprise Architecture",
      desc: "Built on high-performance Django REST Framework and React.js, ready to support from 10 to 5,000+ employees.",
      icon: ShieldCheck
    }
  ];

  return (
    <section className="py-20 lg:py-28 bg-white border-b border-slate-200/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badge="THE ODIAS ADVANTAGE"
          title="Why Forward-Thinking Businesses"
          highlight="Choose Odias ERP."
          subtitle="Discover how replacing fragmented tools with our unified platform cuts operational overhead, reduces human error, and accelerates company growth."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {points.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-blue-500/50 hover:shadow-xl transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-slate-900 tracking-tight mb-2">
                  {p.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {p.desc}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-14 text-center flex flex-wrap items-center justify-center gap-4">
          <LoginButton
            text="Login to Actual ERP Platform →"
            variant="primary"
            size="md"
          />
          <DemoButton
            text="Schedule a 1-on-1 Product Demo"
            variant="hero"
            size="md"
          />
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
