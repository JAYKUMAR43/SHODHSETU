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
  AlertCircle,
  Video,
  FileText
} from 'lucide-react';
import api, { getFileUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import SLABadge from '../components/common/SLABadge';
import RequestInfoModal from '../components/common/RequestInfoModal';
import GenerateReportModal from '../components/common/GenerateReportModal';
import BottomSheet from '../components/common/BottomSheet';
import { PhotoThumbnailGrid, CitizenAudioPlayer } from '../components/common/MediaViewer';
import CategoryFilterBar from '../components/common/CategoryFilterBar';
import ProjectsMap from '../components/common/ProjectsMap';

const ValidationPortal = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'awaiting_routing'
  const [queue, setQueue] = useState([]);
  const [awaitingQueue, setAwaitingQueue] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState(user?.district_id || '');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDossier, setSelectedDossier] = useState(null); // Clickable Problem Detail Dossier
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
        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/200"></span>
          <span>0 Active Projects (Optimal Capacity)</span>
        </span>
      );
    }
    if (count <= 2) {
      return (
        <span className="bg-blue-500/20 text-blue-400 border border-blue-500/40 px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500/200"></span>
          <span>{count} Active Projects (Balanced Load)</span>
        </span>
      );
    }
    return (
      <span className="bg-amber-500/20 text-amber-300 border border-amber-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center space-x-1">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
        <span>{count} Active Projects (High Workload)</span>
      </span>
    );
  };

  const filteredQueue = selectedCategory === 'all' 
    ? queue 
    : queue.filter(q => String(q.category).toLowerCase() === selectedCategory.toLowerCase());

  const filteredAwaitingQueue = selectedCategory === 'all'
    ? awaitingQueue
    : awaitingQueue.filter(q => String(q.category).toLowerCase() === selectedCategory.toLowerCase());

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="panel-glass p-6 sm:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-pending uppercase tracking-wider mb-1">
            <ClipboardCheck className="w-4 h-4" />
            <span>District Science, Technology & Innovation (STI) Directorate</span>
          </div>
          <h1 className="text-2xl font-heading font-extrabold text-white">
            District Validation Officer Queue
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">
            Hybrid Governance Engine: Strict 48-hour SLA gatekeeper with transparent officer confirmation of AI research matches.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* District Scope Switcher */}
          <div className="flex items-center space-x-2 bg-white/[0.04] p-1.5 rounded-xl border border-white/10">
            <span className="text-[11px] font-bold text-slate-500 pl-2">District:</span>
            <select
              value={selectedDistrict}
              onChange={e => setSelectedDistrict(e.target.value)}
              className="input-glass text-xs font-medium py-1.5 px-2.5 rounded-lg"
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
              className="px-3.5 py-2 rounded-xl bg-navy hover:bg-navy-light text-white text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-float"
              title="Generate Administrative Activity Report PDF"
            >
              <Download className="w-3.5 h-3.5 text-teal" />
              <span>Generate Activity Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs between Pending Review Queue and Validated - Awaiting Routing */}
      <div className="flex border-b border-white/10 space-x-4">
        <button
          onClick={() => setActiveTab('pending')}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition-colors ${
            activeTab === 'pending'
              ? 'border-teal text-teal'
              : 'border-transparent text-slate-500 hover:text-slate-200'
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
              ? 'border-teal text-teal'
              : 'border-transparent text-slate-500 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>Validated — Awaiting Routing ({awaitingQueue.length})</span>
          {awaitingQueue.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-300 text-[10px] font-extrabold">
              {awaitingQueue.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('district_map')}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition-colors ${
            activeTab === 'district_map'
              ? 'border-teal text-teal'
              : 'border-transparent text-slate-500 hover:text-slate-200'
          }`}
        >
          <MapPin className="w-4 h-4 text-teal" />
          <span>District GIS Map</span>
        </button>
      </div>

      {/* TAB 1: PENDING VALIDATION QUEUE */}
      {activeTab === 'pending' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h2 className="text-lg font-heading font-extrabold text-white">
                Pending Validation Submissions ({filteredQueue.length}{selectedCategory !== 'all' ? ` of ${queue.length}` : ''})
              </h2>
              <p className="text-slate-400 text-xs">
                Click any challenge card to inspect full AI diagnosis, attached photos, and citizen voice recordings. Oldest submissions prioritized for SLA adherence.
              </p>
            </div>
          </div>

          {/* Classification & Domain Filter Bar */}
          <CategoryFilterBar 
            items={queue} 
            selectedCategory={selectedCategory} 
            onSelectCategory={setSelectedCategory} 
          />

          {loading ? (
            <div className="space-y-3 py-2">
              {[1, 2, 3].map(n => (
                <div key={n} className="h-44 bg-white/[0.06] rounded-xl animate-pulse border border-white/10" />
              ))}
            </div>
          ) : filteredQueue.length === 0 ? (
            <div className="empty-glass text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-green-verified mx-auto" />
              <h3 className="text-sm font-bold text-white">
                {selectedCategory === 'all' ? "Queue is completely clear" : `No challenges found in '${selectedCategory.replace(/_/g, ' ')}'`}
              </h3>
              <p className="text-xs text-slate-500">
                {selectedCategory === 'all' 
                  ? "All submitted citizen challenges in your jurisdiction have been processed." 
                  : "Click 'Reset to All' to view submissions across other thematic categories."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQueue.map(item => (
                <div 
                  key={item.id}
                  onClick={() => setSelectedDossier(item)}
                  className={`rounded-xl border p-4 shadow-lvl1 space-y-3.5 transition-all cursor-pointer hover:shadow-lvl2 hover:-translate-y-0.5 group ${
                    item.status === 'info_requested'
                      ? 'border-purple-500/50 bg-[#16203D]'
                      : item.sla_state === 'escalated' 
                      ? 'border-red-500/50 bg-[#1C1E32]' 
                      : item.sla_state === 'warning' 
                      ? 'border-amber-500/50 bg-[#1C2432]' 
                      : 'border-slate-700/80 bg-[#11233D]'
                  }`}
                >
                  {/* Card Header & Badges */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-700/60 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <SLABadge slaState={item.sla_state} ageHours={item.age_hours} status={item.status} />
                      <span className="text-[11px] font-mono text-slate-400 font-semibold">{item.tracking_id}</span>
                      <span className="capitalize text-xs font-semibold text-slate-300 bg-[#0E1E36] border border-slate-700 px-2.5 py-0.5 rounded-full">
                        {item.category.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.district_name}</span>
                      </span>
                      {item.duplicate_count > 0 && (
                        <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                          +{item.duplicate_count} Similar Submissions Clustered
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 text-right">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Priority Score</div>
                        <div className="text-base font-heading font-black text-teal">{item.priority_score}/100</div>
                      </div>
                    </div>
                  </div>

                  {/* Citizen Submission Body */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-heading font-bold text-base text-white group-hover:text-teal transition-colors">
                        {item.title}
                      </h3>
                      <span className="text-xs font-bold text-teal hidden sm:flex items-center space-x-1 shrink-0">
                        <Eye className="w-3.5 h-3.5" />
                        <span>Click to Inspect</span>
                      </span>
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed bg-[#0E1E36] p-3.5 rounded-lg border border-slate-700/60 max-w-prose">
                      {item.description}
                    </p>
                  </div>

                  {/* Fix 4: If citizen responded with clarification */}
                  {item.citizen_response_text && (
                    <div className="bg-purple-500/15 border border-purple-400/30 rounded-xl p-4 space-y-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center space-x-2 text-xs font-bold text-purple-300">
                        <MessageSquare className="w-4 h-4 text-purple-400" />
                        <span>Citizen Ground Response to Clarification Request:</span>
                        <span className="text-[10px] text-purple-300 font-mono font-normal">
                          ({new Date(item.citizen_responded_at).toLocaleString()})
                        </span>
                      </div>
                      <div className="text-xs text-purple-200 bg-[#0E1E36] p-3 rounded-lg border border-purple-500/30 leading-relaxed font-medium">
                        {item.citizen_response_text}
                      </div>
                    </div>
                  )}

                  {/* AI Structured Brief Synthesis */}
                  {item.ai_generated_brief && (
                    <div className="bg-[#0D253E] border border-teal-500/30 rounded-lg p-3.5 text-xs space-y-1.5">
                      <div className="flex items-center space-x-1.5 font-bold text-teal">
                        <Sparkles className="w-3.5 h-3.5 text-teal" />
                        <span>AI Structured Problem Brief:</span>
                      </div>
                      <p className="text-slate-200 whitespace-pre-line text-xs leading-relaxed max-w-prose">
                        {item.ai_generated_brief}
                      </p>
                    </div>
                  )}

                  {/* Media Attachments: Photos & Voice Note */}
                  {((item.photo_urls && item.photo_urls.length > 0) || item.voice_note_url) && (
                    <div className="space-y-3 pt-1 border-t border-slate-700/60" onClick={(e) => e.stopPropagation()}>
                      {item.photo_urls && item.photo_urls.length > 0 && (
                        <PhotoThumbnailGrid photos={item.photo_urls} />
                      )}
                      {item.voice_note_url && (
                        <div className="pt-1">
                          <CitizenAudioPlayer src={item.voice_note_url} label="Citizen Voice Note" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Officer Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-700/60">
                    <div className="text-xs text-slate-400">
                      Submitter: <strong className="text-slate-200 capitalize">{item.submitter_type}</strong>
                      {item.submitter_contact && ` • ${item.submitter_contact}`}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDossier(item);
                        }}
                        className="px-3.5 py-2.5 rounded-lg border border-teal/40 text-teal hover:bg-teal/15 hover:text-white text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm"
                        title="Open complete problem dossier with AI explanation, video & photos"
                      >
                        <Eye className="w-3.5 h-3.5 text-teal" />
                        <span>Inspect Full Dossier</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRequestInfoItem(item);
                        }}
                        className="px-3.5 py-2.5 rounded-lg border border-purple-500/40 text-purple-300 hover:bg-purple-500/20 text-xs font-semibold transition-colors flex items-center space-x-1.5"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Request Clarification</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRejectingId(item.id);
                        }}
                        className="px-3.5 py-2.5 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/20 text-xs font-semibold transition-colors flex items-center space-x-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>

                      {/* Step 1: Approve Challenge -> Opens Routing Confirmation Modal */}
                      <button
                        type="button"
                        disabled={actionLoading === item.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApproveChallenge(item);
                        }}
                        className="px-5 py-2.5 rounded-lg bg-teal hover:bg-teal-hover text-navy font-bold text-xs transition-all shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-navy" />
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
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h2 className="text-lg font-heading font-extrabold text-white flex items-center space-x-2">
                <span>Validated Submissions Awaiting Routing ({filteredAwaitingQueue.length}{selectedCategory !== 'all' ? ` of ${awaitingQueue.length}` : ''})</span>
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-purple-100 text-purple-300 font-mono">
                  Human Routing Control
                </span>
              </h2>
              <p className="text-slate-400 text-xs">
                Approved by District Nodal Officer. Click any challenge card to inspect complete dossier before confirming university research assignment.
              </p>
            </div>
          </div>

          {/* Classification & Domain Filter Bar */}
          <CategoryFilterBar 
            items={awaitingQueue} 
            selectedCategory={selectedCategory} 
            onSelectCategory={setSelectedCategory} 
          />

          {awaitingLoading ? (
            <div className="space-y-3 py-2">
              {[1, 2, 3].map(n => (
                <div key={n} className="h-44 bg-white/[0.06] rounded-xl animate-pulse border border-white/10" />
              ))}
            </div>
          ) : filteredAwaitingQueue.length === 0 ? (
            <div className="empty-glass text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-green-verified mx-auto" />
              <h3 className="text-sm font-bold text-white">
                {selectedCategory === 'all' ? "All validated challenges have been routed" : `No awaiting challenges in '${selectedCategory.replace(/_/g, ' ')}'`}
              </h3>
              <p className="text-xs text-slate-500">
                {selectedCategory === 'all' ? "There are no approved challenges waiting for university research routing." : "Click 'Reset to All' to view submissions across other categories."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAwaitingQueue.map(item => (
                <div 
                  key={item.id}
                  onClick={() => setSelectedDossier(item)}
                  className="rounded-xl bg-[#12233D] border border-purple-500/40 p-4 shadow-lvl1 space-y-3.5 hover:shadow-lvl2 hover:border-purple-400 hover:-translate-y-0.5 transition-all cursor-pointer group"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-700/60 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-purple-500/20 text-purple-300 border border-purple-400/30 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                        Validated — Awaiting Routing
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 font-semibold">{item.tracking_id}</span>
                      <span className="capitalize text-xs font-semibold text-slate-300 bg-[#0E1E36] border border-slate-700 px-2.5 py-0.5 rounded-full">
                        {item.category.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.district_name}</span>
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400 font-mono">
                      Validated: {item.validated_at ? new Date(item.validated_at).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-heading font-bold text-base text-white group-hover:text-purple-300 transition-colors">
                        {item.title}
                      </h3>
                      <span className="text-xs font-bold text-purple-400 hidden sm:flex items-center space-x-1 shrink-0">
                        <Eye className="w-3.5 h-3.5" />
                        <span>Click to Inspect</span>
                      </span>
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed bg-[#0E1E36] p-3.5 rounded-lg border border-slate-700/60 max-w-prose">
                      {item.description}
                    </p>
                  </div>

                  {/* Media Attachments: Photos & Voice Note */}
                  {((item.photo_urls && item.photo_urls.length > 0) || item.voice_note_url) && (
                    <div className="space-y-3 pt-1 border-t border-slate-700/60" onClick={(e) => e.stopPropagation()}>
                      {item.photo_urls && item.photo_urls.length > 0 && (
                        <PhotoThumbnailGrid photos={item.photo_urls} />
                      )}
                      {item.voice_note_url && (
                        <div className="pt-1">
                          <CitizenAudioPlayer src={item.voice_note_url} label="Citizen Voice Note" />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-700/60">
                    <div className="text-xs text-slate-400">
                      Validated by: <strong className="text-teal">{item.validated_by_name}</strong>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDossier(item);
                        }}
                        className="px-3.5 py-2.5 rounded-lg border border-slate-700 text-slate-200 hover:bg-white/10 text-xs font-bold flex items-center space-x-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-purple-400" />
                        <span>Inspect Dossier</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openRoutingModal(item);
                        }}
                        className="px-4.5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center space-x-2 transition-all shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Select & Route to University</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DISTRICT-SCOPED WORKING PROJECTS GIS MAP */}
      {activeTab === 'district_map' && (
        <div className="space-y-5">
          <ProjectsMap
            mode="district"
            filterDistrictId={selectedDistrict || user?.district_id}
            filterDistrictName={districts.find(d => String(d.id) === String(selectedDistrict))?.name}
            title={`District Working Projects Map — ${districts.find(d => String(d.id) === String(selectedDistrict))?.name || 'Local District'}`}
            subtitle="Displaying only active research deployments, verified working solutions, and field projects located strictly within this district."
          />
        </div>
      )}

      {/* ROUTE TO UNIVERSITY PANEL MODAL (Hybrid AI Routing) */}
      {routingChallenge && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white/[0.06] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl border border-white/10 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-white/10 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-400 flex items-center justify-center font-bold shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">
                    Hybrid Routing Confirmation Step
                  </span>
                  <h3 className="font-heading font-bold text-base text-white">
                    Confirm University Assignment
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {routingChallenge.title} (ID: {routingChallenge.tracking_id})
                  </p>
                </div>
              </div>
              <button
                onClick={closeRoutingModal}
                className="text-slate-400 hover:text-slate-300 p-1 rounded-lg hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* If Routing Confirmed */}
            {routingSuccess ? (
              <div className="py-6 space-y-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-base text-white">
                    Challenge Routed Successfully!
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
                    {routingSuccess.message}
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={closeRoutingModal}
                    className="px-6 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-light transition-colors shadow-float"
                  >
                    Done & Return to Queue
                  </button>
                </div>
              </div>
            ) : shortlistLoading ? (
              <div className="py-12 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
                <div className="text-xs font-bold text-white">
                  Computing AI Research Expertise Shortlist...
                </div>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Cross-referencing department tags, faculty publications, and current active faculty project workloads.
                </p>
              </div>
            ) : shortlistError ? (
              <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-xs text-red space-y-2">
                <div className="font-bold flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span>Unable to calculate candidate shortlist</span>
                </div>
                <p>{shortlistError}</p>
                <button
                  onClick={() => openRoutingModal(routingChallenge)}
                  className="mt-2 px-3 py-1.5 bg-red-500/20 text-red-300 rounded-lg text-xs font-bold hover:bg-red-500/30"
                >
                  Retry Matching
                </button>
              </div>
            ) : shortlist.length === 0 ? (
              <div className="p-8 bg-white/[0.04] rounded-xl border border-white/10 text-center text-xs text-slate-500">
                No matching universities found for this category.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-purple-500/20 border border-purple-400/40 rounded-xl p-3.5 text-xs text-purple-300 space-y-1">
                  <span className="font-bold block">Officer Discretion & Workload Transparency:</span>
                  <p className="text-[11px] text-purple-200 leading-relaxed">
                    Routing creates the match record and notifies the university. The AI has ranked candidate Higher Education Institutions based on department discipline alignment and proximity. Review current active project workloads before assigning.
                  </p>
                </div>

                <div className="space-y-3">
                  {shortlist.map((u, idx) => (
                    <div
                      key={u.university_id}
                      className={`p-4 rounded-xl border transition-all space-y-3 ${
                        u.is_recommended
                          ? 'border-teal-400 bg-gradient-to-r from-teal-50/50 via-white to-slate-50 shadow-float'
                          : 'border-white/10 bg-white/[0.06] hover:border-white/15'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {u.is_recommended ? (
                            <span className="bg-teal text-navy px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center space-x-1 shadow-float">
                              <Star className="w-3 h-3 fill-navy" />
                              <span>AI Top Recommended</span>
                            </span>
                          ) : (
                            <span className="bg-white/[0.06] text-slate-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                              Rank #{idx + 1}
                            </span>
                          )}

                          <h4 className="font-heading font-bold text-sm text-white">
                            {u.university_name}
                          </h4>
                          <span className="text-xs text-slate-400 font-medium">({u.district_name})</span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-black font-heading text-white bg-white/[0.06] px-2.5 py-1 rounded-lg">
                            {u.match_score}% Match
                          </span>
                        </div>
                      </div>

                      {/* Workload and Trust Status */}
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        {getWorkloadPill(u.active_project_count)}
                        <span className="text-[11px] text-slate-500 bg-white/[0.04] px-2 py-0.5 rounded border border-white/10">
                          Trust Score: <strong className="text-teal">{u.trust_score}/100</strong>
                        </span>
                        {/* Verification Status Badge (Addendum 2) */}
                        {u.is_verified_expertise ? (
                          <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>Verified Expertise</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-amber bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full">
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
                        <div className="bg-white/[0.04]/80 p-2.5 rounded-lg border border-white/10 text-[11px] text-slate-200 space-y-1">
                          <span className="font-bold text-white text-[10px] uppercase tracking-wider block">
                            Why this HEI matched:
                          </span>
                          <ul className="list-disc list-inside space-y-0.5 text-slate-300">
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
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-float flex items-center space-x-1.5 disabled:opacity-50 ${
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

                <div className="pt-2 border-t border-white/10 flex justify-between items-center text-xs text-slate-400">
                  <span>If not ready to route, close this panel. Challenge will wait in 'Validated — Awaiting Routing'.</span>
                  <button
                    onClick={closeRoutingModal}
                    className="px-3.5 py-1.5 rounded-lg border border-white/10 text-slate-300 font-semibold hover:bg-white/[0.04] transition-colors"
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
          <div className="bg-white/[0.06] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-white/10">
            <h3 className="font-heading font-bold text-base text-white">
              Reject Community Submission
            </h3>
            <p className="text-xs text-slate-300">
              Please enter an official administrative reason for rejecting this challenge (visible on the citizen tracking portal).
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="e.g. Duplicate report already resolved under District Jal Mission, or lacks physical site coordinates..."
              className="w-full px-3 py-2 rounded-lg border border-white/15 text-xs focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectingId(null)}
                className="px-4 py-2 rounded-lg bg-white/[0.06] text-slate-300 text-xs font-semibold"
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
      {/* FULL PROBLEM DOSSIER MODAL WITH AI EXPLANATION, PHOTOS & VIDEO */}
      {selectedDossier && (
        <BottomSheet
          isOpen={Boolean(selectedDossier)}
          onClose={() => setSelectedDossier(null)}
          title={selectedDossier.title}
          subtitle={`Tracking ID: ${selectedDossier.tracking_id} • ${selectedDossier.district_name || 'Jharkhand'}`}
          badge={selectedDossier.category?.replace(/_/g, ' ')?.toUpperCase() || 'PROBLEM DOSSIER'}
          icon={Sparkles}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-xs">
            {/* Meta Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white/[0.04] rounded-xl border border-white/10">
              <div className="flex flex-wrap items-center gap-2">
                <SLABadge slaState={selectedDossier.sla_state} ageHours={selectedDossier.age_hours} status={selectedDossier.status} />
                <span className="capitalize text-xs font-bold text-slate-200 bg-white/[0.06] border border-white/10 px-2.5 py-1 rounded-lg">
                  {selectedDossier.category?.replace(/_/g, ' ')}
                </span>
                <span className="text-xs text-slate-500 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedDossier.district_name}</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Societal Urgency Score</span>
                <span className="text-sm font-heading font-black text-white">{selectedDossier.priority_score}/100</span>
              </div>
            </div>

            {/* Citizen Ground Problem Statement */}
            <div className="space-y-1.5">
              <h4 className="font-heading font-bold text-sm text-white flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-teal" />
                <span>Citizen Ground Description:</span>
              </h4>
              <div className="bg-white/[0.04] p-4 rounded-xl border border-white/10 text-slate-200 leading-relaxed text-xs">
                {selectedDossier.description}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                <span>Submitter Type: <strong className="text-slate-300 capitalize">{selectedDossier.submitter_type}</strong></span>
                <span>Contact: <strong className="text-slate-300 font-mono">{selectedDossier.submitter_contact || 'Registered Citizen'}</strong></span>
              </div>
            </div>

            {/* AI Diagnosis & Structured Brief */}
            <div className="bg-gradient-to-br from-teal-50/70 via-white to-purple-50/40 border border-teal-200/80 rounded-xl p-4 space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-white">
                  <Sparkles className="w-4 h-4 text-teal" />
                  <span>AI Societal Diagnosis & Structured Technical Brief</span>
                </div>
                {selectedDossier.ai_confidence_score && (
                  <span className="bg-teal/20 text-teal-dark px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                    Confidence: {(selectedDossier.ai_confidence_score * 100).toFixed(0)}%
                  </span>
                )}
              </div>
              <p className="text-slate-200 text-xs leading-relaxed whitespace-pre-line bg-white/[0.06] p-3 rounded-lg border border-teal-100/60 font-sans">
                {selectedDossier.ai_generated_brief || "AI analysis indicates this problem requires technical intervention from appropriate university engineering or applied sciences departments."}
              </p>
            </div>

            {/* Field Photos Evidence */}
            {selectedDossier.photo_urls && selectedDossier.photo_urls.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <h4 className="font-heading font-bold text-xs text-white flex items-center space-x-1.5">
                  <Eye className="w-3.5 h-3.5 text-teal" />
                  <span>Field Evidence Photos ({selectedDossier.photo_urls.length}) — Click to Zoom Fullscreen</span>
                </h4>
                <PhotoThumbnailGrid photos={selectedDossier.photo_urls} />
              </div>
            )}

            {/* Video Evidence */}
            {selectedDossier.video_url && (
              <div className="space-y-2 pt-2 border-t border-white/10">
                <h4 className="font-heading font-bold text-xs text-white flex items-center space-x-1.5">
                  <Video className="w-3.5 h-3.5 text-teal" />
                  <span>Citizen Video Evidence</span>
                </h4>
                {selectedDossier.video_url.includes('youtube.com') || selectedDossier.video_url.includes('youtu.be') ? (
                  <div className="aspect-video w-full rounded-xl overflow-hidden shadow-float border border-white/10">
                    <iframe
                      src={selectedDossier.video_url.replace('watch?v=', 'embed/')}
                      title="Citizen Video Evidence"
                      className="w-full h-full"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <video
                    controls
                    src={getFileUrl(selectedDossier.video_url)}
                    className="w-full max-h-72 rounded-xl bg-black shadow-float object-contain"
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            )}

            {/* Citizen Voice Recording */}
            {selectedDossier.voice_note_url && (
              <div className="space-y-1.5 pt-2 border-t border-white/10">
                <CitizenAudioPlayer src={selectedDossier.voice_note_url} label="Citizen Ground Voice Note" />
              </div>
            )}

            {/* Citizen Clarification Response if present */}
            {selectedDossier.citizen_response_text && (
              <div className="bg-purple-50 border border-purple-400/40 rounded-xl p-4 space-y-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-purple-300">
                  <MessageSquare className="w-4 h-4 text-purple-400" />
                  <span>Citizen Ground Clarification Response:</span>
                </div>
                <div className="text-xs text-purple-200 bg-white/[0.06] p-3 rounded-lg border border-purple-500/30 leading-relaxed font-medium">
                  {selectedDossier.citizen_response_text}
                </div>
              </div>
            )}

            {/* Direct Officer Actions in Dossier Modal */}
            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedDossier(null)}
                className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/[0.04] text-xs font-semibold"
              >
                Close Dossier
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    const item = selectedDossier;
                    setSelectedDossier(null);
                    setRequestInfoItem(item);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-purple-500/40 text-purple-300 hover:bg-purple-500/20 text-xs font-bold flex items-center space-x-1.5"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Request Clarification</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const item = selectedDossier;
                    setSelectedDossier(null);
                    setRejectingId(item.id);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-bold flex items-center space-x-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const item = selectedDossier;
                    setSelectedDossier(null);
                    handleApproveChallenge(item);
                  }}
                  className="px-5 py-2 rounded-xl bg-navy hover:bg-navy-light text-white text-xs font-bold flex items-center space-x-1.5 shadow-float"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal" />
                  <span>Approve & Route to HEIs</span>
                </button>
              </div>
            </div>
          </div>
        </BottomSheet>
      )}
    </div>
  );
};

export default ValidationPortal;
