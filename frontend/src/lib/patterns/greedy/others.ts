// The other Greedy problems of the NeetCode 150: Hand of Straights, Merge
// Triplets to Form Target Triplet and Valid Parenthesis String.

import handPy from "../../guides/python/neetcode/hand_of_straights.py?raw";
import tripletsPy from "../../guides/python/neetcode/merge_triplets.py?raw";
import parensPy from "../../guides/python/neetcode/valid_parenthesis_string.py?raw";
import { row, rngFor, show } from "../helpers";
import type { PEntry, PatternProblem, PatternStep } from "../types";

// ---------------------------------------------------------------- Hand of straights

type Hand = { hand: number[]; size: number };

function handRun({ hand, size }: Hand): PatternStep[] {
  const steps: PatternStep[] = [];
  const count = new Map<number, number>();
  for (const c of hand) count.set(c, (count.get(c) ?? 0) + 1);
  const groups: number[][] = [];
  let ops = 0;
  let hot: number[] = [];
  let bad: number | null = null;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [row("groups made", groups.map((g) => show(g)))],
      map: {
        title: "cards left: value → count",
        entries: [...count.entries()]
          .sort((a, b) => a[0] - b[0])
          .map(([k, v]): PEntry => ({ k: String(k), v: String(v), tone: k === bad ? "swap" : hot.includes(k) ? "current" : v === 0 ? "idle" : undefined })),
      },
      vars: [{ name: "group size", value: String(size) }],
      ops,
      ...extra,
    });
  snap("start", `The smallest card left has nothing smaller to go with, so it must start a group: smallest, smallest + 1, …, smallest + ${size - 1}. Take those cards, and repeat with the next smallest. If a needed card is missing, it can't be done.`);
  if (hand.length % size) {
    snap("done", `${hand.length} cards can't be split into groups of ${size}. Return false.`, { done: true, answer: "false" });
    return steps;
  }
  for (;;) {
    const left = [...count.entries()].filter(([, v]) => v > 0).map(([k]) => k);
    ops += left.length ? 1 : 0;
    if (!left.length) break;
    const low = Math.min(...left);
    const g: number[] = [];
    for (let v = low; v < low + size; v++) {
      ops++;
      if (!count.get(v)) {
        hot = g;
        bad = v;
        snap("missing", `The smallest card left is ${low}, so its group needs ${low}..${low + size - 1}, but there's no ${v} left. Return false.`);
        snap("done", "A group can't be completed.", { done: true, answer: "false" });
        return steps;
      }
      count.set(v, count.get(v)! - 1);
      g.push(v);
    }
    groups.push(g);
    hot = g;
    snap("group", `The smallest card left is ${low}: take ${g.join(", ")} as a group.`);
  }
  hot = [];
  snap("done", `Every card is in a group of ${size} consecutive values: true.`, { done: true, answer: "true" });
  return steps;
}
function handSlow({ hand, size }: Hand) {
  // Keep a sorted list and remove cards from it by scanning.
  if (hand.length % size) return { answer: false, ops: 1 };
  const cards = [...hand].sort((a, b) => a - b);
  let ops = 0;
  while (cards.length) {
    const low = cards[0];
    for (let v = low; v < low + size; v++) {
      let at = -1;
      for (let i = 0; i < cards.length; i++) {
        ops++;
        if (cards[i] === v) {
          at = i;
          break;
        }
      }
      if (at < 0) return { answer: false, ops };
      cards.splice(at, 1);
    }
  }
  return { answer: true, ops };
}

