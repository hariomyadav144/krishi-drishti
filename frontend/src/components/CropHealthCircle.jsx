import React, { useState, useEffect } from 'react';
import { 
  Sprout, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  RefreshCw, 
  ChevronRight, 
  ArrowUpRight,
  PlusCircle,
  MapPin
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function CropHealthCircle({
  healthData,
  fieldsSummary = [],
  selectedFieldId,
  onSelectField,
  onOpenDetails,
  onRefresh,
  onAddField,
  isRefreshing = false,
}) {
  const { lang } = useLanguage();
  const [animatedScore, setAnimatedScore] = useState(0);

  // If no field or health data is registered yet, show First-Use Onboarding Experience
  const hasValidData = healthData && typeof healthData.healthScore === 'number';
  const targetScore = hasValidData ? healthData.healthScore : 0;

  // Smooth number count-up animation on score change
  useEffect(() => {
    if (!hasValidData) {
      setAnimatedScore(0);
      return;
    }

    let start = 0;
    const duration = 1000;
    const startTime = performance.now();

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(easeProgress * targetScore);
      setAnimatedScore(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }, [targetScore, hasValidData]);

  // If farmer has NOT added a field/crop yet:
  // Show clean first-use experience without fake percentage
  if (!hasValidData && fieldsSummary.length === 0) {
    return (
      <div className="agri-card p-6 sm:p-8 bg-gradient-to-br from-emerald-50/90 via-white to-agri-50/90 border-2 border-dashed border-emerald-300 text-center rounded-3xl shadow-sm space-y-4 animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white flex items-center justify-center mx-auto text-3xl shadow-md">
          <Sprout className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            {lang === 'hi' ? '🌱 फसल स्वास्थ्य (Crop Health)' : '🌱 Crop Health'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mt-1.5 leading-relaxed font-medium">
            {lang === 'hi'
              ? 'फसल स्वास्थ्य की वास्तविक निगरानी शुरू करने के लिए अपने खेत और फसल की जानकारी जोड़ें।'
              : 'Add your field and crop information to start monitoring crop health.'}
          </p>
        </div>
        <button
          onClick={onAddField || (() => { window.location.hash = '#/field-mapping'; })}
          className="px-6 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs shadow-md transition transform active:scale-95 inline-flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{lang === 'hi' ? 'खेत जोड़ें (Add Field)' : 'Add Field'}</span>
        </button>
      </div>
    );
  }

  // Color & Theme Mapping based on prompt specifications:
  // 80–100% → GREEN → Healthy
  // 60–79% → YELLOW → Attention Needed
  // 40–59% → ORANGE → At Risk
  // 0–39% → RED → Critical
  const getTheme = (score) => {
    if (score >= 80) {
      return {
        stroke: '#10B981', // emerald-500
        bgGradient: 'from-emerald-500/15 via-emerald-500/5 to-white',
        borderColor: 'border-emerald-300',
        badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        textColor: 'text-emerald-700',
        glow: 'shadow-emerald-500/20',
        statusEn: 'HEALTHY',
        statusHi: 'स्वस्थ',
        statusMr: 'निरोगी',
        statusPa: 'ਸਿਹਤਮੰਦ',
      };
    }
    if (score >= 60) {
      return {
        stroke: '#EAB308', // yellow-500
        bgGradient: 'from-amber-500/15 via-amber-500/5 to-white',
        borderColor: 'border-amber-300',
        badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
        textColor: 'text-amber-700',
        glow: 'shadow-amber-500/20',
        statusEn: 'ATTENTION NEEDED',
        statusHi: 'ध्यान योग्य',
        statusMr: 'लक्ष देणे गरजेचे',
        statusPa: 'ਧਿਆਨ ਦੀ ਲੋੜ',
      };
    }
    if (score >= 40) {
      return {
        stroke: '#F97316', // orange-500
        bgGradient: 'from-orange-500/15 via-orange-500/5 to-white',
        borderColor: 'border-orange-300',
        badgeBg: 'bg-orange-100 text-orange-900 border-orange-300',
        textColor: 'text-orange-700',
        glow: 'shadow-orange-500/20',
        statusEn: 'AT RISK',
        statusHi: 'जोखिम में',
        statusMr: 'धोक्यात',
        statusPa: 'ਖ਼ਤਰੇ ਵਿੱਚ',
      };
    }
    return {
      stroke: '#EF4444', // red-500
      bgGradient: 'from-rose-500/15 via-rose-500/5 to-white',
      borderColor: 'border-rose-300',
      badgeBg: 'bg-rose-100 text-rose-900 border-rose-300',
      textColor: 'text-rose-700',
      glow: 'shadow-rose-500/20',
      statusEn: 'CRITICAL',
      statusHi: 'गंभीर',
      statusMr: 'गंभीर',
      statusPa: 'ਨਾਜ਼ੁਕ',
    };
  };

  const theme = getTheme(targetScore);

  // Large SVG circular gauge dimensions (Visually large and impossible to miss)
  const size = 220;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  // Format real timestamp
  const formatTimestamp = (dateStr) => {
    if (!dateStr) return 'Just now';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (_) {
      return 'Today';
    }
  };

  const lastUpdatedFormatted = formatTimestamp(healthData?.calculatedAt);

  // Localized Status String
  const statusLabel = lang === 'hi' ? theme.statusHi : (lang === 'mr' ? theme.statusMr : (lang === 'pa' ? theme.statusPa : theme.statusEn));

  // Localized reasons from actual data
  const displayReasons = (lang === 'hi' && Array.isArray(healthData?.reasonsHi) && healthData.reasonsHi.length > 0)
    ? healthData.reasonsHi
    : (healthData?.reasons || []);

  return (
    <div className={`agri-card p-6 sm:p-7 bg-gradient-to-br ${theme.bgGradient} ${theme.borderColor} border-2 shadow-md relative overflow-hidden rounded-3xl transition-all duration-300`}>
      
      {/* 1. Header: Title & Multi-Field Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3.5 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-emerald-100 text-emerald-800">
              <Sprout className="w-5 h-5" />
            </span>
            <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <span>{lang === 'hi' ? '🌱 आपकी फसल का स्वास्थ्य' : '🌱 YOUR CROP HEALTH'}</span>
              <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                Real Data
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-semibold flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-700" />
            <span>{healthData?.fieldName || 'Plot A'}</span>
            <span>•</span>
            <span className="text-emerald-800 font-bold">{healthData?.crop || 'Wheat'}</span>
            <span>({healthData?.cropStage || 'Vegetative Stage'})</span>
          </p>
        </div>

        {/* Multi-Field Switcher & Force Recalculate Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {fieldsSummary.length > 1 && (
            <div className="relative">
              <select
                value={selectedFieldId || healthData?.fieldId || ''}
                onChange={(e) => onSelectField && onSelectField(e.target.value)}
                className="bg-white text-slate-800 text-xs font-bold py-1.5 px-3 rounded-xl border border-slate-300 shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                title="Select Field Plot"
              >
                {fieldsSummary.map((f) => (
                  <option key={f.fieldId} value={f.fieldId}>
                    {f.fieldName} ({f.crop} - {f.healthScore}%)
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className={`p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 shadow-xs transition ${
              isRefreshing ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
            }`}
            title="Recalculate Crop Health"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Main Hero Layout: Prominent Circular Ring + Diagnostics */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8 my-2">
        
        {/* LARGE Circular Ring Indicator (Clickable) */}
        <div 
          onClick={onOpenDetails}
          className="relative cursor-pointer group flex flex-col items-center justify-center p-4 rounded-3xl hover:bg-white/70 transition duration-300 select-none"
          title="Click to view detailed crop health breakdown"
        >
          <div className="relative flex items-center justify-center">
            <svg
              width={size}
              height={size}
              className="transform -rotate-90 drop-shadow-md transition-transform duration-300 group-hover:scale-105"
            >
              {/* Background Track */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#E2E8F0"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              {/* Animated Progress Ring */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={theme.stroke}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                style={{
                  transition: 'stroke-dashoffset 0.9s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.4s ease',
                }}
              />
            </svg>

            {/* Content inside the Circle */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 leading-none">
                {animatedScore}%
              </span>
              <span className={`text-xs font-black uppercase tracking-wider px-3 py-0.5 rounded-full border mt-2 shadow-xs ${theme.badgeBg}`}>
                {statusLabel}
              </span>
              <span className="text-[10px] text-slate-400 font-bold mt-1.5 group-hover:text-emerald-700 flex items-center gap-0.5 transition">
                Tap for Details
                <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* Confidence & Last Updated below Circle */}
          <div className="flex items-center gap-3 mt-4 text-xs font-bold text-slate-600 bg-white/80 px-3.5 py-1.5 rounded-full border border-slate-200/60 shadow-2xs">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === 'hi' ? 'विश्वसनीयता: ' : 'Confidence: '}</span>
              <strong className="text-slate-900">{healthData?.confidence || 'High'}</strong>
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{lang === 'hi' ? 'अपडेट: ' : 'Updated: '}</span>
              <strong className="text-slate-900">{lastUpdatedFormatted}</strong>
            </span>
          </div>
        </div>

        {/* 3. Right Side: Real Contributing Reasons & Action Alert */}
        <div className="flex-1 w-full space-y-3.5">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2">
              {lang === 'hi' ? 'वास्तविक कृषि डेटा आधारित मुख्य कारण' : 'PRIMARY FACTORS SHAPING HEALTH'}
            </span>

            {displayReasons.length > 0 ? (
              <div className="space-y-2">
                {displayReasons.slice(0, 3).map((reason, idx) => (
                  <div 
                    key={idx}
                    className="flex items-start gap-2.5 text-xs font-bold text-slate-800 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs"
                  >
                    <span className="text-emerald-600 font-black shrink-0 text-sm mt-0.5">
                      {reason.startsWith('⚠') ? '⚠️' : '✓'}
                    </span>
                    <span className="leading-relaxed">{reason.replace(/^[✓⚠\s]+/, '')}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-3 rounded-2xl border border-slate-200 text-xs text-slate-600 font-medium">
                {lang === 'hi' ? 'फसल की स्थिति सामान्य व स्थिर है।' : 'All monitored crop parameters are in stable range.'}
              </div>
            )}
          </div>

          {/* Actionable Alert Banner for Yellow/Orange/Red */}
          {targetScore < 80 && (
            <div className={`p-3.5 rounded-2xl border text-xs flex items-start gap-3 shadow-2xs ${
              targetScore < 40 
                ? 'bg-rose-50 border-rose-300 text-rose-900' 
                : (targetScore < 60 ? 'bg-orange-50 border-orange-300 text-orange-900' : 'bg-amber-50 border-amber-300 text-amber-900')
            }`}>
              <AlertTriangle className="w-5 h-5 shrink-0 text-current mt-0.5" />
              <div>
                <strong className="font-black block text-xs tracking-tight">
                  {targetScore < 40 
                    ? (lang === 'hi' ? '🚨 तत्काल ध्यान आवश्यक' : '🚨 Urgent Intervention Needed')
                    : (lang === 'hi' ? '⚠️ ध्यान देने योग्य स्थिति' : '⚠️ Attention Recommended')}
                </strong>
                <p className="text-[11px] mt-0.5 leading-relaxed font-semibold opacity-95">
                  {healthData?.recommendations?.[0]?.description || (lang === 'hi' ? 'खेत का निरीक्षण करें व आवश्यक जल प्रबंधन करें।' : 'Inspect field and follow moisture management guidance.')}
                </p>
              </div>
            </div>
          )}

          {/* Action Button to Open Detailed Breakdown Modal */}
          <div className="pt-1 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500 font-semibold hidden sm:inline">
              {lang === 'hi' ? '6-घटक पारदर्शी विश्लेषण व स्थायी इतिहास' : 'Deep 6-factor telemetry & permanent history'}
            </span>
            <button
              onClick={onOpenDetails}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-sm transition flex items-center justify-center gap-2 ml-auto active:scale-95"
            >
              <span>{lang === 'hi' ? 'विस्तृत स्वास्थ्य देखें' : 'View Detailed Health'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
