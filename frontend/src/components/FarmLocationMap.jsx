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
  Info
} from 'lucide-react';
import axios from 'axios';

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
  onLocationSelect 
}) {
  const { lang, t } = useLanguage();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [coords, setCoords] = useState({ lat: initialLat, lng: initialLng });
  const [locationName, setLocationName] = useState(initialName);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
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
      await reverseGeocode(pos.lat, pos.lng);
    });

    // Handle map click to reposition pin
    map.on('click', async (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      setCoords({ lat, lng });
      await reverseGeocode(lat, lng);
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

  // Reverse Geocoding via free OpenStreetMap Nominatim
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
        { timeout: 5000 }
      );
      if (res.data && res.data.display_name) {
        const addr = res.data.address || {};
        const village = addr.village || addr.suburb || addr.town || addr.city || addr.county || 'Farm Location';
        const district = addr.state_district || addr.county || addr.state || '';
        const formatted = `${village}${district ? ', ' + district : ''}`;
        setLocationName(formatted);
        updateParent(lat, lng, formatted);
        markerRef.current?.bindPopup(`<b>🌱 ${formatted}</b><br><span style="font-size:11px;">Lat: ${lat.toFixed(4)}, Lon: ${lng.toFixed(4)}</span>`).openPopup();
      }
    } catch (e) {
      console.warn('Reverse geocode fallback:', e.message);
      const fallback = `Field Location (${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E)`;
      setLocationName(fallback);
      updateParent(lat, lng, fallback);
    }
  };

  // Search places via free OpenStreetMap Nominatim
  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', India')}&limit=5`,
        { timeout: 6000 }
      );
      setSearchResults(res.data || []);
    } catch (err) {
      console.warn('Place search error:', err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (item) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    const name = item.display_name.split(',').slice(0, 2).join(', ');

    setCoords({ lat, lng });
    setLocationName(name);
    setSearchResults([]);
    setSearchQuery('');

    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([lat, lng], 13);
      markerRef.current.setLatLng([lat, lng]);
      markerRef.current.bindPopup(`<b>🌱 ${name}</b><br><span style="font-size:11px;">Lat: ${lat.toFixed(4)}, Lon: ${lng.toFixed(4)}</span>`).openPopup();
    }

    updateParent(lat, lng, name);
  };

  // Current GPS Location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert(lang === 'hi' ? 'आपके ब्राउज़र में GPS सुविधा उपलब्ध नहीं है।' : 'Geolocation not supported by this browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([lat, lng], 14);
          markerRef.current.setLatLng([lat, lng]);
        }

        await reverseGeocode(lat, lng);
        setIsLocating(false);
      },
      (err) => {
        console.warn('GPS location error:', err.message);
        setIsLocating(false);
        alert(lang === 'hi' ? 'कृपया अपने फोन या ब्राउज़र में लोकेशन अनुमति (GPS) चालू करें।' : 'Could not access GPS. Please allow location permissions.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const updateParent = (lat, lng, name) => {
    try {
      localStorage.setItem('krishi_farm_coords', JSON.stringify({ lat, lng, name }));
    } catch (_) {}

    if (onLocationSelect) {
      onLocationSelect({ lat, lng, locationName: name });
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-3 p-4">
      {/* Top Header & Search Controls */}
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
              ? 'नक्शे पर टैप करें या अपना गाँव खोजें — मौसम अपने-आप इस स्थान का दिखेगा'
              : 'Tap map or search village to pin farm location — real-time weather updates automatically'}
          </p>
        </div>

        {/* Current GPS Button */}
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isLocating}
          className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 shrink-0 shadow-2xs"
        >
          <Navigation className={`w-3.5 h-3.5 text-emerald-600 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? (lang === 'hi' ? 'GPS खोज रहा है...' : 'Locating GPS...') : (lang === 'hi' ? '📍 वर्तमान GPS स्थान' : '📍 Current GPS')}</span>
        </button>
      </div>

      {/* Place Search Input */}
      <form onSubmit={handleSearch} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'hi' ? 'गाँव, तहसील, मंडी या जिला खोजें (उदा. नासिक, बारामती)...' : 'Search village, mandi, district (e.g. Nashik, Baramati)...'}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
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

        {/* Coordinates Overlay Badge */}
        <div className="absolute bottom-2 left-2 z-20 bg-slate-900/85 backdrop-blur-md text-white text-[11px] font-mono px-2.5 py-1 rounded-lg border border-slate-700/60 shadow-md flex items-center gap-2">
          <span className="text-emerald-400 font-bold">📍 Lat: {coords.lat.toFixed(4)}°</span>
          <span className="text-slate-500">•</span>
          <span className="text-emerald-400 font-bold">Lon: {coords.lng.toFixed(4)}°</span>
        </div>

        {savedSuccess && (
          <div className="absolute top-2 right-2 z-20 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-lg shadow-lg flex items-center gap-1.5 animate-bounce">
            <Check className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'स्थान अपडेट हो गया!' : 'Location Updated!'}</span>
          </div>
        )}
      </div>

      {/* Selected Location Summary Bar */}
      <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-base">🏡</span>
          <div>
            <span className="font-extrabold text-emerald-950 block">{locationName}</span>
            <span className="text-[10px] text-emerald-700">OpenStreetMap Coordinates: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</span>
          </div>
        </div>

        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-white/80 border border-emerald-300 px-2 py-0.5 rounded-md">
          🟢 Open-Meteo Synced
        </span>
      </div>
    </div>
  );
}
