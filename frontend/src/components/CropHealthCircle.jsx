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
  const { lang, t, tCrop, tStage } = useLanguage();
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

  // If farmer has NOT added a field/crop yet:
  if (!hasValidData && fieldsSummary.length === 0) {
    return (
      <div className="agri-card p-5 sm:p-7 bg-gradient-to-br from-emerald-50/90 via-white to-agri-50/90 border-2 border-dashed border-emerald-300 text-center rounded-2xl sm:rounded-3xl shadow-xs space-y-3.5 w-full max-w-full overflow-hidden">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white flex items-center justify-center mx-auto text-2xl shadow-sm">
          <Sprout className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">
            🌱 {t('dashboard.cropHealth', 'फसल स्वास्थ्य')}
          </h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto mt-1 leading-relaxed font-medium">
            {t('dashboard.addInfoPrompt', 'फसल स्वास्थ्य निगरानी शुरू करने के लिए अपने खेत और फसल की जानकारी जोड़ें।')}
          </p>
        </div>
        <button
          onClick={onAddField || (() => { window.location.hash = '#/field-mapping'; })}
          className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs shadow-xs transition transform active:scale-95 inline-flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t('farm.addField', 'खेत जोड़ें')}</span>
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

  // Compact circular gauge dimensions for mobile
  const size = 140;
  const strokeWidth = 11;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  // Format real timestamp
  const formatTimestamp = (dateStr) => {
    if (!dateStr) return t('common.justNow', 'अभी');
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (_) {
      return t('common.today', 'आज');
    }
  };

  const lastUpdatedFormatted = formatTimestamp(healthData?.calculatedAt);

  // Localized reasons from actual data
  const displayReasons = (lang === 'hi' && Array.isArray(healthData?.reasonsHi) && healthData.reasonsHi.length > 0)
    ? healthData.reasonsHi
    : (healthData?.reasons || []);

  const confidenceValue = healthData?.confidence || 'High';
  const confidenceLabel = confidenceValue.toLowerCase() === 'high' 
    ? (lang === 'hi' ? 'अधिक' : 'High')
    : confidenceValue.toLowerCase() === 'medium'
    ? (lang === 'hi' ? 'मध्यम' : 'Medium')
    : (lang === 'hi' ? 'कम' : 'Low');

  return (
    <div className={`agri-card p-4 sm:p-5 bg-gradient-to-br ${theme.bgGradient} ${theme.borderColor} border-2 shadow-sm rounded-2xl sm:rounded-3xl transition-all duration-300 w-full max-w-full overflow-hidden`}>
      
      {/* 1. Header: Title, Field Info & Refresh Icon Button */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-200/80 pb-3 mb-3.5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5 truncate">
              <span>🌱 {t('dashboard.yourCropHealth', 'आपकी फसल का स्वास्थ्य')}</span>
            </h2>
            <span className="text-[9px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full shrink-0 shadow-2xs">
              {t('common.realData', 'वास्तविक डेटा')}
            </span>
          </div>

          <p className="text-[11px] text-slate-600 font-semibold flex items-center gap-1 truncate">
            <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="truncate">{healthData?.fieldName || 'Plot A'}</span>
            <span>•</span>
            <span className="text-emerald-800 font-bold">{tCrop(healthData?.crop) || healthData?.crop || 'Wheat'}</span>
            <span className="text-slate-500 font-normal">({tStage(healthData?.cropStage) || healthData?.cropStage || 'Vegetative'})</span>
          </p>
        </div>

        {/* Multi-Field Switcher & Circular Refresh Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          {fieldsSummary.length > 1 && (
            <select
              value={selectedFieldId || healthData?.fieldId || ''}
              onChange={(e) => onSelectField && onSelectField(e.target.value)}
              className="bg-white text-slate-800 text-[11px] font-bold py-1 px-2 rounded-xl border border-slate-300 shadow-2xs focus:outline-none cursor-pointer max-w-[110px] truncate"
              title="Select Field Plot"
            >
              {fieldsSummary.map((f) => (
                <option key={f.fieldId} value={f.fieldId}>
                  {f.fieldName} ({f.healthScore}%)
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

      {/* 2. Compact Main Body: Gauge Ring + Status Diagnostics */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 my-1">
        
        {/* Compact Circular Ring Indicator */}
        <div 
          onClick={onOpenDetails}
          className="relative cursor-pointer group flex flex-col items-center justify-center p-2 rounded-2xl hover:bg-white/60 transition duration-200 select-none shrink-0"
          title={t('dashboard.tapForDetails', 'विस्तृत जानकारी के लिए टैप करें')}
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
                {animatedScore}%
              </span>
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border mt-1.5 shadow-2xs ${theme.badgeBg}`}>
                {statusLabel}
              </span>
              <span className="text-[9px] text-emerald-700 font-bold mt-1 group-hover:underline flex items-center gap-0.5">
                <span>{t('dashboard.tapForDetails', 'विवरण देखें')}</span>
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
              <span className="text-[11px] text-slate-500">{t('dashboard.updated', 'अपडेट:')}</span>
              <strong className="text-slate-900 text-[11px] font-bold">{lastUpdatedFormatted}</strong>
            </div>
          </div>

          {/* Primary Contributing Factors */}
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">
              {t('dashboard.primaryFactors', 'मुख्य कारण')}
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
                {t('dashboard.allStable', 'फसल की स्थिति सामान्य व स्थिर है।')}
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
              <span>{t('dashboard.viewDetailedHealth', 'विस्तृत स्वास्थ्य देखें')}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
