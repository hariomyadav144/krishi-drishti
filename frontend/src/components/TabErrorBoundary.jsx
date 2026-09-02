import React from 'react';

export default class TabErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('TabErrorBoundary caught an error in active tab:', error, errorInfo);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.tabKey !== this.props.tabKey && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-2xl mx-auto my-12 p-6 bg-white rounded-3xl border border-emerald-100 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-3xl mx-auto shadow-2xs">
            🌱
          </div>
          <h3 className="text-lg font-black text-slate-900">
            {this.props.title || 'अनुभाग सुरक्षित रीलोड / Refreshing Section'}
          </h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            इस मॉड्यूल का डेटा पुनः सिंक किया जा रहा है। आप नीचे दिए गए बटन से पुनः प्रयास कर सकते हैं या मुख्य डैशबोर्ड पर जा सकते हैं।
          </p>
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
