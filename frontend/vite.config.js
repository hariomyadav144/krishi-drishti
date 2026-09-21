import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => {
  // Always use relative base './' so all scripts/styles resolve relative to index.html
  // in Capacitor Android (https://localhost/assets/...), local dev, and all hosting environments.
  const isGhPages = process.env.GITHUB_PAGES === 'true' || process.env.DEPLOY_TARGET === 'gh-pages';
  const base = process.env.VITE_BASE_PATH || (isGhPages ? '/krishi-drishti/' : './');

  return {
    base,
    plugins: [react()],
    build: {
      target: ['es2020', 'chrome80'],
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-icons': ['lucide-react'],
            'vendor-axios': ['axios'],
          },
        },
      },
      chunkSizeWarningLimit: 800,
    },
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
        '/uploads': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        }
      }
    }
  };
});

