import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AlertProvider } from './context/AlertContext';
import { SwarProvider } from './context/SwarContext';

import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import TabErrorBoundary from './components/TabErrorBoundary';
import SwarAssistant from './components/SwarAssistant';
import LanguageSelectionModal from './components/LanguageSelectionModal';
import PresentationToolbar from './components/PresentationToolbar';
import PhoneFrameContainer from './components/PhoneFrameContainer';

// Keep critical initial path components statically loaded
import Login from './pages/Login';
import FarmerDashboard from './pages/FarmerDashboard';

// Lazy-load secondary tabs to minimize initial bundle size and ensure instant opening
const Register = lazy(() => import('./pages/Register'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const FieldMappingPage = lazy(() => import('./pages/FieldMappingPage'));
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
const CropHistory = lazy(() => import('./pages/CropHistory'));
const FieldMonitoringPage = lazy(() => import('./pages/FieldMonitoringPage'));

const VALID_TABS = [
  'home', 'field-monitoring', 'monitoring', 'field-mapping', 'mapping', 'diagnose', 'history', 'advice', 'mandi', 'fertilizer', 
  'satellite', 'schemes', 'outbreak', 'plans', 'weather', 
  'alerts', 'profile', 'insights', 'expert', 'admin'
];

function getTabFromHash() {
  if (typeof window === 'undefined') return 'home';
  const raw = window.location.hash.replace(/^#\/?/, '').split('?')[0].trim().toLowerCase();
  if (raw === 'monitoring') return 'field-monitoring';
  if (raw === 'mapping') return 'field-mapping';
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

  // VIP Presentation View Mode: 'phone' (realistic smartphone mockup) | 'desktop' (wide screen dashboard)
  const [viewMode, setViewModeState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('krishi_view_mode');
      if (saved === 'phone' || saved === 'desktop') return saved;
      // Default to phone mockup so on large laptop/projector screens it presents the mobile app immediately!
      return 'phone';
    }
    return 'phone';
  });

  const setViewMode = useCallback((mode) => {
    setViewModeState(mode);
    try {
      localStorage.setItem('krishi_view_mode', mode);
    } catch (_) {}
  }, []);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

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

  const [loadDelayWarning, setLoadDelayWarning] = useState(false);
  useEffect(() => {
    let timer;
    if (isLoading) {
      timer = setTimeout(() => setLoadDelayWarning(true), 3000);
    } else {
      setLoadDelayWarning(false);
    }
    return () => clearTimeout(timer);
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white px-4 text-center">
        <div className="w-12 h-12 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-sm tracking-wider uppercase text-emerald-400 mb-1">Loading FASAL DRISHTI...</p>
        <p className="text-xs text-slate-400 mb-2">फ़सल दृष्टि प्रारंभ हो रही है</p>
        {loadDelayWarning && (
          <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10 max-w-xs">
            <p className="text-xs text-slate-300 mb-3">
              Fasal Drishti is taking longer than expected.<br />
              <span className="text-[11px] text-slate-400">लोड होने में अधिक समय लग रहा है।</span>
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-3 rounded-xl transition"
              >
                🔄 Retry / पुनः प्रयास करें
              </button>
              <button
                onClick={() => {
                  try {
                    localStorage.setItem('krishi_demo_role', 'farmer');
                    localStorage.setItem('krishi_token', 'krishi_demo_jwt_token_farmer_2026');
                  } catch (_) {}
                  window.location.hash = '#/home';
                  window.location.reload();
                }}
                className="w-full bg-white/10 hover:bg-white/20 text-emerald-300 font-semibold text-xs py-2 px-3 rounded-xl transition"
              >
                📶 Continue Offline / ऑफलाइन चलाएं
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // If not authenticated, render Login / Register
  if (!isAuthenticated) {
    const authContent = authView === 'register' ? (
      <Suspense fallback={<TabLoadingSkeleton />}>
        <Register
          onNavigateLogin={() => setAuthView('login')}
          onRegistered={() => setActiveTab('home')}
        />
      </Suspense>
    ) : (
      <Login
        onNavigateRegister={() => setAuthView('register')}
      />
    );

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col font-sans w-full max-w-full overflow-x-hidden relative">
        <PresentationToolbar 
          viewMode={viewMode} 
          setViewMode={setViewMode} 
          isFullscreen={isFullscreen} 
          toggleFullscreen={toggleFullscreen} 
        />
        <PhoneFrameContainer viewMode={viewMode}>
          {authContent}
        </PhoneFrameContainer>
      </div>
    );
  }

  // If authenticated but needs onboarding
  if (user && !user.isOnboarded && activeTab !== 'onboarding') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col font-sans w-full max-w-full overflow-x-hidden relative">
        <PresentationToolbar 
          viewMode={viewMode} 
          setViewMode={setViewMode} 
          isFullscreen={isFullscreen} 
          toggleFullscreen={toggleFullscreen} 
        />
        <PhoneFrameContainer viewMode={viewMode}>
          <Suspense fallback={<TabLoadingSkeleton />}>
            <Onboarding onComplete={() => setActiveTab('home')} />
          </Suspense>
        </PhoneFrameContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans w-full max-w-full overflow-x-hidden relative">
      <PresentationToolbar 
        viewMode={viewMode} 
        setViewMode={setViewMode} 
        isFullscreen={isFullscreen} 
        toggleFullscreen={toggleFullscreen} 
      />

      <PhoneFrameContainer viewMode={viewMode}>
        <div className={`flex flex-col font-sans w-full max-w-full relative ${viewMode === 'phone' ? 'min-h-full bg-[#F4F7F4]' : 'min-h-screen bg-[#F4F7F4]'}`}>
          <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Horizontal Quick Shortcut Strip for Tablets/Desktops (Only in full desktop mode) */}
          {viewMode === 'desktop' && (
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
              id="nav-btn-field-monitoring"
              onClick={() => setActiveTab('field-monitoring')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'field-monitoring' || activeTab === 'monitoring'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-emerald-900 bg-emerald-50/70 hover:bg-emerald-100'
              }`}
            >
              <span>🛰️</span>
              <span>{t('nav.fieldMonitoring') || 'Field Monitoring'}</span>
            </button>

            <button
              id="nav-btn-field-mapping"
              onClick={() => setActiveTab('field-mapping')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'field-mapping' || activeTab === 'mapping'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-emerald-900 bg-emerald-50/70 hover:bg-emerald-100'
              }`}
            >
              <span>🗺️</span>
              <span>{t('nav.fieldMapping') || 'Field Mapping'}</span>
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
              id="nav-btn-crop-history"
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-teal-900 bg-teal-50/70 hover:bg-teal-100'
              }`}
            >
              <span>📜</span>
              <span>{t('nav.history') || 'Crop History'}</span>
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
    )}

          {/* Main Content Area */}
          <main className={`flex-1 w-full max-w-full overflow-x-hidden ${viewMode === 'phone' ? 'pb-20' : 'pb-16'}`}>
            <TabErrorBoundary tabKey={activeTab} onNavigateHome={() => setActiveTab('home')}>
              <Suspense fallback={<TabLoadingSkeleton />}>
                {activeTab === 'home' && <FarmerDashboard setActiveTab={setActiveTab} />}
                {(activeTab === 'field-monitoring' || activeTab === 'monitoring') && (
                  <FieldMonitoringPage setActiveTab={setActiveTab} />
                )}
                {(activeTab === 'field-mapping' || activeTab === 'mapping') && (
                  <FieldMappingPage setActiveTab={setActiveTab} />
                )}
                {activeTab === 'diagnose' && <ScanCrop setActiveTab={setActiveTab} />}
                {activeTab === 'history' && <CropHistory setActiveTab={setActiveTab} />}
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

          {/* Bottom Navigation */}
          <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} isPhoneFrame={viewMode === 'phone'} />

          {/* Global Floating SWAR AI & Voice Assistant */}
          <SwarAssistant isPhoneFrame={viewMode === 'phone'} />

          {/* First Launch Language Selector Modal */}
          <LanguageSelectionModal
            isOpen={!localStorage.getItem('krishi_lang_selected_once')}
            onClose={() => localStorage.setItem('krishi_lang_selected_once', 'true')}
          />
        </div>
      </PhoneFrameContainer>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AlertProvider>
          <SwarProvider>
            <MainApp />
          </SwarProvider>
        </AlertProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
