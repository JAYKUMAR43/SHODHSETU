import React, { useState, useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  MapPin, 
  Sparkles, 
  Building2, 
  GraduationCap, 
  CheckCircle2, 
  ExternalLink, 
  Filter, 
  Layers, 
  Maximize2, 
  Eye, 
  RefreshCw, 
  Search,
  Droplets,
  Sprout,
  HeartPulse,
  Trees,
  Zap,
  Briefcase,
  BookOpen,
  Building,
  Accessibility,
  Landmark,
  RotateCcw,
  X
} from 'lucide-react';
import api from '../../services/api';

// Bounding Box Coordinates & Central Coordinates for Jharkhand State
const JHARKHAND_CENTER = [23.6102, 85.2799];

export const JHARKHAND_DISTRICTS = [
  { id: 1, name: 'Ranchi', lat: 23.3441, lng: 85.3096, division: 'South Chotanagpur' },
  { id: 2, name: 'Dhanbad', lat: 23.7957, lng: 86.4304, division: 'North Chotanagpur' },
  { id: 3, name: 'East Singhbhum (Jamshedpur)', lat: 22.8046, lng: 86.2029, division: 'Kolhan' },
  { id: 4, name: 'Bokaro', lat: 23.6693, lng: 86.1511, division: 'North Chotanagpur' },
  { id: 5, name: 'Hazaribagh', lat: 23.9925, lng: 85.3637, division: 'North Chotanagpur' },
  { id: 6, name: 'Deoghar', lat: 24.4826, lng: 86.7000, division: 'Santhal Pargana' },
  { id: 7, name: 'Dumka', lat: 24.2677, lng: 87.2546, division: 'Santhal Pargana' },
  { id: 8, name: 'Giridih', lat: 24.1856, lng: 86.3060, division: 'North Chotanagpur' },
  { id: 9, name: 'Palamu', lat: 24.0416, lng: 84.0722, division: 'Palamu' },
  { id: 10, name: 'Ramgarh', lat: 23.6322, lng: 85.5135, division: 'North Chotanagpur' },
  { id: 11, name: 'West Singhbhum (Chaibasa)', lat: 22.5519, lng: 85.8083, division: 'Kolhan' },
  { id: 12, name: 'Saraikela Kharsawan', lat: 22.7006, lng: 85.9328, division: 'Kolhan' },
  { id: 13, name: 'Khunti', lat: 23.0726, lng: 85.2789, division: 'South Chotanagpur' },
  { id: 14, name: 'Gumla', lat: 23.0439, lng: 84.5414, division: 'South Chotanagpur' },
  { id: 15, name: 'Simdega', lat: 22.6145, lng: 84.5090, division: 'South Chotanagpur' },
  { id: 16, name: 'Lohardaga', lat: 23.4357, lng: 84.6811, division: 'South Chotanagpur' },
  { id: 17, name: 'Latehar', lat: 23.7431, lng: 84.5033, division: 'Palamu' },
  { id: 18, name: 'Chatra', lat: 24.2096, lng: 84.8711, division: 'North Chotanagpur' },
  { id: 19, name: 'Koderma', lat: 24.4674, lng: 85.5939, division: 'North Chotanagpur' },
  { id: 20, name: 'Godda', lat: 24.8267, lng: 87.2144, division: 'Santhal Pargana' },
  { id: 21, name: 'Sahibganj', lat: 25.2425, lng: 87.6444, division: 'Santhal Pargana' },
  { id: 22, name: 'Pakur', lat: 24.6340, lng: 87.8488, division: 'Santhal Pargana' },
  { id: 23, name: 'Jamtara', lat: 23.9620, lng: 86.8010, division: 'Santhal Pargana' },
  { id: 24, name: 'Garhwa', lat: 24.1610, lng: 83.8055, division: 'Palamu' }
];

