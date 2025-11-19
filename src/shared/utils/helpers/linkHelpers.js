// Helpers to generate internal and shareable external links
// Internal navigation relies on RestaurantContext (no query needed)
// External/printed/shareable links include ?restaurant=<slug>

const getOrigin = () => {
  try {
    return window?.location?.origin || '';
  } catch {
    return '';
  }
};

const withQuery = (url, params) => {
  const usp = new URLSearchParams(params || {});
  const q = usp.toString();
  if (!q) return url;
  return `${url}${url.includes('?') ? '&' : '?'}${q}`;
};

// External links (absolute) for sharing/printing
export const getChefLoginLink = (slug) => {
  const base = `${getOrigin()}/chef/login`;
  return withQuery(base, { restaurant: slug });
};

export const getWaiterLoginLink = (slug) => {
  const base = `${getOrigin()}/waiter/login`;
  return withQuery(base, { restaurant: slug });
};

export const getQrTableLink = (slug, tableNumberOrId) => {
  const base = `${getOrigin()}/table/${encodeURIComponent(String(tableNumberOrId))}`;
  return withQuery(base, { restaurant: slug });
};

export default {
  getChefLoginLink,
  getWaiterLoginLink,
  getQrTableLink,
};
