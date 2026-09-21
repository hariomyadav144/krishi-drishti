import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLanguage } from './LanguageContext';
import { cleanTextForSpeech } from '../components/VoiceReader';
import api, { isNativeApp } from '../services/api';
import { 
  checkMicrophonePermission, 
  requestMicrophonePermission, 
  openNativeAppSettings 
} from '../services/appPermissions';

const SwarContext = createContext();

export const SwarProvider = ({ children }) => {
  const { lang, speechLocale, t } = useLanguage();
  
  // SWAR state
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [swarResponse, setSwarResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [currentScreenContext, setCurrentScreenContext] = useState({
    screenName: 'Home',
    crop: '',
    field: '',
    healthScore: null
  });

  // Conversation memory
  const [messages, setMessages] = useState([]);
  
  const recognitionRef = useRef(null);
  const synthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null);

  // Initialize Speech Recognition for active language
  useEffect(() => {
    const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = speechLocale || 'hi-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage('');
      };

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event) => {
        console.warn('[SWAR] Speech recognition notice:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setPermissionDenied(true);
          setErrorMessage(t('swar.micDenied'));
        } else if (event.error === 'no-speech') {
          setErrorMessage(t('swar.notUnderstood') || 'No speech detected.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [speechLocale, t, lang]);

  // Stop speaking on unmount
  useEffect(() => {
    return () => {
      if (synthRef.current) synthRef.current.cancel();
    };
  }, []);

  // Text-To-Speech function
  const speakText = (rawText) => {
    if (!synthRef.current) return;

    synthRef.current.cancel();
    const clean = cleanTextForSpeech(rawText);
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = speechLocale || 'hi-IN';
    utterance.rate = 0.95; // Slightly calmer for farmers

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    // Pick best available voice for language
    const voices = synthRef.current.getVoices();
    const matchingVoice = voices.find(v => v.lang.toLowerCase().replace('_', '-').startsWith(speechLocale.slice(0, 2).toLowerCase()));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const openAppSettings = async () => {
    if (isNativeApp()) {
      await openNativeAppSettings();
    }
  };

  const ensureMicPermission = async () => {
    // 1. Native Android flow via Capacitor AppPermissions plugin
    if (isNativeApp()) {
      try {
        const isGranted = await checkMicrophonePermission();
        if (isGranted) {
          setPermissionDenied(false);
          return true;
        }

        const requested = await requestMicrophonePermission();
        if (requested) {
          setPermissionDenied(false);
          return true;
        } else {
          setPermissionDenied(true);
          setErrorMessage(
            lang === 'hi'
              ? 'माइक्रोफोन अनुमति अस्वीकृत है। कृपया ऐप सेटिंग्स में जाकर माइक्रोफोन की अनुमति दें।'
              : 'Microphone permission was denied. Please allow microphone access in App Settings.'
          );
          return false;
        }
      } catch (err) {
        console.warn('[SWAR] Native permission error:', err);
      }
    }

    // 2. Standard Web Browser fallback
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setPermissionDenied(false);
        return true;
      } catch (err) {
        console.warn('[SWAR] Web getUserMedia error:', err);
        setPermissionDenied(true);
        setErrorMessage(t('swar.micDenied') || 'Microphone access denied.');
        return false;
      }
    }

    return true;
  };

  const startListening = async () => {
    if (isSpeaking) stopSpeaking();
    setTranscript('');
    setErrorMessage('');
    setPermissionDenied(false);

    const hasPerm = await ensureMicPermission();
    if (!hasPerm) {
      setIsListening(false);
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = speechLocale || 'hi-IN';
        recognitionRef.current.start();
      } catch (err) {
        console.warn('[SWAR] Start listening error:', err.message);
        if (err.name === 'InvalidStateError') {
          try {
            recognitionRef.current.stop();
            setTimeout(() => {
              recognitionRef.current.start();
            }, 250);
          } catch (_) {}
        }
      }
    } else {
      setErrorMessage(t('swar.speechNotSupported'));
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  // Ask SWAR with screen context + farm telemetry
  const askSwar = async (queryText) => {
    const q = (queryText || transcript).trim();
    if (!q) return;

    setLoading(true);
    setErrorMessage('');
    const userMsg = { role: 'user', content: q, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setTranscript('');

    try {
      // Build context query
      const payload = {
        question: q,
        queryText: q,
        language: lang || 'hi',
        crop: currentScreenContext.crop || 'General',
        cropStage: currentScreenContext.cropStage || '',
        screen: currentScreenContext.screenName,
        conversationHistory: messages.slice(-4)
      };

      const res = await api.post('/ai/advice', payload);
      const answer = res.data?.answer || res.data?.data?.answer || 'सलाह उपलब्ध नहीं है।';
      
      const assistantMsg = { role: 'assistant', content: answer, timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, assistantMsg]);
      setSwarResponse(answer);

      // Auto-narrate answer in farmer's selected language
      speakText(answer);
    } catch (err) {
      setErrorMessage(t('swar.busyError'));
    } finally {
      setLoading(false);
    }
  };

  // Structured Voice-to-Form extraction
  const extractFormFieldValue = (spokenText, fieldType = 'text') => {
    if (!spokenText || typeof spokenText !== 'string') return '';
    const clean = spokenText.trim();

    if (fieldType === 'number' || fieldType === 'quantity') {
      const match = clean.match(/([0-9.]+)/);
      return match ? match[1] : clean;
    }

    if (fieldType === 'crop') {
      const crops = ['Wheat', 'गेहूं', 'Tomato', 'टमाटर', 'Paddy', 'धान', 'Cotton', 'कपास', 'Potato', 'आलू'];
      const found = crops.find(c => clean.toLowerCase().includes(c.toLowerCase()));
      return found || clean;
    }

    return clean;
  };

  return (
    <SwarContext.Provider value={{
      isOpen,
      setIsOpen,
      isListening,
      isSpeaking,
      transcript,
      swarResponse,
      loading,
      errorMessage,
      permissionDenied,
      messages,
      currentScreenContext,
      setCurrentScreenContext,
      startListening,
      stopListening,
      speakText,
      stopSpeaking,
      askSwar,
      extractFormFieldValue,
      openAppSettings,
      requestMicPermission: ensureMicPermission
    }}>
      {children}
    </SwarContext.Provider>
  );
};

export const useSwar = () => {
  const ctx = useContext(SwarContext);
  if (!ctx) {
    throw new Error('useSwar must be used within a SwarProvider');
  }
  return ctx;
};
