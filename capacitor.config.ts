import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.seedly.grow',
  appName: 'Seedly Grow',
  webDir: 'dist',

  plugins: {
    // 👇 Added Firebase Auth Configuration
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com"],
    },

    // Existing Splash Screen Configuration
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#435043", // Your Dark Green
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
