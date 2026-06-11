import type { BreathSession } from '../Pacer/useBreathSession';
import { pillButton } from '../ui';
import { formatClock } from './sessionFormat';

interface SessionHUDProps {
  session: BreathSession;
  visible: boolean;
  onEnd: () => void;
}

/** Minimal in-session controls: elapsed time, cycles, pause/resume, end. */
export function SessionHUD({ session, visible, onEnd }: SessionHUDProps) {
  return (
    <div
      className={`flex items-center gap-5 transition-[opacity,visibility] duration-500 ${
        visible ? 'visible opacity-100' : 'invisible opacity-0'
      }`}
    >
      <span className="text-sm tabular-nums text-slate-400" aria-label="Elapsed time">
        {formatClock(session.elapsedSeconds)}
      </span>
      <span className="text-sm tabular-nums text-slate-400" aria-label="Completed cycles">
        {session.cycles} {session.cycles === 1 ? 'cycle' : 'cycles'}
      </span>
      <button type="button" onClick={session.toggle} className={pillButton}>
        {session.status === 'running' ? 'Pause' : 'Resume'}
      </button>
      <button type="button" onClick={onEnd} className={pillButton}>
        End
      </button>
    </div>
  );
}
