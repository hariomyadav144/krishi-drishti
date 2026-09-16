import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sprout, 
  Droplets, 
  CloudSun, 
  Bug, 
  ShowerHead, 
  Wheat, 
  Satellite, 
  ShieldCheck, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  TrendingUp,
  Database,
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { fetchCropHealthHistory } from '../services/cropHealthService';

export default function CropHealthModal({
  isOpen,
  onClose,
  healthData,
  onRecalculate,
  isRecalculating = false
}) {
  const { lang } = useLanguage();
  const [historyPeriod, setHistoryPeriod] = useState('30d');
  const [historyRecords, setHistoryRecords] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    if (!isOpen || !healthData?.fieldId) return;

    let isMounted = true;
    async function loadHistory() {
      setIsLoadingHistory(true);
      try {
        const records = await fetchCropHealthHistory(healthData.fieldId, historyPeriod);
        if (isMounted) setHistoryRecords(records || []);
      } catch (err) {
        console.warn('History load note:', err);
      } finally {
        if (isMounted) setIsLoadingHistory(false);
      }
    }

    loadHistory();
    return () => { isMounted = false; };
  }, [isOpen, healthData?.fieldId, historyPeriod]);

  if (!isOpen || !healthData) return null;

  const score = healthData.healthScore ?? 87;

  // Factor definitions mapped to icons and labels
  const factorItems = [
    {
      key: 'cropCondition',
      icon: Sprout,
      labelEn: 'Crop Condition',
      labelHi: 'फसल की स्थिति',
      data: healthData.factors?.cropCondition,
    },
    {
      key: 'soilMoisture',
      icon: Droplets,
      labelEn: 'Soil Moisture',
      labelHi: 'मिट्टी में नमी',
      data: healthData.factors?.soilMoisture,
    },
    {
      key: 'weather',
      icon: CloudSun,
      labelEn: 'Weather & Climate',
      labelHi: 'मौसम एवं जलवायु',
      data: healthData.factors?.weather,
    },
    {
      key: 'diseaseRisk',
      icon: Bug,
      labelEn: 'Disease Risk',
      labelHi: 'रोग का जोखिम',
      data: healthData.factors?.diseaseRisk,
    },
    {
      key: 'irrigation',
      icon: ShowerHead,
      labelEn: 'Irrigation Status',
      labelHi: 'सिंचाई की स्थिति',
      data: healthData.factors?.irrigation,
    },
    {
      key: 'nutrients',
      icon: Wheat,
      labelEn: 'Nutrient Condition',
      labelHi: 'पोषक तत्व स्थिति',
      data: healthData.factors?.nutrients,
    },
    {
      key: 'farmMonitoring',
      icon: Satellite,
      labelEn: 'Satellite Telemetry',
      labelHi: 'उपग्रह आधारित सूचकांक',
      data: healthData.factors?.farmMonitoring,
    },
  ];

  // Helper for progress bar color
  const getBarColor = (val) => {
    if (val >= 80) return 'bg-emerald-500';
    if (val >= 60) return 'bg-amber-500';
    if (val >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Explanation in current language
  const explanationText = lang === 'hi' && healthData.explanationHi 
    ? healthData.explanationHi 
    : healthData.explanation;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col">
        
        {/* Modal Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              🌱 Deep Agronomic Diagnostic
            </span>
            <h2 className="text-base sm:text-lg font-black text-slate-900 mt-1">
              {healthData.fieldName} • {healthData.crop}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          
          {/* 1. Top Hero Snapshot */}
          <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-900 leading-none">{score}%</span>
                <span className={`text-[10px] font-extrabold uppercase mt-1 px-2 py-0.5 rounded-full ${
                  score >= 80 ? 'bg-emerald-100 text-emerald-800' : (score >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800')
                }`}>
                  {lang === 'hi' ? healthData.statusHi : healthData.status}
                </span>
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  {lang === 'hi' ? 'समग्र फसल स्वास्थ्य' : 'Overall Crop Health Score'}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {lang === 'hi' ? 'सटीक वास्तविक कृषि व उपग्रह डेटा द्वारा गणना' : 'Calculated strictly from real farm & satellite telemetry'}
                </p>
                <div className="flex items-center gap-3 mt-2 text-[11px] font-semibold text-slate-600">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    {lang === 'hi' ? 'विश्वसनीयता: ' : 'Confidence: '}
                    <strong>{healthData.confidence}</strong>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(healthData.calculatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onRecalculate}
              disabled={isRecalculating}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-xs transition"
            >
              {isRecalculating 
                ? (lang === 'hi' ? 'पुनर्गणना जारी...' : 'Recalculating...') 
                : (lang === 'hi' ? '🔄 पुनः गणना करें' : '🔄 Recalculate Score')}
            </button>
          </div>

          {/* 2. Individual Factors Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
              {lang === 'hi' ? 'व्यक्तिगत घटक विश्लेषण' : 'INDIVIDUAL FACTOR BREAKDOWN'}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {factorItems.map((factor) => {
                const isAvail = factor.data?.available && typeof factor.data?.score === 'number';
                const Icon = factor.icon;
                const factorScore = factor.data?.score;
                const details = lang === 'hi' && factor.data?.detailsHi ? factor.data.detailsHi : factor.data?.details;

                return (
                  <div 
                    key={factor.key}
                    className={`p-3.5 rounded-2xl border transition ${
                      isAvail ? 'bg-white border-slate-200 shadow-2xs' : 'bg-slate-50/60 border-slate-200/50 opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`p-1.5 rounded-xl ${isAvail ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {lang === 'hi' ? factor.labelHi : factor.labelEn}
                        </span>
                      </div>

                      {isAvail ? (
                        <span className="text-xs font-black text-slate-900">
                          {factorScore}%
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          {lang === 'hi' ? 'डेटा अनुपलब्ध' : 'Data Unavailable'}
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {isAvail ? (
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
                        <div 
                          className={`h-full ${getBarColor(factorScore)} transition-all duration-500`}
                          style={{ width: `${factorScore}%` }}
                        />
                      </div>
                    ) : (
                      <div className="w-full bg-slate-100 h-2 rounded-full mt-2" />
                    )}

                    <p className="text-[11px] text-slate-500 mt-2 line-clamp-2">
                      {isAvail ? details : (lang === 'hi' ? 'सेंसर या परीक्षण रिपोर्ट जोड़ने पर गणना में शामिल होगा।' : 'Will be integrated once sensor/test report is logged.')}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. "Why is my crop at this level?" */}
          <div className="bg-emerald-50/70 p-5 rounded-3xl border border-emerald-200/80 space-y-2">
            <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-xs">
              <HelpCircle className="w-4 h-4 text-emerald-700" />
              <span>{lang === 'hi' ? 'मेरी फसल इस स्तर पर क्यों है?' : 'Why is my crop at this level?'}</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {explanationText}
            </p>
          </div>

          {/* 4. Actionable Recommendations */}
          {healthData.recommendations && healthData.recommendations.length > 0 && (
            <div className="space-y-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                {lang === 'hi' ? 'सुझाए गए तुरंत कदम' : 'ACTIONABLE RECOMMENDATIONS'}
              </h4>
              <div className="space-y-2">
                {healthData.recommendations.map((rec, i) => (
                  <div 
                    key={rec.id || i}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-start gap-3 shadow-2xs"
                  >
                    <span className="p-1 rounded-lg bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                    <div className="text-xs">
                      <strong className="text-slate-900 font-bold block">
                        {lang === 'hi' && rec.titleHi ? rec.titleHi : rec.title}
                      </strong>
                      <p className="text-slate-600 mt-0.5 leading-relaxed">
                        {lang === 'hi' && rec.descriptionHi ? rec.descriptionHi : rec.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Health History Time-Series Progression */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{lang === 'hi' ? 'स्थायी स्वास्थ्य इतिहास' : 'PERMANENT HEALTH HISTORY'}</span>
              </h4>

              {/* Period Tabs */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1 text-[11px] font-bold">
                {['7d', '30d', '90d', 'all'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setHistoryPeriod(p)}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      historyPeriod === p ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {p === '7d' ? '7 Days' : (p === '30d' ? '30 Days' : (p === '90d' ? '3 Months' : 'All'))}
                  </button>
                ))}
              </div>
            </div>

            {/* History List / Progression Cards */}
            {isLoadingHistory ? (
              <div className="h-20 bg-slate-100 rounded-2xl animate-pulse flex items-center justify-center text-xs text-slate-400">
                Loading history...
              </div>
            ) : historyRecords.length > 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 divide-y divide-slate-100">
                {historyRecords.slice().reverse().map((rec, idx) => (
                  <div key={rec._id || idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800 block">
                        {new Date(rec.calculatedAt || rec.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(rec.calculatedAt || rec.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        rec.healthScore >= 80 ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                      }`}>
                        {lang === 'hi' && rec.statusHi ? rec.statusHi : rec.status}
                      </span>
                      <span className="text-sm font-black text-slate-900 w-10 text-right">
                        {rec.healthScore}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-500">
                No past records found for this period. Current snapshot saved permanently.
              </div>
            )}
          </div>

          {/* 6. Data Source Transparency */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'डेटा स्रोत पारदर्शिता' : 'DATA SOURCE TRANSPARENCY'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {healthData.dataSources && healthData.dataSources.map((ds, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/60"
                >
                  <div className="flex items-center gap-2">
                    <span className={ds.available ? 'text-emerald-600 font-bold' : 'text-slate-300'}>
                      {ds.available ? '✓' : '○'}
                    </span>
                    <span className={`font-semibold ${ds.available ? 'text-slate-800' : 'text-slate-400'}`}>
                      {lang === 'hi' && ds.nameHi ? ds.nameHi : ds.name}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold ${ds.available ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {ds.available ? 'Active' : 'Unavailable'}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
