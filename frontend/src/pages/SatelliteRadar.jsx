import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import { 
  Satellite, 
  Activity, 
  Layers, 
  Droplets, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  RefreshCw, 
  Calendar,
  Radio,
  Compass
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

export default function SatelliteRadar() {
  const { lang, t } = useLanguage();
  const [satelliteData, setSatelliteData] = useState(null);
  const [activeSector, setActiveSector] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSatelliteData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tools/satellite-ndvi');
      if (res.data.success) {
        setSatelliteData(res.data.data);
        if (res.data.data.fieldSectors.length > 0 && !activeSector) {
          setActiveSector(res.data.data.fieldSectors[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load satellite NDVI:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSatelliteData();
  }, []);

  if (loading && !satelliteData) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4">
        <div className="h-32 bg-slate-200 animate-pulse rounded-3xl"></div>
        <div className="h-64 bg-slate-200 animate-pulse rounded-3xl"></div>
      </div>
    );
  }

  const { satellite, lastPassDate, resolution, overallNDVIScore, healthStatus, healthStatusHi, fieldSectors, historicalNDVI } = satelliteData || {};

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 pb-24 md:pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛰️</span>
            <h2 className="text-2xl font-black text-slate-900">{t('satellite.title')}</h2>
          </div>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            {t('satellite.subtitle')}
          </p>
        </div>

        <button
          onClick={fetchSatelliteData}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl shadow-xs transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Orbit Telemetry</span>
        </button>
      </div>

      {/* Orbit & Pass Info Banner */}
      <div className="agri-card p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="flex items-start justify-between flex-wrap gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-300">
                {satellite} • Live Orbit
              </span>
            </div>

            <h3 className="text-xl font-black">
              {lang === 'hi' && healthStatusHi ? healthStatusHi : healthStatus}
            </h3>
            
            <p className="text-xs text-slate-300 mt-1">
              Last Pass: <span className="font-semibold text-white">{lastPassDate}</span> • Resolution: {resolution}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-indigo-300 block">NDVI Index</span>
            <span className="text-3xl sm:text-4xl font-black text-emerald-400">{overallNDVIScore}</span>
            <span className="text-[10px] text-emerald-300 block">/ 1.0 (Optimal Range)</span>
          </div>
        </div>

        {/* Visual Simulated Satellite Heatmap Plot Graphic */}
        <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {fieldSectors?.map((sector, i) => {
            const isSelected = activeSector?.sectorId === sector.sectorId;
            const isOptimal = sector.ndvi >= 0.75;

            return (
              <div
                key={i}
                onClick={() => setActiveSector(sector)}
                className={`p-3.5 rounded-2xl cursor-pointer transition border text-xs ${
                  isSelected
                    ? 'bg-white/20 border-emerald-400 ring-2 ring-emerald-300/50 backdrop-blur-md'
                    : 'bg-white/5 hover:bg-white/10 border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-white">{sector.sectorId}</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    isOptimal ? 'bg-emerald-500/80 text-white' : 'bg-amber-500/80 text-white'
                  }`}>
                    NDVI {sector.ndvi}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">{sector.crop}</p>
                <p className="text-[10px] text-emerald-300 mt-1 font-semibold">💧 {sector.moistureIndex}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Sector Precision Analysis */}
      {activeSector && (
        <div className="agri-card p-5 bg-white border-slate-200 shadow-sm space-y-4">
          <div className="flex items-start justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                Plot Telemetry
              </span>
              <h4 className="text-base font-black text-slate-900 mt-1">
                {activeSector.sectorId} – {activeSector.crop}
              </h4>
            </div>

            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
              activeSector.ndvi >= 0.75
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              {activeSector.status}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500 font-semibold block">{t('satellite.moistureIndex')}</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">{activeSector.moistureIndex}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500 font-semibold block">Vegetative Stress Status</span>
              <span className={`font-bold text-xs mt-0.5 block ${
                activeSector.stressWarning === 'None' ? 'text-emerald-700' : 'text-amber-700'
              }`}>
                {activeSector.stressWarning}
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs">
            <span className="font-bold text-emerald-950 block mb-1">
              🌱 Agro-Advisory for this Plot:
            </span>
            <p className="text-emerald-900 leading-relaxed">
              {activeSector.recommendedAction}
            </p>
          </div>
        </div>
      )}

      {/* 40-Day Vegetative Trend Line */}
      <div className="agri-card p-5 bg-white border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            <span>{t('satellite.ndviTrajectory')}</span>
          </h4>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            +42% Biomass Growth
          </span>
        </div>

        <div className="h-56 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historicalNDVI || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0.4, 0.9]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="score"
                name="NDVI Score"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ r: 5, fill: '#6366f1' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
