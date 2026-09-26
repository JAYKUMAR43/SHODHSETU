import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Send, 
  MapPin, 
  Camera, 
  Upload,
  X,
  Loader2,
  Image as ImageIcon,
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
  Database,
  RefreshCw
} from 'lucide-react';
import api, { getFileUrl } from '../services/api';
import BottomSheet from '../components/common/BottomSheet';

const CATEGORY_LABELS = {
  water_resources: 'Water Resources & Fluoride/Arsenic Mitigation',
  agriculture: 'Agriculture, Soil & Post-Harvest Systems',
  healthcare: 'Healthcare & Point-of-Care Diagnostics',
  environment: 'Environment & Mine Remediation',
  energy: 'Renewable Energy & Microgrids',
  rural_livelihoods: 'Rural Livelihoods, Lac & Tussar Sericulture',
  education: 'Education & Vernacular Pedagogy',
  urban_development: 'Urban Development & Waste Management',
  accessibility: 'Accessibility & Divyang Technologies',
  public_administration: 'Public Administration & Civic Grievances'
};

const AUTO_CATEGORY_KEYWORDS = {
  agriculture: ["crop", "soil", "pest", "irrigation", "farming", "paddy", "fertilizer", "kisan", "yield", "drought", "seeds", "kheti", "fasal", "mitti", "keeda", "sinchai", "anaj", "khet", "urvarak", "dhan", "gehu", "paudha", "gobargas", "khet-bari", "chas", "chasi", "ropa", "behan", "bichha", "kisaan", "baadi", "tora", "baba", "kado"],
  water_resources: ["water", "arsenic", "fluoride", "borewell", "pond", "dam", "drinking", "contamination", "pipeline", "drainage", "handpump", "paani", "jal", "peypani", "peene ka pani", "nal", "kua", "kuan", "talab", "chapakal", "boring", "ganda pani", "jal sankat", "daah", "dahar", "chuan", "doba", "bandh", "aahar", "pokhari", "jharna", "khoro", "jor", "gadhia", "dhaas"],
  healthcare: ["hospital", "clinic", "disease", "malnutrition", "vaccine", "doctor", "health", "maternal", "sanitation", "ambulance", "fever", "aspataal", "swasthya", "bimari", "dawa", "davai", "ilaj", "rog", "poshan", "kuposhan", "tika", "chikitsa", "sehat", "rua", "haspatal", "daktar", "poshan", "sahiyya", "anganwadi", "dawai", "bimar", "roga"],
  education: ["school", "teacher", "student", "classroom", "books", "literacy", "dropout", "stem", "college", "vocational", "vidyalaya", "shiksha", "padhai", "kitab", "shikshak", "chhatra", "pathshala", "kaksha", "adhyayan", "ischool", "guruji", "master babu", "basta"],
  environment: ["pollution", "forest", "mining", "dust", "effluent", "waste", "deforestation", "air quality", "biodiversity", "dumping", "pradushan", "jungle", "van", "dhuan", "khadan", "koyla", "ped", "hawa", "paryavaran", "kachra dumping", "bir", "dhur-dhuan", "chhai", "khadan", "khorha", "jhaad", "dhur"],
  energy: ["electricity", "power", "solar", "grid", "transformer", "biomass", "load shedding", "outage", "renewable", "bijli", "batti", "urja", "taar", "andhera", "current", "solar panel", "dhoop", "roshni", "chup-chup", "battie", "line kata", "voltage"],
  urban_development: ["road", "traffic", "slum", "sewage", "street light", "pothole", "solid waste", "urban flooding", "encroachment", "sadak", "gaddha", "kachra", "naali", "basti", "jaam", "gali", "pul", "puliya", "footpath", "dahar", "rasta", "kado", "kichad", "dhalo"],
  accessibility: ["disabled", "wheelchair", "ramp", "braille", "divyang", "elderly", "sign language", "mobility", "special needs", "viklang", "bujurg", "vridh", "chalne me pareshani", "sahayata", "divyangjan", "batha", "langda", "dekhai na dena", "sunai na dena"],
  public_administration: ["pension", "ration", "caste certificate", "land record", "grievance", "corruption", "panchayat", "bribe", "pds", "shikayat", "bhrashtachar", "praman patra", "khatian", "dakhil kharij", "mukhiya", "ghoos", "adhikar", "kotawala", "panch", "pradhan", "jameen", "dastavej", "afsar"],
  rural_livelihoods: ["artisan", "weaving", "tussar", "silk", "lac", "minor forest produce", "self help group", "shg", "poultry", "goat", "tribal market", "rozgar", "kamai", "bunkar", "mahila mandal", "murgi palan", "bakri", "haat", "bazaar", "hastshilp", "lah", "jute", "mahua", "kendupatta", "tassar", "sabai", "dholka", "sangh", "kam-dhandha", "sohrai", "kohbar"]
};

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

  // Auto-detect domain sector from description & title (Zero manual dropdown selection)
  const detectCategory = (desc = '', title = '') => {
    const combined = `${title} ${desc}`.toLowerCase();
    if (!combined.trim() || combined.trim().length < 4) return '';

    let bestCat = '';
    let maxScore = 0;

    for (const [cat, keywords] of Object.entries(AUTO_CATEGORY_KEYWORDS)) {
      let score = 0;
      for (const kw of keywords) {
        if (combined.includes(kw)) {
          score += (kw.length > 5 ? 2 : 1);
        }
      }
      if (score > maxScore) {
        maxScore = score;
        bestCat = cat;
      }
    }

    return bestCat;
  };

  // Keep category in sync with auto-detection automatically
  useEffect(() => {
    const detected = detectCategory(formData.description, formData.title);
    if (detected && detected !== formData.category) {
      setFormData(prev => ({ ...prev, category: detected }));
    }
  }, [formData.description, formData.title]);

  const [photoInput, setPhotoInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Live Camera Web API Modal State
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [capturedPreview, setCapturedPreview] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  // Bind stream to video element when stream is ready
  useEffect(() => {
    if (isCameraModalOpen && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(e => console.warn("Video play interrupted", e));
    }
  }, [isCameraModalOpen, cameraStream]);

  const handleOpenCamera = async () => {
    setCameraError(null);
    setCapturedPreview(null);
    setIsCameraModalOpen(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Webcam API is not supported in this browser. Please use 'Upload Image'.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.warn("Direct webcam stream failed:", err);
      setCameraError(err.message || "Camera access denied or unavailable. You can click 'Upload Image' to choose a photo file.");
    }
  };

  const handleCaptureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedPreview(dataUrl);
  };

  const handleRetakeSnapshot = () => {
    setCapturedPreview(null);
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(() => {});
    }
  };

  const handleConfirmCapturedPhoto = async () => {
    if (!capturedPreview) return;
    setUploadingPhoto(true);

    try {
      const resBlob = await fetch(capturedPreview);
      const blob = await resBlob.blob();
      const file = new File([blob], `field_photo_${Date.now()}.jpg`, { type: 'image/jpeg' });

      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('folder', 'field_evidence');

      const res = await api.post('/storage/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.url) {
        setFormData(prev => ({
          ...prev,
          photo_urls: [...prev.photo_urls, res.data.url]
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          photo_urls: [...prev.photo_urls, capturedPreview]
        }));
      }
    } catch (err) {
      console.warn("Camera upload fallback to base64:", err);
      setFormData(prev => ({
        ...prev,
        photo_urls: [...prev.photo_urls, capturedPreview]
      }));
    } finally {
      setUploadingPhoto(false);
      handleCloseCamera();
    }
  };

  const handleCloseCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setCapturedPreview(null);
    setCameraError(null);
    setIsCameraModalOpen(false);
  };

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

  const handlePhotoFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingPhoto(true);

    for (const file of files) {
      try {
        const uploadData = new FormData();
        uploadData.append('file', file);
        uploadData.append('folder', 'field_evidence');

        const res = await api.post('/storage/upload', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (res.data?.url) {
          setFormData(prev => ({
            ...prev,
            photo_urls: [...prev.photo_urls, res.data.url]
          }));
        }
      } catch (err) {
        console.warn('Backend upload returned error, using local base64 fallback:', err);
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setFormData(prev => ({
              ...prev,
              photo_urls: [...prev.photo_urls, event.target.result]
            }));
          }
        };
        reader.readAsDataURL(file);
      }
    }

    setUploadingPhoto(false);
    if (e.target) e.target.value = '';
  };

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
          voice_note_url: '/uploads/audio/sample_citizen_voice.wav'
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
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in-up">
      {/* Back Navigation */}
      <div className="mb-6 flex items-center space-x-3">
        <Link
          to="/citizen"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors bg-white/[0.06] px-3 py-1.5 rounded-lg border border-white/10 shadow-float"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t('nav.back_to_citizen', 'Back to Citizen Hub')}</span>
        </Link>
        <span className="text-slate-300">•</span>
        <Link
          to="/"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-teal transition-colors"
        >
          <span>{t('nav.stakeholder_roles', 'Stakeholder Roles')}</span>
        </Link>
      </div>

      {/* Confirmation Screen (Screen 4) */}
      {successData ? (
        <div className="panel-glass p-8 border-green/30 space-y-6">
          <div className="w-16 h-16 rounded-full bg-green/15 text-green flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-2xl font-heading font-extrabold text-white">
              Challenge Submitted Successfully
            </h2>
            <p className="text-slate-300 text-sm max-w-md mx-auto">
              Your challenge has entered the Bharat Panchyt pipeline. District Science & Technology Officers have been notified.
            </p>
          </div>

          {/* Real Tracking ID Box (No blockchain theater) */}
          <div className="bg-white/[0.04] border-2 border-dashed border-teal/40 rounded-xl p-6 text-center space-y-3">
            <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">
              Official Challenge Tracking ID
            </span>
            <div className="flex items-center justify-center space-x-3">
              <span className="text-3xl font-heading font-black text-teal tracking-widest font-mono">
                {successData.tracking_id}
              </span>
              <button
                onClick={copyTrackingId}
                className="p-2 rounded-lg bg-white/[0.06] border border-white/10 hover:bg-teal hover:text-navy text-slate-300 transition-colors shadow-float"
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
          <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4 text-xs space-y-2 text-slate-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center space-x-1.5 font-bold text-white">
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
              <div><strong>Status:</strong> <span className="font-mono font-bold text-slate-300 uppercase">{successData.status}</span></div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => navigate(`/track?id=${successData.tracking_id}`)}
              className="flex-1 py-3 rounded-xl bg-teal text-navy font-bold hover:bg-teal-hover transition-all flex items-center justify-center space-x-2 text-sm shadow-float"
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
              className="py-3 px-6 rounded-xl bg-white/[0.06] text-slate-200 font-semibold hover:bg-white/[0.12] text-sm border border-white/10"
            >
              Submit Another Challenge
            </button>
          </div>
        </div>
      ) : (
        /* Submission Form (Screen 3) */
        <div className="panel-glass p-6 sm:p-10 space-y-8">
          <div className="border-b border-white/10 pb-4">
            <div className="flex items-center space-x-2 text-xs font-semibold text-teal mb-1">
              <Building className="w-3.5 h-3.5" />
              <span>Public Civic Submission Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-white">
              Submit a Grassroots Challenge
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1">
              Provide specific issue details. Our AI will automatically synthesize a problem brief and route it to your District STI Officer.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red/15 border border-red/40 text-red text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Submitter Capacity */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
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
                    className={`py-2.5 px-3 rounded-lg text-xs font-semibold border transition-all text-center ${
                      formData.submitter_type === type.id
                        ? 'bg-teal text-navy border-teal font-bold shadow-sm'
                        : 'bg-[#0E1E36] text-slate-300 border-slate-700 hover:bg-[#152B4D] hover:text-white'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
              {formData.submitter_type !== 'citizen' && (
                <p className="text-xs text-teal mt-1.5 font-medium">
                  ✓ Institutional submissions from PRIs/ULBs receive expedited automatic validation.
                </p>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-1.5">
                Challenge Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. High fluoride concentration in village tube-well causing dental fluorosis"
                className="w-full px-4 py-3 rounded-lg bg-[#0F223D] border border-slate-700 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal transition-all"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-1.5">
                Problem Description & Field Impact <span className="text-red-400">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what is broken, who is affected, how long the issue has persisted, and any local remedies attempted..."
                className="w-full px-4 py-3 rounded-lg bg-[#0F223D] border border-slate-700 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal transition-all"
              />
              <span className="text-xs text-slate-400 mt-1 block">Minimum 15 characters. Be as specific as possible.</span>
            </div>

            {/* Auto-Detected Domain Sector & District Grid (Zero Manual List Selection) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* AI Auto-Detected Domain Card */}
              <div className="bg-[#122644] p-4 rounded-xl border border-teal-500/30 space-y-2 flex flex-col justify-between shadow-sm">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal" />
                    <span>Domain Sector (Auto-Classified)</span>
                  </label>
                  <span className="text-[11px] bg-teal/20 text-teal font-mono font-bold px-2 py-0.5 rounded-full border border-teal/30">
                    Auto-Filled by AI
                  </span>
                </div>

                {formData.category ? (
                  <div className="bg-[#163056] p-3 rounded-lg border border-teal-400/40 flex items-center space-x-2.5">
                    <div className="w-6 h-6 rounded-md bg-teal text-navy font-black text-xs flex items-center justify-center shrink-0">
                      ✓
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white truncate">
                        {CATEGORY_LABELS[formData.category] || formData.category.replace(/_/g, ' ')}
                      </div>
                      <span className="text-[11px] text-teal-300 block">
                        Auto-detected from description keywords & context
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#0E1E36] p-3 rounded-lg border border-dashed border-slate-700 text-xs text-slate-400 flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-teal shrink-0 animate-pulse" />
                    <span>Type problem details — sector is auto-detected automatically without manual list selection.</span>
                  </div>
                )}
              </div>

              {/* District Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-1.5">
                  District (Jharkhand) <span className="text-red-400">*</span>
                </label>
                <select
                  required
                  value={formData.district_id}
                  onChange={e => setFormData({ ...formData, district_id: e.target.value })}
                  className="w-full px-3.5 py-3 rounded-lg bg-[#0F223D] border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal"
                >
                  {districts.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.state})</option>
                  ))}
                </select>
                <span className="text-xs text-slate-400 mt-1 block">Your report is routed to this district's nodal officer.</span>
              </div>
            </div>

            {/* Geolocation Coordinate Detection (Auto-fires on mount) */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-1.5">
                Geotag Location (Automatically Resolved)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Latitude (e.g. 23.3441)"
                  value={formData.latitude}
                  onChange={e => setFormData({ ...formData, latitude: e.target.value })}
                  className="px-3.5 py-2.5 rounded-lg bg-[#0F223D] border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-teal font-mono"
                />
                <input
                  type="text"
                  placeholder="Longitude (e.g. 85.3096)"
                  value={formData.longitude}
                  onChange={e => setFormData({ ...formData, longitude: e.target.value })}
                  className="px-3.5 py-2.5 rounded-lg bg-[#0F223D] border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-teal font-mono"
                />
              </div>
              <span className="text-xs text-slate-400 mt-1 block">
                Browser GPS coordinates detected automatically on page load when permitted, or enter manually.
              </span>
            </div>

            {/* Multimodal: Voice Note + Photo Attachments */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl stat-glass">
              {/* Voice Note */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Voice Note</span>
                  <span className="text-[10px] bg-teal/20 text-teal px-1.5 py-0.5 rounded font-mono">Multilingual AI</span>
                </div>
                <button
                  type="button"
                  onClick={handleSimulateVoiceNote}
                  className={`w-full py-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                    isRecording 
                      ? 'bg-red text-white border-red animate-pulse' 
                      : formData.voice_note_url 
                        ? 'bg-green/15 text-green border-green-border' 
                        : 'bg-white/[0.06] text-slate-200 border-white/15 hover:bg-white/[0.04]'
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

              {/* Photo Upload & Camera Capture */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Field Evidence Photos
                  </span>
                  {formData.photo_urls.length > 0 && (
                    <span className="text-[11px] font-bold text-teal bg-teal/15 px-2 py-0.5 rounded-full border border-teal/30">
                      {formData.photo_urls.length} attached
                    </span>
                  )}
                </div>

                {/* Hidden File Inputs */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoFileChange}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotoFileChange}
                />

                {/* Camera Click & Upload Buttons */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleOpenCamera}
                    disabled={uploadingPhoto}
                    className="py-2.5 px-3 rounded-xl bg-teal/15 hover:bg-teal/25 border border-teal/40 text-teal text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-lvl1 disabled:opacity-50"
                  >
                    {uploadingPhoto ? (
                      <Loader2 className="w-4 h-4 animate-spin text-teal" />
                    ) : (
                      <Camera className="w-4 h-4 text-teal" />
                    )}
                    <span>{uploadingPhoto ? 'Processing...' : 'Click Photo / Camera'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="py-2.5 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-lvl1 disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4 text-teal" />
                    <span>Upload Image</span>
                  </button>
                </div>

                {/* Photo Previews Grid */}
                {formData.photo_urls.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 pt-1">
                    {formData.photo_urls.map((p, idx) => (
                      <div 
                        key={idx} 
                        className="relative group aspect-square rounded-xl overflow-hidden border border-white/20 bg-black/40 shadow-lvl1"
                      >
                        <img
                          src={getFileUrl(p)}
                          alt={`Field photo ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(idx)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red/90 text-white flex items-center justify-center hover:bg-red shadow-md transition-colors"
                          title="Remove photo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Optional URL Paste Expandable */}
                <div className="pt-1">
                  {!showUrlInput ? (
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(true)}
                      className="text-[11px] text-slate-400 hover:text-teal transition-colors underline decoration-dotted"
                    >
                      + Or paste web image URL
                    </button>
                  ) : (
                    <div className="space-y-1.5 animate-fade-in-up">
                      <div className="flex space-x-2">
                        <input
                          type="url"
                          value={photoInput}
                          onChange={e => setPhotoInput(e.target.value)}
                          placeholder="https://.../photo.jpg"
                          className="flex-1 px-3 py-1.5 rounded-xl bg-[#0F223D] border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal"
                        />
                        <button
                          type="button"
                          onClick={handleAddPhoto}
                          className="px-3 py-1.5 rounded-xl bg-teal text-navy font-bold text-xs hover:bg-teal-hover transition-colors"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowUrlInput(false)}
                          className="px-2 py-1.5 text-xs text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submitter Contact & Mandatory OTP Section */}
            <div className="p-4 sm:p-5 rounded-xl stat-glass space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <Phone className="w-4 h-4 text-teal" />
                  <span>
                    {formData.submitter_type === 'citizen' ? 'Mobile Phone Number (Mandatory & OTP Verified) *' : 'Institutional Contact Phone'}
                  </span>
                </span>
                {formData.submitter_type === 'citizen' && otpState === 'verified' && (
                  <span className="inline-flex items-center space-x-1 text-xs font-bold text-green bg-green/15 px-2.5 py-1 rounded-full border border-green-border">
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
                      className={`w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-teal ${
                        otpState === 'verified'
                          ? 'bg-green/20 border-green text-white font-medium'
                          : 'bg-[#0F223D] border-slate-700 text-white placeholder-slate-400'
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
                        className="absolute right-3 top-2.5 text-xs text-teal hover:underline font-semibold"
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
                      className="px-5 py-2.5 rounded-lg bg-teal text-navy font-bold text-xs hover:bg-teal-hover transition-all disabled:opacity-50 whitespace-nowrap shadow-sm"
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
                <p className="text-xs text-slate-400">
                  Kept strictly confidential. Used for critical SMS milestone updates.
                </p>
              </div>

              {/* OTP Input box */}
              {formData.submitter_type === 'citizen' && (otpState === 'sent' || otpState === 'verifying') && (
                <div className="p-4 rounded-xl bg-[#122644] border border-teal-500/40 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white flex items-center space-x-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-teal" />
                      <span>Enter 6-Digit OTP sent to {formData.submitter_contact}</span>
                    </label>
                    {otpCooldown > 0 && (
                      <span className="text-xs text-slate-400 flex items-center space-x-1 font-mono">
                        <Clock className="w-3.5 h-3.5 text-teal" />
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
                      className="w-44 px-3.5 py-2.5 rounded-lg bg-[#0F223D] border border-slate-700 text-white text-sm font-mono tracking-widest text-center font-bold focus:outline-none focus:ring-2 focus:ring-teal"
                    />
                    <button
                      type="button"
                      disabled={otpState === 'verifying' || otpCode.trim().length !== 6}
                      onClick={handleVerifyOtp}
                      className="px-5 py-2.5 rounded-lg bg-teal hover:bg-teal-hover text-navy font-bold text-xs transition-colors disabled:opacity-50"
                    >
                      {otpState === 'verifying' ? 'Verifying...' : 'Verify OTP'}
                    </button>
                  </div>

                  {debugOtp && (
                    <div className="text-xs bg-amber/15 text-amber p-2 rounded-lg border border-amber/30">
                      <strong>Simulator OTP:</strong> {debugOtp}
                    </div>
                  )}
                </div>
              )}

              {/* OTP Error/Success Alerts */}
              {otpError && (
                <div className="text-xs text-red bg-red/15 p-3 rounded-lg border border-red/30 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}
              {otpSuccessMsg && otpState === 'verified' && (
                <div className="text-xs text-green bg-green/15 p-3 rounded-lg border border-green/30 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-green" />
                  <span>{otpSuccessMsg}</span>
                </div>
              )}

              {/* Secondary Contact & Public Attribution Field */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-white/10">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-1.5">
                    Secondary Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="citizen@example.com (No OTP required)"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#0F223D] border border-slate-700 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                  />
                  <span className="text-xs text-slate-400 mt-1 block">Optional backup channel for email summaries.</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-1.5">
                    Public Attribution Name
                  </label>
                  <input
                    type="text"
                    value={formData.original_reporter_credit}
                    onChange={e => setFormData({ ...formData, original_reporter_credit: e.target.value })}
                    placeholder="e.g. Ramesh Mahto, Ward 4 Representative"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#0F223D] border border-slate-700 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                  />
                  <span className="text-xs text-slate-400 mt-1 block">Permanently credited in the Public Innovation Registry.</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="space-y-2 pt-2">
              <button
                type="submit"
                disabled={loading || (formData.submitter_type === 'citizen' && otpState !== 'verified')}
                className="w-full py-3.5 rounded-lg bg-teal hover:bg-teal-hover text-navy font-bold text-sm transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4 text-navy" />
                <span>{loading ? 'Submitting Challenge...' : 'Submit Grassroots Challenge'}</span>
              </button>
              {formData.submitter_type === 'citizen' && otpState !== 'verified' && (
                <p className="text-center text-xs text-amber font-medium">
                  * Please verify your mobile phone number with OTP to enable submission.
                </p>
              )}
            </div>
          </form>
        </div>
      )}

      {/* REAL WEBCAM / CAMERA CAPTURE MODAL */}
      {isCameraModalOpen && (
        <BottomSheet
          isOpen={isCameraModalOpen}
          onClose={handleCloseCamera}
          title="Field Evidence Camera"
          subtitle="Align the civic/societal problem in frame and take a clear snapshot"
          badge="Live Camera"
          icon={Camera}
          maxWidth="xl"
        >
          <div className="space-y-4 text-center">
            {cameraError ? (
              <div className="p-4 rounded-xl bg-red/15 border border-red/40 text-red text-xs space-y-3">
                <p>{cameraError}</p>
                <button
                  type="button"
                  onClick={() => {
                    handleCloseCamera();
                    fileInputRef.current?.click();
                  }}
                  className="px-4 py-2 rounded-xl bg-teal text-navy font-bold text-xs"
                >
                  Choose from Files / Gallery Instead
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Viewport: Live Video or Captured Snapshot */}
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/20 bg-black flex items-center justify-center shadow-lvl3">
                  {!capturedPreview ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      {/* Viewfinder crosshairs overlay */}
                      <div className="absolute inset-4 border border-dashed border-teal/40 rounded-xl pointer-events-none flex items-center justify-center">
                        <div className="w-8 h-8 border-t-2 border-l-2 border-teal absolute top-0 left-0"></div>
                        <div className="w-8 h-8 border-t-2 border-r-2 border-teal absolute top-0 right-0"></div>
                        <div className="w-8 h-8 border-b-2 border-l-2 border-teal absolute bottom-0 left-0"></div>
                        <div className="w-8 h-8 border-b-2 border-r-2 border-teal absolute bottom-0 right-0"></div>
                      </div>
                    </>
                  ) : (
                    <img
                      src={capturedPreview}
                      alt="Captured snapshot"
                      className="w-full h-full object-cover"
                    />
                  )}
                  {/* Hidden off-screen canvas for frame capture */}
                  <canvas ref={canvasRef} className="hidden" />
                </div>

                {/* Shutter / Controls */}
                {!capturedPreview ? (
                  <div className="flex items-center justify-center space-x-4 pt-1">
                    <button
                      type="button"
                      onClick={handleCaptureSnapshot}
                      className="w-14 h-14 rounded-full border-4 border-white bg-teal shadow-glow-teal flex items-center justify-center hover:scale-105 active:scale-95 transition-all text-navy"
                      title="Snap photo"
                    >
                      <Camera className="w-6 h-6 text-navy" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-3 pt-1">
                    <button
                      type="button"
                      onClick={handleRetakeSnapshot}
                      className="px-4 py-2.5 rounded-xl border border-white/15 hover:bg-white/[0.08] text-white font-bold text-xs flex items-center space-x-1.5 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-300" />
                      <span>Retake</span>
                    </button>
                    <button
                      type="button"
                      disabled={uploadingPhoto}
                      onClick={handleConfirmCapturedPhoto}
                      className="px-5 py-2.5 rounded-xl bg-teal text-navy font-bold text-xs flex items-center space-x-1.5 hover:bg-teal-hover transition-all shadow-glow-teal disabled:opacity-50"
                    >
                      {uploadingPhoto ? (
                        <Loader2 className="w-4 h-4 animate-spin text-navy" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-navy" />
                      )}
                      <span>{uploadingPhoto ? 'Saving Photo...' : 'Use This Photo'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </BottomSheet>
      )}
    </div>
  );
};

export default SubmitChallenge;
