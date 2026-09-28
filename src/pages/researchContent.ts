/**
 * Research page content. Claims must match PRD.md §6 exactly — including
 * the null-result coherent-breathing trial and the safety block. Do not
 * strengthen claims, add uncited benefits, or imply treatment of any
 * condition (CLAUDE.md content rules).
 */

export interface StudyCard {
  /**
   * Optional eyebrow. Used only to lift the verbatim "The honest counterpoint"
   * prefix out of the claim so the card can be visually distinguished — the
   * page's integrity rests on that third card, and it used to render
   * identically to the two supporting results. Re-typesetting, not rewording.
   */
  kicker?: string;
  claim: string;
  whatTheyDid: string;
  whatTheyFound: string;
  citation: { label: string; url: string };
}

export const STUDY_CARDS: StudyCard[] = [
  {
    claim: 'Breathwork reduces self-reported stress, anxiety, and depressive symptoms.',
    whatTheyDid:
      'A 2023 meta-analysis in Scientific Reports pooled 12 randomized controlled trials — 785 participants in total — comparing breathwork against non-breathwork controls.',
    whatTheyFound:
      'Small-to-medium effects favoring breathwork: stress g ≈ −0.35, anxiety g ≈ −0.32, depressive symptoms g ≈ −0.40. The authors state that most included studies were at moderate risk of bias, and urge against overhyping.',
    citation: {
      label: 'Fincham et al. 2023, Scientific Reports (meta-analysis)',
      url: 'https://www.nature.com/articles/s41598-022-27247-y',
    },
  },
  {
    claim:
      'Five minutes a day of structured breathing improved mood and lowered resting respiratory rate.',
    whatTheyDid:
      'A randomized controlled trial in Cell Reports Medicine assigned 108 participants to five minutes daily of cyclic sighing, box breathing, cyclic hyperventilation, or mindfulness meditation for one month. It is published as a brief report, and the four groups are small — between 21 and 33 people each.',
    whatTheyFound:
      'All groups improved. The controlled-breathing groups improved mood more than meditation, and exhale-emphasized cyclic sighing performed best — including a reduction in resting respiratory rate.',
    citation: {
      label: 'Balban et al. 2023, Cell Reports Medicine',
      url: 'https://doi.org/10.1016/j.xcrm.2022.100895',
    },
  },
  {
    kicker: 'The honest counterpoint',
    claim: 'In one well-controlled trial, slow breathing did not beat a faster-breathing placebo.',
    whatTheyDid:
      'A 2023 placebo-controlled randomized trial (400 participants) compared coherent breathing at ~5.5 breaths per minute against a 12 breaths-per-minute placebo protocol, about ten minutes a day for four weeks.',
    whatTheyFound:
      'Both groups improved, with no significant difference between them — and no difference in how credible participants found the exercise they were given. The authors concluded there was no measurable effect of coherent breathing over and above a well-designed placebo, and called for more robustly controlled trials.',
    citation: {
      label: 'Fincham et al. 2023, Scientific Reports (placebo-controlled RCT)',
      url: 'https://www.nature.com/articles/s41598-023-49279-8',
    },
  },
];

export const MECHANISM_INTRO =
  'A fair caveat up front: the mechanisms below are better established than some of the clinical claims built on top of them.';

export interface MechanismNote {
  text: string;
  /**
   * Absent on the third note by intent (PRD §6.2): it is framing, not a
   * finding, and attaching a citation to it would misrepresent what a citation
   * is for. The first two are empirical claims and now carry sources — this
   * section used to assert physiology on nothing while the evidence section
   * beside it was meticulous.
   */
  citation?: { label: string; url: string };
}

