import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  envPrefix: 'VITE_',
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['react', 'react-dom', 'react-router-dom']
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'icons': ['lucide-react'],
          'pdf': ['pdf-lib', 'pdfjs-dist'],
          'ocr': ['tesseract.js']
        },
        assetFileNames: 'assets/[name].[hash][extname]'
      }
    },
    sourcemap: true,
    target: 'es2020'
  },
}));
