import { useEffect } from 'react';
import { BUILT_IN_PATTERNS } from '../../engine/patterns';
import { useSettings } from '../../store/useSettings';

const chipBase =
  'shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-breath-teal';

export function PatternPicker() {
  const selectedId = useSettings((s) => s.selectedPatternId);
  const selectPattern = useSettings((s) => s.selectPattern);

  // Left/right arrows cycle patterns from anywhere on the page.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, select, textarea')) return;
      e.preventDefault();
      const ids = BUILT_IN_PATTERNS.map((p) => p.id);
      const current = Math.max(0, ids.indexOf(selectedId));
      const step = e.key === 'ArrowRight' ? 1 : -1;
      selectPattern(ids[(current + step + ids.length) % ids.length]);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedId, selectPattern]);

  return (
    <div
      role="group"
      aria-label="Breathing pattern"
      className="flex max-w-full items-center gap-2 overflow-x-auto px-6 py-2"
    >
      {BUILT_IN_PATTERNS.map((pattern) => {
        const selected = pattern.id === selectedId;
        return (
          <button
            key={pattern.id}
            type="button"
            aria-pressed={selected}
            title={pattern.tagline}
            onClick={() => selectPattern(pattern.id)}
            className={`${chipBase} ${
              selected
                ? 'border-breath-teal bg-night-mist text-whisper'
                : 'border-night-mist text-slate-400 hover:border-slate-500 hover:text-slate-200'
            }`}
          >
            {pattern.chipLabel ?? pattern.name}
          </button>
        );
      })}
      <button
        type="button"
        disabled
        title="Custom patterns arrive with the pattern builder"
        className={`${chipBase} cursor-not-allowed border-night-soft text-slate-600`}
      >
        Custom…
      </button>
    </div>
  );
}
