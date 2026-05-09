import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.savindu.fitlock',
  appName: 'FitLock',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: ['*'],
  },
  android: {
    allowMixedContent: true,
  },
  plugins: {
    AdMob: {
      appId: 'ca-app-pub-8224368007922953~6404719953',
    }
  }
};

export default config;
