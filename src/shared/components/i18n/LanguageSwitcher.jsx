/**
 * LanguageSwitcher Component
 *
 * Dropdown component for switching application language
 */
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check, ChevronDown } from 'lucide-react';
import PropTypes from 'prop-types';
import { SUPPORTED_LANGUAGES, changeLanguage, getCurrentLanguage } from '@config/i18n';

export function LanguageSwitcher({ variant = 'dropdown', className = '' }) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const currentLanguage = getCurrentLanguage();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleLanguageChange = (languageCode) => {
    changeLanguage(languageCode);
    setIsOpen(false);
  };

  // Simple button variant
  if (variant === 'buttons') {
    return (
      <div className={`flex gap-1 ${className}`} role="group" aria-label="Language selection">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`
              px-2 py-1 text-sm rounded transition-colors
              ${
                i18n.language === lang.code
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }
            `}
            aria-pressed={i18n.language === lang.code}
            aria-label={`Switch to ${lang.name}`}
          >
            {lang.code.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  // Dropdown variant (default)
  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center gap-2 px-3 py-2 
          bg-gray-800 border border-gray-700 rounded-lg
          text-gray-200 hover:bg-gray-700 
          transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
        "
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Select language"
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm">{currentLanguage.nativeName}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <ul
          className="
            absolute right-0 mt-2 w-48 py-1
            bg-gray-800 border border-gray-700 rounded-lg shadow-lg
            z-50 overflow-hidden
          "
          role="listbox"
          aria-label="Available languages"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <li key={lang.code}>
              <button
                onClick={() => handleLanguageChange(lang.code)}
                className={`
                  w-full flex items-center justify-between px-4 py-2
                  text-left text-sm transition-colors
                  ${
                    i18n.language === lang.code
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-200 hover:bg-gray-700'
                  }
                `}
                role="option"
                aria-selected={i18n.language === lang.code}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{lang.nativeName}</span>
                  <span className="text-xs opacity-75">{lang.name}</span>
                </div>
                {i18n.language === lang.code && <Check className="w-4 h-4" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

LanguageSwitcher.propTypes = {
  variant: PropTypes.oneOf(['dropdown', 'buttons']),
  className: PropTypes.string,
};

export default LanguageSwitcher;