const CATEGORY_META = {
  water_resources: { label: 'Water Resources', color: '#0891b2', bg: 'bg-cyan-500', icon: Droplets },
  agriculture: { label: 'Agriculture & Soil', color: '#16a34a', bg: 'bg-green-600', icon: Sprout },
  healthcare: { label: 'Healthcare & Diagnostics', color: '#e11d48', bg: 'bg-rose-500', icon: HeartPulse },
  environment: { label: 'Environment & Forestry', color: '#059669', bg: 'bg-emerald-600', icon: Trees },
  energy: { label: 'Renewable Energy', color: '#d97706', bg: 'bg-amber-500', icon: Zap },
  rural_livelihoods: { label: 'Rural Livelihoods', color: '#7c3aed', bg: 'bg-purple-600', icon: Briefcase },
  education: { label: 'Education & Pedagogy', color: '#2563eb', bg: 'bg-blue-600', icon: BookOpen },
  urban_development: { label: 'Urban Development', color: '#4f46e5', bg: 'bg-indigo-600', icon: Building },
  accessibility: { label: 'Accessibility', color: '#9333ea', bg: 'bg-fuchsia-600', icon: Accessibility },
  public_administration: { label: 'Public Governance', color: '#475569', bg: 'bg-slate-600', icon: Landmark }
};

/**
 * ProjectsMap: Real-world Leaflet.js + OpenStreetMap Spatial Map for Bharat Panchyt
 * 
 * Scoping:
 * - 'all': Statewide view (Citizen, State Admin, Industry)
 * - 'district': Filtered strictly to that district (District Officer)
 * - 'university': Filtered strictly to that university (University)
 */
