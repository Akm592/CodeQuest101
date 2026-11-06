// The common gradient descent optimizers, run on a 2D loss surface.
//
// Update rules follow CS231n's notes and Ruder's overview; Adam's defaults
// (β1 = 0.9, β2 = 0.999, ε = 1e-8) are the paper's and PyTorch's.
//
//   plain      x ← x − lr·g
//   momentum   v ← β·v − lr·g;           x ← x + v
//   nesterov   g ← grad(x + β·v);  v ← β·v − lr·g;   x ← x + v   (look ahead first)
//   adagrad    G ← G + g²;               x ← x − lr·g / (√G + ε)
//   rmsprop    E ← ρ·E + (1 − ρ)·g²;     x ← x − lr·g / (√E + ε)
//   adam       m ← β1·m + (1 − β1)·g;  s ← β2·s + (1 − β2)·g²
//              m̂ = m / (1 − β1ᵗ);  ŝ = s / (1 − β2ᵗ);   x ← x − lr·m̂ / (√ŝ + ε)
//
// Everything works per coordinate: g² means each slope squared separately.

import type { LossSurface } from "./gradientDescent";

export type OptKey = "plain" | "momentum" | "nesterov" | "adagrad" | "rmsprop" | "adam";

export interface OptParams {
  lr: number;
  beta?: number; // momentum / nesterov
  rho?: number; // rmsprop
  beta1?: number; // adam
  beta2?: number; // adam
  eps?: number;
}

export const OPT_ORDER: OptKey[] = ["plain", "momentum", "nesterov", "adagrad", "rmsprop", "adam"];

export interface OptInfo {
  label: string;
  short: string;
  /** Plain-English summary of what it does differently. */
  idea: string;
  rule: string[];
  defaults: string;
}

export const OPT_INFO: Record<OptKey, OptInfo> = {
  plain: {
    label: "Plain gradient descent",
    short: "Plain",
    idea: "Step straight downhill, the same size every time (learning rate × slope).",
    rule: ["x ← x − lr · g"],
    defaults: "No extra settings: just the learning rate.",
  },
  momentum: {
    label: "Momentum",
    short: "Momentum",
    idea: "Remember the last move and keep most of it, like a heavy ball rolling downhill. Steps that keep pointing the same way build up speed; steps that flip back and forth cancel out.",
    rule: ["v ← β · v − lr · g", "x ← x + v"],
    defaults: "β (how much of the last move to keep) is usually 0.9.",
  },
  nesterov: {
    label: "Nesterov momentum",
    short: "Nesterov",
    idea: "Momentum, but measure the slope at the spot the momentum is about to carry you to, not where you are now. It's like looking ahead before you step, so it brakes earlier when it's about to overshoot.",
    rule: ["g ← slope at (x + β · v)", "v ← β · v − lr · g", "x ← x + v"],
    defaults: "β is usually 0.9, the same as momentum.",
  },
  adagrad: {
    label: "AdaGrad",
    short: "AdaGrad",
    idea: "Give every weight its own step size. Weights that have had big slopes get smaller steps; weights with small slopes get bigger ones. The catch: it adds up every slope it has ever seen, so the steps keep shrinking and can stall.",
    rule: ["G ← G + g²   (running total)", "x ← x − lr · g / (√G + ε)"],
    defaults: "A learning rate of 0.01 is the common default; ε is a tiny number (like 1e-8) to avoid dividing by zero.",
  },
  rmsprop: {
    label: "RMSProp",
    short: "RMSProp",
    idea: "AdaGrad's per-weight step sizes, but with a moving average of recent squared slopes instead of an ever-growing total, so it never grinds to a halt.",
    rule: ["E ← ρ · E + (1 − ρ) · g²   (moving average)", "x ← x − lr · g / (√E + ε)"],
    defaults: "ρ = 0.9 and a learning rate of 0.001 are the suggested defaults.",
  },
  adam: {
    label: "Adam",
    short: "Adam",
    idea: "Momentum and RMSProp together: a moving average of the slopes (which way to go) and of the squared slopes (how big a step each weight should take). It also corrects both averages at the start, because they begin at 0.",
    rule: ["m ← β₁ · m + (1 − β₁) · g", "s ← β₂ · s + (1 − β₂) · g²", "m̂ = m / (1 − β₁ᵗ),  ŝ = s / (1 − β₂ᵗ)", "x ← x − lr · m̂ / (√ŝ + ε)"],
    defaults: "lr = 0.001, β₁ = 0.9, β₂ = 0.999, ε = 1e-8 (the paper's and PyTorch's defaults).",
  },
};

