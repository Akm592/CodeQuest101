// Course Schedule II (NeetCode 150 · Graphs).

import py from "../../guides/python/neetcode/course_schedule_ii.py?raw";
import { row } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { type CoursesInput, chainCourses, courseGraph, randomCourses, takeWhatsReady } from "./courses";
import { showPairs } from "./graph";

type Input = CoursesInput;

const showOrder = (o: number[]) => `[${o.join(", ")}]`;

function run({ n, prereqs }: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const pre = Array.from({ length: n }, () => [] as number[]);
  for (const [a, b] of prereqs) pre[a].push(b);
  const output: number[] = [];
  const visit = new Set<number>();
  const cycle: number[] = []; // the current path
  let cur: number | null = null;
  let bad: number | null = null;
  let ops = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) => {
    const on = new Set(cycle);
    steps.push({
      stage,
      explanation,
      rows: [
        row("order (a course is added once all its prerequisites are in)", output, Object.fromEntries(output.map((c, i) => [i, c === cur && stage === "add" ? "found" : undefined]))),
        row("DFS path", cycle, Object.fromEntries(cycle.map((c, i) => [i, c === bad ? "swap" : "compare"]))),
      ],
      graph: courseGraph(
        n,
        prereqs,
        (c) => (c === bad ? "swap" : c === cur ? "current" : on.has(c) ? "compare" : visit.has(c) ? "found" : undefined),
        (a, b) => (on.has(a) && on.has(b) ? (bad !== null ? "swap" : "compare") : visit.has(a) && visit.has(b) ? "found" : undefined),
        (c) => (visit.has(c) ? `#${output.indexOf(c) + 1}` : undefined),
      ),
      vars: [{ name: "courses in the order", value: `${output.length} of ${n}`, tone: "found" }],
      ops,
      ...extra,
    });
  };
  snap("start", "Build an order where every course comes after its prerequisites (a topological order). DFS into each course's prerequisites first, and add the course to the order only after all of them are in. A course met again while still on the DFS path means a cycle: no order exists.");
  const dfs = (c: number): boolean => {
    ops++;
    if (cycle.includes(c)) {
      bad = c;
      cur = c;
      snap("cycle", `Course ${c} is already on the path ${cycle.join(" → ")}: a cycle. No valid order exists, so return [].`);
      return false;
    }
    if (visit.has(c)) {
      cur = c;
      snap("seen", `Course ${c} is already in the order: nothing more to do.`);
      return true;
    }
    cycle.push(c);
    cur = c;
    snap("visit", pre[c].length ? `Course ${c} needs ${pre[c].join(", ")}: put those in the order first.` : `Course ${c} has no prerequisites.`);
    for (const p of pre[c]) {
      ops++;
      if (!dfs(p)) return false;
    }
    cycle.pop();
    visit.add(c);
    output.push(c);
    cur = c;
    snap("add", `Everything course ${c} needs is in the order, so add ${c}: ${showOrder(output)}.`);
    return true;
  };
  for (let c = 0; c < n; c++)
    if (!dfs(c)) {
      snap("done", "There's a cycle, so no order can take every course. Return [].", { done: true, answer: "[]" });
      return steps;
    }
  cur = null;
  snap("done", `Every course is in the order: ${showOrder(output)}. Each one comes after all of its prerequisites.`, { done: true, answer: showOrder(output) });
  return steps;
}

/** Orders differ between methods, so compare which courses are scheduled (all or none); a separate test checks the order itself. */
const canon = (a: unknown) => {
  const s = String(a);
  return s === "[]" ? "[]" : `[${s.slice(1, -1).split(", ").map(Number).sort((x, y) => x - y).join(", ")}]`;
};

export const courseSchedule2: PatternProblem<Input> = {
  id: "course-schedule-ii",
  title: "Course Schedule II",
  difficulty: "Medium",
  blind75: false,
  slug: "course-schedule-ii",
  video: "Akt3glAwyfY",
  statement: "There are n courses, 0 to n − 1. prerequisites[i] = [a, b] means you must take b before a. Return an order to take all the courses, or [] if it's impossible. Any valid order is accepted.",
  examples: [
    { label: "LeetCode's example 2", input: { n: 4, prereqs: [[1, 0], [2, 0], [3, 1], [3, 2]] } },
    { label: "a cycle", input: { n: 3, prereqs: [[0, 1], [1, 2], [2, 0]] } },
    { label: "two separate chains", input: { n: 5, prereqs: [[0, 1], [1, 2], [3, 4]] } },
  ],
  random: randomCourses,
  big: { label: "60 courses in one long chain", input: () => chainCourses(60) },
  describe: ({ n, prereqs }) => `numCourses = ${n}, prerequisites = ${showPairs(prereqs)}`,
  run,
  solve: (input) => showOrder(takeWhatsReady(input).order),
  brute: (input) => {
    const { order, ops } = takeWhatsReady(input);
    return { answer: showOrder(order), ops };
  },
  canon,
  bruteIdea: "Keep scanning every course for one whose prerequisites are all taken, add it, and scan again. On a long chain that's one course per full scan: O(V × (V + E)).",
  guide: {
    title: "Course Schedule II",
    idea: [
      "Same graph as Course Schedule, but now return the order. A course can go in the order once all its prerequisites are in it. DFS does exactly that: recurse into the prerequisites, then append the course (a post-order).",
      "Two sets: visit (already in the order: skip) and the current path (meeting it again is a cycle: return []).",
    ],
    whenToUse: ["“Give an order that respects dependencies”: topological sort, by DFS post-order or Kahn's algorithm (repeatedly take a node with no incoming edges).", "Build systems, task scheduling, spreadsheet recalculation."],
    stages: [
      { id: "start", title: "Prerequisite lists, empty order", detail: "", pseudo: "output = []; visit, cycle = set(), set()" },
      { id: "visit", title: "On the path; do its prerequisites first", detail: "", pseudo: "cycle.add(crs); for pre in pre_map[crs]: if not dfs(pre): return False" },
      { id: "seen", title: "Already in the order → skip", detail: "", pseudo: "if crs in visit: return True" },
      { id: "add", title: "All prerequisites in → append the course", detail: "", pseudo: "cycle.remove(crs); visit.add(crs); output.append(crs)" },
      { id: "cycle", title: "On the path again → cycle", detail: "", pseudo: "if crs in cycle: return False" },
      { id: "done", title: "The order (or [])", detail: "", pseudo: "return output" },
    ],
    legend: [
      { tone: "current", label: "Course being handled" },
      { tone: "compare", label: "On the DFS path" },
      { tone: "found", label: "In the order (#position)" },
      { tone: "swap", label: "Cycle" },
    ],
    complexity: { time: "O(V + E)", space: "O(V + E)", why: "Each course is added once and each prerequisite edge followed once." },
    pitfalls: ["Append after the recursive calls, not before: a course must come after its prerequisites.", "There are usually many valid orders; any one is accepted."],
    tryThis: ["In example 2, 1 and 2 can come in either order, but both come after 0 and before 3.", "In “two separate chains”, the DFS from course 0 adds 2, 1, 0 (deepest prerequisite first), then the one from 3 adds 4, 3."],
    python: py,
  },
};
