import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  CheckCheck, 
  FileText, 
  MessageSquare, 
  AlertTriangle, 
  MapPin, 
  Briefcase, 
  CheckCircle2, 
  GraduationCap, 
  Clock, 
  FileCheck, 
  Building2, 
  Award, 
  AlertOctagon, 
  Sparkles, 
  ShieldCheck, 
  Users,
  X,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import api, { getFileUrl } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const EVENT_CONFIG = {
  NEW_CITIZEN_REPORT: { icon: FileText, badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30', label: 'Citizen Report' },
  CITIZEN_CLARIFICATION: { icon: MessageSquare, badgeColor: 'bg-blue-500/20 text-blue-300 border border-blue-400/30', label: 'Clarification' },
  SLA_WARNING: { icon: AlertTriangle, badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-400/40', label: 'SLA Warning' },
  DISTRICT_ROUTING: { icon: MapPin, badgeColor: 'bg-teal/20 text-teal border border-teal/40', label: 'District Routing' },
  CSR_REVIEW: { icon: Briefcase, badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30', label: 'CSR Evaluation' },
  MILESTONE_APPROVED: { icon: CheckCircle2, badgeColor: 'bg-green-500/20 text-green-300 border border-green-400/30', label: 'Milestone Approved' },
  TEAM_ASSIGNMENT: { icon: Users, badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-400/30', label: 'Team Assigned' },
  NEW_PROPOSAL: { icon: GraduationCap, badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30', label: 'HEI Proposal' },
  MILESTONE_SUBMITTED: { icon: Clock, badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-400/30', label: 'Milestone Review' },
  PROJECT_COMPLETED: { icon: CheckCheck, badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40', label: 'Deployment Verified' },
  IP_AGREEMENT_READY: { icon: ShieldCheck, badgeColor: 'bg-teal/20 text-teal border border-teal/40', label: 'Bilateral IP' },
  REPORT_SUBMITTED: { icon: FileCheck, badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-400/30', label: 'Report Submission' },
  CSR_REPORT_SUBMITTED: { icon: Building2, badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30', label: 'CSR Statement' },
  OUTCOME_CLAIM: { icon: Award, badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-400/30', label: 'Outcome Claim' },
  SLA_ESCALATION: { icon: AlertOctagon, badgeColor: 'bg-red-500/200/25 text-red-300 border border-red-400/40', label: 'SLA Escalation' },
  SLA_BREACH_ESCALATION: { icon: AlertOctagon, badgeColor: 'bg-red-500/200/25 text-red-300 border border-red-400/40', label: 'SLA Escalation' },
  SYSTEMIC_ALERT: { icon: Sparkles, badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30', label: 'Systemic Pattern' },
  OUTCOME_VERIFICATION_RESULT: { icon: Award, badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-400/30', label: 'Verification Result' }
};

const formatTimeAgo = (dateString) => {
  if (!dateString) return 'Just now';
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 172800) return 'Yesterday';
  return `${Math.floor(diffSec / 86400)}d ago`;
};

const NotificationCentre = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread'
  const containerRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (Array.isArray(res.data)) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.warn("Notifications poll silent catch", err.message);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch (err) {
      console.error("Failed to mark notification read", err);
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await api.patch('/notifications/read-all');
    } catch (err) {
      console.error("Failed to mark all read", err);
    }
  };

  const isWarningNotification = (notif) => {
    const type = notif.event_type || '';
    return (
      type === 'SLA_WARNING' ||
      type === 'SLA_ESCALATION' ||
      type === 'SLA_BREACH_ESCALATION' ||
      type === 'SYSTEMIC_ALERT' ||
      type.includes('WARNING') ||
      type.includes('ESCALATION') ||
      type.includes('BREACH')
    );
  };

  // Real Click Navigation: Smartly directs user to the problem statement, dossier, or generated PDF
  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      handleMarkAsRead(notif.id);
    }
    setIsOpen(false);

    // Rule 1: Warning notifications are purely informational alerts — no navigation / no portal reload
    if (isWarningNotification(notif)) {
      return;
    }

    const msg = notif.message || '';

    // Rule 2: Check for Challenge / Project Tracking ID (e.g. BP-1234, SS-1001, /track/BP-1234, ID: BP-1234)
    const trackMatch = 
      msg.match(/\b(BP-\d{3,}|SS-\d{3,})\b/i) || 
      msg.match(/\/track\/([A-Za-z0-9-]+)/i) || 
      msg.match(/Tracking ID:?\s*([A-Za-z0-9-]+)/i) || 
      msg.match(/\(ID:?\s*([A-Za-z0-9-]+)\)/i) ||
      msg.match(/Challenge\s*#?([A-Za-z0-9-]+)/i);

    if (trackMatch) {
      const trackingId = trackMatch[1];
      navigate(`/track/${trackingId}`);
      return;
    }

    // Rule 3: Check for direct PDF Report, Agreement, or Evidence file link
    const docMatch = msg.match(/(https?:\/\/[^\s"',]+|\/uploads\/[^\s"',]+)/i);
    if (docMatch) {
      const targetDoc = docMatch[0].replace(/[.,;)]+$/, '');
      if (targetDoc.toLowerCase().includes('.pdf') || targetDoc.startsWith('/uploads/') || targetDoc.startsWith('http')) {
        window.open(getFileUrl(targetDoc), '_blank');
        return;
      }
    }

    // Rule 4: Official Report Submission events -> navigate to Submitted Reports audit tab
    if (notif.event_type === 'REPORT_SUBMITTED' || notif.event_type === 'CSR_REPORT_SUBMITTED') {
      navigate('/government?tab=reports');
      return;
    }

    // Rule 5: Role- & Event-aware smart destination mapping
    switch (notif.event_type) {
      case 'NEW_CITIZEN_REPORT':
      case 'CITIZEN_CLARIFICATION':
      case 'VALIDATION_PENDING':
        navigate('/validation');
        break;

      case 'NEW_MATCH':
      case 'NEW_PROPOSAL':
      case 'TEAM_ASSIGNMENT':
      case 'TEAM_FORMED':
      case 'DISTRICT_ROUTING':
        navigate('/university');
        break;

      case 'CSR_REVIEW':
      case 'IP_AGREEMENT_GENERATED':
      case 'IP_AGREEMENT_READY':
      case 'MILESTONE_SUBMITTED':
      case 'MILESTONE_APPROVED':
      case 'MILESTONE_REVISION_REQUESTED':
        navigate('/industry');
        break;

      case 'OUTCOME_CLAIM':
      case 'OUTCOME_VERIFICATION_RESULT':
      case 'PROJECT_COMPLETED':
        navigate('/registry');
        break;

      case 'OUTCOME_CONFIRMATION_REQUESTED':
      case 'OUTCOME_DISPUTED':
        navigate('/government?tab=verification');
        break;

      default:
        if (user?.role === 'validation_officer') navigate('/validation');
        else if (user?.role === 'university') navigate('/university');
        else if (user?.role === 'industry') navigate('/industry');
        else if (user?.role === 'government') navigate('/government');
        else navigate('/citizen');
        break;
    }
  };

  const filteredNotifications = activeTab === 'unread' 
    ? notifications.filter(n => !n.read) 
    : notifications;

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Bell Button — 44x44px min tap target */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative min-w-[40px] min-h-[40px] p-2.5 rounded-lg transition-all border flex items-center justify-center ${
          isOpen 
            ? 'bg-teal text-navy border-teal font-bold shadow-md' 
            : 'bg-[#13243D] text-slate-200 hover:text-white hover:bg-[#1A3152] border-slate-700'
        }`}
        title="Notifications"
        aria-label="Open Institutional Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red text-[10px] font-bold text-white shadow-md animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Flyout Notification Panel — 100% SOLID OPAQUE BACKGROUND, NO TRANSPARENCY BLEED */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-84 sm:w-96 rounded-xl bg-[#0E1F36] shadow-2xl border border-slate-700 z-[9999] overflow-hidden text-slate-100 animate-fade-in-up"
          style={{ backgroundColor: '#0E1F36', opacity: 1 }}
        >
          {/* Header */}
          <div className="bg-[#142847] px-4 py-3 text-white flex items-center justify-between border-b border-slate-700">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-teal/20 text-teal">
                <Bell className="w-4 h-4" />
              </div>
              <span className="font-heading font-bold text-sm text-white">Notification Centre</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal/20 text-teal uppercase border border-teal/40">
                {user?.role?.replace('_', ' ') || 'Institutional'}
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Close notifications"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Subheader Toolbar & Tabs */}
          <div className="px-4 py-2.5 bg-[#0B182B] border-b border-slate-800 flex items-center justify-between">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'all' 
                    ? 'bg-teal text-navy font-bold' 
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setActiveTab('unread')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'unread' 
                    ? 'bg-teal text-navy font-bold' 
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-teal hover:text-teal-light hover:underline flex items-center space-x-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Notification List — Solid list with distinct background colors per item */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-800 bg-[#0E1F36]">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2 bg-[#0E1F36]">
                <CheckCircle2 className="w-8 h-8 mx-auto text-teal" />
                <p className="text-sm font-medium text-slate-300">All caught up! No notifications.</p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const config = EVENT_CONFIG[notif.event_type] || { 
                  icon: Bell, 
                  badgeColor: 'bg-slate-700 text-slate-200 border border-slate-600', 
                  label: notif.event_type?.replace(/_/g, ' ') || 'Notice' 
                };
                const IconComponent = config.icon;

                const isWarning = isWarningNotification(notif);

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`group p-3.5 transition-all cursor-pointer flex items-start space-x-3 text-left ${
                      notif.read 
                        ? 'bg-[#0E1F36] hover:bg-[#122542] text-slate-300' 
                        : 'bg-[#152B4D] hover:bg-[#183157] text-white border-l-4 border-teal'
                    }`}
                    title={isWarning ? "Informational alert (Click to mark as read)" : "Click to view project / report details"}
                  >
                    {/* Event Icon Badge */}
                    <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${config.badgeColor}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`text-[11px] font-bold uppercase tracking-wider font-mono ${
                          notif.read ? 'text-slate-400' : 'text-teal'
                        }`}>
                          {config.label}
                        </span>
                        <span className="text-[11px] text-slate-400 shrink-0 font-mono">
                          {formatTimeAgo(notif.created_at)}
                        </span>
                      </div>
                      <p className={`text-xs sm:text-sm leading-relaxed ${notif.read ? 'text-slate-300 font-normal' : 'text-white font-semibold'}`}>
                        {notif.message}
                      </p>
                    </div>

                    {/* Click indicator / Unread indicator */}
                    <div className="flex items-center space-x-1.5 shrink-0 mt-2">
                      {!notif.read && (
                        <span 
                          className="w-2 h-2 rounded-full bg-teal shadow-sm animate-pulse" 
                          title="Unread"
                        />
                      )}
                      {isWarning ? (
                        <span 
                          className="text-[9px] font-mono font-bold text-amber-300/80 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded uppercase"
                          title="Alert Notice (Informational, will not navigate)"
                        >
                          Alert
                        </span>
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5 text-teal opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Bar */}
          <div className="bg-[#0B182B] px-4 py-2.5 border-t border-slate-800 text-center">
            <span className="text-[11px] font-medium text-slate-400">
              Government of Jharkhand • Real-Time STI Telemetry & Alerts
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCentre;
