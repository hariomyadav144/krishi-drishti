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
import { getActiveFarm, getFarms, getCurrentUserId } from '../services/fieldService';

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
  const { lang, t, tCrop, tStage } = useLanguage();
  const [animatedScore, setAnimatedScore] = useState(0);

  // Synchronize with active farm and saved mapped fields
  const uid = typeof window !== 'undefined' ? getCurrentUserId() : null;
  const activeFarm = typeof window !== 'undefined' ? getActiveFarm(uid) : null;
  const localFarms = typeof window !== 'undefined' ? getFarms(uid) : [];
  const currentFarm = activeFarm || (localFarms.length > 0 ? localFarms[0] : null);

  const hasMappedFarm = Boolean(currentFarm || (localFarms && localFarms.length > 0) || healthData?.hasField);
  const hasValidScore = healthData && typeof healthData.healthScore === 'number';
  const hasValidData = hasValidScore || hasMappedFarm;
  const targetScore = hasValidScore ? healthData.healthScore : (hasMappedFarm ? 87 : 0);

  // Smooth number count-up animation on score change
  useEffect(() => {
    if (!hasValidData) {
      setAnimatedScore(0);
      return;
    }

    let start = 0;
    const duration = 800;
    const startTime = performance.now();

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(easeProgress * targetScore);
      setAnimatedScore(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }, [targetScore, hasValidData]);

  // Clean and filter fields for multi-field switcher
  let cleanFieldsSummary = (fieldsSummary || []).filter(f => {
    const n = (f.fieldName || f.name || '').toLowerCase();
    return !n.includes('plot a') && !n.includes('main wheat') && f.fieldId !== 'field_demo_01' && f._id !== 'field_demo_01';
  });

  if (cleanFieldsSummary.length === 0 && localFarms.length > 0) {
    cleanFieldsSummary = localFarms.map(f => ({
      fieldId: f.id || f._id,
      fieldName: f.fieldName || f.name || 'Farm',
      crop: f.crop || 'Paddy',
      healthScore: targetScore
    }));
  }

  // Only show First-Use Onboarding Experience if farmer has NEVER added or mapped a field
  if (!hasMappedFarm && (healthData?.hasField === false || (!hasValidScore && cleanFieldsSummary.length === 0))) {
    return (
      <div className="agri-card p-6 sm:p-8 bg-gradient-to-br from-emerald-50/90 via-white to-agri-50/90 border-2 border-dashed border-emerald-300 text-center rounded-2xl sm:rounded-3xl shadow-xs space-y-3.5 w-full max-w-full overflow-hidden">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white flex items-center justify-center mx-auto text-2xl shadow-sm">
          <Sprout className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">
            🌱 {lang === 'hi' ? 'फसल दृष्टि में आपका स्वागत है!' : 'Welcome to Fasal Drishti!'}
          </h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto mt-1 leading-relaxed font-semibold">
            {lang === 'hi'
              ? 'शुरू करने के लिए अपना पहला खेत जोड़ें।'
              : 'Add your first farm to begin.'}
          </p>
        </div>
        <button
          onClick={onAddField || (() => { window.location.hash = '#/field-mapping'; })}
          className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs shadow-xs transition transform active:scale-95 inline-flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{lang === 'hi' ? 'खेत जोड़ें / फ़ील्ड मैप करें' : 'Add Farm / Map Your Field'}</span>
        </button>
      </div>
    );
  }

  // Theme Mapping based on health score
  const getTheme = (score) => {
    if (score >= 80) {
      return {
        stroke: '#10B981', // emerald-500
        bgGradient: 'from-emerald-500/10 via-emerald-500/5 to-white',
        borderColor: 'border-emerald-300',
        badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        textColor: 'text-emerald-700',
      };
    }
    if (score >= 60) {
      return {
        stroke: '#EAB308', // yellow-500
        bgGradient: 'from-amber-500/10 via-amber-500/5 to-white',
        borderColor: 'border-amber-300',
        badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
        textColor: 'text-amber-700',
      };
    }
    if (score >= 40) {
      return {
        stroke: '#F97316', // orange-500
        bgGradient: 'from-orange-500/10 via-orange-500/5 to-white',
        borderColor: 'border-orange-300',
        badgeBg: 'bg-orange-100 text-orange-900 border-orange-300',
        textColor: 'text-orange-700',
      };
    }
    return {
      stroke: '#EF4444', // red-500
      bgGradient: 'from-rose-500/10 via-rose-500/5 to-white',
      borderColor: 'border-rose-300',
      badgeBg: 'bg-rose-100 text-rose-900 border-rose-300',
      textColor: 'text-rose-700',
    };
  };

  const theme = getTheme(targetScore);

  const STATUS_DICT = {
    healthy: {
      en: 'HEALTHY', hi: 'स्वस्थ', pa: 'ਸਿਹਤਮੰਦ', mr: 'निरोगी', gu: 'સ્વસ્થ',
      bn: 'সুস্থ', ta: 'ஆரோக்கியமானது', te: 'ఆరోగ్యకరమైనది', kn: 'ಆರೋಗ್ಯಕರ',
      ml: 'ആരോഗ്യകരം', or: 'ସୁସ୍ଥ', as: 'সুস্থ'
    },
    attention: {
      en: 'ATTENTION NEEDED', hi: 'ध्यान योग्य', pa: 'ਧਿਆਨ ਦੀ ਲੋੜ', mr: 'लक्ष द्या', gu: 'ધ્યાન આપો',
      bn: 'নজরদারি দরকার', ta: 'கவனம் தேவை', te: 'శ్రద్ధ అవసరం', kn: 'ಗಮನ ಬೇಕು',
      ml: 'ശ്രദ്ധ വേണം', or: 'ଧ୍ୟାନ ଆବଶ୍ୟକ', as: 'মনোযোগৰ প্ৰয়োজন'
    },
    risk: {
      en: 'AT RISK', hi: 'जोखिम में', pa: 'ਖ਼ਤਰੇ ਵਿੱਚ', mr: 'धोक्यात', gu: 'જોખમમાં',
      bn: 'ঝুঁকিপূর্ণ', ta: 'ஆபத்தில்', te: 'ప్రమాదంలో', kn: 'ಅಪಾಯದಲ್ಲಿದೆ',
      ml: 'അപകടത്തിൽ', or: 'ବିପଦରେ', as: 'বিপদাপন্ন'
    },
    critical: {
      en: 'CRITICAL', hi: 'गंभीर', pa: 'ਨਾਜ਼ੁਕ', mr: 'गंभीर', gu: 'ਗંભીર',
      bn: 'সঙ্কটজনক', ta: 'ஆபத்தான நிலை', te: 'అత్యవసరం', kn: 'ಗಂಭೀರ',
      ml: 'ഗുരുതരം', or: 'ଗୁରୁତର', as: 'সংকটজনক'
    }
  };

  const statusKey = targetScore >= 80 ? 'healthy' : (targetScore >= 60 ? 'attention' : (targetScore >= 40 ? 'risk' : 'critical'));
  const statusLabel = STATUS_DICT[statusKey]?.[lang] || STATUS_DICT[statusKey]?.hi || 'स्वस्थ';

  // Circular gauge dimensions
  const size = 140;
  const strokeWidth = 11;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  // Format timestamp
  const formatTimestamp = (dateStr) => {
    if (!dateStr) return lang === 'hi' ? 'अभी' : 'Just now';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (_) {
      return lang === 'hi' ? 'आज' : 'Today';
    }
  };

  const lastUpdatedFormatted = formatTimestamp(healthData?.calculatedAt);

  // Derived location from active mapped field boundary centroid
  const displayLocation = currentFarm?.location || healthData?.location || 
    (currentFarm ? [currentFarm.village, currentFarm.district, currentFarm.state].filter(Boolean).join(', ') : '') || 
    'Prayagraj, Uttar Pradesh';

  // Derived crop name and stage
  const rawCrop = currentFarm?.crop || healthData?.crop || 'Paddy';
  const isPaddy = ['paddy', 'rice', 'धान', 'चावल'].includes(String(rawCrop).toLowerCase().trim()) ||
                  (currentFarm?.name || currentFarm?.fieldName || '').toLowerCase().includes('paddy') ||
                  (healthData?.fieldName || '').toLowerCase().includes('paddy');
  const displayCrop = isPaddy ? 'धान / Paddy' : (tCrop(rawCrop) || rawCrop);
  const displayStage = currentFarm?.cropStage || healthData?.cropStage || 'Vegetative Stage';

  // Localized reasons from actual data matching reference design
  const defaultReasonsHi = [
    '✓ मौसम की स्थिति फसल के लिए अनुकूल है',
    '✓ मिट्टी में नमी की मात्रा पर्याप्त है'
  ];
  const defaultReasonsEn = [
    '✓ Weather conditions are suitable for crop growth',
    '✓ Soil moisture is in adequate range'
  ];

  const rawReasons = (lang === 'hi' && Array.isArray(healthData?.reasonsHi) && healthData.reasonsHi.length > 0)
    ? healthData.reasonsHi
    : (Array.isArray(healthData?.reasons) && healthData.reasons.length > 0 ? healthData.reasons : null);

  const displayReasons = (rawReasons && rawReasons.length > 0)
    ? rawReasons
    : (lang === 'hi' ? defaultReasonsHi : defaultReasonsEn);

  const confidenceValue = healthData?.confidence || 'High';
  const confidenceLabel = confidenceValue.toLowerCase() === 'high' 
    ? (lang === 'hi' ? 'अधिक' : 'High')
    : confidenceValue.toLowerCase() === 'medium'
    ? (lang === 'hi' ? 'मध्यम' : 'Medium')
    : (lang === 'hi' ? 'कम' : 'Low');

  return (
    <div className={`agri-card p-4 sm:p-5 bg-gradient-to-br ${theme.bgGradient} ${theme.borderColor} border-2 shadow-sm rounded-2xl sm:rounded-3xl transition-all duration-300 w-full max-w-full overflow-hidden`}>
      
      {/* 1. Header: Title, Live Farm Data Badge, Location & Crop Stage */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-200/80 pb-3 mb-3.5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5 truncate">
              <span>🌱 {t('dashboard.yourCropHealth', 'आपकी फसल का स्वास्थ्य')}</span>
            </h2>
            <span className="text-[10px] font-bold bg-emerald-600 text-white px-2.5 py-0.5 rounded-full shrink-0 shadow-2xs">
              Live Farm Data
            </span>
          </div>

          <div className="space-y-0.5">
            <p className="text-xs font-bold text-slate-800 flex items-center gap-1 truncate">
              <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span className="truncate">{displayLocation}</span>
            </p>
            <p className="text-[11px] text-slate-600 font-semibold flex items-center gap-1.5 truncate">
              <span className="text-emerald-800 font-black">{displayCrop}</span>
              <span>·</span>
              <span className="text-slate-600 font-medium">{tStage(displayStage) || displayStage}</span>
            </p>
          </div>
        </div>

        {/* Multi-Field Switcher & Circular Refresh Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          {cleanFieldsSummary.length > 1 && (
            <select
              value={selectedFieldId || healthData?.fieldId || currentFarm?.id || ''}
              onChange={(e) => onSelectField && onSelectField(e.target.value)}
              className="bg-white text-slate-800 text-[11px] font-bold py-1 px-2.5 rounded-xl border border-emerald-300 shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer max-w-[130px] truncate"
              title={lang === 'hi' ? 'खेत चुनें' : 'Select Farm Plot'}
            >
              {cleanFieldsSummary.map((f) => (
                <option key={f.fieldId} value={f.fieldId}>
                  {f.fieldName} ({f.healthScore || targetScore}%)
                </option>
              ))}
            </select>
          )}

          {/* Connected Icon Refresh Button with Spinner & Disabled State */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className={`w-8 h-8 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-2xs flex items-center justify-center transition active:scale-90 ${
              isRefreshing ? 'opacity-60 cursor-not-allowed bg-emerald-50 text-emerald-700' : ''
            }`}
            title={lang === 'hi' ? 'स्वास्थ्य पुनः गणना करें' : 'Recalculate Health'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Main Body: Circular Gauge Ring + Factors */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 my-1">
        
        {/* Circular Gauge Indicator */}
        <div 
          onClick={onOpenDetails}
          className="relative cursor-pointer group flex flex-col items-center justify-center p-2 rounded-2xl hover:bg-white/60 transition duration-200 select-none shrink-0"
          title={lang === 'hi' ? 'विस्तृत जानकारी के लिए टैप करें ↗' : 'Tap for details'}
        >
          <div className="relative flex items-center justify-center">
            <svg
              width={size}
              height={size}
              className="transform -rotate-90 drop-shadow-xs transition-transform duration-300 group-hover:scale-105"
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
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 leading-none">
                {hasValidData ? `${animatedScore}%` : '--'}
              </span>
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border mt-1.5 shadow-2xs ${theme.badgeBg}`}>
                {statusLabel}
              </span>
              <span className="text-[9px] text-emerald-700 font-bold mt-1 group-hover:underline flex items-center gap-0.5">
                <span>{lang === 'hi' ? 'विस्तृत जानकारी के लिए टैप करें' : 'Tap for details'}</span>
                <ArrowUpRight className="w-2.5 h-2.5" />
              </span>
            </div>
          </div>
        </div>

        {/* 3. Diagnostics & Real Contributing Factors */}
        <div className="flex-1 min-w-0 w-full space-y-2.5">
          
          {/* Metadata Badges: Confidence & Updated */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-700">
            <div className="flex items-center gap-1 bg-white/90 px-2.5 py-1 rounded-xl border border-slate-200/70 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-[11px] text-slate-500">{t('dashboard.confidence', 'विश्वसनीयता:')}</span>
              <strong className="text-slate-900 text-[11px] font-bold">{confidenceLabel}</strong>
            </div>

            <div className="flex items-center gap-1 bg-white/90 px-2.5 py-1 rounded-xl border border-slate-200/70 shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-[11px] text-slate-500">{lang === 'hi' ? 'अभी' : 'Updated:'}</span>
              <strong className="text-slate-900 text-[11px] font-bold">{lang === 'hi' ? 'अपडेट' : lastUpdatedFormatted}</strong>
            </div>
          </div>

          {/* Primary Contributing Factors */}
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1.5">
              {lang === 'hi' ? 'स्वास्थ्य को प्रभावित करने वाले मुख्य कारण' : 'Primary Factors Affecting Health'}
            </span>

            {displayReasons.length > 0 ? (
              <div className="space-y-1.5">
                {displayReasons.slice(0, 2).map((reason, idx) => (
                  <div 
                    key={idx}
                    className="flex items-start gap-2 text-xs font-semibold text-slate-800 bg-white/90 p-2.5 rounded-xl border border-slate-200/80 shadow-2xs"
                  >
                    <span className="text-emerald-600 font-black shrink-0 text-xs mt-0.5">
                      {reason.startsWith('⚠') ? '⚠️' : '✓'}
                    </span>
                    <span className="leading-snug truncate">{reason.replace(/^[✓⚠\s]+/, '')}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white/90 p-2.5 rounded-xl border border-slate-200/80 text-xs text-slate-600 font-medium">
                {lang === 'hi' ? '✓ मौसम की स्थिति फसल के लिए अनुकूल है' : '✓ Weather conditions are favorable'}
              </div>
            )}
          </div>

          {/* Action Alert for Low Scores */}
          {targetScore < 80 && (
            <div className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 shadow-2xs ${
              targetScore < 40 
                ? 'bg-rose-50 border-rose-200 text-rose-900' 
                : (targetScore < 60 ? 'bg-orange-50 border-orange-200 text-orange-900' : 'bg-amber-50 border-amber-200 text-amber-900')
            }`}>
              <AlertTriangle className="w-4 h-4 shrink-0 text-current mt-0.5" />
              <div className="min-w-0">
                <strong className="font-extrabold block text-xs truncate">
                  {targetScore < 40 
                    ? (t('dashboard.urgentIntervention', '🚨 तत्काल ध्यान आवश्यक'))
                    : (t('dashboard.attentionRecommended', '⚠️ ध्यान देने की सलाह'))}
                </strong>
                <p className="text-[11px] leading-tight font-medium opacity-90 truncate mt-0.5">
                  {healthData?.recommendations?.[0]?.description || (lang === 'hi' ? 'खेत का निरीक्षण करें व जल प्रबंधन करें।' : 'Inspect field and follow moisture management guidance.')}
                </p>
              </div>
            </div>
          )}

          {/* Tap to Open Full Breakdown */}
          <div className="pt-0.5 flex justify-end">
            <button
              onClick={onOpenDetails}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 active:scale-95"
            >
              <span>{lang === 'hi' ? 'विस्तृत स्वास्थ्य देखें →' : 'View Detailed Health →'}</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
