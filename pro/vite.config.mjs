import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import mdx from '@mdx-js/rollup';

export default defineConfig({
  plugins: [mdx(), react()],
  server: {
    port: 3000,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  },
});
