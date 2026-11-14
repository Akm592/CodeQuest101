// The Intervals problems of the NeetCode 150: Insert Interval, Merge
// Intervals, Non-overlapping Intervals, Meeting Rooms, Meeting Rooms II and
// Minimum Interval to Include Each Query. All drawn on the timeline view.

import insertPy from "../../guides/python/neetcode/insert_interval.py?raw";
import mergePy from "../../guides/python/neetcode/merge_intervals.py?raw";
import queryPy from "../../guides/python/neetcode/min_interval_query.py?raw";
import nonOverlapPy from "../../guides/python/neetcode/non_overlapping.py?raw";
import rooms2Py from "../../guides/python/neetcode/meeting_rooms_ii.py?raw";
import roomsPy from "../../guides/python/neetcode/meeting_rooms.py?raw";
import type { VizTone } from "../../guides/types";
import { row, rngFor, show } from "../helpers";
import { Heap } from "../heap/heap";
import type { PatternProblem, PatternStep } from "../types";

type Iv = [number, number];
const showIv = (ivs: Iv[]) => `[${ivs.map(([a, b]) => `[${a},${b}]`).join(", ")}]`;
const ivText = ([a, b]: Iv) => `[${a},${b}]`;
const sortLog = (n: number) => Math.ceil(n * Math.log2(Math.max(2, n)));

/** Random intervals with small integer ends. */
function randomIvs(g: ReturnType<typeof rngFor>, lo: number, hi: number, maxLen = 4): Iv[] {
  return Array.from({ length: g.int(lo, hi) }, () => {
    const a = g.int(0, 10);
    return [a, a + g.int(1, maxLen)] as Iv;
  });
}

type Bar = NonNullable<PatternStep["timeline"]>["bars"][number];

// ---------------------------------------------------------------- Insert interval

type Insert = { intervals: Iv[]; add: Iv };

function insertRun({ intervals, add }: Insert): PatternStep[] {
  const steps: PatternStep[] = [];
  const n = intervals.length;
  const res: Iv[] = [];
  let cur: Iv = [...add];
  let at = -1;
  let ops = 0;
  const state: (VizTone | undefined)[] = Array(n).fill(undefined);
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) => {
    const bars: Bar[] = [
      ...intervals.map(([a, b], i): Bar => ({ lane: i, start: a, end: b, tone: i === at ? "current" : state[i], text: ivText([a, b]) })),
      { lane: n, start: cur[0], end: cur[1], tone: "compare", text: ivText(cur), dashed: extra.done ? false : true },
      ...res.map(([a, b]): Bar => ({ lane: n + 1, start: a, end: b, tone: "found", text: ivText([a, b]) })),
    ];
    steps.push({
      stage,
      explanation,
      rows: [],
      timeline: { title: "intervals (top), the one being inserted, and the result (bottom)", lanes: [...intervals.map((_, i) => `#${i}`), "new", "result"], bars },
      vars: [{ name: "new interval so far", value: ivText(cur), tone: "compare" }],
      ops,
      ...extra,
    });
  };
  snap("start", `The intervals are sorted and don't overlap. Walk through them: ones that end before the new interval starts go straight into the result; ones that overlap it are swallowed into it; the first one that starts after it ends means the new interval goes in, followed by everything left.`);
  for (let i = 0; i < n; i++) {
    ops++;
    at = i;
    const iv = intervals[i];
    if (cur[1] < iv[0]) {
      res.push(cur);
      for (let j = i; j < n; j++) {
        res.push(intervals[j]);
        state[j] = "found";
      }
      snap("after", `${ivText(iv)} starts after ${ivText(cur)} ends (${cur[1]} < ${iv[0]}). Add the new interval, then the rest unchanged.`);
      at = -1;
      snap("done", `Result: ${showIv(res)}.`, { done: true, answer: showIv(res) });
      return steps;
    }
    if (cur[0] > iv[1]) {
      res.push(iv);
      state[i] = "found";
      snap("before", `${ivText(iv)} ends before the new interval starts (${iv[1]} < ${cur[0]}): copy it into the result.`);
    } else {
      const was = cur;
      cur = [Math.min(cur[0], iv[0]), Math.max(cur[1], iv[1])];
      state[i] = "idle";
      snap("merge", `${ivText(iv)} overlaps ${ivText(was)}: swallow it. The new interval grows to ${ivText(cur)}.`);
    }
  }
  at = -1;
  res.push(cur);
  snap("done", `No interval starts after the new one, so it goes at the end. Result: ${showIv(res)}.`, { done: true, answer: showIv(res) });
  return steps;
}
function mergeAll(ivs: Iv[]): Iv[] {
  const s = [...ivs].sort((x, y) => x[0] - y[0]);
  const out: Iv[] = [];
  for (const [a, b] of s) {
    if (out.length && a <= out[out.length - 1][1]) out[out.length - 1][1] = Math.max(out[out.length - 1][1], b);
    else out.push([a, b]);
  }
  return out;
}
function randomSorted(g: ReturnType<typeof rngFor>): Iv[] {
  // Sorted, non-overlapping intervals.
  const out: Iv[] = [];
  let x = g.int(0, 2);
  for (let k = 0; k < g.int(0, 4); k++) {
    const len = g.int(0, 2);
    out.push([x, x + len]);
    x += len + g.int(1, 3);
  }
  return out;
}

