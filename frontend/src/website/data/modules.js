/**
 * Modules Data for Odias ERP
 * Deep specification for HRMS, CRM, and GST Billing
 */

export const MODULES_DATA = {
  hrms: {
    id: "hrms",
    name: "Human Resource Management (HRMS)",
    shortName: "HRMS",
    tagline: "Manage Your People. Empower Your Workforce.",
    description: "From hiring to retirement, streamline core employee lifecycles, biometric shift attendance, leave requests, 50% wage-code compliant payroll, and Indian statutory filings (EPFO & ESIC).",
    badge: "WORKFORCE & PAYROLL INTELLIGENCE",
    stats: [
      { label: "Attendance Accuracy", value: "99.9%" },
      { label: "Payroll Processing Time", value: "3 Mins" },
      { label: "Statutory Compliance", value: "100%" },
      { label: "Self-Service Adoption", value: "94%" },
    ],
    features: [
      {
        title: "Employee Lifecycle & Directory",
        description: "Complete employee record management, KYC document vault, emergency contacts, branch, department, and designation mapping.",
        icon: "Users"
      },
      {
        title: "Live Attendance & Shift Management",
        description: "Biometric and selfie geo-fencing check-in/out, multi-shift rosters, automated late-arrival penalty computation, and LOP tracking.",
        icon: "CalendarCheck"
      },
      {
        title: "Leave Management & Holiday Calendar",
        description: "Configurable paid, casual, medical, and privilege leaves with multi-tier managerial approval workflows and state holiday rules.",
        icon: "Calendar"
      },
      {
        title: "Statutory Payroll & 1-Click Payslips",
        description: "Indian Code on Wages 2019 compliance (50% basic ratio), EPFO ECR text file generation, ESIC challan, Professional Tax (PT), and TDS Form 16.",
        icon: "DollarSign"
      },
      {
        title: "Salary Advances, Loans & Bonuses",
        description: "Request emergency salary advances with automated monthly EMI payroll deductions, Diwali ex-gratia bonuses, and sales spot commissions.",
        icon: "Award"
      },
      {
        title: "Recruitment, Hiring & Onboarding",
        description: "Job posting management, applicant tracking system (ATS), multi-stage interview scheduling, offer letters, and digital onboarding checklist.",
        icon: "UserPlus"
      },
      {
        title: "Performance & Grievance Redressal",
        description: "Goal tracking, quarterly reviews, confidential employee grievance ticketing, and separation Full & Final (F&F) exit settlement.",
        icon: "ShieldAlert"
      },
      {
        title: "Employee Self-Service (My Workspace)",
        description: "Dedicated portal for employees to download stamped payslips, apply for leaves, view holiday lists, and request work-from-home.",
        icon: "Laptop"
      }
    ],
    roles: [
      { role: "Company Super Admin", access: "Full corporate control, company branding, multi-branch overview, and compliance audit logs." },
      { role: "HR Manager", access: "Employee onboarding/offboarding, leave approvals, payroll runs, biometric sync, and grievance handling." },
      { role: "Department Manager", access: "Team attendance monitoring, overtime recommendations, shift scheduling, and performance reviews." },
      { role: "Employee", access: "Personal attendance punch, leave balance viewing, payslip downloads, and task submissions." }
    ]
  },

  crm: {
    id: "crm",
    name: "Customer Relationship Management (CRM)",
    shortName: "CRM",
    tagline: "Turn Every Business Opportunity Into Growth.",
    description: "Capture leads from Website, WhatsApp, Meta & Email, auto-assign via round-robin, manage interactive visual Kanban pipelines, schedule client follow-ups, and track team sales quotas.",
    badge: "OMNICHANNEL PIPELINE & REVENUE",
    stats: [
      { label: "Lead Response Time", value: "< 5 Mins" },
      { label: "Deal Win Rate Boost", value: "+38%" },
      { label: "Follow-up Consistency", value: "100%" },
      { label: "Pipeline Visibility", value: "360°" },
    ],
    pipelineStages: [
      { name: "New Lead", count: 18, color: "bg-blue-500", desc: "Fresh inbound inquiries via APIs & campaigns" },
      { name: "Contacted", count: 24, color: "bg-indigo-500", desc: "First touch completed via call, email, or WhatsApp" },
      { name: "Qualified", count: 15, color: "bg-purple-500", desc: "Budget, authority, need, and timeline verified" },
      { name: "Proposal / Demo", count: 9, color: "bg-amber-500", desc: "Tailored quotation and live product demonstration" },
      { name: "Negotiation", count: 5, color: "bg-orange-500", desc: "Contract terms, volume pricing, and payment terms" },
      { name: "Won / Closed", count: 12, color: "bg-emerald-500", desc: "Deal closed; converted into commercial account & invoice" },
    ],
    features: [
      {
        title: "Omnichannel Lead Ingestion & APIs",
        description: "Connect Meta Ads, LinkedIn, Website Webhooks, WhatsApp Business, and Gmail to automatically capture and ingest leads without manual data entry.",
        icon: "Share2"
      },
      {
        title: "Intelligent Lead Assignment & Balancing",
        description: "Automated Round-Robin and load-balanced distribution to sales reps based on branch, expertise, and active workload.",
        icon: "UserCheck"
      },
      {
        title: "Visual Kanban Sales Pipeline",
        description: "Drag-and-drop opportunity cards across custom deal stages with deal value totals, win probability, and stage duration tracking.",
        icon: "Kanban"
      },
      {
        title: "Follow-up Management & Reminders",
        description: "Schedule calls, virtual meetings, and site visits with automatic notifications, calendar sync, and overdue alerts.",
        icon: "Clock"
      },
      {
        title: "Call & Meeting History with Remarks",
        description: "Comprehensive interaction audit trail. Record timestamps, call notes, next steps, and customer sentiment per prospect.",
        icon: "PhoneCall"
      },
      {
        title: "Commercial Customers & Contact Persons",
        description: "Maintain multiple decision-makers, direct phone numbers, GSTIN, and billing addresses for B2B corporate client accounts.",
        icon: "Building"
      },
      {
        title: "Sales Quotations & Instant Invoicing",
        description: "Draft professional sales quotations with HSN/SAC breakdown and 1-click conversion into final GST Tax Invoices.",
        icon: "FileCheck"
      },
      {
        title: "Sales Targets & Rep Performance",
        description: "Assign monthly revenue quotas, track individual closing ratios, average deal cycle velocity, and target achievement leaderboards.",
        icon: "TrendingUp"
      }
    ]
  },

  billing: {
    id: "billing",
    name: "Smart GST Billing & Finance",
    shortName: "GST Billing",
    tagline: "Smart GST Billing. Complete Financial Visibility.",
    description: "Enterprise Indian GST billing with automated CGST, SGST, IGST calculations, HSN/SAC code autofill, Proforma invoices, Purchase bills, Inventory stock ledgers, and GSTR returns audit reports.",
    badge: "CBIC COMPLIANT FINANCIAL ENGINE",
    stats: [
      { label: "Invoice Generation", value: "< 30 Sec" },
      { label: "GST Calculation Error", value: "0.00%" },
      { label: "E-Way & E-Invoice", value: "Ready" },
      { label: "Cashflow Clarity", value: "Realtime" },
    ],
    features: [
      {
        title: "GST Tax Invoices & Sales Orders",
        description: "Professional CBIC-compliant invoices featuring QR code, company stamp, signature, place of supply (POS), and terms & conditions.",
        icon: "Receipt"
      },
      {
        title: "HSN & SAC Code Master",
        description: "Pre-loaded database of Indian physical goods (HSN) and services (SAC) tariff classifications with automated GST slab autofill (0%, 5%, 12%, 18%, 28%).",
        icon: "Hash"
      },
      {
        title: "State-wise Tax Engine (CGST / SGST / IGST)",
        description: "Intelligent origin vs destination state code detection. Automatically splits CGST+SGST for intra-state or IGST for inter-state transactions.",
        icon: "Percent"
      },
      {
        title: "Flexible Discount & Pricing Modes",
        description: "Support for GST inclusive/exclusive rates, item-level discounts, invoice-level percentage/flat deductions, and standard round-off.",
        icon: "Tag"
      },
      {
        title: "Quotations, Proformas & Credit/Debit Notes",
        description: "Full accounting lifecycle support from initial sales quotation to proforma invoice, formal tax invoice, and credit/debit return notes.",
        icon: "FileText"
      },
      {
        title: "Purchase Bills & Vendor Expense Ledger",
        description: "Record vendor purchase bills, track supplier accounts payable, log operating business expenses, and reconcile Input Tax Credit (ITC).",
        icon: "ShoppingBag"
      },
      {
        title: "Multi-Warehouse Inventory & Stock Ledger",
        description: "Real-time stock tracking with low-stock alerts, warehouse transfers, stock physical adjustments, and FIFO valuation.",
        icon: "Layers"
      },
      {
        title: "Accounts Receivable & Payment Collection",
        description: "Track advance payments, partial receipts, outstanding aging ledgers, automated payment reminder receipts, and HDFC bank reconciliation.",
        icon: "CreditCard"
      }
    ]
  }
};
