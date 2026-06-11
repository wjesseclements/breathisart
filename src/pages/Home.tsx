import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-night">
      <div
        aria-hidden="true"
        className="h-40 w-40 rounded-full bg-gradient-to-br from-breath-teal to-breath-indigo opacity-70"
      />
      <h1 className="font-display text-2xl font-light text-whisper">Stillpoint</h1>
      <p className="text-sm text-slate-400">Breath pacer coming in slice 3.</p>
      <Link to="/research" className="text-sm text-breath-teal underline-offset-4 hover:underline">
        The science of slow breathing
      </Link>
    </main>
  );
}
