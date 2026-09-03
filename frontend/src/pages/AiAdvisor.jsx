import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import api, { setCustomBackendUrl, API_BASE_URL } from '../services/api';
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
  Settings,
  Server,
  Camera,
  Image as ImageIcon,
  X,
  Check
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
  const [lastQuery, setLastQuery] = useState('');

  // Image attachment for Multimodal Gemini Vision
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef(null);

  // Backend API URL Settings
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [customBackendUrl, setCustomBackendUrlState] = useState(localStorage.getItem('krishi_backend_url') || API_BASE_URL);
  const [pingStatus, setPingStatus] = useState(null); // null | 'testing' | 'online' | 'warning' | 'failed'
  const [pingLatency, setPingLatency] = useState(null);
  const [pingMessage, setPingMessage] = useState('');

  const testBackendConnection = async (urlToTest) => {
    const raw = (urlToTest || customBackendUrl || '').trim().replace(/\/+$/, '');
    if (!raw) return;
    setPingStatus('testing');
    setPingMessage('Testing connection to backend...');
    const start = Date.now();

    const targetsToTry = [];
    if (raw.endsWith('/api')) {
      targetsToTry.push(`${raw}/health`);
      targetsToTry.push(`${raw.replace(/\/api$/, '')}/health`);
    } else {
      targetsToTry.push(`${raw}/api/health`);
      targetsToTry.push(`${raw}/health`);
    }

    let connected = false;
    let lastStatus = 0;

    for (const targetUrl of targetsToTry) {
      try {
        const res = await fetch(targetUrl, { method: 'GET', mode: 'cors' });
        const latency = Date.now() - start;
        setPingLatency(latency);
        lastStatus = res.status;
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          connected = true;
          if (data.geminiConfigured) {
            setPingStatus('online');
            setPingMessage(`Backend Connected ✓ • Gemini AI Configured ✓ (${latency}ms)`);
          } else {
            setPingStatus('warning');
            setPingMessage(`Backend Connected ✓ (${latency}ms) • Warning: GEMINI_API_KEY is not configured in backend environment variables.`);
          }
          break;
        }
      } catch (err) {
        // Try fallback endpoint
      }
    }

    if (!connected) {
      setPingStatus('failed');
      if (lastStatus === 404) {
        setPingMessage(`HTTP 404: Endpoint not found at ${targetsToTry[0]}. Check service URL.`);
      } else {
        setPingMessage(`Backend Not Connected ✕: Could not reach server at ${raw}. (Render free tier may take ~50s to wake up).`);
      }
    }
  };

  const handleSaveBackendUrl = (newUrl) => {
    const url = (newUrl !== undefined ? newUrl : customBackendUrl).trim();
    setCustomBackendUrl(url);
    setCustomBackendUrlState(url || API_BASE_URL);
    setShowApiSettings(false);
    setError('');
  };

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

  const [chatHistory, setChatHistory] = useState([]);

  const handleAsk = async (textToQuery) => {
    const query = (textToQuery !== undefined ? textToQuery : queryText).trim();
    if (!query && !imageFile) {
      setError(lang === 'hi' ? 'कृपया खेती से जुड़ा कोई सवाल पूछें या पौधे की फोटो जोड़ें।' : 'Please enter a farming question or attach a crop photo.');
      return;
    }

    setLastQuery(query);
    setLoading(true);
    setError('');

    try {
      let res;
      if (imageFile) {
        // Multimodal Image Diagnosis with Gemini Vision
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('question', query || 'Please analyze this crop image and identify symptoms, possible disease, and recommended treatment.');
        formData.append('crop', selectedCrop);
        formData.append('stage', currentCrop?.cropStage || 'Flowering & Early Fruiting');
        formData.append('language', lang);

        try {
          res = await api.post('/ai/diagnose', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } catch (diagErr) {
          // Fallback to /api/ai/diagnose or /api/analysis/scan
          res = await api.post('/analysis/scan', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
      } else {
        // Conversational Agricultural Guidance
        const payload = {
          question: query,
          crop: selectedCrop,
          stage: currentCrop?.cropStage || 'Flowering & Early Fruiting',
          soil: farm?.soilType ? { type: farm.soilType } : {},
          weather: farm?.weather || {},
          location: farm?.district ? { district: farm.district, state: farm.state } : {},
          language: lang,
          conversationHistory: chatHistory.slice(-6),
        };

        try {
          res = await api.post('/ai/advice', payload);
        } catch (adviceErr) {
          // Fallback to legacy /ai-advice or /recommendations/ask
          try {
            res = await api.post('/ai-advice', payload);
          } catch (recErr) {
            res = await api.post('/recommendations/ask', {
              queryText: query,
              question: query,
              cropName: selectedCrop,
              cropStage: currentCrop?.cropStage || 'Flowering & Early Fruiting',
              location: farm?.district || farm?.state || '',
              language: lang,
              conversationHistory: chatHistory.slice(-6)
            });
          }
        }
      }

      if (res.data && (res.data.success || res.data.answer)) {
        const answerText = res.data.answer || res.data.data?.answer || res.data.data?.whatToDo || '';
        const updatedResult = res.data.data || {
          answer: answerText,
          queryText: query || 'Crop Photo Diagnosis',
          cropName: selectedCrop,
        };
        if (!updatedResult.answer) updatedResult.answer = answerText;
        if (!updatedResult.queryText) updatedResult.queryText = query || 'Crop Photo Diagnosis';
        if (!updatedResult.cropName) updatedResult.cropName = selectedCrop;
        if (res.data.diagnosis) updatedResult.diagnosis = res.data.diagnosis;

        setAdvisoryResult(updatedResult);
        setChatHistory(prev => [
          ...prev,
          { role: 'user', content: query || 'Crop Photo Inspection' },
          { role: 'model', content: answerText }
        ]);
        setQueryText('');
        removeImage();
      }
    } catch (err) {
      console.error('Advisor query error:', err);
      const msg = err.response?.data?.message || err.message || 'Error generating AI recommendation from Google Gemini.';
      setError(msg);
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

      {/* Backend API Connection Status Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-100/90 rounded-xl text-xs text-slate-600 border border-slate-200">
        <div className="flex items-center gap-2 truncate">
          <Server className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="font-semibold text-slate-700">AI Backend API:</span>
          <code className="text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px] truncate max-w-[200px] sm:max-w-xs">
            {customBackendUrl || API_BASE_URL}
          </code>
        </div>
        <button
          type="button"
          onClick={() => setShowApiSettings(prev => !prev)}
          className="font-bold text-amber-700 hover:text-amber-900 text-xs flex items-center gap-1 shrink-0 ml-2 py-0.5 px-2 rounded-lg hover:bg-amber-100/60 transition"
        >
          <Settings className="w-3 h-3" />
          <span>{showApiSettings ? 'Close' : 'Configure'}</span>
        </button>
      </div>

      {/* Backend API Settings Panel */}
      {showApiSettings && (
        <div className="p-4 bg-white rounded-2xl border-2 border-amber-300 shadow-md space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
              <Server className="w-4 h-4 text-amber-600" />
              <span>Configure AI Backend API Endpoint</span>
            </h4>
            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
              Production & Dev
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Enter your deployed Render backend endpoint hosting the secure Gemini API service.
          </p>

          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            <input
              type="text"
              value={customBackendUrl}
              onChange={(e) => setCustomBackendUrlState(e.target.value)}
              placeholder="e.g. https://krishi-drishti.onrender.com/api"
              className="flex-1 min-w-[200px] p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => testBackendConnection(customBackendUrl)}
              disabled={pingStatus === 'testing'}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 transition shrink-0"
            >
              {pingStatus === 'testing' ? 'Testing...' : 'Test Ping'}
            </button>
            <button
              type="button"
              onClick={() => handleSaveBackendUrl(customBackendUrl)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition shrink-0"
            >
              Save & Apply
            </button>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
            <span className="font-semibold text-slate-500">Quick Presets:</span>
            <button
              type="button"
              onClick={() => {
                setCustomBackendUrlState('https://krishi-drishti.onrender.com/api');
                handleSaveBackendUrl('https://krishi-drishti.onrender.com/api');
                testBackendConnection('https://krishi-drishti.onrender.com/api');
              }}
              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-lg border border-emerald-200 transition font-medium"
            >
              🚀 Render (krishi-drishti)
            </button>
            <button
              type="button"
              onClick={() => {
                setCustomBackendUrlState('http://localhost:5000/api');
                handleSaveBackendUrl('http://localhost:5000/api');
                testBackendConnection('http://localhost:5000/api');
              }}
              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-lg border border-blue-200 transition font-medium"
            >
              💻 Localhost (5000)
            </button>
          </div>

          {/* Ping Status Feedback */}
          {pingStatus && (
            <div className={`p-2.5 rounded-xl text-xs font-medium flex items-center justify-between border ${
              pingStatus === 'online'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : pingStatus === 'warning'
                ? 'bg-amber-50 text-amber-900 border-amber-200'
                : 'bg-red-50 text-red-900 border-red-200'
            }`}>
              <span>{pingMessage}</span>
              {pingLatency && <span className="font-mono text-[10px]">{pingLatency}ms</span>}
            </div>
          )}
        </div>
      )}

      {/* Diagnostic Error Banner with Retry */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl space-y-2 text-xs animate-in fade-in">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 text-red-900 font-bold text-sm">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>AI Advisory Notice</span>
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

          <div className="pt-2 border-t border-red-100 flex items-center justify-between flex-wrap gap-2">
            <span className="text-[11px] text-red-700">
              Target: <code className="bg-white/80 px-1 py-0.5 rounded border border-red-200">{customBackendUrl || API_BASE_URL}</code>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAsk(lastQuery)}
                disabled={loading}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-xs transition flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Retry Question</span>
              </button>
              <button
                type="button"
                onClick={() => setShowApiSettings(true)}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] rounded-lg shadow-xs transition"
              >
                ⚙️ Check Backend
              </button>
            </div>
          </div>
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
              <option value="Wheat">Wheat (गेहूं)</option>
              <option value="Rice / Paddy">Rice / Paddy (धान)</option>
              <option value="Cotton">Cotton (कपास)</option>
              <option value="Potato">Potato (आलू)</option>
              <option value="Onion">Onion (प्याज)</option>
              <option value="Chilli / Pepper">Chilli / Pepper (मिर्च)</option>
              <option value="Maize">Maize / Corn (मक्का)</option>
              <option value="Mustard">Mustard (सरसों)</option>
              <option value="Soybean">Soybean (सोयाबीन)</option>
            </select>
          </div>

          <span className="text-[11px] text-agri-700 bg-agri-50 px-2 py-0.5 rounded font-semibold">
            🌱 {currentCrop?.cropStage || 'Flowering & Early Fruiting'} • {farm?.soilType || 'Loamy Soil'}
          </span>
        </div>

        {/* Textarea Form + Speech Mic Button + Photo Attachment */}
        <form onSubmit={(e) => { e.preventDefault(); handleAsk(); }} className="space-y-3">
          <div className="relative">
            <textarea
              rows={3}
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder={lang === 'hi' ? 'अपनी फसल की समस्या, बीमारी, खाद, या सिंचाई के बारे में पूछें...' : 'Ask about crop disease, symptoms, fertilizers, irrigation, pests, or PM schemes...'}
              className="w-full p-3.5 pr-20 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            ></textarea>

            {/* Hidden Photo Input */}
            <input
              type="file"
              accept="image/*"
              capture="environment"
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
                title="Attach or take photo of affected crop"
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
                    : 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                }`}
                title={t('advisor.btnVoice')}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Image Attachment Preview */}
          {imagePreview && (
            <div className="flex items-center gap-3 p-2 bg-emerald-50 rounded-xl border border-emerald-200">
              <img
                src={imagePreview}
                alt="Selected crop"
                className="w-12 h-12 object-cover rounded-lg border border-emerald-300 shadow-xs"
              />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-emerald-950 block truncate">
                  📷 {imageFile?.name || 'Crop Photo Attached'}
                </span>
                <span className="text-[10px] text-emerald-700 block">
                  Gemini Vision Multimodal Analysis will inspect this photo
                </span>
              </div>
              <button
                type="button"
                onClick={removeImage}
                className="p-1 rounded-full text-slate-500 hover:text-red-600 hover:bg-white transition"
                title="Remove photo"
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
              <span>{imageFile ? 'Photo Attached' : 'Add Photo'}</span>
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
              <span>{isListening ? 'Stop' : t('advisor.btnVoice')}</span>
            </button>

            <button
              type="submit"
              disabled={loading || (!queryText.trim() && !imageFile)}
              className="flex-1 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 text-white font-bold py-3 px-5 rounded-xl shadow-md flex items-center justify-center gap-2 text-sm transition active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI is thinking... (सलाह तैयार हो रही है)</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{imageFile ? 'Diagnose Photo with AI' : t('advisor.btnAsk')}</span>
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

      {/* Real Conversational Gemini AI Advice Result */}
      {advisoryResult && (
        <div className="agri-card p-5 bg-white border-emerald-400 shadow-xl space-y-4 animate-in fade-in slide-in-from-bottom-3">
          
          {/* Header */}
          <div className="flex items-start justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>Google Gemini AI • {advisoryResult.cropName || selectedCrop}</span>
                </span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  Live Response
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mt-2">
                "{advisoryResult.queryText}"
              </h3>
            </div>

            <VoiceReader
              textToRead={advisoryResult.answer || advisoryResult.whatToDo || 'Here is your agricultural recommendation.'}
              textToReadHi={advisoryResult.answer || advisoryResult.whatToDoHi || advisoryResult.whatToDo || 'यहाँ आपकी कृषि सलाह है।'}
            />
          </div>

          {/* Natural Conversational Answer from Gemini */}
          {advisoryResult.answer && (
            <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-slate-900 leading-relaxed space-y-2">
              <div className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
                <span>🌱 कृषि दृष्टि AI सलाह (Real-Time Agricultural Advice):</span>
              </div>
              <div className="text-xs sm:text-sm text-slate-800 font-normal leading-relaxed whitespace-pre-line">
                {advisoryResult.answer}
              </div>
            </div>
          )}

          {/* Follow-up Context Indicator */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-1">
            <span>💬 आप फॉलो-अप सवाल पूछ सकते हैं (जैसे "इसके लिए क्या करूं?" या "कहाँ मिलेगा?")</span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Context Active ({chatHistory.length} msgs)
            </span>
          </div>

          {/* Structured Breakdown (Shown if structured breakdown is present) */}
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
