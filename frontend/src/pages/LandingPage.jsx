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
  Sparkles,
  MapPin,
  CheckCircle2,
  FileText,
  Activity,
  Award
} from 'lucide-react';
import DemoDisclaimer from '../components/common/DemoDisclaimer';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();

  const isRoleActive = (roleId) => isAuthenticated && user?.role === roleId;

  const roles = [
    {
      id: 'citizen',
      title: t('landing.role_citizen_title', 'Citizen & Community'),
      subtitle: t('landing.role_citizen_sub', 'Grassroots Problem Reporting'),
      desc: t('landing.role_citizen_desc', 'Report civic, water, agriculture, and healthcare issues via voice note or photos. Track real-time progress with no login required.'),
      icon: Users,
      accentColor: 'teal',
      badgeColor: 'bg-teal/20 text-teal border border-teal/40 shadow-glow-teal',
      glowShadow: 'group-hover:shadow-[0_20px_45px_rgba(45,212,191,0.22)]',
      btnActive: 'bg-gradient-to-r from-teal to-teal-dark text-navy font-extrabold shadow-glow-teal',
      btnDefault: 'bg-white/[0.06] hover:bg-teal hover:text-navy text-white border-white/15 hover:border-teal hover:shadow-glow-teal',
      btnText: t('landing.role_citizen_btn', 'Enter Citizen Hub'),
      action: () => navigate('/citizen')
    },
    {
      id: 'university',
      title: t('landing.role_uni_title', 'University / HEI R&D'),
      subtitle: t('landing.role_uni_sub', 'Academic Research Mobilization'),
      desc: t('landing.role_uni_desc', 'Access algorithmically matched local challenges, assign faculty mentors and student teams, and submit verified proposals.'),
      icon: GraduationCap,
      accentColor: 'blue',
      badgeColor: 'bg-blue-500/20 text-blue-400 border border-blue-400/40 shadow-[0_0_20px_rgba(59,130,246,0.3)]',
      glowShadow: 'group-hover:shadow-[0_20px_45px_rgba(59,130,246,0.22)]',
      btnActive: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white font-extrabold shadow-lg',
      btnDefault: 'bg-white/[0.06] hover:bg-blue-500/200 hover:text-white text-white border-white/15 hover:border-blue-400',
      btnText: isRoleActive('university') ? 'Open HEI Portal (Active Session)' : t('landing.role_uni_btn', 'HEI Portal Login'),
      action: () => navigate(isRoleActive('university') ? '/university' : '/login?role=university')
    },
    {
      id: 'industry',
      title: t('landing.role_ind_title', 'Industry & CSR Sponsor'),
      subtitle: t('landing.role_ind_sub', 'CSR Co-Funding & IP Agreements'),
      desc: t('landing.role_ind_desc', 'Browse vetted academic proposals aligned with corporate CSR mandates, pledge milestone funding, and execute bilateral IP frameworks.'),
      icon: Briefcase,
      accentColor: 'emerald',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 shadow-[0_0_20px_rgba(16,185,129,0.3)]',
      glowShadow: 'group-hover:shadow-[0_20px_45px_rgba(16,185,129,0.22)]',
      btnActive: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-extrabold shadow-lg',
      btnDefault: 'bg-white/[0.06] hover:bg-emerald-500/200 hover:text-white text-white border-white/15 hover:border-emerald-400',
      btnText: isRoleActive('industry') ? 'Open Industry Portal (Active Session)' : t('landing.role_ind_btn', 'Industry Portal Login'),
      action: () => navigate(isRoleActive('industry') ? '/industry' : '/login?role=industry')
    },
    {
      id: 'validation_officer',
      title: t('landing.role_dvo_title', 'District STI Nodal Officer'),
      subtitle: t('landing.role_dvo_sub', '48-Hour Field Validation'),
      desc: t('landing.role_dvo_desc', 'Validate citizen reports on the ground, request clarification, and confirm routing to recommended regional universities.'),
      icon: ShieldCheck,
      accentColor: 'amber',
      badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-400/40 shadow-glow-gold',
      glowShadow: 'group-hover:shadow-[0_20px_45px_rgba(245,158,11,0.22)]',
      btnActive: 'bg-gradient-to-r from-amber-500 to-amber-600 text-navy font-extrabold shadow-glow-gold',
      btnDefault: 'bg-white/[0.06] hover:bg-amber-500 hover:text-navy text-white border-white/15 hover:border-amber-400',
      btnText: isRoleActive('validation_officer') ? 'Open District Portal (Active Session)' : t('landing.role_dvo_btn', 'District Officer Login'),
      action: () => navigate(isRoleActive('validation_officer') ? '/validation' : '/login?role=validation_officer')
    },
    {
      id: 'government',
      title: t('landing.role_govt_title', 'State Government Admin'),
      subtitle: t('landing.role_govt_sub', 'Statewide Oversight & Verification'),
      desc: t('landing.role_govt_desc', 'Monitor statewide STI telemetry, manage SLA escalations, detect cross-district systemic patterns, and verify outcome attestations.'),
      icon: BarChart3,
      accentColor: 'purple',
      badgeColor: 'bg-purple-500/20 text-purple-400 border border-purple-400/40 shadow-[0_0_20px_rgba(168,85,247,0.3)]',
      glowShadow: 'group-hover:shadow-[0_20px_45px_rgba(168,85,247,0.22)]',
      btnActive: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white font-extrabold shadow-lg',
      btnDefault: 'bg-white/[0.06] hover:bg-purple-500/200 hover:text-white text-white border-white/15 hover:border-purple-400',
      btnText: isRoleActive('government') ? 'Open State Directorate (Active Session)' : t('landing.role_govt_btn', 'State Directorate Login'),
      action: () => navigate(isRoleActive('government') ? '/government' : '/login?role=government')
    }
  ];

  return (
    <div className="space-y-20 py-8 relative">
      {/* Hero Section with Official State Seal & Antigravity Luminous Canvas */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in-up">
        <div className="relative rounded-3xl p-8 sm:p-14 overflow-hidden border border-white/10 shadow-glass-deep bg-glass-gradient backdrop-blur-2xl">
          {/* Luminous Ambient Glow Orbs */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal/15 rounded-full blur-[120px] pointer-events-none -mr-32 -mt-32 animate-float"></div>
          <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-gold/10 rounded-full blur-[100px] pointer-events-none -ml-28 -mb-28 animate-float" style={{animationDelay:'3s'}}></div>

          <div className="flex flex-col lg:flex-row items-center justify-between gap-10 relative z-10">
            {/* Left Content Area */}
            <div className="max-w-3xl space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2.5 bg-gradient-to-r from-teal/20 to-teal/5 border border-teal/40 px-4 py-1.5 rounded-full text-xs text-teal font-bold shadow-glow-teal tracking-wide">
                <Sparkles className="w-4 h-4 text-teal animate-pulse" />
                <span>{t('landing.dept_badge', 'Government of Jharkhand — Department of Higher & Technical Education')}</span>
              </div>
              
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-heading font-extrabold tracking-tight leading-[1.15] text-white">
                {t('landing.hero_title', 'Mobilizing Higher Education Research for')}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal via-teal-light to-emerald-400">
                  {t('landing.hero_title_accent', 'Jharkhand’s Grassroots Challenges')}
                </span>
              </h1>

              <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl font-normal">
                <span className="text-teal font-bold">Bharat Panchyt (भारत पंचायत)</span> —{' '}
                {t('landing.hero_desc', "People's Actual Needs Connected With Higher-Education, Youth And Technology. An AI-powered civic platform connecting grassroots realities directly with state university research, CSR co-funding, and accountable governance.")}
              </p>

              {/* Quick Action Badges */}
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                <button
                  onClick={() => navigate('/citizen')}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-teal to-teal-dark hover:from-teal-hover hover:to-teal text-navy font-extrabold text-sm shadow-glow-teal transition-all flex items-center space-x-2 group"
                >
                  <Users className="w-4 h-4" />
                  <span>Report Grassroots Issue</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  onClick={() => navigate('/registry')}
                  className="px-6 py-3 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] text-white font-bold text-sm border border-white/15 transition-all flex items-center space-x-2"
                >
                  <Award className="w-4 h-4 text-gold" />
                  <span>Browse Outcomes & IP</span>
                </button>
              </div>
            </div>

            {/* Official State Emblem with Golden Map & Radiant Dual Aura */}
            <div className="shrink-0 flex flex-col items-center space-y-4">
              <div className="relative group">
                <div className="absolute -inset-1.5 bg-gradient-to-r from-teal via-gold to-emerald-400 rounded-full blur-lg opacity-75 group-hover:opacity-100 transition duration-700 animate-pulse"></div>
                <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.8)] ring-4 ring-white/20 bg-[#060E1A] p-1">
                  <img 
                    src="/jharkhand_state_emblem.jpg" 
                    alt="Government of Jharkhand Official Seal" 
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              </div>
              <div className="text-center space-y-0.5">
                <div className="text-xs font-extrabold text-white uppercase tracking-wider font-mono">
                  Government of Jharkhand
                </div>
                <div className="text-xs text-teal font-semibold">
                  झारखंड सरकार • आधिकारिक मुहर
                </div>
              </div>
            </div>
          </div>

          {/* Antigravity Floating Glass Stat Counters */}
          <div className="mt-12 pt-8 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white/[0.05] backdrop-blur-md p-5 rounded-2xl border border-white/10 hover:border-teal/50 hover:bg-white/[0.07] transition-all duration-300">
              <div className="text-3xl sm:text-4xl font-extrabold text-teal font-heading tracking-tight">3 Districts</div>
              <div className="text-xs text-slate-300 font-medium mt-1">Piloted in Ranchi, Dhanbad, East Singhbhum</div>
            </div>
            <div className="bg-white/[0.05] backdrop-blur-md p-5 rounded-2xl border border-white/10 hover:border-blue-400/50 hover:bg-white/[0.07] transition-all duration-300">
              <div className="text-3xl sm:text-4xl font-extrabold text-white font-heading tracking-tight">6 HEIs</div>
              <div className="text-xs text-slate-300 font-medium mt-1">Shodhganga-Mapped Universities Active</div>
            </div>
            <div className="bg-white/[0.05] backdrop-blur-md p-5 rounded-2xl border border-white/10 hover:border-emerald-400/50 hover:bg-white/[0.07] transition-all duration-300">
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-heading tracking-tight">5 CSR Partners</div>
              <div className="text-xs text-slate-300 font-medium mt-1">Tata Steel, Coal India & Research Labs</div>
            </div>
            <div className="bg-white/[0.05] backdrop-blur-md p-5 rounded-2xl border border-white/10 hover:border-gold/50 hover:bg-white/[0.07] transition-all duration-300">
              <div className="text-3xl sm:text-4xl font-extrabold text-gold font-heading tracking-tight">48h SLA</div>
              <div className="text-xs text-slate-300 font-medium mt-1">Mandated District STI Field Validation</div>
            </div>
          </div>
        </div>
      </section>

      {/* Illustrative regional entities demo disclaimer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10">
        <DemoDisclaimer />
      </div>

      {/* Stakeholder Role Portals (Antigravity Spatial Deck - 5 Sleek Floating Glass Cards) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in-up" style={{animationDelay:'0.2s'}}>
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center space-x-2 bg-teal/15 border border-teal/40 px-3.5 py-1.5 rounded-full text-xs text-teal font-extrabold uppercase tracking-widest shadow-glow-teal">
            <span>Stakeholder Role Gateway</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-white">
            Choose Your Operational Portal
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Select your capacity to access tailored institutional workflows, AI matching algorithms, SLA tracking, and bilateral IP agreements.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {roles.map((role, idx) => {
            const Icon = role.icon;
            const active = isRoleActive(role.id);

            return (
              <div 
                key={role.id}
                style={{animationDelay:`${idx * 0.1}s`}}
                className={`animate-fade-in-up rounded-3xl border transition-all duration-500 p-7 flex flex-col justify-between relative overflow-hidden group bg-gradient-to-b from-white/[0.08] to-white/[0.02] backdrop-blur-2xl ${
                  active 
                    ? 'border-teal ring-2 ring-teal/40 shadow-glow-teal bg-gradient-to-b from-teal/15 to-[#0B192C]' 
                    : `border-white/10 hover:border-white/30 hover:-translate-y-2 ${role.glowShadow} shadow-float hover:shadow-float-hover`
                }`}
              >
                {/* Active Session Indicator */}
                {active && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-teal to-teal-dark text-navy text-[11px] font-mono font-extrabold px-3.5 py-1 rounded-bl-xl uppercase tracking-wider shadow-md flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-navy animate-ping"></span>
                    <span>Active Session</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className={`p-3.5 rounded-2xl transition-transform duration-300 group-hover:scale-110 ${role.badgeColor}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      {role.subtitle}
                    </span>
                  </div>

                  <h3 className="text-xl font-heading font-extrabold text-white mb-2.5 group-hover:text-teal transition-colors">
                    {role.title}
                  </h3>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6 font-normal">
                    {role.desc}
                  </p>
                </div>

                <button
                  onClick={role.action}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center space-x-2 border shadow-md ${
                    active ? role.btnActive : role.btnDefault
                  }`}
                >
                  <span>{role.btnText}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Jharkhand State Official Map & Geospatial Overview (High-Definition Antigravity Viewport) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in-up" style={{animationDelay:'0.4s'}}>
        <div className="rounded-3xl p-6 sm:p-10 border border-white/10 shadow-glass-deep bg-glass-gradient backdrop-blur-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <div className="inline-flex items-center space-x-2 bg-teal/15 border border-teal/30 px-3.5 py-1 rounded-full text-xs text-teal font-bold mb-2">
                <span className="w-2 h-2 rounded-full bg-teal animate-pulse"></span>
                <span>Government of Jharkhand • Department of Higher & Technical Education</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-white">
                State of Jharkhand (झारखंड सरकार)
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm mt-1">
                Headquartered in Ranchi — Connecting all 24 districts to state university research hubs and industry CSR partners through Bharat Panchyt.
              </p>
            </div>
            <div className="flex items-center space-x-3 shrink-0">
              <button 
                onClick={() => navigate('/citizen')}
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-gradient-to-r from-teal to-teal-dark text-navy hover:from-teal-hover hover:to-teal transition-all shadow-glow-teal flex items-center space-x-2"
              >
                <MapPin className="w-4 h-4" />
                <span>Open Live GIS Map in Citizen Hub</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Official Jharkhand State Map Presentation with High-Fidelity Styling */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-[#060E1A] group">
            <img 
              src="/jharkhand_map_overview.jpg" 
              alt="Government of Jharkhand State Map with Capital Ranchi" 
              className="w-full h-auto max-h-[620px] object-contain sm:object-cover mx-auto transition-transform duration-700 group-hover:scale-[1.01]"
            />
            
            {/* Ambient Glassmorphism Caption Overlay */}
            <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md bg-[#0B192C]/90 backdrop-blur-xl text-white p-5 rounded-2xl border border-teal/40 shadow-2xl space-y-2 pointer-events-none">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal animate-ping"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-teal">State Administrative Center</span>
              </div>
              <div className="text-base font-heading font-extrabold text-white">
                Ranchi (State Capital) & 24 Mandated STI Districts
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                Statewide research orchestration active across Ranchi, Dhanbad, East Singhbhum, Bokaro, and all tribal development blocks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5-Step Innovation Architecture Pipeline (Antigravity Connected Timeline) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in-up" style={{animationDelay:'0.5s'}}>
        <div className="rounded-3xl p-8 sm:p-12 border border-white/10 shadow-glass-deep bg-white/[0.03] backdrop-blur-2xl space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center space-x-2 bg-teal/15 border border-teal/30 px-3 py-1 rounded-full text-xs text-teal font-extrabold uppercase tracking-widest">
              <span>Execution Architecture</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-heading font-extrabold text-white">
              The Bharat Panchyt Societal Innovation Pipeline
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm">
              End-to-end institutional workflow from citizen report to verified field impact.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white/[0.05] p-5 rounded-2xl border border-white/10 hover:border-teal/40 transition-all text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-teal text-navy font-extrabold flex items-center justify-center mx-auto text-sm shadow-glow-teal">1</div>
              <h4 className="font-heading font-bold text-sm text-white">Citizen Submission</h4>
              <p className="text-xs text-slate-300 leading-relaxed">Multimodal reporting via voice notes, geotagged photos, or PRI accounts with OTP verification.</p>
            </div>

            <div className="bg-white/[0.05] p-5 rounded-2xl border border-white/10 hover:border-blue-400/40 transition-all text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/200 text-white font-extrabold flex items-center justify-center mx-auto text-sm shadow-[0_0_20px_rgba(59,130,246,0.4)]">2</div>
              <h4 className="font-heading font-bold text-sm text-white">AI Pre-Screening</h4>
              <p className="text-xs text-slate-300 leading-relaxed">Automatically classifies domain sector, detects 500m duplicates, and drafts academic problem briefs.</p>
            </div>

            <div className="bg-white/[0.05] p-5 rounded-2xl border border-white/10 hover:border-amber-400/40 transition-all text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-amber-500 text-navy font-extrabold flex items-center justify-center mx-auto text-sm shadow-glow-gold">3</div>
              <h4 className="font-heading font-bold text-sm text-white">District STI Validation</h4>
              <p className="text-xs text-slate-300 leading-relaxed">Nodal Officer verifies feasibility within 48h SLA before academic routing confirmation.</p>
            </div>

            <div className="bg-white/[0.05] p-5 rounded-2xl border border-white/10 hover:border-indigo-400/40 transition-all text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-indigo-500 text-white font-extrabold flex items-center justify-center mx-auto text-sm shadow-[0_0_20px_rgba(99,102,241,0.4)]">4</div>
              <h4 className="font-heading font-bold text-sm text-white">HEI Research Match</h4>
              <p className="text-xs text-slate-300 leading-relaxed">Expertise graph scores candidate universities; faculty teams form and submit proposals.</p>
            </div>

            <div className="bg-white/[0.05] p-5 rounded-2xl border border-white/10 hover:border-emerald-400/40 transition-all text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/200 text-white font-extrabold flex items-center justify-center mx-auto text-sm shadow-[0_0_20px_rgba(16,185,129,0.4)]">5</div>
              <h4 className="font-heading font-bold text-sm text-white">CSR Co-Funding & IP</h4>
              <p className="text-xs text-slate-300 leading-relaxed">Industry matches CSR focus, generates official IP agreement PDF, and verifies field outcomes.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
