import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Sprout, Activity, Calendar, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function CropCard({ crop, onScanClick, onViewDetails }) {
  const { t, lang } = useLanguage();

  if (!crop) {
    return (
      <div className="agri-card p-5 bg-gradient-to-br from-agri-50 to-white border-agri-200">
        <p className="text-sm text-slate-600">No active crop selected.</p>
      </div>
    );
  }

  const getHealthBadge = (status) => {
    switch (status) {
      case 'Excellent':
        return { bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: ShieldCheck, label: lang === 'hi' ? 'उत्कृष्ट' : 'Excellent' };
      case 'Good':
        return { bg: 'bg-green-100 text-green-800 border-green-300', icon: ShieldCheck, label: lang === 'hi' ? 'अच्छा' : 'Good' };
      case 'Moderate':
        return { bg: 'bg-amber-100 text-amber-800 border-amber-300', icon: AlertTriangle, label: lang === 'hi' ? 'मध्यम' : 'Moderate' };
      case 'At Risk':
      case 'Diseased':
        return { bg: 'bg-red-100 text-red-800 border-red-300 animate-pulse', icon: AlertTriangle, label: lang === 'hi' ? 'जोखिम में' : status };
      default:
        return { bg: 'bg-slate-100 text-slate-800 border-slate-300', icon: ShieldCheck, label: status };
    }
  };

  const badge = getHealthBadge(crop.healthStatus);
  const BadgeIcon = badge.icon;

  // Calculate days since sowing
  const plantingDate = crop.plantingDate ? new Date(crop.plantingDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const daysSince = Math.max(1, Math.floor((Date.now() - plantingDate.getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="agri-card p-5 bg-white border-slate-200 relative overflow-hidden shadow-sm hover:shadow-md transition">
      {/* Decorative gradient corner */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-agri-100/60 to-transparent pointer-events-none rounded-bl-full"></div>

      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-agri-600 to-agri-500 text-white flex items-center justify-center shadow-md">
            <Sprout className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-agri-700 bg-agri-50 px-2 py-0.5 rounded border border-agri-200">
                {t('dashboard.currentCrop')}
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">
              {crop.cropName}
            </h3>
            <p className="text-xs text-slate-500">
              {crop.variety || 'Hybrid Variety'} • {crop.areaAllocated || 2.5} Acres
            </p>
          </div>
        </div>

        {/* Health status badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.bg}`}>
          <BadgeIcon className="w-3.5 h-3.5" />
          <span>{badge.label}</span>
        </div>
      </div>

      {/* Crop Progress and Stage Indicators */}
      <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-100 text-xs">
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <span className="text-slate-500 block text-[11px] flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-agri-600" />
            {t('dashboard.cropStage')}
          </span>
          <span className="font-semibold text-slate-800 text-xs mt-0.5 block truncate">
            {crop.cropStage || 'Vegetative Stage'}
          </span>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <span className="text-slate-500 block text-[11px] flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            {t('dashboard.plantingDate')}
          </span>
          <span className="font-semibold text-slate-800 text-xs mt-0.5 block">
            Day {daysSince} ({plantingDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })})
          </span>
        </div>
      </div>

      {/* Quick Diagnose CTA */}
      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={onScanClick}
          className="flex-1 bg-gradient-to-r from-agri-700 to-agri-600 hover:from-agri-800 hover:to-agri-700 text-white font-semibold text-xs py-2.5 px-4 rounded-xl shadow-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
        >
          <span>🔍 {lang === 'hi' ? 'फसल की जांच करें' : 'Diagnose Crop Problem'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
