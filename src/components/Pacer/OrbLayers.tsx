import type { CSSProperties, RefObject } from 'react';
import { GRAIN_SIZE, GRAIN_URI } from '../grain';

/**
 * The orb's layer stack (PLAN_V2 slice 15), built to one rule:
 *
 *   **No node carries both paint and motion.** Every animated node writes only
 *   `transform` / `opacity`; every node that paints is static.
 *
 * There is no `filter` anywhere. Both 64px blurs are gone — every soft edge is
 * authored into gradient stops plus one static `mask-image`. That is strictly
 * cheaper (Chrome re-rasterizes a blur whenever the animated scale drifts past
 * its raster-scale tolerance) and it removes the bubble-inside-a-bubble knee
 * the blurred discs produced.
 *
 * Gradients must all reach `transparent` inside their own box (76–97%). With
 * no blur to hide an edge, any stop that doesn't is a visible boundary.
 */
type Div = RefObject<HTMLDivElement>;

/**
 * Each layer takes its own ref prop rather than a single bag. A bag reads as
 * ref access during render to `react-hooks/refs`, and this is clearer anyway.
 */
export interface OrbLayerProps {
  reducedMotion: boolean;
  orb: Div;
  innerLight: Div;
  bounce: Div;
  depth: Div;
  causticA: Div;
  causticB: Div;
  waterline: Div;
  rim: Div;
  fieldNear: Div;
  fieldFar: Div;
  ground: Div;
}

/**
 * Atmosphere is cooler than its source, so the far field is violet-shifted.
 *
 * Stop placement matters more than peak alpha here: this layer's box is 1.92x
 * the orb, so the orb's silhouette hides everything inside ~36% of the
 * gradient radius. Energy concentrated at the centre is energy you never see.
 * The ramp is therefore shifted outward, brightest just past the limb.
 */
const FIELD_FAR: CSSProperties = {
  background:
    'radial-gradient(circle farthest-side at 50% 46%, rgb(var(--field-far) / 0.16) 0%, rgb(var(--field-far) / 0.15) 34%, rgb(var(--field-far) / 0.10) 50%, rgb(var(--field-far) / 0.042) 68%, rgb(var(--field-far) / 0.012) 82%, transparent 92%)',
};

/**
 * Six stops so there is no plateau and no knee. This replaces blur-3xl.
 * Same reasoning as the far field: the orb's edge sits at ~48% of this
 * gradient's radius, so that is where the bloom has to be brightest.
 */
const FIELD_NEAR: CSSProperties = {
  background:
    'radial-gradient(circle farthest-side at 50% 44%, rgb(var(--accent-glow) / 0.34) 0%, rgb(var(--accent-glow) / 0.32) 40%, rgb(var(--accent-glow) / 0.22) 52%, rgb(var(--accent-glow) / 0.10) 66%, rgb(var(--accent-glow) / 0.03) 79%, transparent 90%)',
};

/** Contact shadow. This is what makes it an object rather than a sprite. */
const GROUND: CSSProperties = {
  background:
    'radial-gradient(ellipse at 50% 50%, rgba(2,4,14,0.55) 0%, rgba(2,4,14,0.22) 45%, transparent 76%)',
};

/**
 * The body. Four stops so the luminance derivative is non-monotonic —
 * shoulder, fast mid-roll, dark limb — which is what a lit sphere does and a
 * two-stop linear gradient cannot.
 *
 * The mask is the entire edge story. Its centre sits at 40%/36%, so the
 * 96%→100% dissolve eats disproportionately into the lower-right limb: the
 * shadow side loses its hard edge while the lit upper-left keeps a crisp
 * terminator. No filter, no layer promotion, no re-raster.
 */
const BODY_MASK =
  'radial-gradient(ellipse 67% 67% at 40% 36%, #000 0 71%, rgba(0,0,0,0.88) 87%, rgba(0,0,0,0.55) 96%, transparent 100%)';

const BODY: CSSProperties = {
  backgroundImage: [
    'radial-gradient(ellipse 67% 67% at 38% 31%, rgb(var(--accent-core) / 0.55) 0%, rgb(var(--accent-core) / 0.22) 30%, transparent 62%)',
    'radial-gradient(ellipse 67% 67% at 42% 37%, rgb(var(--accent-core)) 0%, rgb(var(--accent-mid)) 36%, rgb(var(--accent-deep)) 71%, rgb(var(--accent-floor)) 100%)',
  ].join(','),
  boxShadow: [
    'inset 0 1px 0 rgba(255,255,255,0.20)',
    'inset 0 -20px 34px -20px rgba(2,4,14,0.62)',
    'inset 0 0 0 1px rgba(255,255,255,0.055)',
  ].join(','),
  WebkitMaskImage: BODY_MASK,
  maskImage: BODY_MASK,
};

/** The lamp: broad and diffuse, not a hotspot. Alabaster, not glass. */
const INNER_LIGHT: CSSProperties = {
  background:
    'radial-gradient(ellipse 67% 67% at 37% 29%, rgba(222,240,255,0.92) 0%, rgba(178,214,252,0.62) 16%, rgba(139,178,240,0.26) 34%, transparent 58%)',
};

