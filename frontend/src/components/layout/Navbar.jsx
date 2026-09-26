import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { 
  GraduationCap, 
  Briefcase, 
  ClipboardCheck, 
  BarChart3, 
  LogOut, 
  Layers
} from 'lucide-react';
import Logo from '../common/Logo';
import NotificationCentre from '../common/NotificationCentre';

const Navbar = () => {
  const { user, logout, isUniversity, isIndustry, isValidationOfficer, isGovernment } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const isActive = (path) => location.pathname === path;
  const isLandingPage = location.pathname === '/';
  // Institutional panels are strictly isolated
  const isPanelPage = ['/university', '/industry', '/validation', '/government'].some(p => location.pathname.startsWith(p));

  const getRoleDisplayName = () => {
    if (isUniversity) return 'HEI Portal';
    if (isIndustry) return 'Industry CSR';
    if (isValidationOfficer) return 'District STI';
    if (isGovernment) return 'State Directorate';
    return user?.role?.replace('_', ' ') || 'Portal';
  };

  const LanguageSelector = () => (
    <div className="flex items-center bg-white/[0.06] p-1 rounded-full border border-white/15 shadow-inner text-xs">
      <button
        type="button"
        onClick={() => changeLanguage('en')}
        className={`px-3 py-1 rounded-full font-bold transition-all duration-300 ${
          i18n.language !== 'hi' ? 'bg-teal text-navy shadow-glow-teal' : 'text-slate-300 hover:text-white'
        }`}
      >
        English
      </button>
      <button
        type="button"
        onClick={() => changeLanguage('hi')}
        className={`px-3 py-1 rounded-full font-bold transition-all duration-300 ${
          i18n.language === 'hi' ? 'bg-teal text-navy shadow-glow-teal' : 'text-slate-300 hover:text-white'
        }`}
      >
        हिन्दी
      </button>
    </div>
  );

  return (
    <header className="sticky top-0 z-50 bg-[#0B192C]/90 backdrop-blur-2xl text-white shadow-2xl border-b border-white/10">
      {/* Top Gov Official Ribbon */}
      <div className="bg-[#060E1A]/95 text-slate-300 text-[11px] py-1.5 px-4 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-teal animate-pulse"></span>
            <span className="font-medium tracking-wide">{t('nav.official_header', 'Government of Jharkhand — Department of Higher & Technical Education')}</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-400">
            <span className="text-teal font-semibold hidden sm:inline">{t('nav.official_portal', 'Official Societal STI Collaboration Platform')}</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {isLandingPage ? (
          /* Landing Page: Clean public centered header with single logo and language toggle only */
          <div className="flex justify-between items-center py-4">
            <Link to="/" aria-label="Bharat Panchyt Home">
              <Logo size="md" light={true} />
            </Link>

            {/* Right side language toggle only */}
            <div className="flex items-center space-x-3">
              <LanguageSelector />
            </div>
          </div>
        ) : isPanelPage ? (
          /* Institutional Panel Pages: Left-aligned logo, role navigation tabs, notification centre, user info & logout */
          <div className="flex justify-between h-16 items-center">
            {/* Brand Logo with Role Scope Pill */}
            <div className="flex items-center space-x-3">
              <Link to="/" aria-label="Bharat Panchyt Home">
                <Logo size="md" light={true} />
              </Link>
              <span className="hidden md:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-teal/15 text-teal border border-teal/30 font-bold">
                {getRoleDisplayName()}
              </span>
            </div>

            {/* Center Role Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1.5 bg-white/[0.05] p-1 rounded-2xl border border-white/10">
              {isUniversity && (
                <>
                  <Link 
                    to="/university" 
                    className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isActive('/university') ? 'bg-teal text-navy shadow-glow-teal' : 'text-slate-300 hover:text-white hover:bg-white/[0.08]'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Matches Inbox</span>
                  </Link>
                  <Link 
                    to="/university/profile" 
                    className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isActive('/university/profile') ? 'bg-teal text-navy shadow-glow-teal' : 'text-slate-300 hover:text-white hover:bg-white/[0.08]'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>Expertise Graph</span>
                  </Link>
                </>
              )}

              {isIndustry && (
                <Link 
                  to="/industry" 
                  className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive('/industry') ? 'bg-teal text-navy shadow-glow-teal' : 'text-slate-300 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  <span>CSR Proposal Feed</span>
                </Link>
              )}

              {isValidationOfficer && (
                <Link 
                  to="/validation" 
                  className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive('/validation') ? 'bg-teal text-navy shadow-glow-teal' : 'text-amber-400 hover:bg-white/[0.08]'
                  }`}
                >
                  <ClipboardCheck className="w-4 h-4" />
                  <span>Validation Queue</span>
                </Link>
              )}

              {isGovernment && (
                <Link 
                  to="/government" 
                  className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive('/government') ? 'bg-teal text-navy shadow-glow-teal' : 'text-slate-300 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>State Analytics</span>
                </Link>
              )}
            </nav>

            {/* Right Action: Notification Centre, User Profile & Sign Out */}
            <div className="flex items-center space-x-3">
              {/* Institutional Notification Centre */}
              <NotificationCentre />

              {/* User Profile Info */}
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-white">{user?.name}</div>
                <div className="text-[10px] text-teal uppercase tracking-wider font-mono font-medium">{user?.role?.replace('_', ' ')}</div>
              </div>

              {/* Sign Out Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/[0.06] hover:bg-red hover:text-white text-slate-300 transition-all border border-white/10"
                title={t('nav.logout', 'Sign Out')}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('nav.logout', 'Sign Out')}</span>
              </button>
            </div>
          </div>
        ) : (
          /* All Other Pages (Login, Citizen Hub, Submit, Track, Registry): 
             Clean header with Brand Logo on left and Language Toggle on right.
             No citizen links cluttering the top, no return buttons. */
          <div className="flex justify-between h-16 items-center">
            {/* Brand Logo */}
            <Link to="/" aria-label="Bharat Panchyt Home">
              <Logo size="md" light={true} />
            </Link>

            {/* Right: Language toggle only */}
            <div className="flex items-center space-x-3">
              <LanguageSelector />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
