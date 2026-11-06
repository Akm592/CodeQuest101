import { describe, expect, it } from "vitest";

import { assertStepInvariants } from "../algorithms/testHelpers";
import { BATCH_KINDS, gradOn, lineData, mseOf, runBatchKind } from "./batchTypes";
import { buildGd1dSteps, slope1d, TARGET } from "./gd1d";
import { buildGdSteps, SURFACES } from "./gradientDescent";
import { leastSquares } from "./linearRegression";
import { OPT_ORDER, runOptimizer, SCHEDULES } from "./optimizers";

// Checked against independent facts, not the generators' own arithmetic.

describe("one-weight gradient descent", () => {
  it("matches the worked example: 0 → 0.6 → 1.08 → 1.464 with lr 0.1", () => {
    const ws = buildGd1dSteps(0, 0.1).at(-1)!.history.map((h) => h.w);
    expect(ws[1]).toBeCloseTo(0.6, 12);
    expect(ws[2]).toBeCloseTo(1.08, 12);
    expect(ws[3]).toBeCloseTo(1.464, 12);
  });

  it("shrinks the gap to 3 by exactly (1 − 2·lr) each step", () => {
    for (const lr of [0.1, 0.3, 0.7, 0.9]) {
      const ws = buildGd1dSteps(-2, lr).at(-1)!.history.map((h) => h.w);
      for (let i = 1; i < Math.min(ws.length, 8); i++) expect(ws[i] - TARGET).toBeCloseTo((ws[i - 1] - TARGET) * (1 - 2 * lr), 9);
    }
  });

  it("lands on 3 in a single step with lr 0.5", () => {
    expect(buildGd1dSteps(-1, 0.5).at(-1)!.history[1].w).toBeCloseTo(3, 12);
  });

  it("bounces forever at lr 1 and blows up above 1", () => {
    const b = buildGd1dSteps(0, 1).at(-1)!;
    expect(b.phase).toBe("bounce");
    expect(b.history.map((h) => h.w).slice(0, 4)).toEqual([0, 6, 0, 6]);
    expect(buildGd1dSteps(0, 1.05).at(-1)!.phase).toBe("diverged");
  });

  it("settles for every lr between 0 and 1 (the exact cut-off)", () => {
    for (const lr of [0.2, 0.5, 0.8]) expect(buildGd1dSteps(0, lr).at(-1)!.phase).toBe("stop");
  });

  it("has a slope that matches a nudge test", () => {
    const e = (w: number) => (w - 3) ** 2;
    expect(slope1d(1.3)).toBeCloseTo((e(1.3 + 1e-6) - e(1.3 - 1e-6)) / 2e-6, 6);
    assertStepInvariants(buildGd1dSteps(0, 0.3));
  });
});

