import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, Signal, Sparkles, Smartphone, ShieldCheck } from 'lucide-react';

export default function PhoneFrameContainer({ viewMode, children }) {
  const [timeStr, setTimeStr] = useState('09:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // On standard mobile viewports or when desktop full view is chosen, render normally
  if (viewMode === 'desktop') {
    return (
      <div className="w-full min-h-screen">
        {children}
      </div>
    );
  }

  // Realistic Smartphone Device Frame (Displayed on tablet & desktop screens)
  return (
    <div className="min-h-[calc(100vh-42px)] bg-gradient-to-b from-[#091f11] via-[#0d2a17] to-slate-950 flex flex-col items-center justify-center p-2 sm:p-4 relative overflow-hidden select-none">
      
      {/* Ambient background glow & watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Presentation Header above phone */}
      <div className="text-center mb-3 hidden sm:flex flex-col items-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-emerald-400/30 text-emerald-300 text-[11px] font-bold shadow-lg mb-1">
          <Smartphone className="w-3.5 h-3.5" />
          <span>FASAL DRISHTI • OFFICIAL SMARTPHONE EDITION</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
        </div>
        <p className="text-xs text-slate-300 font-medium">
          किसान भाइयों के मोबाइल में चलने वाला लाइव ऐप (Live Native Application Experience)
        </p>
      </div>

      {/* Smartphone Chassis */}
      <div className="relative w-full max-w-[430px] h-[88vh] max-h-[890px] min-h-[640px] bg-slate-950 rounded-[48px] border-[10px] border-slate-900 ring-2 ring-emerald-500/20 shadow-[0_25px_60px_-10px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden">
        
        {/* Simulated Top Status Bar with Dynamic Island */}
        <div className="h-10 bg-[#12381F] text-white px-6 flex items-center justify-between text-xs font-semibold shrink-0 z-50 select-none">
          {/* Left: Clock */}
          <span className="text-[12px] font-bold tracking-tight text-white/95">
            {timeStr}
          </span>

          {/* Center: Dynamic Island */}
          <div className="w-24 h-4.5 bg-black rounded-full flex items-center justify-end px-2 gap-1.5 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="w-2 h-2 rounded-full bg-slate-800"></span>
          </div>

          {/* Right: Network & Battery Indicators */}
          <div className="flex items-center gap-1.5 text-white/90">
            <span className="text-[10px] font-black text-emerald-300">5G</span>
            <Signal className="w-3 h-3" />
            <Wifi className="w-3 h-3" />
            <BatteryMedium className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        {/* Scrollable Smartphone Screen Body */}
        <div className="flex-1 w-full overflow-y-auto overflow-x-hidden relative bg-[#F4F7F4] flex flex-col scrollbar-none">
          {children}
        </div>

        {/* Bottom Home Indicator Bar */}
        <div className="h-4 bg-white/95 backdrop-blur-md flex items-center justify-center shrink-0 border-t border-slate-100 z-50">
          <div className="w-28 h-1 bg-slate-400/80 rounded-full"></div>
        </div>

      </div>

      {/* Presentation Footer Helper */}
      <div className="mt-2.5 text-center hidden sm:block">
        <p className="text-[11px] text-slate-400 flex items-center gap-2 justify-center">
          <span>💡 <strong className="text-slate-300">टिप:</strong> माउस व्हील से स्क्रॉल करें या नीचे नेविगेशन पर टैप करें।</span>
          <span>•</span>
          <span className="text-emerald-400 font-semibold">100% लाइव वर्किंग</span>
        </p>
      </div>

    </div>
  );
}
