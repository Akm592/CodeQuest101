// Time Based Key-Value Store (NeetCode 150 · Binary Search).

import py from "../../guides/python/neetcode/time_map.py?raw";
import { row, rngFor } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { rangeRow } from "./range";

/** Calls like "set foo bar 1" and "get foo 3". */
type Input = string[];
const shownVal = (v: string) => (v === "" ? '""' : v);

function run(calls: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const store = new Map<string, [number, string][]>();
  const out: string[] = [];
  let ops = 0;
  const callRow = (k: number) => row("calls", calls.map((c) => {
    const [op, key, a, b] = c.split(" ");
    return op === "set" ? `set ${key}=${a} @${b}` : `get ${key} @${a}`;
  }), Object.fromEntries(calls.map((_, j) => [j, j < k ? "idle" : j === k ? "current" : undefined])));
  const snap = (stage: string, k: number, explanation: string, listRow: PatternStep["rows"][number] | null, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [callRow(k), ...(listRow ? [listRow] : [])],
      map: { title: "store: key → versions (time:value)", entries: [...store].map(([key, vs]) => ({ k: key, v: vs.map(([t, v]) => `${t}:${v}`).join(", ") })) },
      vars: [{ name: "get results so far", value: out.length ? out.map(shownVal).join(", ") : "–", tone: "found" }],
      ops,
      ...extra,
    });
  snap("start", -1, "Every set adds a version (time, value) to that key's list. Set times only go up, so each list is already sorted by time, and get can binary search it for the latest time ≤ the one asked for.", null);
  calls.forEach((call, k) => {
    const [op, key, a, b] = call.split(" ");
    if (op === "set") {
      const list = store.get(key) ?? [];
      list.push([Number(b), a]);
      store.set(key, list);
      ops++;
      snap("set", k, `set: append (${b}, ${a}) to “${key}”. It's the newest, so the list stays sorted by time.`, row(`versions of “${key}”`, list.map(([t, v]) => `${t}:${v}`), { [list.length - 1]: "pointer" }));
      return;
    }
    const t = Number(a);
    const list = store.get(key) ?? [];
    const cells = list.map(([tt, v]) => `${tt}:${v}`);
    let l = 0;
    let r = list.length - 1;
    let res = "";
    let resAt = -1;
    while (l <= r) {
      const m = (l + r) >> 1;
      ops++;
      if (list[m][0] <= t) {
        snap("probe", k, `get “${key}” at ${t}: version ${list[m][0]}:${list[m][1]} is at or before ${t}, so “${list[m][1]}” is a candidate. A later one might also fit: look right.`, rangeRow(`versions of “${key}”`, cells, l, r, m, resAt >= 0 ? { [resAt]: "found" } : {}));
        res = list[m][1];
        resAt = m;
        l = m + 1;
      } else {
        snap("probe", k, `get “${key}” at ${t}: version ${list[m][0]}:${list[m][1]} is after ${t}, too late. Look left.`, rangeRow(`versions of “${key}”`, cells, l, r, m, resAt >= 0 ? { [resAt]: "found" } : {}));
        r = m - 1;
      }
    }
    out.push(res);
    snap("answer", k, list.length === 0 ? `get “${key}” at ${t}: the key was never set, so return "".` : res === "" ? `get “${key}” at ${t}: every version is after ${t}, so return "".` : `get “${key}” at ${t} returns “${res}”, the latest version at or before ${t}.`, list.length ? row(`versions of “${key}”`, cells, resAt >= 0 ? { [resAt]: "found" } : {}) : null);
  });
  snap("done", calls.length, `All calls done. The gets returned ${out.map(shownVal).join(", ") || "nothing"}.`, null, { done: true, answer: `[${out.map(shownVal).join(", ")}]` });
  return steps;
}

