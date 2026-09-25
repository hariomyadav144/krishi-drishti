import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import api, { isNativeApp } from '../services/api';
import { Sparkles, ArrowRight, Download, CheckCircle2, AlertCircle, X } from 'lucide-react';

// Current App Version installed on this device
export const CURRENT_APP_VERSION = '1.0.1';
export const CURRENT_APP_VERSION_CODE = 2;

export default function InAppUpdateModal() {
  const { lang, t } = useLanguage();
  const [updateData, setUpdateData] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check for updates on startup (graceful check after 2.5s to not block initial render)
    const checkTimer = setTimeout(async () => {
      try {
        const dismissedCode = localStorage.getItem('krishi_dismissed_update_code');
        
        const res = await api.get(`/app/version-check?version=${CURRENT_APP_VERSION}&versionCode=${CURRENT_APP_VERSION_CODE}`);
        if (res.data && res.data.hasUpdate) {
          // If not mandatory, check if user dismissed this exact version today
          if (!res.data.isMandatory && dismissedCode === String(res.data.latestVersionCode)) {
            return;
          }
          setUpdateData(res.data);
          setIsOpen(true);
        }
      } catch (err) {
        // Silent fail on version check - never interrupt farmer's workflow
        console.debug('[InAppUpdate] Check completed silently.');
      }
    }, 2500);

    return () => clearTimeout(checkTimer);
  }, []);

  if (!isOpen || !updateData) return null;

  const handleDismiss = () => {
    if (updateData.isMandatory) return; // Cannot dismiss mandatory update
    try {
      localStorage.setItem('krishi_dismissed_update_code', String(updateData.latestVersionCode));
    } catch (_) {}
    setIsOpen(false);
  };

  const handleUpdateClick = () => {
    const playStoreUrl = updateData.updateUrl || 'https://play.google.com/store/apps/details?id=com.fasaldristi.app';
    if (typeof window !== 'undefined') {
      window.open(playStoreUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const isHindi = lang === 'hi';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div 
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-emerald-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#12381F] to-emerald-800 text-white p-5 relative">
          {!updateData.isMandatory && (
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 transition"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-300 flex items-center justify-center text-emerald-950 shadow-md">
              <Download className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-400/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider mb-0.5">
                <Sparkles className="w-3 h-3" />
                <span>{updateData.isMandatory ? 'Mandatory Update' : 'New Update Available'}</span>
              </div>
              <h3 className="font-extrabold text-base tracking-tight text-white leading-tight">
                {isHindi ? (updateData.titleHi || 'फ़सल दृष्टि का नया अपडेट उपलब्ध है 🌱') : (updateData.title || 'New Fasal Drishti Version')}
              </h3>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          
          {/* Version Comparison Badge */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-bold uppercase">{isHindi ? 'वर्तमान वर्शन' : 'Current'}</span>
              <span className="font-bold text-slate-700">v{CURRENT_APP_VERSION} ({CURRENT_APP_VERSION_CODE})</span>
            </div>
            <ArrowRight className="w-4 h-4 text-emerald-600" />
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-emerald-700 font-bold uppercase">{isHindi ? 'नया वर्शन' : 'Latest'}</span>
              <span className="font-black text-emerald-800">v{updateData.latestVersion} ({updateData.latestVersionCode})</span>
            </div>
          </div>

          {/* What's New Release Notes */}
          <div>
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <span>🚀</span>
              <span>{isHindi ? 'नए अपडेट में क्या नया है:' : "What's New in this Update:"}</span>
            </h4>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 whitespace-pre-line leading-relaxed font-medium">
              {isHindi ? updateData.releaseNotesHi : updateData.releaseNotes}
            </div>
          </div>

          {/* Safety Notice */}
          <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-amber-50/80 border border-amber-200/60 p-2.5 rounded-xl">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              {isHindi 
                ? 'अपडेट करने पर आपका खाता, खेत का नक्शा और पुराना डेटा 100% सुरक्षित रहेगा।' 
                : 'Your farmer profile, farm GPS boundaries, and history remain 100% safe during update.'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            {!updateData.isMandatory && (
              <button
                type="button"
                onClick={handleDismiss}
                className="flex-1 py-3 px-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition text-center"
              >
                {isHindi ? 'बाद में (Later)' : 'Remind Later'}
              </button>
            )}

            <button
              type="button"
              id="btn-update-playstore"
              onClick={handleUpdateClick}
              className="flex-1 py-3 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-agri-600 hover:from-emerald-500 hover:to-agri-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-1.5 transition active:scale-95 text-center"
            >
              <span>🛒</span>
              <span>{isHindi ? 'प्ले स्टोर पर अपडेट करें' : 'Update on Play Store'}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
