import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Sprout, Phone, Lock, ArrowRight, UserCheck, ShieldCheck, Sparkles } from 'lucide-react';

export default function Login({ onNavigateRegister }) {
  const { login, demoLogin } = useAuth();
  const { t, lang, toggleLanguage } = useLanguage();
  const [phone, setPhone] = useState('9876543210');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await login(phone, password);
    setLoading(false);
    if (!res.success) {
      setError(res.message);
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
        
        {/* Language switch at top right */}
        <div className="flex justify-end mb-4">
          <button
            onClick={toggleLanguage}
            className="text-xs bg-white/10 hover:bg-white/20 text-agri-100 px-3 py-1 rounded-full border border-white/20 font-medium transition"
          >
            🌐 {lang === 'en' ? 'Switch to हिन्दी' : 'Switch to English'}
          </button>
        </div>

        {/* Brand Header */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-agri-500 to-emerald-400 mx-auto flex items-center justify-center shadow-lg border border-agri-300/30 text-white mb-3">
            <Sprout className="w-9 h-9" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            KRISHI DRISHTI
          </h1>
          <p className="text-xs text-agri-300 font-semibold uppercase tracking-widest mt-0.5">
            AI for Smarter Farming
          </p>
          <p className="text-xs text-agri-100/70 mt-2 max-w-xs mx-auto">
            “From Space to Soil – Right Information. Better Decisions. Higher Yield.”
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white text-slate-900 py-6 px-6 shadow-2xl rounded-3xl sm:px-8 border border-white/10">
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {lang === 'hi' ? 'मोबाइल नंबर' : 'Mobile Number'}
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-agri-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {lang === 'hi' ? 'पासवर्ड' : 'Password'}
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-agri-600 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full agri-btn-primary py-3 text-sm font-bold shadow-md mt-2"
            >
              <span>{loading ? 'Logging in...' : (lang === 'hi' ? 'लॉग इन करें' : 'Login to Krishi Drishti')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick 1-Click Demo Login Personas */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center mb-3">
              ⚡ Instant 1-Click Demo Personas:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemo('farmer')}
                className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-center transition flex flex-col items-center gap-1 text-[11px] font-bold active:scale-95"
              >
                <span>👨‍🌾</span>
                <span>Farmer Demo</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemo('expert')}
                className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-center transition flex flex-col items-center gap-1 text-[11px] font-bold active:scale-95"
              >
                <span>👨‍🔬</span>
                <span>Expert Demo</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemo('admin')}
                className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 text-center transition flex flex-col items-center gap-1 text-[11px] font-bold active:scale-95"
              >
                <span>⚙️</span>
                <span>Admin Demo</span>
              </button>
            </div>
          </div>

          <div className="mt-5 text-center">
            <p className="text-xs text-slate-600">
              {lang === 'hi' ? 'नया खाता बनाना चाहते हैं?' : "Don't have an account yet?"}{' '}
              <button
                type="button"
                onClick={onNavigateRegister}
                className="font-bold text-agri-700 hover:text-agri-800 underline"
              >
                {lang === 'hi' ? 'पंजीकरण करें (Register)' : 'Register Here'}
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
