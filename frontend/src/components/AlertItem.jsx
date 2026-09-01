import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { AlertCircle, CloudRain, Droplets, Sprout, CheckCircle2, ShieldAlert, Clock } from 'lucide-react';

export default function AlertItem({ alert, onMarkRead }) {
  const { lang } = useLanguage();

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'critical':
        return {
          bg: 'bg-red-500 text-white animate-pulse',
          border: 'border-red-300 bg-red-50/50',
          label: lang === 'hi' ? 'गंभीर' : 'CRITICAL',
          icon: ShieldAlert,
        };
      case 'high':
        return {
          bg: 'bg-orange-500 text-white',
          border: 'border-orange-200 bg-orange-50/40',
          label: lang === 'hi' ? 'उच्च' : 'HIGH',
          icon: AlertCircle,
        };
      case 'medium':
        return {
          bg: 'bg-amber-500 text-white',
          border: 'border-amber-200 bg-amber-50/30',
          label: lang === 'hi' ? 'मध्यम' : 'MEDIUM',
          icon: Clock,
        };
      default:
        return {
          bg: 'bg-slate-500 text-white',
          border: 'border-slate-200 bg-white',
          label: lang === 'hi' ? 'सामान्य' : 'LOW',
          icon: Sprout,
        };
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'weather':
        return <CloudRain className="w-5 h-5 text-blue-600" />;
      case 'irrigation':
        return <Droplets className="w-5 h-5 text-teal-600" />;
      case 'fertilizer':
      case 'crop_health':
        return <Sprout className="w-5 h-5 text-emerald-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-slate-600" />;
    }
  };

  const badge = getPriorityBadge(alert.priority);
  const timeStr = new Date(alert.createdAt || Date.now()).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`p-4 rounded-2xl border transition-all ${badge.border} ${
        alert.isRead ? 'opacity-70 bg-white' : 'shadow-xs'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-slate-100 flex items-center justify-center shrink-0">
            {getCategoryIcon(alert.category)}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${badge.bg}`}>
                {badge.label}
              </span>
              <span className="text-[10px] text-slate-400 capitalize">
                {alert.category ? alert.category.replace('_', ' ') : 'Alert'} • {timeStr}
              </span>
            </div>

            <h4 className="font-bold text-xs text-slate-900 leading-snug">
              {lang === 'hi' && alert.titleHi ? alert.titleHi : alert.title}
            </h4>

            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {lang === 'hi' && alert.messageHi ? alert.messageHi : alert.message}
            </p>
          </div>
        </div>

        {!alert.isRead && onMarkRead && (
          <button
            onClick={() => onMarkRead(alert._id)}
            className="text-[11px] font-semibold text-agri-700 hover:text-agri-900 px-2 py-1 bg-white rounded-lg border border-slate-200 shrink-0"
            title="Mark as read"
          >
            ✓
          </button>
        )}
      </div>
    </div>
  );
}
