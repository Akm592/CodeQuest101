import { describe, expect, it } from "vitest";

import { bitsOf } from "./bits";
import { BITS } from "./index";

const get = (id: string) => BITS.find((p) => p.id === id)!;
const inputs = (id: string) => [...get(id).examples.map((e) => e.input), ...Array.from({ length: 300 }, (_, s) => get(id).random(s + 1))];

describe("worked examples match the known answers", () => {
  it("each problem", () => {
    expect(bitsOf(11)).toEqual([0, 0, 0, 0, 1, 0, 1, 1]);
    expect(get("single-number").solve([4, 1, 2, 1, 2])).toBe(4);
    expect(get("number-of-1-bits").solve(11)).toBe(3);
    expect(get("number-of-1-bits").solve(2147483645)).toBe(30);
    expect(get("counting-bits").solve(5)).toBe("[0, 1, 1, 2, 1, 2]");
    expect(get("reverse-bits").solve(43261596)).toBe("964176192");
    expect(get("reverse-bits").solve(1)).toBe("2147483648");
    expect(get("missing-number").solve([9, 6, 4, 2, 3, 5, 7, 0, 1])).toBe(8);
    expect(get("missing-number").solve([0, 1])).toBe(2);
    expect(get("sum-two-integers").solve({ a: -2, b: 3 })).toBe(1);
    expect(get("reverse-integer").solve(-120)).toBe(-21);
    expect(get("reverse-integer").solve(1534236469)).toBe(0);
  });
});

describe("the animations", () => {
  it("the answer shown matches the slow or cross-check solution", () => {
    for (const p of BITS) for (const input of inputs(p.id)) expect(p.run(input).at(-1)!.answer, `${p.title}: ${p.describe(input)}`).toBe(String(p.solve(input)));
  });
  it("Sum of Two Integers matches JavaScript's own addition for every pair from −20 to 20", () => {
    for (let a = -20; a <= 20; a++) for (let b = -20; b <= 20; b++) expect(get("sum-two-integers").run({ a, b }).at(-1)!.answer).toBe(String(a + b));
  });
  it("Reverse Integer: the edges of the 32-bit range", () => {
    for (const x of [2147483647, -2147483648, 1463847412, -1463847412, 1000000003, 0]) expect(get("reverse-integer").run(x).at(-1)!.answer, String(x)).toBe(String(get("reverse-integer").solve(x)));
  });
});
