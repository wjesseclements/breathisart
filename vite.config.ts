import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'og.png'],
      manifest: {
        name: 'Lamptide — a quiet light to breathe by',
        short_name: 'Lamptide',
        description:
          'Slow breathing, paced by light: box breathing, 4-7-8, coherent breathing, the physiological sigh, and custom patterns. Works offline.',
        theme_color: '#0b1020',
        background_color: '#0b1020',
        display: 'standalone',
        id: '/',
        orientation: 'any',
        // The panic button from BACKLOG.md: the physiological sigh, one tap
        // from the home screen. It is the pattern with a zero lead-in for the
        // same reason.
        shortcuts: [
          {
            name: 'Physiological sigh',
            short_name: 'Sigh',
            description: 'Start the physiological sigh immediately',
            url: '/?p=in3-in1.5-out6&n=Physiological%20Sigh',
          },
        ],
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
