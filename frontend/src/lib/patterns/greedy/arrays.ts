// The array-scanning Greedy problems of the NeetCode 150: Maximum Subarray,
// Jump Game, Jump Game II, Gas Station and Partition Labels.

import gasPy from "../../guides/python/neetcode/gas_station.py?raw";
import jump2Py from "../../guides/python/neetcode/jump_game_ii.py?raw";
import jumpPy from "../../guides/python/neetcode/jump_game.py?raw";
import kadanePy from "../../guides/python/neetcode/max_subarray.py?raw";
import labelsPy from "../../guides/python/neetcode/partition_labels.py?raw";
import type { VizTone } from "../../guides/types";
import { row, rngFor, show } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";

const tones = (n: number, f: (i: number) => VizTone | undefined) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, f(i)]));
const tags = (n: number, f: (i: number) => string | undefined) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, f(i)]));

// ---------------------------------------------------------------- Maximum subarray

function kadaneRun(nums: number[]): PatternStep[] {
  const steps: PatternStep[] = [];
  let cur = 0;
  let start = 0;
  let best = nums[0];
  let bestAt: [number, number] = [0, 0];
  let ops = 0;
  const snap = (stage: string, explanation: string, i: number, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [row("nums", nums, tones(nums.length, (j) => (j === i ? "current" : j >= start && j < i ? "pointer" : j >= bestAt[0] && j <= bestAt[1] ? "found" : undefined)), tags(nums.length, (j) => (j === start && i >= 0 ? "start" : undefined)))],
      vars: [
        { name: "running sum", value: String(cur) },
        { name: "best sum", value: String(best), tone: "found" },
      ],
      ops,
      ...extra,
    });
  snap("start", "Kadane's algorithm: walk left to right, keeping the sum of the best subarray that ends here. If that running sum ever goes negative, it can only hurt whatever comes next, so drop it and start fresh.", -1);
  nums.forEach((v, i) => {
    ops++;
    let note = "";
    if (cur < 0) {
      note = `The running sum ${cur} is negative: dropping it helps, so start a new subarray at ${i}. `;
      cur = 0;
      start = i;
    }
    cur += v;
    const better = cur > best;
    if (better) {
      best = cur;
      bestAt = [start, i];
    }
    snap(note ? "reset" : "extend", `${note}Add ${v}: running sum ${cur}.${better ? ` New best: ${best} (indexes ${start}..${i}).` : ""}`, i);
  });
  snap("done", `The largest subarray sum is ${best}, from index ${bestAt[0]} to ${bestAt[1]}.`, -1, { done: true, answer: String(best) });
  return steps;
}
function kadaneSlow(nums: number[]) {
  let ops = 0;
  let best = -Infinity;
  for (let i = 0; i < nums.length; i++) {
    let s = 0;
    for (let j = i; j < nums.length; j++) {
      ops++;
      s += nums[j];
      best = Math.max(best, s);
    }
  }
  return { answer: best, ops };
}

