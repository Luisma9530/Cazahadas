import { defineConfig, mergeConfig } from 'vite';
import { defineConfig as defineVitestConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default mergeConfig(
  defineConfig({
    plugins: [react()],
    server: {
      host: "0.0.0.0",
    }
  }),
  defineVitestConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts', // opcional
    },
  })
);
