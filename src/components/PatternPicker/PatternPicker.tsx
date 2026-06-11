import { useEffect } from 'react';
import type { BreathPattern } from '../../engine/patterns';
import { BUILT_IN_PATTERNS } from '../../engine/patterns';
import { useSettings } from '../../store/useSettings';

const chipBase =
  'shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:focus-visible:outline-breath-teal';
const chipSelected =
  'border-teal-600 dark:border-breath-teal bg-slate-200 dark:bg-night-mist text-slate-700 dark:text-whisper';
const chipIdle =
  'border-slate-300 dark:border-night-mist text-slate-600 dark:text-slate-400 hover:border-slate-500 hover:text-slate-900 dark:hover:text-slate-200';

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

  return (
    <div
      role="group"
      aria-label="Breathing pattern"
      className="flex w-full items-center gap-2 overflow-x-auto px-6 py-2 sm:justify-center"
    >
      {allPatterns.map((pattern) => {
        const selected = pattern.id === selectedId;
        const selectButton = (
          <button
            key={pattern.id}
            type="button"
            aria-pressed={selected}
            title={pattern.tagline}
            onClick={() => selectPattern(pattern.id)}
            className={`${pattern.builtIn ? chipBase : `${chipBase} rounded-r-none`} ${selected ? chipSelected : chipIdle}`}
          >
            {pattern.chipLabel ?? pattern.name}
          </button>
        );
        if (pattern.builtIn) return selectButton;
        return (
          <div key={pattern.id} className="flex shrink-0 items-stretch">
            {selectButton}
            <button
              type="button"
              onClick={() => onOpenBuilder(pattern)}
              aria-label={`Edit ${pattern.name}`}
              title={`Edit ${pattern.name}`}
              className={`${chipBase} rounded-l-none border-l-0 px-2.5 ${selected ? chipSelected : chipIdle}`}
            >
              ✎
            </button>
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => onOpenBuilder(null)}
        title="Build your own pattern"
        className={`${chipBase} ${chipIdle} border-dashed`}
      >
        Custom…
      </button>
    </div>
  );
}
