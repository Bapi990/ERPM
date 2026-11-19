/**
 * Centralized Configuration for Odias ERP Public Website.
 *
 * All Login buttons and portal redirects across the entire marketing website
 * reference this single source of truth.
 */

export const APP_CONFIG = {
  brandName: "Odias ERP",
  tagline: "One Platform. Every Business Operation.",
  supportingText: "Manage your workforce, customers, finances and entire business operations through one intelligent ERP platform.",
  
  // Public marketing website URL
  websiteUrl: import.meta.env.VITE_WEBSITE_URL || "http://localhost:5173",
  
  // ACTUAL ERP LOGIN URL:
  // Points to our running enterprise ERP application login endpoint.
  // Overridable via VITE_ERP_LOGIN_URL environment variable.
  loginUrl: import.meta.env.VITE_ERP_LOGIN_URL || "http://localhost:5174/login",
  
  // Direct portal shortcuts for role-based links
  adminLoginUrl: import.meta.env.VITE_ERP_ADMIN_LOGIN_URL || "http://localhost:5174/login",
  employeeLoginUrl: import.meta.env.VITE_ERP_EMPLOYEE_LOGIN_URL || "http://localhost:5174/login",
  
  // Contact & Demo Ingestion Endpoint
  demoApiUrl: import.meta.env.VITE_DEMO_API_URL || "http://localhost:8000/api/crm/leads/",
  
  // Company Contact Information
  contact: {
    email: "bsb120@nist.edu",
    salesEmail: "bsb120@nist.edu",
    phone: "+91 1234567890",
    headquarters: "LaxmiSager Bhubaneswar, Odisha",
    operationalHours: "Monday – Saturday: 9:00 AM – 7:00 PM IST",
  },
  
  // Social Links
  social: {
    linkedin: "https://linkedin.com/company/odias-erp",
    twitter: "https://twitter.com/odiaserp",
    youtube: "https://youtube.com/@odiaserp",
    github: "https://github.com/odias-erp"
  }
};
