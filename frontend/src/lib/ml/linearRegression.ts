// Linear regression fitted by gradient descent on mean squared error.
//
// x is standardised before fitting (z = (x - mean) / std), as is usual when
// training with gradient descent: without it the slope and intercept learn at
// wildly different speeds. (scikit-learn's LinearRegression doesn't need this:
// it solves for the exact answer directly.) The line is always reported back
// in the original units.

import type { BaseStep } from "../algorithms/types";
import { gaussian, seededRng, type Point } from "./random";

export interface LrStep extends BaseStep {
  phase: "predict" | "errors" | "gradient" | "update" | "done" | "diverged";
  iter: number;
  /** The line in original units: y = slope * x + intercept. */
  slope: number;
  intercept: number;
  mse: number;
  /** Gradient of the MSE with respect to the (scaled) weight and bias. */
  grad: { w: number; b: number };
  mses: number[];
}

export interface LineFit {
  slope: number;
  intercept: number;
}

export function mse(points: Point[], line: LineFit): number {
  let s = 0;
  for (const p of points) s += (line.slope * p.x + line.intercept - p.y) ** 2;
  return s / points.length;
}

/** The exact least-squares line, for comparison. Null when x has no spread. */
export function leastSquares(points: Point[]): LineFit | null {
  const n = points.length;
  if (n < 2) return null;
  const mx = points.reduce((a, p) => a + p.x, 0) / n;
  const my = points.reduce((a, p) => a + p.y, 0) / n;
  let sxy = 0;
  let sxx = 0;
  for (const p of points) {
    sxy += (p.x - mx) * (p.y - my);
    sxx += (p.x - mx) ** 2;
  }
  if (sxx < 1e-12) return null;
  const slope = sxy / sxx;
  return { slope, intercept: my - slope * mx };
}

/** A noisy line, x in [0.5, 9.5], clipped to the 0–10 plot. */
export function samplePoints(seed: number, count = 14): Point[] {
  const rng = seededRng(seed);
  const slope = 0.3 + rng() * 0.6;
  const intercept = 1 + rng() * 2.5;
  return Array.from({ length: count }, () => {
    const x = 0.5 + rng() * 9;
    const y = Math.min(9.8, Math.max(0.2, slope * x + intercept + gaussian(rng) * 0.9));
    return { x: +x.toFixed(2), y: +y.toFixed(2) };
  });
}

const f2 = (v: number) => v.toFixed(2);

export function buildLrSteps(points: Point[], lr: number, maxIters = 120): LrStep[] {
  const n = points.length;
  const steps: LrStep[] = [];
  const mx = points.reduce((a, p) => a + p.x, 0) / Math.max(n, 1);
  const sx = Math.sqrt(points.reduce((a, p) => a + (p.x - mx) ** 2, 0) / Math.max(n, 1));

  if (n < 2 || sx < 1e-9) {
    return [
      {
        phase: "predict",
        iter: 0,
        slope: 0,
        intercept: 0,
        mse: 0,
        grad: { w: 0, b: 0 },
        mses: [],
        explanation: "Add at least two points with different x values to fit a line.",
        done: true,
      },
    ];
  }

  const zs = points.map((p) => (p.x - mx) / sx);
  let w = 0;
  let b = 0;
  const toLine = () => ({ slope: w / sx, intercept: b - (w * mx) / sx });
  const gradient = () => {
    let gw = 0;
    let gb = 0;
    for (let i = 0; i < n; i++) {
      const err = w * zs[i] + b - points[i].y;
      gw += (2 / n) * err * zs[i];
      gb += (2 / n) * err;
    }
    return { w: gw, b: gb };
  };
  const mses: number[] = [mse(points, toLine())];
  const push = (phase: LrStep["phase"], iter: number, grad: { w: number; b: number }, explanation: string, done = false) => {
    const line = toLine();
    steps.push({ phase, iter, ...line, mse: mse(points, line), grad, mses: [...mses], explanation, done });
  };

  push("predict", 0, { w: 0, b: 0 }, "Start with a flat guess, y = 0·x + 0. It predicts 0 for every point.");
  push("errors", 0, { w: 0, b: 0 }, `Measure the misses: the vertical gap from each point to the line, squared and averaged. MSE = ${f2(mses[0])}.`);
  const g0 = gradient();
  push("gradient", 0, g0, `We train on z = (x − mean) / standard deviation, using y = w·z + b. The MSE gradient of this standardised weight w is ${f2(g0.w)}, and of b is ${f2(g0.b)}. The plotted slope and intercept are converted back to the original x units.`);

  for (let i = 1; i <= maxIters; i++) {
    const g = gradient();
    w -= lr * g.w;
    b -= lr * g.b;
    const cur = mse(points, toLine());
    mses.push(cur);
    if (!Number.isFinite(cur) || cur > 1e8) {
      push("diverged", i, g, `The error grew to ${cur.toExponential(1)}: each step overshoots further than the last. Lower the learning rate.`, true);
      return steps;
    }
    const line = toLine();
    const nextGrad = gradient();
    const settled = Math.abs(mses[mses.length - 2] - cur) < 1e-6 && Math.hypot(nextGrad.w, nextGrad.b) < 1e-3;
    if (settled) {
      push("done", i, nextGrad, `The error change and gradient are small after ${i} steps: y = ${f2(line.slope)}x + ${f2(line.intercept)}, MSE ${f2(cur)}. This approximates the least-squares solution; compare with the dashed line.`, true);
      return steps;
    }
    push("update", i, g, `Step ${i}: nudge both against their slope × ${lr}. Line is y = ${f2(line.slope)}x + ${f2(line.intercept)}, MSE ${f2(cur)}.`);
  }

  const line = toLine();
  push("done", maxIters, gradient(), `Stopped at the limit of ${maxIters} steps at y = ${f2(line.slope)}x + ${f2(line.intercept)}. Review the remaining error and adjust the learning rate or allow more steps.`, true);
  return steps;
}

// ---------------------------------------------------------------------------
// How good is a fit? (scikit-learn's definitions)

/** R² = 1 − SS_res / SS_tot. 1 is perfect; predicting the mean scores 0; worse than that is negative. */
export function r2(points: Point[], predict: (x: number) => number): number {
  const my = points.reduce((a, p) => a + p.y, 0) / points.length;
  const ssRes = points.reduce((a, p) => a + (p.y - predict(p.x)) ** 2, 0);
  const ssTot = points.reduce((a, p) => a + (p.y - my) ** 2, 0);
  return 1 - ssRes / ssTot;
}

export function mae(points: Point[], predict: (x: number) => number): number {
  return points.reduce((a, p) => a + Math.abs(p.y - predict(p.x)), 0) / points.length;
}

/** The 5-point example worked by hand in the maths section. */
export const HAND_POINTS: Point[] = [2, 4, 5, 4, 5].map((y, i) => ({ x: i + 1, y }));
