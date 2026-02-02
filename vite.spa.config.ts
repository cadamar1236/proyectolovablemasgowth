import { defineConfig } from 'vite'

// Configuración para build tradicional SPA (sin SSR)
export default defineConfig({
  publicDir: 'public',
  build: {
    outDir: 'dist-spa',
    emptyOutDir: true,
    rollupOptions: {
      input: './index.html'
    }
  }
})