export const maxSubarray: PatternProblem<number[]> = {
  id: "max-subarray",
  title: "Maximum Subarray",
  difficulty: "Medium",
  blind75: true,
  slug: "maximum-subarray",
  video: "5WZl3MMT0Eg",
  statement: "Return the largest sum of a non-empty contiguous subarray.",
  examples: [
    { label: "LeetCode's example 1", input: [-2, 1, -3, 4, -1, 2, 1, -5, 4] },
    { label: "all negative", input: [-3, -1, -2] },
    { label: "LeetCode's example 3", input: [5, 4, -1, 7, 8] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return Array.from({ length: g.int(1, 9) }, () => g.int(-6, 6));
  },
  big: { label: "300 numbers", input: () => Array.from({ length: 300 }, (_, i) => ((i * 37) % 19) - 9) },
  describe: (n) => `nums = ${show(n)}`,
  run: kadaneRun,
  solve: (n) => kadaneSlow(n).answer,
  brute: kadaneSlow,
  bruteIdea: "Add up every subarray: n²/2 of them, O(n²) even when each sum extends the previous one.",
  guide: {
    title: "Maximum Subarray",
    idea: [
      "Keep the best sum of a subarray ending at the current position. Extending it by the next number is always right, unless the running sum is negative: then the next subarray is better off starting fresh.",
      "Why that's safe: a negative prefix makes every sum that includes it smaller, so no optimal subarray starts with one. The answer is the largest running sum seen.",
    ],
    whenToUse: ["Best contiguous run of anything additive: Kadane's algorithm.", "Greedy rule: drop a prefix as soon as it stops helping."],
    stages: [
      { id: "start", title: "Running sum 0", detail: "", pseudo: "max_sub, cur_sum = nums[0], 0" },
      { id: "extend", title: "Add the next number", detail: "", pseudo: "cur_sum += n; max_sub = max(max_sub, cur_sum)" },
      { id: "reset", title: "Negative running sum → start over", detail: "", pseudo: "if cur_sum < 0: cur_sum = 0" },
      { id: "done", title: "The best sum", detail: "", pseudo: "return max_sub" },
    ],
    legend: [
      { tone: "current", label: "Number being added" },
      { tone: "pointer", label: "Current subarray" },
      { tone: "found", label: "Best subarray so far" },
    ],
    complexity: { time: "O(n)", space: "O(1)", why: "One pass, two numbers." },
    pitfalls: ["All negative: the answer is the largest single number, not 0.", "Reset before adding, so a negative number alone can still be the best."],
    tryThis: ["LeetCode's example 1: [4, −1, 2, 1] sums to 6.", "“All negative” returns −1."],
    python: kadanePy,
  },
};

// ---------------------------------------------------------------- Jump game

function jumpRun(nums: number[]): PatternStep[] {
  const steps: PatternStep[] = [];
  const n = nums.length;
  let goal = n - 1;
  let ops = 0;
  const snap = (stage: string, explanation: string, i: number, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [row("nums (max jump from each index)", nums, tones(n, (j) => (j === i ? "current" : j === goal ? "found" : j > goal ? "idle" : undefined)), tags(n, (j) => (j === goal ? "goal" : undefined)))],
      vars: [{ name: "goal", value: `index ${goal}`, tone: "found" }],
      ops,
      ...extra,
    });
  snap("start", "Work backwards. The goal starts at the last index. Any index that can jump to the goal (or past it) can reach the end, so it becomes the new goal. If the goal gets all the way to index 0, the end is reachable from the start.", -1);
  for (let i = n - 2; i >= 0; i--) {
    ops++;
    if (i + nums[i] >= goal) {
      const old = goal;
      goal = i;
      snap("move", `Index ${i} can jump up to ${nums[i]}, reaching ${i + nums[i]} ≥ the goal ${old}. So the end is reachable from ${i}: the goal moves to ${i}.`, i);
    } else snap("short", `Index ${i} can reach at most ${i + nums[i]}, short of the goal ${goal}. It doesn't move the goal.`, i);
  }
  snap("done", goal === 0 ? "The goal reached index 0: the end is reachable." : `The goal stopped at ${goal}: index 0 can't get there, so the end isn't reachable.`, -1, { done: true, answer: String(goal === 0) });
  return steps;
}
function jumpSlow(nums: number[]) {
  // Mark every index reachable from the start, one jump at a time.
  const ok = Array<boolean>(nums.length).fill(false);
  ok[0] = true;
  let ops = 0;
  for (let i = 0; i < nums.length; i++) {
    if (!ok[i]) continue;
    for (let k = 1; k <= nums[i] && i + k < nums.length; k++) {
      ops++;
      ok[i + k] = true;
    }
  }
  return { answer: ok[nums.length - 1], ops };
}

