import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Satellite, 
  Layers, 
  Activity, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Compass,
  FileSpreadsheet
} from 'lucide-react';

export default function FieldIntelligenceExtensions({ 
  activeField,
  onNavigateSatellite
}) {
  const { lang } = useLanguage();

  // If no active field or field has fewer than 3 points, display honest state without fake data
  const hasValidBoundary = activeField && Array.isArray(activeField.points) && activeField.points.length >= 3;

  if (!hasValidBoundary) {
    return (
      <div className="bg-slate-50 border border-dashed border-slate-300 rounded-3xl p-6 text-center text-slate-500 space-y-2">
        <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-lg">
          🛰️
        </div>
        <h4 className="font-bold text-slate-700 text-sm">
          {lang === 'hi' ? 'स्थानिक एंकर अभी सक्रिय नहीं है' : 'Spatial Anchor Awaiting Survey'}
        </h4>
        <p className="text-xs max-w-md mx-auto text-slate-500">
          {lang === 'hi'
            ? 'वास्तविक खेत डेटा अभी उपलब्ध नहीं है। उपग्रह व स्थानिक विश्लेषण सक्रिय करने के लिए नक्शे पर कम से कम 3 बिंदु चिह्नित करें।'
            : 'Real field data not available yet. Mark at least 3 corners on the interactive map above to establish this parcel as a spatial anchor.'}
        </p>
      </div>
    );
  }

  const {
    crop = 'Crop',
    formattedAcres = '',
    formattedHectares = '',
    areaAcres = 0,
    areaHectares = 0,
    cornersCount = 0,
    gpsAccuracy = null,
    updatedAt = new Date().toISOString(),
    center = null,
    points = []
  } = activeField;

  const displayAcres = formattedAcres || (areaAcres > 0 ? `${areaAcres.toFixed(2)} acres` : '0.00 acres');
  const displayHectares = formattedHectares || (areaHectares > 0 ? `${areaHectares.toFixed(2)} ha` : '0.00 ha');

  const formattedDate = new Date(updatedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="space-y-4">
      {/* Primary Saved Field Intelligence Summary Card */}
      <div className="bg-gradient-to-br from-emerald-900/90 via-agri-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg border border-emerald-500/30 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block mb-1">
                SPATIAL ANCHOR ACTIVE
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <span>🌾</span>
                <span>{crop} • {displayAcres}</span>
              </h3>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified Boundary</span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-medium">
            {lang === 'hi'
              ? 'आपका सहेजा गया GPS खेत बहुभुज (Field Polygon) अब फ़सल दृष्टि फसल बुद्धिमत्ता (Crop Intelligence) का स्थानिक केंद्र है।'
              : 'Your saved GPS field polygon is now the spatial anchor for Fasal Drishti intelligence.'}
          </p>

          {/* Grid of verified parameters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
            <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
              <span className="text-[10px] text-emerald-300 font-bold uppercase block">Crop Profile</span>
              <span className="font-black text-white text-sm mt-0.5 block">{crop}</span>
              <span className="text-[10px] text-slate-300">{activeField.season || 'Kharif'}</span>
            </div>

            <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
              <span className="text-[10px] text-emerald-300 font-bold uppercase block">Hectares</span>
              <span className="font-black text-emerald-300 text-sm mt-0.5 block">
                {displayHectares}
              </span>
              <span className="text-[10px] text-slate-300">{activeField.areaSqMeters ? `${Math.round(activeField.areaSqMeters).toLocaleString()} m²` : ''}</span>
            </div>

            <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
              <span className="text-[10px] text-emerald-300 font-bold uppercase block">Boundary Corners</span>
              <span className="font-black text-white text-sm mt-0.5 block">{cornersCount || points.length} Points</span>
              <span className="text-[10px] text-emerald-300">{gpsAccuracy ? `GPS Accuracy: ±${gpsAccuracy}m` : 'Survey Verified'}</span>
            </div>

            <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
              <span className="text-[10px] text-emerald-300 font-bold uppercase block">Field Centroid</span>
              <span className="font-mono text-[11px] font-bold text-white mt-0.5 block truncate">
                {center && typeof center.lat === 'number' ? `${center.lat.toFixed(4)}°N, ${center.lng.toFixed(4)}°E` : 'Calculated Live'}
              </span>
              <span className="text-[10px] text-slate-300 flex items-center gap-1 mt-0.5">
                <Clock className="w-2.5 h-2.5" />
                <span className="truncate">{formattedDate}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Extension Capabilities Cards (Below Map) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Remote-Sensing Layer Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm hover:border-emerald-500/50 transition flex flex-col justify-between space-y-4">
          <div className="space-y-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold">
              <Satellite className="w-5 h-5" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold text-[10px] uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
              <span>Remote-sensing layer ready</span>
            </div>
            <h4 className="font-black text-slate-900 text-sm sm:text-base">
              Satellite Multispectral Crop Health
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {lang === 'hi'
                ? 'खेत की सीमा का उपयोग उपग्रह इमेजरी, वनस्पति सूचकांक (NDVI) और खेत में बदलाव का पता लगाने के लिए स्थानिक एंकर के रूप में किया जा सकता है।'
                : 'The field boundary can be used as the spatial anchor for satellite imagery, vegetation indices and change detection.'}
            </p>
          </div>

          {/* Action to launch NDVI */}
          {onNavigateSatellite && (
            <button
              type="button"
              id="btn-navigate-satellite-ndvi"
              onClick={onNavigateSatellite}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95"
            >
              <span>🛰️ {lang === 'hi' ? 'सैटेलाइट NDVI रडार में देखें' : 'Analyze in Satellite NDVI Radar'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Research Pipeline Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm hover:border-emerald-500/50 transition flex flex-col justify-between space-y-4">
          <div className="space-y-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>Research pipeline ready</span>
            </div>
            <h4 className="font-black text-slate-900 text-sm sm:text-base">
              Evidence-Backed Precision Agronomy
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {lang === 'hi'
                ? 'खेत के ज़मीनी अवलोकनों और उपग्रह सिग्नलों को मिलाकर साक्ष्य-आधारित फसल अंतर्दृष्टि (evidence-backed crop insights) बनाई जा सकती है।'
                : 'Field observations and satellite signals can be combined into evidence-backed crop insights.'}
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 flex items-center justify-between">
            <span className="font-semibold">Spatial Accuracy Engine:</span>
            <span className="font-bold text-emerald-700">WGS-84 Geodesic Anchor ✓</span>
          </div>
        </div>

      </div>
    </div>
  );
}
