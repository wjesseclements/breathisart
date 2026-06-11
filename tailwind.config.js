/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark-first palette (PRD §4): deep navy/charcoal background,
        // teal→indigo accents for the orb gradient.
        night: {
          DEFAULT: '#0b1020',
          soft: '#11172b',
          mist: '#1a2238',
        },
        breath: {
          teal: '#2dd4bf',
          indigo: '#6366f1',
        },
        whisper: 'rgba(226, 232, 240, 0.72)',
      },
      fontFamily: {
        display: ['system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
