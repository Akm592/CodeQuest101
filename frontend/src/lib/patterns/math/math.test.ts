import { describe, expect, it } from "vitest";

import { MATH } from "./index";

const get = (id: string) => MATH.find((p) => p.id === id)!;
const inputs = (id: string) => [...get(id).examples.map((e) => e.input), ...Array.from({ length: 300 }, (_, s) => get(id).random(s + 1))];
const canon = (id: string, v: unknown) => (get(id).canon ? get(id).canon!(v) : String(v));

describe("worked examples match the known answers", () => {
  it("each problem", () => {
    expect(get("rotate-image").solve([[1, 2, 3], [4, 5, 6], [7, 8, 9]])).toBe("[[7,4,1], [8,5,2], [9,6,3]]");
    expect(get("spiral-matrix").solve([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]])).toBe("[1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7]");
    expect(get("set-matrix-zeroes").solve([[0, 1, 2, 0], [3, 4, 5, 2], [1, 3, 1, 5]])).toBe("[[0,0,0,0], [0,4,5,0], [0,3,1,0]]");
    expect(get("happy-number").solve(19)).toBe(true);
    expect(get("happy-number").solve(2)).toBe(false);
    expect(get("plus-one").solve([9, 9, 9])).toBe("[1, 0, 0, 0]");
    expect(get("pow-x-n").solve({ x: 2, n: 10 })).toBe("1024");
    expect(get("pow-x-n").solve({ x: 2, n: -2 })).toBe("0.25");
    expect(get("multiply-strings").solve({ a: "123", b: "456" })).toBe('"56088"');
    expect(get("detect-squares").solve(get("detect-squares").examples[0].input)).toBe("[1, 0, 2]");
    expect(get("detect-squares").solve(get("detect-squares").examples[1].input)).toBe("[1, 1]");
  });
});

describe("the animations", () => {
  it("the answer shown matches the slow or cross-check solution", () => {
    for (const p of MATH) for (const input of inputs(p.id)) expect(canon(p.id, p.run(input).at(-1)!.answer), `${p.title}: ${p.describe(input)}`).toBe(canon(p.id, p.solve(input)));
  });
  it("random inputs cover both answers for Happy Number", () => {
    expect(new Set(inputs("happy-number").map((i) => get("happy-number").solve(i)))).toEqual(new Set([true, false]));
  });
});
