import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import VoiceReader from '../components/VoiceReader';
import FeedbackModal from '../components/FeedbackModal';
import { 
  Sparkles, 
  Send, 
  HelpCircle, 
  AlertCircle, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  RefreshCw,
  Droplets,
  Sprout,
  TrendingUp,
  AlertTriangle,
  Mic,
  MicOff,
  Volume2
} from 'lucide-react';

export default function AiAdvisor({ setActiveTab }) {
  const { lang, t } = useLanguage();
  const { currentCrop, farm } = useAuth();

  const [queryText, setQueryText] = useState('');
  const [selectedCrop, setSelectedCrop] = useState(currentCrop?.cropName || 'Tomato');
  const [loading, setLoading] = useState(false);
  const [predefinedQueries, setPredefinedQueries] = useState([]);
  const [advisoryResult, setAdvisoryResult] = useState(null);
  const [error, setError] = useState('');

  // Speech-to-Text states
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const fetchPredefined = async () => {
      try {
        const res = await api.get('/recommendations/predefined-queries');
        if (res.data?.success) {
          const list = Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data.queries) ? res.data.queries : []);
          setPredefinedQueries(list);
        }
      } catch (e) {
        console.warn('Failed to load predefined queries:', e.message);
      }
    };
    fetchPredefined();
  }, []);

  // Initialize Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setQueryText(transcript);
          setIsListening(false);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [lang]);

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported in this browser. Please type your question.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
        recognitionRef.current.start();
      } catch (e) {
        console.warn('Mic start error:', e);
      }
    }
  };

  const handleAsk = async (textToQuery) => {
    const query = textToQuery || queryText;
    if (!query || query.trim() === '') return;

    setLoading(true);
    setError('');
    setAdvisoryResult(null);

    try {
      const res = await api.post('/recommendations/ask', {
        queryText: query,
        cropName: selectedCrop,
        cropStage: currentCrop?.cropStage || 'Flowering Stage',
      });

      if (res.data.success) {
        setAdvisoryResult(res.data.data);
        setQueryText('');
      }
    } catch (err) {
      console.error('Advisor query error:', err);
      setError(err.response?.data?.message || 'Error generating AI recommendation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 pb-24 md:pb-10">
      
      {/* Header */}
      <div className="text-center max-w-lg mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-white flex items-center justify-center mx-auto mb-2 shadow-md">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">{t('advisor.title')}</h2>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
          {t('advisor.subtitle')}
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Query Input Box */}
      <div className="agri-card p-5 bg-white border-slate-200 shadow-sm space-y-4">
        
        {/* Context bar */}
        <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Crop:</span>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="font-bold text-slate-800 bg-transparent border-b border-slate-300 focus:outline-none text-xs"
            >
              <option value="Tomato">Tomato (टमाटर)</option>
              <option value="Rice / Paddy">Rice / Paddy (धान)</option>
              <option value="Wheat">Wheat (गेहूं)</option>
              <option value="Cotton">Cotton (कपास)</option>
              <option value="Potato">Potato (आलू)</option>
              <option value="Onion">Onion (प्याज)</option>
              <option value="Chilli / Pepper">Chilli / Pepper (मिर्च)</option>
            </select>
          </div>

          <span className="text-[11px] text-agri-700 bg-agri-50 px-2 py-0.5 rounded font-semibold">
            🌱 {currentCrop?.cropStage || 'Flowering Stage'} • {farm?.soilType || 'Black Soil'}
          </span>
        </div>

        {/* Textarea Form + Speech Mic Button */}
        <form onSubmit={(e) => { e.preventDefault(); handleAsk(); }} className="space-y-3">
          <div className="relative">
            <textarea
              rows={3}
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder={t('advisor.askPlaceholder')}
              className="w-full p-3.5 pr-14 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            ></textarea>

            {/* Mic Button on top-right of textarea */}
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              className={`absolute right-3 top-3 p-2.5 rounded-xl transition shadow-xs flex items-center justify-center ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-200'
                  : 'bg-amber-100 hover:bg-amber-200 text-amber-900'
              }`}
              title={t('advisor.btnVoice')}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>

          {/* Listening Live Indicator */}
          {isListening && (
            <div className="flex items-center gap-2 text-xs text-red-600 font-bold bg-red-50 p-2.5 rounded-xl border border-red-200 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
              <span>{t('advisor.listening')}</span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              className={`py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition border ${
                isListening
                  ? 'bg-red-50 text-red-700 border-red-300'
                  : 'bg-slate-100 hover:bg-amber-50 text-slate-700 border-slate-200'
              }`}
            >
              <Mic className="w-4 h-4 text-amber-600" />
              <span>{isListening ? 'Stop Mic' : t('advisor.btnVoice')}</span>
            </button>

            <button
              type="submit"
              disabled={loading || !queryText.trim()}
              className="flex-1 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 text-white font-bold py-3 px-5 rounded-xl shadow-md flex items-center justify-center gap-2 text-sm transition active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{t('advisor.thinking')}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{t('advisor.btnAsk')}</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Popular Predefined Inquiries */}
        <div className="pt-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            💡 {t('advisor.popularQuestions')}:
          </span>
          <div className="flex flex-wrap gap-2">
            {(predefinedQueries || []).map((q, idx) => {
              const text = (lang === 'hi' && (q.titleHi || q.queryHi || q.qHi))
                ? (q.titleHi || q.queryHi || q.qHi)
                : (q.title || q.query || q.q || 'Crop question');
              return (
                <button
                  key={q.id || idx}
                  type="button"
                  onClick={() => handleAsk(text)}
                  className="text-xs bg-slate-50 hover:bg-amber-50 hover:border-amber-300 text-slate-700 hover:text-amber-900 border border-slate-200 px-3 py-2 rounded-xl text-left transition font-medium active:scale-95 flex items-center gap-1.5"
                >
                  <span>💬</span>
                  <span>{text}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Structured 5-Part AI Advice Result */}
      {advisoryResult && (
        <div className="agri-card p-5 bg-white border-amber-300 shadow-xl space-y-4 animate-in fade-in slide-in-from-bottom-3">
          
          {/* Header */}
          <div className="flex items-start justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                {advisoryResult.category || 'Agronomy Advisory'} • {advisoryResult.cropName}
              </span>
              <h3 className="text-base font-extrabold text-slate-900 mt-1">
                "{advisoryResult.queryText}"
              </h3>
            </div>

            <VoiceReader
              textToRead={`${advisoryResult.issue}. ${advisoryResult.whatToDo}. When: ${advisoryResult.whenToDo}. Avoid: ${advisoryResult.whatToAvoid}`}
              textToReadHi={`${advisoryResult.issueHi || advisoryResult.issue}। ${advisoryResult.whatToDoHi || advisoryResult.whatToDo}। समय: ${advisoryResult.whenToDoHi || advisoryResult.whenToDo}। क्या न करें: ${advisoryResult.whatToAvoidHi || advisoryResult.whatToAvoid}`}
            />
          </div>

          {/* 5-Part Card Structure */}
          <div className="space-y-3">
            
            {/* 1. What is the issue? */}
            <div className="p-3 bg-red-50/70 rounded-xl border border-red-200">
              <span className="text-xs font-bold text-red-900 flex items-center gap-1.5 mb-1">
                <AlertCircle className="w-4 h-4 text-red-600" />
                {t('advisor.fivePart.issue')}
              </span>
              <p className="text-xs text-red-950 font-medium leading-relaxed">
                {lang === 'hi' && advisoryResult.issueHi ? advisoryResult.issueHi : advisoryResult.issue}
              </p>
            </div>

            {/* 2. Why is it happening? */}
            <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5 mb-1">
                <HelpCircle className="w-4 h-4 text-amber-600" />
                {t('advisor.fivePart.reason')}
              </span>
              <p className="text-xs text-amber-950 leading-relaxed">
                {lang === 'hi' && advisoryResult.reasonHi ? advisoryResult.reasonHi : advisoryResult.reason}
              </p>
            </div>

            {/* 3. What should the farmer do? */}
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-300">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {t('advisor.fivePart.whatToDo')}
              </span>
              <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                {lang === 'hi' && advisoryResult.whatToDoHi ? advisoryResult.whatToDoHi : advisoryResult.whatToDo}
              </p>
            </div>

            {/* 4. When should the action be taken? */}
            <div className="p-3 bg-sky-50 rounded-xl border border-sky-200">
              <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5 mb-1">
                <Calendar className="w-4 h-4 text-sky-600" />
                {t('advisor.fivePart.whenToDo')}
              </span>
              <p className="text-xs text-sky-950 leading-relaxed">
                {lang === 'hi' && advisoryResult.whenToDoHi ? advisoryResult.whenToDoHi : advisoryResult.whenToDo}
              </p>
            </div>

            {/* 5. What should the farmer avoid? */}
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
              <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5 mb-1">
                <XCircle className="w-4 h-4 text-rose-600" />
                {t('advisor.fivePart.whatToAvoid')}
              </span>
              <p className="text-xs text-rose-950 leading-relaxed">
                {lang === 'hi' && advisoryResult.whatToAvoidHi ? advisoryResult.whatToAvoidHi : advisoryResult.whatToAvoid}
              </p>
            </div>

          </div>

          {/* Action Plan Task CTA */}
          <div className="p-3 bg-agri-100 text-agri-950 rounded-xl flex items-center justify-between gap-2 text-xs">
            <span className="font-semibold">
              ✓ Action plan generated for your daily farming schedule!
            </span>
            <button
              onClick={() => setActiveTab('plans')}
              className="font-bold text-agri-900 underline hover:text-agri-950 flex items-center gap-1 shrink-0"
            >
              <span>{t('dashboard.viewAllTasks')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Continuous Feedback Loop */}
          <FeedbackModal
            recommendationId={advisoryResult._id}
            cropName={advisoryResult.cropName}
          />

        </div>
      )}

    </div>
  );
}