export const handOfStraights: PatternProblem<Hand> = {
  id: "hand-of-straights",
  title: "Hand of Straights",
  difficulty: "Medium",
  blind75: false,
  slug: "hand-of-straights",
  video: "amnrMCVd2YI",
  statement: "Can the cards in hand be split into groups of groupSize cards, each group being consecutive values?",
  examples: [
    { label: "LeetCode's example 1", input: { hand: [1, 2, 3, 6, 2, 3, 4, 7, 8], size: 3 } },
    { label: "LeetCode's example 2 (false)", input: { hand: [1, 2, 3, 4, 5], size: 4 } },
    { label: "a missing card", input: { hand: [1, 1, 2, 3, 3, 4], size: 3 } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const size = g.int(1, 3);
    const hand: number[] = [];
    for (let k = 0; k < g.int(1, 3); k++) {
      const s = g.int(1, 6);
      for (let v = s; v < s + size; v++) hand.push(v);
    }
    if (g.r() < 0.4) hand[g.int(0, hand.length - 1)] = g.int(1, 8); // sometimes break it
    return { hand: g.shuffle(hand), size };
  },
  big: { label: "200 cards in groups of 5", input: () => ({ hand: Array.from({ length: 200 }, (_, i) => (i % 40) + Math.floor(i / 40)), size: 5 }) },
  describe: ({ hand, size }) => `hand = ${show(hand)}, groupSize = ${size}`,
  run: handRun,
  solve: (h) => handSlow(h).answer,
  brute: handSlow,
  bruteIdea: "Sort, then repeatedly take the smallest card and search the list for each of the next values, removing them one by one: O(n²).",
  guide: {
    title: "Hand of Straights",
    idea: [
      "The smallest card left can only be the start of a group (there's nothing smaller to put before it). So its group is forced: smallest, smallest + 1, …. Take those cards and repeat.",
      "A count map makes taking a card O(1); NeetCode keeps a min-heap of the distinct values to find the smallest one quickly.",
    ],
    whenToUse: ["Grouping into consecutive runs: the smallest remaining item forces its group.", "Greedy choices that are forced, not just good."],
    stages: [
      { id: "start", title: "Count the cards", detail: "", pseudo: "count = Counter(hand); min_h = list(count.keys()); heapify(min_h)" },
      { id: "group", title: "Smallest card starts a group", detail: "", pseudo: "first = min_h[0]; for i in range(first, first + groupSize): count[i] -= 1" },
      { id: "missing", title: "A needed card is missing", detail: "", pseudo: "if i not in count: return False" },
      { id: "done", title: "All grouped?", detail: "", pseudo: "return True" },
    ],
    legend: [
      { tone: "current", label: "Cards taken for this group" },
      { tone: "swap", label: "Missing card" },
      { tone: "idle", label: "Used up" },
    ],
    complexity: { time: "O(n log n)", space: "O(n)", why: "Sorting (or the heap) dominates; each card is taken once." },
    pitfalls: ["Check the hand size divides evenly first.", "Start groups only from the smallest card left."],
    tryThis: ["LeetCode's example 1: [1,2,3], [2,3,4], [6,7,8].", "In “a missing card”, 1 starts 1, 2, 3 twice but there's only one 2."],
    python: handPy,
  },
};

// ---------------------------------------------------------------- Merge triplets

type Trip = { triplets: [number, number, number][]; target: [number, number, number] };

function tripletsRun({ triplets, target }: Trip): PatternStep[] {
  const steps: PatternStep[] = [];
  const got = [false, false, false];
  const keep: boolean[] = [];
  let at = -1;
  let ops = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [
        row("target", target, Object.fromEntries(target.map((_, k) => [k, got[k] ? "found" : undefined]))),
        row("triplets", triplets.map((t) => `[${t.join(",")}]`), Object.fromEntries(triplets.map((_, i) => [i, i === at ? "current" : keep[i] === false ? "idle" : keep[i] ? "pointer" : undefined]))),
      ],
      vars: [{ name: "target values matched", value: got.map((g, k) => (g ? `${"xyz"[k]} ✓` : `${"xyz"[k]} –`)).join("  ") }],
      ops,
      ...extra,
    });
  snap("start", "Merging takes the maximum of each position, so a triplet with any value above the target would push that position too high forever: never use it. Every other triplet is safe to merge in. The answer is yes if the safe ones, together, hit each target value somewhere.");
  triplets.forEach((t, i) => {
    ops++;
    at = i;
    if (t.some((v, k) => v > target[k])) {
      keep[i] = false;
      const k = t.findIndex((v, j) => v > target[j]);
      snap("skip", `[${t.join(",")}]: its ${"xyz"[k]} is ${t[k]}, above the target's ${target[k]}. Skip it.`);
      return;
    }
    keep[i] = true;
    const newly = [0, 1, 2].filter((k) => t[k] === target[k] && !got[k]);
    for (const k of newly) got[k] = true;
    snap("use", `[${t.join(",")}] fits under the target, so merging it is safe.${newly.length ? ` It supplies the target's ${newly.map((k) => `${"xyz"[k]} = ${target[k]}`).join(", ")}.` : " It doesn't supply any new target value."}`);
  });
  at = -1;
  const ok = got.every(Boolean);
  snap("done", ok ? "Every target value is supplied by a safe triplet: merging all of them gives the target. True." : `Some target value never appears in a safe triplet, so it can't be reached. False.`, { done: true, answer: String(ok) });
  return steps;
}
function tripletsSlow({ triplets, target }: Trip) {
  let ops = 0;
  const n = triplets.length;
  for (let m = 1; m < 1 << n; m++) {
    const cur = [0, 0, 0];
    for (let i = 0; i < n; i++)
      if (m & (1 << i)) {
        ops++;
        for (let k = 0; k < 3; k++) cur[k] = Math.max(cur[k], triplets[i][k]);
      }
    if (cur.every((v, k) => v === target[k])) return { answer: true, ops };
  }
  return { answer: false, ops };
}

