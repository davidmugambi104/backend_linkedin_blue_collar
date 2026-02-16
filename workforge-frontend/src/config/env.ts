/**
 * Environment configuration
 * Loads and validates all required environment variables
 */

export const ENV = {
  // API Configuration
  VITE_API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  VITE_WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:5000',

  // App Configuration
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME || 'WorkForge',
  VITE_APP_ENV: import.meta.env.MODE || 'development',

  // Feature Flags
  VITE_ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  VITE_ENABLE_PWA: import.meta.env.VITE_ENABLE_PWA === 'true',

  // Third-party Services
  VITE_STRIPE_PUBLIC_KEY: import.meta.env.VITE_STRIPE_PUBLIC_KEY || '',
  VITE_MAPBOX_TOKEN: import.meta.env.VITE_MAPBOX_TOKEN || '',

  // Auth
  VITE_AUTH_TOKEN_KEY: import.meta.env.VITE_AUTH_TOKEN_KEY || 'workforge_token',
  VITE_AUTH_REFRESH_KEY: import.meta.env.VITE_AUTH_REFRESH_KEY || 'workforge_refresh',
} as const;

// Validation
if (!ENV.VITE_API_URL) {
  console.warn('VITE_API_URL not configured, using default http://localhost:5000/api');
}