export interface OptRun {
  path: [number, number][];
  losses: number[];
  diverged: boolean;
}

export function runOptimizer(key: OptKey, surface: LossSurface, start: [number, number], p: OptParams, iters: number): OptRun {
  const { lr, beta = 0.9, rho = 0.9, beta1 = 0.9, beta2 = 0.999, eps = 1e-8 } = p;
  let x = start[0];
  let y = start[1];
  let vx = 0;
  let vy = 0; // velocity (momentum, nesterov)
  let ax = 0;
  let ay = 0; // squared-slope totals or averages (adagrad, rmsprop, adam's s)
  let mx = 0;
  let my = 0; // adam's m
  const path: [number, number][] = [[x, y]];
  const losses = [surface.f(x, y)];
  let diverged = false;

  for (let t = 1; t <= iters; t++) {
    const [gx, gy] = key === "nesterov" ? surface.grad(x + beta * vx, y + beta * vy) : surface.grad(x, y);
    switch (key) {
      case "plain":
        x -= lr * gx;
        y -= lr * gy;
        break;
      case "momentum":
      case "nesterov":
        vx = beta * vx - lr * gx;
        vy = beta * vy - lr * gy;
        x += vx;
        y += vy;
        break;
      case "adagrad":
        ax += gx * gx;
        ay += gy * gy;
        x -= (lr * gx) / (Math.sqrt(ax) + eps);
        y -= (lr * gy) / (Math.sqrt(ay) + eps);
        break;
      case "rmsprop":
        ax = rho * ax + (1 - rho) * gx * gx;
        ay = rho * ay + (1 - rho) * gy * gy;
        x -= (lr * gx) / (Math.sqrt(ax) + eps);
        y -= (lr * gy) / (Math.sqrt(ay) + eps);
        break;
      case "adam": {
        mx = beta1 * mx + (1 - beta1) * gx;
        my = beta1 * my + (1 - beta1) * gy;
        ax = beta2 * ax + (1 - beta2) * gx * gx;
        ay = beta2 * ay + (1 - beta2) * gy * gy;
        const c1 = 1 - beta1 ** t;
        const c2 = 1 - beta2 ** t;
        x -= (lr * (mx / c1)) / (Math.sqrt(ax / c2) + eps);
        y -= (lr * (my / c1)) / (Math.sqrt(ay / c2) + eps);
        break;
      }
    }
    const loss = surface.f(x, y);
    if (!Number.isFinite(loss) || Math.abs(x) > 50 || Math.abs(y) > 50) {
      diverged = true;
      break;
    }
    path.push([x, y]);
    losses.push(loss);
  }
  return { path, losses, diverged };
}

/** Learning-rate schedules (CS231n): how the step size can shrink over training. */
export const SCHEDULES = {
  constant: { label: "Constant", rule: "lr(t) = lr₀", lr: (lr0: number) => lr0 },
  step: { label: "Step decay", rule: "halve every 10 epochs", lr: (lr0: number, t: number) => lr0 * 0.5 ** Math.floor(t / 10) },
  exponential: { label: "Exponential", rule: "lr(t) = lr₀ · e^(−k·t), k = 0.07", lr: (lr0: number, t: number) => lr0 * Math.exp(-0.07 * t) },
  inverse: { label: "1/t decay", rule: "lr(t) = lr₀ / (1 + k·t), k = 0.2", lr: (lr0: number, t: number) => lr0 / (1 + 0.2 * t) },
} as const;
export type ScheduleKey = keyof typeof SCHEDULES;
