/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Semantic tokens (PLAN_V2 slice 14). Values live in src/index.css as
        // raw channel triplets so Tailwind's alpha modifiers keep working:
        // `text-ink-muted/60` resolves, `var(--ink-muted)` alone would not.
        surface: {
          page: 'rgb(var(--surface-page) / <alpha-value>)',
          raised: 'rgb(var(--surface-raised) / <alpha-value>)',
          sunken: 'rgb(var(--surface-sunken) / <alpha-value>)',
          selected: 'rgb(var(--surface-selected) / <alpha-value>)',
        },
        line: {
          DEFAULT: 'rgb(var(--line) / <alpha-value>)',
          strong: 'rgb(var(--line-strong) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--ink) / <alpha-value>)',
          max: 'rgb(var(--ink-max) / <alpha-value>)',
          strong: 'rgb(var(--ink-strong) / <alpha-value>)',
          muted: 'rgb(var(--ink-muted) / <alpha-value>)',
          faint: 'rgb(var(--ink-faint) / <alpha-value>)',
          // The quiet display ink: the phase word and font-display headings.
          display: 'rgb(var(--ink-display) / <alpha-value>)',
        },

        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          strong: 'rgb(var(--accent-strong) / <alpha-value>)',
        },
        focus: 'rgb(var(--focus) / <alpha-value>)',

        // Pacer-only literals (PRD §4). Slices 15/16 replace these with the
        // per-pattern accent tokens set as custom properties on the orb.
        night: {
          DEFAULT: '#0b1020',
          soft: '#11172b',
          mist: '#1a2238',
        },
        breath: {
          teal: '#2dd4bf',
          indigo: '#6366f1',
        },
      },
      fontFamily: {
        display: ['system-ui', 'sans-serif'],
      },
      keyframes: {
        'word-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'word-out': { from: { opacity: '1' }, to: { opacity: '0' } },
        // A lamp breathing in a still room, not a hovering UI element.
        ambient: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)' },
          '50%': { transform: 'translate3d(0, -4px, 0) scale(1.015)' },
        },
        // Deliberately NOT phase-locked and deliberately slower than any
        // breath: the sky must stay environment, never instruction. The old
        // 18s sat close enough to a box cycle (16s) to drift in and out of
        // phase with the pacer and read as a contradictory cue.
        'sky-drift': {
          '0%, 100%': { opacity: '0.58' },
          '55%': { opacity: '0.8' },
        },
      },
      animation: {
        'word-in': 'word-in 600ms ease-out forwards',
        'word-out': 'word-out 600ms ease-out forwards',
        ambient: 'ambient 11s ease-in-out infinite',
        'sky-drift': 'sky-drift 27s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
