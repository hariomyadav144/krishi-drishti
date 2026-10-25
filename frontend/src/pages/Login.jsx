import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Phone, Lock, ArrowRight, UserPlus, KeyRound, ShieldCheck, CheckCircle2, RotateCcw, ArrowLeft, Satellite, MapPin, Scan, Sparkles, TrendingUp, CloudRain, HelpCircle, ChevronDown, ChevronUp, ExternalLink, Award } from 'lucide-react';
import api, { normalizePhone } from '../services/api';

export default function Login({ onNavigateRegister }) {
  const { login, demoLogin } = useAuth();
  const { t, lang, setLanguage } = useLanguage();

  // Mode: 'login' | 'forgot_phone' | 'forgot_otp' | 'forgot_new_pass' | 'forgot_success'
  const [mode, setMode] = useState('login');

  const [phone, setPhone] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('krishi_remember_phone') || '';
    }
    return '';
  });
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('krishi_remember_me');
      if (stored !== null) return stored === 'true';
    }
    return true;
  });

  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password flow state
  const [forgotPhone, setForgotPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  // Resend cooldown timer
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((c) => Math.max(0, c - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setErrorCode('');

    const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
    const cleanPassword = (password || '').trim();

    if (!cleanPhone || !cleanPassword) {
      setError(t('auth.fillRequiredFields', 'Please fill in all required fields.'));
      return;
    }

    if (cleanPhone.length !== 10) {
      setError(t('auth.enterValidPhone', 'Please enter a valid 10-digit mobile number.'));
      return;
    }

    if (rememberMe) {
      localStorage.setItem('krishi_remember_phone', cleanPhone);
      localStorage.setItem('krishi_remember_me', 'true');
    } else {
      localStorage.removeItem('krishi_remember_phone');
      localStorage.setItem('krishi_remember_me', 'false');
    }

    setLoading(true);
    const res = await login(cleanPhone, cleanPassword, rememberMe);
    setLoading(false);
    if (!res.success) {
      setErrorCode(res.code || '');
      if (res.code === 'WRONG_PASSWORD' || res.code === 'INVALID_CREDENTIALS' || res.code === 'ACCOUNT_NOT_FOUND') {
        setError(t('auth.invalidCredentials', 'Phone number or password is incorrect.'));
      } else if (res.message?.includes('bufferCommands') || res.message?.includes('findOne') || res.message?.includes('initial connection')) {
        setError(t('auth.unableToCreateAccount', 'Unable to log in right now. Please try again in a few moments.'));
      } else if (res.message?.includes('network') || res.message?.includes('Network')) {
        setError(t('auth.networkError', 'Network connection unavailable. Please try again.'));
      } else if (res.message?.includes('timed out') || res.message?.includes('timeout')) {
        setError(t('auth.timeoutError', 'Server response timed out. The server may be waking up, please try again.'));
      } else {
        setError(res.message || t('auth.invalidCredentials', 'Phone number or password is incorrect.'));
      }
    }
  };

  const handleDemo = async (role) => {
    setError('');
    setErrorCode('');
    setLoading(true);
    const res = await demoLogin(role);
    setLoading(false);
    if (!res.success) {
      setError(res.message);
    }
  };

  // -------------------------------------------------------------
  // FORGOT PASSWORD HANDLERS
  // -------------------------------------------------------------
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    const clean = normalizePhone(forgotPhone);
    if (!clean || clean.length !== 10) {
      setError(lang === 'hi' ? 'कृपया मान्य 10-अंकों का मोबाइल नंबर दर्ज करें।' : 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password/send-otp', { phone: clean });
      setLoading(false);
      if (res.data?.success) {
        setCooldown(res.data.cooldownSeconds || 60);
        setMode('forgot_otp');
        setSuccessMessage(lang === 'hi' ? 'OTP आपके पंजीकृत मोबाइल पर भेज दिया गया है।' : 'OTP sent successfully to your registered number.');
      } else {
        setError(res.data?.message || 'Failed to send OTP.');
      }
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || err.message || 'Error sending OTP. Please try again.');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    const clean = normalizePhone(forgotPhone);
    const cleanOtp = (otp || '').trim();
    if (!cleanOtp || cleanOtp.length < 4) {
      setError(lang === 'hi' ? 'कृपया 6-अंकों का OTP दर्ज करें।' : 'Please enter the 6-digit verification OTP.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password/verify-otp', { phone: clean, otp: cleanOtp });
      setLoading(false);
      if (res.data?.success && res.data.resetToken) {
        setResetToken(res.data.resetToken);
        setMode('forgot_new_pass');
        setError('');
      } else {
        setError(res.data?.message || 'Invalid OTP.');
      }
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Invalid or expired OTP.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    const clean = normalizePhone(forgotPhone);

    if (!newPassword || newPassword.length < 6) {
      setError(lang === 'hi' ? 'नया पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' : 'New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(lang === 'hi' ? 'दोनों पासवर्ड मेल नहीं खाते।' : 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password/reset-password', {
        phone: clean,
        resetToken,
        newPassword,
      });
      setLoading(false);
      if (res.data?.success) {
        setPhone(clean);
        setPassword('');
        setMode('forgot_success');
      } else {
        setError(res.data?.message || 'Failed to reset password.');
      }
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Password reset failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0e2a18] via-[#12381F] to-slate-900 flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8 text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        
        {/* Clear Two-Language Selector (Hindi / English) */}
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
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white text-slate-900 py-6 px-6 shadow-2xl rounded-3xl sm:px-8 border border-white/10">
          
          {error && (
            <div 
              id="login-error-message"
              className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium"
            >
              <p>{error}</p>
              {errorCode === 'ACCOUNT_NOT_FOUND' && onNavigateRegister && mode === 'login' && (
                <button
                  type="button"
                  onClick={onNavigateRegister}
                  className="mt-2 w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition shadow-sm"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{lang === 'hi' ? 'नया किसान खाता बनाएं (Register)' : 'Create New Farmer Account'}</span>
                </button>
              )}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ============================================================= */}
          {/* MODE: STANDARD LOGIN FORM                                    */}
          {/* ============================================================= */}
          {mode === 'login' && (
            <>
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
                  <div className="flex items-center justify-between mb-1">
                    <label 
                      htmlFor="login-password"
                      className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
                    >
                      {t('auth.password', 'Password')}
                    </label>
                    <button
                      type="button"
                      id="forgot-password-link"
                      onClick={() => {
                        setForgotPhone(phone);
                        setError('');
                        setSuccessMessage('');
                        setMode('forgot_phone');
                      }}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                    >
                      {lang === 'hi' ? 'पासवर्ड भूल गए?' : 'Forgot Password?'}
                    </button>
                  </div>
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

                {/* Remember Me Checkbox */}
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-xs font-semibold text-slate-600 cursor-pointer">
                    {lang === 'hi' ? 'मुझे याद रखें (Remember me)' : 'Remember me'}
                  </label>
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
            </>
          )}

          {/* ============================================================= */}
          {/* MODE: FORGOT PASSWORD - STEP 1 (PHONE NUMBER)                 */}
          {/* ============================================================= */}
          {mode === 'forgot_phone' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-base font-bold text-slate-800">
                    {lang === 'hi' ? 'पासवर्ड पुनर्प्राप्त करें' : 'Forgot Password?'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {lang === 'hi' ? 'अपना पंजीकृत मोबाइल नंबर दर्ज करें' : 'Enter your registered phone number'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label htmlFor="forgot-phone" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t('auth.mobileNumber', 'Mobile Number')}
                  </label>
                  <div className="relative rounded-xl shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      id="forgot-phone"
                      type="tel"
                      required
                      value={forgotPhone}
                      onChange={(e) => setForgotPhone(e.target.value)}
                      placeholder={t('auth.mobilePlaceholder', 'Enter 10-digit mobile number')}
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-agri-600 focus:outline-none transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full agri-btn-primary py-3 text-sm font-bold shadow-md flex items-center justify-center gap-2"
                >
                  <span>{loading ? (lang === 'hi' ? 'OTP भेजा जा रहा है...' : 'Sending OTP...') : (lang === 'hi' ? 'OTP भेजें' : 'Send OTP')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError(''); }}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800"
                  >
                    {lang === 'hi' ? '← लॉगिन पेज पर वापस जाएं' : '← Back to Login'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ============================================================= */}
          {/* MODE: FORGOT PASSWORD - STEP 2 (OTP VERIFICATION)             */}
          {/* ============================================================= */}
          {mode === 'forgot_otp' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => { setMode('forgot_phone'); setError(''); }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-base font-bold text-slate-800">
                    {lang === 'hi' ? 'OTP सत्यापन' : 'Enter Verification OTP'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {lang === 'hi' ? `+91 ${forgotPhone} पर भेजा गया कोड दर्ज करें` : `Sent to +91 ${forgotPhone}`}
                  </p>
                </div>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label htmlFor="otp-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {lang === 'hi' ? '6-अंकों का OTP' : '6-Digit OTP'}
                  </label>
                  <div className="relative rounded-xl shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      id="otp-input"
                      type="text"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold tracking-widest text-center focus:bg-white focus:ring-2 focus:ring-agri-600 focus:outline-none transition"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    {cooldown > 0 ? (
                      lang === 'hi' ? `पुनः भेजें (${cooldown}s)` : `Resend in ${cooldown}s`
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="font-bold text-emerald-700 hover:underline flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{lang === 'hi' ? 'OTP पुनः भेजें' : 'Resend OTP'}</span>
                      </button>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMode('forgot_phone')}
                    className="text-slate-500 hover:underline"
                  >
                    {lang === 'hi' ? 'नंबर बदलें' : 'Change Number'}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full agri-btn-primary py-3 text-sm font-bold shadow-md flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{loading ? (lang === 'hi' ? 'जाँच हो रही है...' : 'Verifying...') : (lang === 'hi' ? 'OTP सत्यापित करें' : 'Verify OTP')}</span>
                </button>
              </form>
            </div>
          )}

          {/* ============================================================= */}
          {/* MODE: FORGOT PASSWORD - STEP 3 (NEW PASSWORD)                 */}
          {/* ============================================================= */}
          {mode === 'forgot_new_pass' && (
            <div className="space-y-4">
              <div className="mb-2">
                <h2 className="text-base font-bold text-slate-800">
                  {lang === 'hi' ? 'नया पासवर्ड बनाएं' : 'Create New Password'}
                </h2>
                <p className="text-xs text-slate-500">
                  {lang === 'hi' ? 'सुरक्षित एवं याद रखने योग्य पासवर्ड चुनें' : 'Choose a secure password for your account'}
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-3.5">
                <div>
                  <label htmlFor="new-password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {lang === 'hi' ? 'नया पासवर्ड' : 'New Password'}
                  </label>
                  <div className="relative rounded-xl shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="new-password"
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={lang === 'hi' ? 'न्यूनतम 6 अक्षर' : 'At least 6 characters'}
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-agri-600 focus:outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm-new-password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {lang === 'hi' ? 'पासवर्ड की पुष्टि करें' : 'Confirm Password'}
                  </label>
                  <div className="relative rounded-xl shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="confirm-new-password"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={lang === 'hi' ? 'पासवर्ड पुनः दर्ज करें' : 'Re-enter your password'}
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-agri-600 focus:outline-none transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full agri-btn-primary py-3 text-sm font-bold shadow-md flex items-center justify-center gap-2 mt-2"
                >
                  <span>{loading ? (lang === 'hi' ? 'सहेज रहे हैं...' : 'Saving...') : (lang === 'hi' ? 'पासवर्ड बदलें (Reset Password)' : 'Reset Password')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* ============================================================= */}
          {/* MODE: FORGOT PASSWORD - SUCCESS CONFIRMATION                  */}
          {/* ============================================================= */}
          {mode === 'forgot_success' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  {lang === 'hi' ? 'पासवर्ड सफलतापूर्वक बदल गया!' : 'Password Reset Successfully!'}
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  {lang === 'hi' 
                    ? 'आपका खाता सुरक्षित है और सभी खेत व फसल डेटा सुरक्षित हैं। अब आप नए पासवर्ड से लॉगिन कर सकते हैं।'
                    : 'Your account and all farm/mapping records are intact. You can now login with your new password.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setSuccessMessage(lang === 'hi' ? 'कृपया नए पासवर्ड से लॉगिन करें।' : 'Please login with your new password.');
                }}
                className="w-full agri-btn-primary py-3 text-sm font-bold shadow-md flex items-center justify-center gap-2"
              >
                <span>{lang === 'hi' ? 'लॉगिन करें' : 'Login Now'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>

      {/* ============================================================= */}
      {/* PUBLIC LANDING PAGE: EXPLAINING FASAL DRISHTI FOR EVERYONE    */}
      {/* ============================================================= */}
      <section id="public-landing-overview" className="mt-14 max-w-5xl mx-auto w-full px-2 sm:px-4 text-slate-100 pb-12">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold tracking-wide uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'उपग्रह से मिट्टी तक — स्मार्ट कृषि क्रांति' : 'Space to Soil — Smart Agriculture'}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            {lang === 'hi' 
              ? 'फ़सल दृष्टि: भारतीय किसानों के लिए कृत्रिम बुद्धिमत्ता (AI) साथी'
              : 'Fasal Drishti: AI-Powered Smart Farming Platform'}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {lang === 'hi'
              ? 'यूरोपीय अंतरिक्ष एजेंसी के सेंटिनल-2 उपग्रह, ऑन-डिवाइस कैमरा विजन, और गूगल जेमिनी एग्रोनॉमी AI का संगम — कम लागत में अधिक उपज और त्वरित रोग उपचार।'
              : 'Combining Copernicus Sentinel-2 satellite telemetry, camera computer vision, and Google Gemini agronomy to maximize yield, optimize water, and diagnose diseases instantly.'}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => handleDemo('farmer')}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg transition flex items-center gap-2 active:scale-95"
            >
              <span>👨‍🌾</span>
              <span>{lang === 'hi' ? 'लाइव किसान डेमो देखें' : 'Try Live Farmer Demo'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            {onNavigateRegister && (
              <button
                type="button"
                onClick={onNavigateRegister}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-emerald-300 font-bold text-xs sm:text-sm shadow-sm transition flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>{lang === 'hi' ? 'नया किसान खाता बनाएं' : 'Register Free Account'}</span>
              </button>
            )}
          </div>
        </div>

        {/* 6 Core Agricultural Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12">
          {/* Pillar 1 */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/40 backdrop-blur-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <Satellite className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">
              {lang === 'hi' ? 'उपग्रह फसल स्वास्थ्य (NDVI Radar)' : 'Satellite Field Monitoring (NDVI)'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {lang === 'hi'
                ? '10-मीटर रिज़ॉल्यूशन के सेंटिनल-2 उपग्रह चित्रों से क्लोरोफिल स्तर और मिट्टी की नमी का सटीक विश्लेषण। फसल में तनाव का पहले से पता लगाएं।'
                : '10m multispectral Sentinel-2 satellite telemetry tracking chlorophyll index, vegetation health, and soil moisture before visible crop wilting.'}
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/40 backdrop-blur-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">
              {lang === 'hi' ? 'GPS खेत सीमांकन (Field Mapping)' : 'GPS Farm Boundary Mapping'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {lang === 'hi'
                ? 'खेत के चारों कोनों पर चलकर या उपग्रह मानचित्र पर बिंदु लगाकर सटीक रकबा (एकड़/हेक्टेयर) नापें। एक ही खाते में एकाधिक खेत प्रबंधित करें।'
                : 'Walk field boundaries with smartphone GPS or tap satellite map to construct accurate polygon geofences with instant acreage & perimeter calculation.'}
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/40 backdrop-blur-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <Scan className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">
              {lang === 'hi' ? 'AI रोग स्कैनर (Disease Diagnosis)' : 'Instant Crop Disease Scanner'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {lang === 'hi'
                ? 'पत्ती की तस्वीर खींचते ही AI द्वारा झुलसा, रतुआ, चूर्णिल आसिता की पहचान। जैविक नीम उपचार और रासायनिक छिड़काव की सही मात्रा प्राप्त करें।'
                : 'Snap a leaf photo with mobile camera for instant diagnostic classification with severity scoring, organic bio-remedies, and pesticide dosages.'}
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/40 backdrop-blur-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">
              {lang === 'hi' ? '24/7 AI कृषि वैज्ञानिक (Swar Advisor)' : '24/7 AI Agronomist (Swar)'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {lang === 'hi'
                ? 'गूगल जेमिनी AI द्वारा संचालित। हिंदी एवं अंग्रेजी में बोलकर या लिखकर सवाल पूछें — सिंचाई, खाद, खरपतवार नियंत्रण की तत्काल वैज्ञानिक सलाह।'
                : 'Powered by Google Gemini. Ask agronomy questions via voice or text in Hindi and English for instant scientific crop management advice.'}
            </p>
          </div>

          {/* Pillar 5 */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/40 backdrop-blur-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">
              {lang === 'hi' ? 'लाइव मंडी भाव (APMC Mandi Rates)' : 'Real-Time APMC Mandi Rates'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {lang === 'hi'
                ? 'गेहूं, धान, टमाटर, प्याज, सोयाबीन, कपास और आलू के दैनिक थोक मंडी भाव। फसल बेचने का सबसे सही समय और स्थान चुनें।'
                : 'Live AGMARKNET wholesale rates across Indian APMCs with price trend indicators, modal prices, and market insights.'}
            </p>
          </div>

          {/* Pillar 6 */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/40 backdrop-blur-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <CloudRain className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">
              {lang === 'hi' ? 'मौसम व सिंचाई सलाह (Agro-Weather)' : 'Weather Forecast & Irrigation'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {lang === 'hi'
                ? '5-दिवसीय वर्षा पूर्वानुमान, छिड़काव अनुकूलता सूचकांक, और खेत की आवश्यकतानुसार सटीक सिंचाई समय निर्धारण।'
                : '5-day precipitation probability, spray suitability index, evapotranspiration rates, and optimal irrigation scheduling.'}
            </p>
          </div>
        </div>

        {/* How Farmers Access Fasal Drishti (3 Simple Steps) */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white/5 border border-white/15 backdrop-blur-md mb-12">
          <h3 className="text-lg sm:text-2xl font-bold text-white text-center mb-6">
            {lang === 'hi' ? 'किसान भाई कैसे उपयोग करें? (3 सरल चरण)' : 'How Indian Farmers Access Fasal Drishti (3 Easy Steps)'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-12 h-12 rounded-full bg-emerald-500/30 text-emerald-300 font-extrabold flex items-center justify-center text-lg mb-3">
                1
              </div>
              <h4 className="font-bold text-white text-sm mb-1">
                {lang === 'hi' ? 'क्रोम ब्राउज़र में खोलें' : 'Open in Google Chrome'}
              </h4>
              <p className="text-xs text-slate-300">
                {lang === 'hi' 
                  ? 'किसी भी स्मार्टफोन में लिंक खोलें। कोई भारी 100MB ऐप इंस्टॉल करने की आवश्यकता नहीं।'
                  : 'Open the HTTPS link on any Android phone or PC in Google Chrome. Zero download required.'}
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-12 h-12 rounded-full bg-emerald-500/30 text-emerald-300 font-extrabold flex items-center justify-center text-lg mb-3">
                2
              </div>
              <h4 className="font-bold text-white text-sm mb-1">
                {lang === 'hi' ? '1-क्लिक डेमो या खाता बनाएं' : '1-Click Demo or Login'}
              </h4>
              <p className="text-xs text-slate-300">
                {lang === 'hi' 
                  ? '"Farmer Demo" पर क्लिक करके तुरंत जांचें या अपने 10-अंकों के मोबाइल नंबर से नया खाता बनाएं।'
                  : 'Click Farmer Demo for immediate exploration, or register with your 10-digit mobile number.'}
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-12 h-12 rounded-full bg-emerald-500/30 text-emerald-300 font-extrabold flex items-center justify-center text-lg mb-3">
                3
              </div>
              <h4 className="font-bold text-white text-sm mb-1">
                {lang === 'hi' ? 'रोग जांचें व खेत नापें' : 'Scan Crops & Map Farm'}
              </h4>
              <p className="text-xs text-slate-300">
                {lang === 'hi' 
                  ? 'पत्तियों की फोटो खींचें, उपग्रह से फसल की सेहत देखें और मंडी के ताजा भाव जानकर लाभ कमाएं।'
                  : 'Capture leaf photos for AI diagnosis, monitor satellite vegetative radar, and check APMC mandi rates.'}
              </p>
            </div>
          </div>
        </div>

        {/* Agricultural FAQ Accordion */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white/5 border border-white/15 backdrop-blur-md mb-10">
          <div className="flex items-center gap-2 mb-6">
            <HelpCircle className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg sm:text-xl font-bold text-white">
              {lang === 'hi' ? 'अक्सर पूछे जाने वाले प्रश्न (FAQ)' : 'Frequently Asked Questions'}
            </h3>
          </div>

          <div className="space-y-3">
            {[
              {
                qHi: 'क्या फ़सल दृष्टि का उपयोग पूर्णतः निःशुल्क है?',
                qEn: 'Is Fasal Drishti completely free for farmers?',
                aHi: 'हाँ! फ़सल दृष्टि भारतीय किसानों के लिए पूर्णतः निःशुल्क उपलब्ध है। उपग्रह विश्लेषण, रोग स्कैनर, और एआई कृषि सलाह के लिए कोई शुल्क नहीं है।',
                aEn: 'Yes! Fasal Drishti is completely free for Indian farmers. All satellite monitoring, disease scanning, and AI agronomy advice are provided at zero cost.'
              },
              {
                qHi: 'उपग्रह (NDVI) विश्लेषण कैसे काम करता है?',
                qEn: 'How does the satellite (NDVI) monitoring work?',
                aHi: 'हम यूरोपीय अंतरिक्ष एजेंसी (ESA) के सेंटिनल-2 उपग्रह के 10-मीटर मल्टीस्पेक्ट्रल डेटा का उपयोग करते हैं जो पत्तियों के क्लोरोफिल और पानी की अवशोषण क्षमता का विश्लेषण कर पौधे के तनाव का समय रहते पता लगाता है।',
                aEn: 'We integrate Sentinel-2 multispectral satellite telemetry (10m resolution) to calculate the Normalized Difference Vegetation Index (NDVI), detecting crop stress days before it becomes visible to the eye.'
              },
              {
                qHi: 'क्या मेरा खेत का डेटा और व्यक्तिगत जानकारी सुरक्षित है?',
                qEn: 'Is my farm and personal data private and secure?',
                aHi: 'हाँ! आपका व्यक्तिगत डेटा, फोन नंबर और खेत की सीमाएं एन्क्रिप्टेड हैं। निजी डैशबोर्ड केवल आपके लॉगिन द्वारा सुरक्षित रहते हैं और कभी सार्वजनिक रूप से साझा नहीं किए जाते।',
                aEn: 'Absolutely. Personal farmer data, mobile numbers, and polygon coordinates are encrypted and protected behind authentication. They are never indexed publicly or sold.'
              },
              {
                qHi: 'किन-किन फसलों के रोगों की पहचान संभव है?',
                qEn: 'Which crops are supported for disease scanning?',
                aHi: 'गेहूं, धान (चावल), टमाटर, आलू, प्याज, सोयाबीन, कपास, सरसों, मक्का, चना, गन्ना और मिर्च सहित सभी प्रमुख भारतीय फसलों के रोगों की पहचान और उपचार उपलब्ध है।',
                aEn: 'Wheat, Paddy (Rice), Tomato, Potato, Onion, Soybean, Cotton, Mustard, Maize, Gram, Sugarcane, and Chilli with organic and chemical treatment plans.'
              }
            ].map((faq, idx) => (
              <div 
                key={idx} 
                className="border border-white/10 rounded-xl overflow-hidden bg-black/20"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full py-3.5 px-4 text-left flex items-center justify-between font-semibold text-xs sm:text-sm text-white hover:bg-white/5 transition"
                >
                  <span>{lang === 'hi' ? faq.qHi : faq.qEn}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-4 text-xs text-slate-300 leading-relaxed border-t border-white/5 pt-3">
                    {lang === 'hi' ? faq.aHi : faq.aEn}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Public Footer */}
        <footer className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <p>
            © 2026 Fasal Drishti (फ़सल दृष्टि) — From Space to Soil. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a 
              href="./privacy-policy.html" 
              className="hover:text-emerald-300 underline transition"
              target="_blank" 
              rel="noreferrer"
            >
              {lang === 'hi' ? 'गोपनीयता नीति (Privacy Policy)' : 'Privacy Policy'}
            </a>
            <span className="text-slate-600">•</span>
            <a 
              href="./sitemap.xml" 
              className="hover:text-emerald-300 underline transition"
              target="_blank" 
              rel="noreferrer"
            >
              Sitemap.xml
            </a>
          </div>
        </footer>
      </section>
    </div>
  );
}
