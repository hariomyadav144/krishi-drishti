import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Eye, 
  Edit3, 
  Trash2, 
  MapPin, 
  Layers, 
  Clock, 
  Sprout, 
  Calendar,
  CheckCircle2
} from 'lucide-react';

export default function SavedFieldsList({
  fields = [],
  activeFieldId = null,
  onViewField,
  onEditField,
  onDeleteField
}) {
  const { lang } = useLanguage();

  if (!fields || fields.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-xl">
          🌱
        </div>
        <h4 className="font-black text-slate-800 text-sm">
          {lang === 'hi' ? 'कोई सहेजा गया खेत नहीं मिला' : 'No Saved Fields Yet'}
        </h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          {lang === 'hi'
            ? 'नक्शे पर सीमा के कोने चिह्नित करें और अपना पहला खेत सहेजने के लिए "Save Field" दबाएं।'
            : 'Mark boundary corners on the interactive map above and click "Save Field" to anchor your first field.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            🗺️
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-sm sm:text-base">
              {lang === 'hi' ? 'सहेजे गए खेत (Saved Fields)' : 'Saved Fields'}
            </h3>
            <p className="text-[11px] text-slate-500">
              {fields.length} {fields.length === 1 ? 'Farm Plot Registered' : 'Farm Plots Registered'}
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Saved Field Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {fields.map((field) => {
          const isActive = field.id === activeFieldId;
          const formattedDate = new Date(field.updatedAt || field.createdAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });

          return (
            <div
              key={field.id}
              className={`rounded-2xl p-4 border transition flex flex-col justify-between space-y-3 ${
                isActive
                  ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-200 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white shadow-2xs'
              }`}
            >
              {/* Top Row: Title, Crop Badge, Active Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-black text-slate-900 text-xs sm:text-sm truncate">
                      {field.fieldName}
                    </h4>
                    {isActive && (
                      <span className="text-[9px] bg-emerald-600 text-white font-extrabold uppercase px-1.5 py-0.2 rounded-full">
                        Active Anchor
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{field.farmerName || 'Farm Plot'}</span>
                  </p>
                </div>

                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300/60 shrink-0">
                  🌾 {field.crop || 'Crop'}
                </span>
              </div>

              {/* Middle Metrics Row */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-xl p-2.5 text-[11px] border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Area</span>
                  <span className="font-black text-slate-900 block">
                    {field.formattedAcres || `${(field.areaAcres || 0).toFixed(2)} ac`}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Hectares</span>
                  <span className="font-black text-emerald-800 block">
                    {field.formattedHectares || `${(field.areaHectares || 0).toFixed(2)} ha`}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Boundary</span>
                  <span className="font-black text-slate-900 block">
                    {field.cornersCount || (field.points ? field.points.length : 0)} pts
                  </span>
                </div>
              </div>

              {/* Bottom Row: Timestamp and Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100/80">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formattedDate}</span>
                </span>

                <div className="flex items-center gap-1">
                  {/* View Button */}
                  <button
                    type="button"
                    onClick={() => onViewField(field)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1 transition active:scale-95 border border-emerald-200"
                    title="View this field polygon on the map"
                  >
                    <Eye className="w-3 h-3" />
                    <span>View</span>
                  </button>

                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={() => onEditField(field)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition active:scale-95 border border-slate-200"
                    title="Edit boundary corners and crop profile"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete field "${field.fieldName}"? This action cannot be undone.`)) {
                        onDeleteField(field.id);
                      }
                    }}
                    className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition active:scale-95"
                    title="Delete field"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
