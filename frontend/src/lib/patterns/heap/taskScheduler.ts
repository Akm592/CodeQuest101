// Task Scheduler (NeetCode 150 · Heap / Priority Queue).

import py from "../../guides/python/neetcode/task_scheduler.py?raw";
import { row, rngFor } from "../helpers";
import type { PEntry, PatternProblem, PatternStep } from "../types";
import { Heap, heapNodes, heapRow, pathEdge, pathTone } from "./heap";

type Input = { tasks: string; n: number };

function run({ tasks, n }: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const count = new Map<string, number>();
  for (const t of tasks) count.set(t, (count.get(t) ?? 0) + 1);
  const h = new Heap("max");
  // Push in a fixed order so ties are drawn the same way every time.
  for (const [t, c] of [...count.entries()].sort()) h.push({ key: c, label: `${t}${c}`, data: t });
  const waiting: { t: string; left: number; ready: number }[] = [];
  const done: string[] = [];
  let time = 0;
  let ops = 0;
  const snap = (stage: string, explanation: string, tone: (i: number) => ReturnType<ReturnType<typeof pathTone>> = () => undefined, edge = tone, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [row("schedule so far", done.length ? done : [], Object.fromEntries(done.map((d, i) => [i, i === done.length - 1 ? (d === "idle" ? "idle" : "current") : d === "idle" ? "idle" : undefined])), Object.fromEntries(done.map((_, i) => [i, String(i + 1)]))), heapRow("max-heap of remaining counts", h, tone)],
      tree: { title: "the max-heap: the task with the most copies left is on top", nodes: heapNodes(h, { tone, edge }) },
      map: { title: `cooling queue (n = ${n}): task → time it's ready`, entries: waiting.map((w): PEntry => ({ k: `${w.t}${w.left}`, v: `t=${w.ready}`, tone: w.ready === time + 1 ? "found" : undefined })) },
      vars: [{ name: "time", value: String(time), tone: "found" }],
      ops: h.ops + ops,
      ...extra,
    });
  snap("start", `Count each task: ${[...count.entries()].sort().map(([t, c]) => `${t}×${c}`).join(", ")}. Always run the task with the most copies left (a max-heap of counts), so the busiest task never ends up stuck at the end with gaps between its copies. After running, a task cools down for n = ${n} time units in a queue.`);
  while (h.size || waiting.length) {
    time++;
    ops++;
    let back = "";
    if (waiting.length && waiting[0].ready === time) {
      const w = waiting.shift()!;
      h.push({ key: w.left, label: `${w.t}${w.left}`, data: w.t });
      back = `${w.t} has cooled down and goes back into the heap. `;
    }
    if (!h.size) {
      // Jump straight to the next ready time, as NeetCode's solution does:
      // the CPU idles from now until just before it.
      const next = waiting[0].ready;
      const idles = next - time;
      for (let i = 0; i < idles; i++) done.push("idle");
      time = next - 1;
      snap("idle", `${back}Nothing can run: every remaining task is cooling down. The CPU idles for ${idles} unit${idles === 1 ? "" : "s"} until ${waiting[0].t} is ready at time ${next}.`);
      continue;
    }
    const { top, path } = h.pop();
    const t = top.data as string;
    done.push(t);
    const left = top.key - 1;
    if (left) waiting.push({ t, left, ready: time + n + 1 });
    snap(
      "run",
      `${back}Time ${time}: run ${t}, the task with the most copies left (${top.key}).${left ? ` ${left} left, so it waits in the queue until time ${time + n + 1}.` : ` That was its last copy.`}`,
      pathTone(path),
      pathEdge(path),
    );
  }
  snap("done", `Every task has run. Total time: ${time}, including ${done.filter((d) => d === "idle").length} idle unit${done.filter((d) => d === "idle").length === 1 ? "" : "s"}.`, () => undefined, () => undefined, { done: true, answer: String(time) });
  return steps;
}

