import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Sparkles, 
  FileText, 
  DollarSign, 
  ShieldCheck, 
  Download, 
  CheckCircle2, 
  Building2, 
  GraduationCap, 
  Eye, 
  Clock, 
  Check, 
  RotateCcw, 
  AlertCircle,
  ExternalLink,
  Video 
} from 'lucide-react';
import api, { getFileUrl } from '../services/api';
import DemoDisclaimer from '../components/common/DemoDisclaimer';
import BottomSheet from '../components/common/BottomSheet';
import StatusBadge from '../components/common/StatusBadge';
import GenerateReportModal from '../components/common/GenerateReportModal';
import CategoryFilterBar from '../components/common/CategoryFilterBar';
import { PhotoThumbnailGrid, CitizenAudioPlayer } from '../components/common/MediaViewer';
import ProjectsMap from '../components/common/ProjectsMap';

const IP_TEMPLATES = [
  {
    id: 'public_good',
    title: 'Public Good / Open Innovation Framework',
    split: '100% Dedicated to Public Domain & Local Grassroots Access',
    desc: 'Optimal for drinking water, primary healthcare, and rural livelihoods where unrestricted public welfare access is prioritized over patent commercialization.'
  },
  {
    id: 'joint_ownership',
    title: 'Bilateral Joint Ownership Framework',
    split: '50% University : 50% Industry Partner',
    desc: 'Equal co-ownership of generated patents. Industry partner holds a 24-month first right of refusal for state commercialization.'
  },
  {
    id: 'industry_led',
    title: 'Industry-Sponsored & Tech-Transfer Framework',
    split: '80% Industry Partner : 20% Academic Royalty Perpetuity',
    desc: 'Industry holds primary commercial manufacturing and marketing rights in exchange for 100% project capital expenditure.'
  }
];

const PRESET_AMOUNTS = [
  { label: '₹2,50,000', value: '250000' },
  { label: '₹5,00,000', value: '500000' },
  { label: '₹10,00,000', value: '1000000' },
  { label: '₹25,00,000', value: '2500000' }
];

