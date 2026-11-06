// Multinomial Naive Bayes on a tiny made-up spam dataset, plus a 1-D
// Gaussian Naive Bayes for numbers.
//
// Formulas follow scikit-learn's naive Bayes documentation:
//   decision      ŷ = argmax_c  P(c) · Π P(xᵢ | c)
//   word chance   P(w | c) = (N_cw + α) / (N_c + α·|V|)    (α = 1 is Laplace smoothing)
// Words the model never saw in training are ignored, as a vectorizer would.
// Scores are kept as sums of logs, then turned back into percentages.

import type { BaseStep } from "../algorithms/types";

export type NbClass = "spam" | "ham";
export const NB_CLASSES: NbClass[] = ["spam", "ham"];
export const CLASS_LABEL: Record<NbClass, string> = { spam: "spam", ham: "not spam" };

export interface Email {
  text: string;
  label: NbClass;
}

/** Made up for teaching: short enough to count every word by hand. */
export const TRAINING_EMAILS: Email[] = [
  { text: "win free money now", label: "spam" },
  { text: "free prize claim now", label: "spam" },
  { text: "cheap pills free offer", label: "spam" },
  { text: "win a free prize today", label: "spam" },
  { text: "claim your cash prize now", label: "spam" },
  { text: "limited offer win cash", label: "spam" },
  { text: "meeting moved to monday", label: "ham" },
  { text: "can we talk about the project today", label: "ham" },
  { text: "free lunch at noon on monday", label: "ham" },
  { text: "here is the offer for the project", label: "ham" },
  { text: "thanks for the meeting notes", label: "ham" },
  { text: "see you at lunch today", label: "ham" },
];

export const TEST_EMAILS: { text: string; note: string }[] = [
  { text: "free cash today", note: "mostly spam words" },
  { text: "project meeting today", note: "mostly work words" },
  { text: "win lunch on monday", note: "a mix of both" },
  { text: "free offer today meeting", note: "the smoothing trap: “meeting” never appears in spam" },
];

export const tokenize = (text: string): string[] => text.toLowerCase().match(/[a-z]+/g) ?? [];

export interface NbModel {
  alpha: number;
  vocab: string[];
  /** Training emails per class, for the prior. */
  docs: Record<NbClass, number>;
  /** Word counts per class. */
  counts: Record<NbClass, Record<string, number>>;
  /** Total words per class. */
  totals: Record<NbClass, number>;
}

export function trainNb(emails: Email[], alpha: number): NbModel {
  const counts: NbModel["counts"] = { spam: {}, ham: {} };
  const totals = { spam: 0, ham: 0 };
  const docs = { spam: 0, ham: 0 };
  const vocab = new Set<string>();
  for (const e of emails) {
    docs[e.label]++;
    for (const w of tokenize(e.text)) {
      vocab.add(w);
      counts[e.label][w] = (counts[e.label][w] ?? 0) + 1;
      totals[e.label]++;
    }
  }
  return { alpha, vocab: [...vocab].sort(), docs, counts, totals };
}

export const prior = (m: NbModel, c: NbClass) => m.docs[c] / (m.docs.spam + m.docs.ham);

/** P(word | class), smoothed: (count + α) / (total + α·|V|). */
export const wordProb = (m: NbModel, c: NbClass, w: string) =>
  ((m.counts[c][w] ?? 0) + m.alpha) / (m.totals[c] + m.alpha * m.vocab.length);

/** Turn log scores into percentages that add up to 1, safely. */
export function normalise(logs: Record<NbClass, number>): Record<NbClass, number> | null {
  const m = Math.max(logs.spam, logs.ham);
  if (m === -Infinity) return null; // both classes ruled out: no answer
  const es = Math.exp(logs.spam - m);
  const eh = Math.exp(logs.ham - m);
  return { spam: es / (es + eh), ham: eh / (es + eh) };
}

export interface NbStep extends BaseStep {
  phase: "prior" | "word" | "skip" | "normalise" | "decide";
  /** Index of the word just used, for highlighting. */
  wordIndex?: number;
  word?: string;
  /** P(word | class) for the word just used. */
  probs?: Record<NbClass, number>;
  /** Running log score per class: ln P(c) + Σ ln P(w | c). */
  logs: Record<NbClass, number>;
  /** The same running score as a plain product (shown while it's readable). */
  products: Record<NbClass, number>;
  posterior?: Record<NbClass, number> | null;
}

const fmt = (v: number) => (v === 0 ? "0" : v < 0.001 ? v.toExponential(2) : v.toFixed(3));

