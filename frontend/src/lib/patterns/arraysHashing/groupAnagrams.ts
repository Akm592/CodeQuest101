// Group Anagrams (NeetCode 150 · Arrays & Hashing).

import py from "../../guides/python/neetcode/group_anagrams.py?raw";
import { countLabel, quote, row, rngFor } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";

type Input = string[];

const keyOf = (w: string) => {
  const m = new Map<string, number>();
  for (const c of w) m.set(c, (m.get(c) ?? 0) + 1);
  return countLabel(m) || "(empty)";
};

function run(strs: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const groups = new Map<string, string[]>();
  let ops = 0;
  const entries = (hi?: string) => [...groups.entries()].map(([k, v]) => ({ k, v: v.map(quote).join(", "), tone: k === hi ? ("found" as const) : undefined }));
  strs.forEach((w, i) => {
    const key = keyOf(w);
    ops += w.length;
    steps.push({
      stage: "key",
      explanation: `Count the letters of “${w}”: ${key}. Anagrams always get the same counts, so this is its key.`,
      rows: [row("strs", strs.map(quote), { [i]: "current" }, { [i]: "↑" })],
      map: { title: "letter counts → group", entries: entries() },
      vars: [{ name: "key", value: key, tone: "pointer" }],
      ops,
    });
    const isNew = !groups.has(key);
    groups.set(key, [...(groups.get(key) ?? []), w]);
    ops++;
    steps.push({
      stage: "group",
      explanation: isNew ? `No group has key ${key} yet: start a new one with “${w}”.` : `Key ${key} already exists: add “${w}” to that group.`,
      rows: [row("strs", strs.map(quote), { [i]: "visited" }, { [i]: "↑" })],
      map: { title: "letter counts → group", entries: entries(key) },
      vars: [{ name: "key", value: key, tone: "pointer" }],
      ops,
    });
  });
  steps.push({
    stage: "done",
    explanation: `Done: ${groups.size} group${groups.size === 1 ? "" : "s"}. The map's values are the answer.`,
    rows: [row("strs", strs.map(quote), Object.fromEntries(strs.map((_, j) => [j, "found"])))],
    map: { title: "letter counts → group", entries: entries() },
    vars: [],
    ops,
    done: true,
    answer: [...groups.values()].map((g) => `[${g.map(quote).join(", ")}]`).join(" "),
  });
  return steps;
}

const BASES = ["eat", "tan", "bat", "stop", "listen", "act", "dusty", "lemon"];

export const groupAnagrams: PatternProblem<Input> = {
  id: "group-anagrams",
  title: "Group Anagrams",
  difficulty: "Medium",
  blind75: true,
  slug: "group-anagrams",
  video: "vzdNOK2oB2E",
  statement: "Given a list of lowercase words, group together the words that are anagrams of each other. The groups can come back in any order.",
  examples: [
    { label: "eat tea tan ate nat bat", input: ["eat", "tea", "tan", "ate", "nat", "bat"] },
    { label: "stop pots tops opts post", input: ["stop", "pots", "tops", "opts", "post", "spot"] },
    { label: "a, b, a", input: ["a", "b", "a"] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const bases = g.shuffle(BASES).slice(0, g.int(2, 3));
    const words = Array.from({ length: g.int(4, 7) }, () => g.shuffle([...g.pick(bases)]).join(""));
    return words;
  },
  big: {
    label: "200 words in 20 groups",
    input: () => {
      const g = rngFor(7);
      const bases = Array.from({ length: 20 }, (_, i) => String.fromCharCode(97 + i) + "xyz");
      return Array.from({ length: 200 }, (_, i) => g.shuffle([...bases[i % 20]]).join(""));
    },
  },
  describe: (strs) => `strs = [${strs.map(quote).join(", ")}]`,
  run,
  solve: (strs) => {
    const m = new Map<string, string[]>();
    for (const w of strs) m.set(keyOf(w), [...(m.get(keyOf(w)) ?? []), w]);
    return [...m.values()];
  },
  brute: (strs) => {
    let ops = 0;
    const groups: string[][] = [];
    const same = (a: string, b: string) => {
      ops += a.length + b.length;
      return a.length === b.length && keyOf(a) === keyOf(b);
    };
    for (const w of strs) {
      const g = groups.find((grp) => same(grp[0], w));
      if (g) g.push(w);
      else groups.push([w]);
    }
    return { answer: groups, ops };
  },
  bruteIdea: "Compare each word with the first word of every group so far, letter by letter: up to n² word comparisons.",
  canon: (a) => (a as string[][]).map((g) => [...g].sort()).sort((x, y) => (x.join() < y.join() ? -1 : 1)),
  guide: {
    title: "Group Anagrams",
    idea: [
      "Anagrams have identical letter counts. So turn each word into its counts (a key) and use a hash map from key to the list of words with that key.",
      "One pass over the words, and each word drops straight into its group. No word is ever compared with another word.",
    ],
    whenToUse: ["“Group things that are equivalent”: find a key that's the same for every member of a group, then hash on it.", "The key can be the sorted word (O(k log k) per word) or the 26 letter counts (O(k))."],
    stages: [
      { id: "key", title: "Make the key", detail: "Count the word's letters. Every anagram gets the same counts.", pseudo: "key = tuple(letter counts)" },
      { id: "group", title: "Drop it in its group", detail: "Append the word to the list stored under its key.", pseudo: "groups[key].append(word)" },
      { id: "done", title: "Return the groups", detail: "The map's values are the anagram groups.", pseudo: "return list(groups.values())" },
    ],
    legend: [
      { tone: "current", label: "Word being keyed" },
      { tone: "found", label: "Group just updated" },
    ],
    complexity: { time: "O(m · k)", space: "O(m · k)", why: "m words of up to k letters: counting each word's letters is O(k), and the map stores every word once." },
    pitfalls: [
      "Lists can't be dictionary keys in Python. Convert the counts to a tuple (or use the sorted word as a string).",
      "Sorting each word as the key is simpler and usually fine; counting is the O(k) version interviewers may ask for.",
    ],
    tryThis: ["Pick “stop pots tops…”: every word lands in one group.", "Press “Random” and predict the groups before stepping."],
    python: py,
  },
};
