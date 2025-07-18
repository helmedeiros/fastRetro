import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { retroSyncPlugin } from './vite-ws-plugin';

export default defineConfig({
  plugins: [react(), retroSyncPlugin()],
  base: './',
});
