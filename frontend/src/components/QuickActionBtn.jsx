import React from 'react';

export default function QuickActionBtn({ icon: Icon, title, titleHi, subtitle, onClick, variant = 'primary', color = 'emerald' }) {
  const colorStyles = {
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/80',
    blue: 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100/80',
    amber: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100/80',
    purple: 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100/80',
    teal: 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100/80',
  };

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center transition-all transform active:scale-95 shadow-xs ${colorStyles[color] || colorStyles.emerald}`}
    >
      <div className="w-11 h-11 rounded-xl bg-white/90 shadow-xs flex items-center justify-center mb-2">
        <Icon className="w-6 h-6" />
      </div>
      <span className="font-bold text-xs leading-tight">{title}</span>
      {subtitle && (
        <span className="text-[10px] text-slate-500 mt-0.5">{subtitle}</span>
      )}
    </button>
  );
}
