import React from 'react';
import { ShieldCheck, Heart, ExternalLink } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-navy-dark text-slate-400 text-xs border-t border-navy-light/60 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-6">
        <div>
          <div className="flex items-center space-x-2 text-white font-heading font-bold text-base mb-2">
            <span className="w-6 h-6 rounded bg-teal text-navy flex items-center justify-center font-black text-xs">श</span>
            <span>ShodhSetu • शोध सेतु</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Societal Innovation Collaboration Portal connecting citizen challenges with Higher Education Institutions (HEIs) and Industry CSR capital in Jharkhand.
          </p>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-2">Platform Modules</h4>
          <ul className="space-y-1 text-[11px]">
            <li><a href="/citizen" className="hover:text-teal transition-colors">Citizen & Community Hub</a></li>
            <li><a href="/submit" className="hover:text-teal transition-colors">Citizen Challenge Submission</a></li>
            <li><a href="/track" className="hover:text-teal transition-colors">Public Tracking Lookup</a></li>
            <li><a href="/registry" className="hover:text-teal transition-colors">Outcome & Patent Registry</a></li>
            <li><a href="/login?role=university" className="hover:text-teal transition-colors">University Research Hub</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-2">Stakeholder Access</h4>
          <ul className="space-y-1 text-[11px]">
            <li><a href="/login?role=industry" className="hover:text-teal transition-colors">Industry & CSR Partners</a></li>
            <li><a href="/login?role=validation_officer" className="hover:text-teal transition-colors">District STI Nodal Officers</a></li>
            <li><a href="/login?role=government" className="hover:text-teal transition-colors">State Directorate Oversight</a></li>
            <li><a href="/submit" className="hover:text-teal transition-colors">Panchayat & Urban Local Bodies (PRIs/ULBs)</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-2">Institutional Framework</h4>
          <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
            Integrated with Shodhganga, AISHE, and Schedule VII CSR frameworks for the Government of Jharkhand.
          </p>
          <div className="flex items-center space-x-2 text-teal text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>State-Verified Research Outcomes</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 border-t border-navy-light/40 flex flex-col sm:flex-row justify-between items-center text-[11px]">
        <div>
          © 2026 Government of Jharkhand. Department of Higher and Technical Education.
          <span className="block text-[10px] text-slate-500 mt-0.5">
            Institutional and corporate names in demo datasets are illustrative for SIH 2026 regional realism; no official endorsement implied.
          </span>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center space-x-4">
          <span>Ranchi • Dhanbad • Jamshedpur</span>
          <span>•</span>
          <span className="text-teal">Smart India Hackathon 2026</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
