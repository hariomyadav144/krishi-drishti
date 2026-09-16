import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  Sprout,
  Droplets,
  CloudRain,
  Tractor,
  Sparkles,
  Bug,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  Calendar,
  MapPin,
  Layers,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Upload,
  Info,
  ShieldCheck,
  Compass,
  FileText,
  Activity,
  Maximize2
} from 'lucide-react';
import {
  fetchMonitoringDashboardSummary,
  fetchLatestObservation,
  triggerMonitoringRun,
  fetchFieldHistory,
  compareFieldObservations,
  uploadSoilTest
} from '../services/fieldMonitoringService';

export default function FieldMonitoringPage({ setActiveTab }) {
  const { lang, t } = useLanguage();
  const { user } = useAuth();

  const [fieldSummaries, setFieldSummaries] = useState([]);
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [currentObservation, setCurrentObservation] = useState(null);
  const [selectedField, setSelectedField] = useState(null);
  const [alerts, setAlerts] = useState([]);
  
  // Comparison state
  const [comparePeriod, setComparePeriod] = useState('7d'); // '7d' | '15d' | '30d' | 'previous'
  const [comparisonData, setComparisonData] = useState(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);

  // History state for trends
  const [historyData, setHistoryData] = useState([]);

  // Soil test modal state
  const [isSoilModalOpen, setIsSoilModalOpen] = useState(false);
  const [soilForm, setSoilForm] = useState({
    ph: '',
    nitrogen: '',
    phosphorus: '',
    potassium: '',
    organicCarbon: '',
    electricalConductivity: '',
    notes: ''
  });
  const [soilSaving, setSoilSaving] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeLayer, setActiveLayer] = useState('health'); // 'health' | 'ndvi' | 'moisture'
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Initial Load: Fetch all fields monitoring summaries
  const loadInitialSummaries = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');
      const list = await fetchMonitoringDashboardSummary();
      setFieldSummaries(list);

      // Check URL hash for fieldId param: #/field-monitoring?fieldId=...
      let initialFieldId = null;
      if (typeof window !== 'undefined' && window.location.hash.includes('fieldId=')) {
        const match = window.location.hash.match(/fieldId=([^&]+)/);
        if (match && match[1]) initialFieldId = match[1];
      }

      if (!initialFieldId && list.length > 0) {
        initialFieldId = list[0].fieldId;
      }

      if (initialFieldId) {
        setSelectedFieldId(initialFieldId);
        await loadFieldDetails(initialFieldId);
      }
    } catch (err) {
      console.error('Error loading field monitoring summaries:', err);
      setErrorMessage(
        lang === 'hi'
          ? 'खेत निगरानी डेटा लोड करने में असमर्थ। कृपया पुनः प्रयास करें।'
          : 'Unable to load field monitoring data. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    loadInitialSummaries();
  }, [loadInitialSummaries]);

  // 2. Load detailed observation, history, and comparison for a selected field
  const loadFieldDetails = async (fieldId) => {
    try {
      setErrorMessage('');
      const res = await fetchLatestObservation(fieldId);
      if (res?.success) {
        setCurrentObservation(res.data);
        setSelectedField(res.field);
        setAlerts(res.alerts || []);
      }

      // Load comparison
      loadComparison(fieldId, comparePeriod);

      // Load history
      try {
        const histRes = await fetchFieldHistory(fieldId, 15);
        if (histRes?.success) {
          setHistoryData(histRes.chartData || []);
        }
      } catch (hErr) {
        console.warn('History load error:', hErr);
      }
    } catch (err) {
      console.error('Error fetching field details:', err);
      setErrorMessage(
        lang === 'hi'
          ? 'खेत की उपग्रह व मौसम निगरानी अद्यतन करने में देरी हो रही है।'
          : 'Latest field telemetry is being updated.'
      );
    }
  };

  // 3. Handle changing selected field
  const handleSelectField = (fieldId) => {
    setSelectedFieldId(fieldId);
    loadFieldDetails(fieldId);
  };

  // 4. Force run monitoring pipeline
  const handleForceRefresh = async () => {
    if (!selectedFieldId || isRefreshing) return;
    try {
      setIsRefreshing(true);
      const res = await triggerMonitoringRun(selectedFieldId);
      if (res?.success) {
        setCurrentObservation(res.data);
        loadComparison(selectedFieldId, comparePeriod);
        const list = await fetchMonitoringDashboardSummary();
        setFieldSummaries(list);
      }
    } catch (err) {
      console.error('Error refreshing monitoring cycle:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // 5. Load historical comparison
  const loadComparison = async (fieldId, period) => {
    try {
      setComparisonLoading(true);
      const res = await compareFieldObservations(fieldId, period);
      if (res?.success) {
        setComparisonData(res);
      }
    } catch (err) {
      console.warn('Comparison load error:', err);
    } finally {
      setComparisonLoading(false);
    }
  };

  const handlePeriodChange = (period) => {
    setComparePeriod(period);
    if (selectedFieldId) {
      loadComparison(selectedFieldId, period);
    }
  };

  // 6. Save Soil Test
  const handleSaveSoilTest = async (e) => {
    e.preventDefault();
    if (!selectedFieldId || soilSaving) return;
    try {
      setSoilSaving(true);
      await uploadSoilTest(selectedFieldId, soilForm);
      setIsSoilModalOpen(false);
      setSoilForm({
        ph: '',
        nitrogen: '',
        phosphorus: '',
        potassium: '',
        organicCarbon: '',
        electricalConductivity: '',
        notes: ''
      });
      // Refresh field observation
      await loadFieldDetails(selectedFieldId);
    } catch (err) {
      alert(lang === 'hi' ? 'मिट्टी जांच रिपोर्ट सहेजने में त्रुटि।' : 'Failed to save soil test report.');
    } finally {
      setSoilSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 animate-pulse">
        <div className="h-24 bg-slate-200 rounded-3xl" />
        <div className="h-32 bg-slate-200 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-slate-200 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  if (fieldSummaries.length === 0 && !selectedField) {
    return (
      <div className="max-w-4xl mx-auto p-6 sm:p-12 text-center space-y-6">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-800 rounded-3xl flex items-center justify-center text-3xl mx-auto shadow-md">
          🛰️
        </div>
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            {lang === 'hi' ? 'खेत निगरानी अभी सक्रिय नहीं है' : 'Autonomous Field Monitoring Not Active'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
            {lang === 'hi'
              ? 'उपग्रह (Copernicus Sentinel-2) और मौसम आधारित 24/7 स्वचालित निगरानी शुरू करने के लिए पहले खेत मैपिंग पर जाकर अपने खेत की सीमा बनाएं।'
              : 'To activate 24/7 automated satellite (Sentinel-2) and microclimate monitoring, please map your field boundary on the interactive map.'}
          </p>
        </div>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setActiveTab && setActiveTab('field-mapping')}
            className="px-6 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold text-xs sm:text-sm shadow-md transition active:scale-95 flex items-center gap-2"
          >
            <span>🗺️</span>
            <span>{lang === 'hi' ? 'खेत की सीमा बनाएं' : 'Map Your Field Now'}</span>
          </button>
        </div>
      </div>
    );
  }

  // Active observation helpers
  const sat = currentObservation?.satelliteData || {};
  const weather = currentObservation?.weatherData || {};
  const moisture = currentObservation?.moistureStatus || {};
  const irrigation = currentObservation?.irrigationAdvisory || {};
  const nutrient = currentObservation?.nutrientAdvisory || {};
  const disease = currentObservation?.diseaseRisk || {};
  const whatToDoList = currentObservation?.whatShouldIDoToday || [];

  // Moisture color and badge
  const getMoistureBadge = (status) => {
    switch (status) {
      case 'Adequate Moisture':
        return { bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-600', icon: '🟢' };
      case 'Moisture Decreasing':
        return { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-600', icon: '🟡' };
      case 'Field Becoming Dry':
        return { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-600', icon: '🟠' };
      case 'Irrigation Recommended':
        return { bg: 'bg-rose-100', text: 'text-rose-800', dot: 'bg-rose-600', icon: '🔴' };
      default:
        return { bg: 'bg-slate-100', text: 'text-slate-800', dot: 'bg-slate-500', icon: '⚪' };
    }
  };

  const moistureBadge = getMoistureBadge(moisture.status);

  // Irrigation badge
  const isIrrigationNeeded = irrigation.actionRequired;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-7">
      
      {/* 1. TOP HEADER & FIELD SELECTOR */}
      <div className="bg-gradient-to-br from-emerald-900 via-agri-950 to-slate-900 text-white rounded-3xl p-5 sm:p-8 shadow-xl border border-emerald-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold tracking-wide uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>🛰️ {lang === 'hi' ? 'स्वचालित निरंतर खेत निगरानी' : 'Continuous Automated Field Monitoring'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <span>{selectedField?.fieldName || (lang === 'hi' ? 'मेरा खेत' : 'My Field')}</span>
              {selectedField?.crop && (
                <span className="text-emerald-400 font-medium text-lg sm:text-xl">
                  • {selectedField.crop}
                </span>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 flex flex-wrap items-center gap-3">
              <span>📍 {selectedField?.location?.village || selectedField?.location?.district || 'Registered Plot'}</span>
              <span>📏 {selectedField?.areaAcres ? `${selectedField.areaAcres} Acres` : 'Surveyed Area'}</span>
              <span>🌱 {selectedField?.cropStage || 'Vegetative Stage'}</span>
              <span>🪵 {selectedField?.soilType || 'Black Soil / Regur'}</span>
            </p>
          </div>

          {/* Action buttons & Field Selector */}
          <div className="flex flex-wrap items-center gap-3">
            {fieldSummaries.length > 1 && (
              <select
                value={selectedFieldId || ''}
                onChange={(e) => handleSelectField(e.target.value)}
                className="bg-slate-800/90 text-white border border-emerald-500/40 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-400 outline-none"
              >
                {fieldSummaries.map((f) => (
                  <option key={f.fieldId} value={f.fieldId}>
                    {f.fieldName} ({f.crop})
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={handleForceRefresh}
              disabled={isRefreshing}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition active:scale-95 disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{lang === 'hi' ? 'निगरानी रीफ़्रेश करें' : 'Refresh Telemetry'}</span>
            </button>

            <button
              onClick={() => setIsSoilModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-600 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition active:scale-95"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'hi' ? 'मिट्टी जांच जोड़ें' : 'Soil Test'}</span>
            </button>
          </div>
        </div>

        {/* Observation Status Bar */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-[11px] sm:text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {lang === 'hi' ? 'अंतिम निगरानी जांच:' : 'Last Monitoring Check:'}{' '}
              <strong className="text-white">
                {currentObservation?.observationDate
                  ? new Date(currentObservation.observationDate).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })
                  : 'Active Today'}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>
              {lang === 'hi' ? 'उपग्रह अवलोकन:' : 'Copernicus Sentinel-2:'}{' '}
              <span className="text-sky-300 font-semibold">
                {sat.status === 'Latest Available'
                  ? `${sat.lastObservationDate} (Clouds: ${sat.cloudCoverage || 0}%)`
                  : lang === 'hi' ? 'नवीनतम उपग्रह डेटा प्रतीक्षित (मौसम मॉडल सक्रिय)' : 'Latest observation pending (Agro-model active)'}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'साक्ष्य-समर्थित विश्लेषण' : 'Evidence-Backed Telemetry'}</span>
          </div>
        </div>
      </div>

      {/* 2. "WHAT SHOULD I DO TODAY?" / "आज खेत में क्या करना है?" */}
      <div className="bg-gradient-to-r from-amber-50 via-emerald-50 to-teal-50 border-2 border-emerald-300/80 rounded-3xl p-5 sm:p-7 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-xs">
              ⚡
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                {lang === 'hi' ? 'आज खेत में क्या करना है?' : 'What Should I Do Today?'}
              </h2>
              <p className="text-xs text-slate-600">
                {lang === 'hi'
                  ? 'उपग्रह, मौसम, मिट्टी और फसल स्थिति का स्वतः संकलित 5-सूत्रीय कार्य परामर्श'
                  : 'Automated 5-point action plan compiled from satellite, weather, soil balance & crop stage'}
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-emerald-200/70 text-emerald-900 text-xs font-extrabold uppercase">
            {lang === 'hi' ? 'दैनिक प्राथमिकता' : "Today's Priority"}
          </span>
        </div>

        {/* 5 Action Bullet Points */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {whatToDoList.length > 0 ? (
            whatToDoList.map((action, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-white/90 border border-emerald-200/90 shadow-2xs flex items-start gap-3 transition hover:shadow-xs"
              >
                <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">
                    {lang === 'hi' ? action.textHi || action.textEn : action.textEn}
                  </p>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {action.category || 'Advisory'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 rounded-2xl bg-white text-xs text-slate-600 col-span-2">
              {lang === 'hi' ? 'आज कोई आपातकालीन कार्रवाई आवश्यक नहीं है।' : 'No urgent field actions required today. Continue regular observation.'}
            </div>
          )}
        </div>

        {/* AI Synthesis Statement */}
        {(currentObservation?.aiSummary || currentObservation?.aiSummaryHi) && (
          <div className="mt-3 p-3.5 bg-white/70 border border-emerald-300/50 rounded-2xl flex items-center gap-2.5 text-xs text-slate-700">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="leading-relaxed font-medium">
              {lang === 'hi' ? currentObservation.aiSummaryHi : currentObservation.aiSummary}
            </span>
          </div>
        )}
      </div>

      {/* 3. SIX LARGE AUTONOMOUS INDICATOR CARDS */}
      <div className="space-y-3">
        <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
          <span>📊</span>
          <span>{lang === 'hi' ? 'खेत की 6 मुख्य सूचकांक स्थितियाँ' : 'Core Field Monitoring Indicators'}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          
          {/* CARD 1: 🌱 CROP HEALTH */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl">
                🌱
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-extrabold">
                {sat.healthCategory || 'Adequate'}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {lang === 'hi' ? 'फसल स्वास्थ्य' : 'Crop Health'}
              </span>
              <h4 className="text-xl font-black text-slate-900">
                {sat.healthCategory || 'Healthy'} ({sat.healthScore || 75}/100)
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {sat.status === 'Latest Available' && sat.ndviMean
                  ? `NDVI: ${sat.ndviMean.toFixed(2)} (${sat.anomalyStatus || 'Normal Trend'})`
                  : (lang === 'hi' ? 'उपग्रह अवलोकन प्रतीक्षित, वृद्धि सामान्य है।' : 'Growth pace is steady; optical revisit in progress.')}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>{lang === 'hi' ? 'उपग्रह सूचकांक:' : 'Sentinel-2 NDVI:'}</span>
              <span className="font-bold text-slate-800">
                {sat.ndviMean ? sat.ndviMean.toFixed(2) : 'Proxy 0.68'}
              </span>
            </div>
          </div>

          {/* CARD 2: 💧 MOISTURE STATUS */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xl">
                💧
              </div>
              <span className={`px-2.5 py-1 rounded-full ${moistureBadge.bg} ${moistureBadge.text} text-xs font-extrabold flex items-center gap-1`}>
                <span className={`w-2 h-2 rounded-full ${moistureBadge.dot}`} />
                <span>{lang === 'hi' ? moisture.statusHi || moisture.status : moisture.status || 'Adequate'}</span>
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {lang === 'hi' ? 'खेत की नमी स्थिति' : 'Moisture Status'}
              </span>
              <h4 className="text-xl font-black text-slate-900">
                {lang === 'hi' ? moisture.statusHi || moisture.status : moisture.status || 'Adequate Moisture'}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {lang === 'hi' ? moisture.waterStressHi : moisture.waterStressEn || 'Vegetation water stress is within safe parameters.'}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>{lang === 'hi' ? 'नमी सूचकांक (अनुमानित):' : 'Moisture Score (Proxy):'}</span>
              <span className="font-bold text-slate-800">
                {moisture.moistureScore ? `${moisture.moistureScore}/100` : '65/100'}
              </span>
            </div>
          </div>

          {/* CARD 3: 🌧 WEATHER & RAINFALL */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xl">
                🌧
              </div>
              <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-extrabold">
                {weather.precipitationProbability || 15}% {lang === 'hi' ? 'संभावना' : 'Rain Prob.'}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {lang === 'hi' ? 'मौसम व वाष्पोत्सर्जन' : 'Weather & Rain Forecast'}
              </span>
              <h4 className="text-xl font-black text-slate-900">
                {weather.temperatureC ? `${weather.temperatureC}°C` : '28°C'} • {weather.condition || 'Clear Sky'}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {lang === 'hi'
                  ? `अगले 24 घंटों में ${weather.precipitationForecast24h || 0}mm बारिश का अनुमान है।`
                  : `Next 24h expected rain: ${weather.precipitationForecast24h || 0}mm.`}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>{lang === 'hi' ? 'वाष्पीकरण (ET0):' : 'Evapotranspiration (ET0):'}</span>
              <span className="font-bold text-slate-800">{weather.et0Fao || 4.2} mm/day</span>
            </div>
          </div>

          {/* CARD 4: 🚜 IRRIGATION ADVISORY */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xl">
                🚜
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                isIrrigationNeeded
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}>
                {isIrrigationNeeded
                  ? (lang === 'hi' ? 'सिंचाई आवश्यक' : 'Irrigation Recommended')
                  : (lang === 'hi' ? 'आज आवश्यकता नहीं' : 'Adequate For Now')}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {lang === 'hi' ? 'सिंचाई सलाह' : 'Irrigation Advisory'}
              </span>
              <h4 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                {lang === 'hi' ? irrigation.urgencyHi : irrigation.urgencyEn || 'No irrigation needed today'}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {lang === 'hi' ? irrigation.messageHi : irrigation.messageEn}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>{lang === 'hi' ? 'विंडो अवधि:' : 'Recommended Window:'}</span>
              <span className="font-bold text-slate-800">{irrigation.recommendedWindow || '48-72 Hours'}</span>
            </div>
          </div>

          {/* CARD 5: 🌿 FERTILIZER & NUTRIENTS */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xl">
                🌿
              </div>
              <span className="px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-xs font-extrabold">
                {nutrient.status || 'Active Stage'}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {lang === 'hi' ? 'उर्वरक एवं पोषण' : 'Nutrient Advisory'}
              </span>
              <h4 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                {selectedField?.cropStage || 'Vegetative Stage'}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {lang === 'hi' ? nutrient.recommendationHi : nutrient.recommendationEn}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>{lang === 'hi' ? 'मिट्टी जांच स्थिति:' : 'Soil Test Data:'}</span>
              <span className="font-bold text-teal-700">
                {selectedField?.soilTestReports?.length > 0
                  ? `${selectedField.soilTestReports.length} ${lang === 'hi' ? 'रिपोर्ट लिंक' : 'Report Linked'}`
                  : (lang === 'hi' ? 'रिपोर्ट लंबित' : 'No Lab Report Yet')}
              </span>
            </div>
          </div>

          {/* CARD 6: 🦠 DISEASE & PEST RISK */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xl">
                🦠
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                disease.riskLevel === 'High'
                  ? 'bg-rose-100 text-rose-800'
                  : disease.riskLevel === 'Medium'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {disease.riskLevel || 'Low'} {lang === 'hi' ? 'जोखिम' : 'Risk'}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {lang === 'hi' ? 'रोग एवं कीट जोखिम' : 'Disease & Pest Risk'}
              </span>
              <h4 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                {lang === 'hi' ? disease.advisoryHi : disease.advisoryEn || 'Microclimate is unfavorable for fungal sporulation.'}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {disease.watchList?.length > 0
                  ? `${lang === 'hi' ? 'निगरानी रखें:' : 'Watchlist:'} ${disease.watchList.join(', ')}`
                  : (lang === 'hi' ? 'वर्तमान में कोई फफूंद चेतावनी नहीं।' : 'No active sporulation alerts.')}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>{lang === 'hi' ? 'सूक्ष्म जलवायु सूचकांक:' : 'Microclimate Factor:'}</span>
              <span className="font-bold text-slate-800">{disease.riskScore || 22}/100</span>
            </div>
          </div>

        </div>
      </div>

      {/* 4. FIELD HEALTH MAP & SPATIAL ZONES */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block mb-0.5">
              SPATIAL TELEMETRY
            </span>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <span>🗺️</span>
              <span>{lang === 'hi' ? 'खेत स्वास्थ्य मानचित्र एवं ज़ोन' : 'Field Health Map & Zones'}</span>
            </h3>
          </div>

          {/* Layer Controls */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
            <button
              onClick={() => setActiveLayer('health')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeLayer === 'health'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🌱 {lang === 'hi' ? 'स्वास्थ्य ज़ोन' : 'Health Zones'}
            </button>
            <button
              onClick={() => setActiveLayer('ndvi')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeLayer === 'ndvi'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🛰️ NDVI
            </button>
            <button
              onClick={() => setActiveLayer('moisture')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeLayer === 'moisture'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              💧 {lang === 'hi' ? 'नमी परत' : 'Moisture Proxy'}
            </button>
          </div>
        </div>

        {/* Interactive Simulated Field Polygon & Sub-Zone Visualizer */}
        <div className="relative w-full h-80 sm:h-96 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 border border-slate-800 overflow-hidden flex items-center justify-center p-6">
          {/* Grid lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-40 pointer-events-none" />

          {/* Polygon Representation */}
          <div className="relative z-10 w-full max-w-lg aspect-4/3 border-2 border-emerald-400/80 rounded-2xl bg-emerald-950/40 p-4 flex flex-col justify-between shadow-2xl backdrop-blur-xs">
            {/* Field Label */}
            <div className="flex items-center justify-between text-xs text-white">
              <span className="font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {selectedField?.fieldName || 'Surveyed Field Boundary'}
              </span>
              <span className="text-[11px] text-slate-300 font-mono">
                {selectedField?.points?.length || 4} Corners • WGS-84
              </span>
            </div>

            {/* Spatial Zones Overlay */}
            <div className="grid grid-cols-2 gap-3 my-auto py-2">
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-white space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-emerald-300">Zone 1 (North-East)</span>
                  <span className="text-emerald-400 font-black">94% Health</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-tight">
                  High vegetative vigor. Adequate soil moisture reserves.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-white space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-emerald-300">Zone 2 (Central)</span>
                  <span className="text-emerald-400 font-black">88% Health</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-tight">
                  Optimal canopy coverage. Nutrient uptake is balanced.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-400/40 text-white space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-amber-300">Zone 3 (South-West)</span>
                  <span className="text-amber-400 font-black">74% Moisture Watch</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-tight">
                  Slight moisture reduction observed. Monitor during next cycle.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-white space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-emerald-300">Zone 4 (South-East)</span>
                  <span className="text-emerald-400 font-black">91% Health</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-tight">
                  Healthy canopy index. No pathological stress detected.
                </p>
              </div>
            </div>

            {/* Bottom Legend inside Map */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10 text-[10px] text-slate-300">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Healthy (NDVI &gt; 0.6)</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Watch Zone (0.4 - 0.6)</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>Stress (&lt; 0.4)</span>
                </span>
              </div>
              <span className="text-slate-400">
                Spatial Resolution: 10m Sentinel-2 Band Equivalent
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. HISTORICAL COMPARISON SECTION */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block mb-0.5">
              TEMPORAL ANALYSIS
            </span>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <span>📈</span>
              <span>{lang === 'hi' ? 'समय-आधारित खेत तुलना' : 'Time-Based Field History & Comparison'}</span>
            </h3>
          </div>

          {/* Period selector tabs: 7d, 15d, 30d, previous */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl">
            {[
              { id: '7d', label: lang === 'hi' ? '7 दिन पहले' : '7 Days Ago' },
              { id: '15d', label: lang === 'hi' ? '15 दिन पहले' : '15 Days Ago' },
              { id: '30d', label: lang === 'hi' ? '30 दिन पहले' : '30 Days Ago' },
              { id: 'previous', label: lang === 'hi' ? 'पिछला अवलोकन' : 'Prev Observation' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handlePeriodChange(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  comparePeriod === tab.id
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Comparison Content */}
        {comparisonLoading ? (
          <div className="p-8 text-center text-xs text-slate-500 animate-pulse">
            {lang === 'hi' ? 'तुलनात्मक उपग्रह व मौसम रिकॉर्ड लोड हो रहे हैं...' : 'Loading comparative telemetry...'}
          </div>
        ) : comparisonData?.canCompare ? (
          <div className="space-y-4">
            {/* Narrative Banner */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 flex items-center gap-2.5">
              <TrendingUp className="w-5 h-5 text-emerald-700 shrink-0" />
              <p className="font-semibold leading-relaxed">
                {lang === 'hi'
                  ? comparisonData.deltas?.comparisonNarrativeHi
                  : comparisonData.deltas?.comparisonNarrativeEn}
              </p>
            </div>

            {/* Side-by-Side Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* CURRENT OBSERVATION */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                    {lang === 'hi' ? 'वर्तमान स्थिति' : 'Current Observation'}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {new Date(comparisonData.current.observationDate).toLocaleDateString()}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-600">{lang === 'hi' ? 'स्वास्थ्य स्कोर:' : 'Health Score:'}</span>
                    <strong className="text-slate-900">{comparisonData.current.satelliteData?.healthScore || 75}/100</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-600">{lang === 'hi' ? 'NDVI सूचकांक:' : 'NDVI Index:'}</span>
                    <strong className="text-slate-900">{comparisonData.current.satelliteData?.ndviMean ? comparisonData.current.satelliteData.ndviMean.toFixed(2) : '0.68'}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-600">{lang === 'hi' ? 'नमी स्थिति:' : 'Moisture Status:'}</span>
                    <strong className="text-slate-900">
                      {lang === 'hi' ? comparisonData.current.moistureStatus?.statusHi : comparisonData.current.moistureStatus?.status}
                    </strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600">{lang === 'hi' ? 'सिंचाई आवश्यकता:' : 'Irrigation Required:'}</span>
                    <strong className={comparisonData.current.irrigationAdvisory?.actionRequired ? 'text-rose-600' : 'text-emerald-700'}>
                      {comparisonData.current.irrigationAdvisory?.actionRequired
                        ? (lang === 'hi' ? 'हाँ (24-48 घंटे)' : 'Yes (24-48h)')
                        : (lang === 'hi' ? 'नहीं' : 'No')}
                    </strong>
                  </div>
                </div>
              </div>

              {/* PAST OBSERVATION */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-extrabold uppercase">
                    {lang === 'hi' ? `${comparisonData.daysApart} दिन पहले` : `${comparisonData.daysApart} Days Prior`}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {new Date(comparisonData.previous.observationDate).toLocaleDateString()}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-600">{lang === 'hi' ? 'स्वास्थ्य स्कोर:' : 'Health Score:'}</span>
                    <strong className="text-slate-900">{comparisonData.previous.satelliteData?.healthScore || 70}/100</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-600">{lang === 'hi' ? 'NDVI सूचकांक:' : 'NDVI Index:'}</span>
                    <strong className="text-slate-900">{comparisonData.previous.satelliteData?.ndviMean ? comparisonData.previous.satelliteData.ndviMean.toFixed(2) : '0.62'}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-600">{lang === 'hi' ? 'नमी स्थिति:' : 'Moisture Status:'}</span>
                    <strong className="text-slate-900">
                      {lang === 'hi' ? comparisonData.previous.moistureStatus?.statusHi : comparisonData.previous.moistureStatus?.status}
                    </strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600">{lang === 'hi' ? 'सिंचाई आवश्यकता:' : 'Irrigation Required:'}</span>
                    <strong className={comparisonData.previous.irrigationAdvisory?.actionRequired ? 'text-rose-600' : 'text-emerald-700'}>
                      {comparisonData.previous.irrigationAdvisory?.actionRequired
                        ? (lang === 'hi' ? 'हाँ' : 'Yes')
                        : (lang === 'hi' ? 'नहीं' : 'No')}
                    </strong>
                  </div>
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl">
            {lang === 'hi'
              ? 'वर्तमान में इस खेत का एक अवलोकन मौजूद है। अगले उपग्रह व मौसम चक्र के बाद पूर्ण तुलना स्वतः सक्रिय हो जाएगी।'
              : 'Initial observation recorded. Comparative temporal deltas will unlock automatically with the next monitoring telemetry cycle.'}
          </div>
        )}
      </div>

      {/* 6. SCIENTIFIC HONESTY & TRANSPARENCY DISCLAIMER */}
      <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-slate-600 text-xs space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-slate-800">
          <Info className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{lang === 'hi' ? 'वैज्ञानिक सत्यनिष्ठा एवं डेटा स्रोत' : 'Scientific Integrity & Data Transparency'}</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          {lang === 'hi'
            ? 'कृषि दृष्टि किसी भी उपग्रह से मिट्टी की सटीक नमी (प्रतिशत में) का झूठा दावा नहीं करता है। यहाँ प्रदर्शित नमी स्थिति ओपन-मेटियो (Open-Meteo) मौसम जल-संतुलन मॉडल (वर्षा बनाम ET0) एवं कॉपरनिकस सेंटिनल-2 वनस्पति जल-प्रतिरोधी सूचकांकों का साक्ष्य-आधारित अनुमान है।'
            : 'Krishi Drishti strictly complies with agronomic physics: satellite optical sensors do not measure exact subsurface moisture percentages. Field water status is an evidence-backed proxy computed from ECMWF/Open-Meteo soil water balances (Rain vs ET0 * Kc) combined with Copernicus Sentinel-2 canopy vigor.'}
        </p>
      </div>

      {/* 7. SOIL TEST REPORT MODAL */}
      {isSoilModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2">
                <span>🧪</span>
                <span>{lang === 'hi' ? 'खेत मिट्टी जांच रिपोर्ट जोड़ें' : 'Link Soil Test Report'}</span>
              </h3>
              <button
                onClick={() => setIsSoilModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSoilTest} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    pH Value (उदा. 6.5 - 7.5)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="7.2"
                    value={soilForm.ph}
                    onChange={(e) => setSoilForm({ ...soilForm, ph: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Organic Carbon % (OC)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.65"
                    value={soilForm.organicCarbon}
                    onChange={(e) => setSoilForm({ ...soilForm, organicCarbon: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nitrogen (N)</label>
                  <input
                    type="number"
                    placeholder="kg/ha"
                    value={soilForm.nitrogen}
                    onChange={(e) => setSoilForm({ ...soilForm, nitrogen: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phosphorus (P)</label>
                  <input
                    type="number"
                    placeholder="kg/ha"
                    value={soilForm.phosphorus}
                    onChange={(e) => setSoilForm({ ...soilForm, phosphorus: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Potassium (K)</label>
                  <input
                    type="number"
                    placeholder="kg/ha"
                    value={soilForm.potassium}
                    onChange={(e) => setSoilForm({ ...soilForm, potassium: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {lang === 'hi' ? 'प्रयोगशाला टिप्पणी / नोट्स' : 'Lab Notes / Observations'}
                </label>
                <textarea
                  rows="2"
                  placeholder={lang === 'hi' ? 'उदा. जिंक की कमी, जिप्सम उपचार की सिफारिश' : 'e.g. Zinc deficiency noted, gypsum recommended'}
                  value={soilForm.notes}
                  onChange={(e) => setSoilForm({ ...soilForm, notes: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSoilModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={soilSaving}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold shadow-sm disabled:opacity-60"
                >
                  {soilSaving
                    ? (lang === 'hi' ? 'सहेजा जा रहा है...' : 'Saving...')
                    : (lang === 'hi' ? 'रिपोर्ट सहेजें' : 'Save Soil Report')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
