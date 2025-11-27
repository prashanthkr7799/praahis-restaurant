/**
 * LocalStorage Migration Helper
 * 
 * This script helps migrate localStorage keys from legacy "mealmate" prefix
 * to new "praahis" prefix for existing users.
 * 
 * Add this to your app's initialization code (e.g., in main.jsx or App.jsx)
 * to automatically migrate user data.
 */

import logger from '@shared/utils/helpers/logger';

export function migrateLegacyLocalStorage() {
  try {
    const migrations = [
      { old: 'mealmate_restaurant_ctx', new: 'praahis_restaurant_ctx' },
      { old: 'mealmate_admin_session', new: 'praahis_admin_session' },
      { old: 'mealmate_recent_order', new: 'praahis_recent_order' },
      { old: 'mealmate_chef_auth', new: 'praahis_chef_auth' },
      { old: 'mealmate_waiter_auth', new: 'praahis_waiter_auth' },
    ];

    let migratedCount = 0;

    // Migrate exact key matches
    migrations.forEach(({ old, new: newKey }) => {
      const value = localStorage.getItem(old);
      if (value !== null) {
        localStorage.setItem(newKey, value);
        localStorage.removeItem(old);
        migratedCount++;
        logger.log(`✅ Migrated: ${old} → ${newKey}`);
      }
    });

    // Migrate prefixed keys (cart and session)
    const prefixMigrations = [
      { old: 'mealmate_cart_', new: 'praahis_cart_' },
      { old: 'mealmate_session_', new: 'praahis_session_' },
    ];

    Object.keys(localStorage).forEach(key => {
      prefixMigrations.forEach(({ old, new: newPrefix }) => {
        if (key.startsWith(old)) {
          const value = localStorage.getItem(key);
          const newKey = key.replace(old, newPrefix);
          localStorage.setItem(newKey, value);
          localStorage.removeItem(key);
          migratedCount++;
          logger.log(`✅ Migrated: ${key} → ${newKey}`);
        }
      });
    });

    if (migratedCount > 0) {
      logger.log(`🎉 Successfully migrated ${migratedCount} localStorage keys`);
    }

  } catch (error) {
    console.error('Error migrating localStorage:', error);
  }
}

// Usage: Call this once on app initialization
// Example in main.jsx or App.jsx:
// import { migrateLegacyLocalStorage } from './path/to/this/file';
// migrateLegacyLocalStorage();
