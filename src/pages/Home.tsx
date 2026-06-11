import { Link } from 'react-router-dom';
import { Pacer } from '../components/Pacer/Pacer';
import { FirstTimeTip } from '../components/PatternPicker/FirstTimeTip';
import { PatternPicker } from '../components/PatternPicker/PatternPicker';
import { BUILT_IN_PATTERNS, findPatternById } from '../engine/patterns';
import { useSettings } from '../store/useSettings';

export default function Home() {
  const selectedId = useSettings((s) => s.selectedPatternId);
  const pattern = findPatternById(selectedId) ?? BUILT_IN_PATTERNS[0];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-night px-6 py-10">
      <Pacer pattern={pattern} />
      <PatternPicker />
      <FirstTimeTip />
      <Link
        to="/research"
        className="text-sm text-slate-500 underline-offset-4 transition-colors hover:text-breath-teal hover:underline"
      >
        The science of slow breathing
      </Link>
    </main>
  );
}
