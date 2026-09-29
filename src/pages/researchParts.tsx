import { linkText } from '../components/ui';
import type { Reading, StudyCard } from './researchContent';

/**
 * Presentational pieces of the research page, lifted out of `Research.tsx`
 * when adding the mechanism citations and the further-reading section pushed
 * that file well past the ~150-line rule in CLAUDE.md.
 *
 * Nothing here decides content. Claims and citations are locked to PRD §6.
 */
export const body = 'text-body text-ink';
export const muted = 'text-meta leading-relaxed text-ink-muted';
export const eyebrow = 'text-label uppercase text-ink-faint';

/** Every outbound citation on the page goes through here, so they cannot drift. */
export function CitationLink({ label, url }: { label: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      /* `inline-block` with vertical padding, not `inline-flex`: these labels
         wrap to two and three lines, and a flex line box would refuse to break
         them. Measured at 20px when they happen to fit on one line, which is
         under WCAG 2.5.8's 24px floor — the ones that passed only passed by
         accident of wrapping. */
      className={`inline-block rounded py-3 text-meta ${linkText}`}
    >
      {label}
    </a>
  );
}

export function Section({
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
        <p className="text-label uppercase tracking-[0.16em] text-[rgb(var(--accent-strong))]">
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

export function StudyCardView({ card }: { card: StudyCard }) {
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
      <CitationLink label={card.citation.label} url={card.citation.url} />
    </article>
  );
}

export function ReadingItem({ reading }: { reading: Reading }) {
  return (
    <div className="flex flex-col gap-1">
      <CitationLink label={reading.label} url={reading.url} />
      <p className={`${muted} max-w-[34rem]`}>{reading.note}</p>
    </div>
  );
}
