import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  BarChart3, 
  ShieldAlert, 
  CheckCircle2, 
  Award, 
  Building2, 
  GraduationCap, 
  Sparkles, 
  AlertTriangle, 
  Clock, 
  ExternalLink,
  Layers,
  Filter,
  FileCheck,
  TrendingUp,
  RefreshCw,
  Download,
  PlusCircle,
  UserPlus,
  Copy,
  Check,
  X,
  Users,
  Search,
  FileText,
  MapPin 
} from 'lucide-react';
import api, { getFileUrl } from '../services/api';
import DemoDisclaimer from '../components/common/DemoDisclaimer';
import GenerateReportModal from '../components/common/GenerateReportModal';
import ProjectsMap from '../components/common/ProjectsMap';
import { PhotoLightbox } from '../components/common/MediaViewer';

const GovernmentDashboard = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview'); // overview, escalations, verification, institutions, manage, briefing, reports

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);
  const [analytics, setAnalytics] = useState(null);
  const [escalations, setEscalations] = useState([]);
  const [pendingOutcomes, setPendingOutcomes] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [industryPartners, setIndustryPartners] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [scanningPatterns, setScanningPatterns] = useState(false);
  const [patternFilter, setPatternFilter] = useState('active'); // 'active', 'acknowledged', 'all'
  const [briefing, setBriefing] = useState(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [districtBriefing, setDistrictBriefing] = useState(null);
  const [briefingFetching, setBriefingFetching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Submitted Reports Tab State (Step 5)
  const [submittedReports, setSubmittedReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsRoleFilter, setReportsRoleFilter] = useState('all');
  const [reportsEntityFilter, setReportsEntityFilter] = useState('all');
  const [reportsPeriodFilter, setReportsPeriodFilter] = useState('all');
  const [reportsSearch, setReportsSearch] = useState('');

  // Filters
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');

  // Report generation modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [evidenceLightboxUrl, setEvidenceLightboxUrl] = useState(null);

  // Directory & Onboarding (Feature B)
  const [directory, setDirectory] = useState({ universities: [], industry_partners: [], validation_officers: [], districts: [] });
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [manageSubTab, setManageSubTab] = useState('universities'); // universities, industry, officers

  // Modals
  const [showUniModal, setShowUniModal] = useState(false);
  const [showIndModal, setShowIndModal] = useState(false);
  const [showOfficerModal, setShowOfficerModal] = useState(false);
  const [onboardSuccess, setOnboardSuccess] = useState(null);
  const [copiedPass, setCopiedPass] = useState(false);

  // Form states
  const [uniForm, setUniForm] = useState({ university_name: '', district_id: '', coordinator_name: '', coordinator_email: '' });
  const [indForm, setIndForm] = useState({ partner_name: '', partner_type: 'large_industry', csr_focus_areas: '', district_id: '', contact_name: '', contact_email: '' });
  const [officerForm, setOfficerForm] = useState({ officer_name: '', officer_email: '', district_id: '' });
  const [formSubmitting, setFormSubmitting] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [distRes, analRes, escRes, outRes, uniRes, indRes, patRes] = await Promise.all([
        api.get('/districts'),
        api.get(`/admin/analytics/overview${selectedDistrict ? `?district_id=${selectedDistrict}` : ''}`),
        api.get('/admin/escalations'),
        api.get('/admin/outcomes/pending-verification'),
        api.get('/admin/universities'),
        api.get('/admin/industry-partners'),
        api.get('/admin/patterns')
      ]);
      setDistricts(distRes.data || []);
      setAnalytics(analRes.data || {});
      setEscalations(escRes.data || []);
      setPendingOutcomes(outRes.data || []);
      setUniversities(uniRes.data || []);
      setIndustryPartners(indRes.data || []);
      setPatterns(patRes.data || []);
    } catch (err) {
      console.error("Error loading admin dashboard", err);
      setFetchError(err.response?.data?.detail || err.message || "Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgePattern = async (patternId) => {
    try {
      await api.patch(`/admin/patterns/${patternId}/acknowledge`);
      setPatterns(prev => prev.map(p => p.id === patternId ? { ...p, status: 'acknowledged' } : p));
    } catch (err) {
      alert("Error acknowledging pattern: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleScanPatterns = async () => {
    setScanningPatterns(true);
    try {
      await api.post('/admin/patterns/scan');
      const res = await api.get('/admin/patterns');
      setPatterns(res.data || []);
    } catch (err) {
      alert("Error scanning cross-district patterns: " + (err.response?.data?.detail || err.message));
    } finally {
      setScanningPatterns(false);
    }
  };

  const loadDirectory = async () => {
    setDirectoryLoading(true);
    try {
      const res = await api.get('/admin/directory');
      setDirectory(res.data);
    } catch (err) {
      console.error("Failed to load directory", err);
    } finally {
      setDirectoryLoading(false);
    }
  };

  const fetchDistrictBriefing = async (force = false) => {
    setBriefingFetching(true);
    try {
      const q = selectedDistrict ? `district_id=${selectedDistrict}&force_refresh=${force}` : `force_refresh=${force}`;
      const res = await api.get(`/admin/analytics/briefing?${q}`);
      setDistrictBriefing(res.data);
    } catch (err) {
      console.error("Failed to load district briefing", err);
    } finally {
      setBriefingFetching(false);
    }
  };

  useEffect(() => {
    loadAll();
    fetchDistrictBriefing(false);
  }, [selectedDistrict]);

  const handleDomainFilterChange = (newRole) => {
    setReportsRoleFilter(newRole);
    setReportsEntityFilter('all');
  };

  useEffect(() => {
    if (activeTab === 'manage') {
      loadDirectory();
    }
    if (activeTab === 'reports') {
      loadSubmittedReports();
    }
  }, [activeTab, reportsRoleFilter, reportsPeriodFilter, reportsEntityFilter, reportsSearch]);

  const loadSubmittedReports = async () => {
    setReportsLoading(true);
    try {
      const params = new URLSearchParams();
      if (reportsRoleFilter && reportsRoleFilter !== 'all') params.append('role', reportsRoleFilter);
      if (reportsPeriodFilter && reportsPeriodFilter !== 'all') params.append('period_type', reportsPeriodFilter);
      if (reportsEntityFilter && reportsEntityFilter !== 'all') params.append('entity_name', reportsEntityFilter);
      if (reportsSearch.trim()) params.append('search', reportsSearch.trim());
      const res = await api.get(`/admin/reports?${params.toString()}`);
      setSubmittedReports(res.data || []);
    } catch (err) {
      console.error("Failed to load submitted reports", err);
    } finally {
      setReportsLoading(false);
    }
  };

  const handleFetchBriefing = async () => {
    setBriefingLoading(true);
    try {
      const res = await api.get(`/admin/briefing${selectedDistrict ? `?district_id=${selectedDistrict}` : ''}`);
      setBriefing(res.data);
    } catch (err) {
      alert("Error generating state briefing note: " + (err.response?.data?.detail || err.message));
    } finally {
      setBriefingLoading(false);
    }
  };

  const handleVerifyOutcome = async (id, action) => {
    try {
      await api.patch(`/admin/outcomes/${id}/verify?action=${action}`);
      alert(action === 'approve' 
        ? "Attestation recorded. Outcome successfully verified & published to public registry." 
        : "Outcome claim rejected."
      );
      loadAll();
    } catch (err) {
      alert("Verification error: " + (err.response?.data?.detail || err.message));
    }
  };

  // Onboarding submissions
  const handleOnboardUniversity = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      const payload = {
        university_name: uniForm.university_name,
        district_id: parseInt(uniForm.district_id),
        coordinator_name: uniForm.coordinator_name,
        coordinator_email: uniForm.coordinator_email
      };
      const res = await api.post('/admin/onboard/university', payload);
      setShowUniModal(false);
      setUniForm({ university_name: '', district_id: '', coordinator_name: '', coordinator_email: '' });
      setOnboardSuccess({
        role: 'University Coordinator',
        name: res.data.coordinator_name,
        entity: res.data.university_name,
        email: res.data.coordinator_email,
        tempPassword: res.data.temporary_password,
        note: 'Shodhganga research expertise graph pre-populated with departments & faculty.'
      });
      loadDirectory();
      loadAll();
    } catch (err) {
      alert("Onboarding error: " + (err.response?.data?.detail || err.message));
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleOnboardIndustry = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      const areas = indForm.csr_focus_areas.split(',').map(s => s.trim()).filter(Boolean);
      const payload = {
        partner_name: indForm.partner_name,
        partner_type: indForm.partner_type,
        csr_focus_areas: areas,
        district_id: indForm.district_id ? parseInt(indForm.district_id) : null,
        contact_name: indForm.contact_name,
        contact_email: indForm.contact_email
      };
      const res = await api.post('/admin/onboard/industry', payload);
      setShowIndModal(false);
      setIndForm({ partner_name: '', partner_type: 'large_industry', csr_focus_areas: '', district_id: '', contact_name: '', contact_email: '' });
      setOnboardSuccess({
        role: 'Industry / CSR Lead',
        name: res.data.contact_name,
        entity: res.data.partner_name,
        email: res.data.contact_email,
        tempPassword: res.data.temporary_password,
        note: 'Eligible for CSR proposal review and bi-lateral IP agreements.'
      });
      loadDirectory();
      loadAll();
    } catch (err) {
      alert("Onboarding error: " + (err.response?.data?.detail || err.message));
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleOnboardOfficer = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      const payload = {
        officer_name: officerForm.officer_name,
        officer_email: officerForm.officer_email,
        district_id: parseInt(officerForm.district_id)
      };
      const res = await api.post('/admin/onboard/validation-officer', payload);
      setShowOfficerModal(false);
      setOfficerForm({ officer_name: '', officer_email: '', district_id: '' });
      setOnboardSuccess({
        role: 'District STI Nodal Officer',
        name: res.data.officer_name,
        entity: res.data.district_name,
        email: res.data.officer_email,
        tempPassword: res.data.temporary_password,
        note: 'Assigned to district validation queue with 48-hour SLA clock.'
      });
      loadDirectory();
    } catch (err) {
      alert("Onboarding error: " + (err.response?.data?.detail || err.message));
    } finally {
      setFormSubmitting(false);
    }
  };

  // Safe Loading Guard (Fix 5 Crash Prevention)
  if (loading && !analytics) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-10 h-10 text-teal animate-spin" />
        <div className="text-center">
          <h3 className="text-base font-bold text-white">Loading State STI Administration Portal...</h3>
          <p className="text-xs text-slate-500 mt-1">Aggregating statewide telemetry, SLA queues, and institutional indexes</p>
        </div>
      </div>
    );
  }

  // Error Guard (Fix 5 Crash Prevention)
  if (fetchError && !analytics) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white/[0.06] rounded-2xl border border-red-500/30 text-center space-y-4 shadow-float">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
        <h3 className="text-base font-bold text-white">Unable to load STI Analytics</h3>
        <p className="text-xs text-slate-300">{fetchError}</p>
        <button 
          onClick={loadAll} 
          className="px-5 py-2.5 bg-navy text-white rounded-xl text-xs font-bold hover:bg-navy-light transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Dynamic Entity Options for Option Bar 2 (Submitted Reports)
  const entityOptions = (() => {
    if (reportsRoleFilter === 'university') {
      const fromDir = (directory.universities?.length ? directory.universities : universities).map(u => u.name);
      const fromReports = submittedReports
        .filter(r => r.generated_by_role === 'university')
        .map(r => {
          const match = r.generated_by_name?.match(/^([^(—]+)/);
          return match ? match[1].trim() : r.generated_by_name;
        });
      return Array.from(new Set([...fromDir, ...fromReports])).filter(Boolean).sort();
    }
    if (reportsRoleFilter === 'industry') {
      const fromDir = (directory.industry_partners?.length ? directory.industry_partners : industryPartners).map(p => p.name);
      const fromReports = submittedReports
        .filter(r => r.generated_by_role === 'industry')
        .map(r => {
          const match = r.generated_by_name?.match(/^([^(—]+)/);
          return match ? match[1].trim() : r.generated_by_name;
        });
      return Array.from(new Set([...fromDir, ...fromReports])).filter(Boolean).sort();
    }
    if (reportsRoleFilter === 'validation_officer') {
      const fromDistricts = (directory.districts?.length ? directory.districts : districts).map(d => `${d.name} District`);
      const fromReports = submittedReports
        .filter(r => r.generated_by_role === 'validation_officer')
        .map(r => {
          const match = r.generated_by_name?.match(/^([^(—]+)/);
          return match ? match[1].trim() : r.generated_by_name;
        });
      return Array.from(new Set([...fromDistricts, ...fromReports])).filter(Boolean).sort();
    }
    // all domains
    const allEntities = submittedReports.map(r => {
      const match = r.generated_by_name?.match(/^([^(—]+)/);
      return match ? match[1].trim() : r.generated_by_name;
    });
    return Array.from(new Set(allEntities)).filter(Boolean).sort();
  })();

  const displayedReports = submittedReports.filter(rep => {
    if (reportsEntityFilter && reportsEntityFilter !== 'all') {
      const target = reportsEntityFilter.toLowerCase();
      const repName = (rep.generated_by_name || '').toLowerCase();
      if (!repName.includes(target)) return false;
    }
    if (reportsSearch.trim()) {
      const target = reportsSearch.trim().toLowerCase();
      const repName = (rep.generated_by_name || '').toLowerCase();
      const idStr = String(rep.id);
      if (!repName.includes(target) && !idStr.includes(target)) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in-up">
      {/* Top Banner */}
      <div className="panel-glass p-6 sm:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-teal uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>State Directorate of Higher & Technical Education</span>
          </div>
          <h1 className="text-2xl font-heading font-extrabold text-white">
            Jharkhand Societal STI Oversight Dashboard
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">
            Real-time analytics across districts, SLA escalation alerts, institutional trust indexes, and independent outcome verification.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* District Filter */}
          <div className="flex items-center space-x-2 bg-white/[0.04] p-1.5 rounded-xl border border-white/10">
            <span className="text-[11px] font-bold text-slate-500 pl-2">Scope:</span>
            <select
              value={selectedDistrict}
              onChange={e => setSelectedDistrict(e.target.value)}
              className="input-glass text-xs font-medium py-1.5 px-2.5 rounded-lg"
            >
              <option value="">All Jharkhand State</option>
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
              title="Generate State Executive Progress Report PDF"
            >
              <Download className="w-3.5 h-3.5 text-teal" />
              <span>Generate Executive Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Illustrative Entities Disclaimer */}
      <DemoDisclaimer />

      {/* Navigation Tabs */}
      <div className="flex border-b border-white/10 space-x-2 sm:space-x-4 overflow-x-auto">
        {[
          { id: 'overview', label: 'Analytics Overview', icon: TrendingUp },
          { id: 'gis_map', label: 'GIS Project Map', icon: MapPin },
          { 
            id: 'escalations', 
            label: `SLA & Patterns (${escalations.length + patterns.filter(p => p.status === 'active').length})`, 
            icon: AlertTriangle, 
            alert: escalations.length > 0 || patterns.some(p => p.status === 'active') 
          },
          { id: 'verification', label: `Outcome Verification (${pendingOutcomes.length})`, icon: Award, alert: pendingOutcomes.length > 0 },
          { id: 'institutions', label: 'HEIs & CSR Partners', icon: Building2 },
          { id: 'manage', label: 'Manage & Directory', icon: Users },
          { id: 'reports', label: 'Submitted Reports', icon: FileCheck },
          { id: 'briefing', label: 'Executive AI Briefing', icon: Sparkles }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-teal text-teal'
                  : 'border-transparent text-slate-500 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4 text-teal" />
              <span>{tab.label}</span>
              {tab.alert && (
                <span className="w-2 h-2 rounded-full bg-red-flagged animate-pulse"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && analytics && (
        <div className="space-y-6">
          {/* Top AI District Briefing Note Component */}
          <div className="bg-gradient-to-b from-[#0F223D]/95 via-[#0B192C]/95 to-[#081220]/95 border border-teal/30 rounded-2xl p-6 shadow-lvl2 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-teal/20 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-teal text-navy flex items-center justify-center font-bold shadow-inner">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-heading font-extrabold text-white flex items-center space-x-2">
                    <span>District Executive Briefing Synthesis</span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal/20 text-teal-300 font-mono">
                      {districtBriefing?.district_name || 'Jharkhand State'}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-300">
                    Live autonomous AI briefing generated from field submissions, DVO queues, and researcher matches
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {districtBriefing && (
                  <div className="text-right hidden sm:block">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                      districtBriefing.is_cached ? 'bg-amber-500/20 text-amber-300' : 'bg-green-500/20 text-green-300'
                    }`}>
                      {districtBriefing.is_cached ? '⚡ Cached (24h TTL)' : '✨ Live Synthesized'}
                    </span>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {districtBriefing.generated_at ? new Date(districtBriefing.generated_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </div>
                )}
                <button
                  onClick={() => fetchDistrictBriefing(true)}
                  disabled={briefingFetching}
                  className="px-3.5 py-2 rounded-lg bg-navy hover:bg-navy-light text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-50 shadow-float"
                  title="Force re-generation with AI"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-teal ${briefingFetching ? 'animate-spin' : ''}`} />
                  <span>{briefingFetching ? 'Generating...' : 'Regenerate'}</span>
                </button>
              </div>
            </div>

            {briefingFetching ? (
              <div className="p-6 rounded-xl bg-[#0E1E34] border border-slate-700/60 space-y-3.5 animate-skeleton">
                <div className="flex items-center space-x-2 text-teal text-xs font-semibold">
                  <RefreshCw className="w-4 h-4 animate-spin text-teal" />
                  <span>AI Synthesis Engine: Distilling field telemetry & research matches...</span>
                </div>
                <div className="h-4 bg-slate-700/50 rounded w-3/4"></div>
                <div className="h-3 bg-slate-700/30 rounded w-full"></div>
                <div className="h-3 bg-slate-700/30 rounded w-5/6"></div>
                <div className="h-3 bg-slate-700/30 rounded w-2/3"></div>
              </div>
            ) : (districtBriefing?.briefing_text || districtBriefing?.summary_text) ? (
              <div className="text-xs sm:text-sm text-white leading-relaxed whitespace-pre-line font-sans bg-[#0E1E34] p-4 rounded-xl border border-slate-700/60">
                {districtBriefing.briefing_text || districtBriefing.summary_text}
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-6 text-center bg-[#0E1E34] rounded-xl border border-slate-700/40">
                Click "Regenerate" to generate an executive brief for this district.
              </div>
            )}
          </div>

          {/* Top Key Performance Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white/[0.06] p-5 rounded-xl border border-white/10 shadow-float space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Submissions</span>
              <div className="text-2xl font-black font-heading text-white">{analytics?.total_submissions || 0}</div>
              <div className="text-[11px] text-slate-500">Citizen & Panchayat reports</div>
            </div>

            <div className="bg-white/[0.06] p-5 rounded-xl border border-white/10 shadow-float space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">District Validated</span>
              <div className="text-2xl font-black font-heading text-teal-dark">{analytics?.validated_count || 0}</div>
              <div className="text-[11px] text-green-verified font-medium">Passed field pre-screen</div>
            </div>

            <div className="bg-white/[0.06] p-5 rounded-xl border border-white/10 shadow-float space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">HEI Research Teams</span>
              <div className="text-2xl font-black font-heading text-blue-400">{analytics?.in_research_count || 0}</div>
              <div className="text-[11px] text-slate-500">Faculty-student teams</div>
            </div>

            <div className="bg-white/[0.06] p-5 rounded-xl border border-white/10 shadow-float space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">CSR Co-Funded</span>
              <div className="text-2xl font-black font-heading text-purple-300">{analytics?.in_execution_count || 0}</div>
              <div className="text-[11px] text-slate-500">Active industry pilots</div>
            </div>

            <div className="bg-white/[0.06] p-5 rounded-xl border border-white/10 shadow-float space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Full Deployments</span>
              <div className="text-2xl font-black font-heading text-green-verified">{analytics?.deployed_count || 0}</div>
              <div className="text-[11px] text-slate-500">Grassroots operational</div>
            </div>
          </div>

          {/* Statewide Interactive GIS Project Map (Overview Tab) */}
          <ProjectsMap
            mode="all"
            title="Statewide Innovation & Deployment GIS Map"
            subtitle="Geospatial distribution of all active university research projects, CSR pilots, and verified grassroots solutions across Jharkhand's 24 districts."
          />

          {/* Domain Distribution Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/[0.06] p-6 rounded-xl border border-white/10 shadow-float space-y-4">
              <h3 className="font-heading font-bold text-sm text-white">
                Domain-Wise Societal Problem Distribution
              </h3>
              <div className="space-y-2.5">
                {Object.entries(analytics?.domain_distribution || {}).map(([key, val]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="capitalize text-slate-200">{key.replace(/_/g, ' ')}</span>
                      <span className="font-bold text-white">{val}</span>
                    </div>
                    <div className="h-2 w-full bg-white/[0.06] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-teal rounded-full" 
                        style={{ width: `${Math.min(100, ((val || 0) / (analytics?.total_submissions || 1)) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/[0.06] p-6 rounded-xl border border-white/10 shadow-float space-y-4">
              <h3 className="font-heading font-bold text-sm text-white">
                District-Wise Submission Concentration
              </h3>
              <div className="space-y-2.5">
                {Object.entries(analytics?.district_distribution || {}).map(([key, val]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-200 font-medium">{key}</span>
                      <span className="font-bold text-white">{val}</span>
                    </div>
                    <div className="h-2 w-full bg-white/[0.06] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-navy rounded-full" 
                        style={{ width: `${Math.min(100, ((val || 0) / (analytics?.total_submissions || 1)) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SLA ESCALATIONS & SYSTEMIC PATTERNS */}
      {activeTab === 'escalations' && (
        <div className="space-y-8">
          {/* Enhancement 2: Cross-District Pattern Alerts */}
          <div className="bg-white/[0.06] border border-purple-400/40 rounded-2xl p-6 shadow-float space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-purple-500/30 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-heading font-extrabold text-white flex items-center space-x-2">
                    <span>Cross-District Systemic Pattern Alerts</span>
                    <span className="text-[11px] font-normal px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30 font-mono font-bold">
                      {patterns.filter(p => p.status === 'active').length} Active
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Autonomous AI clustering across validated district challenges. Surfaces systemic challenges spanning 3+ distinct districts requiring state-level policy action or coordinated research.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 self-end sm:self-auto">
                <button
                  onClick={handleScanPatterns}
                  disabled={scanningPatterns}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors disabled:opacity-50 shadow-float"
                  title="Run AI pattern clustering across all validated challenges"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${scanningPatterns ? 'animate-spin' : ''}`} />
                  <span>{scanningPatterns ? 'Clustering...' : 'Scan Patterns Now'}</span>
                </button>
              </div>
            </div>

            {/* Pattern Sub-Filters */}
            <div className="flex items-center space-x-2 border-b border-white/10 pb-3">
              {[
                { id: 'active', label: `Active Alerts (${patterns.filter(p => p.status === 'active').length})` },
                { id: 'acknowledged', label: `Acknowledged (${patterns.filter(p => p.status === 'acknowledged').length})` },
                { id: 'all', label: `All Patterns (${patterns.length})` }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setPatternFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    patternFilter === f.id
                      ? 'bg-purple-600 text-white font-extrabold shadow-md'
                      : 'text-slate-300 hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Pattern Items Grid */}
            {(() => {
              const filteredPatterns = patterns.filter(p => {
                if (patternFilter === 'active') return p.status === 'active';
                if (patternFilter === 'acknowledged') return p.status === 'acknowledged';
                return true;
              });

              if (filteredPatterns.length === 0) {
                return (
                  <div className="p-8 rounded-xl border border-dashed border-white/10 text-center space-y-1.5 bg-white/[0.04]/50">
                    <Sparkles className="w-6 h-6 text-purple-400 mx-auto" />
                    <div className="text-xs font-bold text-white">No systemic cross-district patterns currently flagged</div>
                    <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                      Challenges are continuously scanned. When 3 or more distinct districts report similar challenges in the same sector, a systemic pattern alert will appear here.
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 gap-4">
                  {filteredPatterns.map(p => (
                    <div
                      key={p.id}
                      className={`p-5 rounded-xl border transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lvl2 ${
                        p.status === 'active'
                          ? 'border-purple-500/40 bg-gradient-to-br from-[#16122C] via-[#0E1F36] to-[#0A1628] shadow-[0_10px_30px_rgba(147,51,234,0.18)]'
                          : 'border-white/10 bg-[#0E1F36]/80 opacity-90'
                      }`}
                    >
                      <div className="space-y-2 max-w-3xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-extrabold uppercase ${
                            p.severity === 'critical' ? 'bg-red-500/20 text-red-300 border border-red-500/40' :
                            p.severity === 'high' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                            'bg-blue-500/20 text-blue-300 border border-blue-400/40'
                          }`}>
                            {p.severity} Severity
                          </span>
                          <span className="px-2 py-0.5 bg-white/[0.08] text-slate-200 border border-white/10 rounded text-[10px] font-bold capitalize">
                            {p.category.replace(/_/g, ' ')}
                          </span>
                          <span className="px-2.5 py-0.5 bg-purple-500/25 text-purple-200 border border-purple-400/40 rounded-full text-[10px] font-bold">
                            {p.district_count} Distinct Districts Affected
                          </span>
                          {p.status === 'active' ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-[10px] font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              <span>Active Alert</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-white/[0.06] text-slate-300 rounded-full text-[10px] font-semibold">
                              <Check className="w-3 h-3 text-slate-400" />
                              <span>Acknowledged</span>
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400 font-mono">
                            Detected {new Date(p.detected_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>

                        <h4 className="font-heading font-extrabold text-base text-white leading-snug">
                          {p.pattern_theme}
                        </h4>

                        {p.linked_challenge_ids && p.linked_challenge_ids.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-300 pt-1">
                            <span className="text-[11px] font-semibold text-slate-400">Linked Challenges:</span>
                            {p.linked_challenge_ids.map(cid => (
                              <span key={cid} className="px-2 py-0.5 bg-teal/15 rounded border border-teal/40 font-mono text-[10px] text-teal font-bold hover:bg-teal/25">
                                #{cid}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 shrink-0 self-end md:self-center">
                        {p.status === 'active' ? (
                          <button
                            onClick={() => handleAcknowledgePattern(p.id)}
                            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-float"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Acknowledge Pattern</span>
                          </button>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400 italic">
                            Acknowledged by State Admin
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Automated SLA Breach Escalations */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-xs flex items-start space-x-3 backdrop-blur-md">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300">Automated 48-Hour SLA Breach Escalations:</span>
              <p className="mt-0.5 text-amber-100/90 leading-relaxed">
                District Validation Officers must process submissions within 48 hours. Items listed below have breached this threshold (excluding time paused while waiting for citizen clarification) and require state administrative attention.
              </p>
            </div>
          </div>

          {escalations.length === 0 ? (
            <div className="empty-glass text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-green-verified mx-auto" />
              <div className="font-bold text-sm text-white">Zero SLA Breaches Active</div>
              <p className="text-xs text-slate-400">All district validation queues are currently operating within the 48-hour timeline.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {escalations.map(e => (
                <div key={e.id} className="bg-white/[0.06] p-5 rounded-xl border border-red-500/30 shadow-float flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-300 border border-red-500/40 rounded font-mono text-[10px] font-bold">
                        +{e.sla_breach_hours}h Overdue
                      </span>
                      <span className="text-xs text-slate-300 font-mono">ID: {e.tracking_id}</span>
                      <span className="text-xs font-bold text-teal">{e.district_name}</span>
                    </div>
                    <h4 className="font-bold text-sm text-white">{e.title}</h4>
                    <p className="text-xs text-slate-400 capitalize">Category: {e.category.replace(/_/g, ' ')} • Age: {e.age_hours} hours in queue</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-300">Priority Score</div>
                      <div className="text-lg font-black text-white">{e.priority_score}/100</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: OUTCOME VERIFICATION */}
      {activeTab === 'verification' && (
        <div className="space-y-4">
          <div className="bg-blue-500/20 border border-blue-400/40 rounded-xl p-4 text-xs text-blue-300 flex items-start space-x-3">
            <Award className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Independent State Outcome Verification:</span>
              <p className="mt-0.5 text-blue-400">
                To prevent false claims of success, academic teams must submit test evidence, deployment certificates, or patent filings for state verification before projects can be certified and published to the Innovation Registry.
              </p>
            </div>
          </div>

          {pendingOutcomes.length === 0 ? (
            <div className="empty-glass text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-green-verified mx-auto" />
              <div className="font-bold text-sm text-white">No Outcomes Awaiting Verification</div>
              <p className="text-xs text-slate-500">All submitted project outcome claims have been reviewed.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingOutcomes.map(o => (
                <div key={o.id} className="bg-white/[0.06] p-6 rounded-xl border border-white/10 shadow-float space-y-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-white/10 pb-3">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full bg-teal/10 text-teal-dark font-bold text-[10px] uppercase">
                        {o.outcome_type.replace(/_/g, ' ')}
                      </span>
                      <h4 className="font-bold text-base text-white mt-1">{o.proposal_title}</h4>
                      <p className="text-xs text-slate-400">Submitting HEI: {o.university_name} • Linked Challenge: {o.challenge_title}</p>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">Claimed: {new Date(o.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="bg-white/[0.04] p-4 rounded-lg text-xs text-slate-200">
                    <span className="font-bold text-white block mb-1">Claim Statement & Beneficiary Impact:</span>
                    {o.claim_description}
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
                    {o.supporting_document_url ? (
                      <button 
                        type="button"
                        onClick={() => setEvidenceLightboxUrl(o.supporting_document_url)}
                        className="inline-flex items-center space-x-1.5 text-xs text-teal font-bold hover:underline"
                      >
                        <FileCheck className="w-4 h-4" />
                        <span>Inspect Field Evidence / Test Certificate</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No external document attached</span>
                    )}

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleVerifyOutcome(o.id, 'reject')}
                        className="px-4 py-2 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/20 text-xs font-bold transition-colors"
                      >
                        Reject Claim
                      </button>
                      <button
                        onClick={() => handleVerifyOutcome(o.id, 'approve')}
                        className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-colors flex items-center space-x-1 shadow-float"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verify & Publish to Registry</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: DEDICATED STATEWIDE GIS MAP */}
      {activeTab === 'gis_map' && (
        <div className="space-y-6">
          <ProjectsMap
            mode="all"
            title="Jharkhand Statewide Innovation & Deployment GIS Map"
            subtitle="Full interactive geospatial visualization of verified working solutions, university-led field research, and corporate CSR deployments across all 24 districts."
          />
        </div>
      )}

      {/* TAB 4: HEIs & CSR PARTNERS */}
      {activeTab === 'institutions' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-heading font-bold text-sm text-white flex items-center space-x-2">
                <GraduationCap className="w-4 h-4 text-teal" />
                <span>Registered Academic Institutions ({universities.length})</span>
              </h3>
            </div>
            <div className="space-y-3">
              {universities.map(u => (
                <div key={u.id} className="card-glass p-4 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-xs text-white">{u.name}</div>
                    <div className="text-[11px] text-slate-400">{u.district_name} • {u.department_count} Departments</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-heading font-black text-white">{u.trust_score}/100</div>
                    <div className="text-[10px] text-green-verified font-semibold capitalize">{u.registration_status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-heading font-bold text-sm text-white flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-teal" />
                <span>Corporate & Industry Partners ({industryPartners.length})</span>
              </h3>
            </div>
            <div className="space-y-3">
              {industryPartners.map(p => (
                <div key={p.id} className="card-glass p-4 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-xs text-white">{p.name}</div>
                    <div className="text-[11px] text-slate-400 capitalize">{p.partner_type.replace(/_/g, ' ')} • {p.district_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-heading font-black text-white">{p.trust_score}/100</div>
                    <div className="text-[10px] text-teal font-semibold">{p.engagement_count} Engagements</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MANAGE & DIRECTORY (NEW FEATURE B) */}
      {activeTab === 'manage' && (
        <div className="space-y-6">
          {/* Header & Sub-Tabs */}
          <div className="bg-white/[0.06] p-6 rounded-2xl border border-white/10 shadow-float flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-heading font-extrabold text-white">
                Institutional Directory & Onboarding Hub
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Register new universities (with automatic Shodhganga research graph bootstrap), industry CSR sponsors, and DVOs.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowUniModal(true)}
                className="px-3 py-2 bg-teal hover:bg-teal-dark text-navy hover:text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-float"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Onboard University</span>
              </button>
              <button
                onClick={() => setShowIndModal(true)}
                className="px-3 py-2 bg-navy hover:bg-navy-light text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-float"
              >
                <PlusCircle className="w-3.5 h-3.5 text-teal" />
                <span>Onboard Industry</span>
              </button>
              <button
                onClick={() => setShowOfficerModal(true)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-float"
              >
                <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                <span>Onboard DVO</span>
              </button>
            </div>
          </div>

          {/* Sub-nav switcher */}
          <div className="flex space-x-2 border-b border-white/10 pb-2">
            {[
              { id: 'universities', label: `Universities (${directory.universities?.length || 0})` },
              { id: 'industry', label: `Industry Partners (${directory.industry_partners?.length || 0})` },
              { id: 'officers', label: `Validation Officers (${directory.validation_officers?.length || 0})` },
            ].map(st => (
              <button
                key={st.id}
                onClick={() => setManageSubTab(st.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  manageSubTab === st.id ? 'bg-navy text-white' : 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.12]'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {directoryLoading ? (
            <div className="py-12 text-center">
              <RefreshCw className="w-6 h-6 text-teal animate-spin mx-auto" />
              <p className="text-xs text-slate-500 mt-2 font-medium">Refreshing institutional registry...</p>
            </div>
          ) : (
            <>
              {/* Universities Directory Table */}
              {manageSubTab === 'universities' && (
                <div className="rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/10 shadow-float overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/[0.04] border-b border-white/10 text-slate-500 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="py-3 px-4">University / HEI</th>
                        <th className="py-3 px-4">District</th>
                        <th className="py-3 px-4">Coordinator Contact</th>
                        <th className="py-3 px-4">Research Depts</th>
                        <th className="py-3 px-4 text-right">Trust Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-200">
                      {directory.universities?.map(u => (
                        <tr key={u.id} className="hover:bg-white/[0.04] transition-colors">
                          <td className="py-3 px-4 font-bold text-white">{u.name}</td>
                          <td className="py-3 px-4">{u.district_name}</td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-white">{u.coordinator_name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{u.coordinator_email}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold text-[10px]">
                              {u.department_count} Departments
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-black font-heading text-white">
                            {u.trust_score}/100
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Industry Partners Directory Table */}
              {manageSubTab === 'industry' && (
                <div className="rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/10 shadow-float overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/[0.04] border-b border-white/10 text-slate-500 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="py-3 px-4">Corporate Partner</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">CSR Focus Areas</th>
                        <th className="py-3 px-4">Contact Person</th>
                        <th className="py-3 px-4 text-right">Trust Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-200">
                      {directory.industry_partners?.map(ip => (
                        <tr key={ip.id} className="hover:bg-white/[0.04] transition-colors">
                          <td className="py-3 px-4 font-bold text-white">{ip.name}</td>
                          <td className="py-3 px-4 capitalize text-slate-500">{ip.partner_type.replace(/_/g, ' ')}</td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {ip.csr_focus_areas?.map((fa, i) => (
                                <span key={i} className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-300 text-[10px] font-medium">
                                  {fa}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-white">{ip.contact_name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{ip.contact_email}</div>
                          </td>
                          <td className="py-3 px-4 text-right font-black font-heading text-white">
                            {ip.trust_score}/100
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Validation Officers Directory Table */}
              {manageSubTab === 'officers' && (
                <div className="rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/10 shadow-float overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/[0.04] border-b border-white/10 text-slate-500 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="py-3 px-4">Nodal Officer</th>
                        <th className="py-3 px-4">Official Email</th>
                        <th className="py-3 px-4">Assigned District</th>
                        <th className="py-3 px-4">Role / Scope</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-200">
                      {directory.validation_officers?.map(vo => (
                        <tr key={vo.id} className="hover:bg-white/[0.04] transition-colors">
                          <td className="py-3 px-4 font-bold text-white">{vo.name}</td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-300">{vo.email}</td>
                          <td className="py-3 px-4 font-semibold text-teal-dark">{vo.district_name}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                              District Field Validator (48h SLA)
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* TAB 6: EXECUTIVE BRIEFING NOTE */}
      {activeTab === 'briefing' && (
        <div className="panel-glass p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
            <div>
              <span className="text-xs font-bold text-teal uppercase tracking-wider">Executive Synthesis</span>
              <h3 className="text-lg font-heading font-extrabold text-white mt-0.5">
                Daily Societal Innovation Briefing Note
              </h3>
            </div>
            <button
              onClick={handleFetchBriefing}
              disabled={briefingLoading}
              className="px-4 py-2 rounded-lg bg-navy hover:bg-navy-light text-white font-bold text-xs transition-colors shadow-float flex items-center space-x-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal" />
              <span>{briefingLoading ? 'Synthesizing Briefing...' : 'Generate Executive Briefing'}</span>
            </button>
          </div>

          {briefing ? (
            <div className="bg-white/[0.04] p-6 rounded-xl border border-white/10 space-y-3">
              <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                Briefing for: <strong>{briefing.district_name}</strong>
              </div>
              <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-line font-sans">
                {briefing.briefing_text || briefing.summary_text || briefing.briefing}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              Click the button above to generate an executive briefing note synthesizing regional societal stress points and research deployment progress.
            </div>
          )}
        </div>
      )}

      {/* TAB 7: CENTRALIZED SUBMITTED REPORTS (STEP 5) */}
      {activeTab === 'reports' && (
        <div className="panel-glass p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold text-teal uppercase tracking-wider mb-0.5">
                <FileCheck className="w-4 h-4" />
                <span>Centralized Audit Repository</span>
              </div>
              <h3 className="text-lg font-heading font-extrabold text-white">
                Submitted Activity & Executive Reports
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Permanent institutional audit trail of all periodic reports generated across University, Industry, Officer, and State panels.
              </p>
            </div>

            <button
              onClick={loadSubmittedReports}
              disabled={reportsLoading}
              className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 text-xs font-bold flex items-center space-x-1.5 transition-colors disabled:opacity-50"
              title="Refresh Reports List"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${reportsLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Dual Dropdown Option Bars (Domain & Specific Entity) */}
          <div className="bg-white/[0.04] p-4 sm:p-5 rounded-2xl border border-white/10 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option Bar 1: Choose Domain / Stakeholder Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-teal flex items-center space-x-1.5 uppercase tracking-wider">
                  <Layers className="w-3.5 h-3.5 text-teal" />
                  <span>1. Choose Domain</span>
                </label>
                <select
                  value={reportsRoleFilter}
                  onChange={e => handleDomainFilterChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F223D] border border-white/15 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-teal cursor-pointer shadow-sm"
                >
                  <option value="all">All Domains (University, Officer, Industry, Government)</option>
                  <option value="university">University / Higher Education (HEI)</option>
                  <option value="validation_officer">Validation Officer / District Nodal Office</option>
                  <option value="industry">Industry / Corporate CSR Partner</option>
                  <option value="government">Government Directorate</option>
                </select>
              </div>

              {/* Option Bar 2: Specific Institution / Entity */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-teal flex items-center space-x-1.5 uppercase tracking-wider">
                  <Building2 className="w-3.5 h-3.5 text-teal" />
                  <span>2. Specific University / Industry / Officer</span>
                </label>
                <select
                  value={reportsEntityFilter}
                  onChange={e => setReportsEntityFilter(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F223D] border border-white/15 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-teal cursor-pointer shadow-sm"
                >
                  <option value="all">
                    {reportsRoleFilter === 'university' ? 'All Universities & Academic HEIs' :
                     reportsRoleFilter === 'industry' ? 'All Industry & Corporate CSR Partners' :
                     reportsRoleFilter === 'validation_officer' ? 'All District STI Nodal Officers' :
                     'All Specific Institutions & Entities'}
                  </option>
                  {entityOptions.map((entityName, idx) => (
                    <option key={idx} value={entityName}>{entityName}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Secondary Toolbar: Search keyword & Timeframe */}
            <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by officer name, report ID, or keyword..."
                  value={reportsSearch}
                  onChange={e => setReportsSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal"
                />
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <span className="text-xs font-semibold text-slate-400 shrink-0">Period:</span>
                <select
                  value={reportsPeriodFilter}
                  onChange={e => setReportsPeriodFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#0F223D] border border-white/10 text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-teal cursor-pointer"
                >
                  <option value="all">All Periods (Weekly & Monthly)</option>
                  <option value="weekly">Weekly Briefings (Last 7 Days)</option>
                  <option value="monthly">Monthly Audits (Last 30 Days)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table / Skeleton / Empty State */}
          {reportsLoading ? (
            <div className="space-y-3 py-2">
              {[1, 2, 3, 4].map(idx => (
                <div key={idx} className="h-16 bg-white/[0.06] rounded-xl animate-pulse border border-white/10" />
              ))}
            </div>
          ) : displayedReports.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-white/[0.04]/50 rounded-2xl border border-dashed border-white/10">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.06] text-slate-400 mx-auto flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">No reports submitted yet for this filter</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  When university coordinators, industry leads, or district nodal officers generate activity report PDFs, they will appear here with full institutional attribution and instant download links.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10 shadow-lvl1">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.06] text-slate-400 font-bold uppercase tracking-wider border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3">Submitter & Organization</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Report Period</th>
                    <th className="px-4 py-3">Generated Date</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 bg-white/[0.04] font-medium">
                  {displayedReports.map(rep => {
                    const roleColorMap = {
                      university: 'bg-blue-500/20 text-blue-300 border-blue-400/40',
                      industry: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
                      validation_officer: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
                      government: 'bg-teal/20 text-teal border-teal/40'
                    };
                    const roleLabelMap = {
                      university: 'University',
                      industry: 'Industry / CSR',
                      validation_officer: 'Validation Officer',
                      government: 'Government'
                    };
                    const badgeClass = roleColorMap[rep.generated_by_role] || 'bg-white/[0.06] text-slate-200 border-white/10';
                    const roleLabel = roleLabelMap[rep.generated_by_role] || rep.generated_by_role;

                    const formattedDate = rep.generated_at 
                      ? new Date(rep.generated_at).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })
                      : 'Recently';

                    const periodLabel = (rep.period_type || 'weekly').toUpperCase();
                    const periodRange = rep.period_start && rep.period_end
                      ? `${new Date(rep.period_start).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} — ${new Date(rep.period_end).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`
                      : null;

                    return (
                      <tr key={rep.id} className="hover:bg-white/[0.04]/70 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-white">{rep.generated_by_name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">Report ID #{rep.id}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badgeClass}`}>
                            {roleLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-semibold text-slate-200">{periodLabel}</span>
                          {periodRange && (
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">{periodRange}</div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-slate-300 font-mono text-[11px]">
                          {formattedDate}
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => window.open(getFileUrl(rep.file_url), '_blank')}
                              className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-200 hover:text-white text-xs font-semibold inline-flex items-center space-x-1.5 transition-all"
                              title="Open and view report PDF in new tab"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-teal" />
                              <span>Open PDF</span>
                            </button>
                            <a
                              href={getFileUrl(rep.file_url)}
                              download={rep.filename || `Activity_Report_${rep.id}.pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-teal hover:bg-teal-hover text-navy text-xs font-bold inline-flex items-center space-x-1.5 shadow-glow-teal transition-all"
                              title="Save and download PDF directly to device"
                            >
                              <Download className="w-3.5 h-3.5 text-navy" />
                              <span>Save PDF</span>
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ONBOARD UNIVERSITY */}
      {showUniModal && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white/[0.06] rounded-2xl max-w-lg w-full p-6 shadow-xl border border-white/10 space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="font-heading font-bold text-base text-white flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-teal" />
                <span>Onboard New University</span>
              </h3>
              <button onClick={() => setShowUniModal(false)} className="text-slate-400 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Onboarding triggers an automatic Shodhganga research expertise graph bootstrap to index departments, faculty profiles, and thematic domain tags.
            </p>

            <form onSubmit={handleOnboardUniversity} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-200 block mb-1">University / Institute Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vinoba Bhave University"
                  value={uniForm.university_name}
                  onChange={e => setUniForm({ ...uniForm, university_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-white/15 focus:ring-2 focus:ring-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-200 block mb-1">District Location *</label>
                <select
                  required
                  value={uniForm.district_id}
                  onChange={e => setUniForm({ ...uniForm, district_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-white/15 focus:ring-2 focus:ring-teal focus:outline-none"
                >
                  <option value="">Select District</option>
                  {(directory.districts?.length ? directory.districts : districts).map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-200 block mb-1">Coordinator Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Kumar"
                  value={uniForm.coordinator_name}
                  onChange={e => setUniForm({ ...uniForm, coordinator_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-white/15 focus:ring-2 focus:ring-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-200 block mb-1">Coordinator Official Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. rkumar@vbu.ac.in"
                  value={uniForm.coordinator_email}
                  onChange={e => setUniForm({ ...uniForm, coordinator_email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-white/15 focus:ring-2 focus:ring-teal focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowUniModal(false)}
                  className="px-4 py-2 rounded-lg border border-white/10 text-slate-300 hover:bg-white/[0.04] font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 rounded-lg bg-navy hover:bg-navy-light text-white font-bold disabled:opacity-50"
                >
                  {formSubmitting ? 'Bootstrapping...' : 'Onboard & Generate Login'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ONBOARD INDUSTRY PARTNER */}
      {showIndModal && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white/[0.06] rounded-2xl max-w-lg w-full p-6 shadow-xl border border-white/10 space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="font-heading font-bold text-base text-white flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-teal" />
                <span>Onboard Industry / CSR Partner</span>
              </h3>
              <button onClick={() => setShowIndModal(false)} className="text-slate-400 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOnboardIndustry} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-200 block mb-1">Organisation / Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jindal Steel CSR Foundation"
                  value={indForm.partner_name}
                  onChange={e => setIndForm({ ...indForm, partner_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-white/15 focus:ring-2 focus:ring-teal focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-200 block mb-1">Partner Type *</label>
                  <select
                    value={indForm.partner_type}
                    onChange={e => setIndForm({ ...indForm, partner_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-white/15 focus:ring-2 focus:ring-teal focus:outline-none"
                  >
                    <option value="large_industry">Large Industry</option>
                    <option value="sme">SME</option>
                    <option value="psu">PSU</option>
                    <option value="foundation">CSR Foundation</option>
                    <option value="startup">Startup</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-200 block mb-1">Base District (Optional)</label>
                  <select
                    value={indForm.district_id}
                    onChange={e => setIndForm({ ...indForm, district_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-white/15 focus:ring-2 focus:ring-teal focus:outline-none"
                  >
                    <option value="">Statewide</option>
                    {(directory.districts?.length ? directory.districts : districts).map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-200 block mb-1">CSR Focus Areas (Comma separated) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Water Resources, Rural Livelihoods, Renewable Energy"
                  value={indForm.csr_focus_areas}
                  onChange={e => setIndForm({ ...indForm, csr_focus_areas: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-white/15 focus:ring-2 focus:ring-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-200 block mb-1">CSR Lead / Contact Person *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Neha Verma"
                  value={indForm.contact_name}
                  onChange={e => setIndForm({ ...indForm, contact_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-white/15 focus:ring-2 focus:ring-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-200 block mb-1">Contact Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. csr@jindalsteel.com"
                  value={indForm.contact_email}
                  onChange={e => setIndForm({ ...indForm, contact_email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-white/15 focus:ring-2 focus:ring-teal focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowIndModal(false)}
                  className="px-4 py-2 rounded-lg border border-white/10 text-slate-300 hover:bg-white/[0.04] font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 rounded-lg bg-navy hover:bg-navy-light text-white font-bold disabled:opacity-50"
                >
                  {formSubmitting ? 'Registering...' : 'Register Industry Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ONBOARD VALIDATION OFFICER */}
      {showOfficerModal && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white/[0.06] rounded-2xl max-w-lg w-full p-6 shadow-xl border border-white/10 space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="font-heading font-bold text-base text-white flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-teal" />
                <span>Onboard District Validation Officer</span>
              </h3>
              <button onClick={() => setShowOfficerModal(false)} className="text-slate-400 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOnboardOfficer} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-200 block mb-1">Officer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. S. P. Hansda"
                  value={officerForm.officer_name}
                  onChange={e => setOfficerForm({ ...officerForm, officer_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-white/15 focus:ring-2 focus:ring-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-200 block mb-1">Official NIC / Gov Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. dvo.bokaro@jh.gov.in"
                  value={officerForm.officer_email}
                  onChange={e => setOfficerForm({ ...officerForm, officer_email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-white/15 focus:ring-2 focus:ring-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-200 block mb-1">Jurisdiction District *</label>
                <select
                  required
                  value={officerForm.district_id}
                  onChange={e => setOfficerForm({ ...officerForm, district_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-white/15 focus:ring-2 focus:ring-teal focus:outline-none"
                >
                  <option value="">Select District</option>
                  {(directory.districts?.length ? directory.districts : districts).map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowOfficerModal(false)}
                  className="px-4 py-2 rounded-lg border border-white/10 text-slate-300 hover:bg-white/[0.04] font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 rounded-lg bg-navy hover:bg-navy-light text-white font-bold disabled:opacity-50"
                >
                  {formSubmitting ? 'Assigning...' : 'Assign Nodal Officer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREDENTIALS SUCCESS DIALOG */}
      {onboardSuccess && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white/[0.06] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-green-200 space-y-4">
            <div className="flex items-center space-x-3 text-green">
              <CheckCircle2 className="w-7 h-7" />
              <div>
                <h3 className="font-heading font-extrabold text-base text-white">Participant Onboarded!</h3>
                <p className="text-xs text-slate-500">{onboardSuccess.role}</p>
              </div>
            </div>

            <div className="bg-white/[0.04] p-4 rounded-xl border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Entity:</span>
                <span className="font-bold text-white">{onboardSuccess.entity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Name:</span>
                <span className="font-bold text-slate-200">{onboardSuccess.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Login Email:</span>
                <span className="font-mono font-bold text-white">{onboardSuccess.email}</span>
              </div>
              <div className="flex justify-between items-center bg-white/[0.06] p-2 rounded border border-white/10">
                <span className="text-slate-400">Temporary Password:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-teal-dark">{onboardSuccess.tempPassword}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(onboardSuccess.tempPassword);
                      setCopiedPass(true);
                      setTimeout(() => setCopiedPass(false), 2000);
                    }}
                    className="p-1 hover:bg-white/[0.06] rounded text-slate-500"
                    title="Copy password"
                  >
                    {copiedPass ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic">
              {onboardSuccess.note}
            </p>

            <button
              onClick={() => setOnboardSuccess(null)}
              className="w-full py-2.5 bg-navy text-white rounded-xl text-xs font-bold hover:bg-navy-light transition-colors"
            >
              Done & Close
            </button>
          </div>
        </div>
      )}

      {/* GENERATE STATE ACTIVITY REPORT MODAL (Item 23) */}
      <GenerateReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        role="Government"
        districtName={districts.find(d => String(d.id) === String(selectedDistrict))?.name || 'All Districts'}
      />

      {/* Field Evidence Photo Lightbox */}
      <PhotoLightbox 
        isOpen={Boolean(evidenceLightboxUrl)} 
        photos={evidenceLightboxUrl ? [evidenceLightboxUrl] : []} 
        onClose={() => setEvidenceLightboxUrl(null)} 
      />
    </div>
  );
};

export default GovernmentDashboard;
