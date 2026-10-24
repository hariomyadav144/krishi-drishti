/**
 * Fasal Drishti — Production-Safe Self-Healing System
 * React Provider & Non-Intrusive Farmer Feedback UI
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { RecoveryManager } from './RecoveryManager.js';
import { ErrorMonitor } from './ErrorMonitor.js';

const SelfHealingContext = createContext(null);

export function SelfHealingProvider({ children }) {
  const [notification, setNotification] = useState(null);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // 1. Initialize global window error monitors
    ErrorMonitor.init();

    // 2. Subscribe to self-healing lifecycle events
    const unsubscribe = RecoveryManager.subscribe((event) => {
      // Show farmer-friendly banner
      setNotification(event);

      // Auto-dismiss resolved/fallback notifications after 4.5 seconds
      if (event.state === 'RESOLVED' || event.state === 'FALLBACK' || event.state === 'ONLINE') {
        setTimeout(() => {
          setNotification((prev) => (prev === event ? null : prev));
        }, 4500);
      }
    });

    return () => unsubscribe();
  }, []);

  const openDiagnostics = () => {
    setLogs(RecoveryManager.getLogs());
    setDiagnosticsOpen(true);
  };

  const closeDiagnostics = () => {
    setDiagnosticsOpen(false);
  };

  return (
    <SelfHealingContext.Provider
      value={{
        notification,
        dismissNotification: () => setNotification(null),
        openDiagnostics,
        getDiagnostics: () => RecoveryManager.getLogs(),
      }}
    >
      {children}

      {/* Farmer-Friendly Non-Intrusive Auto-Healing Toast */}
      {notification && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] sm:w-auto px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-4 flex items-center gap-3 text-xs font-medium"
          style={{
            backgroundColor:
              notification.state === 'RECOVERING'
                ? 'rgba(15, 23, 42, 0.95)'
                : notification.state === 'RESOLVED'
                ? 'rgba(6, 78, 59, 0.95)'
                : notification.state === 'OFFLINE'
                ? 'rgba(120, 53, 15, 0.95)'
                : 'rgba(30, 41, 59, 0.95)',
            borderColor:
              notification.state === 'RECOVERING'
                ? 'rgba(56, 189, 248, 0.3)'
                : notification.state === 'RESOLVED'
                ? 'rgba(52, 211, 153, 0.4)'
                : notification.state === 'OFFLINE'
                ? 'rgba(251, 191, 36, 0.4)'
                : 'rgba(148, 163, 184, 0.3)',
            color: '#FFFFFF',
          }}
        >
          <div className="text-lg shrink-0">
            {notification.state === 'RECOVERING' && (
              <span className="inline-block animate-spin text-sky-400">⚙️</span>
            )}
            {notification.state === 'RESOLVED' && <span className="text-emerald-400">✅</span>}
            {notification.state === 'FALLBACK' && <span className="text-amber-400">🛡️</span>}
            {notification.state === 'OFFLINE' && <span className="text-amber-300">📶</span>}
            {notification.state === 'ONLINE' && <span className="text-emerald-300">🌐</span>}
          </div>

          <div className="flex-1 min-w-0 pr-2">
            <p className="font-bold text-[12px] leading-tight text-white">
              {notification.messageHi}
            </p>
            <p className="text-[10px] text-slate-300 leading-tight mt-0.5 opacity-90">
              {notification.messageEn}
            </p>
          </div>

          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg text-xs"
            aria-label="Close notification"
          >
            ✕
          </button>
        </div>
      )}

      {/* Developer / Technician Diagnostics Modal */}
      {diagnosticsOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl max-h-[85vh] rounded-3xl flex flex-col overflow-hidden text-white shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-mono text-sm">🛠️</span>
                <h3 className="font-bold text-sm text-slate-100">
                  Fasal Drishti — Self-Healing Diagnostic Logs
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    RecoveryManager.clearLogs();
                    setLogs([]);
                  }}
                  className="text-[11px] bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg text-slate-300"
                >
                  Clear
                </button>
                <button
                  onClick={closeDiagnostics}
                  className="text-slate-400 hover:text-white px-2 py-1"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1 font-mono text-xs">
              {logs.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  🌱 No recent errors or recovery events recorded. System health is optimal.
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl border bg-slate-950/60 border-slate-800 text-[11px]"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className="font-bold text-emerald-400">[{log.module}]</span>
                      <span
                        className={`font-semibold uppercase ${
                          log.level === 'ERROR'
                            ? 'text-red-400'
                            : log.level === 'WARNING'
                            ? 'text-amber-400'
                            : 'text-slate-300'
                        }`}
                      >
                        {log.level}
                      </span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-slate-200 font-sans font-medium mb-1">
                      {log.message}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="bg-slate-800 px-1.5 py-0.5 rounded">
                        Status: {log.status}
                      </span>
                      {log.attempt > 0 && (
                        <span className="bg-slate-800 px-1.5 py-0.5 rounded">
                          Attempt: {log.attempt}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </SelfHealingContext.Provider>
  );
}

export const useSelfHealing = () => {
  const context = useContext(SelfHealingContext);
  if (!context) {
    return {
      notification: null,
      dismissNotification: () => {},
      openDiagnostics: () => {},
      getDiagnostics: () => [],
    };
  }
  return context;
};