export const insertInterval: PatternProblem<Insert> = {
  id: "insert-interval",
  title: "Insert Interval",
  difficulty: "Medium",
  blind75: true,
  slug: "insert-interval",
  video: "A8NUOmlwOlM",
  statement: "Given sorted, non-overlapping intervals and a new interval, insert it so the list stays sorted and non-overlapping (merging where needed).",
  examples: [
    { label: "LeetCode's example 2", input: { intervals: [[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]], add: [4, 8] } },
    { label: "LeetCode's example 1", input: { intervals: [[1, 3], [6, 9]], add: [2, 5] } },
    { label: "goes at the end", input: { intervals: [[1, 2], [3, 4]], add: [6, 7] } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const a = g.int(0, 10);
    return { intervals: randomSorted(g), add: [a, a + g.int(0, 4)] };
  },
  big: { label: "200 intervals", input: () => ({ intervals: Array.from({ length: 200 }, (_, i): Iv => [3 * i, 3 * i + 1]), add: [301, 305] }) },
  describe: ({ intervals, add }) => `intervals = ${showIv(intervals)}, newInterval = ${ivText(add)}`,
  run: insertRun,
  solve: ({ intervals, add }) => showIv(mergeAll([...intervals.map((iv): Iv => [...iv]), [...add]])),
  brute: ({ intervals, add }) => {
    const all = [...intervals.map((iv): Iv => [...iv]), [...add] as Iv];
    return { answer: showIv(mergeAll(all)), ops: 2 * sortLog(all.length) + all.length };
  },
  bruteIdea: "Append the new interval, sort everything again and merge: O(n log n), ignoring that the list was already sorted. (The sort is estimated as n·log₂n comparisons plus as many moves.)",
  guide: {
    title: "Insert Interval",
    idea: [
      "The list is already sorted, so one pass is enough. Each interval is either entirely before the new one (copy it), overlapping it (absorb it: the new interval's start becomes the smaller start, its end the larger end), or entirely after it.",
      "The first interval entirely after means the new interval is final: add it, then everything that's left, unchanged.",
    ],
    whenToUse: ["Sorted intervals and one change: a single pass with three cases (before, overlap, after).", "Two intervals overlap when each starts before the other ends."],
    stages: [
      { id: "start", title: "Walk the sorted intervals", detail: "", pseudo: "res = []" },
      { id: "before", title: "Ends before the new one starts → copy", detail: "", pseudo: "elif newInterval[0] > intervals[i][1]: res.append(intervals[i])" },
      { id: "merge", title: "Overlaps → absorb it", detail: "", pseudo: "else: newInterval = [min(...starts), max(...ends)]" },
      { id: "after", title: "Starts after it ends → add new, then the rest", detail: "", pseudo: "if newInterval[1] < intervals[i][0]: res.append(newInterval); return res + intervals[i:]" },
      { id: "done", title: "The result", detail: "", pseudo: "res.append(newInterval); return res" },
    ],
    legend: [
      { tone: "current", label: "Interval being compared" },
      { tone: "compare", label: "The new interval (growing)" },
      { tone: "found", label: "In the result" },
      { tone: "idle", label: "Absorbed" },
    ],
    complexity: { time: "O(n)", space: "O(n)", why: "One pass; the result has at most n + 1 intervals." },
    pitfalls: ["Touching intervals ([1,2] and [2,3]) overlap here.", "Don't forget to add the new interval when it belongs at the very end."],
    tryThis: ["Example 2: [4,8] swallows [3,5], [6,7] and [8,10], becoming [3,10].", "“Goes at the end”: nothing starts after [6,7]."],
    python: insertPy,
  },
};

// ---------------------------------------------------------------- Merge intervals

function mergeRun(input: Iv[]): PatternStep[] {
  const steps: PatternStep[] = [];
  const ivs = [...input].map((iv): Iv => [...iv]).sort((x, y) => x[0] - y[0]);
  const n = ivs.length;
  const out: Iv[] = [];
  let at = -1;
  let ops = sortLog(n);
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) => {
    const bars: Bar[] = [
      ...ivs.map(([a, b], i): Bar => ({ lane: i, start: a, end: b, tone: i === at ? "current" : i < at ? "idle" : undefined, text: ivText([a, b]) })),
      ...out.map(([a, b], k): Bar => ({ lane: n, start: a, end: b, tone: k === out.length - 1 && at >= 0 ? "compare" : "found", text: ivText([a, b]) })),
    ];
    steps.push({
      stage,
      explanation,
      rows: [],
      timeline: { title: "intervals sorted by start (top) and the merged result (bottom)", lanes: [...ivs.map((_, i) => `#${i}`), "merged"], bars },
      vars: [{ name: "merged so far", value: out.length ? showIv(out) : "–", tone: "found" }],
      ops,
      ...extra,
    });
  };
  snap("start", "Sort by start. Then an interval can only overlap the last merged one: if it starts before that one ends, stretch the end; otherwise start a new merged interval.");
  ivs.forEach((iv, i) => {
    ops++;
    at = i;
    const last = out[out.length - 1];
    if (last && iv[0] <= last[1]) {
      const before = last[1];
      last[1] = Math.max(last[1], iv[1]);
      snap("merge", `${ivText(iv)} starts at ${iv[0]}, before the last merged interval ends (${before}): merge. It becomes ${ivText(last)}.`);
    } else {
      out.push([...iv]);
      snap("new", last ? `${ivText(iv)} starts at ${iv[0]}, after ${ivText(last)} ends: no overlap, so it starts a new merged interval.` : `The first interval, ${ivText(iv)}, starts the result.`);
    }
  });
  at = -1;
  snap("done", `Merged: ${showIv(out)}.`, { done: true, answer: showIv(out) });
  return steps;
}
function mergeSlow(input: Iv[]) {
  // Keep merging any overlapping pair until none is left.
  const ivs = input.map((iv): Iv => [...iv]);
  let ops = 0;
  for (let changed = true; changed; ) {
    changed = false;
    outer: for (let i = 0; i < ivs.length; i++)
      for (let j = i + 1; j < ivs.length; j++) {
        ops++;
        if (ivs[i][0] <= ivs[j][1] && ivs[j][0] <= ivs[i][1]) {
          ivs[i] = [Math.min(ivs[i][0], ivs[j][0]), Math.max(ivs[i][1], ivs[j][1])];
          ivs.splice(j, 1);
          changed = true;
          break outer;
        }
      }
  }
  return { answer: showIv(ivs.sort((x, y) => x[0] - y[0])), ops };
}

