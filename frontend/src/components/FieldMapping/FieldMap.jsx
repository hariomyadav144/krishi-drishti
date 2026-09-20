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
  Eye,
  Search,
  X,
  Crosshair,
  CheckCircle2
} from 'lucide-react';
import { 
  getDeviceLocation, 
  watchDeviceLocation, 
  validateGpsQuality, 
  formatGpsAccuracy, 
  DEFAULT_DEMO_COORDINATE, 
  SAMPLE_DEMO_FIELD_BOUNDARY 
} from '../../utils/gpsUtils';
import { isLegacyMockPolygon } from '../../services/fieldService';
import { reverseGeocode, searchPlaces } from '../../services/geocodingService';
import { calculatePolygonCenter, calculatePolygonArea } from '../../utils/areaUtils';

// Numbered green corner marker icon factory
const createNumberedCornerIcon = (number, isSelected = false, source = 'gps') => {
  const isMapSelection = source === 'map_selection';
  const bgColor = isMapSelection ? '#d97706' : (isSelected ? '#047857' : '#10b981');

  return L.divIcon({
    className: 'field-corner-div-icon',
    html: `
      <div style="
        background: ${bgColor};
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

// Candidate / Temporary Corner Selection Marker icon factory (Section 8: Clearly distinguished as Map Selection)
const createTemporaryTargetIcon = (nextNumber) => {
  return L.divIcon({
    className: 'field-temp-corner-div-icon',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
          <div style="
            position: absolute;
            width: 34px;
            height: 34px;
            border-radius: 50%;
            border: 2px dashed #f59e0b;
            animation: spin 3s linear infinite;
            background: rgba(245, 158, 11, 0.2);
          "></div>
          <div style="
            position: relative;
            background: #d97706;
            color: #ffffff;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 11px;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          ">
            +${nextNumber}
          </div>
        </div>
        <div style="
          margin-top: 2px;
          background: #b45309;
          color: #ffffff;
          font-size: 8px;
          font-weight: 800;
          padding: 1px 5px;
          border-radius: 9999px;
          white-space: nowrap;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
          letter-spacing: 0.5px;
        ">
          MAP SELECTION
        </div>
      </div>
    `,
    iconSize: [70, 50],
    iconAnchor: [35, 17],
    popupAnchor: [0, -17]
  });
};

