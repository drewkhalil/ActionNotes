/// <reference types="vitest" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Define the type for the Vite environment mode
interface ViteEnv {
  mode: string;
}

export default defineConfig(({ mode }: ViteEnv) => {
  const env = loadEnv(mode, process.cwd(), "");
  const flaskServerUrl: string = mode === 'development' ? 'http://localhost:5555' : env.VITE_FLASK_SERVER_URL || 'https://flask-backend-production.up.railway.app';

  return {
    cacheDir: "./.vite_cache",
    esbuild: {
      target: "esnext",
      minify: true,
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
          rewrite: (path: string) => path.replace(/^\/auth\/v1/, "/auth/v1"),
        },
        "/rest/v1": {
          target: "https://bmuvsbafvrvsgdplhvgp.supabase.co",
          changeOrigin: true,
          secure: false,
          rewrite: (path: string) => path.replace(/^\/rest\/v1/, "/rest/v1"),
        },
        "/api/v1": {
          target: "https://bmuvsbafvrvsgdplhvgp.supabase.co",
          changeOrigin: true,
          secure: false,
          rewrite: (path: string) => path.replace(/^\/api\/v1/, "/api/v1"),
        },
        "/api/azure": {
          target: "https://models.inference.ai.azure.com",
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/api\/azure/, ""),
          secure: false,
          headers: {
            "api-key": env.VITE_OPENAI_BOOK_API_KEY || "",
          },
        },
        "/api/flask": {
          target: "http://localhost:5555",
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/api\/flask/, ""),
          secure: false,
        },
        // Removed /api/openlibrary proxy since we're fixing the CSP directly
      },
      headers: {
        'X-CSP-Test-Header': 'ViteCSPTest', // Add this to verify headers are applied
        'Content-Security-Policy': `
          default-src 'self';
          script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.stripe.com;
          style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
          img-src 'self' data: https:;
          font-src 'self' data: blob: https: https://fonts.gstatic.com;
          connect-src 'self' https://api.stripe.com https://checkout.stripe.com
            https://actionnotes-production.up.railway.app/api/create-checkout-session
            https://models.inference.ai.azure.com https://*.stripe.com
            https://bmuvsbafvrvsgdplhvgp.supabase.co https://*.supabase.co
            wss://bmuvsbafvrvsgdplhvgp.supabase.co
            https://cdnjs.cloudflare.com ${flaskServerUrl} https://openlibrary.org;
          frame-src 'self' https://*.stripe.com https://checkout.stripe.com;
          script-src-elem 'self' 'unsafe-inline' https://*.stripe.com;
        `.replace(/\s+/g, ' ').trim(),
      },
    },

    preview: {
      headers: {
        'X-CSP-Test-Header': 'ViteCSPTest',
        'Content-Security-Policy': `
          default-src 'self';
          script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.stripe.com;
          style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
          img-src 'self' data: https:;
          font-src 'self' data: blob: https: https://fonts.gstatic.com;
          connect-src 'self' https://api.stripe.com https://checkout.stripe.com
            https://actionnotes-production.up.railway.app/api/create-checkout-session
            https://models.inference.ai.azure.com https://*.stripe.com
            https://bmuvsbafvrvsgdplhvgp.supabase.co https://*.supabase.co
            wss://bmuvsbafvrvsgdplhvgp.supabase.co
            https://cdnjs.cloudflare.com ${flaskServerUrl} https://openlibrary.org;
          frame-src 'self' https://*.stripe.com https://checkout.stripe.com;
          script-src-elem 'self' 'unsafe-inline' https://*.stripe.com;
        `.replace(/\s+/g, ' ').trim(),
      },
    },

    build: {
      outDir: "dist",
      assetsDir: "assets",
      sourcemap: true,
      rollupOptions: {
        output: {
          format: "esm",
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
  };
});