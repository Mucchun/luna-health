import type { CapacitorConfig } from '@capacitor/cli';

// Set VITE_API_URL before building for App Store, e.g.:
// VITE_API_URL=https://luna-health-api.fly.dev npx cap sync ios
const API_URL = process.env.VITE_API_URL || '';

const config: CapacitorConfig = {
  appId: 'com.lunahealth.app',
  appName: 'Luna Health',
  webDir: 'dist',
  ios: {
    backgroundColor: '#FDE8F0',
    contentInset: 'automatic',
    scrollEnabled: true,
  },
  // In development with livereload, point to the Vite dev server
  ...(process.env.CAPACITOR_LIVE_RELOAD ? {
    server: { url: process.env.CAPACITOR_LIVE_RELOAD, cleartext: true },
  } : {}),
  plugins: {
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#1A0810',
      overlaysWebView: false,
    },
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1200,
      backgroundColor: '#FDE8F0',
      showSpinner: false,
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
