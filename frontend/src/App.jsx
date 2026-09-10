import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AlertProvider } from './context/AlertContext';

import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import TabErrorBoundary from './components/TabErrorBoundary';

// Keep critical initial path components statically loaded
import Login from './pages/Login';
import FarmerDashboard from './pages/FarmerDashboard';

// Lazy-load secondary tabs to minimize initial bundle size and ensure instant opening
const Register = lazy(() => import('./pages/Register'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const ScanCrop = lazy(() => import('./pages/ScanCrop'));
const AiAdvisor = lazy(() => import('./pages/AiAdvisor'));
const MandiPrices = lazy(() => import('./pages/MandiPrices'));
const FertilizerCalculator = lazy(() => import('./pages/FertilizerCalculator'));
const SatelliteRadar = lazy(() => import('./pages/SatelliteRadar'));
const GovtSchemes = lazy(() => import('./pages/GovtSchemes'));
const OutbreakRadar = lazy(() => import('./pages/OutbreakRadar'));
const ActionPlansPage = lazy(() => import('./pages/ActionPlansPage'));
const WeatherPage = lazy(() => import('./pages/WeatherPage'));
const AlertsPage = lazy(() => import('./pages/AlertsPage'));
const FarmProfile = lazy(() => import('./pages/FarmProfile'));
const FarmInsights = lazy(() => import('./pages/FarmInsights'));
const ExpertDashboard = lazy(() => import('./pages/ExpertDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

const VALID_TABS = [
  'home', 'diagnose', 'advice', 'mandi', 'fertilizer', 
  'satellite', 'schemes', 'outbreak', 'plans', 'weather', 
  'alerts', 'profile', 'insights', 'expert', 'admin'
];

function getTabFromHash() {
  if (typeof window === 'undefined') return 'home';
  const raw = window.location.hash.replace(/^#\/?/, '').split('?')[0].trim().toLowerCase();
  return VALID_TABS.includes(raw) ? raw : 'home';
}

function TabLoadingSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4 animate-pulse">
      <div className="h-16 bg-slate-200/80 rounded-2xl"></div>
      <div className="h-44 bg-slate-200/80 rounded-3xl"></div>
      <div className="h-32 bg-slate-200/80 rounded-2xl"></div>
    </div>
  );
}

function MainApp() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useLanguage();
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [activeTab, setActiveTabState] = useState(() => getTabFromHash());

  const setActiveTab = useCallback((tab) => {
    setActiveTabState(tab);
    if (window.location.hash !== `#/${tab}`) {
      window.location.hash = `#/${tab}`;
    }
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const tab = getTabFromHash();
      setActiveTabState(tab);
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);

    // Initial hash sync if empty
    if (!window.location.hash || window.location.hash === '#' || window.location.hash === '#/') {
      window.location.hash = '#/home';
    }

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="font-bold text-xs tracking-wider uppercase text-emerald-400">Loading KRISHI DRISHTI...</p>
      </div>
    );
  }

  // If not authenticated, render Login / Register
  if (!isAuthenticated) {
    if (authView === 'register') {
      return (
        <Suspense fallback={<TabLoadingSkeleton />}>
          <Register
            onNavigateLogin={() => setAuthView('login')}
            onRegistered={() => setActiveTab('home')}
          />
        </Suspense>
      );
    }
    return (
      <Login
        onNavigateRegister={() => setAuthView('register')}
      />
    );
  }

  // If authenticated but needs onboarding
  if (user && !user.isOnboarded && activeTab !== 'onboarding') {
    return (
      <Suspense fallback={<TabLoadingSkeleton />}>
        <Onboarding onComplete={() => setActiveTab('home')} />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Horizontal Quick Shortcut Strip for Tablets/Desktops */}
      <div className="hidden sm:block bg-white border-b border-slate-200 py-2 px-4 shadow-xs sticky top-16 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto gap-2 text-xs font-bold scrollbar-none">
          <div className="flex items-center gap-1.5 flex-nowrap">
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
        <TabErrorBoundary tabKey={activeTab} onNavigateHome={() => setActiveTab('home')}>
          <Suspense fallback={<TabLoadingSkeleton />}>
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
          </Suspense>
        </TabErrorBoundary>
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
