import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      // 프론트에서 /api 로 호출하면 백엔드로 프록시
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      // 웹소켓
      "/ws": {
        target: "http://localhost:8080",
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
