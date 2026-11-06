import { describe, expect, it } from "vitest";

import { assertStepInvariants } from "../algorithms/testHelpers";
import {
  accuracyOf,
  bestSplit,
  buildTreeSteps,
  classify,
  fitTree,
  impurity,
  makeTreeData,
  TREE_BOUNDS,
  TREE_DATASETS,
  type LabeledPoint,
  type TreeDatasetKey,
} from "./decisionTree";

const opts = (key: TreeDatasetKey, maxDepth: number, criterion: "gini" | "entropy" = "gini") => ({
  maxDepth,
  criterion,
  classes: TREE_DATASETS[key].classes,
  bounds: TREE_BOUNDS,
});

describe("impurity", () => {
  it("matches the textbook values", () => {
    expect(impurity([5, 5], "gini")).toBeCloseTo(0.5, 12);
    expect(impurity([5, 5], "entropy")).toBeCloseTo(1, 12); // one bit
    expect(impurity([7, 0], "gini")).toBe(0);
    expect(impurity([7, 0], "entropy")).toBe(0);
    expect(impurity([1, 1, 1], "gini")).toBeCloseTo(2 / 3, 12);
    expect(impurity([1, 1, 1], "entropy")).toBeCloseTo(Math.log2(3), 12);
  });

  it("writes Gini both ways: Σ p(1 − p) = 1 − Σ p²", () => {
    for (const c of [[3, 7], [2, 2, 6], [1, 4, 0, 5]]) {
      const n = c.reduce((a, b) => a + b, 0);
      expect(impurity(c, "gini")).toBeCloseTo(1 - c.reduce((s, v) => s + (v / n) ** 2, 0), 12);
    }
  });
});

describe("best split", () => {
  // Brute force, written independently: every threshold at every data value.
  const brute = (pts: LabeledPoint[], classes: number) => {
    let best = Infinity;
    for (const f of ["x", "y"] as const) {
      for (const t of pts.map((p) => p[f])) {
        const l = pts.filter((p) => p[f] <= t);
        const r = pts.filter((p) => p[f] > t);
        if (!l.length || !r.length) continue;
        const cnt = (s: LabeledPoint[]) => Array.from({ length: classes }, (_, k) => s.filter((p) => p.label === k).length);
        best = Math.min(best, (l.length / pts.length) * impurity(cnt(l), "gini") + (r.length / pts.length) * impurity(cnt(r), "gini"));
      }
    }
    return best;
  };

  it.each(Object.keys(TREE_DATASETS) as TreeDatasetKey[])("%s: finds the lowest weighted impurity there is", (key) => {
    for (const seed of [1, 2, 3]) {
      const pts = makeTreeData(key, seed, 40);
      expect(bestSplit(pts, TREE_DATASETS[key].classes, "gini")!.score).toBeCloseTo(brute(pts, TREE_DATASETS[key].classes), 12);
    }
  });

  it("picks 6.5 in the maths section's 10-point example", () => {
    const labels = [0, 0, 0, 1, 0, 0, 1, 1, 1, 1];
    const pts = labels.map((label, i) => ({ x: i + 1, y: 0, label }));
    const s = bestSplit(pts, 2, "gini")!;
    expect(s.feature).toBe("x");
    expect(s.threshold).toBe(6.5);
    expect(s.score).toBeCloseTo(1 / 6, 12);
    expect(s.gain).toBeCloseTo(0.5 - 1 / 6, 12);
    // The page says entropy picks the same question.
    expect(bestSplit(pts, 2, "entropy")!.threshold).toBe(6.5);
  });
});

describe("growing the tree", () => {
  it("never goes deeper than max depth", () => {
    for (const d of [1, 2, 4]) {
      const nodes = fitTree(makeTreeData("groups", 1), opts("groups", d));
      expect(Math.max(...nodes.map((n) => n.depth))).toBeLessThanOrEqual(d);
    }
  });

  it("with no depth limit, gets every training point right on clean data", () => {
    for (const key of ["groups", "diagonal", "checker"] as const) {
      const pts = makeTreeData(key, 1);
      expect(accuracyOf(fitTree(pts, opts(key, 50)), pts)).toBe(1);
    }
  });

  it("sends every point to the leaf whose box contains it", () => {
    const pts = makeTreeData("groups", 2);
    const nodes = fitTree(pts, opts("groups", 4));
    for (const p of pts) {
      const { box } = classify(nodes, p).leaf;
      expect(p.x).toBeGreaterThanOrEqual(box.x0 - 1e-9);
      expect(p.x).toBeLessThanOrEqual(box.x1 + 1e-9);
      expect(p.y).toBeGreaterThanOrEqual(box.y0 - 1e-9);
      expect(p.y).toBeLessThanOrEqual(box.y1 + 1e-9);
    }
  });

  it("overfits noisy data: deeper trees score higher on training points but not on new ones", () => {
    const train = makeTreeData("noisy", 1);
    const test = makeTreeData("noisy", 999, 2000);
    const at = (d: number) => {
      const nodes = fitTree(train, opts("noisy", d));
      return { train: accuracyOf(nodes, train), test: accuracyOf(nodes, test) };
    };
    const shallow = at(2);
    const deep = at(20);
    expect(deep.train).toBe(1);
    expect(deep.train).toBeGreaterThan(shallow.train);
    expect(deep.test).toBeLessThan(shallow.test);
  });

  it("checkerboard: the first greedy question helps very little", () => {
    const pts = makeTreeData("checker", 1);
    expect(bestSplit(pts, 2, "gini")!.gain).toBeLessThan(0.05);
  });

  it("records a clean run of steps", () => {
    const steps = buildTreeSteps(makeTreeData("groups", 1), opts("groups", 3), TREE_DATASETS.groups.names);
    expect(steps[0].phase).toBe("start");
    expect(steps.at(-1)!.phase).toBe("done");
    assertStepInvariants(steps);
  });
});
