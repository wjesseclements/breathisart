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
        countdown: 'rgb(var(--countdown) / <alpha-value>)',

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
        // `ui-serif` is a SYSTEM font: New York on macOS/iOS, Georgia on
        // Windows, Noto Serif on Android. Zero bytes on an offline-first PWA,
        // and instantly distinguishable from the SF/Segoe UI chrome -- which
        // the old ['system-ui','sans-serif'] was not, making every
        // `font-display` usage a no-op. Known cost: Georgia has no light
        // weight, so the phase word renders at 400 on Windows.
        display: [
          'ui-serif',
          'Iowan Old Style',
          'Palatino Linotype',
          'Georgia',
          'Noto Serif',
          'serif',
        ],
      },
      // Seven named roles. The app had 24x text-sm, 10x text-xs, two isolated
      // text-3xl and NOTHING between 20px and 30px -- with no mid-scale, every
      // attempt at hierarchy had to be made with color, which is why the idle
      // screen read as five equal-weight bands. Ratios ~1.18 at the bottom for
      // dense meta, ~1.43 at the top for drama.
      fontSize: {
        label: ['0.6875rem', { lineHeight: '1', letterSpacing: '0.16em' }],
        meta: ['0.8125rem', { lineHeight: '1.5', letterSpacing: '0.01em' }],
        ui: ['0.9375rem', { lineHeight: '1.4' }],
        body: ['1.0625rem', { lineHeight: '1.65' }],
        lede: ['1.25rem', { lineHeight: '1.45' }],
        title: ['1.75rem', { lineHeight: '1.15', letterSpacing: '-0.012em' }],
        // The phase word's usual size. `display` is sized for a single short
        // word; two-word phrases like "Breathe out" wrap at that scale, and a
        // wrapped hero collides with everything under it.
        hero: ['clamp(1.75rem,6vw,2.75rem)', { lineHeight: '1', letterSpacing: '-0.018em' }],
        display: ['clamp(2.5rem,8.5vw,4.25rem)', { lineHeight: '1', letterSpacing: '-0.022em' }],
      },
      screens: {
        short: { raw: '(max-height: 500px)' },
        // A phone on its side, or a very short desktop window: too short for
        // the portrait stack and wide enough for two columns. Declared after
        // `short` so its utilities are emitted later and win where both match.
        land: { raw: '(max-height: 500px) and (min-aspect-ratio: 4/3)' },
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
        // 320ms each half, sequenced not overlapped, with a symmetric ease so
        // neither end of the swap has a hard edge.
        'word-in': 'word-in 320ms cubic-bezier(0.4, 0, 0.2, 1) 320ms both',
        'word-out': 'word-out 320ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
        ambient: 'ambient 11s ease-in-out infinite',
        'sky-drift': 'sky-drift 27s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