// Device GPS marker with "YOU ARE HERE" badge and animated pulse ring (Section 4 & 6 of Master Spec)
const createGpsCurrentLocationIcon = (isDemo = false, accuracy = null) => {
  const pulseColor = isDemo ? 'rgba(245, 158, 11, 0.45)' : 'rgba(37, 99, 235, 0.45)';
  const dotColor = isDemo ? '#d97706' : '#2563eb';
  const ringColor = isDemo ? '#f59e0b' : '#3b82f6';
  const labelText = isDemo ? 'DEMO LOCATION' : 'YOU ARE HERE';

  return L.divIcon({
    className: 'field-gps-current-icon',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <div style="position: relative; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;">
          <div style="
            position: absolute;
            width: 26px;
            height: 26px;
            border-radius: 50%;
            background: ${pulseColor};
            animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
          <div style="
            position: absolute;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: ${ringColor};
            opacity: 0.25;
          "></div>
          <div style="
            position: relative;
            width: 13px;
            height: 13px;
            border-radius: 50%;
            background: ${dotColor};
            border: 2px solid #ffffff;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          "></div>
        </div>
        <div style="
          margin-top: 3px;
          background: ${isDemo ? '#b45309' : '#1e40af'};
          color: #ffffff;
          font-size: 9px;
          font-weight: 800;
          padding: 1px 6px;
          border-radius: 9999px;
          white-space: nowrap;
          box-shadow: 0 2px 6px rgba(0,0,0,0.35);
          letter-spacing: 0.5px;
          border: 1px solid rgba(255,255,255,0.7);
        ">
          📍 ${labelText}
        </div>
      </div>
    `,
    iconSize: [80, 48],
    iconAnchor: [40, 13]
  });
};

const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// High-resolution satellite tiles (Esri World Imagery) with optional env override
const SATELLITE_TILE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SATELLITE_TILE_URL) ||
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const SATELLITE_ATTRIBUTION = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';

// Neutral center for India overview if GPS is not yet acquired
const INDIA_OVERVIEW_COORDINATE = { lat: 20.5937, lng: 78.9629 };

// Helper to retrieve previously saved real farm coordinates from localStorage
const getSavedRealFarmCoords = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('krishi_farm_coords');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
        // Discard if close to Pimpalgaon test coordinates
        if (Math.abs(Number(parsed.lat) - 20.174) < 0.05 && Math.abs(Number(parsed.lng) - 73.985) < 0.05) {
          localStorage.removeItem('krishi_farm_coords');
          return null;
        }
        return parsed;
      }
    }
  } catch (_) {}
  return null;
};

export default function FieldMap({
  boundaryPoints = [],
  onBoundaryChange,
  onClearAll,
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
  const tempMarkerRef = useRef(null);
  const gpsMarkerRef = useRef(null);
  const gpsAccuracyCircleRef = useRef(null);
  const lastClickTimeRef = useRef(0);
  const userHasDrawnInSessionRef = useRef(false);
  const handleMapClickSelectPointRef = useRef(null);

  const savedFarm = getSavedRealFarmCoords();

  const [activeLayer, setActiveLayer] = useState('satellite'); // 'satellite' | 'map'
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [gpsQualityMessage, setGpsQualityMessage] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null); // Farmer Phase 6: temporary candidate map point

  // Real Farmer Land Discovery & Place Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [focusedPlaceName, setFocusedPlaceName] = useState(savedFarm?.name || '');

  // Ref to hold latest GPS reading for validation
  const latestGpsRef = useRef(null);
  const locationWatchCleanupRef = useRef(null);

  // Calculate center: 1) Active boundary, 2) Current GPS, 3) Saved Real Farm, 4) Demo if chosen, 5) India center
  const centerCoord = boundaryPoints.length > 0 
    ? calculatePolygonCenter(boundaryPoints) 
    : (gpsPosition || (savedFarm ? { lat: savedFarm.lat, lng: savedFarm.lng } : (isDemoLocation ? DEFAULT_DEMO_COORDINATE : INDIA_OVERVIEW_COORDINATE)));

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialCenter = [centerCoord.lat, centerCoord.lng];
    const initialZoom = (boundaryPoints.length > 0 || savedFarm || gpsPosition || isDemoLocation) ? 17 : 5;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
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

    // Handle Map Click: Step 2 of Farmer Flow (places candidate pin; does NOT add to points immediately)
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      if (handleMapClickSelectPointRef.current) {
        handleMapClickSelectPointRef.current(lat, lng);
      }
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

  // Section 4 & 6: Continuous GPS Tracking via watchDeviceLocation
  useEffect(() => {
    // 1. If farmer already has saved farm coordinates, use them right away
    const saved = getSavedRealFarmCoords();
    if (saved && !gpsPosition && onGpsPositionChange) {
      onGpsPositionChange({ lat: saved.lat, lng: saved.lng });
      if (saved.name) setFocusedPlaceName(saved.name);
    }

    // 2. Start continuous GPS location stream
    if (typeof window !== 'undefined' && navigator.geolocation) {
      const cleanup = watchDeviceLocation(
        (loc) => {
          latestGpsRef.current = loc;
          if (onGpsPositionChange) {
            onGpsPositionChange({ lat: loc.lat, lng: loc.lng });
          }
          if (onGpsStatusChange) {
            onGpsStatusChange(`GPS Connected (±${Math.round(loc.accuracy || 10)}m)`);
          }

          // Section 6: Camera stability rule
          // Before first boundary point: map follows farmer's live GPS position
          // After first boundary point: keep map STABLE, do not auto-recenter
          if (boundaryPoints.length === 0 && mapInstanceRef.current && !isDemoLocation) {
            mapInstanceRef.current.panTo([loc.lat, loc.lng]);
          }
        },
        (err) => {
          console.warn('GPS watch warning:', err.message);
          if (onGpsStatusChange) {
            onGpsStatusChange('GPS Waiting');
          }
        },
        { enableHighAccuracy: true }
      );

      locationWatchCleanupRef.current = cleanup;
    }

    return () => {
      if (locationWatchCleanupRef.current) {
        locationWatchCleanupRef.current();
        locationWatchCleanupRef.current = null;
      }
    };
  }, [boundaryPoints.length, isDemoLocation]);

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
        icon: createNumberedCornerIcon(index + 1, false, point.source || 'gps'),
        draggable: true,
        riseOnHover: true
      }).addTo(map);

      const sourceLabel = point.source === 'map_selection' ? 'Map Tap' : (point.source === 'demo' ? 'Demo Pin' : 'Live GPS');

      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 11px;">
          <b style="color:#059669;">Corner #${index + 1} (${sourceLabel})</b><br>
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
          color: isDemoLocation ? '#f59e0b' : '#2563eb',
          fillColor: isDemoLocation ? '#f59e0b' : '#3b82f6',
          fillOpacity: 0.12,
          weight: 1.5,
          dashArray: '4, 4'
        }).addTo(map);
        gpsAccuracyCircleRef.current = circle;
      }

      // Pin
      const marker = L.marker(pos, {
        icon: createGpsCurrentLocationIcon(isDemoLocation, gpsAccuracy),
        zIndexOffset: 1000
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-size: 11px;">
          <b>${isDemoLocation ? '🧪 Demo Testing Position' : '📍 YOU ARE HERE'}</b><br>
          GPS accuracy: ±${gpsAccuracy || 10}m<br>
          Lat: ${gpsPosition.lat.toFixed(5)}°, Lng: ${gpsPosition.lng.toFixed(5)}°
        </div>
      `);

      gpsMarkerRef.current = marker;
    }
  }, [gpsPosition, gpsAccuracy, isDemoLocation]);

  // Internal helper to commit a validated point to boundary list
  const commitPointToBoundary = useCallback((point) => {
    const hasLegacyPoints = isLegacyMockPolygon(boundaryPoints) || 
      (Array.isArray(boundaryPoints) && (boundaryPoints.length === 7 || boundaryPoints.length === 8)) ||
      (Array.isArray(boundaryPoints) && boundaryPoints.some(p => Math.abs(Number(p.lat) - 20.174) < 0.05 && Math.abs(Number(p.lng) - 73.985) < 0.05));

    let updated;
    if (boundaryPoints.length === 0 || hasLegacyPoints || !userHasDrawnInSessionRef.current) {
      // First point is strictly Point 1
      updated = [point];
      userHasDrawnInSessionRef.current = true;

      // Reverse geocode Point 1 in background to save farmer's real field location
      reverseGeocode(point.lat, point.lng)
        .then(geo => {
          if (geo?.formatted) {
            setFocusedPlaceName(geo.formatted);
            try {
              localStorage.setItem('krishi_farm_coords', JSON.stringify({
                lat: point.lat,
                lng: point.lng,
                name: geo.formatted,
                mode: point.source || 'gps',
                savedAt: new Date().toISOString()
              }));
            } catch (_) {}
          }
        })
        .catch(() => {});
    } else {
      updated = [...boundaryPoints, point];
      userHasDrawnInSessionRef.current = true;
    }

    if (onBoundaryChange) {
      onBoundaryChange(updated);
    }
  }, [boundaryPoints, onBoundaryChange]);

  // Farmer taps satellite map -> directly places the next corner (Point 1, Point 2, Point 3...)
  const handleMapClickSelectPoint = useCallback((lat, lng) => {
    const now = Date.now();
    if (now - lastClickTimeRef.current < 250) return; // Debounce touch double-triggers
    lastClickTimeRef.current = now;

    const rounded = {
      lat: Math.round(lat * 100000) / 100000,
      lng: Math.round(lng * 100000) / 100000,
      source: 'map_selection'
    };

    setLocationError('');
    setGpsQualityMessage('');

    if (tempMarkerRef.current && mapInstanceRef.current) {
      try { mapInstanceRef.current.removeLayer(tempMarkerRef.current); } catch (_) {}
      tempMarkerRef.current = null;
    }
    setSelectedPoint(null);

    // Commit point directly so the farmer gets instant, direct feedback on their field
    commitPointToBoundary(rounded);
  }, [commitPointToBoundary]);

  // Keep listener ref up to date
  useEffect(() => {
    handleMapClickSelectPointRef.current = handleMapClickSelectPoint;
  }, [handleMapClickSelectPoint]);

  // Section 7: MARK MY LOCATION (Primary GPS Walking Action)
  const handleMarkMyLocationGps = () => {
    setLocationError('');
    setGpsQualityMessage('');

    // Check GPS availability
    const reading = latestGpsRef.current || (gpsPosition ? {
      lat: gpsPosition.lat,
      lng: gpsPosition.lng,
      accuracy: gpsAccuracy || 15,
      timestamp: Date.now()
    } : null);

    if (!reading) {
      setLocationError(
        lang === 'hi'
          ? 'GPS सिग्नल की प्रतीक्षा है। कृपया बाहर खुले में जाएं और "My Real GPS" दबाएं।'
          : 'Waiting for GPS fix. Move outdoors and tap "My Real GPS" to acquire signal.'
      );
      return;
    }

    // Section 5: GPS Quality Control (timestamp & accuracy validation)
    const quality = validateGpsQuality(reading);
    if (!quality.isValid) {
      setGpsQualityMessage(
        lang === 'hi'
          ? 'GPS सटीकता कम है। बेहतर GPS सिग्नल के लिए खुले में जाएं और प्रतीक्षा करें।'
          : 'GPS accuracy is low. Move outdoors and wait for a better GPS fix.'
      );
      return;
    }

    const pointToCommit = {
      lat: Math.round(reading.lat * 100000) / 100000,
      lng: Math.round(reading.lng * 100000) / 100000,
      source: isDemoLocation ? 'demo' : 'gps'
    };

    // Commit point
    commitPointToBoundary(pointToCommit);
  };

  // Fallback Confirm Map Selection
  const handleConfirmMapSelection = () => {
    if (!selectedPoint) {
      setLocationError(
        lang === 'hi'
          ? 'कृपया पहले नक्शे पर किसी स्थान पर टैप करें।'
          : 'Please tap a location on the map first.'
      );
      return;
    }

    const pointToCommit = {
      lat: selectedPoint.lat,
      lng: selectedPoint.lng,
      source: 'map_selection'
    };

    // Clean up temporary candidate marker
    if (tempMarkerRef.current && mapInstanceRef.current) {
      try { mapInstanceRef.current.removeLayer(tempMarkerRef.current); } catch (_) {}
      tempMarkerRef.current = null;
    }
    setSelectedPoint(null);

    commitPointToBoundary(pointToCommit);
  };

  // Drag corner to adjust
  const handleCornerDrag = useCallback((cornerIndex, newLat, newLng) => {
    userHasDrawnInSessionRef.current = true;
    const updated = boundaryPoints.map((p, idx) => {
      if (idx === cornerIndex) {
        return {
          ...p,
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

  // Section 10: Undo (Pops last point, updates area & centroid, follow GPS if 0 points remain)
  const handleUndoLastPoint = () => {
    // If a temporary selection pin is pending, cancel it first
    if (selectedPoint || tempMarkerRef.current) {
      setSelectedPoint(null);
      if (tempMarkerRef.current && mapInstanceRef.current) {
        try { mapInstanceRef.current.removeLayer(tempMarkerRef.current); } catch (_) {}
        tempMarkerRef.current = null;
      }
      return;
    }

    if (boundaryPoints.length === 0) return;
    const updated = boundaryPoints.slice(0, -1);
    if (updated.length === 0) {
      userHasDrawnInSessionRef.current = false;
      // Return map to current GPS location if available
      if (gpsPosition && mapInstanceRef.current) {
        mapInstanceRef.current.panTo([gpsPosition.lat, gpsPosition.lng]);
      }
    }
    if (onBoundaryChange) {
      onBoundaryChange(updated);
    }
  };

  // Section 11: Clear / Reset Action (Opens confirmation modal)
  const handleRequestClearBoundary = () => {
    setShowClearConfirm(true);
  };

  // Confirmed Clear / Reset
  const handleConfirmClear = () => {
    setShowClearConfirm(false);
    userHasDrawnInSessionRef.current = false;
    setSelectedPoint(null);
    setLocationError('');
    setGpsQualityMessage('');

    // Purge and remove all markers, temporary markers, and layers from Leaflet map instance
    const map = mapInstanceRef.current;
    if (map) {
      if (tempMarkerRef.current) {
        try { map.removeLayer(tempMarkerRef.current); } catch (_) {}
        tempMarkerRef.current = null;
      }
      cornerMarkersRef.current.forEach(m => {
        try { map.removeLayer(m); } catch (_) {}
      });
      cornerMarkersRef.current = [];
      if (polygonLayerRef.current) {
        try { map.removeLayer(polygonLayerRef.current); } catch (_) {}
        polygonLayerRef.current = null;
      }
      if (polylineLayerRef.current) {
        try { map.removeLayer(polylineLayerRef.current); } catch (_) {}
        polylineLayerRef.current = null;
      }

      // Return map toward current GPS location if available
      if (gpsPosition) {
        map.setView([gpsPosition.lat, gpsPosition.lng], 17);
      }
    }

    if (onBoundaryChange) {
      onBoundaryChange([]);
    }
    if (onClearAll) {
      onClearAll();
    }
  };

  // Center on Me (GPS Re-center Button)
  const handleCenterOnMe = () => {
    if (gpsPosition && mapInstanceRef.current) {
      mapInstanceRef.current.setView([gpsPosition.lat, gpsPosition.lng], 18);
    } else {
      handleFindMyGps();
    }
  };

  // Section 9: Desktop Demo Mode (Use Map Center as Simulated Location)
  const handleUseMapCenterDemoLocation = () => {
    const map = mapInstanceRef.current;
    const center = map ? map.getCenter() : DEFAULT_DEMO_COORDINATE;

    const demoPos = {
      lat: Math.round(center.lat * 100000) / 100000,
      lng: Math.round(center.lng * 100000) / 100000
    };

    latestGpsRef.current = {
      ...demoPos,
      accuracy: 8,
      timestamp: Date.now()
    };

    if (setIsDemoLocation) setIsDemoLocation(true);
    if (onGpsPositionChange) onGpsPositionChange(demoPos);
    if (onGpsStatusChange) onGpsStatusChange('GPS Connected (Demo Center)');
    setLocationError('');
    setGpsQualityMessage('');
  };

  // Real Device Geolocation Request
  const handleFindMyGps = async () => {
    setIsLocating(true);
    setLocationError('');
    setGpsQualityMessage('');
    if (onGpsStatusChange) onGpsStatusChange('Detecting GPS...');

    try {
      const loc = await getDeviceLocation({ timeout: 15000 });
      setIsLocating(false);
      if (setIsDemoLocation) setIsDemoLocation(false);

      latestGpsRef.current = loc;

      if (onGpsPositionChange) {
        onGpsPositionChange({ lat: loc.lat, lng: loc.lng });
      }
      if (onGpsStatusChange) {
        onGpsStatusChange(`GPS Connected (±${Math.round(loc.accuracy || 10)}m)`);
      }

      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([loc.lat, loc.lng], 17);
      }

      // Reverse geocode
      try {
        const geo = await reverseGeocode(loc.lat, loc.lng);
        if (geo?.formatted) {
          setFocusedPlaceName(geo.formatted);
          localStorage.setItem('krishi_farm_coords', JSON.stringify({
            lat: loc.lat,
            lng: loc.lng,
            name: geo.formatted,
            mode: 'gps',
            accuracy: loc.accuracy,
            savedAt: new Date().toISOString()
          }));
        }
      } catch (_) {}
    } catch (err) {
      setIsLocating(false);
      setLocationError(lang === 'hi' ? 'GPS अनुपलब्ध है — कृपया बाहर खुले में जाएं या नक्शे से चुनें।' : 'GPS unavailable — move outdoors or use map selection.');
      if (onGpsStatusChange) onGpsStatusChange('GPS Waiting');
    }
  };

  // Place Search Handler
  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery || !searchQuery.trim()) return;
    setIsSearching(true);
    setLocationError('');
    try {
      const results = await searchPlaces(searchQuery.trim());
      setSearchResults(results);
      if (results.length === 0) {
        setLocationError(lang === 'hi' ? 'कोई स्थान नहीं मिला। कृपया गाँव या जिला पुनः जांचें।' : 'No matching locations found.');
      }
    } catch (err) {
      console.warn('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Select Place Search Result
  const handleSelectSearchResult = (item) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    const name = item.display_name.split(',').slice(0, 3).join(', ');

    setFocusedPlaceName(name);
    setSearchResults([]);
    setSearchQuery('');
    setLocationError('');
    if (setIsDemoLocation) setIsDemoLocation(false);

    if (onGpsPositionChange) {
      onGpsPositionChange({ lat, lng });
    }

    try {
      localStorage.setItem('krishi_farm_coords', JSON.stringify({
        lat,
        lng,
        name,
        mode: 'search',
        savedAt: new Date().toISOString()
      }));
    } catch (_) {}

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 17, { duration: 1.2 });
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
      <div className="p-3 sm:p-3.5 bg-slate-50/95 border-b border-slate-200 space-y-2.5 text-xs">
        
        {/* Row 1: Layer toggle, Land Search Bar, GPS locate, Demo button */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          
          {/* Layer Switcher */}
          <div className="inline-flex rounded-xl bg-slate-200/80 p-0.5 border border-slate-300 shadow-inner shrink-0">
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

          {/* Land / Village Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                id="input-farm-location-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'hi' ? 'गाँव, तहसील, पिन कोड या खेत खोजें...' : 'Search village, tehsil, PIN code, or land...'}
                className="w-full pl-8 pr-16 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="absolute right-12 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="absolute right-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] disabled:opacity-40 transition"
              >
                {isSearching ? '...' : (lang === 'hi' ? 'खोजें' : 'Search')}
              </button>
            </form>

            {/* Live Search Suggestions Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 max-h-60 overflow-y-auto">
                <div className="p-2 bg-slate-50 text-[11px] font-bold text-slate-500 flex items-center justify-between">
                  <span>{lang === 'hi' ? 'खेत का स्थान चुनें:' : 'Select Land Location:'}</span>
                  <button
                    type="button"
                    onClick={() => setSearchResults([])}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {searchResults.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSearchResult(item)}
                    className="w-full text-left px-3.5 py-2 hover:bg-emerald-50 text-xs flex items-center gap-2 transition group"
                  >
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 group-hover:scale-110 transition" />
                    <span className="truncate text-slate-700 font-medium group-hover:text-emerald-900">
                      {item.display_name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* GPS Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Center on Me */}
            <button
              type="button"
              id="btn-center-on-me"
              onClick={handleCenterOnMe}
              className="p-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 shadow-2xs transition active:scale-95"
              title="Center on Me"
            >
              <Crosshair className="w-4 h-4 text-emerald-600" />
            </button>

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
              title="Detect real device GPS"
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Locating...' : (lang === 'hi' ? '📍 मेरा Real GPS' : '📍 My Real GPS')}</span>
            </button>

            {/* Desktop Demo Location Control */}
            <button
              type="button"
              id="btn-desktop-demo-gps"
              onClick={handleUseMapCenterDemoLocation}
              className="px-2.5 py-1.5 rounded-xl font-bold border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs flex items-center gap-1.5 transition active:scale-95 shadow-2xs"
              title="Use current map center as demo location for desktop testing"
            >
              <span>🧪</span>
              <span className="hidden sm:inline">Use Map Center as Demo</span>
            </button>
          </div>
        </div>

        {/* Row 2: Focused Land Location Status Banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
            <span className="font-bold text-emerald-950 truncate">
              {lang === 'hi' ? 'खेत का स्थान:' : 'Focused Field:'}{' '}
              <span className="font-semibold text-emerald-800">
                {focusedPlaceName || (lang === 'hi' ? 'गाँव खोजें या "मेरा Real GPS" दबाएं' : 'Search village above or tap "My Real GPS"')}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[11px] font-bold text-emerald-700">
              {boundaryPoints.length === 0 
                ? (lang === 'hi' ? '👉 Point 1 के लिए "Mark My Location" या नक्शे पर टैप करें' : '👉 Tap "Mark My Location" or click map for Point 1')
                : `🌾 ${boundaryPoints.length} ${boundaryPoints.length === 1 ? 'Point' : 'Points'} mapped`}
            </span>
          </div>
        </div>
      </div>

      {/* Desktop Demo Mode Disclaimer Banner (Section 9) */}
      {isDemoLocation && (
        <div className="px-4 py-2 bg-amber-100 border-b border-amber-300 text-amber-950 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <span className="font-medium">
              Desktop demo location enabled. This is NOT a real GPS fix. Use Android/iOS for real field mapping.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (setIsDemoLocation) setIsDemoLocation(false);
              handleFindMyGps();
            }}
            className="text-[11px] font-bold underline text-amber-900 hover:text-amber-950 shrink-0"
          >
            Switch to Real GPS
          </button>
        </div>
      )}

      {/* GPS Quality Warning Banner (Section 5) */}
      {gpsQualityMessage && (
        <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-300 text-amber-950 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-semibold">{gpsQualityMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setGpsQualityMessage('')}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* GPS Error Diagnostics Banner */}
      {locationError && (
        <div className="px-4 py-2.5 bg-rose-50 border-b border-rose-200 text-rose-950 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{locationError}</span>
          </div>
          <button
            type="button"
            onClick={handleUseMapCenterDemoLocation}
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
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-2 max-w-[260px]">
          
          {/* Section 7: Primary Action Button - MARK MY LOCATION (Live GPS) */}
          <button
            type="button"
            id="btn-mark-my-location-gps"
            onClick={handleMarkMyLocationGps}
            className="px-4 py-2.5 rounded-2xl font-extrabold text-xs shadow-xl border border-emerald-400 bg-gradient-to-r from-emerald-600 to-agri-700 hover:from-emerald-700 hover:to-agri-800 text-white flex items-center gap-2.5 transition active:scale-95 backdrop-blur-xs"
            title="Mark current GPS position as field corner"
          >
            <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Navigation className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="text-left">
              <div className="font-black text-[13px] tracking-tight">
                {lang === 'hi' 
                  ? `📍 CORNER ${boundaryPoints.length + 1} (GPS)` 
                  : `📍 MARK CORNER ${boundaryPoints.length + 1}`}
              </div>
              <div className="text-[10px] text-emerald-100 font-medium">
                {boundaryPoints.length === 0
                  ? (lang === 'hi' ? 'Point 1 से शुरू करें • Phone GPS' : 'Start from Point 1 • Phone GPS')
                  : (lang === 'hi' ? `Point ${boundaryPoints.length + 1} • Phone GPS` : `Point ${boundaryPoints.length + 1} • Phone GPS`)}
              </div>
            </div>
          </button>

          {/* Quick Start Fresh / Reset to Point 1 Button */}
          {boundaryPoints.length > 0 && (
            <button
              type="button"
              id="btn-start-fresh-point1"
              onClick={handleRequestClearBoundary}
              className="px-3 py-1.5 rounded-xl font-bold text-xs shadow-md border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 flex items-center justify-center gap-1.5 transition active:scale-95"
              title="Reset mapping and start fresh from Point 1"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
              <span>{lang === 'hi' ? '🔄 1 से दोबारा शुरू करें' : '🔄 Reset to Point 1'}</span>
            </button>
          )}

          {/* Action Row: Undo & Clear */}
          <div className="flex items-center gap-1.5">
            {/* Undo Last Point */}
            {boundaryPoints.length > 0 && (
              <button
                type="button"
                id="btn-undo-point"
                onClick={handleUndoLastPoint}
                className="flex-1 px-2.5 py-1.5 rounded-xl bg-white/95 hover:bg-white text-slate-700 font-bold text-xs shadow-md border border-slate-200 flex items-center justify-center gap-1 transition active:scale-95 backdrop-blur-xs"
                title="Undo last corner"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Undo</span>
              </button>
            )}

            {/* Clear All Boundary */}
            {boundaryPoints.length > 0 && (
              <button
                type="button"
                id="btn-clear-boundary"
                onClick={handleRequestClearBoundary}
                className="flex-1 px-2.5 py-1.5 rounded-xl bg-rose-50/95 hover:bg-rose-100 text-rose-700 font-bold text-xs shadow-md border border-rose-200 flex items-center justify-center gap-1 transition active:scale-95 backdrop-blur-xs"
                title="Clear current mapping session"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Zoom & Bounds Control (Bottom Right) */}
        <div className="absolute bottom-4 right-3 z-20 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={handleCenterOnMe}
            className="w-8 h-8 rounded-xl bg-white text-emerald-700 hover:bg-slate-100 font-black text-sm shadow-md border border-slate-200 flex items-center justify-center transition active:scale-95"
            title="Center on GPS"
          >
            <Crosshair className="w-4 h-4" />
          </button>
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
        <div className="absolute top-3 left-3 z-20 bg-slate-900/90 backdrop-blur-md text-white text-[11px] font-medium px-3.5 py-2 rounded-xl border border-slate-700/60 shadow-lg flex items-center gap-2 max-w-[88%] sm:max-w-xs pointer-events-none">
          <span className="text-emerald-400 font-bold shrink-0">🚶‍♂️</span>
          <span className="truncate">
            {boundaryPoints.length === 0 && (lang === 'hi' ? 'Point 1: कोने पर खड़े हों & "MARK CORNER 1" दबाएं या नक्शे पर टैप करें' : 'Point 1: Stand at corner & tap "MARK CORNER 1" or click map')}
            {boundaryPoints.length === 1 && (lang === 'hi' ? 'Point 2: अगले कोने पर जाएं & "MARK CORNER 2" दबाएं या नक्शे पर टैप करें' : 'Point 2: Walk to next corner & tap "MARK CORNER 2" or click map')}
            {boundaryPoints.length === 2 && (lang === 'hi' ? 'Point 3: तीसरे कोने पर जाएं और सीमा बंद करें' : 'Point 3: Walk to 3rd corner to enclose field polygon')}
            {boundaryPoints.length >= 3 && (lang === 'hi' ? `✓ ${boundaryPoints.length} कोने चिह्नित। सीमा सुरक्षित करने के लिए Save दबाएं।` : `✓ ${boundaryPoints.length} corners mapped. Boundary polygon active.`)}
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
              <span className="text-emerald-300 font-bold">GPS ±{Math.round(gpsAccuracy)}m</span>
            </>
          )}
        </div>
      </div>

      {/* Section 11: Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-sm">Clear Boundary?</h4>
                <p className="text-xs text-slate-500">Are you sure you want to clear the boundary?</p>
              </div>
            </div>
            <p className="text-xs text-slate-600">
              This will remove all {boundaryPoints.length} corners in this session. Saved farms will NOT be deleted.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                className="px-4 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition"
              >
                Clear Boundary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Footer Bar: Corner count and instructions */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${boundaryPoints.length >= 3 ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
          <span className="font-extrabold text-slate-800">
            {boundaryPoints.length === 0 ? '0 Corners Marked (Ready for Point 1)' : `${boundaryPoints.length} ${boundaryPoints.length === 1 ? 'Corner' : 'Corners'} Marked`}
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-600">
            {boundaryPoints.length === 0 && 'Walk along boundary corners and tap "MARK MY LOCATION"'}
            {boundaryPoints.length === 1 && 'Walk to next corner and mark Point 2'}
            {boundaryPoints.length === 2 && 'Walk to 3rd corner to generate closed polygon'}
            {boundaryPoints.length >= 3 && '✓ Closed Field Polygon Generated'}
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
