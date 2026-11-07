import { describe, expect, it } from "vitest";

import { decode, encode } from "./encodeDecode";
import { ARRAYS_HASHING } from "./index";


describe("examples follow the problem rules", () => {
  it("Two Sum examples have exactly one pair", () => {
    const p = ARRAYS_HASHING.find((q) => q.id === "two-sum")!;
    for (const { input } of p.examples) {
      let pairs = 0;
      for (let a = 0; a < input.nums.length; a++) for (let b = a + 1; b < input.nums.length; b++) if (input.nums[a] + input.nums[b] === input.target) pairs++;
      expect(pairs).toBe(1);
    }
  });
});

describe("encode / decode", () => {
  it("round-trips any strings, including #, digits and empty ones", () => {
    const cases = [[""], ["", ""], ["#"], ["12#", "3"], ["a".repeat(15), "#1#2"], []];
    for (const c of cases) expect(decode(encode(c))).toEqual(c);
  });
});

describe("worked examples", () => {
  const get = (id: string) => ARRAYS_HASHING.find((p) => p.id === id)!;
  it("match the known answers", () => {
    expect(get("two-sum").solve({ nums: [2, 7, 11, 15], target: 9 })).toEqual([0, 1]);
    expect(get("product-except-self").solve([1, 2, 3, 4])).toEqual([24, 12, 8, 6]);
    expect(get("product-except-self").solve([-1, 1, 0, -3, 3])).toEqual([0, 0, 9, 0, 0]);
    expect(get("longest-consecutive").solve([100, 4, 200, 1, 3, 2])).toBe(4);
    expect(get("longest-consecutive").solve([0, 3, 7, 2, 5, 8, 4, 6, 0, 1])).toBe(9);
    expect(get("valid-sudoku").solve(get("valid-sudoku").examples[0].input)).toBe(true);
    expect(get("valid-sudoku").solve(get("valid-sudoku").examples[1].input)).toBe(false);
    expect(new Set(get("top-k-frequent").solve({ nums: [1, 1, 1, 2, 2, 3], k: 2 }) as number[])).toEqual(new Set([1, 2]));
  });
});