export const jumpGame: PatternProblem<number[]> = {
  id: "jump-game",
  title: "Jump Game",
  difficulty: "Medium",
  blind75: true,
  slug: "jump-game",
  video: "Yan0cv2cLy8",
  statement: "Start at index 0. nums[i] is the furthest you can jump from i. Return true if you can reach the last index.",
  examples: [
    { label: "LeetCode's example 1", input: [2, 3, 1, 1, 4] },
    { label: "LeetCode's example 2 (stuck at 0)", input: [3, 2, 1, 0, 4] },
    { label: "one long jump", input: [5, 0, 0, 0, 0] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return Array.from({ length: g.int(1, 8) }, () => g.int(0, 3));
  },
  big: { label: "300 indexes with big jumps", input: () => Array.from({ length: 300 }, (_, i) => (i % 7 === 3 ? 0 : 40)) },
  describe: (n) => `nums = ${show(n)}`,
  run: jumpRun,
  solve: (n) => jumpSlow(n).answer,
  brute: jumpSlow,
  bruteIdea: "Mark every index you can land on, one possible jump at a time: up to nums[i] marks per index, O(n × max jump).",
  guide: {
    title: "Jump Game",
    idea: [
      "Ask “can index i reach the end?” from the right. The last index trivially can. Going left, index i can if it can jump to any index that can, and it's enough to check the closest such index, the goal: if i + nums[i] ≥ goal, i becomes the new goal.",
      "Why the closest is enough: if i can't reach the closest good index, it can't reach a farther one either. At the end, check whether the goal is 0.",
    ],
    whenToUse: ["Reachability along a line with jumps: track the frontier (a goal from the right, or the farthest reach from the left).", "Greedy works because the set of good indexes only needs its nearest member."],
    stages: [
      { id: "start", title: "Goal = last index", detail: "", pseudo: "goal = len(nums) - 1" },
      { id: "move", title: "Can reach the goal → it's the new goal", detail: "", pseudo: "if i + nums[i] >= goal: goal = i" },
      { id: "short", title: "Can't reach it", detail: "", pseudo: "" },
      { id: "done", title: "Goal at 0?", detail: "", pseudo: "return goal == 0" },
    ],
    legend: [
      { tone: "current", label: "Index being checked" },
      { tone: "found", label: "The goal" },
      { tone: "idle", label: "Already handled" },
    ],
    complexity: { time: "O(n)", space: "O(1)", why: "One pass from the right." },
    pitfalls: ["A 0 isn't fatal unless every route has to stop on it.", "Reaching past the last index counts."],
    tryThis: ["In example 2, every route lands on the 0 at index 3.", "“One long jump” moves the goal straight to 0."],
    python: jumpPy,
  },
};

// ---------------------------------------------------------------- Jump game II

function jump2Run(nums: number[]): PatternStep[] {
  const steps: PatternStep[] = [];
  const n = nums.length;
  let l = 0;
  let r = 0;
  let jumps = 0;
  let ops = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [row("nums", nums, tones(n, (j) => (j >= l && j <= r ? (j === n - 1 ? "found" : "current") : j < l ? "idle" : undefined)), tags(n, (j) => (j === l && j === r ? "L R" : j === l ? "L" : j === r ? "R" : undefined)))],
      vars: [{ name: "jumps", value: String(jumps), tone: "found" }],
      ops,
      ...extra,
    });
  snap("start", "Think in layers, like BFS: the window L..R holds every index reachable with the current number of jumps. The next window is everything one jump past it: up to the farthest any index in the window can reach.");
  while (r < n - 1) {
    let far = 0;
    for (let i = l; i <= r; i++) {
      ops++;
      far = Math.max(far, i + nums[i]);
    }
    const [ol, or] = [l, r];
    l = r + 1;
    r = far;
    jumps++;
    snap("layer", `From indexes ${ol}..${or}, the farthest anyone reaches is ${far}. So with ${jumps} jump${jumps === 1 ? "" : "s"} you can stand anywhere in ${l}..${Math.min(r, n - 1)}.${r >= n - 1 ? " That includes the last index." : ""}`);
  }
  snap("done", `The last index is in the window after ${jumps} jump${jumps === 1 ? "" : "s"}: the minimum.`, { done: true, answer: String(jumps) });
  return steps;
}
function jump2Slow(nums: number[]) {
  // dp[i] = fewest jumps to reach i, trying every jump from every index.
  const dp = Array<number>(nums.length).fill(Infinity);
  dp[0] = 0;
  let ops = 0;
  for (let i = 0; i < nums.length; i++)
    for (let k = 1; k <= nums[i] && i + k < nums.length; k++) {
      ops++;
      dp[i + k] = Math.min(dp[i + k], dp[i] + 1);
    }
  return { answer: dp[nums.length - 1], ops };
}

