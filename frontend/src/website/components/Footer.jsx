import React from 'react';
import {
  ShieldCheck, Heart, ArrowUpRight, Mail, Phone,
  MapPin, ExternalLink, Sparkles, LogIn
} from 'lucide-react';
import { APP_CONFIG } from '../config/appConfig';
import { LoginButton } from './LoginButton';
import { ScrollReveal } from './ScrollReveal';

export const Footer = () => {
  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800/80 pt-16 pb-12 font-sans relative overflow-hidden">
      {/* Decorative ambient background gradient */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <ScrollReveal direction="up">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-slate-800/80">
            {/* Col 1: Brand & Identity */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black flex items-center justify-center text-lg shadow-md shadow-blue-500/25">
                  O
                </div>
                <div>
                  <span className="text-xl font-black tracking-tight text-white block leading-tight">
                    ODIAS <span className="text-blue-500">ERP</span>
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
                    {APP_CONFIG.tagline}
                  </span>
                </div>
              </div>

              <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                {APP_CONFIG.supportingText} Built for modern Indian enterprises, MSMEs, manufacturing, IT companies, and growing startups.
              </p>

              <div className="space-y-2 text-xs text-slate-400 pt-2 font-medium">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>{APP_CONFIG.contact.headquarters}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                  <a href={`mailto:${APP_CONFIG.contact.email}`} className="hover:text-white transition-colors">
                    {APP_CONFIG.contact.email}
                  </a>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                  <a href={`tel:${APP_CONFIG.contact.phone.replace(/[^0-9+]/g, '')}`} className="hover:text-white transition-colors">
                    {APP_CONFIG.contact.phone}
                  </a>
                </div>
              </div>
            </div>

            {/* Col 2: Solutions */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                Solutions
              </h4>
              <ul className="space-y-2 text-xs font-medium">
                <li>
                  <a href="#hrms" className="text-slate-400 hover:text-white transition-colors">
                    HRMS & Payroll Suite
                  </a>
                </li>
                <li>
                  <a href="#crm" className="text-slate-400 hover:text-white transition-colors">
                    Omnichannel CRM
                  </a>
                </li>
                <li>
                  <a href="#billing" className="text-slate-400 hover:text-white transition-colors">
                    Smart GST Billing
                  </a>
                </li>
                <li>
                  <a href="#integration" className="text-slate-400 hover:text-white transition-colors">
                    Integrated Business Platform
                  </a>
                </li>
                <li>
                  <a href="#demo" className="text-slate-400 hover:text-white transition-colors">
                    Interactive Product Demo
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 3: Company & Resources */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                Company & Resources
              </h4>
              <ul className="space-y-2 text-xs font-medium">
                <li>
                  <a href="#about" className="text-slate-400 hover:text-white transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#features" className="text-slate-400 hover:text-white transition-colors">
                    Platform Features
                  </a>
                </li>
                <li>
                  <a href="#industries" className="text-slate-400 hover:text-white transition-colors">
                    Supported Industries
                  </a>
                </li>
                <li>
                  <a href="#faq" className="text-slate-400 hover:text-white transition-colors">
                    FAQ & Knowledge Base
                  </a>
                </li>
                <li>
                  <a href="#contact" className="text-slate-400 hover:text-white transition-colors">
                    Request Demonstration
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 4: Quick Access / Login Portal Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                <LogIn className="w-3.5 h-3.5 text-blue-400" />
                Quick Access
              </h4>
              <p className="text-[11px] text-slate-400">
                Access the running enterprise ERP software portal.
              </p>
              <ul className="space-y-2.5 text-xs font-semibold">
                <li>
                  <LoginButton
                    text="Login to ERP Portal"
                    variant="footer"
                    role="default"
                    showIcon={true}
                    iconPosition="right"
                  />
                </li>
                <li>
                  <LoginButton
                    text="Company Admin Login"
                    variant="footer"
                    role="admin"
                    showIcon={true}
                    iconPosition="right"
                  />
                </li>
                <li>
                  <LoginButton
                    text="Employee Self-Service Login"
                    variant="footer"
                    role="employee"
                    showIcon={true}
                    iconPosition="right"
                  />
                </li>
              </ul>

              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  ERP Cloud: Operational (v2.6)
                </span>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Bottom Sub-Footer */}
        <ScrollReveal direction="up" delay={150}>
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>
              © {new Date().getFullYear()} {APP_CONFIG.brandName}. All rights reserved. Indian IT & CBIC Statutory Compliant.
            </p>

            <div className="flex items-center space-x-6 text-slate-400">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms & Conditions</a>
              <a href="#" className="hover:text-white transition-colors">Security Disclosures</a>
              <a href="#contact" className="hover:text-white transition-colors">Support</a>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </footer>
  );
};

export default Footer;
