import { describe, expect, it } from "vitest";

import { assertStepInvariants } from "../algorithms/testHelpers";
import { bestStump, buildBoostSteps, errorCurve, evalSteps, fitBoost, fitRegTree, mse, predictBoost, waveData, type XY } from "./gradientBoosting";

const EXAMPLE: XY[] = [1, 3, 2, 5, 4].map((y, i) => ({ x: i + 1, y }));

describe("regression trees", () => {
  it("picks the stump with the lowest squared error (brute force)", () => {
    for (const seed of [1, 2, 3]) {
      const pts = waveData(seed, 25);
      let best = Infinity;
      for (const t of pts.map((p) => p.x)) {
        const l = pts.filter((p) => p.x <= t).map((p) => p.y);
        const r = pts.filter((p) => p.x > t).map((p) => p.y);
        if (!l.length || !r.length) continue;
        const sse = (v: number[]) => {
          const m = v.reduce((a, b) => a + b, 0) / v.length;
          return v.reduce((s, x) => s + (x - m) ** 2, 0);
        };
        best = Math.min(best, sse(l) + sse(r));
      }
      expect(bestStump(pts)!.error).toBeCloseTo(best, 10);
    }
  });

  it("predicts the mean of each side", () => {
    const tree = fitRegTree(EXAMPLE, 1);
    expect(tree.cuts).toEqual([3.5]);
    expect(evalSteps(tree, 1)).toBeCloseTo(2, 12);
    expect(evalSteps(tree, 5)).toBeCloseTo(4.5, 12);
  });
});

describe("the maths section's 5-point example", () => {
  it("matches the page: F₀ = 3, split at 3.5, leaves −1 and 1.5, MSE 2 → 0.875 with lr 0.5", () => {
    const m = fitBoost(EXAMPLE, 0.5, 1, 1);
    expect(m.base).toBe(3);
    expect(m.trees[0].cuts).toEqual([3.5]);
    expect(m.trees[0].values[0]).toBeCloseTo(-1, 12);
    expect(m.trees[0].values[1]).toBeCloseTo(1.5, 12);
    expect(mse(EXAMPLE, (x) => predictBoost(m, x, 0))).toBeCloseTo(2, 12);
    expect(mse(EXAMPLE, (x) => predictBoost(m, x))).toBeCloseTo(0.875, 12);
  });
});

describe("boosting", () => {
  it("never raises training error when the learning rate is at most 1", () => {
    const data = waveData(1);
    for (const lr of [0.1, 0.5, 1]) {
      const curve = errorCurve(fitBoost(data, lr, 2, 60), data);
      for (let k = 1; k < curve.length; k++) expect(curve[k]).toBeLessThanOrEqual(curve[k - 1] + 1e-12);
    }
  });

  it("matches the slow way of predicting", () => {
    const data = waveData(2);
    const m = fitBoost(data, 0.3, 2, 15);
    expect(errorCurve(m, data)[15]).toBeCloseTo(mse(data, (x) => predictBoost(m, x)), 12);
  });

  it("a smaller learning rate needs more trees to reach the same training error", () => {
    const data = waveData(1);
    const reach = (lr: number) => errorCurve(fitBoost(data, lr, 1, 400), data).findIndex((e) => e < 0.4);
    expect(reach(0.1)).toBeGreaterThan(reach(0.5));
  });

  it("overfits with too many trees: new-point error bottoms out, then creeps back up (lr 0.1, depth 2)", () => {
    const data = waveData(1);
    const fresh = waveData(999, 1000);
    const m = fitBoost(data, 0.1, 2, 200);
    const test = errorCurve(m, fresh);
    const best = Math.min(...test);
    const at = test.indexOf(best);
    expect(at).toBeGreaterThan(30);
    expect(at).toBeLessThan(120);
    expect(test[200]).toBeGreaterThan(best * 1.1);
    expect(errorCurve(m, data)[200]).toBeLessThan(0.01); // while training error is almost 0
  });

  it("aggressive settings memorise quickly and end no better than one deep tree", () => {
    const data = waveData(1);
    const fresh = waveData(999, 1000);
    const m = fitBoost(data, 1, 4, 20);
    expect(errorCurve(m, data)[5]).toBeLessThan(0.01);
    const deep = fitRegTree(data, 10);
    expect(errorCurve(m, fresh)[20]).toBeCloseTo(mse(fresh, (x) => evalSteps(deep, x)), 2);
  });

  it("gentle settings at their best beat a single deep tree on new points", () => {
    const data = waveData(1);
    const fresh = waveData(999, 1000);
    const test = errorCurve(fitBoost(data, 0.1, 2, 200), fresh);
    const deep = fitRegTree(data, 10);
    expect(Math.min(...test)).toBeLessThan(mse(fresh, (x) => evalSteps(deep, x)) * 0.9);
  });

  it("records a clean run of steps", () => {
    const steps = buildBoostSteps(waveData(1), fitBoost(waveData(1), 0.3, 2, 10));
    expect(steps[0].phase).toBe("start");
    expect(steps.at(-1)!.phase).toBe("done");
    assertStepInvariants(steps);
  });
});
