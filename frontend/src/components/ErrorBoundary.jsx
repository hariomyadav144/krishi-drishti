import React from 'react';
import { RecoveryManager, LogLevel } from '../selfHealing/index.js';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, recoveryAttempts: 0 };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Fasal Drishti ErrorBoundary caught an error:', error, errorInfo);

    RecoveryManager.logDiagnostic({
      level: LogLevel.ERROR,
      module: 'RootErrorBoundary',
      errorType: 'UI_RENDER_CRASH',
      message: error?.message || 'Component render crash',
      stack: error?.stack || errorInfo?.componentStack || '',
      status: 'CAUGHT_BY_ROOT_BOUNDARY',
    });

    // Attempt automatic self-healing remount once if not already looped
    if (this.state.recoveryAttempts < 1) {
      setTimeout(() => {
        this.setState((prev) => ({
          hasError: false,
          error: null,
          recoveryAttempts: prev.recoveryAttempts + 1,
        }));
      }, 500);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, recoveryAttempts: 0 });
    window.location.hash = '#/home';
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-3xl mb-4">
            🌾
          </div>
          <h2 className="text-xl font-bold text-emerald-400 mb-2">
            Fasal Drishti – Automatic Recovery
          </h2>
          <p className="text-xs text-slate-300 max-w-sm mb-6 leading-relaxed">
            फ़सल दृष्टि ऐप को रीफ्रेश किया जा रहा है। कृपया नीचे दिए गए बटन पर क्लिक करें।
          </p>
          <button
            onClick={this.handleReset}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 px-6 rounded-xl shadow-lg transition active:scale-95"
          >
            🔄 Reload Dashboard / डैशबोर्ड रीलोड करें
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
