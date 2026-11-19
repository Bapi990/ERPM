import React, { useState, useEffect } from 'react';
import {
  Menu, X, ChevronDown, Sparkles, Users, TrendingUp,
  Receipt, Layers, ShieldCheck, ArrowRight, ExternalLink
} from 'lucide-react';
import { APP_CONFIG } from '../config/appConfig';
import { LoginButton } from './LoginButton';
import { DemoButton } from './DemoButton';

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [solutionsDropdownOpen, setSolutionsDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const solutions = [
    {
      title: "HRMS & Payroll Suite",
      desc: "Biometric shifts, 50% wage code, EPFO ECR & 1-click payslips",
      icon: Users,
      href: "#hrms",
      color: "text-blue-600 bg-blue-50"
    },
    {
      title: "Omnichannel CRM & Pipeline",
      desc: "Meta ads, round-robin lead distribution & Kanban sales stages",
      icon: TrendingUp,
      href: "#crm",
      color: "text-indigo-600 bg-indigo-50"
    },
    {
      title: "Smart GST Billing & Finance",
      desc: "Tax invoices, HSN/SAC master, CGST/SGST/IGST & stock ledgers",
      icon: Receipt,
      href: "#billing",
      color: "text-purple-600 bg-purple-50"
    },
    {
      title: "Central Integrated ERP Hub",
      desc: "Unified cross-module intelligence without data silos",
      icon: Layers,
      href: "#integration",
      color: "text-emerald-600 bg-emerald-50"
    }
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs py-3"
          : "bg-transparent py-4 sm:py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Left: Brand Identity */}
          <a href="#" className="flex items-center space-x-3 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white font-black flex items-center justify-center text-lg shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform duration-200">
              K
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900 block leading-tight">
                ODIAS <span className="text-blue-600">ERP</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block leading-tight hidden sm:block">
                One Platform. Every Business Operation.
              </span>
            </div>
          </a>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center space-x-1 text-sm font-bold text-slate-600">
            <a
              href="#"
              className="px-3.5 py-2 rounded-xl hover:text-blue-600 hover:bg-slate-50 transition-colors"
            >
              Home
            </a>
            <a
              href="#about"
              className="px-3.5 py-2 rounded-xl hover:text-blue-600 hover:bg-slate-50 transition-colors"
            >
              About
            </a>

            {/* Solutions Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setSolutionsDropdownOpen(true)}
              onMouseLeave={() => setSolutionsDropdownOpen(false)}
            >
              <button
                className={`px-3.5 py-2 rounded-xl flex items-center space-x-1 hover:text-blue-600 hover:bg-slate-50 transition-colors cursor-pointer ${
                  solutionsDropdownOpen ? "text-blue-600 bg-slate-50" : ""
                }`}
              >
                <span>Solutions</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${solutionsDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Animated Dropdown Menu */}
              {solutionsDropdownOpen && (
                <div className="absolute top-full left-0 w-80 p-2 bg-white rounded-2xl border border-slate-200/90 shadow-2xl shadow-slate-900/10 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                  {solutions.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <a
                        key={idx}
                        href={item.href}
                        onClick={() => setSolutionsDropdownOpen(false)}
                        className="flex items-start p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                      >
                        <div className={`p-2 rounded-lg ${item.color} mr-3 group-hover:scale-105 transition-transform`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-extrabold text-xs text-slate-900 group-hover:text-blue-600 block">
                            {item.title}
                          </span>
                          <span className="text-[11px] text-slate-500 font-normal leading-tight block mt-0.5">
                            {item.desc}
                          </span>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            <a
              href="#features"
              className="px-3.5 py-2 rounded-xl hover:text-blue-600 hover:bg-slate-50 transition-colors"
            >
              Features
            </a>
            <a
              href="#demo"
              className="px-3.5 py-2 rounded-xl hover:text-blue-600 hover:bg-slate-50 transition-colors"
            >
              Interactive Demo
            </a>
            <a
              href="#industries"
              className="px-3.5 py-2 rounded-xl hover:text-blue-600 hover:bg-slate-50 transition-colors"
            >
              Industries
            </a>
            <a
              href="#faq"
              className="px-3.5 py-2 rounded-xl hover:text-blue-600 hover:bg-slate-50 transition-colors"
            >
              FAQ
            </a>
            <a
              href="#contact"
              className="px-3.5 py-2 rounded-xl hover:text-blue-600 hover:bg-slate-50 transition-colors"
            >
              Contact
            </a>
          </nav>

          {/* Right Action Buttons (Desktop) */}
          <div className="hidden lg:flex items-center space-x-3">
            {/* MANDATORY ENTRY POINT 1: Navbar Login */}
            <LoginButton
              text="Login"
              variant="navbar"
              size="sm"
            />
            <DemoButton
              text="Book a Demo"
              variant="navbar"
              size="sm"
            />
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="lg:hidden flex items-center space-x-2">
            {/* Quick Login button on mobile header */}
            <LoginButton
              text="Login"
              variant="navbar"
              size="sm"
              showIcon={false}
            />

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white/98 backdrop-blur-xl border-b border-slate-200 px-4 pt-3 pb-6 space-y-4 shadow-xl animate-in slide-in-from-top-3 duration-200">
          <nav className="flex flex-col space-y-1 text-sm font-bold text-slate-700">
            <a
              href="#"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-xl hover:bg-slate-50"
            >
              Home
            </a>
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-xl hover:bg-slate-50"
            >
              About Platform
            </a>

            {/* Mobile Solutions */}
            <div className="p-2.5 bg-slate-50 rounded-xl space-y-2">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">
                ERP Modules
              </span>
              <a
                href="#hrms"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2 text-xs font-extrabold text-blue-600"
              >
                <Users className="w-4 h-4" />
                <span>HRMS & Payroll Suite</span>
              </a>
              <a
                href="#crm"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2 text-xs font-extrabold text-indigo-600"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Omnichannel CRM</span>
              </a>
              <a
                href="#billing"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2 text-xs font-extrabold text-purple-600"
              >
                <Receipt className="w-4 h-4" />
                <span>Smart GST Billing</span>
              </a>
              <a
                href="#integration"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2 text-xs font-extrabold text-emerald-600"
              >
                <Layers className="w-4 h-4" />
                <span>Unified Integration Hub</span>
              </a>
            </div>

            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-xl hover:bg-slate-50"
            >
              Features
            </a>
            <a
              href="#demo"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-xl hover:bg-slate-50"
            >
              Interactive Demo
            </a>
            <a
              href="#industries"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-xl hover:bg-slate-50"
            >
              Industries
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-xl hover:bg-slate-50"
            >
              FAQ
            </a>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-xl hover:bg-slate-50"
            >
              Contact & Demo
            </a>
          </nav>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
            <LoginButton
              text="Login to Actual ERP Portal"
              variant="primary"
              size="md"
              className="w-full"
            />
            <DemoButton
              text="Request Live Demonstration"
              variant="outline"
              size="md"
              className="w-full"
            />
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
