import { describe, expect, it } from "vitest";

import { buildBinarySearchSteps, parseSortedArray } from "./binarySearchSteps";
import { buildFloydSteps } from "./floydSteps";
import { buildRotateSteps, parseMatrix } from "./rotateImageSteps";
import { buildSortSteps, type Algo } from "./sortSteps";
import { buildSubarraySteps, parseNonNegativeArray } from "./subarraySumSteps";

// Checked against independent answers, not against the generators' own logic.

describe("rotate image", () => {
  const rotate = (m: number[][]) => m[0].map((_, j) => m.map((row) => row[j]).reverse());

  it.each([1, 2, 3, 4, 5])("ends on the 90° clockwise rotation for n = %i", (n) => {
    const m = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => i * n + j));
    const steps = buildRotateSteps(m);
    const last = steps.at(-1)?.grid ?? m;
    expect(last).toEqual(rotate(m));
  });

  it("moves values on every step, not just at the end", () => {
    const steps = buildRotateSteps([[1, 2], [3, 4]]);
    expect(steps[0].grid).toEqual([[1, 3], [2, 4]]);
  });

  it("rejects a non-square matrix", () => {
    expect(typeof parseMatrix("[[1,2],[3]]")).toBe("string");
    expect(parseMatrix("[[1,2],[3,4]]")).toEqual([[1, 2], [3, 4]]);
  });
});

describe("longest subarray with sum k", () => {
  const bruteForce = (arr: number[], k: number) => {
    let best = 0;
    for (let i = 0; i < arr.length; i++) {
      let sum = 0;
      for (let j = i; j < arr.length; j++) {
        sum += arr[j];
        if (sum === k) best = Math.max(best, j - i + 1);
      }
    }
    return best;
  };

  it.each([
    [[10, 5, 2, 7, 1, 9], 15],
    [[1, 2, 3, 1, 1, 1, 1], 3],
    [[0, 0, 0], 0],
    [[5, 5, 5], 4],
    [[2, 0, 0, 3], 3],
  ])("matches brute force for %j, k = %i", (arr, k) => {
    const done = buildSubarraySteps(arr, k).at(-1)!;
    expect(done.action).toBe("done");
    const length = done.best ? done.best.end - done.best.start + 1 : 0;
    expect(length).toBe(bruteForce(arr, k));
    if (done.best) {
      expect(arr.slice(done.best.start, done.best.end + 1).reduce((a, b) => a + b, 0)).toBe(k);
    }
  });

  it("refuses negative numbers, where the sliding window is wrong", () => {
    expect(typeof parseNonNegativeArray("1, -1, 5")).toBe("string");
  });
});

describe("floyd's tortoise and hare", () => {
  it("reports no cycle on a plain list", () => {
    expect(buildFloydSteps(6, null, "cycle").at(-1)!.phase).toBe("no-cycle");
  });

  it.each([0, 1, 2, 4, 5])("finds the cycle start when the tail points to node index %i", (target) => {
    const last = buildFloydSteps(6, target, "cycle").at(-1)!;
    expect(last.phase).toBe("cycle-start");
    expect(last.answer).toBe(target);
  });

  it.each([
    [1, 0],
    [2, 1],
    [5, 2],
    [6, 3],
  ])("middle of %i nodes is index %i (second middle when even)", (n, mid) => {
    expect(buildFloydSteps(n, null, "middle").at(-1)!.answer).toBe(mid);
  });
});

describe("binary search", () => {
  const arr = [1, 4, 9, 16, 25, 36, 49];

  it.each(arr.map((v, i) => [v, i]))("finds %i at index %i", (value, index) => {
    const last = buildBinarySearchSteps(arr, value).at(-1)!;
    expect(last.outcome).toBe("found");
    expect(last.mid).toBe(index);
  });

  it.each([0, 5, 50])("reports %i as not found", (value) => {
    expect(buildBinarySearchSteps(arr, value).at(-1)!.outcome).toBe("not-found");
  });

  it("sorts and de-duplicates custom input", () => {
    expect(parseSortedArray("5 3 3, 1")).toEqual([1, 3, 5]);
  });
});

describe("sorting", () => {
  const inputs = [[5, 1, 4, 2, 8], [3, 3, 1, 2, 1], [1, 2, 3, 4], [9, 7, 5, 3, 1], [42, 7]];
  const algos: Algo[] = ["bubble", "selection", "quick", "merge"];

  for (const algo of algos) {
    it.each(inputs)(`${algo} sorts %j`, (...input) => {
      const steps = buildSortSteps(input, algo);
      const last = steps.at(-1)!;
      expect(last.arr).toEqual([...input].sort((a, b) => a - b));
      expect(last.sorted).toHaveLength(input.length);
      // Every frame is a permutation of the input: nothing is lost mid-sort.
      const key = [...input].sort((a, b) => a - b).join();
      for (const s of steps) expect([...s.arr].sort((a, b) => a - b).join()).toBe(key);
    });
  }
});