export const mergeIntervals: PatternProblem<Iv[]> = {
  id: "merge-intervals",
  title: "Merge Intervals",
  difficulty: "Medium",
  blind75: true,
  slug: "merge-intervals",
  video: "44H3cEC2fFM",
  statement: "Merge all overlapping intervals and return the non-overlapping intervals that cover the same ground.",
  examples: [
    { label: "LeetCode's example 1", input: [[1, 3], [2, 6], [8, 10], [15, 18]] },
    { label: "unsorted, nested", input: [[4, 7], [1, 10], [12, 13], [2, 3]] },
    { label: "touching", input: [[1, 4], [4, 5]] },
  ],
  random: (seed) => randomIvs(rngFor(seed), 1, 6),
  big: { label: "120 intervals", input: () => Array.from({ length: 120 }, (_, i): Iv => [((i * 37) % 120) * 2, ((i * 37) % 120) * 2 + 3]) },
  describe: (ivs) => `intervals = ${showIv(ivs)}`,
  run: mergeRun,
  solve: (ivs) => mergeSlow(ivs).answer,
  brute: mergeSlow,
  bruteIdea: "Repeatedly look for any two overlapping intervals and merge them, rescanning every pair after each merge: O(n³).",
  guide: {
    title: "Merge Intervals",
    idea: [
      "After sorting by start, overlapping intervals sit next to each other: an interval can only overlap the last merged one (everything earlier ends sooner).",
      "So sweep once: if the next interval starts at or before the last merged end, extend that end (to the larger of the two); otherwise start a new merged interval.",
    ],
    whenToUse: ["Combining overlapping ranges (calendars, coverage): sort by start, sweep, compare with the last one.", "Most interval problems start by sorting."],
    stages: [
      { id: "start", title: "Sort by start", detail: "", pseudo: "intervals.sort(key=lambda i: i[0]); output = [intervals[0]]" },
      { id: "new", title: "No overlap → new interval", detail: "", pseudo: "else: output.append([start, end])" },
      { id: "merge", title: "Overlap → stretch the last end", detail: "", pseudo: "if start <= output[-1][1]: output[-1][1] = max(output[-1][1], end)" },
      { id: "done", title: "The merged list", detail: "", pseudo: "return output" },
    ],
    legend: [
      { tone: "current", label: "Interval being read" },
      { tone: "compare", label: "Last merged interval" },
      { tone: "found", label: "Merged result" },
      { tone: "idle", label: "Already read" },
    ],
    complexity: { time: "O(n log n)", space: "O(n)", why: "Sorting dominates; the sweep is O(n)." },
    pitfalls: ["Take max of the ends: a nested interval like [2,3] inside [1,10] mustn't shrink it.", "[1,4] and [4,5] touch, so they merge."],
    tryThis: ["“Unsorted, nested”: after sorting, [1,10] swallows [2,3] and [4,7].", "LeetCode's example 1 merges [1,3] and [2,6] into [1,6]."],
    python: mergePy,
  },
};

