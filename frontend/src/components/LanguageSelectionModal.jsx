import React from 'react';
import { useLanguage, availableLanguages } from '../context/LanguageContext';
import { Globe, Check, Volume2, X } from 'lucide-react';

export default function LanguageSelectionModal({ isOpen, onClose }) {
  const { lang, setLanguage, t } = useLanguage();

  if (!isOpen) return null;

  const handleSelect = (code) => {
    setLanguage(code);
    localStorage.setItem('krishi_lang_selected_once', 'true');
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-emerald-100 space-y-5 animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                अपनी भाषा चुनें / Select Your Language
              </h3>
              <p className="text-[11px] text-slate-500 font-semibold">
                Krishi Drishti will operate completely in your chosen language
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 12 Indian Languages Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {availableLanguages.map((l) => {
            const isSelected = lang === l.code;
            return (
              <button
                key={l.code}
                onClick={() => handleSelect(l.code)}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between gap-2 active:scale-95 ${
                  isSelected
                    ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-300 shadow-xs'
                    : 'bg-slate-50 hover:bg-emerald-50/50 border-slate-200 hover:border-emerald-300 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">{l.icon}</span>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-sm font-black text-slate-900 block">
                    {l.native}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    {l.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-[11px] text-emerald-800 font-semibold">
            🌱 स्वर (SWAR) आपके साथ आपकी चुनी हुई भाषा में बात करेगा।
          </p>
        </div>

      </div>
    </div>
  );
}
