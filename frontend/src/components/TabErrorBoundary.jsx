import React from 'react';
import { RecoveryManager, LogLevel } from '../selfHealing/index.js';

export default class TabErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, recoveryAttempts: 0 };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`[TabErrorBoundary:${this.props.tabKey} Error]:`, error, errorInfo);

    RecoveryManager.logDiagnostic({
      level: LogLevel.ERROR,
      module: `Tab:${this.props.tabKey || 'Unknown'}`,
      errorType: 'UI_TAB_CRASH',
      message: error?.message || 'Tab render error',
      stack: error?.stack || errorInfo?.componentStack || '',
      status: 'CAUGHT_BY_TAB_BOUNDARY',
    });

    // Auto-attempt recovery once
    if (this.state.recoveryAttempts < 1) {
      setTimeout(() => {
        this.setState((prev) => ({
          hasError: false,
          error: null,
          recoveryAttempts: prev.recoveryAttempts + 1,
        }));
      }, 400);
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.tabKey !== this.props.tabKey && this.state.hasError) {
      this.setState({ hasError: false, error: null, recoveryAttempts: 0 });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, recoveryAttempts: 0 });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-2xl mx-auto my-12 p-6 bg-white rounded-3xl border border-emerald-100 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-3xl mx-auto shadow-2xs">
            🌱
          </div>
          <h3 className="text-lg font-black text-slate-900">
            {this.props.title || 'डेटा सिंक एवं रिफ्रेश / Syncing Data'}
          </h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            इस मॉड्यूल का डेटा पुनः सिंक किया जा रहा है। आप नीचे दिए गए बटन से पुनः प्रयास कर सकते हैं या मुख्य डैशबोर्ड पर जा सकते हैं।
          </p>
          {this.state.error && (
            <details className="text-left text-xs bg-red-50 text-red-800 p-3 rounded-xl border border-red-200 mt-2 max-h-40 overflow-auto">
              <summary className="font-bold cursor-pointer text-red-900">तकनीकी विवरण (Technical Details)</summary>
              <div className="mt-1 font-mono text-[11px] whitespace-pre-wrap">{this.state.error.toString()}</div>
            </details>
          )}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={this.handleRetry}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-xs transition active:scale-95"
            >
              🔄 पुनः प्रयास करें (Retry)
            </button>
            {this.props.onNavigateHome && (
              <button
                onClick={this.props.onNavigateHome}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 px-5 rounded-xl transition"
              >
                🏠 होम डैशबोर्ड (Home)
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
