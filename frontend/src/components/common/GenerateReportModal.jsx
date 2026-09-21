import React, { useState } from 'react';
import { Download, FileText, Calendar, CheckCircle2, RefreshCw } from 'lucide-react';
import BottomSheet from './BottomSheet';
import api from '../../services/api';

export const GenerateReportModal = ({
  isOpen,
  onClose,
  portalRole = 'Stakeholder'
}) => {
  const [period, setPeriod] = useState('weekly');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

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

  const handleDownload = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await api.get(`/reports/generate?period=${period}`);
      if (res.data?.report_url) {
        window.open(res.data.report_url, '_blank');
        onClose();
      } else {
        alert("Report generated successfully.");
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Failed to generate report PDF.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Official Activity Report"
      subtitle={`${portalRole} • Automated PDF Executive Synthesis`}
      badge="Reporting Engine"
      icon={FileText}
      maxWidth="lg"
    >
      <div className="space-y-5 text-xs">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
            {error}
          </div>
        )}

        {/* Period Selector Tabs */}
        <div>
          <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">
            Select Report Timeframe
          </label>
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setPeriod('weekly')}
              className={`py-2 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center space-x-1.5 ${
                period === 'weekly'
                  ? 'bg-white text-navy shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-navy'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-teal" />
              <span>Weekly Briefing (Last 7 Days)</span>
            </button>
            <button
              type="button"
              onClick={() => setPeriod('monthly')}
              className={`py-2 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center space-x-1.5 ${
                period === 'monthly'
                  ? 'bg-white text-navy shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-navy'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-teal" />
              <span>Monthly Audit (Last 30 Days)</span>
            </button>
          </div>
        </div>

        {/* Coverage Date Range Preview */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Coverage Period:
          </span>
          <div className="font-heading font-bold text-navy text-sm">
            {formatDate(startDate)} — {formatDate(now)}
          </div>
          <p className="text-[11px] text-slate-500">
            Compliant with Directorate of Higher & Technical Education audit standards.
          </p>
        </div>

        {/* Summary of Included Sections */}
        <div className="space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Included In This PDF Report:
          </span>
          <ul className="space-y-1.5 text-slate-600">
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal" />
              <span>Platform executive activity metrics and progress counts</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal" />
              <span>Challenge validation performance and 48-hour SLA compliance</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal" />
              <span>Active university research mobilization and milestone completion rates</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal" />
              <span>CSR co-funding allocations and verified grassroots outcome registry</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={generating}
            onClick={handleDownload}
            className="px-5 py-2.5 rounded-xl bg-navy hover:bg-navy-light text-white text-xs font-bold transition-colors shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
          >
            {generating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-teal animate-spin" />
                <span>Compiling Report PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-teal" />
                <span>Generate & Download PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};

export default GenerateReportModal;
