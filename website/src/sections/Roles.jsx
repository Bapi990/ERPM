import React from 'react';
import {
  ShieldCheck, UserCheck, Users, Briefcase, Receipt,
  Check, X, Lock, KeyRound, ArrowRight
} from 'lucide-react';
import { SectionHeading } from '../components/SectionHeading';
import { LoginButton } from '../components/LoginButton';

export const Roles = () => {
  const roles = [
    {
      name: "Company Super Admin",
      code: "super_admin",
      badge: "Full Control",
      desc: "Corporate owner with complete company-wide governance, branding settings, branch configurations, and tamper-proof audit trails.",
      color: "border-blue-500 bg-blue-50/50",
      permissions: {
        hrms: "Full (All Branches)",
        payroll: "Authorize & Release",
        crm: "Global Pipeline",
        billing: "Full Tax & Invoices",
        audit: "Access Immutable Logs"
      }
    },
    {
      name: "HR Manager",
      code: "hr_manager",
      badge: "Workforce & Compliance",
      desc: "Manages employee directory, shifts, biometric attendance sync, leaves, salary structures, EPFO ECR generation, and hiring.",
      color: "border-indigo-500 bg-indigo-50/50",
      permissions: {
        hrms: "Full Management",
        payroll: "Calculate & Draft",
        crm: "No Access (Shielded)",
        billing: "No Access (Shielded)",
        audit: "HR Audit Only"
      }
    },
    {
      name: "Department Manager",
      code: "manager",
      badge: "Team Operations",
      desc: "Supervises their direct reports only. Approves leave applications, shift swaps, and views team goal progress without seeing salaries.",
      color: "border-purple-500 bg-purple-50/50",
      permissions: {
        hrms: "Direct Reports Only",
        payroll: "No Salary Access",
        crm: "Team Leads & Deals",
        billing: "No Access",
        audit: "Team Action Logs"
      }
    },
    {
      name: "Sales Rep / CRM Team",
      code: "sales",
      badge: "Revenue Growth",
      desc: "Captures inbound prospects, runs follow-ups, moves opportunities across Kanban deal stages, and converts quotes to invoices.",
      color: "border-amber-500 bg-amber-50/50",
      permissions: {
        hrms: "Self-Service Only",
        payroll: "Personal Commission",
        crm: "Assigned Leads Only",
        billing: "Create Quotations",
        audit: "No System Logs"
      }
    },
    {
      name: "Accounts & Billing",
      code: "accounts",
      badge: "Financial Control",
      desc: "Disburses CBIC GST tax invoices, checks HSN/SAC codes, reconciles payments, enters purchase bills, and exports GSTR summaries.",
      color: "border-emerald-500 bg-emerald-50/50",
      permissions: {
        hrms: "No HR Access",
        payroll: "Disbursal NEFT Batch",
        crm: "Commercial Accounts",
        billing: "Full Invoicing & GST",
        audit: "Billing Logs"
      }
    },
    {
      name: "Standard Employee",
      code: "employee",
      badge: "Self-Service",
      desc: "Clean personal portal (My Workspace) to punch daily biometric attendance, view leave balances, and download monthly payslips.",
      color: "border-slate-400 bg-slate-50",
      permissions: {
        hrms: "Personal Profile",
        payroll: "Download Payslips",
        crm: "No Access",
        billing: "No Access",
        audit: "Personal Logins"
      }
    }
  ];

  return (
    <section id="roles" className="py-20 lg:py-28 bg-white border-b border-slate-200/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badge="GRANULAR ROLE-BASED ACCESS (RBAC)"
          title="One Platform. Different Roles."
          highlight="Smarter Workflows."
          subtitle="Enterprise data security requires strict boundaries. Odias ERP automatically shields sensitive salary and customer financial information so every team member sees only what they are authorized to manage."
        />

        {/* 6 Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {roles.map((r, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-3xl border-2 ${r.color} shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-900 text-white">
                    {r.badge}
                  </span>
                  <KeyRound className="w-4 h-4 text-slate-500" />
                </div>

                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  {r.name}
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {r.desc}
                </p>

                {/* Permissions Breakdown Matrix */}
                <div className="mt-5 pt-4 border-t border-slate-200/80 space-y-2 text-xs font-mono">
                  <div className="flex justify-between items-center">
                    <span className="font-sans text-slate-600">HRMS & Attendance:</span>
                    <span className="font-bold text-slate-900">{r.permissions.hrms}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-sans text-slate-600">Payroll & Salaries:</span>
                    <span className={`font-bold ${r.permissions.payroll.includes('No') ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {r.permissions.payroll}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-sans text-slate-600">CRM & Leads:</span>
                    <span className="font-bold text-slate-900">{r.permissions.crm}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-sans text-slate-600">GST Billing & Tax:</span>
                    <span className={`font-bold ${r.permissions.billing.includes('No') ? 'text-rose-600' : 'text-blue-700'}`}>
                      {r.permissions.billing}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-slate-500">
                  Role Code: {r.code}
                </span>
                <LoginButton
                  text="Login"
                  variant="outline"
                  size="sm"
                  role={r.code === 'super_admin' ? 'admin' : r.code === 'employee' ? 'employee' : 'default'}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Roles;
