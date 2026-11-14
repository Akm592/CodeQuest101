import { describe, expect, it } from "vitest";

import { DP1 } from "./index";

const get = (id: string) => DP1.find((p) => p.id === id)!;
const inputs = (id: string) => [...get(id).examples.map((e) => e.input), ...Array.from({ length: 300 }, (_, s) => get(id).random(s + 1))];

describe("worked examples match the known answers", () => {
  it("each problem", () => {
    expect(get("climbing-stairs").solve(5)).toBe(8);
    expect(get("min-cost-stairs").solve([10, 15, 20])).toBe(15);
    expect(get("min-cost-stairs").solve([1, 100, 1, 1, 1, 100, 1, 1, 100, 1])).toBe(6);
    expect(get("house-robber").solve([2, 7, 9, 3, 1])).toBe(12);
    expect(get("house-robber").solve([2, 1, 1, 9])).toBe(11);
    expect(get("house-robber-ii").solve([2, 3, 2])).toBe(3);
    expect(get("house-robber-ii").solve([1, 2, 3, 1])).toBe(4);
    expect(get("house-robber-ii").solve([5, 1, 2, 6])).toBe(7);
    expect(get("longest-palindrome").solve("babad")).toBe('"bab"');
    expect(get("longest-palindrome").solve("forgeeksskeegfor")).toBe('"geeksskeeg"');
    expect(get("palindromic-substrings").solve("aaa")).toBe(6);
    expect(get("palindromic-substrings").solve("abba")).toBe(6);
    expect(get("decode-ways").solve("226")).toBe(3);
    expect(get("decode-ways").solve("11106")).toBe(2);
    expect(get("decode-ways").solve("06")).toBe(0);
    expect(get("coin-change").solve({ coins: [1, 2, 5], amount: 11 })).toBe(3);
    expect(get("coin-change").solve({ coins: [1, 3, 4], amount: 6 })).toBe(2);
    expect(get("coin-change").solve({ coins: [2], amount: 3 })).toBe(-1);
    expect(get("max-product").solve([2, 3, -2, 4])).toBe(6);
    expect(get("max-product").solve([-2, 3, -4])).toBe(24);
    expect(get("max-product").solve([-2, 0, -1])).toBe(0);
    expect(get("word-break").solve({ s: "catsandog", words: ["cats", "dog", "sand", "and", "cat"] })).toBe(false);
    expect(get("lis").solve([10, 9, 2, 5, 3, 7, 101, 18])).toBe(4);
    expect(get("lis").solve([0, 1, 0, 3, 2, 3])).toBe(4);
    expect(get("partition-subset").solve([1, 5, 11, 5])).toBe(true);
    expect(get("partition-subset").solve([1, 2, 3, 5])).toBe(false);
  });
});

describe("the animations", () => {
  it("the answer shown matches the slow solution", () => {
    for (const p of DP1) for (const input of inputs(p.id)) expect(p.run(input).at(-1)!.answer, `${p.title}: ${p.describe(input)}`).toBe(String(p.solve(input)));
  });
  it("every number an explanation quotes as “= x” is the value then shown in the table", () => {
    // Climbing Stairs: "ways(i) = … = x" must equal the filled cell.
    for (const n of inputs("climbing-stairs"))
      for (const st of get("climbing-stairs").run(n)) {
        const m = st.explanation.match(/^ways\((\d+)\) = .* = (\d+)\.$/);
        if (m) expect(st.rows[0].cells[Number(m[1])].v).toBe(m[2]);
      }
  });
  it("random inputs cover both answers for the yes/no problems", () => {
    for (const id of ["word-break", "partition-subset"]) expect(new Set(inputs(id).map((i) => get(id).solve(i))), id).toEqual(new Set([true, false]));
  });
});
