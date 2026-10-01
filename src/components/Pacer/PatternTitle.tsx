import type { BreathPattern } from '../../engine/patterns';
import { describePhases } from '../../engine/patterns';

/**
 * The idle-state identity block (PLAN_V2 slice 17).
 *
 * The comment here used to claim three lines and the component rendered four,
 * all centred and two of them the same size — which is why it read as a stack
 * rather than a hierarchy. Now it is a trio plus a note: name, pacing and
 * character sit 8px apart as one identity; the duration advice is a different
 * kind of thing and gets its own air.
 *
 * `cycleSuggestion` is defined on all five built-ins and was rendered in
 * exactly zero places before slice 17; the tagline was reachable only through
 * a `title=` tooltip, i.e. invisible on touch.
 */
export function PatternTitle({ pattern }: { pattern: BreathPattern }) {
  const phases = describePhases(pattern.phases);
  // A custom pattern's tagline IS `describePhases`, so showing both printed
  // the phases twice: "IN 4.5 · OUT 6" directly above "in 4.5 · out 6".
  //
  // Two built-in taglines used to do the same thing in prose. Coherent read
  // "About 5.5 breaths per minute, no holds" directly under "IN 5.5 · OUT 5.5"
  // -- 5.5 three times in two lines -- and 4-7-8 read "long hold, longer
  // exhale" under "IN 4 · HOLD 7 · OUT 8". Both now say what the numbers
  // cannot, drawn from PRD §6.3 so the home screen and the research page agree.
  const tagline = pattern.tagline.trim() === phases ? null : pattern.tagline;

  return (
    <div className="flex w-full min-w-0 flex-col items-center gap-2 text-center">
      <h2 className="font-display text-title font-normal text-ink">{pattern.name}</h2>
      <p className="text-label uppercase tabular-nums text-ink-faint">{phases}</p>
      {/* Separate lines, not a middot join: the tagline wraps on narrow
          viewports and orphaned a trailing separator. */}
      {tagline && <p className="max-w-[26rem] text-balance text-meta text-ink-muted">{tagline}</p>}
      {pattern.cycleSuggestion && (
        <p className="mt-1 text-meta text-ink-faint">{pattern.cycleSuggestion}</p>
      )}
    </div>
  );
}
