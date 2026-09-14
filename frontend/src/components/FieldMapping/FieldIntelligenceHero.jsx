import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Compass, 
  MapPin, 
  Maximize2, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  Radio,
  Sprout
} from 'lucide-react';

export default function FieldIntelligenceHero({ 
  crop = 'Maize',
  areaAcres = 0,
  areaHectares = 0,
  cornersCount = 0,
  gpsStatus = 'GPS Waiting',
  gpsAccuracy = null,
  isDemoLocation = false
}) {
  const { lang } = useLanguage();

  const isGpsConnected = gpsStatus.toLowerCase().includes('connected');

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#12381F] via-[#0E2C18] to-[#0A2012] text-white p-5 sm:p-7 shadow-xl border border-emerald-900/40">
      {/* Decorative ambient glow */}
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-agri-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-black tracking-wider uppercase">
            <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '10s' }} />
            <span>{lang === 'hi' ? 'स्थानिक फसल दृष्टि (Spatial Anchor)' : 'Spatial Intelligence Layer'}</span>
          </div>

          {/* GPS Status Indicator */}
          <div className="flex items-center gap-2">
            {isDemoLocation && (
              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                🧪 Testing / Demo Mode
              </span>
            )}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
              isGpsConnected 
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300' 
                : 'bg-amber-950/80 border-amber-500/50 text-amber-300'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                isGpsConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
              }`} />
              <span>
                {isGpsConnected 
                  ? `${gpsStatus}${gpsAccuracy ? ` • ±${gpsAccuracy}m` : ''}` 
                  : (lang === 'hi' ? 'GPS प्रतीक्षा में (GPS Waiting)' : 'GPS Waiting')}
              </span>
            </div>
          </div>
        </div>

        {/* Title & Subtitle */}
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white flex items-center gap-2.5">
            <span>🌾</span>
            <span>{lang === 'hi' ? 'फील्ड इंटेलिजेंस (Field Intelligence)' : 'Field Intelligence'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/80 max-w-2xl mt-1.5 leading-relaxed">
            {lang === 'hi' 
              ? 'अपने खेत की सीमा (Boundary) मैप करें और इसे उपग्रह फसल स्वास्थ्य विश्लेषण का आधार बनाएं।' 
              : 'Map your farm boundary and use it as the spatial anchor for crop intelligence.'}
          </p>
        </div>

        {/* Primary Metrics Strip (Selected crop, Field Area, Boundary points, GPS status) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-2">
          {/* Selected Crop */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15">
            <div className="flex items-center gap-1.5 text-emerald-300 text-[11px] font-bold uppercase tracking-wider">
              <Sprout className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'चुनी गई फसल' : 'Selected Crop'}</span>
            </div>
            <p className="text-base sm:text-lg font-black text-white mt-1 truncate">
              {crop || 'Maize'}
            </p>
            <span className="text-[10px] text-emerald-200/70 block">
              {lang === 'hi' ? 'सक्रिय फसल प्रकार' : 'Active Target'}
            </span>
          </div>

          {/* Mapped Field Area */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15">
            <div className="flex items-center gap-1.5 text-emerald-300 text-[11px] font-bold uppercase tracking-wider">
              <Maximize2 className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'खेत का क्षेत्रफल' : 'Field Area'}</span>
            </div>
            <p className="text-base sm:text-lg font-black text-emerald-300 mt-1 truncate">
              {areaAcres > 0 ? `${areaAcres.toFixed(2)} acres` : '0.00 acres'}
            </p>
            <span className="text-[10px] text-emerald-200/70 block">
              {areaHectares > 0 ? `${areaHectares.toFixed(2)} hectares` : '0.00 ha'}
            </span>
          </div>

          {/* Number of Boundary Points */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15">
            <div className="flex items-center gap-1.5 text-emerald-300 text-[11px] font-bold uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'सीमा बिंदु (Corners)' : 'Boundary Points'}</span>
            </div>
            <p className="text-base sm:text-lg font-black text-white mt-1">
              {cornersCount} {lang === 'hi' ? 'कोने' : 'points'}
            </p>
            <span className="text-[10px] text-emerald-200/70 block">
              {cornersCount >= 3 ? '✓ Closed Polygon' : 'Minimum 3 required'}
            </span>
          </div>

          {/* GPS Connection State */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15">
            <div className="flex items-center gap-1.5 text-emerald-300 text-[11px] font-bold uppercase tracking-wider">
              <Radio className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'GPS स्थिति' : 'GPS Status'}</span>
            </div>
            <p className="text-base sm:text-lg font-black text-white mt-1 truncate">
              {isGpsConnected ? 'GPS Connected' : 'GPS Waiting'}
            </p>
            <span className="text-[10px] text-emerald-200/70 block truncate">
              {gpsAccuracy ? `Accuracy: ±${gpsAccuracy}m` : 'Click "Find My GPS"'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
