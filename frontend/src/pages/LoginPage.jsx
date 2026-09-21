import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LogIn, 
  GraduationCap, 
  Briefcase, 
  ShieldCheck, 
  BarChart3, 
  AlertCircle,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import Logo from '../components/common/Logo';

const ROLE_CONFIGS = {
  university: {
    key: 'university',
    title: 'University / HEI Portal Login',
    subtitle: 'For Deans of R&D, Faculty Mentors & Academic Coordinators',
    icon: GraduationCap,
    emailPlaceholder: 'uni.bit@jh.gov.in',
    redirect: '/university'
  },
  industry: {
    key: 'industry',
    title: 'Industry & CSR Partner Login',
    subtitle: 'For CSR Heads, MSME Leaders & Industrial Sponsors',
    icon: Briefcase,
    emailPlaceholder: 'csr.tatasteel@jh.gov.in',
    redirect: '/industry'
  },
  validation_officer: {
    key: 'validation_officer',
    title: 'District STI Nodal Officer Login',
    subtitle: 'For District Science, Technology & Innovation Officers',
    icon: ShieldCheck,
    emailPlaceholder: 'dvo.ranchi@jh.gov.in',
    redirect: '/validation'
  },
  government: {
    key: 'government',
    title: 'State Government Directorate Login',
    subtitle: 'For Directorate of Higher & Technical Education',
    icon: BarChart3,
    emailPlaceholder: 'admin.sti@jh.gov.in',
    redirect: '/government'
  }
};

const normalizeRole = (roleStr) => {
  if (!roleStr) return null;
  const r = roleStr.toLowerCase().trim().replace(/-/g, '_');
  if (['university', 'hei', 'uni'].includes(r)) return 'university';
  if (['industry', 'csr'].includes(r)) return 'industry';
  if (['validation_officer', 'validation', 'dvo', 'nodal_officer'].includes(r)) return 'validation_officer';
  if (['government', 'admin', 'state_admin', 'state_government'].includes(r)) return 'government';
  return ROLE_CONFIGS[r] ? r : null;
};

const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const { role: routeRole } = useParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const rawRole = routeRole || searchParams.get('role');
  const currentRole = normalizeRole(rawRole);
  const roleConfig = currentRole ? ROLE_CONFIGS[currentRole] : null;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setEmail('');
    setPassword('');
    setError('');
  }, [currentRole]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'university') navigate('/university');
      else if (user.role === 'industry') navigate('/industry');
      else if (user.role === 'validation_officer') navigate('/validation');
      else if (user.role === 'government') navigate('/government');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  // Fallback role selection view
  if (!roleConfig) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 space-y-6">
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-teal/10 text-teal border border-teal/20 flex items-center justify-center mx-auto">
              <LogIn className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-heading font-extrabold text-navy">
              Institutional Portal Login
            </h1>
            <p className="text-xs text-slate-500">
              Select your institutional stakeholder capacity to access your dedicated portal.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {Object.entries(ROLE_CONFIGS).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <Link
                  key={key}
                  to={`/login?role=${key}`}
                  className="flex items-center space-x-3.5 p-3.5 rounded-xl border border-slate-200 hover:border-teal/50 hover:bg-canvas transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-teal/10 text-teal flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-navy group-hover:text-teal transition-colors">
                      {config.title.replace(' Login', '')}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {config.subtitle}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal transition-colors" />
                </Link>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100 text-center">
            <Link
              to="/"
              className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-navy transition-colors font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const RoleIcon = roleConfig.icon;

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-teal/10 text-teal border border-teal/20 flex items-center justify-center mx-auto">
            <RoleIcon className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-heading font-extrabold text-navy">
            {roleConfig.title}
          </h1>
          <p className="text-xs text-slate-500">
            {roleConfig.subtitle}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-light border border-red-border text-red-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
              Enter your ID
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your ID"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
              Enter your password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-navy hover:bg-navy-light text-white font-bold text-xs transition-colors shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <LogIn className="w-4 h-4 text-teal" />
            <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center">
          <Link
            to="/login"
            className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-navy transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Choose a different role</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
