import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import { Sprout, MapPin, Layers, Droplets, CheckCircle, ArrowRight } from 'lucide-react';

export default function Onboarding({ onOnboardingComplete }) {
  const { user, refreshUser } = useAuth();
  const { lang, t } = useLanguage();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: user ? user.name : '',
    state: 'Maharashtra',
    district: 'Nashik',
    village: 'Pimpalgaon Baswant',
    farmSize: '4.5',
    landUnit: 'Acres',
    mainCrop: 'Tomato',
    soilType: 'Black Soil / Regur',
    irrigationMethod: 'Drip Irrigation',
  });

  const [loading, setLoading] = useState(false);

  const indianStates = [
    'Maharashtra', 'Punjab', 'Uttar Pradesh', 'Gujarat', 'Karnataka',
    'Madhya Pradesh', 'Haryana', 'Rajasthan', 'Andhra Pradesh', 'Tamil Nadu',
    'Telangana', 'Bihar', 'West Bengal', 'Odisha'
  ];

  const cropList = [
    'Tomato', 'Rice / Paddy', 'Wheat', 'Cotton', 'Potato',
    'Sugarcane', 'Maize / Corn', 'Soybean', 'Mustard', 'Onion',
    'Chilli / Pepper', 'Groundnut'
  ];

  const soilTypes = [
    'Black Soil / Regur', 'Alluvial', 'Red & Yellow',
    'Laterite', 'Sandy Loam', 'Clayey'
  ];

  const irrigationMethods = [
    'Drip Irrigation', 'Sprinkler System', 'Flood / Canal',
    'Tube Well', 'Rainfed'
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFinish = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/farmer/onboarding', formData);
      if (res.data.success) {
        await refreshUser();
        if (onOnboardingComplete) onOnboardingComplete();
      }
    } catch (e) {
      console.error('Onboarding failed:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center px-4 py-8 max-w-lg mx-auto">
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-agri-600 to-emerald-400 mx-auto flex items-center justify-center text-white shadow-md mb-2">
          <Sprout className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">
          {lang === 'hi' ? 'खेत का विवरण दर्ज करें' : 'Setup Your Smart Farm'}
        </h2>
        <p className="text-xs text-slate-600 mt-1">
          {lang === 'hi'
            ? 'सटीक AI सिफारिशों के लिए अपने खेत और फसल की जानकारी दें'
            : 'Help Krishi Drishti tailor AI agronomy recommendations for your land'}
        </p>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                step === s ? 'w-8 bg-agri-600' : step > s ? 'w-4 bg-emerald-400' : 'w-4 bg-slate-200'
              }`}
            ></div>
          ))}
        </div>
      </div>

      <div className="agri-card p-6 bg-white border-slate-200 shadow-md">
        
        {/* Step 1: Location & Village */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <MapPin className="w-5 h-5 text-agri-600" />
              <h3 className="font-bold text-slate-800 text-sm">
                {lang === 'hi' ? '1. स्थान एवं पता' : '1. Location Details'}
              </h3>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                {lang === 'hi' ? 'राज्य (State)' : 'State'}
              </label>
              <select
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none"
              >
                {indianStates.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {lang === 'hi' ? 'जिला (District)' : 'District'}
                </label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  placeholder="e.g. Nashik"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {lang === 'hi' ? 'गाँव / क्षेत्र (Village)' : 'Village / Area'}
                </label>
                <input
                  type="text"
                  name="village"
                  value={formData.village}
                  onChange={handleChange}
                  placeholder="e.g. Pimpalgaon"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full agri-btn-primary py-3 text-sm font-bold mt-4"
            >
              <span>{lang === 'hi' ? 'अगला कदम (Next)' : 'Next Step'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Farm Size & Crop */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Sprout className="w-5 h-5 text-agri-600" />
              <h3 className="font-bold text-slate-800 text-sm">
                {lang === 'hi' ? '2. खेत का आकार एवं मुख्य फसल' : '2. Farm Size & Main Crop'}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {lang === 'hi' ? 'खेत का आकार' : 'Farm Size'}
                </label>
                <input
                  type="number"
                  step="0.5"
                  name="farmSize"
                  value={formData.farmSize}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {lang === 'hi' ? 'इकाई (Unit)' : 'Unit'}
                </label>
                <select
                  name="landUnit"
                  value={formData.landUnit}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none"
                >
                  <option value="Acres">Acres (एकड़)</option>
                  <option value="Hectares">Hectares (हेक्टेयर)</option>
                  <option value="Bigha">Bigha (बीघा)</option>
                  <option value="Guntha">Guntha (गुंठा)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                {lang === 'hi' ? 'वर्तमान मुख्य फसल (Main Crop)' : 'Main Current Crop'}
              </label>
              <select
                name="mainCrop"
                value={formData.mainCrop}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none"
              >
                {cropList.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
              >
                {lang === 'hi' ? 'पीछे' : 'Back'}
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-2 agri-btn-primary py-3 text-sm font-bold"
              >
                <span>{lang === 'hi' ? 'अगला कदम' : 'Next Step'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Soil & Irrigation */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Layers className="w-5 h-5 text-agri-600" />
              <h3 className="font-bold text-slate-800 text-sm">
                {lang === 'hi' ? '3. मिट्टी का प्रकार एवं सिंचाई' : '3. Soil Type & Irrigation Method'}
              </h3>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                {lang === 'hi' ? 'मिट्टी का प्रकार (Soil Type)' : 'Soil Type'}
              </label>
              <select
                name="soilType"
                value={formData.soilType}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none"
              >
                {soilTypes.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                {lang === 'hi' ? 'सिंचाई की विधि (Irrigation Method)' : 'Irrigation Method'}
              </label>
              <select
                name="irrigationMethod"
                value={formData.irrigationMethod}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none"
              >
                {irrigationMethods.map((im) => (
                  <option key={im} value={im}>{im}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
              >
                {lang === 'hi' ? 'पीछे' : 'Back'}
              </button>
              <button
                type="button"
                onClick={handleFinish}
                disabled={loading}
                className="flex-2 agri-btn-primary py-3 text-sm font-bold shadow-lg"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{loading ? 'Saving...' : (lang === 'hi' ? 'डैशबोर्ड शुरू करें' : 'Launch Dashboard')}</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
