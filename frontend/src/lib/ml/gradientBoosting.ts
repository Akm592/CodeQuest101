// Gradient boosting for regression, on one input so every step can be drawn.
//
//   F₀(x) = average of y
//   repeat:  residual rᵢ = yᵢ − F(xᵢ)
//            fit a small regression tree h to the residuals
//            F ← F + learning_rate · h
//
// With squared error, L = ½(y − F)², the residual y − F is exactly the
// negative gradient of the loss with respect to the prediction, which is
// where the name comes from (scikit-learn: each tree is "fitted to predict
// the negative gradients"). The learning rate shrinks each tree's step;
// smaller values need more trees (scikit-learn's "shrinkage").

import type { BaseStep } from "../algorithms/types";
import { gaussian, seededRng } from "./random";

export interface XY {
  x: number;
  y: number;
}

/** A piecewise-constant function: value[i] applies for x ≤ cuts[i] (last value beyond the last cut). */
export interface Steps1D {
  cuts: number[];
  values: number[];
}

export const evalSteps = (f: Steps1D, x: number) => {
  for (let i = 0; i < f.cuts.length; i++) if (x <= f.cuts[i]) return f.values[i];
  return f.values[f.values.length - 1];
};

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const sse = (xs: number[]) => {
  const m = mean(xs);
  return xs.reduce((s, v) => s + (v - m) ** 2, 0);
};

/** Best single split of (x, r) pairs by squared error: the threshold and the error after splitting. */
export function bestStump(pts: XY[]): { threshold: number; error: number } | null {
  const s = [...pts].sort((a, b) => a.x - b.x);
  let best: { threshold: number; error: number } | null = null;
  for (let i = 0; i < s.length - 1; i++) {
    if (s[i].x === s[i + 1].x) continue;
    const l = s.slice(0, i + 1).map((p) => p.y);
    const r = s.slice(i + 1).map((p) => p.y);
    const error = sse(l) + sse(r);
    if (!best || error < best.error - 1e-12) best = { threshold: (s[i].x + s[i + 1].x) / 2, error };
  }
  return best;
}

/** A regression tree of the given depth on one input; leaves predict the mean. */
export function fitRegTree(pts: XY[], depth: number): Steps1D {
  const leaf = (): Steps1D => ({ cuts: [], values: [mean(pts.map((p) => p.y))] });
  if (depth === 0 || pts.length < 2) return leaf();
  const split = bestStump(pts);
  if (!split || split.error >= sse(pts.map((p) => p.y)) - 1e-12) return leaf();
  const left = fitRegTree(pts.filter((p) => p.x <= split.threshold), depth - 1);
  const right = fitRegTree(pts.filter((p) => p.x > split.threshold), depth - 1);
  return { cuts: [...left.cuts, split.threshold, ...right.cuts], values: [...left.values, ...right.values] };
}

export function mse(data: XY[], f: (x: number) => number) {
  return mean(data.map((p) => (p.y - f(p.x)) ** 2));
}

// ---------------------------------------------------------------------------

/** 40 noisy points along a wave on [0, 10]. */
export function waveData(seed: number, n = 40): XY[] {
  const rng = seededRng(seed);
  return Array.from({ length: n }, () => {
    const x = rng() * 10;
    return { x, y: Math.sin(x * 0.9) * 2 + x * 0.3 + gaussian(rng) * 0.45 };
  });
}

export interface BoostModel {
  base: number;
  trees: Steps1D[];
  lr: number;
}

export const predictBoost = (m: BoostModel, x: number, k = m.trees.length) => {
  let f = m.base;
  for (let t = 0; t < k; t++) f += m.lr * evalSteps(m.trees[t], x);
  return f;
};

export function fitBoost(data: XY[], lr: number, depth: number, trees: number): BoostModel {
  const base = mean(data.map((p) => p.y));
  const m: BoostModel = { base, trees: [], lr };
  // Keep a running prediction per point rather than re-summing every tree.
  const F = data.map(() => base);
  for (let t = 0; t < trees; t++) {
    const residuals = data.map((p, i) => ({ x: p.x, y: p.y - F[i] }));
    const tree = fitRegTree(residuals, depth);
    m.trees.push(tree);
    data.forEach((p, i) => (F[i] += lr * evalSteps(tree, p.x)));
  }
  return m;
}

/** Mean squared error after 0, 1, …, all trees, computed incrementally. */
export function errorCurve(m: BoostModel, data: XY[]): number[] {
  const F = data.map(() => m.base);
  const out = [mse(data, () => m.base)];
  for (const tree of m.trees) {
    data.forEach((p, i) => (F[i] += m.lr * evalSteps(tree, p.x)));
    out.push(data.reduce((s, p, i) => s + (p.y - F[i]) ** 2, 0) / data.length);
  }
  return out;
}

export interface BoostStep extends BaseStep {
  phase: "start" | "residuals" | "fit" | "add" | "done";
  /** Trees in the model after this step. */
  k: number;
  /** The tree being fitted or just added, if any. */
  tree?: Steps1D;
  trainMse: number;
}

/**
 * The first three trees are shown in three parts (residuals, fit, add) so the
 * idea is visible; after that each step adds one tree.
 */
export function buildBoostSteps(data: XY[], m: BoostModel): BoostStep[] {
  const steps: BoostStep[] = [];
  const err = (k: number) => mse(data, (x) => predictBoost(m, x, k));
  const f3 = (v: number) => v.toFixed(3);
  steps.push({
    phase: "start",
    k: 0,
    trainMse: err(0),
    explanation: `Start with the simplest guess: the average of all the y values, ${f3(m.base)}, everywhere. Mean squared error: ${f3(err(0))}.`,
  });
  m.trees.forEach((tree, i) => {
    const k = i + 1;
    if (i < 3) {
      steps.push({ phase: "residuals", k: i, trainMse: err(i), explanation: `Tree ${k}: measure what's still wrong. Each red bar is a residual, the true y minus the current prediction.` });
      steps.push({ phase: "fit", k: i, tree, trainMse: err(i), explanation: `Fit a small tree (amber) to those residuals, not to y. It learns where the current model is too low or too high.` });
    }
    steps.push({
      phase: k === m.trees.length ? "done" : "add",
      k,
      tree,
      trainMse: err(k),
      explanation:
        k === m.trees.length
          ? `Done: ${k} trees, each added at ${m.lr} × its size. Training error ${f3(err(k))}.`
          : `Add the tree, shrunk by the learning rate (× ${m.lr}). The model moves a little towards the points. Training error ${f3(err(k))}.`,
      done: k === m.trees.length,
    });
  });
  return steps;
}
