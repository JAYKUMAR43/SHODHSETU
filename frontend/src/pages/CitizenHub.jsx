import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Send, 
  Search, 
  Award, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  HelpCircle,
  Users
} from 'lucide-react';
import DemoDisclaimer from '../components/common/DemoDisclaimer';
import ProjectsMap from '../components/common/ProjectsMap';

const CitizenHub = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const citizenActions = [
    {
      id: 'submit',
      title: t('citizen_hub.submit_title', 'Submit a Challenge'),
      badge: t('citizen_hub.submit_badge', 'Grassroots Reporting'),
      badgeColor: 'bg-teal/20 text-teal border border-teal/40 shadow-glow-teal',
      icon: Send,
      iconColor: 'bg-teal/20 text-teal border border-teal/40',
      description: t('citizen_hub.submit_desc', 'Report a local challenge with geotagged photos or multilingual voice notes.'),
      details: [
        t('citizen_hub.submit_p1', 'Report water, agriculture, health, or civic infrastructure issues'),
        t('citizen_hub.submit_p2', 'Mandatory OTP-verified phone to receive SMS milestone alerts'),
        t('citizen_hub.submit_p3', 'Automatic browser geolocation and AI sector classification'),
        t('citizen_hub.submit_p4', 'Direct routing to District Science & Technology Officers')
      ],
      btnText: t('citizen_hub.submit_btn', 'Submit Challenge Now'),
      btnStyle: 'bg-gradient-to-r from-teal to-teal-dark hover:from-teal-hover hover:to-teal text-navy font-extrabold shadow-glow-teal',
      path: '/submit'
    },
    {
      id: 'track',
      title: t('citizen_hub.track_title', 'Track Status & Respond'),
      badge: t('citizen_hub.track_badge', 'Live Tracking'),
      badgeColor: 'bg-blue-500/20 text-blue-400 border border-blue-400/40 shadow-[0_0_20px_rgba(59,130,246,0.3)]',
      icon: Search,
      iconColor: 'bg-blue-500/20 text-blue-400 border border-blue-400/40',
      description: t('citizen_hub.track_desc', 'Enter your tracking ID to see official progress from submission to deployment.'),
      details: [
        t('citizen_hub.track_p1', 'Transparent 5-step milestone timeline with timestamps'),
        t('citizen_hub.track_p2', 'Answer officer clarification requests to resume validation SLA'),
        t('citizen_hub.track_p3', 'Verify whether deployed solutions are functioning in your community'),
        t('citizen_hub.track_p4', 'Accessible without password or account creation')
      ],
      btnText: t('citizen_hub.track_btn', 'Track Submission Status'),
      btnStyle: 'bg-white/[0.08] hover:bg-blue-600 text-white font-bold border border-white/15',
      path: '/track'
    },
    {
      id: 'registry',
      title: t('citizen_hub.registry_title', 'Innovation Registry'),
      badge: t('citizen_hub.registry_badge', 'Public Repository'),
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 shadow-[0_0_20px_rgba(16,185,129,0.3)]',
      icon: Award,
      iconColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/40',
      description: t('citizen_hub.registry_desc', 'Explore state-verified solutions, field deployments, and credited citizens.'),
      details: [
        t('citizen_hub.registry_p1', 'Search verified outcomes across Jharkhand districts and sectors'),
        t('citizen_hub.registry_p2', 'Inspect field evidence, test certificates, and university citations'),
        t('citizen_hub.registry_p3', 'Permanent credit attributed to original citizen reporters'),
        t('citizen_hub.registry_p4', 'Report post-deployment maintenance issues on operational systems')
      ],
      btnText: t('citizen_hub.registry_btn', 'Explore Public Registry'),
      btnStyle: 'bg-white/[0.08] hover:bg-emerald-600 text-white font-bold border border-white/15',
      path: '/registry'
    }
  ];

  return (
    <div className="space-y-12 py-8 animate-fade-in-up">
      {/* Top Banner / Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 text-xs font-bold text-slate-300 hover:text-white transition-all bg-white/[0.06] hover:bg-white/[0.12] px-4 py-2 rounded-xl border border-white/10 shadow-md backdrop-blur-md"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-teal" />
            <span>{t('nav.stakeholder_roles', 'Back to Stakeholder Portals')}</span>
          </Link>
        </div>

        {/* Hero Card for Citizen & Community */}
        <div className="rounded-3xl p-8 sm:p-12 shadow-[0_25px_60px_rgba(0,0,0,0.8)] border border-white/10 bg-gradient-to-b from-[#0F223D]/90 via-[#0B192C]/95 to-[#060E1A]/95 backdrop-blur-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal/15 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="max-w-3xl relative z-10 space-y-4">
            <div className="inline-flex items-center space-x-2 bg-teal/20 border border-teal/40 px-3.5 py-1.5 rounded-full text-xs text-teal font-bold shadow-glow-teal">
              <Users className="w-3.5 h-3.5 text-teal" />
              <span>नागरिक एवं समुदाय मंच • Citizen & Community Hub</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold tracking-tight text-white leading-tight">
              {t('citizen_hub.hero_title', 'Report Local Problems.')}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal via-teal-light to-emerald-400">
                {t('citizen_hub.hero_title_accent', 'Mobilize State Research.')}
              </span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
              {t('citizen_hub.hero_desc', 'A direct public channel to connect grassroots community challenges with leading academic researchers and CSR-funded technological solutions across Jharkhand. No password or user account required.')}
            </p>
          </div>
        </div>
      </div>

      {/* Illustrative Entities Notice */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <DemoDisclaimer />
      </div>

      {/* Core Citizen Workflows (3 Elevated Antigravity Glass Cards) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {citizenActions.map((action) => {
            const Icon = action.icon;
            return (
              <div
                key={action.id}
                className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] backdrop-blur-2xl p-7 shadow-[0_20px_45px_rgba(0,0,0,0.5)] hover:border-teal/50 hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className={`p-3.5 rounded-2xl border ${action.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-[11px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full ${action.badgeColor}`}>
                      {action.badge}
                    </span>
                  </div>

                  <h2 className="text-xl font-heading font-extrabold text-white mb-2.5 group-hover:text-teal transition-colors">
                    {action.title}
                  </h2>

                  <p className="text-slate-200 text-xs sm:text-sm font-medium mb-5 bg-white/[0.05] p-3.5 rounded-xl border border-white/10">
                    {action.description}
                  </p>

                  <ul className="space-y-2.5 mb-6">
                    {action.details.map((point, idx) => (
                      <li key={idx} className="flex items-start space-x-2.5 text-xs text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <button
                    onClick={() => navigate(action.path)}
                    className={`w-full py-3.5 px-5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center space-x-2 shadow-md ${action.btnStyle}`}
                  >
                    <span>{action.btnText}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Statewide Working Projects GIS Map for Citizens */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ProjectsMap
          mode="all"
          title="Jharkhand State Working Projects & Deployments GIS Map"
          subtitle="Explore all verified grassroots solutions, pilot trials, and academic field deployments operating across Jharkhand's 24 districts."
        />
      </section>

      {/* Helpful Civic Note */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl p-6 border border-white/10 bg-white/[0.05] backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 rounded-xl bg-teal/20 text-teal border border-teal/40 flex-shrink-0 shadow-glow-teal">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-heading font-extrabold text-white">
                No Login Required for Citizens
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Individuals, village representatives, and PRI/ULB nodal staff can submit challenges directly. Tracking IDs are generated instantly upon submission.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CitizenHub;
