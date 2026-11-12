// Gradient descent with one weight, on the simplest possible error curve:
//
//   error(w) = (w − 3)²        slope(w) = 2(w − 3)
//
// The best value is w = 3. Each step does w ← w − lr · slope(w), so the
// distance to 3 is multiplied by (1 − 2·lr) every step. That one number
// explains everything the page shows:
//   0 < lr < 0.5   shrinks without overshooting
//   lr = 0.5       lands exactly on 3 in one step
//   0.5 < lr < 1   overshoots, bounces back and forth, but still settles
//   lr = 1         bounces between the same two points forever
//   lr > 1         every bounce is bigger: it blows up

import type { BaseStep } from "../algorithms/types";

export const TARGET = 3;
export const error1d = (w: number) => (w - TARGET) ** 2;
export const slope1d = (w: number) => 2 * (w - TARGET);

/** What multiplies the distance to the answer each step. */
export const shrinkFactor = (lr: number) => 1 - 2 * lr;

export interface Gd1dStep extends BaseStep {
  phase: "start" | "slope" | "move" | "stop" | "bounce" | "diverged";
  iter: number;
  w: number;
  error: number;
  slope: number;
  /** Every completed step so far: w, error and slope at that w. */
  history: { w: number; error: number; slope: number }[];
}

const f3 = (v: number) => (Math.abs(v) >= 1000 ? v.toExponential(2) : v.toFixed(3));

export function buildGd1dSteps(start: number, lr: number, maxIters = 30): Gd1dStep[] {
  let w = start;
  const history = [{ w, error: error1d(w), slope: slope1d(w) }];
  const steps: Gd1dStep[] = [];
  const snap = (phase: Gd1dStep["phase"], iter: number, explanation: string, done = false) =>
    steps.push({ phase, iter, w, error: error1d(w), slope: slope1d(w), history: history.map((h) => ({ ...h })), explanation, done });

  snap("start", 0, `Start at w = ${f3(w)}. The error there is (${f3(w)} − 3)² = ${f3(error1d(w))}.`);

  for (let i = 1; i <= maxIters; i++) {
    const s = slope1d(w);
    if (Math.abs(s) < 1e-3) {
      snap("stop", i - 1, `The slope is almost 0, so we're at the bottom: w ≈ ${f3(w)}. Stop.`, true);
      return steps;
    }
    snap(
      "slope",
      i,
      `Step ${i}: the slope at w = ${f3(w)} is 2 × (${f3(w)} − 3) = ${f3(s)}. ${s > 0 ? "Positive: downhill is to the left." : "Negative: downhill is to the right."}`,
    );
    const next = w - lr * s;
    w = next;
    history.push({ w, error: error1d(w), slope: slope1d(w) });
    if (Math.abs(w - TARGET) > 20) {
      snap("diverged", i, `Each step overshoots by more than the last (the gap grows ×${f3(Math.abs(shrinkFactor(lr)))} every step), and it has flown off the chart. The learning rate is too big.`, true);
      return steps;
    }
    snap("move", i, `Move: w = w − ${lr} × ${s < 0 ? `(${f3(s)})` : f3(s)} = ${f3(w)}. The error is now ${f3(error1d(w))}.`);
  }

  const isBouncing = Math.abs(Math.abs(shrinkFactor(lr)) - 1) < 1e-9;
  if (isBouncing) {
    snap("bounce", maxIters, `With a learning rate of exactly ${lr}, every step jumps to the mirror point on the other side, so it bounces between ${f3(history[0].w)} and ${f3(2 * TARGET - history[0].w)} forever.`, true);
  } else {
    snap("stop", maxIters, `Stopped at the limit of ${maxIters} steps at w = ${f3(w)}. For this quadratic, a learning rate nearer 0.5 settles faster; a rate nearer 1 causes longer-lasting oscillations.`, true);
  }
  return steps;
}
