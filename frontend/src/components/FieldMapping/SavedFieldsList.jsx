import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { 
  CheckCircle2, 
  MapPin, 
  Trash2, 
  Edit3, 
  Radio, 
  Sparkles, 
  Plus, 
  Navigation,
  Check
} from 'lucide-react';

export default function SavedFieldsList({
  fields = [],
  activeFieldId = null,
  onViewField,
  onEditField,
  onActivateFarm,
  onDeleteField,
  onCreateNewField,
  onNavigateIntelligence
}) {
  const { lang } = useLanguage();

  // Section 25: Empty Farm State
  if (!fields || fields.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-2xl shadow-inner">
          🌱
        </div>
        <div className="space-y-1.5">
          <h4 className="font-black text-slate-900 text-base">
            {lang === 'hi' ? 'अपना पहला खेत जोड़ें (Add your first farm)' : 'Add your first farm'}
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            {lang === 'hi'
              ? 'फ़सल दृष्टि कई खेतों का प्रबंधन कर सकती है। लाइव GPS से पहला खेत मैप करें, फिर कभी भी और खेत जोड़ें।'
              : 'Fasal Drishti can manage multiple fields. Map the first field with live GPS, then add more fields any time.'}
          </p>
        </div>
        {onCreateNewField && (
          <button
            type="button"
            id="btn-map-my-first-farm"
            onClick={onCreateNewField}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-agri-700 hover:from-emerald-700 hover:to-agri-800 text-white font-black text-xs inline-flex items-center gap-2 shadow-md transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'hi' ? 'पहला खेत मैप करें (Map My First Farm)' : 'Map My First Farm'}</span>
          </button>
        )}
      </div>
    );
  }

  // Section 24: My Farms Screen / Card List
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base">
            🌾
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-sm sm:text-base">
              {lang === 'hi' ? 'आपके खेत (Your Farms)' : 'Your Farms'}
            </h3>
            <p className="text-[11px] text-slate-500">
              {fields.length} {fields.length === 1 ? 'field saved' : 'fields saved'} • Choose an active field for farm intelligence
            </p>
          </div>
        </div>

        {/* Section 19: Add Another Farm Button */}
        {onCreateNewField && (
          <button
            type="button"
            id="btn-add-another-farm"
            onClick={onCreateNewField}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>{lang === 'hi' ? '+ दूसरा खेत जोड़ें' : '+ Add Another Farm'}</span>
          </button>
        )}
      </div>

      {/* Farm Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {fields.map((farm, index) => {
          const isActive = farm.id === activeFieldId || farm._id === activeFieldId;
          const farmName = farm.name || farm.fieldName || `Farm ${index + 1}`;
          const cornersCount = (farm.boundary && Array.isArray(farm.boundary))
            ? farm.boundary.length
            : (farm.points && Array.isArray(farm.points) ? farm.points.length : (farm.cornersCount || 0));
          const areaDisplay = farm.farmArea || farm.formattedAcres || `${(farm.areaAcres || 0).toFixed(2)}`;

          return (
            <div
              key={farm.id || farm._id || index}
              className={`rounded-2xl p-4 border transition flex flex-col justify-between space-y-3.5 ${
                isActive
                  ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-300/80 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-white shadow-2xs'
              }`}
            >
              {/* Card Header: Name + ACTIVE FIELD badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-black text-slate-900 text-sm truncate flex items-center gap-1.5">
                      <span>🌾</span>
                      <span>{farmName}</span>
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{farm.farmerName || 'Registered Field'}</span>
                  </p>
                </div>

                {isActive ? (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-600 text-white font-black uppercase px-2.5 py-0.5 rounded-full shadow-2xs tracking-wider shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                    <span>ACTIVE FIELD</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-400 shrink-0">
                    Inactive
                  </span>
                )}
              </div>

              {/* Middle Metrics Row */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50/90 rounded-xl p-2.5 text-[11px] border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Area</span>
                  <span className="font-black text-slate-900 block">
                    {areaDisplay} ac
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Crop</span>
                  <span className="font-black text-emerald-800 block truncate">
                    {farm.crop || 'Pending'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Boundary</span>
                  <span className="font-black text-slate-900 block">
                    {cornersCount} GPS pts
                  </span>
                </div>
              </div>

              {/* Bottom Actions Row */}
              <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-1.5 flex-wrap flex-1">
                  {/* Inactive Farm: [ Use This Farm ] button */}
                  {!isActive && onActivateFarm && (
                    <button
                      type="button"
                      id={`btn-use-farm-${farm.id}`}
                      onClick={() => onActivateFarm(farm.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition active:scale-95"
                      title="Set as active field for downstream intelligence"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Use This Farm</span>
                    </button>
                  )}

                  {/* [ Update ] button */}
                  {onEditField && (
                    <button
                      type="button"
                      id={`btn-update-farm-${farm.id}`}
                      onClick={() => onEditField(farm)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 border border-slate-200 transition active:scale-95"
                      title="Update boundary points or profile"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Update</span>
                    </button>
                  )}

                  {/* [ Intelligence ] button */}
                  {onNavigateIntelligence && (
                    <button
                      type="button"
                      id={`btn-intel-farm-${farm.id}`}
                      onClick={() => {
                        if (!isActive && onActivateFarm) onActivateFarm(farm.id);
                        onNavigateIntelligence(farm);
                      }}
                      className="px-2 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs flex items-center gap-1 border border-purple-200 transition active:scale-95"
                      title="View Satellite, NDVI & Crop Intelligence"
                    >
                      <Sparkles className="w-3 h-3 text-purple-500" />
                      <span className="hidden sm:inline">Intelligence</span>
                    </button>
                  )}
                </div>

                {/* Delete Button */}
                {onDeleteField && (
                  <button
                    type="button"
                    id={`btn-delete-farm-${farm.id}`}
                    onClick={() => {
                      if (window.confirm(`Delete farm "${farmName}"? This action cannot be undone.`)) {
                        onDeleteField(farm.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition active:scale-95 shrink-0"
                    title="Delete farm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