export const mergeTriplets: PatternProblem<Trip> = {
  id: "merge-triplets",
  title: "Merge Triplets to Form Target Triplet",
  difficulty: "Medium",
  blind75: false,
  slug: "merge-triplets-to-form-target-triplet",
  video: "kShkQLQZ9K4",
  statement: "Merging two triplets replaces one with their position-by-position maximum. Can some sequence of merges produce the target triplet?",
  examples: [
    { label: "LeetCode's example 1", input: { triplets: [[2, 5, 3], [1, 8, 4], [1, 7, 5]], target: [2, 7, 5] } },
    { label: "LeetCode's example 2 (false)", input: { triplets: [[3, 4, 5], [4, 5, 6]], target: [3, 2, 5] } },
    { label: "LeetCode's example 3", input: { triplets: [[2, 5, 3], [2, 3, 4], [1, 2, 5], [5, 2, 3]], target: [5, 5, 5] } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const t = (): [number, number, number] => [g.int(1, 5), g.int(1, 5), g.int(1, 5)];
    return { triplets: Array.from({ length: g.int(1, 5) }, t), target: t() };
  },
  big: { label: "16 triplets, none fits", input: () => ({ triplets: Array.from({ length: 16 }, (_, i): [number, number, number] => [i % 4, (i * 3) % 5, 9]), target: [3, 4, 8] }) },
  describe: ({ triplets, target }) => `triplets = [${triplets.map((t) => `[${t.join(",")}]`).join(", ")}], target = [${target.join(",")}]`,
  run: tripletsRun,
  solve: (i) => tripletsSlow(i).answer,
  brute: tripletsSlow,
  bruteIdea: "Try every subset of triplets (2^n) and check whether merging it gives the target.",
  guide: {
    title: "Merge Triplets to Form Target Triplet",
    idea: [
      "Merging only ever raises values (it takes maxima). So a triplet with any value above the target is poison: use it and that position can never come back down. Ignore those.",
      "Every remaining triplet is harmless: merging it can't overshoot. So merge all of them; you hit the target exactly when each target value appears in at least one of them.",
    ],
    whenToUse: ["Operations that only increase (max, union): filter out anything that overshoots, then take everything else.", "Greedy by elimination."],
    stages: [
      { id: "start", title: "Look at each triplet", detail: "", pseudo: "good = set()" },
      { id: "skip", title: "A value above the target → skip", detail: "", pseudo: "if t[0] > target[0] or t[1] > target[1] or t[2] > target[2]: continue" },
      { id: "use", title: "Safe: note which target values it supplies", detail: "", pseudo: "for i, v in enumerate(t): if v == target[i]: good.add(i)" },
      { id: "done", title: "All three supplied?", detail: "", pseudo: "return len(good) == 3" },
    ],
    legend: [
      { tone: "current", label: "Triplet being checked" },
      { tone: "pointer", label: "Safe to merge" },
      { tone: "idle", label: "Overshoots: skipped" },
      { tone: "found", label: "Target value supplied" },
    ],
    complexity: { time: "O(n)", space: "O(1)", why: "One pass over the triplets." },
    pitfalls: ["A triplet that matches one target value but overshoots another must still be skipped.", "Matching values can come from different triplets."],
    tryThis: ["Example 1: [1,8,4] overshoots y; [2,5,3] and [1,7,5] supply 2, 7 and 5.", "Example 2: nothing has y ≤ 2 except overshooting triplets."],
    python: tripletsPy,
  },
};

// ---------------------------------------------------------------- Valid parenthesis string

function parensRun(s: string): PatternStep[] {
  const steps: PatternStep[] = [];
  let lo = 0;
  let hi = 0;
  let ops = 0;
  const snap = (stage: string, explanation: string, i: number, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [row("s", [...s], Object.fromEntries([...s].map((_, j) => [j, j === i ? "current" : j < i ? "idle" : undefined])))],
      vars: [
        { name: "fewest open “(” possible", value: String(lo) },
        { name: "most open “(” possible", value: String(hi), tone: hi < 0 ? "swap" : undefined },
      ],
      ops,
      ...extra,
    });
  snap("start", "A * can be “(”, “)” or nothing, so instead of one count of open brackets, track a range: the fewest and the most that could be open so far. If even the most goes negative, there are too many “)”. At the end, a valid string needs 0 open to be possible.", -1);
  for (let i = 0; i < s.length; i++) {
    ops++;
    const c = s[i];
    if (c === "(") {
      lo++;
      hi++;
    } else if (c === ")") {
      lo--;
      hi--;
    } else {
      lo--;
      hi++;
    }
    if (hi < 0) {
      snap("fail", `“${c}” at ${i}: even if every * so far were “(”, there are more “)” than “(”. Return false.`, i);
      snap("done", "Too many closing brackets.", -1, { done: true, answer: "false" });
      return steps;
    }
    const clamp = lo < 0;
    if (clamp) lo = 0;
    snap(c === "*" ? "star" : "bracket", c === "*" ? `* at ${i}: as “)” it closes one (fewest − 1), as “(” it opens one (most + 1).${clamp ? " The fewest can't go below 0 (a * would just be empty instead)." : ""} Range ${lo}..${hi}.` : `“${c}” at ${i}: both ends ${c === "(" ? "+" : "−"}1.${clamp ? " The fewest can't go below 0." : ""} Range ${lo}..${hi}.`, i);
  }
  snap("done", lo === 0 ? `0 open brackets is possible at the end (range ${lo}..${hi}): valid.` : `At least ${lo} bracket${lo === 1 ? " is" : "s are"} always left open: not valid.`, -1, { done: true, answer: String(lo === 0) });
  return steps;
}
function parensSlow(s: string) {
  let ops = 0;
  const go = (i: number, open: number): boolean => {
    ops++;
    if (open < 0) return false;
    if (i === s.length) return open === 0;
    if (s[i] === "(") return go(i + 1, open + 1);
    if (s[i] === ")") return go(i + 1, open - 1);
    return go(i + 1, open + 1) || go(i + 1, open - 1) || go(i + 1, open);
  };
  return { answer: go(0, 0), ops };
}

