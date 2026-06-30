import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(() => ({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
    // Allow external connections for Capacitor livereload
    host: true,
  },
  define: {
    // Expose the API base URL — override with VITE_API_URL env var when backend is hosted
    '__API_BASE__': JSON.stringify(process.env.VITE_API_URL || ''),
  },
}))
