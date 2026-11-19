import React, { useState, useEffect } from 'react';
import {
  Sparkles, Star, Plus, Search, Filter, MessageSquare,
  CheckCircle2, AlertCircle, Building2, ThumbsUp, ThumbsDown,
  RefreshCw, Award, Heart
} from 'lucide-react';
import { api } from '../../api/client';
import { useRealtime } from '../../context/RealtimeContext';
import { Modal } from '../../components/common/Modal';

export const CustomerFeedbackPage: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sentimentFilter, setSentimentFilter] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const { emitEvent } = useRealtime();

  // Create Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    customer: '',
    rating: 5,
    nps_score: 10,
    category: 'general',
    sentiment: 'positive',
    comments: '',
    follow_up_required: false,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fbData, custData] = await Promise.all([
        api.getFeedback(),
        api.getCustomers(),
      ]);
      setFeedbacks(fbData.results || fbData || []);
      setCustomers(custData.results || custData || []);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer) {
      alert('Please select a Customer Account.');
      return;
    }
    setSubmitting(true);
    try {
      await api.createFeedback(formData);
      showToast('Customer feedback recorded!');
      emitEvent('feedback_submitted', 'Feedback Logged', `Recorded ${formData.rating}★ feedback`, 'success');
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating =
    feedbacks.length > 0
      ? (feedbacks.reduce((sum, f) => sum + (f.rating || 5), 0) / feedbacks.length).toFixed(1)
      : '5.0';

  const avgNps =
    feedbacks.length > 0
      ? Math.round(feedbacks.reduce((sum, f) => sum + (f.nps_score || 10), 0) / feedbacks.length)
      : 9;

  const positivePercent =
    feedbacks.length > 0
      ? Math.round(
          (feedbacks.filter((f) => f.sentiment === 'positive').length / feedbacks.length) * 100
        )
      : 100;

  const filtered = feedbacks.filter((f) => {
    if (sentimentFilter && f.sentiment !== sentimentFilter) return false;
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
            <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Customer Satisfaction (CSAT) & NPS Feedback
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Monitor client happiness scores, Net Promoter ratings, product reviews, and follow-up alerts.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setFormData({
              customer: customers[0]?.id || '',
              rating: 5,
              nps_score: 10,
              category: 'general',
              sentiment: 'positive',
              comments: '',
              follow_up_required: false,
            });
            setModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Record Client Feedback</span>
        </button>
      </div>

      {/* Overview Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Average CSAT Rating</span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-amber-500">{avgRating}★</span>
            <span className="text-xs text-slate-500 font-semibold">out of 5.0</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Net Promoter Score (NPS)</span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-emerald-600 font-mono">+{avgNps * 10}</span>
            <span className="text-xs text-emerald-700 font-bold">World-Class Rating</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Positive Sentiment</span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-blue-600">{positivePercent}%</span>
            <span className="text-xs text-slate-500 font-semibold">{feedbacks.length} Total Reviews</span>
          </div>
        </div>
      </div>

      {/* Reviews Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-1">
          <h3 className="font-bold text-slate-900 text-sm">Customer Survey Testimonials</h3>
          <select
            value={sentimentFilter}
            onChange={(e) => setSentimentFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl font-bold bg-white"
          >
            <option value="">All Sentiments</option>
            <option value="positive">Positive Only</option>
            <option value="neutral">Neutral Only</option>
            <option value="negative">Negative Only</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((fb) => (
            <div
              key={fb.id}
              className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-sm transition-all space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{fb.customer_name}</h4>
                    <span className="text-[11px] text-slate-400 capitalize block">
                      Topic: {fb.category?.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= (fb.rating || 5)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="mt-3 text-xs text-slate-700 font-sans italic leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  "{fb.comments}"
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>NPS Score: <strong className="text-slate-800">{fb.nps_score}/10</strong></span>
                <span>{new Date(fb.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: RECORD FEEDBACK */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Record Customer Review & NPS Rating"
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Customer Account *</label>
              <select
                required
                value={formData.customer}
                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
              >
                <option value="">-- Choose Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name} ({c.customer_code})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Star Rating (1 to 5) *</label>
                <select
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                >
                  <option value={5}>5 Stars - Excellent</option>
                  <option value={4}>4 Stars - Good</option>
                  <option value={3}>3 Stars - Average</option>
                  <option value={2}>2 Stars - Poor</option>
                  <option value={1}>1 Star - Unsatisfactory</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">NPS Score (0 to 10)</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={formData.nps_score}
                  onChange={(e) => setFormData({ ...formData, nps_score: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                >
                  <option value="product">Product Quality & Capabilities</option>
                  <option value="customer_service">Customer Service & Support</option>
                  <option value="pricing">Pricing & Commercial Terms</option>
                  <option value="implementation">Implementation & Training</option>
                  <option value="general">General Experience</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Sentiment</label>
                <select
                  value={formData.sentiment}
                  onChange={(e) => setFormData({ ...formData, sentiment: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                >
                  <option value="positive">Positive</option>
                  <option value="neutral">Neutral</option>
                  <option value="negative">Negative</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Customer Review / Testimonial *</label>
              <textarea
                rows={3}
                required
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                placeholder="Enter client remarks and feedback..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 shadow-sm cursor-pointer"
              >
                {submitting ? 'Saving...' : 'Save Customer Feedback'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
