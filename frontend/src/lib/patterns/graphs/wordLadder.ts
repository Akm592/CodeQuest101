// Word Ladder (NeetCode 150 · Graphs).

import py from "../../guides/python/neetcode/word_ladder.py?raw";
import { row, rngFor } from "../helpers";
import type { GEdge, GNode, PEntry, PatternProblem, PatternStep } from "../types";

type Input = { begin: string; end: string; words: string[] };

const oneApart = (a: string, b: string) => a.length === b.length && [...a].filter((c, i) => c !== b[i]).length === 1;

function run({ begin, end, words }: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const all = [...new Set([begin, ...words])];
  const L = begin.length;
  let ops = 0;
  // Buckets: a pattern like "h*t" → every word that fits it.
  const buckets = new Map<string, string[]>();
  for (const w of all)
    for (let i = 0; i < L; i++) {
      ops++;
      const p = w.slice(0, i) + "*" + w.slice(i + 1);
      if (!buckets.has(p)) buckets.set(p, []);
      buckets.get(p)!.push(w);
    }
  const level = new Map<string, number>([[begin, 1]]);
  let q = [begin];
  let cur: string | null = null;
  let shown: string[] = [];
  let fresh: string[] = [];
  // Pairs one letter apart, for the picture only (not counted as work). Big lists aren't drawn.
  const drawn = all.length <= 24;
  const pairs: [string, string][] = [];
  if (drawn) for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) if (oneApart(all[i], all[j])) pairs.push([all[i], all[j]]);
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) => {
    const nodes: GNode[] = all.map((w) => ({ id: w, v: w, tone: w === cur ? "current" : fresh.includes(w) ? "compare" : w === end && level.has(w) ? "found" : q.includes(w) ? "pointer" : level.has(w) ? "visited" : undefined, tag: w === end ? "target" : undefined, note: level.has(w) ? `${level.get(w)}` : undefined }));
    const edges: GEdge[] = pairs.map(([a, b]) => ({ a, b, tone: (a === cur && fresh.includes(b)) || (b === cur && fresh.includes(a)) ? "compare" : undefined }));
    steps.push({
      stage,
      explanation,
      rows: [row("BFS queue", q)],
      graph: drawn ? { title: "words one letter apart are joined; the number is the ladder length so far", nodes, edges } : undefined,
      map: { title: cur ? `patterns of “${cur}”` : "pattern buckets", entries: shown.map((p): PEntry => ({ k: p, v: buckets.get(p)!.join(", "), tone: buckets.get(p)!.some((w) => fresh.includes(w)) ? "compare" : undefined })) },
      vars: [
        { name: "words seen", value: String(level.size) },
        { name: "target", value: end, tone: "found" },
      ],
      ops,
      ...extra,
    });
  };
  shown = [...buckets.keys()].slice(0, 6);
  snap("start", `Words one letter apart are neighbours, and the shortest ladder is a shortest path: BFS from “${begin}”. To find neighbours fast, group the words by pattern first: “${begin}” fits ${[...Array(L).keys()].map((i) => `“${begin.slice(0, i)}*${begin.slice(i + 1)}”`).join(", ")}, and every word in the same bucket is one letter away.`);
  if (!words.includes(end)) {
    snap("done", `“${end}” isn't in the word list, so no ladder can end there. Return 0.`, { done: true, answer: "0" });
    return steps;
  }
  while (q.length) {
    const next: string[] = [];
    for (const w of q) {
      cur = w;
      fresh = [];
      shown = [];
      for (let i = 0; i < L; i++) {
        const p = w.slice(0, i) + "*" + w.slice(i + 1);
        shown.push(p);
        for (const x of buckets.get(p)!) {
          ops++;
          if (level.has(x)) continue;
          level.set(x, level.get(w)! + 1);
          fresh.push(x);
          next.push(x);
        }
      }
      if (fresh.includes(end)) {
        q = next;
        snap("found", `From “${w}”, the bucket${shown.length > 1 ? "s" : ""} give${shown.length > 1 ? "" : "s"} “${end}”: the target! The ladder has ${level.get(end)} words.`);
        snap("done", `Shortest ladder from “${begin}” to “${end}”: ${level.get(end)} words.`, { done: true, answer: String(level.get(end)) });
        return steps;
      }
      snap("expand", fresh.length ? `Take “${w}” (ladder length ${level.get(w)}). Its pattern buckets hold ${fresh.length === 1 ? `one new word, ${fresh[0]}: it gets` : `new words ${fresh.join(", ")}: they get`} length ${level.get(w)! + 1} and ${fresh.length === 1 ? "joins" : "join"} the queue.` : `Take “${w}”. Every word in its buckets has been seen already.`);
    }
    q = next;
    cur = null;
    fresh = [];
  }
  snap("done", `The BFS ran out of words without reaching “${end}”. Return 0.`, { done: true, answer: "0" });
  return steps;
}

