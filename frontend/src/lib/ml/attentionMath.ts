// The matrix form of attention from "Attention Is All You Need" (Vaswani et
// al., NIPS 2017), Equation (1):  Attention(Q, K, V) = softmax(QKᵀ / √d_k) V,
// plus the pieces the page explains around it: the causal mask, the √d_k
// scaling experiment, and sinusoidal positional encoding (Section 3.5).

import { gaussian, seededRng } from "./random";
import { softmax } from "./attention";

export type Mat = number[][];

export const matMul = (a: Mat, b: Mat): Mat => a.map((row) => b[0].map((_, j) => row.reduce((s, v, k) => s + v * b[k][j], 0)));
export const transpose = (a: Mat): Mat => a[0].map((_, j) => a.map((row) => row[j]));

export interface AttentionResult {
  Q: Mat;
  K: Mat;
  V: Mat;
  /** QKᵀ: row i, column j is query i · key j. */
  scores: Mat;
  /** QKᵀ / √d_k, with masked entries set to −∞. */
  scaled: Mat;
  /** softmax of each row. */
  weights: Mat;
  /** weights · V */
  out: Mat;
}

/** Self-attention: Q, K and V all come from the same rows X. `causal` hides later positions (decoder). */
export function selfAttention(X: Mat, Wq: Mat, Wk: Mat, Wv: Mat, causal = false): AttentionResult {
  const Q = matMul(X, Wq);
  const K = matMul(X, Wk);
  const V = matMul(X, Wv);
  const dk = K[0].length;
  const scores = matMul(Q, transpose(K));
  const scaled = scores.map((row, i) => row.map((s, j) => (causal && j > i ? -Infinity : s / Math.sqrt(dk))));
  const weights = scaled.map((row) => softmax(row));
  return { Q, K, V, scores, scaled, weights, out: matMul(weights, V) };
}

// ---------------------------------------------------------------------------
// The worked example in "The maths, step by step": 3 words, 3 features,
// d_k = d_v = 2. Small integers so every product can be checked by hand.

export const HAND_WORDS = ["cats", "chase", "mice"] as const;
/** Features: [animal, action, small]. */
export const HAND_X: Mat = [
  [1, 0, 0],
  [0, 1, 0],
  [1, 0, 1],
];
/** Animals look for an action; an action looks for animals. Size asks nothing. */
export const HAND_WQ: Mat = [
  [0, 2],
  [2, 0],
  [0, 0],
];
/** A key says "I'm an animal" (column 1) or "I'm an action" (column 2). */
export const HAND_WK: Mat = [
  [1, 0],
  [0, 1],
  [0, 0],
];
/** What each word hands over: [animal, action], with "small" adding to the second. */
export const HAND_WV: Mat = [
  [1, 0],
  [0, 1],
  [0, 1],
];

// ---------------------------------------------------------------------------
// Why divide by √d_k? The paper's footnote 4: if the parts of q and k are
// independent with mean 0 and variance 1, q·k has mean 0 and variance d_k.

export interface ScaleStats {
  /** Standard deviation of q·k over many random pairs (about √d_k). */
  spreadRaw: number;
  spreadScaled: number;
  /** Average largest softmax weight across `keys` keys. */
  topRaw: number;
  topScaled: number;
  /** Average of a(1 − a) for that top weight: its own slope in softmax. */
  slopeRaw: number;
  slopeScaled: number;
}

export function randomVec(rng: () => number, d: number): number[] {
  return Array.from({ length: d }, () => gaussian(rng));
}

const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0);

export function scaleStats(dk: number, keys = 10, trials = 400, seed = 7): ScaleStats {
  const rng = seededRng(seed + dk);
  let s1 = 0;
  let s2 = 0;
  let n = 0;
  let topRaw = 0;
  let topScaled = 0;
  let slopeRaw = 0;
  let slopeScaled = 0;
  for (let t = 0; t < trials; t++) {
    const q = randomVec(rng, dk);
    const scores = Array.from({ length: keys }, () => dot(q, randomVec(rng, dk)));
    for (const s of scores) {
      s1 += s;
      s2 += s * s;
      n++;
    }
    const a = Math.max(...softmax(scores));
    const b = Math.max(...softmax(scores.map((s) => s / Math.sqrt(dk))));
    topRaw += a;
    topScaled += b;
    slopeRaw += a * (1 - a);
    slopeScaled += b * (1 - b);
  }
  const mean = s1 / n;
  const spreadRaw = Math.sqrt(s2 / n - mean * mean);
  return {
    spreadRaw,
    spreadScaled: spreadRaw / Math.sqrt(dk),
    topRaw: topRaw / trials,
    topScaled: topScaled / trials,
    slopeRaw: slopeRaw / trials,
    slopeScaled: slopeScaled / trials,
  };
}

/** One random query against `keys` random keys, for the bar chart. */
export function oneDraw(dk: number, keys: number, seed: number): { raw: number[]; scaled: number[] } {
  const rng = seededRng(seed * 7919 + dk);
  const q = randomVec(rng, dk);
  const scores = Array.from({ length: keys }, () => dot(q, randomVec(rng, dk)));
  return { raw: softmax(scores), scaled: softmax(scores.map((s) => s / Math.sqrt(dk))) };
}

// ---------------------------------------------------------------------------
// Positional encoding (Section 3.5):
//   PE(pos, 2i) = sin(pos / 10000^(2i / d_model)),  PE(pos, 2i+1) = cos(…same…)

export function positionalEncoding(pos: number, dModel: number): number[] {
  return Array.from({ length: dModel }, (_, j) => {
    const i = Math.floor(j / 2);
    const angle = pos / 10000 ** ((2 * i) / dModel);
    return j % 2 === 0 ? Math.sin(angle) : Math.cos(angle);
  });
}