/** The slow way: every time unit, scan all task types for the ready one with the most copies left. */
function slow({ tasks, n }: Input) {
  const left = new Map<string, number>();
  for (const t of tasks) left.set(t, (left.get(t) ?? 0) + 1);
  const readyAt = new Map<string, number>();
  let remaining = tasks.length;
  let time = 0;
  let ops = 0;
  while (remaining) {
    time++;
    let best: string | null = null;
    for (const [t, c] of left) {
      ops++;
      if (c && (readyAt.get(t) ?? 0) <= time && (best === null || c > left.get(best)!)) best = t;
    }
    if (best) {
      left.set(best, left.get(best)! - 1);
      readyAt.set(best, time + n + 1);
      remaining--;
    }
  }
  return { answer: time, ops };
}

export const taskScheduler: PatternProblem<Input> = {
  id: "task-scheduler",
  title: "Task Scheduler",
  difficulty: "Medium",
  blind75: false,
  slug: "task-scheduler",
  video: "s8p8ukTyA2I",
  statement: "A CPU runs one task per time unit, or idles. Two runs of the same task must be at least n units apart. Return the least time needed to run all the tasks (given as letters).",
  examples: [
    { label: "LeetCode's example 1 (n = 2)", input: { tasks: "AAABBB", n: 2 } },
    { label: "no idling needed (n = 1)", input: { tasks: "AABBCCD", n: 1 } },
    { label: "one busy task (n = 2)", input: { tasks: "AAAABC", n: 2 } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return { tasks: Array.from({ length: g.int(1, 9) }, () => g.pick([..."ABCD"])).join(""), n: g.int(0, 3) };
  },
  big: { label: "600 tasks of 26 kinds, n = 3", input: () => ({ tasks: Array.from({ length: 600 }, (_, i) => String.fromCharCode(65 + ((i * i) % 26))).join(""), n: 3 }) },
  describe: ({ tasks, n }) => `tasks = ${[...tasks].join("")}, n = ${n}`,
  run,
  solve: (input) => slow(input).answer,
  brute: slow,
  bruteIdea: "Simulate one time unit at a time and scan every task type to find the ready one with the most copies left: O(time × number of task types).",
  guide: {
    title: "Task Scheduler",
    idea: [
      "Greedy: at each time unit, run the available task with the most copies left. Leaving the busiest task for later is what forces idle gaps, so get it going early.",
      "A max-heap holds the counts of tasks that can run now. When a task runs, its count drops by one and it waits in a queue with the time it becomes available (now + n + 1). Each time unit, move a cooled-down task from the queue back into the heap. If the heap is empty, the CPU idles. There's also a one-line formula, (maxCount − 1) × (n + 1) + number of tasks with maxCount, but the simulation shows why it works.",
    ],
    whenToUse: ["Scheduling with cooldowns or “no two equal items within n”: a max-heap plus a queue of items waiting to come back.", "Greedy choices where the “most urgent” item changes as you go."],
    stages: [
      { id: "start", title: "Count tasks, heap the counts", detail: "", pseudo: "heap = [-c for c in Counter(tasks).values()]; heapify(heap)" },
      { id: "run", title: "Run the task with the most copies left", detail: "If any copies are left, it waits n units in the queue.", pseudo: "cnt = 1 + heappop(heap); if cnt: q.append([cnt, time + n])" },
      { id: "idle", title: "Heap empty: idle until the next task is ready", detail: "", pseudo: "time = q[0][1]  # skip ahead" },
      { id: "done", title: "Heap and queue both empty", detail: "", pseudo: "return time" },
    ],
    legend: [
      { tone: "current", label: "Task just run" },
      { tone: "swap", label: "Heap path that changed" },
      { tone: "idle", label: "Idle time" },
      { tone: "found", label: "Ready next turn" },
    ],
    complexity: { time: "O(total time)", space: "O(26)", why: "Each time unit is O(log 26) heap work, which is constant; total time is at most tasks × (n + 1)." },
    pitfalls: ["A task that just ran comes back after n idle-or-busy units, at time + n + 1, not time + n.", "Count idle units too: the answer is total time, not the number of tasks."],
    tryThis: ["In “one busy task”, A dominates: A _ _ A _ _ A _ _ A needs idles even though B and C fill two gaps.", "In “no idling needed”, there are enough other tasks to fill every gap, so the answer is just the number of tasks."],
    python: py,
  },
};
