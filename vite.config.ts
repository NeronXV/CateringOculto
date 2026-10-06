import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { localAdmin } from './server/localAdmin';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), localAdmin()],
  server: {
    port: 5180,
    strictPort: true,
    host: '127.0.0.1',
    fs: {deny:['.env','.env.*','*.{crt,pem}','**/.git/**','**/.local-data/**']}
  }
});
