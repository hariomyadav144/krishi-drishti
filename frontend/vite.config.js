import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  const isCapacitor = 
    process.env.CAPACITOR === 'true' || 
    process.env.TARGET === 'android' ||
    process.env.npm_lifecycle_event === 'build:android' ||
    process.env.npm_lifecycle_event === 'cap:build' ||
    process.env.npm_lifecycle_event === 'cap:sync';

  let base = './';
  if (command === 'serve') {
    // In local dev server (npm run dev), serve from root '/' for clean localhost:5173
    base = '/';
  } else if (process.env.VITE_BASE_PATH) {
    base = process.env.VITE_BASE_PATH;
  } else {
    // Relative paths ensure 100% compatibility across Capacitor Android (https://localhost/),
    // custom domains, and GitHub Pages (/krishi-drishti/)
    base = './';
  }

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

