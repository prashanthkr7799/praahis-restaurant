import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import { fileURLToPath } from 'url'

const SENTRY_ORG = process.env.SENTRY_ORG;
const SENTRY_PROJECT = process.env.SENTRY_PROJECT;
const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN;
const VERCEL_GIT_COMMIT_SHA = process.env.VERCEL_GIT_COMMIT_SHA;

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Sentry plugin for source maps (only in production builds)
    sentryVitePlugin({
      org: SENTRY_ORG,
      project: SENTRY_PROJECT,
      authToken: SENTRY_AUTH_TOKEN,
      // Only upload source maps in CI/production builds
      disable: !SENTRY_AUTH_TOKEN,
      sourcemaps: {
        assets: './dist/**',
      },
      release: {
        name: VERCEL_GIT_COMMIT_SHA || 'dev',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
      '@domains': fileURLToPath(new URL('./src/domains', import.meta.url)),
      '@pages': fileURLToPath(new URL('./src/pages', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 500,
    // Generate source maps for Sentry
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks - split heavy dependencies
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts': ['recharts'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-ui': ['framer-motion', 'lucide-react', 'react-hot-toast'],
          'vendor-pdf': ['jspdf', 'jspdf-autotable'],
          'vendor-utils': ['date-fns', 'papaparse', 'xlsx', 'jszip', 'file-saver'],
          'vendor-sentry': ['@sentry/react'],
        },
      },
    },
  },
})
