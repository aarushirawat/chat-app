import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  preview: {
    allowedHosts: [
      'chat-application-fiuv.onrender.com',
      'another-host.com'
    ]
  },
  plugins: [react()],
})
