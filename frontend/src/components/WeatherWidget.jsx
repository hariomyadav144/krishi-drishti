import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { CloudSun, CloudRain, Sun, Droplets, Wind, AlertCircle } from 'lucide-react';

export default function WeatherWidget({ weatherData, onSeeFullForecast }) {
  const { t, lang } = useLanguage();

  if (!weatherData) {
    return (
      <div className="agri-card p-5 animate-pulse bg-slate-100">
        <div className="h-6 bg-slate-200 rounded w-1/3 mb-3"></div>
        <div className="h-10 bg-slate-200 rounded w-1/2"></div>
      </div>
    );
  }

  const { current, forecast, smartAlerts, location } = weatherData;

  const getWeatherIcon = (condition) => {
    const c = (condition || '').toLowerCase();
    if (c.includes('rain') || c.includes('shower')) {
      return <CloudRain className="w-8 h-8 text-blue-500" />;
    }
    if (c.includes('cloud')) {
      return <CloudSun className="w-8 h-8 text-amber-500" />;
    }
    return <Sun className="w-8 h-8 text-yellow-500 animate-spin-slow" />;
  };

  return (
    <div className="agri-card p-5 bg-gradient-to-br from-white to-sky-50/40 border-sky-100 shadow-sm">
      {/* Location and Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <CloudSun className="w-5 h-5 text-sky-600" />
          <h4 className="font-bold text-slate-900 text-sm">{t('weather.title')}</h4>
        </div>
        <span className="text-[11px] font-semibold text-sky-800 bg-sky-100/80 px-2 py-0.5 rounded-full">
          📍 {location || 'Nashik, Maharashtra'}
        </span>
      </div>

      {/* Main Temperature and Current Info */}
      <div className="flex items-center justify-between my-3">
        <div className="flex items-center gap-3">
          {getWeatherIcon(current.condition)}
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-slate-900">{current.temp}°</span>
              <span className="text-slate-500 text-sm font-medium">C</span>
            </div>
            <p className="text-xs font-semibold text-slate-600 capitalize">
              {current.condition}
            </p>
          </div>
        </div>

        {/* Quick parameters */}
        <div className="flex items-center gap-4 text-xs">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-blue-600 font-bold">
              <Droplets className="w-3.5 h-3.5" />
              <span>{current.rainProbability}%</span>
            </div>
            <span className="text-[10px] text-slate-500">{t('weather.rainChance')}</span>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-teal-600 font-bold">
              <Wind className="w-3.5 h-3.5" />
              <span>{current.windSpeed} km/h</span>
            </div>
            <span className="text-[10px] text-slate-500">{t('weather.windSpeed')}</span>
          </div>
        </div>
      </div>

      {/* Smart Weather Farming Alert Banner */}
      {smartAlerts && smartAlerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 my-2 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-900">
              {lang === 'hi' && smartAlerts[0].titleHi ? smartAlerts[0].titleHi : smartAlerts[0].title}
            </p>
            <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
              {lang === 'hi' && smartAlerts[0].messageHi ? smartAlerts[0].messageHi : smartAlerts[0].message}
            </p>
          </div>
        </div>
      )}

      {/* 5-Day Mini Forecast Strip */}
      {forecast && (
        <div className="grid grid-cols-5 gap-1 pt-3 border-t border-slate-100 text-center">
          {forecast.slice(0, 5).map((f, idx) => (
            <div key={idx} className="p-1.5 rounded-lg bg-white/80 border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-500 block truncate">
                {idx === 0 ? (lang === 'hi' ? 'आज' : 'Today') : idx === 1 ? (lang === 'hi' ? 'कल' : 'Tmrw') : f.day.slice(0, 3)}
              </span>
              <div className="flex justify-center my-1 scale-75">
                {getWeatherIcon(f.condition)}
              </div>
              <span className="text-xs font-bold text-slate-800 block">
                {f.maxTemp}°
              </span>
              <span className="text-[9px] text-blue-600 font-semibold block">
                {f.rainChance}% 🌧️
              </span>
            </div>
          ))}
        </div>
      )}

      {onSeeFullForecast && (
        <button
          onClick={onSeeFullForecast}
          className="w-full mt-3 text-center text-xs font-semibold text-sky-700 hover:text-sky-900 py-1"
        >
          {lang === 'hi' ? 'पूरा 5-दिवसीय मौसम पूर्वानुमान देखें →' : 'View Full 5-Day Agro Forecast →'}
        </button>
      )}
    </div>
  );
}
