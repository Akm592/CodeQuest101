// Design Add and Search Words Data Structure (NeetCode 150 · Tries).

import py from "../../guides/python/neetcode/word_dictionary.py?raw";
import { row, rngFor, show } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { type Trie, insertWord, newTrie, rootLabel, trieLayout } from "./trie";

/** Calls like "addWord bad" and "search .ad" ("." matches any letter). */
type Input = { calls: string[] };

function run({ calls }: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const root = newTrie();
  const out: boolean[] = [];
  let ops = 0;
  let k = -1;
  let word = "";
  let at = -1;
  let path: string[] = [];
  let tried = new Set<string>();
  let dead = new Set<string>();
  let hit = false;
  let added = new Set<string>();
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) => {
    const on = new Set(path);
    const cur = path.at(-1);
    const nodes = trieLayout(root, {
      tone: (t) => (dead.has(t.id) && t.id === cur ? "swap" : t.id === cur ? (hit ? "found" : "current") : on.has(t.id) ? (hit ? "found" : "pointer") : added.has(t.id) ? "found" : dead.has(t.id) ? "swap" : tried.has(t.id) ? "visited" : undefined),
      edgeTone: (t) => (on.has(t.id) && t !== root ? (hit ? "found" : "pointer") : undefined),
    });
    steps.push({
      stage,
      explanation,
      rows: [
        row("calls", calls, Object.fromEntries(calls.map((_, j) => [j, j < k ? "idle" : j === k ? "current" : undefined]))),
        ...(k >= 0 && k < calls.length ? [row(`letters of “${word}”`, [...word], Object.fromEntries([...word].map((c, i) => [i, i < at ? "pointer" : i === at ? (c === "." ? "compare" : "current") : undefined])))] : []),
      ],
      tree: { title: "the trie (double ring = a word ends here)", nodes, labels: rootLabel(nodes) },
      vars: [
        { name: "results (search)", value: out.length ? show(out.map(String)) : "–", tone: "found" },
        { name: "nodes visited this search", value: String(tried.size) },
      ],
      ops,
      ...extra,
    });
  };
  snap("start", "Store the words in a trie. A search with no dots is a normal trie walk. A dot matches any letter, so at a dot the search has to try every child in turn: a depth-first search that backs up when a branch fails.");
  calls.forEach((call, j) => {
    k = j;
    const [op, w] = call.split(" ");
    word = w;
    path = [];
    tried = new Set();
    dead = new Set();
    hit = false;
    added = new Set();
    if (op === "addWord") {
      const before = new Set(trieLayout(root).map((n) => n.id));
      insertWord(root, w);
      ops += w.length;
      added = new Set(trieLayout(root).map((n) => n.id).filter((id) => !before.has(id)));
      at = w.length;
      snap("add", `addWord “${w}”: insert it like a normal trie, ${added.size ? `creating ${added.size} new node${added.size === 1 ? "" : "s"}` : "reusing existing nodes"} and marking the last one.`);
      return;
    }
    // Enter node t having matched i letters; `why` explains how we got here.
    const dfs = (t: Trie, i: number, stage?: string, why?: string): boolean => {
      path.push(t.id);
      tried.add(t.id);
      at = i;
      if (stage) {
        at = i - 1;
        snap(stage, why!);
        at = i;
      }
      if (i === w.length) {
        ops++;
        if (t.end) {
          hit = true;
          out.push(true);
          at = i - 1;
          snap("found", `All ${w.length} letters matched and this node is a word end: “${w}” matches the word “${t.id.slice(1)}”. Return true.`);
          return true;
        }
        dead.add(t.id);
        snap("back", `The pattern is used up at “${t.id.slice(1)}”, but no word ends here. This branch fails; back up.`);
        path.pop();
        return false;
      }
      const c = w[i];
      const options = c === "." ? [...t.kids.values()].sort((x, y) => (x.ch < y.ch ? -1 : 1)) : t.kids.has(c) ? [t.kids.get(c)!] : [];
      ops++;
      if (!options.length) {
        dead.add(t.id);
        const here = t.id.slice(1) ? `“${t.id.slice(1)}”` : "the root";
        snap("back", c === "." ? `A dot, but ${here} has no children: nothing can match. Back up.` : `After ${here} there's no child “${c}”. This branch fails; back up.`);
        path.pop();
        return false;
      }
      for (const [n, nx] of options.entries()) {
        const why = c === "." ? `“.” matches any letter: try the child “${nx.ch}”${options.length > 1 ? ` (child ${n + 1} of ${options.length} here)` : ""}.` : `“${c}” must match exactly: follow the child “${c}”.`;
        if (dfs(nx, i + 1, c === "." ? "dot" : "walk", why)) return true;
        at = i;
      }
      path.pop();
      return false;
    };
    const ok = dfs(root, 0);
    if (!ok) {
      out.push(false);
      path = [];
      at = w.length;
      snap("answer", `Every branch failed, so no stored word matches “${w}”. Return false.`);
    }
  });
  k = calls.length;
  path = [];
  tried = new Set();
  dead = new Set();
  added = new Set();
  hit = false;
  at = -1;
  snap("done", `All calls done. The searches returned ${show(out.map(String))}.`, { done: true, answer: show(out.map(String)) });
  return steps;
}

