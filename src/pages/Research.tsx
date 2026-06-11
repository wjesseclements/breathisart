import { Link } from 'react-router-dom';
import { Background } from '../components/Background';
import { pillButton } from '../components/ui';
import type { StudyCard } from './researchContent';
import {
  CRISIS_LINE,
  MECHANISMS,
  MECHANISM_INTRO,
  SAFETY_POINTS,
  STUDY_CARDS,
  TECHNIQUE_NOTES,
} from './researchContent';

const h2 = 'font-display text-xl font-light text-slate-700 dark:text-whisper';
const body = 'text-[0.95rem] leading-relaxed text-slate-700 dark:text-slate-300';
const muted = 'text-sm leading-relaxed text-slate-600 dark:text-slate-400';

function StudyCardView({ card }: { card: StudyCard }) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl bg-white p-6 dark:bg-night-soft">
      <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">{card.claim}</h3>
      <p className={muted}>
        <span className="font-medium text-slate-500">What they did — </span>
        {card.whatTheyDid}
      </p>
      <p className={muted}>
        <span className="font-medium text-slate-500">What they found — </span>
        {card.whatTheyFound}
      </p>
      <a
        href={card.citation.url}
        target="_blank"
        rel="noreferrer"
        className="text-sm text-breath-teal underline-offset-4 hover:underline"
      >
        {card.citation.label}
      </a>
    </article>
  );
}

export default function Research() {
  return (
    <main className="mx-auto flex min-h-screen max-w-prose flex-col gap-10 px-6 pb-28 pt-16">
      <Background />

      <header className="flex flex-col gap-4">
        <h1 className="font-display text-3xl font-light text-slate-700 dark:text-whisper">
          The science of slow breathing
        </h1>
        <p className={body}>
          Slow, structured breathing has real but modest evidence behind it. Below is what the
          research actually shows — leading with what is well supported, and flagging what is
          preliminary or mixed.
        </p>
      </header>

      <section className="flex flex-col gap-5" aria-labelledby="evidence">
        <h2 id="evidence" className={h2}>
          The headline evidence
        </h2>
        {STUDY_CARDS.map((card) => (
          <StudyCardView key={card.citation.url} card={card} />
        ))}
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="mechanism">
        <h2 id="mechanism" className={h2}>
          Why slowing the breath does anything at all
        </h2>
        <p className={muted}>{MECHANISM_INTRO}</p>
        <ul className="flex list-disc flex-col gap-3 pl-5">
          {MECHANISMS.map((m) => (
            <li key={m.slice(0, 32)} className={body}>
              {m}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="techniques">
        <h2 id="techniques" className={h2}>
          Notes on each technique
        </h2>
        <dl className="flex flex-col gap-4">
          {TECHNIQUE_NOTES.map((t) => (
            <div key={t.name}>
              <dt className="text-sm font-medium text-slate-800 dark:text-slate-200">{t.name}</dt>
              <dd className={muted}>{t.note}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section
        className="flex flex-col gap-3 rounded-2xl border border-slate-300 p-6 dark:border-night-mist"
        aria-labelledby="safety"
      >
        <h2 id="safety" className={h2}>
          Safety
        </h2>
        <ul className="flex list-disc flex-col gap-2 pl-5">
          {SAFETY_POINTS.map((point) => (
            <li key={point.slice(0, 32)} className={muted}>
              {point}
            </li>
          ))}
          <li className={muted}>
            {CRISIS_LINE.text}{' '}
            <a
              href={CRISIS_LINE.url}
              target="_blank"
              rel="noreferrer"
              className="text-breath-teal underline-offset-4 hover:underline"
            >
              {CRISIS_LINE.label}
            </a>
          </li>
        </ul>
      </section>

      <Link
        to="/"
        className={`${pillButton} fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-100/80 backdrop-blur dark:bg-night/80`}
      >
        ← Back to breathing
      </Link>
    </main>
  );
}
