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
  Radio
} from 'lucide-react';

export default function FarmerDashboard({ setActiveTab }) {
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const [dashboardData, setDashboardData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [mandiSpotlight, setMandiSpotlight] = useState(null);
  const [outbreakAlerts, setOutbreakAlerts] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const [dashRes, weatherRes, mandiRes, outbreakRes] = await Promise.all([
        api.get('/farmer/dashboard'),
        api.get('/weather'),
        api.get('/mandi/prices?commodity=Tomato'),
        api.get('/tools/outbreaks')
      ]);

      if (dashRes?.data?.success) setDashboardData(dashRes.data.data);
      if (weatherRes?.data?.success) setWeatherData(weatherRes.data.data);
      if (mandiRes?.data?.success && Array.isArray(mandiRes.data?.data) && mandiRes.data.data.length > 0) setMandiSpotlight(mandiRes.data.data[0]);
      if (outbreakRes?.data?.success) setOutbreakAlerts(outbreakRes.data);
    } catch (e) {
      console.error('Failed to load dashboard:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

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
      
      {/* 1. Welcome Header Banner */}
      <div className="bg-gradient-to-r from-[#14532d] via-[#166534] to-[#15803d] text-white p-5 rounded-3xl shadow-md border border-agri-600/30 flex items-center justify-between relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
              📍 {typeof profile?.village === 'string' ? `${profile.village}, ${profile.district || ''}` : 'Pimpalgaon, Nashik'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            {getGreeting()}
          </h2>
          <p className="text-xs text-agri-100/90 mt-0.5 font-medium">
            {farmer?.name || 'Farmer'} • {farm?.farmSize || 4.5} {farm?.landUnit || 'Acres'} ({farm?.soilType || 'Black Soil'})
          </p>
        </div>

        <button
          onClick={fetchDashboard}
          className="p-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white backdrop-blur-md transition active:rotate-180"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Live Mandi & Satellite Live Tickers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        
        {/* Mandi Spotlight */}
        {mandiSpotlight && (
          <div 
            onClick={() => setActiveTab('mandi')}
            className="agri-card p-3.5 bg-gradient-to-r from-emerald-900 to-slate-900 text-white border-emerald-700/50 shadow-sm cursor-pointer hover:border-emerald-400 transition"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {t('dashboard.mandiSpotlight')}
              </span>
              <span className="text-[10px] bg-emerald-500 text-white font-black px-2 py-0.5 rounded-full">
                AI: {mandiSpotlight.aiForecast?.action || 'HOLD'}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div>
                <h5 className="font-bold text-xs">{mandiSpotlight.commodity} ({mandiSpotlight.market})</h5>
                <p className="text-[11px] text-emerald-200/80">Arrivals: {mandiSpotlight.arrivalQuantity || '450 Tonnes'}</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-amber-300">₹{mandiSpotlight.modalPrice}</span>
                <span className="text-[10px] text-emerald-300 block">+{mandiSpotlight.change ?? mandiSpotlight.changePercent ?? 120} today</span>
              </div>
            </div>
          </div>
        )}

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

      {/* 3. Today's Smart Advice Banner */}
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

      {/* 4. Current Crop Card */}
      <CropCard
        crop={currentCrop}
        onScanClick={() => setActiveTab('diagnose')}
        onViewDetails={() => setActiveTab('profile')}
      />

      {/* 5. 8 Quick Action Power Buttons Grid */}
      <div>
        <h3 className="font-extrabold text-sm text-slate-900 mb-2.5 px-1">
          {t('dashboard.quickActions')} (Krishi Drishti 2.0 Tools)
        </h3>
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

      {/* 6. Weather Overview Widget */}
      <WeatherWidget
        weatherData={weatherData}
        onSeeFullForecast={() => setActiveTab('weather')}
      />

      {/* 7. Upcoming Tasks & Action Plan Checklist */}
      <ActionPlanChecklist
        tasks={pendingTasks}
        onToggleTask={handleToggleTask}
        onSeeAllTasks={() => setActiveTab('plans')}
      />

      {/* 8. Crop Health Summary & Recent Scans */}
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

    </div>
  );
}
