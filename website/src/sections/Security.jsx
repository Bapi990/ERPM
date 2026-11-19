import React from 'react';
import {
  ShieldCheck, Lock, KeyRound, Clock, History,
  Database, Server, RefreshCw, CheckCircle2
} from 'lucide-react';
import { SectionHeading } from '../components/SectionHeading';
import { LoginButton } from '../components/LoginButton';

export const Security = () => {
  const securityPillars = [
    {
      title: "Cryptographic Authentication",
      desc: "PBKDF2 salted password hashing, automatic token expiration, and secure session cookies preventing unauthorized interception.",
      icon: KeyRound
    },
    {
      title: "Granular Role-Based Access (RBAC)",
      desc: "Strict compartmentalization ensuring that sales representatives, accountants, and general staff never see unauthorized records.",
      icon: ShieldCheck
    },
    {
      title: "Active Session Management",
      desc: "Tracks concurrent connected devices, client IP addresses, browser user-agents, and provides instant 1-click remote termination.",
      icon: Clock
    },
    {
      title: "Immutable Activity & Audit Trails",
      desc: "Every critical action—including invoice edits, salary calculations, and permission elevations—is permanently recorded with user IDs.",
      icon: History
    },
    {
      title: "Encrypted Cloud Storage",
      desc: "Employee KYC proofs, bank account details, and official corporate documents stored securely with restricted access controls.",
      icon: Lock
    },
    {
      title: "Automated Database Backups",
      desc: "Daily automated database snapshots with point-in-time recovery to protect critical enterprise records against accidental loss.",
      icon: Database
    }
  ];

  return (
    <section id="security" className="py-20 lg:py-28 bg-slate-950 text-white relative overflow-hidden">
      {/* Decorative ambient background */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeading
          badge="ZERO-TRUST ARCHITECTURE"
          title="Security and Control at"
          highlight="Every Level."
          subtitle="Your operational data contains your company's most sensitive assets—customer pipelines, employee salaries, and financial ledgers. We engineered Odias ERP with security at its foundation."
          dark={true}
        />

        {/* 6 Security Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {securityPillars.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-white tracking-tight mb-2">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Live Security Status Bar */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center space-x-3 text-emerald-400 font-mono font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Security Engine Status: Active Protection • No Vulnerabilities Detected</span>
          </div>

          <LoginButton
            text="Secure ERP Login →"
            variant="hero"
            size="sm"
          />
        </div>
      </div>
    </section>
  );
};

export default Security;
