import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Krishi Drishti ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    localStorage.removeItem('krishi_token');
    localStorage.removeItem('krishi_demo_role');
    this.setState({ hasError: false, error: null });
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
            Krishi Drishti – Automatic Recovery
          </h2>
          <p className="text-xs text-slate-300 max-w-sm mb-6 leading-relaxed">
            कृषि दृष्टि ऐप को रीफ्रेश किया जा रहा है। कृपया नीचे दिए गए बटन पर क्लिक करें।
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
