import React from 'react';
import { Info } from 'lucide-react';

const DemoDisclaimer = ({ className = "" }) => {
  return (
    <div className={`bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 text-[11px] text-amber-200 flex items-start space-x-2.5 backdrop-blur-xl ${className}`}>
      <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
      <div className="leading-relaxed">
        <strong>Illustrative Regional Demo Notice:</strong> Institution and organisation names (BIT Mesra, IIT ISM Dhanbad, Tata Steel CSR, Coal India CSR, SAIL Bokaro, etc.) in this platform are illustrative, reflecting real Jharkhand institutions for regional realism in Smart India Hackathon 2026. No official partnership or endorsement with these entities is implied.
      </div>
    </div>
  );
};

export default DemoDisclaimer;