// ---------------------------------------------------------------- Non-overlapping intervals

function nonOverlapRun(input: Iv[]): PatternStep[] {
  const steps: PatternStep[] = [];
  const ivs = [...input].map((iv): Iv => [...iv]).sort((x, y) => x[0] - y[0]);
  const n = ivs.length;
  const removed = new Set<number>();
  let keptLast = -1;
  let at = -1;
  let prevEnd = -Infinity;
  let ops = sortLog(n);
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [],
      timeline: {
        title: "intervals sorted by start; red ones are removed",
        lanes: ivs.map((_, i) => `#${i}`),
        bars: ivs.map(([a, b], i): Bar => ({ lane: i, start: a, end: b, tone: removed.has(i) ? "swap" : i === at ? "current" : i === keptLast ? "compare" : i < at ? "found" : undefined, text: ivText([a, b]) })),
      },
      vars: [
        { name: "end of the last kept interval", value: prevEnd === -Infinity ? "–" : String(prevEnd) },
        { name: "removed", value: String(removed.size), tone: "swap" },
      ],
      ops,
      ...extra,
    });
  snap("start", "Sort by start and sweep, remembering where the last kept interval ends. When the next one overlaps it, one of the two must go: remove whichever ends later, because the one that ends sooner leaves more room for the rest.");
  ivs.forEach((iv, i) => {
    ops++;
    at = i;
    if (iv[0] >= prevEnd) {
      prevEnd = iv[1];
      keptLast = i;
      snap("keep", `${ivText(iv)} starts at ${iv[0]}, not before ${i === 0 ? "anything" : `the last kept end`}: no overlap. Keep it.`);
      return;
    }
    if (iv[1] < prevEnd) {
      removed.add(keptLast);
      const old = ivs[keptLast];
      keptLast = i;
      prevEnd = iv[1];
      snap("remove", `${ivText(iv)} overlaps ${ivText(old)}. It ends sooner (${iv[1]} < ${old[1]}), so remove ${ivText(old)} and keep this one.`);
    } else {
      removed.add(i);
      snap("remove", `${ivText(iv)} overlaps ${ivText(ivs[keptLast])}, which ends sooner (${prevEnd} ≤ ${iv[1]}). Remove ${ivText(iv)}.`);
    }
  });
  at = -1;
  snap("done", `Removing ${removed.size} interval${removed.size === 1 ? "" : "s"} leaves no overlaps; that's the fewest possible.`, { done: true, answer: String(removed.size) });
  return steps;
}
function nonOverlapSlow(ivs: Iv[]) {
  // Try every subset; keep the largest one with no overlaps.
  const n = ivs.length;
  let best = 0;
  let ops = 0;
  for (let m = 0; m < 1 << n; m++) {
    const pick = ivs.filter((_, i) => m & (1 << i)).sort((x, y) => x[0] - y[0]);
    ops += pick.length || 1;
    if (pick.every((iv, k) => k === 0 || iv[0] >= pick[k - 1][1])) best = Math.max(best, pick.length);
  }
  return { answer: n - best, ops };
}

