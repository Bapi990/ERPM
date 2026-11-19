import React from 'react';
import { SectionHeading } from '../components/SectionHeading';
import { FeatureCard } from '../components/FeatureCard';
import { ADVANCED_FEATURES } from '../data/features';
import { LoginButton } from '../components/LoginButton';

export const Features = () => {
  return (
    <section id="features" className="py-20 lg:py-28 bg-slate-50/60 border-b border-slate-200/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badge="ENTERPRISE CAPABILITIES"
          title="Engineered for Scalability."
          highlight="Loaded with Power."
          subtitle="Discover the deep infrastructure features that empower modern fast-growing businesses to automate routine operations, eliminate human error, and maintain strict statutory compliance."
        />

        {/* 16 Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {ADVANCED_FEATURES.map((feat) => (
            <FeatureCard
              key={feat.id}
              title={feat.title}
              description={feat.description}
              icon={feat.icon}
              badge={feat.badge}
              category={feat.category}
            />
          ))}
        </div>

        {/* Bottom Banner */}
        <div className="mt-14 p-6 sm:p-8 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-xl font-black tracking-tight">
              Ready to Upgrade from Manual Spreadsheets to Odias ERP?
            </h3>
            <p className="text-xs text-blue-200">
              Set up your company workspace in under 15 minutes. Import existing employees and product items via Excel.
            </p>
          </div>
          <LoginButton
            text="Launch Your System Now →"
            variant="cta"
            size="md"
            className="shrink-0"
          />
        </div>
      </div>
    </section>
  );
};

export default Features;
