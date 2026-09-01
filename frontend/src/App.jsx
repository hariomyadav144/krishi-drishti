import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AlertProvider } from './context/AlertContext';

import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';

import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import FarmerDashboard from './pages/FarmerDashboard';
import ScanCrop from './pages/ScanCrop';
import AiAdvisor from './pages/AiAdvisor';
import MandiPrices from './pages/MandiPrices';
import FertilizerCalculator from './pages/FertilizerCalculator';
import SatelliteRadar from './pages/SatelliteRadar';
import GovtSchemes from './pages/GovtSchemes';
import OutbreakRadar from './pages/OutbreakRadar';
import ActionPlansPage from './pages/ActionPlansPage';
import WeatherPage from './pages/WeatherPage';
import AlertsPage from './pages/AlertsPage';
import FarmProfile from './pages/FarmProfile';
import FarmInsights from './pages/FarmInsights';
import ExpertDashboard from './pages/ExpertDashboard';
import AdminDashboard from './pages/AdminDashboard';

function MainApp() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useLanguage();
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [activeTab, setActiveTab] = useState('home');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-sm tracking-wide">Loading KRISHI DRISHTI 2.0...</p>
      </div>
    );
  }

  // If not authenticated, render Login / Register
  if (!isAuthenticated) {
    if (authView === 'register') {
      return (
        <Register
          onNavigateLogin={() => setAuthView('login')}
          onRegistered={() => setActiveTab('home')}
        />
      );
    }
    return (
      <Login
        onNavigateRegister={() => setAuthView('register')}
      />
    );
  }

  // If farmer needs onboarding
  if (user && user.role === 'farmer' && !user.isOnboarded) {
    return <Onboarding onOnboardingComplete={() => setActiveTab('home')} />;
  }

  // Render main application shell
  return (
    <div className="min-h-screen bg-[#F4F7F4] flex flex-col">
      {/* Top Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Desktop Secondary Navigation Bar with all Tools */}
      <div className="hidden md:block bg-white border-b border-slate-200 shadow-2xs sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-1 py-2 overflow-x-auto text-xs font-bold scrollbar-none">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'home'
                  ? 'bg-agri-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>🌾</span>
              <span>{t('nav.home')}</span>
            </button>

            <button
              onClick={() => setActiveTab('diagnose')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'diagnose'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>🔍</span>
              <span>{t('nav.diagnose')}</span>
            </button>

            <button
              onClick={() => setActiveTab('advice')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'advice'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>✨</span>
              <span>{t('nav.advice')}</span>
            </button>

            <button
              onClick={() => setActiveTab('mandi')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'mandi'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100'
              }`}
            >
              <span>📈</span>
              <span>{t('nav.mandi')}</span>
            </button>

            <button
              onClick={() => setActiveTab('fertilizer')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'fertilizer'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-teal-800 bg-teal-50/70 hover:bg-teal-100'
              }`}
            >
              <span>🧪</span>
              <span>{t('nav.fertilizer')}</span>
            </button>

            <button
              onClick={() => setActiveTab('satellite')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'satellite'
                  ? 'bg-indigo-700 text-white shadow-xs'
                  : 'text-indigo-800 bg-indigo-50/70 hover:bg-indigo-100'
              }`}
            >
              <span>🛰️</span>
              <span>{t('nav.satellite')}</span>
            </button>

            <button
              onClick={() => setActiveTab('schemes')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'schemes'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'text-amber-800 bg-amber-50/70 hover:bg-amber-100'
              }`}
            >
              <span>🏛️</span>
              <span>{t('nav.schemes')}</span>
            </button>

            <button
              onClick={() => setActiveTab('outbreak')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'outbreak'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'text-rose-800 bg-rose-50/70 hover:bg-rose-100'
              }`}
            >
              <span>🚨</span>
              <span>{t('nav.outbreak')}</span>
            </button>

            <button
              onClick={() => setActiveTab('plans')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'plans'
                  ? 'bg-agri-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>📋</span>
              <span>{t('nav.plans')}</span>
            </button>

            <button
              onClick={() => setActiveTab('weather')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'weather'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>🌤️</span>
              <span>{t('nav.weather')}</span>
            </button>

            <button
              onClick={() => setActiveTab('insights')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'insights'
                  ? 'bg-agri-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>📊</span>
              <span>{t('nav.insights')}</span>
            </button>

            {user?.role === 'expert' && (
              <button
                onClick={() => setActiveTab('expert')}
                className={`px-3 py-1.5 rounded-xl transition font-extrabold ${
                  activeTab === 'expert'
                    ? 'bg-amber-800 text-white shadow-xs'
                    : 'text-amber-900 bg-amber-50 hover:bg-amber-100'
                }`}
              >
                👨‍🔬 Expert
              </button>
            )}

            {user?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-3 py-1.5 rounded-xl transition font-extrabold ${
                  activeTab === 'admin'
                    ? 'bg-purple-800 text-white shadow-xs'
                    : 'text-purple-900 bg-purple-50 hover:bg-purple-100'
                }`}
              >
                ⚙️ Admin
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'home' && <FarmerDashboard setActiveTab={setActiveTab} />}
        {activeTab === 'diagnose' && <ScanCrop setActiveTab={setActiveTab} />}
        {activeTab === 'advice' && <AiAdvisor setActiveTab={setActiveTab} />}
        {activeTab === 'mandi' && <MandiPrices />}
        {activeTab === 'fertilizer' && <FertilizerCalculator />}
        {activeTab === 'satellite' && <SatelliteRadar />}
        {activeTab === 'schemes' && <GovtSchemes />}
        {activeTab === 'outbreak' && <OutbreakRadar />}
        {activeTab === 'plans' && <ActionPlansPage />}
        {activeTab === 'weather' && <WeatherPage />}
        {activeTab === 'alerts' && <AlertsPage />}
        {activeTab === 'profile' && <FarmProfile />}
        {activeTab === 'insights' && <FarmInsights />}
        {activeTab === 'expert' && <ExpertDashboard />}
        {activeTab === 'admin' && <AdminDashboard />}
      </main>

      {/* Mobile Sticky Bottom Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AlertProvider>
          <MainApp />
        </AlertProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
