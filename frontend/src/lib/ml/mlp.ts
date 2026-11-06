// A tiny neural network that really trains: 2 inputs → H hidden neurons
// (tanh by default; ReLU, Leaky ReLU or sigmoid on request) → 1 sigmoid output,
// binary cross-entropy loss, full-batch gradient descent.
//
// The first four frames walk through one training step in detail (forward,
// loss, backward, update). After that each frame is a snapshot of training,
// more often early on when the picture changes fastest.

import type { BaseStep } from "../algorithms/types";
import { ACTIVATIONS, type HiddenActivation } from "./activations";
import { gaussian, seededRng, type Point } from "./random";

export interface Weights {
  /** W1[h] = [weight from x, weight from y] into hidden neuron h. */
  W1: [number, number][];
  b1: number[];
  /** W2[h] = weight from hidden neuron h to the output. */
  W2: number[];
  b2: number;
}

export interface Sample extends Point {
  label: 0 | 1;
}

export type DatasetKey = "xor" | "circle" | "blobs" | "spiral";

export const DATASETS: Record<DatasetKey, { label: string; blurb: string }> = {
  blobs: { label: "Two groups", blurb: "Separable by one straight line. Even a single neuron could do it." },
  xor: { label: "XOR", blurb: "Opposite corners match. No single straight line works, so it needs a hidden layer." },
  circle: { label: "Circle", blurb: "One class inside, one outside. The network has to learn a closed curve." },
  spiral: { label: "Spiral", blurb: "Two arms wound around each other. Hard: give it more neurons and more time." },
};

export function makeDataset(key: DatasetKey, seed: number, n = 120): Sample[] {
  const rng = seededRng(seed);
  const clip = (v: number) => Math.max(-0.98, Math.min(0.98, v));
  const out: Sample[] = [];
  for (let i = 0; i < n; i++) {
    const label = (i % 2) as 0 | 1;
    let x = 0;
    let y = 0;
    if (key === "blobs") {
      x = (label ? 0.45 : -0.45) + gaussian(rng) * 0.2;
      y = (label ? 0.35 : -0.35) + gaussian(rng) * 0.2;
    } else if (key === "xor") {
      const sx = rng() < 0.5 ? -1 : 1;
      const sy = label ? -sx : sx;
      x = sx * 0.5 + gaussian(rng) * 0.15;
      y = sy * 0.5 + gaussian(rng) * 0.15;
    } else if (key === "circle") {
      const r = label ? rng() * 0.38 : 0.6 + rng() * 0.32;
      const a = rng() * Math.PI * 2;
      x = r * Math.cos(a);
      y = r * Math.sin(a);
    } else {
      const t = (Math.floor(i / 2) / (n / 2)) * 1.7 * Math.PI + 0.4;
      const r = (t / (1.7 * Math.PI + 0.4)) * 0.9;
      const a = t + (label ? Math.PI : 0);
      x = r * Math.cos(a) + gaussian(rng) * 0.03;
      y = r * Math.sin(a) + gaussian(rng) * 0.03;
    }
    out.push({ x: clip(x), y: clip(y), label });
  }
  return out;
}

export function initWeights(hidden: number, seed: number): Weights {
  const rng = seededRng(seed);
  return {
    W1: Array.from({ length: hidden }, () => [gaussian(rng) * 1.2, gaussian(rng) * 1.2] as [number, number]),
    b1: Array.from({ length: hidden }, () => gaussian(rng) * 0.3),
    W2: Array.from({ length: hidden }, () => gaussian(rng) * 0.8),
    b2: 0,
  };
}

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

export interface Forward {
  /** Each hidden neuron's weighted sum, before the activation. */
  z: number[];
  /** Each hidden neuron's output, after the activation. */
  hidden: number[];
  out: number;
}

export function forward(w: Weights, x: number, y: number, act: HiddenActivation = "tanh"): Forward {
  const f = ACTIVATIONS[act].f;
  const z = w.W1.map(([a, b], h) => a * x + b * y + w.b1[h]);
  const hidden = z.map(f);
  const zOut = hidden.reduce((s, v, h) => s + v * w.W2[h], w.b2);
  return { z, hidden, out: sigmoid(zOut) };
}

const EPS = 1e-9;

export function loss(w: Weights, data: Sample[], act: HiddenActivation = "tanh"): number {
  return (
    -data.reduce((s, d) => {
      const p = forward(w, d.x, d.y, act).out;
      return s + (d.label ? Math.log(p + EPS) : Math.log(1 - p + EPS));
    }, 0) / data.length
  );
}

export function accuracy(w: Weights, data: Sample[], act: HiddenActivation = "tanh"): number {
  return data.filter((d) => (forward(w, d.x, d.y, act).out >= 0.5 ? 1 : 0) === d.label).length / data.length;
}