function slow({ calls }: Input) {
  // A plain list of words; each search compares the pattern with every word.
  const words: string[] = [];
  const out: boolean[] = [];
  let ops = 0;
  for (const call of calls) {
    const [op, w] = call.split(" ");
    ops++;
    if (op === "addWord") {
      words.push(w);
      continue;
    }
    let found = false;
    for (const x of words) {
      ops++;
      if (x.length !== w.length) continue;
      let i = 0;
      while (i < w.length && (w[i] === "." || w[i] === x[i])) {
        i++;
        ops++;
      }
      if (i === w.length) {
        found = true;
        break;
      }
    }
    out.push(found);
  }
  return { answer: show(out.map(String)), ops };
}

export const wordDictionary: PatternProblem<Input> = {
  id: "word-dictionary",
  title: "Design Add and Search Words Data Structure",
  difficulty: "Medium",
  blind75: true,
  slug: "design-add-and-search-words-data-structure",
  video: "BTf05gs_8iU",
  statement: "Build a structure with addWord(word) and search(pattern), where the pattern may contain dots and a dot matches any one letter. search returns true if any added word matches.",
  examples: [
    { label: "LeetCode's example", input: { calls: ["addWord bad", "addWord dad", "addWord mad", "search pad", "search bad", "search .ad", "search b.."] } },
    { label: "a dot that backs up", input: { calls: ["addWord cat", "addWord cot", "addWord dog", "search .og", "search c.d", "search ..t"] } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const w = () => Array.from({ length: g.int(2, 3) }, () => g.pick([..."abc"])).join("");
    const words: string[] = [];
    const calls = Array.from({ length: g.int(5, 8) }, (_, i) => {
      if (i < 2 || g.r() < 0.35) {
        const x = w();
        words.push(x);
        return `addWord ${x}`;
      }
      const base = g.r() < 0.5 ? g.pick(words) : w();
      return `search ${[...base].map((c) => (g.r() < 0.4 ? "." : c)).join("")}`;
    });
    return { calls };
  },
  big: {
    label: "200 words, then 200 searches with a dot",
    input: () => {
      const g = rngFor(7);
      const w = () => Array.from({ length: 5 }, () => g.pick([..."abcd"])).join("");
      return {
        calls: [
          ...Array.from({ length: 200 }, () => `addWord ${w()}`),
          ...Array.from({ length: 200 }, () => {
            const x = [...w()];
            x[g.int(0, 4)] = ".";
            return `search ${x.join("")}`;
          }),
        ],
      };
    },
  },
  describe: ({ calls }) => calls.join(", "),
  run,
  solve: (input) => slow(input).answer,
  brute: slow,
  bruteIdea: "Keep a plain list of words and compare the pattern with each one, letter by letter: O(n · L) for every search.",
  guide: {
    title: "Design Add and Search Words Data Structure",
    idea: [
      "addWord is a normal trie insert. search is a normal trie walk until it meets a dot. A dot could be any letter, so try each child of the current node and continue the search from there, returning true as soon as one branch matches.",
      "That's a depth-first search over the trie: an index into the pattern and a trie node. It backs up when a letter has no child, or when the pattern ends at a node that isn't a word end.",
    ],
    whenToUse: ["Trie lookups with wildcards: one-letter wildcards branch over the children.", "Any “match against many stored strings” question where the strings share prefixes."],
    stages: [
      { id: "start", title: "An empty trie", detail: "", pseudo: "self.root = TrieNode()" },
      { id: "add", title: "addWord: a normal insert", detail: "", pseudo: "for c in word: cur = cur.children.setdefault(c, TrieNode())" },
      { id: "walk", title: "A letter: follow that child", detail: "", pseudo: "if c not in cur.children: return False" },
      { id: "dot", title: "A dot: try every child", detail: "", pseudo: "for child in cur.children.values(): if dfs(i + 1, child): return True" },
      { id: "back", title: "Dead end: back up", detail: "", pseudo: "return False" },
      { id: "found", title: "Pattern used up at a word end", detail: "", pseudo: "return cur.end" },
      { id: "answer", title: "Nothing matched", detail: "", pseudo: "return False" },
      { id: "done", title: "All calls answered", detail: "", pseudo: "" },
    ],
    legend: [
      { tone: "current", label: "Current node" },
      { tone: "pointer", label: "Path being tried" },
      { tone: "visited", label: "Tried already" },
      { tone: "swap", label: "Dead end" },
      { tone: "found", label: "Match / node just added" },
    ],
    complexity: { time: "O(L) without dots; O(26^d · L) worst case with d dots", space: "O(total letters)", why: "Each letter follows one child; each dot may branch over every child of its node." },
    pitfalls: ["A matching path isn't enough: the last node must be a word end (“b..” needs a three-letter word starting with b).", "Return true as soon as any branch matches; only return false after trying them all."],
    tryThis: ["In “a dot that backs up”, ..t tries c → a → t and succeeds, but c.d tries both “a” and “o” after c before giving up.", "Press “Random” and count how many branches each dot opens."],
    python: py,
  },
};
