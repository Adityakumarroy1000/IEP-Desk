import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_DEV_API_TARGET || "http://localhost:3000";

  return {
    plugins: [react()],
    build: {
      rollupOptions: {
        target: 'node18',
        external: [],
      },
      target: 'esnext',
      minify: 'esbuild',
      sourcemap: false,
    },
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true
        }
      }
    }
  };
});
