import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage, availableLanguages } from '../context/LanguageContext';
import { useAlerts } from '../context/AlertContext';
import { Sprout, Bell, Globe, LogOut, UserCheck, Shield, ChevronDown, Check } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();
  const { lang, setLanguage, t } = useLanguage();
  const { unreadCount } = useAlerts();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const currentLangObj = availableLanguages.find(l => l.code === lang) || availableLanguages[0];

  return (
    <header className="sticky top-0 z-40 bg-[#12381F] text-white shadow-md border-b border-agri-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Name */}
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setActiveTab('home')}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-agri-400 flex items-center justify-center shadow-inner text-white">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-white flex items-center gap-1.5">
                  KRISHI DRISHTI
                  <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-1.5 py-0.5 rounded-full border border-emerald-400/40 font-extrabold tracking-wider">
                    2.0 AI
                  </span>
                </span>
              </div>
              <p className="text-[11px] text-agri-200/80 hidden sm:block tracking-wide">
                From Space to Soil • Right Information. Better Decisions.
              </p>
            </div>
          </div>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* 4-Language Dropdown Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1.5 bg-agri-900/80 hover:bg-agri-800 text-agri-100 px-2.5 py-1.5 rounded-xl border border-agri-700/60 text-xs font-bold transition active:scale-95"
                title="Change Language / भाषा चुनें"
              >
                <span>{currentLangObj.icon}</span>
                <span className="hidden sm:inline">{currentLangObj.native}</span>
                <ChevronDown className="w-3 h-3 text-emerald-400" />
              </button>

              {showLangMenu && (
                <div 
                  className="absolute right-0 mt-2 w-40 bg-white rounded-2xl shadow-2xl border border-slate-200 py-1.5 text-slate-800 z-50 text-xs animate-in fade-in slide-in-from-top-2"
                  onClick={() => setShowLangMenu(false)}
                >
                  <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    Select Language
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
                        <span>{l.native} ({l.label})</span>
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
              className="relative p-2 rounded-xl bg-agri-900/80 hover:bg-agri-800 text-agri-100 border border-agri-700/60 transition"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Role & User Menu */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 bg-agri-800/90 hover:bg-agri-800 px-2.5 py-1.5 rounded-xl border border-agri-700/70 text-xs text-left"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white uppercase text-xs">
                    {user.name ? user.name[0] : 'U'}
                  </div>
                  <div className="hidden md:block max-w-[120px] truncate">
                    <p className="font-bold text-white truncate">{user.name}</p>
                    <p className="text-[10px] text-agri-300 capitalize flex items-center gap-1">
                      {user.role === 'farmer' && <UserCheck className="w-2.5 h-2.5" />}
                      {user.role === 'expert' && <Shield className="w-2.5 h-2.5 text-amber-300" />}
                      {user.role === 'admin' && <Shield className="w-2.5 h-2.5 text-purple-300" />}
                      {user.role}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-agri-300" />
                </button>

                {showUserMenu && (
                  <div 
                    className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-slate-200 py-1 text-slate-800 z-50 text-xs animate-in fade-in slide-in-from-top-2"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="font-black text-slate-900 text-xs truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-500">{user.phone}</p>
                      <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {user.role} Mode
                      </span>
                    </div>

                    <button
                      onClick={() => setActiveTab('profile')}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-semibold"
                    >
                      <span>👤</span> {t('nav.profile')}
                    </button>

                    <button
                      onClick={() => setActiveTab('insights')}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-semibold"
                    >
                      <span>📊</span> {t('nav.insights')}
                    </button>

                    {user.role === 'expert' && (
                      <button
                        onClick={() => setActiveTab('expert')}
                        className="w-full text-left px-3 py-2 hover:bg-amber-50 text-amber-900 flex items-center gap-2 font-bold"
                      >
                        <span>👨‍🔬</span> {t('nav.expertPortal')}
                      </button>
                    )}

                    {user.role === 'admin' && (
                      <button
                        onClick={() => setActiveTab('admin')}
                        className="w-full text-left px-3 py-2 hover:bg-purple-50 text-purple-900 flex items-center gap-2 font-bold"
                      >
                        <span>⚙️</span> {t('nav.adminPortal')}
                      </button>
                    )}

                    <div className="border-t border-slate-100 my-1"></div>

                    <button
                      onClick={logout}
                      className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 font-bold"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      {t('nav.logout')}
                    </button>
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
