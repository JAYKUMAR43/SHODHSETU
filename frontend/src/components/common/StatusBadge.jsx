import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  PauseCircle, 
  RotateCcw, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle 
} from 'lucide-react';

/**
 * Standard StatusBadge — Antigravity Dark Glassmorphism Semantic Badges
 */
export const StatusBadge = ({ status, label, className = '' }) => {
  const s = (status || '').toLowerCase().trim();

  // Citizen Ground Outcome States
  if (s === 'confirmed_working' || s === 'citizen_confirmed') {
    return (
      <span className={`inline-flex items-center space-x-1 bg-green/15 text-green border border-green/40 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${className}`}>
        <CheckCircle2 className="w-3.5 h-3.5 text-green" />
        <span>{label || 'Citizen-Confirmed'}</span>
      </span>
    );
  }
  if (s === 'disputed' || s === 'under_review') {
    return (
      <span className={`inline-flex items-center space-x-1 bg-amber/15 text-amber border border-amber/40 px-2.5 py-0.5 rounded-full text-[11px] font-bold animate-pulse ${className}`}>
        <AlertTriangle className="w-3.5 h-3.5 text-amber" />
        <span>{label || 'Under Review / Disputed'}</span>
      </span>
    );
  }

  // Lifecycle States
  if (s === 'info_requested') {
    return (
      <span className={`inline-flex items-center space-x-1 bg-purple-500/15 text-purple-400 border border-purple-400/40 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${className}`}>
        <PauseCircle className="w-3.5 h-3.5 text-purple-400" />
        <span>{label || 'Clarification Requested (SLA Paused)'}</span>
      </span>
    );
  }

  if (s === 'deployed' || s === 'closed') {
    return (
      <span className={`inline-flex items-center space-x-1 bg-green/15 text-green border border-green/40 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${className}`}>
        <CheckCircle2 className="w-3.5 h-3.5 text-green" />
        <span>{label || 'Field Deployed'}</span>
      </span>
    );
  }

  if (s === 'in_execution') {
    return (
      <span className={`inline-flex items-center space-x-1 bg-teal/15 text-teal border border-teal/40 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${className}`}>
        <Sparkles className="w-3.5 h-3.5 text-teal" />
        <span>{label || 'CSR Co-Funding Active'}</span>
      </span>
    );
  }

  if (s === 'in_research' || s === 'proposal_submitted') {
    return (
      <span className={`inline-flex items-center space-x-1 bg-blue-500/20 text-blue-400 border border-blue-400/40 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${className}`}>
        <Clock className="w-3.5 h-3.5 text-blue-400" />
        <span>{label || 'HEI Research Active'}</span>
      </span>
    );
  }

  if (s === 'validated' || s === 'awaiting_routing') {
    return (
      <span className={`inline-flex items-center space-x-1 bg-teal/15 text-teal border border-teal/40 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${className}`}>
        <ShieldCheck className="w-3.5 h-3.5 text-teal" />
        <span>{label || (s === 'awaiting_routing' ? 'Validated — Awaiting Routing' : 'District Validated')}</span>
      </span>
    );
  }

  if (s === 'ai_prescreened' || s === 'pending_validation' || s === 'pending') {
    return (
      <span className={`inline-flex items-center space-x-1 bg-amber/15 text-amber border border-amber/40 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${className}`}>
        <Clock className="w-3.5 h-3.5 text-amber" />
        <span>{label || 'Awaiting Field Validation'}</span>
      </span>
    );
  }

  if (s === 'rejected') {
    return (
      <span className={`inline-flex items-center space-x-1 bg-red/15 text-red border border-red/40 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${className}`}>
        <AlertCircle className="w-3.5 h-3.5 text-red" />
        <span>{label || 'Validation Rejected'}</span>
      </span>
    );
  }

  // Milestone Review States
  if (s === 'approved') {
    return (
      <span className={`inline-flex items-center space-x-1 bg-green/15 text-green border border-green/40 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${className}`}>
        <CheckCircle2 className="w-3.5 h-3.5 text-green" />
        <span>{label || 'Approved'}</span>
      </span>
    );
  }
  if (s === 'revision_requested') {
    return (
      <span className={`inline-flex items-center space-x-1 bg-amber/15 text-amber border border-amber/40 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${className}`}>
        <RotateCcw className="w-3.5 h-3.5 text-amber" />
        <span>{label || 'Revision Requested'}</span>
      </span>
    );
  }
  if (s === 'pending_review') {
    return (
      <span className={`inline-flex items-center space-x-1 bg-amber/15 text-amber border border-amber/40 px-2.5 py-0.5 rounded-full text-[11px] font-bold animate-pulse ${className}`}>
        <Clock className="w-3.5 h-3.5 text-amber" />
        <span>{label || 'Pending Review'}</span>
      </span>
    );
  }

  // Default fallback
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full bg-white/[0.08] text-slate-300 border border-white/15 text-[11px] font-bold uppercase tracking-wider ${className}`}>
      {label || status?.replace(/_/g, ' ')}
    </span>
  );
};

export default StatusBadge;
