import { Link } from 'react-router-dom';
import { Background } from '../components/Background';
import { focusRingOffset4, pillButton } from '../components/ui';
import { usePageTitle } from '../components/usePageTitle';
import {
  CRISIS_LINE,
  FURTHER_READING,
  FURTHER_READING_INTRO,
  MECHANISMS,
  MECHANISM_INTRO,
  SAFETY_POINTS,
  STUDY_CARDS,
  TECHNIQUE_NOTES,
} from './researchContent';
import {
  CitationLink,
  ReadingItem,
  Section,
  StudyCardView,
  body,
  eyebrow,
  muted,
} from './researchParts';

/**
 * The research page (PLAN_V2 slice 21).
 *
 * Claims and citations are locked to PRD §6. The mechanism bullets now carry
 * their sources and a further-reading section follows the technique notes,
 * both added to §6 first — the page follows the PRD, never the other way
 * round. Presentational pieces live in `researchParts.tsx`.
 */
export default function Research() {
  usePageTitle('The science of slow breathing — Lamptide');
  return (
    <>
      <a
        href="#research-main"
        className={`sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-full focus:bg-surface-raised focus:px-4 focus:text-meta focus:text-ink ${focusRingOffset4}`}
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
            className={`inline-flex min-h-11 items-center rounded text-meta text-ink-muted transition-colors hover:text-ink ${focusRingOffset4}`}
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
          <ul className="flex list-disc flex-col gap-4 pl-5">
            {MECHANISMS.map((m) => (
              <li key={m.text.slice(0, 32)} className={`${body} max-w-[34rem]`}>
                {m.text}
                {m.citation && (
                  <span className="mt-1 block">
                    <CitationLink label={m.citation.label} url={m.citation.url} />
                  </span>
                )}
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

        <Section id="further-reading" eyebrow="Further reading" title="If you want to go deeper">
          <p className={muted}>{FURTHER_READING_INTRO}</p>
          <div className="flex flex-col gap-5">
            {FURTHER_READING.map((r) => (
              <ReadingItem key={r.url} reading={r} />
            ))}
          </div>
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
