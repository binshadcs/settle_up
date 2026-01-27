import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: [
      '73be43b6de14.ngrok-free.app'
    ]
  },
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    // devOptions: {
    //   enabled: true
    // }
  })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
