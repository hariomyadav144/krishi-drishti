import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage, availableLanguages } from '../context/LanguageContext';
import { useAlerts } from '../context/AlertContext';
import { 
  Sprout, 
  Bell, 
  Globe, 
  LogOut, 
  UserCheck, 
  Shield, 
  ChevronDown, 
  Check, 
  User, 
  Settings, 
  FileText,
  X 
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();
  const { lang, setLanguage, t } = useLanguage();
  const { unreadCount } = useAlerts();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const menuRef = useRef(null);
  const langRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (langRef.current && !langRef.current.contains(event.target)) {
        setShowLangMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const currentLangObj = availableLanguages.find(l => l.code === lang) || availableLanguages[0];

  // Dynamic initial for avatar
  const farmerInitial = user?.name ? user.name.trim()[0].toUpperCase() : 'K';

  return (
    <header className="sticky top-0 z-40 bg-[#12381F] text-white shadow-md border-b border-emerald-900/60 w-full max-w-full pt-safe">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-1 sm:gap-3">
          
          {/* 1. Brand Logo & Name (No '2.0 AI' badge, clean agricultural branding) */}
          <div 
            className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0 select-none py-1"
            onClick={() => setActiveTab('home')}
            title="Fasal Drishti Home"
          >
            <div className="relative flex items-center justify-center shrink-0">
              {!logoFailed && (
                <img
                  src="./logo.png"
                  alt="Fasal Drishti Logo"
                  className={`h-8 w-8 sm:h-10 sm:w-10 object-contain rounded-xl bg-white p-0.5 shadow-sm transition-all duration-300 ${logoLoaded ? 'block' : 'hidden'}`}
                  onLoad={() => setLogoLoaded(true)}
                  onError={() => setLogoFailed(true)}
                />
              )}
              {(!logoLoaded || logoFailed) && (
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-agri-600 flex items-center justify-center shadow-inner text-white">
                  <Sprout className="w-5 h-5" />
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center">
              <span className="font-extrabold text-sm sm:text-lg tracking-tight text-white leading-tight">
                FASAL DRISHTI
              </span>
              <p className="text-[10px] text-emerald-200/90 hidden sm:block tracking-wide leading-tight">
                {t('appTagline', 'From Space to Soil')}
              </p>
            </div>
          </div>

          {/* 2. Responsive Action Controls & Profile Avatar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

            {/* Multilingual 12-Language Dropdown Switcher */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => {
                  setShowLangMenu(!showLangMenu);
                  setShowUserMenu(false);
                }}
                className="flex items-center gap-1 bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-100 px-2 py-1.5 rounded-xl border border-emerald-700/50 text-xs font-semibold transition active:scale-95"
                title={t('nav.selectLanguage') || "Change Language / भाषा चुनें"}
              >
                <span className="text-xs">{currentLangObj.icon}</span>
                <span className="text-[11px] font-bold max-w-[48px] sm:max-w-[70px] truncate">
                  {currentLangObj.native}
                </span>
                <ChevronDown className="w-3 h-3 text-emerald-400" />
              </button>

              {showLangMenu && (
                <div 
                  className="absolute right-0 mt-2 w-56 max-h-80 overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200 py-1.5 text-slate-800 z-50 text-xs animate-in fade-in slide-in-from-top-2"
                  onClick={() => setShowLangMenu(false)}
                >
                  <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between">
                    <span>{t('nav.selectLanguage') || 'Select Language'}</span>
                    <Globe className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  {availableLanguages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => setLanguage(l.code)}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between transition ${
                        lang === l.code
                          ? 'bg-emerald-50 text-emerald-900 font-black'
                          : 'hover:bg-slate-50 text-slate-700 font-semibold'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{l.icon}</span>
                        <span>{l.native} <span className="text-[10px] text-slate-400 font-normal">({l.label})</span></span>
                      </span>
                      {lang === l.code && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications Bell */}
            <button
              onClick={() => setActiveTab('alerts')}
              className="relative p-2 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-100 border border-emerald-700/50 transition active:scale-95"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* 3. Farmer Profile Avatar [ H ] -> Professional Redesign */}
            {user && (
              <div className="relative" ref={menuRef}>
                <button
                  id="nav-btn-profile-avatar"
                  onClick={() => {
                    setShowUserMenu(!showUserMenu);
                    setShowLangMenu(false);
                  }}
                  className="flex items-center justify-center p-0.5 rounded-full hover:ring-2 hover:ring-emerald-400 transition active:scale-95 focus:outline-none"
                  title="Farmer Profile Menu"
                >
                  {user.photo ? (
                    <img 
                      src={user.photo} 
                      alt={user.name || 'Farmer'} 
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-emerald-400 shadow-sm"
                    />
                  ) : (
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center font-black text-white text-xs sm:text-sm uppercase shadow-sm border border-emerald-300/70">
                      {farmerInitial}
                    </div>
                  )}
                </button>

                {/* Professional Dropdown Profile Menu */}
                {showUserMenu && (
                  <div 
                    className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 text-slate-800 z-50 text-xs animate-in fade-in slide-in-from-top-2"
                  >
                    {/* User Identity Card Header */}
                    <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-emerald-50/70 to-teal-50/50 rounded-t-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-extrabold text-base flex items-center justify-center shadow-xs border border-emerald-400">
                          {farmerInitial}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-extrabold text-slate-900 text-sm truncate">
                            {user.name || (lang === 'hi' ? 'किसान भाई' : 'Farmer')}
                          </p>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {user.phone ? `+91 ${user.phone}` : ''}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                              {user.role === 'farmer' ? (lang === 'hi' ? '🌾 पंजीकृत किसान' : '🌾 Farmer') : user.role}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Menu Options */}
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setActiveTab('profile');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-emerald-50/60 flex items-center gap-3 text-slate-700 font-bold transition"
                      >
                        <User className="w-4 h-4 text-emerald-700" />
                        <span>{lang === 'hi' ? 'खेत एवं किसान प्रोफाइल' : 'Farmer Profile'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('insights');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-emerald-50/60 flex items-center gap-3 text-slate-700 font-bold transition"
                      >
                        <FileText className="w-4 h-4 text-teal-700" />
                        <span>{lang === 'hi' ? 'कृषि आंकड़े व रिपोर्ट' : 'Farm Insights & Account'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          setShowLangMenu(true);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-emerald-50/60 flex items-center gap-3 text-slate-700 font-bold transition"
                      >
                        <Globe className="w-4 h-4 text-sky-700" />
                        <span>{lang === 'hi' ? 'भाषा बदलें (Language)' : 'Change Language'}</span>
                      </button>

                      {user.role === 'expert' && (
                        <button
                          onClick={() => {
                            setActiveTab('expert');
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-amber-50 flex items-center gap-3 text-amber-900 font-bold transition"
                        >
                          <Shield className="w-4 h-4 text-amber-600" />
                          <span>{t('nav.expertPortal') || 'Expert Portal'}</span>
                        </button>
                      )}

                      {user.role === 'admin' && (
                        <button
                          onClick={() => {
                            setActiveTab('admin');
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-purple-50 flex items-center gap-3 text-purple-900 font-bold transition"
                        >
                          <Settings className="w-4 h-4 text-purple-600" />
                          <span>{t('nav.adminPortal') || 'Admin Dashboard'}</span>
                        </button>
                      )}
                    </div>

                    <div className="border-t border-slate-100 my-1"></div>

                    {/* Logout Option */}
                    <div className="px-2 pt-1 pb-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-red-50 text-red-600 flex items-center gap-2.5 font-bold transition"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        <span>{t('nav.logout') || (lang === 'hi' ? 'लॉग आउट' : 'Logout')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}
