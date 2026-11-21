// Evaluation metrics for a binary classifier, on a spam filter you can count by hand.
//
// A classifier gives every email a score between 0 and 1. A threshold turns the
// score into a decision: score ≥ threshold → "spam" (the positive class), as
// scikit-learn does. Comparing each decision with the truth sorts every email
// into one of four cells of the confusion matrix, and every metric is a ratio
// of those four counts (definitions as in scikit-learn's metrics guide):
//
//   precision   = TP / (TP + FP)       of the emails flagged, how many were spam
//   recall      = TP / (TP + FN)       of the spam, how much was caught (also TPR)
//   specificity = TN / (TN + FP)       of the normal email, how much was let through
//   FPR         = FP / (FP + TN)       = 1 − specificity
//   accuracy    = (TP + TN) / all
//   F1          = 2 · precision · recall / (precision + recall)
//
// A ratio whose bottom is 0 has no value (scikit-learn warns and returns 0);
// here it is null, so the page can say why instead of showing a made-up 0.

import type { BaseStep } from "../algorithms/types";
import { seededRng } from "./random";

export interface Scored {
  id: number;
  /** The truth: is this email really spam? */
  spam: boolean;
  /** The classifier's score: how sure it is that the email is spam. */
  score: number;
  subject: string;
}

/**
 * The page's filter. Hand-set so the default threshold (0.5) gives round,
 * checkable counts: TP 6, FP 3, FN 2, TN 9. No two scores are equal, so every
 * threshold between them is a clean cut.
 */
export const EMAILS: Scored[] = [
  { id: 1, spam: true, score: 0.95, subject: "You won a free cruise" },
  { id: 2, spam: true, score: 0.91, subject: "Claim your cash prize now" },
  { id: 3, spam: true, score: 0.86, subject: "Cheap pills, limited offer" },
  { id: 4, spam: true, score: 0.78, subject: "Your account will be closed" },
  { id: 5, spam: true, score: 0.71, subject: "Hot deals inside" },
  { id: 6, spam: true, score: 0.62, subject: "Work from home, earn big" },
  { id: 7, spam: true, score: 0.44, subject: "Quick question about your order" },
  { id: 8, spam: true, score: 0.27, subject: "Meeting notes (see link)" },
  { id: 9, spam: false, score: 0.83, subject: "Free lunch on Friday!" },
  { id: 10, spam: false, score: 0.66, subject: "Your prize-draw ticket from the fair" },
  { id: 11, spam: false, score: 0.55, subject: "Limited seats for the workshop" },
  { id: 12, spam: false, score: 0.48, subject: "Invoice for March" },
  { id: 13, spam: false, score: 0.38, subject: "Can you review my draft?" },
  { id: 14, spam: false, score: 0.33, subject: "Flight confirmation" },
  { id: 15, spam: false, score: 0.25, subject: "Team photo from the offsite" },
  { id: 16, spam: false, score: 0.19, subject: "Dinner on Saturday?" },
  { id: 17, spam: false, score: 0.14, subject: "Project update" },
  { id: 18, spam: false, score: 0.09, subject: "Happy birthday!" },
  { id: 19, spam: false, score: 0.06, subject: "Minutes from Monday" },
  { id: 20, spam: false, score: 0.03, subject: "Library book due" },
];

export const DEFAULT_THRESHOLD = 0.5;

export type Outcome = "tp" | "fp" | "fn" | "tn";

export const OUTCOME_LABEL: Record<Outcome, string> = {
  tp: "true positive",
  fp: "false positive",
  fn: "false negative",
  tn: "true negative",
};

/** What the threshold decides, and whether that was right. */
export function outcomeOf(e: Pick<Scored, "spam" | "score">, threshold: number): Outcome {
  const flagged = e.score >= threshold;
  if (flagged) return e.spam ? "tp" : "fp";
  return e.spam ? "fn" : "tn";
}

export interface Confusion {
  tp: number;
  fp: number;
  fn: number;
  tn: number;
}

export function confusion(items: readonly Pick<Scored, "spam" | "score">[], threshold: number): Confusion {
  const c: Confusion = { tp: 0, fp: 0, fn: 0, tn: 0 };
  for (const e of items) c[outcomeOf(e, threshold)]++;
  return c;
}

/** A ratio, or null when its bottom is 0 (the metric has no value). */
const ratio = (top: number, bottom: number) => (bottom === 0 ? null : top / bottom);

export interface Metrics {
  accuracy: number | null;
  precision: number | null;
  recall: number | null;
  specificity: number | null;
  fpr: number | null;
  f1: number | null;
}

