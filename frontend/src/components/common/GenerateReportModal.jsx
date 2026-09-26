import React, { useState } from 'react';
import { 
  Download, 
  FileText, 
  Calendar, 
  CheckCircle2, 
  RefreshCw, 
  Send, 
  ShieldCheck, 
  ExternalLink,
  Building 
} from 'lucide-react';
import BottomSheet from './BottomSheet';
import api, { getFileUrl } from '../../services/api';

export const GenerateReportModal = ({
  isOpen,
  onClose,
  portalRole,
  role,
  districtName
}) => {
  const displayRole = portalRole || role || 'Institutional Stakeholder';
  const [period, setPeriod] = useState('weekly');
  const [loadingAction, setLoadingAction] = useState(null); // 'submit' | 'download'
  const [error, setError] = useState(null);
  const [submissionSuccess, setSubmissionSuccess] = useState(null);

  if (!isOpen) return null;

  // Calculate current date range preview
  const now = new Date();
  const startDate = new Date();
  if (period === 'weekly') {
    startDate.setDate(now.getDate() - 7);
  } else {
    startDate.setDate(now.getDate() - 30);
  }

  const formatDate = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  // Generate and Submit to State Admin Central Repository
  const handleGenerateAndSubmit = async (isExplicitSubmit = true) => {
    setLoadingAction(isExplicitSubmit ? 'submit' : 'download');
    setError(null);
    try {
      const res = await api.get(`/reports/generate?period=${period}`);
      const data = res.data;

      setSubmissionSuccess({
        reportId: data.report_id,
        reportUrl: data.report_url,
        filename: data.filename,
        period: data.period,
        generatedAt: data.generated_at,
        isExplicitSubmit
      });
    } catch (err) {
      console.error("Report generation/submission error", err);
      setError(err.response?.data?.detail || err.message || "Failed to generate and submit report.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleResetAndClose = () => {
    setSubmissionSuccess(null);
    setError(null);
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleResetAndClose}
      title={submissionSuccess ? "Report Generated Successfully" : "Activity Report Generation & Submission"}
      subtitle={`${displayRole} • ${districtName || 'Jharkhand State STI Directorate'}`}
      badge="Centralized Reporting Engine"
      icon={FileText}
      maxWidth="2xl"
    >
      <div className="space-y-6 text-sm text-slate-200">
        {error && (
          <div className="p-3.5 rounded-xl bg-red/15 border border-red/40 text-red text-xs">
            {error}
          </div>
        )}

        {/* SUBMISSION SUCCESS CONFIRMATION & EMBEDDED PREVIEW STATE */}
        {submissionSuccess ? (
          <div className="py-2 space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 mx-auto flex items-center justify-center shadow-glow-teal">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h4 className="font-heading font-extrabold text-lg text-white">
                Official Report Successfully Generated!
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                Your <strong className="capitalize text-teal">{submissionSuccess.period}</strong> Activity Report has been compiled and logged in the <strong className="text-white">State Innovation Audit Registry</strong>.
              </p>
            </div>

            {/* Audit Record Summary Box */}
            <div className="bg-white/[0.04] backdrop-blur-xl p-3.5 sm:p-4 rounded-xl border border-white/10 text-left grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Audit ID</span>
                <span className="font-mono font-bold text-teal">#{submissionSuccess.reportId}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Reporting Entity</span>
                <span className="font-semibold text-slate-200 truncate block">{displayRole}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
                <span className="text-emerald-400 font-bold flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Archived</span>
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Generated</span>
                <span className="font-mono text-slate-300 text-[11px] block">
                  {new Date(submissionSuccess.generatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Live Embedded PDF Preview */}
            <div className="w-full rounded-2xl overflow-hidden border border-white/20 bg-[#0B1728] shadow-lvl2 p-2.5 space-y-2 text-left">
              <div className="flex items-center justify-between px-2 py-1 bg-white/[0.04] rounded-lg text-xs">
                <span className="font-mono text-teal font-bold truncate max-w-xs sm:max-w-md text-[11px]">
                  {submissionSuccess.filename}
                </span>
                <a
                  href={getFileUrl(submissionSuccess.reportUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal hover:text-white transition-colors text-xs font-semibold flex items-center space-x-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Full Screen</span>
                </a>
              </div>

              <iframe
                src={`${getFileUrl(submissionSuccess.reportUrl)}#toolbar=0`}
                title="Generated Report Preview"
                className="w-full h-80 sm:h-96 rounded-xl border border-white/10 bg-slate-900"
              />
            </div>

            <div className="flex items-center justify-center space-x-3 pt-2">
              <a
                href={getFileUrl(submissionSuccess.reportUrl)}
                target="_blank"
                rel="noopener noreferrer"
                download={submissionSuccess.filename}
                className="px-5 py-2.5 rounded-xl bg-teal text-navy font-bold text-xs sm:text-sm flex items-center space-x-2 hover:bg-teal-hover transition-all shadow-glow-teal"
              >
                <Download className="w-4 h-4 text-navy" />
                <span>Download Official PDF</span>
              </a>
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-5 py-2.5 rounded-xl border border-white/15 hover:bg-white/[0.08] text-white font-bold text-xs sm:text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Period Selector Tabs */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Select Report Timeframe
              </label>
              <div className="grid grid-cols-2 gap-2 bg-white/[0.04] p-1.5 rounded-2xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setPeriod('weekly')}
                  className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center space-x-2 ${
                    period === 'weekly'
                      ? 'bg-teal text-navy shadow-glow-teal font-extrabold'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Weekly Briefing (Last 7 Days)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPeriod('monthly')}
                  className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center space-x-2 ${
                    period === 'monthly'
                      ? 'bg-teal text-navy shadow-glow-teal font-extrabold'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Monthly Audit (Last 30 Days)</span>
                </button>
              </div>
            </div>

            {/* Coverage Date Range Preview */}
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-teal tracking-wider block">
                Coverage Period:
              </span>
              <div className="font-heading font-extrabold text-white text-base">
                {formatDate(startDate)} — {formatDate(now)}
              </div>
              <p className="text-xs text-slate-400">
                Directly submitted to the State Directorate "Submitted Reports" audit repository.
              </p>
            </div>

            {/* Summary of Included Sections */}
            <div className="space-y-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Included In This PDF Report:
              </span>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                <li className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-teal shrink-0" />
                  <span>Executive activity metrics, problem validations, and progress counts</span>
                </li>
                <li className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-teal shrink-0" />
                  <span>Mandated 48-hour SLA adherence & escalation audit logs</span>
                </li>
                <li className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-teal shrink-0" />
                  <span>Higher education research mobilization and proposal submissions</span>
                </li>
                <li className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-teal shrink-0" />
                  <span>CSR co-funding commitments and verified grassroots outcomes</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons: Explicit Submit to State Admin + Download Option */}
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/[0.06] text-slate-300 text-xs sm:text-sm font-semibold transition-colors order-2 sm:order-1"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={loadingAction !== null}
                onClick={() => handleGenerateAndSubmit(false)}
                className="px-4 py-2.5 rounded-xl border border-teal/40 hover:bg-teal/10 text-teal hover:text-white text-xs sm:text-sm font-bold transition-all flex items-center justify-center space-x-2 disabled:opacity-50 order-3 sm:order-2"
                title="Generate PDF and preview directly in modal"
              >
                {loadingAction === 'download' ? (
                  <>
                    <RefreshCw className="w-4 h-4 text-teal animate-spin" />
                    <span>Generating Report...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 text-teal" />
                    <span>Generate & View Report</span>
                  </>
                )}
              </button>

              {/* Primary Action: Submit to State Admin */}
              <button
                type="button"
                disabled={loadingAction !== null}
                onClick={() => handleGenerateAndSubmit(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal to-teal-dark hover:from-teal-hover hover:to-teal text-navy font-extrabold text-xs sm:text-sm transition-all shadow-glow-teal flex items-center justify-center space-x-2 disabled:opacity-50 order-1 sm:order-3"
                title="Compile, view, and officially submit to State Directorate audit repository"
              >
                {loadingAction === 'submit' ? (
                  <>
                    <RefreshCw className="w-4 h-4 text-navy animate-spin" />
                    <span>Generating & Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-navy" />
                    <span>Generate & Submit to State Admin</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
};

export default GenerateReportModal;
