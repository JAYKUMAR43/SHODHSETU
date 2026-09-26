import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Sparkles, 
  MapPin, 
  ArrowLeft, 
  MessageSquare, 
  Send, 
  PauseCircle, 
  ThumbsUp, 
  ThumbsDown, 
  ExternalLink 
} from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/common/StatusBadge';

const TrackChallenge = () => {
  const { t } = useTranslation();
  const { id: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const initialId = paramId || searchParams.get('id') || '';
  const [trackingId, setTrackingId] = useState(initialId);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  // Clarification response form state
  const [responseText, setResponseText] = useState('');
  const [responsePhotoUrl, setResponsePhotoUrl] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [responseSuccess, setResponseSuccess] = useState(false);

  // Citizen Outcome Confirmation Loop State
  const [confirmChoice, setConfirmChoice] = useState(null); // true or false
  const [confirmComment, setConfirmComment] = useState('');
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);
  const [confirmFeedbackMsg, setConfirmFeedbackMsg] = useState('');

  const fetchStatus = async (idToSearch) => {
    const id = (idToSearch || trackingId).trim();
    if (!id) return;
    setLoading(true);
    setError('');
    setData(null);

    try {
      const res = await api.get(`/challenges/track/${id}`);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Tracking ID not found. Please verify the code (e.g. SS-1001).');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const activeId = paramId || searchParams.get('id');
    if (activeId) {
      setTrackingId(activeId);
      fetchStatus(activeId);
    }
  }, [paramId, searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchStatus();
  };

  const handleClarificationSubmit = async (e) => {
    e.preventDefault();
    if (!data || !responseText.trim()) return;
    setSubmittingResponse(true);
    try {
      await api.post(`/challenges/track/${data.tracking_id}/respond-info`, {
        response_text: responseText.trim(),
        photo_url: responsePhotoUrl.trim() || null
      });
      setResponseSuccess(true);
      setResponseText('');
      setResponsePhotoUrl('');
      setTimeout(() => {
        fetchStatus(data.tracking_id);
        setResponseSuccess(false);
      }, 1500);
    } catch (err) {
      alert("Error submitting clarification: " + (err.response?.data?.detail || err.message));
    } finally {
      setSubmittingResponse(false);
    }
  };

  const handleOutcomeConfirmation = async (confirmed) => {
    if (!data) return;
    setConfirmSubmitting(true);
    setConfirmFeedbackMsg('');
    try {
      await api.post(`/challenges/track/${data.tracking_id}/confirm-outcome`, {
        confirmed: confirmed,
        comment: confirmComment.trim() || null
      });
      setConfirmFeedbackMsg(confirmed ? 'Thank you! Your positive feedback confirms the solution is working.' : 'Feedback recorded! District officers alerted to operational issues.');
      setTimeout(() => {
        fetchStatus(data.tracking_id);
      }, 1500);
    } catch (err) {
      alert("Error submitting outcome confirmation: " + (err.response?.data?.detail || err.message));
    } finally {
      setConfirmSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in-up">
      {/* Back Navigation */}
      <div className="flex items-center space-x-3">
        <Link
          to="/citizen"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors bg-white/[0.06] px-3 py-1.5 rounded-lg border border-white/10 shadow-float"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t('nav.back_to_citizen', 'Back to Citizen Hub')}</span>
        </Link>
        <span className="text-slate-300">•</span>
        <Link
          to="/"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-teal transition-colors"
        >
          <span>{t('nav.stakeholder_roles', 'Stakeholder Roles')}</span>
        </Link>
      </div>

      {/* Header & Search Bar */}
      <div className="panel-glass p-6 sm:p-8 space-y-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-white">
            Track Challenge Resolution Status
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">
            Enter your official challenge tracking ID to monitor milestone validation, university research, and deployment.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              required
              placeholder="Enter tracking ID (e.g. SS-1001)"
              value={trackingId}
              onChange={e => setTrackingId(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0F223D] border border-slate-700 text-white placeholder-slate-400 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-lg bg-teal hover:bg-teal-hover text-navy font-bold text-sm transition-all shadow-sm disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Track Status'}
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-[11px] text-slate-400">Quick Samples:</span>
          {['SS-1001', 'SS-2099', 'SS-3001', 'SS-4821'].map(id => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setTrackingId(id);
                fetchStatus(id);
              }}
              className="px-2.5 py-0.5 rounded-lg bg-white/[0.06] hover:bg-teal/20 text-slate-200 font-mono text-[11px] border border-white/10 transition-colors"
            >
              {id}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red/15 border border-red/40 text-red text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tracking Result View */}
      {data && (
        <div className="bg-white/[0.06] rounded-2xl border border-white/10 shadow-float p-6 sm:p-8 space-y-8">
          {/* Top Metadata */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-6 border-b border-white/10">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-1.5">
                <span className="text-xl font-heading font-black text-teal font-mono">{data.tracking_id}</span>
                <StatusBadge status={data.status} />
              </div>
              <h2 className="text-lg font-heading font-bold text-white">{data.title}</h2>
              <div className="text-xs text-slate-500 capitalize mt-1">
                Domain: <strong>{data.category?.replace(/_/g, ' ')}</strong> • Reported: {new Date(data.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                {data.original_reporter_credit && (
                  <span className="block mt-1 text-slate-200">
                    Originally reported by: <strong className="text-teal font-semibold">{data.original_reporter_credit}</strong>
                  </span>
                )}
              </div>
            </div>

            {data.duplicate_count > 0 && (
              <div className="bg-amber-light border border-amber-border px-3 py-2 rounded-xl text-amber text-xs">
                <div className="font-bold">Crowdsourced Cluster</div>
                <div>{data.duplicate_count} similar reports linked within 500m</div>
              </div>
            )}
          </div>

          {/* BACKWARD LINK TO DEPLOYED SOLUTION (If tracking an issue on a deployed solution) */}
          {data.related_outcome && (
            <div className="bg-amber-light border-2 border-amber-border rounded-2xl p-5 space-y-2 text-amber-200 shadow-float">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-heading font-bold text-sm text-amber-200 block">
                    Post-Deployment Maintenance Issue:
                  </span>
                  <p className="text-xs text-amber-200 font-medium">
                    "{data.related_outcome.proposal_title}" ({data.related_outcome.outcome_type?.replace(/_/g, ' ')})
                  </p>
                  <p className="text-xs sm:text-sm text-amber bg-white/[0.06] p-2.5 rounded-xl border border-amber/40">
                    {data.related_outcome.claim_description}
                  </p>
                  <div className="pt-1">
                    <Link
                      to="/registry"
                      className="inline-flex items-center space-x-1.5 text-xs font-bold text-white hover:text-teal transition-colors underline"
                    >
                      <span>View Original Outcome in Registry</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CITIZEN OUTCOME CONFIRMATION LOOP */}
          {data.linked_outcome && data.linked_outcome.verification_status === 'verified' && (
            <div className="rounded-2xl border-2 p-6 space-y-4 shadow-float transition-all bg-gradient-to-br from-teal/5 via-white to-canvas border-teal/40">
              <div className="flex items-start justify-between gap-3 border-b border-teal/20 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-teal" />
                    <h3 className="font-heading font-bold text-sm text-white">
                      Citizen Field Outcome Verification
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300">
                    A solution has been verified and deployed on site. As a local community member, is this system actively functioning?
                  </p>
                </div>

                <StatusBadge status={data.linked_outcome.citizen_confirmation_status} />
              </div>

              {/* Show Confirmation Actions if Pending */}
              {data.linked_outcome.citizen_confirmation_status === 'pending' ? (
                <div className="space-y-4 pt-1">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => setConfirmChoice(true)}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border flex items-center justify-center space-x-2 transition-all ${
                        confirmChoice === true
                          ? 'bg-green text-white border-green shadow-md ring-2 ring-green-border'
                          : 'bg-white/[0.06] text-green border-green-border hover:bg-green/15'
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>Yes, the solution is working</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfirmChoice(false)}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border flex items-center justify-center space-x-2 transition-all ${
                        confirmChoice === false
                          ? 'bg-red text-white border-red shadow-md ring-2 ring-red-border'
                          : 'bg-white/[0.06] text-red border-red-border hover:bg-red/15'
                      }`}
                    >
                      <ThumbsDown className="w-4 h-4" />
                      <span>No, there are issues on the ground</span>
                    </button>
                  </div>

                  {confirmChoice !== null && (
                    <div className="space-y-3 bg-white/[0.06] p-4 rounded-xl border border-white/10">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Community Comments / Observation Details
                        </label>
                        <textarea
                          rows={2}
                          value={confirmComment}
                          onChange={e => setConfirmComment(e.target.value)}
                          placeholder="Describe the current operational state, water quality, or equipment performance..."
                          className="w-full px-3 py-2 rounded-xl border border-white/15 text-xs focus:ring-2 focus:ring-teal focus:outline-none"
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          disabled={confirmSubmitting}
                          onClick={() => handleOutcomeConfirmation(confirmChoice)}
                          className="px-5 py-2 rounded-xl bg-navy hover:bg-navy-light text-white font-bold text-xs transition-colors disabled:opacity-50 shadow-float"
                        >
                          {confirmSubmitting ? 'Submitting Feedback...' : 'Submit Ground Confirmation'}
                        </button>
                      </div>
                    </div>
                  )}

                  {confirmFeedbackMsg && (
                    <div className="p-3 bg-teal/10 border border-teal/30 rounded-xl text-xs font-bold text-teal-dark text-center">
                      {confirmFeedbackMsg}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-300 bg-white/[0.06] p-3.5 rounded-xl border border-white/10 space-y-1">
                  <span className="font-bold text-white block">Citizen Ground Verification Note:</span>
                  <p className="italic text-slate-200">
                    "{data.linked_outcome.citizen_confirmation_comment || (data.linked_outcome.citizen_confirmation_status === 'confirmed_working' ? 'Verified working smoothly in the local community.' : 'Citizen reported operational defects on-site.')}"
                  </p>
                </div>
              )}
            </div>
          )}

          {/* CLARIFICATION REQUESTED BANNER & RESPONSE FORM */}
          {data.info_request_message && (
            <div className="bg-purple-50 rounded-2xl border-2 border-purple-400/40 p-6 space-y-4 shadow-float">
              <div className="flex items-start space-x-3 text-purple-300">
                <MessageSquare className="w-5 h-5 text-purple-300 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-heading font-bold text-sm text-purple-200">
                    District Validation Officer Requested Clarification
                  </h3>
                  <p className="text-xs text-purple-400 italic bg-white/[0.06] p-3 rounded-xl border border-purple-400/40">
                    "{data.info_request_message}"
                  </p>
                </div>
              </div>

              {/* If citizen already responded */}
              {data.citizen_response_text ? (
                <div className="bg-white/[0.06] p-4 rounded-xl border border-purple-400/40 space-y-1.5 text-xs text-slate-200">
                  <div className="flex items-center space-x-1.5 text-green font-bold">
                    <CheckCircle2 className="w-4 h-4 text-green" />
                    <span>Your Clarification Response has been recorded:</span>
                  </div>
                  <p className="text-white bg-white/[0.04] p-2.5 rounded-lg border border-white/10">
                    {data.citizen_response_text}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    The challenge has resumed in the district officer's validation queue.
                  </p>
                </div>
              ) : (
                /* Clarification Response Form */
                <form onSubmit={handleClarificationSubmit} className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-purple-200 mb-1">
                      Your Response / Clarification Details *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={responseText}
                      onChange={e => setResponseText(e.target.value)}
                      placeholder="Provide the requested details (landmark, symptoms, operational timing, local contacts)..."
                      className="w-full px-3 py-2 rounded-xl border border-purple-400/40 bg-white/[0.06] text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-purple-200 mb-1">
                      Optional Photo URL / Evidence
                    </label>
                    <input
                      type="url"
                      value={responsePhotoUrl}
                      onChange={e => setResponsePhotoUrl(e.target.value)}
                      placeholder="https://.../photo.jpg"
                      className="w-full px-3 py-2 rounded-xl border border-purple-400/40 bg-white/[0.06] text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  {responseSuccess && (
                    <div className="p-3 bg-green/15 text-green rounded-xl text-xs font-bold text-center border border-green-border">
                      Clarification submitted successfully! Updating status...
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingResponse}
                      className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs transition-colors shadow-float flex items-center space-x-1.5 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{submittingResponse ? 'Submitting...' : 'Submit Clarification & Resume SLA'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* 5-Step Visual Timeline */}
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-6">
              Official Resolution Timeline
            </h3>
            <div className="relative border-l-2 border-white/10 ml-4 space-y-8 pl-6">
              {data.timeline?.map((step, idx) => (
                <div key={idx} className="relative">
                  <div className={`absolute -left-[33px] top-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    step.completed 
                      ? 'bg-green border-green text-white shadow-float' 
                      : 'bg-white/[0.06] border-white/15 text-slate-300'
                  }`}>
                    {step.completed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>}
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${step.completed ? 'text-teal' : 'text-slate-400'}`}>
                        {step.step}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {step.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Structured Problem Brief */}
          {data.ai_generated_brief && (
            <div className="bg-white/[0.04] rounded-xl p-5 border border-white/10 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-teal-dark">
                <Sparkles className="w-4 h-4 text-teal" />
                <span>AI Structured Academic Problem Brief</span>
              </div>
              <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-line font-sans">
                {data.ai_generated_brief}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TrackChallenge;
