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

const CitizenHub = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const citizenActions = [
    {
      id: 'submit',
      title: t('citizen_hub.submit_title', 'Submit a Challenge'),
      badge: t('citizen_hub.submit_badge', 'Grassroots Reporting'),
      badgeColor: 'bg-teal/10 text-teal-dark border-teal/30',
      icon: Send,
      iconColor: 'bg-teal/10 text-teal border-teal/30',
      description: t('citizen_hub.submit_desc', 'Report a local challenge with geotagged photos or multilingual voice notes.'),
      details: [
        t('citizen_hub.submit_p1', 'Report water, agriculture, health, or civic infrastructure issues'),
        t('citizen_hub.submit_p2', 'Mandatory OTP-verified phone to receive SMS milestone alerts'),
        t('citizen_hub.submit_p3', 'Automatic browser geolocation and AI sector classification'),
        t('citizen_hub.submit_p4', 'Direct routing to District Science & Technology Officers')
      ],
      btnText: t('citizen_hub.submit_btn', 'Submit Challenge Now'),
      btnStyle: 'bg-teal text-navy hover:bg-teal-dark hover:text-white',
      path: '/submit'
    },
    {
      id: 'track',
      title: t('citizen_hub.track_title', 'Track Status & Respond'),
      badge: t('citizen_hub.track_badge', 'Live Tracking'),
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Search,
      iconColor: 'bg-blue-50 text-blue-700 border-blue-200',
      description: t('citizen_hub.track_desc', 'Enter your tracking ID to see official progress from submission to deployment.'),
      details: [
        t('citizen_hub.track_p1', 'Transparent 5-step milestone timeline with timestamps'),
        t('citizen_hub.track_p2', 'Answer officer clarification requests to resume validation SLA'),
        t('citizen_hub.track_p3', 'Verify whether deployed solutions are functioning in your community'),
        t('citizen_hub.track_p4', 'Accessible without password or account creation')
      ],
      btnText: t('citizen_hub.track_btn', 'Track Submission Status'),
      btnStyle: 'bg-navy text-white hover:bg-navy-light',
      path: '/track'
    },
    {
      id: 'registry',
      title: t('citizen_hub.registry_title', 'Innovation Registry'),
      badge: t('citizen_hub.registry_badge', 'Public Repository'),
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: Award,
      iconColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      description: t('citizen_hub.registry_desc', 'Explore state-verified solutions, field deployments, and credited citizens.'),
      details: [
        t('citizen_hub.registry_p1', 'Search verified outcomes across Jharkhand districts and sectors'),
        t('citizen_hub.registry_p2', 'Inspect field evidence, test certificates, and university citations'),
        t('citizen_hub.registry_p3', 'Permanent credit attributed to original citizen reporters'),
        t('citizen_hub.registry_p4', 'Report post-deployment maintenance issues on operational systems')
      ],
      btnText: t('citizen_hub.registry_btn', 'Explore Public Registry'),
      btnStyle: 'bg-slate-100 text-navy hover:bg-navy hover:text-white border border-slate-300',
      path: '/registry'
    }
  ];

  return (
    <div className="space-y-10 py-8">
      {/* Top Banner / Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-navy transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('nav.stakeholder_roles', 'Back to Stakeholder Roles')}</span>
          </Link>
        </div>

        {/* Hero Card for Citizen & Community */}
        <div className="bg-navy text-white rounded-2xl p-8 sm:p-10 shadow-xl border border-navy-light relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-teal/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-3xl relative z-10 space-y-4">
            <div className="inline-flex items-center space-x-2 bg-teal/20 border border-teal/40 px-3 py-1 rounded-full text-xs text-teal font-medium">
              <Users className="w-3.5 h-3.5" />
              <span>नागरिक एवं समुदाय मंच • Citizen & Community Hub</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-heading font-extrabold tracking-tight">
              {t('citizen_hub.title', 'Citizen Problem Reporting & Resolution Portal')}
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              {t('citizen_hub.desc', 'Submit grassroots challenges directly to regional university research teams and district validation officers. No login required.')}
            </p>
          </div>
        </div>
      </div>

      {/* Illustrative demo disclaimer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
        <DemoDisclaimer />
      </div>

      {/* The 3 Core Actions Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {citizenActions.map((action) => {
            const Icon = action.icon;
            return (
              <div 
                key={action.id}
                className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className={`p-3.5 rounded-xl border ${action.iconColor} group-hover:scale-105 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${action.badgeColor}`}>
                      {action.badge}
                    </span>
                  </div>

                  <h2 className="text-xl font-heading font-bold text-navy mb-2">
                    {action.title}
                  </h2>

                  <p className="text-slate-700 text-sm font-medium mb-5 bg-canvas p-3 rounded-lg border border-slate-100">
                    {action.description}
                  </p>

                  <ul className="space-y-2 mb-6">
                    {action.details.map((point, idx) => (
                      <li key={idx} className="flex items-start space-x-2 text-xs text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal flex-shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <button
                    onClick={() => navigate(action.path)}
                    className={`w-full py-3 px-5 rounded-xl font-bold text-sm transition-all flex items-center justify-center space-x-2 shadow-sm ${action.btnStyle}`}
                  >
                    <span>{action.btnText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Helpful Civic Note */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-canvas-alt rounded-xl p-6 border border-steel/20 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-teal/10 text-teal border border-teal/20 flex-shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-heading font-bold text-navy">
                No Login Required for Citizens
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
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
