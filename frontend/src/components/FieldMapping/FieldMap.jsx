import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Layers, 
  Navigation, 
  MapPin, 
  Plus, 
  RotateCcw, 
  Trash2, 
  Maximize, 
  Check, 
  Sparkles,
  Info,
  Compass,
  AlertTriangle,
  Radio,
  Eye
} from 'lucide-react';
import { getDeviceLocation, DEFAULT_DEMO_COORDINATE } from '../../utils/gpsUtils';
import { calculatePolygonCenter } from '../../utils/areaUtils';

// Numbered green corner marker icon factory
const createNumberedCornerIcon = (number, isSelected = false) => {
  return L.divIcon({
    className: 'field-corner-div-icon',
    html: `
      <div style="
        background: ${isSelected ? '#047857' : '#10b981'};
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-weight: 800;
        font-size: 12px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.35);
        border: 2px solid #ffffff;
        cursor: grab;
        transition: transform 0.15s ease;
      " onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'">
        ${number}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
};

// Device GPS marker with animated pulse ring
const createGpsCurrentLocationIcon = (isDemo = false) => {
  return L.divIcon({
    className: 'field-gps-current-icon',
    html: `
      <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
        <div style="
          position: absolute;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: ${isDemo ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)'};
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <div style="
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: ${isDemo ? '#d97706' : '#059669'};
          border: 2.5px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        "></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// High-resolution satellite tiles (Esri World Imagery) with optional env override
const SATELLITE_TILE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SATELLITE_TILE_URL) ||
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const SATELLITE_ATTRIBUTION = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';

export default function FieldMap({
  boundaryPoints = [],
  onBoundaryChange,
  gpsPosition = null,
  onGpsPositionChange,
  gpsStatus = 'GPS Waiting',
  onGpsStatusChange,
  gpsAccuracy = null,
  isDemoLocation = false,
  setIsDemoLocation
}) {
  const { lang } = useLanguage();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const polygonLayerRef = useRef(null);
  const polylineLayerRef = useRef(null);
  const cornerMarkersRef = useRef([]);
  const gpsMarkerRef = useRef(null);
  const gpsAccuracyCircleRef = useRef(null);

  const [activeLayer, setActiveLayer] = useState('satellite'); // 'satellite' | 'map'
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [markingMode, setMarkingMode] = useState(true); // default click to mark enabled

  // Calculate center from boundary or default
  const centerCoord = boundaryPoints.length > 0 
    ? calculatePolygonCenter(boundaryPoints) 
    : (gpsPosition || DEFAULT_DEMO_COORDINATE);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialCenter = [centerCoord.lat, centerCoord.lng];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 16,
      zoomControl: false // custom controls for cleaner AgriTech UX
    });

    // Default to Satellite Imagery layer
    const initialTileUrl = activeLayer === 'satellite' ? SATELLITE_TILE_URL : OSM_TILE_URL;
    const initialAttribution = activeLayer === 'satellite' ? SATELLITE_ATTRIBUTION : OSM_ATTRIBUTION;

    const tileLayer = L.tileLayer(initialTileUrl, {
      maxZoom: 19,
      attribution: initialAttribution
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    mapInstanceRef.current = map;

    // Handle Map Click for Marking Corners
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      handleMapClickAddPoint(lat, lng);
    });

    // Invalidate map size to prevent gray tiles inside responsive layouts
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when user toggles Map vs Satellite
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    mapInstanceRef.current.removeLayer(tileLayerRef.current);

    const nextUrl = activeLayer === 'satellite' ? SATELLITE_TILE_URL : OSM_TILE_URL;
    const nextAttr = activeLayer === 'satellite' ? SATELLITE_ATTRIBUTION : OSM_ATTRIBUTION;

    const newLayer = L.tileLayer(nextUrl, {
      maxZoom: 19,
      attribution: nextAttr
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newLayer;
  }, [activeLayer]);

  // Synchronize Boundary Points, Polyline, Polygon, and Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // 1. Clean existing corner markers
    cornerMarkersRef.current.forEach(m => map.removeLayer(m));
    cornerMarkersRef.current = [];

    // 2. Clean existing polygon and polyline layers
    if (polygonLayerRef.current) {
      map.removeLayer(polygonLayerRef.current);
      polygonLayerRef.current = null;
    }
    if (polylineLayerRef.current) {
      map.removeLayer(polylineLayerRef.current);
      polylineLayerRef.current = null;
    }

    if (!boundaryPoints || boundaryPoints.length === 0) return;

    const latLngArray = boundaryPoints.map(p => [p.lat, p.lng]);

    // 3. Draw boundary lines or polygon
    if (boundaryPoints.length >= 3) {
      // Complete closed polygon
      const polygon = L.polygon(latLngArray, {
        color: '#10b981', // emerald-500
        weight: 3,
        fillColor: '#10b981',
        fillOpacity: 0.28,
        dashArray: null
      }).addTo(map);

      polygon.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; padding: 2px;">
          <b style="color: #047857; font-size: 13px;">🌾 Field Boundary</b><br>
          <span>Corners: <b>${boundaryPoints.length}</b></span>
        </div>
      `);

      polygonLayerRef.current = polygon;
    } else if (boundaryPoints.length === 2) {
      // In-progress line between points
      const polyline = L.polyline(latLngArray, {
        color: '#10b981',
        weight: 3,
        dashArray: '6, 6'
      }).addTo(map);
      polylineLayerRef.current = polyline;
    }

    // 4. Place Numbered Corner Markers (1, 2, 3 ... N)
    boundaryPoints.forEach((point, index) => {
      const marker = L.marker([point.lat, point.lng], {
        icon: createNumberedCornerIcon(index + 1),
        draggable: true,
        riseOnHover: true
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 11px;">
          <b style="color:#059669;">Corner #${index + 1}</b><br>
          Lat: ${point.lat.toFixed(5)}°<br>
          Lng: ${point.lng.toFixed(5)}°<br>
          <i style="color:#64748b;">(Drag to fine-tune)</i>
        </div>
      `);

      // Allow farmers to drag corners for fine spatial adjustments
      marker.on('dragend', (e) => {
        const newPos = e.target.getLatLng();
        handleCornerDrag(index, newPos.lat, newPos.lng);
      });

      cornerMarkersRef.current.push(marker);
    });
  }, [boundaryPoints]);

  // Synchronize GPS marker and accuracy circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (gpsMarkerRef.current) {
      map.removeLayer(gpsMarkerRef.current);
      gpsMarkerRef.current = null;
    }
    if (gpsAccuracyCircleRef.current) {
      map.removeLayer(gpsAccuracyCircleRef.current);
      gpsAccuracyCircleRef.current = null;
    }

    if (gpsPosition && typeof gpsPosition.lat === 'number' && typeof gpsPosition.lng === 'number') {
      const pos = [gpsPosition.lat, gpsPosition.lng];

      // Accuracy ring
      if (gpsAccuracy && gpsAccuracy > 0) {
        const circle = L.circle(pos, {
          radius: Math.min(gpsAccuracy, 150),
          color: isDemoLocation ? '#f59e0b' : '#10b981',
          fillColor: isDemoLocation ? '#f59e0b' : '#10b981',
          fillOpacity: 0.12,
          weight: 1.5,
          dashArray: '4, 4'
        }).addTo(map);
        gpsAccuracyCircleRef.current = circle;
      }

      // Pin
      const marker = L.marker(pos, {
        icon: createGpsCurrentLocationIcon(isDemoLocation),
        zIndexOffset: 1000
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-size: 11px;">
          <b>${isDemoLocation ? '🧪 Demo Testing Position' : '📍 Current Device GPS'}</b><br>
          Accuracy: ±${gpsAccuracy || 15}m<br>
          Lat: ${gpsPosition.lat.toFixed(5)}°, Lng: ${gpsPosition.lng.toFixed(5)}°
        </div>
      `);

      gpsMarkerRef.current = marker;
    }
  }, [gpsPosition, gpsAccuracy, isDemoLocation]);

  // Click on map to add boundary point
  const handleMapClickAddPoint = useCallback((lat, lng) => {
    const newPoint = {
      lat: Math.round(lat * 100000) / 100000,
      lng: Math.round(lng * 100000) / 100000
    };

    const updated = [...boundaryPoints, newPoint];
    if (onBoundaryChange) {
      onBoundaryChange(updated);
    }
  }, [boundaryPoints, onBoundaryChange]);

  // Drag corner to adjust
  const handleCornerDrag = useCallback((cornerIndex, newLat, newLng) => {
    const updated = boundaryPoints.map((p, idx) => {
      if (idx === cornerIndex) {
        return {
          lat: Math.round(newLat * 100000) / 100000,
          lng: Math.round(newLng * 100000) / 100000
        };
      }
      return p;
    });

    if (onBoundaryChange) {
      onBoundaryChange(updated);
    }
  }, [boundaryPoints, onBoundaryChange]);

  // Undo Last Corner
  const handleUndoLastPoint = () => {
    if (boundaryPoints.length === 0) return;
    const updated = boundaryPoints.slice(0, -1);
    if (onBoundaryChange) {
      onBoundaryChange(updated);
    }
  };

  // Clear / Reset All Boundary
  const handleClearBoundary = () => {
    if (boundaryPoints.length === 0) return;
    if (window.confirm(lang === 'hi' ? 'क्या आप खेत की सीमा रीसेट करना चाहते हैं?' : 'Reset this field boundary?')) {
      if (onBoundaryChange) {
        onBoundaryChange([]);
      }
    }
  };

  // Add Point at Current GPS / Center
  const handleMarkCurrentGpsCorner = () => {
    const target = gpsPosition || centerCoord;
    if (target) {
      handleMapClickAddPoint(target.lat, target.lng);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo([target.lat, target.lng]);
      }
    }
  };

  // Real Device Geolocation Request
  const handleFindMyGps = async () => {
    setIsLocating(true);
    setLocationError('');
    if (onGpsStatusChange) onGpsStatusChange('Detecting GPS...');

    try {
      const loc = await getDeviceLocation({ timeout: 15000 });
      setIsLocating(false);
      setIsDemoLocation(false);

      if (onGpsPositionChange) {
        onGpsPositionChange({ lat: loc.lat, lng: loc.lng });
      }
      if (onGpsStatusChange) {
        onGpsStatusChange(`GPS Connected`);
      }

      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([loc.lat, loc.lng], 17);
      }
    } catch (err) {
      setIsLocating(false);
      setLocationError(err.userMessage || 'GPS position unavailable.');
      if (onGpsStatusChange) onGpsStatusChange('GPS Waiting');
    }
  };

  // Use Desktop Demo Location (Testing)
  const handleUseDemoLocation = () => {
    setIsDemoLocation(true);
    setLocationError('');
    const demoPos = {
      lat: DEFAULT_DEMO_COORDINATE.lat,
      lng: DEFAULT_DEMO_COORDINATE.lng
    };

    if (onGpsPositionChange) {
      onGpsPositionChange(demoPos);
    }
    if (onGpsStatusChange) {
      onGpsStatusChange('GPS Connected (Demo)');
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([demoPos.lat, demoPos.lng], 17);
    }
  };

  // Zoom In / Out
  const handleZoom = (delta) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() + delta);
    }
  };

  // Fit view to entire polygon boundary
  const handleFitBounds = () => {
    if (!mapInstanceRef.current || boundaryPoints.length === 0) return;
    const latLngs = boundaryPoints.map(p => [p.lat, p.lng]);
    const bounds = L.latLngBounds(latLngs);
    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Top Map Action Bar */}
      <div className="p-3.5 bg-slate-50/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        
        {/* Layer Switcher & Mode Badges */}
        <div className="flex items-center gap-2">
          {/* Layer Toggle: Map vs Satellite */}
          <div className="inline-flex rounded-xl bg-slate-200/80 p-0.5 border border-slate-300 shadow-inner">
            <button
              type="button"
              id="btn-layer-satellite"
              onClick={() => setActiveLayer('satellite')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
                activeLayer === 'satellite'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <span>🛰️</span>
              <span>Satellite</span>
            </button>
            <button
              type="button"
              id="btn-layer-map"
              onClick={() => setActiveLayer('map')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
                activeLayer === 'map'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <span>🗺️</span>
              <span>Map</span>
            </button>
          </div>

          <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">
            {boundaryPoints.length} {lang === 'hi' ? 'कोने चिह्नित' : 'corners marked'}
          </span>
        </div>

        {/* GPS Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Find My GPS (Real Device Geolocation) */}
          <button
            type="button"
            id="btn-find-my-gps"
            onClick={handleFindMyGps}
            disabled={isLocating}
            className={`px-3 py-1.5 rounded-xl font-bold border text-xs flex items-center gap-1.5 transition active:scale-95 shadow-xs ${
              isLocating 
                ? 'bg-emerald-100 text-emerald-900 border-emerald-400 animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
            }`}
          >
            <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Detecting...' : (lang === 'hi' ? '📍 मेरा GPS खोजें' : '📍 Find My GPS')}</span>
          </button>

          {/* Desktop Demo Location Control */}
          <button
            type="button"
            id="btn-desktop-demo-gps"
            onClick={handleUseDemoLocation}
            className="px-2.5 py-1.5 rounded-xl font-bold border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs flex items-center gap-1.5 transition active:scale-95 shadow-2xs"
            title="Simulate outdoor GPS coordinates for desktop development & testing"
          >
            <span>🧪</span>
            <span className="hidden md:inline">Use Desktop Demo Location (Testing)</span>
            <span className="md:hidden">Demo GPS</span>
          </button>
        </div>
      </div>

      {/* GPS Error Diagnostics Banner */}
      {locationError && (
        <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-950 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{locationError}</span>
          </div>
          <button
            type="button"
            onClick={handleUseDemoLocation}
            className="text-[11px] font-bold underline text-amber-800 hover:text-amber-950 shrink-0"
          >
            Use Demo Location Instead
          </button>
        </div>
      )}

      {/* Map Canvas Container */}
      <div className="relative w-full h-[380px] sm:h-[460px] lg:h-[500px] bg-slate-900">
        <div 
          ref={mapContainerRef} 
          className="w-full h-full z-10"
        />

        {/* Floating In-Map Corner Controls (Top Right) */}
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5">
          {/* Mark Map Corner Button */}
          <button
            type="button"
            id="btn-mark-map-corner"
            onClick={handleMarkCurrentGpsCorner}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg border border-emerald-400/50 flex items-center gap-2 transition active:scale-95 backdrop-blur-xs"
            title="Mark corner at current position"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{lang === 'hi' ? 'कोना चिह्नित करें (Mark Corner)' : 'Mark Map Corner'}</span>
          </button>

          {/* Undo Last Point */}
          {boundaryPoints.length > 0 && (
            <button
              type="button"
              onClick={handleUndoLastPoint}
              className="px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white text-slate-700 font-bold text-xs shadow-md border border-slate-200 flex items-center justify-center gap-1.5 transition active:scale-95 backdrop-blur-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>{lang === 'hi' ? 'अंतिम बिंदु हटाएं' : 'Undo Point'}</span>
            </button>
          )}

          {/* Clear All Boundary */}
          {boundaryPoints.length > 0 && (
            <button
              type="button"
              onClick={handleClearBoundary}
              className="px-3 py-1.5 rounded-xl bg-rose-50/95 hover:bg-rose-100 text-rose-700 font-bold text-xs shadow-md border border-rose-200 flex items-center justify-center gap-1.5 transition active:scale-95 backdrop-blur-xs"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>{lang === 'hi' ? 'रीसेट करें' : 'Clear All'}</span>
            </button>
          )}
        </div>

        {/* Zoom & Bounds Control (Bottom Right) */}
        <div className="absolute bottom-4 right-3 z-20 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => handleZoom(1)}
            className="w-8 h-8 rounded-xl bg-white text-slate-800 hover:bg-slate-100 font-black text-sm shadow-md border border-slate-200 flex items-center justify-center transition active:scale-95"
            title="Zoom In"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => handleZoom(-1)}
            className="w-8 h-8 rounded-xl bg-white text-slate-800 hover:bg-slate-100 font-black text-sm shadow-md border border-slate-200 flex items-center justify-center transition active:scale-95"
            title="Zoom Out"
          >
            −
          </button>
          {boundaryPoints.length >= 3 && (
            <button
              type="button"
              onClick={handleFitBounds}
              className="w-8 h-8 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-md flex items-center justify-center transition active:scale-95"
              title="Fit to Field Boundary"
            >
              <Maximize className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Interactive Instruction Pill (Top Left) */}
        <div className="absolute top-3 left-3 z-20 bg-slate-900/85 backdrop-blur-md text-white text-[11px] font-medium px-3 py-1.5 rounded-xl border border-slate-700/60 shadow-lg flex items-center gap-2 max-w-[85%] sm:max-w-xs pointer-events-none">
          <span className="text-emerald-400 font-bold shrink-0">💡</span>
          <span className="truncate">
            {boundaryPoints.length < 3 
              ? (lang === 'hi' ? 'नक्शे पर टैप करके सीमा के कोने जोड़ें' : 'Tap on map to add boundary corners')
              : (lang === 'hi' ? 'सीमा बंद हो गई है। खींचकर सही कर सकते हैं' : 'Polygon closed. Drag corners to adjust.')}
          </span>
        </div>

        {/* Dynamic Coordinates Overlay (Bottom Left) */}
        <div className="absolute bottom-3 left-3 z-20 bg-slate-900/90 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-mono px-3 py-1.5 rounded-xl border border-slate-700/60 shadow-lg flex items-center gap-2 flex-wrap">
          <span className="text-emerald-400 font-bold">📍 Lat: {centerCoord.lat.toFixed(4)}°</span>
          <span className="text-slate-600">•</span>
          <span className="text-emerald-400 font-bold">Lon: {centerCoord.lng.toFixed(4)}°</span>
          {gpsAccuracy && (
            <>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-300 font-bold">±{gpsAccuracy}m</span>
            </>
          )}
        </div>
      </div>

      {/* Map Footer Bar: Corner count and instructions */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-extrabold text-slate-800">
            {boundaryPoints.length} {boundaryPoints.length === 1 ? 'Corner' : 'Corners'} Marked
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-600">
            {boundaryPoints.length >= 3 
              ? '✓ Closed Field Polygon Live' 
              : `Add ${3 - boundaryPoints.length} more corner${3 - boundaryPoints.length === 1 ? '' : 's'} to close polygon`}
          </span>
        </div>

        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
          <span>Layer:</span>
          <span className="font-bold text-slate-700 capitalize">
            {activeLayer === 'satellite' ? 'Esri Satellite Imagery' : 'OpenStreetMap Standard'}
          </span>
        </div>
      </div>
    </div>
  );
}
