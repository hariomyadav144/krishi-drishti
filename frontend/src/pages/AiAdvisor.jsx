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
  Volume2, 
  Camera, 
  Image as ImageIcon, 
  X, 
  Check,
  ShieldAlert,
  Info
} from 'lucide-react';

// Clean user query to ensure no system instructions/prompts can ever appear in UI
export function cleanUserQuery(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/IMPORTANT:[\s\S]*?(?:Farmer Question:|सवाल:|प्रश्न:)/gi, '')
    .replace(/\[?(?:अनिवार्य निर्देश|कृषि संदर्भ|Agricultural Context|Farmer Question):[^\n]*\]?\n*/gim, '')
    .replace(/^Farmer Question:\s*/gi, '')
    .replace(/^(?:सवाल|प्रश्न):\s*/gi, '')
    .trim();
}

// Clean visible advice for the farmer:
// - Removes any echoed developer prompts/instructions
// - Strips markdown symbols (###, **, _, `, backslashes)
// - Cleans LaTeX math and temperature notation
// - Removes citation numbers like [1], [6075]
export function cleanVisibleAdvice(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';
  let text = rawText;

  // 1. Strip system prompt or prompt headers
  text = text.replace(/IMPORTANT:[\s\S]*?(?=(\n\n|किसान|नमस्ते|१|1\.|रोग|समस्या|फसल|उपाय|$))/gi, '');
  text = text.replace(/\[?(?:अनिवार्य निर्देश|कृषि संदर्भ|Agricultural Context|Farmer Question|User Question):[^\n]*\]?\n*/gim, '');
  text = text.replace(/Farmer('s)?\s*(Note|Question):[^\n]*/gim, '');

  // 2. Strip JSON/code blocks and URLs
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/`([^`]+)`/g, '$1');
  text = text.replace(/\{[^{}]*\}/g, '');
  text = text.replace(/https?:\/\/\S+/gi, '');

  // 3. Strip citations like [6075], [1], [source: ...]
  text = text.replace(/\[\s*\d+\s*\]/g, '');
  text = text.replace(/\[source:[^\]]*\]/gi, '');

  // 4. Clean LaTeX math and temperature notation
  text = text.replace(/\\*(?:text|mathrm)\{([^{}]+)\}/gi, '$1');
  text = text.replace(/\t+ext\{([^{}]+)\}/gi, '$1');
  text = text.replace(/\$?\s*([0-9.]+)\s*(?:\^\\*circ|\^circ|°)\s*C?\s*\$?(\s*(?:से|to|-)\s*)\$?\s*([0-9.]+)\s*(?:\^\\*circ|\^circ|°)\s*C?\s*\$?(\s*(?:°C|डिग्री|C)?)/gi, '$1°C $2 $3°C');
  text = text.replace(/\$?\s*([0-9.]+)\s*(?:\^\\*circ|\^circ|°)\s*C?\s*\$?/gi, '$1°C');
  text = text.replace(/\\*sim\s*/gi, 'लगभग ');
  text = text.replace(/\\*(?:text|mathrm)/gi, '');
  text = text.replace(/[\$\\^~]/g, '');

  // 5. Clean markdown headers (### -> clean)
  text = text.replace(/^#{1,6}\s*/gm, '');
  text = text.replace(/#{1,6}/g, '');

  // 6. Clean bold / italic asterisks (** -> clean)
  text = text.replace(/[*_`\\]/g, '');

  // 7. Clean list dashes/bullets at beginning of lines
  text = text.replace(/^[\s\-+•·]+\s*/gm, '• ');

  // 8. Remove HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // 9. Normalize whitespace
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n\s*\n+/g, '\n\n');

  return text.trim();
}

