import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  Sparkles, 
  Users, 
  Send, 
  FileText, 
  CheckCircle2, 
  ShieldCheck, 
  MapPin, 
  Clock, 
  Plus, 
  AlertCircle, 
  Download, 
  Eye, 
  Check, 
  X, 
  RotateCcw, 
  ExternalLink, 
  Upload,
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

const UniversityPortal = () => {
  const [matches, setMatches] = useState([]);
  const [facultyMembers, setFacultyMembers] = useState([]);
  const [trustScore, setTrustScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredMatches = selectedCategory === 'all'
    ? matches
    : matches.filter(m => {
        const cat = m.challenge?.category;
        return cat && String(cat).toLowerCase() === selectedCategory.toLowerCase();
      });

  // Modals state
  const [detailModalItem, setDetailModalItem] = useState(null);
  const [teamModalItem, setTeamModalItem] = useState(null);
  const [proposalModalItem, setProposalModalItem] = useState(null);
  const [viewProposalItem, setViewProposalItem] = useState(null);

  // Team Formation form state
  const [facultyMentorId, setFacultyMentorId] = useState('');
  const [students, setStudents] = useState([
    { name: '', role: 'Lead Student Researcher', email: '' }
  ]);
  const [teamSubmitting, setTeamSubmitting] = useState(false);

  // Proposal form state
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalSummary, setProposalSummary] = useState('');
  const [proposalSubmitting, setProposalSubmitting] = useState(false);

  // Milestone completion & evidence submission state
  const [completingMilestoneId, setCompletingMilestoneId] = useState(null);
  const [milestoneEvidenceUrl, setMilestoneEvidenceUrl] = useState('');
  const [milestoneSubmitting, setMilestoneSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [matchesRes, trustRes, profileRes] = await Promise.all([
        api.get('/university/challenges'),
        api.get('/university/trust-score').catch(() => ({ data: null })),
        api.get('/university/profile').catch(() => ({ data: null }))
      ]);

      if (matchesRes.data) {
        if (Array.isArray(matchesRes.data)) {
          setMatches(matchesRes.data);
        } else {
          setMatches(matchesRes.data.matches || []);
          setFacultyMembers(matchesRes.data.faculty_members || []);
        }
      }

      if (trustRes.data) setTrustScore(trustRes.data);
      if (profileRes.data) setProfile(profileRes.data);
    } catch (err) {
      console.error("Failed to load university portal data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddStudent = () => {
    setStudents([...students, { name: '', role: 'Research Associate', email: '' }]);
  };

  const handleStudentChange = (index, field, value) => {
    const updated = [...students];
    updated[index][field] = value;
    setStudents(updated);
  };

  // Step 1: Accept Match
  const handleAcceptMatch = async (matchId) => {
    try {
      await api.post(`/university/matches/${matchId}/accept`);
      loadData();
      if (detailModalItem && detailModalItem.match_id === matchId) {
        setDetailModalItem(prev => prev ? { ...prev, status: 'accepted' } : null);
      }
    } catch (err) {
      alert("Error accepting match: " + (err.response?.data?.detail || err.message));
    }
  };

  // Step 1: Decline Match
  const handleDeclineMatch = async (matchId) => {
    if (!window.confirm("Are you sure you want to decline this research match?")) return;
    try {
      await api.post(`/university/matches/${matchId}/decline`);
      loadData();
      if (detailModalItem) setDetailModalItem(null);
    } catch (err) {
      alert("Error declining match: " + (err.response?.data?.detail || err.message));
    }
  };

  // Step 2: Form Project Team
  const handleFormTeamSubmit = async (e) => {
    e.preventDefault();
    if (!teamModalItem) return;
    setTeamSubmitting(true);
    try {
      const payload = {
        faculty_mentor_id: facultyMentorId ? parseInt(facultyMentorId) : null,
        student_members: students.filter(s => s.name.trim() !== '')
      };
      await api.post(`/university/challenges/${teamModalItem.challenge.id}/team`, payload);
      setTeamModalItem(null);
      setFacultyMentorId('');
      setStudents([{ name: '', role: 'Lead Student Researcher', email: '' }]);
      loadData();
    } catch (err) {
      alert("Error forming project team: " + (err.response?.data?.detail || err.message));
    } finally {
      setTeamSubmitting(false);
    }
  };

  // Step 3: Submit Proposal (plain success, no crypto theater)
  const handleProposalSubmit = async (e) => {
    e.preventDefault();
    if (!proposalModalItem?.team?.id) return;
    setProposalSubmitting(true);
    try {
      await api.post(`/university/teams/${proposalModalItem.team.id}/proposals`, {
        title: proposalTitle,
        summary: proposalSummary
      });
      setProposalModalItem(null);
      setProposalTitle('');
      setProposalSummary('');
      loadData();
    } catch (err) {
      alert("Error submitting proposal: " + (err.response?.data?.detail || err.message));
    } finally {
      setProposalSubmitting(false);
    }
  };

  const handleCompleteMilestone = async (milestoneId) => {
    if (!milestoneEvidenceUrl.trim()) {
      alert("Please provide a valid evidence URL (e.g. lab report or field deployment photo link).");
      return;
    }
    setMilestoneSubmitting(true);
    try {
      await api.patch(`/university/milestones/${milestoneId}/complete`, {
        evidence_url: milestoneEvidenceUrl.trim()
      });
      alert("Milestone submitted for industry review! Linked CSR partners have been notified.");
      if (viewProposalItem) {
        setViewProposalItem(prev => ({
          ...prev,
          milestones: (prev.milestones || []).map(m =>
            m.id === milestoneId
              ? {
                  ...m,
                  status: 'completed',
                  evidence_url: milestoneEvidenceUrl.trim(),
                  industry_review_status: 'pending_review',
                  industry_feedback: null
                }
              : m
          )
        }));
      }
      setCompletingMilestoneId(null);
      setMilestoneEvidenceUrl('');
      loadData();
    } catch (err) {
      alert("Error submitting milestone: " + (err.response?.data?.detail || err.message));
    } finally {
      setMilestoneSubmitting(false);
    }
  };

  const availableFaculty = facultyMembers.length > 0 
    ? facultyMembers 
    : (profile?.departments?.flatMap(d => d.faculty_profiles || []) || []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in-up">
      {/* Top Banner */}
      <div className="panel-glass p-6 sm:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-extrabold text-teal uppercase tracking-wider mb-1">
            <GraduationCap className="w-4 h-4" />
            <span>Academic Research & Innovation Cell</span>
          </div>
          <h1 className="text-2xl font-heading font-extrabold text-white">
            {profile?.name || 'University Research Portal'}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">
            Review algorithmic societal problem matches, mobilize faculty-student project teams, and submit CSR proposals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {trustScore && (
            <div className="stat-glass px-4 py-2.5 rounded-xl text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Trust Score</span>
              <div className="text-lg font-heading font-black text-white">{trustScore.computed_score}/100</div>
            </div>
          )}

          {profile && (
            <Link
              to="/university/profile"
              className="bg-green/15 hover:bg-green/15/80 border border-green-border px-4 py-2.5 rounded-xl text-right transition-colors"
              title="Verified profiles are prioritized in matching"
            >
              <span className="text-[10px] uppercase font-bold text-green block">Profile Completeness</span>
              <div className="text-lg font-heading font-black text-green">{Math.round(profile.profile_completeness_score || 70)}%</div>
            </Link>
          )}

          {/* Reusable Report Export Modal Trigger */}
          <button
            onClick={() => setReportModalOpen(true)}
            className="px-4 py-2.5 rounded-lg bg-[#132847] hover:bg-[#1A365D] border border-slate-700 text-white text-xs font-bold flex items-center space-x-2 transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-teal" />
            <span>Generate Report PDF</span>
          </button>
        </div>
      </div>

      {/* Profile Verification Nudge Banner */}
      {profile && (profile.profile_completeness_score < 100) && (
        <div className="bg-gradient-to-r from-green-light via-teal/10 to-transparent border border-green-border rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-4 h-4 text-green flex-shrink-0" />
            <span className="text-slate-200">
              <strong className="text-teal">Routing Prioritization:</strong> Verified profiles are prioritized in algorithmic challenge matching. Review and verify your department expertise tags to raise your institutional match rank.
            </span>
          </div>
          <Link
            to="/university/profile"
            className="px-3 py-1.5 rounded-lg bg-green text-white font-bold text-xs whitespace-nowrap shadow-float hover:opacity-90 transition-opacity"
          >
            Review & Verify Tags
          </Link>
        </div>
      )}

      {/* Illustrative regional entities demo disclaimer */}
      <DemoDisclaimer />

      {/* University Institutional GIS Deployment Map (Scoped to this University) */}
      <ProjectsMap
        mode="university"
        filterUniversityId={profile?.id}
        filterUniversityName={profile?.name}
        title={`Campus R&D Deployments Map — ${profile?.name || 'Your University'}`}
        subtitle="Displaying only active research deployments, verified working solutions, and field projects allocated to and solved by your university faculty & student researchers."
      />

      {/* Matched Challenges Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h2 className="text-lg font-heading font-extrabold text-white flex items-center space-x-2">
              <span>AI Matched Challenges Inbox ({filteredMatches.length}{selectedCategory !== 'all' ? ` of ${matches.length}` : ''})</span>
            </h2>
            <p className="text-slate-400 text-xs">
              Click on any challenge card to view AI brief, ground photos/videos, and proceed through sequential stage-gates: Accept Match → Form Team → Submit Proposal.
            </p>
          </div>
        </div>

        {/* Thematic Domain Classification Filter Bar */}
        <CategoryFilterBar
          items={matches}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          categoryExtractor={(m) => m.challenge?.category}
        />

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Loading matched challenges...</div>
        ) : filteredMatches.length === 0 ? (
          <div className="empty-glass text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-green mx-auto" />
            <h3 className="text-sm font-bold text-white">
              {selectedCategory === 'all' ? "No pending matches in inbox" : `No matches found in '${selectedCategory.replace(/_/g, ' ')}'`}
            </h3>
            <p className="text-xs text-slate-500">
              {selectedCategory === 'all' 
                ? "Your university will be notified as new district challenges are validated." 
                : "Click 'Reset to All' to view matched challenges across other categories."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMatches.map(m => {
              const ch = m.challenge;
              const isDeclined = m.status === 'declined';
              const isPending = m.status === 'suggested' || m.status === 'pending';
              const isAccepted = m.status === 'accepted';
              const hasTeam = Boolean(m.team);
              const hasProposal = Boolean(m.proposal);

              return (
                <div 
                  key={m.match_id}
                  className="card-glass hover:shadow-float-hover transition-all flex flex-col md:flex-row justify-between gap-6 relative"
                >
                  {/* Clickable Card Body: Opens Detail Modal */}
                  <div 
                    onClick={() => setDetailModalItem(m)}
                    className="space-y-3 max-w-3xl cursor-pointer flex-1"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-teal/20 text-teal-dark font-heading font-black text-xs px-2.5 py-1 rounded-md border border-teal/40 flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 text-teal" />
                        <span>{m.match_score}% Match</span>
                      </span>

                      <span className="text-[11px] font-mono text-slate-400 font-semibold">{ch.tracking_id}</span>
                      <span className="capitalize text-xs font-semibold text-slate-300 bg-white/[0.06] px-2 py-0.5 rounded">
                        {ch.category?.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{ch.district_name}</span>
                      </span>
                    </div>

                    <h3 className="font-heading font-bold text-base text-white hover:text-teal-dark transition-colors">
                      {ch.title}
                    </h3>

                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                      {ch.description}
                    </p>

                    {/* Match Reasons Factors */}
                    {m.match_reasons?.factors && (
                      <div className="bg-white/[0.04] p-2.5 rounded-lg border border-white/10 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Matching Factors:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {m.match_reasons.factors.map((f, i) => (
                            <span key={i} className="text-[11px] bg-white/[0.06] border border-white/10 px-2 py-0.5 rounded text-slate-200">
                              ✓ {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Action Column */}
                  <div className="flex flex-col justify-center items-end min-w-[240px] border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6 space-y-3">
                    {/* Step 1: Pending Match */}
                    {isPending && (
                      <div className="w-full space-y-2 text-right">
                        <span className="inline-block px-2.5 py-1 rounded-full bg-amber/15 text-amber border border-amber-border text-[10px] font-bold">
                          Step 1: Match Review
                        </span>
                        <div className="flex flex-col sm:flex-row gap-2 justify-end w-full">
                          <button
                            onClick={() => handleDeclineMatch(m.match_id)}
                            className="px-3 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/[0.04] text-xs font-bold transition-colors"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => handleAcceptMatch(m.match_id)}
                            className="px-4 py-2 rounded-xl bg-navy hover:bg-navy-light text-white text-xs font-bold transition-colors shadow-float flex items-center justify-center space-x-1.5"
                          >
                            <Check className="w-3.5 h-3.5 text-teal" />
                            <span>Accept Match</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Accepted, No Team Yet */}
                    {isAccepted && !hasTeam && (
                      <div className="w-full space-y-2 text-right">
                        <span className="inline-block px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-400/40 text-[10px] font-bold">
                          Step 2: Team Mobilization
                        </span>
                        <button
                          onClick={() => {
                            setTeamModalItem(m);
                            setFacultyMentorId('');
                            setStudents([{ name: '', role: 'Lead Student Researcher', email: '' }]);
                          }}
                          className="w-full px-4 py-2.5 rounded-xl bg-teal hover:bg-teal-hover text-navy font-bold text-xs transition-colors shadow-float flex items-center justify-center space-x-2"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Form Project Team</span>
                        </button>
                      </div>
                    )}

                    {/* Step 3: Team Formed, No Proposal Submitted Yet */}
                    {isAccepted && hasTeam && !hasProposal && (
                      <div className="w-full space-y-2 text-right">
                        <div className="text-[11px] text-slate-500">
                          Mentor: <strong className="text-white">{m.team.faculty_mentor_name || 'Assigned'}</strong>
                          <div className="text-[10px] text-teal-dark">{m.team.student_members?.length || 0} Student Researchers</div>
                        </div>
                        <button
                          onClick={() => {
                            setProposalModalItem(m);
                            setProposalTitle(`Societal Innovation Proposal: ${ch.title}`);
                            setProposalSummary('');
                          }}
                          className="w-full px-4 py-2.5 rounded-xl bg-navy hover:bg-navy-light text-white font-bold text-xs transition-colors shadow-float flex items-center justify-center space-x-2"
                        >
                          <FileText className="w-3.5 h-3.5 text-teal" />
                          <span>Submit Proposal</span>
                        </button>
                      </div>
                    )}

                    {/* Step 4: Proposal Submitted */}
                    {isAccepted && hasTeam && hasProposal && (
                      <div className="w-full space-y-2 text-right">
                        <StatusBadge 
                          status={
                            m.proposal?.milestones?.some(ms => ms.industry_review_status === 'revision_requested')
                              ? 'revision_requested'
                              : m.proposal?.milestones?.some(ms => ms.industry_review_status === 'pending_review')
                              ? 'pending_review'
                              : 'proposal_submitted'
                          } 
                        />
                        <div>
                          <button
                            onClick={() => setViewProposalItem(m.proposal)}
                            className="text-xs text-teal font-bold hover:underline inline-flex items-center space-x-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Proposal & Milestones ({m.proposal.milestones?.length || 0})</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Declined */}
                    {isDeclined && (
                      <div className="text-right">
                        <span className="px-3 py-1.5 rounded-xl bg-white/[0.06] text-slate-400 text-xs font-bold">
                          Match Declined
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {detailModalItem && (
        <BottomSheet
          isOpen={Boolean(detailModalItem)}
          onClose={() => setDetailModalItem(null)}
          title={detailModalItem.challenge.title}
          subtitle={`District: ${detailModalItem.challenge.district_name} • Tracking ID: ${detailModalItem.challenge.tracking_id}`}
          badge={`${detailModalItem.match_score}% AI Match Score`}
          icon={GraduationCap}
          maxWidth="2xl"
          footer={
            <>
              <button
                type="button"
                onClick={() => setDetailModalItem(null)}
                className="px-4 py-2 rounded-xl bg-white/[0.06] text-slate-300 text-xs font-semibold hover:bg-white/[0.12]"
              >
                Close
              </button>
              {(detailModalItem.status === 'suggested' || detailModalItem.status === 'pending') && (
                <button
                  type="button"
                  onClick={() => {
                    handleAcceptMatch(detailModalItem.match_id);
                    setDetailModalItem(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-navy hover:bg-navy-light text-white text-xs font-bold shadow-float"
                >
                  Accept Match
                </button>
              )}
            </>
          }
        >
          {/* Structured AI Brief */}
          {detailModalItem.challenge.ai_generated_brief && (
            <div className="bg-teal/5 p-4 rounded-xl border border-teal/20 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white block uppercase text-[10px] tracking-wider flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal" />
                  <span>AI Problem Brief & Societal Diagnosis:</span>
                </span>
                {detailModalItem.challenge.ai_confidence_score && (
                  <span className="bg-teal/20 text-teal-dark px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                    Confidence: {(detailModalItem.challenge.ai_confidence_score * 100).toFixed(0)}%
                  </span>
                )}
              </div>
              <p className="text-slate-100 text-xs sm:text-sm leading-relaxed font-sans bg-white/[0.06] backdrop-blur-md p-3.5 rounded-xl border border-teal/30">{detailModalItem.challenge.ai_generated_brief}</p>
            </div>
          )}

          {/* Full Field Description */}
          <div className="space-y-1 text-xs">
            <span className="font-bold text-slate-200 block uppercase text-[10px] tracking-wider">Citizen Field Statement:</span>
            <p className="text-slate-300 leading-relaxed bg-white/[0.04] p-4 rounded-xl border border-white/10 whitespace-pre-line">
              {detailModalItem.challenge.description}
            </p>
          </div>

          {/* Photos Evidence with Lightbox */}
          {detailModalItem.challenge.photo_urls && detailModalItem.challenge.photo_urls.length > 0 && (
            <PhotoThumbnailGrid photos={detailModalItem.challenge.photo_urls} />
          )}

          {/* Video Evidence */}
          {detailModalItem.challenge.video_url && (
            <div className="space-y-2 pt-2 border-t border-white/10">
              <span className="font-bold text-slate-200 block uppercase text-[10px] tracking-wider flex items-center space-x-1.5">
                <Video className="w-3.5 h-3.5 text-teal" />
                <span>Field Video Evidence:</span>
              </span>
              {detailModalItem.challenge.video_url.includes('youtube.com') || detailModalItem.challenge.video_url.includes('youtu.be') ? (
                <div className="aspect-video w-full rounded-xl overflow-hidden shadow-float border border-white/10">
                  <iframe
                    src={detailModalItem.challenge.video_url.replace('watch?v=', 'embed/')}
                    title="Field Video Evidence"
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
              ) : (
                <video
                  controls
                  src={getFileUrl(detailModalItem.challenge.video_url)}
                  className="w-full max-h-72 rounded-xl bg-black shadow-float object-contain"
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          )}

          {/* Voice Note Audio Player */}
          {detailModalItem.challenge.voice_note_url && (
            <div className="pt-2 border-t border-white/10">
              <CitizenAudioPlayer src={detailModalItem.challenge.voice_note_url} label="Citizen Ground Voice Note" />
            </div>
          )}

          {/* Matching Rationale */}
          {detailModalItem.match_reasons?.factors && (
            <div className="bg-white/[0.04] p-4 rounded-xl border border-white/10 space-y-2 text-xs">
              <span className="font-bold text-white block uppercase text-[10px] tracking-wider">Why Your Institution Matched:</span>
              <ul className="space-y-1 text-slate-300">
                {detailModalItem.match_reasons.factors.map((factor, i) => (
                  <li key={i} className="flex items-center space-x-2">
                    <span className="text-teal font-bold">✓</span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </BottomSheet>
      )}

      {/* TEAM FORMATION MODAL (Step 2) */}
      {teamModalItem && (
        <BottomSheet
          isOpen={Boolean(teamModalItem)}
          onClose={() => setTeamModalItem(null)}
          title="Mobilize Project Research Team"
          subtitle={teamModalItem.challenge.title}
          badge="Step 2: Team Formation"
          icon={Users}
          maxWidth="2xl"
        >
          <form onSubmit={handleFormTeamSubmit} className="space-y-6 text-xs">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Assign Faculty Mentor / Principal Investigator *
              </label>
              <select
                required
                value={facultyMentorId}
                onChange={e => setFacultyMentorId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-white/15 text-xs focus:outline-none focus:ring-2 focus:ring-teal"
              >
                <option value="">Select Faculty Member</option>
                {availableFaculty.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name} {f.department_name ? `(${f.department_name})` : ''} {f.expertise_tags ? `— ${f.expertise_tags.slice(0, 2).join(', ')}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Student Researchers & Roles
                </label>
                <button
                  type="button"
                  onClick={handleAddStudent}
                  className="text-xs text-teal font-semibold hover:underline flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Student</span>
                </button>
              </div>

              {students.map((student, idx) => (
                <div key={idx} className="grid grid-cols-3 gap-2 p-2.5 rounded-xl stat-glass">
                  <input
                    type="text"
                    placeholder="Student Name"
                    required
                    value={student.name}
                    onChange={e => handleStudentChange(idx, 'name', e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-white/15 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Role (e.g. Lead Prototyping)"
                    value={student.role}
                    onChange={e => handleStudentChange(idx, 'role', e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-white/15 text-xs"
                  />
                  <input
                    type="email"
                    placeholder="Institutional Email"
                    value={student.email}
                    onChange={e => handleStudentChange(idx, 'email', e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-white/15 text-xs font-mono"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700/60">
              <button
                type="button"
                onClick={() => setTeamModalItem(null)}
                className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-white/10 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={teamSubmitting}
                className="px-5 py-2.5 rounded-lg bg-teal hover:bg-teal-hover text-navy text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Users className="w-3.5 h-3.5 text-navy" />
                <span>{teamSubmitting ? 'Registering Team...' : 'Confirm Team & Proceed'}</span>
              </button>
            </div>
          </form>
        </BottomSheet>
      )}

      {/* PROPOSAL EDITOR MODAL (Step 3 - Clean success, no crypto sealing) */}
      {proposalModalItem && (
        <BottomSheet
          isOpen={Boolean(proposalModalItem)}
          onClose={() => setProposalModalItem(null)}
          title="Submit Technical Innovation Proposal"
          subtitle={proposalModalItem.challenge.title}
          badge="Step 3: Proposal Submission"
          icon={FileText}
          maxWidth="2xl"
        >
          <form onSubmit={handleProposalSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Proposal Title *
              </label>
              <input
                type="text"
                required
                value={proposalTitle}
                onChange={e => setProposalTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-white/15 text-xs focus:outline-none focus:ring-2 focus:ring-teal"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Research Methodology, Deliverables & Budget Overview *
              </label>
              <textarea
                required
                rows={6}
                value={proposalSummary}
                onChange={e => setProposalSummary(e.target.value)}
                placeholder="Detail scientific approach, laboratory trials, pilot milestones, budget outline, and expected community impact..."
                className="w-full px-3 py-2 rounded-xl border border-white/15 text-xs focus:outline-none focus:ring-2 focus:ring-teal resize-none leading-relaxed"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setProposalModalItem(null)}
                className="px-4 py-2 rounded-xl bg-white/[0.06] text-slate-300 text-xs font-semibold hover:bg-white/[0.12]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={proposalSubmitting}
                className="px-5 py-2.5 rounded-xl bg-teal text-navy font-bold text-xs hover:bg-teal-hover transition-all shadow-float flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{proposalSubmitting ? 'Publishing...' : 'Publish to CSR Feed'}</span>
              </button>
            </div>
          </form>
        </BottomSheet>
      )}

      {/* VIEW PROPOSAL & MILESTONES REVIEW QUEUE */}
      {viewProposalItem && (
        <BottomSheet
          isOpen={Boolean(viewProposalItem)}
          onClose={() => {
            setViewProposalItem(null);
            setCompletingMilestoneId(null);
            setMilestoneEvidenceUrl('');
          }}
          title={viewProposalItem.title}
          subtitle={`Proposal #${viewProposalItem.id} • Status: ${viewProposalItem.status?.replace(/_/g, ' ')}`}
          badge="Milestone Deliverables"
          icon={CheckCircle2}
          maxWidth="3xl"
        >
          <div className="space-y-4 text-xs">
            {/* Proposal Research Summary */}
            <div className="space-y-1">
              <span className="font-bold text-slate-300 uppercase text-[10px] tracking-wider block">
                Technical Methodology & Overview:
              </span>
              <div className="bg-white/[0.04] p-4 rounded-xl border border-white/10 text-slate-200 whitespace-pre-line leading-relaxed">
                {viewProposalItem.summary}
              </div>
            </div>

            {/* Milestones & Deliverables Queue */}
            <div className="space-y-3 pt-2">
              <h4 className="font-heading font-bold text-sm text-white flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-teal" />
                <span>Milestones & Deliverables ({viewProposalItem.milestones?.length || 0})</span>
              </h4>

              {viewProposalItem.milestones && viewProposalItem.milestones.length > 0 ? (
                <div className="space-y-3">
                  {viewProposalItem.milestones.map(m => {
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
                              className="px-3 py-1 bg-navy hover:bg-navy-light text-white rounded-lg text-xs font-bold flex items-center space-x-1 transition-colors shrink-0 shadow-xs"
                            >
                              <span>Inspect Document</span>
                              <ExternalLink className="w-3 h-3 text-teal" />
                            </a>
                          </div>
                        )}

                        {/* Revision feedback */}
                        {isRevisionRequested && (
                          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-200 space-y-2.5 backdrop-blur-xl">
                            <div className="flex items-center space-x-2 font-bold text-amber-300">
                              <AlertCircle className="w-4 h-4 text-amber" />
                              <span>Industry Review Feedback from {m.reviewed_by_name || 'Funding Partner'}:</span>
                            </div>
                            <div className="bg-white/[0.05] p-3 rounded-xl border border-amber-500/20 text-amber-100 font-medium leading-relaxed">
                              "{m.industry_feedback || 'Please update the submitted evidence according to required technical specifications.'}"
                            </div>
                          </div>
                        )}

                        {/* Submit Milestone Drawer */}
                        {!isApproved && !isPendingReview && completingMilestoneId !== m.id && (
                          <div className="pt-2 border-t border-white/10 flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setCompletingMilestoneId(m.id);
                                setMilestoneEvidenceUrl(m.evidence_url || '');
                              }}
                              className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors shadow-float flex items-center space-x-1.5 ${
                                isRevisionRequested
                                  ? 'bg-amber text-navy hover:bg-amber-pending'
                                  : 'bg-navy hover:bg-navy-light text-white'
                              }`}
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>{isRevisionRequested ? 'Re-submit Milestone with Revised Evidence' : 'Submit Milestone Deliverable'}</span>
                            </button>
                          </div>
                        )}

                        {completingMilestoneId === m.id && (
                          <div className="bg-white/[0.04] p-4 rounded-xl border border-teal/40 space-y-3">
                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                              Deliverable Document URL *
                            </label>
                            <input
                              type="url"
                              required
                              value={milestoneEvidenceUrl}
                              onChange={e => setMilestoneEvidenceUrl(e.target.value)}
                              placeholder="https://bharatpanchyt.jh.gov.in/evidence/... or link"
                              className="w-full px-3 py-2 text-xs rounded-xl border border-white/15 focus:outline-none focus:ring-2 focus:ring-teal bg-white/[0.06]"
                            />
                            <div className="flex justify-end space-x-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setCompletingMilestoneId(null);
                                  setMilestoneEvidenceUrl('');
                                }}
                                className="px-3.5 py-1.5 bg-white/[0.06] border border-white/10 text-slate-300 rounded-lg text-xs font-semibold hover:bg-white/[0.06]"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={milestoneSubmitting || !milestoneEvidenceUrl.trim()}
                                onClick={() => handleCompleteMilestone(m.id)}
                                className="px-4 py-1.5 bg-teal text-navy font-bold hover:bg-teal-hover rounded-lg text-xs transition-colors disabled:opacity-50 flex items-center space-x-1.5 shadow-xs"
                              >
                                <Send className="w-3 h-3" />
                                <span>{milestoneSubmitting ? 'Submitting...' : 'Submit to Industry Queue'}</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-400 text-xs italic py-2">No milestones generated for this proposal yet.</p>
              )}
            </div>
          </div>
        </BottomSheet>
      )}

      {/* Reusable Generate Report Modal */}
      <GenerateReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        portalRole="University R&D Portal"
      />
    </div>
  );
};

export default UniversityPortal;
