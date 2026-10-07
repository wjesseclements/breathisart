import { useState } from 'react';
import type { BreathPattern, Phase } from '../../engine/patterns';
import {
  MAX_NAME_LENGTH,
  describePhases,
  newPatternId,
  validatePhases,
} from '../../engine/patterns';
import { useSettings } from '../../store/useSettings';
import { focusRing, pillButton } from '../ui';
import { MiniPreview } from './MiniPreview';
import { PhaseRow } from './PhaseRow';

const DEFAULT_PHASES: Phase[] = [
  { kind: 'inhale', seconds: 4 },
  { kind: 'exhale', seconds: 6 },
];

interface PatternBuilderProps {
  /** Existing pattern to edit, or null to create a new one. */
  initial: BreathPattern | null;
  onBack: () => void;
  onDone: () => void;
}

export function PatternBuilder({ initial, onBack, onDone }: PatternBuilderProps) {
  const saveCustomPattern = useSettings((s) => s.saveCustomPattern);
  const deleteCustomPattern = useSettings((s) => s.deleteCustomPattern);
  const selectPattern = useSettings((s) => s.selectPattern);

  const [name, setName] = useState(initial?.name ?? '');
  const [phases, setPhases] = useState<Phase[]>(initial?.phases ?? DEFAULT_PHASES);

  // Validation is the same tested code path the engine enforces (slice 2).
  const errors = validatePhases(phases);
  if (name.trim() === '') errors.unshift('Give your pattern a name.');
  // `maxLength` stops typing at the cap; this catches a name saved before it.
  else if (name.trim().length > MAX_NAME_LENGTH)
    errors.unshift(`Keep the name to ${MAX_NAME_LENGTH} characters or fewer.`);

  const updatePhase = (index: number, patch: Partial<Phase>) =>
    setPhases(phases.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  const movePhase = (index: number, direction: -1 | 1) => {
    const next = [...phases];
    const [moved] = next.splice(index, 1);
    next.splice(index + direction, 0, moved);
    setPhases(next);
  };
  const removePhase = (index: number) => setPhases(phases.filter((_, i) => i !== index));
  const addPhase = () => setPhases([...phases, { kind: 'inhale', seconds: 4 }]);

  const handleSave = () => {
    const pattern: BreathPattern = {
      id: initial?.id ?? newPatternId(),
      name: name.trim(),
      tagline: describePhases(phases),
      phases,
      builtIn: false,
    };
    saveCustomPattern(pattern);
    selectPattern(pattern.id);
    onDone();
  };

  const handleDelete = () => {
    if (initial) deleteCustomPattern(initial.id);
    onDone();
  };

  return (
    <div className="flex flex-col gap-5">
      <button
        type="button"
        onClick={onBack}
        className={`self-start text-sm text-ink-muted transition-colors hover:text-ink-max ${focusRing}`}
      >
        ‹ All settings
      </button>

      <label className="flex flex-col gap-1 text-sm text-ink">
        {/* So a field that stops at the cap reads as a limit, not a broken
            keyboard. `aria-hidden` keeps "12/24" out of the field's label. */}
        <span className="flex items-baseline justify-between">
          Name
          <span aria-hidden="true" className="text-xs tabular-nums text-ink-faint">
            {name.length}/{MAX_NAME_LENGTH}
          </span>
        </span>
        <input
          type="text"
          value={name}
          maxLength={MAX_NAME_LENGTH}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Evening wind-down"
          // TODO(slice 20): light/dark pair has no exact token — border-slate-400 / border-night-mist (--line is slate-300)
          // TODO(slice 20): light/dark pair has no exact token — placeholder:text-slate-400 / placeholder:text-slate-600
          className={`rounded-md border border-slate-400 dark:border-night-mist bg-surface-sunken px-3 py-2 text-sm text-ink-strong placeholder:text-slate-400 dark:placeholder:text-slate-600 ${focusRing}`}
        />
      </label>

      <MiniPreview phases={phases} />

      <ul className="flex flex-col gap-2">
        {phases.map((phase, i) => (
          <PhaseRow
            key={i}
            phase={phase}
            index={i}
            count={phases.length}
            onChange={(patch) => updatePhase(i, patch)}
            onMove={(dir) => movePhase(i, dir)}
            onRemove={() => removePhase(i)}
          />
        ))}
      </ul>
      <button type="button" onClick={addPhase} className={`${pillButton} self-start`}>
        + Add phase
      </button>

      {errors.length > 0 && (
        /* A light/dark pair, like the counterpoint amber on the research page.
           `text-rose-300` alone measured 1.89:1 on the light drawer at 14px —
           the one piece of text on the screen whose entire job is to be read
           was the least readable thing on it. 300 stays for dark (9.4:1). */
        <ul className="flex flex-col gap-1 text-sm text-rose-700 dark:text-rose-300" role="alert">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}

      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={errors.length > 0}
          className={`${pillButton} disabled:opacity-40`}
        >
          Save
        </button>
        {initial && (
          <button
            type="button"
            onClick={handleDelete}
            className={`${pillButton} hover:border-rose-400`}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