export function buildNbSteps(m: NbModel, text: string): NbStep[] {
  const words = tokenize(text);
  const logs = { spam: Math.log(prior(m, "spam")), ham: Math.log(prior(m, "ham")) };
  const products = { spam: prior(m, "spam"), ham: prior(m, "ham") };
  const steps: NbStep[] = [];
  const snap = (s: Omit<NbStep, "logs" | "products">) => steps.push({ ...s, logs: { ...logs }, products: { ...products } });

  snap({
    phase: "prior",
    explanation: `Before reading anything: ${m.docs.spam} of ${m.docs.spam + m.docs.ham} training emails were spam, so P(spam) = ${fmt(products.spam)} and P(not spam) = ${fmt(products.ham)}.`,
  });

  words.forEach((w, i) => {
    if (!m.vocab.includes(w)) {
      snap({ phase: "skip", wordIndex: i, word: w, explanation: `“${w}” never appeared in training, so it tells us nothing. Skip it.` });
      return;
    }
    const probs = { spam: wordProb(m, "spam", w), ham: wordProb(m, "ham", w) };
    for (const c of NB_CLASSES) {
      logs[c] += Math.log(probs[c]);
      products[c] *= probs[c];
    }
    const ratio = probs.spam / probs.ham;
    snap({
      phase: "word",
      wordIndex: i,
      word: w,
      probs,
      explanation:
        probs.spam === 0 || probs.ham === 0
          ? `“${w}”: P(word | spam) = ${fmt(probs.spam)}, P(word | not spam) = ${fmt(probs.ham)}. A zero rules a class out completely, however strong the other words are.`
          : `“${w}”: P(word | spam) = ${fmt(probs.spam)}, P(word | not spam) = ${fmt(probs.ham)}. It is ${ratio >= 1 ? `${ratio.toFixed(1)}× more likely in spam` : `${(1 / ratio).toFixed(1)}× more likely in normal email`}. Multiply each score by its chance.`,
    });
  });

  const posterior = normalise(logs);
  snap({
    phase: "normalise",
    posterior,
    explanation: posterior
      ? `Scale the two scores so they add up to 100%: spam ${(posterior.spam * 100).toFixed(1)}%, not spam ${(posterior.ham * 100).toFixed(1)}%.`
      : "Both scores are 0, because each class contains a word with zero chance. Without smoothing there's no answer at all.",
  });
  const winner = posterior ? (posterior.spam >= posterior.ham ? "spam" : "ham") : null;
  snap({
    phase: "decide",
    posterior,
    explanation: winner ? `The bigger score wins: this email is classified as ${CLASS_LABEL[winner]}.` : "No class can be chosen. This is exactly the problem smoothing (α = 1) fixes.",
    done: true,
  });
  return steps;
}

export function classifyNb(m: NbModel, text: string) {
  return buildNbSteps(m, text).at(-1)!.posterior;
}

// ---------------------------------------------------------------------------
// Gaussian Naive Bayes in one dimension: fruit weight in grams.

export const FRUIT_WEIGHTS = {
  apple: [150, 160, 170, 165, 155, 175, 145, 180],
  orange: [190, 210, 200, 220, 195, 205, 215, 185],
};

export interface Gaussian {
  mean: number;
  /** Maximum-likelihood variance (divide by n), as scikit-learn's GaussianNB uses. */
  variance: number;
}

export function fitGaussian(xs: number[]): Gaussian {
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const variance = xs.reduce((a, x) => a + (x - mean) ** 2, 0) / xs.length;
  return { mean, variance };
}

export const gaussianPdf = (g: Gaussian, x: number) => Math.exp(-((x - g.mean) ** 2) / (2 * g.variance)) / Math.sqrt(2 * Math.PI * g.variance);

/** P(apple | weight) with equal priors. */
export function appleChance(x: number) {
  const a = gaussianPdf(fitGaussian(FRUIT_WEIGHTS.apple), x);
  const o = gaussianPdf(fitGaussian(FRUIT_WEIGHTS.orange), x);
  return a / (a + o);
}

/** Where the two weighted bell curves cross inside the data range (the decision boundary). */
export function gaussianBoundary(lo = 100, hi = 260) {
  let prev = appleChance(lo) - 0.5;
  for (let x = lo + 0.01; x <= hi; x += 0.01) {
    const cur = appleChance(x) - 0.5;
    if (prev > 0 && cur <= 0) return x;
    prev = cur;
  }
  return NaN;
}
