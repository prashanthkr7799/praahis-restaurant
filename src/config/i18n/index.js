/**
 * i18n Configuration
 *
 * Internationalization setup using react-i18next
 * Supports English (default), Tamil, and Hindi
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations
import en from './locales/en.json';
import ta from './locales/ta.json';
import hi from './locales/hi.json';

// Language configuration
const resources = {
  en: { translation: en },
  ta: { translation: ta },
  hi: { translation: hi },
};

// Supported languages
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
];

// Get saved language or browser preference
const getSavedLanguage = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('praahis_language');
    if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
      return saved;
    }
    // Try to match browser language
    const browserLang = navigator.language.split('-')[0];
    if (SUPPORTED_LANGUAGES.some((l) => l.code === browserLang)) {
      return browserLang;
    }
  }
  return 'en';
};

i18n.use(initReactI18next).init({
  resources,
  lng: getSavedLanguage(),
  fallbackLng: 'en',
  debug: import.meta.env.DEV,

  interpolation: {
    escapeValue: false, // React already escapes
  },

  // Namespace defaults
  defaultNS: 'translation',
  ns: ['translation'],

  // Key formatting
  keySeparator: '.',
  nsSeparator: ':',

  // React specific options
  react: {
    useSuspense: true,
    bindI18n: 'languageChanged loaded',
    bindI18nStore: 'added removed',
  },
});

// Language change handler
export const changeLanguage = (languageCode) => {
  if (SUPPORTED_LANGUAGES.some((l) => l.code === languageCode)) {
    i18n.changeLanguage(languageCode);
    localStorage.setItem('praahis_language', languageCode);
    document.documentElement.lang = languageCode;
  }
};

// Get current language info
export const getCurrentLanguage = () => {
  const code = i18n.language;
  return SUPPORTED_LANGUAGES.find((l) => l.code === code) || SUPPORTED_LANGUAGES[0];
};

export default i18n;