export function metricsOf(c: Confusion): Metrics {
  const precision = ratio(c.tp, c.tp + c.fp);
  const recall = ratio(c.tp, c.tp + c.fn);
  const specificity = ratio(c.tn, c.tn + c.fp);
  // F1 is the harmonic mean; when both are 0 it is 0, when either is missing it is missing.
  const f1 = precision === null || recall === null ? null : precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  return {
    accuracy: ratio(c.tp + c.tn, c.tp + c.fp + c.fn + c.tn),
    precision,
    recall,
    specificity,
    fpr: ratio(c.fp, c.fp + c.tn),
    f1,
  };
}

// ---------------------------------------------------------------------------
// Sweeping the threshold.

export interface RocPoint {
  /** The threshold that gives this point (flag everything scoring at least this). */
  threshold: number;
  fpr: number;
  tpr: number;
}

/**
 * The ROC curve: lower the threshold past each score in turn, from "flag
 * nothing" (0, 0) to "flag everything" (1, 1). Each spam email passed moves the
 * curve up one step, each normal email moves it right. Equal scores move
 * together, so a tie makes a diagonal step.
 */
export function rocCurve(items: readonly Pick<Scored, "spam" | "score">[]): RocPoint[] {
  const pos = items.filter((e) => e.spam).length;
  const neg = items.length - pos;
  if (pos === 0 || neg === 0) throw new RangeError("An ROC curve needs at least one email of each kind.");
  const scores = [...new Set(items.map((e) => e.score))].sort((a, b) => b - a);
  const out: RocPoint[] = [{ threshold: Infinity, fpr: 0, tpr: 0 }];
  for (const t of scores) {
    const c = confusion(items, t);
    out.push({ threshold: t, fpr: c.fp / neg, tpr: c.tp / pos });
  }
  return out;
}

/** Area under a curve of points sorted by x, by the trapezoid rule (as scikit-learn's auc). */
export function trapezoidArea(points: readonly { fpr: number; tpr: number }[]): number {
  let area = 0;
  for (let i = 1; i < points.length; i++) area += ((points[i].fpr - points[i - 1].fpr) * (points[i].tpr + points[i - 1].tpr)) / 2;
  return area;
}

/**
 * AUC as a probability: pick one spam and one normal email at random; how
 * often does the spam score higher? Ties count half. This equals the area
 * under the ROC curve, which the tests check.
 */
export function aucByPairs(items: readonly Pick<Scored, "spam" | "score">[]): number {
  const pos = items.filter((e) => e.spam);
  const neg = items.filter((e) => !e.spam);
  let wins = 0;
  for (const p of pos) for (const n of neg) wins += p.score > n.score ? 1 : p.score === n.score ? 0.5 : 0;
  return wins / (pos.length * neg.length);
}

/** Precision and recall at many thresholds, for the trade-off chart. */
export function sweep(items: readonly Pick<Scored, "spam" | "score">[], steps = 100): { threshold: number; precision: number | null; recall: number | null; f1: number | null }[] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const threshold = i / steps;
    const m = metricsOf(confusion(items, threshold));
    return { threshold, precision: m.precision, recall: m.recall, f1: m.f1 };
  });
}

// ---------------------------------------------------------------------------
// Three filters on the same 20 emails, for comparing ROC curves.

export type ModelKey = "page" | "sharp" | "coin";

export const MODELS: Record<ModelKey, { label: string; blurb: string }> = {
  sharp: { label: "Sharper filter", blurb: "Almost every spam email scores above almost every normal one. The curve hugs the top-left corner." },
  page: { label: "This page's filter", blurb: "Mostly right, with a few normal emails that look spammy and a few spam emails that slip under." },
  coin: { label: "Coin flip", blurb: "Scores are random, so they say nothing about the truth. The curve wanders around the diagonal and the area is near 0.5. With only 20 emails, luck alone can move it a fair way either side." },
};

/** The same emails, with the scores a different filter would give. */
export function emailsFor(model: ModelKey): Scored[] {
  if (model === "page") return EMAILS;
  if (model === "sharp") {
    // Spam pushed up, normal email pushed down, keeping each group's order;
    // only one normal email (the "free lunch") still outscores one spam email.
    const sharp: Record<number, number> = {
      1: 0.98, 2: 0.96, 3: 0.94, 4: 0.9, 5: 0.87, 6: 0.81, 7: 0.74, 8: 0.58,
      9: 0.63, 10: 0.42, 11: 0.36, 12: 0.31, 13: 0.24, 14: 0.2, 15: 0.16, 16: 0.12, 17: 0.08, 18: 0.05, 19: 0.03, 20: 0.01,
    };
    return EMAILS.map((e) => ({ ...e, score: sharp[e.id] }));
  }
  // Seed 16 lands near 0.5 (0.51); with only 20 emails, other seeds range from about 0.3 to 0.7.
  const rng = seededRng(16);
  // Two decimals like the others, nudged apart so no two scores tie.
  const used = new Set<number>();
  return EMAILS.map((e) => {
    let s = Math.round(rng() * 98 + 1);
    while (used.has(s)) s = (s % 99) + 1;
    used.add(s);
    return { ...e, score: s / 100 };
  });
}

