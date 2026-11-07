import { describe, expect, it } from "vitest";

import { decode, encode } from "./encodeDecode";
import { ARRAYS_HASHING } from "./index";

const canon = (p: (typeof ARRAYS_HASHING)[number], a: unknown) => JSON.stringify(p.canon ? p.canon(a) : a);

describe.each(ARRAYS_HASHING.map((p) => [p.title, p] as const))("%s", (_t, p) => {
  const inputs = [...p.examples.map((e) => e.input), ...Array.from({ length: 300 }, (_, s) => p.random(s + 1))];

  it("the optimal solution agrees with brute force on the examples and 300 random inputs", () => {
    if (!p.brute) return;
    for (const input of inputs) expect(canon(p, p.solve(input)), p.describe(input)).toBe(canon(p, p.brute(input).answer));
  });

  it("the animation ends with a done step and an answer, and every step maps to a guide stage", () => {
    for (const input of inputs) {
      const steps = p.run(input);
      const last = steps[steps.length - 1];
      expect(last.done, p.describe(input)).toBe(true);
      expect(last.answer).toBeTruthy();
      for (const s of steps) expect(s.explanation.length).toBeGreaterThan(0);
      const stages = new Set(p.guide.stages.map((s) => s.id));
      for (const s of steps) expect(stages, `${p.describe(input)}: stage ${s.stage}`).toContain(s.stage);
    }
  });

  it("every guide stage is reached by some example or random input", () => {
    const reached = new Set(inputs.flatMap((i) => p.run(i).map((s) => s.stage)));
    for (const s of p.guide.stages) expect(reached, s.id).toContain(s.id);
  });

  it("the examples' first step is the guide's first stage", () => {
    for (const e of p.examples) expect(p.run(e.input)[0].stage).toBe(p.guide.stages[0].id);
  });
});

describe("answers shown match solve()", () => {
  it("Two Sum, Contains Duplicate, Longest Consecutive, Product Except Self", () => {
    for (const p of ARRAYS_HASHING) {
      for (let s = 1; s <= 100; s++) {
        const input = p.random(s);
        const shown = p.run(input).at(-1)!.answer!;
        const want = p.solve(input);
        if (typeof want === "boolean" || typeof want === "number") expect(shown).toBe(String(want));
        else if (p.id === "two-sum" || p.id === "product-except-self") expect(shown).toBe(`[${(want as number[]).join(", ")}]`);
      }
    }
  });
});

describe("at scale the pattern does less work than brute force", () => {
  it.each(ARRAYS_HASHING.filter((p) => p.big && p.brute).map((p) => [p.title, p] as const))("%s", (_t, p) => {
    const input = p.big!.input();
    const steps = p.run(input);
    const brute = p.brute!(input);
    expect(canon(p, p.solve(input))).toBe(canon(p, brute.answer));
    expect(steps.at(-1)!.ops * 2).toBeLessThan(brute.ops);
  });
});

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
