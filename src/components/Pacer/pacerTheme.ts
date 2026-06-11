/**
 * Per-pattern accent hues (PRD §4). Full literal class strings so
 * Tailwind's scanner picks them up at build time.
 */
export interface PacerAccent {
  /** Gradient for the accent layer that breathes over the indigo base. */
  accentLayer: string;
  /** Tint for the blurred halo layers. */
  halo: string;
  /** currentColor source for the progress ring sweep. */
  ring: string;
}

export const DEFAULT_ACCENT: PacerAccent = {
  accentLayer: 'bg-gradient-to-br from-breath-teal to-breath-indigo',
  halo: 'bg-breath-teal',
  ring: 'text-breath-teal',
};

export const PATTERN_ACCENTS: Record<string, PacerAccent> = {
  box: DEFAULT_ACCENT,
  '478': {
    accentLayer: 'bg-gradient-to-br from-violet-400 to-indigo-600',
    halo: 'bg-violet-400',
    ring: 'text-violet-300',
  },
  coherent: {
    accentLayer: 'bg-gradient-to-br from-sky-400 to-blue-600',
    halo: 'bg-sky-400',
    ring: 'text-sky-300',
  },
  calm: {
    accentLayer: 'bg-gradient-to-br from-emerald-400 to-teal-600',
    halo: 'bg-emerald-400',
    ring: 'text-emerald-300',
  },
  sigh: {
    accentLayer: 'bg-gradient-to-br from-rose-300 to-indigo-500',
    halo: 'bg-rose-300',
    ring: 'text-rose-300',
  },
};
