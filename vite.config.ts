/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  cacheDir: "./.vite_cache",
  esbuild: {
    target: "esnext",
    minify: true, // Enables minification for performance
  },

  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    port: 5173,
    proxy: {
      "/auth/v1": {
        target: "https://bmuvsbafvrvsgdplhvgp.supabase.co",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/auth\/v1/, "/auth/v1"),
      },
      "/rest/v1": {
        target: "https://bmuvsbafvrvsgdplhvgp.supabase.co",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/rest\/v1/, "/rest/v1"),
      },
      "/api/v1": {
        target: "https://bmuvsbafvrvsgdplhvgp.supabase.co",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/v1/, "/api/v1"),
      },
      "/api/azure": {
        target: "https://models.inference.ai.azure.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/azure/, ""),
        secure: false,
        headers: {
          "api-key": process.env.VITE_OPENAI_QUIZ_API_KEY || "",
        },
      },
    },
    headers: {
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.stripe.com https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: blob: https: https://fonts.gstatic.com data:; connect-src 'self' https://api.stripe.com https://actionnotes-production.up.railway.app/api/create-checkout-session https://models.inference.ai.azure.com https://*.stripe.com https://bmuvsbafvrvsgdplhvgp.supabase.co https://*.supabase.co wss://bmuvsbafvrvsgdplhvgp.supabase.co https://cdnjs.cloudflare.com; frame-src 'self' https://*.stripe.com; script-src-elem 'self' 'unsafe-inline' https://*.stripe.com https://cdnjs.cloudflare.com",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy":
        "camera=(), microphone=(), geolocation=(), interest-cohort=()",
    },
  },

  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: true,
    rollupOptions: {
      output: {
        format: "esm", // ✅ Force ES Module output
        manualChunks: {
          vendor: ["react", "react-dom"],
        },
      },
    },
  },

  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{js,jsx,ts,tsx}"],
  },
});
