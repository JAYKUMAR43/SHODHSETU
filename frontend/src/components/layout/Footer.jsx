import React from 'react';
import { ShieldCheck, Heart, ExternalLink, Globe } from 'lucide-react';
import { LogoMark } from '../common/Logo';

const Footer = () => {
  return (
    <footer className="bg-[#060E1A] text-slate-400 text-xs border-t border-white/10 py-12 relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10 mb-8">
        <div className="space-y-3">
          <div className="flex items-center space-x-2.5 text-white font-heading font-extrabold text-lg">
            <LogoMark size="sm" className="w-7 h-7" />
            <span>Bharat Panchyt • भारत पंचायत</span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed font-normal">
            People's Actual Needs Connected With Higher-Education, Youth And Technology. An AI-powered civic governance engine for the Government of Jharkhand.
          </p>
          <div className="inline-flex items-center space-x-2 bg-teal/10 border border-teal/30 px-3 py-1 rounded-full text-[11px] text-teal font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse"></span>
            <span>GovNet Core Active • 24 Districts</span>
          </div>
        </div>

        <div>
          <h4 className="text-white font-bold text-sm mb-3 uppercase tracking-wider font-mono">Platform Modules</h4>
          <ul className="space-y-2 text-xs">
            <li><a href="/citizen" className="hover:text-teal transition-colors flex items-center space-x-1.5"><span>Citizen & Community Hub</span></a></li>
            <li><a href="/submit" className="hover:text-teal transition-colors flex items-center space-x-1.5"><span>Citizen Challenge Submission</span></a></li>
            <li><a href="/track" className="hover:text-teal transition-colors flex items-center space-x-1.5"><span>Public Tracking Lookup</span></a></li>
            <li><a href="/registry" className="hover:text-teal transition-colors flex items-center space-x-1.5"><span>Outcome & Patent Registry</span></a></li>
            <li><a href="/login?role=university" className="hover:text-teal transition-colors flex items-center space-x-1.5"><span>University Research Hub</span></a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold text-sm mb-3 uppercase tracking-wider font-mono">Stakeholder Portals</h4>
          <ul className="space-y-2 text-xs">
            <li><a href="/login?role=industry" className="hover:text-teal transition-colors flex items-center space-x-1.5"><span>Industry & CSR Sponsors</span></a></li>
            <li><a href="/login?role=validation_officer" className="hover:text-teal transition-colors flex items-center space-x-1.5"><span>District STI Nodal Officers</span></a></li>
            <li><a href="/login?role=government" className="hover:text-teal transition-colors flex items-center space-x-1.5"><span>State Directorate Oversight</span></a></li>
            <li><a href="/submit" className="hover:text-teal transition-colors flex items-center space-x-1.5"><span>Panchayat & Urban Bodies (PRIs/ULBs)</span></a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold text-sm mb-3 uppercase tracking-wider font-mono">Institutional Framework</h4>
          <p className="text-xs text-slate-400 leading-relaxed mb-3 font-normal">
            Integrated with Shodhganga, AISHE, and Schedule VII CSR statutory frameworks for the Government of Jharkhand.
          </p>
          <div className="flex items-center space-x-2 text-teal text-xs font-semibold bg-white/[0.05] p-2 rounded-xl border border-white/10">
            <ShieldCheck className="w-4 h-4 text-teal" />
            <span>State-Verified Research Outcomes</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500">
        <div>
          © 2026 Government of Jharkhand. Department of Higher and Technical Education.
          <span className="block text-[11px] text-slate-500 mt-1">
            Institutional and corporate names in demo datasets are illustrative for SIH 2026 regional realism; no official endorsement implied.
          </span>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-4 font-mono text-[11px]">
          <span className="text-slate-400">Ranchi • Dhanbad • Jamshedpur</span>
          <span>•</span>
          <span className="text-teal font-bold">Smart India Hackathon 2026</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
