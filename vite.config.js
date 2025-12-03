import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { fileURLToPath } from 'url';

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
      '@app': fileURLToPath(new URL('./src/app', import.meta.url)),
      '@features': fileURLToPath(new URL('./src/features', import.meta.url)),
      '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
      '@config': fileURLToPath(new URL('./src/config', import.meta.url)),
      '@styles': fileURLToPath(new URL('./src/styles', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 500,
    // Generate source maps for Sentry
    sourcemap: true,
    // Minification options
    minify: 'esbuild',
    target: 'esnext',
    // CSS code splitting
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // Optimize chunk names for caching
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        manualChunks: (id) => {
          // Node modules chunking strategy
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            // React Router
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
            // Tanstack Query
            if (id.includes('@tanstack')) {
              return 'vendor-query';
            }
            // Zustand
            if (id.includes('zustand')) {
              return 'vendor-zustand';
            }
            // Charts
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'vendor-charts';
            }
            // Supabase
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            // UI libraries
            if (id.includes('framer-motion')) {
              return 'vendor-framer';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            // PDF generation
            if (id.includes('jspdf') || id.includes('autotable')) {
              return 'vendor-pdf';
            }
            // Data utilities
            if (
              id.includes('papaparse') ||
              id.includes('xlsx') ||
              id.includes('jszip') ||
              id.includes('file-saver')
            ) {
              return 'vendor-data';
            }
            // Date utilities
            if (id.includes('date-fns')) {
              return 'vendor-date';
            }
            // Sentry
            if (id.includes('@sentry')) {
              return 'vendor-sentry';
            }
            // Toast notifications
            if (id.includes('react-hot-toast')) {
              return 'vendor-toast';
            }
            // Zod validation
            if (id.includes('zod')) {
              return 'vendor-zod';
            }
            // Other vendor libs
            return 'vendor-common';
          }

          // Feature-based chunking for app code
          if (id.includes('/src/features/manager/')) {
            return 'feature-manager';
          }
          if (id.includes('/src/features/superadmin/')) {
            return 'feature-superadmin';
          }
          if (id.includes('/src/features/chef/')) {
            return 'feature-chef';
          }
          if (id.includes('/src/features/waiter/')) {
            return 'feature-waiter';
          }
          if (id.includes('/src/features/customer/')) {
            return 'feature-customer';
          }
          if (id.includes('/src/features/auth/')) {
            return 'feature-auth';
          }
          if (id.includes('/src/shared/')) {
            return 'shared';
          }
        },
      },
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
      'zustand',
      'lucide-react',
    ],
  },
});