/** Fill opposite the key. Nearly constant on purpose — bounce light doesn't pump. */
const BOUNCE: CSSProperties = {
  background:
    'radial-gradient(ellipse 60% 60% at 69% 81%, rgb(var(--accent-bounce) / 0.34) 0%, rgb(var(--accent-bounce) / 0.12) 30%, transparent 56%)',
};

/** The exhale channel: rises from below as the body empties. Release, not loss. */
const DEPTH: CSSProperties = {
  background:
    'radial-gradient(ellipse 120% 90% at 50% 104%, rgb(var(--accent-deep) / 0.85) 0%, rgb(var(--accent-deep) / 0.42) 38%, transparent 72%)',
  mixBlendMode: 'multiply',
};

/**
 * The anti-frozen-hold layer. Two lobes counter-rotating at incommensurate
 * rates (+0.55 and -0.31 deg/s, ratio 1.774) so the interference never repeats
 * and no single crawl direction can build against the static grain tile.
 * Oversized so rotation never reveals a corner; clipped by the body.
 */
const CAUSTIC_A: CSSProperties = {
  background:
    'radial-gradient(ellipse 60% 44% at 30% 24%, rgba(226,242,255,0.11), transparent 62%)',
  mixBlendMode: 'overlay',
};
const CAUSTIC_B: CSSProperties = {
  background:
    'radial-gradient(ellipse 52% 60% at 72% 70%, rgba(190,216,255,0.070), transparent 58%)',
  mixBlendMode: 'overlay',
};

const GRAIN: CSSProperties = {
  backgroundImage: GRAIN_URI,
  backgroundSize: GRAIN_SIZE,
  backgroundRepeat: 'repeat',
  opacity: 0.038,
  mixBlendMode: 'overlay',
};

/**
 * Reduced motion only. A rising level with a bright meniscus is readable as
 * direction from a *single still frame* — which is the thing the old fallback
 * (a non-directional opacity fade at 1.51:1) could not do.
 */
const WATERLINE: CSSProperties = {
  background:
    'linear-gradient(180deg, rgb(var(--accent-core) / 0.34) 0%, rgb(var(--accent-core) / 0.10) 100%)',
  borderTop: '1.5px solid rgb(var(--accent-rim) / 0.85)',
};

/**
 * Fresnel bloom: a feathered annulus, no blur. The static 145° mask makes it
 * bright on the upper-left limb and nearly absent on the lower-right, so the
 * rim agrees with the key light — direction from one static gradient.
 */
const RIM: CSSProperties = {
  background:
    'radial-gradient(circle closest-side at 50% 50%, transparent 0 93.5%, rgb(var(--accent-rim) / 0.30) 96.4%, rgb(var(--accent-rim) / 0.52) 97.8%, rgb(var(--accent-rim) / 0.22) 99%, transparent 100%)',
  WebkitMaskImage: 'linear-gradient(145deg, #000 0%, rgba(0,0,0,0.35) 58%, rgba(0,0,0,0.12) 100%)',
  maskImage: 'linear-gradient(145deg, #000 0%, rgba(0,0,0,0.35) 58%, rgba(0,0,0,0.12) 100%)',
};

export function OrbLayers({
  reducedMotion,
  orb,
  innerLight,
  bounce,
  depth,
  causticA,
  causticB,
  waterline,
  rim,
  fieldNear,
  fieldFar,
  ground,
}: OrbLayerProps) {
  return (
    <>
      <div ref={fieldFar} aria-hidden className="pacer-dimmable absolute -inset-[46%] rounded-full">
        <div className="blend-glow absolute inset-0 rounded-full" style={FIELD_FAR} />
      </div>
      <div
        ref={fieldNear}
        aria-hidden
        className="pacer-dimmable absolute -inset-[22%] rounded-full"
      >
        <div className="blend-glow absolute inset-0 rounded-full" style={FIELD_NEAR} />
      </div>
      <div
        ref={ground}
        aria-hidden
        className="absolute left-[12%] right-[12%] top-[86%] h-[26%] rounded-[50%]"
        style={GROUND}
      />

      <div ref={orb} aria-hidden className="absolute inset-0 rounded-full will-change-transform">
        <div className="absolute inset-0 isolate overflow-hidden rounded-full" style={BODY}>
          <div ref={innerLight} className="blend-light absolute inset-0" style={INNER_LIGHT} />
          <div ref={bounce} className="blend-fill absolute inset-0" style={BOUNCE} />
          <div ref={depth} className="absolute inset-0" style={DEPTH} />
          <div ref={causticA} className="absolute -inset-[18%] will-change-transform">
            <div className="absolute inset-0" style={CAUSTIC_A} />
          </div>
          <div ref={causticB} className="absolute -inset-[18%] will-change-transform">
            <div className="absolute inset-0" style={CAUSTIC_B} />
          </div>
          <div className="absolute inset-0" style={GRAIN} />
          {reducedMotion && <div ref={waterline} className="absolute inset-0" style={WATERLINE} />}
        </div>
        <div ref={rim} className="blend-rim absolute -inset-px rounded-full" style={RIM} />
      </div>
    </>
  );
}
