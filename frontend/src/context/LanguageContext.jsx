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
import orTranslations from '../translations/or.json';
import asTranslations from '../translations/as.json';

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
  or: orTranslations,
  as: asTranslations,
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

const CROP_CANONICAL_MAP = {
  tomato: 'tomato', 'टमाटर': 'tomato', 'ਟਮਾਟਰ': 'tomato', 'टोमॅटो': 'tomato', 'ટામેટા': 'tomato',
  wheat: 'wheat', 'गेहूं': 'wheat', 'ਕਣਕ': 'wheat', 'गहू': 'wheat', 'ઘઉં': 'wheat',
  rice: 'rice', paddy: 'rice', 'धान': 'rice', 'चावल': 'rice', 'ਝੋਨਾ': 'rice', 'भात': 'rice', 'ડાંગર': 'rice',
  cotton: 'cotton', 'कपास': 'cotton', 'ਨਰਮਾ': 'cotton', 'ਕਪਾਹ': 'cotton', 'कापूस': 'cotton',
  maize: 'maize', corn: 'maize', 'मक्का': 'maize', 'ਮੱਕੀ': 'maize', 'मका': 'maize',
  potato: 'potato', 'आलू': 'potato', 'ਆਲੂ': 'potato', 'बटाटा': 'potato', 'બટાટા': 'potato',
  onion: 'onion', 'प्याज': 'onion', 'ਗੰਢਾ': 'onion', 'कांदा': 'onion', 'ડુંગળી': 'onion',
  soybean: 'soybean', 'सोयाबीन': 'soybean',
  sugarcane: 'sugarcane', 'गन्ना': 'sugarcane', 'ਕਮਾਦ': 'sugarcane', 'ऊस': 'sugarcane',
  mustard: 'mustard', 'सरसों': 'mustard', 'ਸਰ੍ਹੋਂ': 'mustard', 'मोहरी': 'mustard',
  gram: 'gram', chickpea: 'gram', 'चना': 'gram', 'ਛੋਲੇ': 'gram', 'हरभरा': 'gram',
  groundnut: 'groundnut', 'मूंगफली': 'groundnut', 'ਮੂੰਗਫਲੀ': 'groundnut', 'भुईमूग': 'groundnut',
  chili: 'chili', chilli: 'chili', 'मिर्च': 'chili', 'ਮਿਰਚ': 'chili', 'मिरची': 'chili'
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('krishi_lang') || 'hi';
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

  // Dedicated 2-way Hindi <-> English switch for Login, Register, and quick toggling
  const toggleHindiEnglish = () => {
    setLang((prev) => (prev === 'hi' ? 'en' : 'hi'));
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

  // Dynamic farm data translation helpers
  const tCrop = (rawCrop) => {
    if (!rawCrop) return t('crops.general', 'Crop');
    const clean = String(rawCrop).toLowerCase().trim();
    const key = CROP_CANONICAL_MAP[clean] || clean;
    return t(`crops.${key}`, rawCrop);
  };

  const tStage = (rawStage) => {
    if (!rawStage) return t('stages.vegetative', 'Vegetative Stage');
    const s = String(rawStage).toLowerCase();
    if (s.includes('flower') || s.includes('फूल') || s.includes('ਫੁੱਲ')) return t('stages.flowering', 'Flowering Stage');
    if (s.includes('fruit') || s.includes('pod') || s.includes('फल') || s.includes('दाण')) return t('stages.fruiting', 'Fruiting Stage');
    if (s.includes('seedling') || s.includes('पौध') || s.includes('ਪਨੀਰੀ')) return t('stages.seedling', 'Seedling Stage');
    if (s.includes('germ') || s.includes('अंकुरण') || s.includes('ਪੁੰਗਰ')) return t('stages.germination', 'Germination Stage');
    if (s.includes('matur') || s.includes('पक्व') || s.includes('ਪੱਕ')) return t('stages.maturity', 'Maturity Stage');
    if (s.includes('harvest') || s.includes('कटाई') || s.includes('ਵਾਢੀ')) return t('stages.harvesting', 'Harvesting Stage');
    return t('stages.vegetative', 'Vegetative Stage');
  };

  const tSoil = (rawSoil) => {
    if (!rawSoil) return t('soils.black', 'Black Soil');
    const s = String(rawSoil).toLowerCase();
    if (s.includes('black') || s.includes('काली') || s.includes('ਕਾਲੀ') || s.includes('काळी')) return t('soils.black', 'Black Soil');
    if (s.includes('alluvial') || s.includes('जलोढ़') || s.includes('ਜਲੋਢ')) return t('soils.alluvial', 'Alluvial Soil');
    if (s.includes('red') || s.includes('लाल') || s.includes('ਲਾਲ') || s.includes('तांब')) return t('soils.red', 'Red Soil');
    if (s.includes('sand') || s.includes('बलुई') || s.includes('ਰੇਤਲੀ')) return t('soils.sandy', 'Sandy Loam Soil');
    if (s.includes('clay') || s.includes('चिकनी') || s.includes('ਚੀਕਣੀ')) return t('soils.clay', 'Clay Soil');
    return t('soils.loamy', 'Loamy Soil');
  };

  const tMoisture = (rawStatus) => {
    if (!rawStatus) return t('moistureLevels.adequate', 'Adequate');
    const s = String(rawStatus).toLowerCase();
    if (s.includes('adequ') || s.includes('पर्याप्त') || s.includes('ਉਚਿਤ')) return t('moistureLevels.adequate', 'Adequate');
    if (s.includes('optim') || s.includes('उत्तम') || s.includes('ਵਧੀਆ')) return t('moistureLevels.optimal', 'Optimal');
    if (s.includes('dry') || s.includes('कम') || s.includes('ਸਿੰਚਾਈ') || s.includes('ਘੱਟ')) return t('moistureLevels.dry', 'Dry (Irrigation Needed)');
    if (s.includes('waterlog') || s.includes('जलभराव') || s.includes('જલ')) return t('moistureLevels.waterlogged', 'Waterlogged');
    if (s.includes('crit') || s.includes('गंभीर') || s.includes('ਸੋਕਾ')) return t('moistureLevels.critical', 'Critical');
    return rawStatus;
  };

  const tWeather = (rawWeather) => {
    if (!rawWeather) return t('weatherConditions.clear', 'Clear');
    const s = String(rawWeather).toLowerCase();
    if (s.includes('no rain') || s.includes('बारिश नहीं') || s.includes('ਮੀਂਹ ਨਹੀਂ')) return t('weatherConditions.noRain', 'No Rain');
    if (s.includes('rain') || s.includes('बारिश') || s.includes('ਮੀਂਹ')) return t('weatherConditions.rainy', 'Rainy');
    if (s.includes('cloud') || s.includes('बादल') || s.includes('ਬੱਦਲ')) return t('weatherConditions.cloudy', 'Cloudy');
    if (s.includes('sun') || s.includes('धूप') || s.includes('ਧੁੱਪ')) return t('weatherConditions.sunny', 'Sunny');
    if (s.includes('storm') || s.includes('तूफान') || s.includes('ਤੂਫ਼ਾਨ')) return t('weatherConditions.stormy', 'Stormy');
    return t('weatherConditions.clear', 'Clear');
  };

  return (
    <LanguageContext.Provider value={{ 
      lang, 
      setLanguage, 
      toggleLanguage, 
      toggleHindiEnglish,
      t, 
      tCrop,
      tStage,
      tSoil,
      tMoisture,
      tWeather,
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
