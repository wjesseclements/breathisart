import type { Phase, PhaseKind } from '../../engine/patterns';
import { MAX_PHASE_SECONDS, MIN_PHASE_SECONDS } from '../../engine/patterns';
import { focusRing } from '../ui';

// TODO(slice 20): light/dark pair has no exact token — slate-400 / night-mist
const field = `min-h-11 rounded-md border border-slate-400 dark:border-night-mist bg-surface-sunken px-2 text-sm text-ink-strong ${focusRing}`;
const iconButton = `inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md border border-line text-sm text-ink-muted transition-colors hover:border-accent hover:text-ink-max disabled:cursor-default disabled:opacity-30 disabled:hover:border-line ${focusRing}`;

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

  /*
   * Two rows, one card per phase. It was a single row of seven controls, and
   * when the drawer audit raised every button to 44px that row became ~390px
   * in a drawer whose content is never wider than 336px: the remove button
   * sat 20px past the right edge of a phone and the whole drawer scrolled
   * sideways. Nothing shrinks back — the targets keep their 44px — so the
   * move and remove buttons take a second row instead, with remove on its own
   * at the far end, away from the ones that merely reorder.
   */
  return (
    <li className="flex flex-col gap-2 rounded-lg border border-line p-2">
      <div className="flex items-center gap-2">
        <select
          value={phase.kind}
          onChange={(e) => onChange({ kind: e.target.value as PhaseKind })}
          aria-label={`Phase ${n} type`}
          className={`${field} min-w-0 flex-1`}
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
      </div>
      <div className="flex items-center gap-1">
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
          className={`${iconButton} ml-auto`}
        >
          ✕
        </button>
      </div>
    </li>
  );
}
