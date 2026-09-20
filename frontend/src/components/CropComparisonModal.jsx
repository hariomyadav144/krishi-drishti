import React, { useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  X, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Sparkles, 
  Printer, 
  Share2, 
  Activity, 
  ShieldAlert, 
  Droplet, 
  FileText 
} from 'lucide-react';

export default function CropComparisonModal({ comparisonData, onClose }) {
  const { lang, t } = useLanguage();
  const printRef = useRef(null);

  if (!comparisonData) return null;

  const actualData = comparisonData.comparison ? comparisonData : (comparisonData.data || comparisonData);
  const oldScan = actualData.oldScan || {};
  const newScan = actualData.newScan || {};
  const comparison = actualData.comparison || {};
  const isHi = lang === 'hi';

  const isImproved = comparison.status === 'Improved' || comparison.status === 'Resolved';
  const isDeteriorated = comparison.status === 'Deteriorated';

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const shareText = isHi
      ? `🌾 फ़सल दृष्टि फसल स्वास्थ्य तुलना (${oldScan.cropName}): ${comparison.statusHi}! स्वास्थ्य: ${comparison.healthChange}.`
      : `🌾 Fasal Drishti Crop Comparison (${oldScan.cropName}): ${comparison.status}! Health: ${comparison.healthChange}.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Fasal Drishti Crop Health Comparison',
          text: shareText,
          url: window.location.href,
        });
      } catch (_) {}
    } else {
      navigator.clipboard.writeText(shareText);
      alert(isHi ? 'तुलना रिपोर्ट कॉपी हो गई!' : 'Comparison report copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        ref={printRef}
        className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto border border-slate-200 flex flex-col scrollbar-thin"
      >
        {/* Modal Top Header */}
        <div className="sticky top-0 z-20 bg-gradient-to-r from-emerald-800 to-teal-900 text-white px-5 py-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-white/10 rounded-xl text-xl">⚖️</span>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                {isHi ? 'फसल स्वास्थ्य तुलना (समय के साथ प्रगति)' : 'Crop Health Comparison (Then vs Now)'}
              </h2>
              <p className="text-xs text-emerald-200 font-medium">
                {oldScan.cropName} • {comparison.daysBetweenScans} {isHi ? 'दिनों का अंतर' : 'days between scans'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              title={isHi ? 'शेयर करें' : 'Share report'}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-white"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={handlePrint}
              title={isHi ? 'प्रिंट करें' : 'Print report'}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-white hidden sm:block"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-rose-600/80 transition text-white ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Highlight Banner */}
        <div className="p-4 sm:p-6 space-y-6">
          <div className={`rounded-2xl p-4 sm:p-5 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
            isImproved 
              ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
              : isDeteriorated
              ? 'bg-rose-50/90 border-rose-300 text-rose-950'
              : 'bg-amber-50/90 border-amber-300 text-amber-950'
          }`}>
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md ${
                isImproved ? 'bg-emerald-600' : isDeteriorated ? 'bg-rose-600' : 'bg-amber-600'
              }`}>
                {isImproved ? <TrendingUp className="w-6 h-6" /> : isDeteriorated ? <TrendingDown className="w-6 h-6" /> : <Minus className="w-6 h-6" />}
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider opacity-75">
                  {isHi ? 'प्रगति परिणाम' : 'Progress Assessment'}
                </span>
                <h3 className="text-lg sm:text-xl font-extrabold flex items-center gap-2">
                  {isHi ? comparison.statusHi : comparison.status}
                  {isImproved && <span className="text-sm font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">✓ Recovering</span>}
                  {isDeteriorated && <span className="text-sm font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">! Needs Attention</span>}
                </h3>
                <p className="text-xs sm:text-sm font-semibold mt-0.5">
                  {comparison.healthChange}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-current/10">
              <div className="text-right">
                <span className="text-2xs font-bold uppercase tracking-wider block opacity-70">
                  {isHi ? 'स्कोर बदलाव' : 'Score Change'}
                </span>
                <span className={`text-base sm:text-lg font-black ${
                  comparison.progressScoreChange >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  {comparison.progressScoreChange >= 0 ? `+${comparison.progressScoreChange}%` : `${comparison.progressScoreChange}%`}
                </span>
              </div>
            </div>
          </div>

          {/* Visual Side-by-Side Images & Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* OLD SCAN CARD */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-800 text-xs font-extrabold uppercase tracking-wide flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-600" />
                  {isHi ? 'पहला स्कैन (पुराना)' : 'Earlier Scan'}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {new Date(oldScan.date).toLocaleDateString(isHi ? 'hi-IN' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-300 shadow-xs group">
                <img 
                  src={oldScan.imageUrl} 
                  alt="Earlier Scan" 
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22509?w=600&auto=format&fit=crop&q=80';
                  }}
                />
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-2xs font-bold bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-md">
                  <span>{oldScan.cropStage}</span>
                  <span className="text-amber-300">Score: {oldScan.healthScore}%</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800">{oldScan.cropName}</span>
                  <span className={`px-2 py-0.5 rounded-full text-2xs font-bold ${
                    oldScan.severity === 'High' || oldScan.severity === 'Critical'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {oldScan.healthStatus}
                  </span>
                </div>
                <p className="text-xs text-rose-700 font-bold flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {isHi ? (oldScan.detectedProblemHi || oldScan.detectedProblem) : oldScan.detectedProblem}
                </p>
              </div>
            </div>

            {/* NEW SCAN CARD */}
            <div className="bg-emerald-50/40 border border-emerald-200 rounded-2xl p-4 flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-extrabold uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {isHi ? 'हालिया स्कैन (नया)' : 'Latest Scan'}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {new Date(newScan.date).toLocaleDateString(isHi ? 'hi-IN' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-emerald-300 shadow-xs group">
                <img 
                  src={newScan.imageUrl} 
                  alt="Latest Scan" 
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop&q=80';
                  }}
                />
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-2xs font-bold bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-md">
                  <span>{newScan.cropStage}</span>
                  <span className="text-emerald-300">Score: {newScan.healthScore}%</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800">{newScan.cropName}</span>
                  <span className={`px-2 py-0.5 rounded-full text-2xs font-bold ${
                    newScan.healthStatus === 'Healthy' || newScan.healthStatus === 'Good'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {newScan.healthStatus}
                  </span>
                </div>
                <p className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isHi ? (newScan.detectedProblemHi || newScan.detectedProblem) : newScan.detectedProblem}
                </p>
              </div>
            </div>
          </div>

          {/* AI Narrative Breakdown */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-4 shadow-lg">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h4 className="text-sm font-extrabold text-emerald-400 tracking-wide uppercase">
                {isHi ? 'फ़सल दृष्टि AI तुलना विश्लेषण' : 'Fasal Drishti AI Comparative Diagnosis'}
              </h4>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  {isHi ? '१. क्या बदलाव हुआ (What Changed)' : '1. What Changed'}
                </span>
                <p className="text-slate-200 font-medium leading-relaxed">
                  {isHi ? comparison.whatChangedHi : comparison.whatChanged}
                </p>
              </div>

              <div>
                <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  {isHi ? '२. बदलाव का संभावित कारण (Probable Reason)' : '2. Probable Reason for Change'}
                </span>
                <p className="text-slate-300 font-medium leading-relaxed">
                  {isHi ? comparison.possibleReasonHi : comparison.possibleReason}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <span className="text-2xs font-bold uppercase tracking-wider text-emerald-400 block mb-1 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  {isHi ? '३. किसान के लिए आज का जरूरी कदम (What You Should Do Now)' : '3. What You Should Do Now (Action Advice)'}
                </span>
                <div className="bg-emerald-950/60 border border-emerald-600/40 p-3 rounded-xl text-emerald-100 font-semibold leading-relaxed">
                  {isHi ? comparison.actionAdviceHi : comparison.actionAdvice}
                </div>
              </div>
            </div>
          </div>

          {/* Detailed 10-Point Comparison Grid */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                {isHi ? '१०-सूत्रीय तुलनात्मक तालिका (Then vs Now Grid)' : '10-Point Comparative Analysis Matrix'}
              </h4>
            </div>

            <div className="divide-y divide-slate-200 text-xs">
              {/* Row 1: Condition */}
              <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white">
                <span className="font-extrabold text-slate-600">{isHi ? '१. फसल की स्थिति' : '1. Crop Condition'}</span>
                <span className="text-slate-600"><strong className="text-2xs text-slate-400 block">THEN:</strong> {comparison.conditionThenVsNow?.then || oldScan.cropStage}</span>
                <span className="text-emerald-800 font-bold"><strong className="text-2xs text-emerald-600 block">NOW:</strong> {comparison.conditionThenVsNow?.now || newScan.cropStage}</span>
              </div>

              {/* Row 2: Disease / Problem */}
              <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50/50">
                <span className="font-extrabold text-slate-600">{isHi ? '२. समस्या / रोग' : '2. Detected Problem'}</span>
                <span className="text-rose-700 font-bold"><strong className="text-2xs text-slate-400 block">THEN:</strong> {comparison.diseaseThenVsNow?.then || oldScan.detectedProblem}</span>
                <span className="text-emerald-700 font-bold"><strong className="text-2xs text-emerald-600 block">NOW:</strong> {comparison.diseaseThenVsNow?.now || newScan.detectedProblem}</span>
              </div>

              {/* Row 3: Health Status */}
              <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white">
                <span className="font-extrabold text-slate-600">{isHi ? '३. स्वास्थ्य स्थिति' : '3. Health Status'}</span>
                <span className="text-slate-700 font-semibold"><strong className="text-2xs text-slate-400 block">THEN:</strong> {oldScan.healthStatus} ({oldScan.healthScore}%)</span>
                <span className="text-emerald-700 font-bold"><strong className="text-2xs text-emerald-600 block">NOW:</strong> {newScan.healthStatus} ({newScan.healthScore}%)</span>
              </div>

              {/* Row 4: Symptoms */}
              <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50/50">
                <span className="font-extrabold text-slate-600">{isHi ? '४. दिखाई दिए लक्षण' : '4. Observed Symptoms'}</span>
                <span className="text-slate-600 text-2xs leading-relaxed"><strong className="text-2xs text-slate-400 block">THEN:</strong> {(oldScan.symptoms || []).join(', ') || 'None noted'}</span>
                <span className="text-slate-800 text-2xs leading-relaxed font-semibold"><strong className="text-2xs text-emerald-600 block">NOW:</strong> {(newScan.symptoms || []).join(', ') || 'Clean leaves'}</span>
              </div>

              {/* Row 5: AI Diagnosis */}
              <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white">
                <span className="font-extrabold text-slate-600">{isHi ? '५. AI निदान (Diagnosis)' : '5. AI Diagnosis'}</span>
                <span className="text-slate-600 text-2xs leading-relaxed"><strong className="text-2xs text-slate-400 block">THEN:</strong> {oldScan.diagnosis || oldScan.cause}</span>
                <span className="text-slate-800 text-2xs leading-relaxed font-semibold"><strong className="text-2xs text-emerald-600 block">NOW:</strong> {newScan.diagnosis || newScan.cause}</span>
              </div>

              {/* Row 6: Treatment Recommended */}
              <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50/50">
                <span className="font-extrabold text-slate-600">{isHi ? '६. अनुशंसित उपचार' : '6. Treatment Recommended'}</span>
                <span className="text-slate-600 text-2xs leading-relaxed"><strong className="text-2xs text-slate-400 block">THEN:</strong> {comparison.treatmentThenVsNow?.then}</span>
                <span className="text-emerald-800 text-2xs leading-relaxed font-bold"><strong className="text-2xs text-emerald-600 block">NOW:</strong> {comparison.treatmentThenVsNow?.now}</span>
              </div>

              {/* Row 7: Trend / Progress */}
              <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white">
                <span className="font-extrabold text-slate-600">{isHi ? '७. सुधार या गिरावट' : '7. Improved vs Deteriorated'}</span>
                <span className="col-span-2 font-bold text-xs" style={{ color: isImproved ? '#059669' : isDeteriorated ? '#dc2626' : '#d97706' }}>
                  {isHi ? comparison.statusHi : comparison.status} ({comparison.healthChange})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
          <p className="text-2xs text-slate-500 font-medium">
            🌾 Fasal Drishti Cloud Storage • Verified against official APMC & Agronomy Standards
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition shadow-xs"
          >
            {isHi ? 'बंद करें' : 'Close Comparison'}
          </button>
        </div>
      </div>
    </div>
  );
}
