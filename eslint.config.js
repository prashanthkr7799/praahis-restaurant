import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  {
    ignores: [
      'dist',
      'build',
      '.vite',
      'node_modules',
      'coverage',
      '**/*.min.js',
      'supabase/functions/**/*.ts',
    ],
  },
  // Node.js config files
  {
    files: [
      'vite.config.js',
      'vitest.config.js',
      'eslint.config.js',
      'postcss.config.js',
      'tailwind.config.js',
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
      sourceType: 'module',
    },
  },
  // Playwright config and E2E tests (Node.js environment)
  {
    files: ['playwright.config.js', 'e2e/**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.node,
        ...globals.browser,
      },
      sourceType: 'module',
    },
  },
  // Service Worker (ServiceWorker globals)
  {
    files: ['public/sw.js'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.serviceworker,
        ...globals.browser,
      },
      sourceType: 'module',
    },
  },
  {
    files: ['**/*.{js,jsx}'],
    ignores: ['playwright.config.js', 'e2e/**/*.js', 'public/sw.js'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^[A-Z_]',
          ignoreRestSiblings: true,
          argsIgnorePattern: '^_|^[A-Z]',
        },
      ],
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
];
