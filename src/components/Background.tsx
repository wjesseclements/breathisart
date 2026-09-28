import type { CSSProperties, RefObject } from 'react';
import { GRAIN_SIZE, GRAIN_URI } from './grain';
import { usePrefersReducedMotion } from './Pacer/usePrefersReducedMotion';

/**
 * The room (PLAN_V2 slice 16).
 *
 * The orb is already a centred radial glow, so putting a second one behind it
 * destroys the figure/ground contrast its own field needs. The environment is
 * therefore a vertical ramp plus a high backlight, and the orb stays the single
 * brightest mass in frame.
 *
 * Layer 3 is the one that matters: its opacity is written by the *pacer's* rAF
 * loop from the far-field follower, so the room brightens and dims with the
 * breath, trailing it by ~440ms. One opacity write per frame, and it is what
 * turns a backdrop into a room that answers the lamp.
 */

/** 176deg, not 180: a 4 degree tilt reads as photographed, not generated. */
const RAMP: CSSProperties = {
  background:
    'linear-gradient(176deg, rgb(var(--scene-top)) 0%, rgb(var(--scene-mid)) 44%, rgb(var(--scene-low)) 78%, rgb(var(--scene-floor)) 100%)',
};

/** Anchored ABOVE the orb, so the orb is backlit rather than front-lit. */
const SKY: CSSProperties = {
  background:
    'radial-gradient(ellipse 128% 64% at 50% 14%, rgb(var(--accent-glow) / 0.20) 0%, rgb(var(--accent-glow) / 0.07) 42%, transparent 74%)',
};

/** Centred on the orb. Opacity is driven by the pacer, not by CSS. */
const CAST: CSSProperties = {
  background:
    'radial-gradient(ellipse 86% 52% at 50% 50%, rgb(var(--accent-glow) / 0.13) 0%, transparent 70%)',
};

/**
 * Frames the orb and hides the sky and cast layers' outer edges.
 *
 * Softened from the direction's 0.30/0.62, which bottomed the corners out near
 * rgb(3,5,16) — dark enough to read as a vignette *filter* rather than a room.
 *
 * On the numbers: the RAMP alone is 1.18:1 top-to-bottom, close to the 1.22:1
 * the direction specifies. The composed scene measures 1.43:1, because the sky
 * backlight lifts the top — that is the backlight doing its job, not the ramp
 * being wrong. Worth stating, because the two are easy to confuse when tuning.
 */
const VIGNETTE: CSSProperties = {
  background:
    'radial-gradient(ellipse 96% 84% at 50% 44%, transparent 38%, rgb(var(--vignette) / 0.18) 74%, rgb(var(--vignette) / 0.40) 100%)',
};

/**
 * Grain as dither, on top. `soft-light` barely moves backdrops near black, so
 * the old 0.04 landed under 0.5/255 on dark and rendered nothing — while the
 * same layer over #f1f5f9 did register, giving light mode MORE grain than
 * dark, which is backwards. `overlay` at 0.062 fixes both.
 */
const GRAIN: CSSProperties = {
  backgroundImage: GRAIN_URI,
  backgroundSize: GRAIN_SIZE,
  opacity: 0.062,
  mixBlendMode: 'overlay',
};

interface BackgroundProps {
  /**
   * Written by the pacer's frame loop. Optional: the research page renders the
   * same room with no pacer in it.
   */
  roomLightRef?: RefObject<HTMLDivElement>;
}

export function Background({ roomLightRef }: BackgroundProps) {
  const reducedMotion = usePrefersReducedMotion();
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0" style={RAMP} />
      <div
        className={`blend-glow absolute inset-0 ${reducedMotion ? 'opacity-[0.58]' : 'animate-sky-drift motion-reduce:animate-none'}`}
        style={SKY}
      />
      <div
        ref={roomLightRef}
        className="blend-glow absolute inset-0"
        // Reduced motion holds it static and lit; otherwise the pacer takes over
        // on the first frame.
        style={{ ...CAST, opacity: reducedMotion ? 0.34 : 0.18 }}
      />
      <div className="absolute inset-0" style={VIGNETTE} />
      <div className="absolute inset-0" style={GRAIN} />
    </div>
  );
}
