import { useState } from 'react';
import type { BreathPattern } from '../../engine/patterns';
import { buildSharePath } from '../../engine/shareUrl';
import { useSettings } from '../../store/useSettings';
import { pillButton } from '../ui';

const rowButton =
  'shrink-0 rounded-full border border-slate-300 dark:border-night-mist px-4 py-1 text-xs text-slate-600 dark:text-slate-400 transition-colors hover:border-teal-600 dark:hover:border-breath-teal hover:text-slate-900 dark:hover:text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600 dark:focus-visible:outline-breath-teal';

interface CustomPatternsSectionProps {
  onNew: () => void;
  onEdit: (pattern: BreathPattern) => void;
}

export function CustomPatternsSection({ onNew, onEdit }: CustomPatternsSectionProps) {
  const customPatterns = useSettings((s) => s.customPatterns);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const share = (pattern: BreathPattern) => {
    const url = `${window.location.origin}${buildSharePath(pattern)}`;
    void navigator.clipboard?.writeText(url);
    setCopiedId(pattern.id);
    window.setTimeout(() => setCopiedId((id) => (id === pattern.id ? null : id)), 1500);
  };

  return (
    <section className="flex flex-col gap-4">
      <h3 className="text-sm uppercase tracking-widest text-slate-500 dark:text-slate-400">
        Custom patterns
      </h3>
      {customPatterns.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Nothing saved yet — build your own breath.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {customPatterns.map((pattern) => (
            <li key={pattern.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm text-slate-800 dark:text-slate-200">
                  {pattern.name}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {pattern.tagline}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => share(pattern)}
                  aria-label={`Copy share link for ${pattern.name}`}
                  className={rowButton}
                >
                  {copiedId === pattern.id ? 'Copied!' : 'Share'}
                </button>
                <button type="button" onClick={() => onEdit(pattern)} className={rowButton}>
                  Edit
                </button>
              </div>
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