function slow(calls: Input) {
  const store = new Map<string, [number, string][]>();
  const out: string[] = [];
  let ops = 0;
  for (const call of calls) {
    const [op, key, a, b] = call.split(" ");
    ops++;
    if (op === "set") store.set(key, [...(store.get(key) ?? []), [Number(b), a]]);
    else {
      let res = "";
      for (const [t, v] of store.get(key) ?? []) {
        ops++;
        if (t <= Number(a)) res = v;
      }
      out.push(res);
    }
  }
  return { answer: `[${out.map(shownVal).join(", ")}]`, ops };
}

export const timeMap: PatternProblem<Input> = {
  id: "time-map",
  title: "Time Based Key-Value Store",
  difficulty: "Medium",
  blind75: false,
  slug: "time-based-key-value-store",
  video: "fu2cD_6E8Hw",
  statement: "Design a store where set(key, value, time) saves a version, and get(key, time) returns the value from the latest set at or before that time (or \"\" if none). Times passed to set only increase.",
  examples: [
    { label: "LeetCode's example", input: ["set foo bar 1", "get foo 1", "get foo 3", "set foo bar2 4", "get foo 4", "get foo 5"] },
    { label: "two keys", input: ["set a red 1", "set b one 2", "set a green 4", "set a blue 7", "set b two 8", "get a 5", "get a 0", "get b 9", "get c 3"] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const calls: string[] = [];
    let t = 0;
    for (let i = 0; i < g.int(5, 9); i++) {
      if (i < 2 || g.r() < 0.5) calls.push(`set ${g.pick(["a", "b"])} ${g.pick(["red", "blue", "gold", "jade"])} ${(t += g.int(1, 3))}`);
      else calls.push(`get ${g.pick(["a", "a", "b", "c"])} ${g.int(0, t + 1)}`);
    }
    return calls;
  },
  big: { label: "150 versions, then 50 gets", input: () => [...Array.from({ length: 150 }, (_, i) => `set k v${i} ${i + 1}`), ...Array.from({ length: 50 }, (_, i) => `get k ${(i * 37) % 160}`)] },
  describe: (calls) => calls.join(", "),
  run,
  solve: (calls) => slow(calls).answer,
  brute: slow,
  bruteIdea: "get could scan the whole version list for the latest time ≤ t: O(n) per get. The list is sorted by time, so binary search makes it O(log n).",
  guide: {
    title: "Time Based Key-Value Store",
    idea: [
      "Store, for each key, a list of (time, value). Because set times only increase, appending keeps the list sorted by time for free.",
      "get(key, t) wants the last version with time ≤ t. Binary search: if the middle version's time ≤ t, it's a candidate, so remember it and look right for a later one; otherwise look left. When L passes R, the last candidate is the answer.",
    ],
    whenToUse: ["“The latest record at or before time t”, “the largest value ≤ x”: binary search that remembers the last match.", "Python's bisect_right(times, t) − 1 does the same thing."],
    stages: [
      { id: "start", title: "Empty store", detail: "key → list of (time, value).", pseudo: "self.store = {}" },
      { id: "set", title: "set → append", detail: "Times increase, so the list stays sorted.", pseudo: "store[key].append((time, value))" },
      { id: "probe", title: "get: binary search the versions", detail: "time ≤ t → candidate, go right; else go left.", pseudo: "if values[m][0] <= t: res = values[m][1]; l = m + 1 else: r = m - 1" },
      { id: "answer", title: "get returns the last candidate", detail: "Or \"\" if there was none.", pseudo: "return res" },
      { id: "done", title: "All calls answered", detail: "", pseudo: "" },
    ],
    legend: [
      { tone: "current", label: "Current call" },
      { tone: "compare", label: "Version being checked" },
      { tone: "found", label: "Best candidate" },
      { tone: "idle", label: "Ruled out / done" },
    ],
    complexity: { time: "O(1) set, O(log n) get", space: "O(n)", why: "Appending is O(1); each get halves that key's version list each step." },
    pitfalls: [
      "A key that was never set, or a time before its first version, must return \"\", not crash.",
      "Don't stop at the first version with time ≤ t: a later one might also qualify, so keep searching right.",
    ],
    tryThis: ["Pick “two keys”: get a at 5 must return green (set at 4), not blue (set at 7).", "Press “Random” and predict each get."],
    python: py,
  },
};