export const jumpGame2: PatternProblem<number[]> = {
  id: "jump-game-ii",
  title: "Jump Game II",
  difficulty: "Medium",
  blind75: false,
  slug: "jump-game-ii",
  video: "dJ7sWiOoK7g",
  statement: "Start at index 0; nums[i] is the furthest you can jump from i. The last index is always reachable. Return the fewest jumps to get there.",
  examples: [
    { label: "LeetCode's example 1", input: [2, 3, 1, 1, 4] },
    { label: "LeetCode's example 2", input: [2, 3, 0, 1, 4] },
    { label: "small steps", input: [1, 1, 1, 1] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    // Every value ≥ 1 keeps the end reachable, as LeetCode promises.
    return Array.from({ length: g.int(1, 8) }, () => g.int(1, 3));
  },
  big: { label: "300 indexes, jumps of 1 to 60", input: () => Array.from({ length: 300 }, (_, i) => ((i * 13) % 60) + 1) },
  describe: (n) => `nums = ${show(n)}`,
  run: jump2Run,
  solve: (n) => jump2Slow(n).answer,
  brute: jump2Slow,
  bruteIdea: "DP: for every index, try every jump length and update the fewest jumps to each landing spot: O(n × max jump).",
  guide: {
    title: "Jump Game II",
    idea: [
      "It's a BFS on a line. All indexes reachable in exactly k jumps form a contiguous window L..R. The next window starts at R + 1 and ends at the farthest point any index in L..R can reach.",
      "Count windows until one contains the last index. Each index is looked at once, so it's O(n).",
    ],
    whenToUse: ["Fewest steps when each position reaches a range: expand windows (BFS layers) instead of a queue.", "Greedy: within a layer, only the farthest reach matters."],
    stages: [
      { id: "start", title: "Window 0..0, 0 jumps", detail: "", pseudo: "res = 0; l = r = 0" },
      { id: "layer", title: "Next window: up to the farthest reach", detail: "", pseudo: "farthest = max(i + nums[i] for i in range(l, r + 1)); l = r + 1; r = farthest; res += 1" },
      { id: "done", title: "The window holds the last index", detail: "", pseudo: "return res" },
    ],
    legend: [
      { tone: "current", label: "Reachable with this many jumps" },
      { tone: "idle", label: "Reachable with fewer" },
      { tone: "found", label: "The last index" },
    ],
    complexity: { time: "O(n)", space: "O(1)", why: "Each index belongs to one window and is scanned once." },
    pitfalls: ["Count a jump per window, not per index inside it.", "A single element needs 0 jumps."],
    tryThis: ["LeetCode's example 1: 2 jumps (0 → 1 → 4).", "“Small steps” takes 3 one-step jumps."],
    python: jump2Py,
  },
};

// ---------------------------------------------------------------- Gas station

type Gas = { gas: number[]; cost: number[] };

function gasRun({ gas, cost }: Gas): PatternStep[] {
  const steps: PatternStep[] = [];
  const n = gas.length;
  const sg = gas.reduce((a, b) => a + b, 0);
  const sc = cost.reduce((a, b) => a + b, 0);
  let tank = 0;
  let start = 0;
  let ops = 0;
  const diff = gas.map((g, i) => g - cost[i]);
  const snap = (stage: string, explanation: string, i: number, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [
        row("gas", gas),
        row("cost to the next station", cost),
        row("gas − cost", diff, tones(n, (j) => (j === i ? "current" : j >= start && j < i ? "pointer" : j < start ? "idle" : undefined)), tags(n, (j) => (j === start ? "start" : undefined))),
      ],
      vars: [
        { name: "total gas − total cost", value: String(sg - sc), tone: sg >= sc ? "found" : "swap" },
        { name: "tank", value: String(tank) },
      ],
      ops,
      ...extra,
    });
  snap("start", `First, if the total gas (${sg}) is less than the total cost (${sc}), no start works. Otherwise exactly one start works, and a single pass finds it: drive from a candidate start; whenever the tank goes negative, no station from the start up to here can be the answer, so the next station becomes the candidate.`, -1);
  if (sg < sc) {
    snap("done", "Not enough gas in total: return −1.", -1, { done: true, answer: "-1" });
    return steps;
  }
  for (let i = 0; i < n; i++) {
    ops++;
    tank += diff[i];
    if (tank < 0) {
      snap("fail", `At station ${i} the tank is ${tank}: starting at ${start} fails here${start < i ? `, and so would starting anywhere from ${start + 1} to ${i} (they'd arrive with even less)` : ""}. Next candidate: ${i + 1}.`, i);
      tank = 0;
      start = i + 1;
    } else snap("drive", `Station ${i}: gain ${gas[i]}, spend ${cost[i]}, tank ${tank}. Still fine.`, i);
  }
  snap("done", `Start at station ${start}: from there the tank never runs dry, and the total says the rest of the loop works too.`, -1, { done: true, answer: String(start) });
  return steps;
}
function gasSlow({ gas, cost }: Gas) {
  const n = gas.length;
  let ops = 0;
  for (let s = 0; s < n; s++) {
    let tank = 0;
    let ok = true;
    for (let k = 0; k < n; k++) {
      ops++;
      const i = (s + k) % n;
      tank += gas[i] - cost[i];
      if (tank < 0) {
        ok = false;
        break;
      }
    }
    if (ok) return { answer: s, ops };
  }
  return { answer: -1, ops };
}

export const gasStation: PatternProblem<Gas> = {
  id: "gas-station",
  title: "Gas Station",
  difficulty: "Medium",
  blind75: false,
  slug: "gas-station",
  video: "lJwbPZGo05A",
  statement: "Stations on a loop: gas[i] is the fuel at station i and cost[i] the fuel to drive to the next. Starting with an empty tank, return the station from which you can drive all the way round, or −1. The answer is unique if it exists.",
  examples: [
    { label: "LeetCode's example 1", input: { gas: [1, 2, 3, 4, 5], cost: [3, 4, 5, 1, 2] } },
    { label: "LeetCode's example 2 (−1)", input: { gas: [2, 3, 4], cost: [3, 4, 3] } },
    { label: "start at 0", input: { gas: [4, 1, 2], cost: [2, 2, 2] } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const n = g.int(1, 6);
    return { gas: Array.from({ length: n }, () => g.int(0, 5)), cost: Array.from({ length: n }, () => g.int(0, 5)) };
  },
  // Every start but the last drives almost all the way round before running dry at station 298.
  big: { label: "300 stations, a shortfall near the end", input: () => ({ gas: Array.from({ length: 300 }, (_, i) => (i === 299 ? 2 : 1)), cost: Array.from({ length: 300 }, (_, i) => (i === 298 ? 2 : 1)) }) },
  describe: ({ gas, cost }) => `gas = ${show(gas)}, cost = ${show(cost)}`,
  run: gasRun,
  solve: (i) => gasSlow(i).answer,
  brute: gasSlow,
  bruteIdea: "Try every start and simulate the trip round the loop: O(n²).",
  guide: {
    title: "Gas Station",
    idea: [
      "If total gas < total cost, no start works. Otherwise drive once round from a candidate start, keeping the tank. When it goes negative at station i, the start fails, and so does every station between it and i: each of those would have arrived at i with no more fuel. So the next candidate is i + 1.",
      "The candidate left at the end is the answer: the total being enough guarantees the part of the loop before it works out.",
    ],
    whenToUse: ["Circular trips with a running balance: one pass, resetting the start when the balance goes negative.", "Use a global check (the total) to avoid re-simulating."],
    stages: [
      { id: "start", title: "Enough gas in total?", detail: "", pseudo: "if sum(gas) < sum(cost): return -1" },
      { id: "drive", title: "Add gas − cost", detail: "", pseudo: "total += gas[i] - cost[i]" },
      { id: "fail", title: "Tank negative → start after here", detail: "", pseudo: "if total < 0: total = 0; res = i + 1" },
      { id: "done", title: "The last candidate", detail: "", pseudo: "return res" },
    ],
    legend: [
      { tone: "current", label: "Station being passed" },
      { tone: "pointer", label: "Driven from the candidate start" },
      { tone: "idle", label: "Ruled out as starts" },
    ],
    complexity: { time: "O(n)", space: "O(1)", why: "One pass round the stations." },
    pitfalls: ["Checking only the total isn't enough: you also need the start.", "Skipping straight to i + 1 is what makes it O(n)."],
    tryThis: ["LeetCode's example 1: stations 0, 1 and 2 fail; 3 works.", "Example 2 has 9 gas for 10 cost: −1 straight away."],
    python: gasPy,
  },
};

// ---------------------------------------------------------------- Partition labels

function labelsRun(s: string): PatternStep[] {
  const steps: PatternStep[] = [];
  const last = new Map<string, number>();
  [...s].forEach((c, i) => last.set(c, i));
  const sizes: number[] = [];
  let start = 0;
  let end = 0;
  let ops = 0;
  const cuts = new Set<number>();
  const snap = (stage: string, explanation: string, i: number, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [
        row("s", [...s], tones(s.length, (j) => (j === i ? "current" : j >= start && j <= end && i >= 0 ? "pointer" : j < start ? "found" : undefined)), tags(s.length, (j) => (j === end && i >= 0 ? "end" : cuts.has(j) ? "|" : undefined))),
      ],
      map: { title: "last index of each letter", entries: [...last.entries()].map(([k, v]) => ({ k, v: String(v), tone: i >= 0 && s[i] === k ? ("current" as const) : undefined })) },
      vars: [{ name: "part sizes", value: sizes.length ? show(sizes) : "–", tone: "found" }],
      ops,
      ...extra,
    });
  snap("start", "Each letter must stay in one part, so a part that contains a letter has to reach its last occurrence. First record each letter's last index. Then walk the string, stretching the current part's end to cover every letter seen; when you reach that end, cut.", -1);
  for (let i = 0; i < s.length; i++) {
    ops++;
    const before = end;
    end = Math.max(end, last.get(s[i])!);
    if (i === end) {
      sizes.push(end - start + 1);
      cuts.add(i);
      snap("cut", `“${s[i]}” at ${i} is the end of the part, and every letter in ${start}..${i} has its last copy inside it. Cut: a part of size ${end - start + 1}.`, i);
      start = i + 1;
      end = i + 1;
    } else snap("stretch", end > before ? `“${s[i]}” appears again as late as ${end}, so the part must stretch to ${end}.` : `“${s[i]}” ends by ${last.get(s[i])}, inside the part (which ends at ${end}).`, i);
  }
  snap("done", `The parts have sizes ${show(sizes)}: as many as possible.`, -1, { done: true, answer: show(sizes) });
  return steps;
}
function labelsSlow(s: string) {
  // At each start, grow the part until no letter inside it appears again later, re-scanning each time.
  const out: number[] = [];
  let ops = 0;
  let start = 0;
  while (start < s.length) {
    let end = start;
    for (;;) {
      let ok = true;
      for (let i = start; i <= end && ok; i++)
        for (let j = end + 1; j < s.length; j++) {
          ops++;
          if (s[j] === s[i]) {
            ok = false;
            break;
          }
        }
      if (ok) break;
      end++;
    }
    out.push(end - start + 1);
    start = end + 1;
  }
  return { answer: show(out), ops };
}

export const partitionLabels: PatternProblem<string> = {
  id: "partition-labels",
  title: "Partition Labels",
  difficulty: "Medium",
  blind75: false,
  slug: "partition-labels",
  video: "B7m8UmZE-vw",
  statement: "Cut a string into as many parts as possible so that each letter appears in only one part. Return the part sizes.",
  examples: [
    { label: "LeetCode's example 1", input: "ababcbacadefegdehijhklij" },
    { label: "“eccbbbbdec” (one part)", input: "eccbbbbdec" },
    { label: "all different", input: "abcd" },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return Array.from({ length: g.int(1, 10) }, () => g.pick([..."abcde"])).join("");
  },
  big: { label: "120 letters", input: () => Array.from({ length: 120 }, (_, i) => "abcdefghij"[Math.floor(i / 12) % 10]).join("") },
  describe: (s) => `s = "${s}"`,
  run: labelsRun,
  solve: (s) => labelsSlow(s).answer,
  brute: labelsSlow,
  bruteIdea: "Grow each part one letter at a time, and after each step re-scan the rest of the string for any letter in the part: O(n²) or worse.",
  guide: {
    title: "Partition Labels",
    idea: [
      "A part containing a letter must extend to that letter's last occurrence. So record every letter's last index, then sweep: keep the furthest last-index of the letters in the current part as its end.",
      "When the sweep reaches the end, no letter inside appears later, so cutting there is safe, and cutting as early as possible gives the most parts.",
    ],
    whenToUse: ["Splitting into the most pieces under “keep these together” rules: precompute last occurrences, then stretch and cut.", "Merging overlapping ranges (each letter is a range from first to last index)."],
    stages: [
      { id: "start", title: "Last index of each letter", detail: "", pseudo: "last = {c: i for i, c in enumerate(s)}" },
      { id: "stretch", title: "Stretch the end to cover this letter", detail: "", pseudo: "end = max(end, last[c]); size += 1" },
      { id: "cut", title: "Reached the end → cut", detail: "", pseudo: "if i == end: res.append(size); size = 0" },
      { id: "done", title: "The part sizes", detail: "", pseudo: "return res" },
    ],
    legend: [
      { tone: "current", label: "Letter being read" },
      { tone: "pointer", label: "Current part (up to its end)" },
      { tone: "found", label: "Finished parts" },
    ],
    complexity: { time: "O(n)", space: "O(1)", why: "Two passes; at most 26 last indexes." },
    pitfalls: ["The end only grows; don't reset it to the current letter's last index.", "Count sizes, not end indexes."],
    tryThis: ["LeetCode's example 1 gives [9, 7, 8].", "In “eccbbbbdec” the e at the end forces one part."],
    python: labelsPy,
  },
};
