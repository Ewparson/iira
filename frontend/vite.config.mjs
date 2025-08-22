import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    # Remove polling for speed (WSL2 file events work fine on /mnt/c for most setups)
    watch: { usePolling: false }
  },
  optimizeDeps: {
    // Prebundle big libs so cold start is fast
    include: ['react', 'react-dom', 'gsap', '@stripe/react-stripe-js', '@stripe/stripe-js'],
  },
  esbuild: { legalComments: 'none' },
  build: { sourcemap: false, target: 'es2022' }
})
