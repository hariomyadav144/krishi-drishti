import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { SelfHealingProvider } from './selfHealing/index.js';
import './index.css';

try {
  window.__fasalDrishtiMounted = true;
} catch (_) {}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <SelfHealingProvider>
          <App />
        </SelfHealingProvider>
      </ErrorBoundary>
    </React.StrictMode>,
  );
  window.__fasalDrishtiMounted = true;
}
