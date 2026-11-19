import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (_err, req, res) => {
            if (!res.headersSent) {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: 'Backend offline: Django server on http://127.0.0.1:8000 is not reachable. Run "npm run backend" to start it.'
              }));
            }
          });
        },
      },
      '/media': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    }
  }
});
