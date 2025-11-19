/**
 * CLEAR BROWSER STORAGE - Development Helper
 * 
 * Run this in your browser console to clear all Supabase sessions
 * and start fresh with login.
 * 
 * Instructions:
 * 1. Open browser DevTools (F12 or Cmd+Option+I)
 * 2. Go to Console tab
 * 3. Copy and paste this entire code
 * 4. Press Enter
 * 5. Refresh the page
 */

// Clear all localStorage
localStorage.clear();

// Clear all sessionStorage  
sessionStorage.clear();

// Clear IndexedDB (where Supabase stores sessions)
if (window.indexedDB) {
  indexedDB.databases().then((databases) => {
    databases.forEach((db) => {
      indexedDB.deleteDatabase(db.name);
      console.log(`Deleted database: ${db.name}`);
    });
  });
}

// Clear cookies
document.cookie.split(";").forEach((c) => {
  document.cookie = c
    .replace(/^ +/, "")
    .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});

console.log('✅ All browser storage cleared!');
console.log('📌 Now refresh the page (Cmd+R or F5)');
