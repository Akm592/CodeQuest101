import { describe, expect, it } from "vitest";

import { GREEDY } from "./index";

const get = (id: string) => GREEDY.find((p) => p.id === id)!;
const inputs = (id: string) => [...get(id).examples.map((e) => e.input), ...Array.from({ length: 300 }, (_, s) => get(id).random(s + 1))];

describe("worked examples match the known answers", () => {
  it("each problem", () => {
    expect(get("max-subarray").solve([-2, 1, -3, 4, -1, 2, 1, -5, 4])).toBe(6);
    expect(get("max-subarray").solve([-3, -1, -2])).toBe(-1);
    expect(get("jump-game").solve([2, 3, 1, 1, 4])).toBe(true);
    expect(get("jump-game").solve([3, 2, 1, 0, 4])).toBe(false);
    expect(get("jump-game-ii").solve([2, 3, 1, 1, 4])).toBe(2);
    expect(get("jump-game-ii").solve([1, 1, 1, 1])).toBe(3);
    expect(get("gas-station").solve({ gas: [1, 2, 3, 4, 5], cost: [3, 4, 5, 1, 2] })).toBe(3);
    expect(get("gas-station").solve({ gas: [2, 3, 4], cost: [3, 4, 3] })).toBe(-1);
    expect(get("gas-station").solve({ gas: [4, 1, 2], cost: [2, 2, 2] })).toBe(0);
    expect(get("hand-of-straights").solve({ hand: [1, 2, 3, 6, 2, 3, 4, 7, 8], size: 3 })).toBe(true);
    expect(get("hand-of-straights").solve({ hand: [1, 1, 2, 3, 3, 4], size: 3 })).toBe(false);
    expect(get("merge-triplets").solve({ triplets: [[2, 5, 3], [1, 8, 4], [1, 7, 5]], target: [2, 7, 5] })).toBe(true);
    expect(get("merge-triplets").solve({ triplets: [[3, 4, 5], [4, 5, 6]], target: [3, 2, 5] })).toBe(false);
    expect(get("partition-labels").solve("ababcbacadefegdehijhklij")).toBe("[9, 7, 8]");
    expect(get("partition-labels").solve("eccbbbbdec")).toBe("[10]");
    expect(get("valid-parenthesis-string").solve("(*))")).toBe(true);
    expect(get("valid-parenthesis-string").solve("(((*)")).toBe(false);
  });
});

describe("the animations", () => {
  it("the answer shown matches the slow solution", () => {
    for (const p of GREEDY) for (const input of inputs(p.id)) expect(p.run(input).at(-1)!.answer, `${p.title}: ${p.describe(input)}`).toBe(String(p.solve(input)));
  });
  it("random inputs cover both answers for the yes/no problems", () => {
    for (const id of ["jump-game", "hand-of-straights", "merge-triplets", "valid-parenthesis-string"]) expect(new Set(inputs(id).map((i) => get(id).solve(i))), id).toEqual(new Set([true, false]));
    expect(new Set(inputs("gas-station").map((i) => get("gas-station").solve(i) === -1))).toEqual(new Set([true, false]));
  });
});
