// Gradient descent on a 2D loss surface.
//
// Each iteration is two frames: "slope" shows the gradient arrow at the current
// point, "move" takes the step. Splitting them is the whole lesson: first work
// out which way is downhill, then move a learning-rate-sized step that way.

import type { BaseStep } from "../algorithms/types";

export type SurfaceKey = "bowl" | "valley" | "twoMinima" | "saddle";
export type Optimizer = "plain" | "momentum";

export interface LossSurface {
  key: SurfaceKey;
  label: string;
  blurb: string;
  f: (x: number, y: number) => number;
  grad: (x: number, y: number) => [number, number];
  /** Plot window: x in [-xr, xr], y in [-yr, yr]. */
  xr: number;
  yr: number;
  start: [number, number];
  /** Largest learning rate that still converges with plain descent (2 / steepest curvature). */
  safeLr: number;
  /** What plain descent does at different learning rates here (checked in gd.test.ts). */
  lrNote: string;
  minima: { x: number; y: number; global: boolean }[];
}

export const SURFACES: Record<SurfaceKey, LossSurface> = {
  bowl: {
    key: "bowl",
    label: "Round bowl",
    blurb: "One minimum, equally steep in every direction. The easy case.",
    f: (x, y) => x * x + y * y,
    grad: (x, y) => [2 * x, 2 * y],
    xr: 3,
    yr: 2,
    start: [-2.4, 1.5],
    safeLr: 1,
    lrNote: "Plain descent settles for any learning rate below 1. At exactly 1 it bounces forever, and above 1 it blows up.",
    minima: [{ x: 0, y: 0, global: true }],
  },
  valley: {
    key: "valley",
    label: "Narrow valley",
    blurb: "Steep across, shallow along. Plain descent zigzags across and crawls along. Momentum builds up speed along the floor and gets to the bottom much sooner, though it swings from side to side on the way.",
    f: (x, y) => 0.1 * x * x + 5 * y * y,
    grad: (x, y) => [0.2 * x, 10 * y],
    xr: 3,
    yr: 2,
    start: [-2.6, 1.2],
    safeLr: 0.2,
    lrNote: "The steep direction sets the limit: plain descent blows up above 0.2, and below it the shallow direction crawls. That's the problem momentum fixes.",
    minima: [{ x: 0, y: 0, global: true }],
  },
  twoMinima: {
    key: "twoMinima",
    label: "Two valleys",
    blurb: "A deeper valley on the left and a shallower one on the right. Where you start decides where you end.",
    f: (x, y) => (x * x - 1) ** 2 + 0.3 * x + y * y,
    grad: (x, y) => [4 * x * (x * x - 1) + 0.3, 2 * y],
    xr: 2,
    yr: 1.4,
    start: [1.7, 1.1],
    safeLr: 0.25,
    lrNote: "From the default start, plain descent ends in the shallower valley at small learning rates, reaches the deeper one around 0.15 to 0.2, and blows up by 0.3.",
    minima: [
      { x: -1.036, y: 0, global: true },
      { x: 0.96, y: 0, global: false },
    ],
  },
  saddle: {
    key: "saddle",
    label: "Saddle point",
    blurb: "The middle is a saddle: a valley along x, but a hilltop along y. Starting near it can slow descent. Starting exactly on y = 0 keeps descent on that line, so it can stop at the saddle instead of a minimum.",
    f: (x, y) => 0.5 * x * x + 0.25 * (y * y - 1) ** 2,
    grad: (x, y) => [x, y * (y * y - 1)],
    xr: 3,
    yr: 1.6,
    start: [-2.6, 0.001],
    safeLr: 1,
    lrNote: "Plain descent settles below a learning rate of 1. Between 1 and 2 it keeps bouncing around a valley without settling, and above 2 it blows up. Near the saddle it moves very slowly, because the ground there is almost flat.",
    minima: [
      { x: 0, y: 1, global: true },
      { x: 0, y: -1, global: true },
    ],
  },
};

export interface GdStep extends BaseStep {
  phase: "start" | "slope" | "move" | "stop" | "diverged";
  iter: number;
  x: number;
  y: number;
  loss: number;
  /** Gradient at this frame's displayed position, after any move. */
  grad: [number, number];
  /** Every position visited so far, including this one. */
  path: [number, number][];
  /** Loss after each completed iteration, starting with the start point. */
  losses: number[];
}

export interface GdOptions {
  lr: number;
  optimizer: Optimizer;
  start: [number, number];
  maxIters?: number;
  /** Momentum coefficient (share of the last move kept). */
  beta?: number;
}

const fmt = (v: number) => (Math.abs(v) >= 100 ? v.toExponential(1) : v.toFixed(3));

export function buildGdSteps(surface: LossSurface, opts: GdOptions): GdStep[] {
  const { lr, optimizer, maxIters = 150, beta = 0.8 } = opts;
  let [x, y] = opts.start;
  let vx = 0;
  let vy = 0;
  const path: [number, number][] = [[x, y]];
  const losses = [surface.f(x, y)];
  const steps: GdStep[] = [];
  const snap = (phase: GdStep["phase"], iter: number, grad: [number, number], explanation: string, done = false) =>
    steps.push({ phase, iter, x, y, loss: surface.f(x, y), grad: phase === "move" || phase === "diverged" ? surface.grad(x, y) : grad, path: path.map((p) => [...p] as [number, number]), losses: [...losses], explanation, done });

  snap("start", 0, surface.grad(x, y), `Start at (${fmt(x)}, ${fmt(y)}). The loss here is ${fmt(surface.f(x, y))}.`);

  for (let i = 1; i <= maxIters; i++) {
    const g = surface.grad(x, y);
    const norm = Math.hypot(g[0], g[1]);
    if (norm < 1e-3) {
      snap("stop", i - 1, g, `The slope is almost flat (${norm.toExponential(1)}), so stop near this stationary point. A small gradient alone does not prove a minimum: a saddle can also have zero slope.`, true);
      return steps;
    }
    snap("slope", i, g, `Iteration ${i}: the slope here is (${fmt(g[0])}, ${fmt(g[1])}). Downhill is the opposite way.`);

    if (optimizer === "momentum") {
      vx = beta * vx - lr * g[0];
      vy = beta * vy - lr * g[1];
      x += vx;
      y += vy;
    } else {
      x -= lr * g[0];
      y -= lr * g[1];
    }
    path.push([x, y]);
    const loss = surface.f(x, y);
    losses.push(loss);

    if (!Number.isFinite(loss) || Math.abs(x) > 50 || Math.abs(y) > 50) {
      snap("diverged", i, g, `The step overshot so far that the loss exploded to ${fmt(loss)}. The learning rate is too big for this surface.`, true);
      return steps;
    }
    snap(
      "move",
      i,
      g,
      optimizer === "momentum"
        ? `Keep ${Math.round(beta * 100)}% of the last move, then subtract ${lr} × the gradient measured before this move. Loss is now ${fmt(loss)}.`
        : `Move ${lr} × slope downhill, to (${fmt(x)}, ${fmt(y)}). Loss is now ${fmt(loss)}.`,
    );
  }

  snap("stop", maxIters, surface.grad(x, y), `Stopped at the limit of ${maxIters} iterations without fully settling. Adjust the learning rate or allow more steps; increasing the rate can also cause oscillation or divergence.`, true);
  return steps;
}