export const nonOverlapping: PatternProblem<Iv[]> = {
  id: "non-overlapping",
  title: "Non-overlapping Intervals",
  difficulty: "Medium",
  blind75: true,
  slug: "non-overlapping-intervals",
  video: "nONCGxWoUfM",
  statement: "Return the fewest intervals to remove so that the rest don't overlap. (Intervals that only touch, like [1,2] and [2,3], don't overlap.)",
  examples: [
    { label: "LeetCode's example 1", input: [[1, 2], [2, 3], [3, 4], [1, 3]] },
    { label: "LeetCode's example 2", input: [[1, 2], [1, 2], [1, 2]] },
    { label: "one long interval", input: [[1, 10], [2, 3], [4, 5], [6, 7]] },
  ],
  random: (seed) => randomIvs(rngFor(seed), 1, 6),
  big: { label: "16 overlapping intervals", input: () => Array.from({ length: 16 }, (_, i): Iv => [i, i + 1 + (i % 3)]) },
  describe: (ivs) => `intervals = ${showIv(ivs)}`,
  run: nonOverlapRun,
  solve: (ivs) => nonOverlapSlow(ivs).answer,
  brute: nonOverlapSlow,
  bruteIdea: "Try every subset of intervals (2^n) and keep the largest one with no overlaps; the answer is n minus its size.",
  guide: {
    title: "Non-overlapping Intervals",
    idea: [
      "Sort by start and sweep, tracking the end of the last interval you kept. If the next one starts at or after that end, keep it. If it overlaps, one of the two has to go.",
      "Remove the one that ends later: keeping the earlier end leaves the most room for everything after it. Count the removals.",
    ],
    whenToUse: ["“Fewest removals” / “most non-overlapping”: keep the interval that ends earliest (activity selection).", "Equivalently, sort by end and keep greedily."],
    stages: [
      { id: "start", title: "Sort by start", detail: "", pseudo: "intervals.sort(); prev_end = intervals[0][1]" },
      { id: "keep", title: "No overlap → keep it", detail: "", pseudo: "if start >= prev_end: prev_end = end" },
      { id: "remove", title: "Overlap → remove the later-ending one", detail: "", pseudo: "else: res += 1; prev_end = min(end, prev_end)" },
      { id: "done", title: "Removals", detail: "", pseudo: "return res" },
    ],
    legend: [
      { tone: "current", label: "Interval being read" },
      { tone: "compare", label: "Last kept interval" },
      { tone: "swap", label: "Removed" },
      { tone: "found", label: "Kept" },
    ],
    complexity: { time: "O(n log n)", space: "O(1)", why: "Sorting, then one pass." },
    pitfalls: ["Touching intervals don't overlap: use ≥, not >.", "Remove the one that ends later, not the one you just met."],
    tryThis: ["“One long interval”: removing [1,10] alone frees the other three.", "LeetCode's example 2: keep one [1,2], remove two."],
    python: nonOverlapPy,
  },
};

// ---------------------------------------------------------------- Meeting rooms

function roomsRun(input: Iv[]): PatternStep[] {
  const steps: PatternStep[] = [];
  const ivs = [...input].map((iv): Iv => [...iv]).sort((x, y) => x[0] - y[0]);
  let at = -1;
  let clash = -1;
  let ops = sortLog(ivs.length);
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [],
      timeline: {
        title: "meetings sorted by start",
        lanes: ivs.map((_, i) => `#${i}`),
        bars: ivs.map(([a, b], i): Bar => ({ lane: i, start: a, end: b, tone: i === clash || (clash >= 0 && i === clash - 1) ? "swap" : i === at ? "current" : i === at - 1 ? "compare" : i < at ? "found" : undefined, text: ivText([a, b]) })),
      },
      vars: [],
      ops,
      ...extra,
    });
  snap("start", "One person can attend every meeting exactly when no two overlap. Sort by start: then it's enough to compare each meeting with the one just before it.");
  for (let i = 1; i < ivs.length; i++) {
    ops++;
    at = i;
    if (ivs[i][0] < ivs[i - 1][1]) {
      clash = i;
      snap("clash", `${ivText(ivs[i])} starts at ${ivs[i][0]}, before ${ivText(ivs[i - 1])} ends at ${ivs[i - 1][1]}: they overlap. Return false.`);
      snap("done", "Two meetings overlap, so not all of them can be attended.", { done: true, answer: "false" });
      return steps;
    }
    snap("ok", `${ivText(ivs[i])} starts at ${ivs[i][0]}, after ${ivText(ivs[i - 1])} ends at ${ivs[i - 1][1]}: fine.`);
  }
  at = ivs.length;
  snap("done", "No meeting starts before the previous one ends: all of them can be attended.", { done: true, answer: "true" });
  return steps;
}
function roomsSlow(ivs: Iv[]) {
  let ops = 0;
  for (let i = 0; i < ivs.length; i++)
    for (let j = i + 1; j < ivs.length; j++) {
      ops++;
      if (ivs[i][0] < ivs[j][1] && ivs[j][0] < ivs[i][1]) return { answer: false, ops };
    }
  return { answer: true, ops };
}

