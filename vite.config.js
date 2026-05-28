import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { VitePWA } from 'vite-plugin-pwa'

const isDev = process.env.NODE_ENV !== 'production'

export default defineConfig({
  plugins: [
    react(),
    // basicSsl solo en desarrollo (para GPS en móvil local)
    isDev && basicSsl(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'LluviaYa',
        short_name: 'LluviaYa',
        description: 'Reporta el clima en tiempo real',
        theme_color: '#0f172a',
        background_color: '#050a14',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  server: {
    host: true,
    https: true,
  },
})
