/**
 * useFocusTrap Hook
 * Manages focus trapping for modals and dialogs
 */

import { useEffect, useRef, useCallback } from 'react';

const FOCUSABLE_SELECTORS = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export const useFocusTrap = (isActive = true, options = {}) => {
  const containerRef = useRef(null);
  const previousActiveElement = useRef(null);

  const {
    initialFocus = null, // Selector for initial focus element
    returnFocus = true, // Return focus to previous element on deactivate
    escapeDeactivates = true, // Allow escape key to deactivate
    onEscape = null, // Callback when escape is pressed
  } = options;

  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    return Array.from(containerRef.current.querySelectorAll(FOCUSABLE_SELECTORS));
  }, []);

  const focusFirstElement = useCallback(() => {
    if (!containerRef.current) return;

    // Try initial focus selector first
    if (initialFocus) {
      const initialElement = containerRef.current.querySelector(initialFocus);
      if (initialElement) {
        initialElement.focus();
        return;
      }
    }

    // Focus first focusable element
    const focusable = getFocusableElements();
    if (focusable.length > 0) {
      focusable[0].focus();
    }
  }, [initialFocus, getFocusableElements]);

  const handleKeyDown = useCallback(
    (e) => {
      if (!containerRef.current) return;

      // Handle escape key
      if (e.key === 'Escape' && escapeDeactivates) {
        e.preventDefault();
        onEscape?.();
        return;
      }

      // Handle tab key for focus trapping
      if (e.key !== 'Tab') return;

      const focusable = getFocusableElements();
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [escapeDeactivates, onEscape, getFocusableElements]
  );

  // Activate focus trap
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Store current active element
    previousActiveElement.current = document.activeElement;

    // Focus first element
    focusFirstElement();

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      // Remove event listener
      document.removeEventListener('keydown', handleKeyDown);

      // Return focus to previous element
      if (returnFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive, handleKeyDown, focusFirstElement, returnFocus]);

  return containerRef;
};

/**
 * useKeyboardNavigation Hook
 * Handles arrow key navigation for lists
 */
export const useKeyboardNavigation = (itemsLength, options = {}) => {
  const {
    initialIndex = 0,
    loop = true,
    orientation = 'vertical', // 'vertical' | 'horizontal' | 'both'
    onSelect = null,
  } = options;

  const [selectedIndex, setSelectedIndex] = useState(initialIndex);

  const handleKeyDown = useCallback(
    (e) => {
      let newIndex = selectedIndex;

      const isVertical = orientation === 'vertical' || orientation === 'both';
      const isHorizontal = orientation === 'horizontal' || orientation === 'both';

      switch (e.key) {
        case 'ArrowDown':
          if (isVertical) {
            e.preventDefault();
            newIndex = loop
              ? (selectedIndex + 1) % itemsLength
              : Math.min(selectedIndex + 1, itemsLength - 1);
          }
          break;
        case 'ArrowUp':
          if (isVertical) {
            e.preventDefault();
            newIndex = loop
              ? (selectedIndex - 1 + itemsLength) % itemsLength
              : Math.max(selectedIndex - 1, 0);
          }
          break;
        case 'ArrowRight':
          if (isHorizontal) {
            e.preventDefault();
            newIndex = loop
              ? (selectedIndex + 1) % itemsLength
              : Math.min(selectedIndex + 1, itemsLength - 1);
          }
          break;
        case 'ArrowLeft':
          if (isHorizontal) {
            e.preventDefault();
            newIndex = loop
              ? (selectedIndex - 1 + itemsLength) % itemsLength
              : Math.max(selectedIndex - 1, 0);
          }
          break;
        case 'Home':
          e.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          newIndex = itemsLength - 1;
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          onSelect?.(selectedIndex);
          return;
        default:
          return;
      }

      setSelectedIndex(newIndex);
    },
    [selectedIndex, itemsLength, loop, orientation, onSelect]
  );

  return {
    selectedIndex,
    setSelectedIndex,
    handleKeyDown,
    getItemProps: (index) => ({
      tabIndex: index === selectedIndex ? 0 : -1,
      'aria-selected': index === selectedIndex,
    }),
  };
};

// Import useState for useKeyboardNavigation
import { useState } from 'react';

/**
 * useAnnounce Hook
 * Announces messages to screen readers
 */
export const useAnnounce = () => {
  const announce = useCallback((message, priority = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  return announce;
};

export default {
  useFocusTrap,
  useKeyboardNavigation,
  useAnnounce,
};
