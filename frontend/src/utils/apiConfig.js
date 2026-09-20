export const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    if (hostname.includes('vercel.app')) {
      return 'https://teampulse-gx6p.onrender.com';
    }
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
    // In local development or same-origin deployments, relative path avoids CORS preflight and IPv6 routing hangs
    return '';
  }
  return import.meta.env.VITE_API_URL || '';
};
