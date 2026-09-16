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
  Map,
  History
} from 'lucide-react';
import { fetchCropHistoryStats } from '../services/cropScanService';
import { fetchMonitoringDashboardSummary } from '../services/fieldMonitoringService';
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

const getInitialDashboardData = () => {
  const cached = safeParse('krishi_dash_cache');
  if (cached) return cached;
  return {
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
};

export default function FarmerDashboard({ setActiveTab }) {
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const [dashboardData, setDashboardData] = useState(() => getInitialDashboardData());
  const [weatherData, setWeatherData] = useState(() => safeParse('krishi_weather_cache') || MOCK_WEATHER);
  const [mandiSpotlight, setMandiSpotlight] = useState(() => safeParse('krishi_mandi_cache') || null);
  const [outbreakAlerts, setOutbreakAlerts] = useState(() => safeParse('krishi_outbreak_cache') || MOCK_OUTBREAKS);
  const [historyStats, setHistoryStats] = useState(null);
  const [monitoringSummaries, setMonitoringSummaries] = useState([]);
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
        latestHealthRes
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
        }).catch(() => null)
      ]);

      if (dashRes?.data?.success) {
        setDashboardData(dashRes.data.data);
        safeSet('krishi_dash_cache', dashRes.data.data);
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
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-5 pb-24 md:pb-10">
      
      {/* 1. Brand & Farmer Header Banner */}
      <div className="bg-gradient-to-r from-[#14532d] via-[#166534] to-[#15803d] text-white p-5 rounded-3xl shadow-md border border-agri-600/30 flex items-center justify-between relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-3.5 sm:gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/25 flex items-center justify-center p-1 shrink-0 shadow-inner">
            <img
              src="/logo.svg"
              alt="Krishi Drishti Logo"
              className="w-10 h-10 object-contain rounded-xl"
              onError={(e) => {
                if (e.target.src.endsWith('/logo.svg')) {
                  e.target.src = '/logo.png';
                }
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-black text-xs tracking-wider text-emerald-300 uppercase">
                KRISHI DRISHTI
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                📍 {typeof profile?.village === 'string' ? `${profile.village}, ${profile.district || ''}` : 'Pimpalgaon, Nashik'}
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black tracking-tight leading-snug">
              {getGreeting()}
            </h2>
            <p className="text-xs text-agri-100/90 mt-0.5 font-medium">
              {farmer?.name || 'Farmer'} • {farm?.farmSize || 4.5} {farm?.landUnit || 'Acres'} ({farm?.soilType || 'Black Soil'})
            </p>
          </div>
        </div>

        <button
          onClick={fetchDashboard}
          className="p-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white backdrop-blur-md transition active:rotate-180 shrink-0"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* 2. NEW HOMEPAGE HERO — LARGE CROP HEALTH CIRCLE */}
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

      {/* 3. 8 Quick Action Power Buttons Grid (Moved up for instant farmer access) */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-1">
          <h3 className="font-extrabold text-sm text-slate-900">
            {t('dashboard.quickActions')} (Krishi Drishti 2.0 Tools)
          </h3>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            One-Tap Farming AI
          </span>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          <QuickActionBtn
            icon={ScanLine}
            title={lang === 'hi' ? 'फसल जांच' : 'AI Scan'}
            subtitle={lang === 'hi' ? 'कैमरा' : 'Doctor'}
            onClick={() => setActiveTab('diagnose')}
            color="emerald"
          />
          <QuickActionBtn
            icon={Sparkles}
            title={lang === 'hi' ? 'AI सलाह' : 'AI Advisor'}
            subtitle={lang === 'hi' ? 'वॉइस' : 'Voice Q&A'}
            onClick={() => setActiveTab('advice')}
            color="amber"
          />
          <QuickActionBtn
            icon={TrendingUp}
            title={lang === 'hi' ? 'मंडी भाव' : 'Mandi'}
            subtitle={lang === 'hi' ? 'लाइव दर' : 'Live Rates'}
            onClick={() => setActiveTab('mandi')}
            color="teal"
          />
          <QuickActionBtn
            icon={Calculator}
            title={lang === 'hi' ? 'खाद गणना' : 'Fertilizer'}
            subtitle={lang === 'hi' ? 'NPK डोज' : 'NPK Calc'}
            onClick={() => setActiveTab('fertilizer')}
            color="emerald"
          />
          <QuickActionBtn
            icon={Satellite}
            title={lang === 'hi' ? 'उपग्रह' : 'Satellite'}
            subtitle={lang === 'hi' ? 'NDVI' : 'Radar'}
            onClick={() => setActiveTab('satellite')}
            color="blue"
          />
          <QuickActionBtn
            icon={Building2}
            title={lang === 'hi' ? 'योजनाएं' : 'Schemes'}
            subtitle={lang === 'hi' ? 'सब्सिडी' : 'Subsidies'}
            onClick={() => setActiveTab('schemes')}
            color="amber"
          />
          <QuickActionBtn
            icon={CloudSun}
            title={lang === 'hi' ? 'मौसम' : 'Weather'}
            subtitle={lang === 'hi' ? '5-दिन' : '5-Day'}
            onClick={() => setActiveTab('weather')}
            color="blue"
          />
          <QuickActionBtn
            icon={ShieldAlert}
            title={lang === 'hi' ? 'कीट रडार' : 'Outbreak'}
            subtitle={lang === 'hi' ? 'अलर्ट' : 'Radar'}
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
            <span>{lang === 'hi' ? 'सलाहकार से पूछें' : 'Ask AI Advisor'}</span>
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
                {lang === 'hi' ? 'मेरे खेत की स्वचालित निगरानी' : 'MY FIELD MONITORING'}
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
            <span>{lang === 'hi' ? 'विस्तृत निगरानी' : 'Full Telemetry'}</span>
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
                      {lang === 'hi' ? f.moistureStatusHi || f.moistureStatus : f.moistureStatus}
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
                    <span>{lang === 'hi' ? 'खेत का विवरण देखें' : 'Open Field Monitor'}</span>
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
              {lang === 'hi' ? 'कोई सक्रिय खेत निगरानी में नहीं है' : 'No Field Monitored Yet'}
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {lang === 'hi'
                ? 'नक्शे पर अपने खेत की सीमा बनाएं। कृषि दृष्टि उपग्रह और मौसम डेटा के साथ स्वतः निगरानी शुरू करेगा।'
                : 'Mark your field polygon on the map to unlock automated 24/7 satellite & environmental monitoring.'}
            </p>
            <button
              onClick={() => setActiveTab('field-mapping')}
              className="px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs shadow-sm hover:bg-emerald-600 transition"
            >
              {lang === 'hi' ? 'खेत की सीमा बनाएं' : 'Mark Field on Map'}
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
                <span>{lang === 'hi' ? 'फसल स्वास्थ्य इतिहास व तुलना' : 'Crop Health History & Comparison'}</span>
                <span className="text-2xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  MongoDB Cloud
                </span>
              </h4>
              <p className="text-2xs text-slate-500 font-medium">
                {lang === 'hi' ? 'खेत-वार सभी पुराने व नए स्कैन का सुरक्षित डेटा' : 'Permanent multi-month scan records across plots'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('history')}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition shadow-xs flex items-center gap-1.5"
            >
              <span>{lang === 'hi' ? 'इतिहास देखें' : 'View History'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs transition"
            >
              <span>⚖️ {lang === 'hi' ? 'तुलना करें' : 'Compare'}</span>
            </button>
          </div>
        </div>

        {/* 4 Stat Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150">
            <span className="text-2xs font-bold uppercase text-slate-400 block">
              {lang === 'hi' ? 'कुल स्कैन' : 'Total Scans'}
            </span>
            <span className="text-lg font-black text-slate-800">
              {historyStats?.totalScans ?? (recentAnalyses?.length || 4)}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150">
            <span className="text-2xs font-bold uppercase text-slate-400 block">
              {lang === 'hi' ? 'सक्रिय फसलें' : 'Active Crops'}
            </span>
            <span className="text-lg font-black text-slate-800">
              {historyStats?.activeCropsCount ?? 2}
            </span>
          </div>

          <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200">
            <span className="text-2xs font-bold uppercase text-emerald-600 block">
              {lang === 'hi' ? 'स्वस्थ फसलें' : 'Healthy Crops'}
            </span>
            <span className="text-lg font-black text-emerald-700">
              {historyStats?.healthyCount ?? 3}
            </span>
          </div>

          <div className="bg-rose-50/70 p-3 rounded-2xl border border-rose-200">
            <span className="text-2xs font-bold uppercase text-rose-600 block">
              {lang === 'hi' ? 'ध्यान योग्य' : 'Needs Care'}
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
