import React, { useState, useEffect } from 'react';
import {
  Briefcase, Plus, Users, UserCheck, Star, Mail, Phone,
  Building2, Calendar, Eye, CheckCircle2, Search, Filter,
  ChevronRight, Award, FileText
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import { Modal } from '../../components/common/Modal';
import type { JobPosting, JobApplication, Department } from '../../types';

export const RecruitmentPage: React.FC = () => {
  const { user } = useAuth();
  const { emitEvent, subscribe } = useRealtime();

  const [postings, setPostings] = useState<JobPosting[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'postings' | 'candidates'>('postings');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [postJobModal, setPostJobModal] = useState(false);
  const [addCandidateModal, setAddCandidateModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<JobApplication | null>(null);

  // Job Form
  const [jobForm, setJobForm] = useState({
    title: '',
    department: '',
    positions_count: 2,
    experience_required: '2-5 Years',
    salary_range: '₹6,00,000 - ₹10,00,000',
    employment_type: 'Full-time',
    description: '',
  });

  // Candidate Form
  const [candidateForm, setCandidateForm] = useState({
    job_posting: '',
    candidate_name: '',
    email: '',
    phone: '',
    experience_years: 3,
    current_company: '',
    current_ctc: '₹6 LPA',
    expected_ctc: '₹9 LPA',
    notice_period_days: 30,
    notes: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [jobsRes, appsRes, deptsRes] = await Promise.all([
        api.getJobPostings(),
        api.getJobApplications(),
        api.getDepartments(),
      ]);
      setPostings(jobsRes?.data?.results || jobsRes?.data || []);
      setApplications(appsRes?.data?.results || appsRes?.data || []);
      setDepartments(deptsRes?.data?.results || deptsRes?.data || []);
    } catch (err) {
      console.error('Failed to load recruitment data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = subscribe('recruitment_*', () => {
      loadData();
    });
    return () => unsub();
  }, []);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createJobPosting({
        ...jobForm,
        positions_count: Number(jobForm.positions_count),
        status: 'open',
      });
      emitEvent('recruitment_job_created', 'Job Opening Published', `Requisition "${jobForm.title}" is now open`, 'success');
      showToast(`Requisition "${jobForm.title}" published!`);
      setPostJobModal(false);
      setJobForm({
        title: '',
        department: '',
        positions_count: 2,
        experience_required: '2-5 Years',
        salary_range: '₹6,00,000 - ₹10,00,000',
        employment_type: 'Full-time',
        description: '',
      });
      loadData();
    } catch (err: any) {
      console.error(err);
      showToast(err?.response?.data?.detail || 'Failed to create job posting');
    }
  };

  const handleCreateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateForm.job_posting) {
      showToast('Please select a job position');
      return;
    }
    try {
      await api.createJobApplication({
        ...candidateForm,
        experience_years: Number(candidateForm.experience_years),
        notice_period_days: Number(candidateForm.notice_period_days),
        stage: 'sourced',
        rating: 4,
      });
      emitEvent('recruitment_candidate_added', 'Candidate Sourced', `Candidate "${candidateForm.candidate_name}" added to hiring pipeline`, 'info');
      showToast(`Candidate "${candidateForm.candidate_name}" added to pipeline!`);
      setAddCandidateModal(false);
      setCandidateForm({
        job_posting: '',
        candidate_name: '',
        email: '',
        phone: '',
        experience_years: 3,
        current_company: '',
        current_ctc: '₹6 LPA',
        expected_ctc: '₹9 LPA',
        notice_period_days: 30,
        notes: '',
      });
      loadData();
    } catch (err: any) {
      console.error(err);
      showToast('Failed to add candidate');
    }
  };

  const handleUpdateStage = async (id: string, stage: string) => {
    try {
      await api.updateJobApplicationStage(id, stage);
      emitEvent('candidate_stage_updated', 'Candidate Stage Updated', `Candidate transitioned to stage: ${stage.toUpperCase()}`, 'info');
      showToast(`Candidate stage moved to ${stage.toUpperCase()}`);
      if (selectedCandidate && selectedCandidate.id === id) {
        setSelectedCandidate({ ...selectedCandidate, stage: stage as any });
      }
      loadData();
    } catch (err: any) {
      console.error(err);
      showToast('Failed to update stage');
    }
  };

  // KPIs
  const openPositionsTotal = postings.filter(p => p.status === 'open').reduce((sum, p) => sum + p.positions_count, 0);
  const totalCandidates = applications.length;
  const interviewingCount = applications.filter(a => a.stage === 'interviewing').length;
  const hiredCount = applications.filter(a => a.stage === 'hired' || a.stage === 'offered').length;

  // Filtered applications
  const filteredCandidates = applications.filter(app => {
    const matchesStage = stageFilter === 'all' || app.stage === stageFilter;
    const matchesSearch =
      app.candidate_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.department_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.current_company || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStage && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl transition-all">
          <CheckCircle2 size={18} />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recruitment & Hiring</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage hiring requisitions, candidate pipelines, interview stages, and offer rollouts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAddCandidateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-semibold transition-all shadow-sm"
          >
            <Users size={16} className="text-primary-600" />
            Add Candidate
          </button>
          <button
            onClick={() => setPostJobModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 text-sm font-semibold transition-all shadow-md shadow-primary-500/20"
          >
            <Plus size={16} />
            Post New Job
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Open Positions</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{openPositionsTotal} Roles</p>
            <p className="text-xs text-primary-600 mt-1">{postings.length} Active requisitions</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Briefcase size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Talent Pool</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalCandidates}</p>
            <p className="text-xs text-blue-600 mt-1">Across all pipeline stages</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">In Interviews</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{interviewingCount}</p>
            <p className="text-xs text-amber-600 mt-1">Under evaluation</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Star size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Offers & Hired</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{hiredCount}</p>
            <p className="text-xs text-emerald-600 mt-1">Successful closures</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <UserCheck size={24} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('postings')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'postings'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Job Requisitions ({postings.length})
        </button>
        <button
          onClick={() => setActiveTab('candidates')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'candidates'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Candidate Pipeline ({applications.length})
        </button>
      </div>

      {/* Tab: Job Postings */}
      {activeTab === 'postings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {postings.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-primary-50 text-primary-700 uppercase tracking-wide">
                    {job.department_name}
                  </span>
                  <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 capitalize">
                    {job.status}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-1">{job.title}</h3>
                <p className="text-xs text-gray-400 mb-4">{job.branch_name || 'Headquarters'} • {job.employment_type}</p>

                <div className="space-y-2 text-xs text-gray-600 mb-4">
                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                    <span className="text-gray-400">Target Headcount:</span>
                    <span className="font-bold text-gray-800">{job.positions_count} Openings</span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                    <span className="text-gray-400">Experience Band:</span>
                    <span className="font-bold text-gray-800">{job.experience_required}</span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                    <span className="text-gray-400">Salary Budget:</span>
                    <span className="font-bold text-emerald-700">{job.salary_range}</span>
                  </div>
                </div>

                {job.description && (
                  <p className="text-xs text-gray-500 line-clamp-2 mb-4">
                    {job.description}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-primary-600 font-semibold">
                  {job.applications_count || applications.filter(a => a.job_posting === job.id).length} Applicants
                </span>
                <button
                  onClick={() => {
                    setCandidateForm({ ...candidateForm, job_posting: job.id });
                    setAddCandidateModal(true);
                  }}
                  className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-lg transition-all"
                >
                  <Plus size={14} /> Add Candidate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Candidates Pipeline */}
      {activeTab === 'candidates' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
              {['all', 'sourced', 'screening', 'interviewing', 'offered', 'hired', 'rejected'].map(stage => (
                <button
                  key={stage}
                  onClick={() => setStageFilter(stage)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                    stageFilter === stage
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {stage}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search candidate, role, company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50/80 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                    <th className="py-3 px-4">Candidate</th>
                    <th className="py-3 px-4">Role Applied</th>
                    <th className="py-3 px-4">Current Firm & Exp</th>
                    <th className="py-3 px-4">Notice Period</th>
                    <th className="py-3 px-4">Expected CTC</th>
                    <th className="py-3 px-4">Pipeline Stage</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-400 text-sm">
                        No candidates found matching the filter.
                      </td>
                    </tr>
                  ) : (
                    filteredCandidates.map((cand) => (
                      <tr key={cand.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                              {cand.candidate_name?.[0] || 'C'}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{cand.candidate_name}</p>
                              <p className="text-xs text-gray-400">{cand.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-medium text-gray-900">{cand.job_title}</p>
                          <p className="text-xs text-gray-400">{cand.department_name}</p>
                        </td>
                        <td className="py-3.5 px-4 text-gray-700 text-xs">
                          <p className="font-semibold text-gray-800">{cand.current_company || 'Independent'}</p>
                          <p className="text-gray-500">{cand.experience_years} Years Exp</p>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-medium text-gray-700">
                          {cand.notice_period_days} Days
                        </td>
                        <td className="py-3.5 px-4 text-xs font-bold text-emerald-700">
                          {cand.expected_ctc || 'Negotiable'}
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={cand.stage}
                            onChange={(e) => handleUpdateStage(cand.id, e.target.value)}
                            className="text-xs font-bold px-2.5 py-1 rounded-lg border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
                          >
                            <option value="sourced">Sourced</option>
                            <option value="screening">Screening</option>
                            <option value="interviewing">Interviewing</option>
                            <option value="offered">Offered</option>
                            <option value="hired">Hired</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedCandidate(cand)}
                            className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-all"
                            title="View Candidate Dossier"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Post New Job */}
      <Modal
        isOpen={postJobModal}
        onClose={() => setPostJobModal(false)}
        title="Create Job Requisition"
      >
        <form onSubmit={handleCreateJob} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Job Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Senior Backend Engineer"
              value={jobForm.title}
              onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Department *</label>
              <select
                required
                value={jobForm.department}
                onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">-- Choose Department --</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Positions Count *</label>
              <input
                type="number"
                min="1"
                required
                value={jobForm.positions_count}
                onChange={(e) => setJobForm({ ...jobForm, positions_count: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Experience Required</label>
              <input
                type="text"
                placeholder="e.g. 3-6 Years"
                value={jobForm.experience_required}
                onChange={(e) => setJobForm({ ...jobForm, experience_required: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Salary Range / Budget</label>
              <input
                type="text"
                placeholder="e.g. ₹8,00,000 - ₹14,00,000"
                value={jobForm.salary_range}
                onChange={(e) => setJobForm({ ...jobForm, salary_range: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Job Description & Responsibilities</label>
            <textarea
              rows={3}
              placeholder="Outline role objectives, required skillsets, technologies..."
              value={jobForm.description}
              onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setPostJobModal(false)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-primary-500/20"
            >
              Publish Job
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Candidate */}
      <Modal
        isOpen={addCandidateModal}
        onClose={() => setAddCandidateModal(false)}
        title="Add Candidate to Pipeline"
      >
        <form onSubmit={handleCreateCandidate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Select Job Position *</label>
            <select
              required
              value={candidateForm.job_posting}
              onChange={(e) => setCandidateForm({ ...candidateForm, job_posting: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">-- Choose Job Opening --</option>
              {postings.map(job => (
                <option key={job.id} value={job.id}>
                  {job.title} - {job.department_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Candidate Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Priya Sharma"
                value={candidateForm.candidate_name}
                onChange={(e) => setCandidateForm({ ...candidateForm, candidate_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                placeholder="priya@example.com"
                value={candidateForm.email}
                onChange={(e) => setCandidateForm({ ...candidateForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={candidateForm.phone}
                onChange={(e) => setCandidateForm({ ...candidateForm, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Total Experience (Years)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={candidateForm.experience_years}
                onChange={(e) => setCandidateForm({ ...candidateForm, experience_years: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Current Firm</label>
              <input
                type="text"
                placeholder="e.g. Infosys"
                value={candidateForm.current_company}
                onChange={(e) => setCandidateForm({ ...candidateForm, current_company: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Expected CTC</label>
              <input
                type="text"
                placeholder="e.g. ₹12 LPA"
                value={candidateForm.expected_ctc}
                onChange={(e) => setCandidateForm({ ...candidateForm, expected_ctc: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Notice (Days)</label>
              <input
                type="number"
                min="0"
                value={candidateForm.notice_period_days}
                onChange={(e) => setCandidateForm({ ...candidateForm, notice_period_days: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setAddCandidateModal(false)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-primary-500/20"
            >
              Add to Pipeline
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Candidate Dossier */}
      {selectedCandidate && (
        <Modal
          isOpen={!!selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          title={`Candidate Dossier: ${selectedCandidate.candidate_name}`}
        >
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase">Applied Position</p>
                <p className="text-base font-bold text-gray-900">{selectedCandidate.job_title}</p>
                <p className="text-xs text-gray-500">{selectedCandidate.department_name}</p>
              </div>
              <span className="px-3 py-1 bg-primary-100 text-primary-800 text-xs font-bold rounded-full uppercase">
                {selectedCandidate.stage}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 border border-gray-100 rounded-xl">
                <span className="text-xs text-gray-400 block">Email Address</span>
                <span className="font-semibold text-gray-800">{selectedCandidate.email}</span>
              </div>
              <div className="p-3 border border-gray-100 rounded-xl">
                <span className="text-xs text-gray-400 block">Phone</span>
                <span className="font-semibold text-gray-800">{selectedCandidate.phone || 'N/A'}</span>
              </div>
              <div className="p-3 border border-gray-100 rounded-xl">
                <span className="text-xs text-gray-400 block">Current Employer & Experience</span>
                <span className="font-semibold text-gray-800">{selectedCandidate.current_company || 'N/A'} ({selectedCandidate.experience_years} Yrs)</span>
              </div>
              <div className="p-3 border border-gray-100 rounded-xl">
                <span className="text-xs text-gray-400 block">Notice Period & Expected CTC</span>
                <span className="font-semibold text-emerald-700">{selectedCandidate.notice_period_days} Days • {selectedCandidate.expected_ctc || 'Negotiable'}</span>
              </div>
            </div>

            {selectedCandidate.notes && (
              <div className="p-3 border border-gray-100 rounded-xl text-sm bg-gray-50">
                <span className="text-xs text-gray-400 block font-semibold mb-1">Recruiter Notes:</span>
                <p className="text-gray-700">{selectedCandidate.notes}</p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedCandidate(null)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
