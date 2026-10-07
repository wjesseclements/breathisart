import { useEffect } from 'react';
import type { BreathPattern } from '../../engine/patterns';
import { BUILT_IN_PATTERNS } from '../../engine/patterns';
import { useSettings } from '../../store/useSettings';
import { focusRingOffset2 } from '../ui';

/**
 * Words, not pills (PLAN_V2 slice 19).
 *
 * Six outlined pills repeated under the hero out-ranked the hero by sheer
 * repetition. These are quiet text targets with a 1px accent rule under the
 * selection — still a 44px hit area, just not shouting.
 *
 * Proper radio semantics with a roving tabindex, so the group is one tab stop
 * and the arrow keys move within it, which is what a screen-reader user
 * expects from a radiogroup. `aria-describedby` carries the tagline, which
 * used to be reachable only via `title=` — i.e. invisible on touch.
 *
 * The row WRAPS rather than scrolling sideways. It used to be a horizontal
 * scroller, which was the right answer while "+ Build your own" had a line of
 * its own: five names just fit at 390px. Adding Custom to the line did not
 * fit — 240px of room for 379px of names — and something had to be hidden at
 * rest, either two patterns or Custom. Wrapping hides nothing, costs one line
 * on a phone and none on a desktop, and that line is affordable now that
 * Custom no longer needs one to itself.
 *
 * It also retires the reason the scroller was fiddly: a flex row that
 * overflows cannot be centred, because `scrollLeft` will not go negative and
 * the leading items become permanently unreachable. Nothing overflows now.
 */
const itemBase = `relative grid min-h-11 snap-start place-items-center rounded-md px-3 text-ui transition-colors ${focusRingOffset2}`;
const itemSelected = 'text-ink-strong';
const itemIdle = 'text-ink-muted hover:text-ink';

interface PatternPickerProps {
  enabled?: boolean;
  /** Opens the builder: with a pattern to edit, or null for a new one. */
  onOpenBuilder: (pattern: BreathPattern | null) => void;
}

export function PatternPicker({ enabled = true, onOpenBuilder }: PatternPickerProps) {
  const selectedId = useSettings((s) => s.selectedPatternId);
  const selectPattern = useSettings((s) => s.selectPattern);
  const customPatterns = useSettings((s) => s.customPatterns);
  const allPatterns = [...BUILT_IN_PATTERNS, ...customPatterns];

  // Left/right arrows cycle patterns from anywhere on the page —
  // but not mid-session, where a switch would reset the engine.
  useEffect(() => {
    if (!enabled) return;
    const ids = [...BUILT_IN_PATTERNS, ...customPatterns].map((p) => p.id);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, select, textarea')) return;
      e.preventDefault();
      const current = Math.max(0, ids.indexOf(selectedId));
      const step = e.key === 'ArrowRight' ? 1 : -1;
      selectPattern(ids[(current + step + ids.length) % ids.length]);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, selectedId, selectPattern, customPatterns]);

  // Keep the selection in view when the arrows move it past the fold.

  return (
    <div className="flex w-full min-w-0 flex-wrap items-center justify-center gap-1 px-6 land:px-0">
      {/* `display: contents` so the group's children wrap in the parent's flex
          flow alongside Custom, while the group itself keeps its role. Custom
          has to stay OUTSIDE it: it opens the builder rather than selecting a
          pattern, and a button that opens a dialog has no business being
          announced as one of a set of radio options. */}
      <div role="radiogroup" aria-label="Breathing pattern" className="contents">
        {allPatterns.map((pattern) => {
          const selected = pattern.id === selectedId;
          return (
            /* A custom chip may shrink and truncate; a built-in never needs
               to. The 24-character cap keeps real names whole on a 360px
               phone, and this catches the rest: a name saved before the cap,
               or wide letters on a 320px screen. A long name used to run off
               both edges and push its own pencil out of reach. */
            <div
              key={pattern.id}
              className={`flex items-center ${pattern.builtIn ? 'shrink-0' : 'min-w-0 max-w-full'}`}
            >
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                aria-describedby={`tagline-${pattern.id}`}
                data-selected={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => selectPattern(pattern.id)}
                className={`${itemBase} ${pattern.builtIn ? 'shrink-0' : 'min-w-0'} ${
                  selected ? itemSelected : itemIdle
                }`}
              >
                {/* `max-w-full` is what makes `truncate` bite: the button centres its
                    items, and a centred grid item sizes to its full text and
                    overflows both ways rather than being clipped. */}
                <span className="max-w-full truncate">{pattern.chipLabel ?? pattern.name}</span>
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-2 bottom-1 h-px transition-opacity ${
                    selected ? 'bg-[rgb(var(--accent-core))] opacity-80' : 'opacity-0'
                  }`}
                />
              </button>
              {/* Outside the button. Inside it, this text was part of the
                  radio's NAME as well as its description, so a screen reader
                  read every tagline twice: "Box Equal sides, steady composure
                  under pressure, radio, Equal sides, steady composure..." */}
              <span id={`tagline-${pattern.id}`} className="sr-only">
                {pattern.tagline}
              </span>
              {!pattern.builtIn && (
                <button
                  type="button"
                  onClick={() => onOpenBuilder(pattern)}
                  aria-label={`Edit ${pattern.name}`}
                  className={`${itemBase} ${itemIdle} shrink-0 px-2`}
                >
                  {/* Inline SVG, not U+270E: that glyph renders as a colour
                      emoji pencil on several Android builds and sits
                      off-centre against the surrounding sans. */}
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                  </svg>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Same weight as the pattern names. It was meant to sit a tier
          quieter, but those classes collided with `itemBase` and `itemIdle`
          and lost, so it always rendered at full weight — and it read fine
          that way, so the dead classes went rather than the look changing. */}
      <button
        type="button"
        onClick={() => onOpenBuilder(null)}
        className={`${itemBase} ${itemIdle} shrink-0`}
      >
        Custom
      </button>
    </div>
  );
}
