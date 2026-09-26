import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  MapPin, 
  Layers, 
  RotateCcw, 
  Landmark, 
  ExternalLink,
  Sparkles,
  Info
} from 'lucide-react';

const JHARKHAND_CENTER = [23.6102, 85.2799]; // Central Jharkhand coordinates

const DISTRICTS_DATA = [
  { name: 'Ranchi', lat: 23.3441, lng: 85.3096, division: 'South Chotanagpur (State Capital)', isCapital: true },
  { name: 'Dhanbad', lat: 23.7957, lng: 86.4304, division: 'North Chotanagpur (Coal Capital)' },
  { name: 'East Singhbhum (Jamshedpur)', lat: 22.8046, lng: 86.2029, division: 'Kolhan (Industrial Hub)' },
  { name: 'Bokaro', lat: 23.6693, lng: 86.1511, division: 'North Chotanagpur' },
  { name: 'Hazaribagh', lat: 23.9925, lng: 85.3637, division: 'North Chotanagpur' },
  { name: 'Deoghar', lat: 24.4826, lng: 86.7000, division: 'Santhal Pargana' },
  { name: 'Dumka', lat: 24.2677, lng: 87.2546, division: 'Santhal Pargana (Sub-Capital)' },
  { name: 'Giridih', lat: 24.1856, lng: 86.3060, division: 'North Chotanagpur' },
  { name: 'Palamu (Medininagar)', lat: 24.0416, lng: 84.0722, division: 'Palamu Division' },
  { name: 'Ramgarh', lat: 23.6322, lng: 85.5135, division: 'North Chotanagpur' },
  { name: 'West Singhbhum (Chaibasa)', lat: 22.5519, lng: 85.8083, division: 'Kolhan Division' },
  { name: 'Saraikela Kharsawan', lat: 22.7006, lng: 85.9328, division: 'Kolhan Division' },
  { name: 'Khunti', lat: 23.0726, lng: 85.2789, division: 'South Chotanagpur' },
  { name: 'Gumla', lat: 23.0439, lng: 84.5414, division: 'South Chotanagpur' },
  { name: 'Simdega', lat: 22.6145, lng: 84.5090, division: 'South Chotanagpur' },
  { name: 'Lohardaga', lat: 23.4357, lng: 84.6811, division: 'South Chotanagpur' },
  { name: 'Latehar', lat: 23.7431, lng: 84.5033, division: 'Palamu Division' },
  { name: 'Chatra', lat: 24.2096, lng: 84.8711, division: 'North Chotanagpur' },
  { name: 'Koderma', lat: 24.4674, lng: 85.5939, division: 'North Chotanagpur' },
  { name: 'Godda', lat: 24.8267, lng: 87.2144, division: 'Santhal Pargana' },
  { name: 'Sahibganj', lat: 25.2425, lng: 87.6444, division: 'Santhal Pargana' },
  { name: 'Pakur', lat: 24.6340, lng: 87.8488, division: 'Santhal Pargana' },
  { name: 'Jamtara', lat: 23.9620, lng: 86.8010, division: 'Santhal Pargana' },
  { name: 'Garhwa', lat: 24.1610, lng: 83.8055, division: 'Palamu Division' }
];

