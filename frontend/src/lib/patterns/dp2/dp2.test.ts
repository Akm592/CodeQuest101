import { describe, expect, it } from "vitest";

import { DP2 } from "./index";

const get = (id: string) => DP2.find((p) => p.id === id)!;
const inputs = (id: string) => [...get(id).examples.map((e) => e.input), ...Array.from({ length: 300 }, (_, s) => get(id).random(s + 1))];

describe("worked examples match the known answers", () => {
  it("each problem", () => {
    expect(get("unique-paths").solve({ m: 3, n: 7 })).toBe(28);
    expect(get("lcs").solve({ a: "abcde", b: "ace" })).toBe(3);
    expect(get("lcs").solve({ a: "stone", b: "longest" })).toBe(3);
    expect(get("stock-cooldown").solve([1, 2, 3, 0, 2])).toBe(3);
    expect(get("stock-cooldown").solve([1, 4, 2, 7])).toBe(6);
    expect(get("coin-change-ii").solve({ coins: [1, 2, 5], amount: 5 })).toBe(4);
    expect(get("coin-change-ii").solve({ coins: [2, 3], amount: 7 })).toBe(1);
    expect(get("target-sum").solve({ nums: [1, 1, 1, 1, 1], target: 3 })).toBe(5);
    expect(get("target-sum").solve({ nums: [2, 1, 1], target: 2 })).toBe(2);
    expect(get("interleaving-string").solve({ a: "aabcc", b: "dbbca", c: "aadbbcbcac" })).toBe(true);
    expect(get("interleaving-string").solve({ a: "aabcc", b: "dbbca", c: "aadbbbaccc" })).toBe(false);
    expect(get("longest-increasing-path").solve([[9, 9, 4], [6, 6, 8], [2, 1, 1]])).toBe(4);
    expect(get("longest-increasing-path").solve([[1, 2, 3], [8, 9, 4], [7, 6, 5]])).toBe(9);
    expect(get("distinct-subsequences").solve({ a: "rabbbit", b: "rabbit" })).toBe(3);
    expect(get("distinct-subsequences").solve({ a: "babgbag", b: "bag" })).toBe(5);
    expect(get("edit-distance").solve({ a: "horse", b: "ros" })).toBe(3);
    expect(get("edit-distance").solve({ a: "intention", b: "execution" })).toBe(5);
    expect(get("burst-balloons").solve([3, 1, 5, 8])).toBe(167);
    expect(get("burst-balloons").solve([1, 5])).toBe(10);
    expect(get("regex-matching").solve({ a: "aab", b: "c*a*b" })).toBe(true);
    expect(get("regex-matching").solve({ a: "aa", b: "a" })).toBe(false);
  });
});

describe("the animations", () => {
  it("the answer shown matches the slow solution", () => {
    for (const p of DP2) for (const input of inputs(p.id)) expect(p.run(input).at(-1)!.answer, `${p.title}: ${p.describe(input)}`).toBe(String(p.solve(input)));
  });
  it("tables: every row of the grid has the same number of cells", () => {
    for (const p of DP2)
      for (const input of inputs(p.id).slice(0, 60))
        for (const st of p.run(input)) {
          if (!st.grid) continue;
          const w = st.grid.cells[0].length;
          for (const line of st.grid.cells) expect(line.length, p.title).toBe(w);
        }
  });
  it("random inputs cover both answers for the yes/no problems", () => {
    for (const id of ["interleaving-string", "regex-matching"]) expect(new Set(inputs(id).map((i) => get(id).solve(i))), id).toEqual(new Set([true, false]));
  });
});
