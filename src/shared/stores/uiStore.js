/**
 * UI Store - Zustand
 * Global UI state management for modals, sidebars, themes, etc.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const initialState = {
  // Sidebar state
  sidebarOpen: false,
  sidebarCollapsed: false,

  // Modal state
  activeModal: null,
  modalData: null,

  // Theme
  theme: 'light',

  // Loading overlays
  globalLoading: false,
  loadingMessage: '',

  // Notifications/Alerts
  notifications: [],

  // Mobile state
  isMobile: false,

  // Feature flags
  features: {
    realTimeSync: true,
    darkMode: false,
    animations: true,
  },
};

export const useUIStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      // Sidebar actions
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      toggleSidebarCollapse: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      // Modal actions
      openModal: (modalId, data = null) => set({ activeModal: modalId, modalData: data }),

      closeModal: () => set({ activeModal: null, modalData: null }),

      isModalOpen: (modalId) => get().activeModal === modalId,

      // Theme actions
      setTheme: (theme) => {
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(theme);
        set({ theme });
      },

      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light';
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(newTheme);
        set({ theme: newTheme });
      },

      // Loading actions
      setGlobalLoading: (loading, message = '') =>
        set({ globalLoading: loading, loadingMessage: message }),

      showLoading: (message = 'Loading...') =>
        set({ globalLoading: true, loadingMessage: message }),

      hideLoading: () => set({ globalLoading: false, loadingMessage: '' }),

      // Notification actions
      addNotification: (notification) => {
        const id = Date.now().toString();
        const newNotification = {
          id,
          type: 'info',
          duration: 5000,
          ...notification,
        };

        set((state) => ({
          notifications: [...state.notifications, newNotification],
        }));

        // Auto-dismiss if duration is set
        if (newNotification.duration > 0) {
          setTimeout(() => {
            get().removeNotification(id);
          }, newNotification.duration);
        }

        return id;
      },

      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      clearNotifications: () => set({ notifications: [] }),

      // Mobile detection
      setIsMobile: (isMobile) => set({ isMobile }),

      checkMobile: () => {
        const isMobile = window.innerWidth < 768;
        set({ isMobile });
        return isMobile;
      },

      // Feature flags
      setFeature: (feature, enabled) =>
        set((state) => ({
          features: { ...state.features, [feature]: enabled },
        })),

      isFeatureEnabled: (feature) => get().features[feature] ?? false,

      // Reset
      reset: () => set({ ...initialState }),
    }),
    {
      name: 'praahis-ui-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist user preferences
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        features: state.features,
      }),
    }
  )
);

// Selector hooks
export const useSidebarOpen = () => useUIStore((state) => state.sidebarOpen);
export const useSidebarCollapsed = () => useUIStore((state) => state.sidebarCollapsed);
export const useTheme = () => useUIStore((state) => state.theme);
export const useGlobalLoading = () => useUIStore((state) => state.globalLoading);
export const useNotifications = () => useUIStore((state) => state.notifications);
export const useIsMobile = () => useUIStore((state) => state.isMobile);

export default useUIStore;
