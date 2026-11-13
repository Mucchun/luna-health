import type { CapacitorConfig } from '@capacitor/cli';

// The app is fully on-device — all health data and AI run locally (no backend to
// host), so no API URL is needed for a production build. The only optional server
// is the shared anonymous community: set VITE_COMMUNITY_API_URL before building
// to connect it across devices, e.g.
//   VITE_COMMUNITY_API_URL=https://luna-health-api.fly.dev npx cap sync ios

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
      // 'Light' = dark text, for the app's light pink background.
      style: 'Light',
      backgroundColor: '#FDE8F0',
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
