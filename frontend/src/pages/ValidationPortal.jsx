import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  Sparkles, 
  HelpCircle, 
  ShieldAlert,
  Send,
  Building,
  Download,
  X,
  MessageSquare,
  PauseCircle,
  Eye,
  GraduationCap,
  Star,
  Layers,
  ArrowRight,
  Check,
  Briefcase,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import SLABadge from '../components/common/SLABadge';
import RequestInfoModal from '../components/common/RequestInfoModal';
import GenerateReportModal from '../components/common/GenerateReportModal';
import BottomSheet from '../components/common/BottomSheet';

const ValidationPortal = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'awaiting_routing'
  const [queue, setQueue] = useState([]);
  const [awaitingQueue, setAwaitingQueue] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState(user?.district_id || '');
  const [loading, setLoading] = useState(true);
  const [awaitingLoading, setAwaitingLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  // Rejection modal
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Request Info Modal (Fix 4)
  const [requestInfoItem, setRequestInfoItem] = useState(null);
  const [infoSubmitting, setInfoSubmitting] = useState(false);

  // Routing Confirmation Modal (Hybrid AI Routing)
  const [routingChallenge, setRoutingChallenge] = useState(null);
  const [shortlist, setShortlist] = useState([]);
  const [shortlistLoading, setShortlistLoading] = useState(false);
  const [shortlistError, setShortlistError] = useState(null);
  const [routingUniId, setRoutingUniId] = useState(null);
  const [routingSuccess, setRoutingSuccess] = useState(null);

  const loadQueue = () => {
    setLoading(true);
    let url = '/validation/queue';
    if (selectedDistrict) {
      url += `?district_id=${selectedDistrict}`;
    }
    api.get(url)
      .then(res => setQueue(res.data))
      .catch(err => console.error("Failed to load validation queue", err))
      .finally(() => setLoading(false));
  };

  const loadAwaitingQueue = () => {
    setAwaitingLoading(true);
    let url = '/validation/awaiting-routing';
    if (selectedDistrict) {
      url += `?district_id=${selectedDistrict}`;
    }
    api.get(url)
      .then(res => setAwaitingQueue(res.data))
      .catch(err => console.error("Failed to load awaiting routing queue", err))
      .finally(() => setAwaitingLoading(false));
  };

  const loadAll = () => {
    loadQueue();
    loadAwaitingQueue();
  };

  useEffect(() => {
    api.get('/districts').then(res => setDistricts(res.data)).catch(() => {});
    loadAll();
  }, [selectedDistrict]);

  // Open Routing Modal and fetch AI Shortlist
  const openRoutingModal = async (challenge) => {
    setRoutingChallenge(challenge);
    setShortlist([]);
    setShortlistLoading(true);
    setShortlistError(null);
    setRoutingSuccess(null);
    setRoutingUniId(null);

    try {
      const res = await api.get(`/validation/challenges/${challenge.id}/routing-shortlist`);
      setShortlist(res.data || []);
    } catch (err) {
      console.error("Failed to fetch routing shortlist", err);
      setShortlistError(err.response?.data?.detail || err.message || "Failed to compute candidate universities.");
    } finally {
      setShortlistLoading(false);
    }
  };

  const closeRoutingModal = () => {
    setRoutingChallenge(null);
    setShortlist([]);
    setRoutingSuccess(null);
    setRoutingUniId(null);
    setShortlistError(null);
    loadAll();
  };

  // Step 1: Officer Approves Challenge -> Immediately opens Routing Confirmation Panel
  const handleApproveChallenge = async (challenge) => {
    setActionLoading(challenge.id);
    try {
      await api.patch(`/validation/challenges/${challenge.id}`, {
        status: 'awaiting_routing'
      });
      // Refresh queues in background
      loadAll();
      // Step 2: Open Routing confirmation panel immediately
      openRoutingModal(challenge);
    } catch (err) {
      alert("Error approving challenge: " + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  // Step 3: Officer Confirms Routing to a specific university choice
  const handleConfirmRouting = async (challengeId, universityId) => {
    setRoutingUniId(universityId);
    try {
      const res = await api.post(`/validation/challenges/${challengeId}/route`, {
        university_id: universityId
      });
      setRoutingSuccess(res.data);
      loadAll();
    } catch (err) {
      alert("Error confirming routing assignment: " + (err.response?.data?.detail || err.message));
    } finally {
      setRoutingUniId(null);
    }
  };

  const handleAction = async (challengeId, status, reason = null) => {
    setActionLoading(challengeId);
    try {
      await api.patch(`/validation/challenges/${challengeId}`, {
        status: status,
        rejection_reason: reason
      });
      setRejectingId(null);
      setRejectionReason('');
      loadAll();
    } catch (err) {
      alert("Error updating validation: " + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  // Submit Clarification Request (Fix 4 / RequestInfoModal)
  const handleRequestInfoSubmit = async (challengeId, questionText) => {
    setInfoSubmitting(true);
    try {
      await api.post(`/validation/challenges/${challengeId}/request-info`, {
        message: questionText
      });
      alert("Clarification request dispatched to citizen. 48-hour SLA clock paused.");
      setRequestInfoItem(null);
      loadAll();
    } catch (err) {
      alert("Error sending clarification request: " + (err.response?.data?.detail || err.message));
    } finally {
      setInfoSubmitting(false);
    }
  };

  const getWorkloadPill = (count) => {
    if (count === 0) {
      return (
        <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>0 Active Projects (Optimal Capacity)</span>
        </span>
      );
    }
    if (count <= 2) {
      return (
        <span className="bg-blue-100 text-blue-800 border border-blue-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          <span>{count} Active Projects (Balanced Load)</span>
        </span>
      );
    }
    return (
      <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center space-x-1">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
        <span>{count} Active Projects (High Workload)</span>
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-pending uppercase tracking-wider mb-1">
            <ClipboardCheck className="w-4 h-4" />
            <span>District Science, Technology & Innovation (STI) Directorate</span>
          </div>
          <h1 className="text-2xl font-heading font-extrabold text-navy">
            District Validation Officer Queue
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1">
            Hybrid Governance Engine: Strict 48-hour SLA gatekeeper with transparent officer confirmation of AI research matches.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* District Scope Switcher */}
          <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 pl-2">District:</span>
            <select
              value={selectedDistrict}
              onChange={e => setSelectedDistrict(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal"
            >
              <option value="">Statewide Queue</option>
              {districts.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Feature A: Download Activity Report PDF */}
          <div>
            <button
              onClick={() => setShowReportModal(true)}
              className="px-3.5 py-2 rounded-xl bg-navy hover:bg-navy-light text-white text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm"
              title="Generate Administrative Activity Report PDF"
            >
              <Download className="w-3.5 h-3.5 text-teal" />
              <span>Generate Activity Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs between Pending Review Queue and Validated - Awaiting Routing */}
      <div className="flex border-b border-slate-200 space-x-4">
        <button
          onClick={() => setActiveTab('pending')}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition-colors ${
            activeTab === 'pending'
              ? 'border-navy text-navy'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ClipboardCheck className="w-4 h-4 text-teal" />
          <span>Pending Field Review ({queue.length})</span>
          {queue.some(q => q.sla_state === 'escalated') && (
            <span className="w-2 h-2 rounded-full bg-red-flagged animate-pulse"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('awaiting_routing')}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition-colors ${
            activeTab === 'awaiting_routing'
              ? 'border-navy text-navy'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span>Validated — Awaiting Routing ({awaitingQueue.length})</span>
          {awaitingQueue.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 text-[10px] font-extrabold">
              {awaitingQueue.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: PENDING VALIDATION QUEUE */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-heading font-bold text-navy">
                Pending Validation Submissions ({queue.length})
              </h2>
              <p className="text-slate-500 text-xs">
                Oldest submissions listed first to prevent SLA breach escalation to state government admin.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs">Loading queue items...</div>
          ) : queue.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-green-verified mx-auto" />
              <h3 className="text-sm font-bold text-navy">Queue is completely clear</h3>
              <p className="text-xs text-slate-500">All submitted citizen challenges in your jurisdiction have been processed.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {queue.map(item => (
                <div 
                  key={item.id}
                  className={`bg-white rounded-xl border p-6 shadow-sm space-y-4 transition-all ${
                    item.status === 'info_requested'
                      ? 'border-purple-300 bg-purple-50/20'
                      : item.sla_state === 'escalated' 
                      ? 'border-red-300 bg-red-50/20' 
                      : item.sla_state === 'warning' 
                      ? 'border-amber-200' 
                      : 'border-slate-200'
                  }`}
                >
                  {/* Card Header & Badges */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <SLABadge slaState={item.sla_state} ageHours={item.age_hours} status={item.status} />
                      <span className="text-[11px] font-mono text-slate-400 font-semibold">{item.tracking_id}</span>
                      <span className="capitalize text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {item.category.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{item.district_name}</span>
                      </span>
                      {item.duplicate_count > 0 && (
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[11px] font-bold">
                          +{item.duplicate_count} Similar Submissions Clustered
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 text-right">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Priority Score</div>
                        <div className="text-sm font-heading font-black text-navy">{item.priority_score}/100</div>
                      </div>
                    </div>
                  </div>

                  {/* Citizen Submission Body */}
                  <div className="space-y-2">
                    <h3 className="font-heading font-bold text-base text-navy">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {item.description}
                    </p>
                  </div>

                  {/* Fix 4: If citizen responded with clarification */}
                  {item.citizen_response_text && (
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-2">
                      <div className="flex items-center space-x-2 text-xs font-bold text-purple-900">
                        <MessageSquare className="w-4 h-4 text-purple-600" />
                        <span>Citizen Ground Response to Clarification Request:</span>
                        <span className="text-[10px] text-purple-600 font-mono font-normal">
                          ({new Date(item.citizen_responded_at).toLocaleString()})
                        </span>
                      </div>
                      <div className="text-xs text-purple-950 bg-white p-3 rounded-lg border border-purple-100 leading-relaxed font-medium">
                        {item.citizen_response_text}
                      </div>
                      {item.citizen_response_photo_url && (
                        <div className="pt-1">
                          <a 
                            href={item.citizen_response_photo_url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-xs text-purple-700 font-bold hover:underline inline-flex items-center space-x-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect Attached Citizen Photo</span>
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI Structured Brief Synthesis */}
                  {item.ai_generated_brief && (
                    <div className="bg-teal/5 border border-teal/20 rounded-lg p-3 text-xs space-y-1">
                      <div className="flex items-center space-x-1.5 font-bold text-navy">
                        <Sparkles className="w-3.5 h-3.5 text-teal" />
                        <span>AI Structured Problem Brief:</span>
                      </div>
                      <p className="text-slate-600 whitespace-pre-line text-[11px] leading-relaxed">
                        {item.ai_generated_brief}
                      </p>
                    </div>
                  )}

                  {/* Media Attachments */}
                  {item.photo_urls && item.photo_urls.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {item.photo_urls.map((url, idx) => (
                        <a key={idx} href={url} target="_blank" rel="noreferrer">
                          <img 
                            src={url} 
                            alt="Attachment" 
                            className="w-16 h-16 object-cover rounded-lg border border-slate-200 hover:opacity-80 transition-opacity"
                          />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Officer Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <div className="text-[11px] text-slate-400">
                      Submitter: <strong className="text-slate-600 capitalize">{item.submitter_type}</strong>
                      {item.submitter_contact && ` • ${item.submitter_contact}`}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setRequestInfoItem(item)}
                        className="px-3.5 py-2 rounded-lg border border-purple-300 text-purple-700 hover:bg-purple-50 text-xs font-semibold transition-colors flex items-center space-x-1.5"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Request Clarification</span>
                      </button>

                      <button
                        onClick={() => setRejectingId(item.id)}
                        className="px-3.5 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors flex items-center space-x-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>

                      {/* Step 1: Approve Challenge -> Opens Routing Confirmation Modal */}
                      <button
                        disabled={actionLoading === item.id}
                        onClick={() => handleApproveChallenge(item)}
                        className="px-5 py-2 rounded-lg bg-navy hover:bg-navy-light text-white font-bold text-xs transition-colors shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal" />
                        <span>{actionLoading === item.id ? 'Approving...' : 'Approve & Route to HEIs'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: VALIDATED — AWAITING ROUTING QUEUE */}
      {activeTab === 'awaiting_routing' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-heading font-bold text-navy flex items-center space-x-2">
                <span>Validated Submissions Awaiting Routing ({awaitingQueue.length})</span>
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 font-mono">
                  Human Routing Control
                </span>
              </h2>
              <p className="text-slate-500 text-xs">
                Approved by District Nodal Officer. Review AI-matched universities and live active workloads before confirming assignment.
              </p>
            </div>
          </div>

          {awaitingLoading ? (
            <div className="py-12 text-center text-slate-500 text-xs">Loading awaiting routing queue...</div>
          ) : awaitingQueue.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-green-verified mx-auto" />
              <h3 className="text-sm font-bold text-navy">All validated challenges have been routed</h3>
              <p className="text-xs text-slate-500">There are no approved challenges waiting for university research routing.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {awaitingQueue.map(item => (
                <div 
                  key={item.id}
                  className="bg-white rounded-xl border border-purple-200 p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-purple-100 text-purple-900 border border-purple-300 px-2.5 py-0.5 rounded-md text-[11px] font-bold">
                        Validated — Awaiting Routing
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 font-semibold">{item.tracking_id}</span>
                      <span className="capitalize text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {item.category.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{item.district_name}</span>
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400 font-mono">
                      Validated: {item.validated_at ? new Date(item.validated_at).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-heading font-bold text-base text-navy">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <div className="text-[11px] text-slate-500">
                      Validated by: <strong className="text-navy">{item.validated_by_name}</strong>
                    </div>

                    <button
                      onClick={() => openRoutingModal(item)}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Select & Route to University</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ROUTE TO UNIVERSITY PANEL MODAL (Hybrid AI Routing) */}
      {routingChallenge && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">
                    Hybrid Routing Confirmation Step
                  </span>
                  <h3 className="font-heading font-bold text-base text-navy">
                    Confirm University Assignment
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {routingChallenge.title} (ID: {routingChallenge.tracking_id})
                  </p>
                </div>
              </div>
              <button
                onClick={closeRoutingModal}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* If Routing Confirmed */}
            {routingSuccess ? (
              <div className="py-6 space-y-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-base text-navy">
                    Challenge Routed Successfully!
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                    {routingSuccess.message}
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={closeRoutingModal}
                    className="px-6 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-light transition-colors shadow-sm"
                  >
                    Done & Return to Queue
                  </button>
                </div>
              </div>
            ) : shortlistLoading ? (
              <div className="py-12 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
                <div className="text-xs font-bold text-navy">
                  Computing AI Research Expertise Shortlist...
                </div>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Cross-referencing department tags, faculty publications, and current active faculty project workloads.
                </p>
              </div>
            ) : shortlistError ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 space-y-2">
                <div className="font-bold flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span>Unable to calculate candidate shortlist</span>
                </div>
                <p>{shortlistError}</p>
                <button
                  onClick={() => openRoutingModal(routingChallenge)}
                  className="mt-2 px-3 py-1.5 bg-red-100 text-red-800 rounded-lg text-xs font-bold hover:bg-red-200"
                >
                  Retry Matching
                </button>
              </div>
            ) : shortlist.length === 0 ? (
              <div className="p-8 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                No matching universities found for this category.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3.5 text-xs text-purple-900 space-y-1">
                  <span className="font-bold block">Officer Discretion & Workload Transparency:</span>
                  <p className="text-[11px] text-purple-950 leading-relaxed">
                    Routing creates the match record and notifies the university. The AI has ranked candidate Higher Education Institutions based on department discipline alignment and proximity. Review current active project workloads before assigning.
                  </p>
                </div>

                <div className="space-y-3">
                  {shortlist.map((u, idx) => (
                    <div
                      key={u.university_id}
                      className={`p-4 rounded-xl border transition-all space-y-3 ${
                        u.is_recommended
                          ? 'border-teal-400 bg-gradient-to-r from-teal-50/50 via-white to-slate-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {u.is_recommended ? (
                            <span className="bg-teal text-navy px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center space-x-1 shadow-sm">
                              <Star className="w-3 h-3 fill-navy" />
                              <span>AI Top Recommended</span>
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                              Rank #{idx + 1}
                            </span>
                          )}

                          <h4 className="font-heading font-bold text-sm text-navy">
                            {u.university_name}
                          </h4>
                          <span className="text-xs text-slate-400 font-medium">({u.district_name})</span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-black font-heading text-navy bg-slate-100 px-2.5 py-1 rounded-lg">
                            {u.match_score}% Match
                          </span>
                        </div>
                      </div>

                      {/* Workload and Trust Status */}
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        {getWorkloadPill(u.active_project_count)}
                        <span className="text-[11px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          Trust Score: <strong className="text-navy">{u.trust_score}/100</strong>
                        </span>
                        {/* Verification Status Badge (Addendum 2) */}
                        {u.is_verified_expertise ? (
                          <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>Verified Expertise</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            <span>Unverified — Auto-Imported</span>
                          </span>
                        )}
                        {u.departments && u.departments.length > 0 && (
                          <span className="text-[11px] text-slate-500">
                            {u.departments[0]}
                          </span>
                        )}
                      </div>

                      {/* Matching Rationale Factors */}
                      {u.match_reasons && u.match_reasons.factors && (
                        <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100 text-[11px] text-slate-700 space-y-1">
                          <span className="font-bold text-slate-800 text-[10px] uppercase tracking-wider block">
                            Why this HEI matched:
                          </span>
                          <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                            {u.match_reasons.factors.map((factor, fIdx) => (
                              <li key={fIdx}>{factor}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Route Action Button */}
                      <div className="flex justify-end pt-1">
                        <button
                          disabled={routingUniId !== null}
                          onClick={() => handleConfirmRouting(routingChallenge.id, u.university_id)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5 disabled:opacity-50 ${
                            u.is_recommended
                              ? 'bg-teal hover:bg-teal-dark text-navy'
                              : 'bg-navy hover:bg-navy-light text-white'
                          }`}
                        >
                          {routingUniId === u.university_id ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Routing...</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>{u.is_recommended ? 'Accept AI Pick & Route' : 'Route to This University'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
                  <span>If not ready to route, close this panel. Challenge will wait in 'Validated — Awaiting Routing'.</span>
                  <button
                    onClick={closeRoutingModal}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Decide Later
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CLARIFICATION REQUEST MODAL (Fix 4 / RequestInfoModal) */}
      <RequestInfoModal
        isOpen={Boolean(requestInfoItem)}
        onClose={() => setRequestInfoItem(null)}
        challenge={requestInfoItem}
        onSubmit={handleRequestInfoSubmit}
        isSubmitting={infoSubmitting}
      />

      {/* GENERATE ACTIVITY REPORT MODAL (Item 23) */}
      <GenerateReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        role="Validation Officer"
        districtName={districts.find(d => String(d.id) === String(selectedDistrict))?.name || 'All Districts'}
      />

      {/* Reject Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="font-heading font-bold text-base text-navy">
              Reject Community Submission
            </h3>
            <p className="text-xs text-slate-600">
              Please enter an official administrative reason for rejecting this challenge (visible on the citizen tracking portal).
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="e.g. Duplicate report already resolved under District Jal Mission, or lacks physical site coordinates..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectingId(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAction(rejectingId, 'rejected', rejectionReason)}
                className="px-4 py-2 rounded-lg bg-red-flagged text-white text-xs font-bold hover:bg-red-700"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationPortal;
