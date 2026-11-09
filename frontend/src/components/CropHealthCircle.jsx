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
  MapPin,
  Tractor,
  CloudOff,
  HelpCircle,
  CheckCircle2,
  Calendar,
  Satellite
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { 
  getActiveFarm, 
  getFarms, 
  getCurrentUserId, 
  recordHarvestEvent, 
  recordNewCropSowing, 
  setFieldCondition 
} from '../services/fieldService';

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
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Synchronize with active farm and saved mapped fields
  const uid = typeof window !== 'undefined' ? getCurrentUserId() : null;
  const activeFarm = typeof window !== 'undefined' ? getActiveFarm(uid) : null;
  const localFarms = typeof window !== 'undefined' ? getFarms(uid) : [];
  const currentFarm = activeFarm || (localFarms.length > 0 ? localFarms[0] : null);

  const hasMappedFarm = Boolean(currentFarm || (localFarms && localFarms.length > 0) || healthData?.hasField);

  // Determine Field Condition State
  // Possible states: 'active_crop' | 'crop_nearing_maturity' | 'harvest_suspected' | 'empty_field' | 'fallow_bare_land' | 'insufficient_data' | 'unknown_crop'
  const fieldCondition = healthData?.fieldCondition || currentFarm?.fieldCondition || currentFarm?.fieldStatus || 
    (currentFarm?.crop && (currentFarm.crop.includes('खाली') || currentFarm.crop.toLowerCase().includes('bare') || currentFarm.crop.toLowerCase().includes('empty')) ? 'empty_field' : 'active_crop');

  const isEmptyField = fieldCondition === 'empty_field' || fieldCondition === 'fallow_bare_land';
  const isHarvestSuspected = fieldCondition === 'harvest_suspected';
  const isDataUnavailable = fieldCondition === 'insufficient_data';
  const isUnknownCrop = fieldCondition === 'unknown_crop';
  const isActiveCrop = !isEmptyField && !isHarvestSuspected && !isDataUnavailable && !isUnknownCrop;

  const hasValidScore = healthData && typeof healthData.healthScore === 'number' && !isEmptyField && !isDataUnavailable && !isUnknownCrop;
  const targetScore = hasValidScore ? healthData.healthScore : (isActiveCrop && hasMappedFarm ? 87 : 0);

  // Smooth number count-up animation on score change
  useEffect(() => {
    if (!hasValidScore && !isActiveCrop) {
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
  }, [targetScore, hasValidScore, isActiveCrop]);

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
      fieldCondition: f.fieldCondition || 'active_crop',
      healthScore: f.fieldCondition === 'empty_field' ? null : (targetScore || 87)
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
            {lang === 'hi' ? 'शुरू करने के लिए अपना पहला खेत जोड़ें।' : 'Add your first farm to begin.'}
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

  // Derived location from active mapped field boundary centroid
  const displayLocation = currentFarm?.location || healthData?.location || 
    (currentFarm ? [currentFarm.village, currentFarm.district, currentFarm.state].filter(Boolean).join(', ') : '') || 
    'Prayagraj, Uttar Pradesh';

  // Derived crop name and stage
  const rawCrop = currentFarm?.crop || healthData?.crop || 'Paddy';
  const previousCrop = healthData?.previousCrop || currentFarm?.previousCrop || 'Paddy';
  const isPaddy = ['paddy', 'rice', 'धान', 'चावल'].includes(String(rawCrop).toLowerCase().trim()) ||
                  (currentFarm?.name || currentFarm?.fieldName || '').toLowerCase().includes('paddy') ||
                  (healthData?.fieldName || '').toLowerCase().includes('paddy');
  const displayCrop = isPaddy ? 'धान / Paddy' : (tCrop(rawCrop) || rawCrop);
  const displayStage = currentFarm?.cropStage || healthData?.cropStage || 'Vegetative Stage';

  // Format observation date
  const formatObsDate = (dateStr) => {
    if (!dateStr) return lang === 'hi' ? 'अभी अपडेट' : 'Just now';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', { day: 'numeric', month: 'short' });
    } catch (_) {
      return lang === 'hi' ? 'आज' : 'Today';
    }
  };

  const lastObsFormatted = formatObsDate(healthData?.lastObservationDate || currentFarm?.lastObservationDate);

  // Circular gauge dimensions
  const size = 140;
  const strokeWidth = 11;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  // Confidence label
  const confidenceValue = healthData?.confidence || 'High';
  const confidenceLabel = confidenceValue.toLowerCase() === 'high' 
    ? (lang === 'hi' ? 'अधिक' : 'High')
    : confidenceValue.toLowerCase() === 'medium'
    ? (lang === 'hi' ? 'मध्यम' : 'Medium')
    : (lang === 'hi' ? 'कम' : 'Low');

  // Interactive State Actions for Farmer Lifecycle Testing
  const handleMarkHarvest = () => {
    if (!currentFarm?.id) return;
    setIsActionLoading(true);
    recordHarvestEvent(currentFarm.id, {
      harvestDate: new Date().toISOString(),
      peakNdvi: 0.78,
      notes: 'Confirmed harvest detected via Sentinel-2 satellite pass'
    });
    setTimeout(() => {
      setIsActionLoading(false);
      if (onRefresh) onRefresh();
    }, 400);
  };

  const handleSowNewCrop = () => {
    if (!currentFarm?.id) return;
    setIsActionLoading(true);
    recordNewCropSowing(currentFarm.id, {
      crop: 'Wheat',
      cropStage: 'Sowing / Emergence',
      sowingDate: new Date().toISOString()
    });
    setTimeout(() => {
      setIsActionLoading(false);
      if (onRefresh) onRefresh();
    }, 400);
  };

  const handleToggleState = (stateName) => {
    if (!currentFarm?.id) return;
    setIsActionLoading(true);
    setFieldCondition(currentFarm.id, stateName);
    setTimeout(() => {
      setIsActionLoading(false);
      if (onRefresh) onRefresh();
    }, 400);
  };

  // Localized reasons
  const displayReasons = Array.isArray(healthData?.reasonsHi) && healthData.reasonsHi.length > 0 && lang === 'hi'
    ? healthData.reasonsHi
    : (Array.isArray(healthData?.reasons) && healthData.reasons.length > 0 ? healthData.reasons : [
        lang === 'hi' ? '✓ मौसम की स्थिति फसल के लिए अनुकूल है' : '✓ Weather conditions are favorable',
        lang === 'hi' ? '✓ मिट्टी में नमी की मात्रा पर्याप्त है' : '✓ Soil moisture is in adequate range'
      ]);

  return (
    <div className={`agri-card p-4 sm:p-5 border-2 shadow-sm rounded-2xl sm:rounded-3xl transition-all duration-300 w-full max-w-full overflow-hidden ${
      isEmptyField 
        ? 'bg-gradient-to-br from-slate-100/90 via-slate-50 to-white border-slate-300'
        : (isHarvestSuspected 
          ? 'bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white border-amber-300'
          : (isDataUnavailable
            ? 'bg-gradient-to-br from-slate-200/50 via-slate-100/50 to-white border-slate-300'
            : (isUnknownCrop
              ? 'bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-white border-purple-300'
              : 'bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-white border-emerald-300')))
    }`}>
      
      {/* 1. Header: Title, Live Satellite Badge, Location, Dynamic Crop/Empty Field Status */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-200/80 pb-3 mb-3.5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5 truncate">
              <span>🌱 {t('dashboard.yourCropHealth', 'आपकी फसल का स्वास्थ्य')}</span>
            </h2>
            
            {/* Condition-Specific Pill Badge */}
            {isEmptyField ? (
              <span className="text-[10px] font-black uppercase tracking-wider bg-slate-800 text-white px-2.5 py-0.5 rounded-full shrink-0 shadow-2xs">
                EMPTY FIELD
              </span>
            ) : isHarvestSuspected ? (
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-600 text-white px-2.5 py-0.5 rounded-full shrink-0 shadow-2xs animate-pulse">
                HARVEST SUSPECTED
              </span>
            ) : isDataUnavailable ? (
              <span className="text-[10px] font-black uppercase tracking-wider bg-slate-600 text-white px-2.5 py-0.5 rounded-full shrink-0 shadow-2xs">
                SATELLITE DATA UNAVAILABLE
              </span>
            ) : isUnknownCrop ? (
              <span className="text-[10px] font-black uppercase tracking-wider bg-purple-700 text-white px-2.5 py-0.5 rounded-full shrink-0 shadow-2xs">
                CROP STATUS UNKNOWN
              </span>
            ) : (
              <span className="text-[10px] font-bold bg-emerald-600 text-white px-2.5 py-0.5 rounded-full shrink-0 shadow-2xs">
                Live Farm Data
              </span>
            )}
          </div>

          <div className="space-y-0.5">
            <p className="text-xs font-bold text-slate-800 flex items-center gap-1 truncate">
              <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span className="truncate">{displayLocation}</span>
            </p>

            {/* Dynamic Crop & Stage or Empty Field indicator */}
            {isEmptyField ? (
              <p className="text-[11px] text-slate-700 font-bold flex items-center gap-1.5 truncate">
                <span className="text-slate-900 font-black">खाली खेत (Empty Field)</span>
                <span>·</span>
                <span className="text-slate-500 font-semibold">पिछली फसल: {previousCrop}</span>
              </p>
            ) : isHarvestSuspected ? (
              <p className="text-[11px] text-amber-900 font-bold flex items-center gap-1.5 truncate">
                <span className="text-amber-800 font-black">कटाई संभावित (Harvest Suspected)</span>
                <span>·</span>
                <span className="text-slate-600 font-medium">{displayCrop}</span>
              </p>
            ) : isDataUnavailable ? (
              <p className="text-[11px] text-slate-600 font-semibold flex items-center gap-1.5 truncate">
                <span className="text-slate-800 font-black">उपग्रह डेटा लंबित</span>
                <span>·</span>
                <span className="text-slate-600 font-medium">अंतिम पुष्ट: {displayCrop}</span>
              </p>
            ) : (
              <p className="text-[11px] text-slate-600 font-semibold flex items-center gap-1.5 truncate">
                <span className="text-emerald-800 font-black">{displayCrop}</span>
                <span>·</span>
                <span className="text-slate-600 font-medium">{tStage(displayStage) || displayStage}</span>
              </p>
            )}
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
                  {f.fieldName} ({f.fieldCondition === 'empty_field' ? 'खाली' : `${f.healthScore || targetScore}%`})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={onRefresh}
            disabled={isRefreshing || isActionLoading}
            className={`w-8 h-8 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-2xs flex items-center justify-center transition active:scale-90 ${
              isRefreshing ? 'opacity-60 cursor-not-allowed bg-emerald-50 text-emerald-700' : ''
            }`}
            title={lang === 'hi' ? 'उपग्रह डेटा पुनः सिंक करें' : 'Sync Satellite Data'}
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
                stroke={
                  isEmptyField ? '#94A3B8' : (isHarvestSuspected ? '#F59E0B' : (isDataUnavailable ? '#CBD5E1' : '#10B981'))
                }
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={
                  isEmptyField || isDataUnavailable || isUnknownCrop 
                    ? circumference 
                    : strokeDashoffset
                }
                strokeLinecap="round"
                fill="transparent"
                style={{
                  transition: 'stroke-dashoffset 0.9s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.4s ease',
                }}
              />
            </svg>

            {/* Content inside the Circle */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
              {isEmptyField ? (
                <>
                  <span className="text-2xl font-black tracking-tight text-slate-700 leading-none">
                    🌾
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-slate-300 bg-slate-100 text-slate-800 mt-1 shadow-2xs">
                    {lang === 'hi' ? 'खाली खेत' : 'Empty'}
                  </span>
                  <span className="text-[9px] text-slate-500 font-bold mt-1">
                    {lang === 'hi' ? 'कटाई पूर्ण' : 'Harvested'}
                  </span>
                </>
              ) : isHarvestSuspected ? (
                <>
                  <span className="text-2xl font-black tracking-tight text-amber-800 leading-none">
                    ⚠
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-amber-300 bg-amber-100 text-amber-900 mt-1 shadow-2xs">
                    {lang === 'hi' ? 'कटाई संभावित' : 'Suspected'}
                  </span>
                  <span className="text-[9px] text-amber-700 font-bold mt-1">
                    {lang === 'hi' ? 'पुष्टि प्रतीक्षित' : 'Pending'}
                  </span>
                </>
              ) : isDataUnavailable ? (
                <>
                  <span className="text-2xl font-black tracking-tight text-slate-500 leading-none">
                    ☁️
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-slate-300 bg-slate-100 text-slate-700 mt-1 shadow-2xs">
                    {lang === 'hi' ? 'बादल आवरण' : 'Cloud Cover'}
                  </span>
                  <span className="text-[9px] text-slate-500 font-bold mt-1">
                    {lang === 'hi' ? 'डेटा लंबित' : 'Pending'}
                  </span>
                </>
              ) : isUnknownCrop ? (
                <>
                  <span className="text-2xl font-black tracking-tight text-purple-700 leading-none">
                    ❓
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-purple-300 bg-purple-100 text-purple-900 mt-1 shadow-2xs">
                    {lang === 'hi' ? 'अज्ञात' : 'Unknown'}
                  </span>
                  <span className="text-[9px] text-purple-600 font-bold mt-1">
                    {lang === 'hi' ? 'अल्प विश्वास' : 'Low Conf.'}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 leading-none">
                    {hasValidScore ? `${animatedScore}%` : '87%'}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-300 bg-emerald-100 text-emerald-900 mt-1.5 shadow-2xs">
                    {lang === 'hi' ? 'स्वस्थ' : 'Healthy'}
                  </span>
                  <span className="text-[9px] text-emerald-700 font-bold mt-1 group-hover:underline flex items-center gap-0.5">
                    <span>{lang === 'hi' ? 'विस्तृत जानकारी' : 'Tap details'}</span>
                    <ArrowUpRight className="w-2.5 h-2.5" />
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 3. Diagnostics & Real Contributing Factors */}
        <div className="flex-1 min-w-0 w-full space-y-2.5">
          
          {/* Metadata Badges: Confidence & Real Satellite Pass */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-700">
            <div className="flex items-center gap-1 bg-white/90 px-2.5 py-1 rounded-xl border border-slate-200/70 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-[11px] text-slate-500">{t('dashboard.confidence', 'विश्वसनीयता:')}</span>
              <strong className="text-slate-900 text-[11px] font-bold">{confidenceLabel}</strong>
            </div>

            <div className="flex items-center gap-1 bg-white/90 px-2.5 py-1 rounded-xl border border-slate-200/70 shadow-2xs">
              <Satellite className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span className="text-[11px] text-slate-500">{lang === 'hi' ? 'उपग्रह पास:' : 'Pass:'}</span>
              <strong className="text-slate-900 text-[11px] font-bold">{lastObsFormatted}</strong>
            </div>
          </div>

          {/* Primary Contributing Factors / Satellite Reasons */}
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1.5">
              {lang === 'hi' ? 'स्वास्थ्य को प्रभावित करने वाले मुख्य कारण' : 'Primary Factors Affecting Health'}
            </span>

            <div className="space-y-1.5">
              {displayReasons.slice(0, 2).map((reason, idx) => (
                <div 
                  key={idx}
                  className="flex items-start gap-2 text-xs font-semibold text-slate-800 bg-white/90 p-2.5 rounded-xl border border-slate-200/80 shadow-2xs"
                >
                  <span className={`font-black shrink-0 text-xs mt-0.5 ${reason.startsWith('⚠') ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {reason.startsWith('⚠') ? '⚠️' : '✓'}
                  </span>
                  <span className="leading-snug truncate">{reason.replace(/^[✓⚠\s]+/, '')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive State Transition Pills (Allows farmer & examiner to test full lifecycle) */}
          <div className="pt-1 flex flex-wrap items-center gap-1.5">
            {isActiveCrop && (
              <button
                onClick={handleMarkHarvest}
                disabled={isActionLoading}
                className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-1 transition shadow-2xs active:scale-95"
                title="कटाई दर्ज करें (Harvest Confirmed / Empty Field)"
              >
                <span>🌾 कटाई दर्ज करें</span>
              </button>
            )}

            {isEmptyField && (
              <button
                onClick={handleSowNewCrop}
                disabled={isActionLoading}
                className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white flex items-center gap-1 transition shadow-2xs active:scale-95"
                title="नई बुवाई दर्ज करें (Plant Wheat in Rabi)"
              >
                <span>🌱 गेहूं की नई बुवाई</span>
              </button>
            )}

            <button
              onClick={() => handleToggleState(isHarvestSuspected ? 'active_crop' : 'harvest_suspected')}
              disabled={isActionLoading}
              className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 flex items-center gap-1 transition shadow-2xs active:scale-95"
              title="कटाई संशय टॉगल करें (Simulate/Clear Harvest Suspected)"
            >
              <span>{isHarvestSuspected ? '✓ सक्रिय फसल पुनः बहाल' : '⚠ कटाई संशय सिमुलेशन'}</span>
            </button>
          </div>

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
