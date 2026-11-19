# KALINGA ERP – Public Marketing & Showcase Website

> **"One Platform. Every Business Operation."**
> Manage your workforce, customers, finances and entire business operations through one intelligent ERP platform.

This is the **production-quality, premium public marketing website** for **KALINGA ERP**. It is distinct and separate from the internal ERP software dashboard, serving as the commercial showcase for enterprises, MSMEs, and fast-growing organizations.

---

## 🚀 Quick Start

### Prerequisites
- Node.js `v18+` or `v20+` (Tested on `v22.13.1`)
- npm `v9+` or `v10+`

### Installation & Launch
```bash
# Navigate to the website directory
cd website

# Install dependencies
npm install

# Start development server
npm run dev
# The website will launch on http://localhost:5173 (or http://localhost:5175 if 5173 is in use)

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🔑 Centralized ERP Login Integration

In compliance with the project requirements, **all Login buttons and portal redirects** across the entire website use a single source of truth:

**`src/config/appConfig.js`**
```javascript
export const APP_CONFIG = {
  brandName: "KALINGA ERP",
  tagline: "One Platform. Every Business Operation.",
  supportingText: "Manage your workforce, customers, finances and entire business operations through one intelligent ERP platform.",

  // Public marketing website URL
  websiteUrl: import.meta.env.VITE_WEBSITE_URL || "http://localhost:5173",

  // ACTUAL RUNNING ERP LOGIN URL
  loginUrl: import.meta.env.VITE_ERP_LOGIN_URL || "http://localhost:5174/login",

  // Role-specific entry points
  adminLoginUrl: import.meta.env.VITE_ERP_ADMIN_LOGIN_URL || "http://localhost:5174/login",
  employeeLoginUrl: import.meta.env.VITE_ERP_EMPLOYEE_LOGIN_URL || "http://localhost:5174/login",

  // Demo Lead Ingestion API
  demoApiUrl: import.meta.env.VITE_DEMO_API_URL || "http://localhost:8000/api/crm/leads/",
};
```

### The 7 Mandatory Login Entry Points
1. **Navbar Login**: Top right action button (`<LoginButton variant="navbar" />`)
2. **Hero Login**: Main call to action alongside "Explore Platform" (`<LoginButton variant="hero" />`)
3. **HRMS Showcase**: Direct portal link under the HRMS feature spotlight
4. **CRM Showcase**: Direct portal link under the Kanban Pipeline view
5. **GST Billing Showcase**: Direct portal link under the CBIC Tax Invoice preview
6. **Final CTA**: Full-width dark navy banner with large primary `"LOGIN TO KALINGA ERP →"` button
7. **Footer**: Under "Quick Access" with direct links for general login, Admin Login, and Employee Self-Service

All buttons:
- Open in a secure new tab with `target="_blank" rel="noopener noreferrer"`
- Point to the live configured `loginUrl`
- Never show duplicate fake login forms or dead routes.

---

## 🎨 Design System & Visual Standards

| Token | Hex Value | Purpose |
|---|---|---|
| **Primary** | `#2563EB` | Brand Royal Blue Accent & Action Buttons |
| **Dark Navy** | `#0F172A` / `#020617` | Premium Enterprise Contrast & Dark Sections |
| **Background** | `#FFFFFF` | Crisp, clean white SaaS surface |
| **Light BG** | `#F8FAFC` | Subtle contrast section backgrounds |
| **Text Primary** | `#111827` | Headings & High-contrast text |
| **Text Muted** | `#64748B` | Secondary descriptions and metadata |
| **Border** | `#E2E8F0` | Elegant hairline dividers |

**Typography:** Plus Jakarta Sans, Inter, and Manrope loaded via Google Fonts.

---

## 🧱 Project Architecture

