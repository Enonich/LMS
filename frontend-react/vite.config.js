import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, mkdirSync } from 'fs';
import { join } from 'path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-background',
      closeBundle() {
        try {
          mkdirSync('dist/static', { recursive: true });
          copyFileSync('li.jpg', 'dist/static/li.jpg');
          console.log('✅ Copied background image to dist/static/');
        } catch (e) {
          console.error('⚠️ Failed to copy background image:', e.message);
        }
      }
    }
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      },
      '/uploads': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
