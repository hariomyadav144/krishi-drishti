import React, { useState } from 'react';
import { Mic, MicOff, Check, X } from 'lucide-react';
import { useSwar } from '../context/SwarContext';
import { useLanguage } from '../context/LanguageContext';

/**
 * Reusable Voice Form Input Component
 * Enables "Speak instead of type" across any form field (Crop, Quantity, Area, Date).
 */
export default function VoiceFormField({
  label,
  value,
  onChange,
  fieldType = 'text',
  placeholder = '',
  required = false,
  className = '',
  unit = ''
}) {
  const { isListening, transcript, startListening, stopListening, extractFormFieldValue } = useSwar();
  const { lang, t } = useLanguage();
  const [activeVoiceField, setActiveVoiceField] = useState(false);
  const [pendingValue, setPendingValue] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const handleMicClick = () => {
    if (activeVoiceField && isListening) {
      stopListening();
      setActiveVoiceField(false);
      const extracted = extractFormFieldValue(transcript, fieldType);
      if (extracted) {
        setPendingValue(extracted);
        setShowConfirm(true);
      }
    } else {
      setActiveVoiceField(true);
      startListening();
    }
  };

  const handleConfirm = () => {
    onChange({ target: { value: pendingValue } });
    setShowConfirm(false);
    setPendingValue('');
    setActiveVoiceField(false);
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setPendingValue('');
    setActiveVoiceField(false);
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
          <span>{label} {required && <span className="text-red-500">*</span>}</span>
          <span className="text-[10px] text-emerald-700 font-semibold lowercase flex items-center gap-1">
            <Mic className="w-2.5 h-2.5" />
            <span>{t('swar.speakToFill') || 'बोलकर भरें'}</span>
          </span>
        </label>
      )}

      <div className="relative flex items-center">
        <input
          type={fieldType === 'quantity' ? 'number' : fieldType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full p-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
        />

        {unit && (
          <span className="absolute right-10 text-xs text-slate-400 font-bold pointer-events-none">
            {unit}
          </span>
        )}

        <button
          type="button"
          onClick={handleMicClick}
          className={`absolute right-1.5 p-1.5 rounded-lg transition ${
            activeVoiceField && isListening
              ? 'bg-red-500 text-white animate-pulse ring-2 ring-red-200'
              : 'text-slate-400 hover:text-emerald-700 hover:bg-emerald-50'
          }`}
          title="Speak to fill this field (बोलकर भरें)"
        >
          {activeVoiceField && isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Voice Confirmation Dialog */}
      {showConfirm && (
        <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-emerald-800 font-bold">
              {t('swar.confirmTitle') || 'दर्ज करें:'}
            </span>
            <span className="font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded border border-emerald-200">
              {pendingValue} {unit}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleConfirm}
              className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
              title="Confirm"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="p-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300"
              title="Cancel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
