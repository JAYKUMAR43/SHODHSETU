import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Send, 
  MapPin, 
  Camera, 
  Mic, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Copy, 
  ArrowRight,
  ArrowLeft,
  Building,
  Phone,
  KeyRound,
  Clock,
  Calendar,
  Database
} from 'lucide-react';
import api from '../services/api';

const CATEGORIES = [
  { id: '', label: '✨ AI Auto-Classify' },
  { id: 'water_resources', label: 'Water Resources & Fluoride/Arsenic Mitigation' },
  { id: 'agriculture', label: 'Agriculture, Soil & Post-Harvest Systems' },
  { id: 'healthcare', label: 'Healthcare & Point-of-Care Diagnostics' },
  { id: 'environment', label: 'Environment & Mine Remediation' },
  { id: 'energy', label: 'Renewable Energy & Microgrids' },
  { id: 'rural_livelihoods', label: 'Rural Livelihoods, Lac & Tussar Sericulture' },
  { id: 'education', label: 'Education & Vernacular Pedagogy' },
  { id: 'urban_development', label: 'Urban Development & Waste Management' },
  { id: 'accessibility', label: 'Accessibility & Divyang Technologies' },
  { id: 'public_administration', label: 'Public Administration & Civic Grievances' }
];

const SubmitChallenge = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [copied, setCopied] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    submitter_type: 'citizen',
    submitter_contact: '',
    email: '',
    otp_verification_token: '',
    original_reporter_credit: '',
    district_id: '',
    latitude: '',
    longitude: '',
    photo_urls: [],
    voice_note_url: ''
  });

  // OTP Verification State (Mandatory for citizen submitters)
  const [otpState, setOtpState] = useState('idle'); // 'idle' | 'sending' | 'sent' | 'verifying' | 'verified'
  const [otpCode, setOtpCode] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpError, setOtpError] = useState('');
  const [otpSuccessMsg, setOtpSuccessMsg] = useState('');
  const [debugOtp, setDebugOtp] = useState('');

  // Countdown timer for OTP resend cooldown
  useEffect(() => {
    let timer;
    if (otpCooldown > 0) {
      timer = setTimeout(() => setOtpCooldown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCooldown]);

  const [photoInput, setPhotoInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    api.get('/districts')
      .then(res => {
        setDistricts(res.data);
        if (res.data.length > 0) {
          setFormData(prev => ({ ...prev, district_id: res.data[0].id }));
        }
      })
      .catch(err => {
        console.error("Failed to load districts", err);
      });

    // Automatic Geolocation on Mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(5),
            longitude: position.coords.longitude.toFixed(5)
          }));
        },
        () => {
          // If citizen denies permission or unavailable, leave fields empty for manual input
        },
        { timeout: 8000 }
      );
    }
  }, []);

  const handleAddPhoto = () => {
    if (photoInput.trim()) {
      setFormData(prev => ({
        ...prev,
        photo_urls: [...prev.photo_urls, photoInput.trim()]
      }));
      setPhotoInput('');
    }
  };

  const handleRemovePhoto = (idx) => {
    setFormData(prev => ({
      ...prev,
      photo_urls: prev.photo_urls.filter((_, i) => i !== idx)
    }));
  };

  const handleSimulateVoiceNote = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setTimeout(() => {
        setIsRecording(false);
        setFormData(prev => ({
          ...prev,
          voice_note_url: 'https://shodhsetu.jh.gov.in/audio/sample_citizen_voice.mp3'
        }));
      }, 2500);
    }
  };

  const handlePhoneChange = (newPhone) => {
    setFormData(prev => ({
      ...prev,
      submitter_contact: newPhone,
      otp_verification_token: ''
    }));
    if (otpState === 'verified' || otpState === 'sent') {
      setOtpState('idle');
      setOtpCode('');
      setOtpSuccessMsg('');
      setOtpError('Phone number modified. Please request and verify a new OTP.');
    }
  };

  const handleSendOtp = async () => {
    const cleanPhone = (formData.submitter_contact || '').trim();
    if (!cleanPhone || cleanPhone.length < 10) {
      setOtpError('Please enter a valid 10-digit mobile phone number.');
      return;
    }
    setOtpError('');
    setOtpSuccessMsg('');
    setOtpState('sending');
    try {
      const res = await api.post('/otp/request', { phone: cleanPhone });
      setOtpState('sent');
      setOtpCooldown(60);
      setOtpSuccessMsg(res.data.message || 'OTP sent successfully.');
      if (res.data.debug_otp) {
        setDebugOtp(res.data.debug_otp);
      }
    } catch (err) {
      setOtpState('idle');
      setOtpError(err.response?.data?.detail || 'Failed to send OTP. Please try again.');
    }
  };

  const handleVerifyOtp = async () => {
    const cleanOtp = otpCode.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setOtpError('Please enter the 6-digit OTP code.');
      return;
    }
    setOtpError('');
    setOtpState('verifying');
    try {
      const res = await api.post('/otp/verify', {
        phone: (formData.submitter_contact || '').trim(),
        otp: cleanOtp
      });
      setFormData(prev => ({
        ...prev,
        otp_verification_token: res.data.verification_token
      }));
      setOtpState('verified');
      setOtpSuccessMsg('Mobile number verified successfully! You can now submit your report.');
    } catch (err) {
      setOtpState('sent');
      setOtpError(err.response?.data?.detail || 'Invalid or expired OTP code.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.description.trim().length < 15) {
      setError('Description must be at least 15 characters long for actionable evaluation.');
      return;
    }

    if (formData.submitter_type === 'citizen' && (!formData.otp_verification_token || otpState !== 'verified')) {
      setError('Mobile phone number must be OTP-verified before submitting.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category ? formData.category : null,
        submitter_type: formData.submitter_type,
        submitter_contact: formData.submitter_contact.trim() || null,
        email: formData.email ? formData.email.trim() : null,
        otp_verification_token: formData.otp_verification_token || null,
        original_reporter_credit: formData.original_reporter_credit.trim() || null,
        district_id: parseInt(formData.district_id),
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        photo_urls: formData.photo_urls,
        voice_note_url: formData.voice_note_url || null
      };

      const res = await api.post('/challenges', payload);
      setSuccessData(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit challenge. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  const copyTrackingId = () => {
    if (successData?.tracking_id) {
      navigator.clipboard.writeText(successData.tracking_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back Navigation */}
      <div className="mb-6 flex items-center space-x-3">
        <Link
          to="/citizen"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-navy transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t('nav.back_to_citizen', 'Back to Citizen Hub')}</span>
        </Link>
        <span className="text-slate-300">•</span>
        <Link
          to="/"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-navy transition-colors"
        >
          <span>{t('nav.stakeholder_roles', 'Stakeholder Roles')}</span>
        </Link>
      </div>

      {/* Confirmation Screen (Screen 4) */}
      {successData ? (
        <div className="bg-white rounded-2xl p-8 border border-green-border shadow-xl space-y-6">
          <div className="w-16 h-16 rounded-full bg-green-light text-green flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-2xl font-heading font-extrabold text-navy">
              Challenge Submitted Successfully
            </h2>
            <p className="text-slate-600 text-sm max-w-md mx-auto">
              Your challenge has entered the ShodhSetu pipeline. District Science & Technology Officers have been notified.
            </p>
          </div>

          {/* Real Tracking ID Box (No blockchain theater) */}
          <div className="bg-canvas border-2 border-dashed border-teal/40 rounded-xl p-6 text-center space-y-3">
            <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">
              Official Challenge Tracking ID
            </span>
            <div className="flex items-center justify-center space-x-3">
              <span className="text-3xl font-heading font-black text-navy tracking-widest font-mono">
                {successData.tracking_id}
              </span>
              <button
                onClick={copyTrackingId}
                className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-teal hover:text-navy text-slate-600 transition-colors shadow-sm"
                title="Copy Tracking ID"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-green" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Save this ID to track official review, faculty assignments, and milestone progress.
            </p>
          </div>

          {/* Database Record Details (Real data with timestamp - Fix 0B) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2 text-slate-700">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center space-x-1.5 font-bold text-navy">
                <Database className="w-4 h-4 text-teal" />
                <span>Verified Platform Record</span>
              </div>
              <span className="font-mono text-slate-500">
                {new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div><strong>Domain Sector:</strong> <span className="capitalize">{successData.category?.replace(/_/g, ' ')}</span></div>
              <div><strong>Initial Priority Score:</strong> {successData.priority_score || 75} / 100</div>
              <div><strong>District:</strong> {districts.find(d => d.id === parseInt(formData.district_id))?.name || 'Jharkhand'}</div>
              <div><strong>Status:</strong> <span className="font-mono font-bold text-navy uppercase">{successData.status}</span></div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => navigate(`/track?id=${successData.tracking_id}`)}
              className="flex-1 py-3 rounded-xl bg-teal text-navy font-bold hover:bg-teal-hover transition-all flex items-center justify-center space-x-2 text-sm shadow-sm"
            >
              <span>Track Resolution Progress</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setSuccessData(null);
                setFormData({
                  title: '',
                  description: '',
                  category: '',
                  submitter_type: 'citizen',
                  submitter_contact: '',
                  email: '',
                  otp_verification_token: '',
                  original_reporter_credit: '',
                  district_id: districts[0]?.id || '',
                  latitude: '',
                  longitude: '',
                  photo_urls: [],
                  voice_note_url: ''
                });
                setOtpState('idle');
                setOtpCode('');
              }}
              className="py-3 px-6 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 text-sm border border-slate-200"
            >
              Submit Another Challenge
            </button>
          </div>
        </div>
      ) : (
        /* Submission Form (Screen 3) */
        <div className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-8">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2 text-xs font-semibold text-teal mb-1">
              <Building className="w-3.5 h-3.5" />
              <span>Public Civic Submission Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-navy">
              Submit a Grassroots Challenge
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-1">
              Provide specific issue details. Our AI will automatically synthesize a problem brief and route it to your District STI Officer.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-light border border-red-border text-red-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Submitter Capacity */}
            <div>
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">
                Submitter Capacity
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'citizen', label: 'Individual Citizen' },
                  { id: 'pri', label: 'Gram Panchayat / PRI' },
                  { id: 'ulb', label: 'Urban Local Body' },
                  { id: 'govt_dept', label: 'Govt Field Dept' },
                ].map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, submitter_type: type.id })}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all text-center ${
                      formData.submitter_type === type.id
                        ? 'bg-navy text-white border-navy font-semibold shadow-sm'
                        : 'bg-canvas text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
              {formData.submitter_type !== 'citizen' && (
                <p className="text-[11px] text-teal-dark mt-1 font-medium">
                  ✓ Institutional submissions from PRIs/ULBs receive expedited automatic validation.
                </p>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                Challenge Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. High fluoride concentration in village tube-well causing dental fluorosis"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                Problem Description & Field Impact *
              </label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what is broken, who is affected, how long the issue has persisted, and any local remedies attempted..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
              />
              <span className="text-[11px] text-slate-400">Minimum 15 characters. Be as specific as possible.</span>
            </div>

            {/* Category & District Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                  Domain Sector (Optional)
                </label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400">Leave on AI Auto-Classify for automatic domain assignment.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                  District (Jharkhand) *
                </label>
                <select
                  required
                  value={formData.district_id}
                  onChange={e => setFormData({ ...formData, district_id: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal"
                >
                  {districts.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.state})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Geolocation Coordinate Detection (Auto-fires on mount) */}
            <div>
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                Geotag Location (Automatically Resolved)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Latitude (e.g. 23.3441)"
                  value={formData.latitude}
                  onChange={e => setFormData({ ...formData, latitude: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal font-mono"
                />
                <input
                  type="text"
                  placeholder="Longitude (e.g. 85.3096)"
                  value={formData.longitude}
                  onChange={e => setFormData({ ...formData, longitude: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal font-mono"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Browser GPS coordinates detected automatically on page load when permitted, or enter manually.
              </span>
            </div>

            {/* Multimodal: Voice Note + Photo Attachments */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-canvas border border-slate-200">
              {/* Voice Note */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-navy uppercase tracking-wider">Voice Note</span>
                  <span className="text-[10px] bg-teal/20 text-teal px-1.5 py-0.5 rounded font-mono">Multilingual AI</span>
                </div>
                <button
                  type="button"
                  onClick={handleSimulateVoiceNote}
                  className={`w-full py-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                    isRecording 
                      ? 'bg-red text-white border-red animate-pulse' 
                      : formData.voice_note_url 
                        ? 'bg-green-light text-green border-green-border' 
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                  <span>
                    {isRecording ? 'Recording Voice Audio...' : formData.voice_note_url ? 'Voice Note Attached' : 'Record Voice Note'}
                  </span>
                </button>
                <p className="text-[10px] text-slate-500">
                  Multilingual speech input will be converted into a structured problem brief automatically.
                </p>
              </div>

              {/* Photo Upload */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-navy uppercase tracking-wider block">Field Photo URL</span>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    value={photoInput}
                    onChange={e => setPhotoInput(e.target.value)}
                    placeholder="https://.../photo.jpg"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal"
                  />
                  <button
                    type="button"
                    onClick={handleAddPhoto}
                    className="px-3.5 py-2 rounded-xl bg-teal text-navy font-bold text-xs hover:bg-teal-hover transition-colors"
                  >
                    Add
                  </button>
                </div>
                {formData.photo_urls.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {formData.photo_urls.map((p, idx) => (
                      <span key={idx} className="inline-flex items-center space-x-1 text-[10px] bg-white border border-slate-300 px-2 py-1 rounded">
                        <span className="max-w-[120px] truncate">{p}</span>
                        <button type="button" onClick={() => handleRemovePhoto(idx)} className="text-red font-bold ml-1">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submitter Contact & Mandatory OTP Section */}
            <div className="p-4 sm:p-5 rounded-xl bg-canvas border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-navy uppercase tracking-wider flex items-center space-x-1.5">
                  <Phone className="w-4 h-4 text-teal" />
                  <span>
                    {formData.submitter_type === 'citizen' ? 'Mobile Phone Number (Mandatory & OTP Verified) *' : 'Institutional Contact Phone'}
                  </span>
                </span>
                {formData.submitter_type === 'citizen' && otpState === 'verified' && (
                  <span className="inline-flex items-center space-x-1 text-xs font-bold text-green-700 bg-green-light px-2.5 py-1 rounded-full border border-green-border">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green" />
                    <span>Phone Verified</span>
                  </span>
                )}
              </div>

              {/* Phone Input with Send OTP */}
              <div className="space-y-1">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="tel"
                      required={formData.submitter_type === 'citizen'}
                      value={formData.submitter_contact}
                      onChange={e => handlePhoneChange(e.target.value)}
                      placeholder="+91 98765 43210 (10-digit mobile number)"
                      disabled={otpState === 'verified'}
                      className={`w-full px-3 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-teal ${
                        otpState === 'verified'
                          ? 'bg-green-light/30 border-green-border text-slate-800 font-medium'
                          : 'border-slate-300'
                      }`}
                    />
                    {otpState === 'verified' && (
                      <button
                        type="button"
                        onClick={() => {
                          setOtpState('idle');
                          setFormData(prev => ({ ...prev, otp_verification_token: '' }));
                          setOtpCode('');
                          setOtpSuccessMsg('');
                        }}
                        className="absolute right-3 top-2.5 text-[11px] text-slate-400 hover:text-navy underline"
                      >
                        Change
                      </button>
                    )}
                  </div>

                  {formData.submitter_type === 'citizen' && otpState !== 'verified' && (
                    <button
                      type="button"
                      disabled={otpState === 'sending' || otpCooldown > 0 || !formData.submitter_contact || formData.submitter_contact.length < 10}
                      onClick={handleSendOtp}
                      className="px-4 py-2.5 rounded-xl bg-teal text-navy font-bold text-xs hover:bg-teal-hover transition-all disabled:opacity-50 whitespace-nowrap shadow-sm"
                    >
                      {otpState === 'sending' 
                        ? 'Sending...' 
                        : otpCooldown > 0 
                          ? `Resend in ${otpCooldown}s` 
                          : otpState === 'sent' 
                            ? 'Resend OTP' 
                            : 'Send OTP'}
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Kept strictly confidential. Used for critical SMS milestone updates.
                </p>
              </div>

              {/* OTP Input box */}
              {formData.submitter_type === 'citizen' && (otpState === 'sent' || otpState === 'verifying') && (
                <div className="p-3.5 rounded-xl bg-white border border-teal/40 space-y-2.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-navy flex items-center space-x-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-teal" />
                      <span>Enter 6-Digit OTP sent to {formData.submitter_contact}</span>
                    </label>
                    {otpCooldown > 0 && (
                      <span className="text-[11px] text-slate-400 flex items-center space-x-1 font-mono">
                        <Clock className="w-3 h-3" />
                        <span>Expires in 5 mins (Resend in {otpCooldown}s)</span>
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 482910"
                      className="w-40 px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono tracking-widest text-center font-bold focus:outline-none focus:ring-2 focus:ring-teal"
                    />
                    <button
                      type="button"
                      disabled={otpState === 'verifying' || otpCode.trim().length !== 6}
                      onClick={handleVerifyOtp}
                      className="px-5 py-2 rounded-xl bg-navy hover:bg-navy-light text-white font-bold text-xs transition-colors disabled:opacity-50"
                    >
                      {otpState === 'verifying' ? 'Verifying...' : 'Verify OTP'}
                    </button>
                  </div>

                  {debugOtp && (
                    <div className="text-[11px] bg-amber-light text-amber-800 p-1.5 rounded-lg border border-amber-border">
                      <strong>Simulator OTP:</strong> {debugOtp}
                    </div>
                  )}
                </div>
              )}

              {/* OTP Error/Success Alerts */}
              {otpError && (
                <div className="text-xs text-red bg-red-light p-2.5 rounded-xl border border-red-border flex items-center space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}
              {otpSuccessMsg && otpState === 'verified' && (
                <div className="text-xs text-green-700 bg-green-light p-2.5 rounded-xl border border-green-border flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-green" />
                  <span>{otpSuccessMsg}</span>
                </div>
              )}

              {/* Secondary Contact & Public Attribution Field */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                    Secondary Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="citizen@example.com (No OTP required)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal"
                  />
                  <span className="text-[10px] text-slate-400">Optional backup channel for email summaries.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                    Public Attribution Name
                  </label>
                  <input
                    type="text"
                    value={formData.original_reporter_credit}
                    onChange={e => setFormData({ ...formData, original_reporter_credit: e.target.value })}
                    placeholder="e.g. Ramesh Mahto, Ward 4 Representative"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal"
                  />
                  <span className="text-[10px] text-slate-400">Permanently credited in the Public Innovation Registry.</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="space-y-2">
              <button
                type="submit"
                disabled={loading || (formData.submitter_type === 'citizen' && otpState !== 'verified')}
                className="w-full py-3.5 rounded-xl bg-navy hover:bg-navy-light text-white font-bold text-sm transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4 text-teal" />
                <span>{loading ? 'Submitting Challenge...' : 'Submit Challenge'}</span>
              </button>
              {formData.submitter_type === 'citizen' && otpState !== 'verified' && (
                <p className="text-center text-[11px] text-amber-800 font-medium">
                  * Please verify your mobile phone number with OTP to enable submission.
                </p>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SubmitChallenge;
