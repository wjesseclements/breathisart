import { playCue } from '../../engine/audio';
import { useSettings } from '../../store/useSettings';

const chip =
  'rounded-full border px-3 py-1 text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-breath-teal';
const chipOn =
  'border-breath-teal bg-slate-200 dark:bg-night-mist text-slate-700 dark:text-whisper';
const chipOff =
  'border-slate-300 dark:border-night-mist text-slate-600 dark:text-slate-400 hover:border-slate-500 hover:text-slate-900 dark:hover:text-slate-200';

const heading = 'text-sm uppercase tracking-widest text-slate-500';
const toggleLabel =
  'flex items-center justify-between gap-3 text-sm text-slate-700 dark:text-slate-300';
const checkbox = 'h-4 w-4 accent-breath-teal';

function OptionChips<T extends string | number | null>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { label: string; value: T }[];
  onChange: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-2">
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className={`${chip} ${option.value === value ? chipOn : chipOff}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function PreferencesSection() {
  const s = useSettings();
  const lengthIsPreset = s.sessionLengthMin === null || [3, 5, 10].includes(s.sessionLengthMin);
  const hapticsSupported = 'vibrate' in navigator;

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h3 className={heading}>Session length</h3>
        <OptionChips
          label="Session length"
          value={lengthIsPreset ? s.sessionLengthMin : 15}
          options={[
            { label: 'Open-ended', value: null },
            { label: '3 min', value: 3 },
            { label: '5 min', value: 5 },
            { label: '10 min', value: 10 },
            { label: 'Custom', value: 15 },
          ]}
          onChange={s.setSessionLength}
        />
        {!lengthIsPreset && (
          <label className={toggleLabel}>
            Minutes
            <input
              type="number"
              min={1}
              max={180}
              value={s.sessionLengthMin ?? 15}
              onChange={(e) =>
                s.setSessionLength(Math.min(180, Math.max(1, Number(e.target.value) || 1)))
              }
              className="w-20 rounded-md border border-slate-300 dark:border-night-mist bg-white dark:bg-night px-2 py-1 text-center text-sm tabular-nums text-slate-800 dark:text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-breath-teal"
            />
          </label>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h3 className={heading}>Audio</h3>
        <label className={toggleLabel}>
          Phase tones
          <input
            type="checkbox"
            checked={s.audioCues}
            onChange={(e) => s.setAudioCues(e.target.checked)}
            className={checkbox}
          />
        </label>
        <label className={toggleLabel}>
          Volume
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={s.volume}
            onChange={(e) => s.setVolume(Number(e.target.value))}
            onPointerUp={() => playCue('inhale', useSettings.getState().volume)}
            aria-label="Cue volume"
            className="w-36 accent-breath-teal"
          />
        </label>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className={heading}>Haptics</h3>
        <label className={toggleLabel}>
          Vibrate on phase change{!hapticsSupported && ' (not supported here)'}
          <input
            type="checkbox"
            checked={s.haptics}
            disabled={!hapticsSupported}
            onChange={(e) => s.setHaptics(e.target.checked)}
            className={checkbox}
          />
        </label>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className={heading}>Display</h3>
        <label className={toggleLabel}>
          Countdown numbers
          <input
            type="checkbox"
            checked={s.showCountdown}
            onChange={(e) => s.setShowCountdown(e.target.checked)}
            className={checkbox}
          />
        </label>
        <OptionChips
          label="Theme"
          value={s.theme}
          options={[
            { label: 'Dark', value: 'dark' },
            { label: 'Light', value: 'light' },
            { label: 'System', value: 'system' },
          ]}
          onChange={s.setTheme}
        />
        <OptionChips
          label="Motion"
          value={s.motionPreference}
          options={[
            { label: 'Follow system', value: 'system' },
            { label: 'Reduce motion', value: 'reduced' },
          ]}
          onChange={s.setMotionPreference}
        />
      </section>
    </div>
  );
}
