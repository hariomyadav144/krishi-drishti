import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Save, 
  Sprout, 
  Calendar, 
  FileText, 
  MapPin, 
  User, 
  CheckCircle2, 
  AlertCircle,
  Maximize2,
  Check
} from 'lucide-react';

const CROP_OPTIONS = [
  'Maize',
  'Wheat',
  'Rice',
  'Paddy',
  'Sugarcane',
  'Potato',
  'Mustard',
  'Cotton',
  'Soybean',
  'Tomato',
  'Onion',
  'Other'
];

const SEASON_OPTIONS = [
  'Kharif (Monsoon)',
  'Rabi (Winter)',
  'Zaid (Summer)',
  'Year-round'
];

const SOIL_OPTIONS = [
  'Black Soil / Regur',
  'Alluvial Soil',
  'Red & Yellow Soil',
  'Sandy Loam',
  'Clayey Soil'
];

export default function FieldDataForm({
  initialField = null,
  boundaryPoints = [],
  areaAcres = 0,
  areaHectares = 0,
  onSave,
  isSaving = false,
  onCropChange
}) {
  const { lang } = useLanguage();

  const [fieldName, setFieldName] = useState(initialField?.fieldName || 'North Field - Plot A');
  const [crop, setCrop] = useState(initialField?.crop || 'Maize');
  const [season, setSeason] = useState(initialField?.season || 'Kharif (Monsoon)');
  const [farmerName, setFarmerName] = useState(initialField?.farmerName || 'Rameshwar Patil');
  const [soilType, setSoilType] = useState(initialField?.soilType || 'Black Soil / Regur');
  const [notes, setNotes] = useState(initialField?.notes || '');
  const [formError, setFormError] = useState('');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');

  // Update fields if initialField changes
  useEffect(() => {
    if (initialField) {
      if (initialField.fieldName) setFieldName(initialField.fieldName);
      if (initialField.crop) {
        setCrop(initialField.crop);
        if (onCropChange) onCropChange(initialField.crop);
      }
      if (initialField.season) setSeason(initialField.season);
      if (initialField.farmerName) setFarmerName(initialField.farmerName);
      if (initialField.soilType) setSoilType(initialField.soilType);
      if (initialField.notes !== undefined) setNotes(initialField.notes);
    }
  }, [initialField]);

  const handleCropSelect = (selectedCrop) => {
    setCrop(selectedCrop);
    if (onCropChange) {
      onCropChange(selectedCrop);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaveSuccessMessage('');

    if (boundaryPoints.length < 3) {
      setFormError(
        lang === 'hi'
          ? 'कृपया नक्शे पर कम से कम 3 सीमा बिंदु चिह्नित करें।'
          : 'Please mark at least 3 boundary points on the map to create a valid field.'
      );
      return;
    }

    if (!fieldName.trim()) {
      setFormError(
        lang === 'hi'
          ? 'कृपया खेत का नाम दर्ज करें।'
          : 'Please enter a name for this field.'
      );
      return;
    }

    try {
      await onSave({
        id: initialField?.id,
        fieldName: fieldName.trim(),
        crop,
        season,
        farmerName,
        soilType,
        notes: notes.trim(),
        points: boundaryPoints
      });

      setSaveSuccessMessage(
        lang === 'hi'
          ? 'खेत की सीमा सफलतापूर्वक सहेज ली गई है!'
          : 'Field boundary saved successfully.'
      );

      setTimeout(() => {
        setSaveSuccessMessage('');
      }, 4000);
    } catch (err) {
      setFormError(err.message || 'Failed to save field.');
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
      {/* Form Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            🌾
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-sm sm:text-base">
              {lang === 'hi' ? 'खेत का विवरण एवं फसल प्रोफाइल' : 'Field Information & Profile'}
            </h3>
            <p className="text-[11px] text-slate-500">
              {lang === 'hi' ? 'सीमा और फसल को डिजिटल आईडी से जोड़ें' : 'Link boundary with crop and spatial metadata'}
            </p>
          </div>
        </div>

        {/* Live Area Pill */}
        <div className="text-right">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
            Calculated Area
          </span>
          <span className="font-black text-emerald-800 text-xs sm:text-sm">
            {areaAcres > 0 ? `${areaAcres.toFixed(2)} acres` : '0.00 acres'}
          </span>
        </div>
      </div>

      {/* Success Notification */}
      {saveSuccessMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* Error Message */}
      {formError && (
        <div className="p-3.5 bg-rose-50 border border-rose-300 text-rose-950 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Field Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === 'hi' ? 'खेत का नाम (Field Name) *' : 'Field Name *'}</span>
            </label>
            <input
              type="text"
              id="input-field-name"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              placeholder="e.g. North Plot - Main Farm"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 text-xs font-semibold text-slate-900"
              required
            />
          </div>

          {/* Crop Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Sprout className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === 'hi' ? 'फसल का चयन (Crop) *' : 'Select Crop *'}</span>
            </label>
            <select
              id="select-crop"
              value={crop}
              onChange={(e) => handleCropSelect(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 text-xs font-bold text-slate-900 cursor-pointer"
            >
              {CROP_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Season Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === 'hi' ? 'ऋतु (Season)' : 'Growing Season'}</span>
            </label>
            <select
              id="select-season"
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 text-xs font-semibold text-slate-900 cursor-pointer"
            >
              {SEASON_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Soil Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span>🌱</span>
              <span>{lang === 'hi' ? 'मिट्टी का प्रकार (Soil Type)' : 'Soil Type'}</span>
            </label>
            <select
              id="select-soil-type"
              value={soilType}
              onChange={(e) => setSoilType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 text-xs font-semibold text-slate-900 cursor-pointer"
            >
              {SOIL_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Farmer Identifier */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-emerald-600" />
            <span>{lang === 'hi' ? 'किसान / खेत धारक (Farmer / Owner)' : 'Farmer / Plot Owner'}</span>
          </label>
          <input
            type="text"
            id="input-farmer-name"
            value={farmerName}
            onChange={(e) => setFarmerName(e.target.value)}
            placeholder="Farmer Name"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 text-xs font-semibold text-slate-900"
          />
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            <span>{lang === 'hi' ? 'टिप्पणी / विवरण (Notes)' : 'Field Notes & Observations'}</span>
          </label>
          <textarea
            id="input-field-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="e.g. Drip line layout, soil moisture level, seed variety notes..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 text-xs font-medium text-slate-900 resize-none"
          />
        </div>

        {/* Save Field Button */}
        <div className="pt-2">
          <button
            type="submit"
            id="btn-save-field"
            disabled={isSaving}
            className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2 text-white transition active:scale-98 shadow-md ${
              isSaving
                ? 'bg-emerald-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-600 to-agri-700 hover:from-emerald-700 hover:to-agri-800'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Field...' : (lang === 'hi' ? 'खेत सहेजें (Save Field)' : 'Save Field')}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
