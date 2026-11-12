import { describe, expect, it } from "vitest";

import { BINARY_SEARCH } from "./index";

const get = (id: string) => BINARY_SEARCH.find((p) => p.id === id)!;
const inputs = (id: string) => [...get(id).examples.map((e) => e.input), ...Array.from({ length: 300 }, (_, s) => get(id).random(s + 1))];

describe("worked examples match the known answers", () => {
  it("each problem", () => {
    expect(get("binary-search").solve({ nums: [-1, 0, 3, 5, 9, 12], target: 9 })).toBe(4);
    expect(get("binary-search").solve({ nums: [-1, 0, 3, 5, 9, 12], target: 2 })).toBe(-1);
    const M = [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]];
    expect(get("search-2d-matrix").solve({ matrix: M, target: 3 })).toBe(true);
    expect(get("search-2d-matrix").solve({ matrix: M, target: 13 })).toBe(false);
    expect(get("koko-bananas").solve({ piles: [3, 6, 7, 11], h: 8 })).toBe(4);
    expect(get("koko-bananas").solve({ piles: [30, 11, 23, 4, 20], h: 5 })).toBe(30);
    expect(get("koko-bananas").solve({ piles: [30, 11, 23, 4, 20], h: 6 })).toBe(23);
    expect(get("find-min-rotated").solve([4, 5, 6, 7, 0, 1, 2])).toBe(0);
    expect(get("search-rotated").solve({ nums: [4, 5, 6, 7, 0, 1, 2], target: 0 })).toBe(4);
    expect(get("time-map").solve(["set foo bar 1", "get foo 1", "get foo 3", "set foo bar2 4", "get foo 4", "get foo 5"])).toBe("[bar, bar, bar2, bar2]");
    expect(get("median-two-arrays").solve({ a: [1, 3], b: [2] })).toBe(2);
    expect(get("median-two-arrays").solve({ a: [1, 2], b: [3, 4] })).toBe(2.5);
  });
});

describe("the animations", () => {
  it("Time Map shows the same get results as a linear scan", () => {
    const p = get("time-map");
    for (const calls of inputs("time-map")) expect(p.run(calls).at(-1)!.answer, calls.join(", ")).toBe(p.solve(calls));
  });
  for (const id of ["binary-search", "search-rotated"])
    it(`${id} never rules out the cell that holds the target`, () => {
      const p = get(id);
      for (const input of inputs(id)) {
        const at = input.nums.indexOf(input.target);
        if (at < 0) continue;
        for (const st of p.run(input)) expect(st.rows[0].cells[at].tone, p.describe(input)).not.toBe("idle");
      }
    });
  it("Koko never rules out the answer speed", () => {
    const p = get("koko-bananas");
    for (const input of inputs("koko-bananas")) {
      const k = p.solve(input) as number;
      for (const st of p.run(input)) expect(st.rows[0].cells[k - 1].tone, p.describe(input)).not.toBe("idle");
    }
  });
  it("examples and random inputs cover found and missing", () => {
    for (const id of ["binary-search", "search-rotated"]) expect(new Set(inputs(id).map((i) => (get(id).solve(i) as number) >= 0))).toEqual(new Set([true, false]));
    expect(new Set(inputs("search-2d-matrix").map((i) => get("search-2d-matrix").solve(i)))).toEqual(new Set([true, false]));
  });
});
