import React from 'react';
import { Clock, AlertTriangle, CheckCircle2, PauseCircle } from 'lucide-react';

/**
 * Standard SLABadge component:
 * 48h Validation SLA indicator
 */
export const SLABadge = ({ slaState, ageHours, status, className = '' }) => {
  if (slaState === 'paused' || status === 'info_requested') {
    return (
      <span className={`inline-flex items-center space-x-1 bg-purple-500/15 text-purple-400 border border-purple-400/40 px-2.5 py-1 rounded-md text-[11px] font-bold ${className}`}>
        <PauseCircle className="w-3.5 h-3.5 text-purple-400" />
        <span>Clarification Pending (SLA Paused)</span>
      </span>
    );
  }

  if (slaState === 'escalated') {
    return (
      <span className={`inline-flex items-center space-x-1 bg-red/15 text-red border border-red-border px-2.5 py-1 rounded-md text-[11px] font-bold animate-pulse ${className}`}>
        <AlertTriangle className="w-3.5 h-3.5 text-red" />
        <span>SLA Breach ({ageHours ? `${ageHours}h > 48h` : '> 48 Hours'})</span>
      </span>
    );
  }

  if (slaState === 'warning') {
    return (
      <span className={`inline-flex items-center space-x-1 bg-amber/15 text-amber border border-amber-border px-2.5 py-1 rounded-md text-[11px] font-bold ${className}`}>
        <Clock className="w-3.5 h-3.5 text-amber" />
        <span>SLA Approaching ({ageHours ? `${ageHours}h / 48h` : '24-48 Hours'})</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center space-x-1 bg-green/15 text-green border border-green-border px-2.5 py-1 rounded-md text-[11px] font-bold ${className}`}>
      <CheckCircle2 className="w-3.5 h-3.5 text-green" />
      <span>On Track ({ageHours ? `${ageHours}h` : '< 24 Hours'})</span>
    </span>
  );
};

export default SLABadge;
