import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Phone, Lock, ArrowRight, UserPlus, KeyRound, ShieldCheck, CheckCircle2, RotateCcw, ArrowLeft } from 'lucide-react';
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
    </div>
  );
}
