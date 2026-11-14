// Alien Dictionary (NeetCode 150 · Advanced Graphs).

import py from "../../guides/python/neetcode/alien_dictionary.py?raw";
import { row, rngFor } from "../helpers";
import type { GEdge, GNode, PatternProblem, PatternStep } from "../types";

type Input = string[];

/** The letter-order rules from each pair of neighbouring words, or null if a word comes before its own prefix. */
function rules(words: Input): { pairs: [string, string][]; from: [number, number][] } | null {
  const pairs: [string, string][] = [];
  const from: [number, number][] = [];
  for (let i = 0; i + 1 < words.length; i++) {
    const [a, b] = [words[i], words[i + 1]];
    const j = [...a].findIndex((c, k) => c !== b[k]);
    if (j < 0 || j >= b.length) {
      if (a.length > b.length) return null; // “abc” before “ab” can't be sorted
      continue;
    }
    if (!pairs.some(([x, y]) => x === a[j] && y === b[j])) {
      pairs.push([a[j], b[j]]);
      from.push([i, j]);
    }
  }
  return { pairs, from };
}

function run(words: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const letters = [...new Set(words.join(""))].sort();
  const r = rules(words);
  const order: string[] = [];
  const visited = new Set<string>();
  const path: string[] = [];
  let pairs: [string, string][] = [];
  let shownWords: number[] = [];
  let bad: string | null = null;
  let cur: string | null = null;
  let ops = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) => {
    const nodes: GNode[] = letters.map((c) => ({ id: c, v: c, tone: c === bad ? "swap" : c === cur ? "current" : path.includes(c) ? "compare" : visited.has(c) ? "found" : undefined, tag: visited.has(c) ? `#${order.length - order.indexOf(c)}` : undefined }));
    const edges: GEdge[] = pairs.map(([a, b]) => ({ a, b, tone: path.includes(a) && path.includes(b) ? (bad ? "swap" : "compare") : undefined }));
    steps.push({
      stage,
      explanation,
      rows: [
        row("words, in alien order", words, Object.fromEntries(words.map((_, i) => [i, shownWords.includes(i) ? "current" : undefined]))),
        row("letters finished (post-order; read backwards)", order),
      ],
      graph: { title: "an arrow a → b means a comes before b", nodes, edges, directed: true },
      vars: [{ name: "rules found", value: String(pairs.length) }],
      ops,
      ...extra,
    });
  };
  snap("start", "The words are sorted in the alien alphabet. Compare each word with the next: the first letter where they differ tells you one rule (the first word's letter comes first). Those rules form a graph of letters; a topological order of it is the alphabet.");
  if (!r) {
    const i = words.findIndex((w, k) => k + 1 < words.length && w.length > words[k + 1].length && w.startsWith(words[k + 1]));
    shownWords = [i, i + 1];
    snap("invalid", `“${words[i]}” comes before “${words[i + 1]}”, but “${words[i + 1]}” is a prefix of it. A word must come after its own prefixes, so no alphabet works. Return "".`);
    snap("done", "No valid order: return an empty string.", { done: true, answer: '""' });
    return steps;
  }
  r.pairs.forEach(([a, b], k) => {
    ops++;
    const [i, j] = r.from[k];
    pairs = r.pairs.slice(0, k + 1);
    shownWords = [i, i + 1];
    snap("rule", `“${words[i]}” before “${words[i + 1]}”: they first differ at position ${j}, ${a} vs ${b}. So ${a} comes before ${b}.`);
  });
  pairs = r.pairs;
  shownWords = [];
  // DFS post-order, as NeetCode does: a letter is finished after everything that must come after it.
  const after = new Map(letters.map((c) => [c, r.pairs.filter(([a]) => a === c).map(([, b]) => b)]));
  const dfs = (c: string): boolean => {
    ops++;
    if (path.includes(c)) {
      bad = c;
      cur = c;
      snap("cycle", `${c} is already on the path ${path.join(" → ")}: the rules contradict each other (a cycle). Return "".`);
      return false;
    }
    if (visited.has(c)) return true;
    path.push(c);
    cur = c;
    snap("visit", after.get(c)!.length ? `Visit ${c}. ${after.get(c)!.length === 1 ? `${after.get(c)![0]} must come after it: finish that first.` : `Letters that must come after it: ${after.get(c)!.join(", ")}. Finish those first.`}` : `Visit ${c}: nothing has to come after it.`);
    for (const d of after.get(c)!) if (!dfs(d)) return false;
    path.pop();
    visited.add(c);
    order.push(c);
    cur = c;
    snap("finish", `Everything after ${c} is finished, so finish ${c}.${order.length === 1 ? " Each letter finishes after every letter that must follow it, so reading the finished list backwards will give the alphabet." : ""}`);
    return true;
  };
  for (const c of letters)
    if (!dfs(c)) {
      snap("done", "The rules form a cycle, so no alphabet fits them. Return \"\".", { done: true, answer: '""' });
      return steps;
    }
  cur = null;
  const ans = [...order].reverse().join("");
  snap("done", `Reverse the finished list: “${ans}”. Every rule's first letter comes before its second.`, { done: true, answer: `"${ans}"` });
  return steps;
}

