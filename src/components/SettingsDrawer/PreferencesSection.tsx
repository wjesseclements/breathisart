import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ensureAudio, getAudioEngineState, playCue } from '../../engine/audio';
import { useSettings } from '../../store/useSettings';
import { focusRing, focusRingOffset2, linkText } from '../ui';

/*
 * Sizes here are hit targets, not decoration. Measured in the open drawer, the
 * controls were: chips 26px tall, checkbox rows 20px, the checkbox itself 16px,
 * the volume slider 16px. WCAG 2.5.8 sets the floor at 24x24 and the practical
 * phone guideline is 44 — so nine of the twenty-five controls in here were
 * under even the floor, which is what "clicking seems erratic" was.
 *
 * `cursor-pointer` because Tailwind's preflight only gives it to `button` and
 * `[role=button]`. Labels, checkboxes and range inputs got the arrow, which
 * reads as "not clickable" on a row that very much is — hovering the same
 * panel gave a finger over the chips and an arrow over the toggles.
 *
 * Nothing here was ever blocked by an overlay; every control's hit test
 * reached itself. The problem was size and signalling, not layering.
 */
const chip = `inline-flex min-h-9 cursor-pointer items-center rounded-full border px-4 text-xs transition-colors ${focusRingOffset2}`;
const chipOn = 'border-accent bg-surface-selected text-ink-display';
const chipOff = 'border-line text-ink-muted hover:border-line-strong hover:text-ink-max';

const heading = 'text-sm uppercase tracking-widest text-ink-faint';
const toggleLabel =
  'flex min-h-11 cursor-pointer items-center justify-between gap-3 text-sm text-ink';
const checkbox = 'h-6 w-6 cursor-pointer accent-[rgb(var(--accent-core))]';

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

  // Diagnostic test tone: unlock + play inside this click's gesture, then
  // report the engine state so "no sound" can be told apart from "blocked".
  const [audioStatus, setAudioStatus] = useState<string | null>(null);
  const playTestTone = () => {
    ensureAudio();
    playCue('inhale', Math.max(0.5, useSettings.getState().volume));
    window.setTimeout(() => {
      const state = getAudioEngineState();
      setAudioStatus(
        state === 'running'
          ? 'Audio engine is running. If you heard nothing, check device volume — on iPhone, the ring/silent switch mutes web audio.'
          : `Audio engine state: ${state}. The browser is blocking sound.`,
      );
    }, 250);
  };

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
              // TODO(slice 20): light/dark pair has no exact token — slate-400 / night-mist
              className={`min-h-11 w-20 rounded-md border border-slate-400 dark:border-night-mist bg-surface-sunken px-2 text-center text-sm tabular-nums text-ink-strong ${focusRing}`}
            />
          </label>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h3 className={heading}>Audio</h3>
        {/* The on/off switch lives on the home screen now (PLAN_V2 slice 23):
            two levels deep in here, nobody found it. Say where it went rather
            than leaving this section looking like a dead end. */}
        <p className="text-meta text-ink-faint">
          Phase tones are switched on and off from the speaker icon on the home screen. Volume and
          the test tone stay here.
        </p>
        <label className={toggleLabel}>
          Volume
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={s.volume}
            onChange={(e) => s.setVolume(Number(e.target.value))}
            onPointerUp={() => {
              ensureAudio();
              playCue('inhale', useSettings.getState().volume);
            }}
            aria-label="Cue volume"
            className="h-6 w-36 cursor-pointer accent-[rgb(var(--accent-core))]"
          />
        </label>
        <button type="button" onClick={playTestTone} className={`${chip} ${chipOff} self-start`}>
          Play test tone
        </button>
        {audioStatus && <p className="text-xs text-ink-faint">{audioStatus}</p>}
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
        <label className={toggleLabel}>
          Spoken phase cues
          <input
            type="checkbox"
            checked={s.spokenCues}
            onChange={(e) => s.setSpokenCues(e.target.checked)}
            className={checkbox}
          />
        </label>
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

      <section className="flex flex-col gap-3">
        <h3 className={heading}>Settling beat</h3>
        <OptionChips
          label="Settling beat"
          value={s.leadInSeconds}
          options={[
            { label: 'Off', value: 0 },
            { label: '3 sec', value: 3 },
            { label: '5 sec', value: 5 },
          ]}
          onChange={s.setLeadIn}
        />
        <p className="text-meta text-ink-faint">
          A moment to settle before the first inhale. The physiological sigh always starts
          immediately.
        </p>
      </section>

      {/* PRD §5 asks for both of these links from the drawer; neither existed. */}
      <section className="flex flex-col gap-2 border-t border-line pt-5">
        <Link to="/research" className={`inline-flex min-h-11 items-center text-meta ${linkText}`}>
          The science of slow breathing
        </Link>
        <p className="text-meta text-ink-faint">
          Stillpoint is an educational pacing tool, not medical advice, and is not a treatment for
          any condition. See the safety notes on the research page.
        </p>
      </section>
    </div>
  );
}
