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
  Upload 
} from 'lucide-react';
import api from '../services/api';
import DemoDisclaimer from '../components/common/DemoDisclaimer';
import BottomSheet from '../components/common/BottomSheet';
import StatusBadge from '../components/common/StatusBadge';
import GenerateReportModal from '../components/common/GenerateReportModal';

const UniversityPortal = () => {
  const [matches, setMatches] = useState([]);
  const [facultyMembers, setFacultyMembers] = useState([]);
  const [trustScore, setTrustScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-teal uppercase tracking-wider mb-1">
            <GraduationCap className="w-4 h-4" />
            <span>Academic Research & Innovation Cell</span>
          </div>
          <h1 className="text-2xl font-heading font-extrabold text-navy">
            {profile?.name || 'University Research Portal'}
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1">
            Review algorithmic societal problem matches, mobilize faculty-student project teams, and submit CSR proposals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {trustScore && (
            <div className="bg-canvas border border-slate-200 px-4 py-2.5 rounded-xl text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Trust Score</span>
              <div className="text-lg font-heading font-black text-navy">{trustScore.computed_score}/100</div>
            </div>
          )}

          {profile && (
            <Link
              to="/university/profile"
              className="bg-green-light hover:bg-green-light/80 border border-green-border px-4 py-2.5 rounded-xl text-right transition-colors"
              title="Verified profiles are prioritized in matching"
            >
              <span className="text-[10px] uppercase font-bold text-green-700 block">Profile Completeness</span>
              <div className="text-lg font-heading font-black text-green-700">{Math.round(profile.profile_completeness_score || 70)}%</div>
            </Link>
          )}

          {/* Reusable Report Export Modal Trigger */}
          <button
            onClick={() => setReportModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-navy hover:bg-navy-light text-white text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm"
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
            <span className="text-slate-700">
              <strong className="text-navy">Routing Prioritization:</strong> Verified profiles are prioritized in algorithmic challenge matching. Review and verify your department expertise tags to raise your institutional match rank.
            </span>
          </div>
          <Link
            to="/university/profile"
            className="px-3 py-1.5 rounded-lg bg-green text-white font-bold text-xs whitespace-nowrap shadow-sm hover:opacity-90 transition-opacity"
          >
            Review & Verify Tags
          </Link>
        </div>
      )}

      {/* Illustrative regional entities demo disclaimer */}
      <DemoDisclaimer />

      {/* Matched Challenges Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-heading font-bold text-navy">
            AI Matched Challenges Inbox ({matches.length})
          </h2>
          <p className="text-slate-500 text-xs">
            Click on any challenge card to view field reports and proceed through sequential stage-gates: Accept Match → Form Team → Submit Proposal.
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">Loading matched challenges...</div>
        ) : matches.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-green mx-auto" />
            <h3 className="text-sm font-bold text-navy">No pending matches in inbox</h3>
            <p className="text-xs text-slate-500">Your university will be notified as new district challenges are validated.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map(m => {
              const ch = m.challenge;
              const isDeclined = m.status === 'declined';
              const isPending = m.status === 'suggested' || m.status === 'pending';
              const isAccepted = m.status === 'accepted';
              const hasTeam = Boolean(m.team);
              const hasProposal = Boolean(m.proposal);

              return (
                <div 
                  key={m.match_id}
                  className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between gap-6 relative"
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
                      <span className="capitalize text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {ch.category?.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{ch.district_name}</span>
                      </span>
                    </div>

                    <h3 className="font-heading font-bold text-base text-navy hover:text-teal-dark transition-colors">
                      {ch.title}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {ch.description}
                    </p>

                    {/* Match Reasons Factors */}
                    {m.match_reasons?.factors && (
                      <div className="bg-canvas p-2.5 rounded-lg border border-slate-100 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Matching Factors:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {m.match_reasons.factors.map((f, i) => (
                            <span key={i} className="text-[11px] bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700">
                              ✓ {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Action Column */}
                  <div className="flex flex-col justify-center items-end min-w-[240px] border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 space-y-3">
                    {/* Step 1: Pending Match */}
                    {isPending && (
                      <div className="w-full space-y-2 text-right">
                        <span className="inline-block px-2.5 py-1 rounded-full bg-amber-light text-amber-800 border border-amber-border text-[10px] font-bold">
                          Step 1: Match Review
                        </span>
                        <div className="flex flex-col sm:flex-row gap-2 justify-end w-full">
                          <button
                            onClick={() => handleDeclineMatch(m.match_id)}
                            className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => handleAcceptMatch(m.match_id)}
                            className="px-4 py-2 rounded-xl bg-navy hover:bg-navy-light text-white text-xs font-bold transition-colors shadow-sm flex items-center justify-center space-x-1.5"
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
                        <span className="inline-block px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold">
                          Step 2: Team Mobilization
                        </span>
                        <button
                          onClick={() => {
                            setTeamModalItem(m);
                            setFacultyMentorId('');
                            setStudents([{ name: '', role: 'Lead Student Researcher', email: '' }]);
                          }}
                          className="w-full px-4 py-2.5 rounded-xl bg-teal hover:bg-teal-hover text-navy font-bold text-xs transition-colors shadow-sm flex items-center justify-center space-x-2"
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
                          Mentor: <strong className="text-slate-800">{m.team.faculty_mentor_name || 'Assigned'}</strong>
                          <div className="text-[10px] text-teal-dark">{m.team.student_members?.length || 0} Student Researchers</div>
                        </div>
                        <button
                          onClick={() => {
                            setProposalModalItem(m);
                            setProposalTitle(`Societal Innovation Proposal: ${ch.title}`);
                            setProposalSummary('');
                          }}
                          className="w-full px-4 py-2.5 rounded-xl bg-navy hover:bg-navy-light text-white font-bold text-xs transition-colors shadow-sm flex items-center justify-center space-x-2"
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
                        <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 text-xs font-bold">
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
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200"
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
                  className="px-5 py-2 rounded-xl bg-navy hover:bg-navy-light text-white text-xs font-bold shadow-sm"
                >
                  Accept Match
                </button>
              )}
            </>
          }
        >
          {/* Structured AI Brief */}
          {detailModalItem.challenge.ai_generated_brief && (
            <div className="bg-teal/5 p-4 rounded-xl border border-teal/20 space-y-1 text-xs">
              <span className="font-bold text-navy block uppercase text-[10px] tracking-wider">AI Problem Brief & Context:</span>
              <p className="text-slate-700 leading-relaxed font-sans">{detailModalItem.challenge.ai_generated_brief}</p>
            </div>
          )}

          {/* Full Field Description */}
          <div className="space-y-1 text-xs">
            <span className="font-bold text-slate-700 block uppercase text-[10px] tracking-wider">Citizen Field Statement:</span>
            <p className="text-slate-600 leading-relaxed bg-canvas p-4 rounded-xl border border-slate-100 whitespace-pre-line">
              {detailModalItem.challenge.description}
            </p>
          </div>

          {/* Photos */}
          {detailModalItem.challenge.photo_urls && detailModalItem.challenge.photo_urls.length > 0 && (
            <div className="space-y-2">
              <span className="font-bold text-slate-700 block uppercase text-[10px] tracking-wider">Field Photo Evidence:</span>
              <div className="flex flex-wrap gap-2">
                {detailModalItem.challenge.photo_urls.map((url, i) => (
                  <img key={i} src={url} alt="Evidence" className="w-24 h-24 object-cover rounded-xl border border-slate-200" />
                ))}
              </div>
            </div>
          )}

          {/* Matching Rationale */}
          {detailModalItem.match_reasons?.factors && (
            <div className="bg-canvas p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-navy block uppercase text-[10px] tracking-wider">Why Your Institution Matched:</span>
              <ul className="space-y-1 text-slate-600">
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
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                Assign Faculty Mentor / Principal Investigator *
              </label>
              <select
                required
                value={facultyMentorId}
                onChange={e => setFacultyMentorId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal"
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
                <label className="text-xs font-bold text-navy uppercase tracking-wider">
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
                <div key={idx} className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-canvas border border-slate-200">
                  <input
                    type="text"
                    placeholder="Student Name"
                    required
                    value={student.name}
                    onChange={e => handleStudentChange(idx, 'name', e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Role (e.g. Lead Prototyping)"
                    value={student.role}
                    onChange={e => handleStudentChange(idx, 'role', e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                  <input
                    type="email"
                    placeholder="Institutional Email"
                    value={student.email}
                    onChange={e => handleStudentChange(idx, 'email', e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setTeamModalItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={teamSubmitting}
                className="px-5 py-2.5 rounded-xl bg-navy hover:bg-navy-light text-white text-xs font-bold transition-colors shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Users className="w-3.5 h-3.5 text-teal" />
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
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                Proposal Title *
              </label>
              <input
                type="text"
                required
                value={proposalTitle}
                onChange={e => setProposalTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                Research Methodology, Deliverables & Budget Overview *
              </label>
              <textarea
                required
                rows={6}
                value={proposalSummary}
                onChange={e => setProposalSummary(e.target.value)}
                placeholder="Detail scientific approach, laboratory trials, pilot milestones, budget outline, and expected community impact..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal resize-none leading-relaxed"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setProposalModalItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={proposalSubmitting}
                className="px-5 py-2.5 rounded-xl bg-teal text-navy font-bold text-xs hover:bg-teal-hover transition-all shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
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
              <span className="font-bold text-navy uppercase text-[10px] tracking-wider block">
                Technical Methodology & Overview:
              </span>
              <div className="bg-canvas p-4 rounded-xl border border-slate-200 text-slate-700 whitespace-pre-line leading-relaxed">
                {viewProposalItem.summary}
              </div>
            </div>

            {/* Milestones & Deliverables Queue */}
            <div className="space-y-3 pt-2">
              <h4 className="font-heading font-bold text-sm text-navy flex items-center space-x-2">
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
                      <div key={m.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-heading font-bold text-slate-900 text-sm">{m.title}</span>
                              <StatusBadge status={m.status} />
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">{m.description}</p>
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
                          <div className="bg-canvas rounded-lg p-2.5 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center space-x-2 text-xs truncate">
                              <FileText className="w-4 h-4 text-teal shrink-0" />
                              <span className="font-bold text-slate-700">Submitted Deliverable:</span>
                              <span className="text-slate-500 truncate max-w-sm">{m.evidence_url}</span>
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
                          <div className="bg-amber-light border border-amber-border rounded-xl p-3.5 text-xs text-amber-950 space-y-2">
                            <div className="flex items-center space-x-1.5 font-bold text-amber-900">
                              <AlertCircle className="w-4 h-4 text-amber" />
                              <span>Industry Review Feedback from {m.reviewed_by_name || 'Funding Partner'}:</span>
                            </div>
                            <div className="bg-white/90 p-3 rounded-lg border border-amber-border text-amber-950 font-medium leading-relaxed">
                              "{m.industry_feedback || 'Please update the submitted evidence according to required technical specifications.'}"
                            </div>
                          </div>
                        )}

                        {/* Submit Milestone Drawer */}
                        {!isApproved && !isPendingReview && completingMilestoneId !== m.id && (
                          <div className="pt-2 border-t border-slate-100 flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setCompletingMilestoneId(m.id);
                                setMilestoneEvidenceUrl(m.evidence_url || '');
                              }}
                              className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors shadow-sm flex items-center space-x-1.5 ${
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
                          <div className="bg-canvas p-4 rounded-xl border border-teal/40 space-y-3">
                            <label className="block text-xs font-bold text-navy uppercase tracking-wider">
                              Deliverable Document URL *
                            </label>
                            <input
                              type="url"
                              required
                              value={milestoneEvidenceUrl}
                              onChange={e => setMilestoneEvidenceUrl(e.target.value)}
                              placeholder="https://shodhsetu.jh.gov.in/evidence/... or link"
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal bg-white"
                            />
                            <div className="flex justify-end space-x-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setCompletingMilestoneId(null);
                                  setMilestoneEvidenceUrl('');
                                }}
                                className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-100"
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