export const validParenthesisString: PatternProblem<string> = {
  id: "valid-parenthesis-string",
  title: "Valid Parenthesis String",
  difficulty: "Medium",
  blind75: false,
  slug: "valid-parenthesis-string",
  video: "QhPdNS143Qg",
  statement: "A string has “(”, “)” and “*”, where each * may be “(”, “)” or nothing. Return true if some choice makes the brackets balanced.",
  examples: [
    { label: "“(*))”", input: "(*))" },
    { label: "“(((*)”", input: "(((*)" },
    { label: "“*)”", input: "*)" },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return Array.from({ length: g.int(1, 8) }, () => g.pick([..."()*"])).join("");
  },
  big: { label: "12 stars, then 13 “)”", input: () => "*".repeat(12) + ")".repeat(13) },
  describe: (s) => `s = "${s}"`,
  run: parensRun,
  solve: (s) => parensSlow(s).answer,
  brute: parensSlow,
  bruteIdea: "Try all three meanings of every * (3^k choices for k stars), checking the balance as you go.",
  guide: {
    title: "Valid Parenthesis String",
    idea: [
      "With stars, the number of open brackets isn't one number but a range. Track its smallest and largest possible values: “(” raises both, “)” lowers both, “*” lowers the smallest and raises the largest.",
      "If the largest drops below 0, nothing can save it: return false. Never let the smallest go below 0 (a star would have been empty instead). At the end, valid exactly when the smallest is 0.",
    ],
    whenToUse: ["Wildcards in a balance check: track a range of possible counts instead of trying every choice.", "A DP over (index, open count) also works, in O(n²)."],
    stages: [
      { id: "start", title: "Range 0..0", detail: "", pseudo: "left_min = left_max = 0" },
      { id: "bracket", title: "( or ): move both ends", detail: "", pseudo: "left_min, left_max = left_min ± 1, left_max ± 1" },
      { id: "star", title: "*: widen the range", detail: "", pseudo: "left_min, left_max = left_min - 1, left_max + 1" },
      { id: "fail", title: "Most possible < 0 → false", detail: "", pseudo: "if left_max < 0: return False" },
      { id: "done", title: "0 open possible?", detail: "", pseudo: "return left_min == 0" },
    ],
    legend: [
      { tone: "current", label: "Character being read" },
      { tone: "idle", label: "Already read" },
    ],
    complexity: { time: "O(n)", space: "O(1)", why: "One pass, two counters." },
    pitfalls: ["Clamp the smallest at 0 after each step.", "Checking only the final count misses “)(”: the largest must never go negative."],
    tryThis: ["“(*))”: the * becomes “(”.", "“*)”: the * becomes “(”; “)*” would fail."],
    python: parensPy,
  },
};
