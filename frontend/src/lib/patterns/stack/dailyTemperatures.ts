// Daily Temperatures (NeetCode 150 · Stack).

import py from "../../guides/python/neetcode/daily_temperatures.py?raw";
import { row, rngFor, show } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";

type Input = number[];

function run(t: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const ans = t.map(() => 0);
  const answered = new Set<number>();
  const stack: number[] = [];
  let ops = 0;
  const snap = (stage: string, i: number, explanation: string, popped: number[] = [], extra: Partial<PatternStep> = {}) => {
    const tones: Record<number, "current" | "pointer" | "found" | "visited" | undefined> = {};
    for (const j of answered) tones[j] = "visited";
    for (const j of stack) tones[j] = "pointer";
    for (const j of popped) tones[j] = "found";
    if (i < t.length && i >= 0) tones[i] = "current";
    steps.push({
      stage,
      explanation,
      rows: [
        row("stack: days still waiting (bottom → top)", stack.map((j) => t[j]), {}, Object.fromEntries(stack.map((j, k) => [k, `day ${j}`]))),
        row("answer: days to wait", ans, Object.fromEntries(t.map((_, j) => [j, popped.includes(j) ? "found" : answered.has(j) ? "visited" : undefined]))),
      ],
      bars: { values: t, floor: Math.max(0, Math.min(...t) - 4), tones, tags: i >= 0 && i < t.length ? { [i]: "today" } : {} },
      vars: [{ name: "waiting", value: String(stack.length), tone: "pointer" }],
      ops,
      ...extra,
    });
  };
  snap("start", -1, "Walk through the days. Days that haven't found a warmer day yet wait on a stack. Their temperatures are always falling from bottom to top: a warmer day would already have answered the ones below it.");
  for (let i = 0; i < t.length; i++) {
    const popped: number[] = [];
    while (stack.length && t[stack[stack.length - 1]] < t[i]) {
      const j = stack.pop()!;
      ans[j] = i - j;
      answered.add(j);
      popped.push(j);
      ops++;
    }
    if (popped.length)
      snap("pop", i, `Day ${i} is ${t[i]}°, warmer than ${popped.map((j) => `day ${j} (${t[j]}°)`).join(", ")} on top of the stack. ${popped.length === 1 ? "That day" : "Those days"} finally got a warmer day: ${popped.map((j) => `${i} − ${j} = ${ans[j]}`).join(", ")}. Pop ${popped.length === 1 ? "it" : "them"}.`, popped);
    stack.push(i);
    ops++;
    const below = stack.length > 1 ? stack[stack.length - 2] : -1;
    snap(
      "push",
      i,
      below < 0
        ? `Day ${i} (${t[i]}°) has no earlier day waiting${popped.length ? " any more" : ""}. Push it: it now waits for a day warmer than ${t[i]}°.`
        : `Day ${i} (${t[i]}°) isn't warmer than day ${below} (${t[below]}°) below it, so that day keeps waiting. Push day ${i}: it waits too.`,
    );
  }
  snap("done", t.length, stack.length ? `Done. ${stack.length === 1 ? "One day never sees" : `${stack.length} days never see`} a warmer day, so ${stack.length === 1 ? "its" : "their"} answer stays 0.` : "Done. Every day found a warmer one.", [], { done: true, answer: show(ans) });
  return steps;
}

export const dailyTemperatures: PatternProblem<Input> = {
  id: "daily-temperatures",
  title: "Daily Temperatures",
  difficulty: "Medium",
  blind75: false,
  slug: "daily-temperatures",
  video: "cTBiBSnjO3c",
  statement: "Given daily temperatures, return for each day how many days you'd wait for a warmer one. If there's no warmer day later, the answer is 0.",
  examples: [
    { label: "[73,74,75,71,69,72,76,73]", input: [73, 74, 75, 71, 69, 72, 76, 73] },
    { label: "[30,40,50,60]", input: [30, 40, 50, 60] },
    { label: "[60,50,40,30,70]", input: [60, 50, 40, 30, 70] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return Array.from({ length: g.int(5, 10) }, () => g.int(60, 75));
  },
  big: { label: "200 days, cooling", input: () => Array.from({ length: 200 }, (_, i) => 100 - Math.floor(i / 3)) },
  describe: (t) => `temperatures = ${show(t)}`,
  run,
  solve: (t) => t.map((x, i) => {
    const j = t.findIndex((y, k) => k > i && y > x);
    return j < 0 ? 0 : j - i;
  }),
  brute: (t) => {
    let ops = 0;
    const ans = t.map((x, i) => {
      for (let j = i + 1; j < t.length; j++) {
        ops++;
        if (t[j] > x) return j - i;
      }
      return 0;
    });
    return { answer: ans, ops };
  },
  bruteIdea: "For each day, scan forward until a warmer day. During a long cool spell every scan runs to the end: O(n²).",
  guide: {
    title: "Daily Temperatures",
    idea: [
      "Instead of each day looking forward, let each new day look back at the days still waiting and answer them. The waiting days sit on a stack.",
      "When today is warmer than the top, that day's wait is over: pop it and record the gap. Keep popping until the top is at least as warm, then push today. The stack's temperatures always fall from bottom to top: a monotonic stack.",
    ],
    whenToUse: ["“Next greater / next smaller element” for every position: a monotonic stack.", "Anything where a new item “resolves” several earlier ones at once, like a warmer day answering all the cooler days before it."],
    stages: [
      { id: "start", title: "Empty stack", detail: "It will hold days without an answer yet.", pseudo: "stack = []; answer = [0] * n" },
      { id: "pop", title: "Today is warmer → answer and pop", detail: "Each popped day waited i − j days.", pseudo: "while stack and t[stack[-1]] < t[i]: j = stack.pop(); answer[j] = i - j" },
      { id: "push", title: "Push today", detail: "It waits for its own warmer day.", pseudo: "stack.append(i)" },
      { id: "done", title: "Days left on the stack → 0", detail: "No warmer day ever came.", pseudo: "return answer" },
    ],
    legend: [
      { tone: "current", label: "Today" },
      { tone: "pointer", label: "Waiting on the stack" },
      { tone: "found", label: "Just answered" },
      { tone: "visited", label: "Answered earlier" },
    ],
    complexity: { time: "O(n)", space: "O(n)", why: "Each day is pushed once and popped at most once, however many pops happen on a single day." },
    pitfalls: [
      "Store indices on the stack, not temperatures: you need the index to compute the wait.",
      "Use strictly warmer (<): an equal temperature doesn't end the wait.",
    ],
    tryThis: ["Pick “[60,50,40,30,70]”: four days wait, then 70 answers them all at once.", "Pick “[30,40,50,60]”: the stack never holds more than one day."],
    python: py,
  },
};
