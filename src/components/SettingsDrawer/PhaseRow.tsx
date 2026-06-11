import type { Phase, PhaseKind } from '../../engine/patterns';
import { MAX_PHASE_SECONDS, MIN_PHASE_SECONDS } from '../../engine/patterns';

const field =
  'rounded-md border border-slate-400 dark:border-night-mist bg-white dark:bg-night px-2 py-1 text-sm text-slate-800 dark:text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600 dark:focus-visible:outline-breath-teal';
const iconButton =
  'rounded-md border border-slate-300 dark:border-night-mist px-2 py-1 text-sm text-slate-600 dark:text-slate-400 transition-colors hover:border-teal-600 dark:hover:border-breath-teal hover:text-slate-900 dark:hover:text-slate-200 disabled:opacity-30 disabled:hover:border-slate-300 dark:disabled:hover:border-night-mist focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600 dark:focus-visible:outline-breath-teal';

interface PhaseRowProps {
  phase: Phase;
  index: number;
  count: number;
  onChange: (patch: Partial<Phase>) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}

export function PhaseRow({ phase, index, count, onChange, onMove, onRemove }: PhaseRowProps) {
  const n = index + 1;
  const step = (delta: number) => {
    const base = Number.isFinite(phase.seconds) ? phase.seconds : 0;
    const next = Math.min(MAX_PHASE_SECONDS, Math.max(MIN_PHASE_SECONDS, base + delta));
    onChange({ seconds: next });
  };

  return (
    <li className="flex items-center gap-2">
      <select
        value={phase.kind}
        onChange={(e) => onChange({ kind: e.target.value as PhaseKind })}
        aria-label={`Phase ${n} type`}
        className={field}
      >
        <option value="inhale">In</option>
        <option value="hold">Hold</option>
        <option value="exhale">Out</option>
      </select>
      <button
        type="button"
        onClick={() => step(-0.5)}
        aria-label={`Phase ${n}: shorter`}
        className={iconButton}
      >
        −
      </button>
      <input
        type="number"
        inputMode="decimal"
        min={MIN_PHASE_SECONDS}
        max={MAX_PHASE_SECONDS}
        step={0.5}
        value={Number.isFinite(phase.seconds) ? phase.seconds : ''}
        onChange={(e) =>
          onChange({ seconds: e.target.value === '' ? Number.NaN : Number(e.target.value) })
        }
        aria-label={`Phase ${n} seconds`}
        className={`${field} w-16 text-center tabular-nums`}
      />
      <button
        type="button"
        onClick={() => step(0.5)}
        aria-label={`Phase ${n}: longer`}
        className={iconButton}
      >
        +
      </button>
      <div className="ml-auto flex gap-1">
        <button
          type="button"
          onClick={() => onMove(-1)}
          disabled={index === 0}
          aria-label={`Move phase ${n} up`}
          className={iconButton}
        >
          ↑
        </button>
        <button
          type="button"
          onClick={() => onMove(1)}
          disabled={index === count - 1}
          aria-label={`Move phase ${n} down`}
          className={iconButton}
        >
          ↓
        </button>
        <button
          type="button"
          onClick={onRemove}
          disabled={count === 1}
          aria-label={`Remove phase ${n}`}
          className={iconButton}
        >
          ✕
        </button>
      </div>
    </li>
  );
}