describe("2-D map claims the page makes", () => {
  it("Two valleys: settles at lr 0.25, blows up at 0.3", () => {
    const s = SURFACES.twoMinima;
    expect(buildGdSteps(s, { lr: 0.25, optimizer: "plain", start: s.start }).at(-1)!.phase).toBe("stop");
    expect(buildGdSteps(s, { lr: 0.3, optimizer: "plain", start: s.start }).at(-1)!.phase).toBe("diverged");
  });

  it("Two valleys: the learning rate decides which valley you end in", () => {
    const s = SURFACES.twoMinima;
    expect(buildGdSteps(s, { lr: 0.05, optimizer: "plain", start: s.start }).at(-1)!.x).toBeGreaterThan(0.9);
    expect(buildGdSteps(s, { lr: 0.2, optimizer: "plain", start: s.start }).at(-1)!.x).toBeLessThan(-1);
  });

  it("Two valleys: momentum (β 0.9) rolls on into the deeper valley", () => {
    const s = SURFACES.twoMinima;
    expect(buildGdSteps(s, { lr: 0.05, optimizer: "momentum", beta: 0.9, start: s.start }).at(-1)!.x).toBeLessThan(-1);
  });

  it.each([
    ["bowl", 0.95, 1.1],
    ["valley", 0.19, 0.21],
  ] as const)("%s: settles at lr %f and blows up at %f, as its note says", (key, ok, bad) => {
    const s = SURFACES[key];
    expect(buildGdSteps(s, { lr: ok, optimizer: "plain", start: s.start, maxIters: 2000 }).at(-1)!.phase).toBe("stop");
    expect(buildGdSteps(s, { lr: bad, optimizer: "plain", start: s.start, maxIters: 2000 }).at(-1)!.phase).toBe("diverged");
  });

  it("Saddle: settles below 1, keeps bouncing between 1 and 2, blows up above 2", () => {
    const s = SURFACES.saddle;
    const run = (lr: number) => buildGdSteps(s, { lr, optimizer: "plain", start: s.start, maxIters: 2000 }).at(-1)!;
    const settled = run(0.95);
    expect(Math.hypot(...settled.grad)).toBeLessThan(1e-3);
    const bouncing = run(1.5);
    expect(bouncing.phase).not.toBe("diverged");
    expect(Math.hypot(...bouncing.grad)).toBeGreaterThan(1e-3);
    expect(run(2.1).phase).toBe("diverged");
  });

  it("Narrow valley: plain at 0.15 zigzags across and crawls along; momentum gets there sooner", () => {
    const s = SURFACES.valley;
    const plain = buildGdSteps(s, { lr: 0.15, optimizer: "plain", start: s.start, maxIters: 400 }).at(-1)!;
    const ys = plain.path.map((p) => p[1]);
    expect(ys[1] * ys[0]).toBeLessThan(0); // crosses the valley floor: a zigzag
    expect(plain.iter).toBeGreaterThan(150); // the shallow direction crawls
    const mom = buildGdSteps(s, { lr: 0.15, optimizer: "momentum", beta: 0.9, start: s.start, maxIters: 400 }).at(-1)!;
    expect(mom.phase).toBe("stop");
    expect(mom.iter).toBeLessThan(plain.iter);
    // and momentum swings side to side on the way (Distill: "momentum creates its own oscillations")
    const my = mom.path.map((p) => p[1]);
    expect(my.slice(1).filter((v, i) => v * my[i] < 0).length).toBeGreaterThan(3);
  });

  it("Round bowl: lr 1 bounces without settling or blowing up", () => {
    const s = SURFACES.bowl;
    const last = buildGdSteps(s, { lr: 1, optimizer: "plain", start: s.start, maxIters: 40 }).at(-1)!;
    expect(last.phase).toBe("stop");
    expect(Math.hypot(last.x, last.y)).toBeCloseTo(Math.hypot(...s.start), 9);
  });
});

