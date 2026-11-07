// Largest Rectangle in Histogram (NeetCode 150 · Stack).

import py from "../../guides/python/neetcode/largest_rectangle.py?raw";
import { row, rngFor, show } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";

type Input = number[];

function run(h: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const n = h.length;
  const stack: [number, number, number][] = []; // [start, height, bar it came from]
  let best = 0;
  let bestRect = { l: 0, r: -1, h: 0 };
  let ops = 0;
  const snap = (stage: string, i: number, explanation: string, rect: { l: number; r: number; h: number } | null, extra: Partial<PatternStep> = {}) => {
    const tones: Record<number, "current" | "pointer" | "found" | undefined> = {};
    for (const [, , k] of stack) tones[k] = "pointer";
    if (i >= 0 && i < n) tones[i] = "current";
    steps.push({
      stage,
      explanation,
      rows: [row("stack: (start, height), heights rising", stack.map(([, ht]) => ht), stack.length ? { [stack.length - 1]: "pointer" } : {}, Object.fromEntries(stack.map(([j], k) => [k, `from ${j}`])))],
      bars: { values: h, tones: stage === "done" ? {} : tones, tags: i >= 0 && i < n ? { [i]: "i" } : {}, rect: rect ? { ...rect, tone: stage === "done" ? "found" : "compare" } : undefined },
      vars: [
        ...(rect && stage !== "done" ? [{ name: "this rectangle", value: `${rect.h} × ${rect.r - rect.l + 1} = ${rect.h * (rect.r - rect.l + 1)}`, tone: "compare" as const }] : []),
        { name: "best", value: String(best), tone: "found" },
      ],
      ops,
      ...extra,
    });
  };
  const consider = (l: number, r: number, ht: number) => {
    const area = ht * (r - l + 1);
    const improved = area > best;
    if (improved) {
      best = area;
      bestRect = { l, r, h: ht };
    }
    return { area, improved };
  };
  snap("start", -1, "Each bar's height can stretch left and right until a lower bar stops it. The stack holds bars whose rectangle is still growing, lowest at the bottom, each with the index where its rectangle starts.", null);
  for (let i = 0; i < n; i++) {
    let start = i;
    while (stack.length && stack[stack.length - 1][1] > h[i]) {
      const [j, ht] = stack.pop()!;
      ops++;
      const { area, improved } = consider(j, i - 1, ht);
      snap("pop", i, `Bar ${i} (height ${h[i]}) is lower than ${ht}, so the height-${ht} rectangle can't reach past it. It ends here: from ${j} to ${i - 1}, area ${ht} × ${i - j} = ${area}.${improved ? " New best!" : ""} Pop it.`, { l: j, r: i - 1, h: ht });
      start = j;
    }
    stack.push([start, h[i], i]);
    ops++;
    snap("push", i, start < i ? `Push height ${h[i]}, starting at ${start}: the taller bars just popped are at least ${h[i]} high, so this rectangle can reach back over them.` : `Push height ${h[i]}, starting at ${i}. It's not lower than the top, so nothing ends here.`, null);
  }
  for (const [j, ht] of [...stack].reverse()) {
    ops++;
    const { area, improved } = consider(j, n - 1, ht);
    snap("flush", n, `End of the bars. Height ${ht} from ${j} was never stopped, so it reaches the end: ${ht} × ${n - j} = ${area}.${improved ? " New best!" : ""}`, { l: j, r: n - 1, h: ht });
  }
  snap("done", n, `The largest rectangle has area ${best}: height ${bestRect.h} across bars ${bestRect.l} to ${bestRect.r}.`, bestRect, { done: true, answer: String(best) });
  return steps;
}

