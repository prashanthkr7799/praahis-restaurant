/**
 * useI18n Hook
 *
 * Enhanced i18n hook with additional utilities
 */
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, changeLanguage, getCurrentLanguage } from '@config/i18n';

/**
 * Enhanced translation hook with additional utilities
 * @returns {Object} Translation utilities and helpers
 */
export function useI18n() {
  const { t, i18n, ready } = useTranslation();

  // Get current language info - recalculates when language changes
  const language = i18n.language;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const currentLanguage = useMemo(() => getCurrentLanguage(), [language]);

  // Check if a specific language is active
  const isLanguage = useCallback((code) => i18n.language === code, [i18n.language]);

  // Change language with callback
  const setLanguage = useCallback((code, callback) => {
    changeLanguage(code);
    if (callback) {
      callback(code);
    }
  }, []);

  // Translate with fallback
  const tSafe = useCallback(
    (key, options = {}) => {
      const translation = t(key, options);
      // If translation is the same as key, it means translation is missing
      return translation === key ? options.fallback || key : translation;
    },
    [t]
  );

  // Format number according to current locale
  const formatNumber = useCallback(
    (value, options = {}) => {
      return new Intl.NumberFormat(i18n.language, options).format(value);
    },
    [i18n.language]
  );

  // Format currency according to current locale
  const formatCurrency = useCallback(
    (value, currency = 'INR') => {
      return new Intl.NumberFormat(i18n.language, {
        style: 'currency',
        currency,
      }).format(value);
    },
    [i18n.language]
  );

  // Format date according to current locale
  const formatDate = useCallback(
    (date, options = {}) => {
      const dateObj = date instanceof Date ? date : new Date(date);
      return new Intl.DateTimeFormat(i18n.language, options).format(dateObj);
    },
    [i18n.language]
  );

  // Format relative time (e.g., "2 hours ago")
  const formatRelativeTime = useCallback(
    (date, options = {}) => {
      const dateObj = date instanceof Date ? date : new Date(date);
      const now = new Date();
      const diffInSeconds = Math.floor((now - dateObj) / 1000);

      const rtf = new Intl.RelativeTimeFormat(i18n.language, {
        numeric: 'auto',
        ...options,
      });

      if (diffInSeconds < 60) {
        return rtf.format(-diffInSeconds, 'second');
      } else if (diffInSeconds < 3600) {
        return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
      } else if (diffInSeconds < 86400) {
        return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
      } else if (diffInSeconds < 2592000) {
        return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
      } else if (diffInSeconds < 31536000) {
        return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
      } else {
        return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
      }
    },
    [i18n.language]
  );

  // Get plural form
  const plural = useCallback((count, { one, other, zero }) => {
    if (count === 0 && zero) return zero;
    if (count === 1) return one;
    return other.replace('{{count}}', count);
  }, []);

  // Check if text direction is RTL
  const isRTL = useMemo(() => {
    // Add RTL languages as needed
    const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
    return rtlLanguages.includes(i18n.language);
  }, [i18n.language]);

  return {
    // Core translation
    t,
    tSafe,
    i18n,
    ready,

    // Language info
    currentLanguage,
    languages: SUPPORTED_LANGUAGES,
    isLanguage,
    setLanguage,
    isRTL,

    // Formatting utilities
    formatNumber,
    formatCurrency,
    formatDate,
    formatRelativeTime,
    plural,
  };
}

export default useI18n;
