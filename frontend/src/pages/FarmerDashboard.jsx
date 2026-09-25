import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import CropCard from '../components/CropCard';
import WeatherWidget from '../components/WeatherWidget';
import ActionPlanChecklist from '../components/ActionPlanChecklist';
import VoiceReader from '../components/VoiceReader';
import QuickActionBtn from '../components/QuickActionBtn';
import {
  MOCK_PROFILE,
  MOCK_FARM,
  MOCK_CURRENT_CROP,
  MOCK_CROPS,
  MOCK_WEATHER,
  MOCK_OUTBREAKS,
  MOCK_ACTION_PLANS,
  MOCK_ALERTS,
  generateMockScanResult,
} from '../services/mockFallback';
import { 
  ScanLine, 
  Sparkles, 
  CloudSun, 
  Layers, 
  Bell, 
  ArrowRight, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Calculator,
  Satellite,
  Building2,
  DollarSign,
  Radio,
  History,
  Clock,
  Activity,
  Check,
  Map
} from 'lucide-react';
import { fetchCropHistoryStats } from '../services/cropScanService';
import { 
  fetchMonitoringDashboardSummary,
  fetchFieldActions,
  updateActionStatus,
  triggerMonitoringRun
} from '../services/fieldMonitoringService';
import CropHealthCircle from '../components/CropHealthCircle';
import CropHealthModal from '../components/CropHealthModal';
import { 
  fetchLatestCropHealth, 
  fetchCropHealthSummary, 
  recalculateCropHealth,
  calculateCropHealth
} from '../services/cropHealthService';

const safeParse = (key) => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
};

const safeSet = (key, val) => {
  if (typeof window === 'undefined') return;
  try {
    if (val) localStorage.setItem(key, JSON.stringify(val));
  } catch (_) {}
};

const getInitialDashboardData = (user) => {
  const userId = user?.id || user?._id;
  const userCacheKey = userId ? `krishi_dash_cache_${userId}` : 'krishi_dash_cache';
  const cached = safeParse(userCacheKey) || safeParse('krishi_dash_cache');
  const activeFarm = safeParse('krishi_active_field') || safeParse('farm_data');
  const isDemo = user?.phone === '9876543210' || (typeof window !== 'undefined' && localStorage.getItem('krishi_demo_role') === 'farmer');

  if (!isDemo && cached && cached.farmer?.id === userId) {
    const base = { ...cached };
    if (user?.name) {
      base.farmer = { ...base.farmer, name: user.name, id: userId };
    }
    return base;
  }

  // If real user (not demo) and no cache yet, return clean real user state
  if (!isDemo && user) {
    const userProfile = safeParse('krishi_profile');
    const userFarm = safeParse('krishi_farm');
    const userCurrentCrop = safeParse('krishi_current_crop');

    return {
      farmer: { id: userId, name: user.name || 'Farmer', phone: user.phone || '' },
      profile: userProfile || null,
      farm: userFarm || null,
      currentCrop: userCurrentCrop || null,
      crops: userCurrentCrop ? [userCurrentCrop] : [],
      healthScore: userCurrentCrop?.healthScore || null,
      pendingTasks: [],
      recentAnalyses: [],
      recentRecommendations: [],
      unreadAlerts: [],
    };
  }

  const base = cached || {
    farmer: { name: 'Rameshwar Patil (रामेश्वर पाटिल)' },
    profile: MOCK_PROFILE,
    farm: MOCK_FARM,
    currentCrop: MOCK_CURRENT_CROP,
    crops: MOCK_CROPS,
    healthScore: null,
    pendingTasks: (MOCK_ACTION_PLANS?.tasks || []).filter((p) => !p.isCompleted),
    recentAnalyses: [generateMockScanResult('Tomato').data],
    recentRecommendations: [
      {
        _id: 'rec_01',
        query: 'Early blight control',
        aiResponse: 'Spray Mancozeb 75 WP or Neem Oil',
        createdAt: new Date().toISOString(),
      },
    ],
    unreadAlerts: MOCK_ALERTS,
  };

  if (activeFarm) {
    base.farm = {
      ...base.farm,
      name: activeFarm.name || activeFarm.fieldName || base.farm.name,
      totalArea: parseFloat(activeFarm.farmArea || activeFarm.areaAcres || base.farm.totalArea),
      location: activeFarm.location || base.farm.location,
      latitude: activeFarm.latitude || activeFarm.center?.lat || base.farm.latitude,
      longitude: activeFarm.longitude || activeFarm.center?.lng || base.farm.longitude
    };
    if (activeFarm.crop) {
      base.currentCrop = {
        ...base.currentCrop,
        name: activeFarm.crop
      };
    }
  }

  return base;
};