/** The slow way: try every arrangement of the letters until one obeys every rule. */
function slow(words: Input) {
  const r = rules(words);
  let ops = 0;
  if (!r) return { answer: '""', ops };
  const letters = [...new Set(words.join(""))].sort();
  let found: string | null = null;
  const go = (pre: string[], rest: string[]) => {
    if (found !== null) return;
    if (!rest.length) {
      ops++;
      if (r.pairs.every(([a, b]) => pre.indexOf(a) < pre.indexOf(b))) found = pre.join("");
      return;
    }
    rest.forEach((c, i) => go([...pre, c], [...rest.slice(0, i), ...rest.slice(i + 1)]));
  };
  go([], letters);
  return { answer: `"${found ?? ""}"`, ops };
}

/** Many alphabets can be valid, so compare which letters appear (all, or none if impossible). A separate test checks the rules. */
const canon = (a: unknown) => {
  const s = String(a).slice(1, -1);
  return [...s].sort().join("");
};

export const alienDictionary: PatternProblem<Input> = {
  id: "alien-dictionary",
  title: "Alien Dictionary",
  difficulty: "Hard",
  blind75: true,
  slug: "alien-dictionary",
  video: "6kTZYvNNyps",
  statement: "Words from an alien language are given in its sorted (dictionary) order. Return a string of its letters in alien alphabetical order, or \"\" if no order fits. Any valid order is accepted.",
  examples: [
    { label: "LeetCode's example 1", input: ["wrt", "wrf", "er", "ett", "rftt"] },
    { label: "a contradiction", input: ["z", "x", "z"] },
    { label: "prefix after the word", input: ["abc", "ab"] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const alpha = g.shuffle([..."abcd"]);
    const words = Array.from({ length: g.int(2, 5) }, () => Array.from({ length: g.int(1, 3) }, () => g.pick(alpha)).join(""));
    // Sort by the hidden alphabet so a valid order usually exists; sometimes swap two words to break it.
    words.sort((x, y) => {
      for (let i = 0; i < Math.min(x.length, y.length); i++) if (x[i] !== y[i]) return alpha.indexOf(x[i]) - alpha.indexOf(y[i]);
      return x.length - y.length;
    });
    if (g.r() < 0.25 && words.length > 1) [words[0], words[1]] = [words[1], words[0]];
    return words;
  },
  big: {
    label: "8 letters, 40 sorted words",
    input: () => {
      const g = rngFor(8);
      const alpha = [..."hgfedcba"];
      const words = Array.from({ length: 40 }, () => Array.from({ length: g.int(2, 4) }, () => g.pick(alpha)).join(""));
      return words.sort((x, y) => {
        for (let i = 0; i < Math.min(x.length, y.length); i++) if (x[i] !== y[i]) return alpha.indexOf(x[i]) - alpha.indexOf(y[i]);
        return x.length - y.length;
      });
    },
  },
  describe: (ws) => `words = [${ws.join(", ")}]`,
  run,
  solve: (ws) => slow(ws).answer,
  brute: slow,
  canon,
  bruteIdea: "Try every arrangement of the letters until one obeys every rule: up to (number of letters)! arrangements.",
  guide: {
    title: "Alien Dictionary",
    idea: [
      "Neighbouring words give the rules: at the first position where they differ, the first word's letter comes before the second's. (If there's no difference and the first word is longer, like “abc” before “ab”, the input is invalid.) Later letters in the words tell you nothing.",
      "The rules are edges of a directed graph on letters; any topological order is a valid alphabet. NeetCode uses DFS post-order with an on-path set to catch cycles, then reverses the finished list.",
    ],
    whenToUse: ["“Recover an order from comparisons”: build a graph of “a before b” rules, then topologically sort.", "Same tools as Course Schedule II, after a clever graph-building step."],
    stages: [
      { id: "start", title: "Compare neighbouring words", detail: "", pseudo: "adj = {c: set() for w in words for c in w}" },
      { id: "rule", title: "First difference → one rule", detail: "", pseudo: "for j in range(min_len): if w1[j] != w2[j]: adj[w1[j]].add(w2[j]); break" },
      { id: "invalid", title: "A word before its own prefix → \"\"", detail: "", pseudo: "if len(w1) > len(w2) and w1[:min_len] == w2[:min_len]: return \"\"" },
      { id: "visit", title: "DFS a letter: finish the letters after it first", detail: "", pseudo: "visit[c] = True; for nei in adj[c]: if dfs(nei): return True" },
      { id: "finish", title: "Finish the letter (post-order)", detail: "", pseudo: "visit[c] = False; res.append(c)" },
      { id: "cycle", title: "On the path again → contradiction", detail: "", pseudo: "if c in visit: return visit[c]" },
      { id: "done", title: "Reverse the finished list", detail: "", pseudo: "res.reverse(); return \"\".join(res)" },
    ],
    legend: [
      { tone: "current", label: "Letter being visited" },
      { tone: "compare", label: "On the DFS path" },
      { tone: "found", label: "Finished (#position in the alphabet)" },
      { tone: "swap", label: "Contradiction" },
    ],
    complexity: { time: "O(total letters in all words)", space: "O(unique letters + rules)", why: "Each neighbouring pair is compared once, and the graph has at most 26 nodes." },
    pitfalls: ["Only the first difference between two words gives a rule.", "Check the prefix case: “abc” then “ab” is impossible."],
    tryThis: ["In LeetCode's example 1, five rules give the alphabet “wertf”.", "In “a contradiction”, z before x and x before z form a cycle."],
    python: py,
  },
};
