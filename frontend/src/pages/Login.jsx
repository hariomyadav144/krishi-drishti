import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Phone, Lock, ArrowRight } from 'lucide-react';
import { switchServerMode } from '../services/api';

export default function Login({ onNavigateRegister }) {
  const { login, demoLogin } = useAuth();
  const { t, lang, setLanguage, toggleHindiEnglish } = useLanguage();
  const [serverMode, setServerMode] = useState(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('krishi_server_mode')) || 'usb';
  });

  const toggleServer = () => {
    const next = serverMode === 'usb' ? 'cloud' : 'usb';
    setServerMode(next);
    switchServerMode(next);
  };

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const cleanPhone = (phone || '').trim();
    const cleanPassword = (password || '').trim();

    if (!cleanPhone || !cleanPassword) {
      setError(t('auth.fillRequiredFields', 'Please fill in all required fields.'));
      return;
    }

    if (cleanPhone.length < 10) {
      setError(t('auth.enterValidPhone', 'Please enter a valid 10-digit mobile number.'));
      return;
    }

    setLoading(true);
    const res = await login(cleanPhone, cleanPassword);
    setLoading(false);
    if (!res.success) {
      if (res.code === 'ACCOUNT_NOT_FOUND') {
        setError(t('auth.accountNotFound', 'No account found with this mobile number. Please register.'));
      } else if (res.code === 'WRONG_PASSWORD') {
        setError(t('auth.wrongPassword', 'Incorrect password. Please check and try again.'));
      } else if (res.message?.includes('bufferCommands') || res.message?.includes('findOne') || res.message?.includes('initial connection')) {
        setError(t('auth.unableToCreateAccount', 'Unable to log in right now. Please try again in a few moments.'));
      } else if (res.message?.includes('network') || res.message?.includes('Network')) {
        setError(t('auth.networkError', 'Network error. Please check your internet connection.'));
      } else if (res.message?.includes('timed out') || res.message?.includes('timeout')) {
        setError(t('auth.timeoutError', 'Server response timed out. The server may be waking up, please try again.'));
      } else {
        setError(res.message || t('auth.invalidCredentials', 'Invalid mobile number or password.'));
      }
    }
  };

  const handleDemo = async (role) => {
    setError('');
    setLoading(true);
    const res = await demoLogin(role);
    setLoading(false);
    if (!res.success) {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0e2a18] via-[#12381F] to-slate-900 flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8 text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        
        {/* Beginner-Friendly Clear Two-Language Selector (Hindi / English) */}
        <div className="flex items-center justify-center mb-5">
          <div className="inline-flex p-1.5 bg-black/40 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl">
            <button
              type="button"
              id="login-lang-hi-btn"
              onClick={() => setLanguage('hi')}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                lang === 'hi'
                  ? 'bg-agri-600 text-white shadow-lg ring-2 ring-emerald-300 scale-102'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="text-base">🇮🇳</span>
              <span>हिंदी (Hindi)</span>
            </button>
            <button
              type="button"
              id="login-lang-en-btn"
              onClick={() => setLanguage('en')}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                lang === 'en'
                  ? 'bg-agri-600 text-white shadow-lg ring-2 ring-emerald-300 scale-102'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="text-base">🌐</span>
              <span>English</span>
            </button>
          </div>
        </div>

        {/* Brand Header */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-white border border-white/20 mx-auto flex items-center justify-center shadow-lg p-1 mb-3 overflow-hidden">
            <img
              src="./logo.png"
              alt="Fasal Drishti Logo"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {lang === 'hi' ? 'फ़सल दृष्टि' : 'FASAL DRISHTI'}
          </h1>
          <p className="text-xs text-agri-300 font-semibold uppercase tracking-widest mt-0.5">
            {t('auth.aiSmarterFarming', 'AI for Smarter Farming')}
          </p>
          <p className="text-xs text-agri-100/80 mt-2 max-w-xs mx-auto leading-relaxed">
            {t('auth.brandTagline', '“From Space to Soil – Right Information. Better Decisions. Higher Yield.”')}
          </p>
          <div className="flex items-center justify-center mt-3">
            <button
              type="button"
              id="login-server-mode-btn"
              onClick={toggleServer}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-black/40 hover:bg-black/60 border border-white/20 rounded-full text-[11px] text-emerald-300 transition-all active:scale-95 shadow-sm"
              title="Click to toggle between Laptop USB and Cloud server"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{serverMode === 'cloud' ? '☁️ Cloud (Render)' : '💻 Laptop USB (192.168.1.31)'}</span>
              <span className="text-white/40 text-[10px]">⇄ Switch</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white text-slate-900 py-6 px-6 shadow-2xl rounded-3xl sm:px-8 border border-white/10">
          
          {error && (
            <div 
              id="login-error-message"
              className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label 
                htmlFor="login-phone"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
              >
                {t('auth.mobileNumber', 'Mobile Number')}
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  id="login-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t('auth.mobilePlaceholder', 'Enter 10-digit mobile number')}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-agri-600 focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label 
                htmlFor="login-password"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
              >
                {t('auth.password', 'Password')}
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder', 'Enter your password')}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-agri-600 focus:outline-none transition"
                />
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full agri-btn-primary py-3 text-sm font-bold shadow-md mt-2 flex items-center justify-center gap-2"
            >
              <span>{loading ? t('auth.loggingIn', 'Logging in...') : t('auth.loginButton', 'Login')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick 1-Click Demo Login Personas */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center mb-3">
              ⚡ {t('auth.demoPersonasTitle', 'Instant 1-Click Demo Personas')}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                id="demo-farmer-btn"
                onClick={() => handleDemo('farmer')}
                className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-center transition flex flex-col items-center gap-1 text-[11px] font-bold active:scale-95"
              >
                <span>👨‍🌾</span>
                <span>{t('auth.farmerDemo', 'Farmer Demo')}</span>
              </button>

              <button
                type="button"
                id="demo-expert-btn"
                onClick={() => handleDemo('expert')}
                className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-center transition flex flex-col items-center gap-1 text-[11px] font-bold active:scale-95"
              >
                <span>👨‍🔬</span>
                <span>{t('auth.expertDemo', 'Expert Demo')}</span>
              </button>

              <button
                type="button"
                id="demo-admin-btn"
                onClick={() => handleDemo('admin')}
                className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 text-center transition flex flex-col items-center gap-1 text-[11px] font-bold active:scale-95"
              >
                <span>⚙️</span>
                <span>{t('auth.adminDemo', 'Admin Demo')}</span>
              </button>
            </div>
          </div>

          <div className="mt-5 text-center">
            <p className="text-xs text-slate-600">
              {t('auth.dontHaveAccount', "Don't have an account?")}{' '}
              <button
                type="button"
                id="login-to-register-btn"
                onClick={onNavigateRegister}
                className="font-bold text-agri-700 hover:text-agri-800 underline ml-1"
              >
                {t('auth.registerLink', 'Register')}
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
