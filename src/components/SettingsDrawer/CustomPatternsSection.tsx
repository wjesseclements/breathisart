import type { BreathPattern } from '../../engine/patterns';
import { useSettings } from '../../store/useSettings';
import { pillButton } from '../ui';

interface CustomPatternsSectionProps {
  onNew: () => void;
  onEdit: (pattern: BreathPattern) => void;
}

export function CustomPatternsSection({ onNew, onEdit }: CustomPatternsSectionProps) {
  const customPatterns = useSettings((s) => s.customPatterns);

  return (
    <section className="flex flex-col gap-4">
      <h3 className="text-sm uppercase tracking-widest text-slate-500">Custom patterns</h3>
      {customPatterns.length === 0 ? (
        <p className="text-sm text-slate-500">Nothing saved yet — build your own breath.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {customPatterns.map((pattern) => (
            <li key={pattern.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm text-slate-800 dark:text-slate-200">
                  {pattern.name}
                </p>
                <p className="truncate text-xs text-slate-500">{pattern.tagline}</p>
              </div>
              <button
                type="button"
                onClick={() => onEdit(pattern)}
                className="shrink-0 rounded-full border border-slate-300 dark:border-night-mist px-4 py-1 text-xs text-slate-600 dark:text-slate-400 transition-colors hover:border-breath-teal hover:text-slate-900 dark:hover:text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-breath-teal"
              >
                Edit
              </button>
            </li>
          ))}
        </ul>
      )}
      <button type="button" onClick={onNew} className={`${pillButton} self-start`}>
        New pattern
      </button>
    </section>
  );
}
