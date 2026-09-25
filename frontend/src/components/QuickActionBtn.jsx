import React from 'react';

export default function QuickActionBtn({ icon: Icon, title, subtitle, onClick, color = 'emerald' }) {
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
      className={`p-2 sm:p-3 rounded-2xl border flex flex-col items-center justify-center text-center transition-all transform active:scale-95 shadow-2xs min-w-0 w-full overflow-hidden ${colorStyles[color] || colorStyles.emerald}`}
    >
      <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white/90 shadow-2xs flex items-center justify-center mb-1.5 shrink-0">
        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>
      <span className="font-bold text-[11px] sm:text-xs leading-tight block w-full truncate px-0.5">
        {title}
      </span>
      {subtitle && (
        <span className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 block w-full truncate px-0.5">
          {subtitle}
        </span>
      )}
    </button>
  );
}
