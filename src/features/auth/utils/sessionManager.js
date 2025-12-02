// Simple session storage for admin/manager/chef/waiter portal

const KEY = 'praahis_admin_session';

export const saveSession = ({ userId, role, restaurantId }) => {
  try {
    const payload = { userId, role, restaurantId, ts: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    // ignore storage issues
  }
};

export const getSession = () => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearSession = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
};

export default { saveSession, getSession, clearSession };
