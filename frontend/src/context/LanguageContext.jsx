import React, { createContext, useContext, useState, useEffect } from 'react';
import enTranslations from '../translations/en.json';
import hiTranslations from '../translations/hi.json';
import mrTranslations from '../translations/mr.json';
import paTranslations from '../translations/pa.json';

const LanguageContext = createContext();

const translations = {
  en: enTranslations,
  hi: hiTranslations,
  mr: mrTranslations,
  pa: paTranslations,
};

export const availableLanguages = [
  { code: 'en', label: 'English', native: 'English', icon: '🇬🇧' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', icon: '🇮🇳' },
  { code: 'mr', label: 'Marathi', native: 'मराठी', icon: '🚩' },
  { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ', icon: '🌾' },
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
    const codes = ['en', 'hi', 'mr', 'pa'];
    const nextIdx = (codes.indexOf(lang) + 1) % codes.length;
    setLang(codes[nextIdx]);
  };

  // Nested key translation helper: t('nav.home')
  const t = (path, fallback = '') => {
    if (!path) return fallback;
    const keys = path.split('.');
    let current = translations[lang] || translations.en;

    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key];
      } else {
        // Fallback to English
        let enCurrent = translations.en;
        for (const enKey of keys) {
          if (enCurrent && enCurrent[enKey] !== undefined) {
            enCurrent = enCurrent[enKey];
          } else {
            return fallback || path;
          }
        }
        return enCurrent;
      }
    }
    return current;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, toggleLanguage, t, availableLanguages }}>
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
