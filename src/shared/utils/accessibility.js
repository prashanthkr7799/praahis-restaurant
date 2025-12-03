/**
 * Accessibility Utilities
 * Common accessibility helpers for keyboard navigation, focus management, and ARIA
 */

/**
 * Focus trap - keeps focus within a container
 * Useful for modals, dropdowns, and dialogs
 */
export const createFocusTrap = (containerRef) => {
  const focusableSelectors = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  const getFocusableElements = () => {
    if (!containerRef.current) return [];
    return Array.from(containerRef.current.querySelectorAll(focusableSelectors));
  };

  const handleKeyDown = (e) => {
    if (e.key !== 'Tab') return;

    const focusable = getFocusableElements();
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const activate = () => {
    document.addEventListener('keydown', handleKeyDown);
    const focusable = getFocusableElements();
    if (focusable.length > 0) {
      focusable[0].focus();
    }
  };

  const deactivate = () => {
    document.removeEventListener('keydown', handleKeyDown);
  };

  return { activate, deactivate };
};

/**
 * Keyboard navigation helpers
 */
export const KeyboardKeys = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
};

/**
 * Handle keyboard navigation for list items
 */
export const handleListKeyNavigation = (e, items, currentIndex, onSelect) => {
  switch (e.key) {
    case KeyboardKeys.ARROW_DOWN:
      e.preventDefault();
      onSelect(Math.min(currentIndex + 1, items.length - 1));
      break;
    case KeyboardKeys.ARROW_UP:
      e.preventDefault();
      onSelect(Math.max(currentIndex - 1, 0));
      break;
    case KeyboardKeys.HOME:
      e.preventDefault();
      onSelect(0);
      break;
    case KeyboardKeys.END:
      e.preventDefault();
      onSelect(items.length - 1);
      break;
    case KeyboardKeys.ENTER:
    case KeyboardKeys.SPACE:
      e.preventDefault();
      // Trigger selection of current item
      break;
    default:
      break;
  }
};

/**
 * Announce message to screen readers
 */
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Generate unique IDs for accessibility
 */
let idCounter = 0;
export const generateA11yId = (prefix = 'a11y') => {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
};

/**
 * Check if element is visible
 */
export const isElementVisible = (element) => {
  if (!element) return false;
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
};

/**
 * Get accessible name for an element
 */
export const getAccessibleName = (element) => {
  if (!element) return '';

  // Check aria-label
  if (element.getAttribute('aria-label')) {
    return element.getAttribute('aria-label');
  }

  // Check aria-labelledby
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labels = labelledBy.split(' ').map((id) => {
      const labelElement = document.getElementById(id);
      return labelElement?.textContent || '';
    });
    return labels.join(' ');
  }

  // Check title
  if (element.title) {
    return element.title;
  }

  // Return text content
  return element.textContent?.trim() || '';
};

/**
 * Skip link component helper
 */
export const createSkipLink = (targetId, text = 'Skip to main content') => ({
  href: `#${targetId}`,
  className:
    'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-blue-600 focus:rounded-lg focus:shadow-lg',
  text,
});

/**
 * ARIA live region manager
 */
class LiveRegionManager {
  constructor() {
    this.region = null;
  }

  init() {
    if (this.region) return;

    this.region = document.createElement('div');
    this.region.setAttribute('role', 'status');
    this.region.setAttribute('aria-live', 'polite');
    this.region.setAttribute('aria-atomic', 'true');
    this.region.className = 'sr-only';
    this.region.id = 'live-region';
    document.body.appendChild(this.region);
  }

  announce(message, priority = 'polite') {
    this.init();
    this.region.setAttribute('aria-live', priority);
    this.region.textContent = '';

    // Force reannouncement
    requestAnimationFrame(() => {
      this.region.textContent = message;
    });
  }

  clear() {
    if (this.region) {
      this.region.textContent = '';
    }
  }
}

export const liveRegion = new LiveRegionManager();

/**
 * Roving tabindex helper for composite widgets
 */
export const useRovingTabindex = (items, selectedIndex) => {
  return items.map((_, index) => ({
    tabIndex: index === selectedIndex ? 0 : -1,
    'aria-selected': index === selectedIndex,
  }));
};

export default {
  createFocusTrap,
  KeyboardKeys,
  handleListKeyNavigation,
  announceToScreenReader,
  generateA11yId,
  isElementVisible,
  getAccessibleName,
  createSkipLink,
  liveRegion,
  useRovingTabindex,
};
