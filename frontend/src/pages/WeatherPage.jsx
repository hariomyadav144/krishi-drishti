import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import { fetchOpenMeteoWeather } from '../services/weatherService';
import { reverseGeocode } from '../services/geocodingService';
import FarmLocationMap from '../components/FarmLocationMap';
import { 
  CloudSun, 
  CloudRain, 
  Sun, 
  Droplets, 
  Wind, 
  Thermometer, 
  AlertCircle, 
  ShieldCheck, 
  RefreshCw,
  MapPin,
  Navigation,
  Sparkles
} from 'lucide-react';

export default function WeatherPage() {
  const { lang, t } = useLanguage();
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(true);

  // Active Location state for GPS / Search / Pinned
  const [activeLocationInfo, setActiveLocationInfo] = useState(null);
  const [isGpsLocating, setIsGpsLocating] = useState(false);
  const [gpsError, setGpsError] = useState('');

  const fetchWeather = async (customLat, customLng, customName, mode = null, accuracy = null) => {
    try {
      setLoading(true);

      let lat = customLat;
      let lng = customLng;
      let name = customName;

      // Only check stored historical coordinates if customLat/customLng are not passed
      if (lat === undefined || lat === null || lng === undefined || lng === null) {
        try {
          const stored = localStorage.getItem('krishi_farm_coords');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.lat && parsed.lng) {
              lat = parsed.lat;
              lng = parsed.lng;
              name = parsed.name || name;
              if (parsed.mode) mode = parsed.mode;
              if (parsed.accuracy !== undefined) accuracy = parsed.accuracy;
            }
          }
        } catch (_) {}
      }

      lat = lat || 20.00;
      lng = lng || 73.78;
      name = name || 'Nashik, Maharashtra';

      console.log(`[WEATHER REQUEST] latitude: ${lat}, longitude: ${lng}, name: ${name}`);

      try {
        const liveData = await fetchOpenMeteoWeather(lat, lng, name);
        setWeatherData(liveData);
        setActiveLocationInfo({ lat, lng, name, mode, accuracy });
      } catch (err) {
        console.warn('Direct Open-Meteo call fallback, querying api:', err);
        const res = await api.get('/weather', { params: { latitude: lat, longitude: lng } });
        if (res.data?.success) {
          setWeatherData(res.data.data);
          setActiveLocationInfo({ lat, lng, name, mode, accuracy });
        }
      }
    } catch (e) {
      console.error('Failed to load weather:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  // Location select handler called from FarmLocationMap
  const handleLocationSelect = ({ lat, lng, locationName, mode, accuracy }) => {
    fetchWeather(lat, lng, locationName, mode, accuracy);
  };

  // Dedicated "Use My Current GPS" Trigger (Strictly maximumAge: 0, high accuracy)
  const handleTriggerGPS = () => {
    setGpsError('');

    if (!navigator.geolocation) {
      setGpsError(
        lang === 'hi'
          ? 'आपके ब्राउज़र में GPS सुविधा उपलब्ध नहीं है।'
          : 'Geolocation is not supported by your browser.'
      );
      return;
    }

    setIsGpsLocating(true);
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

        console.log('[REVERSE GEOCODING] latitude:', latitude, 'longitude:', longitude);
        const geo = await reverseGeocode(latitude, longitude);
        const resolvedName = geo.formatted;

        console.log('[WEATHER REQUEST] latitude:', latitude, 'longitude:', longitude);
        setIsGpsLocating(false);
        setGpsError('');

        // Store to localStorage tagged as GPS
        try {
          localStorage.setItem('krishi_farm_coords', JSON.stringify({
            lat: latitude,
            lng: longitude,
            name: resolvedName,
            mode: 'gps',
            accuracy,
            timestamp: Date.now()
          }));
        } catch (_) {}

        // Immediately fetch weather for the freshly resolved GPS coordinates
        fetchWeather(latitude, longitude, resolvedName, 'gps', accuracy);
      },
      (err) => {
        console.warn('[GPS ERROR] code:', err.code, 'message:', err.message);
        setIsGpsLocating(false);

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

        setGpsError(userMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0 // MUST be 0 to flush stale cached coordinates
      }
    );
  };

  if (loading && !weatherData) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4">
        <div className="h-32 bg-slate-200 animate-pulse rounded-2xl"></div>
        <div className="h-64 bg-slate-200 animate-pulse rounded-2xl"></div>
      </div>
    );
  }

  const { current, forecast, smartAlerts, location } = weatherData || {};

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 pb-24 md:pb-10">
      
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900">{t('weather.title')}</h2>
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Open-Meteo API
            </span>
          </div>

          {/* Location details with mode badges */}
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <p className="text-xs text-slate-700 font-bold flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                {activeLocationInfo?.name || (typeof location === 'object' && location !== null ? `${location.district || ''}, ${location.state || ''}` : (location || 'Nashik, Maharashtra'))}
              </span>
            </p>

            {activeLocationInfo?.mode === 'gps' && (
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow-2xs">
                ✓ Verified GPS {activeLocationInfo.accuracy ? `(±${activeLocationInfo.accuracy}m)` : ''}
              </span>
            )}

            {activeLocationInfo?.mode === 'search' && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-300 px-2 py-0.5 rounded-full">
                🔍 Manual Search
              </span>
            )}

            {activeLocationInfo?.lat && activeLocationInfo?.lng && (
              <span className="text-[10px] text-slate-500 font-mono">
                ({activeLocationInfo.lat.toFixed(4)}°N, {activeLocationInfo.lng.toFixed(4)}°E)
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Prominent "Use My Current GPS" Button */}
          <button
            type="button"
            id="weather-page-gps-btn"
            onClick={handleTriggerGPS}
            disabled={isGpsLocating}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 shadow-2xs active:scale-95 ${
              isGpsLocating
                ? 'bg-emerald-100 text-emerald-900 border-emerald-400 animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
            }`}
          >
            <Navigation className={`w-3.5 h-3.5 ${isGpsLocating ? 'animate-spin' : ''}`} />
            <span>
              {isGpsLocating 
                ? (lang === 'hi' ? 'GPS खोज रहा है...' : 'Detecting your current location...') 
                : (lang === 'hi' ? '📍 वर्तमान GPS स्थान' : '📍 Use My Current GPS')}
            </span>
          </button>

          <button
            onClick={() => setShowMap(!showMap)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
              showMap 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>{showMap ? (lang === 'hi' ? 'नक्शा छिपाएं' : 'Hide Map') : (lang === 'hi' ? 'नक्शा देखें / स्थान बदलें' : 'View / Change Map')}</span>
          </button>

          <button
            onClick={() => fetchWeather(activeLocationInfo?.lat, activeLocationInfo?.lng, activeLocationInfo?.name, activeLocationInfo?.mode, activeLocationInfo?.accuracy)}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            title="Refresh Live Weather"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Detecting Location Banner */}
      {isGpsLocating && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-medium flex items-center gap-2.5 shadow-2xs animate-pulse">
          <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin shrink-0" />
          <span>{lang === 'hi' ? 'वर्तमान GPS स्थान खोजा जा रहा है...' : 'Detecting your current location...'}</span>
        </div>
      )}

      {/* GPS Error Banner (Never silently switches to Lucknow) */}
      {gpsError && !isGpsLocating && (
        <div className="p-3.5 bg-amber-50 border border-amber-300 text-amber-950 rounded-2xl text-xs font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{gpsError}</span>
          </div>
          <button
            type="button"
            onClick={handleTriggerGPS}
            className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 self-start sm:self-auto flex items-center gap-1.5 transition active:scale-95 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'पुनः प्रयास करें' : 'Try Again'}</span>
          </button>
        </div>
      )}

      {/* Free OpenStreetMap Location Picker & Viewer */}
      {showMap && (
        <FarmLocationMap 
          onLocationSelect={handleLocationSelect}
          initialLat={activeLocationInfo?.lat || 20.00}
          initialLng={activeLocationInfo?.lng || 73.78}
          initialName={activeLocationInfo?.name || (typeof location === 'string' ? location : 'Nashik, Maharashtra')}
          activeCoords={activeLocationInfo}
        />
      )}

      {/* Current Agro-Weather Big Card */}
      {current && (
        <div className="bg-gradient-to-br from-sky-600 via-sky-700 to-indigo-800 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex items-start justify-between relative z-10">
            <div>
              <span className="text-xs uppercase tracking-widest font-extrabold text-sky-200 bg-white/10 px-3 py-1 rounded-full backdrop-blur-xs">
                Live Agro-Climate
              </span>
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-5xl sm:text-6xl font-black tracking-tight">{current.temp}°</span>
                <span className="text-xl text-sky-200 font-semibold">C</span>
              </div>
              <p className="text-base font-bold text-sky-100 capitalize mt-1">
                {current.condition}
              </p>
              <p className="text-xs text-sky-200/80">
                Feels like {current.feelsLike}°C • {current.airQuality}
              </p>
            </div>

            <div className="p-4 bg-white/15 backdrop-blur-md rounded-3xl border border-white/20">
              <Sun className="w-16 h-16 text-yellow-300 animate-spin-slow" />
            </div>
          </div>

          {/* Environmental Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 relative z-10 pt-4 border-t border-white/15">
            <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl">
              <div className="flex items-center gap-1.5 text-sky-200 text-xs mb-1">
                <Droplets className="w-4 h-4 text-sky-300" />
                <span>{t('weather.humidity')}</span>
              </div>
              <span className="text-lg font-bold">{current.humidity}%</span>
            </div>

            <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl">
              <div className="flex items-center gap-1.5 text-sky-200 text-xs mb-1">
                <Wind className="w-4 h-4 text-teal-300" />
                <span>{t('weather.windSpeed')}</span>
              </div>
              <span className="text-lg font-bold">{current.windSpeed} km/h</span>
            </div>

            <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl">
              <div className="flex items-center gap-1.5 text-sky-200 text-xs mb-1">
                <CloudRain className="w-4 h-4 text-indigo-300" />
                <span>{t('weather.rainProb')}</span>
              </div>
              <span className="text-lg font-bold">{current.rainProbability}%</span>
            </div>

            <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl">
              <div className="flex items-center gap-1.5 text-sky-200 text-xs mb-1">
                <Thermometer className="w-4 h-4 text-amber-300" />
                <span>UV Index</span>
              </div>
              <span className="text-lg font-bold">{current.uvIndex || 'Moderate'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Smart Farming Weather Alerts */}
      {smartAlerts && smartAlerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>{t('weather.alerts')}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {smartAlerts.map((alert, idx) => (
              <div 
                key={idx}
                className={`p-4 rounded-2xl border transition shadow-xs flex items-start gap-3 ${
                  alert.severity === 'critical'
                    ? 'bg-red-50/80 border-red-200 text-red-950'
                    : alert.severity === 'warning'
                    ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                    : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${
                  alert.severity === 'critical'
                    ? 'bg-red-200 text-red-800'
                    : alert.severity === 'warning'
                    ? 'bg-amber-200 text-amber-800'
                    : 'bg-emerald-200 text-emerald-800'
                }`}>
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider">{alert.title}</h4>
                  <p className="text-xs mt-1 leading-relaxed">{alert.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5-Day Agro Forecast */}
      {forecast && forecast.length > 0 && (
        <div className="agri-card p-5 bg-white border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <CloudSun className="w-5 h-5 text-emerald-600" />
            <span>{t('weather.forecast')}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {forecast.map((day, idx) => (
              <div 
                key={idx}
                className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center text-center transition hover:border-emerald-500 hover:bg-emerald-50/30"
              >
                <span className="text-xs font-bold text-slate-700">
                  {lang === 'hi' ? day.dayHi : day.day}
                </span>
                <span className="text-[10px] text-slate-500 mb-2">
                  {day.date.slice(5)}
                </span>

                <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center my-1 shadow-2xs">
                  {day.icon === 'Sun' && <Sun className="w-5 h-5 text-yellow-500" />}
                  {day.icon === 'CloudSun' && <CloudSun className="w-5 h-5 text-amber-500" />}
                  {day.icon === 'CloudRain' && <CloudRain className="w-5 h-5 text-sky-500" />}
                  {day.icon === 'CloudLightning' && <Wind className="w-5 h-5 text-purple-500" />}
                  {!['Sun', 'CloudSun', 'CloudRain', 'CloudLightning'].includes(day.icon) && (
                    <CloudSun className="w-5 h-5 text-emerald-600" />
                  )}
                </div>

                <span className="text-xs font-black text-slate-900 mt-1">
                  {day.maxTemp}° / {day.minTemp}°
                </span>

                <span className="text-[10px] text-slate-600 truncate max-w-[90px] mt-0.5">
                  {lang === 'hi' ? day.conditionHi : day.condition}
                </span>

                <div className="mt-2 text-[10px] text-sky-700 bg-sky-100/70 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1">
                  <CloudRain className="w-3 h-3" />
                  <span>{day.rainChance}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Advisory Note */}
      <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs text-emerald-950 flex items-start gap-2.5">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {lang === 'hi'
            ? '💡 कृषि सलाह: खुले मौसम में कीटनाशक व पर्णीय उर्वरक छिड़काव करें। 50% से अधिक बारिश की संभावना होने पर सिंचाई रोकें।'
            : '💡 Farming Advisory: Spray foliar fertilizers and crop protectants during clear conditions. Defer field irrigation if rain probability exceeds 50%.'}
        </p>
      </div>

    </div>
  );
}
