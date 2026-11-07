import { describe, expect, it } from "vitest";

import { TWO_POINTERS } from "./index";
import { threeSumSolve } from "./threeSum";
import { trapSolve } from "./trappingRain";

const get = (id: string) => TWO_POINTERS.find((p) => p.id === id)!;

describe("worked examples match the known answers", () => {
  it("each problem", () => {
    expect(get("valid-palindrome").solve("A man, a plan, a canal: Panama")).toBe(true);
    expect(get("valid-palindrome").solve("race a car")).toBe(false);
    expect(get("two-sum-ii").solve({ numbers: [2, 7, 11, 15], target: 9 })).toEqual([1, 2]);
    expect(threeSumSolve([-1, 0, 1, 2, -1, -4])).toEqual([[-1, -1, 2], [-1, 0, 1]]);
    expect(threeSumSolve([0, 0, 0, 0])).toEqual([[0, 0, 0]]);
    expect(get("container-water").solve([1, 8, 6, 2, 5, 4, 8, 3, 7])).toBe(49);
    expect(trapSolve([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1])).toBe(6);
    expect(trapSolve([4, 2, 0, 3, 2, 5])).toBe(9);
  });
});

describe("the animations' answers", () => {
  it("Two Sum II shows the 1-based pair, and its examples have exactly one pair", () => {
    const p = get("two-sum-ii");
    for (const { input } of p.examples) {
      let pairs = 0;
      for (let a = 0; a < input.numbers.length; a++) for (let b = a + 1; b < input.numbers.length; b++) if (input.numbers[a] + input.numbers[b] === input.target) pairs++;
      expect(pairs).toBe(1);
      expect(p.run(input).at(-1)!.answer).toBe(`[${(p.solve(input) as number[]).join(", ")}]`);
    }
  });
  it("Trapping Rain Water's per-bar water adds up to the total, and is never negative", () => {
    const p = get("trapping-rain");
    for (let s = 1; s <= 200; s++) {
      const h = p.random(s);
      const last = p.run(h).at(-1)!;
      const water = last.bars!.water!;
      expect(water.every((w) => w >= 0)).toBe(true);
      expect(water.reduce((a, b) => a + b, 0)).toBe(trapSolve(h));
    }
  });
  it("3Sum shows each unique triplet once", () => {
    const p = get("3sum");
    for (let s = 1; s <= 200; s++) {
      const nums = p.random(s);
      const shown = p.run(nums).at(-1)!.answer!;
      const want = threeSumSolve(nums);
      expect(shown).toBe(want.length ? want.map((t) => `[${t.join(", ")}]`).join(" ") : "[]");
    }
  });
});
