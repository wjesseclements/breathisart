import { Link } from 'react-router-dom';
import { Background } from '../components/Background';
import { focusRingOffset4, pillButton } from '../components/ui';
import { usePageTitle } from '../components/usePageTitle';
import type { StudyCard } from './researchContent';
import {
  CRISIS_LINE,
  MECHANISMS,
  MECHANISM_INTRO,
  SAFETY_POINTS,
  STUDY_CARDS,
  TECHNIQUE_NOTES,
} from './researchContent';

/**
 * The research page (PLAN_V2 slice 21).
 *
 * Claims and citations are locked to PRD §6 — this pass restyles and
 * restructures only. The one content change is mechanical: the verbatim
 * "The honest counterpoint" prefix moved from the claim string into a `kicker`
 * field so that card can be designed.
 */
const body = 'text-body text-ink';
const muted = 'text-meta leading-relaxed text-ink-muted';
const eyebrow = 'text-label uppercase text-ink-faint';

function Section({
  id,
  eyebrow: label,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5 border-t border-line pt-8" aria-labelledby={id}>
      <div className="flex flex-col gap-2">
        <p className="text-label uppercase tracking-[0.16em] text-[rgb(var(--accent-core))]">
          {label}
        </p>
        <h2 id={id} className="font-display text-lede font-normal text-ink-strong">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function StudyCardView({ card }: { card: StudyCard }) {
  const counterpoint = card.kicker !== undefined;
  return (
    <article
      className={`flex flex-col gap-4 rounded-2xl bg-surface-raised p-6 ring-1 ring-line ${
        counterpoint ? 'border-l-2 border-l-amber-500/50 dark:border-l-amber-400/40' : ''
      }`}
    >
      {counterpoint && (
        <p className="self-start rounded-full border border-amber-600/40 px-2 py-0.5 text-label uppercase text-amber-700 dark:border-amber-400/40 dark:text-amber-300/90">
          {card.kicker}
        </p>
      )}
      <h3 className="font-display text-title font-light text-ink-strong">{card.claim}</h3>
      <div className="flex flex-col gap-1">
        <p className={eyebrow}>What they did</p>
        <p className={`${body} max-w-[34rem]`}>{card.whatTheyDid}</p>
      </div>
      <div className="flex flex-col gap-1">
        <p className={eyebrow}>What they found</p>
        <p className={`${body} max-w-[34rem]`}>{card.whatTheyFound}</p>
      </div>
      <a
        href={card.citation.url}
        target="_blank"
        rel="noreferrer"
        className={`rounded text-meta text-accent-strong underline-offset-4 hover:underline ${focusRingOffset4}`}
      >
        {card.citation.label}
      </a>
    </article>
  );
}

export default function Research() {
  usePageTitle('The science of slow breathing — Stillpoint');
  return (
    <>
      <a
        href="#research-main"
        className={`sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-surface-raised focus:px-4 focus:py-2 focus:text-meta focus:text-ink ${focusRingOffset4}`}
      >
        Skip to content
      </a>
      <Background />

      {/* Sticky, not floating. The old fixed pill sat mid-viewport and veiled
          card text scrolling behind its blur. */}
      <div className="sticky top-0 z-20 border-b border-line bg-surface-page/90 backdrop-blur">
        <div className="mx-auto flex max-w-prose items-center px-6 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
          <Link
            to="/"
            className={`rounded text-meta text-ink-muted transition-colors hover:text-ink ${focusRingOffset4}`}
          >
            ← Back to breathing
          </Link>
        </div>
      </div>

      <main
        id="research-main"
        className="mx-auto flex min-h-[100svh] max-w-prose flex-col gap-10 px-6 pb-[calc(4rem+env(safe-area-inset-bottom))] pt-10"
      >
        <header className="flex flex-col gap-4">
          <h1 className="font-display text-title font-light text-ink-strong sm:text-[2.25rem]">
            The science of slow breathing
          </h1>
          <p className={`${body} max-w-[34rem]`}>
            Slow, structured breathing has real but modest evidence behind it. Below is what the
            research actually shows — leading with what is well supported, and flagging what is
            preliminary or mixed.
          </p>
        </header>

        <Section id="evidence" eyebrow="Evidence" title="The headline evidence">
          {STUDY_CARDS.map((card) => (
            <StudyCardView key={card.citation.url} card={card} />
          ))}
        </Section>

        <Section
          id="mechanism"
          eyebrow="Mechanism"
          title="Why slowing the breath does anything at all"
        >
          <p className={muted}>{MECHANISM_INTRO}</p>
          <ul className="flex list-disc flex-col gap-3 pl-5">
            {MECHANISMS.map((m) => (
              <li key={m.slice(0, 32)} className={`${body} max-w-[34rem]`}>
                {m}
              </li>
            ))}
          </ul>
        </Section>

        <Section id="techniques" eyebrow="Per technique" title="Notes on each technique">
          <dl className="flex flex-col gap-5">
            {TECHNIQUE_NOTES.map((t) => (
              <div key={t.name} className="flex flex-col gap-1">
                <dt className={eyebrow}>{t.name}</dt>
                <dd className={`${body} max-w-[34rem]`}>{t.note}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <section
          className="flex flex-col gap-4 rounded-2xl border-l-2 border-l-rose-600/50 bg-surface-raised p-6 ring-1 ring-line dark:border-l-rose-400/50"
          aria-labelledby="safety"
        >
          <h2 id="safety" className="font-display text-lede font-normal text-ink-strong">
            Safety
          </h2>
          <ul className="flex list-disc flex-col gap-3 pl-5">
            {SAFETY_POINTS.map((point) => (
              <li key={point.slice(0, 32)} className={body}>
                {point}
              </li>
            ))}
          </ul>

          {/* Out of the caution list and into its own callout. A suicide
              prevention resource should not be the fourth <li> after "stop if
              you feel dizzy". Wording untouched; the phone number is just
              actionable now. */}
          <div className="flex flex-col gap-2 border-t border-line pt-4">
            <p className={body}>{CRISIS_LINE.text}</p>
            <div className="flex flex-wrap gap-2">
              <a href="tel:988" className={`${pillButton} no-underline`}>
                Call 988
              </a>
              <a href="sms:988" className={`${pillButton} no-underline`}>
                Text 988
              </a>
              <a
                href={CRISIS_LINE.url}
                target="_blank"
                rel="noreferrer"
                className={`${pillButton} no-underline`}
              >
                {CRISIS_LINE.label}
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
