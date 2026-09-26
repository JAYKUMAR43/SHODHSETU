import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Award, 
  Search, 
  Filter, 
  ExternalLink, 
  CheckCircle2, 
  Building2, 
  GraduationCap, 
  FileCheck,
  Tag,
  ArrowLeft,
  Wrench,
  X,
  Check,
  ArrowRight,
  Copy
} from 'lucide-react';
import api from '../services/api';
import DemoDisclaimer from '../components/common/DemoDisclaimer';
import StatusBadge from '../components/common/StatusBadge';
import BottomSheet from '../components/common/BottomSheet';
import ProjectsMap from '../components/common/ProjectsMap';

const SECTORS = [
  { id: '', label: 'All Sectors' },
  { id: 'water_resources', label: 'Water Resources' },
  { id: 'agriculture', label: 'Agriculture' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'environment', label: 'Environment' },
  { id: 'energy', label: 'Energy' },
  { id: 'rural_livelihoods', label: 'Rural Livelihoods' },
  { id: 'education', label: 'Education' }
];

const PublicRegistry = () => {
  const { t } = useTranslation();
  const [outcomes, setOutcomes] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [loading, setLoading] = useState(true);

  // Post-Deployment Issue Reporting Modal State
  const [reportingOutcome, setReportingOutcome] = useState(null);
  const [issueForm, setIssueForm] = useState({ title: '', description: '', submitter_contact: '' });
  const [issueSubmitting, setIssueSubmitting] = useState(false);
  const [issueError, setIssueError] = useState(null);
  const [issueSuccess, setIssueSuccess] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    api.get('/districts').then(res => setDistricts(res.data)).catch(() => {});
  }, []);

  const loadOutcomes = () => {
    setLoading(true);
    let query = `/registry/outcomes?`;
    if (selectedDistrict) query += `district_id=${selectedDistrict}&`;
    if (selectedSector) query += `sector=${selectedSector}&`;

    api.get(query)
      .then(res => setOutcomes(res.data))
      .catch(err => console.error("Error fetching registry outcomes", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOutcomes();
  }, [selectedDistrict, selectedSector]);

  const getOutcomeTypeBadge = (type) => {
    switch (type) {
      case 'full_deployment':
        return <span className="bg-green/15 text-green border border-green-border px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase">Full Field Deployment</span>;
      case 'pilot_deployment':
        return <span className="bg-blue-500/20 text-blue-400 border border-blue-400/40 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase">Pilot Trial</span>;
      case 'patent_filed':
      case 'patent_granted':
        return <span className="bg-purple-500/15 text-purple-400 border border-purple-400/40 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase">Patent Certified</span>;
      case 'startup_created':
        return <span className="bg-amber/15 text-amber border border-amber-border px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase">Grassroots Startup</span>;
      default:
        return <span className="bg-white/[0.06] text-white border border-white/15 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase">{type?.replace(/_/g, ' ')}</span>;
    }
  };

  const handleOpenIssueReport = (outcome) => {
    setReportingOutcome(outcome);
    setIssueSuccess(null);
    setIssueError(null);
    setIssueForm({
      title: `Maintenance Issue: ${outcome.proposal_title}`,
      description: '',
      submitter_contact: ''
    });
  };

  const handleCloseIssueModal = () => {
    setReportingOutcome(null);
    setIssueSuccess(null);
    setIssueError(null);
    setCopiedId(false);
  };

  const handleSubmitIssueReport = async (e) => {
    e.preventDefault();
    if (!issueForm.title.trim() || !issueForm.description.trim()) {
      setIssueError("Please provide both an issue title and description.");
      return;
    }
    if (issueForm.description.trim().length < 15) {
      setIssueError("Please provide at least 15 characters describing the issue with the deployed solution.");
      return;
    }

    setIssueSubmitting(true);
    setIssueError(null);

    try {
      const payload = {
        title: issueForm.title.trim(),
        description: issueForm.description.trim(),
        submitter_contact: issueForm.submitter_contact.trim() || undefined,
        district_id: reportingOutcome.district_id || undefined
      };
      const res = await api.post(`/outcomes/${reportingOutcome.id}/report-issue`, payload);
      setIssueSuccess(res.data);
    } catch (err) {
      setIssueError(err.response?.data?.detail || err.message || "Failed to submit post-deployment issue report.");
    } finally {
      setIssueSubmitting(false);
    }
  };

  const handleCopyTrackingId = (id) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2500);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in-up">
      {/* Back Navigation */}
      <div className="flex items-center space-x-3">
        <Link
          to="/citizen"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors bg-white/[0.06] px-3 py-1.5 rounded-lg border border-white/10 shadow-float"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t('navbar.citizen_portal', 'Back to Citizen Hub')}</span>
        </Link>
        <span className="text-slate-300">•</span>
        <Link
          to="/"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-teal transition-colors"
        >
          <span>{t('landing.badge', 'Stakeholder Roles')}</span>
        </Link>
      </div>

      {/* Header */}
      <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-teal uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" />
            <span>Public Societal Innovation Repository</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-white">
            Verified Solution & Field Deployment Registry
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">
            Comprehensive archive of state-verified academic research breakthroughs, field deployments, and credited citizens.
          </p>
        </div>

        {/* Verification seal badge */}
        <div className="flex items-center space-x-2 bg-green/15 border border-green-border px-4 py-2 rounded-xl text-green text-xs font-semibold shadow-float">
          <CheckCircle2 className="w-4 h-4 text-green" />
          <span>State STI Verified Outcomes</span>
        </div>
      </div>

      {/* Illustrative Entities Disclaimer */}
      <DemoDisclaimer />

      {/* Statewide GIS Interactive Working Projects Map (Citizen View) */}
      <ProjectsMap 
        mode="all"
        title="Jharkhand State Working Projects & Deployments GIS Map"
        subtitle="Geographic visualization of all verified grassroots solutions, pilot trials, and academic field deployments across Jharkhand."
      />

      {/* Filter Bar */}
      <div className="card-glass p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-2 text-xs font-bold text-white">
          <Filter className="w-3.5 h-3.5 text-teal" />
          <span>Filter Registry:</span>
        </div>

        <div>
          <select
            value={selectedDistrict}
            onChange={e => setSelectedDistrict(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-white/15 text-xs focus:outline-none focus:ring-2 focus:ring-teal"
          >
            <option value="">All Jharkhand Districts</option>
            {districts.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedSector}
            onChange={e => setSelectedSector(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-white/15 text-xs focus:outline-none focus:ring-2 focus:ring-teal"
          >
            {SECTORS.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>

        <div className="ml-auto text-xs text-slate-500 font-medium">
          Showing {outcomes.length} verified outcome{outcomes.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* Grid of Verified Outcome Records */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs font-medium">Loading verified outcome registry...</div>
      ) : outcomes.length === 0 ? (
        <div className="empty-glass text-center space-y-2">
          <FileCheck className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-white">No outcomes matched the selected filters</h3>
          <p className="text-xs text-slate-500">Try selecting another district or domain sector above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {outcomes.map(item => (
            <div 
              key={item.id} 
              className="card-glass hover:shadow-float-hover transition-shadow flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {getOutcomeTypeBadge(item.outcome_type)}
                    <StatusBadge status={item.citizen_confirmation_status} />
                  </div>

                  <span className="text-[11px] font-mono text-slate-400">
                    {item.verified_at ? `Verified ${new Date(item.verified_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}` : 'Verified On-Record'}
                  </span>
                </div>

                <h3 className="font-heading font-bold text-base text-white leading-snug">
                  {item.proposal_title}
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed bg-white/[0.04] p-3 rounded-lg border border-white/10">
                  {item.claim_description}
                </p>

                <div className="pt-2 space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="w-3.5 h-3.5 text-teal flex-shrink-0" />
                    <span><strong>HEI Lead:</strong> {item.university_name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span><strong>Location:</strong> {item.district_name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Tag className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="capitalize"><strong>Sector:</strong> {item.category?.replace('_', ' ')}</span>
                  </div>
                  {item.original_reporter_credit && (
                    <div className="text-[11px] text-slate-300 bg-teal/5 px-2.5 py-1.5 rounded-lg border border-teal/20 mt-1">
                      Originally reported by: <strong className="text-teal">{item.original_reporter_credit}</strong>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {item.supporting_document_url && (
                  <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                    <span className="text-[11px] text-green font-semibold flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Evidence Attached</span>
                    </span>
                    <a
                      href={item.supporting_document_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-teal font-semibold hover:underline flex items-center space-x-1"
                    >
                      <span>Inspect Report</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* Post-Deployment Issue Reporting Button */}
                <button
                  onClick={() => handleOpenIssueReport(item)}
                  className="w-full py-2 px-3 rounded-lg border border-white/10 hover:border-amber-border hover:bg-amber-light text-slate-300 hover:text-amber-200 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all group"
                  title="If this deployed solution stopped working, report an issue to flag it for district re-evaluation"
                >
                  <Wrench className="w-3.5 h-3.5 text-amber group-hover:rotate-12 transition-transform" />
                  <span>Report an Issue with this Deployed Solution</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post-Deployment Issue Reporting Modal (using BottomSheet) */}
      {reportingOutcome && (
        <BottomSheet
          isOpen={Boolean(reportingOutcome)}
          onClose={handleCloseIssueModal}
          title="Report Post-Deployment Issue"
          subtitle={reportingOutcome.proposal_title}
          badge="Maintenance Report"
          icon={Wrench}
          maxWidth="lg"
        >
          {issueSuccess ? (
            <div className="space-y-4 py-2 text-xs">
              <div className="bg-green/15 border border-green-border rounded-xl p-4 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-green mx-auto" />
                <h4 className="font-heading font-bold text-sm text-green">
                  Maintenance Issue Dispatched
                </h4>
                <p className="text-xs text-slate-200 leading-relaxed">
                  Your issue has been linked to the original solution and submitted directly to District STI Officers for investigation.
                </p>
              </div>

              <div className="stat-glass rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Maintenance Tracking ID
                  </span>
                  <span className="font-mono text-base font-black text-white">
                    {issueSuccess.tracking_id}
                  </span>
                </div>
                <button
                  onClick={() => handleCopyTrackingId(issueSuccess.tracking_id)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/10 text-xs font-semibold text-slate-200 hover:bg-white/[0.04] transition-colors shadow-float"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-green" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedId ? 'Copied' : 'Copy ID'}</span>
                </button>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <Link
                  to={`/track?id=${issueSuccess.tracking_id}`}
                  onClick={handleCloseIssueModal}
                  className="w-full py-2.5 px-4 rounded-xl bg-navy hover:bg-navy-light text-white text-xs font-bold flex items-center justify-center space-x-2 transition-colors shadow-float"
                >
                  <span>Track Maintenance Status</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitIssueReport} className="space-y-4 text-xs">
              <p className="text-slate-300 leading-relaxed bg-amber-light p-3 rounded-xl border border-amber-border">
                If this verified system has encountered operational failure, leakage, or breakdown on site, report the symptoms here to alert district officers.
              </p>

              <div className="bg-white/[0.04] p-3 rounded-xl border border-white/10 text-xs space-y-1">
                <div className="text-[11px] text-slate-400 font-semibold uppercase">Deployed Solution Context:</div>
                <div className="font-bold text-white">{reportingOutcome.proposal_title}</div>
                <div className="text-slate-500 text-[11px]">{reportingOutcome.university_name} • {reportingOutcome.district_name}</div>
              </div>

              {issueError && (
                <div className="bg-red/15 border border-red-border rounded-xl p-3 text-xs text-red">
                  {issueError}
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Issue Summary *
                </label>
                <input
                  type="text"
                  required
                  value={issueForm.title}
                  onChange={e => setIssueForm({ ...issueForm, title: e.target.value })}
                  placeholder="e.g. Filter cartridge blocked, water flow stopped"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-white/15 focus:outline-none focus:ring-2 focus:ring-teal"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Detailed Failure Description *
                </label>
                <textarea
                  rows={4}
                  required
                  value={issueForm.description}
                  onChange={e => setIssueForm({ ...issueForm, description: e.target.value })}
                  placeholder="Explain when the defect occurred, symptoms, current output, and local consequences..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-white/15 focus:outline-none focus:ring-2 focus:ring-teal resize-none leading-relaxed"
                />
                <span className="text-[10px] text-slate-400">Minimum 15 characters describing what broke or ceased functioning.</span>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Your Contact Phone / Email
                </label>
                <input
                  type="text"
                  value={issueForm.submitter_contact}
                  onChange={e => setIssueForm({ ...issueForm, submitter_contact: e.target.value })}
                  placeholder="+91 98765 43210 or local.rep@jharkhand.gov.in"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-white/15 focus:outline-none focus:ring-2 focus:ring-teal"
                />
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleCloseIssueModal}
                  className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/[0.04] text-slate-300 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={issueSubmitting}
                  className="px-4 py-2 rounded-xl bg-navy hover:bg-navy-light text-white text-xs font-bold flex items-center space-x-1.5 transition-colors disabled:opacity-50 shadow-float"
                >
                  <Wrench className="w-3.5 h-3.5 text-teal" />
                  <span>{issueSubmitting ? "Submitting..." : "Submit Maintenance Issue"}</span>
                </button>
              </div>
            </form>
          )}
        </BottomSheet>
      )}
    </div>
  );
};

export default PublicRegistry;
