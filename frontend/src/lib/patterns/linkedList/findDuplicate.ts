// Find the Duplicate Number (NeetCode 150 · Linked List).

import py from "../../guides/python/neetcode/find_duplicate.py?raw";
import { row, rngFor, show } from "../helpers";
import type { LEdge, LNode, PatternProblem, PatternStep } from "../types";

type Input = number[];

function run(nums: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  // The path from index 0: 0 → nums[0] → nums[nums[0]] → … until it repeats.
  const path: number[] = [];
  for (let i = 0; !path.includes(i); i = nums[i]) path.push(i);
  const col = new Map(path.map((v, k) => [v, k]));
  let ops = 0;
  const snap = (stage: string, ptrs: [string, number][], explanation: string, hit: number | null = null, extra: Partial<PatternStep> = {}) => {
    const tagAt = new Map<number, string>();
    for (const [name, i] of ptrs) tagAt.set(i, tagAt.has(i) ? `${tagAt.get(i)} ${name}` : name);
    const nodes: LNode[] = path.map((i) => ({ id: `i${i}`, v: String(i), row: 0, col: col.get(i)!, tone: i === hit ? "found" : ptrs.some(([, p]) => p === i) ? "current" : undefined, tag: tagAt.get(i) }));
    const edges: LEdge[] = path.map((i) => ({ from: `i${i}`, to: `i${nums[i]}`, tone: col.get(nums[i])! <= col.get(i)! ? "visited" : undefined }));
    steps.push({
      stage,
      explanation,
      rows: [row("nums (index below)", nums, Object.fromEntries(ptrs.map(([, i]) => [i, "current"])), Object.fromEntries(nums.map((_, i) => [i, `i=${i}`])))],
      links: { title: "index i points to index nums[i] (only the path from 0 is drawn)", nodes, edges },
      vars: ptrs.map(([name, i]) => ({ name, value: `index ${i}` })),
      ops,
      ...extra,
    });
  };
  snap("start", [["slow", 0], ["fast", 0]], "Read each index i as a node with an arrow to index nums[i]. Values go from 1 to n, so two indexes holding the same value point to the same node: that node has two arrows in, which is where a loop starts. Find the loop's start with Floyd's algorithm.");
  let slow = 0;
  let fast = 0;
  do {
    slow = nums[slow];
    fast = nums[nums[fast]];
    ops += 3;
    snap("chase", [["slow", slow], ["fast", fast]], slow === fast ? `slow moves 1 to ${slow}, fast moves 2 to ${fast}. They meet inside the loop.` : `slow moves 1 to ${slow}, fast moves 2 to ${fast}.`);
  } while (slow !== fast);
  let slow2 = 0;
  snap("find", [["slow", slow], ["slow2", slow2]], "Phase 2: start slow2 at index 0 and move it and slow one step at a time. Floyd's maths says they meet exactly where the loop starts.");
  while (slow !== slow2) {
    slow = nums[slow];
    slow2 = nums[slow2];
    ops += 2;
    if (slow === slow2) break;
    snap("find", [["slow", slow], ["slow2", slow2]], `Both move one step: slow to ${slow}, slow2 to ${slow2}.`);
  }
  snap("done", [["slow", slow], ["slow2", slow2]], `They meet at ${slow}: the start of the loop, the node with two arrows in. ${slow} is the duplicate.`, slow, { done: true, answer: String(slow) });
  return steps;
}

export const findDuplicate: PatternProblem<Input> = {
  id: "find-duplicate",
  title: "Find the Duplicate Number",
  difficulty: "Medium",
  blind75: false,
  slug: "find-the-duplicate-number",
  video: "wjYnzkAhcNk",
  statement: "nums has n + 1 numbers, each between 1 and n, so at least one repeats. Exactly one value is repeated (possibly more than twice). Find it without changing nums and with O(1) extra memory.",
  examples: [
    { label: "[1,3,4,2,2]", input: [1, 3, 4, 2, 2] },
    { label: "[3,1,3,4,2]", input: [3, 1, 3, 4, 2] },
    { label: "[2,6,4,1,3,1,5]", input: [2, 6, 4, 1, 3, 1, 5] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const n = g.int(3, 8);
    const vals = Array.from({ length: n }, (_, i) => i + 1);
    return g.shuffle([...vals, g.pick(vals)]);
  },
  big: { label: "200 numbers", input: () => [...Array.from({ length: 199 }, (_, i) => i + 1), 199] },
  describe: (nums) => `nums = ${show(nums)}`,
  run,
  solve: (nums) => nums.find((v, i) => nums.indexOf(v) !== i)!,
  brute: (nums) => {
    let ops = 0;
    for (let i = 0; i < nums.length; i++)
      for (let j = i + 1; j < nums.length; j++) {
        ops++;
        if (nums[i] === nums[j]) return { answer: nums[i], ops };
      }
    return { answer: -1, ops };
  },
  bruteIdea: "Compare every pair: O(n²). A hash set or sorting is faster but breaks the rules (O(n) memory, or changing nums).",
  guide: {
    title: "Find the Duplicate Number",
    idea: [
      "Turn the array into a linked list: index i points to index nums[i]. Start at index 0 (no value is 0, so nothing points back to it). Following the arrows must loop eventually, and the duplicate value is the node two arrows point to, the entrance to the loop.",
      "Floyd's algorithm finds a loop's entrance in two phases. Phase 1: slow and fast run until they meet inside the loop. Phase 2: a new pointer starts at 0; move it and slow one step at a time, and they meet exactly at the entrance.",
    ],
    whenToUse: ["Values that are valid indexes (1..n in an array of n + 1): treat them as next pointers.", "Any “find where the loop starts” question: Floyd's two phases."],
    stages: [
      { id: "start", title: "slow = fast = 0", detail: "", pseudo: "slow = fast = 0" },
      { id: "chase", title: "Phase 1: meet in the loop", detail: "slow = nums[slow]; fast = nums[nums[fast]].", pseudo: "while True: slow = nums[slow]; fast = nums[nums[fast]]; if slow == fast: break" },
      { id: "find", title: "Phase 2: walk from 0 and from the meeting point", detail: "One step each until they meet.", pseudo: "slow2 = 0; while slow != slow2: slow, slow2 = nums[slow], nums[slow2]" },
      { id: "done", title: "Where they meet = the duplicate", detail: "", pseudo: "return slow" },
    ],
    legend: [
      { tone: "current", label: "Pointers" },
      { tone: "visited", label: "Arrow back into the loop" },
      { tone: "found", label: "The duplicate" },
    ],
    complexity: { time: "O(n)", space: "O(1)", why: "Both phases take at most a few laps of a path of length ≤ n + 1." },
    pitfalls: ["Start at index 0, not at nums[0], in both phases.", "Phase 2 must move both pointers one step at a time."],
    tryThis: ["Pick “[3,1,3,4,2]”: 0 → 3 → 4 → 2 → 3, so the loop starts at 3.", "Compare with Linked List Cycle: same phase 1, plus a second phase."],
    python: py,
  },
};
