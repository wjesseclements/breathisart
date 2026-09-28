import type { BreathPattern } from '../../engine/patterns';
import { describePhases } from '../../engine/patterns';

/**
 * The idle-state identity block (PLAN_V2 slice 17).
 *
 * Three lines at three weights, 8px apart, so they read as one group rather
 * than three bands. `cycleSuggestion` is defined on all five built-ins and was
 * rendered in exactly zero places before this; the tagline was reachable only
 * through a `title=` tooltip, i.e. invisible on touch.
 */
export function PatternTitle({ pattern }: { pattern: BreathPattern }) {
  return (
    <div className="flex w-full min-w-0 flex-col items-center gap-2 text-center">
      <h2 className="font-display text-title font-normal text-ink">{pattern.name}</h2>
      <p className="text-label uppercase tabular-nums text-ink-faint">
        {describePhases(pattern.phases)}
      </p>
      {/* Separate lines, not a middot join: the tagline wraps on narrow
          viewports and orphaned a trailing separator. */}
      <p className="max-w-[26rem] text-balance text-meta text-ink-muted">{pattern.tagline}</p>
      {pattern.cycleSuggestion && (
        <p className="text-meta text-ink-faint">{pattern.cycleSuggestion}</p>
      )}
    </div>
  );
}
