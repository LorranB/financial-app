import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  base: './', // essencial: caminhos relativos, exigido pelo Electron e pelo Capacitor
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
});
