// Top K Frequent Elements (NeetCode 150 · Arrays & Hashing).

import py from "../../guides/python/neetcode/top_k_frequent.py?raw";
import { row, rngFor, show } from "../helpers";
import type { PCell, PatternProblem, PatternStep } from "../types";

interface Input {
  nums: number[];
  k: number;
}

function run({ nums, k }: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const count = new Map<number, number>();
  let ops = 0;
  const buckets: number[][] = Array.from({ length: nums.length + 1 }, () => []);
  const result: number[] = [];
  const countEntries = (hi?: number) => [...count.entries()].map(([kk, v]) => ({ k: String(kk), v: `${v}×`, tone: kk === hi ? ("current" as const) : result.includes(kk) ? ("found" as const) : undefined }));
  const bucketRow = (hi?: number) => ({
    label: "bucket[f]",
    cells: buckets.map((b, f): PCell => ({ v: b.length ? b.join(",") : "·", tone: f === hi ? "current" : b.some((x) => result.includes(x)) ? "found" : undefined, tag: String(f) })),
  });
  const vars = () => [
    { name: "k", value: String(k) },
    { name: "result", value: show(result), tone: "found" as const },
  ];

  nums.forEach((n, i) => {
    count.set(n, (count.get(n) ?? 0) + 1);
    ops++;
    steps.push({ stage: "count", explanation: `Count ${n}: seen ${count.get(n)} time${count.get(n) === 1 ? "" : "s"} so far.`, rows: [row("nums", nums, { [i]: "current" }, { [i]: "↑" }), bucketRow()], map: { title: "value → count", entries: countEntries(n) }, vars: vars(), ops });
  });
  for (const [n, f] of count) {
    buckets[f].push(n);
    ops++;
    steps.push({ stage: "bucket", explanation: `${n} appears ${f} time${f === 1 ? "" : "s"}, so put it in bucket ${f}. A frequency can't exceed ${nums.length}, so there are only ${nums.length + 1} buckets.`, rows: [row("nums", nums), bucketRow(f)], map: { title: "value → count", entries: countEntries(n) }, vars: vars(), ops });
  }
  for (let f = buckets.length - 1; f > 0 && result.length < k; f--) {
    ops++;
    if (!buckets[f].length) continue;
    for (const n of buckets[f]) {
      result.push(n);
      if (result.length === k) break;
    }
    steps.push({ stage: "collect", explanation: `Walk the buckets from the highest frequency down. Bucket ${f} gives ${buckets[f].join(", ")}.`, rows: [row("nums", nums), bucketRow(f)], map: { title: "value → count", entries: countEntries() }, vars: vars(), ops });
  }
  steps.push({ stage: "done", explanation: `We have ${k} value${k === 1 ? "" : "s"}: ${show(result)}.`, rows: [row("nums", nums), bucketRow()], map: { title: "value → count", entries: countEntries() }, vars: vars(), ops, done: true, answer: show(result) });
  return steps;
}

export const topKFrequent: PatternProblem<Input> = {
  id: "top-k-frequent",
  title: "Top K Frequent Elements",
  difficulty: "Medium",
  blind75: true,
  slug: "top-k-frequent-elements",
  video: "YPTqKIgVk-k",
  statement: "Given a list of numbers and k, return the k numbers that appear most often, in any order. The answer is guaranteed to be unique.",
  examples: [
    { label: "[1,1,1,2,2,3], k=2", input: { nums: [1, 1, 1, 2, 2, 3], k: 2 } },
    { label: "[4,1,4,7,1,4,9,4,7,1], k=2", input: { nums: [4, 1, 4, 7, 1, 4, 9, 4, 7, 1], k: 2 } },
    { label: "[5], k=1", input: { nums: [5], k: 1 } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const vals = g.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, g.int(3, 5));
    const freqs = g.shuffle([1, 2, 3, 4, 5]).slice(0, vals.length);
    const k = g.int(1, vals.length - 1);
    const nums = g.shuffle(vals.flatMap((v, i) => Array(freqs[i]).fill(v)));
    return { nums, k };
  },
  big: { label: "190 numbers, 19 values, k = 3", input: () => ({ nums: rngFor(5).shuffle(Array.from({ length: 19 }, (_, v) => Array(v + 1).fill(v + 1)).flat()), k: 3 }) },
  describe: ({ nums, k }) => `nums = ${show(nums)}, k = ${k}`,
  run,
  solve: ({ nums, k }) => {
    const c = new Map<number, number>();
    for (const n of nums) c.set(n, (c.get(n) ?? 0) + 1);
    return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, k).map(([n]) => n);
  },
  brute: ({ nums, k }) => {
    let ops = 0;
    const distinct: number[] = [];
    const freq: number[] = [];
    for (const n of nums) {
      let c = 0;
      for (const m of nums) {
        ops++;
        if (m === n) c++;
      }
      if (!distinct.includes(n)) {
        distinct.push(n);
        freq.push(c);
      }
    }
    const out: number[] = [];
    for (let t = 0; t < k; t++) {
      let best = -1;
      for (let i = 0; i < distinct.length; i++) {
        ops++;
        if (!out.includes(distinct[i]) && (best < 0 || freq[i] > freq[best])) best = i;
      }
      out.push(distinct[best]);
    }
    return { answer: out, ops };
  },
  bruteIdea: "Count each number by scanning the whole list again (n² reads), then pick the most frequent k times.",
  canon: (a) => [...(a as number[])].sort((x, y) => x - y),
  guide: {
    title: "Top K Frequent Elements",
    idea: [
      "Step one is always the same: count with a hash map. The question is how to get the top k counts quickly.",
      "Sorting by count costs O(n log n). A heap of size k costs O(n log k). NeetCode's trick is bucket sort: a number can appear at most n times, so make buckets 0…n, drop each number into the bucket for its count, then read buckets from the top. That's O(n).",
    ],
    whenToUse: ["“Top k”, “k most frequent”, “k largest”: a heap, or bucket sort when the values being ranked (here, counts) are small integers.", "Bucket sort works whenever the thing you sort by has a known small range."],
    stages: [
      { id: "count", title: "Count each number", detail: "One pass with a hash map.", pseudo: "count[n] += 1" },
      { id: "bucket", title: "Bucket by count", detail: "Put each number in the bucket for its frequency.", pseudo: "buckets[freq].append(n)" },
      { id: "collect", title: "Read from the top", detail: "Walk buckets from frequency n down, collecting numbers until there are k.", pseudo: "for f in range(n, 0, -1): ..." },
      { id: "done", title: "k numbers collected", detail: "Those are the most frequent.", pseudo: "return result" },
    ],
    legend: [
      { tone: "current", label: "Being counted or bucketed" },
      { tone: "found", label: "In the answer" },
    ],
    complexity: { time: "O(n)", space: "O(n)", why: "Counting is one pass, there are n + 1 buckets, and each number goes into exactly one bucket." },
    pitfalls: [
      "Bucket size is n + 1 (frequencies 0 to n), not the number of distinct values.",
      "A heap (heapq.nlargest(k, count, key=count.get)) is a perfectly good O(n log k) answer; know both.",
    ],
    tryThis: ["Pick “[4,1,4,7,1,4,9,4,7,1], k=2” and watch 4 land in bucket 4.", "Press “Random”: the two operation counts grow very differently."],
    python: py,
  },
};
