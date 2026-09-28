/**
 * Shared film-grain tile, used as dither by both the scene and the orb body.
 *
 * The `feColorMatrix saturate=0` is load-bearing: `feTurbulence` alone emits
 * independent R/G/B noise, i.e. colored confetti, not grain. Desaturating it
 * makes it read as film and lets it do its real job — the orb's body ramp
 * spans ~70 luminance steps over 272px, which bands visibly through the
 * mid-roll on any 8-bit panel without a dither layer on top.
 *
 * Tiled at 112px rather than the source's 160px: at DPR 2 a 160px tile
 * upscales to render 2x coarser than authored.
 */
export const GRAIN_URI =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='112' height='112'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/** Tile size in CSS pixels. */
export const GRAIN_SIZE = '112px 112px';
