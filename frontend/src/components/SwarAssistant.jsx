import React, { useState } from 'react';
import { useSwar } from '../context/SwarContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  X, 
  Send, 
  RefreshCw, 
  HelpCircle,
  ArrowRight,
  Bot,
  Settings
} from 'lucide-react';

export default function SwarAssistant({ isPhoneFrame = false }) {
  const { 
    isOpen, 
    setIsOpen, 
    isListening, 
    isSpeaking, 
    transcript, 
    loading, 
    errorMessage, 
    permissionDenied,
    messages, 
    startListening, 
    stopListening, 
    speakText, 
    stopSpeaking, 
    askSwar,
    openAppSettings
  } = useSwar();

  const { lang, t } = useLanguage();
  const [inputText, setInputText] = useState('');

  const handleSend = (e) => {
    if (e) e.preventDefault();
    const query = inputText.trim() || transcript.trim();
    if (!query) return;
    askSwar(query);
    setInputText('');
  };

  return (
    <>
      {/* Floating Circular SWAR Trigger Button (Visible on every screen) */}
      <div className={isPhoneFrame 
        ? "absolute bottom-20 right-4 z-40 flex flex-col items-end gap-2" 
        : "fixed bottom-20 sm:bottom-8 right-4 sm:right-6 z-40 flex flex-col items-end gap-2"}>
        <button
          id="btn-swar-floating"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform active:scale-95 ${
            isOpen
              ? 'bg-slate-900 text-white rotate-90 ring-4 ring-emerald-300'
              : 'bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 text-white hover:scale-105 shadow-emerald-900/30'
          }`}
          title={t('swar.talkToSwar') || 'Talk to SWAR (स्वर)'}
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <div className="relative flex items-center justify-center">
              <Mic className="w-6 h-6 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full ring-2 ring-white"></span>
            </div>
          )}
        </button>
      </div>

      {/* SWAR Conversational Voice Dialog */}
      {isOpen && (
        <div className={isPhoneFrame 
          ? "absolute inset-0 z-50 flex flex-col bg-white rounded-3xl shadow-2xl border border-emerald-200 overflow-hidden animate-in fade-in" 
          : "fixed inset-0 sm:inset-auto sm:bottom-28 sm:right-6 sm:w-96 sm:max-w-md z-50 flex flex-col bg-white sm:rounded-3xl shadow-2xl border border-emerald-200 overflow-hidden animate-in fade-in slide-in-from-bottom-5"}>
          
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-[#12381F] to-emerald-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/30 border border-emerald-400/40 flex items-center justify-center text-white">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-sm tracking-wide">
                    {t('swar.name') || 'स्वर (SWAR)'}
                  </span>
                  <span className="text-[9px] bg-emerald-400/30 text-emerald-200 px-1.5 py-0.2 rounded font-extrabold uppercase">
                    VOICE AI
                  </span>
                </div>
                <p className="text-[10px] text-emerald-200/80 font-medium">
                  {t('swar.tagline') || 'Fasal Drishti Voice & Farm Assistant'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="p-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white transition text-xs flex items-center gap-1"
                  title={t('swar.stop') || 'Stop Voice'}
                >
                  <VolumeX className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Context Question Chips */}
          <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex gap-1.5 overflow-x-auto text-[11px] scrollbar-none">
            <button
              onClick={() => askSwar(t('swar.qCropHealth'))}
              className="whitespace-nowrap px-2.5 py-1 bg-white border border-slate-200 hover:border-emerald-400 rounded-full font-bold text-slate-700 hover:text-emerald-900 transition shadow-2xs"
            >
              🌾 {t('swar.qCropHealth') || 'मेरी फसल आज कैसी है?'}
            </button>
            <button
              onClick={() => askSwar(t('swar.qFertilizer'))}
              className="whitespace-nowrap px-2.5 py-1 bg-white border border-slate-200 hover:border-emerald-400 rounded-full font-bold text-slate-700 hover:text-emerald-900 transition shadow-2xs"
            >
              🧪 {t('swar.qFertilizer') || 'खाद कितनी डालूं?'}
            </button>
            <button
              onClick={() => askSwar(t('swar.qRain'))}
              className="whitespace-nowrap px-2.5 py-1 bg-white border border-slate-200 hover:border-emerald-400 rounded-full font-bold text-slate-700 hover:text-emerald-900 transition shadow-2xs"
            >
              🌧️ {t('swar.qRain') || 'क्या बारिश होगी?'}
            </button>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 space-y-3 max-h-80 sm:max-h-96 overflow-y-auto bg-slate-50/50 text-xs">
            {messages.length === 0 ? (
              <div className="text-center py-6 space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                  <Mic className="w-6 h-6" />
                </div>
                <h4 className="font-extrabold text-slate-900 text-sm">
                  {t('swar.talkToSwar') || 'स्वर से बात करें'}
                </h4>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  {t('swar.voicePrompt') || 'Tap the microphone below to ask any farming question in your chosen language.'}
                </p>
              </div>
            ) : (
              messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div
                    className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-emerald-700 text-white rounded-tr-xs font-semibold'
                        : 'bg-white text-slate-900 border border-emerald-200/80 rounded-tl-xs shadow-xs whitespace-pre-line'
                    }`}
                  >
                    {m.content}
                  </div>

                  {m.role === 'assistant' && (
                    <button
                      onClick={() => speakText(m.content)}
                      className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 px-1.5 py-0.5 rounded"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>{t('swar.readAloud') || 'सुनें'}</span>
                    </button>
                  )}
                </div>
              ))
            )}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-emerald-800 font-bold bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{t('swar.thinking') || 'स्वर विचार कर रहा है...'}</span>
              </div>
            )}

            {isListening && (
              <div className="flex items-center gap-2 text-xs text-red-600 font-bold bg-red-50 p-2.5 rounded-xl border border-red-200 animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
                <span>{transcript || (t('swar.listening') || 'सुन रहा हूँ... बोलिए')}</span>
              </div>
            )}

            {errorMessage && (
              <div className="space-y-2">
                <div className="text-[11px] text-red-700 bg-red-50 p-2.5 rounded-xl border border-red-200 font-medium leading-relaxed">
                  {errorMessage}
                </div>
                {permissionDenied && (
                  <button
                    type="button"
                    onClick={openAppSettings}
                    className="w-full py-2 px-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>{t('swar.openSettings') || 'Open App Settings (Allow Mic)'}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Voice & Input Controls */}
          <div className="p-3 bg-white border-t border-slate-200 space-y-2">
            <form onSubmit={handleSend} className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`p-3 rounded-2xl transition shadow-xs flex items-center justify-center ${
                  isListening
                    ? 'bg-red-600 text-white animate-pulse ring-4 ring-red-200'
                    : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900'
                }`}
                title={t('swar.speakToFill') || 'Speak'}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t('advisor.askPlaceholder') || 'Ask SWAR...'}
                className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />

              <button
                type="submit"
                disabled={loading || (!inputText.trim() && !transcript.trim())}
                className="p-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white rounded-xl shadow-xs transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      )}
    </>
  );
}
