import { describe, expect, it } from "vitest";

import { replacementSolve } from "./characterReplacement";
import { SLIDING_WINDOW } from "./index";
import { minWindowSolve } from "./minimumWindow";

const get = (id: string) => SLIDING_WINDOW.find((p) => p.id === id)!;

describe("worked examples match the known answers", () => {
  it("each problem", () => {
    expect(get("best-time-stock").solve([7, 1, 5, 3, 6, 4])).toBe(5);
    expect(get("best-time-stock").solve([7, 6, 4, 3, 1])).toBe(0);
    expect(get("longest-substring").solve("abcabcbb")).toBe(3);
    expect(get("longest-substring").solve("bbbbb")).toBe(1);
    expect(get("longest-substring").solve("pwwkew")).toBe(3);
    expect(replacementSolve({ s: "ABAB", k: 2 })).toBe(4);
    expect(replacementSolve({ s: "AABABBA", k: 1 })).toBe(4);
    expect(get("permutation-in-string").solve({ s1: "ab", s2: "eidbaooo" })).toBe(true);
    expect(get("permutation-in-string").solve({ s1: "ab", s2: "eidboaoo" })).toBe(false);
    expect(minWindowSolve({ s: "ADOBECODEBANC", t: "ABC" })).toBe("BANC");
    expect(minWindowSolve({ s: "a", t: "aa" })).toBe("");
    expect(get("sliding-window-max").solve({ nums: [1, 3, -1, -3, 5, 3, 6, 7], k: 3 })).toEqual([3, 3, 5, 5, 6, 7]);
  });
});

describe("the animations' answers", () => {
  it("Minimum Window shows the same window as the slow search, in quotes", () => {
    const p = get("minimum-window");
    for (const input of [...p.examples.map((e) => e.input), ...Array.from({ length: 300 }, (_, s) => p.random(s + 1))])
      expect(p.run(input).at(-1)!.answer, p.describe(input)).toBe(JSON.stringify(minWindowSolve(input)));
  });
  it("Sliding Window Maximum shows the list of maxima", () => {
    const p = get("sliding-window-max");
    for (let s = 1; s <= 300; s++) {
      const input = p.random(s);
      expect(p.run(input).at(-1)!.answer).toBe(`[${(p.solve(input) as number[]).join(", ")}]`);
    }
  });
  it("the deque in Sliding Window Maximum is always decreasing and never longer than k", () => {
    const p = get("sliding-window-max");
    for (let s = 1; s <= 200; s++) {
      const input = p.random(s);
      for (const step of p.run(input)) {
        const dq = step.rows[1].cells.map((c) => Number(c.v));
        expect(dq.length).toBeLessThanOrEqual(input.k + 1);
        for (let i = 1; i < dq.length; i++) expect(dq[i]).toBeLessThanOrEqual(dq[i - 1]);
      }
    }
  });
  it("Permutation in String's random inputs give both answers", () => {
    const p = get("permutation-in-string");
    const answers = new Set(Array.from({ length: 100 }, (_, s) => p.solve(p.random(s + 1))));
    expect(answers).toEqual(new Set([true, false]));
  });
  it("Character Replacement's explanations quote the real counts of the window they name", () => {
    const p = get("character-replacement");
    for (let seed = 1; seed <= 300; seed++) {
      for (const st of p.run(p.random(seed))) {
        const m = st.explanation.match(/[wW]indow “([A-Z]+)”[^.]*?(?:appears (\d+) times|need (\d+) changes|is really (\d+))/);
        if (!m) continue;
        const w = m[1];
        const top = Math.max(...[...new Set(w)].map((c) => [...w].filter((d) => d === c).length));
        if (m[2]) expect(Number(m[2]), st.explanation).toBe(top);
        if (m[3]) expect(Number(m[3]), st.explanation).toBe(w.length - top);
        if (m[4]) expect(Number(m[4]), st.explanation).toBe(top);
      }
    }
  });
});