export default function AiAdvisor({ setActiveTab }) {
  const { lang, t } = useLanguage();
  const { currentCrop, farm } = useAuth();

  const [queryText, setQueryText] = useState('');
  const [loading, setLoading] = useState(false);
  const [predefinedQueries, setPredefinedQueries] = useState([]);
  const [advisoryResult, setAdvisoryResult] = useState(null);
  const [error, setError] = useState('');
  const [lastQuery, setLastQuery] = useState('');

  // Image attachment for Multimodal Gemini Vision
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef(null);
  const isSubmittingRef = useRef(false);

  // Clear advisory result when language changes so languages never mix
  useEffect(() => {
    setAdvisoryResult(null);
    setError('');
  }, [lang]);

  // Image file handler
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      setError('');
    }
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview('');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Speech-to-Text states
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const fetchPredefined = async () => {
      try {
        const res = await api.get('/ai/predefined-queries');
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
      recognition.lang = lang === 'hi' ? 'hi-IN' : (lang === 'mr' ? 'mr-IN' : (lang === 'pa' ? 'pa-IN' : 'en-IN'));

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setQueryText(prev => prev ? `${prev} ${transcript}` : transcript);
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
      alert(lang === 'hi' ? 'इस ब्राउज़र में स्पीच रिकग्निशन उपलब्ध नहीं है। कृपया टाइप करें।' : 'Speech Recognition is not supported in this browser. Please type your question.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = lang === 'hi' ? 'hi-IN' : (lang === 'mr' ? 'mr-IN' : (lang === 'pa' ? 'pa-IN' : 'en-IN'));
        recognitionRef.current.start();
      } catch (e) {
        console.warn('Mic start error:', e);
      }
    }
  };

  const [chatHistory, setChatHistory] = useState([]);

  const handleAsk = async (textToQuery) => {
    if (loading || isSubmittingRef.current) return;

    const query = (textToQuery !== undefined ? textToQuery : queryText).trim();
    if (!query && !imageFile) {
      setError(lang === 'hi' ? 'कृपया खेती से जुड़ा कोई सवाल पूछें या पौधे की फोटो जोड़ें।' : 'Please enter a farming question or attach a crop photo.');
      return;
    }

    isSubmittingRef.current = true;
    setLastQuery(query);
    setLoading(true);
    setError('');

    try {
      let res;
      if (imageFile) {
        // Multimodal Image Diagnosis with Vision Service - AI auto-detects crop from image
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('question', query || (lang === 'hi' ? 'कृपया इस पौधे की फोटो देखकर फसल, समस्या और उपचार बताएं।' : 'Identify the crop from this photo, detect any disease or issue, and provide treatment and care instructions.'));
        formData.append('crop', ''); // No manual crop: AI detects it directly
        formData.append('language', lang || 'en');

        res = await api.post('/ai/diagnose', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        // Conversational Agricultural Guidance
        const payload = {
          question: query,
          queryText: query,
          rawQuestion: query,
          crop: 'General',
          stage: currentCrop?.cropStage || '',
          soil: farm?.soilType ? { type: farm.soilType } : {},
          weather: farm?.weather || {},
          location: farm?.district ? { district: farm.district, state: farm.state } : {},
          language: lang || 'en',
          conversationHistory: chatHistory.slice(-6),
        };

        res = await api.post('/ai/advice', payload);
      }

      if (res.data && (res.data.success || res.data.answer)) {
        // Handle unidentifiable or unclear image
        if (res.data.isIdentifiable === false || res.data.data?.isIdentifiable === false) {
          const fallbackMsg = res.data.unclearMessage || res.data.data?.unclearMessage || res.data.answer || (
            lang === 'hi'
              ? 'मैं इस तस्वीर से फसल की सही पहचान नहीं कर पाया। कृपया पौधे या प्रभावित पत्ते की एक साफ तस्वीर अपलोड करें।'
              : "I couldn't confidently identify the crop from this image. Please upload a clear photo of the plant or affected leaf."
          );
          setAdvisoryResult({
            isIdentifiable: false,
            answer: fallbackMsg,
            queryText: query || (lang === 'hi' ? 'फोटो जांच' : 'Photo Inspection'),
            cropName: null
          });
          removeImage();
          return;
        }

        const rawAnswerText = res.data.answer || res.data.data?.answer || res.data.data?.whatToDo || '';
        const cleanedAnswer = cleanVisibleAdvice(rawAnswerText);
        const userQuery = cleanUserQuery(res.data.queryText || res.data.data?.queryText || query || (lang === 'hi' ? 'फसल सलाह' : 'Crop Advisory'));

        // Extracted crop name from AI response
        const detectedCrop = res.data.crop || res.data.cropName || res.data.data?.cropName || (imageFile ? (lang === 'hi' ? 'पहचानी गई फसल' : 'Identified Crop') : 'Krishi Drishti AI');

        const updatedResult = {
          ...(res.data.data || {}),
          answer: cleanedAnswer,
          queryText: userQuery,
          cropName: detectedCrop,
          diagnosis: res.data.diagnosis || res.data.data?.diagnosis,
          isIdentifiable: true,
          wasImageQuery: !!imageFile
        };

        setAdvisoryResult(updatedResult);
        setChatHistory(prev => [
          ...prev,
          { role: 'user', content: query || (lang === 'hi' ? 'पौधे की फोटो जांच' : 'Crop Photo Inspection') },
          { role: 'model', content: cleanedAnswer }
        ]);
        setQueryText('');
        removeImage();
      }
    } catch (err) {
      console.warn('Advisor query notice:', err.message || err);
      const friendlyMsg = lang === 'en'
        ? 'AI advice is temporarily busy. Please try again shortly.'
        : 'अभी सलाह सेवा थोड़ी व्यस्त है। कृपया कुछ देर बाद फिर कोशिश करें।';
      setError(friendlyMsg);
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 pb-24 md:pb-10">
      
      {/* Header */}
      <div className="text-center max-w-lg mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto mb-2 shadow-md">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">{t('advisor.title')}</h2>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
          {t('advisor.subtitle')}
        </p>
      </div>

      {/* Diagnostic Error Banner with Retry */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl space-y-2 text-xs animate-in fade-in">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 text-red-900 font-bold text-sm">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{lang === 'hi' ? 'सलाह सूचना' : 'Advisory Notice'}</span>
            </div>
            <button
              type="button"
              onClick={() => setError('')}
              className="text-slate-400 hover:text-slate-600 text-sm font-bold"
            >
              ✕
            </button>
          </div>

          <p className="text-red-800 leading-relaxed font-medium">
            {error}
          </p>

          <div className="pt-2 border-t border-red-100 flex items-center justify-end">
            <button
              type="button"
              onClick={() => handleAsk(lastQuery)}
              disabled={loading}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{lang === 'hi' ? 'पुनः प्रयास करें' : 'Retry Question'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Query Input Box */}
      <div className="agri-card p-5 bg-white border-slate-200 shadow-sm space-y-4">
        
        {/* Automatic Crop Detection Indicator Bar (No manual selector) */}
        <div className="flex items-center justify-between text-xs bg-emerald-50/80 p-3 rounded-xl border border-emerald-100 flex-wrap gap-2">
          <div className="flex items-center gap-2 text-emerald-900">
            <Sprout className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold text-xs">
              {lang === 'hi'
                ? '🌱 AI फोटो से फसल की पहचान खुद करता है (मैन्युअल चयन की जरूरत नहीं)'
                : '🌱 AI automatically identifies crop species directly from your photo'}
            </span>
          </div>

          <span className="text-[11px] text-emerald-800 bg-white/80 px-2.5 py-1 rounded-lg font-semibold border border-emerald-200/60 shadow-xs">
            {farm?.soilType ? `🌾 ${farm.soilType}` : '🌿 Smart Vision AI'}
          </span>
        </div>

        {/* Textarea Form + Speech Mic Button + Photo Attachment */}
        <form onSubmit={(e) => { e.preventDefault(); handleAsk(); }} className="space-y-3">
          <div className="relative">
            <textarea
              rows={3}
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder={lang === 'hi' 
                ? 'पौधे की फोटो अपलोड करें या बीमारी, खाद, सिंचाई के बारे में पूछें...' 
                : 'Upload a crop photo or ask about disease symptoms, fertilizers, irrigation, pests...'}
              className="w-full p-3.5 pr-20 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            ></textarea>

            {/* Hidden Photo Input */}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageSelect}
              className="hidden"
            />

            {/* Action buttons inside textarea */}
            <div className="absolute right-3 top-3 flex items-center gap-1.5">
              {/* Photo Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`p-2 rounded-xl transition shadow-xs flex items-center justify-center ${
                  imageFile
                    ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                }`}
                title={lang === 'hi' ? 'पौधे की फोटो अपलोड करें' : 'Attach crop photo'}
              >
                <Camera className="w-4 h-4" />
              </button>

              {/* Mic Button */}
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`p-2 rounded-xl transition shadow-xs flex items-center justify-center ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-200'
                    : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900'
                }`}
                title={t('advisor.btnVoice')}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Image Attachment Preview */}
          {imagePreview && (
            <div className="flex items-center gap-3 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 animate-in fade-in">
              <img
                src={imagePreview}
                alt="Selected crop"
                className="w-14 h-14 object-cover rounded-lg border border-emerald-300 shadow-xs"
              />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-emerald-950 block truncate">
                  📷 {imageFile?.name || (lang === 'hi' ? 'पौधे की फोटो' : 'Crop Photo Attached')}
                </span>
                <span className="text-[11px] text-emerald-700 block">
                  {lang === 'hi' 
                    ? '✓ AI फसल की पहचान और रोग निदान करेगा' 
                    : '✓ AI will auto-detect the crop and diagnose visible diseases'}
                </span>
              </div>
              <button
                type="button"
                onClick={removeImage}
                className="p-1.5 rounded-full text-slate-500 hover:text-red-600 hover:bg-white transition"
                title={lang === 'hi' ? 'फोटो हटाएं' : 'Remove photo'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

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
              onClick={() => fileInputRef.current?.click()}
              className="py-3 px-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition border bg-slate-100 hover:bg-emerald-50 text-slate-700 border-slate-200"
            >
              <Camera className="w-4 h-4 text-emerald-600" />
              <span>{imageFile ? (lang === 'hi' ? 'फोटो चुनी गई' : 'Photo Attached') : (lang === 'hi' ? 'फोटो जोड़ें' : 'Upload Photo')}</span>
            </button>

            <button
              type="button"
              onClick={toggleSpeechRecognition}
              className={`py-3 px-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition border ${
                isListening
                  ? 'bg-red-50 text-red-700 border-red-300'
                  : 'bg-slate-100 hover:bg-amber-50 text-slate-700 border-slate-200'
              }`}
            >
              <Mic className="w-4 h-4 text-amber-600" />
              <span>{isListening ? (lang === 'hi' ? 'रोकें' : 'Stop') : t('advisor.btnVoice')}</span>
            </button>

            <button
              type="submit"
              disabled={loading || (!queryText.trim() && !imageFile)}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3 px-5 rounded-xl shadow-md flex items-center justify-center gap-2 text-sm transition active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{lang === 'hi' ? 'AI विश्लेषण कर रहा है...' : 'AI is analyzing...'}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{imageFile ? (lang === 'hi' ? 'फोटो का AI विश्लेषण करें' : 'Diagnose Photo with AI') : t('advisor.btnAsk')}</span>
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
                  disabled={loading}
                  onClick={() => handleAsk(text)}
                  className="text-xs bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-900 border border-slate-200 px-3 py-2 rounded-xl text-left transition font-medium active:scale-95 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>💬</span>
                  <span>{text}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Real Conversational Krishi Drishti AI Advice Result */}
      {advisoryResult && (
        <div className="agri-card p-5 bg-white border-emerald-400 shadow-xl space-y-4 animate-in fade-in slide-in-from-bottom-3">
          
          {/* Header with Dynamic Detected Crop Badge */}
          <div className="flex items-start justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1.5 border border-emerald-200">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    KRISHI DRISHTI AI • {advisoryResult.cropName ? advisoryResult.cropName.toUpperCase() : (lang === 'hi' ? 'कृषि दृष्टि AI' : 'AGRICULTURAL INTELLIGENCE')}
                  </span>
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mt-2">
                "{cleanUserQuery(advisoryResult.queryText) || lastQuery || (lang === 'hi' ? 'फसल जांच' : 'Crop Consultation')}"
              </h3>
            </div>

            <VoiceReader
              textToRead={cleanVisibleAdvice(advisoryResult.answer || advisoryResult.whatToDo || 'Here is your agricultural advisory.')}
              textToReadHi={cleanVisibleAdvice(advisoryResult.answer || advisoryResult.whatToDoHi || advisoryResult.whatToDo || 'यहाँ आपकी कृषि सलाह है।')}
            />
          </div>

          {/* Unclear / Non-Crop Image Alert */}
          {advisoryResult.isIdentifiable === false && (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>{lang === 'hi' ? 'स्पष्ट फोटो की आवश्यकता' : 'Clear Photo Needed'}</span>
              </div>
              <p className="text-xs text-amber-950 font-medium leading-relaxed">
                {advisoryResult.answer}
              </p>
            </div>
          )}

          {/* Natural Conversational Answer from AI */}
          {advisoryResult.isIdentifiable !== false && advisoryResult.answer && (
            <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-slate-900 leading-relaxed space-y-2">
              <div className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
                <span>🌱 {lang === 'hi' ? 'कृषि दृष्टि AI सलाह:' : 'Krishi Drishti AI Advice:'}</span>
              </div>
              <div className="text-xs sm:text-sm text-slate-800 font-normal leading-relaxed whitespace-pre-line">
                {cleanVisibleAdvice(advisoryResult.answer)}
              </div>
            </div>
          )}

          {/* Follow-up Context Indicator */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-1">
            <span>
              {lang === 'hi' 
                ? '💬 आप फॉलो-अप सवाल पूछ सकते हैं (जैसे "इसके लिए क्या करूं?" या "कहाँ मिलेगा?")' 
                : '💬 You can ask follow-up questions (e.g., "What organic spray should I use?" or "Where to buy?")'}
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Context Active ({chatHistory.length} msgs)
            </span>
          </div>

          {/* Structured 5-Part Breakdown (Shown if structured data present) */}
          {advisoryResult.issue && advisoryResult.issue !== advisoryResult.answer && (
            <div className="space-y-3 pt-2">
            
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
          )}

          {/* Action Plan Task CTA */}
          <div className="p-3 bg-agri-100 text-agri-950 rounded-xl flex items-center justify-between gap-2 text-xs">
            <span className="font-semibold">
              {lang === 'hi' ? '✓ आपकी दैनिक खेती के लिए कार्य योजना तैयार की गई है!' : '✓ Action plan generated for your daily farming schedule!'}
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