export const MECHANISMS: MechanismNote[] = [
  {
    text: 'Slow breathing (around 5–6 breaths per minute) increases heart-rate variability and engages the parasympathetic — "rest and digest" — system via vagal pathways. Long exhales in particular slow the heart rate, a rhythm called respiratory sinus arrhythmia.',
    citation: {
      label:
        'Laborde et al. 2022, Neuroscience & Biobehavioral Reviews — systematic review and meta-analysis of 223 studies',
      url: 'https://doi.org/10.1016/j.neubiorev.2022.104711',
    },
  },
  {
    text: 'The double inhale of a physiological sigh reinflates collapsed alveoli and offloads CO₂ efficiently — part of why a long sigh is the body’s built-in reset.',
    citation: {
      label: 'Severs, Vlemincx & Ramirez 2022, Biological Psychology',
      url: 'https://doi.org/10.1016/j.biopsycho.2022.108313',
    },
  },
  {
    text: 'Breathing is unusual: it is the one autonomic process we can directly steer, which makes it a lever on a system that is otherwise hard to reach.',
  },
];

export interface Reading {
  label: string;
  url: string;
  note: string;
}

/** PRD §6.5. Two, not ten — a reading list that cannot be finished is decoration. */
export const FURTHER_READING_INTRO =
  'If you want more than this page carries, these two are the places to start.';

export const FURTHER_READING: Reading[] = [
  {
    label: 'Zaccaro et al. 2018, Frontiers in Human Neuroscience',
    url: 'https://doi.org/10.3389/fnhum.2018.00353',
    note: 'A systematic review of what slow breathing does to the body and brain: heart-rate variability and respiratory sinus arrhythmia rise, EEG alpha rises, and people report less anxiety and arousal. Free to read in full, which is why it is here.',
  },
  {
    // The DOI, like every other citation here. PubMed and Europe PMC both look
    // friendlier for a reader, but all three sit behind bot protection that I
    // cannot see past from a headless browser, so I could not establish that
    // either is actually easier to open. The DOI is at least canonical and
    // permanent. The paywall is called out in the note instead.
    label: 'Morgan, Lengacher & Seo 2025, Journal of Holistic Nursing',
    url: 'https://doi.org/10.1177/08980101241273860',
    note: 'The most recent systematic review aimed squarely at breathing exercises for anxiety and stress in adults. Nineteen studies; twelve reported significant improvement in anxiety. Its own caveat is worth keeping: there is still "limited evidence that includes large randomized controlled trials." Abstract free; the full text is paywalled.',
  },
];

export interface TechniqueNote {
  name: string;
  note: string;
}

export const TECHNIQUE_NOTES: TechniqueNote[] = [
  {
    name: 'Box breathing',
    note: 'Widely used for acute composure (popularized via military use). It performed comparably to other structured techniques in the Stanford randomized trial above.',
  },
  {
    name: '4-7-8',
    note: 'Popularized by Dr. Andrew Weil for relaxation and sleep onset. Direct trial evidence is thinner than for slow breathing generally — treat it as a slow-breathing variant with strong anecdotal adoption. Mild lightheadedness is common for beginners; start with 2–4 cycles.',
  },
  {
    name: 'Coherent breathing (~5.5 breaths/min)',
    note: 'The standard protocol in heart-rate-variability research — and the subject of the mixed placebo-controlled result above.',
  },
  {
    name: 'Physiological sigh',
    note: 'The best single-session evidence for a fast mood shift (Balban 2023).',
  },
];

export const SAFETY_POINTS: string[] = [
  'This site is an educational pacing tool, not medical advice, and is not a treatment for anxiety disorders, depression, or any condition.',
  'Stop if you feel dizzy or lightheaded. Breath holds and long exhales can cause lightheadedness, especially when standing.',
  'If you are pregnant or have cardiovascular, respiratory, or panic-related conditions, check with a clinician before breath-hold practices.',
];

export const CRISIS_LINE = {
  text: 'If you are in crisis, seek professional help — in the US, call or text 988.',
  label: '988 Suicide & Crisis Lifeline',
  url: 'https://988lifeline.org',
};
