// Checks every problem on every Interview Patterns page the same way.

import { describe, expect, it } from "vitest";

import { ARRAYS_HASHING } from "./arraysHashing";
import { SLIDING_WINDOW } from "./slidingWindow";
import { STACK } from "./stack";
import { TWO_POINTERS } from "./twoPointers";
import type { AnyProblem } from "./types";

const ALL: [string, AnyProblem][] = [...ARRAYS_HASHING, ...TWO_POINTERS, ...SLIDING_WINDOW, ...STACK].map((p) => [p.title, p]);
const canon = (p: AnyProblem, a: unknown) => JSON.stringify(p.canon ? p.canon(a) : a);

describe.each(ALL)("%s", (_t, p) => {
  const inputs = [...p.examples.map((e) => e.input), ...Array.from({ length: 300 }, (_, s) => p.random(s + 1))];

  it("the optimal solution agrees with brute force on the examples and 300 random inputs", () => {
    if (!p.brute) return;
    for (const input of inputs) expect(canon(p, p.solve(input)), p.describe(input)).toBe(canon(p, p.brute(input).answer));
  });

  it("the animation ends with a done step and an answer, and every step maps to a guide stage", () => {
    const stages = new Set(p.guide.stages.map((s) => s.id));
    for (const input of inputs) {
      const steps = p.run(input);
      const last = steps[steps.length - 1];
      expect(last.done, p.describe(input)).toBe(true);
      expect(last.answer).toBeTruthy();
      for (const s of steps) {
        expect(s.explanation.length).toBeGreaterThan(0);
        expect(stages, `${p.describe(input)}: stage ${s.stage}`).toContain(s.stage);
      }
    }
  });

  it("the answer the animation shows is the right one", () => {
    for (const input of inputs) {
      const shown = p.run(input).at(-1)!.answer!;
      const want = p.solve(input);
      if (typeof want === "boolean" || typeof want === "number") expect(shown, p.describe(input)).toBe(String(want));
    }
  });

  it("every guide stage is reached by some example or random input", () => {
    const reached = new Set(inputs.flatMap((i) => p.run(i).map((s) => s.stage)));
    for (const s of p.guide.stages) expect(reached, s.id).toContain(s.id);
  });

  it("every example starts on the guide's first stage", () => {
    for (const e of p.examples) expect(p.run(e.input)[0].stage).toBe(p.guide.stages[0].id);
  });

  it("at scale, the pattern does well under half the brute-force work", () => {
    if (!p.big || !p.brute) return;
    const input = p.big.input();
    const brute = p.brute(input);
    expect(canon(p, p.solve(input))).toBe(canon(p, brute.answer));
    expect(p.run(input).at(-1)!.ops * 2).toBeLessThan(brute.ops);
  });

  it("links and metadata are filled in", () => {
    expect(p.slug).toMatch(/^[a-z0-9-]+$/);
    expect(p.video).toMatch(/^[\w-]{11}$/);
    expect(p.guide.python).toMatch(/^(def|class) /m);
  });
});