const JharkhandLeafletMap = ({ className = '' }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [selectedDistrict, setSelectedDistrict] = useState('all');

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy existing instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Initialize Leaflet Map centered on Jharkhand
    const map = L.map(mapContainerRef.current, {
      center: JHARKHAND_CENTER,
      zoom: 7,
      minZoom: 6,
      maxZoom: 14,
      scrollWheelZoom: false, // Prevent page hijacking when scrolling landing page
      zoomControl: false // Custom placement
    });

    mapInstanceRef.current = map;

    // Add standard OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors | Government of Jharkhand'
    }).addTo(map);

    // Zoom control at bottom right
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
      fillOpacity: 0.05,
      dashArray: '4, 4'
    }).addTo(map);

    // Custom DivIcon for State Capital (Ranchi) and Districts
    const markers = [];
    DISTRICTS_DATA.forEach(dist => {
      const isCapital = dist.isCapital;
      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: ${isCapital ? '24px' : '18px'};
            height: ${isCapital ? '24px' : '18px'};
            background-color: ${isCapital ? '#0B192C' : '#0891b2'};
            border: 2px solid ${isCapital ? '#2dd4bf' : '#ffffff'};
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            cursor: pointer;
            transition: transform 0.2s;
          ">
            <div style="
              width: ${isCapital ? '8px' : '6px'};
              height: ${isCapital ? '8px' : '6px'};
              background-color: ${isCapital ? '#2dd4bf' : '#ffffff'};
              border-radius: 50%;
            "></div>
          </div>
        `,
        iconSize: [isCapital ? 24 : 18, isCapital ? 24 : 18],
        iconAnchor: [isCapital ? 12 : 9, isCapital ? 12 : 9]
      });

      const marker = L.marker([dist.lat, dist.lng], { icon: customIcon }).addTo(map);

      const popupContent = `
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4; padding: 4px; min-width: 170px;">
          <div style="font-weight: 700; color: #0B192C; font-size: 13px; margin-bottom: 2px; display: flex; align-items: center; gap: 4px;">
            <span>${dist.name}</span>
            ${isCapital ? '<span style="font-size: 9px; background: #0B192C; color: #2dd4bf; padding: 1px 4px; border-radius: 4px;">CAPITAL</span>' : ''}
          </div>
          <div style="color: #64748b; font-size: 11px; margin-bottom: 4px;">
            <strong>Division:</strong> ${dist.division}
          </div>
          <div style="color: #0891b2; font-size: 10px; font-weight: 600; border-top: 1px solid #e2e8f0; padding-top: 4px;">
            Govt. of Jharkhand • Administrative District
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      markers.push({ name: dist.name, marker, lat: dist.lat, lng: dist.lng });
    });

    markersRef.current = markers;

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(JHARKHAND_CENTER, 7);
      setSelectedDistrict('all');
    }
  };

  const handleSelectDistrict = (e) => {
    const val = e.target.value;
    setSelectedDistrict(val);
    if (val === 'all') {
      handleResetView();
      return;
    }
    const found = markersRef.current.find(m => m.name === val);
    if (found && mapInstanceRef.current) {
      mapInstanceRef.current.setView([found.lat, found.lng], 10);
      found.marker.openPopup();
    }
  };

  return (
    <div className={`relative bg-white/[0.06] rounded-2xl border border-white/10 shadow-md overflow-hidden ${className}`}>
      {/* Official Government Header Banner Overlay */}
      <div className="bg-navy text-white px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-navy-light">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full overflow-hidden shadow-md ring-2 ring-teal/30 shrink-0 bg-navy">
            <img 
              src="/jharkhand_state_emblem.jpg" 
              alt="Government of Jharkhand Seal" 
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-300">
              Government of Jharkhand (झारखंड सरकार)
            </div>
            <div className="text-sm sm:text-base font-heading font-extrabold text-white flex items-center space-x-2">
              <span>Jharkhand Geospatial Map — OpenStreetMap</span>
              <span className="hidden md:inline-block text-[10px] px-1.5 py-0.5 rounded bg-teal text-navy font-bold font-mono">
                LIVE GIS
              </span>
            </div>
          </div>
        </div>

        {/* Controls Toolbar */}
        <div className="flex items-center space-x-2 self-end sm:self-center">
          {/* Quick-Jump to District */}
          <select
            value={selectedDistrict}
            onChange={handleSelectDistrict}
            className="bg-navy-light border border-steel-light/60 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-teal"
            aria-label="Select Jharkhand District"
          >
            <option value="all">Jump to District ({DISTRICTS_DATA.length})</option>
            {DISTRICTS_DATA.map(d => (
              <option key={d.name} value={d.name}>{d.name}</option>
            ))}
          </select>

          {/* Reset Zoom Button */}
          <button
            onClick={handleResetView}
            className="flex items-center space-x-1 bg-navy-light hover:bg-teal hover:text-navy text-slate-200 text-xs px-2.5 py-1.5 rounded-lg border border-steel transition-colors font-medium"
            title="Reset map view to whole Jharkhand state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Leaflet Map DOM Container */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-[420px] sm:h-[480px] bg-white/[0.06] z-10"
        style={{ minHeight: '380px' }}
      />

      {/* Official Government Watermark & Footnote */}
      <div className="bg-white/[0.04] px-4 py-2 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-teal"></span>
          <span>Department of Higher & Technical Education • Govt. of Jharkhand</span>
        </div>
        <div className="text-slate-400">
          Powered by Leaflet.js &amp; OpenStreetMap • 24 Administrative Districts
        </div>
      </div>
    </div>
  );
};

export default JharkhandLeafletMap;
