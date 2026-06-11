import { Link } from 'react-router-dom';

export default function Research() {
  return (
    <main className="mx-auto flex min-h-screen max-w-prose flex-col gap-6 px-6 py-16">
      <h1 className="font-display text-2xl font-light text-slate-700 dark:text-whisper">
        The science of slow breathing
      </h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Research summaries coming in slice 10.
      </p>
      <Link to="/" className="text-sm text-breath-teal underline-offset-4 hover:underline">
        ← Back to breathing
      </Link>
    </main>
  );
}
