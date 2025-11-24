import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.seedly.app',
  appName: 'Seedly',
  webDir: 'dist',

  // 👇 Add the plugins block here (Don't forget the comma above!)
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#234232", // Your Dark Green from Figma
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;