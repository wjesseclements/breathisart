import { useState } from 'react';
import type { BreathPattern, Phase } from '../../engine/patterns';
import { describePhases, validatePhases } from '../../engine/patterns';
import { useSettings } from '../../store/useSettings';
import { pillButton } from '../ui';
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
      id: initial?.id ?? `custom-${crypto.randomUUID()}`,
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
        className="self-start text-sm text-slate-400 transition-colors hover:text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-breath-teal"
      >
        ‹ All settings
      </button>

      <label className="flex flex-col gap-1 text-sm text-slate-300">
        Name
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Evening wind-down"
          className="rounded-md border border-night-mist bg-night px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-breath-teal"
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
        <ul className="flex flex-col gap-1 text-sm text-rose-300" role="alert">
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
