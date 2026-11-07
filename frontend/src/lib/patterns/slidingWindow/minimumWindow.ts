// Minimum Window Substring (NeetCode 150 · Sliding Window).

import py from "../../guides/python/neetcode/minimum_window.py?raw";
import { quote, rngFor } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { windowRow } from "./window";

type Input = { s: string; t: string };

function run({ s, t }: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const need = new Map<string, number>();
  for (const c of t) need.set(c, (need.get(c) ?? 0) + 1);
  const win = new Map<string, number>();
  let have = 0;
  const required = need.size;
  let l = 0;
  let best: [number, number] | null = null;
  let ops = t.length;
  const bestStr = () => (best ? s.slice(best[0], best[1] + 1) : "");
  const snap = (stage: string, r: number, explanation: string, over: Record<number, "swap" | "found" | undefined> = {}, extra: Partial<PatternStep> = {}) => {
    const done = stage === "done";
    steps.push({
      stage,
      explanation,
      rows: [
        done && best
          ? windowRow("s", [...s], best[0], best[1], Object.fromEntries([...s].map((_, i) => [i, i >= best![0] && i <= best![1] ? "found" : undefined])))
          : windowRow("s", [...s], done ? s.length : l, done ? s.length - 1 : r, over),
      ],
      map: {
        title: "Needed from t: in window / need",
        entries: [...need.entries()].sort().map(([c, n]) => {
          // On the last step, show the counts for the answer window.
          const got = done && best ? [...bestStr()].filter((d) => d === c).length : (win.get(c) ?? 0);
          return { k: c, v: `${got} / ${n}`, tone: got >= n ? "found" : "swap" };
        }),
      },
      vars: [
        ...(done ? [] : [{ name: "letters covered", value: `${have} / ${required}`, tone: have === required ? ("found" as const) : ("pointer" as const) }]),
        { name: "best", value: best ? quote(bestStr()) : "none yet", tone: "found" },
      ],
      ops,
      ...extra,
    });
  };
  snap("start", -1, `We need a window of s containing ${t.length === 1 ? "the letter" : "all the letters of"} “${t}”${new Set(t).size < t.length ? " (repeats count)" : ""}. Expand with R until it's covered, then shrink with L while it stays covered.`);
  for (let r = 0; r < s.length; r++) {
    const c = s[r];
    win.set(c, (win.get(c) ?? 0) + 1);
    ops++;
    const justMet = need.has(c) && win.get(c) === need.get(c);
    if (justMet) have++;
    if (have < required) {
      snap("expand", r, need.has(c) ? `Add “${c}”: ${justMet ? `that's enough “${c}” now` : `still need ${need.get(c)! - win.get(c)!} more “${c}”`}. ${required - have} letter${required - have === 1 ? "" : "s"} of t still missing.` : `Add “${c}”. It isn't in t, so nothing changes; keep expanding.`);
      continue;
    }
    let first = true;
    while (have === required) {
      ops++;
      const len = r - l + 1;
      const improved = !best || len < best[1] - best[0] + 1;
      if (improved) best = [l, r];
      const out = s[l];
      const breaks = need.has(out) && win.get(out) === need.get(out);
      snap("shrink", r, `${first ? `Add “${c}”: now ` : ""}“${s.slice(l, r + 1)}” covers t (length ${len}).${improved ? " New shortest!" : ""} Try dropping “${out}” from the left${breaks ? `: that loses a needed “${out}”, so after this the window stops covering t.` : need.has(out) ? `: there's a spare “${out}”, so the window still covers t.` : `: it isn't in t, so the window still covers t.`}`, { [l]: "swap" });
      win.set(out, win.get(out)! - 1);
      if (breaks) have--;
      l++;
      first = false;
    }
  }
  snap("done", s.length - 1, best ? `R reached the end. The shortest window that covers “${t}” is “${bestStr()}”.` : `R reached the end and no window ever covered “${t}”, so the answer is the empty string.`, {}, { done: true, answer: best ? quote(bestStr()) : '""' });
  return steps;
}

export function minWindowSolve({ s, t }: Input): string {
  let best = "";
  const covers = (w: string) => {
    const left = [...w];
    for (const c of t) {
      const i = left.indexOf(c);
      if (i < 0) return false;
      left.splice(i, 1);
    }
    return true;
  };
  for (let i = 0; i < s.length; i++)
    for (let j = i; j < s.length; j++) {
      const w = s.slice(i, j + 1);
      if (covers(w) && (!best || w.length < best.length)) best = w;
    }
  return best;
}

export const minimumWindow: PatternProblem<Input> = {
  id: "minimum-window",
  title: "Minimum Window Substring",
  difficulty: "Hard",
  blind75: true,
  slug: "minimum-window-substring",
  video: "jSto0O4AJbM",
  statement: "Given strings s and t, return the shortest substring of s that contains every character of t, including repeats. Return \"\" if there isn't one.",
  examples: [
    { label: "ADOBECODEBANC / ABC", input: { s: "ADOBECODEBANC", t: "ABC" } },
    { label: "a / aa", input: { s: "a", t: "aa" } },
    { label: "cabwefgewcwaefgcf / cae", input: { s: "cabwefgewcwaefgcf", t: "cae" } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const s = Array.from({ length: g.int(5, 12) }, () => g.pick([..."abcx"])).join("");
    const t = Array.from({ length: g.int(1, 3) }, () => g.pick([..."abc"])).join("");
    return { s, t };
  },
  big: { label: "s of 200, t = abc", input: () => ({ s: Array.from({ length: 200 }, (_, i) => (i % 37 === 0 ? "abc"[(i / 37) % 3] : "x")).join(""), t: "abc" }) },
  describe: ({ s, t }) => `s = ${quote(s)}, t = ${quote(t)}`,
  run,
  solve: minWindowSolve,
  brute: ({ s, t }) => {
    let ops = 0;
    let best = "";
    const need = new Map<string, number>();
    for (const c of t) need.set(c, (need.get(c) ?? 0) + 1);
    for (let i = 0; i < s.length; i++) {
      const win = new Map<string, number>();
      let have = 0;
      for (let j = i; j < s.length; j++) {
        ops++;
        win.set(s[j], (win.get(s[j]) ?? 0) + 1);
        if (need.has(s[j]) && win.get(s[j]) === need.get(s[j])) have++;
        if (have === need.size) {
          if (!best || j - i + 1 < best.length) best = s.slice(i, j + 1);
          break;
        }
      }
    }
    return { answer: best, ops };
  },
  bruteIdea: "From every start, extend to the right until the window covers t. Each start re-reads most of the same characters again.",
  guide: {
    title: "Minimum Window Substring",
    idea: [
      "Count what t needs. Grow the window with R until it covers t: every needed letter appears at least as many times as in t. Track that with one number, how many distinct letters are covered, so the check is O(1).",
      "Once it covers t, shrink with L while it still does, recording the shortest. When dropping a letter breaks the cover, go back to growing. L and R each pass over s once: O(n).",
    ],
    whenToUse: ["“Shortest substring / subarray that contains / satisfies …”: grow until valid, then shrink while valid.", "This grow-then-shrink loop is the general template; the other problems on this page are special cases of it."],
    stages: [
      { id: "start", title: "Count what t needs", detail: "need[c] for each letter of t; nothing covered yet.", pseudo: "need = Counter(t); have = 0" },
      { id: "expand", title: "Not covered → grow with R", detail: "Add s[R]; if its count reaches what t needs, one more letter is covered.", pseudo: "window[c] += 1; if window[c] == need[c]: have += 1" },
      { id: "shrink", title: "Covered → record, then drop s[L]", detail: "Keep the shortest window; dropping a needed letter may break the cover.", pseudo: "while have == len(need): best = min(...); drop s[l]" },
      { id: "done", title: "R reached the end → shortest window", detail: "Or \"\" if nothing ever covered t.", pseudo: "return s[best_l : best_r + 1]" },
    ],
    legend: [
      { tone: "current", label: "Window ends L and R" },
      { tone: "pointer", label: "Inside the window" },
      { tone: "swap", label: "About to drop / still missing" },
      { tone: "found", label: "Covered / shortest window" },
    ],
    complexity: { time: "O(|s| + |t|)", space: "O(k)", why: "Each character of s enters and leaves the window at most once; the maps hold at most k distinct letters." },
    pitfalls: [
      "Repeats in t count: for t = “aa”, a window with one “a” doesn't cover it.",
      "Only bump “have” when a count reaches exactly what t needs, and only drop it when it falls below, or extra copies get counted twice.",
    ],
    tryThis: ["Pick “ADOBECODEBANC / ABC” and watch the window crawl from “ADOBEC” to “BANC”.", "Pick “a / aa”: the window never covers t."],
    python: py,
  },
};
