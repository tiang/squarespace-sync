import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@ra/ui': path.resolve(__dirname, '../ui/src'),
    },
  },
  server: {
    host: true,
    port: 5173,
  },
});