export const largestRectangle: PatternProblem<Input> = {
  id: "largest-rectangle",
  title: "Largest Rectangle in Histogram",
  difficulty: "Hard",
  blind75: false,
  slug: "largest-rectangle-in-histogram",
  video: "zx5Sw9130L0",
  statement: "Each number is the height of a bar, 1 wide, standing side by side. Return the area of the largest rectangle that fits inside the bars.",
  examples: [
    { label: "[2,1,5,6,2,3]", input: [2, 1, 5, 6, 2, 3] },
    { label: "[2,4]", input: [2, 4] },
    { label: "[3,6,5,7,4,8,1,0]", input: [3, 6, 5, 7, 4, 8, 1, 0] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return Array.from({ length: g.int(4, 10) }, () => g.int(1, 7));
  },
  big: { label: "200 bars", input: () => Array.from({ length: 200 }, (_, i) => ((i * 31) % 23) + 1) },
  describe: (h) => `heights = ${show(h)}`,
  run,
  solve: (h) => {
    let best = 0;
    for (let i = 0; i < h.length; i++) best = Math.max(best, h[i] * (1 + (() => {
      let w = 0;
      for (let j = i - 1; j >= 0 && h[j] >= h[i]; j--) w++;
      for (let j = i + 1; j < h.length && h[j] >= h[i]; j++) w++;
      return w;
    })()));
    return best;
  },
  brute: (h) => {
    let ops = 0;
    let best = 0;
    for (let i = 0; i < h.length; i++) {
      let low = Infinity;
      for (let j = i; j < h.length; j++) {
        ops++;
        low = Math.min(low, h[j]);
        best = Math.max(best, low * (j - i + 1));
      }
    }
    return { answer: best, ops };
  },
  bruteIdea: "Try every range of bars [i, j]: the rectangle's height is the lowest bar in the range. Tracking that minimum as j grows still means about n²/2 ranges.",
  guide: {
    title: "Largest Rectangle in Histogram",
    idea: [
      "The best rectangle is as tall as some bar and stretches over every neighbour at least that tall. A bar's rectangle grows to the right until a lower bar arrives, and that lower bar is exactly when we learn where it ends.",
      "Keep the bars whose rectangles are still growing on a stack, heights rising. When a lower bar arrives, pop every taller bar, scoring each rectangle. The lower bar can reach back to where the last popped one started, so it's pushed with that start. Whatever is left at the end reaches the last bar.",
    ],
    whenToUse: ["“For each bar, how far can it extend before something smaller?”: a monotonic increasing stack.", "The same trick solves Maximal Rectangle in a 0/1 grid, row by row."],
    stages: [
      { id: "start", title: "Empty stack", detail: "It will hold (start, height) with heights rising.", pseudo: "stack = []; best = 0" },
      { id: "pop", title: "Lower bar → taller rectangles end here", detail: "Pop each taller bar and score height × width.", pseudo: "while stack[-1][1] > h: j, ht = stack.pop(); best = max(best, ht * (i - j)); start = j" },
      { id: "push", title: "Push (start, height)", detail: "Start reaches back over the popped bars.", pseudo: "stack.append((start, h))" },
      { id: "flush", title: "End → the rest reach the last bar", detail: "Score each remaining one to the end.", pseudo: "for j, ht in stack: best = max(best, ht * (n - j))" },
      { id: "done", title: "Best area", detail: "Every bar's widest rectangle was scored.", pseudo: "return best" },
    ],
    legend: [
      { tone: "current", label: "Current bar i" },
      { tone: "pointer", label: "Rectangle still growing (on the stack)" },
      { tone: "compare", label: "Rectangle being scored" },
      { tone: "found", label: "Largest rectangle" },
    ],
    complexity: { time: "O(n)", space: "O(n)", why: "Each bar is pushed once and popped at most once." },
    pitfalls: [
      "When pushing after pops, use the start of the last popped bar, not i: the lower bar's rectangle extends back over them.",
      "Don't forget the bars left on the stack at the end; they reach all the way to the right edge.",
    ],
    tryThis: ["Pick “[2,1,5,6,2,3]”: the bar of height 2 at index 4 ends both the 6 and the 5, giving 10.", "Pick “[2,4]”: no pops at all until the end."],
    python: py,
  },
};
