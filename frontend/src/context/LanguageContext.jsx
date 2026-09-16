import React, { createContext, useContext, useState, useEffect } from 'react';
import enTranslations from '../translations/en.json';
import hiTranslations from '../translations/hi.json';
import mrTranslations from '../translations/mr.json';
import paTranslations from '../translations/pa.json';
import guTranslations from '../translations/gu.json';
import bnTranslations from '../translations/bn.json';
import taTranslations from '../translations/ta.json';
import teTranslations from '../translations/te.json';
import knTranslations from '../translations/kn.json';
import mlTranslations from '../translations/ml.json';

const LanguageContext = createContext();

const translations = {
  en: enTranslations,
  hi: hiTranslations,
  mr: mrTranslations,
  pa: paTranslations,
  gu: guTranslations,
  bn: bnTranslations,
  ta: taTranslations,
  te: teTranslations,
  kn: knTranslations,
  ml: mlTranslations,
};

export const availableLanguages = [
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', icon: '🇮🇳', speechLocale: 'hi-IN' },
  { code: 'en', label: 'English', native: 'English', icon: '🇬🇧', speechLocale: 'en-IN' },
  { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ', icon: '🌾', speechLocale: 'pa-IN' },
  { code: 'mr', label: 'Marathi', native: 'मराठी', icon: '🚩', speechLocale: 'mr-IN' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી', icon: '🦁', speechLocale: 'gu-IN' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা', icon: '🐅', speechLocale: 'bn-IN' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்', icon: '🛕', speechLocale: 'ta-IN' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు', icon: '🌊', speechLocale: 'te-IN' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ', icon: '🌿', speechLocale: 'kn-IN' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം', icon: '🌴', speechLocale: 'ml-IN' },
  { code: 'or', label: 'Odia', native: 'ଓଡ଼ିଆ', icon: '🌸', speechLocale: 'or-IN' },
  { code: 'as', label: 'Assamese', native: 'অসমীয়া', icon: '🍃', speechLocale: 'as-IN' },
];

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('krishi_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('krishi_lang', lang);
  }, [lang]);

  const setLanguage = (selectedLang) => {
    if (translations[selectedLang]) {
      setLang(selectedLang);
    }
  };

  const toggleLanguage = () => {
    const codes = availableLanguages.map(l => l.code);
    const nextIdx = (codes.indexOf(lang) + 1) % codes.length;
    setLang(codes[nextIdx]);
  };

  const currentLanguageObj = availableLanguages.find(l => l.code === lang) || availableLanguages[0];

  // Nested key translation helper: t('nav.home')
  const t = (path, fallback = '') => {
    if (!path) return fallback;
    const keys = path.split('.');
    let current = translations[lang] || translations.hi || translations.en;

    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key];
      } else {
        // Fallback to Hindi or English
        let fallbackDict = translations.hi || translations.en;
        for (const fKey of keys) {
          if (fallbackDict && fallbackDict[fKey] !== undefined) {
            fallbackDict = fallbackDict[fKey];
          } else {
            return fallback || path;
          }
        }
        return fallbackDict;
      }
    }
    return current;
  };

  return (
    <LanguageContext.Provider value={{ 
      lang, 
      setLanguage, 
      toggleLanguage, 
      t, 
      availableLanguages,
      currentLanguageObj,
      speechLocale: currentLanguageObj.speechLocale || 'hi-IN'
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
