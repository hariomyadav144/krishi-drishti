import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import { 
  ShieldAlert, 
  Radar, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  RefreshCw, 
  Radio,
  Bug,
  Compass
} from 'lucide-react';

export default function OutbreakRadar() {
  const { lang, t } = useLanguage();
  const [radarData, setRadarData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOutbreaks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tools/outbreaks');
      if (res.data.success) {
        setRadarData(res.data);
      }
    } catch (e) {
      console.error('Failed to load outbreak radar:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutbreaks();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 pb-24 md:pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚨</span>
            <h2 className="text-2xl font-black text-slate-900">{t('outbreak.title')}</h2>
          </div>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            {t('outbreak.subtitle')}
          </p>
        </div>

        <button
          onClick={fetchOutbreaks}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl shadow-xs transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Scan Local Radar</span>
        </button>
      </div>

      {/* Radar Status Banner */}
      <div className="agri-card p-5 bg-gradient-to-r from-rose-950 via-slate-900 to-rose-900 text-white shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between flex-wrap gap-3 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-rose-300">
                Region: {radarData?.district || 'Nashik District (25km Geo-Fence)'}
              </span>
            </div>
            <h3 className="text-xl font-black">
              {radarData?.activeAlertsCount || 3} Active Outbreak Alerts Detected
            </h3>
            <p className="text-xs text-rose-200 mt-0.5">
              Preventive biological barrier recommended for high risk zones.
            </p>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-red-300 border border-white/20">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Outbreak Alert List */}
      <div className="space-y-4">
        {((radarData?.data || radarData?.alerts || [])).map((outbreak) => {
          const risk = outbreak?.riskLevel || outbreak?.severity || 'MODERATE';
          const isHigh = risk.toUpperCase().includes('HIGH') || risk.toUpperCase().includes('CRITICAL');

          return (
            <div
              key={outbreak.id || Math.random()}
              className={`agri-card p-5 bg-white border shadow-sm space-y-3 ${
                isHigh ? 'border-red-300 ring-1 ring-red-100' : 'border-amber-200'
              }`}
            >
              <div className="flex items-start justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isHigh ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    <Bug className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      {lang === 'hi' && (outbreak.pestNameHi || outbreak.threatHi) ? (outbreak.pestNameHi || outbreak.threatHi) : (outbreak.pestName || outbreak.threat || 'Crop Pest Alert')}
                    </h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{outbreak.location || 'Nashik Region'}</span>
                      <span className="font-bold text-rose-700">({outbreak.distanceKm || outbreak.distance || 'Nearby'})</span>
                    </p>
                  </div>
                </div>

                <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-2xs ${
                  isHigh ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
                }`}>
                  {risk}
                </span>
              </div>

              {/* Affected Crops */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-semibold">{t('outbreak.affectedCrops')}:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(Array.isArray(outbreak.affectedCrops) ? outbreak.affectedCrops : [outbreak.crop || 'Tomato, Chilli']).map((crop, i) => (
                    <span key={i} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold">
                      {crop}
                    </span>
                  ))}
                </div>
              </div>

              {/* Preventive Guideline */}
              <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-200 text-xs">
                <span className="font-bold text-rose-950 flex items-center gap-1.5 mb-1">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  {t('outbreak.preventiveGuide')}
                </span>
                <p className="text-rose-900 leading-relaxed font-medium">
                  {lang === 'hi' && outbreak.preventiveGuidelineHi ? outbreak.preventiveGuidelineHi : outbreak.preventiveGuideline}
                </p>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
