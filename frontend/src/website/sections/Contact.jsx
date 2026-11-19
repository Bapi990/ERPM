import React, { useState } from 'react';
import {
  Send, Sparkles, CheckCircle2, AlertCircle, Building2,
  Phone, Mail, MapPin, Clock, ArrowRight, RefreshCw
} from 'lucide-react';
import { SectionHeading } from '../components/SectionHeading';
import { ScrollReveal } from '../components/ScrollReveal';
import { APP_CONFIG } from '../config/appConfig';

export const Contact = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    email: '',
    phone: '',
    industry: 'it-software',
    employeeCount: '10-50',
    requiredModules: ['hrms', 'crm', 'billing'],
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [referenceId, setReferenceId] = useState('');

  const handleModuleToggle = (mod) => {
    setFormData(prev => {
      const exists = prev.requiredModules.includes(mod);
      return {
        ...prev,
        requiredModules: exists
          ? prev.requiredModules.filter(m => m !== mod)
          : [...prev.requiredModules, mod]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.fullName.trim() || !formData.companyName.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setError("Please fill out all mandatory contact fields.");
      return;
    }

    if (!formData.email.includes('@') || !formData.email.includes('.')) {
      setError("Please enter a valid business email address.");
      return;
    }

    setLoading(true);

    try {
      // Post to central demoApiUrl
      const payload = {
        first_name: formData.fullName.split(' ')[0] || formData.fullName,
        last_name: formData.fullName.split(' ').slice(1).join(' ') || '',
        company_name: formData.companyName,
        email: formData.email,
        phone: formData.phone,
        source: 'Website Demo Request',
        notes: `Industry: ${formData.industry} | Staff: ${formData.employeeCount} | Modules: ${formData.requiredModules.join(', ')} | Note: ${formData.message}`,
        status: 'new'
      };

      const res = await fetch(APP_CONFIG.demoApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => null);

      // Generate verifiable reference
      const refCode = `DEMO-${Date.now().toString().slice(-6)}`;
      
      // Store inquiry in persistent storage for Super Admin Inquiries Panel
      const newInquiry = {
        id: refCode,
        fullName: formData.fullName,
        companyName: formData.companyName,
        email: formData.email,
        phone: formData.phone,
        industry: formData.industry,
        employeeCount: formData.employeeCount,
        requiredModules: formData.requiredModules,
        message: formData.message || 'Interested in enterprise cloud deployment.',
        status: 'new',
        createdAt: new Date().toISOString()
      };

      try {
        const stored = JSON.parse(localStorage.getItem('gb_website_inquiries') || '[]');
        localStorage.setItem('gb_website_inquiries', JSON.stringify([newInquiry, ...stored]));
        window.dispatchEvent(new CustomEvent('website_inquiry_received', { detail: newInquiry }));
      } catch (storageErr) {
        console.warn('Could not save website inquiry to localStorage:', storageErr);
      }

      setReferenceId(refCode);
      setSubmitted(true);
    } catch (err) {
      setError("Failed to reach server. Please try again or contact us directly at " + APP_CONFIG.contact.email);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="py-20 lg:py-28 bg-slate-50/70 border-b border-slate-200/80 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal direction="up">
          <SectionHeading
            badge="REQUEST A DEMONSTRATION"
            title="Let's Build a Smarter"
            highlight="Business Together."
            subtitle="Speak with an enterprise product architect. See a live walkthrough customized for your specific operational scale, shift patterns, and tax schedules."
          />
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start max-w-6xl mx-auto">
          {/* Left Column: Contact & Headquarters Details (5 Cols) SLIDE LEFT */}
          <div className="lg:col-span-5">
            <ScrollReveal direction="left" delay={150}>
              <div className="space-y-6 bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl">
                <div>
                  <span className="text-[10px] font-black tracking-widest uppercase text-blue-400 block mb-1">
                    CORPORATE HEADQUARTERS
                  </span>
                  <h3 className="text-xl font-black text-white tracking-tight">
                    Odias ERP TECHNOLOGIES
                  </h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    Direct consultation, on-premise installation support, and regional technical deployment assistance across India.
                  </p>
                </div>

                <div className="space-y-4 text-xs pt-4 border-t border-slate-800">
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block">Main Campus</span>
                      <span className="text-slate-400">{APP_CONFIG.contact.headquarters}</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Mail className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block">Email Inquiries</span>
                      <a href={`mailto:${APP_CONFIG.contact.salesEmail}`} className="text-blue-300 hover:underline">
                        {APP_CONFIG.contact.salesEmail}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Phone className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block">Direct Enterprise Desk</span>
                      <a href={`tel:${APP_CONFIG.contact.phone.replace(/[^0-9+]/g, '')}`} className="text-slate-300 hover:text-white">
                        {APP_CONFIG.contact.phone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block">Operational Hours</span>
                      <span className="text-slate-400">{APP_CONFIG.contact.operationalHours}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                    <span className="font-bold text-white block">Fast Implementation Guarantee:</span>
                    <p>Standard cloud onboarding completed in 3 business days, including employee master data migration.</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Column: Demo Form (7 Cols) SLIDE RIGHT */}
          <div className="lg:col-span-7">
            <ScrollReveal direction="right" delay={200}>
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl">
                {submitted ? (
                  <div className="p-8 text-center space-y-4 animate-in fade-in duration-300">
                    <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900">
                      Demo Request Received!
                    </h3>
                    <p className="text-sm text-slate-600 max-w-md mx-auto">
                      Thank you, <strong className="text-slate-900">{formData.fullName}</strong>. Your demonstration request for <strong className="text-slate-900">{formData.companyName}</strong> has been assigned reference ID:
                    </p>
                    <div className="inline-block px-4 py-2 bg-slate-100 rounded-xl font-mono font-black text-blue-600 text-sm">
                      {referenceId}
                    </div>
                    <p className="text-xs text-slate-500">
                      Our regional solutions architect will contact you within 4 business hours to schedule your tailored product walkthrough.
                    </p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 cursor-pointer"
                    >
                      Submit Another Request
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
                    {error && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Subhendu Kumar"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Company Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Odias Steel & Logistics"
                          value={formData.companyName}
                          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Business Email *</label>
                        <input
                          type="email"
                          required
                          placeholder="subhendu@company.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                        <input
                          type="tel"
                          required
                          placeholder="+91 1234567890"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Industry Sector</label>
                        <select
                          value={formData.industry}
                          onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 bg-white outline-none"
                        >
                          <option value="it-software">IT & Software</option>
                          <option value="manufacturing">Manufacturing & Defence</option>
                          <option value="retail">Retail & E-Commerce</option>
                          <option value="trading">Trading & Distribution</option>
                          <option value="consultancy">Consultancy & Legal</option>
                          <option value="service">Field Service & Maintenance</option>
                          <option value="startups">High-Growth Startup</option>
                          <option value="corporate">Large Corporate</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Employee Count</label>
                        <select
                          value={formData.employeeCount}
                          onChange={(e) => setFormData({ ...formData, employeeCount: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 bg-white outline-none"
                        >
                          <option value="1-10">1 – 10 Employees</option>
                          <option value="10-50">10 – 50 Employees</option>
                          <option value="50-200">50 – 200 Employees</option>
                          <option value="200-500">200 – 500 Employees</option>
                          <option value="500+">500+ Employees (Enterprise)</option>
                        </select>
                      </div>
                    </div>

                    {/* Required Modules Selection */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">Required Modules</label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: 'hrms', label: 'HRMS & Payroll' },
                          { id: 'crm', label: 'Omnichannel CRM' },
                          { id: 'billing', label: 'Smart GST Billing' },
                          { id: 'inventory', label: 'Inventory & Stock' },
                        ].map((mod) => {
                          const isSelected = formData.requiredModules.includes(mod.id);
                          return (
                            <button
                              key={mod.id}
                              type="button"
                              onClick={() => handleModuleToggle(mod.id)}
                              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {isSelected ? '✓ ' : '+ '} {mod.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Operational Requirements / Notes</label>
                      <textarea
                        rows={3}
                        placeholder="Describe any specific needs (e.g., biometric integration, multiple branches, migration from Tally/Excel)..."
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Submitting Request...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Request Tailored Demo</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-400 text-center pt-1">
                      We respect your privacy. Zero spam. Guaranteed enterprise data protection.
                    </p>
                  </form>
                )}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
