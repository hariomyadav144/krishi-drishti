import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Sprout, User, Phone, Mail, Lock, ArrowRight } from 'lucide-react';

export default function Register({ onNavigateLogin, onRegistered }) {
  const { register } = useAuth();
  const { lang, toggleLanguage } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    role: 'farmer',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.name || !formData.phone || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    const res = await register(formData);
    setLoading(false);
    if (!res.success) {
      setError(res.message);
    } else {
      if (onRegistered) onRegistered();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0e2a18] via-[#12381F] to-slate-900 flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8 text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        
        <div className="flex justify-end mb-4">
          <button
            onClick={toggleLanguage}
            className="text-xs bg-white/10 hover:bg-white/20 text-agri-100 px-3 py-1 rounded-full border border-white/20 font-medium transition"
          >
            🌐 {lang === 'en' ? 'Switch to हिन्दी' : 'Switch to English'}
          </button>
        </div>

        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-agri-500 to-emerald-400 mx-auto flex items-center justify-center shadow-lg border border-agri-300/30 text-white mb-2">
            <Sprout className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            {lang === 'hi' ? 'कृषि दृष्टि से जुड़ें' : 'Join Krishi Drishti'}
          </h1>
          <p className="text-xs text-agri-200 mt-1">
            {lang === 'hi' ? 'स्मार्ट खेती के लिए मुफ्त पंजीकरण करें' : 'Register for AI-Powered Smart Farming'}
          </p>
        </div>
      </div>

      <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white text-slate-900 py-6 px-6 shadow-2xl rounded-3xl sm:px-8 border border-white/10">
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {lang === 'hi' ? 'पूरा नाम *' : 'Full Name *'}
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Rameshwar Patil"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-agri-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {lang === 'hi' ? 'मोबाइल नंबर *' : 'Mobile Number *'}
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-agri-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {lang === 'hi' ? 'ईमेल (वैकल्पिक)' : 'Email (Optional)'}
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="farmer@example.com"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-agri-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {lang === 'hi' ? 'पासवर्ड *' : 'Password *'}
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-agri-600 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full agri-btn-primary py-3 text-sm font-bold shadow-md mt-4"
            >
              <span>{loading ? 'Creating Account...' : (lang === 'hi' ? 'पंजीकरण पूरा करें' : 'Create Account & Continue')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-xs text-slate-600">
              {lang === 'hi' ? 'पहले से खाता है?' : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={onNavigateLogin}
                className="font-bold text-agri-700 hover:text-agri-800 underline"
              >
                {lang === 'hi' ? 'लॉग इन करें' : 'Login Here'}
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
