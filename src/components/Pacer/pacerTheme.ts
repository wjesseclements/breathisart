/**
 * Per-pattern accent hues (PRD §4).
 *
 * These used to be literal Tailwind class strings, purely so the scanner would
 * pick them up at build time. That made the accents unable to express two
 * themes and forced every new pattern to touch CSS. They are plain hex data
 * now; `Pacer` applies them as inline styles, so the rAF loop stays
 * color-agnostic and adding a pattern is one row.
 *
 * Values are unchanged from the Tailwind classes they replace (PLAN_V2 slice
 * 14 is a refactor with no visual intent). Slice 20 adds the `light` variants.
 */
export interface PacerAccent {
  /** Gradient endpoints for the accent layer that breathes over the base. */
  accentFrom: string;
  accentTo: string;
  /** Tint for the blurred halo layers. */
  halo: string;
  /** Stroke for the progress ring sweep. */
  ring: string;
}

export const DEFAULT_ACCENT: PacerAccent = {
  accentFrom: '#2dd4bf', // breath-teal
  accentTo: '#6366f1', // breath-indigo
  halo: '#2dd4bf', // breath-teal
  ring: '#2dd4bf', // breath-teal
};

export const PATTERN_ACCENTS: Record<string, PacerAccent> = {
  box: DEFAULT_ACCENT,
  '478': {
    accentFrom: '#a78bfa', // violet-400
    accentTo: '#4f46e5', // indigo-600
    halo: '#a78bfa', // violet-400
    ring: '#c4b5fd', // violet-300
  },
  coherent: {
    accentFrom: '#38bdf8', // sky-400
    accentTo: '#2563eb', // blue-600
    halo: '#38bdf8', // sky-400
    ring: '#7dd3fc', // sky-300
  },
  calm: {
    accentFrom: '#34d399', // emerald-400
    accentTo: '#0d9488', // teal-600
    halo: '#34d399', // emerald-400
    ring: '#6ee7b7', // emerald-300
  },
  sigh: {
    accentFrom: '#fda4af', // rose-300
    accentTo: '#6366f1', // indigo-500
    halo: '#fda4af', // rose-300
    ring: '#fda4af', // rose-300
  },
};
