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

const Navbar = () => {
  const { user, logout, isAuthenticated, isUniversity, isIndustry, isValidationOfficer, isGovernment } = useAuth();
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
  const isCitizenPage = ['/', '/citizen', '/submit', '/track', '/registry'].includes(location.pathname);

  const LanguageSelector = () => (
    <div className="flex items-center bg-navy-light/90 p-0.5 rounded-lg border border-steel-light/40 text-xs">
      <button
        type="button"
        onClick={() => changeLanguage('en')}
        className={`px-2.5 py-1 rounded font-medium transition-all ${
          i18n.language !== 'hi' ? 'bg-teal text-navy font-bold shadow-sm' : 'text-slate-300 hover:text-white'
        }`}
      >
        English
      </button>
      <button
        type="button"
        onClick={() => changeLanguage('hi')}
        className={`px-2.5 py-1 rounded font-medium transition-all ${
          i18n.language === 'hi' ? 'bg-teal text-navy font-bold shadow-sm' : 'text-slate-300 hover:text-white'
        }`}
      >
        हिन्दी
      </button>
    </div>
  );

  return (
    <header className="sticky top-0 z-50 bg-navy text-white shadow-md border-b border-navy-light">
      {/* Top Gov Official Ribbon */}
      <div className="bg-navy-dark text-slate-300 text-xs py-1 px-4 border-b border-navy-light/40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-teal"></span>
            <span>{t('nav.official_header', 'Government of Jharkhand — Department of Higher & Technical Education')}</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-400">
            <span className="text-teal font-medium hidden sm:inline">{t('nav.official_portal', 'Official Societal STI Collaboration Platform')}</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {isLandingPage ? (
          /* Landing Page: Centered header with single logo and language toggle */
          <div className="relative flex justify-center items-center py-4">
            <Link to="/" aria-label="ShodhSetu Home">
              <Logo size="md" light={true} />
            </Link>

            {/* Right side language toggle & authenticated user actions */}
            <div className="absolute right-0 flex items-center space-x-3">
              <LanguageSelector />
              {isAuthenticated && (
                <div className="flex items-center space-x-3">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-semibold text-white">{user.name}</div>
                    <div className="text-[10px] text-teal uppercase tracking-wider font-mono">{user.role?.replace('_', ' ')}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded text-xs bg-navy-light hover:bg-red text-slate-200 hover:text-white transition-colors border border-steel"
                    title={t('nav.logout', 'Sign Out')}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t('nav.logout', 'Sign Out')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Non-Landing Pages: Left-aligned logo, authenticated links in center, auth action on right */
          <div className="flex justify-between h-16 items-center">
            {/* Brand Logo */}
            <Link to="/" aria-label="ShodhSetu Home">
              <Logo size="md" light={true} />
            </Link>

            {/* Center Links - ONLY for authenticated role dashboards */}
            {isAuthenticated && (
              <nav className="hidden md:flex items-center space-x-1">
                {isUniversity && (
                  <>
                    <Link 
                      to="/university" 
                      className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive('/university') ? 'bg-teal text-navy font-semibold' : 'text-slate-200 hover:text-white hover:bg-navy-light'
                      }`}
                    >
                      <GraduationCap className="w-4 h-4" />
                      <span>Matches Inbox</span>
                    </Link>
                    <Link 
                      to="/university/profile" 
                      className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive('/university/profile') ? 'bg-teal text-navy font-semibold' : 'text-slate-200 hover:text-white hover:bg-navy-light'
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
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/industry') ? 'bg-teal text-navy font-semibold' : 'text-slate-200 hover:text-white hover:bg-navy-light'
                    }`}
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>CSR Proposal Feed</span>
                  </Link>
                )}

                {isValidationOfficer && (
                  <Link 
                    to="/validation" 
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/validation') ? 'bg-teal text-navy font-semibold' : 'text-amber-pending hover:bg-navy-light'
                    }`}
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    <span>Validation Queue</span>
                  </Link>
                )}

                {isGovernment && (
                  <Link 
                    to="/government" 
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/government') ? 'bg-teal text-navy font-semibold' : 'text-slate-200 hover:text-white hover:bg-navy-light'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>State Analytics</span>
                  </Link>
                )}
              </nav>
            )}

            {/* Right Action / Auth Area */}
            <div className="flex items-center space-x-3">
              {isCitizenPage && <LanguageSelector />}
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-semibold text-white">{user.name}</div>
                    <div className="text-[10px] text-teal uppercase tracking-wider font-mono">{user.role?.replace('_', ' ')}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded text-xs bg-navy-light hover:bg-red text-slate-200 hover:text-white transition-colors border border-steel"
                    title={t('nav.logout', 'Sign Out')}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t('nav.logout', 'Sign Out')}</span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
