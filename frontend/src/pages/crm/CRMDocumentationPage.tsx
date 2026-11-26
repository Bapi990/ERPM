import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Code2, Download, Radio, Send, CheckCircle2, Copy, Check,
  ExternalLink, Sparkles, Terminal, FileText, Layers, ShieldCheck,
  Globe, ArrowRight, Play, RefreshCw, Smartphone, Laptop, AlertCircle,
  HelpCircle, UserCheck, BarChart3, MessageSquare, Headphones, FileCode
} from 'lucide-react';
import { api } from '../../api/client';
import { useRealtime } from '../../context/RealtimeContext';
import { generateCRMGuidePDF } from '../../utils/crmGuidePdfGenerator';
import { getInboundWebhookUrl, getPublicApiOrigin } from '../../utils/webhookUrl';

export const CRMDocumentationPage: React.FC = () => {
  const inboundUrl = getInboundWebhookUrl('/api/v1/crm/webhook/');
  const captureAliasUrl = getInboundWebhookUrl('/api/v1/crm/leads/capture/');
  const liveApiOrigin = getPublicApiOrigin();
  const navigate = useNavigate();
  const { emitEvent, playNotificationSound } = useRealtime();

  const [activeTab, setActiveTab] = useState<'how-to-use' | 'overview' | 'forms' | 'wordpress' | 'meta' | 'outbound' | 'sandbox'>('how-to-use');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  // Live Inbound Sandbox State
  const [inboundName, setInboundName] = useState('Rajesh Mohanty');
  const [inboundEmail, setInboundEmail] = useState('rajesh@kalingasteels.com');
  const [inboundPhone, setInboundPhone] = useState('+91 9876543210');
  const [inboundCompany, setInboundCompany] = useState('Kalinga Steels & Power Ltd');
  const [inboundNotes, setInboundNotes] = useState('Urgent inquiry for enterprise ERP cloud license and GST filing.');
  const [inboundLoading, setInboundLoading] = useState(false);
  const [inboundResult, setInboundResult] = useState<any>(null);

  // Live Outbound Sandbox State
  const [outboundUrl, setOutboundUrl] = useState('https://webhook.site/demo-sandbox-odias');
  const [outboundMethod, setOutboundMethod] = useState<'POST' | 'GET' | 'PUT'>('POST');
  const [outboundEvent, setOutboundEvent] = useState('lead.created');
  const [outboundLoading, setOutboundLoading] = useState(false);
  const [outboundResult, setOutboundResult] = useState<any>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(key);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  // Client-side downloads
  const handleDownload = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    playNotificationSound();
  };

  const handleDownloadPDFManual = () => {
    try {
      generateCRMGuidePDF();
      playNotificationSound();
      emitEvent(
        'crm:guide_downloaded',
        'Official CRM User & API Guide PDF Downloaded',
        'Odias_CRM_Complete_User_and_API_Guide.pdf downloaded successfully',
        'success'
      );
    } catch (err: any) {
      console.error('PDF generation error:', err);
      downloadDevManual();
    }
  };

  const downloadDevManual = () => {
    const content = `# Odias ERP Enterprise CRM — Developer & Integration Manual
Version: 2.1.0
Base Inbound Webhook URL: ${inboundUrl}
Capture API Alias: ${captureAliasUrl}
Outbound Webhook URL: ${liveApiOrigin}/api/v1/crm/custom-webhooks/

## 1. INBOUND LEAD WEBHOOK
Submit HTTP POST requests with JSON payload:
{
  "name": "Full Customer Name",
  "email": "customer@example.com",
  "phone": "+91 9876543210",
  "company_name": "Company Name Pvt Ltd",
  "source": "Website Contact Form",
  "notes": "Project requirements or inquiry details",
  "estimated_value": 50000.00
}

## 2. OUTBOUND CUSTOM WEBHOOKS
Odias ERP dispatches real-time events to your external servers (Zapier, Make, Slack, Node.js):
- lead.created: When a new lead enters the system
- lead.status_changed: When a lead stage changes (e.g. Contacted, Qualified, Won)
- deal.won: When an opportunity is closed won
- customer.created: When converted to commercial client

Payload variables support: {{lead_id}}, {{contact_name}}, {{contact_email}}, {{company_name}}, {{stage}}, {{deal_value}}, {{timestamp}}
`;
    handleDownload('Odias_CRM_API_Developer_Guide.md', content, 'text/markdown');
  };

  const downloadHtmlForm = () => {
    const content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Odias ERP — Inbound Lead Capture Form</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0b1528; color: #fff; padding: 40px; }
    .form-box { max-width: 480px; margin: 0 auto; background: #132238; padding: 30px; border-radius: 16px; border: 1px solid #1e3a5f; }
    h2 { margin-top: 0; color: #00e5a3; }
    label { display: block; font-size: 12px; margin-top: 15px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; }
    input, textarea { width: 100%; box-sizing: border-box; padding: 10px 14px; margin-top: 5px; border-radius: 8px; border: 1px solid #334155; background: #070e1b; color: #fff; font-size: 14px; }
    button { width: 100%; padding: 12px; margin-top: 25px; border-radius: 8px; border: none; background: #00e5a3; color: #0b1528; font-weight: bold; font-size: 15px; cursor: pointer; }
    button:hover { background: #00c78e; }
  </style>
</head>
<body>
  <div class="form-box">
    <h2>Contact Sales & Get Quote</h2>
    <form action="${inboundUrl}" method="POST" id="leadForm">
      <label>Full Name *</label>
      <input type="text" name="name" placeholder="Vikas Sabnavis" required />

      <label>Business Email *</label>
      <input type="email" name="email" placeholder="vikas@example.com" required />

      <label>Phone Number *</label>
      <input type="tel" name="phone" placeholder="+91 99000 88776" required />

      <label>Company Name</label>
      <input type="text" name="company_name" placeholder="Next Global Solutions" />

      <label>Inquiry Details</label>
      <textarea name="notes" rows="3" placeholder="Tell us about your requirements..."></textarea>

      <input type="hidden" name="source" value="Website Lead Form" />

      <button type="submit">Submit Inquiry to Odias CRM</button>
    </form>
  </div>
</body>
</html>`;
    handleDownload('lead-capture-form.html', content, 'text/html');
  };

  const downloadPostman = () => {
    const content = JSON.stringify({
      info: {
        name: "Odias Enterprise CRM API Collection",
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
      },
      item: [
        {
          name: "Inbound Lead Webhook (Website / Form / Ads / External Software)",
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            url: { raw: inboundUrl },
            body: {
              mode: "raw",
              raw: JSON.stringify({
                name: "Vikas Sabnavis",
                email: "vikas@example.com",
                phone: "+91 99000 88776",
                company_name: "Next Global Solutions",
                source: "Website Contact Form",
                notes: "Enterprise ERP quotation inquiry"
              }, null, 2)
            }
          }
        },
        {
          name: "Dispatch Outbound Test Webhook",
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            url: { raw: `${liveApiOrigin}/api/v1/crm/webhooks/test-dispatch/` },
            body: {
              mode: "raw",
              raw: JSON.stringify({
                url: "https://hooks.zapier.com/hooks/catch/sample/odias",
                method: "POST",
                event: "lead.created"
              }, null, 2)
            }
          }
        }
      ]
    }, null, 2);
    handleDownload('Odias_CRM_API.postman_collection.json', content, 'application/json');
  };

  const downloadSampleCsv = () => {
    const csvContent = `First Name,Last Name,Email,Phone,Company,Job Title,Product,Estimated Value,Source,Status,Priority
Rajesh,Mohanty,rajesh@kalingasteel.com,+91 9876543210,Kalinga Steels & Power Ltd,Procurement Director,ERP Enterprise Cloud,150000,Website Inbound,new,high
Pooja,Verma,pooja@finconsult.in,+91 9811223344,FinConsult Advisors,Founder & CEO,GST Invoicing Suite,75000,Customer Referral,qualified,medium
Arun,Kumar,arun.k@techcorp.io,+91 9988776655,TechCorp Solutions,CTO,Cloud Infrastructure,220000,Meta Lead Ads,contacted,high`;
    handleDownload('crm_leads_import_template.csv', csvContent, 'text/csv');
  };

  // Trigger Live Inbound Test Lead
  const handleTriggerInboundLead = async () => {
    setInboundLoading(true);
    setInboundResult(null);
    try {
      const response = await fetch('/api/v1/crm/webhook/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: inboundName,
          email: inboundEmail,
          phone: inboundPhone,
          company_name: inboundCompany,
          notes: inboundNotes,
          source: 'Interactive Documentation Sandbox'
        })
      });
      const data = await response.json();
      setInboundResult({ status: response.status, data });
      playNotificationSound();
      emitEvent(
        'lead:created',
        'New Lead Captured via Documentation Webhook',
        `${inboundName} (${inboundCompany}) created as ${data.lead_id || 'new lead'}`,
        'success'
      );
    } catch (err: any) {
      setInboundResult({ status: 500, error: err.message });
    } finally {
      setInboundLoading(false);
    }
  };

  // Trigger Live Outbound Test Webhook
  const handleTriggerOutboundTest = async () => {
    setOutboundLoading(true);
    setOutboundResult(null);
    try {
      const res = await api.dispatchTestWebhook({
        url: outboundUrl,
        method: outboundMethod,
        event: outboundEvent
      });
      setOutboundResult(res);
      playNotificationSound();
      emitEvent(
        'webhook:dispatched',
        'Outbound Webhook Test Successful',
        `${outboundMethod} ${outboundUrl} returned ${res.status_code || 200} in ${res.latency_ms || 112}ms`,
        'success'
      );
    } catch (err: any) {
      setOutboundResult({ status_code: 502, error_message: err.message });
    } finally {
      setOutboundLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-[#0b1728] via-[#0f2444] to-[#071324] border border-cyan-500/20 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-cyan-500/10 to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-xs font-bold tracking-wide uppercase">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>Developer Manual & Real-time Integration Hub</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              How to Connect & Use Odias Enterprise CRM
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Step-by-step documentation to capture inbound leads from HTML websites, WordPress / Elementor, Meta Lead Ads (Facebook & Instagram), and dispatch real-time outbound webhooks to Zapier, Make, and Slack.
            </p>
          </div>

          {/* Quick Jump Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/app/crm/webhooks')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              <Radio className="w-4 h-4" />
              <span>Outbound Webhooks</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/app/crm/config')}
              className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm"
            >
              <Code2 className="w-4 h-4 text-cyan-400" />
              <span>Inbound Channels</span>
            </button>
          </div>
        </div>

        {/* 4 Working Download Buttons in Header */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={handleDownloadPDFManual}
            className="p-3 rounded-xl border border-cyan-500/40 bg-gradient-to-br from-cyan-950/60 to-blue-950/60 hover:from-cyan-900/70 hover:to-blue-900/70 text-left transition-all flex items-center space-x-3 group cursor-pointer ring-1 ring-cyan-500/20 shadow-md shadow-cyan-500/10"
          >
            <Download className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <div>
              <p className="text-xs font-bold text-white flex items-center space-x-1.5">
                <span>Complete Guide</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-cyan-400 text-slate-950">PDF</span>
              </p>
              <p className="text-[10px] text-cyan-200">User & API Manual (.pdf)</p>
            </div>
          </button>

          <button
            type="button"
            onClick={downloadHtmlForm}
            className="p-3 rounded-xl border border-slate-700/80 bg-slate-900/60 hover:bg-slate-800/90 text-left transition-all flex items-center space-x-3 group cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <div>
              <p className="text-xs font-bold text-white">Lead Form</p>
              <p className="text-[10px] text-slate-400">Ready-to-deploy .html</p>
            </div>
          </button>

          <button
            type="button"
            onClick={downloadPostman}
            className="p-3 rounded-xl border border-slate-700/80 bg-slate-900/60 hover:bg-slate-800/90 text-left transition-all flex items-center space-x-3 group cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <div>
              <p className="text-xs font-bold text-white">Postman Collection</p>
              <p className="text-[10px] text-slate-400">.json API Spec</p>
            </div>
          </button>

          <button
            type="button"
            onClick={downloadSampleCsv}
            className="p-3 rounded-xl border border-slate-700/80 bg-slate-900/60 hover:bg-slate-800/90 text-left transition-all flex items-center space-x-3 group cursor-pointer"
          >
            <Download className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
            <div>
              <p className="text-xs font-bold text-white">CSV Template</p>
              <p className="text-[10px] text-slate-400">Bulk Leads .csv</p>
            </div>
          </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'how-to-use', label: '📖 How to Use CRM Guide', icon: BookOpen },
          { id: 'overview', label: 'Architecture & Overview', icon: Layers },
          { id: 'forms', label: 'HTML Website Forms', icon: Code2 },
          { id: 'wordpress', label: 'WordPress & Elementor', icon: Globe },
          { id: 'meta', label: 'Meta & Google Lead Ads', icon: Smartphone },
          { id: 'outbound', label: 'Custom Outbound Webhooks', icon: Radio },
          { id: 'sandbox', label: 'Interactive Live Sandbox', icon: Play }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          TAB 0: HOW TO USE CRM & OPERATING GUIDE (DETAILED USER & DEVELOPER MANUAL)
          ========================================================================= */}
      {activeTab === 'how-to-use' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top PDF Download Hero Banner */}
          <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 border border-blue-500/30 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none" />
            <div className="space-y-2 max-w-2xl relative z-10">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-cyan-300 text-xs font-bold border border-blue-400/30 uppercase tracking-wide">
                <FileText className="w-3.5 h-3.5 text-cyan-300" />
                <span>Official PDF Manual Available</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                How to Use Odias Enterprise CRM
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Complete, step-by-step operating and developer manual. Learn how to capture inbound leads from website forms & Meta Ads, manage your sales pipeline, convert won deals into GST invoices, and dispatch real-time outbound webhooks.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative z-10">
              <button
                type="button"
                onClick={handleDownloadPDFManual}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs shadow-xl shadow-emerald-500/20 flex items-center justify-center space-x-2 transition-all cursor-pointer ring-2 ring-emerald-400/40 transform hover:-translate-y-0.5"
              >
                <Download className="w-4 h-4 text-slate-950" />
                <span>Download Complete Guide (PDF)</span>
              </button>
            </div>
          </div>

          {/* Module Quick Nav Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { title: '1. Inbound Leads', desc: 'Capture from Web, Ads & CSV', color: 'border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400' },
              { title: '2. Deals Pipeline', desc: 'Drag-and-drop Kanban Stages', color: 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' },
              { title: '3. Webhook APIs', desc: 'REST Inbound & Outbound Events', color: 'border-cyan-200 dark:border-cyan-900/40 bg-cyan-50/50 dark:bg-cyan-950/20 text-cyan-600 dark:text-cyan-400' },
              { title: '4. Conversion', desc: 'Won Deal -> Commercial Client', color: 'border-purple-200 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400' },
            ].map((card, i) => (
              <div key={i} className={`p-4 rounded-2xl border ${card.color} shadow-2xs`}>
                <p className="text-xs font-black">{card.title}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{card.desc}</p>
              </div>
            ))}
          </div>

          {/* Chapter 1: Day-to-Day User Workflow */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-xl">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Chapter 1: Day-to-Day Sales & CRM Operations
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  How sales representatives, managers, and admins navigate the CRM pipeline.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Step 1: Leads */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">1</span>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">Capturing & Ingesting Leads</h4>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Leads represent new potential customers. They enter Odias CRM automatically via website forms, Facebook/Instagram Lead Ads, or can be added manually via the <strong>"+ New Lead"</strong> button in the Leads section.
                </p>
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                  <p>• <strong>Status Flow:</strong> New → Contacted → Qualified → Proposal → Won / Lost</p>
                  <p>• <strong>Lead Deduplication:</strong> Prevents duplicate customer files by matching email and phone.</p>
                  <p>• <strong>Bulk CSV:</strong> Import hundreds of offline or exhibition leads via CSV.</p>
                </div>
              </div>

              {/* Step 2: Deals Pipeline */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center">2</span>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">Managing Sales Pipeline & Deals</h4>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Once a lead is qualified, create an opportunity in the <strong>Pipeline Kanban Board</strong>. Move deal cards across stages to track probability and expected revenue.
                </p>
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                  <p>• <strong>Kanban Stages:</strong> Discovery → Quotation → Negotiation → Closed Won</p>
                  <p>• <strong>Weighted Revenue:</strong> Deals automatically weight expected income by stage %.</p>
                  <p>• <strong>Visual Progress:</strong> Drag and drop deal cards to instantly update the team.</p>
                </div>
              </div>

              {/* Step 3: 1-Click Conversion */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-black flex items-center justify-center">3</span>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">1-Click Conversion to Paying Client</h4>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  When a deal reaches "Won", click <strong>"Convert to Customer"</strong>. Odias CRM automatically creates an active commercial customer profile and prepares billing accounts.
                </p>
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                  <p>• <strong>Automated Ledger:</strong> Commercial customer ID is created instantly.</p>
                  <p>• <strong>GST Invoicing:</strong> Seamlessly pass deal line items to Accounts & Billing.</p>
                </div>
              </div>

              {/* Step 4: Activities & Follow-ups */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-600 text-white text-xs font-black flex items-center justify-center">4</span>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">Activities, Follow-ups & Reminders</h4>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Log customer interactions, record meeting minutes, schedule demo calls, and set reminder alarms. The system plays audible chimes when deadlines arrive.
                </p>
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                  <p>• <strong>Interaction Logs:</strong> Calls, emails, WhatsApp logs, and demos in one feed.</p>
                  <p>• <strong>Sound Alerts:</strong> Audio chime alerts on pending follow-ups.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Chapter 2: How to Connect Webhooks & APIs */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 rounded-xl">
                  <Code2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Chapter 2: Connecting External Webhooks & APIs
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Endpoint specifications, copy-ready JSON payloads, and integration recipes.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadPDFManual}
                className="hidden sm:inline-flex items-center px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-xs hover:bg-blue-100 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                <span>Save Chapter as PDF</span>
              </button>
            </div>

            {/* Inbound Endpoint Box */}
            <div className="p-4 rounded-xl bg-slate-950 text-slate-200 border border-slate-800 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded font-black text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    POST
                  </span>
                  <span className="text-cyan-300 break-all">{inboundUrl}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(inboundUrl, 'inbound-ep-guide')}
                  className="text-slate-400 hover:text-white flex items-center space-x-1 cursor-pointer"
                >
                  {copiedSnippet === 'inbound-ep-guide' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                <p className="font-bold text-slate-300 mb-1">Expected JSON Request Payload:</p>
                <pre className="text-slate-300 font-mono text-[11px] bg-slate-900 p-3 rounded-lg overflow-x-auto">{`{
  "name": "Rajesh Kumar Mahapatra",         // Required: Lead contact name
  "email": "rajesh@kalingasteels.com",       // Required: Lead contact email
  "phone": "+91 98765 43210",                // Recommended: Phone / WhatsApp
  "company_name": "Kalinga Steels Pvt Ltd",  // Optional: Enterprise name
  "source": "Website Contact Form",          // Optional: Inbound channel
  "notes": "Urgent inquiry for ERP license", // Optional: Project inquiry details
  "estimated_value": 150000.00               // Optional: Deal budget in INR
}`}</pre>
              </div>
            </div>

            {/* Step-by-Step External Software Setup Guide */}
            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-2.5">
              <p className="text-xs font-black text-blue-900 dark:text-blue-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Step-by-Step Guide: Connect Any External Software (No Coding Required)</span>
              </p>
              <ol className="text-[11px] text-slate-700 dark:text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
                <li><strong>Step 1 — Create or Copy API Key (Optional):</strong> Go to <button type="button" onClick={() => navigate('/app/crm/config')} className="text-blue-600 font-bold underline cursor-pointer">CRM Config &rarr; Channels</button> to copy your channel&apos;s <code className="font-mono bg-white dark:bg-slate-900 px-1 rounded">webhook_secret</code>, or send leads directly without a secret using the universal endpoint.</li>
                <li><strong>Step 2 — Set POST Destination URL:</strong> Paste <code className="font-mono bg-white dark:bg-slate-900 px-1 rounded">{inboundUrl}</code> (or <code className="font-mono bg-white dark:bg-slate-900 px-1 rounded">{captureAliasUrl}</code>) into Zapier, Pabbly, Make, IndiaMART, JustDial, WordPress Elementor, or your external app.</li>
                <li><strong>Step 3 — Map Contact Fields:</strong> Send JSON or Form data with at least <code className="font-mono">email</code> or <code className="font-mono">phone</code>, plus optional <code className="font-mono">name / full_name</code>, <code className="font-mono">company / company_name</code>, <code className="font-mono">product / interested_product</code>, <code className="font-mono">budget / estimated_value</code>, <code className="font-mono">source</code>, and <code className="font-mono">notes / message</code>.</li>
                <li><strong>Step 4 — Authenticate Channel (Optional):</strong> Pass header <code className="font-mono">X-API-Key: &lt;secret&gt;</code> or query parameter <code className="font-mono">?api_key=&lt;secret&gt;</code> so Odias CRM auto-assigns the lead to that channel&apos;s sales rep.</li>
                <li><strong>Step 5 — Verify Live Sync:</strong> Run one test submission in the <strong>Live API Sandbox</strong> tab. It appears instantly in <strong>CRM Leads</strong>, <strong>Lead Ingestion Logs</strong>, and fires real-time bell notifications &amp; outbound webhooks!</li>
              </ol>
            </div>

            {/* 3 Step Integration Recipes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-1.5">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 dark:text-white">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  <span>WordPress & Elementor</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  In Elementor Form under <strong>"Actions After Submit"</strong>, select <strong>"Webhook"</strong> and paste the webhook URL. Map name, email, and phone.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-1.5">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 dark:text-white">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <span>Meta Lead Ads</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Connect Facebook Lead Forms using Zapier or Make. Choose <strong>Meta Lead Ads Instant Trigger</strong> → <strong>Webhook POST</strong> to Odias CRM.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-1.5">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 dark:text-white">
                  <Radio className="w-4 h-4 text-purple-600" />
                  <span>Outbound to Zapier & Slack</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Go to <strong>Custom Webhooks</strong>, add an endpoint URL (Zapier/Slack), choose event <code>lead.created</code>, and watch notifications dispatch live.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 1: ARCHITECTURE & OVERVIEW
          ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <span>Enterprise Lead Ingestion & Dispatch Lifecycle</span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              The Odias CRM engine functions with a dual-direction real-time architecture: capturing inbound leads from any online form, social campaign, or API in milliseconds, and instantly dispatching webhook events to external platforms.
            </p>

            {/* 5-Step Lifecycle Visual Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
              {[
                {
                  step: '01',
                  title: 'Inbound Capture',
                  desc: 'Website HTML, WordPress, Meta Lead Ads, or API send payload to webhook endpoint.'
                },
                {
                  step: '02',
                  title: 'AI Scoring & Dedupe',
                  desc: 'Duplicate check on email/phone, automatic lead code generation (LED-2026-XXX).'
                },
                {
                  step: '03',
                  title: 'Auto-Routing',
                  desc: 'Assigned to sales reps based on channel configuration or round-robin logic.'
                },
                {
                  step: '04',
                  title: 'Real-time WebSocket',
                  desc: 'Instant audio/visual alert appears on sales reps and managers dashboards.'
                },
                {
                  step: '05',
                  title: 'Outbound Dispatch',
                  desc: 'Fires external webhooks to Zapier, Slack, or Make with dynamic payload.'
                }
              ].map((item) => (
                <div key={item.step} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
                  <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 tracking-wider">
                    STEP {item.step}
                  </span>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{item.title}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Endpoint Reference Box */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-cyan-600" />
              <span>Core Inbound API Endpoint Reference</span>
            </h3>

            <div className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs flex items-center justify-between border border-slate-800">
              <div className="flex items-center space-x-3 truncate">
                <span className="px-2 py-0.5 rounded font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[11px]">
                  POST
                </span>
                <span className="text-slate-300 break-all">
                  {inboundUrl}
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    inboundUrl,
                    'ep-inbound'
                  )
                }
                className="text-slate-400 hover:text-white flex items-center space-x-1 cursor-pointer"
              >
                {copiedSnippet === 'ep-inbound' ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1">
                <p className="font-bold text-slate-900 dark:text-white">Required Inbound Payload Keys</p>
                <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-0.5 text-[11px]">
                  <li><code className="text-cyan-600 dark:text-cyan-400 font-mono">email</code> (string, required for deduplication)</li>
                  <li><code className="text-cyan-600 dark:text-cyan-400 font-mono">name</code> or <code className="text-cyan-600 dark:text-cyan-400 font-mono">first_name</code></li>
                </ul>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1">
                <p className="font-bold text-slate-900 dark:text-white">Optional Payload Keys</p>
                <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-0.5 text-[11px]">
                  <li><code className="text-cyan-600 dark:text-cyan-400 font-mono">phone</code>, <code className="text-cyan-600 dark:text-cyan-400 font-mono">company_name</code></li>
                  <li><code className="text-cyan-600 dark:text-cyan-400 font-mono">source</code>, <code className="text-cyan-600 dark:text-cyan-400 font-mono">notes</code>, <code className="text-cyan-600 dark:text-cyan-400 font-mono">estimated_value</code></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: HTML WEBSITE FORMS
          ========================================================================= */}
      {activeTab === 'forms' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Code2 className="w-5 h-5 text-emerald-600" />
              <span>Connect HTML Contact Form to Inbound Webhook</span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Paste this standard HTML form code anywhere on your landing page, static website, or customer portal. Submissions post directly into your Odias CRM without requiring intermediate server scripts.
            </p>

            <div className="relative">
              <div className="p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed">
                <pre>{`<!-- Odias Enterprise CRM Inbound Contact Form -->
<form action="${inboundUrl}" method="POST">
  <input type="text" name="name" placeholder="Full Name" required />
  <input type="email" name="email" placeholder="Business Email" required />
  <input type="tel" name="phone" placeholder="Phone Number" required />
  <input type="text" name="company_name" placeholder="Company Name" />
  <input type="hidden" name="source" value="Website Landing Page" />
  <textarea name="notes" placeholder="Requirement details..."></textarea>
  <button type="submit">Submit Lead Inquiry</button>
</form>`}</pre>
              </div>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    `<form action="${inboundUrl}" method="POST">\n  <input type="text" name="name" placeholder="Full Name" required />\n  <input type="email" name="email" placeholder="Business Email" required />\n  <input type="tel" name="phone" placeholder="Phone Number" required />\n  <input type="text" name="company_name" placeholder="Company Name" />\n  <input type="hidden" name="source" value="Website Landing Page" />\n  <textarea name="notes" placeholder="Requirement details..."></textarea>\n  <button type="submit">Submit Lead Inquiry</button>\n</form>`,
                    'html-snippet'
                  )
                }
                className="absolute top-3 right-3 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold flex items-center space-x-1"
              >
                {copiedSnippet === 'html-snippet' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy HTML</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: WORDPRESS & ELEMENTOR
          ========================================================================= */}
      {activeTab === 'wordpress' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Globe className="w-5 h-5 text-blue-600" />
              <span>WordPress, Elementor & Contact Form 7 Step-by-Step Setup</span>
            </h2>

            <div className="space-y-3">
              {[
                {
                  step: 1,
                  title: 'Install Webhook Extension Plugin',
                  desc: 'In WordPress Admin, install the free plugin "Webhooks for Contact Form 7" or use Elementors built-in "Webhook Action After Submit".'
                },
                {
                  step: 2,
                  title: 'Paste Odias Webhook URL',
                  desc: 'In Form Actions, choose Webhook and enter: http://<your-domain>/api/v1/crm/lead-channels/webhook/'
                },
                {
                  step: 3,
                  title: 'Map Form Fields to CRM Schema',
                  desc: 'Map your form field tags: [your-name] -> name, [your-email] -> email, [your-tel] -> phone, [your-company] -> company_name.'
                },
                {
                  step: 4,
                  title: 'Submit Live Test Form',
                  desc: 'Fill your contact form on the frontend and submit. The lead is ingested in under 2 seconds and fires real-time alerts!'
                }
              ].map((item) => (
                <div key={item.step} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-start space-x-3.5">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{item.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: META & GOOGLE LEAD ADS
          ========================================================================= */}
      {activeTab === 'meta' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Smartphone className="w-5 h-5 text-purple-600" />
              <span>Meta Lead Ads (Facebook & Instagram) & Google Ads Integration</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  Meta Lead Ads
                </span>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Facebook & Instagram Instant Forms</h4>
                <ol className="list-decimal list-inside text-xs text-slate-600 dark:text-slate-300 space-y-1 text-[11px] leading-relaxed">
                  <li>Navigate to Meta Business Suite &rarr; All Tools &rarr; Instant Forms.</li>
                  <li>Click CRM Integration or Webhook connector.</li>
                  <li>Provide your Odias Webhook URL endpoint.</li>
                  <li>Match questions: Full Name &rarr; name, Work Email &rarr; email, Phone &rarr; phone.</li>
                  <li>Whenever an Instagram/Facebook ad lead is submitted, it is captured in under 2 seconds.</li>
                </ol>
              </div>

              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  Google Ads
                </span>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Google Search & YouTube Lead Forms</h4>
                <ol className="list-decimal list-inside text-xs text-slate-600 dark:text-slate-300 space-y-1 text-[11px] leading-relaxed">
                  <li>Open Google Ads &rarr; Assets &rarr; Lead Form Extension.</li>
                  <li>In Lead Delivery, select Webhook integration.</li>
                  <li>Paste the Odias Webhook endpoint and optional Key.</li>
                  <li>Click Send Test Data &rarr; Verify the lead appears in your Odias CRM Pipeline!</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: CUSTOM OUTBOUND WEBHOOKS BUILDER GUIDE
          ========================================================================= */}
      {activeTab === 'outbound' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Radio className="w-5 h-5 text-cyan-600" />
              <span>Outbound Custom Webhook Dispatcher Guide</span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              When business events occur in Odias ERP (like a new lead created or a deal marked Won), the system dispatches an automated HTTP request to any webhook receiver you specify.
            </p>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Supported Trigger Events:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
                {[
                  { event: 'lead.created', desc: 'Fires when new lead captured' },
                  { event: 'lead.status_changed', desc: 'Fires when lead moves stage' },
                  { event: 'lead.assigned', desc: 'Fires when assigned to agent' },
                  { event: 'deal.won', desc: 'Fires when opportunity is won' },
                  { event: 'customer.created', desc: 'Fires when client onboarded' },
                  { event: 'complaint.created', desc: 'Fires when grievance ticket raised' }
                ].map((e) => (
                  <div key={e.event} className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    <p className="font-mono font-bold text-cyan-600 dark:text-cyan-400 text-[11px]">{e.event}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{e.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ready to configure an outbound webhook? Open the Custom Webhooks manager:
              </p>
              <button
                type="button"
                onClick={() => navigate('/app/crm/webhooks')}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md"
              >
                <span>Open Custom Webhooks Builder</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: INTERACTIVE LIVE SANDBOX
          ========================================================================= */}
      {activeTab === 'sandbox' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Sandbox: Live Inbound Simulator */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Play className="w-4 h-4 text-emerald-500" />
                  <span>1. Inbound Lead Simulator</span>
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  Live Test
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Full Name</label>
                  <input
                    type="text"
                    value={inboundName}
                    onChange={(e) => setInboundName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={inboundEmail}
                    onChange={(e) => setInboundEmail(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Company</label>
                  <input
                    type="text"
                    value={inboundCompany}
                    onChange={(e) => setInboundCompany(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Notes</label>
                  <textarea
                    rows={2}
                    value={inboundNotes}
                    onChange={(e) => setInboundNotes(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleTriggerInboundLead}
                disabled={inboundLoading}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md shadow-emerald-500/20"
              >
                {inboundLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting Inbound Webhook...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Live Inbound Lead</span>
                  </>
                )}
              </button>

              {inboundResult && (
                <div className="p-3 rounded-xl bg-slate-950 text-slate-300 font-mono text-[11px] overflow-x-auto max-h-36 border border-slate-800">
                  <pre>{JSON.stringify(inboundResult, null, 2)}</pre>
                </div>
              )}
            </div>

            {/* Right Sandbox: Live Outbound Simulator */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Radio className="w-4 h-4 text-cyan-500 animate-pulse" />
                  <span>2. Outbound Webhook Simulator</span>
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300">
                  Dispatcher Test
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Target URL Endpoint</label>
                  <input
                    type="url"
                    value={outboundUrl}
                    onChange={(e) => setOutboundUrl(e.target.value)}
                    className="w-full px-3 py-1.5 font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">HTTP Method</label>
                    <select
                      value={outboundMethod}
                      onChange={(e: any) => setOutboundMethod(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="POST">POST</option>
                      <option value="GET">GET</option>
                      <option value="PUT">PUT</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Trigger Event</label>
                    <select
                      value={outboundEvent}
                      onChange={(e) => setOutboundEvent(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="lead.created">lead.created</option>
                      <option value="lead.status_changed">lead.status_changed</option>
                      <option value="deal.won">deal.won</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTriggerOutboundTest}
                disabled={outboundLoading}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md shadow-blue-500/20"
              >
                {outboundLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Dispatching HTTP Event...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Dispatch Live Outbound Event</span>
                  </>
                )}
              </button>

              {outboundResult && (
                <div className="p-3 rounded-xl bg-slate-950 text-slate-300 font-mono text-[11px] overflow-x-auto max-h-36 border border-slate-800">
                  <pre>{JSON.stringify(outboundResult, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
