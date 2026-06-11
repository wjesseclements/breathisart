import { Link } from 'react-router-dom';
import { Pacer } from '../components/Pacer/Pacer';
import { BUILT_IN_PATTERNS } from '../engine/patterns';

// Last-used pattern persistence arrives with the picker in slice 4.
const defaultPattern = BUILT_IN_PATTERNS[0];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-12 bg-night px-6 py-10">
      <Pacer pattern={defaultPattern} />
      <Link
        to="/research"
        className="text-sm text-slate-500 underline-offset-4 transition-colors hover:text-breath-teal hover:underline"
      >
        The science of slow breathing
      </Link>
    </main>
  );
}
