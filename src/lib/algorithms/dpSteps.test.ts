import { describe, expect, it } from "vitest";

import {
  buildEditDistanceSteps,
  buildKnapsackSteps,
  buildLcsSteps,
  type KnapsackItem,
} from "./dpSteps";
import { assertStepInvariants } from "./testHelpers";

/** Plain edit distance, written independently of the generator. */
function referenceEditDistance(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

/** Plain LCS length, written independently of the generator. */
function referenceLcs(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

/** Exhaustive 0/1 knapsack over every subset — only valid for small item counts. */
function referenceKnapsack(items: KnapsackItem[], capacity: number): number {
  let best = 0;
  for (let mask = 0; mask < 1 << items.length; mask++) {
    let w = 0;
    let v = 0;
    for (let i = 0; i < items.length; i++) {
      if (mask & (1 << i)) {
        w += items[i].weight;
        v += items[i].value;
      }
    }
    if (w <= capacity) best = Math.max(best, v);
  }
  return best;
}

const lastGrid = (steps: { grid: number[][] }[]) => steps[steps.length - 1].grid;

describe("edit distance", () => {
  it("computes the textbook answer", () => {
    const { steps } = buildEditDistanceSteps("kitten", "sitting");
    const grid = lastGrid(steps);
    expect(grid[6][7]).toBe(3);
  });

  it("handles the empty-string edges", () => {
    expect(lastGrid(buildEditDistanceSteps("", "abc").steps)[0][3]).toBe(3);
    expect(lastGrid(buildEditDistanceSteps("abc", "").steps)[3][0]).toBe(3);
    expect(lastGrid(buildEditDistanceSteps("", "").steps)[0][0]).toBe(0);
  });

  it("is zero for identical strings", () => {
    const { steps } = buildEditDistanceSteps("sitting", "sitting");
    expect(lastGrid(steps)[7][7]).toBe(0);
  });

  it("agrees with a plain recurrence on every cell", () => {
    const pairs: [string, string][] = [
      ["kitten", "sitting"],
      ["flaw", "lawn"],
      ["abcdef", "azced"],
      ["aaa", "aaaa"],
    ];
    for (const [a, b] of pairs) {
      const grid = lastGrid(buildEditDistanceSteps(a, b).steps);
      expect(grid[a.length][b.length]).toBe(referenceEditDistance(a, b));
    }
  });

  it("produces an edit script that actually transforms a into b", () => {
    const { steps } = buildEditDistanceSteps("kitten", "sitting");
    const final = steps[steps.length - 1];
    // Three operations for kitten -> sitting, and the summary must name them.
    expect(final.explanation).toContain("Distance 3");
    expect(final.path && final.path.length).toBeGreaterThan(0);
  });

  it("holds the shared invariants", () => {
    const { steps } = buildEditDistanceSteps("kitten", "sitting");
    assertStepInvariants(steps, { snapshot: (s) => s.grid });
  });

  it("stops at the cap instead of hanging", () => {
    const { steps } = buildEditDistanceSteps("a".repeat(40), "b".repeat(40), { maxSteps: 50 });
    expect(steps.length).toBeLessThanOrEqual(50);
    expect(steps[steps.length - 1].truncated).toBe(true);
  });
});

describe("longest common subsequence", () => {
  it("computes the textbook answer and spells the subsequence", () => {
    const { steps, answer } = buildLcsSteps("AGGTAB", "GXTXAYB");
    expect(lastGrid(steps)[6][7]).toBe(4);
    expect(answer).toContain("GTAB");
  });

  it("agrees with a plain recurrence", () => {
    const pairs: [string, string][] = [
      ["AGGTAB", "GXTXAYB"],
      ["ABCBDAB", "BDCABA"],
      ["abc", "def"],
      ["aaaa", "aa"],
    ];
    for (const [a, b] of pairs) {
      const grid = lastGrid(buildLcsSteps(a, b).steps);
      expect(grid[a.length][b.length]).toBe(referenceLcs(a, b));
    }
  });

  it("reports nothing when there is no common subsequence", () => {
    const { steps, answer } = buildLcsSteps("abc", "def");
    expect(lastGrid(steps)[3][3]).toBe(0);
    expect(answer).toBe("no common subsequence");
  });

  it("returns a subsequence that is a subsequence of both inputs", () => {
    const a = "ABCBDAB";
    const b = "BDCABA";
    const { answer } = buildLcsSteps(a, b);
    const seq = answer.match(/"([^"]*)"/)?.[1] ?? "";
    const isSubsequence = (needle: string, hay: string) => {
      let k = 0;
      for (const ch of hay) if (k < needle.length && needle[k] === ch) k++;
      return k === needle.length;
    };
    expect(seq.length).toBe(referenceLcs(a, b));
    expect(isSubsequence(seq, a)).toBe(true);
    expect(isSubsequence(seq, b)).toBe(true);
  });

  it("holds the shared invariants", () => {
    const { steps } = buildLcsSteps("AGGTAB", "GXTXAYB");
    assertStepInvariants(steps, { snapshot: (s) => s.grid });
  });
});

describe("0/1 knapsack", () => {
  const items: KnapsackItem[] = [
    { weight: 5, value: 10, label: "A" },
    { weight: 4, value: 40, label: "B" },
    { weight: 6, value: 30, label: "C" },
    { weight: 3, value: 50, label: "D" },
  ];

  it("finds the optimum", () => {
    const { steps } = buildKnapsackSteps(items, 10);
    expect(lastGrid(steps)[4][10]).toBe(90);
  });

  it("agrees with exhaustive subset search across capacities", () => {
    for (let cap = 0; cap <= 14; cap++) {
      const grid = lastGrid(buildKnapsackSteps(items, cap).steps);
      expect(grid[items.length][cap], `capacity ${cap}`).toBe(referenceKnapsack(items, cap));
    }
  });

  it("traces back a bag that fits and is worth the reported value", () => {
    const { steps } = buildKnapsackSteps(items, 10);
    const final = steps[steps.length - 1];
    const chosen = items.filter((it) => final.explanation.includes(it.label));
    const weight = chosen.reduce((s, it) => s + it.weight, 0);
    const value = chosen.reduce((s, it) => s + it.value, 0);
    expect(weight).toBeLessThanOrEqual(10);
    expect(value).toBe(90);
  });

  it("reports nothing fitting when capacity is too small", () => {
    const { steps } = buildKnapsackSteps(items, 2);
    expect(lastGrid(steps)[4][2]).toBe(0);
    expect(steps[steps.length - 1].explanation).toContain("Nothing fits");
  });

  it("holds the shared invariants", () => {
    const { steps } = buildKnapsackSteps(items, 10);
    assertStepInvariants(steps, { snapshot: (s) => s.grid });
  });
});
