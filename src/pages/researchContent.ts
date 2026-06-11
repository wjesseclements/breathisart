/**
 * Research page content. Claims must match PRD.md §6 exactly — including
 * the null-result coherent-breathing trial and the safety block. Do not
 * strengthen claims, add uncited benefits, or imply treatment of any
 * condition (CLAUDE.md content rules).
 */

export interface StudyCard {
  claim: string;
  whatTheyDid: string;
  whatTheyFound: string;
  citation: { label: string; url: string };
}

export const STUDY_CARDS: StudyCard[] = [
  {
    claim: 'Breathwork reduces self-reported stress, anxiety, and depressive symptoms.',
    whatTheyDid:
      'A 2023 meta-analysis in Scientific Reports pooled randomized controlled trials comparing breathwork against non-breathwork controls.',
    whatTheyFound:
      'Small-to-medium effects favoring breathwork: stress g ≈ −0.35, anxiety g ≈ −0.32, depressive symptoms g ≈ −0.40. The authors caution that many included studies carried moderate risk of bias, and urge against overhyping.',
    citation: {
      label: 'Fincham et al. 2023, Scientific Reports (meta-analysis)',
      url: 'https://www.nature.com/articles/s41598-022-27247-y',
    },
  },
  {
    claim:
      'Five minutes a day of structured breathing improved mood and lowered resting respiratory rate.',
    whatTheyDid:
      'A randomized controlled trial in Cell Reports Medicine assigned about 110 participants to five minutes daily of cyclic sighing, box breathing, cyclic hyperventilation, or mindfulness meditation for one month.',
    whatTheyFound:
      'All groups improved. The controlled-breathing groups improved mood more than meditation, and exhale-emphasized cyclic sighing performed best — including a reduction in resting respiratory rate.',
    citation: {
      label: 'Balban et al. 2023, Cell Reports Medicine',
      url: 'https://doi.org/10.1016/j.xcrm.2022.100895',
    },
  },
  {
    claim:
      'The honest counterpoint: in one well-controlled trial, slow breathing did not beat a faster-breathing placebo.',
    whatTheyDid:
      'A 2023 placebo-controlled randomized trial (about 400 participants) compared coherent breathing at ~5.5 breaths per minute against a 12 breaths-per-minute placebo protocol.',
    whatTheyFound:
      'Both groups improved, with no significant difference between them — evidence that expectation and ritual contribute, and that the field still needs better-controlled trials.',
    citation: {
      label: 'Fincham et al. 2023, Scientific Reports (placebo-controlled RCT)',
      url: 'https://www.nature.com/articles/s41598-023-49279-8',
    },
  },
];

export const MECHANISM_INTRO =
  'A fair caveat up front: the mechanisms below are better established than some of the clinical claims built on top of them.';

export const MECHANISMS: string[] = [
  'Slow breathing (around 5–6 breaths per minute) increases heart-rate variability and engages the parasympathetic — "rest and digest" — system via vagal pathways. Long exhales in particular slow the heart rate, a rhythm called respiratory sinus arrhythmia.',
  'The double inhale of a physiological sigh reinflates collapsed alveoli and offloads CO₂ efficiently — part of why a long sigh is the body’s built-in reset.',
  'Breathing is unusual: it is the one autonomic process we can directly steer, which makes it a lever on a system that is otherwise hard to reach.',
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