/** The slow way: compare every pair of words letter by letter to find neighbours, then BFS. */
function slow({ begin, end, words }: Input) {
  const all = [...new Set([begin, ...words])];
  let ops = 0;
  const adj = new Map<string, string[]>(all.map((w) => [w, []]));
  for (let i = 0; i < all.length; i++)
    for (let j = i + 1; j < all.length; j++) {
      ops += all[i].length;
      if (oneApart(all[i], all[j])) {
        adj.get(all[i])!.push(all[j]);
        adj.get(all[j])!.push(all[i]);
      }
    }
  if (!words.includes(end)) return { answer: 0, ops };
  const dist = new Map([[begin, 1]]);
  const q = [begin];
  while (q.length) {
    const w = q.shift()!;
    for (const x of adj.get(w)!) {
      ops++;
      if (dist.has(x)) continue;
      dist.set(x, dist.get(w)! + 1);
      if (x === end) return { answer: dist.get(x)!, ops };
      q.push(x);
    }
  }
  return { answer: 0, ops };
}

export const wordLadder: PatternProblem<Input> = {
  id: "word-ladder",
  title: "Word Ladder",
  difficulty: "Hard",
  blind75: false,
  slug: "word-ladder",
  video: "h9iTnkgv05E",
  statement: "Change beginWord into endWord one letter at a time; every intermediate word must be in wordList. Return the number of words in the shortest such ladder (counting both ends), or 0 if there is none.",
  examples: [
    { label: "LeetCode's example 1", input: { begin: "hit", end: "cog", words: ["hot", "dot", "dog", "lot", "log", "cog"] } },
    { label: "LeetCode's example 2 (no cog)", input: { begin: "hit", end: "cog", words: ["hot", "dot", "dog", "lot", "log"] } },
    { label: "cold → warm", input: { begin: "cold", end: "warm", words: ["cord", "card", "ward", "warm", "worm", "word", "corm"] } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const letters = [..."abc"];
    const w = () => Array.from({ length: 3 }, () => g.pick(letters)).join("");
    const words = [...new Set(Array.from({ length: g.int(3, 7) }, w))];
    const begin = w();
    return { begin, end: g.r() < 0.8 ? g.pick(words) : w(), words: words.filter((x) => x !== begin) };
  },
  big: {
    label: "300 four-letter words",
    input: () => {
      const g = rngFor(42);
      const words = [...new Set(Array.from({ length: 300 }, () => Array.from({ length: 4 }, () => g.pick([..."abcdef"])).join("")))];
      return { begin: "aaaa", end: words[words.length - 1], words };
    },
  },
  describe: ({ begin, end, words }) => `beginWord = "${begin}", endWord = "${end}", wordList = [${words.join(", ")}]`,
  run,
  solve: (input) => slow(input).answer,
  brute: slow,
  bruteIdea: "Find every word's neighbours by comparing it with every other word, letter by letter: O(n² · L) before the BFS even starts. The pattern buckets find them in O(n · L²).",
  guide: {
    title: "Word Ladder",
    idea: [
      "Words are nodes; words one letter apart are joined. The shortest ladder is a shortest path in that graph, so BFS from the begin word, one level per extra word.",
      "Finding neighbours is the slow part. Group words by pattern instead: “hot” fits “*ot”, “h*t” and “ho*”. Two words are one letter apart exactly when they share a pattern, so each word's neighbours are the words in its L buckets.",
    ],
    whenToUse: ["Shortest number of steps where each step is a small change: BFS over the states.", "When comparing all pairs is too slow, bucket items by a wildcard key."],
    stages: [
      { id: "start", title: "Bucket the words by pattern", detail: "", pseudo: "for word in wordList: for j in range(len(word)): nei[word[:j] + '*' + word[j+1:]].append(word)" },
      { id: "expand", title: "BFS: the words in this word's buckets are next", detail: "", pseudo: "for j: for nei_word in nei[pattern]: if not visited: q.append(nei_word)" },
      { id: "found", title: "Reached the end word", detail: "", pseudo: "if word == endWord: return res" },
      { id: "done", title: "Ladder length (or 0)", detail: "", pseudo: "return 0" },
    ],
    legend: [
      { tone: "current", label: "Word taken from the queue" },
      { tone: "compare", label: "New words found from it" },
      { tone: "pointer", label: "In the queue" },
      { tone: "visited", label: "Seen" },
      { tone: "found", label: "The end word, reached" },
    ],
    complexity: { time: "O(n · L²)", space: "O(n · L²)", why: "n words, L patterns each, and building each pattern costs L." },
    pitfalls: ["If the end word isn't in the list, return 0 straight away.", "Count words, not changes: hit → hot → dot → dog → cog is 5."],
    tryThis: ["In example 1, “hot” is the only word one letter from “hit”.", "Example 2 has the same list without “cog”: 0."],
    python: py,
  },
};
