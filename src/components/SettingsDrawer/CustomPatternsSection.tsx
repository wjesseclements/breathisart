import { useState } from 'react';
import type { BreathPattern } from '../../engine/patterns';
import { buildSharePath } from '../../engine/shareUrl';
import { useSettings } from '../../store/useSettings';
import { focusRing, pillButton } from '../ui';

const rowButton = `inline-flex min-h-11 shrink-0 cursor-pointer items-center rounded-full border border-line px-4 text-xs text-ink-muted transition-colors hover:border-accent hover:text-ink-max ${focusRing}`;

interface CustomPatternsSectionProps {
  onNew: () => void;
  onEdit: (pattern: BreathPattern) => void;
}

export function CustomPatternsSection({ onNew, onEdit }: CustomPatternsSectionProps) {
  const customPatterns = useSettings((s) => s.customPatterns);
  const [copied, setCopied] = useState<{ id: string; ok: boolean } | null>(null);

  /**
   * The label used to say "Copied!" whether or not anything was copied: the
   * write was fired as `void navigator.clipboard?.writeText(url)`, so a
   * rejection was discarded and a missing `navigator.clipboard` was optional-
   * chained away. On the LAN dev URL, which is plain http and therefore not a
   * secure context, `navigator.clipboard` is `undefined` — so that path
   * reported success every time while copying nothing.
   */
  const share = async (pattern: BreathPattern) => {
    const url = `${window.location.origin}${buildSharePath(pattern)}`;
    let ok = false;
    try {
      await navigator.clipboard.writeText(url);
      ok = true;
    } catch {
      // Undefined on a non-secure origin, and rejected by the browser when a
      // copy is not allowed. Either way the label has to say so.
    }
    setCopied({ id: pattern.id, ok });
    window.setTimeout(() => setCopied((c) => (c?.id === pattern.id ? null : c)), 1800);
  };

  return (
    <section className="flex flex-col gap-4">
      <h3 className="text-sm uppercase tracking-widest text-ink-faint">Custom patterns</h3>
      {customPatterns.length === 0 ? (
        <p className="text-sm text-ink-faint">Nothing saved yet — build your own breath.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {customPatterns.map((pattern) => (
            <li key={pattern.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm text-ink-strong">{pattern.name}</p>
                <p className="truncate text-xs text-ink-faint">{pattern.tagline}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => void share(pattern)}
                  aria-label={`Copy share link for ${pattern.name}`}
                  className={rowButton}
                >
                  {copied?.id !== pattern.id ? 'Share' : copied.ok ? 'Copied!' : 'Copy failed'}
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
