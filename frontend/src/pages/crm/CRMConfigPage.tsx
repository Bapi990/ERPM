import React, { useState, useEffect } from 'react';
import {
  Sliders, Globe, Mail, Share2, Zap, CheckCircle2,
  AlertCircle, RefreshCw, Copy, Check, Terminal, Play, Eye,
  Lock, Key, ExternalLink, ShieldCheck, ChevronRight, Plus,
  Edit3, Trash2, Settings, Shield, Server, ArrowRight
} from 'lucide-react';
import { api } from '../../api/client';
import { useRealtime } from '../../context/RealtimeContext';
import { Modal } from '../../components/common/Modal';

export const CRMConfigPage: React.FC = () => {
  const { emitEvent } = useRealtime();
  const [channels, setChannels] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'channels' | 'webhook' | 'logs'>('channels');
  const [copied, setCopied] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Channels</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live
            </span>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900">{activeCount}</span>
            <span className="text-xs text-slate-500 font-semibold">of {channels.length} configured</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Leads Ingested</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-blue-600 font-mono">{totalCaptured}</span>
            <span className="text-xs text-emerald-600 font-bold">100% Realtime</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ingestion Logs</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900 font-mono">{logs.length}</span>
            <span className="text-xs text-slate-500 font-semibold">Audit Events</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Public Webhook</span>
            <Globe className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-3">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-50 text-indigo-700 font-bold">
              HTTP POST 201
            </span>
            <p className="text-[11px] text-slate-500 mt-1 font-medium truncate">/api/v1/crm/lead-channels/webhook/</p>
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
