// How a language model picks its next word: logits → temperature → softmax →
// top-k / top-p filtering → renormalise → sample.
//
// The candidate words and their logits are written by hand for each prompt
// (a real model scores its whole vocabulary). Everything after the logits is
// exactly what real decoders do.

import type { BaseStep } from "../algorithms/types";
import { seededRng } from "./random";

export interface Candidate {
  token: string;
  logit: number;
}

export interface Prompt {
  id: string;
  text: string;
  candidates: Candidate[];
}

export const PROMPTS: Prompt[] = [
  {
    id: "capital",
    text: "The capital of France is",
    candidates: [
      { token: "Paris", logit: 9.2 },
      { token: "a", logit: 5.4 },
      { token: "located", logit: 4.9 },
      { token: "the", logit: 4.6 },
      { token: "Lyon", logit: 3.1 },
      { token: "beautiful", logit: 2.8 },
      { token: "not", logit: 2.2 },
      { token: "Berlin", logit: 0.9 },
    ],
  },
  {
    id: "story",
    text: "Once upon a time, there was a",
    candidates: [
      { token: "little", logit: 6.1 },
      { token: "young", logit: 5.6 },
      { token: "king", logit: 5.3 },
      { token: "girl", logit: 5.1 },
      { token: "princess", logit: 4.9 },
      { token: "dragon", logit: 4.5 },
      { token: "small", logit: 4.3 },
      { token: "wizard", logit: 4.0 },
      { token: "robot", logit: 2.4 },
      { token: "spreadsheet", logit: 0.5 },
    ],
  },
  {
    id: "code",
    text: "for i in",
    candidates: [
      { token: "range", logit: 8.7 },
      { token: "enumerate", logit: 6.0 },
      { token: "list", logit: 4.4 },
      { token: "nums", logit: 4.2 },
      { token: "items", logit: 3.6 },
      { token: "zip", logit: 3.3 },
      { token: "sorted", logit: 2.9 },
      { token: "banana", logit: -1.0 },
    ],
  },
];

export interface SamplingSettings {
  temperature: number;
  /** 0 means off. */
  topK: number;
  /** 1 means off. */
  topP: number;
}

export interface Distribution {
  scaled: number[];
  /** Softmax of the temperature-scaled logits, before any filtering. */
  probs: number[];
  keptByK: boolean[];
  /** Probabilities renormalised after top-k, used to calculate top-p. */
  afterK: number[];
  keptByP: boolean[];
  /** Renormalised over the words both filters kept. */
  final: number[];
}

export function softmax(xs: number[]): number[] {
  const m = Math.max(...xs);
  const ex = xs.map((x) => Math.exp(x - m));
  const total = ex.reduce((a, b) => a + b, 0);
  return ex.map((e) => e / total);
}

export function distribution(logits: number[], s: SamplingSettings): Distribution {
  const t = Math.max(s.temperature, 0.01);
  const scaled = logits.map((l) => l / t);
  const probs = softmax(scaled);
  const order = [...probs.keys()].sort((a, b) => probs[b] - probs[a]);

  const keptByK = probs.map(() => s.topK <= 0);
  if (s.topK > 0) order.slice(0, s.topK).forEach((i) => (keptByK[i] = true));
  const kTotal = probs.reduce((sum, p, i) => sum + (keptByK[i] ? p : 0), 0);
  const afterK = probs.map((p, i) => keptByK[i] ? p / kTotal : 0);

  // Top-p acts on the distribution left by top-k, as in a sequential decoder.
  const keptByP = keptByK.map((kept) => kept && s.topP >= 1);
  if (s.topP < 1) {
    let cum = 0;
    for (const i of order) {
      if (!keptByK[i]) continue;
      keptByP[i] = true;
      cum += afterK[i];
      if (cum >= s.topP) break;
    }
  }

  const raw = afterK.map((p, i) => keptByP[i] ? p : 0);
  const total = raw.reduce((a, b) => a + b, 0);
  return { scaled, probs, keptByK, afterK, keptByP, final: raw.map((p) => p / total) };
}

/** Draw an index from a distribution using a uniform number in [0, 1). */
export function drawIndex(probs: number[], u: number): number {
  let r = u;
  for (let i = 0; i < probs.length; i++) {
    r -= probs[i];
    if (r < 0) return i;
  }
  // Rounding can leave r a hair above 0: return the last word with any mass.
  for (let i = probs.length - 1; i >= 0; i--) if (probs[i] > 0) return i;
  return 0;
}

export function sampleMany(probs: number[], n: number, seed: number): number[] {
  const rng = seededRng(seed);
  return Array.from({ length: n }, () => drawIndex(probs, rng()));
}

export interface SamplingStep extends BaseStep {
  phase: "logits" | "temperature" | "softmax" | "topk" | "topp" | "renormalise" | "sample";
  dist: Distribution;
  picked?: number;
}

const pct = (p: number) => `${(p * 100).toFixed(p < 0.1 ? 1 : 0)}%`;

export function buildSamplingSteps(prompt: Prompt, s: SamplingSettings, seed: number): SamplingStep[] {
  const logits = prompt.candidates.map((c) => c.logit);
  const dist = distribution(logits, s);
  const top = dist.probs.indexOf(Math.max(...dist.probs));
  const keptK = dist.keptByK.filter(Boolean).length;
  const keptBoth = dist.final.filter((p) => p > 0).length;
  const picked = drawIndex(dist.final, seededRng(seed)());
  const mk = (phase: SamplingStep["phase"], explanation: string, extra: Partial<SamplingStep> = {}): SamplingStep => ({
    phase,
    dist,
    explanation,
    ...extra,
  });
  return [
    mk("logits", `The model gives every possible next word a raw score (a logit). “${prompt.candidates[top].token}” scores highest.`),
    mk(
      "temperature",
      s.temperature < 1
        ? `Divide every score by the temperature, ${s.temperature}. Below 1 this stretches the gaps, so the favourite pulls further ahead.`
        : s.temperature > 1
          ? `Divide every score by the temperature, ${s.temperature}. Above 1 this squeezes the gaps, so unlikely words catch up.`
          : "Temperature is 1, so the scores stay as they are.",
    ),
    mk("softmax", `Softmax turns the scores into probabilities that add up to 100%. “${prompt.candidates[top].token}” gets ${pct(dist.probs[top])}.`),
    mk("topk", s.topK > 0 ? `Top-k = ${s.topK}: keep the ${keptK} likeliest words, drop the rest and rescale the survivors to 100% before top-p.` : `Top-k is off, so all ${keptK} words stay in.`),
    mk(
      "topp",
      s.topP < 1
        ? `Top-p = ${s.topP}: among the top-k survivors, keep the likeliest words until their rescaled probabilities reach ${pct(s.topP)}. ${dist.keptByP.filter(Boolean).length} word(s) make the cut.`
        : "Top-p is off, so nothing more is dropped.",
    ),
    mk("renormalise", `Rescale what's left so it adds up to 100% again. ${keptBoth} word${keptBoth === 1 ? "" : "s"} can still be picked.`),
    mk("sample", `Roll the dice: this time the model writes “${prompt.candidates[picked].token}” (it had a ${pct(dist.final[picked])} chance).`, {
      picked,
      done: true,
    }),
  ];
}
