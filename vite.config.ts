import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/CTI-CMM-assessment-webapp/',
  plugins: [react(), tailwindcss()],
})
