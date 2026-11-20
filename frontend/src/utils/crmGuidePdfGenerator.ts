import { jsPDF } from 'jspdf';

/**
 * Enterprise CRM User & Developer Guide PDF Generator
 * Produces a multi-page PDF document detailing how to use Odias CRM
 * and how to integrate Inbound & Outbound Webhooks.
 */
export const generateCRMGuidePDF = (): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Helper: check page break
  const ensureSpace = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 20) {
      doc.addPage();
      y = margin;
    }
  };

  // Helper: Section title
  const addSectionTitle = (title: string, subtitle?: string) => {
    ensureSpace(subtitle ? 18 : 12);
    doc.setFillColor(24, 119, 242); // Primary blue
    doc.rect(margin, y, 3, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(title, margin + 6, y + 5.5);
    y += 9;

    if (subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(subtitle, margin + 6, y);
      y += 5;
    }
    y += 2;
  };

  // Helper: Subsection title
  const addSubsectionTitle = (title: string) => {
    ensureSpace(10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(title, margin, y + 4);
    y += 6;
  };

  // Helper: Paragraph
  const addParagraph = (text: string, spaceAfter = 3) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85); // slate-700
    const lines = doc.splitTextToSize(text, contentWidth);
    ensureSpace(lines.length * 4 + spaceAfter);
    doc.text(lines, margin, y);
    y += lines.length * 4 + spaceAfter;
  };

  // Helper: Bullet point
  const addBullet = (boldPrefix: string, text: string) => {
    doc.setFontSize(8.5);
    const fullText = `• ${boldPrefix}: ${text}`;
    const lines = doc.splitTextToSize(fullText, contentWidth - 4);
    ensureSpace(lines.length * 4 + 1.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`• ${boldPrefix}: `, margin + 2, y);

    const prefixWidth = doc.getTextWidth(`• ${boldPrefix}: `);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);

    // If fits in one line
    if (lines.length === 1) {
      doc.text(text, margin + 2 + prefixWidth, y);
      y += 5;
    } else {
      // Split rest of the text
      const restLines = doc.splitTextToSize(text, contentWidth - 6);
      doc.text(restLines[0], margin + 2 + prefixWidth, y);
      y += 4;
      for (let i = 1; i < restLines.length; i++) {
        doc.text(restLines[i], margin + 6, y);
        y += 4;
      }
      y += 1.5;
    }
  };

  // Helper: Code block box
  const addCodeBox = (codeLines: string[], title?: string) => {
    const boxHeight = (codeLines.length * 3.8) + (title ? 10 : 6);
    ensureSpace(boxHeight + 4);

    // Background
    doc.setFillColor(15, 23, 42); // slate-900 dark background
    doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, 'F');

    let currentCodeY = y + 5;
    if (title) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(title.toUpperCase(), margin + 4, currentCodeY);
      currentCodeY += 4.5;
    }

    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(226, 232, 240); // slate-200

    for (const line of codeLines) {
      doc.text(line, margin + 4, currentCodeY);
      currentCodeY += 3.8;
    }

    y += boxHeight + 4;
  };

  // =========================================================================
  // PAGE 1: COVER & HEADER BANNER
  // =========================================================================
  // Header Navy Banner
  doc.setFillColor(11, 23, 40); // #0b1728
  doc.rect(0, 0, pageWidth, 48, 'F');

  // Decorative Accent Bar
  doc.setFillColor(0, 229, 163); // Cyan accent
  doc.rect(0, 47, pageWidth, 1.5, 'F');

  // Title on Banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('ODIAS ENTERPRISE CRM', margin, 18);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('Complete Operating Manual, User Workflow & API Integration Guide', margin, 26);

  // Metadata Chips
  doc.setFontSize(7.5);
  doc.setTextColor(0, 229, 163);
  doc.text('VERSION 2.4.0', margin, 35);
  doc.setTextColor(203, 213, 225);
  doc.text('•  REAL-TIME WEBSOCKET & REST  •  GST COMPLIANT  •  MULTI-CHANNEL INGESTION', margin + 26, 35);

  y = 56;

  // Introduction / Executive Summary Box
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('EXECUTIVE OVERVIEW', margin + 4, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const summary = 'Odias Enterprise CRM is an all-in-one sales, marketing, and client relationship suite designed for fast-growing businesses. It connects inbound website leads, Meta ad campaigns, and external APIs directly into an intelligent pipeline, enabling sales teams to close deals faster and convert them seamlessly into commercial contracts and GST invoices.';
  const summaryLines = doc.splitTextToSize(summary, contentWidth - 8);
  doc.text(summaryLines, margin + 4, y + 11);
  y += 28;

  // CHAPTER 1: HOW TO USE THE CRM MODULES
  addSectionTitle('CHAPTER 1: HOW TO USE ODIAS CRM (MODULE GUIDE)', 'Step-by-step instructions for day-to-day sales and client operations');

  addSubsectionTitle('1.1 Inbound Leads & Prospect Management');
  addParagraph('Leads represent potential clients who have expressed interest in your products or services. Leads enter the system through three main avenues: (a) Automated Inbound Webhook from your website forms, (b) Social campaigns (Meta/Google Lead Ads), or (c) Manual entry via the "+ New Lead" button in the Leads Directory.');
  addBullet('Status Progression', 'New -> Contacted -> Qualified -> Proposal Sent -> Negotiation -> Won / Lost.');
  addBullet('Lead Scoring', 'AI-driven priority scoring based on deal size, company profile, and engagement level.');
  addBullet('Team Assignment', 'Assign leads to specific sales representatives or use automatic round-robin distribution.');

  addSubsectionTitle('1.2 Deals & Visual Sales Pipeline (Kanban)');
  addParagraph('When a lead expresses purchase intent, they transition into the Deals Pipeline. The pipeline displays opportunities across progressive stages: Discovery, Quotation, Final Negotiation, and Closed Won.');
  addBullet('Drag-and-Drop Kanban', 'Move deal cards across stages to instantly update probabilities and forecast revenue.');
  addBullet('Weighted Forecasting', 'Real-time calculation of expected revenue based on deal values and stage probabilities.');
  addBullet('One-Click Conversion', 'Once a deal reaches "Won", click "Convert to Customer" to create an active commercial client profile.');

  addSubsectionTitle('1.3 Contact Persons & Multi-Stakeholder Accounts');
  addParagraph('Enterprise sales involve multiple decision makers (CEOs, Procurement Heads, Technical Directors). The Contact Persons module lets you link multiple executives under one corporate client account, complete with direct phone numbers, email addresses, and designated roles.');

  addSubsectionTitle('1.4 Sales Activities, Follow-ups & Reminders');
  addParagraph('Never lose a deal to delayed follow-ups. Schedule calls, meetings, demos, and tasks directly on lead or customer dossiers. The system broadcasts real-time sound and desktop alerts when follow-ups are due.');

  // Check page break for Chapter 2
  ensureSpace(40);

  // CHAPTER 2: INBOUND WEBHOOK INTEGRATION
  addSectionTitle('CHAPTER 2: INBOUND API & WEBHOOK INTEGRATION', 'Connect external websites, landing pages, and lead forms to Odias CRM');

  addParagraph('The Inbound Webhook API enables any external website, mobile app, or form builder to submit new leads directly into your Odias CRM instance in real time without human intervention.');

  addSubsectionTitle('2.1 Inbound Webhook Endpoint');
  addCodeBox([
    'ENDPOINT : POST http://localhost:8000/api/v1/crm/lead-channels/webhook/',
    'HEADERS  : Content-Type: application/json',
    'SECURITY : Optional X-Odias-API-Key or open channel token'
  ], 'API Gateway Specification');

  addSubsectionTitle('2.2 Inbound JSON Payload Specification');
  addCodeBox([
    '{',
    '  "name": "Rajesh Kumar Mahapatra",         // (Required) Contact Full Name',
    '  "email": "rajesh@kalingasteels.com",       // (Required) Contact Email',
    '  "phone": "+91 98765 43210",                // (Recommended) Phone / WhatsApp',
    '  "company_name": "Kalinga Steels Pvt Ltd",  // (Optional) Enterprise Name',
    '  "source": "Website Contact Form",          // (Optional) Source Identifier',
    '  "notes": "Urgent quote for ERP cloud.",    // (Optional) Project Requirements',
    '  "estimated_value": 150000.00               // (Optional) Estimated Deal Size',
    '}'
  ], 'Sample JSON Request Body');

  // =========================================================================
  // PAGE BREAK FOR INTEGRATION EXAMPLES & OUTBOUND
  // =========================================================================
  doc.addPage();
  y = margin;

  addSectionTitle('CHAPTER 3: CONNECTING FORMS, WORDPRESS & SOCIAL ADS', 'Copy-paste code snippets and step-by-step integration recipes');

  addSubsectionTitle('3.1 Connecting an HTML / JavaScript Website Form');
  addParagraph('Add this simple JavaScript snippet to your website or landing page to submit form submissions directly to Odias CRM:');

  addCodeBox([
    'const leadData = {',
    '  name: document.getElementById("name").value,',
    '  email: document.getElementById("email").value,',
    '  phone: document.getElementById("phone").value,',
    '  company_name: document.getElementById("company").value,',
    '  source: "Landing Page Inbound"',
    '};',
    '',
    'fetch("http://localhost:8000/api/v1/crm/lead-channels/webhook/", {',
    '  method: "POST",',
    '  headers: { "Content-Type": "application/json" },',
    '  body: JSON.stringify(leadData)',
    '})',
    '.then(res => res.json())',
    '.then(data => alert("Thank you! Lead created: " + data.lead_id))',
    '.catch(err => console.error("Webhook error:", err));'
  ], 'Frontend JavaScript AJAX Snippet');

  addSubsectionTitle('3.2 Connecting WordPress & Elementor Pro');
  addBullet('Step 1', 'Open your Elementor contact form editor.');
  addBullet('Step 2', 'In the left panel under "Actions After Submit", choose "Webhook".');
  addBullet('Step 3', 'In the "Webhook" settings box, paste your Odias CRM Webhook URL:');
  addParagraph('http://localhost:8000/api/v1/crm/lead-channels/webhook/', 1);
  addBullet('Step 4', 'Ensure the form fields have IDs matching "name", "email", "phone", and "company_name". Click Update.');

  addSubsectionTitle('3.3 Connecting Meta Lead Ads (Facebook & Instagram)');
  addBullet('Native Zapier Integration', 'Set Meta Lead Ads as Trigger -> Choose Odias Webhook as Action -> Map fields.');
  addBullet('Make.com / Integromat', 'Use Meta Lead Ads Instant Trigger -> HTTP Module (POST) to Odias Webhook URL.');

  // CHAPTER 4: OUTBOUND WEBHOOKS
  addSectionTitle('CHAPTER 4: CUSTOM OUTBOUND WEBHOOKS', 'Dispatch real-time CRM events to Zapier, Make, Slack, or company servers');

  addParagraph('Whenever important events happen inside Odias CRM (e.g. new lead captured, deal won, customer created), the Outbound Webhook Engine automatically dispatches an HTTP POST request to your external endpoints.');

  addSubsectionTitle('4.1 Supported Outbound Events');
  addBullet('lead.created', 'Fired immediately when a new lead is saved in the database.');
  addBullet('lead.status_changed', 'Fired when a lead progresses to a new stage (e.g. Contacted, Qualified).');
  addBullet('deal.won', 'Fired when an opportunity is successfully closed won.');
  addBullet('customer.created', 'Fired when a prospect is officially converted to a paying customer.');

  addSubsectionTitle('4.2 Dynamic Payload Template Variables');
  addParagraph('You can customize the outgoing JSON body using double curly braces template variables:');
  addCodeBox([
    '{',
    '  "event": "lead.created",',
    '  "lead_id": "{{lead_id}}",',
    '  "contact_name": "{{contact_name}}",',
    '  "contact_email": "{{contact_email}}",',
    '  "company_name": "{{company_name}}",',
    '  "stage": "{{stage}}",',
    '  "deal_value": {{deal_value}},',
    '  "timestamp": "{{timestamp}}"',
    '}'
  ], 'Custom Payload Template');

  // =========================================================================
  // PAGE BREAK FOR REALTIME, SECURITY & TROUBLESHOOTING
  // =========================================================================
  doc.addPage();
  y = margin;

  addSectionTitle('CHAPTER 5: REALTIME EXPERIENCE & NOTIFICATION ARCHITECTURE', 'Instant event broadcasting, WebSocket engine, and multi-tenant security');

  addParagraph('Odias ERP uses an event-driven architecture combining Django REST framework with real-time browser messaging:');

  addBullet('Audio-Visual Chimes', 'When an inbound lead arrives, all authorized sales managers receive an instant chime notification and visual pill alert.');
  addBullet('Live Pipeline Sync', 'Kanban columns update automatically without requiring manual page reloads.');
  addBullet('Dual Database Resilience', 'The platform features automatic failover between MySQL and SQLite with zero transaction loss.');

  addSectionTitle('CHAPTER 6: API TROUBLESHOOTING & FAQ', 'Common integration issues and solutions');

  addBullet('CORS Header Issues', 'If calling from an external domain, ensure Django CORS whitelist includes your domain or call via server-side proxy.');
  addBullet('HTTP 400 Bad Request', 'Verify that both "name" and "email" fields are provided in the JSON payload.');
  addBullet('Duplicate Leads', 'If a lead with the same email already exists, Odias CRM appends the new inquiry into the activity history of the existing record rather than creating clutter.');
  addBullet('Payload Security', 'Use Custom Webhooks secret key to verify HMAC-SHA256 signatures on your receiving server.');

  // Document Sign-off Card
  y += 6;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(margin, y, contentWidth, 30, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 30, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('ODIAS ERP ENTERPRISE CLOUD PLATFORM', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('This document was dynamically compiled by Odias ERP Realtime Cloud Engine.', margin + 4, y + 12);
  doc.text('For developer support, contact: support@odiaserp.com | Documentation Portal: /app/crm/docs', margin + 4, y + 17);
  doc.text('Odias ERP © 2026. All rights reserved. Enterprise Proprietary & Confidential.', margin + 4, y + 22);

  // =========================================================================
  // ADD PROFESSIONAL FOOTER & PAGE NUMBERS TO ALL PAGES
  // =========================================================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Bottom border line
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    // Left Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('Odias Enterprise CRM — Complete User & API Integration Manual', margin, pageHeight - 7);

    // Right Footer (Page X of Y)
    const pageText = `Page ${i} of ${totalPages}`;
    doc.text(pageText, pageWidth - margin - doc.getTextWidth(pageText), pageHeight - 7);
  }

  // Trigger browser download of authentic PDF
  doc.save('Odias_CRM_Complete_User_and_API_Guide.pdf');
};
