import { describe, expect, it } from "vitest";

import { accuracyOf, fitTree, makeTreeData, TREE_BOUNDS, TREE_DATASETS, type TreeDatasetKey } from "./decisionTree";
import { bootstrapIndices, fitForest, forestAccuracy, forestProbs, leftOutChance, majorityRight, oobAccuracy } from "./randomForest";
import { seededRng } from "./random";

const base = (key: TreeDatasetKey) => ({ maxDepth: 50, criterion: "gini" as const, classes: TREE_DATASETS[key].classes, bounds: TREE_BOUNDS });

describe("bootstrap samples", () => {
  it("leave out about a third of the rows: (1 − 1/n)ⁿ → 1/e", () => {
    expect(leftOutChance(10)).toBeCloseTo(0.3487, 4);
    expect(leftOutChance(80)).toBeCloseTo(0.3656, 4);
    expect(leftOutChance(1e6)).toBeCloseTo(Math.exp(-1), 5);
  });

  it("match that rate in practice", () => {
    const rng = seededRng(5);
    let left = 0;
    const n = 80;
    const runs = 2000;
    for (let r = 0; r < runs; r++) left += n - new Set(bootstrapIndices(n, rng)).size;
    expect(left / (n * runs)).toBeCloseTo(leftOutChance(n), 2);
  });
});

describe("majority vote", () => {
  it("matches a brute-force count and the page's 25-tree example", () => {
    // Brute force over every pattern for 5 voters.
    let brute = 0;
    for (let mask = 0; mask < 32; mask++) {
      const right = [0, 1, 2, 3, 4].filter((b) => mask & (1 << b)).length;
      if (right >= 3) brute += 0.7 ** right * 0.3 ** (5 - right);
    }
    expect(majorityRight(5, 0.7)).toBeCloseTo(brute, 12);
    expect(majorityRight(25, 0.7)).toBeCloseTo(0.9825, 3);
    expect(majorityRight(1, 0.7)).toBeCloseTo(0.7, 12);
  });
});

describe("random forest", () => {
  it("with one tree, no bootstrap and every feature, is just the decision tree", () => {
    const data = makeTreeData("groups", 1);
    const forest = fitForest(data, { ...base("groups"), trees: 1, maxFeatures: 2, bootstrap: false, seed: 1 });
    const tree = fitTree(data, base("groups"));
    const probe = makeTreeData("groups", 50, 200);
    expect(forestAccuracy(forest, probe)).toBe(accuracyOf(tree, probe));
  });

  it("averages probabilities that add up to 1", () => {
    const data = makeTreeData("groups", 2);
    const forest = fitForest(data, { ...base("groups"), trees: 10, maxFeatures: 1, bootstrap: true, seed: 3 });
    const p = forestProbs(forest, { x: 5, y: 5 });
    expect(p.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
  });

  it.each(["noisy", "diagonal"] as const)("beats a single fully grown tree on new points (%s)", (key) => {
    for (const seed of [1, 2, 3]) {
      const data = makeTreeData(key, seed);
      const fresh = makeTreeData(key, 900 + seed, 2000);
      const tree = accuracyOf(fitTree(data, base(key)), fresh);
      const forest = forestAccuracy(fitForest(data, { ...base(key), trees: 50, maxFeatures: 1, bootstrap: true, seed }), fresh);
      expect(forest).toBeGreaterThan(tree);
    }
  });

  it("doesn't get worse as trees are added (Breiman: “does not overfit” with more trees)", () => {
    const data = makeTreeData("noisy", 1);
    const fresh = makeTreeData("noisy", 999, 2000);
    const forest = fitForest(data, { ...base("noisy"), trees: 50, maxFeatures: 1, bootstrap: true, seed: 1 });
    const at = (k: number) => forestAccuracy(forest, fresh, k);
    expect(at(50)).toBeGreaterThanOrEqual(at(10) - 0.02);
    expect(at(50)).toBeGreaterThan(at(1));
  });

  it("gives an out-of-bag estimate close to accuracy on new points", () => {
    for (const key of ["groups", "noisy", "diagonal"] as const) {
      const data = makeTreeData(key, 1);
      const fresh = makeTreeData(key, 999, 2000);
      const forest = fitForest(data, { ...base(key), trees: 50, maxFeatures: 1, bootstrap: true, seed: 1 });
      const oob = oobAccuracy(forest, data);
      expect(oob.covered).toBe(data.length);
      expect(Math.abs(oob.accuracy - forestAccuracy(forest, fresh))).toBeLessThan(0.08);
    }
  });
});
