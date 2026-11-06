// Scaled dot-product self-attention, on a toy model you can read.
//
// A real model learns hundreds of embedding dimensions that have no names. To
// make the arithmetic followable, every word here has five hand-set features
// with names, and the query matrix is hand-set too. The computation is the real
// one: q = e·Wq, k = e·Wk, v = e·Wv, scores = q·k / √d, weights = softmax,
// output = Σ weights × values. The page says plainly that the numbers are
// chosen, not learned.

import type { BaseStep } from "../algorithms/types";

export const FEATURES = ["thing", "animal", "person", "refers back", "action"] as const;
export const D = FEATURES.length;

type Vec = number[];

// e = [thing, animal, person, refers-back, action]
const VOCAB: Record<string, Vec> = {
  cat: [1, 1, 0, 0, 0],
  dog: [1, 1, 0, 0, 0],
  mat: [1, 0, 0, 0, 0],
  ball: [1, 0, 0, 0, 0],
  book: [1, 0, 0, 0, 0],
  maya: [1, 0, 1, 0, 0],
  it: [0, 0, 0, 1, 0],
  sat: [0, 0, 0, 0, 1],
  chased: [0, 0, 0, 0, 1],
  read: [0, 0, 0, 0, 1],
  loved: [0, 0, 0, 0, 1],
  stopped: [0, 0, 0, 0, 1],
  tired: [0, 0, 0, 0, 0.5],
};
const ZERO: Vec = [0, 0, 0, 0, 0];

/**
 * Query matrix: row i is what a word with feature i goes looking for.
 *   thing       → looks for an action (what did it do?)
 *   refers back → looks for a thing, prefers animals, avoids people ("it", not "she")
 *   action      → looks for whoever is doing it: an animal or a person
 */
export const WQ: Vec[] = [
  [0, 0, 0, 0, 3],
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0],
  [3, 2.4, -4, 0, 0],
  [1, 3, 3, 0, 0],
];

export const SENTENCES = [
  "The cat sat on the mat because it was tired",
  "Maya read the book and loved it",
  "The dog chased the ball until it stopped",
] as const;

export interface Token {
  word: string;
  embedding: Vec;
  query: Vec;
  key: Vec;
  value: Vec;
}

const dot = (a: Vec, b: Vec) => a.reduce((s, v, i) => s + v * b[i], 0);
const matVec = (v: Vec, m: Vec[]) => m[0].map((_, j) => v.reduce((s, vi, i) => s + vi * m[i][j], 0));

export function softmax(xs: number[]): number[] {
  const m = Math.max(...xs);
  const ex = xs.map((x) => Math.exp(x - m));
  const total = ex.reduce((a, b) => a + b, 0);
  return ex.map((e) => e / total);
}

export function tokenize(sentence: string): Token[] {
  return sentence
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const e = VOCAB[word] ?? ZERO;
      // Wk and Wv are the identity in this toy, so keys and values are the
      // features themselves and the output stays readable in feature terms.
      return { word, embedding: [...e], query: matVec(e, WQ), key: [...e], value: [...e] };
    });
}

export interface AttentionRow {
  scores: number[];
  scaled: number[];
  weights: number[];
  output: Vec;
}

export function attendFrom(tokens: Token[], i: number): AttentionRow {
  const scores = tokens.map((t) => dot(tokens[i].query, t.key));
  const scaled = scores.map((s) => s / Math.sqrt(D));
  const weights = softmax(scaled);
  const output = ZERO.map((_, f) => tokens.reduce((s, t, j) => s + weights[j] * t.value[f], 0));
  return { scores, scaled, weights, output };
}

/** The full attention matrix: row i is how word i spreads its attention. */
export function attentionMatrix(tokens: Token[]): number[][] {
  return tokens.map((_, i) => attendFrom(tokens, i).weights);
}

export interface AttentionStep extends BaseStep {
  phase: "embed" | "query" | "keys" | "scores" | "scale" | "softmax" | "blend";
  focus: number;
  row: AttentionRow;
}

const f2 = (v: number) => v.toFixed(2);

export function buildAttentionSteps(tokens: Token[], focus: number): AttentionStep[] {
  const row = attendFrom(tokens, focus);
  const w = tokens[focus].word;
  const best = row.weights.reduce((bi, v, j) => (v > row.weights[bi] ? j : bi), 0);
  const isFlat = Math.max(...row.weights) - Math.min(...row.weights) < 1e-9;
  const mk = (phase: AttentionStep["phase"], explanation: string, done = false): AttentionStep => ({ phase, focus, row, explanation, done });
  return [
    mk("embed", `Each word starts as a vector of features. “${w}” is [${tokens[focus].embedding.join(", ")}].`),
    mk("query", `“${w}” turns its features into a query: what it is looking for. q = e · Wq = [${tokens[focus].query.map(f2).join(", ")}].`),
    mk("keys", "Every word also offers a key: what it can be found by. Here the keys are just each word's features."),
    mk("scores", `Score each word: query · key. Bigger means a better match. “${tokens[best].word}” scores highest at ${f2(row.scores[best])}.`),
    mk("scale", `Divide every score by √${D} ≈ ${f2(Math.sqrt(D))}, so scores don't grow just because vectors are long.`),
    mk(
      "softmax",
      isFlat
        ? `Softmax turns scores into shares that add up to 100%. All scores are equal, so “${w}” spreads its attention evenly.`
        : `Softmax turns scores into shares that add up to 100%. “${w}” gives ${(row.weights[best] * 100).toFixed(0)}% of its attention to “${tokens[best].word}”.`,
    ),
    mk(
      "blend",
      `Blend every word's value by those shares. The new “${w}” is [${row.output.map(f2).join(", ")}]: it now carries meaning from the words it attended to.`,
      true,
    ),
  ];
}