/** Mean gradient of the loss over the batch: backpropagation by hand. */
export function gradients(w: Weights, data: Sample[], act: HiddenActivation = "tanh"): Weights {
  const H = w.W2.length;
  const df = ACTIVATIONS[act].df;
  const g: Weights = { W1: w.W1.map(() => [0, 0]), b1: new Array(H).fill(0), W2: new Array(H).fill(0), b2: 0 };
  for (const d of data) {
    const f = forward(w, d.x, d.y, act);
    // For sigmoid + cross-entropy, dLoss/dz at the output is just p - y.
    const dz = f.out - d.label;
    g.b2 += dz;
    for (let h = 0; h < H; h++) {
      g.W2[h] += dz * f.hidden[h];
      // Back through W2, then through the activation (its slope at z).
      const dh = dz * w.W2[h] * df(f.z[h]);
      g.W1[h][0] += dh * d.x;
      g.W1[h][1] += dh * d.y;
      g.b1[h] += dh;
    }
  }
  const n = data.length;
  return {
    W1: g.W1.map(([a, b]) => [a / n, b / n] as [number, number]),
    b1: g.b1.map((v) => v / n),
    W2: g.W2.map((v) => v / n),
    b2: g.b2 / n,
  };
}

export function applyUpdate(w: Weights, g: Weights, lr: number): Weights {
  return {
    W1: w.W1.map(([a, b], h) => [a - lr * g.W1[h][0], b - lr * g.W1[h][1]] as [number, number]),
    b1: w.b1.map((v, h) => v - lr * g.b1[h]),
    W2: w.W2.map((v, h) => v - lr * g.W2[h]),
    b2: w.b2 - lr * g.b2,
  };
}

export interface MlpStep extends BaseStep {
  phase: "forward" | "loss" | "backward" | "update" | "train" | "done";
  epoch: number;
  weights: Weights;
  grads?: Weights;
  /** The example traced through the network in the walkthrough frames. */
  traced?: { index: number; forward: Forward };
  loss: number;
  accuracy: number;
  losses: number[];
}

/** Which epochs get a frame: every one early, then sparser. */
export function snapshotEpochs(epochs: number): number[] {
  const out: number[] = [];
  for (let e = 1; e <= epochs; e++) {
    if (e <= 10 || (e <= 100 && e % 5 === 0) || e % 20 === 0 || e === epochs) out.push(e);
  }
  return out;
}

const pct = (v: number) => `${(v * 100).toFixed(0)}%`;

export function buildMlpSteps(
  data: Sample[],
  hidden: number,
  lr: number,
  epochs: number,
  seed: number,
  act: HiddenActivation = "tanh",
): MlpStep[] {
  let w = initWeights(hidden, seed);
  const losses = [loss(w, data, act)];
  const steps: MlpStep[] = [];
  const base = () => ({ weights: w, loss: losses[losses.length - 1], accuracy: accuracy(w, data, act), losses: [...losses] });

  const traceIndex = 0;
  const f = forward(w, data[traceIndex].x, data[traceIndex].y, act);
  const d0 = data[traceIndex];
  steps.push({
    ...base(),
    phase: "forward",
    epoch: 0,
    traced: { index: traceIndex, forward: f },
    explanation: `Forward pass: the highlighted point (${d0.x.toFixed(2)}, ${d0.y.toFixed(2)}) flows through. Each hidden neuron weighs its inputs, adds a bias and applies ${ACTIVATIONS[act].label}. The output says ${pct(f.out)} chance of the teal class; the right answer is ${d0.label ? "teal" : "violet"}.`,
  });
  steps.push({
    ...base(),
    phase: "loss",
    epoch: 0,
    traced: { index: traceIndex, forward: f },
    explanation: `Loss: compare every prediction with its label. Confident wrong answers cost the most. The average cross-entropy is ${losses[0].toFixed(3)}, and ${pct(accuracy(w, data, act))} of the training points are on the right side.`,
  });
  const g = gradients(w, data, act);
  steps.push({
    ...base(),
    phase: "backward",
    epoch: 0,
    grads: g,
    explanation: "Backward pass: work out, for every weight, how much the loss would change if it moved a little. The error flows back from the output to each layer; thicker glow means more blame.",
  });

  const epochsToShow = new Set(snapshotEpochs(epochs));
  for (let e = 1; e <= epochs; e++) {
    w = applyUpdate(w, gradients(w, data, act), lr);
    losses.push(loss(w, data, act));
    if (e === 1) {
      steps.push({
        ...base(),
        phase: "update",
        epoch: 1,
        explanation: `Update: nudge every weight against its gradient, scaled by the learning rate ${lr}. That's one training step. Loss went from ${losses[0].toFixed(3)} to ${losses[1].toFixed(3)}.`,
      });
      continue;
    }
    if (!epochsToShow.has(e)) continue;
    const s = base();
    if (e === epochs) {
      steps.push({
        ...s,
        phase: "done",
        epoch: e,
        explanation: `Trained for ${e} steps. Loss ${s.loss.toFixed(3)}, and ${pct(s.accuracy)} of the training points classified correctly. The shaded background is what the network now believes everywhere.`,
        done: true,
      });
    } else {
      steps.push({
        ...s,
        phase: "train",
        epoch: e,
        explanation: `Step ${e}: forward, loss, backward, update, repeated. Loss ${s.loss.toFixed(3)}, training accuracy ${pct(s.accuracy)}.`,
      });
    }
  }
  return steps;
}
