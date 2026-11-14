// Course Schedule (NeetCode 150 · Graphs).

import py from "../../guides/python/neetcode/course_schedule.py?raw";
import { row } from "../helpers";
import type { PEntry, PatternProblem, PatternStep } from "../types";
import { type CoursesInput, chainCourses, courseGraph, randomCourses, takeWhatsReady } from "./courses";
import { showPairs } from "./graph";

type Input = CoursesInput;

function run({ n, prereqs }: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const pre = new Map<number, number[]>(Array.from({ length: n }, (_, c) => [c, [] as number[]]));
  for (const [a, b] of prereqs) pre.get(a)!.push(b);
  const visiting: number[] = [];
  const ok = new Set<number>();
  let cur: number | null = null;
  let bad: number | null = null;
  let ops = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) => {
    const on = new Set(visiting);
    steps.push({
      stage,
      explanation,
      rows: [row("DFS path (courses being checked)", visiting, Object.fromEntries(visiting.map((c, i) => [i, c === bad ? "swap" : i === visiting.length - 1 ? "current" : "compare"])))],
      graph: courseGraph(
        n,
        prereqs,
        (c) => (c === bad ? "swap" : c === cur ? "current" : on.has(c) ? "compare" : ok.has(c) ? "found" : undefined),
        (a, b) => (on.has(a) && on.has(b) ? (bad !== null ? "swap" : "compare") : ok.has(a) && ok.has(b) ? "found" : undefined),
      ),
      map: { title: "prerequisites still to check", entries: [...pre.entries()].map(([c, ps]): PEntry => ({ k: String(c), v: ps.length ? `[${ps.join(", ")}]` : "[] ✓", tone: ps.length ? undefined : "found" })) },
      vars: [{ name: "courses known OK", value: `${ok.size} of ${n}`, tone: "found" }],
      ops,
      ...extra,
    });
  };
  snap("start", "All courses can be finished exactly when the prerequisite graph has no cycle. DFS from each course into its prerequisites, keeping the current path. Reaching a course that's already on the path means a cycle. A course whose prerequisites all check out gets its list emptied, so it's never checked again.");
  const dfs = (c: number): boolean => {
    ops++;
    if (visiting.includes(c)) {
      bad = c;
      cur = c;
      snap("cycle", `Course ${c} is already on the path ${visiting.join(" → ")}: the prerequisites go round in a circle, so none of these courses can ever be started. Return false.`);
      return false;
    }
    if (!pre.get(c)!.length) {
      ok.add(c);
      cur = c;
      snap("free", `Course ${c} has no prerequisites left to check: it can be taken.`);
      return true;
    }
    visiting.push(c);
    cur = c;
    snap("visit", `Check course ${c}: it needs ${pre.get(c)!.join(", ")}. Put it on the path and check ${pre.get(c)!.length === 1 ? "that one" : "each of those"} first.`);
    for (const p of [...pre.get(c)!]) {
      ops++;
      if (!dfs(p)) return false;
    }
    visiting.pop();
    pre.set(c, []);
    ok.add(c);
    cur = c;
    snap("clear", `All of course ${c}'s prerequisites can be taken, so ${c} can be too. Take it off the path and empty its list.`);
    return true;
  };
  for (let c = 0; c < n; c++) {
    if (!dfs(c)) {
      snap("done", "A cycle means some courses can never be taken: return false.", { done: true, answer: "false" });
      return steps;
    }
  }
  cur = null;
  snap("done", `Every course checked out with no cycle: all ${n} can be finished. Return true.`, { done: true, answer: "true" });
  return steps;
}

export const courseSchedule: PatternProblem<Input> = {
  id: "course-schedule",
  title: "Course Schedule",
  difficulty: "Medium",
  blind75: true,
  slug: "course-schedule",
  video: "EgI5nU9etnU",
  statement: "There are n courses, 0 to n − 1. prerequisites[i] = [a, b] means you must take b before a. Return true if you can finish every course.",
  examples: [
    { label: "a chain of 4", input: { n: 4, prereqs: [[1, 0], [2, 1], [3, 2]] } },
    { label: "a cycle", input: { n: 3, prereqs: [[1, 0], [2, 1], [0, 2]] } },
    { label: "LeetCode's example 2", input: { n: 2, prereqs: [[1, 0], [0, 1]] } },
  ],
  random: randomCourses,
  big: { label: "60 courses in one long chain", input: () => chainCourses(60) },
  describe: ({ n, prereqs }) => `numCourses = ${n}, prerequisites = ${showPairs(prereqs)}`,
  run,
  solve: (input) => takeWhatsReady(input).order.length === input.n,
  brute: (input) => {
    const { order, ops } = takeWhatsReady(input);
    return { answer: order.length === input.n, ops };
  },
  bruteIdea: "Keep scanning every course for one whose prerequisites are all taken, take it, and scan again. On a long chain that finds one course per full scan: O(V × (V + E)).",
  guide: {
    title: "Course Schedule",
    idea: [
      "Draw an arrow from each prerequisite to the course that needs it. You can finish everything exactly when that graph has no cycle.",
      "DFS from each course into its prerequisites, keeping a set of courses on the current path. Meeting a course already on the path is a cycle. When all of a course's prerequisites check out, take it off the path and empty its prerequisite list, so later searches finish at it immediately. Each course and edge is then handled once.",
    ],
    whenToUse: ["Dependencies, ordering, “can this be done”: a directed graph; a cycle means it can't.", "Cycle detection in a directed graph: DFS with an on-the-path set (or Kahn's algorithm with in-degrees)."],
    stages: [
      { id: "start", title: "Map each course to its prerequisites", detail: "", pseudo: "pre_map = {c: [] for c in range(n)}; visiting = set()" },
      { id: "visit", title: "Put the course on the path, check its prerequisites", detail: "", pseudo: "visiting.add(crs); for pre in pre_map[crs]: if not dfs(pre): return False" },
      { id: "free", title: "No prerequisites left → OK", detail: "", pseudo: "if pre_map[crs] == []: return True" },
      { id: "clear", title: "All checked → off the path, empty its list", detail: "", pseudo: "visiting.remove(crs); pre_map[crs] = []; return True" },
      { id: "cycle", title: "Already on the path → cycle", detail: "", pseudo: "if crs in visiting: return False" },
      { id: "done", title: "Answer", detail: "", pseudo: "return True" },
    ],
    legend: [
      { tone: "current", label: "Course being checked" },
      { tone: "compare", label: "On the DFS path" },
      { tone: "found", label: "Can be taken" },
      { tone: "swap", label: "Cycle" },
    ],
    complexity: { time: "O(V + E)", space: "O(V + E)", why: "Each course is checked once and each prerequisite edge followed once, because emptied lists end later searches at once." },
    pitfalls: ["“Seen before” isn't enough to mean a cycle: only a course on the current path is. That's why the path set is separate from the “OK” lists.", "Remove the course from the path when its check finishes."],
    tryThis: ["In “a cycle”, the path 0 → 2 → 1 comes back to 0.", "In “a chain of 4”, the first DFS from course 0 is short, and later ones stop at courses already cleared."],
    python: py,
  },
};