```
website/
├── index.html                  # SEO metadata, OpenGraph tags, Google Fonts
├── vite.config.js              # Vite + Tailwind v4 + React configuration
├── package.json                # Dependencies: React 19, Tailwind, Framer Motion, GSAP, Lenis, Lucide
└── src/
    ├── config/
    │   └── appConfig.js        # Centralized login & brand URLs
    ├── data/
    │   ├── modules.js          # Deep HRMS, CRM, and Billing specifications
    │   ├── features.js         # 16 advanced enterprise ERP capabilities
    │   ├── industries.js       # 8 tailored industry workflow definitions
    │   └── faqs.js             # 11 FAQ accordion questions
    ├── components/
    │   ├── LoginButton.jsx     # Reusable mandatory ERP login button
    │   ├── DemoButton.jsx      # Smooth-scroll request demo button
    │   ├── SectionHeading.jsx  # Consistent typography and gradient badges
    │   ├── FeatureCard.jsx     # Card component with micro-interactions
    │   ├── DashboardMockup.jsx # High-fidelity interactive React software UI
    │   ├── ScrollProgress.jsx  # Top scroll position indicator
    │   ├── AnimatedCounter.jsx # Intersection-based counter animation
    │   ├── Navbar.jsx          # Sticky glassmorphism header with dropdown
    │   └── Footer.jsx          # 5-column comprehensive footer
    ├── sections/
    │   ├── Hero.jsx            # Headline, floating badges, dashboard mockup
    │   ├── About.jsx           # Unified central brain architecture diagram
    │   ├── HRMS.jsx            # Payroll (50% rule, EPFO, ESIC), shifts, attendance
    │   ├── CRM.jsx             # Visual 6-stage Kanban sales pipeline
    │   ├── Billing.jsx         # CBIC-compliant Tax Invoice mockup
    │   ├── Integration.jsx     # Interactive cross-module data route flows
    │   ├── ProductDemo.jsx     # Interactive sandbox tabs
    │   ├── Roles.jsx           # 6-role permission matrix (RBAC)
    │   ├── Features.jsx        # 16 enterprise capability cards
    │   ├── Industries.jsx      # Manufacturing, IT, Trading, Retail, etc.
    │   ├── Analytics.jsx       # Real-time report metrics & CSV downloads
    │   ├── Security.jsx        # Dark Navy zero-trust security architecture
    │   ├── WhyChooseUs.jsx     # 8 core business advantages
    │   ├── Testimonials.jsx    # Clearly labeled customer feedback placeholders
    │   ├── FAQ.jsx             # Animated accordion for 11 questions
    │   ├── Contact.jsx         # Request a Demo form with API integration
    │   └── FinalCTA.jsx        # Full-width high-impact gradient section
    ├── pages/
    │   ├── Home.jsx            # Main single-page scroll layout with Lenis
    │   ├── AboutPage.jsx       # Dedicated /about route
    │   └── ContactPage.jsx     # Dedicated /contact route
    ├── index.css               # Tailwind v4 directives and Lenis smooth scroll
    ├── App.jsx                 # React Router DOM mapping
    └── main.jsx                # Application root entry
```

---

## ⚙️ Environment Variables (Optional)

Create a `.env` file in `website/` to customize endpoints:
```env
VITE_WEBSITE_URL=https://kalingaerp.com
VITE_ERP_LOGIN_URL=http://localhost:5174/login
VITE_DEMO_API_URL=http://localhost:8000/api/crm/leads/
```

---

## 🏆 Key Features Demonstrated on the Website
1. **Lenis Smooth Scroll** with reduced-motion accessibility fallback.
2. **Interactive Software Mockup** showing realistic attendance, revenue, and pending invoice charts.
3. **Interactive Kanban Board** allowing visitors to switch between pipeline stages (Qualified, Proposal, Won).
4. **CBIC GST Tax Invoice Preview** detailing CGST, SGST, IGST, HSN/SAC codes, and authorized digital stamp.
5. **Interactive Cross-Module Integration Hub** showing how CRM, Billing, and HRMS connect without duplicate entry.
6. **Live Request a Demo Form** with instant validation, reference code generation, and CRM lead capture.
