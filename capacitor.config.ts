import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: "com.homilivo.app",
  appName: 'Homilivo',
  webDir: 'dist',
  
  /* ✅ Deep Linking - Enable app URL scheme handling */
  /* When user clicks homilivo://property/123, the app opens */
  /* Supported formats:
     - homilivo://property/123 (view property)
     - homilivo://review/123 (review property)
     - homilivo://auth?token=xyz (authentication)
  */
  scheme: 'homilivo',
  
  /* Production-safe StatusBar & Android configuration */
  plugins: {
    StatusBar: {
      /* CRITICAL: Don't overlay content with status bar */
      /* Use LIGHT style to work with light backgrounds */
      style: 'LIGHT',
      /* Match app background color */
      backgroundColor: '#0b1220',
      /* Important: Don't overlay the webview */
      overlay: false,
    },
  },
  
  /* Android-specific config */
  android: {
    /* Allow edge-to-edge rendering (needed for safe-area to work) */
    /* This is handled by viewport-fit=cover in HTML */
  },
};

export default config;
