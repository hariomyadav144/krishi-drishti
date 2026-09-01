import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function VoiceReader({ textToRead, textToReadHi }) {
  const { lang, t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [synth, setSynth] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSynth(window.speechSynthesis);
    }
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggleSpeak = () => {
    if (!synth) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    if (isPlaying) {
      synth.cancel();
      setIsPlaying(false);
      return;
    }

    synth.cancel(); // Stop any pending speech

    const text = (lang === 'hi' && textToReadHi) ? textToReadHi : textToRead;
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.92; // slightly slower for clear farmer understanding
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setIsPlaying(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
    };

    synth.speak(utterance);
    setIsPlaying(true);
  };

  return (
    <button
      onClick={handleToggleSpeak}
      type="button"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
        isPlaying
          ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
          : 'bg-agri-50 hover:bg-agri-100 text-agri-800 border-agri-200'
      }`}
      title={isPlaying ? t('advisor.stopVoice') : t('advisor.listenVoice')}
    >
      {isPlaying ? (
        <>
          <VolumeX className="w-4 h-4 text-amber-700" />
          <span>{t('advisor.stopVoice')}</span>
        </>
      ) : (
        <>
          <Volume2 className="w-4 h-4 text-agri-700" />
          <span>{t('advisor.listenVoice')} 🔊</span>
        </>
      )}
    </button>
  );
}
