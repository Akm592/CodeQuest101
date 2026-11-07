import { describe, expect, it } from "vitest";

import { rpnSolve } from "./evalRpn";
import { STACK } from "./index";

const get = (id: string) => STACK.find((p) => p.id === id)!;
const inputs = (id: string) => [...get(id).examples.map((e) => e.input), ...Array.from({ length: 300 }, (_, s) => get(id).random(s + 1))];

describe("worked examples match the known answers", () => {
  it("each problem", () => {
    expect(get("valid-parentheses").solve("()[]{}")).toBe(true);
    expect(get("valid-parentheses").solve("([)]")).toBe(false);
    expect(get("min-stack").solve(["push -2", "push 0", "push -3", "getMin", "pop", "top", "getMin"])).toBe("[-3, 0, -2]");
    expect(rpnSolve(["2", "1", "+", "3", "*"])).toBe(9);
    expect(rpnSolve(["4", "13", "5", "/", "+"])).toBe(6);
    expect(rpnSolve(["10", "6", "9", "3", "+", "-11", "*", "/", "*", "17", "+", "5", "+"])).toBe(22);
    expect(get("daily-temperatures").solve([73, 74, 75, 71, 69, 72, 76, 73])).toEqual([1, 1, 4, 2, 1, 1, 0, 0]);
    expect(get("car-fleet").solve({ target: 12, position: [10, 8, 0, 5, 3], speed: [2, 4, 1, 1, 3] })).toBe(3);
    expect(get("car-fleet").solve({ target: 100, position: [0, 2, 4], speed: [4, 2, 1] })).toBe(1);
    expect(get("largest-rectangle").solve([2, 1, 5, 6, 2, 3])).toBe(10);
    expect(get("largest-rectangle").solve([2, 4])).toBe(4);
  });
  it("Generate Parentheses finds the Catalan numbers 1, 2, 5, 14, 42, 132", () => {
    [1, 2, 5, 14, 42, 132].forEach((c, i) => expect((get("generate-parentheses").solve(i + 1) as string[]).length).toBe(c));
  });
});

describe("the animations' list answers match the slow solutions", () => {
  for (const id of ["min-stack", "daily-temperatures", "generate-parentheses"])
    it(id, () => {
      const p = get(id);
      for (const input of inputs(id)) {
        const want = p.solve(input);
        const shown = p.run(input).at(-1)!.answer;
        expect(shown, p.describe(input)).toBe(typeof want === "string" ? want : `[${(want as unknown[]).join(", ")}]`);
      }
    });
  it("Valid Parentheses random inputs give both answers", () => {
    expect(new Set(inputs("valid-parentheses").map((s) => get("valid-parentheses").solve(s)))).toEqual(new Set([true, false]));
  });
  it("Largest Rectangle's final rectangle fits under the bars and has the shown area", () => {
    const p = get("largest-rectangle");
    for (const h of inputs("largest-rectangle")) {
      const { rect } = p.run(h).at(-1)!.bars!;
      for (let i = rect!.l; i <= rect!.r; i++) expect(h[i]).toBeGreaterThanOrEqual(rect!.h);
      expect(String(rect!.h * (rect!.r - rect!.l + 1))).toBe(p.run(h).at(-1)!.answer);
    }
  });
});
