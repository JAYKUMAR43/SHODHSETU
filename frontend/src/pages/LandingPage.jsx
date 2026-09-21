import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Users,
  GraduationCap, 
  Briefcase, 
  ShieldCheck, 
  BarChart3, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import DemoDisclaimer from '../components/common/DemoDisclaimer';

const LandingPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const roles = [
    {
      id: 'citizen',
      title: t('landing.role_citizen_title', 'Citizen & Community'),
      subtitle: t('landing.role_citizen_sub', 'Grassroots Problem Reporting'),
      desc: t('landing.role_citizen_desc', 'Report civic, water, agriculture, and healthcare issues via voice note or photos. Track real-time progress with no login required.'),
      icon: Users,
      color: 'bg-teal/10 text-teal border-teal/30',
      btnText: t('landing.role_citizen_btn', 'Enter Citizen Hub'),
      action: () => navigate('/citizen')
    },
    {
      id: 'university',
      title: t('landing.role_uni_title', 'University / HEI R&D'),
      subtitle: t('landing.role_uni_sub', 'Academic Research Mobilization'),
      desc: t('landing.role_uni_desc', 'Access algorithmically matched local challenges, assign faculty mentors and student teams, and submit verified proposals.'),
      icon: GraduationCap,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      btnText: t('landing.role_uni_btn', 'HEI Portal Login'),
      action: () => navigate('/login?role=university')
    },
    {
      id: 'industry',
      title: t('landing.role_ind_title', 'Industry & CSR Sponsor'),
      subtitle: t('landing.role_ind_sub', 'CSR Co-Funding & IP Agreements'),
      desc: t('landing.role_ind_desc', 'Browse vetted academic proposals aligned with corporate CSR mandates, pledge milestone funding, and execute bilateral IP frameworks.'),
      icon: Briefcase,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      btnText: t('landing.role_ind_btn', 'Industry Portal Login'),
      action: () => navigate('/login?role=industry')
    },
    {
      id: 'validation_officer',
      title: t('landing.role_dvo_title', 'District STI Nodal Officer'),
      subtitle: t('landing.role_dvo_sub', '48-Hour Field Validation'),
      desc: t('landing.role_dvo_desc', 'Validate citizen reports on the ground, request clarification, and confirm routing to recommended regional universities.'),
      icon: ShieldCheck,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      btnText: t('landing.role_dvo_btn', 'District Officer Login'),
      action: () => navigate('/login?role=validation_officer')
    },
    {
      id: 'government',
      title: t('landing.role_govt_title', 'State Government Admin'),
      subtitle: t('landing.role_govt_sub', 'Statewide Oversight & Verification'),
      desc: t('landing.role_govt_desc', 'Monitor statewide STI telemetry, manage SLA escalations, detect cross-district systemic patterns, and verify outcome attestations.'),
      icon: BarChart3,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      btnText: t('landing.role_govt_btn', 'State Directorate Login'),
      action: () => navigate('/login?role=government')
    }
  ];

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-navy text-white rounded-2xl p-8 sm:p-12 shadow-xl border border-navy-light relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="max-w-3xl relative z-10 space-y-6">
            <div className="inline-flex items-center space-x-2 bg-teal/20 border border-teal/40 px-3 py-1 rounded-full text-xs text-teal font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('landing.dept_badge', 'Govt. of Jharkhand — Higher & Technical Education')}</span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-heading font-extrabold tracking-tight leading-tight">
              {t('landing.hero_title', 'Mobilizing Higher Education Research for')} <span className="text-teal">{t('landing.hero_title_accent', 'Jharkhand’s Grassroots Challenges')}</span>
            </h1>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
              <strong>ShodhSetu (शोध सेतु)</strong> {t('landing.hero_desc', 'connects citizen challenges with university research capabilities and corporate CSR funding, turning ground-level problems into deployable scientific solutions.')}
            </p>
          </div>

          {/* Real Seed-Data Scale Stat Counters (Fix 0B) */}
          <div className="mt-12 pt-8 border-t border-navy-light/60 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-3xl font-extrabold text-teal font-heading">3 Districts</div>
              <div className="text-xs text-slate-300 font-medium">Piloted in Ranchi, Dhanbad, East Singhbhum</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-white font-heading">6 HEIs</div>
              <div className="text-xs text-slate-300 font-medium">Shodhganga-Mapped Universities Onboarded</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-green font-heading">5 CSR Partners</div>
              <div className="text-xs text-slate-300 font-medium">Tata Steel, Coal India & Research Labs</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-amber font-heading">48h SLA</div>
              <div className="text-xs text-slate-300 font-medium">Mandated District STI Validation</div>
            </div>
          </div>
        </div>
      </section>

      {/* Illustrative regional entities demo disclaimer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <DemoDisclaimer />
      </div>

      {/* Stakeholder Role Portals (5 Role Cards) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-navy">
            Choose Your Platform Role
          </h2>
          <p className="text-slate-600 text-sm mt-2">
            Select your stakeholder capacity to access role-specific workflows, matching engines, and dashboards.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <div 
                key={role.id}
                className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg border ${role.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      {role.subtitle}
                    </span>
                  </div>

                  <h3 className="text-lg font-heading font-bold text-navy mb-2">
                    {role.title}
                  </h3>
                  <p className="text-slate-600 text-xs leading-relaxed mb-6">
                    {role.desc}
                  </p>
                </div>

                <button
                  onClick={role.action}
                  className="w-full py-2.5 px-4 rounded-lg bg-slate-100 hover:bg-navy hover:text-white text-navy font-semibold text-xs transition-colors flex items-center justify-center space-x-2 border border-slate-200"
                >
                  <span>{role.btnText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5-Step Innovation Architecture */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-100 rounded-2xl p-8 sm:p-10 border border-slate-200">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h3 className="text-xl font-heading font-bold text-navy">
              The ShodhSetu Societal Innovation Pipeline
            </h3>
            <p className="text-slate-600 text-xs mt-1">
              End-to-end institutional workflow from citizen report to verified field impact.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-lg border border-slate-200 text-center space-y-2">
              <div className="w-8 h-8 rounded-full bg-teal text-navy font-bold flex items-center justify-center mx-auto text-xs">1</div>
              <h4 className="font-heading font-semibold text-xs text-navy">Citizen Submission</h4>
              <p className="text-[11px] text-slate-500">Multimodal reporting via voice notes, geotagged photos, or PRI accounts with OTP verification.</p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 text-center space-y-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center mx-auto text-xs">2</div>
              <h4 className="font-heading font-semibold text-xs text-navy">AI Pre-Screening</h4>
              <p className="text-[11px] text-slate-500">Automatically classifies domain sector, detects 500m duplicates, and drafts academic problem briefs.</p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 text-center space-y-2">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center mx-auto text-xs">3</div>
              <h4 className="font-heading font-semibold text-xs text-navy">District STI Validation</h4>
              <p className="text-[11px] text-slate-500">Nodal Officer verifies feasibility within 48h SLA before academic routing confirmation.</p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 text-center space-y-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center mx-auto text-xs">4</div>
              <h4 className="font-heading font-semibold text-xs text-navy">HEI Research Match</h4>
              <p className="text-[11px] text-slate-500">Expertise graph scores candidate universities; faculty teams form and submit proposals.</p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 text-center space-y-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center mx-auto text-xs">5</div>
              <h4 className="font-heading font-semibold text-xs text-navy">CSR Co-Funding & IP</h4>
              <p className="text-[11px] text-slate-500">Industry matches CSR focus, generates official IP agreement PDF, and verifies field outcomes.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
