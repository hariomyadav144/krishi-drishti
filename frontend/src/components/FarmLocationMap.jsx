import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLanguage } from '../context/LanguageContext';
import { 
  MapPin, 
  Search, 
  Navigation, 
  Check, 
  Compass, 
  RefreshCw,
  Layers,
  AlertTriangle,
  Info
} from 'lucide-react';
import { reverseGeocode, searchPlaces } from '../services/geocodingService';

// Custom SVG Farm Pin Icon for Leaflet
const createFarmIcon = () => {
  return L.divIcon({
    className: 'custom-farm-pin',
    html: `
      <div style="
        background: linear-gradient(135deg, #10b981, #047857);
        width: 38px;
        height: 38px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 14px rgba(0,0,0,0.35);
        border: 2.5px solid #ffffff;
      ">
        <span style="transform: rotate(45deg); font-size: 18px;">🌱</span>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38],
  });
};

export default function FarmLocationMap({ 
  initialLat = 20.00, 
  initialLng = 73.78, 
  initialName = 'Nashik, Maharashtra',
  activeCoords = null,
  onLocationSelect 
}) {
  const { lang, t } = useLanguage();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [coords, setCoords] = useState({ lat: initialLat, lng: initialLng });
  const [locationName, setLocationName] = useState(initialName);
  const [locationMode, setLocationMode] = useState('default'); // 'gps' | 'search' | 'pinned' | 'default'
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');
  const [locationError, setLocationError] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    // Read stored coords if available
    let startLat = initialLat;
    let startLng = initialLng;
    let startName = initialName;

    try {
      const stored = localStorage.getItem('krishi_farm_coords');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.lat && parsed.lng) {
          startLat = parsed.lat;
          startLng = parsed.lng;
          startName = parsed.name || startName;
          setCoords({ lat: startLat, lng: startLng });
          setLocationName(startName);
        }
      }
    } catch (_) {}

    const map = L.map(mapContainerRef.current, {
      center: [startLat, startLng],
      zoom: 12,
      zoomControl: true,
    });

    // OpenStreetMap Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Initial Marker
    const marker = L.marker([startLat, startLng], {
      icon: createFarmIcon(),
      draggable: true,
    }).addTo(map);

    marker.bindPopup(`<b>🌱 ${startName}</b><br><span style="font-size:11px;">Lat: ${startLat.toFixed(4)}, Lon: ${startLng.toFixed(4)}</span>`);

    // Handle marker drag
    marker.on('dragend', async () => {
      const pos = marker.getLatLng();
      setCoords({ lat: pos.lat, lng: pos.lng });
      setLocationMode('pinned');
      setGpsAccuracy(null);
      await handleReverseGeocode(pos.lat, pos.lng, 'pinned');
    });

    // Handle map click to reposition pin
    map.on('click', async (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      setCoords({ lat, lng });
      setLocationMode('pinned');
      setGpsAccuracy(null);
      await handleReverseGeocode(lat, lng, 'pinned');
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    // Invalidate size on mount to ensure proper rendering inside dynamic containers
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map if external activeCoords prop changes
  useEffect(() => {
    if (activeCoords && activeCoords.lat && activeCoords.lng && mapInstanceRef.current && markerRef.current) {
      const { lat, lng, locationName: name, mode, accuracy } = activeCoords;
      setCoords({ lat, lng });
      if (name) setLocationName(name);
      if (mode) setLocationMode(mode);
      if (accuracy !== undefined) setGpsAccuracy(accuracy);

      mapInstanceRef.current.setView([lat, lng], 13);
      markerRef.current.setLatLng([lat, lng]);
      markerRef.current.bindPopup(`<b>🌱 ${name || 'Selected Location'}</b><br><span style="font-size:11px;">Lat: ${lat.toFixed(4)}, Lon: ${lng.toFixed(4)}</span>`).openPopup();
    }
  }, [activeCoords]);

  // Reverse Geocoding with real coordinates
  const handleReverseGeocode = async (lat, lng, mode = 'pinned', accuracy = null) => {
    try {
      const geo = await reverseGeocode(lat, lng);
      const formatted = geo.formatted;
      setLocationName(formatted);
      updateParent(lat, lng, formatted, mode, accuracy);
      markerRef.current?.bindPopup(`<b>🌱 ${formatted}</b><br><span style="font-size:11px;">Lat: ${lat.toFixed(4)}, Lon: ${lng.toFixed(4)}</span>`).openPopup();
    } catch (e) {
      console.warn('Reverse geocode failed:', e.message);
      const fallback = `Field Location (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`;
      setLocationName(fallback);
      updateParent(lat, lng, fallback, mode, accuracy);
    }
  };

  // Search places via Nominatim
  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setLocationError('');
    try {
      const results = await searchPlaces(searchQuery);
      setSearchResults(results || []);
    } catch (err) {
      console.warn('Place search error:', err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (item) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    const name = item.display_name.split(',').slice(0, 3).join(', ');

    setCoords({ lat, lng });
    setLocationName(name);
    setLocationMode('search');
    setGpsAccuracy(null);
    setSearchResults([]);
    setSearchQuery('');
    setLocationError('');

    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([lat, lng], 13);
      markerRef.current.setLatLng([lat, lng]);
      markerRef.current.bindPopup(`<b>🌱 ${name}</b><br><span style="font-size:11px;">Lat: ${lat.toFixed(4)}, Lon: ${lng.toFixed(4)}</span>`).openPopup();
    }

    updateParent(lat, lng, name, 'search', null);
  };

  // True Browser Geolocation Flow
  const handleGetCurrentLocation = () => {
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError(
        lang === 'hi'
          ? 'आपके ब्राउज़र में GPS सुविधा उपलब्ध नहीं है।'
          : 'Geolocation is not supported by your browser.'
      );
      return;
    }

    setIsLocating(true);
    setLocationStatus(
      lang === 'hi' 
        ? 'वर्तमान GPS स्थान खोजा जा रहा है...' 
        : 'Detecting your current location...'
    );

    console.log('[GPS REQUEST STARTED]');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy);

        console.log('[GPS SUCCESS]');
        console.log('latitude:', latitude);
        console.log('longitude:', longitude);
        console.log('accuracy:', accuracy, 'meters');

        // Immediately use real coordinates for reverse geocoding
        console.log('[REVERSE GEOCODING] latitude:', latitude, 'longitude:', longitude);
        const geo = await reverseGeocode(latitude, longitude);
        const resolvedName = geo.formatted;

        console.log('[MAP UPDATE] latitude:', latitude, 'longitude:', longitude);
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 14);
          markerRef.current.setLatLng([latitude, longitude]);
          markerRef.current.bindPopup(
            `<b>🌱 ${resolvedName}</b><br><span style="font-size:11px;">📍 Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}<br>Accuracy: ±${accuracy}m</span>`
          ).openPopup();
        }

        setCoords({ lat: latitude, lng: longitude });
        setLocationName(resolvedName);
        setLocationMode('gps');
        setGpsAccuracy(accuracy);
        setIsLocating(false);
        setLocationStatus('');
        setLocationError('');

        // Notify parent with freshly received coordinates directly
        console.log('[WEATHER REQUEST] latitude:', latitude, 'longitude:', longitude);
        updateParent(latitude, longitude, resolvedName, 'gps', accuracy);
      },
      (err) => {
        console.warn('[GPS ERROR] code:', err.code, 'message:', err.message);
        setIsLocating(false);
        setLocationStatus('');

        let userMessage = '';
        if (err.code === 1) { // PERMISSION_DENIED
          userMessage = lang === 'hi'
            ? 'लोकेशन एक्सेस बंद है। कृपया विंडोज़ सेटिंग्स में "Location Services" चालू करें और इस ब्राउज़र को अनुमति दें, फिर पुनः प्रयास करें।'
            : 'Location access is disabled. Please enable Location Services in Windows and allow location access for this browser, then try again.';
        } else if (err.code === 2) { // POSITION_UNAVAILABLE
          userMessage = lang === 'hi'
            ? 'वर्तमान स्थान नहीं मिल सका। कृपया नेटवर्क कनेक्शन जांचें या विंडोज़ लोकेशन चालू कर पुनः प्रयास करें।'
            : 'Unable to detect your current location. Please enable Windows Location Services and check your network connection, then try again.';
        } else if (err.code === 3) { // TIMEOUT
          userMessage = lang === 'hi'
            ? 'लोकेशन का समय समाप्त (Timeout) हो गया। कृपया "पुनः प्रयास करें" दबाएं।'
            : 'Location detection timed out. Please click Try Again.';
        } else {
          userMessage = err.message || 'Unable to detect location.';
        }

        setLocationError(userMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0 // MUST be 0 to flush stale cached coordinates
      }
    );
  };

  const updateParent = (lat, lng, name, mode = 'pinned', accuracy = null) => {
    try {
      localStorage.setItem('krishi_farm_coords', JSON.stringify({ 
        lat, 
        lng, 
        name, 
        mode, 
        accuracy,
        timestamp: Date.now() 
      }));
    } catch (_) {}

    if (onLocationSelect) {
      onLocationSelect({ 
        lat, 
        lng, 
        locationName: name, 
        mode, 
        accuracy 
      });
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-3 p-4">
      {/* Top Header & GPS Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-black text-slate-900">
              {lang === 'hi' ? 'खेत का स्थान एवं ओपनस्ट्रीटमैप (OpenStreetMap)' : 'Farm Location & OpenStreetMap'}
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {lang === 'hi' 
              ? 'GPS से असली स्थान पाएं या गाँव खोजें — मौसम अपने-आप इस स्थान का अपडेट होगा'
              : 'Detect true GPS or search village to pin farm location — live weather updates automatically'}
          </p>
        </div>

        {/* Current GPS Button (Calls real navigator.geolocation with maximumAge: 0) */}
        <button
          type="button"
          id="btn-use-my-current-gps"
          onClick={handleGetCurrentLocation}
          disabled={isLocating}
          className={`w-full sm:w-auto px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 shrink-0 shadow-xs ${
            isLocating 
              ? 'bg-emerald-100 text-emerald-900 border-emerald-400 animate-pulse'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
          }`}
        >
          <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
          <span>
            {isLocating 
              ? (lang === 'hi' ? 'GPS खोज रहा है...' : 'Detecting your current location...') 
              : (lang === 'hi' ? '📍 वर्तमान GPS स्थान (Use GPS)' : '📍 Use My Current GPS')}
          </span>
        </button>
      </div>

      {/* Detecting Location Banner */}
      {isLocating && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-medium flex items-center gap-2.5 shadow-2xs animate-pulse">
          <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin shrink-0" />
          <span>{locationStatus || (lang === 'hi' ? 'वर्तमान GPS स्थान खोजा जा रहा है...' : 'Detecting your current location...')}</span>
        </div>
      )}

      {/* GPS Error Banner (Never silently switches to Lucknow) */}
      {locationError && !isLocating && (
        <div className="p-3.5 bg-amber-50 border border-amber-300 text-amber-950 rounded-2xl text-xs font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{locationError}</span>
          </div>
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 self-start sm:self-auto flex items-center gap-1.5 transition active:scale-95 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'पुनः प्रयास करें' : 'Try Again'}</span>
          </button>
        </div>
      )}

      {/* Place Search Input */}
      <form onSubmit={handleSearch} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'hi' ? 'गाँव, तहसील, मंडी या जिला खोजें (उदा. सहजनवां, गोरखपुर, नासिक)...' : 'Search village, mandi, district (e.g. Sahjanwa, Gorakhpur, Nashik)...'}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
          >
            {isSearching ? '...' : (lang === 'hi' ? 'खोजें' : 'Search')}
          </button>
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 text-xs">
            {searchResults.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => selectSearchResult(item)}
                className="w-full px-3 py-2 text-left hover:bg-emerald-50 text-slate-700 font-medium flex items-center gap-2 transition"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">{item.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Map Display Viewport */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
        <div 
          ref={mapContainerRef} 
          className="w-full h-56 sm:h-64 z-10"
        />

        {/* Coordinates & Accuracy Overlay Badge */}
        <div className="absolute bottom-2 left-2 z-20 bg-slate-900/90 backdrop-blur-md text-white text-[11px] font-mono px-3 py-1.5 rounded-xl border border-slate-700/70 shadow-md flex items-center gap-2 flex-wrap">
          <span className="text-emerald-400 font-bold">📍 Lat: {coords.lat.toFixed(4)}°</span>
          <span className="text-slate-500">•</span>
          <span className="text-emerald-400 font-bold">Lon: {coords.lng.toFixed(4)}°</span>
          {gpsAccuracy && (
            <>
              <span className="text-slate-500">•</span>
              <span className={`font-bold ${gpsAccuracy <= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                ±{gpsAccuracy}m {gpsAccuracy <= 100 ? '(GPS)' : '(Network)'}
              </span>
            </>
          )}
        </div>

        {savedSuccess && (
          <div className="absolute top-2 right-2 z-20 bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 animate-bounce">
            <Check className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'स्थान अपडेट हो गया!' : 'Location Updated!'}</span>
          </div>
        )}
      </div>

      {/* Selected Location Summary Bar */}
      <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">🏡</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-emerald-950 block">{locationName}</span>
              {locationMode === 'gps' && (
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow-2xs">
                  ✓ Verified GPS
                </span>
              )}
              {locationMode === 'search' && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-300 px-2 py-0.5 rounded-full">
                  🔍 Manual Search
                </span>
              )}
              {locationMode === 'pinned' && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full">
                  📌 Pinned Point
                </span>
              )}
            </div>
            <span className="text-[10px] text-emerald-700">
              Coordinates: {coords.lat.toFixed(4)}°N, {coords.lng.toFixed(4)}°E {gpsAccuracy ? `• Accuracy: ±${gpsAccuracy}m` : ''}
            </span>
          </div>
        </div>

        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-white/90 border border-emerald-300 px-2.5 py-1 rounded-lg shadow-2xs">
          🟢 Open-Meteo Synced
        </span>
      </div>
    </div>
  );
}
