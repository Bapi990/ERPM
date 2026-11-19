import React, { useState, useEffect } from 'react';
import {
  Bell, Mail, MessageSquare, Send, CheckCircle2, Clock,
  Filter, Plus, Search, Building2, User, Phone, Sparkles,
  Smartphone, ShieldCheck, RefreshCw
} from 'lucide-react';
import { api } from '../../api/client';
import { useRealtime } from '../../context/RealtimeContext';
import { Modal } from '../../components/common/Modal';

export const ClientCommunicationPage: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const { emitEvent } = useRealtime();

  // Composer Modal
  const [composeModalOpen, setComposeModalOpen] = useState(false);
  const [composeForm, setComposeForm] = useState({
    channel: 'email',
    recipient: '',
    subject: '',
    message: '',
    customer: '',
    lead: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const templates = [
    {
      label: 'Quotation Follow-up',
      subject: 'Follow-up regarding Sales Quotation - Odias ERP Suite',
      message: 'Dear Sir/Madam,\n\nFollowing up on the commercial quotation submitted for Odias Enterprise ERP Cloud Implementation. Please let us know if your procurement committee has any questions or requires a technical walkthrough.\n\nWarm regards,\nOdias ERP Technologies Pvt. Ltd.',
    },
    {
      label: 'Demo & Technical Walkthrough',
      subject: 'Odias ERP Cloud Implementation - Interactive Demo Invitation',
      message: 'Dear Team,\n\nWe would be delighted to host an interactive live demonstration of the GST Billing, Multi-Warehouse Inventory, and Realtime Payroll modules tailored for your operations. Kindly share your availability for this week.\n\nBest regards,\nOdias ERP Enterprise Solutions',
    },
    {
      label: 'Payment Courtesy Notice',
      subject: 'Courtesy Statement & Account Balance Notice',
      message: 'Dear Accounts Team,\n\nPlease find attached the account ledger and pending invoice statement for your review. We kindly request the settlement to be scheduled as per agreed payment terms.\n\nThank you for your valued partnership.\nFinance & Accounts Department',
    },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [commData, custData, leadData] = await Promise.all([
        api.getCommunications(),
        api.getCustomers(),
        api.getLeads(),
      ]);
      setMessages(commData.results || commData || []);
      setCustomers(custData.results || custData || []);
      setLeads(leadData.results || leadData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  const handleApplyTemplate = (tpl: any) => {
    setComposeForm((prev) => ({
      ...prev,
      subject: tpl.subject,
      message: tpl.message,
    }));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: any = {
        channel: composeForm.channel,
        recipient: composeForm.recipient,
        subject: composeForm.subject,
        message: composeForm.message,
        direction: 'outbound',
        status: 'delivered',
      };
      if (composeForm.customer) payload.customer = composeForm.customer;
      if (composeForm.lead) payload.lead = composeForm.lead;

      await api.createCommunication(payload);
      showToast(`Message successfully dispatched via ${composeForm.channel.toUpperCase()}!`);
      emitEvent('communication_sent', 'Client Message Sent', `Dispatched ${composeForm.channel} to ${composeForm.recipient}`, 'success');
      setComposeModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch communication');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = messages.filter((m) => {
    if (channelFilter && m.channel !== channelFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchSub = (m.subject || '').toLowerCase().includes(q);
      const matchRec = (m.recipient || '').toLowerCase().includes(q);
      const matchCust = (m.customer_name || '').toLowerCase().includes(q);
      if (!matchSub && !matchRec && !matchCust) return false;
    }
    return true;
  });

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
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Multichannel Client Communication Hub
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Send professional Email proposals, WhatsApp notices, SMS alerts, and track delivery receipts.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setComposeForm({
              channel: 'email',
              recipient: '',
              subject: '',
              message: '',
              customer: '',
              lead: '',
            });
            setComposeModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-sm transition-all cursor-pointer"
        >
          <Send className="w-4 h-4 mr-1.5" />
          <span>Compose Client Message</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by subject, recipient, account..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white transition-colors"
            />
          </div>

          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold bg-white"
          >
            <option value="">All Channels</option>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="sms">SMS</option>
          </select>
        </div>

        <span className="text-xs font-semibold text-slate-500">{filtered.length} communications logged</span>
      </div>

      {/* Communication Feed Cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
            No communication history found. Click "Compose Client Message" to send an email or WhatsApp!
          </div>
        ) : (
          filtered.map((msg) => (
            <div
              key={msg.id}
              className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-sm transition-all space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2.5 rounded-xl border ${
                    msg.channel === 'whatsapp'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {msg.channel === 'whatsapp' ? <Smartphone className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{msg.subject}</h3>
                    <div className="flex items-center space-x-2 mt-0.5 text-xs text-slate-500">
                      <span>To: <strong className="font-mono text-slate-800">{msg.recipient}</strong></span>
                      <span>•</span>
                      <span>Account: <strong className="text-slate-800">{msg.customer_name || msg.lead_name || 'Direct Contact'}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {msg.status}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {new Date(msg.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 font-sans whitespace-pre-wrap leading-relaxed">
                {msg.message}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 font-mono">
                <span>Dispatched by: <strong className="text-slate-700">{msg.sent_by_name || 'System'}</strong></span>
                <span className="capitalize">Channel: {msg.channel} Gateway</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL: COMPOSE MESSAGE */}
      {composeModalOpen && (
        <Modal
          isOpen={composeModalOpen}
          onClose={() => setComposeModalOpen(false)}
          title="Compose Client Communication"
          size="lg"
        >
          <form onSubmit={handleSendMessage} className="space-y-4">
            {/* Quick Templates Bar */}
            <div>
              <span className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 mr-1" />
                <span>Pre-formatted Professional Templates:</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {templates.map((tpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    className="px-3 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Channel Delivery</label>
                <select
                  value={composeForm.channel}
                  onChange={(e) => setComposeForm({ ...composeForm, channel: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                >
                  <option value="email">Email (Google Workspace / SMTP)</option>
                  <option value="whatsapp">WhatsApp Official Business API</option>
                  <option value="sms">SMS Gateway</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Recipient Address / Phone *</label>
                <input
                  type="text"
                  required
                  value={composeForm.recipient}
                  onChange={(e) => setComposeForm({ ...composeForm, recipient: e.target.value })}
                  placeholder={composeForm.channel === 'whatsapp' ? '+91 98200 12345' : 'procurement@client.com'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Subject / Header *</label>
              <input
                type="text"
                required
                value={composeForm.subject}
                onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Message Body *</label>
              <textarea
                rows={5}
                required
                value={composeForm.message}
                onChange={(e) => setComposeForm({ ...composeForm, message: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium leading-relaxed font-sans"
              />
            </div>

            <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setComposeModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm cursor-pointer flex items-center space-x-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Dispatching...' : 'Dispatch Message'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
