/**
 * Per-pattern accent hues (PRD §4), as data rather than Tailwind class
 * strings — `Pacer` writes them onto the orb as CSS custom properties, so the
 * rAF loop stays color-agnostic and adding a pattern is one row.
 *
 * The set is re-spaced on a roughly fixed-lightness ring so the five read as
 * siblings, with loudness derived from each protocol's arousal target rather
 * than from Tailwind's ramp:
 *
 * - **box** differentiates by *chroma* (near-neutral moonlight) rather than
 *   hue, so the default pattern is the most restrained thing in the app.
 * - **4-7-8** is the dimmest accent in the set, because it is the one you open
 *   with the lights off. Previously it was the loudest (violet-400 → indigo-600).
 * - Every body ramp stays within ~16° of hue, so nothing sRGB-interpolates
 *   through a grayed mauve the way rose-300 → indigo-500 did.
 *
 * Which layer carries identity is inverted from the old design: a blurred,
 * low-alpha field lands at C 0.019–0.043 no matter what you do to it, so the
 * halo can never be the identity signal. The full-chroma ring stroke is, and
 * `glow` is deliberately lighter and lower-chroma than `core` because real
 * bloom desaturates toward white as it falls off.
 *
 * Light mode inverts the physics — see `LIGHT_ACCENTS`.
 */
export interface AccentTokens {
  /** Brightest body stop, and the ring stroke: the identity carrier. */
  core: string;
  mid: string;
  deep: string;
  /** Darkest body stop, the shadow-side limb. */
  floor: string;
  /** The fields. Lighter and lower-chroma than core — bloom desaturates. */
  glow: string;
  /** Fresnel annulus. */
  rim: string;
  /** Fill light opposite the key. */
  bounce: string;
}

/**
 * Light-mode accents invert the physics. Glow is additive and cannot exist on
 * paper — adding light to #fcfaf4 produces nothing — so the orb becomes a
 * mid-tone mass (ink in water) and the bloom becomes a coloured *shadow* at
 * `multiply`. Cores sit at OKLCH L 0.62 so they clear 3:1 as a UI component,
 * which matters because the orb is a button.
 */
export const LIGHT_ACCENTS: Record<string, AccentTokens> = {
  box: {
    core: '#758999',
    mid: '#5e6f7d',
    deep: '#46545f',
    floor: '#343f48',
    glow: '#a8bac8',
    rim: '#788a9a',
    bounce: '#96aab4',
  },
  '478': {
    core: '#927aad',
    mid: '#76628c',
    deep: '#5b4b6e',
    floor: '#443853',
    glow: '#c2adda',
    rim: '#8f7aa6',
    bounce: '#ab94bd',
  },
  coherent: {
    core: '#6087c2',
    mid: '#4d6d9f',
    deep: '#3a537d',
    floor: '#2c3f5e',
    glow: '#96b9ed',
    rim: '#6285b5',
    bounce: '#8aa8cc',
  },
  calm: {
    core: '#639470',
    mid: '#4f775b',
    deep: '#3c5c46',
    floor: '#2d4535',
    glow: '#99c4a4',
    rim: '#659672',
    bounce: '#8cb397',
  },
  sigh: {
    core: '#b67258',
    mid: '#955c46',
    deep: '#764634',
    floor: '#593527',
    glow: '#e4a78f',
    rim: '#b07458',
    bounce: '#cb9679',
  },
};

export const DEFAULT_ACCENT: AccentTokens = {
  core: '#acc1d1',
  mid: '#8397ab',
  deep: '#54717d',
  floor: '#33424e',
  glow: '#d2e0ec',
  rim: '#e2ecf5',
  bounce: '#9fc6c8',
};

export const PATTERN_ACCENTS: Record<string, AccentTokens> = {
  // Moonlight — near-neutral, OKLCH H242 C0.032. The default earns the most restraint.
  box: DEFAULT_ACCENT,
  // Plum — H306 C0.080 L0.68, the dimmest of the five: 4-7-8 is the lights-off protocol.
  '478': {
    core: '#a48cc0',
    mid: '#7f68a0',
    deep: '#4a407a',
    floor: '#322b57',
    glow: '#c0afd4',
    rim: '#d4c8e3',
    bounce: '#b590b0',
  },
  // H258 C0.105 — the most saturated, for the most sustained protocol.
  coherent: {
    core: '#87b3f4',
    mid: '#5e8fd8',
    deep: '#0066a1',
    floor: '#0a4a72',
    glow: '#b4d3ff',
    rim: '#cfe2ff',
    bounce: '#7fc0d8',
  },
  // Sage — H152 C0.078.
  calm: {
    core: '#92c69f',
    mid: '#6da37c',
    deep: '#247757',
    floor: '#14513c',
    glow: '#bee2c6',
    rim: '#d2eed8',
    bounce: '#9ac9bd',
  },
  // Apricot — H42 C0.098, the only warm one: the sigh is the fast-reset pattern.
  sigh: {
    core: '#fbaf92',
    mid: '#d8866b',
    deep: '#a55c24',
    floor: '#713d16',
    glow: '#ffd6c1',
    rim: '#ffe4d5',
    bounce: '#f0b78f',
  },
};

/** Hex -> "r g b" so the value works with `rgb(var(--x) / <alpha>)`. */
export function triplet(hex: string): string {
  const h = hex.replace('#', '');
  return `${parseInt(h.slice(0, 2), 16)} ${parseInt(h.slice(2, 4), 16)} ${parseInt(h.slice(4, 6), 16)}`;
}

const VAR_NAMES: Array<[string, keyof AccentTokens]> = [
  ['--accent-core', 'core'],
  ['--accent-mid', 'mid'],
  ['--accent-deep', 'deep'],
  ['--accent-floor', 'floor'],
  ['--accent-glow', 'glow'],
  ['--accent-rim', 'rim'],
  ['--accent-bounce', 'bounce'],
];

/**
 * Applies an accent to the document root.
 *
 * Root rather than the orb, because the *room* needs the accent too — the sky
 * glow and the cast light are painted by `Background`, which is not a
 * descendant of the pacer. Writing custom properties on the root does force a
 * style recalc for every subscriber, which is why the rAF loop never touches
 * them: this runs only when the pattern changes.
 */
export function applyAccent(patternId: string, isDark: boolean): void {
  const set = isDark ? PATTERN_ACCENTS : LIGHT_ACCENTS;
  const a = set[patternId] ?? set.box ?? DEFAULT_ACCENT;
  const root = document.documentElement;
  for (const [name, key] of VAR_NAMES) root.style.setProperty(name, triplet(a[key]));
}
