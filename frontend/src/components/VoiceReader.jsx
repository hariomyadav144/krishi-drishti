import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

/**
 * Clean up text for natural, crystal-clear Text-to-Speech
 * Completely strips:
 * - Markdown syntax (###, ##, #, **, *, __, _, `, ~)
 * - Gemini system prompts, developer instructions, "IMPORTANT:" echoes
 * - Citations, token numbers, IDs (e.g. [1], [6075])
 * - URLs, JSON, HTML tags, backslashes
 * - LaTeX / math formatting, converting units into spoken Hindi words
 */
export function cleanTextForSpeech(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';

  let text = rawText;

  // 1. Strip any echoed system instructions, developer prompts, or prompt headers
  text = text.replace(/IMPORTANT:[\s\S]*?(?=(\n\n|किसान|नमस्ते|१|1\.|रोग|समस्या|फसल|उपाय|$))/gi, '');
  text = text.replace(/\[?(?:अनिवार्य निर्देश|कृषि संदर्भ|Agricultural Context|Farmer Question|User Question):[^\n]*\]?\n*/gim, '');
  text = text.replace(/Farmer('s)?\s*(Note|Question):[^\n]*/gim, '');

  // 2. Remove JSON or code blocks
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/`([^`]+)`/g, '$1');
  text = text.replace(/\{[^{}]*\}/g, '');

  // 3. Remove URLs
  text = text.replace(/https?:\/\/\S+/gi, '');

  // 4. Remove citations and random bracketed numbers like [1], [2], [6075]
  text = text.replace(/\[\s*\d+\s*\]/g, '');
  text = text.replace(/\[source:[^\]]*\]/gi, '');

  // 5. Clean up LaTeX symbols & mathematical temperature notations
  text = text.replace(/\\*(?:text|mathrm)\{([^{}]+)\}/gi, '$1');
  text = text.replace(/\t+ext\{([^{}]+)\}/gi, '$1');

  text = text.replace(/\$?\s*([0-9.]+)\s*(?:\^\\*circ|\^circ|°)\s*C?\s*\$?(\s*(?:से|to|-)\s*)\$?\s*([0-9.]+)\s*(?:\^\\*circ|\^circ|°)\s*C?\s*\$?(\s*(?:°C|डिग्री|C)?)/gi, '$1 से $3 डिग्री सेल्सियस');
  text = text.replace(/\$?\s*([0-9.]+)\s*(?:\^\\*circ|\^circ|°)\s*C?\s*\$?/gi, '$1 डिग्री सेल्सियस');

  // Any lingering LaTeX text/circ
  text = text.replace(/\^\\*circ\s*(?:text)?\s*C?/gi, ' डिग्री सेल्सियस');
  text = text.replace(/\\*sim\s*/gi, 'लगभग ');
  text = text.replace(/\\*(?:text|mathrm)/gi, '');
  text = text.replace(/[\$\\^~]/g, '');

  // 6. Convert symbols and units into spoken Hindi words
  text = text.replace(/([0-9]+)\s*°C/gi, '$1 डिग्री सेल्सियस');
  text = text.replace(/([0-9]+)\s*%/g, '$1 प्रतिशत');
  text = text.replace(/([0-9]+)\s*(?:g|gm|ग्राम)\/L/gi, '$1 ग्राम प्रति लीटर');
  text = text.replace(/([0-9]+)\s*(?:ml|मि\.ली\.)\/L/gi, '$1 मिलीलीटर प्रति लीटर');
  text = text.replace(/([0-9]+)\s*kg(?:\/acre|\/एकड़)?/gi, '$1 किलोग्राम प्रति एकड़');

  // 7. Strip all Markdown symbols completely (#, *, _, `, backslashes)
  text = text.replace(/#{1,6}/g, '');
  text = text.replace(/[*_`\\]/g, '');

  // 8. Remove bullet symbols (-, +, •, ·) at start of lines
  text = text.replace(/^[\s\-+•·]+\s*/gm, '');

  // 9. Remove HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // 10. Normalize whitespace
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n\s*\n+/g, '\n');

  return text.trim();
}

/**
 * Split long text into natural sentence chunks to prevent browser TTS cutoff
 */
export function splitIntoSpeechChunks(text, maxChunkLen = 180) {
  if (!text) return [];

  // Split on Hindi full-stop (।), period (.), exclamation (!), question (?), or newline (\n)
  const rawSentences = text
    .split(/([।\n.!?]+)/)
    .reduce((acc, part, i) => {
      if (i % 2 === 0) {
        acc.push(part);
      } else if (acc.length > 0) {
        acc[acc.length - 1] += part;
      }
      return acc;
    }, [])
    .map(s => s.trim())
    .filter(Boolean);

  const chunks = [];
  let currentChunk = '';

  for (const sentence of rawSentences) {
    if ((currentChunk + ' ' + sentence).trim().length <= maxChunkLen) {
      currentChunk = (currentChunk + ' ' + sentence).trim();
    } else {
      if (currentChunk) chunks.push(currentChunk);
      if (sentence.length > maxChunkLen) {
        const words = sentence.split(' ');
        let subChunk = '';
        for (const word of words) {
          if ((subChunk + ' ' + word).trim().length <= maxChunkLen) {
            subChunk = (subChunk + ' ' + word).trim();
          } else {
            if (subChunk.trim()) chunks.push(subChunk.trim());
            subChunk = word;
          }
        }
        if (subChunk.trim()) currentChunk = subChunk.trim();
        else currentChunk = '';
      } else {
        currentChunk = sentence;
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Find the most suitable Hindi voice from browser speech synthesis
 */
export function getBestHindiVoice(voices) {
  if (!voices || !Array.isArray(voices) || voices.length === 0) return null;

  // 1. Exact hi-IN match (e.g. Google हिन्दी, Microsoft Hemant, Microsoft Kalpana)
  const hiIn = voices.find(v => (v.lang === 'hi-IN' || v.lang === 'hi_IN') && !v.name.toLowerCase().includes('english'));
  if (hiIn) return hiIn;

  // 2. Any voice starting with 'hi'
  const anyHi = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('hi'));
  if (anyHi) return anyHi;

  // 3. Any voice containing "Hindi" in its name
  const nameHi = voices.find(v => v.name && v.name.toLowerCase().includes('hindi'));
  if (nameHi) return nameHi;

  // 4. Regional Indian English voice (en-IN) as fallback
  const inEn = voices.find(v => v.lang === 'en-IN' || v.lang === 'en_IN' || (v.name && v.name.toLowerCase().includes('india')));
  if (inEn) return inEn;

  // 5. Default voice
  return voices.find(v => v.default) || voices[0] || null;
}

export default function VoiceReader({ textToRead, textToReadHi }) {
  const { lang, t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [voices, setVoices] = useState([]);
  const synthRef = useRef(null);
  const isCancelledRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    synthRef.current = window.speechSynthesis;

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      if (available && available.length > 0) {
        setVoices(available);
      }
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      isCancelledRef.current = true;
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stopSpeech = () => {
    isCancelledRef.current = true;
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsPlaying(false);
  };

  const handleToggleSpeak = () => {
    if (!synthRef.current) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    if (isPlaying) {
      stopSpeech();
      return;
    }

    // Cancel any previous audio
    synthRef.current.cancel();
    isCancelledRef.current = false;

    // Determine raw text source
    const rawText = (lang === 'hi' && textToReadHi) ? textToReadHi : (textToRead || textToReadHi);
    const cleanContent = cleanTextForSpeech(rawText);

    if (!cleanContent) {
      return;
    }

    // Chunk text into sentence-sized blocks to avoid Chrome TTS 15-second cutoff
    const chunks = splitIntoSpeechChunks(cleanContent, 180);
    if (chunks.length === 0) return;

    const currentVoices = synthRef.current.getVoices();
    const voiceToUse = getBestHindiVoice(currentVoices.length > 0 ? currentVoices : voices);

    setIsPlaying(true);
    let chunkIndex = 0;

    const playNextChunk = () => {
      if (isCancelledRef.current) {
        setIsPlaying(false);
        return;
      }

      if (chunkIndex >= chunks.length) {
        setIsPlaying(false);
        return;
      }

      const chunkText = chunks[chunkIndex];
      chunkIndex++;

      const utterance = new SpeechSynthesisUtterance(chunkText);
      utterance.lang = voiceToUse ? voiceToUse.lang : 'hi-IN';
      if (voiceToUse) {
        utterance.voice = voiceToUse;
      }
      utterance.rate = 0.88; // comfortable, natural pace for Indian farmers
      utterance.pitch = 1.0;

      utterance.onend = () => {
        if (!isCancelledRef.current) {
          playNextChunk();
        } else {
          setIsPlaying(false);
        }
      };

      utterance.onerror = (e) => {
        console.warn('TTS playback error:', e);
        if (!isCancelledRef.current && e.error !== 'canceled' && e.error !== 'interrupted') {
          playNextChunk();
        } else {
          setIsPlaying(false);
        }
      };

      synthRef.current.speak(utterance);
    };

    playNextChunk();
  };

  return (
    <button
      onClick={handleToggleSpeak}
      type="button"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
        isPlaying
          ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse ring-2 ring-amber-300'
          : 'bg-agri-50 hover:bg-agri-100 text-agri-800 border-agri-200 shadow-xs'
      }`}
      title={isPlaying ? t('advisor.stopVoice') : t('advisor.listenVoice')}
    >
      {isPlaying ? (
        <>
          <VolumeX className="w-4 h-4 text-amber-700" />
          <span>{t('advisor.stopVoice') || 'Stop Audio'}</span>
        </>
      ) : (
        <>
          <Volume2 className="w-4 h-4 text-agri-700" />
          <span>{t('advisor.listenVoice') || 'Listen in Audio'} 🔊</span>
        </>
      )}
    </button>
  );
}