const IndustryPortal = () => {
  const [proposals, setProposals] = useState([]);
  const [trustScore, setTrustScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredProposals = selectedCategory === 'all'
    ? proposals
    : proposals.filter(p => {
        const cat = p.category || p.challenge?.category;
        return cat && String(cat).toLowerCase() === selectedCategory.toLowerCase();
      });

  // Proposal Detail Modal State
  const [detailProposal, setDetailProposal] = useState(null);

  // Engagement Modal State
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [engagementType, setEngagementType] = useState('funding');
  const [fundingAmount, setFundingAmount] = useState('500000');
  const [notes, setNotes] = useState('');
  const [submittingEngagement, setSubmittingEngagement] = useState(false);

  // IP Agreement Modal State
  const [ipProposal, setIpProposal] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('public_good');
  const [customOverride, setCustomOverride] = useState(false);
  const [customDocUrl, setCustomDocUrl] = useState('');
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState(null);
  const [generatingIp, setGeneratingIp] = useState(false);

  // Milestone Review State
  const [reviewingMilestoneId, setReviewingMilestoneId] = useState(null);
  const [revisionFeedback, setRevisionFeedback] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [matchesRes, trustRes] = await Promise.all([
        api.get('/industry/csr-matches'),
        api.get('/industry/trust-score').catch(() => ({ data: null }))
      ]);
      setProposals(matchesRes.data || []);
      if (trustRes.data) setTrustScore(trustRes.data);
    } catch (err) {
      console.error("Error loading CSR proposals", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEngage = async () => {
    if (!selectedProposal) return;
    setSubmittingEngagement(true);
    try {
      await api.post(`/industry/proposals/${selectedProposal.id}/engage`, {
        engagement_type: engagementType,
        funding_amount: fundingAmount ? parseFloat(fundingAmount) : null,
        notes: notes || 'CSR mandate co-funding allocation.'
      });
      alert("Engagement pledge recorded successfully!");
      setSelectedProposal(null);
      if (detailProposal && detailProposal.id === selectedProposal.id) {
        setDetailProposal(null);
      }
      loadData();
    } catch (err) {
      alert("Error committing engagement: " + (err.response?.data?.detail || err.message));
    } finally {
      setSubmittingEngagement(false);
    }
  };

  const handleGenerateIpAgreement = async () => {
    if (!ipProposal) return;
    setGeneratingIp(true);
    try {
      const res = await api.post(`/industry/proposals/${ipProposal.id}/ip-agreement`, {
        template: selectedTemplate,
        custom_override: customOverride,
        custom_terms_document_url: customOverride ? customDocUrl : null
      });
      setGeneratedPdfUrl(res.data.generated_document_url);
      loadData();
    } catch (err) {
      alert("Error executing IP Agreement: " + (err.response?.data?.detail || err.message));
    } finally {
      setGeneratingIp(false);
    }
  };

  const handleApproveMilestone = async (milestoneId) => {
    setReviewSubmitting(true);
    try {
      const res = await api.patch(`/industry/milestones/${milestoneId}/review`, {
        action: 'approve'
      });
      alert("Milestone approved successfully! University research team notified.");
      if (detailProposal) {
        setDetailProposal(prev => ({
          ...prev,
          milestones: (prev.milestones || []).map(m =>
            m.id === milestoneId
              ? {
                  ...m,
                  industry_review_status: 'approved',
                  status: 'completed',
                  reviewed_by_name: res.data.reviewed_by_name,
                  reviewed_at: res.data.reviewed_at
                }
              : m
          )
        }));
      }
      loadData();
    } catch (err) {
      alert("Error approving milestone: " + (err.response?.data?.detail || err.message));
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleRequestRevision = async (milestoneId) => {
    if (!revisionFeedback.trim()) {
      alert("Please provide feedback describing what needs to change before this milestone can be approved.");
      return;
    }
    setReviewSubmitting(true);
    try {
      const res = await api.patch(`/industry/milestones/${milestoneId}/review`, {
        action: 'request_revision',
        feedback: revisionFeedback.trim()
      });
      alert("Revision requested! Detailed feedback has been sent to the university team and faculty mentor.");
      if (detailProposal) {
        setDetailProposal(prev => ({
          ...prev,
          milestones: (prev.milestones || []).map(m =>
            m.id === milestoneId
              ? {
                  ...m,
                  industry_review_status: 'revision_requested',
                  status: 'in_progress',
                  industry_feedback: revisionFeedback.trim(),
                  reviewed_by_name: res.data.reviewed_by_name,
                  reviewed_at: res.data.reviewed_at
                }
              : m
          )
        }));
      }
      setReviewingMilestoneId(null);
      setRevisionFeedback('');
      loadData();
    } catch (err) {
      alert("Error requesting revision: " + (err.response?.data?.detail || err.message));
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in-up">
      {/* Top Banner */}
      <div className="panel-glass p-6 sm:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-teal uppercase tracking-wider mb-1">
            <Briefcase className="w-4 h-4" />
            <span>Corporate Social Responsibility & Industry R&D</span>
          </div>
          <h1 className="text-2xl font-heading font-extrabold text-white">
            Industry Collaboration Portal
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">
            Browse high-priority academic research proposals, pledge CSR capital grants, and execute standardized intellectual property agreements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {trustScore && (
            <div className="bg-white/[0.05] border border-white/10 px-4 py-2.5 rounded-xl text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Trust Score</span>
              <div className="text-lg font-heading font-black text-white">{trustScore.computed_score}/100</div>
            </div>
          )}

          <button
            onClick={() => setReportModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-navy hover:bg-navy-light text-white text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-float"
          >
            <Download className="w-3.5 h-3.5 text-teal" />
            <span>Generate Report PDF</span>
          </button>
        </div>
      </div>

      {/* Illustrative regional entities demo disclaimer */}
      <DemoDisclaimer />

      {/* Statewide CSR & Research Solutions GIS Map */}
      <ProjectsMap
        mode="all"
        title="Statewide CSR Research & Deployment GIS Map"
        subtitle="Geographic tracking of corporate-sponsored academic pilots, verified field deployments, and high-priority proposals seeking CSR capital across Jharkhand."
      />

      {/* Matched Proposals Feed */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h2 className="text-lg font-heading font-bold text-white flex items-center space-x-2">
              <span>CSR-Matched Solution Proposals ({filteredProposals.length}{selectedCategory !== 'all' ? ` of ${proposals.length}` : ''})</span>
            </h2>
            <p className="text-slate-400 text-xs">
              Click any card to inspect the complete research methodology, student-faculty roster, and original citizen challenge before committing funds.
            </p>
          </div>
        </div>

        {/* Thematic Domain Classification Filter Bar */}
        <CategoryFilterBar
          items={proposals}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          categoryExtractor={(p) => p.category || p.challenge?.category}
        />

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Matching proposals with your CSR focus areas...</div>
        ) : filteredProposals.length === 0 ? (
          <div className="empty-glass text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-green mx-auto" />
            <h3 className="text-sm font-bold text-white">
              {selectedCategory === 'all' ? "No new proposals awaiting CSR matching" : `No proposals found in '${selectedCategory.replace(/_/g, ' ')}'`}
            </h3>
            <p className="text-xs text-slate-500">
              {selectedCategory === 'all' 
                ? "You will be notified as new academic project proposals are submitted." 
                : "Click 'Reset to All' to view proposals across other categories."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredProposals.map(p => (
              <div 
                key={p.id}
                className="card-glass hover:shadow-float-hover transition-all flex flex-col md:flex-row justify-between gap-6"
              >
                {/* Clickable Card Body */}
                <div 
                  onClick={() => setDetailProposal(p)}
                  className="space-y-3 max-w-3xl cursor-pointer flex-1"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-green/15 text-green font-heading font-black text-xs px-2.5 py-1 rounded-md border border-green-border flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-green" />
                      <span>{p.csr_alignment_score}% CSR Alignment</span>
                    </span>

                    <span className="capitalize text-xs font-semibold text-slate-300 bg-white/[0.06] px-2 py-0.5 rounded">
                      {p.category?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      District: {p.district_name}
                    </span>
                    {p.challenge?.tracking_id && (
                      <span className="text-[11px] font-mono text-slate-400">Linked ID: {p.challenge.tracking_id}</span>
                    )}
                  </div>

                  <h3 className="font-heading font-extrabold text-lg text-white hover:text-teal-dark transition-colors">
                    {p.title}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed bg-white/[0.04] p-3 rounded-xl border border-white/10 line-clamp-3">
                    "{p.summary}"
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    <span className="flex items-center space-x-1 font-medium">
                      <GraduationCap className="w-3.5 h-3.5 text-teal" />
                      <span>{p.university_name}</span>
                    </span>
                    {p.faculty_mentor && (
                      <span className="text-slate-300">
                        Lead Mentor: <strong>{p.faculty_mentor}</strong>
                      </span>
                    )}
                    {p.student_members?.length > 0 && (
                      <span className="text-teal-dark font-medium">
                        {p.student_members.length} Student Researchers
                      </span>
                    )}
                  </div>

                  {/* Alignment Reasons */}
                  {p.alignment_reasons && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {p.alignment_reasons.map((r, i) => (
                        <span key={i} className="text-[11px] bg-green/15 text-green border border-green-border px-2 py-0.5 rounded">
                          ✓ {r}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Action Buttons */}
                <div className="flex flex-col justify-center space-y-2.5 min-w-[210px] border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
                  <button
                    onClick={() => setSelectedProposal(p)}
                    className="w-full py-2.5 px-4 rounded-xl bg-navy hover:bg-navy-light text-white font-bold text-xs transition-colors shadow-float flex items-center justify-center space-x-2"
                  >
                    <DollarSign className="w-4 h-4 text-teal" />
                    <span>Pledge Co-Funding</span>
                  </button>

                  <button
                    onClick={() => {
                      setIpProposal(p);
                      setGeneratedPdfUrl(null);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-navy font-bold text-xs border border-white/10 transition-colors flex items-center justify-center space-x-2"
                  >
                    <FileText className="w-4 h-4 text-teal-dark" />
                    <span>Execute IP Framework</span>
                  </button>

                  <button
                    onClick={() => setDetailProposal(p)}
                    className="w-full py-2 px-3 text-center text-xs font-semibold text-slate-400 hover:text-white transition-colors flex items-center justify-center space-x-1"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    <span>View Full Details</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FULL PROPOSAL DETAIL MODAL */}
      {detailProposal && (
        <BottomSheet
          isOpen={Boolean(detailProposal)}
          onClose={() => setDetailProposal(null)}
          title={detailProposal.title}
          subtitle={`Submitted by: ${detailProposal.university_name} • District: ${detailProposal.district_name}`}
          badge={`${detailProposal.csr_alignment_score}% CSR Alignment`}
          icon={Briefcase}
          maxWidth="3xl"
          footer={
            <>
              <button
                type="button"
                onClick={() => setDetailProposal(null)}
                className="px-4 py-2.5 rounded-xl bg-white/[0.06] text-slate-300 text-xs font-bold hover:bg-white/[0.12]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setIpProposal(detailProposal);
                  setGeneratedPdfUrl(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white font-bold text-xs transition-colors flex items-center space-x-1.5 border border-white/10"
              >
                <FileText className="w-3.5 h-3.5 text-teal-dark" />
                <span>Execute IP Framework</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedProposal(detailProposal)}
                className="px-5 py-2.5 rounded-xl bg-navy hover:bg-navy-light text-white font-bold text-xs transition-colors shadow-float flex items-center space-x-1.5"
              >
                <DollarSign className="w-3.5 h-3.5 text-teal" />
                <span>Pledge Co-Funding</span>
              </button>
            </>
          }
        >
          {/* Research Methodology */}
          <div className="space-y-1.5 text-xs">
            <span className="font-bold text-slate-300 uppercase text-[10px] tracking-wider block">Technical Methodology & Solution Architecture:</span>
            <div className="bg-white/[0.04] p-4 rounded-xl border border-white/10 text-slate-200 whitespace-pre-line leading-relaxed font-sans">
              {detailProposal.summary}
            </div>
          </div>

          {/* Research Team */}
          <div className="bg-blue-500/20/50 p-4 rounded-xl border border-blue-100 space-y-2 text-xs">
            <span className="font-bold text-slate-300 uppercase text-[10px] tracking-wider block">Project Research Team:</span>
            <div className="flex flex-col sm:flex-row gap-4">
              <div>
                <span className="text-slate-400 block text-[10px]">Faculty Mentor / PI:</span>
                <span className="font-bold text-white">{detailProposal.faculty_mentor || 'Dr. Department Mentor'}</span>
              </div>
              {detailProposal.student_members?.length > 0 && (
                <div>
                  <span className="text-slate-400 block text-[10px]">Student Researchers:</span>
                  <div className="flex flex-wrap gap-1.5 mt-0.5">
                    {detailProposal.student_members.map((s, idx) => (
                      <span key={idx} className="bg-white/[0.06] px-2 py-0.5 rounded border border-blue-400/40 text-slate-200 font-medium">
                        {s.name} ({s.role})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Linked Challenge with AI brief & media */}
          {detailProposal.challenge && (
            <div className="border border-white/10 rounded-xl p-4 space-y-3 bg-white/[0.04] text-xs">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="font-bold text-slate-300 uppercase text-[10px] tracking-wider flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-teal" />
                  <span>Linked Grassroots Challenge ({detailProposal.challenge.tracking_id})</span>
                </span>
                <span className="text-[10px] text-slate-400">Reporter: {detailProposal.challenge.submitter_credit || 'Citizen'}</span>
              </div>
              <h4 className="font-bold text-white text-sm">{detailProposal.challenge.title}</h4>
              <p className="text-slate-300 leading-relaxed bg-white/[0.06] p-3 rounded-lg border border-white/10">{detailProposal.challenge.description}</p>

              {/* AI Brief */}
              {detailProposal.challenge.ai_generated_brief && (
                <div className="bg-teal/5 p-3 rounded-lg border border-teal/20 space-y-1">
                  <span className="font-bold text-white text-[10px] uppercase tracking-wider flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-teal" />
                    <span>AI Problem Diagnosis & Brief</span>
                  </span>
                  <p className="text-slate-200 leading-relaxed font-sans">{detailProposal.challenge.ai_generated_brief}</p>
                </div>
              )}

              {/* Photos Evidence */}
              {detailProposal.challenge.photo_urls && detailProposal.challenge.photo_urls.length > 0 && (
                <PhotoThumbnailGrid photos={detailProposal.challenge.photo_urls} />
              )}

              {/* Video Evidence */}
              {detailProposal.challenge.video_url && (
                <div className="space-y-1.5 pt-2 border-t border-white/10">
                  <span className="font-bold text-slate-200 block uppercase text-[10px] tracking-wider flex items-center space-x-1.5">
                    <Video className="w-3.5 h-3.5 text-teal" />
                    <span>Citizen Video Evidence:</span>
                  </span>
                  {detailProposal.challenge.video_url.includes('youtube.com') || detailProposal.challenge.video_url.includes('youtu.be') ? (
                    <div className="aspect-video w-full rounded-xl overflow-hidden shadow-float border border-white/10">
                      <iframe
                        src={detailProposal.challenge.video_url.replace('watch?v=', 'embed/')}
                        title="Field Video Evidence"
                        className="w-full h-full"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <video
                      controls
                      src={getFileUrl(detailProposal.challenge.video_url)}
                      className="w-full max-h-72 rounded-xl bg-black shadow-float object-contain"
                    >
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>
              )}

              {/* Voice Note */}
              {detailProposal.challenge.voice_note_url && (
                <div className="pt-2 border-t border-white/10">
                  <CitizenAudioPlayer src={detailProposal.challenge.voice_note_url} label="Citizen Ground Voice Note" />
                </div>
              )}
            </div>
          )}

          {/* Milestones & Review */}
          <div className="space-y-3 text-xs border border-white/10 rounded-xl p-4 bg-white/[0.04]/60">
            <span className="font-bold text-slate-300 uppercase text-[11px] tracking-wider flex items-center space-x-1.5 border-b border-white/10 pb-2">
              <CheckCircle2 className="w-4 h-4 text-teal" />
              <span>Milestones & Deliverables ({detailProposal.milestones?.length || 0})</span>
            </span>

            {detailProposal.milestones && detailProposal.milestones.length > 0 ? (
              <div className="space-y-3 pt-1">
                {detailProposal.milestones.map(m => {
                  const isPendingReview = m.industry_review_status === 'pending_review';
                  const isApproved = m.industry_review_status === 'approved';
                  const isRevisionRequested = m.industry_review_status === 'revision_requested';

                  return (
                    <div key={m.id} className="card-glass p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-heading font-bold text-white text-sm">{m.title}</span>
                            <StatusBadge status={m.status} />
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">{m.description}</p>
                          {m.due_date && (
                            <div className="text-[11px] text-slate-400 flex items-center space-x-1 pt-0.5">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>Target Due: {new Date(m.due_date).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>

                        <div className="shrink-0 flex flex-col sm:items-end">
                          <StatusBadge status={m.industry_review_status} />
                        </div>
                      </div>

                      {/* Evidence Link */}
                      {m.evidence_url && (
                        <div className="bg-white/[0.04] rounded-lg p-2.5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center space-x-2 text-xs truncate">
                            <FileText className="w-4 h-4 text-teal shrink-0" />
                            <span className="font-bold text-slate-200">Submitted Deliverable:</span>
                            <span className="text-slate-400 truncate max-w-sm">{m.evidence_url}</span>
                          </div>
                          <a
                            href={m.evidence_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-navy hover:bg-navy-light text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors shrink-0 shadow-xs"
                          >
                            <span>Inspect Evidence</span>
                            <ExternalLink className="w-3 h-3 text-teal" />
                          </a>
                        </div>
                      )}

                      {/* Review feedback history */}
                      {isApproved && (
                        <div className="bg-green/15 border border-green-border rounded-lg p-2.5 text-xs text-green-300 space-y-1">
                          <div className="flex items-center space-x-1.5 font-bold">
                            <Check className="w-3.5 h-3.5 text-green" />
                            <span>Approved by {m.reviewed_by_name || 'Industry Partner'}</span>
                          </div>
                        </div>
                      )}

                      {isRevisionRequested && (
                        <div className="bg-amber-light border border-amber-border rounded-lg p-3 text-xs text-amber-200 space-y-1.5">
                          <div className="flex items-center space-x-1.5 font-bold text-amber-200">
                            <AlertCircle className="w-3.5 h-3.5 text-amber" />
                            <span>Feedback Sent by {m.reviewed_by_name || 'Industry Partner'}</span>
                          </div>
                          <div className="bg-white/[0.06] p-2.5 rounded-lg border border-amber-border text-amber-200 font-medium whitespace-pre-line leading-relaxed">
                            "{m.industry_feedback || 'Please revise submitted deliverables according to project specifications.'}"
                          </div>
                        </div>
                      )}

                      {/* Review action buttons for Pending Review */}
                      {isPendingReview && (
                        <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setReviewingMilestoneId(reviewingMilestoneId === m.id ? null : m.id);
                              setRevisionFeedback('');
                            }}
                            disabled={reviewSubmitting}
                            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors shadow-float flex items-center justify-center space-x-1.5 disabled:opacity-50"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Request Revision</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApproveMilestone(m.id)}
                            disabled={reviewSubmitting}
                            className="px-4 py-2 rounded-xl bg-green hover:opacity-90 text-white font-bold text-xs transition-colors shadow-float flex items-center justify-center space-x-1.5 disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5 text-white" />
                            <span>Approve Milestone</span>
                          </button>
                        </div>
                      )}

                      {/* Revision Feedback Drawer */}
                      {isPendingReview && reviewingMilestoneId === m.id && (
                        <div className="bg-amber-light p-3.5 rounded-xl border border-amber-border space-y-2.5">
                          <label className="block text-xs font-bold text-amber-200 uppercase tracking-wider">
                            What needs to change before this can be approved? *
                          </label>
                          <textarea
                            rows={3}
                            value={revisionFeedback}
                            onChange={e => setRevisionFeedback(e.target.value)}
                            placeholder="Specify technical adjustments, missing test certificates, or revised experimental runs needed..."
                            className="w-full p-2.5 text-xs rounded-xl border border-amber-border focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white/[0.06]"
                          />
                          <div className="flex justify-end space-x-2">
                            <button
                              type="button"
                              onClick={() => {
                                setReviewingMilestoneId(null);
                                setRevisionFeedback('');
                              }}
                              className="px-3 py-1.5 bg-white/[0.06] border border-white/10 text-slate-300 rounded-lg text-xs font-semibold hover:bg-white/[0.04]"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={reviewSubmitting || !revisionFeedback.trim()}
                              onClick={() => handleRequestRevision(m.id)}
                              className="px-4 py-1.5 bg-amber hover:bg-amber-pending text-navy rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                            >
                              <span>{reviewSubmitting ? 'Submitting...' : 'Submit Revision Request'}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-slate-400 text-xs italic py-2">No milestones defined for this proposal yet.</p>
            )}
          </div>
        </BottomSheet>
      )}

      {/* PLEDGE CO-FUNDING MODAL */}
      {selectedProposal && (
        <BottomSheet
          isOpen={Boolean(selectedProposal)}
          onClose={() => setSelectedProposal(null)}
          title="Pledge CSR Co-Funding Allocation"
          subtitle={`${selectedProposal.title} • Executing HEI: ${selectedProposal.university_name}`}
          badge="CSR Sanction"
          icon={DollarSign}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Engagement Mechanism *
              </label>
              <select
                value={engagementType}
                onChange={e => setEngagementType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-white/15 text-xs focus:outline-none focus:ring-2 focus:ring-teal"
              >
                <option value="funding">CSR Grant / Direct Project Capital Funding</option>
                <option value="equipment">Laboratory Equipment & Hardware Sponsorship</option>
                <option value="pilot_site">Industrial Field Trial Site Access & Logistics</option>
                <option value="mentorship">Technical Mentorship & Industrial Data Access</option>
              </select>
            </div>

            {engagementType === 'funding' && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Grant Allocation Amount (INR ₹) *
                </label>
                <input
                  type="number"
                  value={fundingAmount}
                  onChange={e => setFundingAmount(e.target.value)}
                  placeholder="e.g. 500000"
                  className="w-full px-3 py-2 rounded-xl border border-white/15 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal"
                />

                {/* Preset INR Chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {PRESET_AMOUNTS.map(preset => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setFundingAmount(preset.value)}
                      className={`px-3 py-1 rounded-lg border text-xs font-mono font-bold transition-all ${
                        fundingAmount === preset.value
                          ? 'bg-navy text-white border-navy shadow-xs'
                          : 'bg-white/[0.04] text-slate-200 border-white/10 hover:bg-white/[0.06]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                CSR Mandate Reference Notes & Conditions
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Specify focus block, quarterly tranche release conditions, or corporate oversight expectations..."
                className="w-full px-3 py-2 rounded-xl border border-white/15 text-xs focus:outline-none focus:ring-2 focus:ring-teal"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setSelectedProposal(null)}
                className="px-4 py-2 rounded-xl bg-white/[0.06] text-slate-300 text-xs font-semibold hover:bg-white/[0.12]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingEngagement}
                onClick={handleEngage}
                className="px-5 py-2.5 rounded-xl bg-teal text-navy font-bold text-xs hover:bg-teal-hover transition-all shadow-float flex items-center space-x-1.5 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submittingEngagement ? 'Sanctioning...' : 'Sanction CSR Pledge'}</span>
              </button>
            </div>
          </div>
        </BottomSheet>
      )}

      {/* IP AGREEMENT MODAL */}
      {ipProposal && (
        <BottomSheet
          isOpen={Boolean(ipProposal)}
          onClose={() => {
            setIpProposal(null);
            setGeneratedPdfUrl(null);
          }}
          title="Execute Standardized IP Framework"
          subtitle={`${ipProposal.title} • Partner: ${ipProposal.university_name}`}
          badge="Intellectual Property"
          icon={FileText}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            {generatedPdfUrl ? (
              <div className="bg-green/15 border border-green-border rounded-xl p-6 text-center space-y-4">
                <CheckCircle2 className="w-12 h-12 text-green mx-auto" />
                <div>
                  <h4 className="font-heading font-bold text-base text-green">Official Agreement Generated!</h4>
                  <p className="text-xs text-slate-300 mt-1">
                    The bilateral IP framework has been compiled and stamped. Download your copy below.
                  </p>
                </div>
                <a
                  href={getFileUrl(generatedPdfUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-teal text-navy font-bold text-xs hover:bg-teal-hover transition-colors shadow-float"
                >
                  <Download className="w-4 h-4 text-navy" />
                  <span>Download Agreement PDF</span>
                </a>
              </div>
            ) : (
              <>
                <p className="text-slate-300">
                  Select one of Jharkhand’s three standardized Intellectual Property frameworks to legally protect academic discoveries and corporate investments:
                </p>

                <div className="space-y-3">
                  {IP_TEMPLATES.map(t => (
                    <label
                      key={t.id}
                      className={`block p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedTemplate === t.id
                          ? 'border-teal bg-teal/5 shadow-xs ring-1 ring-teal'
                          : 'border-white/10 bg-white/[0.06] hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <input
                          type="radio"
                          name="ip_template"
                          checked={selectedTemplate === t.id}
                          onChange={() => setSelectedTemplate(t.id)}
                          className="mt-1 text-teal focus:ring-teal"
                        />
                        <div className="space-y-1">
                          <div className="font-heading font-bold text-white text-sm">{t.title}</div>
                          <div className="text-[11px] font-bold text-teal-dark">{t.split}</div>
                          <p className="text-slate-400 text-xs leading-relaxed">{t.desc}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIpProposal(null)}
                    className="px-4 py-2 rounded-xl bg-white/[0.06] text-slate-300 text-xs font-semibold hover:bg-white/[0.12]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={generatingIp}
                    onClick={handleGenerateIpAgreement}
                    className="px-5 py-2.5 rounded-xl bg-navy hover:bg-navy-light text-white font-bold text-xs transition-colors shadow-float flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4 text-teal" />
                    <span>{generatingIp ? 'Compiling Official PDF...' : 'Generate Official Agreement PDF'}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </BottomSheet>
      )}

      {/* Reusable Generate Report Modal */}
      <GenerateReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        portalRole="Industry & CSR Portal"
      />
    </div>
  );
};

export default IndustryPortal;
