import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAlerts } from '../context/AlertContext';
import { 
  Home, 
  ScanLine, 
  Sparkles, 
  TrendingUp, 
  Layers, 
  CheckSquare, 
  Calculator, 
  Satellite, 
  Building2, 
  ShieldAlert, 
  CloudSun, 
  Bell, 
  User, 
  X 
} from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const { t } = useLanguage();
  const { unreadCount } = useAlerts();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const mainNavItems = [
    {
      id: 'home',
      label: t('nav.home'),
      icon: Home,
    },
    {
      id: 'mandi',
      label: t('nav.mandi'),
      icon: TrendingUp,
    },
    {
      id: 'diagnose',
      label: t('nav.diagnose'),
      icon: ScanLine,
      isPrimaryAction: true,
    },
    {
      id: 'advice',
      label: t('nav.advice'),
      icon: Sparkles,
    },
    {
      id: 'more',
      label: 'Tools & More',
      icon: Layers,
      isMoreTrigger: true,
      badge: unreadCount
    }
  ];

  const moreTools = [
    { id: 'fertilizer', label: t('nav.fertilizer'), icon: Calculator, color: 'text-teal-600 bg-teal-50' },
    { id: 'satellite', label: t('nav.satellite'), icon: Satellite, color: 'text-indigo-600 bg-indigo-50' },
    { id: 'schemes', label: t('nav.schemes'), icon: Building2, color: 'text-amber-600 bg-amber-50' },
    { id: 'outbreak', label: t('nav.outbreak'), icon: ShieldAlert, color: 'text-rose-600 bg-rose-50' },
    { id: 'plans', label: t('nav.plans'), icon: CheckSquare, color: 'text-emerald-600 bg-emerald-50' },
    { id: 'weather', label: t('nav.weather'), icon: CloudSun, color: 'text-sky-600 bg-sky-50' },
    { id: 'alerts', label: t('nav.alerts'), icon: Bell, color: 'text-purple-600 bg-purple-50', badge: unreadCount },
    { id: 'profile', label: t('nav.profile'), icon: User, color: 'text-slate-600 bg-slate-100' }
  ];

  return (
    <>
      {/* More Tools Modal Drawer for Mobile */}
      {showMoreMenu && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center md:hidden animate-in fade-in"
          onClick={() => setShowMoreMenu(false)}
        >
          <div 
            className="w-full bg-white rounded-t-3xl p-5 space-y-4 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-lg">🌾</span>
                <h3 className="font-black text-sm text-slate-900">Krishi Drishti Power Tools</h3>
              </div>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {moreTools.map((tool) => {
                const Icon = tool.icon;
                const isSelected = activeTab === tool.id;

                return (
                  <button
                    key={tool.id}
                    onClick={() => {
                      setActiveTab(tool.id);
                      setShowMoreMenu(false);
                    }}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition ${
                      isSelected
                        ? 'bg-agri-50 border-agri-500 ring-2 ring-agri-200'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tool.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-slate-900 block truncate">{tool.label}</span>
                      {tool.badge > 0 && (
                        <span className="text-[10px] bg-red-500 text-white font-bold px-1.5 py-0.2 rounded-full">
                          {tool.badge} new
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Sticky Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-nav pb-safe md:hidden">
        <div className="flex items-center justify-around h-16 px-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id || (item.isMoreTrigger && moreTools.some(t => t.id === activeTab));

            if (item.isPrimaryAction) {
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className="flex flex-col items-center justify-center -mt-6 group focus:outline-none"
                >
                  <div className={`w-13 h-13 rounded-full flex items-center justify-center shadow-lg border-2 border-white transition-all transform group-active:scale-90 ${
                    isActive 
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' 
                      : 'bg-gradient-to-tr from-emerald-600 to-agri-600 text-white'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`text-[10px] font-bold mt-1 ${isActive ? 'text-emerald-700' : 'text-slate-600'}`}>
                    {item.label}
                  </span>
                </button>
              );
            }

            if (item.isMoreTrigger) {
              return (
                <button
                  key={item.id}
                  onClick={() => setShowMoreMenu(true)}
                  className={`flex flex-col items-center justify-center flex-1 h-full py-1 relative transition-colors ${
                    isActive ? 'text-agri-700 font-bold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <div className="relative">
                    <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                    {item.badge > 0 && (
                      <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-extrabold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] mt-1 tracking-tight truncate max-w-[54px]">
                    More
                  </span>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 relative transition-colors ${
                  isActive ? 'text-agri-700 font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                </div>
                <span className="text-[10px] mt-1 tracking-tight truncate max-w-[54px]">
                  {item.label}
                </span>
                {isActive && (
                  <div className="w-4 h-0.5 bg-agri-600 rounded-full mt-0.5 animate-in fade-in"></div>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
