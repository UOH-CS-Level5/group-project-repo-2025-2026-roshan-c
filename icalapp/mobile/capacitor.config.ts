import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ddd.timetable',
  appName: 'DDD Timetable',
  webDir: 'dist',
  server: {
    cleartext: true,
  },
};

export default config;