// ---------------------------------------------------------------------------
// The accuracy trap: a rare condition.

export interface RareScenario {
  key: "lazy" | "test";
  label: string;
  blurb: string;
  confusion: Confusion;
}

/** 1,000 people, 10 of them sick. */
export const RARE: RareScenario[] = [
  {
    key: "lazy",
    label: "Always say “healthy”",
    blurb: "A “model” that never flags anyone. It is right about all 990 healthy people and misses every sick one.",
    confusion: { tp: 0, fp: 0, fn: 10, tn: 990 },
  },
  {
    key: "test",
    label: "A real screening test",
    blurb: "Catches 9 of the 10 sick people, but also flags 50 healthy ones. Lower accuracy, yet far more useful.",
    confusion: { tp: 9, fp: 50, fn: 1, tn: 940 },
  },
];

// ---------------------------------------------------------------------------
// The stepper: judge each email in turn, then work out the metrics.

export interface MetricStep extends BaseStep {
  phase: "threshold" | "judge" | "precision" | "recall" | "f1" | "accuracy";
  /** Emails judged so far (in EMAILS order). */
  judged: number;
  /** The email judged in this step. */
  current?: number;
  counts: Confusion;
}

const pct = (v: number | null) => (v === null ? "undefined" : `${(v * 100).toFixed(1)}%`);
const f2 = (v: number) => v.toFixed(2);

export function buildMetricSteps(items: readonly Scored[], threshold: number): MetricStep[] {
  const counts: Confusion = { tp: 0, fp: 0, fn: 0, tn: 0 };
  const steps: MetricStep[] = [];
  const snap = (s: Omit<MetricStep, "counts">) => steps.push({ ...s, counts: { ...counts } });
  const flagged = items.filter((e) => e.score >= threshold).length;

  snap({
    phase: "threshold",
    judged: 0,
    explanation: `The filter has scored all ${items.length} emails. The threshold is ${f2(threshold)}: anything scoring at least that is flagged as spam. That flags ${flagged} email${flagged === 1 ? "" : "s"}.`,
  });

  items.forEach((e, i) => {
    const o = outcomeOf(e, threshold);
    counts[o]++;
    const decision = e.score >= threshold ? `${f2(e.score)} ≥ ${f2(threshold)}, so it is flagged as spam` : `${f2(e.score)} < ${f2(threshold)}, so it goes to the inbox`;
    const verdict =
      o === "tp"
        ? "It really is spam: a true positive, caught correctly."
        : o === "fp"
          ? "But it's a normal email: a false positive, a real message wrongly sent to the spam folder."
          : o === "fn"
            ? "But it really is spam: a false negative, spam that slipped through."
            : "It's a normal email: a true negative, correctly left alone.";
    snap({ phase: "judge", judged: i + 1, current: i, explanation: `“${e.subject}” scored ${decision}. ${verdict}` });
  });

  const m = metricsOf(counts);
  snap({
    phase: "precision",
    judged: items.length,
    explanation:
      m.precision === null
        ? "Precision asks: of the emails flagged as spam, how many were spam? Nothing was flagged, so it has no value."
        : `Precision: of the ${counts.tp + counts.fp} flagged emails, ${counts.tp} were spam. ${counts.tp} ÷ ${counts.tp + counts.fp} = ${pct(m.precision)}. When it flags something, that's how often it's right.`,
  });
  snap({
    phase: "recall",
    judged: items.length,
    explanation:
      m.recall === null
        ? "Recall asks: of the spam, how much was caught? There is no spam here, so it has no value."
        : `Recall: of the ${counts.tp + counts.fn} spam emails, ${counts.tp} were caught. ${counts.tp} ÷ ${counts.tp + counts.fn} = ${pct(m.recall)}. That's how much spam it finds.`,
  });
  snap({
    phase: "f1",
    judged: items.length,
    explanation:
      m.f1 === null
        ? "F1 combines precision and recall, so it has no value when either is missing."
        : `F1 combines the two: 2 × precision × recall ÷ (precision + recall) = ${pct(m.f1)}. It's only high when both are high.`,
  });
  snap({
    phase: "accuracy",
    judged: items.length,
    explanation: `Accuracy: ${counts.tp} + ${counts.tn} correct out of ${items.length} = ${pct(m.accuracy)}. Easy to read, but on its own it can hide which kind of mistake the filter makes.`,
    done: true,
  });
  return steps;
}
