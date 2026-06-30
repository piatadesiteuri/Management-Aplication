import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // încărcăm env-urile (VITE_*) din fișierul .env al frontend-ului
  const env = loadEnv(mode, process.cwd(), '');

  const frontendPort = Number(env.VITE_PORT || 5174);
  const backendPort = Number(env.VITE_BACKEND_PORT || 3100);
  // compatibilitate: unele proiecte folosesc VITE_API_URL
  const apiTarget = env.VITE_API_TARGET || env.VITE_API_URL || `http://localhost:${backendPort}`;

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: frontendPort,
      host: true,
      open: true,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