export const meetingRooms: PatternProblem<Iv[]> = {
  id: "meeting-rooms",
  title: "Meeting Rooms",
  difficulty: "Easy",
  blind75: true,
  slug: "meeting-rooms",
  video: "PaJxqZVPhbg",
  statement: "Given meeting times [start, end], can one person attend all of them? (A meeting ending at 5 and one starting at 5 don't clash.)",
  examples: [
    { label: "LeetCode's example 1 (false)", input: [[0, 30], [5, 10], [15, 20]] },
    { label: "LeetCode's example 2", input: [[7, 10], [2, 4]] },
    { label: "back to back", input: [[1, 3], [3, 5], [5, 6]] },
  ],
  random: (seed) => randomIvs(rngFor(seed), 1, 5, 3),
  big: { label: "200 back-to-back meetings", input: () => Array.from({ length: 200 }, (_, i): Iv => [((i * 7) % 200) * 2, ((i * 7) % 200) * 2 + 2]) },
  describe: (ivs) => `intervals = ${showIv(ivs)}`,
  run: roomsRun,
  solve: (ivs) => roomsSlow(ivs).answer,
  brute: roomsSlow,
  bruteIdea: "Compare every pair of meetings for an overlap: O(n²).",
  guide: {
    title: "Meeting Rooms",
    idea: ["Sort the meetings by start time. If any overlap exists, some meeting starts before the one right before it ends, so comparing neighbours is enough.", "One pass after sorting answers it."],
    whenToUse: ["“Any overlap at all?”: sort by start and compare neighbours.", "The warm-up for Meeting Rooms II."],
    stages: [
      { id: "start", title: "Sort by start", detail: "", pseudo: "intervals.sort(key=lambda i: i.start)" },
      { id: "ok", title: "Starts after the previous ends", detail: "", pseudo: "" },
      { id: "clash", title: "Starts before the previous ends → false", detail: "", pseudo: "if i1.end > i2.start: return False" },
      { id: "done", title: "Answer", detail: "", pseudo: "return True" },
    ],
    legend: [
      { tone: "current", label: "Meeting being checked" },
      { tone: "compare", label: "The one before it" },
      { tone: "swap", label: "Overlap" },
      { tone: "found", label: "Checked" },
    ],
    complexity: { time: "O(n log n)", space: "O(1)", why: "Sorting dominates." },
    pitfalls: ["End == next start is fine.", "Without sorting, neighbours in the input mean nothing."],
    tryThis: ["Example 1: [5,10] starts inside [0,30].", "“Back to back”: each starts exactly when the last ends."],
    python: roomsPy,
  },
};

// ---------------------------------------------------------------- Meeting rooms II

function rooms2Run(ivs: Iv[]): PatternStep[] {
  const steps: PatternStep[] = [];
  const starts = ivs.map((iv) => iv[0]).sort((a, b) => a - b);
  const ends = ivs.map((iv) => iv[1]).sort((a, b) => a - b);
  let s = 0;
  let e = 0;
  let count = 0;
  let best = 0;
  let ops = 2 * sortLog(ivs.length);
  let mark: { x: number; label: string; tone: VizTone } | null = null;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [
        row("starts, sorted", starts, Object.fromEntries(starts.map((_, i) => [i, i === s ? "current" : i < s ? "idle" : undefined]))),
        row("ends, sorted", ends, Object.fromEntries(ends.map((_, i) => [i, i === e ? "compare" : i < e ? "idle" : undefined]))),
      ],
      timeline: {
        title: "the meetings; the line is the moment being processed",
        lanes: ivs.map((_, i) => `#${i}`),
        bars: ivs.map(([a, b], i): Bar => ({ lane: i, start: a, end: b, tone: mark && a <= mark.x && mark.x < b ? "pointer" : undefined, text: ivText([a, b]) })),
        marks: mark ? [mark] : [],
      },
      vars: [
        { name: "rooms in use", value: String(count) },
        { name: "most at once", value: String(best), tone: "found" },
      ],
      ops,
      ...extra,
    });
  snap("start", "Only the moments meetings start and end matter. Sort the start times and the end times separately and sweep through both in time order: a start needs a room, an end frees one. The most rooms in use at any moment is the answer.");
  while (s < starts.length) {
    ops++;
    if (starts[s] < ends[e]) {
      count++;
      best = Math.max(best, count);
      mark = { x: starts[s], label: `start ${starts[s]}`, tone: "current" };
      snap("start-meeting", `The next event is a start at ${starts[s]} (before the next end, ${ends[e]}): one more room in use, ${count}.`);
      s++;
    } else {
      count--;
      mark = { x: ends[e], label: `end ${ends[e]}`, tone: "compare" };
      snap("end-meeting", `The next event is an end at ${ends[e]} (no later than the next start, ${starts[s]}): a room frees up, ${count} in use.`);
      e++;
    }
  }
  mark = null;
  snap("done", `Every meeting has started. At most ${best} were going on at once, so ${best} room${best === 1 ? "" : "s"} are enough.`, { done: true, answer: String(best) });
  return steps;
}
function rooms2Slow(ivs: Iv[]) {
  let ops = 0;
  let best = 0;
  for (const [t] of ivs) {
    let c = 0;
    for (const [a, b] of ivs) {
      ops++;
      if (a <= t && t < b) c++;
    }
    best = Math.max(best, c);
  }
  return { answer: best, ops };
}

