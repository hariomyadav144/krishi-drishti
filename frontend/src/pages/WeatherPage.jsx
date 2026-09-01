import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import { 
  CloudSun, 
  CloudRain, 
  Sun, 
  Droplets, 
  Wind, 
  Compass, 
  AlertCircle, 
  RefreshCw, 
  Thermometer,
  ShieldCheck
} from 'lucide-react';

export default function WeatherPage() {
  const { lang, t } = useLanguage();
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      const res = await api.get('/weather');
      if (res.data.success) {
        setWeatherData(res.data.data);
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
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-black text-slate-900">{t('weather.title')}</h2>
          <p className="text-xs text-slate-600 mt-0.5">📍 {location || 'Nashik, Maharashtra'}</p>
        </div>

        <button
          onClick={fetchWeather}
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
          title="Refresh Weather"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

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

          {/* 4 Metric Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/15 text-xs">
            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-xs">
              <span className="text-sky-200 block text-[11px] flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5" />
                {t('weather.rainChance')}
              </span>
              <span className="font-extrabold text-base block mt-0.5">{current.rainProbability}%</span>
            </div>

            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-xs">
              <span className="text-sky-200 block text-[11px] flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5" />
                {t('weather.humidity')}
              </span>
              <span className="font-extrabold text-base block mt-0.5">{current.humidity}%</span>
            </div>

            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-xs">
              <span className="text-sky-200 block text-[11px] flex items-center gap-1">
                <Wind className="w-3.5 h-3.5" />
                {t('weather.windSpeed')}
              </span>
              <span className="font-extrabold text-base block mt-0.5">{current.windSpeed} km/h</span>
            </div>

            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-xs">
              <span className="text-sky-200 block text-[11px] flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5" />
                UV Index
              </span>
              <span className="font-extrabold text-base block mt-0.5">{current.uvIndex} (Moderate)</span>
            </div>
          </div>
        </div>
      )}

      {/* Smart Weather Alerts */}
      {smartAlerts && smartAlerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-extrabold text-sm text-slate-900 px-1 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-agri-600" />
            {t('weather.smartAlerts')}
          </h3>

          <div className="space-y-2.5">
            {smartAlerts.map((alert, idx) => (
              <div
                key={idx}
                className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs"
              >
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-950">
                    {lang === 'hi' && alert.titleHi ? alert.titleHi : alert.title}
                  </h4>
                  <p className="text-amber-900 text-xs mt-1 leading-relaxed">
                    {lang === 'hi' && alert.messageHi ? alert.messageHi : alert.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5-Day Detailed Forecast */}
      {forecast && (
        <div className="agri-card p-5 bg-white border-slate-200 shadow-sm">
          <h3 className="font-extrabold text-sm text-slate-900 mb-3">
            {t('weather.fiveDayForecast')}
          </h3>

          <div className="divide-y divide-slate-100">
            {forecast.map((f, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 w-1/3">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
                    <CloudSun className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">{f.day}</span>
                    <span className="text-[10px] text-slate-500">{f.date}</span>
                  </div>
                </div>

                <div className="text-center w-1/3">
                  <span className="text-slate-700 font-medium block truncate capitalize">{f.condition}</span>
                  <span className="text-[11px] text-blue-600 font-bold">{f.rainChance}% Rain</span>
                </div>

                <div className="text-right w-1/3">
                  <span className="font-extrabold text-slate-900 text-sm">{f.maxTemp}°</span>
                  <span className="text-slate-400 text-xs font-semibold"> / {f.minTemp}°C</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
