import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { User, Phone, Mail, Lock, ArrowRight, LogIn } from 'lucide-react';
import { normalizePhone } from '../services/api';

export default function Register({ onNavigateLogin, onRegistered }) {
  const { register } = useAuth();
  const { t, lang, setLanguage, toggleHindiEnglish } = useLanguage();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    role: 'farmer',
  });
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setErrorCode('');

    const cleanName = (formData.name || '').trim();
    const cleanPhone = normalizePhone(formData.phone);
    const cleanPassword = (formData.password || '').trim();

    if (!cleanName || !cleanPhone || !cleanPassword) {
      setError(t('auth.fillRequiredFields', 'Please fill in all required fields.'));
      return;
    }

    if (cleanPhone.length !== 10) {
      setError(t('auth.enterValidPhone', 'Please enter a valid 10-digit mobile number.'));
      return;
    }

    if (cleanPassword.length < 6) {
      setError(t('auth.passwordMinLength', 'Password must be at least 6 characters long.'));
      return;
    }

    setLoading(true);
    const res = await register({
      ...formData,
      name: cleanName,
      phone: cleanPhone,
      password: cleanPassword,
    });
    setLoading(false);
    if (!res.success) {
      setErrorCode(res.code || '');
      if (res.code === 'PHONE_EXISTS') {
        setError(t('auth.phoneAlreadyRegistered', 'This mobile number is already registered. Please login.'));
      } else if (res.code === 'EMAIL_EXISTS') {
        setError(t('auth.emailAlreadyRegistered', 'This email is already registered.'));
      } else if (res.message?.includes('bufferCommands') || res.message?.includes('findOne') || res.message?.includes('initial connection')) {
        setError(t('auth.unableToCreateAccount', 'Unable to create your account right now. Please try again.'));
      } else if (res.message?.includes('network') || res.message?.includes('Network')) {
        setError(t('auth.networkError', 'Network connection unavailable. Please try again.'));
      } else if (res.message?.includes('timed out') || res.message?.includes('timeout')) {
        setError(t('auth.timeoutError', 'Server response timed out. The server may be waking up, please try again.'));
      } else {
        setError(res.message || t('auth.registrationFailed', 'Registration failed. Please try again.'));
      }
    } else {
      if (onRegistered) onRegistered();
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
              id="register-lang-hi-btn"
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
              id="register-lang-en-btn"
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
          <div className="w-16 h-16 rounded-2xl bg-white border border-white/20 mx-auto flex items-center justify-center shadow-lg p-1 mb-2 overflow-hidden">
            <img
              src="./logo.png"
              alt="Fasal Drishti Logo"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            {t('auth.joinTitle', 'Join Fasal Drishti')}
          </h1>
          <p className="text-xs text-agri-200 mt-1">
            {t('auth.joinSubtitle', 'Register for AI-Powered Smart Farming')}
          </p>
        </div>
      </div>

      <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white text-slate-900 py-6 px-6 shadow-2xl rounded-3xl sm:px-8 border border-white/10">
          
          {error && (
            <div 
              id="register-error-message"
              className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium"
            >
              <p>{error}</p>
              {errorCode === 'PHONE_EXISTS' && onNavigateLogin && (
                <button
                  type="button"
                  onClick={onNavigateLogin}
                  className="mt-2 w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition shadow-sm"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{lang === 'hi' ? 'लॉगिन पेज पर जाएं (Go to Login)' : 'Go to Login'}</span>
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label 
                htmlFor="register-name"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
              >
                {t('auth.fullName', 'Full Name')} *
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="register-name"
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t('auth.fullNamePlaceholder', 'Enter your full name')}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-agri-600 focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label 
                htmlFor="register-phone"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
              >
                {t('auth.mobileNumber', 'Mobile Number')} *
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  id="register-phone"
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder={t('auth.mobilePlaceholder', 'Enter 10-digit mobile number')}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-agri-600 focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label 
                htmlFor="register-email"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
              >
                {t('auth.emailOptional', 'Email (Optional)')}
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="register-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t('auth.emailPlaceholder', 'farmer@example.com')}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-agri-600 focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label 
                htmlFor="register-password"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
              >
                {t('auth.password', 'Password')} *
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="register-password"
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={t('auth.passwordPlaceholder', 'Enter your password')}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-agri-600 focus:outline-none transition"
                />
              </div>
            </div>

            <button
              id="register-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full agri-btn-primary py-3 text-sm font-bold shadow-md mt-4 flex items-center justify-center gap-2"
            >
              <span>{loading ? t('auth.creatingAccount', 'Creating Account...') : t('auth.createAccount', 'Create Account & Continue')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-xs text-slate-600">
              {t('auth.alreadyHaveAccount', 'Already have an account?')}{' '}
              <button
                type="button"
                id="register-to-login-btn"
                onClick={onNavigateLogin}
                className="font-bold text-agri-700 hover:text-agri-800 underline ml-1"
              >
                {t('auth.loginLink', 'Login')}
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