export default function FarmerDashboard({ setActiveTab }) {
  const { user } = useAuth();
  const { lang, t, tCrop, tStage, tSoil, tMoisture, tWeather } = useLanguage();
  const [dashboardData, setDashboardData] = useState(() => getInitialDashboardData(user));

  // Re-sync dashboard state immediately when authenticated user changes
  useEffect(() => {
    if (user) {
      setDashboardData(getInitialDashboardData(user));
    }
  }, [user?.id, user?._id]);
  const [weatherData, setWeatherData] = useState(() => safeParse('krishi_weather_cache') || MOCK_WEATHER);
  const [mandiSpotlight, setMandiSpotlight] = useState(() => safeParse('krishi_mandi_cache') || null);
  const [outbreakAlerts, setOutbreakAlerts] = useState(() => safeParse('krishi_outbreak_cache') || MOCK_OUTBREAKS);
  const [historyStats, setHistoryStats] = useState(null);
  const [monitoringSummaries, setMonitoringSummaries] = useState([]);
  const [fieldActions, setFieldActions] = useState([]);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [isManualRunning, setIsManualRunning] = useState(false);
  const [loading, setLoading] = useState(false);

  // Real-Time Crop Health States: calculate synchronously on initial load so it renders immediately!
  const [cropHealthData, setCropHealthData] = useState(() => {
    const cached = safeParse('krishi_crop_health_cache');
    if (cached && typeof cached.healthScore === 'number') return cached;
    const initialDash = getInitialDashboardData();
    return calculateCropHealth('default', {
      farm: initialDash.farm,
      currentCrop: initialDash.currentCrop,
      recentAnalyses: initialDash.recentAnalyses,
      weatherData: safeParse('krishi_weather_cache') || MOCK_WEATHER
    });
  });
  const [healthFieldsSummary, setHealthFieldsSummary] = useState([]);
  const [selectedHealthFieldId, setSelectedHealthFieldId] = useState(null);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [isRecalculatingHealth, setIsRecalculatingHealth] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const [
        dashRes, 
        weatherRes, 
        mandiRes, 
        outbreakRes, 
        historyRes, 
        monitoringRes,
        healthSummaryRes,
        latestHealthRes,
        actionsRes
      ] = await Promise.all([
        api.get('/farmer/dashboard'),
        api.get('/weather'),
        api.get('/mandi/prices?commodity=Tomato'),
        api.get('/tools/outbreaks'),
        fetchCropHistoryStats().catch(() => null),
        fetchMonitoringDashboardSummary().catch(() => []),
        fetchCropHealthSummary().catch(() => []),
        fetchLatestCropHealth(selectedHealthFieldId || 'default', {
          farm: dashboardData?.farm,
          currentCrop: dashboardData?.currentCrop,
          recentAnalyses: dashboardData?.recentAnalyses,
          weatherData
        }).catch(() => null),
        fetchFieldActions('all').catch(() => [])
      ]);

      if (dashRes?.data?.success) {
        setDashboardData(dashRes.data.data);
        const currentUid = user?._id || user?.id || '';
        safeSet(`krishi_dash_cache_${currentUid || 'anonymous'}`, dashRes.data.data);
      }
      if (weatherRes?.data?.success) {
        setWeatherData(weatherRes.data.data);
        safeSet('krishi_weather_cache', weatherRes.data.data);
      }
      if (mandiRes?.data?.success && Array.isArray(mandiRes.data?.data) && mandiRes.data.data.length > 0) {
        setMandiSpotlight(mandiRes.data.data[0]);
        safeSet('krishi_mandi_cache', mandiRes.data.data[0]);
      }
      if (outbreakRes?.data?.success) {
        setOutbreakAlerts(outbreakRes.data);
        safeSet('krishi_outbreak_cache', outbreakRes.data);
      }
      if (historyRes) {
        setHistoryStats(historyRes);
      }
      if (Array.isArray(monitoringRes)) {
        setMonitoringSummaries(monitoringRes);
      }
      if (Array.isArray(actionsRes)) {
        setFieldActions(actionsRes);
      }
      if (Array.isArray(healthSummaryRes) && healthSummaryRes.length > 0) {
        setHealthFieldsSummary(healthSummaryRes);
      }
      if (latestHealthRes && typeof latestHealthRes.healthScore === 'number') {
        setCropHealthData(latestHealthRes);
      }
    } catch (e) {
      console.warn('Dashboard background refresh note:', e.message);
    } finally {
      setLoading(false);
    }
  }, [selectedHealthFieldId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleSelectHealthField = async (fieldId) => {
    setSelectedHealthFieldId(fieldId);
    // Instant dynamic recalculation for selected field
    const immediateData = calculateCropHealth(fieldId, {
      farm: dashboardData?.farm,
      currentCrop: dashboardData?.currentCrop,
      recentAnalyses: dashboardData?.recentAnalyses,
      weatherData
    });
    setCropHealthData(immediateData);

    try {
      const data = await fetchLatestCropHealth(fieldId, {
        farm: dashboardData?.farm,
        currentCrop: dashboardData?.currentCrop,
        recentAnalyses: dashboardData?.recentAnalyses,
        weatherData
      });
      if (data && typeof data.healthScore === 'number') {
        setCropHealthData(data);
      }
    } catch (err) {
      console.warn('Field health switch note:', err);
    }
  };

  const handleRecalculateHealth = async () => {
    setIsRecalculatingHealth(true);
    try {
      const updated = await recalculateCropHealth(selectedHealthFieldId || 'default', {
        farm: dashboardData?.farm,
        currentCrop: dashboardData?.currentCrop,
        recentAnalyses: dashboardData?.recentAnalyses,
        weatherData
      });
      if (updated && typeof updated.healthScore === 'number') {
        setCropHealthData(updated);
      }
      fetchCropHealthSummary().then(res => {
        if (Array.isArray(res) && res.length > 0) setHealthFieldsSummary(res);
      });
    } catch (err) {
      console.error('Recalculate error:', err);
    } finally {
      setIsRecalculatingHealth(false);
    }
  };

  const handleToggleTask = async (taskId) => {
    try {
      await api.put(`/action-plans/${taskId}/toggle`);
      fetchDashboard();
    } catch (e) {
      console.error('Error toggling task:', e);
    }
  };

  const handleCompleteAction = async (actionId) => {
    try {
      setActionLoadingId(actionId);
      await updateActionStatus(actionId, 'completed', 'Action completed by farmer from dashboard');
      const updated = await fetchFieldActions('all').catch(() => []);
      setFieldActions(updated);
      await fetchDashboard();
    } catch (err) {
      console.error('Action completion error:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRunAllMonitoring = async () => {
    if (isManualRunning) return;
    try {
      setIsManualRunning(true);
      if (monitoringSummaries.length > 0) {
        await Promise.all(
          monitoringSummaries.map(f => triggerMonitoringRun(f.fieldId).catch(() => null))
        );
      }
      await fetchDashboard();
    } catch (err) {
      console.warn('Manual monitoring run error:', err);
    } finally {
      setIsManualRunning(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.greetingMorning');
    if (hour < 17) return t('dashboard.greetingAfternoon');
    return t('dashboard.greetingEvening');
  };

  if (loading && !dashboardData) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4">
        <div className="h-20 bg-slate-200 animate-pulse rounded-3xl"></div>
        <div className="h-44 bg-slate-200 animate-pulse rounded-3xl"></div>
        <div className="h-32 bg-slate-200 animate-pulse rounded-3xl"></div>
      </div>
    );
  }

  const { farmer, profile, farm, currentCrop, pendingTasks, recentAnalyses, recentRecommendations, summary } = dashboardData || {};

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-3 sm:py-5 space-y-3.5 sm:space-y-5 pb-28 md:pb-10 overflow-x-hidden">
      
      {/* 1. Brand & Farmer Header Banner */}
      <div className="bg-gradient-to-r from-[#14532d] via-[#166534] to-[#15803d] text-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-emerald-600/30 flex items-center justify-between gap-2.5 relative overflow-hidden w-full max-w-full">
        <div className="relative z-10 flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white border border-white/25 flex items-center justify-center p-0.5 shrink-0 shadow-inner overflow-hidden">
            <img
              src="./logo.png"
              alt="Fasal Drishti Logo"
              className="w-full h-full object-contain rounded-lg sm:rounded-xl"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
              <span className="font-extrabold text-[11px] tracking-wider text-emerald-300 uppercase">
                FASAL DRISHTI
              </span>
              <span className="text-[9px] font-extrabold bg-emerald-400 text-slate-950 px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-950 animate-ping"></span>
                <span>LIVE CONNECTED (ANTIGRAVITY)</span>
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-xs truncate max-w-[170px] sm:max-w-none">
                📍 {[profile?.village, profile?.district, profile?.state].filter(Boolean).join(', ') || t('auth.farmLocationNotSet', 'Farm location not set yet')}
              </span>
            </div>
            <h2 className="text-base sm:text-2xl font-black tracking-tight leading-snug truncate">
              {getGreeting()}{farmer?.name || user?.name ? `, ${farmer?.name || user?.name}` : ''}
            </h2>
            <p className="text-[11px] sm:text-xs text-emerald-100/90 font-medium truncate mt-0.5">
              {farm?.farmName || (farm?.farmSize ? `${farmer?.name || user?.name || 'Farmer'}'s Farm` : t('auth.farmNotAddedYet', 'Farm information not added yet.'))}
              {farm?.farmSize ? ` • ${farm.farmSize} ${farm?.landUnit || 'Acres'}` : ''}
              {farm?.soilType ? ` (${farm.soilType})` : ''}
              {currentCrop?.cropName ? ` • 🌱 ${currentCrop.cropName}` : ''}
            </p>
          </div>
        </div>

        <button
          onClick={fetchDashboard}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/15 hover:bg-white/25 text-white backdrop-blur-xs transition active:rotate-180 flex items-center justify-center shrink-0 shadow-2xs"
          title={lang === 'hi' ? 'डैशबोर्ड रीफ्रेश करें' : 'Refresh Dashboard'}
        >
          <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>

      {/* 2. HOMEPAGE HERO — LARGE CROP HEALTH CIRCLE */}
      <CropHealthCircle
        healthData={cropHealthData}
        fieldsSummary={healthFieldsSummary}
        selectedFieldId={selectedHealthFieldId}
        onSelectField={handleSelectHealthField}
        onOpenDetails={() => setIsHealthModalOpen(true)}
        onRefresh={handleRecalculateHealth}
        onAddField={() => setActiveTab('field-mapping')}
        isRefreshing={isRecalculatingHealth}
      />

      {/* 3. AUTONOMOUS CONTINUOUS MONITORING STATUS BANNER */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 font-bold shrink-0">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <h4 className="font-extrabold text-xs sm:text-sm text-white uppercase tracking-wider">
                {t('dashboard.autonomousMonitoring')}
              </h4>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                {monitoringSummaries.length > 0
                  ? `${monitoringSummaries.length} ${t('dashboard.plotsActive')}`
                  : t('dashboard.onePlotActive')}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5 flex flex-wrap items-center gap-2">
              <span>{t('dashboard.lastCheckedToday')}</span>
              <span>•</span>
              <span>{t('dashboard.nextCheckIn6h')}</span>
              <span>•</span>
              <span className="text-emerald-300 font-semibold">{t('dashboard.dataSourceSummary')}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleRunAllMonitoring}
            disabled={isManualRunning}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isManualRunning ? 'animate-spin' : ''}`} />
            <span>{isManualRunning ? t('dashboard.checking') : t('dashboard.runCheckNow')}</span>
          </button>
        </div>
      </div>

      {/* 4. ⚠️ WHAT NEEDS ACTION? (CLOSED-LOOP PROBLEM -> ACTION -> RESULT LOOP) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 uppercase tracking-wide">
                {t('dashboard.whatNeedsAction')}
              </h3>
              <p className="text-[11px] text-slate-500">
                {lang === 'hi'
                  ? 'स्वतः पहचानी गई समस्याएं एवं समाधान (कार्रवाई के बाद स्वचालित सत्यापन)'
                  : 'Proactively detected issues with closed-loop verification'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('field-monitoring')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>{t('dashboard.viewAllFields')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Dynamic Action Items Feed */}
        {fieldActions && fieldActions.length > 0 ? (
          <div className="space-y-3">
            {fieldActions.map((item) => {
              const isResolved = item.resolutionStatus === 'resolved' || item.status === 'resolved';
              const isVerifying = item.resolutionStatus === 'verifying';
              const isUrgent = item.severity === 'critical' || item.severity === 'high';

              return (
                <div
                  key={item._id}
                  className={`rounded-2xl p-4 sm:p-5 border transition shadow-xs ${
                    isResolved
                      ? 'bg-emerald-50/70 border-emerald-200'
                      : isUrgent
                      ? 'bg-red-50/60 border-red-200'
                      : 'bg-amber-50/60 border-amber-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isResolved
                            ? 'bg-emerald-600 text-white'
                            : isUrgent
                            ? 'bg-red-600 text-white'
                            : 'bg-amber-600 text-white'
                        }`}>
                          {isResolved
                            ? t('farm.problemResolved')
                            : isUrgent
                            ? t('farm.urgentAction')
                            : t('farm.attention')}
                        </span>
                        <span className="font-bold text-xs text-slate-800">
                          {item.fieldName || t('farm.mainField')} • {tCrop(item.crop)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {item.dataSource || '🛰️ Satellite + 🌦️ Weather'}
                        </span>
                      </div>

                      {/* Problem Statement (WHAT) */}
                      <h4 className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug">
                        {lang === 'hi' ? item.problemDescriptionHi || item.problemDescription : item.problemDescription}
                      </h4>

                      {/* Evidence / Reason (WHY) */}
                      {(item.evidenceHi || item.evidence) && (
                        <p className="text-xs text-slate-600 leading-relaxed">
                          <strong>{t('dashboard.why')} </strong>
                          {lang === 'hi' ? item.evidenceHi || item.evidence : item.evidence}
                        </p>
                      )}

                      {/* Recommended Action (ACTION) */}
                      <div className="p-3 rounded-xl bg-white/90 border border-slate-200/80 text-xs text-slate-800 space-y-1 mt-2">
                        <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                          <span>👉</span>
                          <span>{t('dashboard.actionRequired')}</span>
                        </div>
                        <p className="font-medium leading-relaxed">
                          {lang === 'hi' ? item.recommendedActionHi || item.recommendedAction : item.recommendedAction}
                        </p>
                      </div>

                      {/* Verification / Resolution Feedback Note */}
                      {isVerifying && (
                        <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs font-semibold flex items-center gap-2">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-600" />
                          <span>
                            {lang === 'hi'
                              ? 'कार्रवाई दर्ज की गई। अगले निगरानी चक्र में स्थिति सुधरने का सत्यापन होगा।'
                              : 'Action completed. Autonomous engine is monitoring for soil/crop recovery.'}
                          </span>
                        </div>
                      )}

                      {isResolved && (
                        <div className="p-2.5 rounded-xl bg-emerald-100/80 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          <span>
                            {lang === 'hi'
                              ? 'सत्यापित: मिट्टी में नमी सामान्य स्तर पर वापस आ गई है।'
                              : 'Verified: Soil moisture and vegetative indicators restored to optimal range.'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Execution Button (Closed-Loop) */}
                    <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 pt-2 sm:pt-0">
                      {!isResolved && !isVerifying && (
                        <button
                          onClick={() => handleCompleteAction(item._id)}
                          disabled={actionLoadingId === item._id}
                          className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {actionLoadingId === item._id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {item.actionType === 'irrigation'
                              ? t('common.markIrrigationDone')
                              : t('common.markDone')}
                          </span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          if (typeof window !== 'undefined' && item.fieldId) {
                            window.location.hash = `#/field-monitoring?fieldId=${item.fieldId}`;
                          }
                          setActiveTab('field-monitoring');
                        }}
                        className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1"
                      >
                        <span>{t('common.viewField')}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Default Healthy State when no issues detected */
          <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 text-[10px] font-extrabold uppercase">
                    {t('dashboard.allFieldsHealthy')}
                  </span>
                </div>
                <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 mt-0.5">
                  {lang === 'hi'
                    ? 'वर्तमान में किसी आपातकालीन कार्रवाई की आवश्यकता नहीं है।'
                    : 'No critical field actions required today.'}
                </h4>
                <p className="text-[11px] text-slate-600">
                  {lang === 'hi'
                    ? 'मिट्टी की नमी और फसल वृद्धि सामान्य सीमा में है। उपग्रह व मौसम निगरानी स्वतः जारी है।'
                    : 'Moisture reserves, canopy vigor, and weather parameters are within optimal ranges.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('field-monitoring')}
              className="hidden sm:flex px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-emerald-800 border border-emerald-300 text-xs font-bold items-center gap-1.5 transition shadow-2xs"
            >
              <span>{t('dashboard.telemetry')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 5. 8 Quick Action Power Buttons Grid (Moved up for instant farmer access) */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-1">
          <h3 className="font-extrabold text-sm text-slate-900">
            {t('dashboard.quickActions', 'त्वरित सेवाएं')}
          </h3>
          <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
            {t('appTagline', 'From Space to Soil')}
          </span>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          <QuickActionBtn
            icon={ScanLine}
            title={t('nav.diagnose')}
            subtitle={t('common.takePhoto')}
            onClick={() => setActiveTab('diagnose')}
            color="emerald"
          />
          <QuickActionBtn
            icon={Sparkles}
            title={t('nav.advice')}
            subtitle={t('swar.name')}
            onClick={() => setActiveTab('advice')}
            color="amber"
          />
          <QuickActionBtn
            icon={TrendingUp}
            title={t('nav.mandi')}
            subtitle={t('mandi.modalPrice')}
            onClick={() => setActiveTab('mandi')}
            color="teal"
          />
          <QuickActionBtn
            icon={Calculator}
            title={t('dashboard.fertilizer')}
            subtitle={t('dashboard.npkCalc')}
            onClick={() => setActiveTab('fertilizer')}
            color="emerald"
          />
          <QuickActionBtn
            icon={Satellite}
            title={t('dashboard.satellite')}
            subtitle={t('dashboard.ndviRadar')}
            onClick={() => setActiveTab('satellite')}
            color="blue"
          />
          <QuickActionBtn
            icon={Building2}
            title={t('dashboard.schemes')}
            subtitle={t('dashboard.subsidies')}
            onClick={() => setActiveTab('schemes')}
            color="amber"
          />
          <QuickActionBtn
            icon={CloudSun}
            title={t('dashboard.weather')}
            subtitle={t('dashboard.fiveDay')}
            onClick={() => setActiveTab('weather')}
            color="blue"
          />
          <QuickActionBtn
            icon={ShieldAlert}
            title={t('dashboard.outbreak')}
            subtitle={t('dashboard.radar')}
            onClick={() => setActiveTab('outbreak')}
            color="purple"
          />
        </div>
      </div>

      {/* 4. Agro-Weather Forecast (Directly visible near top) */}
      <WeatherWidget
        weatherData={weatherData}
        onSeeFullForecast={() => setActiveTab('weather')}
      />

      {/* 5. Upcoming Tasks & Action Plan */}
      <ActionPlanChecklist
        tasks={pendingTasks}
        onToggleTask={handleToggleTask}
        onSeeAllTasks={() => setActiveTab('plans')}
      />

      {/* 6. Recent AI Crop Scans */}
      {recentAnalyses && recentAnalyses.length > 0 && (
        <div className="agri-card p-5 bg-white border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-slate-900 text-sm">{t('dashboard.recentAnalyses')}</h4>
            <button
              onClick={() => setActiveTab('insights')}
              className="text-xs font-semibold text-agri-700 hover:text-agri-800 flex items-center gap-1"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{t('nav.insights')}</span>
            </button>
          </div>

          <div className="space-y-3">
            {recentAnalyses.map((item) => (
              <div
                key={item._id || item.id || Math.random()}
                onClick={() => setActiveTab('diagnose')}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 flex items-center justify-between gap-3 cursor-pointer transition"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={item.imageUrl || 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22509?w=300&auto=format&fit=crop&q=80'}
                    alt={item.cropName || item.crop || 'Crop'}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22509?w=300&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">
                      {lang === 'hi' ? (item.detectedProblemHi || item.diseaseHi || 'अगेती झुलसा') : (item.detectedProblem || item.disease || 'Early Blight')}
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      {item.cropName || item.crop || 'Tomato'} • {item.confidence || '94.6%'} Confidence
                    </p>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                  item.severity === 'Critical' || item.severity === 'High'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {item.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Other existing sections: Live Field Mapping, Mandi & Satellite Live Tickers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        {/* Field Intelligence Spotlight */}
        <div 
          onClick={() => setActiveTab('field-mapping')}
          className="agri-card p-3.5 bg-gradient-to-r from-emerald-950 to-[#12381F] text-white border-emerald-700/60 shadow-sm cursor-pointer hover:border-emerald-400 transition"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 flex items-center gap-1">
              <Map className="w-3 h-3" />
              Field Intelligence
            </span>
            <span className="text-[9px] bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 font-bold px-2 py-0.5 rounded-full">
              GPS Spatial ✓
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <h5 className="font-bold text-xs">Farm Boundary & Crop Area</h5>
              <p className="text-[11px] text-emerald-200/80">Satellite Map & Live Polygon</p>
            </div>
            <span className="text-xs font-bold text-emerald-300 underline">Map →</span>
          </div>
        </div>

        {/* Mandi Spotlight */}
        <div 
          onClick={() => setActiveTab('mandi')}
          className="agri-card p-3.5 bg-gradient-to-r from-emerald-900 to-slate-900 text-white border-emerald-700/50 shadow-sm cursor-pointer hover:border-emerald-400 transition"
        >
          {mandiSpotlight ? (
            <>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {t('dashboard.mandiSpotlight')}
                </span>
                <span className="text-[9px] bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 font-bold px-2 py-0.5 rounded-full">
                  Govt Data ✓
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <h5 className="font-bold text-xs">{mandiSpotlight.commodityHi || mandiSpotlight.commodity} ({mandiSpotlight.market})</h5>
                  <p className="text-[11px] text-emerald-200/80">Range: ₹{mandiSpotlight.minPrice} - ₹{mandiSpotlight.maxPrice}</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-amber-300">₹{mandiSpotlight.modalPrice}</span>
                  <span className="text-[10px] text-emerald-300 block">/ Quintal</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between py-1">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {t('dashboard.mandiSpotlight')}
                </span>
                <p className="text-xs font-bold text-white mt-0.5">Live APMC Mandi Rates</p>
                <p className="text-[10px] text-emerald-300/80">Official Government of India Data</p>
              </div>
              <span className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl">
                View Rates →
              </span>
            </div>
          )}
        </div>

        {/* Outbreak Radar Alert Badge */}
        <div 
          onClick={() => setActiveTab('outbreak')}
          className="agri-card p-3.5 bg-gradient-to-r from-rose-950 to-slate-900 text-white border-rose-800/50 shadow-sm cursor-pointer hover:border-rose-400 transition"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-300 flex items-center gap-1">
              <Radio className="w-3 h-3 animate-ping" />
              {t('dashboard.pestWarning')}
            </span>
            <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded-full">
              {outbreakAlerts?.activeAlertsCount || 3} Detected
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <h5 className="font-bold text-xs">Fall Armyworm & Mildew</h5>
              <p className="text-[11px] text-rose-200/80">8-14 km away in Nashik Block</p>
            </div>
            <span className="text-xs font-bold text-rose-300 underline">View Radar →</span>
          </div>
        </div>

      </div>

      {/* Today's Smart Advice Banner */}
      <div className="agri-card p-4 sm:p-5 bg-gradient-to-br from-amber-500/10 via-white to-emerald-500/10 border-amber-200 shadow-sm relative">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-white flex items-center justify-center shadow-xs shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-extrabold text-sm text-slate-900">
                  {t('dashboard.todaySmartAdvice')}
                </h4>
                <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                  {currentCrop?.cropName || 'Tomato'} Advisory
                </span>
              </div>
              <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                {lang === 'hi'
                  ? 'फूल आने की अवस्था में 19:19:19 और सूक्ष्म पोषक तत्वों का सुबह छिड़काव करें। कल बारिश की संभावना के कारण आज भारी सिंचाई से बचें।'
                  : 'Foliar spray of NPK 19:19:19 (5g/L) recommended today during cool morning hours. Avoid heavy flood irrigation due to expected rain tomorrow.'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-amber-100 flex items-center justify-between flex-wrap gap-2">
          <VoiceReader
            textToRead="Foliar spray of NPK 19 19 19 recommended today during cool morning hours. Avoid heavy flood irrigation due to expected rain tomorrow."
            textToReadHi="फूल आने की अवस्था में 19 19 19 और सूक्ष्म पोषक तत्वों का सुबह छिड़काव करें। कल बारिश की संभावना के कारण आज भारी सिंचाई से बचें।"
          />
          <button
            onClick={() => setActiveTab('advice')}
            className="text-xs font-bold text-amber-900 hover:text-amber-950 flex items-center gap-1"
          >
            <span>{t('dashboard.askAdvisor')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* MY FIELD MONITORING (AUTONOMOUS CONTINUOUS MONITORING) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="text-base">🛰️</span>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                {t('dashboard.myFieldMonitoring')}
              </h3>
              <p className="text-[11px] text-slate-500">
                {lang === 'hi'
                  ? 'उपग्रह एवं पर्यावरण आधारित निरंतर स्वतः निगरानी'
                  : 'Autonomous continuous satellite & environmental telemetry'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('field-monitoring')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>{t('dashboard.fullTelemetry')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {monitoringSummaries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {monitoringSummaries.map((f) => (
              <div
                key={f.fieldId}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition space-y-4"
              >
                {/* Field Header */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
                      <span>🌾</span>
                      <span>{f.fieldName}</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      {f.crop} • {f.area ? `${f.area} ${f.areaUnit}` : 'Surveyed Plot'} • {f.cropStage}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold uppercase tracking-wide">
                    {f.cropHealth || 'Healthy'}
                  </span>
                </div>

                {/* 6 Mini Indicator Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 block mb-0.5">🌱 CROP HEALTH</span>
                    <strong className="text-slate-900 block truncate">{f.cropHealth} ({f.healthScore}/100)</strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 block mb-0.5">💧 MOISTURE</span>
                    <strong className="text-slate-900 block truncate">
                      {tMoisture(f.moistureStatus)}
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 block mb-0.5">🌧 RAIN FORECAST</span>
                    <strong className="text-slate-900 block truncate">{f.rainForecast || 0}mm ({f.rainProbability || 0}%)</strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 block mb-0.5">🚜 IRRIGATION</span>
                    <strong className={f.irrigationRecommendation === 'Recommended' ? 'text-rose-600 block truncate' : 'text-emerald-700 block truncate'}>
                      {lang === 'hi'
                        ? (f.irrigationRecommendation === 'Recommended' ? 'सिंचाई आवश्यक' : 'आज जरूरत नहीं')
                        : f.irrigationRecommendation}
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 block mb-0.5">🌿 NUTRIENTS</span>
                    <strong className="text-slate-900 block truncate">
                      {lang === 'hi' ? f.nutrientStatusHi : f.nutrientStatus}
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 block mb-0.5">🦠 DISEASE RISK</span>
                    <strong className="text-slate-900 block truncate">{f.diseaseRisk || 'Low'} Risk</strong>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400">
                    {f.lastSatelliteObservation
                      ? `Sentinel-2: ${f.lastSatelliteObservation}`
                      : 'Sentinel-2 Revisit Monitoring Active'}
                  </span>
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.location.hash = `#/field-monitoring?fieldId=${f.fieldId}`;
                      }
                      setActiveTab('field-monitoring');
                    }}
                    className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                  >
                    <span>{t('dashboard.openFieldMonitor')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-6 border border-dashed border-emerald-300 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto text-xl font-bold">
              🗺️
            </div>
            <h4 className="font-bold text-sm text-slate-900">
              {t('dashboard.noFieldMonitored')}
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {lang === 'hi'
                ? 'नक्शे पर अपने खेत की सीमा बनाएं। फ़सल दृष्टि उपग्रह और मौसम डेटा के साथ स्वतः निगरानी शुरू करेगा।'
                : 'Mark your field polygon on the map to unlock automated 24/7 satellite & environmental monitoring.'}
            </p>
            <button
              onClick={() => setActiveTab('field-mapping')}
              className="px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs shadow-sm hover:bg-emerald-600 transition"
            >
              {t('dashboard.markFieldMap')}
            </button>
          </div>
        )}
      </div>

      {/* Current Active Crop Card */}
      <CropCard
        crop={currentCrop}
        onScanClick={() => setActiveTab('diagnose')}
        onViewDetails={() => setActiveTab('profile')}
      />

      {/* Crop Health History Widget (Permanent MongoDB Atlas Archival) */}
      <div className="agri-card p-5 bg-white border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <span>{t('dashboard.cropHistoryTitle')}</span>
                <span className="text-2xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  MongoDB Cloud
                </span>
              </h4>
              <p className="text-2xs text-slate-500 font-medium">
                {t('dashboard.cropHistoryDesc')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('history')}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition shadow-xs flex items-center gap-1.5"
            >
              <span>{t('dashboard.viewHistory')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs transition"
            >
              <span>⚖️ {t('dashboard.compare')}</span>
            </button>
          </div>
        </div>

        {/* 4 Stat Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150">
            <span className="text-2xs font-bold uppercase text-slate-400 block">
              {t('dashboard.totalScans')}
            </span>
            <span className="text-lg font-black text-slate-800">
              {historyStats?.totalScans ?? (recentAnalyses?.length || 4)}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150">
            <span className="text-2xs font-bold uppercase text-slate-400 block">
              {t('dashboard.activeCrops')}
            </span>
            <span className="text-lg font-black text-slate-800">
              {historyStats?.activeCropsCount ?? 2}
            </span>
          </div>

          <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200">
            <span className="text-2xs font-bold uppercase text-emerald-600 block">
              {t('dashboard.healthyCrops')}
            </span>
            <span className="text-lg font-black text-emerald-700">
              {historyStats?.healthyCount ?? 3}
            </span>
          </div>

          <div className="bg-rose-50/70 p-3 rounded-2xl border border-rose-200">
            <span className="text-2xs font-bold uppercase text-rose-600 block">
              {t('dashboard.needsCare')}
            </span>
            <span className="text-lg font-black text-rose-700">
              {historyStats?.attentionCount ?? 1}
            </span>
          </div>
        </div>
      </div>

      {/* Detailed Crop Health Diagnostic Modal */}
      <CropHealthModal
        isOpen={isHealthModalOpen}
        onClose={() => setIsHealthModalOpen(false)}
        healthData={cropHealthData}
        onRecalculate={handleRecalculateHealth}
        isRecalculating={isRecalculatingHealth}
      />

    </div>
  );
}
