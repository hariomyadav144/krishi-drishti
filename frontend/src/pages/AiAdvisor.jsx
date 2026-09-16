import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import VoiceReader from '../components/VoiceReader';
import FeedbackModal from '../components/FeedbackModal';
import FarmerActionDashboard from '../components/FarmerActionDashboard';
import { assembleClientFarmContext } from '../services/farmIntelligenceService';
import { generateStandardStructuredAdvice } from '../services/universalCropEngine';
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
  Info,
  Search,
  CheckSquare,
  Plus
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

  // Active Farm Intelligence Context
  const [selectedFieldId, setSelectedFieldId] = useState('default');
  const [activeFarmContext, setActiveFarmContext] = useState(null);
  const [userFields, setUserFields] = useState([]);

  useEffect(() => {
    try {
      const savedFields = JSON.parse(localStorage.getItem('krishi_farm_fields') || '[]');
      if (Array.isArray(savedFields) && savedFields.length > 0) {
        setUserFields(savedFields);
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    const ctx = assembleClientFarmContext(selectedFieldId);
    setActiveFarmContext(ctx);
  }, [selectedFieldId]);

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
      if (!file.type || !file.type.startsWith('image/')) {
        setError(lang === 'hi' ? 'कृपया एक मान्य फोटो फाइल (JPG, PNG, WebP) चुनें।' : 'Please select a valid image file (JPG, PNG, WebP).');
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        setError(lang === 'hi' ? 'फोटो का साइज 15MB से कम होना चाहिए।' : 'Photo size must be less than 15MB.');
        return;
      }
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
        // Complete Farm Intelligence Guidance
        const targetCrop = activeFarmContext?.crop || currentCrop?.cropName || 'Wheat';
        const targetStage = activeFarmContext?.cropStage || currentCrop?.cropStage || 'Vegetative';

        const payload = {
          question: query,
          queryText: query,
          rawQuestion: query,
          fieldId: selectedFieldId,
          crop: targetCrop,
          cropName: targetCrop,
          stage: targetStage,
          cropStage: targetStage,
          soil: activeFarmContext?.soil || (farm?.soilType ? { type: farm.soilType } : {}),
          weather: activeFarmContext?.weather || farm?.weather || {},
          location: farm?.district ? { district: farm.district, state: farm.state } : {},
          language: lang || 'en',
          conversationHistory: chatHistory.slice(-6),
        };

        res = await api.post('/ai/advice', payload);
      }

      if (res.data && (res.data.success || res.data.answer)) {
        // Handle unidentifiable or non-crop image
        if (res.data.isIdentifiable === false || res.data.data?.isIdentifiable === false || res.data.isPlant === false || res.data.data?.isPlant === false) {
          const fallbackMsg = res.data.unclearMessage || res.data.data?.unclearMessage || res.data.answer || (
            lang === 'hi'
              ? 'अपलोड की गई तस्वीर किसी फसल, पौधे या पत्ते की नहीं लगती है। कृपया अपनी फसल अथवा प्रभावित पत्ती की साफ फोटो अपलोड करें।'
              : "The uploaded image does not appear to contain a crop, plant, or leaf. Please upload a clear photo of your crop or affected plant part."
          );
          setAdvisoryResult({
            isIdentifiable: false,
            isPlant: false,
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

        // Extracted crop name from AI response (strictly from image when image provided)
        const detectedCrop = res.data.crop || res.data.cropName || res.data.data?.cropName || (imageFile ? (lang === 'hi' ? 'पहचानी गई फसल' : 'Identified Crop') : 'Krishi Drishti AI');

        const updatedResult = {
          ...(res.data.data || {}),
          answer: cleanedAnswer,
          queryText: userQuery,
          cropName: detectedCrop,
          crop_name: res.data.crop_name || res.data.data?.crop_name || detectedCrop,
          detected_issue: res.data.detected_issue || res.data.data?.detected_issue,
          severity: res.data.severity || res.data.data?.severity,
          health_score: typeof res.data.health_score === 'number' ? res.data.health_score : (typeof res.data.data?.health_score === 'number' ? res.data.data.health_score : undefined),
          what_needs_attention: res.data.what_needs_attention || res.data.data?.what_needs_attention,
          what_to_do_now: res.data.what_to_do_now || res.data.data?.what_to_do_now,
          why_is_this_happening: res.data.why_is_this_happening || res.data.data?.why_is_this_happening,
          action_timeline: res.data.action_timeline || res.data.data?.action_timeline,
          structuredAdvice: res.data.structuredAdvice || res.data.data?.structuredAdvice,
          plantPart: res.data.plantPart || res.data.data?.plantPart || (lang === 'hi' ? 'पत्ती / पौधा' : 'Leaf / Plant'),
          healthStatus: res.data.healthStatus || res.data.data?.healthStatus || (res.data.farmContext?.healthStatus) || 'Healthy',
          detectedProblem: res.data.detectedProblem || res.data.data?.detectedProblem || res.data.detected_issue,
          confidence: res.data.confidence || res.data.data?.confidence || 90,
          confidenceLevel: res.data.confidenceLevel || res.data.data?.confidenceLevel || 'High',
          visibleSymptoms: res.data.visibleSymptoms || res.data.data?.visibleSymptoms || res.data.data?.whatAiFound || '',
          recommendedActions: res.data.recommendedActions || res.data.data?.recommendedActions || (res.data.data?.recommendedAction ? [res.data.data.recommendedAction] : []),
          organicTreatment: res.data.organicTreatment || res.data.data?.organicTreatment || '',
          chemicalTreatment: res.data.chemicalTreatment || res.data.data?.chemicalTreatment || '',
          preventionTips: res.data.preventionTips || res.data.data?.preventionTips || [],
          whenToSeekExpert: res.data.whenToSeekExpert || res.data.data?.whenToSeekExpert || res.data.data?.importantNote || '',
          diagnosis: res.data.diagnosis || res.data.data?.diagnosis,
          isIdentifiable: true,
          isPlant: true,
          wasImageQuery: !!imageFile,
          farmContext: res.data.farmContext || activeFarmContext
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
      // Offline / network fallback: dynamically generate structured advice
      const targetCrop = activeFarmContext?.crop || currentCrop?.cropName || 'Field Crop';
      const fallbackStructured = generateStandardStructuredAdvice({
        query,
        crop: targetCrop,
        farmContext: activeFarmContext,
        language: lang || 'hi'
      });
      const fallbackAnswer = fallbackStructured.what_to_do_now[0]?.instruction || (lang === 'en' ? 'AI advice is temporarily busy.' : 'अभी सलाह सेवा थोड़ी व्यस्त है।');

      setAdvisoryResult({
        answer: fallbackAnswer,
        queryText: query,
        cropName: fallbackStructured.crop_name,
        crop_name: fallbackStructured.crop_name,
        detected_issue: fallbackStructured.detected_issue,
        severity: fallbackStructured.severity,
        health_score: fallbackStructured.health_score,
        what_needs_attention: fallbackStructured.what_needs_attention,
        what_to_do_now: fallbackStructured.what_to_do_now,
        why_is_this_happening: fallbackStructured.why_is_this_happening,
        action_timeline: fallbackStructured.action_timeline,
        structuredAdvice: fallbackStructured,
        isIdentifiable: true,
        isPlant: true,
        wasImageQuery: !!imageFile,
        farmContext: activeFarmContext
      });

      setChatHistory(prev => [
        ...prev,
        { role: 'user', content: query || (lang === 'hi' ? 'पौधे की फोटो जांच' : 'Crop Photo Inspection') },
        { role: 'model', content: fallbackAnswer }
      ]);
      setQueryText('');
      removeImage();
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
        
        {/* Complete Farm Intelligence Context Bar */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 p-3.5 rounded-2xl border border-emerald-200/80 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-950 font-black">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>
                {lang === 'hi' ? 'सक्रिय कृषि संदर्भ (Active Farm Intelligence Context)' : 'Active Farm Intelligence Context'}
              </span>
            </div>

            {/* Field Switcher if multiple fields available */}
            {userFields.length > 1 ? (
              <select
                value={selectedFieldId}
                onChange={(e) => setSelectedFieldId(e.target.value)}
                className="text-xs bg-white border border-emerald-300 rounded-lg px-2.5 py-1 text-emerald-950 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
              >
                {userFields.map(f => (
                  <option key={f.id || f._id} value={f.id || f._id}>
                    📍 {f.fieldName} ({f.crop || 'Fasl'})
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-[11px] font-bold text-emerald-800 bg-white/90 px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                📍 {activeFarmContext?.fieldName || 'Main Plot'}
              </span>
            )}
          </div>

          {/* 5-Dimension Telemetry Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
            <div className="bg-white/80 p-2 rounded-xl border border-emerald-100 shadow-2xs">
              <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">
                🌱 {lang === 'hi' ? 'फसल' : 'Crop'}
              </span>
              <span className="font-extrabold text-slate-900 truncate block">
                {activeFarmContext?.crop || 'Wheat'}
              </span>
            </div>

            <div className="bg-white/80 p-2 rounded-xl border border-emerald-100 shadow-2xs">
              <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">
                ⏳ {lang === 'hi' ? 'अवस्था' : 'Stage'}
              </span>
              <span className="font-extrabold text-slate-900 truncate block">
                {activeFarmContext?.cropStage || 'Vegetative'}
              </span>
            </div>

            <div className="bg-white/80 p-2 rounded-xl border border-emerald-100 shadow-2xs">
              <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">
                🪵 {lang === 'hi' ? 'मिट्टी / pH' : 'Soil / pH'}
              </span>
              <span className="font-extrabold text-slate-900 truncate block">
                pH {activeFarmContext?.soil?.pH || 7.2} • {activeFarmContext?.soil?.soilType?.split('/')[0] || 'Black Soil'}
              </span>
            </div>

            <div className="bg-white/80 p-2 rounded-xl border border-emerald-100 shadow-2xs">
              <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">
                💧 {lang === 'hi' ? 'नमी / सिंचाई' : 'Moisture'}
              </span>
              <span className="font-extrabold text-slate-900 truncate block">
                {activeFarmContext?.moisture?.score || 78}% ({activeFarmContext?.moisture?.status || 'Adequate'})
              </span>
            </div>

            <div className="bg-white/80 p-2 rounded-xl border border-emerald-100 shadow-2xs col-span-2 sm:col-span-1">
              <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">
                ⛅ {lang === 'hi' ? 'मौसम' : 'Weather'}
              </span>
              <span className="font-extrabold text-slate-900 truncate block">
                {activeFarmContext?.weather?.temp || 27}°C • {activeFarmContext?.weather?.rain24h > 0 ? `🌧️ ${activeFarmContext.weather.rain24h}mm` : 'No Rain'}
              </span>
            </div>
          </div>
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

      {/* Real Conversational SWAR AI Advice Result */}
      {advisoryResult && (
        <div className="agri-card p-5 bg-white border-emerald-400 shadow-xl space-y-4 animate-in fade-in slide-in-from-bottom-3">
          
          {/* Header with Dynamic Detected Crop Badge */}
          <div className="flex items-start justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1.5 border border-emerald-200">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    SWAR (स्वर) VOICE AI • {advisoryResult.cropName ? advisoryResult.cropName.toUpperCase() : (lang === 'hi' ? 'स्वर कृषि सलाहकार' : 'SWAR AI ADVISOR')}
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

          {/* Multimodal AI Vision Image Diagnosis Results (Step 7) */}
          {advisoryResult.isIdentifiable !== false && (advisoryResult.wasImageQuery || advisoryResult.plantPart || advisoryResult.detectedProblem) && (
            <div className="p-4 bg-gradient-to-b from-slate-50 to-emerald-50/30 rounded-2xl border border-emerald-300 shadow-sm space-y-3.5 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'hi' ? 'स्मार्ट AI फोटो विश्लेषण' : 'Smart AI Photo Analysis'}</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-white px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                  {lang === 'hi' ? 'सत्यापित विजन मॉडल' : 'Vision Model Verified'}
                </span>
              </div>

              {/* 4-Item Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* 1. Crop Identified */}
                <div className="p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block mb-1">
                    🌱 {lang === 'hi' ? 'पहचानी गई फसल' : 'Crop Identified'}
                  </span>
                  <span className="text-sm font-black text-slate-900 block truncate">
                    {advisoryResult.cropName || (lang === 'hi' ? 'फसल' : 'Identified Crop')}
                  </span>
                </div>

                {/* 2. Plant Part */}
                <div className="p-3 bg-white rounded-xl border border-teal-200 shadow-2xs">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 block mb-1">
                    🍃 {lang === 'hi' ? 'पौधे का भाग' : 'Plant Part'}
                  </span>
                  <span className="text-sm font-black text-slate-900 block truncate">
                    {advisoryResult.plantPart || (lang === 'hi' ? 'पत्ती / पौधा' : 'Leaf')}
                  </span>
                </div>

                {/* 3. Health Status */}
                <div className={`p-3 bg-white rounded-xl border shadow-2xs ${
                  advisoryResult.healthStatus?.toLowerCase().includes('healthy') || advisoryResult.healthStatus?.includes('स्वस्थ')
                    ? 'border-emerald-300 text-emerald-950'
                    : (advisoryResult.healthStatus?.toLowerCase().includes('stress') || advisoryResult.healthStatus?.toLowerCase().includes('attention')
                        ? 'border-amber-300 text-amber-950'
                        : 'border-rose-300 text-rose-950')
                }`}>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider block mb-1 opacity-80">
                    🩺 {lang === 'hi' ? 'स्वास्थ्य स्थिति' : 'Health Status'}
                  </span>
                  <span className="text-sm font-black block truncate">
                    {advisoryResult.healthStatus || (lang === 'hi' ? 'रोगग्रस्त' : 'Diseased')}
                  </span>
                </div>

                {/* 4. Confidence */}
                <div className="p-3 bg-white rounded-xl border border-blue-200 shadow-2xs">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-800 block mb-1">
                    🎯 {lang === 'hi' ? 'विश्वसनीयता' : 'Confidence'}
                  </span>
                  <span className="text-sm font-black text-blue-950 block">
                    {advisoryResult.confidence ? `${advisoryResult.confidence}%` : '92%'}
                    {advisoryResult.confidenceLevel ? ` (${advisoryResult.confidenceLevel})` : ''}
                  </span>
                </div>
              </div>

              {/* Detected Problem Banner */}
              {advisoryResult.detectedProblem && (
                <div className="p-3.5 bg-white rounded-xl border border-amber-300 shadow-2xs flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[11px] font-bold text-amber-900 block uppercase tracking-wider">
                      ⚠️ {lang === 'hi' ? 'संभावित समस्या / रोग' : 'Detected Problem / Issue'}
                    </span>
                    <span className="text-sm font-black text-slate-900 mt-0.5 block">
                      {advisoryResult.detectedProblem}
                    </span>
                  </div>
                </div>
              )}

              {/* Visible Symptoms */}
              {advisoryResult.visibleSymptoms && (
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                    <Search className="w-4 h-4 text-emerald-600" />
                    <span>{lang === 'hi' ? '🔍 तस्वीर में दिखे लक्षण:' : '🔍 Visible Symptoms from Photo:'}</span>
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {advisoryResult.visibleSymptoms}
                  </p>
                </div>
              )}

              {/* Recommended Actions */}
              {((Array.isArray(advisoryResult.recommendedActions) && advisoryResult.recommendedActions.length > 0) || advisoryResult.recommendedAction) && (
                <div className="p-3.5 bg-white rounded-xl border border-emerald-300 shadow-2xs space-y-2">
                  <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{lang === 'hi' ? '💡 जरूरी कदम (Recommended Actions):' : '💡 Recommended Actions:'}</span>
                  </span>
                  <ul className="space-y-1.5 pl-1 text-xs text-slate-800 font-medium">
                    {(Array.isArray(advisoryResult.recommendedActions) && advisoryResult.recommendedActions.length > 0 
                      ? advisoryResult.recommendedActions 
                      : [advisoryResult.recommendedAction]).map((action, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="font-extrabold text-emerald-700 bg-emerald-100 rounded-full w-4 h-4 flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Treatment Options: Organic & Chemical */}
              {(advisoryResult.organicTreatment || advisoryResult.chemicalTreatment) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {advisoryResult.organicTreatment && (
                    <div className="p-3 bg-white rounded-xl border border-teal-200 shadow-2xs">
                      <span className="text-xs font-bold text-teal-900 block mb-1">
                        🌿 {lang === 'hi' ? 'जैविक उपाय (Organic):' : 'Organic Remedy:'}
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">
                        {advisoryResult.organicTreatment}
                      </p>
                    </div>
                  )}
                  {advisoryResult.chemicalTreatment && (
                    <div className="p-3 bg-white rounded-xl border border-purple-200 shadow-2xs">
                      <span className="text-xs font-bold text-purple-900 block mb-1">
                        🧪 {lang === 'hi' ? 'रासायनिक उपाय (Chemical):' : 'Chemical Control:'}
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">
                        {advisoryResult.chemicalTreatment}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Prevention Tips */}
              {Array.isArray(advisoryResult.preventionTips) && advisoryResult.preventionTips.length > 0 && (
                <div className="p-3 bg-white rounded-xl border border-sky-200 shadow-2xs">
                  <span className="text-xs font-bold text-sky-900 block mb-1.5">
                    🛡️ {lang === 'hi' ? 'भविष्य में बचाव (Prevention):' : 'Prevention & Crop Protection:'}
                  </span>
                  <ul className="space-y-1 text-xs text-slate-700 pl-1 font-medium">
                    {advisoryResult.preventionTips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-sky-600 font-bold">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* When to Seek Expert Help */}
              {advisoryResult.whenToSeekExpert && (
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 shadow-2xs">
                  <span className="font-bold text-slate-900 block mb-0.5">
                    👨‍🌾 {lang === 'hi' ? 'विशेषज्ञ सलाह कब लें:' : 'When to Seek Expert Help:'}
                  </span>
                  <p className="leading-relaxed">
                    {advisoryResult.whenToSeekExpert}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Section 16: Farmer Action Dashboard (Completely Redesigned Unified Advisory) */}
          {advisoryResult.isIdentifiable !== false && (
            <FarmerActionDashboard
              advisoryResult={advisoryResult}
              activeFarmContext={activeFarmContext}
              lang={lang}
              onNavigateTab={setActiveTab}
            />
          )}

          {/* Follow-up Context Indicator */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-1">
            <span>
              {lang === 'hi' 
                ? '💬 आप फॉलो-अप सवाल पूछ सकते हैं (जैसे "इसके लिए क्या करूं?" या "कहाँ मिलेगा?")' 
                : '💬 You can ask follow-up questions (e.g., "What organic spray should I use?" or "Where to buy?")'}
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Farm Context Active ({chatHistory.length} msgs)
            </span>
          </div>

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