describe("optimizers", () => {
  const bowl = SURFACES.bowl;

  it("momentum with β = 0 is exactly plain gradient descent", () => {
    const a = runOptimizer("plain", bowl, [2, 1], { lr: 0.1 }, 20).path;
    const b = runOptimizer("momentum", bowl, [2, 1], { lr: 0.1, beta: 0 }, 20).path;
    a.forEach((p, i) => {
      expect(b[i][0]).toBeCloseTo(p[0], 12);
      expect(b[i][1]).toBeCloseTo(p[1], 12);
    });
  });

  it("Adam's first step is lr in each direction (bias correction at work)", () => {
    const [, p1] = runOptimizer("adam", SURFACES.valley, [-2, 1], { lr: 0.1 }, 1).path;
    expect(Math.abs(p1[0] - -2)).toBeCloseTo(0.1, 6);
    expect(Math.abs(p1[1] - 1)).toBeCloseTo(0.1, 6);
  });

  it("AdaGrad and RMSProp take the same first step on a steep and a shallow direction", () => {
    for (const k of ["adagrad", "rmsprop"] as const) {
      const [, p1] = runOptimizer(k, SURFACES.valley, [-2, 1], { lr: 0.05 }, 1).path;
      // Gradients differ 25× ((0.2·2) vs (10·1)), yet the per-weight scaling equalises the moves.
      expect(Math.abs(p1[0] + 2)).toBeCloseTo(Math.abs(p1[1] - 1), 6);
    }
  });

  it.each(OPT_ORDER)("%s reaches the bottom of the bowl", (k) => {
    const lr = { plain: 0.1, momentum: 0.05, nesterov: 0.05, adagrad: 0.5, rmsprop: 0.05, adam: 0.1 }[k];
    const end = runOptimizer(k, bowl, bowl.start, { lr }, 300).path.at(-1)!;
    expect(Math.hypot(...end)).toBeLessThan(0.06);
  });

  it("Nesterov beats momentum on the narrow valley at the same settings", () => {
    const v = SURFACES.valley;
    const steps = (k: "momentum" | "nesterov") => runOptimizer(k, v, v.start, { lr: 0.05 }, 300).losses.findIndex((l) => l < 1e-3);
    expect(steps("nesterov")).toBeLessThan(steps("momentum"));
  });

  it("the saddle point is flat in the middle, so plain descent lingers there", () => {
    const s = SURFACES.saddle;
    const [gx, gy] = s.grad(0, 0);
    expect(Math.hypot(gx, gy)).toBe(0);
    const run = runOptimizer("plain", s, s.start, { lr: 0.1 }, 200);
    // At least 20 steps spent within 0.3 of the saddle.
    expect(run.path.filter(([x, y]) => Math.hypot(x, y) < 0.3).length).toBeGreaterThanOrEqual(20);
  });

  it("schedules start at lr₀ and only go down", () => {
    for (const s of Object.values(SCHEDULES)) {
      expect(s.lr(0.1, 0)).toBeCloseTo(0.1, 12);
      for (let t = 1; t < 40; t++) expect(s.lr(0.1, t)).toBeLessThanOrEqual(s.lr(0.1, t - 1) + 1e-15);
    }
    expect(SCHEDULES.step.lr(0.1, 10)).toBeCloseTo(0.05, 12);
  });
});

describe("batch vs stochastic vs mini-batch", () => {
  const data = lineData();

  it("batch GD follows the exact full-data slope", () => {
    const run = runBatchKind("batch", data, [0, 0], 0.1, 3);
    const [gw, gb] = gradOn(data, 0, 0);
    expect(run.path[1][0]).toBeCloseTo(-0.1 * gw, 12);
    expect(run.path[1][1]).toBeCloseTo(-0.1 * gb, 12);
    for (let i = 1; i < run.losses.length; i++) expect(run.losses[i]).toBeLessThan(run.losses[i - 1]);
  });

  it("counts the points each kind looks at", () => {
    const n = data.length;
    expect(runBatchKind("batch", data, [0, 0], 0.1, 5).seen[5]).toBe(5 * n);
    expect(runBatchKind("stochastic", data, [0, 0], 0.1, 5).seen[5]).toBe(5);
    expect(runBatchKind("minibatch", data, [0, 0], 0.1, 5).seen[5]).toBe(40);
  });

  it("stochastic steps use one point's slope, so the full-data loss can go up", () => {
    const run = runBatchKind("stochastic", data, [0, 0], 0.1, 200);
    expect(run.losses.some((l, i) => i > 0 && l > run.losses[i - 1])).toBe(true);
  });

  it.each(BATCH_KINDS)("%s gets close to the least-squares line", (k) => {
    const run = runBatchKind(k, data, [-0.5, -1], 0.1, 400);
    const best = leastSquares(data)!;
    const [w, b] = run.path.at(-1)!;
    expect(mseOf(data, w, b)).toBeLessThan(mseOf(data, best.slope, best.intercept) * 1.2);
  });
});
