import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  Smartphone, 
  Monitor, 
  Maximize2, 
  Minimize2, 
  Users, 
  Sparkles, 
  ChevronDown, 
  Globe, 
  ExternalLink,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';

export default function PresentationToolbar({ 
  viewMode, 
  setViewMode, 
  isFullscreen, 
  toggleFullscreen 
}) {
  const { user, demoLogin } = useAuth();
  const { lang, setLanguage, t } = useLanguage();
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [isBarVisible, setIsBarVisible] = useState(true);
  const [switchingRole, setSwitchingRole] = useState(false);

  const handleRoleSwitch = async (role) => {
    setSwitchingRole(true);
    setShowPersonaMenu(false);
    await demoLogin(role);
    setSwitchingRole(false);
  };

  if (!isBarVisible) {
    return (
      <button
        onClick={() => setIsBarVisible(true)}
        className="hidden md:flex fixed top-2 left-2 z-50 bg-slate-900/90 hover:bg-slate-900 text-emerald-400 border border-emerald-500/40 px-2.5 py-1.5 rounded-xl text-xs font-bold shadow-2xl items-center gap-1.5 transition-all backdrop-blur-md opacity-75 hover:opacity-100"
        title="Show VIP Presentation Toolbar"
      >
        <span>🏛️</span>
        <span>VIP Toolbar</span>
        <Eye className="w-3.5 h-3.5" />
      </button>
    );
  }

  return (
    <div className="hidden md:block bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white border-b border-emerald-500/30 px-3 py-1.5 sticky top-0 z-50 shadow-xl backdrop-blur-md select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
        
        {/* Left: VIP Presentation Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-lg font-black tracking-wide text-[11px]">
            <span className="animate-pulse">🟢</span>
            <span>VIP LIVE DEMO</span>
          </div>
          <span className="text-slate-300 font-bold hidden lg:inline text-[11px]">
            {lang === 'hi' ? 'माननीय सांसद / विधायक महोदय निरीक्षण' : 'High-Level Dignitary Presentation Mode'}
          </span>
        </div>

        {/* Center: View Mode Toggle (Phone Mockup vs Full Desktop) */}
        <div className="flex items-center bg-slate-800/80 p-0.5 rounded-xl border border-slate-700/80 shadow-inner">
          <button
            id="btn-view-phone"
            onClick={() => setViewMode('phone')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-[11px] transition-all ${
              viewMode === 'phone'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
            title="Display as Realistic Smartphone Mockup on Big Screen"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? '📱 फ़ोन दृश्य (Mobile App)' : '📱 Phone View'}</span>
          </button>

          <button
            id="btn-view-desktop"
            onClick={() => setViewMode('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-[11px] transition-all ${
              viewMode === 'desktop'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
            title="Display Full-Width Responsive Dashboard"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? '🖥️ डेस्कटॉप दृश्य (Full Screen)' : '🖥️ Desktop View'}</span>
          </button>
        </div>

        {/* Right: Quick Persona Switcher, Language & Fullscreen */}
        <div className="flex items-center gap-2">
          
          {/* Quick Persona Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowPersonaMenu(!showPersonaMenu)}
              disabled={switchingRole}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-lg font-semibold text-[11px] transition"
              title="Switch Persona Demo"
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {user?.role === 'expert' ? '👨‍🔬 Scientist' : user?.role === 'admin' ? '🏛️ Admin' : '👨‍🌾 Farmer'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showPersonaMenu && (
              <div 
                className="absolute right-0 top-full mt-1.5 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  {lang === 'hi' ? 'डेमो प्रोफाइल चुनें' : 'Select Demo Persona'}
                </div>
                
                <button
                  onClick={() => handleRoleSwitch('farmer')}
                  className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between hover:bg-slate-800 transition ${
                    user?.role === 'farmer' ? 'text-emerald-400 font-bold bg-emerald-950/40' : 'text-slate-300'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-bold">👨‍🌾 Rameshwar Patil</span>
                    <span className="text-[10px] text-slate-400">Farmer • Nashik Tomato & Wheat</span>
                  </div>
                  {user?.role === 'farmer' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                </button>

                <button
                  onClick={() => handleRoleSwitch('expert')}
                  className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between hover:bg-slate-800 transition ${
                    user?.role === 'expert' ? 'text-emerald-400 font-bold bg-emerald-950/40' : 'text-slate-300'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-bold">👨‍🔬 Dr. Ananya Sharma</span>
                    <span className="text-[10px] text-slate-400">KVK Agronomist • Scientist</span>
                  </div>
                  {user?.role === 'expert' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                </button>

                <button
                  onClick={() => handleRoleSwitch('admin')}
                  className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between hover:bg-slate-800 transition ${
                    user?.role === 'admin' ? 'text-emerald-400 font-bold bg-emerald-950/40' : 'text-slate-300'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-bold">🏛️ District Agriculture Dept</span>
                    <span className="text-[10px] text-slate-400">Admin Control & District Analytics</span>
                  </div>
                  {user?.role === 'admin' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                </button>
              </div>
            )}
          </div>

          {/* Quick Hindi/English Switcher */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => setLanguage('hi')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                lang === 'hi' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                lang === 'en' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
          </div>

          {/* 1-Click WhatsApp Share Button */}
          <a
            id="btn-whatsapp-share"
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
              `🌾 *फ़सल दृष्टि (FASAL DRISHTI)*\n_स्मार्ट खेती के लिए AI साथी • अंतरिक्ष से मिट्टी तक_\n\nमाननीय महोदय, फ़सल दृष्टि का लाइव मोबाइल व वेब एप्लिकेशन लिंक देखें:\n👉 https://hariomyadav144.github.io/krishi-drishti/\n\n✨ मुख्य सुविधाएं:\n• 📸 AI फसल रोग पहचान व दवा उपचार\n• 📈 लाइव APMC मंडी भाव\n• 🛰️ उपग्रह Sentinel-2 फसल स्वास्थ्य व नमी रडार\n• 🎙️ स्वर (SWAR) बोलकर सवाल पूछने वाला AI सहायक`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white px-2.5 py-1 rounded-lg font-bold text-[11px] shadow-sm transition active:scale-95"
            title="Share via WhatsApp"
          >
            <span>💬</span>
            <span className="hidden sm:inline">WhatsApp</span>
          </a>

          {/* Fullscreen Toggle (F11 Presentation) */}
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 p-1.5 rounded-lg transition"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen Presentation Mode'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Hide Toolbar Button */}
          <button
            onClick={() => setIsBarVisible(false)}
            className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded transition"
            title="Hide Toolbar"
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>

        </div>
      </div>
    </div>
  );
}