export const meetingRooms2: PatternProblem<Iv[]> = {
  id: "meeting-rooms-ii",
  title: "Meeting Rooms II",
  difficulty: "Medium",
  blind75: true,
  slug: "meeting-rooms-ii",
  video: "FdzJmTCVyJU",
  statement: "Given meeting times, return the fewest conference rooms needed so that no two meetings in the same room overlap.",
  examples: [
    { label: "LeetCode's example 1", input: [[0, 30], [5, 10], [15, 20]] },
    { label: "three at once", input: [[1, 5], [2, 6], [3, 7], [6, 8]] },
    { label: "back to back", input: [[1, 3], [3, 5]] },
  ],
  random: (seed) => randomIvs(rngFor(seed), 1, 6),
  big: { label: "200 meetings", input: () => Array.from({ length: 200 }, (_, i): Iv => [(i * 7) % 100, ((i * 7) % 100) + 1 + (i % 9)]) },
  describe: (ivs) => `intervals = ${showIv(ivs)}`,
  run: rooms2Run,
  solve: (ivs) => rooms2Slow(ivs).answer,
  brute: rooms2Slow,
  bruteIdea: "At each meeting's start time, count how many meetings are going on: O(n²).",
  guide: {
    title: "Meeting Rooms II",
    idea: [
      "The rooms needed equals the most meetings happening at the same moment. Only start and end times change that number.",
      "Sort the starts and the ends separately and merge them like two sorted lists: a start (strictly before the next end) adds a room in use; an end frees one. Track the maximum. (A min-heap of end times works too.)",
    ],
    whenToUse: ["“How many at once” over intervals: a sweep over sorted start and end events.", "Ties: process an end before a start at the same time, since back-to-back meetings can share a room."],
    stages: [
      { id: "start", title: "Sort starts and ends", detail: "", pseudo: "start = sorted(starts); end = sorted(ends)" },
      { id: "start-meeting", title: "A start comes first → one more room", detail: "", pseudo: "if start[s] < end[e]: count += 1; s += 1" },
      { id: "end-meeting", title: "An end comes first → free a room", detail: "", pseudo: "else: count -= 1; e += 1" },
      { id: "done", title: "The most at once", detail: "", pseudo: "res = max(res, count); return res" },
    ],
    legend: [
      { tone: "current", label: "Start being processed" },
      { tone: "compare", label: "End being processed" },
      { tone: "pointer", label: "Meetings going on" },
    ],
    complexity: { time: "O(n log n)", space: "O(n)", why: "Sorting two lists, then one sweep." },
    pitfalls: ["Use < when comparing a start with an end: an end at 5 frees the room for a start at 5.", "You don't need to know which meeting ends, only when."],
    tryThis: ["“Three at once”: at time 3, three meetings overlap.", "“Back to back” needs one room."],
    python: rooms2Py,
  },
};

// ---------------------------------------------------------------- Minimum interval for each query

type Query = { intervals: Iv[]; queries: number[] };

function queryRun({ intervals, queries }: Query): PatternStep[] {
  const steps: PatternStep[] = [];
  const ivs = intervals.map((iv, i) => ({ iv, i })).sort((x, y) => x.iv[0] - y.iv[0]);
  const order = queries.map((q, k) => ({ q, k })).sort((x, y) => x.q - y.q);
  const heap = new Heap("min");
  const ans: number[] = Array(queries.length).fill(-1);
  const done: boolean[] = [];
  let p = 0;
  let qNow: number | null = null;
  let popped = new Set<number>();
  const ops = 2 * sortLog(intervals.length + queries.length);
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) => {
    const inHeap = new Set(heap.a.map((it) => (it.data as { i: number }).i));
    const top = heap.peek() ? (heap.peek()!.data as { i: number }).i : -1;
    steps.push({
      stage,
      explanation,
      rows: [
        row("queries", queries, Object.fromEntries(queries.map((q, k) => [k, qNow === q && !done[k] ? "current" : done[k] ? "found" : undefined]))),
        row("answers", ans.map((a, k) => (done[k] ? a : "")), Object.fromEntries(ans.map((_, k) => [k, done[k] ? "found" : undefined]))),
        row("min-heap: (size, end), smallest first", [...heap.a].sort((a, b) => a.key - b.key).map((it) => `(${it.key}, ${(it.data as { end: number }).end})`)),
      ],
      timeline: {
        title: "intervals (size = right − left + 1); the line is the current query",
        lanes: intervals.map((_, i) => `#${i}`),
        bars: intervals.map(([a, b], i): Bar => ({ lane: i, start: a, end: b, tone: i === top && qNow !== null ? "found" : popped.has(i) ? "idle" : inHeap.has(i) ? "pointer" : undefined, text: ivText([a, b]) })),
        marks: qNow !== null ? [{ x: qNow, label: `q=${qNow}`, tone: "compare" }] : [],
      },
      vars: [],
      ops: ops + heap.ops,
      ...extra,
    });
  };
  snap("start", "Answer the queries in increasing order. Sort the intervals by start. For each query, push every interval that has started (start ≤ q) into a min-heap keyed by size. Then drop heap tops that have already ended (end < q). The top left, if any, is the smallest interval containing q.");
  for (const { q, k } of order) {
    qNow = q;
    popped = new Set();
    const pushed: string[] = [];
    while (p < ivs.length && ivs[p].iv[0] <= q) {
      const [a, b] = ivs[p].iv;
      heap.push({ key: b - a + 1, data: { end: b, i: ivs[p].i } });
      pushed.push(ivText([a, b]));
      p++;
    }
    const dropped: string[] = [];
    while (heap.size && (heap.peek()!.data as { end: number }).end < q) {
      const { top } = heap.pop();
      const d = top.data as { end: number; i: number };
      popped.add(d.i);
      dropped.push(ivText(intervals[d.i]));
    }
    ans[k] = heap.size ? heap.peek()!.key : -1;
    done[k] = true;
    snap(
      "query",
      `Query ${q}: ${pushed.length ? `push ${pushed.join(", ")} (they start by ${q}). ` : ""}${dropped.length ? `Drop ${dropped.join(", ")}: ended before ${q}. ` : ""}${heap.size ? `The smallest interval containing ${q} has size ${ans[k]}.` : `No interval contains ${q}: −1.`}`,
    );
  }
  qNow = null;
  popped = new Set();
  snap("done", `Answers, in the original query order: ${show(ans)}.`, { done: true, answer: show(ans) });
  return steps;
}
function querySlow({ intervals, queries }: Query) {
  let ops = 0;
  const ans = queries.map((q) => {
    let best = Infinity;
    for (const [a, b] of intervals) {
      ops++;
      if (a <= q && q <= b) best = Math.min(best, b - a + 1);
    }
    return best === Infinity ? -1 : best;
  });
  return { answer: show(ans), ops };
}