export const ProjectsMap = ({
  mode = 'all', // 'all' | 'district' | 'university'
  filterDistrictId = null,
  filterDistrictName = null,
  filterUniversityId = null,
  filterUniversityName = null,
  title = 'Jharkhand State Societal Innovation & Working Projects Map',
  subtitle = 'Geospatial distribution of active university research, CSR co-funded solutions, and verified field deployments.',
  className = ''
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSector, setSelectedSector] = useState('all');
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProject, setActiveProject] = useState(null);
  const [viewMode, setViewMode] = useState('map'); // 'map' | 'split'

  // Fetch projects from backend
  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get('/registry/map-projects');
      setProjects(res.data || []);
    } catch (err) {
      console.warn("Could not load /registry/map-projects, falling back to /registry/outcomes", err);
      try {
        const fallbackRes = await api.get('/registry/outcomes');
        setProjects(fallbackRes.data || []);
      } catch (e2) {
        console.error("Failed to load map outcomes", e2);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // Filter projects based on mode, props and active user filters
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      // 1. Role Scope enforcement
      if (mode === 'district') {
        const targetDId = filterDistrictId ? parseInt(filterDistrictId) : null;
        if (targetDId && p.district_id && p.district_id !== targetDId) return false;
        if (filterDistrictName && p.district_name && !p.district_name.toLowerCase().includes(filterDistrictName.toLowerCase())) return false;
      } else if (mode === 'university') {
        if (filterUniversityId && p.university_id && p.university_id !== parseInt(filterUniversityId)) return false;
        if (filterUniversityName && p.university_name && !p.university_name.toLowerCase().includes(filterUniversityName.toLowerCase())) return false;
      }

      // 2. UI District Filter (in 'all' mode)
      if (mode === 'all' && selectedDistrictFilter !== 'all') {
        if (p.district_name && !p.district_name.toLowerCase().includes(selectedDistrictFilter.toLowerCase())) {
          return false;
        }
      }

      // 3. UI Sector Filter
      if (selectedSector !== 'all') {
        const cat = p.category?.toLowerCase() || '';
        if (cat !== selectedSector.toLowerCase()) return false;
      }

      // 4. UI Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = p.title?.toLowerCase().includes(q) || p.challenge_title?.toLowerCase().includes(q);
        const matchesUni = p.university_name?.toLowerCase().includes(q);
        const matchesDist = p.district_name?.toLowerCase().includes(q);
        const matchesInd = p.industry_partner?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesUni && !matchesDist && !matchesInd) return false;
      }

      return true;
    });
  }, [projects, mode, filterDistrictId, filterDistrictName, filterUniversityId, filterUniversityName, selectedDistrictFilter, selectedSector, searchQuery]);

  // Determine initial center and zoom based on role scope
  const getInitialView = () => {
    if (mode === 'district') {
      const match = JHARKHAND_DISTRICTS.find(d => 
        (filterDistrictId && d.id === parseInt(filterDistrictId)) ||
        (filterDistrictName && d.name.toLowerCase().includes(filterDistrictName.toLowerCase()))
      );
      if (match) return { center: [match.lat, match.lng], zoom: 10 };
    }
    return { center: JHARKHAND_CENTER, zoom: 7 };
  };

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const { center, zoom } = getInitialView();

    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: zoom,
      minZoom: 6,
      maxZoom: 15,
      scrollWheelZoom: false,
      zoomControl: false
    });

    mapInstanceRef.current = map;

    // Add standard OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors | Government of Jharkhand'
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Approximate boundary polygon for Jharkhand state highlights
    const jharkhandPolygonCoords = [
      [24.1610, 83.8055], [24.4000, 84.1000], [24.5000, 85.0000], 
      [24.7000, 85.8000], [24.8267, 87.2144], [25.2425, 87.6444],
      [24.6340, 87.8488], [24.2677, 87.2546], [23.9620, 86.8010],
      [23.7957, 86.4304], [22.8046, 86.4000], [22.3000, 86.3000],
      [22.2000, 85.5000], [22.5000, 84.5000], [22.6145, 84.2000],
      [23.4000, 83.9000], [24.1610, 83.8055]
    ];

    L.polygon(jharkhandPolygonCoords, {
      color: '#0891b2',
      weight: 2,
      opacity: 0.7,
      fillColor: '#0891b2',
      fillOpacity: 0.04,
      dashArray: '4, 4'
    }).addTo(map);

    // Create a layer group for project markers
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mode, filterDistrictId, filterDistrictName]);

  // Update Leaflet project markers whenever filteredProjects changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    filteredProjects.forEach(p => {
      const lat = p.latitude || 23.3441;
      const lng = p.longitude || 85.3096;
      const meta = CATEGORY_META[p.category] || CATEGORY_META.water_resources;

      const markerHtml = `
        <div style="
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          cursor: pointer;
        ">
          <div style="
            position: absolute;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background-color: ${meta.color};
            opacity: 0.3;
            animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
          <div style="
            position: relative;
            width: 16px;
            height: 16px;
            background-color: ${meta.color};
            border: 2px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          "></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'project-leaflet-marker',
        html: markerHtml,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      const popupContent = `
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4; padding: 4px; min-width: 210px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-size: 9px; font-weight: 800; text-transform: uppercase; background: ${meta.color}; color: #ffffff; padding: 2px 6px; border-radius: 4px;">
              ${meta.label}
            </span>
            <span style="font-size: 9px; color: #64748b; font-family: monospace; font-weight: 700;">
              ${p.tracking_id || 'BP-2026'}
            </span>
          </div>
          <div style="font-weight: 700; color: #0B192C; font-size: 12px; margin-bottom: 4px; line-height: 1.3;">
            ${p.title}
          </div>
          <div style="color: #475569; font-size: 11px; margin-bottom: 2px;">
            <strong>HEI:</strong> ${p.university_name || 'Participating University'}
          </div>
          ${p.industry_partner ? `
            <div style="color: #475569; font-size: 11px; margin-bottom: 2px;">
              <strong>CSR:</strong> ${p.industry_partner}
            </div>
          ` : ''}
          <div style="color: #64748b; font-size: 11px; margin-bottom: 6px;">
            <strong>District:</strong> ${p.district_name || 'Jharkhand'}
          </div>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 4px; display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #16a34a; font-size: 10px; font-weight: 700;">
              ✓ ${p.status_label || 'Verified Working'}
            </span>
            <span style="color: #0891b2; font-size: 10px; font-weight: 600; cursor: pointer;">
              Click to View Dossier
            </span>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        setActiveProject(p);
      });

      markersLayerRef.current.addLayer(marker);
    });
  }, [filteredProjects]);

  const handleResetMap = () => {
    if (mapInstanceRef.current) {
      const { center, zoom } = getInitialView();
      mapInstanceRef.current.setView(center, zoom);
      setSelectedSector('all');
      setSelectedDistrictFilter('all');
      setSearchQuery('');
    }
  };

  // Group projects by category for stats
  const categoryCounts = useMemo(() => {
    const counts = {};
    filteredProjects.forEach(p => {
      const c = p.category || 'other';
      counts[c] = (counts[c] || 0) + 1;
    });
    return counts;
  }, [filteredProjects]);

  // Unique participating universities and districts
  const stats = useMemo(() => {
    const dSet = new Set(filteredProjects.map(p => p.district_name).filter(Boolean));
    const uSet = new Set(filteredProjects.map(p => p.university_name).filter(Boolean));
    return {
      total: filteredProjects.length,
      districts: dSet.size,
      universities: uSet.size
    };
  }, [filteredProjects]);

  return (
    <div className={`rounded-3xl border border-white/10 bg-gradient-to-b from-[#0F223D]/90 via-[#0B192C]/95 to-[#060E1A] shadow-[0_25px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl overflow-hidden space-y-4 ${className}`}>
      {/* Top Header with Government of Jharkhand Branding */}
      <div className="p-5 sm:p-6 border-b border-white/10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white/[0.03]">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-full overflow-hidden shadow-md ring-2 ring-teal/40 shrink-0 bg-[#060E1A] p-0.5">
            <img 
              src="/jharkhand_state_emblem.jpg" 
              alt="Government of Jharkhand Seal" 
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-teal/20 text-teal font-extrabold text-[10px] uppercase font-mono tracking-wider border border-teal/30">
                {mode === 'district' ? 'District-Scoped GIS' : mode === 'university' ? 'Institutional Campus View' : 'Statewide GIS Grid'}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {stats.total} Projects Mapped • OpenStreetMap
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-heading font-extrabold text-white">
              {title}
            </h2>
            <p className="text-slate-300 text-xs max-w-2xl">
              {subtitle}
            </p>
          </div>
        </div>

        {/* View Toggles & Map Refresh */}
        <div className="flex items-center space-x-2 self-stretch lg:self-auto justify-end">
          <button
            onClick={() => setViewMode(viewMode === 'map' ? 'split' : 'map')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border ${
              viewMode === 'split' 
                ? 'bg-teal text-navy border-teal shadow-glow-teal font-extrabold' 
                : 'bg-white/[0.06] text-slate-200 border-white/15 hover:bg-white/[0.12] hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{viewMode === 'split' ? 'Collapse Table' : 'Split View'}</span>
          </button>

          <button
            onClick={handleResetMap}
            className="p-1.5 rounded-xl border border-white/15 text-slate-300 hover:bg-white/[0.1] hover:text-white transition-all"
            title="Reset Map View & Filters"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Ribbon: Sectors & Search */}
      <div className="px-5 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by challenge, university, CSR partner, or district..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-white/10 text-xs bg-white/[0.05] text-white placeholder-slate-400 focus:outline-none focus:border-teal"
            />
          </div>

          {/* District Selector (in Statewide 'all' mode) */}
          {mode === 'all' && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-300 font-medium">District:</span>
              <select
                value={selectedDistrictFilter}
                onChange={(e) => setSelectedDistrictFilter(e.target.value)}
                className="bg-[#0B192C] border border-white/15 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-teal"
              >
                <option value="all">All Jharkhand Districts (24)</option>
                {JHARKHAND_DISTRICTS.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Sector Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            onClick={() => setSelectedSector('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedSector === 'all'
                ? 'bg-gradient-to-r from-teal to-teal-dark text-navy shadow-glow-teal'
                : 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.12] border border-white/10'
            }`}
          >
            All Sectors ({projects.length})
          </button>

          {Object.entries(CATEGORY_META).map(([key, meta]) => {
            const count = categoryCounts[key] || 0;
            const Icon = meta.icon;
            const isSelected = selectedSector === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedSector(isSelected ? 'all' : key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-2 border ${
                  isSelected
                    ? 'bg-teal text-navy border-teal shadow-glow-teal'
                    : count > 0 
                      ? 'bg-white/[0.06] text-slate-200 border-white/10 hover:border-white/30'
                      : 'opacity-40 bg-white/[0.02] text-slate-500 border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: isSelected ? '#0B192C' : meta.color }} />
                <span>{meta.label}</span>
                {count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${isSelected ? 'bg-navy/30 text-navy' : 'bg-white/[0.06]/15 text-slate-200'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Map Container & Interactive Split Drawer */}
      <div className={`p-4 sm:p-6 grid gap-6 ${viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}>
        {/* Real Leaflet Map Surface */}
        <div className={`relative rounded-2xl border border-white/15 overflow-hidden shadow-2xl ${viewMode === 'split' ? 'lg:col-span-7' : 'w-full'}`}>
          <div 
            ref={mapContainerRef} 
            className="w-full h-[460px] sm:h-[520px] bg-white/[0.06] z-10"
            style={{ minHeight: '440px' }}
          />

          {/* Interactive Floating Marker Tooltip / Quick Card on Map */}
          {activeProject && (
            <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-20 sm:max-w-md bg-white/[0.06]/95 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-2xl space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white uppercase" style={{ backgroundColor: CATEGORY_META[activeProject.category]?.color || '#0891b2' }}>
                    {CATEGORY_META[activeProject.category]?.label || activeProject.category}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 font-bold">
                    {activeProject.tracking_id}
                  </span>
                </div>
                <button
                  onClick={() => setActiveProject(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]"
                  title="Close Project Card"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                <h4 className="font-heading font-bold text-sm text-white line-clamp-2">
                  {activeProject.title}
                </h4>
                <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>District: <strong className="text-slate-200">{activeProject.district_name}</strong></span>
                </div>
              </div>

              {/* Roster: University & CSR Partner */}
              <div className="bg-white/[0.04] p-2.5 rounded-xl border border-white/10 space-y-1 text-xs">
                <div className="flex items-center space-x-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-teal" />
                  <span className="text-slate-300 truncate">HEI: <strong className="text-white">{activeProject.university_name || 'State University'}</strong></span>
                </div>
                {activeProject.industry_partner && (
                  <div className="flex items-center space-x-1.5">
                    <Building2 className="w-3.5 h-3.5 text-teal" />
                    <span className="text-slate-300 truncate">CSR Partner: <strong className="text-white">{activeProject.industry_partner}</strong></span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-between pt-1">
                <span className="inline-flex items-center space-x-1 text-emerald-300 font-bold text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{activeProject.status_label || 'Verified Working'}</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Lat: {activeProject.latitude?.toFixed(3)}, Lng: {activeProject.longitude?.toFixed(3)}
                </span>
              </div>
            </div>
          )}

          {/* Empty state overlay when no pins match filter */}
          {filteredProjects.length === 0 && !loading && (
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-6 text-center text-white z-20">
              <div className="space-y-2 max-w-sm">
                <MapPin className="w-8 h-8 text-teal mx-auto opacity-70" />
                <h4 className="font-heading font-bold text-sm">No Active Deployments Matched</h4>
                <p className="text-xs text-slate-400">
                  No projects match your current domain, search, or district filters. Try selecting "All Sectors" or clearing the search.
                </p>
                <button
                  onClick={handleResetMap}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-teal text-navy font-bold text-xs hover:bg-teal-hover transition-colors"
                >
                  Reset Map Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* List Column (Rendered in Split View) */}
        {viewMode === 'split' && (
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="font-heading font-bold text-sm text-white flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-teal" />
                <span>Mapped Deployments ({filteredProjects.length})</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">Real-Time Geotags</span>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredProjects.map(p => {
                const isSelected = activeProject?.id === p.id;
                const meta = CATEGORY_META[p.category] || CATEGORY_META.water_resources;

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setActiveProject(p);
                      if (mapInstanceRef.current && p.latitude && p.longitude) {
                        mapInstanceRef.current.setView([p.latitude, p.longitude], 12);
                      }
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? 'border-teal bg-teal/5 shadow-float ring-1 ring-teal'
                        : 'border-white/10 bg-white/[0.06] hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase" style={{ backgroundColor: meta.color }}>
                        {meta.label}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-semibold">{p.tracking_id}</span>
                    </div>

                    <h4 className="font-heading font-bold text-xs text-white line-clamp-2">
                      {p.title}
                    </h4>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1 border-t border-white/10">
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{p.district_name}</span>
                      </span>
                      <span className="flex items-center space-x-1 text-slate-200 font-medium">
                        <GraduationCap className="w-3.5 h-3.5 text-teal" />
                        <span className="truncate max-w-[140px]">{p.university_name}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info Strip */}
      <div className="px-5 py-3 bg-white/[0.04] border-t border-white/10 text-[11px] text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-teal"></span>
          <span>OpenStreetMap &amp; Leaflet.js • Department of Higher &amp; Technical Education</span>
        </div>
        <span className="font-mono text-slate-400">
          Statewide STI Innovation Grid • Government of Jharkhand
        </span>
      </div>
    </div>
  );
};

export default ProjectsMap;
