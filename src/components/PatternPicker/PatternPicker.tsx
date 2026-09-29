import { useEffect, useRef } from 'react';
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
 */
const itemBase = `relative grid min-h-11 shrink-0 snap-start place-items-center rounded-md px-3 text-ui transition-colors ${focusRingOffset2}`;
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
  const scrollerRef = useRef<HTMLDivElement>(null);

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
  useEffect(() => {
    scrollerRef.current
      ?.querySelector('[data-selected="true"]')
      ?.scrollIntoView({ inline: 'nearest', block: 'nearest' });
  }, [selectedId]);

  return (
    <div className="flex w-full min-w-0 flex-col items-center gap-3">
      {/*
       * `justify-start` with an inner `mx-auto w-max`, NOT `sm:justify-center`.
       * Centring a flex row that overflows puts its leading items at a negative
       * offset, and `scrollLeft` cannot go negative — so the first patterns
       * became permanently unreachable once the row was wider than the screen.
       */}
      {/* Custom sits OUTSIDE the scroller, pinned to the right of the same
          line. Inside it, at the end of six names, it was off-screen on a
          390px phone until you scrolled the row — technically on the line and
          practically invisible. Pinned, it is always reachable, and the chips
          keep the remaining width to scroll in. */}
      <div className="flex w-full min-w-0 items-center">
        <div
          ref={scrollerRef}
          className="min-w-0 flex-1 snap-x overflow-x-auto px-6 py-1 [mask-image:linear-gradient(to_right,transparent,black_1.5rem,black_calc(100%-1.5rem),transparent)]"
        >
          <div className="mx-auto flex w-max items-center gap-1">
            {/* `radiogroup` sits on this inner row rather than the scroller, so
              Custom can share the same scrolling line while staying OUTSIDE
              the group — it opens the builder, it does not select a pattern,
              and a button that opens a dialog has no business being announced
              as one of a set of radio options. */}
            <div
              role="radiogroup"
              aria-label="Breathing pattern"
              className="flex items-center gap-1"
            >
              {allPatterns.map((pattern) => {
                const selected = pattern.id === selectedId;
                return (
                  <div key={pattern.id} className="flex shrink-0 items-center">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-describedby={`tagline-${pattern.id}`}
                      data-selected={selected}
                      tabIndex={selected ? 0 : -1}
                      onClick={() => selectPattern(pattern.id)}
                      className={`${itemBase} ${selected ? itemSelected : itemIdle}`}
                    >
                      {pattern.chipLabel ?? pattern.name}
                      <span
                        aria-hidden="true"
                        className={`absolute inset-x-2 bottom-1 h-px transition-opacity ${
                          selected ? 'bg-[rgb(var(--accent-core))] opacity-80' : 'opacity-0'
                        }`}
                      />
                      <span id={`tagline-${pattern.id}`} className="sr-only">
                        {pattern.tagline}
                      </span>
                    </button>
                    {!pattern.builtIn && (
                      <button
                        type="button"
                        onClick={() => onOpenBuilder(pattern)}
                        aria-label={`Edit ${pattern.name}`}
                        className={`${itemBase} ${itemIdle} px-2`}
                      >
                        {/* Inline SVG, not U+270E: that glyph renders as a colour
                          emoji pencil on several Android builds and sits
                          off-centre against the surrounding sans. */}
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          className="h-3.5 w-3.5 fill-current"
                        >
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* One tier quieter than the patterns: it belongs with them spatially
            but is not one of them. Its own line cost a 44px row plus a gap
            under the hero, on a screen that already overflowed a short phone. */}
        <button
          type="button"
          onClick={() => onOpenBuilder(null)}
          className={`${itemBase} ${itemIdle} mr-6 text-meta text-ink-faint hover:text-ink-muted`}
        >
          Custom
        </button>
      </div>
    </div>
  );
}