export const minIntervalQuery: PatternProblem<Query> = {
  id: "min-interval-query",
  title: "Minimum Interval to Include Each Query",
  difficulty: "Hard",
  blind75: false,
  slug: "minimum-interval-to-include-each-query",
  video: "5hQ5WWW5awQ",
  statement: "For each query point q, return the size (right − left + 1) of the smallest interval containing q, or −1 if none does.",
  examples: [
    { label: "LeetCode's example 1", input: { intervals: [[1, 4], [2, 4], [3, 6], [4, 4]], queries: [2, 3, 4, 5] } },
    { label: "LeetCode's example 2", input: { intervals: [[2, 3], [2, 5], [1, 8], [20, 25]], queries: [2, 19, 5, 22] } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return { intervals: randomIvs(g, 1, 5), queries: Array.from({ length: g.int(1, 4) }, () => g.int(0, 14)) };
  },
  big: {
    label: "150 intervals, 150 queries",
    input: () => ({ intervals: Array.from({ length: 150 }, (_, i): Iv => [(i * 13) % 300, ((i * 13) % 300) + 1 + (i % 20)]), queries: Array.from({ length: 150 }, (_, i) => (i * 17) % 320) }),
  },
  describe: ({ intervals, queries }) => `intervals = ${showIv(intervals)}, queries = ${show(queries)}`,
  run: queryRun,
  solve: (i) => querySlow(i).answer,
  brute: querySlow,
  bruteIdea: "For every query, scan every interval: O(n × q).",
  guide: {
    title: "Minimum Interval to Include Each Query",
    idea: [
      "Process queries from smallest to largest. Then an interval, once it has started, stays relevant until it ends, and the set of started intervals only grows. Keep them in a min-heap by size.",
      "For each query, push every interval with start ≤ q, pop tops whose end < q (they'll never contain a later query either), and read the top. Answers go back in the queries' original order.",
    ],
    whenToUse: ["Many queries against many intervals: sort both and sweep together (offline processing).", "A heap with lazy removal: discard stale tops only when you look at them."],
    stages: [
      { id: "start", title: "Sort intervals and queries", detail: "", pseudo: "intervals.sort(); min_heap = []; res = {}" },
      { id: "query", title: "Push started, pop ended, read the top", detail: "", pseudo: "while i < len(intervals) and intervals[i][0] <= q: heappush(...); while min_heap and min_heap[0][1] < q: heappop(min_heap); res[q] = min_heap[0][0] if min_heap else -1" },
      { id: "done", title: "Answers in the original order", detail: "", pseudo: "return [res[q] for q in queries]" },
    ],
    legend: [
      { tone: "pointer", label: "In the heap" },
      { tone: "found", label: "Heap top: the answer" },
      { tone: "idle", label: "Popped: ended before the query" },
      { tone: "compare", label: "The query point" },
    ],
    complexity: { time: "O((n + q) log n)", space: "O(n + q)", why: "Each interval is pushed and popped at most once; sorting both lists dominates." },
    pitfalls: ["Size is right − left + 1 (both ends count).", "Return answers in the original query order, not the sorted one."],
    tryThis: ["Example 1: query 4 is inside all four intervals; [4,4] (size 1) wins.", "Example 2: query 19 is in none: −1."],
    python: queryPy,
  },
};
