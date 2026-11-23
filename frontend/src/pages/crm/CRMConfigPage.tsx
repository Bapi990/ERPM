import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Sliders, Globe, Mail, Share2, Zap, CheckCircle2,
  AlertCircle, RefreshCw, Copy, Check, Terminal, Play, Eye,
  Lock, Key, ExternalLink, ShieldCheck, ChevronRight, Plus,
  Edit3, Trash2, Settings, Shield, Server, ArrowRight,
  Download, BookOpen, FileCode, FileText, CheckCircle, Code,
  Layers, Sparkles, HelpCircle, CheckSquare
} from 'lucide-react';
import { api } from '../../api/client';
import { useRealtime } from '../../context/RealtimeContext';
import { Modal } from '../../components/common/Modal';
import { generateCRMGuidePDF } from '../../utils/crmGuidePdfGenerator';

export const CRMConfigPage: React.FC = () => {
  const { emitEvent } = useRealtime();
  const [searchParams] = useSearchParams();
  const [channels, setChannels] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'channels' | 'webhook' | 'guide' | 'logs'>('channels');
  const [copied, setCopied] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  // Guide interactive state
  const [selectedCodeTab, setSelectedCodeTab] = useState<'html' | 'curl' | 'js' | 'python' | 'php'>('html');
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'guide' || tabParam === 'webhook' || tabParam === 'channels' || tabParam === 'logs') {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  // Edit Channel Modal
  const [editModalChannel, setEditModalChannel] = useState<any | null>(null);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Add New Channel Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newChannelForm, setNewChannelForm] = useState({
    name: '',
    channel_type: 'custom_api',
    endpoint_url: '',
    account_id: '',
    api_key: '',
    webhook_secret: '',
    sync_frequency: 'Realtime Webhook',
    auto_assign_to: '',
    is_active: true,
    description: '',
  });
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // View Raw Payload Modal
  const [viewPayloadModal, setViewPayloadModal] = useState<any | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Custom webhook test bench state
  const [testPayload, setTestPayload] = useState({
    first_name: 'Aditya',
    last_name: 'Verma',
    company_name: 'Verma Aerospace Technologies',
    email: 'aditya.verma@verma-aero.com',
    phone: '+91 98310 99887',
    city: 'Bengaluru',
    state: 'Karnataka',
    interested_product: 'Odias ERP Cloud Defense Edition',
    estimated_value: 850000,
    notes: 'Inbound RFQ submitted through partner portal integration.',
  });
  const [submittingWebhook, setSubmittingWebhook] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [chData, logData, userData] = await Promise.all([
        api.getLeadChannels(),
        api.getIngestionLogs(),
        api.getUsers(),
      ]);
      setChannels(chData.results || chData || []);
      setLogs(logData.results || logData || []);
      setUsers(userData.results || userData || []);
    } catch (err) {
      console.error('Failed to load CRM channel configs:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  const handleToggleChannel = async (channel: any) => {
    try {
      const updated = await api.updateLeadChannel(channel.id, { is_active: !channel.is_active });
      setChannels((prev) => prev.map((c) => (c.id === channel.id ? { ...c, is_active: updated.is_active } : c)));
      showToast(`${channel.name} is now ${updated.is_active ? 'Active' : 'Paused'}`);
      emitEvent('crm_channel_updated', 'Lead Channel Status Changed', `${channel.name} is now ${updated.is_active ? 'Active' : 'Paused'}`, 'info');
    } catch (err: any) {
      alert(err.message || 'Failed to update channel');
    }
  };

  const handleTestLeadPush = async (channel: any) => {
    setTestingId(channel.id);
    try {
      const res = await api.testLeadChannel(channel.id);
      showToast(res.message);
      emitEvent('lead_captured_realtime', 'Realtime Lead Captured', `Captured ${res.lead.contact_name} from ${channel.name}!`, 'success');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to push test lead');
    } finally {
      setTestingId(null);
    }
  };

  // CREATE NEW CHANNEL
  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingAdd(true);
    try {
      const payload: any = {
        name: newChannelForm.name,
        channel_type: newChannelForm.channel_type,
        endpoint_url: newChannelForm.endpoint_url,
        account_id: newChannelForm.account_id,
        api_key: newChannelForm.api_key,
        webhook_secret: newChannelForm.webhook_secret || `whsec_${Date.now().toString(36)}`,
        sync_frequency: newChannelForm.sync_frequency,
        is_active: newChannelForm.is_active,
        description: newChannelForm.description,
      };
      if (newChannelForm.auto_assign_to) {
        payload.auto_assign_to = newChannelForm.auto_assign_to;
      }

      await api.createLeadChannel(payload);
      showToast(`Added new API channel: ${newChannelForm.name}!`);
      emitEvent('crm_channel_created', 'New API Connected', `Connected ${newChannelForm.name}`, 'success');
      setAddModalOpen(false);
      setNewChannelForm({
        name: '',
        channel_type: 'custom_api',
        endpoint_url: '',
        account_id: '',
        api_key: '',
        webhook_secret: '',
        sync_frequency: 'Realtime Webhook',
        auto_assign_to: '',
        is_active: true,
        description: '',
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create API channel');
    } finally {
      setSubmittingAdd(false);
    }
  };

  // EDIT CHANNEL
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalChannel) return;
    setSubmittingEdit(true);
    try {
      await api.updateLeadChannel(editModalChannel.id, {
        name: editModalChannel.name,
        channel_type: editModalChannel.channel_type,
        endpoint_url: editModalChannel.endpoint_url || '',
        account_id: editModalChannel.account_id || '',
        api_key: editModalChannel.api_key || '',
        webhook_secret: editModalChannel.webhook_secret || '',
        sync_frequency: editModalChannel.sync_frequency,
        auto_assign_to: editModalChannel.auto_assign_to || null,
        is_active: editModalChannel.is_active,
        description: editModalChannel.description || '',
      });
      showToast(`${editModalChannel.name} updated successfully.`);
      emitEvent('crm_channel_updated', 'API Config Updated', `${editModalChannel.name} credentials updated`, 'info');
      setEditModalChannel(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update channel');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // DELETE CHANNEL
  const handleDeleteChannel = async (channel: any) => {
    if (!confirm(`Are you sure you want to remove API connection "${channel.name}"?`)) return;
    try {
      await api.deleteLeadChannel(channel.id);
      showToast(`Removed API connection: ${channel.name}`);
      setChannels((prev) => prev.filter((c) => c.id !== channel.id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete channel');
    }
  };

  const handleCopyWebhookUrl = () => {
    const url = `${window.location.protocol}//${window.location.hostname}:8000/api/v1/crm/lead-channels/webhook/`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // FILE DOWNLOAD HELPERS
  const downloadFile = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${filename}!`);
  };

  const handleDownloadManual = () => {
    try {
      generateCRMGuidePDF();
      showToast('📄 Official CRM User & API Guide (.pdf) downloaded!');
      emitEvent(
        'crm:guide_downloaded',
        'Official CRM User & API Guide PDF Downloaded',
        'Odias_CRM_Complete_User_and_API_Guide.pdf downloaded successfully',
        'success'
      );
      return;
    } catch (e) {
      console.error('PDF generation fallback:', e);
    }

    const manualContent = `# Odias ERP — Enterprise CRM & Webhook Developer Manual

## 1. System Overview & Architecture
Odias ERP CRM is an enterprise-grade customer relationship management and automated lead ingestion engine. It enables organizations to capture leads in real-time from websites, landing pages, Meta (Facebook/Instagram) Lead Ads, Google Ads, IndiaMART, TradeIndia, and third-party webhook systems.

### Core Lifecycle Workflow
1. **Lead Ingestion**: Inbound JSON payload received via public Webhook URL or REST API.
2. **Auto-Assignment**: Scored and routed to sales agents via Round-Robin or channel configuration.
3. **Pipeline Stages**: Deals tracked through New -> Contacted -> Qualified -> Proposal -> Negotiation -> Won.
4. **1-Click Conversion**: Converts won deals to Customer Accounts with linked commercial GST Invoices.

---

## 2. Inbound Webhook Specification
- **Endpoint**: \`http://<your-domain>/api/v1/crm/lead-channels/webhook/\`
- **Alternative Path**: \`http://<your-domain>/api/v1/crm/webhook/inbound/\`
- **Method**: \`POST\`
- **Content-Type**: \`application/json\`
- **Header**: \`X-Webhook-Secret: whsec_inbound_website_88190\`

### JSON Payload Schema
| Field | Type | Required | Description |
|---|---|---|---|
| \`name\` or \`first_name\` | String | Yes | Full name or primary contact name |
| \`last_name\` | String | No | Contact surname |
| \`email\` | String | Yes | Primary corporate or personal email |
| \`phone\` | String | No | Contact number with country code |
| \`company_name\` | String | No | Business or corporate account name |
| \`city\` | String | No | City of residence or office |
| \`state\` | String | No | State or province |
| \`source\` | String | No | Lead channel (e.g. \`website\`, \`meta_ads\`, \`indiamart\`) |
| \`interested_product\` | String | No | Product interest or service required |
| \`estimated_value\` | Number | No | Potential deal value in INR |
| \`notes\` | String | No | Inquiry message or customer requirements |

### Success Response (HTTP 201 Created)
\`\`\`json
{
  "success": true,
  "lead_id": "LEAD-2026-045",
  "message": "Lead successfully captured and queued."
}
\`\`\`

---

## 3. Platform Integration Guides

### A. Website Contact Form (HTML + JavaScript)
Add this snippet to your contact form submit handler:
\`\`\`javascript
fetch("http://localhost:8000/api/v1/crm/lead-channels/webhook/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Webhook-Secret": "whsec_inbound_website_88190"
  },
  body: JSON.stringify({
    name: "Customer Name",
    email: "customer@example.com",
    phone: "+91 9876543210",
    company_name: "Client Enterprise",
    source: "website_contact_form"
  })
});
\`\`\`

### B. WordPress / Elementor / Contact Form 7
1. Open your Elementor Form.
2. In **Actions After Submit**, select **Webhook**.
3. Set Webhook URL to: \`http://<your-domain>/api/v1/crm/lead-channels/webhook/\`.
4. Add Header: \`X-Webhook-Secret: whsec_inbound_website_88190\`.

### C. Zapier / Make / Meta & Google Ads
1. Create a Zap triggered by **New Lead in Facebook Lead Ads** or **Google Ads Form**.
2. Add a **Webhooks by Zapier (POST)** action.
3. Map fields to the JSON payload format above.

---
© 2026 Odias ERP Cloud. All rights reserved.
`;
    downloadFile('Odias_CRM_API_Developer_Guide.md', manualContent, 'text/markdown');
  };

  const handleDownloadHtmlForm = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inquire Now — Odias CRM Lead Integration</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
    .card { background: #ffffff; width: 100%; max-width: 520px; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
    h2 { font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 6px; }
    p { font-size: 13px; color: #64748b; margin-bottom: 24px; }
    .form-group { margin-bottom: 16px; }
    label { display: block; font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 6px; }
    input, textarea, select { width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 13px; outline: none; transition: border-color 0.2s; }
    input:focus, textarea:focus, select:focus { border-color: #2563eb; }
    textarea { resize: vertical; min-height: 80px; }
    .btn { width: 100%; padding: 12px; background: #2563eb; color: #ffffff; font-weight: 700; border: none; border-radius: 10px; cursor: pointer; font-size: 14px; transition: background 0.2s; }
    .btn:hover { background: #1d4ed8; }
    .alert { padding: 12px; border-radius: 8px; font-size: 12px; font-weight: 600; margin-top: 16px; display: none; }
    .alert-success { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
    .alert-error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Contact Sales & Request Demo</h2>
    <p>Submit your details to automatically connect with our sales team.</p>
    <form id="leadForm" onsubmit="handleLeadSubmit(event)">
      <div class="form-group">
        <label>Full Name *</label>
        <input type="text" name="name" required placeholder="John Doe">
      </div>
      <div class="form-group">
        <label>Corporate Email *</label>
        <input type="email" name="email" required placeholder="john@company.com">
      </div>
      <div class="form-group">
        <label>Phone Number *</label>
        <input type="tel" name="phone" required placeholder="+91 98765 43210">
      </div>
      <div class="form-group">
        <label>Company Name</label>
        <input type="text" name="company_name" placeholder="Acme Technologies Ltd">
      </div>
      <div class="form-group">
        <label>Interested Solution</label>
        <select name="interested_product">
          <option value="Odias Cloud ERP Enterprise">Odias Cloud ERP Enterprise</option>
          <option value="HRMS & Biometric 3-Shift Attendance">HRMS & Biometric Attendance</option>
          <option value="Smart GST Invoicing & Accounting">Smart GST Invoicing & Accounting</option>
          <option value="Custom CRM & Lead Routing">Custom CRM & Lead Routing</option>
        </select>
      </div>
      <div class="form-group">
        <label>Project Requirements / Message</label>
        <textarea name="notes" placeholder="Describe your team size and timeline..."></textarea>
      </div>
      <button type="submit" class="btn" id="submitBtn">Send Inquiry</button>
      <div id="alertSuccess" class="alert alert-success"></div>
      <div id="alertError" class="alert alert-error"></div>
    </form>
  </div>

  <script>
    async function handleLeadSubmit(e) {
      e.preventDefault();
      const form = e.target;
      const btn = document.getElementById('submitBtn');
      const alertSuccess = document.getElementById('alertSuccess');
      const alertError = document.getElementById('alertError');
      
      alertSuccess.style.display = 'none';
      alertError.style.display = 'none';
      btn.disabled = true;
      btn.innerText = 'Connecting to CRM...';

      const payload = {
        name: form.name.value,
        email: form.email.value,
        phone: form.phone.value,
        company_name: form.company_name.value,
        interested_product: form.interested_product.value,
        notes: form.notes.value,
        source: 'website_contact_form'
      };

      try {
        const res = await fetch('http://localhost:8000/api/v1/crm/lead-channels/webhook/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Secret': 'whsec_inbound_website_88190'
          },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
          alertSuccess.innerText = '✓ Thank you! Your inquiry is received. Reference: ' + (data.lead_id || 'Queued');
          alertSuccess.style.display = 'block';
          form.reset();
        } else {
          alertError.innerText = 'Error: ' + (data.error || 'Could not register lead.');
          alertError.style.display = 'block';
        }
      } catch (err) {
        alertError.innerText = 'Connection error: ' + err.message;
        alertError.style.display = 'block';
      } finally {
        btn.disabled = false;
        btn.innerText = 'Send Inquiry';
      }
    }
  </script>
</body>
</html>`;
    downloadFile('lead-capture-form.html', htmlContent, 'text/html');
  };

  const handleDownloadPostmanCollection = () => {
    const postmanJson = {
      info: {
        name: "Odias ERP — CRM & Webhook API Collection",
        description: "Official REST API requests for Odias ERP CRM Lead Capture, Webhooks, Deals, and Pipelines.",
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
      },
      item: [
        {
          name: "1. Inbound Lead Webhook (Public)",
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "X-Webhook-Secret", value: "whsec_inbound_website_88190" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                name: "Rohan Kapoor",
                email: "rohan@kapoorind.in",
                phone: "+91 98200 12345",
                company_name: "Kapoor Industries Ltd",
                city: "Mumbai",
                state: "Maharashtra",
                source: "postman_test",
                interested_product: "Cloud ERP Enterprise",
                estimated_value: 850000,
                notes: "Tested via Postman Collection"
              }, null, 2)
            },
            url: {
              raw: "http://localhost:8000/api/v1/crm/lead-channels/webhook/",
              protocol: "http",
              host: ["localhost"],
              port: "8000",
              path: ["api", "v1", "crm", "lead-channels", "webhook", ""]
            }
          }
        },
        {
          name: "2. List All Leads (Authenticated)",
          request: {
            method: "GET",
            header: [
              { key: "Authorization", value: "Bearer {{access_token}}" }
            ],
            url: {
              raw: "http://localhost:8000/api/v1/crm/leads/",
              protocol: "http",
              host: ["localhost"],
              port: "8000",
              path: ["api", "v1", "crm", "leads", ""]
            }
          }
        },
        {
          name: "3. Convert Lead to Customer",
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{access_token}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            url: {
              raw: "http://localhost:8000/api/v1/crm/leads/lead-001/convert/",
              protocol: "http",
              host: ["localhost"],
              port: "8000",
              path: ["api", "v1", "crm", "leads", "lead-001", "convert", ""]
            }
          }
        }
      ]
    };
    downloadFile('Odias_CRM_API.postman_collection.json', JSON.stringify(postmanJson, null, 2), 'application/json');
  };

  const handleDownloadLeadsCsv = () => {
    const csvContent = `Company Name,Contact Person,Email,Phone,City,State,Source,Interested Product,Estimated Value,Notes
Tata Steel Kalinganagar,Subrat Jena,subrat.jena@tatasteel.com,+91 94370 88210,Jajpur,Odisha,website,Full Enterprise ERP Suite,1850000,Biometric HRMS and GST billing required
Jindal Stainless Ltd,Deepali Das,deepali.das@jindalstainless.com,+91 82491 33490,Bhubaneswar,Odisha,referral,HRMS 3-Shift Attendance,1200000,450+ workers biometric shifts
Reliance Global Infotech,Ananya Sen,ananya.sen@relianceglobal.in,+91 99371 44556,Kolkata,West Bengal,meta_ads,Cloud ERP & CRM Pipeline,950000,Inbound lead from Facebook Ads campaign
Aditya Heavy Engineering,Vikram Aditya,vikram.aditya@aditya-eng.com,+91 99887 76655,Bhubaneswar,Odisha,website_webhook,Manufacturing & GST Suite,1250000,Inbound enquiry from website landing page`;
    downloadFile('crm_leads_import_template.csv', csvContent, 'text/csv');
  };

  const handleSendCustomWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingWebhook(true);
    try {
      const webhookUrl = `${window.location.protocol}//${window.location.hostname}:8000/api/v1/crm/lead-channels/webhook/`;
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': 'whsec_inbound_website_88190',
        },
        body: JSON.stringify(testPayload),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Realtime Webhook Ingested! Lead ID: ${data.lead_id}`);
        emitEvent('lead_webhook_inbound', 'Inbound Webhook Received', `Lead ${data.lead_id} automatically registered`, 'success');
        fetchData();
      } else {
        alert(data.error || 'Webhook failed');
      }
    } catch (err: any) {
      alert('Error triggering webhook: ' + err.message);
    } finally {
      setSubmittingWebhook(false);
    }
  };

  const totalCaptured = channels.reduce((acc, c) => acc + (c.leads_captured || 0), 0);
  const activeCount = channels.filter((c) => c.is_active).length;

  const channelIcons: Record<string, any> = {
    gmail: Mail,
    meta: Share2,
    linkedin: Share2,
    website_webhook: Globe,
    custom_api: Terminal,
    indiamart: Globe,
    tradeindia: Globe,
    justdial: Globe,
    zapier: Zap,
    hubspot: Server,
  };

  const channelColor: Record<string, string> = {
    gmail: 'bg-red-50 text-red-600 border-red-200',
    meta: 'bg-blue-50 text-blue-600 border-blue-200',
    linkedin: 'bg-sky-50 text-sky-700 border-sky-200',
    website_webhook: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    custom_api: 'bg-purple-50 text-purple-700 border-purple-200',
    indiamart: 'bg-amber-50 text-amber-700 border-amber-200',
    tradeindia: 'bg-teal-50 text-teal-700 border-teal-200',
    justdial: 'bg-orange-50 text-orange-700 border-orange-200',
    zapier: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    hubspot: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Toast Alert */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-3 border border-slate-700 animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold">{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Lead Channels & Inbound API Integrations
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Connect and manage Gmail, Meta Ads, LinkedIn, IndiaMART, TradeIndia, and custom REST API endpoints to capture leads automatically.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Add New API Connection</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Active Channels</span>
            <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live
            </span>
          </div>
          <div className="mt-2 sm:mt-3 flex flex-col sm:flex-row sm:items-baseline sm:space-x-2">
            <span className="text-xl sm:text-3xl font-black text-slate-900">{activeCount}</span>
            <span className="text-[10px] sm:text-xs text-slate-500 font-semibold truncate">of {channels.length} configured</span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Total Leads Ingested</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 sm:mt-3 flex flex-col sm:flex-row sm:items-baseline sm:space-x-2">
            <span className="text-xl sm:text-3xl font-black text-blue-600 font-mono">{totalCaptured}</span>
            <span className="text-[10px] sm:text-xs text-emerald-600 font-bold truncate">100% Realtime</span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Ingestion Logs</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 sm:mt-3 flex flex-col sm:flex-row sm:items-baseline sm:space-x-2">
            <span className="text-xl sm:text-3xl font-black text-slate-900 font-mono">{logs.length}</span>
            <span className="text-[10px] sm:text-xs text-slate-500 font-semibold truncate">Audit Events</span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Public Webhook</span>
            <Globe className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 sm:mt-3">
            <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-mono bg-indigo-50 text-indigo-700 font-bold">
              HTTP POST 201
            </span>
            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 font-medium truncate">/api/v1/crm/lead-channels/webhook/</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-200 space-x-2">
        <button
          onClick={() => setActiveTab('channels')}
          className={`px-4 py-3 font-bold text-sm border-b-2 transition-colors cursor-pointer flex items-center space-x-2 ${
            activeTab === 'channels'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Connected Channels ({channels.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('webhook')}
          className={`px-4 py-3 font-bold text-sm border-b-2 transition-colors cursor-pointer flex items-center space-x-2 ${
            activeTab === 'webhook'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Inbound Webhook & API Docs</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-3 font-bold text-sm border-b-2 transition-colors cursor-pointer flex items-center space-x-2 ${
            activeTab === 'logs'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Realtime Ingestion Logs ({logs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('guide')}
          className={`px-4 py-3 font-bold text-sm border-b-2 transition-colors cursor-pointer flex items-center space-x-2 ${
            activeTab === 'guide'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>How to Use CRM & API Guide</span>
          <span className="text-[10px] bg-blue-100 text-blue-700 font-extrabold px-2 py-0.5 rounded-full">
            Docs & Downloads
          </span>
        </button>
      </div>

      {/* TAB 1: CONNECTED CHANNELS */}
      {activeTab === 'channels' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {channels.map((channel) => {
            const Icon = channelIcons[channel.channel_type] || Globe;
            const badgeClass = channelColor[channel.channel_type] || 'bg-slate-50 text-slate-700';

            return (
              <div
                key={channel.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3.5">
                      <div className={`p-3 rounded-xl border ${badgeClass}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base leading-snug">{channel.name}</h3>
                        <span className="text-xs text-slate-500 font-mono">
                          {channel.sync_frequency || 'Realtime Webhook'}
                        </span>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      onClick={() => handleToggleChannel(channel)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        channel.is_active ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                      title="Toggle Active/Paused"
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          channel.is_active ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="mt-4 p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600 border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Account / Page:</span>
                      <span className="font-mono font-semibold text-slate-800 truncate max-w-[200px]">
                        {channel.account_id || 'Configured via Endpoint'}
                      </span>
                    </div>
                    {channel.endpoint_url && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Target URL:</span>
                        <span className="font-mono font-semibold text-blue-600 truncate max-w-[200px]" title={channel.endpoint_url}>
                          {channel.endpoint_url}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Auto-Assign Rep:</span>
                      <span className="font-semibold text-slate-800">
                        {channel.assigned_name || 'Round-Robin / Admin'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Leads Captured:</span>
                      <span className="font-extrabold text-blue-600">{channel.leads_captured || 0} leads</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Last Sync Event:</span>
                      <span className="text-slate-700 font-semibold">
                        {channel.last_sync_at ? new Date(channel.last_sync_at).toLocaleString() : 'Never'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions: Edit, Delete, Test Lead */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditModalChannel(channel)}
                      className="inline-flex items-center text-xs font-bold text-slate-700 hover:text-blue-600 cursor-pointer p-1 rounded hover:bg-slate-50"
                      title="Edit API Details & Keys"
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1 text-slate-500" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleDeleteChannel(channel)}
                      className="inline-flex items-center text-xs font-bold text-slate-400 hover:text-rose-600 cursor-pointer p-1 rounded hover:bg-rose-50"
                      title="Delete API Channel"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      <span>Delete</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleTestLeadPush(channel)}
                    disabled={testingId === channel.id || !channel.is_active}
                    className={`inline-flex items-center px-3.5 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-2xs ${
                      channel.is_active
                        ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                        : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    }`}
                  >
                    <Play className={`w-3 h-3 mr-1 ${testingId === channel.id ? 'animate-spin' : ''}`} />
                    <span>{testingId === channel.id ? 'Pushing...' : 'Send Test Lead'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: INBOUND WEBHOOK SPEC & SANDBOX */}
      {activeTab === 'webhook' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Docs & Instructions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
            <div>
              <h3 className="text-lg font-black text-slate-900">Inbound Webhook API Specification</h3>
              <p className="text-xs text-slate-500 mt-1">
                Post customer leads from external landing pages, website contact forms, or third-party webhooks directly into Odias ERP.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Target Webhook Endpoint
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.protocol}//${window.location.hostname}:8000/api/v1/crm/lead-channels/webhook/`}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-800"
                />
                <button
                  onClick={handleCopyWebhookUrl}
                  className="inline-flex items-center px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 mr-1 text-emerald-300" /> : <Copy className="w-4 h-4 mr-1" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Security Header
              </label>
              <div className="p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto">
                <code>X-Webhook-Secret: whsec_inbound_website_88190</code>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                cURL Integration Sample
              </label>
              <div className="p-3.5 bg-slate-900 text-slate-200 font-mono text-[11px] rounded-xl overflow-x-auto leading-relaxed">
                <pre>{`curl -X POST http://127.0.0.1:8000/api/v1/crm/lead-channels/webhook/ \\
  -H "Content-Type: application/json" \\
  -H "X-Webhook-Secret: whsec_inbound_website_88190" \\
  -d '{
    "first_name": "Rohan",
    "last_name": "Kapoor",
    "company_name": "Kapoor Industries",
    "email": "rohan@kapoorind.in",
    "phone": "+91 98200 12345",
    "city": "Mumbai",
    "state": "Maharashtra",
    "estimated_value": 500000
  }'`}</pre>
              </div>
            </div>
          </div>

          {/* Live Test Bench */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
            <div>
              <h3 className="text-lg font-black text-slate-900">Realtime Webhook Sandbox</h3>
              <p className="text-xs text-slate-500 mt-1">
                Post a live payload to instantly test lead registration, audit logs, and notification dispatch.
              </p>
            </div>

            <form onSubmit={handleSendCustomWebhook} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={testPayload.first_name}
                    onChange={(e) => setTestPayload({ ...testPayload, first_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Last Name</label>
                  <input
                    type="text"
                    value={testPayload.last_name}
                    onChange={(e) => setTestPayload({ ...testPayload, last_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={testPayload.company_name}
                  onChange={(e) => setTestPayload({ ...testPayload, company_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={testPayload.email}
                    onChange={(e) => setTestPayload({ ...testPayload, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={testPayload.phone}
                    onChange={(e) => setTestPayload({ ...testPayload, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">City & State</label>
                  <input
                    type="text"
                    value={`${testPayload.city}, ${testPayload.state}`}
                    onChange={(e) => {
                      const parts = e.target.value.split(',');
                      setTestPayload({ ...testPayload, city: parts[0]?.trim() || '', state: parts[1]?.trim() || '' });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Estimated Value (₹)</label>
                  <input
                    type="number"
                    value={testPayload.estimated_value}
                    onChange={(e) => setTestPayload({ ...testPayload, estimated_value: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Inquiry Notes</label>
                <textarea
                  rows={2}
                  value={testPayload.notes}
                  onChange={(e) => setTestPayload({ ...testPayload, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={submittingWebhook}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Play className={`w-3.5 h-3.5 ${submittingWebhook ? 'animate-spin' : ''}`} />
                <span>{submittingWebhook ? 'Posting Webhook...' : 'Post Inbound Webhook Payload Now'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
      {/* TAB 3: INGESTION LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Realtime Payload Ingestion Stream</h3>
            <span className="text-xs text-slate-500 font-semibold">{logs.length} Total Captured Invocations</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Channel Source</th>
                  <th className="px-5 py-3">Sender Contact</th>
                  <th className="px-5 py-3">Created Lead</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      No inbound lead payloads received yet. Click "Send Test Lead" to simulate one!
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-slate-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-800 border border-slate-200">
                          {log.source || log.channel_name || 'Webhook'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-slate-900 block">{log.sender_name || 'Inbound User'}</span>
                        <span className="text-slate-500 text-[11px] font-mono">{log.sender_email}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono font-bold text-blue-600">{log.lead_code || 'Auto-created'}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {log.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setViewPayloadModal(log)}
                          className="inline-flex items-center px-2.5 py-1 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 font-bold transition-colors cursor-pointer"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          <span>View JSON</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: HOW TO USE CRM & DEVELOPER API GUIDE */}
      {activeTab === 'guide' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Header Banner */}
          <div className="bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl border border-blue-700/40">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-blue-500/20 to-transparent pointer-events-none" />
            <div className="relative z-10 max-w-3xl">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 mb-3">
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-blue-300" />
                Comprehensive Developer & Integration Hub
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
                How to Connect & Use Odias Enterprise CRM
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Connect your website forms, landing pages, Meta Lead Ads, Google Ads, IndiaMART, and custom applications directly into Odias ERP. Capture leads automatically, route them to your sales team in real-time, and convert won deals into GST invoices with one click.
              </p>

              {/* Quick Downloads Row inside Banner */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleDownloadManual}
                  className="px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-blue-50 text-xs font-black shadow-lg transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-blue-600" />
                  <span>Download Complete Guide (PDF)</span>
                </button>
                <button
                  onClick={handleDownloadHtmlForm}
                  className="px-4 py-2.5 rounded-xl bg-blue-600/80 hover:bg-blue-600 text-white border border-blue-400/30 text-xs font-black shadow-lg transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  <span>Download Lead Form (.html)</span>
                </button>
                <button
                  onClick={handleDownloadPostmanCollection}
                  className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-white border border-slate-700 text-xs font-black shadow-lg transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>Download Postman (.json)</span>
                </button>
                <button
                  onClick={handleDownloadLeadsCsv}
                  className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-white border border-slate-700 text-xs font-black shadow-lg transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-purple-400" />
                  <span>Download Sample CSV (.csv)</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4 Download Action Cards */}
          <div>
            <h3 className="text-lg font-black text-slate-900 mb-3 flex items-center space-x-2">
              <Download className="w-5 h-5 text-blue-600" />
              <span>Developer Resources & Templates (Downloadable)</span>
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5 sm:mb-3">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-1 leading-snug">Official CRM & API Guide (PDF)</h4>
                  <p className="text-[11px] sm:text-xs text-slate-500 mb-3 sm:mb-4">
                    Complete enterprise operating manual with module walkthroughs and schemas.
                  </p>
                </div>
                <button
                  onClick={handleDownloadManual}
                  className="w-full py-1.5 sm:py-2 px-2.5 sm:px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-[11px] sm:text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Download Guide (.pdf)</span>
                </button>
              </div>

              <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5 sm:mb-3">
                    <FileCode className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-1 leading-snug">Ready-to-Deploy HTML Form</h4>
                  <p className="text-[11px] sm:text-xs text-slate-500 mb-3 sm:mb-4">
                    Standalone, styled contact form pre-configured with fetch() calls.
                  </p>
                </div>
                <button
                  onClick={handleDownloadHtmlForm}
                  className="w-full py-1.5 sm:py-2 px-2.5 sm:px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-[11px] sm:text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Download HTML Form</span>
                </button>
              </div>

              <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-amber-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2.5 sm:mb-3">
                    <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-1 leading-snug">Postman API Collection</h4>
                  <p className="text-[11px] sm:text-xs text-slate-500 mb-3 sm:mb-4">
                    Importable Postman collection containing all CRM endpoints & payloads.
                  </p>
                </div>
                <button
                  onClick={handleDownloadPostmanCollection}
                  className="w-full py-1.5 sm:py-2 px-2.5 sm:px-3 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-[11px] sm:text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Download Postman (.json)</span>
                </button>
              </div>

              <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2.5 sm:mb-3">
                    <Sliders className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-1 leading-snug">Leads Import CSV Template</h4>
                  <p className="text-[11px] sm:text-xs text-slate-500 mb-3 sm:mb-4">
                    Clean CSV template with sample data for bulk importing historical leads.
                  </p>
                </div>
                <button
                  onClick={handleDownloadLeadsCsv}
                  className="w-full py-1.5 sm:py-2 px-2.5 sm:px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-[11px] sm:text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Download CSV Template</span>
                </button>
              </div>
            </div>
          </div>

          {/* Architecture & Flow */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <span>End-to-End Enterprise CRM Lifecycle Flow</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Step 1</span>
                  <h4 className="font-bold text-slate-900 text-xs mt-1 mb-2">Lead Capture</h4>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    Inbound webhooks receive name, email, phone, company & requirements from any platform.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] text-slate-500 font-mono">
                  HTTP POST /api/v1/crm/lead-channels/webhook/
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">Step 2</span>
                  <h4 className="font-bold text-slate-900 text-xs mt-1 mb-2">AI Scoring & Dedupe</h4>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    Automated scoring algorithm checks lead value, detects duplicates by email, and sets priority.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] text-slate-500 font-mono">
                  Dedupe by Email & Phone
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-purple-600 tracking-wider">Step 3</span>
                  <h4 className="font-bold text-slate-900 text-xs mt-1 mb-2">Auto-Routing</h4>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    Leads are routed to sales reps using round-robin or mapped campaign channels with instant notifications.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] text-slate-500 font-mono">
                  Auto-Assign + Notification
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider">Step 4</span>
                  <h4 className="font-bold text-slate-900 text-xs mt-1 mb-2">Pipeline Tracking</h4>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    Deals move visually through Kanban: New &rarr; Contacted &rarr; Qualified &rarr; Proposal &rarr; Won.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] text-slate-500 font-mono">
                  Kanban Stages & Values
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Step 5</span>
                  <h4 className="font-bold text-slate-900 text-xs mt-1 mb-2">1-Click Conversion</h4>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    Won deals are instantly converted into a Customer Account and linked GST Commercial Invoices.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] text-slate-500 font-mono">
                  Lead &rarr; Customer &rarr; Invoicing
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Code Samples */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                  <Code className="w-5 h-5 text-blue-600" />
                  <span>Integration Code Snippets</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Copy and paste into your website backend, landing page script, or serverless function.
                </p>
              </div>

              {/* Code Tab Switcher */}
              <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl">
                {(['html', 'curl', 'js', 'python', 'php'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSelectedCodeTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition cursor-pointer ${
                      selectedCodeTab === tab
                        ? 'bg-white text-blue-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab === 'html' ? 'HTML Form' : tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Code Box */}
            <div className="bg-slate-950 p-5 font-mono text-xs text-slate-200 relative">
              <button
                onClick={() => {
                  let textToCopy = '';
                  if (selectedCodeTab === 'html') {
                    textToCopy = `<form action="http://localhost:8000/api/v1/crm/lead-channels/webhook/" method="POST">\n  <input type="text" name="name" placeholder="Full Name" required />\n  <input type="email" name="email" placeholder="Email" required />\n  <input type="tel" name="phone" placeholder="Phone" required />\n  <input type="text" name="company_name" placeholder="Company" />\n  <input type="hidden" name="source" value="Website Contact Form" />\n  <button type="submit">Submit Request</button>\n</form>`;
                  } else if (selectedCodeTab === 'curl') {
                    textToCopy = `curl -X POST "http://localhost:8000/api/v1/crm/lead-channels/webhook/" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "name": "Rajesh Mohanty",\n    "email": "rajesh@kalingasteel.com",\n    "phone": "+91 9876543210",\n    "company_name": "Kalinga Steels & Power Ltd",\n    "source": "Website Contact Form",\n    "notes": "Interested in ERP Enterprise license"\n  }'`;
                  } else if (selectedCodeTab === 'js') {
                    textToCopy = `fetch('http://localhost:8000/api/v1/crm/lead-channels/webhook/', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({\n    name: 'Rajesh Mohanty',\n    email: 'rajesh@kalingasteel.com',\n    phone: '+91 9876543210',\n    company_name: 'Kalinga Steels & Power Ltd',\n    source: 'Landing Page',\n    notes: 'Requested product demo'\n  })\n})\n.then(res => res.json())\n.then(data => console.log('Lead Captured:', data));`;
                  } else if (selectedCodeTab === 'python') {
                    textToCopy = `import requests\n\nurl = "http://localhost:8000/api/v1/crm/lead-channels/webhook/"\npayload = {\n    "name": "Rajesh Mohanty",\n    "email": "rajesh@kalingasteel.com",\n    "phone": "+91 9876543210",\n    "company_name": "Kalinga Steels & Power Ltd",\n    "source": "Python Backend API",\n    "notes": "Enterprise defense inquiry"\n}\nresponse = requests.post(url, json=payload)\nprint(response.json())`;
                  } else if (selectedCodeTab === 'php') {
                    textToCopy = `<?php\n$url = "http://localhost:8000/api/v1/crm/lead-channels/webhook/";\n$data = [\n  "name" => $_POST["name"],\n  "email" => $_POST["email"],\n  "phone" => $_POST["phone"],\n  "company_name" => $_POST["company"],\n  "source" => "WordPress Contact Form"\n];\n\n$options = [\n  "http" => [\n    "header"  => "Content-type: application/json\\r\\n",\n    "method"  => "POST",\n    "content" => json_encode($data)\n  ]\n];\n$context  = stream_context_create($options);\n$result = file_get_contents($url, false, $context);\n?>`;
                  }

                  navigator.clipboard.writeText(textToCopy);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border border-slate-700"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied!' : 'Copy Snippet'}</span>
              </button>

              <pre className="overflow-x-auto py-2 leading-relaxed text-emerald-300">
                {selectedCodeTab === 'html' && `<!-- Odias ERP Inbound Webhook Contact Form -->
<form action="http://localhost:8000/api/v1/crm/lead-channels/webhook/" method="POST">
  <input type="text" name="name" placeholder="Full Name" required />
  <input type="email" name="email" placeholder="Email" required />
  <input type="tel" name="phone" placeholder="Phone" required />
  <input type="text" name="company_name" placeholder="Company Name" />
  <input type="hidden" name="source" value="Website Contact Form" />
  <textarea name="notes" placeholder="Requirement details..."></textarea>
  <button type="submit">Send Inbound Lead</button>
</form>`}

                {selectedCodeTab === 'curl' && `# Test Inbound Lead Webhook via cURL
curl -X POST "http://localhost:8000/api/v1/crm/lead-channels/webhook/" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Rajesh Mohanty",
    "email": "rajesh@kalingasteel.com",
    "phone": "+91 9876543210",
    "company_name": "Kalinga Steels & Power Ltd",
    "source": "Website Contact Form",
    "notes": "Interested in ERP Enterprise license for 150 employees"
  }'`}

                {selectedCodeTab === 'js' && `// Modern JavaScript / TypeScript Fetch Example
fetch('http://localhost:8000/api/v1/crm/lead-channels/webhook/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Rajesh Mohanty',
    email: 'rajesh@kalingasteel.com',
    phone: '+91 9876543210',
    company_name: 'Kalinga Steels & Power Ltd',
    source: 'Website Landing Page',
    notes: 'Requested immediate callback for GST ERP deployment'
  })
})
.then(response => response.json())
.then(data => {
  console.log('Lead ingested successfully:', data);
  alert('Thank you! Our sales team has received your inquiry.');
})
.catch(error => console.error('Ingestion error:', error));`}

                {selectedCodeTab === 'python' && `# Python Requests Library
import requests

webhook_url = "http://localhost:8000/api/v1/crm/lead-channels/webhook/"

lead_data = {
    "name": "Rajesh Mohanty",
    "email": "rajesh@kalingasteel.com",
    "phone": "+91 9876543210",
    "company_name": "Kalinga Steels & Power Ltd",
    "source": "Python Backend API",
    "notes": "Enterprise defense inquiry and GST compliance audit"
}

response = requests.post(webhook_url, json=lead_data)
print("Status Code:", response.status_code)
print("Response JSON:", response.json())`}

                {selectedCodeTab === 'php' && `<?php
// WordPress / PHP Contact Form Handler
$webhook_url = "http://localhost:8000/api/v1/crm/lead-channels/webhook/";

$lead_payload = [
    "name"         => sanitize_text_field($_POST["full_name"]),
    "email"        => sanitize_email($_POST["email"]),
    "phone"        => sanitize_text_field($_POST["phone"]),
    "company_name" => sanitize_text_field($_POST["company"]),
    "source"       => "WordPress Contact Form 7",
    "notes"        => sanitize_textarea_field($_POST["message"])
];

$response = wp_remote_post($webhook_url, [
    "headers" => ["Content-Type" => "application/json"],
    "body"    => json_encode($lead_payload)
]);
?>`}
              </pre>
            </div>
          </div>

          {/* Integration FAQs & Step-by-Step Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
              <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center space-x-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <span>How to connect WordPress, Elementor & CF7</span>
              </h4>
              <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside">
                <li>Install the free <strong>Webhooks for Contact Form 7</strong> or <strong>Elementor Webhook Action</strong>.</li>
                <li>In Form Actions, select <strong>Webhook</strong> &rarr; Add Action.</li>
                <li>Paste your Odias ERP webhook URL: <code className="bg-slate-100 text-blue-700 px-1 py-0.5 rounded">http://&lt;domain&gt;/api/v1/crm/lead-channels/webhook/</code></li>
                <li>Map form fields: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">name</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">email</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">phone</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">company_name</code>.</li>
                <li>Submit a test inquiry. The lead will appear in your CRM Pipeline immediately with realtime notifications!</li>
              </ol>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
              <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center space-x-2">
                <Share2 className="w-4 h-4 text-indigo-600" />
                <span>How to connect Meta Lead Ads (FB & Insta)</span>
              </h4>
              <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside">
                <li>In Meta Business Suite, navigate to <strong>Instant Forms & Lead Center</strong>.</li>
                <li>Configure <strong>CRM Integration & Webhooks</strong>.</li>
                <li>Select Webhook / Zapier endpoint and enter the Odias ERP webhook endpoint.</li>
                <li>Match questions to standard fields (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono">full_name</code> &rarr; <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">name</code>).</li>
                <li>When an ad clicker submits the form on Instagram or Facebook, the lead is ingested in under 2 seconds!</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW API CONNECTION */}
      {addModalOpen && (
        <Modal
          isOpen={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          title="Connect New Inbound Lead API / Channel"
          size="lg"
        >
          <form onSubmit={handleCreateChannel} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Channel / Integration Name *</label>
                <input
                  type="text"
                  required
                  value={newChannelForm.name}
                  onChange={(e) => setNewChannelForm({ ...newChannelForm, name: e.target.value })}
                  placeholder="e.g. IndiaMART Verified Leads, Landing Page Form"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Integration Platform / Protocol *</label>
                <select
                  value={newChannelForm.channel_type}
                  onChange={(e) => setNewChannelForm({ ...newChannelForm, channel_type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="custom_api">Custom REST API Connector</option>
                  <option value="website_webhook">Website Inbound Webhook</option>
                  <option value="indiamart">IndiaMART Inbound Buyer Leads</option>
                  <option value="tradeindia">TradeIndia Inbound Leads</option>
                  <option value="justdial">JustDial Lead Hook</option>
                  <option value="zapier">Zapier Webhook Bridge</option>
                  <option value="hubspot">HubSpot Inbound Connector</option>
                  <option value="gmail">Gmail / Google Workspace (IMAP)</option>
                  <option value="meta">Meta (Facebook & Instagram Ads)</option>
                  <option value="linkedin">LinkedIn Lead Gen Forms</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Target Endpoint URL (Optional)</label>
                <input
                  type="url"
                  value={newChannelForm.endpoint_url}
                  onChange={(e) => setNewChannelForm({ ...newChannelForm, endpoint_url: e.target.value })}
                  placeholder="https://api.indiamart.com/leads/..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Account ID / Campaign Identifier</label>
                <input
                  type="text"
                  value={newChannelForm.account_id}
                  onChange={(e) => setNewChannelForm({ ...newChannelForm, account_id: e.target.value })}
                  placeholder="e.g. act_indiamart_odias"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">API Key / Access Token</label>
                <input
                  type="password"
                  value={newChannelForm.api_key}
                  onChange={(e) => setNewChannelForm({ ...newChannelForm, api_key: e.target.value })}
                  placeholder="Bearer token or API key"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Webhook Secret (Verification Key)</label>
                <input
                  type="text"
                  value={newChannelForm.webhook_secret}
                  onChange={(e) => setNewChannelForm({ ...newChannelForm, webhook_secret: e.target.value })}
                  placeholder="whsec_..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Auto-Assign Leads To</label>
                <select
                  value={newChannelForm.auto_assign_to}
                  onChange={(e) => setNewChannelForm({ ...newChannelForm, auto_assign_to: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                >
                  <option value="">-- Round-Robin / Default Admin --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.first_name ? `${u.first_name} ${u.last_name || ''}` : u.username} ({u.role_name || 'Staff'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Sync Frequency</label>
                <select
                  value={newChannelForm.sync_frequency}
                  onChange={(e) => setNewChannelForm({ ...newChannelForm, sync_frequency: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                >
                  <option value="Realtime Webhook">Realtime Webhook</option>
                  <option value="Instant IMAP Push">Instant IMAP Push</option>
                  <option value="Poll Every 15 Mins">Poll Every 15 Mins</option>
                  <option value="Hourly Ingestion">Hourly Ingestion</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Description / Mapping Instructions</label>
              <textarea
                rows={2}
                value={newChannelForm.description}
                onChange={(e) => setNewChannelForm({ ...newChannelForm, description: e.target.value })}
                placeholder="Inbound lead channel for enterprise defense and GST requirements."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="is_active_new"
                checked={newChannelForm.is_active}
                onChange={(e) => setNewChannelForm({ ...newChannelForm, is_active: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="is_active_new" className="text-xs font-bold text-slate-700">
                Channel Active & Listening for Incoming Leads
              </label>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingAdd}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm cursor-pointer"
              >
                {submittingAdd ? 'Connecting...' : 'Connect API Channel'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: EDIT API CONNECTION */}
      {editModalChannel && (
        <Modal
          isOpen={!!editModalChannel}
          onClose={() => setEditModalChannel(null)}
          title={`Edit API Connection: ${editModalChannel.name}`}
          size="lg"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Channel Name *</label>
                <input
                  type="text"
                  required
                  value={editModalChannel.name}
                  onChange={(e) => setEditModalChannel({ ...editModalChannel, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Platform Type</label>
                <select
                  value={editModalChannel.channel_type}
                  onChange={(e) => setEditModalChannel({ ...editModalChannel, channel_type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="custom_api">Custom REST API Connector</option>
                  <option value="website_webhook">Website Inbound Webhook</option>
                  <option value="indiamart">IndiaMART Inbound Buyer Leads</option>
                  <option value="tradeindia">TradeIndia Inbound Leads</option>
                  <option value="justdial">JustDial Lead Hook</option>
                  <option value="zapier">Zapier Webhook Bridge</option>
                  <option value="hubspot">HubSpot Inbound Connector</option>
                  <option value="gmail">Gmail / Google Workspace (IMAP)</option>
                  <option value="meta">Meta (Facebook & Instagram Ads)</option>
                  <option value="linkedin">LinkedIn Lead Gen Forms</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Target Endpoint URL</label>
                <input
                  type="url"
                  value={editModalChannel.endpoint_url || ''}
                  onChange={(e) => setEditModalChannel({ ...editModalChannel, endpoint_url: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Account ID / Page Name</label>
                <input
                  type="text"
                  value={editModalChannel.account_id || ''}
                  onChange={(e) => setEditModalChannel({ ...editModalChannel, account_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">API Key / Access Token</label>
                <input
                  type="password"
                  value={editModalChannel.api_key || ''}
                  onChange={(e) => setEditModalChannel({ ...editModalChannel, api_key: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Webhook Secret</label>
                <input
                  type="text"
                  value={editModalChannel.webhook_secret || ''}
                  onChange={(e) => setEditModalChannel({ ...editModalChannel, webhook_secret: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Auto-Assign Leads To</label>
                <select
                  value={editModalChannel.auto_assign_to || ''}
                  onChange={(e) => setEditModalChannel({ ...editModalChannel, auto_assign_to: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                >
                  <option value="">-- Round-Robin / Default Admin --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.first_name ? `${u.first_name} ${u.last_name || ''}` : u.username} ({u.role_name || 'Staff'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Sync Frequency</label>
                <input
                  type="text"
                  value={editModalChannel.sync_frequency || 'Realtime Webhook'}
                  onChange={(e) => setEditModalChannel({ ...editModalChannel, sync_frequency: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Description / Notes</label>
              <textarea
                rows={2}
                value={editModalChannel.description || ''}
                onChange={(e) => setEditModalChannel({ ...editModalChannel, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="is_active_edit"
                checked={editModalChannel.is_active}
                onChange={(e) => setEditModalChannel({ ...editModalChannel, is_active: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="is_active_edit" className="text-xs font-bold text-slate-700">
                Channel Active & Listening for Leads
              </label>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setEditModalChannel(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm cursor-pointer"
              >
                {submittingEdit ? 'Saving...' : 'Save API Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: VIEW JSON PAYLOAD */}
      {viewPayloadModal && (
        <Modal
          isOpen={!!viewPayloadModal}
          onClose={() => setViewPayloadModal(null)}
          title={`Raw Payload: ${viewPayloadModal.source.toUpperCase()} (${viewPayloadModal.sender_email})`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Timestamp: {new Date(viewPayloadModal.created_at).toLocaleString()}</span>
              <span>Status: <strong className="text-emerald-600">{viewPayloadModal.status}</strong></span>
            </div>

            <div className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto max-h-96">
              <pre>{JSON.stringify(viewPayloadModal.payload, null, 2)}</pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewPayloadModal(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
